import { createClient } from 'npm:@supabase/supabase-js@2.110.2'
import {
  GOOGLE_DRIVE_FOLDER_MIME, GOOGLE_DRIVE_READ_SCOPE, MAX_DRIVE_FILES_PER_CHECK,
  decryptRefreshToken, encryptRefreshToken, isSafeDriveFolderId,
  materialManifestFromDriveFiles, publicGoogleDriveConnection, randomUrlSafeToken,
  safeAttachmentFilename, type GoogleDriveApiFile, type GoogleDriveConnectionRecord,
} from '../_shared/googleDriveMaterialSource.ts'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke'
const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3'
const OAUTH_STATE_TTL_MS = 15 * 60 * 1000
const corsHeadersBase = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Expose-Headers': 'X-PremedOS-Transfer, Content-Disposition',
}

/** The generated database types are not checked into this static client repo.
 * Keep the Edge Function's table boundary explicit without leaking `never`
 * through Supabase's untyped generic defaults. */
interface AdminClient {
  from: (relation: string) => any
}

type TokenRecord = {
  connection_id: string
  user_id: string
  encrypted_refresh_token: string
  encryption_iv: string
}

type OAuthStateRecord = {
  state: string
  user_id: string
  connection_id: string
  folder_id: string
  root_label: string
  code_verifier: string
  return_to: string | null
}

type ConnectedFile = GoogleDriveApiFile & { relativePath: string }

function json(value: unknown, status = 200, origin?: string | null) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(origin) },
  })
}

function failure(status: number, code: string, message: string, origin?: string | null) {
  return json({ error: { code, message } }, status, origin)
}

function cors(origin?: string | null) {
  const allowed = new Set((Deno.env.get('MATERIAL_SOURCE_ALLOWED_ORIGINS') ?? '')
    .split(',').map((value) => value.trim()).filter(Boolean))
  return origin && allowed.has(origin)
    ? { ...corsHeadersBase, 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
    : corsHeadersBase
}

function configured() {
  return [
    Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    Deno.env.get('GOOGLE_DRIVE_CLIENT_ID'), Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET'),
    Deno.env.get('MATERIAL_SOURCE_TOKEN_ENCRYPTION_KEY'), Deno.env.get('PREMEDOS_APP_ORIGIN'),
    Deno.env.get('MATERIAL_SOURCE_ALLOWED_ORIGINS'),
  ].every(Boolean)
}

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('server-unconfigured')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function authenticate(request: Request) {
  const authorization = request.headers.get('authorization')
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!authorization || !url || !anonKey) return undefined
  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } }, auth: { persistSession: false },
  })
  const { data, error } = await client.auth.getUser()
  return error ? undefined : data.user
}

function callbackUrl() {
  return `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-drive-materials?action=callback`
}

function safeAcademicsReturnHash(value: unknown) {
  if (typeof value !== 'string' || value.length > 512) return '#/academics?mode=daily&tab=class-center'
  if (!value.startsWith('#/academics') || value.includes('://') || value.includes('\\') || /[\r\n]/.test(value)) {
    return '#/academics?mode=daily&tab=class-center'
  }
  const [path, query = ''] = value.split('?', 2)
  const params = new URLSearchParams(query)
  params.set('driveConnection', 'connected')
  return `${path}?${params.toString()}`
}

async function sha256Base64Url(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  const binary = String.fromCharCode(...new Uint8Array(digest))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function connectionForUser(admin: AdminClient, userId: string) {
  return admin
    .from('academic_material_source_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google-drive')
    .maybeSingle()
}

async function refreshAccessToken(admin: AdminClient, connection: GoogleDriveConnectionRecord) {
  const tokenResult = await (admin
    .from('academic_material_source_secrets')
    .select('connection_id,user_id,encrypted_refresh_token,encryption_iv')
    .eq('connection_id', connection.id)
    .eq('user_id', connection.user_id)
    .maybeSingle() as Promise<{ data: TokenRecord | null; error: unknown }>)
  const { data: token, error } = tokenResult
  if (error || !token) throw new DriveFailure('needs-reconnect', 'Reconnect Google Drive to check this folder.')
  let refreshToken: string
  try {
    refreshToken = await decryptRefreshToken(
      token.encrypted_refresh_token, token.encryption_iv,
      Deno.env.get('MATERIAL_SOURCE_TOKEN_ENCRYPTION_KEY')!,
    )
  } catch {
    throw new DriveFailure('needs-reconnect', 'Reconnect Google Drive to check this folder.')
  }
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_DRIVE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET')!,
      refresh_token: refreshToken, grant_type: 'refresh_token',
    }),
  })
  const body = await response.json().catch(() => ({})) as { access_token?: string }
  if (!response.ok || !body.access_token) {
    await admin.from('academic_material_source_connections')
      .update({ connection_state: 'needs-reconnect', recovery_reason: 'grant-expired' })
      .eq('id', connection.id).eq('user_id', connection.user_id)
    throw new DriveFailure('grant-expired', 'Google Drive access expired. Reconnect the selected folder.')
  }
  return { accessToken: body.access_token, refreshToken }
}

