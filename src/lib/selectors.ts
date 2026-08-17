/* Pure derived-data helpers: the AMCAS GPA engine, hour totals, alerts. */
import type {
  Course, ExperienceEntry, ExperienceCategory, TaskItem, LetterGrade, McatState,
} from '@/lib/types'
import { daysUntil } from '@/lib/date'

/** AMCAS 4.0 quality-point values (no grade replacement; repeats averaged). */
export const GRADE_POINTS: Record<string, number> = {
  'A+': 4, A: 4, 'A-': 3.7,
  'B+': 3.3, B: 3, 'B-': 2.7,
  'C+': 2.3, C: 2, 'C-': 1.7,
  'D+': 1.3, D: 1, 'D-': 0.7,
  F: 0,
}
/** grades that don't carry quality points */
const NON_GPA: LetterGrade[] = ['', 'P', 'NP', 'IP']

export interface GpaStats {
  cum: number; science: number; ao: number
  credits: number; scienceCredits: number; aoCredits: number
  qualityPoints: number
}

/** AMCAS-style cumulative / BCPM(science) / AO(all-other) GPA.
 *  Only graded, in-residence courses count; every attempt is included. */
export function gpaStats(courses: Course[]): GpaStats {
  let qp = 0, cr = 0, sQp = 0, sCr = 0, aQp = 0, aCr = 0
  for (const c of courses) {
    if (!c.inResidence) continue
    if (NON_GPA.includes(c.grade)) continue
    const pts = GRADE_POINTS[c.grade]
    if (pts == null) continue
    const credits = c.credits || 0
    const points = pts * credits
    qp += points; cr += credits
    if (c.bcpm) { sQp += points; sCr += credits } else { aQp += points; aCr += credits }
  }
  return {
    cum: cr ? qp / cr : 0,
    science: sCr ? sQp / sCr : 0,
    ao: aCr ? aQp / aCr : 0,
    credits: cr, scienceCredits: sCr, aoCredits: aCr, qualityPoints: qp,
  }
}

export function fmtGpa(n: number): string {
  return n ? n.toFixed(2) : '—'
}

export type HourTotals = Record<ExperienceCategory, number>

export function hourTotals(experiences: ExperienceEntry[]): HourTotals {
  const totals: HourTotals = { clinical: 0, volunteering: 0, shadowing: 0, research: 0, leadership: 0 }
  for (const e of experiences) totals[e.category] += e.hours || 0
  return totals
}

export function bestMcat(mcat: McatState): number | null {
  const official = mcat.attempts.filter((a) => a.kind === 'official' && a.total)
  const pool = official.length ? official : mcat.attempts.filter((a) => a.total)
  if (!pool.length) return null
  return Math.max(...pool.map((a) => a.total || 0))
}

export interface Alert {
  id: string
  label: string
  sub?: string
  date?: string
  daysLeft: number
  severity: 'urgent' | 'soon' | 'info'
  kind: 'exam' | 'task' | 'meeting' | 'milestone'
}

/** Home + topbar alerts: tasks due soon, exams ~1 week out, next milestone. */
export function upcomingAlerts(tasks: TaskItem[], opts?: { horizon?: number }): Alert[] {
  const horizon = opts?.horizon ?? 10
  const out: Alert[] = []
  for (const t of tasks) {
    if (t.archived || t.progress === 'Finished') continue
    const d = daysUntil(t.deadline)
    if (d == null) continue
    const isExam = t.type === 'Exam'
    const isMeeting = t.type === 'Meeting' || t.type === 'Advising'
    const within = isExam ? d <= 8 : d <= horizon
    if (d < -1 || !within) continue
    out.push({
      id: t.id,
      label: t.title,
      sub: t.course || t.type,
      date: t.deadline,
      daysLeft: d,
      severity: d <= 2 ? 'urgent' : d <= 5 ? 'soon' : 'info',
      kind: isExam ? 'exam' : isMeeting ? 'meeting' : 'task',
    })
  }
  return out.sort((a, b) => a.daysLeft - b.daysLeft)
}

export function percent(value: number, goal: number): number {
  if (!goal) return 0
  return Math.max(0, Math.min(100, (value / goal) * 100))
}
