# 07 · Structured output schemas

**Deliverable 7.** The model controls semantic content; the frontend controls presentation.

Schemas are the contract between those two. Types shown as TypeScript; each ships with a
hand-written JSON Schema constant beside it (the pattern the edge function already uses) plus a
drift test asserting they agree.

---

## 1. Shared primitives

```ts
type Provenance = 'source' | 'clarification' | 'background'

interface SourceRef {
  chunkId: string
  fileId: string
  start: number            // absolute char offset within the chunk
  end: number
  // NOT model-authored — resolved client-side from SourceChunk.sourcePosition
  display?: { fileTitle: string; lectureNumber?: number; slideLabel?: string }
}

type HighYieldBasis =
  | 'instructor-emphasis' | 'stated-objective' | 'cross-source-repetition'
  | 'structural-load'     | 'assessment-form'

interface EmphasisSpan {
  text: string
  emphasis: 'key_term' | 'molecule' | 'structure' | 'pathway'
          | 'formula'  | 'value'    | 'distinction' | 'instructor_emphasis'
}

interface RichText {
  content: string
  emphasis?: EmphasisSpan[]      // spans within content; never styling
}
```

**`SourceRef.display` is optional on the wire and always absent from model output.** The model emits
`chunkId` + offsets; the client resolves the human label. This is what makes "See Lecture 6, Slide 14"
unfabricatable (`01` §4.1).

---

## 2. Study guide

```ts
interface StudyGuide {
  specId: 'study-guide-v1'
  specHash: string
  title: string
  sourceMode: SourceMode
  sections: Section[]
  sourceReferences: SourceRef[]        // deduped union of every ref used
  generatedAt: number
}

interface Section {
  id: string                            // stable — see §5
  kind: SectionKind
  title: string
  blocks: ContentBlock[]
}

type SectionKind =
  | 'big_picture' | 'learning_objectives' | 'core_concepts' | 'mechanisms'
  | 'relationships' | 'high_yield' | 'comparisons' | 'common_confusions'
  | 'clinical' | 'must_understand' | 'must_memorize' | 'active_recall'
  | 'final_synthesis'
```

### 2.1 Content blocks

**Every block carries `id`, `provenance`, and — where required by `01` §4.2 — `sourceRef`.**

```ts
type ContentBlock =
  | OverviewBlock | ConceptBlock  | ProseBlock    | BulletsBlock
  | StepsBlock    | CalloutBlock  | ComparisonTableBlock
  | FlowDiagramBlock | CycleDiagramBlock | HierarchyBlock
  | LabeledDiagramBlock | CauseEffectBlock | TimelineBlock
  | ConceptMapBlock  | FormulaBlock  | RecallBlock
  | GapBlock      | ContradictionBlock

interface BlockBase {
  id: string
  provenance: Provenance
  sourceRef?: SourceRef
  edited?: boolean          // set by the client, never the model — see 08 §1
}

interface ConceptBlock extends BlockBase {
  type: 'concept'
  conceptId: string                 // stable — see §5
  title: string
  body: RichText
  keyTerms?: string[]
  highYield?: { basis: HighYieldBasis }     // absent = not high-yield
  understandingKind?: 'conceptual' | 'memorization' | 'both'
}

interface CalloutBlock extends BlockBase {
  type: 'callout'
  calloutType:
    | 'key_idea' | 'must_know' | 'common_confusion' | 'mechanism'
    | 'clinical_connection' | 'exam_emphasis' | 'memorization'
    | 'conceptual_understanding' | 'warning_exception' | 'memory_tip'
  body: RichText
}

interface RecallBlock extends BlockBase {
  type: 'recall'
  question: string
  answer: string                    // must be derivable from this guide
  conceptId: string
}

interface GapBlock extends BlockBase {
  type: 'gap'
  scope: 'concept' | 'section'
  missing: string
  suggestion?: string
}

interface ContradictionBlock extends BlockBase {
  type: 'contradiction'
  claims: Array<{ text: string; sourceRef: SourceRef }>
  note: string
}
```

