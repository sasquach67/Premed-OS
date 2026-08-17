/* Export / import the whole dashboard as a JSON file (manual data safety).
   Import runs structural validation so a malformed or hand-edited backup
   can't silently corrupt the store. Zero new dependencies. */
import type { AppData } from '@/lib/types'
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

/** Collections that must be arrays of objects-with-string-ids when present. */
const ARRAY_COLLECTIONS = [
  'courses', 'requirements', 'experiences', 'tasks', 'timelineMilestones', 'letters', 'stories',
  'secondaries', 'interviewQs', 'schools', 'resources', 'tips', 'focusTargets',
  'quarterlyGoals', 'advisingQs', 'notePages', 'orgs',
] as const

/** Objects that must be plain records when present. */
const OBJECT_SECTIONS = ['profile', 'goals', 'settings', 'mcat', 'meta', 'notes', 'academics'] as const

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x)
}

/** Structural validation of a backup. Returns a list of problems (empty = valid).
 *  Missing sections are fine — the store's merge backfills seed defaults.
 *  Wrong-shaped sections are NOT fine — those corrupt the store. */
export function validateAppData(x: unknown): string[] {
  if (!isRecord(x)) return ['Backup is not a JSON object.']
  const problems: string[] = []

  // must look like our data at all (same three keys the old check used)
  for (const key of ['courses', 'profile', 'settings'] as const) {
    if (!(key in x)) problems.push(`Missing required section "${key}".`)
  }

  for (const key of ARRAY_COLLECTIONS) {
    const v = x[key]
    if (v === undefined) continue
    if (!Array.isArray(v)) {
      problems.push(`Section "${key}" should be a list.`)
      continue
    }
    const bad = v.findIndex((row) => !isRecord(row) || typeof row.id !== 'string' || !row.id)
    if (bad >= 0) problems.push(`Section "${key}" row ${bad + 1} is malformed (missing string id).`)
  }

  for (const key of OBJECT_SECTIONS) {
    const v = x[key]
    if (v !== undefined && !isRecord(v)) problems.push(`Section "${key}" should be an object.`)
  }

  // spot-check nested shapes the app dereferences without guards
  const mcat = x.mcat
  if (isRecord(mcat) && mcat.attempts !== undefined && !Array.isArray(mcat.attempts)) {
    problems.push('Section "mcat.attempts" should be a list.')
  }
  const academics = x.academics
  if (isRecord(academics) && academics.classCenter !== undefined && !isRecord(academics.classCenter)) {
    problems.push('Section "academics.classCenter" should be an object.')
  }

  return problems
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
