import { gunzipSync, gzipSync, strFromU8, strToU8 } from 'fflate'

const FORMAT_PREFIX = 'premed-os:workspace:'
export const WORKSPACE_STORAGE_PREFIX = `${FORMAT_PREFIX}gzip:v1:`
export const WORKSPACE_CHUNKS_PREFIX = `${FORMAT_PREFIX}chunks:v1:`
const COMPRESS_AT = 256 * 1024
const MAX_DECODED_BYTES = 64 * 1024 * 1024

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, value) => {
  let crc = value
  for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
  return crc >>> 0
})

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff]
  return (crc ^ 0xffffffff) >>> 0
}

// Content-defined boundaries let identical source/history passages share chunks
// even when they occur far apart or have different surrounding JSON. Equality
// is checked on the full string; the rolling hash selects boundaries only.
const GEAR = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index + 1
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b)
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b)
  return (value ^ (value >>> 16)) >>> 0
})
function packChunks(value: string): string {
  const dictionary: string[] = [], order: number[] = [], known = new Map<string, number>()
  let start = 0, hash = 0
  for (let end = 1; end <= value.length; end++) {
    const code = value.charCodeAt(end - 1)
    hash = ((hash << 1) + GEAR[(code ^ (code >>> 8)) & 255]) >>> 0
    const length = end - start
    if (end !== value.length && (length < 1024 || (length < 8192 && (hash & 4095) !== 0))) continue
    const chunk = value.slice(start, end)
    let index = known.get(chunk)
    if (index === undefined) { index = dictionary.length; dictionary.push(chunk); known.set(chunk, index) }
    order.push(index); start = end; hash = 0
  }
  return JSON.stringify([value.length, dictionary, order])
}

function unpackChunks(packed: string): string {
  const envelope: unknown = JSON.parse(packed)
  if (!Array.isArray(envelope) || envelope.length !== 3) throw new Error('Invalid chunk envelope')
  const [length, dictionary, order] = envelope
  if (!Number.isSafeInteger(length) || length < 0 || length > MAX_DECODED_BYTES || !Array.isArray(dictionary) || !Array.isArray(order)
    || order.length > Math.ceil(MAX_DECODED_BYTES / 1024) || dictionary.length > order.length
    || dictionary.some(chunk => typeof chunk !== 'string' || !chunk.length || chunk.length > 8192)) throw new Error('Invalid chunk dictionary')
  let expanded = 0
  const chunks: string[] = []
  for (const index of order) {
    if (!Number.isSafeInteger(index) || index < 0 || index >= dictionary.length) throw new Error('Invalid chunk reference')
    expanded += dictionary[index].length
    if (expanded > length) throw new Error('Chunk expansion exceeds declared length')
    chunks.push(dictionary[index])
  }
  if (expanded !== length) throw new Error('Incomplete chunk workspace')
  const value = chunks.join('')
  if (strToU8(value).length > MAX_DECODED_BYTES) throw new Error('Chunk workspace exceeds safe decode size')
  return value
}

function gzipText(value: string, prefix: string): string {
  return prefix + btoa(strFromU8(gzipSync(strToU8(value), { level: 1, mtime: 0 }), true))
}

/** Only the browser-cache encoding changes. The original JSON remains exact. */
export function encodeWorkspaceStorage(value: string, options: { deduplicate?: boolean } = {}): string {
  if (value.startsWith(FORMAT_PREFIX)) {
    decodeWorkspaceStorage(value)
    return value
  }
  if (value.length < COMPRESS_AT) return value
  JSON.parse(value)
  const bytes = strToU8(value)
  if (bytes.length > MAX_DECODED_BYTES) throw new Error('This workspace exceeds the safe browser-cache size. Existing saved data was kept.')
  const encoded = gzipText(value, WORKSPACE_STORAGE_PREFIX)
  // JSON-stringifying the chunk envelope also preserves literal unpaired UTF-16
  // surrogates, which a direct UTF-8 gzip conversion cannot represent exactly.
  let best = strFromU8(bytes) === value && encoded.length < value.length ? encoded : value
  // Candidate capacity format: production writes stay on legacy gzip until an
  // explicit cutover can retire old tabs and retain a durable recovery snapshot.
  if (!options.deduplicate) return best
  if (best !== value && best.length < 64 * 1024) return best
  const packed = packChunks(value)
  if (strToU8(packed).length <= MAX_DECODED_BYTES) {
    const deduplicated = gzipText(packed, WORKSPACE_CHUNKS_PREFIX)
    if (deduplicated.length < best.length) best = deduplicated
  }
  return best
}

/** Old plain JSON is accepted unchanged; bad compressed data is never a seed. */
export function decodeWorkspaceStorage(value: string): string {
  if (!value.startsWith(FORMAT_PREFIX)) return value
  const prefix = value.startsWith(WORKSPACE_STORAGE_PREFIX) ? WORKSPACE_STORAGE_PREFIX : value.startsWith(WORKSPACE_CHUNKS_PREFIX) ? WORKSPACE_CHUNKS_PREFIX : null
  if (!prefix) throw new Error('Unsupported saved workspace encoding. The stored data has not been changed.')
  try {
    const bytes = strToU8(atob(value.slice(prefix.length)), true)
    if (bytes.length < 18) throw new Error('Incomplete compressed workspace')
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    const size = view.getUint32(bytes.length - 4, true)
    if (size > MAX_DECODED_BYTES) throw new Error('Compressed workspace exceeds the safe decode size')
    const decoded = gunzipSync(bytes, { out: new Uint8Array(size) })
    if (decoded.length !== size || crc32(decoded) !== view.getUint32(bytes.length - 8, true)) throw new Error('Compressed workspace integrity check failed')
    const text = prefix === WORKSPACE_CHUNKS_PREFIX ? unpackChunks(strFromU8(decoded)) : strFromU8(decoded)
    JSON.parse(text)
    return text
  } catch (error) {
    throw new Error('Saved workspace could not be decoded. The stored data has not been changed.', { cause: error })
  }
}
