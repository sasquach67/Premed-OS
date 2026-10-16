"""Update round trips in disposable real-Anki collections; no user profile access."""
from pathlib import Path
import base64
import contextlib
import copy
import io
import json
import sys
import tempfile
import unittest
import zipfile
from unittest.mock import patch

BASE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE))
import build_deck
from read_previous import read_previous
from verify_deck import verify
from anki.collection import Collection, ImportAnkiPackageRequest, ImportAnkiPackageOptions, ExportAnkiPackageOptions


def fixture(count=2):
    data = json.loads((BASE / 'checks/cards.json').read_text())
    template = copy.deepcopy(data['cards'][0])
    data['cards'] = []
    for i in range(count):
        card = copy.deepcopy(template)
        card.update(id=f'idea-{i}', conceptId='sample-shape', targetIds=['sample-shape'],
                    front='Sample shape' if i == 0 else f'Why does sample variation {i} matter?',
                    back='A shape describes the outline of an object.' if i == 0 else f'Variation {i} changes a distinct property.',
                    type='basic' if i == 0 else 'conceptual',
                    reinforcementReason='' if i == 0 else 'Explains a distinct condition.')
        data['cards'].append(card)
    data['targets'] = [{'id': 'sample-shape', 'topic': 'Synthetic',
                        'statement': 'Define and explain sample shape.', 'kind': 'understand',
                        'core': True, 'coverage': 'tested',
                        'cardIds': [card['id'] for card in data['cards']], 'reason': ''}]
    return data


def build(data, out, previous=None):
    with contextlib.redirect_stdout(io.StringIO()):
        return build_deck.build(data, out, out.parent, previous)


def import_package(col, apkg):
    return col.import_anki_package(ImportAnkiPackageRequest(
        package_path=str(apkg.resolve()), options=ImportAnkiPackageOptions(
            update_notes=1, update_notetypes=1, with_scheduling=False,
            with_deck_configs=False, merge_notetypes=False)))