class DriveFailure extends Error {
  constructor(readonly code: string, message: string) { super(message) }
}

async function driveJson<T>(path: string, accessToken: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${GOOGLE_DRIVE_API}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}`, ...(options?.headers ?? {}) },
  })
  const result = await response.json().catch(() => ({})) as T & { error?: { code?: number } }
  if (!response.ok) {
    if ((result as { error?: { code?: number } }).error?.code === 404) {
      throw new DriveFailure('folder-inaccessible', 'The selected folder is not reachable from this Drive grant.')
    }
    throw new DriveFailure('provider-unavailable', 'Google Drive could not check the selected folder.')
  }
  return result
}

async function readFolderMetadata(folderId: string, accessToken: string) {
  return driveJson<GoogleDriveApiFile>(
    `/files/${encodeURIComponent(folderId)}?fields=id,name,mimeType`, accessToken,
  )
}

/** Metadata-only breadth-first traversal; it never asks Drive for file bytes. */
async function listFolderFiles(folderId: string, accessToken: string): Promise<ConnectedFile[]> {
  const root = await readFolderMetadata(folderId, accessToken)
  if (root.mimeType !== GOOGLE_DRIVE_FOLDER_MIME) {
    throw new DriveFailure('invalid-folder', 'Choose a Google Drive folder, not an individual file.')
  }
  const queue: Array<{ id: string; path: string }> = [{ id: folderId, path: '' }]
  const files: ConnectedFile[] = []
  while (queue.length && files.length < MAX_DRIVE_FILES_PER_CHECK) {
    const folder = queue.shift()!
    let pageToken: string | undefined
    do {
      const params = new URLSearchParams({
        q: `'${folder.id.replace(/'/g, "\\'")}' in parents and trashed = false`,
        pageSize: '100',
        fields: 'nextPageToken,files(id,name,mimeType,modifiedTime,size,md5Checksum,version)',
        orderBy: 'folder,name',
      })
      if (pageToken) params.set('pageToken', pageToken)
      const page = await driveJson<{ nextPageToken?: string; files?: GoogleDriveApiFile[] }>(`/files?${params}`, accessToken)
      for (const file of page.files ?? []) {
        const relativePath = folder.path ? `${folder.path}/${file.name}` : file.name
        if (file.mimeType === GOOGLE_DRIVE_FOLDER_MIME) queue.push({ id: file.id, path: relativePath })
        else if (files.length < MAX_DRIVE_FILES_PER_CHECK) files.push({ ...file, relativePath })
      }
      pageToken = page.nextPageToken
    } while (pageToken && files.length < MAX_DRIVE_FILES_PER_CHECK)
  }
  return files
}

async function selectedConnection(admin: AdminClient, userId: string) {
  const { data, error } = await connectionForUser(admin, userId)
  if (error) throw new DriveFailure('provider-unavailable', 'The folder connection could not be checked.')
  if (!data) throw new DriveFailure('not-connected', 'Connect a Google Drive folder before checking it.')
  return data
}

async function manifestForConnection(admin: AdminClient, connection: GoogleDriveConnectionRecord) {
  const { accessToken } = await refreshAccessToken(admin, connection)
  const files = await listFolderFiles(connection.folder_id, accessToken)
  const manifest = materialManifestFromDriveFiles(files)
  const recoveryReason = manifest.entries.length ? null : manifest.unavailableNativeDocuments.length
    ? 'native-document-unavailable'
    : 'folder-empty'
  // An empty folder or an unsupported native document is an honest source
  // state, not a broken OAuth grant. Reconnect is reserved for token failure.
  const state = 'connected'
  const updatedResult = await (admin
    .from('academic_material_source_connections')
    .update({ last_checked_at: new Date().toISOString(), connection_state: state, recovery_reason: recoveryReason })
    .eq('id', connection.id).eq('user_id', connection.user_id).select('*').single() as Promise<{ data: GoogleDriveConnectionRecord | null; error: unknown }>)
  const { data: updated, error } = updatedResult
  if (error || !updated) throw new DriveFailure('provider-unavailable', 'The folder check could not be saved.')
  return { connection: updated, manifest, accessToken, files }
}

