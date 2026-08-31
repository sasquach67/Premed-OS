import { describe, expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { migrateReadingTaskScheduleV38 } from './readingTaskScheduleV38'

describe('migrateReadingTaskScheduleV38', () => {
  it('moves an untouched generated task before class while preserving the discussion date', () => {
    const data = createPersonalInitialData()
    const center = data.academics.classCenter
    center.assignedReadings.push({
      id: 'reading', courseId: 'course', week: 'Week 1', title: 'Chapter 1',
      syllabusSourceKey: 'chapter 1|week 1|2026-08-20', dueForDiscussion: '2026-08-20',
      status: 'not-started', createdAt: 1, updatedAt: 1, order: 0,
    })
    center.assignments.push({
      id: 'task', courseId: 'course', title: 'Read Chapter 1 before class', type: 'reading',
      syllabusSourceKey: 'reading-calendar:chapter 1|week 1|2026-08-20', dueDate: '2026-08-20',
      status: 'not-started', linkedTopicIds: [], linkedFileIds: [],
      notes: 'Due for the scheduled class on 2026-08-20. Source: line 2', createdAt: 1, updatedAt: 1, order: 0,
    })

    const out = migrateReadingTaskScheduleV38(data)
    expect(out.academics.classCenter.assignedReadings[0].dueForDiscussion).toBe('2026-08-20')
    expect(out.academics.classCenter.assignments[0]).toMatchObject({
      dueDate: '2026-08-19',
      notes: 'Task due 2026-08-19; scheduled class 2026-08-20. Source: line 2',
    })
  })

  it('does not overwrite a student-edited reading deadline', () => {
    const data = createPersonalInitialData()
    const center = data.academics.classCenter
    center.assignedReadings.push({
      id: 'reading', courseId: 'course', week: 'Week 1', title: 'Chapter 1',
      syllabusSourceKey: 'chapter 1|week 1|2026-08-20', dueForDiscussion: '2026-08-20',
      status: 'not-started', createdAt: 1, updatedAt: 1, order: 0,
    })
    center.assignments.push({
      id: 'task', courseId: 'course', title: 'Read Chapter 1 before class', type: 'reading',
      syllabusSourceKey: 'reading-calendar:chapter 1|week 1|2026-08-20', dueDate: '2026-08-17',
      status: 'not-started', linkedTopicIds: [], linkedFileIds: [], createdAt: 1, updatedAt: 1, order: 0,
    })

    expect(migrateReadingTaskScheduleV38(data)).toBe(data)
    expect(data.academics.classCenter.assignments[0].dueDate).toBe('2026-08-17')
  })
})
