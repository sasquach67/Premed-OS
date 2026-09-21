import type { AppData } from '@/lib/types'
import { syncContent } from './accountSyncSafety'

type Difference = { path: string; device: string; cloud: string }
const short = (value: unknown) => value === undefined ? 'Not present' : JSON.stringify(value).slice(0, 240)
/** Bounded display; the downloadable copies remain the complete record. */
export function compareAccountCopies(device: AppData, cloud: AppData) {
  const differences: Difference[] = []
  function walk(a: unknown, b: unknown, path: string) {
    if (differences.length >= 60 || JSON.stringify(a) === JSON.stringify(b)) return
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      const left = a as Record<string, unknown>, right = b as Record<string, unknown>
      for (const key of new Set([...Object.keys(left), ...Object.keys(right)])) walk(left[key], right[key], path ? `${path}.${key}` : key)
    } else if (Array.isArray(a) && Array.isArray(b) && [...a, ...b].every(v => v && typeof v === 'object' && typeof v.id === 'string') && new Set(a.map(v => v.id)).size === a.length && new Set(b.map(v => v.id)).size === b.length) {
      const left = new Map(a.map(v => [v.id, v])), right = new Map(b.map(v => [v.id, v]))
      for (const id of new Set([...left.keys(), ...right.keys()])) walk(left.get(id), right.get(id), `${path}[${id}]`)
    } else differences.push({ path, device: short(a), cloud: short(b) })
  }
  walk(JSON.parse(syncContent(device)), JSON.parse(syncContent(cloud)), '')
  return differences
}

