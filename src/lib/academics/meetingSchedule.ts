const DAY_NAMES: Record<string, string> = {
  mon: 'Monday',
  monday: 'Monday',
  tue: 'Tuesday',
  tues: 'Tuesday',
  tuesday: 'Tuesday',
  wed: 'Wednesday',
  wednesday: 'Wednesday',
  thu: 'Thursday',
  thur: 'Thursday',
  thurs: 'Thursday',
  thursday: 'Thursday',
  fri: 'Friday',
  friday: 'Friday',
}

const COMPACT_DAY_SETS: Record<string, string[]> = {
  M: ['Monday'],
  T: ['Tuesday'],
  TU: ['Tuesday'],
  W: ['Wednesday'],
  R: ['Thursday'],
  TH: ['Thursday'],
  F: ['Friday'],
  MW: ['Monday', 'Wednesday'],
  MF: ['Monday', 'Friday'],
  WF: ['Wednesday', 'Friday'],
  MWF: ['Monday', 'Wednesday', 'Friday'],
  TR: ['Tuesday', 'Thursday'],
  TTH: ['Tuesday', 'Thursday'],
  TUTH: ['Tuesday', 'Thursday'],
}

const WRITTEN_DAY_PATTERN = /\b(?:Mon(?:day)?s?|Tue(?:s(?:day)?)?s?|Wed(?:nesday)?s?|Thu(?:r(?:s(?:day)?)?)?s?|Fri(?:day)?s?)\b/gi
const COMPACT_DAY_PATTERN = /\b(?:MWF|M\s*[/]\s*W\s*[/]\s*F|MW|M\s*[/]\s*W|WF|W\s*[/]\s*F|TR|TTH|TU\s*(?:[/]?|&|and)\s*TH|T\s*(?:[/&]|and)\s*TH|TU|TH)\b/i
const SINGLE_DAY_WITH_TIME_PATTERN = /\b(?:M|T|W|R|F)\b(?=\s+\d{1,2}(?::\d{2})?)/i
const MEETING_TIME_PATTERN = /\b(?:\d{3,4}\s*[-–]\s*\d{3,4}|\d{1,2}(?::\d{2})?(?:\s*(?:AM|PM))?\s*(?:[-–]|\bto\b)\s*\d{1,2}(?::\d{2})?(?:\s*(?:AM|PM))?|\d{1,2}(?::\d{2})?\s*(?:AM|PM))\b/i
const OFFICE_HOURS_PATTERN = /\b(?:office|student)\s+hours?\b|\bby\s+appointment\b/i

function uniqueInWeekOrder(days: string[]): string[] {
  const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  return order.filter((day) => days.includes(day))
}

/** Convert registrar shorthand and common written forms into the same
 * student-facing schedule value. Unknown text stays untouched so a student
 * never loses a non-standard schedule while editing it. */
export function normalizeMeetingDays(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  // Cadence qualifiers are meaningful student-entered schedule data. Do not
  // collapse "Alternating Fridays" into a falsely weekly Friday meeting.
  if (/\b(?:alternating|every\s+other)\b/i.test(trimmed)) return trimmed

  const written = trimmed.match(WRITTEN_DAY_PATTERN)
  if (written?.length) {
    const normalized = uniqueInWeekOrder(written.map((day) => {
      const token = day.toLowerCase()
      return DAY_NAMES[token] ?? DAY_NAMES[token.replace(/s$/, '')]
    }).filter(Boolean))
    if (normalized.length) return normalized.join(' · ')
  }

  const compact = trimmed.toUpperCase().replace(/[^A-Z]/g, '')
  const normalized = COMPACT_DAY_SETS[compact]
  return normalized ? normalized.join(' · ') : trimmed
}

/** Find a meeting-day expression inside a syllabus logistics line. */
export function extractMeetingDays(value: string): string {
  const written = value.match(WRITTEN_DAY_PATTERN)
  if (written?.length) return normalizeMeetingDays(written.join(' '))
  const compact = value.match(COMPACT_DAY_PATTERN)?.[0] ?? value.match(SINGLE_DAY_WITH_TIME_PATTERN)?.[0]
  return compact ? normalizeMeetingDays(compact) : ''
}

