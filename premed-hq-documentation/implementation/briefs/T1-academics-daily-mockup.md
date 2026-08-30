# T1 — Academics Daily / Class Center mockup completion

**Stage:** A — ruled Daily features are not fully drawn  
**Build authority:** Daily rows in `BUILD-MANIFEST.md` are `YES`, but this
brief is mockup-only and authorizes no app implementation  
**Product authority:** `premed-hq-documentation/tabs/01-academics.md`  
**Visual authority:** approved Variant A Daily mockups plus
`specifications/mockups/_shared/_visual-recipes.md`

## 1. Fidelity audit

### Spec → paper

The registered Daily batch completely covers its current 70 exposed views, and
each active HTML/Markdown source matches its documentation mirror. That is not
the same as covering every ruled feature in the Academics spec. The following
ruled experiences have no complete, addressable mockup surface:

1. **Class Center Contacts** (`01-academics.md` §4.0-e and acceptance): the
   spec requires the current-term shared `Person` panel, but the approved Daily
   page has no Contacts panel. A class-level office-hours link is not the
   cross-class Contacts surface.
2. **Class record Center Peek** (`§4.1-I`, §7, acceptance): the card rest and
   full Class Hub are drawn, but the lean preview and its Expand/Split handoff
   are not. Text saying “center peek” is not a drawn record state.
