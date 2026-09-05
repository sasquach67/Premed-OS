import { expect, it } from 'vitest'
import { createInitialDataForMode } from '@/store/store'
import { migrateNotebookV49 } from './notebookV49'
it('preserves legacy intent and the generated request independently of an edited notebook draft', () => {
  const data = createInitialDataForMode(false)
  data.academics.classCenter.lectures.push({ id: 'entry', courseId: 'course', title: 'Existing work', inputPath: 'materials', processingState: 'ready', studyIntent: { purpose: 'exam-prep', reviewSheetFileId: 'sheet' }, notebookRequest: 'New draft request', notebookGeneratedRequest: 'Original request', notebookOutput: 'tailored-page', createdAt: 1, updatedAt: 1, order: 0 })
  const before = structuredClone(data)
  expect(migrateNotebookV49(data)).toEqual(before)
  expect(migrateNotebookV49(migrateNotebookV49(data))).toBe(data)
})
