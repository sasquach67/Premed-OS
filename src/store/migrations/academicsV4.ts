import type {
  AcademicFile,
  AcademicMigrationJournalEntry,
  AppData,
  ClassCenterData,
  ClassWorkspace,
  Course,
  Topic,
  TopicStatus,
} from '@/lib/types'
import { createTopicFsrsState } from '@/lib/academics/fsrs'

type UnknownRecord = Record<string, unknown>
type LegacyWorkspace = UnknownRecord & {
  id: string
  courseCode?: string
  courseTitle?: string
  semester?: string
}

export type AcademicMigrationResolution =
  | { type: 'confirm-term'; term: string }
  | { type: 'link'; courseId: string }
  | { type: 'create'; code: string; title: string; term: string }
  | { type: 'journal-only' }

const RELATED_KEYS = [
  'topics',
  'notes',
  'assignments',
  'files',
  'contacts',
  'weakAreas',
  'practiceExams',
  'practiceQuestions',
] as const

function compactWhitespace(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}

export function normalizeCourseCodes(value: unknown): string[] {
  const prepared = compactWhitespace(value)
    .toUpperCase()
    .replace(/[–—]/g, '-')
    .replace(/\bCROSS[\s-]*LISTED\s+(?:WITH|AS)\b/g, '/')
    .replace(/\s+(?:AND|&)\s+/g, '/')
    .replace(/[;,]+/g, '/')

  const out: string[] = []
  let inheritedPrefix = ''
  for (const rawPart of prepared.split('/')) {
    const part = rawPart.trim()
    const full = part.match(/([A-Z]{2,10})\s*-?\s*(\d{1,4}[A-Z]*)/)
    const inherited = !full && inheritedPrefix ? part.match(/^(\d{1,4}[A-Z]*)$/) : null
    if (full) {
      inheritedPrefix = full[1]
      out.push(`${full[1]} ${full[2]}`)
    } else if (inherited) {
      out.push(`${inheritedPrefix} ${inherited[1]}`)
    }
  }
  return [...new Set(out)]
}

export function normalizeAcademicTerm(value: unknown): string {
  return compactWhitespace(value).toLowerCase()
}

export function inferAcademicTerm(now: Date | number = Date.now()): string {
  const date = now instanceof Date ? now : new Date(now)
  const month = date.getMonth() + 1
  const season = month <= 5 ? 'Spring' : month <= 7 ? 'Summer' : 'Fall'
  return `${season} ${date.getFullYear()}`
}

function journalId(kind: string, subject: string) {
  return `academics-v4:${kind}:${subject}`
}

function addJournal(
  journal: AcademicMigrationJournalEntry[],
  entry: Omit<AcademicMigrationJournalEntry, 'id'> & { id?: string },
) {
  const id = entry.id ?? journalId(entry.kind, entry.legacyWorkspaceId ?? entry.courseId ?? entry.inferredTerm ?? 'term')
  if (!journal.some((item) => item.id === id)) journal.push({ ...entry, id })
}

function courseMatches(workspace: LegacyWorkspace, course: Course): boolean {
  if (normalizeAcademicTerm(workspace.semester) !== normalizeAcademicTerm(course.term)) return false
  const workspaceCodes = normalizeCourseCodes(workspace.courseCode)
  const courseCodes = normalizeCourseCodes(course.code)
  return workspaceCodes.some((code) => courseCodes.includes(code))
}

function courseFromWorkspace(workspace: LegacyWorkspace, order: number): Course {
  const normalized = normalizeCourseCodes(workspace.courseCode)
  return {
    id: `course-from-${workspace.id}`,
    term: compactWhitespace(workspace.semester),
    code: compactWhitespace(workspace.courseCode) || normalized[0] || 'Course',
    title: compactWhitespace(workspace.courseTitle) || compactWhitespace(workspace.courseCode) || 'Imported course',
    credits: 0,
    grade: '',
    bcpm: false,
    status: 'planned',
    inResidence: true,
    satisfies: [],
    notes: 'Created from a legacy Class Center workspace during the Academics v4 migration.',
    order,
  }
}

