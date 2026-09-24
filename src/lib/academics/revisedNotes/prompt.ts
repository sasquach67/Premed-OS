import schemaV2 from '../notebook/notebook-package.schema.json'
import schemaV3 from '../notebook/notebook-package-v3.schema.json'
import instructions from './instructions.md?raw'
import { composeNotebookPrompt } from '../notebook/prompt'
import { revisionInput } from '../notebook/revision'
import { canonical } from '../notebook/package'
import type { NotebookPackage, NotebookUpdateSession } from '../notebook/types'

export function buildRevisedNotesPrompt({ courseLabel, revision, notesDescription, additionalInstructions = '' }: {
  courseLabel: string
  revision: NotebookUpdateSession
  notesDescription: string
  additionalInstructions?: string
}): string {
  const entry = revision.baseline.entries[0]
  if (!entry) throw new Error('The saved notebook entry is unavailable.')
  let shared = composeNotebookPrompt(entry.goal, {
    COURSE_CODE: revision.baseline.course.code || courseLabel,
    COURSE_TITLE: revision.baseline.course.title,
    TERM: revision.baseline.course.term,
    SCOPE: entry.scope,
    MATERIALS: `Student-authored notes to identify in the AI chat: ${notesDescription.trim() || 'Not identified yet; ask which accessible file contains my own authored notes before revising'}. Also supply the exact exported saved notebook baseline and matching lecture materials.`,
    DEPTH: 'Revise the notes clearly and thoroughly without expanding into a second study guide.',
    CLASS_PREFERENCES: entry.request.classPreferences,
    HELP_STAGE: entry.request.helpStage,
    ASSESSMENT_FORMAT: entry.request.assessmentFormat,
    USER_REQUEST: `Add revised notes only, following the task-specific instructions at the start of this prompt. Preserve all existing notebook content. Student directions: ${additionalInstructions.trim() || 'None.'}`,
    REVISION_INPUT: revisionInput(revision),
  }, 'update')
  const version = revision.baseline.version
  if (version !== 4) {
    // Replace only the schema section, not text inside the student's context.
    const marker = '\n## Exact JSON Schema\n'
    const start = shared.lastIndexOf(marker)
    const end = shared.lastIndexOf('\nEND NOTEBOOK INSTRUCTIONS')
    if (start < 0 || end < start) throw new Error('Notebook schema section is unavailable.')
    const schema = version === 2 ? schemaV2 : schemaV3
    shared = `${shared.slice(0, start)}${marker}\nThis exact version ${version} schema governs this additive update; no version migration is allowed.\n\n\`\`\`json\n${JSON.stringify(schema)}\n\`\`\`\n${shared.slice(end)}`
  }
  const versionDirections = `Selected baseline version: ${version}; instructionsVersion: ${revision.baseline.instructionsVersion}. The matching Exact JSON Schema at the end governs this task. General instructions describing v4 creation or migration do not apply to an older saved baseline. Use only block types and fields supported by its matching schema. For version 2, use text blocks and report visual gaps; do not add assets, visualReview, or figure blocks. For version 3, do not introduce v4-only visual types. Preserve every existing baseline field and its version.`
  return `${instructions}\n\n## Selected format boundary\n\n${versionDirections}\n\n## Complete notebook format and delivery contract\n\n${shared}`
}

/** Restrict this workflow to additive notes; ordinary notebook updates stay separate. */
export function validateRevisedNotesAddition(baseline: NotebookPackage, proposed: NotebookPackage): void {
  const fail = (message: string): never => { throw new Error(`Revised notes: ${message}`) }
  const same = (a: unknown, b: unknown) => canonical(a) === canonical(b)
  if (proposed.version !== baseline.version || proposed.instructionsVersion !== baseline.instructionsVersion || !same(proposed.course, baseline.course)) fail('preserve the saved notebook version and course.')
  if (baseline.entries.length !== 1 || proposed.entries.length !== 1) fail('return only the selected notebook entry.')
  const before = baseline.entries[0], after = proposed.entries[0]
  if (after.baseRevision !== before.revision || after.revision !== before.revision + 1) fail('use the saved revision and its next revision.')
  for (const key of ['id', 'title', 'goal', 'scope', 'request', 'objectives', 'requirements'] as const) {
    if (!same(before[key], after[key])) fail(`keep existing ${key} unchanged; use the general notebook update flow for other changes.`)
  }
  if (!same(after.sections.slice(0, before.sections.length), before.sections)) fail('keep every existing section unchanged and in order.')
  const added = after.sections.slice(before.sections.length)
  if (!added.length || added.some(section => section.purpose !== 'workspace' || !/^Revised notes\s*[—–:-]/i.test(section.title) || section.blocks.some(block => block.type === 'practice'))) fail('append clearly titled Revised notes workspace sections without new practice questions.')
  if (!same(after.limitations.slice(0, before.limitations.length), before.limitations)) fail('preserve existing limitations.')
  if (!same(proposed.sources.slice(0, baseline.sources.length), baseline.sources)) fail('preserve existing source evidence; append new source records as needed.')
  if (baseline.version !== 2 && proposed.version !== 2 && !same(proposed.assets.slice(0, baseline.assets.length), baseline.assets)) fail('preserve existing visual assets.')
}
