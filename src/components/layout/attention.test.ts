import { describe, expect, it, vi } from 'vitest'
import { createSeedData } from '@/data/seed'
import { buildAttention, attentionReviewQueue, attentionStatus } from './attention'
import type { AppData } from '@/lib/types'

/** A seed with the noisy collections emptied, so each test asserts on exactly
 *  the records it sets up rather than on whatever the demo data happens to hold. */
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
  // Class assignments are a deadline source too, so they must be quiet here.
  data.academics.classCenter.assignments = []
  data.settings.backup.enabled = true
  return data
}

describe('attention deadlines feed', () => {
  it('grades deadlines blocking / important / suggested by proximity', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-23T12:00:00'))
    const data = quietSeed()
    data.tasks = [
      { id: 'overdue', title: 'Overdue', type: 'Task', deadline: '2026-07-22', progress: 'Not started', kanban: 'todo', archived: false, order: 0 },
      { id: 'soon', title: 'Soon', type: 'Task', deadline: '2026-07-25', progress: 'Not started', kanban: 'todo', archived: false, order: 1 },
      { id: 'later', title: 'Later', type: 'Task', deadline: '2026-07-30', progress: 'Not started', kanban: 'todo', archived: false, order: 2 },
    ]
    const items = buildAttention(data).filter((item) => item.source === 'deadline')
    expect(items.map((item) => item.priority)).toEqual(['blocking', 'important', 'suggested'])
    vi.useRealTimers()
  })

  it('includes class-assignment deadlines, skipping closed work', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-23T12:00:00'))
    const data = quietSeed()
    data.courses = [
      { id: 'c1', term: 'Fall 2026', code: 'BIOL 252', title: 'Neurobiology', credits: 3, grade: 'IP', bcpm: true, status: 'in-progress', inResidence: true, satisfies: [], order: 0 },
    ]
    data.academics.classCenter.assignments = [
      { id: 'a-overdue', courseId: 'c1', title: 'Lab report', type: 'lab', dueDate: '2026-07-21', status: 'not-started', linkedTopicIds: [], linkedFileIds: [], createdAt: 0, updatedAt: 0, order: 0 },
      { id: 'a-soon', courseId: 'c1', title: 'Midterm', type: 'exam', dueDate: '2026-07-24', status: 'in-progress', linkedTopicIds: [], linkedFileIds: [], createdAt: 0, updatedAt: 0, order: 1 },
      { id: 'a-graded', courseId: 'c1', title: 'Quiz 1', type: 'quiz', dueDate: '2026-07-22', status: 'graded', linkedTopicIds: [], linkedFileIds: [], createdAt: 0, updatedAt: 0, order: 2 },
      { id: 'a-dropped', courseId: 'c1', title: 'Dropped set', type: 'homework', dueDate: '2026-07-22', status: 'dropped', linkedTopicIds: [], linkedFileIds: [], createdAt: 0, updatedAt: 0, order: 3 },
    ]

    const deadlines = buildAttention(data).filter((item) => item.source === 'deadline')
    expect(deadlines.map((item) => item.id)).toEqual([
      'deadline:assignment:a-overdue',
      'deadline:assignment:a-soon',
    ])
    expect(deadlines[0].priority).toBe('blocking')
    expect(deadlines[0].why).toContain('BIOL 252')
    expect(deadlines[0].route).toBe('/academics?tab=assignments')
    // Home's to-do widget renders `state.tasks`; coursework must not land there.
    expect(data.tasks).toHaveLength(0)
    vi.useRealTimers()
  })

  it('keeps extension feeds pluggable and honours snoozes', () => {
    const data = quietSeed()
    const extra = () => [{
      id: 'system:test', source: 'system' as const, priority: 'important' as const,
      title: 'System', why: 'Test feed', route: '/settings', actionLabel: 'Open',
    }]
    expect(buildAttention(data, [extra]).some((item) => item.id === 'system:test')).toBe(true)

    data.settings.attentionSnoozedUntil['system:test'] = Date.now() + 60_000
    expect(buildAttention(data, [extra]).some((item) => item.id === 'system:test')).toBe(false)
  })
})

describe('attention system feed', () => {
  it('flags backup being off and backup failures', () => {
    const data = quietSeed()
    data.settings.backup.enabled = false
    const off = buildAttention(data).find((item) => item.id === 'system:backup-off')
    expect(off?.priority).toBe('suggested')
    expect(off?.why).toMatch(/only in this browser/i)

    data.settings.backup.enabled = true
    data.settings.backup.lastError = 'network timeout'
    const failed = buildAttention(data).find((item) => item.id === 'system:backup-error')
    expect(failed?.priority).toBe('important')
    expect(failed?.why).toContain('network timeout')
  })
})

describe('attention model is unified', () => {
  it('merges all three feeds and sorts most severe first', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-23T12:00:00'))
    const data = quietSeed()
    data.settings.backup.enabled = false // system → suggested
    data.tasks = [
      { id: 'overdue', title: 'Overdue', type: 'Task', deadline: '2026-07-20', progress: 'Not started', kanban: 'todo', archived: false, order: 0 },
    ]
    data.experiences = [{
      id: 'exp-1', category: 'clinical', org: 'UNC', role: 'Volunteer', hours: 40,
      description: '', status: 'active', tags: [], order: 0,
      startDate: '2026-06-01', endDate: '2026-05-01', // invalid → blocking
    }]

    data.courses = [{ id: 'bad-course', term: 'Fall 2026', code: 'BIOL 103', title: 'Biology', credits: 0, grade: '', bcpm: true, status: 'completed', inResidence: true, satisfies: [], order: 0 }]
    const items = buildAttention(data)
    expect(items.some(item => item.route === '/clinical')).toBe(false)
    const sources = new Set(items.map((item) => item.source))
    expect(sources).toEqual(new Set(['deadline', 'data-health', 'system']))
    // blocking first, suggested last — never interleaved
    const ranks = items.map((item) => ({ blocking: 0, important: 1, suggested: 2 }[item.priority]))
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
    // every item explains itself
    expect(items.every((item) => item.why.trim().length > 0)).toBe(true)
    vi.useRealTimers()
  })

  it('drives the status chip from the same items the bell shows', () => {
    const data = quietSeed()
    expect(attentionStatus(buildAttention(data), true).tone).toBe('clear')
    expect(attentionStatus([], false).label).toBe('Backup off')
    expect(attentionStatus(
      [{ id: 'a', source: 'deadline', priority: 'blocking', title: 'x', why: 'y', route: '/', actionLabel: 'Open' }],
      true
    )).toEqual({ label: '1 need attention', tone: 'alert' })
  })
})

describe('review queue selector', () => {
  it('merges attention items with duplicate candidates', () => {
    const data = quietSeed()
    data.schools = [
      { id: 's1', name: 'Duke School of Medicine', type: 'MD', category: 'target', status: 'researching', order: 0 },
      { id: 's2', name: 'Duke School of Medicine', type: 'MD', category: 'reach', status: 'researching', order: 1 },
    ]
    const queue = attentionReviewQueue(data)
    const duplicate = queue.find((item) => item.kind === 'duplicate')
    expect(duplicate).toBeDefined()
    // Duplicates are the one uncertain check, so they carry confidence...
    expect(duplicate?.confidence).toBe('high')
    expect(duplicate?.differingFields).toContain('Category')
    expect(duplicate?.route).toMatch(/^\/review\?item=duplicate-/)
    // ...while deterministic attention rows never do.
    expect(queue.filter((item) => item.kind === 'attention').every((item) => item.confidence === undefined)).toBe(true)
  })
})
