# Long-horizon durability — what breaks at year four

**Status:** Specced Aug 2026. **D1 is a live defect**, not a future risk.
**Depends on:** `implementation/data-model.md` (persistence, migrations),
`specifications/00-product-shell.md` (§7.5 Attention, §7.10 return rundown),
`implementation/data-refresh.md` (Category A freshness),
`architecture/06-service-foundation.md` (cloud, ownership)

## Why this file exists

Every other spec describes a feature working correctly. This one describes what
happens to those features after **four years of one student's data**, which is
the actual usage horizon: a freshman installs HQ and applies as a senior.

Nothing here is hypothetical scale. The numbers below come from the app's own
specced behaviour — #45a creates a threaded AI conversation per shift, FSRS
holds per-topic state per course, the ledger is longitudinal by design. These
features are correct. Their interaction with a four-year timeline is unmodelled.

**The failure mode this file guards against is the quiet one.** A tracker that
breaks loudly gets fixed. A tracker that degrades — slower, fuller, noisier,
with a hero panel that became a wall — gets abandoned, and the student never
files a bug because nothing ever looked broken.

---

## D1 — The storage ceiling (LIVE DEFECT)

### What is true today

- **One persisted root object**, `AppData`, under a single localStorage key
  (`data-model.md` §3). Every edit serialises and rewrites the whole object.
- **localStorage is primary.** Supabase and the Drive mirror are explicitly
  cloud *paths*; neither owns the data. Signed-out mode must stay fully
  functional (`CLAUDE.md`).
- **There is no quota handling.** `localStorage.setItem` is called without a
  `try`/`catch` anywhere in `src/store/`, and no size, budget, or eviction rule
  appears in any spec.

### Why four years breaks it

Typical localStorage is **~5 MB per origin**. The accelerant is `03-clinical.md`
§7d: **every shift gets an unpacking marker**, unpacking is a **2–3 exchange
minimum with no ceiling**, and **the whole thread routes to Story Bank** as raw
material rather than a summary.

Three shifts a week for three years is roughly **450 threads**, from one pillar.
Academics adds per-topic FSRS state, key points, and source chunks across four
years of courses. MCAT adds question and mistake logs.

**The failure is not graceful.** A quota-exceeded `setItem` throws. With no
catch, the write is lost at the moment the student saves — the worst possible
shape, because the app appears to be working.

### Required

1. **Wrap persistence.** A failed write raises a **blocking** data-health item
   in the Attention bell (shell §7.5) and must never fail silently. This is the
   minimum and should ship independently of the rest.
