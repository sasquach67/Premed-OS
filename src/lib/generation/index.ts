export { assembleGenerationRequest, specHashOf } from '@/lib/generation/assemble'
export { GLOBAL_RULES, INVARIANT_RULE_IDS, renderGlobalRules } from '@/lib/generation/layers/global'
export { DEFAULT_CONTROLS, PRESETS, presetSpec } from '@/lib/generation/layers/presets'
export { SOURCE_MODES, sourceModeSpec } from '@/lib/generation/layers/sourceModes'
export { ARTIFACT_REGISTRY, artifactSpec } from '@/lib/generation/artifacts/registry'
export type {
  ArtifactSpec, AssembledRequest, ControlProvenance, ControlSource,
  GenerationControls, LayerRule, PresetSpec, RuleKind, SourceMode,
} from '@/lib/generation/types'
