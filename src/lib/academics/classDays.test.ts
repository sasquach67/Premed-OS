import { describe, expect, it } from 'vitest'
import { buildClassDays, lessonDates, meetingWeekdays, stageStates, type ClassDay } from './classDays'
import type { SyllabusScheduleEntry } from '@/lib/types'

const entry = (order: number, label: string, extra: Partial<SyllabusScheduleEntry>): SyllabusScheduleEntry => ({ id: `e${order}`, week: '', label, order, ...extra })

describe('meetingWeekdays', () => {
  it('reads the normalized meeting days', () => {
    expect(meetingWeekdays('Tue · Thurs')).toEqual([2, 4])
    expect(meetingWeekdays('Mon · Wed · Fri')).toEqual([1, 3, 5])
  })
  it('gives nothing for alternating or empty schedules', () => {
    expect(meetingWeekdays('Alternating Fridays')).toEqual([])
    expect(meetingWeekdays(undefined)).toEqual([])
  })
})

describe('buildClassDays', () => {
  it('numbers per-lesson class dates as lectures and marks a lesson’s second day', () => {
    const days = buildClassDays({
      meetingDays: 'Tue · Thurs',
      schedule: [
        entry(1, 'Chapter 9 Motivation and Emotion', { lesson: 9, dates: ['2026-10-13', '2026-10-15'], startDate: '2026-10-13' }),
        entry(2, 'Lesson 10', { lesson: 10, startDate: '2026-10-20' }),
      ],
    })
    expect(days.map((d) => [d.date, d.lecture, d.lesson, d.topic, d.continued])).toEqual([
      ['2026-10-13', 1, 9, 'Motivation and Emotion', undefined],
      ['2026-10-15', 2, 9, 'Motivation and Emotion', true],
      ['2026-10-20', 3, 10, undefined, undefined],
    ])
    expect(days.map((d) => d.week)).toEqual([1, 1, 2])
  })

  it('puts exams in place without counting them as lectures', () => {
    const days = buildClassDays({
      schedule: [entry(1, 'Lesson 14', { lesson: 14, startDate: '2026-10-20' }), entry(2, 'Lesson 15', { lesson: 15, startDate: '2026-10-27' })],
      exams: [{ id: 'x2', title: 'Exam 2', date: '2026-10-22' }],
    })
    expect(days.map((d) => [d.kind, d.lecture ?? d.examTitle])).toEqual([['class', 1], ['exam', 'Exam 2'], ['class', 2]])
  })

  it('spreads a week schedule across the meeting days of each week', () => {
    const days = buildClassDays({
      meetingDays: 'Tue · Thurs',
      schedule: [entry(1, 'Week 1: Introduction', { startDate: '2026-08-17' }), entry(2, 'Week 2: Healing systems', { startDate: '2026-08-24' })],
    })
    expect(days.map((d) => [d.date, d.lecture, d.topic])).toEqual([
      ['2026-08-18', 1, 'Week 1: Introduction'],
      ['2026-08-20', 2, 'Week 1: Introduction'],
      ['2026-08-25', 3, 'Week 2: Healing systems'],
      ['2026-08-27', 4, 'Week 2: Healing systems'],
    ])
  })

  it('applies the student’s changes to one class without rewriting the syllabus', () => {
    const schedule = [
      entry(1, 'Chapter 9 Motivation and Emotion', { lesson: 9, dates: ['2026-10-13', '2026-10-15'], startDate: '2026-10-13' }),
      entry(2, 'Chapter 10 Human Development', { lesson: 10, dates: ['2026-10-20', '2026-10-22'], startDate: '2026-10-20' }),
    ]
    const days = buildClassDays({ schedule, overrides: { '2026-10-15': { lessons: [9, 10] }, '2026-10-20': { cancelled: true } } })
    expect(days.map((d) => [d.date, d.lessons, d.syllabusLesson, d.cancelled, d.continued])).toEqual([
      ['2026-10-13', [9], undefined, undefined, undefined],
      ['2026-10-15', [9, 10], 9, undefined, undefined],
      ['2026-10-20', undefined, 10, true, undefined],
      ['2026-10-22', [10], undefined, undefined, true],
    ])
    expect(lessonDates(days, 10)).toEqual(['2026-10-15', '2026-10-22'])
  })

  it('returns nothing when the syllabus gives no dates', () => {
    expect(buildClassDays({ schedule: [entry(1, 'Lesson 1', { lesson: 1 })], exams: [{ id: 'x', title: 'Exam 1', date: '2026-09-17' }] })).toEqual([])
  })
})

describe('stageStates', () => {
  const day: ClassDay = { date: '2026-10-13', kind: 'class', lecture: 15, week: 9 }
  it('marks unticked past stages late once their window has passed', () => {
    expect(stageStates(day, ['attend'], '2026-10-20', '2026-08-01')).toEqual(['late', 'late', 'late'])
    expect(stageStates(day, ['prime', 'attend', 'notebook', 'cards'], '2026-10-14', '2026-08-01')).toEqual(['done', 'done', 'part'])
  })
  it('never marks days before tracking began as missed', () => {
    expect(stageStates(day, [], '2026-10-20', '2026-10-18')).toEqual(['open', 'open', 'open'])
  })
  it('opens only Prime before class', () => {
    expect(stageStates({ ...day, date: '2026-10-22' }, [], '2026-10-20')).toEqual(['open', 'locked', 'locked'])
  })
  it('opens every stage on the day of class', () => {
    expect(stageStates({ ...day, date: '2026-10-27' }, ['prime'], '2026-10-27')).toEqual(['done', 'open', 'open'])
  })
})
