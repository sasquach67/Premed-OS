import { useEffect, useMemo, useState, type CSSProperties, type DragEvent, type MouseEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, Archive, ArrowLeft, ArrowUpRight, Atom, BarChart3, BookOpen, Brain, BriefcaseBusiness,
  Building2, Calculator, CalendarClock, CalendarDays, CheckCircle2, Code2, Coins, Dna, Dumbbell, Earth, Edit3,
  FlaskConical, FolderOpen, Gavel, GraduationCap, HeartPulse, Landmark, Languages, Leaf, Lightbulb, Mail,
  Microscope, MoreHorizontal, Music2, NotebookText, Palette, PenLine, Plus, Scale, Search, Speech, Stethoscope,
  Telescope, Theater, Trees, UsersRound, Wrench, FileText, ChevronDown, ChevronUp, GripVertical, Grid2X2, List,
  Loader2, TrendingUp, Trash2, Upload, Users, type LucideIcon,
} from 'lucide-react'
import { useStore } from '@/store/store'
import { uid } from '@/lib/id'
import { fmtDeadline, fmtEventDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import type {
  AcademicTagColor, ClassAssignment, ClassWorkspace, ClassCenterData, Course, Person, ClassWorkspaceType,
} from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
import { SyllabusImportMode, type PastDueImportDecision, type ReimportDecision } from '@/components/academics/SyllabusImportMode'
import { SyllabusImportDialog } from '@/components/academics/SyllabusImportDialog'
import type { SyllabusItem, SyllabusProposal } from '@/lib/academics/syllabusParser'
import { retainLocalSyllabus } from '@/lib/academics/localSyllabusFiles'
import { retainLocalMaterial } from '@/lib/academics/localMaterialFiles'
import {
  syllabusAssignmentSourceKey,
  syllabusCategorySourceKey,
  syllabusReadingCalendarSourceKey,
  syllabusReadingSourceKey,
  syllabusScheduleSourceKey,
  type ReimportRow,
} from '@/lib/academics/syllabusReimport'
import { classTypeDraftDecision } from '@/lib/academics/classTypeDraftDecision'
import { nextIncompleteReading, readingDebt, READING_LIST_STATE_COPY } from '@/lib/academics/writingEvidence'
import { inferAcademicTerm } from '@/store/migrations/academicsV4'
import { persistConfirmedSyllabusEvidence } from '@/lib/academics/guideContract'
import { extractClassMeetingDays, extractClassMeetingTime, isOfficeHoursLine, isPlausibleClassMeetingTime, normalizeMeetingDays, proposePlausibleMeetingTime } from '@/lib/academics/meetingSchedule'
import { normalizeClassLocation, normalizeClassMeetingTime, normalizeClassTerm, normalizeClassWorkspaceIdentity, normalizeCourseCode, normalizeCourseTitle, normalizeInstructorName } from '@/lib/academics/classIdentity'
import { removeLocalBlob } from '@/lib/localBlobStore'
import { removeCourseCascade } from '@/lib/academics/removeCourseCascade'
import { readingTaskDueDate } from '@/lib/academics/readingSchedule'
import { classCardTaskSummary } from '@/lib/academics/classCardSummary'

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

const CLASS_TYPES: Array<{ value: ClassWorkspaceType; label: string; detail: string }> = [
  { value: 'stem', label: 'STEM', detail: 'Lessons and source-backed study work' },
  { value: 'writing', label: 'Writing', detail: 'Drafts, readings, feedback' },
  { value: 'general', label: 'General', detail: 'Grades and deadlines' },
]

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
  const namedLocations = [...locationText.matchAll(/\b((?:[A-Za-z]?\d{3,4}[A-Za-z]?\s+)?[A-Z][\w.'-]*(?:\s+[A-Z][\w.'-]*)*\s+(?:Center|Hall|Building)(?:\s*[·∙|,;-]?\s*(?:Room|Rm\.?)?\s*[A-Za-z]?\d+[A-Za-z]?)?)\b/g)]
    .map((match) => match[1].replace(/\s*[·∙|;-]\s*/g, ' ').replace(/\s+/g, ' ').trim())
  // DOCX two-column headers are flattened into one line. When that happens,
  // the instructor office appears first and the class location appears last.
  if (/^\s*office\s*:/i.test(line)) return namedLocations.length > 1 ? namedLocations.at(-1) ?? '' : ''
  return namedLocations[0]
    ?? line.match(/(?:room|location)\s*[:-]?\s*([\w -]{3,})/i)?.[1]?.trim()
    ?? ''
}

function extractInstructor(logistics: string[]): string {
  const line = logistics.find((candidate) => /(?:instructor|prof(?:essor)?)/i.test(candidate)) ?? ''
  const remainder = line.match(/(?:instructor|prof(?:essor)?)\.?\s*[:-]?\s*(.+)$/i)?.[1] ?? ''
  return remainder
    .split(/\s+(?=(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:office|student)\s+hours?|MWF|TR|TTH|T\s*(?:[/&]|and)\s*TH|Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|\d{1,2}(?::\d{2})?\s*(?:AM|PM)\b))/i)[0]
    .replace(/[\s,·;]+$/, '')
    .trim()
}

function extractAttributedInstructor(items: SyllabusItem[]): string {
  const professor = items.find((item) => item.kind === 'logistics' && item.context === 'Professor')
  if (professor) {
    const fromLabel = professor.label
      .replace(/^(?:instructor|professor|prof\.?)\s*:\s*/i, '')
      .replace(/[\s,·;]+$/, '')
      .trim()
    if (fromLabel) return fromLabel
  }

  // Older imported proposals may not carry a typed Professor context. Only
  // accept an explicit field label as the compatibility fallback; prose such
  // as "instructor testing accommodations" is a support record, not a name.
  const explicitlyLabeled = items
    .filter((item) => item.kind === 'logistics' && item.context !== 'Support resource')
    .map((item) => item.label || item.evidence.quote)
    .find((candidate) => /^(?:instructor|professor|prof\.?)\s*:/i.test(candidate))
  return explicitlyLabeled ? extractInstructor([explicitlyLabeled]) : ''
}

function cleanCourseTitle(value?: string): string {
  return (value ?? '')
    .replace(/\s*[-–—|·]\s*(?:Fall|Spring|Summer|Winter)\s+20\d{2}\b.*$/i, '')
    .replace(/\s*\((?:Fall|Spring|Summer|Winter)\s+20\d{2}\)\s*$/i, '')
    .trim()
}

function extractCourseTerm(proposal: SyllabusProposal, fallback: string): string {
  const source = `${proposal.items.find((item) => item.kind === 'identity')?.value ?? ''}\n${proposal.text}`
  const termFirst = source.match(/\b(Fall|Spring|Summer|Winter)\s+(20\d{2})\b/i)
  const yearFirst = source.match(/\b(20\d{2})\s+(Fall|Spring|Summer|Winter)\b/i)
  if (termFirst) return `${termFirst[1]} ${termFirst[2]}`
  if (yearFirst) return `${yearFirst[2]} ${yearFirst[1]}`
  return fallback
}

