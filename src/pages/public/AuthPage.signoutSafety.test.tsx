import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
const auth = vi.hoisted(() => ({
  getSession: vi.fn(async () => ({ data: { session: { user: { id: 'synthetic-gate', email: 'synthetic@example.invalid' } } } })),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  signOut: vi.fn(async () => ({ error: { message: 'Synthetic provider sign-out failed' } })),
}))
vi.mock('@/lib/supabase', () => ({ supabase: { auth }, isSupabaseConfigured: true, authRedirectTo: 'http://localhost/#/auth' }))
vi.mock('@/components/public/PublicNav', () => ({ PublicNav: () => null }))
vi.mock('@/components/public/PublicFooter', () => ({ PublicFooter: () => null }))
vi.mock('@/components/public/useEnterApp', () => ({ useEnterApp: () => vi.fn() }))
import { AuthPage } from './AuthPage'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { activateAccountWorkspace, snapshotData } from '@/store/store'
import { activeWorkspaceOwner, accountStorageKey } from '@/lib/demoMode'
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

it('keeps the account and displays the provider error when gate sign-out fails', async () => {
  localStorage.clear()
  const data = createPersonalInitialData(); data.notes.example = 'Keep this account'
  activateAccountWorkspace('synthetic-gate', data)
  const raw = localStorage.getItem(accountStorageKey('synthetic-gate'))
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
  const container = document.createElement('div'), root = createRoot(container)
  try {
    await act(async () => root.render(<MemoryRouter><AuthPage /></MemoryRouter>))
    expect(container.textContent).toContain("You're already signed in")
    await act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === 'Sign out')!.click())
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(activeWorkspaceOwner()).toEqual({ kind: 'account', userId: 'synthetic-gate' })
    expect(localStorage.getItem(accountStorageKey('synthetic-gate'))).toBe(raw)
    expect(snapshotData().notes.example).toBe('Keep this account')
    expect(container.querySelector('[role="alert"]')?.textContent).toBe('Synthetic provider sign-out failed')
  } finally { await act(async () => root.unmount()); confirm.mockRestore() }
})
