import type { ImportedNotebook, NotebookPackage } from './types'

/** Suggest a portable filename without changing the notebook's stored title. */
export function notebookFilename(title: string, extension: 'json' | 'zip' = 'json'): string {
  const safe = Array.from(title).map(character => character.codePointAt(0)! < 32 || character === '\u007f' || '<>:"/\\|?*'.includes(character) ? '-' : character).join('').trim().replace(/^\.+|[. ]+$/g, '')
  const encoder = new TextEncoder()
  let stem = '', bytes = 0
  for (const character of safe) {
    const size = encoder.encode(character).length
    if (bytes + size > 240) break
    stem += character; bytes += size
  }
  stem = stem.replace(/[. ]+$/g, '') || 'Notebook'
  if (/^(con|prn|aux|nul|com[1-9\u00b9\u00b2\u00b3]|lpt[1-9\u00b9\u00b2\u00b3])(?:\.|$)/i.test(stem)) stem = `_${stem}`
  return `${stem}.${extension}`
}

export function notebookPackageFilename(pkg: NotebookPackage, entryId?: string, extension: 'json' | 'zip' = 'json'): string {
  const entry = entryId === undefined ? pkg.entries[0] : pkg.entries.find(item => item.id === entryId)
  if (!entry) throw new Error('The selected notebook entry is missing.')
  return notebookFilename(entry.title, extension)
}

export function notebookExportFilename(notebook: Pick<ImportedNotebook, 'original' | 'current' | 'entryId'>, kind: 'current' | 'original' | 'backup', extension: 'json' | 'zip' = 'json'): string {
  return notebookPackageFilename(kind === 'original' ? notebook.original : notebook.current, notebook.entryId, extension)
}
