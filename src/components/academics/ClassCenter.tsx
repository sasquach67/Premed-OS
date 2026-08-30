import { useEffect, useMemo, useState, type CSSProperties, type DragEvent, type MouseEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, Archive, ArrowLeft, ArrowUpRight, Atom, BarChart3, BookOpen, Brain, BriefcaseBusiness, Building2, Calculator, CalendarClock, CalendarDays,
  CheckCircle2, Circle, Code2, Coins, Dna, Dumbbell, Earth, Edit3, FlaskConical, FolderOpen, Gavel, GraduationCap, HeartPulse, Landmark, Languages, Leaf, Lightbulb, Mail, Microscope,
  MoreHorizontal, Music2, NotebookText, Palette, PenLine, Plus, Scale, Search, Speech, Stethoscope, Target, Telescope, Theater, Trees, UsersRound, Wrench, FileText,
  Grid2X2, List, ListChecks, Loader2, TrendingUp,
  Trash2, Upload, Users, type LucideIcon,
} from 'lucide-react'
import { useStore } from '@/store/store'
import { uid } from '@/lib/id'
import { fmtDeadline, fmtEventDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import type {
  AcademicTagColor, ClassAssignment, ClassWorkspace,
  ClassCenterData, ClassContact, ClassContactRole, Course,
  AcademicFile, ClassFileType, ClassNote, ClassNoteType, Topic,
  ClassWeakArea, PracticeExam, PracticeQuestion,
  TopicStatus, WeakAreaSource, Person, ClassWorkspaceType,
} from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateField } from '@/components/common/DateField'
import { AnimatedFileUpload } from '@/components/motion'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import { SmartActionPanel } from '@/components/common/SmartActionPanel'
import { academicsNextActions, type Recommendation } from '@/lib/intelligence'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { CenterPeek, type RecordOpenMode } from '@/components/common/CenterPeek'
import { Progress } from '@/components/ui/progress'
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { GRADE_POINTS, fmtGpa, gpaStats } from '@/lib/selectors'
import { ClassHub } from '@/components/academics/ClassHub'
import { SyllabusImportMode } from '@/components/academics/SyllabusImportMode'
import { SyllabusImportDialog } from '@/components/academics/SyllabusImportDialog'
import type { SyllabusProposal } from '@/lib/academics/syllabusParser'
import { retainLocalSyllabus } from '@/lib/academics/localSyllabusFiles'
import { retainLocalMaterial } from '@/lib/academics/localMaterialFiles'
import {
  syllabusAssignmentSourceKey,
  syllabusCategorySourceKey,
  syllabusReadingSourceKey,
  syllabusScheduleSourceKey,
  syllabusTopicSourceKey,
  type ReimportRow,
} from '@/lib/academics/syllabusReimport'
import { classTypeDraftDecision } from '@/lib/academics/classTypeDraftDecision'
import { nextIncompleteReading, readingDebt, READING_LIST_STATE_COPY } from '@/lib/academics/writingEvidence'
import { inferAcademicTerm } from '@/store/migrations/academicsV4'
import { persistConfirmedSyllabusEvidence } from '@/lib/academics/guideContract'
import { extractClassMeetingDays, extractClassMeetingTime, isOfficeHoursLine, normalizeMeetingDays } from '@/lib/academics/meetingSchedule'
import { removeLocalBlob } from '@/lib/localBlobStore'
import { removeCourseCascade } from '@/lib/academics/removeCourseCascade'

const COLORS: AcademicTagColor[] = [
  'blue', 'sky', 'cyan', 'teal', 'mint', 'green',
  'lime', 'yellow', 'orange', 'coral', 'red', 'pink',
  'purple', 'plum', 'indigo', 'navy', 'brown', 'gray',
]
const CLASS_ICONS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'book', label: 'Book', Icon: BookOpen },
  { id: 'dna', label: 'Biology', Icon: Dna },
  { id: 'brain', label: 'Psych', Icon: Brain },
  { id: 'atom', label: 'Science', Icon: Atom },
  { id: 'flask', label: 'Chemistry', Icon: FlaskConical },
  { id: 'stethoscope', label: 'Health', Icon: Stethoscope },
  { id: 'microscope', label: 'Lab', Icon: Microscope },
  { id: 'chart', label: 'Stats', Icon: BarChart3 },
  { id: 'pen', label: 'Writing', Icon: PenLine },
  { id: 'leaf', label: 'Life', Icon: Leaf },
  { id: 'calculator', label: 'Math', Icon: Calculator },
  { id: 'languages', label: 'Languages', Icon: Languages },
  { id: 'palette', label: 'Art', Icon: Palette },
  { id: 'music', label: 'Music', Icon: Music2 },
  { id: 'code', label: 'Computer science', Icon: Code2 },
  { id: 'landmark', label: 'History', Icon: Landmark },
  { id: 'earth', label: 'Geography', Icon: Earth },
  { id: 'scale', label: 'Law and policy', Icon: Scale },
  { id: 'business', label: 'Business', Icon: BriefcaseBusiness },
  { id: 'education', label: 'Education', Icon: GraduationCap },
  { id: 'fitness', label: 'Physical education', Icon: Dumbbell },
  { id: 'theater', label: 'Performing arts', Icon: Theater },
  { id: 'engineering', label: 'Engineering', Icon: Wrench },
  { id: 'economics', label: 'Economics', Icon: Coins },
  { id: 'philosophy', label: 'Philosophy', Icon: Lightbulb },
  { id: 'anthropology', label: 'Anthropology and culture', Icon: UsersRound },
  { id: 'communication', label: 'Communication', Icon: Speech },
  { id: 'astronomy', label: 'Astronomy', Icon: Telescope },
  { id: 'architecture', label: 'Architecture', Icon: Building2 },
  { id: 'public-health', label: 'Public health', Icon: HeartPulse },
  { id: 'environment', label: 'Environmental science', Icon: Trees },
  { id: 'government', label: 'Government', Icon: Gavel },
]
const ICON_ALIASES: Record<string, string> = {
  '\u{1F4D8}': 'book',
  '\u{1F9EC}': 'dna',
  '\u{1F9E0}': 'brain',
  '\u{2697}\u{FE0F}': 'flask',
  '\u{1FA7A}': 'stethoscope',
  '\u{1F52C}': 'microscope',
  '\u{1F9EA}': 'flask',
  '\u{1F4CA}': 'chart',
  '\u{270D}\u{FE0F}': 'pen',
  '\u{1F331}': 'leaf',
}
const TOPIC_STATUSES: TopicStatus[] = ['not-started', 'seen', 'notes-made', 'reviewing', 'weak', 'ready']
const NOTE_TYPES: ClassNoteType[] = ['lecture', 'reading', 'lab', 'study-guide', 'exam-review', 'question-log', 'other']
const FILE_TYPES: ClassFileType[] = ['syllabus', 'lecture-slides', 'reading', 'study-guide', 'rubric', 'past-exam', 'lab-handout', 'link', 'other']
const CONTACT_ROLES: ClassContactRole[] = ['professor', 'TA', 'advisor', 'study-partner', 'tutor', 'peer', 'other']
const CLASS_TYPES: Array<{ value: ClassWorkspaceType; label: string; detail: string }> = [
  { value: 'stem', label: 'STEM', detail: 'Topics and source-backed study work' },
  { value: 'writing', label: 'Writing', detail: 'Drafts, readings, feedback' },
  { value: 'general', label: 'General', detail: 'Grades and deadlines' },
]

const COLOR_STYLES: Record<AcademicTagColor, string> = {
  gray: 'from-slate-400/18 via-slate-200/18 to-slate-500/12 text-slate-700 dark:text-slate-200',
  brown: 'from-stone-500/20 via-amber-200/18 to-stone-400/14 text-stone-800 dark:text-stone-100',
  orange: 'from-orange-400/22 via-amber-200/18 to-orange-500/12 text-orange-800 dark:text-orange-100',
  coral: 'from-[#ef8b75]/24 via-rose-100/18 to-[#db705f]/14 text-[#9b3f33] dark:text-[#ffc4b8]',
  yellow: 'from-yellow-300/24 via-amber-100/20 to-yellow-500/12 text-yellow-800 dark:text-yellow-100',
  lime: 'from-lime-400/22 via-lime-100/16 to-lime-500/12 text-lime-800 dark:text-lime-100',
  green: 'from-emerald-400/22 via-lime-100/16 to-green-500/12 text-emerald-800 dark:text-emerald-100',
  mint: 'from-[#6dcfac]/24 via-emerald-100/16 to-[#4cb18d]/14 text-[#176b54] dark:text-[#b5f4dc]',
  teal: 'from-teal-400/22 via-cyan-100/16 to-teal-500/12 text-teal-800 dark:text-teal-100',
  cyan: 'from-cyan-400/22 via-sky-100/16 to-cyan-500/12 text-cyan-800 dark:text-cyan-100',
  sky: 'from-[#64c3ec]/24 via-sky-100/16 to-[#3da7d7]/14 text-[#17678d] dark:text-[#c2ecff]',
  blue: 'from-sky-400/22 via-blue-100/16 to-blue-500/12 text-sky-800 dark:text-sky-100',
  navy: 'from-[#476b9e]/24 via-blue-100/14 to-[#304f7d]/16 text-[#29476e] dark:text-[#c5d7f0]',
  indigo: 'from-indigo-400/22 via-indigo-100/16 to-indigo-500/12 text-indigo-800 dark:text-indigo-100',
  purple: 'from-violet-400/22 via-purple-100/16 to-violet-500/12 text-violet-800 dark:text-violet-100',
  plum: 'from-[#b06ca9]/24 via-fuchsia-100/16 to-[#8b4f87]/14 text-[#71376d] dark:text-[#efc2ea]',
  pink: 'from-pink-400/22 via-rose-100/16 to-pink-500/12 text-pink-800 dark:text-pink-100',
  red: 'from-red-400/22 via-rose-100/16 to-red-500/12 text-red-800 dark:text-red-100',
}

const PILL_STYLES: Record<AcademicTagColor, string> = {
  gray: 'bg-slate-500/12 text-slate-700 dark:text-slate-200',
  brown: 'bg-stone-500/12 text-stone-700 dark:text-stone-200',
  orange: 'bg-orange-500/12 text-orange-700 dark:text-orange-200',
  coral: 'bg-[#ef8b75]/16 text-[#9b3f33] dark:text-[#ffc4b8]',
  yellow: 'bg-yellow-500/18 text-yellow-800 dark:text-yellow-100',
  lime: 'bg-lime-500/16 text-lime-800 dark:text-lime-100',
  green: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-200',
  mint: 'bg-[#6dcfac]/16 text-[#176b54] dark:text-[#b5f4dc]',
  teal: 'bg-teal-500/14 text-teal-700 dark:text-teal-200',
  cyan: 'bg-cyan-500/14 text-cyan-800 dark:text-cyan-100',
  sky: 'bg-[#64c3ec]/16 text-[#17678d] dark:text-[#c2ecff]',
  blue: 'bg-sky-500/12 text-sky-700 dark:text-sky-200',
  navy: 'bg-[#476b9e]/16 text-[#29476e] dark:text-[#c5d7f0]',
  indigo: 'bg-indigo-500/14 text-indigo-700 dark:text-indigo-200',
  purple: 'bg-violet-500/12 text-violet-700 dark:text-violet-200',
  plum: 'bg-[#b06ca9]/16 text-[#71376d] dark:text-[#efc2ea]',
  pink: 'bg-pink-500/12 text-pink-700 dark:text-pink-200',
  red: 'bg-red-500/12 text-red-700 dark:text-red-200',
}

/** Raw accent per class colour. The hover recipe (border, ring, glow, bar
 *  ignition) is CSS in index.css and reads this through `--class-accent`,
 *  so the literal _visual-recipes values apply rather than a Tailwind
 *  approximation of them. */
const CARD_ACCENT_HEX: Record<AcademicTagColor, string> = {
  gray: '#9aa3ad', brown: '#a38465', orange: '#df9b52', coral: '#e67d69', yellow: '#d5b768',
  lime: '#98bd63', green: '#6fc0a8', mint: '#62c6a2', teal: '#54b5ad', cyan: '#58b9cf',
  sky: '#65bfe7', blue: '#6fb3de', navy: '#506f9d', indigo: '#7f8fd3',
  purple: '#a987ca', plum: '#aa6aa3', pink: '#c98ac9', red: '#e8806f',
}

/** Card accents stay deliberately restrained: the course colour identifies a
 *  card, while the content remains the visual focus. These are precomputed
 *  rather than written as `color-mix(... , transparent)` in CSS because the
 *  build's CSS minifier can fold that form down to the bare colour and turn a
 *  subtle treatment into a full-strength glow. */
function accentAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Persisted class colours predate the current palette and can contain a
 * retired value. A card must fall back to blue rather than letting a visual
 * accent take down the whole Class Center. */
export function classCardColor(color: unknown): AcademicTagColor {
  return typeof color === 'string' && color in CARD_ACCENT_HEX ? color as AcademicTagColor : 'blue'
}

function cardAccentVars(color: unknown): CSSProperties {
  const hex = CARD_ACCENT_HEX[classCardColor(color)]
  return {
    '--class-accent': hex,
    '--class-accent-45': accentAlpha(hex, 0.45),
    '--class-accent-75': accentAlpha(hex, 0.75),
  } as CSSProperties
}

export type ClassWorkspaceView = Omit<ClassWorkspace, 'id'> & {
  id: string
  workspaceId: string
  courseCode: string
  courseTitle: string
  semester: string
  grade: Course['grade']
  bcpm: boolean
  credits: number
}

export type ClassCenterViewData = ClassCenterData & { classes: ClassWorkspaceView[] }

type ClassFormState = Omit<ClassWorkspaceView, 'id' | 'workspaceId' | 'courseId' | 'createdAt' | 'updatedAt' | 'order' | 'grade' | 'bcpm' | 'credits' | 'type'> & {
  /** New drafts deliberately have no saved study layer until the student chooses one. */
  type?: ClassWorkspaceType
}
type ReimportDecision = { row: ReimportRow; action: ReimportRow['defaultAction'] }

function emptyClassForm(semester = 'Fall 2026'): ClassFormState {
  return {
    courseCode: '',
    courseTitle: '',
    nickname: '',
    semester,
    instructor: '',
    meetingDays: '',
    meetingTime: '',
    location: '',
    color: 'blue',
    icon: 'book',
    background: '',
    status: 'active',
    currentTopicId: '',
    syllabusUrl: '',
    canvasUrl: '',
    driveFolderUrl: '',
    goodNotesUrl: '',
    ankiDeckName: '',
    notesDocUrl: '',
  }
}

/** Pull only attributable identity and meeting facts into the review sheet.
 * The proposal remains the source of truth for syllabus records; these values
 * are merely a convenient draft and can always be corrected before save. */
function extractClassLocation(line?: string): string {
  if (!line) return ''
  // Prefer the complete named building plus room over the shorter `Room 121`
  // suffix. A labeled fallback still handles forms such as `Location: Kenan B12`.
  const locationText = line.replace(/^.*\b(?:AM|PM)\b\s*/i, '')
  const namedLocations = [...locationText.matchAll(/\b((?:(?:Room|Rm\.?)\s*)?\d+[A-Za-z]?\s+)?([A-Z][\w.'-]*(?:\s+[A-Z][\w.'-]*)*\s+(?:Center|Hall|Building)(?:\s+(?:Room|Rm\.?)?\s*[A-Za-z]?\d+[A-Za-z]?)?)\b/g)]
    .map((match) => `${match[1] ?? ''}${match[2]}`.trim())
  // DOCX two-column headers are flattened into one line. When that happens,
  // the instructor office appears first and the class location appears last.
  if (/^\s*office\s*:/i.test(line)) return namedLocations.length > 1 ? namedLocations.at(-1) ?? '' : ''
  return namedLocations[0]
    ?? line.match(/(?:room|location)\s*[:\-]?\s*([\w -]{3,})/i)?.[1]?.trim()
    ?? ''
}

function extractInstructor(logistics: string[]): string {
  const line = logistics.find((candidate) => /(?:instructor|prof(?:essor)?)/i.test(candidate)) ?? ''
  const remainder = line.match(/(?:instructor|prof(?:essor)?)\.?\s*[:\-]?\s*(.+)$/i)?.[1] ?? ''
  return remainder
    .split(/\s+(?=(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:office|student)\s+hours?|MWF|TR|TTH|T\s*(?:[\/&]|and)\s*TH|Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|\d{1,2}(?::\d{2})?\s*(?:AM|PM)\b))/i)[0]
    .replace(/[\s,]+$/, '')
    .trim()
}

function cleanCourseTitle(value?: string): string {
  return (value ?? '')
    .replace(/\s*[-–—|·]\s*(?:Fall|Spring|Summer|Winter)\s+20\d{2}\b.*$/i, '')
    .replace(/\s*\((?:Fall|Spring|Summer|Winter)\s+20\d{2}\)\s*$/i, '')
    .trim()
}

function extractCourseTerm(proposal: SyllabusProposal, fallback: string): string {
  const match = `${proposal.items.find((item) => item.kind === 'identity')?.value ?? ''}\n${proposal.text}`
    .match(/\b(Fall|Spring|Summer|Winter)\s+(20\d{2})\b/i)
  if (!match) return fallback
  return `${match[1][0].toUpperCase()}${match[1].slice(1).toLowerCase()} ${match[2]}`
}

export function classFormFromSyllabus(proposal: SyllabusProposal, semester: string): ClassFormState {
  const identity = proposal.items.find((item) => item.kind === 'identity')
  const logistics = proposal.items.filter((item) => item.kind === 'logistics').map((item) => item.label || item.evidence.quote)
  const instructor = extractInstructor(logistics)
  const scheduleLine = logistics.find((line) => Boolean(extractClassMeetingDays(line))) ?? ''
  const rawScheduleLine = proposal.text.split(/\r?\n/).find((line) => Boolean(extractClassMeetingDays(line)) && Boolean(extractClassMeetingTime(line))) ?? ''
  const meetingDays = extractClassMeetingDays(scheduleLine) || extractClassMeetingDays(rawScheduleLine)
  const meetingTime = extractClassMeetingTime(scheduleLine) || extractClassMeetingTime(rawScheduleLine)
  const locationLines = logistics.filter((line) => !isOfficeHoursLine(line) && /\b(?:room|location|hall|center|building)\b/i.test(line) && !/same location as class meetings/i.test(line))
  const location = locationLines.map(extractClassLocation).find(Boolean) ?? ''
  return {
    ...emptyClassForm(semester),
    semester: extractCourseTerm(proposal, semester),
    courseCode: identity?.label ?? '',
    courseTitle: cleanCourseTitle(identity?.value),
    instructor,
    meetingDays,
    meetingTime,
    location,
  }
}

