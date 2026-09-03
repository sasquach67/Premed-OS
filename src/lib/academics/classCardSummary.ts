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

function sentenceCaseTopic(value: string) {
  return value
    .replace(/\band\b/gi, '&')
    .split(/\s+/)
    .map((word, index) => {
      if (index === 0 || /^[A-Z0-9&/-]{2,}$/.test(word)) return word
      return /^[A-Z][a-z]+[.,!?)]?$/.test(word)
        ? `${word.charAt(0).toLowerCase()}${word.slice(1)}`
        : word
    })
    .join(' ')
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

  const chapter = withoutLinks.match(/^read\s+chapter\s+(\d+[A-Za-z]?)(?:\s*[·:—-]\s*([^,;]+))?/i)
  if (chapter) {
    const topic = chapter[2]?.trim()
    return truncateAtWord(`Read Ch. ${chapter[1]}${topic ? `: ${sentenceCaseTopic(topic)}` : ''}`, limit)
  }

  return truncateAtWord(withoutLinks || original, limit)
}
