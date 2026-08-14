import type { ClassAssignment, GradeCategory, Topic } from '@/lib/types'
import type { SyllabusItem } from '@/lib/academics/syllabusParser'

export type ReimportStatus = 'added' | 'changed' | 'removed' | 'unchanged'
export interface ReimportRow { key: string; kind: 'topic' | 'assignment' | 'category'; status: ReimportStatus; current?: string; proposed?: string; defaultAction: 'keep' | 'accept' }

const normalized = (value: string | undefined) => (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
const assignmentKey = (title: string, date?: string) => `${normalized(title)}|${normalized(date)}`

/** Identity-based only: an inserted unit cannot make following records look changed. */
export function syllabusReimportDiff(current: { topics: Topic[]; assignments: ClassAssignment[]; categories: GradeCategory[] }, proposal: SyllabusItem[]): ReimportRow[] {
  const rows: ReimportRow[] = []
  const proposedTopics = proposal.filter((item) => item.kind === 'units')
  const proposedAssignments = proposal.filter((item) => item.kind === 'exams' || item.kind === 'deadlines')
  const proposedCategories = proposal.filter((item) => item.kind === 'weights')
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
  compare('topic', current.topics, proposedTopics, (item) => normalized(item.title), (item) => item.title, (item) => normalized(item.label), (item) => item.label)
  compare('assignment', current.assignments, proposedAssignments, (item) => assignmentKey(item.title, item.dueDate), (item) => `${item.title} · ${item.dueDate ?? 'no date'}`, (item) => assignmentKey(item.label, item.value), (item) => `${item.label} · ${item.value ?? 'no date'}`)
  compare('category', current.categories, proposedCategories, (item) => normalized(item.name), (item) => `${item.name} · ${item.weight}%`, (item) => normalized(item.label), (item) => `${item.label} · ${item.value ?? '0%'}`)
  return rows
}
