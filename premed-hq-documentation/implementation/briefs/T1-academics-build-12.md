# T1 · Academics — Planning cold start

**Stage:** C · **EXECUTED Aug 19, 2026** — built, with a reachability finding

**Scope:** Planning's no-record state. What the Planner tab shows before any
course exists.

---

## 1. Fidelity audit

- **Spec → paper:** pass. `academics-planning-cold-start.html` + `.md` record
  behaviour and appearance, and the `.md` names the composition outright: *"a
  lightly constructed, empty three-term plan — not a large centered empty
  card."*
- **Mockup → app:** **missing.** With no courses the Planner renders GPA rings
  reading `—`, an empty course table, and the What-if panel. **Zero metrics with
  no data behind them is exactly what this surface exists to prevent (U-5).**
- **Already built — reuse:** `EmptyState` is the composition owner; the Planner
  tab, `ModeSwitch`, and the existing add-course flow stay as they are. **This
  is not a new onboarding framework.**
- **Gate:** `BUILD-MANIFEST.md` marks the mockup **`YES`**.
- **Decisions file:** pass. No variant open.
- **Integrations:** none. **No ANDY CHECKLIST.**

---

## 2. The work

### Frontend — `src/components/academics/PlanningColdStart.tsx` (new)

1. Renders **only** when the student has no courses at all. One condition, and
   it belongs to the component so the Planner cannot drift out of step with it.
2. Left: a narrow editorial introduction naming **one** next action — add a
   current or completed course. Prior credit is deliberately subordinate,
   because a plan starting from AP credit alone is the rarer path.
3. Right: three dashed term slots — *This term · Next term · Later* — showing
   what the first fact will unlock. **The slots are empty, not filled with
   example courses**, since a fake course is indistinguishable from a real one
   at a glance.
4. **No GPA rings, no audit, no chart, no recommendation, and no zero.** The
   Planner's metric surfaces are suppressed until a course exists.
5. Mounted at the top of the Planner tab, replacing the ledger while empty.

---

## 3. Do not break

- No fabricated example course, term, or GPA.
- No zero metrics — U-5's whole point on this surface.
- Do not fork `EmptyState` into an onboarding system.
- Once one course exists this surface disappears entirely; it never becomes a
  permanent banner.
- Signed-out mode and both themes identical.

## 4. Done when

- [x] With no courses, the Planner shows the cold start and **no rings, table,
      or What-if panel**.
- [x] Adding one course makes it disappear and the normal Planner return.
- [x] No example data is rendered anywhere in it.
- [x] Build passes; suite green.

## 5. ⚠️ Finding — this state is nearly unreachable, and that is a spec-vs-app conflict

**Verified in the running app:** `src/data/seed.ts` seeds a full UNC plan —
transfer/AP credit plus recorded courses — for every new signed-out user. So
`courses.length` is never zero at first run, and the cold start **cannot appear
during onboarding, which is the moment it was drawn for.**

The `.md` calls this "Planning's no-record state", i.e. the first-run screen.
The app has no first-run no-record state, because the seed fills it.

The component is still correct and still earns its place — a student who
deletes every course reaches exactly this state, and without it they would see
GPA rings reading `—` over an empty ledger, which is the U-5 violation this
surface exists to prevent. **But it is a recovery state today, not an
onboarding one.**

**Andy's call, because it is a product decision and not an engineering one:**

1. **Leave it.** The seeded plan is a deliberate demo-on-arrival, and cold
   start stays as the delete-everything recovery screen. Nothing more to do.
2. **Stop seeding courses.** New users land on the cold start and add their
   first real course. Honest, and it makes the drawn surface do its drawn job —
   but a brand-new user then sees a much emptier app, and every other seeded
   pillar would want the same treatment for consistency.

**RULED Aug 19, 2026 (Andy): option 1 — keep seeding.** The seeded plan is a
deliberate demo-on-arrival, and the cold start stays as the delete-everything
recovery screen. It still earns its place: without it that path shows GPA rings
reading `—` over an empty ledger, which is the U-5 violation this surface
exists to prevent. No change to `seed.ts`.

## 6. Commit

`feat(academics): add the Planning cold start (§4.1)`
