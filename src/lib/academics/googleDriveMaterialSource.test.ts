import { describe, expect, it } from 'vitest'
import {
  googleDriveContentIdentity, isGoogleNativeDocument, safeDriveDisplayPath,
} from './googleDriveMaterialSource'
import {
  connectionBelongsTo, materialManifestFromDriveFiles, publicGoogleDriveConnection,
} from '../../../supabase/functions/_shared/googleDriveMaterialSource'

describe('Google Drive material-source public contract', () => {
  it('uses the stable Drive file and revision identity instead of a folder path', () => {
    expect(googleDriveContentIdentity('drive-file-1', '42')).toBe('gdrive:drive-file-1:42')
    expect(googleDriveContentIdentity('drive-file-1', undefined)).toBe('gdrive:drive-file-1:revision-unavailable')
  })

  it('keeps only relative display paths suitable for the existing proposal store', () => {
    expect(safeDriveDisplayPath('BIOL 252/Week 3/notes.pdf')).toBe('BIOL 252/Week 3/notes.pdf')
    expect(safeDriveDisplayPath('/private/student/notes.pdf')).toBeUndefined()
    expect(safeDriveDisplayPath('../notes.pdf')).toBeUndefined()
  })

  it('keeps Google-native documents out of a byte-reading manifest until export is designed', () => {
    expect(isGoogleNativeDocument('application/vnd.google-apps.document')).toBe(true)
    expect(isGoogleNativeDocument('application/vnd.google-apps.folder')).toBe(false)
    expect(isGoogleNativeDocument('application/pdf')).toBe(false)
  })

  it('returns a metadata-only Drive manifest and a named recovery for native docs', () => {
    const manifest = materialManifestFromDriveFiles([
      { id: 'slide-1', name: 'slides.pdf', mimeType: 'application/pdf', version: '7', size: '24', modifiedTime: '2026-08-24T00:00:00Z', relativePath: 'Week 1/slides.pdf' },
      { id: 'doc-1', name: 'outline', mimeType: 'application/vnd.google-apps.document', version: '8', relativePath: 'Week 1/outline' },
    ])
    expect(manifest.entries).toEqual([expect.objectContaining({
      fileId: 'slide-1', displayPath: 'Week 1/slides.pdf', contentIdentity: 'gdrive:slide-1:7', sizeBytes: 24,
    })])
    expect(manifest.unavailableNativeDocuments).toEqual([
      { displayPath: 'Week 1/outline', displayName: 'outline', reason: 'native-document-unavailable' },
    ])
    expect(JSON.stringify(manifest)).not.toContain('refresh_token')
  })

  it('returns only public connection metadata and rejects another user at the server ownership boundary', () => {
    const connection = {
      id: 'connection', user_id: 'student-a', provider: 'google-drive' as const,
      folder_id: 'folder-id-123', root_label: 'GoodNotes backup', selected_at: '2026-08-24T00:00:00Z',
      last_checked_at: null, connection_state: 'connected' as const, recovery_reason: null,
    }
    expect(connectionBelongsTo(connection, 'student-a')).toBe(true)
    expect(connectionBelongsTo(connection, 'student-b')).toBe(false)
    expect(publicGoogleDriveConnection(connection)).toEqual(expect.objectContaining({
      id: 'connection', folderId: 'folder-id-123', rootLabel: 'GoodNotes backup', state: 'connected',
    }))
    expect(JSON.stringify(publicGoogleDriveConnection(connection))).not.toContain('token')
  })
})
