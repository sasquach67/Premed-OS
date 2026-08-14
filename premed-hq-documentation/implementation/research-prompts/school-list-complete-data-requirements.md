# School List — the complete data requirement, derived from the ruled spec

**Supersedes `school-list-school-profile-pull.md`**, which was written before Waves 0 and 4 closed and **missed two fields that ruled features cannot ship without.**

**Method.** Every field below is traced to a ruled row in `tabs/08-school-list.md`. **Nothing is here because it seemed useful.** If a row is unruled, its fields are marked and deliberately excluded.

---

## 1. Traceability — ruled feature → field it needs → what exists

| Ruled feature | Field required | State today |
|---|---|---|
| `SL-1` roster autocomplete | `name` · `id` | ✅ 240 |
| `SL-4` MD/DO | `type` | ✅ 240 |
| `SL-5` state + in-state flag | `state` | ✅ 240 |
| `SL-24` application service | `applicationService` | ✅ 240 |
| Layer A directory | `city` · `region` · `accreditationStatus` | ✅ 238 / 240 / 163 |
| Layer A directory | **`control`** (public/private) | ⚠️ **211 / 240** |
| **`SL-22` the map** | **`lat` · `lng` — city centroid** | 🔴 **FIELD DOES NOT EXIST** |
| **Batch 3 regional campuses** | **`availableFromCycle`** | 🔴 **FIELD DOES NOT EXIST** |
| `SL-9` tuition | `tuition` | 🔴 0 / 240 |
| `SL-7` the four numbers | `medianMCAT` · `medianGPA` · `inStatePercent` · `classSize` | 🔴 0 / 240 |
| `SL-26` prerequisite coverage | `prereqs` | 🔴 0 / 240 |
| `SL-27` letters routing | `letterRequirements` | 🔴 **FIELD DOES NOT EXIST** |
| `SL-25` ⏸ deferred | `admissionsTests` | 🔴 0 / 240, **and the shape is wrong** |
| mission (Explore mode) | `mission` | 🔴 12 / 240 |
| `SL-19` ⏸ **UNRULED** | application + secondary fees | Collected anyway — see §4 |
| `SL-17` ⏸ **UNRULED** | deadlines | Collected anyway — see §4 |

> **🔴 `SL-22` is the urgent one. It is a RULED, LOCKED feature that cannot render a single pin**, because the spec forbids runtime geocoding — *"geocoded once, offline, stored in `data/med-schools.json`. Never a runtime geocoding call"* — and no coordinate field was ever added.

---

## 2. Three passes, in this order

**Do not run these as one job.** They have different sources, different costs, and different failure modes.

| Pass | What | Source | Cost |
|---|---|---|---|
| **1** | **Geocode 238 cities** | A gazetteer — no school pages | **Cheap. Unblocks `SL-22` entirely** |
| **2** | **`control` for 29 schools** | Directory pages | Cheap — prompt already written in `school-list-quick-gap-fills.md` |
| **3** | **The school profile** | 240 individual admissions pages | Expensive — 8 batches of 30 |

**Pass 1 first.** It is the cheapest item on the list and it is the only one blocking a feature that is already ruled and locked.

---

## 3. PASS 1 — coordinates for the map

> **Paste from here:**
>
> You are producing city-centroid coordinates for a static offline dataset. **I need the CITY centroid, not the campus building** — the spec is explicit that *"city centroid is sufficient; nobody needs the building."*
>
> I will give you a list of `id` / city / state triples. For each, return the latitude and longitude of that **city or town centroid**, using a public gazetteer — GeoNames, the US Census Gazetteer, or an equivalent authority. **Name which source you used and state its licence and any attribution requirement.**
>
> ```json
> { "retrievedAt": "YYYY-MM-DD", "gazetteer": "", "licence": "",
>   "places": [ { "id": "", "city": "", "state": "", "lat": null, "lng": null, "confidence": "high|medium|low", "note": "" } ] }
> ```
>
> **Rules:**
> - **Return the `id` exactly as given** — it is the merge key.
> - **Disambiguate by state.** There is a Columbia in more than one state, and a wrong centroid puts a pin 800 miles away.
> - **Where a city name is a township, borough, or unincorporated place**, say so in `note` and give the best available centroid.
> - **`null` plus a note if you cannot resolve one** — do not approximate from the state centroid. A pin in the middle of the state is worse than no pin.
> - **Report every unresolved entry at the end.**
>
> Generate the input list with:
> ```bash
> cd premed-hq-documentation/data && python3 -c "
> import json
> for x in json.load(open('med-schools.json'))['schools']:
>     if x.get('city'): print('- \`%s\` | %s, %s'%(x['id'],x['city'],x['state']))
> "
> ```

