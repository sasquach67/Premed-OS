import { describe, expect, it } from 'vitest'
import { buildTranscriptImport, parseTranscript } from '@/lib/academics/transcriptImport'

describe('timestamp shapes', () => {
  it('recognises the common transcript formats at the start of a line', () => {
    const text = [
      '22:14 If you only take one thing from this unit, know why the enolate attacks where it does.',
      '[31:08] These mechanisms look alike until the leaving group changes.',
      '(1:02:03) That is the exam-relevant distinction.',
      '00:04:11 - Housekeeping first.',
    ].join('\n')
    const parsed = parseTranscript(text)
    expect(parsed.hasTimestamps).toBe(true)
    expect(parsed.segments.map((segment) => segment.label)).toEqual(['22:14', '31:08', '1:02:03', '00:04:11'])
    expect(parsed.segments[3].text).toBe('Housekeeping first.')
  })

  it('does NOT treat a time inside a sentence as an anchor', () => {
    // Fabricating structure the transcript does not have is the failure mode.
    const parsed = parseTranscript('We ran the reaction for 22:14 and then stopped.')
    expect(parsed.hasTimestamps).toBe(false)
    expect(parsed.segments).toHaveLength(1)
    expect(parsed.segments[0].label).toBeUndefined()
  })

  it('keeps continuation lines with their timestamped segment', () => {
    const parsed = parseTranscript('22:14 First line.\nsecond line of the same thought.')
    expect(parsed.segments).toHaveLength(1)
    expect(parsed.segments[0].text).toBe('First line.\nsecond line of the same thought.')
  })
})

describe('plain prose degrades honestly', () => {
  it('still imports, split on blank lines, and reports no anchors', () => {
    const parsed = parseTranscript('First paragraph of the lecture.\n\nSecond paragraph.')
    expect(parsed.hasTimestamps).toBe(false)
    expect(parsed.segments.map((segment) => segment.text)).toEqual([
      'First paragraph of the lecture.',
      'Second paragraph.',
    ])
  })
})

describe('character offsets are exact', () => {
  it('points at the real substring of the pasted text', () => {
    const text = '22:14 know why the enolate attacks\n31:08 leaving group changes'
    const parsed = parseTranscript(text)
    for (const segment of parsed.segments) {
      expect(text.slice(segment.start, segment.end)).toBe(segment.text)
    }
  })
})

describe('building the records', () => {
  const text = '22:14 Enolate geometry.\n31:08 Leaving group order.'

  it('creates one pasted file and one chunk per segment, timestamps preserved', () => {
    const built = buildTranscriptImport({ courseId: 'c1', title: 'Lecture 18', text, now: 1 })!
    expect(built.file.sourceType).toBe('paste')
    expect(built.file.type).toBe('transcript')
    // The student captured it; the class did not hand it out.
    expect(built.file.owner).toBe('mine')
    expect(built.chunks).toHaveLength(2)
    expect(built.chunks.map((chunk) => chunk.sourcePosition?.label)).toEqual(['22:14', '31:08'])
    expect(built.chunks.every((chunk) => chunk.fileId === built.file.id)).toBe(true)
  })

  it('leaves chunks unassigned — a transcript never invents a topic or unit', () => {
    const built = buildTranscriptImport({ courseId: 'c1', title: 'Lecture 18', text, now: 1 })!
    expect(built.chunks.every((chunk) => chunk.topicId == null)).toBe(true)
    expect(built.chunks.every((chunk) => chunk.assignmentConfirmed === false)).toBe(true)
    expect(built.file.linkedTopicIds).toEqual([])
  })

  it('says so in the record when there are no time anchors', () => {
    const flat = buildTranscriptImport({ courseId: 'c1', title: 'L1', text: 'Just prose.', now: 1 })!
    expect(flat.hasTimestamps).toBe(false)
    expect(flat.file.notes).toContain('no time anchors')
  })

  it('imports nothing from empty or whitespace-only input', () => {
    expect(buildTranscriptImport({ courseId: 'c1', title: 'x', text: '' })).toBeUndefined()
    expect(buildTranscriptImport({ courseId: 'c1', title: 'x', text: '   \n\n  ' })).toBeUndefined()
  })

  it('falls back to a real title rather than an empty one', () => {
    const built = buildTranscriptImport({ courseId: 'c1', title: '  ', text, now: 1 })!
    expect(built.file.title).toBe('Pasted lecture transcript')
  })
})
