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
const COMPACT_DAY_PATTERN = /\b(?:MWF|M\s*[\/]\s*W\s*[\/]\s*F|MW|M\s*[\/]\s*W|WF|W\s*[\/]\s*F|TR|TTH|TU\s*(?:[\/]?|&|and)\s*TH|T\s*(?:[\/&]|and)\s*TH|TU|TH)\b/i
const SINGLE_DAY_WITH_TIME_PATTERN = /\b(?:M|T|W|R|F)\b(?=\s+\d{1,2}(?::\d{2})?)/i
const MEETING_TIME_PATTERN = /\b(?:\d{1,2}(?::\d{2})?(?:\s*(?:AM|PM))?\s*(?:[-–]|\bto\b)\s*\d{1,2}(?::\d{2})?(?:\s*(?:AM|PM))?|\d{1,2}(?::\d{2})?\s*(?:AM|PM))\b/i
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
  return matched
    .replace(/\s+/g, ' ')
    .replace(/(\d)\s*(am|pm)\b/gi, '$1 $2')
    .replace(/\s*(?:[-–]|\bto\b)\s*/gi, '–')
    .replace(/\b(am|pm)\b/gi, (meridiem) => meridiem.toUpperCase())
}
