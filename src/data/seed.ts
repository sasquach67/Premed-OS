/* ============================================================
   seed.ts — Andy's personalized starting data.
   Pulled from the brief: Appendix A (UNC Neuroscience plan),
   §9 personalization, §13 feature picks, §10/§12 mindset + tips.
   The app opens already personal, not blank.
   ============================================================ */
import { uid } from '@/lib/id'
import type {
  AppData, Course, RequirementItem, TaskItem, StoryEntry, ResourceLink,
  TipEntry, AdvisingQuestion, McatScheduleItem, InterviewQA, FocusTarget,
  QuarterlyGoal, SchoolEntry, AcademicTagColor, AcademicTagSettings,
  AcademicFile, ClassAssignment, ClassWorkspace, ClassContact, ClassNote,
  Topic, ClassWeakArea, RequirementSourceType, RequirementVerificationStatus, TimelineMilestone,
} from '@/lib/types'
import { createTopicFsrsState } from '@/lib/academics/fsrs'

/** attach incrementing `order` + a fresh `id` to seed rows */
function seq<T extends object>(rows: T[]): (T & { id: string; order: number })[] {
  return rows.map((r, i) => ({ id: uid(), order: i, ...r }))
}

// ---- Courses: transfer/AP credit (no GPA impact) + locked Year 1 + planned path ----
const courses: Course[] = seq<Omit<Course, 'id' | 'order'>>([
  // Incoming credit — completed, NOT in residence, ungraded (does not affect college GPA)
  cAP('Transfer / AP Credit', 'BIOL 101', 'Principles of Biology', 3, true),
  cAP('Transfer / AP Credit', 'BIOL 101L', 'Intro Biology Lab', 1, true),
  cAP('Transfer / AP Credit', 'CHEM 101', 'General Chemistry I', 3, true),
  cAP('Transfer / AP Credit', 'CHEM 101L', 'Gen Chem I Lab', 1, true),
  cAP('Transfer / AP Credit', 'CHEM 102', 'General Chemistry II', 3, true),
  cAP('Transfer / AP Credit', 'CHEM 102L', 'Gen Chem II Lab', 1, true),
  cAP('Transfer / AP Credit', 'MATH 231', 'Calculus I', 4, true),
  cAP('Transfer / AP Credit', 'MATH 232', 'Calculus II', 4, true),
  cAP('Transfer / AP Credit', 'STOR 155', 'Intro to Data Models & Inference', 3, true),
  cAP('Transfer / AP Credit', 'NSCI 175', 'Intro to Neuroscience (core)', 3, true),
  cAP('Transfer / AP Credit', 'PHYS 114', 'General Physics I', 4, true),
  cAP('Transfer / AP Credit', 'PHYS 115', 'General Physics II', 4, true),
  cAP('Transfer / AP Credit', 'SPAN 203', 'Intermediate Spanish (Global Language)', 3, false),

  // Fall 2026 — LOCKED
  c('Fall 2026', 'PSYC 101', 'General Psychology', 3, false, 'planned', ['Major req', 'Med prereq (Psych)', 'MCAT P/S'], 'Psychology'),
  c('Fall 2026', 'NURS 50', 'First-Year Seminar (Wellness)', 3, false, 'planned', ['First-Year Foundation']),
  c('Fall 2026', 'BIOL 103', 'How Cells Function', 3, true, 'planned', ['Major: Additional Req']),
  c('Fall 2026', 'ENGL 105', 'English Composition & Rhetoric', 3, false, 'planned', ['First-Year Foundation (Writing)']),
  c('Fall 2026', 'IDST 101', 'College Thriving', 1, false, 'planned', ['First-Year Foundation']),
  c('Fall 2026', 'IDST 111L', 'Data Literacy Lab', 1, false, 'planned', ['First-Year Foundation']),

  // Spring 2027 — chem chain begins
  c('Spring 2027', 'CHEM 241', 'Modern Analytical Methods', 3, true, 'planned', ['Major: Additional Req', 'Opens chem chain']),
  c('Spring 2027', 'CHEM 241L', 'Analytical Methods Lab', 1, true, 'planned', ['Major: Additional Req', 'Prereq for 262L', 'Med "orgo lab"']),
  c('Spring 2027', 'BIOL 220', 'Molecular Genetics', 3, true, 'planned', ['Major: Additional Req', 'Med prereq']),
  c('Spring 2027', 'SOCI 101', 'Sociology', 3, false, 'planned', ['Med prereq (Soc)', 'MCAT P/S']),
  c('Spring 2027', 'Focus-Capacity Gen Ed', 'IDEAs-in-Action elective', 3, false, 'planned', ['IDEAs-in-Action']),

  // Recommended path (illustrative — junior/senior stays flexible)
  c('Fall 2027', 'CHEM 261', 'Organic Chemistry I (no lab)', 3, true, 'planned', ['Major: Additional Req', 'MCAT orgo']),
  c('Fall 2027', 'NSCI 221', 'Core NSCI 22x (#1)', 3, true, 'planned', ['Major: Core (select two)']),
  c('Fall 2027', 'COMP 116', 'Intro Programming', 3, false, 'planned', ['Major: Additional Req']),
  c('Spring 2028', 'CHEM 262', 'Organic Chemistry II', 3, true, 'planned', ['Major: Additional Req', 'MCAT orgo']),
  c('Spring 2028', 'CHEM 262L', 'Organic Chemistry Lab', 1, true, 'planned', ['Major: Additional Req', 'Closes lab chain']),
  c('Spring 2028', 'NSCI 27x', 'Research Methods Lab', 3, true, 'planned', ['Major: Core (research methods)']),
  c('Spring 2028', 'PSYC 210', 'Statistical Principles (med-safe stats)', 3, false, 'planned', ['MMS elective', 'Med-safe stats']),
  c('Summer 2028', 'CHEM 430', 'Biochemistry (last content domino)', 3, true, 'planned', ['Med prereq', 'Knowledge Elective', 'Gates MCAT']),
  c('Fall 2028', 'NSCI 222', 'Core NSCI 22x (#2)', 3, true, 'planned', ['Major: Core (select two)']),
  c('Fall 2028', 'BIOL 240', 'Cell Biology (HPA recommended)', 3, true, 'planned', ['Knowledge Elective']),
  c('Spring 2029', 'BIOL 252', 'Anatomy & Physiology (med rec)', 3, true, 'planned', ['Med recommended']),
  c('Spring 2029', 'BIOL 252L', 'A&P Lab', 1, true, 'planned', ['Med recommended']),
  c('Spring 2029', 'PSYC 245', 'Psychopathology', 3, false, 'planned', ['Knowledge Elective', 'MCAT P/S']),
  c('Fall 2029', 'EXSS 175', 'Human Anatomy', 3, true, 'planned', ['Knowledge Elective']),
])

