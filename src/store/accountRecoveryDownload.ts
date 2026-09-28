import { strToU8, zip } from 'fflate'
import { decodeWorkspaceStorage } from './workspaceStorageCodec'
import { accountStorageKey } from '@/lib/demoMode'
import { captureWorkspaceIdentity } from './store'
import { assertSyncSession, captureSyncSession, syncDigest } from './accountSyncSafety'
import { workspaceRecoveryRepository } from './workspaceRecoveryRepository'

/** Only this signed-in, active account's recovery records, never another account. */
export async function accountRecoveryDownload(userId: string) {
  const token = captureSyncSession(), owner = captureWorkspaceIdentity(), key = accountStorageKey(userId)
  const check = () => {
    assertSyncSession(token)
    const current = captureWorkspaceIdentity()
    if (token.id !== userId || current.key !== key || owner.key !== key || current.epoch !== owner.epoch) throw new Error('The active account changed. Reopen Settings before downloading recovery copies.')
  }
  check()
  const repository = workspaceRecoveryRepository()
  const keys = ['', ':sync-conflict:local', ':sync-conflict:cloud', ':sync-conflict:open', ':sync-conflict:open-cache', ':before-reviewed-resolution'].map(suffix => key + suffix)
  const copies = (await Promise.all(keys.map(k => repository.list(k)))).flat()
  check()
  for (const copy of copies) {
    if (!keys.includes(copy.workspaceKey) || await syncDigest(JSON.stringify(copy.stored)) !== copy.sha256) throw new Error('A recovery copy could not be verified. Nothing was changed.')
    check()
  }
  if (!copies.length) throw new Error('No saved account recovery copies are available on this browser yet.')
  const files: Record<string, Uint8Array> = {
    'README.txt': strToU8('Recovery copies from this browser. Each account.json is a full workspace copy for the existing Local data import. Review before importing: it replaces the workspace. Exact-cache.txt preserves original bytes when a copy cannot be decoded. These copies contain source references, not original image or material files. Keep your original folders. Downloading does not restore or change anything.'),
  }
  copies.forEach((copy, index) => {
    const side = copy.workspaceKey.slice(key.length).replace(/[^a-z-]/g, '') || 'device'
    const folder = `${String(index + 1).padStart(3, '0')}-${side}`
    files[`${folder}/exact-cache.txt`] = strToU8(copy.stored)
    files[`${folder}/recovery-record.json`] = strToU8(JSON.stringify(copy, null, 2))
    try {
      const decoded = JSON.parse(decodeWorkspaceStorage(copy.stored))
      if (decoded.state && typeof decoded.state === 'object') files[`${folder}/account.json`] = strToU8(JSON.stringify(decoded.state, null, 2))
    } catch { /* Exact original stays available even if this client cannot decode it. */ }
  })
  const bytes = await new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => zip(files, { level: 1 }, (error, result) => error ? reject(error) : resolve(new Uint8Array(result))))
  check()
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/zip' }))
  try { check(); const link = document.createElement('a'); link.href = url; link.download = 'premedos-account-recovery-copies.zip'; link.click() }
  finally { URL.revokeObjectURL(url) }
}
