import { notebookVisualPracticeKey, projectNotebookEntry } from './visualProjection'
import { uid } from '@/lib/id'
import { canonical } from './package'
import type { ImportedNotebook, NotebookHistoryVersion, NotebookPackage, NotebookProgress, NotebookUpdateSession } from './types'

export const UPDATE_BASELINE_FILE = 'notebook-update-baseline.json'
/** Notebook persistence is JSON-only; this also unwraps Immer draft proxies. */
export function cloneNotebookData<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T }
export const UPDATE_BASELINE_DESCRIPTION = 'The attached exact last-saved current-content notebook JSON is the protected baseline. Preserve its unchanged content and IDs; it excludes independent notes, practice progress and unsaved drafts.'
export function legacySelectedNotebook(pkg: NotebookPackage, entryId: string): NotebookPackage {
  const entry = pkg.entries.find(item => item.id === entryId)
  if (!entry) throw new Error('The selected notebook entry is missing.')
  return { ...pkg, entries: [entry] }
}
/** Exact canonical content comparison, not a portable revision-number shortcut. */
export function notebookContentKey(n: ImportedNotebook) { return canonical(selectedNotebook(n.current, n.entryId)) }
export function legacyNotebookStateKey(n: ImportedNotebook) {
  return canonical({ content: selectedNotebook(n.current, n.entryId), notes: n.notes, progress: n.progress, history: n.history?.map(v => v.id) ?? [], session: n.updateSession?.id ?? null })
}
export function createNotebookUpdateSession(n: ImportedNotebook, localId: string, now = Date.now()): NotebookUpdateSession {
  return { id: uid(), localId, createdAt: now, baseline: cloneNotebookData(selectedNotebook(n.current, n.entryId)) }
}
export function revisionInput(session: NotebookUpdateSession) {
  const entry = session.baseline.entries[0]
  return JSON.stringify({ mode: 'update-existing-entry', baselineFile: UPDATE_BASELINE_FILE, entryId: entry.id, revision: entry.revision, baseline: UPDATE_BASELINE_DESCRIPTION })
}
export function retainNotebookVersion(n: ImportedNotebook, reason: NotebookHistoryVersion['reason'], now = Date.now()) {
  const version: NotebookHistoryVersion = { id: uid(), savedAt: now, reason, current: cloneNotebookData(n.current), notes: n.notes, progress: cloneNotebookData(n.progress), ...(n.acceptedRaw ? { acceptedRaw: n.acceptedRaw } : {}) }
  n.history = [...(n.history ?? []), version]
}
function learningContent(pkg: NotebookPackage, entryId: string) {
  const { title: _title, revision: _revision, baseRevision: _base, ...entry } = selectedNotebook(pkg, entryId).entries[0]
  return { course: pkg.course, sources: pkg.sources, entry }
}
export function legacyNotebookPracticePolicy(before: NotebookPackage, after: NotebookPackage, entryId: string) {
  const oldEntry = selectedNotebook(before, entryId).entries[0], newEntry = selectedNotebook(after, entryId).entries[0]
  const previous = oldEntry.sections.flatMap(s => s.blocks).filter(b => b.type === 'practice')
  const next = new Map(newEntry.sections.flatMap(s => s.blocks).map(b => [b.id, b]))
  let ambiguous = false
  function dependency(pkg: NotebookPackage, id: string) {
    const entry = selectedNotebook(pkg, entryId).entries[0]
    const section = entry.sections.find(s => s.blocks.some(b => b.id === id))!
    const block = section.blocks.find(b => b.id === id)!
    const objectives = entry.objectives.filter(o => o.practiceBlockIds.includes(id))
    const requirementIds = new Set(objectives.map(o => o.requirementId))
    const requirements = entry.requirements.filter(r => requirementIds.has(r.id) || r.sectionIds.includes(section.id))
    const excerpts = new Set([...block.excerptIds, ...objectives.flatMap(o => o.excerptIds), ...requirements.flatMap(r => r.excerptIds)])
    const sectionIds = new Set([section.id, ...requirements.flatMap(r => r.sectionIds)])
    const teaching = entry.sections.flatMap(s => s.blocks.filter(b => b.type !== 'practice' && (sectionIds.has(s.id) || b.excerptIds.some(id => excerpts.has(id)))).map(b => ({ section: s.id, title: s.title, purpose: s.purpose, block: b })))
    teaching.forEach(item => item.block.excerptIds.forEach(id => excerpts.add(id)))
    const sources = pkg.sources.filter(s => s.excerpts.some(e => excerpts.has(e.id))).map(s => ({ ...s, excerpts: s.excerpts.filter(e => excerpts.has(e.id)) }))
    const uncertain = !objectives.length && !requirements.length && !teaching.length
    return { uncertain, value: { block, objectives, requirements, teaching, sources, helpStage: entry.request.helpStage, assessmentFormat: entry.request.assessmentFormat, goal: entry.goal, course: pkg.course } }
  }
  const affectedIds = previous.filter(block => {
    if (next.get(block.id)?.type !== 'practice') return true
    const a = dependency(before, block.id), b = dependency(after, block.id)
    if (canonical(a.value) !== canonical(b.value)) return true
    if ((a.uncertain || b.uncertain) && canonical(learningContent(before, entryId)) !== canonical(learningContent(after, entryId))) { ambiguous = true; return true }
    return false
  }).map(block => block.id)
  return { reset: affectedIds.length > 0, affectedIds, explanation: affectedIds.length
    ? `${affectedIds.length} existing practice item(s) start fresh because their content or linked teaching/evidence changed.${ambiguous ? ' Some dependency links are missing, so the reset conservatively includes questions whose independence cannot be established.' : ''} Previous responses and checkmarks remain recoverable in history; unchanged linked items keep their self-reported study records.`
    : 'Existing practice content and its available dependency links are unchanged. Self-reported responses and checkmarks stay attached; this is not a verification of correctness or mastery.' }
}
export function retainedPractice(before: NotebookPackage, after: NotebookPackage, entryId: string, progress: NotebookProgress): NotebookProgress {
  const retained = cloneNotebookData(progress)
  for (const id of notebookPracticePolicy(before, after, entryId).affectedIds) delete retained[id]
  return retained
}
export type NotebookDifference = { kind: string; label: string; status: 'Added' | 'Changed' | 'Removed'; before?: unknown; after?: unknown }
export function legacyCompareNotebooks(before: NotebookPackage, after: NotebookPackage, entryId: string): NotebookDifference[] {
  const a = selectedNotebook(before, entryId).entries[0], b = selectedNotebook(after, entryId).entries[0]
  const changes: NotebookDifference[] = []
  const diff = (kind: string, previous: { id: string; [key: string]: unknown }[], next: { id: string; [key: string]: unknown }[]) => {
    const old = new Map(previous.map(item => [item.id, item])), incoming = new Map(next.map(item => [item.id, item]))
    for (const id of new Set([...old.keys(), ...incoming.keys()])) {
      const left = old.get(id), right = incoming.get(id)
      if (canonical(left) === canonical(right)) continue
      const item = right ?? left!
      changes.push({ kind, label: String(item.title ?? item.prompt ?? item.text ?? id).slice(0, 100), status: !left ? 'Added' : !right ? 'Removed' : 'Changed', before: left, after: right })
    }
  }
  const metadata = ({ sections: _s, objectives: _o, requirements: _r, ...entry }: typeof a) => entry
  diff('Entry details', [metadata(a)], [metadata(b)])
  diff('Course', [{ id: 'course', ...before.course }], [{ id: 'course', ...after.course }])
  diff('Section', a.sections.map(({ blocks: _b, ...s }, order) => ({ ...s, order })), b.sections.map(({ blocks: _b, ...s }, order) => ({ ...s, order })))
  diff('Content / practice', a.sections.flatMap(s => s.blocks.map((block, order) => ({ ...block, section: s.title, sectionId: s.id, order }))), b.sections.flatMap(s => s.blocks.map((block, order) => ({ ...block, section: s.title, sectionId: s.id, order }))))
  diff('Objective', a.objectives.map((o, order) => ({ ...o, order })), b.objectives.map((o, order) => ({ ...o, order })))
  diff('Requirement / coverage', a.requirements.map((r, order) => ({ ...r, order })), b.requirements.map((r, order) => ({ ...r, order })))
  diff('Source / excerpts', before.sources.map((s, order) => ({ ...s, order })), after.sources.map((s, order) => ({ ...s, order })))
  return changes
}
export function readableDifference(value: unknown): string {
  if (value === undefined) return 'Not present'
  if (value === null) return 'Not supplied'
  if (typeof value !== 'object') return String(value)
  if (Array.isArray(value)) return value.map((item, index) => `${index + 1}. ${readableDifference(item)}`).join('\n\n') || 'None'
  const labels: Record<string, string> = { prompt: 'Question', answer: 'Answer', rationale: 'Why this answer', text: 'Content', title: 'Title', scope: 'Scope', basis: 'Coverage explanation', inspected: 'Material inspected', limitations: 'Limits', freeRecallCues: 'Recall prompts', beAbleToDo: 'Apply it', watchFor: 'Watch for', sourceIds: 'Source references', excerptIds: 'Excerpt references', practiceBlockIds: 'Linked practice references', requirementId: 'Requirement reference', id: 'Reference ID' }
  const secondary = new Set(['id', 'sourceIds', 'excerptIds', 'practiceBlockIds', 'requirementId', 'sectionId', 'order', 'provenance'])
  return Object.entries(value).sort(([a], [b]) => Number(secondary.has(a)) - Number(secondary.has(b))).map(([key, item]) => `${labels[key] ?? key.replace(/([a-z])([A-Z])/g, '$1 $2')}: ${readableDifference(item)}`).join('\n')
}

