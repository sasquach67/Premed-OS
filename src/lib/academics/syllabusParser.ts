import { extractDocumentText, pdfTextToLines, type DocumentExtractionOptions, type DocumentExtractionProgress } from '@/lib/academics/documentText'
import { extractClassMeetingDays, extractClassMeetingTime, extractMeetingDays, isOfficeHoursLine, isPlausibleClassMeetingTime, proposePlausibleMeetingTime } from '@/lib/academics/meetingSchedule'

// One implementation, shared with transcript intake. Re-exported because the
// PDF line-grouping regression test targets this module's public surface.
export { pdfTextToLines }
export type { PdfTextItem } from '@/lib/academics/documentText'

export type SyllabusKind = 'identity' | 'standards' | 'exams' | 'weights' | 'units' | 'readings' | 'deadlines' | 'policies' | 'logistics'

export interface SyllabusEvidence { quote: string; location: string; sourceName?: string }
export interface SyllabusItem {
  id: string; kind: SyllabusKind; label: string; value?: string; context?: string; confidence: 'high' | 'low'; evidence: SyllabusEvidence
  /** Exams only: what the syllabus itself says the exam covers. Absent means
   *  it said nothing; never inferred from dates (audit F2). */
  scope?: { lessons?: number[]; cumulative?: boolean }
  /** Units only: the lesson number (from the row, the chapter, or the order). */
  lesson?: number
  /** Units only: every class date in this lesson, when it meets more than once. */
  dates?: string[]
  /** Units only: the learning objectives the schedule lists for this lesson. */
  objectives?: string[]
  /** Units only: the syllabus heading the lesson sits under ("Unit 2: How cells control division"). */
  unit?: string
}
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
  ['logistics', /^(?:office hours|meets?|meeting|instructor|prof(?:essor)?\.?|office|room|location|classroom)\s*:|^(?:MWF|M\s*\/\s*W\s*\/\s*F|TR|TTH)\s*:?\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i],
]

/** A line that is a place: a building with its room (`Peabody Hall ∙ Rm 1040`,
 *  `Hanes Art Center Rm 121`, `0121 Hanes Art Center`, `Room 104`), not prose
 *  that mentions one. "…visit their facilities on the third floor of the Campus
 *  Health building…" became a logistics row in every syllabus (audit F6). */
const BUILDING = '(?:Hall|Center|Centre|Building|Library|Annex|Auditorium|Laboratory|Complex|Pavilion|Theat(?:er|re))'
const PLACE_LINE = new RegExp(`^(?:(?:[A-Z0-9][\\w.'’&-]*\\s+){1,5}${BUILDING}\\b(?:\\s*[·∙|,;-]?\\s*(?:Room|Rm\\.?|#)?\\s*[A-Za-z]?\\d+[A-Za-z]?)?|(?:Room|Rm\\.?)\\s*[A-Za-z]?\\d+[A-Za-z]?(?:\\s*[·∙|,;-]?\\s*(?:[A-Z][\\w'’-]*\\s*){1,5})?|[A-Za-z]?\\d{2,4}[A-Za-z]?\\s+(?:[A-Z][\\w'’-]*\\s+){0,4}${BUILDING})\\s*$`)
const NOT_A_PLACE = /\b(?:visit|contact|website|coordinator|facilities|resources?|proctor|testing|appointment|services|located in|located at)\b/i
export function isPlaceLine(line: string): boolean {
  // A header that PDF columns flattened (`Peabody Hall · Rm 1040 Office Hours:
  // By appt. …`) starts with the place; the next column begins at a field label.
  const place = line.split(/\s+(?=(?:office hours?|office|email|e-mail|phone|instructor|prof(?:essor)?|teaching assistants?|tas?)\s*:)/i)[0].trim()
  return place.length <= 80 && PLACE_LINE.test(place) && !NOT_A_PLACE.test(place)
}

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
    || /^(?:MWF|M\s*\/\s*W\s*\/\s*F|TR|TTH|TU\s*(?:\/|&|and)\s*TH|T\s*(?:\/|&|and)\s*TH)\b/i.test(line)
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

/** Prefer the stated academic term over unrelated publication/copyright years.
 *  A Canvas print carries the year only as the registrar's term code (`FA23`)
 *  and in dated page headers (`8/18/23`); without those every deadline fell
 *  back to display text and rendered as "Date TBD" (audit F4). */
export function syllabusYearHint(text: string): number | undefined {
  const term = text.match(/\b(?:fall|autumn|spring|summer|winter)\s+(20\d{2})\b/i)
  if (term) return Number(term[1])
  const academicYear = text.match(/\b(20\d{2})\s*[-–—/]\s*20\d{2}\b/)
  if (academicYear) return Number(academicYear[1])
  const termCode = text.match(/\b(?:FA|SP|SU|FALL|SPRING|SUMMER)\s*'?(\d{2})\b/i)
  if (termCode && Number(termCode[1]) >= 15 && Number(termCode[1]) <= 40) return 2000 + Number(termCode[1])
  const yearCounts = new Map<number, number>()
  for (const match of text.matchAll(/\b\d{1,2}\/\d{1,2}\/(20\d{2}|\d{2})\b/g)) {
    const year = match[1].length === 2 ? 2000 + Number(match[1]) : Number(match[1])
    yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1)
  }
  const commonest = [...yearCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0]
  if (commonest) return commonest
  return Number(text.match(/\b20\d{2}\b/)?.[0]) || undefined
}

/** A week's date cell is usually a range (`Aug 17-21`) but GEOG writes a
 *  single day for its last weeks (`Nov 23`). Only the week-range parser uses
 *  this; the deadline sweep keeps the stricter range test as its guard. */
function monthDateOrRange(raw: string, yearHint?: number): { date?: string; remainder: string } | undefined {
  const range = monthDateRange(raw, yearHint)
  if (range) return range
  const single = raw.match(new RegExp(`^(${month})\\.?\\s+(\\d{1,2})(?:\\s+(.*))?$`, 'i'))
  if (single) return { date: toIsoDate(`${single[1]} ${single[2]}`, yearHint), remainder: (single[3] ?? '').trim() }
  // Prepared schedule lines are canonical (`8/17`, `11/16 Final Group Presentations`).
  const numeric = raw.match(/^(\d{1,2})\/(\d{1,2})(?:\s+(.*))?$/)
  if (!numeric) return undefined
  return { date: numericDateToIso(numeric[1], numeric[2], yearHint), remainder: (numeric[3] ?? '').trim() }
}


/** Every way a syllabus writes a calendar date, read in one place (Andy, Oct
 *  19 2026: "any possible way something can be formatted should still be
 *  recognizable"). ISO, `9/17`, `09/17/26`, `9/17/2026`, `Sept. 17`,
 *  `September 17th, 2026`, `17 September 2026`, `17-Sep`. A bare `1-7` or
 *  `9-15` is never a date: those are lesson ranges. `iso` is set only when a
 *  year is known; otherwise the caller keeps the raw text. */
export interface FoundDate { raw: string; index: number; month: number; day: number; year?: number; iso?: string }
const ORDINAL_SUFFIX = '(?:st|nd|rd|th)?'
export function findDates(line: string, yearHint?: number): FoundDate[] {
  const found: FoundDate[] = []
  const add = (index: number, raw: string, monthNumber: number, day: number, year?: number) => {
    if (!monthNumber || monthNumber > 12 || !day || day > 31) return
    if (found.some((other) => index < other.index + other.raw.length && other.index < index + raw.length)) return
    const resolvedYear = year ?? yearHint
    const iso = resolvedYear ? `${resolvedYear}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}` : undefined
    found.push({ raw, index, month: monthNumber, day, year: resolvedYear, iso })
  }
  const fullYear = (raw?: string) => (raw ? (raw.length === 2 ? 2000 + Number(raw) : Number(raw)) : undefined)
  const monthOf = (name: string) => MONTH_INDEX[name.slice(0, 3).toLowerCase()]
  for (const match of line.matchAll(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/g)) add(match.index ?? 0, match[0], Number(match[2]), Number(match[3]), Number(match[1]))
  for (const match of line.matchAll(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2}|\d{2})\b/g)) add(match.index ?? 0, match[0], Number(match[1]), Number(match[2]), fullYear(match[3]))
  for (const match of line.matchAll(/(?<![\d/])(\d{1,2})\/(\d{1,2})\b(?!\/\d)/g)) add(match.index ?? 0, match[0], Number(match[1]), Number(match[2]))
  for (const match of line.matchAll(new RegExp(`\\b(${month})\\.?\\s+(\\d{1,2})${ORDINAL_SUFFIX}\\b(?:,?\\s+(20\\d{2}))?`, 'gi'))) add(match.index ?? 0, match[0], monthOf(match[1]), Number(match[2]), fullYear(match[3]))
  for (const match of line.matchAll(new RegExp(`\\b(\\d{1,2})${ORDINAL_SUFFIX}(?:\\s+of)?(?:\\s+|-)(${month})\\b\\.?(?:,?\\s+(20\\d{2}))?`, 'gi'))) add(match.index ?? 0, match[0], monthOf(match[2]), Number(match[1]), fullYear(match[3]))
  return found.sort((left, right) => left.index - right.index)
}

const ROMAN_NUMERALS: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6 }
const ORDINAL_WORDS: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6 }

/** The exam a line names, however it is named: `Exam 1`, `EXAM #1`,
 *  `Midterm I`, `Test 2`, `Prelim 1`, `First Examination`, `Unit 1 Exam`,
 *  `Final Exam`, `Final Examination`, `Final:`. Undefined when none. */
