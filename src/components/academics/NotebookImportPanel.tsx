import { ToastContext } from '@/components/common/toast-context'
import { NotebookTextChanges } from './NotebookTextChanges'
import { SelectField } from '@/components/ui/select-field'
import { NotebookImportAdjustments } from './NotebookImportAdjustments'
import { useContext, useEffect, useId, useRef, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { activeAccountWorkspaceId, captureWorkspaceIdentity, useStore } from '@/store/store'
import { WorkspaceChangedError, WorkspaceSaveError } from '@/store/storageHealth'
import { NOTEBOOK_MAX_BYTES, prepareNotebook, type PreparedNotebook } from '@/lib/academics/notebook/package'
import { acceptNotebookUpdate, importNotebook, inspectNotebookImport, inspectNotebookUpdate, notebookDestinationMismatch, restoreCompleteNotebookBackup } from '@/lib/academics/notebook/import'
import { canonical } from '@/lib/academics/notebook/package'
import { commitNotebookAssets, notebookAssetRepository } from '@/lib/academics/notebook/notebookAssetStore'
import { mergeNotebookAssetBindings, reviewNotebookImages, type NamedNotebookImage, type PreparedNotebookAssets } from '@/lib/academics/notebook/visualAssets'
import { prepareNotebookBundle, type PreparedNotebookBundle } from '@/lib/academics/notebook/notebookBundle'
import { collectNotebookFolder, matchNotebookImages, type NotebookFileCollection } from '@/lib/academics/notebook/notebookFiles'
import { classifyNotebookJsonFiles, notebookBundleFromFolder, readNotebookImportZip } from '@/lib/academics/notebook/notebookImportFiles'
import { NotebookAssetsProvider, NotebookAssetThumbnail } from './NotebookVisuals'
import type { NotebookPackage, NotebookUpdateSession } from '@/lib/academics/notebook/types'
import { NotebookReviewSummary, NotebookReviewCheck, NotebookUpdateCounts } from './NotebookReviewSave'
import { changedNotebookSections, NotebookUpdateChanges } from './NotebookComparison'
import { notebookPracticePolicy } from '@/lib/academics/notebook/revision'
import { NotebookImportPreview } from './NotebookImportPreview'
import { NotebookStorageRecovery, WorkspaceRecoveryDownload } from './NotebookStorageRecovery'
import { downloadNotebookText, NotebookPackageView, notebookTransaction } from './ExternalNotebookView'
export function NotebookImportPanel({ courseId, onImported, initialRaw = '', onRawChange, revision, revisionValidation, onReviewChange, onCancel, onRestart }: { onReviewChange?: (reviewing: boolean) => void; /** Leaves the update review without saving. */ onCancel?: () => void; /** Starts a fresh update from the latest saved entry. */ onRestart?: () => void; courseId: string; onImported: (id: string, destinationCourseId?: string) => void; initialRaw?: string; onRawChange?: (raw: string) => void; revision?: NotebookUpdateSession; revisionValidation?: (baseline: NotebookPackage, proposed: NotebookPackage) => void }) {
  const toastContext=useContext(ToastContext)
  const deviceNoticeShown=useRef(false)
  const saveReasonId=useId()
  const [selectedCourseId, setSelectedCourseId] = useState(courseId)
  const courses = useStore(s => s.courses)
  const course = courses.find(item => item.id === selectedCourseId)
  useEffect(() => { setSelectedCourseId(courseId) }, [courseId])
  const center = useStore(s => s.academics.classCenter)
  const [raw, setRawState] = useState(initialRaw)
  const [restoredInput] = useState(Boolean(initialRaw))
  function setRaw(text: string) { setRawState(text); onRawChange?.(text) }
  const [preview, setPreview] = useState<PreparedNotebook | null>(null)
  useEffect(() => { onReviewChange?.(Boolean(preview)) }, [preview, onReviewChange])
  const [error, setErrorMessage] = useState('')
  const [recoveryError, setRecoveryError] = useState<'storage' | 'workspace' | null>(null)
  function setError(value: string) { setErrorMessage(value); setRecoveryError(null) }
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [destination, setDestination] = useState(false)
  const [revisions, setRevisions] = useState(false)
  const [separate, setSeparate] = useState(false)
  const [imageFiles, setImageFiles] = useState<NamedNotebookImage[]>([])
  const [mappedImages, setMappedImages] = useState<Map<string, Blob>>(new Map())
  const [assetPrepared, setAssetPrepared] = useState<PreparedNotebookAssets | null>(null)
  const [assetError, setAssetError] = useState('')
  const [collection, setCollection] = useState<NotebookFileCollection | null>(null)
  const [candidate, setCandidate] = useState('')
  const [readyImages, setReadyImages] = useState<string[]>([])
  const [imageProblems, setImageProblems] = useState<Map<string, string>>(new Map())
  const folderInput = useRef<HTMLInputElement>(null)
  const [folderSupported] = useState(() => typeof document !== 'undefined' && 'webkitdirectory' in document.createElement('input'))
  const [bundleUsed, setBundleUsed] = useState<string[]>([])
  const [otherOpen, setOtherOpen] = useState(false)
  const [bundleFile, setBundleFile] = useState<Blob | null>(null)
  const [backup, setBackup] = useState<Extract<PreparedNotebookBundle, { kind: 'backup' }> | null>(null)
  const [confirmBackup, setConfirmBackup] = useState(false)
  const attempt = useRef(0)
  const plan = preview ? inspectNotebookImport(center, selectedCourseId, preview) : []
  const wrongCourse = Boolean(preview && course && notebookDestinationMismatch(preview.package, course))
  const revised = plan.some(item => item.previous && !item.duplicate)
  const duplicates = plan.filter(item => item.duplicate)
  const updating = Boolean(revision && !separate && !backup)
  // Choosing a separate copy of an update is itself the confirmation to save revised content separately.
  const confirmRevisions = revisions || Boolean(revision && separate)
  let updateError = ''
  let updatePlan: ReturnType<typeof inspectNotebookUpdate> | undefined
  if (preview && revision) { try { updatePlan = inspectNotebookUpdate(center, selectedCourseId, preview, revision) } catch (failure) { updateError = (failure as Error).message } }
  const blockers = (backup ? [!confirmBackup ? 'confirm restoring the complete backup without overwriting existing entries' : '', wrongCourse && !destination ? 'confirm the different class or term' : ''] : updating ? [updateError, wrongCourse ? 'resolve the destination class mismatch' : ''] : [wrongCourse && !destination ? 'confirm the different class or term' : '', revised && !confirmRevisions ? 'confirm saving revised content separately' : '']).filter(Boolean)
  if (preview && revisionValidation && revision) {
    try {
      if (separate || backup) throw new Error('Use the notebook update import here; separate copies and backups belong in the general notebook importer.')
      revisionValidation(revision.baseline, preview.package)
    } catch (failure) { blockers.push((failure as Error).message) }
  }
  if (preview && preview.package.version !== 2 && !assetPrepared) blockers.push('select and validate every required image')
  function clearPreview() { attempt.current++; setSelectedCourseId(courseId); setPreview(null); setError(''); setStatus(''); setDestination(false); setRevisions(false); setBusy(false); setAssetPrepared(null); setAssetError(''); setImageFiles([]); setMappedImages(new Map()); setBundleFile(null); setBackup(null); setConfirmBackup(false); setCollection(null); setCandidate(''); setReadyImages([]); setImageProblems(new Map()); setBundleUsed([]) }
  function bindingContext(prepared: PreparedNotebook) {
    const current = useStore.getState().academics.classCenter
    const related = inspectNotebookImport(current, selectedCourseId, prepared).map(item => item.duplicate ?? item.previous).filter(item => item !== undefined)
    if (revision && !separate && !backup) { const target = current.lectures.find(l => l.id === revision.localId); if (target) related.push(target) }
    const notebooks = [...new Map(related.map(l => [l!.id, l!.importedNotebook!])).values()]
    const lineages = new Set(notebooks.map(n => n.assetLineageId).filter((id): id is string => Boolean(id)))
    if (lineages.size > 1) throw new Error('This package spans different protected image histories. Import its entries separately so unrelated image IDs cannot collide.')
    return { lineageId: [...lineages][0], retainedBindings: mergeNotebookAssetBindings([], notebooks.flatMap(n => n.assetBindings ?? [])) }
  }
  function imageSelection(prepared: PreparedNotebook, files = imageFiles, mapped = mappedImages) {
    const assets = prepared.package.version === 2 ? [] : prepared.package.assets
    const matches = matchNotebookImages(assets, files, mapped), selected = new Map<string, Blob>(), blocked = new Map<string, string>()
    for (const match of matches) {
      if (match.file) selected.set(match.asset.id, match.file.blob)
      else if (match.candidates.length) blocked.set(match.asset.id, 'Ambiguous filename. Choose the exact file below.')
    }
    return { matches, selected, blocked }
  }
  async function checkImages(prepared: PreparedNotebook, id: number, files = imageFiles, mapped = mappedImages) {
    setAssetPrepared(null); setAssetError(''); setReadyImages([]); setImageProblems(new Map())
    try {
      const context = bindingContext(prepared), selection = imageSelection(prepared, files, mapped)
      const result = await reviewNotebookImages(prepared.package, selection.selected, { blocked: selection.blocked, previousBindings: context.retainedBindings, reader: notebookAssetRepository() })
      if (id === attempt.current) { setAssetPrepared(result.prepared); setReadyImages(result.ready); setImageProblems(result.problems); setAssetError(result.error) }
    } catch (failure) { if (id === attempt.current) setAssetError((failure as Error).message) }
  }
  async function selectCandidate(file: NamedNotebookImage, selectedCollection: NotebookFileCollection) {
    clearPreview(); setRaw(''); setCollection(selectedCollection); setCandidate(file.name); setImageFiles(selectedCollection.images)
    const id = ++attempt.current; setBusy(true)
    try {
      if (file.blob.size > NOTEBOOK_MAX_BYTES) throw new Error('Choose a notebook JSON under 8 MiB. Nothing was saved.')
      const indexed = await notebookBundleFromFolder(selectedCollection, file.name)
      if (id !== attempt.current) return
      if (indexed) {
        const decoded = indexed.bundle, text = decoded.kind === 'package' ? decoded.raw : JSON.stringify(decoded.notebook.current), prepared = await prepareNotebook(text)
        if (id !== attempt.current) return
        setRaw(text); setPreview(prepared); setOtherOpen(false); setAssetPrepared(decoded.assets); setReadyImages(decoded.assets.bindings.map(b => b.assetId)); setBundleFile(indexed.archive); setBundleUsed(indexed.used); setBackup(decoded.kind === 'backup' ? decoded : null)
        if (decoded.kind === 'backup') setSeparate(true)
        setStatus('Notebook and indexed image files validated. Review before saving.'); setBusy(false); return
      }
      const text = await file.blob.text(); if (id !== attempt.current) return
      setRaw(text); await validate(text, selectedCollection.images, new Map())
    } catch (failure) { if (id === attempt.current) { setError((failure as Error).message); setBusy(false) } }
  }
  async function chooseCollection(input: NotebookFileCollection) {
    const id = ++attempt.current; setBusy(true)
    let selectedCollection: NotebookFileCollection
    try { selectedCollection = await classifyNotebookJsonFiles(input) } catch (failure) { if (id === attempt.current) { setError((failure as Error).message); setBusy(false) }; return }
    if (id !== attempt.current) return
    setCollection(selectedCollection)
    if (!selectedCollection.json.length) { setError('No notebook JSON found. Choose the folder or ZIP your AI created with the final notebook JSON and images. Raw lecture materials alone cannot create a notebook.'); setBusy(false); return }
    if (selectedCollection.json.length === 1) await selectCandidate(selectedCollection.json[0], selectedCollection)
    else { setStatus(`${selectedCollection.json.length} JSON files found. Choose the notebook to preview; files will not be merged.`); setBusy(false) }
  }
  async function changeImages(files: NamedNotebookImage[], mapped: Map<string, Blob>) {
    if (!preview) return
    const id = ++attempt.current; setImageFiles(files); setMappedImages(mapped); setRevisions(false); setBusy(true)
    await checkImages(preview, id, files, mapped); if (id === attempt.current) setBusy(false)
  }
  async function validate(text = raw, files = imageFiles, mapped = mappedImages) {
    const id = ++attempt.current; setBusy(true); setError(''); setPreview(null); setDestination(false); setRevisions(false)
    try { const result = await prepareNotebook(text); if (id === attempt.current) { setPreview(result); setOtherOpen(false); setStatus('Package structure and references validated. Review the content before saving.'); if (result.package.version !== 2) await checkImages(result, id, files, mapped) } }
    catch (failure) { if (id === attempt.current) setError((failure as Error).message) }
    finally { if (id === attempt.current) setBusy(false) }
  }
  async function save() {
    if (!preview || !course || busy) return
    const id = ++attempt.current; setBusy(true); setError('')
    try {
      const snapshot = () => { const state = useStore.getState(); return canonical({ course: state.courses.find(c => c.id === selectedCourseId), notebooks: state.academics.classCenter.lectures.filter(l => l.importedNotebook) }) }
      const expected = snapshot()
      const owner = captureWorkspaceIdentity()
      const assertFresh = () => {
        const current = captureWorkspaceIdentity()
        if (owner.key !== current.key || owner.epoch !== current.epoch) throw new WorkspaceChangedError('The active workspace changed while the notebook was being prepared. Return to the intended account and class, then retry. Nothing was saved to the new workspace.')
        if (id !== attempt.current || snapshot() !== expected) throw new WorkspaceChangedError('A saved notebook, note, practice record or class changed while images were being prepared. Nothing was overwritten. Reopen the latest entry and compare again.')
      }
      const validated = await prepareNotebook(raw)
      if (id !== attempt.current) return
      if (revisionValidation && revision) {
        if (separate || backup) throw new Error('Revised notes must update the selected notebook through its review step.')
        revisionValidation(revision.baseline, validated.package)
      }
      let ids: string[] = []
      const decoded = bundleFile ? await prepareNotebookBundle(bundleFile) : null
      const restored = decoded?.kind === 'backup' ? decoded : null
      const original = restored ? await prepareNotebook(restored.notebook.originalRaw) : null
      assertFresh()
      const context = bindingContext(validated)
      const selection = imageSelection(validated)
      const imageReview = !decoded && validated.package.version !== 2 ? await reviewNotebookImages(validated.package, selection.selected, { blocked: selection.blocked, previousBindings: context.retainedBindings, reader: notebookAssetRepository() }) : null
      if (imageReview && !imageReview.prepared) throw new Error(imageReview.error || [...imageReview.problems.values()][0] || 'Resolve the remaining images before saving.')
      const resolved = decoded?.assets ?? imageReview?.prepared ?? null
      if (id !== attempt.current) return
      const commit = () => { assertFresh(); const durable = notebookTransaction(state => {
        const currentCourse = state.courses.find(c => c.id === selectedCourseId)
        if (!currentCourse) throw new Error('The destination class no longer exists.')
        ids = restored && original ? restoreCompleteNotebookBackup(state.academics.classCenter, currentCourse, restored.notebook, original, confirmBackup, destination) : revision && !separate ? acceptNotebookUpdate(state.academics.classCenter, currentCourse, validated, revision, true) : importNotebook(state.academics.classCenter, currentCourse, validated, { confirmDestination: destination, confirmRevisions })
      }); return { committed: true as const, durable } }
      if (resolved) await commitNotebookAssets({ prepared: resolved, ...context, assertFresh, commit })
      else await commit().durable
      const currentOwner = captureWorkspaceIdentity()
      if (owner.key !== currentOwner.key || owner.epoch !== currentOwner.epoch) return
      setStatus(`Saved in ${course.code}.`)
      if (!activeAccountWorkspaceId() && !deviceNoticeShown.current && toastContext) {
        let alreadyShown=false
        try { alreadyShown=sessionStorage.getItem('premed-os:notebook-device-save-notice:v1')==='shown' } catch { /* The current save can still report device-only storage. */ }
        if (!alreadyShown) {
          toastContext.toast({title:'Saved on this device. Sign in to keep it on your other devices.',tone:'info'})
          deviceNoticeShown.current=true
          try { sessionStorage.setItem('premed-os:notebook-device-save-notice:v1','shown') } catch { /* The mounted importer still shows this only once. */ }
        }
      }
      onImported(ids[0], course.id)
    } catch (failure) { if (id === attempt.current) { setError((failure as Error).message); setRecoveryError(failure instanceof WorkspaceSaveError ? 'storage' : failure instanceof WorkspaceChangedError ? 'workspace' : null) } }
    finally { if (id === attempt.current) setBusy(false) }
  }
  if (!course) return <p role="alert">Destination class not found. Open import from an existing class notebook.</p>
  const matchingCourses = preview ? courses.filter(item => !notebookDestinationMismatch(preview.package, item)) : []
  const matchingCourse = matchingCourses.length === 1 ? matchingCourses[0] : undefined
  const sourceComplete = preview?.package.sources.every(source => source.access === 'read' && source.used) ?? false
  const saveReason = busy ? 'Checking files. Please wait.' : wrongCourse && !destination ? 'Choose where to save first.' : updating && updateError ? 'Choose an option above to continue.' : blockers.length ? `${blockers[0][0].toUpperCase()}${blockers[0].slice(1)}.` : ''
  const baselineEntry = revision?.baseline.entries[0]
  const sectionChanges = preview && revision ? changedNotebookSections(revision.baseline, preview.package, revision.baseline.entries[0].id) : undefined
  const incomingEntry = baselineEntry && preview?.package.entries.find(entry => entry.id === baselineEntry.id)
  const removedSections = baselineEntry && incomingEntry ? baselineEntry.sections.filter(section => !incomingEntry.sections.some(item => item.id === section.id)) : []
  const practicePolicy = updating && incomingEntry && preview && revision ? notebookPracticePolicy(revision.baseline, preview.package, baselineEntry!.id) : undefined
  const keptPractice = baselineEntry && incomingEntry ? baselineEntry.sections.flatMap(section => section.blocks).filter(block => block.type === 'practice' && !practicePolicy?.affectedIds.includes(block.id) && incomingEntry.sections.some(section => section.blocks.some(item => item.id === block.id))).length : 0
  const staleBaseline = /changed after the baseline|no longer current/.test(updateError)
  const unusedImages = imageFiles.filter(file => bundleFile ? !bundleUsed.includes(file.name) : !preview || !imageSelection(preview).matches.some(match => match.file?.blob === file.blob))
  return <section className="external-notebook en-import" aria-label="Import external notebook">{!preview && <h2 className="en-import-heading">Bring it back</h2>}
    <div className="en-folder-picker" hidden={Boolean(preview)}>{folderSupported ? <><Button disabled={busy} onClick={() => folderInput.current?.click()}>Choose the folder your AI made</Button><span>Usually in your class folder, or Downloads.</span></> : <p>Folder selection is unavailable in this browser. Open Other import options to choose your notebook ZIP.</p>}<input ref={node => { folderInput.current = node; node?.setAttribute('webkitdirectory', '') }} type="file" multiple hidden disabled={busy} aria-label="Choose notebook folder" onChange={async event => {
      const files = [...(event.target.files ?? [])]; event.target.value = ''; if (!files.length) return
      clearPreview(); setRaw('')
      try { await chooseCollection(collectNotebookFolder(files)) } catch (failure) { setError((failure as Error).message); setBusy(false) }
    }} /></div>
    {collection && <div className="en-collection-summary" hidden={Boolean(preview)}><p>{collection.json.length} JSON {collection.json.length === 1 ? 'file' : 'files'} · {collection.images.length} image {collection.images.length === 1 ? 'file' : 'files'} found</p>{collection.json.length > 1 && <label className="en-field">Notebook JSON<SelectField aria-label="Notebook JSON" className="mt-2 min-h-11 w-full bg-background font-normal" value={candidate} onValueChange={value => { const file = collection.json.find(f => f.name === value); if (file) void selectCandidate(file, collection) }} options={[{ value: '', label: 'Choose one notebook', disabled: true }, ...collection.json.map(file => ({ value: file.name, label: file.name }))]} /></label>}{candidate && <p className="en-file-path">{candidate}</p>}{preview && (preview.package.version === 2 || !preview.package.assets.length) && unusedImages.length > 0 && <p>{unusedImages.length} image files are not referenced by this notebook and will not be imported.</p>}{collection.auxiliary.length > 0 && <details><summary>{collection.auxiliary.length} supporting JSON {collection.auxiliary.length === 1 ? 'file' : 'files'}</summary><p>These are not separate notebooks. App image bindings are used when present; other reports or mappings are not imported.</p><ul>{collection.auxiliary.map(file => <li key={file.name}>{file.name}</li>)}</ul></details>}{bundleUsed.length > 0 && <p>{bundleUsed.length} indexed package files used.</p>}{collection.other.length > 0 && <details><summary>{collection.other.length} unsupported {collection.other.length === 1 ? 'file' : 'files'} will not be imported</summary><p>Only notebook JSON and its declared PNG/JPEG images are imported. PDFs, documents and other files are not read or displayed.</p><ul>{collection.other.map(file => <li key={file.name}>{file.name}</li>)}</ul></details>}</div>}
    <details className="en-import-inputs" hidden={Boolean(preview)} open={otherOpen} onToggle={event => setOtherOpen(event.currentTarget.open)}><summary>Other import options</summary>
    <label className="en-field en-upload">Notebook file (JSON or ZIP)<input type="file" accept=".json,.zip,application/json,application/zip" disabled={busy} onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; clearPreview(); setRaw('')
      const id = ++attempt.current; setBusy(true)
      try {
        if (file.name.toLowerCase().endsWith('.zip')) {
          const input = await readNotebookImportZip(file)
          if (id !== attempt.current) return
          if (input.kind === 'files') { await chooseCollection(input.collection); return }
          const decoded = input.bundle
          const text = decoded.kind === 'package' ? decoded.raw : JSON.stringify(decoded.notebook.current)
          const prepared = await prepareNotebook(text)
          if (id !== attempt.current) return
          setRaw(text); setPreview(prepared); setOtherOpen(false); setAssetPrepared(decoded.assets); setBundleFile(input.archive); setCollection(input.collection); setCandidate('notebook.json'); setImageFiles(input.collection.images); setBundleUsed(input.used); setBackup(decoded.kind === 'backup' ? decoded : null); setReadyImages(decoded.assets.bindings.map(b => b.assetId))
          if (decoded.kind === 'backup') setSeparate(true)
          setStatus(decoded.kind === 'backup' ? 'Complete backup and all retained image bytes validated. Review its personal records before restoring.' : 'Notebook and all declared image bytes validated. Review before saving.'); setBusy(false); return
        }
        if (file.size > NOTEBOOK_MAX_BYTES) throw new Error('$: Choose a package under 8 MB. Nothing was saved.')
        const text = await file.text(); if (id !== attempt.current) return
        setRaw(text); await validate(text, [], new Map())
      } catch (failure) { if (id === attempt.current) { setError((failure as Error).message); setBusy(false) } }
    }} /></label>
    <details className="en-paste" open={restoredInput}><summary>Paste JSON instead</summary><label className="en-field">Paste complete JSON<textarea className="en-json" value={raw} disabled={busy} onChange={event => { clearPreview(); setRaw(event.target.value) }} placeholder="Paste the complete notebook package or fenced JSON block" /></label>
    <Button disabled={busy || !raw.trim()} onClick={() => void validate()}>{busy ? 'Checking package...' : 'Validate and preview'}</Button></details>
    <details><summary>Storage recovery copy</summary><WorkspaceRecoveryDownload disabled={busy} /></details></details>
    <p className="en-import-limit" hidden={Boolean(preview)}>A notebook folder or ZIP needs the final notebook JSON and any referenced PNG/JPEG images. Raw class materials alone cannot create a notebook. JSON is limited to 8 MiB. Working checkpoint files are not final notebooks.</p>
    {restoredInput && !preview && <p className="en-import-limit">Your unsaved JSON is kept. Check that it matches the current request, then validate it again before saving.</p>}
    {error && <div className="en-notice en-error" role="alert"><b>Nothing was saved</b><p className="en-text">{error}</p>{!recoveryError && <Button variant="outline" onClick={() => { void navigator.clipboard.writeText(`Repair this notebook package error: ${error}\nPreserve all other content, source text, IDs, and revisions. Return one titled folder with the complete corrected notebook JSON and all required actual PNG/JPEG files, preserving filenames and relative paths. A local assistant should save the folder in the class folder, fall back to Downloads only if the class folder is unreachable, say where it saved, and never overwrite existing files. If folder delivery is unavailable, provide the complete downloadable file set with its intended folder name and relative paths, and state the limitation. Create a ZIP only when I explicitly request one. Do not invent missing files or claim the package is complete without its required bytes. Preserve any explicitly requested discussion stage.\n\nOriginal JSON:\n${raw}`).then(() => setStatus('Repair request copied.'), () => setStatus('Clipboard unavailable. Select the error and JSON to copy them.')) }}>Copy repair request and JSON</Button>}{recoveryError === 'storage' && <><Button variant="outline" onClick={() => downloadNotebookText("unsaved-notebook.json", raw)}>Download unsaved JSON</Button><p>Keep the images with this JSON. You can retry Save below; your selected files are still here.</p><NotebookStorageRecovery onStart={() => { const id = ++attempt.current; setBusy(true); return () => { if (id === attempt.current) setBusy(false) } }} onOptimized={() => { setError(''); setStatus('Browser storage optimized. Your selected notebook files are kept. Retry Save below.') }} /></>}</div>}
    <p role="status" aria-live="polite" hidden={!/^(Repair request|Clipboard unavailable|Browser storage optimized)/.test(status)}>{/^(Repair request|Clipboard unavailable|Browser storage optimized)/.test(status) ? status : ''}</p>
    {preview && <div className="nr-review" aria-label="Validated notebook preview"><NotebookReviewSummary pkg={preview.package} update={updating} revision={updating && baselineEntry ? baselineEntry.revision + 1 : undefined} onChooseDifferent={() => { clearPreview(); setRaw(''); folderInput.current?.click() }} />
      {updating && sectionChanges && incomingEntry && <NotebookUpdateCounts added={Object.values(sectionChanges).filter(status => status === 'added').length} revised={Object.values(sectionChanges).filter(status => status === 'changed').length} removed={removedSections.length} kept={keptPractice} />}
      <ul className="nr-checks">
        {revision && !backup && updateError && !separate && <NotebookReviewCheck title="This update can’t replace your saved notebook" choice detail={updateError}>{staleBaseline && onRestart && <Button onClick={onRestart}>Restart from latest saved entry</Button>}<Button variant={staleBaseline && onRestart ? 'outline' : 'default'} onClick={() => setSeparate(true)}>Save a separate copy</Button></NotebookReviewCheck>}
        {revision && !backup && separate && <NotebookReviewCheck title="Saving as a separate copy" detail="Your saved notebook stays unchanged. The separate copy starts with empty notes and practice records.">{!updateError && <Button variant="outline" onClick={() => setSeparate(false)}>Update the saved notebook instead</Button>}</NotebookReviewCheck>}
        {preview.package.version !== 2 && !assetPrepared && <NotebookReviewCheck title="Images need attention" choice detail="Select and validate every required image." />}
        {!sourceComplete && <NotebookReviewCheck title="Review source coverage" choice detail="Some sources are partial, unreadable, not accessed or not used. Their limits are in the preview." />}
        {wrongCourse && !destination && <NotebookReviewCheck title={`This notebook was made for ${preview.package.course.code}`} choice detail={`You opened it from ${course.code}.`}><Button disabled={!matchingCourse || updating} onClick={() => { if (matchingCourse) { setSelectedCourseId(matchingCourse.id); setDestination(false); setError('') } }}>Save to {preview.package.course.code}</Button><Button variant="outline" onClick={() => setDestination(true)}>Keep in {course.code}</Button>{!matchingCourse && <small>{matchingCourses.length ? 'Several matching classes exist. Open import from the intended class.' : 'Add that class in Academics before saving there.'}</small>}</NotebookReviewCheck>}
        {practicePolicy?.reset && <NotebookReviewCheck title={`${practicePolicy.affectedIds.length} practice ${practicePolicy.affectedIds.length === 1 ? 'item starts' : 'items start'} fresh`} detail={practicePolicy.explanation} />}
        {updating && updatePlan && updatePlan.extras.length > 0 && <NotebookReviewCheck title={`Also adds ${updatePlan.extras.length} ${updatePlan.extras.length === 1 ? 'notebook' : 'notebooks'}`} detail={`${updatePlan.extras.map(item => `${item.entry.title} (${item.duplicate ? 'already saved' : 'new separate notebook'})`).join('; ')}. Unrelated existing notebooks will not be replaced.`} />}
      </ul>

      <NotebookImportAdjustments raw={backup ? backup.notebook.acceptedRaw ?? backup.notebook.originalRaw : preview.raw} />
      {backup && <section className="en-stage-panel"><h3>Restore complete notebook backup</h3><p>This restores the original import, saved content, {backup.notebook.history?.length ?? 0} historical versions, personal notes, practice records and all retained images. It does not overwrite existing entries or accept an AI update.</p><details><summary>Personal records in this backup</summary><p className="en-text">{backup.notebook.notes || 'No personal notes.'}</p><p>{Object.keys(backup.notebook.progress).length} saved practice records.</p></details><label className="en-check"><input type="checkbox" checked={confirmBackup} onChange={event => setConfirmBackup(event.target.checked)} />Restore this complete backup; keep any existing entries unchanged</label></section>}
      {duplicates.length > 0 && <p className="en-notice">{duplicates.length} identical {duplicates.length === 1 ? 'entry is' : 'entries are'} already saved. Existing edits and progress will be kept; no duplicate will be created.</p>}
      {revised && !updating && !backup && !(revision && separate) && <div className="en-notice"><b>Revised or conflicting content</b><p>Incoming content shares an identity with an earlier entry. Save it separately, including when the revision number is unchanged or older. Your original entry, edits, responses, and progress stay intact.</p><label className="en-check"><input type="checkbox" checked={revisions} onChange={event => setRevisions(event.target.checked)} />Save revised content as separate entries</label></div>}
      <NotebookAssetsProvider pkg={preview.package} prepared={assetPrepared ?? undefined}>
      {preview.package.version !== 2 && !preview.package.assets.length && assetError && <p className="en-notice en-error" role="alert">{assetError}</p>}
      {preview.package.version !== 2 && preview.package.assets.length > 0 && <details className="nr-image-details" open={busy || !assetPrepared}><summary>Image files and replacements</summary><section className="en-stage-panel en-image-review" aria-label="Notebook images"><h3>Notebook images</h3><p role="status">{busy ? 'Checking image files…' : `${readyImages.length} of ${preview.package.assets.length} images validated${imageProblems.size ? ` · ${imageProblems.size} need attention` : ''}.`}</p>
        {!bundleFile && <details className="en-small-detail"><summary>Add or replace image files</summary><label className="en-field">Notebook image files<input type="file" multiple accept=".png,.jpg,.jpeg,image/png,image/jpeg" disabled={busy} onChange={event => { const selected = [...(event.target.files ?? [])].map(blob => ({ name: blob.name, blob })); event.target.value = ''; if (selected.length) void changeImages([...imageFiles, ...selected], mappedImages) }} /></label><Button variant="ghost" disabled={busy} onClick={() => void changeImages([], new Map())}>Clear selected images</Button></details>}
        {!busy && imageSelection(preview).matches.filter(match => !readyImages.includes(match.asset.id)).map(match => <div className="en-image-problem" key={match.asset.id}><b>{match.asset.fileName}</b><p>{match.asset.sourceId} / {match.asset.location}</p><p>{imageProblems.get(match.asset.id) ?? 'Not validated. Select the exact original file.'}</p>{!bundleFile && <>{match.candidates.length > 0 && <label className="en-field">Choose file for {match.asset.id}<SelectField aria-label={`Choose file for ${match.asset.id}`} className="mt-2 min-h-11 w-full bg-background font-normal" value={match.explicit ? String(imageFiles.findIndex(file => file.blob === mappedImages.get(match.asset.id))) : ''} onValueChange={value => { const file = imageFiles[Number(value)]; if (file) void changeImages(imageFiles, new Map(mappedImages).set(match.asset.id, file.blob)) }} options={[{ value: '', label: 'Choose the exact image', disabled: true }, ...match.candidates.map(file => ({ value: String(imageFiles.indexOf(file)), label: file.name }))]} /></label>}<label className="en-field">Map image {match.asset.id}<input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void changeImages(imageFiles, new Map(mappedImages).set(match.asset.id, file)) }} /></label></>}</div>)}
        {readyImages.length > 0 && <details className="en-small-detail"><summary>View {readyImages.length} validated images</summary><ul className="en-matched-images">{preview.package.assets.filter(asset => readyImages.includes(asset.id)).map(asset => <li key={asset.id}><b>{asset.fileName}</b><p className="en-file-path">{imageSelection(preview).matches.find(match => match.asset.id === asset.id)?.file?.name ?? 'Retained image bytes'}</p>{assetPrepared && <NotebookAssetThumbnail assetId={asset.id} />}</li>)}</ul></details>}
        {unusedImages.length > 0 && <details className="en-small-detail"><summary>{unusedImages.length} image files not used</summary><p>These files are not imported. Resolve any ambiguous matches above.</p><ul>{unusedImages.map((file, index) => <li key={index}>{file.name}</li>)}</ul></details>}
        {assetError && <p className="en-notice en-error" role="alert">{assetError}</p>}
      </section></details>}
      {updating && revision ? <NotebookImportPreview title="Changes" fullContent={<NotebookTextChanges before={revision.baseline} after={preview.package}><NotebookPackageView pkg={preview.package} sectionChanges={sectionChanges} /></NotebookTextChanges>}><NotebookUpdateChanges before={revision.baseline} after={preview.package} entryId={revision.baseline.entries[0].id} /></NotebookImportPreview> : <NotebookImportPreview><NotebookTextChanges before={revision?.baseline} after={preview.package}><NotebookPackageView pkg={preview.package} sectionChanges={sectionChanges} /></NotebookTextChanges></NotebookImportPreview>}</NotebookAssetsProvider>
      <div className="en-save-actions"><p id={saveReasonId} className="en-save-blocked" role="status">{saveReason || (updating ? updatePlan?.alreadyApplied ? 'This is already your saved version. No new version will be created.' : 'Earlier versions stay in history.' : `Ready to save in ${course.code}.`)}</p><div className="en-actions">{onCancel && <Button variant="ghost" disabled={busy} onClick={onCancel}>Cancel</Button>}<button type="button" className={buttonVariants()} aria-describedby={saveReasonId} disabled={busy || blockers.length > 0} onClick={() => void save()}>{backup ? 'Restore complete notebook backup' : updating ? 'Accept update' : duplicates.length === plan.length ? 'Open saved notebook' : 'Save notebook'}</button></div></div>
    </div>}
  </section>
}
