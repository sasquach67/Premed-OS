/* ============================================================
   store.ts — single source of truth.
   zustand + immer + persist:
     • persist middleware = INSTANT localStorage autosave on every edit
     • immer = ergonomic nested updates
   The Google Drive backup module subscribes to this store.
   ============================================================ */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type {
  AcademicCourseOption, AcademicTagColor, AcademicTypeOption,
  AppData, ClassCenterData, CollectionKey, ActivityEvent, RequirementItem, RecoveryEntry, StoryEntry,
} from '@/lib/types'
import { createDemoData } from '@/data/demoSeed'
import { createEmptyClassCenterData, createPersonalInitialData } from '@/data/personalInitialData'
import {
  activeStorageKey, activeWorkspaceOwner, clearUnstampedDemoNamespace, isDemoMode,
  LEGACY_STORAGE_KEY, REAL_STORAGE_KEY, stampDemoNamespace,
  setActiveWorkspaceOwner, workspaceStorageKey, type WorkspaceOwner,
} from '@/lib/demoMode'
import { migrateLegacyWorkspaceKeys } from '@/lib/workspaceKeyMigration'
import { uid } from '@/lib/id'
import { guardedStorage } from '@/store/storageHealth'
import { isMutableSeverity } from '@/lib/intelligence/recommendations'
import { INTELLIGENCE_THRESHOLDS, type Severity } from '@/lib/intelligence/types'
import { mergeRemotePreservingLocal } from '@/lib/storyPrivacy'
import { clearCalendarSession } from '@/lib/googleCalendar'
import { migrateAcademicsV4, syncCurrentTermWorkspaces } from '@/store/migrations/academicsV4'
import { migrateAcademicsV5 } from '@/store/migrations/academicsV5'
import { migrateAcademicsV6 } from '@/store/migrations/academicsV6'
import { migrateAcademicsV7 } from '@/store/migrations/academicsV7'
import { migrateFoundationV8 } from '@/store/migrations/foundationV8'
import { migrateShellV9 } from '@/store/migrations/shellV9'
import { migrateClassTypesV10 } from '@/store/migrations/classTypesV10'
import { migrateSyllabusV11 } from '@/store/migrations/syllabusV11'
import { migrateSchoolStatusV12 } from '@/store/migrations/schoolStatusV12'
import { migrateOverviewV13 } from '@/store/migrations/overviewV13'
import { migrateTimelineV14 } from '@/store/migrations/timelineV14'
import { migrateExperienceHoursV15 } from '@/store/migrations/experienceHoursV15'
import { migrateRoadmapTaskLinkV16 } from '@/store/migrations/roadmapTaskLinkV16'
import { migrateOverviewAttachmentsV17 } from '@/store/migrations/overviewAttachmentsV17'

import { migrateTaskHorizonsV18 } from '@/store/migrations/taskHorizonsV18'
import { migrateExamPrepV19 } from '@/store/migrations/examPrepV19'
import { migrateGradeDecisionsV20 } from '@/store/migrations/gradeDecisionsV20'
import { migrateTopicLinksV21 } from '@/store/migrations/topicLinksV21'
import { migrateTopicPredictionsV22 } from '@/store/migrations/topicPredictionsV22'
import { migrateSavedPlansV23 } from '@/store/migrations/savedPlansV23'
import { migrateAssignmentDueDateIsoV24 } from '@/store/migrations/assignmentDueDateIsoV24'
import { migrateGeneratedArtifactsV25 } from '@/store/migrations/generatedArtifactsV25'
import { migrateRevisedNotesV26 } from '@/store/migrations/revisedNotesV26'
import { migrateAcademicsEvidenceV27 } from '@/store/migrations/academicsEvidenceV27'
import { migrateLectureCaptureV28 } from '@/store/migrations/lectureCaptureV28'
import { migratePlannerTermsV29 } from '@/store/migrations/plannerTermsV29'
import { migrateRequirementsAuditV30 } from '@/store/migrations/requirementsAuditV30'
import { migrateTermReportsV31 } from '@/store/migrations/termReportsV31'
import { migrateReviewSessionV32 } from '@/store/migrations/reviewSessionV32'
import { migrateRetrievabilityPredictionsV33 } from '@/store/migrations/retrievabilityPredictionsV33'
import { migrateWritingEvidenceV34 } from '@/store/migrations/writingEvidenceV34'
import { migrateWatchedNotesV35 } from '@/store/migrations/watchedNotesV35'
import { migratePlanningLibraryV36 } from '@/store/migrations/planningLibraryV36'
import { migrateGuideProposalsV37 } from '@/store/migrations/guideProposalsV37'
import { migrateReadingTaskScheduleV38 } from '@/store/migrations/readingTaskScheduleV38'
import { migrateGeneratedUnitResourcesV39 } from '@/store/migrations/generatedUnitResourcesV39'
import { migrateProfileMinorsV40 } from '@/store/migrations/profileMinorsV40'
import { migrateLectureWorkspaceV41 } from '@/store/migrations/lectureWorkspaceV41'
import { migrateStaffEmailV42 } from '@/store/migrations/staffEmailV42'
import { migrateClassIdentityV43 } from '@/store/migrations/classIdentityV43'
import { removeStoryAttachment, retainThenPersistStoryAttachment } from '@/lib/overviewFileCapture'

const DEMO_MODE = isDemoMode()

// One-time, non-destructive namespace upgrade. Never inspect the real or
// legacy namespace while demo mode is active.
if (!DEMO_MODE && typeof localStorage !== 'undefined' && !localStorage.getItem(REAL_STORAGE_KEY)) {
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (legacy) guardedStorage(localStorage).setItem(REAL_STORAGE_KEY, legacy)
}

