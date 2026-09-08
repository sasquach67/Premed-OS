import { expect, it } from 'vitest'
import { notebookPromptParts } from './promptTables'

it('renders the actual approved P7 data without changing its surrounding prompt or values', () => {
  const lead = 'P7 \u00b7 Represent an endpoint and a time course\n\nHypothetical data, mean redness in units/square inch:\n'
  const tail = '\nDraw a graph comparing the lotions at 20 minutes and a second graph showing the full time course. Give appropriate axes, units, and group labels. Describe the final segment for Lotion B. No variability measurements or p-values are provided.'
  const value = `${lead}\n| Time, minutes | Lotion A | Lotion B |\n|---|---:|---:|\n| 0 | 0 | 0 |\n| 10 | 3 | 1 |\n| 20 | 6 | 1 |\n${tail}`
  expect(notebookPromptParts(value)).toEqual([{ type: 'text', text: lead }, { type: 'table', columns: ['Time, minutes', 'Lotion A', 'Lotion B'], rows: [['0', '0', '0'], ['10', '3', '1'], ['20', '6', '1']], align: ['left', 'right', 'right'] }, { type: 'text', text: tail }])
  expect(value).toContain('| 20 | 6 | 1 |')
})
it.each([
  '| A | B |\n| -- | --- |\n| 1 | 2 |',
  '| A | B |\n| --- | --- |\n| 1 | 2 | 3 |',
  '| A | B |\n| --- | --- |',
  '| A \\| extra | B |\n| --- | --- |\n| 1 | 2 |',
  '```text\n| A | B |\n| --- | --- |\n| 1 | 2 |\n```',
])('preserves unsupported or fenced table-like input literally: %s', value => {
  expect(notebookPromptParts(value)).toEqual([{ type: 'text', text: value }])
})
it('keeps markup inert and supports more than one well-formed table', () => {
  const table = '| Name | Value |\n| :--- | :---: |\n| <img src=x onerror=alert(1)> | 0 |'
  const parts = notebookPromptParts(`${table}\n\nBetween tables\n\n${table}`)
  expect(parts.filter(p => p.type === 'table')).toHaveLength(2)
  expect(parts[0]).toMatchObject({ rows: [['<img src=x onerror=alert(1)>', '0']], align: ['left', 'center'] })
})
