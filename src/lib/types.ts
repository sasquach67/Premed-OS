/* ============================================================
   types.ts — the full Premed OS data model.
   One root AppData object is persisted to localStorage and
   (optionally) mirrored to Google Drive.
   ============================================================ */

export type ID = string

export interface EntitySource {
  type: 'manual' | 'import' | 'sync'
  provider?: string
  externalId?: string
}

/** Additive launch envelope for legacy collection rows. */
export interface LegacyEntityEnvelope {
  ownerId?: ID
  createdAt?: number
  updatedAt?: number
  archived?: boolean
  deletedAt?: number
}

export type CollectionRecord<T> = T & LegacyEntityEnvelope

/** Target envelope for canonical records introduced after the local-first baseline. */
export interface EntityEnvelope {
  id: ID
  createdAt: number
  updatedAt: number
  archived: boolean
  ownerId?: ID
  deletedAt?: number
  source?: EntitySource
  /** Retained for compatibility with the store's generic ordered collection CRUD. */
  order: number
}

export interface Person extends EntityEnvelope {
  name: string
  email?: string
  phone?: string
  role?: string
  title?: string
  organizationId?: ID
  tags?: string[]
  notes?: string
}

export type OrganizationType = 'hospital' | 'clinic' | 'lab' | 'nonprofit' | 'club' | 'school' | 'other'

/** Canonical shared organization; intentionally distinct from the EC-specific Org record. */
export interface Organization extends EntityEnvelope {
  name: string
  type?: OrganizationType
  location?: string
  website?: string
  notes?: string
}

/** Letter grades on the AMCAS 4.0 scale (no +/- on AMCAS, but we keep them
 *  for display; the engine maps each to a 4.0 quality-point value). */
export type LetterGrade =
  | 'A+' | 'A' | 'A-'
  | 'B+' | 'B' | 'B-'
  | 'C+' | 'C' | 'C-'
  | 'D+' | 'D' | 'D-'
  | 'F' | 'P' | 'NP' | 'IP' | ''

export type CourseStatus = 'planned' | 'in-progress' | 'completed'

/** A single course — drives both the GPA engine and the degree planner. */
export interface Course {
  id: ID
  term: string            // e.g. "Fall 2026"
  code: string            // e.g. "CHEM 241"
  title: string
  credits: number
  grade: LetterGrade
  /** AMCAS BCPM (Biology/Chem/Physics/Math) = science GPA bucket. */
  bcpm: boolean
  status: CourseStatus
  /** taken in-residence at college (vs AP/transfer) — matters for med prereqs */
  inResidence: boolean
  /** requirement tags this course satisfies, e.g. ["Major: Additional Req", "Med prereq"] */
  satisfies: string[]
  /** med-school prerequisite this course covers, if any */
  prereqOf?: string
  notes?: string
  order: number
}

/** Degree-requirement checklist item (UNC Tar Heel Tracker). */
export type RequirementSourceType = 'official' | 'planner-inspired' | 'user-note' | 'premed-advice'
export type RequirementVerificationStatus = 'verified' | 'needs-verification'

export interface RequirementItem {
  id: ID
  group: string           // "Major: Additional Requirements", "First-Year Foundations", "Med Prerequisites"...
  label: string           // "BIOL 220 Molecular Genetics"
  note?: string
  /** course code(s) that satisfy this requirement */
  satisfiedBy?: string[]
  done: boolean
  sourceType?: RequirementSourceType
  sourceLabel?: string
  sourceUrl?: string
  lastVerified?: string
  verificationStatus?: RequirementVerificationStatus
  order: number
}

export type ExperienceCategory =
  | 'clinical' | 'volunteering' | 'shadowing' | 'research' | 'leadership'

/** Generic logged experience row — the detailed TABLE behind every hours pillar. */
export interface ExperienceEntry {
  id: ID
  category: ExperienceCategory
  org: string             // who/where — site, lab, org
  organizationId?: ID     // canonical Organization link; org remains the display fallback
  role: string
  startDate?: string      // ISO date
  endDate?: string
  /** @deprecated v15 migrates this aggregate into an estimated child block.
   * Kept temporarily while the Experience pillar editor is migrated. */
  hours?: number
  description: string
  /** AMCAS "Most Meaningful" reflection (per-activity click-in). */
  mostMeaningful?: string
  supervisor?: string     // verification-ready contact
  supervisorId?: ID       // canonical Person link; supervisor remains the display fallback
  contact?: string
  status: 'active' | 'completed' | 'planned'
  fileUrl?: string        // Drive link
  tags: string[]
  order: number
}