`GapBlock` and `ContradictionBlock` have `provenance: 'source'` — they are statements *about* the
source, and both are required by `G-FID-4` / `G-FID-6`.

---

## 3. Visual primitive schemas

```ts
interface ComparisonTableBlock extends BlockBase {
  type: 'comparison_table'
  title: string
  columns: string[]                       // ≥ 2
  rows: Array<{ cells: RichText[] }>      // ≥ 2, length === columns.length
}

// ── the shared graph shape behind primitives 2, 4, 6, 8 ──
type EdgeRelation =
  | 'leads_to' | 'converts_to' | 'activates' | 'inhibits' | 'requires'
  | 'produces' | 'feeds_back'  | 'part_of'   | 'regulates'

interface DiagramNode { id: string; label: string; note?: string }
interface DiagramEdge {
  from: string; to: string
  relation: EdgeRelation
  label?: string
  branch?: boolean
}

interface FlowDiagramBlock extends BlockBase {
  type: 'flow_diagram'
  title: string
  nodes: DiagramNode[]
  connections: DiagramEdge[]
}

interface CycleDiagramBlock extends BlockBase {
  type: 'cycle_diagram'
  title: string
  nodes: DiagramNode[]        // order defines the loop
  connections: DiagramEdge[]  // must close: last → first
}

interface HierarchyBlock extends BlockBase {
  type: 'hierarchy_tree'
  title: string
  root: { id: string; label: string; children: HierarchyNode[] }
}

interface CauseEffectBlock extends BlockBase {
  type: 'cause_effect_chain'
  title: string
  links: Array<{ id: string; label: string; because?: string }>   // ordered
}

interface TimelineBlock extends BlockBase {
  type: 'timeline'
  title: string
  phases: Array<{ id: string; label: string; detail?: string; duration?: string }>
}

interface ConceptMapBlock extends BlockBase {
  type: 'concept_map'
  title: string
  nodes: DiagramNode[]
  connections: DiagramEdge[]      // label required — the relationship IS the content
}

interface LabeledDiagramBlock extends BlockBase {
  type: 'labeled_diagram'
  title: string
  subject: string                                  // "nephron", "neuron"
  regions: Array<{ id: string; label: string; description?: string
                   relativeTo?: { id: string; position: RelativePosition } }>
}

type RelativePosition =
  | 'inside' | 'surrounds' | 'above' | 'below' | 'left_of' | 'right_of'
  | 'adjacent_to' | 'connects_to'
```

**`labeled_diagram` uses relative topology, not coordinates.** The model does not know how premedOS
lays out a diagram and must not pretend to — it states that the nucleolus is *inside* the nucleus,
and the renderer decides where that lands.

### 3.1 Structural validation (deterministic)

| Check | Rule |
|---|---|
| Edge endpoints | Every `from`/`to` resolves to a declared node id |
| Orphan nodes | No node without at least one edge (except single-node diagrams, which are invalid) |
| Cycle closure | `cycle_diagram` edges form exactly one closed loop |
| Table rectangularity | Every row's cell count === `columns.length` |
| Table minimum | ≥ 2 columns and ≥ 2 rows, or it is not a comparison |
| Tree acyclicity | `hierarchy_tree` has no repeated node id on any path |
| Concept map labels | Every `concept_map` edge has a `label` |

These run in code before persistence. A malformed diagram is rejected, never rendered.

---

## 4. Flashcards

```ts
interface FlashcardDeck {
  specId: 'flashcards-v1'
  specHash: string
  deckTitle: string
  sourceMode: SourceMode
  cards: Flashcard[]
  generatedAt: number
}

interface Flashcard {
  id: string
  conceptId: string

  // the retrieval OBJECTIVE — not the mechanism (04 §4.5)
  cardType: 'BASIC_QA' | 'CLOZE' | 'CONCEPTUAL' | 'PROCESS' | 'COMPARISON' | 'APPLICATION'

  front: string            // '' when clozePattern is set
  back: string             // '' when clozePattern is set
  clozeText?: string       // {{c1::…}}

  // the cloze MECHANISM, when one is used. Any cardType may use one.
  clozePattern?: 'single' | 'independent' | 'enumerated-list'
  listOrdered?: boolean    // enumerated-list only — 04 §FC-L3/L4

  extra?: string           // never tested
  tags: string[]
  sourceReference: SourceRef      // required
  difficultyEstimate: 1 | 2 | 3 | 4 | 5
  provenance: Provenance

  owner: 'generated' | 'user'     // manual cards are exempt from generator checks
  edited?: boolean
}
```

