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
over a data-driven `PAGES` registry — each entry is `{ key, tab, title, Component }`,
the nav renders one tab button per entry, and the body renders `<active.Component/>`.
Adding an explainer is one import + one registry line; pages never import each other.

- **`pages/AccuracyPage.jsx`** — confusion-matrix explorer for accuracy /
  precision / recall / F1. The single source of truth is the `cells` state
  `{tp, fp, fn, tn}`; everything else is derived. Three ways to mutate it, all
  funneling back into `cells`:
  - editing any count directly (`onCellChange`),
  - changing population totals (`redistribute` preserves the current model's
    implied recall/false-positive rates across the new totals),
  - picking a named model behavior or a one-click "extreme" (`applyModel`).
- **`pages/PositiveTestPage.jsx`** — Bayes / base-rate flip of the accuracy page:
  `P(sick | positive)` from prevalence + sensitivity + specificity over a fixed
  10,000-person population, with a "keep only the positives" collapse bar.
- **`pages/MontyHallPage.jsx`** — the switch-wins-⅔ door game, a 1,000-game
  tally-mark simulator, and a three-branch explainer tree. The car/goat are
  hand-drawn SVG built from the `sketch.js` helpers, inline in the page.
- **`pages/FoldPage.jsx`** — exponential-growth demo (folding paper to the Moon).
- **`pages/BirthdayPage.jsx`** — shared-birthday probability with a live
  twelve-month calendar, collision highlighting, a pairs counter, and a
  Monte-Carlo "run 1,000 rooms" check.

### Core domain logic lives in plain JS modules, not components

- **`src/metrics.js`** — all confusion-matrix math and copy: `computeMetrics`,
  `applyModel` (rates → counts), `redistribute` (re-scale to new totals while
  preserving behavior), plus the `METRIC_DEFS`, `MODELS`, `POPULATIONS`, and
  `EXTREMES` data tables that drive the UI. Shared colors (`INK`, `MARKER_BLUE`,
  `BOARD_BG`) and `CELL_META` also originate here.
- **`src/folding.js`** — exponential-growth math (`thickness`, log-axis helpers,
  `foldsToReach`) and the `LANDMARKS` / `MILESTONES` / `QUIZ` data.
- **`src/positivetest.js`** — `compute({prevalence, sensitivity, specificity})`
  returning the counts plus `pSickGivenPositive` (`null` when there are no
  positives, never `0`/`NaN`), with the prevalence presets and copy tables.
- **`src/montyhall.js`** — `playRound` / `simulate` game logic and a
  self-contained seeded RNG (`mulberry32`); ratios return `null` when undefined.
- **`src/birthday.js`** — `birthdayProb`, `pairsCount`, `simulateRooms`, and its
  own seeded RNG so the pre-rolled birthdays never reshuffle on unrelated
  re-renders (advance the room seed to reseed, don't call `Math.random`).

When changing behavior, edit the data tables and pure functions in these
modules; components are mostly presentation over their output.

### The hand-drawn look

- **`src/sketch.js`** — SVG path generators (`roughLinePath`, `roughRectPath`,
  `roughBracketPath`, `sketchBoxStyle`) that fake marker strokes. Jitter is
  **seeded** (`mulberry32` + `hashSeed`) so re-renders while typing don't make
  strokes shimmer — preserve this determinism when adding wobble. `mulberry32`
  is module-internal (only the path generators are exported), which is why
  `birthday.js` and `montyhall.js` each carry their own copy for game randomness.
  New pages import the shared colors (`INK`, `MARKER_BLUE`, `BOARD_BG`) from
  `metrics.js` and the `rough*` / `sketchBoxStyle` helpers from `sketch.js`.
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
