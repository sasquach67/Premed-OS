import { readFileSync } from 'node:fs'
import visual from './visual-fixtures/valid-v3-figure-diagram.json'
import plain from './visual-fixtures/valid-v3-no-images.json'
import { canonical } from './package'
import { notebookCrc32 } from './notebookZip'
import type { NotebookAssetLease, NotebookAssetRepository } from './notebookAssetStore'
import type { RasterDecoder } from './visualAssets'
import type { NotebookAssetBinding, VisualNotebookPackage } from './visualTypes'

export const visualFixture = () => structuredClone(visual) as VisualNotebookPackage
export const plainVisualFixture = () => structuredClone(plain) as VisualNotebookPackage
export const pngBytes = () => new Uint8Array(readFileSync(new URL('./visual-fixtures/question.png', import.meta.url)))
export const pngBlob = () => new Blob([pngBytes()], { type: 'image/png' })
/** Unit-test seam only. Actual browser decoding/reload must be proved in UI QA. */
export const headerDecoder: RasterDecoder = async blob => { const view = new DataView(await blob.arrayBuffer()); return { width: view.getUint32(16), height: view.getUint32(20) } }
export function changedPngBlob() {
  const original = pngBytes(), data = new TextEncoder().encode('Test\0Distinct bytes, same authored pixels'), chunk = new Uint8Array(data.length + 12), view = new DataView(chunk.buffer)
  view.setUint32(0, data.length); chunk.set(new TextEncoder().encode('tEXt'), 4); chunk.set(data, 8); view.setUint32(8 + data.length, notebookCrc32(chunk.subarray(4, 8 + data.length)))
  return new Blob([original.subarray(0, original.length - 12), chunk, original.subarray(original.length - 12)], { type: 'image/png' })
}
export class MemoryNotebookAssets implements NotebookAssetRepository {
  bytes = new Map<string, Blob>()
  bindings = new Map<string, NotebookAssetBinding>()
  leases = new Map<string, NotebookAssetLease>()
  failStage = false
  failFinish = false
  afterStage?: () => void
  async read(hash: string) { return this.bytes.get(hash) }
  async stage(lease: NotebookAssetLease, bytes: ReadonlyMap<string, Blob>) {
    if (this.failStage) throw new Error('Simulated quota failure')
    for (const b of lease.bindings) { const old = this.bindings.get(JSON.stringify([lease.lineageId, b.assetId])); if (old && canonical(old) !== canonical(b)) throw new Error('Immutable binding conflict') }
    for (const b of lease.bindings) this.bindings.set(JSON.stringify([lease.lineageId, b.assetId]), { ...b })
    for (const [hash, blob] of bytes) this.bytes.set(hash, blob)
    this.leases.set(lease.id, structuredClone(lease)); this.afterStage?.()
  }
  async finish(id: string) { if (this.failFinish) throw new Error('Simulated journal cleanup failure'); this.leases.delete(id) }
  async journals() { return [...this.leases.values()].map(l => structuredClone(l)) }
}
