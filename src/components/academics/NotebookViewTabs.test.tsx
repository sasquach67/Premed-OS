import { readFileSync } from 'node:fs'
import { URL as NodeURL } from 'node:url'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import type { LectureRecord } from '@/lib/types'
import type { NotebookPackage } from '@/lib/academics/notebook/types'
import fixture from '@/lib/academics/notebook/fixtures/fixture-review.json'
import { ExternalNotebookView } from './ExternalNotebookView'

const css = readFileSync(new NodeURL('./externalNotebook.css', import.meta.url), 'utf8')
let root: Root, container: HTMLDivElement
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove() })

it('preserves the three native view buttons, counts, selected state and saved content', async () => {
  const pkg = structuredClone(fixture) as NotebookPackage, original = JSON.stringify(pkg)
  const lecture = { id: 'view-tabs-demo', courseId: 'view-tabs-course', title: pkg.entries[0].title, importedNotebook: {
    entryId: pkg.entries[0].id, original: structuredClone(pkg), originalRaw: original, current: pkg, notes: '', progress: {}, history: [],
  } } as unknown as LectureRecord
  await act(async () => root.render(<ExternalNotebookView lecture={lecture} courseCode={pkg.course.code} />))
  const nav = container.querySelector<HTMLElement>('nav[aria-label="Notebook reading views"]')!
  const buttons = [...nav.querySelectorAll<HTMLButtonElement>('button')]
  expect(buttons.map(button => button.textContent)).toEqual(['Study guide', 'Practice', 'Sources'])
  expect(buttons.map(button => button.getAttribute('data-count'))).toEqual([null, String(pkg.entries[0].sections.flatMap(section => section.blocks).filter(block => block.type === 'practice').length), String(pkg.sources.length)])
  for (const [index, view] of ['study', 'practice', 'sources', 'study'].entries()) {
    const active = index % 3
    await act(async () => { buttons[active].focus(); buttons[active].click() })
    expect(document.activeElement).toBe(buttons[active])
    expect(buttons.map(button => button.getAttribute('aria-pressed'))).toEqual(buttons.map((_, at) => String(at === active)))
    expect(container.querySelector('.nbr-doc')?.getAttribute('data-reader-mode')).toBe(view)
  }
  expect(JSON.stringify(lecture.importedNotebook!.current)).toBe(original)
  expect(lecture.importedNotebook!.history).toEqual([])
})

it('scopes square, baseline-aligned theme tabs and equal mobile columns to reader navigation', () => {
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  const rule = (selector: string) => rules.find(([, candidate]) => candidate.trim() === selector)![2]
  const buttons = rule('.nbr .nbr-views button')
  expect(buttons).toContain('min-height:52px')
  expect(buttons).toContain('min-width:9.5rem')
  expect(buttons).toContain('border-radius:0')
  expect(buttons).toContain('align-items:baseline')
  expect(buttons).toContain('transform:none')
  // (0,4,1) outranks the global glass hover/press guards (0,4,0).
  expect(rule('.nbr .nbr-views button.interactive-glass:is(:hover,:active)').trim()).toBe('transform:none')
  expect(rule('.nbr-views button[data-count]::after')).toContain('align-self:baseline')
  expect(rule('.nbr .nbr-views button[aria-pressed=true]')).toContain('border-bottom-color:var(--primary)')
  expect(rule('.nbr .nbr-views button[aria-pressed=true]')).toContain('color:color-mix(in srgb,var(--primary) 55%,var(--foreground))')
  expect(rule('.dark .nbr .nbr-views button[aria-pressed=true]').trim()).toBe('color:var(--primary)')
  expect(rule('.nbr .nbr-views button:focus-visible')).toContain('outline:2px solid var(--ring)')
  const mobile = css.slice(css.indexOf('@container(max-width:32rem)'), css.indexOf('.nbr-reference-notes'))
  expect(mobile).toContain('grid-template-columns:repeat(3,minmax(0,1fr))')
  expect(mobile).toContain('min-width:0')
  expect(mobile).toContain('white-space:normal')
})

it('clears 4.5:1 for the reported light active background without changing the dark-theme color', () => {
  const primary = [75, 156, 211], foreground = [58, 53, 48]
  const background = [.950588, .954588, .933216].map(channel => channel * 255)
  const mixed = primary.map((channel, index) => channel * .55 + foreground[index] * .45)
  const luminance = (rgb: number[]) => rgb.map(channel => channel / 255).map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0)
  expect((luminance(background) + .05) / (luminance(mixed) + .05)).toBeGreaterThanOrEqual(4.5)
})
