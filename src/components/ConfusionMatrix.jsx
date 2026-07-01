import { CELL_META, INK, MARKER_BLUE } from '../metrics.js';
import { sketchBoxStyle } from '../sketch.js';
import CountInput from './CountInput.jsx';

function Cell({ cellKey, value, onChange, boxIndex }) {
  const meta = CELL_META[cellKey];
  return (
    <div
      style={{
        ...sketchBoxStyle(boxIndex, meta.color),
        background: `${meta.color}18`,
        padding: '6px 10px 5px',
        textAlign: 'center',
        color: meta.color,
      }}
    >
      <div style={{ fontSize: 15, lineHeight: 1 }}>
        {meta.short} <span style={{ color: INK, fontSize: 12.5 }}>· {meta.blurb}</span>
      </div>
      <CountInput cellKey={cellKey} value={value} onChange={onChange} label={meta.name} />
    </div>
  );
}

export default function ConfusionMatrix({ cells, onChange }) {
  const header = { fontSize: 15, color: MARKER_BLUE, textAlign: 'center', alignSelf: 'end' };
  const sideHeader = { ...header, alignSelf: 'center', justifySelf: 'end', textAlign: 'right', lineHeight: 1.1 };

  return (
    <div style={{ ...sketchBoxStyle(5), padding: '10px 14px 12px', flex: '0 1 320px', minWidth: 280 }}>
      <div style={{ fontFamily: "'Caveat', 'Comic Sans MS', 'Chalkboard SE', cursive", fontSize: 23, fontWeight: 700, color: MARKER_BLUE }}>
        The confusion matrix
      </div>
      <div style={{ fontSize: 13.5, marginBottom: 6 }}>
        Type counts here or up on the line — everything updates live.
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '58px 1fr 1fr',
          gridTemplateRows: 'auto 1fr 1fr',
          gap: 8,
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
      <div style={{ fontSize: 12.5, marginTop: 8, color: '#555', lineHeight: 1.3 }}>
        <b style={{ color: INK }}>“Positive” = the thing you’re hunting for</b> — not “good”.
        A <span style={{ color: CELL_META.fp.color }}>false positive</span> is a false alarm; a{' '}
        <span style={{ color: CELL_META.fn.color }}>false negative</span> is a miss.
      </div>
    </div>
  );
}
