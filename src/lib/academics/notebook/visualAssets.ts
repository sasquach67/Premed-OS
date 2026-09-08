import { canonical } from './package'
import { notebookCrc32 } from './notebookZip'
import { NOTEBOOK_VISUAL_LIMITS as limits, visualLimit } from './visualLimits'
import { parsePortableNotebook } from './visualPackage'
import type { NotebookAsset, NotebookAssetBinding, PortableNotebookPackage } from './visualTypes'

export type RasterDecoder = (blob: Blob) => Promise<{ width: number; height: number }>
export type NamedNotebookImage = { name: string; blob: Blob }
export type NotebookAssetReader = { read: (sha256: string) => Promise<Blob | undefined> }
export type PreparedNotebookAssets = { readonly packageKey: string; readonly bindings: readonly Readonly<NotebookAssetBinding>[] }
const preparedBytes = new WeakMap<PreparedNotebookAssets, Map<string, Blob>>()
export function getPreparedAssetBytes(prepared: PreparedNotebookAssets): Map<string, Blob> {
  const bytes = preparedBytes.get(prepared)
  if (!bytes) throw new Error('Image validation is no longer available. Select and validate the images again.')
  return new Map(bytes)
}
export function assertRasterDimensions(width: number, height: number) {
  if (width < 1 || height < 1) throw new Error('Image dimensions must be positive.')
  visualLimit(width, limits.imageAxis, 'Image width'); visualLimit(height, limits.imageAxis, 'Image height'); visualLimit(width * height, limits.imagePixels, 'Decoded image pixels')
}
export const decodeNotebookRaster: RasterDecoder = async blob => {
  if (typeof createImageBitmap === 'function') { const image = await createImageBitmap(blob); try { return { width: image.width, height: image.height } } finally { image.close() } }
  if (typeof Image === 'undefined') throw new Error('Actual image decoding is unavailable in this environment. No image was accepted.')
  const url = URL.createObjectURL(blob)
  try { const image = new Image(); image.src = url; await image.decode(); return { width: image.naturalWidth, height: image.naturalHeight } }
  finally { URL.revokeObjectURL(url) }
}
function rasterHeader(bytes: Uint8Array): { mimeType: NotebookAsset['mimeType']; width: number; height: number } {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (bytes.length >= 33 && [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)) {
    let offset = 8, width = 0, height = 0, data = false, ended = false
    while (offset + 12 <= bytes.length) {
      const length = v.getUint32(offset), type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8)), end = offset + 12 + length
      if (end > bytes.length) throw new Error('Truncated PNG chunk.')
      if (notebookCrc32(bytes.subarray(offset + 4, offset + 8 + length)) !== v.getUint32(offset + 8 + length)) throw new Error('PNG chunk checksum failed.')
      if (offset === 8 && (type !== 'IHDR' || length !== 13)) throw new Error('PNG must begin with its dimension header.')
      if (type === 'IHDR') { if (offset !== 8 || length !== 13) throw new Error('Repeated or invalid PNG header.'); width = v.getUint32(offset + 8); height = v.getUint32(offset + 12); assertRasterDimensions(width, height) }
      if (type === 'acTL' || type === 'fcTL' || type === 'fdAT') throw new Error('Animated images are not supported. Supply a reviewed static PNG or JPEG.')
      if (type === 'IDAT') data = true
      if (type === 'IEND') { if (length || end !== bytes.length) throw new Error('PNG has trailing or invalid data.'); ended = true }
      offset = end
    }
    if (!data || !ended || offset !== bytes.length) throw new Error('Incomplete PNG raster.')
    return { mimeType: 'image/png', width, height }
  }
  if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes.at(-2) === 255 && bytes.at(-1) === 217) {
    let offset = 2
    while (offset + 4 <= bytes.length) {
      if (bytes[offset++] !== 255) throw new Error('Invalid JPEG marker.')
      while (bytes[offset] === 255) offset++
      const marker = bytes[offset++]
      if (marker === 0xda || marker === 0xd9) break
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
      if (offset + 2 > bytes.length) break
      const length = v.getUint16(offset)
      if (length < 2 || offset + length > bytes.length) throw new Error('Truncated JPEG segment.')
      if ([0xc0, 0xc1, 0xc2].includes(marker)) {
        if (length < 8) throw new Error('Invalid JPEG frame.')
        const height = v.getUint16(offset + 3), width = v.getUint16(offset + 5); assertRasterDimensions(width, height)
        return { mimeType: 'image/jpeg', width, height }
      }
      offset += length
    }
  }
  throw new Error('Actual bytes are not a supported static PNG or JPEG. Renaming a file is not a conversion.')
}
export async function validateNotebookRaster(assetId: string, blob: Blob, expectedMime: NotebookAsset['mimeType'], decode: RasterDecoder = decodeNotebookRaster): Promise<{ binding: NotebookAssetBinding; blob: Blob }> {
  visualLimit(blob.size, limits.imageBytes, `Image ${assetId} bytes`)
  if (!blob.size) throw new Error(`Image ${assetId} is empty.`)
  const bytes = new Uint8Array(await blob.arrayBuffer()), header = rasterHeader(bytes)
  if (header.mimeType !== expectedMime || (blob.type && blob.type !== expectedMime && blob.type !== 'application/octet-stream')) throw new Error(`Image ${assetId} MIME does not match its actual PNG/JPEG bytes.`)
  const typed = new Blob([bytes], { type: header.mimeType })
  let actual: { width: number; height: number }
  try { actual = await decode(typed) } catch (error) { throw new Error(`Image ${assetId} could not be decoded: ${error instanceof Error ? error.message : 'invalid raster'}`, { cause: error }) }
  assertRasterDimensions(actual.width, actual.height)
  if (actual.width !== header.width || actual.height !== header.height) throw new Error(`Image ${assetId} decoded dimensions disagree with its raster header.`)
  const digest = await crypto.subtle.digest('SHA-256', bytes), sha256 = [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, '0')).join('')
  return { blob: typed, binding: { assetId, sha256, mimeType: expectedMime, byteLength: bytes.length, width: actual.width, height: actual.height } }
}
export function mergeNotebookAssetBindings(before: readonly NotebookAssetBinding[], incoming: readonly NotebookAssetBinding[]): NotebookAssetBinding[] {
  const merged = new Map<string, NotebookAssetBinding>()
  for (const b of [...before, ...incoming]) {
    const old = merged.get(b.assetId)
    if (old && canonical(old) !== canonical(b)) throw new Error(`Image ID ${b.assetId} is already bound to different bytes or raster metadata in this notebook history. Use a new asset ID for a changed image; retain its original.`)
    merged.set(b.assetId, { ...b })
  }
  visualLimit(merged.size, limits.backupAssets, 'Notebook historical asset bindings')
  const blobs = new Map([...merged.values()].map(b => [b.sha256, b.byteLength]))
  visualLimit([...blobs.values()].reduce((sum, n) => sum + n, 0), limits.backupImageBytes, 'Notebook historical image bytes')
  return [...merged.values()]
}
export async function prepareNotebookAssets(pkg: PortableNotebookPackage, files: NamedNotebookImage[], options: { mappedFiles?: ReadonlyMap<string, Blob>; previousBindings?: readonly NotebookAssetBinding[]; reader?: NotebookAssetReader; decode?: RasterDecoder } = {}): Promise<PreparedNotebookAssets> {
  const snapshot = parsePortableNotebook(JSON.stringify(pkg)), mappedFiles = new Map(options.mappedFiles)
  const assets = snapshot.version === 3 ? snapshot.assets : [], names = new Map<string, Blob>(), byId = new Map(assets.map(a => [a.id, a]))
  visualLimit(assets.length, limits.packageAssets, 'Package image count')
  for (const f of files) { if (names.has(f.name)) throw new Error(`Ambiguous duplicate image filename ${f.name}. Map each asset explicitly instead.`); if (!assets.some(a => a.fileName === f.name)) throw new Error(`Image ${f.name} is not declared by this notebook. Nothing was silently ignored.`); names.set(f.name, f.blob) }
  for (const id of mappedFiles.keys()) if (!byId.has(id)) throw new Error(`Mapped image ID ${id} is not declared by this notebook.`)
  const old = new Map((options.previousBindings ?? []).map(b => [b.assetId, { ...b }])), bindings: NotebookAssetBinding[] = [], bytes = new Map<string, Blob>()
  for (const asset of assets) {
    let blob = mappedFiles.get(asset.id)
    if (blob && names.has(asset.fileName) && names.get(asset.fileName) !== blob) throw new Error(`Conflicting filename and explicit mapping for image ${asset.id}. Choose one exact file.`)
    if (!blob && names.has(asset.fileName)) {
      if (assets.filter(a => a.fileName === asset.fileName).length > 1) throw new Error(`Filename ${asset.fileName} belongs to multiple assets. Map those assets explicitly.`)
      blob = names.get(asset.fileName)
    }
    const previous = old.get(asset.id)
    if (!blob && previous && options.reader) blob = await options.reader.read(previous.sha256)
    if (!blob) throw new Error(`Missing image ${asset.id} (${asset.fileName}). Select the exact original file or restore a complete notebook bundle. Nothing was saved.`)
    const validated = await validateNotebookRaster(asset.id, blob, asset.mimeType, options.decode)
    mergeNotebookAssetBindings(previous ? [previous] : [], [validated.binding])
    bindings.push(validated.binding); bytes.set(validated.binding.sha256, validated.blob)
  }
  visualLimit([...bytes.values()].reduce((sum, b) => sum + b.size, 0), limits.packageImageBytes, 'Package actual image bytes')
  const prepared = Object.freeze({ packageKey: canonical(snapshot), bindings: Object.freeze(bindings.map(b => Object.freeze(b))) })
  preparedBytes.set(prepared, bytes)
  return prepared
}

