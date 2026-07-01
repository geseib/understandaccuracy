import { useMemo, useState } from 'react';
import {
  MONTHS, MAX_PEOPLE, CROSSOVER, MILESTONES, QUIZ, PAYOFF,
  seededBirthdays, birthdayProb, pairsCount, simulateRooms, nextSeed, dayLabel,
} from '../birthday.js';
import { MARKER_BLUE, INK, formatPct } from '../metrics.js';
import { roughLinePath, roughPolylinePath, roughRectPath, sketchBoxStyle } from '../sketch.js';

const CURSIVE = "'Caveat', 'Comic Sans MS', 'Chalkboard SE', cursive";
const HIT = '#dc2626'; // collision colour

// --- the little probability curve (n = 1..MAX_PEOPLE) ----------------------
function ProbCurve({ n, empirical }) {
  const W = 520, H = 172;
  const padL = 34, padR = 14, padT = 10, padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const x = (k) => padL + ((k - 1) / (MAX_PEOPLE - 1)) * plotW;
  const y = (p) => padT + (1 - p) * plotH;

  const points = [];
  for (let k = 1; k <= MAX_PEOPLE; k++) points.push([x(k), y(birthdayProb(k))]);

  const curP = birthdayProb(n);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
      {/* frame + gridlines */}
      <path d={roughLinePath(padL, padT, padL, padT + plotH, 31)} stroke={INK} strokeWidth="1.4" fill="none" />
      <path d={roughLinePath(padL, padT + plotH, W - padR, padT + plotH, 32)} stroke={INK} strokeWidth="1.4" fill="none" />
      {/* 50% guide line */}
      <path d={roughLinePath(padL, y(0.5), W - padR, y(0.5), 33)} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 4" fill="none" />
      {/* crossover marker at 23 */}
      <path d={roughLinePath(x(CROSSOVER), padT, x(CROSSOVER), padT + plotH, 34)} stroke={HIT} strokeWidth="1.1" strokeDasharray="3 4" fill="none" />
      {/* the curve */}
      <path d={roughPolylinePath(points, 7, 0.9)} stroke={MARKER_BLUE} strokeWidth="2.4" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {/* current-n marker */}
      <circle cx={x(n)} cy={y(curP)} r="5.5" fill="#fff" stroke={MARKER_BLUE} strokeWidth="2.2" />
      {/* empirical stamp from the 1000-room run */}
      {empirical && empirical.n === n && (
        <g>
          <circle cx={x(n)} cy={y(empirical.frac)} r="4.5" fill={HIT} opacity="0.85" />
          <text x={Math.min(x(n) + 8, W - 78)} y={y(empirical.frac) - 6} fontFamily={CURSIVE} fontSize="14" fill={HIT}>
            1000 rooms: {formatPct(empirical.frac)}
          </text>
        </g>
      )}
      {/* axis labels */}
      <text x={padL - 6} y={y(0) + 4} textAnchor="end" fontSize="11" fill="#64748b">0</text>
      <text x={padL - 6} y={y(0.5) + 4} textAnchor="end" fontSize="11" fill="#64748b">50%</text>
      <text x={padL - 6} y={y(1) + 4} textAnchor="end" fontSize="11" fill="#64748b">100%</text>
      <text x={padL} y={H - 6} textAnchor="middle" fontSize="11" fill="#64748b">1</text>
      <text x={W - padR} y={H - 6} textAnchor="middle" fontSize="11" fill="#64748b">{MAX_PEOPLE} people</text>
      <text x={x(CROSSOVER)} y={padT + 12} textAnchor="middle" fontFamily={CURSIVE} fontSize="15" fill={HIT}>crosses 50% at 23</text>
    </svg>
  );
}

