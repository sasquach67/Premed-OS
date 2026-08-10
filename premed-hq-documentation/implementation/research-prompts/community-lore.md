# Research prompt — community lore (`data/community-lore.json`)

**Paste into a deep-research tool with live web access** (ChatGPT deep research, Gemini Deep Research, Perplexity Pro, or Claude with search). Produces the **Category B** dataset behind Atlas's community-knowledge layer: the tacit, unwritten pre-med knowledge that lives in forums and nowhere official.

**Why this is a research prompt and not a feature:** this material cannot be derived. It has to be gathered from where practitioners actually talk, dated, attributed, and weighted by how widely it's held. It is **opinion with evidence**, never fact — see `implementation/knowledge-sources.md` (Category A vs B).

**Run it in passes.** One pass per section below produces better results than one giant sweep. Expect 6–10 separate runs.

---

## THE PROMPT

You are a meticulous research analyst building a knowledge base of **tacit, community-held pre-med knowledge** for a student-facing app. Your job is to surface what experienced pre-meds, current medical students, residents, and physicians *actually say to each other* — the practical lore that is absent from official AAMC and university materials.

### Where to look

Prioritise, roughly in this order:

- **r/premed** — the primary source. Highest volume, most current.
- **r/medicalschool** — retrospective takes from people already in; often more honest than r/premed.
- **r/mcat** — study strategy, score reports, resource opinions.
- **r/Residency**, **r/medicine** — physicians looking back; the most valuable and most cynical.
- **Student Doctor Network (SDN)** forums — older, longer-form, heavy on application mechanics.
- **r/ApplyingToCollege** for the pre-college slice only.
- School-specific subreddits (**r/UNC** and similar) for local mechanics.
- Long-form: physician blogs, "why I left medicine" essays, admissions-officer AMAs, published med-student memoirs.

**Explicitly avoid as primary sources:** paid admissions consultants (they sell services), test-prep company blogs (they sell products), AI-generated content farms, and any page whose main purpose is lead generation. **You may note what they claim, marked as `commercial`.**

### What to capture — the sections

Run one pass per section.

**1. "Why medicine" — how people actually answer it**
- The answers that reportedly land in interviews and essays, and the ones that reportedly fall flat.
- The specific clichés adcoms are said to be tired of, quoted as people describe them.
- How people who got in describe *finding* their reason, versus manufacturing one.
- Honest accounts of doubt: people who weren't sure and applied anyway; people who realised it wasn't for them.
- **Capture the reasoning, not just the verdict.** *"'I want to help people' is too broad"* is worthless without *why* it's too broad and what a specific version sounds like.

**2. The unwritten rules of the application**
- Timing lore: how early is "early," what happens if you submit in August, when secondaries realistically need returning.
- What reportedly matters far more or far less than students expect.
- Letters of recommendation: who to ask, when, how, what a weak letter looks like, committee-letter mechanics.
- Interview formats and what people say actually gets evaluated.
- Post-interview etiquette, update letters, waitlist behaviour.
- School-list construction: how people describe over-reaching, under-reaching, and the cost of a bad list.

**3. Niche tips that don't appear in official guidance**
This is the highest-value section. Look for the small, specific, hard-won things:
- Logistics people wish they'd known a year earlier.
- Mistakes that cost someone a cycle, in their words.
- Things that are technically allowed but reportedly ill-advised, and the reverse.
- Free or cheap alternatives to things students assume they must pay for.
- Deadlines, forms, and transcript mechanics that quietly bite people.
- **Anything phrased as "nobody tells you that…" or "I wish I'd known…"** — search those phrasings directly.

**4. Experience hours — what's actually expected**
- Reported ranges for clinical, volunteering, shadowing, and research, and how people describe "enough."
- Which experiences reportedly carry weight versus which are seen as box-ticking.
- Scribing, EMT, CNA, MA: how people compare them, including the time-and-money cost.
- Non-clinical volunteering — how much, what kinds, whether it's genuinely weighted.
- Research: whether publication is expected, what counts, how people got in the door.
- **Capture the disagreements.** This is a topic where the community actively argues; record both sides with their reasoning.

**5. MCAT strategy lore**
- Resource consensus: which materials are near-universal and which are contested. Name them.
- Reported study-length norms, and where the community disagrees.
- Practice-material difficulty ordering, and the reported reliability of each publisher's score prediction. **Treat all numbers here as claims, not facts.**
- Retake lore: when people retake, what score change is considered realistic, how retakes are reportedly received.
- Void decision: what people who voided say afterwards, and what people who didn't say.
- Score-release week: what the wait is like, common reactions.

