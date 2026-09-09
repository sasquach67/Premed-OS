import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/store'
import { exportNotebook } from '@/lib/academics/notebook/import'
import { notebookExportFilename, notebookPackageFilename } from '@/lib/academics/notebook/downloadFilename'
import { exportNotebookBackupBundle, exportNotebookPackageBundle } from '@/lib/academics/notebook/notebookBundle'
import { notebookAssetRepository } from '@/lib/academics/notebook/notebookAssetStore'
import { notebookContentKey } from '@/lib/academics/notebook/revision'
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
  return <details className="nbr-portable-exports"><summary>Portable notebook and complete backup</summary><p>Images are stored on this device. Ordinary JSON backups and cloud metadata do not include image files. Use a complete portable backup when moving devices or clearing browser storage.</p><div className="en-actions"><Button variant="outline" disabled={busy} onClick={() => void exportBundle('current')}>Download current notebook + images</Button><Button variant="outline" disabled={busy} onClick={() => void exportBundle('backup')}>Download complete portable backup</Button></div><p role="status">{busy ? 'Checking every retained image before export...' : message}</p></details>
}
export function NotebookUpdateImageFiles({ lecture, revision, disabled }: { lecture: LectureRecord; revision: NotebookUpdateSession; disabled: boolean }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  if (revision.baseline.version === 2 || !revision.baseline.assets.length) return null
  async function download() {
    setBusy(true); setMessage('')
    try {
      const current = latestLecture(lecture.id), n = current.importedNotebook!
      if (disabled || n.updateSession?.id !== revision.id || notebookContentKey(n) !== canonical(revision.baseline)) throw new Error('Saved content changed. Restart from the latest saved entry before exporting the baseline and images.')
      const snapshot = canonical(n), raw = JSON.stringify(revision.baseline, null, 2)
      const blob = await exportNotebookPackageBundle(raw, n.assetBindings ?? [], notebookAssetRepository())
      if (canonical(latestLecture(lecture.id).importedNotebook) !== snapshot) throw new Error('The notebook changed while the image bundle was prepared. Restart from its latest saved content.')
      downloadBlob(notebookPackageFilename(revision.baseline, undefined, 'zip'), blob); setMessage('Baseline and existing image mapping downloaded. Give your AI the full update prompt, this notebook JSON and image files, plus the new materials. Unzip first if your AI cannot read the bundle.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Baseline images could not be exported.') }
    finally { setBusy(false) }
  }
  return <section className="en-stage-panel"><h3>Keep the existing figures with your update</h3><p>Your update needs the current notebook JSON and the image files it references, not just new materials.</p><Button variant="outline" disabled={busy || disabled} onClick={() => void download()}>Download current baseline + images</Button><p role="status">{message}</p></section>
}
