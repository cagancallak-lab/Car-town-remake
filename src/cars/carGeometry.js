// Geometry utilities shared by the car generator: monotone profile curves,
// grid skinning with per-quad material groups, and planar overlay projection
// used to print lights, glass and liveries onto the smooth shells.
//
// The car faces +X, Y is up and Z is the car's width.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const MAT = { PAINT: 0, ROOF: 1, GLASS: 2, TRIM: 3, CHROME: 4 };
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
export function gridGeometry(rings, classify, { closed = true, capEnd = null } = {}) {
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
export function ensureOutward(geo, probe, outward) {
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

// --- Small helpers for detail parts --------------------------------------------

export function roundedBox(w, h, d, r = 0.02, seg = 2) {
  return new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2) * 0.999);
}

// Planar-projects a set of triangles from a shell geometry into an overlay
// geometry with UVs, used to "print" fascias (lights, grilles, plates) and
// liveries onto the smooth bodies.
export function projectOverlay(geo, { dir, uDir, vDir, u0, uSize, v0, vSize, minDot = 0.2, offset = 0.0025, materials = null, uFn = null, keep = null }) {
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
      if (keep && !keep(P[0], P[1], P[2])) continue;
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
