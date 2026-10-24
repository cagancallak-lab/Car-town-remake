// Cars from the second batch of reference photos, built like featured.js:
// real size in metres, lofted v2 bodies and drawn details from the photos.
//
//   * Vapid sport pickup — red regular-cab concept truck, cross-bar grille
//                          with four mesh openings, silver VAPID bumper
//                          plate, roof light pods, sail panels, quad bike
//                          in the bed
//   * Opel Frontera      — silver compact SUV, black full-width "Vizor"
//                          with the Blitz logo and slim LED lamps, black
//                          arch cladding, two-tone blade wheels
//   * KGM Musso Grand    — dark grey double-cab pickup, tall square face,
//                          silver-framed geometric grille, LED bar under
//                          the hood, MUSSO lettering, open bed

import * as THREE from 'three';
import { greenhouse, roundedPoly, smoothPath, plate, gap, line, rrect, crect, circle, poly, both, glassPanel, archBand } from './v2draw.js';

const GLOSS_BLACK = '#0b0c0f';
const SATIN_BLACK = '#1a1b1f';
const CHROME = '#dfe3e8';

/** Fine black mesh: a dark field with a lighter diamond lattice. */
function mesh(P, path, x0, x1, y0, y1, pitch = 0.022) {
  P.fill(path, '#08090b');
  P.clip(path, () => {
    for (let x = x0 - (y1 - y0); x < x1; x += pitch) {
      P.stroke(line([[x, y0], [x + (y1 - y0), y1]]), 'rgba(70,74,82,0.85)', 0.004);
      P.stroke(line([[x + (y1 - y0), y0], [x, y1]]), 'rgba(70,74,82,0.85)', 0.004);
    }
  });
}

// ---------------------------------------------------------------------------
// Vapid sport pickup
// ---------------------------------------------------------------------------

/** Sail panels: body-colour buttresses from the cab roof down to the bed rails. */
function sailGeometry(fn, key) {
  const x0 = key.roofRear - 0.02;
  const x1 = -1.78;
  const yTop = fn.roofAt(x0) - 0.02;
  const yRail = fn.roofAt(x1) - 0.004;
  const sh = new THREE.Shape();
  sh.moveTo(x0, yTop);
  sh.lineTo(x0 - 0.18, yTop - 0.01);
  sh.quadraticCurveTo(x0 - 0.55, yTop - 0.12, x1, yRail);
  sh.lineTo(x1 + 0.24, yRail);
  sh.quadraticCurveTo(x0 - 0.42, yTop - 0.26, x0 - 0.06, yTop - 0.17);
  sh.lineTo(x0 + 0.02, yTop - 0.17);
  sh.closePath();
  const t = 0.07;
  const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2, curveSegments: 12 });
  // lean the panel in so its top meets the narrower cab roof
  const p = g.attributes.position;
  const zRail = fn.widthAt(-1.5) - 0.045;
  const zRoof = fn.roofWidthAt(key.roofRear) - 0.03;
  for (let i = 0; i < p.count; i++) {
    const k = Math.max(0, Math.min(1, (p.getY(i) - yRail) / (yTop - yRail)));
    p.setZ(i, p.getZ(i) - t / 2 + zRail + (zRoof - zRail) * k);
  }
  g.computeVertexNormals();
  return g;
}

/** Off-road light pod: body-colour housing, black face, two square lamps. */
function lightPod(mats, ctx) {
  const g = new THREE.Group();
  const housing = new THREE.Mesh(ctx.roundedBox(0.24, 0.13, 0.46, 0.04), mats.paint);
  housing.castShadow = true;
  g.add(housing);
  const face = new THREE.Mesh(ctx.roundedBox(0.02, 0.085, 0.4, 0.01), ctx.trimMat());
  face.position.set(0.12, 0.0, 0);
  g.add(face);
  const lamp = ctx.sharedMat('podLamp', () => new THREE.MeshStandardMaterial({ color: 0xf4f7fb, emissive: 0xfff6dc, emissiveIntensity: 0.6, roughness: 0.15, metalness: 0.3 }));
  for (const z of [-0.09, 0.09]) {
    const l = new THREE.Mesh(ctx.roundedBox(0.02, 0.06, 0.13, 0.008), lamp);
    l.position.set(0.128, 0.0, z);
    g.add(l);
  }
  return g;
}

/** Sport quad bike (ATV) for the bed: white plastics, black seat and frame. */
function quadBike(ctx) {
  const g = new THREE.Group();
  const white = ctx.sharedMat('atvWhite', () => new THREE.MeshStandardMaterial({ color: 0xf2f2ef, roughness: 0.35, metalness: 0.05 }));
  const black = ctx.trimMat();
  const tyreMat = ctx.sharedMat('atvTyre', () => new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.9 }));
  const tyre = ctx.sharedGeo('atvTyre', () => new THREE.CylinderGeometry(0.22, 0.22, 0.2, 20).rotateX(Math.PI / 2));
  for (const x of [0.48, -0.46]) {
    for (const z of [0.38, -0.38]) {
      const w = new THREE.Mesh(tyre, tyreMat);
      w.position.set(x, 0.22, z);
      g.add(w);
    }
  }
  const frame = new THREE.Mesh(ctx.roundedBox(1.0, 0.16, 0.4, 0.05), black);
  frame.position.set(0, 0.36, 0);
  g.add(frame);
  for (const [x, y, len, h, w] of [[0.45, 0.5, 0.52, 0.1, 0.98], [-0.42, 0.52, 0.56, 0.12, 0.98]]) {
    const fender = new THREE.Mesh(ctx.roundedBox(len, h, w, 0.05), white);
    fender.position.set(x, y, 0);
    fender.castShadow = true;
    g.add(fender);
  }
  const tank = new THREE.Mesh(ctx.roundedBox(0.34, 0.2, 0.36, 0.07), white);
  tank.position.set(0.14, 0.62, 0);
  g.add(tank);
  const seat = new THREE.Mesh(ctx.roundedBox(0.5, 0.1, 0.3, 0.04), black);
  seat.position.set(-0.24, 0.66, 0);
  g.add(seat);
  const riser = new THREE.Mesh(ctx.roundedBox(0.05, 0.28, 0.05, 0.02), black);
  riser.position.set(0.3, 0.78, 0);
  riser.rotation.z = 0.35;
  g.add(riser);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.78, 10).rotateX(Math.PI / 2), black);
  bar.position.set(0.24, 0.93, 0);
  g.add(bar);
  for (const z of [0.36, -0.36]) {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.12, 10).rotateX(Math.PI / 2), black);
    grip.position.set(0.24, 0.93, z);
    g.add(grip);
  }
  const rack = new THREE.Mesh(ctx.roundedBox(0.3, 0.03, 0.62, 0.012), black);
  rack.position.set(-0.55, 0.6, 0);
  g.add(rack);
  return g;
}

