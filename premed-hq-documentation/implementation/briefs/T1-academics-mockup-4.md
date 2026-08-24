# T1 · Academics — Flashcards V1 and the class full mock

**Stage:** A · NOT DRAWN

**Scope:** Draw two missing Academics interaction surfaces only. This is a
mockup-lab pass; it does **not** authorize changes to `src/`, the persisted
store, Supabase, provider configuration, Anki, or `BUILD-MANIFEST.md`.

---

## 1. Fidelity audit — completed before this brief

### a. Spec → paper

The broad Class Hub and Materials drawings establish where study tools live,
but they do not draw the two concrete surfaces below. A mention in a mockup's
header or a future-facing button label is not a reviewable product state.

| Ruled feature with no usable paper surface | Binding source | Evidence | What must become visible |
|---|---|---|---|
| **Flashcards V1 → one-way Anki export** | `tabs/01-academics.md` §6.2 #7 and acceptance criteria; `specifications/generation/04-flashcards-v1.md` §§1–14 | `academics-class-hub.html` says “Make flashcards → Anki” only in an old conceptual source; the current five-tab Class Hub drawing makes study guide the visible generated artifact. `academics-materials-extensions.html` draws only source selection and a study-guide result. | A student-material-grounded flashcard review/output state: selected sources, card-count and type breakdown, one concrete card with its **Extra** example, provenance, and one-way `.apkg` / TSV export. It must show that Premed OS never schedules, imports back, or reports Anki review state. |
| **Class full mock and post-exam autopsy** | `tabs/01-academics.md` §6.6 “Full mock”, §4.1-R, §6.2 generation policy, and acceptance criteria | `academics-exam-prep-mode.html` draws plan pacing, catch-up, and exam-day closeout. It has no timed runner, answer/review state, or autopsy tied to a real class exam scope. | The bounded progression from an exam-scope check to a focused timed attempt to a post-attempt autopsy. It must read each topic-level outcome against the student’s own sources, never claim a readiness score or forecast an actual exam result. |

These are one connected study loop, but **not one new top-level page**:

- Flashcards belong inside the existing **Class Hub → Materials** generation
  path. The source selection step is shared with the existing study-guide
  drawing; do not draw a second generator home.
- A full mock belongs inside existing **Exam Prep mode**, launched from that
  class’s named exam scope. It is a temporary focused mode, not a sixth Class
  Hub tab and not an MCAT screen.

### b. Mockup → app

| Surface | Current app evidence | Audit result |
|---|---|---|
| Daily Class Center visual ladder | Running `#/academics?mode=daily&tab=class-center` measured Aug 20: page `rgb(33, 30, 26)` / `#211e1a`; outer card `rgb(43, 39, 34)` / `#2b2722`, `16px`; class card `rgb(50, 46, 40)` / `#322e28`, `13px` | **Pass.** The primary existing surface matches the approved dark recipe; this brief must reuse it rather than redraw the shell. |
| Study-guide generation | `src/lib/academics/generateStudyGuide.ts`; `ClassHub.tsx:1196–1238`; `492832f` | **Built.** It is a model for material selection, `Generated` ownership, provenance, and scoped failure—not a substitute for Flashcards V1. |
| Flashcards V1 | `src/lib/generation/artifacts/registry.ts:5–17` deliberately omits `flashcards-v1`; no `src/` caller renders or exports cards | **Neither drawn nor built.** This is the first missing stage. |
| Full mock | `src/lib/academics/studyMethod.ts:7–10, 40–49, 93–96` marks `mock` `hasEngine: false`; no runner or autopsy owner exists | **Neither drawn nor built.** |
| Exam Prep plan | `src/components/academics/ExamPrepMode.tsx`; `1fb6ea7` | **Built.** Do not rebuild its plan, pace, catch-up, or closeout while drawing the missing nested state. |

### c. Already built — do not redraw or rebuild

- Syllabus import, local file retention, scoped entry, dates, and re-import:
  `e638095`, `ac23637`, `28011d4`, `227cfb0`.
