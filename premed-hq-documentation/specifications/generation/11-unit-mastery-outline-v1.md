# 11 · Unit Mastery Outline — `unit-mastery-outline-v1`

The Unit Mastery Outline is a source-grounded map for one unit. It preserves syllabus learning standards as the stable Topic contract, then gives each standard three useful study lenses: what to understand, what to be able to do, and what to watch for.

**Runtime objective:** Turn the supplied course evidence into a detailed mastery map. Preserve every explicit objective relevant to the requested scope and organize its distinct source-supported subpoints into Understand, Be able to do, and Watch for. This map is the source contract for later study resources, not a transcript summary.

## Rules

| Rule | Meaning | Kind |
| --- | --- | --- |
| `UMO-SOURCE` | Every standard and every bullet must be traceable to at least one supplied source chunk. | invariant |
| `UMO-STANDARDS` | Use syllabus learning standards or explicitly stated objectives as the stable standard identity. Never promote a transcript-derived concept into a Topic. | invariant |
| `UMO-COVERAGE` | Preserve every explicit objective relevant to the requested lecture, unit, or exam scope and every distinct supported subpoint. Do not merge separate objectives or compress a detailed source outline into a summary. | invariant |
| `UMO-SPLIT` | Separate understanding, observable performance, and likely confusion or watch-for points. Do not repeat one sentence in all three fields. | invariant |
| `UMO-DEPTH` | Every saved objective must contain at least five distinct Understand bullets, two objective-specific Be able to do bullets, and one concrete Watch for bullet. If selected sources cannot support that depth, fail instead of padding or inventing. | invariant |
| `UMO-GAPS` | If the source does not support the required sections or depth, do not invent content and do not save a partial objective. | invariant |
| `UMO-CONCISE` | Keep each bullet concise enough to scan before studying; preserve source wording when it carries an official objective, and never reuse a generic application sentence across objectives. | tunable |
| `UMO-PRACTICE-EVIDENCE` | Use supplied questions as evidence of observable tasks, representations, distinctions, and likely traps. Translate those patterns into concrete Be able to do and Watch for bullets without copying stems or treating distractors as facts. | invariant |

The runtime artifact spec is `src/lib/generation/artifacts/unitMasteryOutline.v1.ts`. Its structured response has `title`, `unit`, and `standards[]`; each standard has `id`, `title`, `understand`, `beAbleToDo`, `watchFor`, and `sourceChunkIds`.

Before persistence, `validateMasteryOutline()` rejects shallow or duplicate
sections, duplicate standard IDs, repeated generic application bullets, and
citations outside the closed selected-source set. A source set that cannot
support the detail floor produces no saved outline rather than a padded one.
