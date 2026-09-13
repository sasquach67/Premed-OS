import type { AppData } from '@/lib/types'
import { validateAppData } from '@/lib/validateAppData'
import { workspaceRecoveryRepository } from './workspaceRecoveryRepository'

export type DetachedWorkspace = { key: string; data: AppData; raw: string | null }
const retained = new Map<string, DetachedWorkspace>()
const listeners = new Set<() => void>()
const recoveryKey = (key: string) => `${key}:unsaved-before-workspace-switch`
async function digest(stored: string) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(stored))))].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Retain immediately before hiding an outgoing workspace on an auth event.
 * This copy is never adopted automatically or exposed to another account. */
export function retainOutgoingWorkspace(key: string, data: AppData, raw: string | null) {
  const copy = { key, data: structuredClone(data), raw }
  retained.set(key, copy)
  listeners.forEach(fn => fn())
  void (async () => {
    const stored = JSON.stringify(copy), workspaceKey = recoveryKey(key)
    const snapshot = { format: 'premed-os-workspace-recovery' as const, version: 1 as const, workspaceKey, id: crypto.randomUUID(), createdAt: Date.now(), stored, sha256: await digest(stored) }
    const repository = workspaceRecoveryRepository()
    await repository.save(snapshot)
    const verified = await repository.read(workspaceKey, snapshot.id)
    if (!verified || verified.stored !== stored || verified.sha256 !== snapshot.sha256) throw new Error('Outgoing workspace recovery was not verified.')
  })().catch(() => { /* Keep the exact open copy in this tab for the returning owner. */ })
}
export function hasRetainedOutgoingWorkspace() { return retained.size > 0 }
export function subscribeOutgoingWorkspace(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
export async function readOutgoingWorkspace(key: string): Promise<DetachedWorkspace | null> {
  const memory = retained.get(key)
  if (memory) return memory
  const saved = await workspaceRecoveryRepository().latest(recoveryKey(key))
  if (!saved) return null
  if (saved.workspaceKey !== recoveryKey(key) || await digest(saved.stored) !== saved.sha256) throw new Error('An outgoing workspace recovery copy could not be verified. Sync remains paused.')
  const value = JSON.parse(saved.stored) as DetachedWorkspace
  if (value.key !== key || validateAppData(value.data).length || (value.raw !== null && typeof value.raw !== 'string')) throw new Error('The outgoing workspace recovery copy has an invalid structure. Sync remains paused.')
  return value
}
