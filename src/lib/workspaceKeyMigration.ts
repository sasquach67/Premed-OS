/* ============================================================
   Adopts pre-namespacing secondary caches into the workspace that opens
   first after the upgrade.

   Per-account namespacing (`workspaceScopedKey`) moved several browser
   caches from a bare key to a suffixed one:

     premed-os:ai-study-source-disclosure:v1
       -> premed-os:ai-study-source-disclosure:v1:guest
       -> premed-os:ai-study-source-disclosure:v1:account:<id>

   Nothing read through to the old address, so an existing beta user opened
   the app to re-prompted AI disclosures, empty command recents, and shared
   syllabus structures they could no longer reach. The records were still on
   disk the whole time, which is the specific failure `CLAUDE.md` names:
   "Renaming `hq:app-data` does not migrate anything — it silently points the
   app at an empty slot."

   Adopt-once, into the first workspace to open. Before namespacing, one
   browser meant one student, so the legacy value belongs to whoever opens
   the app next. The legacy key is removed only after its value is written to
   the scoped address, so a second account cannot inherit the same consent,
   and a crash between the two steps leaves the original readable.
   ============================================================ */
import { workspaceScopedKey } from '@/lib/demoMode'

/** Bases that gained a workspace suffix. Order is irrelevant; each is
 *  adopted independently so one malformed value cannot block the others. */
const SCOPED_BASES = [
  'premed_hq_command_recents',
  'premedos.shared-syllabus.capabilities.v1',
  'premed-os:ai-study-source-disclosure:v1',
] as const

/** The study-source sync cache is a derived fingerprint cache, not student
 *  work, and its key *shape* changed as well as its prefix. Old entries are
 *  therefore unreachable AND invisible to `clearStudySourceSyncCache`, which
 *  now scans the scoped prefix. Purge them instead of adopting them: they
 *  rebuild on the next sync, and left alone they accumulate forever. */
const LEGACY_SYNC_PREFIX = 'premed-os:ai-study-source-sync:v1:'

function adopt(base: string): boolean {
  const scoped = workspaceScopedKey(base)
  if (scoped === base) return false
  const legacy = localStorage.getItem(base)
  if (legacy === null) return false
  // A value already at the scoped address wins: the student has used this
  // workspace since the upgrade, and their newer choice is not overwritten by
  // a stale pre-upgrade one. The legacy copy is still cleared, so the next
  // account to sign in does not pick it up.
  if (localStorage.getItem(scoped) === null) localStorage.setItem(scoped, legacy)
  localStorage.removeItem(base)
  return true
}

function purgeLegacySyncCache(): number {
  const scopedPrefix = workspaceScopedKey(LEGACY_SYNC_PREFIX)
  let removed = 0
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index)
    if (!key?.startsWith(LEGACY_SYNC_PREFIX)) continue
    if (key.startsWith(scopedPrefix)) continue
    localStorage.removeItem(key)
    removed += 1
  }
  return removed
}

/**
 * Run once per workspace activation, before anything reads these caches.
 *
 * Safe to call repeatedly: adoption is a no-op once the legacy key is gone,
 * and re-running after an account switch lets a second workspace adopt keys
 * the first one never had.
 *
 * @returns the bases adopted and how many stale sync entries were purged,
 *   for tests and for the migration journal.
 */
export function migrateLegacyWorkspaceKeys(): { adopted: string[]; purgedSyncEntries: number } {
  if (typeof localStorage === 'undefined') return { adopted: [], purgedSyncEntries: 0 }
  try {
    const adopted = SCOPED_BASES.filter(adopt)
    return { adopted, purgedSyncEntries: purgeLegacySyncCache() }
  } catch {
    // A quota or privacy-mode failure here must never stop the app booting.
    return { adopted: [], purgedSyncEntries: 0 }
  }
}
