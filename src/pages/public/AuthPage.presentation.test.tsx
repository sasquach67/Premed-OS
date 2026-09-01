import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthPage } from './AuthPage'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('@/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
  authRedirectTo: 'http://localhost/#/auth',
}))

vi.mock('@/components/public/PublicNav', () => ({ PublicNav: () => null }))
vi.mock('@/components/public/PublicFooter', () => ({ PublicFooter: () => null }))
vi.mock('@/components/public/useEnterApp', () => ({ useEnterApp: () => vi.fn() }))

function button(root: ParentNode, name: string) {
  return [...root.querySelectorAll<HTMLButtonElement>('button')]
    .find((item) => item.textContent?.trim().startsWith(name))
}

describe('AuthPage account intent', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
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
      root.render(<MemoryRouter initialEntries={['/auth']}><AuthPage /></MemoryRouter>)
    })
  }

  it('makes returning-user sign in the explicit default', async () => {
    await render()

    expect(container.querySelector('h1')?.textContent).toBe('Welcome back')
    expect(button(container, 'Sign in')?.getAttribute('aria-selected')).toBe('true')
    expect(button(container, 'Sign in with Google')).toBeTruthy()
    expect(container.querySelector('.pl-google-g path')).toBeTruthy()
    expect(container.querySelector<HTMLInputElement>('#auth-password')?.autocomplete).toBe('current-password')
  })

  it('switches the complete screen hierarchy to account creation', async () => {
    await render()

    await act(async () => button(container, 'Create account')?.click())

    expect(container.querySelector('h1')?.textContent).toBe('Create your account')
    expect(button(container, 'Create account')?.getAttribute('aria-selected')).toBe('true')
    expect(button(container, 'Sign up with Google')).toBeTruthy()
    expect(container.textContent).toContain('Start a new private workspace linked only to this account.')
    expect(container.querySelector<HTMLInputElement>('#auth-password')?.autocomplete).toBe('new-password')
    expect(button(container, 'Forgot your password?')).toBeFalsy()
  })
})
