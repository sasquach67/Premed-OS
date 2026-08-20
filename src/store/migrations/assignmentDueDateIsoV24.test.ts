import { describe, expect, it } from 'vitest'
import type { AppData } from '@/lib/types'
import { migrateAssignmentDueDateIsoV24 } from '@/store/migrations/assignmentDueDateIsoV24'
import { daysUntil } from '@/lib/date'

function dataWith(dueDates: (string | undefined)[]): AppData {
  return {
    academics: {
      classCenter: {
        assignments: dueDates.map((dueDate, index) => ({
          id: `a${index}`, courseId: 'c1', title: `Item ${index}`, type: 'other',
          dueDate, status: 'not-started', linkedTopicIds: [], linkedFileIds: [],
          notes: '', createdAt: 0, updatedAt: 0, order: index,
        })),
      },
    },
  } as unknown as AppData
}
const dues = (data: AppData) =>
  (data.academics.classCenter.assignments ?? []).map((assignment) => assignment.dueDate)

describe('migrateAssignmentDueDateIsoV24', () => {
  it('rewrites display-text dates the importer used to store', () => {
    const out = migrateAssignmentDueDateIsoV24(dataWith(['September 8, 2026', 'October 6, 2026']))
    expect(dues(out)).toEqual(['2026-09-08', '2026-10-06'])
  })

  it('makes those dates readable by the code that renders them', () => {
    const before = dataWith(['December 12, 2026'])
    expect(daysUntil(dues(before)[0])).toBeNull() // the bug: Invalid Date
    expect(daysUntil(dues(migrateAssignmentDueDateIsoV24(before))[0])).not.toBeNull()
  })

  it('keeps an unparseable date rather than dropping the record', () => {
    const out = migrateAssignmentDueDateIsoV24(dataWith(['sometime after break', undefined]))
    expect(dues(out)).toEqual(['sometime after break', undefined])
  })

  it('leaves ISO values untouched and is idempotent', () => {
    const once = migrateAssignmentDueDateIsoV24(dataWith(['2026-09-08', 'October 6, 2026']))
    const twice = migrateAssignmentDueDateIsoV24(once)
    expect(dues(twice)).toEqual(['2026-09-08', '2026-10-06'])
    expect(twice).toBe(once) // no needless rewrite on a clean store
  })

  it('survives a store with no class center at all', () => {
    expect(() => migrateAssignmentDueDateIsoV24({} as AppData)).not.toThrow()
  })
})
