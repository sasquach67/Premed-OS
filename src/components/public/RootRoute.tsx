/* ============================================================
   RootRoute — what `/` shows.

   The landing page is a FRONT DOOR, NOT A GATE (05 §0.1). So `/` shows it
   only to someone for whom it is actually the front door: no session, no
   work on this device, and they have never clicked `Start tracking`.
   Everyone else — every existing user, every signed-in user, anyone who
   has typed a single thing into Premed OS — gets their dashboard, exactly as
   before this chunk existed.

   Nothing new gates the app. Failing every check below costs a visitor one
   click, and signed-out mode remains the whole product.
   ============================================================ */
import { lazy, useEffect, useState, useSyncExternalStore } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { hasEnteredApp, subscribePublicMeta } from '@/lib/publicLayer'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

/** Lazy so the landing page and its stylesheet stay out of the bundle an
 *  existing user downloads — they will never render it. */
const Landing = lazy(() => import('@/pages/public/Landing').then((m) => ({ default: m.Landing })))

/** `undefined` while the session is still being read — the landing page
 *  must not flash in front of a signed-in user. */
function useSignedIn(): boolean | undefined {
  const [signedIn, setSignedIn] = useState<boolean | undefined>(
    isSupabaseConfigured ? undefined : false,
  )
  useEffect(() => {
    if (!supabase) return
    let alive = true
    void supabase.auth.getSession().then(({ data }) => {
      if (alive) setSignedIn(Boolean(data.session?.user))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive) setSignedIn(Boolean(session?.user))
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])
  return signedIn
}

/** `/landing` — the landing page, unconditionally.
 *
 *  `/` is deliberately a one-way trip: once a browser has used Premed OS it shows
 *  the dashboard forever, which is right for a visitor and makes the front
 *  door impossible to look at again. This route is the way back in. It is
 *  not a dev backdoor — it is the URL any "what is this?" link should point
 *  at, and Settings links to it. */
export function LandingRoute() {
  return <Landing />
}

export function RootRoute() {
  // `hasEnteredApp` already covers "this browser has used Premed OS before", so
  // an existing installation never reaches the landing page.
  const entered = useSyncExternalStore(subscribePublicMeta, hasEnteredApp, () => true)
  const signedIn = useSignedIn()

  if (signedIn === undefined) return null
  return !entered && !signedIn ? <Landing /> : <AppShell />
}
