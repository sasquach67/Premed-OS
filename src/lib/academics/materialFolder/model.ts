/** Portable catalog only. File bytes, filesystem handles and machine paths never enter app state. */
export interface FolderItem {
  id: string
  path: string
  kind: 'file' | 'directory'
  size: number
  modified: number
  category: string
  categoryConfirmed?: boolean
  missing?: boolean
  trashed?: boolean
  hash?: string
  cloudHash?: string
  cloudSize?: number
}
export interface FolderLibrary {
  id: string
  label: string
  writerDevice: string
  items: FolderItem[]
  updatedAt: number
  /** Confirmed uploaded objects, including earlier revisions. Bounds cumulative pilot uploads. */
  cloudObjects: Record<string, number>
  /** Reserved before uploading so interruptions cannot bypass the pilot allowance. */
  pendingCloudObjects?: Record<string, number>
  appliedOperations?: string[]
}
export const MAX_FILE_BYTES = 50 * 1024 * 1024
export const PILOT_CLOUD_BYTES = 64 * 1024 * 1024
export const CACHE_BYTES = 32 * 1024 * 1024
export const MAX_ITEMS = 5000
export const PAGE_SIZE = 50
export const EXCLUDED_NAMES = new Set(['tmp', 'temp', 'work', 'archive', 'archives', 'previous versions', 'node_modules', '__pycache__', 'canvas export', 'audits'])
export function excluded(name: string) { return name.startsWith('.') || EXCLUDED_NAMES.has(name.toLowerCase()) }
export function folderPath(path: string) { return path.slice(0, Math.max(0, path.lastIndexOf('/'))) }
export function fileName(path: string) { return path.split('/').at(-1)! }
export function joinPath(parent: string, name: string) { return parent ? `${parent}/${name}` : name }
export function validateName(name: string) {
  if (!name.trim() || name !== name.trim() || /[\\/:*?"<>|]/.test(name) || [...name].some(char => char.charCodeAt(0) < 32) || /[. ]$/.test(name) || name.startsWith('.') || /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(name)) throw new Error('Use a normal file name without slashes, reserved characters, or a leading dot.')
  return name
}
export function validatePath(path: string, internal = false) {
  if (!path || path.startsWith('/') || path.includes('\\')) throw new Error('Invalid folder-relative path.')
  for (const [i, part] of path.split('/').entries()) {
    if (internal && i === 0 && part === '.premedos') continue
    validateName(part)
  }
  return path
}
export function detectCategory(path: string) {
  const value = path.toLowerCase().replace(/[_-]/g, ' ')
  if (/\.apkg$/i.test(path)) return 'Flashcards'
  if (/syllabus/.test(value)) return 'Syllabus'
  if (/rubric/.test(value)) return 'Rubric'
  if (/worksheet|\bgrq\b|guided reading question/.test(value)) return 'Worksheet'
  if (/homework|assignment|problem set/.test(value)) return 'Homework'
  if (/outline/.test(value)) return 'Outline'
  if (/transcript|caption/.test(value)) return 'Transcript'
  if (/lecture|slides/.test(value) && /\.(pdf|pptx?)$/i.test(path)) return 'Slides'
  if (/textbook|reading/.test(value)) return 'Reading'
  if (/notebook/.test(value)) return 'Notebook'
  if (/exam|quiz/.test(value)) return 'Assessment'
  if (/lab|toolkit/.test(value)) return 'Lab material'
  if (/note/.test(value)) return 'Notes'
  return 'Other'
}
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KiB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MiB`
}
export function immediateItems(items: FolderItem[], parent: string, query = '', category = '') {
  return items.filter(item => (query ? item.path.toLowerCase().includes(query.toLowerCase()) : folderPath(item.path) === parent) && (!category || item.category === category))
    .sort((a, b) => a.kind === b.kind ? a.path.localeCompare(b.path, undefined, { numeric: true }) : a.kind === 'directory' ? -1 : 1)
}
/** Package internals retain their names and relative references. Move the enclosing folder instead. */
export function packageRoot(items: FolderItem[], path: string): string | undefined {
  return items.filter(item => item.kind === 'file' && /(^|\/)notebook\.json$/i.test(item.path))
    .map(item => folderPath(item.path)).find(root => root && path.startsWith(root + '/'))
}
