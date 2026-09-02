/**
 * Who may connect Google Calendar before OAuth verification completes.
 *
 * Google limits an unverified sensitive scope to accounts listed as OAuth test
 * users. Keeping the same allowlist in the product prevents a student from
 * being sent into a consent flow that Google will reject.
 */

const TESTER_ALLOWLIST = (import.meta.env.VITE_CALENDAR_TESTERS as string | undefined ?? '')
  .split(/[,\s]+/)
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean)

/** Set to true only after Google approves the exact Calendar scope in use. */
export const CALENDAR_OAUTH_VERIFIED = import.meta.env.VITE_CALENDAR_OAUTH_VERIFIED === 'true'

export type CalendarAvailability =
  | { available: true }
  | { available: false; reason: 'unconfigured' | 'awaiting-verification' }

export function calendarAvailability(email: string | undefined, configured: boolean): CalendarAvailability {
  if (!configured) return { available: false, reason: 'unconfigured' }
  if (CALENDAR_OAUTH_VERIFIED) return { available: true }
  const normalized = email?.trim().toLowerCase()
  if (!normalized || !TESTER_ALLOWLIST.includes(normalized)) {
    return { available: false, reason: 'awaiting-verification' }
  }
  return { available: true }
}

export function calendarUnavailableMessage(reason: 'unconfigured' | 'awaiting-verification'): string {
  return reason === 'unconfigured'
    ? 'Calendar needs a Google client ID before it can connect.'
    : 'Calendar is limited to approved testers while Google reviews our access request. Everything else works normally.'
}

export function calendarTesterCount(): number {
  return TESTER_ALLOWLIST.length
}
