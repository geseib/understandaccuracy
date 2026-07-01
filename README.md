# Understand Accuracy

An interactive, hand-drawn "whiteboard" for the things our intuition gets wrong about
numbers — built with React 19 and Vite.

🔗 **Repository:** https://github.com/geseib/understandaccuracy

It has two self-contained explainers:

## Accuracy ≠ Understanding

A live confusion-matrix playground for **accuracy, precision, recall, and F1**.
Set the population, pick a model's behavior, or edit any count directly — every
number, formula, and the population line update instantly. Jump to one-click
"extremes" to see how a model can be 98.9% accurate while finding *none* of what
you're looking for.

![Accuracy ≠ Understanding](screenshots/accuracy.png)

## Fold to the Moon

An exponential-growth demo: a single sheet of paper, 0.1 mm thick, doubling with
every fold. Guess first, then fold — and watch the stack stay flat for ten folds,
then blow past Everest, the edge of space, and reach the Moon at 42 folds.

![Fold to the Moon](screenshots/fold.png)

## Running locally

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build to dist/
npm run preview  # preview the built site
```

Requires Node.js 20.19+ or 22.12+ (Vite 7).

## Deployment

The app builds for two targets, switched automatically in `vite.config.js`:

- **Vercel** — served at the root (`/`).
- **GitHub Pages** — served under `/understandaccuracy/`.

## Tech

React 19 · Vite 7 · inline styles and seeded SVG "marker" strokes — no UI
framework, no router, no test suite.
