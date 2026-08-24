import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClassCard, classCardColor, type ClassCenterViewData, type ClassWorkspaceView } from './ClassCenter'
import { classTypeDraftDecision } from '@/lib/academics/classTypeDraftDecision'
import { createSeedData } from '@/data/seed'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('Class Center card compatibility', () => {
  it('falls back to the current blue accent for a persisted retired color', () => {
    expect(classCardColor('teal')).toBe('blue')
    expect(classCardColor(undefined)).toBe('blue')
    expect(classCardColor('purple')).toBe('purple')
  })
})

describe('Class Center add-class type selection', () => {
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
        onOpen,
        onReview: vi.fn(),
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
    expect(container.textContent).toContain('Review')
    expect(container.textContent).toContain('A-')
    expect(container.textContent).not.toContain('BCPM')
    expect(container.querySelector('[role="progressbar"]')).toBeTruthy()

    await act(async () => (Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Review')) as HTMLButtonElement).click())
    expect(onOpen).not.toHaveBeenCalled()
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
        onOpen: () => {}, onReview: () => {}, onDragStart: () => {}, onDragOver: () => {}, onDragLeave: () => {},
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
      onOpen: vi.fn(), onReview: vi.fn(), onEdit: vi.fn(), onImport: vi.fn(), onArchive: vi.fn(), onDelete: vi.fn(),
    }

    await act(async () => {
      root.render(createElement(MemoryRouter, null, createElement(ClassCard, {
        row, data, compact: false, dragging: false, dragOver: false,
        ...actions,
        onDragStart: () => {}, onDragOver: () => {}, onDragLeave: () => {}, onDrop: () => {}, onDragEnd: () => {},
      })))
    })

    const review = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Review')) as HTMLButtonElement
    await act(async () => review.click())
    expect(actions.onReview).toHaveBeenCalledTimes(1)

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
    await choose('Review')
    await choose('Class settings')
    await choose('Archive')
    await choose('Delete')

    expect(actions.onImport).toHaveBeenCalledTimes(1)
    expect(actions.onReview).toHaveBeenCalledTimes(2)
    expect(actions.onEdit).toHaveBeenCalledTimes(1)
    expect(actions.onArchive).toHaveBeenCalledTimes(1)
    expect(actions.onDelete).toHaveBeenCalledTimes(1)

    expect(document.body.querySelector('a[href="/academics/classes/' + course.id + '"]')).toBeNull()
    await act(async () => {
      overflow.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
      overflow.click()
    })
    expect(document.body.querySelector('a[href="/academics/classes/' + course.id + '"]')).toBeTruthy()

    const card = container.querySelector('[role="button"][aria-label^="Preview"]') as HTMLElement
    await act(async () => card.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 12, clientY: 12 })))
    const contextReview = [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((node) => node.textContent?.trim() === 'Review')
    expect(contextReview).toBeTruthy()
    await act(async () => contextReview!.click())
    expect(actions.onReview).toHaveBeenCalledTimes(3)
  })
})
