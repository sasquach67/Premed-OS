import { Blob as NodeBlob } from 'node:buffer'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { FolderPdfPreview } from './FolderPdfPreview'
const mock = vi.hoisted(() => ({ getDocument: vi.fn(), getPage: vi.fn(), render: vi.fn(), destroy: vi.fn(), cleanup: vi.fn(), cancel: vi.fn() }))
vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({ GlobalWorkerOptions: {}, getDocument: mock.getDocument }))
let root: Root, container: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.clearAllMocks()
  mock.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 80, getPage: mock.getPage }), destroy: mock.destroy })
  mock.getPage.mockResolvedValue({ getViewport: ({ scale }: { scale: number }) => ({ width: 10000 * scale, height: 14000 * scale }), render: mock.render, cleanup: mock.cleanup })
  mock.render.mockReturnValue({ promise: Promise.resolve(), cancel: mock.cancel })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals() })
it('renders one bounded page at a time and destroys its worker on close', async () => {
  await act(async () => root.render(<FolderPdfPreview name="Slides.pdf" blob={new NodeBlob(['pdf']) as Blob} />))
  await vi.waitFor(async () => { await act(async () => {}); expect(mock.render).toHaveBeenCalledTimes(1) })
  expect(mock.getPage).toHaveBeenCalledExactlyOnceWith(1)
  const canvas = container.querySelector('canvas')!
  expect(canvas.width * canvas.height).toBeLessThan(1_603_000)
  const next = [...container.querySelectorAll('button')].find(b => b.textContent === 'Next page')!
  await act(async () => next.click())
  expect(mock.getPage).toHaveBeenLastCalledWith(2)
  expect(mock.getPage).toHaveBeenCalledTimes(2)
  expect(mock.cleanup).toHaveBeenCalled()
  await act(async () => root.render(null))
  expect(mock.destroy).toHaveBeenCalledOnce()
})
it('offers download fallback for a malformed or password-protected PDF', async () => {
  mock.getDocument.mockReturnValue({ promise: Promise.reject(new Error('Invalid PDF')), destroy: mock.destroy })
  await act(async () => root.render(<FolderPdfPreview name="Slides.pdf" blob={new NodeBlob(['bad']) as Blob} />))
  await vi.waitFor(async () => { await act(async () => {}); expect(container.textContent).toContain('Download the original') })
  expect(mock.render).not.toHaveBeenCalled()
})