/** A dated, attributable unit of time under one enduring experience position. */
export interface ExperienceHourEntry extends EntityEnvelope {
  experienceId: ID
  hours: number
  kind: 'logged' | 'estimated'
  /** Required for measured logs; deliberately absent for undated estimates. */
  date?: string
  /** Retained source bounds only — never synthesized into dated logs. */
  periodStart?: string
  periodEnd?: string
  note?: string
}

export type AcademicTagColor =
  | 'gray' | 'brown' | 'orange' | 'yellow' | 'green'
  | 'blue' | 'purple' | 'pink' | 'red'

export interface AcademicCourseOption {
  id: ID
  name: string
  title?: string
  color: AcademicTagColor
  icon?: string
  archived?: boolean
}

export interface AcademicTypeOption {
  id: ID
  name: string
  color: AcademicTagColor
  archived?: boolean
}

export type ClassStatus = 'active' | 'archived'
/** A class workspace changes its study layer, never the course's academic data. */
export type ClassWorkspaceType = 'stem' | 'writing' | 'general'
export type TopicStatus = 'not-started' | 'seen' | 'notes-made' | 'reviewing' | 'weak' | 'ready'
export type LegacyTopicStatus = TopicStatus | 'cards-made' | 'mastered'
export type TopicConfidence = 1 | 2 | 3
export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'
export type ClassNoteType = 'lecture' | 'reading' | 'lab' | 'study-guide' | 'exam-review' | 'question-log' | 'other'
/** Which of the two note surfaces a note belongs to. Both surfaces share the
 *  ClassNote entity, so the distinction has to live in the model rather than
 *  in whichever screen happened to create the row:
 *    `about-class`    — exam intel, questions, priming, lecture capture
 *    `on-material`    — notes written against a specific `Mine` file
 *  Derivable defaults are applied by the v8 migration, never re-inferred. */
export type ClassNoteKind = 'about-class' | 'on-material'
export type ClassNoteSyncStatus = 'local-only' | 'sync-ready' | 'synced' | 'error'
export type ClassAssignmentType = 'homework' | 'quiz' | 'exam' | 'project' | 'reading' | 'lab' | 'discussion' | 'other'
export type ClassAssignmentStatus = 'not-started' | 'in-progress' | 'submitted' | 'graded' | 'dropped'
export type ClassFileType = 'syllabus' | 'lecture-slides' | 'reading' | 'study-guide' | 'rubric' | 'past-exam' | 'lab-handout' | 'link' | 'other'
export type ClassContactRole = 'professor' | 'TA' | 'advisor' | 'study-partner' | 'tutor' | 'peer' | 'other'
export type WeakAreaSource = 'manual' | 'flashcard' | 'quiz' | 'exam' | 'practice' | 'practice-exam' | 'assignment' | 'ai' | 'other'
export type WeakAreaReason = 'conceptual' | 'memorization' | 'careless' | 'misread' | 'timing' | 'application' | 'other'
export type WeakAreaStatus = 'active' | 'improving' | 'resolved'
export type PracticeExamDifficulty = 'easy' | 'medium' | 'hard' | 'mixed'
export type PracticeQuestionType = 'multiple-choice' | 'short-answer' | 'free-response'
export type PracticeExamStatus = 'draft' | 'in-progress' | 'submitted' | 'reviewed'

/** Operational extension for one canonical Course. It exists only for the
 * profile's current term and never repeats course code/title/term. */
export interface ClassWorkspace {
  id: ID
  courseId: ID
  nickname?: string
  instructor?: string
  meetingDays?: string
  meetingTime?: string
  location?: string
  color: AcademicTagColor
  icon: string
  /** Controls the class hub's study layer only. Course/GPA data stay type-blind. */
  type: ClassWorkspaceType
  background?: string
  status: ClassStatus
  currentTopicId?: ID
  syllabusUrl?: string
  canvasUrl?: string
  driveFolderUrl?: string
  goodNotesUrl?: string
  ankiDeckName?: string
  notesDocUrl?: string
  createdAt: number
  updatedAt: number
  order: number
}

export type PaperDraftStage = 'outline' | 'draft' | 'revision' | 'submitted'
export type AssignedReadingStatus = 'not-started' | 'skimmed' | 'read'

/** Writing-only workspace records. They remain intact when a class changes type. */
export interface PaperDraft {
  id: ID
  courseId: ID
  assignmentId?: ID
  title: string
  stage: PaperDraftStage
  selfDeadline?: string
  completedAt?: number
  fileUrl?: string
  createdAt: number
  updatedAt: number
  order: number
}

export interface AssignedReading {
  id: ID
  courseId: ID
  week: string
  title: string
  source?: string
  status: AssignedReadingStatus
  dueForDiscussion?: string
  createdAt: number
  updatedAt: number
  order: number
}

