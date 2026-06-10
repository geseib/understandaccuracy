import { POPULATIONS, MODELS, MARKER_BLUE, INK } from '../metrics.js';
import CountInput from './CountInput.jsx';

const NEG_COLOR = '#64748b';

const rowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  alignItems: 'center',
  justifyContent: 'center',
};

const totalInputStyle = {
  width: 88,
  fontSize: 24,
  display: 'inline-block',
};

export default function Controls({ pos, neg, activeModel, onTotalsChange, onPopPick, onModelPick }) {
  const active = MODELS.find((m) => m.name === activeModel);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={rowStyle}>
        <span style={{ fontSize: 16, color: INK }}>
          <b style={{ color: MARKER_BLUE }}>1. The population:</b>
        </span>
        <CountInput
          cellKey="pos"
          value={pos}
          onChange={(_, v) => onTotalsChange('pos', v)}
          label="truly positive total"
          style={{ ...totalInputStyle, color: MARKER_BLUE, borderBottomColor: MARKER_BLUE }}
        />
        <span style={{ fontSize: 16, color: MARKER_BLUE }}>truly positive</span>
        <span style={{ fontSize: 16 }}>+</span>
        <CountInput
          cellKey="neg"
          value={neg}
          onChange={(_, v) => onTotalsChange('neg', v)}
          label="truly negative total"
          style={{ ...totalInputStyle, color: NEG_COLOR, borderBottomColor: NEG_COLOR }}
        />
        <span style={{ fontSize: 16, color: NEG_COLOR }}>truly negative</span>
        <span style={{ fontSize: 14, color: '#999', margin: '0 2px 0 8px' }}>quick mixes:</span>
        {POPULATIONS.map((p) => (
          <button
            key={p.name}
            className={`sketch-btn${p.pos === pos && p.neg === neg ? ' active' : ''}`}
            style={{ fontSize: 13.5, padding: '2px 9px' }}
            onClick={() => onPopPick(p)}
          >
            {p.name} ({p.pos}+{p.neg})
          </button>
        ))}
      </div>

      <div style={rowStyle}>
        <span style={{ fontSize: 16 }}>
          <b style={{ color: MARKER_BLUE }}>2. The model:</b>
        </span>
        {MODELS.map((m) => (
          <button
            key={m.name}
            className={`sketch-btn${m.name === activeModel ? ' active' : ''}`}
            title={`catches ${Math.round(m.recallRate * 100)}% of positives · false-alarms on ${m.fpRate * 100}% of negatives`}
            onClick={() => onModelPick(m)}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* fixed-height slot so the note appearing/vanishing doesn't shift the page */}
      <div style={{ minHeight: 40 }}>
        {active && (
          <div
            key={active.name}
            className="fade-up"
            style={{
              margin: '0 auto',
              maxWidth: 780,
              background: '#fef9c3',
              border: '2px solid #d4b943',
              borderRadius: '2px 14px 3px 16px',
              boxShadow: '2px 3px 6px rgba(0,0,0,0.12)',
              transform: 'rotate(-0.4deg)',
              padding: '5px 14px',
              fontSize: 15,
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            {active.takeaway}
          </div>
        )}
      </div>
    </div>
  );
}
