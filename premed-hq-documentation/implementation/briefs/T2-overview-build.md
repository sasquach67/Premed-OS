# T2 · Overview — approved state coverage to app

**Stage:** C · **DECIDED, NOT BUILT**

This brief translates the approved Overview state sources into the existing
Overview composition. It is one visual-and-behavioural pass: no second task
system, no separate dashboard, and no work on a different tab.

> **Calendar boundary:** the hero's durable, server-side Google Calendar
> integration is governed by `I1-google-calendar.md`, not this tab brief. The
> current client-side read-only connector is a partial implementation. Do not
> invent a refresh-token architecture here or alter the frozen hero to paper
> over that missing integration.

---

## 1. Fidelity audit — what is already correct, and what remains

### a. Spec → paper

All ruled Overview features now have a named, reachable paper surface. No Stage
A drawing is needed.

| Ruled feature | Approved source now covering it |
|---|---|
| Task record editing, lifecycle, empty state, undo, compact cap, and expanded-list handoff | `overview-task-states.html` + `.md` |
| Where I Stand expansion, positions, attribution, estimated treatment, targetless state | `overview-status-states.html` + `.md` |
| Smart Actions dismissal/absence, conditional Quick Access, and roadmap empty | `overview-status-states.html` + `.md` |
| Quarterly goal types and no-goal/editor states | `overview-capture-goals-states.html` + `.md` |
| Text/URL/file Capture, local-only control, Story Bank confirmation, reserved Atlas slot, widget resilience, and mobile order | `overview-capture-goals-states.html` + `.md` |
| Parent bento spans, order, hero-only glass, stat-tile hierarchy, and roadmap spine | `overview-bento-control-panel.html` + `.md`; `overview-s3-target.html` + `.md` |

**Spec conflict resolved:** `03-overview.md`'s older Atlas wording is
superseded by its `SB-64` amendment and the approved decision source: v1
Capture lands in **Story Bank**. Atlas is an inert reserved connection slot,
not a live destination.

### b. Mockup → app

| Surface | App state | Fidelity finding |
|---|---|---|
| Hero | `OverviewHero.tsx` + `HeroDailySchedule.tsx` | **Built/frozen visually.** Preserve the banner and hero-only glass. Its Google Calendar connector is browser-session-only, so durable OAuth/cache work remains in `I1-google-calendar.md`. |
| Tasks | `OverviewTasks.tsx` | **Mostly built.** One list, Now/Soon/Done, Add task, expand route, edit fields, visible context-menu equivalents, Undo, compact cap, and reduced motion exist. Verify rather than rebuild. Timeline-owned step projection still needs proof before claiming it works. |
| Smart Actions | `SmartActionPanel.tsx` | **Mostly built.** Deterministic reasons, cap, dismissal suppression, last-card unmount, motion, and reduced motion exist. Match the approved solid-card density and remove any visual claim that turns a count into a score. |
| Where I Stand | `OverviewStatus.tsx` | **Divergent.** It is a flat linked list. It has no one-open-row inspector, position cap, cross-pillar attribution, or explicit estimated-block presentation. |
| Quick Access | `OverviewSupport.tsx` | **Partial.** MCAT/review entries are conditional, but Log hours always renders and the Capture launcher only scrolls to text capture. It does not meet the approved “only what exists” rule for each launcher. |
| Quarterly Goals | `OverviewSupport.tsx` | **Partial.** Check-off and standing target links persist, but the current editor only edits standing targets. It cannot create/edit/archive the quarterly-goal records or make the student confirm check-off versus measured type. |
| Recent activity + Capture | `OverviewSupport.tsx` | **Partial.** Text capture reaches Story Bank and local-only persists. URL/file entry, success treatment, reserved Atlas slot, and independent loading/error states are absent. |
| Roadmap | `OverviewRoadmap.tsx` | **Partial.** It has the horizontal record-driven spine, current node, empty state, and reduced motion. Confirm it reads Timeline-owned milestone records rather than a second Overview task model; do not build generic milestones. |
| Temporary advisor panel | `Home.tsx` | **Removed** in `d7811d7`; it is not an Overview block and must not return. Its data remains for Letters. |

