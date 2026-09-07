/**
 * Generation pipelines, defined by the work each artifact actually needs.
 *
 * The unit of work is a **task**, and a task is a piece of the artifact — an
 * outline, one section, one objective, the audit. It is never "a third of the
 * material". Splitting the *inputs* into equal batches would be the thing this
 * design exists to avoid: it truncates context, breaks cross-source reasoning,
 * and produces sections that cannot see each other. Splitting the *output* by
 * its own structure keeps every task grounded in all the evidence that bears on
 * it, including evidence from other sources, while making each provider request
 * small enough to finish inside one Edge invocation with room to spare.
 *
 * Each stage declares its inputs, its outputs, what it depends on, and what
 * counts as complete. A stage is persisted before its successor is scheduled,
 * and each task runs in its own invocation — a worker's lifetime is not reset
 * by starting more work inside it.
 *
 * Artifacts do not share one pipeline. A Study Guide is a document with
 * sections; a Mastery Map is a set of objectives; a Question Bank is a single
 * grounded pass with required web research and no cross-provider audit. Forcing
 * those into one shape would be the same mistake in a different place.
 */

export type StageId =
  | 'inventory'
  /** Per-source survey, used only when the corpus cannot be planned in one pass. */
  | 'survey'
  /** Reconcile the surveys into one plan. Reads topic lists, not the corpus. */
  | 'merge'
  | 'outline'
  | 'sections'
  | 'draft'
  | 'verify'
  | 'repair'
  | 'audit'
  | 'assemble'

export type StageProvider = 'none' | 'openai' | 'anthropic'

export interface StageSpec {
  id: StageId
  /** Shown to the student. One continuous experience, honestly narrated. */
  label: string
  /** Every task of these stages must be complete before this stage starts. */
  dependsOn: StageId[]
  inputs: string
  outputs: string
  /** What must be true for this stage to count as done. Enforced in the runner. */
  completion: string
  provider: StageProvider
  /**
   * Ceiling for ONE provider request in this stage, chosen to leave substantial
   * headroom under the 150s free-plan worker lifetime (400s paid) and the 150s
   * request idle timeout. A deadline is a failure control, not a promise the
   * work finishes — the stage shapes guarantee the request is small.
   */
  /**
   * Hard ceiling on ONE provider call, in milliseconds.
   *
   * This exists only to keep a call inside a worker's life. It does not
   * describe the stage's shape — `stageBudget` sizes each task from measured
   * latency and subdivides what does not fit, which is where shape belongs.
   *
   * `providerBudgetMs` already takes min(this, operator cap, remainingWorkerMs),
   * so the worker is protected by that last term whatever this says. Per-stage
   * values of 70-85s were therefore protecting against something already
   * handled, and cost roughly 55s of every fresh worker's usable 130s
   * (150s lifetime - 20s safety). A live build showed the cost directly: a
   * coverage repair estimated at 61s was killed by the 70s cap.
   */
  maxProviderMs: number
  /** This stage's tasks are created from the previous stage's output. */
  fanOut: boolean
  /** Bounded paid retries for one task of this stage. */
  maxAttempts: number
  /** A stage that may legitimately produce no tasks at all. */
  optional?: boolean
  /**
   * The reply this stage would like, and the smallest reply that would still be
   * a real answer. Sizing may trim toward the floor; below it the task is
   * SUBDIVIDED instead, because shrinking the answer to beat a clock is how
   * material gets lost.
   */
  outputTokens?: number
  minOutputTokens?: number
}

const INVENTORY: StageSpec = {
  id: 'inventory',
  label: 'Checking your material',
  dependsOn: [],
  inputs: 'The job\'s selected passage IDs and the stored source mirror.',
  outputs: 'A coverage inventory: passages per source, characters, empty passages, and the repeated-text groups used for transfer dedupe.',
  completion: 'Every selected passage ID resolves in the stored mirror and the inventory is persisted.',
  provider: 'none',
  maxProviderMs: 0,
  fanOut: false,
  maxAttempts: 2,
}

