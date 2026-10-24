// Kit for building real 3D details on a lofted body: lamp lenses with
// bezels, grille bars, chrome surrounds, pixel lights, badges and plates.
// Shapes are designed in 2D view coordinates (see surface.js) and mapped
// onto the shell, so they follow its curvature exactly.
//
// Usage inside a car spec:  parts3d(K, c) { const F = K.view('front'); ... }
// Every part is tagged with a material key; finish() merges parts that share
// a key into one geometry so a car stays cheap to draw.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function distToPoly(x, y, poly) {
  let d = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j];
    const [bx, by] = poly[i];
    const vx = bx - ax;
    const vy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy || 1e-12)));
    d = Math.min(d, Math.hypot(ax + vx * t - x, ay + vy * t - y));
  }
  return d;
}

function resample(poly, h) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / h));
    for (let j = 0; j < k; j++) out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]);
  }
  return out;
}

/** Bowyer-Watson Delaunay triangulation of 2D points -> index triples. */
function delaunay(pts) {
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const [x, y] of pts) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  const d = Math.max(maxX - minX, maxY - minY) * 20 + 1;
  const mx = (minX + maxX) / 2;
  const my = (minY + maxY) / 2;
  const P = [...pts, [mx - d, my - d], [mx + d, my - d], [mx, my + d]];
  const n = pts.length;
  const circ = (a, b, c) => {
    const [ax, ay] = P[a]; const [bx, by] = P[b]; const [cx, cy] = P[c];
    const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    if (Math.abs(D) < 1e-18) return { x: 0, y: 0, r2: Infinity };
    const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D;
    const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D;
    return { x: ux, y: uy, r2: (ax - ux) ** 2 + (ay - uy) ** 2 };
  };
  let tris = [{ v: [n, n + 1, n + 2], c: circ(n, n + 1, n + 2) }];
  for (let i = 0; i < n; i++) {
    const [px, py] = P[i];
    const bad = [];
    const keep = [];
    for (const t of tris) ((px - t.c.x) ** 2 + (py - t.c.y) ** 2 < t.c.r2 * (1 + 1e-12) ? bad : keep).push(t);
    const edges = new Map();
    for (const t of bad) {
      for (const [a, b] of [[t.v[0], t.v[1]], [t.v[1], t.v[2]], [t.v[2], t.v[0]]]) {
        const k = a < b ? `${a}_${b}` : `${b}_${a}`;
        if (edges.has(k)) edges.delete(k); else edges.set(k, [a, b]);
      }
    }
    for (const [a, b] of edges.values()) keep.push({ v: [a, b, i], c: circ(a, b, i) });
    tris = keep;
  }
  return tris.filter((t) => t.v.every((k) => k < n)).map((t) => t.v);
}

/** Even triangle mesh filling an outline (minus holes), spacing about h. */
function meshPolygon(outline, holes, h) {
  const rings = [outline, ...holes].map((r) => resample(r, h));
  const pts = rings.flat();
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const [x, y] of outline) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  const inside = (x, y) => inPoly(x, y, outline) && !holes.some((hl) => inPoly(x, y, hl));
  for (let y = minY + h / 2, row = 0; y < maxY; y += h * 0.866, row++) {
    for (let x = minX + (row % 2 ? h / 2 : 0); x < maxX; x += h) {
      if (!inside(x, y)) continue;
      if (rings.some((r) => distToPoly(x, y, r) < h * 0.5)) continue;
      pts.push([x, y]);
    }
  }
  const tris = delaunay(pts).filter(([a, b, c]) => {
    const cx = (pts[a][0] + pts[b][0] + pts[c][0]) / 3;
    const cy = (pts[a][1] + pts[b][1] + pts[c][1]) / 3;
    return inside(cx, cy);
  });
  return { pts, tris };
}