- The course-material add path: `1f5d908`.
- Existing Class Center and Class Hub ownership: `9f4d3ac`, `7ddf493`.
- Exam Prep mode: `1fb6ea7`.
- Grounded study-guide generation: `492832f`.
- The full learning-cycle steps already backed by deterministic engines:
  TopicLink/Connect `e44b4ca`, Predict `415c025`, and Pretest `87cfc20`.

### d. Gate

`BUILD-MANIFEST.md` marks both affected existing sources **YES**:

| Existing source being extended | Manifest row | Permission after drawing |
|---|---|---|
| `01-academics/academics-materials-extensions.html` | YES | Flashcards V1 may later be built **inside Materials** without a new surface row. |
| `01-academics/academics-exam-prep-mode.html` | YES | The full-mock states may later be built **inside Exam Prep** without a new surface row. |

This gate does not authorize this drawing pass to change application code. Do
not edit the manifest.

### e. Decision-file audit

`academics-materials-extensions.md` and `academics-exam-prep-mode.md` already
record behavior and appearance: the existing Materials source-map treatment;
the existing full-screen Exam Prep hierarchy; solid-with-depth inner surfaces;
and glass restricted to a floating banner surface. They need **extensions for
the new states**, not a second parallel decision file.

The class-hub decision record establishes the location and one-way Anki
boundary. Its old conceptual text must not be copied as an Anki-sync feature.

### f. Integrations and services

| Dependency | Classification | Required honest state in the drawing |
|---|---|---|
| Grounded generation through `study-tools` | **CODE BUILT; runtime configuration must be verified before a live call** | Source selection precedes every request. An unavailable state keeps sources selected and offers a manual path; it never supplies general course content. |
| `flashcards-v1` generator + `.apkg` builder | **CODE MISSING** | The drawing shows a generated artifact only after a completed request. It must not imply that export works today. |
| Anki / AnkiConnect | **NO LIVE INTEGRATION REQUIRED** | Export is one way. “Open in Anki” may be shown only as a local optional handoff after a completed export; no sync, scheduler, queue, imported history, or review status. |
| Full-mock generator and timed-session persistence | **CODE MISSING** | The drawing must include an honest no-eligible-material/no-exam-scope state, not a fake exam. |

No cloud-console work is part of this drawing brief.

---

## 2. References — read before drawing

| What | Where |
|---|---|
| Flashcard source, writing, Extra, quality, and export rules | `premed-hq-documentation/specifications/generation/04-flashcards-v1.md` §§1–14, especially §9.1 and §14 |
| Academics placement, grounding, full-mock, and no-scheduler rules | `premed-hq-documentation/tabs/01-academics.md` §§4.1-I, 4.1-J, 4.1-R, 6.2, 6.3, 6.6, 6.13, 13 |
| Existing Materials source-map treatment | `mockup-lab/01-academics/academics-materials-extensions.html` and `.md` |
| Existing Exam Prep composition | `mockup-lab/01-academics/academics-exam-prep-mode.html` and `.md` |
| Existing per-class placement | `mockup-lab/01-academics/academics-class-hub.html` and `.md` |
| Literal visual recipes | `mockup-lab/_shared/_visual-recipes.md` |
| Shared interaction rules | `premed-hq-documentation/specifications/01-shared-interface-patterns.md` §§2–5 |
| Translation precedence | `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md` |

---

## 3. Work — Stage A only

### 3.1 Extend Materials with Flashcards V1 states

Extend **only** `mockup-lab/01-academics/academics-materials-extensions.html`
and its companion `.md`. Register the new state views under the existing
Materials source in `variant-lab.html`; keep status `proposed` until Andy
approves them.

Draw these states inside the existing Materials frame:

1. **Artifact choice after source selection.** Existing selected source nodes
   feed a quiet output chooser: study guide remains primary; Flashcards is a
   deliberate alternate artifact. Explain the scope in one line: cards will
   come only from the selected material.
2. **Flashcard result and quality review.** Show a compact deck summary,
   material provenance, card-type mix, and one card at readable scale. Its
   Extra demonstrates the `Ex:` relationship rule from Flashcards V1: a brief
   familiar example that relates a hard concept without re-explaining or
   dumbing it down. Keep the answer concise; the example belongs in Extra.
