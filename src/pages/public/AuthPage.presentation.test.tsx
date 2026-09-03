import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthPage } from './AuthPage'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(async () => ({ data: { session: null } })),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  signUp: vi.fn(async () => ({ data: { user: { id: 'new-user' }, session: null }, error: null })),
  resend: vi.fn(async () => ({ error: null })),
  signInWithPassword: vi.fn(async () => ({ error: null })),
  signInWithOtp: vi.fn(async () => ({ error: null })),
  resetPasswordForEmail: vi.fn(async () => ({ error: null })),
  signInWithOAuth: vi.fn(async () => ({ error: null })),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: authMocks },
  isSupabaseConfigured: true,
  authRedirectTo: 'http://localhost/#/auth',
}))

vi.mock('@/components/public/PublicNav', () => ({ PublicNav: () => null }))
vi.mock('@/components/public/PublicFooter', () => ({ PublicFooter: () => null }))
vi.mock('@/components/public/useEnterApp', () => ({ useEnterApp: () => vi.fn() }))

function button(root: ParentNode, name: string) {
  return [...root.querySelectorAll<HTMLButtonElement>('button')]
    .find((item) => item.textContent?.trim().startsWith(name))
}

function enter(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('AuthPage account intent', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.clearAllMocks()
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
    expect(container.querySelector<HTMLInputElement>('#auth-email')?.placeholder).toBe('Personal or school email')
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

  it('makes account creation password requirements visible, live, and confirmable', async () => {
    await render()
    await act(async () => button(container, 'Create account')?.click())

    const password = container.querySelector<HTMLInputElement>('#auth-password')
    const confirmation = container.querySelector<HTMLInputElement>('#auth-confirm-password')
    const email = container.querySelector<HTMLInputElement>('#auth-email')
    expect(container.querySelector('button[aria-label="Show password"]')).toBeTruthy()
    expect(confirmation?.autocomplete).toBe('new-password')
    expect(container.querySelector('[aria-label="At least 8 characters: not met"]')).toBeTruthy()

    await act(async () => {
      if (!password || !confirmation || !email) return
      enter(email, 'student@example.edu')
      enter(password, 'Strong1!')
      enter(confirmation, 'Strong1!')
    })

    expect(container.querySelector('[aria-label="At least 8 characters: met"]')).toBeTruthy()
    expect(container.querySelector('[aria-label="Passwords match: met"]')).toBeTruthy()

    const reveal = container.querySelector<HTMLButtonElement>('button[aria-label="Show password"]')
    await act(async () => reveal?.click())
    expect(password?.type).toBe('text')

    const create = container.querySelector<HTMLButtonElement>('.pl-auth-method-panel .pl-sbtn-p')
    expect(create?.disabled).toBe(false)
    await act(async () => {
      create?.click()
      await Promise.resolve()
    })

    expect(authMocks.signUp).toHaveBeenCalledWith({
      email: 'student@example.edu',
      password: 'Strong1!',
      options: { emailRedirectTo: 'http://localhost/#/auth' },
    })
    expect(container.querySelector('h1')?.textContent).toBe('Check your email')
    expect(container.textContent).toContain('account confirmation link')
  })

  it('identifies a stricter server password policy as a configuration problem', async () => {
    authMocks.signUp.mockRejectedValueOnce(new Error('Password should be at least 88 characters.'))
    await render()
    await act(async () => button(container, 'Create account')?.click())

    const email = container.querySelector<HTMLInputElement>('#auth-email')
    const password = container.querySelector<HTMLInputElement>('#auth-password')
    const confirmation = container.querySelector<HTMLInputElement>('#auth-confirm-password')

    await act(async () => {
      if (!email || !password || !confirmation) return
      enter(email, 'student@example.edu')
      enter(password, 'Strong1!')
      enter(confirmation, 'Strong1!')
      container.querySelector<HTMLButtonElement>('.pl-auth-method-panel .pl-sbtn-p')?.click()
      await Promise.resolve()
    })

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Password account creation is temporarily misconfigured',
    )
    expect(container.querySelector('[role="alert"]')?.textContent).not.toBe(
      'Use at least 8 characters with uppercase, lowercase, a number, and a symbol.',
    )
  })
})
