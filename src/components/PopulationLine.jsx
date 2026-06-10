import { CELL_META, LINE_ORDER, INK, MARKER_BLUE } from '../metrics.js';
import { roughLinePath, roughRectPath, roughBracketPath } from '../sketch.js';

const VIEW_W = 960;
const VIEW_H = 300;
const BAR_X = 60;
const BAR_W = 840;
const BAR_Y = 140;
const BAR_H = 36;
const MIN_W = 10; // a 1-in-1000 segment still gets a visible sliver

const PRED_POS_COLOR = '#7c3aed';

// Proportional widths, but every nonzero segment gets at least MIN_W px,
// paid for by shrinking the wider segments.
function layoutSegments(counts, total) {
  if (total === 0) return counts.map(() => 0);
  const raw = counts.map((c) => (c / total) * BAR_W);
  const widths = raw.map((w, i) => (counts[i] > 0 ? Math.max(w, MIN_W) : 0));
  const deficit = widths.reduce((s, w, i) => s + (w - raw[i]), 0);
  if (deficit > 0) {
    const donors = raw.map((w, i) => (widths[i] > MIN_W ? w - MIN_W : 0));
    const donorTotal = donors.reduce((s, d) => s + d, 0);
    if (donorTotal >= deficit) {
      donors.forEach((d, i) => {
        if (d > 0) widths[i] -= (deficit * d) / donorTotal;
      });
    } else {
      // degenerate: everything tiny — just split evenly among nonzero
      const nonzero = counts.filter((c) => c > 0).length;
      counts.forEach((c, i) => {
        widths[i] = c > 0 ? BAR_W / nonzero : 0;
      });
    }
  }
  return widths;
}

// Captions get a board-colored halo so leader lines crossing under them
// never hurt legibility.
const halo = { paintOrder: 'stroke', stroke: '#fbfaf6', strokeWidth: 5, strokeLinejoin: 'round' };

function Bracket({ x1, x2, y, dir, color, caption, captionY, seed }) {
  const w = x2 - x1;
  if (w < 4) {
    // group is (nearly) empty — keep the annotation, skip the bracket arms
    return (
      <text x={x1} y={captionY} textAnchor="middle" fill={color} style={{ fontSize: 15, ...halo }}>
        {caption}
      </text>
    );
  }
  return (
    <g>
      <path
        d={roughBracketPath(x1, x2, y, dir, 8, seed)}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <text
        x={(x1 + x2) / 2}
        y={captionY}
        textAnchor="middle"
        fill={color}
        style={{ fontSize: 15, ...halo }}
      >
        {caption}
      </text>
    </g>
  );
}

