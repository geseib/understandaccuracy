import { useState } from 'react';
import { INK, MARKER_BLUE, formatPct } from '../metrics.js';
import { roughLinePath, roughRectPath, roughPolylinePath, sketchBoxStyle } from '../sketch.js';
import {
  COPY, TREE_CASES, THEORY,
  DOOR_LABELS, carDoorFor, hostOpensFor, switchDoorFor,
  simulate, winRate,
} from '../montyhall.js';

const HAND = "'Caveat', 'Comic Sans MS', 'Chalkboard SE', cursive";
const SIM_GAMES = 1000;
const PER_MARK = 15; // one tally mark per 15 games, so ~1000 games ≈ 67 marks

// ---------------------------------------------------------------------------
// Hand-drawn goat: a small, bearded, four-legged sketch in marker ink.
// Occupies roughly 72 × 58 in local coords; `x`,`y` place its top-left.
// ---------------------------------------------------------------------------
function Goat({ x = 0, y = 0, seed = 5, scale = 1 }) {
  const l = (a, b, c, d, k, w = 1.3) => roughLinePath(a, b, c, d, seed + k, w);
  return (
    <g
      transform={`translate(${x},${y}) scale(${scale})`}
      fill="none"
      stroke={INK}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={roughRectPath(6, 14, 40, 22, seed, 1.5)} />{/* body */}
      <path d={l(14, 36, 13, 53, 10)} />{/* legs */}
      <path d={l(22, 36, 21, 53, 11)} />
      <path d={l(34, 36, 35, 53, 12)} />
      <path d={l(42, 36, 43, 53, 13)} />
      <path d={roughPolylinePath([[44, 19], [58, 10], [70, 15], [66, 27], [50, 27]], seed + 20, 1.1)} />{/* head */}
      <path d={l(57, 11, 54, 5, 30)} />{/* ear */}
      <path d={roughPolylinePath([[62, 10], [67, 3], [61, 1]], seed + 32, 1.0)} />{/* horn */}
      <path d={l(60, 27, 60, 34, 40)} />{/* beard */}
      <path d={l(6, 16, 0, 11, 50)} />{/* tail */}
      <circle cx="63" cy="17" r="1.7" fill={INK} stroke="none" />{/* eye */}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Hand-drawn car: body, cabin, two wheels, a headlight. ~72 × 52 local.
// ---------------------------------------------------------------------------
function Car({ x = 0, y = 0, seed = 9, scale = 1 }) {
  const l = (a, b, c, d, k, w = 1.3) => roughLinePath(a, b, c, d, seed + k, w);
  return (
    <g
      transform={`translate(${x},${y}) scale(${scale})`}
      fill="none"
      stroke={INK}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={roughRectPath(4, 26, 64, 16, seed, 1.5)} />{/* lower body */}
      <path d={roughPolylinePath([[16, 26], [24, 12], [46, 12], [56, 26]], seed + 10, 1.1)} />{/* cabin */}
      <path d={l(35, 13, 35, 26, 20)} />{/* window divider */}
      <circle cx="65" cy="31" r="2.2" fill="#fde047" stroke={INK} strokeWidth="1.4" />{/* headlight */}
      <circle cx="20" cy="44" r="7" fill="#fff" stroke={INK} strokeWidth="2" />{/* wheels */}
      <circle cx="52" cy="44" r="7" fill="#fff" stroke={INK} strokeWidth="2" />
      <circle cx="20" cy="44" r="2.2" fill={INK} stroke="none" />
      <circle cx="52" cy="44" r="2.2" fill={INK} stroke="none" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// One door. Closed → a big "?" and a knob. Open → the goat or car inside.
// `seed` is index-derived (stable across renders) so strokes never shimmer.
// ---------------------------------------------------------------------------
function Door({ label, seed, open, content, tag, tagColor, outcome, clickable, onClick }) {
  const frame = outcome === 'win' ? '#16a34a' : outcome === 'lose' ? '#dc2626' : INK;
  const svg = (
    <svg viewBox="0 0 140 200" style={{ width: '100%', display: 'block' }}>
      <path d={roughRectPath(8, 8, 124, 184, seed, 2)} fill="#fff" stroke={frame} strokeWidth="2.6" strokeLinejoin="round" />
      <path d={roughRectPath(20, 20, 100, 160, seed + 5, 1.6)} fill="none" stroke={frame} strokeWidth="1.4" opacity="0.5" />
      {open ? (
        content === 'car' ? <Car x={34} y={78} seed={seed + 40} /> : <Goat x={34} y={80} seed={seed + 40} />
      ) : (
        <>
          <text x="70" y="128" textAnchor="middle" fill={MARKER_BLUE} style={{ fontFamily: HAND, fontWeight: 700, fontSize: 76 }}>
            ?
          </text>
          <circle cx="108" cy="104" r="3.6" fill={INK} />
        </>
      )}
    </svg>
  );

  return (
    <div style={{ flex: '1 1 120px', maxWidth: 168, minWidth: 96, textAlign: 'center' }}>
      {clickable ? (
        <button
          onClick={onClick}
          aria-label={`Pick door ${label}`}
          style={{ display: 'block', width: '100%', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
          className="door-btn"
        >
          {svg}
        </button>
      ) : svg}
      <div style={{ fontSize: 14, color: '#999', marginTop: 2 }}>door {label}</div>
      <div style={{ minHeight: 18, fontSize: 14 }}>
        {tag ? <b style={{ color: tagColor || MARKER_BLUE }}>{tag}</b> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Whiteboard tally: marks grouped in fives (four uprights + a diagonal),
// wrapping across rows. One mark ≈ PER_MARK games.
// ---------------------------------------------------------------------------
function TallyBars({ label, sub, wins, games, color }) {
  const marks = Math.round(wins / PER_MARK);
  const groups = Math.ceil(marks / 5);
  const perRow = 12;
  const rows = Math.max(1, Math.ceil(groups / perRow));
  const groupW = 29;
  const rowH = 46;
  const markH = 30;
  const pad = 8;
  const width = perRow * groupW + pad * 2;
  const height = rows * rowH + pad;

  const strokes = [];
  for (let g = 0; g < groups; g += 1) {
    const count = Math.min(5, marks - g * 5);
    const col = g % perRow;
    const row = Math.floor(g / perRow);
    const gx = pad + col * groupW;
    const gy = pad + row * rowH;
    const uprights = Math.min(count, 4);
    for (let m = 0; m < uprights; m += 1) {
      strokes.push(
        <path
          key={`u-${g}-${m}`}
          d={roughLinePath(gx + m * 5, gy, gx + m * 5, gy + markH, 100 + g * 7 + m, 1.1)}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />,
      );
    }
    if (count === 5) {
      strokes.push(
        <path
          key={`d-${g}`}
          d={roughLinePath(gx - 3, gy + markH, gx + 18, gy, 300 + g, 1.2)}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />,
      );
    }
  }

  const rate = winRate(wins, games);
  return (
    <div style={{ flex: '1 1 340px', minWidth: 300 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 16, color: INK }}>
          <b style={{ color }}>{label}</b> <span style={{ color: '#999', fontSize: 13.5 }}>{sub}</span>
        </div>
        <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: 30, color }}>
          {formatPct(rate)}
        </div>
      </div>
      <div style={{ fontSize: 13, color: '#999', marginTop: -2 }}>
        {games > 0 ? `${wins} wins out of ${games}` : 'not run yet'}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', display: 'block', marginTop: 4 }} aria-hidden="true">
        {strokes}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The explainer tree: one root pick branching to the three equally likely
// car positions, each showing the STAY and SWITCH outcome as a mini car/goat.
// ---------------------------------------------------------------------------
function ExplainerTree() {
  const W = 660;
  const H = 300;
  const rootX = 40;
  const rootY = 150;
  const leafX = 250;
  const ys = [56, 150, 244];
  const stayX = 452;
  const switchX = 560;

  const Outcome = ({ cx, cy, win, seed }) => (
    <g>
      {win ? <Car x={cx - 15} y={cy - 10} seed={seed} scale={0.42} />
        : <Goat x={cx - 15} y={cy - 10} seed={seed} scale={0.42} />}
      <text x={cx + 0} y={cy + 26} textAnchor="middle" fill={win ? '#16a34a' : '#dc2626'} style={{ fontSize: 13 }}>
        {win ? '✓ car' : '✗ goat'}
      </text>
    </g>
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
      {/* column headers */}
      <text x={stayX} y={20} textAnchor="middle" fill={INK} style={{ fontFamily: HAND, fontWeight: 700, fontSize: 20 }}>STAY</text>
      <text x={switchX} y={20} textAnchor="middle" fill={MARKER_BLUE} style={{ fontFamily: HAND, fontWeight: 700, fontSize: 20 }}>SWITCH</text>

      {/* root */}
      <text x={rootX} y={rootY - 6} fill={MARKER_BLUE} style={{ fontSize: 13.5 }}>your</text>
      <text x={rootX} y={rootY + 10} fill={MARKER_BLUE} style={{ fontSize: 13.5 }}>1st pick</text>

      {ys.map((y, i) => {
        const c = TREE_CASES[i];
        return (
          <g key={i}>
            <path d={roughLinePath(rootX + 44, rootY, leafX - 6, y, 10 + i, 1.4)} fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
            <text x={leafX} y={y - 4} fill={INK} style={{ fontSize: 13.5 }}>
              car {c.where}
            </text>
            <text x={leafX} y={y + 12} fill="#999" style={{ fontSize: 12.5 }}>
              chance {c.prob}
            </text>
            <Outcome cx={stayX} cy={y} win={c.stayWins} seed={500 + i * 9} />
            <Outcome cx={switchX} cy={y} win={!c.stayWins} seed={800 + i * 9} />
          </g>
        );
      })}

      {/* tally line under the two columns */}
      <path d={roughLinePath(stayX - 60, H - 34, switchX + 60, H - 34, 77, 1.2)} fill="none" stroke="#ccc" strokeWidth="1.4" />
      <text x={stayX} y={H - 12} textAnchor="middle" fill={INK} style={{ fontSize: 14 }}>wins 1 of 3</text>
      <text x={switchX} y={H - 12} textAnchor="middle" fill={MARKER_BLUE} style={{ fontSize: 14 }}><tspan style={{ fontWeight: 700 }}>wins 2 of 3</tspan></text>
    </svg>
  );
}

// ===========================================================================
export default function MontyHallPage() {
  const [seed, setSeed] = useState(() => (Math.random() * 2 ** 31) >>> 0);
  const [phase, setPhase] = useState('pick'); // 'pick' | 'decide' | 'result'
  const [pick, setPick] = useState(null);
  const [finalPick, setFinalPick] = useState(null);
  const [choice, setChoice] = useState(null); // 'stay' | 'switch'
  // Counterfactual running tally over every round played: for each game we know
  // the car, the first pick, and the opened door, so we can score all three
  // views at once — what you actually did, and what always-stay / always-switch
  // WOULD have done on that same board.
  const [tally, setTally] = useState({ games: 0, yoursWins: 0, stayWins: 0, switchWins: 0 });
  const [sim, setSim] = useState(null); // { stay, switch } win counts

  const carDoor = carDoorFor(seed);
  const hostOpens = pick === null ? null : hostOpensFor(seed, carDoor, pick);

  const choosePick = (d) => {
    if (phase !== 'pick') return;
    setPick(d);
    setPhase('decide');
  };

  const decide = (strategy) => {
    const chosen = strategy === 'switch' ? switchDoorFor(pick, hostOpens) : pick;
    const won = chosen === carDoor;
    // Counterfactuals on this same board: staying wins iff the first pick was
    // already the car; switching wins in exactly the other case.
    const stayWouldWin = pick === carDoor;
    const switchWouldWin = !stayWouldWin;
    setFinalPick(chosen);
    setChoice(strategy);
    setPhase('result');
    setTally((t) => ({
      games: t.games + 1,
      yoursWins: t.yoursWins + (won ? 1 : 0),
      stayWins: t.stayWins + (stayWouldWin ? 1 : 0),
      switchWins: t.switchWins + (switchWouldWin ? 1 : 0),
    }));
  };

  const playAgain = () => {
    setSeed((Math.random() * 2 ** 31) >>> 0);
    setPick(null);
    setFinalPick(null);
    setChoice(null);
    setPhase('pick');
  };

  // Wipe the running tally and start a fresh round from scratch.
  const resetGame = () => {
    setTally({ games: 0, yoursWins: 0, stayWins: 0, switchWins: 0 });
    playAgain();
  };

  const runSim = () => {
    setSim({
      stay: simulate('stay', SIM_GAMES, (seed ^ 0x1234) >>> 0),
      switch: simulate('switch', SIM_GAMES, (seed ^ 0xabcd) >>> 0),
    });
  };

  const won = phase === 'result' && finalPick === carDoor;

  // Per-door presentation for the current phase.
  const doorProps = (d) => {
    const isHost = phase === 'decide' || phase === 'result' ? d === hostOpens : false;
    const open = (phase === 'decide' && d === hostOpens) || phase === 'result';
    const content = d === carDoor ? 'car' : 'goat';

    let tag = null;
    let tagColor = MARKER_BLUE;
    let outcome = null;
    if (isHost) { tag = 'host opened'; tagColor = '#dc2626'; }
    if (d === pick && d !== hostOpens) tag = phase === 'result' && choice === 'switch' ? 'first pick' : 'your pick';
    if (phase === 'result' && d === finalPick) {
      tag = won ? 'you won! 🎉' : 'your door';
      tagColor = won ? '#16a34a' : INK;
      outcome = won ? 'win' : 'lose';
    }
    if (phase === 'result' && d === carDoor && d !== finalPick) { tag = 'the car'; tagColor = '#16a34a'; }
    return {
      label: DOOR_LABELS[d], seed: 20 + d * 111, open, content, tag, tagColor, outcome,
      clickable: phase === 'pick', onClick: () => choosePick(d),
    };
  };

  const resultLine = () => {
    if (!won && choice === 'stay') return 'A goat. You stayed — and staying only wins 1 in 3. Try switching next round.';
    if (won && choice === 'switch') return 'The car! You switched into the 2/3 chance the host handed you.';
    if (won && choice === 'stay') return 'The car — this time. Staying still only wins 1 in 3 over the long run; keep playing.';
    return 'A goat. You switched, and this was the unlucky 1 in 3 where your first pick was already right. Switching still wins more often — play on.';
  };

  return (
    <>
      <p style={{ textAlign: 'center', fontSize: 14.5, margin: '0 0 6px', maxWidth: 940, marginInline: 'auto' }}>
        {COPY.intro}
      </p>
      <p style={{ textAlign: 'center', fontSize: 14.5, margin: '0 0 12px', color: MARKER_BLUE }}>
        {COPY.guess}
      </p>

      {/* ---- the interactive game ---- */}
      <section style={{ ...sketchBoxStyle(0), padding: '12px 16px', maxWidth: 940, margin: '0 auto 16px' }}>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'flex-start' }}>
          {[0, 1, 2].map((d) => <Door key={d} {...doorProps(d)} />)}
        </div>

        {/* phase prompt + actions */}
        <div style={{ textAlign: 'center', marginTop: 6 }}>
          {phase === 'pick' && (
            <div style={{ fontSize: 16, color: MARKER_BLUE }}>{COPY.pickPrompt}</div>
          )}

          {phase === 'decide' && (
            <div className="fade-up">
              <div style={{ fontSize: 15.5, lineHeight: 1.3, marginBottom: 8 }}>{COPY.decidePrompt}</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  className="sketch-btn"
                  style={{ fontSize: 18, padding: '6px 22px' }}
                  onClick={() => decide('stay')}
                >
                  ✋ Stay with door {DOOR_LABELS[pick]}
                </button>
                <button
                  className="sketch-btn"
                  style={{ fontSize: 18, padding: '6px 22px', background: '#fef3c7', borderColor: MARKER_BLUE, color: MARKER_BLUE }}
                  onClick={() => decide('switch')}
                >
                  🔄 Switch to door {DOOR_LABELS[switchDoorFor(pick, hostOpens)]}
                </button>
              </div>
            </div>
          )}

          {phase === 'result' && (
            <div className="fade-up">
              <div
                key={seed}
                style={{
                  fontFamily: HAND, fontWeight: 700, fontSize: 26,
                  color: won ? '#16a34a' : '#dc2626',
                }}
              >
                {won ? 'You won the car!' : 'You got a goat.'}
              </div>
              <div style={{ fontSize: 14.5, lineHeight: 1.35, maxWidth: 620, margin: '2px auto 8px' }}>
                {resultLine()}
              </div>
              <button className="sketch-btn" style={{ fontSize: 17, padding: '5px 20px' }} onClick={playAgain}>
                ↻ {COPY.playAgain}
              </button>
            </div>
          )}
        </div>

        {/* your running scoreboard — every round scored three ways at once */}
        <div style={{ marginTop: 12, paddingTop: 8, borderTop: '2px dashed #ddd' }}>
          <div
            style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              gap: 8, flexWrap: 'wrap', marginBottom: 6,
            }}
          >
            <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: 22, color: MARKER_BLUE }}>
              Your scoreboard
              <span style={{ fontFamily: 'inherit', fontSize: 14, color: '#999', fontWeight: 400, marginLeft: 8 }}>
                {tally.games > 0
                  ? `${tally.games} ${tally.games === 1 ? 'round' : 'rounds'} — each scored 3 ways`
                  : 'play a round to start the tally'}
              </span>
            </div>
            <button
              className="sketch-btn"
              style={{ fontSize: 14, padding: '3px 14px' }}
              onClick={resetGame}
              disabled={tally.games === 0}
            >
              ✕ Reset
            </button>
          </div>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <TallyColumn
              label="You"
              sub="what you chose"
              wins={tally.yoursWins}
              games={tally.games}
              color="#16a34a"
              seedBase={700}
            />
            <TallyColumn
              label="Always stay"
              sub="aim: 33%"
              wins={tally.stayWins}
              games={tally.games}
              color={INK}
              seedBase={1400}
            />
            <TallyColumn
              label="Always switch"
              sub="aim: 67%"
              wins={tally.switchWins}
              games={tally.games}
              color={MARKER_BLUE}
              seedBase={2100}
            />
          </div>
        </div>
      </section>

      {/* ---- simulator ---- */}
      <section style={{ ...sketchBoxStyle(6), padding: '12px 18px', maxWidth: 940, margin: '0 auto 16px' }}>
        <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: 24, color: MARKER_BLUE }}>
          {COPY.simTitle}
        </div>
        <div style={{ fontSize: 14.5, marginBottom: 10 }}>{COPY.simBlurb}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <button className="sketch-btn" style={{ fontSize: 18, padding: '6px 22px' }} onClick={runSim}>
            🎲 Run {SIM_GAMES.toLocaleString('en-US')} games each way
          </button>
          <button
            className="sketch-btn"
            style={{ fontSize: 14, padding: '6px 16px' }}
            onClick={() => setSim(null)}
            disabled={!sim}
          >
            ✕ Reset
          </button>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          <TallyBars
            label="Always STAY"
            sub={`aim: ${formatPct(THEORY.stay)}`}
            wins={sim ? sim.stay : 0}
            games={sim ? SIM_GAMES : 0}
            color={INK}
          />
          <TallyBars
            label="Always SWITCH"
            sub={`aim: ${formatPct(THEORY.switch)}`}
            wins={sim ? sim.switch : 0}
            games={sim ? SIM_GAMES : 0}
            color={MARKER_BLUE}
          />
        </div>
        <div style={{ fontSize: 12.5, color: '#999', textAlign: 'center', marginTop: 6 }}>
          {sim ? `each tally mark ≈ ${PER_MARK} games` : COPY.simIdle}
        </div>
      </section>

      {/* ---- explainer ---- */}
      <section style={{ ...sketchBoxStyle(8), padding: '12px 18px', maxWidth: 940, margin: '0 auto 0' }}>
        <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: 24, color: MARKER_BLUE }}>
          {COPY.treeTitle}
        </div>
        <div style={{ fontSize: 14.5, marginBottom: 8 }}>{COPY.treeIntro}</div>
        <ExplainerTree />
        <div style={{ fontSize: 14.5, lineHeight: 1.4, marginTop: 6 }}>{COPY.why}</div>
        <div
          style={{
            background: '#fef9c3', border: '2px solid #d4b943', borderRadius: '2px 14px 3px 16px',
            boxShadow: '2px 3px 6px rgba(0,0,0,0.12)', transform: 'rotate(-0.4deg)',
            padding: '8px 14px', fontSize: 15, lineHeight: 1.35, marginTop: 10,
          }}
        >
          {COPY.whyKicker} <span style={{ color: INK }}>{COPY.treeFooter}</span>
        </div>
      </section>
    </>
  );
}

