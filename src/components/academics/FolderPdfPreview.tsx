import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { PDFDocumentProxy, PDFDocumentLoadingTask, RenderTask } from 'pdfjs-dist'

/** One bounded canvas at a time; closing releases both the page and worker. */
export function FolderPdfPreview({ blob, name }: { blob: Blob; name: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [page, setPage] = useState(1), [error, setError] = useState(''), [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true, task: PDFDocumentLoadingTask | undefined
    void (async () => {
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
        if (!alive) return
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).href
        const base = import.meta.env.BASE_URL
        const data = new Uint8Array(await blob.arrayBuffer())
        if (!alive) return
        task = pdfjs.getDocument({ data, maxImageSize: 16_000_000, cMapUrl: `${base}pdfjs/cmaps/`, cMapPacked: true, standardFontDataUrl: `${base}pdfjs/standard_fonts/` })
        const document = await task.promise
        if (alive) setPdf(document)
      } catch { if (alive) { setError('This PDF could not be previewed. Download the original to open it.'); setLoading(false) } }
    })()
    return () => { alive = false; void task?.destroy() }
  }, [blob])
  useEffect(() => {
    if (!pdf) return
    let alive = true, render: RenderTask | undefined
    let documentPage: Awaited<ReturnType<PDFDocumentProxy['getPage']>> | undefined
    void (async () => {
      try {
        const current = await pdf.getPage(page)
        documentPage = current
        const canvas = canvasRef.current
        if (!alive || !canvas) { current.cleanup(); return }
        const original = current.getViewport({ scale: 1 })
        const scale = Math.min(1.5, 1200 / original.width, Math.sqrt(1_600_000 / (original.width * original.height)))
        const viewport = current.getViewport({ scale })
        canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height)
        render = current.render({ canvas, viewport })
        await render.promise
        if (alive) setLoading(false)
      } catch (e) { if (alive && !(e instanceof Error && e.name === 'RenderingCancelledException')) { setError('This page could not be previewed. Download the original to open it.'); setLoading(false) } }
    })()
    return () => { alive = false; render?.cancel(); documentPage?.cleanup() }
  }, [pdf, page])
  function turn(next: number) { setLoading(true); setError(''); setPage(next) }
  return <div className="mf-pdf-preview">
    <div className="mf-pagination"><Button variant="outline" size="sm" disabled={!pdf || loading || page <= 1} onClick={() => turn(page - 1)}>Previous page</Button><span>Page {page}{pdf ? ` of ${pdf.numPages}` : ''}</span><Button variant="outline" size="sm" disabled={!pdf || loading || page >= pdf.numPages} onClick={() => turn(page + 1)}>Next page</Button></div>
    {error ? <p role="alert">{error}</p> : <><div className="mf-pdf-page"><canvas ref={canvasRef} role="img" aria-label={`${name}, page ${page}`} /></div>{loading && <p role="status">Loading page…</p>}</>}
  </div>
}
