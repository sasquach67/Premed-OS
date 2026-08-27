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
}

export interface PdfTextItem {
  str?: string
  hasEOL?: boolean
  /** [a, b, c, d, x, y] — index 5 is the baseline y in PDF user space. */
  transform?: number[]
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
  let current: string[] = []
  let currentY: number | undefined

  const flush = () => {
    const text = current.join(' ').replace(/\s+/g, ' ').trim()
    if (text) lines.push(text)
    current = []
  }

  for (const item of items) {
    const str = typeof item.str === 'string' ? item.str : ''
    const y = Array.isArray(item.transform) ? item.transform[5] : undefined

    if (currentY != null && y != null && Math.abs(y - currentY) > tolerance) flush()
    if (y != null) currentY = y
    if (str) current.push(str)
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

export async function extractDocumentText(file: File): Promise<ExtractedDocument> {
  const name = file.name || 'Document'
  const type = (file.type || '').toLowerCase()

  // An image has no text layer we can read locally; report it rather than
  // returning an empty parse that looks like "nothing was in your transcript".
  if (type.startsWith('image/')) return { text: '', sourceKind: 'image', scanDetected: true }

  if (/wordprocessingml|\.docx$/i.test(type || name)) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return { text: result.value, sourceKind: 'docx', scanDetected: !result.value.trim() }
  }

  if (type === 'application/pdf' || /\.pdf$/i.test(name)) {
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
    const pages: string[] = []
    for (let number = 1; number <= pdf.numPages; number += 1) {
      const content = await (await pdf.getPage(number)).getTextContent()
      pages.push(pdfTextToLines(content.items as PdfTextItem[]))
    }
    const text = pages.join('\n')
    return { text, sourceKind: 'pdf', scanDetected: !text.trim() }
  }

  if (type.startsWith('text/') || /\.(txt|csv|tsv|md)$/i.test(name)) {
    const text = await file.text()
    return { text, sourceKind: 'text', scanDetected: false }
  }

  throw new UnsupportedDocumentError()
}
