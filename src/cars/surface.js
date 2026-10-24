// Surface mapping for the lofted (v2) bodies: turns 2D design coordinates
// into points and normals on the body shell, so 3D details (lamps, grilles,
// badges, plates) can be built to sit exactly on the paint.
//
// Views, all in metres:
//   'front' / 'rear' : (s, y) where s is the signed arc length round the nose
//                      (or tail) at height y, measured from the centre line,
//                      positive towards +z. Wraps naturally round corners.
//   'side'           : (x, y) on the +z side; pass sign -1 for the -z side
//   'top'            : (x, z) on the upper surface

import * as THREE from 'three';

export function makeSurface(rings, halfCount) {
  // the +z half of every section: floor centre -> round the side -> roof centre
  const H = rings.map((r) => r.slice(0, halfCount));
  const n = H.length;

  function crossAtY(ring, y) {
    let best = null;
    for (let j = 0; j < ring.length - 1; j++) {
      const a = ring[j];
      const b = ring[j + 1];
      if ((a.y - y) * (b.y - y) > 0) continue;
      const dy = b.y - a.y;
      const t = Math.abs(dy) < 1e-9 ? 0.5 : (y - a.y) / dy;
      if (t < 0 || t > 1) continue;
      const z = a.z + (b.z - a.z) * t;
      if (!best || z > best.z) best = { x: a.x + (b.x - a.x) * t, z };
    }
    return best;
  }

  function crossAtZ(ring, z) {
    let best = null;
    for (let j = 0; j < ring.length - 1; j++) {
      const a = ring[j];
      const b = ring[j + 1];
      if ((a.z - z) * (b.z - z) > 0) continue;
      const dz = b.z - a.z;
      const t = Math.abs(dz) < 1e-9 ? 0.5 : (z - a.z) / dz;
      if (t < 0 || t > 1) continue;
      const y = a.y + (b.y - a.y) * t;
      if (!best || y > best.y) best = { x: a.x + (b.x - a.x) * t, y };
    }
    return best;
  }

  // horizontal section of the shell at height y, as arc-length tables from
  // the nose centre and from the tail centre
  const planCache = new Map();
  function plan(y) {
    const key = Math.round(y * 4000);
    let p = planCache.get(key);
    if (p) return p;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const c = crossAtY(H[i], y);
      if (c) pts.push(c);
    }
    const build = (seq) => {
      const out = [];
      if (!seq.length) return out;
      out.push({ x: seq[0].x, z: 0, s: 0 });
      let s = 0;
      let px = seq[0].x;
      let pz = 0;
      for (const q of seq) {
        s += Math.hypot(q.x - px, q.z - pz);
        out.push({ x: q.x, z: q.z, s });
        px = q.x;
        pz = q.z;
      }
      return out;
    };
    p = { front: build([...pts].reverse()), rear: build(pts), side: pts };
    planCache.set(key, p);
    return p;
  }

  function alongArc(table, s) {
    if (!table.length) return null;
    if (s <= 0) return { x: table[0].x, z: 0 };
    let lo = 0;
    let hi = table.length - 1;
    if (s >= table[hi].s) return { x: table[hi].x, z: table[hi].z };
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (table[m].s > s) hi = m; else lo = m;
    }
    const a = table[lo];
    const b = table[hi];
    const t = (s - a.s) / Math.max(1e-9, b.s - a.s);
    return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
  }

  function point(view, u, v, sign = 1) {
    if (view === 'front' || view === 'rear') {
      const q = alongArc(plan(v)[view], Math.abs(u));
      return q ? new THREE.Vector3(q.x, v, Math.sign(u || 1) * q.z) : null;
    }
    if (view === 'side') {
      const seq = plan(v).side;
      if (!seq.length) return null;
      let lo = 0;
      let hi = seq.length - 1;
      if (u <= seq[0].x) return new THREE.Vector3(seq[0].x, v, sign * seq[0].z);
      if (u >= seq[hi].x) return new THREE.Vector3(seq[hi].x, v, sign * seq[hi].z);
      while (hi - lo > 1) {
        const m = (lo + hi) >> 1;
        if (seq[m].x > u) hi = m; else lo = m;
      }
      const a = seq[lo];
      const b = seq[hi];
      const t = (u - a.x) / Math.max(1e-9, b.x - a.x);
      return new THREE.Vector3(u, v, sign * (a.z + (b.z - a.z) * t));
    }
    // top: (x, z)
    const az = Math.abs(v);
    let prev = null;
    for (let i = 0; i < n; i++) {
      const c = crossAtZ(H[i], az);
      if (!c) continue;
      if (prev && prev.x <= u && c.x >= u) {
        const t = (u - prev.x) / Math.max(1e-9, c.x - prev.x);
        return new THREE.Vector3(u, prev.y + (c.y - prev.y) * t, v);
      }
      prev = c;
    }
    return null;
  }

  /** Point and outward unit normal for 2D coordinates in a view. */
  function frame(view, u, v, sign = 1) {
    const p = point(view, u, v, sign);
    if (!p) return null;
    const e = 0.004;
    const pu0 = point(view, u - e, v, sign) || p;
    const pu1 = point(view, u + e, v, sign) || p;
    const pv0 = point(view, u, v - e, sign) || p;
    const pv1 = point(view, u, v + e, sign) || p;
    const du = new THREE.Vector3().subVectors(pu1, pu0);
    const dv = new THREE.Vector3().subVectors(pv1, pv0);
    const nrm = new THREE.Vector3().crossVectors(du, dv);
    if (nrm.lengthSq() < 1e-14) nrm.set(view === 'rear' ? -1 : view === 'top' ? 0 : 1, view === 'top' ? 1 : 0, 0);
    nrm.normalize();
    // orient away from the body's centre line
    const out = view === 'top' ? new THREE.Vector3(0, 1, 0) : view === 'side' ? new THREE.Vector3(0, 0, sign) : new THREE.Vector3(view === 'front' ? 1 : -1, 0.3, p.z * 2);
    if (nrm.dot(out) < 0) nrm.negate();
    if (du.lengthSq() > 1e-14) du.normalize();
    return { p, n: nrm, t: du };
  }

  /** Inverse of the front/rear mapping: arc length of a body point at its height. */
  function wrapCoord(view, p) {
    const table = plan(p.y)[view];
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < table.length - 1; i++) {
      const a = table[i];
      const b = table[i + 1];
      const ax = b.x - a.x;
      const az = b.z - a.z;
      const len2 = ax * ax + az * az || 1e-12;
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * ax + (Math.abs(p.z) - a.z) * az) / len2));
      const d = Math.hypot(a.x + ax * t - p.x, a.z + az * t - Math.abs(p.z));
      if (d < bestD) {
        bestD = d;
        best = a.s + (b.s - a.s) * t;
      }
    }
    return Math.sign(p.z || 1) * best;
  }

  return { frame, point, plan, wrapCoord };
}
