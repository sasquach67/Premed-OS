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

export function normalizeCourseTitle(value: string, courseCode = ''): string {
  const preferred = PREFERRED_COURSE_TITLES[normalizeCourseCode(courseCode)]
  return preferred ?? compact(value)
}

export function normalizeClassTerm(value: string): string {
  const trimmed = compact(value)
  const standard = trimmed.match(/^(fall|spring|summer|winter)\s+(20\d{2})$/i)
  return standard ? `${standard[1][0].toUpperCase()}${standard[1].slice(1).toLowerCase()} ${standard[2]}` : trimmed
}

/** Keep class identity fields person-shaped: name first, then any explicitly
 * sourced credential. Contact details and role labels belong elsewhere. This
 * never invents a credential or expands initials. */
export function normalizeInstructorName(value: string): string {
  return compact(value)
    .replace(/^(?:instructor|professor)\s*:?\s*/i, '')
    .replace(/^Prof\.?\s+(?=\S)/i, '')
    .replace(/^Dr\.?\s+(?=\S)/i, '')
    .replace(/\s*(?:[<(]\s*)?[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}(?:\s*[>)]\s*)?.*$/i, '')
    .replace(/(?:\s*\([^)]*\))+\s*$/g, '')
    .replace(/\s*,\s*/g, ', ')
    .replace(/,?\s+Ph\.?\s*D\.?$/i, ', PhD')
    .replace(/,?\s+M\.?\s*D\.?$/i, ', MD')
    .trim()
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
