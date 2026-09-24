export const RESEARCH_PREVIEW_ENABLED = import.meta.env.VITE_RESEARCH_PREVIEW === 'true'
/** Beta availability shared by navigation, creation, and actionable feeds. */
export const RESERVED_ROUTES = new Set(['mcat', 'clinical', 'volunteering', 'shadowing', ...(!RESEARCH_PREVIEW_ENABLED ? ['research'] : []), 'ecs', 'schools', 'essays', 'letters', 'timeline'])
export function isRouteAvailable(route: string): boolean {
  const path = route.replace(/^#/, '').split(/[?#]/)[0]
  return !RESERVED_ROUTES.has(path.split('/').filter(Boolean)[0] ?? '')
}
export function isQuickAddAvailable(kind: string): boolean {
  return ['task', 'course', 'assignment'].includes(kind)
}
