# The campus layer: what HQ is missing entirely

**Status:** Board (Aug 2026). **Reference index, not spec.**

**Why this file exists.** Andy showed me a friend's UNC app — *Life at UNC* — and the point was not the app. It was the critique:

> *"My main gripe is that you're not thinking about these things too well, and you're just giving me little, little, little itty-bitty features. I want grand-scheme things that would actually help a student at Carolina especially."*

**That is a fair hit, and this file is the response.** Everything I proposed for Extracurriculars was a **field on a record** — a role kind, an impact figure, a mentorship list. **All of it improves what happens after a student already found the thing.** None of it helps them find it.

---

## 1. What the app actually does

**Seven tabs:** `Today` · `Goals` · `Classes` · `Calendar` · `Campus Map` · `Opportunities` · `Chat`.

| Surface | What it does | Verdict for HQ |
|---|---|---|
| **Today / Saved Workspace** | A dated agenda — *"Thursday, August 6"* — with pinned events (*"HackNC interest meetup, 6:30 PM, Union"*, tagged `CLUB`) on a bulletin-board surface | **HQ has this.** Overview's hero + schedule. **No gap** |
| **Whiteboard / Goals** | Sticky notes — *"Get a summer internship in finance"* `CAREER`, *"UNC Club soccer"* `WELLNESS` — each carrying **`ADD TO CALENDAR`** and **`GET INVOLVED`** | **The metaphor is not ours** (`04` §10 bans decorative metaphor). **But the two buttons are the whole idea: a goal that carries its next action.** HQ's Quarterly Goals are inert by comparison |
| **Classes / Index** | Course cards: `COMM 120`, meets Mon/Wed, `11:15/12:05`, `Hanes Art Rm 0121`, professors named, *"No assignments imported"*, **`OPEN SYLLABUS RECORD`** | **Academics has the cards. It does not have the syllabus link** — see §4 |
| **Calendar** | Week grid with events | HQ has it (shell §7.9) |
| **Campus Map** | **A real map of Chapel Hill** with typed markers — `YOUR CLASSES · ACADEMIC · CLUB · MEETING · CAMPUS · HOME` — a location panel (*"Abernethy, 131 S Columbia, GET DIRECTIONS"*), and a **living-situation setting** (*"Granville Towers — CHANGE LIVING SITUATION"*) | **HQ HAS NOTHING LIKE THIS. The biggest gap.** §3 |
| **Opportunities** | **`1,278 organizations + 277 saved events`**, *"Search the whole campus"*, filtered by interest, with real listings and descriptions | **The scale is the lesson.** I proposed 100–150 curated orgs. **His friend shipped 1,278.** §2 |
| **Chat** | Rooms: `GENERAL` · `ORGANIZATIONS AND EVENTS` · `HOUSING + DINING` · `CAREERS` | **Correctly excluded.** Andy: *"minus the chat, because it's not really necessary."* And `deferred.md` **N-1** already ruled the cross-user layer out |

**On the design:** Andy's read is that it borrows from **Carolina Countdown**, UNC's first-year online orientation — cream ground, navy numbered nav, serif display, Carolina blue accents. **That is probably right, and it is not our template.** HQ's look is locked (`04` §0c: warm dark, banner hero, glass over it, Baloo). **Take the ideas, not the skin.**

---

## 2. The lesson I should take first: I under-scoped by an order of magnitude

**I wrote, four hours ago:** *"a curated subset of roughly 100–150 organizations, because a full mirror would be permanently stale and permanently expensive."*

**A student built 1,278 organizations plus 277 events, with search and filtering, as a side project.**

**My reasoning was not wrong about maintenance — it was wrong about ambition.** I reached for the version that was easy to justify instead of the version that would actually be used. **A premed searching for a club does not want the 120 someone decided were relevant. They want all of them, searchable.**

> **Standing correction: when the honest options are "small and certainly maintainable" or "complete and harder," check whether the hard version is actually hard before choosing the small one.** A directory that omits the club a student is looking for has failed at the only moment it mattered.

---

## 2a. SUPERSEDED BY §2d — what the campus layer was thought to be

> ⚠️ **§2d retired the surface.** The *"one component, two scopes / two doors"* ruling below **no longer applies** — there is no Overview map to be the other door to. **§3a (flyers) survives and now feeds event prospecting.** Retained for the reasoning trail.

**I framed it as "a map of your own records." Andy's version is bigger and it is the better one:**

> *"Is that the 'what's happening around campus' type thing? I figured it could take from things like flyers — there are flyers across campus where I can take a pic of all and upload them, or other students can contribute — and it adds them to HQ, puts them on the map, and is like 'things happening around UNC' on the map in Overview. And then you can also do other things on the map, like change classes in one of the buildings, look at a class in a certain building. It's a pretty big aspect actually, and it takes a while to code."*

**Three things, not one:**

| | |
|---|---|
| **Your life, plotted** | What I proposed. Clinical sites, labs, orgs, classes, home. §3 |
| **What is happening around campus** | **New, and the part that makes it worth opening more than once.** §3a |
| **The map as a lens, not a display** | **Click a building and act on what you have there.** §3b |

**And where it lives — ruled:** *"If you wanted to specialize the map into just being extracurricular opportunities across campus, maps should also live in Extracurriculars."*

**One component, two scopes.** The full map on **Overview / shell**; the same map **filtered to organizations, events, and opportunities** inside Extracurriculars. **Same records, two doors** — the pattern Story Bank and pillar reflections already use. **Never two map implementations.**

**Andy's own scoping note is recorded because it should govern sequencing:** *"it's a pretty big aspect actually, and it takes a while to code."* **This is the largest single build in the project. It should be phased** (§3a), not attempted whole.

---

## 2b. RULED (Aug 2026): UNC's map is the wayfinding. HQ never draws a base map.

**Andy, Aug 2026:** *"The reference I can think of is the existing UNC map that exists now… maybe I can just embed it entirely onto here without having to 'make' or engineer anything on my own."*

**`maps.unc.edu` is a redirect page.** The real thing is **Concept3D map `id=111`** at `map.concept3d.com/?id=111`. UNC's School of Medicine web guide publishes the embed instructions, so **embedding is sanctioned** — at least for UNC sites, which is a question worth putting to `maps@unc.edu` before shipping.

**Andy's instinct is right and most of it is adopted. But an embed cannot be the map, only the wayfinding.**

| The embed gives you | The embed cannot do |
|---|---|
| The 3D drawing, every building, search, directions, ADA routes, construction impacts, parking — **maintained by UNC, forever, free** | **Cross-origin black box.** HQ cannot draw pins into it and cannot hear a click come out of it |
| | **Your records cannot appear on it** — no sites, labs, orgs, classes |
| | **§3b dies inside it.** *Click a building → "CHEM 262 MWF 9:05, your shift Tuesdays"* is impossible |
| | **The two-doors scope (§2a) cannot be a filter on it.** You can filter to UNC's categories, never to yours |
| | An embedded UNC map on Overview shows **UNC's campus, not your life** — decoration, which `04` §10 bans |

### The unlock: the Concept3D URL is addressable

UNC's own documentation shows the deep-link form —

```
map.concept3d.com/?id=111#!m/104787?ce/1529?mc/35.906197,-79.052193?z/18?lvl/0
```

— where **`m/104787` is a location ID for one specific building.**

