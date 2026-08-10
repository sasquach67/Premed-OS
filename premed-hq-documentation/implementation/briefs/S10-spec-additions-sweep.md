# S10 — Spec additions sweep: what was specced and never built

**Type:** read-only audit. Nothing in `src/` was changed for this report.
**Date:** Aug 8 2026.
**Question asked:** *"there are additional features that I added that weren't
previously in the md"* — so this sweep finds **specified-but-unbuilt**, not
defects. Defects are S9's job.

**Method.** The specs date-stamp their own changes — `(added Aug 2026)`,
`RULED July 2026`, `SPECCED Aug 2026`, `REVERSED`, `CUT`, `DELETED`. Every one
of those markers was extracted and checked against `src/`. That is a far
tighter net than reading 30,000 lines looking for gaps, and it matches exactly
what was asked: what did you add that the app has not caught up with.

**Scope.** All 117 docs scanned for markers; 11 densest specs read in full at
the marked sections. `Atlas/` and `premedos/` excluded (separate/stale).

---

## 0. The finding that outranks the sweep

**Clinical, Volunteering, Shadowing and Research display fabricated data.**

`ExperiencePillar.tsx:176` computes and passes real store data — `rows`,
`entities`, `selectedEntity`, `goal`, `totalHours`. `ApprovedPillarPage`
(`:228`) destructures **only** `category`, `onAddEntity`, `onAddEntry` and
discards the rest. It renders `ApprovedExperienceLayout`, which reads the store
**zero times** and paints constants:

| Rendered to every user | Source |
|---|---|
| `Total hours 230 · Clinical 138 · Non-clinical 92` | `ApprovedPillarLayouts.tsx:39` |
| `Orange County EMS — MEDIC · 312h` | `:76` |
| `Dr. Elena Vasquez, MD · Emergency Medicine · 34h` | `:61` |
| `3.4 hrs/wk → both targets land by Feb 2027` | `:136` |

Four pillar pages state hour totals that feed AMCAS as if they were the
student's, and they belong to nobody. A student's real logs are computed and
thrown away one line before render.

This is not a conformance gap — it is the pages lying. **It should be fixed
before any item below**, and it is cheap: the data is already computed and
already passed.

---

## 1. Never built

Checked by concept, not by filename. `✗` = no implementation found anywhere in
`src/`.

### The Aug 2026 structural rewrite of the experience pillars

The largest single body of unbuilt spec. **All four pillars were ruled into
flat sub-tabs in Aug 2026 and none of them has tabs at all** —
`ExperiencePillar.tsx` renders a metric strip, a centrepiece, a ledger and an
entity workspace.

| Spec | Ruling | Built |
|---|---|---|
| `03-clinical` §5 | `Sites · Shifts · Reflections`, underline tabs, no mode switch | ✗ |
| `04-volunteering` §5 | `Organizations · Events · Reflections` | ✗ |
| `05-shadowing` §5 (S-4) | `Physicians · Visits · Reflections` | ✗ |
| `07-extracurriculars` §5 (E-31) | four flat sub-tabs | ✗ |

Two consequences worth separating from the tabs themselves:

- **`04-volunteering` §5 "TWO SHAPES, not one"** — the pillar's *structural*
  departure from Clinical: standing roles and single-day events are different
  record shapes, not one shape with a flag. Nothing in `types.ts` distinguishes
  them. ✗
- **`05-shadowing` §4 — the Physician is the record.** The pillar is organised
  by person, not organisation, and `Physician` carries specialty, degree,
  setting and letter status. **There is no `Physician` type in `types.ts`.** ✗

### Clinical's seven Aug 2026 sections

Every one marked `SPECCED Aug 2026` or `REVISED Aug 2026`:

| § | Feature | Built |
|---|---|---|
| 7c | Verifier capture — type-to-create, **batched, never at add time** | ◑ fields only (`types.ts:767-770`); no batching flow |
| 7d | Reflection — chosen prompts, tracked deep-unpack, cross-experience synthesis | ✗ |
| 7e | Shared org directory + impact numerics | ✗ |
| 7f | Return rundown — Clinical's specialization | ✗ (parent §7.10 also unbuilt) |
| 7g | Nudge routing — the seven go through Attention | ✗ |
| 7h | Record integrity at logging time | ✗ |
| 7i | Bulk backfill's block | ✗ |
| 7a | Hour target suggested from the student's **own rate**, never a benchmark | ✗ |
| 7b | AMCAS Work & Activities structure (`VERIFIED Aug 2026 · Category A`, AAMC-sourced 3 Aug 2026) | ✗ |
| §2 pt 5 | Certification tracking with **live expiry dates** | ✗ — no `certification`/`expiryDate` in `types.ts` |

### Shell — governing, none built

