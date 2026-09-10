import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider, type ToastInput } from './ToastProvider'
import { useToast } from './useToast'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
let container: HTMLDivElement
let notify: (input: ToastInput) => string

function Harness() {
  const toast = useToast()
  useEffect(() => { notify = toast }, [toast])
  return <button>Outside notification</button>
}

beforeEach(async () => {
  vi.useFakeTimers()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<ToastProvider><Harness /></ToastProvider>))
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.useRealTimers()
})

async function advance(ms: number) {
  await act(async () => vi.advanceTimersByTime(ms))
}

describe('notification dismissal', () => {
  it('shows only the newest deletion notice and clears it without undoing the deletions', async () => {
    const undo = vi.fn()
    await act(async () => {
      for (const kind of ['Lecture', 'Assignment', 'Task']) notify({ title: `${kind} deleted`, onUndo: undo })
    })
    await advance(6000)
    expect(container.querySelectorAll('[aria-label="Dismiss notification"]')).toHaveLength(1)
    expect(container.textContent).toContain('Task deleted')
    expect(container.textContent).not.toContain('Lecture deleted')
    expect(container.textContent).not.toContain('Assignment deleted')
    await advance(4000)
    expect(container.querySelectorAll('[aria-label="Dismiss notification"]')).toHaveLength(0)
    expect(undo).not.toHaveBeenCalled()
  })

  it('honors an explicit timeout even when a notification has an action', async () => {
    await act(async () => notify({ title: 'Assignment completed', duration: 3000, onUndo: vi.fn() }))
    await advance(2999)
    expect(container.textContent).toContain('Assignment completed')
    await advance(1)
    expect(container.textContent).not.toContain('Assignment completed')
  })

  it('expires Open notifications and ordinary notices at their respective defaults', async () => {
    const open = vi.fn()
    await act(async () => {
      notify({ title: 'Ordinary notice' })
    })
    await advance(5000)
    expect(container.textContent).not.toContain('Ordinary notice')
    await act(async () => notify({ title: 'Saved', onOpen: open }))
    await advance(9999)
    expect(container.textContent).toContain('Saved')
    await advance(1)
    expect(container.textContent).not.toContain('Saved')
    expect(open).not.toHaveBeenCalled()
  })

  it('restarts the display window for a newer deletion and Undo restores only that action', async () => {
    const firstUndo = vi.fn()
    const lastUndo = vi.fn()
    await act(async () => notify({ title: 'First task deleted', onUndo: firstUndo }))
    await advance(6000)
    await act(async () => notify({ title: 'Last task deleted', onUndo: lastUndo }))
    expect(vi.getTimerCount()).toBe(1)
    await advance(6000)
    expect(container.textContent).not.toContain('First task deleted')
    expect(container.textContent).toContain('Last task deleted')
    await act(async () => [...container.querySelectorAll('button')].find(item => item.textContent === 'Undo')!.click())
    expect(lastUndo).toHaveBeenCalledOnce()
    expect(firstUndo).not.toHaveBeenCalled()
    expect(container.querySelectorAll('[aria-label="Dismiss notification"]')).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps Undo usable during keyboard focus, then expires after focus leaves', async () => {
    const undo = vi.fn()
    await act(async () => notify({ title: 'Lecture deleted', onUndo: undo }))
    const button = [...container.querySelectorAll('button')].find(item => item.textContent === 'Undo')!
    await act(async () => button.focus())
    await advance(20000)
    expect(container.textContent).toContain('Lecture deleted')
    await act(async () => container.querySelector('button')!.focus())
    await advance(10000)
    expect(container.textContent).not.toContain('Lecture deleted')
    expect(undo).not.toHaveBeenCalled()
  })

  it('pauses while hovered and resumes when the pointer leaves', async () => {
    await act(async () => notify({ title: 'Task deleted', onUndo: vi.fn() }))
    const surface = container.querySelector('[aria-label="Dismiss notification"]')!.parentElement!.parentElement!
    await act(async () => surface.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })))
    await advance(20000)
    expect(container.textContent).toContain('Task deleted')
    await act(async () => surface.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body })))
    await advance(10000)
    expect(container.textContent).not.toContain('Task deleted')
  })

  it('dismisses on Undo or Close without leaving stale timers', async () => {
    const undo = vi.fn()
    await act(async () => notify({ title: 'Task deleted', onUndo: undo }))
    await act(async () => [...container.querySelectorAll('button')].find(item => item.textContent === 'Undo')!.click())
    expect(undo).toHaveBeenCalledOnce()
    expect(container.textContent).not.toContain('Task deleted')
    await act(async () => notify({ title: 'Lecture deleted', onUndo: undo }))
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Dismiss notification"]')!.click())
    expect(container.textContent).not.toContain('Lecture deleted')
    expect(undo).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
})
