import { describe, expect, it } from 'vitest'
import {
  UNC_COURSE_CATALOG,
  UNC_COURSE_CATALOG_META,
  UNC_COURSE_CATALOG_SUBJECTS,
  UNC_CATALOG_REQUIREMENTS,
  catalogCourseHasRequirement,
  catalogCreditChoiceIsValid,
  fixedCatalogCredits,
  searchUncCourseCatalog,
  uncCatalogCourse,
} from './uncCourseCatalog'

describe('official UNC course catalog snapshot', () => {
  it('contains the complete source-versioned catalog rather than a premed-only subset', () => {
    expect(UNC_COURSE_CATALOG_META).toMatchObject({ catalogYear: '2026-2027', sourceUrl: 'https://catalog.unc.edu/courses/' })
    expect(UNC_COURSE_CATALOG.length).toBeGreaterThan(3_000)
    expect(UNC_COURSE_CATALOG_SUBJECTS.length).toBeGreaterThan(100)
    expect(new Set(UNC_COURSE_CATALOG.map((course) => course.code)).size).toBe(UNC_COURSE_CATALOG.length)
  })

  it('retains published facts for representative subjects', () => {
    expect(uncCatalogCourse('biol 103')).toMatchObject({ title: 'How Cells Function', minCredits: 3, maxCredits: 3, subjectCode: 'BIOL' })
    expect(uncCatalogCourse('ENGL 105')).toMatchObject({ title: 'English Composition and Rhetoric', minCredits: 3 })
    expect(uncCatalogCourse('ANTH 147')).toMatchObject({ title: 'Comparative Healing Systems', subjectCode: 'ANTH' })
    expect(uncCatalogCourse('SPAN 101')).toMatchObject({ title: 'Elementary Spanish I', subjectCode: 'SPAN' })
  })

  it('filters by Student Center-like catalog facts without claiming live sections', () => {
    expect(searchUncCourseCatalog({ subjectCode: 'PSYC', number: '101' })[0]).toMatchObject({ code: 'PSYC 101', title: 'General Psychology' })
    expect(searchUncCourseCatalog({ attribute: 'FC-NATSCI', level: 'undergraduate', limit: 500 }).some((course) => course.code === 'BIOL 103')).toBe(true)
    expect(searchUncCourseCatalog({ query: 'comparative healing systems' })[0]?.code).toBe('ANTH 147')
  })

  it('presents readable general-education filters and matches combined requirement attributes', () => {
    expect(UNC_CATALOG_REQUIREMENTS.find((item) => item.value === 'FC-NATSCI')?.label).toBe('IDEAs · Natural Scientific Investigation')
    expect(catalogCourseHasRequirement(['FC-AESTH or FC-CREATE'], 'FC-CREATE')).toBe(true)
    expect(catalogCourseHasRequirement(['FY-LAUNCH (only designated sections)'], 'FY-LAUNCH')).toBe(true)
    expect(catalogCourseHasRequirement(['FC-AESTH or FC-CREATE'], 'FC-NATSCI')).toBe(false)
  })

  it('prefills fixed credits and validates variable-credit choices', () => {
    const fixed = uncCatalogCourse('BIOL 103')!
    const variable = UNC_COURSE_CATALOG.find((course) => course.variableCredits && course.minCredits != null && course.maxCredits != null)!
    expect(fixedCatalogCredits(fixed)).toBe(3)
    expect(fixedCatalogCredits(variable)).toBeUndefined()
    expect(catalogCreditChoiceIsValid(variable, variable.minCredits!)).toBe(true)
    expect(catalogCreditChoiceIsValid(variable, variable.maxCredits! + 1)).toBe(false)
  })
})
