import { useEffect, useState } from 'react';
import { CELL_META, INK, MARKER_BLUE } from '../metrics.js';
import { sketchBoxStyle } from '../sketch.js';

const MAX = 1000000;

function clampCount(raw) {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX);
}

function Cell({ cellKey, value, onChange, boxIndex }) {
  const meta = CELL_META[cellKey];
  // Keep the raw string locally so an emptied field doesn't snap back to 0
  // while the user is still typing.
  const [text, setText] = useState(String(value));
  useEffect(() => {
    if (clampCount(text) !== value) setText(String(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        ...sketchBoxStyle(boxIndex, meta.color),
        background: `${meta.color}18`,
        padding: '10px 12px 8px',
        textAlign: 'center',
        color: meta.color,
      }}
    >
      <div style={{ fontSize: 17, lineHeight: 1 }}>
        {meta.short} <span style={{ color: INK, fontSize: 14 }}>· {meta.blurb}</span>
      </div>
      <input
        className="cell-input"
        type="number"
        min="0"
        value={text}
        aria-label={meta.name}
        onChange={(e) => {
          setText(e.target.value);
          onChange(cellKey, clampCount(e.target.value));
        }}
        onBlur={() => setText(String(value))}
      />
    </div>
  );
}

export default function ConfusionMatrix({ cells, onChange }) {
  const header = { fontSize: 17, color: MARKER_BLUE, textAlign: 'center', alignSelf: 'end' };
  const sideHeader = { ...header, alignSelf: 'center', justifySelf: 'end', textAlign: 'right', lineHeight: 1.1 };

  return (
    <div style={{ ...sketchBoxStyle(5), padding: '14px 16px 18px', flex: '0 1 360px', minWidth: 300 }}>
      <div style={{ fontFamily: "'Caveat', 'Comic Sans MS', 'Chalkboard SE', cursive", fontSize: 28, fontWeight: 700, color: MARKER_BLUE }}>
        The confusion matrix
      </div>
      <div style={{ fontSize: 15, marginBottom: 8 }}>
        Type your own counts — everything updates live.
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '64px 1fr 1fr',
          gridTemplateRows: 'auto 1fr 1fr',
          gap: 10,
          alignItems: 'stretch',
        }}
      >
        <div />
        <div style={header}>predicted +</div>
        <div style={header}>predicted −</div>
        <div style={sideHeader}>actually<br />+</div>
        <Cell cellKey="tp" value={cells.tp} onChange={onChange} boxIndex={1} />
        <Cell cellKey="fn" value={cells.fn} onChange={onChange} boxIndex={2} />
        <div style={sideHeader}>actually<br />−</div>
        <Cell cellKey="fp" value={cells.fp} onChange={onChange} boxIndex={3} />
        <Cell cellKey="tn" value={cells.tn} onChange={onChange} boxIndex={4} />
      </div>
      <div style={{ fontSize: 14, marginTop: 12, color: '#555', lineHeight: 1.35 }}>
        <b style={{ color: INK }}>“Positive” = the thing you’re hunting for</b> — not “good”.
        A <span style={{ color: CELL_META.fp.color }}>false positive</span> is a false alarm; a{' '}
        <span style={{ color: CELL_META.fn.color }}>false negative</span> is a miss.
      </div>
    </div>
  );
}
