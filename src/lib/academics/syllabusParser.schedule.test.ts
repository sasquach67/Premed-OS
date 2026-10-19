import { describe, expect, it } from 'vitest'
import ocrExcerpt from './fixtures/syllabus/biol103-fall26-ocr-excerpt.txt?raw'
import fa23Rows from './fixtures/syllabus/biol103-fa23-canvas-rows.txt?raw'
import { detectScheduleRegions, lessonObjectives, normalizeScheduleCells, parseSyllabusText, prepareScheduleText, syllabusYearHint, type SyllabusItem } from './syllabusParser'

/** Every exam and deadline is ISO or unset. The app writes `value` straight
 *  into `dueDate`, and display text there renders as "Date TBD". */
const expectDatesIsoOrUnset = (items: SyllabusItem[]) => {
  items.filter((item) => item.kind === 'exams' || item.kind === 'deadlines').forEach((item) => {
    expect(item.value === undefined || /^\d{4}-\d{2}-\d{2}$/.test(item.value), `${item.kind} "${item.label}" has value ${JSON.stringify(item.value)}`).toBe(true)
  })
}

// Both fixtures are text the app itself produced: tesseract OCR of the Fall 26
// BIOL 103 schedule images at the app's 4× render, and pdf.js lines of the
// FA23 Canvas print. Neither carries a "Class Schedule" heading the row
// grammars can see: OCR dropped the image title, and the print buries it in a
// page header. The schedule has to be found by the shape of its rows.
const splitLines = (text: string) => text.split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean)

// The excerpt is the schedule table alone. In the real PDF the text pages
// supply identity, term, meeting cadence and section; this line stands in.
const BIOL_HEADER = 'BIOL 103 — How Cells Work · Fall 2026 · TR 12:30 PM–1:45 PM · Section: 004'
const biol = () => parseSyllabusText(`${BIOL_HEADER}\n${ocrExcerpt}`, 'BIOL103 Syllabus 2.pdf', 'pdf')

describe('schedule regions are found by row shape', () => {
  it('finds the OCR table with no heading at all', () => {
    const regions = detectScheduleRegions(prepareScheduleText(splitLines(ocrExcerpt)).lines)
    expect(regions).toHaveLength(1)
    expect(regions[0].hasHeading).toBe(false)
  })

  it('rejoins a Canvas print whose dates are one token per line, and finds its rows', () => {
    const prepared = prepareScheduleText(splitLines(fa23Rows))
    expect(prepared.lines).toContain('1 8/23')
    // `25` arrives after a page break, long after `Mon.,` / `Sep.`: it completes
    // that no-class row and never becomes lesson 25 of the exam row below it.
    // Prepared rows are canonical, so `Mon.,` is spelled `Monday`.
    expect(prepared.lines).toContain('Monday 9/25')
    expect(prepared.lines).toContain('Wednesday 9/27')
    expect(prepared.lines).not.toContain('25 9/27')
    expect(detectScheduleRegions(prepared.lines)).toHaveLength(1)
  })

  it('still fires on a weekday table and on a Week N. table', () => {
    expect(detectScheduleRegions(['Tues 8/25 Research Methods', 'Thurs 8/27 Cells', 'Tues 9/1 Membranes'])).toHaveLength(1)
    expect(detectScheduleRegions(['Week 1. Globe', 'Aug 17-21', 'Week 2. Scale', 'Aug 24-28', 'Week 3. History', 'Aug 31-Sep 4'])).toHaveLength(1)
  })

  it('does not call a prose paragraph with one date a schedule', () => {
    expect(detectScheduleRegions(['Office hours are Tuesdays.', 'Problem set 1 is due 9/9 at noon.', 'No late work.'])).toHaveLength(0)
  })
})

