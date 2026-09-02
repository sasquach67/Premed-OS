import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { useHeroScheduleSource } from '@/components/common/HeroDailySchedule'
import type { NormalizedScheduleEvent } from '@/lib/types'
import { HeroLiveStatus } from './OverviewHero'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('OverviewHero live status', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('keeps the until-start badge compact on one line', async () => {
    const events: NormalizedScheduleEvent[] = [
      {
        id: 'finished-event',
        title: 'Finished event',
        start: '2026-09-02T16:00:00-04:00',
        end: '2026-09-02T16:30:00-04:00',
        status: 'confirmed',
      },
      {
        id: 'research-event',
        title: 'Finding Your Place in Undergraduate Research',
        start: '2026-09-02T17:15:00-04:00',
        end: '2026-09-02T18:30:00-04:00',
        status: 'confirmed',
      },
    ]
    const schedule = {
      events,
      calendar: { timeFormat: '12h' },
    } as unknown as ReturnType<typeof useHeroScheduleSource>

    await act(async () => {
      root.render(<HeroLiveStatus schedule={schedule} now={new Date('2026-09-02T17:03:00-04:00')} />)
    })

    const badge = [...container.querySelectorAll<HTMLElement>('*')]
      .find((element) => element.textContent === '12m until start')

    expect(badge).toBeDefined()
    expect(badge?.className).toContain('whitespace-nowrap')
    expect(badge?.className).toContain('shrink-0')
  })
})
