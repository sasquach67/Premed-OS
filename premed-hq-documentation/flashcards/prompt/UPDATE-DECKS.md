# Existing-deck updates — 2026-10-16

## Contract

New packages use permanent Basic/Cloze model IDs derived from `premedos-prompt-update:fields-v1:<name>`. CSS/templates do not enter the identity. The final Basic/Cloze schema appends Topic, Source and My notes while retaining those released IDs; the tested one-time merge upgrade preserves existing review history. Native IO uses fixed ID 895232792405 with its final 11 fields. Future schema changes require deliberate migration, never an incidental ID change. GUIDs identify notes; cloze ordinals identify their review cards. Authoring must preserve each blank’s retrieval meaning, not just its number; semantic equivalence remains a human/AI review responsibility.

Attach a current .apkg export for the same lecture and run `read_previous.py`. It imports only into a fresh temporary collection, reads fields/tags/GUIDs/ordinals/media, and closes it. Durable hidden `premedos_spec` JSON stores deck identity, surviving Anki’s own modern exports; a ZIP manifest also supports original packages. No app dependency, auth, sync, or storage schema changes. PDF coordinate extraction uses pinned pdfplumber 0.11.9 and Pillow 12.1.0.

`build_deck.py ... --previous current.apkg` validates the same deck identity and permanent field schema, rejects unknown/duplicate GUIDs and changed note type/ordinal sets, preserves custom student tags and My notes, and replaces managed/objective/exam tags. It accepts the already-released Basic/Cloze field prefix and pads only the three appended fields during migration; prior values remain unchanged. Reused notes have improved content; every unreused old note is carried unchanged in its fields and media with `premedos::retired`. Retirements do not count toward the new coverage ledger. Existing retired notes remain tagged on subsequent updates. New cards use fresh authoring IDs when a previous ID would collide.

Same-schema packages advance beyond the attached note/model timestamps. For the append-field upgrade, source-version note timestamps advance by two seconds rather than choosing generation wallclock: Anki schema merging bumps local modification times and Always still skips exact timestamp ties. Always accepts older unequal source timestamps; repeated migration tests cover both Basic and Cloze. Students must check the import summary and representative notes before deleting retired notes; if expected notes were skipped, retain the export and rebuild rather than replacing identities. Outputs and reports never overwrite files. `verify_deck.py ... --previous` checks active/retired accounting plus the actual imported package.

## Student workflow

Export the current lecture deck as .apkg, attach it with the Journal in the external AI chat, and import the resulting update. Pick **Update notes: Always**, **Update note types: Always**, **Import any learning progress: off**, **Merge note types: on** for the appended-field upgrade; leave deck presets/configuration import off if offered. Existing collection scheduling/review logs remain. Search `tag:premedos::retired` in Browse after checking the update; the student can delete those notes. Retiring does not automatically suspend or delete them.

Pre-update-format decks need a one-time backup and replacement because they have CSS-hashed note types and no durable deck identity. That replacement does not automatically preserve their review history. The builder refuses an unsafe in-place migration. Never open/delete/sync a live profile to do this for the student.

## Validation boundary

Tests use synthetic v1/v2 decks and disposable real-Anki collections: identity/counts, text, stored review log and scheduling, retired fields/media, modern export/reimport, CSS/template updates without duplicate note types, and rejection paths. Anki Python model caches must be refreshed/reopened after imports to observe backend model changes. Requirements remain pinned to 26.8.1; matching installed desktop backend 26.9.3 is tested separately without opening its profiles. These establish import behavior, not semantic equivalence of arbitrary re-authored questions.

## Card features and exact fields

Basic (11): Front, Back, Extra, Type, Mindset, premedos_concept_id, premedos_source, premedos_spec, Topic, Source, My notes.
Cloze (10): Text, Extra, Type, Mindset, premedos_concept_id, premedos_source, premedos_spec, Topic, Source, My notes.
Native IO (11): Occlusion, Image, Header, Back Extra, Comments, Topic, Source, My notes, premedos_concept_id, premedos_source, premedos_spec.

