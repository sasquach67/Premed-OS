import type { AppData } from '@/lib/types'

/** Additive Research containers. Existing labs, people, notes and text are not
 * rewritten, inferred, linked by name, or truncated. Backfill deletion evidence
 * for legacy estimates already in Trash, before that evidence can be purged. */
export function migrateResearchV51(data: AppData): AppData {
  const deletedEstimates = new Map((data.trash ?? [])
    .filter((row) => row.collection === 'experienceHourEntries' && row.record.id === `experience-hour-legacy-${row.record.experienceId}`)
    .map((row) => [row.record.experienceId, row.deletedAt]))
  const experiences = (data.experiences ?? []).map((row) => {
    const deletedAt = deletedEstimates.get(row.id)
    return deletedAt != null && row.estimatedHoursDeletedAt == null ? { ...row, estimatedHoursDeletedAt: deletedAt } : row
  })
  return {
    ...data,
    experiences,
    researchUpcomingItems: data.researchUpcomingItems ?? [],
    researchReminders: data.researchReminders ?? [],
    researchTimelineNotes: data.researchTimelineNotes ?? [],
    researchMemberships: data.researchMemberships ?? [],
  }
}