const VERIFY: StageSpec = {
  id: 'verify',
  label: 'Checking citations and coverage',
  dependsOn: [],
  inputs: 'Every generated section, the outline, and the inventory.',
  outputs: 'A verification report naming any section with an unverified citation, any required section missing, any duplicate section id, and any selected source with no cited passage.',
  completion: 'The report exists. A clean report advances the job; a dirty one schedules targeted repairs for the named sections only.',
  provider: 'none',
  maxProviderMs: 0,
  fanOut: false,
  maxAttempts: 2,
}

const REPAIR: StageSpec = {
  id: 'repair',
  label: 'Correcting flagged sections',
  dependsOn: ['verify'],
  inputs: 'Only the sections the verification report named, with their mapped passages and the reported problem.',
  outputs: 'Replacement sections for exactly those, leaving verified sections untouched.',
  completion: 'Every named section has been regenerated once, or its attempt budget is spent.',
  provider: 'openai',
  maxProviderMs: 115_000,
  fanOut: true,
  maxAttempts: 2,
  optional: true,
  outputTokens: 5_000,
  minOutputTokens: 1_500,
}

const AUDIT: StageSpec = {
  id: 'audit',
  label: 'Independent source review',
  dependsOn: ['verify'],
  inputs: 'The assembled artifact and the full corpus.',
  outputs: 'An approval, or blocking issues naming what is unsupported.',
  completion: 'The reviewer approved, or the review was unreachable and is recorded as unavailable. A rejection fails the job; nothing is saved.',
  provider: 'anthropic',
  // The review reads the artifact plus the corpus, so it is sized and, when
  // the corpus is large, run per section over that section's own evidence
  // followed by a consistency pass over the assembled claims.
  maxProviderMs: 115_000,
  fanOut: true,
  maxAttempts: 2,
  outputTokens: 2_500,
  minOutputTokens: 400,
}

const ASSEMBLE: StageSpec = {
  id: 'assemble',
  label: 'Saving your entry',
  dependsOn: ['audit'],
  inputs: 'Verified sections in outline order, the closed citation set, and the audit status.',
  outputs: 'The finished artifact persisted as the job result.',
  completion: 'The job holds a complete artifact and is marked succeeded.',
  provider: 'none',
  maxProviderMs: 0,
  fanOut: false,
  maxAttempts: 2,
}


/**
 * Hierarchical planning, used when the corpus cannot be planned in one request.
 *
 * The stage is "survey this source" — a source is a coherent unit of the
 * student's material, not an arbitrary fraction of it. Each survey reads one
 * source in full and returns a topic list with exact passage IDs, which is a
 * small reply. The merge stage then reads only those topic lists and produces
 * the section plan, so it never carries the corpus at all.
 *
 * When one source is itself larger than a single request can hold, its survey
 * runs as ordered spans of that source's own passage sequence. That is an
 * execution detail of surveying an oversized document, not a definition of a
 * stage: every passage is surveyed exactly once, provenance is preserved, and
 * the merge is what re-establishes meaning across the spans.
 */
const SURVEY: StageSpec = {
  id: 'survey',
  label: 'Reading each source',
  dependsOn: ['inventory'],
  inputs: 'One source (or one ordered span of an oversized source), in full, with the assembled specification.',
  outputs: 'That source\'s topics, each with the exact passage IDs supporting it, plus any qualifications the instructor attaches to them.',
  completion: 'Every source has been surveyed, and every passage of every source appears in exactly one survey.',
  provider: 'openai',
  maxProviderMs: 115_000,
  fanOut: true,
  maxAttempts: 2,
  outputTokens: 3_000,
  minOutputTokens: 800,
  optional: true,
}

const MERGE: StageSpec = {
  id: 'merge',
  label: 'Reconciling the sources',
  dependsOn: ['survey'],
  inputs: 'Every survey\'s topic list. Not the corpus — this stage is small by shape, not by trimming.',
  outputs: 'One section plan whose sections may draw on topics from several sources, with the passage IDs carried through unchanged.',
  completion: 'Every surveyed topic is either placed in a section or explicitly set aside with a reason.',
  provider: 'openai',
  maxProviderMs: 115_000,
  fanOut: false,
  maxAttempts: 2,
  outputTokens: 4_000,
  minOutputTokens: 1_200,
  optional: true,
}

/**
 * Coverage repair: passages the plan never accounted for.
 *
 * Verification checks against the ORIGINAL inventory, not the plan, so a plan
 * that quietly forgot part of the material is caught rather than believed.
 */
