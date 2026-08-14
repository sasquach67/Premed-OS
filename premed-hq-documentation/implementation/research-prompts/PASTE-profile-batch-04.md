# PASTE-READY — School profile, batch 4 of 8 (30 schools)

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
  "batch": 4,
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

- `university-of-california-irvine-school-of-medicine` — University of California, Irvine, School of Medicine (MD, CA)
- `university-of-california-los-angeles-david-geffen-school-of-medicine` — University of California, Los Angeles David Geffen School of Medicine (MD, CA)
- `university-of-california-riverside-school-of-medicine` — University of California, Riverside School of Medicine (MD, CA)
- `university-of-california-san-diego-school-of-medicine` — University of California, San Diego School of Medicine (MD, CA)
- `university-of-california-san-francisco-school-of-medicine` — University of California, San Francisco School of Medicine (MD, CA)
- `university-of-colorado-school-of-medicine` — University of Colorado School of Medicine (MD, CO)
- `frank-h-netter-md-school-of-medicine-at-quinnipiac-university` — Frank H. Netter MD School of Medicine at Quinnipiac University (MD, CT)
- `university-of-connecticut-school-of-medicine` — University of Connecticut School of Medicine (MD, CT)
- `yale-school-of-medicine` — Yale School of Medicine (MD, CT)
- `george-washington-university-school-of-medicine-and-health-sciences` — George Washington University School of Medicine and Health Sciences (MD, DC)
- `georgetown-university-school-of-medicine` — Georgetown University School of Medicine (MD, DC)
- `howard-university-college-of-medicine` — Howard University College of Medicine (MD, DC)
- `sidney-kimmel-medical-college-at-thomas-jefferson-university-delaware-regional-medical-cam` — Sidney Kimmel Medical College at Thomas Jefferson University - Delaware Regional Medical Campus (MD, DE)
- `charles-e-schmidt-college-of-medicine-at-florida-atlantic-university` — Charles E. Schmidt College of Medicine at Florida Atlantic University (MD, FL)
- `florida-international-university-herbert-wertheim-college-of-medicine` — Florida International University Herbert Wertheim College of Medicine (MD, FL)
- `florida-state-university-college-of-medicine` — Florida State University College of Medicine (MD, FL)
- `nova-southeastern-university-dr-kiran-c-patel-college-of-allopathic-medicine` — Nova Southeastern University Dr. Kiran C. Patel College of Allopathic Medicine (MD, FL  **← control MISSING, needed**)
- `university-of-central-florida-college-of-medicine` — University of Central Florida College of Medicine (MD, FL)
- `university-of-florida-college-of-medicine` — University of Florida College of Medicine (MD, FL)
- `university-of-miami-leonard-m-miller-school-of-medicine` — University of Miami Leonard M. Miller School of Medicine (MD, FL)
- `university-of-south-florida-health-morsani-college-of-medicine` — University of South Florida Health Morsani College of Medicine (MD, FL)
- `emory-university-school-of-medicine` — Emory University School of Medicine (MD, GA)
- `medical-college-of-georgia-at-augusta-university` — Medical College of Georgia at Augusta University (MD, GA)
- `mercer-university-school-of-medicine` — Mercer University School of Medicine (MD, GA)
- `morehouse-school-of-medicine` — Morehouse School of Medicine (MD, GA)
- `university-of-georgia-school-of-medicine` — University of Georgia School of Medicine (MD, GA)
- `university-of-hawaii-john-a-burns-school-of-medicine` — University of Hawaii John A. Burns School of Medicine (MD, HI)
- `university-of-iowa-roy-j-and-lucille-a-carver-college-of-medicine` — University of Iowa Roy J. and Lucille A. Carver College of Medicine (MD, IA)
- `carle-illinois-college-of-medicine` — Carle Illinois College of Medicine (MD, IL)
- `chicago-medical-school-at-rosalind-franklin-university` — Chicago Medical School at Rosalind Franklin University (MD, IL)