function workspaceFromLegacy(workspace: LegacyWorkspace, courseId: string): ClassWorkspace {
  return {
    id: workspace.id,
    courseId,
    nickname: compactWhitespace(workspace.nickname) || undefined,
    instructor: compactWhitespace(workspace.instructor) || undefined,
    meetingDays: compactWhitespace(workspace.meetingDays) || undefined,
    meetingTime: compactWhitespace(workspace.meetingTime) || undefined,
    location: compactWhitespace(workspace.location) || undefined,
    color: (workspace.color as ClassWorkspace['color']) ?? 'blue',
    icon: compactWhitespace(workspace.icon) || 'book',
    type: 'stem',
    background: compactWhitespace(workspace.background) || undefined,
    status: workspace.status === 'archived' ? 'archived' : 'active',
    currentTopicId: compactWhitespace(workspace.currentTopicId) || undefined,
    syllabusUrl: compactWhitespace(workspace.syllabusUrl) || undefined,
    canvasUrl: compactWhitespace(workspace.canvasUrl) || undefined,
    driveFolderUrl: compactWhitespace(workspace.driveFolderUrl) || undefined,
    goodNotesUrl: compactWhitespace(workspace.goodNotesUrl) || undefined,
    ankiDeckName: compactWhitespace(workspace.ankiDeckName) || undefined,
    notesDocUrl: compactWhitespace(workspace.notesDocUrl) || undefined,
    createdAt: Number(workspace.createdAt) || Date.now(),
    updatedAt: Number(workspace.updatedAt) || Date.now(),
    order: Number(workspace.order) || 0,
  }
}

function emptyWorkspace(courseId: string, order: number, now: number): ClassWorkspace {
  return {
    id: `workspace-${courseId}`,
    courseId,
    color: 'blue',
    icon: 'book',
    type: 'stem',
    status: 'active',
    createdAt: now,
    updatedAt: now,
    order,
  }
}

function legacyRelatedRecords(data: UnknownRecord, workspaceId: string): Record<string, unknown[]> {
  const out: Record<string, unknown[]> = {}
  for (const key of RELATED_KEYS) {
    const rows = Array.isArray(data[key]) ? data[key] as UnknownRecord[] : []
    const related = rows.filter((row) => row.classId === workspaceId)
    if (related.length) out[key] = related.map((row) => ({ ...row }))
  }
  return out
}

