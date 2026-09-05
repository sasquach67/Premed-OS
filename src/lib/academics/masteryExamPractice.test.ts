import { describe, expect, it } from 'vitest'
import { validateMasteryOutline } from './unitQuestionBank'
import { createOpenAICitationWire } from '../../../supabase/functions/_shared/openAICitationWire'

const question = {
  prompt: 'In a hypothetical transcription exercise, the DNA template is 3′-TAC GGA-5′. Write the RNA product with its direction and explain which base-pairing rules determine it.',
  answer: '5′-AUG CCU-3′.',
  rationale: 'Read the template from 3′ to 5′ and build RNA from 5′ to 3′. T pairs with A, A with U, C with G, and G with C, giving AUG CCU.',
  sourceChunkIds: ['source-1'],
}
const standard = {
  id: 'objective-1', title: 'Transcription',
  freeRecallCues: ['Explain how transcription uses the template strand without notes.'],
  understand: ['Template selection', 'Complementary pairing', 'RNA direction', 'Initiation', 'Termination'],
  beAbleToDo: ['Derive the RNA sequence.', 'Distinguish the coding strand from the template.'],
  watchFor: ['Check strand direction before base pairing.'],
  sourceChunkIds: ['source-1'], examPractice: [question],
}
const outline = { title: 'Gene expression', unit: 'Lesson 2', standards: [standard] }
const validate = (practice: unknown) => validateMasteryOutline({ ...outline, standards: [{ ...standard, examPractice: practice }] }, ['source-1', 'source-2'], [], true)

describe('mastery exam practice boundary', () => {
  it('requires practice only for new generation; does not populate a legacy map', () => {
    const legacy = { ...outline, standards: [{ ...standard, examPractice: undefined }] }
    expect(validateMasteryOutline(legacy, ['source-1'])).toEqual(legacy)
    expect(validateMasteryOutline(legacy, ['source-1'], [], true)).toBeNull()
    expect(legacy.standards[0].examPractice).toBeUndefined()
    expect(validate([question])).not.toBeNull()
  })
  it.each([[], [question, question, question], [null], [{ ...question, answer: '' }], [{ ...question, sourceChunkIds: ['source-2'] }], [{ ...question, sourceChunkIds: ['unknown'] }]].map((practice) => ({ practice })))('rejects incomplete practice or sources outside its objective: $practice', ({ practice }) => {
    expect(validate(practice)).toBeNull()
  })
  it('rejects duplicate source IDs and empty reasoning disguised as the answer', () => {
    expect(validate([{ ...question, sourceChunkIds: ['source-1', 'source-1'] }])).toBeNull()
    expect(validate([{ ...question, rationale: question.answer }])).toBeNull()
    expect(validate([{ ...question, rationale: 'Because it is correct.' }])).toBeNull()
  })
  it('rejects definition recall and unresolved visual dependencies', () => {
    expect(validate([{ ...question, prompt: 'What is transcription?' }])).toBeNull()
    expect(validate([{ ...question, prompt: 'In a hypothetical exercise, use the diagram above to identify which DNA strand is the template. Explain how the RNA product determines your choice.' }])).toBeNull()
  })
  it('rejects the same question reused across otherwise distinct objectives', () => {
    const second = { ...standard, id: 'objective-2', title: 'Strand polarity', freeRecallCues: ['Draw both antiparallel DNA strands without notes.'], beAbleToDo: ['Label both strand directions.', 'Compare the DNA and RNA molecules.'] }
    expect(validateMasteryOutline({ ...outline, standards: [standard, second] }, ['source-1'], [], true)).toBeNull()
  })
  it('rejects a supplied private assessment stem without echoing it in diagnostics', () => {
    const issues: string[] = []
    expect(validateMasteryOutline(outline, ['source-1'], issues, true, { privateAssessmentPhrases: [question.prompt] })).toBeNull()
    expect(issues.join(' ')).toContain('standards[0].examPractice[0]')
    expect(issues.join(' ')).not.toContain(question.prompt)
  })
  it('uses exact identity for source IDs, not punctuation-normalized text', () => {
    const exact = { ...standard, sourceChunkIds: ['source-1', 'source_1'], examPractice: [{ ...question, sourceChunkIds: ['source-1', 'source_1'] }] }
    expect(validateMasteryOutline({ ...outline, standards: [exact] }, ['source-1', 'source_1'], [], true)).not.toBeNull()
  })
  it('accepts concise quantitative prompts and tasks asking the student to draw a diagram', () => {
    expect(validate([{ ...question, prompt: 'A hypothetical sample doubles from 4 to 8 units. Calculate the percentage increase.', answer: '100%.', rationale: '(8 − 4) / 4 × 100 = 100%.' }])).not.toBeNull()
    expect(validate([{ ...question, prompt: 'For hypothetical template 3′-TAC-5′, draw an antiparallel RNA strand and label its direction.', answer: '5′-AUG-3′.', rationale: 'Complementary RNA bases are A, U and G; the RNA strand runs opposite to the template.' }])).not.toBeNull()
  })
  it('validates nested exam evidence after the existing citation transport decoder', () => {
    const wire = createOpenAICitationWire([{ chunk_id: 'source-1', file_id: 'file-1', content: 'RNA is complementary and antiparallel to its DNA template.' }])
    const provider = { ...outline, standards: [{ ...standard, sourceChunkIds: ['S1'], examPractice: [{ ...question, sourceChunkIds: ['S1'] }] }] }
    expect(validateMasteryOutline(wire.decode(provider), ['source-1'], [], true)).toEqual(outline)
    provider.standards[0].examPractice[0].sourceChunkIds = ['S999']
    expect(validateMasteryOutline(wire.decode(provider), ['source-1'], [], true)).toBeNull()
  })
})
