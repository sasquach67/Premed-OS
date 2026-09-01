import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type FounderAccount = {
  id: string
  email: string
  createdAt: string
  lastSignInAt: string | null
  providers: string[]
  hasWorkspace: boolean
  isFounder: boolean
}

export type FounderOverview = {
  founder: { id: string; email: string }
  metrics: {
    accounts: number
    workspaces: number
    activeLast7Days: number
    joinedLast7Days: number
    weeklyAiRequests: number
  }
  accounts: FounderAccount[]
  generatedAt: string
}

async function founderRequest<T>(body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Founder controls are unavailable because cloud services are not configured.')
  const { data, error } = await supabase.functions.invoke('founder-admin', { body })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const response = await error.context.json().catch(() => null) as { error?: string } | null
      if (response?.error === 'founder-only') throw new Error('This page is reserved for the Premed OS founder account.')
      if (response?.error === 'sign-in-required') throw new Error('Sign in with the founder account to continue.')
      if (response?.error === 'founder-is-protected') throw new Error('The founder account is protected and cannot be deleted here.')
      if (response?.error === 'confirmation-mismatch') throw new Error('The confirmation email does not match this account.')
      if (response?.error === 'account-not-found') throw new Error('That account no longer exists. Refresh the console.')
    }
    throw new Error(error.message || 'Founder controls are temporarily unavailable.')
  }
  return data as T
}

export async function loadFounderOverview(): Promise<FounderOverview> {
  return founderRequest<FounderOverview>({ action: 'overview' })
}

export async function deleteFounderManagedAccount(targetUserId: string, confirmationEmail: string) {
  return founderRequest<{ deleted: true; targetUserId: string; targetEmail: string }>({
    action: 'delete-account',
    targetUserId,
    confirmationEmail,
  })
}

export async function checkFounderAccess(): Promise<boolean> {
  if (!supabase) return false
  const { data: session } = await supabase.auth.getSession()
  if (!session.session) return false
  const { data, error } = await supabase.rpc('is_founder_admin')
  return !error && data === true
}

