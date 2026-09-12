import { collectNotebookFiles, type NotebookFileCollection } from './notebookFiles'
import { prepareNotebookBundle, type PreparedNotebookBundle } from './notebookBundle'
import { readNotebookZip, writeNotebookZip } from './notebookZip'
import type { RasterDecoder } from './visualAssets'
import { NOTEBOOK_MAX_BYTES } from './package'
import { NOTEBOOK_VISUAL_LIMITS as limits, visualLimit } from './visualLimits'

export async function classifyNotebookJsonFiles(collection: NotebookFileCollection): Promise<NotebookFileCollection> {
  const json = [], auxiliary = [...collection.auxiliary]
  for (const file of collection.json) {
    if (file.blob.size > NOTEBOOK_MAX_BYTES) throw new Error(`JSON ${file.name} exceeds 8 MiB. Choose a smaller notebook package.`)
    try {
      const value = JSON.parse(await file.blob.text())
      if (value && typeof value === 'object' && (value.format === 'premed-os-notebook-package' || value.format === 'premed-os-notebook-backup' || (Array.isArray(value.entries) && value.course && Array.isArray(value.sources)))) json.push(file)
      else auxiliary.push(file)
    } catch { json.push(file) } // Let the existing parser explain malformed notebook JSON.
  }
  return { ...collection, json, auxiliary }
}

/** An extracted app export resolves its friendly image names through its strict
 * byte index, exactly like the original ZIP. Auxiliary files never become notebooks. */
export async function notebookBundleFromFolder(collection: NotebookFileCollection, jsonName: string, decode?: RasterDecoder): Promise<{ bundle: PreparedNotebookBundle; archive: Blob; used: string[] } | null> {
  if (jsonName.split('/').at(-1) !== 'notebook.json') return null
  const prefix = jsonName.slice(0, -'notebook.json'.length), indexName = `${prefix}bindings.json`
  const index = collection.files.find(file => file.name === indexName)
  if (!index) return null
  visualLimit(index.blob.size, limits.jsonBytes, 'Asset index JSON bytes')
  const raw = await index.blob.text()
  let value: { bindings?: { sha256?: string; mimeType?: string }[] }
  try { value = JSON.parse(raw) } catch { throw new Error('bindings.json is invalid. Restore the complete original app-exported package.') }
  if (!value || typeof value !== 'object' || !Array.isArray(value.bindings)) throw new Error('bindings.json must contain the app-owned image bindings.')
  const names = new Set(['notebook.json', 'bindings.json'])
  for (const binding of value.bindings) {
    if (!binding || typeof binding !== 'object' || !/^[a-f0-9]{64}$/.test(binding.sha256 ?? '') || !['image/png', 'image/jpeg'].includes(binding.mimeType ?? '')) throw new Error('bindings.json contains an invalid image identity. Restore the original app export.')
    names.add(`assets/${binding.sha256}.${binding.mimeType === 'image/png' ? 'png' : 'jpg'}`)
  }
  visualLimit(names.size, limits.zipMembers, 'Notebook bundle file count')
  const members = new Map<string, Uint8Array>(), used: string[] = []
  for (const name of names) {
    const file = collection.files.find(file => file.name === prefix + name)
    if (!file) throw new Error(`Missing package file ${prefix + name}. Select the complete extracted folder or original ZIP.`)
    visualLimit(file.blob.size, name.endsWith('.json') ? limits.jsonBytes : limits.imageBytes, `${name} bytes`)
    members.set(name, new Uint8Array(await file.blob.arrayBuffer())); used.push(file.name)
  }
  const archive = writeNotebookZip(members)
  return { archive, bundle: await prepareNotebookBundle(archive, decode), used }
}

export async function readNotebookImportZip(blob: Blob, decode?: RasterDecoder): Promise<{ kind: 'files'; collection: NotebookFileCollection } | { kind: 'bundle'; bundle: PreparedNotebookBundle; archive: Blob; collection: NotebookFileCollection; used: string[] }> {
  const members = await readNotebookZip(blob, { collection: true })
  const collection = collectNotebookFiles([...members].map(([name, bytes]) => ({ name, blob: new Blob([bytes.slice().buffer], { type: /\.png$/i.test(name) ? 'image/png' : /\.jpe?g$/i.test(name) ? 'image/jpeg' : /\.json$/i.test(name) ? 'application/json' : 'application/octet-stream' }) })))
  if (members.has('bindings.json')) {
    // Never reinterpret a broken protected app export as an ordinary AI package.
    if (!members.has('notebook.json')) throw new Error('The app-exported package is missing notebook.json. Restore the complete original folder or ZIP.')
    const classified = await classifyNotebookJsonFiles(collection)
    if (classified.json.length > 1) return { kind: 'files', collection }
    const indexed = await notebookBundleFromFolder(collection, 'notebook.json', decode)
    if (!indexed) throw new Error('The notebook image index is unavailable.')
    return { kind: 'bundle', ...indexed, collection: classified }
  }
  return { kind: 'files', collection }
}