function c(
  term: string, code: string, title: string, credits: number, bcpm: boolean,
  status: Course['status'], satisfies: string[], prereqOf?: string
): Omit<Course, 'id' | 'order'> {
  return { term, code, title, credits, grade: '', bcpm, status, inResidence: true, satisfies, prereqOf }
}
function cAP(term: string, code: string, title: string, credits: number, bcpm: boolean): Omit<Course, 'id' | 'order'> {
  return { term, code, title, credits, grade: '', bcpm, status: 'completed', inResidence: false, satisfies: ['Satisfied by incoming credit'] }
}

const TAG_COLORS: AcademicTagColor[] = ['blue', 'green', 'purple', 'orange', 'pink', 'yellow', 'red', 'gray']

function slug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tag'
}

function typeId(name: string) {
  return `type-${slug(name)}`
}

const academics: AcademicTagSettings = {
  courseOptions: courses.map((course, index) => ({
    id: `course-${slug(course.code || course.title || course.id)}`,
    name: course.code || course.title || 'Course',
    title: course.title,
    color: TAG_COLORS[index % TAG_COLORS.length],
    archived: false,
  })),
  assignmentTypeOptions: [
    'Important Date', 'Presentation', 'Quiz', 'Test', 'Exam', 'Assignment',
    'Group Work', 'Lab', 'Application', 'Meeting', 'Advising', 'Personal',
  ].map((name, index) => ({
    id: typeId(name),
    name,
    color: TAG_COLORS[(index + 2) % TAG_COLORS.length],
    archived: false,
  })),
  classCenter: createClassCenterSeed(),
  migrationJournal: [],
}

