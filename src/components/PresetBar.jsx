import { PRESETS } from '../metrics.js';

export default function PresetBar({ activeName, onPick }) {
  const active = PRESETS.find((p) => p.name === activeName);
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
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
      {active && (
        <div
          key={active.name}
          className="fade-up"
          style={{
            margin: '14px auto 0',
            maxWidth: 640,
            background: '#fef9c3',
            border: '2px solid #d4b943',
            borderRadius: '2px 14px 3px 16px',
            boxShadow: '2px 3px 6px rgba(0,0,0,0.12)',
            transform: 'rotate(-0.5deg)',
            padding: '10px 16px',
            fontSize: 17,
            textAlign: 'center',
            lineHeight: 1.35,
          }}
        >
          {active.takeaway}
        </div>
      )}
    </div>
  );
}
