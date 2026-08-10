# Knowledge delivery: the board before speccing

**Reference index, not spec.** Companion to `specifications/02-atlas-interface-and-knowledge-map.md`. Where a written spec exists, it wins.

**The subject:** how Atlas's raw repository reaches a student inside HQ, in a form short enough to read and structured enough to trust.

---

## 1. The problem, in Andy's words (Aug 2026)

*"The mascot gives little bits of advice, hopefully from Atlas. It's random, you can shuffle it. I need help expanding the range of information it could carry and finding better ways to display it."*

*"The current flaw of the mascot telling us this information is that it's kind of scattered, and you don't really know what you're going to get."*

*"Think of Atlas as the raw source. I'd like to think of it as Wikipedia. HQ could present the data in a form that's more structured but also short — very short tips and tricks, short pieces of motivation, little blurbs."*

*"Front-load this information onto HQ so users wouldn't have to stray as much trying to dig in Atlas."*

**The design target he named, and it is the sharpest sentence in the brief:** *"All it takes is for it to be there, and people just look at it."* **Zero effort required. No commitment, no queue, no unread count.**

---

## 2. The split (RULED, Andy Aug 2026)

*"The mascot should exclusively give pointers about the actual app itself — local, basic tips about users increasing the functionality. Presumably the mascot is on every tab, so it will give tab-specific advice."*

| | **Mascot** | **The new surface** |
|---|---|---|
| Subject | **HQ itself.** How to use this app | **Medicine and the process.** Everything else |
| Analogy | A game giving pro tips about its own game | Wikipedia's front page |
| Source | **Authored by us.** A finite, curated set | **Atlas.** A repository too large to read |
| Scope | **Tab-specific.** Clinical's mascot talks about Clinical | Phase-specific, not tab-specific (§5) |
| Voice | HQ's own | **Relayed and attributed** (§4) |
| Repeats | **Yes, and that is fine.** A finite set recycling is honest | **No.** Never repeat until the pool is exhausted (§5) |

**Why the split is right, beyond tidiness:** the two have different *truth conditions*. An app tip cannot be wrong — we wrote the app, we know. **A claim about AMCAS can be wrong**, and mixing the two in one voice teaches a student to trust both equally. That is the actual defect behind *"you don't know what you're going to get."*

**What already exists to build on.** `TipEntry` (`types.ts:659`) already carries `text`, `source?`, `tag: 'official' | 'community' | 'andy'`, and `pillar?`. `MascotBubble` already runs `pickDaily(tips, 7)`. **The seed of both the taxonomy and the daily rotation is in the code.** This is a redesign of something real, not a greenfield feature.

---

## 3. The taxonomy — typed by FORMAT, not by trust (CORRECTED, Andy Aug 2026)

**An earlier draft of this section typed content by "can this be wrong?" and built a trust hierarchy on it. Andy killed it, correctly:**

*"I don't know why you keep trying to fact check yourself despite YOU being the one obtaining this information. You and me both. We've already gone through the first pass, so I don't know why you're worrying so much about 'can be wrong' or reliability. All info is good as long as it's been checked by both of us and it's actual info with substance."*

**He is right, and the mistake is worth naming so it does not come back.** A trust taxonomy solves a problem this product does not have. It is the right structure for **auto-ingested, unreviewed, user-generated content at scale** — and every blurb here is hand-checked by two people before it ships. **Building tiers of reliability into a hand-curated set tells the reader to distrust material we already verified.**

**Type by what a blurb LOOKS like instead.** The types must be distinguishable **on sight**, not by decoding a trust badge.

| Type | Register | Example |
|---|---|---|
| **Tip** | Actionable. Something to do or do differently | *"Give your letter writers your CV and a draft personal statement when you ask."* |
| **Fact** | A statement about how the process works | *"Letters must be received before AMCAS verifies your application."* |
| **Quote** | **In quotation marks, attributed to whoever said it.** Motivation and perspective live here (§4) | *"You'll be a doctor anyway"* — @creator |

**Three types. They are visually distinct because they are shaped differently** — a tip is an instruction, a fact is a statement, a quote has quotation marks and a name. **No badges needed.**