### c. Already built — do not rebuild

- Bento shell, primary block order, solid-with-depth panels, and the
  record-driven roadmap foundation: `f75be18`.
- Overview ownership and Story Bank text capture: `33cc995`.
- Task header, no-inline-quick-add rule, and no targetless domain bar:
  `e889582`.
- Task detail/CenterPeek work and current Overview conformance shipped before
  this brief; audit it in place rather than fork it.
- The temporary advisor panel was removed from the composition: `d7811d7`.
- `OverviewHero.tsx`, `HeroDailySchedule.tsx`, `Sidebar.tsx`, and
  `AppShell.tsx` are frozen approved work. No modification in this brief.

### d. Gate

`BUILD-MANIFEST.md` clears `overview-bento-control-panel.html`,
`overview-s3-target.html`, and `overview-where-i-stand-expandable.html` as
**YES**. The three approved state boards are state coverage for those cleared
sources; they do not create a new, ungated tab. `sauce-two-doors.html` is NO
and is out of scope.

### e. Decisions files

The current approved sources all record both behaviour and appearance:

- `overview-bento-control-panel.md` — bento hierarchy and updated task/goal
  treatment.
- `overview-s3-target.md` — compact Task header and targetless-bar rule.
- `overview-task-states.md` — one list/two sizes, solid row density, peek
  relationship, and empty state.
- `overview-status-states.md` — 7/5 bento density, nested expansion, absent
  Smart Actions, conditional launchers, and no-bar rule.
- `overview-capture-goals-states.md` — Story Bank destination, capture
  hierarchy, confirmed goal vocabulary, resilience, and mobile order.

The older standalone `overview-where-i-stand-expandable.html` has no companion
decision file, but its app-facing treatment is superseded by the approved
`overview-status-states.md`. Do not use the standalone source as a competing
implementation target.

**Stage result:** A passes (every ruled feature is drawn), B passes (approved
appearance and behaviour are recorded), and C is the first failing stage:
the approved Overview is only partially translated and its missing UI and data
paths must land together.

---

## 2. References

| What | Where |
|---|---|
| Product law | `specifications/03-overview.md` §0, §5–§11, §13, SB-64 |
| Main bento source + decision | `specifications/mockups/03-overview/overview-bento-control-panel.html` + `.md` |
| Task refinement + decision | `…/overview-s3-target.html` + `.md` |
| Approved task state source | `…/overview-task-states.html` + `.md` |
| Approved status/absence source | `…/overview-status-states.html` + `.md` |
| Approved Capture/Goals source | `…/overview-capture-goals-states.html` + `.md` |
| Earlier Where I Stand reference | `…/overview-where-i-stand-expandable.html` — read only as historical detail; state board wins |
| Exact visual recipes | `specifications/mockups/_shared/_visual-recipes.md` |
| Translation contract | `implementation/MOCKUP-TRANSLATION-CONTRACT.md` |
| Existing components | `implementation/component-inventory.md` |
| Shared interaction law | `specifications/01-shared-interface-patterns.md` §2–§5 |
| Universal rules | `general.md` — especially U-1, U-2, U-5, U-7, U-8, U-9, U-12 |
| Calendar integration boundary | `implementation/briefs/I1-google-calendar.md` |

---

## 3. FRONTEND — translate only the missing approved states

### A. Keep the Overview composition exact

- Preserve the eight bento blocks and their order: Hero → Smart next actions
  → Tasks / Where I Stand → stat tiles → Quick Access / Quarterly goals /
  Recent activity + Capture → roadmap.
- Do not restore Questions for advisors, sourced guidance, QOTD, a Needs
  Attention strip, a Focus strip, or an inline quick-add row.
- Hero cards and the existing record/context overlay remain the only glass
  surfaces. Every dense widget, row, pill, and form is solid-with-depth.
- Use the signed-in tokens and typography from `_visual-recipes.md` literally:
  Baloo 2 for hierarchy/numbers/controls, Nunito for body, and the existing
  signed-in blue (`--primary` / `#6fb3de`), not public `#5293cc`.

### B. Where I Stand becomes the approved in-place inspector

