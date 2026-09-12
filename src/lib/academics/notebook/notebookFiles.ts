import type { NamedNotebookImage } from './visualAssets'
import type { NotebookAsset } from './visualTypes'

export type NotebookFileCollection = { files: NamedNotebookImage[]; json: NamedNotebookImage[]; images: NamedNotebookImage[]; other: NamedNotebookImage[]; auxiliary: NamedNotebookImage[] }
const compare = (a: NamedNotebookImage, b: NamedNotebookImage) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0
export function assertNotebookRelativePath(path: string, directory = false) {
  const value = directory && path.endsWith('/') ? path.slice(0, -1) : path
  if (!value || value.length > 1024 || /[\\:]/.test(value) || [...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) || value.split('/').some(part => !part || part === '.' || part === '..')) throw new Error(`Unsafe notebook file path: ${path}. Choose a folder or ZIP with ordinary relative file paths.`)
}
export function collectNotebookFiles(files: NamedNotebookImage[]): NotebookFileCollection {
  const names = new Set<string>()
  for (const file of files) { assertNotebookRelativePath(file.name); if (names.has(file.name)) throw new Error(`Duplicate file path ${file.name}. Keep one exact file at each path.`); names.add(file.name) }
  const sorted = [...files].sort(compare)
  return { files: sorted, json: sorted.filter(f => /\.json$/i.test(f.name)), images: sorted.filter(f => /\.(png|jpe?g)$/i.test(f.name)), other: sorted.filter(f => !/\.(json|png|jpe?g)$/i.test(f.name)), auxiliary: [] }
}
export function collectNotebookFolder(files: readonly File[]): NotebookFileCollection {
  return collectNotebookFiles(files.map(blob => {
    const path = blob.webkitRelativePath || blob.name
    assertNotebookRelativePath(path)
    return { name: blob.webkitRelativePath ? path.split('/').slice(1).join('/') : path, blob }
  }))
}
export type NotebookImageMatch = { asset: NotebookAsset; candidates: NamedNotebookImage[]; file?: NamedNotebookImage; explicit: boolean }
/** Case-sensitive matching. A basename shared by multiple files or declarations
 * always needs an explicit choice; no original/rendered substitution is guessed. */
export function matchNotebookImages(assets: readonly NotebookAsset[], files: NamedNotebookImage[], mapped: ReadonlyMap<string, Blob> = new Map()): NotebookImageMatch[] {
  return assets.map(asset => {
    const candidates = files.filter(file => asset.fileName.includes('/') ? file.name === asset.fileName : file.name.split('/').at(-1) === asset.fileName)
    const chosen = mapped.get(asset.id)
    return { asset, candidates, explicit: Boolean(chosen), file: chosen ? files.find(file => file.blob === chosen) ?? { name: chosen instanceof File ? chosen.name : asset.fileName, blob: chosen } : candidates.length === 1 && assets.filter(a => a.fileName === asset.fileName).length === 1 ? candidates[0] : undefined }
  })
}
