import { useMemo, useState } from 'react';
import { INK, MARKER_BLUE, BOARD_BG, formatPct, CELL_META } from '../metrics.js';
import { roughRectPath, roughBracketPath, sketchBoxStyle } from '../sketch.js';
import {
  N,
  RANGES,
  compute,
  formatCount,
  oddsText,
  PREVALENCE_CHIPS,
  SCENARIOS,
  COPY,
} from '../positivetest.js';

const CAVEAT = "'Caveat', 'Comic Sans MS', 'Chalkboard SE', cursive";
const PATRICK = "'Patrick Hand', 'Comic Sans MS', 'Chalkboard SE', cursive";
const PRED_POS_COLOR = '#7c3aed'; // "tested positive" bracket, matching PopulationLine
const SICK_COLOR = MARKER_BLUE;
const HEALTHY_COLOR = '#94a3b8';

// Same segment order as the Accuracy page's population line: FN, TP, FP, TN.
// It keeps "truly sick" (fn+tp) and "tested positive" (tp+fp) each contiguous,
// overlapping exactly on TP.
const LINE = ['fn', 'tp', 'fp', 'tn'];

// Captions get a board-colored halo so leader lines never hurt legibility.
const halo = { paintOrder: 'stroke', stroke: BOARD_BG, strokeWidth: 5, strokeLinejoin: 'round' };

// Proportional widths, but every nonzero segment keeps a visible sliver,
// paid for by shrinking the wider segments. (Mirrors PopulationLine.)
function layout(counts, total, barW, minW) {
  if (total === 0) return counts.map(() => 0);
  const raw = counts.map((c) => (c / total) * barW);
  const widths = raw.map((w, i) => (counts[i] > 0 ? Math.max(w, minW) : 0));
  const deficit = widths.reduce((s, w, i) => s + (w - raw[i]), 0);
  if (deficit > 0) {
    const donors = raw.map((w, i) => (widths[i] > minW ? w - minW : 0));
    const donorTotal = donors.reduce((s, d) => s + d, 0);
    if (donorTotal >= deficit) {
      donors.forEach((d, i) => {
        if (d > 0) widths[i] -= (deficit * d) / donorTotal;
      });
    }
  }
  return widths;
}

function Bracket({ x1, x2, y, dir, color, caption, captionY, seed }) {
  const w = x2 - x1;
  if (w < 4) {
    return (
      <text x={x1} y={captionY} textAnchor="middle" fill={color} style={{ fontSize: 15, ...halo }}>
        {caption}
      </text>
    );
  }
  return (
    <g>
      <path d={roughBracketPath(x1, x2, y, dir, 8, seed)} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <text x={(x1 + x2) / 2} y={captionY} textAnchor="middle" fill={color} style={{ fontSize: 15, ...halo }}>
        {caption}
      </text>
    </g>
  );
}

// One colored, hand-drawn segment of a bar: faint fill + wobbly outline.
function Segment({ x, y, w, h, color, seed }) {
  if (w <= 0.5) return null;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={color} opacity="0.28" />
      <path d={roughRectPath(x, y, w, h, seed)} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}

