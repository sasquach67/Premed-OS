import type { AppData, ReviewSessionPreferences } from '@/lib/types'

export const DEFAULT_REVIEW_SESSION_PREFERENCES: ReviewSessionPreferences = {
  defaultInput: 'microphone',
  interleave: true,
  weakFirst: true,
  workMinutes: 25,
  breakMinutes: 5,
  enforceBreaks: false,
  sound: true,
}

/** v32 adds only honest Review Session defaults and timer-only Focus history.
 * It never backfills sessions or guesses any prior study time. */
export function migrateReviewSessionV32(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data
  const preferences = center.reviewSessionPreferences
  const hasPreferences = preferences
    && (preferences.defaultInput === 'microphone' || preferences.defaultInput === 'keyboard')
    && typeof preferences.interleave === 'boolean'
    && typeof preferences.weakFirst === 'boolean'
    && Number.isInteger(preferences.workMinutes)
    && Number.isInteger(preferences.breakMinutes)
    && typeof preferences.enforceBreaks === 'boolean'
    && typeof preferences.sound === 'boolean'
  if (hasPreferences && Array.isArray(center.focusSessions)) return data

  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: {
        ...center,
        reviewSessionPreferences: hasPreferences ? preferences : { ...DEFAULT_REVIEW_SESSION_PREFERENCES },
        focusSessions: Array.isArray(center.focusSessions) ? center.focusSessions : [],
      },
    },
  }
}
