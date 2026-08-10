# P1 — the paste-in build prompt

**Copy everything inside the fence into Claude Code or Codex, verbatim.** Nothing else needs to be said first.

The prompt is short on purpose. `P1-public-landing-auth.md` carries the detail; repeating it here would create a second source of truth that drifts.

---

```
GATE — do this before anything else.
Read premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md.
Build ONLY mockups whose Build? column reads YES. If a mockup named in this
prompt is NO, or is absent from the manifest, skip it and say so in your
summary. Do not build it "since it's approved" — the header status in a
mockup file is not permission. Do not edit the manifest yourself.
If zero rows relevant to this prompt are YES, stop and report that.

TASK

Build the public layer of Premed OS: the landing page, authentication, the
local→account merge screen, and the four doc pages (About, Privacy, Terms,
Pricing). Seven routes, none of which exist yet.

Read premed-hq-documentation/implementation/briefs/P1-public-landing-auth.md
in full and follow it. It is the brief for this chunk. Read only that file
plus the references listed in its §8 — do not go reading the wider docs
folder. If something you need is not in the brief, read the named spec
section, do the work, and tell me the brief was incomplete.

THE FIVE THINGS MOST LIKELY TO GO WRONG HERE

1. Signed-out mode must stay fully functional. This chunk adds a front
   door, not a gate. If any existing surface starts requiring an account,
   that is a regression, not a feature.

2. Four house rules are broken on purpose on these routes only — pill
   buttons, a floating pill nav, a headline above the in-app type scale,
   and glass on every floating hero surface. They are listed in the
   brief's §3. If any of them appears on an in-app screen, that is a
   defect. Grep and prove it did not leak before you report done.

3. No new dependencies. The mockups' effects are CSS and inline SVG
   filters. @paper-design/shaders-react and framer-motion appear in the
   design references this was built from and were deliberately rejected.
   Do not install them. Do not install anything else either — flag first.

4. The merge screen can destroy someone's work. Local data survives until
   the server confirms the write. Upload is the default. A non-empty
   account gets a change-by-change review, never an overwrite, never
   "last write wins".

5. Auth must be enumeration-safe and rate-limited, and no auth email may
   ever contain grades, scores, coursework, or record counts.

BUILD IT AS COMPONENTS, NOT PAGES

PublicHeadline, PublicNav, PublicFooter and GlassSurface are each ONE
component used across all seven routes. The mockups contain duplicates of
the headline recipe and they already drifted once — do not reproduce that
in the app. About passes a larger size to PublicHeadline as a prop, not as
a fork.

WHAT NOT TO SHIP

Do not point a public domain at Privacy, Terms or About. Those pages are
cleared to BUILD, not to PUBLISH — the age floor, governing law, and a
trademark check are still open (05-public-and-account.md §10). Build the
routes; leave them unlinked from any production domain and say in your
summary that you did.

WHEN YOU ARE DONE

Work through the brief's §10 "Done when" checklist and answer every line.
npm run build must pass. Then commit before reporting:

  feat(public): landing, auth, merge, and the public doc pages

If unrelated changes are already sitting in the working tree, commit them
separately with their own message. Never bundle them into this chunk.

REPORT

A diff summary, plus these greps:
  - no "Sign up" string anywhere in the route group
  - no emoji anywhere in the route group
  - no pill radius and no oversized headline outside / and /auth*
  - no ram or Rameses imagery anywhere in the public layer
```

---

## Why the prompt says what it says

| Line | Reason it is there |
|---|---|
| The gate paragraph | `BUILD-MANIFEST.md` is the only authority on what may be built, and a mockup's own `APPROVED` header has been mistaken for permission before |
| "read only that file plus §8" | Briefs are self-contained chunks; a wide read is how context gets burned and unrelated things get "fixed" |
| "flag first" on dependencies | `CLAUDE.md` standing rule, and the two named packages are in the design references an agent would otherwise follow |
| The four-departures grep | Four scoped exceptions in one place is exactly how a design system ends up with two answers for every question |
| The ram grep | `05` §6.1 forbids ram imagery and root `CLAUDE.md` still carries a stale line saying the opposite. **Until that line is struck at the source, an agent reading `CLAUDE.md` will get this wrong** |
| "build, not publish" | Three legal items are open and the pages print the product name as a settled brand |

## Still open, and none of it blocks this build

- **Root `CLAUDE.md`'s "Ram mascot" line is stale** and contradicts `05` §6.1. The grep above catches the symptom; striking the line fixes the cause.
- **Age floor, governing law, trademark and domain check** (`05` §10).
- **Privacy and Terms prose** is specified, structured, and summarised in plain English — but the legal text underneath is not written. The pages build fine without it; they cannot publish without it.
