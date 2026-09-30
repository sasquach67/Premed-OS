import { knownWorkspaceData } from '@/lib/workspaceSchema'
import type { AppData } from '@/lib/types'
import { syncContent } from './accountSyncContent'

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
      const deviceOrder = a.filter(v => right.has(v.id)).map(v => v.id)
      const cloudOrder = b.filter(v => left.has(v.id)).map(v => v.id)
      if (JSON.stringify(deviceOrder) !== JSON.stringify(cloudOrder)) differences.push({ path: `${path} (record order)`, device: short(deviceOrder), cloud: short(cloudOrder) })
      for (const id of new Set([...left.keys(), ...right.keys()])) walk(left.get(id), right.get(id), `${path}[${id}]`)
    } else differences.push({ path, device: short(a), cloud: short(b) })
  }
  walk(knownWorkspaceData(JSON.parse(comparableAccountContent(device))), knownWorkspaceData(JSON.parse(comparableAccountContent(cloud))), '')
  return differences
}


/** These V1 rules also define the optional LOCAL comparable baseline digest.
 * Future normalization changes need a new digest version. The original digest
 * and cloud payloads keep their existing contract. */
export function comparableAccountContent(data: AppData): string {
  const value = JSON.parse(syncContent(data))
  if (value.meta) { delete value.meta.lastOpenedAt; delete value.meta.recentRoutes }
  if (value.settings?.calendar) delete value.settings.calendar.lastSyncedAt
  // migrateAcademicTags derives a missing typeId from the existing type label.
  // Ignore only that redundant link when one unambiguous option proves it.
  // Running all migrations here would also rewrite real fields (e.g. topic
  // confidence), which must remain visible as authored differences.
  const types = value.academics?.assignmentTypeOptions
  if (Array.isArray(types) && Array.isArray(value.tasks)) {
    for (const task of value.tasks) {
      if (typeof task.type !== 'string' || typeof task.typeId !== 'string') continue
      const matches = types.filter((option: { name?: unknown; id?: unknown }) => typeof option.name === 'string' && option.name.trim().toLowerCase() === task.type.trim().toLowerCase())
      if (matches.length === 1 && matches[0].id === task.typeId) delete task.typeId
    }
  }
  for (const key of ['researchUpcomingItems', 'researchReminders', 'researchTimelineNotes', 'researchMemberships']) {
    if (Array.isArray(value[key]) && value[key].length === 0) delete value[key]
  }
  return JSON.stringify(value)
}

export type CopyChanges = { deviceOnly: string[]; cloudOnly: string[]; changed: boolean; opaqueOmission: boolean }
/** Full, uncapped safety classification. The bounded display diff above is never
 * used to decide a winner. Common records and their relative order stay exact. */
export function classifyAccountCopyChanges(device: AppData, cloud: AppData): CopyChanges {
  const result: CopyChanges = { deviceOnly: [], cloudOnly: [], changed: false, opaqueOmission: false }
  const record = (v: unknown): v is Record<string, unknown> & { id: string } => Boolean(v && typeof v === 'object' && typeof (v as { id?: unknown }).id === 'string')
  function walk(a: unknown, b: unknown, path: string) {
    if (JSON.stringify(a) === JSON.stringify(b)) return
    if (Array.isArray(a) && Array.isArray(b) && [...a, ...b].every(record)
      && new Set(a.map(v => v.id)).size === a.length && new Set(b.map(v => v.id)).size === b.length) {
      const left = new Map(a.map(v => [v.id, v])), right = new Map(b.map(v => [v.id, v]))
      if (JSON.stringify(a.filter(v => right.has(v.id)).map(v => v.id)) !== JSON.stringify(b.filter(v => left.has(v.id)).map(v => v.id))) result.changed = true
      for (const [id, value] of left) {
        if (!right.has(id)) { result.deviceOnly.push(`${path}[${id}]`); if (value.deletedAt || value.archivedAt) result.changed = true }
        else if (JSON.stringify(value) !== JSON.stringify(right.get(id))) { result.changed = true; walk(value, right.get(id), `${path}[${id}]`) }
      }
      for (const [id, value] of right) if (!left.has(id)) { result.cloudOnly.push(`${path}[${id}]`); if (value.deletedAt || value.archivedAt) result.changed = true }
    } else if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        const child = path ? `${path}.${key}` : key
        if (!Object.hasOwn(a, key) || !Object.hasOwn(b, key)) {
          const present = (a as Record<string, unknown>)[key] ?? (b as Record<string, unknown>)[key]
          // Same narrow empty-container compatibility as matchesSyncBaseline.
          if (!path && ['researchUpcomingItems', 'researchReminders', 'researchTimelineNotes', 'researchMemberships'].includes(key) && Array.isArray(present) && present.length === 0) continue
          const missing = Object.hasOwn(a, key) ? result.deviceOnly : result.cloudOnly
          missing.push(child)
          // notes is the existing ID -> text record map. Other missing fields
          // might be a deleted subtree, never evidence of a safe superset.
          if (path !== 'notes') result.changed = true
        } else walk((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], child)
      }
    } else result.changed = true
  }
  // Unknown sections must be equal, never treated as understood record lists.
  const left = JSON.parse(comparableAccountContent(device)), right = JSON.parse(comparableAccountContent(cloud))
  const knownLeft = knownWorkspaceData(left), knownRight = knownWorkspaceData(right)
  const opaque = (all: Record<string, unknown>, known: object) => Object.fromEntries(Object.entries(all).filter(([key]) => !Object.hasOwn(known, key)))
  if (JSON.stringify(opaque(left, knownLeft)) !== JSON.stringify(opaque(right, knownRight))) result.changed = true
  for (const key of Object.keys(left)) if (!Object.hasOwn(knownLeft, key) && !Object.hasOwn(right, key)) { result.deviceOnly.push(key); result.opaqueOmission = true }
  for (const key of Object.keys(right)) if (!Object.hasOwn(knownRight, key) && !Object.hasOwn(left, key)) { result.cloudOnly.push(key); result.opaqueOmission = true }
  walk(knownLeft, knownRight, '')
  return result
}

/** Missing records are additions only when the smaller copy is the proven
 * ancestor. Without that proof a superset could resurrect deliberate deletions. */
export function additiveAccountWinner(changes: CopyChanges, deviceIsBaseline: boolean, cloudIsBaseline: boolean): 'device' | 'cloud' | null {
  if (changes.changed) return null
  if (deviceIsBaseline && !changes.deviceOnly.length && changes.cloudOnly.length) return 'cloud'
  if (cloudIsBaseline && !changes.cloudOnly.length && changes.deviceOnly.length) return 'device'
  return null
}
