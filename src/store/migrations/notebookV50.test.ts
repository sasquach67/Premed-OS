import { expect, it } from 'vitest'
import { createInitialDataForMode } from '@/store/store'
import { migrateNotebookV50 } from './notebookV50'

it('preserves legacy prompts and distinct draft and generated goals without backfilling', () => {
  const data = createInitialDataForMode(false)
  data.academics.classCenter.lectures.push(
    { id: 'legacy', courseId: 'course', title: 'Saved assignment', inputPath: 'materials', processingState: 'ready', notebookRequest: 'Help me work through an assignment using its instructions and my class materials.', notebookOutput: 'tailored-page', createdAt: 1, updatedAt: 1, order: 0 },
    { id: 'entry', courseId: 'course', title: 'Existing work', inputPath: 'materials', processingState: 'ready', studyIntent: { purpose: 'exam-prep', reviewSheetFileId: 'sheet' }, notebookGoal: 'assignment', notebookGeneratedGoal: 'assessment', notebookRequest: 'New draft request', notebookGeneratedRequest: 'Original request', notebookOutput: 'tailored-page', createdAt: 1, updatedAt: 1, order: 1 },
  )
  const before = structuredClone(data)
  expect(migrateNotebookV50(data)).toEqual(before)
  expect(data.academics.classCenter.lectures[0]).not.toHaveProperty('notebookGoal')
  expect(migrateNotebookV50(migrateNotebookV50(data))).toBe(data)
})
