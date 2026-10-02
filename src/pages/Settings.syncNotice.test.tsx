import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { activeStorageKey, setActiveWorkspaceOwner } from '@/lib/demoMode'
import { AccountCloudContext } from '@/store/AccountCloudContext'
import { useStore } from '@/store/store'
import type { PersistenceStatus } from '@/store/workspacePersistence'
import type { useCloudSync } from '@/store/useCloudSync'
import { Settings } from './Settings'

const wire = vi.hoisted(() => {
  const ready = { phase: 'ready', pending: 0, error: '' } as const
  const states = new Map<string, { phase: 'loading' | 'ready' | 'saving' | 'error'; pending: number; error: string }>()
  const listeners = new Set<() => void>()
  return { available: false, states, listeners, pull: vi.fn(async () => {}), push: vi.fn(async () => true), signOut: vi.fn(), write: vi.fn(async (..._args: unknown[]) => {}),
    persistence: { status: (key: string) => states.get(key) ?? ready, subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }, read: () => null, write: (...args: unknown[]) => wire.write(...args) },
  }
})
vi.mock('@/store/workspacePersistence', async importOriginal => ({ ...await importOriginal<typeof import('@/store/workspacePersistence')>(), workspacePersistence: () => wire.available ? wire.persistence : undefined }))
vi.mock('@/store/useBackup', () => ({ useBackup: () => ({ enabled: false, configured: false, connected: false, error: '', connect: vi.fn(), disconnect: vi.fn(), backupNow: vi.fn() }) }))
vi.mock('@/hooks/useCalendarSync', () => ({ useCalendarSync: () => ({ calendar: {} }) }))
vi.mock('@/lib/calendarAccess', () => ({ calendarIntegrationVisible: () => false }))
vi.mock('@/lib/supabase', () => ({ supabase: null, isSupabaseConfigured: false }))
vi.mock('@/components/common/useConfirm', () => ({ useConfirm: () => vi.fn(async () => false) }))
vi.mock('@/components/layout/shellActions', () => ({ useShellActions: () => ({ requestSignOut: wire.signOut }) }))
vi.mock('@/components/common/WeeklyCapacityCard', () => ({ WeeklyCapacityCard: () => null }))
vi.mock('@/components/common/TrashRecovery', () => ({ TrashRecovery: () => null }))
vi.mock('@/components/common/BrowserStorageStatus', () => ({ BrowserStorageStatus: () => null }))

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const transientError = 'Workspace changes are still saving or need recovery. Sync is paused.'
const savingNotice = 'Saving your changes. Sync waits until saving finishes.'
let root: Root, host: HTMLDivElement, cloud: ReturnType<typeof useCloudSync>
function state(phase: PersistenceStatus['phase']): PersistenceStatus { return { phase, pending: phase === 'saving' ? 1 : 0, error: phase === 'error' ? 'Synthetic storage failure' : '' } }
async function render() { await act(async () => root.render(<MemoryRouter><AccountCloudContext.Provider value={cloud}><Settings /></AccountCloudContext.Provider></MemoryRouter>)) }
async function publish(phase: PersistenceStatus['phase'], key = activeStorageKey()) { await act(async () => { wire.states.set(key, state(phase)); wire.listeners.forEach(listener => listener()) }) }
function notice() { return [...host.querySelectorAll('[role="status"]')].find(element => element.textContent?.trim() === savingNotice) }
function errorElement(message = transientError) { return [...host.querySelectorAll('.text-destructive')].find(element => element.textContent?.trim() === message) }
function button(label: string) { return [...host.querySelectorAll<HTMLButtonElement>('button')].find(element => element.textContent?.trim() === label)! }

