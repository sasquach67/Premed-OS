import { extractDocumentText, pdfTextToLines } from '@/lib/academics/documentText'
import { extractClassMeetingDays, extractClassMeetingTime } from '@/lib/academics/meetingSchedule'

// One implementation, shared with transcript intake. Re-exported because the
// PDF line-grouping regression test targets this module's public surface.
export { pdfTextToLines }
export type { PdfTextItem } from '@/lib/academics/documentText'

export type SyllabusKind = 'identity' | 'standards' | 'exams' | 'weights' | 'units' | 'readings' | 'deadlines' | 'policies' | 'logistics'

export interface SyllabusEvidence { quote: string; location: string; sourceName?: string }
export interface SyllabusItem { id: string; kind: SyllabusKind; label: string; value?: string; context?: string; confidence: 'high' | 'low'; evidence: SyllabusEvidence }
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
export type StructuralSignal = 'standards' | 'weights' | 'exams' | 'units' | 'logistics'
const STRUCTURAL: StructuralSignal[] = ['standards', 'weights', 'exams', 'units', 'logistics']

const month = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'
const datePattern = new RegExp(`\\b${month}\\.?\\s+\\d{1,2}(?:,?\\s+20\\d{2})?\\b`, 'gi')
const headers: Array<[SyllabusKind, RegExp]> = [
  ['units', /^(?:week|unit|module|chapter)\s*\d+/i],
  ['policies', /\b(?:attendance|late work|late policy|drop(?:ped)? lowest|replacement|make-?up)\b/i],
  ['logistics', /\b(?:office hours|meets?|meeting|instructor|prof(?:essor)?\.?)\b|^(?:office|room|location)\s*:|^(?=.{3,100}$).+\b(?:Hall|Center|Building)\b(?:\s+(?:Room|Rm\.?)?\s*[A-Za-z]?\d+[A-Za-z]?)?$|\b(?:MWF|TR|TTH)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i],
]

const NAMED_SUBJECT_CODES: Record<string, string> = {
  anthropology: 'ANTH',
  psychology: 'PSYC',
}

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

function numericDateToIso(month: string, day: string, yearHint?: number): string | undefined {
  const numericMonth = Number(month)
  const numericDay = Number(day)
  if (!numericMonth || numericMonth > 12 || !numericDay || numericDay > 31 || !yearHint) return undefined
  return `${yearHint}-${String(numericMonth).padStart(2, '0')}-${String(numericDay).padStart(2, '0')}`
}

function scheduleStart(line: string, yearHint?: number): { label: string; date?: string } | undefined {
  const match = line.match(/^((?:Introduction|Wk|Week)\s*\d*)\s*:\s*(\d{1,2})\/(\d{1,2})/i)
  if (!match) return undefined
  return { label: match[1].replace(/^Wk\b/i, 'Week').trim(), date: numericDateToIso(match[2], match[3], yearHint) }
}

