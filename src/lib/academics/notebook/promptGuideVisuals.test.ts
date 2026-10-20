// Phase 1 exercises the real app composer with normally generated/synced assets
// in a disposable directory. It does not edit shipped assets or run an AI model.
import { afterAll, describe, expect, it, vi } from 'vitest'

const staged = await vi.hoisted(async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const os = await import('node:os')
  const { execFileSync } = await import('node:child_process')
  const root = process.cwd()
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'guide-visual-composition-'))
  const canonical = 'premed-hq-documentation/specifications/generation/portable-notebooks'
  const app = 'src/lib/academics/notebook'
  const output = path.join(temp, 'generated')
  try {
    execFileSync('python3', [path.join(root, canonical, 'build_prompts.py'), '--canonical-root', root, '--output', output, '--prompt-schema', path.join(root, canonical, 'notebook-prompt-v4.schema.json')])
    for (const name of ['notebook-package.schema.json', 'notebook-package-v3.schema.json', 'notebook-package-v4.schema.json', 'notebook-prompt-v4.schema.json']) {
      fs.mkdirSync(path.join(temp, canonical), { recursive: true })
      fs.copyFileSync(path.join(root, canonical, name), path.join(temp, canonical, name))
      if (name !== 'notebook-prompt-v4.schema.json') {
        fs.mkdirSync(path.join(temp, app), { recursive: true })
        fs.copyFileSync(path.join(root, app, name), path.join(temp, app, name))
      }
    }
    for (const name of ['revision-context.json', 'conversation-expectations.json']) {
      fs.copyFileSync(path.join(root, canonical, name), path.join(output, name))
    }
    execFileSync('node', [path.join(root, 'scripts/notebook/sync-assets.mjs'), output], { cwd: temp })
    const read = (goal: string) => fs.readFileSync(path.join(temp, app, 'prompts', `copy-prompt-${goal}.md`), 'utf8')
    return { review: read('review'), assessment: read('assessment'), assignment: read('assignment'), cleanup: () => fs.rmSync(temp, { recursive: true, force: true }) }
  } catch (error) {
    fs.rmSync(temp, { recursive: true, force: true })
    throw error
  }
})
vi.mock('./prompts/copy-prompt-review.md?raw', () => ({ default: staged.review }))
vi.mock('./prompts/copy-prompt-assessment.md?raw', () => ({ default: staged.assessment }))
vi.mock('./prompts/copy-prompt-assignment.md?raw', () => ({ default: staged.assignment }))

import { composeNotebookPrompt, PROMPT_KEYS, type PromptValues } from './prompt'
import readerSchema from './notebook-package-v4.schema.json'

afterAll(staged.cleanup)
const values = Object.fromEntries(PROMPT_KEYS.map(key => [key, null])) as PromptValues

describe('figures in guide source contract through the app composer', () => {
  for (const goal of ['review', 'assessment', 'assignment'] as const) {
    it.each(['new', 'update'] as const)(`${goal} %s includes the approved visual instructions`, mode => {
      const prompt = composeNotebookPrompt(goal, values, mode)
      expect(prompt).toContain('notebook-instructions-beta-31')
      expect(prompt).toContain('Show source visuals where they are taught.')
      expect(prompt).toContain('using the supplied pixels and a faithful caption; use the answer-neutral version when the original would reveal a practice answer.')
      expect(prompt).toContain('Practice may reuse the same asset: a figure used in Practice still appears in the guide section that teaches it.')
      expect(prompt).toContain('Decorative, title, administrative and duplicate slides stay out.')
      expect(prompt).toContain('`EC-VISUAL-GAPS`')
      expect(prompt).toContain('build a native visual from supported facts with the existing block types (study-diagram, sequence-strip, timeline, venn, continuum, table, illustration, worked-example).')
      expect(prompt).toContain('name it in the plain-titled gap section with exactly what to supply, and still teach the idea with a native visual where the facts support one.')
      expect(prompt).toContain("Never generate a synthetic image file for a missing visual; extracting or faithfully cropping supplied source pixels under EC-FIGURES stays allowed. Never present a native visual as the instructor's figure, and never reconstruct an unavailable question stimulus.")
      expect(prompt).toContain('A candidate that depicts content taught in the guide may not be skipped as overlapping or unnecessary; record the guide section it was placed in.')
      expect(prompt).toContain('List each guide section with the figure or native visual it uses, or the reason none is needed.')
      expect(prompt).not.toContain('need not receive a second walkthrough')
      expect(prompt).toContain('`EC-READING-DETAIL`')
      expect(prompt).toContain('Full detail is the default')
      expect(prompt).toContain('`EC-DETAIL-CHECK`')
      expect(prompt).toContain('The prefix belongs only on mastery-objective labels.')
      const embedded = prompt.split('\n## Exact JSON Schema\n')[1].split('```json\n')[1].split('\n```')[0]
      expect(embedded).toBe(JSON.stringify(readerSchema))
      expect(prompt.startsWith(`# ${mode === 'new' ? 'Create' : 'Update'} my Premed OS notebook: ${goal}\n`)).toBe(true)
    })
  }
})