**The one thing worth keeping from the discarded version, and it is about our workflow, not the reader's trust:** a `Fact` carries a **date we last checked it**. Not a reliability warning — **a maintenance handle.** AMCAS changes its dates and its rules; in 2029 we need to know which facts to re-verify. **The date is for us. It can be small, or in the feed only, and it is not a disclaimer.**

**Typing happens at ingest, in Atlas.** HQ renders the type it is handed and never classifies.

---

## 4. Motivation: quotation marks do the work

**Andy's format, which is simpler than what this file proposed and achieves the same thing:**

*"Pieces of motivation are complex, and it doesn't matter who the speaker is. It wouldn't be practical to derive that information from an Atlas source. To distinguish, just put it in quotes and generalize it: 'you'll be a doctor anyways' — [insert TikTok content creator]."*

**This resolves the concern the earlier draft raised, at a fraction of the cost.** The worry was that an app telling an anxious pre-med *"20 years will pass anyway — might as well be a doctor!"* in its own voice reads as glib, and is not neutral about a student for whom leaving medicine is the right call. **Quotation marks and a name already fix that.** A quote is visibly *someone else's sentence being passed along*, not the product asserting something. **That was the entire goal, and punctuation gets there without a provenance pipeline.**

**So the rule is a format rule, not a sourcing rule:**

- **A `Quote` renders in quotation marks with an attribution line.** Always both.
- **Attribution can be loose** — a handle, a role, *"a third-year"*. **It does not need to resolve to an Atlas record.** Andy: *"it doesn't matter who the speaker is."*
- **HQ does not motivate in its own voice.** Not because attribution is sacred, but because **an unquoted "you've got this" is HQ speaking**, and that is the version that lands badly. If it is worth saying, it is worth quoting someone saying it.
- **Keep the type-level off switch.** A student who does not want motivational content turns `Quote` off in Settings and keeps tips and facts. **Cheap, and the only real protection needed.**
- Inherits the standing bans (`03-clinical-board.md` §5): no readiness scores, no comparison to other applicants, no streaks.

---

## 5. Selection: NOT phase-gated (CORRECTED, Andy Aug 2026)

**An earlier draft proposed gating blurbs to the student's current roadmap phase. Andy found the flaw, and it is fatal:**

*"Let's say I'm a student who doesn't really emphasize or care much about LOR, and all the good info happens to be in that tab, conveniently being one of the ones I access the least. It should really show up in a page I always see, so that in return I'm able to think about a concept more. I would then be motivated or reminded to access the LOR tab and think about it more because of that feed."*

**The design was backwards.** Gating content to where a student already is means **the material they most need appears where they are least likely to look.** A student under-investing in letters is precisely the student who needs letter content, and phase-gating hides it from them until it is late.

**The frame that replaces it:**

> **Sauce is a reason to go somewhere. It is not a reward for already being there.**

**And phase-gating fails on the roadmap's own terms.** `03-overview.md` §6.7 sets pacing **deliberately earlier than conventional advice**. Content locked to your current phase is by definition about what you are *already doing*. **The valuable blurb is usually about what is coming**, which is exactly what a phase gate withholds.

**So: it lives on Overview, and it draws from everything.**

### 5a. Shuffle, with coverage rules

Andy: *"I think it'd be digestible if it just shuffled, or if it allowed 2-3 other sections/pillars to choose from."*

**Plain random was the original defect** (*"scattered, you don't really know what you're going to get"*). **Plain random with two guarantees stops being scattered:**

1. **Never repeat until the pool is exhausted.** A seen-set behind the shuffle. Shuffling must feel like progress, not a slot machine. *(`pickDaily` in `MascotBubble.tsx` already does a daily pick; it needs the seen-set added.)*
2. **Spread across pillars.** Do not serve three letter blurbs in a row. **Over a week, a student should see several areas.**

### 5b. The strongest version: weight toward what they touch least

**This is Andy's LOR example turned into a rule, and it inverts the broken design into its best form.**

**HQ already knows which tabs a student visits.** A pillar going untouched is the clearest possible signal that its content should surface. **Deterministic, no AI, no model** — just a visit recency count per pillar, tilting the shuffle.

**Guard rails, because this could easily curdle into nagging:**

