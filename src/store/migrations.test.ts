/* Tests for the data-migration functions that run on every load/import.
   These are the functions most likely to corrupt user data if broken. */
import { describe, expect, it } from 'vitest'
import { CURRENT_STORE_VERSION, OLDEST_SUPPORTED_STORE_VERSION, migrateAcademicTags, migrateAll, migrateMascotNotes, migrateOrgReflections, migrateOverviewSchema, migrateRequirementMetadata, migrateSafetyNets } from '@/store/store'
import { createSeedData } from '@/data/seed'
import { migrateSyllabusV11 } from '@/store/migrations/syllabusV11'
import { migrateSchoolStatusV12 } from '@/store/migrations/schoolStatusV12'
import { migrateOverviewV13 } from '@/store/migrations/overviewV13'
import { migrateTimelineV14 } from '@/store/migrations/timelineV14'
import { migrateExperienceHoursV15 } from '@/store/migrations/experienceHoursV15'
import { migrateRoadmapTaskLinkV16 } from '@/store/migrations/roadmapTaskLinkV16'
import { migrateOverviewAttachmentsV17 } from '@/store/migrations/overviewAttachmentsV17'
import { migrateTaskHorizonsV18 } from '@/store/migrations/taskHorizonsV18'
import { migratePlannerTermsV29 } from '@/store/migrations/plannerTermsV29'
import { migrateRequirementsAuditV30 } from '@/store/migrations/requirementsAuditV30'
import { migrateTermReportsV31 } from '@/store/migrations/termReportsV31'
import { migrateReviewSessionV32 } from '@/store/migrations/reviewSessionV32'
import { migrateRetrievabilityPredictionsV33 } from '@/store/migrations/retrievabilityPredictionsV33'
import { migrateWritingEvidenceV34 } from '@/store/migrations/writingEvidenceV34'
import { migrateWatchedNotesV35 } from '@/store/migrations/watchedNotesV35'
import { migratePlanningLibraryV36 } from '@/store/migrations/planningLibraryV36'
import { isCatalogWarningAcknowledged } from '@/lib/academics/requirementsAudit'
import { migrateExamPrepV19 } from '@/store/migrations/examPrepV19'
import type { AppData, ClassWeakArea, Org, RequirementItem, TaskItem, Topic } from '@/lib/types'

function freshData(): AppData {
  return structuredClone(createSeedData())
}

it('declares the full supported local migration span', () => {
  expect(OLDEST_SUPPORTED_STORE_VERSION).toBe(0)
  expect(CURRENT_STORE_VERSION).toBe(46)
})

describe('migratePlanningLibraryV36', () => {
  it('adds an empty local planning context without inferring a program', () => {
    const data = freshData()
    delete (data.academics.classCenter as Partial<typeof data.academics.classCenter>).planningProgramContext
    const before = structuredClone(data)
    Object.freeze(data)
    Object.freeze(data.academics)
    Object.freeze(data.academics.classCenter)
    const out = migratePlanningLibraryV36(data)
    expect(out.academics.classCenter.planningProgramContext).toEqual({})
    expect({ ...out.academics.classCenter, planningProgramContext: undefined })
      .toEqual({ ...before.academics.classCenter, planningProgramContext: undefined })
    expect(data).toEqual(before)
  })
})

describe('migrateWatchedNotesV35', () => {
  it('adds empty watched-note collections without rewriting existing Academics data', () => {
    const data = freshData()
    delete (data.academics.classCenter as Partial<typeof data.academics.classCenter>).watchedNoteSources
    delete (data.academics.classCenter as Partial<typeof data.academics.classCenter>).watchedNoteProposals
    const before = structuredClone(data)
    Object.freeze(data)
    Object.freeze(data.academics)
    Object.freeze(data.academics.classCenter)

    const out = migrateWatchedNotesV35(data)

    expect(out.academics.classCenter.watchedNoteSources).toEqual([])
    expect(out.academics.classCenter.watchedNoteProposals).toEqual([])
    expect({ ...out.academics.classCenter, watchedNoteSources: undefined, watchedNoteProposals: undefined })
      .toEqual({ ...before.academics.classCenter, watchedNoteSources: undefined, watchedNoteProposals: undefined })
    expect(data).toEqual(before)
  })

  it('is a no-op when reviewed sources and proposals already exist', () => {
    const data = freshData()
    data.academics.classCenter.watchedNoteSources = [{
      id: 'source', provider: 'local-folder', rootLabel: 'GoodNotes', selectedAt: 1,
      reviewEachImport: true, confirmedMappings: [], createdAt: 1, updatedAt: 1,
    }]
    data.academics.classCenter.watchedNoteProposals = [{
      id: 'proposal', sourceId: 'source', stableKey: 'stable', displayPath: 'Week 1/notes.pdf', displayName: 'notes.pdf',
      mappingConfidence: 'needs-confirmation', mappingReason: 'Confirm the week before filing.', status: 'skipped', createdAt: 1, updatedAt: 1,
    }]
    expect(migrateWatchedNotesV35(data)).toBe(data)
  })
})