2. **Decide which entities are cloud-primary.** Reflection threads (#45a, #45b)
   are the obvious candidate: they are large, append-only, rarely re-read, and
   the least damaging thing to require a connection for. **This is a real
   exception to localStorage-primary and must be written into
   `data-model.md`, not assumed here.**
3. **Model a storage budget** with a headroom warning well before the ceiling,
   surfaced the same way as any other data-health item.
4. **Signed-out students must still be told.** A student who never configures
   sync is exactly the one who hits the wall, and "sign in to continue" at the
   moment of loss is not an acceptable first mention.

**Do not solve this by trimming reflections.** They are the pillar's most
valuable output (§7d, "the most important feature on this tab"). The storage
model changes; the feature does not.

---

## D2 — Every hero surface is sized for sophomore-year data

Each pillar's composition was designed against a plausible *current* record, and
the mockups encode that assumption:

| Surface | Designed against | Year four |
|---|---|---|
| Clinical site-card row — specced as **the visual hero** (`03-clinical.md` §5) | 2–3 sites | 8–12 sites; the hero is a wall |
| Grades & Archive ledger | 3 terms | 8+ terms |
| Requirements requirement sets | current audit | plus superseded catalog years (D4) |
| Story Bank | a handful of reflections | several hundred threads |
| Overview bento | one screen | the same one screen, sourcing 4× the records |

**Required: a year-four fixture.** One seed dataset representing a senior — four
years of courses, 400+ shifts across five sites, several hundred reflections,
two archived experiences, a changed major — held to the same standard as
`demo-data.md`'s rules (same schemas, same migrations).

**Every hero composition is reviewed against it before it ships.** The variant
lab (`specifications/mockups/variant-lab.html`) is the right instrument: a
year-four fixture is a legitimate second dataset to render existing layouts
against, and a layout that only works at year two is a layout that fails exactly
when the student needs it most.

---

## D3 — Suppressions accumulate invisibly and never expire

`types.ts` already persists unbounded suppression maps: `projectionDismissals`,
`mascotNoteDismissals`, `attentionSnoozedUntil`, wholesale muted rules, and
per-instance recommendation lifecycle. The pillar specs add more permanent
decisions, each correctly permanent **in isolation**:

- `Keep it here` on the mis-filing catch (`03-clinical.md` §2.1)
- Stale-exposure suppression, per experience (§7)
- `Just fixing the name` on a role edit (§7h, #57)
- Deferring an unpacking marker (§7d, #45a)

**Individually right, collectively a problem.** By senior year a student is
living with dozens of rulings made by their freshman self, about experiences and
priorities that have since changed, with **no surface that lists them and no way
to revisit one**. This is the only place HQ holds state about the student that
the student cannot inspect, which sits badly against every transparency
commitment in these specs.

### Required

- **One review surface**, in Settings, listing every active suppression with
  what it silences and when it was set. Read and undo; nothing else.
- **Undo restores the nudge to its normal cycle**, it does not fire immediately.
- **Nothing expires on its own.** Auto-expiry would resurrect a decision the
  student made deliberately, which is the nagging §2.1 and §7d were written to
  prevent. **Visibility is the fix, not expiry.**
- **No count, no badge, no prompt to review.** It is a place you can go, not
  something that asks for attention.

---

## D4 — Reference data moves under records already built on it

`data-refresh.md` keeps Category A datasets current, and `01-academics.md`
§4.2-C2 protects the **Planner**: a catalog change flags plans built on the old
mapping rather than silently re-deriving them.

**Nothing protects the conclusions.** A requirement marked met under the 2026
catalog carries no record of which catalog year judged it. When the 2028 catalog
restructures a requirement group, that verdict is silently wrong, and the
`✓ Verified · Jul 28 2026` chip describes the *dataset's* freshness, not the
freshness of the judgment made with it.

The same shape applies to AMCAS rules, which `01-academics.md` §7b explicitly
calls "a snapshot of July 2026" and requires re-verification each cycle, and to
credential standards (`03-clinical.md` §2.5).

### Required

- **Stamp derived conclusions with the dataset version that produced them** —
  requirement verdicts, AMCAS classifications, credential CE targets.
- **On a dataset update, re-derive and diff.** Conclusions that changed are
  surfaced for review; conclusions that did not are silently re-stamped.
- **Never silently flip a verdict.** Same permission-first rule the Planner
  already follows.
- **A superseded verdict is retained, not overwritten**, so a student can see
  that a requirement was met under the rules that applied at the time.

---

## D5 — The migration chain gets long, and runs on stale clients

The store is already at **V8** (`academicsV4` through `V7`, `foundationV8`)
inside roughly one year of development. Four years plausibly means 25+.

The compounding factor is **signed-out, local-primary operation**: a student
opening a device they have not used in fourteen months arrives several versions
behind, and the chain runs client-side with no server to fall back on. If step 12
assumes a shape that step 9 produced but step 6 did not, it fails on exactly the
user least able to recover.

### Required

- **A full-chain test, not per-step tests.** Seed the **oldest supported shape**,
  run every migration in sequence, assert nothing is lost.
  `src/store/migrations.test.ts` may already do this — **confirm rather than
  assume**, and if it tests steps in isolation, add the chain case.
- **Declare an oldest supported version** and what happens below it. "We do not
  know" is the current answer.
- §9's existing rule holds and is worth restating: a record that cannot be
  migrated is **preserved and raised as a data-health item**, never dropped.

---

## D6 — The runway ends at matriculation

The product's whole timeline terminates when the student matriculates. Four
years of coursework, hours, reflections and contacts, and then the need for it
stops. Nothing in any spec describes that ending.

`01-academics.md` §6.9 already argues the principle as an Academics structural
decision: *"Four years of coursework is a serious commitment to ask for. A
complete, obvious export is what makes it a reasonable one — and it's also the
honest answer to 'what if I stop using this?'"*

**That argument is not Academics-specific.** It should be shell-owned, cover
every pillar, and be reachable without reading a spec to find it. The overflow
menu already lists **Export data** (shell §7.6); what is missing is the
guarantee of what it contains.

### Required

- **Export covers every pillar**, in a format that is readable without HQ.
- **Reflection threads export in full**, not as summaries.
- **It is not an account-closure flow.** Nothing is deleted, nothing is gated.

---

## Priority

| | Item | Why this order |
|---|---|---|
| 1 | **D1 step 1** — wrap persistence, raise a blocking item | Live defect. Silent data loss. Ships alone. |
| 2 | **D5** — full-chain migration test | Cheap, and the failure is unrecoverable. |
| 3 | **D1 steps 2–4** — storage budget and cloud-primary threads | Architectural; needs a decision before #45a ships at volume. |
| 4 | **D2** — year-four fixture | Blocks nothing, but every future layout review is worse without it. |
| 5 | **D4** — version-stamp conclusions | Bites at the first catalog year change. |
| 6 | **D3** — suppression review surface | Accumulates slowly; harmless until year three. |
| 7 | **D6** — export guarantee | Real, but the last thing that hurts. |

**D1 and D5 are the two where the damage is unrecoverable.** Everything else
degrades visibly and can be fixed late.
