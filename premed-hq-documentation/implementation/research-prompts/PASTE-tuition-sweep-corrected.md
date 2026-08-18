# PASTE-READY — Tuition sweep, corrected (School List / `SL-9`)

**Copy everything below the line into your research agent.**

**Why this rerun.** The first pass returned tuition on 42 of 240 schools. That was a **field-definition failure, not a findability failure** — a cost-of-attendance page offers four or five defensible numbers, and the prompt didn't say which one to take, so the agent returned null.

---

## Context — what this data is for

You are collecting data for **Premed OS**, an application-tracking app for pre-medical students. This specific dataset backs the **School List** tab: the tab where a student assembles the medical schools they intend to apply to, records why each one is on the list, and tracks the cycle.

**The dataset is `data/med-schools.json` — 240 U.S. MD and DO programs** at teaching-location grain, the entries a student actually selects on AMCAS, AACOMAS, or TMDSAS.

**The tuition figure feeds two ruled features:**

- **`SL-9`** — tuition as a **student-facing cost planning input**. The spec's own argument: *"NYU being free changes a list."* Cost is one of the few things that legitimately changes which schools someone applies to.
- **`SL-19`** — cost tracking, where application fees and secondary fees accumulate.

**So the question every ambiguous case should be resolved against is:** *which number helps a student compare what it costs to attend school A versus school B?*

That points at **tuition** as the primary comparable figure — housing and food vary by city and by how someone chooses to live, so a total cost of attendance is not comparable across schools in the same way. **Capture both, but keep them separate and never merge them.**

## Governing rules this dataset obeys

| Rule | What it means here |
|---|---|
| **Facts, never judgements** (`U-13`) | Record what the page states. **Never rank schools by affordability, never call one expensive, never compute a "value" figure** |
| **No acceptance rate, ever** | Deliberately cut from this product in every layer. **Do not collect it even if the page shows it** |
| **Official sources only** | The school's own site, or AAMC / AACOM / TMDSAS. **Never US News, Niche, or consulting sites** |
| **Honest gaps** | A `null` with a stated reason is a correct answer. **An unsourced number is a defect** |
| **Research-only for now** | This corpus is staging. The app's governing ruling currently forbids shipping these numbers, pending an explicit amendment. **Nothing you return goes live automatically** |

---

## The prompt

> **Paste from here:**
>
> You are collecting first-year tuition and cost data for U.S. medical schools, for a pre-med application-tracking app's school list. **Accuracy and honest gaps matter far more than coverage.**
>
> The earlier pass failed because a cost-of-attendance page offers several defensible numbers and no rule said which to take. **This corrects that.**
>
> ### Capture these as SEPARATE fields. Never collapse them.
>
> | Field | What it is |
> |---|---|
> | **`tuitionOnly`** | The tuition line, first year, full academic year. **The primary comparable figure** |
> | **`requiredFees`** | Mandatory direct-cost lines that are NOT tuition — health fee, activity fee, lab fee, dues |
> | **`totalDirectCost`** | What the school labels direct cost, if stated |
> | **`totalCOA`** | Full cost of attendance including indirect costs — housing, food, transport — if stated |
>
> ### The rules that produced the nulls last time
>
> **1. Semester splits.** Many pages give Fall and Spring separately — for example `$36,149` + `$36,148`. **Sum them into an annual figure and set `"summedFromTerms": true`.** Do not return null because no single annual number appeared.
>
> **2. Accordions, tabs, and year selectors.** COA pages routinely hide "MD Year 1" behind a collapsed section. **Expand them.** If content is JS-rendered and genuinely unreachable, say so — that is `not-found`, which is a different finding from `not-published`.
>
> **3. Private schools have one rate.** If there is no in-state / out-of-state split, **set both to the same value and `"singleRate": true`.** Do not null a figure because the page lacks a residency split.
>
> **4. Take first year / Year 1.** Later years often differ. **Record which year the figure describes.**
>
> **5. Cycle label.** These pages usually state it plainly — *"2026/2027 Estimated Cost of Attendance."* **Capture it verbatim. If it is absent, null the cycle, not the figure.**
>
> **6. Wrong page.** A parent university's graduate or undergraduate tuition is **not** the medical school's. **If only the parent rate is findable, return null with `nullReason: "not-found"` and say so.**
>
> ### Output per school
>
> ```json
> {
>   "id": "exact-roster-id",
>   "tuitionOnly":     { "inState": null, "outOfState": null, "singleRate": false, "summedFromTerms": false },
>   "requiredFees":    { "amount": null, "itemised": [] },
>   "totalDirectCost": { "inState": null, "outOfState": null },
>   "totalCOA":        { "inState": null, "outOfState": null },
>   "yearDescribed": "Year 1",
>   "cycleLabel": "2026-2027 or null",
>   "source": "https://…",
>   "checkedOn": "YYYY-MM-DD",
>   "nullReason": "not-published | not-found | not-applicable",
>   "note": ""
> }
> ```
>
> **Return the `id` exactly as given — it is the merge key.**
>
> **Do not collect acceptance rate.** It is deliberately excluded from this product.
>
> **I expect `not-published` to be rare for this field.** Medical schools publish cost of attendance for federal financial-aid purposes. **If you reach a real COA page and the school genuinely states no number, that is a finding worth flagging explicitly.**
>
> Report coverage at the end, and every null with its reason.
