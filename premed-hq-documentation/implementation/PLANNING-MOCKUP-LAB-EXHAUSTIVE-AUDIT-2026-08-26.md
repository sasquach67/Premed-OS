# Planning Mockup Lab exhaustive audit — 2026-08-26

**Status: SUPERSEDED BY THE FINAL REVIEW PACKAGE — mockup-only.** Nothing in
either packet is approved or built. No application source was changed by this
sweep.

> **Consolidation note, 2026-08-26:** the standalone Tar Heel Tracker / Planning
> Library candidate was subsequently withdrawn. Its useful audit behavior now
> lives in Planner's `requirements` view. The current approval packet is
> `mockup-lab/01-academics/PLANNING-FINAL-REVIEW-PACKAGE-2026-08-26.md`.
> That package adds the Planner requirement-map and catalog views to this
> initial ledger and is the exhaustive 29-current-view record.

## Shared-root delivery

- Shared workspace: `/Users/andyquach/Documents/premed-os`
- Review host: `http://localhost:8765`
- The Planning source pages and their same-name documentation mirrors were
  reconciled into the shared workspace without copying unrelated worktree files.
- Registry entries remain **PROPOSED** (legacy entries remain **SUPERSEDED**).
  This packet records review evidence only; it does not authorize implementation.

## Shared-root verification

- **32/32 review links returned HTTP 200** from the shared Lab at
  `http://localhost:8765` (29 current interfaces plus 3 legacy artifacts).
- **29/29 current registry interfaces loaded through the Lab shell** with a
  rendered page heading and the current Planning review revision; no missing or
  stale iframe source remained.
- **22/22 source/mirror artifacts are byte-identical** across the 11 required
  Planning HTML/Markdown pairs.
- Desktop and narrow review checks found **no page-level horizontal overflow**
  in the 29 current interfaces. Dense tables and timelines keep their intended
  internal scrolling.
- A shared-Lab cache defect initially displayed older iframe canvases even
  after the source files were synchronized. Planning registry entries now carry
  the review revision `planning-review-20260826-v2`, so the visible Lab loads
  the published canvases instead of the stale copies.
- No app source, Daily mockup, approval status, or BUILT status was changed by
  this delivery.

## Exact authorities and path aliases

- `S` = `mockup-lab/01-academics/`
- `M` = `premed-hq-documentation/specifications/mockups/01-academics/`
- `AC` = `premed-hq-documentation/tabs/01-academics.md` §4.2-C plus the Planning acceptance list
- `AD` = the same file, §4.2-D plus the Planning acceptance list
- `AE` = the same file, §4.2-E plus the Planning acceptance list
- `VR` = `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`
- `RS` = `mockup-lab/variant-lab.html`
- `RM` = `premed-hq-documentation/specifications/mockups/variant-lab.html`

The initial rows below were visually inspected through the live Lab at 1600×900
and again at the 1180×820 narrow review viewport. The final package adds the
integrated requirements and catalog views, records all 29 current interfaces,
and accounts for all three legacy sources. It is the authoritative ledger.

## Second-pass visual amendment

The source HTML was treated as editable canvas, while settled product rules were
kept fixed. These refinements apply to every corresponding row in the exhaustive
ledger below:

