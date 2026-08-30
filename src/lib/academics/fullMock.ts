import type { ClassAssignment, GeneratedMockAttempt, GeneratedMockQuestion, SourceChunk, Topic } from '@/lib/types'

export type FullMockDormantReason = 'exam-date' | 'exam-scope' | 'study-material'

/** The eligibility contract: no generic fallback questions. */
export function fullMockDormantReasons(exam: ClassAssignment, topics: Topic[], chunks: SourceChunk[]): FullMockDormantReason[] {
  const reasons: FullMockDormantReason[] = []
  if (!exam.dueDate) reasons.push('exam-date')
  const topicIds = exam.coveredTopicIds ?? []
  if (!topicIds.length || !topics.some((topic) => topicIds.includes(topic.id))) reasons.push('exam-scope')
  if (!chunks.length) reasons.push('study-material')
  return reasons
}

export function startGeneratedMock(input: Omit<GeneratedMockAttempt, 'answers' | 'flaggedQuestionIds' | 'endedAt' | 'createdAt' | 'updatedAt' | 'order'> & { now?: number }): GeneratedMockAttempt {
  const now = input.now ?? Date.now()
  const { now: _now, ...record } = input
  return {
    ...record,
    answers: {},
    flaggedQuestionIds: [],
    currentQuestionId: record.questions[0]?.id,
    createdAt: now,
    updatedAt: now,
    order: 0,
  }
}

export function endGeneratedMock(attempt: GeneratedMockAttempt, now = Date.now()): GeneratedMockAttempt {
  return attempt.endedAt ? attempt : { ...attempt, endedAt: now, updatedAt: now }
}

/** Elapsed time remains factual across reloads because it derives from the
 * persisted start/end timestamps rather than a local countdown. */
export function generatedMockElapsedSeconds(attempt: GeneratedMockAttempt, now = Date.now()) {
  const end = attempt.endedAt ?? now
  return Math.max(0, Math.floor((end - attempt.startedAt) / 1_000))
}

export function formatGeneratedMockElapsed(seconds: number) {
  const hours = Math.floor(seconds / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)
  const remainder = seconds % 60
  const pair = (value: number) => String(value).padStart(2, '0')
  return hours ? `${hours}:${pair(minutes)}:${pair(remainder)}` : `${pair(minutes)}:${pair(remainder)}`
}

/** Resume exactly where the student left off. Legacy attempts without a
 * current-question pointer resume at the first unanswered item. */
export function generatedMockResumeIndex(attempt: GeneratedMockAttempt) {
  const persisted = attempt.currentQuestionId
    ? attempt.questions.findIndex((question) => question.id === attempt.currentQuestionId)
    : -1
  if (persisted >= 0) return persisted
  const unanswered = attempt.questions.findIndex((question) => !attempt.answers[question.id]?.trim())
  return unanswered >= 0 ? unanswered : Math.max(0, attempt.questions.length - 1)
}

export function validateGeneratedMockQuestions(value: unknown, closedChunkIds: readonly string[]): GeneratedMockQuestion[] | null {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { questions?: unknown }).questions)) return null
  const allowed = new Set(closedChunkIds)
  const questions = (value as { questions: unknown[] }).questions
  if (!questions.length) return null
  const out: GeneratedMockQuestion[] = []
  for (const raw of questions) {
    if (!raw || typeof raw !== 'object') return null
    const question = raw as Partial<GeneratedMockQuestion>
    if (!question.id || !question.prompt?.trim() || !question.sourceChunkId || !allowed.has(question.sourceChunkId) || !Number.isInteger(question.order)) return null
    out.push({ ...question } as GeneratedMockQuestion)
  }
  return out
}
