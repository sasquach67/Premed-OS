import { NOTEBOOK_VISUAL_LIMITS as limits, visualLimit } from './visualLimits'
import { assertNotebookRelativePath } from './notebookFiles'

const encoder = new TextEncoder(), decoder = new TextDecoder('utf-8', { fatal: true })
const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) { let value = i; for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1; crcTable[i] = value }
export function notebookCrc32(bytes: Uint8Array): number { let crc = 0xffffffff; for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8); return (crc ^ 0xffffffff) >>> 0 }
function memberLimit(name: string, collection = false): number {
  if (collection) { assertNotebookRelativePath(name, name.endsWith('/')); return name.endsWith('/') ? 0 : /\.json$/i.test(name) ? limits.jsonBytes : limits.imageBytes }
  if (name === 'notebook.json' || name === 'bindings.json') return limits.jsonBytes
  if (/^assets\/[a-f0-9]{64}\.(png|jpg)$/.test(name)) return limits.imageBytes
  throw new Error(`Unexpected ZIP member ${name}. Use a notebook bundle exported by this app, or import the notebook JSON with its explicitly mapped PNG/JPEG files. Paths, URLs and unrelated members are not accepted.`)
}
function requireRange(view: DataView, start: number, length: number) {
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(length) || start < 0 || length < 0 || start + length > view.byteLength) throw new Error('Truncated or invalid ZIP bounds. Nothing was imported.')
}
/** PNG/JPEG are already compressed. Stored members avoid recompression and ZIP64. */
export function writeNotebookZip(members: Map<string, Uint8Array>): Blob {
  visualLimit(members.size, limits.zipMembers, 'ZIP member count')
  const parts: BlobPart[] = [], central: BlobPart[] = []; let offset = 0, centralBytes = 0, inflated = 0, jsonBytes = 0
  for (const [name, bytes] of members) {
    visualLimit(bytes.length, memberLimit(name), `${name} decoded bytes`)
    inflated += bytes.length; if (name.endsWith('.json')) jsonBytes += bytes.length
    const encoded = encoder.encode(name), crc = notebookCrc32(bytes)
    const local = new Uint8Array(30 + encoded.length), lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x800, true)
    lv.setUint32(14, crc, true); lv.setUint32(18, bytes.length, true); lv.setUint32(22, bytes.length, true); lv.setUint16(26, encoded.length, true); local.set(encoded, 30)
    const header = new Uint8Array(46 + encoded.length), cv = new DataView(header.buffer)
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x800, true)
    cv.setUint32(16, crc, true); cv.setUint32(20, bytes.length, true); cv.setUint32(24, bytes.length, true); cv.setUint16(28, encoded.length, true); cv.setUint32(42, offset, true); header.set(encoded, 46)
    parts.push(local, bytes.slice().buffer); central.push(header); offset += local.length + bytes.length; centralBytes += header.length
  }
  visualLimit(inflated, limits.inflatedBytes, 'ZIP total decoded bytes'); visualLimit(jsonBytes, limits.jsonBytes, 'Combined notebook and binding JSON bytes')
  const end = new Uint8Array(22), ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, members.size, true); ev.setUint16(10, members.size, true); ev.setUint32(12, centralBytes, true); ev.setUint32(16, offset, true)
  return new Blob([...parts, ...central, end], { type: 'application/zip' })
}

