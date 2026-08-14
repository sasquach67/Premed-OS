# PASTE-READY — School profile, batch 5 of 8 (30 schools)

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
  "batch": 5,
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

- `loyola-university-chicago-stritch-school-of-medicine` — Loyola University Chicago Stritch School of Medicine (MD, IL)
- `northwestern-university-feinberg-school-of-medicine` — Northwestern University Feinberg School of Medicine (MD, IL)
- `rush-medical-college-of-rush-university-medical-center` — Rush Medical College of Rush University Medical Center (MD, IL)
- `southern-illinois-university-school-of-medicine` — Southern Illinois University School of Medicine (MD, IL)
- `university-of-chicago-pritzker-school-of-medicine` — University of Chicago Pritzker School of Medicine (MD, IL)
- `university-of-illinois-college-of-medicine` — University of Illinois College of Medicine (MD, IL)
- `indiana-university-school-of-medicine` — Indiana University School of Medicine (MD, IN)
- `university-of-kansas-school-of-medicine` — University of Kansas School of Medicine (MD, KS)
- `university-of-kentucky-college-of-medicine` — University of Kentucky College of Medicine (MD, KY)
- `university-of-louisville-school-of-medicine` — University of Louisville School of Medicine (MD, KY)
- `louisiana-state-university-school-of-medicine-in-new-orleans` — Louisiana State University School of Medicine in New Orleans (MD, LA)
- `louisiana-state-university-school-of-medicine-in-shreveport` — Louisiana State University School of Medicine in Shreveport (MD, LA)
- `tulane-university-school-of-medicine` — Tulane University School of Medicine (MD, LA)
- `boston-university-aram-v-chobanian-edward-avedisian-school-of-medicine` — Boston University Aram V. Chobanian & Edward Avedisian School of Medicine (MD, MA)
- `harvard-medical-school` — Harvard Medical School (MD, MA)
- `tufts-university-school-of-medicine` — Tufts University School of Medicine (MD, MA)
- `university-of-massachusetts-t-h-chan-school-of-medicine` — University of Massachusetts T.H. Chan School of Medicine (MD, MA)
- `johns-hopkins-university-school-of-medicine` — Johns Hopkins University School of Medicine (MD, MD)
- `uniformed-services-university-of-the-health-sciences-f-edward-hebert-school-of-medicine` — Uniformed Services University of the Health Sciences F. Edward Hebert School of Medicine (MD, MD)
- `university-of-maryland-school-of-medicine` — University of Maryland School of Medicine (MD, MD)
- `tufts-university-school-of-medicine-maine-track` — Tufts University School of Medicine Maine Track (MD, ME)
- `central-michigan-university-college-of-medicine` — Central Michigan University College of Medicine (MD, MI)
- `michigan-state-university-college-of-human-medicine` — Michigan State University College of Human Medicine (MD, MI)
- `oakland-university-william-beaumont-school-of-medicine` — Oakland University William Beaumont School of Medicine (MD, MI)
- `university-of-michigan-medical-school` — University of Michigan Medical School (MD, MI)
- `wayne-state-university-school-of-medicine` — Wayne State University School of Medicine (MD, MI)
- `western-michigan-university-homer-stryker-m-d-school-of-medicine` — Western Michigan University Homer Stryker M.D. School of Medicine (MD, MI)
- `mayo-clinic-alix-school-of-medicine` — Mayo Clinic Alix School of Medicine (MD, MN)
- `university-of-minnesota-medical-school` — University of Minnesota Medical School (MD, MN)
- `saint-louis-university-school-of-medicine` — Saint Louis University School of Medicine (MD, MO)
