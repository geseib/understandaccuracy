# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the built `dist/`

There are no tests, linter, or typecheck configured.

## Deployment & base path

The app deploys two ways, and `vite.config.js` switches `base` accordingly:
- **Vercel** (`VERCEL` env var set): served at root `/` (see `vercel.json`).
- **GitHub Pages** (default/local build): served under `/understandaccuracy/`.

Keep asset references base-relative so both targets work.

## Architecture

A single-page React 19 app (no router) that teaches statistics concepts through
hand-drawn "whiteboard" visualizations. `App.jsx` holds a `useState` page switch
between two self-contained pages; navigation is plain tab buttons.

- **`pages/AccuracyPage.jsx`** — confusion-matrix explorer for accuracy /
  precision / recall / F1. The single source of truth is the `cells` state
  `{tp, fp, fn, tn}`; everything else is derived. Three ways to mutate it, all
  funneling back into `cells`:
  - editing any count directly (`onCellChange`),
  - changing population totals (`redistribute` preserves the current model's
    implied recall/false-positive rates across the new totals),
  - picking a named model behavior or a one-click "extreme" (`applyModel`).
- **`pages/FoldPage.jsx`** — exponential-growth demo (folding paper to the Moon).

### Core domain logic lives in plain JS modules, not components

- **`src/metrics.js`** — all confusion-matrix math and copy: `computeMetrics`,
  `applyModel` (rates → counts), `redistribute` (re-scale to new totals while
  preserving behavior), plus the `METRIC_DEFS`, `MODELS`, `POPULATIONS`, and
  `EXTREMES` data tables that drive the UI. Shared colors (`INK`, `MARKER_BLUE`,
  `BOARD_BG`) and `CELL_META` also originate here.
- **`src/folding.js`** — exponential-growth math (`thickness`, log-axis helpers,
  `foldsToReach`) and the `LANDMARKS` / `MILESTONES` / `QUIZ` data.

When changing behavior, edit the data tables and pure functions in these
modules; components are mostly presentation over their output.

### The hand-drawn look

- **`src/sketch.js`** — SVG path generators (`roughLinePath`, `roughRectPath`,
  `roughBracketPath`, `sketchBoxStyle`) that fake marker strokes. Jitter is
  **seeded** (`mulberry32` + `hashSeed`) so re-renders while typing don't make
  strokes shimmer — preserve this determinism when adding wobble.
- **`src/styles/global.js`** — exports `ALL_CSS`, injected once via a `<style>`
  tag in `App.jsx`. Most layout is inline styles; this holds the shared classes
  (e.g. `.sketch-btn`). Fonts (Caveat, Patrick Hand) load from Google Fonts in
  `index.html`.

### Conventions worth matching

- `LINE_ORDER = ['fn','tp','fp','tn']` is intentional: it makes "truly positive"
  (fn+tp) and "predicted positive" (tp+fp) each contiguous on the population
  line, overlapping exactly on tp. Don't reorder casually.
- Metric functions return `null` for undefined cases (e.g. precision with no
  predicted positives); `formatPct` renders `null` as `—`. Preserve this rather
  than returning `0` or `NaN`.
