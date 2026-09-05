import { expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateJournalIntentV48 } from './journalIntentV48'
it('preserves legacy lecture identity and materials-only journal intent without rewriting sources', () => {
  const data = createSeedData()
  const courseId = data.academics.classCenter.workspaces[0].courseId
  data.academics.classCenter.lectures.push(
    { id: 'legacy', courseId, title: 'Lecture 1', transcriptFileId: 'transcript', inputPath: 'pasted', processingState: 'ready', createdAt: 1, updatedAt: 1, order: 0 },
    { id: 'journal', courseId, title: 'Exam 1', inputPath: 'materials', studyIntent: { purpose: 'exam-prep', reviewSheetFileId: 'review', instructions: 'Connect readings.' }, selectedSourceFileIds: ['review'], processingState: 'ready', createdAt: 1, updatedAt: 1, order: 1 },
  )
  const original = structuredClone(data)
  expect(migrateJournalIntentV48(data)).toEqual(original)
  expect(migrateJournalIntentV48(migrateJournalIntentV48(data))).toBe(data)
})
