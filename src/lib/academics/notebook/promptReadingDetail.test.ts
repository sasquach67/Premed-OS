import { describe, expect, it } from 'vitest'
import readerSchema from './notebook-package-v4.schema.json'
import { composeNotebookPrompt, PROMPT_KEYS, type PromptValues } from './prompt'

const values = Object.fromEntries(PROMPT_KEYS.map(key => [key, null])) as PromptValues

describe('block-level reading-detail authoring contract', () => {
  for (const goal of ['review', 'assessment', 'assignment'] as const) {
    it.each(['new', 'update'] as const)(`${goal} %s retains compatible stored detail while authoring core and extra blocks`, mode => {
      const prompt = composeNotebookPrompt(goal, values, mode)
      const schemaText = prompt.split('\n## Exact JSON Schema\n')[1].split('```json\n')[1].split('\n```')[0]
      expect(JSON.parse(schemaText)).toEqual(readerSchema)
      const rules = prompt.split('`EC-READING-DETAIL`:')[1]?.split('\n\n')[0]
      expect(rules).toContain('Full detail is the default')
      expect(rules).toContain('detail="core" or detail="extra"')
      expect(rules).toContain('absent means core')
      expect(rules).toContain('Condensed hides extra blocks and legacy more text')
      expect(rules).toContain('Do not remove substantive teaching to meet a word count or percentage')
      expect(rules).toContain('New authoring does not require more')
      expect(rules).toContain('Preserve every stored more value on updates')
      expect(rules).toContain('Do not put practice answers or worked solutions in explanation blocks or more')
      expect(prompt).toContain('read the guide once with extra blocks and legacy more hidden')
      expect(prompt).toContain('source narration belongs in neither layer')
      expect(prompt).toContain('`EC-PERTINENT-ONLY`')
      expect(prompt).toContain('The prefix belongs only on mastery-objective labels.')
    })
  }
})
