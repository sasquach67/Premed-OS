import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NotebookAssetsProvider, NotebookFigure } from './NotebookVisuals'
import { visualFixture } from '@/lib/academics/notebook/visual.test-fixtures'
import type { NotebookFigureBlock } from '@/lib/academics/notebook/visualTypes'

// This seam exercises dialog lifecycle only, not native image decoding/layout.
const fixture = vi.hoisted(() => ({ binding: { assetId: 'figure-task', sha256: '0'.repeat(64), mimeType: 'image/png' as const, byteLength: 1, width: 358, height: 266 } }))
vi.mock('@/lib/academics/notebook/notebookAssetStore', () => ({ notebookAssetRepository: () => ({ read: async () => new Blob(['x']) }) }))
vi.mock('@/lib/academics/notebook/visualAssets', () => ({ getPreparedAssetBytes: () => new Map(), validateNotebookRaster: async (_id: string, blob: Blob) => ({ binding: fixture.binding, blob }) }))
let root: Root, host: HTMLDivElement
let showDescriptor: PropertyDescriptor | undefined, closeDescriptor: PropertyDescriptor | undefined
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  host = document.createElement('div'); host.style.overflow = 'auto'; document.body.append(host); root = createRoot(host)
  vi.stubGlobal('scrollTo', vi.fn()); vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:dialog-unit-fixture'), revokeObjectURL: vi.fn() }))
  showDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal'); closeDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) { this.open = true; this.querySelector<HTMLButtonElement>('button')?.focus() } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event('close')) } })
})
afterEach(async () => {
  await act(async () => root.unmount()); host.remove()
  if (showDescriptor) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', showDescriptor); else delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal
  if (closeDescriptor) Object.defineProperty(HTMLDialogElement.prototype, 'close', closeDescriptor); else delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close
  vi.restoreAllMocks(); vi.unstubAllGlobals()
})
async function renderFigure(context = 'A meaningful source explanation.') {
  const pkg = visualFixture(), block = pkg.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'figure') as NotebookFigureBlock
  block.context = context
  await act(async () => root.render(<NotebookAssetsProvider pkg={pkg} bindings={[fixture.binding]}><NotebookFigure block={block} /></NotebookAssetsProvider>))
  await vi.waitFor(async () => { await act(async () => {}); expect(host.querySelector('.nbr-figure-open')).toBeTruthy() })
  return { block, opener: host.querySelector<HTMLButtonElement>('.nbr-figure-open')!, modal: host.querySelector<HTMLDialogElement>('dialog')! }
}
it('locks scrolling while open and restores the originating button and scroll on close', async () => {
  const { opener, modal } = await renderFigure(); host.scrollTop = 42; host.scrollLeft = 3
  await act(async () => opener.click())
  expect(modal.open).toBe(true); expect(document.activeElement).toBe(modal.querySelector('button')); expect(host.style.overflow).toBe('hidden')
  expect(modal.getAttribute('aria-label')).toBe('Enlarged source figure'); expect(modal.querySelector('header button')?.textContent).toBe('Close figure')
  host.scrollTop = 7
  await act(async () => modal.querySelector<HTMLButtonElement>('button')!.click())
  expect(modal.open).toBe(false); expect(host.style.overflow).toBe('auto'); expect(host.scrollTop).toBe(42); expect(host.scrollLeft).toBe(3)
  expect(document.activeElement).toBe(opener)
})
it('keeps long caption/context and original alternative text in the scrollable modal description', async () => {
  const context = 'Full explanation remains available. '.repeat(100), { block, opener, modal } = await renderFigure(context)
  await act(async () => opener.click())
  expect(modal.querySelector('img')?.alt).toBe(block.alt)
  expect(modal.querySelector('.nbr-figure-description')?.textContent).toContain(context)
  expect(modal.querySelector('.nbr-figure-description')?.getAttribute('tabindex')).toBe('0')
  await act(async () => modal.close()); expect(document.activeElement).toBe(opener)
})
it('cleans up scroll locks if an open figure is unmounted', async () => {
  const { opener } = await renderFigure(); await act(async () => opener.click())
  expect(document.documentElement.style.overflow).toBe('hidden')
  await act(async () => root.render(<p>Another view</p>))
  expect(host.style.overflow).toBe('auto'); expect(document.documentElement.style.overflow).not.toBe('hidden')
})
it.each([false, true])('wraps Tab focus inside the open dialog (backward: %s)', async shiftKey => {
  const { opener, modal } = await renderFigure(); await act(async () => opener.click())
  const close = modal.querySelector<HTMLButtonElement>('button')!, caption = modal.querySelector<HTMLDivElement>('.nbr-figure-description')!
  const start = shiftKey ? close : caption, end = shiftKey ? caption : close
  start.focus()
  const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true })
  await act(async () => start.dispatchEvent(event))
  expect(event.defaultPrevented).toBe(true); expect(document.activeElement).toBe(end); expect(modal.contains(document.activeElement)).toBe(true)
})
it('leaves ordinary forward Tab from the first control to native keyboard navigation', async () => {
  const { opener, modal } = await renderFigure(); await act(async () => opener.click())
  const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
  await act(async () => modal.querySelector('button')!.dispatchEvent(event))
  expect(event.defaultPrevented).toBe(false)
})
