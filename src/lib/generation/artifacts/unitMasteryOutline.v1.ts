import type { ArtifactSpec } from '@/lib/generation/types'

/** The compact, source-led map that question banks and study outlines share. */
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
  objective: 'Turn the supplied course evidence into a unit mastery map. Preserve stated syllabus standards and organize each one into Understand, Be able to do, and Watch for. This map is the source contract for later study resources, not a transcript summary.',
  rules: [
    { id: 'UMO-SOURCE', kind: 'invariant', text: 'Every standard and every bullet must be traceable to at least one supplied source chunk.' },
    { id: 'UMO-STANDARDS', kind: 'invariant', text: 'Use syllabus learning standards or explicitly stated objectives as the stable standard identity. Never promote a transcript-derived concept into a Topic.' },
    { id: 'UMO-SPLIT', kind: 'invariant', text: 'Separate understanding, observable performance, and likely confusion or watch-for points. Do not repeat one sentence in all three fields.' },
    { id: 'UMO-GAPS', kind: 'invariant', text: 'If the source does not support a section, return an empty array and do not invent a learning objective.' },
    { id: 'UMO-CONCISE', kind: 'tunable', text: 'Keep each bullet concise enough to scan before studying; preserve the source wording when it carries an official objective.' },
  ],
  outputSchema: {
    type: 'object', required: ['title', 'unit', 'standards'], properties: {
      title: { type: 'string' }, unit: { type: 'string' },
      standards: { type: 'array', items: { type: 'object', required: ['id', 'title', 'understand', 'beAbleToDo', 'watchFor', 'sourceChunkIds'], properties: {
        id: { type: 'string' }, title: { type: 'string' },
        understand: { type: 'array', items: { type: 'string' } },
        beAbleToDo: { type: 'array', items: { type: 'string' } },
        watchFor: { type: 'array', items: { type: 'string' } },
        sourceChunkIds: { type: 'array', items: { type: 'string' } },
      } } },
    },
  },
}
