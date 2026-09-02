import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadWith(env: Record<string, string | undefined>) {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value ?? '')
  return import('./calendarAccess')
}

describe('Calendar access before OAuth verification', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

  it('offers Calendar only to configured OAuth testers', async () => {
    const { calendarAvailability } = await loadWith({
      VITE_CALENDAR_TESTERS: 'tester@unc.edu, second@unc.edu',
      VITE_CALENDAR_OAUTH_VERIFIED: 'false',
    })
    expect(calendarAvailability('tester@unc.edu', true)).toEqual({ available: true })
    expect(calendarAvailability('SECOND@UNC.EDU', true)).toEqual({ available: true })
    expect(calendarAvailability('someone-else@unc.edu', true)).toEqual({
      available: false, reason: 'awaiting-verification',
    })
  })

  it('fails closed for signed-out or unconfigured access', async () => {
    const { calendarAvailability } = await loadWith({
      VITE_CALENDAR_TESTERS: 'tester@unc.edu',
      VITE_CALENDAR_OAUTH_VERIFIED: 'false',
    })
    expect(calendarAvailability(undefined, true)).toEqual({ available: false, reason: 'awaiting-verification' })
    expect(calendarAvailability('tester@unc.edu', false)).toEqual({ available: false, reason: 'unconfigured' })
  })

  it('opens Calendar to everyone after verification is recorded', async () => {
    const { calendarAvailability } = await loadWith({
      VITE_CALENDAR_TESTERS: '',
      VITE_CALENDAR_OAUTH_VERIFIED: 'true',
    })
    expect(calendarAvailability('anyone@example.com', true)).toEqual({ available: true })
  })

  it('fails closed when no allowlist or approval is configured', async () => {
    const { calendarAvailability, calendarTesterCount } = await loadWith({
      VITE_CALENDAR_TESTERS: undefined,
      VITE_CALENDAR_OAUTH_VERIFIED: undefined,
    })
    expect(calendarTesterCount()).toBe(0)
    expect(calendarAvailability('anyone@example.com', true)).toEqual({
      available: false, reason: 'awaiting-verification',
    })
  })
})
