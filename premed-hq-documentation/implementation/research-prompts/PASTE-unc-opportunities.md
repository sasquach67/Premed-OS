# PASTE-READY — UNC opportunities (`data/unc-opportunities.json`)

**Copy everything below the line into your research agent.**

**Why this exists.** An earlier UNC sweep produced 26 packets covering **services** — dining, housing, libraries, transport, financial aid, advising. Useful, but they help a student *function*. **This pass collects the other kind: named, applicable programs that build a pre-med application.** The corpus currently mentions APPLES zero times and symposiums zero times.

**Your own spec already ranked this first:** *"the highest-value Category A dataset in the project — higher than med-school stats, because it changes what a student **does** rather than only what they know."* (`specifications/07-campus-layer-board.md`)

---

## Context — what Premed OS is and what this feeds

**Premed OS** is an application-tracking app for pre-medical students at UNC–Chapel Hill. It organises a student's work into **pillars**: Academics, MCAT, Clinical, Volunteering, Shadowing, Research, Extracurriculars, Letters, Essays.

**⭐ This corpus feeds ATLAS**, Premed OS's knowledge layer. Atlas ingests external pre-med knowledge and structures it as a **connected, source-cited graph**; Premed OS surfaces it as advice and recommendations. `specifications/02-atlas-interface-and-knowledge-map.md`.

**Three things about Atlas that shape what you return:**

1. **It is a graph, not a table.** Entries connect to each other. **A gateway is an edge, not a text field.**
2. **Every external claim is cited.** Atlas's contract is that its knowledge is traceable to a source with a date. **An uncited claim cannot enter it.**
3. **Trust separation is structural.** Official sourced claims, community reports, and the student's own notes are **distinct node types from creation** — so that opinion can never render as cited fact. **This pass collects official tier only.**

**The staging file is `data/unc-opportunities.json`** — the programs a student can actually apply to, join, or present at, mapped to the pillar each one builds.

**The governing test, from the spec, and it decides every inclusion:**

> **Does this change what a student can DO, or only how neatly they record what they already did?**

**A resource is a service you use. An opportunity is a gateway you apply to and get into.** The library is a resource. SURF is an opportunity. Both matter; only the second belongs in this file.

| ✅ Collect — opportunities | ❌ Not here — already covered as services |
|---|---|
| **SURF** and other funded summer research fellowships | The library, the writing centre, tutoring |
| **APPLES** service-learning | Dining plans, housing |
| **BPSS**, health-focused service programs | Campus transit, parking |
| **YMAA** and pre-health student organisations | Health insurance navigation |
| Undergraduate research **symposiums** you present at | Course registration mechanics |
| Hospital volunteer programs with application cycles | Financial aid forms |
| Paid research assistantships, work-study research | The bursar's office |
| Leadership and fellowship programs | General advising drop-ins |

---

## The prompt

