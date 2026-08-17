# T1 · Academics — mockup coverage gaps

**Stage:** A · NOT DRAWN
**Scope:** Academics only: Daily and Planning. This is a drawing brief. It does
not authorize `src/`, store, service, or manifest changes.

## 1. Fidelity audit — completed before this brief

### a. Spec → paper

The existing mockups cover the primary Daily flow (Class Center, Assignments,
Class Hub, active-recall session, syllabus import, class types, and exam-prep)
and the primary Planning flow (Planner, Tar Heel Tracker, and Grades & Archive).
They do **not** yet give the following ruled work a product surface. A URL field,
a toast, or a line of explanatory copy is not a surface for an interaction.

| Ruled work with no usable paper surface | Binding source | What is absent now |
|---|---|---|
| **Canvas Path A in Academics** | `tabs/01-academics.md` §4.1-O, `implementation/integration-map.md` §0 | A course-level Calendar/Canvas connection state; read-only import preview; empty connected-course state; conflict/diff review; last-sync/error/revoke states. The Class Hub's `Import from Canvas` label and current `canvasUrl` field do not draw the required flow. |
| **Exam/resource catalog** | `01-academics.md` §4.1-P | The Materials tab has generic file rows, but no catalog entry with source/permission status, unit coverage, answer-key/timed metadata, private `unknown origin` treatment, or take/score/mistake hand-off. |
| **Lecture capture** | `01-academics.md` §4.1-Q | No record/upload → transcript → reviewed emphasis/coverage proposal path. In particular, there is no visible on-device/cloud disclosure, recording-policy notice, quote+timestamp evidence, or failure/no-audio state. The recall-response microphone is not lecture capture. |
| **Material-grounded study generation** | `01-academics.md` §§4.1-G, 6.2–6.3 | The class mockup names “Generate study guide,” but does not draw source selection, no-eligible-material state, provenance/citation review, or configured/unconfigured/error states. |
| **Term rollover ritual** | `01-academics.md` §6.10-C | No end-of-term screen for the three topic fates (retire / carry for MCAT / carry as prerequisite), default grouping, bulk actions, pause-everything, skip/re-offer, and archive boundary. |
| **MCAT-decay consequences in Planning** | `01-academics.md` §4.2-E | Neither the Planner nor the Tracker draws the required ranked-but-not-scored course-decay result, its named inputs, or the no-MCAT-date fallback. It must remain visibly distinct from tracked-topic retention bands. |
| **Planner decision and source-change states** | `01-academics.md` §4.2-C2–C3 | The Planner prototype shows a board and suggestions, but not a before/after requirement preview, double-count cap explanation, stale-catalog-plan flag, registered-term lock, saved-plan comparison, substitute choice, or advisor-export result. These are not optional implementation details; they are the planner’s decision states. |
| **Lifecycle states beyond the zero-class launchpad** | `01-academics.md` §6.10-A, §6.10-C | Daily cold start is drawn, but Planning’s honest cold state and the transition from a completed course into the longitudinal record are not. No screen may substitute zeros, a hollow chart, or invented readiness. |

**Paper conflicts to correct while drawing:**

- `academics-daily-main-page.html` still contains stale Anki-sync examples, while
  the approved decision file and §4.1 say Academics owns topic review and Anki
  is one-way export only. New drawings must follow the decision/spec, not that
  old HTML example.
- No new top-level Academics tab is allowed. Catalog and lecture-capture
  controls belong at the top of an existing class **Materials** view; exam prep
  stays a temporary mode; rollover is a bounded flow from the existing
  longitudinal surfaces.
- A readiness number, blended preparedness score, or retention percentage for
  an untracked course is forbidden. Use named inputs and rank/interval language
  where the spec permits it.

### b. Mockup → app

| Mockup | App evidence | Visual conclusion for this audit |
|---|---|---|
| Daily · Class Center | `src/components/academics/ClassCenter.tsx`; fidelity commit `9f4d3ac` | Implemented. It is not rebuilt in this Stage-A pass. Its stale Anki HTML example remains a paper correction, not a reason to fork the screen. |
| Assignments | `src/pages/Academics.tsx` plus `src/components/common/AssignmentsPanel.tsx` | Implemented as the shared assignment owner. Agenda/weekly/calendar fidelity remains a later visual check. |
| Class Hub | `src/components/academics/ClassHub.tsx`; `7ddf493` | Implemented with its five tab structure. New catalog/capture states must extend the existing Materials surface rather than create a second hub. |
| Review session | `src/pages/AcademicRecallSession.tsx`, `src/lib/academics/activeRecall.ts`; `9f9d98a` | Implemented. Its response audio capture must not be relabelled as the missing lecture-capture feature. |
| Empty states and class types | `src/components/academics/ClassCenter.tsx`; `cb963a3` | Built; do not rebuild. |
| Syllabus import | `src/components/academics/ClassCenter.tsx`, parser/re-import tests; `69a0b41`, `93bfeb8`, `1ee2c87` | Behaviour is shipped, including scoped entry and re-import. Its visual decision documentation is incomplete (see section e). |
| Exam prep | Class-scoped practice/exam code is present in `ClassCenter.tsx` | The full temporary exam-plan mode is not established as visually translated; its source is still proposed and lacks a companion decision file. |
| Planner | `src/pages/Academics.tsx` | A working planning surface exists, but the lab source is still a prototype and the ruled decision states above have no paper. |
| Tar Heel Tracker | `src/pages/Academics.tsx` | Existing audit UI is not proof of visual parity. The proposed mockup is the later fidelity target once it is approved and its data boundary is confirmed. |
| Grades & Archive | `src/pages/Academics.tsx` | Existing GPA/what-if controls do not prove parity with the proposed longitudinal ledger. Keep this for a later stage. |

