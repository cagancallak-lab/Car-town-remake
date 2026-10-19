// Procedural, smooth car body generation.
//
// Every car is built from two lofted shells:
//  * the lower body: cross sections (rounded rectangles) swept along the car's
//    length, shaped by a side profile (top + bottom curves), a plan-view
//    superellipse and wheel arches cut out of the bottom;
//  * the cabin / greenhouse: horizontal rounded-rectangle slices stacked from
//    the belt line to a rounded roof, split into glass, pillar and roof groups.
//
// The car faces +X, Y is up and Z is the car's width. Units are world units
// (a compact "chibi" Car Town style car is ~2.3 units long).

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const MAT = { PAINT: 0, ROOF: 1, GLASS: 2, TRIM: 3, CHROME: 4 };
const _e1 = new THREE.Vector3();
const _e2 = new THREE.Vector3();
const _n = new THREE.Vector3();
const MAT_COUNT = 5;

// Fritsch-Carlson monotone cubic interpolation: smooth, never overshoots.
export function monotoneCurve(points) {
  const n = points.length;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const d = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (xs[mid] > x) hi = mid; else lo = mid;
    }
    const h = xs[hi] - xs[lo];
    const t = (x - xs[lo]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[lo] + (t3 - 2 * t2 + t) * h * m[lo] +
      (-2 * t3 + 3 * t2) * ys[hi] + (t3 - t2) * h * m[hi];
  };
}