> **Paste from here:**
>
> You are building a directory of **opportunities** for UNC–Chapel Hill pre-medical students — named programs a student applies to, joins, or presents at. **Not campus services.** The test for every entry: *does this change what a student can DO, or only how neatly they record what they already did?*
>
> ### Sources — official only
>
> - **HeelLife** (UNC's student involvement platform) — **the systematic source. Work through it rather than sampling.**
> - UNC department, school, centre, and institute pages
> - UNC Office for Undergraduate Research, Campus Y, Carolina Center for Public Service, Honors Carolina
> - UNC Health / UNC Hospitals volunteer and program pages
> - **⚠️ Never scrape.** Curated, sourced, dated. Note any terms restricting reuse.
> - **No consulting sites, no Reddit, no forums.**
>
> ### Organise by pillar, not alphabetically
>
> Work through these in order. **HeelLife alone reportedly carries 1,200+ organisations — do not try to return them all. Return the ones that function as gateways**, and say how you decided.
>
> 1. **Research** — funded fellowships (SURF and equivalents), lab assistantships, work-study research, honours thesis routes, **symposiums and conferences where undergraduates present**, funding for conference travel.
> 2. **Clinical** — hospital and clinic volunteer programs, patient-facing roles, EMT/CNA routes, hospice and free-clinic programs.
> 3. **Volunteering / service** — APPLES service-learning, Campus Y committees, BPSS and health-focused service orgs, Alternative Break programs.
> 4. **Shadowing** — structured shadowing programs with an application, not individual physician contacts.
> 5. **Extracurriculars / leadership** — pre-health organisations, YMAA, peer-mentoring and teaching-assistant programs, publications, competitive leadership cohorts.
> 6. **Cross-cutting** — scholarships and fellowships with a service or research component, summer programs, study-abroad with a health focus.
>
> ### Output shape — this feeds a GRAPH, not a list
>
> **This corpus goes into Atlas, a source-cited knowledge graph.** So return **nodes and edges**, not just rows. **Every claim carries its citation** — Atlas's whole contract is that external knowledge is traceable, and it is structurally separated from unverified personal notes.
>
> ```json
> {
>   "nodes": [{
>     "id": "surf-unc",
>     "type": "opportunity",
>     "trustTier": "official",
>     "name": "",
>     "pillar": "research | clinical | volunteering | shadowing | extracurricular | cross-cutting",
>     "host": "the UNC unit, org, or external partner",
>     "whatItIs": "one or two plain sentences",
>     "eligibility": { "years": "", "gpaOrPrereqs": "", "otherLimits": "" },
>     "applicationRoute": "form | email | HeelLife | interview | open-join",
>     "applicationWindow": { "opensAround": null, "deadline": null, "cycleLabel": null, "recurring": "annual | rolling | one-off | unknown" },
>     "selective": "yes | no | unstated",
>     "timeCommitment": "",
>     "claims": [
>       { "statement": "stated as a fact, in one sentence", "source": "https://…", "checkedOn": "YYYY-MM-DD", "confidence": "high | medium | low" }
>     ]
>   }],
>   "edges": [
>     { "from": "surf-unc", "to": "unc-undergrad-research-symposium", "relation": "leads-to" },
>     { "from": "surf-unc", "to": "pillar-research", "relation": "builds" },
>     { "from": "surf-unc", "to": "faculty-mentor", "relation": "requires" }
>   ]
> }
> ```
>
> ### ⭐ The edges are the point — a gateway IS a relationship
>
> **A flat directory cannot express what makes an opportunity valuable.** SURF matters because it *leads to* a symposium presentation, which *leads to* a poster, which *becomes* material for an essay. **Capture those chains.**
>
> Use these relations:
>
> | Relation | Meaning |
> |---|---|
> | **`leads-to`** | Doing this opens that. **The most important edge in this dataset** |
> | **`builds`** | Which pillar it strengthens |
> | **`requires`** | A prerequisite — a prior program, a mentor, a certification, a GPA |
> | **`runs-during`** | Summer, academic year, a specific term |
> | **`hosted-by`** | The UNC unit or partner |
> | **`alternative-to`** | Serves a similar purpose — helps a student who missed one deadline |
>
> **⚠️ `requires` and `alternative-to` are what make this useful to a first-year.** *"SURF requires a faculty mentor, which you get through X"* is the kind of chain nobody writes down and everybody needs.
>
> ### Trust tier — mark it, never blend it
>
> - **`official`** — the UNC page, the program's own site. **Everything in this pass should be this.**
> - **`community`** — what students report. **Do not collect it here.** Atlas keeps it separate, and **official outranks community, always.**
>
> **If a fact only exists in a forum or a blog, leave it out and say so.** A gap is fine; a blended tier is not.
>
> ### Rules
>
> - **`whatItLeadsTo` is the most important field.** It is the difference between a club that meets and a program that produces something a student can point at. **If you cannot answer it, mark the entry low confidence.**
> - **⚠️ Deadlines and application windows are the field that rots.** Stamp every one with its cycle and the date you checked it. **If you cannot confirm which cycle a deadline belongs to, null it — do not guess.**
> - **Record what the page says. Never rank, score, or call an opportunity prestigious, competitive-in-a-good-way, or worth doing.** State the facts; the student decides.
> - **An open-join club is still worth including** if it leads somewhere — but say `selective: "no"` rather than omitting it.
> - **Report what you excluded and why.** If you skipped 900 HeelLife organisations as social or non-gateway, say so and describe the rule you used. **Silent truncation reads as complete coverage.**
> - **Report coverage at the end**, by pillar, with counts.
>
> ### Do this first, then stop
>
> **Before collecting entries, survey the landscape and report back:** how HeelLife is organised, how many organisations and of what kinds, which UNC offices maintain their own opportunity lists, and whether any of it is exportable in a structured form. **I will choose the batching from your survey.**

---

## ⚠️ Two things to settle before this data ships

**1. The A/B conflict is now half-resolved, and worth recording properly.** `07-campus-layer-board.md` calls this *"the highest-value **Category A** dataset in the project."* `knowledge-sources.md` files the same thing under **Category B, ⚪ future, waits on the Atlas pipeline.**

**Routing it to Atlas settles the destination but not the category** — and the distinction still matters, because Category A means *"build against a committed `data/*.json`"* while Category B means *"read the Atlas API."* **This pass produces a committed staging file either way**, so it is not blocked. But `knowledge-sources.md` should be updated to say which, since it is the file that claims to be the map.

**⚠️ Note the tier split that makes both documents partly right:** the **official** layer collected here is Category A — sourced, dated, committable. The **community** layer Atlas also wants — what students actually report about these programs — is Category B and genuinely does wait on the pipeline. **They are two layers of one subject, not one dataset with two filings.**

**2. Application windows are the field that rots**, and this dataset has no refresh story yet. **Unlike the 240-school medical school problem, this is one institution** — an annual pass is plausible. But it should be a decision, recorded, rather than an assumption.
