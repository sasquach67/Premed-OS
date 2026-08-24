import type { SyllabusItem, SyllabusKind, SyllabusProposal } from '@/lib/academics/syllabusParser'

export type SharedSyllabusScope = {
  institution: string
  courseCode: string
  term: string
  section: string
}

export type SharedStructure = {
  units: Array<{ title: string; order: number }>
  dates: Array<{ kind: 'exam' | 'deadline'; title: string; date: string | null; order: number }>
  gradeCategories: Array<{ name: string; weight: number; order: number }>
  policyFlags: string[]
  publicLogistics: Array<{ kind: 'instructor' | 'office-hours'; value: string }>
}

export type SharedSyllabusCandidate = {
  id: string
  scope: SharedSyllabusScope
  structure: SharedStructure
  parsedAt: string
  revisedAt: string | null
  independentParseCount: number
  importCount: number
  correctionCount: number
  conflicts: string[]
}

const clean = (value: string) => value.replace(/\s+/g, ' ').trim()
export const normalizeSharedSyllabusScope = (scope: SharedSyllabusScope): SharedSyllabusScope => ({
  institution: clean(scope.institution).toLowerCase(),
  courseCode: clean(scope.courseCode).toUpperCase(),
  term: clean(scope.term).toLowerCase(),
  section: clean(scope.section).toLowerCase(),
})

const isIsoDate = (value: string | undefined) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))

/** The browser is never trusted with the sharing boundary. This same shape is
 * validated again in the Edge Function before persistence. */
export function serializeSharedSyllabusStructure(items: SyllabusItem[]): SharedStructure {
  const unique = <T>(rows: T[], key: (row: T) => string) => rows.filter((row, index) => rows.findIndex((candidate) => key(candidate) === key(row)) === index)
  const units = unique(items.filter((item) => item.kind === 'units' && clean(item.label)).map((item, order) => ({ title: clean(item.label), order })), (item) => item.title.toLowerCase())
  const dates = unique(items.filter((item) => (item.kind === 'exams' || item.kind === 'deadlines') && clean(item.label)).map((item, order) => ({
    kind: item.kind === 'exams' ? 'exam' as const : 'deadline' as const,
    title: clean(item.label), date: isIsoDate(item.value) ? item.value! : null, order,
  })), (item) => `${item.kind}:${item.title.toLowerCase()}:${item.date ?? ''}`)
  const gradeCategories = unique(items.filter((item) => item.kind === 'weights' && clean(item.label)).map((item, order) => ({
    name: clean(item.label), weight: Number(item.value?.replace('%', '')) || 0, order,
  })).filter((item) => item.weight >= 0 && item.weight <= 100), (item) => item.name.toLowerCase())
  // The parser currently records policies/logistics as prose. Do not allow that
  // prose into a shared row until it is explicitly modeled as a safe flag.
  return { units, dates, gradeCategories, policyFlags: [], publicLogistics: [] }
}

export function sharedCandidateToProposal(candidate: SharedSyllabusCandidate): SyllabusProposal {
  const item = (kind: SyllabusKind, label: string, value: string | undefined, order: number): SyllabusItem => ({
    id: `shared:${candidate.id}:${kind}:${order}`,
    kind, label, value, confidence: 'high',
    evidence: { location: 'Shared parsed structure', quote: 'Shared by someone in this section' },
  })
  const items = [
    ...candidate.structure.units.map((row) => item('units', row.title, undefined, row.order)),
    ...candidate.structure.dates.map((row) => item(row.kind === 'exam' ? 'exams' : 'deadlines', row.title, row.date ?? undefined, row.order)),
    ...candidate.structure.gradeCategories.map((row) => item('weights', row.name, `${row.weight}%`, row.order)),
  ]
  return {
    sourceName: 'Shared parsed structure', sourceKind: 'shared', text: '', items,
    searched: { identity: 'Shared structure', exams: 'Shared structure', weights: 'Shared structure', units: 'Shared structure', deadlines: 'Shared structure', policies: 'Not shared', logistics: 'Not shared' },
    scanDetected: false, documentKind: 'syllabus', structureFound: ['weights', 'exams', 'units'], numberedItems: 0,
  }
}

export type SharedCandidateDiff = { key: string; item: SyllabusItem; status: 'added' | 'changed'; defaultAction: 'keep' }
const itemKey = (item: SyllabusItem) => `${item.kind}:${clean(item.label).toLowerCase()}`
/** Candidate values can only stage into the current private proposal after a
 * deliberate accept. The caller still has to press the existing Apply rail. */
export function diffSharedCandidate(local: SyllabusItem[], candidate: SharedSyllabusCandidate): SharedCandidateDiff[] {
  const candidateItems = sharedCandidateToProposal(candidate).items
  const existing = new Map(local.map((item) => [itemKey(item), item]))
  const rows: SharedCandidateDiff[] = []
  candidateItems.forEach((item) => {
    const current = existing.get(itemKey(item))
    if (!current) rows.push({ key: itemKey(item), item, status: 'added', defaultAction: 'keep' })
    else if (current.value !== item.value) rows.push({ key: itemKey(item), item, status: 'changed', defaultAction: 'keep' })
  })
  return rows
}
export function stageAcceptedSharedItems(local: SyllabusItem[], rows: SharedCandidateDiff[], accepted: Set<string>) {
  const staged = new Map(local.map((item) => [itemKey(item), item]))
  rows.filter((row) => accepted.has(row.key)).forEach((row) => staged.set(row.key, row.item))
  return [...staged.values()]
}

export function sharedScopeIsComplete(scope: SharedSyllabusScope) {
  return Object.values(normalizeSharedSyllabusScope(scope)).every(Boolean)
}
