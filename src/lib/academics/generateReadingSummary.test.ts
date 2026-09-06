import { beforeEach, expect, it, vi } from 'vitest'
import type { AcademicFile, SourceChunk } from '@/lib/types'
import { generateReadingSummary, readingSummaryIssues, READING_SECTIONS, type ReadingKind } from './generateReadingSummary'
import { prepareGenerationSources, generateWithSourceRecovery } from './syncGenerationSources'
vi.mock('./syncGenerationSources', () => ({
  MAX_GENERATION_SOURCE_CHUNKS: 480, MAX_GENERATION_SOURCE_CHARACTERS: 220000,
  prepareGenerationSources: vi.fn(async (_course: string, chunks: SourceChunk[]) => ({ ok: true, scopeId: 'scope', chunkIds: chunks.map(chunk => chunk.id) })),
  generateWithSourceRecovery: vi.fn(),
}))
const files = [{ id: 'reading', courseId: 'course', title: 'Ways of understanding illness', type: 'reading', sourceType: 'paste' }, { id: 'lecture', courseId: 'course', title: 'Lecture emphasis', type: 'transcript', sourceType: 'paste' }, { id: 'excluded', courseId: 'course', title: 'PRIVATE UNSELECTED', type: 'reading' }] as AcademicFile[]
const chunks = files.map(file => ({ id: `${file.id}-chunk`, fileId: file.id, courseId: 'course', content: 'A supported source passage.', order: 0 } as SourceChunk))
const input = { courseId: 'course', courseLabel: 'ANTH · Medical anthropology', reading: files[0], kind: 'assigned-reading' as const, focus: 'Themes of illness and authority', contextFileIds: ['lecture'], files, chunks }
function artifact(kind: ReadingKind = 'assigned-reading') {
  return { sections: READING_SECTIONS[kind].map((id, i) => ({ id, title: `How illness challenges authority: point ${i + 1}`, blocks: [{ id: `b${i}`, type: 'prose', provenance: 'source', text: { content: 'Passage-supported explanation.' }, sourceRef: { chunkId: 'reading-chunk', fileId: 'reading', start: 0, end: 26 } }] })) }
}
const response = (value: unknown) => ({ ok: true as const, data: { artifact: value, citations: [], auditStatus: 'skipped' as const } })
beforeEach(() => { vi.clearAllMocks(); vi.mocked(generateWithSourceRecovery).mockReset() })
it('uses the dedicated rhetoric/context contract and only explicitly selected evidence', async () => {
  vi.mocked(generateWithSourceRecovery).mockResolvedValue(response(artifact()))
  const result = await generateReadingSummary(input)
  expect(result.ok).toBe(true)
  const request = vi.mocked(generateWithSourceRecovery).mock.calls[0][2]
  expect(request.specId).toBe('reading-summary-v1')
  expect(request.chunkIds).toEqual(['reading-chunk', 'lecture-chunk'])
  expect(request.request).toContain('Themes of illness and authority')
  expect(request.request).toContain('Designated reading file ID: reading')
  expect(request.systemPrompt).toContain('rhetorical')
  expect(request.systemPrompt).toContain('themes and tensions')
  expect(request.systemPrompt).toContain('Mark inferred assumptions')
  expect(request.systemPrompt).toContain('instructor tips and caveats')
  expect(request.systemPrompt).not.toContain('PRIVATE UNSELECTED')
  expect(request.request).not.toContain('excluded-chunk')
  expect(result.ok && result.fileIds).toEqual(['reading', 'lecture'])
})
it('retains kind, focus and context during one structural repair', async () => {
  vi.mocked(generateWithSourceRecovery).mockResolvedValueOnce(response({ sections: [] })).mockResolvedValueOnce(response(artifact()))
  expect((await generateReadingSummary(input)).ok).toBe(true)
  const calls = vi.mocked(generateWithSourceRecovery).mock.calls
  expect(calls).toHaveLength(2)
  expect(calls[1][2].systemPrompt).toBe(calls[0][2].systemPrompt)
  expect(calls[1][2].request).toContain('assigned-reading')
  expect(calls[1][2].request).toContain('Themes of illness and authority')
  expect(calls[1][2].request).toContain('lecture-chunk')
})
it.each(['primary-research', 'textbook-chapter'] as const)('uses the selected %s section roles', async kind => {
  vi.mocked(generateWithSourceRecovery).mockResolvedValue(response(artifact(kind)))
  expect((await generateReadingSummary({ ...input, kind })).ok).toBe(true)
  expect(vi.mocked(generateWithSourceRecovery).mock.calls[0][2].request).toContain(READING_SECTIONS[kind].join(', '))
})
it('blocks oversized or unreadable context rather than silently dropping it', async () => {
  expect((await generateReadingSummary({ ...input, chunks: [chunks[0]] })).ok).toBe(false)
  expect((await generateReadingSummary({ ...input, chunks: [{ ...chunks[0], content: 'x'.repeat(220001) }, chunks[1]] })).ok).toBe(false)
  expect(prepareGenerationSources).not.toHaveBeenCalled()
  expect(generateWithSourceRecovery).not.toHaveBeenCalled()
})
it('rejects generic headings, invented citations and malformed content', () => {
  const value = artifact()
  value.sections[0].title = 'The argument'
  value.sections[0].blocks[0].sourceRef.fileId = 'excluded'
  const issues = readingSummaryIssues(value, input.kind, chunks.slice(0, 2), 'reading')
  expect(issues).toContain('Replace generic headings with reading-specific claims or questions')
  expect(issues).toContain('Missing or invalid selected-source reference')
})
it('returns a failure without an artifact when repair still fails', async () => {
  vi.mocked(generateWithSourceRecovery).mockResolvedValue(response({ sections: [] }))
  const result = await generateReadingSummary(input)
  expect(result.ok).toBe(false)
  expect(result).not.toHaveProperty('artifact')
  expect(generateWithSourceRecovery).toHaveBeenCalledTimes(2)
})
