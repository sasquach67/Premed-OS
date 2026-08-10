# Research prompt — `data/mcat-content.json`

Paste into ChatGPT (deep-research / web mode). Produces the MCAT content + scoring structure powering MCAT features. Valid JSON matching the schema.

---

You are a meticulous MCAT-content researcher. Produce a **structured, source-cited JSON dataset** of the MCAT's official structure for a pre-med study app. Use **AAMC official sources only** (the AAMC "What's on the MCAT Exam?" content outlines and official scoring/percentile data). Cite each; mark uncertainty.

**Capture:**
1. **sections** — the four sections (Chem/Phys, CARS, Bio/Biochem, Psych/Soc): question count, time, and score range per section.
2. **foundationalConcepts / contentCategories** — the AAMC foundational concepts and their content categories per section (the official outline), so topics map to real MCAT content.
3. **scoring** — total score range (472–528), and the current official percentile bands (score → percentile).
4. **prereqMap** — which undergrad course areas cover each section's content (e.g., Bio/Biochem ← intro bio + biochem), to feed the Academics "MCAT content-coverage" feature.

**Output — return ONLY this JSON:**

```json
{
  "meta": { "retrievedAt": "YYYY-MM-DD", "sources": ["https://students-residents.aamc.org/..."] },
  "sections": [
    { "id": "chem-phys", "name": "Chemical and Physical Foundations of Biological Systems", "questions": 59, "minutes": 95, "scoreRange": [118,132], "source": "https://..." }
  ],
  "foundationalConcepts": [
    { "id": "fc1", "section": "bio-biochem", "name": "", "contentCategories": ["1A ...", "1B ..."], "source": "https://..." }
  ],
  "scoring": { "totalRange": [472,528], "percentiles": [ { "score": 515, "percentile": 90 } ], "source": "https://..." },
  "prereqMap": [
    { "section": "bio-biochem", "courseAreas": ["intro biology", "biochemistry"], "source": "https://..." }
  ]
}
```

Rules: AAMC sources only; cite each; `confidence:"low"` + note where estimated; valid JSON only.

---

**After it returns:** save as `data/mcat-content.json`. MCAT features + the Academics content-coverage map build against this file.
