/* ============================================================
   googleDrive.ts — backup the dashboard JSON to the user's Drive.

   Uses Google Identity Services (GIS) for OAuth (implicit token)
   + the Drive REST API. The backup file lives in the hidden
   "appDataFolder", so it never clutters the user's Drive and only
   this app can read it (scope: drive.appdata).

   Honest limitation: a static page can only back up while open, so
   we debounce-on-change while open + push once per day on open.
   A future "backup while closed" hook would need a tiny backend.
   ============================================================ */

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
const BACKUP_FILENAME = 'premed-hq-backup.json'

// Minimal GIS typings (the script attaches `google` to window).
interface TokenResponse { access_token?: string; error?: string }
interface TokenClient { requestAccessToken: (opts?: { prompt?: string }) => void }
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string
            scope: string
            callback: (resp: TokenResponse) => void
          }) => TokenClient
          revoke: (token: string, done?: () => void) => void
        }
      }
    }
  }
}

let gisPromise: Promise<void> | null = null
let accessToken: string | null = null
let tokenExpiry = 0
let credentialGeneration = 0
let silentReconnectAllowed = false
let uploadQueue: Promise<unknown> = Promise.resolve()

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
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

export function isConnected(): boolean {
  return !!accessToken && Date.now() < tokenExpiry
}

async function getToken(clientId: string, prompt: 'consent' | ''): Promise<void> {
  if (!clientId) throw new Error('Add your Google OAuth Client ID in Settings first.')
  if (prompt === '' && !silentReconnectAllowed) throw new Error('Reconnect Google Drive for this workspace before backing up.')
  const requestGeneration = ++credentialGeneration
  await loadGis()
  if (requestGeneration !== credentialGeneration) throw new Error('Drive connection changed. Reconnect before continuing.')
  const oauth2 = window.google!.accounts.oauth2
  await new Promise<void>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp) => {
        if (requestGeneration !== credentialGeneration) { reject(new Error('Drive connection changed. Reconnect before continuing.')); return }
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error || 'Authorization failed.'))
          return
        }
        accessToken = resp.access_token
        silentReconnectAllowed = true
        tokenExpiry = Date.now() + 55 * 60 * 1000 // ~55 min
        resolve()
      },
    })
    client.requestAccessToken({ prompt })
  })
}

/** Interactive connect — must be triggered by a user gesture (popup). */
export function connect(clientId: string): Promise<void> {
  return getToken(clientId, 'consent')
}

/** Silent re-auth for the daily-on-open check (no popup if already consented). */
export function connectSilent(clientId: string): Promise<void> {
  return getToken(clientId, '')
}

/** Drop local authorization on app identity changes without revoking another session. */
export function clearDriveSession(): void {
  credentialGeneration++
  accessToken = null
  tokenExpiry = 0
  silentReconnectAllowed = false
}
export function disconnect(): void {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken)
  }
  clearDriveSession()
}

function captureCredentials() {
  if (!isConnected()) throw new Error('Not connected to Google Drive.')
  return { token: accessToken!, generation: credentialGeneration }
}
function assertCredentials(credentials: ReturnType<typeof captureCredentials>) {
  if (credentials.generation !== credentialGeneration || credentials.token !== accessToken || !isConnected()) throw new Error('Drive connection changed. Backup or restore was stopped.')
}
async function findBackupFile(credentials: ReturnType<typeof captureCredentials>): Promise<string | null> {
  assertCredentials(credentials)
  const q = encodeURIComponent(`name='${BACKUP_FILENAME}'`)
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name)`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${credentials.token}` } })
  if (!res.ok) throw new Error(`Drive list failed (${res.status})`)
  const json = (await res.json()) as { files?: { id: string }[] }
  assertCredentials(credentials)
  return json.files?.[0]?.id ?? null
}

/** Create or update the single backup file. Returns its Drive file id. */
export function uploadBackup(data: unknown, existingId: string | undefined, beforeWrite: () => void | Promise<void>): Promise<string> {
  const credentials = captureCredentials()
  const serialized = JSON.stringify(data)
  const run = async () => {
    const check = async () => { assertCredentials(credentials); await beforeWrite(); assertCredentials(credentials) }
    await check()
    const fileId = existingId || (await findBackupFile(credentials)) || null
    await check()

    const metadata = fileId
      ? { name: BACKUP_FILENAME }
      : { name: BACKUP_FILENAME, parents: ['appDataFolder'] }

    const boundary = 'premedos' + Math.random().toString(36).slice(2)
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
      serialized +
      `\r\n--${boundary}--`

    const method = fileId ? 'PATCH' : 'POST'
    const url = fileId
      ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id`
      : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id`

    await check()
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${credentials.token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    })
    if (!res.ok) throw new Error(`Drive upload failed (${res.status})`)
    const json = (await res.json()) as { id: string }
    assertCredentials(credentials)
    return json.id
  }
  // One queue for every mounted hook and credential generation. An older
  // dispatched write must finish before a newer snapshot can replace it.
  const result = uploadQueue.then(run, run)
  uploadQueue = result.catch(() => undefined)
  return result
}

/** Pull the latest backup JSON back down (restore from Drive). */
export async function downloadBackup(): Promise<unknown | null> {
  const credentials = captureCredentials()
  const fileId = await findBackupFile(credentials)
  assertCredentials(credentials)
  if (!fileId) return null
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${credentials.token}` } }
  )
  if (!res.ok) throw new Error(`Drive download failed (${res.status})`)
  const data: unknown = await res.json()
  assertCredentials(credentials)
  return data
}
