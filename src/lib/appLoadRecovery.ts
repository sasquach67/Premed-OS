export function isAppLoadError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const { name, message } = error as { name?: unknown; message?: unknown }
  return name === 'ChunkLoadError' || (typeof message === 'string' && /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS for|Loading (?:CSS )?chunk .+ failed/i.test(message))
}

/** Preserve the route and query while requesting a fresh HTML cache key. */
export function appRecoveryUrl(href: string, now = Date.now()): string {
  const url = new URL(href)
  url.searchParams.set('app-recovery', String(now))
  return url.href
}
