import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useHeroScheduleSource } from './HeroDailySchedule'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const calendarSync = vi.hoisted(() => ({
  calendar: {
    enabled: true,
    cachedEvents: [],
    lastSyncedAt: undefined as number | undefined,
    lastError: undefined as string | undefined,
    timeFormat: '12h' as const,
  },
  clientId: 'configured-client',
  apiKey: '',
  connected: false,
  configured: true,
  status: 'idle' as const,
  error: '',
  connect: vi.fn(),
  connectSilent: vi.fn(),
  refresh: vi.fn(),
  disconnect: vi.fn(),
}))

vi.mock('@/hooks/useCalendarSync', () => ({
  useCalendarSync: () => calendarSync,
}))

vi.mock('@/store/store', () => ({
  useStore: (selector: (state: unknown) => unknown) => selector({
    academics: { classCenter: { workspaces: [] } },
    courses: [],
  }),
}))

function Probe() {
  const schedule = useHeroScheduleSource()
  return <output>{schedule.source}</output>
}

describe('useHeroScheduleSource calendar authorization boundary', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    calendarSync.connectSilent.mockReset()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('does not launch Google authorization merely because Overview mounted', async () => {
    await act(async () => root.render(<Probe />))

    expect(container.textContent).toBe('empty')
    expect(calendarSync.connectSilent).not.toHaveBeenCalled()
  })
})
