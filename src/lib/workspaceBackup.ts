import { unzipSync, zipSync } from 'fflate'
import type { AppData } from './types'
import { validateAppData } from './validateAppData'
import { binaryDigest, workspaceAssets } from './workspaceAssets'
import { notebookAssetRepository, type NotebookAssetRepository } from './academics/notebook/notebookAssetStore'
import { readLocalBlob, retainLocalBlob } from './localBlobStore'
import { validateNotebookRaster, type NotebookAssetReader, type RasterDecoder } from './academics/notebook/visualAssets'
import type { NotebookAssetBinding } from './academics/notebook/visualTypes'
import { rejectDuplicateKeys } from './academics/notebook/package'

const MiB = 1024 * 1024
const limits = { total: 256 * MiB, metadata: 64 * MiB, file: 50 * MiB, members: 2048 }
type ObjectRecord = { kind: 'image' | 'file'; id: string; sha256: string; byteLength: number; mimeType: string }
type Envelope = { format: 'premed-os-workspace-backup'; version: 1; data: AppData; dataSha256: string; objects: ObjectRecord[] }
export type PreparedWorkspaceBackup = { readonly data: AppData; readonly imageCount: number; readonly fileCount: number }
const preparedContent = new WeakMap<PreparedWorkspaceBackup, { envelope: Envelope; bytes: Map<string, Blob>; signature: string }>()
const encode = (value: unknown) => new TextEncoder().encode(JSON.stringify(value))
function bound(size: number, max: number, label: string) { if (!Number.isSafeInteger(size) || size < 0 || size > max) throw new Error(`${label} exceeds the complete-backup limit (${Math.round(max / MiB)} MiB). Nothing was truncated. Export individual notebook backups or split large original files.`) }

export async function createWorkspaceBackup(data: AppData, readers: { images: NotebookAssetReader; file: typeof readLocalBlob } = { images: notebookAssetRepository(), file: readLocalBlob }): Promise<Blob> {
  const snapshot = structuredClone(data), assets = workspaceAssets(snapshot), objects: ObjectRecord[] = []
  if (validateAppData(snapshot).length) throw new Error('The workspace is invalid; no complete backup was created.')
  const members: Record<string, Uint8Array> = Object.create(null)
  let total = 0
  async function add(kind: ObjectRecord['kind'], id: string, blob: Blob | undefined, binding?: NotebookAssetBinding) {
    if (!blob) throw new Error(`The ${kind === 'image' ? 'notebook image' : 'original file'} ${id} is unavailable. Restore its original bytes before creating a complete backup. JSON-only export remains available.`)
    bound(blob.size, limits.file, 'Original file')
    const hash = await binaryDigest(blob)
    if (binding && (hash !== binding.sha256 || blob.size !== binding.byteLength)) throw new Error(`Image ${binding.assetId} does not match its saved original.`)
    const path = `assets/${hash}`
    if (!members[path]) { total += blob.size; bound(total, limits.total, 'Complete backup'); members[path] = new Uint8Array(await blob.arrayBuffer()) }
    objects.push({ kind, id, sha256: hash, byteLength: blob.size, mimeType: binding?.mimeType ?? (blob.type || 'application/octet-stream') })
  }
  for (const [hash, binding] of assets.images) await add('image', hash, await readers.images.read(hash), binding)
  for (const ref of assets.files) await add('file', ref, await readers.file(ref))
  const dataBytes = encode(snapshot)
  const envelope: Envelope = { format: 'premed-os-workspace-backup', version: 1, data: snapshot, dataSha256: await binaryDigest(new Blob([dataBytes])), objects }
  members['workspace.json'] = encode(envelope)
  bound(members['workspace.json'].length, limits.metadata, 'Workspace metadata')
  bound(total + members['workspace.json'].length, limits.total, 'Complete backup')
  if (Object.keys(members).length > limits.members) throw new Error('Too many files for one workspace backup. Export individual notebooks; no files were omitted.')
  const zip = zipSync(members, { level: 0 })
  bound(zip.length, limits.total, 'Complete backup ZIP')
  return new Blob([zip.slice().buffer], { type: 'application/zip' })
}

