import { describe, expect, it } from 'vitest'
import { examScopeFromSyllabus } from '@/lib/academics/examScope'
import type { SyllabusItem, SyllabusProposal } from '@/lib/academics/syllabusParser'
import type { ClassCenterData } from '@/lib/types'

const evidence = { quote: 'x', location: 'line 1' }
const unit = (label: string, value: string): SyllabusItem => ({ id: label, kind: 'units', label, value, confidence: 'high', evidence })
const proposal = (items: SyllabusItem[]) => ({ items } as unknown as SyllabusProposal)
const centerWith = (topics: Array<{ id: string; title: string; scheduledFor?: string }>) =>
  ({ topics: topics.map((topic) => ({ ...topic, courseId: 'c1' })) } as unknown as ClassCenterData)

describe('examScopeFromSyllabus', () => {
  const schedule = [unit('Lesson 1', '2026-08-20'), unit('Lesson 2', '2026-08-25'), unit('Lesson 3', '2026-08-27')]

  it('keeps the stated lessons as schedule labels, and covers the topics that already match one', () => {
    const exam: SyllabusItem = { id: 'e', kind: 'exams', label: 'Exam 1', value: '2026-09-17', confidence: 'high', evidence, scope: { lessons: [1, 2] } }
    const center = centerWith([
      { id: 't-date', title: 'Gene structure', scheduledFor: '2026-08-25' },
      { id: 't-title', title: 'Lesson 1 — Scientific thinking' },
      { id: 't-other', title: 'Lesson 3 — Mutations', scheduledFor: '2026-08-27' },
    ])
    expect(examScopeFromSyllabus(center, 'c1', proposal([...schedule, exam]), exam)).toEqual({
      examScope: { lessons: ['Lesson 1', 'Lesson 2'] },
      coveredTopicIds: ['t-date', 't-title'],
    })
  })

  it('keeps the lessons even when the class has no topics yet', () => {
    const exam: SyllabusItem = { id: 'e', kind: 'exams', label: 'Exam 1', value: '2026-09-17', confidence: 'high', evidence, scope: { lessons: [1, 2] } }
    expect(examScopeFromSyllabus(centerWith([]), 'c1', proposal([...schedule, exam]), exam)).toEqual({ examScope: { lessons: ['Lesson 1', 'Lesson 2'] } })
  })

  it('covers every lesson up to the exam, and every topic, when the exam is cumulative', () => {
    const exam: SyllabusItem = { id: 'e', kind: 'exams', label: 'Final Exam', value: '2026-08-26', confidence: 'high', evidence, scope: { cumulative: true } }
    const result = examScopeFromSyllabus(centerWith([{ id: 'a', title: 'Cells' }]), 'c1', proposal([...schedule, exam]), exam)
    expect(result).toEqual({ examScope: { lessons: ['Lesson 1', 'Lesson 2'], cumulative: true }, coveredTopicIds: ['a'] })
  })

  it('writes nothing when the syllabus says nothing about scope', () => {
    const exam: SyllabusItem = { id: 'e', kind: 'exams', label: 'Exam 1', value: '2026-09-17', confidence: 'high', evidence }
    expect(examScopeFromSyllabus(centerWith([]), 'c1', proposal([exam]), exam)).toEqual({})
  })
})
