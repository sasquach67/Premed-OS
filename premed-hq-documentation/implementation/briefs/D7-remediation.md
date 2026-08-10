# D7 brief — comprehensive remediation

Fixes everything the final audit reported that is fixable **without** Planning mode or the undesigned features. Work top to bottom; commit in the groups shown.

**Out of scope — do not attempt:** the term-column Planner, course→requirement catalog dataset, catalog-change impact, watched-folder note ingest, syllabus extraction/parser, the full exam-plan surface. These need their own chunks.

**If something here is unclear or the spec is silent, stop and ask — do not guess.**

---

## Group 1 — correctness (commit: `fix(academics): audit blocking items`)

1. **Failing tests.** `migrateAcademicTags` mutates a read-only topic (`src/store/store.ts:228`). Make it non-mutating. All five store tests must pass.
2. **Assignment deadlines → attention bell.** `attention.ts` reads only `data.tasks`. Add class-assignment deadlines to the attention feed. Assignments stay **excluded from Home's to-do widget** — deadlines reach attention only.
3. **Contacts → Letters + Profile/CV.** Letters stores a separate recommender **string** (`Letters.tsx:12`); Profile never reads `persons` (`Profile.tsx:110`). Wire both to the canonical `Person` records so a contact tagged "potential letter" appears in Letters, and contacts feed Profile/CV. Migrate existing recommender strings to `Person` links — versioned, lossless, ambiguity → review, never a silent merge.
4. **Coverage positional fallback.** The v7 migration defaults unlabeled chunks to `pending` (`academicsV7.ts:8`) instead of performing the required assignment. Implement the three-tier pipeline: **semantic → positional (file/lecture → syllabus week → unit) → document-specific topic**. Add a test proving **no semester-wide misc bucket** is ever created.
5. **`AcademicFile` ownership field.** Add explicit `owner: 'course' | 'mine' | 'generated'` (`types.ts:292`) — additive, versioned migration. Materials ownership markers must be structural, not inferred.
6. **Class data → Overview.** Assignment, coverage, weakness, and due-topic state currently stop at Academics. Wire them into Overview's derived academic status.

## Group 2 — locked-decision drift (commit: `fix(academics): restore locked boundaries`)

7. **Trim Anki exposure** to the locked "optional open-deck link only": remove the Anki badge on class cards and the Anki field in class settings. `ankiDeckName` may remain as a plain bookmark link, nothing more.
8. **AI-generation allow-list.** Add a single central policy proving generated practice items are limited to the approved contexts (M2M drills + flashcards). Audit "Generate study guide" and legacy practice-generation paths against it; anything outside the allow-list is removed or routed through it.
9. **Note kinds — structural, not conventional.** Both note surfaces share one `ClassNote` entity. Add an explicit kind discriminator so "about the class" (exam intel / questions / priming / lecture) and "on the material" (`Mine` files) are enforced by the model, not by which screen you're on.
10. **Pace-line rules.** Enforce app-wide: **max one per panel**, each **dismissible** and collapsing to a "Show projection" pill, **never on streaks**. Audit every Academics panel.

## Group 3 — states + craft (commit: `style(academics): states and visual fidelity`)

11. **Loading / error states.** Scoped states for remote material processing, AI failures, embeds, and class-workspace failures. Every collection already has an empty state — bring loading and error to parity.
12. **Visual fidelity pass.** Open `specifications/mockups/01-academics/academics-daily-main-page.html` and `academics-class-hub.html` beside what's built and close the gaps. Use `specifications/mockups/_shared/_visual-recipes.md` values **literally**: layered banner gradient (not flat), glass recipe **including the inset top highlight**, underline glow, class-card rest/hover incl. the unlit-on-button-hover rule, panel radii and shadows, panel spacing and proportions.
13. **Remaining off-scale values.** Sweep class-page components for arbitrary palette shades and radii outside the token scale.
14. **Mode switch a11y.** Expose as a two-option radiogroup/tablist rather than a single binary ARIA switch, so the selected label is announced.

## Report

For each numbered item: **done / partial / skipped**, with file references. For item 12 specifically, list **what was missing or approximated and what you changed** — not "matched the mockup."

`npm run test` and `npm run build` must both pass before each commit.
