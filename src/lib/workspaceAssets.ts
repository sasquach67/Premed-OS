import type { AppData } from './types'
import type { NotebookAssetBinding, PortableImportedNotebook } from './academics/notebook/visualTypes'
import { assertNotebookBackupFits } from './academics/notebook/notebookBundle'

/** Includes retained notebook versions and trash, without interpreting source text as file paths. */
export function workspaceAssets(data: AppData) {
  const images = new Map<string, NotebookAssetBinding>(), files = new Set<string>()
  const seen = new WeakSet<object>()
  function visit(value: unknown) {
    if (!value || typeof value !== 'object' || seen.has(value)) return
    seen.add(value)
    if (Array.isArray(value)) { value.forEach(visit); return }
    const record = value as Record<string, unknown>
    if (typeof record.blobRef === 'string' && record.blobRef.startsWith('idb://')) files.add(record.blobRef)
    const notebook = record.importedNotebook as PortableImportedNotebook | undefined
    if (notebook) assertNotebookBackupFits(notebook, typeof record.courseId === 'string' ? record.courseId : 'retained-notebook')
    for (const binding of notebook?.assetBindings ?? []) {
      if (!/^[a-f0-9]{64}$/.test(binding.sha256) || !['image/png', 'image/jpeg'].includes(binding.mimeType) || !Number.isSafeInteger(binding.byteLength) || binding.byteLength <= 0) throw new Error('A saved notebook has an invalid image binding. Review its complete backup before syncing.')
      const previous = images.get(binding.sha256)
      if (previous && (previous.byteLength !== binding.byteLength || previous.mimeType !== binding.mimeType || previous.width !== binding.width || previous.height !== binding.height)) throw new Error('Saved notebook images disagree about their original bytes. Review their backups before syncing.')
      images.set(binding.sha256, binding)
    }
    Object.values(record).forEach(visit)
  }
  visit(data)
  return { images, files }
}
export async function binaryDigest(blob: Blob) {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}
