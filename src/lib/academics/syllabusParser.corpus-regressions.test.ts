import { describe, expect, it } from 'vitest'
import { parseSyllabusText, pdfTextToLines } from './syllabusParser'

describe('syllabus corpus regressions', () => {
  it('keeps ANTH standards limited to the three stated course goals', () => {
    const parsed = parseSyllabusText(`ANTH 147 — Comparative Systems
Fall 2026
COURSE GOALS: Upon completion of ANTH 147, the student should be able to:
1. Compare three evidence-based approaches to the course subject.
2. Explain how local context changes professional practice.
3. Describe how practitioners address conflicting frameworks.
These are the learning outcomes that are expected of students after completing a FC-GLOBAL course.
1. Classify broad exchanges that shape regions of the world.
Learning Outcomes for a Focus Capacities -KNOWING course.
1. Evaluate ways that broad categories structure knowledge.
SCHEDULE FOR CLASS, READINGS, AND EXAMS
Week 1: Foundations and Themes
Rivera, A. “An Invented Reading,” pp. 1–12.`)

    expect(parsed.items.filter((item) => item.kind === 'standards').map((item) => item.label)).toEqual([
      'Compare three evidence-based approaches to the course subject.',
      'Explain how local context changes professional practice.',
      'Describe how practitioners address conflicting frameworks.',
    ])
  })

  it('does not publish an implausible PSYC meeting range from header logistics', () => {
    const parsed = parseSyllabusText(`PSYC 101 — Introduction to Psychology
Fall 2026
TR 8am-9:15pm
Arts Center Rm 121
Instructor: Dr. Sample
Final Exam Thursday, Dec 10 8a-11a at the same location as class meetings.`)
    const logistics = parsed.items.filter((item) => item.kind === 'logistics').map((item) => item.label)

    expect(logistics).toEqual(expect.arrayContaining(['Arts Center Rm 121', 'Instructor: Dr. Sample']))
    expect(logistics).toContain('Tuesday · Thursday')
    expect(logistics).not.toContain('TR 8am-9:15pm')
    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'logistics', label: 'Meeting time', value: '8 AM–9:15 AM', confidence: 'low',
        context: 'Corrected meridiem; review source', evidence: expect.objectContaining({ quote: 'TR 8am-9:15pm' }),
      }),
    ]))
  })

  it('keeps a professor and lecture schedule that share one DOCX header row', () => {
    const parsed = parseSyllabusText(`Anthropology 147 Comparative Healing Systems
Fall 2026
Prof. M. Rivkin-Fish, mrfish@unc.edu T & TH 5:00-6:15 Lectures (+ Recitations)
Office: 305A Alumni Hall and by Zoom 0121 Hanes Art Center
Teaching Assistants
Name: Student Assistant
Email: assistant@unc.edu`)
    const logistics = parsed.items.filter((item) => item.kind === 'logistics')

    expect(logistics).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: expect.stringContaining('Prof. M. Rivkin-Fish') }),
      expect.objectContaining({ label: 'Instructor: M. Rivkin-Fish,' }),
    ]))
  })

  it('reconstructs dated readings, exams, and deadlines from a flattened schedule', () => {
    const parsed = parseSyllabusText(`BIO 110 — Cell Systems
Fall 2026
Course Schedule
Date
Topic
Reading and Work
Tues 8/25
Research Methods
Chapter 2
Forum 1 due 8/25
Thurs 9/17
Exam 1`)

    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'readings',
        label: expect.stringContaining('Chapter 2'),
        value: '2026-08-25',
        evidence: expect.objectContaining({ quote: expect.stringContaining('Chapter 2'), location: expect.stringMatching(/^line/) }),
      }),
      expect.objectContaining({
        kind: 'deadlines',
        label: 'Forum 1',
        value: '2026-08-25',
        evidence: expect.objectContaining({ quote: expect.stringContaining('Forum 1 due 8/25'), location: expect.stringMatching(/^line/) }),
      }),
      expect.objectContaining({
        kind: 'exams',
        label: 'Exam 1',
        value: '2026-09-17',
        evidence: expect.objectContaining({ quote: expect.stringContaining('Exam 1'), location: expect.stringMatching(/^line/) }),
      }),
    ]))
    expect(parsed.items).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'units', value: '2026-09-17' }),
    ]))
  })

  it('does not turn exam review, quiz, or score-replacement prose into exam dates', () => {
    const parsed = parseSyllabusText(`BIOL 103 — How Cells Function
Fall 2026
Course Schedule
8 9/15 Review activity for the unit 1 exam
Unit 1 Quiz due 9/15 at 11:59 PM
. 9/17 EXAM 1 (lessons 1-7)
22 11/12 Review for the unit 3 exam
After class: Unit 3 quiz due at 11:59 PM on 11/15
11/17 EXAM 3 (lessons 17-21)
25 12/1 Review Activity for the Final Exam
If an exam score is replaced by the final exam score, the higher value is used.`)

    expect(parsed.items.filter((item) => item.kind === 'exams').map((item) => [item.label, item.value])).toEqual([
      ['Exam 1', '2026-09-17'],
      ['Exam 3', '2026-11-17'],
    ])
  })

  it('orders same-baseline PDF cells by visual column before parsing the schedule row', () => {
    const extracted = pdfTextToLines([
      { str: 'BIO 110 — Cell Systems', transform: [1, 0, 0, 1, 20, 740], hasEOL: true },
      { str: 'Fall 2026', transform: [1, 0, 0, 1, 20, 720], hasEOL: true },
      { str: 'Course Schedule', transform: [1, 0, 0, 1, 20, 700], hasEOL: true },
      { str: 'Research Methods', transform: [1, 0, 0, 1, 150, 680] },
      { str: 'Tues 8/25', transform: [1, 0, 0, 1, 20, 680] },
      { str: 'Chapter 2', transform: [1, 0, 0, 1, 330, 680] },
      { str: '(Quiz 1 due 8/25)', transform: [1, 0, 0, 1, 450, 680], hasEOL: true },
    ])

    expect(extracted.split('\n').at(-1)).toBe('Tues 8/25 Research Methods Chapter 2 (Quiz 1 due 8/25)')
    const parsed = parseSyllabusText(extracted)
    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'readings', label: expect.stringContaining('Chapter 2'), value: '2026-08-25' }),
      expect.objectContaining({ kind: 'deadlines', label: 'Quiz 1', value: '2026-08-25' }),
    ]))
    expect(parsed.items.filter((item) => item.kind === 'units' && item.value === '2026-08-25')).toHaveLength(1)
  })

  it('retains bounded policy bodies instead of saving only their headings', () => {
    const parsed = parseSyllabusText(`ENGL 105: Introduction to Composition and Rhetoric
Fall 2026
Course Policies:
Plagiarism and the Honor Code
Students are bound by the Honor Pledge. Plagiarism will not be tolerated.
In many cases, using artificial intelligence tools to develop assignment language violates course policy.
Non-Discrimination Policy
Our classroom should be a space where students can share ideas without fear.
AI Policy
Use AI minimally and reflectively, and cite it whenever it contributes to a project.
Resources:
The Writing Center offers individual consultations.`)

    const policies = parsed.items.filter((item) => item.kind === 'policies')
    expect(policies).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: 'Plagiarism and the Honor Code',
        value: expect.stringContaining('Plagiarism will not be tolerated'),
        confidence: 'high',
      }),
      expect.objectContaining({
        label: 'Non-Discrimination Policy',
        value: expect.stringContaining('share ideas without fear'),
        confidence: 'high',
      }),
      expect.objectContaining({
        label: 'AI Policy',
        value: expect.stringContaining('cite it whenever'),
        confidence: 'high',
      }),
    ]))
    expect(policies.find((item) => item.label === 'AI Policy')?.value).not.toContain('Writing Center')
  })

  it('captures inline attendance, make-up, accessibility, and honor-code rules with their source text', () => {
    const parsed = parseSyllabusText(`ANTH 147 — Comparative Healing Systems
Fall 2026
CLASS POLICIES:
• Attendance at lecture is highly recommended but not required. Attendance at recitation is required.
• Make-up exams: Students must have an excused absence to take a make-up exam.
• Accommodations: Accessibility Resources and Services coordinates approved accommodations.
• Honor Code All students must follow the UNC honor code.
In addition, the use of AI for composing reading responses is prohibited.
SCHEDULE FOR CLASS, READINGS, AND EXAMS
Week 1: Introduction`)

    const policies = parsed.items.filter((item) => item.kind === 'policies')
    expect(policies).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Attendance', value: expect.stringContaining('recitation is required') }),
      expect.objectContaining({ label: 'Make-up exams', value: expect.stringContaining('excused absence') }),
      expect.objectContaining({ label: 'Accommodations', value: expect.stringContaining('approved accommodations') }),
      expect.objectContaining({ label: 'Honor Code', value: expect.stringContaining('use of AI') }),
    ]))
  })

  it('bounds source-backed sections and does not mistake body prose for a Communication heading', () => {
    const parsed = parseSyllabusText(`PSYC 101 — Introduction to Psychology
Fall 2026
Course Description: This is a survey of psychological science.
Course Goals
1. Explain how evidence changes psychological claims.
Class Communication: Use the class email for course questions.
Classroom Technology Policy
Phones must remain away during lecture.
Keep in mind that forwarding email may cause you to miss important communications about the course.`)

    const description = parsed.items.find((item) => item.kind === 'logistics' && item.label === 'Course description')
    const communication = parsed.items.find((item) => item.kind === 'logistics' && item.label === 'Communication')
    expect(description?.value).toBe('This is a survey of psychological science.')
    expect(communication?.value).toBe('Use the class email for course questions.')
    expect(parsed.items.filter((item) => item.kind === 'logistics' && item.label === 'Communication')).toHaveLength(1)
  })

  it('limits teaching-assistant contacts to the assistant section', () => {
    const parsed = parseSyllabusText(`Anthropology 147 Comparative Healing Systems
Fall 2026
Teaching Assistants
Name: Ian Dale
Name: Fiona Hasanaj
ian.dale@unc.edu
fiona.hasanaj@unc.edu
COURSE DESCRIPTION:
This course compares healing systems.
Accessibility Resources and Services: Contact ars@unc.edu for accommodations.
Title IX Resources: Contact titleixcoordinator@unc.edu for support.`)

    const assistants = parsed.items.filter((item) => item.kind === 'logistics' && item.context === 'Teaching assistant')
    expect(assistants).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Ian Dale', value: expect.stringContaining('ian.dale@unc.edu') }),
      expect.objectContaining({ label: 'Fiona Hasanaj', value: expect.stringContaining('fiona.hasanaj@unc.edu') }),
    ]))
    expect(assistants.some((item) => /ars|titleix/i.test(`${item.label} ${item.value}`))).toBe(false)
  })

  it('separates multiple teaching assistants flattened onto one source line', () => {
    const parsed = parseSyllabusText(`GEOG 121 — Geographies of Globalization
Fall 2026
Teaching Assistants
Victoria Ting · vting@unc.edu Sophia Alhadeff · sophalh@unc.edu
Course Description
This course traces global systems.`)

    const assistants = parsed.items.filter((item) => item.kind === 'logistics' && item.context === 'Teaching assistant')
    expect(assistants).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Victoria Ting', value: expect.stringContaining('vting@unc.edu') }),
      expect.objectContaining({ label: 'Sophia Alhadeff', value: expect.stringContaining('sophalh@unc.edu') }),
    ]))
    expect(assistants.filter((item) => item.label === 'Victoria Ting')).toHaveLength(1)
    expect(assistants.filter((item) => item.label === 'Sophia Alhadeff')).toHaveLength(1)
  })

  it('surfaces section and credit metadata and recovers a title from a split GEOG header', () => {
    const parsed = parseSyllabusText(`Geographies of Globalization UNC Chapel Hill
GEOG 121-002 · Fall 2026
Credit Hours: 3
Teaching Assistants
Alex Example · alex@example.edu
Course Description
This course traces global systems.`)

    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'identity', label: 'GEOG 121', value: 'Geographies of Globalization' }),
      expect.objectContaining({ kind: 'logistics', label: 'Section', value: '002', context: 'Course detail' }),
      expect.objectContaining({ kind: 'logistics', label: 'Credits', value: '3', context: 'Course detail' }),
    ]))
  })

  it('surfaces dotted course sections and keeps a source-backed grade scale reviewable', () => {
    const parsed = parseSyllabusText(`Psychology 101.001 — General Psychology
Fall 2026
Grading Scale
A: 93–100; A-: 90–92; B+: 87–89
Course Schedule
Tuesday 8/25 Introduction`)

    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'logistics', label: 'Section', value: '001', context: 'Course detail' }),
      expect.objectContaining({ kind: 'logistics', label: 'Grade scale', value: 'A: 93–100; A-: 90–92; B+: 87–89', context: 'Course operations' }),
    ]))
  })

  it('does not invent a research-requirement date unless the source ties it to the last class', () => {
    const undated = parseSyllabusText(`PSYC 101 — Introduction to Psychology
Fall 2026
Course Schedule
Thursday 12/1 Closing discussion
Research Requirement: All students complete the research component.`)
    const explicit = parseSyllabusText(`PSYC 101 — Introduction to Psychology
Fall 2026
Course Schedule
Thursday 12/1 Closing discussion
Research Requirement: Complete this requirement by the last day of class.`)

    expect(undated.items.find((item) => item.kind === 'deadlines' && item.label === 'Research requirement')).toMatchObject({ value: undefined, confidence: 'low' })
    expect(explicit.items.find((item) => item.kind === 'deadlines' && item.label === 'Research requirement')).toMatchObject({ value: '2026-12-01', confidence: 'high' })
  })

