import type { AppData, ExperienceHourEntry } from '@/lib/types'

/**
 * v15 turns each legacy aggregate into one explicitly estimated child block.
 * It is pure and idempotent: it neither invents dates nor divides totals.
 */
export function migrateExperienceHoursV15(data: AppData): AppData {
  const existing = Array.isArray(data.experienceHourEntries) ? data.experienceHourEntries : []
  const ids = new Set(existing.map((entry) => entry.id))
  const entries = [...existing]
  let nextOrder = entries.reduce((max, entry) => Math.max(max, entry.order ?? -1), -1) + 1
  let changed = !Array.isArray(data.experienceHourEntries)

  for (const experience of data.experiences ?? []) {
    const hours = Number(experience.hours)
    if (!Number.isFinite(hours) || hours <= 0) continue
    const id = `experience-hour-legacy-${experience.id}`
    if (ids.has(id)) continue
    const migrated: ExperienceHourEntry = {
      id,
      experienceId: experience.id,
      hours,
      kind: 'estimated',
      periodStart: experience.startDate,
      periodEnd: experience.endDate,
      note: 'Imported from a legacy aggregate total.',
      createdAt: experience.createdAt ?? 0,
      updatedAt: experience.updatedAt ?? experience.createdAt ?? 0,
      archived: Boolean(experience.archived),
      deletedAt: experience.deletedAt,
      source: { type: 'import', provider: 'legacy-experience-aggregate' },
      order: nextOrder++,
    }
    entries.push(migrated)
    ids.add(id)
    changed = true
  }

  return changed ? { ...data, experienceHourEntries: entries } : data
}
