import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
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

  it('keeps cards factual and opens a no-date class through Preview', async () => {
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

    expect(container.textContent).toContain('No dated class item yet')
    expect(container.textContent).toContain('Preview')
    expect(container.textContent).toContain('A-')
    expect(container.textContent).not.toContain('BCPM')
    expect(container.textContent).not.toContain('Review')
    expect(container.querySelector('[role="progressbar"]')).toBeNull()
    expect(container.textContent).not.toMatch(/\d+(?:\.\d+)?%/)

    await act(async () => (Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Preview') as HTMLButtonElement).click())
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('does not present an in-progress marker as a letter standing on a card', async () => {
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

    expect(container.textContent).not.toContain('IP')
  })
})
