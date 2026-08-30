import type { AppData, GuideProposal } from '@/lib/types'

/**
 * v37 generalizes the old lecture-only note proposal without deleting it.
 * The legacy array remains byte-for-byte available for backup compatibility;
 * current consumers read `guideProposals` as the single forward contract.
 */
export function migrateGuideProposalsV37(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data
  const hasProposals = Array.isArray(center.guideProposals)
  if (hasProposals) return data

  const legacy = Array.isArray(center.lectureNoteProposals) ? center.lectureNoteProposals : []
  const migrated: GuideProposal[] = hasProposals ? center.guideProposals : legacy.map((proposal) => {
    const finding = center.lectureFindings?.find((item) => item.id === proposal.findingId && item.courseId === proposal.courseId)
    const lecture = center.lectures?.find((item) => item.id === proposal.lectureId && item.courseId === proposal.courseId)
    const chunk = finding ? center.sourceChunks?.find((item) => item.id === finding.sourceChunkId && item.courseId === proposal.courseId) : undefined
    return {
      id: proposal.id,
      courseId: proposal.courseId,
      source: {
        courseId: proposal.courseId,
        sourceKind: 'lecture' as const,
        sourceId: proposal.lectureId,
        sourceRecordKind: 'lecture-finding' as const,
        sourceRecordId: proposal.findingId,
        sourceFileId: lecture?.transcriptFileId ?? chunk?.fileId,
        sourceChunkId: finding?.sourceChunkId,
        sourceLabel: lecture?.title || 'Lecture transcript',
        sourcePassage: finding?.quote ?? '',
        sourceLocation: finding?.timestamp,
      },
      draftTitle: finding ? `Professor remark: ${finding.label}` : '',
      draftText: finding?.detail ?? '',
      noteType: 'lecture' as const,
      status: proposal.status,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
      order: proposal.order,
    }
  })

  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: {
        ...center,
        guideProposals: migrated,
      },
    },
  }
}
