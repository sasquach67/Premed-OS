/* ============================================================
   ⚠️ THESE STRINGS ARE localStorage KEYS. DO NOT RENAME THEM.

   They contain `hq` and they must keep containing it. The product was
   renamed Premed HQ -> Premed OS in Aug 2026 and every DISPLAY string
   moved, but a storage key is not a display string: it is the address a
   returning user's data already lives at. Renaming `hq:app-data` does not
   migrate anything — it silently points the app at an empty slot, and
   every existing user opens a blank workspace with their real records
   still sitting in the old key.

   `general.md` §Rename lists this alongside the vite `base` and
   googleDrive's BACKUP_FILENAME as preserved on purpose.

   If these ever genuinely have to change, it needs a versioned, lossless
   migration that reads the old key and writes the new one — the same
   discipline every other schema change here follows. Not a find-replace.
   ============================================================ */
export const DEMO_MODE_FLAG = 'hq:demo-mode'
export const REAL_STORAGE_KEY = 'hq:app-data'
export const DEMO_STORAGE_KEY = 'hq-demo:app-data'
export const LEGACY_STORAGE_KEY = 'premed_hq_v1'

/** Marks the demo namespace as genuinely demo-seeded. Bump when the demo
 *  persona changes so stale blobs are re-seeded instead of being trusted. */
export const DEMO_STAMP_KEY = 'hq-demo:seed-stamp'
export const DEMO_STAMP_VALUE = 'andy-quach-v2'

export function isDemoMode(): boolean {
  return typeof localStorage !== 'undefined' && localStorage.getItem(DEMO_MODE_FLAG) === 'on'
}

export function setDemoMode(active: boolean) {
  localStorage.setItem(DEMO_MODE_FLAG, active ? 'on' : 'off')
  // Entering demo always starts from a known-good namespace. Anything already
  // sitting under the demo key that we did not seed is discarded rather than
  // shown — otherwise real-looking data can appear beneath the "Demo data"
  // badge, which is exactly the confusion demo mode must never create.
  if (active) clearUnstampedDemoNamespace()
  window.location.reload()
}

/** Drop the demo blob unless we stamped it. Safe to call on every load: the
 *  real namespace is never read or written here. */
export function clearUnstampedDemoNamespace() {
  if (typeof localStorage === 'undefined') return
  if (localStorage.getItem(DEMO_STAMP_KEY) === DEMO_STAMP_VALUE) return
  localStorage.removeItem(DEMO_STORAGE_KEY)
}

/** Called once the store has hydrated demo data, so later loads keep edits. */
export function stampDemoNamespace() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(DEMO_STAMP_KEY, DEMO_STAMP_VALUE)
}

export function activeStorageKey(): string {
  return isDemoMode() ? DEMO_STORAGE_KEY : REAL_STORAGE_KEY
}
