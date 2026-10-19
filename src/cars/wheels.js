// Wheels: lathed tyres, extruded rims with several spoke designs, brake discs
// and calipers. Geometries are cached by style/size.

import * as THREE from 'three';

export const RIM_STYLES = ['spoke5', 'twin5', 'star', 'multi', 'aero', 'mesh', 'turbine', 'steel', 'classic', 'dish', 'smart', 'pixel', 'amg'];

const geoCache = new Map();
function cached(key, make) {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
}

function tyreGeometry(R, width, rimR, segs = 40) {
  return cached(`tyre:${R}:${width}:${rimR}:${segs}`, () => {
    const pts = [];
    const hw = width / 2;
    const rr = Math.min(width * 0.32, (R - rimR) * 0.6);
    pts.push(new THREE.Vector2(rimR * 0.97, -hw * 0.82));
    pts.push(new THREE.Vector2(rimR + (R - rimR) * 0.35, -hw * 0.98));
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const a = -Math.PI / 2 + (Math.PI / 2) * (i / steps);
      pts.push(new THREE.Vector2(R - rr + rr * Math.cos(a), -hw + rr + rr * Math.sin(a)));
    }
    for (let i = 0; i <= steps; i++) {
      const a = (Math.PI / 2) * (i / steps);
      pts.push(new THREE.Vector2(R - rr + rr * Math.cos(a), hw - rr + rr * Math.sin(a)));
    }
    pts.push(new THREE.Vector2(rimR + (R - rimR) * 0.35, hw * 0.98));
    pts.push(new THREE.Vector2(rimR * 0.97, hw * 0.82));
    const g = new THREE.LatheGeometry(pts, segs);
    g.rotateX(Math.PI / 2); // lathe axis Y -> Z (axle)
    return g;
  });
}

function sector(path, rIn, rOut, a0, a1) {
  // annular sector hole with softened corners, a0 < a1
  const steps = 10;
  const pts = [];
  const pad = Math.min(0.05, (a1 - a0) * 0.18);
  for (let i = 0; i <= steps; i++) {
    const a = a0 + pad + ((a1 - a0 - 2 * pad) * i) / steps;
    pts.push([Math.cos(a) * rOut, Math.sin(a) * rOut]);
  }
  const rIn2 = rIn + (rOut - rIn) * 0.06;
  for (let i = steps; i >= 0; i--) {
    const a = a0 + pad * 1.6 + ((a1 - a0 - 3.2 * pad) * i) / steps;
    pts.push([Math.cos(a) * rIn2, Math.sin(a) * rIn2]);
  }
  pts.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
  path.closePath();
}

function polyHole(points) {
  const p = new THREE.Path();
  points.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}

