import type { DirectoryHandle } from '../materialFolder/filesystem'
import { readNotebookZip } from './notebookZip'

/** Write only the verified app-export members into a new, non-overwriting folder. */
export async function saveNotebookBundleFolder(bundle: Blob, parent: DirectoryHandle, title: string, fence: () => void = () => {}) {
  const members = await readNotebookZip(bundle)
  fence()
  let name: string
  for (let suffix = 0; ; suffix++) {
    name = suffix ? `${title} (${suffix + 1})` : title
    try { await parent.getDirectoryHandle(name) }
    catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') break
      if (!(error instanceof DOMException && error.name === 'TypeMismatchError')) throw error
    }
    if (suffix >= 999) throw new Error('Choose another destination folder; too many copies already exist.')
  }
  fence()
  const folder = await parent.getDirectoryHandle(name, { create: true })
  // Catch a folder created by another process between the name check and creation.
  for await (const _ of folder.values()) { void _; throw new Error('This folder already has files. Choose another destination.') }
  try {
    for (const [path, bytes] of members) {
      fence()
      const parts = path.split('/'), filename = parts.pop()!
      let directory = folder
      for (const part of parts) directory = await directory.getDirectoryHandle(part, { create: true })
      try { await directory.getFileHandle(filename); throw new Error('A destination file already exists.') }
      catch (error) { if (!(error instanceof DOMException && error.name === 'NotFoundError')) throw error }
      fence()
      const file = await directory.getFileHandle(filename, { create: true }), writer = await file.createWritable()
      try { await writer.write(new Blob([bytes.slice().buffer])); fence(); await writer.close() }
      catch (error) { await writer.abort?.(); throw error }
      const saved = new Uint8Array(await (await file.getFile()).arrayBuffer())
      if (saved.length !== bytes.length || saved.some((value, index) => value !== bytes[index])) throw new Error('A saved file could not be verified.')
    }
    fence()
    return name
  } catch (error) {
    throw new Error(`The folder “${name}” is incomplete. Keep it separate and try again. ${error instanceof Error ? error.message : 'The files could not be saved.'}`, { cause: error })
  }
}
