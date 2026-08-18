# Bulk source inventory — U.S. medical-school profile fields

**Research date:** 2026-08-14  
**Purpose:** identify authoritative multi-school sources before another per-school sweep. This is a source inventory only; it does not change `medical-school-profiles-2026-27-CANONICAL.json`.

## Decision summary

The decisive result is that the AAMC now publishes **22 free, public, cycle-labelled PDF reports** sourced from schools' MSAR submissions. They cover nearly every MD-side gap in the corpus except matriculant MCAT/GPA and in-state matriculant percentage. They are not public-domain: they may be reproduced/distributed **"with attribution for individual, educational, and noncommercial purposes only."** That makes them suitable only if Premed OS's actual use and distribution model is cleared against that restriction; do not treat the reports as a redistribution-free seed file.

IPEDS is excellent for institution identity and parent-campus coordinates, but is not a safe medical-school tuition substitute. Its unit is the IPEDS reporting institution, which is frequently a parent university rather than an individual MD school; its Cost data are for **undergraduate** student charges/COA, not MD/DO-program tuition. It can resolve standalone COMs and independent medical institutions where the roster match is explicit.

No free, comprehensive, per-school **MD matriculant MCAT/GPA** bulk file was located. The paid MSAR remains the comprehensive source; the free AAMC reports intentionally omit those school-level metrics. AACOM provides the DO-side per-COM MCAT report, but its interactive academic-profile material is member-only.

## Ranked acquisition candidates

