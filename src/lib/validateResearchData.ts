/** Semantic checks shared by local hydration, backups and cloud validation.
 * Legacy optional nulls are preserved. Deleted/historical relationships are
 * valid; a new active child may not silently point at a nonexistent parent. */
type RecordValue = Record<string, unknown>
const isRecord = (value: unknown): value is RecordValue => !!value && typeof value === 'object' && !Array.isArray(value)
const rows = (value: unknown): RecordValue[] => Array.isArray(value) ? value.filter(isRecord) : []
const isText = (value: unknown) => typeof value === 'string'
const hasText = (value: unknown) => isText(value) && (value as string).trim().length > 0
const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value)
const date = (value: unknown) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function validateResearchData(data: RecordValue): string[] {
  const problems: string[] = []
  const fail = (collection: string, row: RecordValue, message: string) => problems.push(`Section "${collection}" record "${String(row.id)}": ${message}.`)
  const optional = (key: string, row: RecordValue, fields: string[], check: (value: unknown) => boolean = isText) => {
    for (const field of fields) if (row[field] != null && !check(row[field])) fail(key, row, `invalid ${field}`)
  }
  const envelope = (key: string, row: RecordValue) => {
    for (const field of ['createdAt', 'updatedAt', 'order']) if (!finite(row[field])) fail(key, row, `invalid ${field}`)
    if (typeof row.archived !== 'boolean') fail(key, row, 'invalid archived flag')
    optional(key, row, ['deletedAt', 'parentDeletedAt', 'personDeletedAt'], finite)
  }
  const trash = rows(data.trash)
  const parents = rows(data.experiences)
  const people = rows(data.persons)
  const parent = (id: unknown) => parents.find((item) => item.id === id)
  const trashed = (key: string, id: unknown) => trash.some((item) => item.collection === key && isRecord(item.record) && item.record.id === id)
  const historical = (row: RecordValue) => row.deletedAt != null || row.archived === true
  const collections = ['researchUpcomingItems', 'researchReminders', 'researchTimelineNotes', 'researchMemberships']
  for (const key of ['persons', 'organizations', 'experienceHourEntries', ...collections]) {
    const seen = new Set<unknown>()
    const links = new Set<string>()
    for (const row of rows(data[key])) {
      if (seen.has(row.id)) fail(key, row, 'duplicate id')
      seen.add(row.id)
      if (key === 'persons' || key === 'organizations') {
        if (!hasText(row.name)) fail(key, row, 'name is required')
        optional(key, row, key === 'persons' ? ['email', 'phone', 'role', 'title', 'organizationId', 'notes', 'bio'] : ['location', 'website', 'notes'])
        if (key === 'persons' && row.tags != null && (!Array.isArray(row.tags) || !row.tags.every(isText))) fail(key, row, 'invalid tags')
        if (key === 'organizations' && row.type != null && !['hospital', 'clinic', 'lab', 'nonprofit', 'club', 'school', 'other'].includes(String(row.type))) fail(key, row, 'invalid type')
        continue
      }
      envelope(key, row)
      if (!hasText(row.experienceId)) fail(key, row, 'experienceId is required')
      if (key === 'experienceHourEntries') {
        if (!finite(row.hours) || (row.hours as number) < 0) fail(key, row, 'hours must be nonnegative')
        if (row.kind !== 'logged' && row.kind !== 'estimated') fail(key, row, 'invalid hour kind')
        if (row.kind === 'logged' && !date(row.date)) fail(key, row, 'logged entries require a valid date')
        if (row.kind === 'estimated' && row.date != null && row.date !== '') fail(key, row, 'estimated entries must remain undated')
        optional(key, row, ['note', 'thoughts', 'periodStart', 'periodEnd'])
        // Pre-v51 ledgers may contain orphaned historical rows. Keep them intact;
        // new Research relations below have explicit historical provenance.
        continue
      }
      const lab = parent(row.experienceId)
      if (!historical(row) && row.parentDeletedAt == null && !trashed('experiences', row.experienceId) && (!lab || lab.category !== 'research')) fail(key, row, 'active child requires a research lab')
      if (key === 'researchUpcomingItems' || key === 'researchTimelineNotes') {
        if (!date(row.date)) fail(key, row, 'valid date is required')
      }
      if (key === 'researchUpcomingItems') {
        if (!hasText(row.title)) fail(key, row, 'title is required')
        optional(key, row, ['note'])
      } else if (key === 'researchMemberships') {
        if (!hasText(row.personId)) fail(key, row, 'personId is required')
        optional(key, row, ['roleInLab', 'projectText'])
        if (!historical(row) && row.personDeletedAt == null && !people.some((item) => item.id === row.personId) && !trashed('persons', row.personId)) fail(key, row, 'active membership requires a person')
        if (!historical(row)) {
          const identity = JSON.stringify([row.experienceId, row.personId])
          if (links.has(identity)) fail(key, row, 'duplicate lab membership')
          links.add(identity)
        }
      } else if (!hasText(row.text)) fail(key, row, 'text is required')
    }
  }
  for (const row of parents) {
    optional('experiences', row, ['estimatedHoursDeletedAt'], finite)
    if (row.research == null) continue
    if (!isRecord(row.research)) { fail('experiences', row, 'research must be an object'); continue }
    optional('experiences.research', row.research, ['department', 'institution', 'researchType', 'since'])
    optional('experiences.research', row.research, ['lastPiContact'], date)
    optional('experiences.research', row.research, ['current'], (value) => typeof value === 'boolean')
  }
  return problems
}
