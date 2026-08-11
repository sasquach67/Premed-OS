# Claude prompt — School List spec migration and ruling preparation

Use this prompt to update the canonical School List specification. This is a **documentation-only** task: do not change application code, schemas, or `data/med-schools.json`.

## Objective

Turn the ruled School List material into a usable canonical spec at:

```text
premed-hq-documentation/tabs/08-school-list.md
```

The current file is a stub. Migrate only decisions that are already ruled. For unresolved items, preserve an explicit decision record and present the user with narrow questions; do not make a ruling yourself.

## Read first — precedence and sources

1. `premed-hq-documentation/AGENT-IMPLEMENTATION-GUIDE.md` — documentation is the source of truth; stop for ambiguity.
2. `premed-hq-documentation/general.md`
3. `premed-hq-documentation/architecture/04-admissions-framework.md`
4. `premed-hq-documentation/specifications/00-product-shell.md`
5. `premed-hq-documentation/tabs/08-school-list-board.md` — the full board; it is source material, not the final spec.
6. `premed-hq-documentation/tabs/08-school-list.md` — the target stub.
7. `premed-hq-documentation/data/med-schools.json` — directory schema and recorded data defects.

## Research packets — evidence for future rulings

Read these before discussing the corresponding rows. They distinguish official facts from non-binding product implications:

- `premed-hq-documentation/implementation/research-prompts/school-list-sl-24-application-services.md`
- `premed-hq-documentation/implementation/research-prompts/school-list-sl-26-prerequisite-coverage.md`
- `premed-hq-documentation/implementation/research-prompts/school-list-sl-27-letters-routing.md`

Do not turn an evidence-backed implication into a settled product decision without the user's explicit ruling.

## Already ruled — migrate as binding behavior

- **§1 governing boundary:** Premed OS ships no admissions-profile numbers. A student may enter median MCAT, median GPA, in-state percentage, and class size for a school they track. The product may compute only from numbers the student supplied; it must not fetch or ship them.
- **§1b modes:** one School List tab has **Explore** (static roster: names, city, state, degree, application service, accreditation) and **Track** (the student's application records). The roster contains no admissions-profile numbers.
- **SL-9:** tuition is a student-entered planning input; acceptance rate is cut.
- **SL-16:** no `rejected` or `no response` status. Show elapsed time since a relevant submission as a fact, not a verdict.
- **SL-21:** phase-gate cycle machinery, but never hide the tab: first-years can Explore and record why a school interests them.
- **SL-22:** optional map view, with the documented roster/geocoding constraints.
- **SL-23 phase 1:** student pastes secondary prompts upon receiving a secondary; attach/stamp them to the school and cycle; reuse Essays & Story Bank's existing prompt mechanism rather than building a second store. Phase 2 shared prompts is not v1.
- **Deferred:** SL-18 interview logistics, SL-25 PREview/CASPer, and SL-30 post-interview behavior. Keep these visible as deferred, not silently omitted.

## Explicitly unresolved — do not decide or build into acceptance criteria

- Wave 4, SL-24 through SL-31, has not received its ruling pass. Research exists for SL-24, SL-26, and SL-27 only.
- Waves 0–3 have governing rules but still need their row-by-row ruling pass.
- The two regional-campus roster entries without a city need a product ruling.

## Required deliverable

Update only `tabs/08-school-list.md` so it is a clear implementation-ready spec for the ruled scope. It must include:

1. Purpose and stage-aware behavior.
2. Explore/Track ownership, entities, and cross-tab boundaries.
3. Views, workflows, inspector sections, and phase-gated states for ruled scope.
4. Data-trust limits: static roster facts versus student-entered data; no shipped admissions metrics; no admissions-odds or readiness score.
5. Secondary-prompt Phase 1 integration and the Essays ownership boundary.
6. Empty, loading/error, mobile, privacy, and accessibility behavior where the existing global docs supply it.
7. Acceptance criteria that cover only ruled scope.
8. A concise **Open decisions** section listing Wave 4 and the Waves 0–3 batch pass, each with links to the board and research packets where relevant.
9. A compact source/disposition ledger indicating which board sections were migrated, deferred, or remain open.

## Guardrails

- Preserve the distinction between a fact, a derived calculation, and an admissions prediction.
- Do not add school requirements, deadlines, fees, test requirements, admissions metrics, or external data fetching unless already ruled.
- Do not reintroduce a comprehensive per-school secondary library.
- Do not silently fix documented data defects. Record them as data follow-ups unless the user separately authorizes the dataset edit.
- If the board conflicts with a higher-precedence document, flag the conflict and stop for direction.
- Leave `08-school-list-board.md` intact as the decision trail.

## Completion report

Report: files changed, a board-section → spec-section mapping, the exact unresolved questions, and confirmation that no application code or dataset was modified.