const COVERAGE: StageSpec = {
  id: 'repair',
  label: 'Covering missed material',
  dependsOn: ['verify'],
  inputs: 'The specific passages no section accounted for, with their source and neighbouring context.',
  outputs: 'Placement of those passages into an existing section, or an explicit, reasoned exclusion.',
  completion: 'Every original passage is cited, placed, or excluded with a stated reason.',
  provider: 'openai',
  maxProviderMs: 115_000,
  fanOut: true,
  maxAttempts: 2,
  outputTokens: 4_000,
  minOutputTokens: 1_000,
  optional: true,
}

/**
 * Documents with sections: Study Guide and the notebook pages.
 *
 * The plan comes first and is cheap — a section list plus, for each section,
 * the passages that support it, chosen from the WHOLE corpus. Then each section
 * is written in its own request, seeing its mapped passages in full plus the
 * plan and its neighbours' headings, so the document coheres instead of reading
 * like separately commissioned essays.
 */
const SECTIONED: StageSpec[] = [
  INVENTORY,
  SURVEY,
  MERGE,
  {
    id: 'outline',
    label: 'Planning the structure',
    dependsOn: ['inventory', 'merge'],
    inputs: 'The complete deduplicated corpus, the assembled specification, and the coverage briefing.',
    outputs: 'An ordered section plan; per section a title, a purpose, and the exact passage IDs that support it. Plus a coverage statement naming any source the plan does not use, and why.',
    completion: 'Every planned section references at least one passage that resolves, and every selected source is either used by some section or explicitly named as unusable with a reason.',
    provider: 'openai',
    // Deliberately small output: a plan, not prose. When the corpus is too
    // large even for a plan-shaped reply, the survey/merge stages run instead —
    // the sizing decision is made before the request is sent, not discovered.
    maxProviderMs: 115_000,
    fanOut: false,
    maxAttempts: 2,
    outputTokens: 4_000,
    minOutputTokens: 1_200,
  },
  {
    id: 'sections',
    label: 'Writing each section',
    dependsOn: ['outline'],
    inputs: 'One planned section: its mapped passages at full length, the whole plan for context, and any cross-source passages the plan linked to it.',
    outputs: 'That section\'s blocks, each source-backed block carrying a sourceRef.',
    completion: 'Every planned section has a persisted, structurally valid result.',
    provider: 'openai',
    maxProviderMs: 115_000,
    fanOut: true,
    maxAttempts: 2,
    outputTokens: 5_000,
    // Below this a section would be a stub. A section that cannot be written
    // within budget is split along its own subpoints instead.
    minOutputTokens: 1_500,
  },
  { ...VERIFY, dependsOn: ['sections'] },
  COVERAGE,
  AUDIT,
  ASSEMBLE,
]

/**
 * The Mastery Map is a set of objectives, not a document. Same shape of work,
 * different unit: the plan enumerates objectives and their evidence, and each
 * objective is then developed with its cues, applications and practice.
 */
const OBJECTIVES: StageSpec[] = [
  INVENTORY,
  { ...SURVEY, label: 'Reading each source' },
  { ...MERGE, label: 'Reconciling the sources' },
  {
    id: 'outline',
    label: 'Identifying the objectives',
    dependsOn: ['inventory', 'merge'],
    inputs: 'The complete deduplicated corpus, the assembled specification, and the coverage briefing.',
    outputs: 'The objective list; per objective a title and the exact passage IDs that support it, preserving explicit instructor objectives where the material states them.',
    completion: 'At least one objective, every objective\'s passages resolve, and every selected source is used or explicitly explained.',
    provider: 'openai',
    maxProviderMs: 115_000,
    fanOut: false,
    maxAttempts: 2,
    outputTokens: 4_000,
    minOutputTokens: 1_200,
  },
  {
    id: 'sections',
    label: 'Developing each objective',
    dependsOn: ['outline'],
    inputs: 'One objective: its mapped passages at full length, plus the objective list for context.',
    outputs: 'That objective\'s recall cues, understanding points, applications, watch-fors and practice, with exact passage IDs.',
    completion: 'Every objective has a persisted, structurally valid result.',
    provider: 'openai',
    maxProviderMs: 115_000,
    fanOut: true,
    maxAttempts: 2,
    outputTokens: 5_000,
    minOutputTokens: 1_500,
  },
  { ...VERIFY, dependsOn: ['sections'] },
  COVERAGE,
  AUDIT,
  ASSEMBLE,
]

