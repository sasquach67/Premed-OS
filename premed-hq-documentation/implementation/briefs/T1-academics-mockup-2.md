# T1 · Academics — study-cycle, forgetting curve, and the wrong-document state

**Stage:** A · NOT DRAWN

**Scope:** Academics only. This is a **drawing brief**. It does not authorize
changes to `src/`, the persisted store, migrations, Supabase, cloud
configuration, or `BUILD-MANIFEST.md`.

**Why a second Stage-A brief.** `T1-academics-mockup.md` (Aug 17) closed a
different set of paper gaps — Learning signals, Grade decisions, Materials
failure states, Planner action consequences. It did not look at §4.1-K, §4.1-L,
or the third state of §4.1-M-d, and neither did `T1-academics-decisions.md` or
`T1-academics-build.md`. Those three are still undrawn. The file is numbered
`-2` so the earlier Stage-A record is preserved rather than overwritten.

---

## 1. Fidelity audit — completed before this brief

### a. Spec → paper

Three ruled Academics features have **no mockup surface at all** — no panel, no
frame, no state, in any file under `mockup-lab/01-academics/`.

| Ruled feature | Binding spec | Evidence it is undrawn |
|---|---|---|
| **Study method · UNPATCHED 2026** — the study-cycle surface | `tabs/01-academics.md` §4.1-K (and §6.6, the nine-step cycle it renders) | `grep -rli "unpatched\|9-dot\|nine-step\|lifecycle" mockup-lab/01-academics/` returns **nothing**. Three ruled placements (per-topic dot track, class-Overview panel, lecture-day anchoring) have no drawing. |
| **Forgetting curve** — the sawtooth panel | `tabs/01-academics.md` §4.1-L | The spec's own header says *"**Mockup:** the sawtooth panel"* — **that mockup does not exist.** `grep -rli "sawtooth\|ebbinghaus\|retention" mockup-lab/01-academics/*.html` hits only `academics-tar-heel-tracker.html` and `academics-planning-decisions.html`, neither of which draws a curve. The only mention of a forgetting curve in the Academics mockups is a *negative* one in `academics-class-types.html:446` (“no greyed-out forgetting curve”). |
| **Wrong document** — the third §4.1-M-d state | `tabs/01-academics.md` §4.1-M-d; carried into `D9-syllabus-ingestion.md` §5 line 117 as in-scope | `academics-syllabus-import.html` draws three frames: upload, review, and re-import + **nothing-parsed**. The recovery card at lines 615–658 covers scans only. The ruled *"doesn't read as a syllabus → offer to file it in Materials"* route is drawn nowhere, including `academics-materials-extensions.html`, which draws catalog, Canvas feed, generate, feed-unavailable, guide-result, and guide-unavailable — and no misfiled-document route. |

No other ruled Academics feature is presently unpaperd. Anki export (§4.1-S),
the what-if calculator (§6.5), exam/resource catalog (§4.1-P), lecture capture
(§4.1-Q), coverage (§6.4), and the attention budget (§6.11) all have surfaces.

### b. Mockup → app

| Surface | App evidence | Audit result |
|---|---|---|
| Study method · UNPATCHED 2026 | No component, no selector, no copy. `grep -rn -i "unpatched\|9-dot\|nine-step" src/` returns nothing | **Neither drawn nor built.** |
| Forgetting curve | `src/lib/academics/fsrs.ts:48` exports `topicRetrievability`, and **nothing imports it** — `grep -rn "topicRetrievability" src/ \| grep -v fsrs.ts` is empty. No SVG, polyline, or path exists in `src/components/academics/*.tsx` | **Neither drawn nor built.** The maths is present and dead; the surface it exists for was never designed. |
| Wrong document | No handling. `grep -rn -iE "wrong document\|file it in materials" src/` returns nothing | **Neither drawn nor built.** Scan detection (`proposal.scanDetected`, `ClassCenter.tsx:2196`) is a *different* state and does not cover it. |
| Syllabus import upload / review / re-import | `ClassCenter.tsx:2117-2202`, `syllabusReimport.ts` | Behaviour shipped. Its **visual** translation is a Stage-E gap and is **not** this brief's business — see §7. |