type ZipMember = { name: string; method: number; flags: number; crc: number; compressed: number; decoded: number; offset: number; data: number; end: number }
/** Central directory is bounded before any decompression; streamed output is bounded again. */
export async function readNotebookZip(blob: Blob, options: { collection?: boolean } = {}): Promise<Map<string, Uint8Array>> {
  visualLimit(blob.size, limits.zipInputBytes, 'ZIP input bytes')
  const bytes = new Uint8Array(await blob.arrayBuffer()), view = new DataView(bytes.buffer)
  let end = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === bytes.length) { end = i; break }
  if (end < 0) throw new Error('The complete ZIP end record is missing.')
  if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true) || view.getUint16(end + 8, true) !== view.getUint16(end + 10, true)) throw new Error('Multi-disk ZIP files are not supported.')
  const count = view.getUint16(end + 10, true), size = view.getUint32(end + 12, true), start = view.getUint32(end + 16, true)
  visualLimit(count, limits.zipMembers, 'ZIP member count'); requireRange(view, start, size)
  if (start + size !== end) throw new Error('ZIP64, hidden directory records or inconsistent ZIP bounds are not supported.')
  const members: ZipMember[] = [], names = new Set<string>(); let cursor = start, total = 0, jsonTotal = 0
  for (let i = 0; i < count; i++) {
    requireRange(view, cursor, 46)
    if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error('Invalid ZIP directory entry.')
    const flags = view.getUint16(cursor + 8, true), method = view.getUint16(cursor + 10, true), crc = view.getUint32(cursor + 16, true)
    const compressed = view.getUint32(cursor + 20, true), decoded = view.getUint32(cursor + 24, true), nameSize = view.getUint16(cursor + 28, true), extra = view.getUint16(cursor + 30, true), comment = view.getUint16(cursor + 32, true)
    const mode = view.getUint32(cursor + 38, true) >>> 16, offset = view.getUint32(cursor + 42, true)
    requireRange(view, cursor + 46, nameSize + extra + comment)
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameSize))
    if (names.has(name)) throw new Error(`Ambiguous duplicate ZIP member ${name}.`)
    names.add(name); visualLimit(decoded, memberLimit(name, options.collection), `${name} declared decoded bytes`)
    const directory = Boolean(options.collection && name.endsWith('/')), fileMode = mode & 0xf000
    if (flags & ~0x80e || ![0, 8].includes(method) || view.getUint16(cursor + 34, true) || (fileMode && fileMode !== (directory ? 0x4000 : 0x8000))) throw new Error('Encrypted, linked, directory or unsupported ZIP entries are not accepted.')
    if (method === 0 && compressed !== decoded) throw new Error('Stored ZIP member sizes disagree.')
    total += decoded; if (/\.json$/i.test(name)) jsonTotal += decoded
    visualLimit(total, limits.inflatedBytes, 'ZIP declared total decoded bytes'); visualLimit(jsonTotal, limits.jsonBytes, 'Combined notebook and binding JSON bytes')
    requireRange(view, offset, 30)
    if (view.getUint32(offset, true) !== 0x04034b50 || view.getUint16(offset + 6, true) !== flags || view.getUint16(offset + 8, true) !== method) throw new Error('ZIP local and central headers disagree.')
    const localName = view.getUint16(offset + 26, true), localExtra = view.getUint16(offset + 28, true), data = offset + 30 + localName + localExtra
    requireRange(view, offset + 30, localName + localExtra)
    if (decoder.decode(bytes.subarray(offset + 30, offset + 30 + localName)) !== name) throw new Error('ZIP member names disagree.')
    requireRange(view, data, compressed)
    let memberEnd = data + compressed
    if (flags & 8) {
      requireRange(view, memberEnd, 12)
      if (view.getUint32(memberEnd, true) === 0x08074b50) memberEnd += 4
      requireRange(view, memberEnd, 12)
      if (view.getUint32(memberEnd, true) !== crc || view.getUint32(memberEnd + 4, true) !== compressed || view.getUint32(memberEnd + 8, true) !== decoded) throw new Error('ZIP data descriptor disagrees with the directory.')
      memberEnd += 12
    } else if (view.getUint32(offset + 14, true) !== crc || view.getUint32(offset + 18, true) !== compressed || view.getUint32(offset + 22, true) !== decoded) throw new Error('ZIP member size or checksum headers disagree.')
    members.push({ name, method, flags, crc, compressed, decoded, offset, data, end: memberEnd }); cursor += 46 + nameSize + extra + comment
  }
  if (cursor !== end) throw new Error('ZIP directory contains undeclared records.')
  let boundary = 0
  for (const m of [...members].sort((a, b) => a.offset - b.offset)) { if (m.offset !== boundary) throw new Error('Overlapping ZIP members or hidden ZIP data are not accepted.'); boundary = m.end }
  if (boundary !== start) throw new Error('ZIP data does not close exactly to its declared directory.')
  const result = new Map<string, Uint8Array>(); let actualTotal = 0
  for (const member of members) {
    let output: Uint8Array
    if (member.method === 0) output = bytes.slice(member.data, member.data + member.compressed)
    else {
      if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot decode compressed bundles. Re-export a stored notebook bundle or import JSON with its images.')
      const reader = blob.slice(member.data, member.data + member.compressed).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader()
      output = new Uint8Array(member.decoded); let written = 0
      try {
        while (true) {
          const chunk = await reader.read(); if (chunk.done) break
          if (written + chunk.value.length > member.decoded) throw new Error(`ZIP member ${member.name} expands beyond its declared size. Decompression stopped.`)
          output.set(chunk.value, written); written += chunk.value.length
        }
        if (written !== member.decoded) throw new Error(`ZIP member ${member.name} is incomplete.`)
      } catch (error) { await reader.cancel().catch(() => undefined); throw error }
      finally { reader.releaseLock() }
    }
    actualTotal += output.length; visualLimit(actualTotal, limits.inflatedBytes, 'ZIP actual decoded bytes')
    if (output.length !== member.decoded || notebookCrc32(output) !== member.crc) throw new Error(`ZIP member ${member.name} failed its size or checksum check.`)
    if (!member.name.endsWith('/')) result.set(member.name, output)
  }
  return result
}
