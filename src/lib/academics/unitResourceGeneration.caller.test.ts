import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AcademicFile, SourceChunk } from '@/lib/types'

const mocks = vi.hoisted(() => ({
  prepare: vi.fn(),
  generate: vi.fn(),
  prepareVisuals: vi.fn(),
}))

vi.mock('@/lib/academics/syncGenerationSources', () => ({ prepareGenerationSources: mocks.prepare }))
vi.mock('@/lib/intelligence/studyTools', () => ({ studyTools: { generate: mocks.generate } }))
vi.mock('@/lib/academics/questionBankVisualSources', () => ({ prepareQuestionBankVisualSources: mocks.prepareVisuals }))

import { generateUnitMasteryOutline } from './generateUnitMasteryOutline'
import { generateStudyGuide } from './generateStudyGuide'
import { generateUnitQuestionBank, referenceQuestionPhrases } from './generateUnitQuestionBank'

const sources: SourceChunk[] = [
  { id: 'chunk-1', fileId: 'file-1', courseId: 'course-1', content: 'Current unit syllabus standard and evidence.', coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 0 },
  { id: 'chunk-2', fileId: 'file-1', courseId: 'course-1', content: 'Prior unit control evidence.', coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 1 },
]
const textbookImage: AcademicFile = {
  id: 'textbook-page', courseId: 'course-1', sourceType: 'upload', title: 'Textbook page',
  type: 'reading', blobRef: 'idb://textbook-page', mimeType: 'image/png', linkedTopicIds: [],
  owner: 'mine', processingStatus: 'ready', createdAt: 1, updatedAt: 1, order: 0,
}

