// The Positive Test Paradox — pure math, constants, presets, and copy.
//
// A sequel to the Accuracy page: even a near-perfect test, applied to a rare
// condition, produces a pile of false alarms that swamps the true positives.
// Everything here is a pure function or a data table; the page component is
// just presentation over this output. Population is fixed at N = 10,000 so
// every derived count lands on a whole number.

export const N = 10000;

// Slider bounds. Kept here (not in the component) so the math module owns the
// domain and the UI just reads it.
export const RANGES = {
  prevalence: { min: 0.001, max: 0.2, step: 0.001, default: 0.01 },
  sensitivity: { min: 0.5, max: 1, step: 0.001, default: 0.99 },
  specificity: { min: 0.5, max: 1, step: 0.001, default: 0.99 },
};

// Turn the three rates into a full confusion count over the fixed population.
// Round sick/healthy first, then round the true-positive and true-negative
// counts and let their partners absorb the remainder, so tp+fn === sick and
// fp+tn === healthy exactly (no drift, no fractional people).
export function compute({ prevalence, sensitivity, specificity }) {
  const sick = Math.round(N * prevalence);
  const healthy = N - sick;

  const tp = Math.round(sick * sensitivity);
  const fn = sick - tp;
  const tn = Math.round(healthy * specificity);
  const fp = healthy - tn;

  const positives = tp + fp;
  const negatives = fn + tn;

  return {
    sick,
    healthy,
    tp,
    fn,
    fp,
    tn,
    positives,
    negatives,
    // echo the inputs back so callers (and presets) can compare/highlight
    prevalence,
    sensitivity,
    specificity,
    // The headline. Return null (never 0 / NaN) when nobody tested positive,
    // matching the metrics.js convention that formatPct renders as "—".
    pSickGivenPositive: positives === 0 ? null : tp / positives,
    pHealthyGivenNegative: negatives === 0 ? null : tn / negatives,
  };
}

// 10000 -> "10,000"
export function formatCount(n) {
  return n.toLocaleString('en-US');
}

// A probability as friendly odds, e.g. 0.09 -> "about 1 in 11". null -> "—".
export function oddsText(p) {
  if (p === null || p === undefined || Number.isNaN(p) || p <= 0) return '—';
  return `about 1 in ${formatCount(Math.round(1 / p))}`;
}

// Prevalence-only quick picks (the base-rate chips).
export const PREVALENCE_CHIPS = [
  { label: 'Rare (0.1%)', value: 0.001 },
  { label: '1 in 100 (1%)', value: 0.01 },
  { label: 'Common (10%)', value: 0.1 },
];

// Full one-click scenarios: each sets all three sliders to tell a small story.
export const SCENARIOS = [
  {
    name: 'The classic paradox',
    prevalence: 0.01,
    sensitivity: 0.99,
    specificity: 0.99,
    blurb: 'A 99%-accurate test for a 1%-common condition. Flagged positive? It is still a coin-flip that you are perfectly fine.',
  },
  {
    name: 'Screening for the rare disease',
    prevalence: 0.001,
    sensitivity: 0.99,
    specificity: 0.99,
    blurb: 'Only 1 in 1,000 is truly sick. The same near-perfect test now buries every real case under a landslide of false alarms.',
  },
  {
    name: 'Crank sensitivity to 99.9%',
    prevalence: 0.001,
    sensitivity: 0.999,
    specificity: 0.99,
    blurb: 'Catch 99.9% of the sick and the headline barely twitches. Sensitivity was never the bottleneck.',
  },
  {
    name: 'The specificity fix',
    prevalence: 0.001,
    sensitivity: 0.99,
    specificity: 0.999,
    blurb: 'Halve the false-alarm rate instead (99.9% specificity) and the answer finally lurches upward.',
  },
  {
    name: 'A common condition',
    prevalence: 0.1,
    sensitivity: 0.99,
    specificity: 0.99,
    blurb: 'When 1 in 10 really have it, a positive result means about what you would expect. Base rate is the whole game.',
  },
];

// Shared copy strings, so the component stays presentational.
export const COPY = {
  intro:
    'A test can be 99% accurate and a positive result can still mean you are almost certainly fine. The catch is not the test — it is how rare the thing is. Slide the base rate down and watch the green (really-sick) wedge all but disappear.',
  everyoneLabel: 'Everyone — 10,000 people',
  positivesLabel: 'Zoom in: only the people who tested POSITIVE',
  headlineLead: 'Tested positive → actually sick:',
  bayesTitle: 'Bayes by counting heads',
  bayesQuestion: 'Your test came back positive. What is the chance you are actually sick?',
  bayesCaution:
    'This is Bayes’ theorem — but you never need the formula. Just count the green heads out of every head the test flagged.',
  payoffTitle: 'Why a sharper test barely helps',
  payoff:
    'Push sensitivity all the way toward 99.9% and the answer hardly moves — because false positives ride the size of the healthy crowd, not the quality of the test. A near-perfect test still cannot out-run a small base rate. To actually shift the odds you have to shrink the false-alarm rate (raise specificity) or test a group where the condition is genuinely common.',
  flipSide: 'Flip side — a negative result:',
};
