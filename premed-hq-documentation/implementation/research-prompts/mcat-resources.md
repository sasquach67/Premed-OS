# Research prompt — `data/mcat-resources.json` (Category B, opinionated)

Paste into ChatGPT (deep-research / web mode). This produces a **community-consensus** guide to MCAT resources, to cross-reference against Claude's version. Unlike the requirements/MCAT-structure datasets, this is **opinion, not fact** — capture the debate, don't resolve it.

---

You are researching the **community consensus** on MCAT study resources for a pre-med app. This is **opinionated data**, not factual reference data — your job is to report *what the MCAT community thinks*, with disagreements intact, each claim tied to a source. Do **not** present opinions as settled fact, and do **not** invent a numeric "confidence."

**Source priority (this is community wisdom, so weight community sources highest):**
1. **Reddit — r/MCAT is the single most important source** (threads, the wiki, "what worked for me / X-scorer" posts, resource debates). Weight it heavily.
2. Student Doctor Network (SDN) forums.
3. YouTube (MCAT creators/tutors), reputable prep blogs, tutor writeups.
Cite the specific source for each resource's claims.

**Context (what we've already established — align to this so outputs cross-reference):**
- Consensus study model: MCAT prep is two repeating phases — **content review** and **practice questions**; most high scorers use only **3–5 core resources**.
- Known near-universal picks: **AAMC official materials** (most representative; consensus is to do them all and often "double" them), **UWorld QBank**, the **Anki 'holy trinity'** (MilesDown, JackSparrow, Mr. Pankow), **Khan Academy + the ~300-page Psych/Soc doc**.
- Known debates: **Jack Westin CARS** is popular for free volume but widely seen as **not representative** — its reasoning/inference runs too far, whereas **AAMC CARS** leans on the author's belief/intent and analogy. **Kaplan books** are gray-area content review. **Third-party full-lengths** (Blueprint/Altius/Kaplan) run harder/less representative than AAMC.

**For each resource capture:**
- `consensusTier`: `near-universal` | `widely-used-debated` | `niche`
- `purpose`: any of content-review / practice / cars / full-length / spaced-repetition / meta
- `cost`: free | paid
- `championedBy`: who recommends it and why (one line)
- `critique`: who skips/dislikes it and why (one line) — **both sides required for debated items**
- `communityNote`: any consensus phrasing (e.g. "AAMC FLs are the truth")
- `communitySources`: cited (Reddit thread/wiki, SDN, YouTube, etc.)

Cover: content-review books (Kaplan, Princeton, ExamKrackers, UWorld textbook), QBanks (UWorld, AAMC, third-party), CARS (Jack Westin, AAMC CARS QP, EK 101, Testing Solutions), Anki decks (MilesDown, JackSparrow, Pankow, AnKing), full-lengths (AAMC, Blueprint, Altius, Kaplan), free resources (Khan Academy, the 300-page doc, r/MCAT wiki, popular study schedules), and anything else the community rates.

**Output — return ONLY this JSON:**

```json
{
  "meta": {
    "category": "B — opinionated community consensus (not factual)",
    "retrievedAt": "YYYY-MM-DD",
    "sources": ["https://www.reddit.com/r/Mcat/", "..."],
    "trustRule": "Community consensus with the debate intact; never presented as fact."
  },
  "resources": [
    {
      "id": "uworld",
      "name": "UWorld MCAT QBank",
      "purpose": ["practice"],
      "cost": "paid",
      "consensusTier": "near-universal",
      "championedBy": "…",
      "critique": "…",
      "communityNote": "…",
      "communitySources": ["https://www.reddit.com/r/Mcat/…"]
    }
  ]
}
```

Rules: Reddit-weighted; cite sources; capture both sides for anything debated; valid JSON only; don't fabricate a resource or a source URL.

---

**After it returns:** send it to Claude. We'll cross-reference against `data/mcat-resources.json` (Claude's version) — agreements strengthen the tiers, disagreements get surfaced (like the UNC gen-ed vs. med-schools comparison). Because this is opinion, divergence is expected and useful.
