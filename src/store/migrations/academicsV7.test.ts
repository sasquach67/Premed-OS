import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateAcademicsV7 } from './academicsV7'

describe('academics v7 migration', () => {
  it('is additive, lossless, and idempotent', () => {
    const data = structuredClone(createSeedData())
    data.academics.classCenter.sourceChunks.push({
      id: 'chunk-1', fileId: 'file-1', courseId: 'course-1', content: 'exact text',
      coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 0,
    })
    const once = migrateAcademicsV7(data)
    const twice = migrateAcademicsV7(once)
    expect(twice.academics.classCenter.sourceChunks).toHaveLength(1)

    const chunk = twice.academics.classCenter.sourceChunks[0]
    // Lossless: the stored text and its honest range are untouched.
    expect(chunk).toMatchObject({ content: 'exact text', characterStart: 0, characterEnd: 10 })
    // Assigned rather than parked at `pending` — with no topic to match and no
    // syllabus position, it lands on its own document's topic.
    expect(chunk.assignmentMethod).toBe('document-topic')
    expect(chunk.topicId).toBeTruthy()
    // Automatic assignment is provisional; the user still confirms it.
    expect(chunk.assignmentConfirmed).toBe(false)
    // Idempotent: a second pass neither reassigns nor invents another topic.
    expect(chunk.topicId).toBe(once.academics.classCenter.sourceChunks[0].topicId)
    expect(twice.academics.classCenter.topics).toHaveLength(once.academics.classCenter.topics.length)
  })
})
