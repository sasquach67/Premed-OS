# Rename — everything OUTSIDE the repo

**The in-repo sweep is done** (323 display strings, Aug 2026 — see `general.md` §Rename). **None of the items below are in git**, so nothing in the codebase will remind you they exist.

**Andy: *"is there any other place that i may want to rename it? google, supabase, github?"*** Yes — and three of them can break the running app.

---

## ⚠️ Order matters. Read this first.

**GitHub, Supabase and Google are chained.** Renaming the GitHub repo changes the deployed URL, which invalidates the redirect allowlists in both Supabase and Google.

> **Rename the repo and you break sign-in until you have updated both — and the failure is at the last step of the auth flow, after the user has already clicked the magic link.**

**Correct order:**

1. Add the **new** URLs to Supabase and Google **while the old ones still work** (both accept multiple entries)
2. Rename the GitHub repo
3. Update `vite.config.ts` `base` and redeploy
4. Verify sign-in end to end
5. **Only then** remove the old URLs

**Do not do step 2 first.**

---

## 1 · GitHub — ⚠️ the one that breaks things

| Item | Where | Risk |
|---|---|---|
| **Repo name** `Premed-HQ` → `Premed-OS` | Settings → General | **HIGH** |
| **`vite.config.ts` `base: '/Premed-HQ/'`** | in repo | **Must change in the same breath.** It was deliberately left out of the sweep |
| Repo description, topics, social preview image | Settings | Cosmetic — use `premedos-lockup.png` for the social preview |

**What actually happens:** the Pages URL becomes `sasquach67.github.io/Premed-OS/`. GitHub redirects the *repo* URL, **but the Pages path changes**, and every asset is requested from the old base until `vite.config.ts` matches. **The site loads as an unstyled white page** — HTML resolves, CSS and JS 404.

**Your local remote also needs updating:** `git remote set-url origin <new-url>`.

**⚠️ Anyone with the old link keeps it working** *(GitHub redirects)*, **but a bookmarked Pages URL does not.** With users, that matters. With five beta testers, it does not — **which is an argument for doing this now rather than later.**

---

## 2 · Supabase — ⚠️ auth breaks silently

| Item | Where | Risk |
|---|---|---|
| **Redirect / Site URLs** | Auth → URL Configuration | **HIGH — only if the Pages URL changes** |
| **Email templates** | Auth → Email Templates | **MEDIUM.** They almost certainly still say "Premed HQ" |
| **Sender name** | Auth → SMTP / project settings | The name in the inbox |
| Project name | Settings → General | Cosmetic, dashboard only |
| Database, tables, keys | — | **Do not touch.** Nothing here is user-visible |

**The email templates are the highest-value item and the easiest to forget.** A magic-link email is the *only* thing HQ ever sends. If it says "Premed HQ" while the site says "Premed OS", the user reasonably wonders whether the email is a phish.

> ⚠️ **While you are in there:** `P1` §2 requires auth to be **enumeration-safe** and to **never email anything sensitive.** Editing templates is the moment that gets broken by accident. **Change the name, nothing else.**

---

## 3 · Google Cloud — ⚠️ users see this one

| Item | Where | Risk |
|---|---|---|
| **OAuth consent screen — App name** | APIs & Services → OAuth consent screen | **HIGH visibility** |
| **Authorized JavaScript origins / redirect URIs** | Credentials → your OAuth client | **HIGH — only if the Pages URL changes** |
| App logo on the consent screen | OAuth consent screen | Use `favicon-512.png` |
| Support email, homepage link | OAuth consent screen | |
| Project name | Dashboard | Cosmetic |

**The consent screen app name is the single most public string outside the site itself.** It is what the browser shows in *"Sign in to continue to ___"*. If it still says Premed HQ, that dialog is the one moment a user is being asked to trust you, reading a name that does not match the site.

⚠️ **Changing the app name or logo can re-trigger Google verification** if the app is published. Check before, not after.

⚠️ **`VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_API_KEY` do not change.** Renaming the project does not reissue credentials.

---

## 4 · Everything else

| Item | Note |
|---|---|
| **Domain**, if you buy one | The real fix for all of the above — a custom domain makes the Pages path irrelevant and survives future renames. **`05` §10's trademark/domain check is still open and blocks publishing** |
| **`index.html` title + favicon** | In repo, **handled by `P2` §4b** — the favicon is currently the ram, which `05` §6.1 forbids |
| **`og:image` / link preview** | `P2` §4b |
| **`package.json` name** | Left deliberately. Cosmetic; drags `package-lock.json` |
| **`premed-hq-documentation/` folder** | Left deliberately. Renaming it touches every doc path and `CLAUDE.md` |
| **Support email** | `elephon08@gmail.com` — a personal Gmail is the sender for a product called an OS. **Worth its own decision**, separate from the rename |
| **App Store / socials / anything registered under the old name** | None known — confirm |

---

## The honest summary

**Only three items can actually break something, and all three are the same failure:** a URL allowlist that no longer matches the deployed URL.

**If you never rename the GitHub repo, none of that risk exists** — the Pages URL stays put, Supabase and Google keep working, and the rename is purely cosmetic. `Premed-HQ` in a URL path nobody reads is a low price for zero breakage.

> **The three genuinely worth doing regardless of the repo:** the **Supabase email templates**, the **Google consent-screen app name**, and the **favicon** (which is a `05` §6.1 defect, not a rename issue). **All three are things a user reads, and none of them requires touching a URL.**
