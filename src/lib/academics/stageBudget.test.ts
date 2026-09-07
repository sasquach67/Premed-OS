/**
 * Sizing decides whether a request is sent at all.
 *
 * The rule these protect: a task that cannot finish is never sent. Not sent
 * with a shorter deadline, not sent with a retry queued behind it, not sent
 * with the output quietly trimmed to a stub — subdivided, or refused with a
 * reason. And the estimate starts pessimistic, so being wrong costs a
 * subdivision rather than a killed worker.
 */
import { describe, expect, it } from 'vitest'
import {
  affordableInputChars,
  affordableOutputTokens,
  blendObservation,
  estimateMs,
  FIXED_OVERHEAD_MS,
  fitsBudget,
  orderedSpans,
  PRIOR,
  recordObservation,
} from '../../../supabase/functions/_shared/stageBudget'

describe('the prior is pessimistic', () => {
  it('never estimates below the one measured round trip', () => {
    expect(estimateMs({ inputChars: 0, outputTokens: 0 })).toBeGreaterThanOrEqual(FIXED_OVERHEAD_MS)
  })

  it('prices a full-document reply out of a single worker', () => {
    // 8000 output tokens at the prior rate is ~112s of generation alone. A
    // stage that wants this must subdivide; that is the intended answer.
    expect(estimateMs({ inputChars: 20_000, outputTokens: 8_000 })).toBeGreaterThan(100_000)
  })

  it('prices a plan-shaped reply inside a worker', () => {
    // Long input, short output: this is why planning is its own stage.
    expect(estimateMs({ inputChars: 60_000, outputTokens: 1_500 })).toBeLessThan(90_000)
  })
})

describe('learning from measurement', () => {
  it('ignores a single fast run rather than licensing a huge request', () => {
    const fast = { samples: 1, msPerOutputToken: 1, msPerKiloInputChar: 1, maxMs: 4_000 }
    const blended = blendObservation(fast)
    // One sample moves the estimate only 1/8 of the way off the prior.
    expect(blended.msPerOutputToken).toBeGreaterThan(PRIOR.msPerOutputToken * 0.8)
  })

  it('adopts a measured rate once there is enough evidence', () => {
    const measured = { samples: 12, msPerOutputToken: 2, msPerKiloInputChar: 1, maxMs: 20_000 }
    expect(blendObservation(measured).msPerOutputToken).toBeCloseTo(2, 5)
  })

  it('never becomes more optimistic than the measurement itself', () => {
    const slow = { samples: 40, msPerOutputToken: 30, msPerKiloInputChar: 20, maxMs: 120_000 }
    const blended = blendObservation(slow)
    expect(blended.msPerOutputToken).toBeGreaterThanOrEqual(30)
    expect(blended.msPerKiloInputChar).toBeGreaterThanOrEqual(20)
  })

  it('attributes a sample between input and output instead of blaming one', () => {
    const next = recordObservation(null, { durationMs: 33_000, inputChars: 50_000, outputTokens: 1_000 })
    expect(next.samples).toBe(1)
    expect(next.msPerKiloInputChar).toBeGreaterThan(0)
    expect(next.msPerOutputToken).toBeGreaterThan(0)
    expect(next.maxMs).toBe(33_000)
  })

  it('remembers the worst run, not just the average', () => {
    let observed = recordObservation(null, { durationMs: 90_000, inputChars: 10_000, outputTokens: 4_000 })
    observed = recordObservation(observed, { durationMs: 5_000, inputChars: 10_000, outputTokens: 4_000 })
    expect(observed.maxMs).toBe(90_000)
  })
})

