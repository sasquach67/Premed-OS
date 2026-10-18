import { beforeEach, expect, it, vi } from 'vitest'
import { generateUnitMasteryOutline } from './generateUnitMasteryOutline'
import { generateWithSourceRecovery } from './syncGenerationSources'
import type { SourceChunk } from '@/lib/types'

vi.mock('./syncGenerationSources', () => ({
  prepareGenerationSources: vi.fn(async () => ({ ok: true, scopeId: 'scope', chunkIds: ['chunk-1'] })),
  generateWithSourceRecovery: vi.fn(),
}))
vi.mock('./generationPolicy', () => ({ assertGenerationAllowed: vi.fn(), generatedTitle: (s: string) => s, GenerationNotAllowedError: class extends Error {} }))

// Invented workshop fixture; no course material or provider execution.
const question = 'Which marked route reaches the station with the fewest turns?'
const skill = 'Given a route map, compare the turns on each marked route.'
const standard = {
  id: 'objective-1', title: 'Study objective: Route comparison', sourceChunkIds: ['chunk-1'],
  howTested: { setup: 'A route map is given; compare the turns.', questions: [{ id: 'q-route', text: question, sourceChunkIds: ['chunk-1'] }] },
  applicationSkills: [{ text: skill, questionIds: ['q-route'] }],
  understand: ['Routes can be compared by counting direction changes.'], beAbleToDo: [skill],
  freeRecallCues: [], watchFor: [], examPractice: [],
}
const artifact = { title: 'Route comparison', unit: 'Workshop', standards: [standard] }
const input = { courseId: 'course-1', chunks: [{ id: 'chunk-1', content: `Compare direction changes. ${question}` } as SourceChunk], unit: 'Workshop', label: 'Route comparison' }
const response = (value: unknown) => ({ ok: true as const, data: { artifact: value, citations: [], auditStatus: 'approved' as const } })
beforeEach(() => { vi.clearAllMocks(); vi.mocked(generateWithSourceRecovery).mockReset() })

it('saves actual quoted questions, linked observable skills and facts without generated practice', async () => {
  vi.mocked(generateWithSourceRecovery).mockResolvedValue(response(artifact))
  const result = await generateUnitMasteryOutline(input)
  expect(result.ok).toBe(true)
  expect(result.artifact?.standards[0]).toMatchObject({ ...standard, masteryState: 'not-started' })
  expect(generateWithSourceRecovery).toHaveBeenCalledTimes(1)
})

it('repairs unsupported question text once using exact feedback and the same sources', async () => {
  vi.mocked(generateWithSourceRecovery)
    .mockResolvedValueOnce(response({ ...artifact, standards: [{ ...standard, howTested: { ...standard.howTested, questions: [{ ...standard.howTested.questions[0], text: 'Invented question?' }] } }] }))
    .mockResolvedValueOnce(response(artifact))
  const result = await generateUnitMasteryOutline(input)
  expect(result.ok).toBe(true)
  const calls = vi.mocked(generateWithSourceRecovery).mock.calls
  expect(calls).toHaveLength(2)
  expect(calls[1][2].request).toContain('text must quote an actual selected source')
  expect(calls[1][2].chunkIds).toEqual(['chunk-1'])
  expect(calls[1][2].systemPrompt).toBe(calls[0][2].systemPrompt)
})

it.each([
  [{ ...standard, howTested: undefined }, 'howTested'],
  [{ ...standard, applicationSkills: [{ text: skill, questionIds: ['wrong-objective'] }] }, 'references must resolve'],
  [{ ...standard, sourceChunkIds: ['unknown'] }, 'outside selected sources'],
  [{ ...standard, understand: [] }, 'factual answers required'],
  [{ ...standard, freeRecallCues: ['Invent a recall task.'] }, 'retired fields must be empty'],
  [{ ...standard, beAbleToDo: ['Different skill'] }, 'compatibility strings must match'],
])('never saves a still-invalid repair', async (invalid, issue) => {
  vi.mocked(generateWithSourceRecovery).mockResolvedValue(response({ ...artifact, standards: [invalid] }))
  const result = await generateUnitMasteryOutline(input)
  expect(result.ok).toBe(false)
  expect(result.artifact).toBeUndefined()
  expect(result.message).toContain(issue)
  expect(generateWithSourceRecovery).toHaveBeenCalledTimes(2)
})

it('accepts supported concepts without real source questions using an honest reason', async () => {
  const noQuestion = { ...standard, howTested: { setup: 'Use the route comparison principle.', questions: [], noQuestionsReason: 'The supplied workshop notes contain no course question for this objective.' }, applicationSkills: [{ text: skill, questionIds: [] }] }
  vi.mocked(generateWithSourceRecovery).mockResolvedValue(response({ ...artifact, standards: [noQuestion] }))
  const result = await generateUnitMasteryOutline({ ...input, chunks: [{ ...input.chunks[0], content: 'Routes are compared by counting turns.' }] })
  expect(result.ok).toBe(true)
  expect(result.artifact?.standards[0].evidenceLimit).toBeUndefined()
})

it('rejects empty questions without a reason or a reason alongside real questions', async () => {
  for (const howTested of [{ setup: 'Compare routes.', questions: [] }, { ...standard.howTested, noQuestionsReason: 'No questions.' }]) {
    vi.mocked(generateWithSourceRecovery).mockResolvedValue(response({ ...artifact, standards: [{ ...standard, howTested }] }))
    expect((await generateUnitMasteryOutline(input)).ok).toBe(false)
  }
})

it('does not retry a provider failure or return invented work', async () => {
  vi.mocked(generateWithSourceRecovery).mockResolvedValue({ ok: false, code: 'unavailable', message: 'Provider unavailable' })
  const result = await generateUnitMasteryOutline(input)
  expect(result.ok).toBe(false)
  expect(result.artifact).toBeUndefined()
  expect(generateWithSourceRecovery).toHaveBeenCalledTimes(1)
})

it('preserves exam scope, student instructions, personal-note role and final audit status through repair', async () => {
  vi.mocked(generateWithSourceRecovery).mockResolvedValueOnce(response({ ...artifact, standards: [] }))
    .mockResolvedValueOnce({ ok: true, data: { artifact, citations: [], auditStatus: 'unavailable' } })
  const result = await generateUnitMasteryOutline({ ...input, scope: 'exam', chunks: [{ ...input.chunks[0], fileId: 'review' }], personalNoteChunkIds: ['chunk-1', 'not-selected'], studyIntent: { purpose: 'exam-prep', reviewSheetFileId: 'review', instructions: 'Connect the routes.' } })
  expect(result.ok).toBe(true)
  expect(result.artifact?.scope).toBe('exam')
  expect(result.artifact?.generationAuditStatus).toBe('unavailable')
  for (const call of vi.mocked(generateWithSourceRecovery).mock.calls) {
    expect(call[2].request).toContain('Exam review-sheet chunk IDs: chunk-1.')
    expect(call[2].request).toContain('Connect the routes.')
    expect(call[2].request).toContain('Personal class-note chunk IDs: chunk-1.')
    expect(call[2].request).not.toContain('not-selected')
    expect(call[2].request).toContain('never invent a question')
    expect(call[2].systemPrompt).toContain('Do not require formal learning objectives')
  }
})
