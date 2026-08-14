# PASTE-READY — School profile, batch 8 of 8 (30 schools)

**Copy everything below the line into your research agent.** The school list is inline; nothing to set up.

**Run the batches independently.** Each returns its own JSON block keyed by school `id`; they merge together afterwards.

---

You are assembling a **source-cited profile snapshot** of U.S. medical schools for the **2026–2027** cycle, to be stored as a static dataset.

**Accuracy and honest gaps matter far more than coverage. A `null` with a note is a CORRECT answer. An unsourced number is a defect.**

## Sources — strict

1. **The school's own website** — entering-class profile, admissions statistics, class-of page, tuition/cost page, admissions timeline.
2. **AAMC / AACOM / TMDSAS official pages** for that school.
3. **Nothing else.** Do **NOT** use Shemmassian, JackWestin, MedEdits, Leland, Inspira, The Match Guy, accepted.com, US News, Niche, SDN, or Reddit — **not even to cross-check.** If only those carry a figure, the answer is `null`.

## Collect, per school

**A · Academic profile.** MCAT total, and GPA (cumulative; science/BCPM separately if published) for the most recent entering class.

**B · Class shape.** Entering class size, and **in-state percentage** if published.

**C · In-state orientation.** Does the school **state** a residency preference or a policy on out-of-state applicants? Record its own wording. **If it says nothing, `null` — never infer this from the school being public.**

**D · Mission emphasis.** 2–5 short tags drawn from the school's **own** mission language — e.g. `primary-care`, `rural-health`, `underserved`, `research-intensive`, `military`, `community-based`. **No tag without a sentence you can point at.** Do not tag from reputation or ranking.

**E · Cost.** First-year tuition (in-state and out-of-state where they differ), the school's **secondary application fee**, and whether a fee-waiver policy is published.

**F · Prerequisites.** Required subject areas **in the school's own wording**, with lab requirements, hours or semesters, and any stated policy on AP credit, IB, community college, online coursework, or recency. **⚠️ You are recording what the page SAYS. Never normalise two schools into a shared category, and never state or imply that any course fulfils a requirement.**

**G · Letters.** How many letters required/accepted, any required writer roles or relationships, whether a committee packet is accepted, and whether letters route through the application service or direct to the school.

**H · Deadlines.** The school's own primary deadline, secondary deadline, and interview season. **Every date must carry the cycle it belongs to.**

**I · Situational-judgement tests.** The school's stated requirement level for **AAMC PREview** and for **CASPer**, **verbatim**. ⚠️ **AAMC defines four distinct levels — do not collapse them, do not reduce to true/false, and do not map them onto a set you invented.** Also record any stated effect on application completeness.

**J · Institutional control.** `public` or `private`. **Branch campuses take the parent institution's control.** Pennsylvania "state-related" institutions are a real ambiguity — answer `public` and **say so in the note** rather than silently picking. Private non-profit and private for-profit are both `private`; note for-profit status if found.

## Record about EVERY number — this matters more than the number itself

1. **`stat`** — is it a **median**, a **mean/average**, a **range**, or a **percentile band**? Schools differ and rarely make it obvious. **Never silently convert one into another.**
2. **`population`** — **matriculants**, **accepted**, or **all applicants**? If the page does not say, use `"unstated"`. **Never guess.**
3. **`classYear`** — which entering class, if stated.
4. **`sourceUrl`** — the exact page. Not the homepage.

## Return ONLY this JSON

```json
{
  "batch": 8,
  "retrievedAt": "YYYY-MM-DD",
  "cycle": "2026-2027",
  "schools": [{
    "id": "exact-id-from-the-list-below",
    "control": null,
    "medianMCAT": null, "medianGPA": null, "scienceGPA": null,
    "classSize": null, "inStatePercent": null,
    "inStateFriendly": null, "inStateStatement": null,
    "mission": [],
    "tuition": { "inState": null, "outOfState": null, "secondaryFee": null, "feeWaiverPolicy": null },
    "prereqs": [{ "area": "the school's own wording", "lab": null, "amount": null, "policyNotes": "" }],
    "letterRequirements": { "min": null, "max": null, "requiredRoles": [], "committeePacketAccepted": null, "route": "service | direct | unstated", "note": "" },
    "deadlines": { "primary": null, "secondary": null, "interviewSeason": null, "cycleLabel": null },
    "admissionsTests": {
      "PREview": { "levelVerbatim": null, "completenessEffect": null, "cycleLabel": null },
      "CASPer":  { "levelVerbatim": null, "completenessEffect": null, "cycleLabel": null }
    },
    "fieldSources": {
      "profile":         { "source": "", "checkedOn": "", "stat": "", "population": "", "classYear": null },
      "cost":            { "source": "", "checkedOn": "" },
      "prereqs":         { "source": "", "checkedOn": "" },
      "letters":         { "source": "", "checkedOn": "" },
      "deadlines":       { "source": "", "checkedOn": "" },
      "admissionsTests": { "source": "", "checkedOn": "" },
      "control":         { "source": "", "checkedOn": "" }
    },
    "confidence": "high | medium | low",
    "profileStatus": ""
  }]
}
```

