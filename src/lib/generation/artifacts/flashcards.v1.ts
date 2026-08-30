import type { ArtifactSpec } from '@/lib/generation/types'

/** Flashcards V1: generated only from the student's closed material set. */
export const FLASHCARDS_V1: ArtifactSpec = {
  specId: 'flashcards-v1',
  objective: 'Build a concept map before writing cards. Create concise, recall-ready retrieval cards only from the supplied student material. Prefer load-bearing and attaching concepts; move incidental facts to Extra. Every card must carry one material citation.',
  rules: [
    { id: 'FC-SOURCE', kind: 'invariant', text: 'Every card must cite one supplied material chunk. Never use bundled or general course knowledge.' },
    { id: 'FC-EXTRA', kind: 'invariant', text: 'Extra is never tested. Use an own-line Ex: bridge only when it makes an abstract source-supported concept concrete without adding an independent tested fact.' },
    { id: 'FC-19', kind: 'invariant', text: 'A comparison names its axis. A framework has exactly one FREE_RECALL blurt card with 3–7 independently gradeable, complete-sentence items.' },
    { id: 'FC-20', kind: 'invariant', text: 'When the source supplies an abstract concept and a concrete example, create paired EXEMPLAR cards in both directions.' },
    { id: 'FC-21', kind: 'invariant', text: 'Cloze the definition rather than merely hiding the term. Declare the cloze pattern; only term-deletion clozes carry a justification.' },
    { id: 'FC-22', kind: 'invariant', text: 'Each prompt is self-sufficient when shuffled: name the answer space, do not use lecture deixis or an unanchored change/comparison.' },
    { id: 'FC-27', kind: 'invariant', text: 'Use concise memory wording: explanatory backs and blurt items are complete sentences with a named subject and finite verb. Avoid em and en dashes.' },
    { id: 'FC-28', kind: 'invariant', text: 'For every load-bearing notation, count, table, or diagram relationship, generate an interpretation card that asks what it means and a transfer card that asks why it changes or what follows. A label-only card may support the visual, but never substitutes for understanding it.' },
    { id: 'FC-29', kind: 'invariant', text: 'When a supplied figure encodes spatial, causal, or temporal structure, use visual retrieval where the figure materially improves recall. Pair each visual target with a concise conceptual card explaining the relationship represented; do not use images as decoration.' },
  ],
  outputSchema: {
    type: 'object', required: ['cards'], properties: {
      cards: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'type', 'conceptId', 'sourceChunkId', 'tags', 'salience', 'difficultyEstimate'],
          properties: {
            id: { type: 'string' },
            type: { enum: ['basic', 'cloze', 'conceptual', 'process', 'comparison', 'application', 'exemplar', 'free-recall'] },
            front: { type: 'string' }, back: { type: 'string' }, cloze: { type: 'string' }, extra: { type: 'string' },
            conceptId: { type: 'string' }, sourceChunkId: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } },
            clozePattern: { enum: ['single', 'independent', 'enumerated-list', 'definition'] }, listOrdered: { type: 'boolean' }, termJustification: { type: 'string' },
            exemplarDirection: { enum: ['instance-to-concept', 'concept-to-instance'] }, recallItems: { type: 'array', items: { type: 'string' } }, axis: { type: 'string' },
            salience: { enum: ['load-bearing', 'attaching'] }, difficultyEstimate: { enum: [1, 2, 3, 4, 5] }, conceptKind: { enum: ['framework'] }, relational: { type: 'boolean' },
          },
        },
      },
    },
  },
}