Breadcrumb defaults to target topic. Source is a collapsed back-side locator, distinct from hidden evidence JSON. My notes is empty for new notes and copied exactly from current Anki exports by GUID; retired notes retain it. Exam tags are optional when already known. Native IO uses one normalized rectangle and one c1 per note, only on instructional label tasks. PDF helper uses actual text coordinates and renders the matching full-page PNG; raster box estimates require visual checking.

Grouped reveal uses no external code: current Anki data-cloze attributes, one click/tap or supported key per reveal, ordinary all-blanks fallback without scripts, all items on answer. Listener cleanup prevents reviewer-window accumulation. Browser DOM tests cover interaction; physical AnkiMobile/AnkiDroid are not tested. Built-in MathJax/mhchem typesetting was exercised using installed Anki assets with actual core-rendered clozes.

Current Anki 26.9.3 native IO runtime was exercised in an isolated Chrome profile with a synthetic diagram: an active mask covers its label, and the surrounding context stays visible. Native model/package recognition, media, updates, personal notes and scheduling are also checked in disposable real collections. These do not establish physical mobile behavior or arbitrary authoring accuracy.

A current export may carry an existing parent-deck path (for example UNC::Fall26::Memory). Update mode preserves that exact name and deckKey; new builds still require standalone titles. Verification permits only its exact ancestors, never unrelated decks.


## Pending authoring follow-up — 2026-10-16j

Hold this follow-up for Andy’s go-ahead; do not merge or deploy automatically. Rule B is approved: simple/opposite pairs use one card with both meanings under c1 and visible names, without separate meaning notes. Headline pairs now use shared meaning recall first, then uncued name recall: one shared name card for opposites or one name-only sister per term for non-opposites, plus one supplied instructor example when available.

Approved authoring changes: only this lecture’s new content gets dedicated cards, unless an objective explicitly tests it or this lecture actually defines it; worksheet/GRQ/practice questions inform concept selection but are not copied or rephrased into Anki practice; recordings/transcripts fill specific gaps after reading the Journal, slides and worksheet; one fact per card, with no unrelated trailing fact. Lecture examples, instructional picture cards, the student’s own missed-question concept reinforcement and the existing sequence/umbrella formats stay. Coverage language uses the same new-content scope filter. Exercise-linked coverage means retention of its concept, not proof of executing the exercise.

The portable prompt is regenerated from authoring.md. Note-type IDs, field order and export-based update behavior remain unchanged. The 16h CSS/templates implement the approved inline F2 breadcrumb chip. The builder now enforces named definition recall, renders up to three useful Extra lines and warns on weak context, missing available examples and non-notebook breadcrumbs. Breadcrumbs are short source-derived labels: 1–4 words, at most two segments, aim ≤32 characters and hard maximum 40. Full exact objectives stay in the coverage ledger. The embedded reveal script and feature samples now include the grouped-reveal follow-up. The preview README records counts before and after the scope audit; the small feature fixture does not establish a full lecture’s reduced count or authoring time. Future lecture builds must report their actual review-card count.

Grouped reveal now depends on two or more active cloze spans with the same ordinal and complete answer data, not the card label. Opposite pairs and other grouped clozes therefore reveal one blank at a time; single active blanks, incomplete/mixed index data and no-script clients retain ordinary Anki behavior. Existing cleanup and input-control exclusions stay in place. The preview adds the approved regulator pair in both v1/v2 samples and retains the export-based personal-note test. This follow-up remains held for Andy’s approval.


Clarity additions: required cold-read review with actual rewritten-card IDs/count; no invented terminology; lecture/Journal example first when available, optional plain restatement even under default wording, and supplied research/case evidence. Example and explanation can coexist, rendered in that order with line breaks; list-item keys keep their separate exception. Empty Extra is appropriate only when none applies.

Every lecture-defined term, including familiar or subsidiary terms, keeps meaning recall in a cloze answer or Back. A visible definition with only the name blanked cannot satisfy the guard, nor can an unrelated anonymous meaning blank linked to the same target. The same card must identify the term and require its meaning. The guard is structural; authored source inventories and adequate meaning phrases still require review.