- **The tilt is a weight, never a filter.** Neglected pillars appear *more often*, not *exclusively*.
- **The copy never mentions the neglect.** No *"you haven't opened Letters in a month."* **The blurb just shows up.** The student connects it themselves, which is the whole mechanism Andy described.
- **Same rules as everything else here:** no badge, no count, no nudge. **The tilt is invisible.**

### 5c. Optional: let the student pick emphasis

Andy's alternative — *"or if it allowed 2-3 other sections/pillars to choose from."* **Compatible with 5a and 5b, and probably a Settings preference rather than a front-and-center control.** Default is everything; a student who wants to bias toward MCAT and Clinical can. **Lean: build 5a first, 5b next, 5c only if asked for** — a picker on day one is a configuration screen standing between a student and a blurb.

---

## 6. The surface — ONE door, in the top bar (RULED Aug 2026, supersedes the two-door design below)

**Andy, Aug 2026:** *"I do want to make this small in scope. To build this would essentially be to replace Atlas and I'm not tryna do that. I'm just tryna transfer a small **view** of what Atlas can show."* And: *"instead of a distracting box above tasks and other important stuff — maybe like a pop up or a drop down originating in the top menu."*

**This cuts the feed page entirely.** §6a below proposed two doors: a block on Overview *and* a browsable archive at `/overview/sauce` with type filters, history, and saved items. **A browsable archive of pre-med knowledge is Atlas.** Building one inside HQ duplicates the product Sauce is meant to be a window into — and §7 already said *"not a second Atlas."* The drawing ignored the rule the board had written.

| | Ruling |
|---|---|
| **Surface** | **One popover, from a top-bar trigger.** No route, no page, no bento block. One component |
| **Contents** | **Three blurbs, a shuffle, and a way out.** `Open in Atlas →` is the only exit |
| **Browsing, filters, history, archive** | **Atlas's. Not built here** |
| **Why not the page** | Overview's bento is already 8 blocks (`03-overview` §5). A full-width row pushes the roadmap down and puts *"something interesting"* above *"what you have to do"* on a page whose job is now-and-soon |
| **Glass** | **Earned honestly.** `04` §0c puts frosted glass on floating overlays, which is what a popover is |

**The cost, stated plainly.** Andy's original bar was *"all it takes is for it to be there, and people just look at it."* **A dropdown is not ambient — it needs a click.** The mitigation is a **labelled pill** rather than an icon, so the word *Sauce* stays visible when closed. **If it turns out nobody opens it, that is this trade failing**, and the fix is one ambient line in the top bar, not a return to the bento block.

**It must not become a second Attention bell.** The bell means *things that need you*; Sauce means *things you might like*. Two adjacent bell-shaped icons would make Sauce inherit obligation, and obligation kills it. **A labelled pill, a book icon, the far side of the search field, and never a badge, count, or dot.**

**Mockup:** `specifications/mockups/00-shell/sauce-dropdown.html` (DRAFT). **Supersedes** `mockups/03-overview/sauce-two-doors.html`, which is now historical.

---

## 6a. SUPERSEDED — the two-door design

Andy asked for both an ambient thing and a place to check back. **Those are different products and the project already has the pattern for holding both: `one record, two doors`** (Story Bank, pillar reflections, and now Timeline node steps).

| Door | What it is | Where |
|---|---|---|
| **The card** | **Today's blurbs.** 2–3, dated, shuffleable, dismissible. Ambient — you do not have to do anything | A block on **Overview** |
| **The feed** | **Everything you have been shown**, newest first, filterable by type, with saved items pinned | A sub-route off the card, same pattern as `/overview/tasks` |

**Rules that keep it from becoming an inbox:**

- **No unread count. No badge. Ever.** The moment it has an unread count it is a chore, and *"all it takes is for it to be there"* is dead.
- **Nothing expires and nothing is missed.** Skipping a day costs nothing; yesterday's blurbs are in the feed.
- **It does not compete in the 3-per-week attention auction** (`01` §6.11). **It is not an interruption — it is a place you look.** That distinction is what keeps it from becoming nagging.
- **Saving is one tap**, and saved items are the feed's default filter. Andy: *"a way that students are able to see and maybe check back."*
- **Every blurb shows its origin.** Andy: *"derive what came from where."* Source line on the card, always, not on hover.

