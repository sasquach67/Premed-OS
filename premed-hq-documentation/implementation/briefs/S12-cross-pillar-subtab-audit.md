# S12 · Cross-pillar sub-tab audit — where the depth actually is

**Built Aug 2026.** Andy: *"I want to make sure that the depth is there for every tab… that we have that full list of features and that everything is comprehensive and that we thought of everything."*

**The per-feature detail lives in the five catalogs and is not restated here.** **This file answers a different question: are the surfaces evenly designed?** The method is asymmetry — **where one pillar has features at a sub-tab and its peers do not, there is either a stated reason or a hole.**

---

## The distribution

**Counted from the `Surface` column of each catalog. Volunteering's numbers count only its delta**, since it inherits Clinical's rows by reference (a ruling, not an oversight).

| Functional slot | Clinical | Volunteering | Shadowing | Extracurriculars | Research |
|---|---|---|---|---|---|
| **The entity** — Sites · Orgs · Physicians · Organizations · Projects | **33** | 13 | 12 | **25** | 4 |
| **The ledger** — Shifts · Events · Visits · Initiatives · Outputs | 8 | **0** | 5 | 4 | 7 |
| **The writing** — Reflections · Lab notes | 4 | **1** | 3 | 6 | **1** |
| **Discover** | — | — | — | 5 | 4 |
| Rules with no surface · shell · Profile | 16 | 7 | 3 | 3 | 6 |

---

## Gap 1 · The writing surface is thin on every pillar except the one fixed today

**Clinical 4 · Shadowing 3 · Volunteering 1 · Research 1.**

**Extracurriculars had 2 until Aug 2026**, when a wave was added after Andy said *"a very very very important tab"* and *"everything written should really end up there."* **That correction applies to four more pillars and was never propagated.**

**The four items added to ECs are not ECs-specific. Every one of them is `core`:**