function migrateRelatedRows(
  legacy: UnknownRecord,
  workspaceToCourse: Map<string, string>,
  unresolvedWorkspaceIds: Set<string>,
  now: number,
): Omit<ClassCenterData, 'workspaces' | 'keyPoints' | 'sourceChunks' | 'reviewEvents'> {
  const mapRows = (key: typeof RELATED_KEYS[number]) => {
    const rows = Array.isArray(legacy[key]) ? legacy[key] as UnknownRecord[] : []
    return rows
      .filter((row) => !unresolvedWorkspaceIds.has(String(row.classId ?? '')))
      .map((row) => {
        if (row.courseId) return { ...row } as UnknownRecord
        const courseId = workspaceToCourse.get(String(row.classId ?? ''))
        const next: UnknownRecord = { ...row, courseId }
        delete next.classId
        return next
      })
  }

  const topics = mapRows('topics').map((row: UnknownRecord) => {
    const legacyStatus = String(row.status ?? 'not-started')
    const status: TopicStatus = legacyStatus === 'mastered'
      ? 'ready'
      : legacyStatus === 'cards-made'
        ? 'notes-made'
        : legacyStatus as TopicStatus
    const fsrs = row.fsrs && typeof row.fsrs === 'object'
      ? row.fsrs
      : {
          ...createTopicFsrsState(Number(row.createdAt) || now),
          due: Number(row.nextReviewAt) || Number(row.createdAt) || now,
          lastReview: Number(row.lastReviewedAt) || undefined,
        }
    const next: UnknownRecord = { ...row, status, fsrs }
    delete next.lastReviewedAt
    delete next.nextReviewAt
    return next as unknown as Topic
  })

  const files = mapRows('files').map((row: UnknownRecord) => ({
    ...row,
    sourceType: row.sourceType
      ?? (row.fileName || row.mimeType ? 'upload' : /drive|goodnotes|canvas/i.test(String(row.url ?? '')) ? 'embed' : 'link'),
  })) as unknown as AcademicFile[]

  return {
    topics,
    notes: mapRows('notes') as never,
    assignments: mapRows('assignments') as never,
    files,
    contacts: mapRows('contacts') as never,
    weakAreas: mapRows('weakAreas') as never,
    practiceExams: mapRows('practiceExams') as never,
    practiceQuestions: mapRows('practiceQuestions') as never,
    paperDrafts: [],
    assignedReadings: [],
    feedbackNotes: [],
    gradeCategories: [],
    // v19 owns this array; v4 only has to produce a complete shape.
    mistakes: [],
    topicLinks: [],
    topicPredictions: [],
    savedPlans: [],
    plannerTerms: [],
    examPrepPlans: [],
    generatedFlashcardDecks: [],
    generatedMockAttempts: [],
    generatedRevisedNotes: [],
    professorEvidence: [],
    conceptCanvases: [],
    assessmentMaterials: [],
    assessmentAttempts: [],
    transcriptRecords: [],
    acknowledgedCatalogWarnings: [],
    // v28 owns lecture-capture migration; the v4 baseline still needs a
    // structurally complete ClassCenterData shape for type-safe hydration.
    lectures: [],
    lectureFindings: [],
    lectureMaterialProposals: [],
    lectureNoteProposals: [],
    termReports: [],
  }
}

function currentTermFor(data: AppData, journal: AcademicMigrationJournalEntry[], now: number): string {
  const profileTerm = compactWhitespace(data.profile?.startTerm)
  if (profileTerm) return profileTerm
  const inferredTerm = inferAcademicTerm(now)
  addJournal(journal, {
    kind: 'current-term-confirmation',
    status: 'pending',
    reason: `The profile had no current term. ${inferredTerm} was inferred from today's date and needs confirmation.`,
    inferredTerm,
    createdAt: now,
  })
  return inferredTerm
}

export function syncCurrentTermWorkspaces(data: AppData, now = Date.now()): AppData {
  const academics = data.academics
  academics.migrationJournal ??= []
  const classCenter = academics.classCenter
  classCenter.workspaces ??= []
  classCenter.keyPoints ??= []
  classCenter.sourceChunks ??= []
  classCenter.reviewEvents ??= []
  const currentTerm = currentTermFor(data, academics.migrationJournal, now)

  const coursesById = new Map(data.courses.map((course) => [course.id, course]))
  const workspaceCounts = new Map<string, number>()
  for (const workspace of classCenter.workspaces) {
    workspaceCounts.set(workspace.courseId, (workspaceCounts.get(workspace.courseId) ?? 0) + 1)
  }
  const kept: ClassWorkspace[] = []
  for (const workspace of classCenter.workspaces) {
    const course = coursesById.get(workspace.courseId)
    if ((workspaceCounts.get(workspace.courseId) ?? 0) > 1) {
      addJournal(academics.migrationJournal, {
        id: journalId('workspace-conflict', workspace.id),
        kind: 'workspace-conflict',
        status: 'pending',
        reason: `Multiple workspaces resolve to the same Course (${workspace.courseId}); choose which workspace survives.`,
        legacyWorkspaceId: workspace.id,
        legacyWorkspace: { ...workspace },
        courseId: workspace.courseId,
        candidateCourseIds: [workspace.courseId],
        createdAt: now,
      })
      continue
    }
    if (course && normalizeAcademicTerm(course.term) === normalizeAcademicTerm(currentTerm)) {
      if (!kept.some((item) => item.courseId === workspace.courseId)) kept.push(workspace)
      continue
    }
    addJournal(academics.migrationJournal, {
      kind: 'workspace-dropped-noncurrent',
      status: 'resolved',
      reason: course
        ? `${course.code || course.title} is outside the current term (${currentTerm}); its Course and materials were retained.`
        : 'The workspace no longer has a canonical Course; its snapshot was retained.',
      legacyWorkspaceId: workspace.id,
      legacyWorkspace: { ...workspace },
      courseId: workspace.courseId,
      createdAt: now,
      resolvedAt: now,
    })
  }

  const blockedCourseIds = new Set(
    academics.migrationJournal
      .filter((entry) => entry.status === 'pending' && entry.kind === 'workspace-conflict')
      .flatMap((entry) => [entry.courseId, ...(entry.candidateCourseIds ?? [])])
      .filter((id): id is string => Boolean(id)),
  )
  for (const course of data.courses) {
    if (normalizeAcademicTerm(course.term) !== normalizeAcademicTerm(currentTerm)) continue
    if (blockedCourseIds.has(course.id)) continue
    if (kept.some((workspace) => workspace.courseId === course.id)) continue
    const workspace = emptyWorkspace(course.id, kept.length, now)
    kept.push(workspace)
    addJournal(academics.migrationJournal, {
      kind: 'workspace-auto-created',
      status: 'resolved',
      reason: `${course.code || course.title} entered the current term (${currentTerm}), so an empty workspace was created.`,
      courseId: course.id,
      legacyWorkspace: { ...workspace },
      createdAt: now,
      resolvedAt: now,
    })
  }

  classCenter.workspaces = kept.map((workspace, order) => ({ ...workspace, order }))
  return data
}