Target topics copy exact Journal objective titles for coverage. Breadcrumbs use a short section/topic name or noun phrase from actual titles; each segment’s words must occur in one notebook title. The optional notebookTitles inventory supports sections as well as target topics. Provenance warnings do not establish authenticity or relevance, which still require a Journal check. Answer-revealing labels remain guarded on the question.

The external feature preview is re-authored to demonstrate all three Extra kinds, defined sub-term/member recall and exact titles. Counts and cold-read rewrite totals are in its README and receipts. The larger sample repairs missing definition recall; it does not establish a lower count for a full lecture. Hold the combined release for Andy’s explicit go-ahead after testing.


### Native desktop reveal and parallel-meaning follow-up

The held 16g prompt permits 2–4 parallel terms with visible names and all complete meanings under one index. The four-term builder cap uses declared visible-name/hidden-meaning targets, so larger ordinary name lists and pathways remain valid. Headline definitions and evidenced headline contrasts retain their existing rules; grouping never removes the last meaning-recall witness. Breadcrumb styling is unchanged.

The current reveal script already has no label/type gate. An isolated native Anki 26.09.3 reviewer probe reproduced the missing control by retaining the legacy list-only template. A real package import with **Update note types: Always** restored the exact positive/negative-regulator card's control. This demonstrates a stale-template failure and its repair; it does not establish which template Andy's main profile currently has. Do not replace an existing note with a duplicate to repair its template.

Run `python3 premed-hq-documentation/flashcards/prompt/checks/desktop_reveal_probe.py --package <preview-v1.apkg> --report <preview-v1.build-report.json> --work-dir <new-empty-directory> --group component-meanings-group:3 --group emotion-meanings-group:4` on a Mac with Anki installed. It starts the installed application with a unique single-instance key and a newly seeded unsynced test profile, imports the actual package, and uses the native reviewer. It never reads the user's profile. Receipts include Anki version, original two blanks, one reveal per click, no answer-side control, single-blank behavior and transition back to the pair. The optional group arguments must identify actual sample notes. Test artifacts and screenshots stay outside the repository.

The 16g sample passed 19 native reviewer observations on Anki 26.09.3, including its 3-term and 4-term groups. The preview now has 18 active notes / 20 review cards (previous clarity sample: 19 / 21); v2 adds exactly one retained retired note/card. This fixture is not a complete lecture deck or a full-lecture reduction measurement. The unchanged JS remains covered by expanded label/type/index DOM tests plus this native probe. Physical mobile behavior is still untested. **Remain on hold for Andy's explicit go-ahead.**


### 16h — F2 chips and replacement headline-pair protocol

The old separate Topic line is removed from Basic, Cloze and native IO templates. Each label row contains the square/one-word label followed by a wrapping rounded chip: monospace 11.5px, padding 4px 9px, light #efe9de / #6f675a and night #3a342b / #cfc6b6. Exact Journal titles remain intact. A hidden marker in the existing managed Type field suppresses an answer-giving chip on the question only when a literal cloze-answer phrase occurs in the title; the answer keeps the title. This works without JavaScript and adds no note fields. Indirect clues still need cold-read review.

Headline opposite pairs use two one-index notes: meanings with both names visible, then both names recalled together from visible meanings. Non-opposite headline pairs use the same shared-meaning note followed by two separate name-only sister notes. Simple pairs retain only meanings. A supplied instructor example earns one additional card. Only the exact non-opposite three-note set plus its evidenced example may use four reviews under one concept ID. General three-review and sole-coverage exceptions remain intact. Choice-list hints are rejected; category hints remain valid.

The portable pair_rules.py validates author-declared `opposite:` and `non-opposite:` axis markers against recorded named-term meanings, including partial name deletions. It cannot infer that an undeclared relationship is opposite or establish source accuracy. The definition-recall guard remains independent and mandatory. Portable assembly includes this helper and tests execute the embedded files in a fresh directory.

