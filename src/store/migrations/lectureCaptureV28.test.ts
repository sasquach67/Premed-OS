import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateLectureCaptureV28 } from './lectureCaptureV28'

describe('migrateLectureCaptureV28', () => {
  it('adds the v28 homes and preserves a provable pasted transcript as a lecture record', () => {
    const legacy = structuredClone(createSeedData()) as any
    const courseId = legacy.academics.classCenter.workspaces[0].courseId
    legacy.academics.classCenter.files.push({
      id: 'transcript-file', courseId, sourceType: 'paste', type: 'transcript',
      title: 'Lecture one', owner: 'mine', linkedTopicIds: [], createdAt: 10, updatedAt: 11, order: 999,
    })
    legacy.academics.classCenter.sourceChunks.push({
      id: 'transcript-chunk', fileId: 'transcript-file', courseId, content: '22:14 exact source',
      sourcePosition: { index: 0, label: '22:14' }, coveredByKeyPoint: false, createdAt: 10, updatedAt: 11, order: 999,
    })
    delete legacy.academics.classCenter.lectures
    delete legacy.academics.classCenter.lectureFindings
    delete legacy.academics.classCenter.lectureMaterialProposals
    delete legacy.academics.classCenter.lectureNoteProposals
    Object.freeze(legacy)
    Object.freeze(legacy.academics)
    Object.freeze(legacy.academics.classCenter)

    const out = migrateLectureCaptureV28(legacy)
    expect(out.academics.classCenter.lectures).toContainEqual(expect.objectContaining({
      transcriptFileId: 'transcript-file', inputPath: 'pasted', processingState: 'ready',
    }))
    expect(out.academics.classCenter.lectureFindings).toEqual([])
    expect(out.academics.classCenter.lectureMaterialProposals).toEqual([])
    expect(out.academics.classCenter.lectureNoteProposals).toEqual([])
    expect(out.academics.classCenter.files).toBe(legacy.academics.classCenter.files)
    expect(migrateLectureCaptureV28(out)).toBe(out)
  })

  it('does not manufacture a lecture from an unchunked legacy transcript', () => {
    const legacy = structuredClone(createSeedData()) as any
    const courseId = legacy.academics.classCenter.workspaces[0].courseId
    legacy.academics.classCenter.files.push({
      id: 'unchunked', courseId, sourceType: 'paste', type: 'transcript',
      title: 'Unknown transcript', owner: 'mine', linkedTopicIds: [], createdAt: 10, updatedAt: 10, order: 999,
    })
    delete legacy.academics.classCenter.lectures
    delete legacy.academics.classCenter.lectureFindings
    delete legacy.academics.classCenter.lectureMaterialProposals
    delete legacy.academics.classCenter.lectureNoteProposals
    const out = migrateLectureCaptureV28(legacy)
    expect(out.academics.classCenter.lectures).not.toContainEqual(expect.objectContaining({ transcriptFileId: 'unchunked' }))
    expect(out.academics.classCenter.files.find((file: { id: string }) => file.id === 'unchunked')).toBeTruthy()
  })
})
