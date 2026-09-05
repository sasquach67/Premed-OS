import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DateField } from './DateField'
import { ToastProvider } from './ToastProvider'
import { useToast } from './useToast'
import { CommandDialog, CommandInput, CommandList, CommandItem } from '@/components/ui/command'
import { CollectionState } from './CollectionState'
import { Search } from 'lucide-react'
import { isTypingTarget } from '@/lib/keyboard'
import { CenterPeek } from './CenterPeek'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container)
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener() {}, removeEventListener() {} })
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.unstubAllGlobals() })
async function render(node: ReactNode) { await act(async () => { root.render(node) }) }

describe('beta shared interaction contracts', () => {
  it('renders externally ranked search results by label even when the value is an opaque id', async () => {
    await render(<CommandDialog open shouldFilter={false}><CommandInput value="Biology" /><CommandList><CommandItem value="class-39e68f37">Biology 103</CommandItem></CommandList></CommandDialog>)
    expect(document.querySelector('[cmdk-item]')?.textContent).toBe('Biology 103')
    expect(document.querySelector('[cmdk-item]')?.hasAttribute('hidden')).toBe(false)
  })
  it('moves across months by keyboard, keeps one date tab stop, and selects the focused date', async () => {
    const change = vi.fn()
    await render(<DateField value="2026-01-31" onChange={change} ariaLabel="Due date" />)
    await act(async () => container.querySelector<HTMLButtonElement>('button')!.click())
    const date = document.querySelector<HTMLButtonElement>('[data-date="2026-01-31"]')!
    expect(document.activeElement).toBe(date)
    expect(date.parentElement?.getAttribute('aria-selected')).toBe('true')
    await act(async () => date.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    const next = document.querySelector<HTMLButtonElement>('[data-date="2026-02-01"]')!
    expect(document.activeElement).toBe(next)
    expect(document.querySelectorAll('[role="grid"] button[tabindex="0"]')).toHaveLength(1)
    await act(async () => next.click())
    expect(change).toHaveBeenCalledWith('2026-02-01')
    expect(document.querySelector('[role="grid"]')).toBeNull()
  })
  it('keeps Undo available beyond the old five-second timeout', async () => {
    vi.useFakeTimers()
    const undo = vi.fn()
    function Harness() { const toast = useToast(); return <button onClick={() => toast({ title: 'Saved record', onUndo: undo })}>Save</button> }
    await render(<ToastProvider><Harness /></ToastProvider>)
    await act(async () => container.querySelector<HTMLButtonElement>('button')!.click())
    await act(async () => vi.advanceTimersByTime(60_000))
    const button = [...container.querySelectorAll<HTMLButtonElement>('button')].find(el => el.textContent === 'Undo')!
    expect(button).toBeTruthy()
    await act(async () => button.click())
    expect(undo).toHaveBeenCalledOnce()
    expect(container.textContent).not.toContain('Saved record')
  })
  it('distinguishes filtered-empty from a genuinely empty collection', async () => {
    const clear = vi.fn()
    await render(<CollectionState state="ready" empty={{ icon: Search, title: 'No records yet', hint: 'Add a record' }} filtered={{active:true,onClear:clear}} />)
    expect(container.textContent).toContain('No matching records')
    expect(container.textContent).not.toContain('No records yet')
    await act(async () => container.querySelector<HTMLButtonElement>('button')!.click())
    expect(clear).toHaveBeenCalledOnce()
  })
  it('keeps expanded peeks modal and ignores Escape handled by a nested discard dialog', async () => {
    const mode = vi.fn()
    await render(<CenterPeek open mode="expanded" label="Record" hasUnsavedChanges onOpenChange={vi.fn()} onModeChange={mode}><input aria-label="Record name" /></CenterPeek>)
    expect(document.querySelector('[role="dialog"][aria-label="Record"]')).toBeTruthy()
    await act(async () => document.querySelector<HTMLButtonElement>('button[aria-label="Close record"]')!.click())
    const dialogs = [...document.querySelectorAll('[role="dialog"]')]
    expect(dialogs).toHaveLength(2)
    await act(async () => dialogs.at(-1)!.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape',bubbles:true})))
    expect(mode).not.toHaveBeenCalled()
  })
  it('uses the shared editing guard for rich-text descendants and comboboxes', () => {
    const editor=document.createElement('div');editor.setAttribute('contenteditable','plaintext-only');const child=document.createElement('span');editor.appendChild(child)
    expect(isTypingTarget(child)).toBe(true)
    editor.setAttribute('contenteditable','false');expect(isTypingTarget(child)).toBe(false)
    editor.setAttribute('role','combobox');expect(isTypingTarget(child)).toBe(true)
  })
})
