# Research prompt — `data/unc-requirements.json`

Paste the block below into ChatGPT (use its deep-research / web mode). It produces the UNC requirement dataset that powers the Requirements audit. Output must match the schema so it drops into `data/unc-requirements.json` unchanged.

## How to run this (it's too big for one chat response)

This is a large research task — don't force it into a single reply. Do one of:

- **Preferred — dedicated multi-step run to a file.** Add to the prompt: *"Run this as a dedicated multi-step deep-research task and write the final JSON to a canvas / downloadable file, not into the chat."* Writing to a canvas avoids truncation.
- **Or chunk it into ~8 passes**, each returning one valid self-contained JSON slice; merge afterward. The schema composes — `genEd[]`, `medPrereqs[]`, and each `majors[]` entry are independent:
  1. gen-ed (IDEAs in Action) · 2. med prereqs · 3–8. one major each (Biology, Chemistry, Neuroscience, Psychology, Exercise & Sport Science, Nutrition).

**You don't need it all to ship.** Gen-ed + med prereqs + **Biology + Neuroscience** = a usable audit for most UNC pre-meds. Start there; add the other majors as later slices. Send me any slice and I'll validate + merge.

---

You are a meticulous academic-requirements researcher. Produce a **structured, source-cited JSON dataset** of the current undergraduate graduation requirements at **UNC–Chapel Hill**, for use as authoritative reference data in a pre-med planning app. Accuracy and citations matter more than speed — this data drives a real graduation audit, so **never guess; if unsure, mark it**.

**Scope & sources (use official/authoritative only):**
- Current gen-ed curriculum is **IDEAs in Action** (launched Fall 2022; applies to all degree-seeking undergrads matriculating Fall 2022 or later). It replaced the retired "Making Connections" curriculum — do not use Making Connections.
- Primary sources: `catalog.unc.edu` (IDEAs in Action pages), `ideasinaction.unc.edu`, `curricula.unc.edu`. For med prerequisites use AAMC guidance.
- Note recent changes (e.g., the UNC System dropped the U.S. Diversity requirement in 2025) and reflect the current state.
- Every record must carry the exact `source` URL it came from and today's date as `retrievedAt`.

**Produce three parts:**
1. **genEd** — the full IDEAs in Action structure: First-Year Foundations (First-Year Seminar/Launch, University Writing, Global Language, Triple-I "Ideas, Information & Inquiry", College Thriving), Focus Capacities, Reflection & Integration, and Supplemental Gen Ed (B.A. only). Include grading rules (e.g., cannot be Pass/Fail).
2. **medPrereqs** — the standard MD/DO prerequisite areas (biology, general chemistry, organic chemistry, biochemistry, physics, math/statistics, English, psychology, sociology), each mapped to the typical UNC courses that satisfy it. Note that specific schools vary.
3. **majors** — requirements for these common pre-med majors to start: **Biology (B.S.), Chemistry (B.S.), Neuroscience (B.S.), Psychology (B.S.), Exercise & Sport Science, Nutrition**. Structure so any additional major can be appended later.

**Output — return ONLY this JSON (no prose):**

```json
{
  "meta": {
    "curriculum": "IDEAs in Action",
    "appliesTo": "degree-seeking undergraduates matriculating Fall 2022 or later",
    "retrievedAt": "YYYY-MM-DD",
    "sources": ["https://catalog.unc.edu/undergraduate/ideas-in-action/"]
  },
  "genEd": [
    {
      "id": "fyf-university-writing",
      "group": "First-Year Foundations | Focus Capacities | Reflection and Integration | Supplemental Gen Ed (BA)",
      "name": "University Writing",
      "description": "what the requirement is",
      "credits": 3,
      "howSatisfied": "e.g. one course from ENGL 105/105i",
      "exampleCourses": ["ENGL 105", "ENGL 105i"],
      "grading": "cannot be taken Pass/Fail",
      "notes": "",
      "confidence": "high | medium | low",
      "source": "https://catalog.unc.edu/..."
    }
  ],
  "medPrereqs": [
    {
      "id": "gen-chem",
      "name": "General Chemistry (with lab)",
      "category": "chemistry",
      "typicalUncCourses": ["CHEM 101 + 101L", "CHEM 102 + 102L"],
      "notes": "MD/DO expectation; some schools accept AP, some don't",
      "confidence": "high | medium | low",
      "source": "https://students-residents.aamc.org/..."
    }
  ],
  "majors": [
    {
      "major": "Biology",
      "degree": "B.S.",
      "requirements": [
        {
          "id": "biol-core",
          "name": "requirement name",
          "courses": ["BIOL 201", "BIOL 202"],
          "credits": 3,
          "notes": "",
          "confidence": "high | medium | low",
          "source": "https://catalog.unc.edu/..."
        }
      ],
      "source": "https://catalog.unc.edu/..."
    }
  ]
}
```

Rules: use exact UNC course codes; set `confidence: "low"` and add a `notes` caveat wherever the catalog is ambiguous or you're inferring; do not fabricate course numbers; keep it valid JSON.

---

**After it returns:** save as `data/unc-requirements.json` in the repo. The Requirements audit (`tabs/01-academics.md` §4.2-A) builds against this file, not a live URL.