// ── Registrar-template corpus (BIOL 103 "How Cells Function", ENGL 105) ──
  // Both files are generated from the same UNC template, and both imported with
  // no grade scale and no required materials at all: the template never writes
  // the literal headings `Grading Scale:` or `Required Materials:`.

  it('reads the BIOL grade scale and required materials from registrar-template headings', () => {
    const parsed = parseSyllabusText(`BIOL 103 : HOW CELLS FUNCTION
Section: 005
2026 Fall
Credit Hours: 3.00
Final Letter Grades for BIOL 103
A = 93.0-100 A- = 90.0-92.9
B+ = 87.0-89.9 B = 83.0-86.9 B- = 80.0-82.9
F = 0-59.9
Course Materials (physical and/or electronic) required for
purchase
MASTERINGBIOLOGY WITH ETEXT STUDENT
ISBN: 822014666125
Publisher: VST
Mandatory Disclaimer
This course engages diverse scholarly perspectives.`)

    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'logistics', label: 'Grade scale', context: 'Course operations',
        value: 'A = 93.0-100 A- = 90.0-92.9 B+ = 87.0-89.9 B = 83.0-86.9 B- = 80.0-82.9 F = 0-59.9',
      }),
      expect.objectContaining({
        kind: 'logistics', label: 'Required materials', context: 'Course material',
        value: 'MASTERINGBIOLOGY WITH ETEXT STUDENT ISBN: 822014666125 Publisher: VST',
      }),
    ]))
  })

  it('keeps an all-caps ENGL letter-band row out of the heading heuristic', () => {
    // `A (94–100) A- (90–93) B+ (87–89)` is all-caps once digits and brackets
    // are stripped, so the generic all-caps heading rule claimed it as a new
    // section and the ENGL 105 scale imported empty.
    const parsed = parseSyllabusText(`ENGL 105 : ENG COMP & RHETORIC
2026 Fall
Final letter grades are determined according to the following scale:
A (94–100) A- (90–93) B+ (87–89) B (83–86) B- (80–82) C+ (77–79)
C (73–76) C- (70–72) D+ (67–69) D (63–66) D- (60–62) F (below 60)
Course Materials (physical and/or electronic) required for
purchase
TAR HEEL WRITING GUIDE DIGITAL CODE`)

    expect(parsed.items.find((item) => item.label === 'Grade scale')?.value)
      .toBe('A (94–100) A- (90–93) B+ (87–89) B (83–86) B- (80–82) C+ (77–79) C (73–76) C- (70–72) D+ (67–69) D (63–66) D- (60–62) F (below 60)')
  })

  it('drops PDF page footers instead of threading them through section bodies', () => {
    const parsed = parseSyllabusText(`GEOG 121 — Geographies of Globalization
Fall 2026
Course Description: The world seemed to shrink.
Page 1 of 6
Local places were remade by distant forces.`)

    const description = parsed.items.find((item) => item.label === 'Course description')
    expect(description?.value).toBe('The world seemed to shrink. Local places were remade by distant forces.')
    expect(parsed.items.some((item) => /Page \d+ of \d+/.test(item.label))).toBe(false)
  })

  // ── Policy boundaries ──

  it('splits a headed sub-section out of a policy body instead of saving one blob', () => {
    // PSYC 101: the make-up policy ran straight through the ARS accommodation
    // rules and the exam-review workflow, then was cut mid-sentence by the
    // line cap — one unreadable blob offered for saving.
    const parsed = parseSyllabusText(`PSYC 101 — Introduction to Psychology
Fall 2026
• Make-up exams: No make-ups for Exam 1 will be given unless you have a course approved excuse.
Make-ups will only be offered on 9/22 and 9/24. These are the only make-up dates.
ARS-eligible students: If you are eligible for Accessibility Resources & Service, please contact them to proctor your exams.
Please do so early in the semester because exam slots fill up quickly.
Class Conduct : It is important that students show up to class on time.`)
    const policies = parsed.items.filter((item) => item.kind === 'policies')

    const makeUp = policies.find((item) => item.label === 'Make-up exams')
    expect(makeUp?.value).not.toMatch(/Accessibility Resources/)
    expect(policies.map((item) => item.label)).toEqual(expect.arrayContaining(['Make-up exams', 'ARS-eligible students']))
    expect(policies.find((item) => item.label === 'ARS-eligible students')?.value)
      .toMatch(/^If you are eligible.*fill up quickly\.$/)
  })

  it('ends a capped policy body on a complete sentence', () => {
    const filler = Array.from({ length: 45 }, (_, index) => `Continuing clause number ${index} of the policy runs on.`).join('\n')
    const parsed = parseSyllabusText(`PSYC 101 — Introduction to Psychology
Fall 2026
• Make-up exams: No make-ups will be given without an approved excuse.
${filler}`)

    const makeUp = parsed.items.find((item) => item.kind === 'policies' && item.label === 'Make-up exams')
    expect(makeUp?.value).toMatch(/\.$/)
  })

  // ── People: attribution, deduplication, and stated-count conflicts ──

  it('attaches an instructor email written on its own header line', () => {
    // Both BIOL 103 and PSYC 101 split the name and the address across two
    // lines, and the contact parser only ever read them from one line — so the
    // instructor's email was dropped entirely.
    const parsed = parseSyllabusText(`BIOL 103: How Cells Function
Fall 2026
Professor: Dr. Emily Weber (she/her)
Email: emily_weber@UNC.edu
Office: Coker Hall, 104`)

    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'logistics', label: 'Instructor: Dr. Emily Weber', context: 'Professor',
        value: expect.stringContaining('emily_weber@UNC.edu'),
      }),
    ]))
  })

  it('merges a restated office-hours line into the instructor it belongs to', () => {
    const parsed = parseSyllabusText(`PSYC 101 — Introduction to Psychology
Fall 2026
Instructor: Ndidi Adeyanju, PhD
Office Hours: Wednesday,10-noon via Zoom and by appointment
Email: psyc101adeyanju@unc.edu
Office Hours: If you have any questions or problems with the course, please visit me during office hours`)
    const logistics = parsed.items.filter((item) => item.kind === 'logistics')

    expect(logistics.filter((item) => /^Office Hours:/i.test(item.label))).toHaveLength(0)
    expect(logistics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: 'Instructor: Ndidi Adeyanju, PhD', context: 'Professor',
        value: expect.stringContaining('Wednesday,10-noon via Zoom'),
      }),
    ]))
  })

  it('does not attribute unowned office hours to the professor when TAs hold hours too', () => {
    const parsed = parseSyllabusText(`ANTH 147 — Comparative Healing Systems
Fall 2026
Prof. M. Rivkin-Fish, mrfish@unc.edu T & TH 5:00-6:15 Lectures
Teaching Assistants
Name: Ian Dale
Email: iandale@email.unc.edu
Office Hours: Tuesdays, 12:30-2:30pm& by appt
Office Hours: Thursdays, 3-5pm`)
    const hours = parsed.items.filter((item) => item.kind === 'logistics' && /^Office Hours:/i.test(item.label))

    expect(hours.length).toBeGreaterThan(0)
    hours.forEach((item) => {
      expect(item.context).toBe('Office hours — the source does not say whose')
      expect(item.context).not.toMatch(/Rivkin-Fish/)
    })
  })

  it('flags a stated assistant count that disagrees with the assistants listed', () => {
    // PSYC 101 says "three instructional assistants" and then names four.
    // Both facts are in the source, so neither is ours to silently correct.
    const parsed = parseSyllabusText(`PSYC 101 — Introduction to Psychology
Fall 2026
Instructional Assistants: There are three instructional assistants (Fatima Al-Kadhi, Annabel Gereau, Annette Kim and Chaewoo Lim) assigned to this class.
• Fatima: Monday, 10a-11a on zoom
• Annette: Tuesday, 11a-noon on zoom
• Annabel: Tuesday, 4p-5p on zoom
• Chaewoo: Friday, 2p-3p at Davie 320`)

    expect(parsed.items.filter((item) => item.context === 'Teaching assistant')).toHaveLength(4)
    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'logistics', label: 'Assistant count needs review', confidence: 'low', context: 'Source conflict',
        value: expect.stringContaining('names 4'),
        evidence: expect.objectContaining({ quote: expect.stringContaining('There are three instructional assistants') }),
      }),
    ]))
  })

  it('keeps support and Title IX contacts out of the teaching-assistant list', () => {
    const parsed = parseSyllabusText(`PSYC 101 — Introduction to Psychology
Fall 2026
Instructional Assistants: Their office hours are below.
• Fatima: Monday, 10a-11a on zoom
Counseling and Psychological Services
CAPS is strongly committed to addressing mental health needs. Reach them at caps@unc.edu.
Title IX Resources
Any student impacted by harassment may contact the Equal Opportunity and Compliance Office at eoc@unc.edu.
Accessibility Resources and Services
Contact ars@unc.edu to arrange accommodations.`)
    const assistants = parsed.items.filter((item) => item.context === 'Teaching assistant').map((item) => item.label)

    expect(assistants).toEqual(['Fatima'])
    expect(assistants).not.toEqual(expect.arrayContaining([
      expect.stringMatching(/Counseling|Title IX|Accessibility|Equal Opportunity/i),
    ]))
    expect(parsed.items.some((item) => (item.value ?? '').includes('ars@unc.edu') && item.context === 'Teaching assistant')).toBe(false)
  })

  it('drops unowned office and location stubs that a scoped contact already carries', () => {
    // ANTH 147 reviewed with eleven nameless rows (`Office: TBD`, `Office
    // Hours:`, `Office: TBA`) sitting beside the correctly scoped assistants.
    const parsed = parseSyllabusText(`ANTH 147 — Comparative Healing Systems
Fall 2026
Teaching Assistants
Name: Ian Dale
Email: iandale@email.unc.edu
Office: TBD
Office Hours:
Office: TBA`)
    const labels = parsed.items.filter((item) => item.kind === 'logistics').map((item) => item.label)

    expect(labels).not.toEqual(expect.arrayContaining(['Office: TBD', 'Office: TBA', 'Office Hours:']))
    expect(labels).toContain('Ian Dale')
  })
})
