/* Both exits from the highest-risk screen in the product.
 *
 * The deferral used to be labelled "or decide later" and commented as "a real
 * path that changes nothing", while it switched the open workspace to the
 * account's cloud copy. These tests pin the two things that made that a bug:
 * what each control is called, and what each one actually does. */
import { act } from 'react'
import { webcrypto } from 'node:crypto'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { GUEST_STORAGE_KEY, accountStorageKey, activeWorkspaceOwner } from '@/lib/demoMode'
import { activateGuestWorkspace, snapshotData, useStore } from '@/store/store'
import type { AppData } from '@/lib/types'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const USER_ID = 'account-a'

function tree(name: string, courseId: string): AppData {
  const data = createPersonalInitialData()
  data.profile.name = name
  data.courses.push({
    id: courseId, term: 'Fall 2026', code: courseId.toUpperCase(), title: `${name} course`,
    credits: 3, grade: '', bcpm: false, status: 'planned', inResidence: true, satisfies: [], order: 0,
  })
  return data
}

const cloudTree = tree('Account copy', 'cloud-101')
const upserted: Array<Record<string, unknown>> = []
const navigated: string[] = []

const dashboards = vi.hoisted(() => ({ rows: new Map<string, unknown>(), writes: (_value: unknown, _userId: string) => {} }))
vi.mock('@/lib/supabase', async () => {
  const { fakeDashboardsTable } = await import('@/test/fakeDashboards')
  return {
    supabase: {
      auth: {
        getSession: async () => ({ data: { session: { user: { id: USER_ID } } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
      from: () => fakeDashboardsTable(dashboards),
    },
    isSupabaseConfigured: true,
    authRedirectTo: 'http://localhost/#/auth',
  }
})

vi.mock('@/components/public/PublicNav', () => ({ PublicNav: () => null }))
vi.mock('@/components/layout/AccountSyncNotice', () => ({ AccountSyncNotice: () => null }))
vi.mock('@/store/workspaceRecoveryRepository', () => {
  const copies = new Map<string, { workspaceKey: string; id: string; stored: string; sha256: string }>()
  return { workspaceRecoveryRepository: () => ({
    save: async (copy: { workspaceKey: string; id: string; stored: string; sha256: string }) => { copies.set(copy.id, copy) },
    read: async (_key: string, id: string) => copies.get(id) ?? null,
  }) }
})
vi.mock('@/components/public/PublicShell', () => ({
  PublicShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => (to: string) => { navigated.push(to) } }
})

const { MergePage } = await import('./MergePage')

function button(root: ParentNode, text: string) {
  return [...root.querySelectorAll<HTMLButtonElement>('button')]
    .find((item) => item.textContent?.trim().startsWith(text))
}

describe('MergePage exits', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(async () => {
    vi.stubGlobal('crypto', webcrypto)
    upserted.length = 0
    dashboards.rows = new Map([[USER_ID, { data: structuredClone(cloudTree), updated_at: '2026-09-12T00:00:00.000Z' }]])
    dashboards.writes = (value, userId) => { upserted.push({ ...(value as Record<string, unknown>), user_id: userId }) }
    navigated.length = 0
    localStorage.clear()
    useStore.persist.setOptions({ name: GUEST_STORAGE_KEY })
    activateGuestWorkspace()
    // Work done on this device before signing in.
    useStore.getState().replaceAll(tree('This device', 'local-101'))
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    localStorage.clear()
    useStore.persist.setOptions({ name: GUEST_STORAGE_KEY })
    activateGuestWorkspace()
    vi.unstubAllGlobals()
  })

  async function render() {
    await act(async () => {
      root.render(<MemoryRouter initialEntries={['/auth/merge']}><MergePage /></MemoryRouter>)
    })
  }

  it('names the deferral for the workspace switch it performs', async () => {
    await render()

    expect(container.textContent).toContain('Use my account workspace and review this later')
    // The old label promised a no-op it never delivered.
    expect(container.textContent).not.toContain('decide later —')
  })

  it('deferring opens the account workspace and uploads nothing', async () => {
    await render()

    await act(async () => { button(container, 'Use my account workspace')?.click() })
    await vi.waitFor(async () => { await act(async () => {}); expect(navigated.length).toBeGreaterThan(0) }, { interval: 1 })

    expect(upserted).toHaveLength(0)
    expect(activeWorkspaceOwner()).toEqual({ kind: 'account', userId: USER_ID })
    expect(snapshotData().profile.name).toBe('Account copy')
    expect(navigated.at(-1)).toContain('/settings')
  })

  it('deferring leaves this device’s signed-out work intact in its own namespace', async () => {
    await render()

    await act(async () => { button(container, 'Use my account workspace')?.click() })
    await vi.waitFor(async () => { await act(async () => {}); expect(navigated.length).toBeGreaterThan(0) }, { interval: 1 })
    activateGuestWorkspace()

    expect(snapshotData().profile.name).toBe('This device')
    expect(snapshotData().courses.map((course) => course.id)).toEqual(['local-101'])
  })

  it('applying uploads the reviewed result before the device copy changes', async () => {
    await render()

    await act(async () => { button(container, 'Apply and continue')?.click() })
    await vi.waitFor(async () => { await act(async () => {}); expect(navigated.length).toBeGreaterThan(0) }, { interval: 1 })

    expect(upserted).toHaveLength(1)
    expect(upserted[0].user_id).toBe(USER_ID)
    expect(activeWorkspaceOwner()).toEqual({ kind: 'account', userId: USER_ID })
    expect(navigated.at(-1)).not.toContain('/settings')
  })

  it('applying defaults to the account copy for every area it did not ask about', async () => {
    await render()

    await act(async () => { button(container, 'Apply and continue')?.click() })
    await vi.waitFor(async () => { await act(async () => {}); expect(navigated.length).toBeGreaterThan(0) }, { interval: 1 })

    // Nothing was toggled to "use this device's", so the account's records win
    // — the choice that cannot lose server-side work.
    const uploaded = upserted[0].data as AppData
    expect(uploaded.courses.map((course) => course.id)).toEqual(['cloud-101'])
  })

  it('writes the account workspace to the account namespace, never Guest', async () => {
    await render()

    await act(async () => { button(container, 'Apply and continue')?.click() })
    await vi.waitFor(async () => { await act(async () => {}); expect(navigated.length).toBeGreaterThan(0) }, { interval: 1 })

    expect(localStorage.getItem(accountStorageKey(USER_ID))).toBeTruthy()
    const guestBlob = localStorage.getItem(GUEST_STORAGE_KEY)
    expect(guestBlob).not.toContain('cloud-101')
  })
  it('carries the chosen Research parent, all children, people and unassigned notes into outgoing and reloaded account data', async () => {
    const guest = createPersonalInitialData()
    guest.experiences = [{ id: 'lab', category: 'research', org: 'Lab', role: 'Assistant', description: '', status: 'active', tags: [], order: 0, research: { current: true, lastPiContact: '2026-09-24' } }]
    const envelope = { createdAt: 1, updatedAt: 1, archived: false, order: 0 }
    guest.experienceHourEntries = [{ ...envelope, id: 'zero-log', experienceId: 'lab', kind: 'logged', date: '2026-09-24', hours: 0, note: 'Observed', thoughts: 'Ask why' }]
    guest.researchUpcomingItems = [{ ...envelope, id: 'upcoming', experienceId: 'lab', date: '2026-09-25', title: 'Meeting' }]
    guest.researchReminders = [{ ...envelope, id: 'reminder', experienceId: 'lab', text: 'Read protocol' }]
    guest.researchTimelineNotes = [{ ...envelope, id: 'timeline', experienceId: 'lab', date: '2026-09-24', text: 'Started' }]
    guest.persons = [{ ...envelope, id: 'person', name: 'Mentor', bio: 'Studies cells' }]
    guest.researchMemberships = [{ ...envelope, id: 'membership', experienceId: 'lab', personId: 'person', roleInLab: 'Mentor', projectText: 'Cell biology' }]
    guest.notePages = [{ id: 'legacy', title: 'Earlier', body: 'Original long note', pillar: 'research', updatedAt: 1, order: 0 }, { id: 'clinical-note', title: 'Other pillar', body: 'Unchanged', pillar: 'clinical', updatedAt: 1, order: 1 }]
    useStore.getState().replaceAll(guest)
    await render()
    // Select exactly experiences and notes; coursework/profile retain their account choices.
    for (const label of ['Experience hours and the people behind them', 'Notes from every pillar']) {
      const heading = [...container.querySelectorAll('span.fn')].find((element) => element.textContent === label)
      const area = heading?.parentElement?.parentElement
      expect(area).toBeTruthy()
      await act(async () => { button(area!, "Use this device's")?.click() })
    }
    await act(async () => { button(container, 'Apply and continue')?.click() })
    await vi.waitFor(async () => { await act(async () => {}); expect(upserted).toHaveLength(1) }, { interval: 1 })
    const uploaded = upserted[0].data as AppData
    for (const field of ['experiences', 'experienceHourEntries', 'researchUpcomingItems', 'researchReminders', 'researchTimelineNotes', 'researchMemberships', 'persons', 'notePages'] as const) {
      expect(uploaded[field]).toEqual(guest[field])
      expect(snapshotData()[field]).toEqual(guest[field])
    }
    expect(uploaded.courses.map((course) => course.id)).toEqual(['cloud-101'])
    expect(uploaded.notePages.find((note) => note.id === 'legacy')).not.toHaveProperty('experienceId')
    expect(activeWorkspaceOwner()).toEqual({ kind: 'account', userId: USER_ID })
    activateGuestWorkspace()
    expect(snapshotData().experienceHourEntries).toEqual(guest.experienceHourEntries)
  })

})
