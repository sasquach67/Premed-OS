import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSeedData } from '@/data/seed'
import { useStore } from '@/store/store'
import { ReviewItemPage } from './ReviewItemPage'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))

describe('ReviewItemPage', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    const data = createSeedData()
    data.persons = [
      { id: 'dr-a', name: 'Dr. A', email: 'course@example.edu', createdAt: 1, updatedAt: 1, archived: false, order: 0 },
      { id: 'fatima', name: 'Fatima', email: 'course@example.edu', createdAt: 1, updatedAt: 1, archived: false, order: 1 },
    ]
    useStore.getState().replaceAll(data)
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  it('opens the selected pair and lets the student keep distinct people separate', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/review?item=duplicate-person%3Adr-a%3Afatima']}>
          <ReviewItemPage />
        </MemoryRouter>,
      )
    })

    expect(container.textContent).toContain('Dr. A and Fatima')
    expect(container.querySelectorAll('input[value="course@example.edu"]')).toHaveLength(2)

    const keepSeparate = [...container.querySelectorAll('button')]
      .find((button) => button.textContent === 'These are different people')
    await act(async () => keepSeparate?.click())

    expect(useStore.getState().settings.attentionSnoozedUntil['duplicate-person:dr-a:fatima']).toBe(Number.MAX_SAFE_INTEGER)
    expect(container.textContent).toContain('Review complete')
  })
})
