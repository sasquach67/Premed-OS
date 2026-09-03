import type { AppData } from '@/lib/types'
import { migrateClassIdentityV46 } from './classIdentityV46'

/** Re-runs the corrected identity contract for sessions that already hydrated
 * at v46 before the current-class migration was available. */
export function migrateCurrentClassIdentityV47(data: AppData): AppData {
  return migrateClassIdentityV46(data)
}
