# PASTE-READY — School profile, batch 1 of 8 (30 schools)

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
  "batch": 1,
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

- `alabama-college-of-osteopathic-medicine` — Alabama College of Osteopathic Medicine (DO, AL)
- `edward-via-college-of-osteopathic-medicine-auburn-campus` — Edward Via College of Osteopathic Medicine Auburn Campus (DO, AL)
- `arkansas-college-of-osteopathic-medicine` — Arkansas College of Osteopathic Medicine (DO, AR)
- `new-york-institute-of-technology-college-of-osteopathic-medicine-at-arkansas-state` — New York Institute of Technology College of Osteopathic Medicine at Arkansas State (DO, AR)
- `a-t-still-university-school-of-osteopathic-medicine-in-arizona` — A.T. Still University School of Osteopathic Medicine in Arizona (DO, AZ)
- `arizona-college-of-osteopathic-medicine-of-midwestern-university` — Arizona College of Osteopathic Medicine of Midwestern University (DO, AZ)
- `the-valley-college-of-osteopathic-medicine` — The Valley College of Osteopathic Medicine (DO, AZ  **← control MISSING, needed**)
- `california-health-sciences-university-college-of-osteopathic-medicine` — California Health Sciences University College of Osteopathic Medicine (DO, CA)
- `touro-university-california-college-of-osteopathic-medicine` — Touro University California College of Osteopathic Medicine (DO, CA)
- `western-university-of-health-sciences-college-of-osteopathic-medicine-of-the-pacific` — Western University of Health Sciences College of Osteopathic Medicine of the Pacific (DO, CA)
- `rocky-vista-university-college-of-osteopathic-medicine` — Rocky Vista University College of Osteopathic Medicine (DO, CO)
- `university-of-northern-colorado-college-of-osteopathic-medicine` — University of Northern Colorado College of Osteopathic Medicine (DO, CO  **← control MISSING, needed**)
- `burrell-college-of-osteopathic-medicine-florida` — Burrell College of Osteopathic Medicine Florida (DO, FL)
- `lake-erie-college-of-osteopathic-medicine-bradenton` — Lake Erie College of Osteopathic Medicine Bradenton (DO, FL)
- `lake-erie-college-of-osteopathic-medicine-at-jacksonville-university` — Lake Erie College of Osteopathic Medicine at Jacksonville University (DO, FL  **← control MISSING, needed**)
- `lincoln-memorial-university-debusk-college-of-osteopathic-medicine-at-orange-park` — Lincoln Memorial University - DeBusk College of Osteopathic Medicine at Orange Park (DO, FL  **← control MISSING, needed**)
- `nova-southeastern-university-dr-kiran-c-patel-college-of-osteopathic-medicine` — Nova Southeastern University Dr. Kiran C. Patel College of Osteopathic Medicine (DO, FL)
- `nova-southeastern-university-dr-kiran-c-patel-college-of-osteopathic-medicine-clearwater` — Nova Southeastern University Dr. Kiran C. Patel College of Osteopathic Medicine - Clearwater (DO, FL  **← control MISSING, needed**)
- `orlando-college-of-osteopathic-medicine` — Orlando College of Osteopathic Medicine (DO, FL  **← control MISSING, needed**)
- `philadelphia-college-of-osteopathic-medicine-georgia` — Philadelphia College of Osteopathic Medicine Georgia (DO, GA)
- `philadelphia-college-of-osteopathic-medicine-south-georgia` — Philadelphia College of Osteopathic Medicine South Georgia (DO, GA  **← control MISSING, needed**)
- `des-moines-university-college-of-osteopathic-medicine` — Des Moines University College of Osteopathic Medicine (DO, IA)
- `idaho-college-of-osteopathic-medicine` — Idaho College of Osteopathic Medicine (DO, ID)
- `chicago-college-of-osteopathic-medicine-of-midwestern-university` — Chicago College of Osteopathic Medicine of Midwestern University (DO, IL)
- `illinois-college-of-osteopathic-medicine` — Illinois College of Osteopathic Medicine (DO, IL  **← control MISSING, needed**)
- `marian-university-tom-and-julie-wood-college-of-osteopathic-medicine` — Marian University Tom and Julie Wood College of Osteopathic Medicine (DO, IN)
- `kansas-college-of-osteopathic-medicine` — Kansas College of Osteopathic Medicine (DO, KS)
- `university-of-pikeville-kentucky-college-of-osteopathic-medicine` — University of Pikeville Kentucky College of Osteopathic Medicine (DO, KY)
- `edward-via-college-of-osteopathic-medicine-louisiana-campus` — Edward Via College of Osteopathic Medicine Louisiana Campus (DO, LA)
- `meritus-school-of-osteopathic-medicine` — Meritus School of Osteopathic Medicine (DO, MD  **← control MISSING, needed**)
