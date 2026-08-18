# T1 · Academics — Study method · UNPATCHED 2026

**Stage:** C · DECIDED, NOT BUILT

**Scope:** The §4.1-K surface — the per-topic dot track, the class-Overview
panel, and lecture-day anchoring. **Only the groups whose action already
exists are rendered.** This brief does not build the four missing §6.6
features.

**Gate:** `BUILD-MANIFEST.md` marks `academics-study-method.html` **`YES`**
(cleared Aug 18, 2026, `31f1f3a`). C2 is ruled: the retrievability bar stays,
and the status chip beside it is its non-numeric form.

---

## 1. ⚠️ Read this before anything else — the surface outruns its engine

§4.1-K is the **shell**. §6.6 is the **engine**, and most of it does not exist.
The panel's five groups each carry an action, and **three of those actions have
nothing behind them:**

| Group | Action | Engine | Verdict |
|---|---|---|---|
| **Just covered** | `Recall it` | `AcademicRecallSession.tsx` + `activeRecall.ts` | ✅ **build it** |
| **Due to review** | `Start review` | FSRS due dates, `fsrs.ts` | ✅ **build it** |
| Before class | `Prime · Pretest · Predict` | Prime exists only as a note convention (`ClassHub.tsx:760`, notes titled `Prime:`). **Pretest and Predict do not exist** (§6.6, marked ✗ new) | ❌ **do not render** |
| Needs connecting | `Connect it` | **`TopicLink` is not in `src/lib/types.ts`.** §6.6 calls Connect *"the largest missing piece"* | ❌ **do not render** |
| Exam-ready check | `Full mock` | **Does not exist** (§6.6, ✗ new for classes) | ❌ **do not render** |

**Rendering a group whose action is dead would be worse than omitting it** —
it advertises a study step the app cannot perform, on the surface whose whole
job is *"what do I do right now?"*

**The drawing already accommodates this.** §4.1-K rules that each group
collapses when empty and **the panel is not rendered at all when every group is
empty.** A group with no engine is simply never populated, so the composition
degrades exactly as designed rather than needing a special case.

**As each §6.6 feature lands, its group appears.** No rework — that is the
point of building the shell against the rule rather than against the sample
data in the drawing.

---

## 2. Fidelity audit

### a. Spec → paper
No Stage-A blocker. `academics-study-method.html` draws all three placements,
including the vanished state. `0e90cdd`, revised `7b8d373`.

### b. Mockup → app
| | Drawn | Decided | Built |
|---|---|---|---|
| The dot track | ✅ | ✅ | ❌ |
| The Overview panel | ✅ | ✅ | ❌ |
| Lecture-day anchoring | ✅ | ✅ | ❌ |

**Nothing of §4.1-K exists in `src/`** — `rg -i "unpatched\|9-dot\|nine-step"`
returns nothing.

### c. Already built — do not rebuild
- The topic row and its bar/figure/chip: `ClassHub.tsx` `TopicRow`. **C2: that
  group stays exactly as approved. The track is appended beside it.**
- Recall runner `9f9d98a`; FSRS `fsrs.ts`; forgetting curve `775611e`
  (the curve button already sits on the topic row — the track goes beside it,
  not instead of it).
- `ClassWorkspace` already stores `meetingDays` / `meetingTime`. **Do not add
  a second schedule field.**

### d. Gate
**Cleared.** See header.

### e. Decisions
`academics-study-method.md` records behaviour and appearance, and C2.

### f. Integrations
**None.** Every group derives from local records — topic state, FSRS due
dates, `ClassWorkspace` meeting days. §4.1-K: *"it costs no AI."*
**No ANDY CHECKLIST items.**

---

## 3. References

| What | Where |
|---|---|
| The drawing — 4 frames | `mockup-lab/01-academics/academics-study-method.html` |
| Decisions + C2 | `mockup-lab/01-academics/academics-study-method.md` |
| The surface spec | `tabs/01-academics.md` §4.1-K |
| The engine spec — **context, not scope** | `tabs/01-academics.md` §6.6 |
| Class-type parity | `tabs/01-academics.md` §4.1-N; `academics-class-types.html` |
| ⚠️ Literal values | `mockup-lab/_shared/_visual-recipes.md` |
| Where it mounts | `ClassHub.tsx` — Overview tab, and `TopicRow` |
| The rules | `specifications/05-experience-pillar.md` (`U-9`) |

