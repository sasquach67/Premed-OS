import { describe, expect, it } from 'vitest'
import { buildLessons, groupLessonsByExam, scopeLessonNumbers, type LessonRow } from './lessonGroups'

const row = (lesson: number, date: string): LessonRow => ({ lesson, dates: [date] })

describe('buildLessons', () => {
  it('reads lesson numbers, topics and every date from the schedule', () => {
    expect(buildLessons([
      { id: 'b', week: '', label: 'Lesson 10', order: 1, lesson: 10, startDate: '2026-10-20' },
      { id: 'a', week: '', label: 'Chapter 9 Motivation and Emotion', order: 0, lesson: 9, startDate: '2026-10-13', dates: ['2026-10-13', '2026-10-15'] },
    ])).toEqual([
      { lesson: 9, title: 'Motivation and Emotion', dates: ['2026-10-13', '2026-10-15'] },
      { lesson: 10, title: undefined, dates: ['2026-10-20'] },
    ])
  })
  it('numbers a week schedule in order', () => {
    expect(buildLessons([
      { id: 'a', week: '1', label: 'Week 1: Introduction', order: 0, startDate: '2026-08-17' },
      { id: 'b', week: '2', label: 'Week 2: Healing systems', order: 1, startDate: '2026-08-24' },
    ]).map((r) => [r.lesson, r.title])).toEqual([[1, 'Week 1: Introduction'], [2, 'Week 2: Healing systems']])
  })
})

describe('scopeLessonNumbers', () => {
  it('reads single lessons, ranges and pairs', () => {
    expect(scopeLessonNumbers({ lessons: ['Lesson 9', 'Lessons 12-14', 'Lesson 10 & 11'] }).sort((a, b) => a - b)).toEqual([9, 10, 11, 12, 13, 14])
  })
})

describe('groupLessonsByExam', () => {
  const lessons = [row(1, '2026-08-20'), row(8, '2026-09-15'), row(9, '2026-09-22'), row(15, '2026-10-13'), row(16, '2026-10-20'), row(17, '2026-10-27')]
  it('puts each lesson under the exam whose scope names it (BIOL 103)', () => {
    const groups = groupLessonsByExam(lessons, [
      { id: 'e2', title: 'Exam 2', date: '2026-10-22', scope: { lessons: ['Lessons 9-15'] } },
      { id: 'e1', title: 'Exam 1', date: '2026-09-17', scope: { lessons: ['Lessons 1-7'] } },
      { id: 'f', title: 'Final', date: '2026-12-07', scope: { cumulative: true } },
    ])
    expect(groups.map((g) => [g.name, g.lessons.map((l) => l.lesson)])).toEqual([
      ['Exam 1', [1, 8]],
      ['Exam 2', [9, 15, 16]],
      ['Final', [17]],
    ])
  })
  it('groups by date when the syllabus gives no scope (PSYC 101)', () => {
    const groups = groupLessonsByExam(lessons, [{ id: 'e1', title: 'Exam 1', date: '2026-09-17' }, { id: 'e2', title: 'Exam 2', date: '2026-11-03' }])
    expect(groups.map((g) => g.lessons.map((l) => l.lesson))).toEqual([[1, 8], [9, 15, 16, 17]])
  })
  it('keeps everything in one group with no exams', () => {
    expect(groupLessonsByExam(lessons, []).map((g) => g.name)).toEqual(['All lessons'])
  })
})
