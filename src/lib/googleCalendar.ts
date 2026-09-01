import type { NormalizedScheduleEvent } from '@/lib/types'

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const SCOPE = 'https://www.googleapis.com/auth/calendar.events.owned.readonly'

interface TokenResponse { access_token?: string; error?: string; expires_in?: number }
interface TokenClient { requestAccessToken: (opts?: { prompt?: string }) => void }
interface GoogleOAuth {
  accounts: {
    oauth2: {
      initTokenClient: (cfg: {
        client_id: string
        scope: string
        include_granted_scopes?: boolean
        callback: (resp: TokenResponse) => void
      }) => TokenClient
      revoke: (token: string, done?: () => void) => void
    }
  }
}

interface GoogleCalendarEvent {
  id?: string
  summary?: string
  description?: string
  location?: string
  status?: string
  colorId?: string
  htmlLink?: string
  hangoutLink?: string
  conferenceData?: {
    entryPoints?: { entryPointType?: string; uri?: string }[]
  }
  start?: { date?: string; dateTime?: string; timeZone?: string }
  end?: { date?: string; dateTime?: string; timeZone?: string }
  organizer?: { email?: string; displayName?: string }
}

let gisPromise: Promise<void> | null = null
let accessToken: string | null = null
let tokenExpiry = 0
const TOKEN_SESSION_KEY = 'premedos.google-calendar-token.v2'
const LEGACY_TOKEN_SESSION_KEYS = ['premedos.google-calendar-token.v1']

interface StoredCalendarToken {
  accessToken: string
  expiresAt: number
}

function clearStoredToken() {
  accessToken = null
  tokenExpiry = 0
  try {
    window.sessionStorage.removeItem(TOKEN_SESSION_KEY)
    LEGACY_TOKEN_SESSION_KEYS.forEach((key) => window.sessionStorage.removeItem(key))
  } catch {
    // Calendar still works for the active page when storage is unavailable.
  }
}

/** Forget this tab's bearer token without revoking the user's Google grant.
 * Account/workspace switches call this so another Premed OS identity can
 * never reuse the previous identity's in-memory Calendar access. */
export function clearCalendarSession() {
  clearStoredToken()
}

function storeToken(token: string, expiresAt: number) {
  accessToken = token
  tokenExpiry = expiresAt
  try {
    const stored: StoredCalendarToken = { accessToken: token, expiresAt }
    window.sessionStorage.setItem(TOKEN_SESSION_KEY, JSON.stringify(stored))
  } catch {
    // Keep the token in memory when private-mode/storage policies block writes.
  }
}

function restoreStoredToken() {
  if (accessToken && Date.now() < tokenExpiry) return true
  try {
    // Never reuse a bearer token issued for the retired broader Calendar
    // scope. A one-time reconnect obtains the current least-privilege grant.
    LEGACY_TOKEN_SESSION_KEYS.forEach((key) => window.sessionStorage.removeItem(key))
    const raw = window.sessionStorage.getItem(TOKEN_SESSION_KEY)
    if (!raw) return false
    const stored = JSON.parse(raw) as Partial<StoredCalendarToken>
    if (
      typeof stored.accessToken !== 'string'
      || !stored.accessToken
      || typeof stored.expiresAt !== 'number'
      || stored.expiresAt <= Date.now()
    ) {
      clearStoredToken()
      return false
    }
    accessToken = stored.accessToken
    tokenExpiry = stored.expiresAt
    return true
  } catch {
    clearStoredToken()
    return false
  }
}

function googleApi(): GoogleOAuth | undefined {
  return (window as unknown as { google?: GoogleOAuth }).google
}

function loadGis(): Promise<void> {
  if (googleApi()?.accounts?.oauth2) return Promise.resolve()
  if (gisPromise) return gisPromise
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = GIS_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load Google sign-in.'))
    document.head.appendChild(s)
  })
  return gisPromise
}

export function isCalendarConnected() {
  return restoreStoredToken()
}

async function getToken(clientId: string, prompt: 'consent' | '') {
  if (!clientId) throw new Error('Add a Google Calendar OAuth Client ID in Settings first.')
  await loadGis()
  const oauth2 = googleApi()!.accounts.oauth2
  await new Promise<void>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      include_granted_scopes: false,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error || 'Calendar authorization failed.'))
          return
        }
        const expiresAt = Date.now() + Math.max(1, (resp.expires_in ?? 3300) - 60) * 1000
        storeToken(resp.access_token, expiresAt)
        resolve()
      },
    })
    client.requestAccessToken({ prompt })
  })
}

export function connectCalendar(clientId: string) {
  return getToken(clientId, 'consent')
}

export function connectCalendarSilent(clientId: string) {
  return getToken(clientId, '')
}

export function disconnectCalendar() {
  restoreStoredToken()
  if (accessToken && googleApi()?.accounts?.oauth2) {
    googleApi()!.accounts.oauth2.revoke(accessToken)
  }
  clearStoredToken()
}

async function calendarFetch<T>(url: string): Promise<T> {
  if (!isCalendarConnected()) throw new Error('Calendar is not connected.')
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (res.status === 401) {
    clearStoredToken()
    throw new Error('Google Calendar access expired. Reconnect once to continue syncing.')
  }
  if (!res.ok) throw new Error(`Google Calendar request failed (${res.status})`)
  return res.json() as Promise<T>
}

function findMeetingUrl(event: GoogleCalendarEvent) {
  return event.hangoutLink
    || event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === 'video')?.uri
    || event.htmlLink
}

function normalizeGoogleEvent(event: GoogleCalendarEvent): NormalizedScheduleEvent | null {
  if (!event.id || !event.start) return null
  const allDay = Boolean(event.start.date && !event.start.dateTime)
  const start = event.start.dateTime ?? event.start.date
  if (!start) return null
  const end = event.end?.dateTime ?? event.end?.date
  return {
    id: event.id,
    title: event.summary || '(No title)',
    start,
    end,
    allDay,
    location: event.location,
    meetingUrl: findMeetingUrl(event),
    calendarId: 'primary',
    status: event.status === 'cancelled' ? 'cancelled' : event.status === 'tentative' ? 'tentative' : 'confirmed',
  }
}

/** Fetch the forward-looking window used by the overview.
 *
 * There is intentionally no `timeMax`: the dashboard should show the next
 * few real timed events even when today is empty or the next class is several
 * days away. The UI caps the rendered list, while Google keeps the response
 * bounded with a small page size.
 */
export async function fetchPrimaryUpcomingEvents(date = new Date()) {
  const params = new URLSearchParams({
    calendarId: 'primary',
    timeMin: date.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
    showDeleted: 'false',
  })
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`
  const json = await calendarFetch<{ items?: GoogleCalendarEvent[] }>(url)
  return (json.items ?? [])
    .map((event) => normalizeGoogleEvent(event))
    .filter(Boolean) as NormalizedScheduleEvent[]
}

/** @deprecated Kept as a source-compatible alias for callers that still use
 * the old day-scoped name. The returned window is now forward-looking. */
export const fetchPrimaryDayEvents = fetchPrimaryUpcomingEvents
