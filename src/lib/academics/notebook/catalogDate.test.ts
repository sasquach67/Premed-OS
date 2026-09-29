import { describe, expect, it } from 'vitest'
import type { LectureRecord } from '@/lib/types'
import { createInitialDataForMode, migrateAll } from '@/store/store'
import { decodeWorkspaceStorage, encodeWorkspaceStorage } from '@/store/workspaceStorageCodec'
import { validateAppData } from '@/lib/validateAppData'
import { compareNotebookCatalogDates, isNotebookManualOrder, notebookAddedDate, notebookCatalogDate, resetNotebookOrder, setNotebookManualOrder, sortNotebookLectures } from './catalogDate'

const row = (id: string, occurredOn?: string, createdAt = 100, order = 0): LectureRecord => ({ id, courseId: 'course', title: id, inputPath: 'materials', processingState: 'ready', workspaceState: 'draft', selectedSourceFileIds: [], occurredOn, createdAt, updatedAt: createdAt, order })
const ids = (rows: LectureRecord[]) => rows.map(lecture => lecture.id)

describe('notebook catalog order', () => {
  it('uses only valid class dates, including for imported notebooks', () => {
    const lecture = row('imported', '2026-08-26')
    lecture.importedNotebook = { importedAt: 200, editedAt: 500 } as LectureRecord['importedNotebook']
    expect(notebookCatalogDate(lecture)?.getDate()).toBe(26)
    expect(notebookAddedDate(lecture)?.getTime()).toBe(200)
    lecture.occurredOn = undefined
    expect(notebookCatalogDate(lecture)).toBeNull()
    for (const date of ['2026-02-30', '2026-13-01', 'bad', '2026-08-26T00:00:00Z']) expect(notebookCatalogDate(row('invalid', date))).toBeNull()
    expect(notebookAddedDate(row('local'))?.getTime()).toBe(100)
  })

  it('sorts oldest class dates first, then added dates and ids, with undated last', () => {
    const rows = [row('undated-late', undefined, 400), row('later', '2026-09-02', 1), row('b', '2026-08-26', 20, 0), row('undated-first', undefined, 10), row('a', '2026-08-26', 20, 99), row('earlier-added', '2026-08-26', 10)]
    const before = [...rows]
    expect(ids(sortNotebookLectures(rows))).toEqual(['earlier-added', 'a', 'b', 'later', 'undated-first', 'undated-late'])
    expect(rows).toEqual(before)
    expect(compareNotebookCatalogDates(rows[0], rows[0])).toBe(0)
    expect(isNotebookManualOrder(rows)).toBe(false)
  })

  it('persists manual ranks per course and appends new entries in class-date order', () => {
    const rows = [row('early', '2026-08-26'), row('late', '2026-09-02'), { ...row('other'), courseId: 'other', order: -10 }]
    setNotebookManualOrder(rows, 'course', ['late', 'early'])
    expect(rows.map(item => item.order)).toEqual([-1, -2, -10])
    expect(isNotebookManualOrder(rows, 'course')).toBe(true)
    rows.push(row('new-undated'), row('new-dated', '2026-08-01'))
    expect(ids(sortNotebookLectures(rows, 'course'))).toEqual(['late', 'early', 'new-dated', 'new-undated'])
    rows[0].occurredOn = '2026-07-01'
    expect(ids(sortNotebookLectures(rows, 'course'))[0]).toBe('late')
    resetNotebookOrder(rows, 'course')
    expect(isNotebookManualOrder(rows, 'course')).toBe(false)
    expect(ids(sortNotebookLectures(rows, 'course'))).toEqual(['early', 'new-dated', 'late', 'new-undated'])
    expect(rows[2].order).toBe(-10)
    rows[1].occurredOn = '2026-06-01'
    expect(ids(sortNotebookLectures(rows, 'course'))[0]).toBe('late')
  })

  it('handles stale or repeated reorder ids without dropping entries or changing another course', () => {
    const rows = [row('a'), row('b'), row('c'), { ...row('foreign'), courseId: 'other' }]
    setNotebookManualOrder(rows, 'course', ['c', 'c', 'missing', 'foreign'])
    expect(ids(sortNotebookLectures(rows, 'course'))).toEqual(['c', 'a', 'b'])
    expect(rows.map(item => item.order)).toEqual([-2, -1, -3, 0])
  })

  it('preserves manual mode through the workspace codec and migration round trip without a schema bump', () => {
    const data = createInitialDataForMode(false)
    data.academics.classCenter.lectures = [row('a', '2026-08-26'), row('b', '2026-09-02')]
    setNotebookManualOrder(data.academics.classCenter.lectures, 'course', ['b', 'a'])
    const stored = encodeWorkspaceStorage(JSON.stringify(data), { requireChunks: true })
    const restored = migrateAll(JSON.parse(decodeWorkspaceStorage(stored)))
    expect(validateAppData(restored)).toEqual([])
    expect(restored.academics.classCenter.lectures).toEqual(data.academics.classCenter.lectures)
    expect(ids(sortNotebookLectures(restored.academics.classCenter.lectures, 'course'))).toEqual(['b', 'a'])
    expect(isNotebookManualOrder(restored.academics.classCenter.lectures, 'course')).toBe(true)
    resetNotebookOrder(restored.academics.classCenter.lectures, 'course')
    const reset = migrateAll(JSON.parse(decodeWorkspaceStorage(encodeWorkspaceStorage(JSON.stringify(restored)))))
    expect(isNotebookManualOrder(reset.academics.classCenter.lectures, 'course')).toBe(false)
    expect(ids(sortNotebookLectures(reset.academics.classCenter.lectures, 'course'))).toEqual(['a', 'b'])
  })
})
