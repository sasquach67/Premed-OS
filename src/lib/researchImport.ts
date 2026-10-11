/**
 * Research document import — deterministic, on-device, no AI key.
 *
 * Same contract as the syllabus importer (`academics/syllabusParser.ts`): read a
 * file into text, propose typed items with the exact quote they came from, and
 * write nothing until the student confirms. Every proposed item maps onto an
 * existing Research record, so this needs no storage migration:
 *
 *   lab details  → the lab (`experiences`, category research), empty fields only
 *   people       → `persons` + `researchMemberships`
 *   lab days     → `experienceHourEntries` (kind logged)
 *   upcoming     → `researchUpcomingItems`
 *   meetings, checklist, reading, guidelines → `researchReminders` (pinned text)
 *
 * Lab notes rule (Andy, Oct 2026): a dated entry is a lab day unless a date says
 * otherwise — a future heading date, or a dated deadline inside the entry,
 * becomes Upcoming instead.
 */
import { extractDocumentText, type DocumentExtractionOptions, type DocumentSourceKind } from '@/lib/academics/documentText'
import { localDay, validResearchDay } from '@/lib/research'
import type { AppData, CollectionRecord, ExperienceEntry, Person } from '@/lib/types'

export type ResearchImportKind = 'lab' | 'people' | 'logs' | 'upcoming' | 'meetings' | 'checklist' | 'reading' | 'guidelines'
export type ResearchDocumentKind = 'lab-notes' | 'onboarding' | 'mixed' | 'unrecognized'
export type ResearchLabField = 'org' | 'since' | 'institution' | 'pi'

export interface ResearchImportEvidence { quote: string; location: string }
export interface ResearchImportItem {
  id: string
  kind: ResearchImportKind
  /** Display text, and the saved text for reminder-backed kinds. */
  label: string
  /** Secondary text: checklist contact/link, log thoughts, upcoming note, citation group. */
  detail?: string
  date?: string
  hours?: number
  labField?: ResearchLabField
  person?: { name: string; role?: string; email?: string; phone?: string }
  /** Marks the person the lab's PI link should point to. */
  isPi?: boolean
  confidence: 'high' | 'low'
  /** Pre-checked in review. Reference-heavy kinds start unchecked. */
  selected: boolean
  evidence: ResearchImportEvidence
}

export interface ResearchImportProposal {
  sourceName: string
  sourceKind: DocumentSourceKind
  documentKind: ResearchDocumentKind
  scanDetected: boolean
  items: ResearchImportItem[]
  /** Kinds this source was checked for and did not contain. */
  notFound: ResearchImportKind[]
}

export const RESEARCH_IMPORT_KINDS: ResearchImportKind[] = ['lab', 'people', 'logs', 'upcoming', 'meetings', 'checklist', 'reading', 'guidelines']
export const RESEARCH_IMPORT_TITLES: Record<ResearchImportKind, string> = {
  lab: 'Lab details', people: 'People', logs: 'Lab days', upcoming: 'Upcoming', meetings: 'Standing meetings',
  checklist: 'Onboarding checklist', reading: 'Reading list', guidelines: 'Lab guidelines',
}

// ── Shared patterns ─────────────────────────────────────────────────────────

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const MONTH = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
const WEEKDAY = '(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:day|nesday|sday|rsday|urday)?'
const LEADING_WEEKDAY = `(?:${WEEKDAY}\\.?,?\\s+)?`
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/
const URL = /^(?:https?:\/\/|www\.)\S+$|^[\w-]+(?:\.[\w-]+)+\.(?:com|org|edu|net|io|gov)(?:\/\S*)?$/i
const PHONE = /^\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/
const SEASON_YEAR = /^(fall|spring|summer|winter)\s+(20\d{2})$/i
const DEADLINE_CUE = /\b(?:due|deadline|submit(?:ted|ting)?\s+by|abstracts?\s+(?:are\s+)?due|scheduled\s+for|upcoming|reminder)\b/i

const SECTION_HEADINGS: Array<[Section, RegExp]> = [
  ['checklist', /^(?:onboarding\s+)?(?:checklist|to-?do(?:\s+list)?|getting\s+started|first\s+(?:week|steps))\s*:?$/i],
  ['guidelines', /^(?:(?:lab\s+)?guidelines(?:\s+(?:and|&)\s+expectations)?|expectations|lab\s+(?:rules|policies|policy)|policies|code\s+of\s+conduct)\s*:?$/i],
  ['reading', /^(?:reading\s+list|readings?|key\s+(?:reading|papers)|required\s+reading|references|background\s+reading)\s*:?$/i],
  ['skip', /^(?:acknowledg(?:e)?ment(?:\s+(?:and|&)\s+assurance)?|signatures?|sign[- ]off)\s*:?$/i],
]
type Section = 'none' | 'checklist' | 'guidelines' | 'reading' | 'skip'

