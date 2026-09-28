import { hourPaceProjection, totalsForCategory } from '@/lib/experienceHours'
import type { AppData, CollectionRecord, ExperienceEntry, ExperienceHourEntry } from '@/lib/types'

export type ResearchLab = CollectionRecord<ExperienceEntry>
export type ResearchLog = CollectionRecord<ExperienceHourEntry> & { date: string }
export interface ResearchDateRange { start?: string; end?: string }
export interface ResearchTerm extends ResearchDateRange { start: string; end: string; label: string }

/** Local calendar dates avoid UTC offsets changing the student's day or term. */
export function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function validResearchDay(day: string | undefined): day is string {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false
  const date = new Date(`${day}T12:00:00`)
  return Number.isFinite(date.getTime()) && localDay(date) === day
}

export function researchTerm(now = new Date()): ResearchTerm {
  const year = now.getFullYear()
  const day = localDay(now)
  if (day >= `${year}-08-01`) return { label: `Fall ${year}`, start: `${year}-08-01`, end: `${year}-12-31` }
  if (day >= `${year}-05-16`) return { label: `Summer ${year}`, start: `${year}-05-16`, end: `${year}-07-31` }
  return { label: `Spring ${year}`, start: `${year}-01-01`, end: `${year}-05-15` }
}

export function researchDateRange(mode: 'term' | '30-days' | 'all' | 'custom', now = new Date(), custom: ResearchDateRange = {}): ResearchDateRange {
  if (mode === 'term') return researchTerm(now)
  if (mode === 'custom') return custom
  if (mode === 'all') return {}
  const start = new Date(now)
  start.setDate(start.getDate() - 29)
  return { start: localDay(start), end: localDay(now) }
}

export function activeResearchLabs(experiences: AppData['experiences']): ResearchLab[] {
  return experiences.filter((lab) => lab.category === 'research' && !lab.deletedAt && !lab.archived)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
}

/** This deliberately does not reuse positive-hours aggregates: zero-hour notes are real logs. */
export function researchLogs(experiences: AppData['experiences'], entries: AppData['experienceHourEntries']): ResearchLog[] {
  const labs = new Set(activeResearchLabs(experiences).map((lab) => lab.id))
  return entries.filter((entry): entry is ResearchLog => labs.has(entry.experienceId) && !entry.archived && !entry.deletedAt
    && entry.kind === 'logged' && Number.isFinite(entry.hours) && entry.hours >= 0 && validResearchDay(entry.date))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt || a.id.localeCompare(b.id))
}

export function currentResearchLab(experiences: AppData['experiences'], entries: AppData['experienceHourEntries']): ResearchLab | undefined {
  const labs = activeResearchLabs(experiences)
  const explicit = labs.find((lab) => lab.research?.current)
  if (explicit) return explicit
  const latest = researchLogs(experiences, entries)[0]
  return labs.find((lab) => lab.id === latest?.experienceId) ?? labs[0]
}

export function filterResearchLogs(logs: ResearchLog[], search = '', range: ResearchDateRange = {}): ResearchLog[] {
  const query = search.trim().toLocaleLowerCase()
  return logs.filter((log) => (!range.start || log.date >= range.start) && (!range.end || log.date <= range.end)
    && (!query || `${log.note ?? ''}\n${log.thoughts ?? ''}`.toLocaleLowerCase().includes(query)))
}

export function researchLogTotals(logs: ResearchLog[]) {
  return { hours: logs.reduce((sum, log) => sum + log.hours, 0), labDays: new Set(logs.filter((log) => log.hours > 0).map((log) => log.date)).size }
}

/** Weeks begin Monday in local calendar time, including across DST changes. */
export function researchWeeks(logs: ResearchLog[]) {
  const groups = new Map<string, ResearchLog[]>()
  for (const log of logs) {
    const monday = new Date(`${log.date}T12:00:00`)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    const key = localDay(monday)
    groups.set(key, [...(groups.get(key) ?? []), log])
  }
  return [...groups].sort(([a], [b]) => b.localeCompare(a)).map(([start, entries]) => ({ start, entries, ...researchLogTotals(entries) }))
}

/** Header totals deliberately share Overview's archived-parent semantics. Log/term/day
 * retrieval excludes archived labs; lifetime totals retain their positive recorded hours. */
export function researchStats(data: Pick<AppData, 'experiences' | 'experienceHourEntries' | 'goals'>, now = new Date()) {
  const logs = researchLogs(data.experiences, data.experienceHourEntries)
  const term = researchTerm(now)
  const goal = data.goals.research > 0 ? data.goals.research : undefined
  return {
    totals: totalsForCategory(data.experiences, data.experienceHourEntries, 'research'),
    term,
    termHours: researchLogTotals(filterResearchLogs(logs, '', term)).hours,
    labDays: researchLogTotals(logs).labDays,
    goal,
    projection: hourPaceProjection(data.experiences, data.experienceHourEntries, 'research', goal, now),
  }
}

export function researchUpcoming(data: Pick<AppData, 'experiences' | 'researchUpcomingItems'>, experienceId: string, today = localDay()) {
  if (!activeResearchLabs(data.experiences).some((lab) => lab.id === experienceId)) return []
  return data.researchUpcomingItems.filter((item) => item.experienceId === experienceId && !item.archived && !item.deletedAt && item.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order || a.id.localeCompare(b.id))
}