/** Backup closure can span more assets than one package. Every version retains
 * its own 64-image/128-MiB ceiling; the complete union has the larger backup cap. */
export async function prepareNotebookAssetClosure(packages: PortableNotebookPackage[], bindingIndex: readonly NotebookAssetBinding[], blobs: ReadonlyMap<string, Blob>, decode: RasterDecoder = decodeNotebookRaster): Promise<PreparedNotebookAssets> {
  const snapshots = packages.map(p => parsePortableNotebook(JSON.stringify(p))), assets = new Map<string, NotebookAsset>()
  for (const p of snapshots) if (p.version === 3) for (const a of p.assets) {
    if (assets.has(a.id) && assets.get(a.id)!.mimeType !== a.mimeType) throw new Error(`Image ${a.id} changes MIME across notebook history. Use a new image ID.`)
    assets.set(a.id, a)
  }
  const index = new Map(bindingIndex.map(b => [b.assetId, { ...b }]))
  if (index.size !== bindingIndex.length || index.size !== assets.size || [...assets.keys()].some(id => !index.has(id))) throw new Error('The binding index must cover exactly the original, current, historical and pending notebook asset closure.')
  mergeNotebookAssetBindings([], bindingIndex)
  const uniqueHashes = new Set(bindingIndex.map(b => b.sha256))
  if (uniqueHashes.size !== blobs.size || [...uniqueHashes].some(hash => !blobs.has(hash))) throw new Error('The bundle must contain exactly its declared image bytes, without missing or extra files.')
  const verified = new Map<string, Awaited<ReturnType<typeof validateNotebookRaster>>>(), bindings: NotebookAssetBinding[] = [], bytes = new Map<string, Blob>()
  for (const [id, asset] of assets) {
    const expected = index.get(id)!
    let result = verified.get(expected.sha256)
    if (!result) { result = await validateNotebookRaster(id, blobs.get(expected.sha256)!, asset.mimeType, decode); verified.set(expected.sha256, result) }
    const actual = { ...result.binding, assetId: id }
    if (actual.mimeType !== asset.mimeType || canonical(actual) !== canonical(expected)) throw new Error(`Image ${id} does not match its app-owned binding digest, MIME, dimensions or byte count.`)
    bindings.push(actual); bytes.set(actual.sha256, result.blob)
  }
  for (const p of snapshots) if (p.version === 3) {
    const hashes = new Set(p.assets.map(a => index.get(a.id)!.sha256))
    visualLimit([...hashes].reduce((sum, hash) => sum + bytes.get(hash)!.size, 0), limits.packageImageBytes, 'One historical package actual image bytes')
  }
  const prepared = Object.freeze({ packageKey: canonical(snapshots), bindings: Object.freeze(bindings.map(b => Object.freeze(b))) })
  preparedBytes.set(prepared, bytes)
  return prepared
}
