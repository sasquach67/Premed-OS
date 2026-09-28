/** JSON equality that ignores object key order and nothing else.
 *
 * Saved copies are not byte-stable: PostgreSQL JSONB reorders object keys, and
 * store hydration rebuilds nested objects in seed order. Comparing two copies of
 * the same workspace with `JSON.stringify` then reports a difference where there
 * is none. This keeps array order, every value and JSON's own rules (properties
 * whose value is `undefined` are omitted), so any real edit still differs. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) => item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item).sort().map(key => [key, (item as Record<string, unknown>)[key]]))
    : item)
}
export const sameJson = (a: unknown, b: unknown) => canonicalJson(a) === canonicalJson(b)
