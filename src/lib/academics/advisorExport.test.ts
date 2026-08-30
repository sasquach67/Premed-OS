import { describe, expect, it } from 'vitest'
import { NOT_OFFICIAL, buildAdvisorSnapshot } from '@/lib/academics/advisorExport'
import type { Course, RequirementItem } from '@/lib/types'

const course = (code: string, term: string): Course => ({
  id: code, term, code, title: `${code} title`, credits: 3, grade: 'A', bcpm: true,
  status: 'completed', inResidence: true, satisfies: [], order: 0,
})
const requirement = (label: string, done: boolean): RequirementItem => ({
  id: label, group: 'Med Prerequisites', label, done, order: 0,
})

describe('the advisor snapshot', () => {
  const built = () => buildAdvisorSnapshot({
    courses: [course('CHEM 262', 'Fall 2026'), course('BIOL 103', 'Spring 2026')],
    requirements: [requirement('Biochemistry', false), requirement('Physics II', false), requirement('General chemistry', true)],
    catalogDate: 'Aug 2026',
    studentName: 'Andy Quach',
  })

  it('names every open requirement rather than counting them', () => {
    const snapshot = built()
    expect(snapshot.openRequirements).toHaveLength(2)
    expect(snapshot.text).toContain('Med Prerequisites — Biochemistry')
    expect(snapshot.text).toContain('Med Prerequisites — Physics II')
    // A satisfied one is not listed as open.
    expect(snapshot.text).not.toContain('General chemistry')
  })

  it('always carries the catalog source date', () => {
    expect(built().text).toContain('Catalog source: saved Aug 2026')
    const undated = buildAdvisorSnapshot({ courses: [], requirements: [] })
    expect(undated.text).toContain('no catalog date recorded')
  })

  it('states plainly that it is not official', () => {
    expect(built().text).toContain(NOT_OFFICIAL)
    expect(NOT_OFFICIAL).toMatch(/does not claim a degree audit/)
  })

  it('lists the terms it covers', () => {
    expect(built().terms).toEqual(['Fall 2026', 'Spring 2026'])
  })

  it('never claims a substitution was accepted', () => {
    expect(built().text).toContain('none has been accepted as a replacement')
  })

  it('includes selected Planning provenance without claiming an audit', () => {
    const snapshot = buildAdvisorSnapshot({
      courses: [],
      requirements: [],
      planningContext: {
        selectedProgramId: 'neuroscience-bs',
        matriculationTerm: 'Fall 2026',
        ideasCatalogYear: '2026-2027',
      },
    })
    expect(snapshot.text).toContain('Selected catalog plan: Neuroscience B.S.')
    expect(snapshot.text).toContain('IDEAs catalog year: 2026-2027')
    expect(snapshot.text).toContain('retrieved 2026-08-25')
    expect(snapshot.text).toContain(NOT_OFFICIAL)
  })
})
