import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClassFolderGuide } from './ClassFolderGuide'
import { ToastProvider } from '@/components/common/ToastProvider'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createRoot(container) })
afterEach(() => { act(() => root.unmount()); container.remove() })

function render() {
  const props = { onFinish: vi.fn(), onSkip: vi.fn(), onBack: vi.fn() }
  act(() => root.render(<ToastProvider><ClassFolderGuide courseCode="PSYC 101" {...props} /></ToastProvider>))
  return props
}
const press = (label: string) => act(() => ([...container.querySelectorAll('button')].find((b) => b.textContent?.includes(label))!).click())

describe('ClassFolderGuide', () => {
  it('asks three questions, then walks four steps and saves the answers', () => {
    const p = render()
    expect(container.textContent).toContain('Where does your class post files?')
    press('Canvas'); press('A cloud drive'); press('Me')
    expect(container.textContent).toContain('Step 1 of 4')
    expect(container.querySelector('img')?.getAttribute('src')).toContain('folder-guide/canvas-files-start.png')
    press('Next step'); press('Next step'); press('Next step')
    expect(container.textContent).toContain('Your AI saves into premedOS')
    press('Done')
    expect(p.onFinish).toHaveBeenCalledWith({ site: 'canvas', place: 'cloud', mover: 'me', name: 'PSYC 101 Lecture Material' })
  })

  it('draws the real layout where the screenshots are out of date', () => {
    render()
    press('Skip the questions')
    press('2 · Make folders')
    act(() => (container.querySelector('[aria-label="Picture 4"]') as HTMLButtonElement).click())
    expect(container.querySelector('.class-folder-finder')?.getAttribute('aria-label')).toBe('Documents › PSYC 101 Lecture Material: Lesson 1, Lesson 2, Exam 1, premedOS')
  })

  it('gives an AI app the filing prompt', () => {
    render()
    press('Canvas'); press('Documents'); press('My AI app')
    expect(container.textContent).toContain('Your AI app files things for you')
    expect(container.querySelector('.class-folder-prompt')?.textContent).toContain('Then stop. Make nothing and copy nothing until I say yes.')
    press('Do it myself instead')
    expect(container.textContent).toContain('Step 1 of 4')
  })

  it('skips to Downloads', () => {
    const p = render()
    press('Skip the questions'); press('Skip for now')
    expect(p.onSkip).toHaveBeenCalled()
  })
})
