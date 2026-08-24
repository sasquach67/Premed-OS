# T1 · Academics — Daily Class Center restored-card decision repair

**Stage:** B · DRAWN, NOT CURRENTLY DECIDED  
**Scope:** Reconcile the Daily · Class Center paper target with Andy's latest
app-specific ruling: restore the original card hierarchy rather than the
intermediate compact-card treatment. This is a documentation/mockup decision
pass only. It must not change `src/`, the store, persistence, or page status.

## 1. Step-1 audit

### A. Spec → paper

**Pass for this page.** Daily Class Center has visible owners for the class
collection, card → Center Peek route, overflow actions, review handoff,
Cards/List treatment, setup recovery, and no-date condition:

- `mockup-lab/01-academics/academics-daily-main-page.{html,md}`;
- `premed-hq-documentation/tabs/01-academics.md` §4.0–§4.1-G; and
- the Class Hub and Review Session owner frames.

No new ruled Daily-class-card feature needs to be drawn before its decision
record can be repaired. Canvas Path B remains deferred under §4.1-O and is
not a missing Class Center card surface.

### B. Mockup → app

The live Class Center is `src/components/academics/ClassCenter.tsx`. Its
original hierarchy was restored in `3accbee` after the most recent direct
product ruling. `ClassCard` currently renders the factual record treatment
Andy asked to restore: a course standing (`IP` or entered letter), a computed
course percent when grade evidence exists, a labelled topic-ready progress
bar, next dated item, and the original hover/focus Review action rail plus
overflow.

**Measured primary record surface, Aug. 24, 2026** — running local app at
`#/academics?tab=class-center`, first populated `.academics-class-card`:

| surface | current paper target | running app |
| --- | --- | --- |
| dark page field → class card | `#211e1a` → `#322e28` | card `rgb(50, 46, 40)` (`#322e28`) |
| card edge / geometry | `#3c352d`; `13px` corner; `12px` record padding | `rgb(60, 53, 45)` (`#3c352d`); `13px`; card shell is `211.354px` tall in the measured populated row |
| record anatomy | the decision record currently says **no percent, no progress, no card Review** | `IP`, `87.1%`, labelled ready progress, and the original Review follow-up are present in source/live content |

The palette rung is correct. The decision record is not: its Aug. 23 “Later
app annotations” currently prohibits the facts and action the restored app is
supposed to preserve. That makes a future fidelity or promotion audit
meaningless until paper reflects the selected treatment.

### C. Already built — preserve, do not rebuild

- `3accbee` — restored the original Class Center card hierarchy; it is the
  current app-specific visual authority.
- `be10e7f` — verifies personal-empty recovery, persisted Cards/List state,
  changed course facts across hydration, and the Daily control surface.
- `9b16cfc` and `589bf0e` — historical compact-card work and its paper
  repair. Do not reapply their no-percent/no-progress/no-Review composition;
  their measured palette evidence remains useful, not their card anatomy.
- The existing Center Peek, Review route, overflow/context controls, syllabus
  import, Class Types, and Class Hub work remain out of scope.

### D. Manifest gate

`BUILD-MANIFEST.md` marks `01-academics/academics-daily-main-page.html`
**YES**. That would permit a later implementation pass, but this Stage-B brief
is intentionally paper-only.

### E. Decision record

**Fails.** `academics-daily-main-page.md` contains both behaviour and
appearance, but its authoritative-later section now conflicts with Andy's
newer explicit app annotation and `3accbee`. It says to remove the card
percent, topic-ready bar, and visible Review path; those must no longer be
treated as the decision.

### F. Integrations and services

| dependency | classification | student-facing state |
| --- | --- | --- |
| Local persisted Academics store | **CODE BUILT AND CONFIGURED** | The class standing, grade evidence, topics, dated assignment, Cards/List choice, and review handoff all have local owners. |
| Google Calendar read context | **NOT REQUIRED by this card** | A card is valid with only its local course assignment facts. It must not imply a calendar connection. |
| Syllabus ingestion | **CODE BUILT; student-supplied input** | It can add dated class facts but cannot justify invented grade or progress values. |

### First blocked stage

**B · DRAWN, NOT CURRENTLY DECIDED.** The Daily owner frame exists and the
manifest is open, but its written appearance decision contradicts the
current, directly approved app treatment. Stages before B pass because the
features already have paper surfaces; nothing past B may be promoted against
two different visual contracts.

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §4.0, §4.0a, §4.1-G, §6.7,
  §6.9, and §6.13.
