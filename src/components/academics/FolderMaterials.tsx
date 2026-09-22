import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronRight, Cloud, Download, FileText, Folder, FolderOpen, MoreHorizontal, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { useStore } from '@/store/store'
import { useAccountCloud } from '@/store/AccountCloudContext'
import { Link } from 'react-router-dom'
import { captureFolderFence, readFolderLibrary, saveFolderLibrary, withFolderLock } from '@/lib/academics/materialFolder/controller'
import { readFolderCatalog, sameFolderItems } from '@/lib/academics/materialFolder/catalog'
import { bindFolder, createFolder } from '@/lib/academics/materialFolder/filesystem'
import { cancelMove, finishMove, folderPicker, getFile, moveEntries, operations, permission, type DirectoryHandle, type MoveOperation } from '@/lib/academics/materialFolder/filesystem'
import { CACHE_BYTES, MAX_FILE_BYTES, PAGE_SIZE, fileName, folderPath, formatBytes, immediateItems, joinPath, packageRoot, validateName, type FolderItem, type FolderLibrary } from '@/lib/academics/materialFolder/model'
import { cacheUsage, clearPreviewCache, cloudBudgetUsed, deviceId, downloadFolderFile, loadFolderHandle, saveFolderHandle, syncFolderFile } from '@/lib/academics/materialFolder/storage'
import { FolderPdfPreview } from './FolderPdfPreview'
import './FolderMaterials.css'

type Edit = { kind: 'rename' | 'move' | 'trash' | 'create' | 'category'; items: FolderItem[] }
type Preview = { blob: Blob; name: string; url: string; type: string; text?: string }

