import type { ArtifactSpec } from '@/lib/generation/types'

/** Flashcards V1: generated only from the student's closed material set. */
export const FLASHCARDS_V1: ArtifactSpec = {
  specId: 'flashcards-v1',
  objective: 'Create precise retrieval-practice cards only from the supplied student material. Each card must carry one material citation.',
  rules: [
    { id: 'FC-SOURCE', kind: 'invariant', text: 'Every card must cite one supplied material chunk. Never use bundled or general course knowledge.' },
    { id: 'FC-EXTRA', kind: 'invariant', text: 'Use an own-line Ex: bridge in Extra only when it makes an abstract source-supported concept concrete without adding an independent tested fact.' },
    { id: 'FC-QUALITY', kind: 'invariant', text: 'Reject malformed clozes, unsupported card types, missing citations, stock prompts, and unanchored comparisons.' },
    { id: 'FC-27', kind: 'tunable', text: 'Avoid em dashes and en dashes in card prose.' },
  ],
  outputSchema: {
    type: 'object', required: ['cards'], properties: {
      cards: { type: 'array', items: { type: 'object', required: ['type', 'conceptId', 'sourceChunkId', 'tags'] } },
    },
  },
}
