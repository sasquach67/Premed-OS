# T2 · Overview — honest projection state

**Stage:** C · **DECIDED, NOT BUILT**
**Build gate:** **BLOCKED.** `overview-projection-states.html` is not named
`YES` in `BUILD-MANIFEST.md`. This document is a complete implementation brief,
not permission to begin. Andy must add/clear the source in the manifest; nobody
else edits the manifest.

This is the first remaining Overview stage. It implements one approved, local
disclosure inside the existing Where I Stand panel: an honest unavailable state,
a quiet `Show projection` control, and a traceable expanded calculation. It
does not add a ninth Home block, a generic dashboard projection, or a second
experience tracker.

> **Important prerequisite:** a real calculated projection needs dated,
> attributable experience-hour entries. The current model only has aggregate
> `ExperienceEntry.hours`, so this brief is incomplete until the separately
> proposed hour-log model is approved. Do not substitute an aggregate, a
> position start date, or an invented weekly rate. Until that model is cleared,
> ship only the approved unavailable state.

## 1. Fidelity audit

### a. Spec → paper

**Pass.** Every ruled Overview surface now has a reviewable paper source.

| Ruled feature | Source |
|---|---|
| Eight-block bento, order, hero-only glass, stat-tile hierarchy, and roadmap | `overview-bento-control-panel.html` + `.md` |
| Task lifecycle/detail/empty/expanded handoff | `overview-task-states.html` + `.md` |
| Where I Stand expansion, Smart Actions absence, Quick Access, roadmap empty | `overview-status-states.html` + `.md` |
| Story Bank capture, quarterly goals, widget loading/error/mobile | `overview-capture-goals-states.html` + `.md` |
| Insufficient evidence, collapsed and expanded projection states | `overview-projection-states.html` + `.md` |

No score, normalized bar, readiness label, ranking, or default target is drawn.
The mockup's populated projection is explicitly an **example calculation** for
review, not seed data or a product default.

### b. Mockup → app

| Surface | Current app finding |
|---|---|
| Bento shell, Hero, Tasks, Smart Actions, stat tiles, Quick Access, goals, Capture | Built in the existing composition; audit in place, do not rebuild. |
| Where I Stand expansion and targetless no-bar treatment | Built by `3abdb68`; retain its one-open-row geometry. |
| Roadmap record ownership | Built by `bec129c` on canonical `timelineMilestones`; retain. |
| Projection unavailable/collapsed/expanded states | **Missing.** No Overview component renders `Show projection`, `Not enough dated work yet`, or a traceable calculation. |

One fidelity defect is already visible in `OverviewRoadmap.tsx`: it calculates
and renders a completion percentage for the roadmap. That is not this
projection source and must not be copied into it; resolve it only when a
manifest-cleared Overview source/brief explicitly covers the roadmap treatment.

### c. Already built — do not rebuild

- Approved Overview state coverage: `3abdb68`
  (`feat(overview): translate approved state coverage`).
- Canonical Timeline milestone ownership: `bec129c`
  (`fix(timeline): make roadmap milestones canonical Timeline records`).
- Projection paper source and approval: `511b650`, `f79b577`.
- `OverviewHero.tsx`, `HeroDailySchedule.tsx`, `Sidebar.tsx`, and
  `AppShell.tsx` are frozen approved work. Do not edit them.

### d. Gate

The manifest clears the bento, S3 Tasks refinement, and historical Where I
Stand source as **YES**. It has **no row** for
`03-overview/overview-projection-states.html`; per the manifest rule, this new
source is not cleared. Nothing in this brief may be implemented until Andy
changes the manifest.

### e. Decisions files

**Pass.** The five current Overview decision documents record both behaviour
and appearance. In particular, `overview-projection-states.md` locks the
solid inset, quiet disclosure pill, four fact cells, and mobile/reduced-motion
treatment. No behaviour-only decision file blocks this stage.

### f. Integrations and services

| Dependency | Classification | What the student sees today | Required outcome |
|---|---|---|---|
| Google Calendar hero | **Code built, not configured** | Class-schedule/mock-preview fallback or a connect prompt; not the student's Google events. | No code in this brief. Andy completes the checklist below. |
| Dated experience-hour evidence for a projection | **Code/model missing** | No projection surface; aggregates cannot honestly establish pace. | The backend work in this brief is blocked pending approval of `HOURLOG-model-proposal.md`. |
| File attachment persistence for Capture | **Code/storage missing, intentionally unavailable** | A disabled File affordance with an honest explanation. | Not part of this projection brief; preserve the unavailable state. |

#### Andy checklist — Google Calendar configuration

1. In Google Cloud, enable **Google Calendar API** for the existing project.
2. Configure the consent screen with only the `calendar.events.owned.readonly` scope.
3. Create/use a Web OAuth client and authorize:
   `http://127.0.0.1:5173` and `https://sasquach67.github.io`.
4. Put its client ID in local `VITE_GOOGLE_CLIENT_ID` and the hosted build
   secret/environment value. Add that variable to `.github/workflows/deploy.yml`
   alongside the existing public Supabase build variables.
5. Rebuild the deployed site, connect once, refresh, and confirm the Hero says
   Google Calendar and displays that account's current-day events.

This is an account/configuration task, not a backend-token task: do not add
refresh-token storage, an Edge Function, or a broader OAuth scope.

## 2. Why this lands at Stage C

