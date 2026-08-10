# Research prompt — `data/med-schools.json`

Paste into ChatGPT (deep-research / web mode). Produces the med-school dataset powering the School List tab. Output must be valid JSON matching the schema.

---

You are a meticulous medical-school data researcher. Produce a **structured, source-cited JSON dataset** of U.S. MD (and optionally DO) schools for a pre-med planning app. Accuracy and citations matter — this drives a real school-list tool. **Never guess admissions stats; cite each, and mark uncertainty.**

**Sources (authoritative only):** AAMC MSAR, each school's official admissions page, AACOMAS for DO. Prefer the most recent cycle available; record the cycle year.

**Scope:** start with a manageable, representative set (~25–40 schools: a mix of in-state NC — UNC, Duke, ECU, Wake Forest, Campbell (DO) — plus a national spread across selectivity tiers). Structure so more schools append later.

**Per school capture:** name, type (MD/DO), public/private, state, median GPA, median MCAT, acceptance rate, prerequisite expectations (course areas + AP/community-college policies), mission focus (e.g., primary care / research / service), notable deadlines (secondary/interview timing), and whether it's in-state-friendly for NC residents.

**Output — return ONLY this JSON:**

```json
{
  "meta": { "cycle": "2025-2026", "retrievedAt": "YYYY-MM-DD", "sources": ["https://mec.aamc.org/msar/"] },
  "schools": [
    {
      "id": "unc-som",
      "name": "UNC School of Medicine",
      "type": "MD",
      "control": "public",
      "state": "NC",
      "medianGPA": 3.8,
      "medianMCAT": 515,
      "acceptanceRate": 0.04,
      "inStateFriendly": true,
      "prereqs": ["biology", "gen chem", "orgo", "biochem", "physics", "english"],
      "prereqNotes": "AP policy, CC policy, etc.",
      "mission": ["primary care", "service"],
      "deadlines": { "secondaryTypical": "", "interviewSeason": "" },
      "confidence": "high | medium | low",
      "source": "https://..."
    }
  ]
}
```

Rules: cite every stat; set `confidence:"low"` + a note where data is old/estimated; valid JSON only; no fabricated numbers.

---

**After it returns:** save as `data/med-schools.json`. The School List tab builds against this file.
