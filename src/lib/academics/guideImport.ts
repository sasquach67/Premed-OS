import type { ClassCenterData, ClassNote } from '@/lib/types'
import { GUIDE_GROUPS, type GuideGroup, type GuideScope } from './studentGuide'

export type ImportedGuideEntry = { id: string; title: string; content: string; group?: GuideGroup; scope?: GuideScope }
const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value))
const normalized = (value: string) => value.trim().toLocaleLowerCase()

/** A course-specific, additive import. Never replaces existing notes or infers a broader scope. */
export function reviewGuideImport(raw: string, courseId: string, data: ClassCenterData): ImportedGuideEntry[] {
  if (raw.length > 500_000) throw new Error('This Guide is too large. Import a smaller collection.')
  const value: unknown = JSON.parse(raw)
  if (!record(value) || value.format !== 'premed-os-guide' || value.version !== 1 || value.courseId !== courseId || typeof value.id !== 'string' || !/^[\w-]{1,80}$/.test(value.id)) throw new Error('Use a Guide export for this class.')
  if (!Array.isArray(value.entries) || !value.entries.length || value.entries.length > 100) throw new Error('Include between 1 and 100 Guide entries.')
  const keys = new Set<string>()
  return value.entries.map((entry: unknown) => {
    if (!record(entry) || typeof entry.key !== 'string' || !/^[\w-]{1,80}$/.test(entry.key) || keys.has(entry.key)) throw new Error('Each entry needs a unique key.')
    keys.add(entry.key)
    if (typeof entry.headline !== 'string' || !entry.headline.trim() || entry.headline.trim().length > 180 || typeof entry.details !== 'string' || entry.details.length > 30_000) throw new Error('Use a short headline and supporting details for each entry.')
    const id = `guide-import:${courseId}:${value.id}:${entry.key}`
    if (data.notes.some(note => note.id === id && note.courseId !== courseId)) throw new Error('A saved entry belongs to another class.')
    const base = { id, title: entry.headline.trim(), content: entry.details.trim() }
    if (entry.group === 'reference') return base
    if (typeof entry.group !== 'string' || !Object.hasOwn(GUIDE_GROUPS, entry.group) || !record(entry.scope)) throw new Error('Choose a guidance group and scope for each study entry.')
    let scope: GuideScope
    if (entry.scope.kind === 'course') scope = { kind: 'course' }
    else {
      const kind = entry.scope.kind
      if ((kind !== 'lesson' && kind !== 'assessment') || typeof entry.scope.title !== 'string' || !entry.scope.title.trim()) throw new Error('Give each scoped entry its exact lesson or assessment title.')
      const title = normalized(entry.scope.title)
      const matches = (kind === 'lesson' ? data.lectures : data.assignments).filter(item => item.courseId === courseId && normalized(item.title) === title)
      if (matches.length !== 1) throw new Error(`Cannot uniquely match “${entry.scope.title}” in this class. Use its exact saved title.`)
      scope = { kind, id: matches[0].id }
    }
    return { ...base, group: entry.group as GuideGroup, scope }
  })
}

export function addGuideImport(data: ClassCenterData, courseId: string, entries: ImportedGuideEntry[], now = Date.now()): number {
  let count = 0
  for (const entry of entries) {
    if (data.notes.some(note => note.id === entry.id || (note.courseId === courseId && normalized(note.title) === normalized(entry.title) && note.content === entry.content && note.studentGuidance?.group === entry.group && JSON.stringify(note.studentGuidance?.scope) === JSON.stringify(entry.scope)))) continue
    const note: ClassNote = {
      id: entry.id, courseId, title: entry.title, content: entry.content, kind: 'about-class', type: entry.group === 'expectations' ? 'exam-review' : 'other',
      topicIds: [], linkedFileIds: [], syncStatus: 'local-only', createdAt: now, updatedAt: now, order: data.notes.length,
      ...(entry.group && entry.scope ? { studentGuidance: { group: entry.group, scope: entry.scope, origin: 'paste' as const } } : {}),
    }
    data.notes.push(note)
    count++
  }
  return count
}
