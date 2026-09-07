/**
 * Execution budgets: deciding, BEFORE a request is sent, whether it can finish.
 *
 * "Small by construction" is not a time guarantee, and a queue, an AbortSignal
 * or a retry does not make an oversized call finish — it only decides how the
 * failure is recorded. So every provider task is sized first, against a model
 * of latency that starts conservative and then learns from what this
 * deployment actually measures. A task that does not fit is SUBDIVIDED along
 * the artifact's own structure before it runs. It is never sent and hoped for,
 * and never retried unchanged.
 *
 * The prior is deliberately pessimistic. The only hard datapoint available
 * before deployment is a 2.9s round trip for a 16-token reply on the live
 * route, which fixes the fixed overhead and says nothing about throughput. So
 * throughput starts at a rate slow enough that guessing wrong costs a
 * subdivision rather than a lost worker, and `observed` replaces the guess as
 * soon as real durations exist.
 */

/** Measured behaviour of one stage on this deployment. */
export interface StageObservation {
  samples: number
  /** Exponentially weighted mean of ms per output token. */
  msPerOutputToken: number
  /** Exponentially weighted mean of ms per 1000 input characters. */
  msPerKiloInputChar: number
  /** Largest total duration seen. */
  maxMs: number
}

/**
 * Priors, used until a stage has measurements.
 *
 * 2.9s of fixed overhead is the one real observation. 14 ms/output token is
 * ~71 tokens/second including reasoning — slower than a healthy `low` effort
 * run, which is the point: it is the number that must be wrong in the safe
 * direction. 40 ms per 1000 input characters is roughly 2,500 tokens/second of
 * prefill, chosen low because Astra carries a long-context surcharge and the
 * corpora here reach hundreds of thousands of characters.
 *
 * Under these rates OUTPUT is the binding constraint, not input — which is why
 * planning (long in, short out) is its own stage and section writing (short in,
 * long out) is the one that subdivides.
 */
export const PRIOR: StageObservation = {
  samples: 0,
  msPerOutputToken: 14,
  msPerKiloInputChar: 40,
  maxMs: 0,
}

/** How many samples before a measurement fully replaces the prior. */
const CONFIDENCE_AT = 8

export function blendObservation(observed: StageObservation | null | undefined): StageObservation {
  if (!observed || observed.samples < 1) return PRIOR
  // Move off the prior gradually: one fast run must not license a huge request.
  const weight = Math.min(observed.samples / CONFIDENCE_AT, 1)
  const blend = (measured: number, prior: number) => {
    const value = measured * weight + prior * (1 - weight)
    // Never let learning make the estimate optimistic beyond the measurement.
    return Math.max(value, measured)
  }
  return {
    samples: observed.samples,
    msPerOutputToken: blend(observed.msPerOutputToken, PRIOR.msPerOutputToken),
    msPerKiloInputChar: blend(observed.msPerKiloInputChar, PRIOR.msPerKiloInputChar),
    maxMs: observed.maxMs,
  }
}

/** Fixed round-trip overhead: connection, routing, queueing at the provider. */
export const FIXED_OVERHEAD_MS = 3_000

export interface RequestShape {
  /** Total characters of prompt actually serialised onto the wire. */
  inputChars: number
  /** The `max_output_tokens` this request would ask for. */
  outputTokens: number
}

/** Worst-case duration this request should be assumed to take. */
export function estimateMs(shape: RequestShape, observed?: StageObservation | null): number {
  const rates = blendObservation(observed)
  return Math.ceil(
    FIXED_OVERHEAD_MS
    + (shape.inputChars / 1000) * rates.msPerKiloInputChar
    + shape.outputTokens * rates.msPerOutputToken,
  )
}

/**
 * The largest `max_output_tokens` that still fits, given the input already
 * committed. Returns 0 when even a trivial reply would not fit — the caller
 * must then subdivide or defer, never send.
 */
export function affordableOutputTokens(inputChars: number, budgetMs: number, observed?: StageObservation | null): number {
  const rates = blendObservation(observed)
  const remaining = budgetMs - FIXED_OVERHEAD_MS - (inputChars / 1000) * rates.msPerKiloInputChar
  if (remaining <= 0) return 0
  return Math.max(0, Math.floor(remaining / rates.msPerOutputToken))
}

/**
 * The largest input, in characters, a stage can carry and still leave room for
 * the output it must produce. This is what decides whether the corpus can be
 * planned in one pass or has to be surveyed source by source.
 */
export function affordableInputChars(outputTokens: number, budgetMs: number, observed?: StageObservation | null): number {
  const rates = blendObservation(observed)
  const remaining = budgetMs - FIXED_OVERHEAD_MS - outputTokens * rates.msPerOutputToken
  if (remaining <= 0) return 0
  return Math.max(0, Math.floor((remaining / rates.msPerKiloInputChar) * 1000))
}