const ROLE_LABEL = /^(lab\s+manager|lab\s+coordinator|principal\s+investigator|p\.?i\.?|post-?doc(?:toral\s+(?:fellow|researcher))?|graduate\s+student|grad\s+student|research\s+(?:technician|tech|associate|scientist)|lab\s+(?:technician|tech)|bench\s+mentor|mentor|lab\s+animal\s+coordinator|lab\s+administrator|administrator)(?![a-z])\s*:?\s*(.*)$/i
const NAME = /^(?:(?:dr|prof)\.?\s+)?[A-Z][a-zA-Z'’-]+(?:\s+[A-Z][a-zA-Z'’.-]+){1,3}$/
const NOT_A_NAME = /\b(?:lab|laboratory|road|street|address|calendar|seminar|meeting|group|checklist|guidelines|phone|office|building|center|hall|server|access|training|forms?|list|reading|reviews?|literature)\b/i

const clean = (value: string) => value.replace(/\s+/g, ' ').replace(/[\s:;,–—-]+$/, '').trim()
const norm = (value: string) => value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const isDetailLine = (line: string) => EMAIL.test(line) || URL.test(line) || /^\S+@\S+$/.test(line) || /^\(.*\)$/.test(line)
const sentences = (text: string) => text.split(/(?<=[.!?])\s+/)

function sectionFor(line: string): Section | undefined {
  if (line.length > 70) return undefined
  return SECTION_HEADINGS.find(([, pattern]) => pattern.test(line))?.[0]
}

// ── Dates and hours ─────────────────────────────────────────────────────────

const pad = (value: number) => String(value).padStart(2, '0')
function isoFrom(year: number, month: number, day: number): string | undefined {
  const iso = `${year}-${pad(month)}-${pad(day)}`
  return validResearchDay(iso) ? iso : undefined
}

interface LeadingDate { iso: string; explicitYear: boolean; rest: string }
const LEADING_DATE_PATTERNS: Array<[RegExp, (match: RegExpMatchArray) => { year?: number; month: number; day: number }]> = [
  [/^(\d{4})-(\d{1,2})-(\d{1,2})\b/, (m) => ({ year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) })],
  [new RegExp(`^${LEADING_WEEKDAY}(\\d{1,2})[/.](\\d{1,2})(?:[/.](\\d{2,4}))?(?![\\d:])`, 'i'), (m) => ({ year: m[3] ? Number(m[3].length === 2 ? `20${m[3]}` : m[3]) : undefined, month: Number(m[1]), day: Number(m[2]) })],
  [new RegExp(`^${LEADING_WEEKDAY}${MONTH}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`, 'i'), (m) => ({ year: m[3] ? Number(m[3]) : undefined, month: MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) + 1, day: Number(m[2]) })],
  [new RegExp(`^${LEADING_WEEKDAY}(\\d{1,2})(?:st|nd|rd|th)?\\s+${MONTH}\\.?(?:,?\\s+(\\d{4}))?\\b`, 'i'), (m) => ({ year: m[3] ? Number(m[3]) : undefined, month: MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1, day: Number(m[1]) })],
]

/** A date that opens a line. Yearless dates use the document's latest explicit
 * year, else today's. Looking back (lab days), a yearless date more than a week
 * ahead is last year's; looking ahead (deadlines), a passed one is next year's. */
export function leadingDate(line: string, yearHint: number, today: string, direction: 'past' | 'future' = 'past'): LeadingDate | undefined {
  for (const [pattern, read] of LEADING_DATE_PATTERNS) {
    const match = line.match(pattern)
    if (!match) continue
    const parts = read(match)
    if (parts.month < 1 || parts.month > 12) continue
    let iso = isoFrom(parts.year ?? yearHint, parts.month, parts.day)
    if (!iso) continue
    if (parts.year == null && direction === 'future') {
      if (iso < today) iso = isoFrom(yearHint + 1, parts.month, parts.day) ?? iso
    } else if (parts.year == null) {
      const weekAhead = new Date(`${today}T12:00:00`); weekAhead.setDate(weekAhead.getDate() + 7)
      if (iso > localDay(weekAhead)) iso = isoFrom(yearHint - 1, parts.month, parts.day) ?? iso
    }
    return { iso, explicitYear: parts.year != null, rest: line.slice(match[0].length) }
  }
  return undefined
}

