import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface TokenCallbackResponse {
  access_token?: string
  expires_in?: number
}

describe('Google Calendar browser-session connection', () => {
  beforeEach(() => {
    vi.resetModules()
    window.sessionStorage.clear()
  })

  afterEach(() => {
    delete (window as unknown as { google?: unknown }).google
    window.sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('restores an unexpired connection after a page reload', async () => {
    let callback: ((response: TokenCallbackResponse) => void) | undefined
    const revoke = vi.fn()
    ;(window as unknown as { google: unknown }).google = {
      accounts: {
        oauth2: {
          initTokenClient: (configuration: { callback: (response: TokenCallbackResponse) => void }) => {
            callback = configuration.callback
            return {
              requestAccessToken: () => callback?.({ access_token: 'calendar-token', expires_in: 3600 }),
            }
          },
          revoke,
        },
      },
    }

    const firstPage = await import('./googleCalendar')
    await firstPage.connectCalendar('client-id')
    expect(firstPage.isCalendarConnected()).toBe(true)

    vi.resetModules()
    const reloadedPage = await import('./googleCalendar')
    expect(reloadedPage.isCalendarConnected()).toBe(true)

    reloadedPage.disconnectCalendar()
    expect(reloadedPage.isCalendarConnected()).toBe(false)
    expect(revoke).toHaveBeenCalledWith('calendar-token')
  })

  it('discards an expired token instead of prompting automatically', async () => {
    window.sessionStorage.setItem('premedos.google-calendar-token.v1', JSON.stringify({
      accessToken: 'expired-token',
      expiresAt: Date.now() - 1,
    }))

    const calendar = await import('./googleCalendar')
    expect(calendar.isCalendarConnected()).toBe(false)
    expect(window.sessionStorage.getItem('premedos.google-calendar-token.v1')).toBeNull()
  })
})
