import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FounderConsole } from './FounderConsole'
import { deleteFounderManagedAccount, loadFounderOverview } from '@/lib/founderAdmin'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('@/lib/founderAdmin', () => ({
  loadFounderOverview: vi.fn(),
  deleteFounderManagedAccount: vi.fn(),
}))

const overview = {
  founder: { id: 'founder-id', email: 'elephon08@gmail.com' },
  metrics: { accounts: 2, workspaces: 2, activeLast7Days: 1, joinedLast7Days: 0, weeklyAiRequests: 7 },
  accounts: [
    { id: 'founder-id', email: 'elephon08@gmail.com', createdAt: '2026-07-18T19:45:11Z', lastSignInAt: '2026-09-01T12:48:47Z', providers: ['email', 'google'], hasWorkspace: true, isFounder: true },
    { id: 'student-id', email: 'student@example.com', createdAt: '2026-08-20T10:00:00Z', lastSignInAt: null, providers: ['email'], hasWorkspace: true, isFounder: false },
  ],
  generatedAt: '2026-09-01T14:00:00Z',
}

function findButton(root: ParentNode, label: string) {
  return [...root.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes(label))
}

describe('FounderConsole', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.mocked(loadFounderOverview).mockResolvedValue(overview)
    vi.mocked(deleteFounderManagedAccount).mockResolvedValue({ deleted: true, targetUserId: 'student-id', targetEmail: 'student@example.com' })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  async function render() {
    await act(async () => {
      root.render(<FounderConsole />)
      await Promise.resolve()
    })
  }

  it('renders live aggregates and protects the founder row', async () => {
    await render()
    expect(container.textContent).toContain('Founder control')
    expect(container.textContent).toContain('elephon08@gmail.com')
    expect(container.textContent).toContain('Protected founder')
    expect(container.textContent).toContain('Cannot delete')
    expect(container.textContent).toContain('student@example.com')
    expect(container.textContent).toContain('7')
  })

  it('requires the exact account email before deletion', async () => {
    await render()
    await act(async () => findButton(container, 'Delete')?.click())

    const input = document.body.querySelector<HTMLInputElement>('[aria-label="Confirmation email"]')
    const deleteButton = findButton(document.body, 'Delete account')
    expect(input).toBeTruthy()
    expect(deleteButton?.disabled).toBe(true)

    await act(async () => {
      if (!input) return
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(input, 'student@example.com')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(findButton(document.body, 'Delete account')?.disabled).toBe(false)

    await act(async () => findButton(document.body, 'Delete account')?.click())
    expect(deleteFounderManagedAccount).toHaveBeenCalledWith('student-id', 'student@example.com')
  })
})

