import { describe, expect, it } from 'vitest'
import {
  ACADEMICS_ARTIFACTS, assertGenerationAllowed, generatedTitle, GENERATED_OWNER,
  GenerationNotAllowedError, isGenerationAllowed, markGenerated, MCAT_ARTIFACTS,
  MCAT_FORBIDDEN_ARTIFACTS, presentsAsRealExam,
} from './generationPolicy'

/** A valid Academics request: one class, grounded in its own materials. */
function academics(artifact: string, over: Record<string, unknown> = {}) {
  return { scope: 'academics' as const, artifact, courseId: 'c1', groundedIn: ['file-1'], ...over }
}

describe('Academics generation — permissive (tabs/01-academics.md §6.3)', () => {
  it('allows every class study artifact, including practice exams', () => {
    for (const artifact of ACADEMICS_ARTIFACTS) {
      expect(isGenerationAllowed('academics', artifact)).toBe(true)
      expect(() => assertGenerationAllowed(academics(artifact))).not.toThrow()
    }
    // The one that was previously retired.
    expect(isGenerationAllowed('academics', 'practice-exam')).toBe(true)
  })

  it('guardrail 1 — refuses work that is not grounded in the class materials', () => {
    expect(() => assertGenerationAllowed(academics('quiz', { groundedIn: [] })))
      .toThrow(GenerationNotAllowedError)
    expect(() => assertGenerationAllowed(academics('quiz', { groundedIn: undefined })))
      .toThrow(/own materials/i)
  })

  it('guardrail 1 — generation is always for one specific class', () => {
    expect(() => assertGenerationAllowed(academics('study-guide', { courseId: undefined })))
      .toThrow(/one specific class/i)
  })

  it('guardrail 2 — generated artifacts carry the ownership marker', () => {
    expect(GENERATED_OWNER).toBe('generated')
    expect(markGenerated({ id: 'f1', title: 'Practice set' }).owner).toBe('generated')
    // An existing owner is overridden — generated output is never "course".
    expect(markGenerated({ id: 'f1', owner: 'course' as const }).owner).toBe('generated')
  })

  it('guardrail 3 — a generated title never claims to be the real thing', () => {
    expect(presentsAsRealExam("Last year's exam")).toBe(true)
    expect(presentsAsRealExam('The upcoming exam')).toBe(true)
    expect(presentsAsRealExam('Midterm practice set')).toBe(false)

    const cleaned = generatedTitle("Last year's exam")
    expect(presentsAsRealExam(cleaned)).toBe(false)
    expect(cleaned).toMatch(/^Generated · /)
    // Ordinary titles are labelled, not mangled.
    expect(generatedTitle('hard practice set')).toBe('Generated · hard practice set')
    // Labelling is idempotent.
    expect(generatedTitle('Generated · hard practice set')).toBe('Generated · hard practice set')
  })

  it('rejects an unrecognised artifact rather than letting anything through', () => {
    expect(() => assertGenerationAllowed(academics('write-my-personal-statement')))
      .toThrow(GenerationNotAllowedError)
  })
})

describe('MCAT generation — restricted, and scoped to MCAT', () => {
  it('still allows only missed-to-mastery drills and flashcards', () => {
    expect([...MCAT_ARTIFACTS]).toEqual(['missed-to-mastery', 'flashcards'])
    for (const artifact of MCAT_ARTIFACTS) {
      expect(() => assertGenerationAllowed({ scope: 'mcat', artifact })).not.toThrow()
    }
  })

  it('never generates QBank questions or CARS passages', () => {
    for (const artifact of MCAT_FORBIDDEN_ARTIFACTS) {
      expect(isGenerationAllowed('mcat', artifact)).toBe(false)
      expect(() => assertGenerationAllowed({ scope: 'mcat', artifact }))
        .toThrow(/externally sourced/i)
    }
  })

  it('does NOT inherit the Academics permission — the scopes stay separate', () => {
    // The whole point of the boundary: same artifact, different answer.
    expect(isGenerationAllowed('academics', 'practice-exam')).toBe(true)
    expect(isGenerationAllowed('mcat', 'practice-exam')).toBe(false)
    for (const artifact of ACADEMICS_ARTIFACTS) {
      if ((MCAT_ARTIFACTS as readonly string[]).includes(artifact)) continue
      expect(isGenerationAllowed('mcat', artifact)).toBe(false)
    }
  })

  it('names the scope and artifact on the error so failures are actionable', () => {
    try {
      assertGenerationAllowed({ scope: 'mcat', artifact: 'cars-passages' })
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(GenerationNotAllowedError)
      expect((error as GenerationNotAllowedError).scope).toBe('mcat')
      expect((error as GenerationNotAllowedError).artifact).toBe('cars-passages')
    }
  })
})
