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
const COMPLETE_BACKUP_FILENAME = 'premed-os-workspace-backup-v1.zip'
const CANDIDATE_BACKUP_FILENAME = 'premed-os-workspace-backup-candidate-v1.zip'

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

/** Each complete backup is immutable. Legacy clients cannot replace this format,
 * and an interrupted/newer upload cannot destroy an earlier complete snapshot. */
async function backupOwner(workspaceKey: string) {
  if (!workspaceKey.startsWith('hq:app-data:account:')) throw new Error('Open the signed-in account before using Drive backup.')
  const { binaryDigest } = await import('./workspaceAssets')
  return binaryDigest(new Blob([workspaceKey]))
}
export function uploadCompleteBackup(blob: Blob, beforeWrite: () => void | Promise<void>, workspaceKey: string): Promise<string> {
  const credentials = captureCredentials()
  const run = async () => {
    const check = async () => { assertCredentials(credentials); await beforeWrite(); assertCredentials(credentials) }
    const owner = await backupOwner(workspaceKey)
    await check()
    const start = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id', {
      method: 'POST', headers: { Authorization: `Bearer ${credentials.token}`, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': 'application/zip', 'X-Upload-Content-Length': String(blob.size) },
      body: JSON.stringify({ name: CANDIDATE_BACKUP_FILENAME, mimeType: 'application/zip', parents: ['appDataFolder'], appProperties: { workspace: owner, status: 'candidate', format: '1' } }),
    })
    await check()
    if (!start.ok) throw new Error(`Drive could not start the complete backup (${start.status}). Your earlier backups were kept.`)
    const location = start.headers.get('Location')
    if (!location) throw new Error('Drive did not return an upload session.')
    const target = new URL(location)
    if (target.origin !== 'https://www.googleapis.com' || !target.pathname.startsWith('/upload/drive/v3/files')) throw new Error('Drive returned an unexpected upload destination.')
    // A resumable session accepts the binary in one PUT. On an uncertain failure,
    // a later attempt starts a new immutable snapshot rather than replacing one.
    await check()
    const response = await fetch(target.href, { method: 'PUT', headers: { Authorization: `Bearer ${credentials.token}`, 'Content-Type': 'application/zip' }, body: blob })
    await check()
    if (!response.ok) throw new Error(`Complete backup upload failed (${response.status}). Earlier backups were kept.`)
    const result = await response.json() as { id?: string }
    if (!result.id || !/^[\w-]+$/.test(result.id)) throw new Error('Drive did not confirm a backup file.')
    const verified = await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}?alt=media`, { headers: { Authorization: `Bearer ${credentials.token}` } })
    await check()
    if (!verified.ok) throw new Error('Drive stored a candidate backup but could not verify its contents. Earlier backups were kept.')
    const saved = await verified.blob(), { binaryDigest } = await import('./workspaceAssets')
    const hash = await binaryDigest(blob)
    if (saved.size !== blob.size || await binaryDigest(saved) !== hash) throw new Error('The complete Drive backup failed its integrity check.')
    await check()
    const published = await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}?fields=id,name,appProperties`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${credentials.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: COMPLETE_BACKUP_FILENAME, appProperties: { workspace: owner, status: 'verified', format: '1', sha256: hash } }),
    })
    await check()
    if (!published.ok) throw new Error('The verified backup could not be published. Earlier restore points remain available.')
    const readback = await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}?fields=id,name,appProperties`, { headers: { Authorization: `Bearer ${credentials.token}` } })
    await check()
    if (!readback.ok) throw new Error('Backup publication could not be confirmed. Earlier restore points remain available.')
    const metadata = await readback.json() as { id?: string; name?: string; appProperties?: Record<string, string> }
    await check()
    if (metadata.id !== result.id || metadata.name !== COMPLETE_BACKUP_FILENAME || metadata.appProperties?.workspace !== owner || metadata.appProperties?.status !== 'verified' || metadata.appProperties?.sha256 !== hash) throw new Error('Backup publication verification failed.')
    return result.id
  }
  const result = uploadQueue.then(run, run)
  uploadQueue = result.catch(() => undefined)
  return result
}

/** Prefer the latest complete snapshot; fall back only when none exists. A
 * malformed complete backup is an error, never a reason to restore older JSON. */
export type CompleteBackupPoint = { id: string; name: string; size: string; createdTime: string; appProperties: { workspace: string; status: string; format: string; sha256: string } }
export async function listCompleteBackups(workspaceKey: string): Promise<CompleteBackupPoint[]> {
  const credentials = captureCredentials()
  const owner = await backupOwner(workspaceKey)
  assertCredentials(credentials)
  const q = encodeURIComponent(`name='${COMPLETE_BACKUP_FILENAME}' and trashed=false and appProperties has { key='workspace' and value='${owner}' } and appProperties has { key='status' and value='verified' }`)
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&orderBy=createdTime%20desc&pageSize=100&fields=files(id,name,size,createdTime,appProperties)`, { headers: { Authorization: `Bearer ${credentials.token}` } })
  assertCredentials(credentials)
  if (!response.ok) throw new Error(`Drive backup discovery failed (${response.status}).`)
  const result = await response.json() as { files?: CompleteBackupPoint[] }
  assertCredentials(credentials)
  const files = result.files ?? []
  for (const file of files) if (!/^[\w-]+$/.test(file.id) || file.name !== COMPLETE_BACKUP_FILENAME || file.appProperties?.workspace !== owner || file.appProperties?.status !== 'verified' || file.appProperties?.format !== '1' || !/^[a-f0-9]{64}$/.test(file.appProperties?.sha256)) throw new Error('Drive returned an unverified or different-account restore point.')
  return files
}
export async function downloadLatestBackup(workspaceKey: string, selectedId?: string): Promise<{ kind: 'complete'; blob: Blob } | { kind: 'legacy'; data: unknown } | null> {
  const credentials = captureCredentials()
  await backupOwner(workspaceKey)
  assertCredentials(credentials)
  const files = selectedId === 'legacy' ? [] : await listCompleteBackups(workspaceKey)
  assertCredentials(credentials)
  const file = selectedId && selectedId !== 'legacy' ? files.find(file => file.id === selectedId) : files[0]
  if (selectedId && selectedId !== 'legacy' && !file) throw new Error('That restore point is no longer available for this account. Choose a listed backup.')
  if (!file) { const data = await downloadBackup(); assertCredentials(credentials); return data === null ? null : { kind: 'legacy', data } }
  if (!/^[\w-]+$/.test(file.id) || Number(file.size) > 256 * 1024 * 1024) throw new Error('The complete backup is invalid or too large for this browser restore.')
  const download = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, { headers: { Authorization: `Bearer ${credentials.token}` } })
  assertCredentials(credentials)
  if (!download.ok) throw new Error(`Complete backup download failed (${download.status}).`)
  const blob = await download.blob(); assertCredentials(credentials)
  const { binaryDigest } = await import('./workspaceAssets')
  if (blob.size !== Number(file.size) || await binaryDigest(blob) !== file.appProperties.sha256) throw new Error('This published backup is damaged. Choose an earlier verified restore point; no older backup was restored automatically.')
  assertCredentials(credentials)
  return { kind: 'complete', blob }
}