// Discard any demo blob we did not seed, so the "Demo data" badge can never sit
// above real-looking data. Only ever touches the demo namespace.
if (DEMO_MODE) clearUnstampedDemoNamespace()

export const STORAGE_KEY = activeStorageKey()
/** Version 0 is the oldest local-first root shape this migration chain accepts. */
export const OLDEST_SUPPORTED_STORE_VERSION = 0
/** Matches the newest migration in `migrateAll`: `migrateClassIdentityV43`. */
export const CURRENT_STORE_VERSION = 43

function createInitialData() {
  const initial = createInitialDataForMode(DEMO_MODE)
  if (DEMO_MODE) stampDemoNamespace()
  return initial
}

/** Pure reset factory: real mode is record-free; demo mode restores fixtures. */
export function createResetDataForMode(demoMode: boolean): AppData {
  return migrateAll(demoMode ? createDemoData() : createPersonalInitialData())
}

function createResetData() {
  const reset = createResetDataForMode(DEMO_MODE)
  if (DEMO_MODE) stampDemoNamespace()
  return reset
}

type AnyRow = { id: string; order: number; archived?: boolean; deletedAt?: number; [key: string]: unknown }

interface Actions {
  /** generic escape hatch — mutate the whole tree with immer semantics */
  update: (mutator: (draft: AppData) => void) => void

  // generic collection CRUD (Notion-like inline editing)
  addItem: <K extends CollectionKey>(key: K, item: AppData[K][number]) => void
  patchItem: <K extends CollectionKey>(key: K, id: string, patch: Partial<AppData[K][number]>) => void
  /** Atomically creates the one permitted normal task linked to a Timeline
   * milestone. It deliberately never creates a Timeline-authored step. */
  createRoadmapImplementationTask: (milestoneId: string, title: string) => string | null
  /** Retains a student-supplied file before creating its one Story Bank record. */
  createOverviewFileCapture: (file: File, options?: { commentary?: string; localOnly?: boolean }) => Promise<string | null>
  removeItem: (key: CollectionKey, id: string) => void
  softDeleteItems: (key: CollectionKey, ids: string[], label?: string) => string | null
  restoreTrashItems: (trashIds: string[]) => void
  permanentlyDeleteTrashItems: (trashIds: string[]) => void
  bulkPatchItems: (key: CollectionKey, ids: string[], patch: Record<string, unknown>, label: string) => string | null
  bulkTransformItems: (key: CollectionKey, ids: string[], updater: (row: Record<string, unknown>) => void, label: string) => string | null
  undoRecovery: (id: string) => void
  /** drag-reorder: move `fromId` to occupy `toId`'s slot */
  reorderItems: (key: CollectionKey, fromId: string, toId: string) => void
  setCollection: <K extends CollectionKey>(key: K, items: AppData[K]) => void

  setNote: (id: string, value: string) => void
  touchRoute: (routeId: string) => void
  logActivity: (pillar: string, label: string) => void

  /** Recommendation lifecycle (foundation L6). These record an OUTCOME — they
   *  never perform the recommended action, which stays the user's to take. */
  acceptRecommendation: (id: string) => void
  dismissRecommendation: (rec: { id: string; ruleId: string; severity: Severity }, reason?: string) => void

  replaceAll: (data: AppData) => void
  /** Install a tree that is already at the current schema version. */
  adoptPreparedWorkspace: (data: AppData) => void
  resetToSeed: () => void
}

export type Store = AppData & Actions

/** keys that hold the persisted data (functions are never serialized) */
const DATA_KEYS: (keyof AppData)[] = [
  'profile', 'goals', 'courses', 'requirements', 'experiences', 'experienceHourEntries', 'tasks', 'timelineMilestones',
  'persons', 'organizations',
  'academics', 'letters', 'stories', 'secondaries', 'interviewQs', 'mcat', 'schools',
  'resources', 'tips', 'focusTargets', 'quarterlyGoals', 'advisingQs',
  'captures', 'notePages', 'orgs', 'notes', 'settings', 'meta',
  'trash',
]

const TAG_COLORS: AcademicTagColor[] = ['blue', 'green', 'purple', 'orange', 'yellow', 'red', 'pink', 'gray']

function slug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tag'
}

function courseOptionId(label: string) {
  return `course-${slug(label)}`
}

function typeOptionId(label: string) {
  return `type-${slug(label)}`
}

function normalizeLabel(value: string) {
  return value.trim().toLowerCase()
}

function classCenterDefaults() {
  return createEmptyClassCenterData()
}

/** Additive L4 migration: legacy backups gain recovery containers without
 *  reshaping records. Pure — see the note on `migrateAcademicTags`. */
export function migrateSafetyNets(data: AppData): AppData {
  return {
    ...data,
    trash: data.trash ?? [],
    settings: {
      ...data.settings,
      listPreferences: data.settings.listPreferences ?? {},
      savedViews: data.settings.savedViews ?? {},
      activeSavedViewIds: data.settings.activeSavedViewIds ?? {},
      attentionSnoozedUntil: data.settings.attentionSnoozedUntil ?? {},
    },
    meta: { ...data.meta, recoveryStack: data.meta.recoveryStack ?? [] },
  }
}

/** Additive L6 migration: legacy backups gain the deterministic-intelligence
 *  containers without reshaping any record. Idempotent (`??=`) and lossless —
 *  it only ever adds empty maps, never drops or rewrites user data. */
export function migrateIntelligence(data: AppData): AppData {
  return {
    ...data,
    settings: {
      ...data.settings,
      recommendationState: data.settings.recommendationState ?? {},
      mutedRecommendationRules: data.settings.mutedRecommendationRules ?? {},
    },
  }
}

