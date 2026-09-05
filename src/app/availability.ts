/** Beta availability shared by navigation, creation, and actionable feeds. */
export const RESERVED_ROUTES = new Set(['mcat', 'clinical', 'volunteering', 'shadowing', 'research', 'ecs', 'schools', 'essays', 'letters', 'timeline'])
export function isRouteAvailable(route: string): boolean {
  const path = route.replace(/^#/, '').split(/[?#]/)[0]
  return !RESERVED_ROUTES.has(path.split('/').filter(Boolean)[0] ?? '')
}
export function isQuickAddAvailable(kind: string): boolean {
  return ['task', 'course', 'assignment'].includes(kind)
}
