# Claude Code Handoff: Premed OS

Read this before making changes.

## Current Repo Reality

The GitHub-connected repo is:

```bash
/Users/andyquach/Documents/premed-hq-review
```

Remote:

```bash
origin https://github.com/sasquach67/Premed-OS.git
```

Latest pushed commit on `main`:

```text
e26c126 Update root build to latest dashboard
```

That commit was pushed because the deployed GitHub version was stale.

## Important Folder Warning

There are two app copies:

1. Root app in `/Users/andyquach/Documents/premed-hq-review`
2. Nested app in `/Users/andyquach/Documents/premed-hq-review/premed-hq`

The nested `premedos` folder has its own local `.git`, but it is not the GitHub-connected repo.

For deployment, the root app is now the important source because the existing GitHub Pages workflow runs:

```bash
npm ci
npm run build
```

from the repo root and uploads:

```bash
dist
```

Do not assume changes made only inside nested `premedos/` will deploy. If you edit the nested copy, mirror the change to the root app or update the deployment strategy intentionally.

## What Was Just Fixed

The latest dashboard source was copied into the repo root and pushed so GitHub Pages can build the current version.

Root build was verified locally:

```bash
npm run build
```

It passed.

## Current Untracked Local Stuff

These are local artifacts and should not be blindly committed:

```text
assignments-course-select-wrap-qa.jpg
hero-left-aligned-qa.jpg
hero-mascot-repositioned-qa.jpg
hero-schedule-desktop-qa.jpg
hero-schedule-minimal-qa.jpg
hero-schedule-mobile-qa.jpg
hero-timeline-minimal-white-qa.jpg
hero-timeline-reference-style-qa.jpg
premedos/.claude/
spec/unc_schedule_options_no_8am.png
```

## User Preferences

- Keep the original Premed OS fonts unless explicitly asked.
- Keep updating the existing export zip when relevant:

```bash
/Users/andyquach/Documents/premed-hq-review/spec/premed-hq-dashboard-versioned-v0.1.0.zip
```

- Do not create new export zips unless requested.
- Do not commit unrelated screenshots or `.DS_Store`.
- Avoid touching GitHub workflow files unless the token has `workflow` scope or the user explicitly approves that route.

## Before Changing Anything

Run:

```bash
git status --short --branch
git log --oneline --decorate -6
git remote -v
npm run build
```

If working on deploy correctness, also verify:

```bash
git ls-remote origin refs/heads/main
```

## Suggested Message To User If Confused

The stale GitHub deployment happened because the newest app lived in a nested local repo while GitHub was connected to the parent repo. The current fix is to keep the root repo buildable and deployable, with latest app source pushed to `origin/main`.
