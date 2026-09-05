import { beforeEach, expect, it, vi } from 'vitest'
import { generateUnitMasteryOutline } from './generateUnitMasteryOutline'
import { generateWithSourceRecovery } from './syncGenerationSources'
import type { SourceChunk } from '@/lib/types'

vi.mock('./syncGenerationSources', () => ({
  prepareGenerationSources: vi.fn(async () => ({ ok: true, scopeId: 'scope', chunkIds: ['chunk-1'] })),
  generateWithSourceRecovery: vi.fn(),
}))
vi.mock('./generationPolicy', () => ({ assertGenerationAllowed: vi.fn(), generatedTitle: (s: string) => s, GenerationNotAllowedError: class extends Error {} }))

const artifact = {
  title: 'Gene expression', unit: 'Lecture 2', standards: [{
    id: 'objective-1', title: 'Transcription',
    freeRecallCues: ['Explain the steps of transcription without notes.'],
    understand: ['Template selection', 'Complementary base pairing', 'RNA direction', 'Initiation', 'Termination'],
    beAbleToDo: ['Identify the template strand.', 'Predict the RNA sequence.'],
    watchFor: ['Do not confuse coding and template strands.'], sourceChunkIds: ['chunk-1'],
    examPractice: [{
      prompt: 'In a hypothetical transcription exercise, the template strand is 3′-TAC-5′. Write the RNA product and explain its orientation.',
      answer: '5′-AUG-3′.',
      rationale: 'The RNA is complementary and antiparallel: T pairs with A, A with U, and C with G.',
      sourceChunkIds: ['chunk-1'],
    }],
  }],
}
const input = { courseId: 'course-1', chunks: [{ id: 'chunk-1', content: 'Transcription uses a DNA template.' } as SourceChunk], unit: 'Lecture 2', label: 'Transcription' }
const response = (value: unknown) => ({ ok: true as const, data: { artifact: value, citations: [], auditStatus: 'approved' as const } })
beforeEach(() => { vi.clearAllMocks(); vi.mocked(generateWithSourceRecovery).mockReset() })

it('repairs a rejected map once using exact validation feedback and the same source boundary', async () => {
  vi.mocked(generateWithSourceRecovery)
    .mockResolvedValueOnce(response({ ...artifact, standards: [{ ...artifact.standards[0], understand: ['One detail'] }] }))
    .mockResolvedValueOnce(response(artifact))
  const result = await generateUnitMasteryOutline(input)
  expect(result.ok).toBe(true)
  expect(generateWithSourceRecovery).toHaveBeenCalledTimes(2)
  const repair = vi.mocked(generateWithSourceRecovery).mock.calls[1][2]
  expect(repair.chunkIds).toEqual(['chunk-1'])
  expect(repair.request).toContain('standards[0].understand: needs at least 5 distinct points')
  expect(repair.request).toContain('examPractice with 1 or 2')
  expect(result.artifact?.standards[0].examPractice).toEqual(artifact.standards[0].examPractice)
  expect(result.artifact?.standards[0].masteryState).toBe('not-started')
})

it('rejects an old-format provider result for a new build and repairs it with practice', async () => {
  vi.mocked(generateWithSourceRecovery)
    .mockResolvedValueOnce(response({ ...artifact, standards: [{ ...artifact.standards[0], examPractice: undefined }] }))
    .mockResolvedValueOnce(response(artifact))
  const result = await generateUnitMasteryOutline(input)
  expect(result.ok).toBe(true)
  expect(generateWithSourceRecovery).toHaveBeenCalledTimes(2)
  const requests = vi.mocked(generateWithSourceRecovery).mock.calls.map((call) => call[2])
  expect(requests[1].request).toContain('standards[0].examPractice: needs 1 to 2')
  expect(requests[0].systemPrompt).toBe(requests[1].systemPrompt)
  for (const request of requests) {
    expect(request.chunkIds).toEqual(['chunk-1'])
    expect(request.request).toContain('examPractice with 1 or 2')
    expect(request.request).not.toContain(input.chunks[0].content)
  }
})

it('rejects copied selected assessment text on both attempts without returning an artifact', async () => {
  vi.mocked(generateWithSourceRecovery).mockResolvedValue(response(artifact))
  const privatePrompt = artifact.standards[0].examPractice[0].prompt
  const result = await generateUnitMasteryOutline({ ...input, chunks: [{ ...input.chunks[0], content: privatePrompt }], practiceQuestionChunkIds: ['chunk-1', 'not-selected'] })
  expect(result.ok).toBe(false)
  expect(result.artifact).toBeUndefined()
  expect(result.message).toContain('resembles supplied assessment wording')
  expect(result.message).not.toContain(privatePrompt)
  expect(generateWithSourceRecovery).toHaveBeenCalledTimes(2)
  expect(vi.mocked(generateWithSourceRecovery).mock.calls[0][2].systemPrompt).not.toContain('not-selected')
})

it('does not fabricate practice or retry after a provider failure', async () => {
  vi.mocked(generateWithSourceRecovery).mockResolvedValue({ ok: false, code: 'unavailable', message: 'Provider unavailable' })
  const result = await generateUnitMasteryOutline(input)
  expect(result.ok).toBe(false)
  expect(result.artifact).toBeUndefined()
  expect(generateWithSourceRecovery).toHaveBeenCalledTimes(1)
})

it('never saves a still-invalid repair or retries indefinitely', async () => {
  vi.mocked(generateWithSourceRecovery).mockResolvedValue(response({ ...artifact, standards: [{ ...artifact.standards[0], sourceChunkIds: ['unknown'] }] }))
  const result = await generateUnitMasteryOutline(input)
  expect(result.ok).toBe(false)
  expect(result.artifact).toBeUndefined()
  expect(result.message).toContain('sourceChunkIds: missing or outside selected sources')
  expect(generateWithSourceRecovery).toHaveBeenCalledTimes(2)
})