| | | Why it generalises |
|---|---|---|
| **`R-2` · the moments HQ asks** | Nothing in HQ ever asks for a reflection; the tab exists and waits | **Every pillar has trigger moments and uses none of them.** A shift ends, a visit ends, an output is submitted, a service event finishes |
| **`R-3` · a reflection is a conversation** | Student writes → HQ responds to what they wrote → provokes more. **Sufficiency is shape, not length** | **Andy ruled this for reflections generally**, not for ECs. Shadowing's *"what did you understand today that you didn't yesterday?"* is a better prompt than ECs' and would benefit more |
| **`R-4` · search your own writing** | Plain substring match across reflection bodies | **Sixty reflections and a text box beats sixty reflections and no text box.** Clinical will have the most of anyone |
| **`R-5` · synthesis threads** | Student-grouped, never auto-clustered | **Already specced as mattering most on Shadowing** (#45b: *"what did you learn across six physicians and five specialties?"*) **and it is thinner there than on ECs** |

> **RECOMMENDATION: promote `R-2` to `R-5` into `05-experience-pillar.md` §2b as shared behaviour**, alongside the nine rules. **They are one mechanism configured five ways, not five features.** The prompt copy stays per-pillar; the machinery does not fork — **exactly the ruling `R-S2` already made for the unpacking marker.**

---

## Gap 2 · Volunteering's ledger has zero features of its own, and two are misfiled

**`Events` is the sub-tab where a Volunteering session lives, and the catalog gives it nothing.**

**Partly correct** — it inherits Clinical's eight `Shifts` rows (#63–71) by reference, and month grouping, inline edit, and the hours chart genuinely do not need reinventing.

**But two rows are filed under `Orgs` that describe ledger behaviour:**

| | Currently | Should be |
|---|---|---|
| **`V-12` · one-time events are first-class** | `Orgs` | **`Events`.** *"Events render as rows in one panel, standing commitments as cards, and the panel carries its own hours total"* — **that is a ledger layout rule** |
| **`V-14` · event promotion, "you came back"** | `Orgs` | **`Events`.** A second session on a one-time event triggers it. **The trigger lives on the ledger** |

**Not a design hole — a filing error.** But it hid the fact that **the pillar whose whole thesis is *standing commitment versus one-day event* has no design attention on the surface where that distinction is visible.**

---

## ✅ RESOLUTION — all three closed Aug 2026, and Gap 3 was misdiagnosed

| Gap | What happened |
|---|---|
| **1 · The reflection mechanism** | **CLOSED.** Promoted to `05-experience-pillar.md` §2b-ii as **`RM-1` to `RM-6`** — one mechanism, five pillars, each supplying only its triggers and prompt copy. **Three new rules came out of the propagation:** `RM-2a` (Clinical's exchange minimum cut — it contradicted `U-8`), `RM-2b` (how the conversation ends, including a **ceiling on HQ**, never a floor on the student), and `RM-6` (backfilled entries never carry a marker, app-wide) |
| **2 · Volunteering's ledger** | **CLOSED.** `V-12` and `V-14` moved from `Orgs` to `Events`, and **three features added** — `VE-1` `participation` (an inheritance gap: ECs had it, Volunteering did not, and it matters more here), `VE-2` **annual recurrence as a third shape**, `VE-3` per-event impact figures |
| **3 · The entity tab** | **CLOSED — and the diagnosis below was wrong.** See the correction |

### ⚠️ Gap 3 was a labelling problem, not a design problem

**This audit read 58 rows on two entity tabs and called it bloat. Applying the split disproved it.**

| Surface | `(list)` | `(panel)` | `(page)` |
|---|---|---|---|
| Clinical `Sites` | **3** | 22 | 9 |
| ECs `Organizations` | **2** | 17 | 8 |
| Shadowing `Physicians` | 2 | 10 | 5 |
| Volunteering `Orgs` | 2 | 8 | 2 |
| Research `Projects` | 0 | 3 | 3 |

**The tab was never bloated. The detail panel is dense, and a dense detail panel is what a detail panel is for.** **Clinical's list holds three things** — the list, hours-by-site, the weekly cadence card. **ECs' holds two.** Both are drawable surfaces.

**What was actually missing was the vocabulary to say so**, and a row reading only `Sites` could have meant any of the three.

> **The lesson for the next audit: a count is a symptom, not a diagnosis.** **This file found a real problem twice and a phantom once**, and the phantom was the one with the biggest number attached to it.

**One free answer fell out.** *"The ECs card carries seven things — what survives the squint test?"* had no recorded answer for weeks. **Only two of 27 rows are `(list)`**, which matches the `§1a` minimalist ruling rather than fighting it.

---

## Gap 3 · The entity tab absorbs everything, and nobody decided what belongs on the list versus the panel

**Clinical 33. Extracurriculars 25.** Together that is **58 of the ~120 counted features on two surfaces.**

**Largely legitimate:** the entity tab holds both the list *and* the detail panel, and the panel is genuinely where depth belongs. **A `Site` record carries credentials, contacts, verifier state, target, and hours-here — none of which belong on a list row.**

**The problem is that no catalog distinguishes them.** A row marked `Surface: Sites` might be a list-row element, a detail-panel module, or a nudge that fires on the page — **and a mockup cannot be drawn from that.** Extracurriculars hit this immediately: *"the card carries seven things; what survives the squint test?"* **had no recorded answer.**

> **RECOMMENDATION: split the `Surface` value where the entity tab is concerned** — `Sites (list)` versus `Sites (panel)`. **Cheap, mechanical, and it is the difference between a catalog you can read and a catalog you can draw from.**

---

## What is NOT a gap — checked and cleared

**Recorded so these are not "fixed" by someone reading the numbers without the reasons.**

| Apparent asymmetry | Why it is correct |
|---|---|
| **Research's entity tab has only 4** while its ledger has 7 | **Deliberate and it is the pillar's whole thesis.** *"Output-shaped, not hour-shaped"* — the pipeline is the hero and the project list is secondary. **Inverting this would be the defect** |
| ~~**Only ECs and Research have `Discover`**~~ | **SUPERSEDED Aug 2026 — `Discover` went universal to four of five** (`05-experience-pillar.md` §2a-ii). **This row's reasoning was wrong about Clinical and Volunteering:** *"they record what you already hold"* is true of the ledger, **not of the student who does not hold anything yet.** **Clinical gets paid-role postings; Volunteering gets non-clinical service orgs (`V-BIG-1`).** **Only Shadowing stays out, and only that half of this row survives — `S-36` cut the ask-pipeline and the reason still holds** |
| **Volunteering's totals look small** | **A delta by ruling.** It inherits ~66 rows by reference rather than retyping them |
| **Shadowing's entity tab leads with a table, not the list** | **A stated exception** (`S-18`): seven physician cards cannot show breadth, a specialty × hours table can. **Flagged in the spec so nobody "fixes" the inconsistency** |

---

## Verdict

**Two real holes and one filing problem.**

1. **The reflection mechanism was designed once, for the wrong pillar, and never propagated.** Four items, four pillars, one shared mechanism. **Biggest gap and the cheapest to close.**
2. **Volunteering's ledger** — two misfiled rows, and no design attention on the surface carrying its central distinction.
3. **`Surface` needs list-versus-panel resolution** before any entity tab can be drawn.

**None of these are missing *ideas*.** They are the same features not carried across, which is the exact failure mode `05-experience-pillar.md` §2b was written to prevent — **written one hour before this audit, and these three predate it.**