> **THE RULING. The integration is a deep link, not an iframe. Every HQ record carrying a building gets `Show on campus map →`, opening the exact pin.**
>
> **UNC does wayfinding. HQ does *"what do I have here."* Neither rebuilds the other, and HQ ships no base map, no tile provider, and no map library for on-campus.**

**This kills a whole branch before it was opened.** Rendering a base map on static hosting with no backend would have meant MapLibre plus a self-hosted Protomaps `.pmtiles` archive — OSM's own tile server is not an option, its policy bans app use and bans offline prefetch outright. **None of that is needed now.** Recorded so it is not re-litigated: *if* a first-party rendered map is ever wanted, **Protomaps + MapLibre is the only option that survives static hosting, no API key, and signed-out mode.**

### Heel Life sync — split, and one half is available today

**Andy:** *"which would presumably sync to databases like Heel Life and other things."*

Heel Life is **Campus Labs / Anthology Engage**, and the answer is two different answers:

| | |
|---|---|
| **RSS + iCal feeds** | **Public, for publicly-visible organization news and events. No key, no approval.** **This is the phase-1 path and it works today** |
| **The full Engage API** | **Licensed to member campuses only; third-party use prohibited without consent.** Developers must be pre-approved, and **the request has to come from an official campus contact** |

**The second row is a door Andy can actually open** — a sponsoring UNC office opening a support case is a real route for a student project. **Pursue it; do not design phase 1 around it.** §3a's flyer pipeline stands on its own either way, and a flyer captures things Heel Life never lists.

---

## 2c. CLOSED BY §2d — the base-map fork, which no longer needs deciding

> ⚠️ **Moot.** A/B/C only mattered while the map was a surface. **§2d reduced the map to the `where` on an event card — one building marked, one deep link out.** That needs no base map at all. **Fork C was mocked up** (`mockups/07-campus/illustrated-campus.html`) and **the mockup is what killed the surface**: Andy — *"while it is nice to see, I just don't know the practical use of it."* **Kept as the record of a well-spent rejection.**

**Flagging a tension in my own ruling rather than letting it sit.** §2b says HQ ships no base map. §3 says every pillar's records are *plotted*. **You cannot plot points spatially without something underneath them.** So §2b forces a choice that has not been made:

| | What it is | Cost | What is lost |
|---|---|---|---|
| **A. Places list** | **No spatial view at all.** *"Your places,"* grouped by area — North Campus, Health Affairs, off-campus — each row a record with `Show on campus map →` and a travel time | **Nearly free.** No library, no dependency, no tiles. Ships in the same release as locations | *"Everything I do is on North Campus except one thing"* is a **shape you see instantly on a map** and have to work out from a list |
| **B. Rendered plot** | MapLibre + a self-hosted Protomaps `.pmtiles` extract of Chapel Hill. **HQ's own pins, `--cat-*` typed, over a real map.** Still deep-links to Concept3D for wayfinding | **A new dependency and a hosted asset**, both flagged under `CLAUDE.md`. But no key, no backend, no billing, works offline | Nothing — this is the §3 vision intact |

**My read: A first, B later, and A is not a placeholder.** Most of §3's questions — *can I get from class to my shift*, *how long is Durham really*, *what does this week cost me in travel* — **are answered by numbers, not by a picture.** `08-logistics-board.md` already says it: *"the map is not the feature. This is."* **A ships the answers; B ships the picture.**

**Andy's call.** It decides whether the campus layer is a small feature or the largest build in the project.

---

## 2d. RULED (Andy, Aug 2026): the map is not a surface. The feature is EVENT PROSPECTING.

**This overturns §2a's two doors, §2c's fork question, and most of §3. It is the correct call.**

> *"I just don't know the practical use of it, because while it is nice to see, I think this should be more of a feature just for extracurriculars. To make it good, specifically just to target events — like a prospect of events that HQ sees and is like, 'oh, this event that you could probably go to.' It thinks about logistics, like walking there, and integrates it into your schedule too… Maybe there's an interest meeting at 6:00. Marks the building and the map gives you all the information for you to go."*

**What died.** The app-wide campus surface. The Overview map. *"Your life plotted."* **It is nice to look at and it answers a question nobody asked.** A student does not open an app to see where their commitments are — they already know. **The mockup made this obvious by being pretty and useless**, which is what a mockup is for.

**What survives, and it is better:** **HQ finds an event, works out whether you can actually get to it, and gives you what you need to show up.**

### The feature

**`X-BIG-1` is retired and replaced by `EV-1` · Can I actually go to this?**

**HQ already holds every input.** Your schedule. Where your last commitment ends. Where the event is. How long that walk takes. What you already do.

> *"MEDLIFE interest meeting — Thursday 6:30, Union 3411. You're free. Your last thing ends 5:15 in Caudill, seven minutes away. Add it?"*

**That is a grand-scheme feature by Andy's own test** (§5): **it changes what a student does**, not how neatly they record it. **And it is deterministic** — `○`, no LLM anywhere in the feasibility call.

### What the pipeline actually is

| | |
|---|---|
| **Sources** | **Flyers you photograph** (§3a) · **Heel Life RSS/iCal** — public, no key, no approval (§2b) · the curated opportunities dataset (§4) |
| **Prospect** | An event with what · when · where · who · how to get involved |
| **The feasibility call** | **Reads your schedule and your locations.** Free / conflicts / too tight to make |
| **The hand-off** | Into your schedule, with the building marked and `Open in UNC maps ↗` for directions |

### Where it lives, and what the map is now

**`Discover`, inside Extracurriculars** — the sub-tab already ruled for showing records the student does not own (`07-extracurriculars.md` §5).

**The map is no longer a surface. It is the `where` on an event** — the building marked, one tap out to Concept3D. **Whatever drawing survives is a component inside `Discover`, not a destination.**

**Scope: non-academic.** Andy: *"anything other than academics."* **Class scheduling is Academics' and stays there.** This reads the class schedule to answer *"are you free"* — **it reads, it never owns.**

### The delivery — RULED (Andy, Aug 2026)

> *"Nothing scheduled is technically more appropriate. Preferably it would be like a popup in notifications maybe — can choose to decline or accept, and accepting would add it in your maps, schedule, etc., and it makes those logistical things on the spot as well."*

**Copy law, locked: HQ says `Nothing scheduled`. It never says `You're free`.** An unscheduled Thursday evening is not the same as an available one, and the difference is whether HQ is describing your calendar or **deciding what your time is for.** This is the same line that overturned the sufficiency call, the shadowing target ban, and the ECs target ban — **HQ may state a fact; it may not tell you what the fact means for you.**

**Delivery is the existing bell, not a new interruption.** A prospect arrives as a notification item **carrying its two actions inline**. **Not a blocking modal** — an interest meeting does not earn the right to interrupt, and `03-overview.md` §6.2 already made the bell the aggregator. **Never a second notification system.**

**Accept does the logistics on the spot** — this is the whole payoff, and it must happen in one tap:

| Accept creates | |
|---|---|
| **A schedule entry** | The event itself, at its real time and place |
| **Travel held before it** | **A 6:30 event seven minutes away blocks 6:20–6:30.** A calendar that shows the event but not the walk is lying to you |
| **The building marked** | With `Open in UNC maps ↗` on the entry, so wayfinding is one tap from the calendar |
| **The how-to-get-involved intact** | The QR link, the email, the form — **the thing a photo of a flyer loses** (§3a) |