/** Version 2: add Overview's planning fields and move unstructured Overview
 * thoughts directly into Story Bank. Legacy source captures remain intact;
 * legacy idea captures become untyped Story Bank entries. The old
 * `home-ideas` note remains untouched, making the migration lossless. */
export function migrateOverviewSchema(data: AppData): AppData {
  // Rows are only rebuilt when a field is actually added.
  const tasks = (data.tasks ?? []).map((task) => {
    const important = task.important ?? false
    const horizon = task.horizon ?? 'now'
    if (important === task.important && horizon === task.horizon) return task
    return { ...task, important, horizon }
  })

  const existingStories = [...(data.stories ?? [])]
  const captures = [...(data.captures ?? [])]
  const stories = [...existingStories]

  for (const capture of captures) {
    if (capture.kind !== 'idea') continue
    const storyId = `story-${capture.id}`
    if (stories.some((story) => story.id === storyId)) continue
    stories.push({
      id: storyId,
      prompt: '',
      title: '',
      commentary: capture.content,
      tags: [],
      capturedAt: capture.createdAt,
      updatedAt: capture.updatedAt,
      origin: 'overview',
      order: stories.length,
    })
  }

  const sourceCaptures = captures.filter((capture) => capture.kind === 'source')
  const legacy = data.notes?.['home-ideas']?.trim()
  if (legacy && /^https?:\/\//i.test(legacy) && !sourceCaptures.some((capture) => capture.id === 'capture-legacy-home-ideas')) {
    const at = data.meta?.lastOpenedAt || Date.now()
    sourceCaptures.push({
      id: 'capture-legacy-home-ideas',
      kind: 'source',
      content: legacy,
      url: legacy,
      createdAt: at,
      updatedAt: at,
      origin: 'overview',
      order: sourceCaptures.length,
    })
  } else if (legacy && !/^https?:\/\//i.test(legacy) && !stories.some((story) => story.id === 'story-legacy-home-ideas')) {
    const at = data.meta?.lastOpenedAt || Date.now()
    stories.push({
      id: 'story-legacy-home-ideas',
      prompt: '',
      title: '',
      commentary: legacy,
      tags: [],
      capturedAt: at,
      updatedAt: at,
      origin: 'overview',
      order: stories.length,
    })
  }

  return {
    ...data,
    tasks,
    stories,
    captures: sourceCaptures,
    settings: { ...data.settings, projectionDismissals: data.settings.projectionDismissals ?? {} },
  }
}

/** Version 3: add persisted MascotNote dismissal keys without rewriting any
 * existing setting or record. */
export function migrateMascotNotes(data: AppData): AppData {
  return {
    ...data,
    settings: { ...data.settings, mascotNoteDismissals: data.settings.mascotNoteDismissals ?? {} },
  }
}

/** Pure: never writes to `data`, so it is safe on frozen (immer-produced) state.
 *  Returns a new tree; unchanged rows keep their identity. */
export function migrateAcademicTags(data: AppData): AppData {
  const academics = data.academics ?? { courseOptions: [], assignmentTypeOptions: [], classCenter: classCenterDefaults(), migrationJournal: [] }
  const classCenterSource = academics.classCenter ?? classCenterDefaults()

  // Copies — `ensureCourse`/`ensureType` append here rather than to caller state.
  const courseOptions = [...(academics.courseOptions ?? [])] as AcademicCourseOption[]
  const typeOptions = [...(academics.assignmentTypeOptions ?? [])] as AcademicTypeOption[]

  const courseByName = new Map(courseOptions.map((option) => [normalizeLabel(option.name), option]))
  const typeByName = new Map(typeOptions.map((option) => [normalizeLabel(option.name), option]))

  const ensureCourse = (name: string, title?: string): AcademicCourseOption => {
    const trimmed = name.trim()
    const key = normalizeLabel(trimmed)
    const existing = courseByName.get(key)
    if (existing) return existing
    const option: AcademicCourseOption = {
      id: courseOptionId(trimmed),
      name: trimmed,
      title,
      color: TAG_COLORS[courseOptions.length % TAG_COLORS.length],
      archived: false,
    }
    courseOptions.push(option)
    courseByName.set(key, option)
    return option
  }

  const ensureType = (name: string): AcademicTypeOption => {
    const trimmed = name.trim()
    const key = normalizeLabel(trimmed)
    const existing = typeByName.get(key)
    if (existing) return existing
    const option: AcademicTypeOption = {
      id: typeOptionId(trimmed),
      name: trimmed,
      color: TAG_COLORS[(typeOptions.length + 2) % TAG_COLORS.length],
      archived: false,
    }
    typeOptions.push(option)
    typeByName.set(key, option)
    return option
  }

  for (const course of data.courses ?? []) {
    const label = course.code || course.title
    if (label) ensureCourse(label, course.title)
  }

  // Rows only get rebuilt when a tag id is actually added.
  const tasks = (data.tasks ?? []).map((task) => {
    const courseId = task.course && !task.courseId ? ensureCourse(task.course).id : task.courseId
    const typeId = task.type && !task.typeId ? ensureType(task.type).id : task.typeId
    if (courseId === task.courseId && typeId === task.typeId) return task
    return { ...task, courseId, typeId }
  })

  // Keep the older additive safeguards available to direct migration callers.
  // The v4 reconciliation immediately follows this function during hydration.
  const topics = (classCenterSource.topics ?? []).map((topic) => ({
    ...topic,
    confidence: Math.max(1, Math.min(3, Number(topic.confidence) || 1)) as typeof topic.confidence,
    status: (topic.status as string) === 'mastered'
      ? 'ready'
      : (topic.status as string) === 'cards-made' ? 'notes-made' : topic.status,
    linkedNoteIds: topic.linkedNoteIds ?? [],
    linkedAssignmentIds: topic.linkedAssignmentIds ?? [],
    linkedFileIds: topic.linkedFileIds ?? [],
  }))
  const weakAreas = (classCenterSource.weakAreas ?? []).map((area) => ({
    ...area,
    severity: Math.max(1, Math.min(3, Number(area.severity) || 1)) as typeof area.severity,
  }))

  // A non-enumerable compatibility view lets old callers detect that the
  // container exists without serializing duplicate course/workspace data.
  // Defined on the fresh container: object spread never carries it across.
  const center = {
    ...classCenterSource,
    topics,
    weakAreas,
    gradeCategories: classCenterSource.gradeCategories ?? [],
  } as unknown as ClassCenterData & { classes?: unknown[] }
  Object.defineProperty(center, 'classes', {
    configurable: true,
    enumerable: false,
    get: () => center.workspaces ?? [],
  })

  return {
    ...data,
    tasks,
    academics: {
      ...academics,
      courseOptions,
      assignmentTypeOptions: typeOptions,
      migrationJournal: academics.migrationJournal ?? [],
      classCenter: center,
    },
  }
}

