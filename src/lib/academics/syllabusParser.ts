import { extractDocumentText, pdfTextToLines, type DocumentExtractionOptions } from '@/lib/academics/documentText'
import { extractClassMeetingDays, extractClassMeetingTime, extractMeetingDays, isOfficeHoursLine, isPlausibleClassMeetingTime, proposePlausibleMeetingTime } from '@/lib/academics/meetingSchedule'

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
  /** A readable PDF can still contain image-only pages. Keep that distinction
   * visible so a five-page scanned schedule is never silently represented as
   * a complete parse of the surrounding text pages. */
  unreadablePageCount?: number
  imageOnlyPageCount?: number
  ocrPageCount?: number
  pageCount?: number
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
  ['logistics', /^(?:office hours|meets?|meeting|instructor|prof(?:essor)?\.?|office|room|location)\s*:|^(?=.{3,100}$).+\b(?:Hall|Center|Building)\b(?:\s+(?:Room|Rm\.?)?\s*[A-Za-z]?\d+[A-Za-z]?)?$|^(?:MWF|TR|TTH)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i],
]

const NAMED_SUBJECT_CODES: Record<string, string> = {
  anthropology: 'ANTH',
  biology: 'BIOL',
  chemistry: 'CHEM',
  english: 'ENGL',
  geography: 'GEOG',
  psychology: 'PSYC',
}

