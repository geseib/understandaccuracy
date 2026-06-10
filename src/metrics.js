// Shared colors + copy for the four confusion-matrix cells.
// Segment order on the population line is FN, TP, FP, TN so that
// "truly positive" (FN+TP) and "predicted positive" (TP+FP) are both
// contiguous and overlap exactly on TP.
export const CELL_META = {
  tp: {
    key: 'tp',
    short: 'TP',
    name: 'True Positive',
    blurb: 'correctly flagged',
    color: '#16a34a',
  },
  fp: {
    key: 'fp',
    short: 'FP',
    name: 'False Positive',
    blurb: 'a false alarm',
    color: '#dc2626',
  },
  fn: {
    key: 'fn',
    short: 'FN',
    name: 'False Negative',
    blurb: 'a miss',
    color: '#d97706',
  },
  tn: {
    key: 'tn',
    short: 'TN',
    name: 'True Negative',
    blurb: 'correctly ignored',
    color: '#64748b',
  },
};

export const LINE_ORDER = ['fn', 'tp', 'fp', 'tn'];

export const INK = '#2b2b2b';
export const MARKER_BLUE = '#1d4ed8';
export const BOARD_BG = '#fbfaf6';

export function computeMetrics({ tp, fp, fn, tn }) {
  const total = tp + fp + fn + tn;
  const actualPos = tp + fn;
  const actualNeg = fp + tn;
  const predPos = tp + fp;
  const predNeg = fn + tn;
  return {
    total,
    actualPos,
    actualNeg,
    predPos,
    predNeg,
    prevalence: total === 0 ? null : actualPos / total,
    accuracy: total === 0 ? null : (tp + tn) / total,
    precision: predPos === 0 ? null : tp / predPos,
    recall: actualPos === 0 ? null : tp / actualPos,
    // 2tp/(2tp+fp+fn) equals the harmonic mean of precision & recall but
    // stays defined (=0) when tp=0 with some fp/fn present.
    f1: 2 * tp + fp + fn === 0 ? null : (2 * tp) / (2 * tp + fp + fn),
  };
}

export function formatPct(x, digits = 1) {
  if (x === null || x === undefined || Number.isNaN(x)) return '—';
  const pct = x * 100;
  const rounded = Math.round(pct * 10 ** digits) / 10 ** digits;
  return `${rounded}%`;
}

export const METRIC_DEFS = [
  {
    key: 'accuracy',
    name: 'Accuracy',
    question: 'Of ALL the predictions, how many were right — counting both the yes’s and the no’s?',
    numerCells: ['tp', 'tn'],
    denomCells: ['tp', 'tn', 'fp', 'fn'],
    formula: ['tp', '+', 'tn'],
    denomFormula: ['tp', '+', 'tn', '+', 'fp', '+', 'fn'],
    caution: 'Easy to inflate when one class dominates: just say “no” to everyone.',
    undefinedNote: 'No population at all — add some people first!',
  },
  {
    key: 'precision',
    name: 'Precision',
    question: 'When the model says POSITIVE, how often is it actually right?',
    numerCells: ['tp'],
    denomCells: ['tp', 'fp'],
    formula: ['tp'],
    denomFormula: ['tp', '+', 'fp'],
    caution: 'How much you can trust an alarm.',
    undefinedNote: 'Undefined — the model never said positive, so there’s nothing to be precise about.',
  },
  {
    key: 'recall',
    name: 'Recall',
    alias: '(a.k.a. sensitivity, true-positive rate)',
    question: 'Of all the TRULY positive cases, how many did the model find?',
    numerCells: ['tp'],
    denomCells: ['tp', 'fn'],
    formula: ['tp'],
    denomFormula: ['tp', '+', 'fn'],
    caution: 'How few real cases slip through.',
    undefinedNote: 'Undefined — there are no real positives to find.',
  },
  {
    key: 'f1',
    name: 'F1 score',
    question: 'The harmonic mean of precision & recall — only high when BOTH are high.',
    numerCells: ['tp'],
    denomCells: ['tp', 'fp', 'fn'],
    formula: ['2×', 'tp'],
    denomFormula: ['2×', 'tp', '+', 'fp', '+', 'fn'],
    caution: 'One lopsided zero drags it to zero.',
    undefinedNote: 'Undefined — no positives anywhere, real or predicted.',
  },
];

export const PRESETS = [
  {
    name: 'The whiteboard example',
    cells: { tp: 0, fp: 1, fn: 10, tn: 989 },
    takeaway:
      '98.9% accurate — yet it caught zero of the 10 real positives. Accuracy lies when positives are rare.',
  },
  {
    name: 'Predict everything negative',
    cells: { tp: 0, fp: 0, fn: 10, tn: 990 },
    takeaway:
      'Saying “no” to everyone scores 99% accuracy. Precision isn’t even defined — it never said yes.',
  },
  {
    name: 'Predict everything positive',
    cells: { tp: 10, fp: 990, fn: 0, tn: 0 },
    takeaway:
      'Perfect recall is cheap: just say yes to everything. Precision collapses to 1%.',
  },
  {
    name: 'Over-predictor (false alarms)',
    cells: { tp: 9, fp: 291, fn: 1, tn: 699 },
    takeaway:
      'Catches 9 of 10 real positives, but 291 of its 300 alarms are false. High recall, terrible precision.',
  },
  {
    name: 'Balanced & good model',
    cells: { tp: 450, fp: 50, fn: 50, tn: 450 },
    takeaway:
      'With a 50/50 population and a decent model, all four metrics agree at 90%. Imbalance is what splits them apart.',
  },
  {
    name: 'Mostly-positive population',
    cells: { tp: 900, fp: 100, fn: 0, tn: 0 },
    takeaway:
      'The same lazy “always yes” model — but now positives are common, so accuracy looks great. Base rate is everything.',
  },
  {
    name: 'Perfect classifier',
    cells: { tp: 10, fp: 0, fn: 0, tn: 990 },
    takeaway:
      'Every prediction right, every positive found. The only scenario where nothing can disagree.',
  },
];