### c. Already built — do not rebuild, do not redraw

- Class-scoped Exam Prep mode: `1fb6ea7`.
- Syllabus Import decision record (appearance now complete): `6efb8ba`.
- Syllabus parsing, local retention, scoped import, identity-based re-import:
  `69a0b41`, `93bfeb8`, `1ee2c87`.
- Class Center / Class Hub ownership: `9f4d3ac`, `7ddf493`.
- Zero-class launchpad and class types: `cb963a3`. Active-recall runner: `9f9d98a`.

### d. Gate

**This brief builds nothing, so the gate does not bind it.** Recorded for the
pass that follows: none of the three surfaces below has a `BUILD-MANIFEST.md`
row at all. **Drawing them does not create one.** Andy adds the rows if and
when he wants them built.

### e. Decisions files

Each new source in §3 must ship with a companion `.md` recording **behaviour
AND appearance**. A behaviour-only record is what produced the syllabus review
screen that works and looks wrong; `VARIANT-LAB.md` §3 names it explicitly.

### f. Integrations and services

**None of the three surfaces needs an external service.**

- The study-cycle panel is derived entirely from existing local records —
  `ClassWorkspace` meeting days, topic state, `TopicLink`, FSRS due dates.
  §4.1-K: *"it costs no AI."* **CODE MISSING** for the surface; no dependency.
- The forgetting curve is deterministic from FSRS stability/retrievability.
  §4.1-L: *"No API."* `fsrs.ts` already computes it. **CODE MISSING** for the
  surface; no dependency.
- The wrong-document route files into Materials, which is device-local
  (`localBlobStore.ts` → `idb-keyval`; bytes never enter Zustand, localStorage,
  export, or sync). **CODE MISSING**; no dependency.

**No ANDY CHECKLIST items arise from this brief.** Nothing here waits on a
console, an OAuth client, an API enablement, a repo secret, or a `.env` value.

---

## ⚠️ 2. Conflicts — Andy decides these. Do not draw past them.

**Two of the three surfaces collide with `U-9`,** and `TAB-BRIEF-PROMPT.md` is
explicit that the rule wins and the conflict gets flagged rather than drawn.

> `U-9` (`05-experience-pillar.md:111`): *"Nothing is scored, ranked, or
> compared — not against a bar, not against other students, not against the
> student's own past. No invented composites."*

| # | Conflict | Spec text | Why it collides |
|---|---|---|---|
| **C1** | **The exam-day retention number** | §4.1-L: an exam line *"with the projected retention where the curve crosses it: `≈78% on exam day`."* | A projected percentage of the student against their own future is a score. It is also a **prediction**, which §6.14 (observed vs self-reported) and §6.12 (trust) both constrain. **Defensible reading:** FSRS retrievability is a deterministic model output, not an invented composite — but it is still rendered as a percentage about the student. **This is Andy's call, and the curve cannot be drawn until it is made.** |
| **C2** | **The retrievability bar** | §4.1-K-A: *"the existing status chip and retrievability bar stay; the track sits beside them."* | `U-9` forbids a progress bar outright. The spec sentence assumes a bar that, per the audit, **does not exist in `src/` anyway** — nothing renders `topicRetrievability`. So this is a spec sentence describing a component that was never built and that the rule would forbid. |
| **C3** | **`academics-requirements.html` is a `YES` manifest row for a file that does not exist** | `BUILD-MANIFEST.md`, Academics · Planning | The file is absent from `mockup-lab/01-academics/` entirely, and the working tree carries an **unstaged deletion** of both `.html` and `.md` from `specifications/mockups/01-academics/`. A cleared row pointing at nothing. **Only Andy flips or removes a manifest row.** Not touched by this brief. |

