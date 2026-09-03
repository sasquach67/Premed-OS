/**
 * Shared types for the generation layer stack (`01` §1).
 *
 * Six inputs assemble into every request:
 *   L1 global learning rules · L2 artifact rules · L3 preset · L4 preferences
 *   ── then L5 source material and L6 the immediate request.
 *
 * **Precedence: L1 > L2 > L3 > L4.** A later layer may narrow, weight, or
 * elaborate an earlier one. It may never contradict one.
 */

/** `01` §1.1 — the distinction the whole stack is built to enforce. */
export type RuleKind = 'invariant' | 'tunable'

export interface LayerRule {
  id: string
  kind: RuleKind
  text: string
}

/** `02` §2 — what each mode admits beyond the supplied sources. */
export type SourceMode = 'SOURCE_ONLY' | 'SOURCE_PLUS_CLARIFICATION' | 'SOURCE_PLUS_BACKGROUND'

/** `05` §1 — the independent controls. Every one is tunable by definition. */
export interface GenerationControls {
  card_density: 'sparse' | 'moderate' | 'dense'
  preferred_card_type: 'mixed' | 'basic' | 'cloze' | 'conceptual'
  explanation_depth: 'minimal' | 'moderate' | 'deep'
  source_mode: SourceMode
  difficulty: 'foundational' | 'standard' | 'challenging'
  coverage_depth: 'essential' | 'standard' | 'thorough'
  use_analogies: 'none' | 'sparing' | 'frequent'
  use_tables: 'minimal' | 'balanced' | 'favor'
  clinical_connections: 'off' | 'when_supported' | 'encouraged'
  guide_structure: 'standard' | 'concept_first' | 'mechanism_first' | 'exam_focused'
}

/** Which layer set a control's final value — `01` §2: "layer resolution is
 *  inspectable. Build this early; you will need it the first time a preset
 *  misbehaves." */
export type ControlSource = 'default' | 'preset' | 'preference' | 'request'

export type ControlProvenance = Record<keyof GenerationControls, ControlSource>

/** L2 — one artifact generator's contribution. */
export interface ArtifactSpec {
  specId: string
  /** Reviewable Markdown authority mirrored by this runtime instruction set. */
  authorityDocument: string
  /** The artifact's objective, stated as the generator's own instruction. */
  objective: string
  rules: LayerRule[]
  /** Structured-output schema, when the artifact has one. */
  outputSchema?: unknown
}

export interface PresetSpec {
  id: string
  label: string
  /** Tunable overrides only. Targeting an invariant is rejected at assemble time. */
  controls: Partial<GenerationControls>
  /** Rule ids this preset weights. Any invariant id here is a build error. */
  targets?: string[]
}

export interface AssembledRequest {
  specId: string
  /** Content hash of L1+L2+L3+L4 as resolved. Stamped on every stored artifact
   *  so "did this change because the prompt changed, or because the model
   *  moved" is answerable. */
  specHash: string
  systemPrompt: string
  outputSchema?: unknown
  resolvedControls: GenerationControls
  controlProvenance: ControlProvenance
  sourceMode: SourceMode
  chunkIds: string[]
}
