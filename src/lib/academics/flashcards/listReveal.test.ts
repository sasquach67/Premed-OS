import { afterEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const script = readFileSync(resolve(process.cwd(), 'premed-hq-documentation/flashcards/prompt/list-reveal.js'), 'utf8')
const cleanup = () => (window as unknown as Record<string, (() => void) | undefined>).__premedosListRevealCleanup?.()

function question(label = 'list', data = true) {
  document.body.innerHTML = `<div id="pm-list-question"><span class="verb">${label}</span><div class="question"><span class="cloze" data-ordinal="1" ${data ? 'data-cloze="first"' : ''}>[…]</span>, <span class="cloze" data-ordinal="1" ${data ? 'data-cloze="second"' : ''}>[…]</span>, <span class="cloze" data-ordinal="1" ${data ? 'data-cloze="third"' : ''}>[…]</span></div><a href="#source">Source</a></div>`
  return document.getElementById('pm-list-question')!
}
const answers = () => Array.from(document.querySelectorAll('.cloze')).map(node => node.textContent)
const run = () => window.eval(script)

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
})

describe('portable list reveal question script', () => {
  it('leaves normal all-blanks behavior without scripts and never shows answers on initialization', () => {
    question()
    expect(answers()).toEqual(['[…]', '[…]', '[…]'])
    expect(document.querySelector('button')).toBeNull()
    run()
    expect(answers()).toEqual(['[…]', '[…]', '[…]'])
    expect(document.querySelector('button')?.getAttribute('aria-label')).toBe('Reveal next blank')
  })

  it('reveals items in order on question clicks and the accessible button', () => {
    const root = question()
    run()
    root.click()
    expect(answers()).toEqual(['first', '[…]', '[…]'])
    document.querySelector<HTMLButtonElement>('button')!.click()
    expect(answers()).toEqual(['first', 'second', '[…]'])
    root.click()
    expect(answers()).toEqual(['first', 'second', 'third'])
    expect(document.querySelector<HTMLButtonElement>('button')!.disabled).toBe(true)
    expect(document.querySelector('[role="status"]')?.textContent).toContain('3 of 3 revealed')
  })

  it('uses one synthesized click per mobile tap instead of double advancing on touchend', () => {
    const root = question()
    run()
    root.dispatchEvent(new Event('touchend', { bubbles: true }))
    expect(answers()).toEqual(['[…]', '[…]', '[…]'])
    root.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(answers()).toEqual(['first', '[…]', '[…]'])
  })

  it.each([' ', 'Enter', 'ArrowRight', 'n', 'N'])('supports %j and allows normal keys once finished', key => {
    question()
    run()
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    document.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(answers()).toEqual(['first', '[…]', '[…]'])
    for (let i = 0; i < 2; i++) document.dispatchEvent(new KeyboardEvent('keydown', { key }))
    const completed = new KeyboardEvent('keydown', { key, cancelable: true })
    document.dispatchEvent(completed)
    expect(completed.defaultPrevented).toBe(false)
  })

  it('ignores source links, input controls, modifier keys and repeated keydown', () => {
    const root = question()
    root.insertAdjacentHTML('beforeend', '<input />')
    run()
    document.querySelector<HTMLAnchorElement>('a')!.click()
    document.querySelector('input')!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', repeat: true }))
    expect(answers()).toEqual(['[…]', '[…]', '[…]'])
  })

  it('reveals the two meanings of a compare card one at a time', () => {
    document.body.innerHTML = `<div id="pm-list-question"><span class="verb">compare</span><div class="question">Positive regulators <span class="cloze" data-ordinal="1" data-cloze="promote cell-cycle progression">[…]</span>; negative regulators <span class="cloze" data-ordinal="1" data-cloze="restrain cell-cycle progression">[…]</span>.</div></div>`
    expect(document.querySelector('button')).toBeNull()
    run()
    expect(answers()).toEqual(['[…]', '[…]'])
    document.querySelector<HTMLButtonElement>('button')!.click()
    expect(answers()).toEqual(['promote cell-cycle progression', '[…]'])
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }))
    expect(answers()).toEqual(['promote cell-cycle progression', 'restrain cell-cycle progression'])
    expect(document.querySelector<HTMLButtonElement>('button')!.disabled).toBe(true)
  })

  it('also activates for a grouped recall card without a list label', () => {
    question('recall')
    run()
    document.querySelector<HTMLButtonElement>('button')!.click()
    expect(answers()).toEqual(['first', '[…]', '[…]'])
  })

  it.each([
    ['compare', ['activation', 'persistence', 'intensity']],
    ['recall', ['first meaning', 'second meaning', 'third meaning', 'fourth meaning']],
    ['application', ['receptor activates', 'relay activates', 'response begins']],
    ['why', ['stage one', 'stage two', 'stage three']],
  ])('reveals every active grouped blank for %s without a list-type gate', (label, meanings) => {
    document.body.innerHTML = `<div id="pm-list-question"><span class="verb">${label}</span>${meanings.map((meaning, index) => `Term ${index + 1} <span class="cloze" data-ordinal="2" data-cloze="${meaning}">[…]</span>`).join('; ')}</div>`
    run()
    expect(answers()).toEqual(meanings.map(() => '[…]'))
    meanings.forEach((_, index) => {
      document.querySelector<HTMLButtonElement>('button')!.click()
      expect(answers()).toEqual(meanings.map((meaning, position) => position <= index ? meaning : '[…]'))
    })
    expect(document.querySelector<HTMLButtonElement>('button')!.disabled).toBe(true)
  })

  it('leaves a single active blank untouched even when other indices are visible', () => {
    question('compare')
    document.querySelectorAll('.cloze').forEach((node, index) => {
      if (index > 0) node.className = 'cloze-inactive'
    })
    run()
    expect(document.querySelector('button')).toBeNull()
    expect(answers()).toEqual(['[…]'])
    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true })
    document.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('leaves mixed indices and incomplete answer/index data untouched', () => {
    question('compare')
    document.querySelectorAll('.cloze')[1].setAttribute('data-ordinal', '2')
    run()
    expect(document.querySelector('button')).toBeNull()
    question('list', false)
    run()
    expect(document.querySelector('button')).toBeNull()
    question('compare')
    document.querySelectorAll('.cloze')[1].removeAttribute('data-cloze')
    run()
    expect(document.querySelector('button')).toBeNull()
    question('recall')
    document.querySelectorAll('.cloze')[0].removeAttribute('data-ordinal')
    run()
    expect(document.querySelector('button')).toBeNull()
    expect(answers()).toEqual(['[…]', '[…]', '[…]'])
  })

  it('cleans up on answer flip and does not keep a global key handler', async () => {
    question()
    run()
    document.body.innerHTML = '<div id="answer"><span class="cloze">first, second, third</span></div>'
    await Promise.resolve()
    expect((window as unknown as Record<string, unknown>).__premedosListRevealCleanup).toBeUndefined()
    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true })
    document.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    expect(document.getElementById('answer')?.textContent).toBe('first, second, third')
  })

  it('replaces old handlers on reviewer transitions and repeated script evaluation', () => {
    question()
    run()
    run()
    expect(document.querySelectorAll('button')).toHaveLength(1)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }))
    expect(answers()).toEqual(['first', '[…]', '[…]'])
    question()
    run()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }))
    expect(answers()).toEqual(['first', '[…]', '[…]'])
  })
})