**Also recorded, not a blocker:** shareable parses (§4.1-M #56) were
deliberately deferred by `D9-syllabus-ingestion.md` §1 — *"a sharing brief comes
after"* — but that deferral **is not recorded in `implementation/deferred.md`.**
It survives only inside a completed brief, which is where deferrals go to be
forgotten. Worth a line in the registry.

---

## 3. References — read all of these before drawing

| What | Where |
|---|---|
| Study-cycle rules, three placements | `premed-hq-documentation/tabs/01-academics.md` §4.1-K |
| The nine-step cycle it renders | `tabs/01-academics.md` §6.6 |
| Forgetting curve rules | `tabs/01-academics.md` §4.1-L |
| Wrong-document rule | `tabs/01-academics.md` §4.1-M-d; `implementation/briefs/D9-syllabus-ingestion.md` §5 |
| The flow the wrong-document state joins | `mockup-lab/01-academics/academics-syllabus-import.html` (all 3 frames) **and** `academics-syllabus-import.md` |
| Where the panel and track live | `mockup-lab/01-academics/academics-class-hub.html`; `academics-class-types.html` (STEM vs Writing vs General parity) |
| Where a misfiled document lands | `mockup-lab/01-academics/academics-materials-extensions.html` |
| ⚠️ Literal visual values | `mockup-lab/_shared/_visual-recipes.md` — **used literally, never approximated** |
| Mascot note pattern | `mockup-lab/_shared/mascot-note-pattern.html` |
| Component reuse | `premed-hq-documentation/implementation/component-inventory.md` |
| The rules that bind every surface | `specifications/05-experience-pillar.md` (`U-1`…`U-12`, esp. `U-9`) |
| Craft standards | `specifications/04-visual-craft-standards.md` |

---

## 4. The work — draw these three, nothing else

**Deliverable per surface: one `.html` source in `mockup-lab/01-academics/` plus
a companion `.md` recording behaviour AND appearance.** Follow the frame-label
convention already used by `academics-syllabus-import.html`.

### 4a. `academics-study-method.html` — Study method · UNPATCHED 2026 (§4.1-K)

Draw **three placements**, because the spec rules three and they are different
jobs:

1. **Per-topic dot track (the atom).** The 9-dot track in three groups —
   `before ● ● ○ · after ● ○ ○ · retain ● ● ○`, labelled
   `prime pretest predict · recall feynman connect · spaced practice mock`.
   Filled = done, hollow = not. Hover names the step. It **sits beside** the
   existing status chip; it replaces nothing. **No animation on load** — the
   track encodes state and is decorative-free.
2. **The class-Overview panel (the hand-holding).** A *section*, never a tab.
   Groups by what stage each topic needs next: Before class · Just covered ·
   Needs connecting · Due to review · Exam-ready check. Each carries a count,
   each collapses when empty, and **the whole panel disappears when every
   group is empty.** Draw that vanished state — it is a congratulation, not a
   blank panel.
3. **Lecture-day anchoring (the timing).** Draw the evening-before state and
   the within-24h state, plus the **no-schedule-set** state, which must still
   work without the timing nudge.

**Rules that bind the drawing:**
- **Never draw all nine steps as a checklist.** Show only the *next* step per
  topic. A checklist converts a learning cycle into a chore list.
- **Skipping is legitimate.** The panel surfaces opportunities; it never
  scolds. No "you missed a step", no completion percentage, no `U-9` bar.
- **One `MascotNote` maximum**, teaching Pretest first (the counter-intuitive
  one).
- Class-type parity per §4.1-N: say plainly what Writing and General show. Per
  `academics-class-types.html`, **no greyed-out shells** — different features,
  not gaps.

### 4b. `academics-forgetting-curve.html` — the sawtooth panel (§4.1-L)

**⚠️ Blocked on C1. Draw the panel with the exam-day number left as an
explicit open slot, and state the conflict in the companion `.md`. Do not pick
a resolution.** Everything else in the panel is drawable now.

- Retention over time for **one** topic — never a spaghetti of eighteen.
- Each review is a vertical reset to 100%; **each reset flattens the following
  decay** so the gaps widen (`2 → 5 → 12 → 26 days`).
- **History is solid, projection is dashed. Never blur the two.**
- The always-present plain-language legend: each review resets you to 100% ·
  every reset slows the next fall · reviews are timed just before you'd forget.
- **Fewer than two reviews → the honest "not enough history yet" state**, never
  a fabricated shape. Draw it.
- Draw the entry points: from a topic row, and from the exam-scope panel.

### 4c. Wrong-document state (§4.1-M-d) — a **fourth frame** on the existing source

**Extend `academics-syllabus-import.html`; do not create a new file.** The
state belongs to that flow and its `.md` already records the composition it
must match.

- Reached when the upload doesn't read as a syllabus (a problem set, a slide
  deck). **Say so plainly.**
