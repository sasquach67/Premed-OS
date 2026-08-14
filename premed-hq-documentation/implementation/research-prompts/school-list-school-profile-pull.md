# Research prompt — per-school profile, static 2026 snapshot (comprehensive)

**Goal.** One pass over all 240 entries in `data/med-schools.json`, filling every field that can honestly be filled from a school's own page. Static snapshot for the 2026–2027 cycle. **Refresh strategy is deliberately out of scope** and will be decided later (Andy, Aug 2026).

**Why one pass and not several.** Medians, mission language, and deadlines usually live on the *same* admissions pages. Running three separate passes means visiting 240 schools three times. **This collects everything collectable per visit.**

**The schema already holds all of it.** Every entry has `medianGPA`, `medianMCAT`, `inStateFriendly`, `mission`, `deadlines`, `confidence`, `profileStatus`, and a `fieldSources` provenance block. `profileStatus` currently reads *"school-specific admissions profile not yet verified"* on all 240. **This adds no new keys.**

---

## Scope — everything the file can hold

> **⚠️ COLLECTING IS NOT RENDERING. Keep these two decisions apart.**
>
> Several fields below were previously excluded by rulings that are about **what a student sees**, not about what the file holds. `SL-9` cut acceptance rate because *"a 2.1% next to your name is anxiety with no action attached"* — an argument about display. A number sitting unrendered in a JSON file does not do that.
>
> **This pass fills the file. Every display ruling stays exactly as written until separately amended.** The two that matter most:
> - **`SL-9`** — acceptance rate does not render. Collect it; do not put it on a screen without a new ruling.
> - **`SL-26`** — Premed OS may say a requirement has **no course mapped**. It may **never** say a course *satisfies* a school's requirement. Collecting a school's published requirement text does not change that.

| Field | This pass | Note |
|---|---|---|
| `medianMCAT` · `medianGPA` · `scienceGPA` | ✅ collect | |
| `inStateFriendly` | ✅ collect | As a **sourced fact**, not a judgement — see rules |
| `mission` | ✅ collect | Short tags from the school's own language |
| `deadlines.primary` · `secondaryTypical` · `interviewSeason` | ✅ collect | **Cycle data — stamp it hard** |
| `acceptanceRate` | ✅ collect | **Display still governed by `SL-9`.** Collected for the record, not for a screen |
| `prereqs` · `prereqNotes` | ✅ collect | **As the school's published requirement text only.** Never as a satisfies-claim — `SL-26` holds |
| `admissionsTests.PREview` · `CASPer` | ✅ collect | **AAMC defines four levels. Record verbatim, never as a boolean** |

## Two housekeeping items before this data ships

Neither blocks the pull:

1. **`§1` of `tabs/08-school-list.md` forbids shipped medians and deadlines by name.** Populating them contradicts the spec as written — it needs an explicit amendment recording the decision, or the next reader will read the filled file as a bug and null it back out.
2. **A snapshot has to say it's a snapshot.** `meta.cycle` and `meta.retrievedAt` already exist. Any UI showing a median or a deadline must carry the stamp so an old number reads as *"2026 figure"* rather than as current fact. **Deadlines especially** — a stale deadline is the one number in this file that can cost someone a cycle.

---

## Generating the batch lists

Deep research degrades past ~30 schools per run. Run this in the repo to emit 8 batch lists:

```bash
cd premed-hq-documentation/data && python3 -c "
import json
s = sorted(json.load(open('med-schools.json'))['schools'],
           key=lambda x: (x['type'], x['state'], x['name']))
B = 30
for i in range(0, len(s), B):
    print('### Batch %d of %d' % (i//B+1, -(-len(s)//B)))
    for x in s[i:i+B]:
        print('- \`%s\` — %s (%s, %s)' % (x['id'], x['name'], x['type'], x['state']))
    print()
" > /tmp/batches.md
```

**Paste the prompt below plus one batch list per run.**

---

## The prompt

