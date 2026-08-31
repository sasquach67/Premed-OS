/**
 * Browser-local OCR for image-only PDF pages.
 *
 * The worker, recognition core, and English model are served by Premed OS.
 * Syllabus pixels never leave the browser. This module is dynamically loaded
 * only when a PDF page has no usable text layer, so normal imports do not pay
 * the OCR startup cost.
 */

export interface OcrProgress {
  status: string
  progress: number
}

interface RenderablePdfPage {
  getViewport(options: { scale: number }): { width: number; height: number }
  render(options: {
    canvas: HTMLCanvasElement
    canvasContext: CanvasRenderingContext2D
    viewport: { width: number; height: number }
    background?: string
  }): { promise: Promise<unknown> }
}

export interface LocalOcrSession {
  recognizePdfPage(page: unknown): Promise<string>
  terminate(): Promise<void>
}

const MAX_OCR_PIXELS = 16_000_000
const TARGET_SCALE = 4

function assetPath(file: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`
  return `${base}ocr/${file}`
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Syllabus reading was cancelled.', 'AbortError')
}

export async function createLocalOcrSession(
  onProgress?: (progress: OcrProgress) => void,
  signal?: AbortSignal,
): Promise<LocalOcrSession> {
  throwIfAborted(signal)
  const { createWorker, OEM, PSM } = await import('tesseract.js')
  const worker = await createWorker('eng', OEM.LSTM_ONLY, {
    workerPath: assetPath('worker.min.js'),
    corePath: assetPath('tesseract-core-lstm.wasm.js'),
    langPath: assetPath('lang'),
    gzip: true,
    logger: (message) => {
      onProgress?.({ status: message.status, progress: message.progress })
    },
  })
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.AUTO,
    preserve_interword_spaces: '1',
  })

  return {
    async recognizePdfPage(sourcePage) {
      throwIfAborted(signal)
      const page = sourcePage as RenderablePdfPage
      const initial = page.getViewport({ scale: TARGET_SCALE })
      const pixels = initial.width * initial.height
      const scale = pixels > MAX_OCR_PIXELS
        ? TARGET_SCALE * Math.sqrt(MAX_OCR_PIXELS / pixels)
        : TARGET_SCALE
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const context = canvas.getContext('2d', { alpha: false })
      if (!context) throw new Error('This browser could not prepare the scanned syllabus page.')
      await page.render({ canvas, canvasContext: context, viewport, background: '#fff' }).promise
      throwIfAborted(signal)
      try {
        const result = await worker.recognize(canvas)
        throwIfAborted(signal)
        return result.data.text.replace(/\r/g, '').trim()
      } finally {
        canvas.width = 1
        canvas.height = 1
      }
    },
    async terminate() {
      await worker.terminate()
    },
  }
}
