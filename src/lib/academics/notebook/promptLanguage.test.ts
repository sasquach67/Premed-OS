import { describe, expect, it } from 'vitest'
import { composeNotebookPrompt, PROMPT_KEYS, type PromptValues } from './prompt'

const values = Object.fromEntries(PROMPT_KEYS.map(key => [key, null])) as PromptValues
const goals = ['review', 'assessment', 'assignment'] as const
const modes = ['new', 'update'] as const

const before = 'Nevirapine was central to the historical campaign to reduce transmission from mother to child. Preventing transmission and treating an existing infection are related but distinct goals; the 2002 legal victory should not be confused with the later expansion of adult treatment services.'
const after = "**Nevirapine** is an ARV that reduces **mother-to-child transmission**, the passing of HIV from mother to baby during pregnancy and birth. TAC's 2002 court victory required the government to provide it. Adult ARV treatment in public hospitals came later, in April 2004."

function rule(prompt: string, id: string) {
  const marker = `- \`${id}\`:`
  const start = prompt.indexOf(marker)
  expect(start, `missing ${id}`).toBeGreaterThanOrEqual(0)
  return prompt.slice(start + marker.length).split(/\n- `EC-|\n## /)[0]
}

describe('beta31 notebook authoring language', () => {
  for (const goal of goals) {
    it.each(modes)(`${goal} %s carries the shared direct-language and correction rules`, mode => {
      const prompt = composeNotebookPrompt(goal, values, mode)
      const language = rule(prompt, 'EC-LEARNING-LANGUAGE')
      expect(prompt).toContain('notebook-instructions-beta-31')
      expect(language).toMatch(/state (?:the |a )?claim directly/i)
      expect(language).toMatch(/parallel statements|parallel facts/i)
      for (const guard of ['X, not Y', 'does not mean', 'should not be confused with', 'is different from']) {
        expect(language).toContain(guard)
      }
      expect(language).toMatch(/(?:caution|mix-up)[\s\S]*(?:evidence|evidenced|supplied|instructor)/i)
      expect(language).toContain('mix-up')
      expect(language).toMatch(/(?:at most one|one at most|maximum of one)[\s\S]*section/i)
      expect(language).toMatch(/scientific qualifier|scientific qualification/i)
      expect(language).toMatch(/reader-directed|instructions? (?:to|for) the (?:reader|student)/i)
      for (const hedge of ['without establishing', 'which cannot be', 'is not a claim that', 'nothing can be concluded', 'is not established']) {
        expect(language).toContain(hedge)
      }
      expect(language).toMatch(/(?:source excerpts|excerpts)[\s\S]*(?:exact|unchanged|verbatim)/i)
      expect(language).toMatch(/official objective/)
      const studentWork = rule(prompt, 'EC-STUDENT-WORK')
      expect(studentWork).toMatch(/correct fact|what is (?:right|correct)/i)
      expect(studentWork).toMatch(/once/)
      expect(studentWork).toMatch(/(?:does not|do not|without)[\s\S]*(?:argu|error)/i)
      const pertinent = rule(prompt, 'EC-PERTINENT-ONLY')
      expect(pertinent).toMatch(/reader-directed|course meta|course-meta|the course asks/i)
      const precedence = rule(prompt, 'EC-KNOWLEDGE-PRECEDENCE')
      expect(precedence).toContain('EC-LEARNING-LANGUAGE supersedes legacy general-knowledge common-confusion warnings and SG-AT-A-GLANCE misconception mandates')
      expect(precedence).toContain('a caution requires supplied evidence of the exact mix-up')
      expect(precedence).toContain('one-idea sentence guideline and one-sentence entry summary supersede conflicting legacy prose-length guidance')
      expect(precedence).toContain('never authorize deleting substantive teaching')
      expect(language).toContain('Rewrite an authored hedge-only question to test the concept with a concrete answer.')
      expect(language).toContain('A genuine source-backed evidence-evaluation task may require an indeterminate answer')
      expect(language).toContain('explain what the observations support and which necessary observation is missing, without inventing certainty')
    })

    it.each(modes)(`${goal} %s includes the exact approved wording pair and concise sentence/summary guidance`, mode => {
      const prompt = composeNotebookPrompt(goal, values, mode)
      const language = rule(prompt, 'EC-LEARNING-LANGUAGE')
      expect(prompt).toContain(before)
      expect(prompt).toContain(after)
      expect(language).toMatch(/one idea per sentence/i)
      expect(language).toMatch(/(?:about|roughly|approximately) 25 words|25 words (?:at most|or fewer)/i)
      expect(language).toMatch(/(?:2[–-]3|two or three) sentences|bullets/i)
      expect(language).toMatch(/(?:entry summary|summary)[\s\S]*one plain sentence/i)
      expect(language).toMatch(/main idea/)
      expect(language).toMatch(/no parenthetical topic list|without (?:a )?parenthetical topic list/i)
    })
  }

  it.each(modes)('Review %s follows the governing argument and explains figures without a required label', mode => {
    const prompt = composeNotebookPrompt('review', values, mode)
    const mastery = rule(prompt, 'EC-MASTERY-REVIEW')
    const grouped = rule(prompt, 'EC-GROUPED-GUIDE')
    expect(mastery).toContain("objectives as the coverage ledger; the governing argument supplies the main guide's section structure")
    expect(mastery).not.toContain("objectives as the main guide's spine")
    const precedence = rule(prompt, 'EC-KNOWLEDGE-PRECEDENCE')
    expect(precedence).toContain('EC-MASTERY-REVIEW and EC-GROUPED-GUIDE organize sections around the governing argument, with objectives retained as the coverage ledger')
    for (const rules of [mastery, grouped]) {
      expect(rules).toMatch(/governing argument/i)
      expect(rules).toMatch(/(?:discussion questions|framing statements|slide titles)/i)
      expect(rules).toMatch(/each (?:teaching )?section[\s\S]*(?:step|argument)/i)
      expect(rules).toMatch(/(?:history|biography|dates)[\s\S]*evidence/i)
      expect(rules).toMatch(/(?:timeline|quick.reference|reference table)/i)
      expect(rules).toMatch(/corrections? (?:of fact|stay|remain)|factual corrections?/i)
      expect(rules).toMatch(/(?:opening question|Tie it together)/i)
    }
    expect(grouped).toContain('What to look at')
    expect(grouped).toMatch(/(?:caption|adjacent explanation)/i)
    expect(grouped).toMatch(/(?:what it shows|what (?:the|each) figure shows)/i)
    expect(grouped).toMatch(/(?:ordinary sentence|ordinary prose|without (?:a )?literal label|no literal label)/i)
    expect(prompt).not.toMatch(/plus (?:a |one )?[“"]Why it matters[”"] line|a [“"]Why it matters[”"] line beside it/)
  })
})
