// The three cars from the uploaded photos, modelled at their real size (in
// metres) with the v2 body generator and drawn details taken from the photos:
//
//   * smart #2              — white pearl, champagne roof & tridion pillar,
//                             perforated "smile" grille, LED eye headlights
//   * Hyundai IONIQ 3 N Line — white, full-width pixel light bar, gloss-black
//                             A-shaped bumper, black cladding, star wheels
//   * Mercedes-AMG GLC (EV)  — yellow, illuminated vertical-bar grille with
//                             chrome surround and star, slim LED headlights

import { greenhouse, roundedPoly, smoothPath, plate, gap, line, rrect, crect, circle, ellipse, poly, both, archBand, glassPanel } from './v2draw.js';

const GLOSS_BLACK = '#0b0c0f';
const SATIN_BLACK = '#1a1b1f';
const CHROME = '#dfe3e8';

function star(P, cx, cy, r, color = '#eef1f5') {
  for (let k = 0; k < 3; k++) {
    const a = Math.PI / 2 + (k * Math.PI * 2) / 3;
    P.fill(poly([[cx + Math.cos(a) * r, cy + Math.sin(a) * r], [cx + Math.cos(a + 2.1) * r * 0.22, cy + Math.sin(a + 2.1) * r * 0.22], [cx + Math.cos(a - 2.1) * r * 0.22, cy + Math.sin(a - 2.1) * r * 0.22]]), color, { metal: 1 });
  }
}