// Builds a non-indexed-by-group geometry from a grid of rings.
// rings[i][j] = Vector3, classify(i, j) -> material index for quad (i,j)-(i+1,j+1)
function gridGeometry(rings, classify, { closed = true, capEnd = null } = {}) {
  const ringCount = rings.length;
  const perRing = rings[0].length;
  const positions = [];
  for (const ring of rings) for (const p of ring) positions.push(p.x, p.y, p.z);
  const groups = Array.from({ length: MAT_COUNT }, () => []);
  const jMax = closed ? perRing : perRing - 1;
  for (let i = 0; i < ringCount - 1; i++) {
    for (let j = 0; j < jMax; j++) {
      const j1 = (j + 1) % perRing;
      const a = i * perRing + j;
      const b = (i + 1) * perRing + j;
      const c = (i + 1) * perRing + j1;
      const d = i * perRing + j1;
      const g = groups[classify(i, j)];
      g.push(a, b, c, a, c, d);
    }
  }
  if (capEnd) {
    // fan from an extra centre vertex to the last ring
    const centerIndex = positions.length / 3;
    positions.push(capEnd.point.x, capEnd.point.y, capEnd.point.z);
    const last = (ringCount - 1) * perRing;
    const g = groups[capEnd.material];
    for (let j = 0; j < perRing; j++) {
      const j1 = (j + 1) % perRing;
      g.push(last + j, centerIndex, last + j1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const index = [];
  for (let m = 0; m < MAT_COUNT; m++) {
    if (groups[m].length) geo.addGroup(index.length, groups[m].length, m);
    for (const k of groups[m]) index.push(k);
  }
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

// Flip triangle winding when the geometry's normals point inwards.
function ensureOutward(geo, probe, outward) {
  // probe: a point on the surface, outward: expected normal direction there
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  let best = -1;
  let bestD = Infinity;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const d = v.distanceToSquared(probe);
    if (d < bestD) { bestD = d; best = i; }
  }
  v.fromBufferAttribute(nor, best);
  if (v.dot(outward) < 0) {
    const idx = geo.index.array;
    for (let i = 0; i < idx.length; i += 3) {
      const t = idx[i + 1];
      idx[i + 1] = idx[i + 2];
      idx[i + 2] = t;
    }
    geo.index.needsUpdate = true;
    geo.computeVertexNormals();
  }
  return geo;
}

// --- Lower body -------------------------------------------------------------

// Half cross-section (z >= 0) from bottom centre to top centre, as [z, y]
// pairs plus a category per point. The bottom has a step so wheel wells are
// cut only under the fenders (yb1) while the centre keeps its floor (yb0).
const NB1 = 3; // centre floor
const NB2 = 2; // outer floor (wheel well ceiling)
const NC = 6; // bottom corner
const NS = 9; // side
const NC2 = 7; // top corner
const NT = 4; // top flat
const CATS = [];
for (let i = 0; i < NB1; i++) CATS.push('floor');
CATS.push('well', 'well');
for (let i = 0; i < NB2; i++) CATS.push('well');
for (let i = 0; i < NC; i++) CATS.push('corner');
for (let i = 0; i < NS; i++) CATS.push('side');
for (let i = 0; i < NC2; i++) CATS.push('top');
for (let i = 0; i < NT; i++) CATS.push('top');
CATS.push('top');

function smoothstep(a, b, x) {
  if (b - a < 1e-9) return x >= b ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function halfSection(w, yb0, yb1, zStep, yt, rb, rt, tumble, hump) {
  const h = Math.max(yt - yb1, 1e-4);
  rb = Math.min(rb, h * 0.45, w * 0.95);
  rt = Math.min(rt, h * 0.6, w * 0.95);
  if (rb + rt > h) {
    const s = h / (rb + rt);
    rb *= s;
    rt *= s;
  }
  const wb = w;
  const wt = Math.max(w - tumble * Math.min(1, w * 4), rt);
  zStep = Math.max(0, Math.min(zStep, wb - rb));
  const pts = [];
  for (let i = 0; i < NB1; i++) pts.push([zStep * (i / NB1), yb0]);
  pts.push([zStep, yb0], [zStep, yb1]);
  for (let i = 1; i <= NB2; i++) pts.push([zStep + (wb - rb - zStep) * (i / (NB2 + 1)), yb1]);
  for (let i = 0; i < NC; i++) {
    const a = -Math.PI / 2 + (Math.PI / 2) * (i / NC);
    pts.push([wb - rb + rb * Math.cos(a), yb1 + rb + rb * Math.sin(a)]);
  }
  for (let i = 0; i < NS; i++) {
    const t = i / NS;
    pts.push([wb + (wt - wb) * t, yb1 + rb + (yt - rt - yb1 - rb) * t, t * t]);
  }
  for (let i = 0; i < NC2; i++) {
    const a = (Math.PI / 2) * (i / NC2);
    pts.push([wt - rt + rt * Math.cos(a), yt - rt + rt * Math.sin(a), 1]);
  }
  for (let i = 0; i < NT; i++) pts.push([(wt - rt) * (1 - i / NT), yt, 1]);
  pts.push([0, yt, 1]);
  if (hump > 0) {
    for (const p of pts) {
      if (p[2] === undefined) continue;
      p[1] += hump * p[2] * smoothstep(w * 0.3, w * 0.85, p[0]);
    }
  }
  return pts;
}

export function makeBodyFunctions(spec) {
  const L = spec.length;
  const W = spec.width;
  const half = L / 2;
  const topC = monotoneCurve(spec.top);
  const clr = spec.clearance ?? 0.16;
  const botC = monotoneCurve(spec.bottom ?? [[-1, clr + 0.14], [-0.86, clr], [0.86, clr], [1, clr + 0.14]]);
  const pL = spec.planExp ?? 4;
  const pR = spec.planExpRear ?? pL;
  const wheelY = spec.wheel.radius;
  const arches = [spec.wheel.front, spec.wheel.rear].map((x) => ({ x, r: spec.wheel.radius + (spec.wheel.archGap ?? 0.05) }));
  const flare = spec.flare ?? 0;
  const widthAt = (x) => {
    const u = Math.min(1, Math.abs(x) / half);
    const p = x >= 0 ? pL : pR;
    let w = (W / 2) * Math.pow(Math.max(0, 1 - Math.pow(u, p)), 1 / p);
    if (spec.noseTaper && x > 0) w *= 1 - spec.noseTaper * Math.pow(u, 2);
    if (spec.tailTaper && x < 0) w *= 1 - spec.tailTaper * Math.pow(u, 2);
    if (flare) {
      for (const a of arches) {
        const d = (x - a.x) / (a.r * 1.7);
        if (Math.abs(d) < 1) w += flare * 0.5 * (1 + Math.cos(Math.PI * d)) * Math.min(1, w * 6);
      }
    }
    return w;
  };
  const humpH = spec.fenderHump ?? 0;
  const humpAt = (x) => {
    if (!humpH) return 0;
    let h = 0;
    for (const a of arches) {
      const d = (x - a.x) / (a.r * 2.2);
      if (Math.abs(d) < 1) h = Math.max(h, 0.5 * (1 + Math.cos(Math.PI * d)));
    }
    return h * humpH;
  };
  const topAt = (x) => topC(x / half);
  const sideTopAt = (x) => topAt(x) + humpAt(x);
  const floorAt = (x) => Math.min(botC(x / half), topAt(x) - 0.03);
  const wellAt = (x) => {
    let b = floorAt(x);
    for (const a of arches) {
      const dx = x - a.x;
      if (Math.abs(dx) < a.r) b = Math.max(b, wheelY + Math.sqrt(a.r * a.r - dx * dx));
    }
    return Math.min(b, sideTopAt(x) - (spec.rTop ?? 0.13) * 0.6 - 0.02);
  };
  const wellDepth = spec.wheel.width + 0.08;
  return { L, W, half, widthAt, topAt, sideTopAt, floorAt, wellAt, humpAt, wellDepth, arches, wheelY, bottomAt: wellAt };
}

// Arc-length along the plan outline of the nose/tail, so fascia artwork wraps
// around rounded corners instead of smearing.
function outlineWrap(f, front) {
  const zs = [0];
  const ss = [0];
  const steps = 200;
  let px = front ? f.half : -f.half;
  let pz = 0;
  let s = 0;
  let zmax = 0;
  for (let i = 1; i <= steps; i++) {
    const x = (front ? 1 : -1) * f.half * (1 - (i / steps) * 0.7);
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

export function buildLowerBody(spec) {
  const f = makeBodyFunctions(spec);
  const { half, widthAt, topAt, floorAt, wellAt, humpAt, wellDepth, arches } = f;
  const xs = [];
  const N = 110;
  for (let i = 0; i <= N; i++) {
    const s = -1 + (2 * i) / N;
    xs.push(Math.sin((s * Math.PI) / 2) * half);
  }
  for (const a of arches) {
    xs.push(a.x - a.r - 0.004, a.x - a.r + 0.004, a.x + a.r - 0.004, a.x + a.r + 0.004);
    for (let k = 1; k < 16; k++) xs.push(a.x - a.r + (2 * a.r * k) / 16);
  }
  xs.sort((a, b) => a - b);
  const sx = [];
  for (const x of xs) if (!sx.length || x - sx[sx.length - 1] > 0.002) sx.push(x);
  sx[0] = -half;
  sx[sx.length - 1] = half;

  const rTop = spec.rTop ?? 0.13;
  const rBot = spec.rBot ?? 0.07;
  const tumble = spec.tumble ?? 0.05;
  const rings = [];
  const ringMeta = [];
  for (const x of sx) {
    const w = Math.max(widthAt(x), 0);
    const yt = topAt(x);
    const yb0 = floorAt(x);
    const yb1 = Math.max(yb0, wellAt(x));
    const hp = halfSection(w, yb0, yb1, w - wellDepth, yt, rBot, rTop, tumble, humpAt(x));
    const ring = [];
    for (const [z, y] of hp) ring.push(new THREE.Vector3(x, y, z));
    for (let k = hp.length - 2; k >= 1; k--) ring.push(new THREE.Vector3(x, hp[k][1], -hp[k][0]));
    rings.push(ring);
    ringMeta.push({ x, w, yt, yb0, yb1 });
  }
  const per = rings[0].length;
  const catOf = (j) => CATS[j < CATS.length ? j : per - j];
  const claddingY = spec.claddingY ?? -1;
  const archBand = spec.archCladding ?? 0;
  const wheelY = f.wheelY;
  const classify = (i, j) => {
    if (catOf(j) === 'well') return MAT.TRIM;
    const p = rings[i][j];
    const q = rings[i + 1][(j + 1) % per];
    const cx = (p.x + q.x) / 2;
    const cy = (p.y + q.y) / 2;
    const cz = Math.abs((p.z + q.z) / 2);
    const w = Math.max(ringMeta[i].w, 1e-3);
    if (cy < claddingY && cz > w * 0.3) return MAT.TRIM;
    if (archBand > 0 && cz > w * 0.55) {
      // only side-facing quads get arch cladding (keeps fender tops painted)
      const r = rings[i + 1][j];
      _e1.subVectors(q, p);
      _e2.subVectors(r, p);
      _n.crossVectors(_e1, _e2).normalize();
      if (Math.abs(_n.y) < 0.55) {
        for (const a of arches) {
          const d = Math.hypot(cx - a.x, Math.max(0, cy - wheelY));
          if (d >= a.r - 0.03 && d < a.r + archBand) return MAT.TRIM;
        }
      }
    }
    return MAT.PAINT;
  };
  const geo = gridGeometry(rings, classify, { closed: true });
  ensureOutward(geo, new THREE.Vector3(0, topAt(0), 0), new THREE.Vector3(0, 1, 0));
  f.wrapFront = outlineWrap(f, true);
  f.wrapRear = outlineWrap(f, false);
  geo.userData.fn = f;
  return geo;
}

// --- Cabin / greenhouse -----------------------------------------------------

const CN = 8; // points per plan corner
const EF = 8; // front & rear edge points
const SIDE_XS = 40; // side edge points

export function buildCabin(spec, body) {
  const c = spec.cabin;
  const beltY = c.beltY;
  const roofY = c.roofY;
  const capH = c.capH ?? 0.08;
  const sink = c.sink ?? 0.12;
  const mainTop = roofY - capH;
  const rc0 = c.rc0 ?? 0.16;
  const rc1 = c.rc1 ?? 0.14;

  const plan = (y) => {
    const t = Math.max(0, Math.min(1, (y - beltY) / (mainTop - beltY)));
    const e = c.bulge ? Math.sin(t * Math.PI) * c.bulge : 0;
    return {
      xr: c.rear0 + (c.rear1 - c.rear0) * t,
      xf: c.front0 + (c.front1 - c.front0) * t,
      wz: c.w0 + (c.w1 - c.w0) * t + e,
      rc: rc0 + (rc1 - rc0) * t,
    };
  };

  // Global side x-stations, so pillar edges line up with vertices on every level.
  const minX = Math.min(c.rear0, c.rear1);
  const maxX = Math.max(c.front0, c.front1);
  const stations = [];
  for (let i = 0; i < SIDE_XS; i++) stations.push(minX + ((maxX - minX) * i) / (SIDE_XS - 1));
  const pillars = [];
  if (c.bPillar) pillars.push(c.bPillar);
  if (c.dPillar) pillars.push(c.dPillar);
  for (const p of pillars) stations.push(p.x - p.w, p.x - p.w + 0.004, p.x + p.w - 0.004, p.x + p.w);
  stations.sort((a, b) => a - b);

  // Level heights: a sunken skirt, the main window band, then the rounded roof cap.
  const levels = [];
  levels.push({ y: beltY - sink, shrink: 0 });
  levels.push({ y: beltY - 0.01, shrink: 0 });
  const MAIN = 12;
  for (let i = 0; i <= MAIN; i++) levels.push({ y: beltY + ((mainTop - beltY) * i) / MAIN, shrink: 0 });
  const CAP = 8;
  const capR = c.capR ?? capH * 1.6;
  for (let k = 1; k <= CAP; k++) {
    const phi = (k / CAP) * (Math.PI / 2) * 0.92;
    levels.push({ y: mainTop + capH * Math.sin(phi), shrink: capR * (1 - Math.cos(phi)) });
  }

  const rings = [];
  const segOf = []; // segment label per point index
  const fracOf = [];
  for (const lv of levels) {
    const p = plan(lv.y);
    const xr = p.xr + lv.shrink;
    const xf = p.xf - lv.shrink * 0.8;
    const wz = Math.max(p.wz - lv.shrink, 0.05);
    const rc = Math.max(0.02, Math.min(p.rc - lv.shrink * 0.3, wz * 0.95, (xf - xr) * 0.45));
    const ring = [];
    const seg = [];
    const frac = [];
    const push = (x, z, s, fr) => { ring.push(new THREE.Vector3(x, lv.y, z)); seg.push(s); frac.push(fr); };
    // front edge: -z -> +z
    for (let i = 0; i < EF; i++) push(xf, -(wz - rc) + (2 * (wz - rc) * i) / EF, 'F', i / EF);
    // front-right corner
    for (let i = 0; i < CN; i++) {
      const a = (Math.PI / 2) * (i / CN);
      push(xf - rc + rc * Math.cos(a), wz - rc + rc * Math.sin(a), 'A', i / CN);
    }
    // right side: front -> rear
    for (let i = stations.length - 1; i >= 0; i--) {
      const x = Math.max(xr + rc, Math.min(xf - rc, stations[i]));
      push(x, wz, 'S', stations[i]);
    }
    // rear-right corner
    for (let i = 0; i < CN; i++) {
      const a = Math.PI / 2 + (Math.PI / 2) * (i / CN);
      push(xr + rc + rc * Math.cos(a), wz - rc + rc * Math.sin(a), 'C', i / CN);
    }
    // rear edge: +z -> -z
    for (let i = 0; i < EF; i++) push(xr, (wz - rc) - (2 * (wz - rc) * i) / EF, 'R', i / EF);
    // rear-left corner
    for (let i = 0; i < CN; i++) {
      const a = Math.PI + (Math.PI / 2) * (i / CN);
      push(xr + rc + rc * Math.cos(a), -(wz - rc) + rc * Math.sin(a), 'C', i / CN);
    }
    // left side: rear -> front
    for (let i = 0; i < stations.length; i++) {
      const x = Math.max(xr + rc, Math.min(xf - rc, stations[i]));
      push(x, -wz, 'S', stations[i]);
    }
    // front-left corner
    for (let i = 0; i < CN; i++) {
      const a = Math.PI * 1.5 + (Math.PI / 2) * (i / CN);
      push(xf - rc + rc * Math.cos(a), -(wz - rc) + rc * Math.sin(a), 'A', i / CN);
    }
    rings.push(ring);
    segOf.push(seg);
    fracOf.push(frac);
  }

  const roofBand = c.roofBand ?? 0.05;
  const sillBand = c.sillBand ?? 0.025;
  const aFrac = c.aFrac ?? [0.0, 1.0];
  const cFrac = c.cFrac ?? [0.0, 1.0];
  const pillarMat = c.pillarMat ?? MAT.PAINT;
  const roofMat = c.roofMat ?? MAT.ROOF;
  const sillMat = c.sillMat ?? MAT.PAINT;
  const frontGlass = c.frontGlass !== false;
  const rearGlass = c.rearGlass !== false;
  const sideGlass = c.sideGlass !== false;
  const classify = (i, j) => {
    const y0 = levels[i].y;
    const y1 = levels[i + 1].y;
    const ym = (y0 + y1) / 2;
    if (ym >= roofY - capH - roofBand) return roofMat;
    if (ym <= beltY + sillBand) return sillMat;
    const s = segOf[i][j];
    const fr = fracOf[i][j];
    if (s === 'A') return fr >= aFrac[0] && fr < aFrac[1] ? pillarMat : MAT.GLASS;
    if (s === 'C') return fr >= cFrac[0] && fr < cFrac[1] ? pillarMat : MAT.GLASS;
    if (s === 'F') return frontGlass ? MAT.GLASS : pillarMat;
    if (s === 'R') return rearGlass ? MAT.GLASS : pillarMat;
    if (s === 'S') {
      if (!sideGlass) return pillarMat;
      // side quads: the point x is the station; check pillars against midpoint of station pair
      const x = rings[i][j].x;
      const xn = rings[i][(j + 1) % rings[i].length].x;
      const xm = (x + xn) / 2;
      for (const p of pillars) if (Math.abs(xm - p.x) < p.w) return p.mat ?? pillarMat;
      return MAT.GLASS;
    }
    return MAT.GLASS;
  };
  const top = levels[levels.length - 1];
  const tp = plan(mainTop);
  const center = new THREE.Vector3((tp.xr + tp.xf) / 2 + (top.shrink * 0.1), top.y + 0.006, 0);
  const geo = gridGeometry(rings, classify, { closed: true, capEnd: { point: center, material: roofMat } });
  ensureOutward(geo, new THREE.Vector3((tp.xr + tp.xf) / 2, roofY, 0), new THREE.Vector3(0, 1, 0));
  geo.userData.plan = plan;
  return geo;
}

// --- Small helpers for detail parts --------------------------------------------

export function roundedBox(w, h, d, r = 0.02, seg = 2) {
  return new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2) * 0.999);
}

// Planar-projects a set of triangles from a shell geometry into an overlay
// geometry with UVs, used to "print" fascias (lights, grilles, plates) and
// liveries onto the smooth bodies.
export function projectOverlay(geo, { dir, uDir, vDir, u0, uSize, v0, vSize, minDot = 0.2, offset = 0.0025, materials = null, uFn = null }) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const idx = geo.index.array;
  const ranges = [];
  for (const g of geo.groups) if (!materials || materials.includes(g.materialIndex)) ranges.push([g.start, g.start + g.count]);
  const P = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const N = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  const fn = new THREE.Vector3();
  const outP = [];
  const outN = [];
  const outUV = [];
  const uv = [[0, 0], [0, 0], [0, 0]];
  for (const [s, e] of ranges) {
    for (let t = s; t < e; t += 3) {
      for (let k = 0; k < 3; k++) {
        P[k].fromBufferAttribute(pos, idx[t + k]);
        N[k].fromBufferAttribute(nor, idx[t + k]);
      }
      e1.subVectors(P[1], P[0]);
      e2.subVectors(P[2], P[0]);
      fn.crossVectors(e1, e2);
      const len = fn.length();
      if (len < 1e-12) continue;
      fn.divideScalar(len);
      if (fn.dot(dir) < minDot) continue;
      let minU = Infinity; let maxU = -Infinity; let minV = Infinity; let maxV = -Infinity;
      for (let k = 0; k < 3; k++) {
        const u = uFn ? uFn(P[k]) : (P[k].dot(uDir) - u0) / uSize;
        const v = (P[k].dot(vDir) - v0) / vSize;
        uv[k][0] = u; uv[k][1] = v;
        minU = Math.min(minU, u); maxU = Math.max(maxU, u);
        minV = Math.min(minV, v); maxV = Math.max(maxV, v);
      }
      if (maxU < 0 || minU > 1 || maxV < 0 || minV > 1) continue;
      for (let k = 0; k < 3; k++) {
        outP.push(P[k].x + N[k].x * offset, P[k].y + N[k].y * offset, P[k].z + N[k].z * offset);
        outN.push(N[k].x, N[k].y, N[k].z);
        outUV.push(uv[k][0], uv[k][1]);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(outP, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(outN, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(outUV, 2));
  return g;
}