export function classFormFromSyllabus(proposal: SyllabusProposal, semester: string): ClassFormState {
  const identity = proposal.items.find((item) => item.kind === 'identity')
  const logisticsItems = proposal.items.filter((item) => item.kind === 'logistics')
  const logistics = logisticsItems.map((item) => item.label || item.evidence.quote)
  const instructor = normalizeInstructorName(extractAttributedInstructor(logisticsItems))
  const scheduleLine = logistics.find((line) => Boolean(extractClassMeetingDays(line))) ?? ''
  const rawScheduleLine = proposal.text.split(/\r?\n/).find((line) => {
    const time = extractClassMeetingTime(line)
    return Boolean(extractClassMeetingDays(line)) && Boolean(time) && isPlausibleClassMeetingTime(time)
      && !/\b(?:due|deadline|submit|quiz|assignment|assessment|office hours?|student hours?)\b/i.test(line)
      && (/\b(?:section|class|lectures?|meets?|meeting)\b/i.test(line) || /^(?:MWF|M\s*\/\s*W\s*\/\s*F|TR|TTH|TU\s*(?:\/|&|and)\s*TH|T\s*(?:\/|&|and)\s*TH)\b/i.test(line))
  }) ?? ''
  const meetingDays = extractClassMeetingDays(scheduleLine) || extractClassMeetingDays(rawScheduleLine)
  const reviewedMeetingTime = logisticsItems.find((item) => item.label === 'Meeting time' && item.confidence === 'low')?.value
  const rawMeetingTime = extractClassMeetingTime(scheduleLine) || extractClassMeetingTime(rawScheduleLine)
  const meetingTime = reviewedMeetingTime || proposePlausibleMeetingTime(rawMeetingTime) || rawMeetingTime
  const locationLines = logisticsItems
    .filter((item) => item.context !== 'Support resource')
    .map((item) => item.label || item.evidence.quote)
    .filter((line) => {
      const locationAt = line.search(/\b(?:room|location|hall|center|building)\b/i)
      const officeHoursAt = line.search(/\b(?:office|student)\s+hours?\b/i)
      return locationAt >= 0
        && (officeHoursAt < 0 || locationAt < officeHoursAt)
        && !/same location as class meetings/i.test(line)
    })
  // A room on the selected section schedule outranks every unrelated named
  // place elsewhere in the syllabus (testing centers, offices, and support
  // buildings are common false positives).
  const location = extractClassLocation(scheduleLine)
    || extractClassLocation(rawScheduleLine)
    || locationLines.map(extractClassLocation).find(Boolean)
    || ''
  return {
    ...emptyClassForm(semester),
    semester: normalizeClassTerm(extractCourseTerm(proposal, semester)),
    courseCode: normalizeCourseCode(identity?.label ?? ''),
    courseTitle: normalizeCourseTitle(cleanCourseTitle(identity?.value), normalizeCourseCode(identity?.label ?? '')),
    instructor,
    meetingDays: normalizeMeetingDays(meetingDays),
    meetingTime: normalizeClassMeetingTime(meetingTime),
    location: normalizeClassLocation(location),
  }
}

function upsertReadingCalendarAssignment(center: ClassCenterData, courseId: string, item: SyllabusItem, linkedFileIds: string[], now: number) {
  if (!item.value) return
  const key = syllabusReadingCalendarSourceKey(item.label, item.context, item.value)
  const dueDate = readingTaskDueDate(item.value)
  const title = `Read ${item.label} before class`
  const notes = `Task due ${dueDate}; scheduled class ${item.value}. Source: ${item.evidence.location} — “${item.evidence.quote}”`
  const existing = center.assignments.find((assignment) => assignment.courseId === courseId && assignment.syllabusSourceKey === key)
  if (existing) {
    Object.assign(existing, { title, type: 'reading' as const, dueDate, notes, linkedFileIds: [...new Set([...existing.linkedFileIds, ...linkedFileIds])], updatedAt: now })
    return
  }
  center.assignments.push({
    id: uid(), courseId, title, syllabusSourceKey: key, type: 'reading', dueDate,
    status: 'not-started', linkedTopicIds: [], linkedFileIds, notes, createdAt: now, updatedAt: now,
    order: center.assignments.filter((assignment) => assignment.courseId === courseId).length,
  })
}

function applyPastSyllabusWorkDecisions(center: ClassCenterData, courseId: string, proposal: SyllabusProposal, decisions: PastDueImportDecision[], now: number) {
  const actionByItemId = new Map(decisions.map((decision) => [decision.itemId, decision.action]))
  const items = proposal.items.filter((item) => actionByItemId.has(item.id))
  const assignmentAction = new Map<string, PastDueImportDecision['action']>()
  const readingAction = new Map<string, PastDueImportDecision['action']>()

  items.forEach((item) => {
    const action = actionByItemId.get(item.id)!
    if (item.kind === 'readings') {
      readingAction.set(syllabusReadingSourceKey(item.label, item.context, item.value), action)
      assignmentAction.set(syllabusReadingCalendarSourceKey(item.label, item.context, item.value), action)
    } else if (item.kind === 'exams' || item.kind === 'deadlines') {
      assignmentAction.set(syllabusAssignmentSourceKey(item.label, item.value), action)
    }
  })

  center.assignments = center.assignments.filter((assignment) => {
    if (assignment.courseId !== courseId || !assignment.syllabusSourceKey) return true
    const action = assignmentAction.get(assignment.syllabusSourceKey)
    if (!action) return true
    if (action === 'ignore') return false
    if (action === 'complete' && (assignment.status === 'not-started' || assignment.status === 'in-progress')) {
      assignment.status = 'submitted'
      assignment.updatedAt = now
    }
    return true
  })
  center.assignedReadings = center.assignedReadings.filter((reading) => {
    if (reading.courseId !== courseId || !reading.syllabusSourceKey) return true
    const action = readingAction.get(reading.syllabusSourceKey)
    if (!action) return true
    if (action === 'ignore') return false
    if (action === 'complete' && reading.status !== 'read') {
      reading.status = 'read'
      reading.updatedAt = now
    }
    return true
  })
}

