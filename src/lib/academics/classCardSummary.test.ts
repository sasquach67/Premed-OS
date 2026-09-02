import { describe, expect, it } from 'vitest'
import { classCardTaskSummary } from './classCardSummary'

describe('classCardTaskSummary', () => {
  it('removes delivery URLs and preserves the recognizable task', () => {
    expect(classCardTaskSummary('Read Listen to Podcast, “What You Don’t Know” from This American Life https://example.com/episode before class'))
      .toBe('Listen to “What You Don’t Know”')
  })

  it('reduces long reading citations to the assigned title', () => {
    expect(classCardTaskSummary('Read Manfred Steger, “Globalization in history,” in Globalization: A Very Short Introduction (2023), 12–33. before class'))
      .toBe('Read “Globalization in history,”')
  })

  it('keeps chapter assignments recognizable and bounded', () => {
    expect(classCardTaskSummary('Read Chapter 4 · Sensation and Perception before class'))
      .toBe('Read Chapter 4 · Sensation and Perception')
    expect(classCardTaskSummary('Complete a very long assignment title that continues with several extra clauses and details the student can review later').length)
      .toBeLessThanOrEqual(83)
  })
})