export function selectedNotebook(...args: Parameters<typeof legacySelectedNotebook>): ReturnType<typeof legacySelectedNotebook> { return projectNotebookEntry(args[0], args[1]) }
export function notebookStateKey(...args: Parameters<typeof legacyNotebookStateKey>): string { const n=args[0]; return canonical({ contentAndRecords: legacyNotebookStateKey(...args), assetLineageId:n.assetLineageId, assetBindings:n.assetBindings }) }
export function notebookPracticePolicy(...args: Parameters<typeof legacyNotebookPracticePolicy>): ReturnType<typeof legacyNotebookPracticePolicy> {
 const policy=legacyNotebookPracticePolicy(...args), [before,after,entryId]=args;
 const extra=before.entries.find(e=>e.id===entryId)?.sections.flatMap(s=>s.blocks).filter(b=>b.type==='practice' && notebookVisualPracticeKey(before,entryId,b.id)!==notebookVisualPracticeKey(after,entryId,b.id)).map(b=>b.id)??[];
 const affectedIds=[...new Set([...policy.affectedIds,...extra])];
 return {...policy,reset:affectedIds.length>0,affectedIds,explanation:extra.some(id=>!policy.affectedIds.includes(id))?`${affectedIds.length} existing practice item(s) start fresh because their content, linked teaching, figures, neutral stimuli or relationships changed. Previous responses and checkmarks remain recoverable in history; unchanged linked items keep their study records.`:policy.explanation};
}
export function compareNotebooks(...args: Parameters<typeof legacyCompareNotebooks>): ReturnType<typeof legacyCompareNotebooks> {
 const changes=legacyCompareNotebooks(...args), [before,after]=args;
 const visual=(p:NotebookPackage)=>p.version!==2?{assets:p.assets,visualReview:p.visualReview}:null;
 if(canonical(visual(before))!==canonical(visual(after)))changes.push({kind:'Source / excerpts',label:'Figures and visual review',status:visual(before)===null?'Added':visual(after)===null?'Removed':'Changed',before:visual(before),after:visual(after)});
 return changes;
}
