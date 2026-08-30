import { describe, expect, it } from 'vitest'
import {
  UNC_CATALOG_INTEGRATION,
  catalogPlanDefaults,
  localCatalogCandidates,
  searchLocalCatalog,
} from './planningCatalogAdapter'

describe('local Planning catalog adapter', () => {
  it('separates the configured published catalog from unconfigured live sections', () => {
    expect(UNC_CATALOG_INTEGRATION).toMatchObject({
      configured: true,
      mode: 'official-catalog-snapshot',
      catalogYear: '2026-2027',
      liveSectionsConfigured: false,
    })
    expect(UNC_CATALOG_INTEGRATION.reason).toContain('Current sections')
  })

  it('returns published course facts with separate requirement provenance', () => {
    const candidate = searchLocalCatalog('biol 103')[0]
    expect(candidate).toMatchObject({ code: 'BIOL 103', title: 'How Cells Function', minCredits: 3, maxCredits: 3 })
    expect(candidate.sourceUrls[0]).toMatch(/^https:\/\/catalog\.unc\.edu\//)
    expect(candidate.catalogYears).toEqual(['2026-2027'])
    expect(candidate).not.toHaveProperty('availableTerms')
  })

  it('supports program relevance plus official catalog filters', () => {
    expect(searchLocalCatalog('BIOL', { programId: 'neuroscience-bs' }).length).toBeGreaterThan(0)
    expect(searchLocalCatalog('NSCI 175', { programId: 'chemistry-bs' })).toEqual([])
    expect(searchLocalCatalog('', { subjectCode: 'ANTH', number: '147' })[0]).toMatchObject({ title: 'Comparative Healing Systems' })
    expect(searchLocalCatalog('', { attribute: 'FC-NATSCI', level: 'undergraduate', limit: 500 }).some((candidate) => candidate.code === 'BIOL 103')).toBe(true)
    expect(searchLocalCatalog('')).toEqual([])
    expect(searchLocalCatalog('neuroscience', { programId: 'neuroscience-bs', subjectCode: 'NSCI', number: '175', level: 'undergraduate' })[0]).toMatchObject({ code: 'NSCI 175' })
    expect(searchLocalCatalog('neuroscience', { subjectCode: 'CHEM', number: '999', attribute: 'FC-NATSCI', level: 'undergraduate' })).toEqual([])
  })

  it('supplies reviewed plan defaults without inventing BCPM or live offering facts', () => {
    const defaults = catalogPlanDefaults(searchLocalCatalog('BIOL 103')[0])
    expect(defaults).toMatchObject({ code: 'BIOL 103', title: 'How Cells Function', credits: 3, creditChoiceRequired: false })
    expect(defaults.catalogNote).toContain('UNC 2026-2027 catalog')
    expect(defaults).not.toHaveProperty('bcpm')
    expect(defaults).not.toHaveProperty('availableTerms')
  })

  it('deduplicates exact codes while retaining every source reference', () => {
    const codes = localCatalogCandidates().map((candidate) => candidate.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect(codes).toEqual([...codes].sort((left, right) => left.localeCompare(right, undefined, { numeric: true })))
  })
})
