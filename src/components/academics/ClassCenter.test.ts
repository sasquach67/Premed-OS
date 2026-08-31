import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClassCard, classCardColor, classFormFromSyllabus, type ClassCenterViewData, type ClassWorkspaceView } from './ClassCenter'
import { classTypeDraftDecision } from '@/lib/academics/classTypeDraftDecision'
import { createSeedData } from '@/data/seed'
import { parseSyllabusText } from '@/lib/academics/syllabusParser'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('Class Center card compatibility', () => {
  it('falls back to the current blue accent for a persisted retired color', () => {
    expect(classCardColor('chartreuse')).toBe('blue')
    expect(classCardColor(undefined)).toBe('blue')
    expect(classCardColor('purple')).toBe('purple')
    expect(classCardColor('teal')).toBe('teal')
    expect(classCardColor('indigo')).toBe('indigo')
    expect(classCardColor('navy')).toBe('navy')
    expect(classCardColor('coral')).toBe('coral')
  })
})

describe('Class Center add-class type selection', () => {
  it('prefills attributable meeting facts from a syllabus proposal', () => {
    const proposal = parseSyllabusText('CHEM 262 — Organic Chemistry II\nInstructor: Dr. Adaeze Elamin\nMWF 10:10 AM-11:00 AM Room Kenan B12\nWeek 1: Aromatic substitution\nMidterm Exam — October 14, 2026')
    expect(classFormFromSyllabus(proposal, 'Fall 2026')).toMatchObject({
      courseCode: 'CHEM 262',
      courseTitle: 'Organic Chemistry II',
      instructor: 'Dr. Adaeze Elamin',
      meetingDays: 'Monday · Wednesday · Friday',
      meetingTime: '10:10 AM–11:00 AM',
      location: 'Kenan B12',
    })
  })

  it('expands registrar day codes into readable meeting days', () => {
    const proposal = parseSyllabusText('PSYC 101 — Introduction to Psychology\nInstructor: Ndidi Adeyanju, PhD\nTR 8:00 AM-9:15 AM Hanes Art Center Room 121')
    expect(classFormFromSyllabus(proposal, 'Fall 2026')).toMatchObject({
      meetingDays: 'Tuesday · Thursday',
      location: 'Hanes Art Center Room 121',
    })
  })

  it('prefills natural full-weekday meeting prose from pasted syllabus text', () => {
    const proposal = parseSyllabusText('PSYC 101 — Introduction to Psychology\nMeets Tuesdays and Thursdays 10:00 AM to 11:15 AM')
    expect(classFormFromSyllabus(proposal, 'Fall 2026')).toMatchObject({
      meetingDays: 'Tuesday · Thursday',
      meetingTime: '10:00 AM–11:15 AM',
    })
  })

  it('keeps term and office-hours text out of reviewed class identity fields', () => {
    const proposal = parseSyllabusText('NEUR 101 — Neurobiology - Fall 2026\nInstructor: Dr. Nadia Elamin Office hours: Monday 1-3 PM\nMWF 10:00 AM-10:50 AM')
    expect(classFormFromSyllabus(proposal, 'Fall 2026')).toMatchObject({
      courseTitle: 'Neurobiology',
      instructor: 'Dr. Nadia Elamin',
      meetingDays: 'Monday · Wednesday · Friday',
      meetingTime: '10:00 AM–10:50 AM',
    })
  })

  it('prefills the semester named by the syllabus instead of the current dashboard term', () => {
    const proposal = parseSyllabusText('ARTH 155 — Art History - Spring 2027\nInstructor: Dr. Rivera\nT/Th 11:00 AM-12:15 PM')
    expect(classFormFromSyllabus(proposal, 'Fall 2026')).toMatchObject({
      courseTitle: 'Art History',
      semester: 'Spring 2027',
    })
  })

  it('does not mistake office hours for the class meeting schedule', () => {
    const proposal = parseSyllabusText('CHEM 262 — Organic Chemistry II\nInstructor: Dr. Adaeze Elamin\nAttendance is required. Office hours Tuesday 2 PM Room 310.')
    expect(classFormFromSyllabus(proposal, 'Fall 2026')).toMatchObject({
      meetingDays: '',
      meetingTime: '',
      location: '',
    })
  })

  it('extracts the ANTH 147 first-page logistics without confusing office hours or office location', () => {
    const proposal = parseSyllabusText(`Anthropology 147 Comparative Healing Systems
FALL 2026
Prof. M. Rivkin-Fish, mrfish@unc.edu T & TH 5:00-6:15 Lectures (+ Recitations)
Office: 305A Alumni Hall and by Zoom 0121 Hanes Art Center
Office Hours: Wed. 2:00-3:30 pm & by appt`)

    expect(classFormFromSyllabus(proposal, 'Fall 2026')).toMatchObject({
      courseCode: 'ANTH 147',
      courseTitle: 'Comparative Healing Systems',
      instructor: 'M. Rivkin-Fish',
      meetingDays: 'Tuesday · Thursday',
      meetingTime: '5:00–6:15',
      location: '0121 Hanes Art Center',
    })
  })

  it('keeps a blank manual class unselected until the student chooses a type', () => {
    expect(classTypeDraftDecision({ isCreate: true, courseCode: '' })).toEqual({ selectionKind: 'needs-choice' })
  })

  it('shows an attributable Writing proposal without persisting it', () => {
    expect(classTypeDraftDecision({ isCreate: true, courseCode: 'ENGL 105' })).toEqual({
      selectedType: 'writing',
      selectionKind: 'suggestion',
      proposal: {
        kind: 'suggestion',
        type: 'writing',
        source: 'course-code',
        reason: 'Suggested Writing — this course code is usually writing-intensive.',
      },
    })
  })

  it('keeps the student choice when they revise the course code', () => {
    expect(classTypeDraftDecision({
      isCreate: true,
      courseCode: 'BIOL 252',
      studentChoice: 'general',
    })).toEqual({ selectedType: 'general', selectionKind: 'student' })
  })

  it('uses the already-saved type for edit flows without proposing another one', () => {
    expect(classTypeDraftDecision({
      isCreate: false,
      courseCode: 'ENGL 105',
      savedType: 'stem',
    })).toEqual({ selectedType: 'stem', selectionKind: 'saved' })
  })
})

