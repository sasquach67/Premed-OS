import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { SelectField } from './select-field'

let root: Root, container: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  HTMLElement.prototype.scrollIntoView = vi.fn()
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals() })

it('retains empty and numeric-string choices and submits the original value', async () => {
  function Field() {
    const [value, setValue] = useState('0')
    return <form><SelectField name="scope" aria-label="Scope" value={value} onValueChange={setValue} options={[{ value: '', label: 'All scopes' }, { value: '0', label: 'First scope' }]} /></form>
  }
  await act(async () => root.render(<Field />))
  const trigger = container.querySelector<HTMLElement>('[role="combobox"]')!
  expect(trigger.textContent).toContain('First scope')
  await act(async () => trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })))
  await act(async () => [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(item => item.textContent === 'All scopes')!.click())
  expect(trigger.textContent).toContain('All scopes')
  expect(new FormData(container.querySelector('form')!).get('scope')).toBe('')
})

it('shows a placeholder when no option is selected and keeps disabled choices unavailable', async () => {
  await act(async () => root.render(<SelectField aria-label="Image" value="" placeholder="Choose image" onValueChange={vi.fn()} options={[{ value: 'image', label: 'Unavailable image', disabled: true }]} />))
  const trigger = container.querySelector<HTMLElement>('[role="combobox"]')!
  expect(trigger.textContent).toContain('Choose image')
  await act(async () => trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })))
  expect(document.querySelector('[role="option"]')?.getAttribute('aria-disabled')).toBe('true')
})
