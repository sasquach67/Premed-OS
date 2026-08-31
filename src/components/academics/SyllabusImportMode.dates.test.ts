import { describe, expect, it } from 'vitest'
import type { SyllabusProposal } from '@/lib/academics/syllabusParser'
import { pastDatedSyllabusWork } from './SyllabusImportMode'

const proposal: SyllabusProposal = {
  sourceName: 'PSYC 101 syllabus',
  sourceKind: 'text',
  text: '',
  items: [
    { id: 'reading', kind: 'readings', label: 'Chapter 1', value: '2026-08-20', confidence: 'high', evidence: { quote: 'Chapter 1', location: 'line 1' } },
    { id: 'exam', kind: 'exams', label: 'Exam 1', value: '2026-08-20', confidence: 'high', evidence: { quote: 'Exam 1', location: 'line 2' } },
  ],
  searched: {
    identity: '', standards: '', exams: '', weights: '', units: '', readings: '', deadlines: '', policies: '', logistics: '',
  },
  scanDetected: false,
  documentKind: 'syllabus',
  structureFound: ['exams'],
  numberedItems: 0,
}

describe('past syllabus work dates', () => {
  it('treats a reading for today as past due because its action date was yesterday', () => {
    expect(pastDatedSyllabusWork(proposal, '2026-08-20').map((item) => item.id)).toEqual(['reading'])
  })
})
