/* Deterministic intelligence (foundation L6) — public surface.
 *
 * Rules over the entity graph. No model calls, no orchestration, no memory or
 * retrieval, and nothing that acts on the user's behalf. Everything here is
 * computed on read and never persisted (data-model §6).
 *
 * Consumers:
 *   • Attention bell / LiveStatusChip → `components/layout/attention.ts`
 *   • Overview Smart Next Actions (spec 03 §6.3) → `smartNextActions()`
 *   • Review queue (general.md)            → `attentionReviewQueue()`
 */
export {
  INTELLIGENCE_THRESHOLDS,
  type Completeness,
  type CompletenessState,
  type ConfidenceLevel,
  type Explained,
  type IntelligenceThresholds,
  type Severity,
} from './types'

export {
  daysBetween,
  daysSinceUpdate,
  distinctCount,
  nextDeadline,
  paceProjection,
  parseIsoDate,
  pillarSignals,
  type PaceProjection,
  type PillarSignals,
} from './derived'

export {
  courseCompleteness,
  dataHealthWarnings,
  experienceCompleteness,
  letterCompleteness,
  type DataHealthWarning,
  type EntityKind,
} from './dataHealth'

export {
  dedupCandidates,
  type DedupCandidate,
  type DedupKind,
} from './dedup'

export {
  generateRecommendations,
  isMutableSeverity,
  ruleDismissalCount,
  smartNextActions,
  academicsNextActions,
  type Recommendation,
  type RecommendationStatus,
} from './recommendations'
