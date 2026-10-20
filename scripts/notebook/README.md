# Reader and prompt schema contracts

The October 20 format and explanations brief advances authoring to
`notebook-instructions-beta-32`. Its pinned v4 authoring schema and installed
v4 reader schema have identical bytes. The additive fields are optional:
block `definedTerms` and `stressed`, bullets `nestedItems`, section
`learningObjectiveIds`, diagram-node `tone` and `targetBlockId`, plus the new
`callout` variant. The mastery addendum adds objective `howTested` and
`applicationSkills`: actual quoted course questions, skills referencing their
IDs, and factual `understand` answers. New authoring leaves legacy recall and
caution arrays empty while stored data remains intact. Existing reading-detail `more` fields remain supported.
Notebooks without these additions retain their existing representation.

All three notebook prompts save to the actual class folder, falling back to
Downloads only when that folder cannot be reached and reporting the location.
The flashcard prompt has exactly this one save-location instruction added; its
builder and other wording remain unchanged.

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

- Raw v4 prompt pin and reader: `f056d5fc78de15146e7913f9881f3efe28d205f210058eb47b9d6fce957c4c9d`.
- Compact embedded v4 schema: `61a44308d541c39948680c7e7082dc59d06ad5b4aff758c4d32b9a32859544ce`.
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
beta32 template hashes, and rejection of prose/schema/receipt tampering. The
frozen full-template hashes record this approved beta32 language and v4 empty-array scope;
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

Beta31 permits empty legacy `freeRecallCues` and `watchFor` arrays in v4 objectives. Stored non-empty arrays remain valid. Canonical authoring now uses direct claims, evidenced mix-up callouts, one idea per sentence, a short entry summary, ordinary figure-purpose sentences and argument-led Review sections. The flashcard prompt/builder and reader UI are unchanged. Fresh provider runs remain a separate check.


Beta32 adds optional `detail` on every block (`core` when absent), paragraph
`role`, step `{text, reason?}` items alongside legacy strings, figure `lookFor`,
entry `argumentChain`, `claim` blocks, and paired multiple-choice practice
`options`/`correctIndex`. Lines show the facts; short required core/extra
explanations show why they connect. Stored `more` and retired mastery data stay
intact. Create and update use the same class-folder `premedOS/Lesson N - Title`
path, with Downloads only when inaccessible and web-chat ZIP delivery permitted.
Student prompt openings omit draft/transport narration; JSON metadata retains
its existing format and instructions versions.
