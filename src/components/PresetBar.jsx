import { PRESETS } from '../metrics.js';

export default function PresetBar({ activeName, onPick }) {
  const active = PRESETS.find((p) => p.name === activeName);
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            className={`sketch-btn${p.name === activeName ? ' active' : ''}`}
            onClick={() => onPick(p)}
          >
            {p.name}
          </button>
        ))}
      </div>
      {/* fixed-height slot so the note appearing/vanishing doesn't shift the page */}
      <div style={{ minHeight: 44, marginTop: 8 }}>
        {active && (
          <div
            key={active.name}
            className="fade-up"
            style={{
              margin: '0 auto',
              maxWidth: 760,
              background: '#fef9c3',
              border: '2px solid #d4b943',
              borderRadius: '2px 14px 3px 16px',
              boxShadow: '2px 3px 6px rgba(0,0,0,0.12)',
              transform: 'rotate(-0.4deg)',
              padding: '6px 14px',
              fontSize: 15.5,
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
