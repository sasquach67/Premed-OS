import { uid } from '@/lib/id'
import type {
  ClassCenterData, GuideProposal, GuideSourceReference,
  LectureEvidenceFinding,
} from '@/lib/types'
import type { SyllabusItem } from '@/lib/academics/syllabusParser'

export type GuideActionOutcome = { ok: true; id: string } | { ok: false; reason: string }

/** Retains only reviewed syllabus language as ordinary local source chunks.
 * Manual rows have no source passage and are intentionally excluded. */
export function persistConfirmedSyllabusEvidence(center: ClassCenterData, courseId: string, fileId: string | undefined, items: SyllabusItem[], now = Date.now()): number {
  if (!fileId || !center.files.some((file) => file.id === fileId && file.courseId === courseId && file.type === 'syllabus')) return 0
  let added = 0
  for (const item of items) {
    const passage = item.evidence.quote.trim()
    if (!passage || passage === 'Added manually') continue
    const id = `syllabus-evidence-${fileId}-${item.kind}-${item.id}`
    const existing = center.sourceChunks.find((chunk) => chunk.id === id && chunk.courseId === courseId)
    if (existing) {
      existing.content = passage
      existing.sourcePosition = { index: existing.sourcePosition?.index ?? center.sourceChunks.filter((chunk) => chunk.fileId === fileId).length, label: item.evidence.location }
      existing.updatedAt = now
      continue
    }
    center.sourceChunks.push({
      id, fileId, courseId, content: passage,
      sourcePosition: { index: center.sourceChunks.filter((chunk) => chunk.fileId === fileId).length, label: item.evidence.location },
      assignmentMethod: 'document-topic', assignmentConfirmed: true, coveredByKeyPoint: false,
      createdAt: now, updatedAt: now, order: center.sourceChunks.length,
    })
    added += 1
  }
  return added
}

export function guideProposalsForCourse(center: ClassCenterData, courseId: string, status?: GuideProposal['status']) {
  return center.guideProposals
    .filter((proposal) => proposal.courseId === courseId && (!status || proposal.status === status))
    .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt)
}

export function isGuideSourceValid(center: ClassCenterData, courseId: string, source: GuideSourceReference): boolean {
  if (source.courseId !== courseId || !source.sourceId || !source.sourceRecordId || !source.sourcePassage.trim()) return false
  if (source.sourceFileId && !center.files.some((file) => file.id === source.sourceFileId && file.courseId === courseId)) return false
  if (source.sourceChunkId) {
    const chunk = center.sourceChunks.find((item) => item.id === source.sourceChunkId && item.courseId === courseId)
    if (!chunk || !chunk.content.includes(source.sourcePassage)) return false
  }

  if (source.sourceRecordKind === 'lecture-finding') {
    const finding = center.lectureFindings.find((item) => item.id === source.sourceRecordId && item.courseId === courseId)
    return Boolean(finding
      && finding.lectureId === source.sourceId
      && finding.quote === source.sourcePassage
      && (!source.sourceChunkId || finding.sourceChunkId === source.sourceChunkId))
  }
  if (source.sourceRecordKind === 'assignment') {
    const assignment = center.assignments.find((item) => item.id === source.sourceRecordId && item.courseId === courseId)
    return Boolean(assignment?.notes?.includes(source.sourcePassage))
  }
  const category = center.gradeCategories.find((item) => item.id === source.sourceRecordId && item.courseId === courseId)
  return Boolean(category?.source?.includes(source.sourcePassage))
}

export function buildLectureGuideProposal({
  center, courseId, lectureId, finding, id = uid(), now = Date.now(),
}: {
  center: ClassCenterData
  courseId: string
  lectureId: string
  finding: LectureEvidenceFinding
  id?: string
  now?: number
}): GuideProposal | null {
  const lecture = center.lectures.find((item) => item.id === lectureId && item.courseId === courseId)
  const chunk = center.sourceChunks.find((item) => item.id === finding.sourceChunkId && item.courseId === courseId)
  if (!lecture || finding.courseId !== courseId || finding.lectureId !== lectureId || !chunk || !chunk.content.includes(finding.quote)) return null
  return {
    id,
    courseId,
    source: {
      courseId,
      sourceKind: 'lecture',
      sourceId: lecture.id,
      sourceRecordKind: 'lecture-finding',
      sourceRecordId: finding.id,
      sourceFileId: lecture.transcriptFileId ?? chunk.fileId,
      sourceChunkId: chunk.id,
      sourceLabel: lecture.title,
      sourcePassage: finding.quote,
      sourceLocation: finding.timestamp,
    },
    draftTitle: `Professor remark: ${finding.label}`,
    draftText: finding.detail,
    noteType: 'lecture',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    order: center.guideProposals.filter((item) => item.courseId === courseId).length,
  }
}

function stampedSource(value?: string): { location: string; passage: string } | null {
  const match = value?.match(/^Source:\s*(.*?)\s+—\s+[“"]([\s\S]+?)[”"]\s*$/)
  return match ? { location: match[1].trim(), passage: match[2].trim() } : null
}