- **Offer to file it in Materials, which is where it belongs** — the primary
  route, not a footnote.
- It is a **contained recovery card inside the same review composition**, per
  `academics-syllabus-import.md` → Appearance. It must not replace the whole
  screen with an error state, and it must be visually distinct from the
  existing nothing-parsed/scan card, which is a different diagnosis.
- **The file is kept either way.** Never a dead end, never a bare error.
- Update `academics-syllabus-import.md` to record this frame's behaviour and
  appearance alongside the other three.

---

## 5. Do not break

- **Do not touch `src/`.** This brief draws. Nothing is coded this pass.
- **Do not flip a `BUILD-MANIFEST.md` row.** Only Andy does that.
- **Do not resolve C1, C2, or C3.** Record them; leave them for Andy.
- **Do not redraw** Learning signals, Grade decisions, Materials extensions,
  Planning decisions, lecture capture, cold start, or term rollover — the
  earlier Stage-A pass drew them and they are awaiting their own commit.
- **Do not commit the unrelated working-tree changes.** The tree carries ~114
  modified files from another session, including 8 staged Academics mockups
  and two unstaged deletions. **They are not this brief's to stage.**
- `_visual-recipes.md` values are **literal, never approximated.**
- Reuse `AnimatedFileUpload`, `MascotNote`, `InteractiveCard`/`Collapsible`.
  **Do not fork a component to change it.**

---

## 6. Done when — every item provable

- [ ] `mockup-lab/01-academics/academics-study-method.html` exists and draws
      all three §4.1-K placements, including the **empty/vanished** panel state.
- [ ] `mockup-lab/01-academics/academics-forgetting-curve.html` exists, draws
      solid history and dashed projection distinctly, and draws the
      "not enough history yet" state.
- [ ] `academics-syllabus-import.html` has a **fourth** frame for the
      wrong-document state; `grep -c 'FRAME [0-9]'` on that file returns `4`.
- [ ] Each new source has a companion `.md` with **both** a `## Behaviour` and
      an `## Appearance` section: `grep -c '^## Appearance'` returns `1` for
      `academics-study-method.md` and `academics-forgetting-curve.md`.
- [ ] `academics-syllabus-import.md` records the wrong-document frame.
- [ ] **No `U-9` violation is drawn.** `grep -n -iE "score|composite|rank|progress bar|[0-9]+%"` over the new sources finds no output claim about the student except the C1 slot, which is explicitly labelled unresolved.
- [ ] No checklist of all nine steps appears in any new source.
- [ ] C1, C2, and C3 are each recorded in a companion `.md` as open and
      Andy-owned.
- [ ] `git status --porcelain src/` is **empty** — this brief touched no code.
- [ ] The ~114 pre-existing working-tree changes remain uncommitted and
      unstaged by this pass.

---

## 7. Commit

```
docs(mockups): draw the Academics study cycle and forgetting curve
```

One commit, mockup sources and their decision records only. **Unrelated
working-tree changes commit separately.**

---

## 8. Next stage — NOT in scope for this brief

After these are drawn and Andy has picked variants and resolved C1–C3, rerun
`TAB-BRIEF-PROMPT.md` for Academics. The expected next stop is **B · DRAWN,
NOT DECIDED** for the new sources, and after that **E · FRONTEND MISSING** for
Syllabus Import — whose behaviour is shipped and whose decision record is
complete, but which renders as a `max-w-xl` `Dialog` with `<details>`
accordions (`ClassCenter.tsx:2182-2202`) instead of the ruled **temporary
full-screen flow** (§4.1-M-a) with the layered banner, the narrow reading
column, and the `1fr 372px` split with a sticky Apply rail that
`academics-syllabus-import.md` → Appearance describes.

**That fidelity work is not authorized here.** Neither is any implementation of
§4.1-K or §4.1-L, which have no manifest rows at all.
