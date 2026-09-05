import type { StudyGuideArtifact } from '@/lib/generation/schemas/studyGuide.v1'

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

/** How a course appears on a student-held transcript or transfer record.
 * This deliberately describes the record; it does not make an equivalency,
 * BCPM, enrolment, or degree-completion claim. */
export type TranscriptCourseType =
  | 'regular'
  | 'ap'
  | 'ib'
  | 'transfer'
  | 'dual-enrollment'
  | 'repeat'
  | 'withdrawal'
  | 'pass-fail'

/** Exact, student-entered transcript context attached to one operational course.
 * The normal Course fields remain useful for local planning; this nested record
 * preserves what the transcript actually said without normalising it. */
export interface CourseTranscriptContext {
  institution: string
  courseNumber: string
  courseTitle: string
  termLabel: string
  creditHours: number | null
  gradeRecorded: string
  courseType: TranscriptCourseType
  /** Reference only; file bytes must never be placed in localStorage. */
  transcriptLineBlobRef?: string
  capturedAt: number
  updatedAt: number
}

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
  /** When the end-of-term ritual was completed (§4.1 term rollover). */
  rolloverAt?: number
  /** The one term its re-offer was dismissed for. Per-term, never permanent. */
  rolloverDismissedTerm?: string
  /** Stable Planner slot identity. `term` stays the human-readable record. */
  plannerTermId?: ID
  /** Optional exact transcript context, entered only by the student. */
  transcript?: CourseTranscriptContext
  order: number
}

