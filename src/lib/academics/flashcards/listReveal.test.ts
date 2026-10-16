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
    expect(document.querySelector('button')?.getAttribute('aria-label')).toBe('Reveal next list item')
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

  it('does not activate on non-list cards or older clients without answer data', () => {
    question('recall')
    run()
    expect(document.querySelector('button')).toBeNull()
    question('list', false)
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