// Bar 1: all 10,000 people. A tiny sick sliver on the left, a vast healthy
// slab on the right; inside them TP glows green and a thin FP lights up red.
function PopulationBar({ r }) {
  const VIEW_W = 960;
  const VIEW_H = 214;
  const BAR_X = 48;
  const BAR_W = 864;
  const BAR_Y = 92;
  const BAR_H = 46;

  const counts = LINE.map((k) => r[k]);
  const widths = layout(counts, N, BAR_W, 8);
  let cursor = BAR_X;
  const segs = LINE.map((key, i) => {
    const x0 = cursor;
    cursor += widths[i];
    return { key, x0, x1: cursor, mid: (x0 + cursor) / 2, w: widths[i], count: counts[i] };
  });
  const seg = Object.fromEntries(segs.map((s) => [s.key, s]));

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} style={{ width: '100%', display: 'block' }}>
      {/* group brackets above: truly sick (fn+tp) and healthy (fp+tn) */}
      <Bracket x1={seg.fn.x0} x2={seg.tp.x1} y={70} dir={1} color={SICK_COLOR} caption={`truly sick: ${formatCount(r.sick)}`} captionY={58} seed={31} />
      <Bracket x1={seg.fp.x0} x2={seg.tn.x1} y={70} dir={1} color={HEALTHY_COLOR} caption={`healthy: ${formatCount(r.healthy)}`} captionY={58} seed={37} />

      {/* the population bar */}
      {segs.map((s, i) => (
        <Segment key={s.key} x={s.x0} y={BAR_Y} w={s.w} h={BAR_H} color={CELL_META[s.key].color} seed={i + 3} />
      ))}
      {/* second marker pass over the whole bar for the hand-drawn feel */}
      <path d={roughRectPath(BAR_X, BAR_Y, BAR_W, BAR_H, 8)} fill="none" stroke={INK} strokeWidth="1.4" opacity="0.5" strokeLinecap="round" />

      {/* counts printed inside segments wide enough to hold them */}
      {segs.map((s) =>
        s.w > 34 ? (
          <text key={s.key} x={s.mid} y={BAR_Y + BAR_H / 2 + 5} textAnchor="middle" fill={CELL_META[s.key].color} style={{ fontFamily: CAVEAT, fontWeight: 700, fontSize: 18, ...halo }}>
            {formatCount(s.count)}
          </text>
        ) : null,
      )}

      {/* "tested positive" bracket below: overlaps the sick bracket on TP */}
      <Bracket x1={seg.tp.x0} x2={seg.fp.x1} y={BAR_Y + BAR_H + 14} dir={-1} color={PRED_POS_COLOR} caption={`tested positive: ${formatCount(r.positives)}  (${formatCount(r.tp)} sick + ${formatCount(r.fp)} false alarms)`} captionY={BAR_Y + BAR_H + 38} seed={41} />

      {/* footnote */}
      <text x={BAR_X} y={VIEW_H - 8} fill="#777" style={{ fontSize: 14.5, ...halo }}>
        whole bar = 10,000 people · base rate {formatPct(r.prevalence, 1)} truly sick
      </text>
      <text x={BAR_X + BAR_W} y={VIEW_H - 8} textAnchor="end" fill="#777" style={{ fontSize: 14.5, ...halo }}>
        tested negative: everyone else ({formatCount(r.negatives)})
      </text>
    </svg>
  );
}

// Bar 2: the reveal. Only the people who tested positive, at true proportion —
// the green "actually sick" wedge sits shockingly thin beside the false alarms.
function RevealBar({ r }) {
  const VIEW_W = 520;
  const VIEW_H = 96;
  const X = 12;
  const BW = 496;
  const Y = 24;
  const BH = 40;

  if (r.positives === 0) {
    return (
      <div style={{ fontSize: 15, color: '#888', padding: '18px 4px' }}>
        With these settings the test never comes back positive — nobody to zoom in on.
      </div>
    );
  }

  const [tpw, fpw] = layout([r.tp, r.fp], r.positives, BW, 7);

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} style={{ width: '100%', display: 'block' }}>
      <Segment x={X} y={Y} w={tpw} h={BH} color={CELL_META.tp.color} seed={51} />
      <Segment x={X + tpw} y={Y} w={fpw} h={BH} color={CELL_META.fp.color} seed={52} />
      <path d={roughRectPath(X, Y, BW, BH, 9)} fill="none" stroke={INK} strokeWidth="1.4" opacity="0.5" strokeLinecap="round" />

      {tpw > 2 && (
        <text x={X + tpw / 2} y={Y + BH + 18} textAnchor="middle" fill={CELL_META.tp.color} style={{ fontSize: 13.5, ...halo }}>
          actually sick: {formatCount(r.tp)}
        </text>
      )}
      {fpw > 2 && (
        <text x={X + tpw + fpw / 2} y={Y + BH + 18} textAnchor="middle" fill={CELL_META.fp.color} style={{ fontSize: 13.5, ...halo }}>
          false alarms: {formatCount(r.fp)}
        </text>
      )}
      <text x={X} y={16} fill="#777" style={{ fontSize: 13 }}>
        every head here got a POSITIVE result
      </text>
    </svg>
  );
}

// Little rotated color square, like the highlights on the whiteboard.
function Chip({ cellKey }) {
  const meta = CELL_META[cellKey];
  return (
    <span
      title={meta.name}
      style={{
        display: 'inline-block',
        width: 11,
        height: 11,
        margin: '0 3px -1px',
        background: `${meta.color}59`,
        border: `2px solid ${meta.color}`,
        transform: 'rotate(2deg)',
        borderRadius: 2,
      }}
    />
  );
}

function LegendItem({ cellKey, text }) {
  return (
    <span style={{ fontSize: 13, color: '#555', whiteSpace: 'nowrap' }}>
      <Chip cellKey={cellKey} /> {text}
    </span>
  );
}

function Slider({ label, sub, color, value, min, max, step, display, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 14.5 }}>
          <b style={{ color }}>{label}</b> <span style={{ color: '#999', fontSize: 12 }}>{sub}</span>
        </span>
        <span style={{ fontFamily: CAVEAT, fontWeight: 700, fontSize: 23, color: INK, lineHeight: 1 }}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color, marginTop: 2 }}
        aria-label={label}
      />
    </div>
  );
}