> **Paste from here, followed by one batch list:**
>
> You are a meticulous admissions-data researcher assembling a **source-cited snapshot** of U.S. medical school profiles. Accuracy and honest gaps matter far more than coverage. **A `null` with a note is a correct answer. An unsourced number is a defect.**
>
> ### Source priority — strict
>
> 1. **The school's own website** — entering class profile, admissions statistics, class-of page, or admissions timeline. **Strongly preferred.**
> 2. **AAMC or AACOM official pages** for that school.
> 3. **Nothing else.** **Do NOT use Shemmassian, JackWestin, MedEdits, Leland, Inspira, The Match Guy, accepted.com, US News, Niche, SDN, or Reddit — not even to cross-check.** If only those carry a number, the answer is `null`.
>
> ### Collect, per school
>
> **1. Academic profile**
> - MCAT total and GPA (cumulative; science/BCPM separately if published) for the most recent entering class.
>
> **2. In-state orientation** — as a **fact the school states**, never your inference.
> - Does the school **publicly state** a residency preference, an in-state percentage, or a policy on out-of-state applicants? Public schools often do; many state it plainly.
> - Record the school's own wording. **If the school says nothing, this is `null`** — do **not** infer from `control: public` or from the state.
>
> **3. Mission emphasis** — 2–5 short tags drawn from the school's own mission or "who we seek" language.
> - Examples of the *shape*: `primary-care`, `rural-health`, `underserved`, `research-intensive`, `military`, `community-based`.
> - **Only from the school's own stated mission.** Do not tag from reputation, ranking, or your prior knowledge. **No school gets a tag you cannot point at a sentence for.**
>
> **4. Deadlines — for the current cycle only**
> - Primary application deadline (the school's own, not the service's).
> - Secondary deadline or stated turnaround expectation, if published.
> - Interview season, if published.
> - **Every deadline needs the cycle it belongs to.** A deadline without a cycle label is unusable.
>
> **5. Acceptance / selectivity figures, if the school publishes them**
> - Acceptance rate, applicants received, interviews offered, class size — whatever the school states.
> - **Only the school's own published figure.** Do not compute one, and do not take one from a ranking site.
>
> **6. Prerequisites — the school's published requirement text**
> - The required subject areas as the school lists them, with lab requirements, hours or semesters, and any stated policy on AP credit, community college, online coursework, or recency.
> - **⚠️ You are recording what the page SAYS, not judging what satisfies it.** Copy the school's own categories and wording. **Never normalise two schools into one shared category**, and never state or imply that any course fulfils a requirement.
>
> **7. Situational-judgement tests**
> - Record the school's stated requirement level for **AAMC PREview** and for **CASPer**, **in the source's own words**.
> - **⚠️ AAMC defines four distinct PREview requirement levels. Do not collapse them, do not reduce them to a boolean, and do not map them onto a set you invented.** Copy AAMC's own label verbatim and put it in `level`.
> - TMDSAS's CASPer consequence is separate and differently worded — record it as stated rather than folding it into the PREview vocabulary.
> - **Also record the effect on completeness** if stated: a requiring school may not mark an application complete until the score arrives.
> - If the school and the official list are both silent, `null` — and note that **`null` means "not established," never "not required."**
>
> ### Record these about every number — this matters more than the number
>
> 1. **`stat`** — **median**, **mean/average**, **range**, or **percentile band**? Schools differ and rarely make it obvious. **Never silently convert one into another.**
> 2. **`population`** — **matriculants**, **accepted**, or **all applicants**? If unstated, use `"unstated"`. **Never guess.**
> 3. **`classYear`** — which entering class, if stated.
> 4. **`sourceUrl`** — the exact page. Not the homepage.
>
> ### Output — return ONLY this JSON
>
> ```json
> {
>   "batch": 1,
>   "retrievedAt": "YYYY-MM-DD",
>   "cycle": "2026-2027",
>   "schools": [
>     {
>       "id": "exact-id-from-the-list-below",
>       "medianMCAT": null,
>       "medianGPA": null,
>       "scienceGPA": null,
>       "inStateFriendly": null,
>       "inStateStatement": "the school's own wording, or null",
>       "mission": [],
>       "deadlines": {
>         "primary": null,
>         "secondaryTypical": null,
>         "interviewSeason": null,
>         "cycleLabel": "2026-2027 or null"
>       },
>       "acceptanceRate": null,
>       "selectivity": { "applicants": null, "interviewed": null, "classSize": null },
>       "prereqs": [
>         { "area": "school's own wording", "lab": null, "amount": "as stated, or null", "policyNotes": "" }
>       ],
>       "prereqNotes": "any stated AP / community-college / online / recency policy, verbatim",
>       "admissionsTests": {
>         "PREview": { "level": null, "levelVerbatim": null, "completenessEffect": null, "cycleLabel": null },
>         "CASPer":  { "level": null, "levelVerbatim": null, "completenessEffect": null, "cycleLabel": null }
>       },
>       "fieldSources": {
>         "admissionsProfile": {
>           "source": "https://...",
>           "checkedOn": "YYYY-MM-DD",
>           "stat": "median | mean | range | percentile-band",
>           "population": "matriculants | accepted | applicants | unstated",
>           "classYear": "2029 or null",
>           "note": ""
>         },
>         "mission": { "source": "https://...", "checkedOn": "YYYY-MM-DD" },
>         "deadlines": { "source": "https://...", "checkedOn": "YYYY-MM-DD" },
>         "acceptanceRate": { "source": "https://...", "checkedOn": "YYYY-MM-DD", "cycleLabel": null },
>         "prereqs": { "source": "https://...", "checkedOn": "YYYY-MM-DD" },
>         "admissionsTests": { "source": "https://...", "checkedOn": "YYYY-MM-DD" }
>       },
>       "confidence": "high | medium | low",
>       "profileStatus": ""
>     }
>   ]
> }
> ```
>
> ### Rules
>
> - **Return the `id` exactly as given.** It is the merge key — a changed id breaks the merge.
> - **`null` whenever the school does not publish it.** Never substitute a national average, a parent institution's figure, or another campus of the same school.
> - **Branch campuses report together or not at all.** Several entries are distinct teaching locations of one college. If the parent publishes one profile covering all campuses, put it on **each** campus and say so in `note`. **Do not invent per-campus splits.**
> - **`confidence: "low"`** whenever `population` is `unstated`, the page is undated, or you interpreted a range.
> - **`profileStatus`**: `"school-published, verified YYYY-MM-DD"` when found; `"school does not publish an admissions profile"` when genuinely absent.
> - **Newly-accredited schools may have no entering class yet.** `null` plus a note — not a gap to fill.
> - **Deadlines are the highest-risk field here.** If you cannot confirm the cycle a deadline belongs to, return `null`. **A confidently wrong deadline is worse than an empty one.**
> - **Report coverage at the end** — how many of the 30 got each field, and every `null` with its reason.
>
> **If you cannot find a school's page at all, say so.** Do not fall back to a compiled list.