| Rank | Source / expected effort | Fields × schools closed | Grain and roster join | Freshness / reuse |
|---|---|---|---|---|
| 1 | [AAMC free MSAR Advisor Reports hub](https://students-residents.aamc.org/medical-school-admission-requirements/medical-school-admission-requirements-reports-applicants-and-advisors) | MD tuition/COA, primary & secondary deadlines, prerequisites, letters, PREview, address/contact; roughly the full U.S./Canadian MD report roster | One row per named medical school; state + school name, **no AAMC code/UnitID**. Fuzzy/name crosswalk needed, with human review for branch campuses. | 2027 entering class; individual reports updated Apr–Aug 2026. Quote: “may be reproduced and distributed with attribution for individual, educational, and noncommercial purposes only.” [Hub](https://students-residents.aamc.org/medical-school-admission-requirements/medical-school-admission-requirements-reports-applicants-and-advisors) |
| 2 | [AACOM Applicant & Matriculant Average MCAT 2016–2024](https://www.aacom.org/searches/reports/report/applicant-and-matriculant-average-mcat-2016-2023) | DO MCAT at COM level; potentially every U.S. COM reporting to AACOMAS | Per COM in downloadable report; title/name only needs crosswalk; confirm exact included locations and reuse before ingestion. | Published Nov. 21, 2024; historical through 2024. AACOM page gives no public reuse grant—treat as copyrighted/pending permission. |
| 3 | [AAMC Tuition, Fees and Insurance Information (2027)](https://students-residents.aamc.org/media/7071/download?attachment=) | In-/out-of-state first-year tuition & fees, COA, insurance for the MD report roster | Per named school, including multi-campus programs separately where reported. | TSF survey data are AY 2024–25; report updated May 15, 2026. Same attribution/noncommercial restriction. |
| 4 | [AAMC Premedical Coursework Chart](https://students-residents.aamc.org/medical-school-admission-requirements/medical-school-admission-requirements-reports-applicants-and-advisors) | Required/recommended coursework; AP, community-college, online-course policy for MD report roster | Per named school, not stable ID. Direct PDF link on hub may change; archive the report URL/date on retrieval. | Updated Aug. 13, 2026; same attribution/noncommercial restriction. |
| 5 | [AAMC Letter of Evaluation Preferences (2027)](https://students-residents.aamc.org/media/7026/download?attachment=) | Committee letters, letter packets, individual letters accepted/preferred/not accepted across MD report roster | Per named school, no numeric/stable school identifier. | Updated Jul. 31, 2026; same attribution/noncommercial restriction. |
| 6 | [AAMC Secondary Application Information (2027)](https://students-residents.aamc.org/media/7011/download?attachment=) | Secondary deadline, fee, screening/recipient policy for MD report roster | Per named school. Deadline is explicitly cycle-specific in the report. | Updated Aug. 3, 2026; same attribution/noncommercial restriction. |
| 7 | [AAMC PREview Professional Readiness Exam Policies](https://students-residents.aamc.org/media/7046/download?attachment=) | Required/recommended/not-used/exploring PREview policy for MD schools shown | Per named medical school. This is more precise than a simple participating list because it includes negative policy states. | Hub says updated Apr. 14, 2026; confirm cycle heading at ingestion. Same attribution/noncommercial restriction. |
| 8 | [AMCAS participating schools and deadlines](https://students-residents.aamc.org/applying-medical-school-amcas/applying-medical-school-amcas) plus [2026 downloadable school-deadline report](https://students-residents.aamc.org/media/7016/download?attachment=) | Primary/secondary/letter, enrollment-intent and school-specific actions/dates for AMCAS programs | Named school plus state; downloadable PDF exists at least for the cited cycle. The interactive search is not documented as an API/CSV. | Cycle-labelled and annually changing. Report copyright says attribution, individual/educational/noncommercial only. |
| 9 | [IPEDS complete/custom data files](https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx) + [NCES EDGE postsecondary geocodes](https://nces.ed.gov/opengis/rest/services/Postsecondary_School_Locations/EDGE_GEOCODE_POSTSECONDARYSCH_2425/MapServer/0) | Parent-institution name, UnitID, address, latitude/longitude; not medical-program pricing/enrollment | **IPEDS UnitID identifies the reporting institution**, not necessarily the medical school. Use only a verified roster crosswalk; parent coordinates must not be presented as a separate medical-school campus. | Annual federal collection; CSV/ZIP and EDGE JSON/GeoJSON. EDGE says its information is public domain; preserve source/collection-year metadata. |
| 10 | [COCA/AOA COM Directory](https://osteopathic.org/about/affiliated-organizations/osteopathic-medical-schools/) and [January 2026 directory PDF](https://osteopathic.org/index.php%3Faam-media%3D/wp-content/uploads/2018/03/colleges-of-osteopathic-medicine.pdf) | DO roster, addresses, teaching locations, accreditation status/established year | Per COM **and teaching location**; strong roster crosswalk aid, not tuition/admissions data. | Current directory page says 47 schools / 74 teaching locations; Jan. 2026 PDF says 46 / 73, so ingest date/version is essential. Copyright/reuse not stated: treat as attribution-required/pending permission. |
| 11 | [TMDSAS deadlines & important dates](https://www.tmdsas.com/apply-now/deadlines.html) | Cycle-labelled common Texas medical deadline and supporting-documents date; special-program exceptions | State application-service deadline, with named exceptions; **not a per-school field for every Texas school**. | HTML only, Entry Year 2027 currently shown. Copyright line: “© 2026 TMDSAS. All rights reserved.” Do not redistribute bulk extract without clearance. |

## Source cards and field-level limits

### AAMC free MSAR Advisor Reports — high value, licensed, named-school PDFs

**Exact source:** [Medical School Admission Requirements™ Reports for Applicants and Advisors](https://students-residents.aamc.org/medical-school-admission-requirements/medical-school-admission-requirements-reports-applicants-and-advisors).

- **Format:** 22 free PDFs. The hub explicitly calls them “22 free PDF reports” and says they are publicly available and updated/re-published regularly.
- **Grain:** per named U.S./Canadian medical school. The reports have state and school-name columns, not AAMC school codes or IPEDS UnitIDs; an audited name crosswalk is mandatory.
- **Fields:**
  - Tuition / COA: [Tuition, Fees and Insurance](https://students-residents.aamc.org/media/7071/download?attachment=) gives in-state/out-of-state COA, tuition/fees, and insurance. It identifies its source as the AAMC Tuition and Student Fees Survey, AY 2024–25.
  - Deadlines: [Secondary Application](https://students-residents.aamc.org/media/7011/download?attachment=); the hub also lists Primary Application Information, but marks it **under maintenance** on 2026-08-14. Do not infer primary dates from secondary dates.
  - Prerequisites: Premedical Coursework Chart, which the hub describes as required/recommended coursework plus AP/community-college/online treatment.
  - Letters: [Letter of Evaluation Preferences](https://students-residents.aamc.org/media/7026/download?attachment=), including committee letter, packet, and individual-letter acceptance/preference columns.
  - PREview: [PREview Policies](https://students-residents.aamc.org/media/7046/download?attachment=); it states positive and negative policy states rather than merely listing participants.
  - Locations/contact: [Main Campus Address & Contact Information](https://students-residents.aamc.org/media/14526/download?attachment=), named-school mailing/campus addresses, not geocoded coordinates.
- **Freshness:** hub currently says its reports guide the 2027 entering class, and gives per-report update dates (e.g. tuition May 15, 2026; coursework Aug. 13, 2026; letters Jul. 31, 2026).
- **Reuse:** quote exactly: “may be reproduced and distributed with attribution for individual, educational, and noncommercial purposes only.” Product/legal review must establish whether Premed OS distribution fits before storing/reporting values in a shipped corpus.
- **Important scope finding:** these free reports offer no school-level MCAT/GPA class-profile table. Do not mistake cutoff language in some secondary policies for a class average.

### AACOM research reports — strong DO-side candidate, reuse unresolved

**Exact sources:** [Applicant & Matriculant Average MCAT 2016–2024](https://www.aacom.org/searches/reports/report/applicant-and-matriculant-average-mcat-2016-2023); [Applicants, Matriculants, Enrollment and Graduates 1977–78–2025–26](https://www.aacom.org/searches/reports/report/applicants-enrollment-and-graduates-1977-78---2023-24); [AACOM research index](https://www.aacom.org/news-reports/ome-research).

- **Format:** downloadable report(s), historically web/PDF or spreadsheet-style tables (verify current download before building importer).
- **Grain:** AACOM describes the MCAT report as scores for U.S. colleges of osteopathic medicine; coverage must be counted from the actual current download before declaring 240-roster coverage. It may distinguish a college rather than all instructional sites.
- **Fields:** per-COM MCAT is established by the report title/download. AACOM's public research index says it collects college cost of attendance and enrollment, but some richer analytics are **exclusive to members**; do not assume public availability of each underlying field.
- **Freshness:** MCAT through 2024 (published Nov. 21, 2024); enrollment report through 2025–26 (published Jun. 11, 2026).
- **Reuse:** no public reuse grant identified in this pass. The report search results carry AACOM copyright on older PDFs. Treat as copyrighted and request written permission before redistributing values.
- **IDs:** title/name only in public-facing material; crosswalk against COCA location roster and canonical school name.

### IPEDS / NCES — useful identity data, not medical-school tuition

**Exact sources:** [IPEDS Data Center complete files](https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx), [complete-data-file instructions](https://nces.ed.gov/ipeds/help/view/complete-data-files), [collection/release cycle](https://nces.ed.gov/ipeds/use-the-data/timing-of-ipeds-data-collection), [institution selection / UnitID definition](https://nces.ed.gov/ipeds/Help/View/103).

- **Format:** ZIP/CSV, custom data downloads, data dictionaries; the Data Center explicitly provides complete survey files in CSV.
- **Grain:** reporting **institution**. IPEDS defines UnitID as its unique six-digit identifier for an institution. A medical school inside a university is normally not separately represented. This prevents unqualified use for a school-specific tuition or location field.
- **Fields:** HD directory includes parent name/address; the [EDGE Postsecondary School Locations service](https://nces.ed.gov/opengis/rest/services/Postsecondary_School_Locations/EDGE_GEOCODE_POSTSECONDARYSCH_2425/MapServer/0) provides annual IPEDS physical-location points as JSON/GeoJSON. IPEDS Cost explicitly collects undergraduate charges/COA, so neither it nor parent enrollment can fill medical-school tuition/class-size fields. IPEDS program coding can identify institutions reporting MD activity (CIP 51.1201), but not program-level tuition.
- **Freshness:** annual; current Data Center advertises 2024 institutional-characteristics files and 2023–24 pricing/enrollment releases. EDGE metadata ties its current layer to 2024–25 IPEDS locations.
- **Reuse:** EDGE expressly says “All information contained in this file is in the public domain.” Preserve NCES attribution, UnitID, collection year, coordinate scope (`parent` or `freestanding`), and exact survey variable. Confirm any web-tool terms before automated harvesting.

### Application services — deadlines and policy; do not overstate grain

**AMCAS/AAMC.** The public AMCAS landing page directs applicants to a “Medical Schools and Deadlines” search. A downloadable cycle report demonstrably exists for 2026, but the currently linked directory is primarily an interactive search; it is not documented as an open API/CSV. The free MSAR reports are the more practical structured source for secondary deadlines, letters, coursework, and tuition. The AMCAS reports use named schools/state only and have the AAMC noncommercial attribution restriction.

**TMDSAS.** [Deadlines & Important Dates](https://www.tmdsas.com/apply-now/deadlines.html) is HTML, cycle-labelled (Entry Year 2027) and gives the Oct. 1 common medical application deadline and Oct. 15 letters date, then names special-program exceptions. It does **not** substitute for individual school deadlines. Its footer says “© 2026 TMDSAS. All rights reserved.”

**AACOM/Choose DO Explorer.** [AACOM admissions requirements](https://www.aacom.org/become-a-doctor/apply-to-medical-school/admissions-requirements) directs users to Choose DO Explorer for individual college coursework requirements, but no public bulk export/API or reuse licence was established. Treat the explorer as HTML-only / no approved bulk source pending written permission.

### Accreditors and state/open-data search result

- **COCA/AOA:** excellent DO directory/location/accreditation roster; no published bulk tuition, prerequisite, letter, deadline, or MCAT/GPA file found. Its directory distinguishes 47 colleges and 74 teaching locations—valuable for preventing bad parent-campus joins.
- **LCME:** no public free, school-level file covering requested tuition, prerequisites, letters, deadlines, MCAT/GPA, or in-state percentage was found in this pass. LCME accreditation information should be used for MD roster/accreditation verification, not field fill.
- **State higher-education boards:** no single nationwide bulk source exists. State-system tuition schedules can be authoritative for a *specific public system*, but the grain, professional-program treatment, and reuse terms vary. They are a second-stage state-by-state source, not a replacement for AAMC’s nationwide tuition report.
- **data.gov / HRSA / academic-repository sweep:** no official nationwide medical-school profile dataset was identified that joins requested admissions fields at school grain. IPEDS is the principal federal structural source; AAMC's free reports are the strongest cross-school admissions source.

## Dead ends / hard ceilings

1. **Free nationwide MD matriculant MCAT/GPA:** no authoritative per-school bulk file identified. AAMC FACTS school-level tables do not contain these metrics; free MSAR Advisor Reports omit them. MSAR itself is paid and individual-use. Do not backfill with consulting sites or admissions thresholds.
2. **In-state matriculant percentage:** no nationwide bulk source found. Do not re-sweep this field; retain `not-published` where absent, per the product ruling.
3. **One universal ID across services:** none of the high-value PDF reports carries an AAMC school code/UnitID in its visible roster. Create a source-versioned, reviewable crosswalk—never fuzzy-merge automatically into canonical data.
4. **CIB:** no current public Osteopathic Medical College Information Book with a reusable, comprehensive per-school tuition/prerequisite profile was located. Current AACOM public routing is Choose DO Explorer plus research reports; the old CIB should not be treated as current.
5. **CASPer:** a current official structured cross-school export/reuse grant was not located. Do not consume third-party lists; retain per-school official source work or request Acuity Insights data permission.

## Recommended next pull sequence (after licence decision)

1. Seek written confirmation that the AAMC Advisor Reports' “individual, educational, and noncommercial” reuse covers this product and its distribution. If it does, acquire/parse the current **Tuition**, **Coursework**, **Letters**, **Secondary**, and **PREview** PDFs together; each output row must retain report name, report date, page, exact school name, and cycle.
2. Build a hand-reviewed source-name crosswalk against the canonical 240 roster before writing any field. Require state match and explicitly resolve campus/name variants.
3. Acquire AACOM MCAT/enrollment report only after its reuse status is cleared; use COCA's location-level directory to avoid merging a COM's branch site into the wrong record.
4. Use IPEDS only for an auditable parent-institution join and parent-campus coordinates. Never let its institutional tuition overwrite an MD/DO program's tuition.
5. Keep `not-found` for MD class MCAT/GPA and `not-published` for in-state percentage until a school-owned, cycle-labelled profile report is individually verified.
