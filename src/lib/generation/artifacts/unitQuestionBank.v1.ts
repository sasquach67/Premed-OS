import type { ArtifactSpec } from '@/lib/generation/types'

export type QuestionScope = 'current-unit' | 'prior-unit-integration'
export type QuestionMove = 'application' | 'integration' | 'situational' | 'recall' | 'interpretation' | 'method-and-controls'
export type CourseQuestionStyle = 'biology' | 'psychology' | 'general'

export interface UnitQuestion {
  id: string
  prompt: string
  options?: string[]
  answer: string
  rationale: string
  unit: string
  scope: QuestionScope
  move: QuestionMove
  primaryStandardId: string
  secondaryStandardIds?: string[]
  sourceChunkIds: string[]
  difficulty: 'foundational' | 'standard' | 'challenging'
}

export interface UnitQuestionBankArtifact {
  title: string
  unit: string
  courseStyle: CourseQuestionStyle
  currentUnitPercent: number
  integrationPercent: number
  questions: UnitQuestion[]
}

export const UNIT_QUESTION_BANK_V1: ArtifactSpec = {
  specId: 'unit-question-bank-v1',
  authorityDocument: 'premed-hq-documentation/specifications/generation/12-unit-question-bank-v1.md',
  objective: 'Build a source-grounded question bank for one course unit. Questions must test the supplied mastery standards, vary by course style, and include deliberate cross-standard reasoning where the source supports it. This is practice material, never a reproduction of a private or official assessment.',
  rules: [
    { id: 'UQB-SOURCE', kind: 'invariant', text: 'Every question, answer, and rationale must be grounded in one or more supplied source chunks.' },
    { id: 'UQB-STANDARDS', kind: 'invariant', text: 'Each question names one primary syllabus standard and may name supporting standards. Transcript concepts are evidence, not Topics.' },
    { id: 'UQB-STYLE', kind: 'invariant', text: 'Biology favors applied examples, methods and controls, and cross-standard integration. Psychology and interpretive courses favor situational application and careful concept identification. Use the course blueprint supplied in the request.' },
    { id: 'UQB-BALANCE', kind: 'tunable', text: 'Honor the requested current-unit and prior-unit integration mix. Biology defaults to 70% current-unit and 30% prior-unit integration; the student may adjust it.' },
    { id: 'UQB-UNIQUE', kind: 'invariant', text: 'Multiple-choice options must be distinct and exactly one answer must be correct. Short-answer questions still need a specific, gradeable answer.' },
    { id: 'UQB-REFERENCE-MODEL', kind: 'invariant', text: 'Treat every supplied question source—publisher practice, lecture-slide questions, worksheets, quizzes, exams, problem sets, or other course material—as assessment-pattern evidence regardless of brand. Model its cognitive move, difficulty, scenario type, representations, terminology, and distractor logic across the selected set; recombine those patterns with source-grounded concepts rather than copying the item.' },
    { id: 'UQB-NO-COPY', kind: 'invariant', text: 'Use assessment moves and source concepts, not copied wording, stems, or answer choices from supplied private assessment material.' },
    { id: 'UQB-GAPS', kind: 'invariant', text: 'Do not manufacture a question for a standard the source does not support. Return fewer questions rather than fill with general knowledge.' },
  ],
  outputSchema: {
    type: 'object', required: ['title', 'unit', 'courseStyle', 'currentUnitPercent', 'integrationPercent', 'questions'], properties: {
      title: { type: 'string' }, unit: { type: 'string' }, courseStyle: { enum: ['biology', 'psychology', 'general'] },
      currentUnitPercent: { type: 'number', minimum: 0, maximum: 100 }, integrationPercent: { type: 'number', minimum: 0, maximum: 100 },
      questions: { type: 'array', items: { type: 'object', required: ['id', 'prompt', 'answer', 'rationale', 'unit', 'scope', 'move', 'primaryStandardId', 'sourceChunkIds', 'difficulty'], properties: {
        id: { type: 'string' }, prompt: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, answer: { type: 'string' }, rationale: { type: 'string' }, unit: { type: 'string' },
        scope: { enum: ['current-unit', 'prior-unit-integration'] }, move: { enum: ['application', 'integration', 'situational', 'recall', 'interpretation', 'method-and-controls'] }, primaryStandardId: { type: 'string' }, secondaryStandardIds: { type: 'array', items: { type: 'string' } }, sourceChunkIds: { type: 'array', items: { type: 'string' } }, difficulty: { enum: ['foundational', 'standard', 'challenging'] },
      } } },
    },
  },
}
