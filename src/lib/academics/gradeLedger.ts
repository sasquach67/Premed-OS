import type { ClassAssignment, Course, GradeCategory, LetterGrade, TranscriptCourseRecord } from '@/lib/types'

/**
 * Current official source snapshot.  It is deliberately data, rather than a
 * tangle of AMCAS-specific branches in a component: rules change by cycle.
 * A future cycle changes this object and its source metadata, not the math.
 */
export const AMCAS_RULE_SNAPSHOT = {
  label: '2027 AMCAS Applicant Guide',
  checkedOn: '2026-08-23',
  sourceUrl: 'https://students-residents.aamc.org/media/11616/download',
  classificationUrl: 'https://students-residents.aamc.org/applying-medical-school-amcas/amcas-course-classification-guide',
  reminder: 'Verify coursework classification against the official guide in your application year.',
  gradePoints: {
    'A+': 4, A: 4, 'A-': 3.7,
    'B+': 3.3, B: 3, 'B-': 2.7,
    'C+': 2.3, C: 2, 'C-': 1.7,
    'D+': 1.3, D: 1, 'D-': 0.7,
    F: 0,
  } as const,
  excludedGrades: ['P', 'NP', 'IP', 'W', ''] as const,
  eligibleCourseTypes: ['regular', 'transfer', 'dual-enrollment', 'repeat'] as const,
} as const

type QualityGrade = keyof typeof AMCAS_RULE_SNAPSHOT.gradePoints

export type LedgerStatus = 'complete' | 'in-progress' | 'withdrawn' | 'repeat' | 'needs-details'

export interface LedgerRow {
  id: string
  courseId: string
  institution: string
  courseNumberExact: string
  titleExact: string
  creditsExact: string
  gradeExact: string
  term: string
  year: string
  courseType: string
  classificationSource?: string
  classificationReason?: string
  bcpm: boolean | null
  status: LedgerStatus
}

export interface GpaSummary {
  value: number | null
  scienceValue: number | null
  allOtherValue: number | null
  qualityPoints: number
  scienceQualityPoints: number
  allOtherQualityPoints: number
  credits: number
  scienceCredits: number
  allOtherCredits: number
  reason?: string
  unclassifiedCount: number
}

export interface GradeLedger {
  rows: LedgerRow[]
  local: GpaSummary
  amcas: GpaSummary
  trend: Array<{ academicYear: string; value: number; partial: boolean }>
  delta: number | null
}

function isQualityGrade(value: string): value is QualityGrade {
  return Object.hasOwn(AMCAS_RULE_SNAPSHOT.gradePoints, value.toUpperCase())
}

