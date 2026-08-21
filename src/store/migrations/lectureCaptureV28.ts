import type { AppData, LectureRecord } from '@/lib/types'

/**
 * v28 adds course-owned lecture/evidence homes. Existing pasted transcripts
 * retain their original Material and SourceChunk records; when that provenance
 * is complete, we add a lightweight lecture record pointing back at it.
 */
export function migrateLectureCaptureV28(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data

  const hasHomes = Array.isArray(center.lectures)
    && Array.isArray(center.lectureFindings)
    && Array.isArray(center.lectureMaterialProposals)
    && Array.isArray(center.lectureNoteProposals)
  if (hasHomes) return data

  const existing = Array.isArray(center.lectures) ? center.lectures : []
  const existingFileIds = new Set(existing.map((lecture) => lecture.transcriptFileId).filter(Boolean))
  const backfilled: LectureRecord[] = center.files
    .filter((file) => file.type === 'transcript' && file.sourceType === 'paste' && !existingFileIds.has(file.id))
    .filter((file) => center.sourceChunks.some((chunk) => chunk.fileId === file.id && chunk.courseId === file.courseId))
    .map((file, index) => ({
      id: `lecture-from-${file.id}`,
      courseId: file.courseId,
      title: file.title,
      inputPath: 'pasted' as const,
      transcriptFileId: file.id,
      processingState: 'ready' as const,
      createdAt: file.createdAt,
      processedAt: file.updatedAt,
      updatedAt: file.updatedAt,
      order: existing.length + index,
    }))

  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: {
        ...center,
        lectures: [...existing, ...backfilled],
        lectureFindings: Array.isArray(center.lectureFindings) ? center.lectureFindings : [],
        lectureMaterialProposals: Array.isArray(center.lectureMaterialProposals) ? center.lectureMaterialProposals : [],
        lectureNoteProposals: Array.isArray(center.lectureNoteProposals) ? center.lectureNoteProposals : [],
      },
    },
  }
}