function createClassCenterSeed(): AcademicTagSettings['classCenter'] {
  const now = Date.parse('2026-06-27T12:00:00.000Z')
  const byCourse = (code: string, term: string) => {
    const course = courses.find((item) => item.code === code && item.term === term)
    if (!course) throw new Error(`Missing seed course ${code} (${term})`)
    return course.id
  }
  const workspaceDetails: Record<string, Partial<ClassWorkspace>> = {
    'BIOL 103': {
      nickname: 'Cells',
      instructor: 'Prof. Ott',
      meetingDays: 'MWF',
      meetingTime: '10:10 AM-11:00 AM',
      location: 'Genome Sciences 100',
      color: 'green',
      icon: 'dna',
      background: 'cell-biology',
      currentTopicId: 'topic-biol-103-cell-signaling',
      ankiDeckName: 'BIOL 103',
    },
    'PSYC 101': {
      nickname: 'Psych',
      meetingDays: 'Tue/Thu',
      meetingTime: '11:00 AM-12:15 PM',
      color: 'purple',
      icon: 'brain',
      background: 'psychology',
      currentTopicId: 'topic-psyc-101-learning',
      ankiDeckName: 'PSYC 101',
    },
  }
  const workspaces: ClassWorkspace[] = courses
    .filter((course) => course.term === 'Fall 2026')
    .map((course, order) => ({
      id: `workspace-${course.id}`,
      courseId: course.id,
      type: course.code === 'ENGL 105' ? 'writing' : course.bcpm ? 'stem' : 'general',
      color: 'blue',
      icon: 'book',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      order,
      ...workspaceDetails[course.code],
    }))
  /*
   * Legacy workspace examples were intentionally converted here rather than
   * retained as duplicate Course records. The v4 migration tests exercise the
   * old shape directly.
   */
  const topics: Topic[] = [
    topic('topic-biol-103-intro', byCourse('BIOL 103', 'Fall 2026'), 'Intro to course', 'Unit 1', 'ready', 3, 0),
    topic('topic-biol-103-cell-structure', byCourse('BIOL 103', 'Fall 2026'), 'Cell structure', 'Unit 1', 'notes-made', 3, 1),
    topic('topic-biol-103-membrane', byCourse('BIOL 103', 'Fall 2026'), 'Membrane transport', 'Unit 1', 'reviewing', 3, 2),
    topic('topic-biol-103-cell-signaling', byCourse('BIOL 103', 'Fall 2026'), 'Cell signaling', 'Unit 2', 'weak', 2, 3),
    topic('topic-psyc-101-learning', byCourse('PSYC 101', 'Fall 2026'), 'Learning and conditioning', 'Foundations', 'reviewing', 3, 0),
    topic('topic-psyc-101-memory', byCourse('PSYC 101', 'Fall 2026'), 'Memory systems', 'Foundations', 'not-started', 2, 1),
    topic('topic-chem-241-equilibrium', byCourse('CHEM 241', 'Spring 2027'), 'Chemical equilibrium', 'Methods', 'seen', 3, 0),
    topic('topic-chem-241-spectroscopy', byCourse('CHEM 241', 'Spring 2027'), 'Spectroscopy basics', 'Methods', 'not-started', 2, 1),
  ]
  const notes: ClassNote[] = [
    {
      id: 'note-biol-103-lecture-1',
      courseId: byCourse('BIOL 103', 'Fall 2026'),
      title: 'Lecture 1 — What cells do',
      type: 'lecture',
      kind: 'about-class',
      date: '2026-08-24',
      unit: 'Unit 1',
      topicIds: ['topic-biol-103-intro', 'topic-biol-103-cell-structure'],
      content: 'Starter note: define the recurring cell biology themes and mark what needs a second pass.',
      externalDocUrl: '',
      syncStatus: 'sync-ready',
      linkedFileIds: [],
      createdAt: now,
      updatedAt: now,
      order: 0,
    },
  ]
  const assignments: ClassAssignment[] = [
    {
      id: 'assignment-biol-103-exam-1',
      courseId: byCourse('BIOL 103', 'Fall 2026'),
      title: 'Exam 1',
      type: 'exam',
      dueDate: '2026-09-18',
      status: 'not-started',
      linkedTopicIds: ['topic-biol-103-cell-structure', 'topic-biol-103-membrane', 'topic-biol-103-cell-signaling'],
      linkedFileIds: [],
      notes: 'Build a topic checklist once the syllabus drops.',
      coveredTopicIds: ['topic-biol-103-cell-structure', 'topic-biol-103-membrane', 'topic-biol-103-cell-signaling'],
      studyPlan: 'Make lecture notes, then convert weak concepts into active recall prompts.',
      reflection: '',
      createdAt: now,
      updatedAt: now,
      order: 0,
    },
    {
      id: 'assignment-psyc-101-reading-1',
      courseId: byCourse('PSYC 101', 'Fall 2026'),
      title: 'Learning chapter reading',
      type: 'reading',
      dueDate: '2026-09-04',
      status: 'not-started',
      linkedTopicIds: ['topic-psyc-101-learning'],
      linkedFileIds: [],
      notes: '',
      createdAt: now,
      updatedAt: now,
      order: 1,
    },
  ]
  const files: AcademicFile[] = [
    {
      id: 'file-biol-103-syllabus',
      courseId: byCourse('BIOL 103', 'Fall 2026'),
      sourceType: 'link',
      owner: 'course',
      title: 'Syllabus',
      type: 'syllabus',
      url: '',
      fileName: '',
      mimeType: '',
      notes: 'Add the official syllabus link once available.',
      linkedTopicIds: [],
      createdAt: now,
      updatedAt: now,
      order: 0,
    },
  ]
  const contacts: ClassContact[] = [
    {
      id: 'contact-biol-103-prof',
      courseId: byCourse('BIOL 103', 'Fall 2026'),
      name: 'Prof. Ott',
      role: 'professor',
      email: '',
      officeHours: 'Add after syllabus',
      location: '',
      nickname: '',
      notes: 'Potential science faculty relationship if office hours become consistent.',
      createdAt: now,
      updatedAt: now,
      order: 0,
    },
  ]
  const weakAreas: ClassWeakArea[] = [
    {
      id: 'weak-biol-103-cell-signaling',
      courseId: byCourse('BIOL 103', 'Fall 2026'),
      topicId: 'topic-biol-103-cell-signaling',
      label: 'Cell signaling',
      source: 'manual',
      reason: 'conceptual',
      severity: 3,
      notes: 'Needs a clean pathway map plus practice questions.',
      createdAt: now,
      status: 'active',
      order: 0,
    },
  ]
  return {
    workspaces,
    topics,
    notes,
    assignments,
    files,
    keyPoints: [],
    sourceChunks: [],
    reviewEvents: [],
    contacts,
    weakAreas,
    practiceExams: [],
    practiceQuestions: [],
    paperDrafts: [],
    assignedReadings: [],
    feedbackNotes: [],
    gradeCategories: [],
  }
}

function topic(
  id: string,
  courseId: string,
  title: string,
  unit: string,
  status: Topic['status'],
  confidence: Topic['confidence'],
  order: number,
): Topic {
  const now = Date.now()
  return {
    id,
    courseId,
    title,
    unit,
    status,
    fsrs: createTopicFsrsState(now),
    confidence,
    sourceNoteIds: [],
    linkedNoteIds: [],
    linkedAssignmentIds: [],
    linkedFileIds: [],
    createdAt: now,
    updatedAt: now,
    order,
  }
}

