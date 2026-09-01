/* ============================================================
   useEnterApp — what `Start tracking` actually does.

   It opens the door and nothing else: no account, no form, no server
   call. The visitor lands in the dashboard with an empty local workspace,
   and `/` shows them the app rather than the landing page from now on.

   This is the mechanism behind 05 §0.1 — the landing page is a front
   door, not a gate, and the primary action must never be `Sign up`.
   ============================================================ */
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { markEnteredApp } from '@/lib/publicLayer'
import { activeWorkspaceOwner } from '@/lib/demoMode'
import { activateGuestWorkspace } from '@/store/store'

export function useEnterApp() {
  const navigate = useNavigate()
  return useCallback(() => {
    // Preserve an unassigned pre-account workspace until its owner makes a
    // merge decision. Otherwise "Continue as guest" always opens Guest's own
    // cache, never the last signed-in account's cache.
    if (activeWorkspaceOwner().kind !== 'legacy') activateGuestWorkspace()
    markEnteredApp()
    navigate('/')
  }, [navigate])
}
