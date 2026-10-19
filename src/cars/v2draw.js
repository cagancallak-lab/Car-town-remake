// Drawing helpers for the realistic (v2) cars: window graphics that follow
// the real roofline/beltline curves, rounded polygons, plates and badges.

import { rrect, crect, circle, ellipse, poly, both } from './painter.js';

export { rrect, crect, circle, ellipse, poly, both };

/** Path through points with rounded corners (radius r, clamped per corner). */
export function roundedPoly(pts, r = 0.03) {
  const p = new Path2D();
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(pts[n - 1], pts[0]);
  p.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const prev = pts[(i - 1 + n) % n];
    const l1 = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
    const l2 = Math.hypot(next[0] - cur[0], next[1] - cur[1]);
    const rr = Math.max(0, Math.min(r, l1 / 2, l2 / 2));
    p.arcTo(cur[0], cur[1], next[0], next[1], rr);
  }
  p.closePath();
  return p;
}

/** Smooth open/closed path (Catmull-Rom -> Bézier). */
export function smoothPath(points, closed = true, tension = 0.5) {
  const p = new Path2D();
  const n = points.length;
  p.moveTo(points[0][0], points[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const q0 = !closed && i === 0 ? p1 : p0;
    const q3 = !closed && i === n - 2 ? p2 : p3;
    const k = tension / 3;
    p.bezierCurveTo(p1[0] + (p2[0] - q0[0]) * k, p1[1] + (p2[1] - q0[1]) * k, p2[0] - (q3[0] - p1[0]) * k, p2[1] - (q3[1] - p1[1]) * k, p2[0], p2[1]);
  }
  if (closed) p.closePath();
  return p;
}

export function line(pts) {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  return p;
}

const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Side-window graphics. o = {
 *   aBase, aTop    : x of the A-pillar line at the belt and at the roof
 *   rBase, rTop    : x of the rearmost pillar line at the belt and at the roof
 *   windows        : [[xFront, xRear], ...] glass openings (gaps = pillars)
 *   inset          : distance of the glass from the black surround
 *   topInset, botInset
 * }
 * Returns { surround: Path2D, windows: Path2D[], top(x), bot(x) }.
 */
export function greenhouse(c, o) {
  const fn = c.fn;
  const top = (x) => c.rail(x) - (o.topInset ?? 0.025);
  const bot = (x) => fn.beltAt(x) + (o.botInset ?? 0.012);
  const yA0 = bot(o.aBase);
  const yA1 = top(o.aTop);
  const yR0 = bot(o.rBase);
  const yR1 = top(o.rTop);
  const aX = (y) => lerp(o.aBase, o.aTop, (y - yA0) / (yA1 - yA0));
  const rX = (y) => lerp(o.rBase, o.rTop, (y - yR0) / (yR1 - yR0));
  const edge = (x0, x1, f, n = 14) => {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const x = lerp(x0, x1, i / n);
      out.push([x, f(x)]);
    }
    return out;
  };
  const surroundPts = [
    ...edge(o.aBase, o.rBase, bot, 24),
    ...edge(o.rTop, o.aTop, top, 24),
  ];
  const surround = roundedPoly(surroundPts, 0.04);
  const inset = o.inset ?? 0.028;
  const windows = o.windows.map(([xf, xr], idx) => {
    const first = idx === 0;
    const lastW = idx === o.windows.length - 1;
    const yb = (x) => bot(x) + inset;
    const yt = (x) => top(x) - inset;
    // corner x positions clipped by the slanted pillar lines
    const fb = first ? Math.min(xf, aX(yb(o.aBase)) - inset * 1.6) : xf;
    const ft = first ? Math.min(xf, aX(yt(o.aTop)) - inset * 1.6) : xf;
    const rb = lastW ? Math.max(xr, rX(yb(o.rBase)) + inset * 1.6) : xr;
    const rt = lastW ? Math.max(xr, rX(yt(o.rTop)) + inset * 1.6) : xr;
    const pts = [...edge(fb, rb, yb, 16), ...edge(rt, ft, yt, 16)];
    return roundedPoly(pts, o.cornerR ?? 0.035);
  });
  return { surround, windows, top, bot, aX, rX };
}

/** EU / TR style number plate centred on (cx, cy), w x h in metres. */
export function plate(P, cx, cy, text, { w = 0.52, h = 0.112, band = '#1f4fb6', bandText = '', fg = '#15171c' } = {}) {
  P.fill(crect(cx, cy, w + 0.012, h + 0.012, 0.012), '#1a1a1a');
  P.fill(crect(cx, cy, w, h, 0.01), '#f6f6f2', { rough: 0.5 });
  if (band) {
    P.fill(rrect(cx - w / 2, cy - h / 2, w * 0.085, h, 0.008), band);
    if (bandText) P.text(bandText, cx - w / 2 + w * 0.0425, cy - h * 0.28, h * 0.22, '#fff', { weight: '700' });
  }
  P.text(text, cx + (band ? w * 0.04 : 0), cy - h * 0.03, h * 0.62, fg, { font: 'Arial, sans-serif', weight: '700', maxWidth: w * 0.85 });
}

/** Thin dark panel-gap line. */
export function gap(P, pts, width = 0.006, color = 'rgba(10,12,16,0.55)') {
  P.stroke(line(pts), color, width);
}

/** Side-view band hugging a wheel arch (black plastic cladding). */
export function archBand(cx, cy, r, band, { from = -0.22, to = Math.PI + 0.22, sill = null } = {}) {
  const pts = [];
  const n = 28;
  for (let i = 0; i <= n; i++) {
    const a = from + ((to - from) * i) / n;
    pts.push([cx + Math.cos(a) * (r + band), cy + Math.sin(a) * (r + band)]);
  }
  for (let i = n; i >= 0; i--) {
    const a = from + ((to - from) * i) / n;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  if (sill !== null) {
    // extend both feet down to the sill
    pts[0][1] = Math.min(pts[0][1], sill);
    pts[n][1] = Math.min(pts[n][1], sill);
  }
  return roundedPoly(pts, 0.01);
}

/** Black frit band + glass panel for windshield / backlight projections. */
export function glassPanel(P, len, wBottom, wTop, { frit = 0.045, r = 0.06, color = '#0b0c0f', bottom = 0.02, topInset = 0.05 } = {}) {
  const outer = roundedPoly([[-wBottom - frit, 0], [wBottom + frit, 0], [wTop + frit, len], [-wTop - frit, len]], r + frit * 0.5);
  P.fill(outer, color);
  P.glass(roundedPoly([[-wBottom, bottom + frit * 0.6], [wBottom, bottom + frit * 0.6], [wTop, len - topInset], [-wTop, len - topInset]], r));
}
