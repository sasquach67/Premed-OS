import { describe, expect, it } from 'vitest'
import { createInitialDataForMode } from '@/store/store'
import { importStudyPackage, parseStudyPackage } from './studyPackageImport'
const sample = { format: 'premed-os-study-package', version: 1, title: 'Psychology', sources: [{ id: 's', title: 'Notes', text: 'Psychology studies behavior.', location: 'Page 1' }], sections: [{ title: 'Overview', blocks: [{ type: 'prose', text: 'A study of behavior.', sourceId: 's' }] }], objectives: [{ title: 'Explain psychology', understand: ['Behavior is studied.'], sourceIds: ['s'] }] }
describe('study package import', () => {
  it('remaps every source into the selected course and preserves guide and mastery content', () => {
    const center = createInitialDataForMode(false).academics.classCenter
    const id = importStudyPackage(center, 'chosen', parseStudyPackage(JSON.stringify({ ...sample, courseId: 'attacker', generationAuditStatus: 'approved' })), 'digest', 123)
    const entry = center.lectures.find(l => l.id === id)!
    expect(entry.courseId).toBe('chosen'); expect(entry.generationAuditStatus).toBe('skipped')
    const ref = entry.studyGuide!.sections[0].blocks[0].sourceRef!
    expect(ref.chunkId).not.toBe('s'); expect(center.sourceChunks.find(c => c.id === ref.chunkId)?.content).toBe(sample.sources[0].text)
    expect(center.generatedMasteryOutlines.find(m => m.id === entry.masteryMapId)?.standards[0].sourceChunkIds).toEqual([ref.chunkId])
    expect(entry.importedStudyPackage?.importedAt).toBe(123)
    const restored = JSON.parse(JSON.stringify(center))
    expect(importStudyPackage(restored, 'chosen', parseStudyPackage(JSON.stringify(sample)), 'digest')).toBe(id)
    expect(restored.lectures).toHaveLength(1)
  })
  it('allows source-free guides without inventing citations or mastery', () => {
    const p = parseStudyPackage(JSON.stringify({ ...sample, sources: [], objectives: [], sections: [{ title: 'Notes', blocks: [{ type: 'bullets', items: ['Recall this'] }] }] }))
    const center = createInitialDataForMode(false).academics.classCenter
    importStudyPackage(center, 'c', p, 'd')
    expect(center.lectures[0].studyGuide!.sections[0].blocks[0].sourceRef).toBeUndefined()
    expect(center.generatedMasteryOutlines).toHaveLength(0)
  })
  it('rejects dangling references, duplicate sources and empty content before mutation', () => {
    expect(() => parseStudyPackage(JSON.stringify({ ...sample, sources: [] }))).toThrow('missing')
    expect(() => parseStudyPackage(JSON.stringify({ ...sample, sources: [sample.sources[0], sample.sources[0]] }))).toThrow('unique')
    expect(() => parseStudyPackage(JSON.stringify({ ...sample, sections: [] }))).toThrow('at least one')
    expect(() => parseStudyPackage(JSON.stringify({ ...sample, version: 99 }))).toThrow('version 1')
  })
})
