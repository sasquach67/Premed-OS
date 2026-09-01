# 11 · Unit Mastery Outline — `unit-mastery-outline-v1`

The Unit Mastery Outline is a source-grounded map for one unit. It preserves syllabus learning standards as the stable Topic contract, then gives each standard three useful study lenses: what to understand, what to be able to do, and what to watch for.

**Runtime objective:** Turn the supplied course evidence into a unit mastery map. Preserve stated syllabus standards and organize each one into Understand, Be able to do, and Watch for. This map is the source contract for later study resources, not a transcript summary.

## Rules

| Rule | Meaning | Kind |
| --- | --- | --- |
| `UMO-SOURCE` | Every standard and every bullet must be traceable to at least one supplied source chunk. | invariant |
| `UMO-STANDARDS` | Use syllabus learning standards or explicitly stated objectives as the stable standard identity. Never promote a transcript-derived concept into a Topic. | invariant |
| `UMO-SPLIT` | Separate understanding, observable performance, and likely confusion or watch-for points. Do not repeat one sentence in all three fields. | invariant |
| `UMO-GAPS` | If the source does not support a section, return an empty array and do not invent a learning objective. | invariant |
| `UMO-CONCISE` | Keep each bullet concise enough to scan before studying; preserve the source wording when it carries an official objective. | tunable |

The runtime artifact spec is `src/lib/generation/artifacts/unitMasteryOutline.v1.ts`. Its structured response has `title`, `unit`, and `standards[]`; each standard has `id`, `title`, `understand`, `beAbleToDo`, `watchFor`, and `sourceChunkIds`.

Before persistence, `validateMasteryOutline()` rejects empty sections, duplicate
standard IDs, and citations outside the closed selected-source set. A missing
section stays empty; the generator does not fill it from general knowledge.