const INLINE_DATE = new RegExp(`\\b(?:${MONTH}\\.?\\s+\\d{1,2}(?:,?\\s+\\d{4})?|\\d{1,2}/\\d{1,2}(?:/\\d{2,4})?)\\b`, 'i')

function to24(hour: number, minute: number, meridiem?: string) {
  const base = hour % 12
  return (meridiem?.toLowerCase() === 'pm' ? base + 12 : base) + minute / 60
}

/** Hours from "3h", "2.5 hrs", "Hours: 3" or a clock range such as "1–4:30pm". */
export function parseHours(text: string): { hours: number; match: string } | undefined {
  const explicit = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b\.?/i) ?? text.match(/\bhours?\s*[:=]\s*(\d+(?:\.\d+)?)/i)
  if (explicit) {
    const hours = Number(explicit[1])
    if (hours > 0 && hours <= 24) return { hours, match: explicit[0] }
  }
  const range = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b(\d{1,2}):(\d{2})\s*(?:-|–|—|to)\s*(\d{1,2}):(\d{2})\b/i)
  if (!range) return undefined
  let start: number, end: number
  const hoursOk = (...values: Array<string | undefined>) => values.every((value) => value == null || Number(value) <= 12)
  const minutesOk = (...values: Array<string | undefined>) => values.every((value) => value == null || Number(value) < 60)
  if (range[1] ? !hoursOk(range[1], range[4]) || !minutesOk(range[2], range[5]) : Number(range[7]) > 23 || Number(range[9]) > 23 || !minutesOk(range[8], range[10])) return undefined
  if (range[1]) {
    const endMeridiem = range[6]
    const startMeridiem = range[3] ?? (Number(range[1]) % 12 > Number(range[4]) % 12 && endMeridiem.toLowerCase() === 'pm' ? 'am' : endMeridiem)
    start = to24(Number(range[1]), Number(range[2] ?? 0), startMeridiem)
    end = to24(Number(range[4]), Number(range[5] ?? 0), endMeridiem)
  } else {
    start = Number(range[7]) + Number(range[8]) / 60
    end = Number(range[9]) + Number(range[10]) / 60
    if (end <= start) end += 12
  }
  const hours = Math.round((end - start) * 4) / 4
  return hours > 0 && hours <= 16 ? { hours, match: range[0] } : undefined
}

/** Drops PubMed bookkeeping and long author lists; keeps title, journal, year and DOI. */
export function compactCitation(text: string): string {
  let value = text.replace(/\s*(?:Epub[^.]*\.|PMID:\s*\d+;?|PMCID:\s*PMC\d+\.?)/g, ' ')
  const authors = value.match(/^([^.]+?)\.\s+(?=[A-Z])/)
  if (authors && (authors[1].match(/,/g) ?? []).length >= 3 && !/et al/i.test(authors[1])) value = `${authors[1].split(',')[0].trim()} et al. ${value.slice(authors[0].length)}`
  return value.replace(/\s+/g, ' ').replace(/(\.\s*)+\.\s*$/, '.').replace(/\s+\./g, '.').trim()
}

// ── Parsing ─────────────────────────────────────────────────────────────────

interface Line { text: string; number: number }