**Decline dismisses and records nothing.** No *"events skipped."* **The non-event rule.** The prospect does not return.

### What accept does NOT create — and the one follow-up that closes the gap (RULED Aug 2026)

**Accepting an event does not create an Organizations record.** Going to a MEDLIFE interest meeting is not joining MEDLIFE. **If every accepted prospect spawned an org, Extracurriculars would fill with things a student walked into once**, and the pillar's whole claim — depth over breadth — would be buried under noise.

**But that leaves a real gap: you went, you joined, and HQ never noticed.** Closed with **one prompt, once, a few days after the event:**

> *"Did you join MEDLIFE?"* → **yes creates the org record, prefilled from the directory** (E-1). **No dismisses it permanently.**

- **It does not trip the non-event rule** — it asks about something that *did* happen. The rule forbids recording absences, not asking about attendance.
- **Once, never repeated, never scolding** — the same discipline as the depth-over-breadth read (#11) and the uncaptured-initiative prompt (#13).
- **This is the bridge from `Discover` into the pillar**, and the only one. **Nothing else in `Discover` writes to `Organizations`** except the student adding an org deliberately.

### Two consequences to hold onto

- **A prospect you ignore expires silently.** No *"you skipped 4 events."* **The non-event rule** (`07-extracurriculars-feature-catalog.md` Wave 8) already governs this — **HQ does not track things that did not happen.**
- **This inherits `08-logistics-board.md` `L-B` wholesale.** The travel numbers are the same numbers. **One dataset, and now one feature.**

**Still needed from §3c:** locations, the buildings dataset with aliases, and the Concept3D IDs. **Unchanged — but now serving one feature instead of a surface**, which makes it a much smaller ask.

---

## 2e. THE MAP, SPECCED — where it lives, what it does, what is in it

**§2d ruled what the map is not and never said what it is. This closes that.**

### What it is

**A `PlaceLine` — one component, everywhere a record has a location.** Not a page, not a panel, not a tab. **A line.**

> **Union 3411** · 7 min walk from Caudill · **Open in UNC maps ↗**

**Three parts, and the third is the only one that leaves the app:**

| Part | Source | Behaviour |
|---|---|---|
| **The place** | `locationId` → the buildings dataset (§3c). **Canonical name always, even when the flyer said "the Union"** | Click → expands the `PlaceLine` detail, does not navigate |
| **The distance** | `L-B` arithmetic against wherever you are coming from | **Absent, not zero, when either end has no location.** Never *"unknown"* |
| **The exit** | `map.concept3d.com/?id=111#!m/<concept3dId>` | **Opens UNC's map at that exact pin.** New tab. **The only wayfinding HQ ever does** |

### Where it lives — the complete list

| Surface | What the line says |
|---|---|
| **Event prospect, in the bell** (`EV-1`) | Place · travel from your previous commitment · exit |
| **Event list, `Discover`** | Place · travel from campus · exit |
| **A schedule entry created by accepting** | Place · **the held travel block** · exit |
| **An organization record** (`Organizations`) | *"Meets in Union 3411."* **Place and exit only — no travel.** You know how to get to your own club |
| **A clinical site, lab, or practice record** | Place · *"about 18 min from campus, bus every 20"* · exit. **Stated once, on the record** |

**That is every surface. There is no map page, no map tab, no map toggle, and no map on Overview.**

### What is deliberately not in it

- **No base map, no tiles, no pins, no pan, no zoom.** Those are UNC's, one tap away.
- **No "what else is near here."** That is a discovery surface and `EV-1` already owns discovery.
- **No route drawn.** The number is the answer; a line on a map is decoration.
- **No location on Timeline, Overview, Academics, or Profile.** Those records are not places.

### The degradation rules — this component will very often have partial data

| Situation | Behaviour |
|---|---|
| **No `locationId`** | **The whole line is absent.** Not greyed, not *"add a location"*. **Never nagged** |
| **Location, no `concept3dId`** | Place and travel render; **the exit link does not.** A missing join key removes an affordance, never breaks a line |
| **Off-campus** | Free text plus coordinates. **Travel renders; the exit link does not** — Concept3D only knows UNC buildings |
| **Flyer gave a room but no building we recognise** | **Show the raw string as the student's own text**, unlinked. *"Union 3411"* as typed, no exit, no guess. **HQ never resolves a building it is not sure about** |

### The one open call

**Is there ever a picture, or is `PlaceLine` text forever?**

**Text-only is the honest end of §2d** — and it means HQ ships no map UI at all, which is worth saying out loud before agreeing to it.

**The argument for a small picture:** *"Union 3411"* means nothing to a first-year, and the deep link costs a tab switch to answer *"where even is that."* **A static locator — building highlighted on a simplified campus outline, non-interactive, no library —** answers it inline.

**The argument against:** it is the illustrated campus again at 1/20th scale, it needs the same drawing work, and **the deep link already answers it correctly.**

**Lean: text-only, and revisit if the tab switch turns out to be the friction.** **Andy's call.**

---

## 2f. SUPERSEDED BY §2g — the iframe-and-reframe design

> ⚠️ **Do not build this.** §2g replaced the iframe with a Leaflet map HQ renders itself. **Everything below about URL reframing, the `postMessage` ask, and the five costs is retained only as the reasoning trail.**
>
> **The terminology trap that caused this, recorded so nobody falls in it again:**
>
> **"Embed" was used to mean two different things.** Andy meant *"a map rectangle visible inside HQ."* This section meant *"an `<iframe>` of UNC's website."* **Both put a real map inside the app and a user cannot tell them apart by looking.**
>
> | | The picture | Can HQ put its own pins on it? |
> |---|---|---|
> | **iframe** | UNC's 3D campus art | **No. Ever.** Cross-origin |
> | **Leaflet (§2g)** | A clean dark street map | **Yes** — markers, clicks, side panel, all HQ's |
>
> **The whole live layer (§2h) — events, flyers, Instagram promos, click-a-building — is pins.** An iframe cannot show any of it. **That is why §2g wins, and it is the only reason.**

---

### The original §2f, retained for the trail: EMBED AND REFRAME

> *"Don't generate a map, embed and reframe an existing map. Trying to take from the one I sent you."*

**§2b ruled deep-link-only on the grounds that an iframe is a cross-origin black box. That was half right and I closed it too fast.**

**HQ cannot draw into the iframe — still true. But HQ can decide what the iframe is looking at**, and that is most of what a map needs to do here.

### The asymmetry that defines the feature

| Direction | Mechanism | Status |
|---|---|---|
| **HQ → map** | **URL parameters.** `#!m/<locationId>` highlights a building · `?mc/<lat>,<lng>` centers · `?z/<zoom>` · `?lvl/<floor>` · `?ct/<categoryIds>` filters UNC's own layers | **Available today. No permission, no key, no integration** |
| **Map → HQ** | **`postMessage`.** Concept3D emits an event to the parent window on marker click and on background click | **Exists, but must be enabled by the client's success manager** — **UNC's, not ours.** An ask to `maps@unc.edu`, not a given |

> **THE RULING. HQ embeds UNC's map and reframes it. HQ never draws a base map, never draws pins, and never rebuilds wayfinding.**
>
> **The binding is one-way by default:** select a record in HQ → the embed reframes to that building. **Two-way is an upgrade, not a dependency** — everything must work if UNC never enables `postMessage`.

### Where the embed lives — this does NOT resurrect the map surface

**§2d stands. There is still no map page, no map tab, and nothing on Overview.**

**The embed is what a `PlaceLine` expands into.** The line stays the default state; **clicking the place name opens the map panel already framed on that building.** Collapsed by default, everywhere.

- **On an event prospect** — expand to see where Union 3411 actually is before accepting.
- **On `Discover`** — selecting an org or a lab in the list reframes the panel. **One embed, driven by the list beside it.** Master–detail, the pattern the app already uses.
- **On a clinical site, lab, or practice record** — expand to place it.

**Never more than one embed mounted at a time.** It is an iframe over the network; a list of them would be a performance defect.

### The five costs, stated before anyone is surprised by them

**These are real and none of them is a reason not to do it. They are reasons to scope it.**

1. **Every reframe is a reload.** Cross-origin means HQ cannot do same-document hash navigation — changing the view means changing `src`, and the iframe reloads. **Expect a visible load on each selection.** Design for it: a skeleton state, and **do not reframe on hover.**
2. **It will not match the theme.** UNC's map is a light, 3D, illustrated surface; HQ is warm dark. **A cross-origin iframe cannot be restyled** — no filter hack, which would break legibility anyway. **The honest treatment is to frame it as an obvious external panel**, bordered and labelled, rather than pretend it is native. **This is a deliberate, documented exception to `04` §0c**, not a defect to fix later.
3. **UNC's cookie banner renders inside it.** Visible in the screenshot Andy sent. **We cannot dismiss it for the user** and must not try — that is consent, and it is theirs.
4. **It needs the network.** **This is the first thing in HQ that does not work offline or fully signed out.** Degradation is mandatory: **no network → the `PlaceLine` stays a line**, with the deep link. **The line is the floor; the embed is the ceiling.**
5. **Permission is unresolved, and it is now a hard pre-ship gate.** UNC publishes embed instructions **for UNC websites**. HQ is a student project on GitHub Pages. **Ask `maps@unc.edu`** — same message that asks for the `concept3dId` list (§7 ask 2) and about enabling `postMessage`. **X-h.**

### What the embed's own footer tells us (Aug 2026)

**Andy sent the attribution bar: `© MapTiler © OpenStreetMap contributors` alongside `CONCEPT3D · PRIVACY · TERMS OF SERVICE · COOKIE PREFERENCES`.**

**The base is commodity — MapTiler tiles over OpenStreetMap data.** That is the same stack §2c costed as fork B, which means **the tiles were never the hard part** and a forced migration would reproduce that layer exactly.

**It does not change the ruling, because the tiles are not the value:**

| Layer | Who owns it | Reproducible? |
|---|---|---|
| Base tiles | MapTiler / OSM | **Yes.** MapLibre + Protomaps or MapTiler direct |
| **3D illustrated buildings** | Concept3D | **No.** Their own renders, not in OSM |
| **The location database** | UNC, in Concept3D's CMS | **No.** Every building with a stable ID, categories, floors, ADA routes, parking, construction impacts |
| **Maintenance, forever** | **UNC staff** | **No, and this is the real asset** |

> **We could rebuild the map. We could not rebuild the campus.**

**The operative item in that footer is `TERMS OF SERVICE`.** §2f embeds a third-party commercial product **on a site that is not the licensee's**. **Read Concept3D's terms before shipping the embed** — specifically whether embedding is restricted to the licensed institution's own domains. **This is a blocker, not diligence theater**, and `03-clinical-board.md` §5's standing rule already says a dataset we cannot lawfully use is worse than no dataset. **The deep link (§2b) is the fallback if the answer is no** — a hyperlink needs no licence.

**One consequence if we ever DO self-host:** MapTiler and OSM both require visible attribution. **Not our problem while embedding — entirely our problem the moment we are not.**

### What §2b keeps

**The deep link does not go away.** `Open in UNC maps ↗` remains on every `PlaceLine`, because **the embed cannot give directions** — routing, ADA paths, and parking are full-app features of UNC's map. **Embed to see where. Deep link to get there.**

---

## 2g. RULED (Aug 2026): HQ RENDERS THE MAP. This supersedes the embed in §2f.

**Andy sent a screenshot of the friend's app doing what §2b called impossible: its own diamond markers, its own legend, and a `LOCATION LEDGER` side panel that fills in when a building is clicked.** *"They used the OpenStreet or the Leaflet things… you click on it and it pops up on the side… so it's possible with an external map."*

### I was wrong twice, and both errors are worth recording

1. **I equated "use an existing map" with "embed someone's map page."** Then correctly concluded an iframe cannot take our pins — **and stopped.** **Leaflet is not an embed.** It is a renderer: tiles come from a provider, and **the markers are our own DOM.** Ownership of the *tiles* and ownership of the *markers* are separate questions, and I collapsed them.
2. **I dismissed fork B (§2c) as *"a correct map wearing HQ's chrome."*** The screenshot disproves it — **their markers, panel, and type read as their product.** And **dark basemaps exist** (Stadia `AlidadeSmoothDark`, CARTO Dark Matter), which removes the `04` §0c objection entirely: it is a dark map, not a light one in a dark frame.

> **THE RULING. HQ renders the map with Leaflet and owns the markers, the click handling, and the side panel. The basemap is licensed tiles from a provider. No iframe.**

### DECIDED (Aug 2026): Leaflet + Stadia Maps

**Andy: *"just find any map then that I can use"* — after ruling out his friend's raw OSM tiles as *"not really that good of a map."***

**Diagnosis first, because it changes the answer: the friend's map looks bad because of the STYLE, not the data.** `tile.openstreetmap.org` is a mapper's editing view — every label, no hierarchy, harsh colour. **Concept3D, which Andy liked, is the same OpenStreetMap data** rendered by MapTiler. **The fix is a styler, not a different planet.**

| | |
|---|---|
| **Renderer** | **Leaflet** — MIT, ~42KB, no key. **The only new dependency.** Markers, clicks, and the side panel are HQ's own DOM |
| **Tiles** | **Stadia Maps** · `alidade_smooth_dark` for the dark theme, `alidade_smooth` for paper |

**Why Stadia over the alternatives, on facts rather than taste:**

- **200,000 credits/month free, no credit card**, and **the free plan explicitly covers non-commercial and academic use.**
- **Domain whitelisting instead of an API key.** **This is the one that actually matters for HQ** — a static site cannot hide a secret, and whitelisting means **no key in the client bundle at all.**
- **Over quota it hard-limits, it does not bill.** For a free student tool, **a dead map is a far better failure than a surprise invoice.**
- **Real dark styles**, so the map matches `04` §0c instead of fighting it.

**Rejected, with the numbers:**

| | Why not |
|---|---|
| **Google Maps JS** | **10,000 map loads/month, then $7 per 1,000.** ~333/day. **Metered — the wrong risk shape for a free tool** |
| **Apple MapKit JS** | **250k views/day free is the best tier available** and it looks superb — but **$99/yr Developer Program** and **JWT signing that expects a backend.** HQ is static. **Revisit if HQ ever gains a server** |
| **Raw OSM tiles** | **Forbidden by OSM policy for application use.** They block apps that ignore it |
| **Concept3D Tiles as a Service** | **Still the best-looking option and still worth asking for** (routes below). **Not a blocker** |

> ⚠️ **One flag: Stadia's free plan is non-commercial only, and `src/pages/Upgrade.tsx` exists in the repo.** **If HQ ever charges for anything, the map needs a paid Stadia plan or a different provider.** Not a problem today; **a problem the day a paid tier ships**, and cheaper to know now.

**The design rule that makes this reversible:** **the tile URL is one config value.** Swapping to Concept3D, Apple, MapTiler, or a self-hosted Protomaps file **changes a string.** The markers, the panel, the click handling, and every `--cat-*` colour are HQ's regardless. **Pick the renderer, keep the source swappable, and this stops being a decision that can be gotten wrong.**

### The tile layer — three routes, and Andy's preference is route 1

**Andy: *"is there a way to do this but incorporate UNC's actual map instead? I like their zoom radius and all features."*** **There is, and it is a product Concept3D sells.**

| Route | What HQ gets | Needs |
|---|---|---|
| **1 · Concept3D Tiles as a Service** | **UNC's 3D campus imagery as a Leaflet tile layer, with HQ's markers over it.** Their art, our data, our panel. **Exactly what Andy asked for** | **An API key**, via UNC's Partner Success Manager at Concept3D. `api.concept3d.com/documentation/` |
| **2 · Concept3D Content API** | The location database — every building's name, ID, coordinates, categories — over standard tiles. **Their data, not their art.** Also supplies the `concept3dId` list §3c needs | Same key path |
| **3 · Standard tiles** | Stadia `AlidadeSmoothDark` / CARTO Dark Matter + HQ's markers, with `Open in UNC maps ↗` alongside | **Nothing. Works today.** Free tier, API key, domain whitelist |

**Route 3 is the floor and it is not a bad product.** Routes 1 and 2 are upgrades that a single email may unlock. **Build against route 3; design so the tile layer is one swappable config value.**

### ⛔ What must never be done

**Pointing Leaflet at Concept3D's tile URLs without a key.** It would probably work. **It is hotlinking a paid service on UNC's quota**, it violates `03-clinical-board.md` §5's standing no-scraping rule, and it breaks the day they rotate a URL. **Tiles as a Service exists precisely so this is unnecessary.**

**And `tile.openstreetmap.org` is equally out** — the Leaflet default, and **OSM's policy explicitly forbids application use**; they block apps that ignore it. **The friend's app is almost certainly doing this. Do not copy that specific choice.**

### What carries over unchanged

- **`PlaceLine` is still the default state** (§2e). The map is what it expands into. **§2d still stands — no map page, no map tab, nothing on Overview** unless Andy reopens it separately.
- **`Open in UNC maps ↗` stays on every `PlaceLine`.** HQ's map shows *where*; **it will never do routing, ADA paths, or parking**, and UNC's does all three.
- **Offline degradation is unchanged:** no network → the line stays a line.
- **Attribution is mandatory and permanent** — `© OpenStreetMap contributors` plus the provider, visible on the map. **Non-negotiable on every route.**
- **An API key is not user auth.** Signed-out mode is unaffected.

### Cost

**One dependency — Leaflet, MIT, ~42KB.** Flagged under `CLAUDE.md`'s no-new-dependencies rule. **This is the smallest version of this feature that can exist**, and the alternative (a hand-drawn SVG campus, §2c fork C) was already rejected.

---

## 2i. RULED (Andy, Aug 2026): no nav tab. Expand-to-full instead. Plus two corrections.

> *"No, the map does not get its own page. Actually, it does, but it doesn't get a tab. If it's in its own subtab, students should be given the option to expand it, and it just opens the map in full view. Nothing much to it."*

**Settled, and it closes the question §2d left open.**

| | |
|---|---|
| **No sidebar entry.** No `Campus` item in the nav. **§2d holds** | The map is never something you navigate *to* |
| **It lives inside sub-tabs that already exist** — `Discover`, and expanded from a `PlaceLine` on a record | |
| **Wherever it appears, it carries an expand control** → **full view.** Nothing more elaborate than that | **Not a route, not a page — a maximise.** Close and you are back where you were |

**Implementation note so this does not get overbuilt:** *"nothing much to it"* is the spec. **Full view is the same component at full size** — same markers, same panel, same state. **No separate full-screen implementation, no different feature set, no URL of its own.**

### Correction 1 — the email is dropped

**Andy: *"I'm not tryna send any email."*** **`maps@unc.edu` is off the table.** It only ever bought UNC's tile artwork, which is cosmetic. **Stadia tiles ship, `Open in UNC maps ↗` still works as a plain hyperlink needing no permission, and X-h is closed as "not pursuing."**

### Correction 2 — why "don't scrape Heel Life" was ruled, and what that means now

**Andy: *"why did I say not to scrape it? Was I maybe saying that an API was possible and it could sync without me having to scrape anything?"*** **He is right, and I had been citing the rule for the wrong reason.**

**His original objection** (`07-extracurriculars-board.md` §2a) was: *"I don't know how much work it would be to completely sync with Heel Life, because there are clubs and stuff that change… it shouldn't try to recreate Heel Life."*

> **That was a STALENESS objection, not a legal one.** He was protecting against a copied list rotting. **A feed is not a copy** — it is read live every time — **so the failure he was guarding against cannot occur.**

**But it only rescues half:**

| | |
|---|---|
| **Events** | **Public RSS + iCal exist. Always current.** **The objection is fully answered — events sync live** |
| **The 1,278-organization directory** | **No public feed.** Needs the Engage API, which requires institutional approval. **Stays a curated Category A build (E-1), and the staleness objection still applies to it** |

**Amends `07-extracurriculars-board.md` §2a:** *"full sync with Heel Life — no"* **was right about the org directory and wrong about events.**

---

## 2h. THE LIVE LAYER — markers for what is happening, not just where your stuff is

> Andy, Aug 2026: *"I thought we talked about there being more functionalities to the markers… it would mark things that are going on, any sort of events that are happening, not just in Heel Life but everywhere else. Promotions on Instagram, which I can add as well, and it would redirect you to it… **basically what's going around, so it kind of gives the map a sense of life and that there's actually things going on at Carolina.**"*

**He is right that this was already discussed — §3a and `EV-1` — but it was never stated as a property of the MARKERS. It is, and it changes what the map is for.**

### This answers §2d's own objection

**§2d killed the campus surface because *"you already know where your commitments are."* That was true, and it is exactly why the live layer is different: you do NOT know what is happening tonight.** A map of your own records is a picture of things you remember. **A map of what is going on is information you do not have.** **The two marker layers are not the same feature wearing one coat.**

| Layer | Lifetime | Source |
|---|---|---|
| **Your places** | **Persistent.** Sites, labs, orgs, practices | Your own records |
| **What is happening** | **Ephemeral. Expires automatically** (§3a) | The three feeds below |

### The three sources — and none of them is scraping

**Andy said *"it would scrape, hopefully, from Heel Life."* Scraping is banned by standing rule** (`03-clinical-board.md` §5; `07-extracurriculars-board.md` §95 names Heel Life specifically). **The good news: every source he wants publishes a feed, so the capability arrives without breaking the rule.**

| # | Source | Access | Verified |
|---|---|---|---|
| **1** | **UNC Events Calendar — Localist API** | `calendar.unc.edu/api/2/events` · **open, no key** | **Aug 2026, live response confirmed** |
| **2** | **Heel Life — Campus Labs Engage** | **Public RSS + iCal** for publicly-visible org events. No key, no approval (§2b) | Aug 2026 |
| **3** | **Flyers and Instagram promos** | **Photograph or screenshot → `●` vision extraction** (§3a) | — |

**`calendar.unc.edu` is Localist, which Concept3D owns** — the same vendor as the map. **Its API returns exactly what a marker needs:** `title` · `description_text` · `location` (*"Carolina Union"*) · `room_number` · `geo{latitude,longitude}` · start/end times · `event_types` · `photo_url` · `localist_url` · `localist_ics_url`.

> ⚠️ **`geo` is frequently null.** The sample event returned `location: "Carolina Union"` with **no coordinates.** **So the buildings dataset with aliases (§3c) is not optional — it is what turns most of these events into markers at all.** This raises research ask #2 from important to blocking.

### Instagram — the honest answer

**There is no automated path, and I am not going to pretend otherwise.** Instagram's Graph API only reaches accounts you own or manage; **arbitrary club accounts are not accessible**, and scraping Instagram violates their terms and is actively blocked.

**But Andy already gave the answer himself — *"which I can add as well."*** **An Instagram promo is a flyer.** Screenshot it and it goes through the identical §3a pipeline: extract what · when · where · who · how to get involved, confirm, expire automatically. **No new mechanism, no new rule, no ToS problem.**

### What a live marker does when clicked

**Same panel as a place marker, different contents:** what · when · where (room included) · who is running it · **the way in** — the RSVP link, the `.ics`, the Instagram post, the QR destination. **Andy: *"it would redirect you to it."*** **HQ is the signpost; the action happens at the source.**

**And it feeds `EV-1` rather than duplicating it.** A live marker the student can actually reach becomes a prospect in the bell — *"nothing scheduled, seven minutes away."* **One event pool, two views: the map shows where, the bell asks whether you can go.**

### `EV-4` — the recommended marker (Andy, Aug 2026: a real gap, now filled)

> *"I wanted the list of features to be where it points you in the right direction and marks places where it's like, 'oh, recommended meeting or event you should check out.' I don't know if that's there."*

**It was not.** `E-2b` recommends **organizations** by interest. `EV-1` checks whether an event is **reachable**. **Nothing connected the two, and no marker had a recommended state.**

**A marker is recommended when it clears three deterministic tests — `○`, no LLM:**

| | |
|---|---|
| **Relevant** | Its category matches what the student already does or has said they are interested in — the E-2b signal, reused |
| **Reachable** | The `EV-1` feasibility call passes: nothing scheduled, and the travel actually fits |
| **New** | **Not an org they are already in.** *"Check out the club you're VP of"* destroys trust in every other recommendation |

**How it reads on the map:** the marker is **visually distinct, not louder** — an accent ring rather than a bigger or brighter pin. **A recommended event is still just an event.**

**How it reads in the panel: with its reason, always.** *"Research-related, and you're free Thursday evening — Genome Sciences is 4 minutes from your last class."* **`architecture/02` requires every recommendation to carry a visible reason**, and here the reason is also the proof it is not spam.

**The guards, which matter more than the feature:**

- **Never by popularity among premeds.** The standing rule from `07` §2b. **Ranking events by how many premeds attend pushes every applicant to the same three clubs and destroys the differentiation this whole pillar exists to show.**
- **A hard cap of ~3 recommended markers at once.** Recommend everything and you have recommended nothing.
- **Dismissible, and dismissal sticks** — per event, and per category if the student says *"not interested in this kind of thing."*
- **Silent when it has nothing to say.** **No filler, no "nothing recommended today" state.** If nothing clears all three tests, no marker gets a ring.
- **It never says the student should go.** *"Recommended"* is HQ pointing; **the free-reign principle means HQ does not tell you what your time is for.**

### Guards

- **Everything expires.** *"HackNC interest meeting, Sept 12"* is **garbage on Sept 13.** A campus layer that does not expire is a landfill within one semester.
- **Duplicates merge** across the three sources — the same event will appear in Localist and on a flyer. Match on name + date + location.
- **Never scraped, always attributed, always linked back to the source.**
- **Feeds are fetched, cached, and stale-tolerated.** No network → **the live layer is simply absent.** It never blocks the rest of the map.

---

## 3a. THE FLYER PIPELINE — the idea that makes the map alive

**Campus runs on paper.** Bulletin boards in the Union, the Pit, every department hallway, the walls outside lecture halls. **Interest meetings, research assistant postings, volunteer drives, info sessions — a lot of it exists nowhere online**, and a student who does not walk past the right wall never learns it happened.

**Andy's mechanic: photograph the flyer, HQ does the rest.**

### What the extraction actually pulls

| Field | Notes |
|---|---|
| **What** | Event or opportunity name |
| **When** | Date and time. **The most important field, because it determines expiry** |
| **Where** | *"Union 3411"*, *"Davis 219"* — **must resolve to a real building** to reach the map (§3c) |
| **Who** | The org running it — **link to the org directory** (§4) where one matches |
| **How to get involved** | The QR code, the email, the form link. **A flyer's entire purpose, and the thing a photo of it loses** |
| **Category** | Premed-relevant or not — research, clinical, service, social, academic |

**`●` requires vision.** No deterministic fallback for reading a photograph. **The fallback is manual entry**, which must stay available and fast, because a student without a key still walks past the same wall.

### The rules that keep it usable rather than a junk drawer

- **Extraction proposes; the student confirms.** Never silent, never auto-filed. `AGENT-IMPLEMENTATION-GUIDE` §2: **AI proposes → confirms → acts.**
- **Everything expires.** *"HackNC interest meeting, Sept 12"* is **garbage on Sept 13** and must disappear automatically. **A campus events layer that does not expire becomes a landfill in one semester.**
- **Duplicates merge.** Five students photograph the same flyer; **one event.** Match on name + date + location.
- **Unreadable is not a failure.** A bad photo produces a partial record the student can finish, **never an error and never a discard.**
- **A flyer with no date is a standing opportunity**, not a broken event — *"lab looking for undergrad RAs"* has no expiry and belongs in the opportunity engine (§4) instead.

### The contribution question — and it needs a real answer, not an assumption

Andy: *"or somehow other students can contribute."*

**This runs straight into `deferred.md` N-1, which ruled the cross-user network layer out of scope. But it is not the same thing, and the distinction matters:**

| | |
|---|---|
| **N-1 forbids** | Students seeing each other, comparing records, aggregated personal data. **The physician-directory problem** (`05-shadowing-board.md` S-3) |
| **A shared flyer pool is** | **Public information about public events.** Nobody's personal record is exposed. **Closer to the organization directory, which is fine** |

**So it is permissible. It is also expensive, and the costs are not obvious:**

- **It requires a backend.** HQ is localStorage-first on static hosting (`CLAUDE.md`). **A shared pool is the first genuinely multi-user thing in the product** and breaks that posture.
- **It requires moderation.** Spam, joke submissions, off-campus advertising, and things nobody wants on a premed student's map.
- **It requires trust decisions.** Who can contribute, what happens to a bad actor, what happens when something inappropriate is posted.

**Therefore, phased — and phase 1 is genuinely useful alone:**

> **Phase 1 — personal.** You photograph flyers; they go on **your** map. **No backend, no moderation, no sharing, works offline.** A student who walks the Union bulletin board once a week has a live campus layer nobody else needs to maintain.
>
> **Phase 2 — shared pool.** Requires the backend, the moderation policy, and an explicit revisit of N-1. **Do not build phase 1 in a way that assumes phase 2 will never happen** — the event record should be shaped so it could be shared — **but do not wait for it either.**

---

## 3b. THE MAP AS A LENS — clicking a building does something

*"You can also do other things on the map, like change classes in one of the buildings, look at a class in a certain building."*

**This is what separates it from a campus map you could get anywhere.** A map that only displays is a worse Google Maps. **A map that lets you act on what you have there is a view of your own life.**

**Click a building →**

- **What you have here.** *"CHEM 262, MWF 9:05. Your shift, Tuesdays."*
- **Act on it without leaving.** Open the class, log a shift, add a visit — **deep-linking to the owning surface**, never a second editing surface (shell §2.2: Overview-style composition, act on the owning page).
- **What is happening here** — flyer events at this location, this week (§3a).
- **Travel from where you are** — the `L-B` line (`08-logistics-board.md`).

**The rule that keeps it from becoming a second app:** the map **reads everything and owns nothing.** Every action is a deep link. **It has no records of its own except locations.**

---

## 3c. What this needs that does not exist yet

**Locations are the dependency for everything above**, and HQ currently stores none.

- **Every place-bearing record gains a location** — sites, orgs, labs, practices, classes, home.
- **UNC buildings are a Category A dataset.** *"Davis"*, *"Davis Library"*, and *"Walter Royal Davis Library"* are one building, and a flyer will say any of them. **A building list with aliases is what makes flyer extraction land on the map instead of failing.**
- **Off-campus is free-text with coordinates**, since clinical sites and practices are frequently in Durham or Raleigh.

### What a location is, after §2b

**§2b made this much smaller.** A location is one of two things, and the on-campus case — which is most of them — needs no map machinery at all:

| | Shape | Needs |
|---|---|---|
| **On campus** | A reference into the buildings dataset: **canonical name · aliases · coordinates · Concept3D location ID** | **Nothing at runtime.** A local lookup. Works offline, signed out, no key |
| **Off campus** | Free text plus **coordinates the student pastes or picks** | **No geocoding service.** There are a handful of these per student, and a required geocoder would be the first thing in HQ that breaks without a network |

**`concept3dId` is the join key** that makes `Show on campus map →` resolve to the right pin. **Without it the deep link cannot be built**, which is why it is now part of research ask #2.

**And it must degrade honestly, unchanged from §3:** a record with no location simply has no map link and appears nowhere. **Never nagged about, never marked incomplete.**

**This is also what `08-logistics-board.md` `L-B` needs.** **One dataset, two features** — build it once.

---

## 3. SUPERSEDED BY §2d — the original framing, your own records plotted

> ⚠️ **Retired Aug 2026.** *"A map of your premed life"* **is not a feature a student opens an app for — they already know where their commitments are.** The four questions below are still the right questions; **§2d answers them with numbers inside event prospecting and `L-B`, not with a plotted surface.** **Do not resurrect the Overview map from this section.**

**Every record in HQ has a place, and HQ knows none of them.** A clinical site, a lab, a volunteering org, a physician's practice, a class, where you live. **The app holds all of it as text and can answer nothing about it.**

**The questions a premed actually has, that no HQ surface can answer today:**

- *"I have CHEM 262 until 12:15 and a shift at 1. Can I physically get there?"*
- *"Which of the labs I'm interested in are on my walk to class?"*
- *"I'm shadowing at a practice in Durham — how long is that, really?"*
- *"Everything I do is on North Campus except one thing that eats a whole afternoon in travel."*

**These are logistics questions, and logistics is what actually kills premed commitments** — not motivation. A student quits a volunteering role because the bus takes 40 minutes each way, and no tracker ever told them that was the problem.

### What HQ's version is, and how it differs from a campus map

**Not a campus map. A map of your premed life.**

- **Every pillar's records are plotted** — clinical sites, labs, orgs, practices, your classes, home. **Typed by pillar, using the existing `--cat-*` colours**, so the map is instantly legible as *your* record rather than a directory.
- **Travel time between any two**, and specifically **between consecutive commitments on the same day.** *"CHEM 262 → UNC Hospitals ED: 18 min walk."*
- **The conflict read is the killer feature:** HQ already holds your class schedule and your shift cadence. **It can tell you a commitment is not physically possible before you take it**, which is the single most useful thing it could say.
- **Living situation as an input** (their app has this too) — everything is measured from where you actually start the day.

**Guards:** **no other students, ever** (N-1). **No "popular near you."** **Not a discovery surface** — it plots what you already have. **And it must degrade honestly**: a record with no address simply does not appear, and is never nagged about.

**Where it lives:** **not a pillar.** This is app-wide, reads every pillar, and belongs beside the shell calendar — **Overview or its own shell surface.** *(Andy's call.)*

---

## 4. The opportunity engine — the thing premeds actually lack

**Their `Opportunities` tab is org discovery. HQ's version is bigger and more valuable, because a premed's problem is not finding clubs — it is finding the four things nobody publishes a list of:**

| What | Why it is hard today | Why HQ can do it |
|---|---|---|
| **Research labs taking undergrads** | **The single most opaque thing in the premed path.** PIs do not advertise; students find labs by knowing someone. **This is where privilege compounds most** | UNC department pages, faculty listings, and the student's own interests are all inputs. **Category A, curated, dated** |
| **Clinical volunteer programs at UNC Hospitals / UNC Health** | Real applications with real cycles and deadlines, and students find out after the window closes | Published programs, sourced and refreshed on `data-refresh.md`'s cadence |
| **Scribe, EMT, CNA, and tech openings** | The highest-value clinical jobs for premeds, posted in a dozen unrelated places | Curated listings, linked out — **never scraped** |
| **Student organizations** | Their app already solved this at 1,278 | Same pattern, and **their scale is the target** |

**The design rules carry over from `07` §2b, unchanged and now more important:**

- **Recommend by interest and by what a student already does. Never by popularity among premeds** — that pushes every applicant into the same programs and destroys the differentiation the record exists to show.
- **Link out; do not rebuild.** HQ is the front door and an honest signpost.
- **Never scrape.** Curated, sourced, dated, human-reviewed (`knowledge-sources.md`).

**This is `data/unc-opportunities.json`, and it is the highest-value Category A dataset in the project** — higher than med-school stats, because it changes what a student *does* rather than only what they know.

---

## 5. Grand-scale features, by tab — at the caliber asked for

**The test I applied to each: does it change what a student can DO, or only how neatly they record what they already did?** Everything below is the first kind.

### Academics

- **`A-BIG-1` · Syllabus ingestion.** Their app has **`OPEN SYLLABUS RECORD`** and shows *"No assignments imported."* **UNC publishes syllabi.** A syllabus contains every exam date, the grading breakdown, and the workload — **the three things that determine whether a semester is survivable**, all of which students currently retype by hand or never enter at all. **Ingest it once; the whole term populates.** This is the single largest data-entry saving available anywhere in HQ.
- **`A-BIG-2` · The BCPM risk read on a plan you have not committed to yet.** Not *"here is your GPA"* — **"this specific schedule puts four BCPM courses in one term, and the last two students who did that dropped one."** Course difficulty is Category B (`knowledge-sources.md`), already on the backlog. **Planning is where GPA is actually won or lost, and HQ currently arrives after the fact.**

### MCAT

- **`M-BIG-1` · Collision detection against real life.** HQ holds the class schedule, the clinical cadence, and the test date. **It can see that a chosen MCAT date lands in finals week, or that the 20 hrs/week plan collides with a 16-credit term plus a standing commitment — and say so at the moment the date is picked**, not in April. **Deterministic. No AI.**

### Clinical · Volunteering

- **`C-BIG-1` · The application cycles nobody publishes together.** Hospital volunteer programs, scribe cohorts, and EMT courses all have windows that open and close. **Missing one costs a semester.** Sourced dates, surfaced on the roadmap before they open.

### Research

- **`R-BIG-1` · The lab directory, and it is the most important single feature in this document.** Who takes undergrads, what they work on, what they have published recently, whether they are currently recruiting. **Students find labs through friends, which means students without the right friends do not find labs.** A curated, sourced directory is the closest thing HQ can do to levelling that.

### Shadowing

- **`S-BIG-1` · Programs, not people.** UNC Health and area practices run structured shadowing programs. **Those are institutions and publishing them is safe** — unlike a physician directory, which S-3 rules out permanently. **The distinction is already established; this respects it.**

### Extracurriculars

- **`E-BIG-1` · The full organization directory** (§2, §4). **1,278, not 120.**

### Cross-cutting

- ~~**`X-BIG-1`** · The map (§3).~~ **RETIRED — replaced by `EV-1`, event prospecting** (§2d). **Not a cross-cutting surface; a feature inside Extracurriculars `Discover`.**
- **`X-BIG-2` · Does this week actually fit?** 16 credits + 12 hrs clinical + MCAT studying + an officer role is **a number**, and HQ holds every input. **State it plainly and say nothing about it** — the free-reign principle forbids judging it, but a student who has never seen the total is the one who over-commits.
- **`X-BIG-3` · Goals that carry their next action.** Their whiteboard cards have **`ADD TO CALENDAR`** and **`GET INVOLVED`**. **HQ's Quarterly Goals are inert text.** A goal should link to the thing that advances it — **the org, the program, the lab, the deadline.**

---

## 6. Open

| # | Question | Status |
|---|---|---|
| ~~**X-a**~~ | Where does the map live? | **RE-RULED Aug 2026 (§2d): nowhere — it is not a surface.** The map is the `where` on an event card inside **Extracurriculars `Discover`**. *(The earlier "two doors" answer in §2a is superseded.)* |
| **X-b** | **Is the opportunity engine one dataset or several?** | Labs, hospital programs, jobs, and orgs have different sources and refresh cadences. **Still open** |
| ~~**X-c**~~ | Syllabus source | **Andy, Aug 2026:** *"I thought that was already a feature… if it asks you to input a syllabus, then it should somehow redirect you back to the syllabus."* **He is right that import exists** — `01-academics.md` §15 already requires *"syllabus import auto-populates topics/exam dates/grade weights."* **What is missing is the pointer:** when HQ asks for a syllabus it should say **where to get it**, rather than assuming the student has the PDF to hand. **Small fix, real friction removed.** *(Whether UNC has a central published source still needs checking — see X-e.)* |
| **X-d** | What is first? | **My read: the opportunity engine.** It changes outcomes rather than convenience, **and the lab directory is its sharpest edge** |
| **X-e** | **Transit routes, and any central UNC syllabus source** | **Andy has offered a research agent** (Aug 2026). **The specific asks are in §7** |
| **X-f** | **Does the shared flyer pool (phase 2) happen at all?** | It needs a backend, moderation, and an explicit revisit of N-1. **Phase 1 does not wait on the answer** (§3a) |
| ~~**X-g**~~ | Embed UNC's map wholesale? | **RULED Aug 2026: no — deep link instead.** An iframe is a cross-origin black box that cannot show your records or report a click. **UNC does wayfinding, HQ does *"what do I have here"*** (§2b) |
| ~~**X-h**~~ | **CLOSED Aug 2026 — not pursuing.** Andy: *"I'm not tryna send any email."* **Moot anyway: §2g renders the map with Leaflet and Stadia tiles, and `Open in UNC maps ↗` is a plain hyperlink needing nobody's permission.** UNC's tiles remain a someday-upgrade, not a dependency. *(Original question retained below.)* |
| **X-h (orig)** | **Is a non-UNC site allowed to deep-link or embed map `id=111`?** | **Now blocking, not cosmetic — §2f embeds it.** UNC publishes embed instructions **for UNC websites**; HQ is a student project on GitHub Pages. **One message to `maps@unc.edu` asks all three things at once: (1) may a student project embed map `id=111`, (2) can we have the Concept3D location IDs for UNC buildings (§7 ask 2), (3) can `postMessage` marker events be enabled** — that last one requires UNC's Concept3D success manager and unlocks two-way binding |
| **X-i** | **Can Andy get approved for the Engage (Heel Life) API?** | **Requires an official UNC campus contact to open a support case with Anthology.** Worth pursuing. **Phase 1 uses the public RSS/iCal feeds instead and does not wait** (§2b) |

---

## 7. What to hand the research agent

**Andy, Aug 2026:** *"Transit and route data, I think I could get another LLM to research that for you. I have a very powerful research agent."*

**Yes — and these are the specific asks. Every one of them is Category A** (`implementation/knowledge-sources.md`): the output should be **sourced, dated, and structured as data**, not prose, so it can be committed as `data/*.json` with a `freshness` block.

| # | Ask | Feeds |
|---|---|---|
| **1** | **Chapel Hill Transit** — routes, stops, service days, headways, and **whether a GTFS feed or published schedule data exists** in a usable form | `L-B` travel estimates. **Headway matters as much as the route** — a bus every 30 min changes the honest number |
| **2** | **UNC buildings** — official names, common abbreviations, **known aliases** (*"Davis"* / *"Davis Library"* / *"Walter Royal Davis Library"*), coordinates, **and the Concept3D location ID for each** (the `m/104787` value in a `map.concept3d.com/?id=111` deep link). **Ask how that ID list can be obtained lawfully — `maps@unc.edu` is the published contact — rather than harvesting it** | §3c, §2b. **The alias list makes flyer extraction land; the Concept3D ID makes `Show on campus map →` work.** **Raised in priority: after §2b this is the single dataset the whole campus layer stands on** |
| **3** | **UNC syllabus publication** — is there a central archive, is it per-department, is it behind auth, and how complete is it? | `A-BIG-1` and X-c |
| **4** | **UNC research labs taking undergraduates** — by department, with PI, focus area, and whether they publish an application route | **`R-BIG-1`, the highest-value item in this document** |
| **5** | **UNC Health / UNC Hospitals volunteer and shadowing programs** — what exists, application windows, deadlines | `C-BIG-1`, `S-BIG-1` |
| **6** | **UNC student organizations** — the full registered list with category and description | `E-BIG-1`. **Target the real scale — 1,200+, not a curated 150** (§2) |

**For each, what is actually needed back:** the data itself · **the source URL** · **the date retrieved** · **how often it changes** · and **any access restriction** (auth, rate limits, terms that forbid reuse). **That last one is not optional** — `03-clinical-board.md` §5 bans scraping, and a dataset we cannot lawfully use is worse than no dataset.

**On the offer to access the library:** **not needed.** The docs are the source of truth and I read them directly. **What would help is the research output as files** — dropped into `data/` or handed over as structured text I can convert.