describe('migrateWritingEvidenceV34', () => {
  it('adds the honest reading-list boundary without rewriting existing records', () => {
    const data = freshData()
    data.academics.classCenter.workspaces.forEach((workspace) => delete (workspace as { readingListState?: string }).readingListState)
    const before = structuredClone(data)
    Object.freeze(data)
    Object.freeze(data.academics)
    Object.freeze(data.academics.classCenter)

    const out = migrateWritingEvidenceV34(data)

    expect(out.academics.classCenter.workspaces.every((workspace) => workspace.readingListState === 'unknown')).toBe(true)
    expect(out.academics.classCenter.paperDrafts).toEqual(before.academics.classCenter.paperDrafts)
    expect(out.academics.classCenter.assignedReadings).toEqual(before.academics.classCenter.assignedReadings)
    expect(out.academics.classCenter.feedbackNotes).toEqual(before.academics.classCenter.feedbackNotes)
    expect(migrateWritingEvidenceV34(out)).toBe(out)
  })
})

describe('migrateRetrievabilityPredictionsV33', () => {
  it('adds a future-only collection without rewriting saved review events', () => {
    const data = freshData()
    delete (data.academics.classCenter as Partial<typeof data.academics.classCenter>).retrievabilityPredictions
    const before = structuredClone(data)

    const out = migrateRetrievabilityPredictionsV33(data)

    expect(out.academics.classCenter.retrievabilityPredictions).toEqual([])
    expect(out.academics.classCenter.reviewEvents).toEqual(before.academics.classCenter.reviewEvents)
  })
})

describe('migrateReviewSessionV32', () => {
  it('adds honest defaults without changing frozen legacy records', () => {
    const data = freshData()
    delete (data.academics.classCenter as Partial<typeof data.academics.classCenter>).reviewSessionPreferences
    delete (data.academics.classCenter as Partial<typeof data.academics.classCenter>).focusSessions
    const before = structuredClone(data)
    Object.freeze(data)
    Object.freeze(data.academics)
    Object.freeze(data.academics.classCenter)

    const out = migrateReviewSessionV32(data)

    expect(out.academics.classCenter.reviewSessionPreferences.defaultInput).toBe('microphone')
    expect(out.academics.classCenter.focusSessions).toEqual([])
    expect({ ...out.academics.classCenter, reviewSessionPreferences: undefined, focusSessions: undefined })
      .toEqual({ ...before.academics.classCenter, reviewSessionPreferences: undefined, focusSessions: undefined })
    expect(data).toEqual(before)
  })

  it('is a no-op on a second pass and never clobbers saved session state', () => {
    const data = freshData()
    data.academics.classCenter.reviewSessionPreferences.workMinutes = 40
    data.academics.classCenter.focusSessions = [{ id: 'focus', courseId: 'course', startedAt: 1, completedAt: 2, durationSeconds: 1, order: 0 }]
    expect(migrateReviewSessionV32(data)).toBe(data)
    expect(migrateReviewSessionV32(data).academics.classCenter.focusSessions[0]?.id).toBe('focus')
  })
})

describe('migrateTermReportsV31', () => {
  it('adds an empty report collection without changing any existing Academics data', () => {
    const data = freshData()
    delete (data.academics.classCenter as Partial<typeof data.academics.classCenter>).termReports
    const before = structuredClone(data)
    Object.freeze(data)
    Object.freeze(data.academics)
    Object.freeze(data.academics.classCenter)

    const out = migrateTermReportsV31(data)

    expect(out.academics.classCenter.termReports).toEqual([])
    expect({ ...out.academics.classCenter, termReports: undefined })
      .toEqual({ ...before.academics.classCenter, termReports: undefined })
    expect(data).toEqual(before)
  })

  it('is idempotent and never clobbers a saved report', () => {
    const data = freshData()
    data.academics.classCenter.termReports = [{
      id: 'report', term: 'Fall 2026', courseIds: [], status: 'insufficient-evidence',
      snapshot: { term: 'Fall 2026', courseIds: [], facts: [], compiledAt: 1, evidenceLimit: 'limit' },
      blocks: [], selectedFileIds: [], createdAt: 1, updatedAt: 1, order: 0,
    }]
    expect(migrateTermReportsV31(data)).toBe(data)
    expect(migrateTermReportsV31(data).academics.classCenter.termReports[0]?.id).toBe('report')
  })
})

describe('migrateRequirementsAuditV30', () => {
  it('adds an empty acknowledgement collection without inventing transcript context', () => {
    const data = freshData()
    data.courses = [{
      id: 'legacy-course', term: 'Prior credit', code: 'BIOL 101', title: 'Biology', credits: 3,
      grade: 'P', bcpm: true, status: 'completed', inResidence: false, satisfies: [], order: 0,
    }]
    delete (data.academics.classCenter as Partial<typeof data.academics.classCenter>).acknowledgedCatalogWarnings
    const before = structuredClone(data)
    Object.freeze(data)
    Object.freeze(data.courses)
    Object.freeze(data.academics)
    Object.freeze(data.academics.classCenter)

    const out = migrateRequirementsAuditV30(data)

    expect(out.academics.classCenter.acknowledgedCatalogWarnings).toEqual([])
    expect(out.courses[0]).toEqual(before.courses[0])
    expect(out.courses[0]).not.toHaveProperty('transcript')
    expect(data).toEqual(before)
  })

  it('is idempotent and preserves acknowledgements exactly', () => {
    const data = freshData()
    data.academics.classCenter.acknowledgedCatalogWarnings = [{
      requirementId: 'req-1', sourceVersion: '2026-2027|https://catalog.unc.edu', acknowledgedAt: 123,
    }]

    expect(migrateRequirementsAuditV30(data)).toBe(data)
    expect(migrateRequirementsAuditV30(data).academics.classCenter.acknowledgedCatalogWarnings)
      .toEqual(data.academics.classCenter.acknowledgedCatalogWarnings)
  })

  it('keeps a saved acknowledgement through hydration without mutating requirement metadata', () => {
    const data = freshData()
    const requirement = data.requirements.find((item) => item.verificationStatus === 'needs-verification')!
    const saved = structuredClone(data)
    saved.academics.classCenter.acknowledgedCatalogWarnings = [{
      requirementId: requirement.id,
      sourceVersion: `${requirement.lastVerified ?? 'undated'}|${requirement.sourceUrl ?? 'no-source'}`,
      acknowledgedAt: 456,
    }]

    const reloaded = migrateAll(JSON.parse(JSON.stringify(saved)) as AppData)

    expect(isCatalogWarningAcknowledged(reloaded.academics.classCenter.acknowledgedCatalogWarnings, reloaded.requirements.find((item) => item.id === requirement.id)!)).toBe(true)
    expect(reloaded.requirements.find((item) => item.id === requirement.id)?.verificationStatus).toBe(requirement.verificationStatus)
  })
})