Stages A and B pass: the state is drawn, approved, and documented with its
appearance. Stage C is the first failure because **nothing in `src/` implements
the approved projection state at all**. Existing Overview components must not
be reimplemented; this is the one missing decided surface, with its data path,
in one pass once both prerequisites are cleared.

## 3. References

- `specifications/03-overview.md` §5–§6.9, §9–§11, especially §6.5 and §11
  pacing/projection acceptance criterion
- `specifications/01-shared-interface-patterns.md` §4d
- `specifications/mockups/03-overview/overview-projection-states.html` + `.md`
- `specifications/mockups/03-overview/overview-status-states.html` + `.md`
- `specifications/mockups/_shared/_visual-recipes.md`
- `implementation/MOCKUP-TRANSLATION-CONTRACT.md`
- `implementation/component-inventory.md`
- `implementation/briefs/HOURLOG-model-proposal.md` (proposal, not authority
  to start the migration)
- `implementation/briefs/I1-google-calendar.md` (configuration boundary)
- `general.md` U-4, U-5, U-6, U-8, U-9, U-12

## 4. FRONTEND — one local disclosure in Where I Stand

After the manifest gate and hour-log model are both cleared:

1. Extend the existing `WhereIStand` expanded-row implementation. Do not add a
   new Overview card, route, tab, chart, or generic projection component.
2. With insufficient real evidence, show the approved solid inset:
   `Not enough dated work yet` plus the concrete next record needed. It has a
   restrained warning left rule and dash chip; it is not an error and contains
   no zero, estimate, bar, or encouragement copy.
3. With sufficient evidence, keep the calculation hidden by default behind
   `Show projection`. The control expands only that row and returns to the
   quiet state with a local dismiss control. Keyboard focus and `aria-expanded`
   must stay correct; reduced motion is instant.
4. The expanded inset names its evidence window, exact **logged** hours,
   measured weekly rate, remaining student-set goal, and plain calculation.
   Use the source's four compact facts and one-line formula—no chart, meter,
   percentage, promise, or “on track” conclusion.
5. Render this only where its owning domain has a student-set hours goal and
   real attributable dated logs. Estimated blocks remain visibly distinct and
   never feed the evidence window or rate.
6. Preserve the existing one-open-Where-I-Stand-row rule. On mobile the fact
   cells stack inside the same inset; nothing floats over the page.

## 5. BACKEND — complete only after the model ruling

This work is intentionally blocked, not a license to start the model now.
Once `HOURLOG-model-proposal.md` becomes an approved, manifest-cleared data
model brief, this Overview implementation must consume its canonical selectors:

1. Add the separate parent-position / child-hour-entry model and versioned,
   lossless migration exactly as approved. An aggregate legacy total becomes
   one `estimated` block, never fabricated daily rows.
2. Provide a selector scoped to a real position/domain that returns either:
   - an explicit insufficiency reason; or
   - a transparent observation interval, summed dated `logged` hours, rate,
     remaining target, and a simple future-date arithmetic result.
3. Exclude estimated, deleted, undated, cross-pillar, and un-attributed entries
   from pacing. A selector must return `null`/reason rather than a plausible
   number whenever those rules leave insufficient observed data.
4. Persist a per-record projection dismissal only after a projection is valid;
   never make dismissal data masquerade as a goal or change underlying logs.
5. Test aggregate legacy imports, estimated exclusion, two dated logs with a
   known interval, missing goal, no data, position ownership, migration
   idempotence, and reopening/dismissing the disclosure.

## 6. Do not break

- No edits to frozen Hero/shell files.
- No Calendar OAuth backend, token persistence, remote attachment store, AI
  classification, Atlas route, or new external API.
- No aggregate-hours-as-pace calculation, weekly bucket inference, fixed
  denominator, fabricated future date, or demo value on a real user surface.
- No score, readiness/composite label, ranking, normalized percentage, or
  progress bar (U-4/U-5/U-9).
- No experience record duplication or a second store. Reuse canonical records,
  selectors, `WhereIStand`, the shared `Collapsible`, and the existing store.
- Preserve keyboard-only use, focus return, themes, tooltips, and reduced
  motion. The rest of Home must keep rendering if a selector is unavailable.

## 7. Done when

- `rg "Show projection|Not enough dated work yet" src` finds the one approved
  local surface, not a second dashboard/card.
- `rg "width:.*%|progress|score|readiness|ranking"` over its new projection
  code finds no visual metric prohibited by U-9.
- Projection values come only from the canonical dated-log selector; grep
  proves the component never reads `ExperienceEntry.hours` or `startDate` to
  derive a rate.
- An estimated legacy block displays as estimated but cannot alter weekly pace,
  projection, streak, latest log, or calculated future date.
- A domain with no target or insufficient logs has the factual unavailable
  treatment, never a zero-width bar or example value.
- The existing Overview component tests plus focused migration/selector/UI
  tests pass, as do `npm run test` and `npm run build`; both themes,
  keyboard-only use, and reduced motion are verified.
- Google Calendar configuration is separately verified with the checklist; it
  is not claimed “done” merely because fallback events render.

## 8. Commit

`feat(overview): add evidence-backed pace disclosure`

Commit only the implementation and its tests. Unrelated mockup, research,
school-list, and documentation changes stay separate.

## 9. Next stage — not in this brief

After this implementation is committed and visually checked against the
approved source, rerun `TAB-BRIEF-PROMPT.md` for Overview. It will audit Stage
D/E/F. Promotion to `built` remains out of scope until every Overview surface
uses real records/live configured services—including Google Calendar—and no
mock/placeholder fallback is being presented as live data.
