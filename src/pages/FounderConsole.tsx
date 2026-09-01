import { useCallback, useEffect, useState } from 'react'
import {
  Activity, Database, ExternalLink, RefreshCw, ShieldCheck, Trash2, UserRoundCheck, UsersRound,
} from 'lucide-react'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  deleteFounderManagedAccount, loadFounderOverview, type FounderAccount, type FounderOverview,
} from '@/lib/founderAdmin'
import { cn } from '@/lib/utils'

function friendlyDate(value: string | null) {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unavailable'
  return format(date, 'MMM d, yyyy · h:mm a')
}

function Metric({ label, value, note, accent }: { label: string; value: number; note: string; accent?: boolean }) {
  return (
    <div className="min-w-0 px-4 py-3 first:pl-0 sm:px-5 sm:first:pl-5">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <strong className={cn('font-display text-2xl font-extrabold tabular-nums', accent && 'text-primary')}>{value}</strong>
        <span className="truncate text-xs font-semibold text-muted-foreground">{note}</span>
      </div>
    </div>
  )
}

function ConsoleSkeleton() {
  return <div className="space-y-4"><Skeleton className="h-44 rounded-[1.75rem]" /><Skeleton className="h-80 rounded-[1.75rem]" /></div>
}

export function FounderConsole() {
  const [overview, setOverview] = useState<FounderOverview | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState<FounderAccount | null>(null)
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setOverview(await loadFounderOverview())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Founder controls are unavailable.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const generatedLabel = overview?.generatedAt
    ? `Updated ${formatDistanceToNowStrict(new Date(overview.generatedAt), { addSuffix: true })}`
    : ''

  async function confirmDelete() {
    if (!target || confirmation.trim().toLowerCase() !== target.email.toLowerCase()) return
    setDeleting(true)
    setError('')
    try {
      await deleteFounderManagedAccount(target.id, confirmation)
      setTarget(null)
      setConfirmation('')
      await refresh()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'The account could not be deleted.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading && !overview) return <ConsoleSkeleton />

  if (error && !overview) {
    return (
      <section className="mx-auto max-w-2xl rounded-[1.75rem] border border-border bg-card p-7 shadow-sm">
        <div className="grid size-11 place-items-center rounded-2xl bg-destructive/10 text-destructive"><ShieldCheck className="size-5" /></div>
        <h1 className="mt-5 font-display text-3xl font-extrabold">Founder access required.</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{error}</p>
        <Button className="mt-5" variant="outline" onClick={() => void refresh()}><RefreshCw className="size-4" />Try again</Button>
      </section>
    )
  }

  if (!overview) return null

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="overflow-hidden rounded-[1.75rem] border border-[#31495b] bg-[radial-gradient(circle_at_84%_18%,rgba(75,156,211,.24),transparent_28%),linear-gradient(135deg,#122536,#202c34_62%,#292722)] text-[#f3eee6] shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-5 px-6 pb-6 pt-7 sm:px-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#85c2e8]"><ShieldCheck className="size-4" />Premed OS · private operations</div>
            <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Founder control</h1>
            <p className="mt-1 max-w-2xl text-sm font-semibold text-[#b8c3c8]">Account health, access, and beta operations—without opening anyone’s academic workspace.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="border-emerald-300/25 bg-emerald-300/10 text-emerald-200">Founder verified</Badge>
            <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw className={cn('size-4', loading && 'animate-spin')} />Refresh
            </Button>
          </div>
        </div>
        <div className="grid divide-y divide-white/10 border-t border-white/10 bg-black/10 sm:grid-cols-5 sm:divide-x sm:divide-y-0">
          <Metric label="Accounts" value={overview.metrics.accounts} note="total" accent />
          <Metric label="Cloud workspaces" value={overview.metrics.workspaces} note="saved" />
          <Metric label="Active" value={overview.metrics.activeLast7Days} note="last 7 days" />
          <Metric label="New" value={overview.metrics.joinedLast7Days} note="last 7 days" />
          <Metric label="AI requests" value={overview.metrics.weeklyAiRequests} note="weekly buckets" />
        </div>
      </section>

      {error && <p role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
          <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">Access ledger</p>
              <h2 className="font-display text-2xl font-extrabold">Accounts</h2>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">{generatedLabel}</span>
          </header>
          <div className="divide-y divide-border">
            {overview.accounts.map((account) => (
              <article key={account.id} className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,.85fr)_auto] sm:items-center sm:px-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-display text-base font-extrabold">{account.email}</p>
                    {account.isFounder && <Badge className="bg-primary/12 text-primary">Protected founder</Badge>}
                    {account.hasWorkspace && <Badge variant="outline">Workspace saved</Badge>}
                  </div>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">Joined {friendlyDate(account.createdAt)}</p>
                </div>
                <div className="min-w-0 text-xs">
                  <p className="font-bold text-foreground">Last sign-in</p>
                  <p className="mt-0.5 text-muted-foreground">{friendlyDate(account.lastSignInAt)}</p>
                  <p className="mt-1 truncate text-muted-foreground">{account.providers.length ? account.providers.join(' + ') : 'Provider unavailable'}</p>
                </div>
                <div className="justify-self-start sm:justify-self-end">
                  {account.isFounder ? (
                    <span className="inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 text-xs font-extrabold text-emerald-600 dark:text-emerald-300"><UserRoundCheck className="size-4" />Cannot delete</span>
                  ) : (
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => { setTarget(account); setConfirmation('') }}><Trash2 className="size-4" />Delete</Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Operational boundary</p>
            <div className="mt-4 space-y-4">
              <div className="flex gap-3"><Database className="mt-0.5 size-4 shrink-0 text-primary" /><p className="text-sm"><b className="block">Database reachable</b><span className="text-muted-foreground">Live aggregate data loaded.</span></p></div>
              <div className="flex gap-3"><UsersRound className="mt-0.5 size-4 shrink-0 text-primary" /><p className="text-sm"><b className="block">Identity only</b><span className="text-muted-foreground">No courses, notes, grades, or files are readable here.</span></p></div>
              <div className="flex gap-3"><Activity className="mt-0.5 size-4 shrink-0 text-primary" /><p className="text-sm"><b className="block">Deletion is audited</b><span className="text-muted-foreground">The actor, target, and time are recorded.</span></p></div>
            </div>
          </section>
          <a href="https://supabase.com/dashboard/project/poichxqptuupzrkyewrq" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm font-extrabold text-primary transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Open service dashboard <ExternalLink className="size-4" /></a>
        </aside>
      </div>

      <AlertDialog open={Boolean(target)} onOpenChange={(open) => { if (!open && !deleting) { setTarget(null); setConfirmation('') } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this account permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the Auth identity and its cloud-owned workspace records. Browser-only caches on the student’s devices cannot be erased remotely.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {target && <div className="space-y-2"><p className="text-sm font-bold">Type <span className="text-destructive">{target.email}</span> to confirm.</p><Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" aria-label="Confirmation email" /></div>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={!target || confirmation.trim().toLowerCase() !== target.email.toLowerCase() || deleting} onClick={() => void confirmDelete()}><Trash2 className="size-4" />{deleting ? 'Deleting…' : 'Delete account'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
