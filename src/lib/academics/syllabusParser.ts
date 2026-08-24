export type SyllabusKind = 'identity' | 'exams' | 'weights' | 'units' | 'deadlines' | 'policies' | 'logistics'

export interface SyllabusEvidence { quote: string; location: string }
export interface SyllabusItem { id: string; kind: SyllabusKind; label: string; value?: string; confidence: 'high' | 'low'; evidence: SyllabusEvidence }
export interface SyllabusProposal {
  sourceName: string
  sourceKind: 'pdf' | 'docx' | 'text' | 'image' | 'shared'
  text: string
  items: SyllabusItem[]
  searched: Record<SyllabusKind, string>
  scanDetected: boolean
  /** Whether this reads as a syllabus at all (§4.1-M-d). A proposal, never a verdict:
   *  the review-anyway override is always offered. Distinct from `scanDetected`,
   *  which means the text could not be read in the first place. */
  documentKind: DocumentKind
  /** Which structural syllabus signals were present. Drives the did-not-find list. */
  structureFound: StructuralSignal[]
  /** Numbered-question count — the positive evidence that this is course material. */
  numberedItems: number
}

export type DocumentKind = 'syllabus' | 'unrecognized'

/** A lone due date is NOT structural: that is exactly what a problem set carries.
 *  These four are what separates a syllabus from any other course document. */
export type StructuralSignal = 'weights' | 'exams' | 'units' | 'logistics'
const STRUCTURAL: StructuralSignal[] = ['weights', 'exams', 'units', 'logistics']

const month = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'
const datePattern = new RegExp(`\\b${month}\\.?\\s+\\d{1,2}(?:,?\\s+20\\d{2})?\\b`, 'gi')
const headers: Array<[SyllabusKind, RegExp]> = [
  ['units', /^(?:week|unit|module|chapter)\s*\d+/i],
  ['policies', /\b(?:attendance|late work|late policy|drop(?:ped)? lowest|replacement|make-?up)\b/i],
  ['logistics', /\b(?:office hours|meets?|meeting|room|location|instructor|professor)\b/i],
]

const MONTH_INDEX: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

/** Turn a matched `September 8, 2026` into `2026-09-08`.
 *
 *  The whole app stores dates as yyyy-MM-dd and `date.ts` reads them with
 *  `iso.slice(0, 10)`. Handing it display text produced `new Date('September
 *  T12:00:00')` — Invalid Date — so every imported deadline rendered as
 *  `Date TBD` with no countdown, and sorting compared month NAMES. A syllabus
 *  full of real dates looked empty.
 *
 *  A syllabus often writes `Oct 6` with no year, so the caller passes the year
 *  it found elsewhere in the document. With no year available we return
 *  undefined rather than guessing — the row stays, marked low confidence, for
 *  the student to fill in. */
