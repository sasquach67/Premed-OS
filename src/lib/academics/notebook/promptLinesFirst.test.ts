import { describe, expect, it } from 'vitest'
import { composeNotebookPrompt, PROMPT_KEYS, type PromptValues } from './prompt'

const values = Object.fromEntries(PROMPT_KEYS.map(key => [key, null])) as PromptValues
const contentShapes = [
  ['Mechanism, procedure, causal chain', 'Numbered steps'],
  ['Dated events', 'Timeline: date, then one line'],
  ['Parallel factors, conditions, barriers', "The map's labeled groups, each saying what it does"],
  ['Comparison', 'Table'],
  ['Several causes, one result', 'Map groups feeding a result'],
  ['An argument', 'Claim, evidence, so what'],
  ['A definition', 'Term line'],
]

function rule(prompt: string, id: string) {
  const marker = `- \`${id}\`:`
  const start = prompt.indexOf(marker)
  expect(start, `missing ${id}`).toBeGreaterThanOrEqual(0)
  return prompt.slice(start + marker.length).split(/\n- `EC-|\n## /)[0]
}
function linesRule(prompt: string) {
  return prompt.split('- `EC-LINES-FIRST`:')[1]?.split('\n\n')[0] ?? ''
}

describe('beta33 teach-first guide instructions', () => {
  for (const goal of ['review', 'assessment', 'assignment'] as const) {
    it.each(['new', 'update'] as const)(`${goal} %s keeps structure, explanation and delivery requirements together`, mode => {
      const prompt = composeNotebookPrompt(goal, values, mode)
      expect(prompt).toContain('notebook-instructions-beta-33')
      expect(prompt.indexOf('Governing notebook philosophy')).toBeLessThan(prompt.indexOf('## Applicable canonical learning rules'))
      expect(prompt.replace(/\s+/g, ' ')).toContain('simple means easier words, never fewer ideas')
      for (const [content, shape] of contentShapes) expect(prompt).toContain(`| ${content} | ${shape} |`)
      expect(prompt).toContain('Numbered steps only for content that really happens in order. Parallel items')
      expect(prompt).toContain('never get numbers')
      const lines = linesRule(prompt)
      expect(lines).toContain('teach first, then give the reference')
      expect(lines).toContain('one exam-register question under 20 words')
      expect(lines).toContain('role=lede, 1–2 plain sentences')
      expect(lines).toContain('replaces the separate How this connects block')
      expect(lines).toContain('walkthrough block under EC-WALKTHROUGH, 3–6 points')
      expect(lines).toContain('reader label Key idea')
      expect(lines).toContain('Keep it straight')
      expect(lines).toContain('3–5 labeled groups and brief inline members')
      expect(lines).toContain('Step items may be {text,reason}')
      expect(lines).toContain('legacy string items remain valid')
      expect(lines).toContain('do not add a title field to paragraph blocks')
      expect(lines).toContain('lookFor with 2–4 short lines')
      expect(lines).toContain('no prose block or walkthrough paragraph exceeds 3 sentences or about 60 words')
      expect(lines).toContain('entry.argumentChain with 4–6 {label,line,sectionId}')
      expect(lines).toContain("A map cannot replace the walkthrough's explanation")
      const walk = rule(prompt, 'EC-WALKTHROUGH')
      expect(walk).toContain('{type:"walkthrough", items:[{point, paragraphs, cards?, figureBlockId?, attachedBlockIds?, note?}]}')
      expect(walk).toContain('does not repeat it elsewhere')
      expect(walk).toContain('Condensed shows the question, lede, point sentences, key idea and map')
      expect(rule(prompt, 'EC-COVERAGE')).toContain('Inventory self-check')
      expect(rule(prompt, 'EC-COVERAGE')).toContain('definedTerms entry, whatever the word count')
      expect(rule(prompt, 'EC-SAY-ONCE')).toContain('more than two is a repeat to merge')
      expect(rule(prompt, 'EC-SPINE')).toContain("The instructor's discussion questions")
      expect(rule(prompt, 'EC-LABELS')).toContain('If you remember one thing is retired')
      const imports = rule(prompt, 'EC-IMPORT-CHECK')
      expect(imports).toContain("the map's title is its root")
      expect(imports).toContain('selected, inspected visualReview candidate')
      expect(imports).toContain('invented practice stimulus')
      expect(imports).toContain('Import self-check: passed')
      expect(prompt).toContain('detail="core" or detail="extra"')
      expect(prompt).toContain('absent means core')
      expect(prompt).toContain('Preserve every stored more value on updates')
      expect(prompt).toContain('premedOS/Lesson N - Title')
      expect(prompt).not.toContain('This is a draft instruction workflow')
      expect(prompt).not.toContain('Transport instructionsVersion:')
      expect(prompt).toContain('"instructionsVersion"')
      expect(prompt).toContain('"notebook-workflows-draft-4"')
      expect(prompt).toContain('Single approved example section: Same DNA, different proteins')
      expect(prompt).toContain("**Point:** The egg's cytoplasm is uneven.")
      expect(prompt).not.toContain('Nevirapine')
      expect(prompt).not.toContain('Bullets are not the default')
      expect(prompt).not.toContain('Prose/callout → paragraph')
      expect(prompt).not.toContain('Why it works), 2–3 sentences in EVERY teaching section')
      expect(prompt).toContain('options, 2–6 nonempty strings')
      expect(prompt).toContain('matching zero-based integer')
    })
  }
})
