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
})

it('never saves a still-invalid repair or retries indefinitely', async () => {
  vi.mocked(generateWithSourceRecovery).mockResolvedValue(response({ ...artifact, standards: [{ ...artifact.standards[0], sourceChunkIds: ['unknown'] }] }))
  const result = await generateUnitMasteryOutline(input)
  expect(result.ok).toBe(false)
  expect(result.artifact).toBeUndefined()
  expect(result.message).toContain('sourceChunkIds: missing or outside selected sources')
  expect(generateWithSourceRecovery).toHaveBeenCalledTimes(2)
})