export interface FeedbackNote {
  id: ID
  courseId: ID
  assignmentId?: ID
  theme: string
  quote?: string
  createdAt: number
  updatedAt: number
  order: number
}

/** JSON-safe subset of a ts-fsrs Card. Dates are epoch milliseconds so the
 * localStorage representation is stable across hydration and backup restore. */
export interface TopicFsrsState {
  due: number
  stability: number
  difficulty: number
  elapsedDays: number
  scheduledDays: number
  learningSteps: number
  reps: number
  lapses: number
  state: number
  lastReview?: number
}

export interface Topic {
  id: ID
  courseId: ID
  title: string
  unit?: string
  status: TopicStatus
  fsrs: TopicFsrsState
  /** Legacy confidence is retained losslessly until the review-session chunk
   * replaces it with a confidence-before-reveal self-record. */
  confidence: TopicConfidence
  sourceNoteIds: ID[]
  linkedNoteIds?: ID[]
  linkedAssignmentIds?: ID[]
  linkedFileIds?: ID[]
  createdAt?: number
  updatedAt?: number
  order: number
}

/** Append-only review history. D5 records these events; D2 defines the
 * durable shape now so early review activity is never lost. */
export interface ReviewEvent {
  id: ID
  topicId: ID
  timestamp: number
  grade: ReviewGrade
  confidence: TopicConfidence
  order: number
}

export interface ClassNote {
  id: ID
  courseId: ID
  title: string
  type: ClassNoteType
  /** Structural surface discriminator — see ClassNoteKind. */
  kind: ClassNoteKind
  date?: string
  unit?: string
  topicIds: ID[]
  content: string
  externalDocUrl?: string
  googleDocId?: string
  syncStatus: ClassNoteSyncStatus
  linkedFileIds: ID[]
  createdAt: number
  updatedAt: number
  order: number
}

export interface ClassAssignment {
  id: ID
  courseId: ID
  title: string
  type: ClassAssignmentType
  /** The app's single prioritization flag. Absence is equivalent to false. */
  important?: boolean
  dueDate?: string
  status: ClassAssignmentStatus
  category?: string
  pointsEarned?: number
  pointsPossible?: number
  /** Percentage of the final course grade represented by this assignment. */
  weight?: number
  linkedTopicIds: ID[]
  linkedFileIds: ID[]
  notes?: string
  coveredTopicIds?: ID[]
  /** When graded work came back. Absent means unknown — never inferred. */
  returnedAt?: string
  /** The instructor's dispute deadline. Absent is `unknown`, never `expired`. */
  regradeDeadline?: string
  studyPlan?: string
  reflection?: string
  createdAt: number
  updatedAt: number
  order: number
}

export type AcademicFileSourceType = 'upload' | 'link' | 'embed'
/** Materials ownership. Structural, never inferred from file type at read time. */
export type AcademicFileOwner = 'course' | 'mine' | 'generated'

export interface AcademicFile {
  id: ID
  courseId: ID
  topicId?: ID
  sourceType: AcademicFileSourceType
  title: string
  type: ClassFileType
  url?: string
  blobRef?: string
  fileName?: string
  mimeType?: string
  notes?: string
  linkedTopicIds: ID[]
  /** Where the material came from, structurally rather than inferred:
   *  `course` — handed out by the class · `mine` — the student's own work ·
   *  `generated` — produced by the app. Backfilled by the v8 migration. */
  owner: AcademicFileOwner
  processingStatus?: 'pending' | 'ready' | 'failed'
  processingError?: string
  createdAt: number
  updatedAt: number
  order: number
}

export interface ClassContact {
  id: ID
  courseId: ID
  name: string
  role: ClassContactRole
  email?: string
  officeHours?: string
  location?: string
  nickname?: string
  notes?: string
  lastContactedAt?: number
  followUpTaskId?: ID
  personId?: ID
  createdAt: number
  updatedAt: number
  order: number
}

export interface ClassWeakArea {
  id: ID
  courseId: ID
  topicId?: ID
  label: string
  source: WeakAreaSource
  reason: WeakAreaReason
  severity: TopicConfidence
  notes?: string
  relatedNoteId?: ID
  relatedAssignmentId?: ID
  relatedPracticeQuestionId?: ID
  createdAt: number
  lastPracticedAt?: number
  status: WeakAreaStatus
  order: number
}