describe('migratePlannerTermsV29', () => {
  it('adds durable legacy-derived slots without losing course records', () => {
    const data = freshData()
    data.courses = [{
      id: 'chem', term: 'Fall 2026', code: 'CHEM 101', title: 'Chemistry', credits: 4,
      grade: '', bcpm: true, status: 'planned', inResidence: true, satisfies: [], order: 0,
    }]
    delete (data.academics.classCenter as Partial<typeof data.academics.classCenter>).plannerTerms
    const before = structuredClone(data)
    Object.freeze(data)
    Object.freeze(data.courses)
    Object.freeze(data.academics)
    Object.freeze(data.academics.classCenter)

    const out = migratePlannerTermsV29(data)
    expect(out.academics.classCenter.plannerTerms).toMatchObject([{
      id: 'planner-term-fall-2026', label: 'Fall 2026', origin: 'legacy-derived', kind: 'standard',
    }])
    expect(out.courses[0]).toMatchObject({ ...before.courses[0], plannerTermId: 'planner-term-fall-2026' })
    expect(data).toEqual(before)
  })

  it('is a no-op when planner terms already exist', () => {
    const data = freshData()
    data.courses = []
    data.academics.classCenter.plannerTerms = []
    expect(migratePlannerTermsV29(data)).toBe(data)
  })

  it('removes a legacy prior-credit slot without deleting its transcript-backed course', () => {
    const data = freshData()
    data.courses = [{
      id: 'transfer', term: 'Prior credit', plannerTermId: 'planner-term-prior-credit', code: 'BIO 101', title: 'Biology', credits: 4,
      grade: 'A', bcpm: false, status: 'completed', inResidence: false, satisfies: [], order: 0,
    }]
    data.academics.classCenter.plannerTerms = [{
      id: 'planner-term-prior-credit', label: 'Prior credit', kind: 'standard', origin: 'legacy-derived', createdAt: 0, updatedAt: 0, order: 0,
    }]

    const out = migratePlannerTermsV29(data)
    expect(out.academics.classCenter.plannerTerms).toEqual([])
    expect(out.courses).toHaveLength(1)
    expect(out.courses[0]).not.toHaveProperty('plannerTermId')
  })
})

describe('migrateExamPrepV19', () => {
  it('adds an empty exam-plan collection without rewriting legacy class data', () => {
    const data = structuredClone(freshData())
    delete (data.academics.classCenter as Partial<typeof data.academics.classCenter>).examPrepPlans
    const before = structuredClone(data)
    Object.freeze(data)
    Object.freeze(data.academics)
    Object.freeze(data.academics.classCenter)

    const out = migrateExamPrepV19(data)

    expect(out.academics.classCenter.examPrepPlans).toEqual([])
    expect({ ...out.academics.classCenter, examPrepPlans: undefined }).toEqual({ ...before.academics.classCenter, examPrepPlans: undefined })
    expect(data).toEqual(before)
  })

  it('is idempotent and preserves a populated plan exactly', () => {
    const data = structuredClone(freshData())
    data.academics.classCenter.examPrepPlans = [{
      id: 'plan-1', courseId: 'course-1', examAssignmentId: 'exam-1', intensity: 'steady',
      items: [], createdAt: 1, updatedAt: 1,
    }]
    expect(migrateExamPrepV19(data)).toBe(data)
    expect(migrateExamPrepV19(data).academics.classCenter.examPrepPlans).toEqual(data.academics.classCenter.examPrepPlans)
  })
})

describe('migrateTaskHorizonsV18', () => {
  it('moves legacy undated Soon defaults to Now without changing dated or finished tasks', () => {
    const data = freshData()
    data.tasks = [
      { id: 'legacy-undated', title: 'Legacy no date', type: 'Task', progress: 'Not started', kanban: 'todo', archived: false, horizon: 'soon', order: 0 },
      { id: 'dated-soon', title: 'Set for later', type: 'Task', deadline: '2026-09-01', progress: 'Not started', kanban: 'todo', archived: false, horizon: 'soon', order: 1 },
      { id: 'done-undated', title: 'Completed', type: 'Task', progress: 'Finished', kanban: 'done', archived: false, horizon: 'soon', order: 2 },
    ] as TaskItem[]

    const out = migrateTaskHorizonsV18(data)

    expect(out.tasks.map((task) => task.horizon)).toEqual(['now', 'soon', 'soon'])
    expect(out.tasks[0]).toMatchObject({ id: 'legacy-undated', title: 'Legacy no date' })
    expect(out.tasks[0]).not.toHaveProperty('deadline')
    expect(migrateTaskHorizonsV18(out)).toBe(out)
  })
})

