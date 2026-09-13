import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { activateGuestWorkspace, useStore } from '@/store/store'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const mocks = vi.hoisted(() => ({
  prepare: vi.fn(), write: vi.fn(), activate: vi.fn(), check: vi.fn(), dispose: vi.fn(), ready: vi.fn(), navigate: vi.fn(),
  saved: false,
}))
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: { id: 'setup-synthetic', email: 'synthetic@example.test', user_metadata: { full_name: 'Synthetic Student' } } }, error: null }),
      updateUser: async () => ({ error: null }),
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
  },
}))
vi.mock('@/store/accountMutationSafety', () => ({
  prepareAccountMutation: mocks.prepare,
  accountMutationFailure: (error: Error, mutation?: { serverSaved: boolean }) => mutation?.serverSaved ? `The cloud accepted the change, but local completion was not confirmed. ${error.message}` : error.message,
}))
vi.mock('@/components/layout/AccountSyncNotice', () => ({ AccountSyncNotice: () => null }))
vi.mock('@/lib/publicLayer', async () => ({ ...await vi.importActual<object>('@/lib/publicLayer'), hasSeenMerge: () => true }))
vi.mock('@/lib/accountWorkspace', async () => ({ ...await vi.importActual<object>('@/lib/accountWorkspace'), notifyAccountWorkspaceReady: mocks.ready }))
vi.mock('react-router-dom', async () => ({ ...await vi.importActual<object>('react-router-dom'), useNavigate: () => mocks.navigate }))
const { FirstLoginSetupPage } = await import('./FirstLoginSetupPage')
let root: Root, container: HTMLDivElement
beforeEach(async () => {
  vi.clearAllMocks(); mocks.saved = false
  localStorage.clear(); sessionStorage.clear(); activateGuestWorkspace()
  useStore.getState().replaceAll(createPersonalInitialData())
  mocks.write.mockImplementation(async () => { mocks.saved = true })
  mocks.check.mockResolvedValue(undefined); mocks.activate.mockImplementation(() => {})
  mocks.prepare.mockResolvedValue({ get serverSaved() { return mocks.saved }, write: mocks.write, activate: mocks.activate, check: mocks.check, dispose: mocks.dispose })
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container)
  await act(async () => root.render(<MemoryRouter><FirstLoginSetupPage /></MemoryRouter>))
})
afterEach(async () => { await act(async () => root.unmount()); container.remove() })
async function submit() { await act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) }) }

it('does not write or publish account-ready when preflight rejects conflicting copies', async () => {
  mocks.prepare.mockRejectedValueOnce(new Error('Account copies need review'))
  await submit()
  expect(mocks.write).not.toHaveBeenCalled()
  expect(mocks.activate).not.toHaveBeenCalled()
  expect(mocks.ready).not.toHaveBeenCalled()
  expect(container.textContent).toContain('Account copies need review')
})
it('does not call a server-success/local-failure operation unchanged', async () => {
  mocks.activate.mockImplementationOnce(() => { throw new Error('Local persistence failed') })
  await submit()
  expect(mocks.write).toHaveBeenCalledTimes(1)
  expect(mocks.ready).not.toHaveBeenCalled()
  expect(container.textContent).toContain('cloud accepted')
  expect(mocks.dispose).toHaveBeenCalledTimes(1)
})
it('publishes readiness only after the durable activation returns', async () => {
  await submit()
  expect(mocks.activate).toHaveBeenCalledTimes(1)
  expect(mocks.ready).toHaveBeenCalledTimes(1)
  expect(mocks.activate.mock.invocationCallOrder[0]).toBeLessThan(mocks.ready.mock.invocationCallOrder[0])
})
