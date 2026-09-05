import type { ArtifactSpec } from '@/lib/generation/types'
import type { MasteryExamPractice } from '@/lib/types'

/** The detailed, source-led map that question banks and study guides share. */
export interface MasteryStandard {
  id: string
  title: string
  freeRecallCues: string[]
  understand: string[]
  beAbleToDo: string[]
  watchFor: string[]
  /** Optional only for legacy outlines consumed by question-bank workflows. */
  examPractice?: MasteryExamPractice[]
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
  objective: 'Turn the supplied course evidence into a detailed mastery map. Preserve every explicit objective relevant to the requested scope and organize its distinct source-supported subpoints into Free-recall cues, Understand, Be able to do, and Watch for. This map is the source contract for later study resources, not a transcript summary.',
  rules: [
    { id: 'UMO-INSTRUCTOR-CONNECTION', kind: 'invariant', text: 'Ground the objective scope and terminology in identified instructor transcripts and slides; use readings to clarify, not replace or enlarge that scope. Connect application targets and watch-for points to supported instructor examples and distinctions. When a solution relies on both transcript and slide evidence, include the supporting IDs from both within the objective and practice evidence. Preserve pedagogically important sequences and explicitly stated warnings, but do not invent slide numbers, quotes, instructor emphasis or exam predictions. If instructor evidence or a needed example detail is missing, report the limitation rather than claiming complete coverage or fabricating support.' },
    { id: 'UMO-SOURCE', kind: 'invariant', text: 'Every standard and every bullet must be traceable to at least one supplied source chunk.' },
    { id: 'UMO-EXAM-APPLICATION', kind: 'invariant', text: 'Each objective needs one or two original, self-contained exam-style application questions in examPractice, with an answer, reasoning rationale, and sourceChunkIds supporting the solution. Supply any sequence, values, scenario or other information needed to solve it in the prompt; never refer to an absent diagram. Test application, not definition recall. Label hypothetical scenarios as hypothetical. These are generated practice, not predicted exam questions or instructor-authored questions. Never copy supplied assessment stems or claim a topic will be on the exam. Watch for points should identify concrete tempting errors relevant to solving these tasks.' },
    { id: 'UMO-EXAM-SOLUTION', kind: 'invariant', text: 'Make the unfamiliar scenario necessary to solve the question; a decorative vignette followed by a definition is not application. Include all needed quantities, units, sequence orientations, controls and text representations in the prompt. Answer every requested part, then work through the source-supported rule, the relevant scenario evidence, and the inference or calculation in the rationale. Source IDs must be unique and drawn only from the containing objective. Do not reuse a question across objectives, restate the answer as its rationale, fabricate empirical observations, or invent unsupported facts to fill a question quota.' },
    { id: 'UMO-OBJECTIVE-IDENTITY', kind: 'invariant', text: 'Preserve the wording of explicitly labeled instructor learning objectives, not incidental transcript dialogue, slide captions, acknowledgments, or assessment stems. Organize supported subtopics under the relevant objective rather than promoting every heading into a new objective. Keep instructor emphasis only when the selected evidence states it; generated applications are never official objectives or exam predictions.' },
    { id: 'UMO-STANDARDS', kind: 'invariant', text: 'Use syllabus learning standards or explicitly stated objectives as the stable standard identity. Never promote a transcript-derived concept into a Topic.' },
    { id: 'UMO-COVERAGE', kind: 'invariant', text: 'Preserve every explicit objective relevant to the requested lecture, unit, or exam scope and every distinct supported subpoint. Do not merge separate objectives or compress a detailed source outline into a summary.' },
    { id: 'UMO-SPLIT', kind: 'invariant', text: 'Separate blank-page retrieval cues, understanding, observable performance, and likely confusion or watch-for points. Do not repeat one sentence across fields.' },
    { id: 'UMO-RECALL', kind: 'invariant', text: 'Give every objective one to three objective-specific, source-grounded free-recall cues phrased as direct student tasks such as Explain, Reconstruct, Draw, Trace, or Compare. Each cue must name what the student should retrieve, not say only “explain this topic,” and at least one cue per objective must explicitly require retrieval without notes. When the source supports a process or mechanism, at least one cue must ask the student to explain or reconstruct it from start to finish without notes.' },
    { id: 'UMO-DEPTH', kind: 'invariant', text: 'Every saved objective must contain at least five distinct Understand bullets, two objective-specific Be able to do bullets, and one concrete Watch for bullet. If selected sources cannot support that depth, fail instead of padding or inventing.' },
    { id: 'UMO-GAPS', kind: 'invariant', text: 'If the source does not support the required sections or depth, do not invent content and do not save a partial objective.' },
    { id: 'UMO-CONCISE', kind: 'tunable', text: 'Keep each bullet concise enough to scan before studying; preserve source wording when it carries an official objective, and never reuse a generic application sentence across objectives.' },
    { id: 'UMO-PRACTICE-EVIDENCE', kind: 'invariant', text: 'Use supplied questions as evidence of observable tasks, representations, distinctions, and likely traps. Translate those patterns into concrete Be able to do and Watch for bullets without copying stems or treating distractors as facts.' },
  ],
  outputSchema: {
    type: 'object', required: ['title', 'unit', 'standards'], properties: {
      title: { type: 'string' }, unit: { type: 'string' },
      standards: { type: 'array', items: { type: 'object', required: ['id', 'title', 'freeRecallCues', 'understand', 'beAbleToDo', 'watchFor', 'examPractice', 'sourceChunkIds'], properties: {
        id: { type: 'string' }, title: { type: 'string' },
        freeRecallCues: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string' } },
        understand: { type: 'array', minItems: 5, items: { type: 'string' } },
        beAbleToDo: { type: 'array', minItems: 2, items: { type: 'string' } },
        watchFor: { type: 'array', minItems: 1, items: { type: 'string' } },
        examPractice: { type: 'array', minItems: 1, maxItems: 2, items: { type: 'object', required: ['prompt', 'answer', 'rationale', 'sourceChunkIds'], properties: {
          prompt: { type: 'string', minLength: 1 }, answer: { type: 'string', minLength: 1 }, rationale: { type: 'string', minLength: 1 }, sourceChunkIds: { type: 'array', minItems: 1, uniqueItems: true, items: { type: 'string' } },
        } } },
        sourceChunkIds: { type: 'array', minItems: 1, uniqueItems: true, items: { type: 'string' } },
      } } },
    },
  },
}
