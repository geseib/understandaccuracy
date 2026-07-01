import { useState } from 'react';
import {
  thickness, formatHeight, MAX_FOLDS, MILESTONES, QUIZ, TRANSFER, SHEET_M, describeReach,
} from '../folding.js';
import { MARKER_BLUE, INK } from '../metrics.js';
import { sketchBoxStyle } from '../sketch.js';
import FoldTower from '../components/FoldTower.jsx';

function currentTakeaway(folds) {
  if (folds === 0) return 'A single sheet, 0.1 mm thick. Tap “Fold it!” and watch — at first, almost nothing happens.';
  const hit = [...MILESTONES].reverse().find((m) => folds >= m.folds);
  if (!hit) return 'See? Barely a sliver so far. This slow start is exactly why exponential growth fools us.';
  return `${folds} folds — ${hit.blurb}`;
}

export default function FoldPage() {
  const [folds, setFolds] = useState(0);
  const [guess, setGuess] = useState(null); // index of chosen quiz option

  const meters = thickness(folds);
  const reached = describeReach(meters);
  const set = (n) => setFolds(Math.max(0, Math.min(MAX_FOLDS, n)));

  return (
    <>
      <p style={{ textAlign: 'center', fontSize: 14.5, margin: '0 0 10px' }}>
        Fold a sheet of paper in half, again and again. Each fold just <b>doubles</b> the thickness —
        so how tall could it possibly get? Trust your gut first, then start folding.
      </p>

      {/* Step 1: commit to a guess (predict-then-reveal) */}
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
                {showResult && o.correct ? ' ✓' : ''}
              </button>
            );
          })}
        </div>
        {guess !== null && (
          <div className="fade-up" style={{ fontSize: 14.5, lineHeight: 1.35, marginTop: 6, color: guess === QUIZ.options.findIndex((o) => o.correct) ? '#15803d' : '#b45309' }}>
            {QUIZ.reveal}
          </div>
        )}
      </section>

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'stretch', justifyContent: 'center' }}>
        {/* left: controls + readout */}
        <div style={{ flex: '1 1 420px', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* big readout */}
          <div style={{ ...sketchBoxStyle(6), padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 16 }}>
              <b style={{ color: MARKER_BLUE }}>{folds}</b> {folds === 1 ? 'fold' : 'folds'}
              <span style={{ color: '#999', fontSize: 14 }}> · 0.1 mm × 2{toSup(folds)}</span>
            </div>
            <div style={{ fontFamily: "'Caveat', 'Comic Sans MS', 'Chalkboard SE', cursive", fontWeight: 700, fontSize: 48, color: INK, lineHeight: 1.05 }}>
              {formatHeight(meters)}
            </div>
            <div style={{ fontSize: 16, color: MARKER_BLUE }}>
              {reached.icon} {folds === 0 ? 'just one sheet' : `as tall as ${reached.label}`}
            </div>
          </div>

          {/* fold / unfold + slider */}
          <div style={{ ...sketchBoxStyle(7), padding: '12px 16px' }}>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="sketch-btn" style={{ fontSize: 20, padding: '6px 22px', background: '#fef3c7', borderColor: MARKER_BLUE, color: MARKER_BLUE }} onClick={() => set(folds + 1)}>
                📄 Fold it! (×2)
              </button>
              <button className="sketch-btn" onClick={() => set(folds - 1)}>↩ unfold</button>
              <button className="sketch-btn" onClick={() => set(0)}>flatten</button>
            </div>
            <input
              type="range"
              min="0"
              max={MAX_FOLDS}
              value={folds}
              onChange={(e) => set(Number(e.target.value))}
              style={{ width: '100%', marginTop: 12, accentColor: MARKER_BLUE }}
              aria-label="number of folds"
            />
            <div style={{ textAlign: 'center', fontSize: 12.5, color: '#999' }}>drag to leap ahead — 0 to {MAX_FOLDS} folds</div>
          </div>

          {/* milestone jumps */}
          <div style={{ ...sketchBoxStyle(8), padding: '10px 14px' }}>
            <div style={{ fontSize: 14, color: MARKER_BLUE, marginBottom: 6 }}><b>Jump to a milestone:</b></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
              {MILESTONES.map((m) => (
                <button
                  key={m.folds}
                  className={`sketch-btn${folds === m.folds ? ' active' : ''}`}
                  style={{ fontSize: 13.5, padding: '3px 10px' }}
                  onClick={() => set(m.folds)}
                >
                  {m.folds} folds
                </button>
              ))}
            </div>
          </div>

          {/* contextual takeaway */}
          <div
            key={currentTakeaway(folds)}
            className="fade-up"
            style={{
              background: '#fef9c3', border: '2px solid #d4b943', borderRadius: '2px 14px 3px 16px',
              boxShadow: '2px 3px 6px rgba(0,0,0,0.12)', transform: 'rotate(-0.4deg)',
              padding: '8px 14px', fontSize: 15, lineHeight: 1.35,
            }}
          >
            {currentTakeaway(folds)}
          </div>
        </div>

        {/* right: the tower */}
        <div style={{ ...sketchBoxStyle(9), padding: '6px 10px', flex: '0 1 380px', minWidth: 300 }}>
          <FoldTower folds={folds} />
        </div>
      </section>

      {/* transfer: it was never about paper */}
      <section style={{ ...sketchBoxStyle(0), padding: '12px 18px', margin: '16px auto 0', maxWidth: 940 }}>
        <div style={{ fontFamily: "'Caveat', 'Comic Sans MS', 'Chalkboard SE', cursive", fontWeight: 700, fontSize: 24, color: MARKER_BLUE }}>
          It was never really about paper.
        </div>
        <div style={{ fontSize: 14.5, marginBottom: 10 }}>
          Anything that <b>doubles</b> behaves like this — flat and forgettable, then suddenly everywhere:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
          {TRANSFER.map((t, i) => (
            <div key={t.label} style={{ ...sketchBoxStyle(i + 1), padding: '8px 12px', flex: '1 1 240px', minWidth: 220 }}>
              <div style={{ fontSize: 16, color: INK }}>{t.icon} <b style={{ color: MARKER_BLUE }}>{t.label}</b></div>
              <div style={{ fontSize: 13.5, lineHeight: 1.3 }}>{t.note}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

const SUPS = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
function toSup(n) {
  return String(n).split('').map((d) => SUPS[d]).join('');
}

export { SHEET_M };