export const VAPID = {
  id: 'vapid',
  v2: true,
  name: 'Vapid Sport Truck',
  brand: 'Vapid',
  featured: true,
  class: 'Sport Pickup',
  scale: 0.6,
  key: { cowl: 0.62, roofFront: -0.2, roofRear: -0.84, rearBase: -0.93 },
  body: {
    length: 4.9,
    width: 1.92,
    wheel: { radius: 0.346, width: 0.27, front: 1.55, rear: -1.525, archGap: 0.045 },
    // regular cab, tall "big rig" hood with dropped fenders, open bed
    roof: [[-2.45, 0.6], [-2.447, 0.84], [-2.438, 0.97], [-2.418, 1.025], [-2.3, 1.04], [-1.6, 1.045], [-1.03, 1.05], [-0.985, 1.19], [-0.95, 1.4], [-0.9, 1.485], [-0.84, 1.51], [-0.5, 1.53], [-0.25, 1.525], [-0.2, 1.515], [0.2, 1.3], [0.62, 1.09], [0.8, 1.07], [1.3, 1.04], [1.9, 1.0], [2.25, 0.975], [2.38, 0.96], [2.43, 0.925], [2.447, 0.82], [2.45, 0.6]],
    belt: [[-2.45, 0.58], [-2.447, 0.83], [-2.438, 0.96], [-2.418, 1.015], [-2.3, 1.032], [-1.6, 1.038], [-1.05, 1.042], [-0.96, 1.1], [-0.6, 1.11], [0.3, 1.1], [0.62, 1.08], [0.72, 1.02], [1.0, 0.95], [1.6, 0.88], [2.1, 0.835], [2.36, 0.81], [2.42, 0.77], [2.445, 0.7], [2.45, 0.58]],
    sill: [[-2.45, 0.42], [-2.4, 0.33], [-2.2, 0.28], [-1.0, 0.26], [1.0, 0.26], [2.2, 0.26], [2.4, 0.27], [2.45, 0.32]],
    shoulder: [[-2.45, 0.7], [-2.2, 0.9], [-1.0, 0.92], [0, 0.9], [1.5, 0.82], [2.45, 0.66]],
    wBody: [[-2.45, 0.92], [-1.5, 0.955], [0, 0.955], [1.5, 0.955], [2.45, 0.935]],
    wBelt: [[-2.45, 0.9], [-1.15, 0.925], [-1.0, 0.86], [-0.6, 0.8], [0.4, 0.82], [0.75, 0.88], [1.2, 0.91], [2.45, 0.9]],
    wRoof: [[-2.45, 0.86], [-1.15, 0.9], [-1.0, 0.72], [-0.5, 0.7], [0, 0.7], [0.5, 0.7], [0.9, 0.72], [2.45, 0.72]],
    hoodRidge: { profile: [[0.75, 0], [1.0, 0.03], [2.2, 0.04], [2.4, 0.015]], z: [0], w: 0.4 },
    noseDepth: 0.22,
    noseExp: 6,
    tailDepth: 0.12,
    tailExp: 8,
    noseRake: { depth: 0.2, y0: 0.7, y1: 1.05, amount: 0.04 },
    flare: 0.045,
    rLow: 0.1,
    roofEdge: 0.06,
    keyX: [0.62, -0.2, -0.84, -0.93],
    bed: { x0: -1.04, x1: -2.36, floor: 0.78, rail: 0.07, liner: true },
  },
  wheelDef: { style: 'disc', rimRatio: 0.74, rimColor: '#d9dde2', accent: null, caliper: null },
  colors: { paint: '#d4201a', roof: null, finish: 'gloss', rim: '#d9dde2' },
  parts: { mirrors: 'black', mirrorScale: 1.25 },
  stats: { hp: 410, kg: 1850, grip: 0.96, gears: 5, redline: 6200 },
  price: 34000,
  level: 5,
  blurb: 'A loud red sport truck with light pods on the roof and a quad bike in the bed. Weekend sorted.',
  extraParts(group, ctx) {
    const { fn, spec, mats } = ctx;
    const key = spec.key;
    // two roof light pods at the front corners of the roof
    for (const s of [1, -1]) {
      const pod = lightPod(mats, ctx);
      const x = key.roofFront - 0.12;
      pod.position.set(x, fn.roofAt(x) + 0.06, s * 0.36);
      group.add(pod);
    }
    // sail panels from the cab roof down to the bed rails
    const sail = ctx.sharedGeo('vapidSail', () => sailGeometry(fn, key));
    for (const s of [1, -1]) {
      const m = new THREE.Mesh(sail, mats.paint);
      m.scale.z = s;
      m.castShadow = true;
      group.add(m);
    }
    // quad bike standing in the bed
    const atv = quadBike(ctx);
    atv.position.set(-1.72, spec.body.bed.floor, 0);
    atv.rotation.y = 0;
    atv.scale.setScalar(0.92);
    group.add(atv);
  },
  draw: {
    side(P, c) {
      const g = greenhouse(c, { aBase: 0.6, aTop: -0.19, rBase: -0.92, rTop: -0.84, windows: [[0.6, -0.9]], inset: 0.03, cornerR: 0.05 });
      P.fill(g.surround, GLOSS_BLACK);
      for (const w of g.windows) P.glass(w);
      // door, handle, fuel flap, tailgate seam
      gap(P, [[0.55, 0.3], [0.55, 0.88], [0.6, 1.1]]);
      gap(P, [[-0.9, 0.3], [-0.9, 1.12]]);
      gap(P, [[0.55, 0.3], [-0.9, 0.3]], 0.005);
      P.fill(crect(-0.66, 1.0, 0.16, 0.03, 0.012), '#1b1c20', { metal: 0.4 });
      P.stroke(crect(-2.0, 0.92, 0.12, 0.09, 0.02), 'rgba(0,0,0,0.4)', 0.005);
      // black rub strip / crease along the body side
      P.fill(rrect(-2.4, 0.6, 4.75, 0.03, 0.012), '#3a0908');
      P.stroke(line([[2.4, 0.64], [-2.4, 0.64]]), 'rgba(255,255,255,0.25)', 0.008);
      P.stroke(line([[2.3, 0.9], [0.6, 0.98], [-2.3, 0.99]]), 'rgba(255,255,255,0.22)', 0.01);
      // side marker lights
      P.fill(crect(2.32, 0.78, 0.08, 0.04, 0.012), '#f29a1c', { metal: 0.3 });
      P.fill(crect(-2.36, 0.88, 0.07, 0.04, 0.012), '#b0101a', { metal: 0.3 });
    },
    front(P, c) {
      const span = c.frontSpan - 0.03;
      // body-colour bumper with the silver VAPID panel and round fog lamps
      P.fill(roundedPoly([[-0.47, 0.52], [0.47, 0.52], [0.45, 0.26], [-0.45, 0.26]], 0.025), CHROME, { metal: 1 });
      P.fill(roundedPoly([[-0.455, 0.505], [0.455, 0.505], [0.435, 0.275], [-0.435, 0.275]], 0.02), P.linear(0, 0.51, 0, 0.27, [[0, '#e4e7eb'], [0.5, '#a9aeb5'], [1, '#c9cdd2']]), { metal: 1 });
      P.text('V A P I D', 0, 0.4, 0.15, '#565a61', { font: 'Georgia, Times New Roman, serif', weight: '700', metal: 1, maxWidth: 0.8 });
      both((s) => {
        P.fill(crect(s * 0.27, 0.3, 0.05, 0.03, 0.012), '#202226');
        P.fill(circle(s * 0.72, 0.44, 0.07), '#2a2c30');
        P.fill(circle(s * 0.72, 0.44, 0.06), P.radial(s * 0.71, 0.45, 0.06, [[0, '#ffffff'], [0.6, '#cfd5dc'], [1, '#7c838c']]), { glow: '#fff6e6', metal: 0.6 });
      });
      P.fill(rrect(-span, 0.635, span * 2, 0.012, 0.006), 'rgba(0,0,0,0.35)');
      // rectangular headlamps with amber corners, at the top of the bumper
      both((s) => {
        const y0 = 0.655;
        const y1 = 0.76;
        const lamp = roundedPoly([[s * 0.55, y0], [s * (span - 0.02), y0], [s * span, (y0 + y1) / 2], [s * (span - 0.02), y1], [s * 0.55, y1]], 0.02);
        P.fill(lamp, '#1a1c20');
        P.fill(roundedPoly([[s * 0.565, y0 + 0.01], [s * (span - 0.2), y0 + 0.01], [s * (span - 0.2), y1 - 0.01], [s * 0.565, y1 - 0.01]], 0.015), P.linear(0, y1, 0, y0, [[0, '#cfd5dc'], [0.5, '#7d8590'], [1, '#3b4048']]), { metal: 1 });
        for (const x of [0.65, 0.76]) {
          P.fill(circle(s * x, (y0 + y1) / 2, 0.036), '#e3e7ec', { metal: 1 });
          P.fill(circle(s * x, (y0 + y1) / 2, 0.022), '#fffaf0', { glow: '#fff4e0', metal: 0.4 });
        }
        P.fill(roundedPoly([[s * (span - 0.18), y0 + 0.01], [s * (span - 0.03), y0 + 0.01], [s * (span - 0.01), (y0 + y1) / 2], [s * (span - 0.03), y1 - 0.01], [s * (span - 0.18), y1 - 0.01]], 0.012), '#f5a623', { glow: '#ffb347', metal: 0.4 });
      });
      // big-rig grille: body-colour cross with four mesh openings
      for (const [y0, y1] of [[0.7, 0.775], [0.815, 0.89]]) {
        both((s) => {
          const x0 = s * 0.07;
          const x1 = s * 0.53;
          const r = roundedPoly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 0.015);
          P.fill(roundedPoly([[x0 + s * 0.012, y0 - 0.012], [x1 + s * 0.012, y0 - 0.012], [x1 + s * 0.012, y1 + 0.012], [x0 + s * 0.012, y1 + 0.012]], 0.02), 'rgba(0,0,0,0.3)');
          mesh(P, r, Math.min(x0, x1), Math.max(x0, x1), y0, y1);
        });
      }
      // V badge on the hood edge above the cross
      P.fill(poly([[-0.065, 0.955], [0.065, 0.955], [0, 0.88]]), CHROME, { metal: 1 });
      P.fill(poly([[-0.04, 0.945], [0.04, 0.945], [0, 0.9]]), '#b5121b');
      P.fill(rrect(-span, 0.24, span * 2, 0.03, 0.012), SATIN_BLACK);
    },
    rear(P, c) {
      const span = c.rearSpan - 0.05;
      both((s) => {
        P.fill(roundedPoly([[s * (span - 0.14), 0.7], [s * span, 0.7], [s * span, 1.0], [s * (span - 0.14), 1.0]], 0.02), '#3a0508');
        P.fill(roundedPoly([[s * (span - 0.125), 0.8], [s * (span - 0.015), 0.8], [s * (span - 0.015), 0.99], [s * (span - 0.125), 0.99]], 0.015), '#d8141c', { glow: '#ff2020' });
        P.fill(roundedPoly([[s * (span - 0.125), 0.715], [s * (span - 0.015), 0.715], [s * (span - 0.015), 0.785], [s * (span - 0.125), 0.785]], 0.012), '#e9ecef', { metal: 0.6 });
      });
      gap(P, [[-span + 0.16, 0.6], [span - 0.16, 0.6]]);
      gap(P, [[-span + 0.16, 1.02], [span - 0.16, 1.02]]);
      P.text('VAPID', 0, 0.86, 0.09, '#a0161b', { font: 'Georgia, Times New Roman, serif', weight: '700' });
      P.fill(crect(0, 0.97, 0.22, 0.04, 0.012), '#1b1c20', { metal: 0.4 });
      P.fill(rrect(-span, 0.26, span * 2, 0.24, 0.05), CHROME, { metal: 1 });
      plate(P, 0, 0.42, 'VAPID 97', { w: 0.52, h: 0.11, band: null });
      P.fill(crect(0, 0.3, 0.5, 0.05, 0.015), '#1b1c20');
    },
    windshield(P, c, proj) {
      glassPanel(P, proj.length, c.fn.beltWidthAt(c.key.cowl) - 0.08, c.fn.roofWidthAt(c.key.roofFront) - 0.06, { frit: 0.04 });
    },
    backlight(P, c, proj) {
      const wb = c.fn.beltWidthAt(c.key.rearBase) - 0.12;
      glassPanel(P, proj.length, wb, wb - 0.02, { frit: 0.04 });
    },
    top() {},
  },
};

