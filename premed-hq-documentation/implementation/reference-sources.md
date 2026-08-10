# Reference Sources — where to back-check a method

**Status:** Living list
**Companion to:** `implementation/knowledge-sources.md` (which maps *pre-med domain* knowledge). **This file maps *engineering* knowledge** — where to check that a technical method is the established one and not something invented on the spot.

**Why it exists (Andy, Aug 2026):** *"Research how coders do these sorts of things so I don't have to invent a new method. Everything has been done. Back-check my methods with the internet first."* And: *"Refer everything to these resources so that I can make sure my methodology is correct and I'm not making some BS up."*

---

## 1. The ladder — check in this order, stop when answered

1. **The repo itself.** HQ has usually solved it once already. *(`useDailyQuote.ts` + `pickDaily()` were a working daily-rotation implementation that a whole design discussion nearly reinvented from scratch.)*
2. **These docs.** A spec may already rule on it. *(`data-refresh.md` already settled "how does external content enter HQ" before anyone asked the question again.)*
3. **The official docs** for the specific tool (§3).
4. **Primary web-platform sources** — MDN, web.dev (§2).
5. **Named individuals** who write at primary quality (§4).
6. **General search, last, and with suspicion** (§5).

**A method is "back-checked" when it can name the standard approach — including when we deliberately depart from it.** Departing is fine. Departing without knowing you departed is not.

---

## 2. Primary web-platform sources

**The property that makes these good: they are written by the people who ship the thing, about the actual specification, with real version numbers.** That is a different category from a tutorial *about* the thing.

| Source | Use for |
|---|---|
| **MDN** — `developer.mozilla.org` | The web-platform reference. **Check here before believing a blog post.** |
| **web.dev** — `web.dev` | Chrome team. Patterns, performance, caching, PWA. *(Source for the `stale-while-revalidate` ruling in `06-knowledge-delivery-board.md` §9b-iii.)* |
| **caniuse.com** | Support tables. Settles "can we actually use this" in one look. |
| **WHATWG / W3C specs** | Only when MDN is ambiguous. Precise, slow to read. |

---

## 3. Official docs for this stack

**Always the official docs before a third-party tutorial** — tutorials for fast-moving libraries rot within a version or two, and the agent will confidently build the old API.

`react.dev` · `vite.dev` · `supabase.com/docs` · `tailwindcss.com/docs` · `ui.shadcn.com` · `reactrouter.com` · `motion.dev` · Zustand (`pmndrs/zustand`) · `tanstack.com/docs` · `ts-fsrs`

**Supabase's docs especially** — Row Level Security is the one place in this stack where a misunderstanding is a security hole, not a bug. **Read the source, not a summary.**

---

## 4. Individuals worth trusting

| Who | For |
|---|---|
| **Jake Archibald** (`jakearchibald.com`) | Browser internals, caching, service workers. Chrome engineer. *(Source for import-vs-fetch in `06` §9b.)* |
| **Simon Willison** (`simonwillison.net`) | **The best ongoing practical writing on working with LLMs.** Documents daily, does not hype. |
| **Josh Comeau** (`joshwcomeau.com`) | CSS and layout, at depth. |
| **Dan Abramov** (`overreacted.io`) | React mental models and internals. |
| **Andrej Karpathy** | LLM fundamentals. Coined "vibe coding." |
| **Fireship** (YouTube) | **Orientation only** — "what is this and should I care." Shallow by design; never a build reference. |

---

## 5. What to distrust

**Searching "best X 2026" returns content farms.** A search run Aug 2026 for vibe-coding resources returned almost entirely SEO listicles — *"10 Best Vibe Coding Tools in 2026,"* *"8 Best Vibe Coding Tools (Tested on Real Projects)"* — written to rank, not to teach. **None of it is a reference.**

**Signals to discard on sight:**

- The current year in the title next to "best" or "top"
- Ranked tool lists with affiliate-shaped framing
- Medium posts that read as LLM-generated SEO
- Any page that explains a pattern without naming a spec, a version, or a source

**The test:** *does this cite something, or is it citing itself?*

---

## 6. What this methodology is actually called (checked Aug 2026)

**It is not "refined vibe coding." It is a named methodology that exists as a reaction to vibe coding.**

**Spec-Driven Development (SDD)** — *"an executable, version-controlled specification, not the code, is the single source of truth. First write a detailed spec describing what the system should do, then derive an implementation plan, break it into atomic tasks, and only then generate the code."* It **emerged in 2025 as a direct response to the failure mode of vibe coding** — *"agents that produce plausible code that drifts from intent, hallucinates APIs, and decays as projects scale."* DeepLearning.AI shipped a course on it in late 2025; there is a Springer book. **Mainstream, not fringe.**

