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
    for (const phrase of ['Keep BOTH example directions', 'Keep useful blurt overlap', 'In other words', 'Illustrative example', 'smaller sans-serif Extra', 'Native image occlusion is not supported in v1', 'completed Journal']) expect(prompt).toContain(phrase)
    expect(prompt).not.toContain('review draft')
  })

  it('omits oversized context explicitly without producing broken partial JSON', () => {
    const record = lecture()
    record.importedNotebook!.current.entries[0].scope = 'x'.repeat(110_000)
    const prompt = buildFlashcardPrompt({ courseLabel: 'Demo', lecture: record })
    expect(prompt).toContain('"contextTruncated": true')
    expect(prompt).toContain('"omitted": true')
    expect(prompt.length).toBeLessThan(60_000)
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
