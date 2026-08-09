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

export function useEnterApp() {
  const navigate = useNavigate()
  return useCallback(() => {
    markEnteredApp()
    navigate('/')
  }, [navigate])
}