async function handleBegin(request: Request, userId: string, origin: string | null) {
  if (!configured()) return failure(503, 'configuration-required', 'Google Drive materials must be configured by the app owner first.', origin)
  const body = await request.json().catch(() => ({})) as { folderId?: unknown; rootLabel?: unknown; returnTo?: unknown }
  if (!isSafeDriveFolderId(body.folderId) || typeof body.rootLabel !== 'string' || !body.rootLabel.trim()) {
    return failure(400, 'invalid-folder', 'Choose one named Google Drive folder before connecting.', origin)
  }
  const admin = adminClient()
  const { data: existing, error: existingError } = await connectionForUser(admin, userId)
  if (existingError) return failure(503, 'provider-unavailable', 'The folder connection could not be prepared.', origin)
  const connectionId = existing?.id ?? crypto.randomUUID()
  const state = randomUrlSafeToken(32)
  const codeVerifier = randomUrlSafeToken(64)
  const { error } = await admin.from('academic_material_source_oauth_states').insert({
    state, user_id: userId, connection_id: connectionId, folder_id: body.folderId,
    root_label: body.rootLabel.trim().slice(0, 160), code_verifier: codeVerifier,
    return_to: safeAcademicsReturnHash(body.returnTo).replace(/([?&])driveConnection=connected(?:&|$)/, '$1').replace(/[?&]$/, ''),
    expires_at: new Date(Date.now() + OAUTH_STATE_TTL_MS).toISOString(),
  })
  if (error) return failure(503, 'provider-unavailable', 'The connection request could not be prepared.', origin)
  const authorize = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authorize.search = new URLSearchParams({
    client_id: Deno.env.get('GOOGLE_DRIVE_CLIENT_ID')!, redirect_uri: callbackUrl(), response_type: 'code',
    scope: GOOGLE_DRIVE_READ_SCOPE, state, code_challenge: await sha256Base64Url(codeVerifier),
    code_challenge_method: 'S256', access_type: 'offline', prompt: 'consent', include_granted_scopes: 'false',
  }).toString()
  return json({ authorizeUrl: authorize.toString(), connectionId }, 200, origin)
}

async function handleCallback(url: URL) {
  const state = url.searchParams.get('state')
  const code = url.searchParams.get('code')
  const appOrigin = Deno.env.get('PREMEDOS_APP_ORIGIN')
  if (!configured() || !state || !code || !appOrigin) return new Response('Google Drive connection could not be completed.', { status: 400 })
  const admin = adminClient()
  // Consume the state atomically: a callback URL cannot be replayed after this delete.
  const { data: pending, error } = await admin
    .from('academic_material_source_oauth_states')
    .delete()
    .eq('state', state)
    .gt('expires_at', new Date().toISOString())
    .select('state,user_id,connection_id,folder_id,root_label,code_verifier,return_to')
    .maybeSingle<OAuthStateRecord>()
  if (error || !pending) return new Response('Google Drive connection expired. Return to Premed OS and try again.', { status: 400 })

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: Deno.env.get('GOOGLE_DRIVE_CLIENT_ID')!, client_secret: Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET')!,
      redirect_uri: callbackUrl(), grant_type: 'authorization_code', code_verifier: pending.code_verifier,
    }),
  })
  const token = await tokenResponse.json().catch(() => ({})) as { refresh_token?: string; access_token?: string }
  if (!tokenResponse.ok || !token.refresh_token) return new Response('Google did not return a reusable folder grant. Return to Premed OS and reconnect the folder.', { status: 400 })
  const folder = await readFolderMetadata(pending.folder_id, token.access_token ?? '')
  if (folder.mimeType !== GOOGLE_DRIVE_FOLDER_MIME) return new Response('Choose a Google Drive folder, then reconnect it from Premed OS.', { status: 400 })
  const now = new Date().toISOString()
  const { data: connection, error: connectionError } = await admin.from('academic_material_source_connections')
    .upsert({ id: pending.connection_id, user_id: pending.user_id, provider: 'google-drive', folder_id: pending.folder_id, root_label: pending.root_label, selected_at: now, connection_state: 'connected', recovery_reason: null }, { onConflict: 'user_id,provider' })
    .select('*').single<GoogleDriveConnectionRecord>()
  if (connectionError || !connection) return new Response('The folder connection could not be saved. Return to Premed OS and try again.', { status: 503 })
  const encrypted = await encryptRefreshToken(token.refresh_token, Deno.env.get('MATERIAL_SOURCE_TOKEN_ENCRYPTION_KEY')!)
  const { error: secretError } = await admin.from('academic_material_source_secrets').upsert({
    connection_id: connection.id, user_id: pending.user_id,
    encrypted_refresh_token: encrypted.ciphertext, encryption_iv: encrypted.iv, updated_at: now,
  }, { onConflict: 'connection_id' })
  if (secretError) return new Response('The folder grant could not be stored. Return to Premed OS and try again.', { status: 503 })
  const destination = new URL(appOrigin)
  destination.hash = safeAcademicsReturnHash(pending.return_to)
  return Response.redirect(destination.toString(), 302)
}