### c. Already built — do not rebuild

- The approved zero-class launchpad and the three class-type configurations:
  `cb963a3` (`feat(academics): implement approved empty state and class types`).
- Syllabus ingestion, preserved local source file, scoped entry points, and
  identity-based re-import: `69a0b41`, `93bfeb8`, and `1ee2c87`.
- The existing Class Center and Class Hub structure: `9f4d3ac` and `7ddf493`.
- Active-recall scheduling/loop: `9f9d98a`.

### d. Gate

`BUILD-MANIFEST.md` clears the listed Daily and Planning mockups with **YES**,
except the legacy mode-switch and old study-hub concepts. The missing surfaces
in section a have **no manifest rows yet**. This brief draws them only; nothing
new may be implemented until its drawing is approved and Andy adds explicit
manifest permission for the resulting source files.

### e. Decision-file audit

| Existing source | Decision record | Result |
|---|---|---|
| Daily, Assignments, Class Hub, Review session, Class types, Empty states | Companion `.md` exists and records hierarchy/interaction plus enough appearance direction to preserve its treatment | Pass for a later stage. |
| Planner, Tar Heel Tracker, Grades & Archive | Companion `.md` exists and records product views, variants, hierarchy, and layout intent, but all three remain **prototype/proposed** in the lab | Not an implementation decision yet; do not promote by this brief. |
| Exam prep | No companion `.md` | Stage B work after its source is approved: record the selected treatment, hierarchy, visual states, and motion before code. |
| Syllabus import | No companion `.md` | Stage B work after the missing Stage-A drawings: write the visual decisions for upload, review, partial parse, and re-import; do not rewrite its shipped diff logic. |

### f. Integrations and services owned by Academics

| Dependency | Current classification | What a student sees today | What the eventual Academics brief must own |
|---|---|---|---|
| Google Calendar read-only connection | **Code built, configured per user only** | Schedule context appears after the student connects Google Calendar; otherwise Calendar context is absent or the honest local fallback appears. | No code in this brief. Any later exam-plan/Canvas drawing must show the no-calendar state and never claim live hours without a connection. |
| Canvas Path A (ICS → Google Calendar) | **Code missing in Academics** | A student can paste a Canvas URL/text into class setup, but there is no Canvas calendar-feed handoff, course attribution, or import review. | Later full brief: code only the low-cost read-only Path A first; no Canvas REST work. |
| Canvas Path B REST mirror | **Code missing and explicitly deferred by spec** | Not available. | Not this pass and not the next default build. It requires the Supabase proxy/token boundary, verified UNC token policy, review-before-apply/diff behavior, sanitised HTML, and revoke path. |
| Study-tools Edge Function | **Code built, configuration must be verified** | Without configured Supabase/provider secrets, generation must remain unavailable or explain why; it may not produce invented material. | Later build/fidelity pass must preserve student-supplied grounding and clickable provenance; configuration is an Andy checklist, not a client-side secret. |
| Local syllabus-file retention | **Code built, local-only** | Import/re-import can retain the student’s chosen syllabus locally. | No cloud-storage claim or cross-device file-sync implication in new drawings. |
| Lecture transcription / capture | **Code missing for the ruled lecture feature** | No lecture-capture flow exists; the recall microphone records a student response only. | Later full brief must decide/provider-map on-device default, consent/policy disclosure, local-audio boundary, and explicit cloud fallback before any service is added. |
| Anki | **No required live integration** | No scheduler sync is available or promised. | Preserve one-way export only; never depict card review or scheduling as Premed OS behavior. |

## 2. Work — Stage A only: draw the missing surfaces

Create the following **proposed** mockup sources in `mockup-lab/01-academics/`,
register each in `mockup-lab/variant-lab.html` with `status:"proposed"`, and
write a companion `.md` that records both behaviour **and appearance**. Use the
existing Academics shell, `_shared/_visual-recipes.md`, the real token system,
and the current class hub / planning visual language. Do not copy inline mockup
CSS into the app.

1. **Class Hub · Materials extensions** — one source with product views for:
   - resource catalog (empty, populated, `unknown origin` private warning, and
     timed-result hand-off);
   - Canvas Path-A handoff/review (not Path B), connected-empty, changed-item
     review, unavailable, and disconnect states;
   - material-grounded generation source selection, no-eligible-material,
     provenance result, and unavailable/error states.
   Keep the controls at the top of **Materials**; do not add a sixth class tab.