/** v4 is deliberately shape-detected as well as version-gated so imported
 * backups receive the same lossless migration as local hydration. */
export function migrateAcademicsV4(data: AppData, now = Date.now()): AppData {
  // Pure with respect to `data` — see the note on `migrateAcademicTags`.
  // Everything this migration (or syncCurrentTermWorkspaces below) writes to is
  // rebuilt as a fresh object first, so a frozen input tree is never touched.
  const academicsSource = data.academics ?? ({} as AppData['academics'])
  const journal: AcademicMigrationJournalEntry[] = [...(academicsSource.migrationJournal ?? [])]
  const legacy = (academicsSource.classCenter ?? {}) as unknown as UnknownRecord

  if (Array.isArray(legacy.workspaces)) {
    const current = academicsSource.classCenter
    // Fresh containers: syncCurrentTermWorkspaces mutates what it is handed.
    const alreadyMigrated: AppData = {
      ...data,
      academics: {
        ...academicsSource,
        migrationJournal: journal,
        classCenter: {
          ...current,
          workspaces: [...(current.workspaces ?? [])],
          keyPoints: current.keyPoints ?? [],
          sourceChunks: current.sourceChunks ?? [],
          reviewEvents: current.reviewEvents ?? [],
        },
      },
    }
    return syncCurrentTermWorkspaces(alreadyMigrated, now)
  }

  // Courses may gain rows below, so work on a copy.
  const courses = [...data.courses]

  const legacyWorkspaces = Array.isArray(legacy.classes) ? legacy.classes as LegacyWorkspace[] : []
  const resolvedByWorkspace = new Map<string, string>()
  const preliminary = new Map<string, { workspace: LegacyWorkspace; courseId?: string; kind?: 'linked' | 'created'; candidates: Course[] }>()

  for (const workspace of legacyWorkspaces) {
    const hasIdentity = normalizeCourseCodes(workspace.courseCode).length > 0 && Boolean(normalizeAcademicTerm(workspace.semester))
    const candidates = hasIdentity ? courses.filter((course) => courseMatches(workspace, course)) : []
    if (candidates.length === 1) {
      preliminary.set(workspace.id, { workspace, courseId: candidates[0].id, kind: 'linked', candidates })
    } else if (candidates.length === 0 && hasIdentity) {
      const created = courseFromWorkspace(workspace, courses.length)
      const existing = courses.find((course) => course.id === created.id)
      if (!existing) courses.push(created)
      preliminary.set(workspace.id, { workspace, courseId: (existing ?? created).id, kind: 'created', candidates: [] })
    } else {
      preliminary.set(workspace.id, { workspace, candidates })
    }
  }

  const byCourse = new Map<string, string[]>()
  for (const [workspaceId, result] of preliminary) {
    if (!result.courseId) continue
    const ids = byCourse.get(result.courseId) ?? []
    ids.push(workspaceId)
    byCourse.set(result.courseId, ids)
  }

  const unresolvedWorkspaceIds = new Set<string>()
  for (const [workspaceId, result] of preliminary) {
    const duplicateWorkspaceIds = result.courseId ? byCourse.get(result.courseId) ?? [] : []
    const conflict = duplicateWorkspaceIds.length > 1
    if (!result.courseId || conflict) {
      unresolvedWorkspaceIds.add(workspaceId)
      const reason = conflict
        ? `Multiple legacy workspaces resolve to the same Course (${result.courseId}); choose which workspace survives.`
        : result.candidates.length > 1
          ? 'Multiple canonical Courses match after normalization; choose the correct Course.'
          : 'The legacy workspace is missing a usable course code or term.'
      addJournal(journal, {
        kind: conflict || result.candidates.length > 1 ? 'workspace-conflict' : 'workspace-unmatched',
        status: 'pending',
        reason,
        legacyWorkspaceId: workspaceId,
        legacyWorkspace: { ...result.workspace },
        relatedLegacyRecords: legacyRelatedRecords(legacy, workspaceId),
        courseId: conflict ? result.courseId : undefined,
        candidateCourseIds: conflict ? [result.courseId!] : result.candidates.map((course) => course.id),
        createdAt: now,
      })
      continue
    }
    resolvedByWorkspace.set(workspaceId, result.courseId)
  }

  const related = migrateRelatedRows(legacy, resolvedByWorkspace, unresolvedWorkspaceIds, now)
  const currentTerm = currentTermFor(data, journal, now)
  const workspaces: ClassWorkspace[] = []
  for (const [workspaceId, courseId] of resolvedByWorkspace) {
    const result = preliminary.get(workspaceId)!
    const course = courses.find((item) => item.id === courseId)
    const current = course && normalizeAcademicTerm(course.term) === normalizeAcademicTerm(currentTerm)
    const kind = current
      ? result.kind === 'created' ? 'workspace-course-created' : 'workspace-linked'
      : 'workspace-dropped-noncurrent'
    if (current) workspaces.push(workspaceFromLegacy(result.workspace, courseId))
    addJournal(journal, {
      kind,
      status: 'resolved',
      reason: current
        ? `${course?.code || 'Course'} was reconciled by normalized course code and term.`
        : `${course?.code || 'Course'} is outside the current term (${currentTerm}); its Course and materials were retained.`,
      legacyWorkspaceId: workspaceId,
      legacyWorkspace: { ...result.workspace },
      courseId,
      createdAt: now,
      resolvedAt: now,
    })
  }

  const migrated: AppData = {
    ...data,
    courses,
    academics: {
      ...academicsSource,
      migrationJournal: journal,
      classCenter: {
        workspaces,
        ...related,
        keyPoints: [],
        sourceChunks: [],
        reviewEvents: [],
      },
    },
  }
  return syncCurrentTermWorkspaces(migrated, now)
}

