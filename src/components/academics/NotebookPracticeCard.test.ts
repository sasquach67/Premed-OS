import { expect, it } from 'vitest'
import { practicePromptDisplay } from './notebookPracticePrompt'

it('moves a standalone saved label without shortening the question or options', () => {
  const body = 'Which comparison fits?\n\nA. First comparison\nB. Second comparison\n\nExplain both parts.'
  const prompt = `Supplied lecture question\n\n${body}`
  expect(practicePromptDisplay(prompt)).toEqual({ label: 'Supplied lecture question', body })
  expect(prompt).toBe(`Supplied lecture question\n\n${body}`)
})

it.each([
  'Supplied lecture question',
  'Supplied lecture question: explain this phrase.',
  '> Supplied lecture question\nThe quoted text is evidence.',
  '```\nSupplied lecture question\n```',
  'Unfamiliar header\n\nA. A subpart\nB. Another subpart',
])('preserves ambiguous, quoted and incomplete input verbatim: %s', prompt => {
  expect(practicePromptDisplay(prompt)).toEqual({ label: null, body: prompt })
})
