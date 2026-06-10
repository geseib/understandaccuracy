import { CELL_META, INK, MARKER_BLUE, formatPct } from '../metrics.js';
import { sketchBoxStyle } from '../sketch.js';

// Small rotated color square, like the green/red highlights next to the
// formulas on the whiteboard.
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

// Renders a formula part list like ['2×','tp','+','fp'] with live numbers
// and color chips for the cells.
function FormulaRow({ parts, cells }) {
  return parts.map((part, i) => {
    if (part in cells) {
      const meta = CELL_META[part];
      return (
        <span key={i} style={{ color: meta.color, whiteSpace: 'nowrap' }}>
          <Chip cellKey={part} />
          {cells[part]}
        </span>
      );
    }
    return (
      <span key={i} style={{ color: INK, margin: '0 3px' }}>
        {part}
      </span>
    );
  });
}

export default function MetricCard({ def, cells, value, boxIndex }) {
  const isUndefined = value === null;
  return (
    <div
      style={{
        ...sketchBoxStyle(boxIndex),
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <div style={{ fontFamily: "'Caveat', 'Comic Sans MS', 'Chalkboard SE', cursive", fontSize: 22, fontWeight: 700, color: MARKER_BLUE, lineHeight: 1 }}>
        {def.name}
        {def.alias && (
          <span style={{ fontFamily: "'Patrick Hand', 'Comic Sans MS', 'Chalkboard SE', cursive", fontSize: 11.5, color: '#777', marginLeft: 5 }}>
            {def.alias}
          </span>
        )}
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.25 }}>{def.question}</div>

      <div style={{ fontFamily: "'Caveat', 'Comic Sans MS', 'Chalkboard SE', cursive", fontSize: 19, fontWeight: 500 }}>
        <span style={{ display: 'inline-block', textAlign: 'center', verticalAlign: 'middle' }}>
          <span style={{ display: 'block', padding: '0 5px' }}>
            <FormulaRow parts={def.formula} cells={cells} />
          </span>
          <span style={{ display: 'block', borderTop: `2px solid ${INK}`, padding: '0 5px' }}>
            <FormulaRow parts={def.denomFormula} cells={cells} />
          </span>
        </span>
        <span style={{ margin: '0 7px', verticalAlign: 'middle' }}>=</span>
        <span
          className="pop-in"
          key={isUndefined ? '—' : value}
          style={{
            fontSize: 38,
            fontWeight: 700,
            color: isUndefined ? '#999' : INK,
            verticalAlign: 'middle',
          }}
        >
          {formatPct(value)}
        </span>
      </div>

      <div style={{ fontSize: 12, color: isUndefined ? '#b45309' : '#777', marginTop: 'auto', lineHeight: 1.25 }}>
        {isUndefined ? def.undefinedNote : def.caution}
      </div>
    </div>
  );
}
