/**
 * MCAT relearning order (§4.1 #64) — "coursework decay measured against the
 * MCAT", which the spec calls the single most defensible feature in the app.
 *
 * Drawing:   mockup-lab/01-academics/academics-planning-decisions.html (decay)
 * Decisions: academics-planning-decisions.md — "a reading path rather than a
 *            ranking table … no gauge, progress bar, readiness score, or
 *            retention percentage."
 * Data:      src/data/mcatContent.json, derived from the checked-in
 *            premed-hq-documentation/data/mcat-content.json (AAMC-sourced,
 *            retrieved 2026-07-22).
 *
 * ⚠️ §4.1 asks for a "ranked list" and U-9 forbids a score. Both hold because
 * the ordering is ORDINAL and the weight is never returned: `relearningOrder`
 * emits `{ course, position, evidence }` and no numeric field at all, so no
 * component can render one even by accident. The sort key exists only inside
 * this function.
 *
 * ⚠️ A course with no `prereqMap` match is ABSENT, never guessed into a
 * section. Unmatched is the common case — most of a transcript is not MCAT
 * content — and inventing a mapping would make the whole order untrustworthy.
 */
import content from '@/data/mcatContent.json'
import type { Course } from '@/lib/types'

interface McatSection { id: string; name: string; questions: number }
interface PrereqRow { section: string; uncCourses: string[]; confidence: string; source: string }

const SECTIONS = content.sections as McatSection[]
const PREREQ = content.prereqMap as PrereqRow[]
export const CONTENT_RETRIEVED_AT = content.meta.retrievedAt as string

const TOTAL_QUESTIONS = SECTIONS.reduce((sum, section) => sum + section.questions, 0)

/**
 * "CHEM 261/262" → ["CHEM 261", "CHEM 262"].
 *
 * "PHYS 114/115 or 118/119" → four codes: the subject carries across an `or`,
 * because the catalog writes the second alternative without repeating it.
 * Dropping that clause silently loses PHYS 118/119 — the exact courses Andy is
 * taking.
 */
function expandCourseCodes(entry: string): string[] {
  const out: string[] = []
  let subject: string | undefined
  for (const clause of entry.split(/\s+or\s+/i)) {
    const trimmed = clause.trim()
    const match = /^([A-Z]{2,4})\s+(.+)$/.exec(trimmed)
    let numbers: string
    if (match) {
      subject = match[1]
      numbers = match[2]
    } else if (subject) {
      numbers = trimmed
    } else continue
    for (const number of numbers.split('/')) out.push(`${subject} ${number.trim()}`)
  }
  return out
}

/** The MCAT sections a course feeds. Empty for anything not named in the map. */
export function courseSections(course: Course): McatSection[] {
  const code = course.code.trim().toUpperCase()
  const hits: McatSection[] = []
  for (const row of PREREQ) {
    const codes = row.uncCourses.flatMap(expandCourseCodes).map((item) => item.toUpperCase())
    if (!codes.includes(code)) continue
    const section = SECTIONS.find((item) => item.id === row.section)
    if (section) hits.push(section)
  }
  return hits
}

/** A section's share of the scored exam, used only as an internal sort weight. */
function sectionWeight(sections: McatSection[]): number {
  return sections.reduce((sum, section) => sum + section.questions, 0) / TOTAL_QUESTIONS
}

const TERM_MONTH: Record<string, number> = { spring: 1, summer: 5, fall: 8, winter: 11 }

/** "Fall 2026" → a month index. Unparseable terms are excluded, never guessed. */
export function termToMonths(term: string): number | undefined {
  const match = /^(spring|summer|fall|winter)\s+(\d{4})$/i.exec(term.trim())
  if (!match) return undefined
  const [, season, year] = match
  return Number(year) * 12 + TERM_MONTH[season.toLowerCase()]
}

export interface TimingTarget {
  months: number
  /** True when no MCAT date is set and a planning window stood in for it. */
  isPlanningWindow: boolean
  label: string
}

/**
 * The point courses are measured against. With no test date the spec requires a
 * **named planning window** rather than a silent substitution.
 */
export function timingTarget(mcatDate: string | undefined, now = Date.now()): TimingTarget {
  if (mcatDate) {
    const date = new Date(mcatDate)
    if (!Number.isNaN(date.getTime())) {
      return {
        months: date.getFullYear() * 12 + date.getMonth(),
        isPlanningWindow: false,
        label: 'your MCAT date',
      }
    }
  }
  // Roughly two years out — long enough to be a planning horizon, and labelled.
  const today = new Date(now)
  return {
    months: today.getFullYear() * 12 + today.getMonth() + 24,
    isPlanningWindow: true,
    label: 'a planning window, because no MCAT date is set',
  }
}

export interface RelearningEntry {
  course: Course
  /** 1-based ordinal. There is deliberately no score on this shape. */
  position: number
  /** The named inputs behind the position, in plain language. */
  evidence: string
}

const SHARE_WORD = (share: number) => (share >= 0.28 ? 'substantial' : share >= 0.15 ? 'moderate' : 'limited')

/**
 * The AAMC's own shorthand. Derived from the full section name this would read
 * "Psychological, content is moderate" — the first word of a comma-separated
 * title is not a name.
 */
const SECTION_SHORT: Record<string, string> = {
  'chem-phys': 'Chem/Phys',
  cars: 'CARS',
  'bio-biochem': 'Bio/Biochem',
  'psych-soc': 'Psych/Soc',
}
const shortName = (section: McatSection) => SECTION_SHORT[section.id] ?? section.name

export function relearningOrder(
  courses: Course[],
  { mcatDate, now = Date.now() }: { mcatDate?: string; now?: number } = {},
): { entries: RelearningEntry[]; target: TimingTarget } {
  const target = timingTarget(mcatDate, now)

  const scored = courses
    .filter((course) => course.status === 'completed' || course.status === 'planned' || course.status === 'in-progress')
    .map((course) => {
      const sections = courseSections(course)
      const at = termToMonths(course.term)
      if (!sections.length || at == null) return undefined
      const gap = target.months - at
      if (gap <= 0) return undefined
      const share = sectionWeight(sections)
      return { course, gap, share, sections, weight: gap * share }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry != null)
    .sort((a, b) => b.weight - a.weight || a.course.code.localeCompare(b.course.code))

  const entries = scored.map((entry, index): RelearningEntry => ({
    course: entry.course,
    position: index + 1,
    evidence: `${entry.course.status === 'completed' ? 'Completed' : 'Placed'} ${entry.gap} months before ${target.label} · ${entry.sections.map(shortName).join(' and ')} content is ${SHARE_WORD(entry.share)}.`,
  }))

  return { entries, target }
}

/** §4.1: the surface must say what it does not know. */
export function unknownsNote(entries: RelearningEntry[]): string {
  if (!entries.length) {
    return 'No completed course maps to a named MCAT content area yet, so there is nothing to order.'
  }
  return 'These courses have no tracked topic history, so no review interval appears. Order uses course timing and content share only — it is not a retention prediction.'
}