// ---------------------------------------------------------------------------
// smart #2
// ---------------------------------------------------------------------------
export const SMART2 = {
  id: 'smart2',
  v2: true,
  name: 'smart #2',
  brand: 'smart',
  featured: true,
  class: 'Micro EV',
  electric: true,
  scale: 0.62,
  key: { cowl: 0.7, roofFront: 0.0, roofRear: -1.18, rearBase: -1.33 },
  body: {
    length: 2.76,
    width: 1.66,
    wheel: { radius: 0.325, width: 0.2, front: 0.8, rear: -0.99, archGap: 0.03 },
    // tall, rounded "bubble": high beltline, short hood, blunt rounded nose,
    // huge raked windshield
    roof: [[-1.38, 0.56], [-1.376, 0.86], [-1.365, 1.08], [-1.34, 1.27], [-1.29, 1.4], [-1.18, 1.48], [-0.96, 1.515], [-0.55, 1.53], [-0.15, 1.522], [0.0, 1.505], [0.35, 1.34], [0.7, 1.16], [0.85, 1.135], [1.0, 1.11], [1.12, 1.08], [1.22, 1.04], [1.29, 0.98], [1.335, 0.89], [1.36, 0.76], [1.375, 0.6], [1.38, 0.44]],
    belt: [[-1.38, 0.54], [-1.374, 0.96], [-1.35, 1.1], [-1.26, 1.14], [-0.9, 1.145], [0, 1.14], [0.55, 1.133], [0.7, 1.128], [0.76, 1.115], [0.85, 1.095], [1.0, 1.07], [1.12, 1.04], [1.22, 1.0], [1.29, 0.94], [1.335, 0.85], [1.36, 0.73], [1.375, 0.57], [1.38, 0.42]],
    sill: [[-1.38, 0.42], [-1.34, 0.31], [-1.22, 0.25], [-0.7, 0.21], [0.5, 0.21], [1.15, 0.25], [1.32, 0.31], [1.38, 0.4]],
    shoulder: [[-1.38, 0.66], [-1.2, 0.92], [-0.5, 0.95], [0.5, 0.93], [1.05, 0.86], [1.38, 0.56]],
    wBody: [[-1.38, 0.8], [-1.0, 0.83], [0, 0.83], [0.8, 0.82], [1.38, 0.78]],
    wBelt: [[-1.38, 0.72], [-1.0, 0.75], [0, 0.765], [0.8, 0.76], [1.38, 0.74]],
    wRoof: [[-1.38, 0.58], [-1.0, 0.645], [-0.4, 0.665], [0.2, 0.65], [0.7, 0.6], [1.38, 0.54]],
    noseDepth: 0.4,
    noseExp: 2.6,
    tailDepth: 0.32,
    tailExp: 2.6,
    noseRake: { depth: 0.5, y0: 0.32, y1: 1.1, amount: 0.13 },
    tailRake: { depth: 0.3, y0: 0.55, y1: 1.45, amount: 0.09 },
    flare: 0.03,
    rLow: 0.12,
    roofEdge: 0.07,
    keyX: [0.7, 0.0, -1.18, -1.33],
  },
  wheelDef: { style: 'smart', rimRatio: 0.7, rimColor: '#141518', accent: '#a7b1bd', caliper: null },
  colors: { paint: '#f4f4f1', roof: '#cdb48a', finish: 'pearl', rim: '#141518' },
  parts: { mirrors: 'white', mirrorBase: true, mirrorScale: 1.2, mirrorBack: 0.1, mirrorUp: 0.025 },
  stats: { hp: 268, kg: 1300, grip: 1.0, gears: 4, redline: 9000 },
  price: 26000,
  level: 1,
  blurb: 'The new two-seat city car. Tiny footprint, huge personality and a perforated "smile" grille.',
  draw: {
    side(P, c) {
      const g = greenhouse(c, { aBase: 0.7, aTop: 0.0, rBase: -1.33, rTop: -1.18, windows: [[0.7, -0.98]], inset: 0.03, cornerR: 0.08 });
      P.fill(g.surround, GLOSS_BLACK);
      for (const w of g.windows) P.glass(w);
      // tridion safety cell: champagne frame along the roof that sweeps down
      // to the beltline behind the side window
      const edge = [];
      for (let i = 0; i <= 24; i++) {
        const x = 0.0 + (-1.18 - 0.0) * (i / 24);
        edge.push([x, g.top(x) + 0.004]);
      }
      P.roof(poly([...edge, [-1.19, 2], [0.01, 2]]));
      const pillar = [[-0.995, 2], [-0.995, g.bot(-0.995) - 0.004]];
      for (let i = 1; i <= 10; i++) {
        const x = -0.995 + (-1.345 + 0.995) * (i / 10);
        pillar.push([x, g.bot(x) - 0.004]);
      }
      pillar.push([-1.345, 2]);
      P.roof(roundedPoly(pillar, 0.025));
      // long door that reaches over the rear wheel, flush pull handle
      gap(P, [[0.43, 0.3], [0.45, 0.62], [0.53, 0.95], [0.66, 1.12]]);
      gap(P, [[-0.98, 0.69], [-0.98, 1.135]]);
      gap(P, [[0.43, 0.3], [-0.62, 0.3]], 0.005);
      P.fill(crect(-0.8, 1.085, 0.17, 0.03, 0.013), '#c9ced5', { metal: 1 });
      P.fill(crect(-0.8, 1.082, 0.14, 0.012, 0.006), '#1c1e22');
      P.fill(rrect(-0.62, 0.2, 1.06, 0.11, 0.035), SATIN_BLACK);
      // soft shoulder highlight
      P.stroke(line([[1.05, 0.86], [0.4, 0.93], [-0.6, 0.95], [-1.2, 0.93]]), 'rgba(255,255,255,0.3)', 0.014);
    },
    front(P) {
      // perforated "smile" grille: raised white panel with staggered slots
      const py = 0.435;
      const gw = 1.0;
      const gh = 0.4;
      P.fill(crect(0, py, gw + 0.035, gh + 0.035, 0.18), '#d4d5d2');
      P.fill(crect(0, py, gw, gh, 0.16), '#f4f4f1');
      const rows = 9;
      const cols = 13;
      for (let r = 0; r < rows; r++) {
        for (let k = 0; k <= cols; k++) {
          const x = -gw / 2 + ((k + (r % 2 ? 0.5 : 0)) / cols) * gw;
          const y = py - gh / 2 + 0.035 + (r / (rows - 1)) * (gh - 0.07);
          const dx = x / (gw / 2 - 0.035);
          const dy = (y - py) / (gh / 2 - 0.028);
          if (dx ** 4 + dy ** 4 > 0.92) continue;
          if (Math.abs(x) < 0.25 && Math.abs(y - py) < 0.07) continue;
          P.fill(crect(x, y, 0.05, 0.022, 0.011), '#16171a');
        }
      }
      P.fill(crect(0, py, 0.44, 0.115, 0.01), '#101113');
      P.text('#2', 0, py - 0.002, 0.07, '#f2f2f2', { font: 'Arial, sans-serif', weight: '700' });
      both((s) => {
        // teardrop LED headlight: round outer end, pointed inner end
        const cy = 0.9;
        const pts = [[s * 0.33, cy - 0.005], [s * 0.43, cy + 0.06], [s * 0.55, cy + 0.1], [s * 0.68, cy + 0.118], [s * 0.79, cy + 0.1], [s * 0.86, cy + 0.04], [s * 0.84, cy - 0.05], [s * 0.76, cy - 0.105], [s * 0.61, cy - 0.1], [s * 0.46, cy - 0.055]];
        const lamp = smoothPath(pts);
        P.fill(lamp, P.linear(0, cy + 0.12, 0, cy - 0.1, [[0, '#c9d0d8'], [0.5, '#6d7681'], [1, '#2a2f37']]), { metal: 1 });
        P.stroke(lamp, '#ffffff', 0.032, { glow: '#ffffff' });
        const inner = smoothPath(pts.map(([x, y]) => [s * (0.63 + (Math.abs(x) - 0.63) * 0.62), cy - 0.025 + (y - cy) * 0.42]));
        P.fill(inner, '#20252c', { metal: 0.8 });
        P.stroke(smoothPath([[s * 0.45, cy + 0.03], [s * 0.58, cy + 0.06], [s * 0.72, cy + 0.07]], false), '#d0d6de', 0.009, { metal: 1 });
        P.fill(circle(s * 0.71, cy - 0.01, 0.046), '#aeb5bf', { metal: 1 });
        P.fill(circle(s * 0.71, cy - 0.01, 0.033), P.radial(s * 0.70, cy - 0.002, 0.033, [[0, '#9fd8cc'], [0.45, '#1f4a48'], [1, '#0a1316']]), { metal: 0.5 });
        // air curtains at the corners, parking sensors
        P.fill(crect(s * 0.79, 0.41, 0.048, 0.32, 0.024), '#0f1012');
        P.fill(circle(s * 0.66, 0.62, 0.012), '#dcdcd8');
      });
      P.text('smart', 0, 0.925, 0.06, '#34363c', { font: 'Arial, sans-serif', weight: '700', metal: 0.8 });
      P.fill(rrect(-0.82, 0.21, 1.64, 0.085, 0.04), SATIN_BLACK);
    },
    rear(P) {
      P.fill(crect(0, 1.03, 1.38, 0.055, 0.025), '#3a0508');
      P.fill(crect(0, 1.03, 1.34, 0.026, 0.012), '#e0161e', { glow: '#ff2a2a' });
      both((s) => {
        P.fill(crect(s * 0.6, 0.98, 0.15, 0.13, 0.05), '#3a0508');
        P.fill(crect(s * 0.6, 0.99, 0.12, 0.075, 0.03), '#e0161e', { glow: '#ff3030' });
      });
      P.text('smart', 0, 0.9, 0.05, '#3a3c42', { font: 'Arial, sans-serif', weight: '700', metal: 0.7 });
      plate(P, 0, 0.62, 'S M 2026', { w: 0.42, h: 0.1 });
      P.fill(rrect(-0.78, 0.3, 1.56, 0.17, 0.05), SATIN_BLACK);
    },
    windshield(P, c, proj) {
      glassPanel(P, proj.length, c.fn.beltWidthAt(c.key.cowl) - 0.1, c.fn.roofWidthAt(c.key.roofFront) - 0.08, { frit: 0.05 });
    },
    backlight(P, c, proj) {
      const wb = c.fn.beltWidthAt(c.key.rearBase) - 0.14;
      glassPanel(P, proj.length, wb, wb - 0.04, { frit: 0.04 });
    },
    top(P) {
      P.roof(rrect(-1.3, -1.0, 1.32, 2.0, 0));
    },
  },
};