/** Pure — see the note on `migrateAcademicTags`. */
export function migrateOrgReflections(data: AppData): AppData {
  const today = new Date().toISOString().slice(0, 10)

  const orgs = (data.orgs ?? []).map((org) => {
    const legacy = typeof org.reflection === 'string' ? org.reflection.trim() : ''
    const existing = org.reflections ?? []
    // Nothing to add and the container is already there — keep identity.
    if (existing === org.reflections && !(legacy && existing.length === 0)) return org
    const reflections = legacy && existing.length === 0
      ? [...existing, { id: uid(), date: today, title: 'Imported note', body: legacy }]
      : existing
    return { ...org, reflections }
  })

  return { ...data, orgs }
}

const REQUIREMENT_SOURCE_BY_GROUP: Record<string, Pick<RequirementItem, 'sourceType' | 'sourceLabel' | 'sourceUrl' | 'lastVerified' | 'verificationStatus'>> = {
  'Incoming AP / transfer credit': {
    sourceType: 'user-note',
    sourceLabel: 'Andy AP/transfer credit note',
    sourceUrl: 'https://catalog.unc.edu/undergraduate/programs-study/neuroscience-major-bs/',
    lastVerified: '2026-06-27',
    verificationStatus: 'needs-verification',
  },
  'IDEAs in Action — First-Year Foundations': {
    sourceType: 'official',
    sourceLabel: 'UNC Catalog — IDEAs in Action',
    sourceUrl: 'https://catalog.unc.edu/undergraduate/ideas-in-action/',
    lastVerified: '2026-06-27',
    verificationStatus: 'verified',
  },
  'IDEAs in Action — Focus Capacities': {
    sourceType: 'official',
    sourceLabel: 'UNC Catalog — IDEAs in Action',
    sourceUrl: 'https://catalog.unc.edu/undergraduate/ideas-in-action/',
    lastVerified: '2026-06-27',
    verificationStatus: 'verified',
  },
  'IDEAs in Action — Reflection & Integration': {
    sourceType: 'official',
    sourceLabel: 'UNC Catalog — IDEAs in Action',
    sourceUrl: 'https://catalog.unc.edu/undergraduate/ideas-in-action/',
    lastVerified: '2026-06-27',
    verificationStatus: 'verified',
  },
  'IDEAs in Action — Additional (Fall 2025+)': {
    sourceType: 'official',
    sourceLabel: 'UNC Catalog — IDEAs in Action',
    sourceUrl: 'https://catalog.unc.edu/undergraduate/ideas-in-action/',
    lastVerified: '2026-06-27',
    verificationStatus: 'verified',
  },
  'Neuroscience B.S. — Core': {
    sourceType: 'official',
    sourceLabel: 'UNC Catalog — Neuroscience B.S.',
    sourceUrl: 'https://catalog.unc.edu/undergraduate/programs-study/neuroscience-major-bs/',
    lastVerified: '2026-06-27',
    verificationStatus: 'verified',
  },
  'Neuroscience B.S. — Additional Requirements (C or better)': {
    sourceType: 'official',
    sourceLabel: 'UNC Catalog — Neuroscience B.S.',
    sourceUrl: 'https://catalog.unc.edu/undergraduate/programs-study/neuroscience-major-bs/',
    lastVerified: '2026-06-27',
    verificationStatus: 'verified',
  },
  'Pre-Med additions (UNC HPA)': {
    sourceType: 'premed-advice',
    sourceLabel: 'UNC HPA / premed planning note',
    sourceUrl: 'https://hpa.unc.edu/',
    lastVerified: '2026-06-27',
    verificationStatus: 'needs-verification',
  },
  'University graduation rules': {
    sourceType: 'official',
    sourceLabel: 'UNC Catalog',
    sourceUrl: 'https://catalog.unc.edu/policies-procedures/degree-requirements/',
    lastVerified: '2026-06-27',
    verificationStatus: 'verified',
  },
  'Satisfied by incoming credit': {
    sourceType: 'user-note',
    sourceLabel: 'Andy AP/transfer credit note',
    sourceUrl: 'https://catalog.unc.edu/undergraduate/programs-study/neuroscience-major-bs/',
    lastVerified: '2026-06-27',
    verificationStatus: 'needs-verification',
  },
  'Major — Core': {
    sourceType: 'official',
    sourceLabel: 'UNC Catalog — Neuroscience B.S.',
    sourceUrl: 'https://catalog.unc.edu/undergraduate/programs-study/neuroscience-major-bs/',
    lastVerified: '2026-06-27',
    verificationStatus: 'needs-verification',
  },
  'Major — Additional Requirements (C or better)': {
    sourceType: 'official',
    sourceLabel: 'UNC Catalog — Neuroscience B.S.',
    sourceUrl: 'https://catalog.unc.edu/undergraduate/programs-study/neuroscience-major-bs/',
    lastVerified: '2026-06-27',
    verificationStatus: 'needs-verification',
  },
  'Med Prerequisites (UNC HPA)': {
    sourceType: 'premed-advice',
    sourceLabel: 'UNC HPA / premed planning note',
    sourceUrl: 'https://hpa.unc.edu/',
    lastVerified: '2026-06-27',
    verificationStatus: 'needs-verification',
  },
  Graduation: {
    sourceType: 'official',
    sourceLabel: 'UNC Catalog',
    sourceUrl: 'https://catalog.unc.edu/policies-procedures/degree-requirements/',
    lastVerified: '2026-06-27',
    verificationStatus: 'needs-verification',
  },
}

