import { describe, expect, it } from 'vitest'
import readerSchema from './notebook-package-v4.schema.json'
import { composeNotebookPrompt, PROMPT_KEYS, type PromptValues } from './prompt'

const values = Object.fromEntries(PROMPT_KEYS.map(key => [key, null])) as PromptValues

describe('generation contract for the existing reading-detail switch', () => {
  for (const goal of ['review', 'assessment', 'assignment'] as const) {
    it.each(['new', 'update'] as const)(`${goal} %s can author the detail the installed reader supports`, mode => {
      const prompt = composeNotebookPrompt(goal, values, mode)
      const schemaText = prompt.split('\n## Exact JSON Schema\n')[1].split('```json\n')[1].split('\n```')[0]
      expect(JSON.parse(schemaText)).toEqual(readerSchema)
      const rules = prompt.split('`EC-READING-DETAIL`:')[1]?.split('\n\n')[0]
      expect(rules).toContain('Full detail is the default')
      expect(rules).toContain('`paragraph`, `bullets` and `illustration`')
      expect(rules).toContain('Do not remove substantive teaching to meet a word count or percentage')
      expect(rules).toContain('1200 characters')
      expect(rules).toContain('Do not put practice answers or worked solutions in `more`')
      expect(prompt).toContain('`EC-DETAIL-CHECK`')
      expect(prompt).toContain('read the guide once with `more` hidden and once with it visible')
      expect(prompt).toContain('source narration belongs in neither layer')
      expect(prompt).toContain('`EC-PERTINENT-ONLY`')
      expect(prompt).toContain('The prefix belongs only on mastery-objective labels.')
    })
  }
})