The refreshed selected preview has 21 notes / 22 active review cards (16g: 18 / 20); v2 has those active totals plus one retired note/card, 22 / 23 total. The increase includes a clearly marked three-note non-opposite biology demonstration, not additional PSYC lecture scope. All replaced retrieval demands receive new GUIDs; unchanged demands keep their GUIDs. Earlier preview sets are archived. Continue to use a new unsynced profile for the feature sample, and rebuild v2 from a fresh export to preserve typed My notes. The held release remains draft PR #36 until Andy explicitly authorizes merging.


### 16i — category hints everywhere

The biology direction example uses `effect on Rb`, and the old intrinsic/extrinsic option-hint recipe is described in prose rather than shown as cloze syntax. A regression check scans every concrete cloze hint in the entire generated portable prompt, including its examples and embedded files. `slash_option_hint_warnings` identifies a slash-separated word-choice hint only when its answer matches one of the options (case-insensitive, normalized); the builder emits a UserWarning before the existing hard rejection. Category hints remain valid. CLI coverage verifies the warning is visible and no invalid package is written.

No card fields, templates, CSS, note IDs or preview package bytes changed from 16h. Both preview authoring inputs still pass the current validator. The same 22-card preview and its native/visual evidence remain applicable; the portable helper and complete prompt copy are refreshed to 16i. Continue holding draft PR #36 for Andy's go-ahead.


### 16j — short topic labels, not objective paragraphs

This supersedes the long-title breadcrumb rules and wrapping chip text described in earlier iterations. Chip labels use 1–4 words and one or two segments, aiming at ≤32 characters; the builder/schema fail above 40, including fallback text. They take actual notebook section/topic names or noun phrases from objective/section titles. Every segment’s words must occur in one supplied actual title. Full target.topic values remain unchanged for coverage, while notebookTitles optionally supplies additional actual section/topic titles. The builder warns on missing title words and obvious objective verb phrases. It cannot authenticate the inventory or infer semantic relevance.

F2 colors/font/padding stay unchanged. Chip text uses nowrap with no ellipsis or clipping; the chip can move below the label as one unit. All sample labels are 1–3 words and ≤22 characters. Counts remain 21 notes / 22 active reviews, and all note GUIDs and retrieval demands are preserved. A native Anki 26.09.3 probe now accepts expected question-chip visibility and can set its actual reviewer viewport to 390px; it checks full one-line chip text as well as sequential reveal. Portable assembly preserves source trailing newlines exactly so a harmless CSS newline cannot change the embedded builder’s style hash.

Continue holding draft PR #36 until Andy explicitly authorizes release.

## 2026-10-20 — whole-structure rebuild preview (2026-10-20a, held)

Rebuild is a new Basic Q&A retrieval demand for a lecture's whole chain, comparison table or argument, graded once. Atomic cards remain. Named sets keep umbrella clozes and labeled structures keep image occlusion; zero rebuilds is valid. Rebuild notes have separate `-rebuild` concept IDs and source evidence, with count/shape validation and explicit build-report entries. They do not satisfy term-definition recall or replace connecting cards.

The Basic/Cloze/IO field lists, permanent IDs and fresh-export update behavior are unchanged. Existing GUIDs and My notes continue through the export-based update pipeline; rebuild notes are new notes. Template styling adds the rebuild accent only. Source remains hidden as in the held October 17 batch.

Review the feature preview in `~/Documents/Premed OS Academics Audit/2026-10-20-rebuild-preview-v2/` using a new unsynced Anki profile. It adds biology rebuilds from Andy's own BIOL 103 Lesson 11–13 sources (Ras–ERK chain, DNA-damage checkpoint chain, two-row oncogene versus tumor-suppressor table) to the earlier three-structure preview. A comparison table may have two rows when every row is written `Item: value; value` with at least two axes; chains and arguments still need three or more steps. The October 17 batch is merged; this revision remains held for Andy's review, and opening the PR is not permission to merge or deploy.