// ---------------------------------------------------------------------------
// Hyundai IONIQ 3 N Line
// ---------------------------------------------------------------------------
export const IONIQ3 = {
  id: 'ioniq3',
  v2: true,
  name: 'IONIQ 3 N Line',
  brand: 'Hyundai',
  featured: true,
  class: 'EV Crossover',
  electric: true,
  scale: 0.6,
  key: { cowl: 0.98, roofFront: 0.0, roofRear: -1.72, rearBase: -2.0 },
  body: {
    length: 4.2,
    width: 1.82,
    wheel: { radius: 0.338, width: 0.235, front: 1.25, rear: -1.43, archGap: 0.05 },
    roof: [[-2.1, 0.7], [-2.092, 0.92], [-2.065, 1.06], [-2.0, 1.15], [-1.9, 1.23], [-1.72, 1.33], [-1.3, 1.43], [-0.7, 1.5], [-0.3, 1.51], [-0.12, 1.495], [0.0, 1.475], [0.45, 1.27], [0.98, 1.035], [1.2, 0.985], [1.5, 0.9], [1.75, 0.83], [1.92, 0.785], [2.02, 0.757], [2.07, 0.71], [2.1, 0.6]],
    belt: [[-2.1, 0.68], [-2.088, 0.9], [-2.05, 1.04], [-2.0, 1.1], [-1.6, 1.11], [-0.6, 1.075], [0.4, 1.045], [0.98, 1.03], [1.03, 1.0], [1.2, 0.96], [1.5, 0.877], [1.75, 0.81], [1.92, 0.765], [2.02, 0.737], [2.07, 0.69], [2.1, 0.58]],
    sill: [[-2.1, 0.5], [-2.0, 0.36], [-1.8, 0.27], [-1.0, 0.22], [0.8, 0.22], [1.7, 0.25], [2.0, 0.26], [2.1, 0.3]],
    shoulder: [[-2.1, 0.7], [-1.9, 0.9], [0, 0.88], [1.0, 0.86], [1.6, 0.76], [2.1, 0.54]],
    wBody: [[-2.1, 0.84], [-1.5, 0.86], [0, 0.865], [1.3, 0.86], [2.1, 0.83]],
    wBelt: [[-2.1, 0.74], [-1.4, 0.785], [0, 0.8], [1.0, 0.79], [2.1, 0.74]],
    wRoof: [[-2.1, 0.55], [-1.8, 0.6], [-1.0, 0.64], [0, 0.65], [0.6, 0.62], [2.1, 0.55]],
    noseDepth: 0.42,
    noseExp: 3.2,
    tailDepth: 0.3,
    tailExp: 4,
    noseRake: { depth: 0.4, y0: 0.4, y1: 0.78, amount: 0.06 },
    tailRake: { depth: 0.3, y0: 0.6, y1: 1.1, amount: 0.04 },
    flare: 0.032,
    rLow: 0.1,
    roofEdge: 0.065,
    keyX: [0.98, 0.0, -1.72, -2.0],
    archTrim: true,
  },
  wheelDef: { style: 'pixel', rimRatio: 0.76, rimColor: '#141518', accent: null, caliper: null },
  colors: { paint: '#f1f2f2', roof: null, finish: 'gloss', rim: '#141518' },
  parts: { mirrors: 'black', fin: true, spoiler: 'roof', spoilerColor: 'black' },
  stats: { hp: 296, kg: 1700, grip: 1.08, gears: 5, redline: 8500 },
  price: 38000,
  level: 3,
  blurb: 'Compact electric crossover with N Line attitude: pixel light bar, gloss-black A-shape bumper and star wheels.',
  draw: {
    side(P, c) {
      const fn = c.fn;
      const g = greenhouse(c, { aBase: 0.95, aTop: 0.01, rBase: -1.62, rTop: -1.36, windows: [[0.95, -0.3], [-0.41, -1.1], [-1.2, -1.62]], inset: 0.028 });
      P.fill(g.surround, GLOSS_BLACK);
      for (const w of g.windows) P.glass(w);
      gap(P, [[0.86, 0.34], [0.86, 0.72], [0.96, 0.99]]);
      gap(P, [[-0.355, 0.33], [-0.355, 1.05]]);
      gap(P, [[-1.18, 1.07], [-1.15, 0.88], [-1.06, 0.74], [-1.02, 0.52], [-1.01, 0.34]]);
      P.fill(crect(0.32, 0.95, 0.2, 0.03, 0.014), '#1b1c20', { metal: 0.3 });
      P.fill(crect(-0.78, 0.97, 0.18, 0.03, 0.014), '#1b1c20', { metal: 0.3 });
      // shoulder crease highlight
      P.stroke(line([[1.8, 0.86], [0.6, 0.875], [-0.6, 0.9], [-1.8, 0.95]]), 'rgba(255,255,255,0.3)', 0.008);
      P.stroke(line([[1.8, 0.848], [0.6, 0.863], [-0.6, 0.888], [-1.8, 0.938]]), 'rgba(0,0,0,0.13)', 0.006);
      // black wheel-arch cladding and rocker (smooth drawn shapes)
      for (const a of fn.arches) P.fill(archBand(a.x, fn.wheelY, a.r - 0.012, 0.1, { sill: 0.2 }), SATIN_BLACK);
      P.fill(rrect(-1.06, 0.17, 1.88, 0.27, 0.06), SATIN_BLACK);
      // N Line badge
      P.text('N Line', 1.0, 0.85, 0.05, '#d8dbe0', { italic: true, metal: 0.9, font: 'Arial, sans-serif', weight: '700' });
      P.fill(rrect(0.87, 0.836, 0.03, 0.028, 0.004), '#d61b2a');
      P.stroke(crect(-1.62, 0.98, 0.13, 0.1, 0.025), 'rgba(0,0,0,0.4)', 0.005);
    },
    front(P, c) {
      const span = c.frontSpan - 0.04;
      // gloss-black centre that widens downwards ("A" shape), white bumper
      // corners outside it, all-black lower bumper
      const black = roundedPoly([[-0.44, 0.69], [0.44, 0.69], [0.74, 0.43], [span, 0.41], [span, 0.22], [-span, 0.22], [-span, 0.41], [-0.74, 0.43]], 0.03);
      P.fill(black, GLOSS_BLACK);
      // lower grille slats and radar panel
      P.clip(roundedPoly([[-0.6, 0.47], [0.6, 0.47], [0.66, 0.3], [-0.66, 0.3]], 0.03), () => {
        P.fill(rrect(-0.7, 0.29, 1.4, 0.2, 0), '#15171b');
        for (let i = 0; i < 5; i++) P.fill(crect(0, 0.315 + i * 0.035, 1.4, 0.012, 0.004), '#2b2e34');
      });
      P.fill(crect(0, 0.4, 0.12, 0.075, 0.008), '#3a3d44', { metal: 0.6 });
      // diagonal "A" legs and N Line fins
      both((s) => {
        P.fill(poly([[s * 0.6, 0.44], [s * 0.66, 0.44], [s * 0.86, 0.26], [s * 0.78, 0.26]]), '#26292f', { metal: 0.4 });
        P.fill(poly([[s * 0.46, 0.66], [s * 0.5, 0.66], [s * 0.7, 0.47], [s * 0.66, 0.47]]), '#202328', { metal: 0.4 });
      });
      P.fill(crect(0, 0.245, span * 1.7, 0.02, 0.01), '#3c3f46', { metal: 0.5 });
      plate(P, 0, 0.56, '21 AJG 754', { w: 0.52, h: 0.11, bandText: 'TR' });
      P.text('IONIQ', 0, 0.493, 0.022, '#d8dbe0', { font: 'Arial, sans-serif', weight: '700', metal: 0.8 });
      P.text('N Line', -0.62, 0.665, 0.03, '#d8dbe0', { italic: true, metal: 0.9, font: 'Arial, sans-serif', weight: '700' });
      // full-width pixel light bar under the hood edge
      P.fill(crect(0, 0.7, span * 2 + 0.06, 0.08, 0.025), '#0b0c0e');
      P.stroke(line([[-span, 0.745], [span, 0.745]]), 'rgba(255,255,255,0.5)', 0.006);
      const n = 34;
      for (let i = 0; i <= n; i++) {
        const x = -span + 0.05 + ((span * 2 - 0.1) * i) / n;
        const lit = i % 4 === 0;
        P.fill(crect(x, 0.69, 0.032, 0.03, 0.004), lit ? '#ffffff' : '#3f434a', { glow: lit ? '#ffffff' : '#1d1f23' });
      }
      both((s) => P.fill(crect(s * 0.66, 0.72, 0.5, 0.014, 0.007), '#ffffff', { glow: '#ffffff' }));
      // H logo on the hood edge
      P.stroke(ellipse(0, 0.778, 0.075, 0.034), '#cfd3d9', 0.009, { metal: 1 });
      P.text('H', 0, 0.778, 0.045, '#cfd3d9', { italic: true, metal: 1, font: 'Arial, sans-serif', weight: '900' });
    },
    rear(P, c) {
      const span = c.rearSpan - 0.1;
      P.fill(crect(0, 1.02, span * 2, 0.06, 0.024), '#2a0407');
      const n = 34;
      for (let i = 0; i <= n; i++) {
        const x = -span + 0.04 + ((span * 2 - 0.08) * i) / n;
        P.fill(crect(x, 1.02, 0.022, 0.022, 0.003), '#ff2a2a', { glow: '#ff2020' });
      }
      P.stroke(ellipse(0, 0.94, 0.06, 0.03), '#cfd3d9', 0.008, { metal: 1 });
      P.text('H', 0, 0.94, 0.038, '#cfd3d9', { italic: true, metal: 1, font: 'Arial, sans-serif' });
      P.text('IONIQ 3', 0, 0.875, 0.04, '#b9bec6', { metal: 0.9, font: 'Arial, sans-serif', weight: '700' });
      plate(P, 0, 0.64, '21 AJG 754', { w: 0.52, h: 0.11, bandText: 'TR' });
      P.fill(rrect(-span, 0.27, span * 2, 0.24, 0.05), GLOSS_BLACK);
      for (let i = -4; i <= 4; i++) P.fill(crect(i * 0.1, 0.33, 0.014, 0.1, 0.006), '#2c2f36');
      both((s) => P.fill(crect(s * 0.68, 0.44, 0.12, 0.025, 0.01), '#b3121a', { glow: '#601010' }));
    },
    windshield(P, c, proj) {
      glassPanel(P, proj.length, c.fn.beltWidthAt(c.key.cowl) - 0.1, c.fn.roofWidthAt(c.key.roofFront) - 0.07);
    },
    backlight(P, c, proj) {
      const wb = c.fn.beltWidthAt(c.key.rearBase) - 0.13;
      glassPanel(P, proj.length, wb, wb - 0.06, { frit: 0.05 });
    },
    top() {},
  },
};