| Page family | 2026-08-26 visual refinement | Why |
|---|---|---|
| Planner | Verified unchanged: literal timeline-first board, compact controls, MCAT lane, outcome rail, and unplaced tray already match the shared recipe. | Avoid replacing the settled Planner with a generic sequence or card wall. |
| Planning Library historical reference | Preserved its former blue/sage dossier as a visibly superseded source artifact and directed review to Planner's integrated requirement map. | Retain design history without letting an unregistered standalone tracker compete with Planner. |
| Grades & Archive | Preserved the banner on all transcript states and replaced the fixed 1400px outer frame with a fluid 1400px maximum across all six views. | Keep dense tables bounded to their own horizontal region and remove page-level narrow overflow. |
| Planner decision states | Re-anchored all six states under Academics; used blue for planning, violet for MCAT order, sage for recorded facts, and amber for manual/export limits; rebuilt internal evidence as solid 16px panels and 12px rows. | Create intentional state hierarchy without introducing a competing planner shell. |
| Planning cold start | Rebuilt the empty scene as three 12px clay term lanes inside a solid plan surface, with a blue first-fact edge and subordinate sage prior-credit path. | Show where real data enters without fake plans, metrics, or an oversized onboarding card. |
| Grade decisions | Refined returned work, applied policy, missing inputs, and mistake evidence with blue/sage/amber/violet evidence roles and compact annotated rows. | Preserve source → decision → evidence-boundary reading order. |
| Term rollover | Gave origin and each reversible topic fate a semantic edge, changed topics to compact inset rows, and kept the archive promise amber. | Read as a transition map rather than three equal dashboard cards. |
| Term retrospective | Added the exact blue/sage banner layer, compact record rows, violet observations, and sage carry-forward treatment. | Preserve Variant A as one honest reading page while keeping B/C as comparison/state proofs. |
| Forecast accuracy | Added blue claim, sage evidence, and amber suppression hierarchy plus compact ledger rows. | Keep the page an accountability record about Premed OS, never a student performance score. |
| Legacy Requirements / tracker | Deliberately left historical instead of visually modernizing it. | A polished second audit would compete with the sole current dossier and confuse the active route. |

## Exhaustive page/view ledger

