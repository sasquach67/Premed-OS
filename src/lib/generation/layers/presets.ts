/**
 * L3 — presets (`05` §2), and L4 preference resolution (`05` §3).
 *
 * A preset weights tunables. It cannot reach an invariant: `assemble.ts`
 * rejects that at build time rather than quietly ignoring it, because silently
 * dropping an override is how a preset ends up believed to be doing something
 * it never did.
 */
import type { GenerationControls, PresetSpec } from '@/lib/generation/types'

/** `05` §1 — the defaults every control falls back to. */
export const DEFAULT_CONTROLS: GenerationControls = {
  card_density: 'moderate',
  preferred_card_type: 'mixed',
  explanation_depth: 'moderate',
  source_mode: 'SOURCE_PLUS_CLARIFICATION',
  difficulty: 'standard',
  coverage_depth: 'standard',
  use_analogies: 'sparing',
  use_tables: 'balanced',
  clinical_connections: 'when_supported',
  guide_structure: 'standard',
}

export const PRESETS: Record<string, PresetSpec> = {
  'premedos-default': {
    id: 'premedos-default',
    label: 'premedOS Default',
    controls: {},
  },
  'concise-cloze': {
    id: 'concise-cloze',
    label: 'Concise Cloze',
    controls: { preferred_card_type: 'cloze', card_density: 'dense', explanation_depth: 'minimal' },
  },
  'conceptual-qa': {
    id: 'conceptual-qa',
    label: 'Conceptual Q&A',
    controls: { preferred_card_type: 'conceptual', explanation_depth: 'deep', use_analogies: 'frequent' },
  },
}

export function presetSpec(id: string): PresetSpec {
  const preset = PRESETS[id]
  if (!preset) throw new Error(`No preset registered for "${id}".`)
  return preset
}