function isLikelyClassMeetingLine(line: string): boolean {
  const time = extractClassMeetingTime(line)
  if (!extractClassMeetingDays(line) || !time || !isPlausibleClassMeetingTime(time)) return false
  if (/\b(?:due|deadline|submit|quiz|assignment|assessment|office hours?|student hours?)\b/i.test(line)) return false
  return /\b(?:section|class|lectures?|meets?|meeting)\b/i.test(line)
    || /^(?:MWF|TR|TTH|TU\s*(?:\/|&|and)\s*TH|T\s*(?:\/|&|and)\s*TH)\b/i.test(line)
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

function monthDateRange(raw: string, yearHint?: number): { date?: string; remainder: string } | undefined {
  const match = raw.match(new RegExp(`^(${month})\\.?\\s+(\\d{1,2})\\s*[-–—]\\s*(?:(${month})\\.?\\s+)?(\\d{1,2})(?:\\s+(.*))?$`, 'i'))
  if (!match) return undefined
  return { date: toIsoDate(`${match[1]} ${match[2]}`, yearHint), remainder: (match[5] ?? '').trim() }
}

/** Prefer the stated academic term over unrelated publication/copyright years. */
function syllabusYearHint(text: string): number | undefined {
  const term = text.match(/\b(?:fall|autumn|spring|summer|winter)\s+(20\d{2})\b/i)
  if (term) return Number(term[1])
  const academicYear = text.match(/\b(20\d{2})\s*[-–—/]\s*20\d{2}\b/)
  if (academicYear) return Number(academicYear[1])
  return Number(text.match(/\b20\d{2}\b/)?.[0]) || undefined
}

function scheduleStart(line: string, yearHint?: number): { label: string; date?: string } | undefined {
  const match = line.match(/^((?:Introduction|Wk|Week)\s*\d*)\s*:\s*(\d{1,2})\/(\d{1,2})/i)
  if (!match) return undefined
  return { label: match[1].replace(/^Wk\b/i, 'Week').trim(), date: numericDateToIso(match[2], match[3], yearHint) }
}

function scheduleExam(line: string): string | undefined {
  const midterm = line.match(/\bmidterm(?:\s+exam)?\s*#?\s*(\d+)\b/i)
  if (midterm) return `Midterm Exam ${midterm[1]}`
  const match = line.match(/\b(?:exam|midterm)\s*#?\s*(\d+)\b/i)
  if (match) return `Exam ${match[1]}`
  if (/\bmidterm exam\b/i.test(line)) return 'Midterm Exam'
  return /\bfinal exam\b/i.test(line) ? 'Final Exam' : undefined
}

function hasExamCue(line: string): boolean {
  return /\b(?:exam|test)\b/i.test(line) || /\bmidterm\b(?!\s+group presentations?)/i.test(line)
}

function isScheduledExamLine(line: string): boolean {
  const normalized = line.replace(/\s+/g, ' ').trim()
  if (/\b(?:review (?:activity|for)|practice exam|exam score|score (?:on|for) the exam|replaced by)\b/i.test(normalized)) return false
  return /^(?:[*•]\s*)?(?:exam|midterm(?:\s+exam)?|final\s+exam)\b/i.test(normalized)
    || /^(?:\d{1,2}\s+)?\d{1,2}\/\d{1,2}\s+(?:[*•]\s*)?(?:exam|midterm(?:\s+exam)?|final\s+exam)\b/i.test(normalized)
    || /^(?:mon(?:day)?|tues(?:day)?|wed(?:nesday)?|thurs?(?:day)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b[^\n]*\b(?:exam|midterm|final)\b/i.test(normalized)
    || /^(?:your|the)\s+(?:exam|midterm|final\s+exam)\b/i.test(normalized)
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

function parseDatedScheduleRows(lines: string[], items: SyllabusItem[], searched: Record<SyllabusKind, string>, yearHint?: number) {
  const scheduleHeader = lines.findIndex((line) => /^(?:schedule for class|class schedule|course (?:schedule|calendar))/i.test(line))
  if (scheduleHeader < 0) return
  const endAt = lines.findIndex((line, index) => index > scheduleHeader && /^(?:university polic(?:y|ies)|student support|honou?r code|tips for success|required books)\b/i.test(line))
  const end = endAt < 0 ? lines.length : endAt
  const starts: Array<{ index: number; date?: string; label: string; inline: string; kind: 'weekday' | 'lesson' | 'dated-event' }> = []
  for (let index = scheduleHeader + 1; index < end; index += 1) {
    const weekday = lines[index].match(/^(?:mon(?:day)?|tues(?:day)?|wed(?:nesday)?|thurs?(?:day)?|fri(?:day)?)\.?,?\s+(\d{1,2})\/(\d{1,2})(?:\s+(.+))?$/i)
    const lesson = lines[index].match(/^(?:lesson\s*)?(\d{1,2}(?:\s*&\s*\d{1,2})?)\s+(\d{1,2})\/(\d{1,2})(?:\s+(.+))?$/i)
    const datedEvent = lines[index].match(/^[*•.\-|\s]*(\d{1,2})\/(\d{1,2})\s+(.+)$/)
    if (weekday) starts.push({ index, date: numericDateToIso(weekday[1], weekday[2], yearHint), label: `Class ${weekday[1]}/${weekday[2]}`, inline: weekday[3]?.trim() ?? '', kind: 'weekday' })
    else if (lesson) starts.push({ index, date: numericDateToIso(lesson[2], lesson[3], yearHint), label: `Lesson ${lesson[1].replace(/\s+/g, '')}`, inline: lesson[4]?.trim() ?? '', kind: 'lesson' })
    else if (datedEvent) starts.push({ index, date: numericDateToIso(datedEvent[1], datedEvent[2], yearHint), label: `Class ${datedEvent[1]}/${datedEvent[2]}`, inline: datedEvent[3].trim(), kind: 'dated-event' })
  }

  starts.forEach((row, rowIndex) => {
    const next = starts[rowIndex + 1]?.index ?? end
    const cells = [row.inline, ...lines.slice(row.index + 1, next)].filter(Boolean)
    const evidenceFor = (line: string) => {
      const offset = lines.slice(row.index, next).findIndex((candidate) => candidate.includes(line))
      return lineEvidence(offset >= 0 ? lines[row.index + offset] : lines[row.index], offset >= 0 ? row.index + offset : row.index)
    }
    const meaningful = cells.filter((cell) => !/^(?:date|topic|learning objectives?|assignments?|before class|during class|after class)$/i.test(cell))
    const topic = meaningful.find((cell) => !looksLikeReading(cell)
      && !hasExamCue(cell)
      && !/\b(?:due|submit|complete|quiz|assessment|GRQ|Mastering)\b/i.test(cell)
      && !/^[•*‣–-]/.test(cell))
    const unitLabel = row.kind === 'lesson' ? row.label : topic?.trim() || row.label
    const isAssessmentOnly = (row.kind === 'dated-event' && /^(?:[*•]\s*)?(?:exam|midterm|final exam)\b/i.test(row.inline))
      || (!topic && isScheduledExamLine(meaningful[0] ?? ''))
    if (row.date && !isAssessmentOnly && !items.some((item) => item.kind === 'units' && item.value === row.date)) {
      pushUnique(items, 'units', unitLabel, row.date, 'high', lineEvidence(lines[row.index], row.index), row.label)
      searched.units = 'Schedule scope found'
    }

    meaningful.forEach((cell) => {
      const precedingExam = lines.slice(Math.max(scheduleHeader, row.index - 3), row.index)
        .reverse()
        .map((candidate) => scheduleExam(candidate))
        .find(Boolean)
      const examCellOwnsRowDate = cell === row.inline || (cell === meaningful[0] && !topic)
      const isDatedExamHeading = examCellOwnsRowDate
        && (/^(?:[*•]\s*)?(?:(?:exam|midterm(?:\s+exam)?)\s*#?\s*\d+|final exam)\b/i.test(cell)
          || (/^exam$/i.test(cell.trim()) && Boolean(precedingExam)))
        && !/\breview\b/i.test(cell)
      if (row.date && isDatedExamHeading) {
        const examLabel = scheduleExam(cell) ?? (/^exam$/i.test(cell.trim()) ? precedingExam : undefined) ?? trimConnectives(cell)
        pushUnique(items, 'exams', examLabel, row.date, 'high', evidenceFor(cell), row.label)
        searched.exams = 'Exam dates found'
      }
      const reading = cell.match(/(?:^|\bbefore class\s*:\s*)(read\s+.+|(?:chapter|ch\.?)\s*\d+(?:\s*[-–]\s*\d+)?(?:\b.*)?)$/i)?.[1]
      if (row.date && reading && looksLikeReading(reading)) {
        pushUnique(items, 'readings', reading.trim(), row.date, 'high', evidenceFor(cell), `Due before ${row.label}`)
        searched.readings = 'Assigned readings found'
      }
      if (!row.date) return
      const beforeClass = cell.match(/\bbefore class\s*:\s*(.+)$/i)?.[1]
      const inClass = cell.match(/\b(In-Class Learning Assessment\s*\d*[^.;]*)/i)?.[1]
      if (!beforeClass && !inClass) return
      const explicit = cell.match(/\b(?:due\s*)?(\d{1,2})\/(\d{1,2})\b/i)
      const due = explicit ? numericDateToIso(explicit[1], explicit[2], yearHint) : row.date
      const label = trimConnectives((beforeClass ?? inClass ?? '').replace(/\([^)]*\)/g, '').replace(/\b(?:due\s*)?\d{1,2}\/\d{1,2}(?:\s+at\s+[^,;.]+)?/ig, '').trim())
      if (label && due) {
        pushUnique(items, 'deadlines', label, due, 'high', evidenceFor(cell), beforeClass ? `Before ${row.label}` : row.label)
        searched.deadlines = 'Assignment deadlines found'
      }
    })
  })
}

function parseWeekRangeSchedule(lines: string[], items: SyllabusItem[], searched: Record<SyllabusKind, string>, yearHint?: number) {
  const scheduleHeader = lines.findIndex((line) => /^(?:course (?:schedule|calendar)|schedule for class)/i.test(line))
  if (scheduleHeader < 0) return
  const scheduleEnd = lines.findIndex((line, index) => index > scheduleHeader && /^(?:university polic(?:y|ies)|student support|required books|course requirements)\b/i.test(line))
  const end = scheduleEnd < 0 ? lines.length : scheduleEnd
  const rows = lines
    .map((line, index) => ({ index, match: line.match(/^Week\s+(\d+)\.\s*(.+)$/i) }))
    .filter((row): row is { index: number; match: RegExpMatchArray } => row.index > scheduleHeader && row.index < end && Boolean(row.match))

  rows.forEach((row, rowIndex) => {
    const nextIndex = rows[rowIndex + 1]?.index ?? end
    const week = `Week ${row.match[1]}`
    const title = row.match[2].trim()
    const cells = lines.slice(row.index + 1, nextIndex)
    const range = cells.map((line, offset) => ({ line, offset, parsed: monthDateRange(line, yearHint) })).find((candidate) => candidate.parsed)
    if (!range) return

    const existingUnit = items.find((item) => item.kind === 'units' && item.evidence.location === `line ${row.index + 1}`)
    if (existingUnit) Object.assign(existingUnit, { label: title, value: range.parsed?.date, context: week, confidence: range.parsed?.date ? 'high' : 'low' })
    else pushUnique(items, 'units', title, range.parsed?.date, range.parsed?.date ? 'high' : 'low', lineEvidence(lines[row.index], row.index), week)
    searched.units = 'Schedule scope found'

    if (/\bgroup presentations?\b/i.test(range.parsed?.remainder ?? '')) {
      pushUnique(items, 'deadlines', range.parsed!.remainder, range.parsed?.date, range.parsed?.date ? 'high' : 'low', lineEvidence(cells[range.offset], row.index + 1 + range.offset), week)
      searched.deadlines = 'Assignment deadlines found'
    }

    const readingCells = cells.flatMap((line, offset) => {
      const parsedRange = monthDateRange(line, yearHint)
      if (parsedRange) return parsedRange.remainder ? [{ line: parsedRange.remainder, offset }] : []
      return [{ line, offset }]
    }).filter(({ line }) => !/^\d{1,2}$/.test(line)
      && !/^(?:midterm|final)?\s*group presentations?|review and conclusion|no class|fall break|thanksgiving break$/i.test(line))

    const chunks: Array<{ label: string; offset: number }> = []
    readingCells.forEach(({ line, offset }) => {
      const citationStart = /^[A-Z][^,]{1,110},\s+/.test(line) && looksLikeReading(line)
      if (citationStart || (!chunks.length && looksLikeReading(line))) chunks.push({ label: line, offset })
      else if (chunks.length) chunks[chunks.length - 1].label = `${chunks[chunks.length - 1].label} ${line}`.replace(/\s+/g, ' ').trim()
    })
    chunks.forEach((reading) => {
      pushUnique(
        items, 'readings', reading.label, range.parsed?.date,
        range.parsed?.date ? 'low' : 'low',
        lineEvidence(cells[reading.offset], row.index + 1 + reading.offset), week,
      )
    })
    if (chunks.length) searched.readings = 'Assigned readings found'
  })
}

function cleanPointCategoryLabel(raw: string): string {
  return raw
    .replace(/\s+\d+\s+entries?$/i, '')
    .replace(/\s+twice(?:\s+\(weeks?[^)]*\))?$/i, '')
    .replace(new RegExp(`\\s+${month}\\.?\\s+\\d{1,2}(?:\\s+@\\s+\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)?)?(?:\\s+\\([^)]*\\))?$`, 'i'), '')
    .replace(/[\s:–—-]+$/, '')
    .trim()
}

function parsePointBasedWeights(lines: string[], items: SyllabusItem[], searched: Record<SyllabusKind, string>) {
  const candidates: Array<{ label: string; points: number; evidence: SyllabusEvidence }> = []
  lines.forEach((line, index) => {
    if (/^\s*(?:total|100 points?)\b/i.test(line)) return
    const match = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*pts?(?:\s*\([^)]*\))?\s*$/i)
    if (!match) return
    const label = cleanPointCategoryLabel(match[1])
    if (label.length < 2) return
    candidates.push({ label, points: Number(match[2]), evidence: lineEvidence(line, index) })
  })

  const assignmentAt = lines.findIndex((line, index) => /^assignment$/i.test(line) && /^total$/i.test(lines[index + 1] ?? ''))
  if (assignmentAt >= 0) {
    let pending = ''
    for (let index = assignmentAt + 2; index < lines.length; index += 1) {
      const line = lines[index]
      if (/^100\s+points?$/i.test(line)) break
      const numeric = line.match(/^(\d+(?:\.\d+)?)(?:\s+\([^)]*\))?$/)
      if (numeric && pending) {
        candidates.push({ label: pending, points: Number(numeric[1]), evidence: { quote: `${pending} — ${line}`, location: `lines ${index}-${index + 1}` } })
        pending = ''
      } else if (!/^\d/.test(line)) pending = line
    }
  }

  const unique = [...new Map(candidates.map((candidate) => [candidate.label.toLowerCase(), candidate])).values()]
  const total = unique.reduce((sum, candidate) => sum + candidate.points, 0)
  if (!unique.length || Math.abs(total - 100) > 0.001) return
  unique.forEach((candidate) => pushUnique(items, 'weights', candidate.label, `${candidate.points}%`, 'high', candidate.evidence, '100-point course total'))
  searched.weights = 'Grade categories found'
}

function parseNumericActionDates(lines: string[], items: SyllabusItem[], searched: Record<SyllabusKind, string>, yearHint?: number) {
  lines.forEach((line, index) => {
    if (/^(?:mon(?:day)?|tues(?:day)?|wed(?:nesday)?|thurs?(?:day)?|fri(?:day)?)\b/i.test(line)) return
    if (/\boffice hours?\b/i.test(line)) return
    const nearby = lines.slice(Math.max(0, index - 4), index + 1).join(' ')
    if (/\bmake[- ]?up\b/i.test(nearby)) return
    const isExam = isScheduledExamLine(line)
    const isDeadline = /\b(?:due|deadline|submit|submission|must be completed by|must be submitted by|presentation|project|paper|response|research requirement)\b/i.test(line)
    if (!isExam && !isDeadline) return
    const matches = [...line.matchAll(/\b(\d{1,2})\/(\d{1,2})(?:\/(20\d{2}|\d{2}))?\b/g)]
    if (!matches.length) return
    const cue = line.match(/^(.{2,120}?)\s+(?:are\s+)?(?:due|must be (?:completed|submitted) by|deadline|by)\b/i)?.[1]
    const base = (isExam ? scheduleExam(line) : undefined)
      ?? (trimConnectives(cue ?? line.replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b.*$/, '')) || (isExam ? 'Exam' : 'Deadline'))
    matches.forEach((match, matchIndex) => {
      const explicitYear = match[3] ? Number(match[3].length === 2 ? `20${match[3]}` : match[3]) : yearHint
      const iso = numericDateToIso(match[1], match[2], explicitYear)
      if (!iso) return
      const kind: SyllabusKind = isExam ? 'exams' : 'deadlines'
      const label = matches.length > 1 && !isExam ? `${base} ${matchIndex + 1}` : base
      if (items.some((item) => item.kind === kind && item.value === iso)) return
      pushUnique(items, kind, label, iso, 'high', lineEvidence(line, index), isExam ? undefined : 'Syllabus deadline')
      searched[kind] = isExam ? 'Exam dates found' : 'Assignment deadlines found'
    })
  })
}

