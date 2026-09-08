# Feasibility of the three notebook goals

Current prompt build: `notebook-instructions-beta-2`; notebook schema version 2 and the eleven request fields are unchanged.

This is a bounded instruction/workflow assessment against canonical rules, not evidence that a student trial succeeded. Exactly three maintained static prompts remain. The assessment prompt governs both a single-pass task and a staged conversation with the student's chosen AI; Premed OS does not make an AI API call to generate, rewrite or merge them.

## Choose the goal

| Goal | Best for | Minimum usable material | Ideal material | Concrete output | Limits and next action |
| --- | --- | --- | --- | --- | --- |
| Review | Review a lecture or lesson, understand a confusing topic, catch up or preview a tightly bounded set | Course/scope plus at least one meaningful readable passage supporting an explanation; a filename or list of terms is not enough | The lecture itself plus related material: transcript, slides, notes, readings and objectives when available. A recording is useful only if the chosen AI can actually inspect it; otherwise supply a readable transcript. These are examples, not an all-required list. | Study guide, recall outline (Mastery Map), practice questions, and what is covered or missing | Thin evidence supports limited teaching. Missing objectives stay visible without invented mastery content. Essential unreadable diagrams require readable source material or an explicit representation limit. Split unrelated lessons instead of silently making a whole-course guide. |
| Assessment | Preparing for a quiz, exam, oral task or other assessment across the actual required scope | A named bounded preparation request and enough readable subject evidence to teach some of it. Official scope/format may be unknown, but must remain labeled unknown | Actual instructions/review sheet first, known format, relevant lessons/readings/notes across the stated scope, and optional reference questions/keys/attempts with their roles kept distinct | Study guide or outline across the required lessons, practice questions with explained answers, sources, and what is covered or missing | Week 3 alone can support a Week 3 quiz or explicitly limited partial preparation. It cannot establish complete Weeks 1–6 preparation. Missing lessons require more evidence or an explicit scope reduction. Large packets need saved evidence/coverage checkpoints before synthesis. |
| Assignment | Getting a hint, planning, learning a method, drafting, revising or checking the actual task | The task question/prompt or a clear student request, the requested help stage, and the readable evidence needed for that stage. Revision needs the student's actual work; data analysis needs actual supplied data | Task prompt, rubric, required sources/methods, relevant course material, student attempt and requested assistance boundaries | Hints, a plan, explanations or feedback, plus a check against the task requirements and clear next steps | A hint request does not authorize a finished submission. Missing rubric criteria cannot be invented. Missing data, drafts or source passages limit only the affected work. Formatting or mathematical checks are not a grade or proof of submission readiness. |

Confusing-concept, catch-up and preview requests fit Review; practice questions fit Review or Assessment depending on the scope. These are request variations, not additional goals or prompts.

“Minimum usable” means useful supported help is possible, not comprehensive coverage or a numerical file/word threshold. A completely unreadable packet may yield an honest gap-only package; that is a material request and scope receipt, not a successful learning trial.

## Why these judgments follow the canonical rules

- Review: 03 Runtime briefing mirror and Required structure require connected teaching, supported conditional sections, active recall with taught answers and final synthesis. 11 Rules preserve full supported objective depth while permitting a specifically justified evidence limit. 19 does not require a transcript or formal objectives.
- Assessment: NA-PREFLIGHT, NA-SCOPE, NA-AUTHORITY, NA-COVERAGE, NA-INTEGRATE, NA-TEACH and NA-PRACTICE require actual scope, source roles, all requirements, cross-source explanation and supported practice. The portable assessment section already permits multiple lessons; it needed actionable batching and resumption detail.
- Assignment: NW-TASK and NW-METHOD determine the actual stage and subject-specific work. NW-INTEGRITY/NW-EVIDENCE prohibit invented source facts, observations or completion; NW-NEXT checks the requested support without asserting a grade.
- Shared: 19 and 20 separate selected/connected files from inspected evidence, preserve exact requirements and source limits, and prohibit silent truncation or fabricated coverage.

The main feasibility gap was procedural, not a missing teaching method: “inventory, integrate, teach” did not tell an external AI how to preserve progress through a packet that could not be processed at once. The bounded refinement adds working checkpoints and final reconciliation while retaining the same assessment goal, notebook schema and request fields.

## A workable large-assessment sequence

