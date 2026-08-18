# Academics · Study method · UNPATCHED 2026 — decisions

**Status:** PROPOSED · Stage-A coverage
**Source:** `academics-study-method.html` · **Spec:** `tabs/01-academics.md` §4.1-K, rendering §6.6
**Drawn under:** `implementation/briefs/T1-academics-mockup-2.md`

## Product views

| View | Job |
|---|---|
| Per-topic dot track | Show what has and hasn't happened to one piece of material, at a glance, without opening anything. |
| Class-Overview panel | Answer "what do I do right now?" by grouping topics by the stage they need next. |
| Lecture-day anchoring | Time the prompts off the class's real meeting schedule, without ever requiring one. |
| Empty / vanished | Remove the panel entirely when every group is empty. |

## Behaviour

- **The name is the surface.** `Study method · UNPATCHED 2026`. The year is a
  version, so the method carries its own changelog; when it evolves, ship
  `UNPATCHED 2027`. The working title "The Loop" is retired.
- **It is not a tab.** A tab would make the cycle a place you visit instead of
  a thing you do. Three placements only, and there is no fourth.
- **The track is per-topic, never per-class.** A class is never "at step 4" —
  its topics are all at different stages. Nine dots in three groups of three:
  `prime · pretest · predict` / `recall · feynman · connect` /
  `spaced · practice · mock`. Filled = done, hollow = not. Hover names the step.
- **Only the next step is ever offered as an action.** All nine steps are never
  presented as a checklist to complete; that converts a learning cycle into a
  chore list and guarantees abandonment.
- **Groups and their actions** are fixed: Before class → `Prime · Pretest ·
  Predict`; Just covered (marked covered in the last 7 days, not yet recalled)
  → `Recall it`; Needs connecting (recalled, no `TopicLink`) → `Connect it`;
  Due to review (FSRS says due) → `Start review`; Exam-ready check (in exam
  scope, never mock-tested) → `Full mock`.
- **Each group carries a count and collapses when empty. The whole panel is
  not rendered when every group is empty** — no card, no header, no "you're all
  caught up" placeholder. The absence is the congratulation.
- **Skipping is legitimate.** A student who only does recall and spaced
  repetition is studying correctly. The panel surfaces opportunities and never
  scolds, warns, or counts what was missed.
- **Timing is a nudge, never a gate.** The evening before a lecture day the
  Before-class group reorders to the top; within 24h after, the panel asks the
  student to mark what was *actually* covered. With no meeting schedule set,
  every group still fills from topic state and FSRS — and there is no
  "set your schedule to unlock this" prompt.
- **It costs no AI.** Every group is derived from local records the app already
  holds: `ClassWorkspace` meeting days, topic state, `TopicLink`, FSRS due dates.

## Appearance

- **Placement A — the track** sits inline on the topic row, *beside* the
  existing status chip, and replaces nothing. Dots are 7px, 4px apart within a
  group, with a 1px hairline separator between groups and a small uppercase
  group label. Filled dots are `--cat`; hollow dots are a 1.5px `--bd` ring on
  transparent, never a greyed fill. **No load animation** — the track is
  decorative-free and encodes state only. Hover raises a `--cat` outline on the
  single dot and names its step.
- **Placement B — the panel** is a section on the class Overview using the
  standard panel recipe (`--card`, 1px `--bd`, 16px radius, the
  `0 10px 26px -14px` shadow). Groups are `--muted` sub-cards at 12px radius;
  each group header is title / count only. An empty group collapses to its
  header at 55% opacity with a one-line reason, and the panel itself is absent
  when all are empty.
- **Group actions** are chips, not buttons-in-a-row: `--cat` at 16% for
  secondary steps, solid `--cat` on `#0f1b24` for the primary one. Only one
  solid chip per group.
- **The right rail** carries the plain-language explanation of the five groups
  and exactly **one** `MascotNote`, teaching Pretest first because it is the
  counter-intuitive step. One note maximum on this panel.
- **Placement C** is drawn as three equal cards — evening-before, within-24h,
  no-schedule — so the no-schedule case has the same visual weight as the two
  timed ones rather than reading as a degraded variant.
- Everything here is **solid-with-depth**. Glass appears only on the banner
  stat strip, per `_visual-recipes.md`. Focus is `:focus-visible` only.
  Motion is `.15s cubic-bezier(.16,1,.3,1)` with a `motion-reduce` fallback.

## Class-type parity (§4.1-N)

This is a **STEM** surface. **Writing** classes get the same section at the same
visual weight with their own steps (drafting, feedback, revision) — per
`academics-class-types.html`, *"no greyed-out forgetting curve, no '0 topics
ready', no empty shell of anything."* **General** classes have no third study
tab and therefore **no panel at all** — not a disabled one.

## ⚠️ Open conflicts — Andy owns these

### C2 · The retrievability bar (blocks nothing here, but must be ruled)

§4.1-K-A says *"the existing status chip and retrievability bar stay; the track
sits beside them."* Two problems:

1. **`U-9` forbids a progress bar** — *"nothing is scored, ranked, or compared
   … not against a bar."*
2. **The bar does not exist.** The audit found `topicRetrievability` exported
   from `src/lib/academics/fsrs.ts:48` and **imported by nothing**. The spec
   sentence describes a component that was never built.

**This drawing shows the status chip and the track, and no bar.** If Andy rules
the bar in, it is drawn here first — it is not invented in code. Related:
[[academics-forgetting-curve]] C1, which is the same collision in sharper form.

### C3 · A cleared manifest row pointing at a file that does not exist

Recorded here because it surfaced in the same audit and has no other home.
`BUILD-MANIFEST.md` → Academics · Planning marks
`01-academics/academics-requirements.html` **`YES`**. That file is absent from
`mockup-lab/01-academics/` entirely, and the working tree carries an unstaged
deletion of both `.html` and `.md` from `specifications/mockups/01-academics/`.
**Only Andy flips or removes a manifest row.** Untouched by this pass.

## Deliberately excluded — do not add these back

- A nine-step checklist, a completion count, or "3 of 9 done".
- A progress bar or percentage anywhere on the track or the panel. `U-9`.
- Any "you skipped a step" or "you're behind" copy.
- A load animation on the track.
- A fourth placement, or promoting the panel to a tab.
- A persistent "all caught up" card in place of the vanished panel.

## Component translation

- The panel is a configured standard panel; groups are
  `InteractiveCard`/`Collapsible` compositions. Do not fork a new accordion.
- The `MascotNote` is the shared component from `mascot-note-pattern.html`.
- The dot track is a small presentational component with no state of its own —
  it reads topic state and renders. It owns no scheduling logic.

## States

- A topic with no steps done renders nine hollow dots and a "Not started" chip.
- An empty group collapses to its header with a one-line reason.
- All groups empty → the panel is not rendered.
- No meeting schedule → the timing prompts are absent, every group still works.
