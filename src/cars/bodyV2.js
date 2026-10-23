// Realistic one-piece car bodies ("v2"), modelled the way car designers loft
// a clay model: a set of longitudinal character curves (roofline, beltline,
// shoulder, sill and plan widths, all in metres) is sampled at many stations
// along the car, every station gets a smooth cross-section through those
// curves, and the sections are skinned into one continuous shell that
// includes the greenhouse. Windows, lights and grilles are painted onto this
// shell afterwards with projected overlays.

import * as THREE from 'three';
import { monotoneCurve, gridGeometry, ensureOutward, MAT } from './carGeometry.js';

const _e1 = new THREE.Vector3();
const _e2 = new THREE.Vector3();
const _n = new THREE.Vector3();

function smoothstep(a, b, x) {
  if (b - a < 1e-9) return x >= b ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
const lerp = (a, b, t) => a + (b - a) * t;

/** Centripetal Catmull-Rom through pts[1..n-2] (pts[0], pts[n-1] are phantoms). */
function catmull(pts, counts, out, cats, catNames) {
  for (let seg = 1; seg < pts.length - 2; seg++) {
    const P0 = pts[seg - 1];
    const P1 = pts[seg];
    const P2 = pts[seg + 1];
    const P3 = pts[seg + 2];
    const d = (a, b) => Math.max(Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5), 1e-4);
    const t0 = 0;
    const t1 = t0 + d(P0, P1);
    const t2 = t1 + d(P1, P2);
    const t3 = t2 + d(P2, P3);
    const n = counts[seg - 1];
    for (let i = 0; i < n; i++) {
      const t = t1 + ((t2 - t1) * i) / n;
      const m = (a, b, ta, tb) => [((tb - t) / (tb - ta)) * a[0] + ((t - ta) / (tb - ta)) * b[0], ((tb - t) / (tb - ta)) * a[1] + ((t - ta) / (tb - ta)) * b[1]];
      const A1 = m(P0, P1, t0, t1);
      const A2 = m(P1, P2, t1, t2);
      const A3 = m(P2, P3, t2, t3);
      const B1 = m(A1, A2, t0, t2);
      const B2 = m(A2, A3, t1, t3);
      const C = m(B1, B2, t1, t2);
      out.push(C);
      cats.push(catNames[seg - 1]);
    }
  }
}

const SPLINE_CATS = ['side', 'side', 'glass', 'roof'];
const LOD = {
  high: { NF: 3, NW: 2, NL: 5, spline: [5, 6, 10, 10], stations: 170, uniform: 60, arch: 18, key: [-0.06, -0.03, 0, 0.03, 0.06] },
  low: { NF: 2, NW: 1, NL: 3, spline: [3, 3, 6, 6], stations: 72, uniform: 22, arch: 8, key: [-0.04, 0, 0.04] },
};

export function makeBodyV2Functions(b) {
  const L = b.length;
  const half = L / 2;
  const C = (pts) => monotoneCurve(pts);
  const roofC = C(b.roof);
  const beltC = C(b.belt);
  const sillC = C(b.sill);
  const shoulderC = C(b.shoulder);
  const wBodyC = C(b.wBody);
  const wBeltC = C(b.wBelt);
  const wRoofC = C(b.wRoof);
  const ridgeC = b.hoodRidge ? C(b.hoodRidge.profile) : null;
  const wheelY = b.wheel.radius;
  const arches = [b.wheel.front, b.wheel.rear].map((x) => ({ x, r: b.wheel.radius + (b.wheel.archGap ?? 0.045) }));
  const endFactor = (x) => {
    const nose = b.noseDepth ?? 0.45;
    const tail = b.tailDepth ?? 0.35;
    if (x > half - nose) {
      const s = Math.min(1, (x - (half - nose)) / nose);
      const p = b.noseExp ?? 4;
      return Math.pow(Math.max(0, 1 - Math.pow(s, p)), 1 / p);
    }
    if (x < -half + tail) {
      const s = Math.min(1, (-half + tail - x) / tail);
      const p = b.tailExp ?? 5;
      return Math.pow(Math.max(0, 1 - Math.pow(s, p)), 1 / p);
    }
    return 1;
  };
  const flareAt = (x) => {
    if (!b.flare) return 0;
    let f = 0;
    for (const a of arches) {
      const d = (x - a.x) / (a.r * 1.8);
      if (Math.abs(d) < 1) f = Math.max(f, 0.5 * (1 + Math.cos(Math.PI * d)));
    }
    return f * b.flare;
  };
  const widthAt = (x) => Math.max(0, wBodyC(x) * endFactor(x) + flareAt(x) * Math.min(1, endFactor(x) * 3));
  const beltWidthAt = (x) => Math.min(widthAt(x), wBeltC(x) * endFactor(x));
  const roofWidthAt = (x) => Math.min(beltWidthAt(x), wRoofC(x) * endFactor(x));
  const roofAt = (x) => roofC(x);
  const beltAt = (x) => Math.min(beltC(x), roofC(x) - 0.004);
  const sillAt = (x) => sillC(x);
  const archAt = (x) => {
    let y = -Infinity;
    for (const a of arches) {
      const dx = x - a.x;
      if (Math.abs(dx) < a.r) y = Math.max(y, wheelY + Math.sqrt(a.r * a.r - dx * dx));
    }
    return y;
  };
  return {
    L, W: b.width, half, roofAt, beltAt, sillAt, shoulderAt: shoulderC, widthAt, beltWidthAt, roofWidthAt, endFactor,
    flareAt, archAt, arches, wheelY, ridgeC, topAt: roofAt,
  };
}

