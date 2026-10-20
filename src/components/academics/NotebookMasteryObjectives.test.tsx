import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import baseline from '@/lib/academics/notebook/revision-fixtures/baseline-current.json'
import type { NotebookEntry } from '@/lib/academics/notebook/types'
import { NotebookMasteryObjectives } from './NotebookMasteryObjectives'
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let host: HTMLDivElement, root: Root
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host) })
afterEach(async () => { await act(async () => root.unmount()); host.remove() })
const entry = () => structuredClone(baseline.entries[0]) as NotebookEntry
it('shows sourced questions, mapped skills, then factual understanding with evidence collapsed', async () => {
  const e = entry(), objective = e.objectives[0]
  objective.howTested = { setup: 'A drug and its target are given.', questions: [{ id: 'q-topo', text: 'What happens if topoisomerase is inhibited?', sourceIds: objective.sourceIds, excerptIds: objective.excerptIds }] }
  objective.applicationSkills = [{ text: 'Predict replication effects from the drug target.', questionIds: ['q-topo'] }]
  objective.freeRecallCues = ['Hidden legacy recall cue']; objective.watchFor = ['Hidden legacy caution']
  const before = JSON.stringify(e)
  await act(async () => root.render(<NotebookMasteryObjectives entry={e} renderEvidence={() => <details><summary>Source evidence</summary><p>Instructor materials</p></details>} />))
  expect([...host.querySelectorAll('.nmo-body section')].slice(0, 3).map(s => s.getAttribute('aria-label'))).toEqual(["How it may be tested", 'Be able to do', 'Understand'])
  expect(host.textContent).toContain('What happens if topoisomerase is inhibited?')
  expect(host.querySelector('.nmo-question-refs,.nmo-question-number')).toBeNull()
  expect(host.querySelector('.nmo-questions')?.tagName).toBe('UL')
  expect(host.querySelector('details')?.open).toBe(false)
  expect(host.textContent).not.toContain('Hidden legacy')
  expect(host.textContent).not.toContain('Try recalling first')
  expect(host.textContent).not.toContain('Watch for')
  expect(host.querySelector('.nmo-tested')?.textContent).not.toContain('Instructor materials')
  expect(JSON.stringify(e)).toBe(before)
})
it('shows preserved legacy application and understanding with an explicit source-question gap', async () => {
  const e = entry(), before = JSON.stringify(e)
  await act(async () => root.render(<NotebookMasteryObjectives entry={e} renderEvidence={() => null} />))
  expect(host.textContent).toContain('This saved objective has no quoted course questions.')
  expect(host.textContent).toContain(e.objectives[0].beAbleToDo[0])
  expect(host.textContent).toContain(e.objectives[0].understand[0])
  expect(JSON.stringify(e)).toBe(before)
})
it('uses an authored no-question explanation without inventing a question', async () => {
  const e = entry(); e.objectives[0].howTested = { setup: 'No exam format was supplied.', questions: [], noQuestionsReason: 'No question for this objective appears in the class outline.' }
  await act(async () => root.render(<NotebookMasteryObjectives entry={e} renderEvidence={() => null} />))
  expect(host.textContent).toContain('No question for this objective appears in the class outline.')
  expect(host.querySelector('.nmo-questions')).toBeNull()
})
