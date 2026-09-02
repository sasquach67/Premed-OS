import type { AppData } from '@/lib/types'

/** v41 completes legacy lecture homes without rewriting their source records.
 * Existing Study Outline notes remain readable; new UI routes creation to the
 * unified Mastery Map instead of deleting user work. */
export function migrateLectureWorkspaceV41(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data
  let changed = false
  const lectures = center.lectures.map((lecture) => {
    if (lecture.workspaceState || lecture.selectedSourceFileIds) return lecture
    changed = true
    const selectedSourceFileIds = center.files
      .filter((file) => file.lectureId === lecture.id && file.processingStatus === 'ready')
      .map((file) => file.id)
    return {
      ...lecture,
      workspaceState: lecture.transcriptFileId ? 'complete' as const : 'draft' as const,
      selectedSourceFileIds: selectedSourceFileIds.length
        ? selectedSourceFileIds
        : lecture.transcriptFileId ? [lecture.transcriptFileId] : [],
    }
  })
  const generatedMasteryOutlines = center.generatedMasteryOutlines.map((outline) => {
    if (outline.scope) return outline
    changed = true
    return { ...outline, scope: 'unit' as const }
  })
  if (!changed) return data
  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: { ...center, lectures, generatedMasteryOutlines },
    },
  }
}
