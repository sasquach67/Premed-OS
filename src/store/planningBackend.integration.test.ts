import { describe, expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { migrateAll } from '@/store/store'

describe('Planning backend hydration boundary', () => {
  it('retains plan, term, course, coverage evidence, prior credit, grades, and context across JSON reload', () => {
    const data = createPersonalInitialData()
    data.academics.classCenter.planningProgramContext = {
      selectedProgramId: 'neuroscience-bs',
      matriculationTerm: 'Fall 2026',
      ideasCatalogYear: '2026-2027',
      updatedAt: 10,
    }
    data.academics.classCenter.plannerTerms.push({
      id: 'fall-2027', label: 'Fall 2027', kind: 'standard', origin: 'student-created',
      note: 'Before MCAT', createdAt: 1, updatedAt: 2, order: 0,
    })
    data.courses.push({
      id: 'course-nsci', term: 'Fall 2027', plannerTermId: 'fall-2027', code: 'NSCI 175',
      title: 'Introduction to Neuroscience', credits: 3, grade: '', bcpm: true,
      status: 'planned', inResidence: true, satisfies: ['Neuroscience: Introduction'],
      order: 0,
    }, {
      id: 'course-prior', term: 'Prior credit', code: 'BIO 101',
      title: 'Biology I', credits: 4, grade: 'A', bcpm: false,
      status: 'completed', inResidence: false, satisfies: [],
      transcript: {
        institution: 'Prior College', courseNumber: 'BIO 101', courseTitle: 'Biology I',
        termLabel: 'Fall 2024', creditHours: 4, gradeRecorded: 'A', courseType: 'transfer',
        capturedAt: 3, updatedAt: 3,
      },
      order: 1,
    })
    data.requirements.push({
      id: 'req-intro', group: 'Neuroscience B.S.', label: 'Introduction',
      satisfiedBy: ['NSCI 175'], done: false, sourceType: 'official',
      sourceLabel: 'UNC Catalog', sourceUrl: 'https://catalog.unc.edu/',
      lastVerified: '2026-06-27', verificationStatus: 'verified', order: 0,
    })
    data.academics.classCenter.acknowledgedCatalogWarnings.push({
      requirementId: 'req-intro', sourceVersion: '2026-2027', acknowledgedAt: 4,
    })
    data.academics.classCenter.transcriptRecords.push({
      id: 'transcript-1', courseId: 'course-prior', institution: 'Prior College',
      courseNumberExact: 'BIO 101', titleExact: 'Biology I', creditsExact: '4.0',
      gradeExact: 'A', term: 'Fall', year: '2024', courseType: 'transfer',
      createdAt: 3, updatedAt: 3, order: 0,
    })
    data.academics.classCenter.savedPlans.push({
      id: 'plan-1', name: 'Neuroscience plan', placements: [{
        courseId: 'course-nsci', term: 'Fall 2027', plannerTermId: 'fall-2027', status: 'planned',
      }],
      plannerTerms: data.academics.classCenter.plannerTerms.map((term) => ({ ...term })),
      createdAt: 5, updatedAt: 5, order: 0,
    })

    const reloaded = migrateAll(JSON.parse(JSON.stringify(data)))
    expect(reloaded.academics.classCenter.planningProgramContext).toEqual(data.academics.classCenter.planningProgramContext)
    expect(reloaded.academics.classCenter.plannerTerms).toEqual(data.academics.classCenter.plannerTerms)
    expect(reloaded.courses).toEqual(data.courses)
    expect(reloaded.requirements).toEqual(data.requirements)
    expect(reloaded.academics.classCenter.acknowledgedCatalogWarnings).toEqual(data.academics.classCenter.acknowledgedCatalogWarnings)
    expect(reloaded.academics.classCenter.transcriptRecords).toEqual(data.academics.classCenter.transcriptRecords)
    expect(reloaded.academics.classCenter.savedPlans).toEqual(data.academics.classCenter.savedPlans)
  })

  it('does not leak Planning migration changes into a Daily lecture record', () => {
    const legacy = createPersonalInitialData()
    legacy.academics.classCenter.lectures.push({
      id: 'lecture-1', courseId: 'course-1', title: 'Lecture 1', inputPath: 'pasted',
      processingState: 'ready', occurredOn: '2026-08-27', createdAt: 1, updatedAt: 1, order: 0,
    })
    const expected = JSON.parse(JSON.stringify(legacy.academics.classCenter.lectures))
    delete (legacy.academics.classCenter as { planningProgramContext?: unknown }).planningProgramContext
    expect(migrateAll(legacy).academics.classCenter.lectures).toEqual(expected)
  })
})
