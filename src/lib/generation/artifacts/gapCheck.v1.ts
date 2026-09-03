/**
 * L2 — `gap-check-v1`.
 *
 * The first consumer of the layer stack, chosen by `09` §3 because it is the
 * only working generation feature, it is small, and its output shape is already
 * validated. Refitting it proves the architecture on behaviour that is already
 * known to be correct.
 *
 * ⚠️ This replaces the three-sentence prompt written inside the edge function
 * (audit **A2**). The pedagogy now lives here, in git, reviewable in a diff —
 * `01` §2.1: "the edge function becomes transport and enforcement only."
 */
import type { ArtifactSpec } from '@/lib/generation/types'

export const GAP_CHECK_V1: ArtifactSpec = {
  specId: 'gap-check-v1',
  authorityDocument: 'premed-hq-documentation/specifications/generation/14-gap-check-v1.md',
  objective:
    'Compare a student’s free-recall attempt against the supplied source chunks and report what '
    + 'they covered, what they missed, and what they stated incorrectly — so the next study action '
    + 'is obvious. This is an assessment of one attempt, never a judgement of the student.',
  rules: [
    {
      id: 'GC-1',
      kind: 'invariant',
      text: 'Every covered, missed, or wrong item cites the chunk that supports it. An item with no '
        + 'citable support is omitted rather than attributed to a general claim.',
    },
    {
      id: 'GC-2',
      kind: 'invariant',
      text: 'Never mark something wrong that the sources do not contradict. Absence from the sources '
        + 'is not evidence of error.',
    },
    {
      id: 'GC-3',
      kind: 'invariant',
      text: 'The suggested grade reflects retrieval on this attempt only. It is not a claim about '
        + 'the student’s understanding, and it never accounts for effort or history.',
    },
    {
      id: 'GC-4',
      kind: 'tunable',
      text: 'Prefer the student’s own terminology when it matches the source’s meaning, so the '
        + 'report reads as a response to what they actually wrote.',
    },
    {
      id: 'GC-5',
      kind: 'invariant',
      text: 'A partially correct recollection is covered with its gap named, not wrong. Getting it '
        + 'partly right is the normal outcome of retrieval practice.',
    },
  ],
}
