import type { AcademicFile, SourceChunk } from '@/lib/types'

/**
 * The intake deliberately works from record identity, ownership, and readable
 * chunks. Titles are presentation only: a file named "my notes" is not a
 * student-note baseline unless its stored owner says `mine`.
 */
export type MaterialGenerationChoice = {
  file: AcademicFile
  chunks: SourceChunk[]
}

export function materialGenerationChoices({
  courseId,
  files,
  chunks,
}: {
  courseId: string
  files: readonly AcademicFile[]
  chunks: readonly SourceChunk[]
}): MaterialGenerationChoice[] {
  return files
    .filter((file) => file.courseId === courseId)
    .map((file) => ({
      file,
      chunks: chunks.filter((chunk) =>
        chunk.courseId === courseId
        && chunk.fileId === file.id
        && Boolean(chunk.content.trim()),
      ),
    }))
}

export function selectedMaterialChunks(
  choices: readonly MaterialGenerationChoice[],
  selectedFileIds: readonly string[],
): SourceChunk[] {
  const selected = new Set(selectedFileIds)
  return choices
    .filter((choice) => choice.chunks.length && selected.has(choice.file.id))
    .flatMap((choice) => choice.chunks)
}

const QUESTION_SOURCE_LABEL = /\b(?:assessment|exam|grq|guided\s+reading|homework|practice|problem(?:s|\s+set)?|question(?:s|\s+bank)?|quiz|review\s+questions?|worksheet)\b/i
const QUESTION_PASSAGE = /\?|(?:^|\n)\s*(?:(?:q(?:uestion)?\s*)?\d+[.):]|[a-e][.)])\s+|(?:^|\n)\s*(?:calculate|compare|determine|evaluate|explain|how|identify|interpret|predict|select|what|which|why)\b/im

/**
 * Identify selected passages that contain question examples. The signal is
 * deliberately provider- and file-type-agnostic: a Pearson set, a GRQ, a
 * lecture-slide checkpoint, and a pasted worksheet all receive the same role.
 */
export function practiceQuestionChunkIds(
  files: readonly AcademicFile[],
  chunks: readonly SourceChunk[],
): string[] {
  const byId = new Map(files.map((file) => [file.id, file]))
  return [...new Set(chunks.filter((chunk) => {
    const file = byId.get(chunk.fileId)
    if (!file) return false
    const sourceLabel = [file.title, file.fileName, file.notes, file.folderIntake?.category]
      .filter(Boolean)
      .join(' ')
    return file.type === 'past-exam'
      || file.folderIntake?.category === 'practice-problems'
      || QUESTION_SOURCE_LABEL.test(sourceLabel)
      || QUESTION_PASSAGE.test(chunk.content)
  }).map((chunk) => chunk.id))]
}

/** A revised-notes baseline may only be an explicitly selected student record. */
export function selectedNotesBaseline(
  choices: readonly MaterialGenerationChoice[],
  baselineFileId: string,
  selectedFileIds: readonly string[],
): MaterialGenerationChoice | undefined {
  if (!selectedFileIds.includes(baselineFileId)) return undefined
  return choices.find((choice) =>
    choice.file.id === baselineFileId
    && choice.file.owner === 'mine'
    && choice.chunks.length > 0,
  )
}
