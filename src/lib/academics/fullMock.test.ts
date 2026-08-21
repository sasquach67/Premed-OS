import { describe, expect, it } from 'vitest'
import { endGeneratedMock, fullMockDormantReasons, startGeneratedMock, validateGeneratedMockQuestions } from './fullMock'

describe('class full mock data contract', () => {
  it('requires dated exam, confirmed scope, and student material', () => {
    expect(fullMockDormantReasons({ dueDate: undefined } as any, [], [])).toEqual(['exam-date', 'exam-scope', 'study-material'])
  })

  it('persists an attempt without manufacturing a score and ends idempotently', () => {
    const started = startGeneratedMock({ id: 'a', courseId: 'c', examAssignmentId: 'e', topicIds: ['t'], sourceChunkIds: ['chunk'], specId: 'class-full-mock-v1', specHash: 'h', questions: [{ id: 'q', prompt: 'Explain it.', sourceChunkId: 'chunk', order: 0 }], startedAt: 1, now: 2 })
    expect(started).not.toHaveProperty('score')
    const ended = endGeneratedMock(started, 3)
    expect(ended.endedAt).toBe(3)
    expect(endGeneratedMock(ended, 4)).toBe(ended)
  })

  it('rejects generated questions outside the closed source set', () => {
    expect(validateGeneratedMockQuestions({ questions: [{ id: 'q', prompt: 'P', sourceChunkId: 'not-allowed', order: 0 }] }, ['chunk'])).toBeNull()
  })
})
