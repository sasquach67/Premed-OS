import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { addGuideImport, reviewGuideImport } from './guideImport'
import { matchingGuideNotes } from './studentGuide'

const setup = () => {
  const seed = structuredClone(createSeedData()), courseId = seed.courses.find(course => course.code === 'BIOL 103')!.id
  const data = seed.academics.classCenter
  const exam = data.assignments.find(item => item.courseId === courseId)!
  const packet = { format: 'premed-os-guide', version: 1, courseId, id: 'starting-guide', entries: [
    { key: 'approach', headline: 'Practice the objective.', details: 'Source: course FAQ.', group: 'approach', scope: { kind: 'course' } },
    { key: 'exam', headline: 'Use short answers.', details: 'Source: exam instructions.', group: 'expectations', scope: { kind: 'assessment', title: exam.title } },
    { key: 'hours', headline: 'Wednesday office hours.', details: '10–11:30, Coker 104.', group: 'reference' },
  ] }
  return { data, courseId, packet, exam }
}
describe('compiled Guide import', () => {
  it('is additive, preserves other records, and keeps reference and assessment scope out of course-wide generation', () => {
    const { data, courseId, packet, exam } = setup(), before = structuredClone(data)
    const entries = reviewGuideImport(JSON.stringify(packet), courseId, data)
    expect(data).toEqual(before)
    expect(addGuideImport(data, courseId, entries, 100)).toBe(3)
    expect(data.notes.slice(0, before.notes.length)).toEqual(before.notes)
    expect({ ...data, notes: [] }).toEqual({ ...before, notes: [] })
    expect(matchingGuideNotes(data.notes, { courseId }).map(n => n.title)).toEqual(['Practice the objective.'])
    expect(matchingGuideNotes(data.notes, { courseId, assessmentId: exam.id }).map(n => n.title)).toEqual(['Practice the objective.', 'Use short answers.'])
    data.notes.find(n => n.id === entries[0].id)!.title = 'My subsequent edit'
    expect(addGuideImport(data, courseId, entries)).toBe(0)
    expect(data.notes.find(n => n.id === entries[0].id)!.title).toBe('My subsequent edit')
  })
  it('keeps identical wording in different scopes and distinguishes reference notes from guidance', () => {
    const { data, courseId, packet, exam } = setup()
    const second = { ...exam, id: 'second-exam', title: 'Second exam' }
    data.assignments.push(second)
    packet.entries.push({ ...packet.entries[1], key: 'second-exam', scope: { kind: 'assessment', title: second.title } })
    packet.entries.push({ ...packet.entries[0], key: 'reference-copy', group: 'reference' })
    const entries = reviewGuideImport(JSON.stringify(packet), courseId, data)
    expect(addGuideImport(data, courseId, entries)).toBe(5)
    expect(matchingGuideNotes(data.notes, { courseId, assessmentId: second.id }).map(n => n.title)).toEqual(['Practice the objective.', 'Use short answers.'])
  })
  it('rejects another class, missing scopes, duplicate keys, and unknown or ambiguous assessments', () => {
    const { data, courseId, packet, exam } = setup()
    const read = (value: unknown) => reviewGuideImport(JSON.stringify(value), courseId, data)
    expect(() => read({ ...packet, courseId: 'another-course' })).toThrow('this class')
    const invalid = structuredClone(packet); delete (invalid.entries[0] as { scope?: unknown }).scope
    expect(() => read(invalid)).toThrow('scope')
    expect(() => read({ ...packet, entries: [...packet.entries, packet.entries[0]] })).toThrow('unique key')
    const missing = structuredClone(packet); missing.entries[1].scope!.title = 'Does not exist'
    expect(() => read(missing)).toThrow('uniquely match')
    data.assignments.push({ ...exam, id: 'duplicate' })
    expect(() => read(packet)).toThrow('uniquely match')
  })
})
