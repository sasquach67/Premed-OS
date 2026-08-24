import { describe, expect, it } from 'vitest'
import { diffSharedCandidate, normalizeSharedSyllabusScope, serializeSharedSyllabusStructure, sharedCandidateToProposal, stageAcceptedSharedItems } from './sharedSyllabusStructure'
import type { SyllabusItem } from './syllabusParser'

const evidence = { quote: 'private source text that must never travel', location: 'Page 2' }
const item = (kind: SyllabusItem['kind'], label: string, value?: string): SyllabusItem => ({ id: `${kind}-${label}`, kind, label, value, confidence: 'high', evidence })

describe('shareable syllabus serialization', () => {
  it('keeps only the explicit structure allow-list and drops source prose', () => {
    const shared = serializeSharedSyllabusStructure([
      item('units', 'Unit 1: Cells'), item('exams', 'Midterm', '2026-10-01'), item('weights', 'Exams', '60%'),
      item('policies', 'Drop your lowest quiz and email Professor Private'), item('logistics', 'Office hours include a private phone number'),
    ])
    expect(shared).toEqual({
      units: [{ title: 'Unit 1: Cells', order: 0 }],
      dates: [{ kind: 'exam', title: 'Midterm', date: '2026-10-01', order: 0 }],
      gradeCategories: [{ name: 'Exams', weight: 60, order: 0 }],
      policyFlags: [], publicLogistics: [],
    })
    expect(JSON.stringify(shared)).not.toContain('private source')
    expect(JSON.stringify(shared)).not.toContain('Professor Private')
  })

  it('requires an exact normalized scope and never exposes an owner', () => {
    expect(normalizeSharedSyllabusScope({ institution: ' UNC ', courseCode: 'biol 252', term: 'Fall 2026', section: ' 001 ' }))
      .toEqual({ institution: 'unc', courseCode: 'BIOL 252', term: 'fall 2026', section: '001' })
    const proposal = sharedCandidateToProposal({
      id: 'candidate', scope: { institution: 'unc', courseCode: 'BIOL 252', term: 'fall 2026', section: '001' },
      structure: { units: [{ title: 'Neurons', order: 0 }], dates: [], gradeCategories: [], policyFlags: [], publicLogistics: [] },
      parsedAt: '2026-08-24T00:00:00Z', revisedAt: null, independentParseCount: 1, importCount: 0, correctionCount: 0, conflicts: [],
    })
    expect(proposal.sourceKind).toBe('shared')
    expect(proposal.text).toBe('')
    expect(JSON.stringify(proposal)).not.toContain('owner')
  })

  it('keeps every candidate difference until the student explicitly stages it', () => {
    const candidate = { id: 'candidate', scope: { institution: 'unc', courseCode: 'BIOL 252', term: 'fall 2026', section: '001' }, structure: { units: [{ title: 'Neurons', order: 0 }], dates: [], gradeCategories: [], policyFlags: [], publicLogistics: [] }, parsedAt: '2026-08-24T00:00:00Z', revisedAt: null, independentParseCount: 1, importCount: 0, correctionCount: 0, conflicts: [] }
    const local = [item('units', 'Cells')]
    const rows = diffSharedCandidate(local, candidate)
    expect(rows[0].defaultAction).toBe('keep')
    expect(stageAcceptedSharedItems(local, rows, new Set())).toEqual(local)
    expect(stageAcceptedSharedItems(local, rows, new Set([rows[0].key])).map((value) => value.label)).toEqual(['Cells', 'Neurons'])
  })
})
