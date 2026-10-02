# Reader and prompt schema contracts

The reader accepts optional `more` fields introduced by R1. Notebook prompts
intentionally retain the beta25 authoring schema until a separately reviewed R2
change. These are separate contracts; regenerating a prompt must not silently
introduce reader features into authoring instructions.

`build_prompts.py` defaults to the committed
`premed-hq-documentation/specifications/generation/portable-notebooks/notebook-prompt-v4.schema.json`.
`--prompt-schema PATH` selects an explicit input for tooling review. Sync still
requires that input's bytes to match the committed pin. The raw pin was recovered
from commit `26dfc90e6a23832aaca1def3b16dee46c1f4cfda` and its compact serialization
matches the schema embedded in all three beta25 prompts at `f2d3660`.

- Raw pin SHA256: `d571a6e58a2953cc1e939e7236a98925bc582cb7b77418e4604b48ee1bc30097`.
- Compact embedded SHA256: `974c5ca556f28f9862df02aeca3becdd3fc92de17b2a788ea137c3c23ed1642b`.
- Unchanged v4 reader SHA256: `aae31d034e109e8ac4d64cbe2fba0bdb41068b76b5f5c2ddbeb9a4595095ca35`.

Raw hashes cover file bytes, including formatting and the trailing newline.
The embedded hash covers UTF-8 JSON using Python `ensure_ascii=False` and
`separators=(',', ':')`, with no trailing newline. Sync independently serializes
the pin with `JSON.stringify` and requires identical embedded bytes.

The manifest's `schema` remains the current v4 reader receipt for compatibility.
`readerSchemas` records all three reader files. `promptSchema` records the
selected prompt input, emitted pin file, raw/embedded hashes, serialization and
intentional divergence (or an explicitly unapproved override).

`sync-assets.mjs` verifies each emitted reader file against both its installed
and canonical reader copies, and each embedded prompt schema against the pin.
Existing output, supporting-data, composition and schema receipt checks remain.
All checks finish before any destination writes.

Run `python3 scripts/notebook/test_prompt_schema.py` for temporary-directory
generation, successful sync, tamper rejection and exact beta25 scope checks.
The same suite runs through `promptSchemaTooling.test.ts` in `npm test`.
The heading-only scope test normalizes exactly the approved additions/build label
and compares complete template hashes, including embedded schemas, with beta25.
Those frozen hashes also work in shallow CI checkouts. Tests do not run a model.