const SOURCE_SECTION = /^(Course Description(?:\s*&\s*Learning)?|Required (?:Materials|Resources|Books)|Course Materials|Textbook(?: and Digital Delivery)?|Text|Class Communication|Communication|Grading Scale|Grade Scale)(?:\s*:\s*(.*))?$/i
const SECTION_CONTAINER = /^(?:course (?:structure|design|polic(?:y|ies)|schedule|calendar|requirements?)|class policies|learning (?:outcomes?|goals?|objectives?)|course (?:goals|objectives?|outcomes?)|goals|objectives?(?: and expectations)?|general education curricula|assignments?(?: and evaluation)?|grade breakdown|grading(?: procedures)?|evaluation and grading|resources|student support|teaching assistants?|instructional assistants?|instructor|research requirement|examinations?|schedule for class.*)\s*:?$/i

/** UNC's registrar-generated syllabus template (seen identically in BIOL 103
 *  and ENGL 105) never writes the literal heading "Grading Scale". It titles
 *  the band table "Final Letter Grades for BIOL 103", or introduces it inline
 *  with "…according to the following scale:". Both files therefore imported
 *  with no grade scale at all — the one fact a student checks a syllabus for
 *  most often. */
const GRADE_SCALE_HEADER = /^(?:final letter grades(?:\s+for\b.*)?|(?:final )?letter grades? are determined according to the following scale|grad(?:e|ing) scale)\s*:?$/i

/** Same template: "Course Materials (physical and/or electronic) required for
 *  purchase", wrapped across two PDF lines. */
const MATERIALS_HEADER = /^course materials\s*\(physical and\/or electronic\)\s*required for(?:\s+purchase)?$/i

/** A letter band — `A = 93.0-100`, `A (94–100)`, `94-100 A`. Requires a real
 *  numeric range so ordinary prose mentioning a grade cannot become a scale. */
const GRADE_BAND = /(?:\b[A-F][+-]?\s*(?:=|\()\s*\d{1,3}(?:\.\d+)?\s*[-–—]\s*\d{1,3}(?:\.\d+)?|\b\d{1,3}(?:\.\d+)?\s*[-–—]\s*\d{1,3}(?:\.\d+)?\s+[A-F][+-]?\b)/

const POLICY_TITLES = [
  'Artificial Intelligence \\(AI\\) Use Policy', 'Plagiarism and the Honor Code', 'Late Submissions and Extensions',
  'Attendance and Participation', 'Policy on Non-Discrimination', 'Non-Discrimination Policy',
  'Classroom Technology Policy', 'Accessibility Resources and Services', 'Accessibility Statement',
  'Acceptable Use Policy', 'Grade Appeal Process', 'Attendance at lecture', 'Attendance Policy',
  'Make-?up exams?', 'Artificial Intelligence Policy', 'AI Policy', 'Honor Code', 'Honour Code',
  'Academic Integrity', 'Accommodations', 'Class Conduct', 'Participation', 'Late Work', 'Late Policy',
  'Email Etiquette', 'Diversity Statement', 'Title IX Resources', 'Technology', 'Mask Use',
]
const POLICY_LINE = new RegExp(`^(?:[•●*‣–-]\\s*)?(${POLICY_TITLES.join('|')})(?:(?:\\s*:\\s*|\\s+)(.*))?$`, 'i')

function normalizePolicyTitle(raw: string): string {
  if (/^attendance at lecture$/i.test(raw)) return 'Attendance'
  if (/^artificial intelligence \(AI\) use policy$/i.test(raw)) return 'AI use policy'
  if (/^artificial intelligence policy$/i.test(raw)) return 'AI Policy'
  if (/^honour code$/i.test(raw)) return 'Honor Code'
  return raw.replace(/\s+/g, ' ').trim()
}

function policyLine(line: string): { title: string; inline: string } | undefined {
  const match = line.match(POLICY_LINE)
  if (!match) return undefined
  const bullet = /^[•●*‣–-]\s*/.test(line)
  const afterTitle = line.replace(/^[•●*‣–-]\s*/, '').slice(match[1].length)
  const genericTitle = /^(?:Participation|Accommodations|Technology)$/i.test(match[1])
  // Body prose such as "participation grade" or "Accommodations are
  // determined" is not a new heading. Those broad one-word labels require a
  // bullet, a colon, or a standalone heading.
  if (genericTitle && match[2] && !bullet && !/^\s*:/.test(afterTitle)) return undefined
  return { title: normalizePolicyTitle(match[1]), inline: (match[2] ?? '').trim() }
}

/** `6. Unit Exams (48% of course grade):` — a registrar-style syllabus writes
 *  its grade breakdown as a numbered list of components. Each one opens a new
 *  fact, so a preceding policy body must stop here instead of swallowing it
 *  (the BIOL 103 make-up-exam policy ran on into the final-exam weight). */
const GRADE_COMPONENT_HEADING = /^\d{1,2}\.\s+.{2,90}?\(\d{1,3}(?:\.\d+)?%\s+of\s+(?:your\s+)?course grade\)/i

/** `allowAllCaps: false` keeps the generic "a short all-caps line is a
 *  heading" fallback out of a body whose real content is typeset in caps.
 *  The registrar template prints its required text as `MASTERINGBIOLOGY WITH
 *  ETEXT STUDENT`, which the fallback claimed as a new section — so the
 *  materials block imported empty. */
function isSectionBoundary(line: string, allowAllCaps = true): boolean {
  if (SOURCE_SECTION.test(line) || SECTION_CONTAINER.test(line) || policyLine(line)) return true
  if (GRADE_COMPONENT_HEADING.test(line) || GRADE_SCALE_HEADER.test(line) || MATERIALS_HEADER.test(line)) return true
  if (STANDARD_HEADER.test(line) || OPERATIONAL_SECTION.test(line)) return true
  if (/^(?:Mandatory Disclaimer|SCHEDULE FOR CLASS|COURSE SCHEDULE|UNIVERSITY POLIC(?:Y|IES)|INFORMATION FOR UNDERGRADUATE CLASSES|Instructional Assistants?|Teaching Assistants?|Exam Review|Class Participation|Discussion Forums?|Response Papers?|Final Grade|Undergraduate Testing Center|Learning Center|Writing Center|Counseling and Psychological Services)\b/i.test(line)) return true
  if (!allowAllCaps) return false
  const letters = line.replace(/[^A-Za-z]/g, '')
  return line.length <= 100 && letters.length >= 4 && letters === letters.toUpperCase()
}

/** `ARS-eligible students: If you are eligible for…` — a syllabus introduces a
 *  new topic with a short label and a colon, without ever making it a formal
 *  heading. The PSYC 101 make-up-exam policy ran straight through the ARS
 *  accommodation rules and the exam-review workflow before the line cap cut it
 *  mid-sentence, so review offered one unreadable blob to save.
 *
 *  Kept deliberately narrow: at most seven words, no terminal punctuation
 *  inside the label, and real content after the colon. */
const HEADED_SUBSECTION = /^(?:[•●*‣-]\s*)?([A-Z][A-Za-z0-9&/'’()-]*(?:[ -][A-Za-z0-9&/'’()-]+){0,6})\s*:\s+(?=\S)(?=.{15,})/

