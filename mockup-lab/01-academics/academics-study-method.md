# Academics · Study method · UNPATCHED 2026 — decisions

**Status:** PROPOSED · Stage-A coverage · **C2 ruled Aug 18, 2026** · **BUILT (partial — see below)**
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
- **The track sits beside the existing row, replacing nothing.** The
  retrievability bar, its figure, and the status chip all stay exactly as
  `academics-class-hub.html` approved them (C2). The figure is never shown
  without the chip beside it as its non-numeric form.
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

- **Placement A — the track** sits inline on the topic row **after** the
  approved bar / figure / chip group, and replaces none of it. Row order is
  unit · name · bar · figure · chip · track. Dots are 7px, 4px apart within a
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

### ✅ C2 · The retrievability bar — RULED (Andy, Aug 18, 2026): it stays

§4.1-K-A says *"the existing status chip and retrievability bar stay; the track
sits beside them."* The correction that made this Andy's call rather than a
routine spec ruling: **the bar is drawn, and it is approved.**
`academics-class-hub.html:277-278` draws it as a 70px bar, a figure, and a
status chip — **APPROVED July 2026, `BUILD-MANIFEST.md` `YES`** — and the row
anatomy is specced three times (§4.1-K lines 361, 395, 529).

What it is *not* is built: `topicRetrievability` is exported from
`src/lib/academics/fsrs.ts:48` and imported by nothing.

`U-9` was **added Aug 2026**, a month after that drawing was approved. A
governing rule postdating a cleared, approved mockup is not a case where the
spec simply wins — which is why it went to Andy.

**The ruling, matching C1: the figure never travels alone.** The bar and its
percentage stay, and **the status chip beside them is the non-numeric form** —
`Not Started → Seen → Notes Made → Reviewing → Weak → Ready`. The approved row
already contained both halves; nothing new is invented, and nothing is removed.

**Rows in this drawing now read:** unit · name · **bar · figure · chip** ·
track. The first three are the approved class-hub anatomy, untouched, using its
literal values (`.bar` 70×5px, `#272420` groove; `.pct` Baloo 2 800 11px,
32px right-aligned). The 9-dot track is appended beside them, which is exactly
what §4.1-K-A asks for.

**The track still carries no tally of its own.** No "4 of 9", no completion
count, no second bar. The bar says how well the topic is *known*; the track says
what has *happened* to it. Two different facts, and only one of them is a
measurement. Related: [[academics-forgetting-curve]] C1.

### C3 · A cleared manifest row pointing at a file that does not exist

Recorded here because it surfaced in the same audit and has no other home.
`BUILD-MANIFEST.md` → Academics · Planning marks
`01-academics/academics-requirements.html` **`YES`**. That file is absent from
`mockup-lab/01-academics/` entirely, and the working tree carries an unstaged
deletion of both `.html` and `.md` from `specifications/mockups/01-academics/`.
**Only Andy flips or removes a manifest row.** Untouched by this pass.

## Deliberately excluded — do not add these back

- A nine-step checklist, a completion count, or "3 of 9 done".
- A progress bar or percentage **on the track or the panel**. The topic row's
  retrievability bar is a separate, ruled exception (C2) and is not a licence
  to add others.
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

## Built — and what was deliberately withheld

Placements A and B are implemented in `StudyMethodTrack.tsx` and
`StudyMethodPanel.tsx` over `lib/academics/studyMethod.ts`.

**Three of the five groups were not built, on purpose.** The surface outruns
its engine: `Before class` needs Pretest and Predict, `Needs connecting` needs
`TopicLink`, and `Exam-ready check` needs Full mock — all four are §6.6
features marked ✗ new and none exists. Rendering a group whose action is dead
would advertise a study step the app cannot perform, on the surface whose whole
job is *"what do I do right now?"*.

**Only `Just covered` and `Due to review` ship**, both backed by the existing
recall runner and FSRS. The panel renders whatever `studyGroups` returns, so
each remaining group turns on when its engine lands — no rework here.

The same rule governs the dot track: the four engineless steps render hollow
and are **never fillable**, with a hover that says *"not available yet"*
instead of inventing a completion signal.

Placement C reduces to ordering for now, since the only group timing would
promote is `Before class`, which is not rendered.

Verified live: 9 dots in three stage groups with only engine-backed steps
filled, the panel showing `Just covered · 1` and `Due to review · 1` with no
forbidden group or action anywhere in the DOM, and — on a class where neither
group qualifies — **no panel DOM at all**, no "all caught up" placeholder, with
the rest of the Overview intact. Both themes checked. 280 tests and the
production build pass.