export function migrateRequirementMetadata(data: AppData): AppData {
  const migrationNote = 'Migration note: Carolina Compass-style “Organismal” labels are treated only as optional planner/course tags, not a standalone Neuroscience B.S. requirement.'
  let removedOrganismal = false
  const requirements = (data.requirements ?? [])
    .filter((requirement) => {
      const standaloneOrganismal = /organismal/i.test(requirement.group) || /^organismal$/i.test(requirement.label.trim())
      if (!standaloneOrganismal) return true
      removedOrganismal = true
      return false
    })
    .map((requirement) => {
      const fallback = REQUIREMENT_SOURCE_BY_GROUP[requirement.group] ?? {
        sourceType: 'planner-inspired' as const,
        sourceLabel: 'Planner note',
        lastVerified: '2026-06-27',
        verificationStatus: 'needs-verification' as const,
      }
      const uncertain = /Knowledge Electives|Math\/Methods\/Stats|Options:|prioritized|Select two/i.test(requirement.label)
      return {
        ...fallback,
        ...requirement,
        verificationStatus: requirement.verificationStatus ?? (uncertain ? 'needs-verification' : fallback.verificationStatus),
      }
    })

  return {
    ...data,
    requirements,
    notes: removedOrganismal
      ? { ...data.notes, 'tar-heel-organismal-migration': migrationNote }
      : data.notes,
  }
}

/** The full hydration chain. Exported so the frozen-input contract can be
 *  tested end to end: every link must be pure, or immer state throws. */
export function migrateAll(data: AppData): AppData {
  let migrated = migrateAcademicTags(data)
  migrated = migrateRequirementMetadata(migrated)
  migrated = migrateOrgReflections(migrated)
  migrated = migrateSafetyNets(migrated)
  migrated = migrateIntelligence(migrated)
  migrated = migrateOverviewSchema(migrated)
  migrated = migrateMascotNotes(migrated)
  migrated = migrateAcademicsV4(migrated)
  migrated = migrateAcademicsV5(migrated)
  migrated = migrateAcademicsV6(migrated)
  migrated = migrateAcademicsV7(migrated)
  migrated = migrateFoundationV8(migrated)
  migrated = migrateShellV9(migrated)
  migrated = migrateClassTypesV10(migrated)
  migrated = migrateSyllabusV11(migrated)
  migrated = migrateSchoolStatusV12(migrated)
  migrated = migrateOverviewV13(migrated)
  migrated = migrateTimelineV14(migrated)
  migrated = migrateExperienceHoursV15(migrated)
  migrated = migrateRoadmapTaskLinkV16(migrated)
  migrated = migrateOverviewAttachmentsV17(migrated)
  migrated = migrateTaskHorizonsV18(migrated)
  migrated = migrateExamPrepV19(migrated)
  migrated = migrateGradeDecisionsV20(migrated)
  migrated = migrateTopicLinksV21(migrated)
  migrated = migrateTopicPredictionsV22(migrated)
  migrated = migrateSavedPlansV23(migrated)
  migrated = migrateAssignmentDueDateIsoV24(migrated)
  migrated = migrateGeneratedArtifactsV25(migrated)
  migrated = migrateRevisedNotesV26(migrated)
  migrated = migrateAcademicsEvidenceV27(migrated)
  migrated = migrateLectureCaptureV28(migrated)
  migrated = migratePlannerTermsV29(migrated)
  migrated = migrateRequirementsAuditV30(migrated)
  migrated = migrateTermReportsV31(migrated)
  migrated = migrateReviewSessionV32(migrated)
  migrated = migrateRetrievabilityPredictionsV33(migrated)
  migrated = migrateWritingEvidenceV34(migrated)
  migrated = migrateWatchedNotesV35(migrated)
  migrated = migratePlanningLibraryV36(migrated)
  migrated = migrateGuideProposalsV37(migrated)
  migrated = migrateReadingTaskScheduleV38(migrated)
  migrated = migrateGeneratedUnitResourcesV39(migrated)
  migrated = migrateProfileMinorsV40(migrated)
  migrated = migrateLectureWorkspaceV41(migrated)
  migrated = migrateStaffEmailV42(migrated)
  return migrateClassIdentityV43(migrated)
}

/**
 * Pure first-run factory used by the store and regression tests. Real mode
 * must remain record-free; demo mode is the only route that produces fixtures.
 */
export function createInitialDataForMode(demoMode: boolean): AppData {
  return migrateAll(demoMode ? createDemoData() : createPersonalInitialData())
}

function nextOrder(arr: AnyRow[]): number {
  return arr.reduce((m, x) => Math.max(m, x.order ?? 0), -1) + 1
}

