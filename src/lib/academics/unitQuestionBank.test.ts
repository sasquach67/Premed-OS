import { describe, expect, it } from 'vitest'
import { blueprintForCourse, validateMasteryOutline, validateUnitQuestionBank } from './unitQuestionBank'

const chunks = ['chunk-unit', 'chunk-prior']
const stimulus = (patch: Record<string, unknown> = {}) => ({
  id: 'stimulus-1', title: 'RNA processing experiment', kind: 'diagram',
  context: 'Researchers disrupt one step in RNA processing and trace the resulting molecules.',
  caption: 'Source-grounded schematic reconstructed for practice.',
  altText: 'A process diagram connects primary RNA to mature messenger RNA and then protein.',
  basis: 'generated-schematic', sourceChunkIds: ['chunk-unit'],
  diagram: { nodes: [{ id: 'n1', label: 'Primary RNA', x: 20, y: 50 }, { id: 'n2', label: 'Mature mRNA', x: 75, y: 50 }], edges: [{ from: 'n1', to: 'n2', label: 'processing' }] },
  ...patch,
})
const outline = {
  title: 'Generated · Unit 2 mastery', unit: 'Unit 2', standards: [{
    id: 'standard-1', title: 'Gene expression',
    freeRecallCues: ['Without notes, explain transcription and RNA processing from template DNA to mature mRNA.'],
    understand: ['DNA information is transcribed into a primary RNA transcript.', 'RNA processing removes introns and retains exons.', 'Translation reads mature mRNA to build a polypeptide.', 'The template and coding DNA strands have different relationships to the RNA product.', 'Bacterial and eukaryotic cells separate these steps differently.'],
    beAbleToDo: ['Predict what changes when a processing step is disrupted.', 'Distinguish template DNA, coding DNA, and mature mRNA for an unfamiliar sequence.'],
    watchFor: ['Do not confuse mRNA processing with translation.'], sourceChunkIds: ['chunk-unit'],
  }],
}
const question = (patch: Record<string, unknown> = {}) => ({
  id: 'q-1', prompt: 'Based on the process diagram, a cell loses a processing factor. Which result follows?', options: ['The transcript is not mature.', 'The DNA is deleted.', 'The ribosome stops existing.', 'The cell gains a chromosome.'], answer: 'The transcript is not mature.', rationale: 'The supplied process description places this factor before translation.', unit: 'Unit 2', scope: 'current-unit', move: 'application', primaryStandardId: 'standard-1', sourceChunkIds: ['chunk-unit'], difficulty: 'standard', stimulusIds: ['stimulus-1'], ...patch,
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

  it('rejects a shallow outline or a generic application repeated across objectives', () => {
    expect(validateMasteryOutline({ ...outline, standards: [{ ...outline.standards[0], understand: ['Only one detail.'] }] }, chunks)).toBeNull()
    expect(validateMasteryOutline({ ...outline, standards: [{ ...outline.standards[0], freeRecallCues: undefined }] }, chunks)).toBeNull()
    expect(validateMasteryOutline({ ...outline, standards: [{ ...outline.standards[0], freeRecallCues: ['Explain this topic without notes.'] }] }, chunks)).toBeNull()
    expect(validateMasteryOutline({ ...outline, standards: [{ ...outline.standards[0], freeRecallCues: ['Explain transcription from template DNA to mature mRNA.'] }] }, chunks)).toBeNull()
    expect(validateMasteryOutline({ ...outline, standards: [
      outline.standards[0],
      { ...outline.standards[0], id: 'standard-2', title: 'Protein targeting' },
    ] }, chunks)).toBeNull()
  })

  it('rejects ambiguous or duplicated multiple-choice answers', () => {
    const bank = { title: 'Generated · Unit 2 questions', unit: 'Unit 2', courseStyle: 'biology', currentUnitPercent: 100, integrationPercent: 0, stimuli: [stimulus()], questions: [question()] }
    expect(validateUnitQuestionBank(bank, chunks)).toEqual(bank)
    expect(validateUnitQuestionBank({ ...bank, questions: [question({ options: ['same', 'same'], answer: 'same' })] }, chunks)).toBeNull()
    expect(validateUnitQuestionBank({ ...bank, questions: [question({ answer: 'not an option' })] }, chunks)).toBeNull()
    expect(validateUnitQuestionBank({ ...bank, questions: [question({ prompt: 'Which is true?' })] }, chunks)).toBeNull()
  })

  it('enforces expected-standard coverage when a mastery outline is available', () => {
    const bank = { title: 'Generated · Unit 2 questions', unit: 'Unit 2', courseStyle: 'biology', currentUnitPercent: 100, integrationPercent: 0, stimuli: [stimulus()], questions: [question()] }
    expect(validateUnitQuestionBank(bank, chunks, [], ['standard-1', 'standard-2'])).toBeNull()
    expect(validateUnitQuestionBank({ ...bank, questions: [question({ secondaryStandardIds: ['standard-2'] })] }, chunks, [], ['standard-1', 'standard-2'])).not.toBeNull()
  })

  it('enforces biology integration and blocks private assessment phrase reuse', () => {
    const bank = { title: 'Generated · Unit 2 questions', unit: 'Unit 2', courseStyle: 'biology', currentUnitPercent: 50, integrationPercent: 50, stimuli: [stimulus()], questions: [question(), question({ id: 'q-2', prompt: 'Using the diagram, a prior control changes the interpretation of this processing result. Which link matters?', scope: 'prior-unit-integration', move: 'integration', secondaryStandardIds: ['standard-prior'], sourceChunkIds: chunks })] }
    expect(validateUnitQuestionBank(bank, chunks)).toEqual(bank)
    expect(validateUnitQuestionBank({ ...bank, questions: [question(), question({ id: 'q-2', scope: 'current-unit' })] }, chunks)).toBeNull()
    expect(validateUnitQuestionBank({ ...bank, questions: [question({ prompt: 'In the supplied exam, what is the independent variable?' }), bank.questions[1]] }, chunks, ['what is the independent variable'])).toBeNull()
  })

  it('rejects recall-only, unlinked, decorative, or falsely empirical visuals', () => {
    const bank = { title: 'Generated · Unit 2 questions', unit: 'Unit 2', courseStyle: 'biology', currentUnitPercent: 100, integrationPercent: 0, stimuli: [stimulus()], questions: [question()] }
    expect(validateUnitQuestionBank({ ...bank, questions: [question({ move: 'recall' })] }, chunks)).toBeNull()
    expect(validateUnitQuestionBank({ ...bank, questions: [question({ stimulusIds: [] })] }, chunks)).toBeNull()
    expect(validateUnitQuestionBank({ ...bank, stimuli: [stimulus({ altText: 'diagram' })] }, chunks)).toBeNull()
    expect(validateUnitQuestionBank({ ...bank, stimuli: [stimulus({ kind: 'line-graph', basis: 'simulated-data', caption: 'Experimental measurements.', diagram: undefined, graph: { xLabel: 'Time', yLabel: 'RNA', series: [{ label: 'Control', points: [{ x: '0', y: 1 }, { x: '1', y: 2 }] }] } })] }, chunks)).toBeNull()
    expect(validateUnitQuestionBank({ ...bank, stimuli: [stimulus({ kind: 'line-graph', basis: 'source-derived', diagram: undefined, graph: undefined })] }, chunks, [], undefined, new Map([['chunk-unit', 'Observed values were 1 and 2.']]))).toBeNull()
  })

  it('requires source-derived graph values to occur in the cited source text', () => {
    const graph = stimulus({ kind: 'line-graph', basis: 'source-derived', diagram: undefined, graph: { xLabel: 'Time', yLabel: 'RNA', series: [{ label: 'Control', points: [{ x: '0 h', y: 1 }, { x: '1 h', y: 2 }] }] } })
    const bank = { title: 'Generated · Unit 2 questions', unit: 'Unit 2', courseStyle: 'biology', currentUnitPercent: 100, integrationPercent: 0, stimuli: [graph], questions: [question()] }
    expect(validateUnitQuestionBank(bank, chunks, [], undefined, new Map([['chunk-unit', 'Observed RNA values were 1 and 2.']]))).toEqual(bank)
    expect(validateUnitQuestionBank(bank, chunks, [], undefined, new Map([['chunk-unit', 'Observed RNA value was 1.']]))).toBeNull()
  })
})
