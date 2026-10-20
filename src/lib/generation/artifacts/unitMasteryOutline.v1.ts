import type { ArtifactSpec } from '@/lib/generation/types'
import type { MasteryExamPractice } from '@/lib/types'

/** The detailed, source-led map that question banks and study guides share. */
export interface MasteryStandard {
  id: string
  title: string
  /** Specific evidence gap permitting a visibly limited objective. */
  evidenceLimit?: string
  howTested?: { setup: string; questions: { id: string; text: string; sourceChunkIds: string[] }[]; noQuestionsReason?: string }
  applicationSkills?: { text: string; questionIds: string[] }[]
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
  objective: "Turn the supplied course evidence into a mastery map organized as How it's tested, Be able to do, then Understand. Preserve every relevant official objective and distinct supported subpoint. Show actual course questions before observable application skills and factual answers in formal exam vocabulary.",
  rules: [
    { id: "UMO-OBJECTIVE-IDENTITY", kind: "invariant", text: "Do not require formal learning objectives when readable materials support derived study objectives. Preserve every supplied official objective verbatim in its requirements ledger, including partial, missing and explicitly excluded objectives. Keep the required “Study objective:” prefix for supported derived objectives. Never turn an assessment stem into a new official objective or infer instructor approval." },
    { id: "UMO-THREE-PARTS", kind: "invariant", text: "Each supported objective has exactly three displayed parts in order: How it's tested, Be able to do, Understand. No extra recall, caution, twist, trap or try-one sections." },
    { id: "UMO-HOW-TESTED", kind: "invariant", text: "Begin with one setup line naming the input and exam action. Then quote the actual relevant questions from the class outline, live responses, guided reading questions and lecture, retaining exact wording and required stimulus. Never invent, paraphrase or predict a question to populate this list. Keep source IDs, exact excerpt IDs and needed asset IDs attached to each question for the collapsed Source evidence fold; do not put source tags in question text. Display numbers come from question order. If no real question is supplied, show one honest line explaining that fact and keep questions empty. A missing question alone does not mean the conceptual objective lacks evidence." },
    { id: "UMO-APPLICATION-SKILLS", kind: "invariant", text: "State observable skills in concrete terms: given a named input, interpret, compare, trace, calculate or predict the supported result. Each skill references the actual question IDs it answers; the reader turns those into Q1 Q3 or Q2–Q4 labels. Do not invent question numbers. If there are no course questions, supported skills may have empty question references." },
    { id: "UMO-UNDERSTAND-FACTS", kind: "invariant", text: "State the answers and underlying principles as facts in formal exam vocabulary, not tasks beginning “Explain why”. Cover all supported ideas without duplicating one sentence across fields. Preserve the professor's supported answers and meaningful scientific qualifications. If an answer appears wrong or conflicts with the material, resolve and disclose that conflict through the existing evidence/correction rules rather than silently substitute a contradictory answer." },
    { id: "UMO-EVIDENCE-AND-GAPS", kind: "invariant", text: "Retain exact evidence, source hierarchy, instructor emphasis only where documented, and specific evidence limits when understanding itself is unsupported. A fully unsupported objective stays in coverage without fabricated mastery content. Source fidelity does not permit invented quotes, inaccessible figures or false complete-coverage claims." },
  ],
  outputSchema: {
    type: 'object', required: ['title', 'unit', 'standards'], properties: {
      title: { type: 'string' }, unit: { type: 'string' },
      standards: { type: 'array', minItems: 1, items: { type: 'object', required: ['id', 'title', 'howTested', 'applicationSkills', 'freeRecallCues', 'understand', 'beAbleToDo', 'watchFor', 'examPractice', 'sourceChunkIds'], properties: {
        id: { type: 'string', minLength: 1 }, title: { type: 'string', minLength: 1 }, evidenceLimit: { type: 'string', minLength: 1 },
        howTested: { type: 'object', required: ['setup', 'questions'], properties: {
          setup: { type: 'string', minLength: 1 }, noQuestionsReason: { type: 'string', minLength: 1 },
          questions: { type: 'array', items: { type: 'object', required: ['id', 'text', 'sourceChunkIds'], properties: {
            id: { type: 'string', minLength: 1 }, text: { type: 'string', minLength: 1 }, sourceChunkIds: { type: 'array', minItems: 1, uniqueItems: true, items: { type: 'string' } },
          } } },
        } },
        applicationSkills: { type: 'array', minItems: 1, items: { type: 'object', required: ['text', 'questionIds'], properties: {
          text: { type: 'string', minLength: 1 }, questionIds: { type: 'array', uniqueItems: true, items: { type: 'string' } },
        } } },
        freeRecallCues: { type: 'array', maxItems: 0, items: { type: 'string' } },
        understand: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } },
        beAbleToDo: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } },
        watchFor: { type: 'array', maxItems: 0, items: { type: 'string' } },
        examPractice: { type: 'array', maxItems: 0, items: { type: 'object' } },
        sourceChunkIds: { type: 'array', minItems: 1, uniqueItems: true, items: { type: 'string' } },
      } } },
    },
  },
}
