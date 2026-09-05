/**
 * L2 — `study-guide-v1` (`03`).
 *
 * **Objective, in the spec's own words:** "Reorganize source material into a
 * structure that improves understanding. Not a rewrite of lecture notes; not a
 * compression of them."
 *
 * The test a finished guide must pass: *a student who reads this guide and then
 * re-reads the lecture should find the lecture easier to follow than they did
 * the first time.* If it is only navigable by someone who already understood
 * the lecture, it has failed.
 *
 * ⚠️ Sections marked conditional are **omitted entirely** when the source does
 * not support them. An empty section rendered as a heading with nothing under
 * it is worse than no section.
 */
import type { ArtifactSpec } from '@/lib/generation/types'

export interface GuideSectionSpec {
  id: string
  title: string
  required: 'always' | 'conditional'
  purpose: string
}

/** `03` §2 — the default skeleton, in order. */
export const STUDY_GUIDE_SECTIONS: GuideSectionSpec[] = [
  { id: 'title', title: 'TITLE', required: 'always', purpose: "The topic, in the instructor's terms." },
  { id: 'at-a-glance', title: 'AT A GLANCE', required: 'always', purpose: 'The former Lecture Brief role inside this same document: a concise connected orientation, strongest source-supported instructor emphasis, essential vocabulary in context, and highest-risk distinction. It points into the detailed guide without replacing or duplicating it.' },
  { id: 'objectives', title: 'LEARNING OBJECTIVES', required: 'conditional', purpose: 'Preserved verbatim when the professor supplied them; inferred only when clearly supported, capped at 5 and marked as inferred. Omit when neither applies — a guessed objective list is actively misleading.' },
  { id: 'core-concepts', title: 'CORE CONCEPTS', required: 'always', purpose: 'Organized by concept, not slide order.' },
  { id: 'mechanisms', title: 'MECHANISMS / PROCESSES', required: 'conditional', purpose: 'Causal or sequential processes, step by step, with why.' },
  { id: 'relationships', title: 'RELATIONSHIPS', required: 'conditional', purpose: 'Explicit connections: cause/effect, contrast, prerequisite, feedback, hierarchy.' },
  { id: 'high-yield', title: 'HIGH-YIELD DETAILS', required: 'conditional', purpose: 'Only what passes the §1.7 defensibility test.' },
  { id: 'comparisons', title: 'COMPARISONS', required: 'conditional', purpose: 'Comparison tables where two or more concepts are genuinely confusable.' },
  { id: 'confusions', title: 'COMMON CONFUSIONS', required: 'conditional', purpose: 'Plausible confusion points, with the distinction made explicit.' },
  { id: 'clinical', title: 'CLINICAL / REAL-WORLD', required: 'conditional', purpose: 'Only where the source supports it or the mode permits.' },
  { id: 'must-understand', title: 'MUST UNDERSTAND', required: 'always', purpose: 'Concepts requiring comprehension.' },
  { id: 'must-memorize', title: 'MUST MEMORIZE', required: 'always', purpose: 'Facts, terms, formulas, pathways, values requiring direct recall.' },
  { id: 'active-recall', title: 'ACTIVE RECALL', required: 'always', purpose: 'Concise self-test prompts on the concepts the guide itself marked important. Every answer must exist in the guide.' },
  { id: 'synthesis', title: 'FINAL SYNTHESIS', required: 'always', purpose: 'Compact integrated overview. Not a repeat of AT A GLANCE — it integrates after the detail rather than framing before it.' },
]

export const REQUIRED_SECTION_IDS = STUDY_GUIDE_SECTIONS
  .filter((section) => section.required === 'always')
  .map((section) => section.id)

