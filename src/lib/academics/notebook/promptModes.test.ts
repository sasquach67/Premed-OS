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
  expect(new TextEncoder().encode(update).length - new TextEncoder().encode(original).length).toBe(new TextEncoder().encode(modes.update.heading + '\n\n' + modes.update.intro + '\n\n').length - new TextEncoder().encode(modes.new.heading + '\n\n').length)
  const request = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(update)![1])
  expect(request.userRequest).toBe(values.USER_REQUEST)
  expect(request.revisionInput).toBe(values.REVISION_INPUT)
  expect(PROMPT_KEYS).toHaveLength(11)
})
it('never infers update mode from inserted student text or revision input', () => {
  expect(composeNotebookPrompt('review', values).startsWith('# Create my Premed OS notebook: review')).toBe(true)
})
it.each(['review', 'assessment', 'assignment'] as const)('preserves explicit class and lesson context in both %s modes', goal => {
  const explicit = { ...values, COURSE_CODE: 'COURSE-Q', COURSE_TITLE: 'Student title $& {{SCOPE}}', TERM: 'Requested term', SCOPE: 'The exact user-selected lesson' }
  for (const mode of ['new', 'update'] as const) {
    const prompt = composeNotebookPrompt(goal, explicit, mode)
    const request = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(prompt)![1])
    expect(request.courseCode).toBe(explicit.COURSE_CODE); expect(request.courseTitle).toBe(explicit.COURSE_TITLE)
    expect(request.term).toBe(explicit.TERM); expect(request.scope).toBe(explicit.SCOPE)
  }
  const unknown = { ...values, COURSE_CODE: null, COURSE_TITLE: null, TERM: null, SCOPE: null }
  const request = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(composeNotebookPrompt(goal, unknown))![1])
  expect([request.courseCode, request.courseTitle, request.term, request.scope]).toEqual([null, null, null, null])
})
it('rejects unknown modes and changed trusted headings instead of rewriting arbitrary content', () => {
  expect(() => composeNotebookPrompt('review', values, 'unknown' as 'update')).toThrow('Unknown notebook prompt')
  const previous = PROMPT_TEMPLATES.review
  try { PROMPT_TEMPLATES.review = 'Unexpected heading\n\n' + previous; expect(() => composeNotebookPrompt('review', values, 'update')).toThrow('canonical heading') } finally { PROMPT_TEMPLATES.review = previous }
})

it.each(['review', 'assessment', 'assignment'] as const)('delivers a complete folder by default in new and update %s prompts without adding a draft approval gate', goal => {
  for (const mode of ['new', 'update'] as const) {
    const prompt = composeNotebookPrompt(goal, values, mode)
    expect(prompt).toContain('Default to one real folder named after the notebook')
    expect(prompt).toContain('Create a ZIP only when the student explicitly requests one')
    expect(prompt).toContain('creates the complete titled folder there')
    expect(prompt).not.toMatch(/ZIP-first|Default to one real downloadable ZIP|deliver one complete titled ZIP|one titled ZIP under EC-DELIVERY/)
    expect(prompt).toContain('A text-only notebook still uses a folder containing its JSON')
    expect(prompt).toContain('Ordinary AI-created folders need no app-owned bindings.json')
    expect(prompt).toContain('complete downloadable file set together')
    expect(prompt).toContain('Never claim a folder or ZIP exists without creating it')
    expect(prompt).toContain('no additional default confirmation is required')
    expect(prompt).toContain('complete corrected folder with the notebook JSON and all required actual image files')
  }
})
