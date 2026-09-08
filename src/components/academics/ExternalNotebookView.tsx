import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { STORAGE_KEY, useStore } from '@/store/store'
import { storageFailure } from '@/store/storageHealth'
import { exportNotebook, restoreNotebookVersion, saveNotebookEdits } from '@/lib/academics/notebook/import'
import { createNotebookUpdateSession, notebookContentKey, notebookPracticePolicy, notebookStateKey } from '@/lib/academics/notebook/revision'
import { ExternalNotebookWorkflow } from './ExternalNotebookWorkflow'
import type { NotebookBlock, NotebookEntry, NotebookPackage, NotebookProgress, Evidence } from '@/lib/academics/notebook/types'
import type { AppData, LectureRecord } from '@/lib/types'
import { canonical } from '@/lib/academics/notebook/package'
import './externalNotebook.css'

export function notebookTransaction(mutator: (state: AppData) => void) {
  const previous = useStore.getState().academics
  const persisted = localStorage.getItem(STORAGE_KEY)
  if (persisted) {
    const saved = JSON.parse(persisted) as { state?: Partial<AppData> }
    const diskEntries = saved.state?.academics?.classCenter?.lectures?.filter(l => l.importedNotebook) ?? []
    const memoryEntries = previous.classCenter.lectures.filter(l => l.importedNotebook)
    // Hydration may refresh unrelated workspace timestamps/defaults. Compare
    // the destination identity and notebook preferences, not those derived fields.
    const classSnapshot = (courses: AppData['courses'], workspaces: AppData['academics']['classCenter']['workspaces']) => ({
      courses: courses.map(({ id, code, title, term }) => ({ id, code, title, term })),
      preferences: workspaces.map(({ courseId, externalNotebookPreferences }) => ({ courseId, externalNotebookPreferences })),
    })
    const diskClasses = classSnapshot(saved.state?.courses ?? [], saved.state?.academics?.classCenter?.workspaces ?? [])
    const memoryClasses = classSnapshot(useStore.getState().courses, previous.classCenter.workspaces)
    if (canonical(diskEntries) !== canonical(memoryEntries) || canonical(diskClasses) !== canonical(memoryClasses)) throw new Error('A notebook or class changed in another tab. Reload this page before saving so its newer content and progress are not overwritten. Keep any unsaved text before reloading.')
  }
  useStore.getState().update(mutator)
  const failure = storageFailure()
  if (failure) {
    useStore.getState().update(state => { state.academics = structuredClone(previous) })
    throw new Error(`Browser storage could not save this notebook. ${failure} Free space or export your JSON and try again. No saved success was reported.`)
  }
}
export function downloadNotebookText(filename: string, text: string, mime = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
type ChangeText = (path: (string | number)[], text: string) => void
function ContentText({ value, path, label, change }: { value: string; path: (string | number)[]; label: string; change?: ChangeText }) {
  return change ? <label className="en-field">{label}<textarea value={value} onChange={event => change(path, event.target.value)} /></label> : <p className="en-text">{value}</p>
}
function EvidenceView({ evidence, pkg }: { evidence: Evidence; pkg: NotebookPackage }) {
  if (!evidence.sourceIds.length && !evidence.excerptIds.length) return <small className="en-muted">No linked source evidence</small>
  return <details className="en-evidence"><summary>Source evidence ({evidence.excerptIds.length} excerpts)</summary>{evidence.sourceIds.map(id => {
    const source = pkg.sources.find(s => s.id === id)!
    return <div key={id}><b>{source.title}</b><p>{source.role} / {source.access} / {source.used ? 'Used' : 'Not used'}</p>{source.excerpts.filter(excerpt => evidence.excerptIds.includes(excerpt.id)).map(excerpt => <blockquote key={excerpt.id}><small>{excerpt.location ?? 'Location not supplied'}</small><p className="en-text">{excerpt.text}</p></blockquote>)}</div>
  })}</details>
}
function BlockView({ block, path, change, pkg, progress, onProgress }: { block: NotebookBlock; path: (string | number)[]; change?: ChangeText; pkg: NotebookPackage; progress?: NotebookProgress; onProgress?: (id: string, response: string, complete: boolean) => void }) {
  const text = (value: string, key: string, label: string) => <ContentText value={value} path={[...path, key]} label={label} change={change} />
  const work = progress && Object.hasOwn(progress, block.id) ? progress[block.id] : { response: '', complete: false }
  return <div className={`en-block en-block-${block.type}`}>
    {block.type === 'paragraph' && text(block.text, 'text', 'Explanation')}
    {block.type === 'gap' && <div className="en-notice"><b>Source gap</b>{text(block.text, 'text', 'Gap')}{text(block.nextStep, 'nextStep', 'Next step')}</div>}
    {(block.type === 'bullets' || block.type === 'steps') && (block.type === 'steps' ? <ol>{block.items.map((item, i) => <li key={i}><ContentText value={item} path={[...path, 'items', i]} label={`Step ${i + 1}`} change={change} /></li>)}</ol> : <ul>{block.items.map((item, i) => <li key={i}><ContentText value={item} path={[...path, 'items', i]} label={`Point ${i + 1}`} change={change} /></li>)}</ul>)}
    {block.type === 'table' && <div className="en-table-scroll" role="region" aria-label="Notebook table" tabIndex={0}><table><thead><tr>{block.columns.map((column, i) => <th key={i}><ContentText value={column} path={[...path, 'columns', i]} label={`Column ${i + 1}`} change={change} /></th>)}</tr></thead><tbody>{block.rows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci}><ContentText value={cell} path={[...path, 'rows', ri, ci]} label={`Row ${ri + 1}, column ${ci + 1}`} change={change} /></td>)}</tr>)}</tbody></table></div>}
    {block.type === 'practice' && <><b>Try it yourself</b>{text(block.prompt, 'prompt', 'Practice prompt')}{onProgress && !change && <div><label className="en-field">Your response<textarea aria-label={`Your response to ${block.id}`} value={work.response} onChange={event => onProgress(block.id, event.target.value, work.complete)} /></label><label className="en-check"><input type="checkbox" checked={work.complete} onChange={event => onProgress(block.id, work.response, event.target.checked)} />I can explain this without looking</label></div>}<details className="en-answer"><summary>Reveal answer and explanation</summary>{text(block.answer, 'answer', 'Answer')}{text(block.rationale, 'rationale', 'Explanation')}<EvidenceView evidence={block} pkg={pkg} /></details></>}
    <small className="en-muted">{block.provenance.replaceAll('-', ' ')}</small>{block.type !== 'practice' && <EvidenceView evidence={block} pkg={pkg} />}
  </div>
}
type ReadingMode = 'all' | 'study' | 'practice' | 'coverage' | 'sources'
export function NotebookPackageView({ pkg, entryId, change, progress, onProgress, mode = 'all' }: { pkg: NotebookPackage; entryId?: string; change?: ChangeText; progress?: NotebookProgress; onProgress?: (id: string, response: string, complete: boolean) => void; mode?: ReadingMode }) {
  const text = (value: string, path: (string | number)[], label: string) => <ContentText value={value} path={path} label={label} change={change} />
  return <div className="external-notebook en-document"><p className="en-badge">Package class: {pkg.course.code} / {pkg.course.title}{pkg.course.term ? ` / ${pkg.course.term}` : ''}</p>
    {pkg.entries.map((entry, ei) => (!entryId || entry.id === entryId) && <article key={entry.id} aria-label={entry.title}>
      <h2>{change ? text(entry.title, ['entries', ei, 'title'], 'Entry title') : entry.title}</h2><p className="en-muted">{entry.goal} / Revision {entry.revision}{entry.baseRevision ? ` / Based on revision ${entry.baseRevision}` : ''}</p>
      <h3>Scope</h3>{text(entry.scope, ['entries', ei, 'scope'], 'Entry scope')}
      <details><summary>Request and class preferences</summary>{Object.entries(entry.request).map(([key, value]) => value !== null && <div key={key}><b>{key === 'helpStage' ? 'Help stage' : key === 'assessmentFormat' ? 'Assessment format' : 'Class preferences'}</b>{text(value, ['entries', ei, 'request', key], key)}</div>)}</details>
      {(mode === 'all' || mode === 'coverage') && <section aria-label="Requirement coverage"><h3>Requirement coverage</h3><div className="en-coverage">{(['supported', 'partial', 'missing', 'out-of-scope'] as const).map(status => <span key={status}>{status}: {entry.requirements.filter(r => r.status === status).length}</span>)}</div>
        {entry.requirements.map((r, ri) => <details key={r.id} open={r.status !== 'supported'}><summary>{r.text} / {r.status}</summary><small>{r.kind} / {r.authority}</small>{change && text(r.text, ['entries', ei, 'requirements', ri, 'text'], 'Requirement wording')}{text(r.basis, ['entries', ei, 'requirements', ri, 'basis'], 'Coverage basis')}{r.nextStep !== null && text(r.nextStep, ['entries', ei, 'requirements', ri, 'nextStep'], 'Next step')}<p>Covered in: {r.sectionIds.map(id => entry.sections.find(s => s.id === id)?.title).join(', ') || 'No section'}</p><EvidenceView evidence={r} pkg={pkg} /></details>)}
      </section>}
      {entry.sections.map((section, si) => (mode === 'all' || ((mode === 'study' || mode === 'practice') && section.blocks.some(b => mode === 'practice' ? b.type === 'practice' : b.type !== 'practice'))) && <section key={section.id} aria-label={section.title} className="en-section"><p className="en-eyebrow">{section.purpose.replaceAll('-', ' ')}</p><h3>{change ? text(section.title, ['entries', ei, 'sections', si, 'title'], 'Section title') : section.title}</h3>{section.blocks.map((block, bi) => (mode === 'all' || (mode === 'practice' ? block.type === 'practice' : block.type !== 'practice')) && <BlockView key={block.id} block={block} path={['entries', ei, 'sections', si, 'blocks', bi]} change={change} pkg={pkg} progress={progress} onProgress={onProgress} />)}</section>)}
      {(mode === 'all' || mode === 'study') && entry.objectives.length > 0 && <section aria-label="Mastery objectives"><h3>Mastery objectives</h3>{entry.objectives.map((o, oi) => <details key={o.id}><summary>{o.title} / {o.origin}</summary>{change && text(o.title, ['entries', ei, 'objectives', oi, 'title'], 'Objective title')}<p>Requirement: {entry.requirements.find(r => r.id === o.requirementId)?.text}</p><h4>Try recalling first</h4>{o.freeRecallCues.map((cue, i) => <div key={i}>{text(cue, ['entries', ei, 'objectives', oi, 'freeRecallCues', i], 'Recall cue')}</div>)}<details><summary>Reveal understanding, application, and cautions</summary>{(['understand', 'beAbleToDo', 'watchFor'] as const).map(key => <div key={key}><h4>{key === 'understand' ? 'Understand' : key === 'beAbleToDo' ? 'Be able to do' : 'Watch for'}</h4>{o[key].map((item, i) => <div key={i}>{text(item, ['entries', ei, 'objectives', oi, key, i], key)}</div>)}</div>)}{o.evidenceLimit !== null && text(o.evidenceLimit, ['entries', ei, 'objectives', oi, 'evidenceLimit'], 'Evidence limit')}<p>Practice: {o.practiceBlockIds.map(id => entry.sections.flatMap(s => s.blocks).find(b => b.id === id)).map(b => b?.type === 'practice' ? b.prompt : '').join('; ') || 'None linked'}</p><EvidenceView evidence={o} pkg={pkg}/></details></details>)}</section>}
      {entry.limitations.length > 0 && <section className="en-notice"><h3>Limits of this entry</h3>{entry.limitations.map((item, i) => <div key={i}>{text(item, ['entries', ei, 'limitations', i], 'Entry limitation')}</div>)}</section>}
    </article>)}
    {(mode === 'all' || mode === 'sources') && <details className="en-sources" open={mode === 'sources' ? true : undefined}><summary>All supplied sources and access limits ({pkg.sources.length})</summary>{pkg.sources.map((s, si) => <section key={s.id}><h3>{s.title}</h3><p>{s.role} / {s.access} / {s.used ? 'Used' : 'Not used'}</p>{text(s.inspected, ['sources', si, 'inspected'], 'What was inspected')}{s.limitations.map((item, i) => <div key={i}>{text(item, ['sources', si, 'limitations', i], 'Source limitation')}</div>)}{s.excerpts.map((e, i) => <blockquote key={e.id}><small>{e.location ?? 'Location not supplied'}</small>{text(e.text, ['sources', si, 'excerpts', i, 'text'], 'Supplied excerpt')}</blockquote>)}</section>)}</details>}
    <small className="en-muted">{pkg.instructionsVersion}. Externally created; structural validation does not verify teaching accuracy or source completeness.</small>
  </div>
}
export function ExternalNotebookView({ lecture, courseCode, onNavigateEntry }: { lecture: LectureRecord; courseCode: string; onNavigateEntry?: (id: string) => void }) {
  const n = lecture.importedNotebook!
  const [draft, setDraft] = useState<NotebookPackage | null>(null)
  const [notes, setNotes] = useState(n.notes)
  const [notesBase, setNotesBase] = useState(n.notes)
  const [editBase, setEditBase] = useState(notebookContentKey(n))
  const [updating, setUpdating] = useState(Boolean(n.updateSession))
  const [restore, setRestore] = useState<{ id: string; state: string } | null>(null)
  const [mode, setMode] = useState<ReadingMode>('study')
  const [message, setMessage] = useState('')
  function updateText(path: (string | number)[], value: string) {
    setDraft(previous => {
      const next = structuredClone(previous ?? n.current)
      let node: unknown = next
      for (const key of path.slice(0, -1)) node = (node as Record<string | number, unknown>)[key]
      ;(node as Record<string | number, unknown>)[path.at(-1)!] = value
      return next
    })
  }
  function progress(id: string, response: string, complete: boolean) {
    try {
      notebookTransaction(state => { const target = state.academics.classCenter.lectures.find(l => l.id === lecture.id && l.courseId === lecture.courseId); if (!target?.importedNotebook) throw new Error('Entry no longer exists.'); target.importedNotebook.progress = { ...target.importedNotebook.progress, [id]: { response, complete } }; target.updatedAt = Date.now() })
      setMessage('Response and progress saved.')
    } catch (error) { setMessage((error as Error).message) }
  }
  function save() {
    try {
      const policy = notebookPracticePolicy(n.current, draft ?? n.current, n.entryId)
      notebookTransaction(state => { const target = state.academics.classCenter.lectures.find(l => l.id === lecture.id && l.courseId === lecture.courseId); if (!target) throw new Error('Entry no longer exists.'); saveNotebookEdits(target, draft ?? n.current, notes, Date.now(), { content: draft ? editBase : notebookContentKey(n), notes: notesBase }) })
      setDraft(null); setNotesBase(notes); setMessage(`Edits saved. Original import retained. ${policy.explanation}`)
    } catch (error) { setMessage((error as Error).message) }
  }
  function startUpdate(restart = false) {
    if (draft || notes !== n.notes) { setMessage('Save your edits and notes, or cancel the unsaved changes, before starting an update. Only saved content is exported.'); return }
    try {
      notebookTransaction(state => {
        const target = state.academics.classCenter.lectures.find(l => l.id === lecture.id && l.courseId === lecture.courseId)
        if (!target?.importedNotebook || notebookStateKey(target.importedNotebook) !== notebookStateKey(n)) throw new Error('This notebook changed. Reopen its latest saved content before starting an update.')
        if (restart || !target.importedNotebook.updateSession) target.importedNotebook.updateSession = createNotebookUpdateSession(target.importedNotebook, target.id)
      })
      setUpdating(true); setMessage('')
    } catch (error) { setMessage((error as Error).message) }
  }
  function restoreVersion() {
    if (!restore) return
    if (draft || notes !== n.notes) { setMessage('Save or cancel unsaved edits and notes before restoring.'); return }
    try {
      notebookTransaction(state => {
        const target = state.academics.classCenter.lectures.find(l => l.id === lecture.id && l.courseId === lecture.courseId)
        if (!target) throw new Error('Entry no longer exists.')
        restoreNotebookVersion(target, restore.id, restore.state)
      })
      const restored = useStore.getState().academics.classCenter.lectures.find(l => l.id === lecture.id)!.importedNotebook!
      setNotes(restored.notes); setNotesBase(restored.notes); setRestore(null); setMessage('Version restored with its notes and study records. The version it replaced is also retained in history.')
    } catch (error) { setMessage((error as Error).message) }
  }
  if (updating && n.updateSession) return <section className="external-notebook" aria-label="Update saved notebook"><div className="en-actions"><Button variant="outline" onClick={() => setUpdating(false)}>Back to saved entry</Button><Button variant="ghost" onClick={() => startUpdate(true)}>Restart from latest saved entry</Button></div><p className="en-muted">Restart only when you need a newer baseline. Keep any unfinished prompt or proposal first; it starts a fresh update draft, not a new notebook.</p><p role="status">{message}</p><ExternalNotebookWorkflow key={n.updateSession.id} courseId={lecture.courseId} revision={n.updateSession} onImported={id => { setUpdating(false); setMessage(id === lecture.id ? 'Notebook update saved. Previous versions remain in history.' : 'Separate entry saved. The original notebook remains unchanged.'); onNavigateEntry?.(id) }} /></section>
  const restoreVersionPreview = restore ? n.history?.find(v => v.id === restore.id) : undefined
  return <section className="external-notebook" aria-label="Saved external notebook"><header className="en-header"><div><p className="en-eyebrow">Saved in {courseCode}</p><h1>{lecture.title}</h1><p>Imported notebook{n.editedAt ? ' / Updated locally' : ''}</p></div><div className="en-actions"><Button variant="outline" disabled={Boolean(draft)} onClick={() => { setDraft(structuredClone(n.current)); setEditBase(notebookContentKey(n)); setMessage('Editing a separate copy. Save to keep changes; the previous content stays in history.') }}>Edit entry</Button><Button onClick={() => startUpdate()}>Update with new material</Button></div></header>
    <details className="en-small-detail"><summary>Export and backup</summary><div className="en-actions"><Button variant="outline" onClick={() => downloadNotebookText('notebook-current.json', exportNotebook(lecture, 'current'))}>Export current JSON</Button><Button variant="outline" onClick={() => downloadNotebookText('notebook-original.json', exportNotebook(lecture, 'original'))}>Export original</Button><Button variant="outline" onClick={() => downloadNotebookText('notebook-backup.json', exportNotebook(lecture, 'backup'))}>Backup with progress</Button></div></details>
    {n.revisedFromLectureId && <p className="en-notice">Saved as a separate revision. Your earlier entry, edits, and progress remain in the class notebook.</p>}
    <p className="en-muted">Current JSON contains saved content and sources for your AI. The backup additionally contains notes, progress, and the original import; it is an archive, not an AI notebook package.</p>
    {draft && <div className="en-notice"><b>Editing your copy</b><p>Exports use the last saved content. Reveal collapsed sections to edit their text.</p><p>{notebookPracticePolicy(n.current, draft, n.entryId).explanation}</p><div className="en-actions"><Button onClick={save}>Save edits</Button><Button variant="outline" onClick={() => { setDraft(null); setNotes(n.notes); setNotesBase(n.notes); setMessage('Unsaved content changes discarded.') }}>Cancel edits</Button></div></div>}
    <label className="en-field">My notes<textarea value={notes} onChange={event => setNotes(event.target.value)} /></label>{!draft && <div className="en-actions"><Button variant="outline" onClick={save}>Save notes</Button>{notes !== n.notes && <Button variant="ghost" onClick={() => { setNotes(n.notes); setNotesBase(n.notes); setMessage('Unsaved notes discarded.') }}>Cancel note changes</Button>}</div>}
    <p role="status" aria-live="polite">{message}</p>
    <details className="en-history"><summary>Version history ({n.history?.length ?? 0})</summary><p>Saved versions retain content, sources, notes and study records. Restoring also retains the version it replaces. Storage is limited; backups include history.</p>{!(n.history?.length) && <p>No earlier versions yet.</p>}{[...(n.history ?? [])].reverse().map(version => <div className="en-history-row" key={version.id}><span>{new Date(version.savedAt).toLocaleString()} / before {version.reason} / {version.current.entries.find(e => e.id === n.entryId)?.title}</span><Button variant="outline" onClick={() => setRestore({ id: version.id, state: notebookStateKey(n) })}>Review this version</Button></div>)}{restoreVersionPreview && <section className="en-stage-panel" aria-label="Restore preview"><h3>Review before restoring</h3><p>This restores the shown content and its saved notes and study records. Your current version will remain recoverable.</p><p className="en-text">Saved notes: {restoreVersionPreview.notes || 'None'}</p><details><summary>Saved practice responses and checkmarks</summary>{Object.entries(restoreVersionPreview.progress).map(([id, work]) => <p className="en-text" key={id}>{id}: {work.response || 'No response'} / {work.complete ? 'Checked by you' : 'Not checked'}</p>)}</details><NotebookPackageView pkg={restoreVersionPreview.current} entryId={n.entryId} /><div className="en-actions"><Button disabled={Boolean(draft) || notes !== n.notes} onClick={restoreVersion}>Restore this version</Button><Button variant="outline" onClick={() => setRestore(null)}>Cancel restore</Button></div></section>}</details>
    <nav className="en-actions" aria-label="Notebook reading views">{(['study', 'practice', 'coverage', 'sources'] as const).map(view => <Button key={view} variant={mode === view ? 'default' : 'outline'} aria-pressed={mode === view} onClick={() => setMode(view)}>{view === 'study' ? lecture.notebookGoal === 'assessment' ? 'Assessment prep' : lecture.notebookGoal === 'assignment' ? 'Assignment workspace' : 'Study guide' : view === 'practice' ? 'Practice' : view === 'coverage' ? 'Coverage' : 'Sources'}</Button>)}</nav>
    <NotebookPackageView mode={draft ? 'all' : mode} pkg={draft ?? n.current} entryId={n.entryId} change={draft ? updateText : undefined} progress={n.progress} onProgress={progress} />
  </section>
}
export function notebookEntryLabel(entry: NotebookEntry) { return `${entry.title} / ${entry.goal} / revision ${entry.revision}` }