3. **Export handoff.** `.apkg` is the primary target and TSV is a transparent
   fallback. It says exactly what the file contains and that this is a one-way
   handoff. The app does not import or schedule it later.
4. **Unavailable / source-insufficient recovery.** Preserve selection and
   state exactly what is missing. Never fabricate a deck, a source, a card
   count, or a successful export.

Do **not** try A/B/C for this sequence. Its location and source-map hierarchy
are already locked by Materials and Flashcards V1; variations would duplicate
one generator interaction under different decoration.

### 3.2 Extend Exam Prep with full-mock states

Extend **only** `mockup-lab/01-academics/academics-exam-prep-mode.html` and
its companion `.md`; expose three new internal Exam Prep views in the existing
lab source.

1. **Eligibility / start.** Name the selected exam scope and the exact
   student-supplied sources behind it. With too little material or no exam
   scope, show the dormant-with-a-reason state and route back to Materials or
   exam-scope setup.
2. **Focused timed runner.** Draw the temporary runner with an explicit end
   action, real class identity, source-backed question context, and no permanent
   sidebar/tab system. It may show elapsed time; it must not offer pause/peek
   controls or advertise an AI-written exam as a real past/upcoming exam.
3. **Post-mock autopsy.** Show topic-level evidence the student can act on:
   what was missed, what was self-flagged, source links, and a next action to
   review or connect a topic. Do not turn the result into a readiness score,
   rank, composite, or prediction of the real exam.

No A/B/C treatment is needed: Exam Prep's temporary focused frame, dominant
today/work surface, and quiet closure are already settled. These are state
completions within that one composition.

### 3.3 Update the companion records

For both changed `.md` files, append exact behavior **and** appearance:

- location/handoff and the data each state may read;
- warm-dark and paper surface ladder values/radii from `_visual-recipes.md`;
- where glass is and why it is allowed;
- empty/unavailable/recovery state wording;
- reduced-motion behavior; and
- the explicit no-sync/no-scheduler/no-claimed-exam boundaries.

---

## 4. Do not break

- Do not touch `src/`, Supabase, localStorage/migrations, provider secrets, or
  `BUILD-MANIFEST.md`.
- Do not add a new Academics tab, a second generator home, or a separate
  flashcard-review surface in Premed OS.
- Do not copy mockup CSS into app-facing instructions; recipe values belong in
  the mockup and the eventual build translates them through app tokens.
- Cards derive only from student-supplied class material: uploaded notes,
  slides, readings, syllabi, transcripts, or the student's own missed work.
  No bundled/pre-authored deck and no outside fill-in content.
- `.apkg`/TSV is one-way. Anki owns card scheduling and review; Premed OS owns
  its topic-level review loop. Never draw an Anki sync chip.
- No U-9 defect: no composite learning/readiness score, rank, completion bar,
  or unsupported forecast.
- Do not draw a Flashcards V1 result as if it is already built. The source must
  label it `proposed`; the state is a design target, not a live claim.

---

## 5. Done when

- `academics-materials-extensions.html` has real, reachable internal states
  for Flashcards V1 result, export, and source-insufficient/unavailable
  recovery—not header prose or a placeholder.
- `academics-exam-prep-mode.html` has real, reachable internal states for full
  mock eligibility, timed run, and autopsy—not a generic “practice exam” label.
- Both companion records describe behavior **and** appearance, including paper
  and warm-dark recipes and the one-way Anki rule.
- New states are registered in `variant-lab.html` with `status:"proposed"` and
  fit under existing Materials/Exam Prep navigation; no extra top-level page
  appears.
- No mockup depicts fake sources, an actual professor exam, an Anki queue, or a
  readiness/composite score.
- `git diff --name-only -- src/` is empty.

---

## 6. Commit

One commit, drawing sources and their lab registration only:

```
docs(mockups): draw Academics flashcards and full-mock states
```

---

## 7. Next stage — named, not in scope here

After Andy reviews and approves these two state sets, rerun
`TAB-BRIEF-PROMPT.md` for Academics. The next brief must re-audit every stage.
It must not assume these visuals make the engines exist: Flashcards V1/export
and the full-mock runner remain backend-plus-frontend work with tests,
persistence, grounded-output verification, and runtime provider configuration.