// --- one hand-drawn month grid; collision cells get a red rough outline ----
function MonthCard({ month, index, counts }) {
  const CELL = 15, GAP = 2, COLS = 7;
  const rows = Math.ceil(month.days / COLS);
  return (
    <div style={{ ...sketchBoxStyle(index), padding: '5px 7px 7px' }}>
      <div style={{ fontFamily: CURSIVE, fontWeight: 700, fontSize: 15, color: MARKER_BLUE, lineHeight: 1 }}>
        {month.short}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
          gridAutoRows: `${CELL}px`,
          gap: GAP,
          marginTop: 3,
        }}
      >
        {Array.from({ length: rows * COLS }).map((_, slot) => {
          if (slot >= month.days) return <div key={slot} />;
          const dayIndex = month.start + slot;
          const cnt = counts[dayIndex] || 0;
          const collided = cnt >= 2;
          return (
            <div
              key={slot}
              title={cnt ? `${dayLabel(dayIndex)} — ${cnt} ${cnt === 1 ? 'person' : 'people'}` : dayLabel(dayIndex)}
              style={{
                position: 'relative',
                width: CELL,
                height: CELL,
                borderRadius: 3,
                background: collided ? '#fee2e2' : '#fafafa',
                border: '1px solid #ececec',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {collided && (
                <svg width={CELL} height={CELL} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
                  <path d={roughRectPath(1, 1, CELL - 2, CELL - 2, dayIndex, 1.1)} fill="none" stroke={HIT} strokeWidth="1.4" />
                </svg>
              )}
              {cnt === 1 && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: MARKER_BLUE }} />
              )}
              {collided && (
                <span style={{ fontFamily: CURSIVE, fontWeight: 700, fontSize: 12, color: HIT, lineHeight: 1 }}>{cnt}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BirthdayPage() {
  const [seed, setSeed] = useState(0x1a2b3c);
  const [n, setN] = useState(5);
  const [guess, setGuess] = useState(null);
  const [empirical, setEmpirical] = useState(null);

  // Pre-rolled, stable for a given room. Slider/Add just reveal more of it.
  const birthdays = useMemo(() => seededBirthdays(seed, MAX_PEOPLE), [seed]);

  // Occupancy of each day among the first n revealed people.
  const counts = useMemo(() => {
    const c = {};
    for (let i = 0; i < n; i++) {
      const d = birthdays[i];
      c[d] = (c[d] || 0) + 1;
    }
    return c;
  }, [birthdays, n]);

  const collisionDayCount = useMemo(
    () => Object.values(counts).filter((v) => v >= 2).length,
    [counts],
  );

  const prob = birthdayProb(n);
  const pairs = pairsCount(n);
  const set = (k) => setN(Math.max(1, Math.min(MAX_PEOPLE, k)));

  const newRoom = () => {
    setSeed((s) => nextSeed(s));
    setEmpirical(null);
  };

  const runSim = () => {
    // Use a seed derived from the room so the stamp is reproducible too.
    setEmpirical({ n, frac: simulateRooms(nextSeed(seed ^ 0x9e3779b9), n, 1000) });
  };

  const correctIdx = QUIZ.options.findIndex((o) => o.correct);

  return (
    <>
      <p style={{ textAlign: 'center', fontSize: 14.5, margin: '0 0 10px' }}>
        With <b>365</b> possible birthdays, surely you’d need hundreds of people before two of them
        collide? Add people one at a time and watch the calendar. It’s the hidden <b>pairs</b> that
        give the game away.
      </p>

      {/* Step 1: predict-then-reveal */}
      <section style={{ ...sketchBoxStyle(0), padding: '10px 16px', maxWidth: 880, margin: '0 auto 12px' }}>
        <div style={{ fontSize: 15.5, lineHeight: 1.3 }}>
          <b style={{ color: MARKER_BLUE, fontSize: 17 }}>First, a guess:</b> {QUIZ.prompt}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', margin: '8px 0 2px' }}>
          {QUIZ.options.map((o, i) => {
            const chosen = guess === i;
            const showResult = guess !== null;
            const bg = showResult ? (o.correct ? '#dcfce7' : chosen ? '#fee2e2' : '#fff') : '#fff';
            const border = showResult && o.correct ? '#16a34a' : chosen ? '#dc2626' : '#2b2b2b';
            return (
              <button
                key={o.label}
                className="sketch-btn"
                style={{ background: bg, borderColor: border, color: showResult && o.correct ? '#16a34a' : INK }}
                onClick={() => setGuess(i)}
              >
                {o.label}
                {showResult && o.correct ? ' 🎉' : ''}
              </button>
            );
          })}
        </div>
        {guess !== null && (
          <div className="fade-up" style={{ fontSize: 14.5, lineHeight: 1.35, marginTop: 6, color: guess === correctIdx ? '#15803d' : '#b45309' }}>
            {guess === correctIdx ? 'Exactly right — ' : ''}{QUIZ.reveal}
          </div>
        )}
      </section>

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'stretch', justifyContent: 'center' }}>
        {/* left: controls + live readout */}
        <div style={{ flex: '1 1 340px', minWidth: 290, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...sketchBoxStyle(6), padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 16 }}>
              <b style={{ color: MARKER_BLUE }}>{n}</b> {n === 1 ? 'person' : 'people'} in the room
            </div>
            <div style={{ fontFamily: CURSIVE, fontWeight: 700, fontSize: 46, color: collisionDayCount ? HIT : INK, lineHeight: 1.05 }}>
              {formatPct(prob)}
            </div>
            <div style={{ fontSize: 14.5, color: MARKER_BLUE }}>
              chance of a shared birthday
            </div>
          </div>

          {/* pairs — the real engine */}
          <div style={{ ...sketchBoxStyle(2), padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 14.5 }}>
              {n} people = <b>{n}×{n - 1}/2</b> =
            </div>
            <div style={{ fontFamily: CURSIVE, fontWeight: 700, fontSize: 30, color: HIT, lineHeight: 1.1 }}>
              {pairs.toLocaleString('en-US')} pairs
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              {collisionDayCount > 0
                ? `${collisionDayCount} day${collisionDayCount === 1 ? '' : 's'} already shared 🔴`
                : 'each pair is its own tiny lottery'}
            </div>
          </div>

          {/* add / slider */}
          <div style={{ ...sketchBoxStyle(7), padding: '12px 16px' }}>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="sketch-btn" style={{ fontSize: 18, padding: '6px 18px', background: '#fef3c7', borderColor: MARKER_BLUE, color: MARKER_BLUE }} onClick={() => set(n + 1)}>
                🧍 Add person
              </button>
              <button className="sketch-btn" onClick={() => set(n - 1)}>↩ remove</button>
              <button className="sketch-btn" onClick={newRoom}>🔄 New room</button>
            </div>
            <input
              type="range"
              min="1"
              max={MAX_PEOPLE}
              value={n}
              onChange={(e) => set(Number(e.target.value))}
              style={{ width: '100%', marginTop: 12, accentColor: MARKER_BLUE }}
              aria-label="number of people in the room"
            />
            <div style={{ textAlign: 'center', fontSize: 12.5, color: '#999' }}>drag to fill the room — 1 to {MAX_PEOPLE} people</div>
          </div>

          {/* milestone jumps */}
          <div style={{ ...sketchBoxStyle(8), padding: '10px 14px' }}>
            <div style={{ fontSize: 14, color: MARKER_BLUE, marginBottom: 6 }}><b>Jump to:</b></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
              {MILESTONES.map((m) => (
                <button
                  key={m}
                  className={`sketch-btn${n === m ? ' active' : ''}`}
                  style={{ fontSize: 13.5, padding: '3px 10px' }}
                  onClick={() => set(m)}
                >
                  {m}{m === CROSSOVER ? ' ⭐' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* right: THE CALENDAR — the mechanism itself */}
        <div style={{ ...sketchBoxStyle(9), padding: '10px 12px', flex: '1 1 520px', minWidth: 300 }}>
          <div style={{ fontFamily: CURSIVE, fontWeight: 700, fontSize: 20, color: INK, marginBottom: 4 }}>
            The room’s birthdays 🎂
          </div>
          <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 8 }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: MARKER_BLUE, marginRight: 4 }} />
            one person &nbsp;·&nbsp;
            <span style={{ color: HIT, fontWeight: 700 }}>▢ red box</span> = a shared day (collision)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
            {MONTHS.map((m, i) => (
              <MonthCard key={m.name} month={m} index={i} counts={counts} />
            ))}
          </div>
        </div>
      </section>

      {/* probability curve + Monte-Carlo check */}
      <section style={{ ...sketchBoxStyle(3), padding: '12px 18px', margin: '16px auto 0', maxWidth: 940 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: CURSIVE, fontWeight: 700, fontSize: 22, color: MARKER_BLUE }}>
            The chance climbs shockingly fast
          </div>
          <button className="sketch-btn" style={{ fontSize: 13.5, padding: '4px 12px' }} onClick={runSim}>
            🎲 Run 1000 rooms of {n}
          </button>
        </div>
        <ProbCurve n={n} empirical={empirical} />
        <div style={{ fontSize: 13.5, color: '#64748b', textAlign: 'center', marginTop: 2 }}>
          {empirical && empirical.n === n
            ? `Simulated 1000 random rooms of ${n}: ${formatPct(empirical.frac)} had a match — right on the theoretical ${formatPct(prob)}.`
            : `Theory says ${formatPct(prob)} at ${n} people. Hit “Run 1000 rooms” to watch the dice agree.`}
        </div>
      </section>

      {/* payoff copy — only once the collisions have shown up */}
      {collisionDayCount > 0 && (
        <section
          key="payoff"
          className="fade-up"
          style={{
            background: '#fef9c3', border: '2px solid #d4b943', borderRadius: '2px 14px 3px 16px',
            boxShadow: '2px 3px 6px rgba(0,0,0,0.12)', transform: 'rotate(-0.4deg)',
            padding: '10px 16px', fontSize: 15, lineHeight: 1.4, maxWidth: 940, margin: '16px auto 0',
          }}
        >
          {PAYOFF}
        </section>
      )}
    </>
  );
}
