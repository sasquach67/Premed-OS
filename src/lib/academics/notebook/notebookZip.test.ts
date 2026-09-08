// @vitest-environment node
import { deflateRawSync } from 'node:zlib'
import { expect, it } from 'vitest'
import { notebookCrc32, readNotebookZip, writeNotebookZip } from './notebookZip'

const encode = (s: string) => new TextEncoder().encode(s)
function authoredZip(body: Uint8Array, method: 0 | 8, descriptor = false, declaredSize = body.length) {
  const name = encode('notebook.json'), data = method === 8 ? new Uint8Array(deflateRawSync(body)) : body, crc = notebookCrc32(body), flags = 0x800 | (descriptor ? 8 : 0)
  const local = new Uint8Array(30 + name.length), lv = new DataView(local.buffer)
  lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, flags, true); lv.setUint16(8, method, true); lv.setUint16(26, name.length, true); local.set(name, 30)
  if (!descriptor) { lv.setUint32(14, crc, true); lv.setUint32(18, data.length, true); lv.setUint32(22, declaredSize, true) }
  const desc = new Uint8Array(descriptor ? 16 : 0)
  if (descriptor) { const d = new DataView(desc.buffer); d.setUint32(0, 0x08074b50, true); d.setUint32(4, crc, true); d.setUint32(8, data.length, true); d.setUint32(12, declaredSize, true) }
  const central = new Uint8Array(46 + name.length), cv = new DataView(central.buffer)
  cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, flags, true); cv.setUint16(10, method, true); cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true); cv.setUint32(24, declaredSize, true); cv.setUint16(28, name.length, true); central.set(name, 46)
  const end = new Uint8Array(22), ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, 1, true); ev.setUint16(10, 1, true); ev.setUint32(12, central.length, true); ev.setUint32(16, local.length + data.length + desc.length, true)
  return new Blob([local, new Uint8Array(data).buffer, desc, central, end])
}
it.each([[0, false], [0, true], [8, false], [8, true]] as const)('reads bounded method %i with descriptor %s', async (method, descriptor) => {
  const body = encode('Authored ZIP body '.repeat(50)), result = await readNotebookZip(authoredZip(body, method, descriptor))
  expect(result.get('notebook.json')).toEqual(body)
})
it('stops a compressed member expanding beyond its declared size', async () => {
  await expect(readNotebookZip(authoredZip(encode('x'.repeat(100_000)), 8, false, 1))).rejects.toThrow('expands beyond')
})
it('rejects malformed/truncated ZIP files and refuses arbitrary paths before writing', async () => {
  await expect(readNotebookZip(new Blob(['not a zip']))).rejects.toThrow('end record')
  const zip = writeNotebookZip(new Map([['notebook.json', encode('{}')]]))
  await expect(readNotebookZip(zip.slice(0, zip.size - 5))).rejects.toThrow('end record')
  expect(() => writeNotebookZip(new Map([['../outside.png', new Uint8Array([1])]]))).toThrow('Unexpected ZIP member')
  expect(() => writeNotebookZip(new Map([['https://example.invalid/a.png', new Uint8Array([1])]]))).toThrow('Unexpected ZIP member')
})
it('rejects damaged bytes even when all lengths and names still close', async () => {
  const zip = writeNotebookZip(new Map([['notebook.json', encode('{"text":"original"}')]])), bytes = new Uint8Array(await zip.arrayBuffer())
  bytes[30 + encode('notebook.json').length + 2] ^= 1
  await expect(readNotebookZip(new Blob([bytes]))).rejects.toThrow('checksum')
})
it('rejects duplicate central names and linked archive members', async () => {
  const zip = writeNotebookZip(new Map([['notebook.json', encode('{}')], ['bindings.json', encode('{}')]])), original = new Uint8Array(await zip.arrayBuffer())
  const positions: number[] = [], view = new DataView(original.buffer)
  for (let i = 0; i < original.length - 4; i++) if (view.getUint32(i, true) === 0x02014b50) positions.push(i)
  const duplicate = original.slice(); duplicate.set(encode('notebook.json'), positions[1] + 46)
  await expect(readNotebookZip(new Blob([duplicate]))).rejects.toThrow('Ambiguous duplicate')
  const linked = original.slice(); new DataView(linked.buffer).setUint32(positions[0] + 38, 0xa000 << 16, true)
  await expect(readNotebookZip(new Blob([linked]))).rejects.toThrow('linked')
})