**6. Coursework and GPA lore**
- Which courses are widely described as GPA hazards, and why.
- Grade-trend narratives: how people describe recovering from a bad start.
- Post-bacc, SMP, and gap-year decisions — how people describe choosing.
- Dual-enrolment, AP, and transfer-credit reporting mechanics that catch people out.

**7. Burnout, wellbeing, and the honest costs**
- How people describe the actual emotional experience of a cycle.
- Attrition: people who stopped, why, and what they say now.
- What sustainable pacing reportedly looks like, from people who did it.
- **Report this factually and without editorialising.** Do not moralise, do not motivate. If sources describe distress, describe that they do.

**8. School-specific and UNC-specific mechanics**
- Advising quality, committee-letter process, prereq quirks, registration mechanics, known course landmines.
- Anything specific to a named institution — mark it clearly as institution-scoped.

### How to record each finding

For every claim, produce a record with **all** of these:

```json
{
  "id": "kebab-case-slug",
  "section": "why-medicine | application-rules | niche-tips | experience-hours | mcat-strategy | coursework-gpa | wellbeing | institution",
  "claim": "One sentence, in plain language, stated as a claim.",
  "reasoning": "WHY the community holds this. The mechanism, not just the assertion.",
  "consensusLevel": "near-universal | majority | contested | fringe",
  "disagreement": "If contested: the strongest counter-position and its reasoning. Required when consensusLevel is 'contested'.",
  "evidenceType": "lived-experience | secondhand | speculation | official-adjacent | commercial",
  "whoSaysIt": "Their stated position — e.g. 'M2, matriculated 2024', 'attending, 15 yrs', 'applicant, 2 cycles'. Never a username.",
  "sampleSize": "How many independent sources said something equivalent. A number.",
  "sources": ["https://..."],
  "dateRange": "Earliest–latest posting date of the sources. YYYY-MM to YYYY-MM.",
  "staleness": "evergreen | ages-fast | cycle-specific",
  "confidence": "high | medium | low",
  "quote": "One short representative quote, ≤40 words, only if it adds something a paraphrase can't.",
  "conflictsWithOfficial": "If it contradicts AAMC/university guidance, say what and where."
}
```

### Hard rules

1. **Never present community opinion as fact.** Every record is a claim with a source and a date.
2. **`consensusLevel` is not popularity.** A heavily-upvoted post is one source. Ten independent people saying the same thing is consensus. **Count independent sources, not karma.**
3. **Record disagreement rather than resolving it.** Where the community splits, capture both sides with reasoning. Flattening a genuine dispute into one answer is the main failure mode here.
4. **Flag survivor bias explicitly.** People who got in post more than people who didn't. Where a claim's evidence comes only from successful applicants, say so in `reasoning`.
5. **Date everything.** Admissions mechanics, test dates, resource quality, and score norms all change. Anything cycle-specific gets `staleness: "cycle-specific"`.
6. **No usernames, no personal identifiers, no linking to individuals' post histories.** Describe the poster's stated position only.
7. **Quote sparingly and briefly.** Paraphrase by default; a quote must earn its place.
8. **Do not include medical advice, mental-health advice, or crisis guidance.** Report that sources discuss difficulty; do not counsel.
9. **Mark commercial sources as `commercial`** and never let them set `consensusLevel`.
10. **Where a claim contradicts official AAMC or university guidance, record both** — that tension is itself the useful finding, and the app surfaces both sides.
11. **Prefer recent (last 3 cycles) for anything procedural.** Older sources are fine for `evergreen` material.
12. **Say what you couldn't find.** A section with thin evidence should say so rather than pad.

### Output

Return **valid JSON only**:

```json
{
  "meta": {
    "retrievedAt": "YYYY-MM-DD",
    "sectionsCovered": ["..."],
    "sourceCount": 0,
    "gaps": ["Topics where evidence was thin or absent"],
    "notes": "Anything the consumer of this data should be careful about."
  },
  "findings": [ /* records as above */ ]
}
```

---

## After it returns

