import { useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { CloudDownload, FileUp, Moon, Sun, ShieldAlert } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { activeStorageKey } from '@/lib/demoMode'
import { supabase, authRedirectTo } from '@/lib/supabase'
import { createBootRecovery, type RecoveryCandidate } from '@/store/workspaceBootRecovery'
import { readDashboardForBootRecovery } from '@/store/dashboardRead'
import { workspacePersistence } from '@/store/workspacePersistence'
import { workspaceRecoveryEnvelope, downloadWorkspaceRecovery, downloadWorkspaceDiagnostics, downloadRecoveredWorkspaceBackup } from '@/store/workspaceRecoveryExport'
import { verifyWorkspaceRecord } from '@/store/workspaceRepository'

type Props = { error: unknown; workspaceKey: string; client?: SupabaseClient | null; onRecovered?: () => void }
/** No store, auth provider, App, sync hook, or backup scheduler mounts here. */
export function WorkspaceBootRecovery({ error, workspaceKey, client = supabase, onRecovered = () => window.location.reload() }: Props) {
  const [userId, setUserId] = useState<string | null>(null), [sessionReady, setSessionReady] = useState(!client)
  const [candidate, setCandidate] = useState<RecoveryCandidate | null>(null), [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false), [saved, setSaved] = useState(false), [hasBackup, setHasBackup] = useState(false)
  const [sessionEmail, setSessionEmail] = useState(''), [switching, setSwitching] = useState(false)
  const [email, setEmail] = useState(''), [linkSent, setLinkSent] = useState(false)
  const [empty, setEmpty] = useState(false), [dark, setDark] = useState(document.documentElement.classList.contains('dark'))
  const input = useRef<HTMLInputElement>(null), lock = useRef(false), identity = useRef({ userId: null as string | null, revision: 0 })
  const [service, setService] = useState<ReturnType<typeof createBootRecovery> | null>(null)
  useEffect(() => {
    const repository = workspacePersistence()?.repository
    setService(repository ? createBootRecovery({ key: workspaceKey, repository, storage: localStorage,
      context: () => `${activeStorageKey()}:${identity.current.userId}:${identity.current.revision}` }) : null)
  }, [workspaceKey])
  useEffect(() => {
    let alive = true, observed = false
    const apply = (id: string | null, address = '') => {
      if (!alive) return
      identity.current = { userId: id, revision: identity.current.revision + 1 }; setCandidate(null)
      setUserId(id); setSessionEmail(address); setSessionReady(true); setEmail(''); setLinkSent(false); setMessage('')
    }
    // Observe an existing/new session only. This does not mount account sync or
    // route through first-login setup; even a SIGNED_IN event cannot upload.
    const subscription = client?.auth.onAuthStateChange((_event, session) => { observed = true; apply(session?.user.id ?? null, session?.user.email ?? '') })
    if (client) void client.auth.getSession().then(({ data, error: failure }) => {
      if (!observed) apply(failure ? null : data.session?.user.id ?? null, failure ? '' : data.session?.user.email ?? '')
      if (alive && !observed && failure) setMessage('Your sign-in could not be checked. You can still restore a backup file.')
    }).catch(() => { if (alive && !observed) { setSessionReady(true); setMessage('Your sign-in could not be checked. You can still restore a backup file.') } })
    return () => { alive = false; identity.current.revision++; subscription?.data.subscription.unsubscribe() }
  }, [client])
  useEffect(() => {
    let alive = true
    void workspaceRecoveryEnvelope(workspaceKey).then(async envelope => {
      if (!envelope.workspace) { if (alive) setEmpty(!envelope.workspaceError && !envelope.originalsError && !envelope.legacyError && !envelope.originals.length && (!envelope.legacy || envelope.legacy.startsWith('premed-os:workspace:idb:v1:'))); return }
      try { await verifyWorkspaceRecord(envelope.workspace); if (alive) setHasBackup(true) } catch { /* A corrupt record is retained but is not advertised as a verified backup. */ }
    }).catch(() => {})
    return () => { alive = false }
  }, [workspaceKey])
  async function run(action: () => Promise<void>) {
    if (lock.current) return
    lock.current = true; setBusy(true); setMessage('')
    try { await action() } catch (failure) { setMessage(failure instanceof Error ? failure.message : 'Recovery could not finish. Nothing was sent to your account.'); setCandidate(null) }
    finally { lock.current = false; setBusy(false) }
  }
  function signIn() {
    void run(async () => {
      if (!client || !email.trim()) return
      // Reuse the app's magic-link/PKCE flow without importing its sync hook or
      // auth page. The callback boots back into this fence before App can mount.
      const revision = identity.current.revision
      const { error: failure } = await client.auth.signInWithOtp({ email: email.trim(),
        options: { emailRedirectTo: authRedirectTo, shouldCreateUser: false } })
      if (identity.current.revision !== revision) return
      if (failure) throw failure
      setLinkSent(true)
    })
  }
  function switchAccount() {
    if (!client || lock.current) return
    // Invalidate every outstanding review before requesting session revocation.
    const revision = ++identity.current.revision
    setCandidate(null); setEmail(''); setLinkSent(false); setSwitching(true)
    void run(async () => {
      try {
        const { error: failure } = await client.auth.signOut({ scope: 'local' })
        // Auth events (including a newer sign-in) are the source of truth.
        if (identity.current.revision !== revision) return
        if (failure) throw new Error('Sign-out did not finish. Your saved work is unchanged. Try again.')
        identity.current = { userId: null, revision: revision + 1 }
        setUserId(null); setSessionEmail(''); setSessionReady(true)
      } catch {
        if (identity.current.revision === revision) throw new Error('Sign-out did not finish. Your saved work is unchanged. Try again.')
      } finally { setSwitching(false) }
    })
  }
  function account() {
    void run(async () => {
      if (!client || !userId || !service) return
      const id = userId, revision = identity.current.revision
      const check = () => {
        if (identity.current.userId !== id || identity.current.revision !== revision) throw new Error('Your sign-in changed. Review the account copy again.')
      }
      setCandidate(await service.fromAccount(id, () => readDashboardForBootRecovery(client, id, check)))
    })
  }
  const ownsCopy = !!userId && workspaceKey === `hq:app-data:account:${userId}`
  return <main className="min-h-screen bg-background px-4 py-8 text-foreground">
    <div className="mx-auto max-w-xl space-y-5">
      <header className="flex items-center justify-between gap-3"><span className="font-display text-xl font-bold">Premed OS</span><button type="button" className={buttonVariants({ variant: 'ghost', size: 'icon' })} aria-label={dark ? 'Use light theme' : 'Use dark theme'} onClick={() => { document.documentElement.classList.toggle('dark', !dark); setDark(!dark) }}>{dark ? <Sun className="size-4" /> : <Moon className="size-4" />}</button></header>
      <section className="space-y-4 rounded-lg border border-border bg-card p-5" aria-labelledby="recovery-title">
        <ShieldAlert className="size-5 text-muted-foreground" aria-hidden="true" />
        <h1 id="recovery-title" className="font-display text-2xl font-bold">Let’s recover your saved work</h1>
        {empty ? <p>This copy is empty. Your data is not in this browser.</p> : <p>This browser couldn’t open your saved work.</p>}
        <p className="text-sm text-muted-foreground">Editing and sync are paused. Nothing has been sent to your account. Choose a copy to review before restoring it.</p>
        {saved ? <div className="space-y-3" role="status"><p>Your restored copy is saved and checked in this browser. Your account copy was not changed.</p><button className={buttonVariants({ variant: 'outline' })} type="button" disabled={busy} onClick={() => void run(() => downloadRecoveredWorkspaceBackup(workspaceKey))}>Download a full backup now</button><button className={buttonVariants()} type="button" disabled={busy} onClick={onRecovered}>Open my restored workspace</button><p className="text-sm text-muted-foreground">Opening the app resumes its normal account check. Different saved copies may need your review.</p></div> : <>
          <div className="flex flex-col gap-2">
            <button className={buttonVariants({ variant: 'outline' })} type="button" disabled={!ownsCopy || !service || busy} onClick={account}><CloudDownload className="size-4" aria-hidden="true" />Restore from my account</button>
            {!sessionReady ? <p className="text-sm text-muted-foreground" role="status">Checking your sign-in…</p> : !ownsCopy && <p className="text-sm text-muted-foreground">{userId ? "You’re signed in as a different account than this saved copy. Sign out and sign in with the account you used before." : 'Account restore is available when you are signed in to the account that owns this copy. You can use a backup file below.'}</p>}
            {sessionReady && userId && client && <div className="space-y-2">{sessionEmail && <p className="break-words text-sm">Signed in as {sessionEmail}</p>}<button className={buttonVariants({ variant: 'outline' })} type="button" disabled={busy} onClick={switchAccount}>Sign out and use a different account</button><p className="text-sm text-muted-foreground">This signs out the current browser session. Your saved workspace stays on this device.</p></div>}
            {sessionReady && !userId && client && workspaceKey.startsWith('hq:app-data:account:') && <form className="space-y-2 rounded-md border border-border p-3" onSubmit={event => { event.preventDefault(); signIn() }}>
              <label className="block text-sm font-medium" htmlFor="recovery-email">Email for your account</label>
              <input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} disabled={busy || linkSent} className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-foreground" />
              <button className={buttonVariants({ variant: 'outline' })} type="submit" disabled={busy || linkSent || !email.trim()}>Send sign-in link</button>
              <p className="text-sm text-muted-foreground" role={linkSent ? 'status' : undefined}>{linkSent ? 'Check your email and open the sign-in link in this browser. Recovery will stay open; signing in does not restore or sync your workspace.' : 'Use your existing account. Signing in keeps editing and sync paused until you choose and confirm a copy.'}</p>
            </form>}
            <button className={buttonVariants({ variant: 'outline' })} type="button" disabled={!service || busy} onClick={() => input.current?.click()}><FileUp className="size-4" aria-hidden="true" />Restore from a backup file</button>
            <input ref={input} className="hidden" type="file" accept=".json,.zip" aria-label="Choose a workspace backup" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file && service) void run(async () => { setCandidate(await service.fromFile(file)) }) }} />
          </div>
          {candidate && <section className="space-y-3 rounded-md border border-border p-4" aria-label="Review this copy">
            <h2 className="font-display text-lg font-semibold">Review this copy</h2>
            <p className="text-sm">Source: {candidate.source === 'account' ? 'My account' : 'Backup file'}</p>
            <p>{candidate.classes} {candidate.classes === 1 ? 'class' : 'classes'} · {candidate.notebooks} {candidate.notebooks === 1 ? 'notebook' : 'notebooks'}</p>
            <p className="text-sm">Last saved: {candidate.savedAt && Number.isFinite(Date.parse(candidate.savedAt)) ? new Date(candidate.savedAt).toLocaleString() : 'Not recorded in this copy'}</p>
            <p className="text-sm text-muted-foreground">{candidate.includesFiles ? 'Includes the image and original files verified in this backup.' : 'Includes saved text and file references. Missing image or original files may need their own backup or account sync.'}</p>
            <p className="text-sm">This restores the browser copy. Any leftover local record and its old marker are kept for recovery. Your account copy will not be changed here.</p>
            <div className="flex flex-wrap gap-2"><button className={buttonVariants()} type="button" disabled={busy} onClick={() => void run(async () => { await service!.confirm(candidate); setSaved(true); setCandidate(null) })}>Restore this copy</button><button className={buttonVariants({ variant: 'outline' })} disabled={busy} type="button" onClick={() => setCandidate(null)}>Cancel</button></div>
          </section>}
        </>}
        {busy && <p role="status" aria-live="polite" className="text-sm">{switching ? 'Signing out of this browser session… Your saved work stays here.' : 'Checking and saving the selected copy… Keep this tab open.'}</p>}
        {message && <p role="alert" className="break-words text-sm text-destructive">{message}</p>}
        {!saved && <p className="text-sm text-muted-foreground">If you have no backup file and no account copy, keep this tab open and contact support; nothing has been deleted.</p>}
      </section>
      <details className="text-sm"><summary className="cursor-pointer">Technical details</summary><p className="mt-2 break-words text-muted-foreground">{error instanceof Error ? error.message : 'Workspace storage could not be opened.'}</p><button className={buttonVariants({ variant: 'link' })} type="button" disabled={busy} onClick={() => void run(() => downloadWorkspaceDiagnostics(workspaceKey))}>Download diagnostics (not a backup)</button>{hasBackup && <button className={buttonVariants({ variant: 'link' })} type="button" disabled={busy} onClick={() => void run(async () => { await downloadWorkspaceRecovery(workspaceKey) })}>Download verified local recovery copy</button>}</details>
    </div>
  </main>
}
