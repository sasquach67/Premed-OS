# Premed OS — review bundle

This bundle has the **app** and the **spec it was built against**, so a reviewer can judge
the build against the requirements.

```
premedos/        the app — React + TS + Vite + Tailwind v4 + shadcn-style (Radix) + Recharts + dnd-kit + Zustand
  README.md       how to run/host + Google OAuth setup + architecture map
  src/            all the code (start at App.tsx → pages/ → components/)
spec/
  premed-dashboard-brief.md            the full spec. ** §15 is the highest-priority design direction **
  guides/UI_UX_Frontend_Features_Master_Guide.pdf   canonical 23-category UI/UX glossary
  rpremed-wiki-link-index.md           community source links
  references/                          visual targets (medcoach.png = primary look/structure model)
```

## To run the app
```bash
cd premedos
npm install
npm run dev      # then open the printed localhost URL
```
(`node_modules` and the `dist/` build were excluded to keep this small — `npm install` restores them.)

## What to focus a review on
- Does it satisfy **§15** (interactive, not a flat box grid; no Notion-clone feel; functionality over decoration)?
- The non-negotiables: AMCAS GPA engine, detailed tracker tables w/ rings, localStorage autosave + Drive backup,
  categorized clickable resources, embedded docs, visual timeline, the speech-bubble mascot, ⌘K search.
- Known open item: the ram mascot is a placeholder **SVG** (`src/components/mascot/Ram.tsx`); final art is meant
  to be an image-model Ghibli ram from Andy's reference pics (swap = one line, see premedos/README.md).
