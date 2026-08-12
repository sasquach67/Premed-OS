/* Part 4 — rules-based recommendations.
 *
 * Explainable, ranked, actionable advice derived entirely from rules over the
 * entity graph. There is no model call anywhere in this file.
 *
 * PERMISSION-FIRST: every recommendation ends in a link or a *draft* the user
 * confirms. Nothing here mutates data. `taskDraft` is a suggested title only —
 * the user creates the task, the engine never does (architecture/02
 * "Recommendation vs Automation": as long as judgment is required, recommend).
 *
 * Recommendations are deliberately NOT one of the attention bell's three feeds
 * (shell §7.5 fixes those as deadlines / data-health / system). They surface on
 * Overview's Smart Next Actions (spec 03 §6.3) via `smartNextActions()`, so a
 * single underlying condition never double-reports in two places at once.
 */
import type { AppData, CollectionRecord, ExperienceEntry, RecommendationRecord } from '@/lib/types'
import { normalizeEntityName } from '@/lib/entityMatching'
import { daysSinceUpdate, parseIsoDate, pillarSignals } from './derived'
import { dedupCandidates } from './dedup'
import { INTELLIGENCE_THRESHOLDS, type ConfidenceLevel, type Explained, type Severity } from './types'

/** Lifecycle states a recommendation moves through (architecture/02
 *  "Recommendation Lifecycles"). `generated` is implicit — anything returned by
 *  the engine and not yet acted on is generated/presented. The persisted shape
 *  lives in `lib/types.ts` alongside the rest of Settings. */
export type RecommendationStatus = RecommendationRecord['status']

export interface Recommendation extends Explained {
  /** Stable instance identity: `${ruleId}:${entityId}`. Dismissals key off this. */
  id: string
  ruleId: string
  title: string
  severity: Severity
  /** impact × urgency × confidence. Higher sorts first. Presentational ordering only. */
  rank: number
  route: string
  actionLabel: string
  entityId?: string
  entityLabel?: string
  /** Exact factual phrase emphasized in the UI's explanation line. */
  cause?: string
  /** Suggested task title the user may accept. NEVER auto-created. */
  taskDraft?: string
}

/** Internal-only weighting. Deterministic rules use confidence 1 — their
 *  triggering condition is objectively true. Only the dedup-sourced rule
 *  carries real uncertainty, so only it discounts below 1. No confidence value
 *  is ever exposed on a deterministic recommendation (part 6: never fabricate). */
const CONFIDENCE_WEIGHT: Record<ConfidenceLevel, number> = { high: 1, moderate: 0.7, low: 0.4 }

function rank(impact: number, urgency: number, confidence = 1): number {
  return impact * urgency * confidence
}

function text(value?: string): boolean {
  return Boolean(value && value.trim())
}

function experienceRoute(entry: ExperienceEntry): string {
  const routes: Record<string, string> = {
    clinical: '/clinical', volunteering: '/volunteering', shadowing: '/shadowing',
    research: '/research', leadership: '/ecs',
  }
  return routes[entry.category] ?? '/clinical'
}

/* ---------------------------------------------------------------------------
 * Rules
 * ------------------------------------------------------------------------- */

function addVerifierRule(data: AppData): Recommendation[] {
  return data.experiences
    .filter((entry) => !entry.deletedAt && entry.status === 'active' && (entry.hours || 0) > 0)
    .filter((entry) => !text(entry.supervisor) && !entry.supervisorId)
    .map((entry) => ({
      id: `add-verifier:${entry.id}`,
      ruleId: 'add-verifier',
      title: `Add a verifier for ${entry.org || entry.role}`,
      severity: 'important' as const,
      rank: rank(3, 2),
      why: `${entry.hours} active hours at ${entry.org || 'this site'} have no one who can confirm them, and AMCAS requires a contact.`,
      route: experienceRoute(entry),
      actionLabel: 'Add contact',
      entityId: entry.id,
      entityLabel: entry.org || entry.role,
      taskDraft: `Get verifier contact for ${entry.org || entry.role}`,
    }))
}

function reflectionToStoryRule(data: AppData): Recommendation[] {
  const linked = new Set(data.stories.map((story) => story.relatedExperienceId).filter(Boolean))
  return data.experiences
    .filter((entry) => !entry.deletedAt && text(entry.mostMeaningful) && !linked.has(entry.id))
    .map((entry) => ({
      id: `reflection-to-story:${entry.id}`,
      ruleId: 'reflection-to-story',
      title: `Send your ${entry.org || entry.role} reflection to the Story Bank`,
      severity: 'suggested' as const,
      rank: rank(2, 1),
      why: `You wrote a reflection on ${entry.org || entry.role} that isn't in the Story Bank yet, so it won't be there when you draft essays.`,
      route: '/essays',
      actionLabel: 'Open Story Bank',
      entityId: entry.id,
      entityLabel: entry.org || entry.role,
    }))
}

