import { describe, expect, it } from 'vitest'
import { validateFlashcards } from './generateFlashcards'

describe('validateFlashcards', () => {
  const valid = { cards: [{ id: 'card-1', type: 'conceptual', front: 'What is a stream of consciousness?', back: 'A continuous flow of thought.', extra: 'Ex: One thought leads into the next while you walk home.', tags: ['psych'], conceptId: 'stream', sourceChunkId: 'chunk-1' }] }

  it('accepts a closed-set cited card with a subordinate example', () => {
    expect(validateFlashcards(valid, ['chunk-1'])).toEqual(valid.cards)
  })

  it('refuses a citation outside the closed material set', () => {
    expect(validateFlashcards(valid, ['another-chunk'])).toBeNull()
  })

  it('refuses malformed clozes and misplaced examples', () => {
    expect(validateFlashcards({ cards: [{ ...valid.cards[0], type: 'cloze', cloze: 'No blank', extra: 'Context\\nEx: wrong' }] }, ['chunk-1'])).toBeNull()
  })
})
