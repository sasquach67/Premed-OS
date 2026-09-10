import { act, lazy, Suspense } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AppErrorBoundary } from './AppErrorBoundary'
import { appRecoveryUrl, isAppLoadError } from '@/lib/appLoadRecovery'

let root: Root, container: HTMLDivElement
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks() })

it.each(['Failed to fetch dynamically imported module: https://premedos.app/assets/Academics-old.js', 'Importing a module script failed.', 'error loading dynamically imported module', 'Unable to preload CSS for /assets/old.css', 'Loading chunk 12 failed.'])('offers safe recovery for a rejected lazy module: %s', async message => {
  localStorage.setItem('saved-notebook-proof', 'unchanged'); sessionStorage.setItem('unfinished-draft-proof', 'keep this draft')
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  const BrokenPage = lazy(() => Promise.reject(new TypeError(message)))
  await act(async () => root.render(<AppErrorBoundary><Suspense fallback="Loading"><BrokenPage /></Suspense></AppErrorBoundary>))
  expect(container.textContent).toContain('Part of Premed OS couldn’t load')
  expect(container.textContent).not.toContain('Reset to defaults')
  const link = container.querySelector('a')!
  expect(link.target).toBe('_blank'); expect(link.rel).toBe('noopener')
  const before = window.location.href
  expect(new URL(link.href).searchParams.has('app-recovery')).toBe(true)
  expect(confirm).not.toHaveBeenCalled()
  const button = [...container.querySelectorAll('button')].find(b => b.textContent === 'Reload this tab…')!
  await act(async () => button.click())
  expect(confirm).toHaveBeenCalledOnce()
  expect(window.location.href).toBe(before)
  expect(localStorage.getItem('saved-notebook-proof')).toBe('unchanged')
  expect(sessionStorage.getItem('unfinished-draft-proof')).toBe('keep this draft')
})

it('keeps an existing form mounted on repeated preload events and never suppresses caller errors', async () => {
  await act(async () => root.render(<AppErrorBoundary><textarea defaultValue="Unsaved work" /></AppErrorBoundary>))
  const field = container.querySelector('textarea')!
  field.value = 'More unsaved work'
  for (let i = 0; i < 3; i++) {
    const event = Object.assign(new Event('vite:preloadError', { cancelable: true }), { payload: new Error('Unable to preload CSS for /assets/old.css') })
    await act(async () => { window.dispatchEvent(event) })
    expect(event.defaultPrevented).toBe(false)
  }
  expect(container.querySelectorAll('[role="alert"]')).toHaveLength(1)
  expect(container.querySelector('textarea')).toBe(field)
  expect(field.value).toBe('More unsaved work')
  await act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === 'Keep working here')!.click())
  expect(container.querySelector('[role="alert"]')).toBeNull()
  expect(field.value).toBe('More unsaved work')
})

it('does not misclassify ordinary fetch or application errors and preserves route/query on recovery', () => {
  expect(isAppLoadError(new TypeError('Failed to fetch'))).toBe(false)
  expect(isAppLoadError(new Error('Invalid saved record'))).toBe(false)
  const href = 'https://premedos.app/?classTab=overview&app-recovery=old#/academics/classes/c/journal/n'
  const next = new URL(appRecoveryUrl(href, 123))
  expect(next.hash).toBe('#/academics/classes/c/journal/n')
  expect(next.searchParams.get('classTab')).toBe('overview')
  expect(next.searchParams.getAll('app-recovery')).toEqual(['123'])
})
