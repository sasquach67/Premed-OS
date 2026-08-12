/* Shared contracts for the deterministic intelligence layer (foundation L6).
 *
 * Everything in `src/lib/intelligence` is RULES OVER STORED RECORDS — no model
 * calls, no orchestration, no retrieval. Per architecture/02 "Deterministic
 * Before Probabilistic", objective computation establishes the factual
 * foundation; probabilistic reasoning is a later, separate layer.
 */

/** Severity vocabulary shared by warnings, recommendations, and attention items.
 *  Maps architecture/02's notification thresholds onto general.md's terms:
 *  Critical → blocking · Important → important · Helpful/Informational → suggested. */
export type Severity = 'blocking' | 'important' | 'suggested'

/** Qualitative confidence (architecture/02 "Confidence Levels" — interpretability
 *  over false precision).
 *
 *  IMPORTANT: only attach this where a rule genuinely carries uncertainty —
 *  today that is dedup matching alone. Deterministic facts (GPA, hour totals,
 *  date arithmetic, missing-field checks) carry NO confidence field, because
 *  dressing an objective fact as probabilistic is exactly what architecture/02
 *  "Deterministic vs Probabilistic Reasoning" forbids. */
export type ConfidenceLevel = 'high' | 'moderate' | 'low'

/** Every warning and recommendation must be able to explain itself in plain
 *  language (architecture/02 "Intelligence Is Explainable"). `why` is required,
 *  never optional — an unexplained item is a bug, not a style choice. */
export interface Explained {
  /** Plain-language reason this appeared. Shown verbatim to the user. */
  why: string
}

/** Completeness states (general.md → Completeness; data-model §7).
 *  Labeled states, never a bare percentage, and always paired with `missing`. */
export type CompletenessState = 'incomplete' | 'usable' | 'well-documented' | 'ready-for-export'

export interface Completeness {
  state: CompletenessState
  /** Human-readable field labels still outstanding — "always show exactly what is missing". */
  missing: string[]
  /** Share of the tracked fields present, 0–100. Presentational only; `state` is the contract. */
  percent: number
}

/** ---------------------------------------------------------------------------
 *  PRODUCT-TUNABLE THRESHOLDS
 *
 *  These are judgment calls about pre-med workflow pacing, NOT derived facts.
 *  They live in one block on purpose so they can be retuned without hunting
 *  through rule bodies. Changing a number here changes when advice appears —
 *  it never changes what is objectively true about the user's data.
 *  ------------------------------------------------------------------------- */
export const INTELLIGENCE_THRESHOLDS = {
  /** An active experience with no update in this long reads as drifting. */
  staleExperienceDays: 30,
  /** Clubs/orgs move slower than clinical shifts, so they get a longer leash. */
  staleOrgDays: 45,
  /** A letter request with no movement after this long deserves a nudge. */
  letterFollowUpDays: 21,
  /** A reflection left untouched this long is probably stalled. */
  staleStoryDays: 21,
  /** A completed role idle this long is a candidate for archiving. */
  archiveCompletedAfterDays: 90,
  /** How many dismissals of the same rule before it is retired permanently. */
  ruleMuteAfterDismissals: 3,
  /** Default cap on simultaneously surfaced recommendations (spec 03 §6.3: ≤3). */
  maxSmartActions: 3,
} as const

export type IntelligenceThresholds = typeof INTELLIGENCE_THRESHOLDS
