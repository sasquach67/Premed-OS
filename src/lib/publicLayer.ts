/* ============================================================
   publicLayer.ts — the small amount of state the public layer owns.

   Two facts, and they live OUTSIDE the persisted data tree (same
   discipline as `premed_hq_cloud_meta` in useCloudSync): writing them
   must never look like a data edit and trigger a sync push.

     1. Has this visitor gone through the front door? `/` shows the
        landing page to a first-time visitor and the dashboard to
        everyone else. `Start tracking` is the door, it costs one click,
        and it creates no account — the landing page is a front door,
        NOT a gate (05 §0.1).
     2. Has this account already been offered the local→account merge?
        The merge screen is shown ONCE (P1 §7), not on every sign-in.

   Neither flag gates a feature. Losing this file's localStorage entry
   costs a visitor one extra click and nothing else.
   ============================================================ */
import type { AppData } from '@/lib/types'
import { LEGACY_STORAGE_KEY, REAL_STORAGE_KEY } from '@/lib/demoMode'

const KEY = 'premed_hq_public'

/** Captured at module load, deliberately BEFORE the zustand persist
 *  wrapper gets a chance to write its key for the first time. That is why
 *  `@/lib/publicLayer` is the first import in `main.tsx`.
 *
 *  It answers the only question the landing gate can actually ask: has
 *  this browser used Premed OS before? The store's own contents cannot answer it,
 *  because `seed.ts` ships a populated workspace — a fresh install already
 *  has courses and tasks in it, so "does the store hold anything" is true
 *  for everybody and would hide the landing page from every visitor. */
const HAD_EXISTING_DATA = (() => {
  try {
    return (
      localStorage.getItem(REAL_STORAGE_KEY) !== null ||
      localStorage.getItem(LEGACY_STORAGE_KEY) !== null
    )
  } catch {
    return false
  }
})()

interface PublicMeta {
  /** Set the first time someone clicks `Start tracking` (or signs in). */
  entered?: boolean
  /** User ids that have already seen the merge screen. */
  mergeDecidedFor?: string[]
}

function read(): PublicMeta {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as PublicMeta) : {}
  } catch {
    return {}
  }
}

/** Subscribers to the entered flag. `Start tracking` is a click on `/`
 *  that has to swap the landing page for the dashboard without a reload,
 *  so the flag needs to be reactive rather than read once at mount. */
const listeners = new Set<() => void>()

export function subscribePublicMeta(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function write(next: PublicMeta) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* quota / private mode — the flag is a convenience, never a gate */
  }
  for (const listener of listeners) listener()
}

/** True for anyone who is not a first-time visitor. An existing
 *  installation counts as entered without ever having clicked anything —
 *  a returning user must never be shown a landing page. */
export function hasEnteredApp(): boolean {
  return HAD_EXISTING_DATA || read().entered === true
}

export function markEnteredApp() {
  write({ ...read(), entered: true })
}

export function hasSeenMerge(userId: string): boolean {
  return (read().mergeDecidedFor ?? []).includes(userId)
}

/* ── Re-running the flow ─────────────────────────────────────────────────
   The front door is a one-way trip by design: once you have used Premed OS, `/`
   is your dashboard forever. That is correct for a visitor and useless for
   anyone testing the thing — the landing page, the auth screens and the
   merge screen become unreachable in the browser you actually use.

   `resetPublicMeta` puts this browser back to first-visit state. It clears
   ONLY the two convenience flags in this file. It never touches the store,
   the session, or anything a user typed. Worst case it costs one click.  */
export function resetPublicMeta() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* private mode — nothing to clear */
  }
  for (const listener of listeners) listener()
}

/** True when this browser has data from before the public layer existed.
 *  Reported honestly by the reset control, because `resetPublicMeta` alone
 *  cannot send such a browser back to the landing page — `/landing` can. */
export function hasPreExistingData(): boolean {
  return HAD_EXISTING_DATA
}

export function markMergeSeen(userId: string) {
  const meta = read()
  const seen = meta.mergeDecidedFor ?? []
  if (seen.includes(userId)) return
  write({ ...meta, mergeDecidedFor: [...seen, userId] })
}

/* ── Plain counts for the merge screen ───────────────────────────────────
   "14 classes, 62 assignments, 340 logged hours" — never bytes, never a
   JSON blob (P1 §7). A row with a zero count is dropped rather than shown,
   because a list of zeros tells the reader nothing about their own work. */

export interface LocalCount {
  key: string
  label: string
  value: number
  /** `--cat-*` token name that tints the row's dot. */
  tint: string
}

export function localCounts(data: AppData): LocalCount[] {
  const center = data.academics?.classCenter
  const loggedHours = data.experiences.reduce((sum, e) => sum + (Number(e.hours) || 0), 0)

  const rows: LocalCount[] = [
    { key: 'classes', label: 'Classes', value: data.courses.length, tint: 'var(--cat-gpa)' },
    {
      key: 'topics',
      label: 'Topics, with review history',
      value: center?.topics?.length ?? 0,
      tint: 'var(--cat-gpa)',
    },
    {
      key: 'hours',
      label: 'Logged hours',
      value: Math.round(loggedHours),
      tint: 'var(--cat-clinical)',
    },
    {
      key: 'mistakes',
      label: 'Mistakes logged',
      value: data.mcat?.errorLog?.length ?? 0,
      tint: 'var(--cat-mcat)',
    },
    {
      key: 'assignments',
      label: 'Assignments & deadlines',
      value: (center?.assignments?.length ?? 0) + data.tasks.filter((t) => !t.milestone).length,
      tint: 'var(--warning)',
    },
  ]

  return rows.filter((r) => r.value > 0)
}

/** Is there anything on this device worth protecting? Drives both the
 *  landing-page decision and whether the merge screen appears at all. */
export function hasLocalWork(data: AppData): boolean {
  return localCounts(data).length > 0
}

/** The date the visitor started using Premed OS signed out, for the merge screen's
 *  "You've been using Premed OS signed out since …" line. Returns undefined when
 *  nothing on the device carries a creation date — the copy drops the
 *  clause rather than inventing one. */
export function localWorkSince(data: AppData): string | undefined {
  const stamps = [
    ...data.courses.map((c) => c.createdAt),
    ...data.experiences.map((e) => e.createdAt),
    ...data.tasks.map((t) => t.createdAt),
  ].filter((n): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0)
  if (stamps.length === 0) return undefined
  return new Date(Math.min(...stamps)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