export function examLabelIn(line: string): string | undefined {
  const unit = line.match(/\bunit\s+(\d+)\s+(?:exam(?:ination)?|test)\b/i)
  if (unit) return `Unit ${unit[1]} Exam`
  const numbered = line.match(/\b(midterm|exam(?:ination)?|test|prelim(?:inary exam(?:ination)?)?)\s*#?\s*(\d{1,2}|[ivx]{1,4})\b(?!\s*(?:%|points?|pts|minutes?|questions?))/i)
  if (numbered) {
    const raw = numbered[2].toLowerCase()
    const number = /^\d+$/.test(raw) ? Number(raw) : ROMAN_NUMERALS[raw]
    if (number) {
      const word = numbered[1].toLowerCase()
      if (word.startsWith('midterm')) return `Midterm Exam ${number}`
      if (word.startsWith('test')) return `Test ${number}`
      if (word.startsWith('prelim')) return `Prelim ${number}`
      return `Exam ${number}`
    }
  }
  const ordinal = line.match(/\b(first|second|third|fourth|fifth|sixth)\s+(midterm|exam(?:ination)?|test)\b/i)
  if (ordinal) return `${/midterm/i.test(ordinal[2]) ? 'Midterm Exam' : 'Exam'} ${ORDINAL_WORDS[ordinal[1].toLowerCase()]}`
  if (/\bfinal\s+(?:exam(?:ination)?|test|assessment)\b|\bfinal\s*[:(—–-]\s*(?:\d|[A-Z][a-z]{2})/i.test(line)) return 'Final Exam'
  if (/\bmidterm(?:\s+exam(?:ination)?)?\b(?!\s+(?:group|presentation|project|paper|grade))/i.test(line)) return 'Midterm Exam'
  return undefined
}

/** Prose about an exam that is not the exam itself. */
const NOT_AN_EXAM_DATE = /\b(?:review (?:activity|session|sheet|for)|practice (?:exam|test)|exam (?:score|review|grades?|wrapper)|score (?:on|for) the exam|replaced by|make[- ]?ups?|study guide|drop(?:ped)?|lowest|returned|regrade|accommodations?|request)\b/i
const DEADLINE_CUE = /\b(?:due|deadline|submit(?:ted)?|submission|turn(?:ed)? in|quiz(?:zes)?|assignment|homework|problem set|p-?set|paper|essay|response|reflection|lab report|presentation|project|poster|worksheet|forum|discussion post)\b/i

const WEEKDAY_NAMES: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }
const WEEKDAY_LEAD = /^(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?,?\s*/i

/** Rewrites any session-row shape into the forms the row grammars read:
 *  `N M/D rest` for a numbered lesson, lecture, class, day or session;
 *  `Weekday M/D rest` for a weekday row; `Week N: M/D rest` for a week; and
 *  `M/D rest` for a dated row. Table pipes and tabs become spaces. Lines that
 *  do not start with a date (after an optional label and weekday) are kept. */
export function canonicalRow(raw: string): string {
  const text = raw.replace(/\t+/g, ' ').replace(/\s*\|\s*/g, ' ').replace(/\s+/g, ' ').trim()
  const leading = (rest: string) => {
    const unwrapped = rest.replace(/^[([]\s*/, '')
    const first = findDates(unwrapped)[0]
    if (!first || first.index !== 0) return undefined
    // Drop the end of a range (`-8/27`, `; 9/24`, `–21`, `- Sep 4`) along with the start.
    const after = unwrapped.slice(first.raw.length)
      .replace(/^\s*[)\]]?\s*[-–—;]\s*(?:\d{1,2}\/\d{1,2}\b|(?:[A-Za-z]{3,9}\.?\s+)?\d{1,2}(?![\d/]))\s*[)\]]?/, '')
      .replace(/^\s*[)\]]?\s*[:,.\-–—]*\s*/, '')
    return { date: `${first.month}/${first.day}`, after }
  }
  const join = (head: string, after: string) => (after ? `${head} ${after}` : head)

  const week = text.match(/^(?:Week|Wk)\.?\s*(\d{1,2})\b\s*[:.)\-–—]?\s*(.*)$/i)
  if (week) {
    const dated = leading(week[2])
    if (dated) return join(`Week ${week[1]}: ${dated.date}`, dated.after)
    return text
  }
  const direct = leading(text)
  // `Sept. 5 at 11:59 PM, ET)` is the tail of a due date, not a class session.
  if (direct && /^(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)\b|^\d{1,2}:\d{2}/i.test(direct.after)) return text
  if (direct) return join(direct.date, direct.after)
  const labelled = text.match(/^(?:lesson|lecture|class|day|session|meeting|module)\s*#?\s*(\d{1,3}(?:\s*&\s*\d{1,2})?)\b\s*[:.)\-–—]?\s*(.*)$/i)
    ?? text.match(/^(\d{1,2}(?:\s*&\s*\d{1,2})?)\s+(.+)$/)
  if (labelled) {
    let rest = labelled[2]
    const weekday = rest.match(WEEKDAY_LEAD)
    if (weekday) rest = rest.slice(weekday[0].length)
    const dated = leading(rest)
    if (dated) return join(`${labelled[1].replace(/\s+/g, '')} ${dated.date}`, dated.after)
    return text
  }
  const weekday = text.match(WEEKDAY_LEAD)
  if (weekday) {
    const dated = leading(text.slice(weekday[0].length))
    if (dated) return join(`${WEEKDAY_NAMES[weekday[1].toLowerCase()]} ${dated.date}`, dated.after)
  }
  return text
}

/** A day the class does not meet, however the syllabus says so. Never a session. */
export function isNoClassRow(text: string): boolean {
  return /\bno\s+cl[ao]ss(?:es)?\b|\b(?:fall|spring|winter|thanksgiving|autumn)\s+(?:break|brea\w*|recess)\b|\bbreak\b.*\bno class\b|\bwell-?being day\b|\bholiday\b|\breading day\b|\b(?:university|campus) (?:closed|holiday)\b|\bclass(?:es)? (?:cancel+ed|canceled)\b|\brecess\b/i.test(text)
}


/** Words that name a piece of work. A label without one is a fragment. */
const ASSIGNMENT_NOUN = /\b(?:quiz(?:zes)?|exam|test|worksheet|reflections?|posters?|homework|hw|problem sets?|p-?sets?|papers?|essays?|drafts?|forums?|discussion(?: post)?s?|lab(?: report)?s?|reports?|presentations?|projects?|assignments?|responses?|GRQs?|Mastering|InCLA|assessments?|readings?|proposals?|abstracts?|portfolios?|journals?|annotations?|modules?|surveys?|requirement)\b/i
const OBJECTIVE_VERB = /^(?:identify|describe|explain|compare|contrast|predict|interpret|generate|analy[sz]e|draw|define|construct|review|discern|outline|make|recognize|trace|correlate|design|evaluate|apply|relate|connect|discuss|summari[sz]e|distinguish|calculate|determine|use|work through)\b/i

/** A short assignment name from the cell or sentence that carries a due date
 *  (audit F5: the live Next Assignment read "impacts of those changes. After
 *  class: Lesson 15 quiz ("). Keeps the syllabus's own words; never invents. */