function numberFromExact(value: string) {
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function summary(attempts: Array<{ credits: number; points: number; bcpm: boolean | null }>, emptyReason: string): GpaSummary {
  if (!attempts.length) return { value: null, scienceValue: null, allOtherValue: null, qualityPoints: 0, scienceQualityPoints: 0, allOtherQualityPoints: 0, credits: 0, scienceCredits: 0, allOtherCredits: 0, unclassifiedCount: 0, reason: emptyReason }
  const credits = attempts.reduce((total, item) => total + item.credits, 0)
  const points = attempts.reduce((total, item) => total + item.points, 0)
  const science = attempts.filter((item) => item.bcpm === true)
  const other = attempts.filter((item) => item.bcpm === false)
  const scienceCredits = science.reduce((total, item) => total + item.credits, 0)
  const otherCredits = other.reduce((total, item) => total + item.credits, 0)
  const scienceQualityPoints = science.reduce((total, item) => total + item.points, 0)
  const allOtherQualityPoints = other.reduce((total, item) => total + item.points, 0)
  const unclassifiedCount = attempts.filter((item) => item.bcpm == null).length
  return {
    value: credits ? points / credits : null,
    scienceValue: scienceCredits ? scienceQualityPoints / scienceCredits : null,
    allOtherValue: otherCredits ? allOtherQualityPoints / otherCredits : null,
    qualityPoints: points, scienceQualityPoints, allOtherQualityPoints,
    credits, scienceCredits, allOtherCredits: otherCredits, unclassifiedCount,
  }
}

function localAttempts(courses: Course[]) {
  return courses.flatMap((course) => {
    if (!course.inResidence || course.status !== 'completed' || !isQualityGrade(course.grade) || !course.credits) return []
    return [{ credits: course.credits, points: AMCAS_RULE_SNAPSHOT.gradePoints[course.grade] * course.credits, bcpm: course.bcpm }]
  })
}

function recordStatus(course: Course | undefined, record: TranscriptCourseRecord): LedgerStatus {
  if (/withdraw/i.test(record.courseType) || /^w$/i.test(record.gradeExact.trim())) return 'withdrawn'
  if (/repeat/i.test(record.courseType)) return 'repeat'
  if (course?.status === 'in-progress') return 'in-progress'
  if (!record.institution || !record.courseNumberExact || !record.titleExact) return 'needs-details'
  return 'complete'
}

/**
 * Produces an explainable, student-entered preview. A transcript line is a
 * prerequisite for AMCAS arithmetic; operational Course fields alone are not.
 */
export function buildGradeLedger(courses: Course[], records: TranscriptCourseRecord[]): GradeLedger {
  const courseById = new Map(courses.map((course) => [course.id, course]))
  const rows = [...records]
    .sort((a, b) => a.order - b.order)
    .map((record) => {
      const course = courseById.get(record.courseId)
      const classified = Boolean(record.classificationSource?.trim() || record.classificationReason?.trim())
      return {
        id: record.id, courseId: record.courseId, institution: record.institution,
        courseNumberExact: record.courseNumberExact, titleExact: record.titleExact,
        creditsExact: record.creditsExact, gradeExact: record.gradeExact, term: record.term,
        year: record.year, courseType: record.courseType,
        classificationSource: record.classificationSource, classificationReason: record.classificationReason,
        bcpm: classified ? (course?.bcpm ?? null) : null,
        status: recordStatus(course, record),
      } satisfies LedgerRow
    })

  const amcasAttempts = rows.flatMap((row) => {
    const type = row.courseType.trim().toLowerCase()
    const grade = row.gradeExact.trim().toUpperCase()
    const credits = numberFromExact(row.creditsExact)
    // The calculator is allowed to stay dormant; it is not allowed to fill in
    // a transcript line from the operational class record.
    if (!row.institution.trim() || !row.courseNumberExact.trim() || !row.titleExact.trim() || !row.term.trim() || !row.year.trim()) return []
    if (!AMCAS_RULE_SNAPSHOT.eligibleCourseTypes.includes(type as typeof AMCAS_RULE_SNAPSHOT.eligibleCourseTypes[number])) return []
    if (!isQualityGrade(grade) || !credits) return []
    return [{ credits, points: AMCAS_RULE_SNAPSHOT.gradePoints[grade] * credits, bcpm: row.bcpm, year: row.year }]
  })
  const local = summary(localAttempts(courses), 'Record a completed in-residence course with a letter grade to calculate this local GPA.')
  const amcas = summary(amcasAttempts, 'Add transcript-faithful, graded coursework to calculate an AMCAS preview.')
  const byYear = new Map<string, typeof amcasAttempts>()
  for (const attempt of amcasAttempts) {
    const year = attempt.year.trim() || 'Year not recorded'
    byYear.set(year, [...(byYear.get(year) ?? []), attempt])
  }
  const trend = [...byYear.entries()].map(([academicYear, attempts]) => {
    const totalCredits = attempts.reduce((total, attempt) => total + attempt.credits, 0)
    const totalPoints = attempts.reduce((total, attempt) => total + attempt.points, 0)
    return { academicYear, value: totalPoints / totalCredits, partial: attempts.some((attempt) => attempt.year.trim() === '') }
  }).filter((item) => Number.isFinite(item.value))
  return { rows, local, amcas, trend, delta: local.value != null && amcas.value != null ? local.value - amcas.value : null }
}

/** AMCAS displays truncated values; it never rounds a value upward. */
export function formatTruncatedGpa(value: number | null) {
  return value == null ? '—' : (Math.trunc((value + Number.EPSILON) * 100) / 100).toFixed(2)
}

export function projectGpa(summaryValue: GpaSummary, scenarios: Array<{ credits: number; grade: LetterGrade; bcpm: boolean }>) {
  const attempts = scenarios.flatMap((scenario) => {
    if (!isQualityGrade(scenario.grade) || !scenario.credits) return []
    return [{ credits: scenario.credits, points: AMCAS_RULE_SNAPSHOT.gradePoints[scenario.grade] * scenario.credits, bcpm: scenario.bcpm }]
  })
  const unclassifiedCredits = summaryValue.credits - summaryValue.scienceCredits - summaryValue.allOtherCredits
  const unclassifiedPoints = summaryValue.qualityPoints - summaryValue.scienceQualityPoints - summaryValue.allOtherQualityPoints
  const base = [
    { credits: summaryValue.scienceCredits, points: summaryValue.scienceQualityPoints, bcpm: true },
    { credits: summaryValue.allOtherCredits, points: summaryValue.allOtherQualityPoints, bcpm: false },
    { credits: unclassifiedCredits, points: unclassifiedPoints, bcpm: null },
  ].filter((attempt) => attempt.credits > 0)
  const projected = summary([...base, ...attempts], 'Add a hypothetical letter grade to see a scenario.')
  return projected
}

export interface CourseScenarioResult {
  projectedPercent: number | null
  requiredPercent: number | null
  highestLeverageCategory?: string
  irrelevantCategories: string[]
  reason?: string
}

/** A category-only calculator. Free-text policy notes are intentionally ignored. */
export function calculateCourseScenario(input: {
  assignments: ClassAssignment[]
  categories: GradeCategory[]
  selectedCategoryId?: string
  assumedPercent: number
  targetPercent?: number
}): CourseScenarioResult {
  const irrelevantCategories = input.categories.filter((category) => category.weight <= 0).map((category) => category.name)
  const categories = input.categories.filter((category) => category.weight > 0)
  if (!categories.length) return { projectedPercent: null, requiredPercent: null, irrelevantCategories, reason: 'Record syllabus categories and weights before testing a grade scenario.' }
  const totalWeight = categories.reduce((total, category) => total + category.weight, 0)
  if (Math.abs(totalWeight - 100) > 0.01) return {
    projectedPercent: null,
    requiredPercent: null,
    irrelevantCategories,
    reason: `Recorded category weights total ${totalWeight}%, not 100%. Complete the grade structure before testing a course result.`,
  }
  const stats = categories.map((category) => {
    const graded = input.assignments.filter((assignment) => assignment.category === category.name && assignment.pointsPossible && assignment.pointsEarned != null)
    const earned = graded.reduce((total, item) => total + (item.pointsEarned ?? 0), 0)
    const possible = graded.reduce((total, item) => total + (item.pointsPossible ?? 0), 0)
    return { category, average: possible ? (earned / possible) * 100 : null }
  })
  const selected = stats.find((item) => item.category.id === input.selectedCategoryId) ?? stats[0]
  const missingOtherAverages = stats.some((item) => item.category.id !== selected?.category.id && item.average == null)
  if (missingOtherAverages) return {
    projectedPercent: null,
    requiredPercent: null,
    highestLeverageCategory: [...stats].sort((a, b) => b.category.weight - a.category.weight)[0]?.category.name,
    irrelevantCategories,
    reason: 'Record results for the other weighted categories before projecting a whole-course result.',
  }
  const base = stats.reduce((total, item) => total + (item.average ?? 0) * item.category.weight / 100, 0)
  const projectedPercent = selected
    ? base - (selected.average ?? 0) * selected.category.weight / 100 + input.assumedPercent * selected.category.weight / 100
    : null
  const targetPercent = input.targetPercent
  const other = stats.reduce((total, item) => item.category.id === selected?.category.id ? total : total + (item.average ?? 0) * item.category.weight / 100, 0)
  const requiredPercent = selected && targetPercent != null && selected.category.weight > 0
    ? (targetPercent - other) / (selected.category.weight / 100)
    : null
  const highestLeverageCategory = [...stats].sort((a, b) => b.category.weight - a.category.weight)[0]?.category.name
  return {
    projectedPercent,
    requiredPercent,
    highestLeverageCategory,
    irrelevantCategories,
  }
}
