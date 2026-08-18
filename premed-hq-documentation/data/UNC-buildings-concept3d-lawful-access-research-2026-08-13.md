# Ask #2 — UNC buildings, aliases, coordinates, and Concept3D IDs

**Status:** access investigation complete; production buildings dataset intentionally **not harvested**  
**Retrieved:** August 13, 2026  
**Decision:** do not scrape, enumerate, reverse-engineer, or bulk-copy Concept3D location records. The lawful acquisition path requires an official export/license confirmation from UNC Facilities Mapping/GIS (or authorized Concept3D API access granted through UNC).

## Executive answer

UNC’s public map is an embedded **Concept3D** map at `map.concept3d.com/?id=111`. UNC also exposes a public PDF-map surface through `maps.unc.edu/pdf/`, which points to `gismaps.unc.edu` data-file infrastructure. Neither public surface, as retrieved, publishes a reusable, documented every-building JSON/CSV/GeoJSON export with canonical names, aliases, coordinates, and Concept3D location IDs.

Concept3D’s own official documentation says its API is **private**, requires a **Map ID and API key**, and that documentation/access must be granted by the client’s Concept3D contact. Its terms also restrict copying/reproducing/reverse-engineering/redistribution absent permission. Consequently, deriving an `m/...` ID list from the interactive map or its backing calls would violate this project’s no-scraping rule and may conflict with vendor terms.

