# PASTE-READY — Bulk source hunt for per-school data

**Copy everything below the line into your research agent.**

**Why this exists.** A 240-school page-by-page sweep returned MCAT on 55/240, tuition on 42/240, deadlines on 90/240. **Before sweeping again, find out whether a published dataset already carries these fields in bulk.** One authoritative file beats 240 page visits, and it comes with provenance a scrape can't have.

---

You are hunting for **published bulk datasets** covering U.S. medical schools — not scraping individual school websites. **I want sources, not rows.** For each field below, tell me whether a single authoritative file, table, or database covers many or all schools at once.

## Already checked — do not redo these

| Source | Verdict |
|---|---|
| **AAMC FACTS tables** | Table A-1 is the only per-school table (applications/matriculants by residency and gender). **Tables A-16–A-23 cover MCAT/GPA but are national aggregates only — none is by school.** Free, Excel |
| **AACOM research reports** | **HAS per-college MCAT** — "Applicant & Matriculant Average MCAT 2016-2024" — plus per-COM enrollment and demographics. Free |
| **AAMC MSAR** | Has everything, per school, but is a paid product ($28/yr) with individual-use terms. **Not a bulk source we may redistribute** |
| **Consulting aggregators** (Shemmassian, MedEdits, US News, Niche, JackWestin, Leland, Inspira) | **Excluded. ToS forbid reuse, and they source from MSAR anyway** |

## Find bulk sources for these fields

**1. Tuition / cost of attendance.** ⚠️ **Start with IPEDS** (the federal Integrated Postsecondary Education Data System, NCES) — it holds tuition and fees for essentially every U.S. institution and is bulk-downloadable and public domain. **Determine whether IPEDS carries the medical school as a distinct unit or only the parent university**, which is the thing that decides whether it's usable here. Also check state higher-education boards, which publish tuition for public institutions system-wide.

**2. Class size / enrollment.** IPEDS again, plus **LCME annual reports**, **AAMC enrollment tables**, and AACOM's per-COM enrollment report.

**3. Application deadlines.** ⚠️ **The application services publish these centrally** — AMCAS has a participating-schools-and-deadlines directory, AACOM has Choose DO Explorer, TMDSAS lists its member schools' dates. **Establish whether each is downloadable or HTML-only, and whether the deadline is per school and cycle-labelled.**

**4. MCAT / GPA per school.** AACOM covers the DO side. **For the 165 MD schools, establish definitively whether ANY free per-school source exists** — check state university system reports, public-institution accountability or legislative reports, Common Data Set filings, and institutional research office publications. **A clean "no free bulk source exists for MD schools" is a valuable answer — say it plainly if that's what you find.**

**5. Prerequisites.** Any consortium, association, or advising-organisation compilation? **NAAHP, state advising associations, or a services-published summary?**

**6. Letters of recommendation requirements.** Same question.

**7. PREview / CASPer.** AAMC and Acuity Insights publish participating-school lists. **Are they downloadable in any structured form, or HTML only?**

**8. Geographic coordinates.** IPEDS carries latitude and longitude for every institution — **confirm whether that resolves the medical school's own location or the parent campus.**

## Also hunt for these specifically

- **AACOM Osteopathic Medical College Information Book (CIB)** — older editions carried full per-school profiles including tuition and prerequisites. **Does a current edition exist, and what does it cover?**
- **Any state-level medical education report** — public medical schools often report enrollment, tuition, and in-state percentages to legislatures or system offices.
- **LCME and COCA published data** — what do the accreditors release publicly, at what grain?
- **Any open dataset, API, or research corpus** — data.gov, HRSA, academic repositories, published papers with supplementary per-school tables.

## For every source you find, report

1. **Exact name and URL.**
2. **Format** — Excel, CSV, PDF, HTML table, API.
3. **Grain** — per school? per parent institution? per teaching location? ⚠️ **This is the field most likely to make a source unusable.**
4. **Which of the fields above it covers**, and for how many schools.
5. **How current**, and how often it updates.
6. **Licence and reuse terms, quoted.** Federal data is generally public domain; association data often is not. **A dataset we cannot lawfully use is worse than no dataset.**
7. **Whether it identifies schools in a way that can be matched to a roster** — name, IPEDS UnitID, AAMC school code, or nothing stable.

## Rules

- **Official and governmental sources only.** Associations, accreditors, application services, federal and state agencies, universities themselves.
- **Do not return the data itself in this pass.** I want the source inventory first, so I can decide what to pull and in what order.
- **Report dead ends explicitly.** "No free per-school MD MCAT source exists" is a finding I need, not a gap to paper over.
- **Rank what you find** by how many fields × schools each source closes per unit of effort.