function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function pushRecovery(
  state: AppData,
  collection: CollectionKey,
  label: string,
  before: AnyRow[],
  after: AnyRow[],
) {
  const entry: RecoveryEntry = {
    id: uid(),
    at: Date.now(),
    label,
    collection,
    before: plain(before),
    after: plain(after),
  }
  state.meta.recoveryStack.unshift(entry)
  state.meta.recoveryStack = state.meta.recoveryStack.slice(0, 30)
  return entry.id
}

export const useStore = create<Store>()(
  persist(
    immer((set) => ({
      ...migrateAll(createInitialData()),

      update: (mutator) => set((s) => {
        mutator(s as unknown as AppData)
        syncCurrentTermWorkspaces(s as unknown as AppData)
      }),

      addItem: (key, item) =>
        set((s) => {
          const arr = s[key] as unknown as AnyRow[]
          const row = item as unknown as AnyRow
          if (row.order == null) row.order = nextOrder(arr)
          arr.push(row)
          if (key === 'courses') syncCurrentTermWorkspaces(s as unknown as AppData)
          pushRecovery(s as unknown as AppData, key, 'Created record', [], [row])
        }),

      patchItem: (key, id, patch) =>
        set((s) => {
          const arr = s[key] as unknown as AnyRow[]
          const row = arr.find((r) => r.id === id)
          if (row) Object.assign(row, patch)
          if (key === 'courses') syncCurrentTermWorkspaces(s as unknown as AppData)
        }),

      createRoadmapImplementationTask: (milestoneId, title) => {
        const cleanedTitle = title.trim()
        if (!cleanedTitle) return null
        let taskId: string | null = null
        set((s) => {
          const milestone = s.timelineMilestones.find((item) => item.id === milestoneId)
          if (!milestone || milestone.implementationTaskId) return
          taskId = uid()
          const task = {
            id: taskId,
            title: cleanedTitle,
            type: 'Task',
            progress: 'Not started' as const,
            kanban: 'todo' as const,
            archived: false,
            horizon: 'now' as const,
            important: false,
            order: nextOrder(s.tasks),
          }
          s.tasks.push(task)
          milestone.implementationTaskId = taskId
          pushRecovery(s as unknown as AppData, 'tasks', 'Created linked roadmap task', [], [task])
        })
        return taskId
      },

      createOverviewFileCapture: async (file, options = {}) => {
        const id = uid()
        try {
          return await retainThenPersistStoryAttachment(id, file, (attachment) => {
            set((s) => {
              const now = Date.now()
              const story: StoryEntry = {
                id,
                prompt: '',
                title: '',
                commentary: options.commentary?.trim() ?? '',
                tags: [],
                attachment,
                capturedAt: now,
                updatedAt: now,
                origin: 'overview',
                localOnly: Boolean(options.localOnly),
                order: nextOrder(s.stories),
              }
              s.stories.push(story)
              pushRecovery(s as unknown as AppData, 'stories', 'Captured Story Bank file', [], [story as unknown as AnyRow])
            })
            return id
          })
        } catch {
          return null
        }
      },

      removeItem: (key, id) =>
        set((s) => {
          const arr = s[key] as unknown as AnyRow[]
          const i = arr.findIndex((r) => r.id === id)
          if (i < 0) return
          const before = plain(arr[i])
          const deletedAt = Date.now()
          const [record] = arr.splice(i, 1)
          if (key === 'courses') syncCurrentTermWorkspaces(s as unknown as AppData)
          record.deletedAt = deletedAt
          s.trash.unshift({ id: uid(), collection: key, deletedAt, record: { ...plain(record), deletedAt } })
          pushRecovery(s as unknown as AppData, key, 'Moved record to trash', [before], [record])
        }),

      softDeleteItems: (key, ids, label = 'Moved records to trash') => {
        let recoveryId: string | null = null
        set((s) => {
          const wanted = new Set(ids)
          const arr = s[key] as unknown as AnyRow[]
          const before = arr.filter((row) => wanted.has(row.id)).map(plain)
          if (!before.length) return
          const deletedAt = Date.now()
          const after = before.map((row) => ({ ...row, deletedAt }))
          ;(s as unknown as Record<string, unknown>)[key] = arr.filter((row) => !wanted.has(row.id))
          for (const record of after) {
            s.trash.unshift({ id: uid(), collection: key, deletedAt, record: { ...plain(record), deletedAt } })
          }
          if (key === 'courses') syncCurrentTermWorkspaces(s as unknown as AppData)
          recoveryId = pushRecovery(s as unknown as AppData, key, label, before, after)
        })
        return recoveryId
      },

      restoreTrashItems: (trashIds) =>
        set((s) => {
          const wanted = new Set(trashIds)
          const restoring = s.trash.filter((entry) => wanted.has(entry.id))
          for (const entry of restoring) {
            const arr = s[entry.collection] as unknown as AnyRow[]
            if (arr.some((row) => row.id === entry.record.id)) continue
            const record = plain(entry.record) as AnyRow
            delete record.deletedAt
            arr.push(record)
          }
          s.trash = s.trash.filter((entry) => !wanted.has(entry.id))
          if (restoring.some((entry) => entry.collection === 'courses')) syncCurrentTermWorkspaces(s as unknown as AppData)
        }),

      permanentlyDeleteTrashItems: (trashIds) => {
        const attachments: Array<Pick<StoryEntry, 'attachment'>> = []
        set((s) => {
          const wanted = new Set(trashIds)
          s.trash
            .filter((entry) => wanted.has(entry.id) && entry.collection === 'stories')
            .forEach((entry) => attachments.push(plain(entry.record) as Pick<StoryEntry, 'attachment'>))
          s.trash = s.trash.filter((entry) => !wanted.has(entry.id))
        })
        void Promise.all(attachments.map((story) => removeStoryAttachment(story))).catch(() => undefined)
      },

      bulkPatchItems: (key, ids, patch, label) => {
        let recoveryId: string | null = null
        set((s) => {
          const wanted = new Set(ids)
          const arr = s[key] as unknown as AnyRow[]
          const rows = arr.filter((row) => wanted.has(row.id))
          if (!rows.length) return
          const before = rows.map(plain)
          for (const row of rows) Object.assign(row, patch)
          if (key === 'courses') syncCurrentTermWorkspaces(s as unknown as AppData)
          recoveryId = pushRecovery(s as unknown as AppData, key, label, before, rows.map(plain))
        })
        return recoveryId
      },

      bulkTransformItems: (key, ids, updater, label) => {
        let recoveryId: string | null = null
        set((s) => {
          const wanted = new Set(ids)
          const arr = s[key] as unknown as AnyRow[]
          const rows = arr.filter((row) => wanted.has(row.id))
          if (!rows.length) return
          const before = rows.map(plain)
          for (const row of rows) updater(row)
          if (key === 'courses') syncCurrentTermWorkspaces(s as unknown as AppData)
          recoveryId = pushRecovery(s as unknown as AppData, key, label, before, rows.map(plain))
        })
        return recoveryId
      },

      undoRecovery: (id) =>
        set((s) => {
          const entry = s.meta.recoveryStack.find((candidate) => candidate.id === id)
          if (!entry) return
          const beforeIds = new Set(entry.before.map((row) => row.id))
          const afterIds = new Set(entry.after.map((row) => row.id))
          const affectedIds = new Set([...beforeIds, ...afterIds])
          const arr = s[entry.collection] as unknown as AnyRow[]
          ;(s as unknown as Record<string, unknown>)[entry.collection] = arr.filter((row) => !affectedIds.has(row.id))
          s.trash = s.trash.filter((trash) => trash.collection !== entry.collection || !affectedIds.has(trash.record.id))
          const target = s[entry.collection] as unknown as AnyRow[]
          for (const row of entry.before) {
            const restored = plain(row) as AnyRow
            delete restored.deletedAt
            target.push(restored)
          }
          target.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          if (entry.collection === 'courses') syncCurrentTermWorkspaces(s as unknown as AppData)
          s.meta.recoveryStack = s.meta.recoveryStack.filter((candidate) => candidate.id !== id)
        }),

      reorderItems: (key, fromId, toId) =>
        set((s) => {
          const arr = s[key] as unknown as AnyRow[]
          const from = arr.findIndex((r) => r.id === fromId)
          const to = arr.findIndex((r) => r.id === toId)
          if (from < 0 || to < 0 || from === to) return
          const before = arr.map(plain)
          const [moved] = arr.splice(from, 1)
          arr.splice(to, 0, moved)
          arr.forEach((r, i) => (r.order = i))
          pushRecovery(s as unknown as AppData, key, 'Moved record', before, arr.map(plain))
        }),

      setCollection: (key, items) =>
        set((s) => {
          ;(s as unknown as Record<string, unknown>)[key] = items
          if (key === 'courses') syncCurrentTermWorkspaces(s as unknown as AppData)
        }),

      setNote: (id, value) =>
        set((s) => {
          s.notes[id] = value
        }),

      touchRoute: (routeId) =>
        set((s) => {
          s.meta.lastOpenedAt = Date.now()
          const r = s.meta.recentRoutes.filter((x) => x !== routeId)
          r.unshift(routeId)
          s.meta.recentRoutes = r.slice(0, 6)
        }),

      logActivity: (pillar, label) =>
        set((s) => {
          const ev: ActivityEvent = { id: uid(), at: Date.now(), pillar, label }
          s.meta.activity.unshift(ev)
          s.meta.activity = s.meta.activity.slice(0, 30)
        }),

      acceptRecommendation: (id) =>
        set((s) => {
          s.settings.recommendationState[id] = { status: 'accepted', at: Date.now() }
        }),

      dismissRecommendation: (rec, reason) =>
        set((s) => {
          s.settings.recommendationState[rec.id] = { status: 'dismissed', at: Date.now(), reason }
          // Alert-fatigue guard. Dismissal is per-instance by default; only once
          // the same rule has been waved away three times do we retire the rule
          // itself — and never for blocking items, which must always surface
          // no matter how often they are dismissed.
          if (!isMutableSeverity(rec.severity)) return
          const dismissals = Object.entries(s.settings.recommendationState)
            .filter(([key, record]) => record.status === 'dismissed' && key.startsWith(`${rec.ruleId}:`))
            .length
          if (dismissals >= INTELLIGENCE_THRESHOLDS.ruleMuteAfterDismissals) {
            s.settings.mutedRecommendationRules[rec.ruleId] = { at: Date.now() }
          }
        }),

      replaceAll: (data) => set(() => ({
        ...migrateAll({ ...createInitialData(), ...data } as AppData),
      })),

      // `replaceAll` migrates because it accepts arbitrary outside data: an
      // imported backup, or a cloud row written by an older client. A workspace
      // read from this browser has already been through the version gate in
      // `readWorkspaceData`, so re-migrating it here would put the whole chain
      // back on every account switch and undo that gate.
      adoptPreparedWorkspace: (data) => set(() => ({ ...data })),

      resetToSeed: () => set(() => ({ ...createResetData() })),
    })),
    {
      name: STORAGE_KEY,
      version: CURRENT_STORE_VERSION,
      storage: createJSONStorage(() => guardedStorage(localStorage)),
      migrate: (persisted) => migrateAll(persisted as AppData) as unknown as Store,
      partialize: (state) =>
        Object.fromEntries(DATA_KEYS.map((k) => [k, state[k]])) as unknown as Store,
      // shallow-merge seed defaults under persisted data so new fields appear after updates
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppData>
        const merged = {
          ...current,
          ...p,
          academics: {
            courseOptions: p.academics?.courseOptions ?? current.academics.courseOptions,
            assignmentTypeOptions: p.academics?.assignmentTypeOptions ?? current.academics.assignmentTypeOptions,
            classCenter: p.academics?.classCenter ?? current.academics.classCenter,
            migrationJournal: p.academics?.migrationJournal ?? current.academics.migrationJournal,
          },
          settings: {
            ...current.settings,
            ...p.settings,
            backup: { ...current.settings.backup, ...p.settings?.backup },
            calendar: { ...current.settings.calendar, ...p.settings?.calendar },
            listPreferences: p.settings?.listPreferences ?? current.settings.listPreferences,
            savedViews: p.settings?.savedViews ?? current.settings.savedViews,
            activeSavedViewIds: p.settings?.activeSavedViewIds ?? current.settings.activeSavedViewIds,
            attentionSnoozedUntil: p.settings?.attentionSnoozedUntil ?? current.settings.attentionSnoozedUntil,
            recommendationState: p.settings?.recommendationState ?? current.settings.recommendationState,
            mutedRecommendationRules: p.settings?.mutedRecommendationRules ?? current.settings.mutedRecommendationRules,
            projectionDismissals: p.settings?.projectionDismissals ?? current.settings.projectionDismissals,
            mascotNoteDismissals: p.settings?.mascotNoteDismissals ?? current.settings.mascotNoteDismissals,
          },
          mcat: { ...current.mcat, ...p.mcat },
          meta: {
            ...current.meta,
            ...p.meta,
            recoveryStack: p.meta?.recoveryStack ?? current.meta.recoveryStack,
          },
          trash: p.trash ?? current.trash,
          captures: p.captures ?? current.captures,
          notes: { ...current.notes, ...p.notes },
          profile: { ...current.profile, ...p.profile },
          goals: { ...current.goals, ...p.goals },
        }
        return migrateAll(merged as AppData) as unknown as Store
      },
    }
  )
)

