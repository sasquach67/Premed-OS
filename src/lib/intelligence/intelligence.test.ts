/* Tests for the deterministic intelligence layer (foundation L6).
 *
 * These guard the data contracts that Overview (spec 03 §6.3) and the review
 * queue consume, so those surfaces only have to render.
 */
import { describe, expect, it, vi } from 'vitest'
import { createSeedData } from '@/data/seed'
import type { AppData, CollectionRecord, Course, ExperienceEntry, LetterEntry } from '@/lib/types'
import { daysSinceUpdate, paceProjection, pillarSignals, nextDeadline } from './derived'
import { dataHealthWarnings, experienceCompleteness, courseCompleteness } from './dataHealth'
import { dedupCandidates } from './dedup'
import { academicsNextActions, generateRecommendations, isMutableSeverity, ruleDismissalCount, smartNextActions } from './recommendations'
import { INTELLIGENCE_THRESHOLDS } from './types'
import { useStore } from '@/store/store'

const NOW = new Date('2026-07-25T12:00:00')
const DAY = 86_400_000

function quietSeed(): AppData {
  const data = createSeedData()
  data.tasks = []
  data.experiences = []
  data.courses = []
  data.letters = []
  data.orgs = []
  data.stories = []
  data.schools = []
  data.persons = []
  data.organizations = []
  data.settings.backup.enabled = true
  return data
}

function experience(partial: Partial<CollectionRecord<ExperienceEntry>> = {}): CollectionRecord<ExperienceEntry> {
  return {
    id: 'exp-1', category: 'clinical', org: 'UNC Hospitals', role: 'Volunteer',
    hours: 40, description: 'Playroom support', status: 'active', tags: [], order: 0,
    startDate: '2026-01-01', supervisor: 'Marcus Lee',
    ...partial,
  }
}

function course(partial: Partial<Course> = {}): Course {
  return {
    id: 'c-1', term: 'Fall 2026', code: 'CHEM 241', title: 'Organic I', credits: 3,
    grade: 'A', bcpm: true, status: 'completed', inResidence: true, satisfies: [], order: 0,
    ...partial,
  }
}

function letter(partial: Partial<LetterEntry> = {}): LetterEntry {
  return {
    id: 'l-1', recommender: 'Dr. Kwon', role: 'Research PI', relationship: 'PI',
    type: 'Science faculty', status: 'asked', order: 0,
    ...partial,
  }
}

/* ------------------------------------------------------------------ part 1 */

describe('derived properties', () => {
  it('computes pillar signals without storing anything', () => {
    const data = quietSeed()
    data.experiences = [
      experience({ id: 'a', org: 'UNC', hours: 60, startDate: '2026-05-26', tags: ['peds'] }),
      experience({ id: 'b', org: 'Duke', hours: 20, startDate: '2026-06-25', tags: ['ED'] }),
    ]
    const signals = pillarSignals(data.experiences, 'clinical', NOW)
    expect(signals.totalHours).toBe(80)
    expect(signals.entryCount).toBe(2)
    expect(signals.distinctOrgs).toBe(2)
    expect(signals.distinctTags).toBe(2)
    // 60 days of longevity at 80h => ~9.3 h/wk
    expect(signals.longevityDays).toBe(60)
    expect(signals.hoursPerWeek).toBeCloseTo(80 / (60 / 7), 5)
  })

  it('reports unknown rather than inventing a date when timestamps are absent', () => {
    expect(daysSinceUpdate({}, NOW)).toBeNull()
    expect(daysSinceUpdate({ updatedAt: NOW.getTime() - 3 * DAY }, NOW)).toBe(3)
  })

  it('only projects pace when a goal is actually set', () => {
    expect(paceProjection(50, 0, 5, NOW)).toBeNull()
    const projection = paceProjection(50, 150, 10, NOW)
    expect(projection).toMatchObject({ remaining: 100, met: false })
    expect(projection?.weeksToGoal).toBeCloseTo(10, 5)
    expect(paceProjection(200, 150, 10, NOW)).toMatchObject({ met: true, remaining: 0 })
    // A goal with no observed rate yields no fabricated date.
    expect(paceProjection(0, 150, 0, NOW)?.projectedDate).toBeNull()
  })

  it('finds the next unfinished deadline', () => {
    const data = quietSeed()
    data.tasks = [
      { id: 'far', title: 'Far', type: 'Task', deadline: '2026-09-01', progress: 'Not started', kanban: 'todo', archived: false, order: 0 },
      { id: 'near', title: 'Near', type: 'Task', deadline: '2026-07-28', progress: 'Not started', kanban: 'todo', archived: false, order: 1 },
      { id: 'done', title: 'Done', type: 'Task', deadline: '2026-07-26', progress: 'Finished', kanban: 'done', archived: true, order: 2 },
    ]
    expect(nextDeadline(data.tasks, NOW)?.task.id).toBe('near')
  })
})