## Rules

- **Return the `id` exactly as given.** It is the merge key — a changed id breaks the merge silently.
- **`null` whenever the school does not publish it.** Never substitute a national average, a parent institution's figure, or another campus of the same school.
- **Branch campuses report together or not at all.** Several entries below are distinct teaching locations of one college. If the parent publishes one profile covering all campuses, put it on **each** campus and say so in the note. **Do not invent per-campus splits.**
- **`confidence: "low"`** whenever `population` is unstated, the page is undated, or you interpreted a range.
- **Newly accredited schools may have no entering class yet.** That is `null` plus a note, not a gap to fill.
- **⚠️ Deadlines are the highest-risk field here. If you cannot confirm which cycle a date belongs to, return `null`.** A confidently wrong deadline costs someone an application.
- **⚠️ Do NOT collect acceptance rate.** It is deliberately excluded from this product and must not appear in the output.
- **Report coverage at the end** — how many of the 30 got each field, and every `null` with its reason.

**If you cannot find a school's page at all, say so.** Do not fall back to a compiled list.

## The 30 schools in this batch

- `east-tennessee-state-university-james-h-quillen-college-of-medicine` — East Tennessee State University James H. Quillen College of Medicine (MD, TN)
- `meharry-medical-college` — Meharry Medical College (MD, TN)
- `thomas-f-frist-jr-college-of-medicine-at-belmont-university` — Thomas F. Frist, Jr. College of Medicine at Belmont University (MD, TN)
- `university-of-tennessee-health-science-center-college-of-medicine` — University of Tennessee Health Science Center College of Medicine (MD, TN)
- `vanderbilt-university-school-of-medicine` — Vanderbilt University School of Medicine (MD, TN)
- `baylor-college-of-medicine` — Baylor College of Medicine (MD, TX)
- `dell-medical-school-at-the-university-of-texas-at-austin` — Dell Medical School at The University of Texas at Austin (MD, TX)
- `long-school-of-medicine-at-ut-health-san-antonio` — Long School of Medicine at UT Health San Antonio (MD, TX)
- `mcgovern-medical-school-at-uthealth-houston` — McGovern Medical School at UTHealth Houston (MD, TX)
- `texas-a-m-university-school-of-medicine` — Texas A&M University Naresh K. Vashisht College of Medicine (MD, TX)
- `texas-christian-university-burnett-school-of-medicine` — Texas Christian University Burnett School of Medicine (MD, TX)
- `texas-tech-university-health-sciences-center-paul-l-foster-school-of-medicine` — Texas Tech University Health Sciences Center Paul L. Foster School of Medicine (MD, TX)
- `texas-tech-university-health-sciences-center-school-of-medicine` — Texas Tech University Health Sciences Center School of Medicine (MD, TX)
- `university-of-houston-tilman-j-fertitta-family-college-of-medicine` — University of Houston Tilman J. Fertitta Family College of Medicine (MD, TX)
- `university-of-texas-medical-branch-john-sealy-school-of-medicine` — University of Texas Medical Branch John Sealy School of Medicine (MD, TX)
- `university-of-texas-rio-grande-valley-school-of-medicine` — University of Texas Rio Grande Valley School of Medicine (MD, TX)
- `university-of-texas-southwestern-medical-school` — University of Texas Southwestern Medical School (MD, TX)
- `university-of-texas-at-tyler-school-of-medicine` — University of Texas at Tyler School of Medicine (MD, TX)
- `university-of-utah-spencer-fox-eccles-school-of-medicine` — University of Utah Spencer Fox Eccles School of Medicine (MD, UT)
- `eastern-virginia-medical-school-at-old-dominion-university` — Eastern Virginia Medical School at Old Dominion University (MD, VA)
- `university-of-virginia-school-of-medicine` — University of Virginia School of Medicine (MD, VA)
- `virginia-commonwealth-university-school-of-medicine` — Virginia Commonwealth University School of Medicine (MD, VA)
- `virginia-tech-carilion-school-of-medicine` — Virginia Tech Carilion School of Medicine (MD, VA)
- `robert-larner-m-d-college-of-medicine-at-the-university-of-vermont` — Robert Larner, M.D. College of Medicine at the University of Vermont (MD, VT)
- `elson-s-floyd-college-of-medicine-at-washington-state-university` — Elson S. Floyd College of Medicine at Washington State University (MD, WA)
- `university-of-washington-school-of-medicine` — University of Washington School of Medicine (MD, WA)
- `medical-college-of-wisconsin` — Medical College of Wisconsin (MD, WI)
- `university-of-wisconsin-school-of-medicine-and-public-health` — University of Wisconsin School of Medicine and Public Health (MD, WI)
- `marshall-university-joan-c-edwards-school-of-medicine` — Marshall University Joan C. Edwards School of Medicine (MD, WV)
- `west-virginia-university-school-of-medicine` — West Virginia University School of Medicine (MD, WV)