/**
 * Change the browser cache that backs the live Zustand store.
 *
 * The account id is part of the local namespace, just as it is part of the
 * Supabase row key. Switching never copies the currently-open tree into the
 * destination. It loads that owner's existing cache, or a record-free root.
 */
function readWorkspaceData(storageKey: string): AppData | null {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: Partial<AppData>; version?: number }
    if (!parsed?.state || typeof parsed.state !== 'object') return null
    const seeded = { ...createPersonalInitialData(), ...parsed.state } as AppData
    // Respect the version zustand persisted alongside the state, exactly as
    // its own `migrate` option does. This path used to run all of `migrateAll`
    // on every workspace read, including data already at the current version:
    // the entire migration chain over the tree on each account switch. The migrations
    // are written to be idempotent, so this was cost and risk rather than a
    // known corruption — but re-running a migration on data it has already
    // transformed is the failure mode versioning exists to prevent.
    //
    // A version ahead of this build cannot be migrated backwards, so it is
    // read as-is; `merge` still layers in any fields this build expects.
    const version = typeof parsed.version === 'number' ? parsed.version : undefined
    if (version !== undefined && version >= CURRENT_STORE_VERSION) return seeded
    return migrateAll(seeded)
  } catch {
    return null
  }
}

export function activeAccountWorkspaceId(): string | null {
  const owner = activeWorkspaceOwner()
  return owner.kind === 'account' ? owner.userId : null
}

