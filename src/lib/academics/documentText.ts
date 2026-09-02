/**
 * Shared local document→text extraction.
 *
 * Syllabus import and transcript intake both need "turn a student's file into
 * lines" and they must not drift apart: the PDF worker fix below was a real
 * production bug (extraction silently produced one line per page), and a second
 * copy of this logic would reintroduce it in the surface that copied first.
 *
 * Everything here runs on the device. No file is uploaded.
 */

export type DocumentSourceKind = 'text' | 'pdf' | 'docx' | 'image'

export interface ExtractedDocument {
  text: string
  sourceKind: DocumentSourceKind
  /** An image, or a PDF with no text layer — the bytes are a picture, not text. */
  scanDetected: boolean
  /** PDF pages with no readable text layer. A mixed PDF can otherwise look
   * complete even when its schedule pages are scans. */
  unreadablePageCount?: number
  /** Pages that had no text layer before local OCR recovery. */
  imageOnlyPageCount?: number
  /** Image-only pages recovered with the on-device OCR worker. */
  ocrPageCount?: number
  pageCount?: number
  /** Exact page boundary retained for source coverage and trace display. */
  pages?: Array<{ pageNumber: number; text: string; readable: boolean; ocrRecovered: boolean }>
}

export interface DocumentExtractionProgress {
  phase: 'extracting' | 'ocr'
  page: number
  pageCount: number
  progress: number
  message: string
}

export interface DocumentExtractionOptions {
  /** Syllabus import opts in; transcript/material readers keep their existing
   * fast text-layer-only behavior. */
  recoverScannedPdfPages?: boolean
  signal?: AbortSignal
  onProgress?: (progress: DocumentExtractionProgress) => void
}

export interface PdfTextItem {
  str?: string
  hasEOL?: boolean
  /** [a, b, c, d, x, y] — index 5 is the baseline y in PDF user space. */
  transform?: number[]
}

/** Keep malformed or accidentally enormous course files from monopolizing the
 * browser. These bounds are intentionally generous for syllabi while still
 * putting a deterministic ceiling on allocation and page iteration. */
export const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024
export const MAX_PDF_PAGES = 250

export function validateDocumentBounds(fileSize: number, pageCount?: number) {
  if (fileSize > MAX_DOCUMENT_BYTES) {
    throw new UnsupportedDocumentError('This file is larger than 50 MB. Choose a smaller copy or paste the syllabus text.')
  }
  if (pageCount != null && pageCount > MAX_PDF_PAGES) {
    throw new UnsupportedDocumentError(`This PDF has more than ${MAX_PDF_PAGES} pages. Choose the syllabus pages or paste their text.`)
  }
}

/**
 * Groups pdf.js text items into visual lines.
 *
 * ⚠️ This function exists because joining every item with a space — which is
 * what this did until Aug 20 2026 — collapses an entire page into one string.
 * Line-based parsers then see almost nothing: a real CHEM 262 syllabus with six
 * dates, five weight rows and four units extracted **one date and nothing
 * else**.
 *
 * pdf.js emits items in reading order with a baseline y per item. Items sharing
 * a baseline are one visual line, so they are grouped by y within a tolerance
 * and joined; a new y starts a new line. `hasEOL` is honoured where the build
 * provides it, since it is the library's own answer to the same question.
 */
export function pdfTextToLines(items: PdfTextItem[], tolerance = 2): string {
  const lines: string[] = []
  let current: Array<{ text: string; x: number }> = []
  let currentY: number | undefined

  const flush = () => {
    const text = current.sort((left, right) => left.x - right.x).map((item) => item.text).join(' ').replace(/\s+/g, ' ').trim()
    if (text) lines.push(text)
    current = []
  }

  for (const item of items) {
    const str = typeof item.str === 'string' ? item.str : ''
    const x = Array.isArray(item.transform) ? item.transform[4] : current.length
    const y = Array.isArray(item.transform) ? item.transform[5] : undefined

    if (currentY != null && y != null && Math.abs(y - currentY) > tolerance) flush()
    if (y != null) currentY = y
    if (str) current.push({ text: str, x: typeof x === 'number' ? x : current.length })
    if (item.hasEOL) { flush(); currentY = undefined }
  }
  flush()
  return lines.join('\n')
}

