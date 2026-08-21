import type { ArtifactSpec } from '@/lib/generation/types'

/**
 * Revised Notes is a source-only repair task: make the student's lecture
 * record coherent without turning it into a study guide or textbook chapter.
 */
export const REVISED_NOTES_V1: ArtifactSpec = {
  specId: 'revised-notes-v1',
  objective: 'Create one accurate, readable revised-notes document from only the selected student-supplied sources. The explicitly named student-notes baseline owns the organization, language, and emphasis; selected transcript, instructor material, and bounded excerpts may only add or clarify details they directly support. Preserve meaningful instructor terms and distinctions. When sources conflict or do not settle a detail, label the uncertainty. Do not add outside course knowledge. Keep a source trace beside every merged passage.',
  rules: [
    { id: 'RN-SOURCE-ONLY', kind: 'invariant', text: 'Every factual passage has source provenance and one or more verified source references. Do not use clarification or background knowledge.' },
    { id: 'RN-BASELINE', kind: 'invariant', text: 'Treat the explicitly named student-notes file as the baseline. Preserve its organization, language, and emphasis where selected sources support them; do not turn the result into a study guide, textbook chapter, or replacement for the original notes.' },
    { id: 'RN-TERMS', kind: 'invariant', text: 'Preserve meaningful instructor terminology and qualifiers from course material.' },
    { id: 'RN-CONFLICT', kind: 'invariant', text: 'Never silently resolve a disagreement. Put competing supported details in an Unresolved source difference block with both traces.' },
    { id: 'RN-RECORD', kind: 'tunable', text: 'Organize a coherent lecture record by meaningful concept or sequence, without inflating it into a study guide.' },
  ],
  outputSchema: {
    type: 'object', additionalProperties: false, required: ['title', 'sections', 'unresolvedDifferences'], properties: {
      title: { type: 'string' },
      sections: {
        type: 'array', minItems: 1, items: {
          type: 'object', additionalProperties: false, required: ['id', 'title', 'passages'], properties: {
            id: { type: 'string' }, title: { type: 'string' },
            passages: {
              type: 'array', minItems: 1, items: {
                type: 'object', additionalProperties: false, required: ['id', 'content', 'provenance', 'sourceRefs'], properties: {
                  id: { type: 'string' }, title: { type: 'string' }, content: { type: 'string' },
                  provenance: { const: 'source' },
                  sourceRefs: { type: 'array', minItems: 1, items: { type: 'object', additionalProperties: false, required: ['fileId', 'chunkId', 'start', 'end'], properties: { fileId: { type: 'string' }, chunkId: { type: 'string' }, start: { type: 'integer', minimum: 0 }, end: { type: 'integer', minimum: 1 } } } },
                },
              },
            },
          },
        },
      },
      unresolvedDifferences: {
        type: 'array', items: {
          type: 'object', additionalProperties: false, required: ['id', 'label', 'detail', 'sourceRefs'], properties: {
            id: { type: 'string' }, label: { const: 'Unresolved source difference' }, detail: { type: 'string' },
            sourceRefs: { type: 'array', minItems: 2, items: { type: 'object', additionalProperties: false, required: ['fileId', 'chunkId', 'start', 'end'], properties: { fileId: { type: 'string' }, chunkId: { type: 'string' }, start: { type: 'integer', minimum: 0 }, end: { type: 'integer', minimum: 1 } } } },
          },
        },
      },
    },
  },
}