function classToForm(row: ClassWorkspaceView): ClassFormState {
  return {
    courseCode: row.courseCode,
    courseTitle: row.courseTitle,
    nickname: row.nickname ?? '',
    semester: row.semester,
    instructor: row.instructor ?? '',
    meetingDays: row.meetingDays ?? '',
    meetingTime: row.meetingTime ?? '',
    location: row.location ?? '',
    color: row.color,
    icon: normalizeClassIcon(row.icon),
    type: row.type,
    readingListState: row.readingListState,
    background: row.background ?? '',
    status: row.status,
    currentTopicId: row.currentTopicId ?? '',
    syllabusUrl: row.syllabusUrl ?? '',
    canvasUrl: row.canvasUrl ?? '',
    driveFolderUrl: row.driveFolderUrl ?? '',
    goodNotesUrl: row.goodNotesUrl ?? '',
    ankiDeckName: row.ankiDeckName ?? '',
    notesDocUrl: row.notesDocUrl ?? '',
  }
}

function joinWorkspaces(workspaces: ClassWorkspace[], courses: Course[]): ClassWorkspaceView[] {
  const coursesById = new Map(courses.map((course) => [course.id, course]))
  return workspaces.flatMap((workspace) => {
    const course = coursesById.get(workspace.courseId)
    if (!course) return []
    return [{
      ...workspace,
      id: course.id,
      workspaceId: workspace.id,
      courseCode: course.code,
      courseTitle: course.title,
      semester: course.term,
      grade: course.grade,
      bcpm: course.bcpm,
      credits: course.credits,
    }]
  })
}

function workspaceFields(form: ClassFormState): Omit<ClassWorkspace, 'id' | 'courseId' | 'createdAt' | 'updatedAt' | 'order'> {
  if (!form.type) throw new Error('A class type is required before a workspace is saved.')
  const {
    courseCode: _courseCode,
    courseTitle: _courseTitle,
    semester: _semester,
    ...workspace
  } = form
  return { ...workspace, type: form.type, readingListState: form.readingListState ?? 'unknown' }
}

/** Applies only a student's explicit review choices. The diff itself stays in
 * syllabusReimport.ts; these keys merely locate the records that it identified. */
function applyAcceptedReimport(center: ClassCenterData, courseId: string, proposal: SyllabusProposal, decisions: ReimportDecision[], sourceFileId: string | undefined, now: number) {
  const accepted = decisions.filter((decision) => decision.action === 'accept')
  const acceptedRows = new Set(accepted.map((decision) => `${decision.row.kind}:${decision.row.key}`))
  const wants = (kind: ReimportRow['kind'], key: string) => acceptedRows.has(`${kind}:${key}`)
  const removed = new Set(accepted.filter((decision) => decision.row.status === 'removed').map((decision) => `${decision.row.kind}:${decision.row.key}`))

  // A removed syllabus line is preserved unless the student explicitly accepts its removal.
  center.topics = center.topics.filter((item) => item.courseId !== courseId || !removed.has(`topic:${item.syllabusSourceKey ?? syllabusTopicSourceKey(item.title)}`))
  center.assignments = center.assignments.filter((item) => item.courseId !== courseId || !removed.has(`assignment:${item.syllabusSourceKey ?? syllabusAssignmentSourceKey(item.title, item.dueDate)}`))
  center.gradeCategories = center.gradeCategories.filter((item) => item.courseId !== courseId || !removed.has(`category:${item.syllabusSourceKey ?? syllabusCategorySourceKey(item.name)}`))
  center.assignedReadings = center.assignedReadings.filter((item) => item.courseId !== courseId || !removed.has(`reading:${item.syllabusSourceKey ?? syllabusReadingSourceKey(item.title, item.week, item.dueForDiscussion)}`))
  const workspace = center.workspaces.find((item) => item.courseId === courseId)
  if (workspace?.syllabusSchedule) workspace.syllabusSchedule = workspace.syllabusSchedule.filter((item) => !removed.has(`schedule:${syllabusScheduleSourceKey(item.label, item.week, item.startDate)}`))

  proposal.items.filter((item) => item.kind === 'standards').forEach((item) => {
    const key = syllabusTopicSourceKey(item.label)
    if (!wants('topic', key)) return
    const existing = center.topics.find((topic) => topic.courseId === courseId && (topic.syllabusSourceKey ?? syllabusTopicSourceKey(topic.title)) === key)
    if (existing) {
      existing.title = item.label
      existing.syllabusSourceKey = key
      if (sourceFileId && !existing.linkedFileIds?.includes(sourceFileId)) existing.linkedFileIds = [...(existing.linkedFileIds ?? []), sourceFileId]
      existing.updatedAt = now
      return
    }
    center.topics.push({ id: uid(), courseId, title: item.label, syllabusSourceKey: key, unit: '', basis: 'syllabus-standard', status: 'not-started', fsrs: createTopicFsrsState(now), confidence: 3, sourceNoteIds: [], linkedFileIds: sourceFileId ? [sourceFileId] : [], createdAt: now, updatedAt: now, order: center.topics.filter((topic) => topic.courseId === courseId).length })
  })
  proposal.items.filter((item) => item.kind === 'exams' || item.kind === 'deadlines').forEach((item) => {
    const key = syllabusAssignmentSourceKey(item.label, item.value)
    if (!wants('assignment', key)) return
    const existing = center.assignments.find((assignment) => assignment.courseId === courseId && (assignment.syllabusSourceKey ?? syllabusAssignmentSourceKey(assignment.title, assignment.dueDate)) === key)
    if (existing) {
      existing.title = item.label
      existing.type = item.kind === 'exams' ? 'exam' : 'other'
      existing.dueDate = item.value
      existing.syllabusSourceKey = key
      if (sourceFileId && !existing.linkedFileIds.includes(sourceFileId)) existing.linkedFileIds.push(sourceFileId)
      existing.notes = `Source: ${item.evidence.location} — “${item.evidence.quote}”`
      existing.updatedAt = now
      return
    }
    center.assignments.push({ id: uid(), courseId, title: item.label, syllabusSourceKey: key, type: item.kind === 'exams' ? 'exam' : 'other', dueDate: item.value, status: 'not-started', linkedTopicIds: [], linkedFileIds: sourceFileId ? [sourceFileId] : [], notes: `Source: ${item.evidence.location} — “${item.evidence.quote}”`, createdAt: now, updatedAt: now, order: center.assignments.filter((assignment) => assignment.courseId === courseId).length })
  })
  proposal.items.filter((item) => item.kind === 'weights').forEach((item) => {
    const key = syllabusCategorySourceKey(item.label)
    const category = center.gradeCategories.find((candidate) => candidate.courseId === courseId && (candidate.syllabusSourceKey ?? syllabusCategorySourceKey(candidate.name)) === key)
    if (category && wants('category', key)) {
      category.name = item.label
      category.weight = Number(item.value?.replace('%', '')) || 0
      category.syllabusSourceKey = key
      category.source = `${item.evidence.location} — “${item.evidence.quote}”`
      category.updatedAt = now
    } else if (!category && wants('category', key)) {
      center.gradeCategories.push({ id: uid(), courseId, name: item.label || 'Untitled category', syllabusSourceKey: key, weight: Number(item.value?.replace('%', '')) || 0, source: `${item.evidence.location} — “${item.evidence.quote}”`, createdAt: now, updatedAt: now, order: center.gradeCategories.filter((candidate) => candidate.courseId === courseId).length })
    }
  })
  proposal.items.filter((item) => item.kind === 'readings').forEach((item) => {
    const week = item.context ?? 'Unscheduled'
    const key = syllabusReadingSourceKey(item.label, week, item.value)
    if (!wants('reading', key)) return
    const existing = center.assignedReadings.find((reading) => reading.courseId === courseId && (reading.syllabusSourceKey ?? syllabusReadingSourceKey(reading.title, reading.week, reading.dueForDiscussion)) === key)
    if (existing) {
      existing.title = item.label
      existing.week = week
      existing.dueForDiscussion = item.value
      existing.syllabusSourceKey = key
      existing.source = `${item.evidence.location} — “${item.evidence.quote}”`
      existing.updatedAt = now
      return
    }
    center.assignedReadings.push({ id: uid(), courseId, week, title: item.label, syllabusSourceKey: key, source: `${item.evidence.location} — “${item.evidence.quote}”`, status: 'not-started', dueForDiscussion: item.value, createdAt: now, updatedAt: now, order: center.assignedReadings.filter((reading) => reading.courseId === courseId).length })
  })
  proposal.items.filter((item) => item.kind === 'units').forEach((item) => {
    if (!workspace) return
    const week = item.context ?? 'Unscheduled'
    const key = syllabusScheduleSourceKey(item.label, week, item.value)
    if (!wants('schedule', key)) return
    const existing = workspace.syllabusSchedule?.find((entry) => syllabusScheduleSourceKey(entry.label, entry.week, entry.startDate) === key)
    if (existing) {
      Object.assign(existing, { week, label: item.label, startDate: item.value, source: `${item.evidence.location} — “${item.evidence.quote}”` })
      return
    }
    workspace.syllabusSchedule = [...(workspace.syllabusSchedule ?? []), { id: uid(), week, label: item.label, startDate: item.value, source: `${item.evidence.location} — “${item.evidence.quote}”`, order: workspace.syllabusSchedule?.length ?? 0 }]
  })
  const confirmedItems = proposal.items.filter((item) => {
    if (item.kind === 'standards') return wants('topic', syllabusTopicSourceKey(item.label))
    if (item.kind === 'exams' || item.kind === 'deadlines') return wants('assignment', syllabusAssignmentSourceKey(item.label, item.value))
    if (item.kind === 'weights') return wants('category', syllabusCategorySourceKey(item.label))
    if (item.kind === 'readings') return wants('reading', syllabusReadingSourceKey(item.label, item.context, item.value))
    if (item.kind === 'units') return wants('schedule', syllabusScheduleSourceKey(item.label, item.context, item.value))
    return false
  })
  if (proposal.items.some((item) => item.kind === 'readings') && center.assignedReadings.some((item) => item.courseId === courseId)) {
    if (workspace) workspace.readingListState = 'complete'
  }
  persistConfirmedSyllabusEvidence(center, courseId, sourceFileId, confirmedItems, now)
}

function normalizeClassIcon(icon?: string) {
  const id = ICON_ALIASES[icon ?? ''] ?? icon ?? 'book'
  return CLASS_ICONS.some((item) => item.id === id) ? id : 'book'
}

function ClassIcon({ icon, className }: { icon?: string; className?: string }) {
  const item = CLASS_ICONS.find((entry) => entry.id === normalizeClassIcon(icon)) ?? CLASS_ICONS[0]
  const Icon = item.Icon
  return (
    <span className={cn('grid shrink-0 place-items-center', className)}>
      <Icon className="size-[18px]" aria-hidden="true" />
    </span>
  )
}

function reorderClasses(draft: ClassCenterData, orderedVisibleIds: string[]) {
  const visible = new Set(orderedVisibleIds)
  const byId = new Map(draft.workspaces.map((row) => [row.courseId, row]))
  const orderedVisible = orderedVisibleIds.map((id) => byId.get(id)).filter(Boolean) as ClassWorkspace[]
  const current = [...draft.workspaces].sort((a, b) => a.order - b.order)
  const firstVisibleIndex = current.findIndex((row) => visible.has(row.courseId))
  if (firstVisibleIndex < 0) return
  const before = current.slice(0, firstVisibleIndex).filter((row) => !visible.has(row.courseId))
  const after = current.slice(firstVisibleIndex).filter((row) => !visible.has(row.courseId))
  ;[...before, ...orderedVisible, ...after].forEach((row, index) => {
    row.order = index
    row.updatedAt = Date.now()
  })
}

export function ClassCenter({ archiveOnly = false }: { archiveOnly?: boolean }) {
  const params = useParams()
  const data = useStore((s) => s.academics.classCenter)
  const courses = useStore((s) => s.courses)
  const update = useStore((s) => s.update)
  const persons = useStore((s) => s.persons)
  const currentTerm = useStore((s) => s.profile.startTerm)
  const store = useStore()
  const courseId = params.courseId
  const classes = useMemo(() => joinWorkspaces(data.workspaces, courses), [data.workspaces, courses])
  const viewData = useMemo<ClassCenterViewData>(() => ({ ...data, classes }), [data, classes])
  const activeClass = classes.find((row) => row.courseId === courseId)

  function mutate(fn: (draft: ClassCenterData) => void) {
    update((draft) => fn(draft.academics.classCenter))
  }

  if (courseId) {
    if (!activeClass) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Archive className="size-8 text-muted-foreground" />
            <div>
              <h2 className="font-display text-2xl font-bold">Class not found</h2>
              <p className="mt-1 text-sm text-muted-foreground">It may have been archived or deleted.</p>
            </div>
            <Button asChild><Link to="/academics">Back to Class Center</Link></Button>
          </CardContent>
        </Card>
      )
    }
    const activeCourse = courses.find((course) => course.id === activeClass.courseId)
    if (!activeCourse) return null
    return <ClassHub course={activeCourse} workspace={activeClass} data={data} persons={persons} />
  }

  return (
    <ClassCenterDashboard
      data={viewData}
      persons={persons}
      recommendations={academicsNextActions(store, { limit: 3 })}
      currentTerm={currentTerm}
      terms={[...new Set(courses.map((course) => course.term).filter(Boolean))]}
      courses={courses}
      mutate={mutate}
      updateAll={update}
      archiveOnly={archiveOnly}
    />
  )
}

