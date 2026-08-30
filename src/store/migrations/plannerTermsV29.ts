import type { AppData } from '@/lib/types'
import { isPriorCreditCourse, PRIOR_CREDIT } from '@/lib/academics/planner'

const keyFor = (label: string) => label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unscheduled'

/**
 * v29 adds stable, local Planner slots. Existing course labels remain the
 * source record; this migration only gives each exact label a durable handle.
 */
export function migratePlannerTermsV29(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data
  const storedTerms = Array.isArray(center.plannerTerms) ? center.plannerTerms : []
  const existingTerms = storedTerms.filter((term) => term.label.trim().toLocaleLowerCase() !== PRIOR_CREDIT.toLocaleLowerCase())
  const needsSlots = data.courses.some((course) => !isPriorCreditCourse(course) && Boolean(course.term?.trim()) && !course.plannerTermId)
  const hasPriorCreditSlot = existingTerms.length !== storedTerms.length
  const hasPriorCreditLink = data.courses.some((course) => isPriorCreditCourse(course) && Boolean(course.plannerTermId))
  if (Array.isArray(center.plannerTerms) && !needsSlots && !hasPriorCreditSlot && !hasPriorCreditLink) return data

  const byLabel = new Map(existingTerms.map((term) => [term.label.trim(), term] as const))
  for (const course of data.courses) {
    if (isPriorCreditCourse(course)) continue
    const label = course.term?.trim()
    if (!label) continue
    if (!byLabel.has(label)) {
      const index = byLabel.size
      byLabel.set(label, {
        id: `planner-term-${keyFor(label)}`,
        label,
        kind: 'standard',
        origin: 'legacy-derived',
        createdAt: 0,
        updatedAt: 0,
        order: index,
      })
    }
  }

  const plannerTerms = [...byLabel.values()]
  const idForLabel = new Map(plannerTerms.map((term) => [term.label, term.id]))
  return {
    ...data,
    courses: data.courses.map((course) => {
      if (isPriorCreditCourse(course) && course.plannerTermId) {
        const withoutPlannerTerm = { ...course }
        delete withoutPlannerTerm.plannerTermId
        return withoutPlannerTerm
      }
      const id = idForLabel.get(course.term?.trim())
      return id && !course.plannerTermId ? { ...course, plannerTermId: id } : course
    }),
    academics: {
      ...data.academics,
      classCenter: { ...center, plannerTerms },
    },
  }
}
