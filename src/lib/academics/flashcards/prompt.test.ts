import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { LectureRecord } from '@/lib/types'
import { revisionFixture, withNewTopic } from '@/lib/academics/notebook/revision.test-fixtures'
import { buildFlashcardPrompt, flashcardNotebookEligibility } from './prompt'

function lecture(): LectureRecord {
  const current = withNewTopic(revisionFixture())
  return { id: 'lecture-selected', courseId: 'demo', title: 'Selected lecture', inputPath: 'materials', processingState: 'ready', workspaceState: 'complete', createdAt: 1, updatedAt: 1, order: 0,
    importedNotebook: { current, original: structuredClone(current), entryId: 'topic-demo', originalRaw: 'PRIVATE RAW', fingerprint: 'x', importedAt: 1, progress: { private: { response: 'PRIVATE RESPONSE', complete: false } }, notes: 'PRIVATE NOTES' },
  }
}

describe('flashcard prompt handoff', () => {
  it('copies the Codex understanding-first prompt revision and preserves source access rules', () => {
    const prompt = buildFlashcardPrompt({ courseLabel: 'DEMO', lecture: lecture() })
    expect(prompt).toContain('Prompt revision: 2026-10-15 — Codex: understanding first, condense within reason, every combined meaning retained.')
    expect(prompt).toContain("Every named term's meaning gets direct recall")
    expect(prompt).not.toContain('There is no universal pedagogical deck maximum or per-concept cap')
    expect(prompt).not.toContain('Keep BOTH example directions')
    expect(prompt).toContain('The completed Journal is the required input.')
    expect(prompt).toContain('If only learning targets are present, or the supplied Journal context says content was omitted')
    expect(prompt).toContain('do not ask for them and do not look for another chat')
    expect(prompt).toContain('keep every named term, abbreviation, number, condition and instructor example')
    expect(prompt).toContain('was not checked against the original materials')
    expect(prompt).not.toContain('still required inputs')
    expect(prompt).not.toContain('find the chat where they uploaded')
    expect(prompt).not.toContain('try to locate the original Notebook conversation')
    expect(prompt).not.toContain('use available chat/file search')
    expect(prompt).not.toContain('paste this prompt into the original Notebook chat')
    expect(prompt).not.toContain('and its original materials before creating cards')
    expect(prompt).toContain('do not search for another chat or ask for original materials')
    expect(prompt).toContain('Apply the friend test to the Required answer (Back) itself, not just Extra')
    expect(prompt).toContain('Instead of a worker deciding how to do the job, management breaks it into small tasks and sets the method it thinks is most efficient.')
    expect(prompt).toContain('No source chatter in any student-facing card field')
    expect(prompt).toContain('Run the friend test on every card')
  })

  it('uses fixed card shapes, term-only definitions, and reference-deck cloze', () => {
    const prompt = buildFlashcardPrompt({ courseLabel: 'DEMO', lecture: lecture() })
    for (const phrase of [
      'keeps a term-alone Front',
      'not permission to cloze isolated definitions',
      '| Standalone definition | The term alone | Its meaning, without hedge tails |',
      '| Cloze fact | One sentence, one fact; blank the term, name, number, date, or who/where | No separate Back |',
      '| Cloze list or steps | One sentence or one short list; blank the items together | No separate Back |',
      '| Scenario | One or two sentences of situation, then one question | A concrete term, choice between named options, or one short cause |',
      '| Example | `Example of <term>` | The instructor\'s example |',
      '| Comparison / related terms | `<A> vs. <B>` or the named group | One short meaning per term, preserving the distinction |',
      '| Why / how | One direct question | One sentence |',
      'One question per card.',
      'Front: Scientific management (Taylorism)',
      'Blank the term, name or number; keep the meaning visible.',
      '{{c1::answer::hint}}',
      '{{c1::hippocampus::brain structure}}',
      'No nested cloze.',
      'A list is one note with its items blanked together under the same index.',
      'Under Technical, the Back retains the course\'s exact terms.',
    ]) expect(prompt).toContain(phrase)
    for (const obsolete of [
      'Front: What is scientific management or Taylorism?',
      'Keep the term visible and hide its meaning',
      'use no hints or nested cloze syntax',
      'use nonempty deletions without hints',
    ]) expect(prompt).not.toContain(obsolete)
  })

  it('counts review cards and preserves tested coverage while trimming reinforcement', () => {
    const prompt = buildFlashcardPrompt({ courseLabel: 'DEMO', lecture: lecture() })
    for (const phrase of [
      'Limit per idea: two review cards, or three only when the instructor stressed it',
      'a cloze note with c1 and c2 creates two review cards',
      'Coverage guard: every objective (topic) keeps at least one tested card; every Understand item is tested;',
      'Coverage wins when the limit conflicts with the coverage guard.',
      'explicitly report the exception and its review-card count',
      'Set each target\'s kind to understand, be-able-to-do, watch-for, or topic',
      'coverageExceptions is normally []',
      'one witness per note',
      'A multi-index cloze cannot earn an over-limit exception',
      'A bullet that merely restates a limit or hedge does not need a separate card',
      'Combine as a rule of thumb',
      'Every term\'s meaning must remain on the combined card',
      'Scenario answers are concrete',
      'Definition Backs carry the meaning only',
      'Keep a caution only when the instructor tests it',
      'Both directions are never automatic.',
      'Do not add a separate mirror note.',
      'No card may have an answer that merely repeats another card\'s answer on the same idea.',
      'Use at most one scenario or example card per idea',
      'Do not automatically create both directions, an example pair, or an invented extra situation.',
    ]) expect(prompt).toContain(phrase)
    expect(prompt).not.toContain('Both example directions remain available')
    expect(prompt).not.toContain('Never more than three cards for one idea')
  })

  it('keeps Extra concise or empty, pictures source-based, and the suspension note last in delivery', () => {
    const prompt = buildFlashcardPrompt({ courseLabel: 'DEMO', lecture: lecture() })
    for (const phrase of [
      'Extra: one short line, or empty.',
      'Empty Extra is correct when nothing helps; no omission reason is required.',
      'The default Back is already plain, so Extra must not restate it.',
      'Under Technical or Readings, Extra may be a short plain-words gloss',
      'explanation and example are alternative ways to supply the one optional Extra line',
      'The builder renders the selected optional Extra as one unlabelled line or source picture.',
      'Pictures are optional.',
      'if they do not, build the card without one',
      'Never generate or invent an image.',
      'Inspect the actual source figure before using it.',
      'A front figure must not expose the tested answer.',
      'end the delivery message with this note:',
      'Some of these cards may treat a detail as more important than it really is for your class.',
      'press @ (Shift+2) while reviewing to suspend that individual card. Press ! to suspend the whole note.',
    ]) expect(prompt).toContain(phrase)
    for (const obsolete of [
      'This is a firm requirement, not optional decorative text',
      'record a specific omission reason',
      'extraOmissionReason',
      'The builder displays explanation as “In other words” and the example separately.',
      '- In other words:',
      '- Illustrative example:',
    ]) expect(prompt).not.toContain(obsolete)
    expect(prompt).toContain('Two emphases exist')
    expect(prompt).toContain('- Technical:')
    expect(prompt).toContain('- Readings:')
  })

  it('requires a completed saved entry with both a guide and learning objectives', () => {
    const record = lecture()
    expect(flashcardNotebookEligibility(record).eligible).toBe(true)
    record.workspaceState = 'draft'
    expect(flashcardNotebookEligibility(record).eligible).toBe(false)
    record.workspaceState = 'complete'
    record.importedNotebook!.entryId = 'new-topic'
    expect(flashcardNotebookEligibility(record).eligible).toBe(false)
    record.importedNotebook!.entryId = 'absent'
    expect(() => buildFlashcardPrompt({ courseLabel: 'Demo', lecture: record })).toThrow('unavailable')
    record.importedNotebook!.entryId = 'topic-demo'
    record.importedNotebook!.current.entries[0].objectives = []
    expect(flashcardNotebookEligibility(record).eligible).toBe(false)
  })

  it('does not treat gaps or personal work as a completed study guide', () => {
    const record = lecture()
    const section = record.importedNotebook!.current.entries[0].sections[0]
    record.importedNotebook!.current.entries[0].sections = [section]
    section.blocks = [{ id: 'gap', type: 'gap', provenance: 'clarification', text: 'Material missing', nextStep: 'Upload it', sourceIds: [], excerptIds: [] }]
    expect(flashcardNotebookEligibility(record).eligible).toBe(false)
    section.blocks = [{ id: 'work', type: 'paragraph', provenance: 'student-work', text: 'My response', sourceIds: [], excerptIds: [] }]
    expect(flashcardNotebookEligibility(record).eligible).toBe(false)
  })

  it('copies current selected content and evidence without other entries or private work', () => {
    const record = lecture(), notebook = record.importedNotebook!
    const entry = notebook.current.entries[0]
    const block = entry.sections[0].blocks[0]
    if (block.type === 'paragraph') block.text = 'CURRENT SELECTED EXPLANATION'
    entry.sections[0].blocks.push({ id: 'private', type: 'paragraph', provenance: 'student-work', text: 'PRIVATE BLOCK', sourceIds: [], excerptIds: [] })
    notebook.current.sources[0].excerpts.push({ id: 'other-excerpt', location: null, text: 'UNRELATED SOURCE EXCERPT' })
    notebook.current.sources[0].limitations.push('PARTIAL SOURCE WARNING')
    const prompt = buildFlashcardPrompt({ courseLabel: 'DEMO 101', lecture: record })
    expect(prompt).toContain('CURRENT SELECTED EXPLANATION')
    expect(prompt).toContain('PARTIAL SOURCE WARNING')
    for (const secret of ['PRIVATE RAW', 'PRIVATE RESPONSE', 'PRIVATE NOTES', 'PRIVATE BLOCK', 'UNRELATED SOURCE EXCERPT', 'New separate topic']) expect(prompt).not.toContain(secret)
    expect(prompt).toContain('excerpt-mapping')
  })

  it('includes the complete exact build files and approved teaching/design rules', () => {
    const prompt = buildFlashcardPrompt({ courseLabel: 'DEMO', lecture: lecture() })
    const files = [...prompt.matchAll(/### File: ([^\n]+)\n\n```[^\n]+\n([\s\S]*?)\n```/g)]
    expect(files.map(match => match[1])).toEqual(['cards.schema.json', 'card-styles.css', 'requirements.txt', 'build_deck.py', 'verify_deck.py'])
    for (const [, name, content] of files) expect(`${content}\n`).toBe(readFileSync(resolve('premed-hq-documentation/flashcards/prompt', name), 'utf8'))
    for (const phrase of ['Both directions are never automatic', 'optional bounded synthesis', 'one unlabelled line', 'smaller sans-serif Extra', 'Native image occlusion is not supported in v1', 'completed Journal']) expect(prompt).toContain(phrase)
    expect(prompt).not.toContain('review draft')
  })

  it('adds mastery coverage, original wording, explicit references, and missed-question reinforcement', () => {
    const prompt = buildFlashcardPrompt({ courseLabel: 'Demo', lecture: lecture() })
    for (const addition of [
      "Use the Journal's mastery objectives as the checklist of learning targets. Take the facts from the original materials: terms, numbers, conditions, cautious words such as “may”, the instructor's examples, what the instructor stressed, and any phrase the instructor said belongs in an answer, because the study guide is intentionally concise and may leave out card-worthy detail. Write each Required answer yourself in the wording this prompt sets below; do not copy a textbook or slide definition as the Required answer.",
      'Keep a target for every Journal objective (topic), every Understand item and every named term;',
      'or “the lecture\'s example” and “what class identified”; name the concept or example instead.',
      'If the student supplies missed practice or exam questions, add one or two cards, within the limit per idea, on the concept each miss tested, such as the misconception, condition, or distinction, rather than a copy of the question.',
    ]) expect(prompt).toContain(addition)
  })

  it('retains selected learning targets when teaching makes the Journal oversized, without private or unrelated content', () => {
    const record = lecture(), notebook = record.importedNotebook!, entry = notebook.current.entries[0]
    const before = structuredClone(entry)
    entry.sections[0].blocks.push({ id: 'large', type: 'paragraph', provenance: 'source', text: 'OVERSIZED TEACHING '.repeat(10_000), sourceIds: [], excerptIds: [] })
    entry.sections[0].blocks.push({ id: 'private', type: 'paragraph', provenance: 'student-work', text: 'PRIVATE BLOCK', sourceIds: [], excerptIds: [] })
    notebook.current.entries[1].objectives = [{ ...entry.objectives[0], title: 'OTHER ENTRY OBJECTIVE' }]
    notebook.current.sources[0].excerpts.push({ id: 'other-excerpt', location: null, text: 'UNRELATED SOURCE EXCERPT' })
    const prompt = buildFlashcardPrompt({ courseLabel: 'Demo', lecture: record })
    const context = JSON.parse(prompt.slice(prompt.lastIndexOf('\n\n{') + 2))
    expect(context.contextTruncated).toBe(true)
    expect(context.journal.entry).toEqual({ id: before.id, revision: before.revision, title: before.title, goal: before.goal, scope: before.scope, objectives: before.objectives, requirements: before.requirements, limitations: before.limitations })
    expect(context.journal).not.toHaveProperty('omitted')
    expect(context.journal.entry).not.toHaveProperty('sections')
    expect(context.journal).not.toHaveProperty('sources')
    expect(context.journal.sourceAccessNotice).toContain('Attach the complete selected Journal before creating cards. Original materials are optional and recommended.')
    expect(JSON.stringify(context.journal, null, 2).length).toBeLessThanOrEqual(100_000)
    for (const secret of ['PRIVATE RAW', 'PRIVATE RESPONSE', 'PRIVATE NOTES', 'PRIVATE BLOCK', 'UNRELATED SOURCE EXCERPT', 'New separate topic', 'OTHER ENTRY OBJECTIVE', 'OVERSIZED TEACHING']) expect(prompt).not.toContain(secret)
  })

  it('omits oversized context explicitly without producing broken partial JSON', () => {
    const record = lecture()
    record.importedNotebook!.current.entries[0].scope = 'x'.repeat(110_000)
    const prompt = buildFlashcardPrompt({ courseLabel: 'Demo', lecture: record })
    expect(prompt).toContain('"contextTruncated": true')
    expect(prompt).toContain('"omitted": true')
    // Bound omitted-context overhead independently of intentional static instruction growth.
    const instructions = readFileSync(resolve('src/lib/academics/flashcards/instructions.md'), 'utf8')
    expect(prompt.length).toBeLessThan(instructions.length + 2_000)
    const context = JSON.parse(prompt.slice(prompt.lastIndexOf('\n\n{') + 2))
    expect(context.journal).toEqual({ omitted: true, reason: 'Selected Journal exceeds the copy budget. Attach the complete selected Journal before creating cards. Original materials are optional and recommended.' })
  })

  it('supports completed legacy guides only when a saved Mastery Map exists', () => {
    const record = lecture()
    delete record.importedNotebook
    record.studyGuide = { specId: 'study-guide-v1', specHash: 'x', courseId: 'demo', topicId: 'x', sections: [{ id: 's', title: 'Guide', blocks: [{ id: 'b', type: 'prose', provenance: 'source', text: { content: 'Legacy content' } }] }] }
    expect(flashcardNotebookEligibility(record).eligible).toBe(false)
    record.masteryMapId = 'map-id'
    expect(flashcardNotebookEligibility(record).eligible).toBe(true)
    expect(buildFlashcardPrompt({ courseLabel: 'Demo', lecture: record })).toContain('Its ID alone does not supply its contents')
  })
})

it('includes selected student direction in the flashcard handoff without changing saved Journal content', () => {
  const record = lecture(), before = JSON.stringify(record)
  const prompt = buildFlashcardPrompt({ courseLabel: 'ANTH 147', lecture: record, guideDirections: [{ id: 'guide', title: 'Explain why a visible laboratory matters within Amish values.', content: '', studentGuidance: { group: 'approach', scope: { kind: 'course' }, origin: 'manual' } }] })
  expect(prompt).toContain('Explain why a visible laboratory matters within Amish values.')
  expect(prompt).toContain('not factual evidence')
  expect(prompt).toContain('not flashcard structure')
  expect(JSON.stringify(record)).toBe(before)
})