// One column of the live scoreboard: a big handwritten percentage over a
// hand-drawn tally (one mark per win, grouped in fives), inside a sketch box.
// One mark == one won round, so the marks ARE the numerator you can eyeball.
function TallyColumn({ label, sub, wins, games, color, seedBase }) {
  const marks = wins;
  const groups = Math.ceil(marks / 5);
  const perRow = 5; // up to 25 marks per row before wrapping
  const rows = Math.max(1, Math.ceil(groups / perRow));
  const groupW = 26;
  const rowH = 40;
  const markH = 26;
  const pad = 7;
  const width = perRow * groupW + pad * 2;
  const height = rows * rowH + pad;

  const strokes = [];
  for (let g = 0; g < groups; g += 1) {
    const count = Math.min(5, marks - g * 5);
    const col = g % perRow;
    const row = Math.floor(g / perRow);
    const gx = pad + col * groupW;
    const gy = pad + row * rowH;
    const uprights = Math.min(count, 4);
    for (let m = 0; m < uprights; m += 1) {
      strokes.push(
        <path
          key={`u-${g}-${m}`}
          d={roughLinePath(gx + m * 5, gy, gx + m * 5, gy + markH, seedBase + g * 7 + m, 1.1)}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />,
      );
    }
    if (count === 5) {
      strokes.push(
        <path
          key={`d-${g}`}
          d={roughLinePath(gx - 3, gy + markH, gx + 18, gy, seedBase + 300 + g, 1.2)}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />,
      );
    }
  }

  const rate = winRate(wins, games);
  return (
    <div style={{ ...sketchBoxStyle(seedBase), padding: '8px 12px 6px', textAlign: 'center', flex: '1 1 170px', minWidth: 150, maxWidth: 230 }}>
      <div style={{ fontSize: 14, color: INK }}>
        <b style={{ color }}>{label}</b>
      </div>
      <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: 40, lineHeight: 1, color, marginTop: 2 }}>
        {formatPct(rate)}
      </div>
      <div style={{ fontSize: 12.5, color: '#999', marginTop: 1 }}>{sub}</div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxHeight: rows > 1 ? 96 : 52, display: 'block', margin: '4px auto 0' }} aria-hidden="true">
        {strokes}
      </svg>
      <div style={{ fontSize: 13, color: '#999' }}>
        {games > 0 ? `${wins} / ${games} won` : 'no rounds yet'}
      </div>
    </div>
  );
}
