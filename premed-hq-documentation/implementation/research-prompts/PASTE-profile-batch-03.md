# PASTE-READY — School profile, batch 3 of 8 (30 schools)

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
  "batch": 3,
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

- `lake-erie-college-of-osteopathic-medicine-seton-hill` — Lake Erie College of Osteopathic Medicine - Seton Hill (DO, PA  **← control MISSING, needed**)
- `philadelphia-college-of-osteopathic-medicine` — Philadelphia College of Osteopathic Medicine (DO, PA)
- `edward-via-college-of-osteopathic-medicine-carolinas-campus` — Edward Via College of Osteopathic Medicine Carolinas Campus (DO, SC)
- `baptist-health-sciences-university-college-of-osteopathic-medicine` — Baptist Health Sciences University College of Osteopathic Medicine (DO, TN)
- `lincoln-memorial-university-debusk-college-of-osteopathic-medicine` — Lincoln Memorial University DeBusk College of Osteopathic Medicine (DO, TN)
- `lincoln-memorial-university-debusk-college-of-osteopathic-medicine-knoxville` — Lincoln Memorial University DeBusk College of Osteopathic Medicine Knoxville (DO, TN)
- `sam-houston-state-university-college-of-osteopathic-medicine` — Sam Houston State University College of Osteopathic Medicine (DO, TX)
- `university-of-north-texas-health-science-center-texas-college-of-osteopathic-medicine` — University of North Texas Health Science Center Texas College of Osteopathic Medicine (DO, TX)
- `university-of-the-incarnate-word-school-of-osteopathic-medicine` — University of the Incarnate Word School of Osteopathic Medicine (DO, TX  **← control MISSING, needed**)
- `noorda-college-of-osteopathic-medicine` — Noorda College of Osteopathic Medicine (DO, UT  **← control MISSING, needed**)
- `rocky-vista-university-college-of-osteopathic-medicine-southern-utah` — Rocky Vista University College of Osteopathic Medicine Southern Utah (DO, UT)
- `edward-via-college-of-osteopathic-medicine-virginia-campus` — Edward Via College of Osteopathic Medicine Virginia Campus (DO, VA)
- `liberty-university-college-of-osteopathic-medicine` — Liberty University College of Osteopathic Medicine (DO, VA)
- `pacific-northwest-university-of-health-sciences-college-of-osteopathic-medicine` — Pacific Northwest University of Health Sciences College of Osteopathic Medicine (DO, WA)
- `west-virginia-school-of-osteopathic-medicine` — West Virginia School of Osteopathic Medicine (DO, WV)
- `university-of-alabama-at-birmingham-marnix-e-heersink-school-of-medicine` — University of Alabama at Birmingham Marnix E. Heersink School of Medicine (MD, AL)
- `university-of-south-alabama-frederick-p-whiddon-college-of-medicine` — University of South Alabama Frederick P. Whiddon College of Medicine (MD, AL)
- `alice-l-walton-school-of-medicine` — Alice L. Walton School of Medicine (MD, AR)
- `university-of-arkansas-for-medical-sciences-college-of-medicine` — University of Arkansas for Medical Sciences College of Medicine (MD, AR)
- `arizona-state-university-john-shufeldt-school-of-medicine-and-medical-engineering` — Arizona State University John Shufeldt School of Medicine and Medical Engineering (MD, AZ)
- `university-of-arizona-college-of-medicine-phoenix` — University of Arizona College of Medicine - Phoenix (MD, AZ)
- `university-of-arizona-college-of-medicine-tucson` — University of Arizona College of Medicine - Tucson (MD, AZ)
- `california-northstate-university-college-of-medicine` — California Northstate University College of Medicine (MD, CA)
- `california-university-of-science-and-medicine` — California University of Science and Medicine (MD, CA)
- `charles-r-drew-university-of-medicine-and-science-college-of-medicine` — Charles R. Drew University of Medicine and Science College of Medicine (MD, CA  **← control MISSING, needed**)
- `kaiser-permanente-bernard-j-tyson-school-of-medicine` — Kaiser Permanente Bernard J. Tyson School of Medicine (MD, CA)
- `keck-school-of-medicine-of-the-university-of-southern-california` — Keck School of Medicine of the University of Southern California (MD, CA)
- `loma-linda-university-school-of-medicine` — Loma Linda University School of Medicine (MD, CA)
- `stanford-university-school-of-medicine` — Stanford University School of Medicine (MD, CA)
- `university-of-california-davis-school-of-medicine` — University of California, Davis, School of Medicine (MD, CA)
