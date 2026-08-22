import { describe, expect, it } from 'vitest'
import type { RequirementItem } from '@/lib/types'
import { addCatalogWarningAcknowledgements, isCatalogWarningAcknowledged } from '@/lib/academics/requirementsAudit'

function requirement(overrides: Partial<RequirementItem> = {}): RequirementItem {
  return {
    id: 'major-core', group: 'Neuroscience B.S.', label: 'Core selection', done: false, order: 0,
    sourceType: 'official', sourceLabel: 'UNC Catalog', sourceUrl: 'https://catalog.unc.edu/example',
    lastVerified: '2026-08-22', verificationStatus: 'needs-verification',
    ...overrides,
  }
}

describe('catalog warning acknowledgements', () => {
  it('survive a saved record but reappear when the source version changes', () => {
    const item = requirement()
    const saved = addCatalogWarningAcknowledgements([], [item], 100)

    expect(isCatalogWarningAcknowledged(saved, item)).toBe(true)
    expect(isCatalogWarningAcknowledged(saved, requirement({ lastVerified: '2026-08-23' }))).toBe(false)
  })

  it('never changes the catalog requirement while recording the personal acknowledgement', () => {
    const item = Object.freeze(requirement())
    const before = structuredClone(item)

    const saved = addCatalogWarningAcknowledgements([], [item], 100)

    expect(saved).toEqual([{ requirementId: item.id, sourceVersion: '2026-08-22|https://catalog.unc.edu/example', acknowledgedAt: 100 }])
    expect(item).toEqual(before)
    expect(item.verificationStatus).toBe('needs-verification')
  })
})
