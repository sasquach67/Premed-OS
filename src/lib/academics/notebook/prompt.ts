import review from './prompts/copy-prompt-review.md?raw'
import assessment from './prompts/copy-prompt-assessment.md?raw'
import assignment from './prompts/copy-prompt-assignment.md?raw'
import type { NotebookGoal } from './types'
export const PROMPT_TEMPLATES = { review, assessment, assignment }
export const PROMPT_KEYS = ['COURSE_CODE', 'COURSE_TITLE', 'TERM', 'SCOPE', 'MATERIALS', 'DEPTH', 'CLASS_PREFERENCES', 'HELP_STAGE', 'ASSESSMENT_FORMAT', 'USER_REQUEST', 'REVISION_INPUT'] as const
export type PromptValues = Record<typeof PROMPT_KEYS[number], string | null>
/** One replacement pass: inserted user values can contain tokens without being evaluated. */
export function composeNotebookPrompt(goal: NotebookGoal, values: PromptValues) {
  return PROMPT_TEMPLATES[goal].replace(/\{\{([A-Z_]+)\}\}/g, (literal, key: string) => {
    if (!PROMPT_KEYS.includes(key as typeof PROMPT_KEYS[number])) throw new Error(`Unknown prompt token: ${literal}`)
    return JSON.stringify(values[key as keyof PromptValues])
  })
}
