# Existing-deck updates — 2026-10-16

## Contract

New packages use permanent Basic/Cloze model IDs derived from `premedos-prompt-update:fields-v1:<name>`. CSS/templates do not enter the identity. A field name/order change requires a deliberate version migration, never an incidental ID change. GUIDs identify notes; cloze ordinals identify their review cards. Authoring must preserve each blank’s retrieval meaning, not just its number; semantic equivalence remains a human/AI review responsibility.

Attach a current .apkg export for the same lecture and run `read_previous.py`. It imports only into a fresh temporary collection, reads fields/tags/GUIDs/ordinals/media, and closes it. Durable hidden `premedos_spec` JSON stores deck identity, surviving Anki’s own modern exports; a ZIP manifest also supports original packages. No app dependency, auth, sync, or storage schema changes.

`build_deck.py ... --previous current.apkg` validates the same deck identity and permanent field schema, rejects unknown/duplicate GUIDs and changed note type/ordinal sets, preserves custom student tags, and replaces managed/objective tags. Reused notes have improved content; every unreused old note is carried unchanged in its fields and media with `premedos::retired`. Retirements do not count toward the new coverage ledger. Existing retired notes remain tagged on subsequent updates. New cards use fresh authoring IDs when a previous ID would collide.

Packages are written with modification timestamps newer than the attached notes and models. This prevents same-second builds being ignored by Anki. Outputs and reports never overwrite files. `verify_deck.py ... --previous` checks active/retired accounting plus the actual imported package.

## Student workflow

Export the current lecture deck as .apkg, attach it with the Journal in the external AI chat, and import the resulting update. Pick **Update notes: Always**, **Update note types: Always**, **Import any learning progress: off**, **Merge note types: off**; leave deck presets/configuration import off if offered. Existing collection scheduling/review logs remain. Search `tag:premedos::retired` in Browse after checking the update; the student can delete those notes. Retiring does not automatically suspend or delete them.

Pre-update-format decks need a one-time backup and replacement because they have CSS-hashed note types and no durable deck identity. That replacement does not automatically preserve their review history. The builder refuses an unsafe in-place migration. Never open/delete/sync a live profile to do this for the student.

## Validation boundary

Tests use synthetic v1/v2 decks and disposable real-Anki collections: identity/counts, text, stored review log and scheduling, retired fields/media, modern export/reimport, CSS/template updates without duplicate note types, and rejection paths. Anki Python model caches must be refreshed/reopened after imports to observe backend model changes. Requirements remain pinned to 26.8.1; matching installed desktop backend 26.9.3 is tested separately without opening its profiles. These establish import behavior, not semantic equivalence of arbitrary re-authored questions.
