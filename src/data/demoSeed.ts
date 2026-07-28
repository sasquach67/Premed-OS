import { createSeedData } from '@/data/seed'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import type {
  AppData, ClassAssignment, ClassNote, Course, ExperienceEntry, KeyPoint,
  LetterEntry, McatAttempt, McatErrorLog, SourceChunk, Topic,
} from '@/lib/types'

const DAY = 86_400_000

export function createDemoData(seedTime = Date.now()): AppData {
  const data = structuredClone(createSeedData())
  const now = new Date(seedTime)
  now.setHours(12, 0, 0, 0)
  const at = now.getTime()
  const date = (offset: number) => new Date(at + offset * DAY).toISOString().slice(0, 10)
  const stamp = (offset: number) => at + offset * DAY

  const courses: Course[] = [
    course('demo-course-biol103', 'Spring 2026', 'BIOL 103', 'How Cells Function', 3, 'A-', true, 'completed', 0),
    course('demo-course-chem241', 'Spring 2026', 'CHEM 241', 'Modern Analytical Methods', 3, 'B+', true, 'completed', 1),
    course('demo-course-psyc101', 'Spring 2026', 'PSYC 101', 'General Psychology', 3, 'A', false, 'completed', 2),
    course('demo-course-biol252', 'Fall 2026', 'BIOL 252', 'Neurobiology', 3, 'IP', true, 'in-progress', 3),
    course('demo-course-chem262', 'Fall 2026', 'CHEM 262', 'Organic Chemistry II', 3, 'IP', true, 'in-progress', 4),
    course('demo-course-phys118', 'Fall 2026', 'PHYS 118', 'Introductory Calculus-based Mechanics and Relativity', 4, 'IP', true, 'in-progress', 5),
    course('demo-course-soci101', 'Fall 2026', 'SOCI 101', 'Sociology', 3, 'IP', false, 'in-progress', 6),
    course('demo-course-psyc210', 'Spring 2027', 'PSYC 210', 'Statistical Principles of Psychological Research', 4, '', false, 'planned', 7),
    course('demo-course-nsci225', 'Spring 2027', 'NSCI 225', 'Cognitive Neuroscience', 3, '', true, 'planned', 8),
    {
      ...course('demo-course-spring-only', 'Fall 2027', 'NSCI 490', 'Advanced Seminar in Translational Neuroscience and Community Health', 3, '', true, 'planned', 9),
      notes: 'Spring-only offering — this Fall placement needs correction.',
    },
    course('demo-course-unplaced', 'Unscheduled', 'CHEM 430', 'Biochemistry', 3, '', true, 'planned', 10),
  ]
  courses[0].satisfies = ['Natural Scientific Investigation', 'Neuroscience B.S.']
  courses[1].satisfies = ['Neuroscience B.S. — Additional Requirements']
  courses[2].satisfies = ['Power and Society', 'Med prereq']
  courses[4].satisfies = ['Neuroscience B.S. — Additional Requirements', 'Med prereq']
  courses[6].satisfies = ['Power and Society', 'MCAT P/S']
  courses[9].satisfies = ['Research and Discovery']
  data.courses = courses

  data.profile = {
    name: 'Andy Quach',
    email: 'andy.quach@example.edu',
    school: 'UNC–Chapel Hill',
    major: 'Neuroscience B.S.',
    track: 'Pre-Med',
    classYear: 'Class of 2028',
    startTerm: 'Fall 2026',
    matriculationTarget: 'Fall 2029',
    applicationCycle: '2028 cycle',
    resumeDocUrl: '',
  }
  data.goals = { clinical: 300, volunteering: 180, shadowing: 80, research: 250, activities: 12, mcatTarget: 515, gpaTarget: 3.8 }

  for (const requirement of data.requirements) requirement.lastVerified = date(0)
  const unverifiedMajor = data.requirements.find((item) => item.label.includes('Select two: NSCI'))
  if (unverifiedMajor) {
    unverifiedMajor.verificationStatus = 'needs-verification'
    unverifiedMajor.note = 'Confirm whether the planned NSCI seminar counts toward the two-course core.'
  }

  const fsrs = (offset: number, reps: number) => ({
    ...createTopicFsrsState(at),
    due: stamp(offset),
    reps,
    lastReview: reps ? stamp(-4) : undefined,
  })
  const topics: Topic[] = [
    topic('demo-topic-synapse', courses[3].id, 'Synaptic transmission', 'Unit 2 · Cellular signaling', 'weak', fsrs(-1, 3), 0, at),
    topic('demo-topic-potentials', courses[3].id, 'Action potentials and ion channels', 'Unit 2 · Cellular signaling', 'seen', fsrs(0, 0), 1, at),
    topic('demo-topic-stereochem', courses[4].id, 'Stereochemistry and conformations', 'Unit 1 · Structure', 'reviewing', fsrs(2, 2), 0, at),
    topic('demo-topic-sn2', courses[4].id, 'SN1 and SN2 mechanisms', 'Unit 1 · Structure', 'not-started', fsrs(0, 0), 1, at),
    topic('demo-topic-work-energy', courses[5].id, 'Work and energy', 'Mechanics', 'ready', fsrs(6, 5), 0, at),
  ]
  const files = [
    {
      id: 'demo-file-biol-syllabus', courseId: courses[3].id, sourceType: 'upload' as const,
      title: 'BIOL 252 parsed syllabus', type: 'syllabus' as const, owner: 'course' as const, fileName: 'BIOL252-syllabus.pdf',
      linkedTopicIds: ['demo-topic-synapse', 'demo-topic-potentials'], processingStatus: 'ready' as const,
      createdAt: stamp(-24), updatedAt: stamp(-24), order: 0,
    },
    {
      id: 'demo-file-biol-lecture', courseId: courses[3].id, sourceType: 'upload' as const,
      title: 'Lecture 5 — Electrical signaling', type: 'lecture-slides' as const, owner: 'course' as const, fileName: 'lecture-05.pdf',
      linkedTopicIds: ['demo-topic-synapse', 'demo-topic-potentials'], processingStatus: 'ready' as const,
      createdAt: stamp(-8), updatedAt: stamp(-8), order: 1,
    },
    {
      id: 'demo-file-unassigned', courseId: courses[3].id, sourceType: 'upload' as const,
      title: 'Guest lecture — glial modulation', type: 'lecture-slides' as const, owner: 'course' as const, fileName: 'guest-glia.pdf',
      linkedTopicIds: [], processingStatus: 'ready' as const,
      createdAt: stamp(-2), updatedAt: stamp(-2), order: 2,
    },
    {
      id: 'demo-file-chem-reading', courseId: courses[4].id, sourceType: 'link' as const,
      title: 'Chapter 6 reaction mechanisms', type: 'reading' as const, owner: 'course' as const, linkedTopicIds: ['demo-topic-sn2'],
      processingStatus: 'ready' as const, createdAt: stamp(-5), updatedAt: stamp(-5), order: 3,
    },
  ]
  const chunks: SourceChunk[] = [
    chunk('demo-chunk-biol-syllabus', files[0].id, courses[3].id, undefined, 'The course syllabus defines three exams, weekly quizzes, and a cumulative final.', 0, at),
    chunk('demo-chunk-synapse', files[1].id, courses[3].id, topics[0].id, 'Chemical synapses convert an electrical signal into neurotransmitter release and a postsynaptic response.', 1, at),
    chunk('demo-chunk-potentials', files[1].id, courses[3].id, topics[1].id, 'Voltage-gated sodium channel activation drives the rising phase of the action potential.', 2, at),
    chunk('demo-chunk-unassigned', files[2].id, courses[3].id, undefined, 'Astrocytes influence synaptic strength through neurotransmitter uptake and gliotransmission.', 3, at),
    chunk('demo-chunk-sn2', files[3].id, courses[4].id, topics[3].id, 'SN2 reactions proceed through concerted backside attack with inversion of stereochemistry.', 4, at),
  ]
  const keyPoints: KeyPoint[] = [
    keyPoint('demo-kp-synapse', topics[0].id, 'Explain vesicle release and the postsynaptic response.', ['demo-chunk-synapse'], 2, 0, at),
    keyPoint('demo-kp-potentials', topics[1].id, 'Trace the phases of an action potential.', ['demo-chunk-potentials'], 0, 1, at),
    keyPoint('demo-kp-sn2', topics[3].id, 'Predict stereochemical outcomes for an SN2 reaction.', ['demo-chunk-sn2'], 0, 2, at),
  ]
  const assignments: ClassAssignment[] = [
    assignment('demo-a-lab', courses[3].id, 'Membrane potential lab report', 'lab', date(-4), 'graded', 'Laboratory', 18, 20, 20, 0, at),
    assignment('demo-a-quiz', courses[3].id, 'Neural signaling quiz', 'quiz', date(-1), 'graded', 'Quizzes', 14, 17, 17, 1, at),
    assignment('demo-a-exam', courses[3].id, 'Midterm — cellular neurophysiology', 'exam', date(6), 'in-progress', 'Exams', undefined, 100, 30, 2, at),
    assignment('demo-a-final', courses[3].id, 'Cumulative final examination covering cellular systems and behavior', 'exam', date(42), 'not-started', 'Final', undefined, 100, 33, 3, at),
    assignment('demo-a-chem', courses[4].id, 'Mechanism problem set', 'homework', date(2), 'not-started', 'Problem sets', undefined, 25, 10, 4, at),
  ]
  assignments[2].important = true
  assignments[2].coveredTopicIds = [topics[0].id, topics[1].id]

  const notes: ClassNote[] = [
    note('demo-note-biol', courses[3].id, 'Lecture 5 — electrical signaling and the unexpectedly important role of glial cells', date(-3), 'Unit 2 · Cellular signaling', [topics[0].id, topics[1].id], at),
    note('demo-note-chem', courses[4].id, 'Mechanism patterns', date(-2), 'Unit 1 · Structure', [topics[2].id, topics[3].id], at),
  ]

  data.academics.classCenter = {
    workspaces: courses.filter((item) => item.term === data.profile.startTerm).map((item, order) => ({
      id: `demo-workspace-${item.id}`, courseId: item.id, color: ['green', 'orange', 'blue', 'purple'][order] as 'green' | 'orange' | 'blue' | 'purple',
      icon: item.bcpm ? 'brain' : 'book', status: 'active', instructor: order === 0 ? 'Dr. Elena Ruiz' : undefined,
      meetingDays: order % 2 ? 'Tue/Thu' : 'MWF', meetingTime: order % 2 ? '11:00 AM–12:15 PM' : '10:10–11:00 AM',
      location: order === 0 ? 'Coker Hall 201' : undefined,
      syllabusUrl: item.id === courses[3].id ? 'https://canvas.unc.edu/' : undefined,
      createdAt: stamp(-30), updatedAt: at, order,
    })),
    topics, notes, assignments, files, keyPoints, sourceChunks: chunks,
    reviewEvents: [
      { id: 'demo-review-1', topicId: topics[0].id, timestamp: stamp(-8), grade: 'hard', confidence: 3, order: 0 },
      { id: 'demo-review-2', topicId: topics[0].id, timestamp: stamp(-4), grade: 'again', confidence: 3, order: 1 },
      { id: 'demo-review-3', topicId: topics[2].id, timestamp: stamp(-2), grade: 'good', confidence: 2, order: 2 },
    ],
    contacts: [
      { id: 'demo-contact-prof', courseId: courses[3].id, name: 'Dr. Elena Ruiz', role: 'professor', email: 'eruiz@example.edu', officeHours: 'Tuesday 2–4 PM', location: 'Coker 318', createdAt: stamp(-30), updatedAt: at, order: 0 },
      { id: 'demo-contact-ta', courseId: courses[3].id, name: 'Jordan Lee', role: 'TA', email: 'jlee@example.edu', officeHours: 'Thursday 4 PM', createdAt: stamp(-30), updatedAt: at, order: 1 },
    ],
    weakAreas: [{ id: 'demo-weak-synapse', courseId: courses[3].id, topicId: topics[0].id, label: 'Synaptic vesicle release sequence', source: 'quiz', reason: 'conceptual', severity: 3, notes: 'Confused calcium entry with vesicle fusion.', createdAt: stamp(-4), lastPracticedAt: stamp(-4), status: 'active', order: 0 }],
    practiceExams: [],
    practiceQuestions: [],
  }
  data.academics.courseOptions = courses.map((item, order) => ({ id: `demo-option-${item.id}`, name: item.code, title: item.title, color: ['blue', 'green', 'purple', 'orange'][order % 4] as 'blue' | 'green' | 'purple' | 'orange' }))
  data.academics.migrationJournal = []

  data.experiences = [
    experience('demo-exp-clinical', 'clinical', 'UNC Hospitals', 'Patient Transport Volunteer', date(-210), 128, 'Helped patients and families navigate transfers while practicing calm bedside communication.', ['patient transport', 'BLS certified', 'vitals'], 0),
    experience('demo-exp-volunteer', 'volunteering', 'TABLE NC', 'Food Access Volunteer', date(-160), 64, 'Packed weekend meal bags and learned how transportation and food access shape health.', ['food security', 'community service'], 1),
    experience('demo-exp-shadow-family', 'shadowing', 'UNC Family Medicine', 'Physician Shadowing', date(-90), 22, 'Observed longitudinal primary care and shared decision-making.', ['Primary care'], 2),
    experience('demo-exp-shadow-neuro', 'shadowing', 'UNC Neurology Clinic', 'Physician Shadowing', date(-35), 14, 'Observed movement-disorder visits and interdisciplinary care planning.', ['Specialty', 'Neurology'], 3),
    experience('demo-exp-leadership', 'leadership', 'Carolina Neuroscience Club', 'Outreach Chair', date(-280), 92, 'Coordinated brain-awareness demonstrations for local middle-school students.', ['leadership', 'education'], 4),
    // Research is deliberately empty so its real empty-state remains visible.
  ]
  data.notePages = [
    { id: 'demo-note-clinical', title: 'Transport reflection', body: 'A patient’s daughter asked me to slow down and explain every turn. I learned that efficiency without orientation can increase anxiety.', tag: 'reflection', pillar: 'clinical', updatedAt: stamp(-2), order: 0 },
  ]
  data.orgs = [
    {
      id: 'demo-org-neuro', name: 'Carolina Neuroscience Club', type: 'Academic club', role: 'Outreach Chair', status: 'leader',
      reflections: [{ id: 'demo-org-reflection', date: date(-18), title: 'Brain Awareness Night', body: 'Reworked the activity after students asked better questions than our original script anticipated.', hours: 6, storyBank: true }],
      joinedAt: date(-280).slice(0, 7), nextGoal: 'Recruit four volunteers for the spring school visit.',
      opportunities: 'Community science night · officer transition planning', meetingInfo: 'Every other Wednesday · Genome Sciences', link: 'https://heellife.unc.edu/',
      totalHours: 92, avgHoursWeekly: 3, memberCount: 38, eventsWorked: 5, order: 0,
    },
  ]

  data.letters = [
    letter('demo-letter-prof', 'Dr. Elena Ruiz', 'BIOL 252 professor', 'Science faculty', 'agreed', date(-12), 0),
    letter('demo-letter-clinical', 'Morgan Patel, RN', 'UNC Hospitals volunteer supervisor', 'Other', 'asked', date(-5), 1),
    letter('demo-letter-advisor', 'Dr. Samuel Green', 'Neuroscience academic advisor', 'Non-science faculty', 'identified', undefined, 2),
  ]
  data.stories = [
    { id: 'demo-story-transport', prompt: 'A meaningful clinical interaction', title: 'Slow down at every turn', commentary: 'During a late-afternoon transport, a patient’s daughter asked me to explain where we were going before each hallway turn. Her request changed how I understood orientation as part of care, not an optional courtesy.', tags: ['clinical', 'communication'], relatedExperienceId: 'demo-exp-clinical', order: 0 },
    { id: 'demo-story-service', prompt: 'A time you learned from a community', title: 'Packing for the weekend', commentary: 'At TABLE NC, families and volunteers showed me how transportation schedules and school calendars shape food access.', tags: ['service', 'social determinants'], relatedExperienceId: 'demo-exp-volunteer', order: 1 },
  ]
  data.secondaries = [
    { id: 'demo-secondary-unc', school: 'UNC School of Medicine', prompt: 'Describe how your experiences prepared you to serve North Carolina communities.', wordLimit: 400, status: 'drafting', notes: 'Connect TABLE NC and patient transport without repeating the personal statement.', order: 0 },
  ]

  data.tasks = [
    { id: 'demo-task-exam', title: 'Build BIOL 252 active-recall plan for the cellular neurophysiology midterm', courseId: courses[3].id, course: 'BIOL 252', type: 'Exam', deadline: date(6), progress: 'Working on', kanban: 'doing', archived: false, milestone: false, horizon: 'now', important: true, order: 0 },
    { id: 'demo-task-hours', title: 'Log this month’s clinical and service hours', type: 'Personal', deadline: date(1), progress: 'Not started', kanban: 'todo', archived: false, milestone: false, horizon: 'now', important: true, order: 1 },
    { id: 'demo-task-lor', title: 'Send Dr. Ruiz the letter-writer packet', type: 'Application', deadline: date(12), progress: 'Not started', kanban: 'todo', archived: false, milestone: false, horizon: 'soon', important: true, order: 2 },
    { id: 'demo-milestone-mcat', title: 'Sit for the MCAT', type: 'Application', deadline: date(426), progress: 'Not started', kanban: 'todo', archived: false, milestone: true, horizon: 'soon', important: false, order: 3 },
    { id: 'demo-milestone-amcas', title: 'Submit AMCAS primary', type: 'Application', deadline: date(500), progress: 'Not started', kanban: 'todo', archived: false, milestone: true, horizon: 'soon', important: false, order: 4 },
  ]
  data.quarterlyGoals = [
    { id: 'demo-goal-1', quarter: 'Current term', text: 'Protect a 3.8+ GPA while building a repeatable active-recall system', done: false, standingTarget: 'gpaTarget', order: 0 },
    { id: 'demo-goal-2', quarter: 'Current term', text: 'Reach 150 clinical hours without sacrificing reflection quality', done: false, standingTarget: 'clinical', order: 1 },
  ]
  data.captures = [{ id: 'demo-capture-1', kind: 'idea', content: 'Ask Dr. Ruiz whether glial modulation belongs in the midterm scope.', createdAt: stamp(-1), updatedAt: stamp(-1), origin: 'overview', order: 0 }]

  const attempts: McatAttempt[] = [
    { id: 'demo-mcat-diagnostic', date: date(-21), total: 502, cp: 124, cars: 126, bb: 125, ps: 127, kind: 'practice', source: 'Blueprint diagnostic', notes: 'Strongest in P/S; content gaps in electrochemistry and amino acids.', order: 0 },
  ]
  const errorLog: McatErrorLog[] = [
    { id: 'demo-mcat-error-1', date: date(-8), section: 'Chem/Phys', topic: 'Electrochemistry', whyMissed: 'Reversed the sign convention for a galvanic cell.', fix: 'Redraw anode/cathode before using the equation.', source: 'AAMC question pack', resolved: false, order: 0 },
    { id: 'demo-mcat-error-2', date: date(-4), section: 'Bio/Biochem', topic: 'Amino acids', whyMissed: 'Relied on recognition instead of recalling side-chain charge.', fix: 'Daily blank-sheet amino-acid grid.', source: 'UWorld', resolved: false, order: 1 },
  ]
  data.mcat = {
    targetDate: date(426), goalScore: 515, baselineScore: 502, weeklyStudyHours: 6,
    preferredSessionLength: 45, currentPhase: 'Foundation', planIntensity: 'balanced', focusSection: 'Chem/Phys',
    attempts, errorLog,
    schedule: [
      { id: 'demo-mcat-plan-1', phase: 'Foundation', week: 'This week', focus: 'Electrochemistry equations + 30 targeted questions', resource: 'AAMC + UWorld', done: false, order: 0 },
      { id: 'demo-mcat-plan-2', phase: 'Foundation', week: 'Next week', focus: 'Amino acids and protein structure', resource: 'AnKing + Khan Academy', done: false, order: 1 },
    ],
  }

  data.schools = [
    { id: 'demo-school-unc', name: 'UNC School of Medicine', location: 'Chapel Hill, NC', state: 'NC', type: 'MD', category: 'target', status: 'researching', medianGpa: 3.82, medianMcat: 512, mission: 'Serve North Carolina through education, discovery, and patient care.', secondaryStatus: 'not started', order: 0 },
    { id: 'demo-school-ecu', name: 'Brody School of Medicine at East Carolina University', location: 'Greenville, NC', state: 'NC', type: 'MD', category: 'target', status: 'researching', mission: 'Primary care and service to eastern North Carolina.', secondaryStatus: 'not started', order: 1 },
  ]
  data.meta = {
    recentRoutes: ['academics', 'clinical', 'mcat'],
    activity: [
      { id: 'demo-activity-review', at: stamp(-1), pillar: 'academics', label: 'Reviewed synaptic transmission' },
      { id: 'demo-activity-clinical', at: stamp(-2), pillar: 'clinical', label: 'Logged a patient transport shift' },
    ],
    lastOpenedAt: at,
    seedVersion: 7,
    recoveryStack: [],
  }
  data.settings.backup = { enabled: false, googleClientId: '' }
  data.settings.calendar.enabled = false
  data.settings.calendar.cachedEvents = []
  data.settings.recommendationState = {}
  data.settings.mutedRecommendationRules = {}

  return data
}