2. **Lecture capture** — one class-scoped flow beginning in Materials:
   record/upload → explicit local-processing/privacy state → transcript review
   → quote-and-timestamp evidence → proposed material links and coverage. Draw
   a no-permission/no-audio state and a no-material-match state. The output is
   descriptive, never “high yield,” scored, or predictive.

3. **Term rollover** — one bounded end-of-term ritual attached to Planning / a
   completed-course transition. Draw the pre-sorted three fates, editable bulk
   controls, `Pause everything`, skip/default outcome, and January re-offer.
   Preserve the course record in the ledger and show that carried topic state
   survives intact.

4. **Planning decision states** — extend the existing Planner source or create
   one companion state source only if it cannot remain legible in the planner:
   requirement preview before placement, mapping-confidence/double-count
   explanation, stale-catalog flag, term lock, saved-plan comparison,
   substitute choice, and advisor-export result. Include the MCAT-decay
   placement as ranked inputs, not a percentage or score.

5. **Planning cold state** — an honest, Planning-specific no-record/no-plan
   view that routes to the minimum first fact needed. It must not duplicate the
   Daily syllabus-import launchpad or fill the page with zero metrics.

### Variant discipline

- Use A/B/C only for the genuinely unresolved **Planning decision composition**:
  whole-plan board + inspector, next-term builder, and decision-first inspector
  are already the three meaningful alternatives in the Planner document.
- The Canvas, lecture capture, rollover, catalog, and cold states need named
  product states—not cosmetic variants. Draw one coherent treatment each.

## 3. References

- `premed-hq-documentation/tabs/01-academics.md` §§4, 4.1-O–Q, 4.1-R,
  4.2-C–E, 6.2–6.3, 6.8–6.10, 9, 13–14.
- `premed-hq-documentation/implementation/integration-map.md` §0.
- `premed-hq-documentation/implementation/component-inventory.md` — reuse
  existing `PageHeader`, `StatStrip`, `InteractiveCard`, `InfoTip`,
  `CenterPeek`, `RecordActionMenu`, `EmptyState`, and three-level navigation
  patterns in drawings; do not invent duplicate component jobs.
- `mockup-lab/01-academics/academics-class-hub.html` and `.md`;
  `academics-planner-prototype.html` and `.md`; `academics-tar-heel-tracker.html`
  and `.md`; `academics-grades-archive.html` and `.md`.
- `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`,
  `premed-hq-documentation/specifications/01-shared-interface-patterns.md`,
  and `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`.

## 4. Do not break

- Do not touch `src/`, the persisted store, Supabase functions, tokens, fonts,
  or the build manifest in this stage.
- Do not redraw the already-built empty state, class types, ingestion/re-import
  behavior, Class Center, Class Hub, or active-recall runner as a replacement.
- Do not expose a Canvas token in the browser, invent a browser-side Canvas
  fetch, or imply any Canvas write action.
- Do not make cloud file storage, Google Calendar, provider keys, or Anki a
  prerequisite for the normal Academics flow.
- Do not turn AI output into course truth: all generation must be visibly
  grounded in student-supplied material and preserve provenance.
- Do not add scores, composite readiness, rankings that disguise scores,
  invented data, `0%` empty progress, or a sixth Academics/class-hub tab.
- Glass only floats over banner art or an overlay; dense lists, ledgers, and
  decision surfaces remain solid-with-depth.

## 5. Done when

- Every section-1a feature has a traceable mockup button, field, state, or
  screen; a plain mention in copy does not count.
- Every new source has a `.md` that explicitly names treatment, hierarchy,
  layout, surface material, typography/alignment intent, interaction flow,
  empty/loading/error states, and its selected variant (where applicable).
- `rg -n "Canvas|lecture capture|term rollover|MCAT decay|resource catalog" mockup-lab/01-academics`
  finds a real named state for each ruled surface.
- `rg -n "score|prepared %|retention %|high-yield" mockup-lab/01-academics`
  finds no prohibited new claim in the new sources.
- `rg -n "status:\"proposed\"" mockup-lab/variant-lab.html` includes every
  new lab entry, and none is marked built or approved without Andy’s review.
- Existing Daily/Planning lab pages still load; `npm run build` remains clean
  even though this stage touches no app code.

## 6. Commit

`docs(mockups): draw remaining Academics ruled states`

Commit only the new Academics mockups, their companion decision documents, and
their registry entries. Do not sweep unrelated dirty lab, research, or brief
files into this commit.

## 7. Next stage — not in scope here

After the drawings are reviewed, approved, and explicitly added to
`BUILD-MANIFEST.md`, rerun `TAB-BRIEF-PROMPT.md` for Academics. The next
expected stop is **B · drawn, not decided** for the existing exam-prep and
syllabus-import pages (and any new surface whose companion `.md` is incomplete).
Only after that decision audit passes can an Academics full implementation or
backend/fidelity brief be written.
