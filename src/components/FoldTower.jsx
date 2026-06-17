import {
  SHEET_M, LANDMARKS, thickness, logM, LOG_MIN, formatHeight, describeReach,
} from '../folding.js';
import { roughLinePath } from '../sketch.js';
import { INK, MARKER_BLUE } from '../metrics.js';

const VIEW_W = 360;
const VIEW_H = 600;
const TOP = 44;
const BOTTOM = 562;
const TOWER_X = 46;
// The drawn tower spans one sheet up to (just past) the Sun; anything taller
// pins the marker to the top with a "keeps going" flag.
const TOWER_LOG_MAX = logM(1.6e11); // a touch above the Sun

function yFor(logv) {
  const t = (Math.min(logv, TOWER_LOG_MAX) - LOG_MIN) / (TOWER_LOG_MAX - LOG_MIN);
  return BOTTOM - t * (BOTTOM - TOP);
}

const halo = { paintOrder: 'stroke', stroke: '#fbfaf6', strokeWidth: 4, strokeLinejoin: 'round' };

export default function FoldTower({ folds }) {
  const meters = thickness(folds);
  const reached = describeReach(meters);
  const markerLog = logM(meters);
  const offTop = markerLog > TOWER_LOG_MAX;
  const markerY = yFor(markerLog);

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} style={{ width: '100%', maxHeight: '76vh', display: 'block' }}>
      {/* the tower line, drawn twice for a marker-pass feel */}
      <path d={roughLinePath(TOWER_X, BOTTOM, TOWER_X, TOP, 2, 1.4)} fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d={roughLinePath(TOWER_X, BOTTOM, TOWER_X, TOP, 9, 1.4)} fill="none" stroke={INK} strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />

      <text x={TOWER_X + 6} y={TOP - 22} fill={MARKER_BLUE} style={{ fontSize: 13 }}>
        ↕ each step up = 10× higher
      </text>
      <text x={TOWER_X + 6} y={TOP - 8} fill="#999" style={{ fontSize: 12 }}>
        … and far above: 🌌 the whole universe (103 folds)
      </text>

      {/* landmarks */}
      {LANDMARKS.filter((lm) => logM(lm.meters) <= TOWER_LOG_MAX + 0.2).map((lm, i) => {
        const y = yFor(logM(lm.meters));
        const passed = meters >= lm.meters;
        const color = passed ? INK : '#bbb';
        return (
          <g key={lm.label}>
            <path d={roughLinePath(TOWER_X - 7, y, TOWER_X + 7, y, i + 20, 0.8)} fill="none" stroke={color} strokeWidth="1.6" />
            <text x={TOWER_X + 16} y={y - 3} style={{ fontSize: 16 }} opacity={passed ? 1 : 0.45}>
              {lm.icon}
            </text>
            <text x={TOWER_X + 38} y={y - 4} fill={color} style={{ fontSize: 12.5, ...halo }}>
              {lm.label}
            </text>
            <text x={TOWER_X + 38} y={y + 9} fill={passed ? '#16a34a' : '#bbb'} style={{ fontSize: 11, ...halo }}>
              {passed ? `✓ ${formatHeight(lm.meters)}` : formatHeight(lm.meters)}
            </text>
          </g>
        );
      })}

      {/* the climbing paper stack + live tag */}
      <g style={{ transition: 'transform .35s ease', transform: `translateY(${markerY - BOTTOM}px)` }}>
        <rect x={TOWER_X - 14} y={BOTTOM - 9} width="28" height="9" fill={MARKER_BLUE} opacity="0.85" rx="1.5" />
        <rect x={TOWER_X - 14} y={BOTTOM - 9} width="28" height="9" fill="none" stroke={INK} strokeWidth="1.4" rx="1.5" />
        <circle cx={TOWER_X} cy={BOTTOM - 4.5} r="3.2" fill={INK} />
        {offTop && (
          <text x={TOWER_X} y={BOTTOM - 16} textAnchor="middle" fill={MARKER_BLUE} style={{ fontSize: 14, ...halo }}>
            ⤒ way past here →
          </text>
        )}
      </g>

      {/* current reach callout, parked top-right so it never overlaps the climb */}
      <g className="pop-in" key={reached.label} style={{ transformOrigin: `${VIEW_W - 8}px ${TOP + 40}px` }}>
        <text x={VIEW_W - 6} y={TOP + 30} textAnchor="end" style={{ fontSize: 30 }}>
          {reached.icon}
        </text>
        <text x={VIEW_W - 6} y={TOP + 50} textAnchor="end" fill={INK} style={{ fontSize: 13, ...halo }}>
          now reaching
        </text>
        <text x={VIEW_W - 6} y={TOP + 66} textAnchor="end" fill={MARKER_BLUE} style={{ fontSize: 14, ...halo }}>
          {reached.label}
        </text>
      </g>
    </svg>
  );
}

export { SHEET_M };
