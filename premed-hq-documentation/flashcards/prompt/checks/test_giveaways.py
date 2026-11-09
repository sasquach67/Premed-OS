"""Answer give-aways and deck-wide repeated answers fail the build (2026-11-08 audit)."""
import copy
import unittest

from test_updates import fixture
from build_deck import answer_leaks, repeated_answers, validate


def chain(text, card_id='chain'):
    data = fixture(1)
    data['cards'][0].update(id=card_id, type='process', front='', back='', cloze=text,
                            clozePattern='enumerated-list', listOrdered=True)
    data['targets'][0]['cardIds'] = [card_id]
    return data


class GiveawayChecks(unittest.TestCase):
    def test_answer_visible_elsewhere_in_chain_fails(self):
        card = chain('The 3 steps in order: LPS → tissue cells release {{c1::IL-8}} → IL-8 gradient → {{c1::neutrophils}} migrate.')['cards'][0]
        self.assertTrue(any('IL-8' in leak for leak in answer_leaks(card)))

    def test_answer_inside_its_own_hint_fails(self):
        card = fixture(1)['cards'][0]
        card.update(type='cloze', front='', back='', clozePattern='single',
                    cloze='A {{c1::sodium–potassium pump::the sodium–potassium pump}} uses ATP to move ions against their gradients.')
        self.assertTrue(answer_leaks(card))

    def test_basic_back_in_front_fails(self):
        card = fixture(1)['cards'][0]
        card.update(front='Is clathrin-mediated endocytosis how SARS-CoV-2 enters?', back='clathrin-mediated endocytosis')
        self.assertTrue(answer_leaks(card))

    def test_partial_word_overlap_is_not_a_leak(self):
        card = fixture(1)['cards'][0]
        card.update(type='cloze', front='', back='', clozePattern='single',
                    cloze='Unlike simple diffusion, {{c1::facilitated diffusion}} needs a channel or carrier protein.')
        self.assertEqual(answer_leaks(card), [])

    def test_same_list_items_on_two_cards_fail(self):
        data = chain('The 3 filament types, in any order: {{c1::microfilaments}}, {{c1::microtubules}}, {{c1::intermediate filaments}}.', 'types')
        second = copy.deepcopy(data['cards'][0])
        second.update(id='order', cloze='The 3 filaments from thinnest to thickest: {{c1::microfilaments}}, {{c1::intermediate filaments}}, {{c1::microtubules}}.')
        data['cards'].append(second)
        self.assertEqual(list(repeated_answers(data['cards']).values()), [['types', 'order']])

    def test_validate_raises_on_giveaway(self):
        data = fixture(1)
        data['cards'][0].update(front='Sample shape: what describes the outline of an object?',
                                back='the outline of an object')
        with self.assertRaisesRegex(ValueError, 'gives away its own answer'):
            validate(data)


if __name__ == '__main__':
    unittest.main()