export interface PracticeExam {
  id: ID
  courseId: ID
  title: string
  topicIds: ID[]
  sourceNoteIds: ID[]
  sourceFileIds: ID[]
  difficulty: PracticeExamDifficulty
  questionCount: number
  questionTypes: PracticeQuestionType[]
  status: PracticeExamStatus
  score?: number
  totalAutoGradable?: number
  startedAt?: number
  submittedAt?: number
  createdAt: number
  updatedAt: number
}

export interface PracticeQuestion {
  id: ID
  examId: ID
  courseId: ID
  topicIds: ID[]
  type: PracticeQuestionType
  prompt: string
  choices?: string[]
  correctAnswer?: string
  explanation?: string
  userAnswer?: string
  isCorrect?: boolean
  flagged?: boolean
  selfGrade?: 'correct' | 'partial' | 'missed'
  weakReason?: WeakAreaReason
  order: number
  createdAt: number
  updatedAt: number
}

export interface KeyPoint {
  id: ID
  topicId: ID
  text: string
  sourceChunkIds: ID[]
  timesSurfaced: number
  lastSurfaced?: number
  createdAt: number
  updatedAt: number
  order: number
}

export type ChunkAssignmentMethod = 'manual' | 'semantic' | 'positional' | 'document-topic' | 'pending'

export interface SourceChunk {
  id: ID
  fileId: ID
  courseId: ID
  topicId?: ID
  content: string
  embedding?: number[]
  /** Character range within this stored chunk. A whole-chunk range is exact;
   * callers must never invent a narrower citation from string similarity. */
  characterStart?: number
  characterEnd?: number
  sourcePosition?: {
    index: number
    label?: string
    lectureNumber?: number
  }
  assignmentMethod?: ChunkAssignmentMethod
  assignmentConfirmed?: boolean
  coveredByKeyPoint: boolean
  createdAt: number
  updatedAt: number
  order: number
}

export type AcademicMigrationReviewKind =
  | 'workspace-unmatched'
  | 'workspace-conflict'
  | 'current-term-confirmation'
  | 'contact-conflict'

export type AcademicMigrationJournalKind =
  | AcademicMigrationReviewKind
  | 'workspace-linked'
  | 'workspace-course-created'
  | 'workspace-dropped-noncurrent'
  | 'workspace-auto-created'

export interface AcademicMigrationJournalEntry {
  id: ID
  kind: AcademicMigrationJournalKind
  status: 'pending' | 'resolved'
  reason: string
  legacyWorkspaceId?: ID
  legacyWorkspace?: Record<string, unknown>
  legacyContactId?: ID
  legacyContact?: Record<string, unknown>
  relatedLegacyRecords?: Record<string, unknown[]>
  courseId?: ID
  candidateCourseIds?: ID[]
  candidatePersonIds?: ID[]
  inferredTerm?: string
  createdAt: number
  resolvedAt?: number
}

/** A temporary, class-owned plan for one dated exam. It assembles existing
 * class records; it deliberately stores no score or forecast. */
export type ExamPrepIntensity = 'accelerated' | 'steady'
export type ExamPrepItemOwner = 'topic' | 'assignment' | 'file' | 'manual'
export type ExamPrepItemState = 'planned' | 'complete' | 'missed'

export interface ExamPrepPlanItem {
  id: ID
  owner: ExamPrepItemOwner
  topicId?: ID
  assignmentId?: ID
  fileId?: ID
  /** Required only when the student adds work that has no existing owner. */
  manualLabel?: string
  plannedDate: string
  order: number
  state: ExamPrepItemState
  completedAt?: number
  missedAt?: number
  createdAt: number
  updatedAt: number
}

export interface ExamPrepPlan {
  id: ID
  courseId: ID
  examAssignmentId: ID
  intensity: ExamPrepIntensity
  items: ExamPrepPlanItem[]
  /** Student-entered factual closeout; never a predicted or computed result. */
  returnedGrade?: string
  feedback?: string
  closedAt?: number
  createdAt: number
  updatedAt: number
}

export interface ClassCenterData {
  workspaces: ClassWorkspace[]
  topics: Topic[]
  notes: ClassNote[]
  assignments: ClassAssignment[]
  files: AcademicFile[]
  keyPoints: KeyPoint[]
  sourceChunks: SourceChunk[]
  reviewEvents: ReviewEvent[]
  contacts: ClassContact[]
  weakAreas: ClassWeakArea[]
  practiceExams: PracticeExam[]
  practiceQuestions: PracticeQuestion[]
  paperDrafts: PaperDraft[]
  assignedReadings: AssignedReading[]
  feedbackNotes: FeedbackNote[]
  gradeCategories: GradeCategory[]
  mistakes: AcademicMistake[]
  examPrepPlans: ExamPrepPlan[]
}

