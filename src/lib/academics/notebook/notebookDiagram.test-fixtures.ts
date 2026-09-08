import type { NotebookStudyDiagramBlock } from './visualTypes'

// Geometry-only snapshots of W1's provisional teaching blocks, not import packages.
function shape(id: string, title: string, labels: string[], edges: [number, number, string, 'sequence' | 'other'][]): NotebookStudyDiagramBlock {
  const evidence = { sourceIds: [], excerptIds: [], assetIds: [] }
  return { ...evidence, id, title, type: 'study-diagram', kind: 'flowchart', provenance: 'clarification', nodes: labels.map((label, i) => ({ ...evidence, id: `${id}-n${i}`, label })), edges: edges.map(([from, to, label, relation], i) => ({ ...evidence, id: `${id}-e${i}`, from: `${id}-n${from}`, to: `${id}-n${to}`, label, relation })) }
}
export const inquiryDiagram = shape('lesson1-b03-12', 'One route through inquiry, with returns', [
  'Observation and question', 'Proposed explanation', 'Prediction', 'Test and gather data', 'Analyze and interpret', 'Peer review', 'Publication',
], [
  [0, 1, 'propose', 'sequence'],
  [1, 2, 'derive a testable expectation', 'sequence'],
  [2, 3, 'check against observations', 'sequence'],
  [3, 4, 'evaluate the pattern', 'sequence'],
  [4, 1, 'may support or prompt revision', 'other'],
  [4, 0, 'may raise a new question', 'other'],
  [4, 5, 'share interpretation', 'sequence'],
  [5, 1, 'feedback may revise the explanation', 'other'],
  [5, 6, 'communicate findings', 'sequence'],
])
export const graphChoiceDiagram = shape('lesson1-b07-07', 'Choose the sunscreen display from the question', [
  'What comparison is needed?', 'Three lotions at 30 minutes', 'Redness through time for each lotion', 'Use the final table row; draw category bars', 'Use all time rows; draw one line per lotion',
], [
  [0, 1, 'fixed endpoint', 'other'],
  [0, 2, 'time course', 'other'],
  [1, 3, 'compare 22, 4.5 and 1 units/square inch', 'sequence'],
  [2, 4, 'time on x; redness on y; lotion in legend', 'sequence'],
])