function researchPiRecommenderRule(data: AppData): Recommendation[] {
  const recommenders = new Set(
    data.letters.filter((letter) => !letter.deletedAt).map((letter) => normalizeEntityName(letter.recommender))
  )
  return data.experiences
    .filter((entry) => !entry.deletedAt && entry.category === 'research' && text(entry.supervisor))
    .filter((entry) => !recommenders.has(normalizeEntityName(entry.supervisor ?? '')))
    .map((entry) => ({
      id: `research-pi-recommender:${entry.id}`,
      ruleId: 'research-pi-recommender',
      title: `Consider ${entry.supervisor} as a recommender`,
      severity: 'important' as const,
      rank: rank(3, 2),
      why: `${entry.supervisor} supervises your research at ${entry.org || 'your lab'} but isn't on your letter list — research PIs write the strongest science letters.`,
      route: '/letters',
      actionLabel: 'Open letters',
      entityId: entry.id,
      entityLabel: entry.supervisor,
      taskDraft: `Ask ${entry.supervisor} for a letter of recommendation`,
    }))
}

function exposureGoingStaleRule(data: AppData, now: Date): Recommendation[] {
  const out: Recommendation[] = []
  for (const category of ['clinical', 'volunteering', 'shadowing'] as const) {
    const signals = pillarSignals(data.experiences, category, now)
    if (!signals.entryCount || !signals.activeCount) continue
    const idle = signals.daysSinceActivity
    if (idle == null || idle <= INTELLIGENCE_THRESHOLDS.staleExperienceDays) continue
    out.push({
      id: `exposure-going-stale:${category}`,
      ruleId: 'exposure-going-stale',
      title: `Log recent ${category} hours`,
      severity: 'important',
      rank: rank(3, 3),
      why: `Nothing has been logged in ${category} for ${idle} days, so your ${signals.totalHours}h total is going stale.`,
      route: `/${category}`,
      actionLabel: 'Log hours',
      entityLabel: category,
      taskDraft: `Log recent ${category} hours`,
    })
  }
  return out
}

function letterFollowUpRule(data: AppData, now: Date): Recommendation[] {
  return data.letters
    .filter((letter) => !letter.deletedAt && letter.status === 'asked')
    .map((letter) => ({ letter, asked: parseIsoDate(letter.dateAsked) }))
    .filter(({ asked }) => Boolean(asked))
    .map(({ letter, asked }) => ({
      letter,
      waiting: Math.max(0, Math.round((now.getTime() - (asked as Date).getTime()) / 86_400_000)),
    }))
    .filter(({ waiting }) => waiting > INTELLIGENCE_THRESHOLDS.letterFollowUpDays)
    .map(({ letter, waiting }) => ({
      id: `letter-follow-up:${letter.id}`,
      ruleId: 'letter-follow-up',
      title: `Follow up with ${letter.recommender}`,
      severity: 'important' as const,
      rank: rank(3, 3),
      why: `You asked ${letter.recommender} ${waiting} days ago and they haven't agreed yet.`,
      route: '/letters',
      actionLabel: 'Open letters',
      entityId: letter.id,
      entityLabel: letter.recommender,
      taskDraft: `Follow up with ${letter.recommender} about your letter`,
    }))
}

function archiveCompletedRule(data: AppData, now: Date): Recommendation[] {
  return data.experiences
    .filter((entry) => !entry.deletedAt && entry.status === 'completed' && !entry.archived)
    .map((entry) => ({ entry, idle: daysSinceUpdate(entry, now) }))
    .filter(({ idle }) => idle != null && idle > INTELLIGENCE_THRESHOLDS.archiveCompletedAfterDays)
    .map(({ entry, idle }) => ({
      id: `archive-completed:${entry.id}`,
      ruleId: 'archive-completed',
      title: `Archive ${entry.org || entry.role}`,
      severity: 'suggested' as const,
      rank: rank(1, 1),
      why: `${entry.org || entry.role} finished and hasn't changed in ${idle} days — archiving keeps your active list honest.`,
      route: experienceRoute(entry),
      actionLabel: 'Open pillar',
      entityId: entry.id,
      entityLabel: entry.org || entry.role,
    }))
}

