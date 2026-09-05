import { describe, expect, it } from 'vitest'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import {
  isPrimaryMaterial, UNFILED, catalogEntries, catalogUnits, provenanceOf, unitOf,
} from '@/lib/academics/materialCatalog'
import type { AcademicFile, Topic } from '@/lib/types'

const now = Date.UTC(2026, 8, 18)
const topic = (id: string, unit?: string): Topic => ({
  id, courseId: 'c1', title: id, unit, status: 'not-started', fsrs: createTopicFsrsState(now),
  confidence: 3, sourceNoteIds: [], order: 0,
})
const file = (id: string, patch: Partial<AcademicFile> = {}): AcademicFile => ({
  id, courseId: 'c1', sourceType: 'upload', title: id, type: 'reading',
  owner: 'course', linkedTopicIds: [], createdAt: now, updatedAt: now, order: 0, ...patch,
})

const topics = [topic('t1', 'Unit 5'), topic('t2', 'Unit 6'), topic('t3', 'Unit 7')]

describe('provenance is read, never inferred', () => {
  it('reports the recorded owner', () => {
    expect(provenanceOf(file('a', { owner: 'course' }))).toBe('course')
    expect(provenanceOf(file('b', { owner: 'mine' }))).toBe('mine')
    expect(provenanceOf(file('c', { owner: 'generated' }))).toBe('generated')
  })

  it('keeps an unrecorded owner UNKNOWN rather than assuming course material', () => {
    const orphan = { ...file('d'), owner: undefined } as unknown as AcademicFile
    expect(provenanceOf(orphan)).toBe('unknown')
  })
})

describe('the unit spine', () => {
  it('follows the class topic order, not the alphabet', () => {
    const files = [
      file('f1', { linkedTopicIds: ['t3'] }),
      file('f2', { linkedTopicIds: ['t1'] }),
      file('f3', { linkedTopicIds: ['t2'] }),
    ]
    expect(catalogUnits(files, topics).map((row) => row.unit)).toEqual(['Unit 5', 'Unit 6', 'Unit 7'])
  })

  it('counts materials per unit', () => {
    const files = [file('f1', { linkedTopicIds: ['t1'] }), file('f2', { linkedTopicIds: ['t1'] })]
    expect(catalogUnits(files, topics)).toEqual([{ unit: 'Unit 5', count: 2 }])
  })

  it('shows Unfiled last, and only when something is actually unfiled', () => {
    const filed = [file('f1', { linkedTopicIds: ['t1'] })]
    expect(catalogUnits(filed, topics).some((row) => row.unit === UNFILED)).toBe(false)
    const mixed = [...filed, file('f2')]
    const rows = catalogUnits(mixed, topics)
    expect(rows[rows.length - 1]).toEqual({ unit: UNFILED, count: 1 })
  })

  it('resolves a unit through topicId as well as linkedTopicIds', () => {
    expect(unitOf(file('f', { topicId: 't2' }), topics)).toBe('Unit 6')
    expect(unitOf(file('f'), topics)).toBe(UNFILED)
  })
})

describe('catalog entries', () => {
  it('filters to one unit and keeps stored order', () => {
    const files = [
      file('f2', { linkedTopicIds: ['t1'], order: 1 }),
      file('f1', { linkedTopicIds: ['t1'], order: 0 }),
      file('f3', { linkedTopicIds: ['t2'], order: 2 }),
    ]
    expect(catalogEntries(files, topics, 'Unit 5').map((entry) => entry.file.id)).toEqual(['f1', 'f2'])
  })

  it('returns everything when no unit is selected', () => {
    expect(catalogEntries([file('f1'), file('f2')], topics)).toHaveLength(2)
  })
})


describe('primary study materials', () => {
  it('uses file metadata and legacy screenshot names without excluding documents or generated diagrams', () => {
    expect(isPrimaryMaterial(file('screen', { mimeType: 'image/png' }))).toBe(false)
    expect(isPrimaryMaterial(file('camera', { fileName: 'IMG_2048.HEIC' }))).toBe(false)
    expect(isPrimaryMaterial(file('legacy', { title: 'Screenshot 2026-09-03 at 3.47.44 PM' }))).toBe(false)
    expect(isPrimaryMaterial(file('pdf', { title: 'Screenshot analysis', fileName: 'analysis.pdf' }))).toBe(true)
    expect(isPrimaryMaterial(file('transcript', { mimeType: 'text/plain' }))).toBe(true)
    expect(isPrimaryMaterial(file('diagram', { owner: 'generated', mimeType: 'image/png' }))).toBe(true)
    expect(isPrimaryMaterial(file('unknown-document'))).toBe(true)
  })
})
