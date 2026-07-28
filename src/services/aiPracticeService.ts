import { uid } from '@/lib/id'
import { assertGenerationAllowed, type GenerationContext, type RetiredGenerationContext } from '@/lib/academics/generationPolicy'
import type {
  AcademicFile,
  ClassNote,
  Topic,
  PracticeExam,
  PracticeExamDifficulty,
  PracticeQuestion,
  PracticeQuestionType,
} from '@/lib/types'

export interface GeneratePracticeExamRequest {
  /** Which allow-listed surface asked for this. Generation outside the
   *  allow-list throws — see lib/academics/generationPolicy. */
  context: GenerationContext | RetiredGenerationContext
  courseId: string
  topicIds: string[]
  sourceNoteIds: string[]
  sourceFileIds: string[]
  difficulty: PracticeExamDifficulty
  questionCount: number
  questionTypes: PracticeQuestionType[]
}

export interface GeneratePracticeExamResponse {
  exam: PracticeExam
  questions: PracticeQuestion[]
}

type LocalPracticeGenerationContext = {
  topics?: Topic[]
  notes?: ClassNote[]
  files?: AcademicFile[]
}

const DEFAULT_TYPES: PracticeQuestionType[] = ['multiple-choice']

export const aiPracticeService = {
  /**
   * Frontend boundary for future AI-generated practice.
   *
   * Future backend contract:
   * POST /api/ai/practice-exams/generate
   * body: GeneratePracticeExamRequest
   * response: GeneratePracticeExamResponse
   *
   * That backend can later call Claude, OpenAI, or another model provider and
   * return structured JSON. This frontend placeholder intentionally makes no
   * network request, stores no API keys, and does not imply any AI provider is
   * connected yet.
   */
  async generatePracticeExam(
    request: GeneratePracticeExamRequest,
    context: LocalPracticeGenerationContext = {},
  ): Promise<GeneratePracticeExamResponse> {
    // One gate for every generation path.
    assertGenerationAllowed(request.context)
    const now = Date.now()
    const topicMap = new Map((context.topics ?? []).map((topic) => [topic.id, topic]))
    const pickedTopics = request.topicIds.length ? request.topicIds : (context.topics ?? []).slice(0, 3).map((topic) => topic.id)
    const questionTypes = request.questionTypes.length ? request.questionTypes : DEFAULT_TYPES
    const count = Math.max(1, Math.min(40, request.questionCount || 5))
    const examId = uid()
    const sourceHint = [
      request.sourceNoteIds.length ? `${request.sourceNoteIds.length} note${request.sourceNoteIds.length === 1 ? '' : 's'}` : '',
      request.sourceFileIds.length ? `${request.sourceFileIds.length} file${request.sourceFileIds.length === 1 ? '' : 's'}` : '',
    ].filter(Boolean).join(' + ')

    const questions: PracticeQuestion[] = Array.from({ length: count }, (_, index) => {
      const topicId = pickedTopics[index % Math.max(1, pickedTopics.length)]
      const topic = topicMap.get(topicId)
      const type = questionTypes[index % questionTypes.length]
      const topicLabel = topic?.title ?? 'the selected topic'
      const choices = type === 'multiple-choice'
        ? [
            `A correct application of ${topicLabel}`,
            `A tempting but incomplete statement about ${topicLabel}`,
            `An unrelated detail from another unit`,
            `A definition that reverses cause and effect`,
          ]
        : undefined

      return {
        id: uid(),
        examId,
        courseId: request.courseId,
        topicIds: topicId ? [topicId] : [],
        type,
        prompt: type === 'multiple-choice'
          ? `Which option best explains ${topicLabel} in a test-style scenario?`
          : type === 'short-answer'
            ? `In 2-3 sentences, explain the core idea behind ${topicLabel}.`
            : `Build a mini free-response answer connecting ${topicLabel} to a likely exam problem.`,
        choices,
        correctAnswer: choices?.[0],
        explanation: `Placeholder rationale: connect the definition, mechanism, and one example for ${topicLabel}.${sourceHint ? ` Generated from ${sourceHint}.` : ''}`,
        order: index,
        createdAt: now,
        updatedAt: now,
      }
    })

    return {
      exam: {
        id: examId,
        courseId: request.courseId,
        title: `${request.difficulty === 'mixed' ? 'Mixed' : request.difficulty} practice set`,
        topicIds: pickedTopics,
        sourceNoteIds: request.sourceNoteIds,
        sourceFileIds: request.sourceFileIds,
        difficulty: request.difficulty,
        questionCount: count,
        questionTypes,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      },
      questions,
    }
  },
}
