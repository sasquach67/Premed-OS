import { beforeEach, expect, it, vi } from 'vitest'
import type { SourceChunk } from '@/lib/types'
import { generateFlashcards } from './generateFlashcards'
import { generateStudyGuide } from './generateStudyGuide'
import { generateUnitMasteryOutline } from './generateUnitMasteryOutline'
import { generateUnitQuestionBank } from './generateUnitQuestionBank'
import type { GuideDirection } from './studentGuide'

const mocks = vi.hoisted(() => ({ generate: vi.fn(), recover: vi.fn() }))
vi.mock('./syncGenerationSources', () => ({ prepareGenerationSources: vi.fn(async () => ({ ok: true, scopeId: 'scope', chunkIds: ['reading'] })), generateWithSourceRecovery: mocks.recover }))
vi.mock('@/lib/intelligence/studyTools', () => ({ studyTools: { generate: mocks.generate } }))
const chunks: SourceChunk[] = [{ id: 'reading', fileId: 'king', courseId: 'anth', content: 'Selected reading evidence.', coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 0 }]
const guideDirections: GuideDirection[] = [{ id: 'direction', title: 'Explain why a visible laboratory matters within Amish values.', content: 'Use accurate reading evidence and meaningful recall.', studentGuidance: { group: 'approach', origin: 'manual', scope: { kind: 'course' } } }]
beforeEach(() => { mocks.generate.mockReset().mockResolvedValue({ ok: false, code: 'provider-unavailable', message: 'Offline test' }); mocks.recover.mockReset().mockResolvedValue({ ok: false, code: 'provider-unavailable', message: 'Offline test' }) })
it('passes the same selected guidance and closed source IDs to notebook, mastery, cards and practice calls', async () => {
  const input = { courseId: 'anth', chunks, label: 'ANTH 147', guideDirections }
  await generateStudyGuide(input)
  await generateUnitMasteryOutline({ ...input, unit: 'Exam 1' })
  await generateFlashcards(input)
  await generateUnitQuestionBank({ ...input, unit: 'Exam 1', course: { code: 'ANTH 147', title: 'Comparative healing systems' } })
  expect(mocks.recover).toHaveBeenCalledTimes(2)
  expect(mocks.generate).toHaveBeenCalledTimes(2)
  const requests = [...mocks.recover.mock.calls.map(call => call[2]), ...mocks.generate.mock.calls.map(call => call[0])]
  for (const request of requests) {
    expect(request.request).toContain(guideDirections[0].title)
    expect(request.request).toContain('not factual evidence')
    expect(request.chunkIds).toEqual(['reading'])
    expect(request.systemPrompt).toContain(guideDirections[0].title)
  }
})
it('still refuses generation without source evidence even when guidance exists', async () => {
  expect((await generateFlashcards({ courseId: 'anth', chunks: [], label: 'ANTH', guideDirections })).ok).toBe(false)
  expect((await generateStudyGuide({ courseId: 'anth', chunks: [], label: 'ANTH', guideDirections })).ok).toBe(false)
  expect(mocks.generate).not.toHaveBeenCalled(); expect(mocks.recover).not.toHaveBeenCalled()
})