describe('migrateOverviewAttachmentsV17', () => {
  it('does not invent a file reference or change an existing Story Bank record', () => {
    const data = freshData()
    data.stories = [{ id: 'story', prompt: '', title: '', commentary: 'A note', tags: [], origin: 'overview', capturedAt: 1, order: 0 }]
    const before = structuredClone(data)
    Object.freeze(data)
    Object.freeze(data.stories)

    expect(migrateOverviewAttachmentsV17(data)).toBe(data)
    expect(data).toEqual(before)
  })

  it('is idempotent and preserves an explicit device-local attachment', () => {
    const data = freshData()
    data.stories = [{
      id: 'story', prompt: '', title: '', commentary: '', tags: [], origin: 'overview', capturedAt: 1, order: 0,
      attachment: { blobRef: 'idb://overview/capture/story', fileName: 'notes.pdf', mimeType: 'application/pdf', fileSize: 12, storage: 'device-local' },
    }]

    expect(migrateOverviewAttachmentsV17(data)).toBe(data)
    expect(migrateOverviewAttachmentsV17(data)).toBe(data)
    expect(data.stories[0].attachment).toMatchObject({ fileName: 'notes.pdf', storage: 'device-local' })
  })
})

describe('migrateRoadmapTaskLinkV16', () => {
  it('does not infer a relationship or rewrite any existing milestone/task field', () => {
    const data = freshData()
    data.timelineMilestones = [{ id: 'milestone', title: 'Draft statement', completed: false, order: 0 }]
    data.tasks = [{ id: 'task', title: 'A separate task', type: 'Task', progress: 'Not started', kanban: 'todo', archived: false, order: 0 }]
    const before = structuredClone(data)
    Object.freeze(data)
    Object.freeze(data.timelineMilestones)
    Object.freeze(data.tasks)

    expect(migrateRoadmapTaskLinkV16(data)).toBe(data)
    expect(data).toEqual(before)
  })

  it('is idempotent and preserves an existing explicit link', () => {
    const data = freshData()
    data.timelineMilestones = [{ id: 'milestone', title: 'Draft statement', completed: false, implementationTaskId: 'task', order: 0 }]
    const once = migrateRoadmapTaskLinkV16(data)
    expect(once).toBe(data)
    expect(migrateRoadmapTaskLinkV16(once)).toBe(data)
    expect(once.timelineMilestones[0].implementationTaskId).toBe('task')
  })
})

describe('migrateExperienceHoursV15', () => {
  it('preserves every legacy aggregate as one estimated block without inventing a date', () => {
    const data = createSeedData()
    data.experiences = [{ id: 'clinical', category: 'clinical', org: 'Clinic', role: 'Volunteer', startDate: '2026-06-01', hours: 24, description: '', status: 'active', tags: [], order: 0 }]
    const frozen = structuredClone(data)
    Object.freeze(data)
    Object.freeze(data.experiences)
    const out = migrateExperienceHoursV15(data)
    expect(data).toEqual(frozen)
    expect(out.experienceHourEntries).toEqual([expect.objectContaining({
      experienceId: 'clinical', hours: 24, kind: 'estimated', periodStart: '2026-06-01',
    })])
    expect(out.experienceHourEntries[0]).not.toHaveProperty('date')
  })

  it('is idempotent and never clobbers existing hour entries', () => {
    const data = createSeedData()
    data.experiences = [{ id: 'clinical', category: 'clinical', org: 'Clinic', role: 'Volunteer', hours: 24, description: '', status: 'active', tags: [], order: 0 }]
    data.experienceHourEntries = [{ id: 'measured', experienceId: 'clinical', hours: 3, kind: 'logged', date: '2026-08-01', createdAt: 1, updatedAt: 1, archived: false, order: 0 }]
    const once = migrateExperienceHoursV15(data)
    expect(once.experienceHourEntries).toHaveLength(2)
    expect(migrateExperienceHoursV15(once)).toBe(once)
    expect(once.experienceHourEntries.find((entry) => entry.id === 'measured')).toMatchObject({ hours: 3, kind: 'logged' })
  })
})

describe('migrateTimelineV14', () => {
  it('moves a legacy milestone into Timeline without dropping or rewriting its task record', () => {
    const data = freshData()
    delete (data as Partial<AppData>).timelineMilestones
    data.tasks = [{
      id: 'legacy-roadmap', title: 'Submit primary', type: 'Application', deadline: '2029-05-30',
      progress: 'Finished', kanban: 'done', notes: 'Use the verified packet.', archived: false,
      milestone: true, horizon: 'soon', important: false, order: 7,
    }]
    const before = structuredClone(data.tasks[0])
    Object.freeze(data.tasks[0])
    Object.freeze(data.tasks)

    const out = migrateTimelineV14(data)

    expect(out.timelineMilestones).toEqual([{
      id: 'timeline-milestone-legacy-roadmap', title: 'Submit primary', targetDate: '2029-05-30',
      detail: 'Use the verified packet.', completed: true, legacyTaskId: 'legacy-roadmap', order: 0,
    }])
    expect(out.tasks[0]).toEqual({ ...before, timelineMilestoneId: 'timeline-milestone-legacy-roadmap' })
    expect(data.tasks[0]).toEqual(before)
  })

  it('is idempotent once the legacy relationship and Timeline record exist', () => {
    const data = freshData()
    const once = migrateTimelineV14(data)
    expect(migrateTimelineV14(once)).toBe(once)
  })
})

