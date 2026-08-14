# Research prompt — revisiting `U-12` §4 / `§1`: per-school admissions numbers

> **⚠️ STATUS: THIS PROMPT REVISITS A LOCKED RULING.** `tabs/08-school-list.md` `§1` currently forbids shipped admissions-profile numbers **by name** — *"no medians, no acceptance rates, no in-state percentages, no class sizes."* `U-12` §4 in `general.md` is LOCKED Aug 2026.
>
> **The spec permits this revisit and states the terms:** *"The licensing objection was overstated… The reason that actually holds is maintenance — 240 schools × ~15 admissions fields, re-verified annually, forever, by one student in the summers he is taking the MCAT and applying. **Anyone revisiting this must argue against maintenance, not against licensing.**"*
>
> **So this prompt is built to answer the maintenance question, not to collect data.** It returns a costed feasibility finding plus a **20-school pilot**, because a 240-school annual commitment cannot be priced from zero schools. **Nothing it returns may enter `data/med-schools.json` or the app without an explicit ruling that overturns `§1`.**

**Two things that are already true and are not in question:**

- **`SL-11` already permits this data in the app.** A student may type a school's median and Premed OS shows the delta. The ban is on **shipping and maintaining**, not on the number existing.
- **Acceptance rate stays banned regardless of what this returns.** `SL-9` cut it in every layer, on anxiety grounds, not maintenance grounds. **This prompt does not reopen it.**

---

## The prompt

> **Paste from here:**
>
> You are a research analyst costing an ongoing data-maintenance commitment. A very small team — realistically one person, working around their own exams — is deciding whether to ship per-school admissions statistics for ~240 U.S. MD and DO schools and re-verify them every year. **I need you to help me decide whether that is sustainable, not to hand me the data.** Answer Part A fully before starting Part B.
>
> ### Part A — feasibility and true annual cost
>
> **A1. Availability from primary sources.** Take a random sample of **25 U.S. medical schools** spanning MD and DO, public and private, and several states. For each, search the school's *own* website for a published entering-class profile. Record: does it publish median or mean MCAT? Median or mean GPA? Is the page dated? Give the URL for each. **Report the share of your sample that publishes each figure on its own site.**
>
> **A2. Definitional consistency — this is the important one.** Across the sample above, record for each school:
> - **Median vs mean vs range vs percentile band** — which does it actually report?
> - **Which population** — matriculants, accepted applicants, or all applicants? Is the population *labelled* on the page, or must it be inferred?
> - **MCAT total only, or section scores too?**
> - **Which GPA** — cumulative, science/BCPM, or both?
>
> **Then state plainly: could these be normalised into one comparable field per school, or would normalising require judgement calls that differ school to school?** Give concrete examples of the worst mismatches you found.
>
> **A3. Volatility.** For as many of the sampled schools as have an archived prior-year profile (use the Internet Archive where the school has replaced its page), compare this year's figures to last year's. **How many changed? By how much?** This is the number that decides annual re-verification cost.
>
> **A4. Stability of location.** Do these profiles live at stable URLs, or do schools move/rename them yearly? Note any that 404 or redirect from an archived link. **A URL that moves annually is a manual re-find, not a re-check.**
>
> **A5. What AAMC MSAR has that schools do not publish.** MSAR states its data comes directly from the MCAT exam, the AMCAS application, and admissions offices. Identify what MSAR reports that the school pages in your sample do **not** — and note where a school's own marketing page and AMCAS-sourced data could disagree. **Cite AAMC.**
>
> **A6. Access and cost.** What does an MSAR subscription currently cost — 1-year and 2-year? **And critically: does the AAMC Fee Assistance Program include free MSAR access, and what is the eligibility?** Cite AAMC directly. Also check whether university pre-health advising offices commonly provide institutional MSAR access.
>
> **A7. Third-party compilations.** Several consulting sites publish "average GPA and MCAT for every medical school" lists — Shemmassian, JackWestin, MedEdits, Leland, Inspira, The Match Guy, accepted.com. For each: **does it cite a per-school source?** Does it state a retrieval date? Does it say which population the figure describes? **Quote each site's ToS language on reuse of its compiled content.**
>
> **A8. Machine-readable access.** Is there **any** official structured source — AAMC API, data file, licensed feed — for per-school admissions statistics? If access is licensed rather than public, say so and note the licensing route. Report a clean non-finding if none exists.
>
> **A9. The costed verdict.** Using A1–A4, estimate the realistic hours for (a) an initial 240-school build and (b) a single annual re-verification pass, **stating your assumptions about minutes per school**. Then answer directly: **is this maintainable by one part-time person, and what specifically would break first?**
>
> ### Part B — the pilot, ONLY if Part A supports it
>
> **If and only if A9 concludes the commitment is plausibly maintainable**, produce a **20-school pilot dataset** for the schools you sampled, as JSON. If A9 concludes it is not maintainable, **skip Part B entirely and say so** — that is the more valuable result.
>
> ```json
> {
>   "meta": { "retrievedAt": "YYYY-MM-DD", "sampleMethod": "", "coverageNote": "" },
>   "schools": [
>     {
>       "name": "",
>       "sourceUrl": "",
>       "sourceType": "school-published | aamc | other",
>       "pageDatedAs": "YYYY or null",
>       "population": "matriculants | accepted | applicants | unstated",
>       "mcat": { "stat": "median | mean | range | null", "total": null, "note": "" },
>       "gpa": { "stat": "median | mean | range | null", "cumulative": null, "science": null, "note": "" },
>       "confidence": "high | medium | low",
>       "problems": ""
>     }
>   ]
> }
> ```
>
> **Rules for Part B:** every school gets a `sourceUrl` to the school's own page or an AAMC page — **never a consulting site**. Anything unstated is `null` with a note; **do not infer, average, or fill from a third-party list.** `confidence: low` wherever the population is unlabelled. **Populate `problems` honestly** — that field is the actual deliverable.
>
> **Do not return acceptance rates.** They are cut from this product in every layer and are out of scope.