/** Parsed or student-entered syllabus category. This intentionally has no grade math. */
export interface GradeCategory {
  id: ID
  courseId: ID
  name: string
  weight: number
  policyNote?: string
  source?: string
  /** Grade policy, tri-state THROUGH OPTIONALITY. `undefined` means the course
   *  policy was never recorded; `false`/`0` means it was recorded as not
   *  applying. Those are different facts and the policy view renders them
   *  differently — collapsing them is how a projection starts lying. */
  dropLowestCount?: number
  replacementRule?: boolean
  curvePublished?: boolean
  createdAt: number
  updatedAt: number
  order: number
}

/** How a student explained their own error. Never inferred, never predicted. */
export type AcademicMistakeCause = 'blanked' | 'didnt-know'

/**
 * One mistake the student chose to mark while reviewing returned work. `cause`
 * is deliberately optional: an unclassified mistake is a first-class state
 * ("needs a mark"), not a defect to be filled in automatically.
 */
export interface AcademicMistake {
  id: ID
  courseId: ID
  assignmentId?: ID
  topicId?: ID
  label: string
  cause?: AcademicMistakeCause
  note?: string
  createdAt: number
  updatedAt: number
  order: number
}

export interface AcademicTagSettings {
  courseOptions: AcademicCourseOption[]
  assignmentTypeOptions: AcademicTypeOption[]
  classCenter: ClassCenterData
  migrationJournal: AcademicMigrationJournalEntry[]
}

export type TaskType = string

export type TaskProgress = 'Not started' | 'Working on' | 'Finished'
export type KanbanColumn = 'todo' | 'doing' | 'done'
export type TaskHorizon = 'now' | 'soon'

/** Timeline / assignment / task item — feeds the calendar + kanban + home alerts. */
export interface TaskItem {
  id: ID
  title: string
  courseId?: ID
  course?: string
  typeId?: ID
  type: TaskType
  deadline?: string       // ISO date
  progress: TaskProgress
  kanban: KanbanColumn
  notes?: string
  fileUrl?: string
  /** finished items auto-leave the active assignment table */
  archived: boolean
  /** @deprecated Legacy migration marker. Timeline milestones live in
   * `timelineMilestones`; new task flows must never set this. */
  milestone?: boolean
  /** Lossless link retained when a legacy milestone task becomes a Timeline node. */
  timelineMilestoneId?: ID
  /** Overview planning horizon. Done remains derived from progress. */
  horizon?: TaskHorizon
  /** The single Overview prioritization concept. */
  important?: boolean
  order: number
}

/** Timeline owns four-year roadmap nodes. These are not tasks or deadlines. */
export interface TimelineMilestone {
  id: ID
  title: string
  /** A student-set or migrated pacing date; absent means no date was supplied. */
  targetDate?: string
  detail?: string
  completed: boolean
  /** Retains the legacy record relationship without making Task canonical. */
  legacyTaskId?: ID
  /** One optional Overview-owned implementation task. This is deliberately
   * distinct from a Timeline-authored step and survives that task's lifecycle. */
  implementationTaskId?: ID
  order: number
}

export type LetterStatus = 'identified' | 'asked' | 'agreed' | 'submitted' | 'declined'

export interface LetterEntry {
  id: ID
  /** Retained verbatim even after linking — the migration is lossless. */
  recommender: string
  recommenderId?: ID
  /** Set when the recommender string matched more than one Person. The link is
   *  deliberately left unmade so the user resolves it — never a silent merge. */
  recommenderCandidateIds?: ID[]
  role: string            // "Gen Chem professor", "Research PI"
  relationship: string
  type: string            // "Science faculty", "Committee", "Other"
  status: LetterStatus
  dateAsked?: string
  dueDate?: string
  notes?: string
  order: number
}

/** Story Bank entry — pre-seeded with reflection prompts. */
export interface StoryEntry {
  id: ID
  prompt: string          // the guiding reflection prompt
  title: string
  /** the reflection / personal commentary */
  commentary: string
  tags: string[]
  relatedExperienceId?: ID
  /** optional link to a full Google Doc the user writes in */
  docUrl?: string
  /** A URL captured from Overview, retained as structured source metadata. */
  sourceUrl?: string
  /** Student-supplied binary retained only on this device in IndexedDB. */
  attachment?: StoryAttachment
  /** Overview brain-dump captures have no required prompt, title, or tags. */
  capturedAt?: number
  updatedAt?: number
  origin?: 'overview'
  /** Per-entry privacy guard: excluded from every remote sync and backup. */
  localOnly?: boolean
  order: number
}

/** Metadata is durable; the bytes stay in device-local IndexedDB. */
export interface StoryAttachment {
  blobRef: string
  fileName: string
  mimeType: string
  fileSize: number
  storage: 'device-local'
}

