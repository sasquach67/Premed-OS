import type {
  AcademicFile, ChunkAssignmentMethod, ClassCenterData, KeyPoint, SourceChunk, Topic,
} from '@/lib/types'

export interface CoverageItem {
  chunk: SourceChunk
  file?: AcademicFile
}

export interface CourseCoverage {
  totalChunks: number
  mappedChunks: number
  mappedPercent: number
  unassigned: CoverageItem[]
  uncovered: CoverageItem[]
  unprocessedFiles: AcademicFile[]
  neverReviewed: KeyPoint[]
}

export interface ChunkAssignmentProposal {
  chunkId: string
  topicId?: string
  newTopicTitle?: string
  method: Exclude<ChunkAssignmentMethod, 'manual' | 'pending'>
  reason: string
  requiresConfirmation: true
}

export function calculateCourseCoverage(
  courseId: string,
  data: Pick<ClassCenterData, 'files' | 'sourceChunks' | 'keyPoints' | 'topics'>,
): CourseCoverage {
  const files = data.files.filter((file) => file.courseId === courseId)
  const fileById = new Map(files.map((file) => [file.id, file]))
  const chunks = data.sourceChunks.filter((chunk) => chunk.courseId === courseId)
  const topicIds = new Set(data.topics.filter((topic) => topic.courseId === courseId).map((topic) => topic.id))
  const points = data.keyPoints.filter((point) => topicIds.has(point.topicId))
  const claimedChunkIds = new Set(points.flatMap((point) => point.sourceChunkIds))
  const item = (chunk: SourceChunk): CoverageItem => ({ chunk, file: fileById.get(chunk.fileId) })
  const isConfirmed = (chunk: SourceChunk) => Boolean(chunk.topicId) && chunk.assignmentConfirmed !== false
  const mappedChunks = chunks.filter(isConfirmed).length

  return {
    totalChunks: chunks.length,
    mappedChunks,
    mappedPercent: chunks.length ? Math.round((mappedChunks / chunks.length) * 100) : 0,
    unassigned: chunks.filter((chunk) => !isConfirmed(chunk)).map(item),
    uncovered: chunks.filter((chunk) => !claimedChunkIds.has(chunk.id)).map(item),
    unprocessedFiles: files.filter((file) => !chunks.some((chunk) => chunk.fileId === file.id)),
    neverReviewed: points.filter((point) => point.timesSurfaced === 0).sort((a, b) => a.order - b.order),
  }
}

/** Produces a proposal only. Persisting it requires an explicit user action. */
export function proposeChunkAssignment(input: {
  chunk: SourceChunk
  file?: AcademicFile
  semanticTopic?: Topic
  positionalTopic?: Topic
}): ChunkAssignmentProposal {
  if (input.semanticTopic) {
    return {
      chunkId: input.chunk.id,
      topicId: input.semanticTopic.id,
      method: 'semantic',
      reason: `The content matches ${input.semanticTopic.title}.`,
      requiresConfirmation: true,
    }
  }
  if (input.positionalTopic) {
    return {
      chunkId: input.chunk.id,
      topicId: input.positionalTopic.id,
      method: 'positional',
      reason: `${input.chunk.sourcePosition?.label ?? 'Document position'} maps to ${input.positionalTopic.title}.`,
      requiresConfirmation: true,
    }
  }
  return {
    chunkId: input.chunk.id,
    newTopicTitle: input.file?.title || 'Untitled document',
    method: 'document-topic',
    reason: 'No unambiguous syllabus position or topic match exists; keep this document isolated.',
    requiresConfirmation: true,
  }
}