// ---- Tar Heel Tracker (from the official 2026–27 UNC catalog) ----
// Groups mirror the four degree layers: incoming credit · IDEAs in Action gen-ed
// · Neuroscience B.S. major · pre-med additions · university graduation rules.
const G_AP = 'Incoming AP / transfer credit'
const G_FYF = 'IDEAs in Action — First-Year Foundations'
const G_FOCUS = 'IDEAs in Action — Focus Capacities'
const G_REFLECT = 'IDEAs in Action — Reflection & Integration'
const G_ADDL = 'IDEAs in Action — Additional (Fall 2025+)'
const G_CORE = 'Neuroscience B.S. — Core'
const G_MAJOR = 'Neuroscience B.S. — Additional Requirements (C or better)'
const G_MED = 'Pre-Med additions (UNC HPA)'
const G_GRAD = 'University graduation rules'
const UNC_CATALOG_SOURCE = 'https://catalog.unc.edu/undergraduate/programs-study/neuroscience-major-bs/'
const IDEAS_SOURCE = 'https://catalog.unc.edu/undergraduate/ideas-in-action/'
const UNC_GRAD_SOURCE = 'https://catalog.unc.edu/policies-procedures/degree-requirements/'
const UNC_HPA_SOURCE = 'https://hpa.unc.edu/'
const VERIFIED_DATE = '2026-06-27'

const requirements: RequirementItem[] = seq<Omit<RequirementItem, 'id' | 'order'>>([
  // Incoming AP / transfer credit (what UNC awarded → see where it applies below)
  r(G_AP, 'AP Chemistry 5 → CHEM 101/101L + 102/102L', true, ['CHEM 101', 'CHEM 102']),
  r(G_AP, 'AP Biology 3 → BIOL 101 + 101L', true, ['BIOL 101']),
  r(G_AP, 'AP Calculus BC → MATH 231 + MATH 232', true, ['MATH 231', 'MATH 232']),
  r(G_AP, 'AP Physics C (Mech + E&M) → PHYS 114 + PHYS 115', true, ['PHYS 114', 'PHYS 115']),
  r(G_AP, 'AP Statistics 4 → STOR 155', true, ['STOR 155']),
  r(G_AP, 'Transfer: SPAN 203 (Global Language) + NSCI 175 (core)', true, ['SPAN 203', 'NSCI 175']),

  // First-Year Foundations (complete in year 1; mostly at UNC)
  r(G_FYF, 'IDST 101 College Thriving (1 cr)', false, ['IDST 101']),
  r(G_FYF, 'IDST 111L Data Literacy Lab (1 cr)', false, ['IDST 111L']),
  r(G_FYF, 'One First-Year Seminar / FY-Launch (3–4 cr)', false, ['NURS 50']),
  r(G_FYF, 'ENGL 105 Composition & Rhetoric (3 cr)', false, ['ENGL 105'], 'Cannot be met by exam credit — must take at UNC.'),
  r(G_FYF, 'Global Language through level 3', true, ['SPAN 203'], 'Met via SPAN 203.'),

  // Focus Capacities — one course in each of 9 areas + an Empirical Investigation Lab
  r(G_FOCUS, 'Aesthetic & Interpretive Analysis', false),
  r(G_FOCUS, 'Creative Expression, Practice & Production', false),
  r(G_FOCUS, 'Engagement with the Human Past', false),
  r(G_FOCUS, 'Ethical & Civic Values', false),
  r(G_FOCUS, 'Global Understanding & Engagement', false),
  r(G_FOCUS, 'Natural Scientific Investigation', false),
  r(G_FOCUS, 'Power & Society', false),
  r(G_FOCUS, 'Quantitative Reasoning', false),
  r(G_FOCUS, 'Ways of Knowing', false),
  r(G_FOCUS, 'Empirical Investigation Lab (1 cr)', false, undefined, 'Up to 5 capacities + the lab may be met by approved by-exam credit.'),

  // Reflection & Integration
  r(G_REFLECT, 'Research & Discovery', false),
  r(G_REFLECT, 'High-Impact Experience (or a 2nd Research & Discovery)', false),
  r(G_REFLECT, 'Communication Beyond Carolina', false),
  r(G_REFLECT, 'Interdisciplinary', false),
  r(G_REFLECT, 'Lifetime Fitness (LFIT)', false),
  r(G_REFLECT, 'Campus Life Experience (8 approved events)', false),

  // Additional gen-ed (Fall 2025+ cohorts)
  r(G_ADDL, 'Foundations of American Democracy', false),
  r(G_ADDL, 'Disciplinary Distribution: Fine Arts & Humanities', false),
  r(G_ADDL, 'Disciplinary Distribution: Natural Sciences & Math', false),
  r(G_ADDL, 'Disciplinary Distribution: Social Sciences & Global', false),

  // Neuroscience B.S. — Core (major total 78–79 hrs)
  r(G_CORE, 'NSCI 175 Introduction to Neuroscience (C or better)', true, ['NSCI 175'], 'Met via transfer credit.'),
  r(G_CORE, 'Statistics: PSYC 210 / STOR 120 / STOR 155', true, ['STOR 155'], 'STOR 155 (AP) satisfies the major; plan PSYC 210 in residence for med schools.'),
  r(G_CORE, 'Research-methods lab: NSCI 27* (prioritized over PSYC 270)', false, ['NSCI 27x']),
  r(G_CORE, 'Select two: NSCI 221 / 222 / 225', false, ['NSCI 221', 'NSCI 222']),
  r(G_CORE, 'Knowledge Electives — 6 cr', false, ['CHEM 430', 'BIOL 240'], 'Premed-friendly options: CHEM 430 (biochem, double-duty), BIOL 240, BIOL 433, PSYC 245, EXSS 175.'),
  r(G_CORE, 'Math/Methods/Stats (MMS) Electives — 6 cr', false, ['PSYC 210'], 'Options: PSYC 210, MATH 233/347, STOR 215/320, COMP 283 …'),

  // Neuroscience B.S. — Additional Requirements (every one needs a C or better)
  r(G_MAJOR, 'BIOL 101 + 101L', true, ['BIOL 101'], 'AP ✓'),
  r(G_MAJOR, 'BIOL 103 How Cells Function', false, ['BIOL 103']),
  r(G_MAJOR, 'BIOL 220 Molecular Genetics', false, ['BIOL 220']),
  r(G_MAJOR, 'CHEM 101 + 101L', true, ['CHEM 101'], 'AP ✓'),
  r(G_MAJOR, 'CHEM 102 + 102L', true, ['CHEM 102'], 'AP ✓'),
  r(G_MAJOR, 'CHEM 241 + 241L', false, ['CHEM 241', 'CHEM 241L']),
  r(G_MAJOR, 'CHEM 261 (no lab)', false, ['CHEM 261']),
  r(G_MAJOR, 'CHEM 262 + 262L', false, ['CHEM 262', 'CHEM 262L']),
  r(G_MAJOR, 'COMP 110 or 116', false, ['COMP 116']),
  r(G_MAJOR, 'MATH 231 + 232', true, ['MATH 231', 'MATH 232'], 'AP ✓'),
  r(G_MAJOR, 'PHYS 114 or 118', true, ['PHYS 114'], 'AP ✓'),
  r(G_MAJOR, 'PHYS 115 or 119', true, ['PHYS 115'], 'AP ✓'),
  r(G_MAJOR, 'PSYC 101 General Psychology', false, ['PSYC 101']),

  // Pre-med additions (UNC HPA "common prerequisites")
  r(G_MED, 'CHEM 430 Biochemistry', false, ['CHEM 430'], 'Last MCAT content domino; also counts as a Knowledge Elective (double-duty).'),
  r(G_MED, '1 sem Sociology — SOCI 101', false, ['SOCI 101']),
  r(G_MED, '1 sem Psychology — PSYC 101', false, ['PSYC 101']),
  r(G_MED, 'BIOL 252 + 252L (HPA recommended)', false, ['BIOL 252']),
  r(G_MED, 'Take key prereqs in residence', false, undefined, 'Most med schools want C+ in prereqs and may not accept AP — esp. retake stats as PSYC 210.'),

  // University graduation rules
  r(G_GRAD, '120 total credit hours', false),
  r(G_GRAD, '2.000 minimum cumulative UNC GPA', false),
  r(G_GRAD, '≥ 45 credit hours earned at UNC (residency)', false),
  r(G_GRAD, '≥ half of major core (courses + hours) at UNC · 2.0 in major core', false),
  r(G_GRAD, 'Neuroscience B.S. major: 78–79 hrs total', false),
])
function requirementSource(group: string, label: string): Pick<RequirementItem, 'sourceType' | 'sourceLabel' | 'sourceUrl' | 'lastVerified' | 'verificationStatus'> {
  if (group === G_MED) {
    return {
      sourceType: 'premed-advice',
      sourceLabel: 'UNC HPA / premed planning note',
      sourceUrl: UNC_HPA_SOURCE,
      lastVerified: VERIFIED_DATE,
      verificationStatus: 'needs-verification',
    }
  }
  if (group === G_AP) {
    return {
      sourceType: 'user-note',
      sourceLabel: 'Andy AP/transfer credit note',
      sourceUrl: UNC_CATALOG_SOURCE,
      lastVerified: VERIFIED_DATE,
      verificationStatus: 'needs-verification',
    }
  }
  const isIdeas = [G_FYF, G_FOCUS, G_REFLECT, G_ADDL].includes(group)
  const isMajor = [G_CORE, G_MAJOR].includes(group)
  const uncertain = /Knowledge Electives|Math\/Methods\/Stats|Options:|prioritized|Select two/i.test(label)
  return {
    sourceType: 'official' as RequirementSourceType,
    sourceLabel: isIdeas ? 'UNC Catalog — IDEAs in Action' : isMajor ? 'UNC Catalog — Neuroscience B.S.' : 'UNC Catalog',
    sourceUrl: isIdeas ? IDEAS_SOURCE : isMajor ? UNC_CATALOG_SOURCE : UNC_GRAD_SOURCE,
    lastVerified: VERIFIED_DATE,
    verificationStatus: (uncertain ? 'needs-verification' : 'verified') as RequirementVerificationStatus,
  }
}

