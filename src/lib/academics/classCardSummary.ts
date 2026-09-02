const URL_PATTERN = /(?:https?:\/\/|www\.)\S+/gi

function firstQuotedTitle(value: string) {
  const match = value.match(/[“"]([^”"]{4,120})[”"]|[‘']([^’']{4,120})[’']/)
  return (match?.[1] ?? match?.[2])?.trim()
}

function truncateAtWord(value: string, limit: number) {
  if (value.length <= limit) return value
  const candidate = value.slice(0, limit + 1)
  const lastSpace = candidate.lastIndexOf(' ')
  return `${candidate.slice(0, Math.max(lastSpace, Math.floor(limit * 0.72))).replace(/[,:;\s]+$/, '')}…`
}

/**
 * Returns a stable, compact dashboard label without changing the saved task.
 * This stays deterministic so a class card never waits on AI or silently
 * changes an assignment's meaning just to fit the layout.
 */
export function classCardTaskSummary(title: string, limit = 82) {
  const original = title.replace(/\s+/g, ' ').trim()
  const withoutLinks = original
    .replace(URL_PATTERN, '')
    .replace(/\s+before class\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/[·,;:\s]+$/, '')
    .trim()

  const quoted = firstQuotedTitle(withoutLinks)
  if (quoted && /\b(?:listen|podcast|audio)\b/i.test(withoutLinks)) {
    return truncateAtWord(`Listen to “${quoted}”`, limit)
  }
  if (quoted && /^read\b/i.test(withoutLinks)) {
    return truncateAtWord(`Read “${quoted}”`, limit)
  }

  const chapter = withoutLinks.match(/^read\s+(chapter\s+\d+[A-Za-z]?(?:\s*[·:—-]\s*[^,;]+)?)/i)
  if (chapter) return truncateAtWord(`Read ${chapter[1]}`, limit)

  return truncateAtWord(withoutLinks || original, limit)
}
