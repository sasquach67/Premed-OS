"""Bound parallel definitions without imposing a cap on ordinary name lists."""
import copy
import unittest

from test_updates import fixture
from build_deck import indices, validate


class GroupingChecks(unittest.TestCase):
    # Synthetic test vocabulary; this is not authoring content for another deck.
    definitions = [
        ('Activation', 'starting a behavior'),
        ('Persistence', 'continuing despite difficulty'),
        ('Intensity', 'the effort put into the behavior'),
        ('Frequency', 'how often the behavior occurs'),
        ('Direction', 'the goal toward which behavior is directed'),
    ]

    def parallel_fixture(self, count):
        data = fixture(1)
        card = data['cards'][0]
        definitions = self.definitions[:count]
        ids = [f'term-{index}' for index in range(count)]
        card.update(type='cloze', front='', back='', clozePattern='single',
                    cloze='; '.join(name + ' is {{c1::' + meaning + '}}'
                                    for name, meaning in definitions) + '.',
                    targetIds=ids, explanation='', example=None, extraImages=[], axis='')
        data['targets'] = [
            {'id': tid, 'topic': 'Synthetic', 'statement': 'Term: ' + name,
             'kind': 'understand', 'core': True, 'coverage': 'tested',
             'cardIds': [card['id']], 'reason': 'Meaning: ' + meaning}
            for tid, (name, meaning) in zip(ids, definitions)
        ]
        return data

    def test_two_parallel_meanings_make_one_review_card(self):
        data = self.parallel_fixture(2)
        validate(data)
        self.assertEqual(indices(data['cards'][0]), [1])

    def test_activation_persistence_intensity_share_one_meaning_card(self):
        data = self.parallel_fixture(3)
        validate(data)
        self.assertEqual(indices(data['cards'][0]), [1])
        self.assertEqual(len(data['targets']), 3)

    def test_four_parallel_meanings_keep_their_definition_recall(self):
        data = self.parallel_fixture(4)
        validate(data)
        self.assertEqual(indices(data['cards'][0]), [1])

    def test_five_parallel_meanings_must_be_split(self):
        with self.assertRaisesRegex(ValueError, r'parallel meaning group.*5.*split'):
            validate(self.parallel_fixture(5))

    def test_list_label_cannot_disguise_five_parallel_meanings(self):
        data = self.parallel_fixture(5)
        card = data['cards'][0]
        card.update(clozePattern='enumerated-list', listOrdered=True,
                    cloze='The 5 meanings, in order: ' + card['cloze'])
        with self.assertRaisesRegex(ValueError, r'parallel meaning group.*5.*split'):
            validate(data)

    def test_missing_one_meaning_blank_still_fails_definition_recall(self):
        data = self.parallel_fixture(3)
        data['cards'][0]['cloze'] = data['cards'][0]['cloze'].replace(
            '{{c1::starting a behavior}}', 'starting a behavior')
        with self.assertRaisesRegex(ValueError, 'term has no definition-recall card'):
            validate(data)

    def test_duplicate_target_declarations_do_not_count_as_a_fifth_term(self):
        data = self.parallel_fixture(4)
        duplicate = copy.deepcopy(data['targets'][0])
        duplicate['id'] = 'same-term-another-target'
        data['targets'].append(duplicate)
        data['cards'][0]['targetIds'].append(duplicate['id'])
        validate(data)

    def test_five_item_umbrella_with_separate_definitions_is_allowed(self):
        data = self.parallel_fixture(5)
        umbrella = data['cards'][0]
        umbrella.update(id='umbrella', conceptId='umbrella',
                        targetIds=['umbrella-target'], clozePattern='enumerated-list',
                        listOrdered=False,
                        cloze='The 5 labels, in any order, are ' + ', '.join(
                            '{{c1::' + name + '}}' for name, _ in self.definitions) + '.',
                        explanation='\n'.join(name + ': ' + meaning
                                              for name, meaning in self.definitions))
        data['targets'].append(
            {'id': 'umbrella-target', 'topic': 'Synthetic', 'statement': 'Recall the five labels.',
             'kind': 'understand', 'core': True, 'coverage': 'tested',
             'cardIds': ['umbrella'], 'reason': ''})
        for index, (name, meaning) in enumerate(self.definitions):
            member = copy.deepcopy(umbrella)
            member.update(id=f'member-{index}', conceptId=f'member-{index}',
                          targetIds=[f'term-{index}'], clozePattern='single', listOrdered=None,
                          cloze=name + ' is {{c1::' + meaning + '}}.', explanation='')
            data['cards'].append(member)
            data['targets'][index]['cardIds'] = [member['id']]
        validate(data)
        self.assertEqual(indices(umbrella), [1])

    def test_five_step_ordered_name_list_is_not_a_parallel_definition_group(self):
        data = fixture(1)
        card = data['cards'][0]
        card.update(type='process', front='', back='', clozePattern='enumerated-list',
                    listOrdered=True,
                    cloze='The 5 stages, in order, are {{c1::one}} → {{c1::two}} → '
                          '{{c1::three}} → {{c1::four}} → {{c1::five}}.',
                    explanation='One: first.\nTwo: second.\nThree: third.\nFour: fourth.\nFive: fifth.',
                    example=None)
        validate(data)
        self.assertEqual(indices(card), [1])

    def test_headline_term_keeps_two_independent_definition_cards(self):
        data = self.parallel_fixture(1)
        card = data['cards'][0]
        card.update(clozePattern='independent',
                    cloze='{{c1::Activation::motivation term}} is {{c2::starting a behavior}}.')
        validate(data)
        self.assertEqual(indices(card), [1, 2])


if __name__ == '__main__':
    unittest.main()
