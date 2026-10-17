# Study guide redesign — implementation and review gate

Authority: Andy's Oct 17 request and `/Users/andyquach/Documents/Premed OS Academics Audit/2026-10-17-study-guide-codex-brief.md`. Approved visual target: root checkout `mockup-lab/01-academics/academics-study-guide-grouped.html`; audit in the same external audit folder. Mockup notes saying proposed predate Andy's approval.

## Scope and milestones

1. Add opt-in v4 fields without changing the storage envelope or old v2/v3/v4 requirements. Validate glossary consistency, same-section map links, nested list indices and objective links.
2. Reader: bounded **term** markup with accessible popovers, generated glossary, one-level nested bullets, six callout tones, professor-emphasis marker, toned tree maps with section-local targets, official objective chips, summary/print and section-linked practice.
3. Update the five canonical notebook instruction documents, bump beta29, rebuild all notebook copy prompts and verify parity. Flashcard prompt and builder stay untouched.
4. Author a combined BIOL103 Lessons10–12 proof using slides, captions, outlines and GRQs. Import into a signed-out local preview with local image bytes. No Lesson2 sources.
5. Verify build, notebook suites, prompt parity, old fixtures and both themes at desktop/375px. Capture map, figure, callout, glossary and summary comparisons against the approved mockup.

## Contract

All new properties are optional and v4 only. Blocks may carry `definedTerms: [{term, definition}]` and `stressed`. Bullets preserve string `items` and may add `nestedItems: [{parentIndex, items}]`. `callout` adds `tone` and `text`. Diagram nodes add optional `tone` and same-section `targetBlockId`. Sections add `learningObjectiveIds` referring to entry objectives. No global token/font/theme changes and no dependencies added.

A term's structured definition is the canonical sentence for its popover/glossary and future flashcards. Matching an existing flashcard set is only verified when that set is supplied and compared. Summary includes all guide maps, one-thing callouts and glossary; practice is separate and linked through objectives/requirements.

## Hold

STOP before merge or deployment. Send Andy preview screenshots alongside the mockup and wait for his explicit approval in this chat. Local commits do not authorize merge/deploy.

## Local handoff (completed)

Implementation and automated checks are complete. Local review artifacts are in `output/study-guide-redesign-proof/` (course material remains outside code commits). See `QA-REPORT.md`, `SOURCE-AUDIT.md`, `review.html`, notebook JSON/ZIP and screenshots there. The notebook suites passed 626 tests; final affected reader suites passed 22 tests; prompt tooling passed 9 tests; semantic proof/bundle passed 2 tests. Signed-out Academics and live map/popover/practice behavior were observed. Exact comparison to existing flashcard wording remains unverified. Visual acceptance, merge and deployment remain gated on Andy’s approval.
