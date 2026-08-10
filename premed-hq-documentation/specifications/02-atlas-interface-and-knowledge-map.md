# 02 — Atlas Interface and Knowledge Map

**Status:** Partial — key decisions locked (July 2026); full tab spec still to be written.
**Depends on:** `00-product-shell.md`, `03-overview.md`, `architecture/02-global-intelligence-framework.md`, Atlas repo (`sasquach67/Atlas`)

## Purpose

Atlas is the knowledge brain; Premed HQ is the operating system on top of it. Atlas ingests external pre-med knowledge (AAMC, MCAT resources, practicing doctors, current pre-meds, social media, forums) and structures it as a connected, source-cited graph. HQ surfaces that knowledge as advice and recommendations. This spec defines the four Atlas surfaces and how they mount into HQ without Atlas becoming the center of navigation.

## Locked decisions (July 2026)

1. **Atlas is a sidebar tab** in its own group near the bottom (`00-product-shell` §2.1). It owns `/atlas/*`. It is a destination, not the nav center — Overview stays home.
2. **Two graphs, cross-linked, not fused:**
   - **External knowledge graph** — sourced claims across the 20 pre-med pillars (already built in the Atlas repo via `@xyflow/react`).
   - **Personal idea graph** — the user's own captured thoughts, as a mind-map.
   - **Model: separate global graphs, fused local neighborhoods.** At rest each graph is its own clean space. Focusing a single node and expanding connections assembles a *local* neighborhood that pulls in linked external knowledge and the user's own HQ records — typed/colored distinctly. Never render everything fused at once. (Mirrors `architecture/02` context assembly.)
3. **Trust separation is structural.** External claims (cited, authoritative, fresh) and personal ideas (unverified) are distinct node/entity types from creation and must always be visibly distinguishable. HQ records are a third type. This prevents opinion from rendering as cited fact (`architecture/02` citation/traceability).
4. **Overview feeds Atlas; the Atlas tab works Atlas.** Quick Capture on Overview (`03-overview` §6.9) is the only Atlas touchpoint on Home — capture only, no triage. Triage, promotion, graph exploration all live in the tab.
5. **The Premed roadmap is a timeline-lens over the branching graph.** The roadmap (`03-overview` §6.7) is linear on the surface (a pacing spine) but branches Obsidian-style on dive-in. Those branches are the local-neighborhood pattern applied to milestones: sub-steps + linked external knowledge + the user's HQ records. The roadmap therefore shares Atlas's graph substrate — it is a time-ordered projection of a slice of the knowledge-and-action network, and its milestone content/timing is Atlas-grounded (phased). Node types keep the same trust separation (milestone/sub-step vs. sourced knowledge vs. personal record).

## The four surfaces

1. **Atlas Workspace** — the tab: external knowledge graph, personal idea graph, imported resources, idea triage (promote to Task / Story / Experience-lead / keep-as-note, with provenance), conversations, deep reasoning, cited guide synthesis.
2. **Atlas Assistant** — context-aware right drawer from the top bar (reserved slot, not built; `00-product-shell` §7.8).
3. **Atlas Import** — ingestion of external sources (URLs, PDFs, images, audio/video, documents). Entry point lives in Overview Quick Capture; full pipeline (transcript → claim extraction → review → graph) in the tab.
4. **Atlas Intelligence** — invisible: recommendations, inline suggestions, smart defaults, warnings across HQ (e.g., Overview Smart Next Actions). No chrome, no "AI" ornamentation.

## 5. Conversation capture — the coffee chat (added July 2026) ⭐

A specific, high-value instance of **Atlas Import** (surface 3). A student talks to an upperclassman, an advisor, an M1, or a physician and receives twenty minutes of concrete advice — then forgets most of it by the weekend. **This is the single richest pre-med information source that currently has no capture path anywhere.**

### The pipeline

Record or upload → transcribe → **extract advice as discrete claims** → review → into the graph as personal-source nodes.

### Capture paths — and the one HQ cannot do (important)

**A browser can capture the microphone. It cannot capture system audio** — the other person's voice coming out of the speakers on a Zoom, Meet, or FaceTime call. That requires OS-level capture, which is why tools like Granola ship as desktop apps. **HQ is a static web app and cannot replicate this. Do not attempt it.**

So there are three paths, and **upload is the primary one**, not the fallback — many of these conversations are remote:

| Situation | Path |
|---|---|
| **In person** (coffee chat, advisor office, lab) | **Live mic capture.** One device on the table picks up both people. Fully supported. |
| **Video call** (Zoom, Meet, Teams) | **Use the platform's own recording, then upload the file.** Every major platform records with host permission. HQ processes the upload identically. |
| **Phone call** | Phone voice memo → upload. |
| **Any of the above, no recording** | **Notes-only** — dictate or type from memory afterward. Same claim-extraction pipeline, lower fidelity. |