/** Never hand the student a body that stops mid-word because the scan hit its
 *  line cap. Fall back to the last complete sentence; if there isn't one, keep
 *  what we have rather than inventing an ending. */
function trimToSentence(value: string): string {
  const cut = value.search(/[.!?](?=[^.!?]*$)/)
  return cut > 40 ? value.slice(0, cut + 1) : value
}

function parsePolicySections(lines: string[], items: SyllabusItem[], searched: Record<SyllabusKind, string>) {
  const claimed = standardLines(items)
  lines.forEach((line, index) => {
    const match = policyLine(line)
    if (!match) return
    // Segment the run so each headed sub-section becomes its own policy rather
    // than disappearing into — or being dropped from — the one above it.
    const segments: Array<{ title: string; start: number; body: string[] }> = [
      { title: match.title, start: index, body: match.inline ? [match.inline] : [] },
    ]
    const cap = Math.min(lines.length, index + 40)
    let truncated = true
    for (let next = index + 1; next < cap; next += 1) {
      if (isSectionBoundary(lines[next]) || claimed.has(next + 1)) { truncated = false; break }
      const heading = lines[next].match(HEADED_SUBSECTION)
      if (heading && heading[1].length <= 60) {
        segments.push({ title: heading[1].trim(), start: next, body: [lines[next].slice(heading[0].length).trim()] })
        continue
      }
      segments[segments.length - 1].body.push(lines[next])
    }

    segments.forEach((segment, order) => {
      const isTail = order === segments.length - 1
      const joined = segment.body.join(' ').replace(/\s+/g, ' ').trim()
      // A bare trailing digit is the PDF page number, not part of the policy.
      const cleaned = joined.replace(/\s+\d{1,3}$/, '')
      const value = isTail && truncated ? trimToSentence(cleaned) : cleaned
      const end = segment.start + Math.max(1, segment.body.length)
      pushUnique(items, 'policies', segment.title, value || undefined, value ? 'high' : 'low', {
        quote: [lines[segment.start], ...segment.body.slice(order === 0 && match.inline ? 1 : 1)].join(' ').replace(/\s+/g, ' ').trim(),
        location: end === segment.start + 1 ? `line ${segment.start + 1}` : `lines ${segment.start + 1}-${end}`,
      }, 'Course policy')
    })
    searched.policies = 'Course policies and boundaries found'
  })
}

/** Lines the standards pass already claimed as stated learning outcomes.
 *  Prose sections must stop there: a course description that runs on through
 *  every objective bullet becomes a 2,400-character blob in review, and the
 *  same sentences are then shown twice under two different headings. */
function standardLines(items: SyllabusItem[]): Set<number> {
  return new Set(items
    .filter((item) => item.kind === 'standards')
    .map((item) => Number(item.evidence.location.match(/\d+/)?.[0]))
    .filter((line) => Number.isFinite(line)))
}

function parseSourceBackedSections(lines: string[], items: SyllabusItem[], searched: Record<SyllabusKind, string>) {
  const claimed = standardLines(items)
  lines.forEach((line, index) => {
    const match = line.match(SOURCE_SECTION)
    if (!match) return
    const rawTitle = match[1]
    const inline = (match[2] ?? '').trim()
    const body = inline ? [inline] : []
    for (let next = index + 1; next < Math.min(lines.length, index + 40); next += 1) {
      if (isSectionBoundary(lines[next]) || claimed.has(next + 1)) break
      body.push(lines[next])
    }
    const value = body.join(' ').replace(/\s+/g, ' ').trim()
    if (!value) return
    const isDescription = /^Course Description/i.test(rawTitle)
    const isMaterial = /Materials|Resources|Books|Text/i.test(rawTitle)
    const isGradeScale = /Grading Scale|Grade Scale/i.test(rawTitle)
    const label = isDescription ? 'Course description' : isMaterial ? 'Required materials' : isGradeScale ? 'Grade scale' : 'Communication'
    const context = isDescription ? 'Course context' : isMaterial ? 'Course material' : 'Course operations'
    pushUnique(items, 'logistics', label, value, 'high', { quote: [line, ...body.slice(inline ? 1 : 0)].join(' ').replace(/\s+/g, ' ').trim(), location: `lines ${index + 1}-${index + Math.max(1, body.length)}` }, context)
    searched.logistics = 'People, meeting details, support, and course context found'
  })
}

/** Reads the two registrar-template sections `parseSourceBackedSections` cannot
 *  see, because their headings are prose rather than the literal `Grading
 *  Scale:` / `Required Materials:` labels. Both are recorded as source-backed
 *  course context, never as scoreable work. */
function parseRegistrarSections(lines: string[], items: SyllabusItem[], searched: Record<SyllabusKind, string>) {
  lines.forEach((line, index) => {
    const isScale = GRADE_SCALE_HEADER.test(line)
    const isMaterials = MATERIALS_HEADER.test(line)
    // The materials heading wraps mid-phrase in the PDF text layer; the
    // continuation line is the rest of the heading, not the first material.
    const wrapped = isMaterials && /required for$/i.test(line) && /^purchase$/i.test(lines[index + 1] ?? '')
    if (!isScale && !isMaterials) return
    const body: string[] = []
    for (let next = index + (wrapped ? 2 : 1); next < Math.min(lines.length, index + 24); next += 1) {
      // A band row is content, and must be tested before the heading rules:
      // `A (94–100) A- (90–93) B+ (87–89)` is all-caps once punctuation and
      // digits are stripped, so the generic all-caps heading check claimed the
      // ENGL 105 scale as a section boundary and the scale imported empty.
      const isBand = GRADE_BAND.test(lines[next])
      if (!isBand && isSectionBoundary(lines[next], !isMaterials)) break
      // A grade scale is only its bands. The sentence after them belongs to
      // whatever follows, and dragging it in produced a paragraph where the
      // student expected a table.
      if (isScale && !isBand) { if (body.length) break; continue }
      body.push(lines[next])
    }
    const value = body.join(' ').replace(/\s+/g, ' ').trim()
    if (!value) return
    pushUnique(
      items, 'logistics', isScale ? 'Grade scale' : 'Required materials', value, 'high',
      { quote: [line, ...body].join(' ').replace(/\s+/g, ' ').trim(), location: `lines ${index + 1}-${index + body.length + (wrapped ? 2 : 1)}` },
      isScale ? 'Course operations' : 'Course material',
    )
    searched.logistics = 'People, meeting details, support, and course context found'
  })
}

