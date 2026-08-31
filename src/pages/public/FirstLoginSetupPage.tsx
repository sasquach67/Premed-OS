import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { PublicNav } from '@/components/public/PublicNav'
import { PublicShell } from '@/components/public/PublicShell'
import {
  buildFirstAccountWorkspace,
  decideAccountRoute,
  FIRST_LOGIN_STUDY_ROUTE,
  notifyAccountWorkspaceReady,
  profileDefaultsFromIdentity,
} from '@/lib/accountWorkspace'
import { markEnteredApp, markMergeSeen, hasLocalWork, hasSeenMerge } from '@/lib/publicLayer'
import { supabase, type DashboardRow } from '@/lib/supabase'
import { dataForRemote } from '@/lib/storyPrivacy'
import { snapshotData, useStore } from '@/store/store'

type Phase = 'loading' | 'ready' | 'saving' | 'error'

export function FirstLoginSetupPage() {
  const navigate = useNavigate()
  const replaceAll = useStore((state) => state.replaceAll)
  const [phase, setPhase] = useState<Phase>('loading')
  const [error, setError] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [major, setMajor] = useState('')
  const [classYear, setClassYear] = useState('')
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
        .select('user_id')
        .eq('user_id', currentUser.id)
        .maybeSingle()
      if (!alive) return
      if (dashboardError) {
        setError(dashboardError.message)
        setPhase('error')
        return
      }
      if (existing) {
        const route = decideAccountRoute({
          pathname: '/auth/setup',
          hasRemote: true,
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
      setUser(currentUser)
      setName(defaults.name)
      setPhase('ready')
    })()
    return () => { alive = false }
  }, [navigate])

  async function finishSetup() {
    if (!supabase || !user || !name.trim()) return
    setPhase('saving')
    setError('')
    const account = buildFirstAccountWorkspace({
      identity: { email: user.email, metadata: user.user_metadata },
      setup: { name, school, major, classYear, track: 'Pre-Med' },
    })
    try {
      const row: DashboardRow = {
        user_id: user.id,
        data: dataForRemote(account),
        updated_at: new Date().toISOString(),
      }
      // Insert-only prevents first-login setup from overwriting a row that
      // appeared after the initial account check.
      const { error: writeError } = await supabase.from('dashboards').insert(row)
      if (writeError) throw writeError

      // Provider metadata is display-only; dashboard RLS still owns access.
      await supabase.auth.updateUser({ data: { ...user.user_metadata, full_name: name.trim() } })
      markEnteredApp()

      if (hasDeviceWork) {
        navigate('/auth/merge?firstLogin=1', { replace: true })
      } else {
        replaceAll(account)
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
    <PublicShell title="Set up your account — Premed OS">
      <div className="pl-band"><PublicNav /></div>
      <main className="pl-authwrap">
        <div className="pl-authstack" style={{ maxWidth: 680 }}>
          <div className="pl-card pl-authcard">
            <div className="pl-hd">
              <div>
                <span className="pl-lbl">First login</span>
                <h1 className="pl-ti" style={{ marginTop: 6 }}>Make this workspace yours</h1>
                <p className="pl-sub" style={{ marginTop: 6 }}>
                  Confirm your identity before Premed OS creates anything for this account.
                </p>
              </div>
              <div className="pl-mailbadge"><UserRound aria-hidden="true" /></div>
            </div>

            <div className="pl-bd" style={{ gap: 16 }}>
              {error ? <p className="pl-alert pl-alert-bad" role="alert">{error}</p> : null}
              {phase === 'loading' ? <p className="pl-fine">Checking your account…</p> : null}

              {phase !== 'loading' ? (
                <>
                  <div className="pl-field">
                    <label className="pl-lbl" htmlFor="setup-name">Your name</label>
                    <input id="setup-name" className="pl-inp" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="What should Premed OS call you?" autoFocus />
                  </div>

                  <div className="pl-field">
                    <label className="pl-lbl" htmlFor="setup-email">Account email</label>
                    <input id="setup-email" className="pl-inp" value={user?.email ?? ''} readOnly aria-readonly="true" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, width: '100%' }}>
                    <div className="pl-field">
                      <label className="pl-lbl" htmlFor="setup-school">School <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                      <input id="setup-school" className="pl-inp" value={school} onChange={(event) => setSchool(event.target.value)} placeholder="UNC Chapel Hill" />
                    </div>
                    <div className="pl-field">
                      <label className="pl-lbl" htmlFor="setup-major">Major <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                      <input id="setup-major" className="pl-inp" value={major} onChange={(event) => setMajor(event.target.value)} placeholder="Neuroscience" />
                    </div>
                    <div className="pl-field">
                      <label className="pl-lbl" htmlFor="setup-year">Class year <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                      <input id="setup-year" className="pl-inp" value={classYear} onChange={(event) => setClassYear(event.target.value)} placeholder="2030" />
                    </div>
                  </div>

                  <div className="pl-pace" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <ShieldCheck style={{ width: 18, flex: 'none', marginTop: 2 }} aria-hidden="true" />
                    <span>
                      <b>{hasDeviceWork ? 'Work already exists on this device.' : 'This account starts clean.'}</b>{' '}
                      {hasDeviceWork
                        ? 'Nothing here is copied automatically. After setup, you’ll review which parts—if any—belong in this account.'
                        : 'The first account snapshot contains only the profile details you confirm above.'}
                    </span>
                  </div>

                  <button type="button" className="pl-sbtn pl-sbtn-p pl-sbtn-full" disabled={!name.trim() || phase === 'saving'} onClick={() => { void finishSetup() }}>
                    {phase === 'saving' ? 'Creating your workspace…' : hasDeviceWork ? 'Continue to data review' : 'Create my workspace'}
                    {phase !== 'saving' ? <ArrowRight aria-hidden="true" /> : null}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </PublicShell>
  )
}