describe('BIOL 103 Fall 2026 OCR schedule', () => {
  it('dates every lesson row, including the ones OCR damaged', () => {
    const units = biol().items.filter((item) => item.kind === 'units')
    expect(units.map((item) => item.value)).toEqual(expect.arrayContaining(['2026-08-18', '2026-08-20', '2026-09-15', '2026-09-24', '2026-10-13', '2026-10-20', '2026-12-01']))
    // `10&11 9/24` is one class day covering two lessons: two entries sharing
    // the date, because the lesson is the unit (Andy, Oct 19 2026).
    expect(units.filter((item) => item.value === '2026-09-24').map((item) => item.label).sort()).toEqual(['Lesson 10', 'Lesson 11'])
    // `9/15` lost its lesson number to OCR. It is numbered from the row before
    // it and marked low confidence so review shows the guess as a guess.
    expect(units.find((item) => item.value === '2026-09-15')?.confidence).toBe('low')
  })

  it('reads the exams, repairing the slash-less date and the split exam row', () => {
    const exams = biol().items.filter((item) => item.kind === 'exams')
    expect(exams).toEqual(expect.arrayContaining([
      // `917` sits between `9/15` and `9/24`, so it is 9/17; the repair is flagged.
      expect.objectContaining({ label: 'Exam 1', value: '2026-09-17', confidence: 'low' }),
      // `+ EXAM 2 (lessons 9-15) …` with `10/22 exam` on the next line.
      expect.objectContaining({ label: 'Exam 2', value: '2026-10-22' }),
    ]))
    // "Review Activity for the Final Exam" is a lesson, not an exam. The
    // FINAL EXAM block with its section times is read in a later stage.
    expect(exams.some((item) => item.value === '2026-12-01')).toBe(false)
    expectDatesIsoOrUnset(biol().items)
  })

  it('reads the scope each exam states, and the final for this section', () => {
    const exams = biol().items.filter((item) => item.kind === 'exams')
    expect(exams.find((item) => item.label === 'Exam 1')?.scope).toEqual({ lessons: [1, 2, 3, 4, 5, 6, 7] })
    expect(exams.find((item) => item.label === 'Exam 2')?.scope).toEqual({ lessons: [9, 10, 11, 12, 13, 14, 15] })
    expect(exams.find((item) => item.label === 'Exam 1')?.context).toContain('Covers lessons 1–7')
    // The header line says Section 004, so 004's final is the one, not 005's.
    const final = exams.find((item) => /final/i.test(item.label))
    expect(final).toEqual(expect.objectContaining({ label: 'Final Exam', value: '2026-12-07', confidence: 'high' }))
    expect(final?.context).toContain('Section 004')
  })

  it('offers every section\'s final, low confidence, when the section is unknown', () => {
    const parsed = parseSyllabusText(`BIOL 103 — How Cells Work · Fall 2026\n${ocrExcerpt}`, 'BIOL103 Syllabus 2.pdf', 'pdf')
    const finals = parsed.items.filter((item) => item.kind === 'exams' && /final/i.test(item.label))
    expect(finals.map((item) => [item.label, item.value, item.confidence])).toEqual(expect.arrayContaining([
      ['Final Exam (Section 004)', '2026-12-07', 'low'],
      ['Final Exam (Section 005)', '2026-12-05', 'low'],
    ]))
  })

  it('does not make a lesson out of the Fall Break row', () => {
    // OCR reads it as `oe Mo Class (Fall Breald ]`.
    const units = biol().items.filter((item) => item.kind === 'units')
    expect(units.some((item) => /break|class \(/i.test(item.label))).toBe(false)
  })

  it('names each deadline the way the syllabus names the work, not with the row text around it', () => {
    const deadlines = biol().items.filter((item) => item.kind === 'deadlines')
    expect(deadlines).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Lesson 15 quiz', value: '2026-10-19' }),
      expect.objectContaining({ label: 'Lesson 16 reflection and poster', value: '2026-10-20' }),
      expect.objectContaining({ label: 'Unit 2 Quiz', value: '2026-10-20' }),
      expect.objectContaining({ label: 'Quizzes Lessons 9, 10, and 11', value: '2026-09-27' }),
      expect.objectContaining({ label: 'Lesson 0 and 1 quiz', value: '2026-08-23' }),
      expect.objectContaining({ label: 'Bio 103 Baseline Quiz', value: '2026-08-19' }),
    ]))
    deadlines.forEach((item) => {
      expect(item.label.length, item.label).toBeLessThanOrEqual(60)
      expect(item.label, item.label).toMatch(/^[A-Z0-9]/)
      expect(item.label).not.toMatch(/^impacts\b/i)
    })
    // The row's own date is when the class meets; `1 8/20 … quiz due 8/23` is one deadline.
    expect(deadlines.some((item) => item.value === '2026-08-20' && /quiz/i.test(item.label))).toBe(false)
  })
})

