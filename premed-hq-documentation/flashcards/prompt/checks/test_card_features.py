"""Card feature and schema-upgrade checks in disposable real-Anki collections."""
from pathlib import Path
import contextlib
import copy
import io
import json
import tempfile
import unittest
from unittest.mock import patch

from test_updates import BASE, fixture, build
import build_deck
from image_occlusion import IO_FIELDS, native_model
from anki.collection import Collection, ImportAnkiPackageRequest, ImportAnkiPackageOptions, ExportAnkiPackageOptions
import genanki


def import_package(col, package):
    return col.import_anki_package(ImportAnkiPackageRequest(
        package_path=str(package.resolve()), options=ImportAnkiPackageOptions(
            update_notes=1, update_notetypes=1, with_scheduling=False,
            with_deck_configs=False, merge_notetypes=True)))


def export_current(col, path):
    col.export_anki_package(out_path=str(path), limit=None,
        options=ExportAnkiPackageOptions(with_scheduling=True, with_media=True, legacy=False))


def as_cloze(data):
    data['cards'][0].update(type='cloze', front='', back='', clozePattern='independent',
        cloze='{{c1::Sample shape}} is {{c2::the outline of an object}}.')
    return data


class CardFeatureChecks(unittest.TestCase):
    def test_final_field_order_and_permanent_ids_do_not_follow_css(self):
        basic, cloze = build_deck.create_models()[:2]
        self.assertEqual([f['name'] for f in basic.fields],
            ['Front','Back','Extra','Type','Mindset','premedos_concept_id','premedos_source','premedos_spec','Topic','Source','My notes'])
        self.assertEqual([f['name'] for f in cloze.fields],
            ['Text','Extra','Type','Mindset','premedos_concept_id','premedos_source','premedos_spec','Topic','Source','My notes'])
        self.assertEqual([f['name'] for f in native_model(build_deck.CSS).fields],
            ['Occlusion','Image','Header','Back Extra','Comments','Topic','Source','My notes',
             'premedos_concept_id','premedos_source','premedos_spec'])
        self.assertEqual([basic.model_id, cloze.model_id, native_model(build_deck.CSS).model_id],
            [646888316168, 623388404634, 895232792405])
        before = [m.model_id for m in build_deck.create_models()]
        with patch.object(build_deck, 'CSS', build_deck.CSS + '\n.card { line-height: 1.7; }'):
            self.assertEqual([m.model_id for m in build_deck.create_models()], before)
        self.assertEqual(native_model('different CSS').model_id, native_model(build_deck.CSS).model_id)

    def test_breadcrumb_source_and_empty_personal_notes_render(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp); data = fixture(1)
            data['cards'][0]['breadcrumb'] = 'Shapes › Outlines'
            data['cards'][0]['sourceRefs'][0]['location'] = 'Slide 14 · Transcript 12:31'
            build(data, work / 'explicit.apkg')
            col = Collection(str(work / 'render.anki2'))
            try:
                import_package(col, work / 'explicit.apkg')
                note = col.get_note(col.find_notes('')[0]); card = col.get_card(col.find_cards('')[0])
                self.assertEqual(note['Topic'], 'Shapes › Outlines')
                self.assertEqual(note['Source'], 'Slide 14 · Transcript 12:31')
                self.assertIn('Shapes › Outlines', card.question()); self.assertIn('Shapes › Outlines', card.answer())
                for face in (card.question(), card.answer()):
                    self.assertNotIn('<details class="source">', face)
                    self.assertNotIn('Slide 14 · Transcript 12:31', face)
                self.assertEqual(note['My notes'], '')
                self.assertNotIn('<div class="my-notes">', card.answer())
            finally: col.close()
            data['cards'][0]['breadcrumb'] = ''
            report = build(data, work / 'fallback.apkg')
            self.assertEqual(report['records'][0]['fields']['Topic'], data['targets'][0]['topic'])

    def test_source_toggle_removal_updates_all_templates_without_changing_notes(self):
        for kind in ('basic', 'cloze', 'image-occlusion'):
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as temp:
                work=Path(temp); data=as_cloze(fixture(1)) if kind=='cloze' else fixture(1)
                if kind=='image-occlusion':
                    (work/'figure.png').write_bytes((BASE/'checks/fixture.png').read_bytes())
                    data['cards'][0].update(type=kind,front='Which label is hidden?',back='Sample shape',
                        imageOcclusion={'file':'figure.png','alt':'Synthetic figure',
                            'source':copy.deepcopy(data['cards'][0]['sourceRefs'][0]),
                            'box':{'x':0.1,'y':0.1,'width':0.2,'height':0.1}})
                locator='Source metadata only: slide 14'
                data['cards'][0]['sourceRefs'][0]['location']=locator
                old_models=build_deck.all_models()
                for model in old_models:
                    for template in model.templates:
                        template['afmt']+='{{#Source}}<details class="source"><summary>Source</summary>{{Source}}</details>{{/Source}}'
                with patch.object(build_deck,'all_models',return_value=old_models):
                    first=build(data,work/'old-source-toggle.apkg')
                col=Collection(str(work/'source-removal.anki2'))
                try:
                    import_package(col,work/'old-source-toggle.apkg')
                    nid=col.find_notes('')[0]; before={}
                    for cid in col.find_cards(''):
                        card=col.get_card(cid)
                        self.assertIn('<details class="source">',card.answer())
                        card.type=2;card.queue=2;card.reps=8;card.ivl=17;card.due=345;col.update_card(card)
                        before[cid]=(card.reps,card.ivl,card.due)
                    note=col.get_note(nid);mid=note.mid;field_names=list(note.keys())
                    note['My notes']='<b>Student reminder stays</b>';col.update_note(note)
                    export_current(col,work/'current.apkg')
                    data['cards'][0]['reuseGuid']=first['records'][0]['guid']
                    build(data,work/'without-toggle.apkg',work/'current.apkg')
                    import_package(col,work/'without-toggle.apkg');col.models._cache.clear()
                    self.assertEqual(col.find_notes(''),[nid])
                    note=col.get_note(nid)
                    self.assertEqual(note.mid,mid);self.assertEqual(list(note.keys()),field_names)
                    self.assertEqual(note['Source'],locator)
                    self.assertEqual(note['My notes'],'<b>Student reminder stays</b>')
                    self.assertEqual({cid:(col.get_card(cid).reps,col.get_card(cid).ivl,col.get_card(cid).due)
                        for cid in col.find_cards('')},before)
                    for cid in col.find_cards(''):
                        card=col.get_card(cid)
                        for face in (card.question(),card.answer()):
                            self.assertNotIn('<details class="source">',face)
                            self.assertNotIn(locator,face)
                        self.assertIn('Student reminder stays',card.answer())
                finally:col.close()

    def test_exported_personal_notes_html_survives_update_by_guid(self):
        for cloze in (False, True):
            with self.subTest(cloze=cloze), tempfile.TemporaryDirectory() as temp:
                work = Path(temp); data = as_cloze(fixture(1)) if cloze else fixture(1)
                first = build(data, work / 'v1.apkg'); col = Collection(str(work / 'student.anki2'))
                try:
                    import_package(col, work / 'v1.apkg')
                    nid = col.find_notes('')[0]; note = col.get_note(nid)
                    personal = '<b>Personal reminder</b><br>Keep &amp; compare this example.'
                    note['My notes'] = personal; col.update_note(note)
                    export_current(col, work / 'current.apkg')
                    data['cards'][0]['reuseGuid'] = first['records'][0]['guid']
                    if cloze: data['cards'][0]['cloze'] = '{{c1::Sample shape}} is {{c2::an object’s outline}}.'
                    else: data['cards'][0]['back'] = 'A shape is the outline around an object.'
                    report = build(data, work / 'v2.apkg', work / 'current.apkg')
                    self.assertEqual(report['records'][0]['fields']['My notes'], personal)
                    import_package(col, work / 'v2.apkg')
                    self.assertEqual(col.find_notes(''), [nid]); self.assertEqual(col.get_note(nid)['My notes'], personal)
                    self.assertIn(personal, col.get_card(col.find_cards('')[0]).answer())
                finally: col.close()

    def test_released_schema_appends_fields_without_losing_history(self):
        for cloze in (False, True):
            with self.subTest(cloze=cloze), tempfile.TemporaryDirectory() as temp:
                work = Path(temp); data = as_cloze(fixture(1)) if cloze else fixture(1)
                first = build(data, work / 'reference.apkg')
                source_model = build_deck.create_models()[int(cloze)]
                fields = [f for f in copy.deepcopy(source_model.fields) if f['name'] not in ['Topic','Source','My notes']]
                template = {'name': 'Cloze' if cloze else 'Basic',
                    'qfmt': '{{cloze:Text}}' if cloze else '{{Front}}',
                    'afmt': '{{cloze:Text}}' if cloze else '{{Back}}'}
                model = genanki.Model(source_model.model_id, source_model.name, fields=fields,
                    templates=[template], css='/* released pre-feature schema */', model_type=source_model.model_type)
                guid = first['records'][0]['guid']; values = first['records'][0]['fields']
                deck = genanki.Deck(build_deck.stable_id('deck:' + data['deckName']), data['deckName'])
                deck.add_note(genanki.Note(model=model, guid=guid, fields=[values[f['name']] for f in fields]))
                genanki.Package(deck).write_to_file(str(work / 'released.apkg'))
                col = Collection(str(work / 'upgrade.anki2'))
                try:
                    import_package(col, work / 'released.apkg')
                    nid = col.find_notes('')[0]; before = {}
                    for cid in col.find_cards(''):
                        card = col.get_card(cid); card.type=2; card.queue=2; card.reps=7+card.ord
                        card.ivl=19+card.ord; card.due=222+card.ord; col.update_card(card)
                        col.db.execute('insert into revlog values (?,?,?,?,?,?,?,?,?)',
                            1700000000000+card.ord,cid,-1,3,19,10,2500,2000,1)
                        before[cid] = (card.reps,card.ivl,card.due)
                    logs = col.db.all('select * from revlog order by id')
                    export_current(col, work / 'current.apkg')
                    retired_data=copy.deepcopy(data)
                    retired_data['cards'][0]['id']='replacement-for-retired-schema'
                    retired_data['targets'][0]['cardIds']=['replacement-for-retired-schema']
                    retired_report=build(retired_data,work/'retire-old-schema.apkg',work/'current.apkg')
                    retired=next(row for row in retired_report['records'] if row['status']=='retired')
                    self.assertEqual(retired['guid'],guid)
                    for field in fields:self.assertEqual(retired['fields'][field['name']],values[field['name']])
                    self.assertEqual(retired['fields']['My notes'],'')
                    (work/'retired-cards.json').write_text(json.dumps(retired_data))
                    from verify_deck import verify
                    with contextlib.redirect_stdout(io.StringIO()):
                        verified=verify(work/'retire-old-schema.apkg',work/'retire-old-schema.build-report.json',work/'retired-cards.json',work/'current.apkg')
                    self.assertTrue(verified['passed'])
                    data['cards'][0]['reuseGuid'] = guid
                    data['cards'][0]['breadcrumb'] = 'Upgrade › Preserved history'
                    if cloze: data['cards'][0]['cloze'] = '{{c1::Sample shape}} is {{c2::an object’s outline}}.'
                    else: data['cards'][0]['back'] = 'An updated answer with the same meaning.'
                    build(data, work / 'v2.apkg', work / 'current.apkg')
                    result=import_package(col, work / 'v2.apkg'); col.models._cache.clear()
                    self.assertEqual(col.find_notes(''), [nid])
                    note = col.get_note(nid)
                    self.assertEqual(note.mid, source_model.model_id)
                    self.assertEqual(note['Topic'], 'Upgrade › Preserved history', str(result))
                    self.assertEqual(note['My notes'], '')
                    after = {cid:(col.get_card(cid).reps,col.get_card(cid).ivl,col.get_card(cid).due) for cid in col.find_cards('')}
                    self.assertEqual(before, after); self.assertEqual(logs,col.db.all('select * from revlog order by id'))
                    self.assertIn('outline' if cloze else 'updated answer', note['Text'] if cloze else note['Back'])
                finally: col.close()

    def test_list_template_preserves_all_blanks_without_javascript(self):
        with tempfile.TemporaryDirectory() as temp:
            work=Path(temp); data=fixture(1)
            data['cards'][0].update(type='cloze',front='',back='',clozePattern='enumerated-list',listOrdered=False,
                cloze='The two labels, in any order, are {{c1::red}} and {{c1::blue}}.', explanation='Red: a warm color.\nBlue: a cool color.')
            build(data,work/'list.apkg'); col=Collection(str(work/'list.anki2'))
            try:
                import_package(col,work/'list.apkg'); card=col.get_card(col.find_cards('')[0])
                self.assertIn('<script>',card.question()); self.assertIn('[...]',card.question())
                self.assertIn('red',card.answer()); self.assertIn('blue',card.answer())
                self.assertIn('Red: a warm color.',card.answer())
            finally:col.close()

    def test_mathjax_and_chemistry_survive_real_anki_cloze_rendering(self):
        with tempfile.TemporaryDirectory() as temp:
            work=Path(temp);data=fixture(1)
            data['cards'][0].update(type='cloze',front='',back='',clozePattern='single',
                cloze=r'Energy: \(E={{c1::mc^2}}\). Water: \(\ce{2H2 + O2 -> 2H2O}\).')
            build(data,work/'math.apkg')
            (work/'cards.json').write_text(json.dumps(data))
            from verify_deck import verify
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertTrue(verify(work/'math.apkg',work/'math.build-report.json',work/'cards.json')['passed'])
            col=Collection(str(work/'math.anki2'))
            try:
                import_package(col,work/'math.apkg');card=col.get_card(col.find_cards('')[0])
                self.assertIn(r'\(E=[...]\)',card.question());self.assertIn(r'\(E=mc^2\)',card.answer())
                self.assertIn(r'\ce{2H2 + O2 -&gt; 2H2O}',card.answer())
            finally:col.close()

    def test_native_image_occlusion_imports_one_mask_with_media_and_features(self):
        with tempfile.TemporaryDirectory() as temp:
            work=Path(temp);data=fixture(1)
            (work/'figure.png').write_bytes((BASE/'checks/fixture.png').read_bytes())
            data['cards'][0].update(type='image-occlusion',front='Which label is hidden?',back='Sample shape',
                breadcrumb='Shapes › Diagram',imageOcclusion={'file':'figure.png','alt':'Synthetic figure',
                    'source':copy.deepcopy(data['cards'][0]['sourceRefs'][0]),
                    'box':{'x':0.1,'y':0.1,'width':0.2,'height':0.1}})
            report=build(data,work/'io.apkg');self.assertEqual(report['notes'],1)
            (work/'cards.json').write_text(json.dumps(data))
            from verify_deck import verify
            with contextlib.redirect_stdout(io.StringIO()):
                verified=verify(work/'io.apkg',work/'io.build-report.json',work/'cards.json')
            self.assertTrue(verified['passed'])
            col=Collection(str(work/'io.anki2'))
            try:
                import_package(col,work/'io.apkg');self.assertEqual(len(col.find_cards('')),1)
                note=col.get_note(col.find_notes('')[0]);self.assertEqual(list(note.keys()),IO_FIELDS)
                native=col.get_image_occlusion_note(note.id)
                self.assertEqual(native.WhichOneof('value'),'note');self.assertEqual(len(native.note.occlusions),1)
                shape=native.note.occlusions[0].shapes[0];self.assertEqual(shape.shape,'rect')
                properties={item.name:item.value for item in shape.properties}
                self.assertAlmostEqual(float(properties['left']),0.1)
                self.assertEqual(list(col.media.check().missing),[])
                card=col.get_card(col.find_cards('')[0])
                self.assertIn('anki.imageOcclusion.setup()',card.question())
                self.assertIn('data-shape="rect"',card.question())
                self.assertIn('cloze-highlight',card.answer())
                self.assertIn('Shapes › Diagram',card.answer())
                self.assertTrue(note['Source'])
                for face in (card.question(),card.answer()):
                    self.assertNotIn('<details class="source">',face)
                    self.assertNotIn(note['Source'],face)
            finally:col.close()


    def test_native_occlusion_update_preserves_personal_notes_and_retirement(self):
        with tempfile.TemporaryDirectory() as temp:
            work=Path(temp);data=fixture(1)
            (work/'figure.png').write_bytes((BASE/'checks/fixture.png').read_bytes())
            data['cards'][0].update(type='image-occlusion',front='Which label is hidden?',back='Sample shape',
                imageOcclusion={'file':'figure.png','alt':'Synthetic figure',
                    'source':copy.deepcopy(data['cards'][0]['sourceRefs'][0]),
                    'box':{'x':0.1,'y':0.1,'width':0.2,'height':0.1}})
            first=build(data,work/'io-v1.apkg');col=Collection(str(work/'student-io.anki2'))
            try:
                import_package(col,work/'io-v1.apkg');nid=col.find_notes('')[0];cid=col.find_cards('')[0]
                note=col.get_note(nid);note['My notes']='<i>Personal diagram reminder</i>';col.update_note(note)
                card=col.get_card(cid);card.reps=8;card.ivl=13;card.due=500;col.update_card(card)
                export_current(col,work/'current.apkg')
                data['cards'][0].update(reuseGuid=first['records'][0]['guid'],breadcrumb='Diagram › Updated')
                build(data,work/'io-v2.apkg',work/'current.apkg');import_package(col,work/'io-v2.apkg')
                self.assertEqual(col.find_notes(''),[nid]);self.assertEqual(col.find_cards(''),[cid])
                self.assertEqual(col.get_note(nid)['My notes'],'<i>Personal diagram reminder</i>')
                self.assertEqual((col.get_card(cid).reps,col.get_card(cid).ivl,col.get_card(cid).due),(8,13,500))
                export_current(col,work/'current-v2.apkg')
                data['cards'][0].pop('reuseGuid');data['cards'][0]['id']='new-diagram-label'
                data['targets'][0]['cardIds']=['new-diagram-label']
                data['cards'][0]['imageOcclusion']['box']['x']=0.5
                report=build(data,work/'io-v3.apkg',work/'current-v2.apkg')
                self.assertEqual(report['retiredNotes'],1)
                (work/'cards-v3.json').write_text(json.dumps(data))
                from verify_deck import verify
                with contextlib.redirect_stdout(io.StringIO()):
                    verified=verify(work/'io-v3.apkg',work/'io-v3.build-report.json',work/'cards-v3.json',work/'current-v2.apkg')
                self.assertTrue(verified['passed'])
                import_package(col,work/'io-v3.apkg')
                retired=col.find_notes('tag:premedos::retired');self.assertEqual(retired,[nid])
                self.assertEqual(col.get_note(nid)['My notes'],'<i>Personal diagram reminder</i>')
                self.assertEqual(col.get_image_occlusion_note(nid).WhichOneof('value'),'note')
                self.assertEqual(list(col.media.check().missing),[])
            finally:col.close()


    def test_update_preserves_exported_nested_deck_name_and_student_history(self):
        with tempfile.TemporaryDirectory() as temp:
            work=Path(temp);data=fixture(1);first=build(data,work/'standalone.apkg')
            col=Collection(str(work/'nested-student.anki2'))
            try:
                import_package(col,work/'standalone.apkg')
                nid=col.find_notes('')[0];cid=col.find_cards('')[0]
                card=col.get_card(cid);did=card.did
                col.decks.rename(did,'UNC::Fall26::Memory')
                note=col.get_note(nid);note['My notes']='<b>Keep this student reminder</b>';col.update_note(note)
                card.type=2;card.queue=2;card.reps=9;card.ivl=17;card.due=345;col.update_card(card)
                col.db.execute('insert into revlog values (?,?,?,?,?,?,?,?,?)',1700000000000,cid,-1,3,17,10,2500,1200,1)
                history=col.db.all('select * from revlog where cid=?',cid)
                names_before={deck['name'] for deck in col.decks.all()}
                export_current(col,work/'current.apkg')
                from read_previous import read_previous
                prior=read_previous(work/'current.apkg')
                self.assertEqual(prior['deckName'],'UNC::Fall26::Memory')
                self.assertEqual(prior['deckKey'],data['deckKey'])
                data['deckName']=prior['deckName']
                data['cards'][0].update(reuseGuid=first['records'][0]['guid'],back='A shape is the outline around an object.')
                with self.assertRaisesRegex(ValueError,'standalone deck title'):
                    build_deck.validate(data)
                with self.assertRaisesRegex(ValueError,'standalone deck title'):
                    build(data,work/'new-nested.apkg')
                mismatched=copy.deepcopy(data);mismatched['deckName']='UNC::Fall26::Another lecture'
                with self.assertRaisesRegex(ValueError,'previous deckKey and deckName'):
                    build(mismatched,work/'wrong-name.apkg',work/'current.apkg')
                build(data,work/'nested-update.apkg',work/'current.apkg')
                (work/'cards.json').write_text(json.dumps(data))
                from verify_deck import verify
                with contextlib.redirect_stdout(io.StringIO()):
                    verified=verify(work/'nested-update.apkg',work/'nested-update.build-report.json',work/'cards.json',work/'current.apkg')
                self.assertTrue(verified['passed'])
                import_package(col,work/'nested-update.apkg')
                self.assertEqual(col.find_notes(''),[nid]);self.assertEqual(col.find_cards(''),[cid])
                note=col.get_note(nid);card=col.get_card(cid)
                self.assertEqual(note['Back'],data['cards'][0]['back'])
                self.assertEqual(note['My notes'],'<b>Keep this student reminder</b>')
                self.assertEqual((card.did,card.reps,card.ivl,card.due),(did,9,17,345))
                self.assertEqual(col.db.all('select * from revlog where cid=?',cid),history)
                self.assertEqual({deck['name'] for deck in col.decks.all()},names_before)
            finally:col.close()


if __name__=='__main__':unittest.main(verbosity=2)
