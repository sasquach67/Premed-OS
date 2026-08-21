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
  return { ...record, answers: {}, flaggedQuestionIds: [], createdAt: now, updatedAt: now, order: 0 }
}

export function endGeneratedMock(attempt: GeneratedMockAttempt, now = Date.now()): GeneratedMockAttempt {
  return attempt.endedAt ? attempt : { ...attempt, endedAt: now, updatedAt: now }
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