---

## 4. The work

### 4a. The 9-dot track (placement A)

A presentational component reading one topic's state. **Row order is
unit · name · bar · figure · chip · track** — the approved anatomy first, the
track appended beside it.

- Nine dots, three groups of three, labelled `before` / `after` / `retain`.
  Filled = done, hollow = not. Hover names the step.
- **Derive each dot from state that exists.** A dot whose step has no engine
  (`pretest`, `predict`, `connect`, `mock`) renders **hollow and is never
  fillable** — it is honest about a step the app cannot yet record. Do not
  invent a completion signal for it.
- **No animation on load.** `--cat` filled, 1.5px `--bd` ring hollow, 7px.
- **No tally, no count, no second bar.** `U-9`.

### 4b. The class-Overview panel (placement B)

A section on the Class Hub Overview, never a tab.

- **Render only `Just covered` and `Due to review`** for now.
  - *Just covered* — topics marked covered in the last 7 days with no recall
    since. Action `Recall it` → the existing runner.
  - *Due to review* — FSRS says due. Action `Start review` → the runner.
- Each group shows a count and collapses when empty.
- **When both are empty, the panel is not rendered at all** — no card, no
  header, no "all caught up" placeholder. Draw nothing.
- **One `MascotNote` maximum.** Since Pretest is not built, teach the step
  that *is* live rather than the counter-intuitive one that is not.
- **Never scold.** No "you're behind", no missed-step copy.

### 4c. Lecture-day anchoring (placement C)

- Evening before a lecture day → nothing to surface yet (Before class is not
  rendered), so **anchoring affects ordering only**: within 24h after a
  lecture, `Just covered` sorts to the top.
- **No schedule set → everything still works**, with no timing nudge and **no
  "set your schedule to unlock this" prompt.**

### 4d. Class-type parity

STEM only. **General classes get no panel at all** — not a disabled one.
Writing is out of scope here; its own steps are a separate surface.

---

## 5. Do not break

- **Do not build Pretest, Predict, Connect, `TopicLink`, or Full mock.** They
  are §6.6 and need their own drawings, decisions, and manifest rows.
- **Do not render a group whose action does not exist.**
- **Do not modify** `TopicRow`'s existing bar/figure/chip (C2), `fsrs.ts`,
  `activeRecall.ts`, or the recall runner. No store schema change, no migration.
- **No `U-9` violation:** no dot tally, no completion percentage, no progress
  bar, no ranking of topics.
- **Do not fork** an existing card, collapsible, or `MascotNote`.
- `_visual-recipes.md` values are **literal**.

---

## 6. Done when

- [ ] The track renders on every topic row, **after** the bar/figure/chip, with
      nine dots in three groups — asserted in a test.
- [ ] Steps with no engine render hollow and cannot be filled — asserted.
- [ ] The panel renders **only** `Just covered` and `Due to review`.
      `rg -i "pretest|predict|connect it|full mock"` over the new component
      returns **nothing**.
- [ ] Each group collapses when empty; **when both are empty the panel emits no
      DOM at all** — asserted in a test, not by eye.
- [ ] `Recall it` and `Start review` both reach the existing runner.
- [ ] A class with no meeting schedule renders every group, with no nudge and
      no prompt to set one.
- [ ] General-type classes render no panel.
- [ ] `git diff --stat` shows **no change** to `fsrs.ts` or `activeRecall.ts`.
- [ ] `rg -n -iE "of 9|progress|score|rank|composite"` over the new component
      returns nothing.
- [ ] Real records only — no fixture.
- [ ] Signed-out mode; both themes; keyboard reachable; reduced motion.
- [ ] `npm run test` and `npm run build` pass.
- [ ] Checked against frames 1, 2a, 2b and 3, and the decision record receives
      the commit **including which groups were deliberately withheld and why.**

---

## 7. Commit

```
feat(academics): add the study-method track and panel (§4.1-K)
```

---

## 8. Next stage — NOT in scope

**§6.6's four missing features**, in the spec's own order of importance:
**Connect** first — *"the largest missing piece"*, and the only one with a
defined schema (`TopicLink`) — then Pretest, Predict, and Full mock. Each needs
a drawing, a decision record, and a manifest row before it can be built.

Each one that lands turns on another group of this panel, with no rework here.
