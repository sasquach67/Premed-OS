# Reader and prompt schema contracts

The October 17 study-guide redesign intentionally advances authoring to
`notebook-instructions-beta-29`. Its pinned v4 authoring schema and installed
v4 reader schema have identical bytes. The additive fields are optional:
block `definedTerms` and `stressed`, bullets `nestedItems`, section
`learningObjectiveIds`, diagram-node `tone` and `targetBlockId`, plus the new
`callout` variant. Existing reading-detail `more` fields remain supported.
Notebooks without these additions retain their existing representation.

The transport remains version 4 / `notebook-workflows-draft-4`. The legacy v2
(`notebook-package.schema.json`) and v3 schemas are frozen and still accepted;
this change does not rewrite them or introduce a storage/cloud schema migration.
The prompt pin remains an explicit reviewed authoring boundary: regenerating a
prompt must not silently adopt a future reader change.

`build_prompts.py` defaults to the committed
`premed-hq-documentation/specifications/generation/portable-notebooks/notebook-prompt-v4.schema.json`.
`--prompt-schema PATH` selects an explicit input for tooling review. Sync still
requires that input's bytes to match the committed pin.

Current SHA256 receipts:

- Raw v4 prompt pin and reader: `dc8e10c2cd73626f3049da70cf6239e8de414497116f9eed9c01aae2c1d5f32c`.
- Compact embedded v4 schema: `e55e48b05806d460cfe3e76dd017a1c9609781dab5b223b47ebfbef13b89a678`.
- Frozen v2 reader: `41d6f3e5adaebb55ee80cb567354fb7698e252dafca1c0009ea15f81910c7b43`.
- Frozen v3 reader: `20e46dd155928f0c004c5515d8d80980849303a14a2194d7ce45e194b1ad7233`.

Raw hashes cover file bytes, including formatting and the trailing newline.
The embedded hash covers UTF-8 JSON using Python `ensure_ascii=False` and
`separators=(',', ':')`, with no trailing newline. Sync independently serializes
the pin with `JSON.stringify` and requires identical embedded bytes.

The manifest's `schema` records the current v4 reader receipt. `readerSchemas`
records all three reader files. `promptSchema` records the selected prompt
input, emitted pin file, raw/embedded hashes, serialization and its relationship
to the reader. An explicit differing override remains unapproved for asset sync.

`sync-assets.mjs` verifies each emitted reader file against both its installed
and canonical reader copies, and each embedded prompt schema against the pin.
Output hashes, supporting-data, composition and schema receipt checks all finish
before any destination writes.

Run `python3 scripts/notebook/test_prompt_schema.py` for nine temporary-directory
tests covering generation, exact pin/reader agreement, successful sync, complete
beta29 template hashes, and rejection of prose/schema/receipt tampering. The
frozen full-template hashes record this intentionally expanded beta29 scope;
they replace the earlier beta25/beta27 normalization guard. The same suite runs
through `promptSchemaTooling.test.ts` in `npm test`. It does not run a model.

For final parity, build into a fresh output directory with `build_prompts.py
--canonical-root . --output <temporary-directory>`, then compare each generated
`copy-prompt-{review,assessment,assignment}.md` byte for byte with its installed
copy in `src/lib/academics/notebook/prompts/`. The
`prompt_methodology_errors` guard in `portable-notebooks/check_package.py`
separately checks that each template retains its applicable canonical rules.
Structural and byte checks do not establish provider execution, learning quality,
app import/save, or observed reader behavior.