**Naming — RULED `Sauce` (Andy, Aug 2026).**

**`Rounds` was proposed and rejected.** Andy: *"to a new user, 'Rounds' is not really a good name."* He is right, and it is the specific failure of a name picked by the person building the thing — **it only lands if you already know what rounds are.** A freshman who has never been in a hospital reads it as a shape. **Bad name for a feature whose entire job is teaching people who do not know yet.**

**`Sauce` works because the meaning maps exactly, not because it is current.** *"What's the sauce?"* asks how someone actually did the thing — **insider knowledge**, which is precisely what this delivers. Considered and passed over: `Good to know` (accurate, warm, three words), `Did you know` (Wikipedia's own name for this exact pattern, but reads young), `Today` (says *when*, not *what*, and collides with schedule language), `Cheat code` (legible, fits the Timeline's game framing, but "cheat" implies a shortcut when most of this is just knowing the process), `Lore` (repo precedent in `research-prompts/community-lore.md`, but leans mythology over fact).

**`04` §12 backs the choice:** *"Personality & motion are core — not sprinkles… Premed OS is built to make users want to come back."* A slangy name is consistent with a UNC app that has a ram mascot, not a departure from the design system.

**The risk, recorded once so it is not re-argued.** Slang dates, and the app follows a student four years — someone starting 2026 graduates 2030. A *product* using slang can land as trying too hard in a way a person using it does not. **Two things make it an acceptable bet:** `sauce` is unusually stable as slang goes, and **the name is one string — the cheapest thing in the app to change.** Unlike a route or a data model, reversing it costs nothing.

**Still do not call it a feed in the UI** — the word carries social-media expectations this must not meet.

---

## 7. What this must not become

- **An inbox.** No unread counts, no badges, no streaks for reading.
- **A social feed.** No likes, no comments, no other students. `deferred.md` **N-1** already ruled the cross-user network layer out of scope.
- **A content treadmill** where value is measured in volume shipped. **R7 applies: cut rather than approximate.** Twenty sourced facts beat two hundred confident-sounding sentences.
- **A second Atlas.** HQ front-loads and points; it does not reimplement browsing. Deep exploration stays in Atlas.
- **HQ speaking in a motivational voice** (§4).
- **A classifier.** HQ renders types it is handed (§3).

---

## 8. Open, for Andy

| # | Question | Lean |
|---|---|---|
| ~~**K-1**~~ | ~~Name?~~ | **RULED `Sauce`** (Andy, Aug 2026). See §6. |
| **K-2** | **How many blurbs per day on the card?** | **2 or 3.** One feels thin for something called a digest; five is a reading assignment |
| **K-3** | **Does the mascot keep any Atlas content at all, or is the split absolute?** | **Absolute.** Half-splits are how *"you don't know what you're going to get"* happens |
| **K-4** | **Do Timeline nodes and Sauce share one pool of writing, or two?** A Timeline node already holds `note` facts about its phase (`11-timeline-tasks.md`), and a Sauce `Fact` is the same shape. **If they share, a student can read the identical sentence in two places and it feels like a bug. If they do not, the same fact gets written twice and the two copies drift.** | **Separate, and keep them short of each other:** a node's notes are *about that node*, Sauce is *about everything*. **If a sentence would work in both, it belongs in the node.** |
| **K-5** | **When Andy writes a tip himself, does it enter Sauce or stay separate?** `TipEntry.tag` already has an `'andy'` value, and the `don't-do reminders` panel is his own writing. **He is the one source that is neither Atlas nor an app tip.** | **It enters Sauce as a normal `Tip`.** A separate "from Andy" channel means a second thing to maintain and a second place students must check. **If the writing is good it stands on its own.** |
| **K-6** | **Ship before Atlas?** | **Yes, small.** A hand-authored starter set proves the surface. **The alternative is that the surface is designed against imaginary content**, which is how the register goes wrong |

---

## 9. Where does this actually come from? (backend, researched Aug 2026)