- Reuse the existing `WhereIStand` component; do not create a second status
  dashboard or a standalone page.
- A row body opens its owner route. Its chevron independently expands **one
  row at a time** in place.
- The open panel shows only supportable real records: positions/roles, their
  active/ended/estimated state, domain-owned route, and a capped `+N more →`
  owner handoff. Attribution can link to an existing owning organization only
  when the relationship is stored.
- A targetless domain renders its accent, label, real value, and neutral
  `no goal`/record-facts chip — **no `Progress` element at all.**
- Existing aggregate experience hours are not dated logs. Do not fabricate a
  pace, week series, position allocation, or “estimated block” from them.
  If an honest position detail cannot be sourced from the current model, keep
  that part dormant with its reason (U-5). The hour-log model is separate work.

### C. Quick Access and Smart Actions stay conditional and quiet

- Keep `SmartActionPanel` as the one shared implementation. Preserve its
  deterministic explain-line, suppression, cap of three, last-dismissed
  unmount, keyboard actions, and reduced-motion behaviour.
- Make every Quick Access launcher conditional on a real target. Do not show
  a blank “Log hours” destination merely to fill the panel. Capture remains
  valid because it is always a real action.
- Use a visible control for every right-click/context-menu action; no
  undiscoverable-only action is added.

### D. Quarterly Goals are editable records, not inferred progress

- Reuse the `quarterlyGoals` collection and `CenterPeek`; do not introduce a
  second goal store.
- Add/create/edit/archive a quarterly goal from its existing panel. The form
  requires the student to select **Check-off** or **Measured**; never infer
  type from wording.
- Measured goals can name an existing, attributable standing target and show
  only recorded value plus a student-set target. Check-off goals remain a
  checkbox with Open/Completed copy. Neither gets a normalized percentage or
  bar.
- Preserve the no-goal `MascotNote` and the target editor, but distinguish
  editing the current quarter’s goal from editing standing targets.

### E. Capture is Story Bank-first and resilient

- Retain one Capture surface in `ActivityAndCapture`; do not add an Atlas page
  or triage controls to Home.
- Render text, pasted URL, and file-affordance inputs as the approved compact
  solid composition, with per-entry local-only choice and short successful-save
  confirmation linking to Story Bank.
- Atlas is a labelled, disabled/reserved connection slot only. It must not
  navigate anywhere in v1.
- Loading and failure belong to their individual widget. Use skeleton lines,
  a restrained error rule, and local retry; never blank Home or show a
  full-page spinner. On mobile, keep Capture in normal flow high enough to be
  reachable, never a floating control.

**File attachment boundary requiring verification before implementation:** the
current `CaptureRecord` stores only metadata and `StoryEntry` has no attachment
payload/reference. Do not pretend a selected file was saved. Reuse an existing
local file mechanism if one exists; otherwise show the file affordance only as
an honest unavailable state and record the missing storage decision before
claiming this brief complete. No file bytes may be sent to a provider.

### F. Roadmap remains a Timeline projection

- Preserve the horizontal record-driven spine, current-node treatment, empty
  state, owner route, and reduced-motion alternative.
- It may read Timeline-owned milestones only. Do not create generic default
  dates, a second Overview roadmap model, a priority score, or a completion
  percentage presented as an evaluation.

---

## 4. BACKEND — only the missing Overview data paths

### Quarterly goals

- The existing `QuarterlyGoal` shape supports `quarter`, `text`, `done`, and
  optional `standingTarget`. Add only an explicit goal-kind field if the
  existing fields cannot distinguish check-off from measured goals without
  inference.
- If a field is added, create a new versioned, lossless migration. Existing
  records become `check-off` unless they already carry `standingTarget`, in
  which case they become `measured`; preserve every other byte. Test frozen
  legacy input and a second run no-op.
- Existing `quarterlyGoals` APIs, backup/export, trash, and generic CRUD must
  preserve the new field. A goal archive is recoverable; it is never silently
  deleted.

### Capture

- Text capture already creates a local `StoryEntry`; preserve that direct
  Story Bank destination and `localOnly` semantics.
