import { describe, expect, it } from 'vitest'
import type { ClassNote } from '@/lib/types'
import { extractGuideHeadlines, guideDirections, matchingGuideNotes, preferencesWithGuide, studentGuideInstruction, withoutGuideSnapshot } from './studentGuide'

const note = (id: string, scope: NonNullable<ClassNote['studentGuidance']>['scope'] = { kind: 'course' }): ClassNote => ({
  id, courseId: 'anth', title: id, content: '', type: 'other', kind: 'about-class', topicIds: [], linkedFileIds: [], syncStatus: 'local-only', createdAt: 1, updatedAt: 1, order: 0,
  studentGuidance: { group: 'approach', origin: 'manual', scope },
})
describe('student Guide selection and prompt boundaries', () => {
  it('selects whole class and exact lesson/assessment matches without legacy or cross-class notes', () => {
    const legacy = note('old syllabus'); delete legacy.studentGuidance
    const notes = [note('context'), note('Berry', { kind: 'lesson', id: 'berry' }), note('two sentences', { kind: 'assessment', id: 'exam1' }), note('other exam', { kind: 'assessment', id: 'exam2' }), { ...note('other class'), courseId: 'bio' }, legacy]
    expect(matchingGuideNotes(notes, { courseId: 'anth' }).map(n => n.id)).toEqual(['context'])
    expect(matchingGuideNotes(notes, { courseId: 'anth', lessonIds: ['berry'], assessmentId: 'exam1' }).map(n => n.id)).toEqual(['context', 'Berry', 'two sentences'])
    expect(matchingGuideNotes(notes, { courseId: 'anth', assessmentId: 'exam2' }).map(n => n.id)).toEqual(['context', 'other exam'])
  })
  it('keeps complete rough text behind concise editable headlines', () => {
    const raw = 'Explain why details matter. Use one or two examples.\n- ' + 'Supporting evidence '.repeat(20)
    const result = extractGuideHeadlines(raw)
    expect(result.map(n => n.headline).slice(0, 2)).toEqual(['Explain why details matter.', 'Use one or two examples.'])
    expect(result[2].headline.length).toBeLessThanOrEqual(180)
    expect(result[2].originalText).toBe('Supporting evidence '.repeat(20).trim())
  })
  it('gives teaching and retrieval the same ANTH priorities without treating them as evidence', () => {
    const directions = guideDirections([note('Explain why a visible laboratory matters within Amish values.'), note('Explain how the anthropologist knows.')])
    for (const purpose of ['notebook', 'flashcards', 'assessment'] as const) {
      const prompt = studentGuideInstruction(directions, purpose)
      for (const direction of directions) expect(prompt).toContain(direction.title)
      expect(prompt).toContain('not factual evidence')
      expect(prompt).toContain('Keep meaningful recall')
      expect(prompt).toContain('do not invent facts')
    }
    expect(studentGuideInstruction(directions, 'flashcards')).toContain('not flashcard structure')
    expect(studentGuideInstruction(directions, 'notebook')).toContain('not to ordinary teaching explanations')
  })
  it('replaces previous Guide snapshots on explicit updates without losing independent preferences', () => {
    const original = 'Use instructor terminology.'
    const first = preferencesWithGuide(original, [note('Old direction')])
    const next = preferencesWithGuide(first, [note('New direction')])
    expect(next).not.toContain('Old direction')
    expect(next).toContain('New direction')
    expect(withoutGuideSnapshot(next)).toBe(original)
    expect(preferencesWithGuide(next, [])).toBe(original)
    expect(first).toContain('Old direction') // Saved prior artifacts are immutable.
  })
})
