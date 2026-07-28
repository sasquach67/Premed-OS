import { describe, expect, it } from 'vitest'
import {
  ALLOWED_GENERATION_CONTEXTS, assertGenerationAllowed, GenerationNotAllowedError,
  isGenerationAllowed, RETIRED_GENERATION_CONTEXTS,
} from './generationPolicy'

describe('AI generation allow-list', () => {
  it('permits exactly the two approved contexts', () => {
    expect([...ALLOWED_GENERATION_CONTEXTS]).toEqual(['missed-to-mastery', 'flashcards'])
    expect(isGenerationAllowed('missed-to-mastery')).toBe(true)
    expect(isGenerationAllowed('flashcards')).toBe(true)
  })

  it('rejects every retired generation path', () => {
    for (const context of RETIRED_GENERATION_CONTEXTS) {
      expect(isGenerationAllowed(context)).toBe(false)
      expect(() => assertGenerationAllowed(context)).toThrow(GenerationNotAllowedError)
    }
  })

  it('rejects anything not explicitly listed, so new generators cannot slip in', () => {
    expect(() => assertGenerationAllowed('essay-writer')).toThrow(GenerationNotAllowedError)
    expect(() => assertGenerationAllowed('')).toThrow(GenerationNotAllowedError)
  })

  it('names the offending context so the failure is actionable', () => {
    try {
      assertGenerationAllowed('study-guide')
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(GenerationNotAllowedError)
      expect((error as GenerationNotAllowedError).context).toBe('study-guide')
      expect((error as Error).message).toContain('missed-to-mastery')
    }
  })
})