function parseStaffContacts(lines: string[], items: SyllabusItem[], searched: Record<SyllabusKind, string>) {
  const assistantsAt = lines.findIndex((line) => /^(?:Teaching|Instructional) Assistants?\s*:?/i.test(line))
  const nextSection = assistantsAt < 0 ? -1 : lines.findIndex((line, index) => index > assistantsAt
    && isSectionBoundary(line)
    && !/^(?:office hours?|sections?|instructor)\b/i.test(line))
  const assistantsEnd = assistantsAt < 0 ? -1 : nextSection < 0 ? lines.length : nextSection
  const inAssistantSection = (index: number) => assistantsAt >= 0 && index > assistantsAt && index < assistantsEnd

  if (assistantsAt >= 0) {
    lines.slice(assistantsAt + 1, assistantsEnd).forEach((line, offset) => {
      const absoluteIndex = assistantsAt + 1 + offset
      const professorLine = /\b(?:Dr\.?|Professor|Prof\.?)\b/i.test(line)
        || /^Instructor\s*:?$/i.test(lines[absoluteIndex - 1] ?? '')
      if (professorLine) return
      for (const match of line.matchAll(/([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){1,3})\s*[·∙]\s*([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/g)) {
        pushUnique(items, 'logistics', match[1].trim(), match[2], 'high', lineEvidence(line, absoluteIndex), 'Teaching assistant')
      }
      let cursor = 0
      for (const match of line.matchAll(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g)) {
        const segment = line.slice(cursor, match.index).trim()
        const name = segment.match(/([^·∙]{2,80})\s*[·∙]\s*$/)?.[1]?.trim()
        if (name) pushUnique(items, 'logistics', name, match[0], 'high', lineEvidence(line, absoluteIndex), 'Teaching assistant')
        cursor = (match.index ?? 0) + match[0].length
      }
    })
    const names = lines.slice(assistantsAt + 1, assistantsEnd)
      .map((line, offset) => ({ match: line.match(/^Name\s*:\s*(.{2,80})$/i), index: assistantsAt + 1 + offset }))
      .filter((entry): entry is { match: RegExpMatchArray; index: number } => Boolean(entry.match))
    const emails = lines.slice(assistantsAt + 1, assistantsEnd)
      .flatMap((line, offset) => [...line.matchAll(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g)].map((match) => ({ email: match[0], index: assistantsAt + 1 + offset })))
    names.forEach((name, position) => {
      const email = emails[position]
      pushUnique(items, 'logistics', name.match[1].trim(), email?.email, email ? 'high' : 'low', {
        quote: email ? `${lines[name.index]} · ${lines[email.index]}` : lines[name.index],
        location: email ? `lines ${name.index + 1}-${email.index + 1}` : `line ${name.index + 1}`,
      }, 'Teaching assistant')
    })
  }

  lines.forEach((line, index) => {
    const email = line.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0]
    if (!email) return
    const rawName = line.slice(0, line.indexOf(email)).replace(/(?:Instructor|Professor|Prof\.?|Teaching Assistant|TA)\s*:?/ig, '').replace(/[·∙|(<\s]+$/, '').trim()
    if (!rawName || /^(?:class email(?: account)?|email|course email(?: account)?)\s*:?$/i.test(rawName)) return
    const professor = /\b(?:Dr\.?|Professor|Prof\.?)(?=\s)/i.test(line)
      || lines.slice(Math.max(0, index - 2), index).some((candidate) => /^Instructor\s*:?$/i.test(candidate))
    if (!professor && !inAssistantSection(index)) return
    const details: string[] = [email]
    for (let next = index + 1; next < Math.min(lines.length, index + 5); next += 1) {
      if (/^[^@]{1,70}@[\w.-]+\.[A-Za-z]{2,}/.test(lines[next]) || /^(?:Instructor|Teaching Assistants?|Course Description|Assignments?|Course Policies)\s*:?$/i.test(lines[next])) break
      if (/office hours?|\b(?:Mon|Tue|Wed|Thu|Fri)\b|\b(?:Hall|Center|Library|Zoom)\b/i.test(lines[next])) details.push(lines[next])
    }
    const label = professor ? `Instructor: ${rawName}` : rawName
    const existingAssistant = !professor && items.find((item) => item.kind === 'logistics' && item.context === 'Teaching assistant' && item.label.toLowerCase() === label.toLowerCase())
    if (existingAssistant) {
      existingAssistant.value = details.join(' · ')
      existingAssistant.evidence = lineEvidence(line, index)
      return
    }
    pushUnique(items, 'logistics', label, details.join(' · '), 'high', lineEvidence(line, index), professor ? 'Professor' : 'Teaching assistant')
    searched.logistics = 'People, meeting details, support, and course context found'
  })
}

/** A header block writes the instructor's name and their email on separate
 *  lines:
 *
 *      Professor: Dr. Emily Weber (she/her)
 *      Email: emily_weber@UNC.edu
 *
 *  `parseStaffContacts` only ever reads a name and address that share one line,
 *  so both BIOL 103 and PSYC 101 imported with the instructor's email dropped
 *  entirely. Look ahead a few lines from the name, and stop at anything that
 *  starts a different person or section so a support address can never be
 *  attributed to staff. */
function parseHeaderInstructor(lines: string[], items: SyllabusItem[], searched: Record<SyllabusKind, string>) {
  lines.forEach((line, index) => {
    const match = line.match(/^(?:Instructor|Professor)s?\s*:\s*(.{2,80})$/i)
    if (!match || /[\w.+-]+@[\w.-]+/.test(line)) return
    const name = match[1].replace(/\s*\([^)]*\)\s*$/, '').trim()
    if (!name) return

    const details: string[] = []
    let lastLine = index
    for (let next = index + 1; next < Math.min(lines.length, index + 5); next += 1) {
      const candidate = lines[next]
      if (/^(?:Instructor|Professor|Teaching Assistants?|Instructional Assistants?)\s*:/i.test(candidate)) break
      // An `Office Hours:` line is an operational section elsewhere, but inside
      // the header block it is this instructor's own. Treating it as a boundary
      // stopped the lookahead one line short of the email in both PSYC 101 and
      // BIOL 103, and left the hours floating unattributed in review.
      const hours = candidate.match(/^Office Hours?\s*:\s*(.{2,120})$/i)?.[1]
      if (!hours && isSectionBoundary(candidate)) break
      const email = candidate.match(/^Email\s*:\s*([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})\s*$/i)?.[1]
      const office = candidate.match(/^Office\s*:\s*(.+)$/i)?.[1]
      if (!email && !office && !hours) continue
      details.push(email ?? (office ? `Office: ${office}` : `Office hours: ${hours}`))
      lastLine = next
    }
    if (!details.length) return

    const label = `Instructor: ${name}`
    const existing = items.find((item) => item.kind === 'logistics' && item.context === 'Professor'
      && item.label.toLowerCase() === label.toLowerCase())
    if (existing) {
      if (!existing.value) existing.value = details.join(' · ')
      return
    }
    pushUnique(items, 'logistics', label, details.join(' · '), 'high', {
      quote: lines.slice(index, lastLine + 1).join(' ').replace(/\s+/g, ' ').trim(),
      location: lastLine === index ? `line ${index + 1}` : `lines ${index + 1}-${lastLine + 1}`,
    }, 'Professor')
    searched.logistics = 'People, meeting details, support, and course context found'
  })
}

const COUNT_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
}

/** PSYC 101 states "There are three instructional assistants" and then names
 *  four. Both facts are in the source, so neither is ours to correct: keep
 *  every assistant row, and raise the disagreement as its own low-confidence
 *  row pointing at the sentence that makes the claim. */
function parseAssistantCountConflict(lines: string[], items: SyllabusItem[]) {
  const listed = items.filter((item) => item.kind === 'logistics' && item.context === 'Teaching assistant').length
  if (!listed) return
  lines.forEach((line, index) => {
    const match = line.match(/\bthere\s+(?:are|is)\s+(\w+)\s+(?:instructional|teaching)\s+assistants?\b/i)
    if (!match) return
    const stated = COUNT_WORDS[match[1].toLowerCase()] ?? Number(match[1])
    if (!Number.isFinite(stated) || stated === listed) return
    pushUnique(
      items, 'logistics', 'Assistant count needs review',
      `The syllabus says ${match[1].toLowerCase()} instructional assistants but names ${listed}. All ${listed} are kept below.`,
      'low', lineEvidence(line, index), 'Source conflict',
    )
  })
}