function applySyllabusOperationalContext(center: ClassCenterData, courseId: string, proposal: SyllabusProposal, sourceFileIdForItem: (item: SyllabusItem) => string | undefined, now: number) {
  const workspace = center.workspaces.find((item) => item.courseId === courseId)
  const logistics = proposal.items.filter((item) => item.kind === 'logistics')
  const professorRecord = logistics.find((item) => item.context === 'Professor')
    ?? logistics.find((item) => /(?:instructor|prof(?:essor)?)\s*:/i.test(item.label))
  const emailFrom = (item?: SyllabusItem) => `${item?.label ?? ''} ${item?.value ?? ''}`.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0]
  const courseContactEmail = emailFrom(logistics.find((item) => item.context === 'Course contact'))
  const sharedStaffEmail = emailFrom(logistics.find((item) => item.context === 'Support resource' && /Instructor and IAs/i.test(item.label)))
  const professorEmail = emailFrom(professorRecord) ?? courseContactEmail ?? sharedStaffEmail
  const professorName = workspace?.instructor?.trim()
  if (professorName) {
    const officeHours = logistics.find((item) => /^Office Hours\s*:/i.test(item.label))?.label.replace(/^Office Hours\s*:\s*/i, '')
      ?? professorRecord?.value?.replace(professorEmail ?? '', '').replace(/^[\s·;,-]+/, '').trim()
    const existing = center.contacts.find((contact) => contact.courseId === courseId && contact.role === 'professor' && contact.name.toLowerCase() === professorName.toLowerCase())
    if (existing) Object.assign(existing, { email: professorEmail || existing.email, officeHours: officeHours || existing.officeHours, updatedAt: now })
    else center.contacts.push({ id: uid(), courseId, name: professorName, role: 'professor', email: professorEmail, officeHours, createdAt: now, updatedAt: now, order: center.contacts.filter((contact) => contact.courseId === courseId).length })
  }
  logistics.filter((item) => item.context === 'Teaching assistant').forEach((item) => {
    // A course or teaching-team address is not evidence that it belongs to
    // each individual assistant. Only attach an address that the source scoped
    // directly to this TA; shared contacts remain course-level information.
    const email = emailFrom(item)
    const officeHours = item.value?.replace(email ?? '', '').replace(/^[\s·;,-]+/, '').trim()
    const location = /\bat\s+(.+)$/i.exec(officeHours ?? '')?.[1]
    const existing = center.contacts.find((contact) => contact.courseId === courseId && contact.role === 'TA' && contact.name.toLowerCase() === item.label.toLowerCase())
    if (existing) Object.assign(existing, { officeHours: officeHours || existing.officeHours, location: location || existing.location, email: email || existing.email, updatedAt: now })
    else center.contacts.push({ id: uid(), courseId, name: item.label, role: 'TA', email, officeHours, location, notes: `Imported from ${item.evidence.location}.`, createdAt: now, updatedAt: now, order: center.contacts.filter((contact) => contact.courseId === courseId).length })
  })

  const contextItems = proposal.items.filter((item) => item.kind === 'policies' || ['Support resource', 'Course requirement', 'Course context', 'Course material', 'Course operations', 'Course detail'].includes(item.context ?? ''))
  contextItems.forEach((item) => {
    const title = item.label
    const fileId = sourceFileIdForItem(item)
    const content = [item.value, item.evidence.quote, `Source: ${item.evidence.location}`].filter(Boolean).join('\n\n')
    const existing = center.notes.find((note) => note.courseId === courseId && note.kind === 'about-class' && note.title === title)
    if (existing) {
      existing.content = content
      existing.linkedFileIds = [...new Set([...existing.linkedFileIds, ...(fileId ? [fileId] : [])])]
      existing.updatedAt = now
      return
    }
    center.notes.push({ id: uid(), courseId, title, type: 'other', kind: 'about-class', topicIds: [], content, syncStatus: 'local-only', linkedFileIds: fileId ? [fileId] : [], createdAt: now, updatedAt: now, order: center.notes.filter((note) => note.courseId === courseId).length })
  })
}

function classToForm(row: ClassWorkspaceView): ClassFormState {
  return {
    courseCode: row.courseCode,
    courseTitle: row.courseTitle,
    nickname: row.nickname ?? '',
    semester: row.semester,
    instructor: row.instructor ?? '',
    meetingDays: normalizeMeetingDays(row.meetingDays ?? ''),
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
  return normalizeClassWorkspaceIdentity({ ...workspace, type: form.type, readingListState: form.readingListState ?? 'unknown' })
}

function canonicalCourseFields(form: Pick<ClassFormState, 'courseCode' | 'courseTitle' | 'semester'>) {
  const code = normalizeCourseCode(form.courseCode)
  return {
    code,
    title: normalizeCourseTitle(form.courseTitle, code),
    term: normalizeClassTerm(form.semester),
  }
}

/** Applies only a student's explicit review choices. The diff itself stays in
 * syllabusReimport.ts; these keys merely locate the records that it identified. */
function applyAcceptedReimport(center: ClassCenterData, courseId: string, proposal: SyllabusProposal, decisions: ReimportDecision[], sourceFileId: string | undefined, now: number) {
  const accepted = decisions.filter((decision) => decision.action === 'accept')
  const acceptedRows = new Set(accepted.map((decision) => `${decision.row.kind}:${decision.row.key}`))
  const wants = (kind: ReimportRow['kind'], key: string) => acceptedRows.has(`${kind}:${key}`)
  const removed = new Set(accepted.filter((decision) => decision.row.status === 'removed').map((decision) => `${decision.row.kind}:${decision.row.key}`))

  // A removed syllabus line is preserved unless the student explicitly accepts its removal.
  center.assignments = center.assignments.filter((item) => item.courseId !== courseId || !removed.has(`assignment:${item.syllabusSourceKey ?? syllabusAssignmentSourceKey(item.title, item.dueDate)}`))
  center.gradeCategories = center.gradeCategories.filter((item) => item.courseId !== courseId || !removed.has(`category:${item.syllabusSourceKey ?? syllabusCategorySourceKey(item.name)}`))
  center.assignedReadings = center.assignedReadings.filter((item) => item.courseId !== courseId || !removed.has(`reading:${item.syllabusSourceKey ?? syllabusReadingSourceKey(item.title, item.week, item.dueForDiscussion)}`))
  center.assignments = center.assignments.filter((item) => {
    if (item.courseId !== courseId || !item.syllabusSourceKey?.startsWith('reading-calendar:')) return true
    return ![...removed].some((removedKey) => removedKey.startsWith('reading:') && item.syllabusSourceKey === `reading-calendar:${removedKey.slice('reading:'.length)}`)
  })
  const workspace = center.workspaces.find((item) => item.courseId === courseId)
  if (workspace?.syllabusSchedule) workspace.syllabusSchedule = workspace.syllabusSchedule.filter((item) => !removed.has(`schedule:${syllabusScheduleSourceKey(item.label, item.week, item.startDate)}`))

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
      upsertReadingCalendarAssignment(center, courseId, item, sourceFileId ? [sourceFileId] : [], now)
      return
    }
    center.assignedReadings.push({ id: uid(), courseId, week, title: item.label, syllabusSourceKey: key, source: `${item.evidence.location} — “${item.evidence.quote}”`, status: 'not-started', dueForDiscussion: item.value, createdAt: now, updatedAt: now, order: center.assignedReadings.filter((reading) => reading.courseId === courseId).length })
    upsertReadingCalendarAssignment(center, courseId, item, sourceFileId ? [sourceFileId] : [], now)
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
    if (item.kind === 'standards') return true // Retain objectives as source evidence only.
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
  const reordered = [...before, ...orderedVisible, ...after]
  reordered.forEach((row, index) => {
    row.order = index
    row.updatedAt = Date.now()
  })
  // Store reconciliation normalizes workspace order from array position after
  // every update. Updating only the numeric field therefore looks successful
  // for one render, then snaps back. Keep the source array and its order fields
  // in the same sequence so drag, buttons, hydration, and future sync agree.
  draft.workspaces = reordered
}