### 4.1 `clozePattern` — what each value means

| Value | Shape | Rules |
|---|---|---|
| `single` | One deletion | The default cloze |
| `independent` | 2+ deletions on **related** targets meant to be retrieved separately | `04` §2.4 |
| `enumerated-list` | Sequential deletions over peer items in one list | `04` §4.2b, `FC-L1`–`L7` |

**`clozePattern` is orthogonal to `cardType`.** A discrimination card (`COMPARISON`) may be realised
as `independent` cloze; a process card may be realised as `enumerated-list`. Objective and mechanism
are separate axes, and conflating them was the modelling error the first draft made.

**Invariants enforced in code, not prompt:**

- `clozePattern` set → `clozeText` present, `front`/`back` empty
- `clozePattern` absent → `front` and `back` both non-empty, `clozeText` absent
- `single` → exactly one distinct cloze index
- `independent` → 2+ indices, and the model must have declared the relationship
- `enumerated-list` → 2–6 indices (`FC-L1`), `listOrdered` present, indices contiguous from `c1`
- `sourceReference` present and in the verified citation set
- `provenance: 'background'` forbidden under `SOURCE_ONLY` / `SOURCE_PLUS_CLARIFICATION`
- **`owner: 'user'` → every generator check above is skipped** (`04` §10.1, `FC-IO-5`)

---

## 5. Stable identity — *added; §9 and §11 of your brief both depend on it*

Section-level regeneration, card-level regeneration, edit protection, duplicate detection, and
version comparison all require ids that survive across generations. **Model-generated ids do not.**

| Id | Generated by | Stability guarantee |
|---|---|---|
| `Section.id` | **Client**, from `sectionKind` | Stable across every regeneration |
| `ContentBlock.id` | **Client**, `uid()` at persist | Stable for the artifact's life |
| `Flashcard.id` | **Client**, `uid()` at persist | Stable for the card's life |
| `conceptId` | **Client**, from a normalized concept label | Stable across regenerations *of the same concept* |

### 5.1 `conceptId` derivation

The model emits a `conceptLabel` (natural language, e.g. `"phosphofructokinase-1 regulation"`). The
client derives:

```
conceptId = `${courseId}:${topicId}:${slug(normalizeEntityName(conceptLabel))}`
```

reusing `normalizeEntityName` from `lib/entityMatching.ts` — the same normalizer that already backs
dedup. **Consequences this buys:**

- Regenerating a guide maps new concepts onto old ones by `conceptId`, so edited blocks can be
  preserved rather than orphaned (`08` §1).
- Cards and guide concepts join on `conceptId`, so "make flashcards from this section" is a lookup.
- Duplicate cards are detectable deterministically: same `conceptId` + same tested target.
- Concept drift across spec versions is measurable — the `v1` vs `v2` comparison is a set diff.

**The model never invents an id.** It supplies a label; identity is the client's job. That is the
same principle as `SourceRef.display`: anything that must be stable or verifiable is derived, not
generated.

---

## 6. Schema versioning

- A schema is **pinned to a spec version**. `study-guide-v2` may change block shapes freely.
- **Shipped schemas are never deleted.** Renderers dispatch on `specId`, so old artifacts keep
  rendering after a new version lands.
- The JSON Schema constant and the TS type live in the same file, and a test asserts a valid sample
  satisfies both — the drift the edge function's hand-written schemas are currently exposed to.
- Block types are **additive within a major version**. A renderer meeting an unknown block type
  renders a labelled fallback rather than dropping content silently.