// grow > 0 enlarges the windows and shrinks the outer edge (used for the
// black cover over a machined rim, leaving thin bright outlines)
function rimShape(style, grow = 0) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 1 - grow * 1.6, 0, Math.PI * 2, false);
  const holes = [];
  const add = (fn) => { const p = new THREE.Path(); fn(p); holes.push(p); };
  const TAU = Math.PI * 2;
  switch (style) {
    case 'spoke5': {
      const n = 5;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        add((p) => sector(p, 0.34, 0.86, a + 0.26, a + TAU / n - 0.26));
      }
      break;
    }
    case 'twin5': {
      const n = 5;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        add((p) => sector(p, 0.32, 0.87, a + 0.2, a + TAU / n - 0.2));
        // slim gap that splits each spoke in two
        add((p) => sector(p, 0.42, 0.85, a - 0.04, a + 0.04));
      }
      break;
    }
    case 'star': {
      const n = 5;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        const P = (r, ang) => [Math.cos(ang) * r, Math.sin(ang) * r];
        holes.push(polyHole([P(0.3, a + 0.25), P(0.86, a + 0.42), P(0.86, a + 1.08), P(0.62, a + 1.0)]));
      }
      break;
    }
    case 'multi': {
      const n = 10;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        add((p) => sector(p, 0.3, 0.87, a + 0.1, a + TAU / n - 0.1));
      }
      break;
    }
    case 'aero': {
      const n = 4;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + Math.PI / 4;
        add((p) => sector(p, 0.55, 0.84, a - 0.38, a + 0.38));
      }
      break;
    }
    case 'mesh': {
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        const P = (r, ang) => [Math.cos(ang) * r, Math.sin(ang) * r];
        holes.push(polyHole([P(0.36, a + 0.08), P(0.6, a + 0.2), P(0.36, a + TAU / n - 0.08)]));
        holes.push(polyHole([P(0.64, a + 0.12), P(0.87, a + 0.06), P(0.87, a + TAU / n - 0.06), P(0.64, a + TAU / n - 0.12 + 0.0)]));
      }
      break;
    }
    case 'turbine': {
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        const pts = [];
        for (let k = 0; k <= 6; k++) {
          const t = k / 6;
          const r = 0.34 + t * 0.52;
          pts.push([Math.cos(a + t * 0.7) * r, Math.sin(a + t * 0.7) * r]);
        }
        for (let k = 6; k >= 0; k--) {
          const t = k / 6;
          const r = 0.34 + t * 0.52;
          pts.push([Math.cos(a + t * 0.7 + 0.2) * r, Math.sin(a + t * 0.7 + 0.2) * r]);
        }
        holes.push(polyHole(pts));
      }
      break;
    }
    case 'steel': {
      const n = 6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        add((p) => p.absarc(Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0.12, 0, TAU, true));
      }
      break;
    }
    case 'classic': {
      const n = 5;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        add((p) => sector(p, 0.5, 0.78, a + 0.35, a + TAU / n - 0.35));
      }
      break;
    }
    case 'smart': {
      // smart #2 aero wheel: four slim spokes in an X that flare into the rim,
      // the windows between them are closed by black aero inserts
      const n = 4;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + Math.PI / 4;
        add((p) => sector(p, 0.25 - grow, 0.885 + grow, a + 0.13 - grow * 1.6, a + TAU / n - 0.13 + grow * 1.6));
      }
      break;
    }
    case 'pixel': {
      // IONIQ N Line "shuriken": five thin blades that kink part-way out,
      // leaving big pinwheel windows
      const n = 5;
      const P = (r, ang) => [Math.cos(ang) * r, Math.sin(ang) * r];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        const b = a + TAU / n;
        const pts = [P(0.32, a + 0.16), P(0.58, a + 0.16 + 0.14), P(0.86, a + 0.6 + 0.12)];
        for (let k = 1; k < 6; k++) pts.push(P(0.86, a + 0.72 + ((b + 0.48 - a - 0.72) * k) / 6));
        pts.push(P(0.86, b + 0.6 - 0.12), P(0.58, b + 0.16 - 0.12), P(0.32, b - 0.12));
        holes.push(polyHole(pts));
      }
      break;
    }
    case 'amg': {
      // AMG twin five-spoke (Y spokes) with wide windows
      const n = 5;
      const P = (r, ang) => [Math.cos(ang) * r, Math.sin(ang) * r];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        holes.push(polyHole([P(0.3, a + 0.2), P(0.88, a + 0.17), P(0.88, a + TAU / n - 0.17), P(0.3, a + TAU / n - 0.2)]));
        holes.push(polyHole([P(0.48, a - 0.045), P(0.88, a - 0.06), P(0.88, a + 0.06), P(0.48, a + 0.045)]));
      }
      break;
    }
    case 'dish':
    default: {
      const n = 6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        add((p) => sector(p, 0.3, 0.7, a + 0.22, a + TAU / n - 0.22));
      }
      break;
    }
  }
  shape.holes = holes;
  return shape;
}

// concave face: the centre of the rim sits deeper than the lip
const DISH = { smart: 0.06, steel: 0.04, dish: 0.05, classic: 0.08 };
const dishZ = (style, r) => -(DISH[style] ?? 0.16) * Math.pow(Math.max(0, 1 - r), 1.5);

function rimGeometry(style, rimR, depth, low = false, grow = 0) {
  return cached(`rim:${style}:${rimR}:${depth}:${low}:${grow}`, () => {
    const g = new THREE.ExtrudeGeometry(rimShape(style, grow), {
      depth: depth / rimR,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.03,
      bevelSegments: low ? 1 : 2,
      curveSegments: low ? 8 : 18,
    });
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + dishZ(style, Math.hypot(p.getX(i), p.getY(i))));
    g.scale(rimR, rimR, rimR);
    g.computeVertexNormals();
    return g;
  });
}

// black aero insert that closes the windows of covered rims
const INSERT_STYLES = new Set(['smart']);
function insertGeometry(style, rimR) {
  return cached(`insert:${style}:${rimR}`, () => {
    const g = new THREE.CircleGeometry(0.9, 48, 0, Math.PI * 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, dishZ(style, Math.hypot(p.getX(i), p.getY(i))) - 0.05);
    g.scale(rimR, rimR, rimR);
    g.computeVertexNormals();
    return g;
  });
}

