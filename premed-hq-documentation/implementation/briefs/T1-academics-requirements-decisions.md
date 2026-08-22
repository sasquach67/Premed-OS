# T1 · Academics → Requirements — visual decisions

**Stage:** B · DRAWN, NOT DECIDED

**Scope:** Rule the three visual treatments for the Requirements / Tar Heel
Tracker product views: `audit`, `requirements`, and `prior-credit`. This is a
decision pass only. It authorizes **no `src/`, data, migration, manifest, or
completion-math change**.

The screen is manifest-cleared, but the manifest's restriction is binding:
this can become a transparent planning library, never an official graduation
audit or a calculation that claims a student has met a degree requirement.

---

## 1. Fidelity audit

### a) Spec → paper

Every currently buildable Requirements surface is drawn:

| Ruled surface | Paper location | Status |
|---|---|---|
| Gap and pace, named unscheduled items, suggested next term, overlap | `academics-requirements.html` → `audit` | Drawn |
| Requirement sets with source and confidence treatment | `…` → `requirements` | Drawn |
| Transcript-exact AP / transfer / dual-enrollment record | `…` → `prior-credit` | Drawn |

The following are deliberately **not** a requirement-screen build gap:

- Course-to-requirement completion logic: the flat dataset cannot express
  choices, credit minima, exclusions, or double-count rules accurately.
- Official degree-clearance claims: ConnectCarolina remains authoritative.
- Catalog/Atlas suggestions and live course availability: those are separate
  data/integration dependencies, not a license to invent a completion result.

### b) Mockup → app

| Mockup surface | In `src/`? | Match? |
|---|---|---|
| Requirements / Tar Heel Tracker | Yes — `TarHeelTracker()` in `src/pages/Academics.tsx` | **No.** It is an older three-column planner/checklist with totals, progress controls, and computed requirement status; it is not the mockup's calm audit composition or its three product views. |
| `audit` view | No | Not translated. |
| `requirements` view | No | Not translated. |
| `prior-credit` view | No | Not translated. |

**Measured ladder — live app, Aug. 22**

| Surface | Mockup value | Running-app value |
|---|---:|---:|
| Page background | `#1a1714` | `rgb(33, 30, 26)` / `#211e1a` |
| Primary card | `#2b2722`, `16px` | `rgb(43, 39, 34)` / `#2b2722`, `16px` |
| Inner data surface | `#322e28`, `13px` | Not established as the primary audit rung; the current sidebar/checklist repeats the card surface instead. |

The palette base is close, but the hierarchy is not evidence of fidelity: the
app has not translated the mockup's verdict-led bento, nested muted data
surfaces, or product-view-specific hierarchy.

### c) Already built — do not rebuild

| Existing work | Commit / boundary |
|---|---|
| Planner slots, summer/gap-year rows, locking, and scenario persistence | `b4f9a2e` — Planner owns term building; leave it alone. |
| Planner decision states | `088144b` — do not turn Requirements into a second Planner. |
| Transcript-shaped course fields and persisted `requirements` collection | Existing app/store model — preserve all records; do not change localStorage shape in this pass. |

### d) Build gate

`BUILD-MANIFEST.md` clears `01-academics/academics-requirements.html` **YES**
for the **screen only**. It explicitly does **not** clear completion maths.
`academics-tar-heel-tracker.html` has no manifest row and is not an alternate
source of permission.

### e) Decisions record

`academics-requirements.md` records both behaviour and appearance, so this is
not an appearance-documentation gap. It intentionally holds three treatments;
none is marked as the selected product treatment:

| Product view | A | B | C |
|---|---|---|---|
| `audit` | Verdict-led bento | Pace as working surface | Two-column audit |
| `requirements` | Grouped sets | Gap-first; met rows recede | Two-column sets |
| `prior-credit` | Ledger with context | Ledger only | Entry-first |

### f) Integrations and data boundary

| Dependency | State | What that means now |
|---|---|---|
| Persisted courses and requirement records | Code built | Existing user records can be read; this pass must not reclassify or discard them. |
| `data/unc-requirements.json` | Present, **not safe to compute from** | Five of six majors are unverified and the schema cannot model catalog rules; it may inform labelled library copy, never a completion verdict. |
| ConnectCarolina degree audit | External and authoritative | No integration is built or needed for this visual-decision pass. The future screen must name it as the official record. |

---

## 2. References

- Mockup: `mockup-lab/01-academics/academics-requirements.html`
- Decisions: `mockup-lab/01-academics/academics-requirements.md`
- Shared visual rules: `mockup-lab/_shared/_visual-recipes.md`
- Behaviour: `premed-hq-documentation/tabs/01-academics.md` §4.2-A and §4.2-D
- Gate: `premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md`
- Components: `premed-hq-documentation/implementation/component-inventory.md`
- Universal rules: `premed-hq-documentation/general.md` — especially U-5 and U-9

---

## 3. The decision to make

Choose one treatment for each product view in the variant lab and record it in
`academics-requirements.md` before code starts.

The recommended coherent set is **A / B / A**:

1. **Audit A — verdict-led bento.** This makes the occasional check-in legible
   without becoming another course-planning workspace.
2. **All requirements B — gap-first.** Open or uncertain requirements lead;
   met rows recede while remaining present for traceability.
3. **Prior credit A — ledger with context.** Exact transcript strings lead, with
   the display name and provenance visible beside them.

If a different set is chosen, state why it better protects the boundary:
Requirements can name what the local planning library contains and what needs
verification; it cannot certify graduation, auto-place a course, calculate a
degree percentage, or create a synthetic "on pace" result.

---

## 4. Do not break

- Do not edit `src/`, data, migrations, or the manifest in this pass.
- Do not promote `academics-tar-heel-tracker.html` or build from it; it is not
  manifest-cleared.
- No completion ring, degree percentage, aggregate score, ranking, or hidden
  recommendation logic (`U-9`).
- Do not change Planner ownership of term construction or the persisted course
  and transcript fields.
- Existing app annotations remain product rulings; a future build must preserve
  them even if an older mockup differs.

---

## 5. Done when

- [ ] Andy has selected A/B/C for `audit`, `requirements`, and `prior-credit`.
- [ ] `academics-requirements.md` records the selected treatment and its visual
      hierarchy, rather than merely the letter.
- [ ] The decision explicitly repeats the screen-only / no-completion-maths
      gate.
- [ ] No app or data file changed in this decision commit.

---

## 6. Commit

```
docs(academics): rule Requirements audit treatments
```

## 7. Next stage — not in this brief

After the treatment is ruled, rerun the tab brief prompt. It should land on
**C · full implementation** for the manifest-cleared Requirements screen:
translate the selected visual composition and its empty/mobile/keyboard states
while preserving real records and suppressing every calculation the data cannot
support. That later brief must not build the uncleared `academics-tar-heel-tracker`
mockup or completion maths.
