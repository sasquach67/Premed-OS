import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { createSeedData } from '@/data/seed'
import type { AppData } from '@/lib/types'
import { localCounts } from '@/lib/publicLayer'
import { WhereIStand } from './OverviewStatus'

const fixture = vi.hoisted(() => ({ data: undefined as AppData | undefined }))
vi.mock('@/store/store', () => ({
  useStore: (selector?: (data: AppData) => unknown) => selector ? selector(fixture.data!) : fixture.data,
}))

describe('retired academic topic signals', () => {
  it('shows current assignments and pending files without legacy topic or coverage counts', () => {
    const data = structuredClone(createSeedData())
    const center = data.academics.classCenter
    center.assignments = [center.assignments[0]]
    center.assignments[0].status = 'not-started'
    center.files = [{ ...center.files[0], id: 'pending', processingStatus: 'pending' }]
    center.topics[0].status = 'weak'
    if (center.topics[0].fsrs) center.topics[0].fsrs.due = 0
    center.sourceChunks = [{ ...center.sourceChunks[0], id: 'unscoped', topicId: undefined }]
    fixture.data = data

    const container = document.createElement('div')
    container.innerHTML = renderToStaticMarkup(<MemoryRouter><WhereIStand /></MemoryRouter>)
    const academics = container.querySelector('a[aria-label^="Academics,"]')
    expect(academics?.getAttribute('aria-label')).toContain('1 open · 1 unfiled')
    expect(academics?.getAttribute('aria-label')).not.toMatch(/due|review notes/)
    expect(localCounts(data).some((row) => row.key === 'topics')).toBe(false)
    expect(center.topics.length).toBeGreaterThan(0)
  })
})