describe('BIOL 103 FA23 Canvas print', () => {
  it('rejoins a cell that wraps inside an open parenthesis', () => {
    const prepared = prepareScheduleText(splitLines(fa23Rows))
    const [region] = detectScheduleRegions(prepared.lines)
    const segment = normalizeScheduleCells(prepared, region)
    expect(segment.lines).toContain('EXAM 1 (lessons 1- 8) . Students may have')
    expect(segment.lines.some((line) => line.endsWith('(due Aug. 27, 11:59 PM, ET)'))).toBe(true)
  })

  it('dates Lesson 1 and Exam 1 in 2023, the only year the print carries as "FA23" and "8/18/23"', () => {
    expect(syllabusYearHint(fa23Rows)).toBe(2023)
    const parsed = parseSyllabusText(fa23Rows, 'BIOL-103-syllabus.pdf', 'pdf')
    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'units', label: 'Lesson 1', value: '2023-08-23' }),
      expect.objectContaining({ kind: 'exams', label: 'Exam 1', value: '2023-09-27' }),
      expect.objectContaining({ kind: 'deadlines', label: 'Lesson 1 quiz', value: '2023-08-27' }),
    ]))
    expect(parsed.items.some((item) => item.kind === 'deadlines' && /^Gradescope/.test(item.label))).toBe(false)
    // `No class -- UNC Wellbeing Day` is not a session.
    expect(parsed.items.some((item) => item.kind === 'units' && item.value === '2023-09-25')).toBe(false)
    expectDatesIsoOrUnset(parsed.items)
  })
})

describe('lessons, not class days', () => {
  it('folds two class days on one topic into one lesson, numbered by the chapter read that day', () => {
    const parsed = parseSyllabusText(`PSYC 101 — Introduction to Psychology
Fall 2026
Course Schedule
Tues 8/18 Class Introduction
Thurs 8/20 The Evolution of Psychology (Chapter 1)
Tues 8/25 Research Enterprise in Psychology (Chapter 2)
Thurs 8/27 The Biological Bases of Behavior (Chapter 3)
Tues 9/1 The Biological Bases of Behavior (Chapter 3)
Thurs 9/3 Sensation and Perception (Chapter 4)`)
    const units = parsed.items.filter((item) => item.kind === 'units')
    const biological = units.find((item) => item.label === 'The Biological Bases of Behavior')
    expect(biological).toEqual(expect.objectContaining({ lesson: 3, value: '2026-08-27', dates: ['2026-08-27', '2026-09-01'] }))
    expect(units.filter((item) => item.label === 'The Biological Bases of Behavior')).toHaveLength(1)
    expect(units.find((item) => item.label === 'Class Introduction')?.lesson).toBe(0)
    expect(units.find((item) => item.label === 'Sensation and Perception')?.lesson).toBe(4)
  })

  it('numbers topics in order when the syllabus names no chapters', () => {
    const parsed = parseSyllabusText(`HIST 101 — World History
Fall 2026
Course Schedule
Mon 8/17 Welcome and syllabus
Wed 8/19 Ancient River Valleys
Mon 8/24 Ancient River Valleys
Wed 8/26 Classical Empires
Mon 8/31 Trade Networks`)
    const units = parsed.items.filter((item) => item.kind === 'units')
    expect(units.map((item) => [item.label, item.lesson])).toEqual([
      ['Welcome and syllabus', 0], ['Ancient River Valleys', 1], ['Classical Empires', 2], ['Trade Networks', 3],
    ])
  })

  it('attaches each lesson\'s learning objectives to it, not to the course goals', () => {
    const parsed = parseSyllabusText(fa23Rows, 'BIOL-103-syllabus.pdf', 'pdf')
    const lesson1 = parsed.items.find((item) => item.kind === 'units' && item.label === 'Lesson 1')
    // The excerpt keeps the row's assignment cells, not its objective lines;
    // objective reading itself is the next test.
    expect(lesson1?.lesson).toBe(1)
    expect(parsed.items.some((item) => item.kind === 'standards' && /GRQ|Mastering/.test(item.label))).toBe(false)
    const withObjectives = parseSyllabusText(`BIO 101 — Cells\nFall 2026\n1 8/20 Identify positive and negative controls\nInterpret different kinds of data\n2 8/25 Outline the major pathways of protein transport\n3 8/27 Discern the mode of inheritance`)
    expect(withObjectives.items.find((item) => item.kind === 'units' && item.label === 'Lesson 1')?.objectives)
      .toEqual(['Identify positive and negative controls', 'Interpret different kinds of data'])
    expect(withObjectives.items.filter((item) => item.kind === 'standards')).toHaveLength(0)
  })

  it('reads objectives that wrap across table lines and stops at the assignment column', () => {
    expect(lessonObjectives([
      'Identify the',
      'independent and',
      'dependent variables in a controlled experiment',
      'Interpret different kinds of data Before class: GRQ-1 and Mastering-Lesson 1',
      'After class: Lesson 1 quiz on Gradescope',
    ])).toEqual(['Identify the independent and dependent variables in a controlled experiment', 'Interpret different kinds of data'])
  })
})

