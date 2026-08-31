import type { AssignedReading, ClassAssignment, GradeCategory, SyllabusScheduleEntry, Topic } from '@/lib/types'
import type { SyllabusItem } from '@/lib/academics/syllabusParser'

export type ReimportStatus = 'added' | 'changed' | 'removed' | 'unchanged'
export interface ReimportRow { key: string; kind: 'topic' | 'assignment' | 'category' | 'reading' | 'schedule'; status: ReimportStatus; current?: string; proposed?: string; defaultAction: 'keep' | 'accept' }

export const syllabusTopicSourceKey = (title: string | undefined) => (title ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
export const syllabusAssignmentSourceKey = (title: string | undefined, date?: string) => `${syllabusTopicSourceKey(title)}|${syllabusTopicSourceKey(date)}`
export const syllabusCategorySourceKey = (title: string | undefined) => syllabusTopicSourceKey(title).replace(/[—–:-]+$/, '').trim()
export const syllabusReadingSourceKey = (title: string | undefined, week?: string, date?: string) => `${syllabusTopicSourceKey(title)}|${syllabusTopicSourceKey(week)}|${syllabusTopicSourceKey(date)}`
export const syllabusReadingCalendarSourceKey = (title: string | undefined, week?: string, date?: string) => `reading-calendar:${syllabusReadingSourceKey(title, week, date)}`
export const syllabusScheduleSourceKey = (label: string | undefined, week?: string, date?: string) => `${syllabusTopicSourceKey(label)}|${syllabusTopicSourceKey(week)}|${syllabusTopicSourceKey(date)}`

/** Identity-based only: an inserted unit cannot make following records look changed. */
export function syllabusReimportDiff(current: { topics: Topic[]; assignments: ClassAssignment[]; categories: GradeCategory[]; readings?: AssignedReading[]; schedule?: SyllabusScheduleEntry[] }, proposal: SyllabusItem[]): ReimportRow[] {
  const rows: ReimportRow[] = []
  const proposedTopics = proposal.filter((item) => item.kind === 'standards')
  const proposedAssignments = proposal.filter((item) => item.kind === 'exams' || item.kind === 'deadlines')
  const proposedCategories = proposal.filter((item) => item.kind === 'weights')
  const proposedReadings = proposal.filter((item) => item.kind === 'readings')
  const proposedSchedule = proposal.filter((item) => item.kind === 'units')
  const compare = <T>(kind: ReimportRow['kind'], currentRows: T[], proposedRows: SyllabusItem[], keyOfCurrent: (row: T) => string, valueOfCurrent: (row: T) => string, keyOfProposal: (row: SyllabusItem) => string, valueOfProposal: (row: SyllabusItem) => string) => {
    const old = new Map(currentRows.map((row) => [keyOfCurrent(row), row]))
    const next = new Map(proposedRows.map((row) => [keyOfProposal(row), row]))
    for (const [key, item] of next) {
      const prior = old.get(key)
      if (!prior) rows.push({ key, kind, status: 'added', proposed: valueOfProposal(item), defaultAction: 'accept' })
      else if (valueOfCurrent(prior) !== valueOfProposal(item)) rows.push({ key, kind, status: 'changed', current: valueOfCurrent(prior), proposed: valueOfProposal(item), defaultAction: 'keep' })
      else rows.push({ key, kind, status: 'unchanged', current: valueOfCurrent(prior), proposed: valueOfProposal(item), defaultAction: 'keep' })
    }
    for (const [key, item] of old) if (!next.has(key)) rows.push({ key, kind, status: 'removed', current: valueOfCurrent(item), defaultAction: 'keep' })
  }
  compare('topic', current.topics, proposedTopics, (item) => item.syllabusSourceKey ?? syllabusTopicSourceKey(item.title), (item) => item.title, (item) => syllabusTopicSourceKey(item.label), (item) => item.label)
  compare('assignment', current.assignments.filter((item) => !item.syllabusSourceKey?.startsWith('reading-calendar:')), proposedAssignments, (item) => item.syllabusSourceKey ?? syllabusAssignmentSourceKey(item.title, item.dueDate), (item) => `${item.title} · ${item.dueDate ?? 'no date'}`, (item) => syllabusAssignmentSourceKey(item.label, item.value), (item) => `${item.label} · ${item.value ?? 'no date'}`)
  compare('category', current.categories, proposedCategories, (item) => item.syllabusSourceKey ?? syllabusCategorySourceKey(item.name), (item) => `${item.name} · ${item.weight}%`, (item) => syllabusCategorySourceKey(item.label), (item) => `${item.label} · ${item.value ?? '0%'}`)
  compare('reading', current.readings ?? [], proposedReadings, (item) => item.syllabusSourceKey ?? syllabusReadingSourceKey(item.title, item.week, item.dueForDiscussion), (item) => `${item.week} · ${item.title} · ${item.dueForDiscussion ?? 'no date'}`, (item) => syllabusReadingSourceKey(item.label, item.context, item.value), (item) => `${item.context ?? 'Unscheduled'} · ${item.label} · ${item.value ?? 'no date'}`)
  compare('schedule', current.schedule ?? [], proposedSchedule, (item) => syllabusScheduleSourceKey(item.label, item.week, item.startDate), (item) => `${item.week} · ${item.label} · ${item.startDate ?? 'no date'}`, (item) => syllabusScheduleSourceKey(item.label, item.context, item.value), (item) => `${item.context ?? 'Unscheduled'} · ${item.label} · ${item.value ?? 'no date'}`)
  return rows
}
