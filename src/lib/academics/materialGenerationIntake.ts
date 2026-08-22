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
