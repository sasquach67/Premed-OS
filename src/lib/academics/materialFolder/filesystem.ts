import { excluded, fileName, folderPath, joinPath, MAX_FILE_BYTES, MAX_ITEMS, validateName, validatePath, detectCategory, type FolderItem } from './model'

export interface FileHandle {
  kind: 'file'; name: string
  getFile(): Promise<File>
  createWritable(): Promise<{ write(data: Blob | string): Promise<void>; close(): Promise<void>; abort?(): Promise<void> }>
}
export interface DirectoryHandle {
  kind: 'directory'; name: string
  values(): AsyncIterable<DirectoryHandle | FileHandle>
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<DirectoryHandle>
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileHandle>
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>
  queryPermission(options: { mode: 'read' | 'readwrite' }): Promise<PermissionState>
  requestPermission(options: { mode: 'read' | 'readwrite' }): Promise<PermissionState>
  isSameEntry?(other: DirectoryHandle): Promise<boolean>
}
export type Fence = () => void
export const folderPicker = () => (globalThis as unknown as { showDirectoryPicker?: (options: { mode: string }) => Promise<DirectoryHandle> }).showDirectoryPicker
export async function directory(root: DirectoryHandle, path: string, create = false) {
  let current = root
  if (path) {
    validatePath(path, true)
    for (const name of path.split('/')) current = await current.getDirectoryHandle(name, { create })
  }
  return current
}
export async function getFile(root: DirectoryHandle, path: string) {
  validatePath(path, true)
  return (await (await directory(root, folderPath(path))).getFileHandle(fileName(path))).getFile()
}
export async function permission(root: DirectoryHandle, write = false, request = false) {
  const mode = write ? 'readwrite' : 'read'
  if (await root.queryPermission({ mode }) === 'granted') return true
  return request && await root.requestPermission({ mode }) === 'granted'
}
export async function sha256(file: Blob) {
  if (file.size > MAX_FILE_BYTES) throw new Error('This pilot can copy or sync files up to 50 MiB. Larger originals stay in your folder.')
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())), b => b.toString(16).padStart(2, '0')).join('')
}
/** Reads metadata only, never document contents. Failure leaves the previous catalog untouched. */
export async function scanFolder(root: DirectoryHandle, previous: FolderItem[] = [], fence: Fence = () => {}) {
  const found: FolderItem[] = [], previousByPath = new Map(previous.map(item => [item.path, item]))
  async function visit(dir: DirectoryHandle, prefix: string, depth: number) {
    if (depth > 20) throw new Error('This folder is too deeply nested for the pilot. Choose a lesson folder.')
    for await (const handle of dir.values()) {
      fence()
      if (excluded(handle.name)) continue
      const path = joinPath(prefix, handle.name), old = previousByPath.get(path)
      validatePath(path)
      if (found.length >= MAX_ITEMS) throw new Error('Choose a smaller folder for the pilot (up to 5,000 items).')
      const file = handle.kind === 'file' ? await handle.getFile() : null
      fence()
      const unchanged = old && old.kind === handle.kind && old.size === (file?.size ?? 0) && old.modified === (file?.lastModified ?? 0)
      found.push({ id: old?.id ?? crypto.randomUUID(), path, kind: handle.kind, size: file?.size ?? 0, modified: file?.lastModified ?? 0, category: old?.categoryConfirmed ? old.category : detectCategory(path), categoryConfirmed: old?.categoryConfirmed, ...(unchanged ? { hash: old.hash, cloudHash: old.cloudHash, cloudSize: old.cloudSize } : {}) })
      if (handle.kind === 'directory') await visit(handle, path, depth + 1)
    }
  }
  await visit(root, '', 0)
  const paths = new Set(found.map(item => item.path))
  return [...found, ...previous.filter(item => !paths.has(item.path)).map(item => ({ ...item, missing: true }))]
}
async function exists(root: DirectoryHandle, path: string) {
  // Ask the filesystem itself, including its case/unicode equivalence rules.
  // Comparing directory-entry strings can miss an existing name on macOS/Windows.
  try { await (await directory(root, folderPath(path))).getFileHandle(fileName(path)); return true }
  catch (e) {
    if (e instanceof DOMException && e.name === 'TypeMismatchError') return true
    if (e instanceof DOMException && e.name === 'NotFoundError') return false
    throw e
  }
}
export interface MoveOperation {
  id: string; kind: 'move' | 'trash' | 'restore'; phase: 'prepared' | 'copied' | 'done' | 'cancelled'; at: number
  moves: { from: string; to: string; directory: boolean }[]
  files: { from: string; to: string; hash: string }[]
  directories: string[]
  restoredBy?: string
}
async function writeJournal(root: DirectoryHandle, operation: MoveOperation, fence: Fence) {
  fence()
  const dir = await directory(root, '.premedos/operations', true)
  fence()
  const writer = await (await dir.getFileHandle(operation.id + '.json', { create: true })).createWritable()
  try { fence(); await writer.write(JSON.stringify(operation)); fence(); await writer.close() }
  catch (error) { await writer.abort?.(); throw error }
}
function validateMoveLocations(from: string, to: string, kind: MoveOperation['kind']) {
  validatePath(from, kind === 'restore'); validatePath(to, kind === 'trash')
  if ((kind === 'restore' && !from.startsWith('.premedos/Trash/')) || (kind === 'trash' && !to.startsWith('.premedos/Trash/'))) throw new Error('Invalid Trash location.')
}
/** Journals are disk input. Validate every path before allowing a recovery to touch files. */
export async function operations(root: DirectoryHandle): Promise<MoveOperation[]> {
  let dir: DirectoryHandle
  try { dir = await directory(root, '.premedos/operations') }
  catch (error) { if (error instanceof DOMException && error.name === 'NotFoundError') return []; throw error }
  const result: MoveOperation[] = []
  for await (const handle of dir.values()) {
    if (handle.kind !== 'file' || !handle.name.endsWith('.json')) continue
    const file = await handle.getFile()
    if (file.size > 2 * 1024 * 1024) throw new Error('An operation record is too large. Review the .premedos folder before continuing.')
    const op = JSON.parse(await file.text()) as MoveOperation
    if (!/^[a-f0-9-]{36}$/.test(op.id) || handle.name !== `${op.id}.json` || !['move', 'trash', 'restore'].includes(op.kind) || !['prepared', 'copied', 'done', 'cancelled'].includes(op.phase) || !Array.isArray(op.moves) || !Array.isArray(op.files) || !Array.isArray(op.directories)) throw new Error('An operation record needs review.')
    if (!op.moves.length || !Number.isFinite(op.at) || op.files.length + op.directories.length > MAX_ITEMS || op.moves.some(m => typeof m.directory !== 'boolean')) throw new Error('Invalid operation record.')
    for (const move of op.moves) { validateMoveLocations(move.from, move.to, op.kind); if (move.from === move.to || move.to.startsWith(move.from + '/')) throw new Error('Invalid operation location.') }
    for (const entry of op.files) {
      if (!/^[a-f0-9]{64}$/.test(entry.hash) || !op.moves.some(m => (entry.from === m.from || (m.directory && entry.from.startsWith(m.from + '/'))) && entry.to === m.to + entry.from.slice(m.from.length))) throw new Error('Invalid operation file mapping.')
      validatePath(entry.from, true); validatePath(entry.to, true)
    }
    for (const path of op.directories) { validatePath(path, true); if (!op.moves.some(m => m.directory && (path === m.to || path.startsWith(m.to + '/')))) throw new Error('Invalid operation directory mapping.') }
    result.push(op)
  }
  return result.sort((a, b) => b.at - a.at)
}
async function collect(root: DirectoryHandle, from: string, to: string, op: MoveOperation, fence: Fence) {
  fence()
  const parent = await directory(root, folderPath(from))
  const children: (DirectoryHandle | FileHandle)[] = []
  for await (const handle of parent.values()) if (handle.name === fileName(from)) children.push(handle)
  if (!children.length) throw new Error('This file is no longer in the connected folder. Refresh first.')
  async function visit(handle: DirectoryHandle | FileHandle, src: string, dst: string, depth = 0) {
    fence()
    if (depth > 20 || op.files.length + op.directories.length >= MAX_ITEMS) throw new Error('Choose fewer files for this operation.')
    if (handle.kind === 'directory') {
      op.directories.push(dst)
      for await (const child of handle.values()) {
        if (child.name === '.DS_Store') continue
        validateName(child.name)
        await visit(child, joinPath(src, child.name), joinPath(dst, child.name), depth + 1)
      }
    } else op.files.push({ from: src, to: dst, hash: await sha256(await handle.getFile()) })
  }
  await visit(children[0], from, to)
  return children[0].kind === 'directory'
}
/** No source is removed until every destination byte is verified. Resume only if copies still match. */
export async function finishMove(root: DirectoryHandle, op: MoveOperation, fence: Fence) {
  if (op.phase === 'done' || op.phase === 'cancelled') return op
  for (const path of op.directories) { fence(); await directory(root, path, true) }
  for (const entry of op.files) {
    fence()
    if (await exists(root, entry.to)) {
      if (await sha256(await getFile(root, entry.to)) !== entry.hash) throw new Error('A destination changed. Both copies were kept; review them before retrying.')
      continue
    }
    if (op.phase === 'copied') throw new Error('A verified destination is missing. Original files were kept where still present.')
    const source = await getFile(root, entry.from)
    if (await sha256(source) !== entry.hash) throw new Error('A source changed during the move. Original files were kept.')
    fence()
    const handle = await (await directory(root, folderPath(entry.to), true)).getFileHandle(fileName(entry.to), { create: true })
    const writer = await handle.createWritable()
    try { fence(); await writer.write(source); fence(); await writer.close() }
    catch (error) { await writer.abort?.(); throw error }
    if (await sha256(await handle.getFile()) !== entry.hash) throw new Error('Copy verification failed. Original files were kept.')
  }
  op.phase = 'copied'; await writeJournal(root, op, fence)
  for (const move of op.moves) {
    fence()
    if (!await exists(root, move.from)) continue
    // Re-enumerate to catch files added or changed in Finder while the copy ran.
    const current: MoveOperation = { ...op, files: [], directories: [] }
    await collect(root, move.from, move.to, current, fence)
    const expected = op.files.filter(f => f.from === move.from || f.from.startsWith(move.from + '/'))
    if (current.directories.length !== op.directories.filter(p => p === move.to || p.startsWith(move.to + '/')).length || current.files.length !== expected.length || current.files.some(f => !expected.some(e => e.from === f.from && e.hash === f.hash))) throw new Error('The source folder changed. Both copies were kept.')
    for (const entry of expected) if (await sha256(await getFile(root, entry.to)) !== entry.hash) throw new Error('The destination changed. Original files were kept.')
    fence()
    await (await directory(root, folderPath(move.from))).removeEntry(fileName(move.from), { recursive: move.directory })
  }
  op.phase = 'done'; await writeJournal(root, op, fence)
  return op
}
export async function moveEntries(root: DirectoryHandle, moves: { from: string; to: string }[], kind: MoveOperation['kind'], fence: Fence) {
  if ((await operations(root)).some(op => op.phase === 'prepared' || op.phase === 'copied')) throw new Error('Finish the interrupted file operation before starting another.')
  const op: MoveOperation = { id: crypto.randomUUID(), kind, phase: 'prepared', at: Date.now(), moves: [], files: [], directories: [] }
  for (const [i, move] of moves.entries()) {
    validateMoveLocations(move.from, move.to, kind)
    if (move.from === move.to || move.to.startsWith(move.from + '/') || moves.some((other, j) => j !== i && (move.from.startsWith(other.from + '/') || move.to === other.to))) throw new Error('Choose separate items and a different destination folder.')
    if (await exists(root, move.to)) throw new Error(`“${fileName(move.to)}” already exists. Choose a different name or folder.`)
    const isDirectory = await collect(root, move.from, move.to, op, fence)
    op.moves.push({ ...move, directory: isDirectory })
  }
  if (!moves.length) throw new Error('Select a file or folder first.')
  await writeJournal(root, op, fence)
  return finishMove(root, op, fence)
}
export async function createFolder(root: DirectoryHandle, path: string, fence: Fence) {
  validatePath(path)
  if (await exists(root, path)) throw new Error('That name already exists.')
  fence(); await directory(root, path, true)
}
export function remapItems(items: FolderItem[], operation: MoveOperation) {
  return items.map(item => {
    const move = operation.moves.find(m => item.path === m.from || item.path.startsWith(m.from + '/'))
    if (operation.kind === 'restore' && operation.moves.some(m => item.path === m.to || item.path.startsWith(m.to + '/'))) return { ...item, missing: false, trashed: false }
    if (!move) return item
    if (operation.kind === 'trash') return { ...item, missing: true, trashed: true }
    return { ...item, path: move.to + item.path.slice(move.from.length) }
  })
}

export async function bindFolder(root: DirectoryHandle, id: string, fence: Fence) {
  try {
    const saved = JSON.parse(await (await getFile(root, '.premedos/library.json')).text())
    if (saved.id !== id) throw new Error('This folder is already connected to a different library. Keep using its existing connection.')
    return
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'NotFoundError')) throw error
  }
  fence()
  const handle = await (await directory(root, '.premedos', true)).getFileHandle('library.json', { create: true })
  const writer = await handle.createWritable()
  try { fence(); await writer.write(JSON.stringify({ id, version: 1 })); fence(); await writer.close() }
  catch (error) { await writer.abort?.(); throw error }
}

/** Cancelling never deletes the destination. Only stop when every original still matches. */
export async function cancelMove(root: DirectoryHandle, op: MoveOperation, fence: Fence) {
  for (const move of op.moves) if (!await exists(root, move.from)) throw new Error('Some originals have already moved. Use Check and resume to finish safely.')
  for (const item of op.files) { fence(); if (await sha256(await getFile(root, item.from)) !== item.hash) throw new Error('An original changed. Review the copies in Finder before continuing.') }
  op.phase = 'cancelled'
  await writeJournal(root, op, fence)
}
