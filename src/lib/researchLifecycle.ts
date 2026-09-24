import type { AppData, CollectionKey, ExperienceHourEntry, ResearchChild } from './types'

export const RESEARCH_COLLECTIONS = ['researchUpcomingItems', 'researchReminders', 'researchTimelineNotes', 'researchMemberships'] as const

type Row = { id: string; [key: string]: unknown }

function linkedRows(data: AppData): Array<ResearchChild | ExperienceHourEntry> {
  const active = [...data.experienceHourEntries, ...RESEARCH_COLLECTIONS.flatMap<ResearchChild>((key) => data[key])]
  const historical = data.trash.filter((item) => item.collection === 'experienceHourEntries' || RESEARCH_COLLECTIONS.some((key) => key === item.collection))
    .map((item) => item.record as unknown as ResearchChild)
  return [...active, ...historical]
}

/** Called before removal. Parent deletion does not delete its children. The
 * provenance marker permits historical links to survive permanent Trash purge. */
export function recordResearchDeletion(data: AppData, key: CollectionKey, record: Row, deletedAt: number): void {
  if (key === 'experiences') {
    for (const child of linkedRows(data)) if (child.experienceId === record.id) child.parentDeletedAt = deletedAt
  }
  if (key === 'persons') {
    const memberships = [...data.researchMemberships, ...data.trash.filter((item) => item.collection === 'researchMemberships').map((item) => item.record)]
    for (const membership of memberships) if (membership.personId === record.id) membership.personDeletedAt = deletedAt
  }
  if (key === 'experienceHourEntries' && record.id === `experience-hour-legacy-${record.experienceId}`) {
    const parent = data.experiences.find((item) => item.id === record.experienceId)
      ?? data.trash.find((item) => item.collection === 'experiences' && item.record.id === record.experienceId)?.record
    if (parent) parent.estimatedHoursDeletedAt = deletedAt
  }
}

/** Reconcile after restore/undo, in either parent/child order. Never fabricates a
 * missing parent or clears a tombstone merely because its child was purged. */
export function reconcileResearchRelations(data: AppData): void {
  const parentIds = new Set(data.experiences.filter((item) => item.deletedAt == null).map((item) => item.id))
  const personIds = new Set(data.persons.filter((item) => item.deletedAt == null).map((item) => item.id))
  for (const child of linkedRows(data)) if (parentIds.has(child.experienceId)) delete child.parentDeletedAt
  for (const membership of data.researchMemberships) if (personIds.has(membership.personId)) delete membership.personDeletedAt
  for (const entry of data.experienceHourEntries) {
    if (entry.deletedAt != null || entry.id !== `experience-hour-legacy-${entry.experienceId}`) continue
    const parent = data.experiences.find((item) => item.id === entry.experienceId)
      ?? data.trash.find((item) => item.collection === 'experiences' && item.record.id === entry.experienceId)?.record
    if (parent) delete parent.estimatedHoursDeletedAt
  }
}

/** Shared by durable Research transactions and generic Trash actions. */
export function trashResearchRecord(data: AppData, key: CollectionKey, id: string, deletedAt = Date.now()): boolean {
  const rows = data[key] as unknown as Row[]
  const index = rows.findIndex((row) => row.id === id)
  if (index < 0) return false
  const record = rows[index]
  recordResearchDeletion(data, key, record, deletedAt)
  rows.splice(index, 1)
  data.trash.unshift({ id: crypto.randomUUID(), collection: key, deletedAt, record: { ...record, deletedAt } })
  return true
}
