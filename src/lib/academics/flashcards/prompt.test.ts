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
  it('copies the pending October 16l prompt revision and preserves source access rules', () => {
    const prompt = buildFlashcardPrompt({ courseLabel: 'DEMO', lecture: lecture() })
    expect(prompt).toContain('Prompt revision: 2026-10-16m — no card-count target for any subject; biology concepts and mechanisms only with no passage drills; PSYC lecture examples retained.')
    expect(prompt).toContain('A standalone headline term or theory, one the instructor defines and builds the lecture around, gets a two-blank note')
    expect(prompt).not.toContain('There is no universal pedagogical deck maximum or per-concept cap')
    expect(prompt).not.toContain('Keep BOTH example directions')
    expect(prompt).toContain('The completed Journal is the required input.')
    expect(prompt).toContain('If only learning targets are present, or the supplied Journal context says content was omitted')
    expect(prompt).toContain('do not ask for them and do not look for another chat')
    expect(prompt).toContain('keep every in-scope new or lecture-defined term, abbreviation, number, condition and instructor example')
    expect(prompt).toContain('was not checked against the original materials')
    expect(prompt).not.toContain('still required inputs')
    expect(prompt).not.toContain('find the chat where they uploaded')
    expect(prompt).not.toContain('try to locate the original Notebook conversation')
    expect(prompt).not.toContain('use available chat/file search')
    expect(prompt).not.toContain('paste this prompt into the original Notebook chat')
    expect(prompt).not.toContain('and its original materials before creating cards')
    expect(prompt).toContain('do not search for another chat or ask for original materials')
    expect(prompt).toContain('Apply the friend test to the Required answer (Back) itself, not just Extra')
    expect(prompt).toContain('{{c1::Scientific management::management approach}} (Taylorism) is when')
    expect(prompt).toContain('No source chatter in any student-facing card field')
    expect(prompt).toContain('Run the friend test on every card')
  })

  it('limits new cards to lecture retention and checks recordings only for gaps', () => {
    const prompt = buildFlashcardPrompt({ courseLabel: 'DEMO', lecture: lecture() })
    for (const phrase of [
      "Only this lecture's new content gets cards.",
      'gets no card of its own unless an objective explicitly tests it',
      'Record merely used background terms as context in the build report, not as new named-term targets',
      'Never turn worksheet, guided-reading, GRQ or practice questions into cards.',
      'Practice already lives in Premed OS; flashcards are for retention.',
      'Do not make one card per question',
      'lecture example cards and picture cards for figures the lecture teaches stay',
      'not performance on the exercise',
      'Read the complete Journal, the slides and the worksheet first',
      'Use recordings and transcripts only to fill specific gaps',
      'Do not transcribe or review whole recordings',
      'what was skipped',
      'One fact per card.',
      'Cut a trailing second fact',
      'A short causal explanation needed to understand the same fact stays.',
      'EVERY pair starts with TWO separate meaning notes',
    ]) expect(prompt).toContain(phrase)
  })

  it('recalls each meaning alone and adds only the approved headline names contrast', () => {
    const prompt = buildFlashcardPrompt({ courseLabel: 'DEMO', lecture: lecture() })
    for (const phrase of [
      'EVERY in-scope term the lecture defines keeps its OWN card',
      'Never group parallel term meanings on one review card',
      'Do not author grouped-meanings cards.',
      'Positive regulators {{c1::promote cell-cycle progression}}.',
      'Negative regulators {{c1::restrain cell-cycle progression}}.',
      'Headline pair, opposite or non-opposite: add ONE contrast note',
      'both meanings visible and both names hidden together under the same c1',
      'Simple pair: keep only the TWO individual meaning notes.',
      'Intrinsic motivation is {{c1::doing an activity because it is enjoyable or satisfying}}.',
      'Extrinsic motivation is {{c1::doing an activity for an outside reward or to avoid a consequence}}.',
      'Never blank one opposite name while leaving its partner name visible.',
      'Category hints can name the answer kind but never list candidates.',
      '{{c2::inactivates::effect on Rb}}',
      'The builder emits a warning when a slash-separated word-choice hint contains the answer',
    ]) expect(prompt).toContain(phrase)
    expect(prompt).not.toContain('Parallel meaning groups may contain 2–4 terms')
    expect(prompt).not.toContain('Non-opposite headline pair: add one separate name-only sister')
    expect(prompt).not.toContain('Incentive theory focuses on {{c1::positive::positive/negative}} reinforcement')
  })

  it('limits biology to concepts while preserving PSYC examples and honest scope reporting', () => {
    const prompt = buildFlashcardPrompt({ courseLabel: 'DEMO', lecture: lecture() })
    for (const phrase of [
      'This section applies to BIOLOGY lectures only',
      'PSYC keeps its lecture-example cards, including biological psychology',
      'Biology cards test concepts and mechanisms only',
      'No cards for passage material: experiments, data figures, gels and lanes, cell lines, assay controls, primer names, figure-specific direction drills',
      'named examples used only as illustrations',
      'at most ONE short Example or Evidence line in Extra',
      'Picture cards are ONLY for structures or processes students are asked to draw or label',
      'NEVER more than five per biology lecture',
      'one checkable one-sentence answer',
      'A connecting card REPLACES a plain cloze testing the same fact',
      'senescence versus apoptosis, or expression versus enzyme activity',
      'no target card count for any subject, biology included',
      'set the top-level subject to "biology"',
      'Apply this subject scope BEFORE building targets',
      'as explicit entries in cards.json limitations',
      'do not classify a PSYC course as biology merely because a title mentions biology',
      'retain the useful chosen connection and remove its same-fact cloze',
      'a taught AZT chain-termination mechanism are conceptual content',
    ]) expect(prompt).toContain(phrase)
    expect(prompt).not.toContain('make a picture card: the image on the front')
    expect(prompt).not.toContain('rather than asked as a why question')
  })

  it('requires clarity, available examples, definition recall and short notebook-derived chips', () => {
    const prompt = buildFlashcardPrompt({ courseLabel: 'DEMO', lecture: lecture() })
    for (const phrase of [
      'Extra holds up to three short lines',
      'This line is required on a definition or claim card whenever the Journal or lecture gives an example',
      'This is allowed under default wording too',
      'Required cold-read review before building.',
      'Report how many cards were rewritten',
      'Never invent terms.',
      'Definition recall is never cut.',
      'term has no definition-recall card',
      'Breadcrumb chips are short topic LABELS, never paragraphs.',
      'Use 1–4 words and aim for at most about 32 characters',
      'The builder FAILS above 40 characters',
      'Every word in a segment must appear in one actual notebook title',
      'notebookTitles array',
      'Keep target.topic as the full exact objective in the coverage ledger',
      'breadcrumb words are not in a notebook title',
      'Report every background term moved into a lecture-specific card.',
      'Use the F2 chip on the label row',
      '11.5px, padding 4px 9px',
      'light background #efe9de with text #6f675a',
      'night background #3a342b with text #cfc6b6',
      "At 390px the chip's complete text must stay on ONE line",
      'its text must not wrap, clip or use an ellipsis',
      'replace it with another short notebook-derived topic label',
      'do not use hiding the chip as the authoring solution',
    ]) expect(prompt).toContain(phrase)
    expect(prompt).not.toContain('Extra: one short line, or empty.')
    expect(prompt).not.toContain('at most 80 characters')
  })

  it('uses fixed card shapes, two-blank definition notes, and reference-deck cloze', () => {
    const prompt = buildFlashcardPrompt({ courseLabel: 'DEMO', lecture: lecture() })
    for (const phrase of [
      'A standalone headline term retains its two-blank note',
      '| Standalone headline term or theory | One sentence: “{{c1::term::hint}} is {{c2::meaning}}” or “The {{c1::theory::hint}} states that {{c2::claim}}” | No separate Back; two review cards |',
      '| Cloze fact | One sentence, one fact; blank the term, name, number, date, or who/where | No separate Back |',
      '| Cloze list or steps | One sentence or one short list; blank the items together | No separate Back |',
      '| Scenario (instructor\'s example) | One or two sentences of situation, then one short plain question about one term | The term alone; the explanation, if any, goes in Extra |',
      '| Example | `Example of <term>` | The instructor\'s example |',
      '| Simple pair | Two separate notes, each term visible and its meaning under c1',
      '| Headline pair, opposite or non-opposite | Two individual meaning notes, then one contrast with meanings visible and both names under c1',
      '| Umbrella | “The N parts of X are {{c1::a}}, {{c1::b}} …”, placed before its members | No separate Back; one review card |',
      'Bold the cue.',
      'Keep why/how cards to a minimum.',
      'Small cards over heavy ones.',
      'No question asked twice.',
      'Give every umbrella or list card a key in Extra',
      'Tag every note with its Journal objective',
      '### Update an existing deck',
      'Update notes: Always; Update note types: Always',
      'tag:premedos::retired',
      'One-time migration:',
      'with --previous on both commands',
      'A member of an umbrella group never gets an extra name blank',
      'If the lecture defines that sub-term, give it a target and a meaning blank in its own note',
      'Biology concept formats',
      'Each defined member gets its OWN meaning card',
      'Umbrella first.',
      'Every other defined term gets its OWN note with one blank on its meaning and the term visible',
      'use a famous standard one only if the lecture has none',
      'a one-word card label (recall, list, application, example, compare, why)',
      '| Why / how | One direct question | One sentence |',
      'One question per card.',
      'Cloze: {{c1::Scientific management::management approach}} (Taylorism)',
      'For a fact, blank the term, name or number and keep the rest visible.',
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
      'Limit per idea: two review cards, or three when the instructor gave an example or stressed it',
      'c1 and c2 create two reviews',
      'Coverage guard: every in-scope objective (topic) keeps at least one tested card; every in-scope Understand item is tested;',
      'Coverage wins when the limit conflicts with the coverage guard.',
      'explicitly report the exception and its review-card count',
      'Set each target\'s kind to understand, be-able-to-do, watch-for, or topic',
      'coverageExceptions is normally []',
      'one witness per note',
      'A multi-index cloze cannot earn an over-limit exception',
      'A bullet that merely restates a limit or hedge does not need a separate card',
      'Do not group parallel meanings, even if the terms contrast or belong together',
      'lecture example cards stay',
      'Question fronts follow the reference decks too',
      'Every defined term\'s complete meaning stays on its OWN meaning-recall card',
      'Scenario answers are concrete',
      'carry the meaning only',
      'Keep a caution only when the instructor tests it',
      'One answer per card.',
      'Never let the question give away its answer.',
      'No essay or policy questions.',
      'simplify by explaining, not by cutting words',
      'Explain-it test',
      'Keep personal pronouns (you, we, our, us) to a minimum',
      'Both directions are never automatic.',
      'Do not add a separate mirror note.',
      'No card may have an answer that merely repeats another card\'s answer on the same idea.',
      'Use at most one scenario or example card per idea.',
      'Never invent a scenario for its own card',
    ]) expect(prompt).toContain(phrase)
    expect(prompt).not.toContain('Both example directions remain available')
    expect(prompt).not.toContain('Never more than three cards for one idea')
  })

  it('keeps Extra concise or empty, pictures source-based, and the suspension note last in delivery', () => {
    const prompt = buildFlashcardPrompt({ courseLabel: 'DEMO', lecture: lecture() })
    for (const phrase of [
      'Extra holds up to three short lines',
      'Empty Extra stays correct only when none of these three applies.',
      'A clearer Back is still required',
      'This is allowed under default wording too',
      'Both may be filled, with at most three useful text lines in total.',
      'The builder renders up to three useful Extra lines',
      'Outside biology, use the slide or figure for a card whenever the attached materials have one',
      'With no relevant figure, build the card without one',
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
    expect(files.map(match => match[1])).toEqual(['cards.schema.json', 'card-styles.css', 'requirements.txt', 'list-reveal.js', 'image_occlusion.py', 'prepare_occlusion.py', 'read_previous.py', 'pair_rules.py', 'build_deck.py', 'verify_deck.py'])
    for (const [, name, content] of files) expect(`${content}\n`).toBe(readFileSync(resolve('premed-hq-documentation/flashcards/prompt', name), 'utf8'))
    for (const phrase of ['Both directions are never automatic', 'Do not use free-recall (blurt) cards', 'up to three useful Extra lines', 'smaller sans-serif Extra', 'use native image occlusion', 'completed Journal']) expect(prompt).toContain(phrase)
    expect(prompt).not.toContain('review draft')
  })

  it('adds mastery coverage, original wording, explicit references, and missed-question reinforcement', () => {
    const prompt = buildFlashcardPrompt({ courseLabel: 'Demo', lecture: lecture() })
    for (const addition of [
      "Use the Journal's mastery objectives as the checklist of learning targets. Take the facts from the original materials: terms, numbers, conditions, cautious words such as “may”, the instructor's examples, what the instructor stressed, and any phrase the instructor said belongs in an answer, because the study guide is intentionally concise and may leave out card-worthy detail. Write each Required answer yourself in the wording this prompt sets below; do not copy a textbook or slide definition as the Required answer.",
      'Keep a target for every in-scope Journal objective (topic), every in-scope Understand item and every in-scope new or lecture-defined term;',
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