**The lineage runs through engineering, not through vibe coding.** SDD is described as *"much closer to traditional engineering practices"* — design docs and specs, with an agent rather than a junior engineer as the implementer. **Vibe coding removed the spec; SDD put it back.** Karpathy coined "vibe coding" in Feb 2025; Addy Osmani's *"Vibe coding is not the same as AI-assisted engineering"* is the standard statement of the distinction.

**Context engineering** is the sibling term — *"architecting the entire information environment for an agent: not just the prompt, but memory, tools, retrieval, and state."* **This doc folder is HQ's context layer**, and `CLAUDE.md` plus `AGENT-IMPLEMENTATION-GUIDE.md` are its entry points.

**Practical consequence: search the right words.** *"Spec-driven development"* and *"context engineering"* return methodology; *"vibe coding"* returns tool listicles.

**Where HQ deviates from standard SDD, honestly.** SDD literature keeps specs **tight, executable, and atomic**. HQ's corpus is much larger — boards *and* specs *and* feature catalogs *and* mockups *and* briefs, across fifteen tabs. **That buys real traceability and costs real maintenance:** the grep step in `03-clinical-board.md` §5a exists because a corpus this size develops internal contradictions, and a meaningful share of session time goes to reconciling docs rather than advancing product. **Worth naming as a tradeoff that was chosen, not a free win.**

---

## 6a. How HQ's method compares to the field (checked Aug 2026)

**Is this common among vibe coders? No — and that is the wrong comparison group.** Vibe coding is *defined* by not writing a spec; Stack Overflow's Oct 2025 piece is titled *"Vibe coding needs a spec, too,"* which tells you the default has none. **The spec-driven crowd is a separate and fast-growing population:** GitHub's **Spec Kit** passed **111,000 stars by June 2026**, roughly doubling in six months, and **AWS's Kiro** — an IDE built entirely around specs as the unit of work — reached general availability **7 May 2026**.

**The reported delta:** early adopters of spec-driven workflows report **3–10× higher first-pass success rates** from agents on non-trivial tasks, against vibe coding's **20–30% of sprint capacity shifting to bug fixes by day 90.** Treat vendor-adjacent numbers with the §5 suspicion, but the direction is consistent everywhere.

### What the experienced practitioners converge on

| Practice | HQ's version |
|---|---|
| **Mandatory process, not suggested.** *"Suggested process is ignored; only mandatory, authoritative process actually shapes agent behavior."* | **Present.** `AGENT-IMPLEMENTATION-GUIDE.md` §0 and the per-tab `Do Not Generalize` sections are binding language, not advice |
| **Agents may not silently modify the spec.** *"Not allowed to silently modify PRDs or architecture — prevents quiet reinterpretation of goals."* | **Present.** §0: *"Never silently deviate… say so and wait"* |
| **External memory that persists across sessions** | **Present, and unusually thorough.** This folder |
| **One chunk at a time, never batched** | **Present.** §3: *"Do not batch multiple tabs in one pass"* |
| **Break into atomic, verifiable tasks** | **Partial.** Acceptance criteria exist per spec; the briefs are numbered. **But the specs are prose, not executable** |

**Four of five are already standard practice here. The gap is the fifth, and it is real:**

- **Specs are prose, not executable artifacts.** Spec Kit and Kiro make a spec *generate* the task list and tie to verification. HQ's specs are read by a human or an agent and interpreted. **That is why the grep step (`03-clinical-board.md` §5a) is manual** — nothing mechanically detects that a ruling contradicts an older sentence three files away.
- **No tooling.** HQ hand-rolls what Spec Kit does. **Spec Kit is MIT-licensed, plain Markdown in version control, and works across 30+ agents** — worth reading for *structure*, even if not adopted. It is the closest thing to a reference implementation of this workflow.

  **Its four stages map almost exactly onto what HQ already invented independently:**

  | Spec Kit | HQ's equivalent |
  |---|---|
  | `/specify` — the what and why, no technical detail | **the board + the tab spec** |
  | `/plan` — technical direction respecting architecture and constraints | **the mockup + views board** |
  | `/tasks` — break spec and plan into actionable items | **the numbered brief with its must-not list** |
  | `/implement` — the agent builds from the task list | **handing to Codex / Claude Code** |

  **The design principle behind it is the one HQ arrived at too:** decomposing into stages *"creates checkpoints where humans review and redirect."* **The difference is mechanism, not shape** — Spec Kit's stages are commands that generate artifacts; HQ's are prose written by hand.
