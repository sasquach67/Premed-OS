import { gunzipSync, gzipSync, strFromU8, strToU8 } from 'fflate'

const FORMAT_PREFIX = 'premed-os:workspace:'
export const WORKSPACE_STORAGE_PREFIX = `${FORMAT_PREFIX}gzip:v1:`
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

/** Only the browser-cache encoding changes. The original JSON remains exact. */
export function encodeWorkspaceStorage(value: string): string {
  if (value.startsWith(FORMAT_PREFIX)) {
    decodeWorkspaceStorage(value)
    return value
  }
  if (value.length < COMPRESS_AT) return value
  JSON.parse(value)
  const bytes = strToU8(value)
  if (bytes.length > MAX_DECODED_BYTES) throw new Error('This workspace exceeds the safe browser-cache size. Existing saved data was kept.')
  const compressed = gzipSync(bytes, { level: 1, mtime: 0 })
  const encoded = WORKSPACE_STORAGE_PREFIX + btoa(strFromU8(compressed, true))
  return encoded.length < value.length ? encoded : value
}

/** Old plain JSON is accepted unchanged; bad compressed data is never a seed. */
export function decodeWorkspaceStorage(value: string): string {
  if (!value.startsWith(FORMAT_PREFIX)) return value
  if (!value.startsWith(WORKSPACE_STORAGE_PREFIX)) throw new Error('Unsupported saved workspace encoding. The stored data has not been changed.')
  try {
    const bytes = strToU8(atob(value.slice(WORKSPACE_STORAGE_PREFIX.length)), true)
    if (bytes.length < 18) throw new Error('Incomplete compressed workspace')
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    const size = view.getUint32(bytes.length - 4, true)
    if (size > MAX_DECODED_BYTES) throw new Error('Compressed workspace exceeds the safe decode size')
    const decoded = gunzipSync(bytes, { out: new Uint8Array(size) })
    if (decoded.length !== size || crc32(decoded) !== view.getUint32(bytes.length - 8, true)) throw new Error('Compressed workspace integrity check failed')
    const text = strFromU8(decoded)
    JSON.parse(text)
    return text
  } catch (error) {
    throw new Error('Saved workspace could not be decoded. The stored data has not been changed.', { cause: error })
  }
}
