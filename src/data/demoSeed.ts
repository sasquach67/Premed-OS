import { createSeedData } from '@/data/seed'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import type {
  AppData, AssignedReading, ClassAssignment, ClassNote, Course, ExperienceEntry, ExperienceHourEntry, FeedbackNote, KeyPoint, PaperDraft,
  LetterEntry, McatAttempt, McatErrorLog, SourceChunk, Topic,
} from '@/lib/types'

const DAY = 86_400_000

/** One slot per class, so no two demo courses collide on the same hour. */
const MEETING_PATTERN = [
  { days: 'MWF', time: '9:05–9:55 AM' },
  { days: 'Tue/Thu', time: '11:00 AM–12:15 PM' },
  { days: 'MWF', time: '10:10–11:00 AM' },
  { days: 'Tue/Thu', time: '2:00–3:15 PM' },
  { days: 'MWF', time: '1:25–2:15 PM' },
]

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
    course('demo-course-engl105', 'Fall 2026', 'ENGL 105', 'English Composition & Rhetoric', 3, 'IP', false, 'in-progress', 7),
    course('demo-course-psyc210', 'Spring 2027', 'PSYC 210', 'Statistical Principles of Psychological Research', 4, '', false, 'planned', 8),
    course('demo-course-nsci225', 'Spring 2027', 'NSCI 225', 'Cognitive Neuroscience', 3, '', true, 'planned', 9),
    {
      ...course('demo-course-spring-only', 'Fall 2027', 'NSCI 490', 'Advanced Seminar in Translational Neuroscience and Community Health', 3, '', true, 'planned', 10),
      notes: 'Spring-only offering — this Fall placement needs correction.',
    },
    course('demo-course-unplaced', 'Unscheduled', 'CHEM 430', 'Biochemistry', 3, '', true, 'planned', 11),
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

    // BIOL 252 — six topics, so the link-many picker is offered (>5).
    topic('demo-topic-glia', courses[3].id, 'Glial cells and myelination', 'Unit 1 · Foundations', 'ready', fsrs(7, 3), 2, at),
    topic('demo-topic-neurotransmitters', courses[3].id, 'Neurotransmitter systems', 'Unit 3 · Systems', 'reviewing', fsrs(1, 2), 3, at),
    topic('demo-topic-sensory', courses[3].id, 'Sensory transduction', 'Unit 3 · Systems', 'seen', fsrs(0, 0), 4, at),
    topic('demo-topic-plasticity', courses[3].id, 'Synaptic plasticity and LTP', 'Unit 4 · Plasticity', 'not-started', fsrs(0, 0), 5, at),

    // CHEM 262 — seven topics. `demo-topic-acid-base` is the difficulty outlier
    // signal #27 reads: three lapses, strictly more than any sibling.
    {
      ...topic('demo-topic-acid-base', courses[4].id, 'Acid–base and pKa', 'Unit 2 · Reactivity', 'weak', fsrs(1, 4), 2, at),
      fsrs: { ...fsrs(1, 4), lapses: 3, difficulty: 7.4, stability: 2.1 },
    },
    { ...topic('demo-topic-alkene', courses[4].id, 'Alkene addition reactions', 'Unit 3 · Additions', 'ready', fsrs(9, 4), 3, at), fsrs: { ...fsrs(9, 4), lapses: 1 } },
    topic('demo-topic-radical', courses[4].id, 'Radical halogenation', 'Unit 3 · Additions', 'seen', fsrs(0, 0), 4, at),
    topic('demo-topic-aromatic', courses[4].id, 'Aromatic substitution', 'Unit 4 · Aromatics', 'not-started', fsrs(0, 0), 5, at),
    topic('demo-topic-carbonyl', courses[4].id, 'Carbonyl addition', 'Unit 4 · Aromatics', 'not-started', fsrs(0, 0), 6, at),

    // PHYS 118 — six topics.
    topic('demo-topic-kinematics', courses[5].id, 'Kinematics in one and two dimensions', 'Mechanics', 'ready', fsrs(11, 4), 1, at),
    topic('demo-topic-newton', courses[5].id, 'Newton’s laws and free-body diagrams', 'Mechanics', 'reviewing', fsrs(2, 3), 2, at),
    topic('demo-topic-momentum', courses[5].id, 'Momentum and collisions', 'Mechanics', 'seen', fsrs(0, 0), 3, at),
    topic('demo-topic-rotation', courses[5].id, 'Rotational dynamics', 'Rotation', 'not-started', fsrs(0, 0), 4, at),
    topic('demo-topic-oscillation', courses[5].id, 'Simple harmonic motion', 'Oscillations', 'not-started', fsrs(0, 0), 5, at),

    // BIOL 103 is complete, so its topics are what the end-of-term rollover
    // sorts. One matches a planned course, two carry real retention, one has
    // none — so all three fates are populated by the defaults.
    topic('demo-topic-membrane-transport', courses[0].id, 'Membrane transport', 'Unit 3 · Cells', 'ready', fsrs(30, 5), 0, at),
    topic('demo-topic-enzyme-kinetics', courses[0].id, 'Enzyme kinetics', 'Unit 4 · Metabolism', 'ready', fsrs(24, 4), 1, at),
    topic('demo-topic-biochemistry-intro', courses[0].id, 'Biochemistry of respiration', 'Unit 5 · Energy', 'ready', fsrs(21, 3), 2, at),
    topic('demo-topic-microscopy', courses[0].id, 'Microscopy technique', 'Unit 1 · Methods', 'seen', fsrs(0, 0), 3, at),
  ]
  // Stagger when each topic was last touched. Without this every topic carries
  // the seed timestamp, so the study-cycle panel reads the whole term as
  // "just covered" — which is not what a real class looks like in week eight.
  const coveredAgo: Record<string, number> = {
    'demo-topic-synapse': -12, 'demo-topic-potentials': -3, 'demo-topic-glia': -26,
    'demo-topic-neurotransmitters': -15, 'demo-topic-sensory': -2, 'demo-topic-plasticity': -1,
    'demo-topic-stereochem': -24, 'demo-topic-sn2': -19, 'demo-topic-acid-base': -17,
    'demo-topic-alkene': -14, 'demo-topic-radical': -5, 'demo-topic-aromatic': -2,
    'demo-topic-carbonyl': -1, 'demo-topic-work-energy': -22, 'demo-topic-kinematics': -27,
    'demo-topic-newton': -18, 'demo-topic-momentum': -6, 'demo-topic-rotation': -2,
    'demo-topic-oscillation': -1,
  }
  for (const item of topics) {
    const ago = coveredAgo[item.id] ?? -10
    item.createdAt = stamp(ago - 4)
    item.updatedAt = stamp(ago)
  }

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

    // §6.6 Pretest needs at least three key points on an UNCOVERED topic before
    // it will offer anything — two questions is not a pretest. Synaptic
    // plasticity is seeded past that floor so the step is demonstrable.
    keyPoint('demo-kp-ltp-1', 'demo-topic-plasticity', 'What has to happen at a synapse for a change to persist?', ['demo-chunk-synapse'], 0, 3, at),
    keyPoint('demo-kp-ltp-2', 'demo-topic-plasticity', 'Why would repeated stimulation strengthen a connection rather than exhaust it?', ['demo-chunk-synapse'], 0, 4, at),
    keyPoint('demo-kp-ltp-3', 'demo-topic-plasticity', 'What would you expect to block long-term potentiation?', ['demo-chunk-potentials'], 0, 5, at),
    keyPoint('demo-kp-ltp-4', 'demo-topic-plasticity', 'How might a synapse weaken rather than strengthen?', ['demo-chunk-potentials'], 0, 6, at),
  ]
  const assignments: ClassAssignment[] = [
    assignment('demo-a-lab', courses[3].id, 'Membrane potential lab report', 'lab', date(-4), 'graded', 'Laboratory', 18, 20, 20, 0, at),
    assignment('demo-a-quiz', courses[3].id, 'Neural signaling quiz', 'quiz', date(-1), 'graded', 'Quizzes', 14, 17, 17, 1, at),
    assignment('demo-a-exam', courses[3].id, 'Midterm — cellular neurophysiology', 'exam', date(6), 'in-progress', 'Exams', undefined, 100, 30, 2, at),
    assignment('demo-a-final', courses[3].id, 'Cumulative final examination covering cellular systems and behavior', 'exam', date(42), 'not-started', 'Final', undefined, 100, 33, 3, at),
    assignment('demo-a-chem', courses[4].id, 'Mechanism problem set', 'homework', date(2), 'not-started', 'Problem sets', undefined, 25, 10, 4, at),
    assignment('demo-a-engl-draft', courses[7].id, 'Rhetorical analysis draft', 'project', date(3), 'in-progress', 'Essays', undefined, 100, 35, 5, at),
  ]
  assignments.push(
    assignment('demo-a-biol-quiz2', courses[3].id, 'Sensory systems quiz', 'quiz', date(4), 'not-started', 'Quizzes', undefined, 20, 5, 6, at),
    assignment('demo-a-biol-ps', courses[3].id, 'Ion channel problem set', 'homework', date(-9), 'graded', 'Problem sets', 22, 25, 8, 7, at),
    // CHEM 262's past exam — the record signal #41 reads. Nothing it tested has
    // been retrieved since, which is the whole point of the check.
    assignment('demo-a-chem-exam1', courses[4].id, 'Exam 1 — structure and substitution', 'exam', date(-21), 'graded', 'Exams', 78, 100, 25, 8, at),
    assignment('demo-a-chem-exam2', courses[4].id, 'Exam 2 — additions and aromatics', 'exam', date(16), 'not-started', 'Exams', undefined, 100, 25, 9, at),
    assignment('demo-a-chem-lab', courses[4].id, 'Recrystallization lab report', 'lab', date(-6), 'graded', 'Laboratory', 17, 20, 10, 10, at),
    assignment('demo-a-phys-ps5', courses[5].id, 'Problem set 5 — rotational dynamics', 'homework', date(3), 'not-started', 'Problem sets', undefined, 30, 8, 11, at),
    assignment('demo-a-phys-lab', courses[5].id, 'Conservation of momentum lab', 'lab', date(-2), 'submitted', 'Laboratory', undefined, 25, 7, 12, at),
    assignment('demo-a-phys-exam', courses[5].id, 'Midterm 2 — momentum and rotation', 'exam', date(10), 'not-started', 'Exams', undefined, 100, 28, 13, at),
    assignment('demo-a-soci-response', courses[6].id, 'Reading response — social determinants', 'discussion', date(1), 'not-started', 'Responses', undefined, 10, 5, 14, at),
    assignment('demo-a-soci-paper', courses[6].id, 'Midterm paper — inequality and health', 'project', date(19), 'not-started', 'Papers', undefined, 100, 25, 15, at),
    assignment('demo-a-engl-final', courses[7].id, 'Final portfolio', 'project', date(38), 'not-started', 'Portfolio', undefined, 100, 40, 16, at),
  )

  assignments[2].important = true
  assignments[2].coveredTopicIds = [topics[0].id, topics[1].id]

  const byId = (id: string) => assignments.find((item) => item.id === id)!

  // Links a real student would have made. These are what the class surfaces
  // read — nothing infers them, and the unlinked rows below are deliberate.
  byId('demo-a-chem').linkedTopicIds = ['demo-topic-sn2']            // #37: due in 2 days, no practice recorded
  byId('demo-a-chem-exam1').coveredTopicIds = ['demo-topic-radical', 'demo-topic-aromatic'] // #41: untouched since
  byId('demo-a-chem-exam2').coveredTopicIds = ['demo-topic-alkene', 'demo-topic-aromatic', 'demo-topic-carbonyl']
  byId('demo-a-chem-lab').linkedTopicIds = ['demo-topic-stereochem']

  // #44 — returned work with a live instructor window, and one whose window
  // was never recorded, so the "unknown" state is visible too.
  byId('demo-a-chem-exam1').returnedAt = date(-14)
  byId('demo-a-chem-exam1').regradeDeadline = date(5)
  byId('demo-a-chem-lab').returnedAt = date(-3)
  byId('demo-a-biol-ps').returnedAt = date(-6)
  byId('demo-a-biol-ps').linkedTopicIds = ['demo-topic-potentials']
  byId('demo-a-biol-quiz2').linkedTopicIds = ['demo-topic-sensory']
  byId('demo-a-phys-ps5').linkedTopicIds = ['demo-topic-rotation']
  byId('demo-a-phys-exam').coveredTopicIds = ['demo-topic-momentum', 'demo-topic-rotation']
  // demo-a-phys-lab and the SOCI rows stay unlinked on purpose: unlinked is a
  // normal permanent state and the UI must never treat it as an omission.

  const notes: ClassNote[] = [
    note('demo-note-biol', courses[3].id, 'Lecture 5 — electrical signaling and the unexpectedly important role of glial cells', date(-3), 'Unit 2 · Cellular signaling', [topics[0].id, topics[1].id], at),
    note('demo-note-chem', courses[4].id, 'Mechanism patterns', date(-2), 'Unit 1 · Structure', [topics[2].id, topics[3].id], at),
    note('demo-note-chem-acid', courses[4].id, 'Acid–base: why pKa keeps slipping', date(-6), 'Unit 2 · Reactivity', ['demo-topic-acid-base'], at),
    note('demo-note-biol-sensory', courses[3].id, 'Lecture 9 — sensory transduction', date(-1), 'Unit 3 · Systems', ['demo-topic-sensory'], at),
    note('demo-note-phys-rotation', courses[5].id, 'Rotational dynamics worked examples', date(-2), 'Rotation', ['demo-topic-rotation'], at),
    note('demo-note-soci', courses[6].id, 'Social determinants — discussion notes', date(-3), 'Unit 2', [], at),
  ]

  data.academics.classCenter = {
    workspaces: courses.filter((item) => item.term === data.profile.startTerm).map((item, order) => ({
      id: `demo-workspace-${item.id}`, courseId: item.id, color: ['green', 'orange', 'blue', 'purple'][order] as 'green' | 'orange' | 'blue' | 'purple',
      type: item.code === 'ENGL 105' ? 'writing' : item.bcpm ? 'stem' : 'general',
      icon: item.code === 'ENGL 105' ? 'pen' : item.bcpm ? 'brain' : 'book', status: 'active', instructor: item.code === 'ENGL 105' ? 'Prof. Maya Bell' : order === 0 ? 'Dr. Elena Ruiz' : undefined,
      // Distinct slots per class. The old rule gave every MWF class the same
      // 10:10 hour, so the daily hero triple-booked the student — believable
      // demo data matters here, because this is the surface people judge the
      // app's honesty by.
      meetingDays: MEETING_PATTERN[order % MEETING_PATTERN.length].days,
      meetingTime: MEETING_PATTERN[order % MEETING_PATTERN.length].time,
      location: order === 0 ? 'Coker Hall 201' : undefined,
      syllabusUrl: item.id === courses[3].id ? 'https://canvas.unc.edu/' : undefined,
      createdAt: stamp(-30), updatedAt: at, order,
    })),
    // The mirror `topicLinks.setLinks` maintains, seeded so the topic side and
    // the assignment side agree before the student touches anything.
    topics: topics.map((item) => ({
      ...item,
      linkedAssignmentIds: assignments.filter((work) => work.linkedTopicIds.includes(item.id)).map((work) => work.id),
    })),
    notes, assignments, files, keyPoints, sourceChunks: chunks,
    reviewEvents: [
      { id: 'demo-review-1', topicId: topics[0].id, timestamp: stamp(-8), grade: 'hard', confidence: 3, order: 0 },
      { id: 'demo-review-2', topicId: topics[0].id, timestamp: stamp(-4), grade: 'again', confidence: 3, order: 1 },
      { id: 'demo-review-3', topicId: topics[2].id, timestamp: stamp(-2), grade: 'good', confidence: 2, order: 2 },

      // CHEM 262 acid–base: four attempts, three of them lapses. This is the
      // history signal #27 reads, and the forgetting curve needs ≥3 points.
      { id: 'demo-review-ab-1', topicId: 'demo-topic-acid-base', timestamp: stamp(-16), grade: 'again', confidence: 2, order: 3 },
      { id: 'demo-review-ab-2', topicId: 'demo-topic-acid-base', timestamp: stamp(-11), grade: 'hard', confidence: 2, order: 4 },
      { id: 'demo-review-ab-3', topicId: 'demo-topic-acid-base', timestamp: stamp(-6), grade: 'again', confidence: 1, order: 5 },
      { id: 'demo-review-ab-4', topicId: 'demo-topic-acid-base', timestamp: stamp(-2), grade: 'hard', confidence: 2, order: 6 },

      { id: 'demo-review-alkene-1', topicId: 'demo-topic-alkene', timestamp: stamp(-13), grade: 'good', confidence: 3, order: 7 },
      { id: 'demo-review-alkene-2', topicId: 'demo-topic-alkene', timestamp: stamp(-7), grade: 'good', confidence: 3, order: 8 },
      { id: 'demo-review-alkene-3', topicId: 'demo-topic-alkene', timestamp: stamp(-3), grade: 'easy', confidence: 3, order: 9 },

      { id: 'demo-review-glia-1', topicId: 'demo-topic-glia', timestamp: stamp(-14), grade: 'good', confidence: 3, order: 10 },
      { id: 'demo-review-glia-2', topicId: 'demo-topic-glia', timestamp: stamp(-9), grade: 'good', confidence: 3, order: 11 },
      { id: 'demo-review-glia-3', topicId: 'demo-topic-glia', timestamp: stamp(-3), grade: 'easy', confidence: 3, order: 12 },
      { id: 'demo-review-nt-1', topicId: 'demo-topic-neurotransmitters', timestamp: stamp(-10), grade: 'hard', confidence: 2, order: 13 },
      { id: 'demo-review-nt-2', topicId: 'demo-topic-neurotransmitters', timestamp: stamp(-4), grade: 'good', confidence: 3, order: 14 },

      { id: 'demo-review-kin-1', topicId: 'demo-topic-kinematics', timestamp: stamp(-18), grade: 'good', confidence: 3, order: 15 },
      { id: 'demo-review-kin-2', topicId: 'demo-topic-kinematics', timestamp: stamp(-12), grade: 'easy', confidence: 3, order: 16 },
      { id: 'demo-review-kin-3', topicId: 'demo-topic-kinematics', timestamp: stamp(-5), grade: 'good', confidence: 3, order: 17 },
      { id: 'demo-review-newton-1', topicId: 'demo-topic-newton', timestamp: stamp(-15), grade: 'hard', confidence: 2, order: 18 },
      { id: 'demo-review-newton-2', topicId: 'demo-topic-newton', timestamp: stamp(-8), grade: 'good', confidence: 3, order: 19 },
      { id: 'demo-review-newton-3', topicId: 'demo-topic-newton', timestamp: stamp(-2), grade: 'good', confidence: 3, order: 20 },
    ],
    contacts: [
      { id: 'demo-contact-prof', courseId: courses[3].id, name: 'Dr. Elena Ruiz', role: 'professor', email: 'eruiz@example.edu', officeHours: 'Tuesday 2–4 PM', location: 'Coker 318', createdAt: stamp(-30), updatedAt: at, order: 0 },
      { id: 'demo-contact-ta', courseId: courses[3].id, name: 'Jordan Lee', role: 'TA', email: 'jlee@example.edu', officeHours: 'Thursday 4 PM', createdAt: stamp(-30), updatedAt: at, order: 1 },
      { id: 'demo-contact-chem-prof', courseId: courses[4].id, name: 'Dr. Nadia Elamin', role: 'professor', email: 'nelamin@example.edu', officeHours: 'Monday 1–3 PM', location: 'Kenan C210', createdAt: stamp(-30), updatedAt: at, order: 2 },
      { id: 'demo-contact-chem-partner', courseId: courses[4].id, name: 'Priya Raman', role: 'study-partner', email: 'praman@example.edu', createdAt: stamp(-20), updatedAt: at, order: 3 },
      { id: 'demo-contact-phys-ta', courseId: courses[5].id, name: 'Marcus Bell', role: 'TA', email: 'mbell@example.edu', officeHours: 'Wednesday 3–5 PM', createdAt: stamp(-28), updatedAt: at, order: 4 },
    ],
    weakAreas: [{ id: 'demo-weak-synapse', courseId: courses[3].id, topicId: topics[0].id, label: 'Synaptic vesicle release sequence', source: 'quiz', reason: 'conceptual', severity: 3, notes: 'Confused calcium entry with vesicle fusion.', createdAt: stamp(-4), lastPracticedAt: stamp(-4), status: 'active', order: 0 }],
    practiceExams: [],
    practiceQuestions: [],
    paperDrafts: [
      { id: 'demo-draft-engl105-rhetorical-analysis', courseId: 'demo-course-engl105', title: 'Rhetorical analysis', stage: 'draft', selfDeadline: date(3), createdAt: stamp(-6), updatedAt: stamp(-1), order: 0 },
      { id: 'demo-draft-engl105-profile', courseId: 'demo-course-engl105', title: 'Profile essay', stage: 'submitted', selfDeadline: date(-17), completedAt: stamp(-16), createdAt: stamp(-30), updatedAt: stamp(-16), order: 1 },
      { id: 'demo-draft-engl105-portfolio', courseId: 'demo-course-engl105', title: 'Final portfolio', stage: 'outline', selfDeadline: date(34), createdAt: stamp(-1), updatedAt: stamp(-1), order: 2 },
    ] as PaperDraft[],
    assignedReadings: [
      { id: 'demo-reading-engl105-1', courseId: 'demo-course-engl105', week: 'Week 2', title: 'Writing as a process', source: 'Course reader', status: 'read', dueForDiscussion: date(-1), createdAt: stamp(-9), updatedAt: stamp(-2), order: 0 },
      { id: 'demo-reading-engl105-2', courseId: 'demo-course-engl105', week: 'Week 2', title: 'Audience and evidence', source: 'Course reader', status: 'not-started', dueForDiscussion: date(1), createdAt: stamp(-9), updatedAt: stamp(-9), order: 1 },
      { id: 'demo-reading-engl105-3', courseId: 'demo-course-engl105', week: 'Week 3', title: 'Counterargument and concession', source: 'Course reader', status: 'skimmed', dueForDiscussion: date(4), createdAt: stamp(-4), updatedAt: stamp(-2), order: 2 },
      { id: 'demo-reading-engl105-4', courseId: 'demo-course-engl105', week: 'Week 4', title: 'Revising for a reader', source: 'Course reader', status: 'not-started', dueForDiscussion: date(11), createdAt: stamp(-4), updatedAt: stamp(-4), order: 3 },
    ] as AssignedReading[],
    feedbackNotes: [
      { id: 'demo-feedback-engl105-thesis', courseId: 'demo-course-engl105', theme: 'Make the thesis more specific', quote: 'Show the reader what is at stake in the claim.', createdAt: stamp(-3), updatedAt: stamp(-3), order: 0 },
      // Repeated twice more, so #59's "recurring theme" has something real to
      // aggregate rather than a single instance.
      { id: 'demo-feedback-engl105-thesis-2', courseId: 'demo-course-engl105', theme: 'Thesis placement', quote: 'The claim arrives on page two; the reader needs it sooner.', createdAt: stamp(-16), updatedAt: stamp(-16), order: 1 },
      { id: 'demo-feedback-engl105-evidence', courseId: 'demo-course-engl105', theme: 'Evidence needs framing', quote: 'Quotations are doing the arguing without you.', createdAt: stamp(-16), updatedAt: stamp(-16), order: 2 },
    ] as FeedbackNote[],
    // #50 — one category with policy recorded, one deliberately silent, so the
    // difference between "recorded as not applying" and "never recorded" is
    // visible in the running app rather than only in a test.
    gradeCategories: [
      { id: 'demo-cat-chem-ps', courseId: courses[4].id, name: 'Problem sets', weight: 10, dropLowestCount: 1, replacementRule: false, source: 'CHEM 262 syllabus §4 — student-approved', createdAt: stamp(-30), updatedAt: stamp(-30), order: 0 },
      { id: 'demo-cat-chem-exams', courseId: courses[4].id, name: 'Exams', weight: 50, createdAt: stamp(-30), updatedAt: stamp(-30), order: 1 },
      { id: 'demo-cat-biol-quiz', courseId: courses[3].id, name: 'Quizzes', weight: 0, createdAt: stamp(-30), updatedAt: stamp(-30), order: 2 },
    ],
    // #47/#48 — four marked, one unmarked. Deliberately below the five-record
    // sample floor, so the app must refuse to call it a pattern.
    mistakes: [
      { id: 'demo-mistake-acid', courseId: courses[4].id, assignmentId: 'demo-a-chem-exam1', topicId: 'demo-topic-acid-base', label: 'Acid–base mechanism', cause: 'knew-it-but-blanked' as const, createdAt: stamp(-13), updatedAt: stamp(-13), order: 0 },
      { id: 'demo-mistake-leaving', courseId: courses[4].id, assignmentId: 'demo-a-chem-exam1', topicId: 'demo-topic-sn2', label: 'Leaving-group order', cause: 'didnt-know' as const, createdAt: stamp(-13), updatedAt: stamp(-13), order: 1 },
      { id: 'demo-mistake-stereo', courseId: courses[4].id, assignmentId: 'demo-a-chem-exam1', topicId: 'demo-topic-stereochem', label: 'Inversion vs retention', cause: 'knew-it-but-blanked' as const, createdAt: stamp(-12), updatedAt: stamp(-12), order: 2 },
      { id: 'demo-mistake-q7', courseId: courses[4].id, assignmentId: 'demo-a-chem-exam1', label: 'Question 7 is unclassified', createdAt: stamp(-12), updatedAt: stamp(-12), order: 3 },
      { id: 'demo-mistake-biol', courseId: courses[3].id, assignmentId: 'demo-a-biol-ps', topicId: 'demo-topic-potentials', label: 'Channel gating sequence', cause: 'didnt-know' as const, createdAt: stamp(-5), updatedAt: stamp(-5), order: 4 },
    ],
    // §6.6 Connect — seeded empty: a link is a claim the student makes.
    topicLinks: [],
    topicPredictions: [],
    savedPlans: [],
    plannerTerms: [],
    examPrepPlans: [],
    generatedFlashcardDecks: [],
    generatedMockAttempts: [],
    generatedRevisedNotes: [],
    professorEvidence: [],
    conceptCanvases: [],
    assessmentMaterials: [],
    assessmentAttempts: [],
    transcriptRecords: [],
    acknowledgedCatalogWarnings: [],
    lectures: [],
    lectureFindings: [],
    lectureMaterialProposals: [],
    lectureNoteProposals: [],
    termReports: [],
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
  // Demo aggregates are explicitly estimated backfill blocks. They make the
  // total visible without masquerading as a measured weekly history.
  data.experienceHourEntries = data.experiences.map((experience, order): ExperienceHourEntry => ({
    id: `demo-hour-estimate-${experience.id}`,
    experienceId: experience.id,
    hours: experience.hours ?? 0,
    kind: 'estimated',
    periodStart: experience.startDate,
    note: 'Demo aggregate shown as an estimated backfill block.',
    createdAt: stamp(-1),
    updatedAt: stamp(-1),
    archived: false,
    order,
  }))
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
    { id: 'demo-story-capture', prompt: '', title: '', commentary: 'Ask Dr. Ruiz whether glial modulation belongs in the midterm scope.', tags: [], capturedAt: stamp(-1), updatedAt: stamp(-1), origin: 'overview', order: 2 },
  ]
  data.secondaries = [
    { id: 'demo-secondary-unc', school: 'UNC School of Medicine', prompt: 'Describe how your experiences prepared you to serve North Carolina communities.', wordLimit: 400, status: 'drafting', notes: 'Connect TABLE NC and patient transport without repeating the personal statement.', order: 0 },
  ]

  data.tasks = [
    { id: 'demo-task-exam', title: 'Build BIOL 252 active-recall plan for the cellular neurophysiology midterm', courseId: courses[3].id, course: 'BIOL 252', type: 'Exam', deadline: date(6), progress: 'Working on', kanban: 'doing', archived: false, horizon: 'now', important: true, order: 0 },
    { id: 'demo-task-hours', title: 'Log this month’s clinical and service hours', type: 'Personal', deadline: date(1), progress: 'Not started', kanban: 'todo', archived: false, horizon: 'now', important: true, order: 1 },
    { id: 'demo-task-lor', title: 'Send Dr. Ruiz the letter-writer packet', type: 'Application', deadline: date(12), progress: 'Not started', kanban: 'todo', archived: false, horizon: 'soon', important: true, order: 2 },
  ]
  data.timelineMilestones = [
    { id: 'demo-milestone-mcat', title: 'Sit for the MCAT', targetDate: date(426), detail: '', completed: false, order: 0 },
    { id: 'demo-milestone-amcas', title: 'Submit AMCAS primary', targetDate: date(500), detail: '', completed: false, order: 1 },
  ]
  data.quarterlyGoals = [
    { id: 'demo-goal-1', quarter: 'Current term', text: 'Protect a 3.8+ GPA while building a repeatable active-recall system', done: false, kind: 'measured', standingTarget: 'gpaTarget', order: 0 },
    { id: 'demo-goal-2', quarter: 'Current term', text: 'Reach 150 clinical hours without sacrificing reflection quality', done: false, kind: 'measured', standingTarget: 'clinical', order: 1 },
  ]
  data.captures = []

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
