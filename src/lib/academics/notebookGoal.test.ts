import { describe, expect, it } from 'vitest'
import { inferNotebookGoal, initialNotebookInstructions } from './notebookGoal'

const assessment = 'Help me prepare for an assessment using my class materials.'
const assignment = 'Help me work through an assignment using its instructions and my class materials.'

describe('notebook goal compatibility', () => {
  it('starts new entries with review and no instructions', () => {
    expect(inferNotebookGoal()).toBe('review')
    expect(initialNotebookInstructions()).toBe('')
  })

  it('honors an explicit goal independently of old exam intent or preset text', () => {
    const entry = { notebookGoal: 'review' as const, notebookRequest: assessment, studyIntent: { purpose: 'exam-prep' as const } }
    expect(inferNotebookGoal(entry)).toBe('review')
    expect(initialNotebookInstructions(entry)).toBe(assessment)
  })

  it('recognizes legacy exam intent without discarding human instructions', () => {
    const entry = { studyIntent: { purpose: 'exam-prep' as const, instructions: 'Focus on comparison questions.' } }
    expect(inferNotebookGoal(entry)).toBe('assessment')
    expect(initialNotebookInstructions(entry)).toBe('Focus on comparison questions.')
  })

  it.each([
    [assessment, 'assessment'],
    ['Prepare for my exam using the selected review sheet and course materials.', 'assessment'],
    [assignment, 'assignment'],
  ] as const)('moves only the exact old preset %s into its goal', (request, goal) => {
    expect(inferNotebookGoal({ notebookRequest: request })).toBe(goal)
    expect(initialNotebookInstructions({ notebookRequest: request })).toBe('')
  })

  it('preserves custom and expanded requests without guessing their purpose', () => {
    for (const request of ['Explain using more examples.', `${assignment} Focus on the rubric.`, ` ${assessment}`, 'toString']) {
      expect(inferNotebookGoal({ notebookRequest: request })).toBe('review')
      expect(initialNotebookInstructions({ notebookRequest: request })).toBe(request)
    }
  })

  it('preserves an explicitly cleared request instead of restoring legacy instructions', () => {
    const entry = { notebookRequest: '', studyIntent: { purpose: 'study' as const, instructions: 'Previous instruction' } }
    expect(initialNotebookInstructions(entry)).toBe('')
  })
})