// ---------------------------------------------------------------------------
// Opel Frontera
// ---------------------------------------------------------------------------

/** Opel "Blitz": ring with the lightning bolt through it. */
function blitz(P, cx, cy, r, color = '#d6dae0') {
  P.stroke(circle(cx, cy, r), color, r * 0.16, { metal: 1 });
  P.fill(poly([[cx - r * 1.15, cy + r * 0.12], [cx + r * 0.25, cy + r * 0.12], [cx - r * 0.05, cy - r * 0.1], [cx + r * 1.15, cy - r * 0.12], [cx - r * 0.25, cy - r * 0.12], [cx + r * 0.05, cy + r * 0.1]]), color, { metal: 1 });
}

export const FRONTERA = {
  id: 'frontera',
  v2: true,
  name: 'Opel Frontera',
  brand: 'Opel',
  featured: true,
  class: 'Compact SUV',
  electric: true,
  scale: 0.6,
  key: { cowl: 0.95, roofFront: 0.12, roofRear: -1.78, rearBase: -2.04 },
  body: {
    length: 4.385,
    width: 1.795,
    wheel: { radius: 0.345, width: 0.215, front: 1.335, rear: -1.335, archGap: 0.05 },
    // upright, boxy SUV: flat roof, short raked windshield, blunt nose with
    // a clamshell hood over the full-width black Vizor
    roof: [[-2.1925, 0.62], [-2.188, 0.9], [-2.17, 1.06], [-2.13, 1.14], [-2.04, 1.16], [-1.95, 1.33], [-1.85, 1.5], [-1.78, 1.56], [-1.4, 1.6], [-0.6, 1.62], [0, 1.618], [0.12, 1.6], [0.5, 1.39], [0.95, 1.15], [1.2, 1.14], [1.6, 1.13], [1.95, 1.115], [2.08, 1.105], [2.15, 1.075], [2.18, 0.98], [2.1925, 0.72]],
    belt: [[-2.1925, 0.6], [-2.186, 0.88], [-2.165, 1.04], [-2.12, 1.12], [-2.04, 1.145], [-1.6, 1.15], [-0.8, 1.13], [0.2, 1.12], [0.95, 1.13], [1.0, 1.12], [1.2, 1.115], [1.6, 1.105], [1.95, 1.09], [2.08, 1.08], [2.15, 1.05], [2.18, 0.96], [2.1925, 0.7]],
    sill: [[-2.1925, 0.46], [-2.1, 0.34], [-1.85, 0.29], [-1.0, 0.27], [0.9, 0.27], [1.85, 0.29], [2.1, 0.32], [2.1925, 0.4]],
    shoulder: [[-2.1925, 0.72], [-2.0, 0.95], [-1.2, 0.97], [0, 0.96], [1.3, 0.96], [1.9, 0.92], [2.1925, 0.76]],
    wBody: [[-2.1925, 0.86], [-1.6, 0.893], [0, 0.897], [1.6, 0.893], [2.1925, 0.86]],
    wBelt: [[-2.1925, 0.76], [-1.6, 0.795], [0, 0.81], [1.2, 0.8], [2.1925, 0.76]],
    wRoof: [[-2.1925, 0.62], [-1.8, 0.66], [-0.6, 0.68], [0.3, 0.67], [1.0, 0.62], [2.1925, 0.6]],
    hoodRidge: { profile: [[1.0, 0], [1.25, 0.012], [2.0, 0.012], [2.12, 0]], z: [-0.45, 0.45], w: 0.07 },
    noseDepth: 0.3,
    noseExp: 3.4,
    tailDepth: 0.22,
    tailExp: 4.5,
    noseRake: { depth: 0.28, y0: 0.4, y1: 1.0, amount: 0.05 },
    tailRake: { depth: 0.22, y0: 0.6, y1: 1.15, amount: 0.04 },
    flare: 0.03,
    rLow: 0.1,
    roofEdge: 0.07,
    keyX: [0.95, 0.12, -1.78, -2.04],
    archTrim: true,
  },
  wheelDef: { style: 'blade', rimRatio: 0.72, rimColor: '#16171a', accent: '#bfc5cc', caliper: null },
  colors: { paint: '#a9adb2', roof: null, finish: 'metallic', rim: '#16171a' },
  parts: { mirrors: 'black', mirrorScale: 1.1, roofRails: true, fin: true },
  stats: { hp: 113, kg: 1550, grip: 0.9, gears: 4, redline: 8000 },
  price: 24000,
  level: 2,
  blurb: 'Honest, boxy and electric: a family SUV with the black Vizor face and plenty of room for the weekend.',
  draw: {
    side(P, c) {
      const fn = c.fn;
      const g = greenhouse(c, { aBase: 0.93, aTop: 0.14, rBase: -2.0, rTop: -1.76, windows: [[0.93, -0.3], [-0.39, -1.32], [-1.42, -2.0]], inset: 0.028, cornerR: 0.04 });
      P.fill(g.surround, GLOSS_BLACK);
      for (const w of g.windows) P.glass(w);
      // body-colour C-pillar with the forward kink
      P.fill(roundedPoly([[-1.32, g.bot(-1.32) + 0.01], [-1.42, g.bot(-1.42) + 0.01], [-1.52, g.top(-1.52) - 0.02], [-1.36, g.top(-1.36) - 0.02]], 0.02), '#a9adb2');
      gap(P, [[0.88, 0.34], [0.88, 0.7], [0.94, 1.08]]);
      gap(P, [[-0.34, 0.33], [-0.34, 1.11]]);
      gap(P, [[-1.3, 1.13], [-1.27, 0.95], [-1.17, 0.82], [-1.12, 0.6], [-1.11, 0.36]]);
      P.fill(crect(0.33, 0.99, 0.19, 0.032, 0.014), '#1b1c20', { metal: 0.4 });
      P.fill(crect(-0.82, 1.01, 0.18, 0.032, 0.014), '#1b1c20', { metal: 0.4 });
      // sculpted lower door crease
      P.stroke(line([[0.95, 0.56], [0.2, 0.52], [-1.0, 0.56]]), 'rgba(255,255,255,0.35)', 0.012);
      P.stroke(line([[0.95, 0.545], [0.2, 0.505], [-1.0, 0.545]]), 'rgba(0,0,0,0.12)', 0.008);
      P.stroke(line([[2.0, 0.93], [0.6, 0.96], [-1.9, 1.0]]), 'rgba(255,255,255,0.3)', 0.01);
      // black arch cladding and sills
      for (const a of fn.arches) P.fill(archBand(a.x, fn.wheelY, a.r - 0.012, 0.055, { sill: 0.25 }), SATIN_BLACK);
      P.fill(rrect(-1.04, 0.22, 1.98, 0.13, 0.04), SATIN_BLACK);
      P.stroke(crect(-1.82, 0.98, 0.14, 0.1, 0.025), 'rgba(0,0,0,0.35)', 0.005);
    },
    front(P, c) {
      const span = c.frontSpan - 0.03;
      // black Vizor: full-width gloss panel under the hood edge
      const vizor = smoothPath([[-span + 0.04, 1.05], [0, 1.06], [span - 0.04, 1.05], [span, 0.99], [span - 0.02, 0.88], [0.55, 0.86], [0, 0.855], [-0.55, 0.86], [-span + 0.02, 0.88], [-span, 0.99]], true, 0.3);
      P.fill(vizor, '#0a0b0d', { metal: 0.6 });
      P.stroke(smoothPath([[-span + 0.05, 1.045], [0, 1.054], [span - 0.05, 1.045]], false), 'rgba(255,255,255,0.22)', 0.006);
      blitz(P, 0, 0.96, 0.065);
      // LED headlamps in the Vizor ends: a wedge that widens outward, with
      // stacked light lines and a chrome projector strip
      both((s) => {
        const x0 = 0.44;
        const x1 = span - 0.01;
        P.fill(roundedPoly([[s * x0, 0.94], [s * (x1 - 0.06), 0.885], [s * x1, 0.9], [s * x1, 1.02], [s * (x1 - 0.06), 1.035], [s * x0, 1.0]], 0.025), '#141720', { metal: 0.8 });
        for (let k = 0; k < 4; k++) {
          const y = 1.012 - k * 0.022;
          P.stroke(line([[s * (x0 + 0.08 + k * 0.025), y], [s * (x1 - 0.11), y + 0.004]]), k === 0 ? '#ffffff' : '#c9d2de', k === 0 ? 0.011 : 0.006, { glow: k === 0 ? '#ffffff' : '#7f8a99', metal: 0.6 });
        }
        P.fill(roundedPoly([[s * (x1 - 0.3), 0.905], [s * (x1 - 0.08), 0.9], [s * (x1 - 0.08), 0.925], [s * (x1 - 0.3), 0.93]], 0.008), '#a8b1bd', { metal: 1 });
      });
      // black bumper line with wings, lower grille with a diamond pattern
      P.fill(roundedPoly([[-0.62, 0.8], [0.62, 0.8], [0.74, 0.76], [0.72, 0.74], [-0.72, 0.74], [-0.74, 0.76]], 0.012), GLOSS_BLACK);
      const low = roundedPoly([[-0.68, 0.6], [0.68, 0.6], [0.72, 0.3], [-0.72, 0.3]], 0.03);
      P.fill(low, '#0d0e10');
      P.clip(low, () => {
        for (let r = 0; r < 6; r++) {
          for (let k = -12; k <= 12; k++) {
            const x = k * 0.055 + (r % 2) * 0.0275;
            const y = 0.33 + r * 0.05;
            P.fill(poly([[x, y + 0.016], [x + 0.022, y], [x, y - 0.016], [x - 0.022, y]]), '#24272c', { metal: 0.3 });
          }
        }
      });
      both((s) => {
        P.fill(roundedPoly([[s * 0.76, 0.7], [s * 0.81, 0.7], [s * 0.85, 0.42], [s * 0.8, 0.4]], 0.015), '#0b0c0e');
        P.fill(crect(s * 0.4, 0.62, 0.022, 0.014, 0.004), '#2a2c30');
      });
      P.fill(roundedPoly([[-0.72, 0.29], [0.72, 0.29], [0.66, 0.22], [-0.66, 0.22]], 0.02), '#9aa0a8', { metal: 0.8 });
      P.fill(rrect(-span, 0.2, span * 2, 0.04, 0.015), SATIN_BLACK);
    },
    rear(P, c) {
      const span = c.rearSpan - 0.06;
      both((s) => {
        P.fill(roundedPoly([[s * 0.42, 1.06], [s * span, 1.07], [s * span, 0.99], [s * 0.42, 1.0]], 0.02), '#2c0407');
        P.stroke(line([[s * 0.46, 1.03], [s * (span - 0.04), 1.035]]), '#e0161e', 0.016, { glow: '#ff2020' });
        P.stroke(line([[s * (span - 0.08), 1.05], [s * (span - 0.08), 1.0]]), '#e0161e', 0.014, { glow: '#ff2020' });
      });
      P.fill(rrect(-0.42, 0.995, 0.84, 0.07, 0.02), '#0a0b0d', { metal: 0.6 });
      blitz(P, 0, 1.03, 0.04);
      P.text('FRONTERA', 0, 0.9, 0.05, '#2b2d32', { font: 'Arial, sans-serif', weight: '700', metal: 0.8 });
      plate(P, 0, 0.66, 'OP 2025', { w: 0.52, h: 0.11, bandText: 'D' });
      P.fill(rrect(-span, 0.26, span * 2, 0.24, 0.05), SATIN_BLACK);
      P.fill(rrect(-0.6, 0.27, 1.2, 0.05, 0.02), '#9aa0a8', { metal: 0.8 });
    },
    windshield(P, c, proj) {
      glassPanel(P, proj.length, c.fn.beltWidthAt(c.key.cowl) - 0.09, c.fn.roofWidthAt(c.key.roofFront) - 0.07);
    },
    backlight(P, c, proj) {
      const wb = c.fn.beltWidthAt(c.key.rearBase) - 0.12;
      glassPanel(P, proj.length, wb, wb - 0.04, { frit: 0.05 });
    },
    top() {},
  },
};

