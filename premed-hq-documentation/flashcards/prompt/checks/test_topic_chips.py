"""Actual package rendering keeps one F2 chip in the label row and no new fields."""
import tempfile
import unittest
from pathlib import Path
from test_updates import fixture, build, import_package
from anki.collection import Collection
from build_deck import topic_reveals_answer
from image_occlusion import native_model


class TopicChipChecks(unittest.TestCase):
    def test_basic_and_cloze_render_exact_topic_in_label_row_on_both_faces(self):
        for cloze in (False, True):
            with self.subTest(cloze=cloze), tempfile.TemporaryDirectory() as temp:
                data=fixture(1)
                title='Study objective: Explain the structure of a shape › Outlines and edges'
                data['targets'][0]['topic']=title
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
                self.assertIn('<span class="topic-answer-cue" hidden></span><span class="topic-chip">'+title,actual.question())
                self.assertIn(title,actual.answer())
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


if __name__=='__main__':unittest.main()
