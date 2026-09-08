import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/store'
import { NOTEBOOK_MAX_BYTES, prepareNotebook, type PreparedNotebook } from '@/lib/academics/notebook/package'
import { acceptNotebookUpdate, importNotebook, inspectNotebookImport, inspectNotebookUpdate, notebookDestinationMismatch } from '@/lib/academics/notebook/import'
import type { NotebookUpdateSession } from '@/lib/academics/notebook/types'
import { NotebookComparison } from './NotebookComparison'
import { NotebookPackageView, notebookEntryLabel, notebookTransaction } from './ExternalNotebookView'
export function NotebookImportPanel({ courseId, onImported, initialRaw = '', onRawChange, revision }: { courseId: string; onImported: (id: string) => void; initialRaw?: string; onRawChange?: (raw: string) => void; revision?: NotebookUpdateSession }) {
  const course = useStore(s => s.courses.find(c => c.id === courseId))
  const center = useStore(s => s.academics.classCenter)
  const [raw, setRawState] = useState(initialRaw)
  const [restoredInput] = useState(Boolean(initialRaw))
  function setRaw(text: string) { setRawState(text); onRawChange?.(text) }
  const [preview, setPreview] = useState<PreparedNotebook | null>(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [destination, setDestination] = useState(false)
  const [revisions, setRevisions] = useState(false)
  const [separate, setSeparate] = useState(false)
  const [acceptChanges, setAcceptChanges] = useState(false)
  const attempt = useRef(0)
  const plan = preview ? inspectNotebookImport(center, courseId, preview) : []
  const wrongCourse = Boolean(preview && course && notebookDestinationMismatch(preview.package, course))
  const revised = plan.some(item => item.previous && !item.duplicate)
  const duplicates = plan.filter(item => item.duplicate)
  const updating = Boolean(revision && !separate)
  let updateError = ''
  let updatePlan: ReturnType<typeof inspectNotebookUpdate> | undefined
  if (preview && revision) { try { updatePlan = inspectNotebookUpdate(center, courseId, preview, revision) } catch (failure) { updateError = (failure as Error).message } }
  const blockers = updating ? [updateError, !acceptChanges ? 'review and confirm the changes and practice policy' : '', wrongCourse ? 'resolve the destination class mismatch' : ''].filter(Boolean) : [wrongCourse && !destination ? 'confirm the different class or term' : '', revised && !revisions ? 'confirm saving revised content separately' : ''].filter(Boolean)
  function clearPreview() { attempt.current++; setPreview(null); setError(''); setStatus(''); setDestination(false); setRevisions(false); setAcceptChanges(false); setBusy(false) }
  async function validate(text = raw) {
    const id = ++attempt.current; setBusy(true); setError(''); setPreview(null); setDestination(false); setRevisions(false); setAcceptChanges(false)
    try { const result = await prepareNotebook(text); if (id === attempt.current) { setPreview(result); setStatus('Package structure and references validated. Review the content before saving.') } }
    catch (failure) { if (id === attempt.current) setError((failure as Error).message) }
    finally { if (id === attempt.current) setBusy(false) }
  }
  async function save() {
    if (!preview || !course || busy) return
    const id = ++attempt.current; setBusy(true); setError('')
    try {
      const validated = await prepareNotebook(raw)
      if (id !== attempt.current) return
      let ids: string[] = []
      notebookTransaction(state => {
        const currentCourse = state.courses.find(c => c.id === courseId)
        if (!currentCourse) throw new Error('The destination class no longer exists.')
        ids = revision && !separate ? acceptNotebookUpdate(state.academics.classCenter, currentCourse, validated, revision, acceptChanges) : importNotebook(state.academics.classCenter, currentCourse, validated, { confirmDestination: destination, confirmRevisions: revisions })
      })
      setStatus(`Saved in ${course.code}.`); onImported(ids[0])
    } catch (failure) { if (id === attempt.current) setError((failure as Error).message) }
    finally { if (id === attempt.current) setBusy(false) }
  }
  if (!course) return <p role="alert">Destination class not found. Open import from an existing class notebook.</p>
  return <section className="external-notebook en-import" aria-label="Import external notebook"><h2 className="en-import-heading">{preview ? 'Review before saving' : 'Choose your notebook file'}</h2><p className="en-import-lead">{preview ? `Check the content and source coverage. Nothing is saved to ${course.code} yet.` : `Use the complete final .json notebook from your AI. You will see a preview before saving to ${course.code}.`}</p>
    <details className="en-import-inputs" open={!preview}><summary>{preview ? 'Change the file or JSON' : 'Choose a file or paste JSON'}</summary>
    <label className="en-field en-upload">Notebook JSON file<input type="file" accept=".json,application/json" disabled={busy} onChange={async event => {
      const file = event.target.files?.[0]; clearPreview(); if (!file) return
      const id = ++attempt.current; setBusy(true)
      try {
        if (file.size > NOTEBOOK_MAX_BYTES) throw new Error('$: Choose a package under 8 MB. Nothing was saved.')
        const text = await file.text(); if (id !== attempt.current) return
        setRaw(text); await validate(text)
      } catch (failure) { if (id === attempt.current) { setError((failure as Error).message); setBusy(false) } }
    }} /></label>
    <details className="en-paste" open={Boolean(initialRaw)}><summary>Paste JSON instead</summary><label className="en-field">Paste complete JSON<textarea className="en-json" value={raw} disabled={busy} onChange={event => { clearPreview(); setRaw(event.target.value) }} placeholder="Paste the complete notebook package or fenced JSON block" /></label>
    <Button disabled={busy || !raw.trim()} onClick={() => void validate()}>{busy ? 'Checking package...' : 'Validate and preview'}</Button></details>
    </details>
    <p className="en-import-limit">Complete notebook JSON only, not working checkpoint files. Up to 8 MiB; browser storage may run out earlier. Keep your downloaded copy.</p>
    {restoredInput && !preview && <p className="en-import-limit">Your unsaved JSON is kept. Check that it matches the current request, then validate it again before saving.</p>}
    {error && <div className="en-notice en-error" role="alert"><b>Nothing was saved</b><p className="en-text">{error}</p><Button variant="outline" onClick={() => { void navigator.clipboard.writeText(`Repair this notebook package error: ${error}\nPreserve all other content, source text, IDs, and revisions. Return the complete valid JSON package, not a patch.\n\nOriginal JSON:\n${raw}`).then(() => setStatus('Repair request copied.'), () => setStatus('Clipboard unavailable. Select the error and JSON to copy them.')) }}>Copy repair request and JSON</Button></div>}
    <p role="status" aria-live="polite">{status}</p>
    {preview && <div aria-label="Validated notebook preview"><div className="en-import-summary"><h3>{updating ? 'Update the selected entry in' : 'Save to'} {course.code}</h3><p>{course.title} / {course.term}</p><p>{preview.package.entries.length} {preview.package.entries.length === 1 ? 'entry' : 'entries'} / {preview.package.sources.length} supplied sources</p><ul>{plan.map(item => { const oldRevision = item.previous?.importedNotebook?.current.entries.find(e => e.id === item.entry.id)?.revision; return <li key={item.entry.id}>{notebookEntryLabel(item.entry)}{item.duplicate ? ' / Already saved' : oldRevision !== undefined ? item.entry.revision > oldRevision ? ' / Newer revision' : item.entry.revision < oldRevision ? ' / Older revision' : ' / Changed content at the same revision' : ' / New entry'}</li> })}</ul></div>
      {revision && <section className="en-stage-panel"><h3>Keep this notebook or save a separate copy</h3>{updateError && <p className="en-notice" role="alert">{updateError} Your saved notebook has not changed. Return to the entry and choose Restart from latest saved entry, or use the separate-copy option.</p>}<label className="en-check"><input type="checkbox" checked={separate} onChange={event => { setSeparate(event.target.checked); setAcceptChanges(false); setRevisions(false) }} />Save as separate entries instead; do not update the selected notebook</label></section>}
      {revision && preview.package.entries.some(e => e.id === revision.baseline.entries[0].id) && <><NotebookComparison before={revision.baseline} after={preview.package} entryId={revision.baseline.entries[0].id} separate={separate} /><details className="en-import-content"><summary>Read the exported baseline</summary><NotebookPackageView pkg={revision.baseline} /></details></>}
      {updating && updatePlan && <div className="en-notice"><p>{updatePlan.alreadyApplied ? 'This proposal is already the current saved content. No duplicate version will be created.' : 'Accepting keeps this notebook identity and saves the previous content and study records in recoverable history.'}</p>{updatePlan.extras.length > 0 && <p>Also included: {updatePlan.extras.map(item => `${item.entry.title} (${item.duplicate ? 'already saved' : 'new separate topic'})`).join('; ')}. Unrelated existing notebooks will not be replaced.</p>}<label className="en-check"><input type="checkbox" checked={acceptChanges} onChange={event => setAcceptChanges(event.target.checked)} />I reviewed the content, source and practice changes and any listed new topics; accept this proposal</label></div>}
      {preview.package.sources.some(s => s.access !== 'read' || !s.used) && <div className="en-notice"><b>Check source coverage</b><p>Some sources were only partly accessed, unreadable, not accessed, or not used. Their limits remain visible below. A valid package can still have missing content.</p></div>}
      {wrongCourse && <div className="en-notice"><b>The package class or term differs from this destination.</b><p>Package: {preview.package.course.code} / {preview.package.course.title} / {preview.package.course.term ?? 'Term not supplied'}</p><p>Destination: {course.code} / {course.title} / {course.term}</p><label className="en-check"><input type="checkbox" checked={destination} onChange={event => setDestination(event.target.checked)} />I want to save this package in {course.code}, {course.term}. Keep its original class information in the package.</label></div>}
      {duplicates.length > 0 && <p className="en-notice">{duplicates.length} identical {duplicates.length === 1 ? 'entry is' : 'entries are'} already saved. Existing edits and progress will be kept; no duplicate will be created.</p>}
      {revised && !updating && <div className="en-notice"><b>Revised or conflicting content</b><p>Incoming content shares an identity with an earlier entry. Save it separately, including when the revision number is unchanged or older. Your original entry, edits, responses, and progress stay intact.</p><label className="en-check"><input type="checkbox" checked={revisions} onChange={event => setRevisions(event.target.checked)} />Save revised content as separate entries</label></div>}
      <details className="en-import-content" open><summary>Preview notebook content</summary><NotebookPackageView pkg={preview.package} /></details>
      <div className="en-save-actions">{blockers.length > 0 && <p className="en-save-blocked">Saving stays closed: {blockers.join('; ')}.</p>}<div className="en-actions"><Button disabled={busy || blockers.length > 0} onClick={() => void save()}>{updating ? 'Accept update to this entry' : duplicates.length === plan.length ? 'Open existing saved entry' : `Save editable ${plan.length === 1 ? 'entry' : 'entries'} to ${course.code}`}</Button></div></div>
    </div>}
  </section>
}
