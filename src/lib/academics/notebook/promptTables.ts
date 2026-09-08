export type NotebookPromptPart = { type: 'text'; text: string } | { type: 'table'; columns: string[]; rows: string[][]; align: ('left' | 'center' | 'right')[] }

/** A deliberately small display-only grammar. Unsupported input stays literal. */
export function notebookPromptParts(value: string): NotebookPromptPart[] {
  const lines = value.split(/\r?\n/), parts: NotebookPromptPart[] = [], text: string[] = []
  let fence: { char: string; length: number } | null = null
  const row = (line: string) => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|') || /\\|`/.test(trimmed)) return null
    return trimmed.slice(1, -1).split('|').map(cell => cell.trim())
  }
  const flush = () => { if (text.length) { parts.push({ type: 'text', text: text.join('\n') }); text.length = 0 } }
  for (let i = 0; i < lines.length;) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(lines[i])
    if (marker) {
      if (!fence) fence = { char: marker[1][0], length: marker[1].length }
      else if (marker[1][0] === fence.char && marker[1].length >= fence.length) fence = null
      text.push(lines[i++]); continue
    }
    const columns = !fence ? row(lines[i]) : null, divider = !fence && i + 1 < lines.length ? row(lines[i + 1]) : null
    if (!columns || columns.length < 2 || !divider || columns.length !== divider.length || !divider.every(cell => /^:?-{3,}:?$/.test(cell))) { text.push(lines[i++]); continue }
    let end = i + 2, valid = true
    const rows: string[][] = []
    while (end < lines.length && lines[end].trim().startsWith('|')) {
      const cells = row(lines[end++])
      if (!cells || cells.length !== columns.length) valid = false
      else rows.push(cells)
    }
    if (!valid || !rows.length) { text.push(...lines.slice(i, end)); i = end; continue }
    flush()
    parts.push({ type: 'table', columns, rows, align: divider.map(cell => cell.startsWith(':') && cell.endsWith(':') ? 'center' : cell.endsWith(':') ? 'right' : 'left') })
    i = end
  }
  flush()
  return parts
}
