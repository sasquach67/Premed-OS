import { describe, expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { totalsForCategory } from '@/lib/experienceHours'
import type { CollectionRecord, ExperienceEntry, ExperienceHourEntry } from '@/lib/types'
import { activeResearchLabs, currentResearchLab, filterResearchLogs, localDay, researchDateRange, researchLogs, researchStats, researchTerm, researchUpcoming, researchWeeks, validResearchDay } from './research'

const lab = (id: string, extra: Partial<CollectionRecord<ExperienceEntry>> = {}): CollectionRecord<ExperienceEntry> => ({ id, category: 'research', org: id, role: 'Assistant', description: '', status: 'active', tags: [], order: 0, ...extra })
const log = (id: string, date: string, hours: number, extra: Partial<ExperienceHourEntry> = {}): ExperienceHourEntry => ({ id, experienceId: 'a', date, hours, kind: 'logged', createdAt: 1, updatedAt: 1, archived: false, order: 0, ...extra })
const fixture = () => {
  const data = createPersonalInitialData()
  data.experiences = [lab('a'), lab('b')]
  data.experienceHourEntries = [log('one', '2026-08-01', 2), log('two', '2026-08-01', 3, { experienceId: 'b' }), log('zero', '2026-08-02', 0), { ...log('estimate', '2026-08-03', 60), kind: 'estimated', date: undefined }]
  return data
}

describe('Research calendar and retrieval', () => {
  it.each([
    ['2026-01-01', 'Spring 2026', '2026-01-01', '2026-05-15'],
    ['2026-05-15', 'Spring 2026', '2026-01-01', '2026-05-15'],
    ['2026-05-16', 'Summer 2026', '2026-05-16', '2026-07-31'],
    ['2026-07-31', 'Summer 2026', '2026-05-16', '2026-07-31'],
    ['2026-08-01', 'Fall 2026', '2026-08-01', '2026-12-31'],
    ['2026-12-31', 'Fall 2026', '2026-08-01', '2026-12-31'],
  ])('uses fixed inclusive windows on %s without requiring a term record', (day, label, start, end) => {
    expect(researchTerm(new Date(`${day}T23:59:59`))).toEqual({ label, start, end })
  })

  it('uses local dates, validates leap days and excludes rolled-over invalid days', () => {
    expect(localDay(new Date(2026, 8, 24, 23, 59))).toBe('2026-09-24')
    expect(validResearchDay('2024-02-29')).toBe(true)
    expect(validResearchDay('2026-02-29')).toBe(false)
    expect(validResearchDay('2026-04-31')).toBe(false)
    expect(researchDateRange('30-days', new Date('2024-03-01T00:00:00'))).toEqual({ start: '2024-02-01', end: '2024-03-01' })
  })

  it('retains zero-hour logs, and suppresses archived/deleted parents, children, estimates and other pillars', () => {
    const data = fixture()
    data.experiences.push(lab('archived', { archived: true }), lab('deleted', { deletedAt: 1 }), lab('clinical', { category: 'clinical' }))
    data.experienceHourEntries.push(log('archived-parent', '2026-08-03', 5, { experienceId: 'archived' }), log('deleted-parent', '2026-08-03', 5, { experienceId: 'deleted' }), log('clinical', '2026-08-03', 5, { experienceId: 'clinical' }), log('deleted-child', '2026-08-03', 5, { deletedAt: 1 }), log('archived-child', '2026-08-03', 5, { archived: true }))
    expect(researchLogs(data.experiences, data.experienceHourEntries).map((row) => row.id)).toEqual(['zero', 'one', 'two'])
    expect(activeResearchLabs(data.experiences).map((row) => row.id)).toEqual(['a', 'b'])
    const stats = researchStats(data, new Date('2026-09-01T12:00:00'))
    expect(stats.totals).toEqual(totalsForCategory(data.experiences, data.experienceHourEntries, 'research'))
    expect(stats.totals.total).toBe(70) // Shared lifetime semantics retain archived-parent hours.
    expect(stats.termHours).toBe(5)
    expect(stats.labDays).toBe(1)
  })

  it('chooses explicitly current lab, then latest dated log, then deterministic order/id fallback', () => {
    const data = fixture()
    data.experienceHourEntries.push(log('recent', '2026-08-03', 0, { experienceId: 'b' }))
    expect(currentResearchLab(data.experiences, data.experienceHourEntries)?.id).toBe('b')
    data.experiences[0].research = { current: true }
    expect(currentResearchLab(data.experiences, data.experienceHourEntries)?.id).toBe('a')
    expect(currentResearchLab([lab('b'), lab('a')], [])?.id).toBe('a')
    expect(currentResearchLab([], [])).toBeUndefined()
  })

  it('searches both fields with inclusive filters and groups Monday weeks without changing header totals', () => {
    const data = fixture()
    data.experienceHourEntries[0].note = 'Measured signals'
    data.experienceHourEntries[1].thoughts = 'Need to ask about controls'
    const logs = researchLogs(data.experiences, data.experienceHourEntries)
    expect(filterResearchLogs(logs, 'CONTROLS').map((row) => row.id)).toEqual(['two'])
    expect(filterResearchLogs(logs, '', { start: '2026-08-01', end: '2026-08-01' })).toHaveLength(2)
    const weeks = researchWeeks(logs)
    expect(weeks).toMatchObject([{ start: '2026-07-27', hours: 5, labDays: 1 }])
    expect(researchWeeks([log('dst-sun', '2026-03-08', 1), log('dst-mon', '2026-03-09', 2)] as ReturnType<typeof researchLogs>).map((week) => week.start)).toEqual(['2026-03-09', '2026-03-02'])
    expect(researchStats(data).totals.total).toBe(65)
  })

  it('recomputes note, hours, deletion and restoration without duplicating days or hours', () => {
    const data = fixture()
    const total = () => researchStats(data).totals.total
    data.experienceHourEntries[0].note = 'Long note unchanged by presentation'
    data.experienceHourEntries[0].thoughts = 'Why this result?'
    expect(total()).toBe(65)
    data.experienceHourEntries[0].hours = 4
    expect(total()).toBe(67)
    data.experienceHourEntries[0].deletedAt = 10
    expect(total()).toBe(63)
    delete data.experienceHourEntries[0].deletedAt
    expect(total()).toBe(67)
    expect(researchStats(data).labDays).toBe(1)
  })

  it('labels estimates without inventing terms or days, and omits absent/zero goals', () => {
    const data = fixture()
    data.experienceHourEntries = [data.experienceHourEntries[3]]
    data.goals.research = 0
    expect(researchStats(data)).toMatchObject({ termHours: 0, labDays: 0, goal: undefined, projection: null, totals: { total: 60, estimated: 60, logged: 0 } })
    data.goals.research = 100
    expect(researchStats(data)).toMatchObject({ goal: 100, totals: { total: 60 }, projection: null })
    data.experienceHourEntries = [log('only-zero', '2026-09-24', 0)]
    expect(researchStats(data)).toMatchObject({ termHours: 0, labDays: 0, totals: { total: 0 } })
  })

  it('keeps Upcoming today, hides past/inactive items, and does not mutate stored records', () => {
    const data = fixture()
    data.researchUpcomingItems = ['2026-09-23', '2026-09-24', '2026-09-25'].map((date, order) => ({ id: date, experienceId: 'a', title: date, date, createdAt: 1, updatedAt: 1, archived: false, order }))
    expect(researchUpcoming(data, 'a', '2026-09-24').map((row) => row.date)).toEqual(['2026-09-24', '2026-09-25'])
    expect(researchUpcoming(data, 'a', '2026-09-25').map((row) => row.date)).toEqual(['2026-09-25'])
    data.experiences[0].archived = true
    expect(researchUpcoming(data, 'a', '2026-09-24')).toEqual([])
    expect(data.researchUpcomingItems).toHaveLength(3)
  })
})
