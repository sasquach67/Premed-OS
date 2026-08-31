/* ============================================================
   MergeGate — sends a signed-out user with local work to `/auth/merge`
   the first time they sign in, and exactly once (05 §0.2 · P1 §7).

   It renders nothing. It exists because a magic link lands the user back
   on the app's base URL, not on the auth page, so the decision cannot
   live inside `AuthPage`.

   The condition is narrow on purpose: a session, work on this device, and
   no recorded decision for this account. Anyone who has already chosen —
   including via `Decide later` — never sees the screen again.
   ============================================================ */
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { snapshotData } from '@/store/store'
import { hasLocalWork, hasSeenMerge, markEnteredApp } from '@/lib/publicLayer'
import { decideAccountRoute } from '@/lib/accountWorkspace'

export function MergeGate() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const handled = useRef<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    if (pathname === '/auth') {
      handled.current = null
      return
    }
    let alive = true

    const consider = async (userId: string | undefined) => {
      if (!userId) {
        handled.current = null
        return
      }
      // Signing in is entering — `/` must not fall back to the landing page.
      markEnteredApp()
      const handledKey = `${userId}:${pathname}`
      if (handled.current === handledKey) return
      handled.current = handledKey

      const { data, error } = await supabase!
        .from('dashboards')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()
      if (!alive || error) return

      const route = decideAccountRoute({
        pathname,
        hasRemote: Boolean(data),
        hasLocalWork: hasLocalWork(snapshotData()),
        hasSeenMerge: hasSeenMerge(userId),
      })
      if (route) navigate(route, { replace: true })
    }

    void supabase.auth.getSession().then(({ data }) => { void consider(data.session?.user?.id) })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      { void consider(session?.user?.id) },
    )
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [navigate, pathname])

  return null
}