function linkOrganizationRule(data: AppData): Recommendation[] {
  const organizations = data.organizations.filter((org) => !org.archived && !org.deletedAt)
  if (!organizations.length) return []
  return data.experiences
    .filter((entry) => !entry.deletedAt && text(entry.org) && !entry.organizationId)
    .map((entry) => ({
      entry,
      match: organizations.find((org) => normalizeEntityName(org.name) === normalizeEntityName(entry.org)),
    }))
    .filter((row): row is { entry: CollectionRecord<ExperienceEntry>; match: NonNullable<typeof row.match> } => Boolean(row.match))
    .map(({ entry, match }) => ({
      id: `link-organization:${entry.id}`,
      ruleId: 'link-organization',
      title: `Link ${entry.org} to your organization record`,
      severity: 'suggested' as const,
      rank: rank(2, 1),
      why: `"${entry.org}" is typed as free text here but already exists as an organization — linking them keeps hours and contacts together.`,
      route: experienceRoute(entry),
      actionLabel: 'Open pillar',
      entityId: entry.id,
      entityLabel: match.name,
    }))
}

function resolveDuplicatesRule(data: AppData): Recommendation[] {
  const candidates = dedupCandidates(data)
  if (!candidates.length) return []
  const strongest = candidates[0]
  return [{
    id: 'resolve-duplicates:all',
    ruleId: 'resolve-duplicates',
    title: candidates.length === 1 ? 'Review a possible duplicate' : `Review ${candidates.length} possible duplicates`,
    severity: 'suggested',
    // The only rule whose trigger is genuinely uncertain, so it is the only one
    // that discounts its rank by match confidence.
    rank: rank(2, 1, CONFIDENCE_WEIGHT[strongest.confidence]),
    why: `${strongest.why} Duplicates split your hours and contacts across two records.`,
    route: strongest.route,
    actionLabel: 'Review',
  }]
}

/** Every recommendation the rules produce, before suppression. Exposed for
 *  tests and debugging; product surfaces should call `smartNextActions`. */
export function generateRecommendations(data: AppData, now: Date = new Date()): Recommendation[] {
  return [
    ...addVerifierRule(data),
    ...exposureGoingStaleRule(data, now),
    ...letterFollowUpRule(data, now),
    ...researchPiRecommenderRule(data),
    ...linkOrganizationRule(data),
    ...reflectionToStoryRule(data),
    ...archiveCompletedRule(data, now),
    ...resolveDuplicatesRule(data),
  ].sort((a, b) => b.rank - a.rank)
}

/* ---------------------------------------------------------------------------
 * Suppression + alert-fatigue guard
 * ------------------------------------------------------------------------- */

/** Rules that may be muted wholesale after repeated dismissals.
 *  `blocking` is deliberately absent: a blocking problem must always surface,
 *  no matter how many times it has been waved away. */
export function isMutableSeverity(severity: Severity): boolean {
  return severity === 'suggested' || severity === 'important'
}

/** How many distinct instances of a rule the user has dismissed. Drives the
 *  rule-level mute threshold. */
export function ruleDismissalCount(data: AppData, ruleId: string): number {
  const state = data.settings.recommendationState ?? {}
  return Object.entries(state)
    .filter(([id, record]) => record.status === 'dismissed' && id.startsWith(`${ruleId}:`))
    .length
}

/** Recommendations after lifecycle + fatigue filtering, ranked, capped.
 *
 *  Suppression order:
 *  1. per-instance — an accepted/dismissed instance never returns (the default);
 *  2. rule-level mute — only for non-blocking rules the user muted;
 *  3. cap — protects attention (spec 03 §6.3 caps at 3). */
export function smartNextActions(
  data: AppData,
  options: { now?: Date; limit?: number } = {}
): Recommendation[] {
  const { now = new Date(), limit = INTELLIGENCE_THRESHOLDS.maxSmartActions } = options
  const state = data.settings.recommendationState ?? {}
  const muted = data.settings.mutedRecommendationRules ?? {}

  return generateRecommendations(data, now)
    .filter((rec) => !state[rec.id])
    .filter((rec) => rec.severity === 'blocking' || !muted[rec.ruleId])
    .slice(0, Math.max(0, limit))
}

function termBeforeMcat(targetDate: string) {
  const date = parseIsoDate(targetDate)
  if (!date) return ''
  return date.getMonth() < 5 ? `Fall ${date.getFullYear() - 1}` : `Spring ${date.getFullYear()}`
}