export async function prepareWorkspaceBackup(blob: Blob, decode?: RasterDecoder): Promise<PreparedWorkspaceBackup> {
  bound(blob.size, limits.total, 'Backup ZIP')
  let total = 0
  const seen = new Set<string>()
  const members = unzipSync(new Uint8Array(await blob.arrayBuffer()), { filter: file => {
    if (seen.has(file.name) || (file.name !== 'workspace.json' && !/^assets\/[a-f0-9]{64}$/.test(file.name))) throw new Error('Backup contains duplicate or unsupported paths. Nothing was restored.')
    seen.add(file.name)
    if (seen.size > limits.members) throw new Error('Backup contains too many files.')
    bound(file.originalSize, file.name === 'workspace.json' ? limits.metadata : limits.file, file.name)
    total += file.originalSize; bound(total, limits.total, 'Expanded backup')
    return true
  } })
  if (!members['workspace.json']) throw new Error('This is not a complete workspace backup. Use the notebook importer for individual notebook ZIPs.')
  const raw = new TextDecoder('utf-8', { fatal: true }).decode(members['workspace.json'])
  rejectDuplicateKeys(raw)
  const envelope = JSON.parse(raw) as Envelope
  if (!envelope || envelope.format !== 'premed-os-workspace-backup' || envelope.version !== 1 || !Array.isArray(envelope.objects) || Object.keys(envelope).some(key => !['format', 'version', 'data', 'dataSha256', 'objects'].includes(key)) || validateAppData(envelope.data).length) throw new Error('Unsupported or malformed workspace backup. Nothing was restored.')
  if (await binaryDigest(new Blob([encode(envelope.data)])) !== envelope.dataSha256) throw new Error('Workspace metadata integrity check failed. Nothing was restored. Select an intact backup or export a new complete copy from the source device.')
  const assets = workspaceAssets(envelope.data), expected = new Set(['workspace.json']), identities = new Set<string>(), bytes = new Map<string, Blob>()
  for (const item of envelope.objects) {
    if (!['image', 'file'].includes(item.kind) || typeof item.id !== 'string' || !/^[a-f0-9]{64}$/.test(item.sha256) || typeof item.mimeType !== 'string') throw new Error('Invalid original-file index.')
    const identity = `${item.kind}:${item.id}`
    if (identities.has(identity)) throw new Error('Duplicate original-file identity.')
    identities.add(identity)
    const binding = item.kind === 'image' ? assets.images.get(item.id) : undefined
    if (item.kind === 'image' ? !binding || binding.sha256 !== item.sha256 || binding.byteLength !== item.byteLength || binding.mimeType !== item.mimeType : !assets.files.has(item.id)) throw new Error('Backup contains an unrelated or mismatched original file.')
    const path = `assets/${item.sha256}`, content = members[path]
    expected.add(path)
    if (!content || content.length !== item.byteLength) throw new Error(`Original file ${item.id} is missing or incomplete.`)
    const original = new Blob([content.slice().buffer], { type: item.mimeType })
    if (await binaryDigest(original) !== item.sha256) throw new Error(`Original file ${item.id} failed its integrity check. Nothing was restored. Select an intact backup or export a new complete copy from the source device.`)
    if (binding) {
      const inspected = await validateNotebookRaster(binding.assetId, original, binding.mimeType, decode)
      if (inspected.binding.width !== binding.width || inspected.binding.height !== binding.height) throw new Error('Notebook image dimensions disagree with its saved binding.')
    }
    bytes.set(identity, original)
  }
  if (identities.size !== assets.images.size + assets.files.size || Object.keys(members).length !== expected.size) throw new Error('Backup has missing originals or unlisted files. Nothing was restored.')
  const prepared = { data: envelope.data, imageCount: assets.images.size, fileCount: assets.files.size }
  preparedContent.set(prepared, { envelope, bytes, signature: JSON.stringify(prepared.data) })
  return prepared
}

/** Stage originals under new local identities, keeping the earlier workspace's bytes intact. */
export async function stageWorkspaceBackup(prepared: PreparedWorkspaceBackup, assertFresh: () => void, writers: { images: NotebookAssetRepository; file: typeof retainLocalBlob } = { images: notebookAssetRepository(), file: retainLocalBlob }) {
  const contents = preparedContent.get(prepared)
  if (!contents || contents.signature !== JSON.stringify(prepared.data)) throw new Error('Backup validation changed. Select and validate the original backup again.')
  const storedBytes = contents.bytes
  const data = structuredClone(prepared.data), refs = new Map<string, string>(), leases: string[] = []
  for (const item of contents.envelope.objects.filter(item => item.kind === 'file')) {
    assertFresh()
    const ref = `idb://academics/restored/${crypto.randomUUID()}`
    await writers.file(ref, contents.bytes.get(`file:${item.id}`)!); assertFresh(); refs.set(item.id, ref)
  }
  async function visit(value: unknown): Promise<void> {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) { for (const item of value) await visit(item); return }
    const record = value as Record<string, unknown>
    if (typeof record.blobRef === 'string' && refs.has(record.blobRef)) record.blobRef = refs.get(record.blobRef)!
    const notebook = record.importedNotebook as { assetLineageId?: string; assetBindings?: NotebookAssetBinding[] } | undefined
    if (notebook?.assetBindings?.length) {
      const id = crypto.randomUUID(), lineageId = crypto.randomUUID(), hashes = [...new Set(notebook.assetBindings.map(b => b.sha256))]
      assertFresh()
      await writers.images.stage({ id, lineageId, createdAt: Date.now(), bindings: notebook.assetBindings, hashes }, new Map(hashes.map(hash => [hash, storedBytes.get(`image:${hash}`)!])))
      assertFresh(); notebook.assetLineageId = lineageId; leases.push(id)
    }
    for (const child of Object.values(record)) await visit(child)
  }
  await visit(data); assertFresh()
  return { data, async finish() { for (const id of leases) await writers.images.finish(id) } }
}
