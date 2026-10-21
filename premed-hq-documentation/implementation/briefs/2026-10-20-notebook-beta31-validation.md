# Beta-31 notebook language and v4 compatibility

Implemented from Andy's October 19 notebook-language brief on `codex/study-guide-redesign`, for PR #41. Merge and deployment remain on hold. This commit is limited to prompts, the v4 schema and their tests/tooling.

## Canonical file changes

- **20-external-notebook-workflow.md:** EC-LEARNING-LANGUAGE now requires direct claims, evidenced mix-up callouts, one idea per sentence (about 25 words), a one-sentence entry summary, and the approved before/after pair. EC-PERTINENT-ONLY excludes reader instructions and course meta; EC-STUDENT-WORK states the correct fact once. EC-MASTERY-REVIEW and EC-GROUPED-GUIDE make the governing argument the section structure, with objectives retained as the coverage ledger. Reference facts and corrections stay secondary. Explicit precedence resolves older warning and sentence-length rules. Genuine evidence-evaluation tasks retain honest limits; authored hedge-only questions become concrete concept questions.
- **03-study-guide-v1.md:** The grouped-term register mirrors direct statements, necessary qualifiers, evidenced cautions, concise sentences and entry summaries. Sections follow the governing argument, with history and biography serving as evidence and reference facts in existing tables/timelines.
- **06-visual-system.md:** Figure purpose remains required as an ordinary caption or adjacent sentence. The literal “Why it matters:” label is forbidden; numbered “What to look at” explanations remain. Mix-up callouts require the exact evidenced error and state the correct fact once.
- **19-study-source-and-format-contract.md:** The shared register points all three goals to the authored-language rules. Its Review section organization follows the governing argument while exact quotations, objectives, tasks and evidence remain protected.

## Schema and generation

Only `objective.freeRecallCues.minItems` changes from 1 to 0 in the canonical v4 schema, its prompt pin and the app's v4 reader copy. `watchFor` already permits an empty array. Existing non-empty arrays remain valid and are retained. The v2/v3 schemas and storage envelope are unchanged.

`build_prompts.py` now emits `notebook-instructions-beta-31`; all three installed templates, composition contract and manifest were regenerated and synced through the integrity checks. Schema receipts and approved full-template hashes were updated. The package check's stale `objective/cue/action` assertion now checks the current `objective/question/skill` wording, preserving the duplicate-surface guard.

No flashcard prompt/builder, reader components/styles, dependencies, global tokens, fonts or theme behavior changed. Existing untracked real-run harnesses and coursework artifacts were left uncommitted.

## Validation

- `npm run build`: passed; bundle-size advisory remains informational.
- Notebook library and notebook/import/update components: **669 tests / 53 files passed**, two workers.
- `scripts/notebook/test_prompt_schema.py`: **9 tests passed**, including temporary-directory sync and tamper rejection.
- `portable-notebooks/check_package.py`: **317 checks passed**, including fresh full-output reproducibility and canonical methodology guards.
- A fresh `build_prompts.py` output byte-matches all three installed templates.
- New tests cover empty and preserved non-empty v4 arrays, unchanged v2/v3 behavior, every shared language rule in all three goals/new-update modes, the exact wording pair, argument-led Review structure, precedence and unlabeled figure-purpose sentences.

These are structural, compatibility and prompt-contract checks. Claude's fresh BIOL 103 Lesson 14 and ANTH 147 Lecture 10 beta-31 runs remain the next acceptance step. No external model run, production import, merge or deployment is claimed.