function activateWorkspace(owner: WorkspaceOwner, supplied?: AppData) {
  if (DEMO_MODE) return
  const previous = activeWorkspaceOwner()
  const ownerChanged = previous.kind !== owner.kind
    || (previous.kind === 'account' && owner.kind === 'account' && previous.userId !== owner.userId)
  if (ownerChanged) clearCalendarSession()
  const key = workspaceStorageKey(owner)
  // Anything already on this device has passed the version gate in
  // `readWorkspaceData`, and a fresh root is current by construction. Only
  // `supplied` (a cloud row, possibly written by an older client) still needs
  // the migration chain.
  const prepared = supplied ? undefined : readWorkspaceData(key) ?? createPersonalInitialData()
  setActiveWorkspaceOwner(owner)
  // Owner is set, so scoped keys now resolve to the destination. A legacy
  // unscoped cache that the previously-open workspace never adopted is
  // adopted here instead; once adopted, this is a no-op.
  migrateLegacyWorkspaceKeys()
  useStore.persist.setOptions({ name: key })
  // The write happens only after the destination namespace is selected, so
  // Account A can never be written into Account B or Guest by a switch.
  if (prepared) useStore.getState().adoptPreparedWorkspace(prepared)
  else useStore.getState().replaceAll(supplied as AppData)
}

export function activateAccountWorkspace(userId: string, supplied?: AppData) {
  const owner = { kind: 'account', userId } as const
  const cached = supplied ? readWorkspaceData(workspaceStorageKey(owner)) : null
  activateWorkspace(owner, supplied && cached ? mergeRemotePreservingLocal(supplied, cached) : supplied)
}

export function activateGuestWorkspace() {
  activateWorkspace({ kind: 'guest' })
}

/** Non-reactive snapshot of just the data (for export / backup). */
export function snapshotData(): AppData {
  const s = useStore.getState()
  return Object.fromEntries(DATA_KEYS.map((k) => [k, s[k]])) as unknown as AppData
}