function unscheduledPrereqRule(data: AppData): Recommendation[] {
  if (!data.mcat.targetDate) return []
  const missing = data.requirements.filter((requirement) => {
    if (requirement.done || !/pre.?med/i.test(requirement.group)) return false
    const codes = requirement.satisfiedBy ?? []
    if (!codes.length) return false
    return !data.courses.some((course) =>
      course.status !== 'completed' && course.status !== 'planned'
        ? false
        : codes.some((code) => course.code.replace(/\s+/g, '').toLowerCase() === code.replace(/\s+/g, '').toLowerCase())
    )
  })
  if (missing.length !== 1) return []
  const requirement = missing[0]
  const deadlineTerm = termBeforeMcat(data.mcat.targetDate)
  if (!deadlineTerm) return []
  const cause = `Last MCAT prereq — take by ${deadlineTerm}`
  return [{
    id: `academics-unscheduled-prereq:${requirement.id}:${deadlineTerm}`,
    ruleId: 'academics-unscheduled-prereq',
    title: 'Unscheduled med prereq',
    severity: 'important',
    rank: rank(3, 3),
    why: `${cause}. ${requirement.label} is not in a completed or planned term.`,
    cause,
    route: '/academics?mode=planning&tab=planner',
    actionLabel: 'Plan it',
    entityId: requirement.id,
    entityLabel: requirement.label,
  }]
}

function coveredNeverReviewedRule(data: AppData): Recommendation[] {
  const covered = new Set(data.academics.classCenter.assignments.flatMap((assignment) => assignment.coveredTopicIds ?? []))
  return data.academics.classCenter.topics.flatMap((topic) => {
    if (!covered.has(topic.id)) return []
    const keyPoints = data.academics.classCenter.keyPoints.filter((point) => point.topicId === topic.id)
    if (!keyPoints.length || keyPoints.some((point) => point.timesSurfaced > 0)) return []
    const course = data.courses.find((item) => item.id === topic.courseId)
    const cause = `${topic.unit || topic.title} was covered and never reviewed`
    return [{
      id: `academics-covered-never-reviewed:${topic.id}`,
      ruleId: 'academics-covered-never-reviewed',
      title: 'Covered but never reviewed',
      severity: 'important' as const,
      rank: rank(3, 2),
      why: `${cause}. Surface it once while the lecture context is still fresh.`,
      cause,
      route: `/academics/classes/${topic.courseId}`,
      actionLabel: 'Review it',
      entityId: topic.id,
      entityLabel: `${course?.code ?? 'Class'} · ${topic.title}`,
    }]
  })
}

function noSyllabusRule(data: AppData): Recommendation[] {
  const center = data.academics.classCenter
  return center.workspaces.flatMap((workspace) => {
    if (workspace.status !== 'active') return []
    const syllabusIds = center.files
      .filter((file) => file.courseId === workspace.courseId && file.type === 'syllabus')
      .map((file) => file.id)
    const parsed = center.sourceChunks.some((chunk) => syllabusIds.includes(chunk.fileId))
    if (parsed) return []
    const course = data.courses.find((item) => item.id === workspace.courseId)
    if (!course) return []
    const cause = `${course.code || course.title} has no syllabus`
    return [{
      id: `academics-no-syllabus:${course.id}`,
      ruleId: 'academics-no-syllabus',
      title: 'No syllabus imported',
      severity: 'important' as const,
      rank: rank(3, 2),
      why: `${cause} — weeks and grade weights are unknown.`,
      cause,
      route: `/academics/classes/${course.id}`,
      actionLabel: 'Import syllabus',
      entityId: course.id,
      entityLabel: course.code,
    }]
  })
}

/** D2's Academics-only deterministic rules. Uses the same lifecycle and
 * dismissal store as Smart next actions without leaking these onto Overview. */
export function academicsNextActions(
  data: AppData,
  options: { now?: Date; limit?: number } = {},
): Recommendation[] {
  const limit = options.limit ?? 3
  const state = data.settings.recommendationState ?? {}
  const muted = data.settings.mutedRecommendationRules ?? {}
  return [
    ...unscheduledPrereqRule(data),
    ...coveredNeverReviewedRule(data),
    ...noSyllabusRule(data),
  ]
    .sort((a, b) => b.rank - a.rank)
    .filter((rec) => !state[rec.id])
    .filter((rec) => rec.severity === 'blocking' || !muted[rec.ruleId])
    .slice(0, Math.max(0, limit))
}
