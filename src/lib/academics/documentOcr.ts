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
  recognizeImage(image: Blob): Promise<string>
  terminate(): Promise<void>
}

const MAX_OCR_PIXELS = 16_000_000
const TARGET_SCALE = 4
export const OCR_STARTUP_TIMEOUT_MS = 20_000
export const OCR_OPERATION_TIMEOUT_MS = 60_000

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
  const startup = import('tesseract.js').then(async ({ createWorker, OEM, PSM }) => ({
    PSM,
    worker: await createWorker('eng', OEM.LSTM_ONLY, {
      workerPath: assetPath('worker.min.js'),
      // Loading the same-origin worker directly avoids a second blob-worker
      // bootstrap layer, which can stall without surfacing an error in some
      // locked-down browser sessions.
      workerBlobURL: false,
      corePath: assetPath('tesseract-core-lstm.wasm.js'),
      langPath: assetPath('lang'),
      gzip: true,
      logger: (message) => {
        onProgress?.({ status: message.status, progress: message.progress })
      },
    }),
  }))
  const { worker, PSM } = await new Promise<Awaited<typeof startup>>((resolve, reject) => {
    let settled = false
    const finish = (callback: () => void) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      signal?.removeEventListener('abort', onAbort)
      callback()
    }
    const onAbort = () => finish(() => reject(new DOMException('Syllabus reading was cancelled.', 'AbortError')))
    const timeout = window.setTimeout(() => finish(() => reject(new Error('The on-device scanned-page reader could not start. Readable pages were kept; try the scanned pages again or paste their text.'))), OCR_STARTUP_TIMEOUT_MS)
    signal?.addEventListener('abort', onAbort, { once: true })
    startup.then(
      (value) => {
        if (settled) {
          void value.worker.terminate()
          return
        }
        finish(() => resolve(value))
      },
      (error) => finish(() => reject(error)),
    )
  })
  let termination: Promise<void> | undefined
  const terminate = () => termination ??= Promise.resolve().then(async () => { await worker.terminate() })
  // Tesseract may stop answering after startup. Bound each operation as well
  // so one scanned page cannot indefinitely hold up a multi-file import.
  const runOperation = <T>(operation: () => Promise<T>): Promise<T> => {
    throwIfAborted(signal)
    if (termination) return Promise.reject(new Error('The on-device reader has stopped. Try this page again or paste its text.'))
    return new Promise<T>((resolve, reject) => {
      let settled = false
      const finish = (callback: () => void) => {
        if (settled) return
        settled = true
        window.clearTimeout(timeout)
        signal?.removeEventListener('abort', onAbort)
        callback()
      }
      const stop = (error: Error) => finish(() => {
        void terminate().catch(() => {})
        reject(error)
      })
      const onAbort = () => stop(new DOMException('Document reading was cancelled.', 'AbortError'))
      const timeout = window.setTimeout(() => stop(new Error('The on-device reader took too long. Readable pages were kept; try this page again or paste its text.')), OCR_OPERATION_TIMEOUT_MS)
      signal?.addEventListener('abort', onAbort, { once: true })
      Promise.resolve().then(() => {
        throwIfAborted(signal)
        return operation()
      }).then(
        (value) => finish(() => resolve(value)),
        (error) => finish(() => reject(error)),
      )
    })
  }
  try {
    await runOperation(() => worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: '1',
    }))
  } catch (error) {
    void terminate().catch(() => {})
    throw error
  }

  return {
    async recognizeImage(image) {
      throwIfAborted(signal)
      const result = await runOperation(() => worker.recognize(image as Parameters<typeof worker.recognize>[0]))
      throwIfAborted(signal)
      return result.data.text.replace(/\r/g, '').trim()
    },
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
      try {
        await runOperation(() => page.render({ canvas, canvasContext: context, viewport, background: '#fff' }).promise)
        throwIfAborted(signal)
        const result = await runOperation(() => worker.recognize(canvas))
        throwIfAborted(signal)
        return result.data.text.replace(/\r/g, '').trim()
      } finally {
        canvas.width = 1
        canvas.height = 1
      }
    },
    async terminate() {
      await terminate()
    },
  }
}
