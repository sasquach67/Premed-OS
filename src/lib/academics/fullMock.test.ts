import { describe, expect, it } from 'vitest'
import {
  endGeneratedMock,
  formatGeneratedMockElapsed,
  fullMockDormantReasons,
  generatedMockElapsedSeconds,
  generatedMockResumeIndex,
  startGeneratedMock,
  validateGeneratedMockQuestions,
} from './fullMock'

describe('class full mock data contract', () => {
  it('requires dated exam, confirmed scope, and student material', () => {
    expect(fullMockDormantReasons({ dueDate: undefined } as any, [], [])).toEqual(['exam-date', 'exam-scope', 'study-material'])
  })

  it('persists an attempt without manufacturing a score and ends idempotently', () => {
    const started = startGeneratedMock({ id: 'a', courseId: 'c', examAssignmentId: 'e', topicIds: ['t'], sourceChunkIds: ['chunk'], specId: 'class-full-mock-v1', specHash: 'h', questions: [{ id: 'q', prompt: 'Explain it.', sourceChunkId: 'chunk', order: 0 }], startedAt: 1, now: 2 })
    expect(started).not.toHaveProperty('score')
    expect(started.currentQuestionId).toBe('q')
    const ended = endGeneratedMock(started, 3)
    expect(ended.endedAt).toBe(3)
    expect(endGeneratedMock(ended, 4)).toBe(ended)
  })

  it('rejects generated questions outside the closed source set', () => {
    expect(validateGeneratedMockQuestions({ questions: [{ id: 'q', prompt: 'P', sourceChunkId: 'not-allowed', order: 0 }] }, ['chunk'])).toBeNull()
  })

  it('derives a reload-safe elapsed time and resumes the persisted question', () => {
    const attempt = startGeneratedMock({
      id: 'a', courseId: 'c', examAssignmentId: 'e', topicIds: ['t'], sourceChunkIds: ['chunk'],
      specId: 'class-full-mock-v1', specHash: 'h', startedAt: 1_000, now: 1_000,
      questions: [
        { id: 'q1', prompt: 'One', sourceChunkId: 'chunk', order: 0 },
        { id: 'q2', prompt: 'Two', sourceChunkId: 'chunk', order: 1 },
      ],
    })
    attempt.currentQuestionId = 'q2'
    expect(generatedMockResumeIndex(attempt)).toBe(1)
    expect(generatedMockElapsedSeconds(attempt, 80_000)).toBe(79)
    expect(formatGeneratedMockElapsed(79)).toBe('01:19')
    expect(formatGeneratedMockElapsed(3_661)).toBe('1:01:01')
  })

  it('falls back to the first unanswered question for legacy attempts', () => {
    const attempt = startGeneratedMock({
      id: 'a', courseId: 'c', examAssignmentId: 'e', topicIds: ['t'], sourceChunkIds: ['chunk'],
      specId: 'class-full-mock-v1', specHash: 'h', startedAt: 1, now: 1,
      questions: [
        { id: 'q1', prompt: 'One', sourceChunkId: 'chunk', order: 0 },
        { id: 'q2', prompt: 'Two', sourceChunkId: 'chunk', order: 1 },
      ],
    })
    delete attempt.currentQuestionId
    attempt.answers.q1 = 'Answered'
    expect(generatedMockResumeIndex(attempt)).toBe(1)
  })

  it('keeps continuation and elapsed timestamps through JSON persistence', () => {
    const attempt = startGeneratedMock({
      id: 'a', courseId: 'c', examAssignmentId: 'e', topicIds: ['t'], sourceChunkIds: ['chunk'],
      specId: 'class-full-mock-v1', specHash: 'h', startedAt: 10_000, now: 10_000,
      questions: [
        { id: 'q1', prompt: 'One', sourceChunkId: 'chunk', order: 0 },
        { id: 'q2', prompt: 'Two', sourceChunkId: 'chunk', order: 1 },
      ],
    })
    attempt.currentQuestionId = 'q2'
    attempt.answers.q1 = 'Saved answer'
    const restored = JSON.parse(JSON.stringify(attempt)) as typeof attempt
    expect(generatedMockResumeIndex(restored)).toBe(1)
    expect(restored.answers.q1).toBe('Saved answer')
    expect(generatedMockElapsedSeconds(restored, 75_000)).toBe(65)
  })
})
