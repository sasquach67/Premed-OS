import { describe, expect, it } from 'vitest'
import { discoverLocalFolderManifest, localFolderCapability } from './localFolderDiscovery'

describe('local selected-folder discovery', () => {
  it('explains unsupported browsers without creating any record', async () => {
    expect(localFolderCapability({})).toMatchObject({ available: false })
    await expect(discoverLocalFolderManifest({ environment: {}, fromUserGesture: true })).resolves.toMatchObject({ ok: false, reason: expect.stringContaining('does not support') })
  })

  it('requires a fresh user gesture before calling a picker', async () => {
    let calls = 0
    const environment = { showDirectoryPicker: async () => { calls += 1; throw new Error('must not run') } }
    await expect(discoverLocalFolderManifest({ environment, fromUserGesture: false })).resolves.toMatchObject({ ok: false, reason: expect.stringContaining('import button') })
    expect(calls).toBe(0)
  })

  it('returns names and metadata only for an explicitly selected folder', async () => {
    const file = { kind: 'file' as const, name: 'lecture.pdf', getFile: async () => ({ name: 'lecture.pdf', type: 'application/pdf', lastModified: 123, size: 456 }) }
    const notes = { kind: 'directory' as const, name: 'Notes', values: async function* () { yield file } }
    const root = { kind: 'directory' as const, name: 'GoodNotes backup', values: async function* () { yield notes } }
    const result = await discoverLocalFolderManifest({ environment: { showDirectoryPicker: async () => root }, fromUserGesture: true })
    expect(result).toEqual({ ok: true, rootLabel: 'GoodNotes backup', entries: [{ displayPath: 'Notes/lecture.pdf', displayName: 'lecture.pdf', mimeType: 'application/pdf', modifiedAt: 123, sizeBytes: 456 }] })
  })
})
