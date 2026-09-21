import { useSyncExternalStore } from 'react'
import { AccountConflictReview } from './AccountConflictReview'
import { captureSyncSession, assertSyncSession, getAccountConflict, subscribeAccountConflicts } from '@/store/accountSyncSafety'
import { decodeWorkspaceStorage } from '@/store/workspaceStorageCodec'

export function AccountSyncNotice({ userId }: { userId?: string }) {
  const conflict = useSyncExternalStore(subscribeAccountConflicts, () => getAccountConflict(userId))
  if (!conflict || !userId) return null
  function download(kind: 'exact' | 'local' | 'cloud' | 'open') {
    const session = captureSyncSession()
    assertSyncSession(session)
    if (session.id !== userId || getAccountConflict(userId) !== conflict) return
    let text: string
    if (kind === 'exact') text = conflict!.localRaw ?? ''
    else if (kind === 'local') text = JSON.stringify(JSON.parse(decodeWorkspaceStorage(conflict!.localRaw!)).state, null, 2)
    else text = JSON.stringify(kind === 'open' ? conflict!.open!.data : conflict!.remote, null, 2)
    const url = URL.createObjectURL(new Blob([text], { type: kind === 'exact' ? 'text/plain' : 'application/json' }))
    const link = document.createElement('a')
    link.href = url; link.download = `premedos-${kind === 'exact' ? 'device-cache-exact.txt' : `${kind}-account-copy.json`}`
    link.click(); URL.revokeObjectURL(url)
  }
  let portableLocal = false
  try { portableLocal = Boolean(conflict.localRaw && JSON.parse(decodeWorkspaceStorage(conflict.localRaw)).state) } catch { /* Exact bytes remain downloadable. */ }
  return <aside role="alert" className="m-4 rounded-lg border border-amber-500/50 bg-card p-4 text-sm">
    <p className="font-semibold">Account copies need review</p>
    <p className="mt-1">{conflict.message}</p>
    <p className="mt-1 text-muted-foreground">{conflict.saved ? 'Available copies have verified browser recovery copies.' : 'Downloads remain available from this tab.'} These files include source references; keep original image folders and ZIPs.</p>
    <div className="mt-3 flex flex-wrap gap-3">
      {conflict.open && <button type="button" className="underline" onClick={() => download('open')}>Download open workspace JSON (includes unsaved edits)</button>}
      {conflict.localRaw && <button type="button" className="underline" onClick={() => download('exact')}>Download exact device cache</button>}
      {portableLocal && <button type="button" className="underline" onClick={() => download('local')}>Download device account JSON</button>}
      {conflict.remote && <button type="button" className="underline" onClick={() => download('cloud')}>Download cloud account JSON</button>}
    </div>
    <p className="mt-2 text-muted-foreground">Compare the copies below before choosing which to use. Downloading alone does not restore or replace any data.</p>
    <AccountConflictReview key={userId} userId={userId} conflict={conflict} />
  </aside>
}
