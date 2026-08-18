# NPPES / NPI provider identity: verification boundaries and safe Atlas use

**Research date:** 2026-08-13 (America/New_York)  
**Scope:** Public CMS/NPPES sources only. This is a routing and provenance packet for clinician contact/shadowing workflows, not a credentialing, employment, or admissions rule.

## Decision in one screen

NPPES is a useful **public identity-discovery and record-linking source**. Given an NPI, Atlas can preserve the NPI, whether the record is NPI-1 (individual) or NPI-2 (organization), the NPPES-reported name, taxonomy/taxonomies, addresses/phone where disclosed, record status, and NPPES last-update date.

It cannot turn that information into any of the following:

- an active-license or credential verification;
- proof that a person is currently employed by, practices at, or accepts contact through the listed location;
- proof that a clinician is a physician merely because the user searched for one or because an NPI exists;
- a verified specialty, board certification, hospital affiliation, availability, email address, or willingness to host a student;
- permission to call, email, or request shadowing; or
- evidence that a shadowing experience satisfies an application-service category.

CMS is unusually direct on the first limit: issuance of an NPI does **not** ensure that the provider is licensed or credentialed. NPPES records are provider-/authorized-official-reported, public FOIA-disclosable data—not a live staffing, licensure, or opportunity directory. [CMS NPI Fact Sheet](https://www.cms.gov/files/document/npi-fact-sheet.pdf) · [CMS data-dissemination page](https://www.cms.gov/medicare/regulations-guidance/administrative-simplification/data-dissemination)

## What the official public sources provide

| Source | What it is good for | Currentness / access | Do **not** treat it as |
|---|---|---|---|
| [NPI Registry / Read API v2.1](https://npiregistry.cms.hhs.gov/api-page) | Querying FOIA-disclosable NPPES data by NPI and selected name/location/taxonomy criteria; record-level matching | Read-only API; CMS says it retrieves public NPPES data daily. API versions 1.0 and 2.0 are retired; use `version=2.1`. | A licensing, employment, board-certification, contact-permission, or shadowing directory. |
| [Monthly full-replacement file, weekly incremental file, deactivation file](https://download.cms.gov/nppes/NPI_Files.html) | A local mirror or population-scale matching process | The **monthly** full replacement is the base; CMS calls the weekly file supplemental until the next full replacement. As of the source page retrieved, V.2 is the supported monthly/weekly format. | A lightweight browser dataset or a current-by-itself weekly feed. |
| [CMS dissemination description](https://www.cms.gov/medicare/regulations-guidance/administrative-simplification/data-dissemination) | File construction, disclosure status, update/reuse caveats | NPI Registry is query-only and daily; downloads are free and FOIA-disclosable. | A CMS technical-support commitment for an Atlas mirror; CMS says there is no help desk for manipulating/using the file. |

### API query constraints that matter for Atlas

- Endpoint: `https://npiregistry.cms.hhs.gov/api/?version=2.1`.
- `number` is the strongest match key: exactly one 10-digit NPI. A name/location search can return look-alikes and should be treated as **candidate discovery**, not automatic identity resolution.
- `enumeration_type=NPI-1` limits to individuals; `NPI-2` limits to organizations, but it cannot be the only criterion.
- CMS documents an API maximum of **200 results/request** and `skip` up to **1,000**. With the API's `limit` + `skip`, a single search criterion set exposes at most **1,200** results across six requests. It is not a bulk-catalog mechanism. [API help](https://npiregistry.cms.hhs.gov/api-page)
- The Registry itself limits searches to the first **2,100** results and says bulk Registry querying should use the dissemination file. [NPI Registry](https://npiregistry.cms.hhs.gov/)
- Direct browser calls are not a safe product dependency: an observation on 2026-08-13/14 found no `Access-Control-Allow-Origin` header on the v2.1 response. Treat this as an observed integration constraint, not a promise that CORS behavior will never change. If a product needs live lookup, perform it server-side with rate/error handling and retain the raw response timestamp.

## Fields Atlas may preserve — with their meaning kept narrow

| Preserve | Source meaning | Safe display / reasoning label |
|---|---|---|
| `npi` | NPPES's unique 10-digit identifier | **NPI record identifier**; strongest identity link when user supplies it. |
| `enumeration_type` | `NPI-1` individual or `NPI-2` organization | **Individual NPI record** / **organization NPI record**. Never present NPI-2 as a person. |
| reported name / organization name / aliases | NPPES public record fields | **Name reported in NPPES**. Keep aliases as aliases; do not collapse two people from name alone. |
| `taxonomies[]`, primary marker, taxonomy code/description | Taxonomy selected/reported in NPPES; CMS says the code describes provider/organization classification and specialization | **NPPES-reported taxonomy**. It is a candidate role/specialty label, not a verified present role, license, board status, or scope. |
| credential text | Public NPPES provider field when present | **NPPES-reported credential**; never substitute for active state-board verification. |
| practice and mailing addresses, phones, additional practice locations | NPPES business/practice-location information | **NPPES-listed location/contact** plus `last_updated`; not proof the individual currently works there or that a public contact channel accepts student requests. |
| `status`, enumeration date, last-updated / certification date | NPPES status and record chronology | **NPPES record status / NPPES update date**, not a real-world last-seen date. |
| deactivation date/reason code (download file) | Deactivated-NPI data | **NPI record deactivated**. Do not retain/display prior descriptive data for a deactivated NPI; CMS specifically suggests sharing only NPI + deactivation date for such records. |

The public data can contain phone/address information, and NPPES may have endpoint fields in its downloadable reference file. Neither implies a personal email is publicly disclosed or that any endpoint/contact is an invitation for solicitation. Use only a contact route that the *employing institution or shadowing-program owner* publishes for students.

## Physician vs. nonphysician: the correct product rule

1. **Start with record type.** `NPI-1` means an individual provider record. `NPI-2` is an organization, even when the organization name includes a physician or group name. CMS describes Type 1 as individual providers (including physicians and NPs) and Type 2 as organizations (including hospitals and physician groups). [CMS Fact Sheet](https://www.cms.gov/files/document/npi-fact-sheet.pdf)
2. **Use taxonomy only as a reported classification.** A Type-1 record whose *current NPPES-reported primary taxonomy* falls in an allopathic/osteopathic-physician classification can be surfaced as “NPPES-reported physician taxonomy.” A Type-1 NP/PA/nursing/other taxonomy must remain that distinct reported role. Do not relabel it as “physician shadowing.”
3. **Do not manufacture a negative.** An individual might have incomplete, outdated, or multiple taxonomies. `NPPES cannot confirm physician` is not `not a physician`.
4. **Verify a high-stakes identity elsewhere.** For a student deciding whom to contact or how to record an experience, link to the institution's official provider page or the relevant state licensing board and record that separate check. NPPES itself does not validate licensure/credentials. [CMS NPI Fact Sheet](https://www.cms.gov/files/document/npi-fact-sheet.pdf)
5. **Keep the observed clinician role in the experience record.** NPPES is not an application-category oracle. Store e.g. `clinician_role_observed: "physician" | "PA" | "NP" | "unknown"`, the evidence route, and the application service separately. The existing AMCAS/AACOMAS/TMDSAS research packet remains the authority for application-service wording.

## Implementation-neutral record contract

```text
ProviderIdentityCheck
  subject_input: { supplied_name?, supplied_npi?, supplied_institution?, supplied_location? }
  retrieval: { source: "NPPES Read API v2.1" | "NPPES dissemination V2",
               retrieved_at, source_url_or_file_version, query_parameters_redacted }
  match: { status: exact_npi | likely_candidate | ambiguous | no_match,
           basis: [npi, exact_name_location, ...], human_review_required }
  nppes_record: { npi, enumeration_type, name_reported, taxonomy_reported[],
                  credential_reported?, addresses_reported[], nppes_status,
                  nppes_last_updated?, certification_date? }
  product_labels: { identity: "NPPES record match" | "unverified candidate",
                    role: "NPPES-reported [taxonomy]" | "not established",
                    license: "not checked in NPPES",
                    affiliation: "not established by NPPES",
                    shadowing_availability: "not established" }
  next_official_route: { source_owner, url, purpose }
```

**Automatic matching rule:** auto-link only an exact user-supplied NPI. Name + city/state/taxonomy can propose a candidate but must not automatically populate an experience, contact a person, or display a verified-role badge. High-risk same-name matches require a second official attribute from the user (institution/department or independently published institutional profile).

## Refresh and retention rules

- **Live lookup:** label it with retrieval date/time. CMS says the Registry/API is updated daily, but the underlying record's `last_updated` date is a provider-record field—not a guarantee that current employment/contact facts were independently checked.
- **Local mirror:** replace from the monthly full file, then apply weekly incremental files only until the next monthly replacement. Record file edition and publication period. CMS says the weekly file is supplemental, not a stand-alone base.
- **Deactivated NPI:** suppress descriptive historical profile fields. Retain only the NPI and deactivation date if any public display is necessary, matching CMS's published suggestion.
- **Contact routing:** recheck the institution's own provider/staff/shadowing page immediately before presenting an actionable route. Never send automated outreach from an NPPES result.
- **No hidden enrichment:** never derive email, recruiting availability, hours, speciality quality, patient population, shadowing willingness, or application credit from NPPES.

## Product-safe user wording

> **NPPES record found.** This confirms a public NPI record and its reported taxonomy, not an active license, current employer, or whether the clinician accepts student observers. Use the institution's official page to verify the contact route and request process.

> **Role not established.** This search did not provide enough official evidence to label the clinician a physician. Keep the role as reported/unknown until you verify it through an official institution or licensing source.

## Source register

1. [CMS — NPI Fact Sheet (December 2024)](https://www.cms.gov/files/document/npi-fact-sheet.pdf) — Type 1/Type 2 examples; NPI does not ensure licensure/credentialing; 30-day update duty; Medicare enrollment distinction. Retrieved 2026-08-13.
2. [CMS — National Provider Identifier Standard](https://www.cms.gov/Regulations-and-Guidance/Administrative-Simplification/NationalProvIdentStand) — NPI is 10-position and intelligence-free; it does not itself encode specialty/geography. Retrieved 2026-08-13.
3. [NPPES — NPI Registry API page](https://npiregistry.cms.hhs.gov/api-page) — read-only daily public data; v2.1; query/paging limits. Retrieved 2026-08-13.
4. [NPPES — API interactive help](https://npiregistry.cms.hhs.gov/demo-api) — documented query fields, limits, and valid v2.1 criteria. Retrieved 2026-08-13.
5. [CMS — NPPES Data Dissemination](https://www.cms.gov/medicare/regulations-guidance/administrative-simplification/data-dissemination) — public FOIA basis; Registry/download roles; monthly/weekly/deactivation semantics and reuse caution. Retrieved 2026-08-13.
6. [CMS — NPI Files](https://download.cms.gov/nppes/NPI_Files.html) — V.2 current file notice and included reference files. Retrieved 2026-08-13.
7. [CMS — Unique Identifiers FAQs](https://www.cms.gov/priorities/key-initiatives/burden-reduction/administrative-simplification/unique-identifiers/faqs) — taxonomy selection context, student taxonomy, organization/subpart explanation, lasting NPI caveats. Retrieved 2026-08-13.
8. [NPPES FAQs](https://nppes.cms.hhs.gov/help/faqs-help-page) — NPPES-reported address/taxonomy fields and public-record update mechanics. Retrieved 2026-08-13.

## Evidence limitations

- This packet does **not** verify any individual clinician, state license, board certificate, employer affiliation, or UNC availability.
- NPPES fields are public because they are FOIA-disclosable; that status does not make every contact route appropriate for student solicitation or product marketing.
- The current CORS observation is operational evidence from a response-header check, not an official compatibility promise. Re-test before building a browser-direct integration.
- NPPES taxonomy is materially useful for disambiguation, but it remains provider-reported and potentially stale/incomplete; it is intentionally not elevated to credential proof.
