/**
 * Lecture transcript import (§4.1-Q) — pasted text, not audio.
 *
 * Brief: implementation/briefs/T1-academics-build-10.md, which supersedes the
 * blocked lecture-capture pass.
 *
 * GoodNotes records and transcribes on-device; Universal Clipboard moves the
 * text; this module turns that text into the `SourceChunk` rows the rest of
 * Academics already understands. **Premed OS never touches audio**, so there is
 * no provider, no key, and nothing to disclose about a recording.
 *
 * ⚠️ Two honesty rules live here:
 *   1. **A timestamp is only an anchor at the start of a line.** "the 22:14
 *      reaction" inside a sentence is text, and treating it as a time anchor
 *      would fabricate structure the transcript does not have.
 *   2. **No timestamps is a supported outcome, not a failure.** The import
 *      still works, `hasTimestamps` is false, and the UI must say that time
 *      anchors are unavailable rather than implying the text is time-indexed.
 */
import type { AcademicFile, SourceChunk } from '@/lib/types'
import { uid } from '@/lib/id'

export interface TranscriptSegment {
  /** The timestamp as the transcript wrote it, when the line carried one. */
  label?: string
  text: string
  /** Exact character range into the pasted text — never an approximation. */
  start: number
  end: number
}

export interface ParsedTranscript {
  segments: TranscriptSegment[]
  /** False when the source carried no line-leading timestamps at all. */
  hasTimestamps: boolean
}

/**
 * `22:14` · `[22:14]` · `(1:02:03)` · `00:22:14` · `12:03 -` — anchored to the
 * start of the line, with optional bracket, and an optional separator after.
 */
const TIMESTAMP = /^\s*[[(]?(\d{1,2}:\d{2}(?::\d{2})?)[\])]?\s*[-–—:]?\s*/

export function parseTranscript(text: string): ParsedTranscript {
  const lines = text.split('\n')
  const segments: TranscriptSegment[] = []
  let cursor = 0
  let hasTimestamps = false
  let open: TranscriptSegment | undefined

  const close = () => {
    if (!open) return
    open.text = open.text.trim()
    if (open.text) segments.push(open)
    open = undefined
  }

  for (const line of lines) {
    const lineStart = cursor
    cursor += line.length + 1 // the newline consumed by split
    const match = TIMESTAMP.exec(line)

    if (match) {
      hasTimestamps = true
      close()
      const bodyStart = lineStart + match[0].length
      open = {
        label: match[1],
        text: line.slice(match[0].length),
        start: bodyStart,
        end: bodyStart + line.length - match[0].length,
      }
      continue
    }

    // A blank line closes a segment when there are no timestamps to group by.
    if (!line.trim()) {
      close()
      continue
    }

    if (open) {
      open.text += `\n${line}`
      open.end = lineStart + line.length
      continue
    }

    open = { text: line, start: lineStart, end: lineStart + line.length }
  }
  close()

  return { segments, hasTimestamps }
}

export interface TranscriptImport {
  file: AcademicFile
  chunks: SourceChunk[]
  hasTimestamps: boolean
}

/**
 * Build the records for one pasted transcript. Returns `undefined` for empty or
 * whitespace-only input — an empty paste imports nothing rather than creating a
 * hollow material.
 */
export function buildTranscriptImport({ courseId, title, text, now = Date.now(), order = 0 }: {
  courseId: string
  title: string
  text: string
  now?: number
  order?: number
}): TranscriptImport | undefined {
  const parsed = parseTranscript(text)
  if (!parsed.segments.length) return undefined

  const fileId = uid()
  const file: AcademicFile = {
    id: fileId,
    courseId,
    sourceType: 'paste',
    title: title.trim() || 'Pasted lecture transcript',
    type: 'transcript',
    // `mine`, not `course`: the lecture is the instructor's, but this artifact
    // is the student's own capture of it. Nothing here was handed out by the
    // class, and labelling it "Instructor-provided" would misstate provenance
    // on the one surface built to make provenance visible.
    owner: 'mine',
    linkedTopicIds: [],
    processingStatus: 'ready',
    notes: parsed.hasTimestamps
      ? `Pasted transcript · ${parsed.segments.length} timestamped segments`
      : `Pasted transcript · ${parsed.segments.length} segments · no time anchors`,
    createdAt: now,
    updatedAt: now,
    order,
  }

  const chunks: SourceChunk[] = parsed.segments.map((segment, index) => ({
    id: uid(),
    fileId,
    courseId,
    content: segment.text,
    characterStart: segment.start,
    characterEnd: segment.end,
    sourcePosition: { index, label: segment.label },
    assignmentMethod: 'pending',
    assignmentConfirmed: false,
    coveredByKeyPoint: false,
    createdAt: now,
    updatedAt: now,
    order: index,
  }))

  return { file, chunks, hasTimestamps: parsed.hasTimestamps }
}
