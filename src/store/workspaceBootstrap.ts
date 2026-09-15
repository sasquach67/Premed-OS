import { createPersonalInitialData } from '@/data/personalInitialData'
import { activeStorageKey, GUEST_STORAGE_KEY, DEMO_STORAGE_KEY, isDemoMode, clearUnstampedDemoNamespace, REAL_STORAGE_KEY, LEGACY_STORAGE_KEY } from '@/lib/demoMode'
import { enableWorkspacePersistence, workspacePersistence } from './workspacePersistence'
import { decodeWorkspaceStorage } from './workspaceStorageCodec'
import { createDemoData } from '@/data/demoSeed'

// Version zero ensures newly created defaults traverse the existing migration
// chain. Existing snapshots retain their exact stored version and original bytes.
export function workspaceSeed(key: string) { return JSON.stringify({ state: key === DEMO_STORAGE_KEY ? createDemoData() : createPersonalInitialData(), version: 0 }) }
export async function loadDurableWorkspace(key: string) {
  const persistence = workspacePersistence()
  if (persistence) await persistence.load(key, () => workspaceSeed(key))
}
export async function initializeDurableWorkspaces() {
  const persistence = enableWorkspacePersistence()
  if (isDemoMode()) clearUnstampedDemoNamespace()
  // Older installs may still use the pre-Zustand key. Preserve it untouched;
  // stage it at the original root through the same verified migration protocol.
  if (!isDemoMode() && !localStorage.getItem(REAL_STORAGE_KEY) && localStorage.getItem(LEGACY_STORAGE_KEY)) {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)!
    if (!await persistence.repository.read(REAL_STORAGE_KEY)) await persistence.repository.stage(REAL_STORAGE_KEY, null, decodeWorkspaceStorage(legacy), { key: LEGACY_STORAGE_KEY, raw: legacy })
    await loadDurableWorkspace(REAL_STORAGE_KEY)
  }
  await loadDurableWorkspace(activeStorageKey())
  if (activeStorageKey() !== GUEST_STORAGE_KEY) await loadDurableWorkspace(GUEST_STORAGE_KEY)
}