**Standing instruction (Andy, Aug 2026):** *"When we're developing these types of features, research how coders do these sorts of things so I don't have to invent a new method. There are YouTube tutorials and threads out there for methods to do something. Everything has been done. Back-check my methods with the internet first."*

### 9a. The finding that matters most: this is already built

**`src/hooks/useDailyQuote.ts` is a working implementation of exactly this pattern**, and nothing about Sauce needs inventing:

```
local bank (bundled, always present)
  → try remote fetch
    → on success, cache in localStorage keyed by today's date
    → on failure, keep the local bank already in state
```

**That is the industry-standard "offline-first content with remote enhancement" shape**, and it already satisfies `CLAUDE.md`'s hard rule that **signed-out mode stays fully functional**. **Sauce should extend this hook's architecture rather than start over.**

**The repo also already answers "where does content live," twice:** `src/data/prepcatContent.ts` is 56KB of content as a typed TS module, and `public/prepcatcontent/` holds fetched static assets. **Both patterns are in use.**

### 9b. The constraint that decides everything

**HQ deploys to GitHub Pages from `main` via Actions.** That is **static hosting with no server**, so "a backend" in the usual sense is not available. Three real options, and the tradeoff is entirely **how content gets updated**:

| | Where | Update path | Offline | Verdict |
|---|---|---|---|---|
| **A. Bundled module** | `src/data/sauce.ts` | **Code change → rebuild → redeploy** | Guaranteed | **Ship this first.** Type-safe, zero network, no new infrastructure. Matches `prepcatContent.ts` |
| **B. Static JSON** | `public/sauce.json`, fetched | Commit a file → redeploy | Needs a cache | Halfway. **Still a deploy**, so it buys little over A |
| **C. Supabase table** | `sauce` table, public-read RLS | **Edit a row. No deploy at all** | **Only via cache** | **Design for this, ship it later.** Supabase is already in the stack for auth |

**On option C's safety, since it is the one that sounds risky:** Supabase's anon key **is designed to be public and ships in the JS bundle of every Supabase app on purpose.** What makes a public-read table safe is **Row Level Security** — enabling RLS defaults to deny-all, and a `SELECT`-only policy for the `anon` role is a documented, supported pattern. **The failure mode is forgetting to enable RLS**, which leaves the table fully readable *and writable* by anyone holding the anon key. So: **RLS on, SELECT-only policy, no write policy.**

### 9b-i. Sauce is Category B, all of it — and the docs already name its interface

**Read `implementation/knowledge-sources.md` before this section. An earlier draft of this board misused Category A/B as a reliability tier. It is not.** The split is **what consumes the data**:

- **Category A** — app reference data that **powers deterministic logic** (`data/*.json`: requirements, school stats, MCAT structure). The file states flatly: *"This is NOT Atlas."*
- **Category B** — **Atlas** knowledge that *"guides your decisions — it does not power app logic."* Pipeline: *"Atlas ingestion → AI extraction → structured, cited claims in Atlas's knowledge graph."*

**Every blurb in Sauce is Category B.** Tips, facts, and quotes alike — none of them compute anything; a human reads all of them. **A "fact" being verifiable does not make it Category A.**

**And the build pattern already names the interface:** *"the coding agent builds against a `data/*.json` file (Cat A) or **the Atlas API** (Cat B) — never a live URL."* **So "pull from Atlas" is already the stated answer. What is open is the transport, not the intent.**

**One row of that file is Sauce in advance:** Category B lists *"Pathway wisdom (what pre-meds/doctors report) — guides Roadmap, advising — source: community, doctors — 🟡"*. **That is this feature, already on the backlog.**

### 9b-ii. Real-time or bulk-then-drip? Bulk. (Andy's question, Aug 2026)

*"Is the transfer happening in real time? Are you saying display on HQ as it transfers, or transfer in bulk and then slowly display it out?"*

**Bulk, then drip locally — and this is not a preference, it is the pattern `implementation/data-refresh.md` already establishes for external knowledge.**

That file's core principle: **"automated *detection*, human-approved *updates*."** The job *"proposes, never applies."* Nothing external enters HQ without a person approving it.

**Applied to Sauce:**

