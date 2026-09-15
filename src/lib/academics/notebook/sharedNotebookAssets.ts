import { supabase } from '@/lib/supabase'
import { activeWorkspaceOwner, isDemoMode } from '@/lib/demoMode'
import { captureSyncSession } from '@/store/accountSyncSafety'
import { MATERIAL_BUCKET } from '../sharedMaterialFiles'
import { binaryDigest, workspaceAssets } from '@/lib/workspaceAssets'
import type { AppData } from '@/lib/types'
import type { NotebookAssetReader } from './visualAssets'

const validHash = (hash: string) => /^[a-f0-9]{64}$/.test(hash)
const path = (owner: string, hash: string) => `${owner}/notebook-assets/${hash}`
export type NotebookCloudTransport = {
  download(owner: string, hash: string): Promise<Blob | undefined>
  upload(owner: string, hash: string, blob: Blob): Promise<void>
}
const transport: NotebookCloudTransport = {
  async download(owner, hash) {
    const { data, error } = await supabase!.storage.from(MATERIAL_BUCKET).download(path(owner, hash))
    if (error) {
      const status = Number(error.statusCode)
      if ([400, 404].includes(status)) return undefined
      throw new Error('Could not download a notebook image. Check your connection and try again.')
    }
    return data ?? undefined
  },
  async upload(owner, hash, blob) {
    const { error } = await supabase!.storage.from(MATERIAL_BUCKET).upload(path(owner, hash), blob, { upsert: false, contentType: blob.type })
    if (error && Number(error.statusCode) !== 409) throw new Error('Notebook image upload failed. Its local bytes were kept; sync has not finished.')
  },
}

/** Bytes are content-addressed and verified after upload. Metadata cannot claim a missing image was synced. */
export async function syncNotebookImages(data: AppData, owner: string, reader: NotebookAssetReader, assertFresh: () => void | Promise<void>, remote: NotebookCloudTransport = transport) {
  const images = workspaceAssets(data).images
  let verified = 0
  for (const [hash, binding] of images) {
    await assertFresh()
    const local = await reader.read(hash)
    await assertFresh()
    let cloud = await remote.download(owner, hash)
    await assertFresh()
    if (!cloud) {
      if (!local) throw new Error(`Notebook image ${binding.assetId} is missing locally and in your account. Restore its complete notebook backup before syncing.`)
      if (local.size !== binding.byteLength || await binaryDigest(local) !== hash) throw new Error(`Notebook image ${binding.assetId} does not match its saved original. No cloud image was replaced.`)
      await assertFresh(); await remote.upload(owner, hash, new Blob([local], { type: binding.mimeType })); await assertFresh()
      cloud = await remote.download(owner, hash)
      await assertFresh()
    }
    if (!cloud || cloud.size !== binding.byteLength || await binaryDigest(cloud) !== hash) throw new Error(`The cloud copy of notebook image ${binding.assetId} could not be verified. Sync is paused; keep your complete backup.`)
    await assertFresh(); verified++
  }
  return { verified }
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
  const blob = await transport.download(owner.userId, hash); fresh()
  if (!blob) return undefined
  if (await binaryDigest(blob) !== hash) throw new Error('The downloaded notebook image does not match its saved source. Restore its original backup.')
  fresh()
  if (cache) { await cache(blob); fresh() }
  return blob
}
