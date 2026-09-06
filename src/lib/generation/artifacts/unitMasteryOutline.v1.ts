import type { ArtifactSpec } from '@/lib/generation/types'
import type { MasteryExamPractice } from '@/lib/types'

/** The detailed, source-led map that question banks and study guides share. */
export interface MasteryStandard {
  id: string
  title: string
  /** Specific evidence gap permitting a visibly limited objective. */
  evidenceLimit?: string
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
    { id: 'UMO-INSTRUCTOR-CONNECTION', kind: 'invariant', text: 'Use selected instructor transcripts and personal class notes as the primary teaching structure, with slides and lesson outlines to connect and complete it. Preserve terminology and distinguish supplementary readings. Personal notes establish student focus, not guaranteed correctness or instructor authorship. When no instructor evidence is selected, derive the study scope from the selected readings, notes, and other materials; instructor evidence is optional. Connect application targets and watch-for points to supported instructor examples and distinctions. When a solution relies on both transcript and slide evidence, include the supporting IDs from both within the objective and practice evidence. Preserve pedagogically important sequences and explicitly stated warnings, but do not invent slide numbers, quotes, instructor emphasis or exam predictions. If instructor evidence or a needed example detail is missing, report the limitation rather than claiming complete coverage or fabricating support.' },
    { id: 'UMO-SOURCE', kind: 'invariant', text: 'Every standard and every bullet must be traceable to at least one supplied source chunk.' },
    { id: 'UMO-EXAM-APPLICATION', kind: 'invariant', text: 'Each sufficiently supported objective needs one or two original, self-contained exam-style application questions in examPractice, with an answer, reasoning rationale, and sourceChunkIds supporting the solution. An objective with a concrete evidenceLimit may use an empty examPractice array when the selected evidence cannot support a solved application; never fabricate one. Supply any sequence, values, scenario or other information needed to solve it in the prompt; never refer to an absent diagram. Test application, not definition recall. Label hypothetical scenarios as hypothetical. These are generated practice, not predicted exam questions or instructor-authored questions. Never copy supplied assessment stems or claim a topic will be on the exam. Watch for points should identify concrete tempting errors relevant to solving these tasks.' },
    { id: 'UMO-EXAM-SOLUTION', kind: 'invariant', text: 'Make the unfamiliar scenario necessary to solve the question; a decorative vignette followed by a definition is not application. Include all needed quantities, units, sequence orientations, controls and text representations in the prompt. Answer every requested part, then work through the source-supported rule, the relevant scenario evidence, and the inference or calculation in the rationale. Source IDs must be unique and drawn only from the containing objective. Do not reuse a question across objectives, restate the answer as its rationale, fabricate empirical observations, or invent unsupported facts to fill a question quota.' },
    { id: 'UMO-OBJECTIVE-IDENTITY', kind: 'invariant', text: 'Preserve explicitly labeled instructor learning objectives verbatim when supplied. Do not require formal learning objectives to build a map from readable material. For supported concepts not covered by explicit objectives, derive concrete study objectives from the selected evidence and prefix each such title with "Study objective:". These are generated study aids, never official instructor objectives or exam predictions. Group related supported concepts into coherent objectives; do not turn acknowledgments, incidental instructions, or assessment stems into objectives. Keep instructor emphasis only when the selected evidence states it.' },
    { id: 'UMO-STANDARDS', kind: 'invariant', text: 'Use syllabus standards or explicit objectives as standard identities when available. Otherwise use stable local identities for source-derived study objectives. Generated study objectives belong only to this artifact; never create or modify syllabus Topics or claim instructor approval. Missing formal objectives alone is not a reason to return an empty standards list.' },
    { id: 'UMO-COVERAGE', kind: 'invariant', text: 'Preserve every explicit objective relevant to the requested lecture, unit, or exam scope and every distinct supported subpoint. Do not merge separate objectives or compress a detailed source outline into a summary.' },
    { id: 'UMO-SPLIT', kind: 'invariant', text: 'Separate blank-page retrieval cues, understanding, observable performance, and likely confusion or watch-for points. Do not repeat one sentence across fields.' },
    { id: 'UMO-RECALL', kind: 'invariant', text: 'Give every objective one to three objective-specific, source-grounded free-recall cues phrased as direct student tasks such as Explain, Reconstruct, Draw, Trace, or Compare. Each cue must name what the student should retrieve, not say only “explain this topic,” and at least one cue per objective must explicitly require retrieval without notes. When the source supports a process or mechanism, at least one cue must ask the student to explain or reconstruct it from start to finish without notes.' },
    { id: 'UMO-DEPTH', kind: 'invariant', text: 'Ordinary objectives must contain at least five distinct Understand bullets, two objective-specific Be able to do bullets, and one concrete Watch for bullet. Preserve all distinct supported detail for rich sources. Only when selected evidence genuinely cannot support these floors, provide evidenceLimit explaining the specific missing source support in at least eight words and retain all supported points: at least one Understand point, a concrete recall cue, and exact source IDs remain mandatory; unsupported Be able to do, Watch for, or examPractice arrays may be empty. Never use evidenceLimit to shorten rich material, meet an output budget, avoid work, or excuse unsupported claims. Omit evidenceLimit when the objective is fully supported.' },
    { id: 'UMO-GAPS', kind: 'invariant', text: 'Thin readable evidence produces a visibly evidence-limited objective, not invented depth or an error for the entire map. State precisely what support is missing in evidenceLimit, without treating the limitation as factual course content. Never save an objective with no supported understanding point or no selected evidence. The independent review must verify that any reduced depth is justified by the selected evidence.' },
    { id: 'UMO-CONCISE', kind: 'tunable', text: 'Keep each bullet concise enough to scan before studying; preserve source wording when it carries an official objective, and never reuse a generic application sentence across objectives.' },
    { id: 'UMO-PRACTICE-EVIDENCE', kind: 'invariant', text: 'Use supplied questions as evidence of observable tasks, representations, distinctions, and likely traps. Translate those patterns into concrete Be able to do and Watch for bullets without copying stems or treating distractors as facts.' },
  ],
  outputSchema: {
    type: 'object', required: ['title', 'unit', 'standards'], properties: {
      title: { type: 'string' }, unit: { type: 'string' },
      standards: { type: 'array', minItems: 1, items: { type: 'object', required: ['id', 'title', 'freeRecallCues', 'understand', 'beAbleToDo', 'watchFor', 'examPractice', 'sourceChunkIds'], allOf: [{ if: { not: { required: ['evidenceLimit'] } }, then: { properties: { understand: { minItems: 5 }, beAbleToDo: { minItems: 2 }, watchFor: { minItems: 1 }, examPractice: { minItems: 1 } } } }], properties: {
        id: { type: 'string' }, title: { type: 'string' }, evidenceLimit: { type: 'string', minLength: 1 },
        freeRecallCues: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string' } },
        understand: { type: 'array', minItems: 1, items: { type: 'string' } },
        beAbleToDo: { type: 'array', minItems: 0, items: { type: 'string' } },
        watchFor: { type: 'array', minItems: 0, items: { type: 'string' } },
        examPractice: { type: 'array', minItems: 0, maxItems: 2, items: { type: 'object', required: ['prompt', 'answer', 'rationale', 'sourceChunkIds'], properties: {
          prompt: { type: 'string', minLength: 1 }, answer: { type: 'string', minLength: 1 }, rationale: { type: 'string', minLength: 1 }, sourceChunkIds: { type: 'array', minItems: 1, uniqueItems: true, items: { type: 'string' } },
        } } },
        sourceChunkIds: { type: 'array', minItems: 1, uniqueItems: true, items: { type: 'string' } },
      } } },
    },
  },
}
