import { createStore, del, get, keys, set } from 'idb-keyval'
import { supabase } from '@/lib/supabase'
import { workspaceScopedKey, activeWorkspaceOwner, isDemoMode } from '@/lib/demoMode'
import { CACHE_BYTES, MAX_FILE_BYTES, PILOT_CLOUD_BYTES, type FolderLibrary, type FolderItem } from './model'
import { getFile, sha256, type DirectoryHandle, type Fence } from './filesystem'

const handleKey = (id: string) => workspaceScopedKey(`material-folder-handle:${id}`)
const cache = () => createStore('premed-material-preview-v1', 'previews')
type CacheEntry = { blob: Blob; accessed: number }
let cacheQueue: Promise<unknown> = Promise.resolve()
export const loadFolderHandle = (id: string) => get<DirectoryHandle>(handleKey(id))
export const saveFolderHandle = (id: string, handle: DirectoryHandle) => set(handleKey(id), handle)
export function deviceId() {
  const key = workspaceScopedKey('material-folder-device')
  try {
    let id = localStorage.getItem(key)
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id) }
    return id
  } catch { return null }
}
export async function cacheUsage() {
  let bytes = 0
  for (const key of await keys(cache())) { const entry = await get<CacheEntry>(key, cache()); bytes += entry?.blob?.size ?? 0 }
  return bytes
}
/** Only replaceable cloud previews enter this store. Originals and unsaved work never do. */
async function cacheLock<T>(work: () => Promise<T>): Promise<T> {
  return typeof navigator !== 'undefined' && navigator.locks ? navigator.locks.request('premed-material-preview-cache', work) : work()
}
export function cachePreview(key: string, blob: Blob) {
  if (blob.size > CACHE_BYTES) return Promise.resolve()
  const run = cacheQueue.then(() => cacheLock(async () => {
    const db = cache(), entries: { key: IDBValidKey; accessed: number; size: number }[] = []
    for (const k of await keys(db)) {
      const entry = await get<CacheEntry>(k, db)
      if (entry) entries.push({ key: k, accessed: entry.accessed, size: entry.blob.size })
    }
    let bytes = entries.reduce((n, entry) => n + (entry.key === key ? 0 : entry.size), 0)
    for (const entry of entries.sort((a, b) => a.accessed - b.accessed)) {
      if (bytes + blob.size <= CACHE_BYTES) break
      if (entry.key === key) continue
      await del(entry.key, db); bytes -= entry.size
    }
    await set(key, { blob, accessed: Date.now() }, db)
  }))
  cacheQueue = run.catch(() => {})
  return run
}
export async function clearPreviewCache() {
  const run = cacheQueue.then(() => cacheLock(async () => { for (const key of await keys(cache())) await del(key, cache()) }))
  cacheQueue = run.catch(() => {})
  await run
}
export async function readCachedPreview(key: string): Promise<Blob | undefined> {
  try {
    return await cacheLock(async () => {
      const entry = await get<CacheEntry>(key, cache())
      if (entry) { await set(key, { ...entry, accessed: Date.now() }, cache()); return entry.blob }
    })
  } catch { /* Preview downloads still work if the optional cache is unavailable. */ }
}
const hashPattern = /^[a-f0-9]{64}$/
export function cloudObjectPath(userId: string, hash: string) {
  if (!hashPattern.test(hash)) throw new Error('Invalid file revision.')
  return `${userId}/folder-content/${hash}`
}
export function cloudBudgetUsed(library: FolderLibrary) { return Object.values({ ...library.pendingCloudObjects, ...library.cloudObjects }).reduce((a, b) => a + b, 0) }
export async function requireCloudAccount(fence: Fence) {
  fence()
  const owner = activeWorkspaceOwner()
  if (!supabase || isDemoMode() || owner.kind !== 'account') throw new Error('Sign in to save account copies. The connected originals stay on your computer.')
  const { data, error } = await supabase.auth.getSession()
  fence()
  if (error || data.session?.user.id !== owner.userId) throw new Error('Your sign-in changed. File sync stopped.')
  return owner.userId
}
/** Content-addressed paths deduplicate repeated uploads without replacing referenced versions. */
export async function syncFolderFile(root: DirectoryHandle, item: FolderItem, library: FolderLibrary, fence: Fence, reserve: (hash: string, size: number) => Promise<void> = async () => {}) {
  if (item.kind !== 'file' || item.missing) throw new Error('This original is not available in the connected folder.')
  if (item.size > MAX_FILE_BYTES) throw new Error('Local only: this file exceeds the 50 MiB account limit.')
  const userId = await requireCloudAccount(fence)
  const file = await getFile(root, item.path)
  fence()
  if (file.size !== item.size || file.lastModified !== item.modified) throw new Error('The file changed. Refresh the folder before syncing.')
  const hash = await sha256(file), path = cloudObjectPath(userId, hash)
  fence()
  // Cap cumulative uploads for this pilot, including retained prior versions.
  if (library.cloudObjects[hash] === undefined && library.pendingCloudObjects?.[hash] === undefined && cloudBudgetUsed(library) + file.size > PILOT_CLOUD_BYTES) throw new Error('The 64 MiB pilot allowance is full. No originals were deleted or uploaded beyond it.')
  const { data: exists, error: checkError } = await supabase!.storage.from('academic-originals').exists(path)
  fence()
  const status = checkError && 'status' in checkError ? Number(checkError.status) : undefined
  if (checkError && status !== 400 && status !== 404) throw new Error('Could not check account storage. Retry when connected.')
  if (!exists) {
    await reserve(hash, file.size)
    fence()
    const { error } = await supabase!.storage.from('academic-originals').upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' })
    fence()
    if (error) {
      // Concurrent uploads of identical bytes are harmless, but verify the resulting object exists.
      const { data: nowExists, error: retryError } = await supabase!.storage.from('academic-originals').exists(path)
      fence()
      if (!nowExists || retryError) throw new Error('This file was not confirmed uploaded. The original is still in Finder; retry sync.')
    }
  }
  return { hash, size: file.size }
}
export async function downloadFolderFile(hash: string, fence: Fence) {
  const userId = await requireCloudAccount(fence), path = cloudObjectPath(userId, hash)
  const cached = await readCachedPreview(path)
  fence()
  if (cached) return cached
  const { data, error } = await supabase!.storage.from('academic-originals').download(path)
  fence()
  if (error || !data) throw new Error('Could not download this account copy. Check your connection and try again.')
  if (await sha256(data) !== hash) throw new Error('The downloaded copy did not match its recorded revision.')
  fence()
  try { await cachePreview(path, data) } catch { /* A preview works without storing another copy. */ }
  fence()
  return data
}
