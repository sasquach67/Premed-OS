import { describe, expect, it } from 'vitest'
import { createInitialDataForMode } from '@/store/store'
import { removeCourseCascade } from './removeCourseCascade'

describe('removeCourseCascade', () => {
  it('removes direct, dependent, historical, and device-local course records without deleting prior credit', () => {
    const data = createInitialDataForMode(true)
    const center = data.academics.classCenter
    const courseId = data.courses[0].id
    const topicId = center.topics.find((item) => item.courseId === courseId)?.id
    center.files.push({ id: 'delete-file', courseId, title: 'Source', type: 'syllabus', sourceType: 'upload', url: '', blobRef: 'idb://delete-me', notes: '', linkedTopicIds: [], owner: 'course', createdAt: 1, updatedAt: 1, order: 99 })
    center.transcriptRecords.push({ id: 'prior-credit', institution: 'UNC', courseNumberExact: 'AP', titleExact: 'Prior credit', creditsExact: '3', gradeExact: 'TR', term: '', year: '', courseType: 'transfer', createdAt: 1, updatedAt: 1, order: 0 })
    center.watchedNoteSources.push({ id: 'source', provider: 'local-folder', rootLabel: 'Notes', courseId, selectedAt: 1, reviewEachImport: true, confirmedMappings: [], createdAt: 1, updatedAt: 1 })
    center.watchedNoteProposals.push({ id: 'proposal', sourceId: 'source', stableKey: 'a', displayPath: 'a', displayName: 'a', mappingConfidence: 'needs-confirmation', mappingReason: '', status: 'pending', createdAt: 1, updatedAt: 1 })
    if (topicId) center.reviewEvents.push({ id: 'review', topicId, timestamp: 1, grade: 'good', confidence: 2, order: 0 })

    const removed = removeCourseCascade(center, courseId)

    expect(removed.blobRefs).toContain('idb://delete-me')
    expect(center.files.some((item) => item.courseId === courseId)).toBe(false)
    expect(center.topics.some((item) => item.courseId === courseId)).toBe(false)
    expect(center.reviewEvents.some((item) => item.id === 'review')).toBe(false)
    expect(center.watchedNoteProposals.some((item) => item.id === 'proposal')).toBe(false)
    expect(center.transcriptRecords.some((item) => item.id === 'prior-credit')).toBe(true)
  })
})
