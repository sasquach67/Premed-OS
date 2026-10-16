"""Clarity guards and rendered Extra checks, using disposable Anki packages only."""
from pathlib import Path
import copy
import tempfile
import unittest

from test_updates import fixture, build
from build_deck import extra_text, validate
from read_previous import read_previous


class ClarityChecks(unittest.TestCase):
    def term_fixture(self):
        data = fixture(1)
        card = data['cards'][0]
        card.update(front='Sample shape', back='the outline of an object',
                    explanation='', example=None, extraImages=[], breadcrumb='Synthetic')
        card['sourceRefs'][0]['excerpt'] = 'A shape is the outline of an object.'
        target = data['targets'][0]
        target.update(statement='Term: Sample shape', reason='Meaning: the outline of an object')
        return data

    def cloze(self, data, text, pattern='single'):
        data['cards'][0].update(type='cloze', front='', back='', cloze=text,
                                clozePattern=pattern)
        return data

    def relevant(self, data, phrase):
        return [warning for warning in validate(data) if phrase in warning]

    def test_meaning_in_basic_back_is_definition_recall(self):
        validate(self.term_fixture())

    def test_genuine_basic_question_can_recall_a_definition_in_its_back(self):
        data = self.term_fixture()
        data['cards'][0]['front'] = 'What does Sample shape mean?'
        validate(data)

    def test_meaning_inside_cloze_answer_is_definition_recall(self):
        data = self.cloze(self.term_fixture(),
                          'Sample shape is {{c1::the outline of an object}}.')
        validate(data)

    def test_two_blank_definition_keeps_meaning_recall(self):
        data = self.cloze(self.term_fixture(),
                          '{{c1::Sample shape::geometry term}} is {{c2::the outline of an object}}.',
                          'independent')
        validate(data)

    def test_name_blank_with_visible_meaning_is_not_definition_recall(self):
        data = self.cloze(self.term_fixture(),
                          '{{c1::Sample shape}} is the outline of an object.')
        with self.assertRaisesRegex(ValueError, 'term has no definition-recall card'):
            validate(data)

    def test_meaning_inside_hint_does_not_count(self):
        data = self.cloze(self.term_fixture(),
                          'This geometric term is {{c1::Sample shape::the outline of an object}}.')
        with self.assertRaisesRegex(ValueError, 'term has no definition-recall card'):
            validate(data)

    def test_meaning_only_in_extra_does_not_count(self):
        data = self.cloze(self.term_fixture(), 'The geometric term is {{c1::Sample shape}}.')
        data['cards'][0]['explanation'] = 'the outline of an object'
        with self.assertRaisesRegex(ValueError, 'term has no definition-recall card'):
            validate(data)

    def test_meaning_only_on_front_with_name_on_back_does_not_count(self):
        data = self.term_fixture()
        data['cards'][0].update(front='What is the outline of an object called?', back='Sample shape')
        with self.assertRaisesRegex(ValueError, 'term has no definition-recall card'):
            validate(data)

    def test_name_and_meaning_recall_cannot_be_split_between_unrelated_cards(self):
        data = self.cloze(self.term_fixture(),
                          '{{c1::Sample shape}} is the outline of an object.')
        anonymous = copy.deepcopy(data['cards'][0])
        anonymous.update(id='anonymous-meaning',
                         cloze='The relevant property is {{c1::the outline of an object}}.',
                         reinforcementReason='A different presentation of the linked target.')
        data['cards'].append(anonymous)
        data['targets'][0]['cardIds'].append(anonymous['id'])
        with self.assertRaisesRegex(ValueError, 'term has no definition-recall card'):
            validate(data)

    def test_shared_index_contrast_recalls_both_meanings(self):
        data = self.cloze(self.term_fixture(),
                          'Round shapes are {{c1::outlines without corners}}; '
                          'angular shapes are {{c1::outlines with corners}}.')
        card = data['cards'][0]
        first = data['targets'][0]
        first.update(id='round', statement='Term: Round shapes',
                     reason='Meaning: outlines without corners')
        second = copy.deepcopy(first)
        second.update(id='angular', statement='Term: angular shapes',
                      reason='Meaning: outlines with corners')
        data['targets'] = [first, second]
        card['targetIds'] = ['round', 'angular']
        validate(data)

    def test_short_visible_context_warns_without_rejecting_card(self):
        data = fixture(1)
        self.cloze(data, 'Signal: {{c1::on}}.')
        self.assertTrue(self.relevant(data, 'context-poor cloze'))

    def test_four_visible_words_do_not_trigger_short_context_warning(self):
        data = fixture(1)
        self.cloze(data, 'The named process is {{c1::encoding}}.')
        self.assertFalse(self.relevant(data, 'context-poor cloze'))

    def test_context_is_measured_per_active_index(self):
        data = fixture(1)
        self.cloze(data, 'The {{c1::memory model}} explains '
                        '{{c2::how information is encoded and retrieved}}.', 'independent')
        self.assertFalse(self.relevant(data, 'context-poor cloze'))

    def test_abstract_estimate_without_named_context_warns_despite_enough_words(self):
        data = fixture(1)
        self.cloze(data, 'With strategies controlled, the estimate is {{c1::4 ± 1}}.')
        self.assertTrue(self.relevant(data, 'context-poor cloze'))

    def test_context_warning_does_not_prevent_real_package_build(self):
        data = fixture(1)
        self.cloze(data, 'Signal: {{c1::on}}.')
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / 'warning.apkg'
            report = build(data, output)
            self.assertTrue(output.is_file())
            self.assertTrue(any('context-poor cloze' in warning for warning in report['warnings']))

    def test_available_example_markers_in_linked_excerpt_warn_for_empty_extra(self):
        for excerpt in ['An example is a traced coin.',
                        'A familiar shape, e.g. a circular coin.',
                        'For instance, a coin has a circular outline.']:
            with self.subTest(excerpt=excerpt):
                data = self.term_fixture()
                data['cards'][0]['sourceRefs'][0]['excerpt'] = excerpt
                self.assertTrue(self.relevant(data, 'definition is missing an available example'))

    def test_example_markers_in_linked_target_statement_or_reason_warn(self):
        for field in ['statement', 'reason']:
            with self.subTest(field=field):
                data = fixture(1)
                data['cards'][0].update(explanation='', example=None, extraImages=[])
                data['cards'][0]['sourceRefs'][0]['excerpt'] = 'A shape is an object outline.'
                data['targets'][0][field] = 'For instance, a coin has a circular outline.'
                self.assertTrue(self.relevant(data, 'definition is missing an available example'))

    def test_example_warning_is_absent_when_no_example_is_available(self):
        self.assertFalse(self.relevant(self.term_fixture(),
                                       'definition is missing an available example'))

    def test_nonempty_text_or_picture_extra_suppresses_empty_extra_warning(self):
        for kind in ['text', 'picture']:
            with self.subTest(kind=kind):
                data = self.term_fixture()
                card = data['cards'][0]
                card['sourceRefs'][0]['excerpt'] = 'Example: a circular coin.'
                if kind == 'text':
                    card['explanation'] = 'A traced coin has a circular outline.'
                else:
                    card['extraImages'] = [{'file': 'coin.png', 'alt': 'A circular coin',
                                            'source': copy.deepcopy(card['sourceRefs'][0])}]
                self.assertFalse(self.relevant(data, 'definition is missing an available example'))

    def test_unlinked_source_title_does_not_supply_an_example(self):
        data = self.term_fixture()
        source = copy.deepcopy(data['sources'][0])
        source['id'] = 'unlinked-source'
        source['title'] = 'Example collection not linked to this card'
        data['sources'].append(source)
        self.assertFalse(self.relevant(data, 'definition is missing an available example'))

    def test_breadcrumb_uses_words_from_actual_notebook_titles(self):
        for breadcrumb in ['Synthetic', 'Synthetic › Shapes']:
            with self.subTest(breadcrumb=breadcrumb):
                data = self.term_fixture()
                data['notebookTitles'] = ['Shapes and their outlines']
                data['cards'][0]['breadcrumb'] = breadcrumb
                warnings = validate(data)
                self.assertFalse(any('breadcrumb' in w and 'notebook title' in w for w in warnings))

    def test_breadcrumb_invented_word_is_advisory(self):
        for breadcrumb in ['Invented › Shapes', 'Synthetic extension › Shapes']:
            with self.subTest(breadcrumb=breadcrumb):
                data = self.term_fixture()
                data['notebookTitles'] = ['Shapes and their outlines']
                data['cards'][0]['breadcrumb'] = breadcrumb
                warnings = validate(data)
                self.assertTrue(any('breadcrumb' in w and 'notebook title' in w for w in warnings))

    def test_long_objective_is_preserved_in_ledger_with_short_chip(self):
        data = self.term_fixture()
        objective = ('Explain how several cell-signaling proteins regulate growth and survival '
                     'and predict the effects of altered receptor activity')
        data['targets'][0]['topic'] = objective
        data['cards'][0]['breadcrumb'] = 'Receptor activity'
        self.assertGreater(len(objective), 80)
        warnings = validate(data)
        self.assertEqual(data['targets'][0]['topic'], objective)
        self.assertFalse(any('breadcrumb' in w and 'notebook title' in w for w in warnings))

    def rich_extra(self):
        data = self.term_fixture()
        card = data['cards'][0]
        card['example'] = {'kind': 'source', 'text': 'A traced coin has a circular outline around its edge.',
                           'source': copy.deepcopy(card['sourceRefs'][0])}
        card['explanation'] = ('Its outer edge shows the shape, without the inside details.\n'
                               'Traced objects keep their outlines even when their colors differ.')
        return data

    def test_three_short_extra_lines_can_exceed_twenty_words_in_total(self):
        data = self.rich_extra()
        warnings = validate(data)
        self.assertFalse(any('Extra exceeds' in warning for warning in warnings))

    def test_example_precedes_gloss_and_evidence_lines(self):
        card = self.rich_extra()['cards'][0]
        self.assertEqual(extra_text(card), card['example']['text'] + '\n' + card['explanation'])

    def test_four_extra_lines_warn(self):
        data = self.rich_extra()
        data['cards'][0]['explanation'] += '\nAn unnecessary fourth detail.'
        self.assertTrue(self.relevant(data, 'Extra exceeds three short lines'))

    def test_interior_blank_line_counts_toward_extra_visual_lines(self):
        data = self.rich_extra()
        data['cards'][0]['explanation'] = ('Its edge shows the shape.\n\n'
                                           'Traced objects keep the same outline.')
        self.assertTrue(self.relevant(data, 'Extra exceeds three short lines'))

    def test_single_extra_line_over_twenty_words_warns(self):
        data = self.term_fixture()
        data['cards'][0]['explanation'] = ' '.join(['word'] * 21)
        self.assertTrue(self.relevant(data, 'Extra exceeds three short lines'))

    def test_list_key_retains_one_line_per_item_exception(self):
        data = fixture(1)
        self.cloze(data, 'The 4 shape names, in any order, are {{c1::circle}}, '
                        '{{c1::square}}, {{c1::triangle}}, and {{c1::oval}}.', 'enumerated-list')
        card = data['cards'][0]
        card.update(listOrdered=False, example=None,
                    explanation='Circle: no corners.\nSquare: four equal sides.\n'
                                'Triangle: three sides.\nOval: stretched round outline.')
        self.assertFalse(self.relevant(data, 'Extra exceeds three short lines'))

    def test_extra_lines_render_in_real_anki_package_in_the_same_order(self):
        data = self.rich_extra()
        card = data['cards'][0]
        expected = card['example']['text'] + '<br>' + card['explanation'].replace('\n', '<br>')
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp)
            output = work / 'three-lines.apkg'
            build(data, output)
            previous = read_previous(output, work / 'media')
            note = previous['notes'][0]
            fields = dict(zip(note['fieldNames'], note['fields']))
            self.assertEqual(fields['Extra'], expected)


if __name__ == '__main__':
    unittest.main()