function ClassCenterDashboard({
  data, persons, recommendations, currentTerm, terms, courses, mutate, updateAll, archiveOnly,
}: {
  data: ClassCenterViewData
  persons: Person[]
  recommendations: Recommendation[]
  currentTerm: string
  terms: string[]
  courses: Course[]
  mutate: (fn: (draft: ClassCenterData) => void) => void
  updateAll: (fn: (draft: import('@/lib/types').AppData) => void) => void
  archiveOnly: boolean
}) {
  const navigate = useNavigate()
  // A first-run profile has no confirmed term yet. The store uses this same
  // fallback when it synchronizes current-term workspaces; using it here keeps
  // a cold syllabus import from creating a Course whose workspace is then
  // immediately pruned as "outside the current term."
  const activeTerm = currentTerm || inferAcademicTerm()
  const [semester, setSemester] = useState(archiveOnly ? 'Archived' : activeTerm)
  const [query, setQuery] = useState('')
  const [previewCourseId, setPreviewCourseId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<RecordOpenMode>('peek')
  const [editor, setEditor] = useState<{ open: boolean; courseId?: string; form: ClassFormState; source?: 'manual' | 'syllabus' }>({
    open: false,
    form: emptyClassForm(),
  })
  const [syllabusDraft, setSyllabusDraft] = useState<{ proposal: SyllabusProposal; files: File[] } | null>(null)
  const [syllabusReviewForm, setSyllabusReviewForm] = useState<(ClassFormState & { type: ClassWorkspaceType }) | null>(null)
  const [syllabusImportOpen, setSyllabusImportOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const view = searchParams.get('classView') === 'list' ? 'list' : 'cards'
  const setView = (nextView: 'cards' | 'list') => {
    const next = new URLSearchParams(searchParams)
    if (nextView === 'cards') next.delete('classView')
    else next.set('classView', nextView)
    setSearchParams(next, { replace: true })
  }
  const scopedCourseId = searchParams.get('importFor')
  const scopedCourse = scopedCourseId ? courses.find((course) => course.id === scopedCourseId) : undefined
  useEffect(() => {
    if (scopedCourseId !== 'new') return
    setSyllabusDraft(null)
    setSyllabusImportOpen(true)
  }, [scopedCourseId])
  /** A second import into a class that ALREADY holds syllabus-derived records is
   *  a re-import, whether or not the URL says so.
   *
   *  This used to read the `reimport=1` flag alone, and only the "Re-import" action
   *  on an existing file row ever set it. Coming in through the ordinary "Import
   *  syllabus" entry — which is what the Class Center's own recommendation card
   *  links to — ran the plain add path and appended a second copy of everything:
   *  6 assignments became 12, including two `Midterm Exam 1` rows carrying
   *  DIFFERENT dates. The student is then reading a class with two conflicting
   *  midterms and no indication which is real.
   *
   *  The diff machinery for this already existed and was already tested; it was
   *  simply never reached. Deciding from the data rather than the URL means the
   *  keep/accept review appears whenever there is something to lose. */
  const scopedHasSyllabusData = Boolean(scopedCourse) && (
    data.topics.some((item) => item.courseId === scopedCourse?.id)
    || data.assignments.some((item) => item.courseId === scopedCourse?.id)
    || data.gradeCategories.some((item) => item.courseId === scopedCourse?.id)
    || data.assignedReadings.some((item) => item.courseId === scopedCourse?.id)
    || Boolean(data.workspaces.find((item) => item.courseId === scopedCourse?.id)?.syllabusSchedule?.length)
    || data.files.some((item) => item.courseId === scopedCourse?.id && item.type === 'syllabus')
  )
  const reimporting = Boolean(scopedCourse)
    && (searchParams.get('reimport') === '1' || scopedHasSyllabusData)
  const reimportFileId = searchParams.get('reimportFile') ?? undefined
  const [draggedClassId, setDraggedClassId] = useState<string | null>(null)
  const [dragOverClassId, setDragOverClassId] = useState<string | null>(null)
  const semesters = useMemo(() => {
    const list = Array.from(new Set([activeTerm, ...terms, ...data.classes.map((row) => row.semester)])).filter(Boolean)
    return archiveOnly ? ['Archived'] : list
  }, [activeTerm, archiveOnly, data.classes, terms])
  const filtered = data.classes
    .filter((row) => {
      if (archiveOnly || semester === 'Archived') return row.status === 'archived'
      if (semester === 'All active') return row.status === 'active'
      return row.status === 'active' && row.semester === semester
    })
    .filter((row) => `${row.courseCode} ${row.courseTitle} ${row.nickname ?? ''} ${row.instructor ?? ''}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.order - b.order)
  const activeClasses = data.classes.filter((row) => row.status === 'active')
  const hasSearch = Boolean(query.trim())

  async function importSyllabus(form: ClassFormState, selectedFiles: File[], proposal?: SyllabusProposal, existingCourseId?: string, reimportDecisions?: ReimportDecision[], replaceSyllabusFileId?: string) {
    const now = Date.now()
    const courseId = existingCourseId ?? uid()
    // A shared candidate is extracted structure only, never a remote source
    // document. It therefore creates no synthetic local file on apply.
    const sourceFiles = selectedFiles.length ? selectedFiles : proposal && proposal.sourceKind !== 'shared'
      ? [new File([proposal.text], `${proposal.sourceName}.txt`, { type: 'text/plain' })] : []
    const retained = await Promise.all(sourceFiles.map(async (file) => {
      const id = uid()
      return { file, id, blobRef: await retainLocalSyllabus(file, id) }
    }))
    const syllabusFileId = replaceSyllabusFileId ?? retained[0]?.id
    const sourceFileIdForItem = (item: SyllabusProposal['items'][number]) => {
      const index = retained.findIndex(({ file }) => file.name === item.evidence.sourceName)
      if (index < 0) return syllabusFileId
      return replaceSyllabusFileId && index === 0 ? replaceSyllabusFileId : retained[index].id
    }
    const sourceType = selectedFiles.length ? 'upload' as const : proposal?.sourceKind === 'text' ? 'paste' as const : 'upload' as const
    const linkedFileIdsForItem = (item: SyllabusProposal['items'][number]) => {
      const fileId = sourceFileIdForItem(item)
      return fileId ? [fileId] : []
    }
    updateAll((draft) => {
      if (!existingCourseId) draft.courses.push({
        id: courseId, code: form.courseCode.trim() || 'NEW 101', title: form.courseTitle.trim() || 'Untitled class',
        term: form.semester, credits: 3, grade: '', bcpm: false, status: 'in-progress', inResidence: true,
        satisfies: [], order: draft.courses.length,
      })
      const center = draft.academics.classCenter
      if (!existingCourseId) center.workspaces.push({ ...workspaceFields(form), id: uid(), courseId, createdAt: now, updatedAt: now, order: center.workspaces.length })
      if (replaceSyllabusFileId) {
        const latest = retained[0]
        const existing = center.files.find((file) => file.id === replaceSyllabusFileId && file.courseId === courseId && file.type === 'syllabus')
        if (latest && existing) Object.assign(existing, { title: latest.file.name.replace(/\.[^.]+$/, '') || latest.file.name, sourceType, url: '', blobRef: latest.blobRef, fileName: latest.file.name, mimeType: latest.file.type, updatedAt: now })
        retained.slice(1).forEach(({ file, id, blobRef }) => center.files.unshift({
          id, courseId, title: file.name.replace(/\.[^.]+$/, '') || file.name, type: 'syllabus', sourceType, owner: 'course', url: '', blobRef,
          fileName: file.name, mimeType: file.type, notes: '', linkedTopicIds: [], createdAt: now, updatedAt: now, order: center.files.length,
        }))
      } else retained.forEach(({ file, id, blobRef }) => center.files.unshift({
        id, courseId, title: file.name.replace(/\.[^.]+$/, '') || file.name, type: 'syllabus', sourceType, owner: 'course', url: '', blobRef,
        fileName: file.name, mimeType: file.type, notes: '', linkedTopicIds: [], createdAt: now, updatedAt: now, order: center.files.length,
      }))
      if (proposal && existingCourseId && reimportDecisions) {
        applyAcceptedReimport(center, courseId, proposal, reimportDecisions, syllabusFileId, now)
      } else if (proposal) {
        const evidenceByFile = new Map<string, SyllabusProposal['items']>()
        proposal.items.forEach((item) => {
          const fileId = sourceFileIdForItem(item)
          if (!fileId) return
          evidenceByFile.set(fileId, [...(evidenceByFile.get(fileId) ?? []), item])
        })
        evidenceByFile.forEach((items, fileId) => persistConfirmedSyllabusEvidence(center, courseId, fileId, items, now))
        proposal.items.filter((item) => item.kind === 'standards').forEach((item, index) => center.topics.push({
          id: uid(), courseId, title: item.label, syllabusSourceKey: syllabusTopicSourceKey(item.label), unit: '', basis: 'syllabus-standard', status: 'not-started', fsrs: createTopicFsrsState(), confidence: 3, sourceNoteIds: [], linkedFileIds: linkedFileIdsForItem(item), createdAt: now, updatedAt: now, order: index,
        }))
        proposal.items.filter((item) => item.kind === 'exams' || item.kind === 'deadlines').forEach((item, index) => center.assignments.push({
          id: uid(), courseId, title: item.label, syllabusSourceKey: syllabusAssignmentSourceKey(item.label, item.value), type: item.kind === 'exams' ? 'exam' : 'other', dueDate: item.value, status: 'not-started', linkedTopicIds: [], linkedFileIds: linkedFileIdsForItem(item), notes: `Source: ${item.evidence.location} — “${item.evidence.quote}”`, createdAt: now, updatedAt: now, order: index,
        }))
        proposal.items.filter((item) => item.kind === 'weights').forEach((item, index) => center.gradeCategories.push({
          id: uid(), courseId, name: item.label || 'Untitled category', syllabusSourceKey: syllabusCategorySourceKey(item.label), weight: Number(item.value?.replace('%', '')) || 0,
          source: `${item.evidence.location} — “${item.evidence.quote}”`, createdAt: now, updatedAt: now, order: index,
        }))
        proposal.items.filter((item) => item.kind === 'readings').forEach((item, index) => center.assignedReadings.push({
          id: uid(), courseId, week: item.context ?? 'Unscheduled', title: item.label,
          syllabusSourceKey: syllabusReadingSourceKey(item.label, item.context, item.value),
          source: `${item.evidence.location} — “${item.evidence.quote}”`, status: 'not-started', dueForDiscussion: item.value,
          createdAt: now, updatedAt: now, order: index,
        }))
        const workspace = center.workspaces.find((item) => item.courseId === courseId)
        if (workspace) workspace.syllabusSchedule = proposal.items.filter((item) => item.kind === 'units').map((item, index) => ({
          id: uid(), week: item.context ?? 'Unscheduled', label: item.label, startDate: item.value,
          source: `${item.evidence.location} — “${item.evidence.quote}”`, order: index,
        }))
        if (workspace && proposal.items.some((item) => item.kind === 'readings')) workspace.readingListState = 'complete'
        // Preserve document order and prefer the first credible header fact.
        // Later exam prose can say "same location as class meetings" without
        // supplying the class location.
        const logistics = proposal.items.filter((item) => item.kind === 'logistics').map((item) => item.label || item.evidence.quote)
        const classLogistics = logistics.filter((line) => !isOfficeHoursLine(line))
        const logisticsText = classLogistics.join(' ')
        if (workspace && logisticsText) {
          if (!workspace.instructor) {
            workspace.instructor = extractInstructor(logistics) || workspace.instructor
          }
          if (!workspace.meetingDays) workspace.meetingDays = extractClassMeetingDays(logisticsText) || workspace.meetingDays
          if (!workspace.meetingTime) workspace.meetingTime = extractClassMeetingTime(logisticsText) || workspace.meetingTime
          if (!workspace.location) {
            const locationLine = classLogistics.find((line) => /\b(?:room|location|hall|center|building)\b/i.test(line) && !/same location as class meetings/i.test(line))
            workspace.location = extractClassLocation(locationLine) || workspace.location
          }
        }
      }
    })
    setSyllabusImportOpen(false)
    if (existingCourseId) { const next = new URLSearchParams(searchParams); next.delete('importFor'); next.delete('reimport'); next.delete('reimportFile'); setSearchParams(next, { replace: true }) }
  }

  /** §4.1-M-d: a non-syllabus file belongs in Materials only after the
   * student selected its real course. It cannot create a synthetic course. */
  async function fileMisfiledMaterial(selectedFiles: File[], proposal: SyllabusProposal, courseId: string) {
    const sourceFiles = selectedFiles.length
      ? selectedFiles
      : [new File([proposal.text], `${proposal.sourceName}.txt`, { type: 'text/plain' })]
    const retained = await Promise.all(sourceFiles.map(async (file) => {
      const id = uid()
      return { file, id, blobRef: await retainLocalMaterial(file, id) }
    }))
    const now = Date.now()
    updateAll((draft) => {
      if (!draft.courses.some((course) => course.id === courseId)) return
      const center = draft.academics.classCenter
      retained.forEach(({ file, id, blobRef }) => center.files.unshift({
        id,
        courseId,
        title: file.name.replace(/\.[^.]+$/, '') || file.name,
        type: 'other',
        sourceType: proposal.sourceKind === 'text' ? 'paste' : 'upload',
        owner: 'course',
        url: '',
        blobRef,
        fileName: file.name,
        mimeType: file.type,
        notes: '',
        linkedTopicIds: [],
        createdAt: now,
        updatedAt: now,
        order: center.files.length,
      }))
    })
    setSyllabusImportOpen(false)
    navigate(`/academics/classes/${courseId}?classTab=materials`)
  }

  // §4.1-M-a: scoped re-import remains a temporary full-screen review flow.
  // The cold Add class path uses the focused import dialog below, then hands
  // off to the editable class-details sheet before anything is saved.
  function clearImportRoute() {
    const next = new URLSearchParams(searchParams)
    next.delete('importFor'); next.delete('reimport'); next.delete('reimportFile')
    setSearchParams(next, { replace: true })
  }

  function exitImport() {
    setSyllabusImportOpen(false)
    if (scopedCourseId) clearImportRoute()
  }

  if (scopedCourse) {
    return <SyllabusImportMode
      semester={semester}
      scopedCourse={scopedCourse}
      reimport={reimporting}
      reimportFileId={reimportFileId}
      current={{
        topics: data.topics.filter((item) => item.courseId === scopedCourse?.id),
        assignments: data.assignments.filter((item) => item.courseId === scopedCourse?.id),
        categories: data.gradeCategories.filter((item) => item.courseId === scopedCourse?.id),
        readings: data.assignedReadings.filter((item) => item.courseId === scopedCourse?.id),
        schedule: data.workspaces.find((item) => item.courseId === scopedCourse?.id)?.syllabusSchedule ?? [],
      }}
      onExit={exitImport}
      onImport={(form, files, proposal, courseId, decisions, replaceFileId) => importSyllabus(
        // Syllabus import owns a separate confirmation flow. Preserve its
        // established workspace shape here; the manual add dialog below is
        // the only surface this fidelity pass changes.
        { ...emptyClassForm(form.semester), type: 'stem', courseCode: form.courseCode, courseTitle: form.courseTitle },
        files, proposal, courseId, decisions, replaceFileId,
      )}
      onFileMaterial={fileMisfiledMaterial}
    />
  }

  function openColdSyllabusImport() {
    setSyllabusDraft(null)
    setSyllabusReviewForm(null)
    setSyllabusImportOpen(true)
  }

  function handleColdSyllabusParsed(proposal: SyllabusProposal, files: File[]) {
    setSyllabusDraft({ proposal, files })
    setSyllabusImportOpen(false)
    setEditor({ open: true, source: 'syllabus', form: classFormFromSyllabus(proposal, semester) })
  }

  function stageImportedClassReview(type: ClassWorkspaceType) {
    if (!syllabusDraft) return
    setSyllabusReviewForm({ ...editor.form, type })
    setEditor((current) => ({ ...current, open: false }))
  }

  async function finishImportedClass(
    reviewedClass: { courseCode: string; courseTitle: string; semester: string },
    files: File[],
    proposal?: SyllabusProposal,
  ) {
    if (!syllabusReviewForm || !proposal) return
    await importSyllabus({ ...syllabusReviewForm, ...reviewedClass }, files, proposal)
    setSyllabusDraft(null)
    setSyllabusReviewForm(null)
    setEditor({ open: false, form: emptyClassForm(semester) })
    if (scopedCourseId === 'new') clearImportRoute()
  }

  function backToImportedClassDetails(reviewedProposal: SyllabusProposal) {
    if (!syllabusDraft || !syllabusReviewForm) return
    const form = syllabusReviewForm
    setSyllabusDraft({ ...syllabusDraft, proposal: reviewedProposal })
    setSyllabusReviewForm(null)
    setEditor({ open: true, source: 'syllabus', form })
  }

  function backToColdImport() {
    setEditor((current) => ({ ...current, open: false }))
    setSyllabusDraft(null)
    setSyllabusReviewForm(null)
    setSyllabusImportOpen(true)
  }

  if (syllabusReviewForm && syllabusDraft) {
    return (
      <SyllabusImportMode
        semester={syllabusReviewForm.semester}
        initialProposal={syllabusDraft.proposal}
        initialFiles={syllabusDraft.files}
        initialCourse={{
          courseCode: syllabusReviewForm.courseCode,
          courseTitle: syllabusReviewForm.courseTitle,
          semester: syllabusReviewForm.semester,
          type: syllabusReviewForm.type,
        }}
        onBackFromReview={backToImportedClassDetails}
        onExit={() => {
          setSyllabusDraft(null)
          setSyllabusReviewForm(null)
          if (scopedCourseId === 'new') clearImportRoute()
        }}
        onImport={finishImportedClass}
      />
    )
  }

  if (!archiveOnly && activeClasses.length === 0) {
    return (
      <>
        <div className="academics-empty-wrap">
          <div className="academics-empty-card">
            {/*
              Literal port of academics-empty-states-prototype.html Variant A.
              Keep the cold-start workspace as one composed card: a centered
              syllabus action, then the concrete records the import will set up.
              The dialog/detail handoff remains owned by SyllabusImportDialog
              and ClassEditorDialog; this surface only starts that flow.
            */}
            <div className="academics-empty-primary" role="note" aria-label="Start with a syllabus">
              <img
                className="academics-empty-mascot"
                src="/mascot.png"
                alt=""
                aria-hidden="true"
              />
              <div>
                <p className="academics-empty-title">Start with a syllabus</p>
                <p className="academics-empty-copy">Import it, review the extracted details, then add the class.</p>
              </div>
              <div className="academics-empty-actions">
                <Button className="academics-empty-primary-action" onClick={openColdSyllabusImport}>
                  <Upload className="size-4" /> Import a syllabus
                </Button>
                <button
                  type="button"
                  onClick={() => setEditor({ open: true, source: 'manual', form: emptyClassForm(semester) })}
                  className="academics-empty-manual"
                >
                  Add manually
                </button>
              </div>
            </div>
            <section aria-label="What this sets up" className="academics-empty-setup">
              <div className="academics-empty-setup-header">
                <p className="academics-empty-setup-title">What this sets up</p>
                <p className="academics-empty-setup-subtitle">one import, then you stay in control</p>
              </div>
              <div className="academics-empty-setup-list">
                {([
                  [NotebookText, 'Class details', 'Course, instructor, meetings, office hours.'],
                  [CalendarDays, 'Dates and deadlines', 'Exams, assignments, readings, and due dates.'],
                  [BarChart3, 'Grade structure', 'Categories and weights, checked to total 100%.'],
                ] as const).map(([Icon, title, detail]) => (
                  <div key={title} className="academics-empty-setup-row">
                    <span className="academics-empty-setup-icon">
                      <Icon className="size-3.5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="academics-empty-setup-row-title">{title}</p>
                      <p className="academics-empty-setup-row-detail">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="academics-empty-honest">
                If part of the syllabus can’t be read, we keep what worked and show exactly what needs manual entry.
              </p>
            </section>
          </div>
        </div>
        <ClassEditorDialog
          key={editor.open ? 'create-open' : 'create-closed'}
          open={editor.open}
          title={editor.source === 'syllabus' ? 'Review class details' : 'Create class'}
          isCreate
          form={editor.form}
          syllabusProposal={editor.source === 'syllabus' ? syllabusDraft?.proposal : undefined}
          confirmLabel={editor.source === 'syllabus' ? 'Review syllabus records' : undefined}
          onOpenChange={(open) => {
            setEditor((prev) => ({ ...prev, open }))
            if (!open && editor.source === 'syllabus') { setSyllabusDraft(null); setSyllabusReviewForm(null) }
            if (!open && scopedCourseId === 'new') clearImportRoute()
          }}
          onChange={(patch) => setEditor((prev) => ({ ...prev, form: { ...prev.form, ...patch } }))}
          onSave={(type) => editor.source === 'syllabus' ? stageImportedClassReview(type) : saveClass(type)}
          onSaveAndImport={editor.source === 'syllabus' ? undefined : (type) => saveClass(type, true)}
          onBackToImport={editor.source === 'syllabus' ? backToColdImport : undefined}
        />
        <SyllabusImportDialog
          open={syllabusImportOpen}
          semester={semester}
          onOpenChange={(open) => { setSyllabusImportOpen(open); if (!open && scopedCourseId === 'new') clearImportRoute() }}
          onParsed={handleColdSyllabusParsed}
          onManual={() => { setSyllabusImportOpen(false); setSyllabusDraft(null); setEditor({ open: true, source: 'manual', form: emptyClassForm(semester) }) }}
        />
      </>
    )
  }

  function saveClass(type: ClassWorkspaceType, openImportAfterCreate = false) {
    const now = Date.now()
    const form = { ...editor.form, type }
    if (!form.courseCode.trim() && !form.courseTitle.trim()) return
    let createdCourseId: string | undefined
    updateAll((draft) => {
      if (editor.courseId) {
        const course = draft.courses.find((item) => item.id === editor.courseId)
        const workspace = draft.academics.classCenter.workspaces.find((item) => item.courseId === editor.courseId)
        if (course) Object.assign(course, {
          code: form.courseCode.trim(),
          title: form.courseTitle.trim(),
          term: form.semester,
        })
        if (workspace) Object.assign(workspace, workspaceFields(form), { updatedAt: now })
      } else {
        const courseId = uid()
        createdCourseId = courseId
        draft.courses.push({
          id: courseId,
          code: form.courseCode.trim() || 'NEW 101',
          title: form.courseTitle.trim() || 'Untitled class',
          term: form.semester,
          credits: 3,
          grade: '',
          bcpm: false,
          status: 'in-progress',
          inResidence: true,
          satisfies: [],
          order: draft.courses.length,
        })
        draft.academics.classCenter.workspaces.push({
          ...workspaceFields(form),
          id: uid(),
          courseId,
          createdAt: now,
          updatedAt: now,
          order: draft.academics.classCenter.workspaces.length,
        })
      }
    })
    setEditor({ open: false, form: emptyClassForm(semester === 'Archived' || semester === 'All active' ? 'Fall 2026' : semester) })
    if (scopedCourseId === 'new' && !openImportAfterCreate) clearImportRoute()
    if (openImportAfterCreate && createdCourseId) {
      const next = new URLSearchParams(searchParams)
      next.set('importFor', createdCourseId)
      setSearchParams(next)
    }
  }

  function moveClass(targetId: string) {
    if (!draggedClassId || draggedClassId === targetId) return
    const visibleIds = filtered.map((row) => row.id)
    const from = visibleIds.indexOf(draggedClassId)
    const to = visibleIds.indexOf(targetId)
    if (from < 0 || to < 0) return
    const nextVisibleIds = [...visibleIds]
    const [moved] = nextVisibleIds.splice(from, 1)
    nextVisibleIds.splice(to, 0, moved)
    mutate((draft) => reorderClasses(draft, nextVisibleIds))
  }

  return (
    <div className="space-y-5">
      <div className="academics-filter-bar flex flex-col gap-3 border border-border bg-card px-4 py-3 lg:flex-row lg:items-center lg:px-6">
        <Select
          value={semester}
          onValueChange={(value) => {
            setSemester(value)
            if (!archiveOnly) updateAll((draft) => { draft.profile.startTerm = value })
          }}
        >
          <SelectTrigger className="w-full lg:w-44"><CalendarDays className="size-4" /><SelectValue /></SelectTrigger>
          <SelectContent>
            {semesters.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Find a class, note, topic…" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <span className="whitespace-nowrap text-sm font-bold text-muted-foreground">{filtered.length} {filtered.length === 1 ? 'class' : 'classes'}</span>
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(value) => value && setView(value as 'cards' | 'list')}
          variant="outline"
          aria-label="Class view"
        >
          <ToggleGroupItem value="cards" aria-label="Card view"><Grid2X2 className="size-4" /> Cards</ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view"><List className="size-4" /> List</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {!archiveOnly && <SmartActionPanel className="academics-heads-up" title="Heads up" recommendations={recommendations} />}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>{archiveOnly ? 'Archived classes' : 'Your classes'}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{semester}</p>
          </div>
          {!archiveOnly && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{filtered.length} active</Badge>
              <Button size="sm" onClick={openColdSyllabusImport}>
                <Plus className="size-4" /> Add class
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className={cn(view === 'cards'
            ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4'
            : 'space-y-2')}>
            {filtered.map((row) => (
              <ClassCard
                key={row.id}
                row={row}
                data={data}
                compact={view === 'list'}
                dragging={draggedClassId === row.id}
                dragOver={dragOverClassId === row.id && draggedClassId !== row.id}
                onPreview={() => setPreviewCourseId(row.id)}
                onOpen={() => navigate(`/academics/classes/${row.id}`)}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', row.id)
                  setDraggedClassId(row.id)
                }}
                onDragOver={(event) => {
                  if (!draggedClassId || draggedClassId === row.id) return
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                  setDragOverClassId(row.id)
                }}
                onDragLeave={() => setDragOverClassId((current) => current === row.id ? null : current)}
                onDrop={(event) => {
                  event.preventDefault()
                  moveClass(row.id)
                  setDraggedClassId(null)
                  setDragOverClassId(null)
                }}
                onDragEnd={() => {
                  setDraggedClassId(null)
                  setDragOverClassId(null)
                }}
                onEdit={() => setEditor({ open: true, courseId: row.id, form: classToForm(row) })}
                onImport={() => { const next = new URLSearchParams(searchParams); next.set('importFor', row.id); setSearchParams(next) }}
                onDelete={() => {
                  if (!window.confirm(`Delete ${row.courseCode || row.courseTitle}?`)) return
                  let blobRefs: string[] = []
                  updateAll((draft) => {
                    draft.courses = draft.courses.filter((item) => item.id !== row.id)
                    blobRefs = removeCourseCascade(draft.academics.classCenter, row.id).blobRefs
                  })
                  void Promise.allSettled(blobRefs.map((blobRef) => removeLocalBlob(blobRef)))
                }}
                onArchive={() => mutate((draft) => {
                  const item = draft.workspaces.find((course) => course.courseId === row.id)
                  if (item) {
                    item.status = item.status === 'archived' ? 'active' : 'archived'
                    item.updatedAt = Date.now()
                  }
                })}
              />
            ))}
          </div>
          {!filtered.length && (
            <div className="py-10 text-center">
              <BookOpen className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-display text-xl font-bold">{hasSearch ? 'No classes match this search' : 'No classes here yet'}</p>
              <p className="mt-1 text-sm text-muted-foreground">{hasSearch ? 'Try another course code, title, or instructor.' : 'Add a class or choose another term.'}</p>
              {hasSearch && <Button size="sm" variant="outline" className="mt-4" onClick={() => setQuery('')}>Clear search</Button>}
            </div>
          )}
        </CardContent>
      </Card>

      {!archiveOnly && (
        <AcademicsBento
          data={data}
          classes={activeClasses}
          persons={persons}
          courses={courses}
          onOpenClass={(courseId) => navigate(`/academics/classes/${courseId}`)}
          onOpenExamPlan={(courseId, assignmentId) => navigate(`/academics/classes/${courseId}?classTab=overview&examPrep=${assignmentId}`)}
        />
      )}

      <ClassEditorDialog
        key={`${editor.courseId ?? 'create'}-${editor.open ? 'open' : 'closed'}`}
        open={editor.open}
        title={editor.courseId ? 'Edit class' : editor.source === 'syllabus' ? 'Review class details' : 'Create class'}
        isCreate={!editor.courseId}
        form={editor.form}
        syllabusProposal={editor.source === 'syllabus' ? syllabusDraft?.proposal : undefined}
        confirmLabel={editor.source === 'syllabus' ? 'Review syllabus records' : undefined}
        onOpenChange={(open) => {
          setEditor((prev) => ({ ...prev, open }))
          if (!open && editor.source === 'syllabus') { setSyllabusDraft(null); setSyllabusReviewForm(null) }
          if (!open && scopedCourseId === 'new') clearImportRoute()
        }}
        onChange={(patch) => setEditor((prev) => ({ ...prev, form: { ...prev.form, ...patch } }))}
        onSave={(type) => editor.source === 'syllabus' ? stageImportedClassReview(type) : saveClass(type)}
        onSaveAndImport={editor.courseId || editor.source === 'syllabus' ? undefined : (type) => saveClass(type, true)}
        onBackToImport={editor.source === 'syllabus' ? backToColdImport : undefined}
      />

      <SyllabusImportDialog
        open={syllabusImportOpen}
        semester={semester}
        onOpenChange={(open) => { setSyllabusImportOpen(open); if (!open && scopedCourseId === 'new') clearImportRoute() }}
        onParsed={handleColdSyllabusParsed}
        onManual={() => { setSyllabusImportOpen(false); setSyllabusDraft(null); setEditor({ open: true, source: 'manual', form: emptyClassForm(semester) }) }}
      />

      <CenterPeek
        open={Boolean(previewCourseId)}
        mode={previewMode}
        label={`${data.classes.find((row) => row.id === previewCourseId)?.courseCode ?? 'Class'} preview`}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewCourseId(null)
            setPreviewMode('peek')
          }
        }}
        onModeChange={setPreviewMode}
        onExpand={() => {
          if (!previewCourseId) return
          const courseId = previewCourseId
          setPreviewCourseId(null)
          setPreviewMode('peek')
          navigate(`/academics/classes/${courseId}`)
        }}
      >
        {(() => {
          const row = data.classes.find((item) => item.id === previewCourseId)
          if (!row) return null
          return (
            <ClassPreview
              row={row}
              data={data}
              onOpen={() => {
                setPreviewCourseId(null)
                setPreviewMode('peek')
                navigate(`/academics/classes/${row.id}`)
              }}
            />
          )
        })()}
      </CenterPeek>

    </div>
  )
}

export function ClassCard({
  row, data, compact, dragging, dragOver, onPreview, onOpen,
  onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd, onEdit, onImport, onArchive, onDelete,
}: {
  row: ClassWorkspaceView
  data: ClassCenterViewData
  compact: boolean
  dragging: boolean
  dragOver: boolean
  onPreview: () => void
  onOpen: () => void
  onDragStart: (event: DragEvent<HTMLElement>) => void
  onDragOver: (event: DragEvent<HTMLElement>) => void
  onDragLeave: () => void
  onDrop: (event: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
  onEdit: () => void
  onImport: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  const [actionHovered, setActionHovered] = useState(false)
  const stats = classStats(row.id, data)
  const nextText = stats.nextDeadline?.title
    ? `${stats.nextDeadline.title}${stats.nextDeadline.dueDate ? ` · ${assignmentDateLabel(stats.nextDeadline)}` : ''}`
    : 'No deadline scheduled'
  const percent = coursePercent(row.id, data)
  const signal = classSignal(row, data, stats, nextText)

  function openFromCard(event: MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest('button,a,[role="menuitem"]')) return
    onPreview()
  }

  const card = (
    <Card
      draggable
      role="button"
      tabIndex={0}
      aria-label={`Preview ${row.courseCode || row.nickname || 'Untitled class'} ${row.courseTitle}`}
      onClick={openFromCard}
      onKeyDown={(event) => {
        if ((event.target as HTMLElement).closest('button,a,[role="menuitem"]')) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onPreview()
        }
      }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={cardAccentVars(row.color)}
      className={cn(
        'academics-class-card group/class relative self-start cursor-pointer overflow-hidden shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none',
        actionHovered && 'action-hovered',
        compact ? 'min-h-0' : 'min-h-0',
        dragging && 'scale-[0.98] opacity-55',
        dragOver && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <span className={cn(
        'academics-class-bar absolute inset-y-0 left-0 w-1 origin-left scale-x-0 transition-transform duration-150 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none',
        'bg-[var(--class-accent)]',
        !actionHovered && 'group-hover/class:scale-x-100',
      )} aria-hidden="true" />
      <CardContent className={cn(
        compact
          ? 'grid items-center gap-4 p-3 md:grid-cols-[minmax(0,1.2fr)_auto_minmax(160px,.7fr)_auto]'
          : 'flex min-h-0 flex-col gap-3 p-3',
      )}>
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-display text-[15.5px] font-bold leading-tight">
              <span className="size-2 shrink-0 rounded-[3px] bg-[var(--class-accent)]" aria-hidden="true" />
              <span>{row.courseCode || row.nickname || 'Untitled class'}</span>
            </p>
            <p className="mt-0.5 line-clamp-1 text-[10.5px] font-semibold text-muted-foreground">{row.courseTitle || row.nickname || 'Add class details'}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className={cn('font-display text-lg font-extrabold leading-none', gradeTone(row.grade))}>{row.grade || '—'}</p>
            {percent != null && <p className="mt-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">{percent}%</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {stats.materialCount > 0 && <Badge className="px-2 py-0 text-[9.5px] font-extrabold" variant="secondary">{stats.materialCount} materials</Badge>}
          {stats.processingCount > 0 && (
            <Badge className="px-2 py-0 text-[9.5px] font-extrabold" variant="muted" aria-live="polite">
              <Loader2 className="size-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              {stats.processingCount} processing
            </Badge>
          )}
          {stats.failedCount > 0 && (
            <Badge className="px-2 py-0 text-[9.5px] font-extrabold" variant="danger" title="Some material could not be processed. Open the class to retry.">
              <AlertTriangle className="size-3" aria-hidden="true" />
              {stats.failedCount} failed
            </Badge>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="flex min-h-4 items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground">
            {signal.verb && <span className="rounded-md bg-[color-mix(in_srgb,var(--class-accent)_18%,transparent)] px-1.5 py-0.5 font-display text-[9.5px] font-extrabold tracking-wide text-[var(--class-accent)]">{signal.verb}</span>}
            {signal.text && <span>{signal.text}</span>}
          </p>
          {stats.topicCount > 0 && (
            <Progress
              value={(stats.coveredCount / stats.topicCount) * 100}
              className="h-[5px] border-0 bg-background/80"
              indicatorClassName="bg-[var(--class-accent)]"
              aria-label={`${stats.coveredCount} of ${stats.topicCount} topics have linked material`}
            />
          )}
        </div>

        <div className={cn('border-t border-border pt-2', compact && 'md:border-l md:border-t-0 md:pl-4 md:pt-0')}>
          <p className="min-h-4 text-[10.5px] font-bold text-muted-foreground">
            <span className={cn(!actionHovered && 'group-hover/class:hidden')}>{nextText}</span>
            <span className={cn('hidden font-display font-extrabold text-[var(--class-accent)]', !actionHovered && 'group-hover/class:inline')}>Open class hub →</span>
          </p>
          <div
            className="mt-2 flex items-center justify-end gap-2"
            onPointerEnter={() => setActionHovered(true)}
            onPointerLeave={() => setActionHovered(false)}
          >
            <Button
              size="sm"
              variant="outline"
              className="h-9 flex-1 border-[var(--class-accent-75)] bg-[color-mix(in_srgb,var(--class-accent)_72%,transparent)] font-display font-extrabold text-white shadow-[0_8px_18px_-14px_var(--class-accent-75)] motion-safe:transition-[opacity,background-color,transform] hover:bg-[color-mix(in_srgb,var(--class-accent)_82%,transparent)] hover:text-white active:translate-y-px md:pointer-events-none md:opacity-0 md:group-hover/class:pointer-events-auto md:group-hover/class:opacity-100 md:group-focus-within/class:pointer-events-auto md:group-focus-within/class:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
              onClick={(event) => { event.stopPropagation(); onOpen() }}
              onFocus={() => setActionHovered(true)}
              onBlur={() => setActionHovered(false)}
            >
              <ArrowUpRight className="size-4 text-white" /> Open
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Class actions" onClick={(event) => event.stopPropagation()}>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{row.courseCode || 'Class'}</DropdownMenuLabel>
                <DropdownMenuItem asChild><Link to={`/academics/classes/${row.id}`}><ArrowUpRight className="size-4" /> Open class hub</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={onImport}><Upload className="size-4" /> Import syllabus</DropdownMenuItem>
                {row.type === 'stem' && <><DropdownMenuItem asChild><Link to={`/academics/classes/${row.id}?classTab=overview&captureLecture=1`}><CheckCircle2 className="size-4" /> Add lecture transcript</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to={`/academics/classes/${row.id}?classTab=materials`}><NotebookText className="size-4" /> Create study resources</Link></DropdownMenuItem></>}
                <DropdownMenuItem onClick={onEdit}><Edit3 className="size-4" /> Class settings</DropdownMenuItem>
                <DropdownMenuItem onClick={onArchive}><Archive className="size-4" /> {row.status === 'archived' ? 'Restore' : 'Archive'}</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="size-4" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{card}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={onOpen}><ArrowUpRight className="size-4" /> Open class hub</ContextMenuItem>
        <ContextMenuItem onSelect={onImport}><Upload className="size-4" /> Import syllabus</ContextMenuItem>
        {row.type === 'stem' && <><ContextMenuItem asChild><Link to={`/academics/classes/${row.id}?classTab=overview&captureLecture=1`}><CheckCircle2 className="size-4" /> Add lecture transcript</Link></ContextMenuItem><ContextMenuItem asChild><Link to={`/academics/classes/${row.id}?classTab=materials`}><NotebookText className="size-4" /> Create study resources</Link></ContextMenuItem></>}
        <ContextMenuItem onSelect={onEdit}><Edit3 className="size-4" /> Class settings</ContextMenuItem>
        <ContextMenuItem onSelect={onArchive}><Archive className="size-4" /> {row.status === 'archived' ? 'Restore' : 'Archive'}</ContextMenuItem>
        <ContextMenuItem onSelect={onDelete} className="text-destructive"><Trash2 className="size-4" /> Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

function ClassPreview({ row, data, onOpen }: {
  row: ClassWorkspaceView
  data: ClassCenterViewData
  onOpen: () => void
}) {
  const stats = classStats(row.id, data)
  const next = stats.nextDeadline
  const materials = data.files.filter((file) => file.courseId === row.id)

  return (
    <div className="flex min-h-full flex-col bg-card p-5 md:p-6" style={cardAccentVars(row.color)}>
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-[3px] bg-[var(--class-accent)]" aria-hidden="true" />
            <p className="font-display text-2xl font-extrabold">{row.courseCode || row.nickname || 'Untitled class'}</p>
          </div>
          <p className="mt-1 text-sm font-bold text-muted-foreground">{row.courseTitle || 'Add class details'}</p>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">{row.instructor || 'Instructor TBD'} · {compactMeeting(row) || 'Meeting details TBD'}</p>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className={cn('font-display text-3xl font-extrabold leading-none', gradeTone(row.grade))}>{row.grade || '—'}</p>
          <p className="mt-1 text-xs font-bold text-muted-foreground">current grade</p>
        </div>
      </div>

      <div className="grid gap-3 py-5 sm:grid-cols-3">
        <Metric label="Topics with material" value={`${stats.coveredCount}/${stats.topicCount}`} />
        <Metric label="Materials" value={String(materials.length)} />
        <Metric label="Due next" value={next ? assignmentDateLabel(next) : 'None'} />
      </div>

      <div className="rounded-[13px] border border-border bg-muted p-4">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Next class action</p>
        <p className="mt-2 font-display text-lg font-extrabold">{next?.title ?? 'No dated work is waiting'}</p>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          {next ? `${assignmentDateLabel(next)}${next.weight != null ? ` · ${next.weight}%` : ''}` : 'Open the class to capture a lecture or organize course material.'}
        </p>
      </div>

      <div className="mt-auto flex justify-end pt-5">
        <Button onClick={onOpen} className="font-display font-extrabold">
          <ArrowUpRight className="size-4" /> Open Class Hub
        </Button>
      </div>
    </div>
  )
}

function AcademicsBento({
  data,
  classes,
  persons,
  courses,
  onOpenClass,
  onOpenExamPlan,
}: {
  data: ClassCenterViewData
  classes: ClassWorkspaceView[]
  persons: Person[]
  courses: Course[]
  onOpenClass: (courseId: string) => void
  onOpenExamPlan: (courseId: string, assignmentId: string) => void
}) {
  const [renderNow] = useState(() => Date.now())
  const activeIds = new Set(classes.map((row) => row.id))
  const pending = data.assignments
    .filter((assignment) =>
      activeIds.has(assignment.courseId)
      && assignment.dueDate
      && !['submitted', 'graded', 'dropped'].includes(assignment.status)
    )
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))

  return (
    <div className="academics-bento grid grid-cols-1 gap-[15px] lg:grid-cols-12">
      <RecentStudyWorkPanel data={data} classes={classes} onOpenClass={onOpenClass} />
      <ClassMaterialsPanel data={data} classes={classes} onOpenClass={onOpenClass} />
      <UpNextPanel data={data} assignments={pending} now={renderNow} onOpenClass={onOpenClass} onOpenExamPlan={onOpenExamPlan} />
      <GpaPanel courses={courses} currentTerm={classes[0]?.semester ?? ''} />
      <ContactsPanel data={data} classes={classes} persons={persons} />
      <UpcomingPanel data={data} assignments={pending} />
      <TopicCoveragePanel data={data} classes={classes} />
      <LectureJournalPanel data={data} classes={classes} />
    </div>
  )
}

/** The ranking uses only explicit weight and deadline. Missing weight stays
 * low-priority instead of receiving an invented percentage. */
function rankUpNextAssignments(assignments: ClassAssignment[], now = Date.now()): ClassAssignment[] {
  const day = 86_400_000
  const score = (item: ClassAssignment) => {
    const due = item.dueDate ? new Date(`${item.dueDate}T12:00:00`).getTime() : Number.POSITIVE_INFINITY
    const proximity = Number.isFinite(due) ? 1 / Math.max(1, (due - now) / day) : 0
    const weight = item.weight ?? (item.important ? 1 : 0)
    return weight * proximity
  }
  return [...assignments].sort((a, b) => score(b) - score(a) || String(a.dueDate).localeCompare(String(b.dueDate)) || a.order - b.order)
}

function isMajorDeliverable(item: ClassAssignment): boolean {
  return Boolean(item.important || item.type === 'exam' || item.type === 'project' || (item.weight != null && item.weight >= 15))
}

function BentoPanel({
  span,
  title,
  icon: Icon,
  actions,
  children,
}: {
  span: 4 | 5 | 7
  title: string
  icon: LucideIcon
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  const spanClass = span === 7 ? 'lg:col-span-7' : span === 5 ? 'lg:col-span-5' : 'lg:col-span-4'
  return (
    <Card className={cn(spanClass, 'academics-bento-panel min-w-0')}>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2"><Icon className="size-5 text-primary" /> {title}</CardTitle>
        </div>
        {actions}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function BentoEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted px-4 py-6 text-center text-sm font-semibold text-muted-foreground">
      {children}
    </div>
  )
}

function RecentStudyWorkPanel({
  data,
  classes,
  onOpenClass,
}: {
  data: ClassCenterViewData
  classes: ClassWorkspaceView[]
  onOpenClass: (courseId: string) => void
}) {
  const activeIds = new Set(classes.map((row) => row.id))
  const studyWork = [...data.notes]
    .filter((note) => activeIds.has(note.courseId) && (note.type === 'study-guide' || note.type === 'lecture'))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 4)

  return (
    <BentoPanel span={7} title="Recent study work" icon={NotebookText}>
      {!studyWork.length ? <BentoEmpty>Create a study outline, guide, or revised note from selected class material.</BentoEmpty> : (
        <div className="space-y-2">
          {studyWork.map((note) => (
            <button key={note.id} type="button" className="grid w-full gap-2 rounded-xl border border-border bg-muted p-3 text-left transition hover:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[auto_minmax(0,1fr)_auto]" onClick={() => onOpenClass(note.courseId)}>
              <Badge variant="outline">{classLabel(note.courseId, data)}</Badge>
              <span className="min-w-0"><span className="block truncate font-bold">{note.title}</span><span className="block truncate text-xs font-semibold text-muted-foreground">{note.type === 'study-guide' ? 'Source-backed study work' : 'Lecture note'}</span></span>
              <span className="text-xs font-extrabold text-primary">Open</span>
            </button>
          ))}
        </div>
      )}
    </BentoPanel>
  )
}

function ClassMaterialsPanel({
  data,
  classes,
  onOpenClass,
}: {
  data: ClassCenterViewData
  classes: ClassWorkspaceView[]
  onOpenClass: (courseId: string) => void
}) {
  const rows = classes.map((row) => ({
    row,
    files: data.files.filter((file) => file.courseId === row.id).length,
    lectures: data.lectures.filter((lecture) => lecture.courseId === row.id).length,
  })).sort((a, b) => (b.files + b.lectures) - (a.files + a.lectures)).slice(0, 5)

  return (
    <BentoPanel span={5} title="Class materials" icon={FolderOpen}>
      {!rows.length ? <BentoEmpty>Your imported syllabi, lecture transcripts, and attached files will appear here.</BentoEmpty> : (
        <div className="space-y-2">
          {rows.map(({ row, files, lectures }) => (
            <button key={row.id} type="button" className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-muted p-3 text-left transition hover:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onOpenClass(row.id)}>
              <span><span className="block font-bold">{row.courseCode || row.nickname || 'Untitled class'}</span><span className="block text-xs font-semibold text-muted-foreground">{lectures} {lectures === 1 ? 'lecture' : 'lectures'} · {files} {files === 1 ? 'material' : 'materials'}</span></span>
              <span className="text-xs font-extrabold text-primary">Open</span>
            </button>
          ))}
        </div>
      )}
    </BentoPanel>
  )
}

function UpNextPanel({
  data,
  assignments,
  now,
  onOpenClass,
  onOpenExamPlan,
}: {
  data: ClassCenterViewData
  assignments: ClassAssignment[]
  now: number
  onOpenClass: (courseId: string) => void
  onOpenExamPlan: (courseId: string, assignmentId: string) => void
}) {
  const ranked = rankUpNextAssignments(assignments, now)
  const item = ranked[0]
  if (!item) return (
    <BentoPanel span={7} title="Up next" icon={CalendarClock}>
      <BentoEmpty>No major dated work is pending.</BentoEmpty>
    </BentoPanel>
  )
  const topicIds = [...new Set([...(item.coveredTopicIds ?? []), ...item.linkedTopicIds])]
  const topics = data.topics.filter((topic) => topicIds.includes(topic.id))
  const withMaterial = topics.filter((topic) => (topic.linkedFileIds?.length ?? 0) || topic.sourceNoteIds.length).length
  return (
    <BentoPanel
      span={7}
      title="Up next"
      icon={TrendingUp}
      actions={<Button size="sm" onClick={() => item.type === 'exam' ? onOpenExamPlan(item.courseId, item.id) : onOpenClass(item.courseId)}>Build {item.type === 'exam' ? 'exam ' : ''}plan</Button>}
    >
      <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div>
          <p className="font-display text-4xl font-bold tabular-nums">{assignmentDateLabel(item)}</p>
          <Badge className="mt-2" variant="outline">{classLabel(item.courseId, data)}</Badge>
        </div>
        <div>
          <h3 className="font-display text-xl font-bold">{item.title}</h3>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {item.weight != null ? `Worth ${item.weight}% of the course grade` : 'Grade weight not available'}
          </p>
          {!!topics.length && <p className="mt-4 text-xs font-bold text-muted-foreground">{topics.length} syllabus {topics.length === 1 ? 'topic' : 'topics'} in scope · {withMaterial} with linked material.</p>}
        </div>
      </div>
      {!!ranked.slice(1, 4).length && (
        <div className="mt-4 flex flex-wrap gap-2">
          {ranked.slice(1, 4).map((next) => (
            <Badge key={next.id} variant="secondary">{next.title} · {assignmentDateLabel(next)}</Badge>
          ))}
        </div>
      )}
    </BentoPanel>
  )
}

function GpaPanel({ courses, currentTerm }: { courses: Course[]; currentTerm: string }) {
  const overall = gpaStats(courses)
  const term = gpaStats(courses.filter((course) => course.term === currentTerm))
  const graded = courses.filter((course) => GRADE_POINTS[course.grade] != null && course.credits > 0)
  return (
    <BentoPanel
      span={5}
      title="GPA"
      icon={BarChart3}
      actions={<Button asChild variant="link" size="sm"><Link to="/academics?mode=planning&tab=archive&gradeView=what-if">What-if →</Link></Button>}
    >
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Term" value={fmtGpa(term.cum)} />
        <Metric label="Cumulative" value={fmtGpa(overall.cum)} />
        <Metric label="Science" value={fmtGpa(overall.science)} />
      </div>
      {!graded.length && <BentoEmpty>Not enough graded work yet to calculate GPA.</BentoEmpty>}
      {!!graded.length && (
        <div className="mt-4 space-y-3">
          <GpaTrend courses={courses} currentTerm={currentTerm} />
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Contribution by course</p>
            {graded.slice(0, 4).map((course) => {
              const points = GRADE_POINTS[course.grade] ?? 0
              const contribution = overall.qualityPoints ? (points * course.credits / overall.qualityPoints) * 100 : 0
              const direction = points >= overall.cum ? 'lifting' : 'dragging'
              return (
                <div key={course.id} className="rounded-xl border border-border bg-muted px-3 py-2 text-xs font-bold">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{course.code} · {course.grade}</span>
                    <span className="text-muted-foreground">{direction}</span>
                  </div>
                  <Progress value={contribution} className="mt-2 h-1.5" aria-label={`${course.code} ${contribution.toFixed(1)}% of recorded quality points`} />
                </div>
              )
            })}
          </div>
          <p className="rounded-lg bg-primary/8 px-3 py-2 text-xs font-bold text-muted-foreground">
            {term.credits
              ? `Current term is ${Math.abs(term.cum - overall.cum).toFixed(2)} ${term.cum >= overall.cum ? 'above' : 'below'} the recorded cumulative pace.`
              : 'Current-term pace appears after a transcript-grade projection is recorded.'}
          </p>
        </div>
      )}
    </BentoPanel>
  )
}

function termOrder(label: string): number {
  const match = label.match(/(Spring|Summer|Fall|Winter)\s+(\d{4})/i)
  if (!match) return Number.MAX_SAFE_INTEGER
  const season = { spring: 0, summer: 1, fall: 2, winter: 3 }[match[1].toLowerCase() as 'spring' | 'summer' | 'fall' | 'winter']
  return Number(match[2]) * 4 + season
}

function GpaTrend({ courses, currentTerm }: { courses: Course[]; currentTerm: string }) {
  const series = [...new Set(courses.map((course) => course.term))]
    .map((term) => ({ term, stats: gpaStats(courses.filter((course) => course.term === term)) }))
    .filter((row) => row.stats.credits > 0)
    .sort((a, b) => termOrder(a.term) - termOrder(b.term))
  if (!series.length) return null
  const width = 300
  const height = 82
  const x = (index: number) => series.length === 1 ? width / 2 : 8 + index * ((width - 16) / (series.length - 1))
  const y = (value: number) => 8 + (4 - value) / 4 * (height - 16)
  const points = series.map((row, index) => `${x(index)},${y(row.stats.cum)}`)
  const currentIndex = series.findIndex((row) => row.term === currentTerm)
  const currentProjected = currentIndex >= 0 && courses.some((course) => course.term === currentTerm && course.status === 'in-progress')
  const actualEnd = currentProjected ? Math.max(0, currentIndex - 1) : series.length - 1
  const actualPoints = points.slice(0, actualEnd + 1).join(' ')
  const projectionPoints = currentProjected && currentIndex > 0 ? points.slice(currentIndex - 1, currentIndex + 1).join(' ') : ''
  return (
    <div className="rounded-xl border border-border bg-muted p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">GPA trend</p>
        {projectionPoints ? <span className="text-[10px] font-bold text-muted-foreground">dashed = projection</span> : null}
      </div>
      <svg className="mt-2 h-20 w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Recorded GPA by term">
        <line x1="8" y1={y(4)} x2={width - 8} y2={y(4)} className="stroke-border" />
        <line x1="8" y1={y(2)} x2={width - 8} y2={y(2)} className="stroke-border" />
        {actualPoints && <polyline points={actualPoints} fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {projectionPoints && <polyline points={projectionPoints} fill="none" className="stroke-primary" strokeWidth="3" strokeDasharray="6 5" strokeLinecap="round" />}
        {series.map((row, index) => <circle key={row.term} cx={x(index)} cy={y(row.stats.cum)} r="4" className="fill-card stroke-primary" strokeWidth="2" />)}
      </svg>
      <div className="flex justify-between gap-2 text-[10px] font-bold text-muted-foreground">
        <span>{series[0].term}</span>
        <span>{series.at(-1)?.term}</span>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

function ContactsPanel({
  data,
  classes,
  persons,
}: {
  data: ClassCenterViewData
  classes: ClassWorkspaceView[]
  persons: Person[]
}) {
  const activeIds = new Set(classes.map((row) => row.id))
  const personById = new Map(persons.map((person) => [person.id, person]))
  const rows = data.contacts
    .filter((contact) => activeIds.has(contact.courseId) && contact.personId)
    .flatMap((contact) => {
      const person = personById.get(contact.personId!)
      return person ? [{ contact, person }] : []
    })
  return (
    <BentoPanel span={5} title="Contacts" icon={Users}>
      {!rows.length ? <BentoEmpty>No canonical contacts are linked for this term.</BentoEmpty> : (
        <div className="space-y-1">
          {rows.map(({ contact, person }, index) => (
            <div key={contact.id}>
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-2">
                <Avatar>
                  <AvatarFallback>{initials(person.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-bold">{person.name}</p>
                  <p className="truncate text-xs font-semibold text-muted-foreground">
                    {classLabel(contact.courseId, data)} · {statusLabel(contact.role)}{contact.location ? ` · ${contact.location}` : ''}
                  </p>
                  {(contact.officeHours || /potential letter|letter requested|meet before/i.test(contact.notes ?? '')) && (
                    <Badge className="mt-1" variant="outline">
                      {contact.officeHours || contact.notes?.match(/potential letter|letter requested|meet before[^.]+/i)?.[0]}
                    </Badge>
                  )}
                </div>
                <Button asChild size="icon" variant="ghost" disabled={!person.email} aria-label={`Email ${person.name}`}>
                  <a href={person.email ? `mailto:${person.email}` : undefined}><Mail className="size-4" /></a>
                </Button>
              </div>
              {index < rows.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      )}
    </BentoPanel>
  )
}

function UpcomingPanel({ data, assignments }: { data: ClassCenterViewData; assignments: ClassAssignment[] }) {
  const items = assignments
    .filter(isMajorDeliverable)
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
    .slice(0, 5)
  return (
    <BentoPanel span={4} title="Upcoming" icon={CalendarDays}>
      {!items.length ? <BentoEmpty>No important dated work is pending.</BentoEmpty> : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-muted p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold">{item.title}</span>
                <span className="whitespace-nowrap text-xs font-bold tabular-nums text-muted-foreground">{assignmentDateLabel(item)}</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">{classLabel(item.courseId, data)}{item.weight != null ? ` · ${item.weight}%` : ''}</p>
            </div>
          ))}
        </div>
      )}
    </BentoPanel>
  )
}

function TopicCoveragePanel({ data, classes }: { data: ClassCenterViewData; classes: ClassWorkspaceView[] }) {
  const activeIds = new Set(classes.map((row) => row.id))
  const topics = data.topics.filter((topic) => activeIds.has(topic.courseId))
  const linked = topics.filter((topic) => (topic.linkedFileIds?.length ?? 0) || topic.sourceNoteIds.length).length
  return (
    <BentoPanel span={4} title="Topic coverage" icon={TrendingUp}>
      {!topics.length ? <BentoEmpty>Import syllabus objectives to create the course topic structure.</BentoEmpty> : (
        <div>
          <div className="flex items-end justify-between gap-3">
            <p className="font-display text-3xl font-bold tabular-nums">{linked}<span className="text-lg text-muted-foreground">/{topics.length}</span></p>
            <Badge variant="secondary">with material</Badge>
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-border bg-muted px-4 py-5">
            <div className="flex items-center gap-2" aria-hidden="true">
              <span className="size-2 rounded-full bg-primary" />
              <span className="h-px flex-1 border-t border-dashed border-muted-foreground/50" />
              <span className="size-2 rounded-full border-2 border-muted-foreground/50 bg-card" />
            </div>
            <p className="mt-3 text-xs font-bold text-muted-foreground">Coverage connects syllabus objectives to the class evidence you captured. It does not claim mastery.</p>
          </div>
        </div>
      )}
    </BentoPanel>
  )
}

function LectureJournalPanel({ data, classes }: { data: ClassCenterViewData; classes: ClassWorkspaceView[] }) {
  const activeIds = new Set(classes.map((row) => row.id))
  const lectures = data.lectures.filter((lecture) => activeIds.has(lecture.courseId))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Array.from({ length: 28 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (27 - index))
    const key = date.toISOString().slice(0, 10)
    return { key, count: lectures.filter((lecture) => new Date(lecture.createdAt).toISOString().slice(0, 10) === key).length }
  })
  return (
    <BentoPanel span={4} title="Lecture journal" icon={CalendarDays}>
      <div className="flex items-end justify-between gap-3">
        <p className="font-display text-3xl font-bold tabular-nums">{lectures.length}<span className="ml-1 text-sm text-muted-foreground">captured</span></p>
      </div>
      <p className="mt-2 text-xs font-bold text-muted-foreground">lecture records added in the last four weeks</p>
      <div className="mt-4 grid grid-cols-7 gap-1.5" aria-label="Lecture captures per day for the last four weeks">
        {days.map((day) => (
          <span
            key={day.key}
            className="aspect-square rounded-md border border-border bg-primary"
            style={{ opacity: day.count ? Math.min(1, 0.18 + day.count * 0.2) : 0.06 }}
            title={`${day.key}: ${day.count} lecture${day.count === 1 ? '' : 's'}`}
          />
        ))}
      </div>
      {!lectures.length && <p className="mt-3 text-xs font-semibold text-muted-foreground">No lecture transcripts captured yet.</p>}
    </BentoPanel>
  )
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'
}

function ClassWorkspace({
  row, data, mutate, onBack,
}: {
  row: ClassWorkspaceView
  data: ClassCenterViewData
  mutate: (fn: (draft: ClassCenterData) => void) => void
  onBack: () => void
}) {
  const navigate = useNavigate()
  const [classEditorOpen, setClassEditorOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('today')
  const [form, setForm] = useState<ClassFormState>(classToForm(row))
  const stats = classStats(row.id, data)
  const topic = data.topics.find((item) => item.id === row.currentTopicId)
  const noteCount = data.notes.filter((note) => note.courseId === row.id).length
  const assignmentCount = data.assignments.filter((assignment) => assignment.courseId === row.id && assignment.status !== 'graded' && assignment.status !== 'submitted').length

  function saveClass(type: ClassWorkspaceType) {
    const nextForm = { ...form, type }
    useStore.getState().update((draft) => {
      const course = draft.courses.find((item) => item.id === row.id)
      const workspace = draft.academics.classCenter.workspaces.find((item) => item.courseId === row.id)
      if (course) Object.assign(course, { code: nextForm.courseCode, title: nextForm.courseTitle, term: nextForm.semester })
      if (workspace) Object.assign(workspace, workspaceFields(nextForm), { updatedAt: Date.now() })
    })
    setClassEditorOpen(false)
  }

  return (
    <div className="space-y-5">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card/84 shadow-sm">
          {row.background && (
            <>
              <img src={row.background} alt="" className="absolute inset-0 size-full object-cover opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-r from-card/92 via-card/86 to-card/72" />
            </>
          )}
          <div className="relative flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to Class Center"><ArrowLeft className="size-4" /></Button>
              <ClassIcon icon={row.icon} className={cn('size-11 rounded-2xl bg-gradient-to-br', COLOR_STYLES[row.color])} />
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-extrabold leading-tight">{row.courseCode} <span className="text-muted-foreground">{row.courseTitle}</span></h2>
                <p className="truncate text-sm font-bold text-muted-foreground">{row.instructor || 'Instructor TBD'} · {compactMeeting(row) || 'Meeting details TBD'} · {row.semester}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Now: {topic?.title ?? 'Topic TBD'}</Badge>
              {stats.nextDeadline && <Badge variant="danger">{stats.nextDeadline.title} · {assignmentDateLabel(stats.nextDeadline)}</Badge>}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-full"><Plus className="size-4" /> Add</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => addNote(row.id, mutate)}><NotebookText className="size-4" /> Note</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addTopic(row.id, mutate)}><Target className="size-4" /> Topic</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addWeakArea(row.id, mutate)}><Brain className="size-4" /> Review note</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addFile(row.id, mutate)}><FolderOpen className="size-4" /> Resource</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addContact(row.id, mutate)}><Users className="size-4" /> Contact</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full" aria-label="Class menu"><MoreHorizontal className="size-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setClassEditorOpen(true)}><Edit3 className="size-4" /> Edit details</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    mutate((draft) => {
                      const item = draft.workspaces.find((classRow) => classRow.courseId === row.id)
                      if (item) item.status = item.status === 'archived' ? 'active' : 'archived'
                    })
                  }}><Archive className="size-4" /> {row.status === 'archived' ? 'Restore' : 'Archive'}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </section>
        <div className="mt-4 grid gap-5 lg:grid-cols-[225px_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-3xl border border-border bg-card p-3 pt-4 shadow-sm lg:mt-1">
            <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              <TabsList className="flex h-auto min-w-max flex-row gap-2 rounded-none bg-transparent p-0 lg:min-w-0 lg:flex-col">
                <ClassRailTab value="today" icon={BookOpen} label="Today" />
                <ClassRailTab value="study" icon={Brain} label="Study Center" />
                <ClassRailTab value="notes" icon={NotebookText} label="Notes" count={noteCount} />
              </TabsList>
              <ClassRailLink
                icon={ListChecks}
                label="Assignments"
                count={assignmentCount}
                onClick={() => navigate('/academics?tab=assignments')}
              />
              <TabsList className="flex h-auto min-w-max flex-row gap-2 rounded-none bg-transparent p-0 lg:min-w-0 lg:flex-col">
                <ClassRailTab value="kit" icon={FolderOpen} label="Course kit" />
              </TabsList>
            </div>
            <p className="mt-3 hidden border-t border-border/70 px-2 pt-3 text-xs font-bold text-muted-foreground lg:block">{assignmentCount || noteCount ? `${assignmentCount || noteCount} class item${(assignmentCount || noteCount) === 1 ? '' : 's'} active` : 'Class workspace'}</p>
          </aside>
          <div className="min-w-0 space-y-5">
            <TabsContent value="today" className="mt-0">
              <OverviewTab
                row={row}
                data={data}
                mutate={mutate}
                openAssignments={() => navigate('/academics?tab=assignments')}
                openNotes={() => setActiveTab('notes')}
              />
            </TabsContent>
            <TabsContent value="study" className="mt-0"><StudyCenterTab row={row} data={data} mutate={mutate} /></TabsContent>
            <TabsContent value="notes" className="mt-0"><NotesTab row={row} data={data} mutate={mutate} /></TabsContent>
            <TabsContent value="kit" className="mt-0"><CourseKitTab row={row} data={data} mutate={mutate} /></TabsContent>
          </div>
        </div>
      </Tabs>

      <ClassEditorDialog
        key={classEditorOpen ? 'edit-open' : 'edit-closed'}
        open={classEditorOpen}
        title="Edit class"
        isCreate={false}
        form={form}
        onOpenChange={setClassEditorOpen}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onSave={saveClass}
      />
    </div>
  )
}

function ClassRailTab({ value, icon: Icon, label, count }: { value: string; icon: LucideIcon; label: string; count?: number }) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        'group min-h-12 min-w-[150px] justify-start gap-2.5 rounded-xl border border-transparent border-l-4 border-l-transparent bg-transparent px-3.5 py-3 text-sm font-extrabold text-muted-foreground shadow-none transition',
        'data-[state=active]:border-primary/20 data-[state=active]:border-l-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none',
        'hover:bg-muted/45 hover:text-foreground lg:w-full'
      )}
    >
      <Icon className="size-4" />
      <span>{label}</span>
      {typeof count === 'number' && count > 0 && (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground group-data-[state=active]:bg-primary/15 group-data-[state=active]:text-primary">{count}</span>
      )}
    </TabsTrigger>
  )
}

function ClassRailLink({
  icon: Icon, label, count, onClick,
}: {
  icon: LucideIcon
  label: string
  count?: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex min-h-12 min-w-[150px] items-center justify-start gap-2.5 rounded-xl border border-transparent border-l-4 border-l-transparent bg-transparent px-3.5 py-3 text-sm font-extrabold text-muted-foreground transition hover:bg-muted/45 hover:text-foreground lg:w-full"
    >
      <Icon className="size-4" />
      <span>{label}</span>
      {typeof count === 'number' && count > 0 && (
        <span className="ml-auto rounded-full bg-destructive/15 px-1.5 py-0.5 text-[11px] text-destructive">{count}</span>
      )}
    </button>
  )
}

function OverviewTab({
  row, data, mutate, openAssignments, openNotes,
}: ClassTabProps & { openAssignments: () => void; openNotes: () => void }) {
  const stats = classStats(row.id, data)
  const topics = data.topics.filter((item) => item.courseId === row.id).sort((a, b) => a.order - b.order)
  const upcoming = data.assignments
    .filter((item) => item.courseId === row.id && item.dueDate && item.status !== 'submitted' && item.status !== 'graded')
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
    .slice(0, 4)
  const latestNote = data.notes.filter((note) => note.courseId === row.id).sort((a, b) => b.updatedAt - a.updatedAt)[0]
  const reviewTopic = topics.find((topic) => topic.status === 'weak') ?? topics.find((topic) => topic.status === 'reviewing')
  const actionRows = [
    reviewTopic ? { label: `Review marked topic: ${reviewTopic.title}`, meta: '15 min', onClick: undefined } : undefined,
    stats.nextDeadline ? { label: `Start ${stats.nextDeadline.title}`, meta: assignmentDateLabel(stats.nextDeadline), onClick: openAssignments } : undefined,
  ].filter(Boolean) as { label: string; meta: string; onClick?: () => void }[]
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_.88fr]">
      <div className="space-y-5">
        <Card className="border-leaf/30 bg-leaf/8">
          <CardContent className="space-y-2 p-4">
            <h3 className="font-display text-lg font-bold">Do this next</h3>
            {(actionRows.length ? actionRows : [{ label: 'Pick one topic and make notes for it', meta: 'Open', onClick: undefined }]).map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="flex w-full items-center justify-between rounded-xl bg-card px-3 py-2 text-left text-sm font-extrabold transition hover:bg-muted/45 disabled:cursor-default disabled:hover:bg-card"
                disabled={!item.onClick}
              >
                <span>{item.label}</span>
                <span className="text-primary">{item.meta} →</span>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Topics · {topics.filter((topic) => normalizedTopicStatus(topic.status) === 'ready').length} marked ready · {topics.length} recorded</CardTitle>
            <Button size="sm" variant="outline" onClick={() => addTopic(row.id, mutate)}><Plus className="size-4" /> Topic</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {topics.map((topic) => (
              <TopicRow key={topic.id} topic={topic} current={topic.id === row.currentTopicId} data={data} mutate={mutate} />
            ))}
            {!topics.length && <p className="text-sm text-muted-foreground">Add lecture topics as the semester unfolds.</p>}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Deadlines</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcoming.map((item) => (
              <button key={item.id} type="button" onClick={openAssignments} className="flex w-full items-center justify-between gap-3 rounded-xl bg-muted/45 p-3 text-left transition hover:bg-muted">
                <div>
                  <p className="font-bold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{statusLabel(item.type)}</p>
                  {item.type === 'exam' && weakCoveredTopics(item, data).length > 0 && (
                    <p className="mt-1 text-xs font-extrabold text-destructive">
                      Marked for review: {weakCoveredTopics(item, data).map((topic) => topic.title).join(', ')}
                    </p>
                  )}
                </div>
                <span className="text-xs font-extrabold text-destructive">{assignmentDateLabel(item)}</span>
              </button>
            ))}
            {!upcoming.length && <p className="text-sm text-muted-foreground">No class deadlines yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Latest note</CardTitle>
            <button type="button" onClick={openNotes} className="text-xs font-extrabold text-primary">All notes →</button>
          </CardHeader>
          <CardContent className="space-y-2">
            {latestNote ? (
              <div className="rounded-xl bg-muted/45 p-3">
                <p className="font-bold">{latestNote.title}</p>
                <p className="text-sm text-muted-foreground">{statusLabel(latestNote.type)} · {latestNote.date || 'No date'}</p>
              </div>
            ) : <p className="text-sm text-muted-foreground">No notes yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quick links</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {[
                ['Syllabus', row.syllabusUrl],
                ['Canvas', row.canvasUrl],
                ['Drive', row.driveFolderUrl],
              ].filter(([, value]) => Boolean(value)).map(([label, value]) => (
                <a key={label} href={value && value.startsWith('http') ? value : undefined} className="rounded-full bg-muted px-3 py-1.5 text-sm font-extrabold text-foreground hover:bg-secondary">
                  {label}
                </a>
              ))}
              {!row.syllabusUrl && !row.canvasUrl && !row.driveFolderUrl && (
                <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-extrabold text-muted-foreground">No links saved</span>
              )}
            </div>
            <p className="text-sm font-bold text-muted-foreground">{row.instructor || 'Professor'} — {data.contacts.find((c) => c.courseId === row.id)?.officeHours || 'office hours TBD'} {data.contacts.find((c) => c.courseId === row.id)?.email && <a className="ml-2 text-primary" href={`mailto:${data.contacts.find((c) => c.courseId === row.id)?.email}`}>email ↗</a>}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function NotesTab({ row, data, mutate }: ClassTabProps) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [topicFilter, setTopicFilter] = useState('all')
  const topics = data.topics.filter((topic) => topic.courseId === row.id).sort((a, b) => a.order - b.order)
  const notes = data.notes
    .filter((note) => note.courseId === row.id)
    .filter((note) => type === 'all' || note.type === type)
    .filter((note) => topicFilter === 'all' || note.topicIds.includes(topicFilter))
    .filter((note) => `${note.title} ${note.content} ${note.unit ?? ''}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt)
  const [selectedId, setSelectedId] = useState(notes[0]?.id ?? '')
  const selected = data.notes.find((note) => note.id === (selectedId || notes[0]?.id))
  return (
    <div className="grid gap-5 lg:grid-cols-[310px_1fr]">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between">
            <CardTitle>Class notes</CardTitle>
            <Button size="sm" onClick={() => addNote(row.id, mutate)}><Plus className="size-4" /> New note</Button>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search notes..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <TinySelect value={type} options={['all', ...NOTE_TYPES]} labels={{ all: 'All types' }} onChange={setType} />
              <TinySelect value={topicFilter} options={['all', ...topics.map((topic) => topic.id)]} labels={{ all: 'All topics', ...Object.fromEntries(topics.map((topic) => [topic.id, topic.title])) }} onChange={setTopicFilter} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => setSelectedId(note.id)}
              className={cn('w-full rounded-xl p-3 text-left transition hover:bg-muted', selected?.id === note.id && 'bg-primary/10 text-primary')}
            >
              <p className="font-bold">{note.title}</p>
              <p className="text-xs font-medium text-muted-foreground">{statusLabel(note.type)} · {note.date || 'No date'}</p>
              <TopicChipList ids={note.topicIds} data={data} />
            </button>
          ))}
          {!notes.length && <p className="text-sm text-muted-foreground">No notes match this view.</p>}
        </CardContent>
      </Card>
      <Card>
        {selected ? (
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <Input value={selected.title} onChange={(e) => patchNote(selected.id, { title: e.target.value }, mutate)} className="font-display text-lg font-bold" />
              <Badge variant={selected.syncStatus === 'synced' ? 'success' : selected.syncStatus === 'error' ? 'danger' : selected.externalDocUrl ? 'secondary' : 'warning'}>
                {selected.externalDocUrl ? 'Linked doc' : selected.syncStatus === 'synced' ? 'Synced' : selected.syncStatus === 'error' ? 'Sync issue' : 'Local note'}
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <TinySelect value={selected.type} options={NOTE_TYPES} onChange={(type) => patchNote(selected.id, { type: type as ClassNoteType }, mutate)} />
              <DateField value={selected.date ?? ''} onChange={(date) => patchNote(selected.id, { date }, mutate)} />
              <Input placeholder="Unit" value={selected.unit ?? ''} onChange={(e) => patchNote(selected.id, { unit: e.target.value }, mutate)} />
            </div>
            <TopicPicker
              label="Linked topics"
              topics={topics}
              value={selected.topicIds}
              onChange={(topicIds) => patchNote(selected.id, { topicIds }, mutate)}
            />
            <Textarea className="min-h-[420px]" value={selected.content} onChange={(e) => patchNote(selected.id, { content: e.target.value }, mutate)} placeholder="Type lecture notes, question logs, study guides, or exam review notes here..." />
            <details className="rounded-xl border border-border bg-muted/25 px-3 py-2">
              <summary className="cursor-pointer text-xs font-extrabold text-muted-foreground">More note options</summary>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
                <Input placeholder="Google Doc or external note link" value={selected.externalDocUrl ?? ''} onChange={(e) => patchNote(selected.id, { externalDocUrl: e.target.value, syncStatus: e.target.value ? 'sync-ready' : 'local-only' }, mutate)} />
                {selected.externalDocUrl && (
                  <Button asChild variant="outline" size="sm"><a href={selected.externalDocUrl} target="_blank" rel="noreferrer">Open doc</a></Button>
                )}
              </div>
            </details>
          </CardContent>
        ) : (
          <CardContent className="py-12 text-center text-sm text-muted-foreground">Create a note to open the editor.</CardContent>
        )}
      </Card>
    </div>
  )
}

