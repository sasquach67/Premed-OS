import type {
  AcademicFile,
  ClassCenterData,
  GeneratedMasteryOutline,
  LectureBrief,
  LectureBriefTrace,
  LectureRecord,
  SourceChunk,
  Topic,
} from '@/lib/types'

const EMPHASIS = /\b(important|remember|exam|key|focus|takeaway|professor|notice)\b/i
const PROCESS = /\b(compare|contrast|versus|\bvs\.?\b|process|steps?|first|then|finally|leads? to|results? in)\b/i
const CAUTION = /\b(do not|don't|never|mistake|misconception|rather than|unlike|except|not the same)\b/i
const CONNECTION = /\b(connect|relationship|because|therefore|depends? on|links? to|causes?|allows?)\b/i
const PERFORMANCE = /\b(define|describe|distinguish|compare|contrast|trace|predict|identify|explain|calculate|solve|interpret|design|infer|label|state|use|choose|write|translate|track|build|diagnose|recognize)\b/i

function clean(value: string) {
  return value.replace(/^\s*(?:\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*)+/, '').replace(/\s+/g, ' ').trim()
}

function sentences(chunk: SourceChunk) {
  return clean(chunk.content).split(/(?<=[.!?])\s+/).map((text) => ({ text: text.trim(), chunk })).filter((item) => item.text.length >= 18)
}

function trace(item: { text: string; chunk: SourceChunk }, suffix: string): LectureBriefTrace {
  return { id: `${item.chunk.id}:${suffix}`, text: item.text, sourceChunkId: item.chunk.id }
}

function firstDistinct(items: Array<{ text: string; chunk: SourceChunk }>, count: number) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.text.toLocaleLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, count)
}