function parseCourseDetails(lines: string[], items: SyllabusItem[], searched: Record<SyllabusKind, string>) {
  const identity = items.find((item) => item.kind === 'identity')
  if (identity && /^\d{2,3}\s*(?:[·∙|,;-]\s*)?(?:(?:Fall|Spring|Summer|Winter)\s+20\d{2})?$/i.test(identity.value ?? '')) {
    const identityLine = Number(identity.evidence.location.match(/\d+/)?.[0]) - 1
    const title = lines.slice(Math.max(0, identityLine - 3), identityLine).reverse().find((candidate) => (
      candidate.length >= 5
      && !/\b(?:Fall|Spring|Summer|Winter)\s+20\d{2}\b/i.test(candidate)
      && !/\b[A-Z]{2,5}\s*\d{2,4}\b/.test(candidate)
      && !/^University of North Carolina/i.test(candidate)
      && !/^UNC Chapel Hill(?:\s+Instructor)?$/i.test(candidate)
    ))
    if (title) identity.value = title.replace(/\s+UNC Chapel Hill\s*$/i, '').trim()
  }

  const explicitSection = lines.map((line, index) => ({ line, index, match: line.match(/^Section\b\s*:?\s*(\d{1,4}[A-Za-z]?)\b/i) })).find((entry) => entry.match)
  const codeSection = lines.map((line, index) => ({ line, index, match: line.match(/\b[A-Z]{2,5}\s*\d{2,4}[A-Z]?-([A-Za-z0-9]{2,4})\b/) })).find((entry) => entry.match)
  const dottedSection = lines.map((line, index) => ({ line, index, match: line.match(/\b(?:[A-Z]{2,5}|[A-Za-z]{4,})\s*\d{2,4}[A-Z]?\.(\d{1,4}[A-Za-z]?)\b/) })).find((entry) => entry.match)
  const section = explicitSection ?? codeSection ?? dottedSection
  if (section?.match) {
    pushUnique(items, 'logistics', 'Section', section.match[1], 'high', lineEvidence(section.line, section.index), 'Course detail')
  }

  const credits = lines.map((line, index) => ({ line, index, match: line.match(/^(?:Credit Hours?|Credits?)\s*:?\s*(\d+(?:\.\d+)?)\b/i) })).find((entry) => entry.match)
  if (credits?.match) {
    pushUnique(items, 'logistics', 'Credits', credits.match[1], 'high', lineEvidence(credits.line, credits.index), 'Course detail')
  }
  if (section || credits) searched.logistics = 'People, meeting details, support, and course context found'
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
    const next = out.replace(/[\s,]*\b(?:due|on|by|is|at|scheduled|held)\b[\s,]*$/i, '').replace(/[—:–-]+$/, '').trim()
    if (next === out) return out
    out = next
  }
}

function lineEvidence(line: string, index: number): SyllabusEvidence {
  return { quote: line.trim(), location: `line ${index + 1}` }
}

/** A PDF page footer is layout furniture, not syllabus content. Left in, it
 *  lands inside section bodies ("...collecting and interpreting data; Page 2 of
 *  6 • Evaluate science-related claims...") and inside the evidence quote the
 *  student reads to check our work. */
const PAGE_FOOTER = /^page\s+\d{1,3}\s+of\s+\d{1,3}$/i

function normalizeExtractedLine(line: string): string {
  if (PAGE_FOOTER.test(line.trim())) return ''
  return line
    .replace(/\barti\s+fi\s+cial\b/gi, 'artificial')
    .replace(/\bof\s+fi\s+ce\b/gi, 'office')
    .replace(/\bcon\s+fi\s+dential(?:ity)?\b/gi, (value) => value.toLowerCase().includes('ity') ? 'confidentiality' : 'confidential')
    .replace(/\bfi\s+lms\b/gi, 'films')
    .replace(/\bfi\s+nancial\b/gi, 'financial')
    .replace(/\bde\s+fi\s+ning\b/gi, 'defining')
    .replace(/\s+/g, ' ')
    .trim()
}
function push(items: SyllabusItem[], kind: SyllabusKind, label: string, value: string | undefined, confidence: 'high' | 'low', evidence: SyllabusEvidence, context?: string) {
  items.push({ id: `${kind}-${items.length}`, kind, label, value, context, confidence, evidence })
}

const STANDARD_HEADER = /^(?:goals|objectives? and expectations?|learning (?:objectives?|outcomes?|standards?|goals?)|student learning outcomes?|course (?:learning )?(?:objectives?|outcomes?|goals?)|our course goals|these are the learning outcomes)\b/i
const STANDARD_ITEM = /^(?:[•●*‣–-]|\(?\d{1,2}[.)])\s+(.+)$/

const GENERIC_OUTCOMES_HEADER = /^(?:these are the learning outcomes (?:that are )?expected .*?(?:general education|FC-|IDEAs)|learning outcomes for (?:a )?(?:focus capacit(?:y|ies)|general education|FC-|IDEAs))\b/i

const STANDARD_SECTION_END = /^(?:these are the learning outcomes|learning outcomes for (?:a )?(?:focus capacit(?:y|ies)|general education|FC-|IDEAs)|general education curricula|course (?:structure|design|polic(?:y|ies))|evaluation and grading|examinations?|questions for students|grading|assignments?(?: and evaluation)?|schedule|course calendar|attendance|polic(?:y|ies)|required (?:materials?|resources?|books)|course materials?|course requirements?|instructional assistants?|teaching assistants?|instructor|research requirement|class website|communication|office hours)\b/i

function standardBullet(lines: string[], index: number): { label: string; lastIndex: number } | undefined {
  const match = lines[index].match(STANDARD_ITEM)
  if (!match) return undefined
  const parts = [match[1]]
  let lastIndex = index
  for (let next = index + 1; next < Math.min(lines.length, index + 12); next += 1) {
    const continuation = lines[next]
    if (STANDARD_ITEM.test(continuation) || STANDARD_HEADER.test(continuation) || STANDARD_SECTION_END.test(continuation)) break
    if (!/^[a-z(]/.test(continuation) || /:$/.test(parts.at(-1) ?? '')) break
    parts.push(continuation)
    lastIndex = next
  }
  const label = parts.join(' ').replace(/\s+/g, ' ').trim()
  return /^(?:what|how|why|when|where|who)\b/i.test(label) || /\?$/.test(label) ? undefined : { label, lastIndex }
}

function standardLabel(line: string): string | undefined {
  const bullet = line.match(STANDARD_ITEM)?.[1] ?? line.match(/^(?:students? (?:will|should)|by the end of (?:this )?(?:course|class),? (?:students? )?(?:will|should)|understand|demonstrate|classify|translate|assess|recognize|interrogate|employ|explain|apply|analyze|evaluate|describe|identify|compare|distinguish|relate|connect|curate|gain|acquire|develop|engage|frame|respond|write|conduct|discuss|compose|review|master)\b[:\s-]*(.+)?/i)?.[0]
  if (!bullet) return undefined
  const label = bullet.replace(/^(?:students? (?:will|should)\s+|by the end of (?:this )?(?:course|class),?\s*(?:students? )?(?:will|should)\s+)/i, '').replace(/\s+/g, ' ').trim()
  return label.length >= 8 && !/^(?:what|how|why|when|where|who)\b/i.test(label) && !/\?$/.test(label) ? label : undefined
}

const OPERATIONAL_SECTION = /^(Research Requirement|Class Website|Office Hours|Communicating with Your Instructor and IAs|Counseling and Psychological Services|Undergraduate Testing Center|(?:The )?Learning Center|(?:The )?Writing Center)(?:\s*:\s*(.*))?$/i

function sectionEvidence(lines: string[], index: number, maxLines = 5): SyllabusEvidence {
  const block = [lines[index]]
  for (let next = index + 1; next < Math.min(lines.length, index + maxLines); next += 1) {
    if (isSectionBoundary(lines[next])) break
    block.push(lines[next])
  }
  return { quote: block.join(' ').replace(/\s+/g, ' ').trim(), location: `lines ${index + 1}-${index + block.length}` }
}

function pushUnique(items: SyllabusItem[], kind: SyllabusKind, label: string, value: string | undefined, confidence: 'high' | 'low', evidence: SyllabusEvidence, context?: string) {
  const key = `${kind}\u0000${label.trim().toLowerCase()}\u0000${value?.trim().toLowerCase() ?? ''}`
  if (items.some((item) => `${item.kind}\u0000${item.label.trim().toLowerCase()}\u0000${item.value?.trim().toLowerCase() ?? ''}` === key)) return
  push(items, kind, label, value, confidence, evidence, context)
}

function parseOperationalContext(lines: string[], items: SyllabusItem[], searched: Record<SyllabusKind, string>) {
  const classEmail = lines.map((line, index) => ({ line, index })).find(({ line }) => /^Class Email\s*:/i.test(line))
  if (classEmail) {
    const email = classEmail.line.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0]
    pushUnique(items, 'logistics', 'Class email', email, email ? 'high' : 'low', lineEvidence(classEmail.line, classEmail.index), 'Course contact')
  }

  const assistantsAt = lines.findIndex((line) => /^Instructional Assistants\s*:/i.test(line))
  if (assistantsAt >= 0) {
    for (let index = assistantsAt + 1; index < Math.min(lines.length, assistantsAt + 14); index += 1) {
      const match = lines[index].match(/^[•*‣–-]\s*([^:]{2,50})\s*:\s*(.+)$/)
      if (!match) continue
      pushUnique(items, 'logistics', match[1].trim(), match[2].trim(), 'high', lineEvidence(lines[index], index), 'Teaching assistant')
    }
  }

  lines.forEach((line, index) => {
    const match = line.match(OPERATIONAL_SECTION)
    if (!match) return
    const title = match[1].replace(/^The\s+/i, '')
    if (/^Research Requirement$/i.test(title)) {
      const evidence = sectionEvidence(lines, index, 12)
      const explicitlyDueByLastClass = /\bby (?:the )?last (?:day of class|class(?: meeting)?)\b/i.test(evidence.quote)
      const lastClassDate = explicitlyDueByLastClass
        ? items
          .filter((item) => item.kind === 'units' && /^20\d{2}-\d{2}-\d{2}$/.test(item.value ?? ''))
          .map((item) => item.value as string)
          .sort()
          .at(-1)
        : undefined
      pushUnique(items, 'deadlines', 'Research requirement', lastClassDate, lastClassDate ? 'high' : 'low', evidence, 'Course requirement')
      searched.deadlines = 'Assignment deadlines found'
      return
    }
    if (/^Office Hours$/i.test(title)) return
    const evidence = sectionEvidence(lines, index)
    const inline = (match[2] ?? '').trim()
    const value = evidence.quote.replace(lines[index], inline).replace(/\s+/g, ' ').trim()
    pushUnique(items, 'logistics', title, value || undefined, value ? 'high' : 'low', evidence, 'Support resource')
  })

  if (items.some((item) => item.kind === 'logistics' && item.context)) searched.logistics = 'People, meeting details, and support found'
}