function CourseKitTab({ row, data, mutate }: ClassTabProps) {
  const files = data.files.filter((item) => item.courseId === row.id).sort((a, b) => a.order - b.order)
  const contacts = data.contacts.filter((item) => item.courseId === row.id).sort((a, b) => a.order - b.order)
  const links = [
    ['Syllabus', row.syllabusUrl],
    ['Canvas', row.canvasUrl],
    ['GoodNotes', row.goodNotesUrl],
    ['Drive folder', row.driveFolderUrl],
  ]
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Links & files</CardTitle>
          <Button size="sm" variant="outline" onClick={() => addFile(row.id, mutate)}><Plus className="size-4" /> Resource</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatedFileUpload onFiles={(selectedFiles) => addUploadedFiles(row.id, selectedFiles, mutate)} />
          <div className="grid gap-2 md:grid-cols-2">
            {links.map(([label, value]) => (
              <a
                key={label}
                href={value && value.startsWith('http') ? value : undefined}
                className={cn(
                  'flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-bold transition',
                  value ? 'border-border bg-muted/45 text-foreground hover:bg-muted' : 'border-dashed border-border/80 text-muted-foreground'
                )}
              >
                <span>{label}</span>
                <span className="text-xs">{value ? 'Linked' : 'Add in edit'}</span>
              </a>
            ))}
          </div>
          <div className="space-y-2 border-t border-border pt-4">
            {files.map((file) => (
              <div key={file.id} className="grid gap-2 rounded-xl bg-muted/35 p-2 md:grid-cols-[1fr_130px_1.2fr_auto] md:items-center">
                <InlineInput value={file.title} onChange={(value) => patchFile(file.id, { title: value }, mutate)} />
                <TinySelect value={file.type} options={FILE_TYPES} onChange={(value) => patchFile(file.id, { type: value as ClassFileType }, mutate)} />
                <Input placeholder="URL or file reference" value={file.url ?? ''} onChange={(e) => patchFile(file.id, { url: e.target.value }, mutate)} />
                <DeleteButton onClick={() => removeById('files', file.id, mutate)} />
              </div>
            ))}
            {!files.length && <p className="text-sm font-semibold text-muted-foreground">No files yet.</p>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>People</CardTitle>
          <Button size="sm" variant="outline" onClick={() => addContact(row.id, mutate)}><Plus className="size-4" /> Person</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {contacts.map((contact) => (
            <div key={contact.id} className="grid gap-2 rounded-xl bg-muted/35 p-2 lg:grid-cols-[1fr_120px_auto] lg:items-center">
              <InlineInput value={contact.name} onChange={(value) => patchContact(contact.id, { name: value }, mutate)} />
              <TinySelect value={contact.role} options={CONTACT_ROLES} onChange={(value) => patchContact(contact.id, { role: value as ClassContactRole }, mutate)} />
              <div className="flex justify-end gap-1">
                {contact.email && (
                  <Button asChild variant="ghost" size="icon"><a href={`mailto:${contact.email}`} aria-label="Email contact"><Mail className="size-4" /></a></Button>
                )}
                <DeleteButton onClick={() => removeById('contacts', contact.id, mutate)} />
              </div>
              <Input className="lg:col-span-3" placeholder="Email, office hours, or notes" value={[contact.email, contact.officeHours].filter(Boolean).join(' · ')} onChange={(e) => {
                const [email, ...rest] = e.target.value.split(' · ')
                patchContact(contact.id, { email, officeHours: rest.join(' · ') }, mutate)
              }} />
            </div>
          ))}
          {!contacts.length && <p className="text-sm font-semibold text-muted-foreground">Add your professor, TA, or study group.</p>}
        </CardContent>
      </Card>
    </div>
  )
}

