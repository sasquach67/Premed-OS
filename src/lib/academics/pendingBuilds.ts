import { workspaceScopedKey } from '@/lib/demoMode'

/**
 * What the composer needs to pick a build back up.
 *
 * The job itself lives on the server, so this holds no result and no material —
 * only enough to know that this entry has a build in flight, and what to say
 * about it while it runs. Refreshing or closing the page pauses the driver;
 * reopening the entry re-enters the same job through its resume key rather than
 * starting (and paying for) a second one.
 */
export interface PendingBuild {
  phase: string
  startedAt: number
  /** Bumped on every resume so a build that keeps failing to attach is visible. */
  resumes: number
}

const PENDING_PREFIX = 'premed-os:ai-generation-pending:v1'
/** After this, an unfinished marker is stale rather than resumable: the job's
 *  own 24h expiry has long since claimed it. */
const PENDING_MAX_AGE_MS = 6 * 60 * 60 * 1000

export function pendingBuildStore(draftId: string) {
  const key = `${workspaceScopedKey(PENDING_PREFIX)}:${draftId}`
  return {
    read(): PendingBuild | null {
      if (typeof localStorage === 'undefined') return null
      try {
        const raw = localStorage.getItem(key)
        if (!raw) return null
        const value = JSON.parse(raw) as Partial<PendingBuild>
        if (typeof value?.phase !== 'string' || typeof value.startedAt !== 'number') return null
        if (Date.now() - value.startedAt > PENDING_MAX_AGE_MS) { localStorage.removeItem(key); return null }
        return { phase: value.phase, startedAt: value.startedAt, resumes: Number(value.resumes) || 0 }
      } catch {
        return null
      }
    },
    write(value: PendingBuild) {
      if (typeof localStorage === 'undefined') return
      try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* a full quota must not stop a build */ }
    },
    clear() {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key)
    },
  }
}