/** Thrown for a file type we cannot read on-device. Callers show the manual route. */
export class UnsupportedDocumentError extends Error {
  constructor(message = 'This file cannot be read directly. Paste its text or enter it manually.') {
    super(message)
    this.name = 'UnsupportedDocumentError'
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function unreadableImageResult(): ExtractedDocument {
  return {
    text: '', sourceKind: 'image', scanDetected: true, pageCount: 1,
    unreadablePageCount: 1, imageOnlyPageCount: 1, ocrPageCount: 0,
    pages: [{ pageNumber: 1, text: '', readable: false, ocrRecovered: false }],
  }
}

type SniffedDocumentKind = 'pdf' | 'docx' | 'image' | 'text' | 'unsupported'

/** Trust the bytes before the filename. Canvas and browser downloads can carry
 * Word OOXML bytes under a `.pdf` name; routing those bytes to pdf.js produces
 * an opaque "Invalid PDF structure" failure even though Mammoth can read them. */
export async function sniffDocumentKind(file: File): Promise<SniffedDocumentKind> {
  const name = file.name || 'Document'
  const type = (file.type || '').toLowerCase()
  const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  const startsWith = (...bytes: number[]) => bytes.every((byte, index) => signature[index] === byte)

  if (startsWith(0x25, 0x50, 0x44, 0x46)) return 'pdf' // %PDF
  if (startsWith(0x50, 0x4b, 0x03, 0x04) || startsWith(0x50, 0x4b, 0x05, 0x06) || startsWith(0x50, 0x4b, 0x07, 0x08)) return 'docx'
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('text/') || /\.(txt|csv|tsv|md)$/i.test(name)) return 'text'
  if (/wordprocessingml|\.docx$/i.test(type || name)) return 'docx'
  if (type === 'application/pdf' || /\.pdf$/i.test(name)) return 'pdf'
  return 'unsupported'
}

export async function extractDocumentText(file: File, options: DocumentExtractionOptions = {}): Promise<ExtractedDocument> {
  validateDocumentBounds(file.size)
  const kind = await sniffDocumentKind(file)

  // An image has no text layer we can read locally; report it rather than
  // returning an empty parse that looks like "nothing was in your transcript".
  if (kind === 'image') {
    if (!options.recoverScannedPdfPages) return unreadableImageResult()
    try {
      const { createLocalOcrSession } = await import('@/lib/academics/documentOcr')
      const ocr = await createLocalOcrSession((progress) => options.onProgress?.({ phase: 'ocr', page: 1, pageCount: 1, progress: progress.progress, message: 'Reading image on this device' }), options.signal)
      try {
        const text = await ocr.recognizeImage(file)
        return {
          text, sourceKind: 'image', scanDetected: true, pageCount: 1,
          unreadablePageCount: text ? 0 : 1, imageOnlyPageCount: 1, ocrPageCount: text ? 1 : 0,
          pages: [{ pageNumber: 1, text, readable: Boolean(text), ocrRecovered: Boolean(text) }],
        }
      } finally {
        await ocr.terminate()
      }
    } catch (error) {
      if (isAbortError(error)) throw error
      options.onProgress?.({ phase: 'ocr', page: 1, pageCount: 1, progress: 1, message: 'Image kept for manual review; on-device OCR was unavailable' })
      return unreadableImageResult()
    }
  }

  if (kind === 'docx') {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    // Mammoth's browser build reads `arrayBuffer`; its Node build reads
    // `buffer`. Supplying the same bytes under both keys keeps local tests,
    // SSR-like runtimes, and the Vite browser bundle on one extraction path.
    // The inactive build ignores the key it does not understand.
    const result = await mammoth.extractRawText({
      arrayBuffer,
      buffer: new Uint8Array(arrayBuffer),
    } as Parameters<typeof mammoth.extractRawText>[0])
    return { text: result.value, sourceKind: 'docx', scanDetected: !result.value.trim() }
  }

  if (kind === 'pdf') {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    // ⚠️ Without this, `getDocument` throws `No "GlobalWorkerOptions.workerSrc"
    // specified` in a real browser — it does NOT fall back to a same-thread
    // worker. PDF import was dead in the app while every jsdom test passed,
    // because Node resolves the worker by a different path. The `?url` import
    // lets Vite fingerprint and serve the worker in both dev and build.
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      const workerUrl = (await import('pdfjs-dist/legacy/build/pdf.worker.mjs?url')).default
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
    }
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
    validateDocumentBounds(file.size, pdf.numPages)
    const pages: string[] = []
    const pageHandles: Array<Awaited<ReturnType<typeof pdf.getPage>> | undefined> = []
    let unreadablePageCount = 0
    let imageOnlyPageCount = 0
    let ocrPageCount = 0
    for (let number = 1; number <= pdf.numPages; number += 1) {
      if (options.signal?.aborted) throw new DOMException('Syllabus reading was cancelled.', 'AbortError')
      const page = await pdf.getPage(number)
      const content = await page.getTextContent()
      const pageText = pdfTextToLines(content.items as PdfTextItem[])
      if (!pageText.replace(/\s/g, '')) {
        unreadablePageCount += 1
        imageOnlyPageCount += 1
        pageHandles[number - 1] = page
      }
      pages.push(pageText)
      options.onProgress?.({ phase: 'extracting', page: number, pageCount: pdf.numPages, progress: number / pdf.numPages, message: `Reading page ${number} of ${pdf.numPages}` })
    }

    if (options.recoverScannedPdfPages && unreadablePageCount) {
      const { createLocalOcrSession } = await import('@/lib/academics/documentOcr')
      let activePage = 0
      try {
        const ocr = await createLocalOcrSession((progress) => {
          options.onProgress?.({
            phase: 'ocr', page: activePage, pageCount: pdf.numPages, progress: progress.progress,
            message: activePage ? `Reading scanned page ${activePage} of ${pdf.numPages}` : 'Starting on-device OCR',
          })
        }, options.signal)
        try {
          for (let index = 0; index < pageHandles.length; index += 1) {
            const page = pageHandles[index]
            if (!page) continue
            activePage = index + 1
            options.onProgress?.({
              phase: 'ocr', page: activePage, pageCount: pdf.numPages,
              progress: 0,
              message: `Reading scanned page ${activePage} of ${pdf.numPages}`,
            })
            try {
              const recovered = await ocr.recognizePdfPage(page)
              if (recovered.replace(/\s/g, '')) {
                pages[index] = recovered
                unreadablePageCount -= 1
                ocrPageCount += 1
              }
            } catch (error) {
              if (isAbortError(error)) throw error
              // Partial success is intentional. The review UI names any pages
              // that still could not be read and preserves manual correction.
            }
          }
        } finally {
          await ocr.terminate()
        }
      } catch (error) {
        if (isAbortError(error)) throw error
        options.onProgress?.({
          phase: 'ocr', page: 0, pageCount: pdf.numPages, progress: 1,
          message: `${unreadablePageCount} scanned ${unreadablePageCount === 1 ? 'page was' : 'pages were'} kept for manual review`,
        })
      }
    }
    const text = pages.join('\n')
    return {
      text, sourceKind: 'pdf', scanDetected: imageOnlyPageCount > 0, unreadablePageCount, imageOnlyPageCount, ocrPageCount, pageCount: pdf.numPages,
      pages: pages.map((pageText, index) => ({ pageNumber: index + 1, text: pageText, readable: Boolean(pageText.trim()), ocrRecovered: Boolean(pageHandles[index] && pageText.trim()) })),
    }
  }

  if (kind === 'text') {
    const text = await file.text()
    return { text, sourceKind: 'text', scanDetected: false }
  }

  throw new UnsupportedDocumentError()
}