/** A student-owned planning slot, never a registrar or enrollment record. */
export interface PlannerTerm {
  id: ID
  label: string
  kind: 'standard' | 'summer' | 'gap'
  /** A migrated label is a convenience record, not a claimed university fact. */
  origin: 'legacy-derived' | 'student-created'
  note?: string
  lockedAt?: number
  lockReason?: string
  createdAt: number
  updatedAt: number
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
  | 'gray' | 'brown' | 'orange' | 'coral' | 'yellow' | 'lime' | 'green' | 'mint'
  | 'teal' | 'cyan' | 'sky' | 'blue' | 'navy' | 'indigo' | 'purple' | 'plum' | 'pink' | 'red'

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
export type TopicBasis = 'syllabus-standard' | 'manual' | 'legacy-schedule'
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
export type ClassFileType = 'syllabus' | 'lecture-slides' | 'reading' | 'study-guide' | 'rubric' | 'past-exam' | 'lab-handout' | 'transcript' | 'link' | 'other'
export type ClassContactRole = 'professor' | 'TA' | 'advisor' | 'study-partner' | 'tutor' | 'peer' | 'other'
export type WeakAreaSource = 'manual' | 'flashcard' | 'quiz' | 'exam' | 'practice' | 'practice-exam' | 'assignment' | 'ai' | 'other'
export type WeakAreaReason = 'conceptual' | 'memorization' | 'careless' | 'misread' | 'timing' | 'application' | 'other'
export type WeakAreaStatus = 'active' | 'improving' | 'resolved'
export type PracticeExamDifficulty = 'easy' | 'medium' | 'hard' | 'mixed'
export type PracticeQuestionType = 'multiple-choice' | 'short-answer' | 'free-response'
export type PracticeExamStatus = 'draft' | 'in-progress' | 'submitted' | 'reviewed'

/**
 * A student-reviewed, course-specific analytical frame. This is deliberately
 * not inferred from a course title or treated as background knowledge: it has
 * to name the course evidence that supports it before generation can use it.
 */
export interface CourseLens {
  text: string
  sourceFileIds: ID[]
  sourceChunkIds: ID[]
  updatedAt: number
}

/** Syllabus-derived chronological context. It never creates a Topic; only
 * explicit syllabus learning standards do that. */
export interface SyllabusScheduleEntry {
  id: ID
  week: string
  label: string
  startDate?: string
  source?: string
  order: number
}

/** Operational extension for one canonical Course. It exists only for the
 * profile's current term and never repeats course code/title/term. */
export interface ClassWorkspace {
  /** Student-owned Overview focus and reading shortcut; absent for older workspaces. */
  studyFocus?: string
  lastOpenedLectureId?: ID
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
  /** Writing-only evidence boundary. Absent in legacy data until v34 hydration. */
  readingListState?: ReadingListState
  /** Optional interpretive context for courses whose materials need a course-specific frame. */
  courseLens?: CourseLens
  syllabusSchedule?: SyllabusScheduleEntry[]
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
/** Whether the student has recorded the whole assigned-reading list, not how
 * much of that list they have finished. Keeping this separate prevents a
 * partial list from becoming a false "behind" claim. */
export type ReadingListState = 'unknown' | 'partial' | 'complete' | 'not-applicable'

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
  /** Stable identity of a confirmed syllabus schedule reading. */
  syllabusSourceKey?: string
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

/** Retire stops scheduling. Carrying preserves the topic's study state exactly. */
export type TopicTermFate = 'retired' | 'mcat' | 'prerequisite'

export interface Topic {
  id: ID
  courseId: ID
  title: string
  unit?: string
  /** Why this record exists. Syllabus standards, not class dates, are the default. */
  basis?: TopicBasis
  /** Stable identity of the confirmed syllabus line that created this row.
   * Student edits may change `title`; re-import must still match the source
   * rather than append a duplicate. */
  syllabusSourceKey?: string
  /** A syllabus schedule date is planning context, never proof of coverage. */
  scheduledFor?: string
  status: TopicStatus
  fsrs: TopicFsrsState
  /** Legacy confidence is retained losslessly until the review-session chunk
   * replaces it with a confidence-before-reveal self-record. */
  confidence: TopicConfidence
  sourceNoteIds: ID[]
  linkedNoteIds?: ID[]
  linkedAssignmentIds?: ID[]
  linkedFileIds?: ID[]
  /** §6.6 Pretest. Its presence marks the priming act as done and nothing
   *  more — there is no score, because getting a pretest wrong is the point. */
  pretestedAt?: number
  /** Where this topic goes after its course ends (§4.1 term rollover).
   *  Absent means undecided, which is what makes the January re-offer
   *  possible. `retired` stops scheduling; it never deletes anything. */
  termFate?: TopicTermFate
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

/** A system reading captured immediately before one recall response is graded.
 * This is deliberately distinct from TopicPrediction, which is a student's
 * pre-lecture expectation and is never graded. */
export type RetrievabilityBand = 'solid' | 'fading' | 'likely-gone'
export type RetrievabilityOutcome = 'recalled' | 'blanked'

export interface RetrievabilityPrediction {
  id: ID
  courseId: ID
  topicId: ID
  /** The review event that resolved this call. Present at creation because a
   * call is persisted atomically with its outcome, after the student grades it. */
  reviewEventId: ID
  predictedAt: number
  predictedBand: RetrievabilityBand
  /** The bounded interval the current model used. It is provenance, not a UI score. */
  predictedRange: '80–100%' | '55–79%' | '0–54%'
  modelVersion: 'fsrs-v1'
  outcome: RetrievabilityOutcome
  resolvedAt: number
  order: number
}

/** Preferences are local, course-agnostic defaults for the one review-session
 * surface. They are intentionally narrow: each field changes real queue,
 * timer, or input behavior rather than decorating a global settings page. */
export interface ReviewSessionPreferences {
  defaultInput: 'microphone' | 'keyboard'
  interleave: boolean
  weakFirst: boolean
  workMinutes: number
  breakMinutes: number
  enforceBreaks: boolean
  sound: boolean
}

/** Focus is deliberately timer-only. Unlike a ReviewEvent it never implies a
 * recall grade, confidence judgment, or FSRS scheduling decision. */
export interface FocusStudySession {
  id: ID
  courseId: ID
  startedAt: number
  completedAt: number
  durationSeconds: number
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
  /** Student-chosen course sequence placement. This is never inferred from today's date. */
  courseWeek?: number
  unit?: string
  topicIds: ID[]
  content: string
  externalDocUrl?: string
  googleDocId?: string
  syncStatus: ClassNoteSyncStatus
  linkedFileIds: ID[]
  /** Guide records retain the exact reviewed evidence that supported them. */
  guideProposalId?: ID
  guideSourceRefs?: GuideSourceReference[]
  createdAt: number
  updatedAt: number
  order: number
}

export interface ClassAssignment {
  id: ID
  courseId: ID
  title: string
  /** Stable identity of the confirmed syllabus line that created this row. */
  syllabusSourceKey?: string
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

/** `paste` is text the student pasted in — a GoodNotes transcript, a reading.
 *  It is never presented as an uploaded file, because its provenance and its
 *  citation precision are genuinely different. */
export type AcademicFileSourceType = 'upload' | 'link' | 'embed' | 'paste' | 'folder-intake'
/** Materials ownership. Structural, never inferred from file type at read time. */
export type AcademicFileOwner = 'course' | 'mine' | 'generated'

export interface AcademicFile {
  id: ID
  /** Transcript evidence may belong to Grades & Archive before (or without)
   * an operational Class Center course. Other academic materials remain
   * class-owned and continue to provide this field. */
  courseId?: ID
  topicId?: ID
  /** Explicit lecture home; absent means class-level material. */
  lectureId?: ID
  /** Student-chosen course sequence placement. Syllabus topic links may supply an explicit week separately. */
  courseWeek?: number
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
  /** Honest, page-aware text coverage. Attachment alone never means a source
   * was understood or used. Figures remain explicitly uninterpreted unless a
   * separate, consented vision path records otherwise. */
  sourceCoverage?: {
    pageCount?: number
    readablePages?: number[]
    ocrRecoveredPages?: number[]
    unreadablePages?: number[]
    readableCharacterCount: number
    figureStatus: 'not-interpreted' | 'not-present-or-unknown' | 'question-bank-reviewed'
  }
  /**
   * A reviewed selected-folder proposal can create a material record before
   * its bytes are attached. This carries only user-visible logical placement
   * metadata — never a machine path, provider token, or filesystem handle.
   */
  folderIntake?: {
    sourceId: ID
    proposalId: ID
    displayPath: string
    category?: 'notes' | 'homework' | 'practice-problems'
    week?: string
    placementState: 'confirmed' | 'confirm-week'
  }
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

/**
 * A course-owned lecture capture. The optional audio reference points at the
 * device-local blob store; binary audio never enters persisted app state.
 */
export type LectureInputPath = 'recorded' | 'uploaded' | 'pasted' | 'materials'
export type LectureProcessingState = 'recording' | 'ready' | 'unavailable' | 'failed'

/** Optional on older lecture records. A journal entry need not represent a lecture. */
export interface JournalStudyIntent {
  purpose: 'study' | 'exam-prep'
  instructions?: string
  reviewSheetFileId?: ID
}

export interface LectureRecord {
  id: ID
  courseId: ID
  title: string
  /** A provider-generated descriptive title, kept separate from chronology. */
  aiTitle?: string
  studyIntent?: JournalStudyIntent
  inputPath: LectureInputPath
  /** Present only for a locally retained recording or audio upload. */
  audioBlobRef?: string
  /** The existing transcript material which owns the source text. */
  transcriptFileId?: ID
  /** The date this class session occurred. It is student-entered, never inferred. */
  occurredOn?: string
  /** Syllabus topics connected when the lecture was saved. */
  topicIds?: ID[]
  processingState: LectureProcessingState
  processingError?: string
  /** A lecture becomes complete only after the student has reviewed the
   * source selection and built its front page. */
  workspaceState?: 'draft' | 'complete'
  selectedSourceFileIds?: ID[]
  lectureBrief?: LectureBrief
  /** The verified AI-generated study front. Legacy/local previews never fill
   * this field, so the UI can distinguish a real generated guide from a
   * sentence-picker fallback. */
  studyGuide?: StudyGuideArtifact
  generationAuditStatus?: 'approved' | 'skipped' | 'unavailable'
  masteryMapId?: ID
  createdAt: number
  processedAt?: number
  updatedAt: number
  order: number
}

export interface LectureBriefTrace {
  id: ID
  text: string
  sourceChunkId: ID
}

export interface LectureBriefVocabulary extends LectureBriefTrace {
  term: string
}

export interface LectureConceptMapNode {
  id: ID
  label: string
  detail: string
  lane: 'flow' | 'evidence'
  sourceChunkIds: ID[]
}

export interface LectureConceptMapEdge {
  id: ID
  fromNodeId: ID
  toNodeId: ID
  label: string
  sourceChunkIds: ID[]
}

/** A student-facing relationship model, not a source directory. Sources stay
 * folded behind the claims so the map remains useful before it is inspected. */
export interface LectureConceptMap {
  title: string
  nodes: LectureConceptMapNode[]
  edges: LectureConceptMapEdge[]
}

/** The lecture-front synthesis is intentionally trace-first. Every displayed
 * claim points to a stored chunk from the student's selected, processed set. */
export interface LectureBrief {
  summary: LectureBriefTrace[]
  connections: LectureBriefTrace[]
  /** Optional for legacy lecture fronts created before v41. */
  conceptMap?: LectureConceptMap
  vocabulary: LectureBriefVocabulary[]
  professorEmphasis: LectureBriefTrace[]
  processesAndComparisons: LectureBriefTrace[]
  misconceptions: LectureBriefTrace[]
  selectedSourceFileIds: ID[]
  usedSourceFileIds: ID[]
  unusedSourceFileIds: ID[]
  createdAt: number
}

/** A source-backed lecture moment. It remains descriptive, never predictive. */
export interface LectureEvidenceFinding {
  id: ID
  courseId: ID
  lectureId: ID
  sourceChunkId: ID
  /** Exact contiguous source text, validated before persistence. */
  quote: string
  /** The transcript's own time label. Timed findings never manufacture one. */
  timestamp: string
  label: string
  detail: string
  createdAt: number
  updatedAt: number
  order: number
}

export type LectureProposalStatus = 'pending' | 'accepted' | 'dismissed'

export type GuideProposalSourceKind = 'syllabus' | 'lecture'
export type GuideSourceRecordKind = 'assignment' | 'grade-category' | 'lecture-finding'

/** One exact, course-owned evidence reference. A missing passage is an honest
 * legacy/partial state and cannot be accepted or used for generation. */
export interface GuideSourceReference {
  courseId: ID
  sourceKind: GuideProposalSourceKind
  sourceId: ID
  sourceRecordKind: GuideSourceRecordKind
  sourceRecordId: ID
  sourceFileId?: ID
  sourceChunkId?: ID
  sourceLabel: string
  sourcePassage: string
  sourceLocation?: string
}

/** Generalized Guide proposal. It never writes a ClassNote until accepted. */
export interface GuideProposal {
  id: ID
  courseId: ID
  source: GuideSourceReference
  draftTitle: string
  draftText: string
  noteType: Extract<ClassNoteType, 'exam-review' | 'question-log' | 'reading' | 'lecture' | 'lab' | 'other'>
  status: LectureProposalStatus
  acceptedNoteId?: ID
  createdAt: number
  updatedAt: number
  order: number
}

/** Material and coverage changes stay proposals until the student confirms. */
export interface LectureMaterialProposal {
  id: ID
  courseId: ID
  lectureId: ID
  findingId: ID
  materialFileId?: ID
  topicId?: ID
  status: LectureProposalStatus
  createdAt: number
  updatedAt: number
  order: number
}

/** A class-note proposal is visible in Notes but never edits a note by itself. */
export interface LectureNoteProposal {
  id: ID
  courseId: ID
  lectureId: ID
  findingId: ID
  status: LectureProposalStatus
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

/** A generated card is a study artifact, never a review/scheduling record. */
export type GeneratedFlashcardType = 'basic' | 'cloze' | 'conceptual' | 'process' | 'comparison' | 'application' | 'exemplar' | 'free-recall'

export interface GeneratedFlashcard {
  id: ID
  type: GeneratedFlashcardType
  front?: string
  back?: string
  cloze?: string
  extra?: string
  tags: string[]
  conceptId: string
  /** One verified material citation; general/background claims are not cards. */
  sourceChunkId: ID
  /** Flashcards V1 metadata. It is generated with the card and retained for
   * deterministic quality checks and source-grounded Materials display. */
  clozePattern?: 'single' | 'independent' | 'enumerated-list' | 'definition'
  listOrdered?: boolean
  termJustification?: string
  exemplarDirection?: 'instance-to-concept' | 'concept-to-instance'
  recallItems?: string[]
  axis?: string
  salience?: 'load-bearing' | 'attaching'
  difficultyEstimate?: 1 | 2 | 3 | 4 | 5
  conceptKind?: 'framework'
  relational?: boolean
}

/** One successful Flashcards V1 result stored as an inspectable class resource. */
export interface GeneratedFlashcardDeck {
  id: ID
  courseId: ID
  title: string
  sourceChunkIds: ID[]
  specId: 'flashcards-v1'
  specHash: string
  cards: GeneratedFlashcard[]
  createdAt: number
  updatedAt: number
  order: number
}

/** A source-linked repair of a student's own lecture record. It is deliberately
 * distinct from a ClassNote because individual passages and unresolved source
 * differences need durable citation provenance. */
export interface GeneratedRevisedNotesRef {
  fileId: ID
  chunkId: ID
  start: number
  end: number
}

export interface GeneratedRevisedNotesPassage {
  id: ID
  title?: string
  content: string
  /** Revised Notes V1 is source-only. Keeping this explicit makes the contract
   * inspectable even if a later artifact permits another source mode. */
  provenance: 'source'
  sourceRefs: GeneratedRevisedNotesRef[]
}

export interface GeneratedRevisedNotesSection {
  id: ID
  title: string
  passages: GeneratedRevisedNotesPassage[]
}

/** The record of a disagreement is an outcome, not an error to be smoothed. */
export interface GeneratedRevisedNotesDifference {
  id: ID
  label: 'Unresolved source difference'
  detail: string
  sourceRefs: GeneratedRevisedNotesRef[]
}

export interface GeneratedRevisedNotes {
  id: ID
  courseId: ID
  title: string
  specId: 'revised-notes-v1'
  specHash: string
  sections: GeneratedRevisedNotesSection[]
  unresolvedDifferences: GeneratedRevisedNotesDifference[]
  /** The precise selection, then the subset that actually supports output. */
  /** The one student-selected record the revision preserves first. Legacy
   * artifacts predate this choice and intentionally leave it absent. */
  baselineFileId?: ID
  baselineSourceChunkIds?: ID[]
  selectedSourceChunkIds: ID[]
  usedSourceChunkIds: ID[]
  unusedSourceChunkIds: ID[]
  selectedFileIds: ID[]
  usedFileIds: ID[]
  unusedFileIds: ID[]
  createdAt: number
  updatedAt: number
  order: number
}

/** A durable unit map used as the source contract for generated study work. */
export interface GeneratedMasteryOutlineStandard {
  id: string
  title: string
  /** Added after v41. Older saved maps omit this and render their objective
   * title as a compatibility recall cue. */
  freeRecallCues?: string[]
  understand: string[]
  beAbleToDo: string[]
  watchFor: string[]
  sourceChunkIds: ID[]
  masteryState?: 'not-started' | 'can-explain' | 'can-apply-without-notes'
}

export interface GeneratedMasteryOutline {
  id: ID
  courseId: ID
  title: string
  unit: string
  /** v41 unifies lecture, unit, and exam maps under one resource. Legacy
   * records omit these fields and are read as unit-scoped. */
  scope?: 'lecture' | 'unit' | 'exam'
  scopeId?: ID
  lectureId?: ID
  specId: 'unit-mastery-outline-v1'
  specHash: string
  standards: GeneratedMasteryOutlineStandard[]
  sourceChunkIds: ID[]
  createdAt: number
  updatedAt: number
  order: number
}

export type GeneratedQuestionBankStyle = 'biology' | 'psychology' | 'general'
export type GeneratedQuestionBankScope = 'current-unit' | 'prior-unit-integration'
export type GeneratedQuestionBankMove = 'application' | 'integration' | 'situational' | 'interpretation' | 'method-and-controls'
export type GeneratedQuestionStimulusKind = 'passage' | 'data-table' | 'line-graph' | 'bar-graph' | 'diagram'

export interface GeneratedQuestionStimulus {
  id: ID
  title: string
  kind: GeneratedQuestionStimulusKind
  context: string
  caption: string
  altText: string
  basis: 'source-derived' | 'generated-schematic' | 'simulated-data'
  sourceChunkIds: ID[]
  table?: { columns: string[]; rows: string[][] }
  graph?: { xLabel: string; yLabel: string; series: Array<{ label: string; points: Array<{ x: string; y: number }> }> }
  diagram?: { nodes: Array<{ id: ID; label: string; x: number; y: number; shape?: 'box' | 'circle' }>; edges: Array<{ from: ID; to: ID; label?: string }> }
}

export interface GeneratedUnitQuestion {
  id: ID
  prompt: string
  options?: string[]
  answer: string
  rationale: string
  unit: string
  scope: GeneratedQuestionBankScope
  move: GeneratedQuestionBankMove
  primaryStandardId: string
  secondaryStandardIds?: string[]
  sourceChunkIds: ID[]
  difficulty: 'foundational' | 'standard' | 'challenging'
  stimulusIds: ID[]
}

/** Generated questions are practice material, never a private/official exam. */
export interface GeneratedUnitQuestionBank {
  id: ID
  courseId: ID
  title: string
  unit: string
  specId: 'unit-question-bank-v1'
  specHash: string
  courseStyle: GeneratedQuestionBankStyle
  currentUnitPercent: number
  integrationPercent: number
  stimuli?: GeneratedQuestionStimulus[]
  questions: GeneratedUnitQuestion[]
  /** Optional for records created before provider tracing was added. */
  generationProvider?: 'anthropic' | 'openai'
  /** Selected local image pages actually supplied to Claude for this bank. */
  visualSourceFileIds?: ID[]
  /** Anthropic-reported official assessment-pattern searches for this run. */
  webPatternSearchCount?: number
  sourceChunkIds: ID[]
  createdAt: number
  updatedAt: number
  order: number
}

export interface GeneratedMockQuestion {
  id: ID
  prompt: string
  sourceChunkId: ID
  topicId?: ID
  order: number
}

/** A student-owned, generated class attempt. It deliberately has no score. */
export interface GeneratedMockAttempt {
  id: ID
  courseId: ID
  examAssignmentId: ID
  topicIds: ID[]
  sourceChunkIds: ID[]
  specId: 'class-full-mock-v1'
  specHash: string
  questions: GeneratedMockQuestion[]
  answers: Record<ID, string>
  flaggedQuestionIds: ID[]
  /** Last question the student visited. Optional for pre-existing attempts;
   * the runner falls back to the first unanswered question. */
  currentQuestionId?: ID
  startedAt: number
  endedAt?: number
  createdAt: number
  updatedAt: number
  order: number
}

/** A dated observation the student wrote from work that has actually returned.
 * It is evidence, not a professor prediction or readiness verdict. */
export interface ProfessorEvidenceObservation {
  id: ID
  courseId: ID
  assignmentId: ID
  personId?: ID
  observation: string
  observedAt: number
  createdAt: number
  updatedAt: number
  order: number
}

/** A deliberately small student-authored concept map attached to one review. */
export interface ConceptCanvasNode {
  id: ID
  label: string
}

export interface ConceptCanvasEdge {
  id: ID
  fromNodeId: ID
  toNodeId: ID
  label: string
}

export interface ConceptCanvasResponse {
  id: ID
  courseId: ID
  topicId?: ID
  reviewEventId?: ID
  nodes: ConceptCanvasNode[]
  edges: ConceptCanvasEdge[]
  attachedFileId?: ID
  createdAt: number
  updatedAt: number
  order: number
}

/** Permission is stated by the student; content from an unknown origin stays private. */
export type AssessmentMaterialPermission =
  | 'instructor-provided'
  | 'publicly-posted'
  | 'my-returned-work'
  | 'unknown-origin'

export interface AssessmentMaterialRecord {
  id: ID
  courseId: ID
  fileId?: ID
  title: string
  unit?: string
  permission: AssessmentMaterialPermission
  sourceLabel: string
  topicIds: ID[]
  createdAt: number
  updatedAt: number
  order: number
}

/** An attempt on material the student supplied or linked; never a generated mock. */
export interface AssessmentAttempt {
  id: ID
  courseId: ID
  materialId: ID
  topicIds: ID[]
  startedAt: number
  endedAt?: number
  result?: string
  createdAt: number
  updatedAt: number
  order: number
}

/** A transcript-faithful entry. Operational Course fields remain separate. */
export interface TranscriptCourseRecord {
  id: ID
  /** Operational class/course link when this is ordinary UNC coursework.
   * Prior credit is owned by Grades & Archive and deliberately has no Planner
   * Course row. Older linked records remain valid and readable. */
  courseId?: ID
  institution: string
  courseNumberExact: string
  titleExact: string
  creditsExact: string
  gradeExact: string
  term: string
  year: string
  courseType: string
  displayName?: string
  evidenceFileId?: ID
  /** The exact transcript line this record was read from. Additive and
   *  optional: records entered by hand, and every record written before this
   *  field existed, simply carry no quote. */
  sourceQuote?: string
  classificationSource?: string
  classificationReason?: string
  createdAt: number
  updatedAt: number
  order: number
}

/** A personal acknowledgement never changes the source's own status. */
export interface CatalogWarningAcknowledgement {
  requirementId: ID
  sourceVersion: string
  acknowledgedAt: number
}

/** Student-selected planning context; never an official degree or admission decision. */
export interface PlanningProgramContext {
  selectedProgramId?: string
  matriculationTerm?: string
  /** Exact applicable IDEAs-in-Action catalog year, never a guessed cohort. */
  ideasCatalogYear?: string
  gillingsAdmissionTerm?: string
  programAdmissionStatus?: 'not-applicable' | 'planning' | 'applied' | 'admitted'
  updatedAt?: number
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
  retrievabilityPredictions: RetrievabilityPrediction[]
  reviewSessionPreferences: ReviewSessionPreferences
  focusSessions: FocusStudySession[]
  contacts: ClassContact[]
  weakAreas: ClassWeakArea[]
  practiceExams: PracticeExam[]
  practiceQuestions: PracticeQuestion[]
  paperDrafts: PaperDraft[]
  assignedReadings: AssignedReading[]
  feedbackNotes: FeedbackNote[]
  gradeCategories: GradeCategory[]
  mistakes: AcademicMistake[]
  topicLinks: TopicLink[]
  topicPredictions: TopicPrediction[]
  savedPlans: SavedPlan[]
  plannerTerms: PlannerTerm[]
  examPrepPlans: ExamPrepPlan[]
  generatedFlashcardDecks: GeneratedFlashcardDeck[]
  generatedMockAttempts: GeneratedMockAttempt[]
  generatedRevisedNotes: GeneratedRevisedNotes[]
  generatedMasteryOutlines: GeneratedMasteryOutline[]
  generatedUnitQuestionBanks: GeneratedUnitQuestionBank[]
  professorEvidence: ProfessorEvidenceObservation[]
  conceptCanvases: ConceptCanvasResponse[]
  assessmentMaterials: AssessmentMaterialRecord[]
  assessmentAttempts: AssessmentAttempt[]
  transcriptRecords: TranscriptCourseRecord[]
  acknowledgedCatalogWarnings: CatalogWarningAcknowledgement[]
  planningProgramContext: PlanningProgramContext
  lectures: LectureRecord[]
  lectureFindings: LectureEvidenceFinding[]
  lectureMaterialProposals: LectureMaterialProposal[]
  lectureNoteProposals: LectureNoteProposal[]
  /** v37 generalized, source-reviewable Guide records. */
  guideProposals: GuideProposal[]
  /** One-way, review-first selected-backup-folder metadata. */
  watchedNoteSources: WatchedNoteSource[]
  watchedNoteProposals: WatchedNoteProposal[]
  /** Frozen, explainable readings of a completed term. They never replace or
   * mutate the course records from which they were compiled. */
  termReports: TermReport[]
}

export type WatchedNoteProvider = 'local-folder' | 'google-drive' | 'dropbox' | 'onedrive'
export type WatchedNoteCategory = 'notes' | 'homework' | 'practice-problems'
export type WatchedNoteProposalStatus = 'pending' | 'accepted' | 'skipped'
export type WatchedNoteMappingConfidence = 'confirmed' | 'inferred' | 'needs-confirmation'

/** A student-confirmed mapping for exactly one logical folder level. */
export interface WatchedNoteMapping {
  id: ID
  logicalLevel: string
  courseId?: ID
  week?: string
  category?: WatchedNoteCategory
  confirmedAt: number
}

/** Metadata for a backup source. No credential, provider handle, or local path is persisted. */
export interface WatchedNoteSource {
  id: ID
  provider: WatchedNoteProvider
  rootLabel: string
  courseId?: ID
  selectedAt: number
  reviewEachImport: boolean
  confirmedMappings: WatchedNoteMapping[]
  createdAt: number
  updatedAt: number
}

/** A proposal is an import preview, never a silently-added material. */
export interface WatchedNoteProposal {
  id: ID
  sourceId: ID
  stableKey: string
  /** Relative display path only; never an operating-system path. */
  displayPath: string
  displayName: string
  mimeType?: string
  modifiedAt?: number
  sizeBytes?: number
  /** Used only to deduplicate a re-intake when the display tree changes. */
  sourceIdentity?: string
  proposedCourseId?: ID
  proposedWeek?: string
  proposedCategory?: WatchedNoteCategory
  mappingConfidence: WatchedNoteMappingConfidence
  mappingReason: string
  status: WatchedNoteProposalStatus
  acceptedFileId?: ID
  createdAt: number
  updatedAt: number
}

/** A record the report may point back to. The report never contains an
 * inference without one of these references. */
export type TermReportEvidenceKind =
  | 'course'
  | 'assignment'
  | 'mistake'
  | 'review-event'
  | 'note'
  | 'feedback'
  | 'material'

export interface TermReportEvidenceRef {
  kind: TermReportEvidenceKind
  id: ID
  courseId: ID
  label: string
  /** Material references retain their exact stored chunk span. */
  fileId?: ID
  chunkId?: ID
  start?: number
  end?: number
}

/** A deterministic, human-readable fact compiled before any provider call. */
export interface TermReportEvidenceItem {
  id: ID
  ref: TermReportEvidenceRef
  label: string
  detail: string
  /** Kept only for an explicitly selected material span. It is not rendered in
   * the report, but freezes exactly what an AI-assisted revision could read. */
  sourceText?: string
  category: 'course' | 'returned-work' | 'study-record' | 'class-note' | 'feedback' | 'selected-material'
}

export interface TermReportSnapshot {
  term: string
  courseIds: ID[]
  facts: TermReportEvidenceItem[]
  compiledAt: number
  /** Kept with the snapshot so a reopened report explains its own boundary. */
  evidenceLimit: string
}

export type TermReportStatus = 'draft' | 'ready' | 'unavailable' | 'insufficient-evidence'
export type TermReportBlockKind = 'fact' | 'takeaway' | 'experiment' | 'limit'

export interface TermReportBlock {
  id: ID
  kind: TermReportBlockKind
  title: string
  text: string
  evidenceIds: ID[]
  source: 'deterministic' | 'ai'
}

/** A saved report is a historical reading, not a changing dashboard. A
 * regeneration creates another record linked through `supersedesReportId`. */
export interface TermReport {
  id: ID
  term: string
  courseIds: ID[]
  status: TermReportStatus
  snapshot: TermReportSnapshot
  blocks: TermReportBlock[]
  selectedFileIds: ID[]
  providerMessage?: string
  supersedesReportId?: ID
  carryForwardDraft?: string
  createdAt: number
  updatedAt: number
  order: number
}

/** Parsed or student-entered syllabus category. This intentionally has no grade math. */
export interface GradeCategory {
  id: ID
  courseId: ID
  name: string
  weight: number
  policyNote?: string
  source?: string
  /** Stable identity of the confirmed syllabus line that created this row. */
  syllabusSourceKey?: string
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
export type AcademicMistakeCause =
  | 'didnt-know'
  | 'knew-it-but-blanked'
  | 'misread-the-question'
  | 'arithmetic'
  | 'ran-out-of-time'
  | 'wrong-method'

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

/** §6.6 Connect — the five relations the spec rules, and no more. */
export type TopicLinkRelation =
  | 'builds-on' | 'contrasts-with' | 'same-mechanism' | 'prerequisite' | 'shared-mcat-category'

/**
 * An explicit relation the student AUTHORS between two topics. Turns the topic
 * set into a graph rather than a list.
 *
 * ⚠️ Never auto-written. §6.6 and #22 both rule propose-then-confirm, and a
 * wrong automatic merge would corrupt two classes' review schedules at once.
 */
export interface TopicLink {
  id: ID
  fromTopicId: ID
  toTopicId: ID
  relation: TopicLinkRelation
  note?: string
  createdAt: number
  updatedAt: number
  order: number
}

/**
 * §6.6 Predict — one expectation, written before the lecture and surfaced back
 * after it. **The violation is where the encoding happens**, so the record only
 * earns its keep once the student has seen it again.
 *
 * ⚠️ There is nothing to be right about. A prediction is never graded, never
 * scored, and never touches FSRS or weak-topic state — §6.6 rules the whole
 * pretesting family as priming, not performance.
 */
export interface TopicPrediction {
  id: ID
  courseId: ID
  topicId: ID
  prompt: string
  answer: string
  createdAt: number
  updatedAt: number
  /** When the student saw it back after the lecture. */
  revealedAt?: number
  order: number
}

/** One course's placement at the moment a plan was saved. */
export interface SavedPlacement {
  courseId: ID
  term: string
  /** Stable planner slot when the snapshot was created (optional for v28 plans). */
  plannerTermId?: ID
  /** What the course was when captured — restore reads this to know what moved. */
  status: CourseStatus
}

/**
 * A named snapshot of course placements (§4.1 plan comparison).
 *
 * ⚠️ Restoring one **never touches a completed or graded course** (Andy,
 * Aug 19 2026). `courses` is the same list the transcript, the tracker and
 * Class Center all read, so a naive restore would move a course you have
 * already taken, or discard its grade.
 */
export interface SavedPlan {
  id: ID
  name: string
  note?: string
  placements: SavedPlacement[]
  /** Optional because plans saved before v29 have no slot metadata. */
  plannerTerms?: PlannerTerm[]
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
  /** Ordered task resources. `fileUrl` mirrors the first entry for legacy readers. */
  links?: string[]
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
  /** Student-confirmed presentation: never inferred from the goal wording.
   * `measured` remains readable as the legacy name for `cumulative`. */
  kind: 'check-off' | 'cumulative' | 'period' | 'measured'
  /** Optional link to the long-horizon target stored in `goals`. Cumulative
   * goals read their recorded value and target from this linked domain. */
  standingTarget?: keyof Goals
  /** Period goals may use a student-entered measurement when no owned tracker
   * can supply it. Undefined means insufficient evidence, never zero. */
  currentValue?: number
  targetValue?: number
  unit?: string
  periodLabel?: string
  evidenceLabel?: string
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
  /** Optional academic minors. An array keeps multiple programs distinct
   *  instead of storing an ambiguous comma-delimited display string. */
  minors?: string[]
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
  /** @deprecated Read by nothing since Aug 19 2026. The hero used it to show
   *  fabricated events when no calendar was connected; it now derives the day
   *  from ClassWorkspace records or shows an empty day. Kept so existing
   *  blobs stay valid rather than forcing a migration to drop a boolean. */
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
