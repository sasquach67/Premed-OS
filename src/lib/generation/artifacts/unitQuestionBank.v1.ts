import type { ArtifactSpec } from '@/lib/generation/types'

export type QuestionScope = 'current-unit' | 'prior-unit-integration'
export type QuestionMove = 'application' | 'integration' | 'situational' | 'interpretation' | 'method-and-controls'
export type CourseQuestionStyle = 'biology' | 'psychology' | 'general'

export type QuestionStimulusKind = 'passage' | 'data-table' | 'line-graph' | 'bar-graph' | 'diagram'
export type QuestionStimulusBasis = 'source-derived' | 'generated-schematic' | 'simulated-data'

export interface QuestionStimulus {
  id: string
  title: string
  kind: QuestionStimulusKind
  context: string
  caption: string
  altText: string
  basis: QuestionStimulusBasis
  sourceChunkIds: string[]
  table?: { columns: string[]; rows: string[][] }
  graph?: {
    xLabel: string
    yLabel: string
    series: Array<{ label: string; points: Array<{ x: string; y: number }> }>
  }
  diagram?: {
    nodes: Array<{ id: string; label: string; x: number; y: number; shape?: 'box' | 'circle' }>
    edges: Array<{ from: string; to: string; label?: string }>
  }
}

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
  stimulusIds: string[]
}

export interface UnitQuestionBankArtifact {
  title: string
  unit: string
  courseStyle: CourseQuestionStyle
  currentUnitPercent: number
  integrationPercent: number
  stimuli: QuestionStimulus[]
  questions: UnitQuestion[]
}

