import { describe, expect, it } from 'vitest'
import { hourPaceProjection, totalsForCategory } from '@/lib/experienceHours'
import type { ExperienceEntry, ExperienceHourEntry } from '@/lib/types'

const position = { id: 'clinical', category: 'clinical', org: 'Clinic', role: 'Volunteer', description: '', status: 'active', tags: [], order: 0 } satisfies ExperienceEntry
const logged = (id: string, date: string, hours: number): ExperienceHourEntry => ({ id, experienceId: 'clinical', kind: 'logged', date, hours, createdAt: 1, updatedAt: 1, archived: false, order: 0 })

describe('experience hour evidence', () => {
  it('keeps aggregate estimates out of the measured rate while retaining them in the total', () => {
    const entries: ExperienceHourEntry[] = [
      { id: 'estimate', experienceId: 'clinical', kind: 'estimated', hours: 20, createdAt: 1, updatedAt: 1, archived: false, order: 0 },
      logged('first', '2026-08-01', 4),
      logged('second', '2026-08-08', 6),
    ]
    expect(totalsForCategory([position], entries, 'clinical')).toEqual({ total: 30, logged: 10, estimated: 20 })
    expect(hourPaceProjection([position], entries, 'clinical', 50, new Date('2026-08-08T12:00:00'))).toMatchObject({
      loggedHours: 10, weeklyRate: 10, remainingHours: 20, projectedDate: '2026-08-22',
    })
  })

  it('returns dormant when the record cannot establish an observed interval', () => {
    expect(hourPaceProjection([position], [logged('only', '2026-08-01', 4)], 'clinical', 50)).toBeNull()
    expect(hourPaceProjection([position], [logged('same-a', '2026-08-01', 4), logged('same-b', '2026-08-01', 4)], 'clinical', 50)).toBeNull()
  })
})