function r(group: string, label: string, done: boolean, satisfiedBy?: string[], note?: string): Omit<RequirementItem, 'id' | 'order'> {
  return { group, label, done, satisfiedBy, note, ...requirementSource(group, label) }
}

// ---- Overview tasks + Timeline-owned application-cycle milestones ----
const tasks: TaskItem[] = seq<Omit<TaskItem, 'id' | 'order'>>([
  t('Enroll for Fall 2026 — window opens 10:00 AM', 'Application', '2026-07-06', 'Use Swap (not Drop-then-Add). Enroll order: PSYC 101 → NURS 50 seminar → BIOL 103 → ENGL 105 → IDST 101 → IDST 111L.'),
  t('Build ConnectCarolina shopping cart (30–40 sections)', 'Personal', '2026-07-05', 'Load multiple sections of each course + all preference-compliant backups.'),
  t('Verify advising questions at orientation / HPA', 'Advising', '2026-08-15', 'See the Verify-with-advisor checklist in Timeline.'),
  t('Find a research lab to reach out to', 'Personal', undefined, 'Start relationships early — research + a future letter writer.'),
  t('Set up first physician shadowing', 'Personal'),
  t('Start clinical volunteering', 'Personal'),
])
function t(title: string, type: TaskItem['type'], deadline?: string, notes?: string): Omit<TaskItem, 'id' | 'order'> {
  return {
    title,
    type,
    typeId: typeId(type),
    deadline,
    progress: 'Not started',
    kanban: 'todo',
    notes,
    archived: false,
    horizon: deadline ? 'now' : 'soon',
    important: false,
  }
}
const timelineMilestones: TimelineMilestone[] = seq<Omit<TimelineMilestone, 'id' | 'order'>>([
  tm('MCAT — sit the exam', '2029-03-15', 'Option 2 (GPA-safe): study winter 2028→spring 2029, sit Jan–Apr 2029.'),
  tm('AMCAS opens (2029 cycle)', '2029-05-01', 'Primary application opens.'),
  tm('Submit AMCAS primary — early!', '2029-05-30', 'Rolling admissions: earlier complete = stronger.'),
  tm('Secondaries arrive in waves', '2029-07-01', 'Pre-write common prompts in June; turn around fast.'),
  tm('Interview season begins', '2029-09-01', 'Rolling through winter.'),
  tm('Matriculate — Fall 2030 (no gap year)', '2030-08-20', 'The finish line for this plan.'),
])
function tm(title: string, targetDate: string, detail?: string): Omit<TimelineMilestone, 'id' | 'order'> {
  return {
    title,
    targetDate,
    detail,
    completed: false,
  }
}