class UpdateChecks(unittest.TestCase):
    def test_reader_round_trips_identity_fields_tags_ordinals_and_media(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp)
            data = fixture(1)
            report = build(data, work / 'v1.apkg')
            previous = read_previous(work / 'v1.apkg', work / 'media')
            self.assertEqual(previous['deckKey'], data['deckKey'])
            self.assertEqual(previous['deckName'], data['deckName'])
            self.assertEqual(previous['reviewCards'], 1)
            row = previous['notes'][0]
            self.assertEqual(row['guid'], report['records'][0]['guid'])
            self.assertEqual(dict(zip(row['fieldNames'], row['fields'])), report['records'][0]['fields'])
            self.assertEqual(row['ords'], [0])
            self.assertIn('premedos::type::basic', row['tags'])
            self.assertGreater(row['mod'], 0)

    def test_update_preserves_review_history_ids_retired_fields_and_media(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp)
            data = fixture()
            raw = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=')
            (work / 'figure.png').write_bytes(raw)
            data['cards'][1]['extraImages'] = [{'file': 'figure.png', 'alt': 'Synthetic dot',
                                               'source': copy.deepcopy(data['cards'][1]['sourceRefs'][0])}]
            initial = build(data, work / 'v1.apkg')
            updated = copy.deepcopy(data)
            updated['cards'][0].update(reuseGuid=initial['records'][0]['guid'],
                                       back='A shape is the outline around an object.')
            updated['cards'][1].update(id='new-variation', front='Why does a new sample condition matter?',
                                       back='The new condition changes how the outline is measured.', extraImages=[])
            updated['targets'][0]['cardIds'] = [c['id'] for c in updated['cards']]
            final = build(updated, work / 'v2.apkg', work / 'v1.apkg')
            self.assertEqual((final['activeNotes'], final['retiredNotes'], final['notes']), (2, 1, 3))
            (work / 'cards.json').write_text(json.dumps(updated))
            with contextlib.redirect_stdout(io.StringIO()):
                verified = verify(work / 'v2.apkg', work / 'v2.build-report.json',
                                  work / 'cards.json', work / 'v1.apkg')
            self.assertTrue(verified['passed'])
            collection = Collection(str(work / 'history.anki2'))
            try:
                import_package(collection, work / 'v1.apkg')
                nid = collection.db.scalar('select id from notes where guid=?', initial['records'][0]['guid'])
                cid = collection.find_cards('nid:' + str(nid))[0]
                card = collection.get_card(cid)
                card.type = 2; card.queue = 2; card.reps = 7; card.ivl = 10
                card.due = 123; card.factor = 2500; card.lapses = 1
                collection.update_card(card)
                collection.db.execute('insert into revlog values (?,?,?,?,?,?,?,?,?)',
                                      1700000000000, cid, -1, 3, 10, 5, 2500, 1200, 1)
                before = collection.db.all('select * from revlog where cid=?', cid)
                import_package(collection, work / 'v2.apkg')
                self.assertEqual(len(collection.find_notes('')), 3)
                self.assertEqual(collection.db.scalar('select id from notes where guid=?', initial['records'][0]['guid']), nid)
                self.assertEqual(collection.find_cards('nid:' + str(nid)), [cid])
                self.assertEqual(collection.get_note(nid)['Back'], updated['cards'][0]['back'])
                after = collection.get_card(cid)
                self.assertEqual((after.type, after.queue, after.reps, after.ivl, after.due, after.factor, after.lapses),
                                 (2, 2, 7, 10, 123, 2500, 1))
                self.assertEqual(collection.db.all('select * from revlog where cid=?', cid), before)
                retired = collection.find_notes('tag:premedos::retired')
                self.assertEqual(len(retired), 1)
                old = collection.get_note(retired[0])
                self.assertEqual(old.guid, initial['records'][1]['guid'])
                self.assertEqual(dict(old.items()), initial['records'][1]['fields'])
                for media in initial['media']:
                    self.assertEqual((Path(collection.media.dir()) / media).read_bytes(), raw)
                self.assertEqual(list(collection.media.check().missing), [])
            finally:
                collection.close()

    def test_css_and_template_update_uses_same_note_type_without_duplicates(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp); data = fixture(1)
            first = build(data, work / 'v1.apkg')
            data['cards'][0]['reuseGuid'] = first['records'][0]['guid']
            css = build_deck.CSS + '\n.card { line-height: 1.73; }'
            template = build_deck.BASIC_Q + '\n<!-- template update regression -->'
            original_ids = [model.model_id for model in build_deck.create_models()]
            with patch.object(build_deck, 'CSS', css), patch.object(build_deck, 'BASIC_Q', template):
                self.assertEqual([model.model_id for model in build_deck.create_models()], original_ids)
                build(data, work / 'v2.apkg', work / 'v1.apkg')
            path = work / 'style.anki2'; collection = Collection(str(path))
            try:
                import_package(collection, work / 'v1.apkg')
                ids_before = {m['id'] for m in collection.models.all()}
                import_package(collection, work / 'v2.apkg')
            finally:
                collection.close()
            # The importer invalidates backend models but not Python's model cache.
            collection = Collection(str(path))
            try:
                self.assertEqual({m['id'] for m in collection.models.all()}, ids_before)
                self.assertEqual(len(collection.find_notes('')), 1)
                note = collection.get_note(collection.find_notes('')[0])
                model = collection.models.get(note.mid)
                self.assertEqual(model['css'], css)
                self.assertEqual(model['tmpls'][0]['qfmt'], template)
            finally:
                collection.close()

    def test_unknown_or_duplicate_reuse_guid_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp); data = fixture()
            report = build(data, work / 'v1.apkg')
            data['cards'][0]['reuseGuid'] = 'unknown-guid'
            with self.assertRaisesRegex(ValueError, 'not found'):
                build(data, work / 'unknown.apkg', work / 'v1.apkg')
            for card in data['cards']:
                card['reuseGuid'] = report['records'][0]['guid']
            with self.assertRaisesRegex(ValueError, '[Dd]uplicate|one GUID for two'):
                build(data, work / 'duplicate.apkg', work / 'v1.apkg')

    def test_modern_anki_export_keeps_identity_without_custom_zip_metadata(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp); data = fixture(1)
            initial = build(data, work / 'v1.apkg')
            collection = Collection(str(work / 'export.anki2'))
            try:
                import_package(collection, work / 'v1.apkg')
                collection.export_anki_package(out_path=str(work / 'exported.apkg'), limit=None,
                    options=ExportAnkiPackageOptions(with_scheduling=True, with_media=True, legacy=False))
            finally:
                collection.close()
            with zipfile.ZipFile(work / 'exported.apkg') as archive:
                self.assertNotIn('premedos-update.json', archive.namelist())
                self.assertIn('collection.anki21b', archive.namelist())
            exported = read_previous(work / 'exported.apkg')
            self.assertEqual(exported['deckKey'], data['deckKey'])
            self.assertEqual(exported['notes'][0]['guid'], initial['records'][0]['guid'])
            data['cards'][0]['reuseGuid'] = initial['records'][0]['guid']
            result = build(data, work / 'updated.apkg', work / 'exported.apkg')
            self.assertEqual((result['notes'], result['retiredNotes']), (1, 0))
            (work / 'cards.json').write_text(json.dumps(data))
            with contextlib.redirect_stdout(io.StringIO()):
                verified = verify(work / 'updated.apkg', work / 'updated.build-report.json',
                                  work / 'cards.json', work / 'exported.apkg')
            self.assertTrue(verified['passed'])

    def test_legacy_note_type_requires_explicit_one_time_migration(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp); data = fixture(1)
            create_models = build_deck.create_models
            def legacy_models():
                models = create_models()
                for model in models:
                    model.model_id += 173
                return models
            with patch.object(build_deck, 'create_models', legacy_models):
                report = build(data, work / 'legacy.apkg')
            data['cards'][0]['reuseGuid'] = report['records'][0]['guid']
            with self.assertRaisesRegex(ValueError, 'one-time migration'):
                build(data, work / 'updated.apkg', work / 'legacy.apkg')

    def test_update_requires_the_same_deck_key(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp); data = fixture(1)
            report = build(data, work / 'v1.apkg')
            data['cards'][0]['reuseGuid'] = report['records'][0]['guid']
            data['deckKey'] = 'another-lecture'
            with self.assertRaisesRegex(ValueError, 'deckKey and deckName'):
                build(data, work / 'updated.apkg', work / 'v1.apkg')

    def test_exported_student_tags_and_two_cloze_card_histories_survive_update(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp); data = fixture(1)
            data['cards'][0].update(type='cloze', front='', back='', clozePattern='independent',
                                   cloze='{{c1::Sample shape}} is {{c2::the outline of an object}}.',
                                   tags=['objective::old'])
            first = build(data, work / 'v1.apkg')
            collection = Collection(str(work / 'student.anki2'))
            try:
                import_package(collection, work / 'v1.apkg')
                nid = collection.find_notes('')[0]
                note = collection.get_note(nid)
                note.tags.extend(['student::keep', 'premedos::type::obsolete',
                                  'premedos::mindset::obsolete', 'premedos::concept::obsolete'])
                note['Extra'] = 'A student-added reminder from an exported current deck.'
                collection.update_note(note)
                histories = {}
                for cid in collection.find_cards('nid:' + str(nid)):
                    card = collection.get_card(cid)
                    card.type = 2; card.queue = 2; card.reps = 3 + card.ord
                    card.ivl = 7 + card.ord; card.due = 100 + card.ord
                    collection.update_card(card)
                    histories[card.ord] = (card.id, card.reps, card.ivl, card.due)
                collection.export_anki_package(out_path=str(work / 'current.apkg'), limit=None,
                    options=ExportAnkiPackageOptions(with_scheduling=True, with_media=True, legacy=False))
                snapshot = read_previous(work / 'current.apkg')
                self.assertIn('student::keep', snapshot['notes'][0]['tags'])
                self.assertIn('student-added reminder', dict(zip(snapshot['notes'][0]['fieldNames'], snapshot['notes'][0]['fields']))['Extra'])
                data['cards'][0].update(reuseGuid=first['records'][0]['guid'], tags=['objective::new'],
                                       cloze='{{c1::Sample shape}} is {{c2::an object’s outline}}.')
                build(data, work / 'v2.apkg', work / 'current.apkg')
                import_package(collection, work / 'v2.apkg')
                self.assertEqual(collection.find_notes(''), [nid])
                note = collection.get_note(nid)
                self.assertIn('an object’s outline', note['Text'])
                self.assertIn('student::keep', note.tags)
                self.assertIn('objective::new', note.tags)
                self.assertNotIn('objective::old', note.tags)
                self.assertFalse(any(tag.endswith('::obsolete') for tag in note.tags))
                after = {collection.get_card(cid).ord: (cid, collection.get_card(cid).reps,
                         collection.get_card(cid).ivl, collection.get_card(cid).due)
                         for cid in collection.find_cards('nid:' + str(nid))}
                self.assertEqual(after, histories)
            finally:
                collection.close()

    def test_reuse_requires_previous_and_unchanged_note_type(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp); data = fixture(1)
            report = build(data, work / 'v1.apkg')
            data['cards'][0]['reuseGuid'] = report['records'][0]['guid']
            with self.assertRaisesRegex(ValueError, 'requires --previous'):
                build(data, work / 'no-previous.apkg')
            data['cards'][0].update(type='cloze', front='', back='', clozePattern='single',
                                   cloze='A shape is {{c1::the outline of an object}}.')
            with self.assertRaisesRegex(ValueError, 'note type and cloze numbers'):
                build(data, work / 'wrong-type.apkg', work / 'v1.apkg')

    def test_reuse_rejects_changed_cloze_ordinals(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp); data = fixture(1)
            data['cards'][0].update(type='cloze', front='', back='', clozePattern='independent',
                                   cloze='{{c1::Sample shape}} is {{c2::the outline of an object}}.')
            report = build(data, work / 'v1.apkg')
            data['cards'][0].update(reuseGuid=report['records'][0]['guid'], clozePattern='single',
                                   cloze='Sample shape is {{c1::the outline of an object}}.')
            with self.assertRaisesRegex(ValueError, 'note type and cloze numbers'):
                build(data, work / 'changed-cloze.apkg', work / 'v1.apkg')

    def test_reader_never_overwrites_existing_media(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp); build(fixture(1), work / 'v1.apkg')
            media = work / 'media'; media.mkdir(); (media / 'keep').write_text('unchanged')
            with self.assertRaisesRegex(ValueError, 'empty media destination'):
                read_previous(work / 'v1.apkg', media)
            self.assertEqual((media / 'keep').read_text(), 'unchanged')


if __name__ == '__main__':
    unittest.main()