export function ClassCenter({ archiveOnly = false, onFirstSyllabusClassCreated }: { archiveOnly?: boolean; onFirstSyllabusClassCreated?: () => void }) {
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
      onFirstSyllabusClassCreated={onFirstSyllabusClassCreated}
    />
  )
}

function ClassCenterDashboard({
  data, persons, recommendations, currentTerm, terms, courses, mutate, updateAll, archiveOnly, onFirstSyllabusClassCreated,
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
  onFirstSyllabusClassCreated?: () => void
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
  const [reorderOpen, setReorderOpen] = useState(false)
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
  async function importSyllabus(form: ClassFormState, selectedFiles: File[], proposal?: SyllabusProposal, existingCourseId?: string, reimportDecisions?: ReimportDecision[], replaceSyllabusFileId?: string, pastDueDecisions?: PastDueImportDecision[]) {
    const isFirstSyllabusClass = !existingCourseId && data.classes.length === 0
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
        id: courseId, ...canonicalCourseFields(form), code: normalizeCourseCode(form.courseCode) || 'NEW 101', title: normalizeCourseTitle(form.courseTitle, form.courseCode) || 'Untitled class',
        credits: 3, grade: '', bcpm: false, status: 'in-progress', inResidence: true,
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
        proposal.items.filter((item) => item.kind === 'exams' || item.kind === 'deadlines').forEach((item, index) => center.assignments.push({
          id: uid(), courseId, title: item.label, syllabusSourceKey: syllabusAssignmentSourceKey(item.label, item.value), type: item.kind === 'exams' ? 'exam' : 'other', dueDate: item.value, status: 'not-started', linkedTopicIds: [], linkedFileIds: linkedFileIdsForItem(item), notes: `Source: ${item.evidence.location} — “${item.evidence.quote}”`, createdAt: now, updatedAt: now, order: index,
        }))
        proposal.items.filter((item) => item.kind === 'weights').forEach((item, index) => center.gradeCategories.push({
          id: uid(), courseId, name: item.label || 'Untitled category', syllabusSourceKey: syllabusCategorySourceKey(item.label), weight: Number(item.value?.replace('%', '')) || 0,
          source: `${item.evidence.location} — “${item.evidence.quote}”`, createdAt: now, updatedAt: now, order: index,
        }))
        proposal.items.filter((item) => item.kind === 'readings').forEach((item, index) => {
          center.assignedReadings.push({
            id: uid(), courseId, week: item.context ?? 'Unscheduled', title: item.label,
            syllabusSourceKey: syllabusReadingSourceKey(item.label, item.context, item.value),
            source: `${item.evidence.location} — “${item.evidence.quote}”`, status: 'not-started', dueForDiscussion: item.value,
            createdAt: now, updatedAt: now, order: index,
          })
          upsertReadingCalendarAssignment(center, courseId, item, linkedFileIdsForItem(item), now)
        })
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
        applySyllabusOperationalContext(center, courseId, proposal, sourceFileIdForItem, now)
      }
      if (pastDueDecisions?.length && proposal) applyPastSyllabusWorkDecisions(center, courseId, proposal, pastDueDecisions, now)
    })
    setSyllabusImportOpen(false)
    if (isFirstSyllabusClass) onFirstSyllabusClassCreated?.()
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
      onImport={(form, files, proposal, courseId, decisions, replaceFileId, pastDueAction) => importSyllabus(
        // Syllabus import owns a separate confirmation flow. Preserve its
        // established workspace shape here; the manual add dialog below is
        // the only surface this fidelity pass changes.
        { ...emptyClassForm(form.semester), type: 'stem', courseCode: form.courseCode, courseTitle: form.courseTitle },
        files, proposal, courseId, decisions, replaceFileId, pastDueAction,
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
    // The review surface replaces the editor on the next render. Do not
    // programmatically close the controlled dialog here: its close callback
    // treats a dismissal as cancellation and clears the parsed syllabus draft.
    const next = new URLSearchParams(searchParams)
    next.set('reviewImport', '1')
    setSearchParams(next, { replace: true })
  }

  async function finishImportedClass(
    reviewedClass: { courseCode: string; courseTitle: string; semester: string },
    files: File[],
    proposal?: SyllabusProposal,
    _existingCourseId?: string,
    _decisions?: ReimportDecision[],
    _replaceFileId?: string,
    pastDueDecisions?: PastDueImportDecision[],
  ) {
    if (!syllabusReviewForm || !proposal) return
    await importSyllabus({ ...syllabusReviewForm, ...reviewedClass }, files, proposal, undefined, undefined, undefined, pastDueDecisions)
    setSyllabusDraft(null)
    setSyllabusReviewForm(null)
    setEditor({ open: false, form: emptyClassForm(semester) })
    const next = new URLSearchParams(searchParams)
    next.delete('reviewImport')
    if (scopedCourseId === 'new') next.delete('importFor')
    setSearchParams(next, { replace: true })
  }

  function backToImportedClassDetails(reviewedProposal: SyllabusProposal) {
    if (!syllabusDraft || !syllabusReviewForm) return
    const form = syllabusReviewForm
    setSyllabusDraft({ ...syllabusDraft, proposal: reviewedProposal })
    setSyllabusReviewForm(null)
    setEditor({ open: true, source: 'syllabus', form })
    const next = new URLSearchParams(searchParams)
    next.delete('reviewImport')
    setSearchParams(next, { replace: true })
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
          const next = new URLSearchParams(searchParams)
          next.delete('reviewImport')
          if (scopedCourseId === 'new') next.delete('importFor')
          setSearchParams(next, { replace: true })
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
        if (course) Object.assign(course, canonicalCourseFields(form))
        if (workspace) Object.assign(workspace, workspaceFields(form), { updatedAt: now })
      } else {
        const courseId = uid()
        createdCourseId = courseId
        draft.courses.push({
          id: courseId,
          ...canonicalCourseFields(form),
          code: normalizeCourseCode(form.courseCode) || 'NEW 101',
          title: normalizeCourseTitle(form.courseTitle, form.courseCode) || 'Untitled class',
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

  function moveClassBy(courseId: string, offset: -1 | 1) {
    const visibleIds = filtered.map((row) => row.id)
    const from = visibleIds.indexOf(courseId)
    const to = from + offset
    if (from < 0 || to < 0 || to >= visibleIds.length) return
    const nextVisibleIds = [...visibleIds]
    ;[nextVisibleIds[from], nextVisibleIds[to]] = [nextVisibleIds[to], nextVisibleIds[from]]
    mutate((draft) => reorderClasses(draft, nextVisibleIds))
  }

  return (
    <div className="space-y-5">
      <div className="academics-filter-bar flex flex-col gap-3 px-0 py-2 lg:flex-row lg:items-center">
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
          <Input className="pl-9" placeholder="Find a class or note…" value={query} onChange={(event) => setQuery(event.target.value)} />
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

      <Card className="academics-class-panel w-full max-w-[1100px]">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>{archiveOnly ? 'Archived classes' : 'Your classes'}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{semester}</p>
          </div>
          {!archiveOnly && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{filtered.length} active</Badge>
              {filtered.length > 1 && (
                <Button size="sm" variant="outline" onClick={() => setReorderOpen(true)}>
                  <GripVertical className="size-4" /> Reorder
                </Button>
              )}
              <Button size="sm" onClick={openColdSyllabusImport}>
                <Plus className="size-4" /> Add class
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {view === 'cards' ? (
            <div
              data-testid="class-card-grid"
              className="grid items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              {filtered.map((row) => (
              <ClassCard
                key={row.id}
                row={row}
                data={data}
                compact={false}
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
          ) : (
            <div data-testid="class-list" role="list" className="space-y-2">
              {filtered.map((row) => (
                <ClassListRow
                  key={row.id}
                  row={row}
                  data={data}
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
          )}
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
          onOpenAssignment={(courseId, assignmentId) => navigate(`/academics/classes/${courseId}?classTab=assignments&view=agenda&assignment=${encodeURIComponent(assignmentId)}`)}
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

      <Dialog open={reorderOpen} onOpenChange={setReorderOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reorder classes</DialogTitle>
            <p className="text-sm font-semibold text-muted-foreground">Set the order used in both Cards and List views for {semester}.</p>
          </DialogHeader>
          <div className="space-y-2" role="list" aria-label="Classes in display order">
            {filtered.map((row, index) => (
              <div
                key={row.id}
                role="listitem"
                className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-muted/45 p-2.5"
                style={cardAccentVars(row.color)}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--class-accent)_14%,var(--card))] text-[var(--class-accent)]">
                  <GripVertical className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-extrabold">{row.courseCode || row.nickname || 'Untitled class'}</p>
                  <p className="truncate text-xs font-semibold text-muted-foreground">{row.courseTitle || 'Add class details'}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-9"
                    aria-label={`Move ${row.courseCode || row.courseTitle} up`}
                    disabled={index === 0}
                    onClick={() => moveClassBy(row.id, -1)}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-9"
                    aria-label={`Move ${row.courseCode || row.courseTitle} down`}
                    disabled={index === filtered.length - 1}
                    onClick={() => moveClassBy(row.id, 1)}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setReorderOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

function ClassListRow({
  row, data, dragging, dragOver, onPreview, onOpen,
  onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd, onEdit, onImport, onArchive, onDelete,
}: {
  row: ClassWorkspaceView
  data: ClassCenterViewData
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
  const stats = classStats(row.id, data)
  const percent = coursePercent(row.id, data)
  const nextTaskSummary = stats.nextDeadline?.title
    ? classCardTaskSummary(stats.nextDeadline.title)
    : 'No deadline scheduled'
  const weeklySummary = stats.weeklyCourseworkTotal > 0
    ? `${stats.weeklyCourseworkComplete}/${stats.weeklyCourseworkTotal} done this week`
    : 'Week clear'

  function openFromRow(event: MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest('button,a,[role="menuitem"]')) return
    onPreview()
  }

  const rowContent = (
    <div
      data-testid="class-list-row"
      draggable
      onClick={openFromRow}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={cardAccentVars(row.color)}
      className={cn(
        'group/class relative grid min-h-[76px] cursor-pointer items-center gap-3 overflow-hidden rounded-[13px] border border-[color-mix(in_srgb,var(--class-accent)_17%,var(--border))] bg-[linear-gradient(110deg,color-mix(in_srgb,var(--class-accent)_8%,var(--muted)),var(--card)_42%)] px-3 py-2.5 shadow-none transition-[border-color,background-color,box-shadow] hover:border-[var(--class-accent-45)] sm:grid-cols-[minmax(0,1.2fr)_5.5rem_minmax(150px,.8fr)_auto]',
        dragging && 'scale-[0.99] opacity-55',
        dragOver && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-[var(--class-accent)] opacity-80" aria-hidden="true" />

      <button
        type="button"
        className="flex min-w-0 items-center gap-3 rounded-lg pl-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Preview ${row.courseCode || row.nickname || 'Untitled class'} ${row.courseTitle}`}
        onClick={(event) => { event.stopPropagation(); onPreview() }}
      >
        <ClassIcon
          icon={row.icon}
          className="size-9 rounded-xl bg-[color-mix(in_srgb,var(--class-accent)_14%,var(--card))] text-[var(--class-accent)]"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-extrabold">{row.courseCode || row.nickname || 'Untitled class'}</p>
          <p className="truncate text-xs font-semibold text-muted-foreground">{row.courseTitle || row.nickname || 'Add class details'}</p>
        </div>
      </button>

      <div className="flex items-center justify-between gap-3 pl-12 sm:block sm:pl-0 sm:text-center">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground sm:hidden">Grade</span>
        <div>
          <p className={cn('font-display text-base font-extrabold leading-none', gradeTone(row.grade))}>{row.grade || '—'}</p>
          {percent != null && <p className="mt-1 text-[10px] font-bold tabular-nums text-muted-foreground">{percent}%</p>}
        </div>
      </div>

      <div className="min-w-0 border-t border-border/70 pt-2 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
        {stats.nextDeadline ? (
          <Link
            to={`/academics/classes/${row.id}?classTab=assignments&view=agenda&assignment=${encodeURIComponent(stats.nextDeadline.id)}`}
            title={stats.nextDeadline.title}
            className="block min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="block truncate text-xs font-extrabold text-foreground">{nextTaskSummary}</span>
            <span className="mt-1 block truncate text-[10px] font-bold text-muted-foreground">
              {stats.nextDeadline.dueDate ? assignmentDateLabel(stats.nextDeadline) : weeklySummary}
            </span>
          </Link>
        ) : (
          <div>
            <p className="truncate text-xs font-extrabold text-foreground">{nextTaskSummary}</p>
            <p className="mt-1 truncate text-[10px] font-bold text-muted-foreground">{weeklySummary}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-1 border-t border-border/70 pt-2 sm:border-0 sm:pt-0">
        <Button size="sm" variant="outline" className="h-9" onClick={(event) => { event.stopPropagation(); onOpen() }}>
          Open <ArrowUpRight className="size-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-9" aria-label="Class actions" onClick={(event) => event.stopPropagation()}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{row.courseCode || 'Class'}</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link to={`/academics/classes/${row.id}`}><ArrowUpRight className="size-4" /> Open class hub</Link></DropdownMenuItem>
            <DropdownMenuItem onClick={onImport}><Upload className="size-4" /> Import syllabus</DropdownMenuItem>
            {row.type === 'stem' && <DropdownMenuItem asChild><Link to={`/academics/classes/${row.id}?classTab=overview&captureLecture=1`}><CheckCircle2 className="size-4" /> Add lecture transcript</Link></DropdownMenuItem>}
            <DropdownMenuItem asChild><Link to={`/academics/classes/${row.id}?classTab=materials`}><NotebookText className="size-4" /> Create study resources</Link></DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}><Edit3 className="size-4" /> Class settings</DropdownMenuItem>
            <DropdownMenuItem onClick={onArchive}><Archive className="size-4" /> {row.status === 'archived' ? 'Restore' : 'Archive'}</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="size-4" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <div role="listitem">
      <ContextMenu>
        <ContextMenuTrigger asChild>{rowContent}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={onOpen}><ArrowUpRight className="size-4" /> Open class hub</ContextMenuItem>
          <ContextMenuItem onSelect={onImport}><Upload className="size-4" /> Import syllabus</ContextMenuItem>
          {row.type === 'stem' && <ContextMenuItem asChild><Link to={`/academics/classes/${row.id}?classTab=overview&captureLecture=1`}><CheckCircle2 className="size-4" /> Add lecture transcript</Link></ContextMenuItem>}
          <ContextMenuItem asChild><Link to={`/academics/classes/${row.id}?classTab=materials`}><NotebookText className="size-4" /> Create study resources</Link></ContextMenuItem>
          <ContextMenuItem onSelect={onEdit}><Edit3 className="size-4" /> Class settings</ContextMenuItem>
          <ContextMenuItem onSelect={onArchive}><Archive className="size-4" /> {row.status === 'archived' ? 'Restore' : 'Archive'}</ContextMenuItem>
          <ContextMenuItem onSelect={onDelete} className="text-destructive"><Trash2 className="size-4" /> Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
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
  const stats = classStats(row.id, data)
  const nextTaskSummary = stats.nextDeadline?.title
    ? classCardTaskSummary(stats.nextDeadline.title)
    : 'No deadline scheduled'
  const nextText = stats.nextDeadline?.title
    ? `${nextTaskSummary}${stats.nextDeadline.dueDate ? ` · ${assignmentDateLabel(stats.nextDeadline)}` : ''}`
    : nextTaskSummary
  const percent = coursePercent(row.id, data)
  const signal = classSignal(row, data, stats, nextText)
  const courseworkPercent = stats.weeklyCourseworkTotal > 0
    ? Math.round((stats.weeklyCourseworkComplete / stats.weeklyCourseworkTotal) * 100)
    : 0

  function openFromCard(event: MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest('button,a,[role="menuitem"]')) return
    onPreview()
  }

  const card = (
    <Card
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
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={cardAccentVars(row.color)}
      className={cn(
        'academics-class-card group/class relative h-full self-stretch cursor-pointer overflow-hidden shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none',
        compact ? 'min-h-0' : 'min-h-0',
        dragging && 'scale-[0.98] opacity-55',
        dragOver && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <span className={cn(
        'academics-class-bar absolute inset-y-0 left-0 w-1 origin-left opacity-70 transition-[opacity,box-shadow] duration-150 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none',
        'bg-[var(--class-accent)]',
        'group-hover/class:opacity-100',
      )} aria-hidden="true" />
      <CardContent className={cn(
        compact
          ? 'grid items-center gap-4 p-3 md:grid-cols-[minmax(0,1.2fr)_auto_minmax(160px,.7fr)_auto]'
          : 'flex min-h-0 flex-col gap-3 p-3',
      )}>
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-1.5">
            <span
              draggable
              data-testid="class-card-drag-handle"
              title="Drag to reorder"
              aria-hidden="true"
              className="-ml-1 grid size-7 shrink-0 cursor-grab place-items-center rounded-md text-muted-foreground/70 transition-[background-color,color,opacity] hover:bg-[color-mix(in_srgb,var(--class-accent)_12%,transparent)] hover:text-[var(--class-accent)] active:cursor-grabbing motion-reduce:transition-none"
              onClick={(event) => event.stopPropagation()}
              onDragStart={(event) => {
                const cardElement = event.currentTarget.closest<HTMLElement>('.academics-class-card')
                if (cardElement) event.dataTransfer.setDragImage(cardElement, cardElement.clientWidth / 2, 24)
                onDragStart(event)
              }}
              onDragEnd={onDragEnd}
            >
              <GripVertical className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-display text-[15.5px] font-bold leading-tight">
                <span className="size-2 shrink-0 rounded-[3px] bg-[var(--class-accent)]" aria-hidden="true" />
                <span>{row.courseCode || row.nickname || 'Untitled class'}</span>
              </p>
              <p className="mt-0.5 line-clamp-1 text-[10.5px] font-semibold text-muted-foreground">{row.courseTitle || row.nickname || 'Add class details'}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className={cn('font-display text-lg font-extrabold leading-none', gradeTone(row.grade))}>{row.grade || '—'}</p>
            {percent != null && <p className="mt-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">{percent}%</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {stats.materialCount > 0 && <Badge className="px-2 py-0 text-[9.5px] font-extrabold" variant="secondary">{stats.materialCount} {stats.materialCount === 1 ? 'material' : 'materials'}</Badge>}
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
            {signal.text && <span className="line-clamp-1">{signal.text}</span>}
          </p>
          <div
            className="academics-coursework-progress"
            role="progressbar"
            aria-label={stats.weeklyCourseworkTotal > 0
              ? `${stats.weeklyCourseworkComplete} of ${stats.weeklyCourseworkTotal} coursework items complete this week; ${stats.weeklyCourseworkRemaining} left`
              : 'No coursework due this week'}
            aria-valuemin={0}
            aria-valuemax={stats.weeklyCourseworkTotal || 1}
            aria-valuenow={stats.weeklyCourseworkComplete}
          >
            <div className="academics-coursework-head">
              <p>Weekly progress</p>
              <strong>{stats.weeklyCourseworkTotal > 0 ? `${stats.weeklyCourseworkRemaining} left` : 'Clear this week'}</strong>
            </div>
            <div className="academics-coursework-track" aria-hidden="true">
              <span style={{ width: `${courseworkPercent}%` }} />
            </div>
            <div className="academics-coursework-meta">
              <span>{stats.weeklyCourseworkComplete} done</span>
              <span>{stats.weeklyCourseworkTotal > 0 ? `${stats.weeklyCourseworkTotal} this week` : 'No dated work'}</span>
            </div>
          </div>
        </div>

        <div
          data-testid="class-card-action-slot"
          className={cn(
            'relative mt-auto flex min-h-18 items-center border-t border-border',
            compact && 'md:mt-0 md:min-h-12 md:border-l md:border-t-0 md:pl-4',
          )}
        >
          {stats.nextDeadline ? (
            <Link
              data-testid="class-next-deadline"
              to={`/academics/classes/${row.id}?classTab=assignments&view=agenda&assignment=${encodeURIComponent(stats.nextDeadline.id)}`}
              title={stats.nextDeadline.title}
              aria-label={`Open assignment: ${stats.nextDeadline.title}`}
              className="group/next mx-auto grid min-h-14 w-[90%] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg px-2 py-2 text-left font-bold text-muted-foreground transition-[background-color,color,opacity] duration-150 hover:bg-[color-mix(in_srgb,var(--class-accent)_9%,transparent)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--class-accent)] md:group-focus/class:pointer-events-none md:group-focus/class:opacity-0 md:group-hover/class:pointer-events-none md:group-hover/class:opacity-0 motion-reduce:transition-none"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="min-w-0">
                <span className="line-clamp-2 font-display text-[11.5px] font-extrabold leading-[1.35] text-foreground">{nextTaskSummary}</span>
                {stats.nextDeadline.dueDate && (
                  <span className="mt-1 block text-[10px] leading-tight text-muted-foreground">{assignmentDateLabel(stats.nextDeadline)}</span>
                )}
              </span>
              <ArrowUpRight className="size-4 shrink-0 opacity-55 transition-opacity group-hover/next:opacity-100" aria-hidden="true" />
            </Link>
          ) : (
            <p data-testid="class-next-deadline" className="flex min-h-12 w-full items-center px-2 text-[10.5px] font-bold text-muted-foreground transition-opacity duration-150 md:group-focus/class:opacity-0 md:group-hover/class:opacity-0 motion-reduce:transition-none">
              {nextText}
            </p>
          )}
          <div
            data-testid="class-card-open-actions"
            className="mt-2 flex items-center justify-end gap-2 md:pointer-events-none md:absolute md:inset-x-3 md:top-1/2 md:z-10 md:mt-0 md:grid md:h-14 md:-translate-y-1/2 md:grid-cols-[minmax(0,1fr)_2.75rem] md:items-center md:rounded-xl md:bg-card md:p-1 md:opacity-0 md:shadow-lg md:transition-opacity md:duration-150 md:group-focus/class:pointer-events-auto md:group-focus/class:opacity-100 md:group-hover/class:pointer-events-auto md:group-hover/class:opacity-100 md:focus-within:pointer-events-auto md:focus-within:opacity-100 motion-reduce:transition-none">
            <Button
              size="sm"
              variant="outline"
              className="h-10 flex-1 border-[var(--class-accent-75)] bg-[color-mix(in_srgb,var(--class-accent)_72%,transparent)] font-display font-extrabold text-white shadow-[0_8px_18px_-14px_var(--class-accent-75)] motion-safe:transition-[background-color,transform] hover:bg-[color-mix(in_srgb,var(--class-accent)_82%,transparent)] hover:text-white active:translate-y-px"
              onClick={(event) => { event.stopPropagation(); onOpen() }}
            >
              <ArrowUpRight className="size-4 text-white" /> Open
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label="Class actions"
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{row.courseCode || 'Class'}</DropdownMenuLabel>
                <DropdownMenuItem asChild><Link to={`/academics/classes/${row.id}`}><ArrowUpRight className="size-4" /> Open class hub</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={onImport}><Upload className="size-4" /> Import syllabus</DropdownMenuItem>
                {row.type === 'stem' && <DropdownMenuItem asChild><Link to={`/academics/classes/${row.id}?classTab=overview&captureLecture=1`}><CheckCircle2 className="size-4" /> Add lecture transcript</Link></DropdownMenuItem>}
                <DropdownMenuItem asChild><Link to={`/academics/classes/${row.id}?classTab=materials`}><NotebookText className="size-4" /> Create study resources</Link></DropdownMenuItem>
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
        {row.type === 'stem' && <ContextMenuItem asChild><Link to={`/academics/classes/${row.id}?classTab=overview&captureLecture=1`}><CheckCircle2 className="size-4" /> Add lecture transcript</Link></ContextMenuItem>}
        <ContextMenuItem asChild><Link to={`/academics/classes/${row.id}?classTab=materials`}><NotebookText className="size-4" /> Create study resources</Link></ContextMenuItem>
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
  onOpenAssignment,
  onOpenExamPlan,
}: {
  data: ClassCenterViewData
  classes: ClassWorkspaceView[]
  persons: Person[]
  courses: Course[]
  onOpenClass: (courseId: string) => void
  onOpenAssignment: (courseId: string, assignmentId: string) => void
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
      <UpNextPanel data={data} assignments={pending} now={renderNow} onOpenAssignment={onOpenAssignment} onOpenExamPlan={onOpenExamPlan} />
      <GpaPanel courses={courses} currentTerm={classes[0]?.semester ?? ''} />
      <ContactsPanel data={data} classes={classes} persons={persons} />
      <UpcomingPanel data={data} assignments={pending} />
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
  className,
  children,
}: {
  span: 4 | 5 | 7
  title: string
  icon: LucideIcon
  actions?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  const spanClass = span === 7 ? 'lg:col-span-7' : span === 5 ? 'lg:col-span-5' : 'lg:col-span-4'
  return (
    <Card className={cn(spanClass, 'academics-bento-panel min-w-0', className)}>
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
      {!studyWork.length ? <BentoEmpty>Create a Study Guide, Mastery Map, or Revised Notes from selected class material.</BentoEmpty> : (
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
  onOpenAssignment,
  onOpenExamPlan,
}: {
  data: ClassCenterViewData
  assignments: ClassAssignment[]
  now: number
  onOpenAssignment: (courseId: string, assignmentId: string) => void
  onOpenExamPlan: (courseId: string, assignmentId: string) => void
}) {
  const ranked = rankUpNextAssignments(assignments, now)
  const item = ranked[0]
  if (!item) return (
    <BentoPanel span={7} title="Up next" icon={CalendarClock}>
      <BentoEmpty>No major dated work is pending.</BentoEmpty>
    </BentoPanel>
  )
  const openItem = (assignment: ClassAssignment) => assignment.type === 'exam'
    ? onOpenExamPlan(assignment.courseId, assignment.id)
    : onOpenAssignment(assignment.courseId, assignment.id)
  const displayTitle = classCardTaskSummary(item.title)
  return (
    <BentoPanel
      span={7}
      title="Up next"
      icon={TrendingUp}
      className="self-start"
      actions={(
        <Button size="sm" className="font-display font-extrabold" onClick={() => openItem(item)}>
          {item.type === 'exam' ? 'Build exam plan' : 'Open assignment'} <ArrowUpRight className="size-4" />
        </Button>
      )}
    >
      <button
        type="button"
        onClick={() => openItem(item)}
        className="group/up-next grid w-full gap-4 rounded-xl border border-border bg-muted/55 p-4 text-left transition-colors hover:border-primary/45 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[8.5rem_minmax(0,1fr)]"
        title={item.title}
        aria-label={`Open assignment: ${item.title}`}
      >
        <div className="flex items-center gap-2 sm:block">
          <Badge variant={assignmentDateLabel(item).startsWith('Overdue') ? 'danger' : 'outline'}>{assignmentDateLabel(item)}</Badge>
          <p className="mt-0 text-xs font-extrabold text-muted-foreground sm:mt-2">{classLabel(item.courseId, data)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">{item.type === 'reading' ? 'Reading before class' : item.type}</p>
          <h3 className="mt-1 line-clamp-2 font-display text-2xl font-extrabold leading-tight">{displayTitle}</h3>
          {item.weight != null && <p className="mt-2 text-xs font-bold text-muted-foreground">{item.weight}% of course grade</p>}

        </div>
      </button>
      {!!ranked.slice(1, 4).length && (
        <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
          {ranked.slice(1, 4).map((next) => (
            <button
              key={next.id}
              type="button"
              onClick={() => openItem(next)}
              title={next.title}
              aria-label={`Open assignment: ${next.title}`}
              className="group/queued grid w-full min-w-0 gap-1 bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
            >
              <span className="line-clamp-1 text-sm font-bold">{classCardTaskSummary(next.title, 96)}</span>
              <span className="flex shrink-0 items-center gap-2 text-xs font-extrabold text-muted-foreground">
                {classLabel(next.courseId, data)} · {assignmentDateLabel(next)}
                <ArrowUpRight className="size-3.5 text-primary opacity-55 transition-opacity group-hover/queued:opacity-100" aria-hidden="true" />
              </span>
            </button>
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
  const sourceFieldLabel = (label: string, found: boolean, optional = false, needsReview = false) => syllabusProposal
    ? `${label} · ${optional ? 'optional' : needsReview ? 'needs a look' : found ? 'found' : 'not found'}`
    : label
  const sourceMeetingTime = syllabusProposal?.items.find((item) => item.kind === 'logistics' && item.label === 'Meeting time' && item.confidence === 'low')
  const meetingTimeNeedsReview = Boolean(sourceMeetingTime) || (Boolean(extractedClass?.meetingTime) && !isPlausibleClassMeetingTime(extractedClass?.meetingTime))
  const missingClassFacts = syllabusProposal ? [
    Boolean(extractedClass?.courseCode), Boolean(extractedClass?.courseTitle), termWasFound,
    Boolean(extractedClass?.instructor), Boolean(extractedClass?.meetingDays),
    Boolean(extractedClass?.meetingTime) && !meetingTimeNeedsReview, Boolean(extractedClass?.location),
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
                  {syllabusProposal.sourceName} · {syllabusProposal.items.length} extracted details · {missingClassFacts} class fields need review. Confirm anything ambiguous before continuing.
                </p>
              </div>
            </section>
          )}
          <section className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Basics</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={sourceFieldLabel('Course code', Boolean(extractedClass?.courseCode))}><Input value={form.courseCode} onChange={(e) => onChange({ courseCode: e.target.value })} onBlur={(e) => onChange({ courseCode: normalizeCourseCode(e.target.value) })} placeholder="BIOL 103" /></Field>
              <Field label={sourceFieldLabel('Course title', Boolean(extractedClass?.courseTitle))}><Input value={form.courseTitle} onChange={(e) => onChange({ courseTitle: e.target.value })} onBlur={(e) => onChange({ courseTitle: normalizeCourseTitle(e.target.value, form.courseCode) })} placeholder="How Cells Function" /></Field>
              <Field label={sourceFieldLabel('Semester', termWasFound)}><Input value={form.semester} onChange={(e) => onChange({ semester: e.target.value })} onBlur={(e) => onChange({ semester: normalizeClassTerm(e.target.value) })} placeholder="Fall 2026" /></Field>
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
              <Field label={sourceFieldLabel('Instructor', Boolean(extractedClass?.instructor))}><Input value={form.instructor ?? ''} onChange={(e) => onChange({ instructor: e.target.value })} onBlur={(e) => onChange({ instructor: normalizeInstructorName(e.target.value) })} /></Field>
              <Field label={sourceFieldLabel('Meeting days', Boolean(extractedClass?.meetingDays))}><Input value={form.meetingDays ?? ''} onChange={(e) => onChange({ meetingDays: e.target.value })} onBlur={(e) => onChange({ meetingDays: normalizeMeetingDays(e.target.value) })} placeholder="Tue · Thurs" /></Field>
              <Field label={sourceFieldLabel('Meeting time', Boolean(extractedClass?.meetingTime), false, meetingTimeNeedsReview)}><Input value={form.meetingTime ?? ''} onChange={(e) => onChange({ meetingTime: e.target.value })} onBlur={(e) => onChange({ meetingTime: normalizeClassMeetingTime(e.target.value) })} placeholder="10:10 AM–11:00 AM" /></Field>
              <Field label={sourceFieldLabel('Location', Boolean(extractedClass?.location))}><Input value={form.location ?? ''} onChange={(e) => onChange({ location: e.target.value })} onBlur={(e) => onChange({ location: normalizeClassLocation(e.target.value) })} /></Field>
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
                        'grid size-11 place-items-center rounded-xl border text-muted-foreground transition hover:bg-muted hover:text-foreground',
                        normalizeClassIcon(form.icon) === id ? 'border-primary bg-primary/12 text-primary' : 'border-border bg-card'
                      )}
                    >
                      <Icon className="size-4" />
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Color">
                <div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
                  {COLORS.map((color) => (
                    <button
                      type="button"
                      key={color}
                      aria-pressed={form.color === color}
                      title={`${color[0].toUpperCase()}${color.slice(1)}`}
                      onClick={() => onChange({ color })}
                      className={cn('min-h-11 min-w-0 rounded-full px-1.5 py-1 text-center text-xs font-bold capitalize', PILL_STYLES[color], form.color === color && 'ring-2 ring-primary')}
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

function classStats(courseId: string, data: ClassCenterViewData) {
  const coursework = data.assignments.filter((item) => item.courseId === courseId && item.status !== 'dropped')
  const weeklyCoursework = coursework.filter((item) => isDueThisWeek(item.dueDate))
  const weeklyCourseworkComplete = weeklyCoursework.filter((item) => item.status === 'submitted' || item.status === 'graded').length
  const upcoming = data.assignments
    .filter((item) => item.courseId === courseId && item.status !== 'submitted' && item.status !== 'graded' && item.dueDate)
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
  return {
    weeklyCourseworkTotal: weeklyCoursework.length,
    weeklyCourseworkComplete,
    weeklyCourseworkRemaining: weeklyCoursework.length - weeklyCourseworkComplete,
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

function isDueThisWeek(iso?: string, today = new Date()) {
  if (!iso) return false
  const due = new Date(`${iso.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(due.getTime())) return false
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  start.setDate(start.getDate() - start.getDay())
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return due >= start && due < end
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
  if (stats.materialCount > 0) return { verb: 'Study' }
  return { text: 'Add class materials to get started' }
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

function classLabel(courseId: string, data: ClassCenterViewData) {
  const row = data.classes.find((item) => item.id === courseId)
  return row?.courseCode || row?.courseTitle || 'Class'
}

function compactMeeting(row: ClassWorkspaceView) {
  return [normalizeMeetingDays(row.meetingDays ?? ''), row.meetingTime, row.location].filter(Boolean).join(' · ')
}

function assignmentDateLabel(item: Pick<ClassAssignment, 'dueDate' | 'type'>) {
  return item.type === 'exam' ? fmtEventDate(item.dueDate) : fmtDeadline(item.dueDate)
}

function statusLabel(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  if (['Class type', 'Icon', 'Color'].includes(label)) return <fieldset className="min-w-0 space-y-1.5 text-sm font-bold"><legend>{label}</legend>{children}</fieldset>
  return (
    <label className="space-y-1.5 text-sm font-bold">
      <span>{label}</span>
      {children}
    </label>
  )
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

function TinySelect({ value, options, labels, onChange }: { value: string; options: readonly string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 max-w-full rounded-full text-xs font-bold"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((item) => <SelectItem key={item} value={item}>{labels?.[item] ?? statusLabel(item)}</SelectItem>)}</SelectContent>
    </Select>
  )
}
