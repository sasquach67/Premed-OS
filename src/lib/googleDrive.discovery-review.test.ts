import { afterEach, expect, it, vi } from 'vitest'
import { Blob as NodeBlob } from 'node:buffer'
import * as drive from './googleDrive'
import { binaryDigest } from './workspaceAssets'

afterEach(() => { drive.disconnect(); vi.unstubAllGlobals() })

it('keeps the last verified backup discoverable after a newer upload fails readback verification', async () => {
  vi.stubGlobal('Blob', NodeBlob)
  window.google = { accounts: { oauth2: { revoke: vi.fn(), initTokenClient: config => ({ requestAccessToken: () => config.callback({ access_token: 'synthetic-review-token' }) }) } } }
  await drive.connect('synthetic-review-client')
  const good = new Blob(['previous verified backup']), corrupt = new Blob(['corrupt candidate'])
  const workspace = 'hq:app-data:account:synthetic-review', owner = await binaryDigest(new Blob([workspace])), hash = await binaryDigest(good)
  let candidateName = '', candidateExists = false
  vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input)
    if (init?.method === 'POST') {
      candidateName = JSON.parse(String(init.body)).name
      return { ok: true, headers: new Headers({ Location: 'https://www.googleapis.com/upload/drive/v3/files?upload_id=synthetic-review' }) }
    }
    if (init?.method === 'PUT') { candidateExists = true; return { ok: true, json: async () => ({ id: 'candidate' }) } }
    if (url.searchParams.get('alt') === 'media') return { ok: true, blob: async () => url.pathname.endsWith('/candidate') ? corrupt : good }
    const query = url.searchParams.get('q') ?? ''
    const matchingCandidate = candidateExists && query.includes(`name='${candidateName}'`)
    return { ok: true, json: async () => ({ files: [{ id: matchingCandidate ? 'candidate' : 'previous', name: 'premed-os-workspace-backup-v1.zip', size: String(good.size), createdTime: '2026-09-14T00:00:00Z', appProperties: { workspace: owner, status: 'verified', format: '1', sha256: hash } }] }) }
  }))
  await expect(drive.uploadCompleteBackup(new Blob(['expected new backup']), () => {}, workspace)).rejects.toThrow('integrity')
  const restored = await drive.downloadLatestBackup(workspace)
  expect(restored?.kind).toBe('complete')
  if (restored?.kind === 'complete') expect(await restored.blob.text()).toBe(await good.text())
})

it('requires choosing an earlier verified point when the latest published bytes are damaged', async () => {
  vi.stubGlobal('Blob', NodeBlob)
  window.google = { accounts: { oauth2: { revoke: vi.fn(), initTokenClient: config => ({ requestAccessToken: () => config.callback({ access_token: 'synthetic-review-token' }) }) } } }
  await drive.connect('synthetic-review-client')
  const workspace = 'hq:app-data:account:synthetic-review', owner = await binaryDigest(new Blob([workspace]))
  const good = new Blob(['previous verified backup']), hash = await binaryDigest(good)
  const requests: string[] = []
  vi.stubGlobal('fetch', vi.fn(async (input: string) => {
    requests.push(input)
    if (new URL(input).searchParams.get('alt') === 'media') return { ok: true, blob: async () => input.includes('/latest?') ? new Blob(['damaged']) : good }
    return { ok: true, json: async () => ({ files: ['latest', 'earlier'].map(id => ({ id, name: 'premed-os-workspace-backup-v1.zip', size: String(good.size), createdTime: '2026-09-14T00:00:00Z', appProperties: { workspace: owner, status: 'verified', format: '1', sha256: hash } })) }) }
  }))
  await expect(drive.downloadLatestBackup(workspace)).rejects.toThrow('Choose an earlier verified restore point')
  expect(requests.some(url => url.includes('/earlier?'))).toBe(false)
  const restored = await drive.downloadLatestBackup(workspace, 'earlier')
  expect(restored?.kind).toBe('complete')
  if (restored?.kind === 'complete') expect(await restored.blob.text()).toBe(await good.text())
  await expect(drive.downloadLatestBackup(workspace, 'different-account-id')).rejects.toThrow('no longer available for this account')
  await expect(drive.downloadLatestBackup('hq:app-data:guest', 'legacy')).rejects.toThrow('signed-in account')
})