const approx = (a, b) => Math.abs(a - b) < 1e-6;

export default function PositiveTestPage() {
  const [prevalence, setPrevalence] = useState(RANGES.prevalence.default);
  const [sensitivity, setSensitivity] = useState(RANGES.sensitivity.default);
  const [specificity, setSpecificity] = useState(RANGES.specificity.default);

  const r = useMemo(
    () => compute({ prevalence, sensitivity, specificity }),
    [prevalence, sensitivity, specificity],
  );

  // The payoff, made live: the SAME setup but with sensitivity maxed out.
  const maxed = useMemo(
    () => compute({ prevalence, sensitivity: RANGES.sensitivity.max, specificity }),
    [prevalence, specificity],
  );

  const applyScenario = (s) => {
    setPrevalence(s.prevalence);
    setSensitivity(s.sensitivity);
    setSpecificity(s.specificity);
  };

  const activeScenario = SCENARIOS.find(
    (s) => approx(s.prevalence, prevalence) && approx(s.sensitivity, sensitivity) && approx(s.specificity, specificity),
  );

  return (
    <>
      <p style={{ textAlign: 'center', fontSize: 14.5, margin: '0 0 10px', maxWidth: 940, marginInline: 'auto' }}>
        {COPY.intro}
      </p>

      {/* Controls: three sliders + base-rate chips + one-click scenarios */}
      <section style={{ ...sketchBoxStyle(0), padding: '12px 18px', maxWidth: 1000, margin: '0 auto 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px 26px' }}>
          <Slider
            label="Base rate (prevalence)"
            sub="how common the condition is"
            color={SICK_COLOR}
            value={prevalence}
            min={RANGES.prevalence.min}
            max={RANGES.prevalence.max}
            step={RANGES.prevalence.step}
            display={formatPct(prevalence, 1)}
            onChange={setPrevalence}
          />
          <Slider
            label="Sensitivity"
            sub="true-positive rate — catches the sick"
            color={CELL_META.tp.color}
            value={sensitivity}
            min={RANGES.sensitivity.min}
            max={RANGES.sensitivity.max}
            step={RANGES.sensitivity.step}
            display={formatPct(sensitivity, 1)}
            onChange={setSensitivity}
          />
          <Slider
            label="Specificity"
            sub="true-negative rate — clears the healthy"
            color={CELL_META.tn.color}
            value={specificity}
            min={RANGES.specificity.min}
            max={RANGES.specificity.max}
            step={RANGES.specificity.step}
            display={formatPct(specificity, 1)}
            onChange={setSpecificity}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 13.5, color: '#777' }}>base rate:</span>
          {PREVALENCE_CHIPS.map((c) => (
            <button
              key={c.label}
              className={`sketch-btn${approx(prevalence, c.value) ? ' active' : ''}`}
              style={{ fontSize: 13.5, padding: '3px 10px' }}
              onClick={() => setPrevalence(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 13.5, color: '#777' }}>scenarios:</span>
          {SCENARIOS.map((s) => (
            <button
              key={s.name}
              className={`sketch-btn${activeScenario && activeScenario.name === s.name ? ' active' : ''}`}
              style={{ fontSize: 13.5, padding: '3px 10px' }}
              onClick={() => applyScenario(s)}
            >
              {s.name}
            </button>
          ))}
        </div>

        {activeScenario && (
          <div key={activeScenario.name} className="fade-up" style={{ fontSize: 14, color: '#555', marginTop: 8, lineHeight: 1.35 }}>
            {activeScenario.blurb}
          </div>
        )}
      </section>

      {/* Bar 1: run the test on all 10,000 */}
      <section style={{ ...sketchBoxStyle(6), padding: '8px 12px 4px', maxWidth: 1020, margin: '0 auto 14px' }}>
        <div style={{ fontFamily: CAVEAT, fontWeight: 700, fontSize: 21, color: MARKER_BLUE, padding: '2px 6px 0' }}>
          {COPY.everyoneLabel}
        </div>
        <PopulationBar r={r} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', justifyContent: 'center', padding: '0 6px 6px' }}>
          <LegendItem cellKey="tp" text="sick & correctly flagged" />
          <LegendItem cellKey="fn" text="sick but missed" />
          <LegendItem cellKey="fp" text="healthy — false alarm" />
          <LegendItem cellKey="tn" text="healthy & cleared" />
        </div>
      </section>

      {/* The reveal: zoom into the positives, then the Bayes card */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'stretch', maxWidth: 1020, margin: '0 auto' }}>
        <div style={{ ...sketchBoxStyle(7), padding: '10px 16px', flex: '1 1 460px', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontFamily: CAVEAT, fontWeight: 700, fontSize: 21, color: PRED_POS_COLOR }}>
            {COPY.positivesLabel}
          </div>
          <RevealBar r={r} />
          <div style={{ textAlign: 'center', marginTop: 2 }}>
            <div style={{ fontSize: 14.5, color: '#555' }}>{COPY.headlineLead}</div>
            <div
              className="pop-in"
              key={r.pSickGivenPositive === null ? '—' : r.pSickGivenPositive}
              style={{ fontFamily: CAVEAT, fontWeight: 700, fontSize: 60, color: INK, lineHeight: 1.02 }}
            >
              {formatPct(r.pSickGivenPositive)}
            </div>
            <div style={{ fontSize: 15, color: MARKER_BLUE }}>
              {r.pSickGivenPositive === null
                ? 'no positive results to judge'
                : `${oddsText(r.pSickGivenPositive)} of the people the test flags is truly sick`}
            </div>
          </div>
        </div>

        {/* Bayes fraction card, mirroring MetricCard */}
        <div style={{ ...sketchBoxStyle(8), padding: '10px 14px', flex: '1 1 360px', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontFamily: CAVEAT, fontSize: 22, fontWeight: 700, color: MARKER_BLUE, lineHeight: 1 }}>
            {COPY.bayesTitle}
            <span style={{ fontFamily: PATRICK, fontSize: 11.5, color: '#777', marginLeft: 6 }}>P(sick | positive)</span>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.25 }}>{COPY.bayesQuestion}</div>

          <div style={{ fontFamily: CAVEAT, fontSize: 19, fontWeight: 500, margin: '2px 0' }}>
            <span style={{ display: 'inline-block', textAlign: 'center', verticalAlign: 'middle' }}>
              <span style={{ display: 'block', padding: '0 5px', color: CELL_META.tp.color, whiteSpace: 'nowrap' }}>
                <Chip cellKey="tp" />
                {formatCount(r.tp)}
              </span>
              <span style={{ display: 'block', borderTop: `2px solid ${INK}`, padding: '0 5px', whiteSpace: 'nowrap' }}>
                <span style={{ color: CELL_META.tp.color }}>
                  <Chip cellKey="tp" />
                  {formatCount(r.tp)}
                </span>
                <span style={{ color: INK, margin: '0 3px' }}>+</span>
                <span style={{ color: CELL_META.fp.color }}>
                  <Chip cellKey="fp" />
                  {formatCount(r.fp)}
                </span>
              </span>
            </span>
            <span style={{ margin: '0 7px', verticalAlign: 'middle' }}>=</span>
            <span
              className="pop-in"
              key={r.pSickGivenPositive === null ? '—' : r.pSickGivenPositive}
              style={{ fontSize: 38, fontWeight: 700, color: r.pSickGivenPositive === null ? '#999' : INK, verticalAlign: 'middle' }}
            >
              {formatPct(r.pSickGivenPositive)}
            </span>
          </div>

          <div style={{ fontSize: 12, color: '#777', lineHeight: 1.25 }}>{COPY.bayesCaution}</div>
          <div style={{ fontSize: 12.5, color: '#555', marginTop: 'auto', paddingTop: 4, borderTop: '1px dashed #ccc', lineHeight: 1.3 }}>
            {COPY.flipSide}{' '}
            <b style={{ color: CELL_META.tn.color }}>{formatPct(r.pHealthyGivenNegative)}</b> chance a negative really is healthy
            {r.pHealthyGivenNegative !== null && ` (${oddsText(1 - r.pHealthyGivenNegative)} negatives is a missed case)`}.
          </div>
        </div>
      </section>

      {/* The payoff: a sharper test barely helps */}
      <section
        className="fade-up"
        style={{
          background: '#fef9c3',
          border: '2px solid #d4b943',
          borderRadius: '2px 16px 3px 16px',
          boxShadow: '2px 3px 6px rgba(0,0,0,0.12)',
          transform: 'rotate(-0.3deg)',
          padding: '12px 18px',
          margin: '16px auto 0',
          maxWidth: 1000,
        }}
      >
        <div style={{ fontFamily: CAVEAT, fontWeight: 700, fontSize: 24, color: '#b45309' }}>
          {COPY.payoffTitle}
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.4, margin: '2px 0 8px' }}>{COPY.payoff}</div>
        <div style={{ fontSize: 14.5, color: '#3f3f46' }}>
          At this base rate, dialing sensitivity up to <b>{formatPct(RANGES.sensitivity.max, 1)}</b> only nudges the headline from{' '}
          <b style={{ color: INK }}>{formatPct(r.pSickGivenPositive)}</b> to{' '}
          <b style={{ color: INK }}>{formatPct(maxed.pSickGivenPositive)}</b> — practically nowhere.
        </div>
      </section>
    </>
  );
}
