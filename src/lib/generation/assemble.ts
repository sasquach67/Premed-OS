/**
 * The assembler (`01` §2) — **the only place layers combine.**
 *
 * One function. Deterministic, pure, and unit-testable without a model.
 *
 * ⚠️ Purity is not tidiness here, it is the feature. Same inputs → same
 * `systemPrompt` and same `specHash`, which is what makes A/B testing and
 * rollback real rather than nominal, and what makes "did this change because I
 * changed the prompt, or because the model moved" an answerable question. The
 * audit found it unanswerable today.
 *
 * ⚠️ **A layer targeting an invariant throws.** `01` §1.1 calls this "a unit
 * test, not a code review". Ignoring such an override would be worse than
 * failing: the preset would be believed to be doing something it never did.
 */
import { GLOBAL_RULES, INVARIANT_RULE_IDS, renderGlobalRules } from '@/lib/generation/layers/global'
import { DEFAULT_CONTROLS, presetSpec } from '@/lib/generation/layers/presets'
import { sourceModeSpec } from '@/lib/generation/layers/sourceModes'
import { artifactSpec } from '@/lib/generation/artifacts/registry'
import type {
  AssembledRequest, ControlProvenance, ControlSource, GenerationControls,
} from '@/lib/generation/types'

export interface AssembleInput {
  specId: string
  preset?: string
  preferences?: Partial<GenerationControls>
  /** Request-level overrides — L6, and still tunables only. */
  controls?: Partial<GenerationControls>
  /** Rule ids a preference explicitly tries to weight. Invariants are refused. */
  targets?: string[]
  chunkIds: string[]
  /** The immediate request: topic, scope, action. Rendered last. */
  request?: string
}

const CONTROL_KEYS = Object.keys(DEFAULT_CONTROLS) as (keyof GenerationControls)[]

/**
 * FNV-1a over the resolved layers. Not cryptographic — it identifies a
 * configuration, and it must be stable across runs and machines, which rules
 * out anything involving object key order or a random seed.
 */
export function specHashOf(parts: string[]): string {
  let hash = 0x811c9dc5
  for (const character of parts.join(' ')) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function assertNoInvariantTarget(ids: string[] | undefined, layer: string) {
  for (const id of ids ?? []) {
    if (INVARIANT_RULE_IDS.has(id)) {
      throw new Error(
        `${layer} targets ${id}, which is invariant. `
        + 'A later layer may narrow, weight, or elaborate an earlier one — never contradict it.',
      )
    }
  }
}

export function assembleGenerationRequest(input: AssembleInput): AssembledRequest {
  const artifact = artifactSpec(input.specId)
  const preset = presetSpec(input.preset ?? 'premedos-default')

  assertNoInvariantTarget(preset.targets, `Preset "${preset.id}"`)
  assertNoInvariantTarget(input.targets, 'A user preference')

  // L1 > L2 > L3 > L4, resolved in that order so a later layer only ever
  // overwrites a value an earlier one was willing to expose as tunable.
  const resolvedControls: GenerationControls = { ...DEFAULT_CONTROLS }
  const controlProvenance = Object.fromEntries(
    CONTROL_KEYS.map((key) => [key, 'default' as ControlSource]),
  ) as ControlProvenance

  const apply = (patch: Partial<GenerationControls> | undefined, source: ControlSource) => {
    for (const key of CONTROL_KEYS) {
      const value = patch?.[key]
      if (value == null) continue
      Object.assign(resolvedControls, { [key]: value })
      controlProvenance[key] = source
    }
  }
  apply(preset.controls, 'preset')
  apply(input.preferences, 'preference')
  apply(input.controls, 'request')

  const mode = sourceModeSpec(resolvedControls.source_mode)
  const artifactRules = artifact.rules.map((rule) => `${rule.id}: ${rule.text}`).join('\n')
  const controlLines = CONTROL_KEYS.map((key) => `${key}: ${resolvedControls[key]}`).join('\n')

  const layers = [
    '# Global learning rules',
    renderGlobalRules(GLOBAL_RULES),
    '',
    `# Artifact: ${artifact.specId}`,
    artifact.objective,
    artifactRules,
    '',
    '# Source mode',
    mode.instruction,
    '',
    '# Resolved controls',
    controlLines,
  ]
  if (input.request) layers.push('', '# This request', input.request)

  return {
    specId: artifact.specId,
    // The request text is deliberately excluded: the hash identifies the
    // CONFIGURATION, so two runs of the same spec over different topics share
    // a hash and stay comparable.
    specHash: specHashOf([
      renderGlobalRules(GLOBAL_RULES),
      artifact.specId,
      artifact.objective,
      artifact.rules.map((rule) => `${rule.id}=${rule.text}`).join('|'),
      preset.id,
      mode.instruction,
      CONTROL_KEYS.map((key) => `${key}=${resolvedControls[key]}`).join('|'),
    ]),
    systemPrompt: layers.join('\n'),
    outputSchema: artifact.outputSchema,
    resolvedControls,
    controlProvenance,
    sourceMode: resolvedControls.source_mode,
    chunkIds: input.chunkIds,
  }
}