/**
 * Block capitals built from quads, so they can be stretched differently in
 * x and y (lettering on a hood seen through a tilted projection).
 * Covers the letters used on the cars here.
 */
function blockText(P, str, cx, cy, w, h, gap, tx, ty, color, opts = { metal: 1 }) {
  const quad = (x0, y0, x1, y1) => P.fill(poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]), color, opts);
  const slant = (xa, ya, xb, yb) => P.fill(poly([[xa - tx / 2, ya], [xa + tx / 2, ya], [xb + tx / 2, yb], [xb - tx / 2, yb]]), color, opts);
  const total = str.length * w + (str.length - 1) * gap;
  let x = cx - total / 2;
  for (const ch of str) {
    const l = x;
    const r = x + w;
    const b = cy - h / 2;
    const t = cy + h / 2;
    const m = cy;
    if (ch === 'M') { quad(l, b, l + tx, t); quad(r - tx, b, r, t); slant(l + tx / 2, t, (l + r) / 2, m); slant(r - tx / 2, t, (l + r) / 2, m); }
    else if (ch === 'U') { quad(l, b, l + tx, t); quad(r - tx, b, r, t); quad(l, b, r, b + ty); }
    else if (ch === 'S') { quad(l, t - ty, r, t); quad(l, m - ty / 2, r, m + ty / 2); quad(l, b, r, b + ty); quad(l, m, l + tx, t); quad(r - tx, b, r, m); }
    else if (ch === 'O') { quad(l, b, l + tx, t); quad(r - tx, b, r, t); quad(l, t - ty, r, t); quad(l, b, r, b + ty); }
    x += w + gap;
  }
}