export interface SecondaryEntry {
  id: ID
  school: string
  prompt: string
  wordLimit?: number
  status: 'not started' | 'drafting' | 'submitted'
  docUrl?: string
  notes?: string
  order: number
}

export interface InterviewQA {
  id: ID
  question: string
  answer: string
  category: string        // "Why medicine", "Behavioral", "Ethical", "School-specific"
  order: number
}

export interface McatAttempt {
  id: ID
  date?: string
  total?: number          // 472–528
  cp?: number             // Chem/Phys
  cars?: number
  bb?: number             // Bio/Biochem
  ps?: number             // Psych/Soc
  kind: 'official' | 'aamc-fl' | 'practice'
  source?: string         // "AAMC FL1", "UWorld", ...
  notes?: string
  order: number
}

export interface McatErrorLog {
  id: ID
  date?: string
  section: string
  topic: string
  whyMissed: string
  fix: string
  source?: string       // where it came from (AAMC FL2, UWorld, …)
  resolved: boolean
  order: number
}

export interface McatScheduleItem {
  id: ID
  phase: string           // "Content Review", "Practice", "Full Lengths"
  week?: string
  focus: string
  resource?: string
  done: boolean
  order: number
}

export interface McatState {
  targetDate?: string
  goalScore?: number
  baselineScore?: number
  weeklyStudyHours?: number
  preferredSessionLength?: number
  currentPhase?: string
  planIntensity?: 'light' | 'balanced' | 'aggressive'
  focusSection?: string
  attempts: McatAttempt[]
  errorLog: McatErrorLog[]
  schedule: McatScheduleItem[]
}

export type SchoolStatus =
  | 'researching' | 'will-apply' | 'applied' | 'secondary' | 'interview' | 'accepted' | 'waitlist'

export interface SchoolEntry {
  id: ID
  name: string
  location?: string
  state?: string
  type: 'MD' | 'DO' | 'Other'
  category: 'reach' | 'target' | 'safety' | 'undecided'
  status: SchoolStatus
  msarUrl?: string
  medianGpa?: number
  medianMcat?: number
  mission?: string
  secondaryStatus?: 'not started' | 'received' | 'submitted'
  notes?: string
  /** Student-authored rationale; never generated or inferred. */
  whyItIsOnMyList?: string
  /** A dropped school remains a retrievable decision record. */
  archivedAt?: string
  order: number
}

/** Category-organized, clickable resource link (per pillar). */
export interface ResourceLink {
  id: ID
  pillar: string          // route id: "mcat", "clinical", ...
  category: string        // "Anki", "Practice Exams", "Content Review", "Official UNC"...
  label: string
  url: string
  note?: string
  official?: boolean
  order: number
}

/** Mascot tip pool — the ram serves one per day, deterministic by date. */
export interface TipEntry {
  id: ID
  text: string
  source?: string
  tag?: 'official' | 'community' | 'andy'
  pillar?: string         // optional: scope a tip to a pillar
}

export interface FocusTarget {
  id: ID
  text: string
  minutes?: number
  done: boolean
  order: number
}

export interface QuarterlyGoal {
  id: ID
  quarter: string
  text: string
  done: boolean
  /** Student-confirmed presentation: never inferred from the goal wording. */
  kind: 'check-off' | 'measured'
  /** Optional link to the long-horizon target stored in `goals`. */
  standingTarget?: keyof Goals
  order: number
}

export type CaptureKind = 'idea' | 'source'

/** Local-first inbox item. Atlas may consume these later, but Home owns capture only. */
export interface CaptureRecord {
  id: ID
  kind: CaptureKind
  content: string
  url?: string
  fileName?: string
  mimeType?: string
  fileSize?: number
  createdAt: number
  updatedAt: number
  triagedAt?: number
  origin: 'overview'
  order: number
}

export interface AdvisingQuestion {
  id: ID
  question: string
  answered: boolean
  answer?: string
  order: number
}

/** A note "page" in the mini notes database (opens in a side-peek). */
export interface NotePage {
  id: ID
  title: string
  body: string
  tag?: string
  pillar?: string         // which pillar's notes this belongs to (e.g. 'academics')
  orgId?: ID              // optional organization link for extracurricular initiatives
  updatedAt: number
  order: number
}

/** An extracurricular organization (club / sport / org) — NOT an hour log. */
export interface OrgReflection {
  id: ID
  date: string
  title: string
  body: string
  hours?: number
  storyBank?: boolean
}

export interface OrgPosition {
  id: ID
  role: string
  startDate?: string
  endDate?: string
  note?: string
}