// ---- Story Bank reflection prompts (§13.4) ----
const STORY_PROMPTS = [
  'Reasons you want to be a physician',
  "Something you're very passionate about",
  'A difficult experience that inspired self-growth',
  'A notable leadership experience',
  'A notable research experience',
  'Any notable clinical experiences',
  'A time you asked for help',
  'A time you were humbled',
  'A time you witnessed discrimination',
  'A time you interacted with someone different than you',
  'A time you advocated for someone different than you',
  'A time you failed',
]
const stories: StoryEntry[] = seq<Omit<StoryEntry, 'id' | 'order'>>(
  STORY_PROMPTS.map((prompt) => ({ prompt, title: '', commentary: '', tags: [] }))
)

const interviewQs: InterviewQA[] = seq<Omit<InterviewQA, 'id' | 'order'>>([
  { question: 'Why do you want to be a physician?', answer: '', category: 'Why medicine' },
  { question: 'Tell me about yourself.', answer: '', category: 'Behavioral' },
  { question: 'Describe a time you faced a significant challenge.', answer: '', category: 'Behavioral' },
  { question: 'Tell me about a time you worked on a team.', answer: '', category: 'Behavioral' },
  { question: 'Why this school specifically?', answer: '', category: 'School-specific' },
  { question: 'Describe an ethical dilemma you navigated.', answer: '', category: 'Ethical' },
])

// ---- MCAT schedule (phase-based, §13.3) ----
const mcatSchedule: McatScheduleItem[] = seq<Omit<McatScheduleItem, 'id' | 'order'>>([
  { phase: 'Content Review', focus: 'Bio/Biochem — Khan Academy + AnKing deck', done: false },
  { phase: 'Content Review', focus: 'Gen Chem + Orgo — content + Miledown', done: false },
  { phase: 'Content Review', focus: 'Physics — equation sheet drilling', done: false },
  { phase: 'Content Review', focus: 'Psych/Soc — 300-page doc + "lazy OCD" sheet', done: false },
  { phase: 'Practice', focus: 'Daily CARS passages (Jack Westin)', done: false },
  { phase: 'Practice', focus: 'UWorld question bank — log every miss', done: false },
  { phase: 'Full Lengths', focus: 'AAMC FL1–FL4 (one per week, review 2 days)', done: false },
  { phase: 'Full Lengths', focus: 'Final review of error log + weak topics', done: false },
])

// ---- Advising questions (Appendix A §9) ----
const ADVISING = [
  'Did NSCI 175 post as core, and did SPAN 203 clear Global Language? (placement said SPAN 105)',
  'Did CHEM 101/101L/102/102L, BIOL 101/101L, MATH 231/232, STOR 155, PHYS 115 all post — any conditions?',
  'Confirm BOTH PHYS 114 and PHYS 115 posted (physics treated as fully complete).',
  'Will an advisor approve a 200-level chem earlier — or is Spring 2027 truly the earliest for CHEM 241?',
  'Exact offered terms for CHEM 241/241L/261/262/262L — and does CHEM 430 run in Summer?',
  'Prereqs that apply to me for BIOL 220 and NSCI 221/222/225 (need PSYC 101 / BIOL 103 first?).',
  'Will AP-based STOR 155 satisfy med-school stats, or take PSYC 210 in residence? (check MSAR)',
  'Confirm BIOL 252/252L and BIOL 240 recommendations — do target schools want 2 sem bio WITH lab?',
  'Which transfers (ENEC 202, HIST 103, ARTS/AMST/AAAD, ECON) clear IDEAs Focus Capacities?',
  'Can a FY-Launch section of BIOL 103 or PSYC 101 also clear my FYS/FYL foundation this fall?',
]
const advisingQs: AdvisingQuestion[] = seq<Omit<AdvisingQuestion, 'id' | 'order'>>(
  ADVISING.map((question) => ({ question, answered: false }))
)

const focusTargets: FocusTarget[] = seq<Omit<FocusTarget, 'id' | 'order'>>([
  { text: 'Draft one Story Bank reflection while it’s fresh', minutes: 20, done: false },
  { text: 'Log this week’s clinical/volunteer hours', minutes: 10, done: false },
  { text: 'Email one professor or lab about research', minutes: 15, done: false },
])