- `premed-hq-documentation/general.md` U-9 and U-13.
- `mockup-lab/01-academics/academics-daily-main-page.{html,md}`.
- `mockup-lab/_shared/_visual-recipes.md` and `mockup-lab/VARIANT-LAB.md`.
- `premed-hq-documentation/implementation/component-inventory.md` and
  `MOCKUP-TRANSLATION-CONTRACT.md`.
- `src/components/academics/ClassCenter.tsx` and
  `src/components/academics/ClassCenter.test.ts` as read-only evidence.
- Commits `3accbee` and `be10e7f`.

## 3. Work — repair the selected paper target only

### 3.1 Replace the superseded later card annotations

Amend `academics-daily-main-page.md` and the representative card in
`academics-daily-main-page.html` to state this selected treatment plainly:

1. **Original record hierarchy is restored.** The primary card may show the
   course code/title, an entered letter standing or factual in-progress state,
   the exact computed course percent only when the record has the supporting
   grade evidence, review/processing facts, a labelled topic-ready line with
   its progress meter, and the next dated class item. These are facts about
   the course record, not a rank, readiness judgement, or composite.
2. **Review remains a card follow-up.** Restore the original Review control in
   the card's hover/focus action rail and retain it in overflow/context paths.
   Its play triangle is solid white. The card's own click still opens the
   Center Peek; do not replace that route with Review.
3. **The original card geometry remains.** Do not impose the superseded fixed
   `206px/198px` equal-tile rule or a decorative blank zone. Preserve the
   responsive grid, current compact minimum record height, and content-driven
   vertical composition from `3accbee`.
4. **Keep restrained colour.** Course colour remains the dot, hover border,
   left ignition bar, progress indicator, and Review treatment—never a
   permanent full-card wash or generic global-blue CTA. The class card stays a
   solid `#322e28` surface with `#3c352d` edge, 13px radius, and 12px content
   padding.
5. **Honest absence still wins.** When no dated assignment exists, name that
   absence and route toward the class-owned add/import path. Do not invent a
   date, percent, review total, or progress just to complete a card.

### 3.2 Make behaviour and appearance independently checkable

- Label the Aug. 23 compact/no-percent/no-progress/no-Review annotation as
  **superseded by the Aug. 24 restored-card ruling**; retain it as historical
  context rather than silently deleting product history.
- Show the restored action rail in the mock sample's hover/focus treatment,
  including a white-filled play icon and the adjacent overflow control.
- State exactly which record facts are conditional: no grade percent without
  grade evidence; no progress meter without topics; no fake deadline without
  an assignment.
- Preserve the existing Cards/List, keyboard, context-menu, reduced-motion,
  and hover isolation decisions. Review-hover must not light the parent card;
  keyboard focus still exposes the usable action path.

### 3.3 Decision-proof check

- The daily owner `.md` names `3accbee` and says which earlier paper ruling it
  replaces.
- The paper sample visibly includes the restored standing/percent/progress/
  Review relationship rather than merely mentioning it in prose.
- It never calls any grade/progress fact a score, rank, predicted outcome, or
  student judgement; U-9 and U-13 remain explicit.
- `git diff --check` passes.

## 4. Do not break

- Do not edit `src/`, tests, migrations, `BUILD-MANIFEST.md`, integration
  settings, or page registry status in this paper pass.
- Do not change app-specific choices by mechanically copying the older July
  mockup or the compact Aug. 23 annotation. The selected target is the
  **restored current app hierarchy** in `3accbee`.
- Do not turn the factual percent/topic meter into an inferred readiness,
  likelihood, ranking, or cross-course comparison.
- Do not re-add BCPM/class-type badges unless a later, explicit user decision
  calls for one; they are not part of this restoration.
- Preserve unrelated dirty briefs, Flashcards V1 work, and `output/`.

## 5. Done when

- [ ] The Daily decision record and visible mock card agree with `3accbee`.
- [ ] The old compact-card annotation is marked superseded, not silently
      treated as future authority.
- [ ] Conditional grade, percent, topic progress, deadline, and Review paths
      are documented as record facts with their absence states.
- [ ] The warm-dark visual ladder and interaction/accessibility rules remain
      explicit in the decision record.
- [ ] `git diff --check` passes.

## 6. Commit

`docs(mockups): record restored Class Center card hierarchy`

Keep it separate from unrelated working-tree changes.

## 7. Next stage — not in this brief

**F · Daily Class Center promotion audit.** After this decision repair, rerun
all six `VARIANT-LAB.md` proofs against the restored target: both-theme
measurements, zero-unexplained-control audit, reload persistence, personal
empty-store recovery, integration classification, and the documented commit.
Promotion is not part of this brief.
