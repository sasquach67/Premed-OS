/** Recovery runs before importing the live store, providers, or sync hooks. */
import { createEmptyClassCenterData } from '@/data/personalInitialData'
import { persistentStorage } from '@/lib/persistentStorage'
import type { AppData } from '@/lib/types'
import { assertSupportedWorkspace } from '@/lib/workspaceSchema'
import { validateAppData } from '@/lib/validateAppData'
import { prepareWorkspaceBackup, stageWorkspaceBackup, type PreparedWorkspaceBackup } from '@/lib/workspaceBackup'
import { rejectDuplicateKeys } from '@/lib/academics/notebook/package'
import { CURRENT_STORE_VERSION } from './workspaceVersion'
import { workspaceDigest, verifyWorkspaceRecord, type WorkspaceRepository, type WorkspaceRecord } from './workspaceRepository'
import { WORKSPACE_IDB_PREFIX } from './workspacePersistence'
import type { RemoteDashboard } from './dashboardRead'

export type RecoveryCandidate = { readonly source: 'account' | 'file'; readonly raw: string; readonly digest: string; readonly classes: number; readonly notebooks: number; readonly savedAt: string | null; readonly includesFiles: boolean }
const prepared = new WeakMap<RecoveryCandidate, PreparedWorkspaceBackup>()
function validateEnvelope(raw: string) {
  const envelope = JSON.parse(raw)
  if (!Number.isInteger(envelope?.version) || envelope.version < 0 || envelope.version > CURRENT_STORE_VERSION) throw new Error('This backup needs a different app version. Nothing was changed.')
  assertSupportedWorkspace(envelope.state)
  if (validateAppData(envelope.state).length) throw new Error('This is not a valid workspace backup. Nothing was changed.')
  // Keep malformed nested rows from reaching migrations that dereference them.
  // Older backups may omit sections; unknown sections remain untouched.
  const center = envelope.state.academics?.classCenter
  if (center) for (const [key, initial] of Object.entries(createEmptyClassCenterData())) {
    const rows = center[key]
    if (Array.isArray(initial) && rows !== undefined && (!Array.isArray(rows) || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row)))) {
      throw new Error(`The backup's ${key} list is damaged. Nothing was changed.`)
    }
  }
  if (center?.lectures?.some((row: Record<string, unknown>) => typeof row.id !== 'string' || !row.id || typeof row.courseId !== 'string' || !row.courseId || typeof row.title !== 'string')) {
    throw new Error('A notebook entry is damaged. Nothing was changed.')
  }
  return envelope.state as AppData
}
async function candidate(raw: string, savedAt: string | null, includesFiles = false, source: RecoveryCandidate['source'] = 'file'): Promise<RecoveryCandidate> {
  const data = validateEnvelope(raw)
  const lectures = data.academics?.classCenter?.lectures
  return Object.freeze({ source, raw, digest: await workspaceDigest(raw), classes: data.courses?.length ?? 0,
    notebooks: Array.isArray(lectures) ? lectures.length : 0, savedAt, includesFiles })
}

export async function prepareRecoveryFile(file: File): Promise<RecoveryCandidate> {
  if (file.size > 256 * 1024 * 1024) throw new Error('This backup is too large (256 MiB maximum). Nothing was changed.')
  if (/\.zip$/i.test(file.name)) {
    const backup = await prepareWorkspaceBackup(file)
    const result = await candidate(JSON.stringify({ state: backup.data, version: 0 }), null, true)
    prepared.set(result, backup)
    return result
  }
  if (file.size > 64 * 1024 * 1024) throw new Error('This JSON backup is too large (64 MiB maximum). Nothing was changed.')
  const text = await file.text()
  rejectDuplicateKeys(text)
  let input
  try { input = JSON.parse(text) } catch { throw new Error('This file is not valid JSON. Nothing was changed.') }
  if (input?.format === 'premed-os-storage-recovery') {
    if (!input.workspace) throw new Error('This copy is empty. Your data is not in this file.')
    if (input.version !== 1) throw new Error('Unsupported recovery file version.')
    await verifyWorkspaceRecord(input.workspace)
    return candidate(input.workspace.raw, new Date(input.workspace.updatedAt).toISOString())
  }
  // Plain Settings JSON exports have no saved-time provenance. File modification
  // time and last-opened time must never be presented as a workspace save time.
  const raw = input?.state ? text : JSON.stringify({ state: input, version: 0 })
  return candidate(raw, null)
}

