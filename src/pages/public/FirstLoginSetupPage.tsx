import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import type { AppData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  applyFirstLoginSetup,
  decideAccountRoute,
  FIRST_LOGIN_SETUP_ROUTE,
  FIRST_LOGIN_STUDY_ROUTE,
  hasCompletedAccountSetup,
  notifyAccountWorkspaceReady,
  profileDefaultsFromIdentity,
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
  const [school, setSchool] = useState('')
  const [major, setMajor] = useState('')
  const [classYear, setClassYear] = useState('')
  const [existingAccount, setExistingAccount] = useState<AppData | null>(null)
  const localAtEntry = useMemo(() => snapshotData(), [])
  const hasDeviceWork = useMemo(() => hasLocalWork(localAtEntry), [localAtEntry])

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
      setSchool(existingProfile?.school ?? '')
      setMajor(existingProfile?.major ?? '')
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
      setup: { name, school, major, classYear, track: 'Pre-Med' },
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

      if (!existingAccount && hasDeviceWork) {
        navigate('/auth/merge?firstLogin=1', { replace: true })
      } else {
        activateAccountWorkspace(user.id, account)
        markMergeSeen(user.id)
        notifyAccountWorkspaceReady(user.id)
        navigate(FIRST_LOGIN_STUDY_ROUTE, { replace: true })
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create your workspace.')
      setPhase('error')
    }
  }

  return (
    <div className="mx-auto max-w-4xl py-2 sm:py-6">
      <section className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
        <header
          className="relative overflow-hidden border-b border-border px-6 py-7 sm:px-8 sm:py-8"
          style={{
            background: 'radial-gradient(circle at 88% 8%, color-mix(in srgb, var(--primary) 20%, transparent), transparent 34%), linear-gradient(135deg, var(--card), color-mix(in srgb, var(--muted) 58%, var(--card)))',
          }}
        >
          <div className="relative flex items-start justify-between gap-5">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Account setup</p>
              <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Your account is ready.</h1>
              <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-muted-foreground sm:text-base">
                Add the details Premed OS should use inside your workspace. You can change them later in Profile.
              </p>
            </div>
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary sm:size-14">
              <UserRound className="size-6" aria-hidden="true" />
            </div>
          </div>
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
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border pb-5 text-sm">
                <span className="inline-flex items-center gap-2 font-bold text-foreground">
                  <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
                  Signed in
                </span>
                <span className="text-muted-foreground">{user?.email}</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup-name">Your name</Label>
                <Input
                  id="setup-name"
                  className="h-12 rounded-xl px-4 text-base"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="What should Premed OS call you?"
                  autoFocus
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="setup-school">School <span className="normal-case tracking-normal">(optional)</span></Label>
                  <Input id="setup-school" className="h-11 rounded-xl" value={school} onChange={(event) => setSchool(event.target.value)} placeholder="UNC Chapel Hill" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setup-major">Major <span className="normal-case tracking-normal">(optional)</span></Label>
                  <Input id="setup-major" className="h-11 rounded-xl" value={major} onChange={(event) => setMajor(event.target.value)} placeholder="Neuroscience" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setup-year">Class year <span className="normal-case tracking-normal">(optional)</span></Label>
                  <Input id="setup-year" className="h-11 rounded-xl" value={classYear} onChange={(event) => setClassYear(event.target.value)} placeholder="2030" inputMode="numeric" />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <p>
                  <b className="text-foreground">{!existingAccount && hasDeviceWork ? 'Work already exists on this device.' : existingAccount ? 'Your saved account stays intact.' : 'This account starts clean.'}</b>{' '}
                  {!existingAccount && hasDeviceWork
                    ? 'After setup, you’ll choose whether any of it belongs in this account.'
                    : existingAccount
                      ? 'Finishing setup updates these profile details only.'
                      : 'Only the profile details you enter here are added.'}
                </p>
              </div>

              <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
                <p className="text-xs font-semibold text-muted-foreground">You are already signed in. This step personalizes the app.</p>
                <Button type="submit" size="lg" className="font-display font-extrabold" disabled={!name.trim() || phase === 'saving'}>
                  {phase === 'saving' ? 'Saving…' : !existingAccount && hasDeviceWork ? 'Continue to data review' : 'Finish setup'}
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