describe('migrateOverviewV13', () => {
  it('adds an explicit goal kind without changing any legacy goal field', () => {
    const data = freshData()
    data.quarterlyGoals = [
      { id: 'manual', quarter: 'Fall', text: 'Send the email', done: false, order: 0 } as never,
      { id: 'linked', quarter: 'Fall', text: 'Record clinical hours', done: false, standingTarget: 'clinical', order: 1 } as never,
    ]
    const before = structuredClone(data.quarterlyGoals)
    Object.freeze(data.quarterlyGoals[0])
    Object.freeze(data.quarterlyGoals)

    const out = migrateOverviewV13(data)

    expect(out.quarterlyGoals[0]).toEqual({ ...before[0], kind: 'check-off' })
    expect(out.quarterlyGoals[1]).toEqual({ ...before[1], kind: 'measured' })
    expect(data.quarterlyGoals[0]).toEqual(before[0])
  })

  it('is a no-op once every goal has a confirmed kind', () => {
    const data = freshData()
    expect(migrateOverviewV13(data)).toBe(data)
    expect(migrateOverviewV13(migrateOverviewV13(data))).toBe(data)
  })
})

describe('migrateSchoolStatusV12', () => {
  it('archives a school record while retaining only the applied event and its student note', () => {
    const data = freshData()
    data.schools = [{ id: 'school-1', name: 'Example', type: 'MD', category: 'target', status: 'rejected' as never, whyItIsOnMyList: 'A strong rural-health fit.', order: 0 }]
    const out = migrateSchoolStatusV12(data)
    expect(out.schools).toHaveLength(1)
    expect(out.schools[0]).toMatchObject({ id: 'school-1', name: 'Example', status: 'applied', whyItIsOnMyList: 'A strong rural-health fit.' })
    expect(out.schools[0].archivedAt).toEqual(expect.any(String))
  })
})

describe('migrateSyllabusV11', () => {
  it('adds an empty grade category array without changing legacy data', () => {
    const data = freshData()
    delete (data.academics.classCenter as Partial<typeof data.academics.classCenter>).gradeCategories
    const before = structuredClone(data)
    const out = migrateSyllabusV11(data)
    expect(out.academics.classCenter.gradeCategories).toEqual([])
    expect({ ...out.academics.classCenter, gradeCategories: undefined }).toEqual({ ...before.academics.classCenter, gradeCategories: undefined })
  })

  it('is a no-op when categories already exist', () => {
    const data = freshData()
    data.academics.classCenter.gradeCategories = [{ id: 'category-1', courseId: 'course-1', name: 'Exams', weight: 60, createdAt: 1, updatedAt: 1, order: 0 }]
    expect(migrateSyllabusV11(data)).toBe(data)
    expect(migrateSyllabusV11(data).academics.classCenter.gradeCategories).toEqual(data.academics.classCenter.gradeCategories)
  })
})

