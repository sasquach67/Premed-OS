import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useLocalDay } from './useLocalDay'
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => vi.useRealTimers())
describe('local day rollover', () => {
  it('updates at local midnight and on foreground wake without store edits', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 11, 31, 23, 59, 59))
    const container = document.createElement('div')
    const root = createRoot(container)
    function Day() { return <span>{useLocalDay()}</span> }
    await act(async () => root.render(<Day />))
    expect(container.textContent).toBe('2026-12-31')
    await act(async () => vi.advanceTimersByTime(1000))
    expect(container.textContent).toBe('2027-01-01')
    vi.setSystemTime(new Date(2027, 0, 3, 12))
    await act(async () => window.dispatchEvent(new Event('focus')))
    expect(container.textContent).toBe('2027-01-03')
    await act(async () => root.unmount())
    expect(vi.getTimerCount()).toBe(0)
  })
})