const quarterlyGoals: QuarterlyGoal[] = seq<Omit<QuarterlyGoal, 'id' | 'order'>>([
  { quarter: 'Fall 2026', text: 'Lock a 3.8+ first semester; build study systems before anything else', done: false, kind: 'measured', standingTarget: 'gpaTarget' },
  { quarter: 'Fall 2026', text: 'Start ONE longitudinal commitment (clinical, volunteering, or research)', done: false, kind: 'measured', standingTarget: 'clinical' },
])

const schools: SchoolEntry[] = seq<Omit<SchoolEntry, 'id' | 'order'>>([
  {
    name: 'UNC School of Medicine', location: 'Chapel Hill, NC', state: 'NC', type: 'MD',
    category: 'target', status: 'researching',
    msarUrl: 'https://mec.aamc.org/msar-ui/', mission: 'In-state; mission-driven, primary-care strong.',
    notes: 'In-state anchor school. Check MSAR each cycle for stats + course policies.',
  },
])

// ---- Resources, organized by pillar + category, all clickable ----
const resources: ResourceLink[] = seq<Omit<ResourceLink, 'id' | 'order'>>([
  // MCAT — Content Review
  res('mcat', 'Content Review', 'Khan Academy MCAT Prep', 'https://www.khanacademy.org/test-prep/mcat'),
  res('mcat', 'Content Review', 'MCAT Self Prep (free e-course)', 'https://mcatselfprep.com/'),
  res('mcat', 'Content Review', 'Jack Westin — AAMC content outline', 'https://jackwestin.com/'),
  res('mcat', 'Content Review', 'Ninja Nerd (video lectures)', 'https://www.youtube.com/@NinjaNerdOfficial'),
  // MCAT — Anki
  res('mcat', 'Anki Decks', 'MileDown decks', 'https://www.reddit.com/r/Mcat/wiki/index/'),
  res('mcat', 'Anki Decks', 'AnKing / Pankow overview', 'https://www.reddit.com/r/Mcat/wiki/index/'),
  res('mcat', 'Anki Decks', 'Anki (download)', 'https://apps.ankiweb.net/'),
  // MCAT — Practice & Exams
  res('mcat', 'Practice & Exams', 'AAMC Official Prep (the source)', 'https://students-residents.aamc.org/prepare-mcat-exam/prepare-mcat-exam', true),
  res('mcat', 'Practice & Exams', 'UWorld MCAT QBank', 'https://www.uworld.com/'),
  res('mcat', 'Practice & Exams', 'Jack Westin — free CARS daily', 'https://jackwestin.com/resources/cars'),
  res('mcat', 'Practice & Exams', 'Blueprint free half-length', 'https://blueprintprep.com/mcat'),
  // MCAT — Community
  res('mcat', 'Community', 'r/MCAT', 'https://www.reddit.com/r/Mcat/'),
  res('mcat', 'Community', 'AAMC — about the MCAT', 'https://students-residents.aamc.org/taking-mcat-exam/taking-mcat-exam', true),

  // Academics — UNC official
  res('academics', 'Official UNC', 'Neuroscience B.S. catalog', 'https://catalog.unc.edu/undergraduate/programs-study/neuroscience-major-bs/', true),
  res('academics', 'Official UNC', 'HPA — Medicine prereqs', 'https://hpa.unc.edu/explore/explore-health-careers/medicine/', true),
  res('academics', 'Official UNC', 'IDEAs in Action — First-Year Foundations', 'https://ideasinaction.unc.edu/first-year-foundations/', true),
  res('academics', 'Official UNC', 'CHEM course descriptions / prereqs', 'https://catalog.unc.edu/courses/chem/', true),
  res('academics', 'Official UNC', 'Registrar — registration FAQ (swap/waitlist)', 'https://registrar.unc.edu/registration-faq/', true),
  res('academics', 'Official UNC', 'Live class search (sections/times)', 'https://reports.unc.edu/class-search/', true),

  // Clinical / Volunteering / Shadowing / Research / Letters / School list — community hubs
  res('clinical', 'Community', 'r/premed wiki — Clinical Experience', 'https://www.reddit.com/r/premed/wiki/clinicaljobs'),
  res('volunteering', 'Community', 'r/premed wiki — Non-Clinical Volunteering', 'https://www.reddit.com/r/premed/wiki/volunteering'),
  res('shadowing', 'Community', 'r/premed wiki — Shadowing', 'https://www.reddit.com/r/premed/wiki/shadowing'),
  res('research', 'Community', 'r/premed wiki — Research', 'https://www.reddit.com/r/premed/wiki/research'),
  res('letters', 'Community', 'r/premed wiki — Letters of Rec', 'https://www.reddit.com/r/premed/wiki/lors'),
  res('schools', 'Tools', 'AAMC MSAR (build your school list)', 'https://mec.aamc.org/msar-ui/', true),
  res('schools', 'Community', 'r/premed wiki — School List', 'https://www.reddit.com/r/premed/wiki/schoollist'),
  res('essays', 'Community', 'r/premed wiki — Essays', 'https://www.reddit.com/r/premed/wiki/essays'),
  res('timeline', 'Community', 'r/premed wiki — Applying (AMCAS)', 'https://www.reddit.com/r/premed/wiki/applications'),
])
function res(pillar: string, category: string, label: string, url: string, official = false): Omit<ResourceLink, 'id' | 'order'> {
  return { pillar, category, label, url, official }
}