**The dataset is blocked on a lawful request, not on implementation.** UNC’s published mapping contacts are the Mapping Manager and GIS Manager listed on the [UNC Maps About page](https://maps.unc.edu/about/). Ask them for one of:

1. a reusable official buildings export with canonical name, aliases, and latitude/longitude;
2. approved read-only Concept3D API access for map `111`; or
3. written permission/terms for a limited local alias map and deep-link IDs.

Until one is received, `concept3dId`, `lat`, and `lng` must stay `null`, not guessed.

## What the official sources establish

| Source | URL | Data / fact established | Retrieved | How often it changes | Access / reuse restriction |
|---|---|---|---|---|---|
| UNC Maps About | [mapping team and contacts](https://maps.unc.edu/about/) | Facilities Technology Group’s mapping team maintains/maps campus data; names the Mapping Manager for custom-map requests and GIS Manager for facilities GIS-data questions. | 2026-08-13 | UNC says it continuously improves data acquisition; no public update SLA | Authoritative contact route, not an open-data license. |
| UNC campus-locations directory | [official locations directory](https://maps.unc.edu/campus-locations/) | Public hierarchical directory of frequently used locations and visible abbreviations (for example, AOB, SASB North/South). | 2026-08-13 | Live directory; potentially any time | Linkable public directory; it does not grant bulk export or local-reuse rights. |
| UNC Campus Maps home | [maps.unc.edu](https://maps.unc.edu/) | UNC’s public map surface links to a Concept3D map. | 2026-08-13 | Live map; potentially any time | Public viewing only; no export/reuse terms visible on the fetched page. |
| UNC PDF Maps | [maps.unc.edu/pdf](https://maps.unc.edu/pdf/) | UNC provides a PDF-map page embedding/pointing to `gismaps.unc.edu` data-file infrastructure. | 2026-08-13 | PDFs/data files may change by publishing cycle | Public page; an export/license is not stated in the fetched page. |
| UNC public map | [Concept3D map 111](https://map.concept3d.com/?id=111) | The UNC public Concept3D map ID is `111`. It is JavaScript-dependent. | 2026-08-13 | Live vendor-hosted map | Public front-end viewing; this does not grant reuse of location data or an API key. |
| Concept3D API FAQ | [official API FAQ](https://help.concept3d.com/hc/en-us/articles/360016590393-Interactive-Map-API-FAQs) | Concept3D says its API is private; public maps require a Map ID and API key; users should contact their Partner Success Manager for documentation/access. | 2026-08-13 | Vendor policy/product documentation; recheck before procurement/integration | Authentication/API-key access required; no implied public API access. |
| Concept3D API usage policy | [official API usage policy](https://concept3d.com/concept3d-api-usage-policy/) | Authorized API use is required; the policy prohibits scraping/crawling/mirroring, unauthorized extraction, and unapproved bulk extraction into independent datasets. | 2026-08-13 | Updated 2026-08-03; policy can change | Written authorization and any required attribution/redistribution terms apply. |
| Concept3D website terms | [terms of use](https://concept3d.com/concept3d-website-terms-of-use/) | Vendor reserves rights and restricts copying/reproduction/republication/redistribution absent permission. | 2026-08-13 | Terms can change | Treat map content as non-reusable unless UNC/Concept3D expressly authorizes the use. |
| Concept3D end-user terms | [SaaS end-user terms](https://concept3d.com/concept3d-saas-end-user-terms-of-use/) | Vendor terms prohibit unauthorized access and certain reuse. | 2026-08-13 | Terms can change | Reinforces that client-authorized access is required. |

## Dataset status JSON

This is deliberately a valid empty dataset rather than a fabricated partial list.

```json
{
  "schemaVersion": "0.1-blocked",
  "retrievedAt": "2026-08-13",
  "campus": "UNC-Chapel Hill",
  "records": [],
  "access": {
    "status": "blocked_pending_authorized_export_or_api_access",
    "mapId": 111,
    "concept3dIdAcquisition": "Do not enumerate public map UI or backing requests. Request an official export or authorized API access from UNC Maps / Concept3D.",
    "contactRoute": "UNC Maps About page: Mapping Manager for customized-map requests; GIS Manager for facilities GIS-data questions. A generic maps@unc.edu address appeared in the research brief but was not independently verified on a current UNC page.",
    "requiredConfirmation": [
      "Whether an official buildings export exists",
      "Permitted fields and reuse/license terms",
      "Whether aliases and coordinates may be stored locally in Premed OS",
      "Whether Concept3D deep-link IDs may be stored and displayed",
      "API key/credential scope, rate limits, caching, and attribution requirements if API access is granted"
    ]
  },
  "refreshCadence": "Unknown until UNC identifies the authoritative feed or export. Recheck when UNC Maps confirms ownership and update process."
}
```

## Required record shape once authorized

```json
{
  "officialName": "string",
  "abbreviations": ["string"],
  "aliases": ["string"],
  "lat": null,
  "lng": null,
  "concept3dId": null,
  "source": "official UNC export or authorized Concept3D API URL",
  "retrievedAt": "YYYY-MM-DD"
}
```

`null` is mandatory for unpublished/unlicensed fields. No coordinate should be inferred from a map image, pin appearance, building address, geocoder, or another website.

## What Premed OS may do now

- Keep location as unresolved free text from events/classes: for example, `Carolina Union` remains text until an approved alias map resolves it.
- Do **not** emit a guessed map marker or construct a per-building deep link.
- Implement the importer/normalizer only after a legitimate source is approved; the normalization logic can still accept the record shape above.
- Keep the public UNC map as an outbound link, not as a copied dataset.

## Message to send UNC Facilities Mapping/GIS

> We are building a local, student-facing UNC planning tool and need a lawful, maintainable way to resolve official building names and common aliases (for example, “Davis” → Walter Royal Davis Library) for campus event locations. Does UNC Facilities Mapping/GIS publish an approved export or API containing canonical building names, aliases, latitude/longitude, and, if permitted, Concept3D location/deep-link IDs? Please share the current source, refresh cadence, attribution requirements, rate limits, and any restrictions on local caching or reuse. We will not scrape the map interface.

## Stop condition satisfied

The brief required: **“If the only way to get it is scraping, say that and stop.”** No reusable every-building export or authorized API access was established from the retrieved public sources. This pass therefore stops here rather than silently converting a public interactive map into an unlicensed dataset.
