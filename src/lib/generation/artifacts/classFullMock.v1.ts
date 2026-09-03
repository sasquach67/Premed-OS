import type { ArtifactSpec } from '@/lib/generation/types'

export const CLASS_FULL_MOCK_V1: ArtifactSpec = {
  specId: 'class-full-mock-v1',
  authorityDocument: 'premed-hq-documentation/specifications/generation/16-class-full-mock-v1.md',
  objective: 'Create a timed class-practice mock from the selected student material. It is generated practice, never a real, past, official, or professor exam.',
  rules: [
    { id: 'FM-SOURCE', kind: 'invariant', text: 'Every question must cite one supplied material chunk.' },
    { id: 'FM-NOT-REAL', kind: 'invariant', text: 'Never describe the output as a real, past, official, professor, or upcoming exam.' },
    { id: 'FM-AUTOPSY', kind: 'invariant', text: 'Do not calculate score, percent correct, readiness, rank, or forecast.' },
  ],
}
