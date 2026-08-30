import type { AppData } from '@/lib/types'

/** Store v36: add only the student-owned Planning provenance container.
 *
 * The migration deliberately does not validate or normalize an existing
 * object. Hydration must never delete a value written by a newer client or a
 * legacy/manual backup; validation belongs at the action boundary instead.
 */
export function migratePlanningLibraryV36(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data
  const context = (center as { planningProgramContext?: unknown }).planningProgramContext
  if (context && typeof context === 'object' && !Array.isArray(context)) return data
  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: { ...center, planningProgramContext: {} },
    },
  }
}