export function assignmentLabel(text: string): string | undefined {
  let label = text.replace(/\s+/g, ' ').trim()
  const phase = [...label.matchAll(/\b(?:before|after)\s+class\s*:\s*/gi)].at(-1)
  if (phase) label = label.slice((phase.index ?? 0) + phase[0].length)
  // Row furniture: the row's own number and date, list numbering, OCR glyph noise.
  label = label.replace(/^(?:\d{1,3}(?:\s*&\s*\d{1,2})?\s+)?\d{1,2}\/\d{1,2}\s+/, '')
  label = label.replace(/^\d{1,2}(?:\.\d{1,2})?\s*[:.)]\s+/, '')
  for (let pass = 0; pass < 3; pass += 1) label = label.replace(/^(?:[«»•●*+~|©"“”'.\-–—]+\s*|(?:[A-Za-z]{1,2}|oe|vp|typ)\s+(?=[A-Za-z0-9]))/, '')
  // An objective sentence ahead of the work: keep the last sentence that names work.
  const sentences = label.split(/(?<=[.!?])\s+/).filter(Boolean)
  const withWork = sentences.filter((sentence) => ASSIGNMENT_NOUN.test(sentence))
  if (withWork.length) label = withWork.at(-1) as string
  if (OBJECTIVE_VERB.test(label)) {
    const work = label.slice(1).search(/\b(?:Lessons?\s+\d|Units?\s+\d|Quiz|Quizzes|Submit|Complete|Forum|Paper|Problem Set|Homework|Lab|Project|Essay)\b/)
    if (work >= 0) label = label.slice(work + 1)
  }
  label = label.split(/\s*\(|,?\s+due\b|\s+(?:on|via|in|through)\s+(?:Gradescope|Canvas|Sakai|Blackboard|Moodle|Mastering)\b|\s+(?:at|by|before)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?\b|\s+(?:is|are)\s+due\b|\s*[:;]\s+due\b/i)[0]
  // The date is the item's value, never part of its name.
  findDates(label).reverse().forEach((date) => { label = `${label.slice(0, date.index)}${label.slice(date.index + date.raw.length)}` })
  label = label.replace(/\s+(?:on|by)\s*$/i, '').replace(/\s{2,}/g, ' ').trim()
  // `from class) and 2) Unit 1 quiz`: the tail of an earlier parenthesis and list numbering.
  if (/^[^(]*\)/.test(label)) label = label.replace(/^[^(]*?\)\s*(?:(?:and|or)\s+)?(?:\d{1,2}\)\s*)?/i, '')
  label = label.replace(/^(?:submit|complete|turn in|upload|post|finish)\s+(?:the\s+|your\s+)?/i, '').replace(/^deadline (?:for|to submit)\s+/i, '')
  label = label.replace(/\s+(?:and|or|&)$/i, '').replace(/\s+(?:uploaded|submitted|turned in|posted)$/i, '')
  label = trimConnectives(label).replace(/[\s,;:.\-–—]+$/, '').trim()
  if (label.length > 60) label = label.slice(0, 61).replace(/\s+\S*$/, '').replace(/[\s,;:]+$/, '')
  if (!label) return undefined
  return label[0].toUpperCase() + label.slice(1)
}

/** The label for a deadline on `lines[index]`. A wrapped cell (`Gradescope
 *  (due Oct. 1 at`) carries no work noun of its own; its name is on the line
 *  or two above (`After class: Lesson 9 quiz on`). */
function deadlineLabel(lines: string[], index: number): string | undefined {
  for (let back = 0; back <= 2; back += 1) {
    const text = lines.slice(Math.max(0, index - back), index + 1).join(' ')
    const label = assignmentLabel(text)
    if (label && ASSIGNMENT_NOUN.test(label) && !/^[a-z]/.test(label)) return label
  }
  return assignmentLabel(lines[index])
}

/** A row's own date (`1 8/20 …`, `8/20 …`) is when the class meets, not when
 *  work is due. It counts only when the row names no other date. */
function isRowLeadDate(line: string, date: { index: number }, others: number): boolean {
  return others > 1 && date.index <= 8 && /^(?:\d{1,3}(?:\s*&\s*\d{1,2})?\s+)?\d{1,2}\/\d{1,2}\b/.test(line)
}


/** What a stated exam scope says, from text that follows the exam's name:
 *  `(lessons 1-7)`, `Lessons 1–7`, `lectures 1 through 7`, `Chapters 1–7`,
 *  `Ch. 1-7`, `lessons 1, 2, 3, and 4`, `material from lectures 1–7`,
 *  `(cumulative)`, `is comprehensive`, `non-cumulative`, `not cumulative`. */
export function readExamScope(text: string): { lessons?: number[]; cumulative?: boolean } | undefined {
  const scope: { lessons?: number[]; cumulative?: boolean } = {}
  const list = text.match(/\b(?:lessons?|lectures?|chapters?|ch\.|chs\.|units?|modules?|weeks?|topics?)\s*((?:\d{1,2}(?:\s*(?:[-–—]|through|thru|to)\s*\d{1,2})?)(?:\s*(?:,|and|&|,\s*and)\s*\d{1,2}(?:\s*(?:[-–—]|through|thru|to)\s*\d{1,2})?)*)/i)
  if (list) {
    const lessons: number[] = []
    for (const part of list[1].split(/\s*(?:,\s*and|,|and|&)\s*/i)) {
      const range = part.match(/^(\d{1,2})\s*(?:[-–—]|through|thru|to)\s*(\d{1,2})$/i)
      if (range) { for (let n = Number(range[1]); n <= Number(range[2]) && n - Number(range[1]) < 40; n += 1) lessons.push(n) }
      else if (/^\d{1,2}$/.test(part)) lessons.push(Number(part))
    }
    if (lessons.length) scope.lessons = [...new Set(lessons)].sort((left, right) => left - right)
  }
  if (/\bnon-?\s?cumulative\b|\bnot\s+(?:be\s+)?(?:cumulative|comprehensive)\b/i.test(text)) scope.cumulative = false
  else if (/\b(?:cumulative|comprehensive)\b/i.test(text)) scope.cumulative = true
  return scope.lessons || scope.cumulative !== undefined ? scope : undefined
}

/** Attach each exam's stated scope (audit F2). The exam's own source line and
 *  the next two (a split `(lessons 1-` / `8)`) are read after the exam's name;
 *  then the document's own sentences about which exams are cumulative. */
function attachExamScope(lines: string[], items: SyllabusItem[]) {
  const exams = items.filter((item) => item.kind === 'exams')
  exams.forEach((exam) => {
    const at = Number(exam.evidence.location.match(/^line (\d+)/)?.[1]) - 1
    if (!(at >= 0) || at >= lines.length) return
    // Read after the exam's name, through at most two continuation lines;
    // a following line that starts a new row or names another exam ends it.
    const named = lines[at].search(/\b(?:exam(?:ination)?|midterm|test|prelim|final)\b/i)
    const parts = [named >= 0 ? lines[at].slice(named) : lines[at]]
    for (let next = at + 1; next <= Math.min(at + 2, lines.length - 1); next += 1) {
      if (isScheduleRowStart(canonicalRow(lines[next])) || examLabelIn(lines[next]) || isNoClassRow(lines[next])) break
      parts.push(lines[next])
    }
    const scope = readExamScope(parts.join(' ').replace(/\s+/g, ' '))
    if (scope) exam.scope = { ...exam.scope, ...scope }
  })
  const text = lines.join(' ').replace(/\s+/g, ' ')
  const finalNotCumulative = /\bfinal(?:\s+exam(?:ination)?)?\b[^.]{0,80}\bnot\s+(?:be\s+)?(?:cumulative|comprehensive)\b/i.test(text)
  const finalCumulative = !finalNotCumulative && (/\b(?:cumulative|comprehensive)\s+final\b/i.test(text)
    || /\bfinal(?:\s+exam(?:ination)?)?\b[^.]{0,80}\b(?:is|will be)\s+(?:cumulative|comprehensive)\b/i.test(text)
    // "There will be one final exam, closed-book format. The exam will be cumulative, …"
    || /\bfinal\s+exam(?:ination)?\b[^.]{0,80}\.\s*(?:the|this)\s+(?:exam|final)\s+(?:is|will be)\s+(?:cumulative|comprehensive)\b/i.test(text))
  const othersNotCumulative = /\b(?:exams?|midterms?|tests?)\b[^.]{0,80}\bnon-?\s?cumulative\b|\bnon-?\s?cumulative\s+(?:exams?|midterms?|tests?)\b/i.test(text)
  exams.forEach((exam) => {
    if (exam.scope?.cumulative !== undefined) return
    const isFinal = /\bfinal\b/i.test(exam.label)
    const cumulative = isFinal ? (finalNotCumulative ? false : finalCumulative ? true : undefined) : (othersNotCumulative ? false : undefined)
    if (cumulative !== undefined) exam.scope = { ...exam.scope, cumulative }
  })
  exams.forEach((exam) => {
    if (!exam.scope) return
    const words = [
      exam.scope.lessons?.length ? `Covers lessons ${compactRange(exam.scope.lessons)}` : '',
      exam.scope.cumulative === true ? 'Cumulative' : exam.scope.cumulative === false ? 'Not cumulative' : '',
    ].filter(Boolean).join(' · ')
    if (words && !exam.context?.includes(words)) exam.context = exam.context ? `${exam.context} · ${words}` : words
  })
}

function compactRange(numbers: number[]): string {
  const runs: string[] = []
  for (let index = 0; index < numbers.length; index += 1) {
    let end = index
    while (end + 1 < numbers.length && numbers[end + 1] === numbers[end] + 1) end += 1
    runs.push(end > index ? `${numbers[index]}–${numbers[end]}` : `${numbers[index]}`)
    index = end
  }
  return runs.join(', ')
}

/** `FINAL EXAM` followed by one line per section (audit F9). The student's
 *  section, or the section that meets at the class's time, decides; when
 *  neither is known every section's final is offered for review, low
 *  confidence, and the student removes the others (Andy, Oct 19 2026). */
function parseSectionFinals(lines: string[], items: SyllabusItem[], searched: Record<SyllabusKind, string>, yearHint?: number) {
  lines.forEach((line, index) => {
    if (!/^(?:final exam(?:ination)?|final)\s*:?\s*(?:\(.*\))?$/i.test(line.trim())) return
    // The student's section comes from the course header, never from the
    // final-exam lines themselves ("Section 004 (… meets 12:30PM)= …").
    const finalLines = new Set(lines.slice(index + 1, index + 6).map((_, offset) => `line ${index + 2 + offset}`))
    const ownSection = items.find((item) => item.kind === 'logistics' && item.label === 'Section' && !finalLines.has(item.evidence.location))?.value?.replace(/^0+/, '')
    const rows: Array<{ section: string; date?: string; time?: string; line: string; at: number; meets?: string }> = []
    for (let next = index + 1; next < Math.min(lines.length, index + 6); next += 1) {
      const section = lines[next].match(/^section\s*(\d{1,4})\b(.*)$/i)
      if (!section) continue
      const date = findDates(section[2], yearHint)[0]
      const time = section[2].match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i)
      const meets = section[2].match(/meets?\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i)?.[1]
      rows.push({ section: section[1], date: date?.iso, time: time ? `${time[1]}–${time[2]}` : undefined, line: lines[next], at: next, meets })
    }
    if (!rows.length) return
    // The class's own start time, when the syllabus gives exactly one.
    const clock = (value: string) => value.match(/(\d{1,2})(?::(\d{2}))?/)?.slice(1).map((part) => Number(part ?? 0)).map((part, at) => (at === 0 ? part % 12 : part)).join(':')
    const classStarts = new Set(items
      .filter((item) => item.kind === 'logistics' && !/office/i.test(item.label) && !finalLines.has(item.evidence.location))
      .map((item) => extractClassMeetingTime(item.label) || (item.label === 'Meeting time' ? item.value ?? '' : ''))
      .filter(Boolean)
      .map((time) => clock(time)))
    const classStart = classStarts.size === 1 ? [...classStarts][0] : undefined
    const chosen = rows.find((row) => ownSection && row.section.replace(/^0+/, '') === ownSection)
      ?? rows.find((row) => row.meets && classStart && clock(row.meets) === classStart)
    const emit = (row: typeof rows[number], label: string, confidence: 'high' | 'low') => {
      if (!row.date || items.some((item) => item.kind === 'exams' && item.value === row.date && /final/i.test(item.label))) return
      pushUnique(items, 'exams', label, row.date, confidence, lineEvidence(row.line, row.at), [`Section ${row.section}`, row.time].filter(Boolean).join(' · '))
      searched.exams = 'Exam dates found'
    }
    if (chosen) emit(chosen, 'Final Exam', 'high')
    else rows.forEach((row) => emit(row, `Final Exam (Section ${row.section})`, 'low'))
  })
}

/** The one dated-fact sweep: every line that names an exam or a piece of work
 *  next to a date, in any of the forms above. It only adds what the
 *  structure-aware passes did not already take from the same line. */
function parseDatedFacts(lines: string[], items: SyllabusItem[], searched: Record<SyllabusKind, string>, yearHint?: number) {
  lines.forEach((line, index) => {
    if (/\boffice hours?\b/i.test(line)) return
    const dates = findDates(line, yearHint)
    if (!dates.length) return
    const location = `line ${index + 1}`
    const fromLine = (kind: SyllabusKind) => items.filter((item) => item.kind === kind && item.evidence.location === location)
    const exam = examLabelIn(line)
    const nearby = lines.slice(Math.max(0, index - 2), index + 1).join(' ')
    if (exam && !NOT_AN_EXAM_DATE.test(line) && !/\bmake[- ]?up\b/i.test(nearby) && !looksLikeReading(line)) {
      const date = dates[0]
      if (!fromLine('exams').length && !items.some((item) => item.kind === 'exams' && item.value === date.iso && item.label === exam)) {
        pushUnique(items, 'exams', exam, date.iso, date.iso ? 'high' : 'low', lineEvidence(line, index), date.iso ? undefined : `Date as written: ${date.raw}`)
        searched.exams = 'Exam dates found'
      }
      return
    }
    // `…poster (due` / `16 10/20 10/20 at 11:59 PM)`: the cue sits on the line above.
    const continuesDue = index > 0 && /\(\s*due\s*$|\bdue\s*(?:on|by)?\s*$/i.test(lines[index - 1])
    if ((!DEADLINE_CUE.test(line) && !continuesDue) || looksLikeReading(line) || /\bmake[- ]?up\b/i.test(nearby)) return
    if (/^(?:mon(?:day)?|tues?(?:day)?|wed(?:nesday)?|thu(?:rs?)?(?:day)?|fri(?:day)?)\b/i.test(line) && fromLine('units').length) return
    const existing = fromLine('deadlines')
    dates.forEach((date) => {
      if (isRowLeadDate(line, date, dates.length)) return
      if (existing.some((item) => item.value === date.iso)) return
      if (items.some((item) => item.kind === 'deadlines' && item.value === date.iso && item.evidence.location === location)) return
      const label = deadlineLabel(lines, index) ?? 'Deadline'
      // A prose line that only restates a date another pass already named
      // ("…assignments tab, on Canvas. They are due … (9/3 and 10/8)") adds nothing.
      const restates = !/^[A-Z0-9]/.test(label) || /^(?:this|these|that|those|it|they|the|each|all|your)\b/i.test(label)
      if (restates && items.some((item) => item.kind === 'deadlines' && item.value === date.iso)) return
      pushUnique(items, 'deadlines', label, date.iso, date.iso ? 'high' : 'low', lineEvidence(line, index), date.iso ? 'Syllabus deadline' : `Date as written: ${date.raw}`)
      searched.deadlines = 'Assignment deadlines found'
    })
  })
}

function scheduleStart(line: string, yearHint?: number): { label: string; date?: string; inline: string } | undefined {
  const match = line.match(/^((?:Introduction|Wk|Week)\s*\d*)\s*:\s*(\d{1,2})\/(\d{1,2})(?:\s*[-–]\s*\d{1,2}(?:\/\d{1,2})?)?\s*(.*)$/i)
  if (!match) return undefined
  return { label: match[1].replace(/^Wk\b/i, 'Week').trim(), date: numericDateToIso(match[2], match[3], yearHint), inline: match[4].trim() }
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

/** A schedule is found by the shape of its rows, never by a heading
 *  (SYLLABUS-PARSER-AUDIT-2026-10-18, F1 and F3). OCR drops the "Class
 *  Schedule" title from an image table and a Canvas print buries it in a page
 *  header; three heading-gated parsers therefore read 0 of 26 BIOL 103 lessons
 *  whose rows they could already match. */
export interface ScheduleRegion { start: number; end: number; hasHeading: boolean }
/** Lines prepared for the row grammars. `origin[i]` is the source line that
 *  prepared line `i` came from, so evidence keeps the document's own numbers. */
export interface ScheduleSegment { lines: string[]; origin: number[]; recovered?: Set<number> }

const WEEKDAY_ONLY = /^(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)[a-z]*\.?,?$/i
/** `2 Mon.,` — the Canvas print sometimes keeps the lesson number on the weekday's line. */
const NUMBERED_WEEKDAY = /^(\d{1,2})\s+((?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)[a-z]*\.?,?)$/i
/** `Fri., Sep.` / `20 Wed., Nov.` — weekday and month on one line, day on the next. */
const WEEKDAY_MONTH = new RegExp(`^(?:(\\d{1,2})\\s+)?((?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)[a-z]*\\.?,?)\\s+(${month})\\.?$`, 'i')
const MONTH_ONLY = new RegExp(`^${month}\\.?$`, 'i')
const DAY_ONLY = /^\d{1,2}$/
const SCHEDULE_HEADING = /\b(?:schedule for class|class schedule|course (?:schedule|calendar))\b/i
const SCHEDULE_SECTION_END = /^(?:university polic(?:y|ies)|student support|honou?r code|tips for success|required books|course requirements)\b/i
const ROW_START_PATTERNS = [
  /^(?:lesson\s*)?\d{1,3}(?:\s*&\s*\d{1,2})?\s+\d{1,2}\/\d{1,2}\b/i,
  /^(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)[a-z]*\.?,?\s+(?:\d{1,2}\/\d{1,2}|[A-Z][a-z]{2,8}\.?\s+\d{1,2})\b/i,
  /^[*•.\-|\s]*\d{1,2}\/\d{1,2}\s+\S/,
  /^Week\s+\d+\b/i,
  /^(?:Introduction|Wk|Week)\s*\d*\s*:\s*\d{1,2}\/\d{1,2}/i,
]
export function isScheduleRowStart(line: string): boolean {
  return ROW_START_PATTERNS.some((pattern) => pattern.test(line))
}

function segmentEvidence(segment: ScheduleSegment, index: number): SyllabusEvidence {
  return lineEvidence(segment.lines[index], segment.origin[index])
}

/** Document-wide preparation that needs no region: drop a Canvas print header
 *  or footer that repeats on every page, and rejoin a date the export printed
 *  one token per line (`1` / `Wed.,` / `Aug.` / `23` → `1 8/23`). A dangling
 *  day number completes the weekday+month pair that is still waiting for it,
 *  even across a dropped page break, and never starts the row that follows. */
export function prepareScheduleText(lines: string[]): ScheduleSegment {
  const pageKey = (line: string) => line.replace(/\s+\d+\/\d+$/, '')
  const repeats = new Map<string, number>()
  lines.forEach((line) => repeats.set(pageKey(line), (repeats.get(pageKey(line)) ?? 0) + 1))
  const isPrintChrome = (line: string) => (repeats.get(pageKey(line)) ?? 0) >= 3 && (CANVAS_PRINT_HEADER.test(line) || CANVAS_PRINT_FOOTER.test(line))

  const out: string[] = []
  const origin: number[] = []
  type Pending = { weekday: string; month: string; origin: number; lessonNumber?: string; held: Array<[string, number]> }
  let pending: Pending | undefined
  const abandon = () => {
    if (!pending) return
    if (pending.lessonNumber) { out.push(pending.lessonNumber); origin.push(pending.origin - 1) }
    out.push(`${pending.weekday} ${pending.month}`); origin.push(pending.origin)
    pending.held.forEach(([line, at]) => { out.push(line); origin.push(at) })
    pending = undefined
  }
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (isPrintChrome(line)) continue
    if (pending) {
      const dayWithText = line.match(/^(\d{1,2})\s+(\S.*)$/)
      if (DAY_ONLY.test(line) || (dayWithText && !isScheduleRowStart(line) && Number(dayWithText[1]) <= 31)) {
        const monthNumber = MONTH_INDEX[pending.month.slice(0, 3).toLowerCase()]
        const date = `${monthNumber}/${Number(dayWithText?.[1] ?? line)}`
        const tail = dayWithText ? ` ${dayWithText[2]}` : ''
        out.push(pending.lessonNumber ? `${pending.lessonNumber} ${date}${tail}` : `${pending.weekday} ${date}${tail}`)
        origin.push(pending.origin)
        pending.held.forEach(([held, at]) => { out.push(held); origin.push(at) })
        pending = undefined
        continue
      }
      if (pending.held.length < 6 && !isScheduleRowStart(line) && !WEEKDAY_ONLY.test(line) && !NUMBERED_WEEKDAY.test(line) && !WEEKDAY_MONTH.test(line)) { pending.held.push([line, index]); continue }
      abandon()
    }
    const weekdayMonth = line.match(WEEKDAY_MONTH)
    if (weekdayMonth) {
      let lessonNumber: string | undefined = weekdayMonth[1]
      if (!lessonNumber && out.length && DAY_ONLY.test(out[out.length - 1]) && origin[origin.length - 1] === index - 1) { lessonNumber = out.pop(); origin.pop() }
      pending = { weekday: weekdayMonth[2], month: weekdayMonth[3], origin: index, lessonNumber, held: [] }
      continue
    }
    const numberedWeekday = line.match(NUMBERED_WEEKDAY)
    // `10 Mon.,` / `Oct. 2`: month and day arrive together on the next line.
    const monthDay = (WEEKDAY_ONLY.test(line) || numberedWeekday) ? (lines[index + 1] ?? '').match(new RegExp(`^(${month})\\.?\\s+(\\d{1,2})$`, 'i')) : null
    if (monthDay) {
      let lessonNumber: string | undefined = numberedWeekday?.[1]
      if (!lessonNumber && out.length && DAY_ONLY.test(out[out.length - 1]) && origin[origin.length - 1] === index - 1) { lessonNumber = out.pop(); origin.pop() }
      const date = `${MONTH_INDEX[monthDay[1].slice(0, 3).toLowerCase()]}/${Number(monthDay[2])}`
      out.push(lessonNumber ? `${lessonNumber} ${date}` : `${numberedWeekday?.[2] ?? line} ${date}`)
      origin.push(index)
      index += 1
      continue
    }
    if ((WEEKDAY_ONLY.test(line) || numberedWeekday) && MONTH_ONLY.test(lines[index + 1] ?? '')) {
      let lessonNumber: string | undefined = numberedWeekday?.[1]
      if (!lessonNumber && out.length && DAY_ONLY.test(out[out.length - 1]) && origin[origin.length - 1] === index - 1) { lessonNumber = out.pop(); origin.pop() }
      pending = { weekday: numberedWeekday?.[2] ?? line, month: lines[index + 1], origin: index, lessonNumber, held: [] }
      index += 1
      continue
    }
    out.push(line); origin.push(index)
  }
  abandon()
  return { lines: out.map(canonicalRow), origin }
}

/** Three or more row starts no more than twelve lines apart make a region,
 *  or fewer when a schedule heading sits just above them. A region runs to
 *  the last row start plus up to eight trailing lines, stopping at a section
 *  heading. The heading is never required. */
export function detectScheduleRegions(lines: string[]): ScheduleRegion[] {
  const starts = lines.map((line, index) => (isScheduleRowStart(line) ? index : -1)).filter((index) => index >= 0)
  const regions: ScheduleRegion[] = []
  let run: number[] = []
  const close = () => {
    const first = run[0]
    // A heading never gates a region, but it vouches for a short one: a
    // two-row sample under "Course Schedule" is a schedule.
    const hasHeading = run.length > 0 && lines.slice(Math.max(0, first - 8), first).some((line) => SCHEDULE_HEADING.test(line))
    if (run.length >= 3 || (run.length >= 1 && hasHeading)) {
      let end = run[run.length - 1] + 1
      for (let trailing = 0; trailing < 8 && end < lines.length; trailing += 1, end += 1) {
        if (SCHEDULE_SECTION_END.test(lines[end]) || isScheduleRowStart(lines[end])) break
      }
      regions.push({ start: first, end, hasHeading })
    }
    run = []
  }
  // A schedule moves forward in time. Rows a long way apart (a Canvas print
  // gives each lesson twenty lines of objectives) still belong to one table
  // when each row's date is later than the one before it.
  const rowDate = (index: number) => {
    const match = lines[index].match(/\b(\d{1,2})\/(\d{1,2})\b/)
    return match ? Number(match[1]) * 100 + Number(match[2]) : undefined
  }
  starts.forEach((start) => {
    const previous = run[run.length - 1]
    if (previous != null) {
      const gap = start - previous
      const before = rowDate(previous)
      const after = rowDate(start)
      const advances = before != null && after != null && after > before
      if (gap > 12 && !(gap <= 80 && advances)) close()
    }
    run.push(start)
  })
  close()
  return regions
}

/** Region-scoped repairs that need neighbouring rows: a slash-less OCR date
 *  (`917` between `9/15` and `9/24` is `9/17`), an exam heading whose date sits
 *  alone on the next line (`EXAM 2 (lessons 9-15) …` / `10/22 exam`), and a
 *  cell that wraps inside an open parenthesis. Repaired rows are recorded so
 *  their items go out low confidence. */
export function normalizeScheduleCells(prepared: ScheduleSegment, region: ScheduleRegion): ScheduleSegment {
  const source = prepared.lines.slice(region.start, region.end)
  const sourceOrigin = prepared.origin.slice(region.start, region.end)
  const rowDate = (line: string) => {
    const match = line.match(/^[*•.\-|\s]*(?:(?:lesson\s*)?\d{1,3}(?:\s*&\s*\d{1,2})?\s+)?(\d{1,2})\/(\d{1,2})\b/i)
    return match ? Number(match[1]) * 100 + Number(match[2]) : undefined
  }
  const lines: string[] = []
  const origin: number[] = []
  const recovered = new Set<number>()
  const skip = new Set<number>()
  for (let index = 0; index < source.length; index += 1) {
    if (skip.has(index)) continue
    let line = source[index]
    let repaired = false

    const slashless = line.match(/^(\d{3,4})\s+(\S.*)$/)
    if (slashless) {
      const digits = slashless[1]
      const splits = digits.length === 3 ? [1] : [2, 1]
      const before = source.slice(0, index).map(rowDate).filter((value): value is number => value != null).at(-1)
      const after = source.slice(index + 1).map(rowDate).find((value): value is number => value != null)
      for (const monthLength of splits) {
        const monthNumber = Number(digits.slice(0, monthLength))
        const dayNumber = Number(digits.slice(monthLength))
        if (!monthNumber || monthNumber > 12 || !dayNumber || dayNumber > 31) continue
        const value = monthNumber * 100 + dayNumber
        if (before != null && after != null && value > before && value < after) {
          line = `${monthNumber}/${dayNumber} ${slashless[2]}`
          repaired = true
          break
        }
      }
    }

    if (/^[*•+\-\s]*EXAM\b/i.test(line) && !/\d{1,2}\/\d{1,2}/.test(line)) {
      for (let next = index + 1; next <= Math.min(index + 2, source.length - 1); next += 1) {
        const dated = source[next].match(/^(\d{1,2}\/\d{1,2})\s+exam\s*$/i)
        if (!dated) continue
        line = `${dated[1]} ${line.replace(/^[*•+\-\s]+/, '')}`
        skip.add(next)
        break
      }
    }

    const opens = (line.match(/\(/g) ?? []).length
    const closes = (line.match(/\)/g) ?? []).length
    const following = source[index + 1]
    if (opens > closes && following && !skip.has(index + 1) && !isScheduleRowStart(following) && /\)/.test(following)) {
      line = `${line} ${following}`.replace(/\s+/g, ' ')
      skip.add(index + 1)
    }

    if (repaired) recovered.add(lines.length)
    lines.push(line)
    origin.push(sourceOrigin[index])
  }
  return { lines, origin, recovered }
}

function parseFlattenedSchedule(segment: ScheduleSegment, items: SyllabusItem[], searched: Record<SyllabusKind, string>, yearHint?: number) {
  const { lines } = segment
  const lineEvidence = (_line: string, index: number) => segmentEvidence(segment, index)
  const scheduleHeader = -1
  const end = lines.length
  const rowStarts: Array<{ index: number; label: string; date?: string; inline: string }> = []
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
      // A bare date (`10/8:` once prepared is `10/8`) or one no-class day of
      // the week (`10/15-No Class, FALL BREAK`) is not the week's theme.
      if (/^\d{1,2}\/\d{1,2}$/.test(cell) || isNoClassRow(cell)) return
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

    // A week's own cells name its theme; the words beside the date (`LDOC`,
    // `No Class, Wellness Day` for one day of the week) are a fallback only.
    const inlineTheme = row.inline && !isNoClassRow(row.inline) ? row.inline : ''
    const theme = (themeParts.join(' ') || genericTheme || inlineTheme).replace(/\s+/g, ' ').trim()
    if (theme && !isNoClassRow(theme)) {
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

function parseDatedScheduleRows(segment: ScheduleSegment, items: SyllabusItem[], searched: Record<SyllabusKind, string>, yearHint?: number) {
  const { lines } = segment
  const lineEvidence = (_line: string, index: number) => segmentEvidence(segment, index)
  const scheduleHeader = -1
  const end = lines.length
  const starts: Array<{ index: number; date?: string; label: string; inline: string; kind: 'weekday' | 'lesson' | 'dated-event'; recovered?: boolean }> = []
  let lastLesson: number | undefined
  for (let index = 0; index < end; index += 1) {
    const weekday = lines[index].match(/^(?:mon(?:day)?|tues(?:day)?|wed(?:nesday)?|thurs?(?:day)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\.?,?\s+(\d{1,2})\/(\d{1,2})(?:\s+(.+))?$/i)
    const lesson = lines[index].match(/^(?:lesson\s*)?(\d{1,2}(?:\s*&\s*\d{1,2})?)\s+(\d{1,2})\/(\d{1,2})(?:\s+(.+))?$/i)
    // `123 11/19`: OCR put a stray digit in front of lesson 23. Read the last
    // two digits when they continue the numbering, and say so (low confidence).
    const strayDigit = lines[index].match(/^(\d{3})\s+(\d{1,2})\/(\d{1,2})(?:\s+(.+))?$/)
    const continued = strayDigit && lastLesson != null && Number(strayDigit[1].slice(1)) === lastLesson + 1 ? strayDigit : undefined
    const datedEvent = lines[index].match(/^[*•.\-|\s]*(\d{1,2})\/(\d{1,2})\s+(.+)$/)
    if (weekday) starts.push({ index, date: numericDateToIso(weekday[1], weekday[2], yearHint), label: `Class ${weekday[1]}/${weekday[2]}`, inline: weekday[3]?.trim() ?? '', kind: 'weekday' })
    else if (lesson) {
      starts.push({ index, date: numericDateToIso(lesson[2], lesson[3], yearHint), label: `Lesson ${lesson[1].replace(/\s+/g, '')}`, inline: lesson[4]?.trim() ?? '', kind: 'lesson' })
      lastLesson = Number(lesson[1].split(/\s*&\s*/).pop())
    } else if (continued) {
      starts.push({ index, date: numericDateToIso(continued[2], continued[3], yearHint), label: `Lesson ${continued[1].slice(1)}`, inline: continued[4]?.trim() ?? '', kind: 'lesson', recovered: true })
      lastLesson = Number(continued[1].slice(1))
    } else if (datedEvent) starts.push({ index, date: numericDateToIso(datedEvent[1], datedEvent[2], yearHint), label: `Class ${datedEvent[1]}/${datedEvent[2]}`, inline: datedEvent[3].trim(), kind: 'dated-event' })
  }
  // In a week table (`Week 3.` headings with date cells) a dated cell belongs
  // to its week, which parseWeekRangeSchedule reads. It is not a session.
  const weekTable = lines.filter((line) => /^Week\s+\d+\b/i.test(line)).length >= 3
  if (weekTable) {
    for (let index = starts.length - 1; index >= 0; index -= 1) if (starts[index].kind === 'dated-event') starts.splice(index, 1)
  }
  // In a lesson-numbered table a dated row with no number is the next lesson
  // (OCR lost `8` from `8 9/15`). Exam rows keep their own identity.
  if (starts.some((row) => row.kind === 'lesson')) {
    let running: number | undefined
    starts.forEach((row) => {
      if (row.kind === 'lesson') { running = Number(row.label.replace(/^Lesson\s*/i, '').split('&').pop()); return }
      if (row.kind === 'dated-event' && running != null && !isScheduledExamLine(row.inline)) {
        running += 1
        row.label = `Lesson ${running}`
        row.kind = 'lesson'
        row.recovered = true
      }
    })
  }

  starts.forEach((row, rowIndex) => {
    const next = starts[rowIndex + 1]?.index ?? end
    const cells = [row.inline, ...lines.slice(row.index + 1, next)].filter(Boolean)
    const evidenceFor = (line: string) => {
      const offset = lines.slice(row.index, next).findIndex((candidate) => candidate.includes(line))
      return lineEvidence(offset >= 0 ? lines[row.index + offset] : lines[row.index], offset >= 0 ? row.index + offset : row.index)
    }
    const meaningful = cells.filter((cell) => !/^(?:date|topic|learning objectives?|assignments?|before class|during class|after class)$/i.test(cell)
      && !/^(?:from\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*[-–]\s*(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?$/i.test(cell)
      && !/^(?:from\s+|until\s+|to\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)(?:\s*,?\s*(?:ET|EST|EDT))?$/i.test(cell))
    const topic = meaningful.find((cell) => !looksLikeReading(cell)
      && !hasExamCue(cell)
      && !/\b(?:due|submit|complete|quiz|assessment|GRQ|Mastering)\b/i.test(cell)
      && !/^[•*‣–-]/.test(cell))
    const unitLabel = row.kind === 'lesson' ? row.label : topic?.trim() || row.label
    const isAssessmentOnly = (row.kind === 'dated-event' && /^(?:[*•]\s*)?(?:exam|midterm|final exam)\b/i.test(row.inline))
      || (!topic && isScheduledExamLine(meaningful[0] ?? ''))
    const confidence: 'high' | 'low' = row.recovered || segment.recovered?.has(row.index) ? 'low' : 'high'
    // `10&11 9/24`: one class day covering two lessons is two schedule
    // entries sharing the date; the lesson is the unit (Andy, Oct 19 2026).
    const unitLabels = row.kind === 'lesson' && /&/.test(row.label)
      ? row.label.replace(/^Lesson\s*/i, '').split(/\s*&\s*/).map((number) => `Lesson ${number}`)
      : [unitLabel]
    const dateTaken = items.some((item) => item.kind === 'units' && item.value === row.date)
    // "Continuation of lesson 1 content" is a second class day of a lesson
    // already on the schedule, not a lesson of its own.
    const continuation = meaningful.slice(0, 3).some((cell) => /^continuation of (?:lesson|the lesson)\b/i.test(cell))
    // A row whose first cell is an exam heading is the exam, not a lesson.
    const examRow = Boolean(scheduleExam(meaningful[0] ?? '')) && /^(?:[*•+]\s*)?(?:exam|midterm|final)/i.test(meaningful[0] ?? '')
    const noClass = isNoClassRow([row.inline, ...cells.slice(0, 2)].join(' ')) && !/\bexam\b/i.test(row.inline)
    if (row.date && !isAssessmentOnly && !continuation && !examRow && !noClass && (unitLabels.length > 1 || !dateTaken)) {
      unitLabels.forEach((label) => pushUnique(items, 'units', label, row.date, confidence, lineEvidence(lines[row.index], row.index), unitLabels.length > 1 ? label : row.label))
      searched.units = 'Schedule scope found'
      const objectives = lessonObjectives(meaningful)
      if (objectives.length) {
        items.filter((item) => item.kind === 'units' && item.value === row.date && unitLabels.includes(item.label)).forEach((item) => { item.objectives = objectives })
      }
    }

    meaningful.forEach((rawCell, cellIndex) => {
      const following = meaningful[cellIndex + 1]
      const cell = /\bbefore class\s*:/i.test(rawCell) && /(?:\b(?:and|or)|[,\-–])\s*$/.test(rawCell) && following && !/^(?:before|after|during) class\b/i.test(following)
        ? `${rawCell} ${following}` : rawCell
      const precedingExam = lines.slice(Math.max(scheduleHeader, row.index - 3), row.index)
        .reverse()
        .map((candidate) => scheduleExam(candidate))
        .find(Boolean)
      // The first cell of a row owns its date when it is a numbered exam
      // heading, even if a later cell (exam instructions) reads like a topic.
      const examCellOwnsRowDate = cell === row.inline || (cell === meaningful[0] && (!topic || Boolean(scheduleExam(cell))))
      // "Exam 1 review" and "Review for the exam" are study sessions, not the
      // exam. A row that says "To prepare for the exam, review: GRQs…" is the
      // exam; the word alone must not veto it.
      const isDatedExamHeading = examCellOwnsRowDate
        && (/^(?:[*•]\s*)?(?:(?:exam|midterm(?:\s+exam)?)\s*#?\s*\d+|final exam)\b/i.test(cell)
          || (/^exam$/i.test(cell.trim()) && Boolean(precedingExam)))
        && !/\b(?:exam|midterm|final)(?:\s*#?\s*\d+)?\s+review\b|\breview\s+(?:for|of|session|day)\b/i.test(cell)
      if (row.date && isDatedExamHeading) {
        const examLabel = scheduleExam(cell) ?? (/^exam$/i.test(cell.trim()) ? precedingExam : undefined) ?? trimConnectives(cell)
        pushUnique(items, 'exams', examLabel, row.date, confidence, evidenceFor(cell), row.label)
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
      const label = assignmentLabel(beforeClass ?? inClass ?? '') ?? trimConnectives((beforeClass ?? inClass ?? '').replace(/\([^)]*\)/g, '').replace(/\b(?:due\s*)?\d{1,2}\/\d{1,2}(?:\s+at\s+[^,;.]+)?/ig, '').trim())
      if (label && due) {
        pushUnique(items, 'deadlines', label, due, 'high', evidenceFor(cell), beforeClass ? `Before ${row.label}` : row.label)
        searched.deadlines = 'Assignment deadlines found'
      }
    })
  })
}

function parseWeekRangeSchedule(segment: ScheduleSegment, items: SyllabusItem[], searched: Record<SyllabusKind, string>, yearHint?: number) {
  const { lines } = segment
  const lineEvidence = (_line: string, index: number) => segmentEvidence(segment, index)
  const scheduleHeader = -1
  const end = lines.length
  const rows = lines
    .map((line, index) => ({ index, match: line.match(/^Week\s+(\d+)\.\s*(.+)$/i) }))
    .filter((row): row is { index: number; match: RegExpMatchArray } => row.index > scheduleHeader && row.index < end && Boolean(row.match))

  rows.forEach((row, rowIndex) => {
    const nextIndex = rows[rowIndex + 1]?.index ?? end
    const week = `Week ${row.match[1]}`
    const title = row.match[2].trim()
    const cells = lines.slice(row.index + 1, nextIndex)
    const range = cells.map((line, offset) => ({ line, offset, parsed: monthDateOrRange(line, yearHint) })).find((candidate) => candidate.parsed)
    if (!range || isNoClassRow(title)) return

    const existingUnit = items.find((item) => item.kind === 'units' && item.evidence.location === `line ${segment.origin[row.index] + 1}`)
    if (existingUnit) Object.assign(existingUnit, { label: title, value: range.parsed?.date, context: week, confidence: range.parsed?.date ? 'high' : 'low' })
    else pushUnique(items, 'units', title, range.parsed?.date, range.parsed?.date ? 'high' : 'low', lineEvidence(lines[row.index], row.index), week)
    searched.units = 'Schedule scope found'

    if (/\bgroup presentations?\b/i.test(range.parsed?.remainder ?? '')) {
      pushUnique(items, 'deadlines', range.parsed!.remainder, range.parsed?.date, range.parsed?.date ? 'high' : 'low', lineEvidence(cells[range.offset], row.index + 1 + range.offset), week)
      searched.deadlines = 'Assignment deadlines found'
    }

    const readingCells = cells.flatMap((line, offset) => {
      const parsedRange = monthDateOrRange(line, yearHint)
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
      ?? (isExam ? undefined : deadlineLabel(lines, index))
      ?? (trimConnectives(cue ?? line.replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b.*$/, '')) || (isExam ? 'Exam' : 'Deadline'))
    const dueMatches = matches.filter((match) => !isRowLeadDate(line, { index: match.index ?? 0 }, matches.length))
    dueMatches.forEach((match, matchIndex) => {
      const explicitYear = match[3] ? Number(match[3].length === 2 ? `20${match[3]}` : match[3]) : yearHint
      const iso = numericDateToIso(match[1], match[2], explicitYear)
      if (!iso) return
      const kind: SyllabusKind = isExam ? 'exams' : 'deadlines'
      // "Papers due 9/3 and 10/8" names two pieces of work; number them unless
      // the name already carries its own number.
      const label = dueMatches.length > 1 && !isExam && !/\d\s*$/.test(base) ? `${base} ${matchIndex + 1}` : base
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
    let rawName = line.slice(0, line.indexOf(email)).replace(/(?:Instructor|Professor|Prof\.?|Teaching Assistant|TA)\s*:?/ig, '').replace(/[·∙|(<\s]+$/, '').trim()
    if (!rawName || /^(?:class email(?: account)?|email|course email(?: account)?)\s*:?$/i.test(rawName)) return
    const professor = /^\s*Instructor\s*:/i.test(line)
      || /\b(?:Dr\.?|Professor|Prof\.?)(?=\s)/i.test(line)
      || lines.slice(Math.max(0, index - 2), index).some((candidate) => /^Instructor\s*:?$/i.test(candidate))
    if (professor) rawName = rawName.match(/\b(?:Dr\.?|Professor|Prof\.?)\s+.+$/i)?.[0]?.trim() ?? rawName
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
  if (identity && /^\d{2,4}[A-Za-z]?\s*(?:[·∙|,;-]\s*)?(?:(?:Fall|Spring|Summer|Winter)\s+20\d{2})?\b/i.test(identity.value ?? '')) {
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

  const explicitSection = lines.map((line, index) => ({ line, index, match: line.match(/^Section\b\s*:?\s*(\d{1,4}[A-Za-z]?)\b/i) ?? line.match(/[·|,;]\s*Section\s*:\s*(\d{1,4}[A-Za-z]?)\b/i) })).find((entry) => entry.match)
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
/** A Canvas "print this page" export repeats these on every page. Dropped only
 *  when they repeat, by `prepareScheduleText`; a single dated line is content. */
const CANVAS_PRINT_HEADER = /^\d{1,2}\/\d{1,2}\/\d{2,4},\s+\d{1,2}:\d{2}\s*(?:AM|PM)\b/i
const CANVAS_PRINT_FOOTER = /^https?:\/\/\S+\s+\d+\/\d+$/

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
  const carriesLocationBeforeHours = (label: string) => {
    const roomAt = label.search(ROOM)
    const hoursAt = label.search(/\b(?:office|student)\s+hours?\b/i)
    return roomAt >= 0 && hoursAt >= 0 && roomAt < hoursAt
  }

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
    && !carriesLocationBeforeHours(label)
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


/** The verbs a learning objective starts with, for the lesson objectives a
 *  schedule table lists beside each row. */
const OBJECTIVE_START = /^(?:identify|describe|explain|compare|contrast|predict|interpret|generate|analy[sz]e|draw|define|construct|review|discern|outline|make|recognize|trace|correlate|design|evaluate|apply|relate|connect|discuss|summari[sz]e|distinguish|calculate|determine|use|work through|classify|differentiate|illustrate|list|name|state|demonstrate|assess|justify|model|diagram|formulate|propose|solve|derive|measure|estimate|sketch|label|argue|critique|reflect|articulate|organi[sz]e|practice|recall|understand|examine|interpret|infer|hypothesi[sz]e|synthesi[sz]e|develop|perform|read|write|locate|map|order|rank|select|choose|match|convert|balance|graph|plot|test)\b/i

/** The learning objectives a schedule row lists for its lesson. A table cell
 *  may wrap over several lines ("Identify the" / "independent and" /
 *  "dependent variables…"), carry OCR bullet noise, or run on into the row's
 *  assignment ("… Before class: GRQ-3"). Objectives start with a verb; a line
 *  that starts lowercase continues the one before it. */
export function lessonObjectives(cells: string[]): string[] {
  const objectives: string[] = []
  cells.forEach((raw) => {
    const cell = raw
      .replace(/\b(?:before|after|during)\s+class\s*:.*$/i, '')
      .replace(/\bIn-?Class Learning Assessment\b.*$/i, '')
      .replace(/\bInCLA\b.*$/i, '')
      .replace(/^(?:[«»•●*+~|©"“”'.\-–—]+\s*|(?:[A-Za-z]{1,2}|oe|vp|typ)\s+(?=[A-Za-z]))/, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!cell) return
    const current = objectives[objectives.length - 1]
    if (/^[A-Z]/.test(cell) && OBJECTIVE_START.test(cell)) { objectives.push(cell); return }
    if (current && /^[a-z(]/.test(cell) && !/[.!?]$/.test(current)) objectives[objectives.length - 1] = `${current} ${cell}`
  })
  return [...new Set(objectives
    .map((objective) => objective.replace(/\s*[-–—|]+\s*$/, '').replace(/\s*\(\s*$/, '').trim())
    .filter((objective) => objective.length >= 12 && objective.length <= 240 && !/\bdue\b/i.test(objective)))].slice(0, 8)
}

/** A class meets more than once per lesson. PSYC 101 teaches "Human Memory"
 *  on 9/22 and 9/24; Andy's folders, the exam scope and the notebook are all
 *  per lesson, so consecutive sessions on one topic become one lesson with
 *  both dates (Andy, Oct 19 2026). The number comes from the chapter the
 *  readings name for those dates; without chapters, from the order, with an
 *  introduction day as lesson 0. Week-based schedules (GEOG, ANTH) are not
 *  sessions and are left alone. */
function groupSessionsIntoLessons(items: SyllabusItem[]): SyllabusItem[] {
  const isWeek = (unit: SyllabusItem) => /^(?:week|wk|introduction)\b/i.test(unit.context ?? '')
  const sessions = items.filter((unit) => unit.kind === 'units' && unit.value && !isWeek(unit))
  sessions.filter((unit) => /^Lesson\s+\d+$/i.test(unit.label)).forEach((unit) => {
    unit.lesson = Number(unit.label.replace(/\D+/g, ''))
    unit.dates = [unit.value as string]
  })
  const topical = sessions.filter((unit) => !/^Lesson\s+\d+$/i.test(unit.label) && !/^Unit\s+\d+\b/i.test(unit.label))
  if (topical.length < 3) return items
  const normalize = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const removed = new Set<SyllabusItem>()
  const lessons: SyllabusItem[] = []
  ;[...topical].sort((left, right) => (left.value as string).localeCompare(right.value as string)).forEach((unit) => {
    const previous = lessons[lessons.length - 1]
    if (previous && normalize(previous.label) === normalize(unit.label)) {
      previous.dates = [...(previous.dates ?? [previous.value as string]), unit.value as string]
      if (unit.objectives?.length) previous.objectives = [...(previous.objectives ?? []), ...unit.objectives]
      removed.add(unit)
    } else {
      unit.dates = [unit.value as string]
      lessons.push(unit)
    }
  })
  const chapterOf = (unit: SyllabusItem) => {
    for (const date of unit.dates ?? []) {
      const reading = items.find((item) => item.kind === 'readings' && item.value === date && /^Chapter\s+(\d+)\b/i.test(item.label))
      if (reading) return Number(reading.label.match(/\d+/)?.[0])
    }
    return undefined
  }
  const chapters = lessons.map(chapterOf)
  const isIntroduction = (unit: SyllabusItem) => /\b(?:introduction|intro|syllabus|welcome|overview|orientation|first day)\b/i.test(unit.label)
  if (chapters.some((chapter) => chapter != null)) {
    lessons.forEach((unit, index) => {
      if (chapters[index] != null) unit.lesson = chapters[index]
      // "Class Introduction" before chapter 1 is lesson 0, as in BIOL 103's table.
      else if (index === 0 && isIntroduction(unit)) unit.lesson = 0
    })
  } else {
    let number = 0
    lessons.forEach((unit) => {
      if (number === 0 && isIntroduction(unit)) { unit.lesson = 0; return }
      number += 1
      unit.lesson = number
    })
  }
  return items.filter((item) => !removed.has(item))
}

/** A "Chapter N" reading due on a class day of lesson N is that lesson's own
 *  textbook chapter, not a reading of its own: the lesson notebook covers it.
 *  PSYC 101 lists one beside every class; Andy said the Readings group they
 *  made is unnecessary (Oct 27 2026). Readings that cite anything else stay. */
function dropLessonChapterReadings(items: SyllabusItem[]): SyllabusItem[] {
  const lessons = items.filter((unit) => unit.kind === 'units' && unit.lesson != null)
  return items.filter((item) => {
    if (item.kind !== 'readings' || !item.value) return true
    const chapter = item.label.match(/^Chapter\s+(\d+)(?:\s*·.*)?$/i)
    return !chapter || !lessons.some((unit) => unit.lesson === Number(chapter[1]) && (unit.dates ?? [unit.value]).includes(item.value))
  })
}

/** A heading that groups lessons: `Unit 2: How cells control division`, `Module 3 — Immunity`. */
const UNIT_HEADING = /^(?:unit|module|part|theme|section)\s+(?:\d+|[ivx]+)\s*[:.\-–—]\s*\S/i

/** BIOL 103 writes its schedule as unit headings with that unit's lessons
 *  under each. The line scan finds the headings as undated items; here each
 *  dated lesson takes the last heading above it in the file, and the headings
 *  stop being rows of their own. Only when headings really sit between
 *  lessons: a course description that lists the units elsewhere is left
 *  alone. */
function attachUnitHeadings(items: SyllabusItem[]): SyllabusItem[] {
  const firstLine = (item: SyllabusItem) => Number(item.evidence.location.match(/^lines? (\d+)/)?.[1] ?? NaN)
  const headings = items.filter((item) => item.kind === 'units' && !item.value && UNIT_HEADING.test(item.label) && Number.isFinite(firstLine(item)))
    .sort((a, b) => firstLine(a) - firstLine(b))
  const lessons = items.filter((item) => item.kind === 'units' && item.value && Number.isFinite(firstLine(item)))
  if (headings.length < 2 || lessons.length < 2) return items
  const under = new Map<SyllabusItem, SyllabusItem[]>()
  for (const lesson of lessons) {
    const heading = [...headings].reverse().find((h) => firstLine(h) < firstLine(lesson))
    if (heading) under.set(heading, [...(under.get(heading) ?? []), lesson])
  }
  // Every heading but possibly the last must head lessons, and at least two must.
  const used = headings.filter((h) => under.has(h))
  if (used.length < 2 || headings.slice(0, -1).some((h) => !under.has(h))) return items
  for (const [heading, group] of under) group.forEach((lesson) => { lesson.unit = heading.label.replace(/\s+/g, ' ').trim() })
  const drop = new Set(used)
  return items.filter((item) => !drop.has(item))
}

/** Last-pass corrections that need the whole proposal (audit F8, F12). */
function tidyItems(items: SyllabusItem[]): SyllabusItem[] {
  const lineSpan = (location: string): number[] => {
    const match = location.match(/^lines? (\d+)(?:-(\d+))?/)
    if (!match) return []
    const start = Number(match[1])
    const end = Number(match[2] ?? match[1])
    return Array.from({ length: Math.max(1, end - start + 1) }, (_, offset) => start + offset)
  }
  // A grading row (`Unit 1 Project (Social Sciences)` beside its 10%) is a
  // grade category, not a unit of the schedule.
  const weightLines = new Set(items.filter((item) => item.kind === 'weights').flatMap((item) => lineSpan(item.evidence.location)))
  // One grade scale: the band list, not a section body that ran on into the
  // assignment table.
  const scales = items.filter((item) => item.kind === 'logistics' && item.label === 'Grade scale')
  const keptScale = scales.length > 1 ? scales.reduce((shortest, item) => ((item.value ?? '').length < (shortest.value ?? '').length ? item : shortest)) : undefined
  return items
    .filter((item) => !(item.kind === 'units' && !item.value && lineSpan(item.evidence.location).some((line) => weightLines.has(line))))
    .filter((item) => !keptScale || item.kind !== 'logistics' || item.label !== 'Grade scale' || item === keptScale)
    .map((item) => {
      if (item.kind !== 'identity' || !item.value) return item
      // `How Cells Work (section 002)!`: the section is its own fact.
      const title = item.value.replace(/\s*\(section\s+\d+\)\s*/i, ' ').replace(/\s*[!]+\s*$/, '').replace(/\s+/g, ' ').trim()
      return title === item.value ? item : { ...item, value: title }
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
      const label = ((isExam ? scheduleExam(line) : deadlineLabel(lines, index))
        ?? trimConnectives(line.replace(date[0], '')))
        || (isExam ? 'Exam' : 'Deadline')
      // `value` is ISO or unset, never display text: the app writes it straight
      // into `dueDate`. The date as the syllabus wrote it stays visible in context.
      push(items, kind, label, iso, iso ? 'high' : 'low', evidence, iso ? undefined : `Date as written: ${date[0]}`)
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
      if (topic && !/^(?:exam\s*\d*|final exam)$/i.test(topic) && !isNoClassRow(topic)) {
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
    if (isPlaceLine(line) && !items.some((item) => item.kind === 'logistics' && item.evidence.location === evidence.location)) {
      push(items, 'logistics', line, undefined, 'high', evidence)
      searched.logistics = `Logistics found`
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
  // A lesson's own objectives inside the schedule table belong to that lesson
  // (`objectives` on its unit), not to the course's goals.
  const prepared = prepareScheduleText(lines)
  const regions = detectScheduleRegions(prepared.lines)
  const inSchedule = new Set<number>()
  regions.forEach((region) => { for (let at = region.start; at < region.end; at += 1) inSchedule.add(prepared.origin[at]) })
  lines.forEach((line, index) => {
    if (GENERIC_OUTCOMES_HEADER.test(line) || inSchedule.has(index)) return
    if (!STANDARD_HEADER.test(line)) return
    const inline = line.split(/[:—–-]/, 2)[1]
    const inlineLabel = inline ? standardLabel(inline) : undefined
    if (inlineLabel) push(items, 'standards', inlineLabel, undefined, 'high', lineEvidence(line, index))
    for (let next = index + 1; next < Math.min(lines.length, index + 64); next += 1) {
      const candidate = lines[next]
      if (STANDARD_HEADER.test(candidate) || STANDARD_SECTION_END.test(candidate)) break
      if (inSchedule.has(next)) break
      const bullet = standardBullet(lines, next)
      const label = bullet?.label ?? standardLabel(candidate)
      if (label) push(items, 'standards', label, undefined, 'high', lineEvidence(candidate, next))
      if (bullet) next = bullet.lastIndex
    }
  })
  regions.forEach((region) => {
    const segment = normalizeScheduleCells(prepared, region)
    parseFlattenedSchedule(segment, items, searched, yearHint)
    parseDatedScheduleRows(segment, items, searched, yearHint)
    parseWeekRangeSchedule(segment, items, searched, yearHint)
  })
  parsePointBasedWeights(lines, items, searched)
  parseNumericActionDates(lines, items, searched, yearHint)
  parseDatedFacts(lines, items, searched, yearHint)
  parsePolicySections(lines, items, searched)
  parseSourceBackedSections(lines, items, searched)
  parseRegistrarSections(lines, items, searched)
  parseStaffContacts(lines, items, searched)
  parseHeaderInstructor(lines, items, searched)
  parseCourseDetails(lines, items, searched)
  parseOperationalContext(lines, items, searched)
  parseAssistantCountConflict(lines, items)
  parseSectionFinals(lines, items, searched, yearHint)
  attachExamScope(lines, items)
  if (items.some((item) => item.kind === 'standards')) searched.standards = 'Stated learning standards found'
  const scanDetected = text.replace(/\s/g, '').length < 80
  const structureFound = STRUCTURAL.filter((signal) => items.some((item) => item.kind === signal))
  const numberedItems = lines.filter((line) => /^\(?\d{1,2}[.)]\s+\S/.test(line)).length
  // Only a readable document with NO structural signal at all is called unrecognized.
  // Deliberately conservative: a one-page syllabus with just office hours still counts
  // as a syllabus, and the student can override this either way.
  const documentKind: DocumentKind = !scanDetected && structureFound.length === 0 ? 'unrecognized' : 'syllabus'
  return { sourceName, sourceKind, text, items: tidyItems(attachUnitHeadings(dropLessonChapterReadings(groupSessionsIntoLessons(pruneRedundantLogistics(items))))), searched, scanDetected, documentKind, structureFound, numberedItems }
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

export interface SyllabusExtractionProgress extends DocumentExtractionProgress {
  fileIndex: number
  fileCount: number
  fileName: string
  /** Monotonic, batch-wide progress from 0 to 1. */
  overallProgress: number
}

/** Read a related syllabus packet sequentially. OCR is intentionally not run
 * concurrently: two browser-local workers compete for memory and make large
 * scanned PDFs less reliable. The progress message keeps the active position
 * visible so moving to the next file never resembles a reset. */
export async function extractSyllabusFiles(
  files: readonly File[],
  options: Omit<DocumentExtractionOptions, 'recoverScannedPdfPages' | 'onProgress'> & {
    onProgress?: (progress: SyllabusExtractionProgress) => void
  } = {},
): Promise<SyllabusProposal> {
  if (!files.length) throw new Error('Choose at least one syllabus file to read.')
  const proposals: SyllabusProposal[] = []
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    const prefix = `File ${index + 1} of ${files.length}`
    let lastOverallProgress = index / files.length
    const report = (progress: DocumentExtractionProgress) => {
      const bounded = Math.max(0, Math.min(1, progress.progress))
      const fileProgress = progress.phase === 'ocr' ? 0.8 + bounded * 0.2 : bounded * 0.8
      lastOverallProgress = Math.max(lastOverallProgress, (index + fileProgress) / files.length)
      options.onProgress?.({
        ...progress,
        fileIndex: index + 1,
        fileCount: files.length,
        fileName: file.name || `File ${index + 1}`,
        overallProgress: lastOverallProgress,
        message: `${prefix} · ${progress.message}`,
      })
    }
    report({ phase: 'extracting', page: 0, pageCount: 0, progress: 0, message: 'Preparing…' })
    try {
      proposals.push(await extractSyllabusFile(file, {
        signal: options.signal,
        onProgress: report,
      }))
      options.onProgress?.({
        phase: 'extracting', page: 0, pageCount: 0, progress: 1,
        fileIndex: index + 1, fileCount: files.length, fileName: file.name || `File ${index + 1}`,
        overallProgress: (index + 1) / files.length,
        message: `${prefix} · Finished ${file.name || `file ${index + 1}`}`,
      })
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : 'This file could not be read.'
      throw new Error(`Could not read ${file.name || `file ${index + 1}`} (${index + 1} of ${files.length}). ${detail}`, { cause })
    }
  }
  return mergeSyllabusProposals(proposals)
}

export function weightGap(items: SyllabusItem[]) {
  const weights = items.filter((item) => item.kind === 'weights').map((item) => Number(item.value?.replace('%', ''))).filter(Number.isFinite)
  return weights.length ? 100 - weights.reduce((sum, weight) => sum + weight, 0) : null
}