export function toIsoDate(raw: string, yearHint?: number): string | undefined {
  const match = raw.match(/^([A-Za-z]+)\.?\s+(\d{1,2})(?:,?\s+(20\d{2}))?$/)
  if (!match) return undefined
  const month = MONTH_INDEX[match[1].slice(0, 3).toLowerCase()]
  const day = Number(match[2])
  const year = match[3] ? Number(match[3]) : yearHint
  if (!month || !day || day > 31 || !year) return undefined
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** `Problem Set 1 due` / `Midterm Exam 1 on` — removing the date leaves the
 *  preposition that introduced it dangling on the end of the label the student
 *  reads on every card. */
function trimConnectives(label: string): string {
  let out = label.trim()
  for (;;) {
    const next = out.replace(/[\s,]*\b(?:due|on|by|is|at|scheduled|held)\b[\s,]*$/i, '').replace(/[—:–\-]+$/, '').trim()
    if (next === out) return out
    out = next
  }
}

function lineEvidence(line: string, index: number): SyllabusEvidence {
  return { quote: line.trim(), location: `line ${index + 1}` }
}
function push(items: SyllabusItem[], kind: SyllabusKind, label: string, value: string | undefined, confidence: 'high' | 'low', evidence: SyllabusEvidence) {
  items.push({ id: `${kind}-${items.length}`, kind, label, value, confidence, evidence })
}

/** A key-free parser. It deliberately proposes only regular, attributable facts. */
export function parseSyllabusText(text: string, sourceName = 'Pasted syllabus', sourceKind: SyllabusProposal['sourceKind'] = 'text'): SyllabusProposal {
  const lines = text.replace(/\r/g, '').split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean)
  const items: SyllabusItem[] = []
  const searched: Record<SyllabusKind, string> = {
    identity: 'No course identity found', exams: 'No exam dates found', weights: 'No grade categories found', units: 'No week or unit headings found', deadlines: 'No assignment deadlines found', policies: 'No attendance, late, drop, or replacement policy found', logistics: 'No meeting, instructor, or office-hours details found',
  }
  // Syllabi date the term at the top (`Fall 2026`) and then write `Oct 6`.
  const yearHint = Number(text.match(/\b20\d{2}\b/)?.[0]) || undefined
  lines.forEach((line, index) => {
    const evidence = lineEvidence(line, index)
    const course = line.match(/\b([A-Z]{2,5}\s?\d{2,4}[A-Z]?)\s*(?:[-:–—]\s*|\s{2,})(.{3,})/)
    if (course && !items.some((item) => item.kind === 'identity')) { push(items, 'identity', course[1], course[2], 'high', evidence); searched.identity = 'Course identity found' }
    const weight = line.match(/^(.{2,60}?)\s*[-:–]?\s*(\d{1,3}(?:\.\d+)?)\s*%/i)
    if (weight) { push(items, 'weights', weight[1].trim(), `${weight[2]}%`, 'high', evidence); searched.weights = 'Grade categories found' }
    const date = line.match(datePattern)
    if (date) {
      const isExam = /\b(?:exam|midterm|final|test)\b/i.test(line)
      const kind: SyllabusKind = isExam ? 'exams' : 'deadlines'
      const iso = toIsoDate(date[0], yearHint)
      const label = trimConnectives(line.replace(date[0], '')) || (isExam ? 'Exam' : 'Deadline')
      push(items, kind, label, iso ?? date[0], iso ? 'high' : 'low', evidence)
      searched[kind] = isExam ? 'Exam dates found' : 'Assignment deadlines found'
    }
    for (const [kind, pattern] of headers) if (pattern.test(line)) { push(items, kind, line, undefined, kind === 'policies' ? 'low' : 'high', evidence); searched[kind] = `${kind[0].toUpperCase()}${kind.slice(1)} found` }
  })
  const scanDetected = text.replace(/\s/g, '').length < 80
  const structureFound = STRUCTURAL.filter((signal) => items.some((item) => item.kind === signal))
  const numberedItems = lines.filter((line) => /^\(?\d{1,2}[.)]\s+\S/.test(line)).length
  // Only a readable document with NO structural signal at all is called unrecognized.
  // Deliberately conservative: a one-page syllabus with just office hours still counts
  // as a syllabus, and the student can override this either way.
  const documentKind: DocumentKind = !scanDetected && structureFound.length === 0 ? 'unrecognized' : 'syllabus'
  return { sourceName, sourceKind, text, items, searched, scanDetected, documentKind, structureFound, numberedItems }
}


interface PdfTextItem {
  str?: string
  hasEOL?: boolean
  /** [a, b, c, d, x, y] — index 5 is the baseline y in PDF user space. */
  transform?: number[]
}

/**
 * Rebuild a page's LINES from pdf.js text items.
 *
 * ⚠️ This function exists because joining every item with a space — which is
 * what this did until Aug 20 2026 — collapses an entire page into one string.
 * `parseSyllabusText` is line-based, so a two-page syllabus became two lines
 * and could yield at most two items. A real CHEM 262 syllabus with six dates,
 * five weight rows and four units extracted **one date and nothing else**.
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

export async function extractSyllabusFile(file: File): Promise<SyllabusProposal> {
  const name = file.name || 'Syllabus'
  const type = file.type.toLowerCase()
  if (type.startsWith('image/')) {
    return parseSyllabusText('', name, 'image')
  }
  if (/wordprocessingml|\.docx$/i.test(type || name)) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return parseSyllabusText(result.value, name, 'docx')
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
    return parseSyllabusText(pages.join('\n'), name, 'pdf')
  }
  throw new Error('This file cannot be read directly. Paste its text or enter it manually.')
}

export function weightGap(items: SyllabusItem[]) {
  const weights = items.filter((item) => item.kind === 'weights').map((item) => Number(item.value?.replace('%', ''))).filter(Number.isFinite)
  return weights.length ? 100 - weights.reduce((sum, weight) => sum + weight, 0) : null
}