describe('unit resource generation callers', () => {
  beforeEach(() => {
    mocks.prepare.mockReset()
    mocks.generate.mockReset()
    mocks.prepareVisuals.mockReset()
    mocks.prepareVisuals.mockResolvedValue({ sources: [], skippedFileIds: [] })
    mocks.prepare.mockResolvedValue({ ok: true, scopeId: 'class-material', chunkIds: ['chunk-1', 'chunk-2'] })
  })

  it('assembles a mastery outline request without sending source text', async () => {
    mocks.generate.mockResolvedValue({ ok: true, data: {
      artifact: {
        title: 'Unit 2 mastery', unit: 'Unit 2', standards: [{
          id: 'std-1', title: 'Gene expression', understand: ['DNA is transcribed into RNA.', 'The primary transcript is processed.', 'Mature mRNA is translated into a polypeptide.', 'Template and coding strands relate differently to RNA.', 'Bacterial and eukaryotic cells organize gene expression differently.'],
          freeRecallCues: ['Without notes, explain transcription and RNA processing from template DNA to mature mRNA.'],
          beAbleToDo: ['Predict the result of a processing disruption.', 'Trace an unfamiliar sequence from template DNA to mature mRNA.'], watchFor: ['Do not confuse transcription and translation.'], sourceChunkIds: ['chunk-1'],
        }],
      }, citations: [],
    } })

    const outcome = await generateUnitMasteryOutline({ courseId: 'course-1', chunks: sources, unit: 'Unit 2', label: 'BIOL 103', practiceQuestionChunkIds: ['chunk-1'] })

    expect(outcome.ok).toBe(true)
    expect(outcome.artifact).toMatchObject({ courseId: 'course-1', unit: 'Unit 2', specId: 'unit-mastery-outline-v1', sourceChunkIds: ['chunk-1'] })
    const request = mocks.generate.mock.calls[0][0]
    expect(request).toMatchObject({ action: 'generate', specId: 'unit-mastery-outline-v1', chunkIds: ['chunk-1', 'chunk-2'] })
    expect(JSON.stringify(request)).not.toContain(sources[0].content)
    expect(request.systemPrompt).toContain('UMO-STANDARDS')
    expect(request.systemPrompt).toContain('UMO-DEPTH')
    expect(request.systemPrompt).toContain('UMO-PRACTICE-EVIDENCE')
    expect(request.systemPrompt).toContain('UMO-RECALL')
    expect(request.systemPrompt).toContain('at least five distinct Understand bullets')
    expect(request.systemPrompt).toContain('Reference-question chunk IDs: chunk-1')
    expect(request.request).toContain('do not summarize a detailed outline')
    expect(request.request).toContain('free-recall cues')
    expect(request.request).toContain('marked question passages as task-pattern evidence')
  })

  it('marks supplied question passages as teaching examples in a study guide', async () => {
    mocks.generate.mockResolvedValue({ ok: true, data: {
      artifact: { sections: [{ id: 'core-concepts', title: 'CORE CONCEPTS', blocks: [{ id: 'block-1', type: 'prose', text: { content: 'A control isolates the variable whose effect is being tested.' }, provenance: 'source', sourceRef: { fileId: 'file-1', chunkId: 'chunk-1', start: 0, end: 40 } }] }] },
      citations: [], auditStatus: 'approved',
    } })

    const outcome = await generateStudyGuide({ courseId: 'course-1', chunks: sources, label: 'BIOL 103 · Unit 2', practiceQuestionChunkIds: ['chunk-1'] })

    expect(outcome.ok).toBe(true)
    const request = mocks.generate.mock.calls[0][0]
    expect(request.systemPrompt).toContain('SG-PRACTICE-EXAMPLES')
    expect(request.systemPrompt).toContain('SG-AT-A-GLANCE')
    expect(request.systemPrompt).toContain('SG-FULL-DEPTH')
    expect(request.systemPrompt).toContain('SG-NO-DUPLICATE-LAYERS')
    expect(request.systemPrompt).toContain('Reference-question chunk IDs: chunk-1')
    expect(request.systemPrompt).toContain('never treat a distractor as fact')
    expect(request.request).toContain('marked question passages as source-backed explanatory examples')
    expect(request.request).toContain('AT A GLANCE is its opening layer')
    expect(JSON.stringify(request)).not.toContain(sources[0].content)
  })

  it('passes the biology 70/30 control and closed mastery coverage contract', async () => {
    mocks.generate.mockResolvedValue({ ok: true, data: {
      artifact: {
        title: 'Unit 2 questions', unit: 'Unit 2', courseStyle: 'biology', currentUnitPercent: 50, integrationPercent: 50,
        stimuli: [{ id: 'stimulus-1', title: 'Processing pathway', kind: 'diagram', context: 'A processing factor is disrupted in a cell.', caption: 'Source-grounded schematic reconstructed for practice.', altText: 'A diagram connects primary RNA to mature messenger RNA.', basis: 'generated-schematic', sourceChunkIds: ['chunk-1'], diagram: { nodes: [{ id: 'n1', label: 'Primary RNA', x: 20, y: 50 }, { id: 'n2', label: 'Mature mRNA', x: 75, y: 50 }], edges: [{ from: 'n1', to: 'n2' }] } }],
        questions: [
          { id: 'q-1', prompt: 'Which result follows from the current-unit evidence in the diagram?', options: ['A', 'B'], answer: 'A', rationale: 'The supplied standard supports A.', unit: 'Unit 2', scope: 'current-unit', move: 'application', primaryStandardId: 'std-1', sourceChunkIds: ['chunk-1'], difficulty: 'standard', stimulusIds: ['stimulus-1'] },
          { id: 'q-2', prompt: 'How does the prior control change the interpretation of the diagram?', options: ['C', 'D'], answer: 'C', rationale: 'The supplied control evidence supports C.', unit: 'Unit 2', scope: 'prior-unit-integration', move: 'integration', primaryStandardId: 'std-2', secondaryStandardIds: ['std-1'], sourceChunkIds: ['chunk-1', 'chunk-2'], difficulty: 'challenging', stimulusIds: ['stimulus-1'] },
        ],
      }, citations: [], visualSourceFileIds: ['textbook-page'], webSearchRequests: 1,
    } })

    mocks.prepareVisuals.mockResolvedValue({ sources: [{ fileId: 'textbook-page', title: 'Textbook page', mimeType: 'image/png', size: 4, dataBase64: 'cGFnZQ==' }], skippedFileIds: [] })
    const outcome = await generateUnitQuestionBank({ courseId: 'course-1', chunks: sources, unit: 'Unit 2', label: 'BIOL 103', course: { code: 'BIOL 103', title: 'How Cells Function' }, currentUnitPercent: 50, practiceQuestionChunkIds: ['chunk-1'], masteryStandardIds: ['std-1', 'std-2'], visualFiles: [textbookImage] })

    expect(outcome.ok).toBe(true)
    expect(outcome.artifact).toMatchObject({ courseId: 'course-1', unit: 'Unit 2', currentUnitPercent: 50, integrationPercent: 50, specId: 'unit-question-bank-v1', visualSourceFileIds: ['textbook-page'], webPatternSearchCount: 1 })
    const request = mocks.generate.mock.calls[0][0]
    expect(request.systemPrompt).toContain('UQB-BALANCE')
    expect(request.systemPrompt).toContain('UQB-REFERENCE-MODEL')
    expect(request.systemPrompt).toContain('UQB-NO-COPY')
    expect(request.systemPrompt).toContain('UQB-APPLICATION')
    expect(request.systemPrompt).toContain('UQB-STIMULUS')
    expect(request.systemPrompt).toContain('UQB-VISUAL')
    expect(request.systemPrompt).toContain('UQB-FACTUAL')
    expect(request.systemPrompt).toContain('UQB-TEXTBOOK-VISION')
    expect(request.systemPrompt).toContain('UQB-WEB-PATTERN')
    expect(request.systemPrompt).toContain('Mastery standard IDs to cover exactly: std-1, std-2')
    expect(request.systemPrompt).toContain('Reference-question chunk IDs: chunk-1')
    expect(request.request).toContain('marked question passages as assessment-pattern evidence')
    expect(request.request).toContain('Inspect all 1 selected image pages')
    expect(request.visualSources).toEqual([expect.objectContaining({ fileId: 'textbook-page' })])
    expect(request.webPatternResearch).toBe(true)
    expect(JSON.stringify(request)).not.toContain(sources[1].content)
  })

  it('extracts recognizable supplied stems for the deterministic copy guard', () => {
    const phrases = referenceQuestionPhrases([
      { ...sources[0], content: 'Question 1: Which control would best isolate the effect of temperature?\nBackground context only.' },
    ], ['chunk-1'])

    expect(phrases).toContain('Question 1: Which control would best isolate the effect of temperature?')
  })

  it('fails closed when a selected image cannot complete the visual pass', async () => {
    mocks.prepareVisuals.mockResolvedValue({ sources: [], skippedFileIds: ['textbook-page'] })

    const outcome = await generateUnitQuestionBank({
      courseId: 'course-1', chunks: sources, unit: 'Unit 2', label: 'BIOL 103',
      course: { code: 'BIOL 103', title: 'How Cells Function' }, visualFiles: [textbookImage],
    })

    expect(outcome).toMatchObject({ ok: false, failure: 'provider-unavailable' })
    expect(outcome.message).toContain("could not be prepared for Claude's visual pass")
    expect(mocks.generate).not.toHaveBeenCalled()
  })

  it('returns an invalid-response outcome instead of saving a weak provider artifact', async () => {
    mocks.generate.mockResolvedValue({ ok: true, data: {
      artifact: { title: 'Unit 2 questions', unit: 'Unit 2', courseStyle: 'biology', currentUnitPercent: 100, integrationPercent: 0, stimuli: [{ id: 'stimulus-1', title: 'Evidence', kind: 'passage', context: 'A source-grounded scenario.', caption: 'Source-derived passage.', altText: 'A short passage describing the source-grounded scenario.', basis: 'source-derived', sourceChunkIds: ['chunk-1'] }], questions: [{ id: 'q-1', prompt: 'Which result follows from the evidence?', options: ['A', 'B'], answer: 'C', rationale: 'Unsupported.', unit: 'Unit 2', scope: 'current-unit', move: 'application', primaryStandardId: 'std-1', sourceChunkIds: ['chunk-1'], difficulty: 'standard', stimulusIds: ['stimulus-1'] }] }, citations: [], auditStatus: 'approved',
    } })

    const outcome = await generateUnitQuestionBank({ courseId: 'course-1', chunks: sources, unit: 'Unit 2', label: 'BIOL 103', course: { code: 'BIOL 103', title: 'How Cells Function' } })

    expect(outcome).toMatchObject({ ok: false, failure: 'invalid-response' })
  })
})
