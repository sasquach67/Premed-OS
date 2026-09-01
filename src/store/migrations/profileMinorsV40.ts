import type { AppData } from '@/lib/types'

/** v40 adds a durable, editable list of academic minors to the profile. */
export function migrateProfileMinorsV40(data: AppData): AppData {
  if (Array.isArray(data.profile?.minors)) return data
  return {
    ...data,
    profile: {
      ...data.profile,
      minors: [],
    },
  }
}
