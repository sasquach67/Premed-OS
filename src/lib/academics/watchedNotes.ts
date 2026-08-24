import type {
  AcademicFile, ClassCenterData, Course, WatchedNoteCategory, WatchedNoteMapping,
  WatchedNoteMappingConfidence, WatchedNoteProposal, WatchedNoteSource,
} from '@/lib/types'
import { uid } from '@/lib/id'

/** Metadata-only row supplied by a selected local or future provider folder. */
export interface WatchedNotesManifestEntry {
  displayPath: string
  displayName?: string
  mimeType?: string
  modifiedAt?: number
  sizeBytes?: number
  /** A caller may provide a content/remote revision identity without exposing a URL or token. */
  contentIdentity?: string
}

export interface WatchedNotesSourceInput {
  id?: string
  provider: WatchedNoteSource['provider']
  rootLabel: string
  courseId?: string
  reviewEachImport?: boolean
  selectedAt?: number
}

export interface WatchedNotesPlacement {
  courseId?: string
  week?: string
  category?: WatchedNoteCategory
  confidence: WatchedNoteMappingConfidence
  reason: string
}

export interface WatchedNotesIntakeResult {
  created: WatchedNoteProposal[]
  reused: WatchedNoteProposal[]
  skippedInvalid: number
}

const CATEGORY_BY_LEVEL: Record<string, WatchedNoteCategory> = {
  notes: 'notes',
  homework: 'homework',
  'practice problems': 'practice-problems',
  'practice-problems': 'practice-problems',
}

function normalized(value: string | undefined) {
  return (value ?? '').trim().replace(/\\+/g, '/').replace(/\s+/g, ' ').toLocaleLowerCase()
}

function cleanDisplayPath(value: string | undefined) {
  const raw = (value ?? '').replace(/\0/g, '').trim()
  // A selected-folder importer must provide a path relative to the chosen
  // root. Refusing absolute and parent-traversal paths prevents a caller from
  // accidentally serialising a machine path into localStorage.
  if (/^(?:[a-z]:[\\/]|[\\/]|~[\\/])/i.test(raw)) return ''
  const path = raw.replace(/\\+/g, '/').replace(/^\/+|\/+$/g, '')
  return path.split('/').some((level) => level === '..') ? '' : path
}

function displayName(entry: WatchedNotesManifestEntry) {
  const explicit = entry.displayName?.trim()
  if (explicit) return explicit
  const path = cleanDisplayPath(entry.displayPath)
  return path.split('/').at(-1) ?? ''
}

function pathLevels(entry: WatchedNotesManifestEntry) {
  const path = cleanDisplayPath(entry.displayPath)
  const levels = path.split('/').filter(Boolean)
  // The final path segment is the file's display name, not a mapping level.
  return levels.slice(0, -1)
}

function courseForLevel(level: string, courses: readonly Course[]) {
  const candidate = normalized(level)
  return courses.find((course) => candidate === normalized(course.code) || candidate === normalized(course.title))
}

function weekForLevel(level: string) {
  const match = level.trim().match(/^(?:week|wk|w)\s*(\d+)$/i)
  return match ? `Week ${Number(match[1])}` : undefined
}

function confirmedMapping(level: string, mappings: readonly WatchedNoteMapping[]) {
  const key = normalized(level)
  return mappings.find((mapping) => normalized(mapping.logicalLevel) === key)
}

function sourceIdentity(entry: WatchedNotesManifestEntry, name: string) {
  if (entry.contentIdentity?.trim()) return `content:${entry.contentIdentity.trim()}`
  if (entry.modifiedAt != null || entry.sizeBytes != null) return `metadata:${normalized(name)}|${entry.modifiedAt ?? ''}|${entry.sizeBytes ?? ''}`
  return undefined
}

function stableKey(sourceId: string, path: string, identity?: string) {
  return `${sourceId}:${normalized(path)}:${identity ?? 'path-only'}`
}

/**
 * Maps only explicit folder labels. It never fabricates a week: any unknown
 * folder level or missing week returns a recovery state for student review.
 */