function course(id: string, term: string, code: string, title: string, credits: number, grade: Course['grade'], bcpm: boolean, status: Course['status'], order: number): Course {
  return { id, term, code, title, credits, grade, bcpm, status, inResidence: true, satisfies: [], order }
}

function topic(id: string, courseId: string, title: string, unit: string, status: Topic['status'], fsrs: Topic['fsrs'], order: number, now: number): Topic {
  return { id, courseId, title, unit, status, fsrs, confidence: status === 'weak' ? 1 : 2, sourceNoteIds: [], linkedNoteIds: [], linkedAssignmentIds: [], linkedFileIds: [], createdAt: now, updatedAt: now, order }
}

function chunk(id: string, fileId: string, courseId: string, topicId: string | undefined, content: string, order: number, now: number): SourceChunk {
  return { id, fileId, courseId, topicId, content, characterStart: 0, characterEnd: content.length, assignmentMethod: topicId ? 'manual' : 'pending', assignmentConfirmed: Boolean(topicId), coveredByKeyPoint: false, createdAt: now, updatedAt: now, order }
}

function keyPoint(id: string, topicId: string, text: string, sourceChunkIds: string[], timesSurfaced: number, order: number, now: number): KeyPoint {
  return { id, topicId, text, sourceChunkIds, timesSurfaced, lastSurfaced: timesSurfaced ? now - 4 * DAY : undefined, createdAt: now, updatedAt: now, order }
}

