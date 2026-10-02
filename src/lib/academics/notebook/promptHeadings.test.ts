import { describe, expect, it } from 'vitest'
import { composeNotebookPrompt, PROMPT_KEYS, type PromptValues } from './prompt'

const prefixRule = 'The prefix belongs only on mastery-objective labels. Section titles and every other heading are plain, concrete titles with no numbers, objective numbers, Review or Practice prefixes or other labels.'
const gapRule = 'A gap or source-limit section gets a plain student-facing title such as "Figures not supplied" or "Not covered yet", never "unfinished tasks"; administrative narration stays in the companion message.'
const derivedRule = 'For derived study objectives, preserve the "Study objective:" prefix and selected-material authority.'

// Invented route-workshop examples are authored expectations, not model outputs.
// This test-only rubric does not sanitize or restrict imported notebook headings.
const fixtures = [
  { objective: '1. Explain how route markers identify a path', bad: '1 · Route markers', good: 'Route markers' },
  { objective: '2. Compare two marked paths', bad: '2 · Comparing paths', good: 'Comparing paths' },
  { objective: '1. Explain how route markers identify a path', bad: 'Review · Route markers', good: 'Reading route markers' },
  { objective: '2. Compare two marked paths', bad: 'Practice · Comparing paths', good: 'Choosing a path' },
  { objective: 'Study objective: Explain why the painted arrow is easier to see', bad: 'Study objective: Painted arrows', good: 'Painted arrows' },
  { objective: null, bad: 'Source notes and unfinished figure tasks', good: 'Figures not supplied' },
  { objective: null, bad: 'Unfinished tasks', good: 'Not covered yet' },
]

const hasForbiddenHeadingLabel = (heading: string) => /^(?:\d|objective\s+\d|review\b|practice\b|study objective:)|unfinished.*tasks/i.test(heading)

describe('plain notebook headings', () => {
  it.each(['new', 'update'] as const)('carries both adjacent rules in the composed %s Review prompt with fictional numbered and derived objectives', mode => {
    const values = Object.fromEntries(PROMPT_KEYS.map(key => [key, null])) as PromptValues
    values.COURSE_TITLE = 'Invented route workshop'
    values.MATERIALS = JSON.stringify({
      objectives: fixtures.flatMap(fixture => fixture.objective ? [fixture.objective] : []),
      missingFigure: 'The fictional route map was not supplied.',
    })
    values.REVISION_INPUT = mode === 'update' ? JSON.stringify({ headings: fixtures.map(fixture => fixture.bad) }) : null
    const prompt = composeNotebookPrompt('review', values, mode)
    expect(prompt).toContain(`${derivedRule} ${prefixRule} ${gapRule}`)
    expect(prompt).toContain('Prompt build: notebook-instructions-beta-26.')
    // Composition preserves source objective labels and update input verbatim;
    // the external model receives the instruction to author plain headings.
    const request = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(prompt)![1])
    expect(request.materials).toBe(values.MATERIALS)
    expect(request.revisionInput).toBe(values.REVISION_INPUT)
  })

  it.each(fixtures)('distinguishes "$bad" from the authored plain title "$good"', ({ bad, good }) => {
    expect(hasForbiddenHeadingLabel(bad)).toBe(true)
    expect(hasForbiddenHeadingLabel(good)).toBe(false)
  })

  it('keeps the derived prefix on its objective label only', () => {
    const derived = fixtures.find(fixture => fixture.objective?.startsWith('Study objective:'))!
    expect(derived.objective).toBe('Study objective: Explain why the painted arrow is easier to see')
    expect(derived.good).toBe('Painted arrows')
    expect(derived.good).not.toContain('Study objective:')
  })
})