export function approximateLectureTitle(lectureNumber: number, text: string) {
  const candidate = clean(text).split(/\n|(?<=[.!?])\s+/).find((line) => line.length >= 8) ?? ''
  const words = candidate.replace(/[^\p{L}\p{N}\s'’-]/gu, ' ').split(/\s+/).filter(Boolean).slice(0, 7)
  const subject = words.join(' ').replace(/^(today|okay|so|um|welcome|lecture)\s+/i, '').trim()
  return `Lecture ${lectureNumber}${subject ? ` · ${subject.charAt(0).toUpperCase()}${subject.slice(1)}` : ''}`
}

export function buildLectureBrief(chunks: SourceChunk[], selectedSourceFileIds: string[], files: AcademicFile[], now = Date.now()): LectureBrief {
  const all = chunks.flatMap(sentences)
  const summary = firstDistinct(all, 3).map((item, index) => trace(item, `summary-${index}`))
  const by = (pattern: RegExp, key: string, count = 3) => firstDistinct(all.filter((item) => pattern.test(item.text)), count).map((item, index) => trace(item, `${key}-${index}`))
  const vocabularyCounts = new Map<string, number>()
  all.forEach(({ text }) => text.toLocaleLowerCase().match(/[a-z][a-z-]{5,}/g)?.forEach((word) => {
    if (!/^(because|before|between|during|should|through|without|lecture|student|important)$/.test(word)) vocabularyCounts.set(word, (vocabularyCounts.get(word) ?? 0) + 1)
  }))
  const vocabulary = [...vocabularyCounts.entries()].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6).flatMap(([term], index) => {
    const item = all.find((candidate) => candidate.text.toLocaleLowerCase().includes(term))
    return item ? [{ ...trace(item, `vocabulary-${index}`), term }] : []
  })
  const usedSourceFileIds = [...new Set([
    ...summary,
    ...by(CONNECTION, 'connection'),
    ...by(EMPHASIS, 'emphasis'),
    ...by(PROCESS, 'process'),
    ...by(CAUTION, 'caution'),
    ...vocabulary,
  ].map((item) => chunks.find((chunk) => chunk.id === item.sourceChunkId)?.fileId).filter((id): id is string => Boolean(id)))]
  const selected = selectedSourceFileIds.filter((id) => files.some((file) => file.id === id))
  return {
    summary,
    connections: by(CONNECTION, 'connection'),
    vocabulary,
    professorEmphasis: by(EMPHASIS, 'emphasis'),
    processesAndComparisons: by(PROCESS, 'process'),
    misconceptions: by(CAUTION, 'caution'),
    selectedSourceFileIds: selected,
    usedSourceFileIds,
    unusedSourceFileIds: selected.filter((id) => !usedSourceFileIds.includes(id)),
    createdAt: now,
  }
}

function topicChunks(topic: Topic, chunks: SourceChunk[], files: AcademicFile[]) {
  const linkedFiles = new Set(files.filter((file) => file.linkedTopicIds.includes(topic.id)).map((file) => file.id))
  return chunks.filter((chunk) => chunk.topicId === topic.id || linkedFiles.has(chunk.fileId))
}

function objectiveAction(title: string) {
  if (/\b(and|versus|vs\.?)\b/i.test(title)) return `Compare ${title.replace(/\s+(?:and|versus|vs\.?)\s+/i, ' with ')} using the distinctions supported by the selected sources.`
  if (/\b(mechanism|process|pathway|cycle|sequence)\b/i.test(title)) return `Reconstruct ${title} and predict what changes when a step or condition changes.`
  if (/\b(calculation|equation|quantitative|kinematics|energy|pka)\b/i.test(title)) return `Solve a source-aligned problem about ${title} without notes and explain each step.`
  return `Explain ${title} in your own words and use it to answer a source-aligned question without notes.`
}

function objectiveRecallCue(title: string) {
  const objective = title.replace(/[.!?]+$/, '').trim()
  if (/^(explain|reconstruct|draw|trace|compare|predict|describe|organize|outline|design|interpret|derive|label|map)\b/i.test(objective)) {
    return `Without notes, ${objective.charAt(0).toLocaleLowerCase()}${objective.slice(1)}.`
  }
  if (/\b(and|versus|vs\.?)\b/i.test(objective)) return `Without notes, compare ${objective.replace(/\s+(?:and|versus|vs\.?)\s+/i, ' with ')} and explain the source-supported distinction.`
  if (/\b(mechanism|process|pathway|cycle|sequence|transcription|translation)\b/i.test(objective)) return `Without notes, reconstruct ${objective} from start to finish and explain what happens at each step.`
  return `Without notes, explain ${objective} as a connected response using the relationships supported by the selected sources.`
}

export function buildLectureMasteryMap({ lecture, topics, chunks, files, now = Date.now() }: {
  lecture: LectureRecord
  topics: Topic[]
  chunks: SourceChunk[]
  files: AcademicFile[]
  now?: number
}): Omit<GeneratedMasteryOutline, 'id' | 'order'> | undefined {
  const selected = new Set(lecture.selectedSourceFileIds ?? [])
  const selectedFiles = files.filter((file) => selected.has(file.id))
  const selectedChunks = chunks.filter((chunk) => selected.has(chunk.fileId))
  const linkedTopicIds = new Set([
    ...(lecture.topicIds ?? []),
    ...selectedFiles.flatMap((file) => file.linkedTopicIds),
    ...selectedChunks.map((chunk) => chunk.topicId).filter((id): id is string => Boolean(id)),
  ])
  const standards = topics.filter((topic) => linkedTopicIds.has(topic.id)).flatMap((topic) => {
    const evidence = topicChunks(topic, selectedChunks, selectedFiles)
    if (!evidence.length) return []
    const evidenceSentences = evidence.flatMap(sentences)
    const performance = firstDistinct(evidenceSentences.filter((item) => PERFORMANCE.test(item.text)), 3).map((item) => item.text)
    const cautions = firstDistinct(evidenceSentences.filter((item) => CAUTION.test(item.text)), 2).map((item) => item.text)
    return [{
      id: topic.id,
      title: topic.title,
      freeRecallCues: [objectiveRecallCue(topic.title)],
      understand: firstDistinct(evidenceSentences, 4).map((item) => item.text),
      beAbleToDo: performance.length ? performance : [objectiveAction(topic.title)],
      watchFor: cautions.length ? cautions : ['No source-supported caution was found yet. Add notes or objectives that name the common trap.'],
      sourceChunkIds: [...new Set(evidence.map((chunk) => chunk.id))],
      masteryState: 'not-started' as const,
    }]
  })
  if (!standards.length) return undefined
  return {
    courseId: lecture.courseId,
    lectureId: lecture.id,
    scope: 'lecture',
    scopeId: lecture.id,
    title: `${lecture.title} Mastery Map`,
    unit: lecture.title,
    specId: 'unit-mastery-outline-v1',
    specHash: 'lecture-workspace-local-v1',
    standards,
    sourceChunkIds: [...new Set(standards.flatMap((standard) => standard.sourceChunkIds))],
    createdAt: now,
    updatedAt: now,
  }
}

export function fileCoverageLabel(file: AcademicFile, chunkCount: number) {
  const coverage = file.sourceCoverage
  if (!coverage) return chunkCount ? `${chunkCount} readable ${chunkCount === 1 ? 'passage' : 'passages'}` : 'No readable text yet'
  if (coverage.pageCount) {
    const readable = coverage.readablePages?.length ?? 0
    const unreadable = coverage.unreadablePages?.length ?? 0
    const ocr = coverage.ocrRecoveredPages?.length ?? 0
    return `${readable}/${coverage.pageCount} pages readable${ocr ? ` · ${ocr} recovered with on-device OCR` : ''}${unreadable ? ` · ${unreadable} unreadable` : ''}`
  }
  return coverage.readableCharacterCount ? `${coverage.readableCharacterCount.toLocaleString()} readable characters` : 'No readable text yet'
}

export function sourceChunksForLecture(center: Pick<ClassCenterData, 'sourceChunks'>, lecture: LectureRecord) {
  const selected = new Set(lecture.selectedSourceFileIds ?? (lecture.transcriptFileId ? [lecture.transcriptFileId] : []))
  return center.sourceChunks.filter((chunk) => selected.has(chunk.fileId) && Boolean(chunk.content.trim()))
}