describe('Class Center primary card hierarchy', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  it('keeps the full card status ladder and opens a no-date class through Review', async () => {
    const seed = structuredClone(createSeedData())
    const course = seed.courses.find((item) => item.code === 'BIOL 103')!
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.courseId === course.id)!
    const row: ClassWorkspaceView = {
      ...workspace,
      id: course.id,
      workspaceId: workspace.id,
      courseCode: course.code,
      courseTitle: course.title,
      semester: course.term,
      grade: 'A-',
      bcpm: true,
      credits: course.credits,
    }
    const data: ClassCenterViewData = {
      ...seed.academics.classCenter,
      assignments: [],
      classes: [row],
    }
    const onOpen = vi.fn()

    await act(async () => {
      root.render(createElement(ClassCard, {
        row,
        data,
        compact: false,
        dragging: false,
        dragOver: false,
        onPreview: () => {},
        onOpen,
        onDragStart: () => {},
        onDragOver: () => {},
        onDragLeave: () => {},
        onDrop: () => {},
        onDragEnd: () => {},
        onEdit: () => {},
        onImport: () => {},
        onArchive: () => {},
        onDelete: () => {},
      }))
    })

    expect(container.textContent).toContain('No deadline scheduled')
    expect(container.textContent).toContain('Open')
    expect(container.textContent).toContain('A-')
    expect(container.textContent).not.toContain('BCPM')
    expect(container.querySelector('[role="progressbar"]')).toBeTruthy()

    const openButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Open') as HTMLButtonElement
    expect(openButton.className).toContain('md:opacity-0')
    expect(openButton.className).toContain('md:group-hover/class:opacity-100')
    expect(openButton.className).toContain('md:group-focus-within/class:opacity-100')
    const deadline = container.querySelector('[data-testid="class-next-deadline"]') as HTMLElement
    expect(deadline.textContent).toBe('No deadline scheduled')
    expect(deadline.className).not.toContain('group-hover/class:hidden')
    expect(container.textContent).not.toContain('Open class hub →')
    await act(async () => openButton.click())
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('keeps an in-progress marker visible on a full card', async () => {
    const seed = structuredClone(createSeedData())
    const course = seed.courses.find((item) => item.code === 'BIOL 103')!
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.courseId === course.id)!
    const row: ClassWorkspaceView = {
      ...workspace,
      id: course.id,
      workspaceId: workspace.id,
      courseCode: course.code,
      courseTitle: course.title,
      semester: course.term,
      grade: 'IP',
      bcpm: true,
      credits: course.credits,
    }
    const data: ClassCenterViewData = { ...seed.academics.classCenter, assignments: [], classes: [row] }

    await act(async () => {
      root.render(createElement(ClassCard, {
        row, data, compact: false, dragging: false, dragOver: false,
        onPreview: () => {},
        onOpen: () => {}, onDragStart: () => {}, onDragOver: () => {}, onDragLeave: () => {},
        onDrop: () => {}, onDragEnd: () => {}, onEdit: () => {}, onImport: () => {}, onArchive: () => {}, onDelete: () => {},
      }))
    })

    expect(container.textContent).toContain('IP')
  })

  it('keeps every non-link card action attributable to its callback', async () => {
    const seed = structuredClone(createSeedData())
    const course = seed.courses.find((item) => item.code === 'BIOL 103')!
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.courseId === course.id)!
    const row: ClassWorkspaceView = {
      ...workspace,
      id: course.id,
      workspaceId: workspace.id,
      courseCode: course.code,
      courseTitle: course.title,
      semester: course.term,
      grade: 'A-',
      bcpm: true,
      credits: course.credits,
      type: 'stem',
    }
    const data: ClassCenterViewData = { ...seed.academics.classCenter, assignments: [], classes: [row] }
    const actions = {
      onOpen: vi.fn(), onEdit: vi.fn(), onImport: vi.fn(), onArchive: vi.fn(), onDelete: vi.fn(),
    }

    await act(async () => {
      root.render(createElement(MemoryRouter, null, createElement(ClassCard, {
        row, data, compact: false, dragging: false, dragOver: false,
        onPreview: vi.fn(),
        ...actions,
        onDragStart: () => {}, onDragOver: () => {}, onDragLeave: () => {}, onDrop: () => {}, onDragEnd: () => {},
      })))
    })

    const open = [...container.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Open') as HTMLButtonElement
    await act(async () => open.click())
    expect(actions.onOpen).toHaveBeenCalledTimes(1)

    const overflow = container.querySelector('button[aria-label="Class actions"]') as HTMLButtonElement
    const choose = async (label: string) => {
      await act(async () => {
        overflow.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
        overflow.click()
      })
      const item = [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((node) => node.textContent?.trim() === label)
      expect(item).toBeTruthy()
      await act(async () => item!.click())
    }

    await choose('Import syllabus')
    await choose('Class settings')
    await choose('Archive')
    await choose('Delete')

    expect(actions.onImport).toHaveBeenCalledTimes(1)
    expect(actions.onEdit).toHaveBeenCalledTimes(1)
    expect(actions.onArchive).toHaveBeenCalledTimes(1)
    expect(actions.onDelete).toHaveBeenCalledTimes(1)

    expect(document.body.querySelector('a[href="/academics/classes/' + course.id + '"]')).toBeNull()
    await act(async () => {
      overflow.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
      overflow.click()
    })
    const overflowLinks = [...document.body.querySelectorAll<HTMLAnchorElement>('a')].map((link) => link.getAttribute('href'))
    expect(overflowLinks).toContain(`/academics/classes/${course.id}`)
    expect(overflowLinks).toContain(`/academics/classes/${course.id}?classTab=overview&captureLecture=1`)
    expect(overflowLinks).toContain(`/academics/classes/${course.id}?classTab=materials`)

    const card = container.querySelector('[role="button"][aria-label^="Preview"]') as HTMLElement
    await act(async () => card.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 12, clientY: 12 })))
    const contextItems = [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')]
    for (const label of ['Open class hub', 'Import syllabus', 'Add lecture transcript', 'Create study resources', 'Class settings', 'Archive', 'Delete']) {
      expect(contextItems.some((node) => node.textContent?.trim() === label)).toBe(true)
    }
    expect(contextItems.some((node) => /Review|Quiz me/.test(node.textContent?.trim() ?? ''))).toBe(false)
  })
})