1. Establish the scope and format from the review sheet or actual instructions first. Preserve every requirement, subpart, qualifier and exclusion. If these are absent, define the student's selected-material scope and state that actual exam coverage is unknown.
2. Inventory actual files and pasted sources. Distinguish supplied, readable, partially inspected, unreadable and not-yet-accessed material. A connection, upload, search hit or retrieved excerpt does not show exhaustive reading. Do not invent a filename for a missing lesson merely because the scope requires its topic.
3. Choose manageable evidence batches by coherent lesson/reading or a trustworthy page/section boundary. Size them to what the chosen AI can actually inspect in that conversation; no provider-specific upload/token cap belongs in the permanent instructions.
4. After each batch, produce a saveable working checkpoint: stable source and requirement identities; exact excerpts and real locators; inspected and still-unprocessed portions; requirement statuses/bases; substantive working explanations; unresolved conflicts; and the next precise batch/action. The student saves the checkpoint and supplies it when resuming. “Persisted” is only claimed after a file was actually created/saved; chat text alone is not a durable file.
5. Resume from that checkpoint. Keep the same source/requirement/excerpt identities and retain actual evidence, not only summaries. A prior checkpoint records prior work; it does not prove a source was re-read in the new session. Reopen needed originals when verifying a claim or resolving uncertainty.
6. After the available batches are processed, reconcile the full original scope. Integrate prerequisite relationships, cross-lesson comparisons and conflicts, then develop the preparation and relevant practice. Scope-only passages do not supply answers. Do not declare completion merely because all filenames appear in a list.
7. Export a complete notebook JSON with a final coverage check. If some scope remains unsupported, name the partial preparation honestly and keep all affected requirements visible. If the student explicitly narrows the task, preserve the original scope and the reason for exclusions; do not relabel missing evidence as out of scope on your own.

A working checkpoint is a saved file containing what has been read, exact source details, working explanations, unfinished items and the next step. Working checkpoints are external-AI working files, not Premed OS notebook imports and not additional maintained goal prompts. Their processing notes may say “unprocessed.” The notebook schema still has only supported/partial/missing/out-of-scope: pending requirements normally use missing with an explicit unprocessed basis and next step, or partial when some subparts really are supported. Sources not yet inspected use not-accessed; partly inspected sources use partial. Nothing adds an unprocessed enum to notebook JSON.

## Output and storage boundaries

A complete JSON package must fit the app's 8 MiB raw UTF-8 input ceiling. This is not a promise that any package below it can be saved locally: the app also stores original/current content and related state, and available browser storage varies. Preserve a downloaded copy, avoid padding or unnecessary duplicate excerpts, and treat a storage warning as a failed save until confirmed.

The app has no automatic semantic merge of partial packages. It can retain distinct complete entries and handle revisions; it does not infer how lesson fragments form one complete preparation notebook. For one combined notebook, the external AI must reconcile the evidence and assemble the complete entry before export, or produce a complete revision using the prior exported package. If the student chooses separate entries/packages, give each a distinct, explicit scope and identity, keep all required references closed within each package, and disclose deferred work. Re-importing fragments is not a merge strategy. Do not shorten substantive teaching to force a file under a limit.

## Goal-selection guidance for Workflow 2

Use one inline set of fields beside the selected goal: **Best for**, **Have ready**, **You will receive**, and **Missing or large packet?** The first table supplies the source-grounded content. For assessment, the last field should say to start with scope, supply the relevant lessons, and process a large packet in saved batches before cross-lesson synthesis. It should make the Week-3-versus-Weeks-1–6 distinction concrete. For assignment it should state the requested help stage; for review it should name the lesson scope. This does not need a repeated generic dialog or a fourth prompt.

## Manual feasibility check

The companion invented case under `feasibility-case/` exercises a six-lesson assessment with only Week 3 inspected initially, Week 2 awaiting processing, other required lessons missing, and an input deliberately handled in batches. It includes expected checkpoints and a complete partial-preparation JSON to inspect. It is not a run of Andy's course projects, a provider capacity benchmark, or a student quality rating. Use the same assessment prompt throughout the manual conversation and record actual behavior, including forgotten requirements or falsely upgraded source access.

Materials go to the chosen AI; final notebook JSON goes to Premed OS. A recording, chat connection or source folder is never a universal promise of audio/video inspection or persistent context.

Instruction feasibility and beta readiness remain separate from app end-to-end and production readiness. No real class trial or rating is prefilled.
