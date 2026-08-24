import type { WatchedNotesManifestEntry } from '@/lib/academics/watchedNotes'

type DirectoryEntry = LocalDirectoryHandle | LocalFileHandle

interface LocalDirectoryHandle {
  kind: 'directory'
  name: string
  values: () => AsyncIterable<DirectoryEntry>
}

interface LocalFileHandle {
  kind: 'file'
  name: string
  getFile: () => Promise<{ name: string; type: string; lastModified: number; size: number }>
}

export interface LocalFolderPickerEnvironment {
  showDirectoryPicker?: () => Promise<LocalDirectoryHandle>
}

export interface LocalFolderCapability {
  available: boolean
  reason?: string
}

export type LocalFolderDiscoveryResult =
  | { ok: true; rootLabel: string; entries: WatchedNotesManifestEntry[] }
  | { ok: false; reason: string }

/** The browser decides capability; static Pages cannot turn this into a background watcher. */
export function localFolderCapability(environment: LocalFolderPickerEnvironment = globalThis as LocalFolderPickerEnvironment): LocalFolderCapability {
  return typeof environment.showDirectoryPicker === 'function'
    ? { available: true }
    : { available: false, reason: 'This browser does not support choosing a local folder. Add files manually instead.' }
}

async function manifestFromDirectory(directory: LocalDirectoryHandle, prefix = ''): Promise<WatchedNotesManifestEntry[]> {
  const entries: WatchedNotesManifestEntry[] = []
  for await (const entry of directory.values()) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.kind === 'directory') entries.push(...await manifestFromDirectory(entry, path))
    else {
      // `getFile` exposes metadata only here. We never call text(), arrayBuffer(),
      // upload, or persist a handle.
      const file = await entry.getFile()
      entries.push({ displayPath: path, displayName: file.name, mimeType: file.type, modifiedAt: file.lastModified, sizeBytes: file.size })
    }
  }
  return entries
}

/**
 * Must be called directly from an explicit UI gesture. A boolean is used so a
 * future UI/controller has to make that boundary visible and testable.
 */
export async function discoverLocalFolderManifest({
  environment = globalThis as LocalFolderPickerEnvironment,
  fromUserGesture,
}: {
  environment?: LocalFolderPickerEnvironment
  fromUserGesture: boolean
}): Promise<LocalFolderDiscoveryResult> {
  if (!fromUserGesture) return { ok: false, reason: 'Choose a folder from the import button to begin.' }
  const capability = localFolderCapability(environment)
  if (!capability.available || !environment.showDirectoryPicker) return { ok: false, reason: capability.reason! }
  try {
    const directory = await environment.showDirectoryPicker()
    return { ok: true, rootLabel: directory.name, entries: await manifestFromDirectory(directory) }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return { ok: false, reason: 'No folder was selected.' }
    return { ok: false, reason: 'The selected folder could not be read for a review preview.' }
  }
}
