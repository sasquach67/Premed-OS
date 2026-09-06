import { del, get, set } from 'idb-keyval'
import { supabase } from '@/lib/supabase'
import { activeWorkspaceOwner, isDemoMode } from '@/lib/demoMode'

export const MATERIAL_BUCKET = 'academic-originals'
const academicRef = (ref: string) => /^idb:\/\/academics\/[a-z-]+\/[^/]+$/.test(ref)

function ownsWorkspace(userId: string) {
  const owner = activeWorkspaceOwner()
  return !isDemoMode() && owner.kind === 'account' && owner.userId === userId
}

async function account() {
  if (!supabase || isDemoMode()) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const id = data.session?.user.id
  return id && ownsWorkspace(id) ? id : null
}

function path(userId: string, ref: string) {
  return `${userId}/${ref.slice('idb://academics/'.length)}`
}

/** Only academic originals are shared. Guest/demo and other private captures stay local. */
export async function syncAcademicOriginals(files: readonly { blobRef?: string }[], expectedUserId?: string) {
  const userId = await account()
  if (!userId || (expectedUserId && userId !== expectedUserId)) throw new Error('Sign in to the account that owns these materials to sync original files.')
  let uploaded = 0
  let missing = 0
  let available = 0
  for (const ref of new Set(files.map(file => file.blobRef).filter((ref): ref is string => Boolean(ref && academicRef(ref))))) {
    if (!ownsWorkspace(userId)) throw new Error('Your account changed. File sync stopped.')
    const key = path(userId, ref)
    const local = await get<Blob>(ref)
    if (!(local instanceof Blob)) {
      // A new browser may already have a shared original; don't download every file just to check.
      const { data, error } = await supabase!.storage.from(MATERIAL_BUCKET).exists(key)
      // Storage exists() returns its 400/404 error alongside data:false.
      // Those are missing originals, not a failed account sync.
      const status = error && 'status' in error ? Number(error.status) : undefined
      if (error && status !== 400 && status !== 404) throw new Error('Could not check original file storage. Try syncing again.')
      if (data) available += 1
      else missing += 1
      continue
    }
    if (local.size > 50 * 1024 * 1024) throw new Error('Original files must be 50 MB or smaller to sync. The original is still saved in this browser.')
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await local.arrayBuffer())), byte => byte.toString(16).padStart(2, '0')).join('')
    const marker = `academic-original-upload:${key}`
    if (await get(marker) === hash) { available += 1; continue }
    if (!ownsWorkspace(userId)) throw new Error('Your account changed. File sync stopped.')
    const { error } = await supabase!.storage.from(MATERIAL_BUCKET).upload(key, local, { upsert: true, contentType: local.type || 'application/octet-stream' })
    if (error) throw new Error('Original file sync failed. Your browser copy is safe. Check your connection and try again.')
    await set(marker, hash)
    uploaded += 1
  }
  return { uploaded, available, missing }
}

/** Downloads require the current account's private Storage policy; no public URLs are saved. */
export async function readSharedAcademicOriginal(ref: string): Promise<Blob | undefined> {
  if (!academicRef(ref)) return undefined
  const userId = await account()
  if (!userId) return undefined
  const key = path(userId, ref)
  const cacheKey = `academic-original-cache:${key}`
  let cached: Blob | undefined
  try { cached = await get<Blob>(cacheKey) } catch { /* Continue with the authenticated download. */ }
  if (cached instanceof Blob) return ownsWorkspace(userId) ? cached : undefined
  const { data, error } = await supabase!.storage.from(MATERIAL_BUCKET).download(key)
  if (!ownsWorkspace(userId)) return undefined
  if (error || !data) return undefined
  try { await set(cacheKey, data) } catch { /* A full browser cache must not prevent opening a cloud file. */ }
  return data
}

export async function removeSharedAcademicOriginal(ref: string) {
  if (!academicRef(ref)) return
  const userId = await account()
  if (!userId) return
  const key = path(userId, ref)
  const { error } = await supabase!.storage.from(MATERIAL_BUCKET).remove([key])
  if (error) throw new Error('Could not remove the shared original. Try again when connected.')
  await del(`academic-original-cache:${key}`)
  await del(`academic-original-upload:${key}`)
}
