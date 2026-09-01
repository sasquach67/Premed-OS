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
    let requestedScope = ''
    let includedPriorScopes = true
    const revoke = vi.fn()
    ;(window as unknown as { google: unknown }).google = {
      accounts: {
        oauth2: {
          initTokenClient: (configuration: { callback: (response: TokenCallbackResponse) => void; scope: string; include_granted_scopes?: boolean }) => {
            callback = configuration.callback
            requestedScope = configuration.scope
            includedPriorScopes = configuration.include_granted_scopes ?? true
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
    expect(requestedScope).toBe('https://www.googleapis.com/auth/calendar.events.owned.readonly')
    expect(includedPriorScopes).toBe(false)
    expect(firstPage.isCalendarConnected()).toBe(true)

    vi.resetModules()
    const reloadedPage = await import('./googleCalendar')
    expect(reloadedPage.isCalendarConnected()).toBe(true)

    reloadedPage.disconnectCalendar()
    expect(reloadedPage.isCalendarConnected()).toBe(false)
    expect(revoke).toHaveBeenCalledWith('calendar-token')
  })

  it('discards an expired token instead of prompting automatically', async () => {
    window.sessionStorage.setItem('premedos.google-calendar-token.v2', JSON.stringify({
      accessToken: 'expired-token',
      expiresAt: Date.now() - 1,
    }))

    const calendar = await import('./googleCalendar')
    expect(calendar.isCalendarConnected()).toBe(false)
    expect(window.sessionStorage.getItem('premedos.google-calendar-token.v2')).toBeNull()
  })

  it('does not reuse a token issued for the retired broader scope', async () => {
    window.sessionStorage.setItem('premedos.google-calendar-token.v1', JSON.stringify({
      accessToken: 'broad-scope-token',
      expiresAt: Date.now() + 60_000,
    }))

    const calendar = await import('./googleCalendar')
    expect(calendar.isCalendarConnected()).toBe(false)
    expect(window.sessionStorage.getItem('premedos.google-calendar-token.v1')).toBeNull()
  })

  it('fetches the next timed events from now instead of stopping at today', async () => {
    let callback: ((response: TokenCallbackResponse) => void) | undefined
    ;(window as unknown as { google: unknown }).google = {
      accounts: {
        oauth2: {
          initTokenClient: (configuration: { callback: (response: TokenCallbackResponse) => void }) => {
            callback = configuration.callback
            return {
              requestAccessToken: () => callback?.({ access_token: 'calendar-token', expires_in: 3600 }),
            }
          },
          revoke: vi.fn(),
        },
      },
    }

    const sourceEvents = [
      { id: 'soon', summary: 'In a few hours', start: { dateTime: '2026-08-31T14:00:00-04:00' }, end: { dateTime: '2026-08-31T15:00:00-04:00' } },
      { id: 'later', summary: 'Next week', start: { dateTime: '2026-09-07T10:00:00-04:00' }, end: { dateTime: '2026-09-07T11:00:00-04:00' } },
      { id: 'past', summary: 'Already finished', start: { dateTime: '2026-08-31T09:00:00-04:00' }, end: { dateTime: '2026-08-31T09:30:00-04:00' } },
    ]
    const fetchMock = vi.fn(async (input: string) => {
      const url = new URL(input)
      const min = Date.parse(url.searchParams.get('timeMin') ?? '')
      const maxParam = url.searchParams.get('timeMax')
      const max = maxParam ? Date.parse(maxParam) : Number.POSITIVE_INFINITY
      const items = sourceEvents.filter((event) => {
        const start = Date.parse(event.start.dateTime)
        const end = Date.parse(event.end.dateTime)
        return end > min && start < max
      })
      return { ok: true, status: 200, json: async () => ({ items }) }
    })
    vi.stubGlobal('fetch', fetchMock)

    const calendar = await import('./googleCalendar')
    await calendar.connectCalendar('client-id')
    const now = new Date('2026-08-31T10:00:00-04:00')
    const events = await calendar.fetchPrimaryDayEvents(now)

    expect(events.map((event) => event.title)).toEqual(['In a few hours', 'Next week'])
    const eventRequest = fetchMock.mock.calls
      .map(([input]) => new URL(String(input)))
      .find((url) => url.pathname.includes('/events'))
    expect(eventRequest?.searchParams.get('timeMin')).toBe(now.toISOString())
    expect(eventRequest?.searchParams.get('timeMax')).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/calendarList/'))).toBe(false)
  })
})