---

## How to read what comes back

| If the research shows… | Then |
|---|---|
| **A6: Fee Assistance includes free MSAR** | **`U-12`'s three-part test is answered decisively** — a mature product does it, the student can get it free, HQ does not rebuild it. That single finding likely closes the question |
| **A2: definitions don't normalise** | **The strongest reason to hold `§1`.** A field mixing medians and means across matriculants and accepted applicants is a number that looks comparable and is not — `U-13`'s exact failure, at scale |
| **A3: most figures change annually** | Maintenance argument confirmed. `§1` stands as written |
| **A3: figures are mostly stable** | The maintenance case weakens and `§1` is genuinely revisitable — **on the terms the spec set** |
| **A9: maintainable, A2 clean** | Bring it back as a ruling with the costed number attached. **Do not merge a dataset first** |
| **Part B skipped** | **The prompt worked.** A well-sourced no is the deliverable |

## The option that needs no research at all

**Paste-to-parse.** The student opens MSAR (which they likely have, and may have free), copies a school's profile block, and Premed OS parses it into the `SL-11` fields it already accepts.

- **Ships zero numbers. Fetches nothing. Maintains nothing.** `§1` untouched, no revisit required.
- Reuses `01` §4.1-M's paste-a-list pattern — **already in the repo**, and the same move `SL-23` phase 1 made for secondary prompts.
- **This is `U-12` clause 4's `DUPLICATE-MINIMAL`, correctly applied**: re-entry by paste, never by sync.
- Cost to the student: one paste per school, at the moment they are already looking at the number.

**⚠️ Weigh this against whatever Part A returns.** If paste-to-parse gets most of the value for none of the annual cost, the research is interesting but the ruling should not move.