export const UNIT_QUESTION_BANK_V1: ArtifactSpec = {
  specId: 'unit-question-bank-v1',
  authorityDocument: 'premed-hq-documentation/specifications/generation/12-unit-question-bank-v1.md',
  objective: 'Build a source-grounded, application-first question bank for one course unit. Every question must use a scenario or shared stimulus, and visual or quantitative stimuli must support real reasoning rather than decorate recall. This is practice material, never a reproduction of a private or official assessment.',
  rules: [
    { id: 'UQB-SOURCE', kind: 'invariant', text: 'Every question, answer, and rationale must be grounded in one or more supplied source chunks.' },
    { id: 'UQB-STANDARDS', kind: 'invariant', text: 'Each question names one primary syllabus standard and may name supporting standards. Transcript concepts are evidence, not Topics.' },
    { id: 'UQB-APPLICATION', kind: 'invariant', text: 'Question banks are not flashcards in test form. Do not write direct-recall questions. Every question must require the student to apply, integrate, interpret, predict, calculate, evaluate, or reason about methods and controls in a concrete scenario.' },
    { id: 'UQB-STIMULUS', kind: 'invariant', text: 'Every question must reference at least one bank-level stimulus. Use passages, experiments, data tables, graphs, or diagrams; reuse a stimulus across linked questions when that enables multiple reasoning moves.' },
    { id: 'UQB-VISUAL', kind: 'invariant', text: 'In Biology, at least half of questions must use a data table, graph, or diagram. Visuals must carry information needed to answer the question, include accessible alt text, and never be decorative.' },
    { id: 'UQB-FACTUAL', kind: 'invariant', text: 'Source-derived facts and schematics must cite supplied chunks. Invented quantitative results must be labeled simulated data in both basis and caption; never present model-invented measurements as empirical findings.' },
    { id: 'UQB-STYLE', kind: 'invariant', text: 'Biology favors experimental scenarios, representations, methods and controls, and cross-standard integration. Psychology and interpretive courses favor evidence-rich situations and careful concept application. Use the course blueprint supplied in the request.' },
    { id: 'UQB-BALANCE', kind: 'tunable', text: 'Honor the requested current-unit and prior-unit integration mix. Biology defaults to 70% current-unit and 30% prior-unit integration; the student may adjust it.' },
    { id: 'UQB-UNIQUE', kind: 'invariant', text: 'Multiple-choice options must be distinct and exactly one answer must be correct. Short-answer questions still need a specific, gradeable answer.' },
    { id: 'UQB-REFERENCE-MODEL', kind: 'invariant', text: 'Treat every supplied question source—publisher practice, lecture-slide questions, worksheets, quizzes, exams, problem sets, or other course material—as assessment-pattern evidence regardless of brand. Model its cognitive move, difficulty, scenario type, representations, terminology, and distractor logic across the selected set; recombine those patterns with source-grounded concepts rather than copying the item.' },
    { id: 'UQB-NO-COPY', kind: 'invariant', text: 'Use assessment moves and source concepts, not copied wording, stems, or answer choices from supplied private assessment material.' },
    { id: 'UQB-GAPS', kind: 'invariant', text: 'Do not manufacture a question for a standard the source does not support. Return fewer questions rather than fill with general knowledge.' },
  ],
  outputSchema: {
    type: 'object', required: ['title', 'unit', 'courseStyle', 'currentUnitPercent', 'integrationPercent', 'stimuli', 'questions'], properties: {
      title: { type: 'string' }, unit: { type: 'string' }, courseStyle: { enum: ['biology', 'psychology', 'general'] },
      currentUnitPercent: { type: 'number', minimum: 0, maximum: 100 }, integrationPercent: { type: 'number', minimum: 0, maximum: 100 },
      stimuli: { type: 'array', items: { type: 'object', required: ['id', 'title', 'kind', 'context', 'caption', 'altText', 'basis', 'sourceChunkIds'], properties: {
        id: { type: 'string' }, title: { type: 'string' }, kind: { enum: ['passage', 'data-table', 'line-graph', 'bar-graph', 'diagram'] }, context: { type: 'string' }, caption: { type: 'string' }, altText: { type: 'string' }, basis: { enum: ['source-derived', 'generated-schematic', 'simulated-data'] }, sourceChunkIds: { type: 'array', items: { type: 'string' } },
        table: { type: 'object', required: ['columns', 'rows'], properties: { columns: { type: 'array', items: { type: 'string' } }, rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } } } },
        graph: { type: 'object', required: ['xLabel', 'yLabel', 'series'], properties: { xLabel: { type: 'string' }, yLabel: { type: 'string' }, series: { type: 'array', items: { type: 'object', required: ['label', 'points'], properties: { label: { type: 'string' }, points: { type: 'array', items: { type: 'object', required: ['x', 'y'], properties: { x: { type: 'string' }, y: { type: 'number' } } } } } } } } },
        diagram: { type: 'object', required: ['nodes', 'edges'], properties: { nodes: { type: 'array', items: { type: 'object', required: ['id', 'label', 'x', 'y'], properties: { id: { type: 'string' }, label: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' }, shape: { enum: ['box', 'circle'] } } } }, edges: { type: 'array', items: { type: 'object', required: ['from', 'to'], properties: { from: { type: 'string' }, to: { type: 'string' }, label: { type: 'string' } } } } } },
      } } },
      questions: { type: 'array', items: { type: 'object', required: ['id', 'prompt', 'answer', 'rationale', 'unit', 'scope', 'move', 'primaryStandardId', 'sourceChunkIds', 'difficulty', 'stimulusIds'], properties: {
        id: { type: 'string' }, prompt: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, answer: { type: 'string' }, rationale: { type: 'string' }, unit: { type: 'string' },
        scope: { enum: ['current-unit', 'prior-unit-integration'] }, move: { enum: ['application', 'integration', 'situational', 'interpretation', 'method-and-controls'] }, primaryStandardId: { type: 'string' }, secondaryStandardIds: { type: 'array', items: { type: 'string' } }, sourceChunkIds: { type: 'array', items: { type: 'string' } }, difficulty: { enum: ['foundational', 'standard', 'challenging'] }, stimulusIds: { type: 'array', items: { type: 'string' } },
      } } },
    },
  },
}
