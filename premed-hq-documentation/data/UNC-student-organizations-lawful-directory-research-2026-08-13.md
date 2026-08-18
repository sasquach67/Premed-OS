# UNC student organizations — lawful directory and discovery research packet

**Status:** access investigation complete; production 1,200+ organization dataset intentionally **not harvested**  
**Retrieved:** 2026-08-13  
**Scope:** official UNC Student Life & Leadership, Heel Life (Anthology Engage), and Anthology documentation only.  
**Decision:** use Heel Life as the official student-facing discovery destination; use authorized event feeds for events; do **not** crawl, scrape, or mirror its organization directory. A complete local organization dataset requires a UNC-sponsored Engage API key or an authorized UNC administrator export with explicit reuse terms.

## Executive answer

UNC identifies [Heel Life](https://heellife.unc.edu/) as its source for registered student organizations (RSOs), a searchable organization database, and the organization-event calendar. The current UNC “Find an Organization” page says it has **over 900** clubs and organizations; the Campus Layer Board’s older 1,278 figure must therefore be treated as a historical/product target, **not a current count** until UNC provides an official dated export.

There are two separate data products:

1. **Events and public news:** Engage’s public RSS/iCal feeds can serve public events (and RSS can serve public news). These feeds are for time-bounded content; iCal is specifically an event feed. They are not an organization-directory export.
2. **Organizations:** the public Heel Life user interface is the official searchable surface, but Anthology’s documented complete Organization Directory export is an **administrator** report requiring at least `Organizations View`. The member API requires credentials and contract/administrator access. No public organization JSON/CSV/RSS/iCal export was established.

So Premed OS should link users to Heel Life now, ingest approved public event feeds where supplied, and retain a deliberately empty local organization dataset until Student Life & Leadership sponsors access. It must not manufacture a roster from a public interactive UI.

## What the official sources establish

| Source | Official URL | What it establishes | Retrieved | Change cadence | Access / reuse boundary |
|---|---|---|---|---|---|
| UNC Student Organizations | [Carolina Union / Student Life & Leadership](https://carolinaunion.unc.edu/departments/student-life-leadership/student-organizations/) | SLL supports UNC student organizations and directs students to find, start, and register organizations through Heel Life. | 2026-08-13 | Living office page; no stated update schedule | Public guidance and deep links; it is not a data export/license. |
| UNC Find an Organization | [official discovery page](https://carolinaunion.unc.edu/departments/student-life-leadership/student-organizations/find-organization/) | UNC calls Heel Life its RSO directory; says students can find all registered organizations, upcoming org events, and campus links there; directs users to its searchable database. Page says “over 900” clubs and organizations. | 2026-08-13 | Live services; count and organization status can change | Use as the authoritative student-facing routing page. Do not infer a stable count or locally copy records. |
| Heel Life public organization route | [heellife.unc.edu/organizations](https://heellife.unc.edu/organizations) | Official public user-interface route for organization discovery. The retrieved page is JavaScript-dependent, so this pass did not enumerate it. | 2026-08-13 | Live | Public viewing/search surface only. No public export or reuse license was found. |
| UNC annual registration | [Registration](https://carolinaunion.unc.edu/departments/student-life-leadership/student-organizations/registration/) | RSOs reapply annually. For 2026–27 the renewal window is April 15–August 15; primary contact form, officer orientation, and advisor agreement are all required. Missing the process results in loss of registration status. A group absent from Heel Life search is designated lapsed/inactive. | 2026-08-13 | Annual; dates/process may change each cycle | A record’s presence/status is time-sensitive. Recheck each academic year; do not treat an old listing as current recognition. |
| UNC Student Organization Handbook | [2025–26 handbook PDF](https://uncsabucket.s3.amazonaws.com/carolinaunion/wp-content/uploads/2026/02/03114807/2025-2026-Student-Org-Handbook_2026.pdf) | Current detailed lifecycle guidance: registration expires annually; incomplete renewal creates inactive status; Heel Life is the official directory; primary contacts maintain profile/social links, roster, and events. The handbook also sets membership/officer/advisor requirements. | 2026-08-13 | Annual/versioned; superseded by future handbook | Official policy/guidance source. Never expose roster, officer, contact, or other personal data merely because an administrator can see it. |
| UNC start-new-organization process | [Start a New Student Organization](https://carolinaunion.unc.edu/departments/student-life-leadership/student-organizations/start-new-student-organization/) | New organizations apply through Heel Life; 2026–27 application window is October 1–31. The process requests mission, operations, contacts, constitution/bylaws, description, external links, and logo/picture. | 2026-08-13 | Annual and policy-driven | Shows why profile fields may exist, not that every field is public/reusable. Recheck each year. |
| Anthology Engage public data services | [What is Possible with Engage Data Services?](https://help.anthology.com/engage/en/what-is-possible-with-engage-data-services-.html) | All Engage licenses include public data feeds: RSS for public Events and News, and iCal for public Events. It does **not** list a public Organization Directory feed. | 2026-08-13 | Vendor product documentation; recheck before integration | Feed content is public but campus must supply/authorize the actual feed URL. Do not infer a public organizations feed. |
| Anthology event sharing | [RSS / iCal / API](https://help.anthology.com/engage/en/options-for-sharing-engage-events-to-an-external-calendar.html) | RSS and iCal are configured by Engage admin under Admin → Configure → Data Sharing; API is for more detailed integrations and depends on a campus contract. | 2026-08-13 | Vendor product documentation | Applies to events/calendar sharing. An iCal URL should be consumed as a live subscription, not downloaded once and treated as current. |
| Anthology Engage API | [Using the Engage API](https://help.anthology.com/engage/en/using-the-engage-api.html) | Some contracts include API; API calls require credentials. Documentation is available through the campus Admin/API Keys area. V2 keys come from Anthology Support; V3 keys are administered through the campus. | 2026-08-13 | Vendor product/access policy | No API use without UNC administrator approval and a scoped key. Never ship an Engage key to the client. |
| Anthology organization reports | [Reports Overview](https://help.anthology.com/engage/en/reports-overview.html) | Engage has a CSV Organization Directory report (ID, name, short name, type/status, website, email, address, phone, branch, categories, etc.). It requires at least `Organizations View` administrative permission. | 2026-08-13 | Export reflects time it is run; status changes throughout year | A lawful bulk route exists only if UNC provides/sponsors it and confirms which fields may be retained. Do not request or store contacts, phone numbers, member counts, or roster data unless needed and authorized. |

## Registered-organization lifecycle (what a user should understand)

1. **Discovery:** a student searches Heel Life’s organization directory and can follow an organization/event link.
2. **New registration:** groups apply in Heel Life during the announced window; UNC requires information such as purpose, operations, officers, advisor, constitution/bylaws, and organization description. The 2025–26 handbook says a new group needs at least 10 currently registered student members; the major officers must be full-time students with at least a 2.5 GPA.
3. **Annual renewal:** recognized organizations must reapply each year; for 2026–27, every listed renewal step had to be complete by August 15.
4. **Ongoing eligibility:** UNC requires an eligible advisor; the handbook says an organization without one for more than 48 hours loses registration. The public record should never expose advisor or officer contact information by default.
5. **Current status matters:** a group not found by Heel Life search is considered lapsed or inactive by UNC’s registration page. A prior year’s description or link is not sufficient evidence that it is presently active.

This is why a directory record needs both `retrievedAt` and `statusObservedAt`, and why a user-facing card should say **“Check current Heel Life status”** rather than promise that a club is currently joinable.

## Dataset disposition

```json
{
  "schemaVersion": "0.1-blocked",
  "retrievedAt": "2026-08-13",
  "campus": "UNC-Chapel Hill",
  "records": [],
  "access": {
    "organizationDirectory": "blocked_pending_UNC_authorized_Engage_API_or_administrator_export",
    "publicDiscoveryRoute": "https://heellife.unc.edu/organizations",
    "publicEventFeeds": "Eligible only after UNC Student Life & Leadership supplies the configured public RSS/iCal URL and approves intended use.",
    "publicOrganizationFeed": "not established; Anthology documents RSS for Events and News and iCal for Events, not a directory feed.",
    "doNotDo": [
      "crawl or automate the Heel Life organization UI",
      "reverse engineer backing requests",
      "copy profiles, contact data, rosters, or descriptions from search results",
      "represent a historical count as a current official count"
    ],
    "authorizedRoutes": [
      "UNC-sponsored read-only Engage API key with documented permitted endpoints, rate limits, caching, attribution, and redistribution terms",
      "UNC administrator-generated Organization Directory CSV limited to approved public-facing fields, with a dated refresh arrangement and reuse permission"
    ]
  },
  "refreshCadence": "Events: consume the approved live feed. Organization directory: set with UNC; minimum annual status revalidation plus refresh after each registration cycle."
}
```

## Minimal approved record model

If UNC authorizes a directory export or API, store only the fields necessary for discovery. Do **not** default to storing people, email addresses, phone numbers, rosters, or member counts simply because an admin report may contain them.

```json
{
  "sourceSystem": "UNC Heel Life / Anthology Engage",
  "sourceOrganizationId": "string",
  "name": "string",
  "shortName": "string | null",
  "summary": "string | null",
  "categories": ["string"],
  "organizationType": "string | null",
  "status": "active | inactive | lapsed | unknown",
  "websiteUrl": "https://... | null",
  "heelLifeUrl": "https://heellife.unc.edu/organization/...",
  "source": {
    "url": "official API endpoint or approved export provenance",
    "retrievedAt": "YYYY-MM-DD",
    "statusObservedAt": "YYYY-MM-DD"
  },
  "refresh": {
    "strategy": "authorized API | approved export",
    "recheckAfter": "YYYY-MM-DD"
  }
}
```

Keep a separately sourced **event** model. An event should reference an organization ID only when the approved source actually provides the relationship; attending an event must not create a student’s personal organization membership record.

## Premed OS / Atlas routing now

| Student need | Show | Action |
|---|---|---|
| “I want a club related to health, service, culture, research, or a hobby.” | A small explainer that Heel Life is UNC’s official searchable RSO directory; prompt the student to search terms/categories and check current status. | **Open Heel Life organization search**. |
| “I found an organization. How do I join?” | Link to the organization’s Heel Life page; joining may be automatic or require officer approval depending on the organization’s settings. | **Open official organization page / contact the organization**. |
| “I can’t find a group that should exist.” | Explain that UNC labels non-searchable groups lapsed/inactive; do not state why. | **Contact Student Life & Leadership: studentorgs@unc.edu**. |
| “What events can I attend this week?” | Use the approved public event RSS/iCal integration only, with source link and automatic expiry. | **View official event details / add to calendar**. |
| “Can Atlas give me every UNC club?” | Honest availability state: “The official directory is searchable in Heel Life. A complete local catalog is pending UNC authorization.” | **Open Heel Life**; do not show a falsely complete partial mirror. |

## Request to UNC Student Life & Leadership

> We are building a local, student-facing UNC planning tool. Heel Life is the official RSO directory, and we do not want to scrape or mirror its interface. Could Student Life & Leadership sponsor one of the following for a limited, read-only integration: (1) an Engage API key scoped to public organization discovery data, or (2) a periodically refreshed Organization Directory CSV containing only approved public-facing fields (organization ID, name, short name, summary/description, category, type, status, public website, and Heel Life URL)? Please confirm the permitted fields, whether descriptions/categories/status may be locally cached, update cadence, attribution/link requirements, API rate limits if applicable, and any redistribution restrictions. We would exclude officer/contact/roster/member data unless you specifically approve it.

Send to: **studentorgs@unc.edu** (the contact listed by UNC’s Find an Organization page).

## Stop condition satisfied

The Campus Layer Board correctly separates live events from the full RSO directory. Public Engage feeds are a lawful event/news route, but they are **not** a directory feed. A current public organization UI does not authorize creating an independent 1,200+ record dataset. This pass therefore records the official route and the authorized acquisition paths, then stops rather than scraping Heel Life.
