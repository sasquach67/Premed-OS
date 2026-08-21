/**
 * A bounded textbook / reading excerpt is student-pasted material, not an
 * upload or a claim that Premed OS can search a book. Keeping one exact chunk
 * makes it available to the existing source-grounded generators without
 * changing the transcript or blob-storage models.
 */
import type { AcademicFile, SourceChunk } from '@/lib/types'
import { uid } from '@/lib/id'

export const MIN_PASTED_EXCERPT_CHARACTERS = 120

export interface PastedExcerptInput {
  courseId: string
  text: string
  title?: string
  sourceLabel?: string
  sectionLabel?: string
  now?: number
  order?: number
}

export interface PastedExcerptImport {
  file: AcademicFile
  chunks: SourceChunk[]
}

/**
 * Creates exactly one owned Material and one exact-range SourceChunk. The
 * caller keeps its form state when this returns undefined, so a too-short
 * paste never costs a student what they typed.
 */
export function buildPastedExcerpt(input: PastedExcerptInput): PastedExcerptImport | undefined {
  const text = input.text.trim()
  if (text.length < MIN_PASTED_EXCERPT_CHARACTERS) return undefined

  const now = input.now ?? Date.now()
  const fileId = uid()
  const sourceLabel = input.sourceLabel?.trim()
  const sectionLabel = input.sectionLabel?.trim()
  const details = [
    'Pasted excerpt',
    sourceLabel && `source: ${sourceLabel}`,
    sectionLabel && `section: ${sectionLabel}`,
  ].filter(Boolean).join(' · ')
  const file: AcademicFile = {
    id: fileId,
    courseId: input.courseId,
    sourceType: 'paste',
    title: input.title?.trim() || sectionLabel || 'Pasted excerpt',
    type: 'other',
    owner: 'mine',
    linkedTopicIds: [],
    processingStatus: 'ready',
    notes: details,
    createdAt: now,
    updatedAt: now,
    order: input.order ?? 0,
  }
  const chunk: SourceChunk = {
    id: uid(),
    fileId,
    courseId: input.courseId,
    content: text,
    characterStart: 0,
    characterEnd: text.length,
    sourcePosition: { index: 0, label: sectionLabel },
    assignmentMethod: 'pending',
    assignmentConfirmed: false,
    coveredByKeyPoint: false,
    createdAt: now,
    updatedAt: now,
    order: 0,
  }
  return { file, chunks: [chunk] }
}