/** The header sweep emits a raw line for anything shaped like `Office:` /
 *  `Office Hours:` / a building name, before the scoped passes know who those
 *  facts belong to. Once `parseStaffContacts` and `parseOperationalContext`
 *  have attributed them, the raw copies are duplicates with no owner: ANTH 147
 *  reviewed with eleven of them (`Office: TBD`, `Office Hours:`, `Office: TBA`)
 *  sitting beside the four correctly-scoped TAs, and every support centre
 *  appeared twice — once as a nameless "location", once with its real body.
 *
 *  Nothing attributable is dropped. A row survives unless the same text is
 *  already carried by an item that says whose fact it is, or the row states no
 *  fact at all. Survivors gain a context so review never shows a bare string.
 */
function pruneRedundantLogistics(items: SyllabusItem[]): SyllabusItem[] {
  const scoped = items.filter((item) => item.kind === 'logistics' && item.context)
  const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim()
  const stub = /^(?:office hours?|office|room|location|instructor|meets?|meeting)\s*:?\s*(?:TBD|TBA|N\/A|none)?$/i
  const ROOM = /\b(?:hall|center|centre|building|room|rm\.?|library|annex|auditorium)\b/i

  /** A raw row may share its source line with a scoped contact and still be the
   *  only carrier of a fact — the ANTH 147 header line supplies both the
   *  professor's email and `T & TH 5:00-6:15`, and its office line is where the
   *  classroom `0121 Hanes Art Center` actually comes from. Deduplicate only
   *  rows that add no room and no meeting schedule of their own. */
  const carriesOwnFact = (label: string) => ROOM.test(label)
    || Boolean(extractMeetingDays(label) && extractClassMeetingTime(label))

  const instructors = items.filter((item) => item.kind === 'logistics' && item.context === 'Professor')
  const assistants = items.filter((item) => item.kind === 'logistics' && item.context === 'Teaching assistant')
  const instructorName = (label: string) => label.replace(/^Instructor:\s*/i, '').replace(/[,.]$/, '').trim()
  const hoursAlreadyScoped = scoped.some((item) => /office hours/i.test(item.value ?? ''))

  /** A repeated `Office Hours:` line that names no day or time restates a
   *  schedule already recorded against a person. PSYC 101 wrote its hours once
   *  in the header and again as prose twelve pages later; review showed both,
   *  the second one marked unattributed even though the source says "visit me". */
  const restatesScopedHours = (label: string) => isOfficeHoursLine(label)
    && hoursAlreadyScoped
    && !(extractMeetingDays(label) && /\d/.test(label))

  return items.filter((item) => {
    if (item.kind !== 'logistics' || item.value || item.context) return true
    const label = normalize(item.label)
    if (stub.test(item.label.trim())) return false
    if (scoped.some((other) => normalize(other.label) === label)) return false
    // A raw `Professor: …` header row duplicates the scoped contact built from
    // the same block, which additionally carries the email and office.
    if (/^(?:instructor|professor)s?\s*:/i.test(item.label)
      && instructors.some((other) => label.includes(normalize(instructorName(other.label))))) return false
    if (restatesScopedHours(item.label)) return false
    if (carriesOwnFact(item.label)) return true
    if (scoped.some((other) => other.evidence.location === item.evidence.location)) return false
    return !scoped.some((other) => other.value && normalize(other.value).includes(label))
  }).map((item) => {
    if (item.kind !== 'logistics' || item.value || item.context) return item
    if (isOfficeHoursLine(item.label)) {
      // Only claim these are the instructor's when nobody else in the document
      // holds office hours. ANTH 147 lists four TAs with their own hours, and
      // naming the professor on those rows would state something the syllabus
      // does not — a worse error than leaving them unattributed.
      const attributable = instructors.length === 1 && !assistants.length
      return {
        ...item,
        context: attributable
          ? `Office hours · ${instructorName(instructors[0].label)}`
          : 'Office hours — the source does not say whose',
      }
    }
    if (/^office\s*:/i.test(item.label)) return { ...item, context: 'Office location' }
    return item
  })
}

