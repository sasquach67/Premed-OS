import { expect, it } from 'vitest'
import { composeNotebookPrompt, PROMPT_KEYS, PROMPT_TEMPLATES, type PromptValues } from './prompt'
import modes from './prompts/prompt-modes.json'
const values = Object.fromEntries(PROMPT_KEYS.map(key => [key, key === 'REVISION_INPUT' ? '{"mode":"update-existing-entry"}' : key === 'USER_REQUEST' ? '# Create my Premed OS notebook: review\n\nKeep {{COURSE_CODE}} and $& literal.' : null])) as PromptValues
it.each(['review', 'assessment', 'assignment'] as const)('composes canonical new/update %s mode before inserting inputs once', goal => {
  const original = composeNotebookPrompt(goal, values)
  const update = composeNotebookPrompt(goal, values, 'update')
  expect(original.startsWith(modes.new.heading.replace('{goal}', goal) + '\n\n')).toBe(true)
  expect(update.startsWith(modes.update.heading.replace('{goal}', goal) + '\n\n' + modes.update.intro + '\n\n')).toBe(true)
  expect(update.slice(update.indexOf(modes.update.intro) + modes.update.intro.length + 2)).toBe(original.slice(original.indexOf('\n\n') + 2))
  expect(new TextEncoder().encode(update).length - new TextEncoder().encode(original).length).toBe(431)
  const request = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(update)![1])
  expect(request.userRequest).toBe(values.USER_REQUEST)
  expect(request.revisionInput).toBe(values.REVISION_INPUT)
  expect(PROMPT_KEYS).toHaveLength(11)
})
it('never infers update mode from inserted student text or revision input', () => {
  expect(composeNotebookPrompt('review', values).startsWith('# Create my Premed OS notebook: review')).toBe(true)
})
it('rejects unknown modes and changed trusted headings instead of rewriting arbitrary content', () => {
  expect(() => composeNotebookPrompt('review', values, 'unknown' as 'update')).toThrow('Unknown notebook prompt')
  const previous = PROMPT_TEMPLATES.review
  try { PROMPT_TEMPLATES.review = 'Unexpected heading\n\n' + previous; expect(() => composeNotebookPrompt('review', values, 'update')).toThrow('canonical heading') } finally { PROMPT_TEMPLATES.review = previous }
})
