import { Blob as NodeBlob } from 'node:buffer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), session: vi.fn(), owner: vi.fn(), demo: vi.fn(), upload: vi.fn(), download: vi.fn(), exists: vi.fn(), from: vi.fn() }))
vi.mock('idb-keyval', () => ({ get: mock.get, set: mock.set }))
vi.mock('@/lib/demoMode', () => ({ activeWorkspaceOwner: mock.owner, isDemoMode: mock.demo }))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession: mock.session }, storage: { from: mock.from } } }))
import { readSharedAcademicOriginal, syncAcademicOriginals } from './sharedMaterialFiles'
const ref = 'idb://academics/material/reading-1'

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('Blob', NodeBlob)
  mock.demo.mockReturnValue(false)
  mock.owner.mockReturnValue({ kind: 'account', userId: 'alice' })
  mock.session.mockResolvedValue({ data: { session: { user: { id: 'alice' } } } })
  mock.from.mockReturnValue({ upload: mock.upload, download: mock.download, exists: mock.exists })
  mock.upload.mockResolvedValue({ error: null })
  mock.exists.mockResolvedValue({ data: false, error: null })
})

describe('private academic originals', () => {
  it('uploads only academic files under the owning account and records successful uploads', async () => {
    mock.get.mockImplementation(async key => key === ref ? new Blob(['reading'], { type: 'text/plain' }) : undefined)
    expect(await syncAcademicOriginals([{ blobRef: ref }, { blobRef: ref }, { blobRef: 'idb://overview/capture/private' }], 'alice')).toEqual({ uploaded: 1, available: 0, missing: 0 })
    expect(mock.upload).toHaveBeenCalledWith('alice/material/reading-1', expect.any(Blob), { upsert: true, contentType: 'text/plain' })
    expect(mock.set).toHaveBeenCalledTimes(1)
  })
  it.each(['guest', 'demo', 'wrong-account'])('never uploads from a %s workspace', async mode => {
    if (mode === 'guest') mock.owner.mockReturnValue({ kind: 'guest' })
    if (mode === 'demo') mock.demo.mockReturnValue(true)
    if (mode === 'wrong-account') mock.owner.mockReturnValue({ kind: 'account', userId: 'bob' })
    await expect(syncAcademicOriginals([{ blobRef: ref }])).rejects.toThrow('Sign in')
    expect(mock.upload).not.toHaveBeenCalled()
  })
  it('does not mark failed uploads as shared', async () => {
    mock.get.mockResolvedValue(new Blob(['reading']))
    mock.upload.mockResolvedValue({ error: new Error('Offline') })
    await expect(syncAcademicOriginals([{ blobRef: ref }])).rejects.toThrow('browser copy is safe')
    expect(mock.set).not.toHaveBeenCalled()
  })
  it('reports originals absent from both this browser and the account', async () => {
    expect(await syncAcademicOriginals([{ blobRef: ref }])).toEqual({ uploaded: 0, available: 0, missing: 1 })
    expect(mock.upload).not.toHaveBeenCalled()
  })
  it('downloads an original into an account-scoped cache in a second browser', async () => {
    const original = new Blob(['reading'])
    mock.download.mockResolvedValue({ data: original, error: null })
    expect(await readSharedAcademicOriginal(ref)).toBe(original)
    expect(mock.download).toHaveBeenCalledWith('alice/material/reading-1')
    expect(mock.set).toHaveBeenCalledWith('academic-original-cache:alice/material/reading-1', original)
  })
  it('can download even if browser storage is unavailable', async () => {
    mock.get.mockRejectedValue(new Error('Storage denied'))
    mock.set.mockRejectedValue(new Error('Storage denied'))
    const original = new Blob(['reading'])
    mock.download.mockResolvedValue({ data: original, error: null })
    expect(await readSharedAcademicOriginal(ref)).toBe(original)
  })
  it('discards a download when the active account changes', async () => {
    mock.download.mockImplementation(async () => {
      mock.owner.mockReturnValue({ kind: 'account', userId: 'bob' })
      return { data: new Blob(['alice reading']), error: null }
    })
    expect(await readSharedAcademicOriginal(ref)).toBeUndefined()
    expect(mock.set).not.toHaveBeenCalled()
  })
})
