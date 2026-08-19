# T1 · Academics — Planner composition decision

**Stage:** B · DRAWN, NOT DECIDED · **EXECUTED Aug 19, 2026 — A + C ruled**

**Scope:** Choose the Planner's composition. Decision pass only — no `src/`,
store, migration, or manifest change is authorized here.

---

## 1. Why the chain stops here

Three passes in a row have ended by naming the same missing thing:

- `T1-academics-build-11.md` — four of six planning-decision states
  (requirement preview, plan comparison, substitute choice, registered term)
  need a **term board with selectable course tickets**. It does not exist.
- `T1-academics-build-12.md` — the Planner tab is a GPA ledger, which is why
  Planning reads as empty in the app.
- The manifest clears `01-academics/academics-planner-prototype.html` as
  **`YES`**, so the gate is not the blocker.

**The blocker is that the composition was never chosen.** The mockup's own
header says *"PROTOTYPE — not approved for implementation"*, and its `.md` ends
with a question rather than a ruling: *"Which composition best turns the locked
term-column Planner into an understandable course-sequencing tool?"*

Per the ladder, that is Stage B, and the choice is Andy's alone.

---

## 2. What is already locked, whichever variant wins

From the prototype `.md` — **these are not in question and no variant may
change them:**

- Horizontal term columns are the backbone.
- Course chips show code, title, credits, BCPM/AO, what they clear, and
  offering / critical-path signals.
- Past and registered terms can be locked.
- **The MCAT is a milestone divider between terms**, not a sidebar item.
- Unplaced requirements are always visible.
- A live outcome rail shows projected cumulative + BCPM, graduation, the
  prereq-vs-MCAT verdict, open gaps, suggestions, and watch-outs.
- Requirement effects are previewed **before** committing.
- Mapping confidence is explicit; suggestions stay optional.
- **Dragging may exist, but never as the only way to move a course.**

The spec boundary also holds: Planner answers *"what should I take next
term?"* It does **not** pull the full GPA ledger or What-if calculator back in
— those belong to Grades & Archive.

---

## 3. The decision

| | Treatment | The trade |
|---|---|---|
| **A · Timeline first** | Every term visible as one horizontal board, with a persistent live outcome rail. | Closest to the locked spec, best whole-plan visibility, and the MCAT divider and unplaced tray are impossible to miss. **Dense on a laptop once many terms exist.** |
| **B · Next-term builder** | The selected term is the working surface; other terms are a compact navigator, with ranked additions beside it. | The most direct answer to the Planner's literal question, and the easiest to use without dragging. **Weakens the full-sequence view.** |
| **C · Decision inspector** | The board stays visible; selecting a course opens a marginal-effect inspector. | The best treatment of *"if you take this, it clears that"*, and the strongest provenance story. **Selected-course detail competes with whole-plan guidance.** |

**The prototype's own recommendation:** A as the default, because term columns
and a live right rail are already chosen in the specification — and it names
the strongest likely final answer as **A's whole-plan board with C's
selected-course inspector available on demand.**

That mirrors the topic-linking ruling exactly: a primary composition plus a
second, quieter affordance, with the handoff between them written down.

**If A + C is chosen, the handoff must be recorded**, as it was there: what
opens the inspector, what it shows that the chip does not, whether it is a
panel or a peek, and what closing it returns to.

---

## 4. Do not break

- U-9: the outcome rail states projections with their inputs named. No
  readiness score, composite, or "on track" badge.
- A requirement mapping is **verified or inferred, and says which**.
- A suggestion is never auto-placed into a term.
- A registered term is a factual boundary — the planner explains consequences
  but never moves, replaces, or rebalances it, and never enrolls or drops.
- No spring-only offering is silently scheduled into a fall.

## 5. Done when

- [x] Andy has chosen A, B, C, or A + C after opening the prototype.
- [x] The `.md` records the ruling, the composition, mobile, and — if a mix —
      the handoff.
- [x] The header stops saying "not approved for implementation".
- [x] The lab entry moves to `approved`.
- [x] No `src/` change.

## 6. Commit

`docs(mockups): rule the Planner composition`

## 7. Next stage

Stage C: the board itself, then the four planning-decision states it unblocks.
This is the largest remaining Academics chunk and will not fit one pass.