1. **Save as `data/community-lore.json`.** Category B, freshness-tracked per `implementation/data-refresh.md`.
2. **Every consuming surface must show attribution, consensus level, and date.** A `contested` claim renders differently from a `near-universal` one — never identically.
3. **Feeds:** Atlas external-knowledge graph (`specifications/02-atlas-interface-and-knowledge-map.md`) · course-difficulty intel (Academics #11) · MCAT resource bank (`02-mcat.md` §7) · experience-hour guidance in the pillars · Advisor context.
4. **Captured conversation claims (Atlas §5) are a separate, weaker type** — `personal-source`, n = 1. **Do not merge them into this file.** When a personal claim conflicts with community consensus, the app shows both (Atlas §5).
5. **Re-run procedural sections each cycle.** `evergreen` findings can persist; `cycle-specific` ones expire.

---
---

# APPENDIX A — Full source map, by domain

**Andy, July 2026: go beyond the pre-med subs.** The best material on any given topic usually lives in the community that specialises in *that thing*, not in r/premed. People discussing how to take notes are in study-method communities. People honest about lab work are in r/labrats. People who receive letter requests are in professor communities.

**Rule: for every topic, search the pre-med subs AND the specialist community for that topic.** Where they disagree, that disagreement is a finding.

## A1. Study craft & learning method → feeds **Academics**

| Community | What it's good for |
|---|---|
| **r/GetStudying**, r/studytips, r/getdisciplined, r/productivity | Method lore, focus techniques, what people actually sustain |
| **r/Anki** ⭐, r/AnKingMed | FSRS settings, deck strategy, retention targets, preset debates, burnout from card debt |
| **r/medicalschool** (study threads) | The most method-literate student population anywhere; Anki/spacing/interleaving practice at volume |
| r/ObsidianMD, r/Notion, r/RemNote, r/logseq, r/Zettelkasten | Note-taking systems, linking, what breaks at scale |
| r/GoodNotes, r/iPadNotes, r/handwriting | Handwritten vs typed, tablet workflows |
| **r/OrganicChemistry** ⭐, r/chemhelp, r/biochemistry, r/PhysicsStudents, r/askmath, r/statistics | Course-specific lore: what makes orgo hard, how people actually pass, common conceptual traps |
| r/cognitivescience, r/Neuropsychology, r/languagelearning | Spacing/retrieval evidence and how SRS communities apply it |
| r/college, r/CollegeRant, r/AskAcademia | Registration mechanics, professor dynamics, workload reality |
| **Non-Reddit:** study-method YouTube (Ali Abdaal, Justin Sung, Icahn/Med-school channels), **TikTok study-method content** (Andy sourced the pre/post-lecture framework from TikTok — treat as a real source, cite the creator) | Method frameworks, often better packaged than forum posts |

**Search specifically for:** how to take notes for [course] · active recall vs rereading · Anki settings for [context] · why I stopped using [method] · how I went from C to A in orgo · note-taking system that survived med school.

## A2. Clinical experience → feeds **Clinical**

| Community | What it's good for |
|---|---|
| **r/NewToEMS** ⭐, r/ems, r/EMTsAndParamedics | EMT cert path, real cost, shift reality, whether it's worth it for pre-meds |
| r/CNA, r/phlebotomy, r/MedicalAssistant | Certification routes, pay, hours, what the work is actually like |
| **r/MedicalScribe**, r/scribes | Scribing companies, pay, learning value, hours reliability |
| **r/nursing** ⭐ | Brutally honest about hospital environments; how they perceive pre-meds in clinical settings |
| r/hospice, r/CriticalCare | Specific settings people describe as formative |
| r/premed (hours threads) | How much counts, what's reportedly weighted |

**Search for:** is EMT worth it for premed · scribe vs CNA vs EMT · how many clinical hours · what counts as clinical · patient contact definition.

## A3. Volunteering → feeds **Volunteering**

r/volunteer · r/nonprofit · r/CrisisTextLine and crisis-line communities · r/specialed and disability-service communities · food-bank and shelter volunteering threads · r/premed non-clinical threads.

**Search for:** non-clinical volunteering premed · how many hours volunteering · meaningful vs box-checking · long-term vs one-off volunteering.

## A4. Shadowing → feeds **Shadowing**

r/premed · r/medicine · **individual specialty subs** (see A9) · r/physicianassistant (adjacent framing) · r/medicalschool retrospectives.

**Search for:** how to find shadowing · cold emailing doctors template · shadowing hours enough · what to do while shadowing · shadowing during covid/after.

## A5. Research → feeds **Research**

| Community | What it's good for |
|---|---|
| **r/labrats** ⭐⭐ | The single best source on what lab work is actually like. Unfiltered. |
| **r/AskAcademia**, r/GradSchool, r/PhD | PI dynamics, authorship, how to get into a lab, when to leave one |
| r/neuroscience, r/bioinformatics, r/biology, r/chemistry | Field-specific entry paths |
| r/statistics, r/AskStatistics | The analysis skills nobody teaches pre-meds |
| r/premed research threads | Whether pubs matter, poster vs paper, how to talk about research in interviews |

**Search for:** how to get into a lab as an undergrad · cold email PI · is a publication necessary premed · poster vs publication · my PI is · when to leave a lab.

## A6. Extracurriculars & leadership → feeds **Extracurriculars**

r/college · r/premed EC threads · club/greek-life subs · r/nonprofit (for founding things) · r/AskAcademia (TA/tutoring lore).

**Search for:** which ECs matter premed · founding a club worth it · leadership positions premed · depth vs breadth extracurriculars.

## A7. Essays & personal statement → feeds **Essays & Story Bank**

r/premed (PS threads) · SDN essay forums · **r/ApplyingToCollege** (essay craft transfers well; the community is unusually good at critique) · r/writing for structure only.

**Search for:** why medicine essay · personal statement mistakes · how many drafts · showing not telling personal statement · most common personal statement clichés.

## A8. Letters of recommendation → feeds **Letters**

| Community | What it's good for |
|---|---|
| **r/AskProfessors** ⭐⭐, **r/Professors** ⭐⭐ | **The other side of the request.** How faculty actually experience letter asks, what makes a letter weak, timing that annoys them. Almost nobody looks here and it's the highest-value asymmetry in this whole appendix. |
| r/AskAcademia | Same, broader |
| r/premed | Committee-letter mechanics, who to ask, timing |

**Search for:** student asked me for a letter · how to write a strong letter · what makes a letter lukewarm · how much notice for a rec letter · committee letter process.

## A9. Specialty exploration → feeds **Timeline**, **Essays**, career reasoning

**Individual specialty subs are where "what is this actually like" lives:**
r/emergencymedicine · r/anesthesiology · r/Radiology · r/surgery · r/psychiatry · r/FamilyMedicine · r/InternalMedicine · r/pediatrics · r/OBGYN · r/pathology · r/Dermatology · r/neurology · plus **r/Residency** and **r/medicine** for cross-specialty candour.

**Search for:** would you choose this specialty again · day in the life · what I wish I knew before matching · lifestyle vs pay tradeoff.

## A10. Application mechanics & school list → feeds **School List**

r/premed ⭐ · **SDN school-specific threads** ⭐ · r/medicalschool (matriculant retrospectives) · r/mdphd · r/osteopathic and DO-specific communities · r/premedcanada and international equivalents where relevant.

**Search for:** school list too top-heavy · when to submit primary · secondary turnaround time · interview invite timing · waitlist movement.

## A11. Non-traditional, gap year, reinvention → feeds **Timeline**

r/nontradpremed ⭐ · r/postbaccpremed · r/premed gap-year threads · r/GradSchool (SMP lore) · r/careerguidance for career-changers.

**Search for:** gap year worth it · post bacc vs SMP · career changer med school · low GPA reinvention · how old is too old.

## A12. Money — the cost nobody warns about → feeds **Timeline**, **Profile/CV**

**r/whitecoatinvestor** ⭐ · r/premed cost threads · r/medicalschool debt threads · r/personalfinance.

**Search for:** how much does applying to med school cost · secondaries cost · interview travel cost · FAP fee assistance program · MCAT prep cost total.

**Why this matters:** application costs are large, poorly documented, and land all at once. Nothing in HQ currently tracks them.

## A13. Wellbeing and attrition → feeds the §6.15 pacing stance, **not** a coaching feature

r/medicalschool · r/Residency · r/medicine · r/premed burnout threads · physician "why I left" essays.

**Handle per the main prompt's rule 8:** report that sources discuss difficulty and describe how. Do not counsel, do not motivate, do not editorialise.

## A14. Institution-specific → feeds UNC data + course-difficulty intel

**r/UNC** ⭐ and the equivalent sub for any institution in scope · school-specific Discords (note their existence; content is not retrievable) · campus newspaper archives · departmental advising pages.

**Search for:** [course code] professor · hardest class at [school] · [school] premed advising · committee letter [school].

---

# APPENDIX B — Pillar-by-pillar capture checklist

**Run one pass per pillar.** Each maps to a spec file, so findings land somewhere specific.

| # | Pillar | Spec file | Capture specifically |
|---|---|---|---|
| 1 | **Academics** | `tabs/01-academics.md` | Study methods that people sustain vs abandon · note-taking systems and where they break · course-specific survival lore (orgo, physics, biochem) · Anki/FSRS settings debates · how people recover a GPA · which courses are described as hazards and why · professor-shopping norms |
| 2 | **MCAT** | `tabs/02-mcat.md` | (Main prompt §5, plus) resource consensus by name · study-length norms and the disagreements · publisher difficulty ordering · retake lore · void decisions in hindsight · what people say about plateauing · content-review depth vs practice volume |
| 3 | **Clinical** | `tabs/03-clinical.md` | EMT/CNA/scribe comparisons incl. real cost and time · what counts as clinical vs not · hour norms and where the community disagrees · how people found positions · shift reality · which settings people describe as formative |
| 4 | **Volunteering** | `tabs/04-volunteering.md` | Clinical vs non-clinical weighting · hour norms · longevity vs variety · what reads as box-ticking · how people found placements · whether "meaningful" is actually assessed |
| 5 | **Shadowing** | `tabs/05-shadowing.md` | How people actually get shadowing (cold email templates, family connections, formal programs) · hour norms · what to do and not do while shadowing · how to reflect on it usefully · specialty-breadth expectations |
| 6 | **Research** | `tabs/06-research.md` | Getting into a lab as an undergrad · cold-email norms · whether publication is expected · poster vs abstract vs paper · authorship politics · PI-relationship red flags · when to leave · how to describe research you barely understood |
| 7 | **Extracurriculars** | `tabs/07-extracurriculars.md` | Depth vs breadth · which activities are described as weighted · founding vs joining · leadership title inflation · how many activities is too many · the most-meaningful-experiences slots |
| 8 | **School List** | `tabs/08-school-list.md` | List construction and its failure modes · reach/target/safety framing and whether it holds for medicine · in-state advantage magnitude · mission fit · how many schools · cost of a bad list |
| 9 | **Essays & Story Bank** | `tabs/09-essays-story-bank.md` | "Why medicine" answers that land vs fall flat, **with reasoning** · clichés adcoms are tired of · drafting process and iteration counts · secondary-essay reuse norms · how people find their throughline |
| 10 | **Letters** | `tabs/10-letters.md` | **Use r/AskProfessors and r/Professors as primary here** · who to ask and when · what makes a letter weak · notice periods that annoy faculty · committee-letter mechanics · following up without being a nuisance |
| 11 | **Timeline & Tasks** | `tabs/11-timeline-tasks.md` | Cycle timing lore and what "early" means · gap-year decisions · when to take the MCAT relative to submission · what people wish they'd started a year earlier · **application costs and when they hit** |
| 12 | **Profile/CV** | `tabs/12-profile-cv.md` | Activity-description writing · hour-reporting norms and honesty · what belongs in most-meaningful · how people track hours in practice (spreadsheets, memory, nothing) |
| 13 | **Overview / roadmap** | `specifications/03-overview.md` | What people say they wish they'd seen in one place · the sequencing mistakes that cost a cycle |
| 14 | **Atlas / advice** | `specifications/02-atlas-...md` | How pre-meds evaluate advice quality · which advice sources they trust and distrust · how they detect bad advice |

**For each pillar, additionally hunt these three phrasings directly** — they are the highest-yield queries in this entire document:

- `"nobody tells you"` + [pillar]
- `"I wish I'd known"` + [pillar]
- `"biggest mistake"` + [pillar]

## Output shape for pillar passes

Same record schema as the main prompt, with `section` set to the pillar slug (`academics`, `mcat`, `clinical`, `volunteering`, `shadowing`, `research`, `extracurriculars`, `school-list`, `essays`, `letters`, `timeline`, `profile-cv`, `overview`, `atlas`).

**Add one field on pillar passes:**

```json
"sourceCommunity": "r/labrats | r/AskProfessors | SDN | TikTok | ..."
```

**Why:** a claim from r/labrats about lab life carries different weight than the same claim from r/premed, and the app should be able to say where it came from. **Findings sourced from a specialist community outside the pre-med subs should be marked as such** — they're often better and are the whole point of this appendix.