**Build upload first.** Live mic capture reuses the recall runner and is nearly free, but **the upload path is what covers the remote case**, and the remote case is common. Accept the formats those platforms actually produce (`m4a`, `mp3`, `wav`, `mp4`).

**The recording was never the valuable part.** Structuring the conversation into routed, attributed claims is — and that half works identically no matter how the audio was obtained.

**Extract claims, never a summary.** A summary is unusable three months later; a claim is actionable and routable. Each captured claim carries:

- **What was said**, in their words where possible
- **Who said it** — linked to a `Person` record, with the context that determines its weight: *M2 at UNC · matriculated 2025 · applied with 512/3.8 · took two gap years*
- **When**, because admissions advice ages
- **Which pillar it's about** — routed to Letters, Research, Clinical, School List, etc.

### Trust — the rule that makes this safe

Captured advice is **`personal-source`: a third node type**, distinct from both Atlas's cited external claims and the user's own ideas (§ locked decision 3). It must be **visibly distinguishable everywhere it appears.**

- **It is n = 1.** One upperclassman's experience is one data point, not consensus, and the UI must never let it read as more. *"One person told you this"* is the honest framing — Category B at its weakest, per `implementation/knowledge-sources.md`.
- **Surface conflicts, don't resolve them.** When captured advice contradicts Atlas consensus, **show both with their sources** and let the student weigh it. Someone who got in with 400 clinical hours is real evidence *and* a survivor-bias sample; the app's job is to present that tension, not flatten it.
- **Corroboration is the signal worth showing:** *"Three separate people have now told you the same thing about UNC's committee letter."* That is genuinely stronger than any single conversation, and it's the thing a student cannot notice unaided.
- **Never promote a captured claim to cited-fact status.** No path exists from `personal-source` to external-knowledge node.

### Consent — a hard requirement, not a nicety

**Recording another person requires their consent.** North Carolina is one-party consent, but that is a legal floor, not the standard here — and these are people the student wants a letter from.

- The app **prompts to ask before recording starts**, every time, with suggested wording. Not a checkbox buried in settings.
- **Notes-only mode is first-class** — type or dictate afterward from memory, no recording at all. Many of these conversations shouldn't be recorded, and that path must not feel like the degraded one.
- Recordings are **local by default**; nothing uploads without an explicit action.
- **One-tap delete of the audio while keeping the extracted claims.**

### On Granola specifically — evaluated, not adopted

Granola's public API is real (`public-api.granola.ai/v1`, bearer key, notes + transcripts + summaries), but **API key creation requires a Business plan at $14/user/month**; the free tier caps at roughly 25 meetings and has no API access. **That makes it unusable as a product dependency for a free student app** — it would gate a core feature behind a paid third-party subscription.

- **Build capture natively — it is three commodity pieces, two of which already exist.** (1) Audio in: browser `MediaRecorder` for in-person, file upload for everything else. (2) Transcription: a swappable paid API, behind the same provider-agnostic seam as the LLM. (3) Claim extraction: schema-constrained JSON from the existing model layer (`01` §6.3). **Nothing here is proprietary to Granola and nothing here is a new system.**
- **What is genuinely not replicable is system-audio capture from a live video call** — a desktop-app capability, and the real reason Granola ships as one. HQ's answer is the upload path above, not an attempt to match it.
- **Optional import, never a dependency.** If a user happens to have Granola, allow importing a note by ID. Everything works fully without it.
- The rejection is about **plan gating and dependency risk**, not product quality. Re-evaluate only if API access reaches the free tier.

### Other uses of the same pipeline

Once conversation capture exists, it costs almost nothing to point it at: **advisor meetings** (what your pre-health advisor actually said, dated), **shadowing debriefs** (dictated in the car afterward, when detail is still fresh — feeds Shadowing reflections and Essays), **research-lab meetings** (what your PI asked you to do), **interview debriefs** later in the cycle, and **info sessions**. All the same pipeline: audio → claims → routed with provenance.

## Still to write

- Workspace tab layout (dual-graph canvas, claim browser, sources, guides)
- Idea triage UX in the tab (the sorting surface; promotion + provenance mechanics)
- Local-neighborhood "expand connections" interaction and node-type visual language
- Assistant drawer (context assembly, conversation, permitted actions)
- Import pipeline UX end to end
- Integration architecture (embedded vs. linked vs. merged codebase; HQ↔Atlas data flow that lights up Overview's reserved connection slot)
- Privacy/grounding rules (source hierarchy per `architecture/02`)
- Acceptance criteria

## Do not

Do not fuse the personal and external graphs into one undifferentiated space. Do not put triage or graph exploration on Overview. Do not add Atlas chrome to the shell beyond the surfaces above.

Do not let a captured conversation claim render as a cited fact, and do not build a promotion path from `personal-source` to the external knowledge graph. Do not make Granola — or any paid third-party account — a dependency for conversation capture. Do not start a recording without an explicit consent prompt.
