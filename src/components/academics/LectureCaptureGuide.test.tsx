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

    const links = [...document.body.querySelectorAll<HTMLAnchorElement>('a')]
    expect(links.some((link) => link.href.startsWith('https://support.goodnotes.com/'))).toBe(true)
    expect(links.some((link) => link.href.startsWith('https://support.apple.com/'))).toBe(true)
  })
})