**⚠️ Two entries have no city and get no pin** — Sidney Kimmel Delaware and Tufts Maine Track. Batch 3 ruled this: **do not infer a city from the parent institution.**

---

## 4. PASS 3 — the school profile

**⚠️ Two fields below serve UNRULED rows** (`SL-17` deadlines, `SL-19` fees). **They are collected because you are visiting the page anyway and a second visit costs more than a wasted column. They must not render until their rows are ruled** — Batch 7.

### Run in 8 batches of 30

```bash
cd premed-hq-documentation/data && python3 -c "
import json
s = sorted(json.load(open('med-schools.json'))['schools'], key=lambda x:(x['type'],x['state'],x['name']))
B=30
for i in range(0,len(s),B):
    print('### Batch %d of %d'%(i//B+1,-(-len(s)//B)))
    for x in s[i:i+B]: print('- \`%s\` — %s (%s, %s)'%(x['id'],x['name'],x['type'],x['state']))
    print()
"
```

> **Paste from here, followed by one batch list:**
>
> You are assembling a **source-cited profile snapshot** of U.S. medical schools for the 2026–2027 cycle. **Accuracy and honest gaps matter more than coverage. A `null` with a note is a correct answer; an unsourced number is a defect.**
>
> ### Sources — strict
>
> 1. **The school's own website.** Strongly preferred.
> 2. **AAMC / AACOM / TMDSAS official pages** for that school.
> 3. **Nothing else.** **Do NOT use Shemmassian, JackWestin, MedEdits, Leland, Inspira, The Match Guy, accepted.com, US News, or Niche — not even to cross-check.** If only those carry a figure, the answer is `null`.
>
> ### Collect per school
>
> **A · Academic profile.** MCAT total and GPA (cumulative; science/BCPM separately if published) for the most recent entering class.
>
> **B · Class shape.** Entering class size, and **in-state percentage** if published.
>
> **C · In-state orientation.** Does the school **state** a residency preference or a policy on out-of-state applicants? **Record its own wording. If it says nothing, `null` — never infer from `public`.**
>
> **D · Mission emphasis.** 2–5 short tags from the school's **own** mission language — e.g. `primary-care`, `rural-health`, `underserved`, `research-intensive`, `military`. **No tag without a sentence you can point at.**
>
> **E · Cost.** First-year tuition (in-state and out-of-state where they differ), the school's **secondary application fee**, and whether it publishes a fee-waiver policy.
>
> **F · Prerequisites.** The required subject areas **in the school's own wording**, with lab requirements, hours/semesters, and any stated policy on AP, IB, community college, online coursework, or recency. **⚠️ Record what the page SAYS. Never normalise two schools into a shared category, and never state that any course fulfils anything.**
>
> **G · Letters.** How many letters the school requires or accepts, any required writer roles or relationships, whether it accepts a committee packet, and whether letters route through the application service or direct to the school.
>
> **H · Deadlines.** The school's own primary deadline, secondary deadline, and interview season. **Every date needs the cycle it belongs to.**
>
> **I · Situational-judgement tests.** The school's stated requirement level for **AAMC PREview** and for **CASPer**, **verbatim**. **⚠️ AAMC defines four distinct levels — do not collapse them, do not reduce to a boolean, and do not map them onto a set you invented.** Also record any stated effect on application completeness.
>
> ### Record about every number — this matters more than the number
>
> 1. **`stat`** — median, mean, range, or percentile band? **Never silently convert one into another.**
> 2. **`population`** — matriculants, accepted, or all applicants? **If unstated, `"unstated"`. Never guess.**
> 3. **`classYear`** — which entering class.
> 4. **`sourceUrl`** — the exact page, not the homepage.
>
> ### Output — return ONLY this JSON
>
> ```json
> {
>   "batch": 1, "retrievedAt": "YYYY-MM-DD", "cycle": "2026-2027",
>   "schools": [{
>     "id": "exact-id-from-the-list",
>     "medianMCAT": null, "medianGPA": null, "scienceGPA": null,
>     "classSize": null, "inStatePercent": null,
>     "inStateFriendly": null, "inStateStatement": null,
>     "mission": [],
>     "tuition": { "inState": null, "outOfState": null, "secondaryFee": null, "feeWaiverPolicy": null },
>     "prereqs": [{ "area": "school's own wording", "lab": null, "amount": null, "policyNotes": "" }],
>     "letterRequirements": { "min": null, "max": null, "requiredRoles": [], "committeePacketAccepted": null, "route": "service | direct | unstated", "note": "" },
>     "deadlines": { "primary": null, "secondary": null, "interviewSeason": null, "cycleLabel": null },
>     "admissionsTests": {
>       "PREview": { "levelVerbatim": null, "completenessEffect": null, "cycleLabel": null },
>       "CASPer":  { "levelVerbatim": null, "completenessEffect": null, "cycleLabel": null }
>     },
>     "fieldSources": { "profile": {"source":"","checkedOn":"","stat":"","population":"","classYear":null},
>                       "cost": {"source":"","checkedOn":""},
>                       "prereqs": {"source":"","checkedOn":""},
>                       "letters": {"source":"","checkedOn":""},
>                       "deadlines": {"source":"","checkedOn":""},
>                       "admissionsTests": {"source":"","checkedOn":""} },
>     "confidence": "high | medium | low",
>     "profileStatus": ""
>   }]
> }
> ```
>
> ### Rules
>
> - **Return the `id` exactly as given.** It is the merge key.
> - **`null` when the school does not publish it.** Never substitute a national average, a parent institution's figure, or another campus of the same school.
> - **Branch campuses report together or not at all.** If a parent publishes one profile covering all campuses, put it on **each** and say so. **Do not invent per-campus splits.**
> - **`confidence: "low"`** whenever `population` is unstated, the page is undated, or you interpreted a range.
> - **Newly accredited schools may have no entering class.** `null` plus a note.
> - **⚠️ Deadlines are the highest-risk field. If you cannot confirm which cycle a date belongs to, return `null`.** A confidently wrong deadline costs a cycle.
> - **Report coverage at the end** — how many of the 30 got each field, and every `null` with its reason.

