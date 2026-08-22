import type { AppData } from '@/lib/types'

/**
 * v30 adds only the student's local acknowledgements for catalog warnings.
 * Existing courses intentionally remain untouched: an older Course did not
 * contain transcript-exact data, so fabricating nested transcript fields would
 * turn planner display values into claims about a source document.
 */
export function migrateRequirementsAuditV30(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center || Array.isArray(center.acknowledgedCatalogWarnings)) return data

  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: {
        ...center,
        acknowledgedCatalogWarnings: [],
      },
    },
  }
}