describe('migrateAcademicTags', () => {
  it('never writes to frozen input (immer-produced state is read-only)', () => {
    // Deep clone first: createSeedData() shares structure, and freezing it
    // would leak into every other test in this file.
    const data = structuredClone(freshData())
    data.academics.classCenter.topics = [
      { id: 'frozen-topic', confidence: 5, status: 'mastered' },
    ] as unknown as Topic[]
    data.tasks = [
      { id: 'frozen-task', course: 'BIOL 252', type: 'Exam', title: 'Midterm' },
    ] as unknown as TaskItem[]

    // Freeze the way immer does: the rows the migration wants to rewrite.
    Object.freeze(data.academics.classCenter.topics[0])
    Object.freeze(data.academics.classCenter.topics)
    Object.freeze(data.tasks[0])
    Object.freeze(data.tasks)
    Object.freeze(data.academics.classCenter)
    Object.freeze(data.academics)

    const out = migrateAcademicTags(data)

    // Normalisation still happened — on copies.
    expect(out.academics.classCenter.topics[0].confidence).toBe(3)
    expect(out.academics.classCenter.topics[0].status).toBe('ready')
    expect(out.tasks[0].courseId).toBeTruthy()
    // The caller's objects are untouched.
    expect(data.academics.classCenter.topics[0].confidence).toBe(5)
    expect(data.tasks[0].courseId).toBeUndefined()
    expect(out.academics.classCenter.topics[0]).not.toBe(data.academics.classCenter.topics[0])
  })

  it('recreates missing academics containers on legacy data', () => {
    const data = freshData()
    // simulate a pre-classCenter backup (no academics, no sources to backfill from)
    delete (data as Partial<AppData>).academics
    data.courses = []
    data.tasks = []
    const out = migrateAcademicTags(data)
    expect(out.academics.courseOptions).toEqual([])
    expect(out.academics.classCenter.workspaces).toBeDefined()
    expect(out.academics.classCenter.practiceExams).toEqual([])
  })

  it('clamps legacy 1-5 topic confidence to the 1-3 scale', () => {
    const data = freshData()
    data.academics.classCenter.topics = [
      { id: 'a', confidence: 5, status: 'mastered' },
      { id: 'b', confidence: 1, status: 'seen' },
      { id: 'c', confidence: 2, status: 'weak' },
    ] as unknown as Topic[]
    const out = migrateAcademicTags(data)
    const [a, b, c] = out.academics.classCenter.topics
    expect(a.confidence).toBe(3)
    expect(a.status).toBe('ready') // 'mastered' renamed
    expect(b.confidence).toBe(1)
    expect(c.confidence).toBe(2)
    // link arrays are backfilled so UI code can push without guards
    expect(a.linkedNoteIds).toEqual([])
    expect(a.linkedAssignmentIds).toEqual([])
  })

  it('clamps legacy weak-area severity the same way', () => {
    const data = freshData()
    data.academics.classCenter.weakAreas = [
      { id: 'w1', severity: 4 },
      { id: 'w2', severity: 0 },
    ] as unknown as ClassWeakArea[]
    const out = migrateAcademicTags(data)
    expect(out.academics.classCenter.weakAreas[0].severity).toBe(3)
    expect(out.academics.classCenter.weakAreas[1].severity).toBe(1)
  })

  it('backfills courseId/typeId on legacy string-tagged tasks, reusing options case-insensitively', () => {
    const data = freshData()
    data.academics.courseOptions = []
    data.academics.assignmentTypeOptions = []
    data.courses = []
    data.tasks = [
      { id: 't1', title: 'PS 1', course: 'CHEM 101', type: 'Homework', progress: 'Not started', kanban: 'todo', archived: false, order: 0 },
      { id: 't2', title: 'PS 2', course: 'chem 101', type: 'homework', progress: 'Not started', kanban: 'todo', archived: false, order: 1 },
    ] as unknown as TaskItem[]
    const out = migrateAcademicTags(data)
    expect(out.tasks[0].courseId).toBeDefined()
    // same course, different casing → same option (no duplicates)
    expect(out.tasks[1].courseId).toBe(out.tasks[0].courseId)
    expect(out.academics.courseOptions).toHaveLength(1)
    expect(out.academics.assignmentTypeOptions).toHaveLength(1)
  })

  it('is idempotent — running twice changes nothing', () => {
    const once = migrateAcademicTags(freshData())
    const twice = migrateAcademicTags(JSON.parse(JSON.stringify(once)) as AppData)
    expect(JSON.stringify(twice.academics)).toBe(JSON.stringify(once.academics))
  })
})

describe('migrateSafetyNets', () => {
  it('adds recovery and per-list view containers to legacy data without changing records', () => {
    const data = freshData()
    const courseIds = data.courses.map((course) => course.id)
    delete (data as Partial<AppData>).trash
    delete (data.settings as Partial<AppData['settings']>).listPreferences
    delete (data.settings as Partial<AppData['settings']>).savedViews
    delete (data.settings as Partial<AppData['settings']>).activeSavedViewIds
    delete (data.meta as Partial<AppData['meta']>).recoveryStack

    const out = migrateSafetyNets(data)
    expect(out.trash).toEqual([])
    expect(out.settings.listPreferences).toEqual({})
    expect(out.settings.savedViews).toEqual({})
    expect(out.settings.activeSavedViewIds).toEqual({})
    expect(out.meta.recoveryStack).toEqual([])
    expect(out.courses.map((course) => course.id)).toEqual(courseIds)
  })
})

describe('migrateOverviewSchema', () => {
  it('adds task planning fields without changing legacy task content', () => {
    const data = freshData()
    const original = {
      id: 'legacy-task',
      title: 'Preserve every field',
      type: 'Personal',
      deadline: '2026-08-01',
      progress: 'Working on',
      kanban: 'doing',
      notes: 'Do not lose this note.',
      archived: false,
      milestone: false,
      order: 9,
    } as TaskItem
    data.tasks = [original]

    const out = migrateOverviewSchema(data)
    expect(out.tasks[0]).toMatchObject({
      ...original,
      horizon: 'now',
      important: false,
    })
  })

  it('preserves a legacy source URL in the source capture collection without deleting the note', () => {
    const data = freshData()
    delete (data as Partial<AppData>).captures
    delete (data.settings as Partial<AppData['settings']>).projectionDismissals
    data.notes['home-ideas'] = 'https://example.com/source'

    const out = migrateOverviewSchema(data)
    expect(out.notes['home-ideas']).toBe('https://example.com/source')
    expect(out.captures).toHaveLength(1)
    expect(out.captures[0]).toMatchObject({
      id: 'capture-legacy-home-ideas',
      kind: 'source',
      url: 'https://example.com/source',
      origin: 'overview',
    })
    expect(out.settings.projectionDismissals).toEqual({})
  })

  it('moves a legacy plain-text scratchpad into Story Bank idempotently', () => {
    const data = freshData()
    data.notes['home-ideas'] = 'A thought worth keeping'
    const once = migrateOverviewSchema(data)
    const twice = migrateOverviewSchema(JSON.parse(JSON.stringify(once)) as AppData)
    expect(once.stories.find((story) => story.id === 'story-legacy-home-ideas')).toMatchObject({
      commentary: 'A thought worth keeping',
      prompt: '',
      title: '',
      origin: 'overview',
    })
    expect(once.captures).toEqual([])
    expect(twice.stories).toEqual(once.stories)
    expect(twice.captures).toEqual(once.captures)
  })

  it('moves existing Overview idea captures into Story Bank but preserves source captures', () => {
    const data = freshData()
    data.captures = [
      { id: 'idea-1', kind: 'idea', content: 'A brain dump', createdAt: 10, updatedAt: 11, origin: 'overview', order: 0 },
      { id: 'source-1', kind: 'source', content: 'Lecture link', url: 'https://example.com', createdAt: 12, updatedAt: 12, origin: 'overview', order: 1 },
    ]

    const out = migrateOverviewSchema(data)

    expect(out.stories.find((story) => story.id === 'story-idea-1')).toMatchObject({
      commentary: 'A brain dump',
      capturedAt: 10,
      updatedAt: 11,
      origin: 'overview',
    })
    expect(out.captures).toEqual([data.captures[1]])
  })
})

