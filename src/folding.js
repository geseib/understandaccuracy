// A sheet of office paper is about 0.1 mm thick. Every fold doubles it.
export const SHEET_M = 0.0001; // 0.1 mm, in meters
export const MAX_FOLDS = 103; // ~the size of the observable universe

export const LOG2 = Math.log10(2);

// height in meters after n folds
export function thickness(n) {
  return SHEET_M * 2 ** n;
}

// where a height sits on a log10(meters) axis
export function logM(meters) {
  return Math.log10(meters);
}

// the log range the tower spans: from one sheet to the whole universe
export const LOG_MIN = logM(SHEET_M); // -4
export const LOG_MAX = logM(thickness(MAX_FOLDS)); // ~27

// fold count at which the stack first reaches a given height
export function foldsToReach(meters) {
  return (logM(meters) - LOG_MIN) / LOG2;
}

// Landmarks pinned along the tower, each with the fold that first passes it.
// Heights in meters. Emoji used as instantly-readable doodles.
export const LANDMARKS = [
  { icon: '📄', label: 'one sheet', meters: SHEET_M },
  { icon: '🪙', label: 'a coin’s width', meters: 0.002 },
  { icon: '🖐️', label: 'a hand span', meters: 0.2 },
  { icon: '🧍', label: 'a person', meters: 1.7 },
  { icon: '🦒', label: 'a giraffe', meters: 5.5 },
  { icon: '🏠', label: 'a house', meters: 13 },
  { icon: '🗽', label: 'the Statue of Liberty', meters: 93 },
  { icon: '🏙️', label: 'the Burj Khalifa', meters: 828 },
  { icon: '✈️', label: 'a cruising jet', meters: 11000 },
  { icon: '🏔️', label: 'Mount Everest', meters: 8849 },
  { icon: '🚀', label: 'the edge of space', meters: 100000 },
  { icon: '🛰️', label: 'the Space Station', meters: 408000 },
  { icon: '🌙', label: 'the Moon', meters: 384400000 },
  { icon: '☀️', label: 'the Sun', meters: 149600000000 },
  { icon: '🌌', label: 'the observable universe', meters: 4.4e26 },
];

// Big, nameable milestones for the one-click buttons.
export const MILESTONES = [
  { folds: 7, blurb: 'about as thick as your finger — and in real life, this is as far as you can actually fold a sheet of paper. The math, of course, keeps going.' },
  { folds: 14, blurb: 'taller than you. Fourteen folds and the stack already looks you in the eye.' },
  { folds: 17, blurb: 'as tall as a house. Notice how little changed for the first 10 folds — then it took off.' },
  { folds: 23, blurb: 'past the tallest building on Earth. Twenty-three doublings beats 160 years of skyscrapers.' },
  { folds: 30, blurb: 'past the edge of space. Thirty folds of paper leaves the atmosphere entirely.' },
  { folds: 42, blurb: 'all the way to the Moon. This is the famous one — and most people guess a few meters.' },
  { folds: 51, blurb: 'past the Sun, 150 million km away. Just nine more folds than reaching the Moon.' },
  { folds: 103, blurb: 'the size of the observable universe. One hundred and three folds of a single sheet of paper.' },
];

// Predict-then-reveal: the misconception is laid bare by a first guess.
export const QUIZ = {
  prompt: 'Before you touch anything — if you could fold one sheet of paper 42 times, how tall would the stack get?',
  options: [
    { label: 'As tall as a fridge', correct: false },
    { label: 'A 10-storey building', correct: false },
    { label: 'Higher than Mount Everest', correct: false },
    { label: 'All the way past the Moon', correct: true },
  ],
  reveal:
    'It reaches the Moon — about 440,000 km. Nearly everyone guesses a fridge or a building, because our gut adds when it should be doubling. That gap is what this page is about.',
};

// Where transfer happens: it was never really about paper.
export const TRANSFER = [
  { icon: '💰', label: 'Compound interest', note: 'money left to double quietly looks flat for years, then dwarfs what you put in.' },
  { icon: '🦠', label: 'Viral spread', note: 'one case becoming two becoming four is why outbreaks seem to come from nowhere.' },
  { icon: '💻', label: 'Moore’s law', note: 'chips doubling every couple of years is why your phone outruns old supercomputers.' },
];

// Pick a friendly unit for a height in meters.
export function formatHeight(meters) {
  if (meters < 0.01) return `${(meters * 1000).toFixed(meters < 0.001 ? 2 : 1)} mm`;
  if (meters < 1) return `${(meters * 100).toFixed(1)} cm`;
  if (meters < 1000) return `${meters < 10 ? meters.toFixed(2) : Math.round(meters)} m`;
  const km = meters / 1000;
  if (km < 1e6) return `${formatBigNumber(km)} km`;
  // astronomical: also give it in Earth–Moon trips for scale
  return `${formatBigNumber(km)} km`;
}

// 12345678 -> "12.3 million", keeps huge numbers readable
export function formatBigNumber(n) {
  if (n < 1000) return String(Math.round(n));
  if (n < 1e6) return Math.round(n).toLocaleString('en-US');
  const units = [
    { v: 1e6, s: 'million' },
    { v: 1e9, s: 'billion' },
    { v: 1e12, s: 'trillion' },
    { v: 1e15, s: 'quadrillion' },
    { v: 1e18, s: 'quintillion' },
    { v: 1e21, s: 'sextillion' },
    { v: 1e24, s: 'septillion' },
  ];
  let chosen = units[0];
  for (const u of units) if (n >= u.v) chosen = u;
  return `${(n / chosen.v).toFixed(1)} ${chosen.s}`;
}

// The nearest landmark the current height is closest to / has just passed.
export function describeReach(meters) {
  let passed = LANDMARKS[0];
  for (const lm of LANDMARKS) {
    if (meters >= lm.meters) passed = lm;
  }
  return passed;
}