describe('the fit verdict', () => {
  const budget = 75_000

  it('accepts a request that fits, and asks for the whole answer', () => {
    const verdict = fitsBudget({ inputChars: 8_000, outputTokens: 3_000 }, budget, 1_500)
    expect(verdict.fits).toBe(true)
    if (verdict.fits) {
      // Never trimmed: a shortened max_output_tokens truncates the artifact
      // mid-sentence rather than making the work smaller.
      expect(verdict.outputTokens).toBe(3_000)
      expect(verdict.estimateMs).toBeLessThanOrEqual(budget)
    }
  })

  it('refuses rather than trimming the answer to fit', () => {
    const verdict = fitsBudget({ inputChars: 8_000, outputTokens: 5_000 }, 40_000, 1_500)
    expect(verdict.fits).toBe(false)
    if (!verdict.fits) {
      expect(verdict.reason).toBe('output-too-large')
      // Some output was affordable — it just was not the whole answer.
      expect(verdict.affordableOutputTokens).toBeGreaterThan(1_500)
      expect(verdict.affordableOutputTokens).toBeLessThan(5_000)
    }
  })

  it('refuses when the input alone leaves no room for a real answer', () => {
    // A whole 400k-character corpus against a 20s ceiling: prefill eats the
    // budget and nothing worth reading could come back.
    const verdict = fitsBudget({ inputChars: 400_000, outputTokens: 4_000 }, 20_000, 1_200)
    expect(verdict.fits).toBe(false)
    if (!verdict.fits) {
      expect(verdict.reason).toBe('input-too-large')
      // And it says how much input WOULD fit, so the caller can subdivide.
      expect(verdict.affordableInputChars).toBeGreaterThanOrEqual(0)
      expect(verdict.affordableInputChars).toBeLessThan(400_000)
    }
  })

  it('makes output the binding constraint at realistic corpus sizes', () => {
    // 700k characters is the corpus ceiling. Planning it fits; writing the
    // whole document in one reply does not. That asymmetry is the design.
    expect(fitsBudget({ inputChars: 700_000, outputTokens: 1_500 }, 80_000, 1_200).fits).toBe(true)
    expect(fitsBudget({ inputChars: 40_000, outputTokens: 8_000 }, 80_000, 2_000).fits).toBe(false)
  })

  it('calls it an input problem only when no real answer could fit at all', () => {
    const verdict = fitsBudget({ inputChars: 600_000, outputTokens: 8_000 }, 30_000, 2_000)
    expect(verdict.fits).toBe(false)
    if (!verdict.fits) expect(verdict.reason).toBe('input-too-large')
  })

  it('agrees with the affordability helpers it is built from', () => {
    const out = affordableOutputTokens(20_000, budget)
    expect(estimateMs({ inputChars: 20_000, outputTokens: out })).toBeLessThanOrEqual(budget + 1)
    expect(fitsBudget({ inputChars: 20_000, outputTokens: out }, budget, 500).fits).toBe(true)
    const chars = affordableInputChars(1_500, budget)
    expect(estimateMs({ inputChars: chars, outputTokens: 1_500 })).toBeLessThanOrEqual(budget + 1)
  })

  it('reports zero affordable output when the budget is already spent', () => {
    expect(affordableOutputTokens(10_000, 1_000)).toBe(0)
    expect(affordableInputChars(1_000, 1_000)).toBe(0)
  })
})

describe('ordered spans', () => {
  const passage = (id: string, size: number) => ({ id, size })
  const sizeOf = (item: { size: number }) => item.size

  it('keeps document order and loses nothing', () => {
    const items = [passage('a', 400), passage('b', 400), passage('c', 400), passage('d', 400)]
    const spans = orderedSpans(items, sizeOf, 900)
    expect(spans.flat().map((item) => item.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(spans.length).toBeGreaterThan(1)
  })

  it('gives an oversized single passage its own span rather than truncating it', () => {
    const spans = orderedSpans([passage('huge', 50_000), passage('small', 10)], sizeOf, 1_000)
    expect(spans[0].map((item) => item.id)).toEqual(['huge'])
    expect(spans.flat()).toHaveLength(2)
  })

  it('returns one span when everything already fits', () => {
    expect(orderedSpans([passage('a', 10), passage('b', 10)], sizeOf, 1_000)).toHaveLength(1)
  })

  it('handles an empty selection', () => {
    expect(orderedSpans([], sizeOf, 100)).toEqual([])
  })
})