function StudyCenterTab({ row, data, mutate }: ClassTabProps) {
  const [activeExamId, setActiveExamId] = useState('')
  const [renderNow] = useState(() => Date.now())
  const topics = data.topics.filter((topic) => topic.courseId === row.id).sort((a, b) => a.order - b.order)
  const exams = data.practiceExams.filter((exam) => exam.courseId === row.id).sort((a, b) => b.updatedAt - a.updatedAt)
  const activeExam = data.practiceExams.find((exam) => exam.id === activeExamId)
  const revisionQueue = topics
    .map((topic) => ({ topic, practice: topicPracticeStats(topic.id, data) }))
    .sort((a, b) => a.topic.fsrs.due - b.topic.fsrs.due || a.topic.order - b.topic.order)
    .slice(0, 5)
  const nextExam = data.assignments
    .filter((item) => item.courseId === row.id && item.type === 'exam' && item.dueDate && item.status !== 'graded')
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))[0]
  const coveredTopics = nextExam ? topics.filter((topic) => (nextExam.coveredTopicIds?.length ? nextExam.coveredTopicIds : nextExam.linkedTopicIds).includes(topic.id)) : topics
  const readyCount = coveredTopics.filter((topic) => topic.status === 'ready').length

  return (
    <div className="space-y-5">
      {activeExam && (
        <PracticeExamRunner exam={activeExam} data={data} mutate={mutate} onClose={() => setActiveExamId('')} />
      )}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm font-semibold text-muted-foreground">Practice generation is being rebuilt on the verified study-tools backend.</p>
        <p className="text-xs font-extrabold uppercase text-muted-foreground">{nextExam ? nextExam.title : 'Recorded scope'} · {readyCount}/{coveredTopics.length} marked ready</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.25fr_.85fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Topic intelligence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="hidden grid-cols-[1fr_120px_140px_140px_92px] gap-3 px-3 py-2 text-xs font-extrabold uppercase text-muted-foreground lg:grid">
              <span>Topic</span>
              <span>Status</span>
              <span>Self-rating</span>
              <span>Practice</span>
              <span className="text-right">Action</span>
            </div>
            {topics.map((topic) => (
              <TopicMatrixRow key={topic.id} topic={topic} data={data} mutate={mutate} />
            ))}
            {!topics.length && <p className="text-sm text-muted-foreground">Add topics to start building a revision queue.</p>}
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Revision queue</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {revisionQueue.map(({ topic, practice }) => (
                <div key={topic.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/45 p-3">
                  <div>
                    <p className="font-bold">{topic.title}</p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {practice.total ? `${practice.correct}/${practice.total} practice correct` : 'Not tested'} · {activeWeakAreasForTopic(topic.id, data).length} review notes
                    </p>
                  </div>
                  <Badge variant="muted">{topic.fsrs.due <= renderNow ? 'Due' : 'Scheduled'}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent practice</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {exams.slice(0, 4).map((exam) => (
                <button key={exam.id} type="button" onClick={() => setActiveExamId(exam.id)} className="flex w-full items-center justify-between rounded-xl bg-muted/45 p-3 text-left hover:bg-muted">
                  <span className="font-bold">{exam.title}</span>
                  <span className="text-xs font-extrabold text-muted-foreground">{exam.status === 'submitted' || exam.status === 'reviewed' ? `${exam.score ?? 0}/${exam.totalAutoGradable ?? exam.questionCount}` : statusLabel(exam.status)}</span>
                </button>
              ))}
              {!exams.length && <p className="text-sm text-muted-foreground">No practice attempts yet.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function TopicMatrixRow({ topic, data, mutate }: { topic: Topic; data: ClassCenterViewData; mutate: ClassTabProps['mutate'] }) {
  const practice = topicPracticeStats(topic.id, data)
  const weakAreas = activeWeakAreasForTopic(topic.id, data)
  return (
    <div className={cn(
      'grid gap-3 rounded-xl px-3 py-3 text-sm lg:grid-cols-[1fr_120px_140px_140px_92px] lg:items-center',
      weakAreas.length ? 'border border-destructive/25 bg-destructive/8' : 'bg-card'
    )}>
      <div className="min-w-0">
        <p className="truncate font-bold">{topic.title}</p>
        <p className="text-xs font-semibold text-muted-foreground">{topic.unit || 'No unit'}{weakAreas.length ? ` · ${weakAreas.length} review notes` : ''}</p>
      </div>
      <TinySelect value={topic.status} options={TOPIC_STATUSES} onChange={(value) => mutate((draft) => {
        const item = draft.topics.find((row) => row.id === topic.id)
        if (item) Object.assign(item, { status: value as TopicStatus, updatedAt: Date.now() })
      })} />
      <span className="text-xs font-bold text-muted-foreground">{topic.confidence}/3 recorded</span>
      <span className="text-xs font-bold text-muted-foreground">{practice.total ? `${practice.correct}/${practice.total} correct` : 'Not tested'}</span>
      <div className="flex justify-start lg:justify-end">
        <Button size="sm" variant={weakAreas.length ? 'default' : 'ghost'} onClick={() => addWeakArea(topic.courseId, mutate, { topicId: topic.id, label: topic.title })}>
          {weakAreas.length ? 'Review notes' : 'Add review note'}
        </Button>
      </div>
    </div>
  )
}

function PracticeExamRunner({
  exam, data, mutate, onClose,
}: {
  exam: PracticeExam
  data: ClassCenterViewData
  mutate: ClassTabProps['mutate']
  onClose: () => void
}) {
  const questions = data.practiceQuestions.filter((question) => question.examId === exam.id).sort((a, b) => a.order - b.order)
  const [index, setIndex] = useState(0)
  const question = questions[index]
  const submitted = exam.status === 'submitted' || exam.status === 'reviewed'
  const correct = questions.filter((item) => item.isCorrect).length
  const answered = questions.filter((item) => item.userAnswer || item.selfGrade).length

  function patchQuestion(questionId: string, patch: Partial<PracticeQuestion>) {
    mutate((draft) => {
      const item = draft.practiceQuestions.find((row) => row.id === questionId)
      if (item) Object.assign(item, patch, { updatedAt: Date.now() })
      const examRow = draft.practiceExams.find((row) => row.id === exam.id)
      if (examRow && examRow.status === 'draft') {
        examRow.status = 'in-progress'
        examRow.startedAt = Date.now()
      }
    })
  }

  function submit() {
    mutate((draft) => {
      const examQuestions = draft.practiceQuestions.filter((item) => item.examId === exam.id)
      for (const item of examQuestions) {
        if (item.type === 'multiple-choice') item.isCorrect = item.userAnswer === item.correctAnswer
      }
      const autoGradable = examQuestions.filter((item) => item.type === 'multiple-choice')
      const item = draft.practiceExams.find((row) => row.id === exam.id)
      if (item) {
        item.status = 'submitted'
        item.submittedAt = Date.now()
        item.totalAutoGradable = autoGradable.length
        item.score = autoGradable.filter((row) => row.isCorrect).length
        item.updatedAt = Date.now()
      }
    })
  }

  if (!question) return null

  return (
    <Card className="border-primary/35 bg-primary/5">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>{exam.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{submitted ? `Review · ${correct}/${questions.length} marked correct` : `${answered}/${questions.length} answered`}</p>
        </div>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressLine value={Math.round(((index + 1) / questions.length) * 100)} />
        <div className="rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary">Question {index + 1} / {questions.length}</Badge>
            <button type="button" className="text-xs font-extrabold text-primary" onClick={() => patchQuestion(question.id, { flagged: !question.flagged })}>{question.flagged ? 'Flagged' : 'Flag'}</button>
          </div>
          <p className="mt-3 font-bold">{question.prompt}</p>
          <TopicChipList ids={question.topicIds} data={data} />
          {question.type === 'multiple-choice' ? (
            <div className="mt-3 space-y-2">
              {(question.choices ?? []).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  disabled={submitted}
                  onClick={() => patchQuestion(question.id, { userAnswer: choice })}
                  className={cn(
                    'w-full rounded-xl border border-border p-3 text-left text-sm font-bold transition hover:bg-muted',
                    question.userAnswer === choice && 'border-primary bg-primary/10',
                    submitted && choice === question.correctAnswer && 'border-leaf bg-leaf/15',
                    submitted && question.userAnswer === choice && choice !== question.correctAnswer && 'border-destructive bg-destructive/10'
                  )}
                >
                  {choice}
                </button>
              ))}
            </div>
          ) : (
            <Textarea
              className="mt-3 min-h-[120px]"
              value={question.userAnswer ?? ''}
              disabled={submitted}
              onChange={(event) => patchQuestion(question.id, { userAnswer: event.target.value })}
              placeholder="Write your answer..."
            />
          )}
          {submitted && (
            <div className="mt-4 space-y-3 rounded-xl bg-muted/45 p-3">
              <p className="text-sm font-bold">{question.explanation}</p>
              {question.type !== 'multiple-choice' && (
                <div className="flex flex-wrap gap-2">
                  {(['correct', 'partial', 'missed'] as const).map((grade) => (
                    <Button key={grade} size="sm" variant={question.selfGrade === grade ? 'default' : 'outline'} onClick={() => patchQuestion(question.id, { selfGrade: grade, isCorrect: grade === 'correct' })}>
                      {statusLabel(grade)}
                    </Button>
                  ))}
                </div>
              )}
              {!question.isCorrect && (
                <Button size="sm" variant="outline" onClick={() => addWeakAreaFromQuestion(question, data, mutate)}>Mark for review</Button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>Previous</Button>
          <div className="flex gap-2">
            {!submitted && <Button variant="outline" onClick={submit}>Submit for review</Button>}
            <Button onClick={() => setIndex(Math.min(questions.length - 1, index + 1))} disabled={index === questions.length - 1}>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ClassEditorDialog({
  open, title, isCreate, form, syllabusProposal, confirmLabel, onOpenChange, onChange, onSave, onSaveAndImport, onBackToImport,
}: {
  open: boolean
  title: string
  isCreate: boolean
  form: ClassFormState
  syllabusProposal?: SyllabusProposal
  confirmLabel?: string
  onOpenChange: (open: boolean) => void
  onChange: (patch: Partial<ClassFormState>) => void
  onSave: (type: ClassWorkspaceType) => void
  onSaveAndImport?: (type: ClassWorkspaceType) => void
  onBackToImport?: () => void
}) {
  const [studentChoice, setStudentChoice] = useState<ClassWorkspaceType | undefined>()
  const decision = useMemo(() => classTypeDraftDecision({
    isCreate,
    courseCode: form.courseCode,
    savedType: form.type,
    studentChoice,
    syllabusItems: syllabusProposal?.items,
  }), [form.courseCode, form.type, isCreate, studentChoice, syllabusProposal?.items])
  const missingIdentity = isCreate && (!form.courseCode.trim() || !form.courseTitle.trim())
  const canSave = Boolean(decision.selectedType) && !missingIdentity
  const saveBlockReason = !decision.selectedType
    ? 'Choose a class type to continue.'
    : missingIdentity ? 'Complete the course code and title to continue.' : ''
  const extractedClass = useMemo(
    () => syllabusProposal ? classFormFromSyllabus(syllabusProposal, form.semester) : undefined,
    [form.semester, syllabusProposal],
  )
  const termWasFound = Boolean(syllabusProposal?.text.match(/\b(?:Fall|Spring|Summer|Winter)\s+20\d{2}\b/i))
  const sourceFieldLabel = (label: string, found: boolean, optional = false) => syllabusProposal
    ? `${label} · ${optional ? 'optional' : found ? 'found' : 'not found'}`
    : label
  const missingClassFacts = syllabusProposal ? [
    Boolean(extractedClass?.courseCode), Boolean(extractedClass?.courseTitle), termWasFound,
    Boolean(extractedClass?.instructor), Boolean(extractedClass?.meetingDays),
    Boolean(extractedClass?.meetingTime), Boolean(extractedClass?.location),
  ].filter((found) => !found).length : 0

  const chooseType = (type: ClassWorkspaceType) => {
    if (isCreate) {
      setStudentChoice(type)
      return
    }
    onChange({ type })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto !rounded-2xl !border-border !bg-card !shadow-[0_22px_55px_-27px_rgba(0,0,0,0.8)] ![backdrop-filter:none]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {syllabusProposal && (
            <section className="flex gap-3 rounded-xl border border-primary/30 bg-primary/8 p-3" aria-label="Syllabus source">
              <FileText className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-display text-sm font-extrabold">Here’s what I found</p>
                <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                  {syllabusProposal.sourceName} · {syllabusProposal.items.length} extracted details · {missingClassFacts} class fields not found. Review and complete anything missing before continuing.
                </p>
              </div>
            </section>
          )}
          <section className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Basics</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={sourceFieldLabel('Course code', Boolean(extractedClass?.courseCode))}><Input value={form.courseCode} onChange={(e) => onChange({ courseCode: e.target.value })} placeholder="BIOL 103" /></Field>
              <Field label={sourceFieldLabel('Course title', Boolean(extractedClass?.courseTitle))}><Input value={form.courseTitle} onChange={(e) => onChange({ courseTitle: e.target.value })} placeholder="How Cells Function" /></Field>
              <Field label={sourceFieldLabel('Semester', termWasFound)}><Input value={form.semester} onChange={(e) => onChange({ semester: e.target.value })} placeholder="Fall 2026" /></Field>
            </div>
            <Field label="Class type">
              <div className="grid gap-2 sm:grid-cols-3">
                {CLASS_TYPES.map((type) => {
                  const selected = decision.selectedType === type.value
                  const isSuggestion = selected && decision.selectionKind === 'suggestion'
                  return (
                    <button
                      key={type.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => chooseType(type.value)}
                      className={cn(
                        'min-h-[104px] rounded-[13px] border bg-muted p-3 text-left transition-[background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none',
                        selected
                          ? 'border-primary bg-[color-mix(in_srgb,var(--primary)_12%,var(--muted))] text-foreground shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_42%,transparent),0_10px_22px_-18px_color-mix(in_srgb,var(--primary)_75%,transparent)]'
                          : 'border-border text-muted-foreground hover:border-primary/60 hover:bg-muted',
                      )}
                    >
                      <span className="block font-display text-sm font-extrabold text-foreground">{type.label}</span>
                      <span className="mt-0.5 block text-xs font-semibold leading-snug">{type.detail}</span>
                      <span className={cn('mt-2 block min-h-3 text-[10px] font-extrabold uppercase tracking-wide text-primary', !selected && 'invisible')}>
                        {isSuggestion ? 'Suggested' : 'Selected'}
                      </span>
                    </button>
                  )
                })}
              </div>
              {isCreate && decision.selectionKind === 'suggestion' && decision.proposal && (
                <p className="mt-3 rounded-[11px] border border-primary/30 bg-[color-mix(in_srgb,var(--primary)_7%,var(--muted))] px-3 py-2 text-xs font-semibold leading-relaxed text-muted-foreground">
                  <span className="font-extrabold text-foreground">{decision.proposal.reason}</span>
                </p>
              )}
              {isCreate && decision.selectionKind === 'needs-choice' && (
                <p className="mt-3 rounded-[11px] border border-border bg-muted px-3 py-2 text-xs font-semibold leading-relaxed text-muted-foreground">Choose the study layer that fits this class.</p>
              )}
              {isCreate && decision.selectionKind === 'student' && (
                <p className="mt-3 rounded-[11px] border border-primary/30 bg-[color-mix(in_srgb,var(--primary)_7%,var(--muted))] px-3 py-2 text-xs font-semibold leading-relaxed text-muted-foreground"><span className="font-extrabold text-foreground">Your choice</span> — this is the study layer for this class.</p>
              )}
              <p className="mt-2 text-xs font-semibold text-muted-foreground">You can change this later. Grades, credits, and requirements stay the same.</p>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={sourceFieldLabel('Instructor', Boolean(extractedClass?.instructor))}><Input value={form.instructor ?? ''} onChange={(e) => onChange({ instructor: e.target.value })} /></Field>
              <Field label={sourceFieldLabel('Meeting days', Boolean(extractedClass?.meetingDays))}><Input value={form.meetingDays ?? ''} onChange={(e) => onChange({ meetingDays: e.target.value })} onBlur={(e) => onChange({ meetingDays: normalizeMeetingDays(e.target.value) })} placeholder="Tuesday · Thursday" /></Field>
              <Field label={sourceFieldLabel('Meeting time', Boolean(extractedClass?.meetingTime))}><Input value={form.meetingTime ?? ''} onChange={(e) => onChange({ meetingTime: e.target.value })} placeholder="10:10 AM-11:00 AM" /></Field>
              <Field label={sourceFieldLabel('Location', Boolean(extractedClass?.location))}><Input value={form.location ?? ''} onChange={(e) => onChange({ location: e.target.value })} /></Field>
              <Field label={sourceFieldLabel('Nickname', false, true)}><Input value={form.nickname ?? ''} onChange={(e) => onChange({ nickname: e.target.value })} placeholder="Optional" /></Field>
            </div>
          </section>
          <section className="space-y-3 border-t border-border pt-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Look</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Icon">
                <div className="flex flex-wrap gap-1.5">
                  {CLASS_ICONS.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      title={label}
                      aria-label={label}
                      aria-pressed={normalizeClassIcon(form.icon) === id}
                      onClick={() => onChange({ icon: id })}
                      className={cn(
                        'grid size-9 place-items-center rounded-xl border text-muted-foreground transition hover:bg-muted hover:text-foreground',
                        normalizeClassIcon(form.icon) === id ? 'border-primary bg-primary/12 text-primary' : 'border-border bg-card'
                      )}
                    >
                      <Icon className="size-4" />
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Color">
                <div className="grid grid-cols-6 gap-1">
                  {COLORS.map((color) => (
                    <button
                      type="button"
                      key={color}
                      aria-pressed={form.color === color}
                      title={`${color[0].toUpperCase()}${color.slice(1)}`}
                      onClick={() => onChange({ color })}
                      className={cn('min-w-0 rounded-full px-1.5 py-1 text-center text-xs font-bold capitalize', PILL_STYLES[color], form.color === color && 'ring-2 ring-primary')}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </Field>
              <BannerField value={form.background ?? ''} onChange={(background) => onChange({ background })} />
              <Field label="Status">
                <TinySelect value={form.status} options={['active', 'archived']} onChange={(status) => onChange({ status: status as ClassWorkspaceView['status'] })} />
              </Field>
            </div>
          </section>
          <details className="rounded-2xl border border-border bg-muted/25 p-3">
            <summary className="cursor-pointer text-sm font-extrabold">Links</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Syllabus"><Input value={form.syllabusUrl ?? ''} onChange={(e) => onChange({ syllabusUrl: e.target.value })} placeholder="Paste URL" /></Field>
              <Field label="Canvas"><Input value={form.canvasUrl ?? ''} onChange={(e) => onChange({ canvasUrl: e.target.value })} placeholder="Paste URL" /></Field>
              <Field label="Drive folder"><Input value={form.driveFolderUrl ?? ''} onChange={(e) => onChange({ driveFolderUrl: e.target.value })} placeholder="Paste URL" /></Field>
              <Field label="GoodNotes"><Input value={form.goodNotesUrl ?? ''} onChange={(e) => onChange({ goodNotesUrl: e.target.value })} placeholder="Paste URL" /></Field>
              <Field label="Notes doc"><Input value={form.notesDocUrl ?? ''} onChange={(e) => onChange({ notesDocUrl: e.target.value })} placeholder="Paste URL" /></Field>
            </div>
          </details>
        </div>
        <DialogFooter>
          {onBackToImport && <Button variant="ghost" onClick={onBackToImport}><ArrowLeft className="size-4" /> Back to import</Button>}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {onSaveAndImport && <Button variant="outline" disabled={!canSave} onClick={() => decision.selectedType && onSaveAndImport(decision.selectedType)}><Upload className="size-4" /> Create & import syllabus</Button>}
          <div className="flex flex-col items-end gap-1">
            {isCreate && !canSave && <span className="text-xs font-semibold text-muted-foreground">{saveBlockReason}</span>}
            <Button disabled={!canSave} onClick={() => decision.selectedType && onSave(decision.selectedType)}>{confirmLabel ?? (isCreate ? 'Add class' : 'Save class')}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type ClassTabProps = {
  row: ClassWorkspaceView
  data: ClassCenterViewData
  mutate: (fn: (draft: ClassCenterData) => void) => void
}

function addTopic(courseId: string, mutate: ClassTabProps['mutate']) {
  const now = Date.now()
  mutate((draft) => {
    const order = draft.topics.filter((topic) => topic.courseId === courseId).length
    draft.topics.push({
      id: uid(),
      courseId,
      title: 'New topic',
      unit: '',
      status: 'not-started',
      confidence: 3,
      sourceNoteIds: [],
      linkedNoteIds: [],
      linkedAssignmentIds: [],
      linkedFileIds: [],
      fsrs: createTopicFsrsState(now),
      createdAt: now,
      updatedAt: now,
      order,
    })
    const row = draft.workspaces.find((item) => item.courseId === courseId)
    if (row) row.updatedAt = now
  })
}

function addWeakArea(courseId: string, mutate: ClassTabProps['mutate'], preset: Partial<ClassWeakArea> = {}) {
  const now = Date.now()
  mutate((draft) => {
    draft.weakAreas.unshift({
      id: uid(),
      courseId,
      topicId: preset.topicId,
      label: preset.label || 'New review note',
      source: (preset.source as WeakAreaSource) || 'manual',
      reason: preset.reason || 'conceptual',
      severity: preset.severity || 2,
      notes: preset.notes || '',
      relatedNoteId: preset.relatedNoteId,
      relatedAssignmentId: preset.relatedAssignmentId,
      relatedPracticeQuestionId: preset.relatedPracticeQuestionId,
      createdAt: now,
      status: preset.status || 'active',
      order: draft.weakAreas.length,
    })
  })
}

function addNote(courseId: string, mutate: ClassTabProps['mutate']) {
  const now = Date.now()
  mutate((draft) => {
    draft.notes.unshift({
      id: uid(),
      courseId,
      title: 'Untitled note',
      type: 'lecture',
      kind: 'about-class',
      date: new Date().toISOString().slice(0, 10),
      unit: '',
      topicIds: [],
      content: '',
      externalDocUrl: '',
      googleDocId: '',
      syncStatus: 'local-only',
      linkedFileIds: [],
      createdAt: now,
      updatedAt: now,
      order: draft.notes.length,
    })
  })
}

function addFile(courseId: string, mutate: ClassTabProps['mutate']) {
  const now = Date.now()
  mutate((draft) => {
    draft.files.unshift({
      id: uid(),
      courseId,
      title: 'New resource',
      type: 'link',
      sourceType: 'link',
      owner: 'course',
      url: '',
      fileName: '',
      mimeType: '',
      notes: '',
      linkedTopicIds: [],
      createdAt: now,
      updatedAt: now,
      order: draft.files.length,
    })
  })
}

function addUploadedFiles(courseId: string, selectedFiles: File[], mutate: ClassTabProps['mutate']) {
  const now = Date.now()
  mutate((draft) => {
    for (const file of selectedFiles) {
      draft.files.unshift({
        id: uid(),
        courseId,
        title: file.name.replace(/\.[^.]+$/, '') || file.name,
        type: 'other',
        sourceType: 'upload',
        owner: 'mine',
        url: '',
        fileName: file.name,
        mimeType: file.type,
        notes: '',
        linkedTopicIds: [],
        createdAt: now,
        updatedAt: now,
        order: draft.files.length,
      })
    }
  })
}

function addContact(courseId: string, mutate: ClassTabProps['mutate']) {
  const now = Date.now()
  mutate((draft) => {
    draft.contacts.unshift({
      id: uid(),
      courseId,
      name: 'New contact',
      role: 'professor',
      email: '',
      officeHours: '',
      location: '',
      nickname: '',
      notes: '',
      createdAt: now,
      updatedAt: now,
      order: draft.contacts.length,
    })
  })
}

function patchNote(id: string, patch: Partial<ClassNote>, mutate: ClassTabProps['mutate']) {
  mutate((draft) => {
    const item = draft.notes.find((note) => note.id === id)
    if (item) Object.assign(item, patch, { updatedAt: Date.now() })
  })
}

function patchFile(id: string, patch: Partial<AcademicFile>, mutate: ClassTabProps['mutate']) {
  mutate((draft) => {
    const item = draft.files.find((file) => file.id === id)
    if (item) Object.assign(item, patch, { updatedAt: Date.now() })
  })
}

function patchContact(id: string, patch: Partial<ClassContact>, mutate: ClassTabProps['mutate']) {
  mutate((draft) => {
    const item = draft.contacts.find((contact) => contact.id === id)
    if (item) Object.assign(item, patch, { updatedAt: Date.now() })
  })
}

function removeById(key: 'files' | 'contacts', id: string, mutate: ClassTabProps['mutate']) {
  mutate((draft) => {
    draft[key] = draft[key].filter((item) => item.id !== id) as never
  })
}

function TopicRow({ topic, current, data, mutate }: { topic: Topic; current: boolean; data: ClassCenterViewData; mutate: ClassTabProps['mutate'] }) {
  const weakCount = activeWeakAreasForTopic(topic.id, data).length
  const StatusIcon = normalizedTopicStatus(topic.status) === 'ready' ? CheckCircle2 : Circle
  return (
    <div className={cn(
      'grid gap-3 rounded-xl border border-border bg-card p-3 text-sm md:grid-cols-[1.4fr_90px_130px_auto] md:items-center',
      current && 'border-primary/35 bg-primary/8'
    )}>
      <div className="flex min-w-0 items-center gap-2">
        <StatusIcon className={cn('size-4 shrink-0', normalizedTopicStatus(topic.status) === 'ready' ? 'text-leaf' : current ? 'text-primary' : 'text-muted-foreground')} />
        <div className="min-w-0 flex-1">
          <InlineInput value={topic.title} onChange={(value) => mutate((draft) => {
            const item = draft.topics.find((row) => row.id === topic.id)
            if (item) Object.assign(item, { title: value, updatedAt: Date.now() })
          })} />
          <div className="mt-1 flex flex-wrap gap-1">
            {current && <Badge variant="secondary">Current</Badge>}
            {weakCount > 0 && <Badge variant="warning">{weakCount} review notes</Badge>}
            <TopicReferenceBadge label="Notes" count={topicLinkedNotes(topic.id, data).length} />
            <TopicReferenceBadge label="Assignments" count={topicLinkedAssignments(topic.id, data).length} />
            <TopicReferenceBadge label="Files" count={topicLinkedFiles(topic.id, data).length} />
          </div>
        </div>
      </div>
      <InlineInput value={topic.unit ?? ''} placeholder="Unit" onChange={(value) => mutate((draft) => {
        const item = draft.topics.find((row) => row.id === topic.id)
        if (item) Object.assign(item, { unit: value, updatedAt: Date.now() })
      })} />
      <TinySelect value={topic.status} options={TOPIC_STATUSES} onChange={(value) => mutate((draft) => {
        const item = draft.topics.find((row) => row.id === topic.id)
        if (item) Object.assign(item, { status: value as TopicStatus, updatedAt: Date.now() })
      })} />
      <Button size="sm" variant={weakCount ? 'default' : 'outline'} onClick={() => addWeakArea(topic.courseId, mutate, { topicId: topic.id, label: topic.title })}>{weakCount ? 'Review notes' : 'Add review note'}</Button>
    </div>
  )
}

function classStats(courseId: string, data: ClassCenterViewData) {
  const topics = data.topics.filter((item) => item.courseId === courseId)
  const coveredCount = topics.filter((topic) => (topic.linkedFileIds?.length ?? 0) || topic.sourceNoteIds.length).length
  const upcoming = data.assignments
    .filter((item) => item.courseId === courseId && item.status !== 'submitted' && item.status !== 'graded' && item.dueDate)
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
  return {
    topicCount: topics.length,
    coveredCount,
    materialCount: data.files.filter((item) => item.courseId === courseId).length,
    notesCount: data.notes.filter((item) => item.courseId === courseId).length,
    filesCount: data.files.filter((item) => item.courseId === courseId).length,
    // Remote material processing — the one place on this page where work can
    // still be running or have failed, so the card has to say so.
    processingCount: data.files.filter((item) => item.courseId === courseId && item.processingStatus === 'pending').length,
    failedCount: data.files.filter((item) => item.courseId === courseId && item.processingStatus === 'failed').length,
    nextDeadline: upcoming[0],
  }
}

type ClassDailyVerb = 'Study' | 'Draft' | 'Read' | 'Log'
type ClassSignal = { text?: string; verb?: ClassDailyVerb }

function classSignal(row: ClassWorkspaceView, data: ClassCenterViewData, stats: ReturnType<typeof classStats>, fallback: string): ClassSignal {
  if (row.type === 'writing') {
    const draft = data.paperDrafts.filter((item) => item.courseId === row.id).sort((a, b) => a.order - b.order).find((item) => item.stage !== 'submitted')
    const courseReadings = data.assignedReadings.filter((item) => item.courseId === row.id)
    const nextReading = nextIncompleteReading(courseReadings)
    const listState = row.readingListState ?? 'unknown'
    const behind = readingDebt(courseReadings, listState, new Date().toISOString().slice(0, 10))
    if (draft) return { verb: 'Draft', text: `${draft.title} · ${draft.stage}` }
    if (behind) return { verb: 'Read', text: `${behind} reading${behind === 1 ? '' : 's'} behind` }
    if (nextReading) return { verb: 'Read', text: nextReading.title }
    if (listState === 'unknown' || listState === 'partial') return { text: READING_LIST_STATE_COPY[listState] }
    return { text: fallback }
  }
  if (row.type === 'general') {
    // The deadline line below already names the record. Keep the action
    // legible without duplicating the same deadline on a compact card.
    return stats.nextDeadline ? { verb: 'Log' } : { text: fallback }
  }
  if (stats.topicCount > 0) return { verb: 'Study', text: `${stats.coveredCount} with material · ${stats.topicCount} syllabus topics` }
  return { text: 'No topics recorded yet' }
}

function coursePercent(courseId: string, data: ClassCenterViewData) {
  const graded = data.assignments.filter((assignment) =>
    assignment.courseId === courseId
    && assignment.status === 'graded'
    && assignment.pointsEarned != null
    && assignment.pointsPossible != null
    && assignment.pointsPossible > 0
  )
  if (!graded.length) return null
  const earned = graded.reduce((sum, assignment) => sum + (assignment.pointsEarned ?? 0), 0)
  const possible = graded.reduce((sum, assignment) => sum + (assignment.pointsPossible ?? 0), 0)
  return possible ? Math.round((earned / possible) * 1000) / 10 : null
}

function gradeTone(grade: Course['grade']) {
  if (/^A/.test(grade)) return 'text-success'
  if (/^B/.test(grade)) return 'text-warning'
  if (/^[CDF]/.test(grade)) return 'text-destructive'
  return 'text-muted-foreground'
}

function normalizedTopicStatus(status: TopicStatus) {
  return status
}

function activeWeakAreasForTopic(topicId: string, data: ClassCenterViewData) {
  return data.weakAreas.filter((area) => area.topicId === topicId && area.status !== 'resolved')
}

function topicPracticeStats(topicId: string, data: ClassCenterViewData) {
  const questions = data.practiceQuestions.filter((question) => question.topicIds.includes(topicId) && typeof question.isCorrect === 'boolean')
  const correct = questions.filter((question) => question.isCorrect).length
  return {
    total: questions.length,
    correct,
  }
}

function topicLinkedNotes(topicId: string, data: ClassCenterViewData) {
  return data.notes.filter((note) => note.topicIds.includes(topicId))
}

function topicLinkedAssignments(topicId: string, data: ClassCenterViewData) {
  return data.assignments.filter((assignment) => assignment.linkedTopicIds.includes(topicId) || (assignment.coveredTopicIds ?? []).includes(topicId))
}

function topicLinkedFiles(topicId: string, data: ClassCenterViewData) {
  return data.files.filter((file) => file.linkedTopicIds.includes(topicId))
}

function weakCoveredTopics(assignment: ClassAssignment, data: ClassCenterViewData) {
  const ids = assignment.coveredTopicIds?.length ? assignment.coveredTopicIds : assignment.linkedTopicIds
  return data.topics.filter((topic) => ids.includes(topic.id) && activeWeakAreasForTopic(topic.id, data).length)
}

function addWeakAreaFromQuestion(question: PracticeQuestion, data: ClassCenterViewData, mutate: ClassTabProps['mutate']) {
  const topic = data.topics.find((item) => question.topicIds.includes(item.id))
  addWeakArea(question.courseId, mutate, {
    topicId: topic?.id,
    label: topic?.title ?? 'Practice miss',
    source: 'practice-exam',
    reason: question.weakReason || 'conceptual',
    severity: 2,
    relatedPracticeQuestionId: question.id,
    notes: question.prompt,
  })
}

function classLabel(courseId: string, data: ClassCenterViewData) {
  const row = data.classes.find((item) => item.id === courseId)
  return row?.courseCode || row?.courseTitle || 'Class'
}

function compactMeeting(row: ClassWorkspaceView) {
  return [row.meetingDays, row.meetingTime, row.location].filter(Boolean).join(' · ')
}

function assignmentDateLabel(item: Pick<ClassAssignment, 'dueDate' | 'type'>) {
  return item.type === 'exam' ? fmtEventDate(item.dueDate) : fmtDeadline(item.dueDate)
}

function statusLabel(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5 text-sm font-bold">
      <span>{label}</span>
      {children}
    </label>
  )
}

function TopicPicker({
  label, topics, value, onChange, compact = false,
}: {
  label: string
  topics: Pick<Topic, 'id' | 'title' | 'unit'>[]
  value: string[]
  onChange: (value: string[]) => void
  compact?: boolean
}) {
  return (
    <div className={cn('space-y-2', compact && 'min-w-[180px]')}>
      <p className="text-xs font-extrabold uppercase text-muted-foreground">{label}</p>
      <div className="flex max-h-36 flex-wrap gap-1 overflow-y-auto rounded-xl border border-border bg-card p-2">
        {topics.map((topic) => (
          <ToggleChip key={topic.id} selected={value.includes(topic.id)} onClick={() => onChange(toggleValue(value, topic.id))}>
            {topic.title}
          </ToggleChip>
        ))}
        {!topics.length && <span className="text-xs font-semibold text-muted-foreground">No options yet</span>}
      </div>
    </div>
  )
}

function TopicChipList({ ids, data }: { ids: string[]; data: ClassCenterViewData }) {
  const topics = ids.map((id) => data.topics.find((topic) => topic.id === id)).filter(Boolean) as Topic[]
  if (!topics.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {topics.slice(0, 4).map((topic) => (
        <span key={topic.id} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-extrabold text-primary">{topic.title}</span>
      ))}
      {topics.length > 4 && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-extrabold text-muted-foreground">+{topics.length - 4}</span>}
    </div>
  )
}

function ToggleChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-xs font-extrabold transition',
        selected ? 'border-primary bg-primary/14 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-muted'
      )}
    >
      {children}
    </button>
  )
}

function ProgressLine({ value, muted }: { value: number; muted?: boolean }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className={cn('h-full rounded-full transition-[width] motion-reduce:transition-none', muted ? 'bg-muted-foreground/30' : 'bg-primary')} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

function TopicReferenceBadge({ label, count }: { label: string; count: number }) {
  if (!count) return null
  return <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">{count} {label}</span>
}

function toggleValue<T>(items: T[], item: T) {
  return items.includes(item) ? items.filter((value) => value !== item) : [...items, item]
}

function BannerField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  function handleFile(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2 md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold">Background / banner</span>
        {value && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange('')}>
            Clear
          </Button>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Input
          value={value.startsWith('data:image/') ? 'Attached image' : value}
          onChange={(e) => onChange(e.target.value === 'Attached image' ? value : e.target.value)}
          placeholder="Paste an image URL..."
        />
        <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-card px-3 text-sm font-bold shadow-sm transition hover:bg-muted">
          <Upload className="size-4" />
          Choose image
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      </div>
      {value && (
        <div className="overflow-hidden rounded-2xl border border-border bg-muted">
          <img src={value} alt="Class banner preview" className="h-28 w-full object-cover" />
        </div>
      )}
    </div>
  )
}

function InlineInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <input
      className="w-full rounded-md bg-transparent px-1.5 py-1 text-sm font-semibold outline-none transition hover:bg-muted/45 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-ring/35"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

function TinySelect({ value, options, labels, onChange }: { value: string; options: readonly string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 max-w-full rounded-full text-xs font-bold"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((item) => <SelectItem key={item} value={item}>{labels?.[item] ?? statusLabel(item)}</SelectItem>)}</SelectContent>
    </Select>
  )
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" onClick={onClick} aria-label="Delete">
      <Trash2 className="size-4 text-muted-foreground" />
    </Button>
  )
}