1. **Atlas ingests and structures continuously.** Its own clock, nothing to do with HQ.
2. **A batch moves to HQ on a cadence**, not per-view. **Approved before it lands**, which is the only way Andy's own bar survives: *"all info is good as long as it's been checked by both of us."*
3. **HQ caches the batch and drips from it locally** — the daily pick runs against the cache, not the network.

**Why not stream live per view:**

- **It breaks the approval gate.** Whatever Atlas ingested overnight would appear in a student's Overview unreviewed. `data-refresh.md` exists specifically to prevent that.
- **It breaks offline**, and `general.md`'s service foundation plus `CLAUDE.md`'s localStorage-first rule both require the card to render with no network.
- **It is a network round-trip on every page view** for content that changes daily at most.
- **`useDailyQuote` already does the right thing** and would have to be made worse to do the wrong one.

**On Andy's offline point** — *"it's not common that college students would access Atlas offline, so it's fine that SOME bits of information circulate, refreshing presumably every day, so that offline users aren't seeing the same thing"* — **that is exactly bulk-then-drip, and it is right.** The cached batch is not a degraded fallback; **it is the normal read path.** The network is only how the batch gets replaced.

**Open (needs the integration decision):** batch **size** and **cadence**. A week of blurbs pulled daily is the obvious start — small, and a student offline for days still sees variety. **Cannot be settled until `HQ↔Atlas data flow` is settled** (`02` §98).

### 9b-iii. Is bulk-then-drip standard? Yes — and it has a name (researched Aug 2026)

**"Bulk then drip" is two well-known things stacked, neither of them novel.**

**Part one, the transport, is `stale-while-revalidate`.** Serve the cached copy instantly, fetch fresh in the background, update the cache for next time. It is not a convention someone blogged — **it is in the HTTP `Cache-Control` spec** and has shipped since Chrome 75 / Firefox 68. In the standard three-way breakdown of caching strategies, the usual recommendation is **Cache-First for static assets, Network-First for critical data, and Stale-While-Revalidate for API JSON.** **Sauce is API JSON that changes at most daily and is never critical to a decision** — squarely SWR, the textbook case.

**Part two, the drip, is not a caching concern at all.** Showing one blurb per day out of a cached batch is **local scheduling**, and `pickDaily()` already does it. **Nothing to design.**

**And the surrounding architecture is the 2026 default, not a niche choice.** Local-first is described as having *"reached a significant turning point… local execution first, cloud as a secondary layer for synchronization and backup"*, with the dominant client pattern being **all reads from the local store, writes local first then synced.** **HQ is already built this way** (`CLAUDE.md`: localStorage primary, signed-out fully functional). Sauce reading from cache and treating the network purely as how the batch gets replaced **is the house style, not an accommodation for offline users.**

**The known failure mode, and it sets the batch size.** The literature's warning about prefetching is specific: *"naive prefetching can backfire — if too many predictions are made, the app may fetch data the user never needs, which wastes bandwidth, especially on mobile."* **So: a small batch on a slow cadence.** A week of blurbs, not the repository. **This is the argument against "sync all of Atlas down and pick locally."**

**One deliberate departure, flagged per the standing rule.** Most apps SWR **straight from their own API with no human in the loop.** HQ inserts **a person approving each batch** before it can be served (`data-refresh.md`). **That step is not standard practice** — it exists because Atlas ingests community and social content, and Andy's bar is *"checked by both of us."* **The transport is off-the-shelf; the approval gate is the custom part, and it is the part worth keeping.**

**Implementation note:** HQ is a Vite SPA on static hosting with no service worker, so SWR here is **app-level code, not a `Cache-Control` header or a Workbox route.** `useDailyQuote.ts` is already a correct hand-rolled instance of it — cached value keyed by date, network attempt, silent fallback. **Extend that; do not add a service worker for this.**

### The real blocker is upstream of all three

**Andy, Aug 2026:** *"content should theoretically be pulled from the Atlas database of information, since all information relating to whatever would be housed there."*

**That is correct and it is already the stated architecture.** `02-atlas-interface-and-knowledge-map.md` §8: *"Atlas ingests external pre-med knowledge… HQ surfaces that knowledge as advice and recommendations."* **Sauce is that sentence with a UI.**