/**
 * How much corpus may go into ONE request before planning must go hierarchical.
 *
 * Deliberately a structural cap rather than a latency calculation. Long-context
 * latency is nonlinear and, on this route, entirely unmeasured; the one
 * confirmed failure was a worker killed at its wall clock. So until a stage has
 * real evidence, the ceiling is a corpus a fast response is plainly capable of
 * — roughly 30k tokens — and the survey/merge path handles anything larger.
 * Once measurements exist the latency model is allowed to raise it.
 */
export const CONSERVATIVE_SINGLE_PASS_CHARS = 120_000

export function singlePassCorpusChars(budgetMs: number, minOutputTokens: number, observed?: StageObservation | null): number {
  const byLatency = affordableInputChars(minOutputTokens, budgetMs, observed)
  const trusted = observed && observed.samples >= CONFIDENCE_AT
  return trusted ? byLatency : Math.min(byLatency, CONSERVATIVE_SINGLE_PASS_CHARS)
}

export type FitVerdict =
  | { fits: true; estimateMs: number; outputTokens: number }
  | { fits: false; estimateMs: number; reason: 'input-too-large' | 'output-too-large'; affordableInputChars: number; affordableOutputTokens: number }

/**
 * Can this request be sent as it stands?
 *
 * `minOutputTokens` is the smallest reply that would still be a real answer for
 * the stage. Trimming output below it would be shrinking the work to beat a
 * clock, which is precisely what must not happen — the task is subdivided
 * instead.
 */
export function fitsBudget(
  shape: RequestShape,
  budgetMs: number,
  minOutputTokens: number,
  observed?: StageObservation | null,
): FitVerdict {
  const affordableOut = affordableOutputTokens(shape.inputChars, budgetMs, observed)
  // The FULL requested output must fit. Trimming `max_output_tokens` to squeeze
  // a request under a deadline does not shrink the work — it truncates the
  // reply mid-artifact, which is the same information loss this design exists
  // to prevent, arriving through a different door. A task that cannot afford
  // the answer it needs is subdivided instead.
  if (affordableOut < shape.outputTokens) {
    return {
      fits: false,
      estimateMs: estimateMs(shape, observed),
      // Below the floor nothing worth reading could come back at all, so the
      // input is the problem; above it, the answer is simply too long for one
      // request and the work divides.
      reason: affordableOut < minOutputTokens ? 'input-too-large' : 'output-too-large',
      affordableInputChars: affordableInputChars(minOutputTokens, budgetMs, observed),
      affordableOutputTokens: affordableOut,
    }
  }
  return { fits: true, estimateMs: estimateMs(shape, observed), outputTokens: shape.outputTokens }
}

/**
 * Split an ordered list of passages into the fewest spans that each fit.
 *
 * Used ONLY when a single source is larger than any one request can carry. The
 * stage is still "survey this source"; this is how that stage is executed when
 * the source itself is oversized. Spans follow the document's own passage
 * order, every passage appears in exactly one span, and the merge stage is what
 * re-establishes meaning across them. It is not a semantic division and is
 * never used to decide what a stage is.
 */
export function orderedSpans<T>(items: readonly T[], sizeOf: (item: T) => number, maxChars: number): T[][] {
  if (!items.length) return []
  const spans: T[][] = []
  let current: T[] = []
  let used = 0
  for (const item of items) {
    const size = sizeOf(item)
    // A single passage larger than the span budget still gets its own span:
    // never dropped, never truncated.
    if (current.length && used + size > maxChars) {
      spans.push(current)
      current = []
      used = 0
    }
    current.push(item)
    used += size
  }
  if (current.length) spans.push(current)
  return spans
}

/**
 * Update a stage's measured rates from one completed request.
 *
 * Recorded per stage because their shapes differ: a plan is long input and
 * short output, a section is the reverse. One blended number would hide both.
 */
export function recordObservation(
  previous: StageObservation | null | undefined,
  sample: { durationMs: number; inputChars: number; outputTokens: number },
): StageObservation {
  const base = previous && previous.samples > 0 ? previous : { ...PRIOR, samples: 0 }
  const workMs = Math.max(sample.durationMs - FIXED_OVERHEAD_MS, 1)
  const inputKilo = Math.max(sample.inputChars / 1000, 0.001)
  const outputTokens = Math.max(sample.outputTokens, 1)
  // Attribute the measured time between input and output in proportion to what
  // the current rates predict, so neither term absorbs the other's cost.
  const predictedInput = inputKilo * base.msPerKiloInputChar
  const predictedOutput = outputTokens * base.msPerOutputToken
  const total = Math.max(predictedInput + predictedOutput, 1)
  const inputShare = workMs * (predictedInput / total)
  const outputShare = workMs * (predictedOutput / total)
  const alpha = 0.3
  return {
    samples: base.samples + 1,
    msPerKiloInputChar: base.msPerKiloInputChar * (1 - alpha) + (inputShare / inputKilo) * alpha,
    msPerOutputToken: base.msPerOutputToken * (1 - alpha) + (outputShare / outputTokens) * alpha,
    maxMs: Math.max(base.maxMs, sample.durationMs),
  }
}