async function handlePost(request: Request, userId: string, origin: string | null) {
  const body = await request.clone().json().catch(() => ({})) as { action?: string; fileId?: unknown; contentIdentity?: unknown }
  if (body.action === 'begin') return handleBegin(request, userId, origin)
  const admin = adminClient()
  if (body.action === 'status') {
    const { data, error } = await connectionForUser(admin, userId)
    if (error) return failure(503, 'provider-unavailable', 'The folder connection could not be checked.', origin)
    return json({ connection: data ? publicGoogleDriveConnection(data) : undefined }, 200, origin)
  }
  if (body.action === 'disconnect') {
    const connection = await selectedConnection(admin, userId)
    try {
      const { accessToken } = await refreshAccessToken(admin, connection)
      await fetch(GOOGLE_REVOKE_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token: accessToken }) })
    } catch { /* revoke is best-effort; local accepted material must still survive disconnect. */ }
    await admin.from('academic_material_source_connections').delete().eq('id', connection.id).eq('user_id', userId)
    return json({ disconnected: true, preserved: 'accepted-local-material-and-proposal-history' }, 200, origin)
  }
  try {
    const connection = await selectedConnection(admin, userId)
    if (body.action === 'list') {
      const result = await manifestForConnection(admin, connection)
      return json({ connection: publicGoogleDriveConnection(result.connection), ...result.manifest, transfer: 'metadata-only' }, 200, origin)
    }
    if (typeof body.fileId !== 'string' || typeof body.contentIdentity !== 'string') {
      return failure(400, 'invalid-request', 'An accepted Google Drive file identity is required.', origin)
    }
    const result = await manifestForConnection(admin, connection)
    const file = result.files.find((candidate) => candidate.id === body.fileId)
    const manifestEntry = result.manifest.entries.find((entry) => entry.fileId === body.fileId && entry.contentIdentity === body.contentIdentity)
    if (!file || !manifestEntry) return failure(404, 'file-unavailable', 'That file is no longer available in the selected folder.', origin)
    if (body.action === 'record-accepted') {
      const { error } = await admin.from('academic_material_source_accepted_files').upsert({
        connection_id: connection.id, user_id: userId, file_id: file.id, content_identity: manifestEntry.contentIdentity,
      }, { onConflict: 'connection_id,file_id,content_identity' })
      if (error) return failure(503, 'provider-unavailable', 'The reviewed file could not be marked for attachment.', origin)
      return json({ accepted: true, transfer: 'metadata-only' }, 200, origin)
    }
    if (body.action === 'open-accepted') {
      const { data: accepted, error } = await admin.from('academic_material_source_accepted_files')
        .select('file_id').eq('connection_id', connection.id).eq('user_id', userId)
        .eq('file_id', file.id).eq('content_identity', manifestEntry.contentIdentity).maybeSingle()
      if (error || !accepted) return failure(403, 'file-not-accepted', 'Review and accept this file before attaching it.', origin)
      const response = await fetch(`${GOOGLE_DRIVE_API}/files/${encodeURIComponent(file.id)}?alt=media`, {
        headers: { Authorization: `Bearer ${result.accessToken}` },
      })
      if (!response.ok || !response.body) return failure(503, 'file-unavailable', 'The accepted file could not be downloaded.', origin)
      return new Response(response.body, { headers: {
        ...cors(origin), 'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeAttachmentFilename(file.name)}"`,
        'X-PremedOS-Transfer': 'cloud-file-download',
      } })
    }
    return failure(400, 'invalid-request', 'Unknown Google Drive materials action.', origin)
  } catch (error) {
    if (error instanceof DriveFailure) return failure(error.code === 'grant-expired' ? 401 : 503, error.code, error.message, origin)
    return failure(503, 'provider-unavailable', 'Google Drive is unavailable right now.', origin)
  }
}

Deno.serve(async (request) => {
  const url = new URL(request.url)
  if (request.method === 'GET' && url.searchParams.get('action') === 'callback') return handleCallback(url)
  const origin = request.headers.get('origin')
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) })
  if (request.method !== 'POST') return failure(405, 'method-not-allowed', 'POST required.', origin)
  if (!configured()) return failure(503, 'configuration-required', 'Google Drive materials must be configured by the app owner first.', origin)
  const user = await authenticate(request)
  if (!user) return failure(401, 'sign-in-required', 'Sign in before connecting a material source.', origin)
  return handlePost(request, user.id, origin)
})
