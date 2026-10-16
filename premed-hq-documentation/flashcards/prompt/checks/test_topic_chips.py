"""Actual package rendering keeps one F2 chip in the label row and no new fields."""
import tempfile
import unittest
from pathlib import Path
from test_updates import fixture, build, import_package
from anki.collection import Collection
from build_deck import topic_reveals_answer, validate
from image_occlusion import native_model


class TopicChipChecks(unittest.TestCase):
    def test_basic_and_cloze_render_short_chip_in_label_row_on_both_faces(self):
        for cloze in (False, True):
            with self.subTest(cloze=cloze), tempfile.TemporaryDirectory() as temp:
                data=fixture(1)
                title='Structure › Outlines'
                data['targets'][0]['topic']='Study objective: Explain the structure of a shape'
                data['notebookTitles']=['Outlines and edges']
                data['cards'][0]['breadcrumb']=title
                if cloze:
                    data['cards'][0].update(type='cloze',front='',back='',clozePattern='single',cloze='A sample shape has {{c1::an outline}}.')
                out=Path(temp)/'chip.apkg';build(data,out)
                col=Collection(str(Path(temp)/'test.anki2'))
                try:
                    import_package(col,out)
                    card=col.get_card(col.find_cards('')[0])
                    for face in (card.question(),card.answer()):
                        self.assertIn('<div class="type card-meta"><span class="verb">recall</span><span class="topic-chip">'+title+'</span></div>',face)
                        self.assertNotIn('class="topic"',face)
                finally:col.close()

    def test_answer_cue_marker_preserves_exact_title_and_both_grouped_names(self):
        data=fixture(1);card=data['cards'][0]
        title='Study objective: Explain intrinsic and extrinsic motivation and overjustification'
        data['targets'][0]['topic']=title
        chip='Intrinsic extrinsic motivation'
        card['breadcrumb']=chip
        card.update(type='cloze',front='',back='',clozePattern='single',
            cloze='Doing an activity for enjoyment is {{c1::intrinsic}} motivation; doing it for reward is {{c1::extrinsic}} motivation.')
        self.assertTrue(topic_reveals_answer(title,card))
        self.assertFalse(topic_reveals_answer('An unrelated objective',card))
        with tempfile.TemporaryDirectory() as temp:
            out=Path(temp)/'names.apkg';build(data,out)
            col=Collection(str(Path(temp)/'test.anki2'))
            try:
                import_package(col,out)
                actual=col.get_card(col.find_cards('')[0])
                self.assertIn('pm-question',actual.question())
                self.assertNotIn('class="pm pm-question',actual.answer())
                self.assertIn('<span class="topic-answer-cue" hidden></span><span class="topic-chip">'+chip,actual.question())
                self.assertIn(chip,actual.answer())
                self.assertIn('.pm-question .topic-answer-cue + .topic-chip { display: none; }',actual.css())
                self.assertEqual(actual.question().count('data-ordinal="1"'),2)
            finally:col.close()

    def test_native_occlusion_also_uses_inline_f2_header_without_field_change(self):
        model=native_model('')
        self.assertEqual(len(model.fields),11)
        for key in ('qfmt','afmt'):
            face=model.templates[0][key]
            self.assertIn('<div class="type card-meta"><span class="verb">recall</span>{{#Topic}}<span class="topic-chip">{{Topic}}</span>{{/Topic}}</div>',face)
            self.assertNotIn('class="topic"',face)

    def chip_fixture(self, label, objective='Explain receptor activity and signaling'):
        data=fixture(1)
        data['targets'][0]['topic']=objective
        data['cards'][0]['breadcrumb']=label
        return data

    def provenance_warnings(self, data):
        return [w for w in validate(data) if 'breadcrumb' in w and 'notebook title' in w]

    def test_thirty_two_and_forty_character_labels_pass(self):
        for length in (32,40):
            with self.subTest(length=length):
                label='A'*length
                data=self.chip_fixture(label,'Describe '+label)
                validate(data)
                self.assertFalse(self.provenance_warnings(data))

    def test_forty_one_character_label_fails(self):
        label='A'*41
        data=self.chip_fixture(label,'Describe '+label)
        with self.assertRaises(ValueError):validate(data)

    def test_four_words_allowed_five_words_rejected(self):
        data=self.chip_fixture('Shape edge outline surface',
                               'Explain shape edge outline surface boundary')
        validate(data)
        data['cards'][0]['breadcrumb']='Shape edge outline surface boundary'
        with self.assertRaises(ValueError):validate(data)

    def test_short_noun_phrase_may_use_words_from_full_title(self):
        data=self.chip_fixture('Receptor activity',
                               'Predict the effects of altered receptor activity')
        self.assertFalse(self.provenance_warnings(data))

    def test_invented_noun_phrase_word_is_only_advisory(self):
        data=self.chip_fixture('Receptor wizardry')
        self.assertTrue(self.provenance_warnings(data))
        self.assertEqual(data['targets'][0]['topic'],'Explain receptor activity and signaling')

    def test_each_segment_must_come_from_one_actual_title(self):
        data=self.chip_fixture('Receptor outline','Explain receptor activity')
        data['notebookTitles']=['Shape outline']
        self.assertTrue(self.provenance_warnings(data))
        data['cards'][0]['breadcrumb']='Receptor › Outline'
        self.assertFalse(self.provenance_warnings(data))

    def test_two_segments_allowed_three_rejected(self):
        data=self.chip_fixture('Receptor › Signaling')
        self.assertFalse(self.provenance_warnings(data))
        data['cards'][0]['breadcrumb']='Receptor › Activity › Signaling'
        with self.assertRaises(ValueError):validate(data)

    def test_long_fallback_title_must_not_be_silently_truncated(self):
        objective='Explain how altered receptor activity changes signaling and cell survival'
        data=self.chip_fixture('',objective)
        with self.assertRaises(ValueError):validate(data)
        self.assertEqual(data['targets'][0]['topic'],objective)

    def test_objective_verb_phrase_gets_advisory(self):
        for label,objective in [('Explain receptor signaling','Explain receptor signaling'),
                                ('Study objective','Study objective: Explain receptor signaling')]:
            with self.subTest(label=label):
                warnings=validate(self.chip_fixture(label,objective))
                self.assertTrue(any('breadcrumb' in w and 'objective' in w for w in warnings))

    def test_css_keeps_chip_on_one_line_without_ellipsis(self):
        css=(Path(__file__).resolve().parents[1]/'card-styles.css').read_text()
        chip_rule=css.split('.topic-chip {',1)[1].split('}',1)[0]
        self.assertIn('white-space: nowrap',chip_rule)
        self.assertNotIn('text-overflow: ellipsis',chip_rule)


if __name__=='__main__':unittest.main()
