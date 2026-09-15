import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../../src/index.css'
import { createPersonalInitialData } from '../../src/data/personalInitialData'
import { initializeDurableWorkspaces } from '../../src/store/workspaceBootstrap'
import { workspacePersistence } from '../../src/store/workspacePersistence'
import questionUrl from '../../src/lib/academics/notebook/visual-fixtures/question.png?url'

if (location.hostname !== '127.0.0.1' || !['5273', '5274', '5280'].includes(location.port)) throw new Error('Synthetic-only fixture; wrong origin.')
const guest = location.port === '5280'
const key = guest ? 'hq:app-data:guest' : 'hq:app-data:account:synthetic-idb-qa'
localStorage.setItem('hq:workspace-owner', guest ? 'guest' : 'account:synthetic-idb-qa')
if (!localStorage.getItem(key)) {
  const data = createPersonalInitialData()
  data.notes.example = 'Original synthetic note'
  data.courses.push({ id: 'qa-class', code: 'TEST101', title: 'Synthetic class', term: 'Fall 2026', credits: 3, grade: '', bcpm: false, status: 'planned', inResidence: true, satisfies: [], order: 0 })
  localStorage.setItem(key, JSON.stringify({ state: data, version: 50 }))
}
await initializeDurableWorkspaces()
const { useStore, snapshotData, activeAccountWorkspaceId } = await import('../../src/store/store')
if (!useStore.persist.hasHydrated()) throw new Error('Synthetic workspace hydration failed. Preserve the original; do not adopt defaults.')
const { commitWorkspaceMutation } = await import('../../src/store/workspaceTransaction')
const { WorkspacePersistenceStatus } = await import('../../src/components/layout/WorkspacePersistenceStatus')
const { commitNotebookAssets, notebookAssetRepository } = await import('../../src/lib/academics/notebook/notebookAssetStore')
const { prepareNotebookAssets } = await import('../../src/lib/academics/notebook/visualAssets')
const { prepareNotebook } = await import('../../src/lib/academics/notebook/package')
const { importNotebook, saveNotebookEdits } = await import('../../src/lib/academics/notebook/import')
const { default: pkg } = await import('../../src/lib/academics/notebook/visual-fixtures/valid-v3-figure-diagram.json')
useStore.getState().adoptPreparedWorkspace(snapshotData())
const persistence = workspacePersistence()!
await persistence.flush(key)
function QA() {
  const state = useStore(s => s)
  const [status, setStatus] = useState('Loaded from verified IndexedDB.'), [image, setImage] = useState('')
  const notebook = state.academics.classCenter.lectures[0]?.importedNotebook
  async function showImage() {
    const binding = useStore.getState().academics.classCenter.lectures[0]?.importedNotebook?.assetBindings?.[0]
    if (!binding) throw new Error('No image binding')
    const blob = await notebookAssetRepository().read(binding.sha256)
    if (!blob) throw new Error('Image bytes missing')
    setImage(URL.createObjectURL(blob)); setStatus('Stored image bytes loaded successfully.')
  }
  async function visual() {
    const prepared = await prepareNotebook(JSON.stringify(pkg))
    if (prepared.package.version === 2) throw new Error('Expected visual fixture')
    const blob = await (await fetch(questionUrl)).blob()
    const assets = await prepareNotebookAssets(prepared.package, [{ name: prepared.package.assets[0].fileName, blob }])
    await commitNotebookAssets({ prepared: assets, assertFresh() {}, commit: () => ({ committed: true, durable: commitWorkspaceMutation(d => { importNotebook(d.academics.classCenter, d.courses[0], prepared, { confirmDestination: true }) }) }) })
    const edited = structuredClone(snapshotData().academics.classCenter.lectures[0].importedNotebook!.current)
    const { retainLocalBlob } = await import('../../src/lib/localBlobStore')
    await retainLocalBlob('idb://academics/source/synthetic-original', new Blob(['Synthetic attached original file'], { type: 'text/plain' }))
    edited.entries[0].title = 'Synthetic edited visual notebook'
    await commitWorkspaceMutation(d => {
      if (!d.academics.classCenter.files.some(file => file.id === 'synthetic-original')) d.academics.classCenter.files.push({ id: 'synthetic-original', courseId: 'qa-class', sourceType: 'upload', owner: 'course', createdAt: 1, updatedAt: 1, order: 0, title: 'Synthetic original', fileName: 'original.txt', mimeType: 'text/plain', type: 'other', blobRef: 'idb://academics/source/synthetic-original', linkedTopicIds: [] })
      const entry = d.academics.classCenter.lectures[0]
      entry.importedNotebook!.progress.syntheticPractice = { response: 'Synthetic saved answer', complete: true }
      saveNotebookEdits(entry, edited, 'Synthetic saved notes')
    })
    await showImage(); setStatus('Visual notebook, edit, history and progress committed.')
  }
  async function run(action: () => Promise<void>) { try { setStatus('Working…'); await action() } catch (error) { setStatus(error instanceof Error ? error.message : String(error)) } }
  async function receipt() {
    await persistence.flush(key)
    const entry = snapshotData().academics.classCenter.lectures[0]?.importedNotebook
    const binding = entry?.assetBindings?.[0], blob = binding && await notebookAssetRepository().read(binding.sha256)
    const record = await persistence.repository.read(key)
    const proof = { syntheticOnly: true, owner: activeAccountWorkspaceId(), noteCharacters: snapshotData().notes.example.length, localStorageCharacters: localStorage.getItem(key)?.length, phase: persistence.status(key), revision: record?.revision, notebookTitle: entry?.current.entries[0].title, historyCount: entry?.history?.length, progress: entry?.progress, sources: entry?.current.sources.length, notes: entry?.notes, imageBytes: blob?.size, imageHash: binding?.sha256, journals: await notebookAssetRepository().journals(), originalCopies: (await persistence.repository.originals(key)).length }
    const url = URL.createObjectURL(new Blob([JSON.stringify(proof,null,2)], { type: 'application/json' })), a = document.createElement('a'); a.href = url; a.download = 'premedos-idb-native-receipt.json'; a.click(); URL.revokeObjectURL(url)
    setStatus('Synthetic receipt downloaded.')
  }
  return <main className="mx-auto max-w-3xl space-y-4 p-8"><h1>IndexedDB storage — synthetic QA</h1><p>No real account or cloud connection.</p><dl><dt>Owner</dt><dd>{activeAccountWorkspaceId()}</dd><dt>Note characters</dt><dd>{state.notes.example?.length}</dd><dt>localStorage pointer characters</dt><dd>{localStorage.getItem(key)?.length}</dd><dt>Notebook</dt><dd>{notebook?.current.entries[0].title ?? 'Not created'}</dd><dt>History</dt><dd>{notebook?.history?.length ?? 0}</dd><dt>Practice response</dt><dd>{notebook?.progress.syntheticPractice?.response ?? 'None'}</dd></dl><div className="flex flex-wrap gap-4"><button onClick={() => run(async () => { await commitWorkspaceMutation(d => { d.notes.example = 'Synthetic large workspace. '.repeat(260000) }); setStatus('Large metadata commit acknowledged.') })}>Save metadata over 5 MiB</button><button onClick={() => run(visual)}>Save visual notebook</button><button onClick={() => run(showImage)}>Load saved image</button><button onClick={() => run(receipt)}>Download verification receipt</button><button onClick={() => run(async () => { const original = persistence.repository.commit; persistence.repository.commit = async () => { throw new DOMException('Synthetic IDB quota rejection', 'QuotaExceededError') }; try { await commitWorkspaceMutation(d => { d.notes.example = 'Rejected edit must not persist' }) } finally { persistence.repository.commit = original } })}>Simulate failed save</button></div><p role="status">{status}</p>{image && <img alt="Image loaded from notebook asset storage" src={image} style={{maxWidth:500}} />}</main>
}
createRoot(document.getElementById('root')!).render(<WorkspacePersistenceStatus><QA /></WorkspacePersistenceStatus>)
