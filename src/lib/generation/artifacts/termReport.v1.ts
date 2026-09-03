import type { ArtifactSpec } from '@/lib/generation/types'

/** A bounded synthesis over the student-reviewed end-of-term evidence snapshot. */
export const TERM_REPORT_V1: ArtifactSpec = {
  specId: 'term-report-v1',
  authorityDocument: 'premed-hq-documentation/specifications/generation/17-term-report-v1.md',
  objective: 'Turn only the supplied end-of-term evidence snapshot into a short, plain-language Term Report.',
  rules: [
    { id: 'TR-SOURCE', kind: 'invariant', text: 'Use only evidence IDs supplied in the snapshot. Every takeaway and experiment needs one or more exact evidenceIds.' },
    { id: 'TR-NO-CAUSALITY', kind: 'invariant', text: 'Never claim that a study method caused, improved, explains, predicts, or determined a grade or outcome.' },
    { id: 'TR-NO-TRAITS', kind: 'invariant', text: 'Do not infer a learning style, habit, amount of study time, trait, diagnosis, rank, score, or prediction.' },
    { id: 'TR-EXPERIMENTS', kind: 'invariant', text: 'Phrase each next-term item as a small optional experiment, never an instruction or treatment.' },
    { id: 'TR-PLAIN', kind: 'invariant', text: 'Use student-facing language. Do not mention model prompts, internal identifiers, or hidden calculations in prose.' },
  ],
  outputSchema: {
    type: 'object', additionalProperties: false,
    required: ['takeaways', 'experiments', 'limit'],
    properties: {
      takeaways: {
        type: 'array', minItems: 2, maxItems: 4,
        items: { type: 'object', additionalProperties: false, required: ['title', 'text', 'evidenceIds'], properties: { title: { type: 'string' }, text: { type: 'string' }, evidenceIds: { type: 'array', minItems: 1, items: { type: 'string' } } } },
      },
      experiments: {
        type: 'array', minItems: 1, maxItems: 2,
        items: { type: 'object', additionalProperties: false, required: ['title', 'text', 'evidenceIds'], properties: { title: { type: 'string' }, text: { type: 'string' }, evidenceIds: { type: 'array', minItems: 1, items: { type: 'string' } } } },
      },
      limit: { type: 'string' },
    },
  },
}
