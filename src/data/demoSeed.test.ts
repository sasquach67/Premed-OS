import { beforeEach, describe, expect, it } from 'vitest'
import { createDemoData } from './demoSeed'
import {
  activeStorageKey, clearUnstampedDemoNamespace, DEMO_MODE_FLAG, DEMO_STAMP_KEY,
  DEMO_STAMP_VALUE, DEMO_STORAGE_KEY, REAL_STORAGE_KEY, stampDemoNamespace,
} from '@/lib/demoMode'
import { academicsNextActions } from '@/lib/intelligence/recommendations'

describe('site-wide demo data', () => {
  beforeEach(() => localStorage.clear())

  it('uses a fully separate namespace without touching real data', () => {
    localStorage.setItem(REAL_STORAGE_KEY, 'real-user-sentinel')
    localStorage.setItem(DEMO_MODE_FLAG, 'on')
    expect(activeStorageKey()).toBe(DEMO_STORAGE_KEY)
    expect(localStorage.getItem(REAL_STORAGE_KEY)).toBe('real-user-sentinel')
  })

  it('discards a demo blob it did not seed, and never reads the real namespace', () => {
    localStorage.setItem(REAL_STORAGE_KEY, 'real-user-sentinel')
    // A blob carrying the user's own profile, left in the demo namespace.
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ state: { profile: { name: 'Andy Quach' } } }))
    clearUnstampedDemoNamespace()
    expect(localStorage.getItem(DEMO_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(REAL_STORAGE_KEY)).toBe('real-user-sentinel')
  })

  it('keeps demo edits once the namespace is stamped', () => {
    localStorage.setItem(DEMO_STORAGE_KEY, 'edited-demo-state')
    stampDemoNamespace()
    expect(localStorage.getItem(DEMO_STAMP_KEY)).toBe(DEMO_STAMP_VALUE)
    clearUnstampedDemoNamespace()
    expect(localStorage.getItem(DEMO_STORAGE_KEY)).toBe('edited-demo-state')
  })

  it('is deterministic for the same seed time', () => {
    const seedTime = Date.parse('2026-07-27T12:00:00Z')
    expect(createDemoData(seedTime)).toEqual(createDemoData(seedTime))
  })

  it('seeds every locked interesting state', () => {
    const data = createDemoData(Date.parse('2026-07-27T12:00:00Z'))
    const center = data.academics.classCenter
    const current = data.courses.filter((course) => course.term === data.profile.startTerm)
    const currentCredits = current.reduce((sum, course) => sum + course.credits, 0)
    const bcpmCredits = current.filter((course) => course.bcpm).reduce((sum, course) => sum + course.credits, 0)
    const gradedWeight = center.assignments
      .filter((assignment) => assignment.status === 'graded')
      .reduce((sum, assignment) => sum + (assignment.weight ?? 0), 0)

    expect(center.topics.some((topic) => topic.status === 'weak')).toBe(true)
    expect(center.topics.some((topic) => topic.fsrs.reps === 0)).toBe(true)
    expect(center.files.some((file) => file.type === 'syllabus')).toBe(true)
    expect(center.workspaces.some((workspace) => !workspace.syllabusUrl)).toBe(true)
    expect(center.sourceChunks.some((chunk) => !chunk.topicId)).toBe(true)
    expect(data.requirements.some((requirement) => requirement.group.includes('Neuroscience') && requirement.verificationStatus === 'needs-verification')).toBe(true)
    expect(data.courses.some((course) => course.term === 'Unscheduled')).toBe(true)
    // ENGL 105 is intentionally part of the current term so the Writing
    // workspace can be reviewed against real mixed-course data.
    expect(bcpmCredits / currentCredits).toBeGreaterThanOrEqual(0.6)
    expect(current.some((course) => course.code === 'ENGL 105')).toBe(true)
    expect(center.workspaces.find((workspace) => workspace.courseId === current.find((course) => course.code === 'ENGL 105')?.id)?.type).toBe('writing')
    expect(data.courses.filter((course) => course.term === 'Spring 2027').reduce((sum, course) => sum + course.credits, 0)).toBeLessThan(12)
    expect(data.courses.some((course) => /spring-only/i.test(course.notes ?? '') && !/Spring/i.test(course.term))).toBe(true)
    expect(gradedWeight).toBe(37)
    expect(center.assignments.some((assignment) => assignment.status !== 'graded')).toBe(true)
    expect([...data.courses, ...center.assignments].some((item) => item.title.length >= 60)).toBe(true)
    expect(data.experiences.filter((experience) => experience.category === 'research')).toHaveLength(0)
    expect(data.experiences.some((experience) => experience.category === 'clinical')).toBe(true)
    expect(data.experiences.some((experience) => experience.category === 'volunteering')).toBe(true)
    expect(data.experiences.some((experience) => experience.category === 'shadowing')).toBe(true)
    expect(data.experiences.some((experience) => experience.category === 'leadership')).toBe(true)
    expect(data.letters.length).toBeGreaterThan(0)
    expect(data.stories.length).toBeGreaterThan(0)
    expect(data.tasks.length).toBeGreaterThan(0)
    expect(data.mcat.attempts.length).toBeGreaterThan(0)

    const noSyllabus = academicsNextActions(data, { now: new Date('2026-07-27T12:00:00Z') })
      .filter((recommendation) => recommendation.ruleId === 'academics-no-syllabus')
    expect(noSyllabus.some((recommendation) => recommendation.entityLabel === 'CHEM 262')).toBe(true)
    expect(noSyllabus.some((recommendation) => recommendation.entityLabel === 'BIOL 252')).toBe(false)
  })
})
