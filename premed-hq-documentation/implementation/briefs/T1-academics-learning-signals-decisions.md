# T1 · Academics — Learning signals decisions

**Stage:** B · DRAWN, NOT DECIDED

**Scope:** Choose the one placement composition for the STEM-only Learning
signals panel in a class Overview. This is a decision pass only: no `src/`,
store, signal engine, or integration work is authorized here.

---

## 1. Fidelity audit — completed before this brief

### a. Spec → paper

**Pass.** The approved Academics paper pass recorded a surface for each ruled
feature; the class-scoped home for the deterministic learning signals is
[`academics-learning-signals.html`](../../../mockup-lab/01-academics/academics-learning-signals.html).
It draws the required placement below the class's primary next action, the
cause → consequence → one-action pattern, the STEM boundary, visible evidence,
and the absent-when-unearned rule. The broader signal catalogue has other
owners; this is not a dashboard for every possible signal.

### b. Mockup → app

**Missing.** `src/components/academics/ClassCenter.tsx` has a compact
class-card summary (`classSignal`), and `StudyMethodPanel` renders its distinct
study-cycle groups inside a class Overview. Neither is the ruled Learning
signals panel: neither caps contextual evidence-backed signals at three nor
provides the selected panel's evidence/action composition.

### c. Already built — do not rebuild

- Class Center, class routes, Topics, Materials, Assignments, and recall-route
  ownership already exist. A Learning signal must navigate to its existing
  owner; it must not attempt repair inside the panel.
- `StudyMethodPanel` and `studyMethod.ts` are the separate §4.1-K study-cycle
  feature, built in `a245721`. Do not rename, move, or fork it into this
  panel.
- The current forgetting-curve read model and visual feature shipped in
  `775611e`; it remains an owner that a future signal may route into, not a
  reason to put a chart in this panel.

### d. Gate

**Pass.** `BUILD-MANIFEST.md` marks
`01-academics/academics-learning-signals.html` **YES**. That authorizes a
future implementation only after this decision is recorded; it does not pick a
layout on Andy's behalf.

### e. Decisions file

**Blocked.** Its companion `.md` records behaviour and appearance well, but
explicitly says the placement composition is unsettled: A/B/C compares three
different layouts and requires Andy to choose one. Therefore the tab stops at
Stage B before any implementation brief can be valid.

### f. Integrations and services

No external service is necessary for the panel shell. Each signal must remain
dormant until its local course records exist. Future signal types that depend
on calendar, Canvas, lecture capture, grade policy, or `TopicLink` are not
silently simulated here; their owners and services are a later implementation
concern.

---

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` — “Learning signals — the
  class-page surface” (§4.1): placement, STEM boundary, three-item limit,
  evidence requirement, and no-empty-panel rule.
- `mockup-lab/01-academics/academics-learning-signals.html` — inspect all three
  actual variants in the lab before deciding.
- `mockup-lab/01-academics/academics-learning-signals.md` — behaviour and the
  three composition choices.
- `mockup-lab/VARIANT-LAB.md` — one-tab stage ladder and appearance requirement.
- `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`
  — tokens, depth, motion, and reduced-motion source of truth for the later
  build.
- `premed-hq-documentation/implementation/component-inventory.md` — reuse
  existing `Tabs`, `InteractiveCard`, `CenterPeek`, `InfoTip`, and class
  hierarchy owners; do not create a second navigation or card family.
- `premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md` — build
  authorization.

---

## 3. The one decision Andy needs to make

Open the three variants in the lab and choose **one**:

| Treatment | What the student sees | Why choose it |
|---|---|---|
| **A · Priority rail** | A compact panel below the next action, with three signal rows and a narrow “Why these appear” evidence rail. | Best for a dense STEM class Overview; cause and supporting evidence remain visible together. **Recommended.** |
| **B · Editorial section** | A calm, full-width reading sequence beneath the next action. | Best when the class Overview should feel narrative and spacious, but actions/evidence are less scannable. |
| **C · Evidence drawer** | An otherwise quiet Overview with an explicit right-side drawer. | Best for progressive disclosure, but it adds a second interaction before the student can see an actionable signal. |

The decision must be recorded by changing the companion mockup `.md` from
“placement composition is not settled” to the selected treatment, including:

1. exact placement under the primary next action;
2. hierarchy and evidence placement;
3. mobile treatment;
4. why this composition wins over the other two.

Then update the lab entry from `proposed` to `approved`. This decisions brief
does not make either edit, because the selection belongs to Andy.

---

## 4. Do not break

- No readiness score, composite, ranking, progress bar, inferred “behind”
  state, or fake empty state (U-5/U-9).
- At most three items; each is cause → consequence → exactly one route to an
  existing owner.
- No signal in Writing or General workspaces, and no cross-class merge or
  shared review credit. `TopicLink` stays a proposal with evidence and explicit
  confirmation when that model exists.
- Do not add alerts, recurring nudges, calendar writes, Canvas access, or AI
  recommendations in this decision pass.
- Reuse the real Class Hub banner, hierarchy, motion system, and tokens; glass
  belongs only to a floating surface, not this dense class-work panel.

---

## 5. Done when

- [ ] Andy has selected A, B, or C after reviewing the actual lab frames.
- [ ] The companion `.md` names the winning treatment and records behaviour
      **and** appearance, including mobile and hierarchy.
- [ ] The registry entry has `status:"approved"` (the manifest remains the
      separate build gate).
- [ ] No `src/` file, app state, integration setting, or data model changed.

## 6. Commit

`docs(briefs): route Academics through learning-signals decision`

## 7. Next stage — explicitly out of scope

After the selection is recorded, rerun the Academics tab brief generator. It
may then produce one Stage-C implementation brief for Learning signals:
frontend translated from the chosen layout and only the deterministic,
evidence-backed data behind its first live signal set. That build is not part
of this brief.
