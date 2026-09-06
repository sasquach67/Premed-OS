export type StudyTextPart = { type: 'text'; content: string } | { type: 'table'; headers: string[]; rows: string[][] }

function cells(line: string): string[] | undefined {
  const trimmed = line.trim()
  if (!trimmed.includes('|')) return undefined
  const result: string[] = []
  let cell = ''
  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] === '\\' && trimmed[i + 1] === '|') { cell += '|'; i++; continue }
    if (trimmed[i] === '|') { result.push(cell.trim()); cell = '' } else cell += trimmed[i]
  }
  result.push(cell.trim())
  if (trimmed.startsWith('|')) result.shift()
  if (trimmed.endsWith('|') && !trimmed.endsWith('\\|')) result.pop()
  return result
}

/** Recognize complete pipe tables; preserve ambiguous or malformed input as text. */
export function splitStudyTables(content: string): StudyTextPart[] {
  const lines = content.split('\n')
  const parts: StudyTextPart[] = []
  let start = 0
  for (let i = 0; i < lines.length - 1; i++) {
    const headers = cells(lines[i])
    const separator = cells(lines[i + 1])
    if (!headers?.length || !separator || separator.length !== headers.length || !separator.every(cell => /^:?-{3,}:?$/.test(cell))) continue
    let end = i + 2
    const rows: string[][] = []
    let valid = true
    while (end < lines.length && lines[end].trim() && lines[end].includes('|')) {
      const row = cells(lines[end])!
      if (row.length !== headers.length) valid = false
      rows.push(row)
      end++
    }
    if (!valid) { i = end - 1; continue }
    if (i > start) parts.push({ type: 'text', content: lines.slice(start, i).join('\n') })
    parts.push({ type: 'table', headers, rows })
    start = end
    i = end - 1
  }
  if (start < lines.length) parts.push({ type: 'text', content: lines.slice(start).join('\n') })
  return parts
}
