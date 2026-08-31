import { describe, expect, it } from 'vitest'
import { mergeSyllabusProposals, parseSyllabusText, weightGap } from './syllabusParser'

describe('syllabus parser', () => {
  const text = `CHEM 262 — Organic Chemistry II
Student learning outcomes
1. Explain aromatic substitution.
2. Distinguish stereochemical relationships.
Week 1: Aromatic substitution
Midterm Exam — October 14, 2026
Problem sets — 15%
Exams — 60%
Final — 25%
Problem set 1 due September 9, 2026
Attendance is required. Office hours Tuesday 2 PM.`

  it('extracts deterministic, attributable syllabus facts without a key', () => {
    const proposal = parseSyllabusText(text)
    expect(proposal.items.some((item) => item.kind === 'identity' && item.label === 'CHEM 262')).toBe(true)
    expect(proposal.items.some((item) => item.kind === 'exams' && item.value === '2026-10-14')).toBe(true)
    expect(proposal.items.filter((item) => item.kind === 'weights')).toHaveLength(3)
    expect(proposal.items.filter((item) => item.kind === 'standards').map((item) => item.label)).toEqual(['Explain aromatic substitution.', 'Distinguish stereochemical relationships.'])
    expect(proposal.items.find((item) => item.kind === 'units')?.evidence.location).toBe('line 5')
    expect(weightGap(proposal.items)).toBe(0)
  })

  it('calls a near-empty text layer a scan instead of claiming nothing parsed', () => {
    expect(parseSyllabusText('  ').scanDetected).toBe(true)
  })

  it('keeps schedule entries as context when the syllabus does not state learning standards', () => {
    const parsed = parseSyllabusText(`PSYC 101 — Introduction to Psychology
Week 1: Research enterprise in psychology
Week 2: Sensation and perception
Exam 1 — September 17, 2026`)

    expect(parsed.items.filter((item) => item.kind === 'units')).toHaveLength(2)
    expect(parsed.items.filter((item) => item.kind === 'standards')).toHaveLength(0)
  })

  it('reads a named course heading and numeric-date course schedule', () => {
    const parsed = parseSyllabusText(`Psychology 101.001 Introduction to Psychology
Fall 2026
Tues 8/25 Research Enterprise in Psychology Chapter 2 (Forum 1 due 8/25)
Thurs 9/3 Sensation and Perception Chapter 4 (Response Paper 1 due)
Tues 9/17 Exam 1
Final Exam Thursday, Dec 10 8a-11a`)

    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'identity', label: 'PSYC 101', value: 'Introduction to Psychology' }),
      expect.objectContaining({ kind: 'units', label: 'Research Enterprise in Psychology' }),
      expect.objectContaining({ kind: 'deadlines', label: 'Forum 1', value: '2026-08-25' }),
      expect.objectContaining({ kind: 'deadlines', label: 'Response Paper 1', value: '2026-09-03' }),
      expect.objectContaining({ kind: 'exams', label: 'Exam 1', value: '2026-09-17' }),
      expect.objectContaining({ kind: 'exams', label: 'Final Exam', value: '2026-12-10' }),
    ]))
  })

  it('sweeps objectives, dated chapter readings, staff, support, and a last-class requirement', () => {
    const parsed = parseSyllabusText(`Psychology 101.001 Introduction to Psychology
Fall 2026
Objectives and Expectations: In completing this course, you will be able to
• define both the science and the practice of psychology
• master terms and theories vital to the understanding of
psychology as a science
Instructional Assistants: Weekly office hours are below.
• Fatima: Monday, 10a-11a on Zoom
• Chaewoo: Friday, 2p-3p at Davie 320
Research Requirement: Complete the research requirement by the last day of class.
Accessibility Resources and Services: See https://ars.unc.edu for accommodations.
Learning Center: See https://learningcenter.unc.edu for support.
Writing Center: See https://writingcenter.unc.edu for writing support.
Course Schedule
Thurs 8/20 The Evolution of Psychology Chapter 1
Tues 12/1 Treatment of Psychological Disorders Chapter 15`)

    expect(parsed.items.filter((item) => item.kind === 'standards').map((item) => item.label)).toEqual([
      'define both the science and the practice of psychology',
      'master terms and theories vital to the understanding of psychology as a science',
    ])
    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'readings', label: expect.stringContaining('Chapter 1'), value: '2026-08-20' }),
      expect.objectContaining({ kind: 'readings', label: expect.stringContaining('Chapter 15'), value: '2026-12-01' }),
      expect.objectContaining({ kind: 'deadlines', label: 'Research requirement', value: '2026-12-01', context: 'Course requirement' }),
      expect.objectContaining({ kind: 'logistics', label: 'Fatima', context: 'Teaching assistant' }),
      expect.objectContaining({ kind: 'logistics', label: 'Learning Center', context: 'Support resource' }),
      expect.objectContaining({ kind: 'logistics', label: 'Writing Center', context: 'Support resource' }),
    ]))
  })

  it('keeps real header logistics separate from later exam-location prose', () => {
    const parsed = parseSyllabusText(`PSYC 101 — Introduction to Psychology
TR 8am-9:15pm
Hanes Art Center Rm 121
Instructor: Ndidi Adeyanju, PhD
Final Exam Thursday, Dec 10 8a-11a at the same location as class meetings.`)
    const logistics = parsed.items.filter((item) => item.kind === 'logistics').map((item) => item.label)
    expect(logistics).toEqual(expect.arrayContaining(['Hanes Art Center Rm 121', 'Instructor: Ndidi Adeyanju, PhD']))
    expect(logistics).not.toContain('TR 8am-9:15pm')
    expect(logistics).not.toContain(expect.stringContaining('same location as class meetings'))
  })

  it('merges related syllabus files without duplicating facts and retains per-file evidence', () => {
    const overview = parseSyllabusText(`CHEM 262 — Organic Chemistry II
Student learning outcomes
1. Explain aromatic substitution.
Problem sets — 15%`, 'Course overview.txt')
    const schedule = parseSyllabusText(`CHEM 262 — Organic Chemistry II
Midterm Exam — October 14, 2026
Week 1: Aromatic substitution`, 'Course schedule.txt')
    overview.unreadablePageCount = 1
    overview.pageCount = 3
    schedule.unreadablePageCount = 0
    schedule.pageCount = 2

    const merged = mergeSyllabusProposals([overview, schedule])

    expect(merged.sourceName).toBe('Course overview.txt + Course schedule.txt')
    expect(merged.items.filter((item) => item.kind === 'identity')).toHaveLength(1)
    expect(merged.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'standards', evidence: expect.objectContaining({ sourceName: 'Course overview.txt' }) }),
      expect.objectContaining({ kind: 'exams', evidence: expect.objectContaining({ sourceName: 'Course schedule.txt' }) }),
    ]))
    expect(merged.searched.exams).toContain('2 files')
    expect(merged.unreadablePageCount).toBe(1)
    expect(merged.pageCount).toBe(5)
  })

  it('recognizes written registrar schedules as class logistics', () => {
    const parsed = parseSyllabusText(`PSYC 101 — Introduction to Psychology
Instructor: Ndidi Adeyanju, PhD
T/Th 8:00 AM-9:15 AM`)
    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'logistics', label: 'T/Th 8:00 AM-9:15 AM' }),
    ]))
    expect(parsed.structureFound).toContain('logistics')
  })

  it('stores the objective itself rather than its instructional lead-in', () => {
    const parsed = parseSyllabusText(`BIOL 103 — How Cells Function
Course learning objectives
Students will explain how membrane gradients drive transport.`)
    expect(parsed.items.filter((item) => item.kind === 'standards').map((item) => item.label)).toEqual([
      'explain how membrane gradients drive transport.',
    ])
  })

  it('reconstructs the ANTH 147 objectives, grade structure, readings, and exams from a flattened DOCX schedule', () => {
    const parsed = parseSyllabusText(`Anthropology 147 Comparative Healing Systems
Fall 2026
COURSE GOALS: Upon completion of ANTH 147, the student should be able to:
Demonstrate knowledge of the global diversity of cultural understandings about health, illness, the body, and systems of healing.
Explain some of the ways biomedicine is shaped by Western cultural ideas and the specific contexts in which it is practiced.
Explain why practitioners of health development and clinical medicine often encounter clashes between their cultural knowledge and the cultural knowledge of those they seek to help and describe anthropological approaches to addressing such challenges.
These are the learning outcomes that are expected of students after completing a FC-GLOBAL course.
Classify and analyze diverse historical, social, and political exchanges that shape nations, regions, and cultural traditions of the world.
Translate among contrasting civic cultures, social values, and moral commitments that characterize differences among peoples and societies, including those beyond the North Atlantic region.
Assess ways that political and economic institutions shape contemporary global relations.
Explain human and environmental challenges that transcend national borders.
Questions for Students
What forces connect and distinguish the experiences of peoples, societies, and human organization around the world?
Learning Outcomes for a Focus Capacities -KNOWING course.
Recognize and use one or more approach(es) to developing and validating knowledge of the unfamiliar world.
Evaluate ways that temporal, spatial, scientific, and philosophical categories structure knowledge.
Interrogate assumptions that underlie our own perceptions of the world.
Employ strategies to mitigate or adjust for preconceptions and biases.
Apply critical insights to understand patterns of experience and belief.
Questions for Students
What norms and expectations do I take for granted?
GRADING PROCEDURES:
Submit 6 Draft Reading Responses (RR) x 5 pts each: 30 pts (3%)
Oral Participation in Recitations: 100 pts (10%)
Submit 2 Revised RRs + Learning Assessment x 45 pts each: 90 pts (9%)
Midterm 1 240 pts (24%)
Midterm 2 260 pts (26%)
Final Exam 280 pts (28%)
SCHEDULE FOR CLASS, READINGS, RECITATION SECTIONS,
READING RESPONSE ESSAYS (RRs) AND EXAMS
Week/Theme
READING
Recitation to Discuss Previous Week's Readings?
Introduction: 8/19- 8/21
Symbols, Political Economy, and the Burdens of Inequality in Illness and Healing
Berry, N. “The Story of Rosario,” in Unsafe Motherhood: Mayan Maternal Mortality and Subjectivity in Post-War Guatemala, pp. xi-xix.
Medina, “Communicating with the Dead: Spiritual and Cultural Healing in Chicano/a Communities,” in Religion and Healing in America, pp.205–216.
No
Wk 4: 9/15-9/17
Exam Week
Theme II: Cultural Anthropology's Contributions to Knowledge of Infectious Diseases
Tuesday Exam #1
Manderson, Lenore. 1998. “Applying Medical Anthropology in the Control of Infectious Disease” Tropical Medicine and International Health vol. 3 no 12 pp. 1020-1027.
Wk 11: 11/3 – 11/5
Exam Week
Theme IV: The Anthropology of Biotechnology
Tues. EXAM #2
Starobinets, Anna. Look at Him. New York: Slavika Publishers, 2020.
Wk 15: 12/1 – LDOC
Review Week
Review for Final Exam
FINAL EXAM Fri. 12/11 @ 4:00
in our classroom`)

    expect(parsed.items.filter((item) => item.kind === 'standards').map((item) => item.label)).toEqual([
      'Demonstrate knowledge of the global diversity of cultural understandings about health, illness, the body, and systems of healing.',
      'Explain some of the ways biomedicine is shaped by Western cultural ideas and the specific contexts in which it is practiced.',
      'Explain why practitioners of health development and clinical medicine often encounter clashes between their cultural knowledge and the cultural knowledge of those they seek to help and describe anthropological approaches to addressing such challenges.',
    ])
    expect(parsed.items.filter((item) => item.kind === 'standards')).toHaveLength(3)
    expect(parsed.items.filter((item) => item.kind === 'weights').map((item) => item.value)).toEqual(['3%', '10%', '9%', '24%', '26%', '28%'])
    expect(weightGap(parsed.items)).toBe(0)
    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'units', label: expect.stringContaining('Symbols, Political Economy'), value: '2026-08-19' }),
      expect.objectContaining({ kind: 'readings', label: expect.stringContaining('Story of Rosario'), value: '2026-08-19' }),
      expect.objectContaining({ kind: 'readings', label: expect.stringContaining('Communicating with the Dead'), value: '2026-08-19' }),
      expect.objectContaining({ kind: 'exams', label: 'Exam 1', value: '2026-09-15' }),
      expect.objectContaining({ kind: 'readings', label: expect.stringContaining('Applying Medical Anthropology'), value: '2026-09-15' }),
      expect.objectContaining({ kind: 'exams', label: 'Exam 2', value: '2026-11-03' }),
      expect.objectContaining({ kind: 'exams', label: 'Final Exam', value: '2026-12-11' }),
    ]))
    expect(parsed.items.filter((item) => item.kind === 'standards').some((item) => /Story of Rosario|Exam Week|Biotechnology/i.test(item.label))).toBe(false)
  })

  it('does not turn a publication date inside a scheduled reading into coursework', () => {
    const parsed = parseSyllabusText(`ANTH 147 — Comparative Healing Systems
Fall 2026
SCHEDULE FOR CLASS, READINGS, RECITATION SECTIONS, AND EXAMS
Wk 14: 11/24
Cultural Approaches
Villarosa, L. 2018. “Why America’s Black Mothers and Babies Are in a Life-or-Death Crisis” The New York Times Magazine, April 11. https://www.nytimes.com/2018/04/11/magazine/example`)
    expect(parsed.items.filter((item) => item.kind === 'deadlines')).toHaveLength(0)
    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'readings', label: expect.stringContaining('Villarosa'), value: '2026-11-24' }),
    ]))
  })

  it('uses the stated term year instead of an earlier publication year', () => {
    const parsed = parseSyllabusText(`ANTH 147 — Comparative Healing Systems
Copyright 2018
Fall 2026
SCHEDULE FOR CLASS, READINGS, RECITATION SECTIONS, AND EXAMS
Wk 4: 9/15-9/17
Exam Week
Tuesday Exam #1`)

    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'exams', label: 'Exam 1', value: '2026-09-15' }),
    ]))
  })

  it('recognizes a standalone goals heading and stops before course structure', () => {
    const parsed = parseSyllabusText(`BIOL 103 — How Cells Function
Fall 2026
Course Description & Learning
Goals
By the end of this course, you should be able to:
• What limits should scientists keep in mind?
• Relate essential functions of cells to their cellular components.
• Connect molecular mechanisms to cellular functions.
Course Structure
• Submit a worksheet before every class.`)

    expect(parsed.items.filter((item) => item.kind === 'standards').map((item) => item.label)).toEqual([
      'Relate essential functions of cells to their cellular components.',
      'Connect molecular mechanisms to cellular functions.',
    ])
  })

  it('turns a week-range schedule into dated scope and assigned readings', () => {
    const parsed = parseSyllabusText(`GEOG 121 — Geographies of Globalization
Fall 2026
Course Schedule
Week 1. What Is This Thing We Call the Globe?
Aug 17-21
Manfred Steger, “What is globalization?” in Globalization: A Very Short Introduction (2023), 1–11.
Doreen Massey, “A Global Sense of Place,” in Space, Place, and Gender (1994), 146–156.
Week 2. Visualizing the Globe: Space, Scale, Scape
Aug 24-28
Arjun Appadurai, “Disjuncture and Difference,” in Modernity At Large (1996), 27–47.`)

    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'units', label: 'What Is This Thing We Call the Globe?', value: '2026-08-17', context: 'Week 1' }),
      expect.objectContaining({ kind: 'readings', label: expect.stringContaining('Steger'), value: '2026-08-17', context: 'Week 1' }),
      expect.objectContaining({ kind: 'readings', label: expect.stringContaining('Massey'), value: '2026-08-17', context: 'Week 1' }),
      expect.objectContaining({ kind: 'units', label: 'Visualizing the Globe: Space, Scale, Scape', value: '2026-08-24', context: 'Week 2' }),
    ]))
  })

  it('uses a 100-point grading table as percentages without normalizing other totals', () => {
    const parsed = parseSyllabusText(`GEOG 121 — Geographies of Globalization
Fall 2026
Grade Breakdown and scale
Assignment Frequency/Timing Total Points
Commonplace Book Entries 10 entries 40 pts (4 ea.)
Group Presentations Twice (Weeks 7 & 14) 20 pts (10 ea.)
Midterm Exam Oct. 5 (In-class) 20 pts
Final Exam Dec. 4 @ 12:00 PM 20 pts`)

    expect(parsed.items.filter((item) => item.kind === 'weights').map((item) => [item.label, item.value])).toEqual([
      ['Commonplace Book Entries', '40%'],
      ['Group Presentations', '20%'],
      ['Midterm Exam', '20%'],
      ['Final Exam', '20%'],
    ])
    expect(weightGap(parsed.items)).toBe(0)
  })

  it('keeps only top-level grade weights, not flexibility drops or nested exam shares', () => {
    const parsed = parseSyllabusText(`BIOL 103 — How Cells Function
Final course grades are made of 2 components:
1. Participation (20% of grade).
Flexibility: 15% of possible points will be dropped.
2. Unit Exams (80% of course grade).
The first exam is worth 30% of your exam category and the second is worth 50%.
You are ultimately 100% responsible for your work.`)

    expect(parsed.items.filter((item) => item.kind === 'weights').map((item) => [item.label, item.value])).toEqual([
      ['Participation', '20%'],
      ['Unit Exams', '80%'],
    ])
  })

  it('reconstructs a flattened two-column 100-point grading table', () => {
    const parsed = parseSyllabusText(`ENGL 105 — Introduction to Composition and Rhetoric
Evaluation and Grading
Assignment
Total
Unit 1 Project (Social Sciences)
10
Unit 2 Project (Natural Sciences)
15
Unit 3 Project (Humanities)
20
Feeder assignments
30 (5 points each)
Attendance and Participation
25
100 points`)

    expect(parsed.items.filter((item) => item.kind === 'weights').map((item) => [item.label, item.value])).toEqual([
      ['Unit 1 Project (Social Sciences)', '10%'],
      ['Unit 2 Project (Natural Sciences)', '15%'],
      ['Unit 3 Project (Humanities)', '20%'],
      ['Feeder assignments', '30%'],
      ['Attendance and Participation', '25%'],
    ])
  })

  it('captures every actionable numeric date in prose without treating publication years as deadlines', () => {
    const parsed = parseSyllabusText(`PSYC 101 — Introduction to Psychology
Fall 2026
Response papers are due 9/3 and 10/8.
Research participation must be completed by 12/1.
Read Smith. 2018. “A history of psychology.”`)

    expect(parsed.items.filter((item) => item.kind === 'deadlines').map((item) => item.value)).toEqual([
      '2026-09-03',
      '2026-10-08',
      '2026-12-01',
    ])
  })

  it('preserves course context, materials, and communication as source-backed class context', () => {
    const parsed = parseSyllabusText(`ENGL 105 — Introduction to Composition and Rhetoric
Course Description
This course introduces academic writing across the natural sciences, social sciences, and humanities.
Required Materials
Tar Heel Writing Guide, digital edition.
Communication
Check Canvas announcements for schedule changes.`)

    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'logistics', label: 'Course description', context: 'Course context' }),
      expect.objectContaining({ kind: 'logistics', label: 'Required materials', context: 'Course material' }),
      expect.objectContaining({ kind: 'logistics', label: 'Communication', context: 'Course operations' }),
    ]))
  })

  it('captures named instructors and teaching assistants with their contact evidence', () => {
    const parsed = parseSyllabusText(`GEOG 121 — Geographies of Globalization
Teaching Assistants
Victoria Ting · vting@unc.edu
Office Hours: Coates 104 on Mon 10:30–11:30.
Instructor
Dr. Adrian Drummond-Cole · adriandc@unc.edu
Office Hours: Carolina Hall 216 on Tue 11:15–12:15.
Sophia Alhadeff · sophalh@unc.edu
Office Hours: Davis Library via Zoom on Wed 10:30–11:30.`)

    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'logistics', label: 'Victoria Ting', value: expect.stringContaining('vting@unc.edu'), context: 'Teaching assistant' }),
      expect.objectContaining({ kind: 'logistics', label: 'Instructor: Dr. Adrian Drummond-Cole', value: expect.stringContaining('adriandc@unc.edu'), context: 'Professor' }),
      expect.objectContaining({ kind: 'logistics', label: 'Sophia Alhadeff', value: expect.stringContaining('sophalh@unc.edu'), context: 'Teaching assistant' }),
    ]))
  })
})