/** A key-free parser. It deliberately proposes only regular, attributable facts. */
export function parseSyllabusText(text: string, sourceName = 'Pasted syllabus', sourceKind: SyllabusProposal['sourceKind'] = 'text'): SyllabusProposal {
  const lines = text.replace(/\r/g, '').split('\n').map(normalizeExtractedLine).filter(Boolean)
  const items: SyllabusItem[] = []
  const searched: Record<SyllabusKind, string> = {
    identity: 'No course identity found', standards: 'No stated learning standards found', exams: 'No exam dates found', weights: 'No grade categories found', units: 'No week or unit headings found', readings: 'No assigned readings found', deadlines: 'No assignment deadlines found', policies: 'No attendance, late, drop, or replacement policy found', logistics: 'No meeting, instructor, or office-hours details found',
  }
  // Syllabi date the term at the top (`Fall 2026`) and then write `Oct 6`.
  const yearHint = syllabusYearHint(text)
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
      const subjectCode = NAMED_SUBJECT_CODES[subject.toLowerCase()]
      if (!subjectCode) return
      const code = `${subjectCode} ${namedCourse[2]}`
      push(items, 'identity', code, namedCourse[3].trim(), 'high', evidence)
      searched.identity = 'Course identity found'
    }
    const pointsWeight = !/^total\b/i.test(line) && line.match(/^(.{2,100}?)\s*(?:x\s*\d+(?:\.\d+)?\s*pts?\s*each\s*:\s*)?\d+(?:\.\d+)?\s*pts?\s*\((\d{1,3}(?:\.\d+)?)%\)\s*$/i)
    const directCandidate = !pointsWeight && !/^total\b/i.test(line) ? line.match(/^(.{2,60}?)\s*[-:–]?\s*(\d{1,3}(?:\.\d+)?)\s*%/i) : null
    const directWeight = directCandidate && (
      /^\d+\.\s+/.test(line)
      || /%\s*;\s*\d+(?:\.\d+)?\s*points?/i.test(line)
      || /^.{2,60}\s+[-:–—]\s*\d{1,3}(?:\.\d+)?%\s*$/i.test(line)
      || /^[A-Z].{1,60}\s+\d{1,3}(?:\.\d+)?%\s*$/.test(line)
    ) ? directCandidate : null
    const weight = pointsWeight ?? directWeight
    if (weight) {
      const label = weight[1].replace(/^\d+\.\s*/, '').replace(/[\s(:–—-]+$/, '').trim()
      push(items, 'weights', label, `${weight[2]}%`, 'high', evidence)
      searched.weights = 'Grade categories found'
    }
    const date = line.match(datePattern)
    if (date && !monthDateRange(line, yearHint)) {
      // Publication dates inside citations are source metadata, not course
      // deadlines. Dated facts need an operational cue before becoming work.
      const isExam = isScheduledExamLine(line)
      const isDeadline = /\b(?:due|deadline|submit|submission|quiz|assignment|paper|response|presentation|project)\b/i.test(line)
      if (!isExam && !isDeadline) return
      const kind: SyllabusKind = isExam ? 'exams' : 'deadlines'
      const iso = toIsoDate(date[0], yearHint)
      const label = ((isExam ? scheduleExam(line) : undefined)
        ?? trimConnectives(line.replace(date[0], '')))
        || (isExam ? 'Exam' : 'Deadline')
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
      const assignedChapter = detail.match(/\b(?:chapter|ch\.?)[\s#:]*([0-9]+(?:\s*[-–]\s*[0-9]+)?|[ivxlcdm]+)\b/i)
      if (scheduledDate && assignedChapter) {
        const chapterLabel = `Chapter ${assignedChapter[1]}`
        const label = topic ? `${chapterLabel} · ${topic}` : chapterLabel
        push(items, 'readings', label, scheduledDate, 'high', evidence, `Due for ${schedule[0].split(/\s+/)[0]} class`)
        searched.readings = 'Assigned readings found'
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
      if (kind === 'logistics' && extractClassMeetingTime(line) && !isLikelyClassMeetingLine(line)) continue
      if (kind === 'units' && /\b(?:quiz|exam|midterm|final|due|deadline)\b/i.test(line)) continue
      if (pattern.test(line)) { push(items, kind, line, undefined, kind === 'policies' ? 'low' : 'high', evidence); searched[kind] = `${kind[0].toUpperCase()}${kind.slice(1)} found` }
    }
    // Registrar schedules are written in several equivalent forms (TR, T/Th,
    // Tues Thurs). Keep the exact source line as evidence, while recognizing
    // all of them as the same class-meeting fact. Office hours remain useful
    // syllabus logistics but are not class meeting metadata.
    if (
      isLikelyClassMeetingLine(line)
      && !items.some((item) => item.kind === 'logistics' && item.evidence.location === evidence.location)
    ) {
      push(items, 'logistics', line, undefined, 'high', evidence)
      searched.logistics = 'Logistics found'
    } else {
      const meetingDays = extractClassMeetingDays(line)
      const meetingTime = extractClassMeetingTime(line)
      const hasMeetingShape = /^(?:MWF|TR|TTH|TU\s*(?:\/|&|and)\s*TH|T\s*(?:\/|&|and)\s*TH)\b/i.test(line)
        || /\b(?:section|class|meets?|meeting)\b/i.test(line)
      if (meetingDays && meetingTime && !isPlausibleClassMeetingTime(meetingTime) && hasMeetingShape) {
        pushUnique(items, 'logistics', meetingDays, undefined, 'high', evidence, 'Meeting days found; meeting time needs review')
        const proposedTime = proposePlausibleMeetingTime(meetingTime)
        pushUnique(items, 'logistics', 'Meeting time', proposedTime ?? meetingTime, 'low', evidence, proposedTime ? 'Corrected meridiem; review source' : 'Implausible source time; review required')
        searched.logistics = 'People, meeting details, and support found'
      }
    }
  })
  // Standards are a separate pass so a numbered objective is never confused
  // with a schedule date or a scoreable assessment. Only explicit outcome/
  // objective blocks supply study topics; a course schedule remains context.
  lines.forEach((line, index) => {
    if (GENERIC_OUTCOMES_HEADER.test(line)) return
    if (!STANDARD_HEADER.test(line)) return
    const inline = line.split(/[:—–-]/, 2)[1]
    const inlineLabel = inline ? standardLabel(inline) : undefined
    if (inlineLabel) push(items, 'standards', inlineLabel, undefined, 'high', lineEvidence(line, index))
    for (let next = index + 1; next < Math.min(lines.length, index + 64); next += 1) {
      const candidate = lines[next]
      if (STANDARD_HEADER.test(candidate) || STANDARD_SECTION_END.test(candidate)) break
      const bullet = standardBullet(lines, next)
      const label = bullet?.label ?? standardLabel(candidate)
      if (label) push(items, 'standards', label, undefined, 'high', lineEvidence(candidate, next))
      if (bullet) next = bullet.lastIndex
    }
  })
  parseFlattenedSchedule(lines, items, searched, yearHint)
  parseDatedScheduleRows(lines, items, searched, yearHint)
  parseWeekRangeSchedule(lines, items, searched, yearHint)
  parsePointBasedWeights(lines, items, searched)
  parseNumericActionDates(lines, items, searched, yearHint)
  parsePolicySections(lines, items, searched)
  parseSourceBackedSections(lines, items, searched)
  parseRegistrarSections(lines, items, searched)
  parseStaffContacts(lines, items, searched)
  parseHeaderInstructor(lines, items, searched)
  parseCourseDetails(lines, items, searched)
  parseOperationalContext(lines, items, searched)
  parseAssistantCountConflict(lines, items)
  if (items.some((item) => item.kind === 'standards')) searched.standards = 'Stated learning standards found'
  const scanDetected = text.replace(/\s/g, '').length < 80
  const structureFound = STRUCTURAL.filter((signal) => items.some((item) => item.kind === signal))
  const numberedItems = lines.filter((line) => /^\(?\d{1,2}[.)]\s+\S/.test(line)).length
  // Only a readable document with NO structural signal at all is called unrecognized.
  // Deliberately conservative: a one-page syllabus with just office hours still counts
  // as a syllabus, and the student can override this either way.
  const documentKind: DocumentKind = !scanDetected && structureFound.length === 0 ? 'unrecognized' : 'syllabus'
  return { sourceName, sourceKind, text, items: pruneRedundantLogistics(items), searched, scanDetected, documentKind, structureFound, numberedItems }
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
    unreadablePageCount: proposals.reduce((sum, proposal) => sum + (proposal.unreadablePageCount ?? 0), 0) || undefined,
    imageOnlyPageCount: proposals.reduce((sum, proposal) => sum + (proposal.imageOnlyPageCount ?? 0), 0) || undefined,
    ocrPageCount: proposals.reduce((sum, proposal) => sum + (proposal.ocrPageCount ?? 0), 0) || undefined,
    pageCount: proposals.reduce((sum, proposal) => sum + (proposal.pageCount ?? 0), 0) || undefined,
    documentKind: proposals.some((proposal) => proposal.documentKind === 'syllabus') ? 'syllabus' : 'unrecognized',
    structureFound: [...new Set(proposals.flatMap((proposal) => proposal.structureFound))],
    numberedItems: proposals.reduce((sum, proposal) => sum + proposal.numberedItems, 0),
  }
}


export async function extractSyllabusFile(file: File, options: Omit<DocumentExtractionOptions, 'recoverScannedPdfPages'> = {}): Promise<SyllabusProposal> {
  const name = file.name || 'Syllabus'
  const { text, sourceKind, unreadablePageCount, imageOnlyPageCount, ocrPageCount, pageCount } = await extractDocumentText(file, { ...options, recoverScannedPdfPages: true })
  return { ...parseSyllabusText(text, name, sourceKind), unreadablePageCount, imageOnlyPageCount, ocrPageCount, pageCount }
}

export function weightGap(items: SyllabusItem[]) {
  const weights = items.filter((item) => item.kind === 'weights').map((item) => Number(item.value?.replace('%', ''))).filter(Number.isFinite)
  return weights.length ? 100 - weights.reduce((sum, weight) => sum + weight, 0) : null
}
