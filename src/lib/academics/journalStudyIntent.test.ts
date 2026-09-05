import { expect, it, vi } from 'vitest'
import { journalStudyInstruction } from './journalStudyIntent'
import { generateStudyGuide } from './generateStudyGuide'
import { generateWithSourceRecovery } from './syncGenerationSources'
import type { SourceChunk } from '@/lib/types'

vi.mock('./syncGenerationSources', () => ({
  prepareGenerationSources: vi.fn(async () => ({ ok: true, scopeId: 'scope', chunkIds: ['review-chunk', 'reading-chunk'] })),
  generateWithSourceRecovery: vi.fn(async () => ({ ok: false, code: 'unavailable' })),
}))
const chunks = [
  { id: 'review-chunk', fileId: 'review', courseId: 'course', content: 'Compare the assigned authors.' },
  { id: 'reading-chunk', fileId: 'reading', courseId: 'course', content: 'The authors disagree about the interpretation.' },
] as SourceChunk[]

it('uses only selected review-sheet evidence and treats preferences separately from facts', () => {
  const instruction = journalStudyInstruction({ purpose: 'exam-prep', reviewSheetFileId: 'review', instructions: 'Compare authors.' }, chunks)
  expect(instruction).toContain('Exam review-sheet chunk IDs: review-chunk.')
  expect(instruction).toContain('not as factual source evidence')
  expect(instruction).toContain('Explicitly mark topics whose supporting material is missing')
  const missing = journalStudyInstruction({ purpose: 'exam-prep', reviewSheetFileId: 'unselected' }, chunks)
  expect(missing).not.toContain('unselected')
  expect(missing).toContain('No readable exam review sheet was selected')
  expect(journalStudyInstruction(undefined, chunks)).toBe('')
})

it('sends exam intent, the review-sheet anchor, and student focus through the actual guide request', async () => {
  await generateStudyGuide({ courseId: 'course', label: 'Exam 1', chunks, studyIntent: { purpose: 'exam-prep', reviewSheetFileId: 'review', instructions: 'Compare authors.' } })
  const call = vi.mocked(generateWithSourceRecovery).mock.calls.at(-1)!
  expect(call[2].request).toContain('Journal purpose: exam preparation')
  expect(call[2].request).toContain('Exam review-sheet chunk IDs: review-chunk.')
  expect(call[2].request).toContain('Compare authors.')
  expect(call[2].chunkIds).toEqual(['review-chunk', 'reading-chunk'])
})
