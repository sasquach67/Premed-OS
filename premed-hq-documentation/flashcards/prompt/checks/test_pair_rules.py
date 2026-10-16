"""Pair shapes use explicit metadata, never a guessed semantic opposite dictionary."""
import copy
import json
import subprocess
import tempfile
import warnings
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pair_rules import declared_pair, pair_role, validate_pair_rules, valid_headline_pair_allowance, slash_option_hint_warnings


class PairRuleChecks(unittest.TestCase):
    names = ('Intrinsic motivation', 'Extrinsic motivation')
    meanings = ('doing an activity because it is enjoyable',
                'doing an activity for outside rewards or to avoid punishment')

    def setUp(self):
        self.targets = {
            str(i): {'id': str(i), 'statement': 'Term: ' + name, 'reason': 'Meaning: ' + meaning}
            for i, (name, meaning) in enumerate(zip(self.names, self.meanings))
        }

    def card(self, text=None, relation='opposite'):
        return {'id': 'pair', 'conceptId': 'motivation', 'type': 'cloze',
                'clozePattern': 'single',
                'axis': relation + ': ' + ' | '.join(self.names) if relation else '',
                'cloze': text if text is not None else '; '.join(
                    name + ' means {{c1::' + meaning + '}}'
                    for name, meaning in zip(self.names, self.meanings)) + '.'}

    def names_card(self):
        return self.card('{{c1::Intrinsic}} motivation means ' + self.meanings[0]
                         + '; {{c1::extrinsic}} motivation means ' + self.meanings[1] + '.')

    def sisters(self):
        return [self.card('{{c1::' + name + '::type of motivation}} means ' + meaning + '.',
                          'non-opposite') for name, meaning in zip(self.names, self.meanings)]

    def allowance_group(self):
        card = self.card(relation='non-opposite')
        example = {'id': 'example', 'conceptId': 'motivation', 'type': 'application',
                   'clozePattern': None, 'axis': '', 'cloze': '',
                   'reinforcementReason': "instructor's own example from the lecture",
                   'sourceRefs': [{'sourceId': 'slides', 'location': 'Slide 12',
                                   'excerpt': 'A student does the activity for a prize.'}]}
        return [card, *self.sisters(), example]

    def test_shared_meanings_pass(self):
        validate_pair_rules(self.card(), self.targets)
        self.assertEqual(pair_role(self.card(), self.targets), 'meanings')

    def test_shared_partial_term_names_pass(self):
        validate_pair_rules(self.names_card(), self.targets)
        self.assertEqual(pair_role(self.names_card(), self.targets), 'names')

    def test_category_hint_allowed(self):
        card = self.names_card()
        card['cloze'] = card['cloze'].replace('{{c1::Intrinsic}}', '{{c1::Intrinsic::type of motivation}}')
        validate_pair_rules(card, self.targets)

    def test_candidate_options_in_hints_rejected(self):
        for hint in ('intrinsic/extrinsic', 'intrinsic or extrinsic', 'intrinsic | extrinsic',
                     'intrinsic, extrinsic', 'intrinsic; extrinsic', 'either intrinsic or extrinsic'):
            with self.subTest(hint=hint):
                card = self.card('{{c1::Intrinsic::' + hint + '}} motivation', relation='')
                with self.assertRaisesRegex(ValueError, 'list answer options'):
                    validate_pair_rules(card, self.targets)

    def test_independent_opposite_meanings_rejected(self):
        card = self.card()
        card['cloze'] = card['cloze'].replace('{{c1::' + self.meanings[1], '{{c2::' + self.meanings[1])
        with self.assertRaisesRegex(ValueError, 'shared cloze index'):
            validate_pair_rules(card, self.targets)

    def test_independent_opposite_names_rejected(self):
        card = self.names_card()
        card['cloze'] = card['cloze'].replace('{{c1::extrinsic}}', '{{c2::extrinsic}}')
        with self.assertRaisesRegex(ValueError, 'shared cloze index'):
            validate_pair_rules(card, self.targets)

    def test_half_meaning_visible_rejected(self):
        card = self.card()
        card['cloze'] = card['cloze'].replace('{{c1::' + self.meanings[1] + '}}', self.meanings[1])
        with self.assertRaisesRegex(ValueError, 'hide both names or both meanings'):
            validate_pair_rules(card, self.targets)

    def test_half_name_visible_rejected(self):
        card = self.names_card()
        card['cloze'] = card['cloze'].replace('{{c1::extrinsic}}', 'extrinsic')
        with self.assertRaisesRegex(ValueError, 'hide both names or both meanings'):
            validate_pair_rules(card, self.targets)

    def test_meaning_only_in_hint_does_not_count(self):
        card = self.card('Intrinsic motivation means {{c1::something::' + self.meanings[0]
                         + '}}; Extrinsic motivation means {{c1::something::' + self.meanings[1] + '}}.')
        with self.assertRaisesRegex(ValueError, 'hide both names or both meanings'):
            pair_role(card, self.targets)

    def test_no_semantic_opposite_guessing(self):
        card = self.names_card()
        card['axis'] = ''
        card['cloze'] = card['cloze'].replace('{{c1::extrinsic}}', 'extrinsic')
        validate_pair_rules(card, self.targets)
        self.assertIsNone(declared_pair(card))

    def test_malformed_pair_declarations_rejected(self):
        for axis in ('opposite: Intrinsic motivation', 'opposite: A | ',
                     'opposite: A | A', 'opposite: A | B | C'):
            with self.subTest(axis=axis):
                card = self.card()
                card['axis'] = axis
                with self.assertRaises(ValueError):
                    validate_pair_rules(card, self.targets)

    def test_declared_terms_need_inventory_meanings(self):
        with self.assertRaisesRegex(ValueError, 'recorded meanings'):
            validate_pair_rules(self.card(), {})

    def test_non_opposite_name_only_sisters_pass(self):
        for i, card in enumerate(self.sisters()):
            validate_pair_rules(card, self.targets)
            self.assertEqual(pair_role(card, self.targets), 'name:' + str(i))

    def test_non_opposite_shared_names_rejected(self):
        card = self.names_card()
        card['axis'] = card['axis'].replace('opposite:', 'non-opposite:')
        with self.assertRaisesRegex(ValueError, 'separate name-only sister'):
            validate_pair_rules(card, self.targets)

    def test_narrow_four_review_allowance(self):
        self.assertTrue(valid_headline_pair_allowance(self.allowance_group(), self.targets))

    def test_allowance_rejects_missing_or_invented_example(self):
        for reason, sources in (("invented practice example", [{'sourceId': 'slides'}]),
                                ("instructor's own example", [])):
            group = self.allowance_group()
            group[-1].update(reinforcementReason=reason, sourceRefs=sources)
            self.assertFalse(valid_headline_pair_allowance(group, self.targets))
        self.assertFalse(valid_headline_pair_allowance(self.allowance_group()[:-1], self.targets))

    def test_allowance_rejects_duplicate_sister_or_different_concept(self):
        group = self.allowance_group()
        group[2] = copy.deepcopy(group[1])
        self.assertFalse(valid_headline_pair_allowance(group, self.targets))
        group = self.allowance_group()
        group[-1]['conceptId'] = 'other'
        self.assertFalse(valid_headline_pair_allowance(group, self.targets))

    def test_allowance_rejects_different_pair_or_additional_review(self):
        group = self.allowance_group()
        group[2]['axis'] = 'non-opposite: Extrinsic motivation | Intrinsic motivation'
        self.assertFalse(valid_headline_pair_allowance(group, self.targets))
        group = self.allowance_group()
        group.append(copy.deepcopy(group[-1]))
        self.assertFalse(valid_headline_pair_allowance(group, self.targets))

    def test_allowance_accepts_one_review_instructor_cloze(self):
        group = self.allowance_group()
        group[-1].update(type='cloze', clozePattern='single',
                         cloze='The prize-based example illustrates {{c1::extrinsic motivation}}.')
        self.assertTrue(valid_headline_pair_allowance(group, self.targets))

    def test_allowance_rejects_multi_review_example(self):
        group = self.allowance_group()
        group[-1].update(type='cloze', clozePattern='independent',
                         cloze='{{c1::Prize}} example illustrates {{c2::extrinsic motivation}}.')
        self.assertFalse(valid_headline_pair_allowance(group, self.targets))

    def test_meaning_in_extra_cannot_rescue_partial_pair(self):
        card = self.card('Intrinsic motivation means {{c1::something}}; '
                         'Extrinsic motivation means {{c1::another thing}}.')
        card['explanation'] = '; '.join(self.meanings)
        with self.assertRaisesRegex(ValueError, 'hide both names or both meanings'):
            validate_pair_rules(card, self.targets)


    def test_slash_choice_containing_answer_warns_before_rejection(self):
        for answer, hint in [('inactivates','activates/inactivates'),
                             ('Positive','positive / negative'),
                             ('intrinsic','intrinsic/extrinsic'),
                             ('second','first/second/third')]:
            card={'id':'choice-hint','axis':'','cloze':'The result is {{c1::'+answer+'::'+hint+'}}.'}
            with self.subTest(hint=hint), warnings.catch_warnings(record=True) as captured:
                warnings.simplefilter('always')
                with self.assertRaisesRegex(ValueError,'not list answer options'):
                    validate_pair_rules(card,{})
                self.assertEqual(len(captured),1)
                self.assertIn('slash-separated answer options including the answer',str(captured[0].message))

    def test_category_hint_and_unmatched_slash_do_not_get_answer_option_warning(self):
        for answer, hint in [('inactivates','effect on Rb'),('intrinsic','type of motivation'),
                             ('neither','positive/negative')]:
            card={'id':'category','axis':'','cloze':'The result is {{c1::'+answer+'::'+hint+'}}.'}
            self.assertEqual(slash_option_hint_warnings(card),[])
        # An unmatched option list is still banned, even though this specific warning does not apply.
        with self.assertRaisesRegex(ValueError,'not list answer options'):
            validate_pair_rules(card,{})

    def test_builder_cli_emits_choice_warning_and_does_not_write_a_package(self):
        from test_updates import fixture, BASE
        data=fixture(1)
        data['cards'][0].update(type='cloze',front='',back='',clozePattern='single',
                               cloze='The protein {{c1::inactivates::activates/inactivates}} its target.')
        with tempfile.TemporaryDirectory() as temp:
            work=Path(temp);source=work/'cards.json';out=work/'bad.apkg'
            source.write_text(json.dumps(data))
            result=subprocess.run([sys.executable,str(BASE/'build_deck.py'),str(source),str(out)],capture_output=True,text=True)
            self.assertNotEqual(result.returncode,0)
            self.assertIn('UserWarning:',result.stderr)
            self.assertIn('slash-separated answer options including the answer',result.stderr)
            self.assertFalse(out.exists())


if __name__ == '__main__':
    unittest.main()
