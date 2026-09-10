import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/store'
import { NOTEBOOK_MAX_BYTES, prepareNotebook, type PreparedNotebook } from '@/lib/academics/notebook/package'
import { acceptNotebookUpdate, importNotebook, inspectNotebookImport, inspectNotebookUpdate, notebookDestinationMismatch, restoreCompleteNotebookBackup } from '@/lib/academics/notebook/import'
import { canonical } from '@/lib/academics/notebook/package'
import { commitNotebookAssets, notebookAssetRepository } from '@/lib/academics/notebook/notebookAssetStore'
import { mergeNotebookAssetBindings, prepareNotebookAssets, type NamedNotebookImage, type PreparedNotebookAssets } from '@/lib/academics/notebook/visualAssets'
import { prepareNotebookBundle, type PreparedNotebookBundle } from '@/lib/academics/notebook/notebookBundle'
import { NotebookAssetsProvider, NotebookAssetThumbnail } from './NotebookVisuals'
import type { NotebookUpdateSession } from '@/lib/academics/notebook/types'
import { NotebookComparison } from './NotebookComparison'
import { NotebookImportPreview } from './NotebookImportPreview'
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
  const [imageFiles, setImageFiles] = useState<NamedNotebookImage[]>([])
  const [mappedImages, setMappedImages] = useState<Map<string, Blob>>(new Map())
  const [assetPrepared, setAssetPrepared] = useState<PreparedNotebookAssets | null>(null)
  const [assetError, setAssetError] = useState('')
  const [bundleFile, setBundleFile] = useState<Blob | null>(null)
  const [backup, setBackup] = useState<Extract<PreparedNotebookBundle, { kind: 'backup' }> | null>(null)
  const [confirmBackup, setConfirmBackup] = useState(false)
  const attempt = useRef(0)
  const plan = preview ? inspectNotebookImport(center, courseId, preview) : []
  const wrongCourse = Boolean(preview && course && notebookDestinationMismatch(preview.package, course))
  const revised = plan.some(item => item.previous && !item.duplicate)
  const duplicates = plan.filter(item => item.duplicate)
  const updating = Boolean(revision && !separate && !backup)
  let updateError = ''
  let updatePlan: ReturnType<typeof inspectNotebookUpdate> | undefined
  if (preview && revision) { try { updatePlan = inspectNotebookUpdate(center, courseId, preview, revision) } catch (failure) { updateError = (failure as Error).message } }
  const blockers = (backup ? [!confirmBackup ? 'confirm restoring the complete backup without overwriting existing entries' : '', wrongCourse && !destination ? 'confirm the different class or term' : ''] : updating ? [updateError, !acceptChanges ? 'review and confirm the changes and practice policy' : '', wrongCourse ? 'resolve the destination class mismatch' : ''] : [wrongCourse && !destination ? 'confirm the different class or term' : '', revised && !revisions ? 'confirm saving revised content separately' : '']).filter(Boolean)
  if (preview && preview.package.version !== 2 && !assetPrepared) blockers.push('select and validate every required image')
  function clearPreview() { attempt.current++; setPreview(null); setError(''); setStatus(''); setDestination(false); setRevisions(false); setAcceptChanges(false); setBusy(false); setAssetPrepared(null); setAssetError(''); setImageFiles([]); setMappedImages(new Map()); setBundleFile(null); setBackup(null); setConfirmBackup(false) }
  function bindingContext(prepared: PreparedNotebook) {
    const current = useStore.getState().academics.classCenter
    const related = inspectNotebookImport(current, courseId, prepared).map(item => item.duplicate ?? item.previous).filter(item => item !== undefined)
    if (revision && !separate && !backup) { const target = current.lectures.find(l => l.id === revision.localId); if (target) related.push(target) }
    const notebooks = [...new Map(related.map(l => [l!.id, l!.importedNotebook!])).values()]
    const lineages = new Set(notebooks.map(n => n.assetLineageId).filter((id): id is string => Boolean(id)))
    if (lineages.size > 1) throw new Error('This package spans different protected image histories. Import its entries separately so unrelated image IDs cannot collide.')
    return { lineageId: [...lineages][0], retainedBindings: mergeNotebookAssetBindings([], notebooks.flatMap(n => n.assetBindings ?? [])) }
  }
  async function checkImages(prepared: PreparedNotebook, id: number, files = imageFiles, mapped = mappedImages) {
    setAssetPrepared(null); setAssetError('')
    try {
      const context = bindingContext(prepared), resolved = await prepareNotebookAssets(prepared.package, files, { mappedFiles: mapped, previousBindings: context.retainedBindings, reader: notebookAssetRepository() })
      if (id === attempt.current) setAssetPrepared(resolved)
    } catch (failure) { if (id === attempt.current) setAssetError((failure as Error).message) }
  }
  async function validate(text = raw, files = imageFiles, mapped = mappedImages) {
    const id = ++attempt.current; setBusy(true); setError(''); setPreview(null); setDestination(false); setRevisions(false); setAcceptChanges(false)
    try { const result = await prepareNotebook(text); if (id === attempt.current) { setPreview(result); setStatus('Package structure and references validated. Review the content before saving.'); if (result.package.version !== 2) await checkImages(result, id, files, mapped) } }
    catch (failure) { if (id === attempt.current) setError((failure as Error).message) }
    finally { if (id === attempt.current) setBusy(false) }
  }
  async function save() {
    if (!preview || !course || busy) return
    const id = ++attempt.current; setBusy(true); setError('')
    try {
      const snapshot = () => { const state = useStore.getState(); return canonical({ course: state.courses.find(c => c.id === courseId), notebooks: state.academics.classCenter.lectures.filter(l => l.importedNotebook) }) }
      const expected = snapshot()
      const validated = await prepareNotebook(raw)
      if (id !== attempt.current) return
      let ids: string[] = []
      const decoded = bundleFile ? await prepareNotebookBundle(bundleFile) : null
      const restored = decoded?.kind === 'backup' ? decoded : null
      const original = restored ? await prepareNotebook(restored.notebook.originalRaw) : null
      const context = bindingContext(validated)
      const resolved = validated.package.version !== 2 || restored ? decoded?.assets ?? await prepareNotebookAssets(validated.package, imageFiles, { mappedFiles: mappedImages, previousBindings: context.retainedBindings, reader: notebookAssetRepository() }) : null
      if (id !== attempt.current) return
      const commit = () => { notebookTransaction(state => {
        const currentCourse = state.courses.find(c => c.id === courseId)
        if (!currentCourse) throw new Error('The destination class no longer exists.')
        ids = restored && original ? restoreCompleteNotebookBackup(state.academics.classCenter, currentCourse, restored.notebook, original, confirmBackup, destination) : revision && !separate ? acceptNotebookUpdate(state.academics.classCenter, currentCourse, validated, revision, acceptChanges) : importNotebook(state.academics.classCenter, currentCourse, validated, { confirmDestination: destination, confirmRevisions: revisions })
      }); return { committed: true as const } }
      if (resolved) await commitNotebookAssets({ prepared: resolved, ...context, assertFresh: () => { if (id !== attempt.current || snapshot() !== expected) throw new Error('A saved notebook, note, practice record or class changed while images were being prepared. Nothing was overwritten. Reopen the latest entry and compare again.') }, commit })
      else commit()
      setStatus(`Saved in ${course.code}.`); onImported(ids[0])
    } catch (failure) { if (id === attempt.current) setError((failure as Error).message) }
    finally { if (id === attempt.current) setBusy(false) }
  }
  if (!course) return <p role="alert">Destination class not found. Open import from an existing class notebook.</p>
  return <section className="external-notebook en-import" aria-label="Import external notebook"><h2 className="en-import-heading">{preview ? 'Review before saving' : 'Choose your notebook file'}</h2><p className="en-import-lead">{preview ? `Check the content and source coverage. Nothing is saved to ${course.code} yet.` : `Bring the complete final notebook JSON and its referenced PNG/JPEG files, or an app-exported notebook ZIP. You will see a preview before saving to ${course.code}.`}</p>
    <details className="en-import-inputs" open={!preview}><summary>{preview ? 'Change the file or JSON' : 'Choose a file or paste JSON'}</summary>
    <label className="en-field en-upload">Notebook file (JSON or ZIP)<input type="file" accept=".json,.zip,application/json,application/zip" disabled={busy} onChange={async event => {
      const file = event.target.files?.[0]; clearPreview(); if (!file) return
      const id = ++attempt.current; setBusy(true)
      try {
        if (file.name.toLowerCase().endsWith('.zip')) {
          const decoded = await prepareNotebookBundle(file)
          if (id !== attempt.current) return
          const text = decoded.kind === 'package' ? decoded.raw : JSON.stringify(decoded.notebook.current)
          const prepared = await prepareNotebook(text)
          if (id !== attempt.current) return
          setRaw(text); setPreview(prepared); setAssetPrepared(decoded.assets); setBundleFile(file); setBackup(decoded.kind === 'backup' ? decoded : null)
          if (decoded.kind === 'backup') setSeparate(true)
          setStatus(decoded.kind === 'backup' ? 'Complete backup and all retained image bytes validated. Review its personal records before restoring.' : 'Notebook and all declared image bytes validated. Review before saving.'); setBusy(false); return
        }
        if (file.size > NOTEBOOK_MAX_BYTES) throw new Error('$: Choose a package under 8 MB. Nothing was saved.')
        const text = await file.text(); if (id !== attempt.current) return
        setRaw(text); await validate(text, [], new Map())
      } catch (failure) { if (id === attempt.current) { setError((failure as Error).message); setBusy(false) } }
    }} /></label>
    <details className="en-paste" open={Boolean(initialRaw)}><summary>Paste JSON instead</summary><label className="en-field">Paste complete JSON<textarea className="en-json" value={raw} disabled={busy} onChange={event => { clearPreview(); setRaw(event.target.value) }} placeholder="Paste the complete notebook package or fenced JSON block" /></label>
    <Button disabled={busy || !raw.trim()} onClick={() => void validate()}>{busy ? 'Checking package...' : 'Validate and preview'}</Button></details>
    </details>
    <p className="en-import-limit">Use a complete notebook JSON with its PNG/JPEG files, or a portable ZIP exported by this app. JSON is limited to 8 MiB; browser storage may run out earlier. Working checkpoint files are not final notebooks.</p>
    {restoredInput && !preview && <p className="en-import-limit">Your unsaved JSON is kept. Check that it matches the current request, then validate it again before saving.</p>}
    {error && <div className="en-notice en-error" role="alert"><b>Nothing was saved</b><p className="en-text">{error}</p><Button variant="outline" onClick={() => { void navigator.clipboard.writeText(`Repair this notebook package error: ${error}\nPreserve all other content, source text, IDs, and revisions. Return the complete valid JSON package, not a patch.\n\nOriginal JSON:\n${raw}`).then(() => setStatus('Repair request copied.'), () => setStatus('Clipboard unavailable. Select the error and JSON to copy them.')) }}>Copy repair request and JSON</Button></div>}
    <p role="status" aria-live="polite">{status}</p>
    {preview && <div aria-label="Validated notebook preview"><div className="en-import-summary"><h3>{updating ? 'Update the selected entry in' : 'Save to'} {course.code}</h3><p>{course.title} / {course.term}</p><p>{preview.package.entries.length} {preview.package.entries.length === 1 ? 'entry' : 'entries'} / {preview.package.sources.length} supplied sources</p><ul>{plan.map(item => { const oldRevision = item.previous?.importedNotebook?.current.entries.find(e => e.id === item.entry.id)?.revision; return <li key={item.entry.id}>{notebookEntryLabel(item.entry)}{item.duplicate ? ' / Already saved' : oldRevision !== undefined ? item.entry.revision > oldRevision ? ' / Newer revision' : item.entry.revision < oldRevision ? ' / Older revision' : ' / Changed content at the same revision' : ' / New entry'}</li> })}</ul></div>
      {backup && <section className="en-stage-panel"><h3>Restore complete notebook backup</h3><p>This restores the original import, saved content, {backup.notebook.history?.length ?? 0} historical versions, personal notes, practice records and all retained images. It does not overwrite existing entries or accept an AI update.</p><details><summary>Personal records in this backup</summary><p className="en-text">{backup.notebook.notes || 'No personal notes.'}</p><p>{Object.keys(backup.notebook.progress).length} saved practice records.</p></details><label className="en-check"><input type="checkbox" checked={confirmBackup} onChange={event => setConfirmBackup(event.target.checked)} />Restore this complete backup; keep any existing entries unchanged</label></section>}
      {revision && !backup && <section className="en-stage-panel"><h3>Keep this notebook or save a separate copy</h3>{updateError && <p className="en-notice" role="alert">{updateError} Your saved notebook has not changed. Return to the entry and choose Restart from latest saved entry, or use the separate-copy option.</p>}<label className="en-check"><input type="checkbox" checked={separate} onChange={event => { setSeparate(event.target.checked); setAcceptChanges(false); setRevisions(false) }} />Save as separate entries instead; do not update the selected notebook</label></section>}
      {revision && preview.package.entries.some(e => e.id === revision.baseline.entries[0].id) && <><div className="en-import-comparison-scroll" role="region" aria-label="Scroll notebook changes" tabIndex={0}><NotebookComparison before={revision.baseline} after={preview.package} entryId={revision.baseline.entries[0].id} separate={separate} /></div><details className="en-import-content"><summary>Read the exported baseline</summary><NotebookImportPreview title="Saved baseline preview"><NotebookPackageView pkg={revision.baseline} assetBindings={center.lectures.find(l => l.id === revision.localId)?.importedNotebook?.assetBindings} /></NotebookImportPreview></details></>}
      {updating && updatePlan && <div className="en-notice"><p>{updatePlan.alreadyApplied ? 'This proposal is already the current saved content. No duplicate version will be created.' : 'Accepting keeps this notebook identity and saves the previous content and study records in recoverable history.'}</p>{updatePlan.extras.length > 0 && <p>Also included: {updatePlan.extras.map(item => `${item.entry.title} (${item.duplicate ? 'already saved' : 'new separate topic'})`).join('; ')}. Unrelated existing notebooks will not be replaced.</p>}<label className="en-check"><input type="checkbox" checked={acceptChanges} onChange={event => setAcceptChanges(event.target.checked)} />I reviewed the content, source and practice changes and any listed new topics; accept this proposal</label></div>}
      {preview.package.sources.some(s => s.access !== 'read' || !s.used) && <div className="en-notice"><b>Check source coverage</b><p>Some sources were only partly accessed, unreadable, not accessed, or not used. Their limits remain visible below. A valid package can still have missing content.</p></div>}
      {wrongCourse && <div className="en-notice"><b>The package class or term differs from this destination.</b><p>Package: {preview.package.course.code} / {preview.package.course.title} / {preview.package.course.term ?? 'Term not supplied'}</p><p>Destination: {course.code} / {course.title} / {course.term}</p><label className="en-check"><input type="checkbox" checked={destination} onChange={event => setDestination(event.target.checked)} />I want to save this package in {course.code}, {course.term}. Keep its original class information in the package.</label></div>}
      {duplicates.length > 0 && <p className="en-notice">{duplicates.length} identical {duplicates.length === 1 ? 'entry is' : 'entries are'} already saved. Existing edits and progress will be kept; no duplicate will be created.</p>}
      {revised && !updating && !backup && <div className="en-notice"><b>Revised or conflicting content</b><p>Incoming content shares an identity with an earlier entry. Save it separately, including when the revision number is unchanged or older. Your original entry, edits, responses, and progress stay intact.</p><label className="en-check"><input type="checkbox" checked={revisions} onChange={event => setRevisions(event.target.checked)} />Save revised content as separate entries</label></div>}
      <NotebookAssetsProvider pkg={preview.package} prepared={assetPrepared ?? undefined}>
      {preview.package.version !== 2 && !preview.package.assets.length && assetError && <p className="en-notice en-error" role="alert">{assetError}</p>}
      {preview.package.version !== 2 && preview.package.assets.length > 0 && <section className="en-stage-panel"><h3>Figures referenced by this notebook</h3><p>Every required image must be mapped and validated before saving. The app computes byte bindings; an upload is not proof that the AI visually inspected the source.</p>{!bundleFile && <><label className="en-field">Notebook image files<input type="file" multiple accept=".png,.jpg,.jpeg,image/png,image/jpeg" disabled={busy} onChange={async event => { const files = [...(event.target.files ?? [])].map(blob => ({ name: blob.name, blob })), token = ++attempt.current; setImageFiles(files); setMappedImages(new Map()); setAcceptChanges(false); setRevisions(false); setBusy(true); await checkImages(preview, token, files, new Map()); if (token === attempt.current) setBusy(false) }} /></label><Button variant="ghost" disabled={busy} onClick={() => { setImageFiles([]); setMappedImages(new Map()); setAssetPrepared(null); setAssetError('Select the exact required image files.'); setAcceptChanges(false) }}>Clear selected images</Button></>}
        <table className="nbr-asset-mapping"><thead><tr><th>Figure and location</th><th>Image</th><th>Mapping</th></tr></thead><tbody>{preview.package.assets.map(asset => <tr key={asset.id}><td><b>{asset.fileName}</b><p>{asset.sourceId} / {asset.location}</p><small>{asset.id}</small></td><td><NotebookAssetThumbnail assetId={asset.id} /></td><td><p>{assetPrepared?.bindings.some(b => b.assetId === asset.id) ? 'Bytes validated' : imageFiles.filter(f => f.name === asset.fileName).length > 1 ? 'Ambiguous filename: choose one exact image' : 'Required image not yet validated'}</p>{!bundleFile && <label>Map image {asset.id}<input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" disabled={busy} onChange={async event => { const file = event.target.files?.[0]; if (!file) return; const mapped = new Map(mappedImages).set(asset.id, file), files = imageFiles.filter(f => f.name !== asset.fileName), token = ++attempt.current; setMappedImages(mapped); setImageFiles(files); setAcceptChanges(false); setRevisions(false); setBusy(true); await checkImages(preview, token, files, mapped); if (token === attempt.current) setBusy(false) }} /></label>}</td></tr>)}</tbody></table>
        {assetError && <p className="en-notice en-error" role="alert">{assetError}</p>}{assetPrepared && <p>{assetPrepared.bindings.length} image bindings validated for local storage. Keep a complete portable backup to move them to another device.</p>}
      </section>}
      <NotebookImportPreview><NotebookPackageView pkg={preview.package} /></NotebookImportPreview></NotebookAssetsProvider>
      <div className="en-save-actions">{blockers.length > 0 && <p className="en-save-blocked">Saving stays closed: {blockers.join('; ')}.</p>}<div className="en-actions"><Button disabled={busy || blockers.length > 0} onClick={() => void save()}>{backup ? 'Restore complete notebook backup' : updating ? 'Accept update to this entry' : duplicates.length === plan.length ? 'Open existing saved entry' : `Save editable ${plan.length === 1 ? 'entry' : 'entries'} to ${course.code}`}</Button></div></div>
    </div>}
  </section>
}
