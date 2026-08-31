import { describe, expect, it } from 'vitest'
import { validateFlashcards } from './generateFlashcards'

describe('validateFlashcards', () => {
  const valid = { cards: [{ id: 'card-1', type: 'conceptual', front: 'What does stream of consciousness describe?', back: 'It describes thought as a continuous flow.', extra: 'Ex: One thought leads into the next while you walk home.', tags: ['psych'], conceptId: 'stream', sourceChunkId: 'chunk-1', salience: 'load-bearing', difficultyEstimate: 2 }] }

  it('accepts a closed-set cited card with a subordinate example', () => {
    expect(validateFlashcards(valid, ['chunk-1'])).toEqual(valid.cards)
  })

  it('refuses a citation outside the closed material set', () => {
    expect(validateFlashcards(valid, ['another-chunk'])).toBeNull()
  })

  it('refuses malformed clozes and misplaced examples', () => {
    expect(validateFlashcards({ cards: [{ ...valid.cards[0], type: 'cloze', cloze: 'No blank', extra: 'Context\\nEx: wrong' }] }, ['chunk-1'])).toBeNull()
  })

  it('requires the v1 blurt checklist contract', () => {
    expect(validateFlashcards({ cards: [{ ...valid.cards[0], type: 'free-recall', front: 'BLURT: stream of consciousness. 3 things to hit.', back: undefined, recallItems: ['Thought is a continuous flow from one idea to the next.', 'William James was the psychologist who named conscious experience a continuous stream.', 'The metaphor is a contrast between flow and separate, isolated units.'] }] }, ['chunk-1'])).toHaveLength(1)
    expect(validateFlashcards({ cards: [{ ...valid.cards[0], type: 'free-recall', front: 'BLURT: stream of consciousness.', back: undefined, recallItems: ['Thought is a continuous flow from one idea to the next.', 'William James was the psychologist who named conscious experience a continuous stream.'] }] }, ['chunk-1'])).toBeNull()
  })

  it('rejects a definition cloze split across multiple indices', () => {
    expect(validateFlashcards({ cards: [{ ...valid.cards[0], type: 'cloze', front: undefined, back: undefined, clozePattern: 'definition', cloze: 'X is {{c1::one}} and {{c2::two}}.' }] }, ['chunk-1'])).toBeNull()
  })

  it('rejects a normal-sized glossary-only deck but accepts conceptual relational coverage', () => {
    const glossary = Array.from({ length: 7 }, (_, index) => ({ ...valid.cards[0], id: `basic-${index}`, type: 'basic' as const, front: `What is item ${index}?`, back: `Item ${index} is a source-supported fact.` }))
    expect(validateFlashcards({ cards: glossary }, ['chunk-1'])).toBeNull()

    const conceptual = Array.from({ length: 7 }, (_, index) => ({ ...valid.cards[0], id: `concept-${index}`, relational: true }))
    expect(validateFlashcards({ cards: conceptual }, ['chunk-1'])).toHaveLength(7)
  })
})
