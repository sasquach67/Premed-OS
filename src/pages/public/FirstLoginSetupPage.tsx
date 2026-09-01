import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, GraduationCap, Plus, ShieldCheck, UserRound, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import type { AppData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  applyFirstLoginSetup,
  decideAccountRoute,
  FIRST_LOGIN_DESTINATION,
  FIRST_LOGIN_SETUP_ROUTE,
  hasCompletedAccountSetup,
  notifyAccountWorkspaceReady,
  normalizeMinors,
  profileDefaultsFromIdentity,
  shouldReviewLocalWorkspace,
} from '@/lib/accountWorkspace'
import { markEnteredApp, markMergeSeen, hasLocalWork, hasSeenMerge } from '@/lib/publicLayer'
import { supabase, type DashboardRow } from '@/lib/supabase'
import { dataForRemote } from '@/lib/storyPrivacy'
import { activateAccountWorkspace, snapshotData } from '@/store/store'

type Phase = 'loading' | 'ready' | 'saving' | 'error'

export function FirstLoginSetupPage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('loading')
  const [error, setError] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [major, setMajor] = useState('')
  const [minors, setMinors] = useState<string[]>([])
  const [minorDraft, setMinorDraft] = useState('')
  const [classYear, setClassYear] = useState('')
  const [existingAccount, setExistingAccount] = useState<AppData | null>(null)
  const localAtEntry = useMemo(() => snapshotData(), [])
  const hasDeviceWork = useMemo(() => hasLocalWork(localAtEntry), [localAtEntry])
  const pendingMinors = useMemo(
    () => normalizeMinors([...minors, minorDraft]),
    [minorDraft, minors],
  )

  useEffect(() => {
    let alive = true
    void (async () => {
      if (!supabase) {
        navigate('/auth', { replace: true })
        return
      }
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (!alive) return
      if (authError || !authData.user) {
        navigate('/auth', { replace: true })
        return
      }

      const currentUser = authData.user
      const { data: existing, error: dashboardError } = await supabase
        .from('dashboards')
        .select('data')
        .eq('user_id', currentUser.id)
        .maybeSingle()
      if (!alive) return
      if (dashboardError) {
        setError(dashboardError.message)
        setPhase('error')
        return
      }
      if (existing && hasCompletedAccountSetup(existing.data, {
        email: currentUser.email,
        metadata: currentUser.user_metadata,
      })) {
        const route = decideAccountRoute({
          pathname: FIRST_LOGIN_SETUP_ROUTE,
          hasRemote: true,
          hasCompletedSetup: true,
          hasLocalWork: hasLocalWork(snapshotData()),
          hasSeenMerge: hasSeenMerge(currentUser.id),
        })
        navigate(route ?? '/', { replace: true })
        return
      }

      const defaults = profileDefaultsFromIdentity({
        email: currentUser.email,
        metadata: currentUser.user_metadata,
      })
      const existingData = (existing?.data as AppData | undefined) ?? null
      const existingProfile = existingData?.profile
      setUser(currentUser)
      setName(existingProfile?.name?.trim() || defaults.name)
      setMajor(existingProfile?.major ?? '')
      setMinors(normalizeMinors(existingProfile?.minors ?? []))
      setClassYear(existingProfile?.classYear ?? '')
      setExistingAccount(existingData)
      setPhase('ready')
    })()
    return () => { alive = false }
  }, [navigate])

  async function finishSetup() {
    if (!supabase || !user || !name.trim()) return
    setPhase('saving')
    setError('')
    const account = applyFirstLoginSetup({
      existing: existingAccount,
      identity: { email: user.email, metadata: user.user_metadata },
      setup: { name, major, minors: pendingMinors, classYear, track: 'Pre-Med' },
    })
    try {
      const row: DashboardRow = {
        user_id: user.id,
        data: dataForRemote(account),
        updated_at: new Date().toISOString(),
      }
      // Existing but unpersonalized rows keep their account-owned records;
      // truly new accounts still use insert-only creation.
      const write = existingAccount
        ? supabase.from('dashboards').update(row).eq('user_id', user.id)
        : supabase.from('dashboards').insert(row)
      const { error: writeError } = await write
      if (writeError) throw writeError

      // Provider metadata is display-only; dashboard RLS still owns access.
      await supabase.auth.updateUser({ data: { ...user.user_metadata, full_name: name.trim() } })
      markEnteredApp()

      if (shouldReviewLocalWorkspace(hasDeviceWork, hasSeenMerge(user.id))) {
        navigate('/auth/merge?firstLogin=1', { replace: true })
      } else {
        activateAccountWorkspace(user.id, account)
        markMergeSeen(user.id)
        notifyAccountWorkspaceReady(user.id)
        navigate(FIRST_LOGIN_DESTINATION, { replace: true })
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create your workspace.')
      setPhase('error')
    }
  }

  function addMinor() {
    const next = normalizeMinors([...minors, minorDraft])
    setMinors(next)
    setMinorDraft('')
  }

  function removeMinor(value: string) {
    setMinors((current) => current.filter((item) => item !== value))
  }

  return (
    <div className="mx-auto max-w-5xl py-2 sm:py-6">
      <section className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
        <header
          className="relative overflow-hidden border-b border-border px-6 py-7 sm:px-8 sm:py-8"
          style={{
            background: 'radial-gradient(circle at 88% 8%, color-mix(in srgb, var(--primary) 20%, transparent), transparent 34%), linear-gradient(135deg, var(--card), color-mix(in srgb, var(--muted) 58%, var(--card)))',
          }}
        >
          <div className="relative flex items-start justify-between gap-5">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">One quick setup</p>
              <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Make Premed OS feel like yours.</h1>
              <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-muted-foreground sm:text-base">
                Choose how your name and academic direction appear across the app. Everything stays editable in Profile.
              </p>
            </div>
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary sm:size-14">
              <UserRound className="size-6" aria-hidden="true" />
            </div>
          </div>

          <ol className="relative mt-7 grid grid-cols-3 overflow-hidden rounded-xl border border-border/80 bg-background/45 text-xs font-bold sm:text-sm" aria-label="Account setup progress">
            <li className="flex items-center gap-2 border-r border-border/80 px-3 py-3 text-success sm:px-4">
              <span className="grid size-5 place-items-center rounded-full bg-success/15"><Check className="size-3.5" aria-hidden="true" /></span>
              <span>Signed in</span>
            </li>
            <li className="flex items-center gap-2 border-r border-border/80 bg-primary/10 px-3 py-3 text-primary sm:px-4">
              <span className="grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
              <span>Personalize</span>
            </li>
            <li className="flex items-center gap-2 px-3 py-3 text-muted-foreground sm:px-4">
              <span className="grid size-5 place-items-center rounded-full border border-border bg-card text-xs">3</span>
              <span>Start</span>
            </li>
          </ol>
        </header>

        <div className="p-6 sm:p-8">
          {error ? (
            <p className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {phase === 'loading' ? (
            <div className="flex min-h-44 items-center justify-center gap-3 text-sm font-semibold text-muted-foreground">
              <span className="size-5 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden="true" />
              Loading your account…
            </div>
          ) : (
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault()
                void finishSetup()
              }}
            >
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.8fr)]">
                <div className="space-y-7">
                  <section aria-labelledby="identity-heading">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><UserRound className="size-4.5" aria-hidden="true" /></span>
                      <div>
                        <h2 id="identity-heading" className="font-display text-lg font-extrabold">What should we call you?</h2>
                        <p className="text-xs font-medium text-muted-foreground">Signed in as {user?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="setup-name">Display name</Label>
                      <Input
                        id="setup-name"
                        className="h-12 rounded-xl px-4 text-base"
                        autoComplete="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Your name"
                        autoFocus
                        required
                      />
                    </div>
                  </section>

                  <section className="border-t border-border pt-6" aria-labelledby="direction-heading">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><GraduationCap className="size-4.5" aria-hidden="true" /></span>
                      <div>
                        <h2 id="direction-heading" className="font-display text-lg font-extrabold">Your academic direction</h2>
                        <p className="text-xs font-medium text-muted-foreground">Optional—add only what you know today.</p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
                      <div className="space-y-2">
                        <Label htmlFor="setup-major">Major</Label>
                        <Input id="setup-major" className="h-11 rounded-xl" value={major} onChange={(event) => setMajor(event.target.value)} placeholder="e.g. Neuroscience" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="setup-year">Class year</Label>
                        <Input id="setup-year" className="h-11 rounded-xl" value={classYear} onChange={(event) => setClassYear(event.target.value)} placeholder="e.g. 2030" inputMode="numeric" />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label htmlFor="setup-minor">Minors <span className="normal-case tracking-normal text-muted-foreground">(optional)</span></Label>
                      <div className="flex gap-2">
                        <Input
                          id="setup-minor"
                          className="h-11 rounded-xl"
                          value={minorDraft}
                          onChange={(event) => setMinorDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key !== 'Enter' && event.key !== ',') return
                            event.preventDefault()
                            addMinor()
                          }}
                          placeholder="Add a minor"
                        />
                        <Button type="button" variant="outline" className="h-11 shrink-0 rounded-xl px-4" onClick={addMinor} disabled={!minorDraft.trim()}>
                          <Plus className="size-4" aria-hidden="true" /> Add
                        </Button>
                      </div>
                      {minors.length ? (
                        <div className="flex flex-wrap gap-2 pt-1" aria-label="Selected minors">
                          {minors.map((minor) => (
                            <span key={minor} className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 py-1 pl-3 pr-1.5 text-xs font-bold text-foreground">
                              {minor}
                              <Button type="button" variant="ghost" size="icon" className="size-5 rounded-full text-muted-foreground hover:bg-background hover:text-foreground" onClick={() => removeMinor(minor)} aria-label={`Remove ${minor}`}>
                                <X className="size-3" aria-hidden="true" />
                              </Button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Press Enter or Add after each minor.</p>
                      )}
                    </div>
                  </section>
                </div>

                <aside className="overflow-hidden rounded-2xl border border-border bg-muted/35 lg:self-start" aria-label="Profile preview">
                  <div className="border-b border-border bg-primary/8 px-5 py-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Your workspace</p>
                  </div>
                  <div className="p-5">
                    <div className="grid size-14 place-items-center rounded-2xl bg-primary font-display text-lg font-extrabold text-primary-foreground shadow-sm">
                      {(name.trim() || 'You').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase()}
                    </div>
                    <h3 className="mt-4 truncate font-display text-xl font-extrabold">{name.trim() || 'Your name'}</h3>
                    <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{user?.email}</p>

                    <dl className="mt-5 space-y-4 border-t border-border pt-4 text-sm">
                      <div>
                        <dt className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Path</dt>
                        <dd className="mt-1 font-bold">Pre-med</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Major</dt>
                        <dd className="mt-1 font-bold">{major.trim() || 'Add later'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Minors</dt>
                        <dd className="mt-1 font-bold">{pendingMinors.length ? pendingMinors.join(' · ') : 'None added'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Class year</dt>
                        <dd className="mt-1 font-bold">{classYear.trim() || 'Add later'}</dd>
                      </div>
                    </dl>
                  </div>
                </aside>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <p>
                  <b className="text-foreground">{shouldReviewLocalWorkspace(hasDeviceWork, user ? hasSeenMerge(user.id) : false) ? 'Work already exists on this device.' : existingAccount ? 'Your saved account stays intact.' : 'This account starts clean.'}</b>{' '}
                  {shouldReviewLocalWorkspace(hasDeviceWork, user ? hasSeenMerge(user.id) : false)
                    ? 'After setup, you’ll choose whether any of it belongs in this account.'
                    : existingAccount
                      ? 'Finishing setup updates these profile details only.'
                      : 'Only the profile details you enter here are added.'}
                </p>
              </div>

              <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
                <p className="text-xs font-semibold text-muted-foreground">Only your name is required. You can revise everything else later.</p>
                <Button type="submit" size="lg" className="font-display font-extrabold" disabled={!name.trim() || phase === 'saving'}>
                  {phase === 'saving' ? 'Saving…' : shouldReviewLocalWorkspace(hasDeviceWork, user ? hasSeenMerge(user.id) : false) ? 'Continue to data review' : 'Enter my workspace'}
                  {phase !== 'saving' ? <ArrowRight aria-hidden="true" /> : null}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
