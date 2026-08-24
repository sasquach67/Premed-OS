import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  GoogleDriveMaterialListResult, GoogleDriveMaterialSourceConnection,
  GoogleDriveMaterialSourceRecovery,
} from './googleDriveMaterialSource'

type EdgeFailure = { error?: { code?: string; message?: string } }

export type GoogleDriveBeginResult =
  | { ok: true; authorizeUrl: string; connectionId: string }
  | { ok: false; reason: GoogleDriveMaterialSourceRecovery | 'server-unavailable'; message: string }

export type GoogleDriveStatusResult =
  | { ok: true; connection?: GoogleDriveMaterialSourceConnection }
  | { ok: false; reason: GoogleDriveMaterialSourceRecovery | 'server-unavailable'; message: string }

function failure(error: unknown, fallback: GoogleDriveMaterialSourceRecovery | 'server-unavailable') {
  const detail = error as EdgeFailure
  return {
    ok: false as const,
    reason: detail?.error?.code === 'configuration-required' ? 'configuration-required' : fallback,
    message: detail?.error?.message || 'The connected folder could not be reached.',
  }
}

/**
 * Thin browser-side request adapter. It never sees an OAuth credential and
 * intentionally does not turn a manifest into a Material; the caller gives
 * its returned entries to intakeWatchedNotesManifest() for review first.
 */
export async function beginGoogleDriveMaterialConnection(
  client: SupabaseClient,
  input: { folderId: string; rootLabel: string },
): Promise<GoogleDriveBeginResult> {
  const { data, error } = await client.functions.invoke('google-drive-materials', {
    body: { action: 'begin', ...input },
  })
  if (error || !data?.authorizeUrl || !data?.connectionId) return failure(error, 'server-unavailable')
  return { ok: true, authorizeUrl: data.authorizeUrl, connectionId: data.connectionId }
}

export async function googleDriveMaterialConnectionStatus(
  client: SupabaseClient,
): Promise<GoogleDriveStatusResult> {
  const { data, error } = await client.functions.invoke('google-drive-materials', { body: { action: 'status' } })
  if (error || typeof data !== 'object' || !data) return failure(error, 'server-unavailable')
  return { ok: true, connection: data.connection }
}

export async function listGoogleDriveMaterialManifest(
  client: SupabaseClient,
): Promise<{ ok: true; value: GoogleDriveMaterialListResult } | { ok: false; reason: GoogleDriveMaterialSourceRecovery | 'server-unavailable'; message: string }> {
  const { data, error } = await client.functions.invoke('google-drive-materials', { body: { action: 'list' } })
  if (error || !data?.connection || !Array.isArray(data?.entries)) return failure(error, 'server-unavailable')
  return { ok: true, value: data as GoogleDriveMaterialListResult }
}

/** Must be called only after the local review engine has accepted the proposal. */
export async function recordAcceptedGoogleDriveMaterial(
  client: SupabaseClient,
  input: { fileId: string; contentIdentity: string },
) {
  const { data, error } = await client.functions.invoke('google-drive-materials', {
    body: { action: 'record-accepted', ...input },
  })
  if (error || !data?.accepted) return failure(error, 'file-unavailable')
  return { ok: true as const }
}

/**
 * The Edge Function returns bytes only for a server-recorded accepted file.
 * The caller may use this URL for the existing local retention flow.
 */
export async function acceptedGoogleDriveMaterialDownload(
  client: SupabaseClient,
  input: { fileId: string; contentIdentity: string },
) {
  const { data, error } = await client.functions.invoke('google-drive-materials', {
    body: { action: 'open-accepted', ...input },
  })
  if (error || !(data instanceof Blob)) return failure(error, 'file-unavailable')
  return { ok: true as const, file: data, transfer: 'cloud-file-download' as const }
}

export async function disconnectGoogleDriveMaterialConnection(client: SupabaseClient) {
  const { data, error } = await client.functions.invoke('google-drive-materials', { body: { action: 'disconnect' } })
  if (error || !data?.disconnected) return failure(error, 'server-unavailable')
  return { ok: true as const }
}