export const STUDY_GUIDE_V1: ArtifactSpec = {
  specId: 'study-guide-v1',
  authorityDocument: 'premed-hq-documentation/specifications/generation/03-study-guide-v1.md',
  objective:
    'Reorganize the supplied source material into a structure that improves understanding. '
    + 'This is not a rewrite of the lecture notes and not a compression of them. A student who '
    + 'reads this guide and then re-reads the lecture should find the lecture easier to follow '
    + 'than they did the first time.',
  rules: [
    { id: 'SG-1', kind: 'tunable', text: 'Do not preserve bad source organization merely because it appeared in that order.' },
    { id: 'SG-2', kind: 'invariant', text: 'Do preserve sequencing when the sequence is pedagogically important.' },
    { id: 'SG-3', kind: 'tunable', text: 'Avoid paragraph walls.' },
    { id: 'SG-4', kind: 'tunable', text: 'Use hierarchy deliberately; every level must carry meaning.' },
    { id: 'SG-5', kind: 'tunable', text: 'Tables only when tabular comparison actually improves comprehension.' },
    { id: 'SG-6', kind: 'tunable', text: 'Avoid excessive bullet nesting — maximum depth 2.' },
    { id: 'SG-7', kind: 'tunable', text: 'Do not restate a concept across sections unless the repetition serves a distinct learning purpose.' },
    { id: 'SG-8', kind: 'invariant', text: 'Do not inflate output to appear comprehensive.' },
    { id: 'SG-9', kind: 'invariant', text: 'If material is incomplete, mark the gap explicitly; never invent.' },
    { id: 'SG-10', kind: 'tunable', text: 'Every major concept gets an explicit representation decision. Bullets are not the default and must be justified by structure — a process in bullets, a comparison in bullets, and a hierarchy in bullets are all defects.' },
    { id: 'SG-11', kind: 'invariant', text: 'Visual grammar is consistent across the whole artifact.' },
    { id: 'SG-SHORT-TITLE', kind: 'invariant', text: 'The TITLE section must contain one concise, content-specific label of two to six words. Omit lecture numbers, file names, and words such as generated, transcript, script, or study guide; the app owns chronology and presentation labels.' },
    { id: 'SG-AT-A-GLANCE', kind: 'invariant', text: 'The Study Guide is the one canonical lecture-learning document. Begin with an AT A GLANCE section that performs the former Lecture Brief job: give a concise connected orientation, surface the strongest source-supported instructor emphasis, anchor essential vocabulary in context, and name the highest-risk distinction or misconception. This opening is a map into the full guide, not a second summary artifact.' },
    { id: 'SG-FULL-DEPTH', kind: 'invariant', text: 'Combining the overview and guide must not reduce coverage or explanatory depth. After AT A GLANCE, teach every supported major concept, process, relationship, comparison, and application at the depth warranted by the selected sources.' },
    { id: 'SG-NO-DUPLICATE-LAYERS', kind: 'invariant', text: 'AT A GLANCE names and connects what matters; later sections expand it with mechanism, evidence, examples, and application. Do not repeat the same stand-alone explanation, list, table, or wording in both layers.' },
    {
      id: 'SG-SPLIT',
      kind: 'invariant',
      text: 'MUST UNDERSTAND and MUST MEMORIZE must not collapse into two lists of the same items. '
        + 'Test each item: could a student who has memorized this still fail to use it? Then understand. '
        + 'Could a student who understands it still not produce it from memory? Then memorize. Items may '
        + 'legitimately appear in both, but if more than about a quarter do, the split is not being made.',
    },
    {
      id: 'SG-SECTIONS',
      kind: 'invariant',
      text: 'Conditional sections are omitted entirely when the source does not support them. '
        + 'An empty section rendered as a heading with nothing under it is worse than no section.',
    },
    {
      id: 'SG-PRACTICE-EXAMPLES',
      kind: 'invariant',
      text: 'When supplied questions instantiate a concept, use their source-supported scenario, representation, or reasoning move as an explanatory example in the relevant concept, process, or relationship section. Explain what the example teaches without copying its stem or answer choices and without turning the guide into a question bank.',
    },
  ],
  outputSchema: {
    type: 'object',
    required: ['sections'],
    properties: {
      sections: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'title', 'blocks'],
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            blocks: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'type', 'provenance'],
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string', enum: ['prose', 'bullets', 'numbered', 'table', 'callout', 'gap', 'contradiction', 'must_memorize', 'must_understand', 'recall'] },
                  text: {
                    type: 'object',
                    properties: {
                      content: { type: 'string' },
                      emphasis: { type: 'array', items: { type: 'object', required: ['text', 'emphasis'], properties: { text: { type: 'string' }, emphasis: { type: 'string' } } } },
                    },
                  },
                  items: { type: 'array', items: { type: 'object', required: ['content'], properties: { content: { type: 'string' } } } },
                  provenance: { type: 'string', enum: ['source', 'clarification', 'background'] },
                  sourceRef: { type: 'object', required: ['fileId', 'chunkId', 'start', 'end'], properties: { fileId: { type: 'string' }, chunkId: { type: 'string' }, start: { type: 'number' }, end: { type: 'number' } } },
                  highYield: { type: 'boolean' },
                  basis: { type: 'string' },
                  conceptLabel: { type: 'string' },
                  conceptKind: { type: 'string' },
                  depth: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  },
}

/** `03` §7 — target block counts per coverage depth. */
export const SECTION_SIZING = {
  essential: { min: 8, max: 14, note: 'Core concepts only; conditional sections largely omitted.' },
  standard: { min: 18, max: 30, note: 'Default.' },
  thorough: { min: 30, max: 50, note: 'Every supported section.' },
} as const
