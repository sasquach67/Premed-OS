# Flashcards v1

Premed OS supplies a complete copyable prompt for a completed lecture Class Journal. The external AI uses that Journal and the same original materials to create a finished `.apkg`; the student imports it into Anki. There is no flashcard API generation, return import, or deck build inside Premed OS.

Maintained instructions, schema, styling, packaging code, and temporary Anki verification code live in `prompt/`. Run `python3 premed-hq-documentation/flashcards/prompt/assemble_prompt.py` from the repository root after editing them. This generates `src/lib/academics/flashcards/instructions.md`, the only complete prompt artifact, and a hash manifest. Do not edit the generated prompt directly.

`src/lib/academics/flashcards/prompt.ts` checks the prerequisite and adds only the selected current Journal entry and its relevant evidence. Personal notes, practice responses, history, workspace content, and other entries are excluded. Oversized context is explicitly omitted and requires attaching the complete Journal. Source excerpts and metadata do not replace the originals or attach source figures.

The teaching contract preserves plain language, short complete required answers, explanatory Extra with concrete examples, both source-example directions, and useful blurt reinforcement. Unnecessary repetition is reduced without fixed card quotas or removing core targets. The established serif main text and smaller sans-serif Extra remain.

V1 supports new decks, cloze cards, and local PNG/JPEG figures. Native image occlusion and safe updates to existing Anki decks are outside this version. Numerical warnings are advisory workload checks. The deliverable is an `.apkg` with counts, coverage limitations, and verification summary; detailed ledgers stay internal.

The frozen audit/reference archive remains in the original Premed OS review workspace; it is not duplicated into this implementation checkout. The approved contract is carried forward in `prompt/authoring.md` with its exact supporting files.

## Verification

- `npx vitest run src/lib/academics/flashcards/prompt.test.ts` checks prerequisite handling, selected-entry isolation, complete embedded files, and bounded context.
- Install `prompt/requirements.txt` in an isolated Python environment, then run `python premed-hq-documentation/flashcards/prompt/checks/test_prompt.py` to exercise all supported types and rejection cases, extract the exact prompt to a fresh directory, and import a synthetic 12-note/14-card package with the real Anki engine.
- These checks establish structure and package behavior. They do not establish pedagogical truth, validate a real lecture deck, or verify every Anki client.

The portable package uses [genanki's maintained API](https://github.com/kerrickstaley/genanki) and follows Anki's [packaged-deck workflow](https://docs.ankiweb.net/importing/packaged-decks.html).