export function parseResearchText(raw: string, sourceName = 'Pasted text', options: { today?: string; sourceKind?: DocumentSourceKind } = {}): ResearchImportProposal {
  const today = options.today ?? localDay()
  const lines: Line[] = raw.split(/\r?\n/).map((text, index) => ({ text: clean(text.replace(/^[\s•●▪◦*‣-]+(?=\S)/, '')), number: index + 1 })).filter((line) => line.text)
  let counter = 0
  const items: ResearchImportItem[] = []
  const add = (item: Omit<ResearchImportItem, 'id' | 'selected'> & { selected?: boolean }) => {
    items.push({ selected: true, ...item, id: `import-${++counter}` })
  }
  const at = (line: Line) => ({ quote: line.text, location: `line ${line.number}` })
  const fullText = lines.map((line) => line.text).join('\n')

  // Lab identity.
  const labLine = lines.slice(0, 12).find((line) => /\b[A-Z][\w'’.-]+(?:\s+[A-Z][\w'’.-]+)*\s+Lab(?:oratory)?\b/.test(line.text))
  const labName = labLine?.text.match(/\b((?:[A-Z][\w'’.-]+\s+)+Lab(?:oratory)?)\b/)?.[1].replace(/^(?:Welcome\s+to\s+)?(?:the\s+)?/i, '').trim()
  if (labLine && labName) add({ kind: 'lab', labField: 'org', label: labName, confidence: /welcome to/i.test(labLine.text) ? 'high' : 'low', evidence: at(labLine) })
  const seasonLine = lines.slice(0, 8).find((line) => SEASON_YEAR.test(line.text))
  if (seasonLine) add({ kind: 'lab', labField: 'since', label: seasonLine.text.replace(/^\w/, (c) => c.toUpperCase()), confidence: 'low', evidence: at(seasonLine) })
  const eduDomains = [...fullText.matchAll(/@(?:[\w-]+\.)*([\w-]+)\.edu\b/gi)].map((match) => match[1].toLowerCase())
  if (eduDomains.length) {
    const common = [...new Set(eduDomains)].sort((a, b) => eduDomains.filter((d) => d === b).length - eduDomains.filter((d) => d === a).length)[0]
    const evidenceLine = lines.find((line) => line.text.toLowerCase().includes(`${common}.edu`))!
    add({ kind: 'lab', labField: 'institution', label: common.length <= 5 ? common.toUpperCase() : common.replace(/^\w/, (c) => c.toUpperCase()), confidence: 'low', evidence: at(evidenceLine) })
  }

  // People: role label → name → email; "X’s office phone"; "contact Name Surname".
  const people = new Map<string, { item: Omit<ResearchImportItem, 'id' | 'selected'>; phones: string[] }>()
  const upsertPerson = (name: string, line: Line, patch: { role?: string; email?: string; phone?: string }, confidence: 'high' | 'low' = 'high') => {
    const tokens = name.toLowerCase().split(/\s+/)
    const existing = [...people.values()].find((entry) => {
      const other = entry.item.person!.name.toLowerCase().split(/\s+/)
      return other.join(' ') === tokens.join(' ') || ((other.length === 1 || tokens.length === 1) && other[0] === tokens[0])
    })
    if (existing) {
      const person = existing.item.person!
      if (name.split(/\s+/).length > person.name.split(/\s+/).length) person.name = name
      if (patch.role && !person.role) person.role = patch.role
      if (patch.email && !person.email) person.email = patch.email
      if (patch.phone) existing.phones.push(patch.phone)
      return existing
    }
    const entry: { item: Omit<ResearchImportItem, 'id' | 'selected'>; phones: string[] } = { item: { kind: 'people', label: name, person: { name, role: patch.role, email: patch.email }, confidence, evidence: at(line) }, phones: patch.phone ? [patch.phone] : [] }
    people.set(`${tokens.join(' ')}:${people.size}`, entry)
    return entry
  }
  lines.forEach((line, index) => {
    const role = line.text.match(ROLE_LABEL)
    if (role && line.text.length <= 60) {
      const inline = clean(role[2] ?? '')
      const nameLine = inline && NAME.test(inline) ? { ...line, text: inline } : lines[index + 1]
      if (nameLine && NAME.test(nameLine.text) && !NOT_A_NAME.test(nameLine.text)) {
        const email = lines.slice(index + 1, index + 4).map((next) => next.text.match(EMAIL)?.[0]).find(Boolean)
        upsertPerson(nameLine.text, line, { role: clean(role[1]).replace(/\b\w/g, (c) => c.toUpperCase()).replace(/^P\.?i\.?$/i, 'PI'), email })
      }
    }
    const phone = line.text.match(/^([A-Z][a-z]+)[’']s\s+(office|cell|mobile|work|lab|home)?\s*phone\s*:?\s*(.*)$/i)
    if (phone) {
      const number = PHONE.test(phone[3]) ? phone[3] : lines[index + 1] && PHONE.test(lines[index + 1].text) ? lines[index + 1].text : undefined
      if (number) upsertPerson(phone[1], line, { phone: `${phone[2] ? `${phone[2].toLowerCase()} ` : ''}${number}` }, 'low')
    }
    for (const match of line.text.matchAll(/\bcontact\s+([A-Z][a-z]+\s+[A-Z][a-zA-Z'’-]+)\s+(to\s+[^.]+)/g)) {
      const email = lines.slice(index + 1, index + 3).map((next) => next.text.match(EMAIL)?.[0]).find(Boolean)
      upsertPerson(match[1], line, { role: `Contact for ${clean(match[2]).replace(/^to\s+(?:be\s+)?(?:added\s+to\s+)?(?:the\s+)?/i, '')}`, email })
    }
  })
  // "Anne Marie is the Lab Animal Coordinator, manager of…" adds to a known person's role.
  for (const sentence of sentences(fullText.replace(/\n/g, ' '))) {
    const fact = sentence.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+is\s+(?:the|our)\s+([A-Z][\w ]{3,40}?)(?:,|\.| and )/)
    if (!fact) continue
    const entry = [...people.values()].find((candidate) => candidate.item.person!.name.startsWith(fact[1]))
    if (entry && !entry.item.person!.role?.toLowerCase().includes(fact[2].toLowerCase())) entry.item.person!.role = [entry.item.person!.role, fact[2]].filter(Boolean).join(' · ')
  }
  // PI: the first name students meet 1:1 or phone, plus the lab's surname.
  const piMentions = [...fullText.matchAll(/(?:1:1\s+(?:meeting\s+)?(?:time\s+)?with|cc|approval\s+of|([A-Z][a-z]+)[’']s\s+(?:[Aa]pproval|[Dd]oor|[Oo]ffice))\s*([A-Z][a-z]+)?/g)]
    .map((match) => match[2] ?? match[1]).filter((name): name is string => Boolean(name))
  const piFirst = piMentions.sort((a, b) => piMentions.filter((n) => n === b).length - piMentions.filter((n) => n === a).length)[0]
  const labSurname = labName?.match(/^([A-Z][\w'’-]+)\s+Lab/)?.[1]
  if (piFirst && labSurname) {
    const piLine = lines.find((line) => line.text.includes(piFirst))!
    const entry = upsertPerson(`${piFirst} ${labSurname}`, piLine, { role: 'PI' }, 'low')
    entry.item.isPi = true
    entry.item.confidence = 'low'
    add({ kind: 'lab', labField: 'pi', label: entry.item.person!.name, confidence: 'low', evidence: at(piLine) })
  }
  for (const { item, phones } of people.values()) {
    if (phones.length) item.person!.phone = phones.join(' · ')
    const person = item.person!
    add({ ...item, label: person.name, detail: [person.role, person.email, person.phone].filter(Boolean).join(' · ') })
  }

  // Standing meetings: a weekday + time line, titled by the line above.
  const meetingTimes = new RegExp(`^(${WEEKDAY})s?\\b,?\\s*([0-9:apm\\s–—-]+(?:am|pm)?)(.*)$`, 'i')
  const seenMeetings = new Set<string>()
  const cueFor = (title: string) => {
    const full = norm(title), short = full.replace(/\s+group\s+meeting$/, ' group')
    for (const sentence of sentences(fullText.replace(/\n/g, ' '))) {
      const lower = norm(sentence)
      const position = lower.indexOf(full) >= 0 ? lower.indexOf(full) : lower.indexOf(short)
      if (position < 0) continue
      const before = lower.slice(0, position)
      const required = before.lastIndexOf('required'), encouraged = before.lastIndexOf('encouraged')
      if (required < 0 && encouraged < 0) continue
      return required > encouraged ? 'required' : 'encouraged'
    }
    return undefined
  }
  lines.forEach((line, index) => {
    const match = line.text.match(meetingTimes)
    if (!match || !/\d(?::\d{2})?\s*(?:am|pm)?\s*[–—-]\s*\d/i.test(match[2]) || index === 0) return
    const title = lines[index - 1].text
    if (title.length > 60 || meetingTimes.test(title) || sectionFor(title) || /\.$/.test(title)) return
    const key = norm(title)
    if (seenMeetings.has(key)) return
    seenMeetings.add(key)
    const next = lines[index + 1]?.text
    const location = next && next.length <= 40 && /\d|auditorium|room|hall|building|center/i.test(next) && !meetingTimes.test(next) ? next : undefined
    const day = match[1].replace(/^\w/, (c) => c.toUpperCase())
    const cadence = clean(match[3]).replace(/^\(|\)$/g, '')
    const cue = cueFor(title)
    add({ kind: 'meetings', label: `${title} — ${day} ${clean(match[2]).replace(/\s*-\s*/g, '–')}${cadence ? ` (${cadence})` : ''}${location ? ` · ${location}` : ''}${cue ? ` · ${cue}` : ''}`, confidence: 'high', evidence: at(line) })
  })
  for (const line of lines) {
    const standing = line.text.match(/\bstanding\s+1:1\s+meeting\s+with\s+([A-Z][a-z]+)/)
    if (standing && !seenMeetings.has(norm(`1 1 ${standing[1]}`))) {
      seenMeetings.add(norm(`1 1 ${standing[1]}`))
      const cue = /\brequired\b/i.test(line.text) ? ' · required' : ''
      add({ kind: 'meetings', label: `1:1 with ${standing[1]} — standing meeting, time not set in this document${cue}`, confidence: 'low', evidence: at(line) })
    }
  }

  // Sectioned onboarding content: checklist, guidelines, reading list.
  let section: Section = 'none'
  let group = ''
  let lastChecklist: ResearchImportItem | undefined
  for (const line of lines) {
    const heading = sectionFor(line.text)
    if (heading) { section = heading; group = ''; lastChecklist = undefined; continue }
    if (section === 'checklist') {
      if ((isDetailLine(line.text) || (labName && norm(line.text) === norm(labName))) && lastChecklist) {
        lastChecklist.detail = [lastChecklist.detail, line.text].filter(Boolean).join(' · ')
        continue
      }
      if (line.text.length > 140 || isDetailLine(line.text)) continue
      add({ kind: 'checklist', label: line.text, confidence: 'high', evidence: at(line) })
      lastChecklist = items[items.length - 1]
    } else if (section === 'guidelines') {
      if (/^updated\b|\bthis document\b/i.test(line.text)) continue
      if (line.text.length <= 60 && !/[.!?]$/.test(line.text)) { group = line.text; continue }
      if (line.text.length >= 25) add({ kind: 'guidelines', label: line.text, detail: group || undefined, confidence: 'high', selected: false, evidence: at(line) })
    } else if (section === 'reading') {
      const citation = /\bdoi\b|\bPMID\b|https?:\/\/doi|\bet al\b|\(\s*(?:19|20)\d{2}\s*\)|(?:19|20)\d{2}\s*;\s*\d+/i.test(line.text) && line.text.length >= 50
      if (citation) add({ kind: 'reading', label: compactCitation(line.text), detail: group || undefined, confidence: 'high', selected: false, evidence: at(line) })
      else if (line.text.length <= 70) group = /^(?:reviews?|primary literature)\s*:?$/i.test(line.text) && group ? `${group.split(' · ')[0]} · ${line.text.replace(/:$/, '')}` : line.text.replace(/:$/, '')
    }
  }

  // Lab notes: every line that opens with a date starts an entry.
  const headerYear = lines.slice(0, 5).map((line) => line.text.match(/\b(20\d{2})\b/)?.[1]).find(Boolean)
  let yearHint = Number(headerYear ?? today.slice(0, 4))
  const entries: Array<{ line: Line; date: LeadingDate; body: Line[] }> = []
  let currentEntry: (typeof entries)[number] | undefined
  for (const line of lines) {
    const date = line.text.length <= 400 ? leadingDate(line.text, yearHint, today) : undefined
    if (date) {
      if (date.explicitYear) yearHint = Number(date.iso.slice(0, 4))
      currentEntry = { line, date, body: [] }
      entries.push(currentEntry)
      continue
    }
    if (sectionFor(line.text)) { currentEntry = undefined; continue }
    currentEntry?.body.push(line)
  }
  const logItems: ResearchImportItem[] = []
  for (const entry of entries) {
    const cells = entry.line.text.split(/\t|\s*,\s*(?=\S)/)
    const tableHours = cells.length >= 2 && /^\d+(?:\.\d+)?$/.test(cells[1]?.trim() ?? '') ? Number(cells[1]) : undefined
    let rest = tableHours != null ? cells.slice(2).join(', ') : entry.date.rest
    const bodyText = entry.body.map((line) => line.text)
    const inRest = tableHours == null ? parseHours(rest) : undefined
    const inBody = tableHours == null && !inRest && bodyText[0] ? parseHours(bodyText[0]) : undefined
    const hours = tableHours != null ? { hours: tableHours } : inRest ?? inBody
    if (inRest) rest = rest.replace(inRest.match, ' ')
    if (inBody) { bodyText[0] = clean(bodyText[0].replace(inBody.match, ' ').replace(/^[\s:|,.–—-]+/, '').replace(/\(\s*\)/g, '')); if (!bodyText[0]) bodyText.shift() }
    rest = clean(rest.replace(/^[\s:|,.–—-]+/, '').replace(/\(\s*\)/g, ''))
    const note = rest || bodyText[0] || ''
    const thoughts = (rest ? bodyText : bodyText.slice(1)).join('\n')
    const future = entry.date.iso > today
    const cue = DEADLINE_CUE.test(note)
    if (future || (cue && entry.date.iso >= today)) {
      if (note) add({ kind: 'upcoming', label: note, date: entry.date.iso, detail: thoughts || undefined, confidence: 'high', evidence: at(entry.line) })
      continue
    }
    if (!note && !hours) continue
    add({ kind: 'logs', label: note, date: entry.date.iso, hours: hours?.hours, detail: thoughts || undefined, confidence: entry.date.explicitYear ? 'high' : 'low', evidence: at(entry.line) })
    logItems.push(items[items.length - 1])
    // A dated deadline written inside the entry is its own Upcoming item.
    for (const line of entry.body) {
      const inline = line.text.match(INLINE_DATE)
      if (!inline || !DEADLINE_CUE.test(line.text)) continue
      const parsed = leadingDate(inline[0], Number(entry.date.iso.slice(0, 4)), today, 'future')
      if (parsed && parsed.iso >= today) add({ kind: 'upcoming', label: line.text, date: parsed.iso, confidence: 'low', evidence: at(line) })
    }
  }

  const sectioned = new Set(items.filter((item) => ['checklist', 'guidelines', 'reading', 'meetings'].includes(item.kind)).map((item) => item.kind)).size
  let documentKind: ResearchDocumentKind = 'unrecognized'
  if (logItems.length >= 2 && sectioned >= 2) documentKind = 'mixed'
  else if (logItems.length >= 2) documentKind = 'lab-notes'
  else if (sectioned >= 2) documentKind = 'onboarding'
  else if (logItems.length || items.some((item) => item.kind !== 'lab')) documentKind = 'lab-notes'
  // An onboarding document's own dates ("Updated January 2026") are not lab days.
  const kept = documentKind === 'onboarding' ? items.filter((item) => item.kind !== 'logs') : items
  return {
    sourceName,
    sourceKind: options.sourceKind ?? 'text',
    documentKind,
    scanDetected: raw.trim().length < 12,
    items: kept,
    notFound: RESEARCH_IMPORT_KINDS.filter((kind) => !kept.some((item) => item.kind === kind)),
  }
}

export async function extractResearchFile(file: File, options: DocumentExtractionOptions & { today?: string } = {}): Promise<ResearchImportProposal> {
  const document = await extractDocumentText(file, { ...options, recoverScannedPdfPages: true })
  const proposal = parseResearchText(document.text, file.name || 'Document', { today: options.today, sourceKind: document.sourceKind })
  return { ...proposal, scanDetected: document.scanDetected || proposal.scanDetected }
}

// ── Applying confirmed items ────────────────────────────────────────────────

export type ResearchImportTarget = { kind: 'existing'; labId: string } | { kind: 'new'; name: string }
export interface ResearchImportSummary { lab: 'created' | 'updated' | 'unchanged'; labId: string; added: Partial<Record<ResearchImportKind, number>>; skipped: number }

const REMINDER_PREFIX: Partial<Record<ResearchImportKind, string>> = { checklist: 'To do: ', reading: 'Read: ', guidelines: 'Guideline: ' }
export function reminderText(item: ResearchImportItem): string {
  const detail = item.kind === 'checklist' && item.detail ? ` — ${item.detail}` : ''
  return `${REMINDER_PREFIX[item.kind] ?? ''}${item.label}${detail}`
}

const stamp = (now: number, order: number) => ({ id: crypto.randomUUID(), createdAt: now, updatedAt: now, archived: false, order })
const active = <T extends { deletedAt?: number; archived?: boolean }>(row: T) => !row.deletedAt && !row.archived

/** Writes only confirmed items; never overwrites a filled lab field and skips
 * rows that already exist, so importing the same document twice is harmless. */
export function applyResearchImport(draft: AppData, target: ResearchImportTarget, chosen: ResearchImportItem[], now = Date.now()): ResearchImportSummary {
  const summary: ResearchImportSummary = { lab: 'unchanged', labId: '', added: {}, skipped: 0 }
  const count = (kind: ResearchImportKind) => { summary.added[kind] = (summary.added[kind] ?? 0) + 1 }
  let lab: CollectionRecord<ExperienceEntry>
  if (target.kind === 'existing') {
    const existing = draft.experiences.find((entry) => entry.id === target.labId && entry.category === 'research' && active(entry))
    if (!existing) throw new Error('That lab is no longer available. Reopen the import and choose a lab.')
    lab = existing
  } else {
    draft.experiences.forEach((entry) => { if (entry.category === 'research' && entry.research?.current) entry.research = { ...entry.research, current: false } })
    lab = { ...stamp(now, now), category: 'research', org: target.name.trim() || 'My lab', role: '', description: '', status: 'active', tags: [], research: { current: true } }
    draft.experiences.push(lab)
    summary.lab = 'created'
  }
  summary.labId = lab.id
  const facts = { ...lab.research }
  for (const item of chosen.filter((entry) => entry.kind === 'lab')) {
    if (item.labField === 'since' && !facts.since && !lab.startDate) { facts.since = item.label; summary.lab = summary.lab === 'created' ? 'created' : 'updated' }
    if (item.labField === 'institution' && !facts.institution) { facts.institution = item.label; summary.lab = summary.lab === 'created' ? 'created' : 'updated' }
  }
  lab.research = facts
  lab.updatedAt = now

  let order = now
  const linkPi = chosen.some((entry) => entry.kind === 'lab' && entry.labField === 'pi')
  for (const item of chosen.filter((entry) => entry.kind === 'people' && entry.person)) {
    const found = item.person!
    const email = found.email?.toLowerCase()
    // Email is identity. Without one, only a same-named person already linked to
    // THIS lab counts as the same record — never a global match by name.
    const linkedHere = new Set(draft.researchMemberships.filter((link) => active(link) && link.experienceId === lab.id).map((link) => link.personId))
    let person: Person | undefined = (email ? draft.persons.find((candidate) => active(candidate) && candidate.email?.toLowerCase() === email) : undefined)
      ?? draft.persons.find((candidate) => active(candidate) && linkedHere.has(candidate.id) && norm(candidate.name) === norm(found.name))
    if (!person) {
      person = { ...stamp(now, order++), name: found.name, email: found.email, phone: found.phone, role: found.role }
      draft.persons.push(person as (typeof draft.persons)[number])
    } else {
      if (!person.phone && found.phone) person.phone = found.phone
      person.updatedAt = now
    }
    if (!draft.researchMemberships.some((link) => active(link) && link.experienceId === lab.id && link.personId === person!.id)) {
      draft.researchMemberships.push({ ...stamp(now, order++), experienceId: lab.id, personId: person.id, roleInLab: found.role })
      count('people')
    } else summary.skipped++
    if (item.isPi && linkPi && !lab.supervisorId) { lab.supervisorId = person.id; if (summary.lab === 'unchanged') summary.lab = 'updated' }
  }

  const sameText = (a?: string, b?: string) => norm(a ?? '') === norm(b ?? '')
  for (const item of chosen.filter((entry) => entry.kind === 'logs' && entry.date)) {
    const hours = item.hours ?? 0
    if (!validResearchDay(item.date) || (!hours && !item.label.trim())) { summary.skipped++; continue }
    if (draft.experienceHourEntries.some((row) => active(row) && row.experienceId === lab.id && row.date === item.date && sameText(row.note, item.label))) { summary.skipped++; continue }
    draft.experienceHourEntries.push({ ...stamp(now, order++), experienceId: lab.id, kind: 'logged', date: item.date, hours, note: item.label, thoughts: item.detail ?? '' })
    count('logs')
  }
  for (const item of chosen.filter((entry) => entry.kind === 'upcoming' && entry.date)) {
    if (!validResearchDay(item.date) || draft.researchUpcomingItems.some((row) => active(row) && row.experienceId === lab.id && row.date === item.date && sameText(row.title, item.label))) { summary.skipped++; continue }
    draft.researchUpcomingItems.push({ ...stamp(now, order++), experienceId: lab.id, date: item.date, title: item.label, note: item.detail ?? '' })
    count('upcoming')
  }
  const existingReminders = draft.researchReminders.filter((row) => active(row) && row.experienceId === lab.id)
  let reminderOrder = existingReminders.reduce((max, row) => Math.max(max, row.order), -1) + 1
  for (const kind of ['meetings', 'checklist', 'reading', 'guidelines'] as const) {
    for (const item of chosen.filter((entry) => entry.kind === kind)) {
      const text = reminderText(item)
      if (existingReminders.some((row) => sameText(row.text, text))) { summary.skipped++; continue }
      const row = { ...stamp(now, reminderOrder++), experienceId: lab.id, text }
      draft.researchReminders.push(row)
      existingReminders.push(row)
      count(kind)
    }
  }
  return summary
}