function scheduleExam(line: string): string | undefined {
  const match = line.match(/\b(?:exam|midterm)\s*#?\s*(\d+)\b/i)
  if (match) return `Exam ${match[1]}`
  return /\bfinal exam\b/i.test(line) ? 'Final Exam' : undefined
}

function looksLikeReading(line: string): boolean {
  return /[“"]|(?:\bpp?\.|\bvol\.)|\b(?:chapter|ch\.|podcast|episode|publishers?|press|journal|magazine|ISBN)\b|https?:\/\//i.test(line)
    || /^[A-Z][A-Za-z'’-]+,\s*(?:[A-Z](?:\.|[A-Za-z'’-]+\.)|(?:[A-Z][A-Za-z'’-]+,\s*)?\d{4})/.test(line)
}

function parseFlattenedSchedule(lines: string[], items: SyllabusItem[], searched: Record<SyllabusKind, string>, yearHint?: number) {
  const scheduleHeader = lines.findIndex((line) => /^(?:schedule for class|course (?:schedule|calendar))/i.test(line))
  if (scheduleHeader < 0) return
  const scheduleEnd = lines.findIndex((line, index) => index > scheduleHeader && /^(?:tips for success|required books|course requirements|honou?r code)\b/i.test(line))
  const end = scheduleEnd < 0 ? lines.length : scheduleEnd
  const rowStarts: Array<{ index: number; label: string; date?: string }> = []
  for (let index = scheduleHeader + 1; index < end; index += 1) {
    const start = scheduleStart(lines[index], yearHint)
    if (start) rowStarts.push({ index, ...start })
  }

  rowStarts.forEach((row, rowIndex) => {
    const nextIndex = rowStarts[rowIndex + 1]?.index ?? end
    const cells = lines.slice(row.index + 1, nextIndex)
    const evidenceAt = (offset: number) => lineEvidence(lines[row.index + 1 + offset], row.index + 1 + offset)
    const themeParts: string[] = []
    let genericTheme = ''
    const readingParts: Array<{ label: string; evidence: SyllabusEvidence }> = []
    let readingStarted = false

    cells.forEach((cell, offset) => {
      if (/^(?:week\/theme|reading|recitation to discuss|yes\b|no\b|discussion\b|go over exam)/i.test(cell)) return
      if (/^(?:\d{1,2}\/\d{1,2}\s*[-:]|\(?no class|fall break|thanksgiving break|in our classroom)/i.test(cell)) return
      if (/\b(?:review session|review for (?:the )?(?:exam|final)|review all readings)\b/i.test(cell)) return
      // The dedicated pass below reads the final's own numeric date. Using
      // the current week's first date here would incorrectly make it 12/1.
      if (/\bfinal exam\b/i.test(cell)) return
      const exam = scheduleExam(cell)
      if (exam) {
        push(items, 'exams', exam, row.date, row.date ? 'high' : 'low', evidenceAt(offset))
        searched.exams = 'Exam dates found'
        return
      }
      if (looksLikeReading(cell) || readingStarted) {
        readingStarted = true
        const previous = readingParts.at(-1)
        if (previous && /[:;,–-]\s*$/.test(previous.label)) previous.label = `${previous.label} ${cell}`.replace(/\s+/g, ' ')
        else readingParts.push({ label: cell, evidence: evidenceAt(offset) })
        return
      }
      if (/^(?:exam week|review week)$/i.test(cell)) genericTheme = cell
      else themeParts.push(cell)
    })

    const theme = (themeParts.join(' ') || genericTheme).replace(/\s+/g, ' ').trim()
    if (theme) {
      push(items, 'units', theme, row.date, row.date ? 'high' : 'low', lineEvidence(lines[row.index], row.index), row.label)
      searched.units = 'Schedule scope found'
    }
    readingParts.forEach((reading) => push(items, 'readings', reading.label, row.date, row.date ? 'high' : 'low', reading.evidence, row.label))
    if (readingParts.length) searched.readings = 'Assigned readings found'
  })

  for (let index = scheduleHeader + 1; index < end; index += 1) {
    const line = lines[index]
    const final = line.match(/\bFINAL EXAM\b[^\d]*(\d{1,2})\/(\d{1,2})/i)
    if (!final) continue
    const date = numericDateToIso(final[1], final[2], yearHint)
    if (!items.some((item) => item.kind === 'exams' && item.label === 'Final Exam' && item.value === date)) {
      push(items, 'exams', 'Final Exam', date, date ? 'high' : 'low', lineEvidence(line, index))
      searched.exams = 'Exam dates found'
    }
  }
}

function scheduleTopic(raw: string): string {
  return raw
    .replace(/\([^)]*\)/g, '')
    .replace(/\bchapter\s+\d+\b/ig, '')
    .replace(/\s+/g, ' ')
    .trim()
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
function push(items: SyllabusItem[], kind: SyllabusKind, label: string, value: string | undefined, confidence: 'high' | 'low', evidence: SyllabusEvidence, context?: string) {
  items.push({ id: `${kind}-${items.length}`, kind, label, value, context, confidence, evidence })
}

const STANDARD_HEADER = /\b(?:learning (?:objectives?|outcomes?|standards?)|student learning outcomes?|course (?:objectives?|outcomes?|goals?))\b/i
const STANDARD_ITEM = /^(?:[•*‣–-]|\(?\d{1,2}[.)])\s+(.+)$/

function standardLabel(line: string): string | undefined {
  const bullet = line.match(STANDARD_ITEM)?.[1] ?? line.match(/^(?:students? (?:will|should)|by the end of (?:this )?(?:course|class),? (?:students? )?(?:will|should)|understand|demonstrate|classify|translate|assess|recognize|interrogate|employ|explain|apply|analyze|evaluate|describe|identify|compare|distinguish)\b[:\s-]*(.+)?/i)?.[0]
  if (!bullet) return undefined
  const label = bullet.replace(/^(?:students? (?:will|should)\s+|by the end of (?:this )?(?:course|class),?\s*(?:students? )?(?:will|should)\s+)/i, '').replace(/\s+/g, ' ').trim()
  return label.length >= 8 ? label : undefined
}

/** A key-free parser. It deliberately proposes only regular, attributable facts. */
export function parseSyllabusText(text: string, sourceName = 'Pasted syllabus', sourceKind: SyllabusProposal['sourceKind'] = 'text'): SyllabusProposal {
  const lines = text.replace(/\r/g, '').split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean)
  const items: SyllabusItem[] = []
  const searched: Record<SyllabusKind, string> = {
    identity: 'No course identity found', standards: 'No stated learning standards found', exams: 'No exam dates found', weights: 'No grade categories found', units: 'No week or unit headings found', readings: 'No assigned readings found', deadlines: 'No assignment deadlines found', policies: 'No attendance, late, drop, or replacement policy found', logistics: 'No meeting, instructor, or office-hours details found',
  }
  // Syllabi date the term at the top (`Fall 2026`) and then write `Oct 6`.
  const yearHint = Number(text.match(/\b20\d{2}\b/)?.[0]) || undefined
  lines.forEach((line, index) => {
    const evidence = lineEvidence(line, index)
    const course = line.match(/\b([A-Z]{2,5}\s?\d{2,4}[A-Z]?)\s*(?:[-:–—]\s*|\s{2,})(.{3,})/)
    if (course && !items.some((item) => item.kind === 'identity')) { push(items, 'identity', course[1], course[2], 'high', evidence); searched.identity = 'Course identity found' }
    // Many university syllabi spell out the subject in the document heading
    // ("Psychology 101.001 Introduction to Psychology") instead of using the
    // catalog abbreviation. Preserve the source wording as evidence while
    // normalizing the one unambiguous subject name students expect in a course
    // picker.
    const namedCourse = line.match(/^([A-Za-z][A-Za-z ]+?)\s+(\d{2,4})(?:\.\d{1,3})?\s+(.{3,})$/)
    if (namedCourse && !items.some((item) => item.kind === 'identity')) {
      const subject = namedCourse[1].trim()
      const code = `${NAMED_SUBJECT_CODES[subject.toLowerCase()] ?? subject} ${namedCourse[2]}`
      push(items, 'identity', code, namedCourse[3].trim(), 'high', evidence)
      searched.identity = 'Course identity found'
    }
    const pointsWeight = !/^total\b/i.test(line) && line.match(/^(.{2,100}?)\s*(?:x\s*\d+(?:\.\d+)?\s*pts?\s*each\s*:\s*)?\d+(?:\.\d+)?\s*pts?\s*\((\d{1,3}(?:\.\d+)?)%\)\s*$/i)
    const directWeight = !pointsWeight && !/^total\b/i.test(line) ? line.match(/^(.{2,60}?)\s*[-:–]?\s*(\d{1,3}(?:\.\d+)?)\s*%/i) : null
    const weight = pointsWeight ?? directWeight
    if (weight) { push(items, 'weights', weight[1].replace(/[\s:–—-]+$/, '').trim(), `${weight[2]}%`, 'high', evidence); searched.weights = 'Grade categories found' }
    const date = line.match(datePattern)
    if (date) {
      // Publication dates inside citations are source metadata, not course
      // deadlines. Dated facts need an operational cue before becoming work.
      const isExam = /\b(?:exam|midterm|final|test)\b/i.test(line)
      const isDeadline = /\b(?:due|deadline|submit|submission|quiz|assignment|paper|response|presentation|project)\b/i.test(line)
      if (!isExam && !isDeadline) return
      const kind: SyllabusKind = isExam ? 'exams' : 'deadlines'
      const iso = toIsoDate(date[0], yearHint)
      const label = trimConnectives(line.replace(date[0], '')) || (isExam ? 'Exam' : 'Deadline')
      push(items, kind, label, iso ?? date[0], iso ? 'high' : 'low', evidence)
      searched[kind] = isExam ? 'Exam dates found' : 'Assignment deadlines found'
    }
    // Schedule tables often use numeric dates, e.g. "Tues 8/25 Research
    // Enterprise (Forum 1 due 8/25)". Limit this branch to rows beginning
    // with a weekday so policy prose containing a date cannot become a fake
    // deadline.
    const schedule = line.match(/^(?:mon(?:day)?|tues(?:day)?|wed(?:nesday)?|thurs?(?:day)?|fri(?:day)?)\.?\s+(\d{1,2})\/(\d{1,2})\s+(.+)$/i)
    if (schedule) {
      const scheduledDate = numericDateToIso(schedule[1], schedule[2], yearHint)
      const detail = schedule[3].trim()
      const topic = scheduleTopic(detail)
      if (topic && !/^(?:exam\s*\d*|final exam|fall break|thanksgiving break|well-being day)$/i.test(topic)) {
        // The date is planning context for the schedule topic. It must not
        // create a recall obligation before the student logs that lecture.
        push(items, 'units', topic, scheduledDate, 'high', evidence)
        searched.units = 'Units found'
      }
      if (scheduledDate && /\b(?:exam|midterm|final)\b/i.test(detail)) {
        push(items, 'exams', scheduleTopic(detail) || 'Exam', scheduledDate, 'high', evidence)
        searched.exams = 'Exam dates found'
      }
      const inlineDeadline = detail.match(/\(([^)]*?)\s+due\s+(\d{1,2})\/(\d{1,2})\)/i)
      if (inlineDeadline) {
        const due = numericDateToIso(inlineDeadline[2], inlineDeadline[3], yearHint)
        if (due) {
          push(items, 'deadlines', trimConnectives(inlineDeadline[1]) || 'Deadline', due, 'high', evidence)
          searched.deadlines = 'Assignment deadlines found'
        }
      } else if (/\bresponse paper\s*\d*\s+due\b/i.test(detail) && scheduledDate) {
        const label = detail.match(/\bresponse paper\s*\d*/i)?.[0] ?? 'Response paper'
        push(items, 'deadlines', label, scheduledDate, 'high', evidence)
        searched.deadlines = 'Assignment deadlines found'
      }
    }
    for (const [kind, pattern] of headers) {
      // A final-exam instruction can refer back to the class location without
      // providing a location fact of its own.
      if (kind === 'logistics' && /same location as class meetings/i.test(line)) continue
      if (pattern.test(line)) { push(items, kind, line, undefined, kind === 'policies' ? 'low' : 'high', evidence); searched[kind] = `${kind[0].toUpperCase()}${kind.slice(1)} found` }
    }
    // Registrar schedules are written in several equivalent forms (TR, T/Th,
    // Tues Thurs). Keep the exact source line as evidence, while recognizing
    // all of them as the same class-meeting fact. Office hours remain useful
    // syllabus logistics but are not class meeting metadata.
    if (
      extractClassMeetingDays(line)
      && extractClassMeetingTime(line)
      && !items.some((item) => item.kind === 'logistics' && item.evidence.location === evidence.location)
    ) {
      push(items, 'logistics', line, undefined, 'high', evidence)
      searched.logistics = 'Logistics found'
    }
  })
  // Standards are a separate pass so a numbered objective is never confused
  // with a schedule date or a scoreable assessment. Only explicit outcome/
  // objective blocks supply study topics; a course schedule remains context.
  lines.forEach((line, index) => {
    if (!STANDARD_HEADER.test(line)) return
    const inline = line.split(/[:—–-]/, 2)[1]
    const inlineLabel = inline ? standardLabel(inline) : undefined
    if (inlineLabel) push(items, 'standards', inlineLabel, undefined, 'high', lineEvidence(line, index))
    for (let next = index + 1; next < Math.min(lines.length, index + 24); next += 1) {
      const candidate = lines[next]
      if (STANDARD_HEADER.test(candidate) || /^(?:questions for students|grading|assignments?|schedule|course calendar|attendance|polic(?:y|ies)|required (?:materials?|books)|course requirements?)\b/i.test(candidate)) break
      const label = standardLabel(candidate)
      if (label) push(items, 'standards', label, undefined, 'high', lineEvidence(candidate, next))
    }
  })
  parseFlattenedSchedule(lines, items, searched, yearHint)
  if (items.some((item) => item.kind === 'standards')) searched.standards = 'Stated learning standards found'
  const scanDetected = text.replace(/\s/g, '').length < 80
  const structureFound = STRUCTURAL.filter((signal) => items.some((item) => item.kind === signal))
  const numberedItems = lines.filter((line) => /^\(?\d{1,2}[.)]\s+\S/.test(line)).length
  // Only a readable document with NO structural signal at all is called unrecognized.
  // Deliberately conservative: a one-page syllabus with just office hours still counts
  // as a syllabus, and the student can override this either way.
  const documentKind: DocumentKind = !scanDetected && structureFound.length === 0 ? 'unrecognized' : 'syllabus'
  return { sourceName, sourceKind, text, items, searched, scanDetected, documentKind, structureFound, numberedItems }
}

const SYLLABUS_KINDS: SyllabusKind[] = ['identity', 'standards', 'exams', 'weights', 'units', 'readings', 'deadlines', 'policies', 'logistics']

/** Combines related local course files into one review proposal without
 * hiding which file supplied each fact. Exact duplicate facts are shown once. */
export function mergeSyllabusProposals(proposals: SyllabusProposal[]): SyllabusProposal {
  if (!proposals.length) throw new Error('Choose at least one syllabus file to read.')
  if (proposals.length === 1) return proposals[0]

  const seen = new Set<string>()
  const items = proposals.flatMap((proposal, sourceIndex) => proposal.items.flatMap((item) => {
    const key = `${item.kind}\u0000${item.label.trim().toLowerCase()}\u0000${item.value?.trim().toLowerCase() ?? ''}`
    if (seen.has(key)) return []
    seen.add(key)
    return [{
      ...item,
      id: `source-${sourceIndex}-${item.id}`,
      evidence: { ...item.evidence, sourceName: proposal.sourceName, location: `${proposal.sourceName} · ${item.evidence.location}` },
    }]
  }))
  const searched = Object.fromEntries(SYLLABUS_KINDS.map((kind) => {
    const count = items.filter((item) => item.kind === kind).length
    return [kind, count ? `${count} found across ${proposals.length} files` : proposals[0].searched[kind]]
  })) as Record<SyllabusKind, string>

  return {
    sourceName: proposals.map((proposal) => proposal.sourceName).join(' + '),
    sourceKind: proposals[0].sourceKind,
    text: proposals.map((proposal) => proposal.text).join('\n\n'),
    items,
    searched,
    scanDetected: proposals.every((proposal) => proposal.scanDetected),
    documentKind: proposals.some((proposal) => proposal.documentKind === 'syllabus') ? 'syllabus' : 'unrecognized',
    structureFound: [...new Set(proposals.flatMap((proposal) => proposal.structureFound))],
    numberedItems: proposals.reduce((sum, proposal) => sum + proposal.numberedItems, 0),
  }
}


export async function extractSyllabusFile(file: File): Promise<SyllabusProposal> {
  const name = file.name || 'Syllabus'
  const { text, sourceKind } = await extractDocumentText(file)
  return parseSyllabusText(text, name, sourceKind)
}

export function weightGap(items: SyllabusItem[]) {
  const weights = items.filter((item) => item.kind === 'weights').map((item) => Number(item.value?.replace('%', ''))).filter(Number.isFinite)
  return weights.length ? 100 - weights.reduce((sum, weight) => sum + weight, 0) : null
}