| Page / exposed view | Exact HTML, Markdown, spec, and registry references read | Disposition and visual result | Changes made and why | Direct review URL | Mirror sync | Unresolved decision |
|---|---|---|---|---|---|---|
| Planner · timeline first | `S/academics-planner-prototype.{html,md}`; `M/academics-planner-prototype.{html,md}`; AC; VR; RS/RM | **Changed + verified.** Literal timeline-first plan board, MCAT lane, outcome rail, controls, and unplaced tray are intact. | Proposal language names Variant A plus the on-demand inspector as the review candidate; no implementation authorization implied. | [Open Planner A](http://localhost:8765/variant-lab.html?page=planner&variant=A) | Source and mirror identical. | Andy: approve Variant A plus the on-demand inspector, or request revision. |
| Planning Library · historical dossier | `S/academics-planning-library.{html,md}`; `M/academics-planning-library.{html,md}`; AE; VR; RS/RM | **Superseded.** The source now carries a visible retirement notice and links to Planner's requirement map. | Removed it from current review/navigation while preserving provenance and design history. | [Open historical source](http://localhost:8765/01-academics/academics-planning-library.html) | Synced. | No approval requested. |
| Grades & Archive · Ledger | `S/academics-grades-archive.{html,md}`; `M/academics-grades-archive.{html,md}`; AD; VR; RS/RM | **Changed + verified.** Term-led transcript cards and archive filters preserve ruled A. | Replaced the fixed 1400px page with a fluid maximum; dense ledger exploration stays bounded inside the ledger. | [Open Ledger](http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=ledger) | Synced; RM now exposes all six views. | Batch approval only. |
| Grades & Archive · GPA | Same Grades pair; AD; VR; RS/RM | **Changed + verified.** UNC and AMCAS remain paired with subordinate trend and boundaries. | Shared second-pass refinement documented above. | [Open GPA](http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=gpa) | Synced. | Batch approval only. |
| Grades & Archive · What-if | Same Grades pair; AD; VR; RS/RM | **Changed + verified.** Scratch scenario remains distinct from canonical grades. | Retained recorded one-home boundary for the complete class calculator. | [Open What-if](http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=what-if) | Synced. | Batch approval only; calculator ownership is already ruled. |
| Grades & Archive · Transcript record | Same Grades pair; AD; VR; RS/RM | **Changed + verified.** Transcript-exact fields and unguessed classification retain the full Academics shell. | Fixed selector that hid the banner for transcript states. | [Open transcript record](http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=transcript-record) | Synced; RM registration added. | Batch approval only. |
| Grades & Archive · No transcript records | Same Grades pair; AD; VR; RS/RM | **Changed + verified.** Honest first-record state keeps the parent shell and shows no fake GPA/export state. | Same banner-preservation fix. | [Open transcript empty state](http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=transcript-empty) | Synced; RM registration added. | Batch approval only. |
| Grades & Archive · Coursework export | Same Grades pair; AD; VR; RS/RM | **Changed + verified.** Student-controlled export retains shell and non-registrar boundary. | Same banner-preservation fix. | [Open coursework export](http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=transcript-export) | Synced; RM registration added. | Batch approval only. |
| Planner decisions · Requirement preview | `S/academics-planning-decisions.{html,md}`; `M/academics-planning-decisions.{html,md}`; AC; VR; RS/RM | **Changed + verified.** Planner canvas stays visible; preview names confidence, cap, unlock, and staleness. | Corrected decision record so Tracker is local catalog evidence, never an official audit. | [Open requirement preview](http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=preview) | Missing mirrors added; synced. | Batch approval only. |
| Planner decisions · Plan comparison | Same Planning-decisions pair; AC; VR; RS/RM | **Changed + verified.** Neutral plan sheets, restore controls, and honest export note remain. | Shared second-pass refinement documented above. | [Open plan comparison](http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=compare) | Synced. | Batch approval only. |
| Planner decisions · MCAT timing | Same Planning-decisions pair; AC; VR; RS/RM | **Changed + verified.** Relative sequence only; no score, retention claim, or gauge. | Shared second-pass refinement documented above. | [Open MCAT timing](http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=decay) | Synced. | Batch approval only. |
| Planner decisions · Registered term | Same Planning-decisions pair; AC; VR; RS/RM | **Changed + verified.** Registered term is factual and immovable; future plan stays editable. | Shared second-pass refinement documented above. | [Open registered term](http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=locked) | Synced. | Batch approval only. |
| Planner decisions · Substitute choice | Same Planning-decisions pair; AC; VR; RS/RM | **Changed + verified.** Alternatives name what clears and what remains before placement. | Shared second-pass refinement documented above. | [Open substitute choice](http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=substitute) | Synced. | Batch approval only. |
| Planner decisions · Advisor export | Same Planning-decisions pair; AC; VR; RS/RM | **Changed + verified.** Snapshot lists sources, assumptions, and non-official boundary. | Shared second-pass refinement documented above. | [Open advisor export](http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=export) | Synced. | Batch approval only. |
| Planning cold start · One fact first | `S/academics-planning-cold-start.{html,md}`; `M/academics-planning-cold-start.{html,md}`; AC; VR; RS/RM | **Changed + verified.** Quiet three-term scaffold asks for one durable fact; no fake plan or metric. | Shared second-pass refinement documented above. | [Open cold start](http://localhost:8765/variant-lab.html?page=academics-planning-cold-start&variant=A) | Missing mirrors added; synced. | Batch approval only. |
| Grade decisions · Returned work | `S/academics-grade-decisions.{html,md}`; `M/academics-grade-decisions.{html,md}`; AD; VR; RS/RM | **Changed + verified.** Source record, deadline, and review action remain together without claiming a justified appeal. | Shared second-pass refinement documented above. | [Open returned work](http://localhost:8765/variant-lab.html?page=academics-grade-decisions&variant=A&view=regrade) | Missing mirrors added; synced. | Batch approval only. |
| Grade decisions · Policy applied | Same Grade-decisions pair; AD; VR; RS/RM | **Changed + verified.** Applied rules and missing-curve boundary stay inspectable. | Shared second-pass refinement documented above. | [Open policy applied](http://localhost:8765/variant-lab.html?page=academics-grade-decisions&variant=A&view=policy) | Synced. | Batch approval only. |
| Grade decisions · Missing inputs | Same Grade-decisions pair; AD; VR; RS/RM | **Changed + verified.** One missing fact keeps result dormant with one recovery path. | Shared second-pass refinement documented above. | [Open missing inputs](http://localhost:8765/variant-lab.html?page=academics-grade-decisions&variant=A&view=incomplete) | Synced. | Batch approval only. |
| Grade decisions · Mistake evidence | Same Grade-decisions pair; AD; VR; RS/RM | **Changed + verified.** Student-marked causes route to different actions; evidence limits remain. | Shared second-pass refinement documented above. | [Open mistake evidence](http://localhost:8765/variant-lab.html?page=academics-grade-decisions&variant=A&view=mistakes) | Synced. | Batch approval only. |
| Term rollover · Ritual | `S/academics-term-rollover.{html,md}`; `M/academics-term-rollover.{html,md}`; AC/AD; VR; RS/RM | **Changed + verified.** Course archive stays separate from three reversible topic fates. | Shared second-pass refinement documented above. | [Open rollover ritual](http://localhost:8765/variant-lab.html?page=academics-term-rollover&variant=A&view=ritual) | Missing mirrors added; synced. | Batch approval only. |
| Term rollover · Paused | Same Term-rollover pair; AC/AD; VR; RS/RM | **Changed + verified.** Reversible bulk exit is spacious and non-celebratory. | Shared second-pass refinement documented above. | [Open paused rollover](http://localhost:8765/variant-lab.html?page=academics-term-rollover&variant=A&view=paused) | Synced. | Batch approval only. |
| Term rollover · January re-offer | Same Term-rollover pair; AC/AD; VR; RS/RM | **Changed + verified.** One low-pressure re-offer resumes nothing automatically. | Shared second-pass refinement documented above. | [Open January re-offer](http://localhost:8765/variant-lab.html?page=academics-term-rollover&variant=A&view=january) | Synced. | Batch approval only. |
| Term retrospective · A / Term report | `S/academics-term-retrospective.{html,md}`; `M/academics-term-retrospective.{html,md}`; AD and `01-academics.md` §6.10-C; VR; RS/RM | **Changed + verified.** Narrow report uses counts/named records, never correlations; limit stays last. | Decision record demoted to PROPOSED review candidate. | [Open term report A](http://localhost:8765/variant-lab.html?page=academics-term-retrospective&variant=A) | Missing mirrors added; synced. | Andy: approve A as default report composition. |
| Term retrospective · B / Sectioned review | Same Term-retrospective pair; AD and §6.10-C; VR; RS/RM | **Changed + verified.** Now renders authored state instead of a blank canvas. | Added Variant B → `sections` routing. | [Open sectioned review B](http://localhost:8765/variant-lab.html?page=academics-term-retrospective&variant=B) | Synced. | Comparison record only. |
| Term retrospective · C / Too little to say | Same Term-retrospective pair; AD and §6.10-C; VR; RS/RM | **Changed + verified.** Thin-evidence state renders instead of repeating A. | Added Variant C → `thin` routing. | [Open thin-history state C](http://localhost:8765/variant-lab.html?page=academics-term-retrospective&variant=C) | Synced. | Required state proof within A. |
| Forecast accuracy · A / Plain-language ledger | `S/academics-forecast-accuracy.{html,md}`; `M/academics-forecast-accuracy.{html,md}`; AD and `01-academics.md` §6.12; VR; RS/RM | **Changed + verified.** Default accountability ledger remains a claim about the app, with samples. | Corrected RS from APPROVED to PROPOSED so review gate is honest. | [Open forecast ledger A](http://localhost:8765/variant-lab.html?page=academics-forecast-accuracy&variant=A) | Missing mirrors added; registry status matches. | Andy: approve A as default or request revision. |
| Forecast accuracy · B / Prediction table | Same Forecast pair; AD and §6.12; VR; RS/RM | **Changed + verified.** Resolved calls render instead of repeating A. | Added Variant B → `table` routing. | [Open prediction table B](http://localhost:8765/variant-lab.html?page=academics-forecast-accuracy&variant=B) | Synced. | Contextual detail only. |
| Forecast accuracy · C / Below the gate | Same Forecast pair; AD and §6.12; VR; RS/RM | **Changed + verified.** Suppressed state renders instead of repeating A; no unreliable number. | Added Variant C → `suppressed` routing. | [Open below-gate state C](http://localhost:8765/variant-lab.html?page=academics-forecast-accuracy&variant=C) | Synced. | Required state proof within A. |
| Legacy Requirements audit · retired | `S/academics-requirements.{html,md}`; `M/academics-requirements.{html,md}`; AE; VR; RS/RM | **Superseded.** Historical numeric gap/pace treatment no longer competes with Planner. | Added explicit superseded copy and Planner requirement-map pointer. | No current Lab registry URL; [open historical source](http://localhost:8765/01-academics/academics-requirements.html) | Synced. | Keep as history or delete in separately authorized cleanup. |
| Legacy Tar Heel Tracker · retired registry artifact | `S/academics-tar-heel-tracker.{html,md}`; `M/academics-tar-heel-tracker.{html,md}`; AE; VR; RS/RM | **Superseded.** Legacy numeric audit is visibly retired. | Registry entry renamed `Requirements audit · retired`, assigned legacy status, and pointed to dossier. | [Open retired artifact](http://localhost:8765/variant-lab.html?page=requirements-legacy&variant=A) | Synced. | Same separately authorized cleanup choice. |

## Concrete before/after defects closed

1. **Transcript views:** before, all three hid the Academics banner and Planning navigation; after, all retain the Ledger/GPA/What-if parent shell.
2. **Term retrospective:** before, B was blank and C repeated A; after, B shows the sectioned review and C the honest thin-history state.
3. **Forecast accuracy:** before, B and C repeated A; after, B shows resolved calls and C total suppression below the evidence gate.
4. **Mirror drift:** before, several Planning HTML/MD mirrors were missing, Grades exposed only three of six views in RM, and forecast status disagreed; after, the requested inventory and registrations are synchronized.
5. **Grades responsive canvas:** before, all six views forced a 1400px page and only appeared narrow because the Lab scaled them down; after, the outer canvas is fluid and all six direct views report zero page-level horizontal overflow.
6. **Flat visual hierarchy:** before, several decision/state pages used uniform brown panels and stale page titles; after, solid surface layers, semantic accents, compact evidence rows, and the shared Academics parent banner create the intended hierarchy.

## Andy review status by page

Nothing below is self-approved. Each current page is ready for one of three
responses from Andy: **approve**, **deny**, or **comment needed**.

| Page | Current review status | Decision requested |
|---|---|---|
| Planner | **Comment needed** | Approve/deny/revise Variant A plus the on-demand selected-course inspector. |
| Planner requirement map | **Comment needed** | Approve/deny/revise the integrated source-bearing requirement drawer. |
| Grades & Archive | **Comment needed** | Approve/deny/revise the six-view record, GPA, what-if, transcript, and export family. |
| Planner decision states | **Comment needed** | Approve/deny/revise the six contextual decision states as one family. |
| Planning cold start | **Comment needed** | Approve/deny/revise the one-durable-fact empty state. |
| Grade decisions | **Comment needed** | Approve/deny/revise the four evidence-first decision states. |
| Term rollover | **Comment needed** | Approve/deny/revise the ritual, paused, and January re-offer states. |
| Term retrospective | **Comment needed** | Approve/deny/revise A as the current composition; B/C remain comparison/state evidence. |
| Forecast accuracy | **Comment needed** | Approve/deny/revise A as default, B as contextual detail, and C as the below-gate state. |
| Legacy Requirements / tracker | **Superseded** | No design approval requested; deletion requires separately authorized cleanup. |

## Review gate

The batch remains **PROPOSED**. The material integrated decision for later
implementation is to approve or revise **Planner Variant A**, including its
requirement map, catalog browser, and on-demand selected-course inspector.

All other rows need ordinary approve/revise feedback, not a new product ruling. No implementation brief or app work should begin until Andy explicitly approves this batch.