/** Confirmed syllabus exam records are the only existing syllabus rows whose
 * source passage survives import. Unsourced topics/schedule rows are excluded. */
export function buildSyllabusGuideProposals(center: ClassCenterData, courseId: string, now = Date.now()): GuideProposal[] {
  const syllabusFile = center.files.find((file) => file.courseId === courseId && file.type === 'syllabus')
  if (!syllabusFile) return []
  return center.assignments
    .filter((assignment) => assignment.courseId === courseId && assignment.type === 'exam')
    .flatMap((assignment) => {
      const evidence = stampedSource(assignment.notes)
      if (!evidence) return []
      const source: GuideSourceReference = {
        courseId,
        sourceKind: 'syllabus',
        sourceId: syllabusFile.id,
        sourceRecordKind: 'assignment',
        sourceRecordId: assignment.id,
        sourceFileId: syllabusFile.id,
        sourceChunkId: center.sourceChunks.find((chunk) => chunk.courseId === courseId && chunk.fileId === syllabusFile.id && chunk.content.includes(evidence.passage))?.id,
        sourceLabel: `Syllabus · ${assignment.title}`,
        sourcePassage: evidence.passage,
        sourceLocation: evidence.location,
      }
      return [{
        id: `guide-syllabus-assignment-${assignment.id}`,
        courseId,
        source,
        draftTitle: `Exam intel: ${assignment.title}`,
        draftText: evidence.passage,
        noteType: 'exam-review' as const,
        status: 'pending' as const,
        createdAt: now,
        updatedAt: now,
        order: center.guideProposals.filter((item) => item.courseId === courseId).length,
      }]
    })
}

export function ensureSyllabusGuideProposals(center: ClassCenterData, courseId: string, now = Date.now()): number {
  const known = new Set(center.guideProposals.map((item) => `${item.source.sourceRecordKind}:${item.source.sourceRecordId}`))
  const additions = buildSyllabusGuideProposals(center, courseId, now)
    .filter((item) => !known.has(`${item.source.sourceRecordKind}:${item.source.sourceRecordId}`))
  center.guideProposals.push(...additions)
  return additions.length
}

export function editGuideProposal(center: ClassCenterData, courseId: string, proposalId: string, draft: { title: string; text: string }, now = Date.now()): GuideActionOutcome {
  const proposal = center.guideProposals.find((item) => item.id === proposalId && item.courseId === courseId)
  if (!proposal) return { ok: false, reason: 'Guide suggestion not found for this class.' }
  if (proposal.status !== 'pending') return { ok: false, reason: 'Only pending Guide suggestions can be edited.' }
  proposal.draftTitle = draft.title
  proposal.draftText = draft.text
  proposal.updatedAt = now
  return { ok: true, id: proposal.id }
}

export function dismissGuideProposal(center: ClassCenterData, courseId: string, proposalId: string, now = Date.now()): GuideActionOutcome {
  const proposal = center.guideProposals.find((item) => item.id === proposalId && item.courseId === courseId)
  if (!proposal) return { ok: false, reason: 'Guide suggestion not found for this class.' }
  if (proposal.status !== 'pending') return { ok: false, reason: 'Only pending Guide suggestions can be dismissed.' }
  proposal.status = 'dismissed'
  proposal.updatedAt = now
  return { ok: true, id: proposal.id }
}

export function acceptGuideProposal(center: ClassCenterData, courseId: string, proposalId: string, now = Date.now(), noteId = uid()): GuideActionOutcome {
  const proposal = center.guideProposals.find((item) => item.id === proposalId && item.courseId === courseId)
  if (!proposal) return { ok: false, reason: 'Guide suggestion not found for this class.' }
  if (proposal.status !== 'pending') return { ok: false, reason: 'Only pending Guide suggestions can be accepted.' }
  if (!proposal.draftTitle.trim() || !proposal.draftText.trim()) return { ok: false, reason: 'Review the title and note text before saving.' }
  if (!isGuideSourceValid(center, courseId, proposal.source)) return { ok: false, reason: 'The supporting course evidence is missing or changed. Review the source before saving.' }
  center.notes.unshift({
    id: noteId,
    courseId,
    title: proposal.draftTitle.trim(),
    type: proposal.noteType,
    kind: 'about-class',
    date: new Date(now).toISOString().slice(0, 10),
    unit: '',
    topicIds: [],
    content: proposal.draftText.trim(),
    syncStatus: 'local-only',
    linkedFileIds: proposal.source.sourceFileId ? [proposal.source.sourceFileId] : [],
    guideProposalId: proposal.id,
    guideSourceRefs: [{ ...proposal.source }],
    createdAt: now,
    updatedAt: now,
    order: center.notes.length,
  })
  proposal.status = 'accepted'
  proposal.acceptedNoteId = noteId
  proposal.updatedAt = now
  return { ok: true, id: noteId }
}