// ---------------------------------------------------------------------------
// KGM Musso Grand
// ---------------------------------------------------------------------------

export const MUSSO = {
  id: 'musso',
  v2: true,
  name: 'KGM Musso Grand',
  brand: 'KGM',
  featured: true,
  class: 'Pickup',
  scale: 0.6,
  frontUpperTilt: 1.25,
  key: { cowl: 0.86, roofFront: 0.02, roofRear: -1.02, rearBase: -1.1 },
  body: {
    length: 5.47,
    width: 1.95,
    wheel: { radius: 0.38, width: 0.255, front: 1.785, rear: -1.425, archGap: 0.06 },
    // tall square truck: flat high hood, near-vertical face, double cab,
    // open bed
    roof: [[-2.735, 0.7], [-2.732, 1.0], [-2.72, 1.3], [-2.69, 1.35], [-2.5, 1.36], [-1.6, 1.365], [-1.22, 1.37], [-1.17, 1.5], [-1.13, 1.72], [-1.08, 1.8], [-1.02, 1.82], [-0.5, 1.84], [-0.05, 1.835], [0.02, 1.82], [0.4, 1.58], [0.86, 1.29], [1.1, 1.27], [1.8, 1.25], [2.4, 1.235], [2.62, 1.225], [2.7, 1.2], [2.725, 1.1], [2.735, 0.78]],
    belt: [[-2.735, 0.68], [-2.732, 0.98], [-2.72, 1.28], [-2.69, 1.335], [-2.5, 1.345], [-1.6, 1.35], [-1.24, 1.355], [-1.15, 1.34], [-0.5, 1.32], [0.5, 1.3], [0.86, 1.28], [0.92, 1.26], [1.2, 1.25], [1.8, 1.235], [2.4, 1.22], [2.62, 1.21], [2.7, 1.185], [2.725, 1.08], [2.735, 0.76]],
    sill: [[-2.735, 0.6], [-2.68, 0.52], [-2.4, 0.48], [-1.0, 0.45], [1.0, 0.45], [2.4, 0.46], [2.68, 0.42], [2.735, 0.46]],
    shoulder: [[-2.735, 0.95], [-2.5, 1.12], [-1.2, 1.13], [0, 1.08], [1.6, 1.02], [2.5, 0.98], [2.735, 0.9]],
    wBody: [[-2.735, 0.95], [-1.6, 0.975], [0, 0.975], [1.6, 0.975], [2.735, 0.955]],
    wBelt: [[-2.735, 0.93], [-1.25, 0.955], [-1.12, 0.86], [-0.5, 0.86], [0.5, 0.86], [0.9, 0.9], [1.4, 0.94], [2.735, 0.93]],
    wRoof: [[-2.735, 0.9], [-1.25, 0.93], [-1.12, 0.74], [-0.5, 0.75], [0, 0.75], [0.6, 0.76], [1.0, 0.82], [2.735, 0.8]],
    hoodRidge: { profile: [[0.9, 0], [1.2, 0.025], [2.5, 0.025], [2.65, 0]], z: [-0.5, 0.5], w: 0.09 },
    noseDepth: 0.3,
    noseExp: 3.6,
    tailDepth: 0.1,
    tailExp: 9,
    flare: 0.05,
    rLow: 0.1,
    roofEdge: 0.07,
    keyX: [0.86, 0.02, -1.02, -1.1],
    bed: { x0: -1.2, x1: -2.67, floor: 0.98, rail: 0.07, liner: true },
    archTrim: true,
  },
  wheelDef: { style: 'six', rimRatio: 0.66, rimColor: '#c3c8ce', accent: null, caliper: null },
  colors: { paint: '#29272a', roof: null, finish: 'gloss', rim: '#c3c8ce' },
  parts: { mirrors: 'black', mirrorScale: 1.35, roofRails: 'silver', fin: true },
  stats: { hp: 202, kg: 2150, grip: 0.88, gears: 6, redline: 4600 },
  price: 36000,
  level: 6,
  blurb: 'A proper square-jawed workhorse: tall silver-framed grille, LED bar across the nose and a bed for anything.',
  draw: {
    side(P, c) {
      const fn = c.fn;
      const g = greenhouse(c, { aBase: 0.84, aTop: 0.04, rBase: -1.09, rTop: -1.01, windows: [[0.84, -0.1], [-0.2, -1.07]], inset: 0.03, cornerR: 0.04 });
      P.fill(g.surround, GLOSS_BLACK);
      for (const w of g.windows) P.glass(w);
      gap(P, [[0.8, 0.48], [0.8, 0.95], [0.84, 1.32]]);
      gap(P, [[-0.15, 0.47], [-0.15, 1.33]]);
      gap(P, [[-1.12, 0.47], [-1.12, 1.34]]);
      P.fill(crect(0.33, 1.2, 0.2, 0.035, 0.015), '#c8cdd3', { metal: 1 });
      P.fill(crect(-0.66, 1.2, 0.2, 0.035, 0.015), '#c8cdd3', { metal: 1 });
      // bed side: top rail line, fuel flap, tail lamp edge
      P.stroke(line([[-1.2, 1.3], [-2.7, 1.3]]), 'rgba(0,0,0,0.35)', 0.006);
      P.stroke(crect(-2.1, 1.12, 0.14, 0.1, 0.02), 'rgba(0,0,0,0.4)', 0.005);
      P.stroke(line([[2.6, 1.18], [0.9, 1.2], [-1.15, 1.22], [-2.65, 1.22]]), 'rgba(255,255,255,0.22)', 0.012);
      // squared black arch cladding and rocker
      for (const a of fn.arches) {
        const r = a.r - 0.01;
        const band = 0.09;
        P.fill(roundedPoly([[a.x - r - band, 0.45], [a.x - r - band, fn.wheelY + r * 0.55], [a.x - r * 0.55, fn.wheelY + r + band], [a.x + r * 0.55, fn.wheelY + r + band], [a.x + r + band, fn.wheelY + r * 0.55], [a.x + r + band, 0.45]], 0.05), SATIN_BLACK);
      }
      P.fill(rrect(-1.0, 0.43, 2.36, 0.12, 0.03), SATIN_BLACK);
      P.text('MUSSO', 1.35, 1.0, 0.05, '#c8cdd3', { metal: 1, font: 'Arial, sans-serif', weight: '700' });
    },
    front(P, c) {
      const span = c.frontSpan - 0.03;
      const SILVER = '#8e949c';
      // lower bumper: black intake band with a chrome strip, silver skid plate
      P.fill(rrect(-span, 0.337, span * 2, 0.153, 0.04), '#141518');
      P.fill(crect(0, 0.442, 1.5, 0.012, 0.006), '#c9ced5', { metal: 1 });
      for (let i = -5; i <= 5; i++) P.fill(crect(i * 0.12, 0.39, 0.07, 0.035, 0.008), '#26292e');
      P.fill(roundedPoly([[-0.62, 0.337], [0.62, 0.337], [0.55, 0.28], [-0.55, 0.28]], 0.015), '#b3b9c0', { metal: 0.9 });
      // big satin-silver U frame round the grille, reaching up to the LED bar
      P.fill(roundedPoly([[-0.72, 1.146], [-0.56, 1.146], [-0.56, 0.6], [0.56, 0.6], [0.56, 1.146], [0.72, 1.146], [0.72, 0.58], [0.68, 0.49], [-0.68, 0.49], [-0.72, 0.58]], 0.04), SILVER, { metal: 0.7 });
      P.stroke(line([[-0.7, 0.499], [0.7, 0.499]]), 'rgba(255,255,255,0.35)', 0.008);
      // grille field: geometric slats in three rows, the top row as large
      // trapezoid "teeth" under the LED bar
      const field = roundedPoly([[-0.56, 0.6], [0.56, 0.6], [0.56, 1.146], [-0.56, 1.146]], 0.02);
      P.fill(field, '#0a0b0d');
      P.clip(field, () => {
        // two rows of big alternating triangles below the top row of teeth
        for (let r = 0; r < 2; r++) {
          const y0 = 0.64 + r * 0.19;
          const y1 = y0 + 0.16;
          for (let k = -4; k <= 4; k++) {
            const x = k * 0.15 + (r % 2) * 0.075;
            const up = (k + r) % 2 === 0;
            const pts = up ? [[x - 0.07, y0], [x + 0.07, y0], [x, y1]] : [[x - 0.07, y1], [x + 0.07, y1], [x, y0]];
            P.fill(poly(pts), '#3b3f46', { metal: 0.5 });
            P.stroke(line(up ? [[x - 0.07, y0 + 0.004], [x + 0.07, y0 + 0.004]] : [[x - 0.07, y1 - 0.004], [x + 0.07, y1 - 0.004]]), 'rgba(220,226,234,0.55)', 0.007, { metal: 1 });
          }
        }
        for (let k = -2; k <= 2; k++) {
          const x = k * 0.24;
          P.fill(poly([[x - 0.105, 1.135], [x + 0.105, 1.135], [x + 0.075, 1.02], [x - 0.075, 1.02]]), '#262a30', { metal: 0.5 });
          P.stroke(line([[x - 0.105, 1.13], [x + 0.105, 1.13]]), 'rgba(220,226,234,0.65)', 0.007, { metal: 1 });
        }
      });
      plate(P, 0, 0.741, 'MUSSO', { w: 0.52, h: 0.11, band: null });
      both((s) => {
        // black corner panels with the turn/fog slot
        P.fill(roundedPoly([[s * 0.74, 0.49], [s * span, 0.49], [s * span, 0.835], [s * 0.74, 0.835]], 0.03), '#141518');
        P.fill(roundedPoly([[s * 0.82, 0.652], [s * 0.96, 0.652], [s * 0.96, 0.697], [s * 0.82, 0.697]], 0.01), '#d9dde2', { metal: 0.8 });
        for (let k = 0; k < 3; k++) P.fill(crect(s * 0.89, 0.662 + k * 0.013, 0.12, 0.004, 0.002), '#5f6670');
        // tall headlamp block: chrome housing, two square projector modules
        // and an L-shaped LED running down the outer edge and along the top
        const x0 = 0.74;
        const x1 = span - 0.01;
        P.fill(roundedPoly([[s * x0, 0.845], [s * x1, 0.855], [s * x1, 1.15], [s * x0, 1.15]], 0.025), '#0b0d10');
        P.fill(roundedPoly([[s * (x0 + 0.02), 0.87], [s * (x1 - 0.045), 0.88], [s * (x1 - 0.045), 1.13], [s * (x0 + 0.02), 1.13]], 0.02), P.linear(0, 1.13, 0, 0.87, [[0, '#e1e6ec'], [0.45, '#8c95a1'], [1, '#3b424c']]), { metal: 1 });
        for (const [y0, y1] of [[0.99, 1.1], [0.895, 0.975]]) {
          P.fill(roundedPoly([[s * (x0 + 0.05), y0], [s * (x1 - 0.08), y0], [s * (x1 - 0.08), y1], [s * (x0 + 0.05), y1]], 0.015), '#20252c', { metal: 0.8 });
          P.fill(roundedPoly([[s * (x0 + 0.07), y0 + 0.015], [s * (x1 - 0.1), y0 + 0.015], [s * (x1 - 0.1), y1 - 0.015], [s * (x0 + 0.07), y1 - 0.015]], 0.012), P.radial(s * ((x0 + x1) / 2 - 0.02), (y0 + y1) / 2, 0.08, [[0, '#ffffff'], [0.5, '#c8d0da'], [1, '#6b7480']]), { glow: y0 > 0.98 ? '#ffffff' : null, metal: 0.8 });
        }
        P.stroke(line([[s * (x1 - 0.022), 0.88], [s * (x1 - 0.022), 1.14], [s * (x0 + 0.04), 1.14]]), '#ffffff', 0.018, { glow: '#ffffff', join: 'miter', cap: 'butt' });
      });
      // chrome bar with LED blocks right under the hood edge
      P.fill(rrect(-span, 1.15, span * 2, 0.045, 0.012), '#d7dce1', { metal: 1 });
      for (let k = -5; k <= 5; k++) P.fill(crect(k * 0.15, 1.173, 0.1, 0.02, 0.005), k % 2 ? '#22252a' : '#ffffff', k % 2 ? {} : { glow: '#ffffff' });
    },
    frontUpper(P) {
      // widely spaced MUSSO letters on the hood just behind the leading
      // edge; drawing y is stretched by tan(tilt) going back over the hood
      const k = Math.tan(1.25);
      blockText(P, 'MUSSO', 0, 1.21 + 0.17 * k, 0.085, 0.07 * k, 0.2, 0.016, 0.014 * k, '#c9ced5');
    },
    rear(P, c) {
      const span = c.rearSpan - 0.04;
      both((s) => {
        P.fill(roundedPoly([[s * (span - 0.12), 0.85], [s * span, 0.85], [s * span, 1.32], [s * (span - 0.12), 1.32]], 0.02), '#320508');
        P.fill(roundedPoly([[s * (span - 0.105), 1.0], [s * (span - 0.015), 1.0], [s * (span - 0.015), 1.3], [s * (span - 0.105), 1.3]], 0.015), '#d8141c', { glow: '#ff2020' });
      });
      gap(P, [[-span + 0.14, 0.72], [span - 0.14, 0.72]]);
      P.text('M U S S O', 0, 1.15, 0.09, '#c9ced5', { font: 'Arial, sans-serif', weight: '700', metal: 1 });
      P.fill(crect(0, 1.25, 0.24, 0.04, 0.012), '#1b1c20', { metal: 0.4 });
      P.fill(rrect(-span, 0.4, span * 2, 0.3, 0.05), '#16171a');
      P.fill(rrect(-0.4, 0.62, 0.8, 0.05, 0.02), '#9aa0a8', { metal: 0.9 });
      plate(P, 0, 0.55, 'KGM 2025', { w: 0.52, h: 0.11, bandText: 'TR' });
    },
    windshield(P, c, proj) {
      glassPanel(P, proj.length, c.fn.beltWidthAt(c.key.cowl) - 0.09, c.fn.roofWidthAt(c.key.roofFront) - 0.07);
    },
    backlight(P, c, proj) {
      const wb = c.fn.beltWidthAt(c.key.rearBase) - 0.12;
      glassPanel(P, proj.length, wb, wb - 0.02, { frit: 0.04 });
    },
    top() {},
  },
};

export const FEATURED_V2_MORE = [VAPID, FRONTERA, MUSSO];