3. **First-run how-to-study walkthrough and the revisitable guide** (`§4.1-F`,
   §6.1 #74, acceptance): the banner button is drawn, but the roughly four-step
   mascot walkthrough and the actual always-open guide content are not.
4. **Recall versus Focus session purpose** (`§4.1-J`): Recall is drawn; Focus
   start, timer-only running state, and Focus summary are not.
5. **Session preferences, Pomodoro, and break** (`§4.1-J`): the Settings
   control exists in the start drawing, but its settings state, break state,
   and the return-to-session state do not.
6. **Review summary as a routed view:** a summary scene exists in the source
   HTML, but the Lab registry and source router expose only `start`, `recall`,
   `gap-report`, and the three concept-canvas views. The summary cannot be
   reviewed as its own Variant-A canvas.
7. **Pretest and Predict interaction/result states** (`§4.1-K`, §6.6): Class
   Plan names the actions, but the one-time teaching note, answer/guess capture,
   no-performance-score boundary, and post-lecture resurfacing are not drawn.
8. **Daily loading, scoped error, and reload recovery** (`§7a`, §9): the
   zero-class cold start is drawn, but Class Center, Assignments, Class Hub,
   Review, and Exam Prep do not have addressable loading/error/retry states.
9. **Populated-host empty states for no Topics and no Assignments:** the
   approved cold-start record explicitly defers these, while the spec requires
   honest dormant/recovery behavior inside the real Class Hub and global
   Assignments host.

Because item 1 also conflicts with the currently approved Class Center canvas,
the spec wins for this brief. The new drawing must find a calm bento placement;
it must not silently remove the ruled Contacts surface or restore a generic
card wall.

#### Authority drift — do not silently implement

- The current §4.1-I and approved Class Hub record the settled
  **student-supplied transcript-first** workflow. The later §4.1-Q acceptance
  text still describes a one-tap audio recorder, on-device transcription, and
  whole-transcript analysis. Do not add recording/audio canvases in this brief.
  Andy must explicitly revive that separate recording capability before it can
  override the approved transcript-first flow.
- Acceptance rows near the end of `01-academics.md` still call the fifth Class
  Hub tab `Notes`, and an older class-type row says the third tab changes by
  type. Those sentences are stale against §4.1-I and the approved five-tab
  `Overview · Materials · Topics · Assignments · Guide` IA. Preserve Guide and
  the Materials/Guide boundary; reconcile the stale acceptance wording in a
  documentation-only pass rather than treating it as a new product decision.

### Mockup → app

| Product family | Current app | Match status |
|---|---|---|
| Class Center | Built: populated and zero-class states, class cards, Contacts, record peek, add-class and syllabus paths exist. | **Partial.** The dark surface ladder matches, but the approved card geometry does not: `.cc` requires `min-height:238px`; the live first card rendered `300×183px`. Contacts and the peek cannot be judged against a drawing because they are undrawn. |
| Assignments | Built: Agenda/Weekly/Calendar, filters, add/edit/complete paths and URL-backed views exist in the dirty root. | **Unverified visually in this audit.** Later interaction work must preserve the approved weekday-emphasis week and six-row month. |
| Class Hub | Built: five tabs, lecture journal/capture, Materials, syllabus-led Topics, class-scoped Assignments, Guide/Course lens, Class Plan and Forgetting Curve exist. | **Partial.** Live interaction audit found generic saved-lecture destinations instead of transcript/evidence/study-work destinations; this is a later behavior brief, not Stage A work. |
| Review Session | Built: Recall, Focus purpose, timer/preferences, concept input, break and summaries exist. | **Cannot fully match.** Focus/settings/break have no approved canvases; the existing summary is not addressable in Lab. |
| Syllabus/add class/types | Built: upload or paste, local parsing, review-before-save, manual fallback and exactly three class types. | Existing approved views cover the principal journey; visual and click-through proof remains later-stage work. |
| Materials/generation | Built across local intake, reader, folder, selected-source artifacts, unavailable states and watched-note scaffolding. | Existing mockups are extensive; later behavior audit must verify local reopen/extraction and every routed result. |
| Exam Prep | Built: pace, catch-up, capacity, full-mock runner and autopsy paths exist. | Existing approved views cover the ruled family; visual, persistence and integration proof remains later-stage work. |

#### Required live measurement — primary class record

Measured at `127.0.0.1:5180`, 1422×800. This is a baseline, not proof of
conformance.

| Surface | Approved mockup value | Running app value |
|---|---|---|
| Class Center page rung | `#211e1a` | `#211e1a` dark · `#f7efe1` paper |
| `Your classes` panel | `#2b2722`; `#3c352d` border; 16px radius; `0 10px 26px -14px rgba(0,0,0,.55)` | `#2b2722`; `#3c352d`; 16px; same shadow dark · `#fffaf0`; `#e9e2d5`; 16px paper |
| First class card | `#322e28`; `#3c352d`; 13px; **238px minimum height** | `#322e28`; `#3c352d`; 13px; **300×183px** dark · `#efe6d4`; `#e9e2d5`; 13px paper |

The color/radius ladder is correctly stepped in the current Class Center. Its
record density/height is not a literal match. That fidelity issue is recorded
for the later Stage E pass and must not be mixed into this mockup brief.

### Already built — do not rebuild

Preserve the current unified data model, record-free personal first-use
factory, demo-only fixtures, URL-based Academics mode/tab state, local syllabus
parser and review-before-save flow, exactly-three class types, lecture-first
Class Hub, syllabus-led Topics, Materials-versus-Guide boundary, class-scoped
assignment handoff, local material records, Review engine, FSRS review state,
Exam Prep engine, topic linking, learning signals, Course lens and generated
artifact provenance. These exist in the shared dirty root and must be audited,
not replaced from an old branch or static mockup.

The prior `T1-academics-daily-gap-closure-57.md` Stage-F claim is superseded by
this fresh audit: Stage F cannot be reached while Stage A surfaces are missing.
No commit hash currently proves the complete Daily target, so no historical
commit is cited as completion evidence.

### Gate

All active Daily/Class Center mockup rows consulted in `BUILD-MANIFEST.md` are
`YES`. This clears later implementation after the mockup stage is drawn,
decided, and re-audited. It does not authorize skipping Stage A.

### Decision-file audit

Every current active Daily decision record inspected includes appearance rules
and its HTML/MD pair matches the documentation mirror:

- `academics-daily-main-page`
- `academics-assignments`
- `academics-empty-states-prototype`
- `academics-class-hub`
- `academics-review-session`
- `academics-exam-prep-mode`
- `academics-syllabus-import`
- `academics-syllabus-structure-share`
- `academics-class-types`
- `academics-class-type-selection`
- `academics-materials-extensions`
- `academics-learning-signals`
- `academics-topic-linking`

The retired standalone `academics-study-method` and
`academics-forgetting-curve` records also contain appearance rules and remain
reference-only; they must not be restored as registry tabs.

### Integrations and services

| Dependency | Classification | What the student sees today | Later Andy checklist |
|---|---|---|---|
| Grounded study/gap-report generation | **Code built and configured; runtime proof missing** | Local deterministic flows and honest unavailable/recovery states remain; cloud generation cannot be called working from deployment metadata alone. | The root has nonempty Supabase browser settings, active `study-tools` version 5, and provider-key names configured. Sign into a disposable profile, run a real selected-source request, open every citation, reload the artifact, and retain request evidence. |
| Lecture analysis | **Code built, not configured** | Transcript-first local records still work; no deployed `lecture-analysis` function is present, so remote lecture analysis must remain unavailable. | Deploy `lecture-analysis`, confirm its provider key/model configuration, then prove a complete student-supplied transcript is analyzed with source traces and no invented Topic picker. |
| Google Drive watched-note folder | **Code built, not configured** | The app can explain/setup the one-way provider path; no deployed `google-drive-materials` function or live folder connection is proved. | Deploy `google-drive-materials`; set `GOOGLE_DRIVE_CLIENT_ID` and `GOOGLE_DRIVE_CLIENT_SECRET`; confirm the redirect URL; connect a disposable folder; prove import/reload and no write-back. |
| Shared syllabus structure | **Code built and configured; runtime proof missing** | Private local import remains the normal path; a live cross-user share is not proved. | The root has nonempty Supabase browser settings and active `shared-syllabus` version 3. Prove an allow-listed structure-only payload, anonymous opt-in, review-before-apply, persistence, and no source-document join with two disposable users. |
| PDF/DOCX/image/text syllabus intake | **Code built, no external service required for the principal local path** | Upload/paste/manual review works locally; unsupported or unreadable input routes to retained manual recovery. | No account step; later click-through must prove every accepted format and reload. |
| Wispr Flow / OS dictation directory | **No integration required** | Official links are optional guidance; native typing, image, canvas, and system dictation remain available. | No credential or provider dependency. |

## 2. References

- `CONTEXT.md`
- `premed-hq-documentation/AGENT-IMPLEMENTATION-GUIDE.md`
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`
- `premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md`
- `premed-hq-documentation/tabs/01-academics.md` §4.0-e, §4.1-F,
  §4.1-I, §4.1-J, §4.1-K, §6.6, §7, §7a, §9, §13
- `premed-hq-documentation/implementation/component-inventory.md`
- `premed-hq-documentation/specifications/01-shared-interface-patterns.md`
  §2–4f and empty/loading/error patterns
- `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`
- `mockup-lab/VARIANT-LAB.md`
- The active Daily HTML/MD pairs and their exact documentation mirrors listed
  in the decision-file audit above

## 3. The work — Stage A only

Draw one coherent extension of the existing approved Variant A family. Do not
alter `src/` in this stage.

1. Add addressable Class Center views for the shared Contacts bento and the
   class-card Center Peek, including Expand and Split destinations without
   duplicating the full Class Hub.
2. Add addressable `How to study` guide and first-run walkthrough canvases. The
   walkthrough is roughly four real-UI spotlight steps, mascot-narrated,
   skippable, replayable, keyboard/reduced-motion safe, and viable on an empty
   workspace. It is not an essay or a new tab.
3. Extend Review Session with addressable Summary, Focus start, Focus running,
   Focus summary, Settings/Pomodoro, Break, and resume states. Focus remains
   timer-only and writes no grade, FSRS result, or gap report.
4. Draw Pretest and Predict capture/resurface states in the existing Class Plan
   / Materials context. No score, readiness change, weak flag, or FSRS write may
   appear. One teaching `MascotNote` is allowed per unfamiliar mechanism.
5. Add populated-host empty states for no Topics and no Assignments, plus the
   minimum loading, scoped-error, retry, and reload-recovery canvases needed to
   cover Class Center, Assignments, Class Hub, Review and Exam Prep without a
   generic dashboard wall.
6. Register every new product view as `proposed`. Do not mark it approved or
   built. Keep source and documentation mirrors byte-identical.
7. Update the exhaustive Daily review ledger with one row per new view and
   direct Lab URL. Do not rewrite or disturb Planning rows or status.

### Variants worth drawing

- **Contacts placement:** A — compact Class Center bento supporting panel; B —
  quiet current-term rail below the class collection. Do not try a floating
  people dashboard or put contacts into the banner stat strip.
- **Center Peek:** A — lean record summary with Expand/Split footer; B —
  selected-card growth preserving the card's accent. Both must remain a record
  preview, not a duplicate Class Hub.
- **Walkthrough:** A — spotlighted live shell with a compact stepper; B —
  anchored teaching popover that advances across the same shell. No full-page
  onboarding carousel.
- **Focus session:** reuse the scenic Review shell and test only purpose
  selection/quiet timer hierarchy; do not invent a second study aesthetic.

## 4. Do not break

- Lecture-first Class Hub Overview remains transcript → optional evidence →
  selected-source study work; no normal Topic picker.
- Topics remain syllabus standards/objectives, sorted primarily by syllabus
  week. Schedules provide chronology only.
- Guide is course operational intelligence; material notes stay in Materials.
- Class Assignments reuse the global execution model filtered to the class,
  with grade/what-if supporting below. Global Assignments remains cross-class.
- `Class Plan` stays integrated in Class Hub; Forgetting Curve stays the single
  full bottom panel. Neither returns as a tab.
- The real first-use store remains record-free; demo facts stay demo-only.
- No U-9 score/composite/ranking/progress verdict, no U-10 silent inference,
  and no U-12 Canvas-sync surface.
- Glass is limited to the banner/mode/stat elements that pass the glass test.
  Dense content and entry surfaces are solid-with-depth.
- Preserve all existing dirty work and every Planning-owned file.

## 5. Done when

- Every item in Spec → paper has a distinct addressable Variant-A candidate,
  not merely a comment, button label, or prose description.
- Each new source has a same-name decision record with Behaviour, Appearance,
  responsive, empty/error and interaction-state rules.
- `cmp` reports exact source/mirror equality for every changed HTML and MD.
- Registry source and mirror contain the same new view slugs, each `proposed`;
  neither contains `built` for this work.
- All new Lab URLs resolve to the intended nonblank view at the real review
  viewport and narrow width, with no clipping, leaked lab labels or hidden
  controls.
- Grep proves no Planning file and no `src/` file changed in this stage.
- The updated exhaustive review ledger accounts for every new view and leaves
  explicit approve/deny/comment status for Andy.

## 6. Commit

Commit only the Stage-A Daily mockup, decision, mirror, registry, and review
ledger files; commit unrelated dirty work separately.

## 7. Exact files this brief may touch

- `mockup-lab/01-academics/academics-daily-main-page.html`
- `mockup-lab/01-academics/academics-daily-main-page.md`
- `mockup-lab/01-academics/academics-review-session.html`
- `mockup-lab/01-academics/academics-review-session.md`
- `mockup-lab/01-academics/academics-empty-states-prototype.html`
- `mockup-lab/01-academics/academics-empty-states-prototype.md`
- `mockup-lab/01-academics/academics-class-hub.html`
- `mockup-lab/01-academics/academics-class-hub.md`
- The eight exact documentation-mirror files under
  `premed-hq-documentation/specifications/mockups/01-academics/`
- `mockup-lab/variant-lab.html`
- `premed-hq-documentation/specifications/mockups/variant-lab.html`
- `mockup-lab/01-academics/DAILY-CLASS-CENTER-VARIANT-A-EXHAUSTIVE-REVIEW-2026-08-26.md`
- `premed-hq-documentation/specifications/mockups/01-academics/DAILY-CLASS-CENTER-VARIANT-A-EXHAUSTIVE-REVIEW-2026-08-26.md`

No app, store, test, backend, Planning, flashcard, or output file is authorized
by this brief.

## 8. Next stage — not in scope

Re-run `TAB-BRIEF-PROMPT.md` after Andy approves or denies the new canvases.
The likely next gate is **B — decisions** for any newly drawn view, followed by
the first remaining C/D/E stage. Known later-stage defects already recorded but
explicitly excluded here are:

- saved-lecture CTAs route generically instead of opening transcript,
  supporting-evidence, or study-work state;
- the paste-screenshot role-button lacks Enter/Space activation;
- Course lens Cancel does not collapse when no lens exists;
- every clickable/reload/persistence path and both-theme visual match still
  need proof.

Do not repair those while executing this Stage-A brief.