export function mapWatchedNotesEntry({
  entry, source, courses,
}: {
  entry: WatchedNotesManifestEntry
  source: WatchedNoteSource
  courses: readonly Course[]
}): WatchedNotesPlacement {
  const levels = pathLevels(entry)
  let courseId = source.courseId
  let week: string | undefined
  let category: WatchedNoteCategory | undefined
  const reasons: string[] = []
  let hasUnrecognisedLevel = false
  let reusedConfirmedMapping = false

  for (const level of levels) {
    const mapping = confirmedMapping(level, source.confirmedMappings)
    if (mapping) {
      courseId = mapping.courseId ?? courseId
      week = mapping.week ?? week
      category = mapping.category ?? category
      reusedConfirmedMapping = true
      reasons.push(`Reused your confirmed “${level.trim()}” mapping.`)
      continue
    }

    const course = courseForLevel(level, courses)
    if (course) {
      courseId = course.id
      reasons.push(`Matched enrolled course “${course.code}”.`)
      continue
    }

    const foundWeek = weekForLevel(level)
    if (foundWeek) {
      week = foundWeek
      reasons.push(`Matched ${foundWeek}.`)
      continue
    }

    const foundCategory = CATEGORY_BY_LEVEL[normalized(level)]
    if (foundCategory) {
      category = foundCategory
      reasons.push(`Matched ${foundCategory.replace(/-/g, ' ')} folder.`)
      continue
    }

    hasUnrecognisedLevel = true
    reasons.push(`“${level.trim()}” needs confirmation.`)
  }

  if (!courseId) reasons.push('No enrolled course was matched.')
  if (!week) reasons.push('Confirm the week before filing this material.')
  const confidence: WatchedNoteMappingConfidence = hasUnrecognisedLevel || !courseId || !week
    ? 'needs-confirmation'
    : reusedConfirmedMapping ? 'confirmed' : 'inferred'

  return {
    courseId,
    week,
    category,
    confidence,
    reason: reasons.join(' '),
  }
}

/** Adds a source record; callers pass only a human-facing root label. */
export function addWatchedNotesSource(center: ClassCenterData, input: WatchedNotesSourceInput): WatchedNoteSource | undefined {
  const rootLabel = input.rootLabel.trim()
  if (!rootLabel) return undefined
  const now = input.selectedAt ?? Date.now()
  const source: WatchedNoteSource = {
    id: input.id ?? uid(),
    provider: input.provider,
    rootLabel,
    courseId: input.courseId,
    selectedAt: now,
    reviewEachImport: input.reviewEachImport ?? true,
    confirmedMappings: [],
    createdAt: now,
    updatedAt: now,
  }
  const index = center.watchedNoteSources.findIndex((item) => item.id === source.id)
  if (index >= 0) center.watchedNoteSources[index] = source
  else center.watchedNoteSources.push(source)
  return source
}

/** Confirming a mapping is deliberately exact-level only; it cannot create a broad wildcard rule. */
export function confirmWatchedNotesMapping({
  center, sourceId, mapping, now = Date.now(),
}: {
  center: ClassCenterData
  sourceId: string
  mapping: Omit<WatchedNoteMapping, 'id' | 'confirmedAt'>
  now?: number
}): WatchedNoteMapping | undefined {
  const source = center.watchedNoteSources.find((item) => item.id === sourceId)
  const logicalLevel = mapping.logicalLevel.trim()
  if (!source || !logicalLevel || (!mapping.courseId && !mapping.week && !mapping.category)) return undefined
  const next: WatchedNoteMapping = { ...mapping, id: uid(), logicalLevel, confirmedAt: now }
  const existingIndex = source.confirmedMappings.findIndex((item) => normalized(item.logicalLevel) === normalized(logicalLevel))
  if (existingIndex >= 0) source.confirmedMappings[existingIndex] = { ...source.confirmedMappings[existingIndex], ...next, id: source.confirmedMappings[existingIndex].id }
  else source.confirmedMappings.push(next)
  source.updatedAt = now
  return existingIndex >= 0 ? source.confirmedMappings[existingIndex] : next
}

/**
 * Saves an import preview only. The caller must use `acceptWatchedNotesProposal`
 * before a new AcademicFile appears in the course material collection.
 */