| Spec | Feature | Built |
|---|---|---|
| `00` §7.10 | Return rundown (`GOVERNING`) — no session tracking exists at all | ✗ |
| `00` §7.9 | Calendar overlay — top-bar toggle, Week/Month/Agenda | ✗ |
| `00` §11a | Guided walkthrough — mascot-narrated spotlight tour | ✗ |
| `01` §4g | `.apkg` Anki export (`LOCKED`) | ✗ |
| `01` §4h | Copy voice (`added Aug 2026 · GOVERNING`) | not verifiable by grep — needs a prose pass |

### Academics — the July 2026 wave

| § | Feature | Built |
|---|---|---|
| 4.1-M | **Syllabus ingestion — "THE KEYSTONE"** | ✗ |
| 4.1-R | Exam prep mode | ✗ |
| 4.1-Q | Lecture capture — professor-insight engine | ✗ |
| 4.1-N | Class types — three, and only three | ✗ |
| 4.1-P | Exam & resource catalog | ✗ |
| 4.1-O | Canvas / LMS integration | ◑ `canvasUrl` link field only (`types.ts:199`) |
| 6.8 | Grade ledger done properly | ✗ (see S9 D13) |
| 6.16 | Academics as **consumer** of the shared hour budget | ◑ pool built (§11b); no claims registered |

### MCAT — the July/Aug 2026 wave

| § | Feature | Built |
|---|---|---|
| 2b | Data model — `missReason` ONE general taxonomy (`LOCKED`) | ✗ |
| 3.3-G | Study-hour target, community-sourced (`added Aug 2026`) | ✗ |
| B0 | ONE hour budget across tabs (`GOVERNING`) | ◑ pool built; MCAT registers no claims |
| — | FL is a **scheduled** object, not a logged one | ✗ |
| 3.5 | Mastery decays — states are not permanent checkmarks | ✗ |
| 3.10 | The Bookshelf (P2) | ✗ |

### Overview / Timeline ownership rewrite (Aug 2026)

| Spec | Ruling | Built |
|---|---|---|
| `03` §0, §6.4 | Overview **owns tasks outright**; routes go to `/overview/tasks` | ✗ — four links still point at `/timeline` (`OverviewTasks.tsx:120,150,209,295`). Spec acknowledges this as gap **S6** |
| `03` §6.4 | Roadmap steps flow in from Timeline nodes as a read-time union | ✗ |
| `03` §6.5 | Where-I-stand rows expand to show where the number came from | ✗ (mockup is `Build? NO`) |
| `11` | A roadmap node is **its own entity, not a flagged task** | ✗ — still `TaskItem.milestone === true` |

---

## 2. Built since the spec changed

| Feature | Status |
|---|---|
| `01` §4f-i InfoTip + glossary | ✅ `548c860` |
| `00` §11b `WeeklyCapacity` — entity, migration, reading layer, capture UI | ✅ `cfb6bcd`, `856b8c0`, `a41ecaa` — **consumers still missing** |
| `03` §6.5a hours tile — Clinical/Volunteering/Research only | ✅ `fcf183b` |
| `01-academics` §4.0-e Contacts panel | ✅ already built (`ClassCenter.tsx:789`) |
| `01-academics` §4.1 Anki decoupling | ✅ spec + mockup corrected Aug 8 |

---

## 3. What this changes about priority

The list I have been working from was **ordered by the shell spec**, which put
`WeeklyCapacity`, the return rundown and the calendar overlay first. This sweep
says that ordering was wrong in one respect: **the experience pillars carry the
newest and largest body of unbuilt spec**, and they are the surfaces neither S9
nor any prior pass examined.

Suggested order:

1. **Fix the fabricated-data defect** (§0). Cheap, and everything else on those
   pages is meaningless until the numbers are the student's own.
2. **Pillar sub-tab structure** — one shape serving Clinical, Volunteering,
   Shadowing and ECs, per `03-clinical` §5's explicit "same shape" language.
   Four rulings, one build.
3. **`Physician` and the two Volunteering shapes** — data-model work the
   sub-tabs depend on. Needs a versioned migration.
4. **Register capacity claims** — closes §11b, which is otherwise inert.
5. Everything else, by the S9 fix order.

## 4. Caveats

- `◑` rows are partial matches confirmed by inspection; `✗` means no
  implementation found by concept search. A feature built under an unexpected
  name could be mis-marked — each `✗` is worth ten seconds of confirmation
  before work starts.
- `01` §4h (copy voice) cannot be checked by grep and needs a prose review pass.
- Several `✗` items are correctly unbuilt because their mockups are `Build? NO`
  in `BUILD-MANIFEST.md`. This report lists what is *specified*; the manifest
  still gates what may be *built*.
