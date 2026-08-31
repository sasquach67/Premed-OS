import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const cloud = vi.hoisted(() => ({
  signOut: vi.fn(async () => undefined),
}))

vi.mock('@/store/useCloudSync', () => ({
  useCloudSync: () => ({ user: { id: 'student-1' }, signOut: cloud.signOut }),
}))
vi.mock('@/store/useTheme', () => ({ useTheme: () => undefined }))
vi.mock('@/store/useBackup', () => ({ useBackup: () => undefined }))
vi.mock('./Sidebar', () => ({
  Sidebar: ({ onSignOut }: { onSignOut?: () => void }) => <button type="button" onClick={onSignOut}>Sign out</button>,
}))
vi.mock('./Topbar', () => ({ Topbar: () => null }))
vi.mock('./QuickAddDialog', () => ({ QuickAddDialog: () => null }))
vi.mock('./HelpFeedbackLauncher', () => ({ HelpFeedbackLauncher: () => null }))

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="Current route">{location.pathname}</output>
}

describe('AppShell sign out', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    cloud.signOut.mockClear()
    cloud.signOut.mockResolvedValue(undefined)
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  async function render() {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/academics']}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="academics" element={<div>Inside app</div>} />
            </Route>
            <Route path="landing" element={<div>Public landing</div>} />
          </Routes>
          <LocationProbe />
        </MemoryRouter>,
      )
    })
  }

  it('asks before signing out, allows cancel, and redirects after confirmation', async () => {
    await render()

    await act(async () => {
      ;[...document.body.querySelectorAll('button')].find((button) => button.textContent === 'Sign out')?.click()
    })
    expect(document.body.textContent).toContain('Sign out of Premed OS?')
    expect(cloud.signOut).not.toHaveBeenCalled()

    await act(async () => {
      ;[...document.body.querySelectorAll('button')].find((button) => button.textContent === 'Stay signed in')?.click()
    })
    expect(document.body.querySelector('[aria-label="Current route"]')?.textContent).toBe('/academics')
    expect(cloud.signOut).not.toHaveBeenCalled()

    await act(async () => {
      ;[...document.body.querySelectorAll('button')].find((button) => button.textContent === 'Sign out')?.click()
    })
    const confirm = [...document.body.querySelectorAll('button')].filter((button) => button.textContent === 'Sign out').at(-1)
    await act(async () => confirm?.click())

    expect(cloud.signOut).toHaveBeenCalledTimes(1)
    expect(document.body.querySelector('[aria-label="Current route"]')?.textContent).toBe('/landing')
    expect(document.body.textContent).toContain('Public landing')
  })

  it('stays in the app and explains the problem when sign out fails', async () => {
    cloud.signOut.mockRejectedValueOnce(new Error('Session could not be cleared.'))
    await render()

    await act(async () => {
      ;[...document.body.querySelectorAll('button')].find((button) => button.textContent === 'Sign out')?.click()
    })
    const confirm = [...document.body.querySelectorAll('button')].filter((button) => button.textContent === 'Sign out').at(-1)
    await act(async () => confirm?.click())

    expect(document.body.querySelector('[aria-label="Current route"]')?.textContent).toBe('/academics')
    expect(document.body.getAttribute('aria-busy')).not.toBe('true')
    expect(document.body.textContent).toContain('Session could not be cleared.')
    expect(document.body.textContent).toContain('Sign out of Premed OS?')
  })
})
