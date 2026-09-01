import { describe, expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { createInitialDataForMode, createResetDataForMode, migrateAll, snapshotData, useStore } from '@/store/store'

describe('personal first-run data', () => {
  it('creates a complete, record-free personal workspace', () => {
    const data = createInitialDataForMode(false)

    expect(data.profile).toMatchObject({ name: '', school: '', major: '', minors: [] })
    expect(data.academics.migrationJournal).toEqual([])
    expect(data.courses).toEqual([])
    expect(data.tasks).toEqual([])
    expect(data.requirements).toEqual([])
    expect(data.experiences).toEqual([])
    expect(data.academics.classCenter).toEqual({
      workspaces: [], topics: [], notes: [], assignments: [], files: [], keyPoints: [], sourceChunks: [],
      reviewEvents: [], retrievabilityPredictions: [], contacts: [], weakAreas: [], practiceExams: [], practiceQuestions: [], paperDrafts: [],
      assignedReadings: [], feedbackNotes: [], gradeCategories: [], mistakes: [], topicLinks: [], topicPredictions: [],
      savedPlans: [], plannerTerms: [], examPrepPlans: [], generatedFlashcardDecks: [], generatedMockAttempts: [],
      generatedRevisedNotes: [], professorEvidence: [], conceptCanvases: [], assessmentMaterials: [], assessmentAttempts: [],
      generatedMasteryOutlines: [], generatedUnitQuestionBanks: [],
      transcriptRecords: [], acknowledgedCatalogWarnings: [], planningProgramContext: {}, lectures: [], lectureFindings: [], lectureMaterialProposals: [],
      lectureNoteProposals: [], guideProposals: [], watchedNoteSources: [], watchedNoteProposals: [], termReports: [], focusSessions: [],
      reviewSessionPreferences: {
        defaultInput: 'microphone', interleave: true, weakFirst: true,
        workMinutes: 25, breakMinutes: 5, enforceBreaks: false, sound: true,
      },
    })
    expect(data.settings.calendar.useMockPreview).toBe(false)
  })

  it('keeps a distinct fixture-rich demo first run', () => {
    const personal = createInitialDataForMode(false)
    const demo = createInitialDataForMode(true)

    expect(personal.courses).toEqual([])
    expect(demo.courses.length).toBeGreaterThan(0)
    expect(demo.profile.name).toBe('Andy Quach')
  })

  it('resets real mode to a record-free personal workspace', () => {
    useStore.getState().replaceAll(createInitialDataForMode(true))

    useStore.getState().resetToSeed()

    const reset = snapshotData()
    expect(reset.profile).toMatchObject({ name: '', school: '', major: '', minors: [] })
    expect(reset.courses).toEqual([])
    expect(reset.tasks).toEqual([])
    expect(reset.requirements).toEqual([])
    expect(reset.academics.classCenter.workspaces).toEqual([])
    expect(reset.academics.classCenter.transcriptRecords).toEqual([])
  })

  it('restores the fixture-rich demo dataset for demo reset', () => {
    const reset = createResetDataForMode(true)

    expect(reset.profile.name).toBe('Andy Quach')
    expect(reset.courses.length).toBeGreaterThan(0)
    expect(reset.tasks.length).toBeGreaterThan(0)
    expect(reset.requirements.length).toBeGreaterThan(0)
  })

  it('returns a fresh structure and leaves the factory result independent', () => {
    const first = createPersonalInitialData()
    const second = createPersonalInitialData()

    first.academics.classCenter.topics.push({} as never)
    expect(second.academics.classCenter.topics).toEqual([])
  })

  it('preserves a complete existing personal namespace through replacement', () => {
    const existing = createInitialDataForMode(false)
    existing.profile.name = 'Existing student'
    existing.courses = [{
      id: 'course-existing', term: 'Fall 2026', code: 'BIOL 101', title: 'Biology', credits: 3,
      grade: '', bcpm: true, status: 'planned', inResidence: true, satisfies: [], order: 0,
    }]
    existing.tasks = [{
      id: 'task-existing', title: 'Read chapter 1', type: 'Assignment', progress: 'Not started',
      kanban: 'todo', archived: false, horizon: 'now', order: 0,
    }]
    // A returning namespace has already completed its one-time structural
    // migrations. A second hydration must preserve it byte-for-byte.
    const expected = migrateAll(structuredClone(existing))

    useStore.getState().replaceAll(structuredClone(expected))

    expect(snapshotData()).toEqual(expected)
  })
})
