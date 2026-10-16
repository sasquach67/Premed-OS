"""Biology size is an explicit-subject advisory measured in active review cards."""
import copy
import json
from pathlib import Path
import tempfile
import unittest

from test_updates import fixture, build
from build_deck import validate


def biology_fixture(count, two_blank=False):
    data = fixture(1)
    template = copy.deepcopy(data['cards'][0])
    target = copy.deepcopy(data['targets'][0])
    data.update(subject='biology', cards=[], targets=[])
    for number in range(count):
        key = f'concept-{number}'
        card = copy.deepcopy(template)
        card.update(id=key, conceptId=key, targetIds=[key],
                    front=f'Synthetic concept {number}',
                    back=f'This distinct synthetic concept has property {number}.')
        if two_blank:
            card.update(type='cloze', front='', back='', clozePattern='independent',
                        cloze=f'{{{{c1::Synthetic concept {number}}}}} is {{{{c2::a distinct outline property {number}}}}}.')
        item = copy.deepcopy(target)
        item.update(id=key, statement=f'Define synthetic concept {number}.', cardIds=[key])
        data['cards'].append(card)
        data['targets'].append(item)
    return data


def size_warnings(data):
    return [warning for warning in validate(data) if warning.startswith('Biology deck has ')]


class BiologyChecks(unittest.TestCase):
    def test_35_active_review_cards_do_not_warn(self):
        self.assertEqual(size_warnings(biology_fixture(35)), [])

    def test_36_active_review_cards_warn_without_failing(self):
        warnings = size_warnings(biology_fixture(36))
        self.assertEqual(len(warnings), 1)
        for phrase in ('36 active review cards', '20–30', 'Report why', 'advisory'):
            self.assertIn(phrase, warnings[0])

    def test_cloze_indices_count_reviews_not_notes(self):
        data = biology_fixture(18, two_blank=True)
        self.assertEqual(len(data['cards']), 18)
        self.assertIn('36 active review cards', size_warnings(data)[0])
        data['cards'][0]['cloze'] = data['cards'][0]['cloze'].replace('c2::', 'c1::')
        data['cards'][0]['clozePattern'] = 'single'
        self.assertEqual(size_warnings(data), [])

    def test_other_and_legacy_inputs_do_not_infer_biology_from_titles(self):
        data = biology_fixture(36)
        data.update(deckName='PSYC Biological Bases', journalTitle='Biology and behavior')
        data['subject'] = 'other'
        self.assertEqual(size_warnings(data), [])
        del data['subject']
        self.assertEqual(size_warnings(data), [])

    def test_subject_is_a_closed_enum(self):
        data = biology_fixture(1)
        data['subject'] = 'psychology'
        with self.assertRaisesRegex(ValueError, 'subject'):
            validate(data)

    def test_size_warning_is_saved_in_build_report(self):
        data = biology_fixture(36)
        with tempfile.TemporaryDirectory() as temp:
            out = Path(temp) / 'biology.apkg'
            report = build(data, out)
            saved = json.loads(out.with_suffix('.build-report.json').read_text())
            self.assertEqual(saved['warnings'], report['warnings'])
            self.assertEqual(saved['activeReviewCards'], 36)
            self.assertTrue(any('36 active review cards' in warning for warning in saved['warnings']))
            self.assertTrue(out.is_file())

    def test_retired_notes_do_not_count_toward_active_size_advisory(self):
        initial_data = biology_fixture(36)
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp)
            initial = build(initial_data, work / 'initial.apkg')
            updated = biology_fixture(35)
            for card, record in zip(updated['cards'], initial['records']):
                card['reuseGuid'] = record['guid']
            final = build(updated, work / 'updated.apkg', work / 'initial.apkg')
            self.assertEqual(final['activeReviewCards'], 35)
            self.assertEqual(final['reviewCards'], 36)
            self.assertEqual(final['retiredNotes'], 1)
            self.assertFalse(any(w.startswith('Biology deck has ') for w in final['warnings']))