/* ------------------------------------------------------------------ part 2 */

describe('completeness states', () => {
  it('ladders incomplete → usable → well-documented → ready-for-export', () => {
    expect(experienceCompleteness(experience({ org: '', role: '', hours: 0 })).state).toBe('incomplete')
    expect(experienceCompleteness(experience({ startDate: undefined, description: '', supervisor: undefined })).state).toBe('usable')
    expect(experienceCompleteness(experience({ supervisor: undefined, mostMeaningful: undefined })).state).toBe('well-documented')
    expect(experienceCompleteness(experience({ mostMeaningful: 'A real reflection' })).state).toBe('ready-for-export')
  })

  it('always says exactly what is missing', () => {
    const result = experienceCompleteness(experience({ supervisor: undefined, mostMeaningful: undefined }))
    expect(result.missing).toEqual(['Verification contact', 'Reflection'])
    expect(result.percent).toBeGreaterThan(0)
  })

  it('does not demand a grade from an in-progress course', () => {
    expect(courseCompleteness(course({ status: 'in-progress', grade: '' })).missing).not.toContain('Grade')
    expect(courseCompleteness(course({ status: 'completed', grade: '' })).missing).toContain('Grade')
  })
})

describe('data-health warnings', () => {
  it('flags an invalid date sequence as blocking', () => {
    const data = quietSeed()
    data.experiences = [experience({ startDate: '2026-06-01', endDate: '2026-05-01' })]
    const warning = dataHealthWarnings(data, NOW).find((item) => item.rule === 'invalid-date-range')
    expect(warning?.severity).toBe('blocking')
    expect(warning?.why).toMatch(/ends before it starts/i)
  })

  it('flags missing verification contact with a plain reason', () => {
    const data = quietSeed()
    data.experiences = [experience({ supervisor: undefined, supervisorId: undefined })]
    const warning = dataHealthWarnings(data, NOW).find((item) => item.rule === 'missing-verifier')
    expect(warning?.severity).toBe('important')
    expect(warning?.why).toMatch(/AMCAS asks for someone who can verify/i)
  })

  it('flags a completed course with no grade, because it silently skips the GPA', () => {
    const data = quietSeed()
    data.courses = [course({ grade: '' })]
    const warning = dataHealthWarnings(data, NOW).find((item) => item.rule === 'completed-no-grade')
    expect(warning?.severity).toBe('important')
    expect(warning?.why).toMatch(/isn't counting toward your GPA/i)
  })

  it('flags stale active records only when the update time is known', () => {
    const data = quietSeed()
    data.experiences = [experience({ updatedAt: NOW.getTime() - 45 * DAY })]
    expect(dataHealthWarnings(data, NOW).some((item) => item.rule === 'stale-active')).toBe(true)

    // No timestamp → unknown → no fabricated staleness claim.
    data.experiences = [experience({ updatedAt: undefined, createdAt: undefined })]
    expect(dataHealthWarnings(data, NOW).some((item) => item.rule === 'stale-active')).toBe(false)
  })

  it('flags a letter deadline nobody owns yet', () => {
    const data = quietSeed()
    data.letters = [letter({ status: 'identified', dueDate: '2026-09-01' })]
    expect(dataHealthWarnings(data, NOW).some((item) => item.rule === 'deadline-without-owner')).toBe(true)
  })

  it('sorts blocking ahead of important ahead of suggested, and explains every item', () => {
    const data = quietSeed()
    data.experiences = [
      experience({ id: 'bad', startDate: '2026-06-01', endDate: '2026-05-01' }),
      experience({ id: 'nover', supervisor: undefined }),
    ]
    data.stories = [{ id: 'st', prompt: 'p', title: 'Reflection', commentary: 'text', tags: [], order: 0 }]
    const warnings = dataHealthWarnings(data, NOW)
    const ranks = warnings.map((w) => ({ blocking: 0, important: 1, suggested: 2 }[w.severity]))
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
    expect(warnings.every((w) => w.why.trim().length > 0)).toBe(true)
    // Deterministic warnings never carry a confidence score.
    expect(warnings.every((w) => !('confidence' in w))).toBe(true)
  })
})

/* ------------------------------------------------------------------ part 3 */

describe('dedup detection', () => {
  it('returns candidates with confidence and differing fields, and never merges', () => {
    const data = quietSeed()
    data.persons = [
      { id: 'p1', name: 'Sarah Kwon', email: 'kwon@unc.edu', createdAt: 1, updatedAt: 1, archived: false, order: 0 },
      { id: 'p2', name: 'Sarah Kwon', phone: '919', createdAt: 1, updatedAt: 1, archived: false, order: 1 },
    ]
    const before = JSON.stringify(data.persons)
    const [candidate] = dedupCandidates(data)
    expect(candidate.kind).toBe('person')
    expect(candidate.confidence).toBe('high')
    expect(candidate.differingFields).toEqual([]) // no field has values on BOTH sides
    // Detection must be side-effect free.
    expect(JSON.stringify(data.persons)).toBe(before)
  })

  it('rates a containment match lower than an exact match', () => {
    const data = quietSeed()
    data.organizations = [
      { id: 'o1', name: 'UNC Hospitals', createdAt: 1, updatedAt: 1, archived: false, order: 0 },
      { id: 'o2', name: 'UNC Hospitals Chapel Hill', createdAt: 1, updatedAt: 1, archived: false, order: 1 },
    ]
    expect(dedupCandidates(data)[0].confidence).toBe('moderate')
  })

  it('treats a retake in another term as legitimate, not a duplicate', () => {
    const data = quietSeed()
    data.courses = [
      course({ id: 'c1', code: 'CHEM 241', term: 'Fall 2026', grade: 'C' }),
      course({ id: 'c2', code: 'CHEM 241', term: 'Spring 2027', grade: 'A' }),
    ]
    expect(dedupCandidates(data).filter((c) => c.kind === 'course')).toHaveLength(0)

    // Same code in the SAME term is a real duplicate.
    data.courses[1].term = 'Fall 2026'
    const [dupe] = dedupCandidates(data).filter((c) => c.kind === 'course')
    expect(dupe.confidence).toBe('high')
    expect(dupe.differingFields).toContain('Grade')
  })
})

/* ------------------------------------------------------------------ part 4 */

describe('rules-based recommendations', () => {
  it('explains itself, ranks, and offers an action without acting', () => {
    const data = quietSeed()
    data.experiences = [experience({ supervisor: undefined, supervisorId: undefined })]
    const [rec] = generateRecommendations(data, NOW)
    expect(rec.ruleId).toBe('add-verifier')
    expect(rec.why).toMatch(/AMCAS requires a contact/i)
    expect(rec.route).toBe('/clinical')
    expect(rec.actionLabel).toBeTruthy()
    // A draft title is offered; nothing is created.
    expect(rec.taskDraft).toBeTruthy()
    expect(data.tasks).toHaveLength(0)
  })

  it('ranks urgent rules above tidy-up rules', () => {
    const data = quietSeed()
    data.letters = [letter({ dateAsked: '2026-06-01' })] // 54 days → follow up
    data.experiences = [experience({
      id: 'old', status: 'completed', archived: false,
      updatedAt: NOW.getTime() - 200 * DAY,
    })]
    const recs = generateRecommendations(data, NOW)
    const ranks = recs.map((rec) => rec.rank)
    expect(ranks).toEqual([...ranks].sort((a, b) => b - a))
    expect(recs[0].ruleId).toBe('letter-follow-up')
  })

  it('suggests a research PI as a recommender only when they are not already listed', () => {
    const data = quietSeed()
    data.experiences = [experience({ category: 'research', supervisor: 'Dr. Kwon', org: 'Kwon Lab' })]
    expect(generateRecommendations(data, NOW).some((r) => r.ruleId === 'research-pi-recommender')).toBe(true)

    data.letters = [letter({ recommender: 'Dr. Kwon' })]
    expect(generateRecommendations(data, NOW).some((r) => r.ruleId === 'research-pi-recommender')).toBe(false)
  })

  it('caps smart next actions to protect attention', () => {
    const data = quietSeed()
    data.experiences = Array.from({ length: 8 }, (_, i) =>
      experience({ id: `e${i}`, org: `Site ${i}`, supervisor: undefined }))
    expect(smartNextActions(data, { now: NOW })).toHaveLength(INTELLIGENCE_THRESHOLDS.maxSmartActions)
    expect(smartNextActions(data, { now: NOW, limit: 2 })).toHaveLength(2)
  })
})

describe('suppression and the alert-fatigue guard', () => {
  it('suppresses a dismissed instance without touching its siblings', () => {
    const data = quietSeed()
    data.experiences = [
      experience({ id: 'e1', org: 'Site A', supervisor: undefined }),
      experience({ id: 'e2', org: 'Site B', supervisor: undefined }),
    ]
    expect(smartNextActions(data, { now: NOW })).toHaveLength(2)

    data.settings.recommendationState['add-verifier:e1'] = { status: 'dismissed', at: Date.now() }
    const remaining = smartNextActions(data, { now: NOW })
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe('add-verifier:e2')
  })

  it('suppresses accepted recommendations too', () => {
    const data = quietSeed()
    data.experiences = [experience({ id: 'e1', supervisor: undefined })]
    data.settings.recommendationState['add-verifier:e1'] = { status: 'accepted', at: Date.now() }
    expect(smartNextActions(data, { now: NOW })).toHaveLength(0)
  })

  it('hides a muted rule but NEVER a blocking one', () => {
    const data = quietSeed()
    data.experiences = [experience({ id: 'e1', supervisor: undefined })]
    data.settings.mutedRecommendationRules['add-verifier'] = { at: Date.now() }
    expect(smartNextActions(data, { now: NOW })).toHaveLength(0)

    // Blocking severity ignores muting entirely.
    expect(isMutableSeverity('blocking')).toBe(false)
    expect(isMutableSeverity('important')).toBe(true)
    expect(isMutableSeverity('suggested')).toBe(true)
  })

  it('counts dismissals per rule for the mute threshold', () => {
    const data = quietSeed()
    data.settings.recommendationState = {
      'add-verifier:e1': { status: 'dismissed', at: 1 },
      'add-verifier:e2': { status: 'dismissed', at: 2 },
      'add-verifier:e3': { status: 'accepted', at: 3 },
      'letter-follow-up:l1': { status: 'dismissed', at: 4 },
    }
    expect(ruleDismissalCount(data, 'add-verifier')).toBe(2)
    expect(ruleDismissalCount(data, 'letter-follow-up')).toBe(1)
  })

  it('retires a rule only after its third dismissal', () => {
    expect(INTELLIGENCE_THRESHOLDS.ruleMuteAfterDismissals).toBe(3)
    useStore.getState().replaceAll(quietSeed())
    const dismiss = useStore.getState().dismissRecommendation
    const base = { ruleId: 'add-verifier', severity: 'important' as const }

    dismiss({ ...base, id: 'add-verifier:first' })
    dismiss({ ...base, id: 'add-verifier:second' })
    expect(useStore.getState().settings.mutedRecommendationRules['add-verifier']).toBeUndefined()

    dismiss({ ...base, id: 'add-verifier:third' })
    expect(useStore.getState().settings.mutedRecommendationRules['add-verifier']).toBeDefined()
  })
})

/* ------------------------------------------------------------------ part 6 */

describe('deterministic vs probabilistic separation', () => {
  it('never attaches confidence to a deterministic recommendation', () => {
    const data = quietSeed()
    data.experiences = [experience({ supervisor: undefined })]
    data.letters = [letter({ dateAsked: '2026-01-01' })]
    for (const rec of generateRecommendations(data, NOW)) {
      expect('confidence' in rec).toBe(false)
    }
  })

  it('does attach confidence to the dedup-derived recommendation path', () => {
    const data = quietSeed()
    data.schools = [
      { id: 's1', name: 'Duke', type: 'MD', category: 'target', status: 'researching', order: 0 },
      { id: 's2', name: 'Duke', type: 'MD', category: 'reach', status: 'researching', order: 1 },
    ]
    expect(dedupCandidates(data)[0].confidence).toBeTruthy()
    expect(generateRecommendations(data, NOW).some((r) => r.ruleId === 'resolve-duplicates')).toBe(true)
  })

  it('makes no network calls', () => {
    const fetchSpy = vi.fn()
    const realFetch = globalThis.fetch
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch
    const data = quietSeed()
    data.experiences = [experience({ supervisor: undefined })]
    dataHealthWarnings(data, NOW)
    dedupCandidates(data)
    generateRecommendations(data, NOW)
    smartNextActions(data, { now: NOW })
    expect(fetchSpy).not.toHaveBeenCalled()
    globalThis.fetch = realFetch
  })
})

describe('Academics D2 recommendations', () => {
  it('names a specific cause, caps at three, and honors persisted dismissal', () => {
    const data = structuredClone(createSeedData())
    const initial = academicsNextActions(data)
    expect(initial).toHaveLength(3)
    expect(initial.every((recommendation) => recommendation.ruleId === 'academics-no-syllabus')).toBe(true)
    expect(initial.every((recommendation) => recommendation.cause && recommendation.why.includes(recommendation.cause))).toBe(true)

    data.settings.recommendationState[initial[0].id] = { status: 'dismissed', at: NOW.getTime() }
    expect(academicsNextActions(data).some((recommendation) => recommendation.id === initial[0].id)).toBe(false)
  })
})
