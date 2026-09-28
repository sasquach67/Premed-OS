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
  const parentIds = new Set((data.experiences ?? []).map((row) => row.id))
  for (const item of data.trash ?? []) if (item.collection === 'experiences') parentIds.add(item.record.id)
  return {
    ...data,
    // Zero denotes an unresolved historical deletion, never a guessed date.
    experienceHourEntries: (data.experienceHourEntries ?? []).map((row) =>
      !parentIds.has(row.experienceId) && row.parentDeletedAt == null ? { ...row, parentDeletedAt: 0 } : row),
    experiences,
    trash: (data.trash ?? []).map((item) => {
      const deletedAt = deletedEstimates.get(item.record.id)
      return item.collection === 'experiences' && deletedAt != null && item.record.estimatedHoursDeletedAt == null
        ? { ...item, record: { ...item.record, estimatedHoursDeletedAt: deletedAt } } : item
    }),
    researchUpcomingItems: data.researchUpcomingItems ?? [],
    researchReminders: data.researchReminders ?? [],
    researchTimelineNotes: data.researchTimelineNotes ?? [],
    researchMemberships: data.researchMemberships ?? [],
  }
}
