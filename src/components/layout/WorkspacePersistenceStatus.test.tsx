import { act, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { PersistenceStatus } from '@/store/workspacePersistence'
import { WorkspacePersistenceStatus } from './WorkspacePersistenceStatus'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const fixture = vi.hoisted(() => ({
  key: 'hq:app-data:account:synthetic-a',
  state: { phase: 'ready', pending: 0, error: '' } as PersistenceStatus,
  listeners: new Set<() => void>(),
}))
vi.mock('@/lib/demoMode', () => ({ activeStorageKey: () => fixture.key }))
vi.mock('@/store/store', () => ({ useStore: () => undefined, snapshotData: () => ({}) }))
vi.mock('@/store/workspaceRecoveryExport', () => ({ downloadWorkspaceRecovery: vi.fn() }))
vi.mock('@/store/workspacePersistence', () => ({ workspacePersistence: () => ({
  status: () => fixture.state,
  subscribe: (listener: () => void) => {
    fixture.listeners.add(listener)
    return () => { fixture.listeners.delete(listener) }
  },
}) }))

let root: Root, container: HTMLDivElement
const savingText = 'Saving your changes… Keep this tab open until saving finishes.'
const render = () => act(() => root.render(<StrictMode><WorkspacePersistenceStatus><button>Edit workspace</button></WorkspacePersistenceStatus></StrictMode>))
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))
function publish(phase: PersistenceStatus['phase'], pending = phase === 'saving' ? 1 : 0) {
  act(() => {
    fixture.state = { phase, pending, error: phase === 'error' ? 'Synthetic save failure' : '' }
    fixture.listeners.forEach(listener => listener())
  })
}
function closeIsProtected() {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return event.defaultPrevented
}

beforeEach(() => {
  vi.useFakeTimers()
  fixture.key = 'hq:app-data:account:synthetic-a'
  fixture.state = { phase: 'ready', pending: 0, error: '' }
  fixture.listeners.clear()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

it('keeps brief startup saves quiet while protecting pending work from closing', () => {
  fixture.state = { phase: 'saving', pending: 1, error: '' }
  render()
  expect(closeIsProtected()).toBe(true)
  expect(container.textContent).not.toContain(savingText)
  advance(300)
  publish('ready')
  advance(2_000)
  expect(container.querySelector('aside')).toBeNull()
  expect(closeIsProtected()).toBe(false)
})

it('shows sustained saves after one second without restarting for queued writes or renders', () => {
  render()
  publish('saving')
  advance(600)
  publish('saving', 2)
  render()
  advance(399)
  expect(container.querySelector('aside')).toBeNull()
  advance(1)
  expect(container.querySelector('[role="status"]')?.textContent).toBe(savingText)
  expect(closeIsProtected()).toBe(true)
  publish('ready')
  expect(container.querySelector('aside')).toBeNull()
  expect(closeIsProtected()).toBe(false)
})

it('shows save failures and recovery actions immediately during the grace period', () => {
  render()
  publish('saving')
  advance(100)
  publish('error')
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Synthetic save failure')
  expect(container.textContent).toContain('Download open workspace')
  expect(container.textContent).toContain('Download saved recovery copies')
  expect(container.querySelector('div[inert]')).not.toBeNull()
  expect(closeIsProtected()).toBe(true)
  advance(2_000)
  expect(container.textContent).not.toContain(savingText)
})

it('shows loading immediately and cancels the saving timer', () => {
  render()
  publish('saving')
  advance(100)
  publish('loading')
  expect(container.querySelector('[role="status"]')?.textContent).toBe('Loading your saved workspace…')
  expect(container.querySelector('div[inert]')).not.toBeNull()
  expect(closeIsProtected()).toBe(true)
  advance(2_000)
  expect(container.textContent).not.toContain(savingText)
})

it('starts a fresh grace period for each saving episode', () => {
  render()
  publish('saving')
  advance(900)
  publish('ready')
  publish('saving')
  advance(999)
  expect(container.querySelector('aside')).toBeNull()
  advance(1)
  expect(container.textContent).toContain(savingText)
  publish('ready')
  publish('saving')
  expect(container.querySelector('aside')).toBeNull()
})

it.each([900, 1_000])('does not carry another workspace’s saving notice across an owner switch at %ims', (elapsed) => {
  render()
  publish('saving')
  advance(elapsed)
  fixture.key = 'hq:app-data:account:synthetic-b'
  render()
  expect(container.querySelector('aside')).toBeNull()
  advance(999)
  expect(container.querySelector('aside')).toBeNull()
  advance(1)
  expect(container.textContent).toContain(savingText)
})

it('cleans up the timer and close-tab protection on unmount', () => {
  render()
  publish('saving')
  expect(vi.getTimerCount()).toBe(1)
  act(() => root.unmount())
  expect(vi.getTimerCount()).toBe(0)
  expect(closeIsProtected()).toBe(false)
  root = createRoot(container)
})
