import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TrackerTable, type ColumnDef } from './TrackerTable'
import { ToastProvider } from './ToastProvider'
import { createInitialDataForMode, useStore } from '@/store/store'

const probe = vi.hoisted(() => ({ renders: 0 }))
vi.mock('@tanstack/react-table', async (load) => {
  const actual = await load<typeof import('@tanstack/react-table')>()
  return { ...actual, useReactTable: (...args: Parameters<typeof actual.useReactTable>) => {
    if (++probe.renders > 100) throw new Error('Table did not settle after filtering')
    return actual.useReactTable(...args)
  } }
})
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => { useStore.getState().replaceAll(createInitialDataForMode(false)) })

describe('TrackerTable filtering stays responsive', () => {
  it.each([1, 160])('filters and clears %i records without a render loop', async (count) => {
    probe.renders = 0
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    const columns: ColumnDef[] = [{ key: 'title', header: 'Assignment', type: 'text' }]
    const rows = Array.from({ length: count }, (_, i) => ({ id: String(i), title: `Audit assignment ${i}` }))
    try {
      await act(async () => root.render(<ToastProvider><TrackerTable rows={rows} columns={columns} reorder={false} /></ToastProvider>))
      const filter = host.querySelector<HTMLInputElement>('[aria-label="Filter records"]')!
      for (const value of ['nomatch-audit', '']) {
        await act(async () => {
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(filter, value)
          filter.dispatchEvent(new Event('input', { bubbles: true }))
        })
        expect(host.textContent).toContain(`${value ? 0 : count} records`)
      }
      expect(probe.renders).toBeLessThan(100)
      expect(host.querySelector('[aria-label="Filter records"]')).toBe(filter)
    } finally {
      await act(async () => root.unmount())
      host.remove()
    }
  })
})
