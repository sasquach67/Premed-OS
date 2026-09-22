import { getFile, operations, remapItems, scanFolder, sha256, type DirectoryHandle, type Fence } from './filesystem'
import type { FolderItem, FolderLibrary } from './model'

/** Folder enumeration and JSONB field order do not represent file changes. */
export function sameFolderItems(left: FolderItem[], right: FolderItem[]) {
  if (left.length !== right.length) return false
  const byId = new Map(left.map(item => [item.id, item]))
  if (byId.size !== left.length || new Set(right.map(item => item.id)).size !== right.length) return false
  return right.every(item => {
    const previous = byId.get(item.id)
    return previous && Object.keys({ ...previous, ...item }).every(key => previous[key as keyof FolderItem] === item[key as keyof FolderItem])
  })
}

/** Read-only preparation. A stopped read can never return a partial catalog for saving. */
export async function readFolderCatalog(root: DirectoryHandle, before: FolderLibrary, fence: Fence, options: { signal?: AbortSignal; onProgress?: (message: string) => void } = {}) {
  let stopped: Error | undefined, timer: ReturnType<typeof setTimeout> | undefined
  let rejectStop!: (error: Error) => void
  const stopPromise = new Promise<never>((_, reject) => { rejectStop = reject })
  const stop = (error: Error) => { if (!stopped) { stopped = error; rejectStop(error) } }
  const cancel = () => stop(new Error('Folder scan stopped. Your saved file list was kept.'))
  const check = () => { if (stopped) throw stopped; fence() }
  const stage = (message: string) => {
    check()
    clearTimeout(timer)
    timer = setTimeout(() => stop(new Error(`Folder scan stopped: ${message}. The browser did not respond for 30 seconds. Your saved file list was kept. Check that the folder is available in Finder, then try Refresh.`)), 30_000)
    options.onProgress?.(message)
  }
  options.signal?.addEventListener('abort', cancel, { once: true })
  if (options.signal?.aborted) cancel()
  const read = async () => {
    stage('Reading folder history')
    const log = await operations(root)
    check()
    let previous = before.items
    const applied = new Set(before.appliedOperations ?? [])
    for (const op of [...log].sort((a, b) => a.at - b.at)) if (op.phase === 'done' && !applied.has(op.id)) {
      previous = remapItems(previous, op)
      if (op.kind !== 'trash') for (const file of op.files) {
        const original = previous.find(item => item.path === file.to)
        if (!original) continue
        stage(`Checking moved file ${file.to}`)
        try {
          const copied = await getFile(root, file.to)
          check()
          if (await sha256(copied) === file.hash) previous = previous.map(item => item.id === original.id ? { ...item, modified: copied.lastModified, size: copied.size, hash: file.hash, cloudHash: item.cloudHash === file.hash ? item.cloudHash : undefined } : item)
        } catch { /* External changes remain missing or unsynced after scanning. */ }
        check()
      }
      applied.add(op.id)
    }
    const items = await scanFolder(root, previous, check, (count, path) => stage(`Reading folder · ${count} ${count === 1 ? 'item' : 'items'} checked · ${path || root.name}`))
    check()
    return { log, items, appliedOperations: [...applied] }
  }
  try { return await Promise.race([read(), stopPromise]) }
  finally { clearTimeout(timer); options.signal?.removeEventListener('abort', cancel) }
}