export function intakeWatchedNotesManifest({
  center, sourceId, entries, courses, now = Date.now(),
}: {
  center: ClassCenterData
  sourceId: string
  entries: readonly WatchedNotesManifestEntry[]
  courses: readonly Course[]
  now?: number
}): WatchedNotesIntakeResult {
  const source = center.watchedNoteSources.find((item) => item.id === sourceId)
  if (!source) return { created: [], reused: [], skippedInvalid: entries.length }
  const created: WatchedNoteProposal[] = []
  const reused: WatchedNoteProposal[] = []
  let skippedInvalid = 0

  for (const entry of entries) {
    const path = cleanDisplayPath(entry.displayPath)
    const name = displayName(entry)
    if (!path || !name) {
      skippedInvalid += 1
      continue
    }
    const identity = sourceIdentity(entry, name)
    const key = stableKey(sourceId, path, identity)
    const sameKey = center.watchedNoteProposals.find((proposal) => proposal.stableKey === key)
    const sameIdentity = identity
      ? center.watchedNoteProposals.filter((proposal) => proposal.sourceId === sourceId && proposal.sourceIdentity === identity)
      : []
    const existing = sameKey ?? (sameIdentity.length === 1 ? sameIdentity[0] : undefined)
    if (existing) {
      reused.push(existing)
      continue
    }
    const placement = mapWatchedNotesEntry({ entry: { ...entry, displayPath: path, displayName: name }, source, courses })
    const proposal: WatchedNoteProposal = {
      id: uid(), sourceId, stableKey: key, displayPath: path, displayName: name,
      mimeType: entry.mimeType, modifiedAt: entry.modifiedAt, sizeBytes: entry.sizeBytes, sourceIdentity: identity,
      proposedCourseId: placement.courseId, proposedWeek: placement.week, proposedCategory: placement.category,
      mappingConfidence: placement.confidence, mappingReason: placement.reason,
      status: 'pending', createdAt: now, updatedAt: now,
    }
    center.watchedNoteProposals.push(proposal)
    created.push(proposal)
  }
  source.updatedAt = now
  return { created, reused, skippedInvalid }
}

/** Converts exactly one reviewed proposal into one owned material. Nothing existing is patched. */
export function acceptWatchedNotesProposal({
  center, proposalId, courseId, now = Date.now(),
}: {
  center: ClassCenterData
  proposalId: string
  /** Required when the manifest could not name a course. */
  courseId?: string
  now?: number
}): AcademicFile | undefined {
  const proposal = center.watchedNoteProposals.find((item) => item.id === proposalId)
  if (!proposal || proposal.status === 'skipped') return undefined
  if (proposal.acceptedFileId) return center.files.find((file) => file.id === proposal.acceptedFileId)
  const targetCourseId = courseId ?? proposal.proposedCourseId
  if (!targetCourseId) return undefined

  const file: AcademicFile = {
    id: uid(),
    courseId: targetCourseId,
    sourceType: 'folder-intake',
    title: proposal.displayName.replace(/\.[^.]+$/, '') || proposal.displayName,
    type: 'other',
    fileName: proposal.displayName,
    mimeType: proposal.mimeType,
    owner: 'mine',
    linkedTopicIds: [],
    processingStatus: 'pending',
    notes: `Selected folder import · ${proposal.proposedCategory?.replace(/-/g, ' ') ?? 'uncategorized'} · ${proposal.proposedWeek ?? 'confirm week'} · metadata only until you attach the file`,
    folderIntake: {
      sourceId: proposal.sourceId,
      proposalId: proposal.id,
      displayPath: proposal.displayPath,
      category: proposal.proposedCategory,
      week: proposal.proposedWeek,
      placementState: proposal.proposedWeek ? 'confirmed' : 'confirm-week',
    },
    createdAt: now,
    updatedAt: now,
    order: center.files.filter((item) => item.courseId === targetCourseId).length,
  }
  center.files.push(file)
  proposal.status = 'accepted'
  proposal.acceptedFileId = file.id
  proposal.updatedAt = now
  return file
}

/** A skipped proposal is history, not a delete operation. */
export function skipWatchedNotesProposal(center: ClassCenterData, proposalId: string, now = Date.now()) {
  const proposal = center.watchedNoteProposals.find((item) => item.id === proposalId)
  if (!proposal || proposal.status === 'accepted') return false
  proposal.status = 'skipped'
  proposal.updatedAt = now
  return true
}
