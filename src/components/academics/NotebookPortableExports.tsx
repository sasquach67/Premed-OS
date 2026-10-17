import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/store'
import { exportNotebook } from '@/lib/academics/notebook/import'
import { notebookExportFilename, notebookPackageFilename } from '@/lib/academics/notebook/downloadFilename'
import { exportNotebookBackupBundle, exportNotebookPackageBundle } from '@/lib/academics/notebook/notebookBundle'
import { notebookAssetRepository } from '@/lib/academics/notebook/notebookAssetStore'
import { notebookContentKey } from '@/lib/academics/notebook/revision'
import { folderPicker } from '@/lib/academics/materialFolder/filesystem'
import { saveNotebookBundleFolder } from '@/lib/academics/notebook/notebookFolderExport'
import { canonical } from '@/lib/academics/notebook/package'
import type { LectureRecord } from '@/lib/types'
import type { NotebookUpdateSession } from '@/lib/academics/notebook/types'

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
function latestLecture(id: string) {
  const lecture = useStore.getState().academics.classCenter.lectures.find(l => l.id === id)
  if (!lecture?.importedNotebook) throw new Error('This saved notebook no longer exists.')
  return lecture
}
export function NotebookPortableExports({ lecture }: { lecture: LectureRecord }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  async function exportBundle(kind: 'current' | 'backup') {
    setBusy(true); setMessage('')
    try {
      const current = latestLecture(lecture.id), n = current.importedNotebook!, repo = notebookAssetRepository()
      const blob = kind === 'backup' ? await exportNotebookBackupBundle(n, current.courseId, repo) : await exportNotebookPackageBundle(exportNotebook(current, 'current'), n.assetBindings ?? [], repo)
      downloadBlob(notebookExportFilename(n, kind, 'zip'), blob)
      setMessage(kind === 'backup' ? 'Complete backup downloaded with original content, history, notes, practice records and every retained image.' : 'Current notebook and its image files downloaded.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The complete export could not be created.') }
    finally { setBusy(false) }
  }
  return <details className="nbr-portable-exports"><summary>Portable notebook and complete backup</summary><p>Notebook images are kept on this device and included when account sync finishes successfully. JSON-only exports contain references, without image files. A complete portable backup includes every retained image, source, note and practice record.</p><div className="en-actions"><Button variant="outline" disabled={busy} onClick={() => void exportBundle('current')}>Download current notebook + images</Button><Button variant="outline" disabled={busy} onClick={() => void exportBundle('backup')}>Download complete portable backup</Button></div><p role="status">{busy ? 'Checking every retained image before export...' : message}</p></details>
}
export function NotebookUpdateImageFiles({ lecture, revision, disabled, children }: { lecture: LectureRecord; revision: NotebookUpdateSession; disabled: boolean; children?: ReactNode }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  const picker = folderPicker()
  async function download(kind: 'folder' | 'zip') {
    setBusy(true); setMessage('')
    try {
      const current = latestLecture(lecture.id), n = current.importedNotebook!
      if (disabled || n.updateSession?.id !== revision.id || notebookContentKey(n) !== canonical(revision.baseline)) throw new Error('Saved content changed. Restart from the latest saved entry before exporting the baseline and images.')
      const snapshot = canonical(n), raw = JSON.stringify(revision.baseline, null, 2)
      const fence = () => { if (canonical(latestLecture(lecture.id).importedNotebook) !== snapshot) throw new Error('The notebook changed while the folder was prepared. Restart from its latest saved content.') }
      // The picker must open in the click gesture, before asynchronous image preparation.
      const destination = kind === 'folder' && picker ? await picker({ mode: 'readwrite' }) : null
      if (kind === 'folder' && !destination) throw new Error('This browser cannot save a folder. Download the ZIP and unzip it instead.')
      fence()
      const blob = await exportNotebookPackageBundle(raw, n.assetBindings ?? [], notebookAssetRepository())
      fence()
      const filename = notebookPackageFilename(revision.baseline, undefined, 'zip')
      if (destination) {
        const name = await saveNotebookBundleFolder(blob, destination, filename.slice(0, -4), fence)
        setMessage(`Saved “${name}” with notebook.json, its images and bindings.json. Attach these files with the update prompt.`)
      } else {
        downloadBlob(filename, blob)
        setMessage('Notebook ZIP download requested. Unzip it and attach notebook.json, its images and bindings.json with the update prompt.')
      }
    } catch (error) {
      setMessage(error instanceof DOMException && error.name === 'AbortError' ? 'Folder saving cancelled. Your notebook is unchanged.' : error instanceof Error ? error.message : 'The notebook folder could not be exported.')
    } finally { setBusy(false) }
  }
  return <section className="en-stage-panel" aria-label="Saved update baseline">
    <h2>{disabled ? 'Restart to get the latest saved notebook' : 'Bring the latest saved notebook too'}</h2>
    <p>Save a folder with the latest notebook, its images and their mapping. Notes, practice progress and unsaved edits stay outside the AI handoff.</p>
    <div className="en-actions"><Button variant="outline" disabled={busy || disabled || !picker} onClick={() => void download('folder')}>Download notebook folder</Button>{children}</div>
    {!picker && <p>This browser cannot save folders. Download the ZIP below and unzip it.</p>}
    <details className="en-small-detail"><summary>Download as ZIP instead</summary><Button variant="outline" disabled={busy || disabled} onClick={() => void download('zip')}>Download notebook ZIP</Button></details>
    <p role="status">{busy ? 'Preparing the notebook and checking its images…' : message}</p>
  </section>
}
