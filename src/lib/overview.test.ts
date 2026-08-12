import { describe, expect, it } from 'vitest'
import { goalProgress, latestExperienceLabel, observedWeeklyHours, overviewTasks, roadmapMilestones, termGpaSeries } from '@/lib/overview'
import type { Course, ExperienceEntry, TaskItem } from '@/lib/types'

function task(partial: Partial<TaskItem>): TaskItem {
  return {
    id: 'task',
    title: 'Task',
    type: 'Personal',
    progress: 'Not started',
    kanban: 'todo',
    archived: false,
    milestone: false,
    order: 0,
    ...partial,
  }
}

describe('Overview selectors', () => {
  it('derives Done from completion while keeping Now and Soon explicit', () => {
    const tasks = [
      task({ id: 'now', horizon: 'now', important: false }),
      task({ id: 'soon', horizon: 'soon', important: false }),
      task({ id: 'done', horizon: 'now', progress: 'Finished', kanban: 'done', important: false }),
    ]
    expect(overviewTasks(tasks, 'now').map((item) => item.id)).toEqual(['now'])
    expect(overviewTasks(tasks, 'soon').map((item) => item.id)).toEqual(['soon'])
    expect(overviewTasks(tasks, 'done').map((item) => item.id)).toEqual(['done'])
  })

  it('pins important tasks before everything else without a second focus concept', () => {
    const tasks = [
      task({ id: 'normal', order: 0, horizon: 'now', important: false }),
      task({ id: 'important', order: 2, horizon: 'now', important: true }),
    ]
    expect(overviewTasks(tasks, 'now').map((item) => item.id)).toEqual(['important', 'normal'])
  })

  it('returns an empty roadmap when there are no milestone records', () => {
    expect(roadmapMilestones([task({ milestone: false })])).toEqual([])
  })

  it('projects only stored milestone records in deadline order', () => {
    const milestones = roadmapMilestones([
      task({ id: 'later', milestone: true, deadline: '2029-05-01', notes: 'Later detail' }),
      task({ id: 'first', milestone: true, deadline: '2028-10-01', notes: 'First detail' }),
    ])
    expect(milestones.map((item) => item.id)).toEqual(['first', 'later'])
    expect(milestones[0]).toMatchObject({ detail: 'First detail', state: 'current' })
  })

  it('builds exact cumulative and BCPM term series from graded courses', () => {
    const courses = [
      {
        id: 'bio',
        term: 'Fall 2026',
        code: 'BIOL 101',
        title: 'Biology',
        credits: 4,
        grade: 'A',
        bcpm: true,
        status: 'completed',
        inResidence: true,
        satisfies: [],
        order: 0,
      },
      {
        id: 'eng',
        term: 'Spring 2027',
        code: 'ENGL 105',
        title: 'Writing',
        credits: 4,
        grade: 'B',
        bcpm: false,
        status: 'completed',
        inResidence: true,
        satisfies: [],
        order: 1,
      },
    ] satisfies Course[]
    expect(termGpaSeries(courses)).toEqual([
      { term: 'Fall 2026', cumulative: 4, science: 4 },
      { term: 'Spring 2027', cumulative: 3.5, science: 4 },
    ])
  })

  it('keeps no-target and insufficient-value progress dormant', () => {
    expect(goalProgress(12)).toBeUndefined()
    expect(goalProgress(12, 0)).toBeUndefined()
    expect(goalProgress(0, 150)).toBeUndefined()
  })

  it('bounds real value-against-goal progress', () => {
    expect(goalProgress(75, 150)).toBe(50)
    expect(goalProgress(180, 150)).toBe(100)
  })

  it('keeps hour pace and “last logged” dormant until dated hour logs exist', () => {
    const aggregate = [{
      id: 'clinical-1', category: 'clinical', org: 'Clinic', role: 'Volunteer',
      startDate: '2026-05-01', hours: 24, description: '', status: 'active', tags: [], order: 0,
    }] satisfies ExperienceEntry[]
    expect(observedWeeklyHours(aggregate, 'clinical')).toBeNull()
    expect(latestExperienceLabel(aggregate)).toBeNull()
  })
})