export interface OrgAccomplishment {
  id: ID
  value?: string
  title: string
  detail?: string
}

export interface Org {
  id: ID
  name: string
  type: string            // Club, Sport, Greek life, Volunteer org, Professional, Cultural...
  role: string            // Member, Officer, President, Captain...
  status: 'interested' | 'member' | 'leader' | 'inactive'
  /** @deprecated Legacy single reflection; migrated into reflections[]. */
  reflection?: string
  reflections: OrgReflection[]
  joinedAt?: string       // ISO month, e.g. 2026-08
  nextGoal?: string
  opportunities: string   // events, positions, things to pursue
  meetingInfo: string     // calendar / events / when-where
  link: string
  order: number
  totalHours?: number
  avgHoursWeekly?: number
  memberCount?: number
  eventsWorked?: number
  verifierName?: string
  verifierId?: ID
  verifierRole?: string
  verifierEmail?: string
  verifierPhone?: string
  positionHistory?: OrgPosition[]
  accomplishments?: OrgAccomplishment[]
}

export interface Profile {
  name: string
  email?: string
  school: string
  major: string
  track: string           // "Pre-Med"
  classYear: string       // "Class of 2030"
  startTerm: string       // "Fall 2026"
  matriculationTarget: string // "Fall 2030"
  applicationCycle: string    // "2029 cycle"
  resumeDocUrl?: string   // embedded Google Doc CV
  avatarDataUrl?: string  // profile photo stored locally (data URL)
}

export interface Goals {
  clinical: number
  volunteering: number
  shadowing: number
  research: number
  activities: number
  mcatTarget: number
  gpaTarget: number
}

export interface BackupMeta {
  enabled: boolean
  googleClientId: string
  lastBackupAt?: number   // epoch ms
  driveFileId?: string
  lastError?: string
}

export interface NormalizedScheduleEvent {
  id: ID
  title: string
  start: string
  end?: string
  allDay?: boolean
  location?: string
  meetingUrl?: string
  calendarId?: string
  color?: string
  status?: 'confirmed' | 'tentative' | 'cancelled'
}

export interface CalendarSettings {
  enabled: boolean
  googleClientId: string
  googleApiKey: string
  connectedAccount?: string
  lastSyncedAt?: number
  lastError?: string
  cachedEvents: NormalizedScheduleEvent[]
  timelineStart: string
  timelineEnd: string
  timeFormat: '12h' | '24h'
  showLocations: boolean
  showAllDayEvents: boolean
  useMockPreview: boolean
}

export type ListDensity = 'comfortable' | 'compact'

export interface ListViewState {
  filters: Record<string, string | string[] | boolean>
  sort?: { key: string; direction: 'asc' | 'desc' }
  groupBy?: string
  visibleColumns: string[]
  density: ListDensity
  dateRange?: { start?: string; end?: string }
  view?: string
}

export interface SavedListView {
  id: ID
  listId: string
  name: string
  ownerId?: ID
  createdAt: number
  updatedAt: number
  state: ListViewState
}

export interface Settings {
  theme: 'light' | 'dark' | 'system'
  visualTheme: 'ghibli' | 'doraemon'
  backup: BackupMeta
  calendar: CalendarSettings
  quotesApi: boolean      // pull daily quote live vs local bank
  sidebarCollapsed: boolean
  studentBannerDismissed: boolean
  dismissedAlertKey: string
  northStarExpanded: boolean
  overviewTaskMode: 'today' | 'all'
  academicsMode: 'daily' | 'planning'
  listPreferences: Record<string, ListViewState>
  savedViews: Record<string, SavedListView[]>
  activeSavedViewIds: Record<string, ID | undefined>
  attentionSnoozedUntil: Record<string, number>
  /** Per-instance recommendation lifecycle — an accepted or dismissed
   *  recommendation never returns. Keyed by `${ruleId}:${entityId}`. */
  recommendationState: Record<string, RecommendationRecord>
  /** Rules retired permanently after three dismissals (alert-fatigue guard).
   *  Never applied to blocking items. The legacy field name is retained so
   *  existing local-first records do not need a destructive migration. */
  mutedRecommendationRules: Record<string, MutedRuleRecord>
  /** Per-line pacing dismissal; false/absent means the projection may render. */
  projectionDismissals: Record<string, boolean>
  /** Persisted one-time MascotNote dismissals, keyed by stable concept id. */
  mascotNoteDismissals: Record<string, number>
  /** The one weekly hour pool every plan generator claims against. */
  weeklyCapacity: WeeklyCapacity
}