// ---------------------------------------------------------------------------
// Mercedes-AMG GLC (electric)
// ---------------------------------------------------------------------------
export const AMGSUV = {
  id: 'amgsuv',
  v2: true,
  name: 'AMG GLC EV',
  brand: 'Mercedes-AMG',
  featured: true,
  class: 'Performance SUV',
  electric: true,
  scale: 0.6,
  key: { cowl: 1.05, roofFront: 0.28, roofRear: -1.86, rearBase: -2.22 },
  body: {
    length: 4.85,
    width: 1.94,
    wheel: { radius: 0.38, width: 0.28, front: 1.475, rear: -1.495, archGap: 0.035 },
    roof: [[-2.425, 0.76], [-2.412, 0.98], [-2.372, 1.12], [-2.28, 1.2], [-2.1, 1.29], [-1.86, 1.37], [-1.5, 1.46], [-0.9, 1.54], [-0.2, 1.575], [0.12, 1.57], [0.28, 1.545], [0.65, 1.31], [1.05, 1.075], [1.4, 1.03], [1.8, 0.945], [2.1, 0.868], [2.25, 0.832], [2.34, 0.805], [2.395, 0.76], [2.425, 0.64]],
    belt: [[-2.425, 0.74], [-2.405, 0.95], [-2.35, 1.07], [-2.22, 1.11], [-1.9, 1.115], [-0.8, 1.075], [0.6, 1.035], [1.05, 1.025], [1.1, 1.01], [1.4, 1.01], [1.8, 0.925], [2.1, 0.853], [2.25, 0.818], [2.34, 0.79], [2.395, 0.74], [2.425, 0.62]],
    sill: [[-2.425, 0.55], [-2.3, 0.4], [-2.0, 0.3], [-1.2, 0.25], [1.2, 0.25], [2.1, 0.26], [2.35, 0.27], [2.425, 0.32]],
    shoulder: [[-2.425, 0.82], [-2.0, 0.97], [0, 0.94], [1.2, 0.92], [1.8, 0.84], [2.425, 0.6]],
    wBody: [[-2.425, 0.9], [-1.5, 0.92], [0, 0.93], [1.5, 0.92], [2.425, 0.89]],
    wBelt: [[-2.425, 0.78], [-1.5, 0.84], [0, 0.86], [1.4, 0.85], [2.425, 0.8]],
    wRoof: [[-2.425, 0.58], [-2.0, 0.64], [-1.0, 0.7], [0, 0.71], [0.6, 0.68], [2.425, 0.62]],
    hoodRidge: { profile: [[1.1, 0], [1.3, 0.02], [2.0, 0.02], [2.3, 0]], z: [0.34], w: 0.1 },
    fenderHump: { front: 0.05, rear: 0.045, spread: 2.1 },
    noseDepth: 0.46,
    noseExp: 3.4,
    tailDepth: 0.4,
    tailExp: 3.5,
    noseRake: { depth: 0.5, y0: 0.4, y1: 0.82, amount: 0.12 },
    tailRake: { depth: 0.4, y0: 0.65, y1: 1.25, amount: 0.12 },
    flare: 0.05,
    rLow: 0.11,
    roofEdge: 0.07,
    keyX: [1.05, 0.28, -1.86, -2.22],
  },
  wheelDef: { style: 'amg', rimRatio: 0.74, rimColor: '#6d737c', accent: '#c9ccd1', caliper: null },
  colors: { paint: '#f2b705', roof: null, finish: 'metallic', rim: '#6d737c' },
  parts: { mirrors: 'black', mirrorScale: 1.15, roofRails: true, fin: true, spoiler: 'roof', spoilerColor: 'paint', steps: true },
  stats: { hp: 650, kg: 2350, grip: 1.12, gears: 5, redline: 9000 },
  price: 120000,
  level: 8,
  blurb: 'Affalterbach goes electric: an AMG performance SUV with an illuminated grille and a three-pointed star you can see from space.',
  draw: {
    side(P, c) {
      const fn = c.fn;
      const g = greenhouse(c, { aBase: 1.02, aTop: 0.3, rBase: -2.02, rTop: -1.72, windows: [[1.02, -0.38], [-0.48, -1.36], [-1.46, -2.02]], inset: 0.03 });
      P.fill(g.surround, GLOSS_BLACK);
      for (const w of g.windows) P.glass(w);
      gap(P, [[0.96, 0.34], [0.96, 0.72], [1.0, 1.02]]);
      // vertical fender vent behind the front wheel
      P.fill(roundedPoly([[1.01, 0.6], [1.045, 0.6], [1.075, 0.98], [1.04, 0.98]], 0.012), GLOSS_BLACK);
      gap(P, [[-0.43, 0.32], [-0.43, 1.07]]);
      gap(P, [[-1.42, 1.1], [-1.38, 0.96], [-1.24, 0.86], [-1.12, 0.72], [-1.08, 0.5], [-1.07, 0.33]]);
      P.fill(crect(0.5, 0.97, 0.2, 0.032, 0.015), '#202226', { metal: 0.6 });
      P.fill(crect(-0.85, 0.99, 0.2, 0.032, 0.015), '#202226', { metal: 0.6 });
      // black side skirt with a chrome strip
      P.fill(rrect(-1.07, 0.2, 2.05, 0.15, 0.05), SATIN_BLACK);
      P.fill(rrect(-1.06, 0.33, 2.03, 0.022, 0.01), CHROME, { metal: 1 });
      // sculpted shoulder light-catcher
      P.stroke(line([[2.1, 0.86], [1.0, 0.92], [0, 0.94], [-1.0, 0.96], [-2.2, 0.98]]), 'rgba(255,255,255,0.28)', 0.012);
      P.stroke(line([[2.1, 0.845], [1.0, 0.905], [0, 0.925], [-1.0, 0.945], [-2.2, 0.965]]), 'rgba(0,0,0,0.1)', 0.008);
      P.text('AMG', 1.25, 0.84, 0.045, '#cfd3d9', { metal: 1, font: 'Arial Black, Arial', weight: '900' });
      void fn;
    },
    front(P, c) {
      const span = c.frontSpan - 0.05;
      // black lower intake band with a chrome splitter lip
      P.fill(roundedPoly([[-0.6, 0.44], [0.6, 0.44], [0.7, 0.25], [-0.7, 0.25]], 0.04), GLOSS_BLACK);
      P.fill(rrect(-span, 0.2, span * 2, 0.06, 0.02), GLOSS_BLACK);
      P.fill(crect(0, 0.258, 1.56, 0.014, 0.007), CHROME, { metal: 1 });
      both((s) => {
        // air-curtain slots and the big corner intake
        for (let k = 0; k < 2; k++) P.fill(crect(s * (0.62 + k * 0.075), 0.47, 0.034, 0.22, 0.017), GLOSS_BLACK);
        P.fill(roundedPoly([[s * 0.8, 0.62], [s * 0.87, 0.64], [s * 1.0, 0.3], [s * 0.8, 0.26]], 0.03), GLOSS_BLACK);
        P.fill(circle(s * 0.55, 0.6, 0.011), 'rgba(0,0,0,0.3)');
      });
      // shield grille: arched top, illuminated outline, vertical light bars
      const arch = (x) => 0.715 + 0.05 * (1 - (x / 0.52) ** 2);
      const shield = [];
      for (let i = 0; i <= 20; i++) {
        const x = -0.5 + i / 20;
        shield.push([x, arch(x)]);
      }
      shield.push([0.535, 0.6], [0.5, 0.47], [0.44, 0.448], [-0.44, 0.448], [-0.5, 0.47], [-0.535, 0.6]);
      P.fill(roundedPoly(shield, 0.05), '#eef3fb', { glow: '#c9dcff', metal: 0.5 });
      const inner = shield.map(([x, y]) => [x * 0.965, 0.6 + (y - 0.6) * 0.92]);
      P.fill(roundedPoly(inner, 0.045), '#07080a');
      const bars = 12;
      for (let i = 0; i < bars; i++) {
        const x = -0.43 + (0.86 * (i + 0.5)) / bars;
        if (Math.abs(x) < 0.12) continue;
        const top = arch(x) - 0.035;
        P.stroke(smoothPath([[x, top], [x * 1.02, (top + 0.5) / 2], [x * 0.98, 0.5]], false), '#f4f8ff', 0.016, { glow: '#e4efff' });
      }
      P.fill(circle(0, 0.6, 0.112), CHROME, { metal: 1 });
      P.fill(circle(0, 0.6, 0.097), '#0e1013');
      star(P, 0, 0.6, 0.095);
      plate(P, 0, 0.37, 'S GT 5913', { w: 0.52, h: 0.11, bandText: 'D' });
      // hood-front vent slot
      P.fill(crect(0, 0.8, 0.4, 0.02, 0.01), GLOSS_BLACK);
      // slim angular LED headlights sweeping up into the fenders
      both((s) => {
        const lamp = roundedPoly([[s * 0.5, 0.71], [s * 0.78, 0.73], [s * 1.0, 0.765], [s * 1.12, 0.81], [s * 1.08, 0.845], [s * 0.82, 0.815], [s * 0.52, 0.785]], 0.025);
        P.fill(lamp, '#0d1016', { metal: 0.6 });
        P.stroke(smoothPath([[s * 0.55, 0.77], [s * 0.8, 0.795], [s * 1.07, 0.835]], false), '#ffffff', 0.012, { glow: '#ffffff' });
        P.stroke(smoothPath([[s * 0.6, 0.748], [s * 0.84, 0.772], [s * 1.0, 0.795]], false), '#dfe9ff', 0.007, { glow: '#cfe0ff' });
        P.fill(circle(s * 0.7, 0.752, 0.018), '#3a4250', { metal: 1 });
        P.fill(circle(s * 0.82, 0.767, 0.018), '#3a4250', { metal: 1 });
      });
    },
    rear(P, c) {
      const span = c.rearSpan - 0.1;
      both((s) => {
        const lamp = smoothPath([[s * 0.42, 1.08], [s * (span - 0.02), 1.1], [s * span, 1.03], [s * 0.45, 1.02]], true, 0.25);
        P.fill(lamp, '#2a0306');
        for (let k = 0; k < 3; k++) {
          const cx = s * (0.6 + k * 0.1);
          for (let a = 0; a < 3; a++) {
            const ang = Math.PI / 2 + (a * Math.PI * 2) / 3;
            P.stroke(line([[cx, 1.06], [cx + Math.cos(ang) * 0.025, 1.06 + Math.sin(ang) * 0.025]]), '#ff3030', 0.009, { glow: '#ff2020' });
          }
        }
      });
      P.fill(crect(0, 1.065, 0.84, 0.012, 0.006), '#ff2a2a', { glow: '#ff2020' });
      P.fill(circle(0, 0.98, 0.06), CHROME, { metal: 1 });
      P.fill(circle(0, 0.98, 0.05), '#16181c');
      star(P, 0, 0.98, 0.048);
      P.text('AMG', 0.5, 0.92, 0.04, '#d0d4da', { metal: 1, font: 'Arial Black, Arial', weight: '900' });
      P.text('GLC', -0.5, 0.92, 0.04, '#d0d4da', { metal: 1, font: 'Arial, sans-serif', weight: '700' });
      plate(P, 0, 0.72, 'S GT 5913', { w: 0.52, h: 0.11, bandText: 'D' });
      P.fill(rrect(-span, 0.3, span * 2, 0.24, 0.06), GLOSS_BLACK);
      for (let i = -5; i <= 5; i++) P.fill(crect(i * 0.09, 0.36, 0.014, 0.1, 0.006), '#2c2f36');
    },
    windshield(P, c, proj) {
      glassPanel(P, proj.length, c.fn.beltWidthAt(c.key.cowl) - 0.1, c.fn.roofWidthAt(c.key.roofFront) - 0.07);
    },
    backlight(P, c, proj) {
      const wb = c.fn.beltWidthAt(c.key.rearBase) - 0.13;
      glassPanel(P, proj.length, wb, wb - 0.06, { frit: 0.05 });
    },
    top(P) {
      // panoramic glass roof
      P.fill(rrect(-1.72, -0.58, 1.55, 1.16, 0.08), GLOSS_BLACK);
      P.glass(rrect(-1.68, -0.53, 1.47, 1.06, 0.06));
    },
  },
};

export const FEATURED_V2 = [SMART2, IONIQ3, AMGSUV];
