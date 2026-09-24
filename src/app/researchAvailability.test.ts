import { afterEach, expect, it, vi } from 'vitest'
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })
it.each([undefined, 'false', 'true'])('gates Research explicitly with flag %s', async value => {
  vi.stubEnv('VITE_RESEARCH_PREVIEW', value); vi.resetModules()
  const { isRouteAvailable, RESEARCH_PREVIEW_ENABLED } = await import('./availability')
  expect(RESEARCH_PREVIEW_ENABLED).toBe(value === 'true')
  expect(isRouteAvailable('#/research?tab=log')).toBe(value === 'true')
  expect(isRouteAvailable('/clinical')).toBe(false)
})
