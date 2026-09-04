import { describe, expect, it } from 'vitest'
import type { GeneratedUnitQuestionBank } from '@/lib/types'
import { buildQuestionBankPdf, questionBankPdfFilename } from './questionBankPdf'

const bank: GeneratedUnitQuestionBank = {
  id: 'bank-1', courseId: 'course-1', title: 'Lesson 2: Gene Expression', unit: 'Lesson 2',
  specId: 'unit-question-bank-v1', specHash: 'hash', courseStyle: 'biology', currentUnitPercent: 100, integrationPercent: 0,
  generationProvider: 'anthropic', visualSourceFileIds: ['textbook-page'], webPatternSearchCount: 1,
  sourceChunkIds: ['chunk-1'], createdAt: 1, updatedAt: 1, order: 0,
  stimuli: [{
    id: 'stimulus-1', title: 'Expression pathway', kind: 'diagram', context: 'A processing factor is blocked.',
    caption: 'Original generated schematic.', altText: 'DNA connects to RNA and then protein.', basis: 'generated-schematic', sourceChunkIds: ['chunk-1'],
    diagram: { nodes: [{ id: 'dna', label: 'DNA', x: 20, y: 50 }, { id: 'rna', label: 'mRNA', x: 75, y: 50 }], edges: [{ from: 'dna', to: 'rna', label: 'transcription' }] },
  }],
  questions: [{
    id: 'question-1', prompt: 'Which result follows when the processing factor is blocked?', options: ['A product', 'B product', 'C product', 'D product'],
    answer: 'A product', rationale: 'The stimulus supports A.', unit: 'Lesson 2', scope: 'current-unit', move: 'application',
    primaryStandardId: 'standard-1', sourceChunkIds: ['chunk-1'], difficulty: 'standard', stimulusIds: ['stimulus-1'],
  }],
}

describe('question-bank PDF export', () => {
  it('uses a stable safe filename', () => {
    expect(questionBankPdfFilename(bank)).toBe('lesson-2-gene-expression.pdf')
  })

  it('builds a multi-section PDF with an answer-key page', async () => {
    const document = await buildQuestionBankPdf(bank)
    const bytes = new Uint8Array(document.output('arraybuffer'))
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('%PDF')
    expect(bytes.length).toBeGreaterThan(1_000)
    expect(document.getNumberOfPages()).toBeGreaterThanOrEqual(3)
  })
})
