# How to put Premed OS live (GitHub Pages, free)

Your live URL will be: **https://sasquach67.github.io/Premed-HQ/**

## One-time setup (about 5 minutes)

### Step 1 — Put these files into your repo

On your computer, in Terminal:

```bash
# 1. Get a fresh copy of your repo
git clone https://github.com/sasquach67/Premed-OS.git
cd Premed-OS

# 2. Unzip the deploy package Claude gave you INTO this folder,
#    so that src/, public/, index.html, package.json, .github/, etc.
#    all sit at the top level of the repo (next to READ-ME-FIRST.md).

# 3. Commit and push
git add -A
git commit -m "Deploy app to GitHub Pages (beta)"
git push
```

Tip: if unzipping in Finder gives you a folder called `deploy-package`,
drag everything *inside* that folder into the repo folder — the files
themselves need to be at the repo root, not nested in a subfolder.
Note: `.github` and `.gitignore` start with a dot so Finder hides them —
press Cmd+Shift+. to show hidden files before dragging.

### Step 2 — Turn on GitHub Pages

1. Go to https://github.com/sasquach67/Premed-OS/settings/pages
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. Go to the **Actions** tab of the repo — you should see a
   "Deploy to GitHub Pages" workflow running (or click "Run workflow" to start it)
4. When it goes green (~2 min), your site is live at
   **https://sasquach67.github.io/Premed-HQ/**

That's it. From now on, **every push to `main` auto-redeploys the site.**

## How user data works (the "cookies" question)

- The app has **no server and no accounts**. Each person's data is saved
  automatically in **their own browser's localStorage** — it survives closing
  the tab, restarting the browser, bookmarking in Arc, etc.
- That means: your data and a tester's data never mix. Everyone starts from
  the seeded demo plan and edits their own copy.
- Caveats to tell your testers:
  - Data is **per browser, per device** (laptop Chrome ≠ laptop Arc ≠ phone).
  - Clearing browsing data / site data wipes it. Use **Settings → Export JSON**
    for a manual backup, or set up the Google Drive backup.
  - Private/incognito windows won't keep data.

## Optional: Google Drive backup for testers

Drive backup needs a Google OAuth Client ID (see the app README.md, "Google
Drive backup" section). One extra step now that the site is hosted: in the
Google Cloud Console credentials, add
`https://sasquach67.github.io` under **Authorized JavaScript origins**.
While the OAuth consent screen is in "Testing" mode, only emails you add as
**Test users** can connect Drive — fine for a beta.

## Updating the site later

Edit code → `git add -A && git commit -m "..." && git push` — the site
redeploys itself. No manual build needed.

## If you ever outgrow GitHub Pages

Netlify or Vercel are also free and give you a nicer URL (e.g.
`premedhq.netlify.app`). If you switch, change `base: '/Premed-HQ/'` back to
`base: '/'` in `vite.config.ts`.
