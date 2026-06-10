// Hand-drawn helpers. All jitter is seeded so re-renders while typing
// don't make the "marker strokes" shimmer.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(...nums) {
  let h = 2166136261;
  for (const n of nums) {
    h ^= Math.round(n * 7 + 13);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// A wobbly line from (x1,y1) to (x2,y2): a few midpoints nudged off-axis.
export function roughLinePath(x1, y1, x2, y2, seed = 1, wobble = 1.5) {
  const rand = mulberry32(hashSeed(x1, y1, x2, y2, seed));
  const segs = 3;
  let d = `M ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const jx = i === segs ? 0 : (rand() - 0.5) * 2 * wobble;
    const jy = i === segs ? 0 : (rand() - 0.5) * 2 * wobble;
    d += ` L ${(x1 + (x2 - x1) * t + jx).toFixed(1)} ${(y1 + (y2 - y1) * t + jy).toFixed(1)}`;
  }
  return d;
}

// A wobbly polyline through the given points (for elbow leader lines).
export function roughPolylinePath(points, seed = 1, wobble = 1.2) {
  let d = '';
  for (let i = 0; i < points.length - 1; i++) {
    const seg = roughLinePath(
      points[i][0], points[i][1], points[i + 1][0], points[i + 1][1],
      seed + i, wobble,
    );
    d += i === 0 ? seg : ' ' + seg.slice(seg.indexOf('L') - 1);
  }
  return d;
}

// A wobbly rectangle outline.
export function roughRectPath(x, y, w, h, seed = 1, wobble = 1.5) {
  return [
    roughLinePath(x, y, x + w, y, seed, wobble),
    roughLinePath(x + w, y, x + w, y + h, seed + 1, wobble),
    roughLinePath(x + w, y + h, x, y + h, seed + 2, wobble),
    roughLinePath(x, y + h, x, y, seed + 3, wobble),
  ].join(' ');
}

// A square-ish bracket: small drops on each end joined by a long stroke.
// dir = 1 opens downward (bracket sits above content), -1 opens upward.
export function roughBracketPath(x1, x2, y, dir = 1, tick = 10, seed = 1) {
  return [
    roughLinePath(x1, y + dir * tick, x1, y, seed),
    roughLinePath(x1, y, x2, y, seed + 1),
    roughLinePath(x2, y, x2, y + dir * tick, seed + 2),
  ].join(' ');
}

const RADII = [
  '255px 15px 225px 15px / 15px 225px 15px 255px',
  '15px 225px 15px 255px / 255px 15px 225px 15px',
  '225px 15px 255px 15px / 15px 255px 15px 225px',
  '15px 255px 15px 225px / 225px 15px 255px 15px',
];

// The classic wonky-border-radius "hand-drawn box", varied per index so
// cards don't look stamped from the same die.
export function sketchBoxStyle(i = 0, ink = '#2b2b2b') {
  const rand = mulberry32(hashSeed(i + 17));
  const rot = ((rand() - 0.5) * 1.2).toFixed(2);
  return {
    border: `2.5px solid ${ink}`,
    borderRadius: RADII[i % RADII.length],
    transform: `rotate(${rot}deg)`,
    background: '#fff',
  };
}