describe('migrateMascotNotes', () => {
  it('adds the dismissal map without changing existing settings', () => {
    const data = freshData()
    data.settings.theme = 'dark'
    delete (data.settings as Partial<AppData['settings']>).mascotNoteDismissals

    const out = migrateMascotNotes(data)

    expect(out.settings.mascotNoteDismissals).toEqual({})
    expect(out.settings.theme).toBe('dark')
  })

  it('is idempotent and preserves recorded dismissals', () => {
    const data = freshData()
    data.settings.mascotNoteDismissals = { 'academics-review-queue': 1234 }

    const once = migrateMascotNotes(data)
    const twice = migrateMascotNotes(JSON.parse(JSON.stringify(once)) as AppData)

    expect(twice.settings.mascotNoteDismissals).toEqual({ 'academics-review-queue': 1234 })
  })
})

describe('migrateRequirementMetadata', () => {
  function req(partial: Partial<RequirementItem>): RequirementItem {
    return {
      id: 'r1',
      group: 'Major — Core',
      label: 'NSCI 175',
      done: false,
      order: 0,
      ...partial,
    } as RequirementItem
  }

  it('removes standalone Organismal requirements and leaves a migration note', () => {
    const data = freshData()
    data.requirements = [
      req({ id: 'r1', group: 'Organismal', label: 'Organismal' }),
      req({ id: 'r2', label: 'BIOL 101' }),
    ]
    const out = migrateRequirementMetadata(data)
    expect(out.requirements.map((r) => r.id)).toEqual(['r2'])
    expect(out.notes['tar-heel-organismal-migration']).toContain('Organismal')
  })

  it('attaches source metadata by group and flags uncertain labels', () => {
    const data = freshData()
    data.requirements = [
      req({ id: 'r1', group: 'University graduation rules', label: '120 credit hours' }),
      req({ id: 'r2', group: 'Major — Core', label: 'Options: pick from Knowledge Electives' }),
    ]
    const out = migrateRequirementMetadata(data)
    expect(out.requirements[0].sourceType).toBe('official')
    expect(out.requirements[0].verificationStatus).toBe('verified')
    expect(out.requirements[1].verificationStatus).toBe('needs-verification')
  })

  it('never downgrades an explicit verificationStatus', () => {
    const data = freshData()
    data.requirements = [req({ verificationStatus: 'verified', label: 'Options: something uncertain' })]
    const out = migrateRequirementMetadata(data)
    expect(out.requirements[0].verificationStatus).toBe('verified')
  })
})