export default function PopulationLine({ cells, metrics, scenarioKey }) {
  const counts = LINE_ORDER.map((k) => cells[k]);
  const { total, actualPos, actualNeg, predPos, predNeg, prevalence } = metrics;
  const widths = layoutSegments(counts, total);

  // Cumulative segment positions: [{key, x0, x1, mid}, ...]
  let cursor = BAR_X;
  const segs = LINE_ORDER.map((key, i) => {
    const x0 = cursor;
    cursor += widths[i];
    return { key, x0, x1: cursor, mid: (x0 + cursor) / 2 };
  });
  const segOf = Object.fromEntries(segs.map((s) => [s.key, s]));

  const slotXs = segs.map((_, i) => BAR_X + (BAR_W * (i + 0.5)) / 4);

  if (total === 0) {
    return (
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} style={{ width: '100%', display: 'block' }}>
        <path
          d={roughRectPath(BAR_X, BAR_Y, BAR_W, BAR_H, 1)}
          fill="none"
          stroke={INK}
          strokeWidth="2"
          strokeDasharray="6 7"
        />
        <text
          x={VIEW_W / 2}
          y={BAR_Y + BAR_H / 2 + 6}
          textAnchor="middle"
          fill="#888"
          style={{ fontSize: 19 }}
        >
          The population is empty — add some people to the matrix!
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} style={{ width: '100%', display: 'block' }}>
      {/* leader lines + dots + labels, one fixed slot per segment */}
      {segs.map((seg, i) => {
        const meta = CELL_META[seg.key];
        const anchorX = seg.x1 > seg.x0 ? seg.mid : seg.x0;
        return (
          <g key={seg.key}>
            <path
              d={roughLinePath(slotXs[i], 66, anchorX, BAR_Y - 6, i + 11, 1)}
              fill="none"
              stroke={INK}
              strokeWidth="1.4"
              opacity="0.75"
            />
            <circle cx={anchorX} cy={BAR_Y - 4} r="4" fill={INK} />
            <g key={scenarioKey} className="pop-in" style={{ transformOrigin: `${slotXs[i]}px 40px` }}>
              <text x={slotXs[i]} y={32} textAnchor="middle" fill={meta.color} style={{ fontSize: 16, ...halo }}>
                {meta.short} — {meta.blurb}
              </text>
              <text
                x={slotXs[i]}
                y={60}
                textAnchor="middle"
                fill={meta.color}
                style={{ fontSize: 27, fontFamily: "'Caveat', 'Comic Sans MS', 'Chalkboard SE', cursive", fontWeight: 700, ...halo }}
              >
                {cells[seg.key]}
              </text>
            </g>
          </g>
        );
      })}

      {/* "truly ..." brackets above: recall lives in the left one */}
      <Bracket
        x1={segOf.fn.x0}
        x2={segOf.tp.x1}
        y={118}
        dir={1}
        color={MARKER_BLUE}
        caption={`truly positive: ${actualPos}`}
        captionY={108}
        seed={31}
      />
      <Bracket
        x1={segOf.fp.x0}
        x2={segOf.tn.x1}
        y={118}
        dir={1}
        color="#94a3b8"
        caption={`truly negative: ${actualNeg}`}
        captionY={108}
        seed={37}
      />

      {/* the population bar */}
      {segs.map((seg, i) =>
        seg.x1 - seg.x0 > 0.5 ? (
          <g key={seg.key}>
            <rect
              x={seg.x0}
              y={BAR_Y}
              width={seg.x1 - seg.x0}
              height={BAR_H}
              fill={CELL_META[seg.key].color}
              opacity="0.28"
            />
            <path
              d={roughRectPath(seg.x0, BAR_Y, seg.x1 - seg.x0, BAR_H, i + 3)}
              fill="none"
              stroke={CELL_META[seg.key].color}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
        ) : null,
      )}
      {/* second marker pass over the whole bar for the hand-drawn feel */}
      <path
        d={roughRectPath(BAR_X, BAR_Y, BAR_W, BAR_H, 8)}
        fill="none"
        stroke={INK}
        strokeWidth="1.4"
        opacity="0.55"
        strokeLinecap="round"
      />

      {/* "predicted positive" bracket below: precision lives here.
          It overlaps the truly-positive bracket exactly on TP. */}
      <Bracket
        x1={segOf.tp.x0}
        x2={segOf.fp.x1}
        y={196}
        dir={-1}
        color={PRED_POS_COLOR}
        caption={`predicted positive: ${predPos}`}
        captionY={216}
        seed={41}
      />

      {/* footnotes */}
      <text x={BAR_X} y={258} fill="#666" style={{ fontSize: 15, ...halo }}>
        whole line = the population: {total}
        {prevalence !== null &&
          ` · base rate: ${actualPos}/${total} = ${Math.round(prevalence * 1000) / 10}% truly positive`}
      </text>
      <text x={BAR_X + BAR_W} y={258} textAnchor="end" fill="#666" style={{ fontSize: 15, ...halo }}>
        predicted negative: everything else ({predNeg})
      </text>
      <text x={BAR_X} y={284} fill="#999" style={{ fontSize: 14.5 }}>
        recall = how much of the blue bracket is green · precision = how much of the purple bracket is green
      </text>
    </svg>
  );
}
