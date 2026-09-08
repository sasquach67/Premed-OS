import { canonical, rejectDuplicateKeys } from './package'
import { readNotebookZip, writeNotebookZip } from './notebookZip'
import { getPreparedAssetBytes, mergeNotebookAssetBindings, prepareNotebookAssetClosure, type NotebookAssetReader, type PreparedNotebookAssets, type RasterDecoder } from './visualAssets'
import { parsePortableNotebook } from './visualPackage'
import { NOTEBOOK_VISUAL_LIMITS as limits, visualLimit } from './visualLimits'
import type { NotebookAssetBinding, PortableImportedNotebook, PortableNotebookPackage } from './visualTypes'

type BackupEnvelope = { format: 'premed-os-notebook-backup'; version: 2; destinationCourseId: string; notebook: PortableImportedNotebook }
export type PreparedNotebookBundle =
  | { kind: 'package'; raw: string; package: PortableNotebookPackage; assets: PreparedNotebookAssets }
  | { kind: 'backup'; destinationCourseId: string; notebook: PortableImportedNotebook; assets: PreparedNotebookAssets }
const encode = (s: string) => new TextEncoder().encode(s)
const assetPath = (b: NotebookAssetBinding) => `assets/${b.sha256}.${b.mimeType === 'image/png' ? 'png' : 'jpg'}`
function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`)
  return value as Record<string, unknown>
}
function fields(value: Record<string, unknown>, required: string[], optional: string[], label: string) {
  for (const key of required) if (!Object.hasOwn(value, key)) throw new Error(`${label}.${key} is required.`)
  for (const key of Object.keys(value)) if (![...required, ...optional].includes(key)) throw new Error(`${label}.${key} is not a supported backup field; no content was discarded.`)
}
function text(value: unknown, label: string, empty = false) { if (typeof value !== 'string' || (!empty && !value.trim())) throw new Error(`${label} must be ${empty ? '' : 'non-empty '}text.`) }
function timestamp(value: unknown, label: string) { if (!Number.isSafeInteger(value) || (value as number) < 0) throw new Error(`${label} must be a valid saved timestamp.`) }
function progress(value: unknown) {
  for (const [id, entry] of Object.entries(object(value, 'Practice records'))) {
    const record = object(entry, `Practice ${id}`); fields(record, ['response', 'complete'], [], `Practice ${id}`)
    text(record.response, 'Practice response', true); if (typeof record.complete !== 'boolean') throw new Error('Practice completion must be true or false.')
  }
}
function parseJSON(raw: string): unknown {
  visualLimit(encode(raw).length, limits.jsonBytes, 'Notebook JSON bytes')
  let value: unknown
  try { value = JSON.parse(raw) } catch { throw new Error('Bundle JSON is invalid or incomplete.') }
  rejectDuplicateKeys(raw)
  function safe(item: unknown, recordMap = false) {
    if (!item || typeof item !== 'object') return
    // Practice IDs are data keys, and legacy valid IDs can be "constructor".
    // The records themselves are validated to exactly response/complete below.
    for (const [key, child] of Object.entries(item)) { if (!recordMap && ['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error('Reserved object field in notebook backup.'); safe(child, key === 'progress') }
  }
  safe(value); return value
}
function parseBindings(value: unknown): NotebookAssetBinding[] {
  const index = object(value, 'Asset index'); fields(index, ['format', 'version', 'bindings'], [], 'Asset index')
  if (index.format !== 'premed-os-notebook-asset-index' || index.version !== 1 || !Array.isArray(index.bindings)) throw new Error('Unsupported notebook asset index.')
  visualLimit(index.bindings.length, limits.backupAssets, 'Backup asset count')
  for (const input of index.bindings) {
    const b = object(input, 'Asset binding'); fields(b, ['assetId', 'sha256', 'mimeType', 'byteLength', 'width', 'height'], [], 'Asset binding')
    text(b.assetId, 'Asset ID'); if ((b.assetId as string).length > 200 || typeof b.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(b.sha256)) throw new Error('Invalid asset identity or digest.')
    if (!['image/png', 'image/jpeg'].includes(b.mimeType as string)) throw new Error('Only PNG and JPEG bindings are supported.')
    for (const key of ['byteLength', 'width', 'height']) if (!Number.isSafeInteger(b[key]) || (b[key] as number) < 1) throw new Error(`Invalid image ${key}.`)
    visualLimit(b.byteLength as number, limits.imageBytes, 'Bound image bytes'); visualLimit(b.width as number, limits.imageAxis, 'Bound image width'); visualLimit(b.height as number, limits.imageAxis, 'Bound image height'); visualLimit((b.width as number) * (b.height as number), limits.imagePixels, 'Bound image pixels')
  }
  const bindings = index.bindings as NotebookAssetBinding[]
  if (new Set(bindings.map(b => b.assetId)).size !== bindings.length) throw new Error('Duplicate image ID in the binding index.')
  return mergeNotebookAssetBindings([], bindings)
}

export function portableNotebookPackages(n: PortableImportedNotebook): PortableNotebookPackage[] {
  return [n.original, n.current, ...(n.history ?? []).map(h => h.current), ...(n.updateSession ? [n.updateSession.baseline] : []), ...[n.originalRaw, n.acceptedRaw, ...(n.history ?? []).map(h => h.acceptedRaw)].filter((raw): raw is string => raw !== undefined).map(parsePortableNotebook)]
}
/** Validate personal records and every saved/raw version without reconstructing them. */
function validateBackupNotebook(input: unknown): PortableImportedNotebook {
  const value = object(input, 'Notebook backup')
  fields(value, ['original', 'current', 'originalRaw', 'entryId', 'fingerprint', 'importedAt', 'progress', 'notes'], ['editedAt', 'revisedFromLectureId', 'history', 'updateSession', 'acceptedRaw'], 'Notebook backup')
  for (const key of ['originalRaw', 'entryId', 'fingerprint']) text(value[key], key)
  text(value.notes, 'Notebook notes', true); timestamp(value.importedAt, 'Imported time'); progress(value.progress)
  if (value.editedAt !== undefined) timestamp(value.editedAt, 'Edited time')
  for (const key of ['revisedFromLectureId', 'acceptedRaw']) if (value[key] !== undefined) text(value[key], key)
  if (value.history !== undefined) {
    if (!Array.isArray(value.history)) throw new Error('Notebook history must be a list.')
    const ids = new Set<string>()
    for (const item of value.history) {
      const h = object(item, 'History version'); fields(h, ['id', 'savedAt', 'reason', 'current', 'notes', 'progress'], ['acceptedRaw'], 'History version')
      text(h.id, 'History ID'); timestamp(h.savedAt, 'History time'); text(h.notes, 'Historical notes', true); progress(h.progress)
      if (ids.has(h.id as string) || !['edit', 'update', 'restore'].includes(h.reason as string)) throw new Error('Duplicate history identity or unsupported history reason.')
      ids.add(h.id as string); if (h.acceptedRaw !== undefined) text(h.acceptedRaw, 'Historical accepted raw JSON')
    }
  }
  if (value.updateSession !== undefined) {
    const s = object(value.updateSession, 'Update session'); fields(s, ['id', 'localId', 'createdAt', 'baseline'], [], 'Update session')
    text(s.id, 'Update session ID'); text(s.localId, 'Update entry ID'); timestamp(s.createdAt, 'Update created time')
  }
  const n = value as PortableImportedNotebook
  const packages = portableNotebookPackages(n).map(p => parsePortableNotebook(JSON.stringify(p)))
  if (canonical(parsePortableNotebook(n.originalRaw)) !== canonical(n.original)) throw new Error('Original JSON bytes do not match the retained original package. Nothing was restored.')
  const originalEntry = n.original.entries.find(e => e.id === n.entryId)
  if (!originalEntry) throw new Error('The original package does not contain this notebook identity.')
  for (const p of packages) {
    const e = p.entries.find(e => e.id === n.entryId)
    if (!e || e.goal !== originalEntry.goal || canonical(p.course) !== canonical(n.original.course)) throw new Error('A saved notebook version or raw proposal changes the notebook identity, course or goal.')
  }
  return n
}

function backupEnvelope(n: PortableImportedNotebook, destinationCourseId: string): BackupEnvelope {
  // Local lineage and byte lookup keys must never travel as author JSON. Bindings
  // are a separate, app-owned file and get a fresh local lineage on explicit restore.
  const { assetBindings: _bindings, assetLineageId: _lineage, ...portable } = n
  return { format: 'premed-os-notebook-backup', version: 2, destinationCourseId, notebook: portable }
}
export function assertNotebookBackupFits(n: PortableImportedNotebook, destinationCourseId: string): void {
  const envelope = backupEnvelope(n, destinationCourseId), raw = JSON.stringify(envelope)
  validateBackupNotebook(envelope.notebook)
  const bindings = parseBindings({ format: 'premed-os-notebook-asset-index', version: 1, bindings: n.assetBindings ?? [] })
  const ids = new Set(portableNotebookPackages(n).flatMap(p => p.version === 3 ? p.assets.map(a => a.id) : []))
  if (ids.size !== bindings.length || bindings.some(b => !ids.has(b.assetId))) throw new Error('The prospective full backup has missing or unrelated asset bindings. Previous content and history were kept.')
  const indexBytes = encode(JSON.stringify({ format: 'premed-os-notebook-asset-index', version: 1, bindings })).length
  visualLimit(encode(raw).length + indexBytes, limits.jsonBytes, 'Full original/current/history/update backup JSON bytes')
}
async function collectBytes(bindings: readonly NotebookAssetBinding[], reader: NotebookAssetReader): Promise<Map<string, Blob>> {
  const bytes = new Map<string, Blob>()
  for (const b of bindings) if (!bytes.has(b.sha256)) { const blob = await reader.read(b.sha256); if (!blob) throw new Error(`Image ${b.assetId} is unavailable on this device. Restore its image files before exporting a complete backup. JSON-only export does not include images.`); bytes.set(b.sha256, blob) }
  return bytes
}
function makeBundle(raw: string, prepared: PreparedNotebookAssets): Blob {
  const bindings = prepared.bindings.map(b => ({ ...b })), bytes = getPreparedAssetBytes(prepared)
  const members = new Map<string, Uint8Array>([['notebook.json', encode(raw)], ['bindings.json', encode(JSON.stringify({ format: 'premed-os-notebook-asset-index', version: 1, bindings }))]])
  // Blob arrayBuffer is asynchronous, so this helper intentionally only provides
  // metadata; the caller uses the asynchronous encoder below for actual byte files.
  if (bytes.size) throw new Error('Use the asynchronous image bundle encoder.')
  return writeNotebookZip(members)
}
async function encodeBundle(raw: string, prepared: PreparedNotebookAssets): Promise<Blob> {
  if (!prepared.bindings.length) return makeBundle(raw, prepared)
  const bindings = prepared.bindings.map(b => ({ ...b })), bytes = getPreparedAssetBytes(prepared)
  const members = new Map<string, Uint8Array>([['notebook.json', encode(raw)], ['bindings.json', encode(JSON.stringify({ format: 'premed-os-notebook-asset-index', version: 1, bindings }))]])
  for (const b of bindings) if (!members.has(assetPath(b))) members.set(assetPath(b), new Uint8Array(await bytes.get(b.sha256)!.arrayBuffer()))
  return writeNotebookZip(members)
}
export async function exportNotebookPackageBundle(raw: string, bindings: readonly NotebookAssetBinding[], reader: NotebookAssetReader, decode?: RasterDecoder): Promise<Blob> {
  const pkg = parsePortableNotebook(raw), wanted = new Set(pkg.version === 3 ? pkg.assets.map(a => a.id) : [])
  const selected = bindings.filter(b => wanted.has(b.assetId)), prepared = await prepareNotebookAssetClosure([pkg], selected, await collectBytes(selected, reader), decode)
  return encodeBundle(raw, prepared)
}
export async function exportNotebookBackupBundle(notebook: PortableImportedNotebook, destinationCourseId: string, reader: NotebookAssetReader, decode?: RasterDecoder): Promise<Blob> {
  const snapshot = JSON.parse(JSON.stringify(notebook)) as PortableImportedNotebook
  assertNotebookBackupFits(snapshot, destinationCourseId)
  const bindings = snapshot.assetBindings ?? [], prepared = await prepareNotebookAssetClosure(portableNotebookPackages(snapshot), bindings, await collectBytes(bindings, reader), decode)
  return encodeBundle(JSON.stringify(backupEnvelope(snapshot, destinationCourseId)), prepared)
}
export async function prepareNotebookBundle(blob: Blob, decode?: RasterDecoder): Promise<PreparedNotebookBundle> {
  const members = await readNotebookZip(blob), rawBytes = members.get('notebook.json'), indexBytes = members.get('bindings.json')
  if (!rawBytes || !indexBytes) throw new Error('The bundle needs notebook.json and its app-owned bindings.json.')
  const decoder = new TextDecoder('utf-8', { fatal: true }), raw = decoder.decode(rawBytes), data = parseJSON(raw)
  const bindings = parseBindings(parseJSON(decoder.decode(indexBytes))), expected = new Set(['notebook.json', 'bindings.json', ...bindings.map(assetPath)])
  if (expected.size !== members.size || [...expected].some(name => !members.has(name))) throw new Error('Bundle members do not exactly match the closed asset index. Missing and undeclared images are not accepted.')
  const bytes = new Map<string, Blob>()
  for (const b of bindings) bytes.set(b.sha256, new Blob([members.get(assetPath(b))!.slice().buffer], { type: b.mimeType }))
  if (object(data, 'Notebook').format === 'premed-os-notebook-backup') {
    const envelope = object(data, 'Backup'); fields(envelope, ['format', 'version', 'destinationCourseId', 'notebook'], [], 'Backup')
    if (envelope.version !== 2) throw new Error('This is not a complete visual backup. Older JSON-only backups must be imported through their explicit legacy path.')
    text(envelope.destinationCourseId, 'Original destination class')
    const n = validateBackupNotebook(envelope.notebook), assets = await prepareNotebookAssetClosure(portableNotebookPackages(n), bindings, bytes, decode)
    return { kind: 'backup', destinationCourseId: envelope.destinationCourseId as string, notebook: { ...n, assetBindings: assets.bindings.map(b => ({ ...b })) }, assets }
  }
  const pkg = parsePortableNotebook(raw), assets = await prepareNotebookAssetClosure([pkg], bindings, bytes, decode)
  return { kind: 'package', raw, package: pkg, assets }
}