beforeEach(() => {
  wire.available = false; wire.states.clear(); wire.listeners.clear(); localStorage.clear(); sessionStorage.clear()
  setActiveWorkspaceOwner({ kind: 'account', userId: 'synthetic-a' })
  useStore.persist.setOptions({ name: activeStorageKey() })
  useStore.setState(createPersonalInitialData())
  wire.available = true; wire.states.set(activeStorageKey(), state('saving'))
  wire.pull.mockClear(); wire.push.mockClear(); wire.signOut.mockClear(); wire.write.mockClear()
  cloud = { configured: true, user: { id: 'synthetic-a', email: 'synthetic@example.invalid' } as NonNullable<ReturnType<typeof useCloudSync>['user']>, status: 'error', error: transientError, progress: '', lastSyncAt: undefined, accountReady: false, conflict: undefined, protection: 'on', signIn: vi.fn(async () => true), signOut: vi.fn(async () => {}), pullNow: wire.pull, pushNow: wire.push }
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(async () => { await act(async () => root.unmount()); expect(wire.listeners.size).toBe(0); host.remove(); wire.available = false; vi.restoreAllMocks() })

describe('Settings cloud saving notice', () => {
  it('shows neutral live status only while the matching local save is pending, without starting sync', async () => {
    await render()
    expect(notice()).toBeDefined(); expect(notice()!.classList.contains('text-destructive')).toBe(false); expect(notice()!.querySelector('svg')).toBeNull()
    expect(errorElement()).toBeUndefined()
    expect(host.textContent).toContain('Cloud protection: on')
    expect(wire.pull).not.toHaveBeenCalled(); expect(wire.push).not.toHaveBeenCalled(); expect(wire.write).not.toHaveBeenCalled()
    expect(button('Pull from cloud').disabled).toBe(false); expect(button('Push now').disabled).toBe(false)
    await act(async () => { button('Pull from cloud').click(); button('Push now').click() })
    expect(wire.pull).toHaveBeenCalledTimes(1); expect(wire.push).toHaveBeenCalledTimes(1)
  })

  it('restores the existing red error after saving finishes or storage fails, without changing cloud state', async () => {
    await render(); expect(notice()).toBeDefined()
    await publish('ready'); expect(notice()).toBeUndefined(); expect(errorElement()).toBeDefined()
    expect(cloud.error).toBe(transientError); expect(cloud.accountReady).toBe(false)
    await publish('saving'); expect(notice()).toBeDefined(); expect(errorElement()).toBeUndefined()
    await publish('error'); expect(notice()).toBeUndefined(); expect(errorElement()).toBeDefined()
    expect(wire.pull).not.toHaveBeenCalled(); expect(wire.push).not.toHaveBeenCalled(); expect(wire.write).not.toHaveBeenCalled()
  })

  it.each(['ready', 'loading', 'error'] as const)('keeps the existing error red when persistence is %s', async phase => {
    wire.states.set(activeStorageKey(), state(phase)); await render()
    expect(notice()).toBeUndefined(); expect(errorElement()).toBeDefined()
  })

  it('keeps the existing error when persistence is unavailable', async () => {
    wire.available = false; await render()
    expect(notice()).toBeUndefined(); expect(errorElement()).toBeDefined()
  })

  it('does not soften unrelated cloud errors while local saving is pending', async () => {
    cloud.error = 'Synthetic cloud connection failed.'; await render()
    expect(notice()).toBeUndefined(); expect(errorElement(cloud.error)).toBeDefined()
  })

  it('keeps conflict messaging and disabled review-owned actions while local saving is pending', async () => {
    cloud.conflict = { saved: true, localRaw: '{}', remote: createPersonalInitialData(), message: 'Review the synthetic copies.' }; await render()
    expect(notice()).toBeUndefined(); expect(errorElement()).toBeDefined()
    expect(host.textContent).toContain('Sync paused — compare the account copies above.')
    expect(button('Pull from cloud').disabled).toBe(true); expect(button('Push now').disabled).toBe(true)
  })

  it('reads the active workspace after an owner change and ignores status updates for the old owner', async () => {
    await render(); const oldKey = activeStorageKey(); expect(notice()).toBeDefined()
    setActiveWorkspaceOwner({ kind: 'account', userId: 'synthetic-b' })
    const newKey = activeStorageKey(); useStore.persist.setOptions({ name: newKey }); wire.states.set(newKey, state('ready'))
    // Real workspace activation replaces profile state; the notice must also
    // re-read its owner when this store notification arrives without a save event.
    await act(async () => useStore.setState({ profile: { ...useStore.getState().profile, name: 'Synthetic second workspace' } }))
    expect(notice()).toBeUndefined(); expect(errorElement()).toBeDefined()
    await publish('saving', oldKey); expect(notice()).toBeUndefined()
    await publish('saving', newKey); expect(notice()).toBeUndefined(); expect(errorElement()).toBeDefined()
    cloud = { ...cloud, user: { ...cloud.user!, id: 'synthetic-b' } }; await render()
    expect(notice()).toBeDefined(); expect(errorElement()).toBeUndefined()
    await publish('ready', newKey); expect(notice()).toBeUndefined(); expect(errorElement()).toBeDefined()
  })

  it.each(['guest', 'different-account', 'store-owner-mismatch'] as const)('keeps the error red for %s even if that workspace is saving', async mismatch => {
    if (mismatch === 'guest') setActiveWorkspaceOwner({ kind: 'guest' })
    else if (mismatch === 'different-account') setActiveWorkspaceOwner({ kind: 'account', userId: 'synthetic-b' })
    useStore.persist.setOptions({ name: mismatch === 'store-owner-mismatch' ? 'hq:app-data:account:synthetic-b' : activeStorageKey() })
    wire.states.set(activeStorageKey(), state('saving'))
    await render(); expect(notice()).toBeUndefined(); expect(errorElement()).toBeDefined()
    expect(wire.pull).not.toHaveBeenCalled(); expect(wire.push).not.toHaveBeenCalled()
  })

  it('shows no saving notice without the exact error and leaves synced copy intact', async () => {
    cloud.error = ''; cloud.status = 'synced'; cloud.lastSyncAt = Date.now(); cloud.accountReady = true
    await render(); expect(notice()).toBeUndefined(); expect(errorElement()).toBeUndefined(); expect(host.textContent).toContain('Synced ')
  })
})
