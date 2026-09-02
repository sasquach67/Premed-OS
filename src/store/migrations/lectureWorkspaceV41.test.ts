import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateLectureWorkspaceV41 } from './lectureWorkspaceV41'

describe('migrateLectureWorkspaceV41', () => {
  it('completes legacy lecture homes, scopes old mastery records to unit, and preserves legacy Study Outline notes', () => {
    const legacy = structuredClone(createSeedData()) as any
    const courseId = legacy.academics.classCenter.workspaces[0].courseId
    legacy.academics.classCenter.lectures.push({ id: 'lecture', courseId, title: 'Lecture 1', inputPath: 'pasted', transcriptFileId: 'transcript', processingState: 'ready', createdAt: 1, updatedAt: 1, order: 0 })
    legacy.academics.classCenter.files.push({ id: 'transcript', courseId, lectureId: 'lecture', title: 'Transcript', type: 'transcript', sourceType: 'paste', owner: 'mine', linkedTopicIds: [], processingStatus: 'ready', createdAt: 1, updatedAt: 1, order: 0 })
    legacy.academics.classCenter.notes.push({ id: 'legacy-outline', courseId, title: 'Study outline · Unit 1', type: 'study-guide', kind: 'on-material', topicIds: [], content: 'Legacy content', syncStatus: 'local-only', linkedFileIds: [], createdAt: 1, updatedAt: 1, order: 0 })
    legacy.academics.classCenter.generatedMasteryOutlines.push({ id: 'map', courseId, title: 'Unit map', unit: 'Unit 1', specId: 'unit-mastery-outline-v1', specHash: 'x', standards: [], sourceChunkIds: [], createdAt: 1, updatedAt: 1, order: 0 })
    const out = migrateLectureWorkspaceV41(legacy)
    expect(out.academics.classCenter.lectures.at(-1)).toMatchObject({ workspaceState: 'complete', selectedSourceFileIds: ['transcript'] })
    expect(out.academics.classCenter.generatedMasteryOutlines.at(-1)?.scope).toBe('unit')
    expect(out.academics.classCenter.notes.some((note) => note.id === 'legacy-outline' && note.content === 'Legacy content')).toBe(true)
    expect(migrateLectureWorkspaceV41(out)).toBe(out)
  })
})
