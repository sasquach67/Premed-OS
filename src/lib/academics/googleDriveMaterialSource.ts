/**
 * Public, metadata-only contract for the optional Google Drive material
 * provider. This deliberately has no OAuth token, provider URL, or raw Drive
 * response shape: those remain inside the Edge Function.
 */
export type GoogleDriveMaterialSourceState =
  | 'connected'
  | 'needs-reconnect'
  | 'configuration-required'
  | 'disconnected'

export type GoogleDriveMaterialSourceRecovery =
  | 'not-connected'
  | 'configuration-required'
  | 'grant-expired'
  | 'folder-inaccessible'
  | 'folder-empty'
  | 'native-document-unavailable'
  | 'file-not-accepted'
  | 'file-unavailable'
  | 'invalid-folder'

export interface GoogleDriveMaterialSourceConnection {
  id: string
  provider: 'google-drive'
  rootLabel: string
  folderId: string
  selectedAt: number
  lastCheckedAt?: number
  state: GoogleDriveMaterialSourceState
  recoveryReason?: GoogleDriveMaterialSourceRecovery
}

/** Compatible with the existing review-first watched-notes intake engine. */
export interface GoogleDriveMaterialManifestEntry {
  fileId: string
  displayPath: string
  displayName: string
  mimeType?: string
  modifiedAt?: number
  sizeBytes?: number
  /** Stable across folder reorganizations; changes when Drive reports a new revision. */
  contentIdentity: string
}

export interface GoogleDriveUnavailableNativeDocument {
  displayPath: string
  displayName: string
  reason: 'native-document-unavailable'
}

export interface GoogleDriveMaterialListResult {
  connection: GoogleDriveMaterialSourceConnection
  entries: GoogleDriveMaterialManifestEntry[]
  unavailableNativeDocuments: GoogleDriveUnavailableNativeDocument[]
  transfer: 'metadata-only'
}

export function googleDriveContentIdentity(fileId: string, revision: string | undefined) {
  return `gdrive:${fileId}:${revision?.trim() || 'revision-unavailable'}`
}

/**
 * The browser store persists only a relative, display-safe path. Provider
 * folder IDs are not meaningful as paths and never appear in it.
 */
export function safeDriveDisplayPath(value: string) {
  const trimmed = value.replace(/\0/g, '').trim().replace(/\\+/g, '/')
  if (!trimmed || /^(?:[a-z]:\/|\/|~\/)/i.test(trimmed)) return undefined
  const pieces = trimmed.split('/').filter(Boolean)
  if (!pieces.length || pieces.some((piece) => piece === '.' || piece === '..')) return undefined
  return pieces.join('/')
}

export function isGoogleNativeDocument(mimeType: string | undefined) {
  return Boolean(mimeType?.startsWith('application/vnd.google-apps.'))
    && mimeType !== 'application/vnd.google-apps.folder'
}
