import type { ArtifactSpec } from '@/lib/generation/types'

/** The detailed, source-led map that question banks and study guides share. */
export interface MasteryStandard {
  id: string
  title: string
  understand: string[]
  beAbleToDo: string[]
  watchFor: string[]
  sourceChunkIds: string[]
}

export interface UnitMasteryOutlineArtifact {
  title: string
  unit: string
  standards: MasteryStandard[]
}

export const UNIT_MASTERY_OUTLINE_V1: ArtifactSpec = {
  specId: 'unit-mastery-outline-v1',
  authorityDocument: 'premed-hq-documentation/specifications/generation/11-unit-mastery-outline-v1.md',
  objective: 'Turn the supplied course evidence into a detailed mastery map. Preserve every explicit objective relevant to the requested scope and organize its distinct source-supported subpoints into Understand, Be able to do, and Watch for. This map is the source contract for later study resources, not a transcript summary.',
  rules: [
    { id: 'UMO-SOURCE', kind: 'invariant', text: 'Every standard and every bullet must be traceable to at least one supplied source chunk.' },
    { id: 'UMO-STANDARDS', kind: 'invariant', text: 'Use syllabus learning standards or explicitly stated objectives as the stable standard identity. Never promote a transcript-derived concept into a Topic.' },
    { id: 'UMO-COVERAGE', kind: 'invariant', text: 'Preserve every explicit objective relevant to the requested lecture, unit, or exam scope and every distinct supported subpoint. Do not merge separate objectives or compress a detailed source outline into a summary.' },
    { id: 'UMO-SPLIT', kind: 'invariant', text: 'Separate understanding, observable performance, and likely confusion or watch-for points. Do not repeat one sentence in all three fields.' },
    { id: 'UMO-DEPTH', kind: 'invariant', text: 'Every saved objective must contain at least five distinct Understand bullets, two objective-specific Be able to do bullets, and one concrete Watch for bullet. If selected sources cannot support that depth, fail instead of padding or inventing.' },
    { id: 'UMO-GAPS', kind: 'invariant', text: 'If the source does not support the required sections or depth, do not invent content and do not save a partial objective.' },
    { id: 'UMO-CONCISE', kind: 'tunable', text: 'Keep each bullet concise enough to scan before studying; preserve source wording when it carries an official objective, and never reuse a generic application sentence across objectives.' },
    { id: 'UMO-PRACTICE-EVIDENCE', kind: 'invariant', text: 'Use supplied questions as evidence of observable tasks, representations, distinctions, and likely traps. Translate those patterns into concrete Be able to do and Watch for bullets without copying stems or treating distractors as facts.' },
  ],
  outputSchema: {
    type: 'object', required: ['title', 'unit', 'standards'], properties: {
      title: { type: 'string' }, unit: { type: 'string' },
      standards: { type: 'array', items: { type: 'object', required: ['id', 'title', 'understand', 'beAbleToDo', 'watchFor', 'sourceChunkIds'], properties: {
        id: { type: 'string' }, title: { type: 'string' },
        understand: { type: 'array', minItems: 5, items: { type: 'string' } },
        beAbleToDo: { type: 'array', minItems: 2, items: { type: 'string' } },
        watchFor: { type: 'array', minItems: 1, items: { type: 'string' } },
        sourceChunkIds: { type: 'array', items: { type: 'string' } },
      } } },
    },
  },
}
