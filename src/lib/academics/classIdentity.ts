import { extractClassMeetingTime, normalizeMeetingDays } from './meetingSchedule'

function compact(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/** Canonical student-facing course code without changing unusual valid codes. */
export function normalizeCourseCode(value: string): string {
  const trimmed = compact(value).toUpperCase()
  const standard = trimmed.match(/^([A-Z]{2,8})[\s-]*(\d{2,4}[A-Z]?)$/)
  return standard ? `${standard[1]} ${standard[2]}` : trimmed
}

/** Stable student-facing titles for courses whose syllabus headers commonly
 * use department shorthand. Unknown courses keep their sourced title rather
 * than borrowing a similarly named catalog course. */
const PREFERRED_COURSE_TITLES: Readonly<Record<string, string>> = {
  'PSYC 101': 'Introduction to Psychology',
  'ENGL 105': 'English Composition & Rhetoric',
}

const LOWERCASE_TITLE_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to'])
const COURSE_TITLE_ACRONYMS = new Set(['AI', 'DNA', 'EMS', 'EMT', 'HIV', 'MCAT', 'NMR', 'RNA', 'UNC'])

/** Registrar headings are often exported in all caps. Convert only those
 * headings, leaving already authored capitalization untouched. */
function normalizeRegistrarTitleCase(value: string): string {
  if (!/[A-Z]/.test(value) || /[a-z]/.test(value)) return value
  const words = value.toLocaleLowerCase().split(' ')
  return words.map((word, index) => {
    const bare = word.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
    if (!bare) return word
    const uppercase = bare.toUpperCase()
    if (COURSE_TITLE_ACRONYMS.has(uppercase) || /^(?:I|II|III|IV|V|VI)$/.test(uppercase)) {
      return word.replace(bare, uppercase)
    }
    if (index > 0 && index < words.length - 1 && LOWERCASE_TITLE_WORDS.has(bare)) return word
    return word.replace(/[a-z]/, (letter) => letter.toUpperCase())
  }).join(' ')
}

export function normalizeCourseTitle(value: string, courseCode = ''): string {
  const preferred = PREFERRED_COURSE_TITLES[normalizeCourseCode(courseCode)]
  return preferred ?? normalizeRegistrarTitleCase(compact(value))
}

export function normalizeClassTerm(value: string): string {
  const trimmed = compact(value)
  const standard = trimmed.match(/^(fall|spring|summer|winter)\s+(20\d{2})$/i)
  return standard ? `${standard[1][0].toUpperCase()}${standard[1].slice(1).toLowerCase()} ${standard[2]}` : trimmed
}

/** Keep class identity fields person-shaped. Preserve only an explicit sourced
 * credential suffix; a generic `Dr.` does not tell us whether the credential
 * is a PhD, MD, EdD, or something else. Contact details and roles live elsewhere. */
export function normalizeInstructorName(value: string): string {
  const normalized = compact(value)
    .replace(/^(?:instructor|professor)\s*:?\s*/i, '')
    .replace(/^Prof\.?\s+(?=\S)/i, '')
    .replace(/\s*(?:[<(]\s*)?[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}(?:\s*[>)]\s*)?.*$/i, '')
    .replace(/(?:\s*\([^)]*\))+\s*$/g, '')
    .replace(/\s*,\s*/g, ', ')
    .replace(/,?\s+Ph\.?\s*D\.?$/i, ', PhD')
    .replace(/,?\s+M\.?\s*D\.?$/i, ', MD')
    .trim()
  return normalized.replace(/^Dr\.?\s+(?=\S)/i, '')
}

/** Use the same clock punctuation for imported and manually entered classes.
 * Unknown schedules remain visible rather than being discarded. */
export function normalizeClassMeetingTime(value: string): string {
  const trimmed = compact(value)
  if (!trimmed) return ''
  const extracted = extractClassMeetingTime(trimmed)
  if (!extracted) return trimmed
  return extracted
    .replace(/\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/gi, (_match, hour: string, minute: string | undefined, meridiem: string) => `${hour}:${minute ?? '00'} ${meridiem.toUpperCase()}`)
    .replace(/\s*–\s*/g, '–')
}

export function normalizeClassLocation(value: string): string {
  return compact(value)
    .replace(/\bRm\.?\s+/gi, 'Room ')
    .replace(/\b(Center|Hall|Building)\s*,?\s+Room\b/gi, '$1, Room')
    .replace(/\s*,\s*/g, ', ')
}

export function normalizeClassWorkspaceIdentity<T extends {
  instructor?: string
  meetingDays?: string
  meetingTime?: string
  location?: string
}>(workspace: T): T {
  return {
    ...workspace,
    instructor: workspace.instructor == null ? workspace.instructor : normalizeInstructorName(workspace.instructor),
    meetingDays: workspace.meetingDays == null ? workspace.meetingDays : normalizeMeetingDays(workspace.meetingDays),
    meetingTime: workspace.meetingTime == null ? workspace.meetingTime : normalizeClassMeetingTime(workspace.meetingTime),
    location: workspace.location == null ? workspace.location : normalizeClassLocation(workspace.location),
  }
}
