// Pure Monty Hall logic + copy. No React, no DOM — just math and strings.
//
// Three doors: one hides a car, two hide goats. You pick a door; the host,
// who KNOWS where the car is, opens one of the OTHER doors to reveal a goat
// (never the car, never your door). Then you may stay or switch.
//
// The counter-intuitive result: switching wins 2/3 of the time, staying 1/3.
// Every "random" choice flows through a seeded RNG so a given seed always
// produces the same game — deterministic and reproducible.

// Self-contained seeded RNG (same family as sketch.js, kept local so this
// module has zero imports and can be reasoned about on its own).
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

export const DOORS = [0, 1, 2];
export const DOOR_LABELS = ['A', 'B', 'C'];
export const STRATEGIES = ['stay', 'switch'];

// integer in [0, n) from a rand source
function intBelow(rand, n) {
  return Math.floor(rand() * n);
}

// Which door the host opens: any door that is neither the player's pick nor
// the car. When the player happened to pick the car there are two goat doors
// to choose from, and the host picks one via the supplied rand source.
function chooseHostDoor(carDoor, pick, rand) {
  const options = DOORS.filter((d) => d !== pick && d !== carDoor);
  return options[intBelow(rand, options.length)];
}

// The lone remaining closed door — the one "switch" moves to.
export function switchDoorFor(pick, hostOpens) {
  return DOORS.find((d) => d !== pick && d !== hostOpens);
}

// ---- Interactive-game helpers (the player supplies their own pick) --------

// Deterministic car position for a game seed.
export function carDoorFor(seed) {
  return intBelow(mulberry32(seed), 3);
}

// Deterministic host reveal for a game, given the player's pick. Uses a
// derived seed so the host's tie-break doesn't move when only the pick changes.
export function hostOpensFor(seed, carDoor, pick) {
  return chooseHostDoor(carDoor, pick, mulberry32((seed ^ 0x9e3779b9) >>> 0));
}

// ---- Whole-round + simulation (RNG drives every choice) -------------------

// Play one complete round from a rand source and a strategy.
function roundFromRand(rand, strategy) {
  const carDoor = intBelow(rand, 3);
  const pick = intBelow(rand, 3);
  const hostOpens = chooseHostDoor(carDoor, pick, rand);
  const finalPick = strategy === 'switch' ? switchDoorFor(pick, hostOpens) : pick;
  return { carDoor, pick, hostOpens, finalPick, won: finalPick === carDoor };
}

// One self-contained round for a given seed (used by the explainer / tests).
export function playRound(seed, strategy) {
  return roundFromRand(mulberry32(seed), strategy);
}

// Play `games` rounds with a fixed strategy off one seeded stream; return wins.
export function simulate(strategy, games, seed) {
  const rand = mulberry32(seed >>> 0);
  let wins = 0;
  for (let i = 0; i < games; i++) {
    if (roundFromRand(rand, strategy).won) wins += 1;
  }
  return wins;
}

// wins / games, or null when nothing has been played (undefined ratio).
export function winRate(wins, games) {
  return games > 0 ? wins / games : null;
}

// The exact long-run odds, for labelling the simulator.
export const THEORY = { stay: 1 / 3, switch: 2 / 3 };

// ---- Copy -----------------------------------------------------------------

export const COPY = {
  intro:
    'Three doors. Behind one waits a car; behind the other two, goats. You pick a door. Then the host — who knows exactly where the car is — opens a different door to reveal a goat, and offers you a choice: keep your door, or switch to the other one still closed.',
  guess:
    'Most people say it makes no difference — two doors left, so 50 / 50, right? Play a round and find out.',
  pickPrompt: 'Pick a door to begin.',
  decidePrompt:
    'The host opened a goat door. Do you STAY with your first pick, or SWITCH to the other closed door?',
  playAgain: 'Play again',
  whyTitle: 'Why switching wins two out of three',
  why:
    'Your very first pick is a blind guess, right only 1 time in 3. So 2 times in 3 the car sits behind one of the doors you didn’t choose. The host never opens the car and never opens your door — so when he reveals a goat he quietly sweeps that whole 2/3 chance onto the single door still closed beside yours. Switching collects it.',
  whyKicker:
    'Staying only wins when your first blind guess was already right. Switching wins in every other case — and there are twice as many of those.',
  simTitle: 'Don’t take my word for it — run a thousand',
  simBlurb:
    'Play 1,000 games always staying, and 1,000 always switching, and tally the wins. The marks pile up almost exactly 1/3 vs 2/3.',
  simIdle: 'The bars fill once you run the games.',
  treeTitle: 'All three cases, laid out',
  treeIntro:
    'Fix your first pick on one door. The car is equally likely to be in any of the three spots. Follow each case to its end:',
  treeFooter:
    'Stay wins in 1 case, switch wins in 2. That 1-vs-2 split is the whole trick.',
};

// The three equally-likely cases behind the explainer tree. `stayWins` is the
// outcome of staying; switching is always the opposite.
export const TREE_CASES = [
  {
    where: 'behind the door you picked',
    prob: '1 / 3',
    stayWins: true,
    note: 'Your guess was right. Staying keeps the car; switching throws it away.',
  },
  {
    where: 'behind the first door you didn’t pick',
    prob: '1 / 3',
    stayWins: false,
    note: 'The host must open the other goat — so switching lands on the car.',
  },
  {
    where: 'behind the second door you didn’t pick',
    prob: '1 / 3',
    stayWins: false,
    note: 'Same again: the host reveals the lone goat, and switching wins.',
  },
];
