# PASTE-READY — School profile, batch 6 of 8 (30 schools)

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
  "batch": 6,
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

- `university-of-missouri-columbia-school-of-medicine` — University of Missouri-Columbia School of Medicine (MD, MO)
- `university-of-missouri-kansas-city-school-of-medicine` — University of Missouri-Kansas City School of Medicine (MD, MO)
- `washington-university-school-of-medicine-in-st-louis` — Washington University School of Medicine in St. Louis (MD, MO)
- `university-of-mississippi-school-of-medicine` — University of Mississippi School of Medicine (MD, MS)
- `brody-school-of-medicine-at-east-carolina-university` — Brody School of Medicine at East Carolina University (MD, NC)
- `duke-university-school-of-medicine` — Duke University School of Medicine (MD, NC)
- `methodist-university-cape-fear-valley-health-school-of-medicine` — Methodist University Cape Fear Valley Health School of Medicine (MD, NC)
- `unc-school-of-medicine` — UNC School of Medicine (MD, NC)
- `wake-forest-university-school-of-medicine` — Wake Forest University School of Medicine (MD, NC)
- `university-of-north-dakota-school-of-medicine-and-health-sciences` — University of North Dakota School of Medicine and Health Sciences (MD, ND)
- `creighton-university-school-of-medicine` — Creighton University School of Medicine (MD, NE)
- `university-of-nebraska-college-of-medicine` — University of Nebraska College of Medicine (MD, NE)
- `geisel-school-of-medicine-at-dartmouth` — Geisel School of Medicine at Dartmouth (MD, NH)
- `cooper-medical-school-of-rowan-university` — Cooper Medical School of Rowan University (MD, NJ)
- `hackensack-meridian-school-of-medicine` — Hackensack Meridian School of Medicine (MD, NJ)
- `rutgers-new-jersey-medical-school` — Rutgers New Jersey Medical School (MD, NJ)
- `rutgers-robert-wood-johnson-medical-school` — Rutgers Robert Wood Johnson Medical School (MD, NJ)
- `university-of-new-mexico-school-of-medicine` — University of New Mexico School of Medicine (MD, NM)
- `kirk-kerkorian-school-of-medicine-at-unlv` — Kirk Kerkorian School of Medicine at UNLV (MD, NV)
- `roseman-university-college-of-medicine` — Roseman University College of Medicine (MD, NV)
- `university-of-nevada-reno-school-of-medicine` — University of Nevada, Reno School of Medicine (MD, NV)
- `albany-medical-college` — Albany Medical College (MD, NY)
- `albert-einstein-college-of-medicine` — Albert Einstein College of Medicine (MD, NY)
- `cuny-school-of-medicine` — CUNY School of Medicine (MD, NY)
- `columbia-university-vagelos-college-of-physicians-and-surgeons` — Columbia University Vagelos College of Physicians and Surgeons (MD, NY)
- `donald-and-barbara-zucker-school-of-medicine-at-hofstra-northwell` — Donald and Barbara Zucker School of Medicine at Hofstra/Northwell (MD, NY)
- `icahn-school-of-medicine-at-mount-sinai` — Icahn School of Medicine at Mount Sinai (MD, NY)
- `jacobs-school-of-medicine-and-biomedical-sciences-at-the-university-at-buffalo` — Jacobs School of Medicine and Biomedical Sciences at the University at Buffalo (MD, NY)
- `new-york-medical-college` — New York Medical College (MD, NY)
- `new-york-university-grossman-long-island-school-of-medicine` — New York University Grossman Long Island School of Medicine (MD, NY)