describe('migrateOrgReflections', () => {
  function org(partial: Partial<Org>): Org {
    return {
      id: 'org-1',
      name: 'Carolina EMS',
      type: 'Volunteer org',
      role: 'EMT-B Crew',
      status: 'member',
      reflection: '',
      reflections: [],
      opportunities: '',
      meetingInfo: '',
      link: '',
      order: 0,
      ...partial,
    }
  }

  it('converts a legacy reflection string into one journal entry', () => {
    const data = freshData()
    data.orgs = [org({ reflection: 'First ride-along moment.' })]
    const out = migrateOrgReflections(data)
    expect(out.orgs[0].reflections).toHaveLength(1)
    expect(out.orgs[0].reflections[0].title).toBe('Imported note')
    expect(out.orgs[0].reflections[0].body).toBe('First ride-along moment.')
    expect(out.orgs[0].reflections[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('does not create an entry for an empty legacy reflection', () => {
    const data = freshData()
    data.orgs = [org({ reflection: '   ' })]
    const out = migrateOrgReflections(data)
    expect(out.orgs[0].reflections).toEqual([])
  })

  it('is idempotent after the first conversion', () => {
    const data = freshData()
    data.orgs = [org({ reflection: 'Do not duplicate me.' })]
    const once = migrateOrgReflections(data)
    const twice = migrateOrgReflections(JSON.parse(JSON.stringify(once)) as AppData)
    expect(twice.orgs[0].reflections).toHaveLength(1)
    expect(twice.orgs[0].reflections).toEqual(once.orgs[0].reflections)
  })
})

/* The contract that ties every migration together: `migrateAll` runs against
   state produced by immer, which is deeply frozen. Any migration that writes
   to its input throws the moment a user interacts with the app. These are the
   regression guards — the chain test alone would have caught all four. */

/** Freeze every object and array in the tree, the way immer does. */
function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value as object)) return value
  seen.add(value as object)
  for (const key of Object.getOwnPropertyNames(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    // Skip getters (the classCenter `classes` view) — reading is enough.
    if (descriptor && 'value' in descriptor) deepFreeze(descriptor.value, seen)
  }
  return Object.freeze(value)
}

describe('migrations never write to frozen input', () => {
  it('migrateSafetyNets rebuilds missing containers without mutating', () => {
    const data = structuredClone(freshData())
    delete (data as Partial<AppData>).trash
    delete (data.meta as Partial<AppData['meta']>).recoveryStack
    deepFreeze(data)

    const out = migrateSafetyNets(data)
    expect(out.trash).toEqual([])
    expect(out.meta.recoveryStack).toEqual([])
    expect(data.trash).toBeUndefined()
    expect(out).not.toBe(data)
  })

  it('migrateOverviewSchema backfills tasks and Story Bank captures without mutating', () => {
    const data = structuredClone(freshData())
    delete (data as Partial<AppData>).captures
    data.notes['home-ideas'] = 'A thought worth keeping'
    data.tasks = [
      { id: 't1', title: 'Legacy', type: 'Personal', progress: 'Not started', kanban: 'todo', archived: false, order: 0 },
    ] as unknown as TaskItem[]
    deepFreeze(data)

    const out = migrateOverviewSchema(data)
    expect(out.tasks[0].important).toBe(false)
    expect(out.tasks[0].horizon).toBe('now')
    expect(out.stories.some((story) => story.id === 'story-legacy-home-ideas')).toBe(true)
    expect(out.captures).toHaveLength(0)
    // Caller untouched.
    expect(data.tasks[0].important).toBeUndefined()
    expect(data.captures).toBeUndefined()
  })

  it('migrateOrgReflections imports the legacy note without mutating', () => {
    const data = structuredClone(freshData())
    data.orgs = [
      { id: 'o1', name: 'Club', reflection: 'An old reflection', order: 0 },
    ] as unknown as Org[]
    deepFreeze(data)

    const out = migrateOrgReflections(data)
    expect(out.orgs[0].reflections).toHaveLength(1)
    expect(out.orgs[0].reflections?.[0].body).toBe('An old reflection')
    expect(data.orgs[0].reflections).toBeUndefined()
    expect(out.orgs[0]).not.toBe(data.orgs[0])
  })

  it('the whole migrateAll chain survives a deep-frozen tree', () => {
    const data = deepFreeze(structuredClone(freshData()))
    // The real failure mode: this threw on interaction, not on load.
    expect(() => migrateAll(data)).not.toThrow()
    const out = migrateAll(data)
    // Still a usable tree, and the caller's copy is untouched.
    expect(out.academics.classCenter).toBeDefined()
    expect(out.trash).toBeDefined()
    expect(Object.isFrozen(data)).toBe(true)
  })

  it('the chain survives a deep-frozen LEGACY tree, where every backfill fires', () => {
    // A current seed already has these containers, so the `??=` branches never
    // run and the chain test passes without exercising them. Strip them to make
    // every migration actually write something.
    const data = structuredClone(freshData()) as unknown as Record<string, unknown>
    const settings = data.settings as Record<string, unknown>
    const meta = data.meta as Record<string, unknown>
    const academics = data.academics as Record<string, unknown>
    const center = academics.classCenter as Record<string, unknown>

    for (const key of ['trash', 'captures', 'persons', 'organizations']) delete data[key]
    for (const key of [
      'listPreferences', 'savedViews', 'activeSavedViewIds', 'attentionSnoozedUntil',
      'recommendationState', 'mutedRecommendationRules', 'projectionDismissals', 'mascotNoteDismissals',
    ]) delete settings[key]
    delete meta.recoveryStack
    delete academics.migrationJournal
    for (const key of ['reviewEvents', 'contacts']) delete center[key]
    ;(data.notes as Record<string, string>)['home-ideas'] = 'A legacy scratchpad note'

    // Put the class centre back into its pre-v4 shape (`classes`, not
    // `workspaces`) so academicsV4 takes its real migration branch — course
    // creation, journal writes, workspace rebuild — instead of the cheap
    // already-migrated path that skips every mutation site.
    academics.classCenter = {
      classes: [
        { id: 'legacy-biol', courseCode: 'BIOL103', courseTitle: 'How Cells Function', semester: 'Fall 2026', order: 0 },
        { id: 'legacy-unknown', courseCode: '', courseTitle: 'Missing identity', semester: '', order: 1 },
      ],
      topics: [], notes: [], assignments: [], files: [], contacts: [], weakAreas: [],
      practiceExams: [], practiceQuestions: [], reviewEvents: [],
    }

    const frozen = deepFreeze(data) as unknown as AppData
    expect(() => migrateAll(frozen)).not.toThrow()

    const out = migrateAll(frozen)
    // Containers restored on the copy...
    expect(out.trash).toEqual([])
    expect(out.meta.recoveryStack).toEqual([])
    expect(out.settings.recommendationState).toEqual({})
    expect(out.settings.mascotNoteDismissals).toEqual({})
    expect(out.academics.migrationJournal).toBeDefined()
    expect(out.academics.classCenter.reviewEvents).toEqual([])
    expect(out.stories.some((story) => story.id === 'story-legacy-home-ideas')).toBe(true)
    // ...and never on the caller's frozen tree.
    expect((frozen as unknown as Record<string, unknown>).trash).toBeUndefined()
  })
})
