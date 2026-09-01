import { describe, expect, it } from 'vitest'
import { blueprintForCourse, validateMasteryOutline, validateUnitQuestionBank } from './unitQuestionBank'

const chunks = ['chunk-unit', 'chunk-prior']
const outline = {
  title: 'Generated · Unit 2 mastery', unit: 'Unit 2', standards: [{
    id: 'standard-1', title: 'Gene expression',
    understand: ['DNA information is transcribed into a mature transcript.'],
    beAbleToDo: ['Predict what changes when a processing step is disrupted.'],
    watchFor: ['Do not confuse mRNA processing with translation.'], sourceChunkIds: ['chunk-unit'],
  }],
}
const question = (patch: Record<string, unknown> = {}) => ({
  id: 'q-1', prompt: 'A cell loses a processing factor. Which result follows?', options: ['The transcript is not mature.', 'The DNA is deleted.', 'The ribosome stops existing.', 'The cell gains a chromosome.'], answer: 'The transcript is not mature.', rationale: 'The supplied process description places this factor before translation.', unit: 'Unit 2', scope: 'current-unit', move: 'application', primaryStandardId: 'standard-1', sourceChunkIds: ['chunk-unit'], difficulty: 'standard', ...patch,
})

describe('unit question bank contracts', () => {
  it('selects course-specific biology and psychology blueprints', () => {
    expect(blueprintForCourse({ code: 'BIOL 103', title: 'How Cells Function' }).courseStyle).toBe('biology')
    expect(blueprintForCourse({ code: 'PSYC 101', title: 'Introduction to Psychology' }).courseStyle).toBe('psychology')
    expect(blueprintForCourse({ code: 'ANTH 147', title: 'Comparative Healing Systems' }).courseStyle).toBe('general')
  })

  it('validates a source-grounded mastery outline', () => {
    expect(validateMasteryOutline(outline, chunks)).toEqual(outline)
    expect(validateMasteryOutline({ ...outline, standards: [{ ...outline.standards[0], sourceChunkIds: ['not-closed'] }] }, chunks)).toBeNull()
  })

  it('rejects ambiguous or duplicated multiple-choice answers', () => {
    const bank = { title: 'Generated · Unit 2 questions', unit: 'Unit 2', courseStyle: 'biology', currentUnitPercent: 100, integrationPercent: 0, questions: [question()] }
    expect(validateUnitQuestionBank(bank, chunks)).toEqual(bank)
    expect(validateUnitQuestionBank({ ...bank, questions: [question({ options: ['same', 'same'], answer: 'same' })] }, chunks)).toBeNull()
    expect(validateUnitQuestionBank({ ...bank, questions: [question({ answer: 'not an option' })] }, chunks)).toBeNull()
    expect(validateUnitQuestionBank({ ...bank, questions: [question({ prompt: 'Which is true?' })] }, chunks)).toBeNull()
  })

  it('enforces expected-standard coverage when a mastery outline is available', () => {
    const bank = { title: 'Generated · Unit 2 questions', unit: 'Unit 2', courseStyle: 'biology', currentUnitPercent: 100, integrationPercent: 0, questions: [question()] }
    expect(validateUnitQuestionBank(bank, chunks, [], ['standard-1', 'standard-2'])).toBeNull()
    expect(validateUnitQuestionBank({ ...bank, questions: [question({ secondaryStandardIds: ['standard-2'] })] }, chunks, [], ['standard-1', 'standard-2'])).not.toBeNull()
  })

  it('enforces biology integration and blocks private assessment phrase reuse', () => {
    const bank = { title: 'Generated · Unit 2 questions', unit: 'Unit 2', courseStyle: 'biology', currentUnitPercent: 50, integrationPercent: 50, questions: [question(), question({ id: 'q-2', prompt: 'A prior control changes the interpretation of this processing result. Which link matters?', scope: 'prior-unit-integration', move: 'integration', secondaryStandardIds: ['standard-prior'], sourceChunkIds: chunks })] }
    expect(validateUnitQuestionBank(bank, chunks)).toEqual(bank)
    expect(validateUnitQuestionBank({ ...bank, questions: [question(), question({ id: 'q-2', scope: 'current-unit' })] }, chunks)).toBeNull()
    expect(validateUnitQuestionBank({ ...bank, questions: [question({ prompt: 'In the supplied exam, what is the independent variable?' }), bank.questions[1]] }, chunks, ['what is the independent variable'])).toBeNull()
  })
})
