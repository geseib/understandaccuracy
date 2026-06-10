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

// Quick population mixes: how many truly positive / truly negative.
export const POPULATIONS = [
  { name: 'Rare positives', pos: 10, neg: 990 },
  { name: 'Balanced', pos: 500, neg: 500 },
  { name: 'Mostly positive', pos: 900, neg: 100 },
];

// Model behaviors as rates, so they distribute across whatever population
// totals are entered: recallRate = share of real positives it catches,
// fpRate = share of real negatives it falsely flags.
export const MODELS = [
  {
    name: 'Says “no” to everyone',
    recallRate: 0,
    fpRate: 0,
    takeaway:
      'Recall 0% and precision undefined — yet accuracy equals the negative share of the population. Make negatives dominate and watch it soar.',
  },
  {
    name: 'Almost never says yes',
    recallRate: 0,
    fpRate: 0.001,
    takeaway:
      'The whiteboard special: zero real catches, a stray false alarm. Precision and recall sit at 0% while accuracy rides the base rate.',
  },
  {
    name: 'Trigger-happy',
    recallRate: 0.9,
    fpRate: 0.3,
    takeaway:
      'Catches 90% of real positives by flagging 30% of the negatives too. Great recall — watch how precision depends on the population mix.',
  },
  {
    name: 'Pretty good model',
    recallRate: 0.9,
    fpRate: 0.1,
    takeaway:
      'Catches 90%, false-alarms 10%. Looks strong everywhere — until positives get rare and precision slides. Try it with 10 + 990.',
  },
  {
    name: 'Says “yes” to everyone',
    recallRate: 1,
    fpRate: 1,
    takeaway:
      'Recall 100% the cheap way. Precision becomes exactly the share of positives in the population — change the mix and watch it follow.',
  },
  {
    name: 'Perfect classifier',
    recallRate: 1,
    fpRate: 0,
    takeaway: 'Every prediction right. The only model where the population mix changes nothing.',
  },
];

// Distribute a model's rates across the given totals.
export function applyModel(model, pos, neg) {
  const tp = Math.round(model.recallRate * pos);
  const fp = Math.round(model.fpRate * neg);
  return { tp, fn: pos - tp, fp, tn: neg - fp };
}

// Change the population totals while keeping the current model behavior:
// preserve the implied recall and false-alarm rates of the existing cells.
export function redistribute(cells, newPos, newNeg) {
  const pos = cells.tp + cells.fn;
  const neg = cells.fp + cells.tn;
  const recallRate = pos > 0 ? cells.tp / pos : 0;
  const fpRate = neg > 0 ? cells.fp / neg : 0;
  const tp = Math.round(recallRate * newPos);
  const fp = Math.round(fpRate * newNeg);
  return { tp, fn: newPos - tp, fp, tn: newNeg - fp };
}