describe('document classification (§4.1-M-d)', () => {
  const problemSet = [
    'CHEM 262 Problem Set 6',
    'Due Oct 24, 2026',
    '1. Draw the mechanism for the following substitution.',
    '2. Rank the leaving groups below.',
    '3. Predict the major product.',
  ].join('\n')

  const thinSyllabus = [
    'CHEM 262 - Organic Chemistry II',
    'Instructor: Dr. Alvarez, office hours Tue 2:00 PM, room 214',
  ].join('\n')

  it('calls a problem set unrecognized — a lone due date is not structure', () => {
    const parsed = parseSyllabusText(problemSet, 'Problem Set 6.pdf')
    expect(parsed.documentKind).toBe('unrecognized')
    expect(parsed.structureFound).toEqual([])
    expect(parsed.numberedItems).toBe(3)
  })

  it('keeps a one-page syllabus with only logistics as a syllabus', () => {
    const parsed = parseSyllabusText(thinSyllabus, 'Syllabus.pdf')
    expect(parsed.documentKind).toBe('syllabus')
    expect(parsed.structureFound).toContain('logistics')
  })

  it('never calls an unreadable scan unrecognized — that is a different diagnosis', () => {
    const parsed = parseSyllabusText('', 'Scan.pdf', 'image')
    expect(parsed.scanDetected).toBe(true)
    expect(parsed.documentKind).toBe('syllabus')
  })

  it('reports the structural signals it did find', () => {
    const parsed = parseSyllabusText(['CHEM 262 - Organic Chemistry II', 'Problem sets 15%', 'Week 1 Introduction'].join('\n'))
    expect(parsed.documentKind).toBe('syllabus')
    expect(parsed.structureFound).toEqual(expect.arrayContaining(['weights', 'units']))
  })
})
