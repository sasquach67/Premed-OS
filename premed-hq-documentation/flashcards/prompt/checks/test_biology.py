"""Biology decks have no card-count target or size warning; subject is an explicit closed enum."""
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
    def test_no_size_warning_at_any_count(self):
        for count in (20, 36, 80):
            with self.subTest(count=count):
                self.assertEqual(size_warnings(biology_fixture(count)), [])

    def test_two_blank_notes_never_trigger_a_size_warning(self):
        self.assertEqual(size_warnings(biology_fixture(30, two_blank=True)), [])

    def test_subject_is_a_closed_enum(self):
        data = biology_fixture(1)
        data['subject'] = 'psychology'
        with self.assertRaisesRegex(ValueError, 'subject'):
            validate(data)

    def test_build_report_still_counts_active_reviews(self):
        data = biology_fixture(36)
        with tempfile.TemporaryDirectory() as temp:
            out = Path(temp) / 'biology.apkg'
            build(data, out)
            saved = json.loads(out.with_suffix('.build-report.json').read_text())
            self.assertEqual(saved['activeReviewCards'], 36)
            self.assertFalse(any(w.startswith('Biology deck has ') for w in saved['warnings']))
            self.assertTrue(out.is_file())
