import review from './prompts/copy-prompt-review.md?raw'
import assessment from './prompts/copy-prompt-assessment.md?raw'
import assignment from './prompts/copy-prompt-assignment.md?raw'
import modes from './prompts/prompt-modes.json'
import type { NotebookGoal } from './types'
export const PROMPT_TEMPLATES = { review, assessment, assignment }
export const PROMPT_KEYS = ['COURSE_CODE', 'COURSE_TITLE', 'TERM', 'SCOPE', 'MATERIALS', 'DEPTH', 'CLASS_PREFERENCES', 'HELP_STAGE', 'ASSESSMENT_FORMAT', 'USER_REQUEST', 'REVISION_INPUT'] as const
export type PromptValues = Record<typeof PROMPT_KEYS[number], string | null>
/** One replacement pass: inserted user values can contain tokens without being evaluated. */
export function composeNotebookPrompt(goal: NotebookGoal, values: PromptValues, mode: 'new' | 'update' = 'new') {
  if ((mode !== 'new' && mode !== 'update') || !Object.hasOwn(PROMPT_TEMPLATES, goal)) throw new Error('Unknown notebook prompt goal or mode.')
  const heading = `${modes.new.heading.replace('{goal}', goal)}\n\n`
  let template = PROMPT_TEMPLATES[goal]
  if (!template.startsWith(heading)) throw new Error('The notebook prompt does not start with its canonical heading.')
  if (mode === 'update') template = `${modes.update.heading.replace('{goal}', goal)}\n\n${modes.update.intro}\n\n${template.slice(heading.length)}`
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (literal, key: string) => {
    if (!PROMPT_KEYS.includes(key as typeof PROMPT_KEYS[number])) throw new Error(`Unknown prompt token: ${literal}`)
    return JSON.stringify(values[key as keyof PromptValues])
  })
}
