import { expect, it } from 'vitest'
import { composeNotebookPrompt, PROMPT_KEYS, PROMPT_TEMPLATES, type PromptValues } from './prompt'
import modes from './prompts/prompt-modes.json'
const values = Object.fromEntries(PROMPT_KEYS.map(key => [key, key === 'REVISION_INPUT' ? '{"mode":"update-existing-entry"}' : key === 'USER_REQUEST' ? '# Create my Premed OS notebook: review\n\nKeep {{COURSE_CODE}} and $& literal.' : null])) as PromptValues
it.each(['new', 'update'] as const)('includes the Assessment exam profile and practice-style choice in %s mode', mode => {
  const prompt = composeNotebookPrompt('assessment', values, mode)
  const assessmentRules = prompt.split('## Assessment exam profile and practice style\n')[1]?.split('## Portable representation')[0]
  expect(assessmentRules).toContain('These rules apply only to the **Assessment** goal, in new and update mode.')
  expect(assessmentRules).toContain('`EC-EXAM-PROFILE`')
  expect(assessmentRules).toContain('`EC-MOCK-EXAM`')
  expect(assessmentRules).toContain('`EC-EXAM-FIDELITY`')
  expect(assessmentRules).toContain("When practice quizzes and real exams differ on format, follow the real exam's format mix; use practice quizzes mainly for topics, figure families and traps.")
  expect(assessmentRules).toContain('Never copy, lightly reword or renumber an exam item.')
  expect(assessmentRules).toContain('Without real exams, use the course blueprint and say so.')
  expect(assessmentRules).toContain('Unless the request already says, ask once, in the first reply')
  expect(assessmentRules).toContain('If the student doesn\'t choose, use (a).')
  expect(prompt).toContain('Prompt build: notebook-instructions-beta-27.')
})
it.each(['new', 'update'] as const)('preserves mock fidelity and cumulative scope boundaries in %s Assessment prompts', mode => {
  const prompt = composeNotebookPrompt('assessment', values, mode)
  const rules = prompt.split('`EC-EXAM-FIDELITY`:')[1]?.split('`EC-MOCK-EXAM`:')[0]
  for (const clause of [
    'three lines or fewer built on one specific misconception',
    'Do not impose a universal proportion',
    'preserve the task of reading the representation',
    'Cover every objective in the selected exam scope',
    'label the mock partial',
    'Limit arithmetic to the kinds of calculation used',
    'Do not force an even spread of answer letters',
    'at most one "consistent with ALL the data" item',
    'about one in four items uses an earlier-unit skill',
    'a final mock covers all units',
    "keep each mock within that exam's chapters",
    'semester themes belong on the final only',
    'Honor explicit source exclusions',
  ]) expect(rules, clause).toContain(clause)
  expect(rules).not.toMatch(/BIOL|PSYC|Lesson 2|about a third/)
})

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
it('carries the show-don\'t-tell, pertinent-only and student-work rules and the illustration block into every goal', () => {
  for (const goal of ['review', 'assessment', 'assignment'] as const) {
    const template = PROMPT_TEMPLATES[goal]
    for (const rule of ['EC-SHOW-DONT-TELL', 'EC-PERTINENT-ONLY', 'EC-STUDENT-WORK', 'EC-VERIFY-ANSWERS', 'EC-ILLUSTRATION']) expect(template, `${goal} ${rule}`).toContain(`\`${rule}\``)
    expect(template, goal).toContain('"const":"illustration"')
    expect(template, goal).not.toContain('Briefly disclose the use of general subject knowledge once in the companion summary')
  }
})
