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


describe('Research Overview hours', () => {
  it('uses the shared all-lab lifetime total and optional goal, with estimates included', () => {
    const data = createSeedData()
    data.experiences = [{ id: 'lab', category: 'research', org: 'Lab', role: 'Assistant', description: '', tags: [], status: 'active', order: 0 }]
    const envelope = { createdAt: 1, updatedAt: 1, archived: false, order: 0, experienceId: 'lab' }
    data.experienceHourEntries = [{ ...envelope, id: 'logged', kind: 'logged', date: '2026-09-24', hours: 5 }, { ...envelope, id: 'estimated', kind: 'estimated', hours: 60 }]
    data.goals.research = 150
    fixture.data = data
    const container = document.createElement('div')
    container.innerHTML = renderToStaticMarkup(<MemoryRouter><WhereIStand /></MemoryRouter>)
    const research = container.querySelector('a[aria-label^="Research,"]')
    expect(research?.getAttribute('aria-label')).toContain('65/150 hrs')
    expect(research?.getAttribute('aria-label')).not.toContain('projects')
    data.goals.research = 0
    container.innerHTML = renderToStaticMarkup(<MemoryRouter><WhereIStand /></MemoryRouter>)
    expect(container.querySelector('a[aria-label^="Research,"]')?.getAttribute('aria-label')).toContain('65 hrs')
  })
})
