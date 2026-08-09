/* ============================================================
   MergePage — local → account merge (05 §0.2).

   THIS IS THE HIGHEST-RISK SCREEN IN THE PRODUCT. It is the single most
   likely place to destroy three weeks of somebody's logged hours, so the
   rules below are not style preferences:

     • **Local data survives until the server confirms the write.** The
       upload is `upsert` → await → only then does the local store change.
       Nothing here deletes, and nothing here writes locally first.
     • **Upload is preselected**, and the safety property is stated IN THE
       PANEL rather than in a tooltip.
     • **A non-empty account gets a change-by-change review** — never an
       overwrite, never "last write wins". Every area where the two copies
       differ is listed and defaults to KEEPING THE ACCOUNT'S COPY, which
       is the choice that cannot lose server-side work. Nothing is
       auto-resolved.
     • **Shown once.** `markMergeSeen` runs on every exit path, including
       `Decide later`, so this cannot reappear on the next sign-in.
     • Counts are plain — "4 classes, 61 logged hours" — never bytes,
       never a JSON blob.
   ============================================================ */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PublicShell } from '@/components/public/PublicShell'
import { PublicNav } from '@/components/public/PublicNav'
import { supabase } from '@/lib/supabase'
import { snapshotData, useStore } from '@/store/store'
import { localCounts, localWorkSince, markMergeSeen } from '@/lib/publicLayer'
import type { AppData } from '@/lib/types'
import type { DashboardRow } from '@/lib/supabase'

type Choice = 'upload' | 'separate'
type Phase = 'loading' | 'empty-account' | 'review' | 'working' | 'error'

/** Areas a student recognises, each mapping to the `AppData` keys behind
 *  it. The review is per-area because "your experiences" is a decision a
 *  person can make and "the `organizations` array" is not. */
const AREAS = [
  { key: 'coursework', label: 'Classes and coursework', fields: ['courses', 'academics', 'requirements'] },
  { key: 'experiences', label: 'Experience hours and the people behind them', fields: ['experiences', 'persons', 'organizations', 'orgs'] },
  { key: 'mcat', label: 'MCAT — attempts, schedule, error log', fields: ['mcat'] },
  { key: 'tasks', label: 'Tasks and deadlines', fields: ['tasks', 'focusTargets', 'quarterlyGoals'] },
  { key: 'application', label: 'Schools, essays, and letters', fields: ['schools', 'stories', 'secondaries', 'letters', 'interviewQs'] },
  { key: 'profile', label: 'Profile and goals', fields: ['profile', 'goals'] },
] as const satisfies readonly { key: string; label: string; fields: readonly (keyof AppData)[] }[]

type AreaKey = (typeof AREAS)[number]['key']

/** How many records an area holds, for the "N here · M in your account"
 *  line. Object-shaped areas (profile, mcat) report 1 when non-empty. */
function areaSize(data: AppData | null, fields: readonly (keyof AppData)[]): number {
  if (!data) return 0
  let total = 0
  for (const field of fields) {
    const value = data[field]
    if (Array.isArray(value)) total += value.length
    else if (value && typeof value === 'object') {
      total += Object.values(value as Record<string, unknown>).some((v) =>
        Array.isArray(v) ? v.length > 0 : v !== undefined && v !== '' && v !== null,
      )
        ? 1
        : 0
    }
  }
  return total
}