**But the same spec lists `HQ↔Atlas data flow` as an OPEN item** (`02` §98: *"embedded vs. linked vs. merged codebase"*). **There is no decided way to pull yet**, so options A/B/C above are really *"what does HQ do until that is settled,"* not a competing answer.

**And the local set is not a competing source — it is the floor Atlas sits on.** `CLAUDE.md` requires **signed-out mode to stay fully functional** and localStorage to be primary. So Sauce must render **with no network and no account**, forever, no matter how good Atlas gets. **`useDailyQuote` already proves the shape:** local bank always present, remote as enhancement. **Authoring a local set is permanent architecture, not throwaway work.**

**A proto-Atlas already exists in the repo.** `seed.ts:616` has ~15 tips already carrying `source` and `tag` — `'r/premed'`, `'AAMC'`, `'your UNC plan'`. **That is the same shape Sauce needs, hand-curated, and it is Andy's own writing.** Sauce is that array grown and given a surface, not a new system.

**One reconciliation worth noting.** Atlas's own spec makes **trust separation structural** (`02` §17: external-cited vs. personal-unverified vs. HQ records are distinct node types). That is not in conflict with §3 killing the trust taxonomy in the UI: **Atlas separates for authoring and curation; HQ does not expose it, because by the time a blurb ships both of us have checked it.** The separation does its job upstream and disappears at the surface.

**Recommended sequence: A now, C when content updates outgrow deploys.** The `useDailyQuote` shape means switching is a change to one hook, not a rewrite — **the local bank stays as the offline floor either way.** Do not build B; it costs a deploy like A and gains nothing.

### 9c. `pickDaily` is a cycle, not a shuffle — and that is a real defect

**`src/lib/date.ts:55`:**

```ts
export function pickDaily<T>(items: T[], salt = 0): T | undefined {
  const idx = (dayNumber() + salt) % items.length
  return items[idx]
}
```

**This walks the array in fixed order forever.** Three consequences:

1. **The sequence is literally array order.** Whatever is written first is seen first, every cycle, for every student.
2. **Inserting an item shifts everything after it**, so one edit re-orders every future day.
3. **There is no seen-set** — it cycles by modulo, so "never repeat until exhausted" is not expressible.

**The standard fix, and it is well-trodden:** a **seeded PRNG driving a Fisher–Yates shuffle**, seeded from the day number. Same seed produces the same order, so the pick is stable across reloads and devices without storing anything; a different day reshuffles. [`seed-shuffle`](https://github.com/yixizhang/seed-shuffle) is a minimal JS implementation of exactly this, and the [Miller Shuffle Algorithm](https://github.com/RondeSC/Miller_Shuffle_Algo) exists specifically to solve *"no annoying repetition"* with low overhead — which is Andy's *"you don't really know what you're going to get"* complaint stated as an algorithm problem.

**How much does fixing it matter right now? Less than I first said — correcting that.** The seeded pool is **~15 tips and 7 quotes** (`seed.ts:616`, `:637`). **Cycling 15 items and shuffling 15 items are nearly the same experience** — you see all of them inside about two weeks either way, only the order differs. **The fix is a prerequisite for scale, not an improvement you would feel today.** It becomes necessary when the pool is 300 Atlas items and a cycle means reading them in authoring order for a year. **It is a ~20-line change and can happen at any point; it should not lead the work.**

**What Sauce needs on top of a seeded shuffle:**

- **A seen-set in localStorage** — IDs only, so it stays tiny. This is what makes *"never repeat until the pool is exhausted"* real rather than approximate.
- **Pillar spread**, so a day is not three letter blurbs (§5a).
- **The neglect weight** (§5b), applied as a bias on the shuffle, not a filter.

**Note against S0:** the seen-set grows without bound. **Store IDs, never text**, and it stays trivial next to the record collections. Still worth naming, because `deferred.md` **S0** is the storage-quota defect and unbounded growth is how it bites.

### 9d. One thing to retire

**`useDailyQuote` currently fetches `zenquotes.io/api/today`** — a free, generic, non-premed quote API. **Sauce' `Quote` type replaces it with curated, premed-relevant material.** When Sauce ships, that external dependency should go: it is an uncurated third-party string rendered in HQ's hero, which is the one place §4's rules matter most.
