import type { AppData } from '@/lib/types'
import { migrateClassIdentityV43 } from './classIdentityV43'
import { migrateInstructorIdentityV44 } from './instructorIdentityV44'
import { migrateCourseTitleV45 } from './courseTitleV45'

/** Re-applies the complete class identity contract for workspaces already at
 * v45. This upgrades existing classes in place after the review-form boundary
 * and credential policy were corrected. */
export function migrateClassIdentityV46(data: AppData): AppData {
  return migrateCourseTitleV45(migrateInstructorIdentityV44(migrateClassIdentityV43(data)))
}
