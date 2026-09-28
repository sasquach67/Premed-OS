import type { AppData } from '@/lib/types'

/** A recommendation, never permission to replace data without a user choice. */
export function newestAccountCopy(deviceSavedAt: number | null | undefined, cloudSavedAt: string): 'device' | 'cloud' | null {
  const cloud = Date.parse(cloudSavedAt)
  if (typeof deviceSavedAt !== 'number' || !Number.isFinite(deviceSavedAt) || deviceSavedAt <= 0 || !Number.isFinite(cloud) || cloud <= 0 || deviceSavedAt === cloud) return null
  return deviceSavedAt > cloud ? 'device' : 'cloud'
}

export function accountCopySavedTime(value: number | string | null | undefined): string {
  const time = typeof value === 'string' ? Date.parse(value) : value
  return typeof time === 'number' && Number.isFinite(time) && time > 0 ? `Saved ${new Date(time).toLocaleString()}` : 'Saved time unavailable'
}

const only = (a: { id: string }[], b: { id: string }[]) => {
  const other = new Set(b.map(row => row.id))
  return a.filter(row => !other.has(row.id)).length
}
/** Counts explain the choice; they are not used to establish content equality. */
export function accountCopyUniqueSummary(data: AppData, other: AppData, side: 'device' | 'cloud'): string {
  const researchIds = new Set([...data.experiences, ...other.experiences].filter(row => row.category === 'research').map(row => row.id))
  const research = (copy: AppData) => (copy.experienceHourEntries ?? []).filter(row => researchIds.has(row.experienceId))
  const categories: [string, string, number][] = [
    ['notebook', 'notebooks', only(data.academics?.classCenter?.lectures ?? [], other.academics?.classCenter?.lectures ?? [])],
    ['Research log entry', 'Research log entries', only(research(data), research(other))],
    ['research lab', 'research labs', only(data.experiences.filter(row => row.category === 'research'), other.experiences.filter(row => row.category === 'research'))],
    ['task', 'tasks', only(data.tasks, other.tasks)],
    ['assignment', 'assignments', only(data.academics?.classCenter?.assignments ?? [], other.academics?.classCenter?.assignments ?? [])],
    ['material', 'materials', only(data.academics?.classCenter?.files ?? [], other.academics?.classCenter?.files ?? [])],
  ]
  const parts = categories.filter(([, , count]) => count > 0).map(([singular, plural, count]) => `${count} ${count === 1 ? singular : plural}`)
  if (!parts.length) return 'Existing records or other settings differ. See differences for details.'
  return `${parts.join(', ')} only ${side === 'device' ? 'on this device' : 'in the cloud'}. Other edits may differ too.`
}
