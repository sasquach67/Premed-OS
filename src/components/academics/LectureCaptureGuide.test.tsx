import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LectureCaptureGuide } from './LectureCaptureGuide'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))

describe('LectureCaptureGuide', () => {
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

  it('teaches the complete permission-to-import lecture workflow', async () => {
    await act(async () => root.render(<LectureCaptureGuide open onOpenChange={() => {}} />))

    expect(document.body.textContent).toContain('Premed OS does not listen to or record your class')
    expect(document.body.textContent).toContain('Ask before you record')
    expect(document.body.textContent).toContain('Goodnotes')
    expect(document.body.textContent).toContain('iPhone Voice Memos')
    expect(document.body.textContent).toContain('Universal Clipboard')
    expect(document.body.textContent).toContain('PDF, DOCX, TXT, or Markdown')
    expect(document.body.textContent).toContain('The transcript comes first; everything else is optional')

    const dialog = document.body.querySelector('[role="dialog"]')!
    const details = [...dialog.querySelectorAll<HTMLDetailsElement>('details')]
    expect(details.map(detail => detail.querySelector('summary')?.textContent)).toEqual(['Capture options', 'Recording tips', 'Apple transfer steps', 'File import steps'])
    expect(details.every(detail => !detail.open)).toBe(true)
    const visibleCopy = dialog.cloneNode(true) as HTMLElement
    visibleCopy.querySelectorAll('details').forEach(detail => detail.remove())
    expect(visibleCopy.textContent).toContain('Premed OS does not listen to or record your class')
    expect(visibleCopy.textContent).toContain("Follow your instructor's, school's, and classmates' rules.")
    expect(visibleCopy.textContent).toContain('If recording is not allowed, take notes and add a typed lecture summary instead.')
    expect(visibleCopy.textContent).toContain('The transcript comes first; everything else is optional.')
    const appleSteps = details.find(detail => detail.querySelector('summary')?.textContent === 'Apple transfer steps')!
    expect(appleSteps.textContent).toContain('Both devices must be nearby, signed into the same Apple Account, with Wi-Fi, Bluetooth, and Handoff on.')
    await act(async () => appleSteps.querySelector('summary')!.click())
    expect(appleSteps.open).toBe(true)
    expect(appleSteps.textContent).toContain('Add pasted transcript')

    const links = [...document.body.querySelectorAll<HTMLAnchorElement>('a')]
    expect(links.some((link) => link.href.startsWith('https://support.goodnotes.com/'))).toBe(true)
    expect(links.some((link) => link.href.startsWith('https://support.apple.com/'))).toBe(true)
  })
})