---

## 5. Merging, and what must not be lost

**Merge by `id`. Merge INTO `fieldSources` — never replace it** (the `city` and `control` blocks must survive). Then update `meta.fieldCoverage` with the real counts.

**Schema additions this requires** — these fields do not exist yet:

| Field | For |
|---|---|
| `lat` · `lng` | `SL-22` |
| `availableFromCycle` | Batch 3 regional-campus ruling |
| `letterRequirements` | `SL-27` |
| `tuition` | `SL-9` |
| `classSize` · `inStatePercent` | `SL-7` |
| `admissionsTests.*.levelVerbatim` | `SL-25` — **replaces the boolean-shaped null** |

## 6. ⚠️ Spec consequences — this data cannot ship silently

**`§1` of `tabs/08-school-list.md` forbids shipped medians, deadlines, in-state percentages, and class sizes BY NAME.** Populating them contradicts the governing ruling as written. **Amend `§1` and record the decision, or the next reader nulls the file back out** — the spec currently tells them to.

**Two more that change with it:**

- **`§2`'s Layer A / Layer B table becomes wrong.** Medians move from "typed by the student" to "shipped," which is the definition of Layer A. **Wave 1 (`SL-7`, `SL-8`, `SL-10`) cannot be ruled until this is settled** — those rows are literally "the numbers the student enters."
- **`SL-8`'s `enteredOn` loses its job for shipped fields.** The file's `retrievedAt` and `cycle` replace it. **A student-entered override should still carry `enteredOn`**, since a student correcting a shipped number is a different fact from the snapshot.

**And one that does not change:** **`SL-9` cut acceptance rate in every layer on anxiety grounds, not maintenance grounds.** That ruling is untouched by this decision. **Acceptance rate is not in the schema above and must not be added.**