export function makeKit(surface, { lod = 'high' } = {}) {
  const low = lod === 'low';
  const items = [];
  const add = (geometry, opts) => {
    if (!geometry) return null;
    const item = { geometry, key: opts.key ?? 'glossBlack', painter: opts.painter ?? null, emissive: !!opts.emissive, order: opts.order ?? 4, shadow: !!opts.shadow, double: !!opts.doubleSided };
    items.push(item);
    return item;
  };

  function view(name, sign = 1) {
    const frame = (u, v) => surface.frame(name, u, v, sign);
    // falls back to the nearest mapped neighbour when a point misses
    let last = null;
    const safe = (u, v) => {
      const f = frame(u, v);
      if (f) last = f;
      return f || last;
    };

    /** Surface patch inside an outline (optionally with holes), lifted by off. */
    function patch(outline, opts = {}) {
      const off = opts.off ?? 0.003;
      const { pts: verts2raw, tris } = meshPolygon(outline, opts.holes || [], opts.maxEdge ?? (low ? 0.05 : 0.02));
      const verts2 = verts2raw.map(([x, y]) => ({ x, y }));
      let [u0, v0, u1, v1] = opts.uvRect || [Infinity, Infinity, -Infinity, -Infinity];
      if (!opts.uvRect) {
        for (const [x, y] of outline) {
          u0 = Math.min(u0, x); v0 = Math.min(v0, y);
          u1 = Math.max(u1, x); v1 = Math.max(v1, y);
        }
      }
      const pos = [];
      const nor = [];
      const uv = [];
      for (const p of verts2) {
        const f = safe(p.x, p.y);
        if (!f) return null;
        const bulge = opts.bulge ? opts.bulge(p.x, p.y) : 0;
        pos.push(f.p.x + f.n.x * (off + bulge), f.p.y + f.n.y * (off + bulge), f.p.z + f.n.z * (off + bulge));
        nor.push(f.n.x, f.n.y, f.n.z);
        uv.push((p.x - u0) / (u1 - u0 || 1), (p.y - v0) / (v1 - v0 || 1));
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      // keep front faces pointing out of the body
      const idx = [];
      const a = new THREE.Vector3();
      const b = new THREE.Vector3();
      const cr = new THREE.Vector3();
      for (const [i, j, k] of tris) {
        a.set(pos[j * 3] - pos[i * 3], pos[j * 3 + 1] - pos[i * 3 + 1], pos[j * 3 + 2] - pos[i * 3 + 2]);
        b.set(pos[k * 3] - pos[i * 3], pos[k * 3 + 1] - pos[i * 3 + 1], pos[k * 3 + 2] - pos[i * 3 + 2]);
        cr.crossVectors(a, b);
        if (cr.x * nor[i * 3] + cr.y * nor[i * 3 + 1] + cr.z * nor[i * 3 + 2] < 0) idx.push(i, k, j); else idx.push(i, j, k);
      }
      g.setIndex(idx);
      if (opts.recomputeNormals) g.computeVertexNormals();
      return add(g, opts);
    }

    /** Band standing up from the surface along an outline (lamp bezel, frame lip). */
    function wall(outline, opts = {}) {
      const off0 = opts.off0 ?? 0;
      const off1 = opts.off1 ?? 0.008;
      const closed = opts.closed ?? true;
      const pts = [];
      const step = opts.step ?? (low ? 0.05 : 0.015);
      for (let i = 0; i < outline.length - (closed ? 0 : 1); i++) {
        const a = outline[i];
        const b = outline[(i + 1) % outline.length];
        const k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
        for (let j = 0; j < k; j++) pts.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]);
      }
      if (!closed) pts.push(outline[outline.length - 1]);
      const fr = pts.map(([u, v]) => safe(u, v));
      if (fr.some((f) => !f)) return null;
      const c = new THREE.Vector3();
      for (const f of fr) c.add(f.p);
      c.divideScalar(fr.length);
      const pos = [];
      const nor = [];
      const uv = [];
      const m = fr.length;
      for (let i = 0; i < m; i++) {
        const f = fr[i];
        const prev = fr[(i - 1 + m) % m].p;
        const next = fr[(i + 1) % m].p;
        const t = new THREE.Vector3().subVectors(next, prev).normalize();
        const side = new THREE.Vector3().crossVectors(t, f.n).normalize();
        if (side.dot(new THREE.Vector3().subVectors(f.p, c)) < 0) side.negate();
        for (const o of [off0, off1]) {
          pos.push(f.p.x + f.n.x * o, f.p.y + f.n.y * o, f.p.z + f.n.z * o);
          nor.push(side.x, side.y, side.z);
          uv.push(i / m, o === off0 ? 0 : 1);
        }
      }
      const idx = [];
      const segs = closed ? m : m - 1;
      for (let i = 0; i < segs; i++) {
        const j = (i + 1) % m;
        idx.push(i * 2, j * 2, i * 2 + 1, i * 2 + 1, j * 2, j * 2 + 1);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      return add(g, { ...opts, doubleSided: true });
    }

    /** Raised unit: lens patch on top of a bezel wall, like a real lamp. */
    function lamp(outline, opts = {}) {
      const h = opts.height ?? 0.008;
      wall(outline, { key: opts.bezel ?? 'glossBlack', off0: -0.004, off1: h });
      return patch(outline, { ...opts, off: h, key: opts.key ?? 'lens' });
    }

    /** Tube along a 2D path (LED light guides, chrome surrounds, bars). */
    function tube(path, opts = {}) {
      const r = opts.radius ?? 0.006;
      const off = opts.off ?? 0;
      const pts = [];
      const step = opts.step ?? (low ? 0.06 : 0.02);
      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i];
        const b = path[i + 1];
        const k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
        for (let j = 0; j < k; j++) pts.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]);
      }
      if (!opts.closed) pts.push(path[path.length - 1]);
      const p3 = [];
      for (const [u, v] of pts) {
        const f = safe(u, v);
        if (!f) return null;
        p3.push(f.p.clone().addScaledVector(f.n, off + r));
      }
      if (p3.length < 2) return null;
      const curve = new THREE.CatmullRomCurve3(p3, !!opts.closed, 'centripetal');
      const g = new THREE.TubeGeometry(curve, Math.max(4, Math.round(p3.length * (low ? 1 : 2))), r, low ? 5 : opts.radial ?? 8, !!opts.closed);
      return add(g, opts);
    }

    /** Oriented box sitting on the surface (pixels, plates, slats). */
    function box(u, v, opts = {}) {
      const f = safe(u, v);
      if (!f) return null;
      const w = opts.w ?? 0.03;
      const hgt = opts.h ?? 0.03;
      const d = opts.d ?? 0.01;
      const off = opts.off ?? 0;
      const g = opts.radius ? roundedBoxGeo(w, hgt, d, opts.radius) : new THREE.BoxGeometry(w, hgt, d);
      const t = f.t.clone().addScaledVector(f.n, -f.t.dot(f.n)).normalize();
      const bvec = new THREE.Vector3().crossVectors(f.n, t).normalize();
      // keep "up" in the drawing pointing up in the world where possible
      const upHint = name === 'top' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      if (bvec.dot(upHint) < 0) { bvec.negate(); t.negate(); }
      const rot = opts.rot ?? 0;
      const tt = t.clone().multiplyScalar(Math.cos(rot)).addScaledVector(bvec, Math.sin(rot));
      const bb = bvec.clone().multiplyScalar(Math.cos(rot)).addScaledVector(t, -Math.sin(rot));
      const mtx = new THREE.Matrix4().makeBasis(tt, bb, f.n);
      mtx.setPosition(f.p.clone().addScaledVector(f.n, off + d / 2));
      g.applyMatrix4(mtx);
      return add(g, opts);
    }

    /** Flat 2D shape (badge, letters) extruded off the surface at (u, v). */
    function shape(u, v, shp, opts = {}) {
      const f = safe(u, v);
      if (!f) return null;
      const depth = opts.depth ?? 0.006;
      const g = new THREE.ExtrudeGeometry(shp, { depth, bevelEnabled: !!opts.bevel, bevelSize: opts.bevel ?? 0, bevelThickness: opts.bevel ?? 0, bevelSegments: 2, curveSegments: low ? 6 : 16 });
      const s = opts.scale ?? 1;
      g.scale(s, s, 1);
      const t = f.t.clone().addScaledVector(f.n, -f.t.dot(f.n)).normalize();
      const bvec = new THREE.Vector3().crossVectors(f.n, t).normalize();
      const upHint = name === 'top' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      if (bvec.dot(upHint) < 0) { bvec.negate(); t.negate(); }
      if (opts.mirror) t.negate();
      const mtx = new THREE.Matrix4().makeBasis(t, bvec, f.n);
      mtx.setPosition(f.p.clone().addScaledVector(f.n, opts.off ?? 0));
      g.applyMatrix4(mtx);
      return add(g, opts);
    }

    return { frame, patch, wall, lamp, tube, box, shape, name, sign };
  }

  function finish() {
    const merged = new Map();
    const out = [];
    for (const it of items) {
      if (it.painter) { out.push(it); continue; }
      const k = `${it.key}|${it.order}|${it.emissive}|${it.double}`;
      if (!merged.has(k)) merged.set(k, { ...it, list: [] });
      merged.get(k).list.push(it.geometry.index ? it.geometry.toNonIndexed() : it.geometry);
    }
    for (const m of merged.values()) {
      for (const g of m.list) {
        for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
        if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      }
      const geometry = m.list.length === 1 ? m.list[0] : mergeGeometries(m.list, false);
      out.push({ geometry, key: m.key, order: m.order, emissive: m.emissive, shadow: m.shadow, double: m.double });
    }
    return out;
  }

  return { view, finish, low };
}

function roundedBoxGeo(w, h, d, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  const rr = Math.min(r, w / 2, h / 2);
  s.moveTo(x + rr, y);
  s.lineTo(x + w - rr, y);
  s.quadraticCurveTo(x + w, y, x + w, y + rr);
  s.lineTo(x + w, y + h - rr);
  s.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  s.lineTo(x + rr, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - rr);
  s.lineTo(x, y + rr);
  s.quadraticCurveTo(x, y, x + rr, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 3 });
  g.translate(0, 0, -d / 2);
  return g;
}
