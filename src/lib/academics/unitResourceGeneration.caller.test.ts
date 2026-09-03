import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SourceChunk } from '@/lib/types'

const mocks = vi.hoisted(() => ({
  prepare: vi.fn(),
  generate: vi.fn(),
}))

vi.mock('@/lib/academics/syncGenerationSources', () => ({ prepareGenerationSources: mocks.prepare }))
vi.mock('@/lib/intelligence/studyTools', () => ({ studyTools: { generate: mocks.generate } }))

import { generateUnitMasteryOutline } from './generateUnitMasteryOutline'
import { generateUnitQuestionBank } from './generateUnitQuestionBank'

const sources: SourceChunk[] = [
  { id: 'chunk-1', fileId: 'file-1', courseId: 'course-1', content: 'Current unit syllabus standard and evidence.', coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 0 },
  { id: 'chunk-2', fileId: 'file-1', courseId: 'course-1', content: 'Prior unit control evidence.', coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 1 },
]

describe('unit resource generation callers', () => {
  beforeEach(() => {
    mocks.prepare.mockReset()
    mocks.generate.mockReset()
    mocks.prepare.mockResolvedValue({ ok: true, scopeId: 'class-material', chunkIds: ['chunk-1', 'chunk-2'] })
  })

  it('assembles a mastery outline request without sending source text', async () => {
    mocks.generate.mockResolvedValue({ ok: true, data: {
      artifact: {
        title: 'Unit 2 mastery', unit: 'Unit 2', standards: [{
          id: 'std-1', title: 'Gene expression', understand: ['DNA is transcribed into RNA.', 'The primary transcript is processed.', 'Mature mRNA is translated into a polypeptide.', 'Template and coding strands relate differently to RNA.', 'Bacterial and eukaryotic cells organize gene expression differently.'],
          beAbleToDo: ['Predict the result of a processing disruption.', 'Trace an unfamiliar sequence from template DNA to mature mRNA.'], watchFor: ['Do not confuse transcription and translation.'], sourceChunkIds: ['chunk-1'],
        }],
      }, citations: [],
    } })

    const outcome = await generateUnitMasteryOutline({ courseId: 'course-1', chunks: sources, unit: 'Unit 2', label: 'BIOL 103' })

    expect(outcome.ok).toBe(true)
    expect(outcome.artifact).toMatchObject({ courseId: 'course-1', unit: 'Unit 2', specId: 'unit-mastery-outline-v1', sourceChunkIds: ['chunk-1'] })
    const request = mocks.generate.mock.calls[0][0]
    expect(request).toMatchObject({ action: 'generate', specId: 'unit-mastery-outline-v1', chunkIds: ['chunk-1', 'chunk-2'] })
    expect(JSON.stringify(request)).not.toContain(sources[0].content)
    expect(request.systemPrompt).toContain('UMO-STANDARDS')
    expect(request.systemPrompt).toContain('UMO-DEPTH')
    expect(request.systemPrompt).toContain('at least five distinct Understand bullets')
    expect(request.request).toContain('do not summarize a detailed outline')
  })

  it('passes the biology 70/30 control and closed mastery coverage contract', async () => {
    mocks.generate.mockResolvedValue({ ok: true, data: {
      artifact: {
        title: 'Unit 2 questions', unit: 'Unit 2', courseStyle: 'biology', currentUnitPercent: 50, integrationPercent: 50,
        questions: [
          { id: 'q-1', prompt: 'Which result follows from the current-unit evidence?', options: ['A', 'B'], answer: 'A', rationale: 'The supplied standard supports A.', unit: 'Unit 2', scope: 'current-unit', move: 'application', primaryStandardId: 'std-1', sourceChunkIds: ['chunk-1'], difficulty: 'standard' },
          { id: 'q-2', prompt: 'How does the prior control change the interpretation?', options: ['C', 'D'], answer: 'C', rationale: 'The supplied control evidence supports C.', unit: 'Unit 2', scope: 'prior-unit-integration', move: 'integration', primaryStandardId: 'std-2', secondaryStandardIds: ['std-1'], sourceChunkIds: ['chunk-1', 'chunk-2'], difficulty: 'challenging' },
        ],
      }, citations: [],
    } })

    const outcome = await generateUnitQuestionBank({ courseId: 'course-1', chunks: sources, unit: 'Unit 2', label: 'BIOL 103', course: { code: 'BIOL 103', title: 'How Cells Function' }, currentUnitPercent: 50, masteryStandardIds: ['std-1', 'std-2'] })

    expect(outcome.ok).toBe(true)
    expect(outcome.artifact).toMatchObject({ courseId: 'course-1', unit: 'Unit 2', currentUnitPercent: 50, integrationPercent: 50, specId: 'unit-question-bank-v1' })
    const request = mocks.generate.mock.calls[0][0]
    expect(request.systemPrompt).toContain('UQB-BALANCE')
    expect(request.systemPrompt).toContain('UQB-NO-COPY')
    expect(request.systemPrompt).toContain('Mastery standard IDs to cover exactly: std-1, std-2')
    expect(JSON.stringify(request)).not.toContain(sources[1].content)
  })

  it('returns an invalid-response outcome instead of saving a weak provider artifact', async () => {
    mocks.generate.mockResolvedValue({ ok: true, data: {
      artifact: { title: 'Unit 2 questions', unit: 'Unit 2', courseStyle: 'biology', currentUnitPercent: 100, integrationPercent: 0, questions: [{ id: 'q-1', prompt: 'Which result follows from the evidence?', options: ['A', 'B'], answer: 'C', rationale: 'Unsupported.', unit: 'Unit 2', scope: 'current-unit', move: 'application', primaryStandardId: 'std-1', sourceChunkIds: ['chunk-1'], difficulty: 'standard' }] }, citations: [],
    } })

    const outcome = await generateUnitQuestionBank({ courseId: 'course-1', chunks: sources, unit: 'Unit 2', label: 'BIOL 103', course: { code: 'BIOL 103', title: 'How Cells Function' } })

    expect(outcome).toMatchObject({ ok: false, failure: 'invalid-response' })
  })
})