export function FolderMaterials({ courseId, courseLabel, onBack }: { courseId: string; courseLabel: string; onBack: () => void }) {
  const cloud = useAccountCloud()
  const syncPending = Boolean(cloud.user && !cloud.accountReady)
  const syncNeedsAttention = Boolean(cloud.conflict || cloud.status === 'error')
  const library = useStore(s => s.academics.classCenter.workspaces.find(w => w.courseId === courseId)?.materialFolder)
  const [root, setRoot] = useState<DirectoryHandle | null>(null)
  const [readable, setReadable] = useState(false)
  const [path, setPath] = useState(''), [query, setQuery] = useState(''), [category, setCategory] = useState('')
  const [page, setPage] = useState(0), [selection, setSelection] = useState<string[]>([])
  const [busy, setBusy] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [journal, setJournal] = useState<MoveOperation[]>([]), [trash, setTrash] = useState(false)
  const [edit, setEdit] = useState<Edit | null>(null), [value, setValue] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null), [cached, setCached] = useState(0)
  const working = useRef(false), previewEpoch = useRef(0), mounted = useRef(true), refreshRef = useRef<() => void>(() => {})
  const [thisDevice] = useState(deviceId)
  const [scanning, setScanning] = useState(false)
  const scanController = useRef<AbortController | null>(null)
  const canManage = Boolean(root && library?.writerDevice === thisDevice && !syncPending)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; scanController.current?.abort() } }, [])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url) }, [preview])
  useEffect(() => {
    let alive = true
    if (library?.id && library.writerDevice === thisDevice) {
      void Promise.resolve().then(async () => {
        const fence = captureFolderFence()
        const handle = await loadFolderHandle(library.id!)
        fence()
        if (!alive || !handle) return
        const allowed = await permission(handle)
        fence()
        if (alive) { setRoot(handle); setReadable(allowed) }
      }).catch(e => { if (alive) setError(message(e)) })
    }
    void cacheUsage().then(n => { if (alive) setCached(n) }).catch(() => {})
    return () => { alive = false }
  }, [library?.id, library?.writerDevice, courseId, thisDevice])


  function resetView() { setPage(0); setSelection([]) }
  function changePath(next: string) { resetView(); setPath(next) }
  function changeQuery(next: string) { resetView(); setQuery(next) }
  function changeCategory(next: string) { resetView(); setCategory(next) }
  function changeTrash(next: boolean) { resetView(); setTrash(next) }
  const allItems = library?.items ?? [], active = allItems.filter(i => !i.trashed)
  const rows = immediateItems(active, path, query, category), selected = active.filter(i => selection.includes(i.id))
  const visiblePage = Math.min(page, Math.max(0, Math.ceil(rows.length / PAGE_SIZE) - 1))
  const dirs = allItems.filter(i => i.kind === 'directory' && !i.missing && !i.trashed && !packageRoot(allItems, joinPath(i.path, 'new')))
  const pending = journal.filter(op => op.phase === 'prepared' || op.phase === 'copied')
  const trashed = journal.filter(op => op.kind === 'trash' && op.phase === 'done').flatMap(op => op.moves)
    .filter(move => !journal.some(op => op.kind === 'restore' && op.phase === 'done' && op.moves.some(m => m.from === move.to)))

  async function run(label: string, work: () => Promise<void>) {
    if (working.current) return
    working.current = true; setBusy(label); setError(''); setNotice('')
    try { await work() } catch (e) { if (mounted.current) setError(message(e)) }
    finally {
      working.current = false
      if (mounted.current) {
        setBusy('')
        if (root) { try { const fence = captureFolderFence(); const log = await operations(root); fence(); if (mounted.current) setJournal(log) } catch { /* Error already stays visible. */ } }
        void cacheUsage().then(n => { if (mounted.current) setCached(n) }).catch(() => {})
      }
    }
  }
  async function updateCatalog(handle: DirectoryHandle, fence: () => void, initial?: FolderLibrary) {
    const before = initial ?? readFolderLibrary(courseId)
    if (!before) throw new Error('Connect a class folder first.')
    const controller = new AbortController()
    scanController.current = controller; setScanning(true)
    let result: Awaited<ReturnType<typeof readFolderCatalog>>
    try {
      result = await readFolderCatalog(handle, before, fence, { signal: controller.signal, onProgress: progress => { if (mounted.current) setBusy(progress) } })
    } finally {
      if (scanController.current === controller) scanController.current = null
      if (mounted.current) setScanning(false)
    }
    const { log, items, appliedOperations } = result
    fence()
    if (initial || !sameFolderItems(items, before.items) || appliedOperations.length !== (before.appliedOperations?.length ?? 0)) {
      setBusy('Saving file list…')
      await saveFolderLibrary(courseId, { ...before, items, appliedOperations, updatedAt: Date.now() }, fence)
    }
    setJournal(log); setReadable(true)
  }
  async function refresh(interactive: boolean) {
    if (!root || !library || working.current || syncPending) return
    await run('Refreshing folder…', async () => {
      const fence = captureFolderFence(true)
      if (!await permission(root, false, interactive)) { setReadable(false); if (interactive) throw new Error('Folder access is paused. Reconnect to refresh; saved account copies remain available.'); return }
      fence()
      await withFolderLock(library.id, () => updateCatalog(root, fence))
    })
  }
  useEffect(() => { refreshRef.current = () => { if (root && readable) void refresh(false) } })
  useEffect(() => {
    const focus = () => { if (document.visibilityState === 'visible') refreshRef.current() }
    window.addEventListener('focus', focus); document.addEventListener('visibilitychange', focus)
    if (root) refreshRef.current()
    return () => { window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus) }
  }, [root, syncPending])

  async function connect() {
    if (!thisDevice) { setError('This browser could not remember the folder connection. Enable browser storage and reload before connecting.'); return }
    const picker = folderPicker()
    if (!picker) { setError('Folder linking needs desktop Chrome or Edge. Previously added materials and folder/ZIP imports are still available.'); return }
    if (library && library.writerDevice !== thisDevice) { setError('Manage this folder on the computer where you connected it. Account copies can be opened here.'); return }
    const fence = captureFolderFence(true)
    // Browser pickers must run directly inside this user gesture.
    let handle: DirectoryHandle
    try { handle = await picker({ mode: 'readwrite' }) } catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) setError(message(e)); return }
    await run('Connecting folder…', async () => {
      fence()
      const previousHandle = library ? await loadFolderHandle(library.id) : undefined
      if (previousHandle?.isSameEntry && !await previousHandle.isSameEntry(handle)) throw new Error('Choose the same connected folder. This pilot does not replace an existing library.')
      if (library && !previousHandle) {
        const marker = JSON.parse(await (await getFile(handle, '.premedos/library.json')).text())
        if (marker.id !== library.id) throw new Error('Choose the original connected folder.')
      }
      let rootId = crypto.randomUUID()
      if (!library) {
        try {
          const marker = JSON.parse(await (await getFile(handle, '.premedos/library.json')).text())
          if (!/^[a-f0-9-]{36}$/.test(marker.id)) throw new Error('The folder connection record needs review.')
          if (useStore.getState().academics.classCenter.workspaces.some(w => w.materialFolder?.id === marker.id)) throw new Error('This folder is already connected to a class. Open that class to manage it.')
          rootId = marker.id
        } catch (e) { if (!(e instanceof DOMException && e.name === 'NotFoundError')) throw e }
      }
      const initial: FolderLibrary = library ?? { id: rootId, label: handle.name, writerDevice: thisDevice, items: [], updatedAt: Date.now(), cloudObjects: {} }
      await withFolderLock(initial.id, async () => {
        await bindFolder(handle, initial.id, fence)
        await saveFolderHandle(initial.id, handle); fence()
        await updateCatalog(handle, fence, initial)
      })
      setRoot(handle); setReadable(true)
      setNotice('Folder connected. No document contents were uploaded or cached.')
    })
  }
  function begin(kind: Edit['kind'], items = selected) {
    if (kind !== 'create' && !items.length) return
    if (items.some(i => i.missing)) { setError('Refresh or restore missing originals before changing them.'); return }
    if (kind !== 'category' && (items.some(i => packageRoot(allItems, i.path)) || (kind === 'create' && packageRoot(allItems, joinPath(path, 'new'))))) { setError('Notebook files stay together. Rename or move the enclosing Notebook folder instead.'); return }
    setError('')
    setValue(kind === 'rename' ? fileName(items[0].path) : kind === 'move' ? '' : kind === 'category' ? items[0].category : '')
    setEdit({ kind, items })
  }
  async function mutate() {
    if (!edit || !root || !library) return
    const fence = captureFolderFence(true), action = edit
    await run('Saving folder change…', async () => {
      if (!await permission(root, true, true)) throw new Error('Allow folder changes in your browser to continue.')
      fence()
      await withFolderLock(library.id, async () => {
        if (action.kind === 'category') {
          const label = value.trim()
          if (!label || label.length > 60) throw new Error('Choose a short material type (up to 60 characters).')
          const current = readFolderLibrary(courseId)!
          await saveFolderLibrary(courseId, { ...current, items: current.items.map(i => action.items.some(a => a.id === i.id) ? { ...i, category: label, categoryConfirmed: true } : i) }, fence)
        } else if (action.kind === 'create') {
          await createFolder(root, joinPath(path, validateName(value)), fence)
          await updateCatalog(root, fence)
        } else {
          if (action.kind === 'move' && packageRoot(allItems, joinPath(value, 'new'))) throw new Error('Keep notebook packages intact. Choose a folder outside the notebook.')
          const top = action.items.filter(i => !action.items.some(other => other.id !== i.id && i.path.startsWith(other.path + '/')))
          const trashId = crypto.randomUUID()
          const moves = top.map(i => ({ from: i.path, to: action.kind === 'rename' ? joinPath(folderPath(i.path), validateName(value)) : action.kind === 'trash' ? `.premedos/Trash/${trashId}/${i.path}` : joinPath(value, fileName(i.path)) }))
          await moveEntries(root, moves, action.kind === 'trash' ? 'trash' : 'move', fence)
          await updateCatalog(root, fence)
        }
      })
      setEdit(null); setSelection([]); setNotice(action.kind === 'trash' ? 'Moved to Trash. You can restore it here.' : 'Folder change saved.')
    })
  }
  async function sync() {
    if (!root || !library) return
    await run('Checking account copies…', async () => {
      const fence = captureFolderFence(true)
      if (!await permission(root, false, true)) throw new Error('Reconnect the folder to upload originals.')
      await withFolderLock(library.id, async () => {
        const chosen = selected.length ? active.filter(i => selected.some(s => i.id === s.id || i.path.startsWith(s.path + '/'))) : active
        const files = chosen.filter(i => i.kind === 'file' && !i.missing && i.size <= MAX_FILE_BYTES)
        let count = 0
        for (const item of files) {
          fence(); setBusy(`Saving account copies · ${++count} of ${files.length}`)
          const current = readFolderLibrary(courseId)!
          const result = await syncFolderFile(root, item, current, fence, async (hash, size) => {
            const latest = readFolderLibrary(courseId)!
            await saveFolderLibrary(courseId, { ...latest, pendingCloudObjects: { ...latest.pendingCloudObjects, [hash]: size } }, fence)
          })
          const latest = readFolderLibrary(courseId)!, pendingCloudObjects = { ...latest.pendingCloudObjects }
          delete pendingCloudObjects[result.hash]
          const next: FolderLibrary = { ...latest, pendingCloudObjects, cloudObjects: { ...latest.cloudObjects, [result.hash]: result.size }, items: latest.items.map(i => i.id === item.id ? { ...i, hash: result.hash, cloudHash: result.hash, cloudSize: result.size } : i) }
          await saveFolderLibrary(courseId, next, fence)
        }
        setNotice(`${count} account ${count === 1 ? 'copy' : 'copies'} checked. Identical files share one uploaded copy. Files over 50 MiB remain local only.`)
      })
    })
  }
  async function open(item: FolderItem) {
    if (item.kind === 'directory') { changePath(item.path); changeQuery(''); return }
    const epoch = ++previewEpoch.current
    setPreview(null)
    await run(`Opening ${fileName(item.path)}…`, async () => {
      const fence = captureFolderFence()
      let blob: Blob
      if (root && !item.missing && await permission(root)) blob = await getFile(root, item.path)
      else if (item.cloudHash) blob = await downloadFolderFile(item.cloudHash, fence)
      else throw new Error('This file is local only. Open it on the connected computer or save an account copy there.')
      fence()
      if (epoch !== previewEpoch.current || !mounted.current) return
      const name = fileName(item.path), type = blob.size > MAX_FILE_BYTES ? 'application/octet-stream' : blob.type || (/\.pdf$/i.test(name) ? 'application/pdf' : /\.(txt|md|json|html|csv|tsv)$/i.test(name) ? 'text/plain' : '')
      const text = type.startsWith('text/') || /\.(txt|md|json|html|csv|tsv)$/i.test(name) ? await blob.slice(0, 100_000).text() : undefined
      fence()
      if (epoch !== previewEpoch.current || !mounted.current) return
      setPreview({ blob, name, type, text: text === undefined ? undefined : text + (blob.size > 100_000 ? '\n\nPreview shortened. Download to read the complete file.' : ''), url: URL.createObjectURL(blob) })
    })
  }
  async function restore(from: string, to: string) {
    if (!root || !library) return
    await run('Restoring file…', async () => {
      const fence = captureFolderFence(true)
      if (!await permission(root, true, true)) throw new Error('Allow folder changes to restore this file.')
      await withFolderLock(library.id, async () => { await moveEntries(root, [{ from, to }], 'restore', fence); await updateCatalog(root, fence) })
      setNotice('Restored to its original folder.')
    })
  }
  async function resume(op: MoveOperation, cancel = false) {
    if (!root || !library) return
    await run('Checking and finishing the interrupted move…', async () => {
      const fence = captureFolderFence(true)
      if (!await permission(root, true, true)) throw new Error('Allow folder changes to finish this operation.')
      await withFolderLock(library.id, async () => { if (cancel) await cancelMove(root, op, fence); else await finishMove(root, op, fence); await updateCatalog(root, fence) })
      if (cancel) setNotice('Originals kept. Any partial destination copies were also kept for review in Finder.')
    })
  }

  return <section className="material-folder" aria-label="Connected class folder">
    <header className="mf-header">
      <div><p className="mf-eyebrow">{courseLabel}</p><h2>Materials</h2></div>
      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal size={16} />More options</Button></DropdownMenuTrigger><DropdownMenuContent align="end">
        {library && <><DropdownMenuItem onSelect={() => changeTrash(!trash)}><Trash2 />{trash ? 'Back to files' : 'Trash'}</DropdownMenuItem><DropdownMenuSeparator /></>}
        <DropdownMenuItem onSelect={onBack}>Previously added materials</DropdownMenuItem>
      </DropdownMenuContent></DropdownMenu>
    </header>
    {syncPending && <p role="status" className="mf-description">{syncNeedsAttention ? (cloud.error || 'Account sync needs attention before connecting or changing files.') : `${cloud.progress || 'Checking your saved account…'} Folder connection will be available automatically when it finishes.`} <Link to="/settings">View sync status</Link>{cloud.status === 'error' && !cloud.conflict && <Button size="sm" variant="outline" onClick={() => void cloud.pullNow()}>Retry account check</Button>}</p>}
    {!library ? <div className="mf-connect"><FolderOpen size={30} /><h3>Start with your Lesson 1 trial</h3><p>Choose <strong>Premed OS Folder Trial → BIOL 103 → Lesson 01 — Scientific Thinking</strong>.</p><p>Connecting reads the file list. Rename and Move change files in that selected folder; Delete sends them to its recoverable Trash.</p><Button disabled={Boolean(busy) || syncPending} onClick={() => void connect().catch(e => setError(message(e)))}><FolderOpen size={16} />{syncPending ? (syncNeedsAttention ? 'Review account sync' : 'Checking account sync…') : 'Connect trial folder'}</Button><small>Temporary files and archives are excluded. Nothing uploads until you choose Save account copies.</small></div> : <>
      <div className="mf-navigation">
        <nav className="mf-breadcrumbs" aria-label="Folder location"><Folder size={16} /><button onClick={() => { changePath(''); changeQuery(''); if (trash) changeTrash(false) }} aria-current={!path && !trash ? 'page' : undefined}>{library.label}</button>{!trash && path.split('/').filter(Boolean).map((part, i, parts) => <span key={i}><ChevronRight size={13} /><button aria-current={i === parts.length - 1 ? 'page' : undefined} onClick={() => { changePath(parts.slice(0, i + 1).join('/')); changeQuery('') }}>{part}</button></span>)}{trash && <span><ChevronRight size={13} /><span aria-current="page">Trash</span></span>}</nav>
        <span className={`mf-connection ${readable ? 'is-connected' : ''}`}>{readable ? 'Connected on this computer' : 'Saved catalog'}</span>
      </div>
      {library.writerDevice !== thisDevice && <p className="mf-description">Open saved account copies here. Manage the originals on the computer where this folder was connected.</p>}
      {trash && <Button className="mf-back-files" size="sm" variant="ghost" onClick={() => changeTrash(false)}><ArrowLeft size={14} />Back to files</Button>}
      <div className={`mf-commandbar ${selection.length ? 'is-selecting' : ''}`} aria-label={selection.length ? 'Selected file actions' : 'File controls'}>
        {selection.length ? <>
          <strong className="mf-selected-count">{selection.length} selected</strong>
          <div className="mf-selection-actions">{(['rename', 'move', 'trash', 'category'] as const).map(kind => <Button key={kind} size="sm" variant="ghost" disabled={!canManage || Boolean(busy) || (kind === 'rename' && selected.length !== 1)} onClick={() => begin(kind)}>{({ rename: 'Rename', move: 'Move', trash: 'Delete', category: 'Set type' })[kind]}</Button>)}</div>
          <Button className="mf-save" size="sm" disabled={!canManage || Boolean(busy)} onClick={() => void sync()}><Cloud size={16} />Save account copies</Button>
          <Button className="mf-clear-selection" size="sm" variant="ghost" onClick={() => setSelection([])} aria-label="Clear selection"><X size={16} /></Button>
        </> : <>
          <label className="mf-search"><Search size={16} /><input aria-label="Search folder" placeholder="Search files…" value={query} onChange={e => changeQuery(e.target.value)} /></label>
          <select aria-label="Filter material type" value={category} onChange={e => changeCategory(e.target.value)}><option value="">All types</option>{[...new Set(active.map(i => i.category))].sort().map(c => <option key={c}>{c}</option>)}</select>
          <Button size="sm" variant="ghost" disabled={!canManage || Boolean(busy)} onClick={() => begin('create', [])}><Plus size={14} />New folder</Button>
          <Button size="sm" variant="ghost" disabled={Boolean(busy) || syncPending} onClick={() => root ? void refresh(true) : void connect().catch(e => setError(message(e)))}><RefreshCw size={14} />{root ? 'Refresh' : 'Reconnect'}</Button>
          <Button className="mf-save" size="sm" disabled={!canManage || Boolean(busy)} onClick={() => void sync()}><Cloud size={16} />Save account copies</Button>
        </>}
      </div>
      {pending.map(op => <div role="alert" className="mf-alert" key={op.id}>An interrupted file operation needs to finish. Verified copies and remaining originals were kept. {op.moves.map(m => `${m.from} → ${m.to}`).join('; ')}<Button size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => void resume(op)}>Check and resume</Button><Button size="sm" variant="ghost" disabled={Boolean(busy)} onClick={() => void resume(op, true)}>Keep originals</Button></div>)}
      {trash ? <div className="mf-list">{!trashed.length && <p className="mf-empty">Trash is empty.</p>}{trashed.map(item => <div className="mf-row mf-trash-row" key={item.to}><div className="mf-name-cell"><Trash2 size={17} /><span className="mf-name">{item.from}</span></div><Button variant="outline" size="sm" disabled={!canManage || Boolean(busy)} onClick={() => void restore(item.to, item.from)}>Restore</Button></div>)}</div> : <div className={`mf-list ${selection.length ? 'has-selection' : ''}`}>
        <div className="mf-columns"><span>Name</span><span>Type</span><span>Availability</span><span>Size</span></div>
        {path && !query && <button className="mf-up" onClick={() => changePath(folderPath(path))}><ArrowLeft size={14} />Up one folder</button>}
        {!rows.length && <p className="mf-empty">{query || category ? 'No matching files.' : 'This folder is empty.'}</p>}
        {rows.slice(visiblePage * PAGE_SIZE, (visiblePage + 1) * PAGE_SIZE).map(item => <div className={`mf-row ${selection.includes(item.id) ? 'is-selected' : ''}`} key={item.id} draggable={canManage && !busy && !item.missing && !packageRoot(allItems, item.path)} onDragStart={e => { e.dataTransfer.setData('application/x-premed-material', item.id); e.dataTransfer.effectAllowed = 'move' }} onDragOver={e => { if (canManage && item.kind === 'directory' && !packageRoot(allItems, item.path) && e.dataTransfer.types.includes('application/x-premed-material')) e.preventDefault() }} onDrop={e => { if (!canManage || item.kind !== 'directory') return; e.preventDefault(); const dragged = active.find(i => i.id === e.dataTransfer.getData('application/x-premed-material')); if (dragged) { begin('move', selection.includes(dragged.id) ? selected : [dragged]); setValue(item.path) } }}>
          <div className="mf-name-cell"><input type="checkbox" aria-label={`Select ${fileName(item.path)}`} checked={selection.includes(item.id)} onChange={e => setSelection(current => e.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} />{item.kind === 'directory' ? <Folder size={18} /> : <FileText size={18} />}<button className="mf-name" onClick={() => void open(item)} disabled={Boolean(busy) && item.kind !== 'directory'}>{fileName(item.path)}{query && <small>{folderPath(item.path)}</small>}</button></div>
          <span className="mf-type" title={item.categoryConfirmed ? "Your material type" : "Suggested from the file name and folder; use Set type to change it"}>{item.kind === 'directory' ? 'Folder' : item.category}</span><span className="mf-availability">{item.kind === 'directory' ? '' : item.cloudHash ? item.missing ? 'Account copy · local missing' : 'Account copy saved' : item.missing ? 'Missing from folder' : 'Local only'}</span><span className="mf-size">{item.kind === 'directory' ? '—' : formatBytes(item.size)}</span>
          <DropdownMenu><DropdownMenuTrigger asChild><Button className="mf-row-actions" variant="ghost" size="sm" aria-label={`Actions for ${fileName(item.path)}`}><MoreHorizontal size={16} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" onCloseAutoFocus={event => { if (edit) event.preventDefault() }}>
            <DropdownMenuItem disabled={Boolean(busy) && item.kind !== 'directory'} onSelect={() => void open(item)}>Open</DropdownMenuItem><DropdownMenuSeparator />
            {(['rename', 'move', 'trash', 'category'] as const).map(kind => <DropdownMenuItem key={kind} disabled={!canManage || Boolean(busy)} onSelect={() => begin(kind, [item])}>{({ rename: 'Rename', move: 'Move', trash: 'Delete', category: 'Set type' })[kind]}</DropdownMenuItem>)}
          </DropdownMenuContent></DropdownMenu>
        </div>)}
      </div>}
      <footer className="mf-pagination">
        <div className="mf-footer-summary"><span>{trash ? trashed.length : rows.length} {(trash ? trashed.length : rows.length) === 1 ? 'item' : 'items'}</span>
          <Popover><PopoverTrigger asChild><button className="mf-storage-trigger">Storage</button></PopoverTrigger><PopoverContent className="mf-storage-popover" align="start" aria-label="Folder storage">
            <h3>Storage</h3><dl><div><dt>Upload budget</dt><dd>{formatBytes(cloudBudgetUsed(library))} / 64 MiB</dd></div><div><dt>Preview cache</dt><dd>{formatBytes(cached)} / {formatBytes(CACHE_BYTES)}</dd></div></dl>
            <p>Upload budget includes retained versions and reserved uploads. Files open on demand; uploads are limited to 50 MiB per file.</p>
            <Button size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => void run('Clearing replaceable previews…', async () => { await clearPreviewCache(); setCached(0); setNotice('Preview cache cleared. Originals and account copies are unchanged.') })}>Clear preview cache</Button>
          </PopoverContent></Popover>
        </div>
        {!trash && rows.length > PAGE_SIZE && <div className="mf-pages"><Button size="sm" variant="ghost" disabled={!visiblePage} onClick={() => setPage(visiblePage - 1)}>Previous</Button><span>{visiblePage + 1} / {Math.ceil(rows.length / PAGE_SIZE)}</span><Button size="sm" variant="ghost" disabled={(visiblePage + 1) * PAGE_SIZE >= rows.length} onClick={() => setPage(visiblePage + 1)}>Next</Button></div>}
      </footer>
    </>}
    {busy && <p role="status" className="mf-status">{busy}{scanning && <Button size="sm" variant="outline" onClick={() => scanController.current?.abort()}>Stop scan</Button>}</p>}{error && !(cloud.accountReady && error.startsWith('Account sync has not finished checking.')) && <p role="alert" className="mf-alert">{error}</p>}{notice && <p role="status" className="mf-status">{notice}</p>}
    <Dialog open={Boolean(edit)} onOpenChange={open => { if (!open && !busy) setEdit(null) }}><DialogContent><DialogHeader><DialogTitle>{edit && ({ rename: 'Rename', move: 'Move to folder', trash: 'Move to Trash', create: 'New folder', category: 'Material type' })[edit.kind]}</DialogTitle><DialogDescription>{edit?.kind === 'trash' ? 'Files move into recoverable Trash inside the connected folder. Saved notebook content stays intact.' : edit?.kind === 'category' ? 'Choose or write a type. Your choice is kept when the folder refreshes; files are not moved.' : 'This changes the actual connected folder. Existing files will not be overwritten.'}</DialogDescription></DialogHeader><form onSubmit={e => { e.preventDefault(); void mutate().catch(e => setError(message(e))) }}>
      {edit?.kind === 'move' ? <select aria-label="Destination folder" value={value} onChange={e => setValue(e.target.value)}><option value="">{library?.label}</option>{dirs.filter(d => !edit.items.some(i => d.path === i.path || d.path.startsWith(i.path + '/'))).map(d => <option key={d.id} value={d.path}>{d.path}</option>)}</select> : edit?.kind !== 'trash' ? <Input aria-label={edit?.kind === 'category' ? 'Material type' : 'Name'} value={value} onChange={e => setValue(e.target.value)} autoFocus list={edit?.kind === 'category' ? 'mf-types' : undefined} /> : <p>{edit.items.length} selected {edit.items.length === 1 ? 'item' : 'items'}</p>}
      {error && !(cloud.accountReady && error.startsWith('Account sync has not finished checking.')) && <p role="alert" className="mf-alert">{error}</p>}
      <datalist id="mf-types">{['Slides', 'Reading', 'Homework', 'Worksheet', 'Outline', 'Notes', 'Transcript', 'Lab material', 'Rubric', 'Project', 'Notebook', 'Flashcards', 'Other'].map(c => <option key={c} value={c} />)}</datalist><div className="mf-dialog-actions"><Button type="button" variant="outline" disabled={Boolean(busy)} onClick={() => setEdit(null)}>Cancel</Button><Button type="submit" disabled={Boolean(busy) || syncPending}>{edit?.kind === 'trash' ? 'Move to Trash' : 'Save'}</Button></div></form></DialogContent></Dialog>
    <Dialog open={Boolean(preview)} onOpenChange={open => { if (!open) { previewEpoch.current++; setPreview(null) } }}><DialogContent className="sm:max-w-4xl"><DialogHeader><DialogTitle>{preview?.name}</DialogTitle><DialogDescription>File preview</DialogDescription></DialogHeader>{preview && <><a className="mf-download" href={preview.url} download={preview.name}><Download size={16} />Download original</a>{preview.text !== undefined ? <pre className="mf-text-preview">{preview.text}</pre> : preview.type === 'application/pdf' ? <FolderPdfPreview key={preview.url} blob={preview.blob} name={preview.name} /> : preview.type.startsWith('image/') ? <img className="mf-image-preview" src={preview.url} alt={preview.name} /> : <p>Download this file to open it in its usual app.</p>}</>}</DialogContent></Dialog>
  </section>
}
function message(error: unknown) { return error instanceof Error ? error.message : 'The operation could not finish. Your original files were kept.' }