- **Corpus size exceeds the norm**, with the maintenance cost noted in §6.

**Context for the whole field:** Stack Overflow's 2025 survey found **84% of developers use or plan to use AI tools, but only 33% trust their accuracy.** Adoption is not the bottleneck — **confidence in the output is**, which is precisely what a spec plus acceptance criteria buys.

---

## 7. Why this file exists — three misses from one session (Aug 2026)

Recorded because they share one cause: **working from a summary instead of the source.**

| Miss | What happened | The source that would have caught it |
|---|---|---|
| **Mockup quality** | Two mockups built from `CLAUDE.md`'s token prose. Wrong base hex values throughout, no glass, no inset highlight, approximated padding | **`specifications/04-visual-craft-standards.md` §10** already bans *"rows of identical icon + title + blurb cards"* — the exact defect. And `mockups/_shared/_visual-recipes.md` carries the literal values |
| **Category A/B** | Used as a *reliability* tier across two specs. It is not — it is about **what consumes the data** (app logic vs. a human) | **`implementation/knowledge-sources.md`**, cited repeatedly from memory, never opened |
| **`pickDaily`** | Nearly redesigned from scratch, and its defect described imprecisely | **The repo.** `src/lib/date.ts:55` is four lines long |

**All three were available locally. None required the internet.** Hence the ladder in §1 starting with the repo.

### 7b. The recurring one: building rules that decide for the user

**Three times in one session I wrote a rule that removed a student's option, each with a principled-sounding justification, and Andy overturned all three.**

| Pillar | The rule | The justification | Verdict |
|---|---|---|---|
| Shadowing | Sufficiency call — HQ announces you are done | *"Low hours are the correct outcome"* | *"Why are you trying to put caps?"* |
| Shadowing | No hour targets | *"The correct end state is stop"* | Premise deleted |
| Extracurriculars | No hour targets | *"You cannot aim at a byproduct"* | **Coherent, still not my call** |

**The tell is that each argument got better.** The third one was genuinely sound reasoning — and **the soundness of the argument was not the problem.** The problem was that the conclusion belonged to the user.

**The distinction to hold onto** (now a standing principle in `tabs/07-extracurriculars-board.md`):

- **HQ may decline to ASSERT** something it cannot source — *"40 hours is enough"* — **that is honest restraint.**
- **HQ may not WITHHOLD a capability** because it judges the student should not want it — **that is paternalism wearing restraint's clothes.**

**Practical check before writing any rule that starts "the app should not let the student…":** *am I protecting them from a claim I cannot back, or from a choice I disagree with?* **Only the first is mine to make.**

### 7a. The fourth miss, and the one worth remembering

**Three mockups were rejected in a row for "doesn't obey my design specifications." The cause was reading §10 of `04-visual-craft-standards.md` and stopping.** §10 is the anti-pattern list — it tells you what *not* to do. **§0c is the LOCKED design north star, and it tells you what the app actually looks like.** I never opened it.

**What §0c says, and what I built instead:**

| `04` §0c / §0 says | What I drew |
|---|---|
| *"Themed banner behind the top of each surface… **every tab gets a banner hero**, not just Overview"* | **No banner at all.** Bare cards floating in a grid |
| *"Glassmorphic cards (the signature)… they **float** over the banner — dimensional, **never flat opaque boxes**"* | Flat opaque boxes |
| *"The target is a **hybrid: modern polish + layered depth + bold Baloo, kept clean** — **not flat minimalism**. 'Make it flat/plain' is a **defect**, not the goal"* | Flat minimalism, three times |
| *"**Motion (nothing static)** — the app never *feels* flat, just as it never *looks* flat"* | Static |
| **21st.dev** named as the source for the modern half, hybridised to the PMH palette | Never looked at it |

**The specific misreading:** `04` §0 directive 1 is *"restraint over clutter — not restraint over richness,"* and it scopes restraint to **content clutter and metaphor only.** I applied it to depth, colour, and weight, which the same sentence explicitly forbids.

**Standing rule that follows: read `04-visual-craft-standards.md` in full — §0, §0a, §0b, §0c before §10 — plus `_shared/_visual-recipes.md` and the approved reference for that surface. Every time, before drawing anything.** §10 without §0c produces something that breaks no rules and looks like nothing.
