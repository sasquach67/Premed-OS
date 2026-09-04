export function lectureDisplayTitle(position: number, title: string, aiTitle?: string) {
  const base = `Lecture ${position}`
  const savedTitle = (aiTitle?.trim() || title.trim())
    .replace(/^(?:lecture\s+#?\d+\s*(?:[·:—–-]\s*)?)+/i, '')
    .trim()
  return savedTitle ? `${base} · ${savedTitle}` : base
}
