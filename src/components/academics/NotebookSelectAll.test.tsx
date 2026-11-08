import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { NotebookPracticeCard } from './NotebookPracticeCard'

let host: HTMLDivElement, root: Root
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host) })
afterEach(async () => { await act(async () => root.unmount()); host.remove() })

const card = (correctIndices: number[]) => <NotebookPracticeCard number={1} origin="" prompt={<p>Which are true? Select all that apply.</p>} stimulus={null} hasStimulus={false}
  answer="First; Third" rationale={<p>Why each statement is true or false.</p>} original="Which are true?" sources={null} missing={[]}
  options={['First', 'Second', 'Third', 'Fourth']} correctIndices={correctIndices} />
const options = () => [...host.querySelectorAll<HTMLButtonElement>('.lf-select-all .wt-opt')]
const check = () => host.querySelector<HTMLButtonElement>('.wt-check-submit')

it('lets the student pick several statements, then grades the exact set', async () => {
  await act(async () => root.render(card([0, 2])))
  expect(check()?.disabled).toBe(true)
  await act(async () => { options()[0].click() }); await act(async () => { options()[2].click() })
  expect(options().map(o => o.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'true', 'false'])
  await act(async () => { options()[2].click() }); await act(async () => { options()[2].click() })
  await act(async () => { check()!.click() })
  expect(host.querySelector('.wt-fb.ok')?.textContent).toContain('Correct.')
  expect(options().every(o => o.disabled)).toBe(true)
  expect(options().map(o => o.className.includes('right'))).toEqual([true, false, true, false])
  expect(check()).toBeNull()
})

it('marks a wrong pick and a missed statement and counts the right calls', async () => {
  await act(async () => root.render(card([0, 2])))
  await act(async () => { options()[0].click() }); await act(async () => { options()[1].click() })
  await act(async () => { check()!.click() })
  const fb = host.querySelector('.wt-fb.no')!
  expect(fb.textContent).toContain('2 of 4 statements called right')
  expect(fb.textContent).toContain('Why each statement')
  expect(options()[1].className).toContain('wrong')
  expect(options()[2].className).toContain('missed')
  expect(options()[2].textContent).toContain('Missed')
})
