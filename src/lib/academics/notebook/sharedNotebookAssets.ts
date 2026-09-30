import { supabase } from '@/lib/supabase'
import { activeWorkspaceOwner, isDemoMode } from '@/lib/demoMode'
import { cloudRequest, cloudErrorStatus, CloudRequestError } from '@/store/cloudRequest'
import { captureSyncSession } from '@/store/accountSyncSafety'
import { MATERIAL_BUCKET } from '../sharedMaterialFiles'
import { binaryDigest, workspaceAssets } from '@/lib/workspaceAssets'
import type { AppData } from '@/lib/types'
import type { NotebookAssetReader } from './visualAssets'

const validHash = (hash: string) => /^[a-f0-9]{64}$/.test(hash)
const path = (owner: string, hash: string) => `${owner}/notebook-assets/${hash}`
export type NotebookCloudTransport = {
  download(owner: string, hash: string, assertFresh: () => void | Promise<void>): Promise<Blob | undefined>
  upload(owner: string, hash: string, blob: Blob, assertFresh: () => void | Promise<void>): Promise<void>
}
const transport: NotebookCloudTransport = {
  async download(owner, hash, assertFresh) {
    try {
      const { data } = await cloudRequest(async () => {
        const result = await supabase!.storage.from(MATERIAL_BUCKET).download(path(owner, hash))
        // A missing object is handled by verified local recovery, never by overwriting.
        const status = cloudErrorStatus(result.error)
        if (result.error && (status === 400 || status === 404)) return { data: null, error: null }
        return result
      }, assertFresh)
      return data ?? undefined
    } catch (error) {
      if (!(error instanceof CloudRequestError)) throw error
      const status = error.status === undefined ? '' : ` (HTTP ${error.status})`
      throw new CloudRequestError(`Could not download notebook image ${hash.slice(0, 12)}${status}: ${error.message}`, error.retryable, { cause: error.cause, status: error.status })
    }
  },
  async upload(owner, hash, blob, assertFresh) {
    try {
      await cloudRequest(async () => {
        const result = await supabase!.storage.from(MATERIAL_BUCKET).upload(path(owner, hash), blob, { upsert: false, contentType: blob.type })
        // A retry can find an already-created object. The caller must verify its bytes.
        if (result.error && cloudErrorStatus(result.error) === 409) return { data: null, error: null }
        return result
      }, assertFresh)
    } catch (error) {
      if (!(error instanceof CloudRequestError)) throw error
      const status = error.status === undefined ? '' : ` (HTTP ${error.status})`
      throw new CloudRequestError(`Could not upload notebook image ${hash.slice(0, 12)}${status}: ${error.message}. Its local bytes were kept; sync has not finished.`, error.retryable, { cause: error.cause, status: error.status })
    }
  },
}

/** Bytes are content-addressed and verified after upload. Metadata cannot claim a missing image was synced. */
export async function syncNotebookImages(data: AppData, owner: string, reader: NotebookAssetReader, assertFresh: () => void | Promise<void>, remote: NotebookCloudTransport = transport, onProgress?: (verified: number, total: number) => void) {
  const images = workspaceAssets(data).images
  let verified = 0, stalled: CloudRequestError | undefined
  let idleTimer: ReturnType<typeof setTimeout> | undefined
  let rejectIdle!: (error: CloudRequestError) => void
  const idle = new Promise<never>((_resolve, reject) => { rejectIdle = reject })
  // Every caller needs a bound, including background sync and first-account setup.
  // A late request may finish, but it cannot acknowledge progress or start another.
  const check = async () => {
    if (stalled) throw stalled
    await assertFresh()
    if (stalled) throw stalled
  }
  const progress = () => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      stalled = new CloudRequestError('Notebook image transfer stopped making progress. Sync has not finished; check your connection and retry.', true)
      rejectIdle(stalled)
    }, 120_000)
    onProgress?.(verified, images.size)
  }
  const work = async () => {
    progress()
    for (const [hash, binding] of images) {
      await check()
      // Preserve the reader's local cache recovery, but an unreadable cache must
      // not prevent verifying an intact account original.
      let local: Blob | undefined, localFailure: unknown
      try { local = await reader.read(hash) } catch (error) { localFailure = error }
      await check()
      let cloud = await remote.download(owner, hash, check)
      await check()
      if (!cloud) {
        if (localFailure) throw localFailure
        if (!local) throw new Error(`Notebook image ${binding.assetId} is missing locally and in your account. Restore its complete notebook backup before syncing.`)
        if (local.size !== binding.byteLength || await binaryDigest(local) !== hash) throw new Error(`Notebook image ${binding.assetId} does not match its saved original. No cloud image was replaced.`)
        await check(); await remote.upload(owner, hash, new Blob([local], { type: binding.mimeType }), check); await check()
        cloud = await remote.download(owner, hash, check)
        await check()
      }
      if (!cloud || cloud.size !== binding.byteLength || await binaryDigest(cloud) !== hash) throw new Error(`The cloud copy of notebook image ${binding.assetId} could not be verified. Sync is paused; keep your complete backup.`)
      await check(); verified++
      progress()
    }
    return { verified }
  }
  try { return await Promise.race([work(), idle]) }
  finally { if (idleTimer) clearTimeout(idleTimer) }
}

/** Account ownership is rechecked across every asynchronous read before bytes reach the reader. */
export async function readSharedNotebookImage(hash: string, cache?: (blob: Blob) => Promise<void>): Promise<Blob | undefined> {
  if (!validHash(hash) || !supabase || isDemoMode()) return undefined
  const owner = activeWorkspaceOwner(), session = captureSyncSession()
  if (owner.kind !== 'account') return undefined
  const fresh = () => {
    const current = activeWorkspaceOwner(), latest = captureSyncSession()
    if (current.kind !== 'account' || current.userId !== owner.userId || latest.id !== session.id || latest.generation !== session.generation) throw new Error('Your account changed while loading an image. Reopen the notebook in its account.')
  }
  const auth = await supabase.auth.getSession(); fresh()
  if (auth.error || auth.data.session?.user.id !== owner.userId) return undefined
  const blob = await transport.download(owner.userId, hash, fresh); fresh()
  if (!blob) return undefined
  if (await binaryDigest(blob) !== hash) throw new Error('The downloaded notebook image does not match its saved source. Restore its original backup.')
  fresh()
  if (cache) { await cache(blob); fresh() }
  return blob
}
