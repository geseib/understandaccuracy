// The Birthday Paradox — pure math, seeded RNG, layout constants, and copy.
// Kept as a plain JS module (like folding.js) so the page component is mostly
// presentation over these pure functions. No Math.random touches the rendered
// dots: every birthday is derived deterministically from an integer seed.

export const DAYS_IN_YEAR = 365; // ignore leap years — the classic setup
export const MAX_PEOPLE = 60; // how many birthdays we pre-roll per room
export const CROSSOVER = 23; // where the chance first passes 50%

// A non-leap calendar, laid out as twelve month grids. `start` is the day
// index (0..364) of the 1st of each month, so day index ↔ month/day is O(1).
const RAW_MONTHS = [
  ['January', 'Jan', 31], ['February', 'Feb', 28], ['March', 'Mar', 31],
  ['April', 'Apr', 30], ['May', 'May', 31], ['June', 'Jun', 30],
  ['July', 'Jul', 31], ['August', 'Aug', 31], ['September', 'Sep', 30],
  ['October', 'Oct', 31], ['November', 'Nov', 30], ['December', 'Dec', 31],
];

export const MONTHS = RAW_MONTHS.reduce((acc, [name, short, days]) => {
  const prev = acc[acc.length - 1];
  const start = prev ? prev.start + prev.days : 0;
  acc.push({ name, short, days, start });
  return acc;
}, []);

// day index (0..364) -> { month, day } (both 0-based)
export function dayToMonthDay(index) {
  for (let m = 0; m < MONTHS.length; m++) {
    const rel = index - MONTHS[m].start;
    if (rel < MONTHS[m].days) return { month: m, day: rel };
  }
  return { month: 11, day: 30 };
}

// A short human label like "Mar 14" for a day index.
export function dayLabel(index) {
  const { month, day } = dayToMonthDay(index);
  return `${MONTHS[month].short} ${day + 1}`;
}

// --- Seeded RNG (self-contained; mirrors sketch.js's generator) -------------
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministically step to the next room seed (an LCG — no Math.random),
// so "New room" always produces a fresh but reproducible sequence.
export function nextSeed(seed) {
  return (Math.imul(seed >>> 0, 1664525) + 1013904223) >>> 0;
}

// A stable sequence of `count` birthdays (day indices) for one room.
export function seededBirthdays(seed, count = MAX_PEOPLE) {
  const rand = mulberry32(seed);
  const out = [];
  for (let i = 0; i < count; i++) out.push(Math.floor(rand() * DAYS_IN_YEAR));
  return out;
}

// Map day index -> array of person indices sharing it (only the collisions).
export function collisionDays(birthdays) {
  const byDay = new Map();
  birthdays.forEach((day, person) => {
    const list = byDay.get(day);
    if (list) list.push(person);
    else byDay.set(day, [person]);
  });
  const collisions = new Map();
  for (const [day, people] of byDay) {
    if (people.length >= 2) collisions.set(day, people);
  }
  return collisions;
}

// P(at least two of n share a birthday) = 1 - ∏(1 - k/365).
export function birthdayProb(n) {
  if (n < 2) return 0;
  let noMatch = 1;
  for (let k = 0; k < n; k++) noMatch *= 1 - k / DAYS_IN_YEAR;
  return 1 - noMatch;
}

// The hidden engine: n people hide n(n-1)/2 pairs.
export function pairsCount(n) {
  return (n * (n - 1)) / 2;
}

// Monte-Carlo check: simulate `trials` rooms of `roomSize`, return the fraction
// that contained at least one shared birthday. Fully seeded for reproducibility.
export function simulateRooms(seed, roomSize, trials = 1000) {
  const rand = mulberry32(seed);
  let hits = 0;
  for (let t = 0; t < trials; t++) {
    const seen = new Set();
    let collided = false;
    for (let i = 0; i < roomSize; i++) {
      const d = Math.floor(rand() * DAYS_IN_YEAR);
      if (seen.has(d)) collided = true;
      seen.add(d);
    }
    if (collided) hits++;
  }
  return hits / trials;
}

// Predict-then-reveal: the misconception laid bare by a first guess.
export const QUIZ = {
  prompt:
    'A room fills up one person at a time. How many people until it’s MORE LIKELY THAN NOT (>50%) that two of them share a birthday?',
  options: [
    { label: '~180 people', correct: false },
    { label: '~90 people', correct: false },
    { label: '~50 people', correct: false },
    { label: '23 people', correct: true },
  ],
  reveal:
    'Just 23. Gut says ~180 — half of 365 — because we picture “someone matching me.” But nobody is comparing against one birthday; every pair of people is its own little lottery, and 23 people hide 253 pairs.',
};

// Milestone room sizes for one-click jumps, with the true chance at each.
export const MILESTONES = [5, 10, 23, 30, 41, 60];

// Payoff copy, shown once collisions have appeared.
export const PAYOFF =
  'The match showed up absurdly early. That’s the paradox: people grow one at a time, but pairs explode — n people quietly carry n(n−1)/2 pairs, and it only takes 23 of them to make a shared birthday the favourite.';