const sharedMats = {};
function mat(key, make) {
  if (!sharedMats[key]) sharedMats[key] = make();
  return sharedMats[key];
}

export function tyreMaterial() {
  return mat('tyre', () => new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.92, metalness: 0 }));
}
export function barrelMaterial() {
  return mat('barrel', () => new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.5, metalness: 0.4 }));
}
export function discMaterial() {
  return mat('disc', () => new THREE.MeshStandardMaterial({ color: 0x8b8d92, roughness: 0.35, metalness: 0.85 }));
}

/**
 * Builds one wheel. Returns { group, spin } where spin is the sub-group that
 * rotates around the axle (local z).
 */
export function buildWheel({ radius, width, style = 'spoke5', rimMaterial, caliperMaterial, rimRatio = 0.66, accentMaterial = null, lod = 'high' }) {
  const low = lod === 'low';
  const group = new THREE.Group();
  const spin = new THREE.Group();
  group.add(spin);
  const rimR = radius * rimRatio;
  const tyre = new THREE.Mesh(tyreGeometry(radius, width, rimR, low ? 18 : 40), tyreMaterial());
  tyre.castShadow = true;
  spin.add(tyre);

  const depth = width * 0.12;
  const covered = INSERT_STYLES.has(style) && accentMaterial;
  const rim = new THREE.Mesh(rimGeometry(style, rimR, depth, low), covered ? accentMaterial : rimMaterial);
  rim.position.z = width * 0.5 - depth - width * 0.12;
  spin.add(rim);
  if (covered) {
    // black spoke faces over the machined rim: only thin bright edges remain
    const cover = new THREE.Mesh(rimGeometry(style, rimR, depth * 0.5, low, 0.022), rimMaterial);
    cover.position.z = rim.position.z + depth * 0.5 + 0.003;
    spin.add(cover);
    const insertMat = mat(`insert:${rimMaterial.color.getHexString()}`, () => new THREE.MeshStandardMaterial({ color: rimMaterial.color.clone(), roughness: 0.42, metalness: 0 }));
    const insert = new THREE.Mesh(insertGeometry(style, rimR), insertMat);
    insert.position.z = rim.position.z + depth * 0.5;
    spin.add(insert);
  }

  const barrel = new THREE.Mesh(
    cached(`barrel:${rimR}:${width}`, () => new THREE.CylinderGeometry(rimR * 0.98, rimR * 0.98, width * 0.8, 28, 1, true).rotateX(Math.PI / 2)),
    barrelMaterial(),
  );
  barrel.material.side = THREE.DoubleSide;
  spin.add(barrel);

  const back = new THREE.Mesh(
    cached(`back:${rimR}`, () => new THREE.CircleGeometry(rimR * 0.98, 24)),
    barrelMaterial(),
  );
  back.position.z = -width * 0.05;
  spin.add(back);

  const disc = new THREE.Mesh(
    cached(`disc:${rimR}`, () => new THREE.CylinderGeometry(rimR * 0.78, rimR * 0.78, 0.02, 24).rotateX(Math.PI / 2)),
    discMaterial(),
  );
  disc.position.z = width * 0.05;
  spin.add(disc);

  const cap = new THREE.Mesh(
    cached(`cap:${rimR}`, () => new THREE.SphereGeometry(rimR * 0.16, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2)),
    rimMaterial,
  );
  cap.position.z = rim.position.z + depth + 0.004 + dishZ(style, 0.1) * rimR;
  cap.scale.z = 0.5;
  spin.add(cap);

  if (accentMaterial && !covered) {
    // machined lip ring on the rim face
    const lip = new THREE.Mesh(
      cached(`lip:${rimR}`, () => new THREE.TorusGeometry(rimR * 0.95, rimR * 0.035, 8, 48)),
      accentMaterial,
    );
    lip.position.z = rim.position.z + depth * 0.6;
    spin.add(lip);
  }

  if (caliperMaterial) {
    const cal = new THREE.Mesh(
      cached(`cal:${rimR}`, () => {
        const s = new THREE.Shape();
        s.absarc(0, 0, rimR * 0.8, 0.5, 1.5, false);
        s.absarc(0, 0, rimR * 0.52, 1.5, 0.5, true);
        const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 1, curveSegments: 10 });
        return g;
      }),
      caliperMaterial,
    );
    cal.position.z = width * 0.08;
    group.add(cal);
  }
  return { group, spin, rim, cap };
}