export function isOfficeHoursLine(value: string): boolean {
  return OFFICE_HOURS_PATTERN.test(value)
}

/** Meeting metadata must describe the class itself. Office/student hours can
 * contain the same weekday and time grammar but are a different fact. */
export function extractClassMeetingDays(value: string): string {
  return isOfficeHoursLine(value) ? '' : extractMeetingDays(value)
}

export function extractClassMeetingTime(value: string): string {
  if (isOfficeHoursLine(value)) return ''
  const matched = value.match(MEETING_TIME_PATTERN)?.[0]
  if (!matched) return ''
  const compact = matched.match(/^(\d{3,4})\s*[-–]\s*(\d{3,4})$/)
  if (compact) {
    const display = (raw: string) => {
      const numeric = Number(raw)
      const hour = Math.floor(numeric / 100)
      const minute = numeric % 100
      if (hour > 23 || minute > 59) return raw
      const meridiem = hour >= 12 ? 'PM' : 'AM'
      const clockHour = hour % 12 || 12
      return `${clockHour}:${String(minute).padStart(2, '0')} ${meridiem}`
    }
    return `${display(compact[1])}–${display(compact[2])}`
  }
  return matched
    .replace(/\s+/g, ' ')
    .replace(/(\d)\s*(am|pm)\b/gi, '$1 $2')
    .replace(/\s*(?:[-–]|\bto\b)\s*/gi, '–')
    .replace(/\b(am|pm)\b/gi, (meridiem) => meridiem.toUpperCase())
}

/** A parser may faithfully read a typo such as 8 AM-9:15 PM. Preserve the
 * source value, but flag a range longer than six hours for student review. */
export function isPlausibleClassMeetingTime(value?: string): boolean {
  if (!value) return false
  const compact = value.match(/\b(\d{3,4})\s*[-–]\s*(\d{3,4})\b/)
  if (compact) {
    const minutes = (raw: string) => Math.floor(Number(raw) / 100) * 60 + (Number(raw) % 100)
    const start = minutes(compact[1])
    const end = minutes(compact[2])
    if (start >= 24 * 60 || end >= 24 * 60 || Number(compact[1]) % 100 > 59 || Number(compact[2]) % 100 > 59) return false
    let duration = end - start
    if (duration <= 0) duration += 24 * 60
    return duration <= 6 * 60
  }
  const parts = value.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/gi)
  if (!parts?.length) return false
  if (parts.length === 1) return true
  const minutes = (part: string) => {
    const match = part.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i)
    if (!match) return 0
    let hour = Number(match[1]) % 12
    if (match[3]?.toUpperCase() === 'PM') hour += 12
    return hour * 60 + Number(match[2] ?? 0)
  }
  let duration = minutes(parts[1]) - minutes(parts[0])
  if (duration <= 0) duration += 24 * 60
  return duration <= 6 * 60
}

/** A common syllabus typo/OCR result gives the start and end opposite
 * meridiems (`8 AM–9:15 PM`). Offer the only narrow correction we can justify:
 * reuse the start meridiem for the end, and only when that produces an
 * ordinary class-length range. The caller must still mark the suggestion for
 * review and retain the original line as evidence. */
export function proposePlausibleMeetingTime(value?: string): string | undefined {
  if (!value || isPlausibleClassMeetingTime(value)) return undefined
  const match = value.match(/^(\d{1,2}(?::\d{2})?)\s*(AM|PM)\s*–\s*(\d{1,2}(?::\d{2})?)\s*(AM|PM)$/i)
  if (!match || match[2].toUpperCase() === match[4].toUpperCase()) return undefined
  const candidate = `${match[1]} ${match[2].toUpperCase()}–${match[3]} ${match[2].toUpperCase()}`
  return isPlausibleClassMeetingTime(candidate) ? candidate : undefined
}
