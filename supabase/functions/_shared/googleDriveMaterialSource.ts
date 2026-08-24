import {
  googleDriveContentIdentity,
  isGoogleNativeDocument,
  safeDriveDisplayPath,
  type GoogleDriveMaterialManifestEntry,
  type GoogleDriveUnavailableNativeDocument,
} from '../../../src/lib/academics/googleDriveMaterialSource.ts'

export const GOOGLE_DRIVE_READ_SCOPE = 'https://www.googleapis.com/auth/drive.readonly'
export const GOOGLE_DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder'
export const MAX_DRIVE_FILES_PER_CHECK = 500

export interface GoogleDriveApiFile {
  id: string
  name: string
  mimeType: string
  modifiedTime?: string
  size?: string
  md5Checksum?: string
  version?: string
}

export interface DriveManifestResult {
  entries: GoogleDriveMaterialManifestEntry[]
  unavailableNativeDocuments: GoogleDriveUnavailableNativeDocument[]
}

export interface GoogleDriveConnectionRecord {
  id: string
  user_id: string
  provider: 'google-drive'
  folder_id: string
  root_label: string
  selected_at: string
  last_checked_at: string | null
  connection_state: 'connected' | 'needs-reconnect'
  recovery_reason: string | null
}

export interface PublicGoogleDriveConnection {
  id: string
  provider: 'google-drive'
  folderId: string
  rootLabel: string
  selectedAt: number
  lastCheckedAt?: number
  state: 'connected' | 'needs-reconnect' | 'configuration-required' | 'disconnected'
  recoveryReason?: 'not-connected' | 'configuration-required' | 'grant-expired' | 'folder-inaccessible' | 'folder-empty' | 'native-document-unavailable' | 'file-not-accepted' | 'file-unavailable' | 'invalid-folder'
}

function toTimestamp(value: string | undefined) {
  const timestamp = value ? Date.parse(value) : Number.NaN
  return Number.isFinite(timestamp) ? timestamp : undefined
}

function safeName(value: string | undefined) {
  return (value ?? '').replace(/[\0/\\]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function isSafeDriveFolderId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{8,256}$/.test(value)
}

export function publicGoogleDriveConnection(record: GoogleDriveConnectionRecord): PublicGoogleDriveConnection {
  const recovery = record.recovery_reason as PublicGoogleDriveConnection['recoveryReason']
  return {
    id: record.id,
    provider: 'google-drive',
    folderId: record.folder_id,
    rootLabel: record.root_label,
    selectedAt: toTimestamp(record.selected_at) ?? Date.now(),
    ...(toTimestamp(record.last_checked_at ?? undefined) ? { lastCheckedAt: toTimestamp(record.last_checked_at ?? undefined) } : {}),
    state: record.connection_state,
    ...(recovery ? { recoveryReason: recovery } : {}),
  }
}

/** Server routes must not rely on a caller-supplied connection ID alone. */
export function connectionBelongsTo(record: Pick<GoogleDriveConnectionRecord, 'user_id'>, userId: string) {
  return record.user_id === userId
}

/**
 * Builds the only shape that is permitted to cross the provider boundary.
 * It deliberately drops raw Drive metadata, parent IDs, web links, and tokens.
 */
export function materialManifestFromDriveFiles(
  files: Array<GoogleDriveApiFile & { relativePath: string }>,
): DriveManifestResult {
  const entries: GoogleDriveMaterialManifestEntry[] = []
  const unavailableNativeDocuments: GoogleDriveUnavailableNativeDocument[] = []

  for (const file of files) {
    const displayPath = safeDriveDisplayPath(file.relativePath)
    const displayName = safeName(file.name)
    if (!displayPath || !displayName || !file.id) continue

    if (isGoogleNativeDocument(file.mimeType)) {
      unavailableNativeDocuments.push({ displayPath, displayName, reason: 'native-document-unavailable' })
      continue
    }
    if (file.mimeType === GOOGLE_DRIVE_FOLDER_MIME) continue

    const size = Number(file.size)
    entries.push({
      fileId: file.id,
      displayPath,
      displayName,
      mimeType: file.mimeType || undefined,
      modifiedAt: toTimestamp(file.modifiedTime),
      sizeBytes: Number.isSafeInteger(size) && size >= 0 ? size : undefined,
      contentIdentity: googleDriveContentIdentity(file.id, file.version || file.md5Checksum || file.modifiedTime),
    })
  }
  return { entries, unavailableNativeDocuments }
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(value: string) {
  const binary = atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function base64Url(bytes: Uint8Array) {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function randomUrlSafeToken(length = 32) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return base64Url(bytes)
}

async function encryptionKey(encodedKey: string) {
  const raw = base64ToBytes(encodedKey)
  if (raw.byteLength !== 32) throw new Error('invalid-token-encryption-key')
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

export async function encryptRefreshToken(token: string, encodedKey: string) {
  const iv = new Uint8Array(12)
  crypto.getRandomValues(iv)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await encryptionKey(encodedKey),
    new TextEncoder().encode(token),
  )
  return { ciphertext: bytesToBase64(new Uint8Array(ciphertext)), iv: bytesToBase64(iv) }
}

export async function decryptRefreshToken(ciphertext: string, encodedIv: string, encodedKey: string) {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(encodedIv) },
    await encryptionKey(encodedKey),
    base64ToBytes(ciphertext),
  )
  return new TextDecoder().decode(plaintext)
}

export function safeAttachmentFilename(value: string | undefined) {
  const name = safeName(value).replace(/["\r\n]/g, '')
  return name || 'course-material'
}
