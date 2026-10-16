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

List reveal uses no external code: current Anki data-cloze attributes, one click/tap or supported key per reveal, ordinary all-blanks fallback without scripts, all items on answer. Listener cleanup prevents reviewer-window accumulation. Browser DOM tests cover interaction; physical AnkiMobile/AnkiDroid are not tested. Built-in MathJax/mhchem typesetting was exercised using installed Anki assets with actual core-rendered clozes.

Current Anki 26.9.3 native IO runtime was exercised in an isolated Chrome profile with a synthetic diagram: an active mask covers its label, and the surrounding context stays visible. Native model/package recognition, media, updates, personal notes and scheduling are also checked in disposable real collections. These do not establish physical mobile behavior or arbitrary authoring accuracy.

A current export may carry an existing parent-deck path (for example UNC::Fall26::Memory). Update mode preserves that exact name and deckKey; new builds still require standalone titles. Verification permits only its exact ancestors, never unrelated decks.