describe('a document\'s own sentences about cumulative exams', () => {
  it('marks every exam not cumulative when the syllabus says so in prose', () => {
    const parsed = parseSyllabusText(`PSYC 101 — Introduction to Psychology
Fall 2026
Examinations: There will be two non-cumulative exams and a final in this course.
The final exam is not cumulative but application of earlier material may be needed.
Thurs 9/17 Exam 1
Tues 11/3 Exam 2
Thurs 12/10 Final Exam`)
    const exams = parsed.items.filter((item) => item.kind === 'exams')
    expect(exams).toHaveLength(3)
    exams.forEach((item) => expect(item.scope?.cumulative, item.label).toBe(false))
  })

  it('reads the scope across a parenthesis split over two lines', () => {
    const parsed = parseSyllabusText(fa23Rows, 'BIOL-103-syllabus.pdf', 'pdf')
    expect(parsed.items.find((item) => item.kind === 'exams' && item.label === 'Exam 1')?.scope).toEqual({ lessons: [1, 2, 3, 4, 5, 6, 7, 8] })
  })
})

describe('dates are ISO or unset', () => {
  it('leaves a date unset, low confidence, with the source wording in context when no year can be found', () => {
    const parsed = parseSyllabusText(`CHEM 262 — Organic Chemistry II
Midterm Exam — October 14
Problem set 1 due September 9`)
    const dated = parsed.items.filter((item) => item.kind === 'exams' || item.kind === 'deadlines')
    expect(dated).toHaveLength(2)
    dated.forEach((item) => {
      expect(item.value).toBeUndefined()
      expect(item.confidence).toBe('low')
      expect(item.context).toMatch(/^Date as written: (?:October 14|September 9)$/)
    })
    expectDatesIsoOrUnset(parsed.items)
  })

  it('dates a week written as a single day, not only as a range', () => {
    const parsed = parseSyllabusText(`GEOG 121 — Geographies of Globalization
Fall 2026
Course Schedule
Week 14. Group Presentations
Nov 16-20 Final Group Presentations
Week 15. The Planetary and the Global
Nov 23
Dipesh Chakrabarty, “The Climate of History: Four Theses,” Critical Inquiry 35, No. 2 (Winter 2009), 197-222.`)
    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'units', label: 'The Planetary and the Global', value: '2026-11-23', context: 'Week 15' }),
    ]))
  })

  it('reads the year from a term code or from dated page headers', () => {
    expect(syllabusYearHint('Syllabus: BIOL103.002.FA23')).toBe(2023)
    expect(syllabusYearHint("PSYC 101 SP '27")).toBe(2027)
    expect(syllabusYearHint('8/18/23, 12:30 PM header\n8/18/23, 12:31 PM header\n1/2/99 footnote')).toBe(2023)
    // The term in words still wins over a print header's date.
    expect(syllabusYearHint('Fall 2026\n8/18/23, 12:30 PM header')).toBe(2026)
  })
})