---

## Merging

Each batch returns JSON keyed by `id`. Merge into `data/med-schools.json` by `id`. **Merge into `fieldSources`, don't replace it** — every entry already has a `fieldSources.city` block that must survive.

Then update `meta`: bump `retrievedAt`, and add per-field counts under `coverage` so a later fill-rate check reads the real number instead of assuming 240/240.

**⚠️ Expect large gaps, especially DO schools and branch campuses.** A partial fill with honest nulls is the correct outcome. **Coverage is a fact to record, not a target to hit** — and a file that looks 100% full is how the next audit gets misled.

## After this pass

**Every field in the schema has been attempted.** What remains null is null because a school does not publish it — not because we chose not to look.

### The display rulings that still stand

**Filling the file did not amend any of these.** Each needs its own decision before the data reaches a screen:

| Ruling | What it still forbids |
|---|---|
| **`SL-9`** | Acceptance rate does **not render**, in any layer. It is in the file; it is not on a screen |
| **`SL-26`** | Premed OS may report a requirement has **no course mapped**. It may **never** say a course satisfies one. **Grep should prove no string asserting a school accepts, satisfies, or fulfils anything** |
| **`SL-25`** | PREview / CASPer has no UI yet. The data now exists in the correct three-state shape for when it does |
| **`§1`** | Still forbids shipped medians and deadlines **as written**. The file now contradicts it — **amend the spec or the next reader nulls this back out** |

### The one thing that genuinely expires

**Deadlines and acceptance figures are cycle-stamped facts.** Medians drift slowly and a year-old median is a mild inaccuracy. **A year-old deadline is a missed application.** Whatever the refresh decision turns out to be, deadlines need a visible cycle label from day one — that part is not deferrable.