/**
 * Small artifacts — flashcards, a reading summary, revised notes, a mock, a
 * term report — are one coherent object whose value comes from being authored
 * in a single pass. Splitting them would invent seams the artifact does not
 * have, so they keep one drafting task and gain the durability, verification
 * and audit stages around it.
 */
const SINGLE_PASS: StageSpec[] = [
  INVENTORY,
  {
    id: 'draft',
    label: 'Generating from your material',
    dependsOn: ['inventory'],
    inputs: 'The complete deduplicated corpus and the assembled specification.',
    outputs: 'The whole artifact in one structured response.',
    completion: 'A structurally valid artifact is persisted.',
    provider: 'openai',
    maxProviderMs: 115_000,
    fanOut: false,
    maxAttempts: 2,
    outputTokens: 8_000,
    minOutputTokens: 2_000,
  },
  { ...VERIFY, dependsOn: ['draft'] },
  { ...REPAIR, fanOut: false },
  AUDIT,
  ASSEMBLE,
]

/**
 * Unit Question Bank V1 keeps its Anthropic-only carve-out: Claude authors the
 * stimulus sets in one grounded pass with required official-pattern research,
 * the server closes every reference, and there is no cross-provider audit and
 * no OpenAI fallback. Giving it the section pipeline would break the single
 * grounded pass its specification requires.
 */
const QUESTION_BANK: StageSpec[] = [
  INVENTORY,
  {
    id: 'draft',
    label: 'Building the question bank',
    dependsOn: ['inventory'],
    inputs: 'The complete corpus, selected image derivatives, and the required official assessment-pattern search.',
    outputs: 'The validated stimulus sets in one grounded pass.',
    completion: 'A structurally valid bank whose required web research was actually performed.',
    provider: 'anthropic',
    maxProviderMs: 115_000,
    fanOut: false,
    maxAttempts: 2,
    outputTokens: 24_000,
    minOutputTokens: 6_000,
  },
  { ...VERIFY, dependsOn: ['draft'] },
  { ...ASSEMBLE, dependsOn: ['verify'] },
]

const PIPELINES: Record<string, StageSpec[]> = {
  'study-guide-v1': SECTIONED,
  'notebook-entry-v1': SECTIONED,
  'notebook-assessment-v1': SECTIONED,
  'notebook-assignment-v1': SECTIONED,
  'unit-mastery-outline-v1': OBJECTIVES,
  'unit-question-bank-v1': QUESTION_BANK,
  'flashcards-v1': SINGLE_PASS,
  'class-full-mock-v1': SINGLE_PASS,
  'reading-summary-v1': SINGLE_PASS,
  'revised-notes-v1': SINGLE_PASS,
  'term-report-v1': SINGLE_PASS,
}

export function pipelineFor(specId: string): StageSpec[] {
  return PIPELINES[specId] ?? SINGLE_PASS
}

export function stageSpec(specId: string, stage: StageId): StageSpec | undefined {
  return pipelineFor(specId).find((entry) => entry.id === stage)
}

/** The stage that follows `stage`, or undefined when the pipeline is finished. */
export function nextStage(specId: string, stage: StageId): StageId | undefined {
  const pipeline = pipelineFor(specId)
  const index = pipeline.findIndex((entry) => entry.id === stage)
  return index >= 0 ? pipeline[index + 1]?.id : undefined
}

export function firstStage(specId: string): StageId {
  return pipelineFor(specId)[0].id
}

/**
 * Progress for the composer: one continuous bar over the whole pipeline,
 * weighted so the section stage does not appear to stall while it does most of
 * the work. `done` and `total` count tasks within the current stage.
 */
export function pipelineProgress(specId: string, stage: StageId, done: number, total: number) {
  const pipeline = pipelineFor(specId)
  const index = Math.max(0, pipeline.findIndex((entry) => entry.id === stage))
  const withinStage = total > 0 ? Math.min(done / total, 1) : 0
  return Math.min(0.99, (index + withinStage) / pipeline.length)
}
