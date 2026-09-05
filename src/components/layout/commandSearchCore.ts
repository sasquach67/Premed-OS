export type CommandHitKind = 'action' | 'page' | 'record' | 'file' | 'external'

export interface CommandHit {
  id: string
  label: string
  sub: string
  group: string
  kind: CommandHitKind
  route?: string
  url?: string
  verbs?: string
  action?: () => void
}

const VERBS = /^(add|new|create|log|find|show|toggle|open)\b/i

export function fuzzyCommandScore(needle: string, hay: string): number {
  const n = needle.toLowerCase().trim()
  const h = hay.toLowerCase()
  if (!n) return 0
  if (h.startsWith(n)) return 0
  if (h.includes(n)) return 8 + h.indexOf(n)
  let qi = 0
  for (let i = 0; i < h.length && qi < n.length; i++) if (h[i] === n[qi]) qi++
  return qi === n.length ? 100 + h.length - n.length : -1
}

export function rankCommandHits(index: CommandHit[], query: string, recentIds: string[], limit = 40) {
  const verbQuery = VERBS.test(query.trim())
  return index.map((hit) => {
    const score = Math.min(...[hit.label, hit.sub, hit.group, hit.verbs ?? ''].map((field) => {
      const value = fuzzyCommandScore(query, field)
      return value < 0 ? 9999 : value
    }))
    const actionBoost = verbQuery && hit.kind === 'action' ? -100 : 0
    const recentBoost = recentIds.indexOf(hit.id)
    return { hit, score: score === 9999 ? 9999 : score + actionBoost + (recentBoost >= 0 ? recentBoost - recentIds.length : 0) }
  }).filter((entry) => entry.score < 9999).sort((a, b) => a.score - b.score).map((entry) => entry.hit).slice(0, limit)
}
