import { requireNotebookAssetCommit } from './notebookAssetStore'
import { assertNotebookBackupFits, portableNotebookPackages } from './notebookBundle'
import { cloneNotebookData as cloneVisualData } from './revision'
import { projectNotebookEntry } from './visualProjection'
import { mergeNotebookAssetBindings } from './visualAssets'
import type { ImportedNotebook as VisualImportedNotebook } from './types'
import type { ClassCenterData, LectureRecord } from '@/lib/types'
import { uid } from '@/lib/id'
import type { ImportedNotebook, NotebookPackage, NotebookUpdateSession } from './types'
import { canonical, parseNotebookPackage, type PreparedNotebook } from './package'
import { cloneNotebookData, notebookContentKey, notebookStateKey, retainNotebookVersion, retainedPractice, selectedNotebook } from './revision'
export const normalizedCourseCode = (code: string) => code.replace(/\s+/g, '').toUpperCase()
export function notebookDestinationMismatch(pkg: NotebookPackage, course: { code: string; title?: string; term?: string }) {
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase()
  return normalizedCourseCode(pkg.course.code) !== normalizedCourseCode(course.code)
    || (course.title !== undefined && normalize(pkg.course.title) !== normalize(course.title))
    || (pkg.course.term !== null && course.term !== undefined && normalize(pkg.course.term) !== normalize(course.term))
}
export function inspectNotebookImport(center: ClassCenterData, courseId: string, prepared: PreparedNotebook) {
  const acceptedPackages = new Map<string, NotebookPackage | null>()
  const entryKey = (p: NotebookPackage, id: string) => canonical(p.version !== 2 ? projectNotebookEntry(p, id) : { ...p, entries: p.entries.filter(e => e.id === id) })
  return prepared.package.entries.map((entry, index) => {
    const candidates = center.lectures.filter(l => l.courseId === courseId && l.importedNotebook?.entryId === entry.id && normalizedCourseCode(l.importedNotebook.original.course.code) === normalizedCourseCode(prepared.package.course.code))
    const incoming = entryKey(prepared.package, entry.id)
    const duplicate = candidates.find(l => {
      const imported = l.importedNotebook!
      if (((prepared.package.version !== 2 || imported.fingerprint === prepared.fingerprints[index]) && entryKey(imported.original, imported.entryId) === incoming)
        || entryKey(imported.current, imported.entryId) === incoming) return true
      // Accepted proposal provenance survives later edits and restores. Recognize
      // a replay without treating the historical payload as current content.
      return [...new Set([imported.acceptedRaw, ...(imported.history ?? []).map(v => v.acceptedRaw)])].some(raw => {
        if (!raw) return false
        if (!acceptedPackages.has(raw)) { try { acceptedPackages.set(raw, parseNotebookPackage(raw)) } catch { acceptedPackages.set(raw, null) } }
        const accepted = acceptedPackages.get(raw)
        return Boolean(accepted?.entries.some(e => e.id === imported.entryId) && entryKey(accepted!, imported.entryId) === incoming)
      })
    })
    const previous = candidates.sort((a, b) => b.createdAt - a.createdAt)[0]
    return { entry, duplicate, previous }
  })
}
/** Synchronous, fully validated transaction. No mutation occurs until every entry is staged. */
function legacyImportNotebook(center: ClassCenterData, course: { id: string; code: string; title?: string; term?: string }, prepared: PreparedNotebook, options: { confirmDestination?: boolean; confirmRevisions?: boolean } = {}, now = Date.now()) {
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
function legacySaveNotebookEdits(lecture: LectureRecord, next: NotebookPackage, notes: string, now = Date.now(), expected?: { content: string; notes: string }) {
  const imported = lecture.importedNotebook
  if (!imported) throw new Error('This is not an imported notebook.')
  const validated = parseNotebookPackage(JSON.stringify(next))
  if (expected && (notebookContentKey(imported) !== expected.content || imported.notes !== expected.notes)) throw new Error('This entry or its notes changed while you were editing. Keep your unsaved text, cancel editing, and compare it with the latest saved entry before trying again.')
  const originalEntry = imported.current.entries.find(e => e.id === imported.entryId)!
  const currentEntry = validated.entries.find(e => e.id === imported.entryId)
  if (!currentEntry || currentEntry.revision !== originalEntry.revision || currentEntry.baseRevision !== originalEntry.baseRevision || currentEntry.goal !== originalEntry.goal || canonical(validated.course) !== canonical(imported.current.course)) throw new Error('Keep the entry identity, revision, goal, and course unchanged while editing. Use Update with new material for AI revisions.')
  if (canonical(validated.entries.filter(e => e.id !== imported.entryId)) !== canonical(imported.current.entries.filter(e => e.id !== imported.entryId))) throw new Error('Edit only the selected entry; other entries must stay unchanged.')
  if (canonical(validated) !== canonical(imported.current)) {
    const progress = retainedPractice(imported.current, validated, imported.entryId, imported.progress)
    retainNotebookVersion(imported, 'edit', now)
    imported.progress = progress
  }
  imported.current = validated; imported.notes = notes; imported.editedAt = now
  lecture.title = currentEntry.title; lecture.updatedAt = now
}
export function inspectNotebookUpdate(center: ClassCenterData, courseId: string, prepared: PreparedNotebook, session: NotebookUpdateSession) {
  const target = center.lectures.find(l => l.id === session.localId && l.courseId === courseId)
  if (!target?.importedNotebook) throw new Error('The intended notebook no longer exists. Save the proposal separately or reopen the intended entry.')
  const n = target.importedNotebook, baseline = session.baseline.entries[0]
  if (!baseline || session.baseline.entries.length !== 1 || n.entryId !== baseline.id) throw new Error('The update baseline does not identify this notebook. Start Update with new material from the intended entry.')
  const incoming = prepared.package.entries.find(e => e.id === n.entryId)
  if (!incoming) throw new Error('The proposal is missing the selected notebook identity. Ask your AI to preserve the baseline entry ID, or save a separate entry.')
  if (canonical(prepared.package.course) !== canonical(session.baseline.course) || canonical(n.current.course) !== canonical(session.baseline.course) || incoming.goal !== baseline.goal) throw new Error('Course or goal differs from the saved baseline. Same-entry acceptance is blocked; correct the proposal or use a separate import.')
  const alreadyApplied = canonical(selectedNotebook(prepared.package, n.entryId)) === notebookContentKey(n)
  if (!alreadyApplied) {
    if (n.updateSession?.id !== session.id || canonical(n.updateSession.baseline) !== canonical(session.baseline)) throw new Error('This update session is no longer current. Reopen Update with new material and export the latest saved baseline.')
    if (notebookContentKey(n) !== canonical(session.baseline)) throw new Error('Saved content changed after the baseline was exported. Keep the newer edits: restart this update with the latest saved baseline, or save this proposal separately.')
    if (incoming.baseRevision !== baseline.revision || incoming.revision !== baseline.revision + 1) throw new Error('The proposal must use the saved baseline revision and the next revision number. Correct it in your AI or save it separately.')
  }
  const extras = inspectNotebookImport(center, courseId, prepared).filter(item => item.entry.id !== n.entryId)
  if (extras.some(item => !item.duplicate && (item.previous || item.entry.revision !== 1 || item.entry.baseRevision !== null))) throw new Error('Additional entries must be genuinely new topics, not revisions of other saved notebooks. Remove those entries or import the proposal separately.')
  return { target, incoming, alreadyApplied, extras }
}
/** Stage target, history, and new topics together before mutating the caller. */
function legacyAcceptNotebookUpdate(center: ClassCenterData, course: { id: string; code: string; title?: string; term?: string }, prepared: PreparedNotebook, session: NotebookUpdateSession, confirmed: boolean, now = Date.now()) {
  if (!confirmed) throw new Error('Review the comparison and practice policy, then explicitly accept the update.')
  const parsed = parseNotebookPackage(prepared.raw)
  if (canonical(parsed) !== canonical(prepared.package) || prepared.fingerprints.length !== parsed.entries.length) throw new Error('The proposal changed. Validate and compare it again.')
  if (notebookDestinationMismatch(parsed, course)) throw new Error('The destination class or term changed. Reopen the intended class; same-entry acceptance is blocked.')
  const plan = inspectNotebookUpdate(center, course.id, prepared, session)
  const staged = { ...center, lectures: cloneNotebookData(center.lectures) }
  const target = staged.lectures.find(l => l.id === plan.target.id)!, n = target.importedNotebook!
  if (!plan.alreadyApplied) {
    const next = selectedNotebook(parsed, n.entryId)
    const progress = retainedPractice(n.current, next, n.entryId, n.progress)
    retainNotebookVersion(n, 'update', now)
    n.current = next; n.progress = progress; n.acceptedRaw = prepared.raw; n.editedAt = now
    target.title = plan.incoming.title; target.notebookRequest = plan.incoming.scope; target.updatedAt = now
  }
  delete n.updateSession
  const extraEntries = parsed.entries.filter(e => e.id !== n.entryId)
  let extraIds: string[] = []
  if (extraEntries.length) {
    // The public wrapper already authorized this complete proposal. Keep its
    // valid evidence closure and exact raw provenance: removing only the target
    // would strand its visual manifest and fall outside the staged grant. The
    // target now dedupes against its accepted projection; only new topics save.
    const importedIds = legacyImportNotebook(staged, course, prepared, {}, now)
    extraIds = parsed.entries.flatMap((entry, index) => entry.id === n.entryId ? [] : [importedIds[index]])
  }
  center.lectures = staged.lectures
  return [target.id, ...extraIds]
}
function legacyRestoreNotebookVersion(lecture: LectureRecord, versionId: string, expectedState: string, now = Date.now()) {
  const n = lecture.importedNotebook
  if (!n || notebookStateKey(n) !== expectedState) throw new Error('The entry, notes, progress or history changed after this restore preview. Review the latest state before restoring.')
  const version = n.history?.find(item => item.id === versionId)
  if (!version) throw new Error('That saved version is no longer available.')
  const validated = parseNotebookPackage(JSON.stringify(version.current))
  const entry = validated.entries.find(e => e.id === n.entryId)
  if (!entry || canonical(validated.course) !== canonical(n.current.course) || entry.goal !== n.current.entries.find(e => e.id === n.entryId)?.goal) throw new Error('The saved version identity or course does not match this notebook.')
  const current = cloneNotebookData(validated), notes = version.notes, progress = cloneNotebookData(version.progress), acceptedRaw = version.acceptedRaw
  retainNotebookVersion(n, 'restore', now)
  n.current = current; n.notes = notes; n.progress = progress; n.acceptedRaw = acceptedRaw; n.editedAt = now
  delete n.updateSession
  lecture.title = entry.title; lecture.notebookRequest = entry.scope; lecture.updatedAt = now
}
function legacyExportNotebook(lecture: LectureRecord, kind: 'current' | 'original' | 'backup') {
  const n = lecture.importedNotebook
  if (!n) throw new Error('This is not an imported notebook.')
  if (kind === 'original') return n.originalRaw
  if (kind === 'current') return JSON.stringify({ ...n.current, entries: n.current.entries.filter(e => e.id === n.entryId) }, null, 2)
  return JSON.stringify({ format: 'premed-os-notebook-backup', version: 1, destinationCourseId: lecture.courseId, notebook: n }, null, 2)
}

function attachNotebookAssets(n:VisualImportedNotebook, state:ReturnType<typeof requireNotebookAssetCommit>, courseId:string) {
 mergeNotebookAssetBindings(n.assetBindings??[],state.assetBindings);
 if(n.assetLineageId&&n.assetLineageId!==state.assetLineageId)throw new Error('This notebook already has a protected image lineage. Revalidate against its saved image bindings before saving; no content or records changed.');
 const ids=new Set(portableNotebookPackages(n).flatMap(p=>p.version !== 2?p.assets.map(a=>a.id):[]));
 n.assetBindings=state.assetBindings.filter(b=>ids.has(b.assetId)).map(b=>({...b}));
 n.assetLineageId??=state.assetLineageId;
 assertNotebookBackupFits(n,courseId);
}
export function importNotebook(...args:Parameters<typeof legacyImportNotebook>):ReturnType<typeof legacyImportNotebook> {
 if(args[2].package.version===2)return legacyImportNotebook(...args);
 const grant=requireNotebookAssetCommit(args[2].package),[center,...rest]=args, staged=cloneVisualData(center),ids=legacyImportNotebook(staged,...rest);
 for(const id of ids){const n=staged.lectures.find(l=>l.id===id)?.importedNotebook;if(n){const previous=n.revisedFromLectureId?center.lectures.find(l=>l.id===n.revisedFromLectureId)?.importedNotebook:undefined;if(previous){mergeNotebookAssetBindings(previous.assetBindings??[],grant.assetBindings);if(previous.assetLineageId&&previous.assetLineageId!==grant.assetLineageId)throw new Error('A separate revision must retain its existing image lineage and cannot rebind its image IDs.')}attachNotebookAssets(n,grant,args[1].id)}}
 center.lectures=staged.lectures;return ids;
}
export function acceptNotebookUpdate(...args:Parameters<typeof legacyAcceptNotebookUpdate>):ReturnType<typeof legacyAcceptNotebookUpdate> {
 const [center,course,prepared,session]=args,target=center.lectures.find(l=>l.id===session.localId)?.importedNotebook;
 if(target?.current.version===4 && prepared.package.version!==4)throw new Error('A v4 notebook cannot be downgraded by an update. Restore a retained older version explicitly instead.');
 if(prepared.package.version===2){if(target && target.current.version !== 2)throw new Error('An update cannot silently downgrade a visual notebook to v2. Return the complete v3 notebook and its image references.');return legacyAcceptNotebookUpdate(...args)}
 const grant=requireNotebookAssetCommit(prepared.package),staged=cloneVisualData(center),[, ...rest]=args,ids=legacyAcceptNotebookUpdate(staged,...rest);
 for(const id of ids){const n=staged.lectures.find(l=>l.id===id)?.importedNotebook;if(n)attachNotebookAssets(n,grant,course.id)}
 center.lectures=staged.lectures;return ids;
}
export function saveNotebookEdits(...args:Parameters<typeof legacySaveNotebookEdits>):ReturnType<typeof legacySaveNotebookEdits> {
 const [lecture,next,...rest]=args;
 if(lecture.importedNotebook?.current.version===4 && next.version!==4)throw new Error('Editing cannot remove the v4 visual contract. Restore an older version explicitly instead.');
 if(next.version===2&&lecture.importedNotebook?.current.version !== 2)throw new Error('Editing cannot remove the visual notebook contract. Keep v3 and its retained images.');
 if(next.version===2&&!lecture.importedNotebook?.assetBindings?.length)return legacySaveNotebookEdits(...args);
 const staged=cloneVisualData(lecture),result=legacySaveNotebookEdits(staged,next,...rest);
 if(staged.importedNotebook)assertNotebookBackupFits(staged.importedNotebook,staged.courseId);
 Object.assign(lecture,staged);return result;
}
export function restoreNotebookVersion(...args:Parameters<typeof legacyRestoreNotebookVersion>):ReturnType<typeof legacyRestoreNotebookVersion> {
 const [lecture,...rest]=args,n=lecture.importedNotebook;
 if(!n||!portableNotebookPackages(n).some(p=>p.version !== 2))return legacyRestoreNotebookVersion(...args);
 const staged=cloneVisualData(lecture),result=legacyRestoreNotebookVersion(staged,...rest);
 if(staged.importedNotebook)assertNotebookBackupFits(staged.importedNotebook,staged.courseId);
 Object.assign(lecture,staged);return result;
}
export function exportNotebook(...args:Parameters<typeof legacyExportNotebook>):ReturnType<typeof legacyExportNotebook> {
 const [lecture,kind]=args,n=lecture.importedNotebook;
 if(n && n.current.version !== 2&&kind==='current')return JSON.stringify(projectNotebookEntry(n.current,n.entryId),null,2);
 return legacyExportNotebook(...args);
}

export function restoreCompleteNotebookBackup(center: ClassCenterData, course: { id: string; code: string; title?: string; term?: string }, notebook: ImportedNotebook, original: PreparedNotebook, confirmed: boolean, confirmDestination = false): string[] {
  if (!confirmed) throw new Error('Explicitly confirm restoring the complete backup. Existing entries will not be overwritten.')
  if (notebookDestinationMismatch(notebook.current, course) && !confirmDestination) throw new Error('Confirm restoring this backup into a different class or term.')
  if (canonical(original.package) !== canonical(notebook.original) || original.raw !== notebook.originalRaw) throw new Error('The backup original changed. Choose and validate the complete bundle again.')
  const grant = requireNotebookAssetCommit(notebook.current), restored = cloneNotebookData(notebook)
  delete restored.assetLineageId
  attachNotebookAssets(restored, grant, course.id)
  const key = (n: ImportedNotebook) => { const copy = cloneNotebookData(n); delete copy.assetLineageId; if (copy.updateSession) copy.updateSession.localId = ''; return canonical(copy) }
  const related = center.lectures.filter(l => l.courseId === course.id && l.importedNotebook?.entryId === restored.entryId)
  for (const lecture of related) {
    mergeNotebookAssetBindings(lecture.importedNotebook!.assetBindings ?? [], grant.assetBindings)
    if (key(lecture.importedNotebook!) === key(restored)) return [lecture.id]
  }
  const staging = { ...center, lectures: [] as LectureRecord[] }
  legacyImportNotebook(staging, course, original, { confirmDestination })
  const lecture = staging.lectures.find(l => l.importedNotebook?.entryId === restored.entryId)
  if (!lecture) throw new Error('The backup does not identify one restorable notebook.')
  if (restored.updateSession) restored.updateSession.localId = lecture.id
  lecture.importedNotebook = restored; lecture.title = restored.current.entries.find(e => e.id === restored.entryId)!.title
  assertNotebookBackupFits(restored, course.id)
  center.lectures.push(lecture)
  return [lecture.id]
}