- URL metadata must be retained losslessly with the resulting Story Bank
  record or a stable linked capture record. Do not put a URL in unstructured
  text and call it structured capture.
- File persistence is explicitly contingent on the verified local mechanism
  above. No remote upload, no API key, no AI classification, and no Atlas
  triage is authorized by this brief.

### Calendar and hour logs — do not smuggle them in

- Do not persist OAuth refresh tokens, change Google scopes, add a background
  sync job, or change the frozen hero. That is I1.
- Do not add dated hour logs, derive weekly pace, or migrate aggregate hours.
  That requires the separate hour-log model ruling.

---

## 5. Do not break

- No edits to `OverviewHero.tsx`, `HeroDailySchedule.tsx`, `Sidebar.tsx`, or
  `AppShell.tsx`.
- No `TemporaryAdvisingGuidance` mount on Home; do not delete `advisingQs` or
  `tips` collections.
- No visual or semantic score, readiness composite, ranking, comparison,
  inferred percentage, or bar without a student-set target (U-5/U-9).
- No invented experience allocation, schedule, target, event, timeline date,
  or recommendation (U-5/U-7/U-8).
- No duplicate components: reuse `CenterPeek`, `SmartActionPanel`,
  `MascotNote`, `Card`, `Progress` where permitted, `useToast`, and the one
  Zustand store.
- Preserve keyboard-only flows, tooltips, focus return from peeks, mobile
  sheets, dark/light themes, and `prefers-reduced-motion`.
- Do not alter `localStorage` shape without the versioned lossless migration
  and tests described above.

---

## 6. Done when

### Fidelity

- [ ] Home has exactly the approved eight blocks; grep confirms no mounted
  `TemporaryAdvisingGuidance`, `Needs attention`, `QOTD`, or task quick-add.
- [ ] Where I Stand has a one-open-row inspector and a real owner handoff;
  targetless rows render no progress element.
- [ ] Smart Actions unmounts completely after the final dismissal; every
  launcher has a real, visible destination/action.
- [ ] Quarterly goal create/edit/archive and both goal kinds match the
  approved row density and CenterPeek composition.
- [ ] Capture visibly accepts text/URL and handles file storage honestly;
  success lands in Story Bank; Atlas remains non-navigable/reserved.
- [ ] Empty/loading/error states are widget-local; Home never blanks because
  one selector fails. Mobile order keeps Capture in normal flow.
- [ ] Roadmap empty state uses the Timeline setup route and no generic dates.
- [ ] Dark and light visual checks match the approved solid-card hierarchy;
  glass is confined to hero/overlays.

### Data and safety

- [ ] `rg -n "[0-9]+%|readiness|score" src/components/overview` is reviewed:
  no rendered inferred/composite metric survives.
- [ ] `rg -n "TemporaryAdvisingGuidance" src/pages/Home.tsx` returns no match.
- [ ] No targetless `WhereIStand` row renders `Progress`.
- [ ] Goal migration, if required, is lossless and idempotent; migration tests
  cover both a legacy record and repeat hydration.
- [ ] File capture has an actual local persistence mechanism, or remains an
  explicitly unavailable affordance with the missing decision reported.
- [ ] Grep proves no calendar write scope, refresh token, or hour-log model was
  added in this Overview change.

### Verification

- [ ] `npm run test` and `npm run build` pass.
- [ ] Signed-out/local mode works, both themes render, keyboard-only flows
  work, and reduced-motion state has no positional animation.
- [ ] Verify the updated Home visually at normal desktop, short desktop, and
  mobile widths with empty, partial, and populated local data.

---

## 7. Commit

```
feat(overview): translate approved state coverage
```

Commit only Overview implementation, required migration/tests, and this
brief's direct support. Keep the dirty mockup, School List, research, and
other tab changes separate.

---

## 8. Next stage — not in this brief

After this lands, re-run `TAB-BRIEF-PROMPT.md` for Overview. It should audit
for **F · Built and matching** and only then promote the approved Overview
entries to `status:"built"` with the commit noted in their decisions.

Durable Google Calendar OAuth/cache/shell-calendar work remains **I1**, and the
dated hour-log model remains its own ruled chunk. Neither is silently included
or completed by this Overview pass.