function appendUniqueRows(target: UnknownRecord[], incoming: UnknownRecord[], subject: string) {
  for (const source of incoming) {
    const sourceId = compactWhitespace(source.id) || `${subject}-${target.length}`
    const existing = target.find((row) => row.id === sourceId)
    if (!existing) {
      target.push({ ...source, id: sourceId })
      continue
    }
    if (JSON.stringify(existing) === JSON.stringify(source)) continue
    let suffix = 1
    let nextId = `${sourceId}-migrated-${subject}`
    while (target.some((row) => row.id === nextId)) nextId = `${sourceId}-migrated-${subject}-${suffix++}`
    target.push({ ...source, id: nextId })
  }
}

function restoreJournalRecords(data: AppData, entry: AcademicMigrationJournalEntry, courseId: string, now: number) {
  if (!entry.legacyWorkspaceId || !entry.relatedLegacyRecords) return
  const legacy: UnknownRecord = { ...entry.relatedLegacyRecords }
  const mapped = migrateRelatedRows(
    legacy,
    new Map([[entry.legacyWorkspaceId, courseId]]),
    new Set(),
    now,
  )
  const center = data.academics.classCenter as unknown as Record<string, UnknownRecord[]>
  for (const key of RELATED_KEYS) {
    appendUniqueRows(center[key] ?? (center[key] = []), mapped[key] as unknown as UnknownRecord[], entry.legacyWorkspaceId)
  }
}

