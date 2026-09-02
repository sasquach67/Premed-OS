import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/common/ToastProvider'
import { createInitialDataForMode, useStore } from '@/store/store'
import { OverviewTasks } from './OverviewTasks'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))

function setInput(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('Overview task creation', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(async () => {
    useStore.getState().replaceAll(createInitialDataForMode(false))
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<MemoryRouter><ToastProvider><OverviewTasks /></ToastProvider></MemoryRouter>)
    })
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    useStore.getState().replaceAll(createInitialDataForMode(false))
  })

  it('opens the task-specific form and saves its context without the Quick Add chooser', async () => {
    const add = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'Add task')!
    await act(async () => add.click())

    expect(document.body.textContent).toContain('New task')
    expect(document.body.textContent).not.toContain('Quick Add')

    const title = document.body.querySelector<HTMLInputElement>('#new-task-title')!
    const notes = document.body.querySelector<HTMLTextAreaElement>('#new-task-notes')!
    const link = document.body.querySelector<HTMLInputElement>('#new-task-link')!
    await act(async () => {
      setInput(title, 'Email Dr. A about office hours')
      setInput(notes, 'Ask whether Thursday afternoon is available.')
      setInput(link, 'https://canvas.unc.edu/courses/123')
      ;[...document.body.querySelectorAll<HTMLButtonElement>('button')]
        .find((button) => button.textContent?.trim() === 'Academics')?.click()
      document.body.querySelector<HTMLButtonElement>('[aria-label="Mark task important"]')?.click()
    })

    await act(async () => {
      ;[...document.body.querySelectorAll<HTMLButtonElement>('button')]
        .find((button) => button.textContent?.trim() === 'Create task')?.click()
    })

    expect(useStore.getState().tasks).toHaveLength(1)
    expect(useStore.getState().tasks[0]).toMatchObject({
      title: 'Email Dr. A about office hours',
      type: 'Academics',
      notes: 'Ask whether Thursday afternoon is available.',
      fileUrl: 'https://canvas.unc.edu/courses/123',
      horizon: 'now',
      important: true,
      progress: 'Not started',
    })
  })
})
