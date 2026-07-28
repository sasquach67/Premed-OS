/* Tests for the data-migration functions that run on every load/import.
   These are the functions most likely to corrupt user data if broken. */
import { describe, expect, it } from 'vitest'
import { migrateAcademicTags, migrateAll, migrateMascotNotes, migrateOrgReflections, migrateOverviewSchema, migrateRequirementMetadata, migrateSafetyNets } from '@/store/store'
import { createSeedData } from '@/data/seed'
import type { AppData, ClassWeakArea, Org, RequirementItem, TaskItem, Topic } from '@/lib/types'

function freshData(): AppData {
  return createSeedData()
}

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

  it('copies the legacy Home scratchpad into capture inbox without deleting it', () => {
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

  it('is idempotent and never duplicates the legacy capture', () => {
    const data = freshData()
    data.notes['home-ideas'] = 'A thought worth keeping'
    const once = migrateOverviewSchema(data)
    const twice = migrateOverviewSchema(JSON.parse(JSON.stringify(once)) as AppData)
    expect(twice.captures).toEqual(once.captures)
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

  it('migrateOverviewSchema backfills tasks and captures without mutating', () => {
    const data = structuredClone(freshData())
    delete (data as Partial<AppData>).captures
    data.notes['home-ideas'] = 'A thought worth keeping'
    data.tasks = [
      { id: 't1', title: 'Legacy', type: 'Personal', progress: 'Not started', kanban: 'todo', archived: false, order: 0 },
    ] as unknown as TaskItem[]
    deepFreeze(data)

    const out = migrateOverviewSchema(data)
    expect(out.tasks[0].important).toBe(false)
    expect(out.tasks[0].horizon).toBe('soon')
    expect(out.captures).toHaveLength(1)
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
    expect(out.captures.some((capture) => capture.id === 'capture-legacy-home-ideas')).toBe(true)
    // ...and never on the caller's frozen tree.
    expect((frozen as unknown as Record<string, unknown>).trash).toBeUndefined()
  })
})
