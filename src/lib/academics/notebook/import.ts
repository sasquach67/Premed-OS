import type { ClassCenterData, LectureRecord } from '@/lib/types'
import { uid } from '@/lib/id'
import type { ImportedNotebook, NotebookPackage } from './types'
import { canonical, parseNotebookPackage, type PreparedNotebook } from './package'
export const normalizedCourseCode = (code: string) => code.replace(/\s+/g, '').toUpperCase()
export function notebookDestinationMismatch(pkg: NotebookPackage, course: { code: string; title?: string; term?: string }) {
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase()
  return normalizedCourseCode(pkg.course.code) !== normalizedCourseCode(course.code)
    || (course.title !== undefined && normalize(pkg.course.title) !== normalize(course.title))
    || (pkg.course.term !== null && course.term !== undefined && normalize(pkg.course.term) !== normalize(course.term))
}
export function inspectNotebookImport(center: ClassCenterData, courseId: string, prepared: PreparedNotebook) {
  return prepared.package.entries.map((entry, index) => {
    const candidates = center.lectures.filter(l => l.courseId === courseId && l.importedNotebook?.entryId === entry.id && normalizedCourseCode(l.importedNotebook.original.course.code) === normalizedCourseCode(prepared.package.course.code))
    const incoming = canonical({ ...prepared.package, entries: [entry] })
    const duplicate = candidates.find(l => {
      const imported = l.importedNotebook!
      return (imported.fingerprint === prepared.fingerprints[index] && canonical({ ...imported.original, entries: imported.original.entries.filter(e => e.id === imported.entryId) }) === incoming)
        || canonical({ ...imported.current, entries: imported.current.entries.filter(e => e.id === imported.entryId) }) === incoming
    })
    const previous = candidates.sort((a, b) => b.createdAt - a.createdAt)[0]
    return { entry, duplicate, previous }
  })
}
/** Synchronous, fully validated transaction. No mutation occurs until every entry is staged. */
export function importNotebook(center: ClassCenterData, course: { id: string; code: string; title?: string; term?: string }, prepared: PreparedNotebook, options: { confirmDestination?: boolean; confirmRevisions?: boolean } = {}, now = Date.now()) {
  const p = parseNotebookPackage(prepared.raw)
  if (canonical(p) !== canonical(prepared.package) || prepared.fingerprints.length !== p.entries.length) throw new Error('The preview changed. Validate the JSON again.')
  if (notebookDestinationMismatch(p, course) && !options.confirmDestination) throw new Error(`Confirm saving ${p.course.code} / ${p.course.title} / ${p.course.term ?? 'term unknown'} into ${course.code} / ${course.title ?? ''} / ${course.term ?? ''}.`)
  const plan = inspectNotebookImport(center, course.id, prepared)
  if (plan.some(item => item.previous && !item.duplicate) && !options.confirmRevisions) throw new Error('Confirm saving revised content as separate entries. Existing edits and progress will stay unchanged.')
  const staged: LectureRecord[] = []
  const ids = plan.map(({ entry, duplicate, previous }, index) => {
    if (duplicate) return duplicate.id
    const importedNotebook: ImportedNotebook = { original: p, current: p, originalRaw: prepared.raw, entryId: entry.id, fingerprint: prepared.fingerprints[index], importedAt: now, progress: {}, notes: '', ...(previous ? { revisedFromLectureId: previous.id } : {}) }
    const lecture: LectureRecord = { id: uid(), courseId: course.id, title: entry.title, notebookGoal: entry.goal, notebookGeneratedGoal: entry.goal, notebookRequest: entry.scope, notebookOutput: entry.goal === 'review' ? 'study-package' : 'tailored-page', inputPath: 'materials', processingState: 'ready', workspaceState: 'complete', importedNotebook, createdAt: now, updatedAt: now, order: center.lectures.filter(l => l.courseId === course.id).length + staged.length }
    staged.push(lecture)
    return lecture.id
  })
  center.lectures.push(...staged)
  return ids
}
export function saveNotebookEdits(lecture: LectureRecord, next: NotebookPackage, notes: string, now = Date.now()) {
  const imported = lecture.importedNotebook
  if (!imported) throw new Error('This is not an imported notebook.')
  const validated = parseNotebookPackage(JSON.stringify(next))
  const originalEntry = imported.original.entries.find(e => e.id === imported.entryId)!
  const currentEntry = validated.entries.find(e => e.id === imported.entryId)
  if (!currentEntry || currentEntry.revision !== originalEntry.revision || currentEntry.baseRevision !== originalEntry.baseRevision || canonical(validated.course) !== canonical(imported.current.course)) throw new Error('Keep the entry identity, revision, and course unchanged while editing. Import AI revisions separately.')
  // Retain progress even if a practice block was removed; backup keeps orphaned responses too.
  imported.current = validated; imported.notes = notes; imported.editedAt = now
  lecture.title = currentEntry.title; lecture.updatedAt = now
}
export function exportNotebook(lecture: LectureRecord, kind: 'current' | 'original' | 'backup') {
  const n = lecture.importedNotebook
  if (!n) throw new Error('This is not an imported notebook.')
  if (kind === 'original') return n.originalRaw
  if (kind === 'current') return JSON.stringify({ ...n.current, entries: n.current.entries.filter(e => e.id === n.entryId) }, null, 2)
  return JSON.stringify({ format: 'premed-os-notebook-backup', version: 1, destinationCourseId: lecture.courseId, notebook: n }, null, 2)
}