/** A stretch where the usual weekly shape does not hold — finals, a travel
 *  week, a family obligation, a heavier shift rota. `hoursOverride` replaces
 *  the weekday total for every day in the range. */
export interface BusyPeriod {
  id: ID
  label: string
  /** ISO date, inclusive. */
  startDate: string
  /** ISO date, inclusive. */
  endDate: string
  hoursOverride: number
}

/**
 * `WeeklyCapacity` — shell-owned, per `specifications/00-product-shell.md` §11b.
 *
 * The problem it exists to prevent: when MCAT prep overlaps a semester,
 * Academics and MCAT bid for the same evenings. Two independently reasonable
 * plans sum to something impossible, the student fails both, and the app
 * caused it. So capacity lives here, at the shell, and both generators are
 * *consumers* of one pool rather than owners of their own.
 *
 * It is NOT a calendar. It is a weekly shape plus exceptions; calendar reading
 * informs the shape but never replaces it (`01` §6.9).
 *
 * It is NOT a productivity target. The pool describes what a student *has*,
 * not what they *should* use — Premed OS never nudges anyone to fill unclaimed hours.
 */
export interface WeeklyCapacity {
  /** Available study hours per weekday, Sunday-first to match the app's
   *  calendars. Absent/zero is a legitimate answer for a day, not missing data. */
  hoursByWeekday: [number, number, number, number, number, number, number]
  busyPeriods: BusyPeriod[]
  /** Epoch ms. Zero means never captured — generators must ask before
   *  planning rather than assume a default (§11b "check before generating"). */
  updatedAt: number
}

/** Outcome of a single recommendation instance (architecture/02 lifecycle). */
export interface RecommendationRecord {
  status: 'accepted' | 'dismissed'
  at: number              // epoch ms
  /** Optional dismiss-with-reason (general.md → Review queue). */
  reason?: string
}

export interface MutedRuleRecord {
  at: number              // epoch ms
}

export interface ActivityEvent {
  id: ID
  at: number              // epoch ms
  pillar: string
  label: string
}

export interface TrashRecord {
  id: ID
  collection: CollectionKey
  deletedAt: number
  record: Record<string, unknown> & { id: ID; deletedAt: number }
}

export interface RecoveryEntry {
  id: ID
  at: number
  label: string
  collection: CollectionKey
  before: Array<Record<string, unknown> & { id: ID }>
  after: Array<Record<string, unknown> & { id: ID }>
}

export interface Meta {
  recentRoutes: string[]
  activity: ActivityEvent[]
  lastOpenedAt: number
  seedVersion: number
  recoveryStack: RecoveryEntry[]
}

/** The single persisted root object. */
export interface AppData {
  profile: Profile
  goals: Goals
  courses: CollectionRecord<Course>[]
  academics: AcademicTagSettings
  requirements: CollectionRecord<RequirementItem>[]
  experiences: CollectionRecord<ExperienceEntry>[]
  experienceHourEntries: CollectionRecord<ExperienceHourEntry>[]
  persons: CollectionRecord<Person>[]
  organizations: CollectionRecord<Organization>[]
  tasks: CollectionRecord<TaskItem>[]
  timelineMilestones: CollectionRecord<TimelineMilestone>[]
  letters: CollectionRecord<LetterEntry>[]
  stories: CollectionRecord<StoryEntry>[]
  secondaries: CollectionRecord<SecondaryEntry>[]
  interviewQs: CollectionRecord<InterviewQA>[]
  mcat: McatState
  schools: CollectionRecord<SchoolEntry>[]
  resources: CollectionRecord<ResourceLink>[]
  tips: CollectionRecord<TipEntry>[]
  focusTargets: CollectionRecord<FocusTarget>[]
  quarterlyGoals: CollectionRecord<QuarterlyGoal>[]
  captures: CollectionRecord<CaptureRecord>[]
  advisingQs: CollectionRecord<AdvisingQuestion>[]
  notePages: CollectionRecord<NotePage>[]
  orgs: CollectionRecord<Org>[]
  trash: TrashRecord[]
  notes: Record<string, string>   // free-text scratchpads keyed by id (e.g. "research-drive", "ps-doc")
  settings: Settings
  meta: Meta
}

/** Array-typed collections eligible for generic CRUD. */
export type CollectionKey =
  | 'courses' | 'requirements' | 'experiences' | 'experienceHourEntries' | 'persons' | 'organizations' | 'tasks' | 'timelineMilestones' | 'letters'
  | 'stories' | 'secondaries' | 'interviewQs' | 'schools' | 'resources'
  | 'tips' | 'focusTargets' | 'quarterlyGoals' | 'advisingQs'
  | 'captures' | 'notePages' | 'orgs'