function wrapFn(f, front, depth) {
  const zs = [0];
  const ss = [0];
  const steps = 240;
  let px = front ? f.half : -f.half;
  let pz = 0;
  let s = 0;
  let zmax = 0;
  for (let i = 1; i <= steps; i++) {
    const x = (front ? 1 : -1) * (f.half - depth * 1.15 * (i / steps));
    const z = Math.max(zmax, f.widthAt(x));
    s += Math.hypot(x - px, z - pz);
    px = x;
    pz = z;
    if (z > zmax + 1e-6) {
      zmax = z;
      zs.push(z);
      ss.push(s);
    }
  }
  return (az) => {
    if (az >= zs[zs.length - 1]) return ss[ss.length - 1] + (az - zs[zs.length - 1]);
    let lo = 0;
    let hi = zs.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (zs[m] > az) hi = m; else lo = m;
    }
    const t = (az - zs[lo]) / (zs[hi] - zs[lo]);
    return ss[lo] + (ss[hi] - ss[lo]) * t;
  };
}

export function buildBodyV2(b, lod = 'high') {
  const Q = LOD[lod] || LOD.high;
  const { NF, NW, NL } = Q;
  const f = makeBodyV2Functions(b);
  const { half, arches, wheelY } = f;
  const xs = [];
  const N = Q.stations;
  for (let i = 0; i <= N; i++) xs.push(-half + b.length * (0.5 - 0.5 * Math.cos((Math.PI * i) / N)));
  for (let i = 0; i <= Q.uniform; i++) xs.push(-half + (b.length * i) / Q.uniform);
  for (const a of arches) {
    xs.push(a.x - a.r - 0.004, a.x - a.r + 0.004, a.x + a.r - 0.004, a.x + a.r + 0.004);
    for (let k = 1; k < Q.arch; k++) xs.push(a.x - a.r + (2 * a.r * k) / Q.arch);
  }
  for (const k of b.keyX || []) for (const d of Q.key) xs.push(k + d);
  // open pickup bed: near-vertical bulkhead and tailgate walls
  if (b.bed) for (const e of [b.bed.x0, b.bed.x1]) for (const d of [-0.03, -0.012, 0, 0.012, 0.03]) xs.push(e + d);
  xs.sort((p, q) => p - q);
  const sx = [];
  for (const x of xs) if (x >= -half && x <= half && (!sx.length || x - sx[sx.length - 1] > 0.004)) sx.push(x);
  sx[0] = -half;
  sx[sx.length - 1] = half;

  const wellDepth = (b.wheel.width ?? 0.24) + 0.07;
  const rLowBase = b.rLow ?? 0.1;
  const roofEdge = b.roofEdge ?? 0.06;
  const rings = [];
  const meta = [];
  let catsTemplate = null;
  for (const x of sx) {
    const yR = f.roofAt(x);
    const yB = f.beltAt(x);
    const yF = f.sillAt(x);
    const wb = f.widthAt(x);
    const wbe = f.beltWidthAt(x);
    const wr = f.roofWidthAt(x);
    const g = yR - yB;
    const yArch = f.archAt(x);
    let yS = f.shoulderAt(x);
    let yW = Math.max(yF, yArch);
    yW = Math.min(yW, yB - 0.1, yS - 0.04);
    yW = Math.max(yW, yF);
    const rL = Math.max(0, Math.min(rLowBase, (yS - yW) * 0.45, wb * 0.45));
    yS = Math.min(Math.max(yS, yW + rL + 0.01), yB - 0.01);
    const zStep = Math.max(0, Math.min(wb - rL, (wb - f.flareAt(x)) - wellDepth));
    const s = smoothstep(0.03, 0.2, g);
    const railZ = lerp(wbe * 0.92, wr, s);
    const railY = lerp(yB + g * 0.45, yR - Math.min(roofEdge, g * 0.45), s);
    const pts = [];
    const cats = [];
    for (let i = 0; i < NF; i++) { pts.push([zStep * (i / NF), yF]); cats.push('floor'); }
    pts.push([zStep, yF], [zStep, yW]);
    cats.push('well', 'well');
    for (let i = 1; i <= NW; i++) { pts.push([zStep + (wb - rL - zStep) * (i / (NW + 1)), yW]); cats.push('well'); }
    for (let i = 0; i < NL; i++) {
      const a = -Math.PI / 2 + (Math.PI / 2) * (i / NL);
      pts.push([wb - rL + rL * Math.cos(a), yW + rL + rL * Math.sin(a)]);
      cats.push('lower');
    }
    const ctrl = [
      [wb, yW + rL - 0.25],
      [wb, yW + rL],
      [wb, yS],
      [wbe, yB],
      [railZ, railY],
      [0, yR],
      [-railZ, railY],
    ];
    catmull(ctrl, Q.spline, pts, cats, SPLINE_CATS);
    pts.push([0, yR]);
    cats.push('roof');
    // raised fenders (Beetle wings, supercar haunches) where there is no greenhouse
    if (b.fenderHump) {
      let h = 0;
      for (const a of arches) {
        const d = (x - a.x) / (a.r * (b.fenderHump.spread ?? 2.2));
        if (Math.abs(d) < 1) h = Math.max(h, 0.5 * (1 + Math.cos(Math.PI * d)) * (a.x > 0 ? b.fenderHump.front : b.fenderHump.rear));
      }
      h *= 1 - s;
      if (h > 0) {
        for (let i = 0; i < pts.length; i++) {
          if (cats[i] !== 'roof' && cats[i] !== 'glass' && cats[i] !== 'side') continue;
          const z = pts[i][0];
          const wgt = smoothstep(wb * 0.35, wb * 0.85, z) * (cats[i] === 'side' ? smoothstep(yS - 0.1, yB, pts[i][1]) : 1);
          pts[i][1] += h * wgt;
        }
      }
    }
    // hood power domes / ridges
    if (f.ridgeC) {
      const rh = f.ridgeC(x);
      if (rh > 0) {
        for (let i = 0; i < pts.length; i++) {
          if (cats[i] !== 'roof' && cats[i] !== 'glass') continue;
          const z = pts[i][0];
          let bump = 0;
          for (const zr of b.hoodRidge.z) bump += Math.exp(-Math.pow((z - zr) / b.hoodRidge.w, 2));
          pts[i][1] += rh * Math.min(1, bump);
        }
      }
    }
    if (!catsTemplate) catsTemplate = cats;
    // open pickup bed: the top of the section between the rails drops to the
    // bed floor, giving a real tub with inner walls, bulkhead and tailgate
    let bedT = 0;
    if (b.bed) {
      const e = 0.012;
      bedT = smoothstep(b.bed.x1 - e, b.bed.x1 + e, x) * (1 - smoothstep(b.bed.x0 - e, b.bed.x0 + e, x));
      if (bedT > 0) {
        const r0 = cats.indexOf('roof');
        const m = pts.length - r0;
        const z0 = pts[r0][0];
        const top = pts[r0][1];
        const zIn = Math.max(0.05, z0 - (b.bed.rail ?? 0.07));
        const floorY = Math.min(b.bed.floor, top - 0.05);
        for (let k = 1; k < m; k++) {
          let z;
          let y;
          if (k === 1) { z = zIn; y = top; } else if (k === 2) { z = zIn - 0.006; y = floorY; } else { z = (zIn - 0.02) * (1 - (k - 3) / Math.max(1, m - 4)); y = floorY; }
          const q = pts[r0 + k];
          q[0] = lerp(q[0], z, bedT);
          q[1] = lerp(q[1], y, bedT);
        }
      }
    }
    // rake: lean the nose / tail faces back so they are not vertical walls
    const rakeX = (y) => {
      let dx = 0;
      if (b.noseRake && x > half - b.noseRake.depth) {
        const t = smoothstep(half - b.noseRake.depth, half - b.noseRake.depth * 0.2, x);
        const h = Math.max(0, Math.min(1, (y - b.noseRake.y0) / (b.noseRake.y1 - b.noseRake.y0)));
        dx -= b.noseRake.amount * t * h * h * (3 - 2 * h);
      }
      if (b.tailRake && x < -half + b.tailRake.depth) {
        const t = smoothstep(-half + b.tailRake.depth, -half + b.tailRake.depth * 0.2, x);
        const h = Math.max(0, Math.min(1, (y - b.tailRake.y0) / (b.tailRake.y1 - b.tailRake.y0)));
        dx += b.tailRake.amount * t * h * h * (3 - 2 * h);
      }
      return dx;
    };
    const ring = [];
    for (const [z, y] of pts) ring.push(new THREE.Vector3(x + rakeX(y), y, z));
    for (let k = pts.length - 2; k >= 1; k--) ring.push(new THREE.Vector3(x + rakeX(pts[k][1]), pts[k][1], -pts[k][0]));
    rings.push(ring);
    meta.push({ x, wb, yB, yR, inArch: yW > yF + 0.01, bed: bedT });
  }
  const per = rings[0].length;
  const halfCount = catsTemplate.length;
  const catOf = (j) => catsTemplate[j < halfCount ? j : per - j];
  const roof0 = catsTemplate.indexOf('roof');
  const roofIdx = (j) => (j < halfCount ? j : per - j) - roof0;
  const claddingY = b.claddingY ?? -1;
  const archBand = b.archCladding ?? 0;
  const classify = (i, j) => {
    const c = catOf(j);
    if (c === 'well' || c === 'floor') return MAT.TRIM;
    // bed liner: floor and inner walls of an open bed
    if (b.bed?.liner && c === 'roof' && roofIdx(j) >= 1 && roofIdx((j + 1) % per) >= 1 && meta[i].bed > 0.02 && meta[i + 1].bed > 0.02) return MAT.TRIM;
    if (b.archTrim && c === 'lower' && (meta[i].inArch || meta[i + 1].inArch)) return MAT.TRIM;
    const p = rings[i][j];
    const q = rings[i + 1][(j + 1) % per];
    const cy = (p.y + q.y) / 2;
    const cx = (p.x + q.x) / 2;
    const cz = Math.abs((p.z + q.z) / 2);
    const wb = Math.max(meta[i].wb, 1e-3);
    if (cy < claddingY && cz > wb * 0.35) return MAT.TRIM;
    if (archBand > 0 && cz > wb * 0.6 && (c === 'lower' || c === 'side')) {
      _e1.subVectors(q, p);
      _e2.subVectors(rings[i + 1][j], p);
      _n.crossVectors(_e1, _e2).normalize();
      if (Math.abs(_n.y) < 0.6) {
        for (const a of arches) {
          const d = Math.hypot(cx - a.x, Math.max(0, cy - wheelY));
          if (d >= a.r - 0.04 && d < a.r + archBand) return MAT.TRIM;
        }
      }
    }
    return MAT.PAINT;
  };
  const geo = gridGeometry(rings, classify, { closed: true });
  ensureOutward(geo, new THREE.Vector3(0, f.roofAt(0), 0), new THREE.Vector3(0, 1, 0));
  f.wrapFront = wrapFn(f, true, b.noseDepth ?? 0.45);
  f.wrapRear = wrapFn(f, false, b.tailDepth ?? 0.35);
  geo.userData.fn = f;
  return geo;
}

/** Projection description for a sloped glass panel (windshield / backlight). */
export function slopeProjection(f, xBase, xTop, front = true) {
  const p0 = new THREE.Vector3(xBase, f.beltAt(xBase), 0);
  const p1 = new THREE.Vector3(xTop, f.roofAt(xTop), 0);
  const d = new THREE.Vector3().subVectors(p1, p0);
  const len = d.length();
  d.normalize();
  // outward normal in the x-y plane
  const n = front ? new THREE.Vector3(d.y, -d.x, 0) : new THREE.Vector3(-d.y, d.x, 0);
  if (n.y < 0) n.negate();
  return { origin: p0, dir: n, up: d, length: len };
}