export function MergePage() {
  const navigate = useNavigate()
  const replaceAll = useStore((s) => s.replaceAll)

  const [phase, setPhase] = useState<Phase>('loading')
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const [cloud, setCloud] = useState<AppData | null>(null)
  const [choice, setChoice] = useState<Choice>('upload')
  /** Per-area resolution. `false` = keep the account's copy (the default,
   *  and the one that cannot lose server-side work). */
  const [useLocal, setUseLocal] = useState<Record<AreaKey, boolean>>(() =>
    Object.fromEntries(AREAS.map((a) => [a.key, false])) as Record<AreaKey, boolean>,
  )

  const local = useMemo(() => snapshotData(), [])
  const counts = useMemo(() => localCounts(local), [local])
  const since = useMemo(() => localWorkSince(local), [local])

  // ── who is signed in, and what does their account already hold? ──────
  useEffect(() => {
    let alive = true
    void (async () => {
      if (!supabase) {
        navigate('/', { replace: true })
        return
      }
      const { data: session } = await supabase.auth.getSession()
      const user = session.session?.user
      if (!user) {
        navigate('/auth', { replace: true })
        return
      }
      if (!alive) return
      setUserId(user.id)
      try {
        const { data, error: e } = await supabase
          .from('dashboards')
          .select('data')
          .eq('user_id', user.id)
          .maybeSingle()
        if (e) throw e
        if (!alive) return
        const remote = (data?.data as AppData | undefined) ?? null
        setCloud(remote)
        setPhase(remote ? 'review' : 'empty-account')
      } catch (err) {
        if (!alive) return
        setError(err instanceof Error ? err.message : 'Could not read your account.')
        setPhase('error')
      }
    })()
    return () => {
      alive = false
    }
  }, [navigate])

  /** Areas where the two copies genuinely differ. Areas that match need no
   *  decision and are not shown — a review that lists everything hides the
   *  three rows that matter. */
  const conflicts = useMemo(
    () =>
      AREAS.map((area) => ({
        ...area,
        here: areaSize(local, area.fields),
        account: areaSize(cloud, area.fields),
      })).filter((a) => a.here !== a.account && (a.here > 0 || a.account > 0)),
    [local, cloud],
  )

  const finish = useCallback(
    (to: string) => {
      if (userId) markMergeSeen(userId)
      navigate(to, { replace: true })
    },
    [userId, navigate],
  )

  /** Upload into an empty account. Server first; the local store is only
   *  touched after the write is acknowledged. */
  const upload = useCallback(async () => {
    if (!supabase || !userId) return
    setPhase('working')
    setError('')
    try {
      const row: DashboardRow = {
        user_id: userId,
        data: local,
        updated_at: new Date().toISOString(),
      }
      const { error: e } = await supabase.from('dashboards').upsert(row, { onConflict: 'user_id' })
      if (e) throw e
      finish('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The upload did not finish.')
      setPhase('empty-account')
    }
  }, [userId, local, finish])

  /** Apply the reviewed merge. Starts from the ACCOUNT's copy and takes
   *  this device's version only for the areas explicitly chosen. */
  const applyReview = useCallback(async () => {
    if (!supabase || !userId || !cloud) return
    setPhase('working')
    setError('')
    try {
      const merged = { ...cloud } as unknown as Record<string, unknown>
      for (const area of AREAS) {
        if (!useLocal[area.key]) continue
        for (const field of area.fields) {
          merged[field] = local[field]
        }
      }
      const result = merged as unknown as AppData
      const row: DashboardRow = {
        user_id: userId,
        data: result,
        updated_at: new Date().toISOString(),
      }
      const { error: e } = await supabase.from('dashboards').upsert(row, { onConflict: 'user_id' })
      if (e) throw e
      // Server confirmed — only now does the device's copy change.
      replaceAll(result)
      finish('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The merge did not finish. Nothing was changed.')
      setPhase('review')
    }
  }, [userId, cloud, local, useLocal, replaceAll, finish])

  return (
    <PublicShell title="Your data — Premed HQ">
      <div className="pl-band">
        <PublicNav />
      </div>

      <div className="pl-mergewrap">
        <div className="pl-card pl-mergecard">
          <div className="pl-hd">
            <div>
              <h1 className="pl-ti">You've got work on this device</h1>
              <div className="pl-sub" style={{ marginTop: 5, fontWeight: 600 }}>
                {since
                  ? `You've been using HQ signed out since ${since}. Here's what's here — pick what happens to it.`
                  : "Here's what's on this device — pick what happens to it."}
              </div>
            </div>
          </div>

          <div className="pl-bd" style={{ gap: 15 }}>
            {error ? (
              <p className="pl-alert pl-alert-bad" role="alert">
                {error} <b>Nothing was deleted.</b>
              </p>
            ) : null}

            {/* Plain counts. Never bytes, never a JSON blob. */}
            <div
              className="pl-card"
              style={{ boxShadow: 'none', background: 'var(--pl-soft)', width: '100%' }}
            >
              <div className="pl-hd" style={{ padding: '12px 14px 6px' }}>
                <span className="pl-lbl">On this device</span>
              </div>
              <div className="pl-bd" style={{ padding: '0 14px 12px', gap: 0 }}>
                {counts.length === 0 ? (
                  <p className="pl-fine">Nothing logged yet — there's nothing to move.</p>
                ) : (
                  counts.map((row) => (
                    <div key={row.key} className="pl-frow">
                      <i className="pl-dot" style={{ ['--c' as string]: row.tint }} />
                      <span className="fn">{row.label}</span>
                      <span className="fv">{row.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {phase === 'loading' ? (
              <p className="pl-fine">Checking what your account already has…</p>
            ) : null}

            {phase === 'empty-account' || phase === 'working' ? (
              <>
                <button
                  type="button"
                  className="pl-opt"
                  data-on={choice === 'upload'}
                  onClick={() => setChoice('upload')}
                >
                  <span className="pl-radio" />
                  <span>
                    <span className="pl-ot">
                      Upload this to my account <span className="pl-rec">Recommended</span>
                    </span>
                    <span className="pl-om">
                      Everything above moves to your account and syncs across devices. Your account
                      is empty, so nothing can be overwritten.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  className="pl-opt"
                  data-on={choice === 'separate'}
                  onClick={() => setChoice('separate')}
                >
                  <span className="pl-radio" />
                  <span>
                    <span className="pl-ot">Keep them separate for now</span>
                    <span className="pl-om">
                      Sign in with an empty account. This device's data stays exactly where it is —
                      you can upload it any time from Settings → Data.
                    </span>
                  </span>
                </button>
              </>
            ) : null}

            {phase === 'review' ? (
              <>
                <p className="pl-fine">
                  <b>Your account already has data.</b> Nothing is merged automatically. Every area
                  below where the two copies differ is listed with what each one holds — pick which
                  copy this area should end up with. Anything you don't change stays as your account
                  has it.
                </p>

                {conflicts.length === 0 ? (
                  <p className="pl-fine">
                    Both copies look the same. There's nothing to resolve.
                  </p>
                ) : (
                  conflicts.map((area) => (
                    <div key={area.key} style={{ width: '100%' }}>
                      <div className="pl-frow" style={{ borderTop: 'none' }}>
                        <span className="fn">{area.label}</span>
                        <span className="fv">
                          {area.here} here · {area.account} in account
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="pl-opt"
                          style={{ flex: 1, minWidth: 200 }}
                          data-on={!useLocal[area.key]}
                          onClick={() => setUseLocal((m) => ({ ...m, [area.key]: false }))}
                        >
                          <span className="pl-radio" />
                          <span>
                            <span className="pl-ot">Keep my account's</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          className="pl-opt"
                          style={{ flex: 1, minWidth: 200 }}
                          data-on={useLocal[area.key]}
                          onClick={() => setUseLocal((m) => ({ ...m, [area.key]: true }))}
                        >
                          <span className="pl-radio" />
                          <span>
                            <span className="pl-ot">Use this device's</span>
                          </span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            ) : null}

            {/* The safety property, in the panel — never in a tooltip. */}
            <p className="pl-pace">
              <b>Nothing is deleted either way.</b> This device's copy stays until the upload
              finishes and the server confirms it. Where your account already had data, you get the
              change-by-change review above before anything merges — never an overwrite, and never
              "last write wins."
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {phase === 'review' ? (
                <button
                  type="button"
                  className="pl-sbtn pl-sbtn-p pl-sbtn-lg"
                  onClick={applyReview}
                  disabled={phase !== 'review'}
                >
                  Apply and continue
                </button>
              ) : (
                <button
                  type="button"
                  className="pl-sbtn pl-sbtn-p pl-sbtn-lg"
                  disabled={phase === 'working' || phase === 'loading'}
                  onClick={() => (choice === 'upload' ? void upload() : finish('/'))}
                >
                  {phase === 'working'
                    ? 'Uploading…'
                    : choice === 'upload'
                      ? 'Upload and continue'
                      : 'Continue without uploading'}
                </button>
              )}

              {/* `Decide later` is a real path that changes nothing. */}
              <button type="button" className="pl-lk" onClick={() => finish('/settings?tab=data')}>
                or decide later — Settings → Data
              </button>
            </div>

            <p className="pl-fine">
              Signing out never deletes what's on this device.{' '}
              <Link className="pl-lk" to="/privacy">
                How your data is handled →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PublicShell>
  )
}