export function createBootRecovery({ key, repository, storage, context = () => key }: { key: string; repository: WorkspaceRepository; storage: Storage; context?: () => string }) {
  const reviews = new WeakMap<RecoveryCandidate, { record: WorkspaceRecord | null; pointer: string | null; context: string; recheck?: () => Promise<void> }>()
  let applying = false
  async function capture() {
    const identity = context(), pointer = storage.getItem(key), record = await repository.read(key)
    const review = { record, pointer, context: identity }
    await unchanged(review)
    return review
  }
  async function remember(value: RecoveryCandidate, review: Awaited<ReturnType<typeof capture>>, recheck?: () => Promise<void>) {
    await unchanged(review)
    reviews.set(value, { ...review, recheck })
    return value
  }
  async function unchanged(review: { record: WorkspaceRecord | null; pointer: string | null; context: string }) {
    if (context() !== review.context || storage.getItem(key) !== review.pointer || JSON.stringify(await repository.read(key)) !== JSON.stringify(review.record) || storage.getItem(key) !== review.pointer || context() !== review.context) throw new Error('This browser copy changed. Nothing was replaced; review it again.')
  }
  return {
    async fromFile(file: File) { const review = await capture(); return remember(await prepareRecoveryFile(file), review) },
    async fromAccount(userId: string, read: () => Promise<RemoteDashboard | null>) {
      if (key !== `hq:app-data:account:${userId}`) throw new Error('Sign in to the account that owns this browser copy before restoring it.')
      const review = await capture()
      const remote = await read()
      if (!remote) throw new Error('There is no saved workspace in this account. Try a backup file.')
      const raw = JSON.stringify({ state: remote.data, version: 0 }), signature = JSON.stringify(remote)
      const value = await candidate(raw, remote.updatedAt, false, 'account')
      return remember(value, review, async () => {
        const latest = await read()
        if (JSON.stringify(latest) !== signature) throw new Error('Your account copy changed. Review the latest copy before restoring.')
      })
    },
    async confirm(value: RecoveryCandidate) {
      if (applying) throw new Error('A restore is already in progress.')
      const review = reviews.get(value)
      if (!review) throw new Error('Review this copy before restoring it.')
      applying = true
      try {
        await unchanged(review)
        if (await workspaceDigest(value.raw) !== value.digest) throw new Error('The reviewed copy changed. Select it again.')
        validateEnvelope(value.raw)
        await review.recheck?.()
        await unchanged(review)
        let raw = value.raw, finish: (() => Promise<void>) | undefined
        const backup = prepared.get(value)
        if (backup) {
          const staged = await stageWorkspaceBackup(backup, () => {
            if (context() !== review.context || storage.getItem(key) !== review.pointer) throw new Error('This browser copy changed. Review the backup again.')
          })
          raw = JSON.stringify({ state: staged.data, version: 0 }); finish = staged.finish
        }
        await unchanged(review)
        const record = await repository.recover(key, review.record, review.pointer, raw, () => {
          if (context() !== review.context || storage.getItem(key) !== review.pointer) throw new Error('The workspace or sign-in changed. Review the copy again.')
        })
        const saved = await repository.read(key)
        if (!saved || saved.revision !== record.revision || saved.raw !== raw) throw new Error('The restored copy could not be confirmed. Recovery remains open.')
        await verifyWorkspaceRecord(saved)
        if (context() !== review.context || storage.getItem(key) !== review.pointer) throw new Error('Another tab changed this copy. Recovery remains open.')
        // A crash before publication is recoverable through the existing staged
        // migration path. The previous pointer and record are retained in originals.
        storage.setItem(key, WORKSPACE_IDB_PREFIX + saved.migrationId)
        const activated = await repository.activate(key, saved.revision)
        await verifyWorkspaceRecord(activated)
        if (context() !== review.context || storage.getItem(key) !== WORKSPACE_IDB_PREFIX + saved.migrationId) throw new Error('Another tab changed this copy. Recovery remains open.')
        reviews.delete(value)
        await finish?.()
        void persistentStorage.requestAfterSave()
      } finally { applying = false }
    },
  }
}