// ---- Mascot tip pool (the ram serves one a day) ----
const tips: TipEntry[] = [
  tip('Apply early, apply complete — rolling admissions reward the front-runners.', 'r/premed', 'community'),
  tip('Reflection matters as much as the activity. Log WHY it mattered while it’s fresh.', 'r/premed', 'community', 'essays'),
  tip('Your BCPM (science) GPA is the single most-scrutinized number. Protect it.', 'AAMC', 'official', 'academics'),
  tip('Longitudinal commitment beats last-minute box-checking. Depth > a scatter of one-offs.', 'r/premed', 'community'),
  tip('No 200-level bio/chem your first semester without advisor approval — start chem in Spring.', 'your UNC plan', 'andy', 'academics'),
  tip('Use Swap, not Drop-then-Add, for a class you can’t afford to lose.', 'your UNC plan', 'andy', 'academics'),
  tip('AP credit usually won’t satisfy med-school prereqs — use it to free space, not to skip a requirement.', 'your UNC plan', 'andy', 'academics'),
  tip('Don’t schedule the MCAT before CHEM 430 — biochem is the last content domino.', 'your UNC plan', 'andy', 'mcat'),
  tip('Store each supervisor’s contact as you go, so verification season isn’t a scramble.', 'PreMedOS', 'community', 'clinical'),
  tip('Pre-write the common secondary prompts in June — it’s a known timing edge.', 'r/premed', 'community', 'essays'),
  tip('Fit is mutual. The school list and interviews are about mission match, not just stats.', 'r/premed', 'community', 'schools'),
  tip('Protect the GPA, build study habits, and lock in research/shadowing early.', 'your UNC plan', 'andy'),
  tip('Don’t take CHEM 262L before 241L — it’s a prereq and ConnectCarolina will block it.', 'your UNC plan', 'andy', 'academics'),
  tip('Every Neuroscience Additional Requirement needs a C or better — and so do most med prereqs.', 'your UNC plan', 'andy', 'academics'),
  tip('Writing and reviewing goals measurably boosts follow-through. Keep them visible.', 'Deluxe planner', 'community'),
]
function tip(text: string, source: string, tag: TipEntry['tag'], pillar?: string): TipEntry {
  return { id: uid(), text, source, tag, pillar }
}

export const FALLBACK_QUOTES = [
  { t: 'It always seems impossible until it’s done.', by: 'Nelson Mandela' },
  { t: 'The secret of getting ahead is getting started.', by: 'Mark Twain' },
  { t: 'Wherever the art of medicine is loved, there is also a love of humanity.', by: 'Hippocrates' },
  { t: 'Discipline is choosing between what you want now and what you want most.', by: 'Abraham Lincoln' },
  { t: 'Little by little, one travels far.', by: 'J.R.R. Tolkien' },
  { t: 'The expert in anything was once a beginner.', by: 'Helen Hayes' },
  { t: 'Don’t watch the clock; do what it does. Keep going.', by: 'Sam Levenson' },
]

export function createSeedData(): AppData {
  const now = Date.now()
  return {
    profile: {
      name: 'Andy',
      email: '',
      school: 'UNC–Chapel Hill',
      major: 'Neuroscience B.S.',
      track: 'Pre-Med',
      classYear: 'Class of 2030',
      startTerm: 'Fall 2026',
      matriculationTarget: 'Fall 2030',
      applicationCycle: '2029 cycle',
      resumeDocUrl: '',
    },
    goals: {
      clinical: 150, volunteering: 150, shadowing: 50, research: 300,
      activities: 15, mcatTarget: 515, gpaTarget: 3.85,
    },
    courses,
    academics,
    requirements,
    experiences: [],
    experienceHourEntries: [],
    persons: [],
    organizations: [],
    tasks,
    timelineMilestones,
    letters: [],
    stories,
    secondaries: [],
    interviewQs,
    mcat: {
      targetDate: '2029-03-15',
      goalScore: 515,
      attempts: [],
      errorLog: [],
      schedule: mcatSchedule,
    },
    schools,
    resources,
    tips,
    focusTargets,
    quarterlyGoals,
    captures: [],
    advisingQs,
    notePages: [],
    orgs: [],
    notes: {
      'academics-priming': '',
      'academics-syllabi': '',
    },
    settings: {
      theme: 'system',
      visualTheme: 'ghibli',
      backup: { enabled: false, googleClientId: '' },
      calendar: {
        enabled: false,
        googleClientId: '',
        googleApiKey: '',
        cachedEvents: [],
        timelineStart: '06:00',
        timelineEnd: '23:00',
        timeFormat: '12h',
        showLocations: true,
        showAllDayEvents: true,
        useMockPreview: true,
      },
      quotesApi: true,
      sidebarCollapsed: false,
      studentBannerDismissed: false,
      dismissedAlertKey: '',
      northStarExpanded: false,
      overviewTaskMode: 'today',
      academicsMode: 'daily',
      listPreferences: {},
      savedViews: {},
      activeSavedViewIds: {},
      attentionSnoozedUntil: {},
      recommendationState: {},
      mutedRecommendationRules: {},
      projectionDismissals: {},
      mascotNoteDismissals: {},
      // Deliberately un-captured: updatedAt 0 means "nobody has been asked",
      // and generators must ask rather than plan against a made-up week
      // (00 §11b — check before generating, not after).
      weeklyCapacity: { hoursByWeekday: [0, 0, 0, 0, 0, 0, 0], busyPeriods: [], updatedAt: 0 },
    },
    meta: {
      recentRoutes: [],
      activity: [],
      lastOpenedAt: now,
      seedVersion: 5,
      recoveryStack: [],
    },
    trash: [],
  }
}
