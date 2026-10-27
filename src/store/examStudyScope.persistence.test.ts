import { expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateAll } from './store'
import { decodeWorkspaceStorage, encodeWorkspaceStorage } from './workspaceStorageCodec'
import type { ClassAssignment } from '@/lib/types'

it('preserves explicit exam study scope separately from provenance through saved-workspace reload', () => {
  const data = structuredClone(createSeedData())
  const exam: ClassAssignment = {
    id: 'exam-scope-test', courseId: data.courses[0].id, title: 'Exam 1', type: 'exam',
    status: 'not-started', linkedTopicIds: ['legacy-topic'], coveredTopicIds: ['legacy-topic'],
    linkedFileIds: ['syllabus-provenance'], examStudyFileIds: ['selected-lecture'],
    createdAt: 1, updatedAt: 1, order: 0,
  }
  const legacy = { ...exam, id: 'legacy-exam', examStudyFileIds: undefined }
  data.academics.classCenter.assignments = [exam, legacy]
  const stored = encodeWorkspaceStorage(JSON.stringify(data), { requireChunks: true })
  const restored = migrateAll(JSON.parse(decodeWorkspaceStorage(stored)))
  expect(restored.academics.classCenter.assignments.find(row => row.id === exam.id)).toEqual(exam)
  expect(restored.academics.classCenter.assignments.find(row => row.id === legacy.id)?.examStudyFileIds).toBeUndefined()
})

it('keeps lessons a student set for an exam through saved-workspace reload', () => {
  const data = structuredClone(createSeedData())
  const exam: ClassAssignment = {
    id: 'exam-range-test', courseId: data.courses[0].id, title: 'Exam 2', type: 'exam', status: 'not-started',
    linkedTopicIds: [], linkedFileIds: [], createdAt: 1, updatedAt: 1, order: 0,
    examScope: { lessons: ['Lessons 7–11'], cumulative: false, studentEdit: { syllabusLessons: ['Lesson 9'], editedAt: 5 } },
  }
  data.academics.classCenter.assignments = [exam]
  const stored = encodeWorkspaceStorage(JSON.stringify(data), { requireChunks: true })
  const restored = migrateAll(JSON.parse(decodeWorkspaceStorage(stored)))
  expect(restored.academics.classCenter.assignments.find(row => row.id === exam.id)?.examScope).toEqual(exam.examScope)
})