/** Applies one explicit migration-review decision. Journal snapshots are never
 * deleted, including the losing side of a duplicate-workspace conflict. */
export function resolveAcademicMigration(
  data: AppData,
  entryId: string,
  resolution: AcademicMigrationResolution,
  now = Date.now(),
): AppData {
  const journal = data.academics.migrationJournal
  const entry = journal.find((item) => item.id === entryId && item.status === 'pending')
  if (!entry) return data

  if (entry.kind === 'current-term-confirmation') {
    if (resolution.type !== 'confirm-term' || !compactWhitespace(resolution.term)) return data
    data.profile.startTerm = compactWhitespace(resolution.term)
    entry.status = 'resolved'
    entry.resolvedAt = now
    entry.reason = `Current term confirmed as ${data.profile.startTerm}.`
    return syncCurrentTermWorkspaces(data, now)
  }

  if (resolution.type === 'journal-only') {
    entry.status = 'resolved'
    entry.resolvedAt = now
    entry.reason = `${entry.reason} Kept in the migration journal by the user; no active record was created.`
    return data
  }

  let courseId = resolution.type === 'link' ? resolution.courseId : ''
  if (resolution.type === 'create') {
    const code = compactWhitespace(resolution.code)
    const title = compactWhitespace(resolution.title)
    const term = compactWhitespace(resolution.term)
    if (!code || !title || !term) return data
    courseId = `course-from-${entry.legacyWorkspaceId ?? entry.id}`
    if (!data.courses.some((course) => course.id === courseId)) {
      data.courses.push({
        id: courseId,
        code,
        title,
        term,
        credits: 0,
        grade: '',
        bcpm: false,
        status: 'planned',
        inResidence: true,
        satisfies: [],
        notes: 'Created during Academics migration review.',
        order: data.courses.length,
      })
    }
  }
  const course = data.courses.find((item) => item.id === courseId)
  if (!course) return data

  const siblingConflicts = journal.filter((item) =>
    item.status === 'pending'
    && item.kind === 'workspace-conflict'
    && item.courseId === courseId
  )
  const entriesToRestore = siblingConflicts.length ? siblingConflicts : [entry]
  for (const candidate of entriesToRestore) restoreJournalRecords(data, candidate, courseId, now)

  if (entry.legacyWorkspace) {
    const currentTerm = compactWhitespace(data.profile.startTerm) || inferAcademicTerm(now)
    if (normalizeAcademicTerm(course.term) === normalizeAcademicTerm(currentTerm)) {
      data.academics.classCenter.workspaces = data.academics.classCenter.workspaces
        .filter((workspace) => workspace.courseId !== courseId)
      data.academics.classCenter.workspaces.push(
        workspaceFromLegacy(entry.legacyWorkspace as LegacyWorkspace, courseId),
      )
    }
  }

  for (const candidate of entriesToRestore) {
    candidate.status = 'resolved'
    candidate.courseId = courseId
    candidate.resolvedAt = now
    candidate.reason = candidate.id === entry.id
      ? `Linked to ${course.code} in migration review.`
      : `Conflict resolved in favor of workspace ${entry.legacyWorkspaceId}; this snapshot remains in the journal.`
  }

  return syncCurrentTermWorkspaces(data, now)
}
