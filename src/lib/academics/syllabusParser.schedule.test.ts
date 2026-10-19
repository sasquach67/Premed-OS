import { describe, expect, it } from 'vitest'
import ocrExcerpt from './fixtures/syllabus/biol103-fall26-ocr-excerpt.txt?raw'
import fa23Rows from './fixtures/syllabus/biol103-fa23-canvas-rows.txt?raw'
import { detectScheduleRegions, normalizeScheduleCells, parseSyllabusText, prepareScheduleText } from './syllabusParser'

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
    expect(prepared.lines).toContain('Mon., 9/25')
    expect(prepared.lines).toContain('Wed., 9/27')
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
  })

  it.todo('does not make a lesson out of the Fall Break row (stage 3)')
})

describe('BIOL 103 FA23 Canvas print', () => {
  it('rejoins a cell that wraps inside an open parenthesis', () => {
    const prepared = prepareScheduleText(splitLines(fa23Rows))
    const [region] = detectScheduleRegions(prepared.lines)
    const segment = normalizeScheduleCells(prepared, region)
    expect(segment.lines).toContain('EXAM 1 (lessons 1- 8) . Students may have')
    expect(segment.lines.some((line) => line.endsWith('(due Aug. 27, 11:59 PM, ET)'))).toBe(true)
  })

  it.todo('dates Lesson 1 and Exam 1 in 2023 from "FA23" (stage 2)')
})
