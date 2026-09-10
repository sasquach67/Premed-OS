export type TableHeadingAdjustment = { path: string; original: string; replacement: string }

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** Only visit declared table blocks at supported package paths. Strict validation follows. */
export function normalizeNotebookTableHeadings(value: unknown): TableHeadingAdjustment[] {
  const changes: TableHeadingAdjustment[] = []
  if (!record(value) || value.format !== 'premed-os-notebook-package' || ![2, 3, 4].includes(value.version as number) || !Array.isArray(value.entries)) return changes
  value.entries.forEach((entry, ei) => {
    if (!record(entry) || !Array.isArray(entry.sections)) return
    entry.sections.forEach((section, si) => {
      if (!record(section) || !Array.isArray(section.blocks)) return
      section.blocks.forEach((block, bi) => {
        if (!record(block) || block.type !== 'table' || !Array.isArray(block.columns)) return
        block.columns = block.columns.map((heading, ci) => {
          if (typeof heading !== 'string' || heading.trim() !== '') return heading
          const replacement = `Column ${ci + 1}`
          changes.push({ path: `$.entries[${ei}].sections[${si}].blocks[${bi}].columns[${ci}]`, original: heading, replacement })
          return replacement
        })
      })
    })
  })
  return changes
}
