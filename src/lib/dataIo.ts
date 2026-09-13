/* Export / import the whole dashboard as a JSON file (manual data safety).
   Import runs structural validation so a malformed or hand-edited backup
   can't silently corrupt the store. Zero new dependencies. */
import type { AppData } from '@/lib/types'
import { validateAppData } from './validateAppData'
export { validateAppData } from './validateAppData'
import { snapshotData } from '@/store/store'

export function exportJson(): void {
  const data = snapshotData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `premedos-backup-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Back-compat boolean wrapper (used by Settings + Drive restore). */
export function looksLikeAppData(x: unknown): x is AppData {
  return validateAppData(x).length === 0
}

export async function readJsonFile(file: File): Promise<AppData> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  const problems = validateAppData(parsed)
  if (problems.length) {
    throw new Error(`That file is not a valid Premed OS backup:\n• ${problems.slice(0, 5).join('\n• ')}`)
  }
  return parsed as AppData
}