function assignment(id: string, courseId: string, title: string, type: ClassAssignment['type'], dueDate: string, status: ClassAssignment['status'], category: string, pointsEarned: number | undefined, pointsPossible: number, weight: number, order: number, now: number): ClassAssignment {
  return { id, courseId, title, type, dueDate, status, category, pointsEarned, pointsPossible, weight, linkedTopicIds: [], linkedFileIds: [], createdAt: now, updatedAt: now, order }
}

function note(id: string, courseId: string, title: string, date: string, unit: string, topicIds: string[], now: number): ClassNote {
  return { id, courseId, title, type: 'lecture', kind: 'about-class', date, unit, topicIds, content: 'Key mechanism, one uncertainty to resolve, and the next recall question.', syncStatus: 'local-only', linkedFileIds: [], createdAt: now, updatedAt: now, order: 0 }
}

function experience(id: string, category: ExperienceEntry['category'], org: string, role: string, startDate: string, hours: number, description: string, tags: string[], order: number): ExperienceEntry {
  return { id, category, org, role, startDate, hours, description, mostMeaningful: description, supervisor: category === 'clinical' ? 'Morgan Patel, RN' : '', contact: '', status: 'active', tags, order }
}

function letter(id: string, recommender: string, role: string, type: string, status: LetterEntry['status'], dateAsked: string | undefined, order: number): LetterEntry {
  return { id, recommender, role, relationship: role, type, status, dateAsked, notes: status === 'identified' ? 'Build the relationship before asking.' : 'Send an updated CV and a concise reminder of shared work.', order }
}
