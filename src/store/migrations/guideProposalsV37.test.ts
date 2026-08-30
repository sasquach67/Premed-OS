import { describe, expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { migrateGuideProposalsV37 } from './guideProposalsV37'

describe('migrateGuideProposalsV37', () => {
  it('losslessly enriches a lecture proposal with its exact source and lifecycle', () => {
    const legacy = structuredClone(createPersonalInitialData())
    const center = legacy.academics.classCenter
    center.files.push({ id: 'transcript', courseId: 'course-a', sourceType: 'paste', title: 'Lecture 4 transcript', type: 'transcript', owner: 'mine', linkedTopicIds: [], createdAt: 1, updatedAt: 1, order: 0 })
    center.sourceChunks.push({ id: 'chunk', fileId: 'transcript', courseId: 'course-a', content: 'justify the major product', coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 0 })
    center.lectures.push({ id: 'lecture', courseId: 'course-a', title: 'Lecture 4', inputPath: 'pasted', transcriptFileId: 'transcript', processingState: 'ready', createdAt: 1, updatedAt: 1, order: 0 })
    center.lectureFindings.push({ id: 'finding', courseId: 'course-a', lectureId: 'lecture', sourceChunkId: 'chunk', quote: 'justify the major product', timestamp: '14:22', label: 'Worked example', detail: 'The professor required the reasoning.', createdAt: 1, updatedAt: 1, order: 0 })
    center.lectureNoteProposals.push({ id: 'legacy-proposal', courseId: 'course-a', lectureId: 'lecture', findingId: 'finding', status: 'dismissed', createdAt: 2, updatedAt: 3, order: 4 })
    Reflect.deleteProperty(center, 'guideProposals')
    const originalLegacy = structuredClone(center.lectureNoteProposals)
    Object.freeze(legacy)
    Object.freeze(legacy.academics)
    Object.freeze(center)

    const out = migrateGuideProposalsV37(legacy)
    expect(out.academics.classCenter.lectureNoteProposals).toEqual(originalLegacy)
    expect(out.academics.classCenter.guideProposals).toEqual([expect.objectContaining({
      id: 'legacy-proposal', status: 'dismissed', draftTitle: 'Professor remark: Worked example',
      source: expect.objectContaining({ sourceKind: 'lecture', sourceRecordId: 'finding', sourcePassage: 'justify the major product', sourceChunkId: 'chunk' }),
    })])
    expect(migrateGuideProposalsV37(out)).toBe(out)
  })

  it('preserves a malformed legacy row without inventing evidence', () => {
    const legacy = structuredClone(createPersonalInitialData())
    legacy.academics.classCenter.lectureNoteProposals.push({ id: 'orphan', courseId: 'course-a', lectureId: 'missing-lecture', findingId: 'missing-finding', status: 'pending', createdAt: 2, updatedAt: 3, order: 0 })
    Reflect.deleteProperty(legacy.academics.classCenter, 'guideProposals')
    const out = migrateGuideProposalsV37(legacy)
    expect(out.academics.classCenter.guideProposals[0]).toEqual(expect.objectContaining({
      id: 'orphan', draftTitle: '', draftText: '',
      source: expect.objectContaining({ sourcePassage: '', sourceRecordId: 'missing-finding' }),
    }))
  })
})
