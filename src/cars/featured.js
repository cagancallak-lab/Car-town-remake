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
  key: { cowl: 0.8, roofFront: 0.13, roofRear: -1.2, rearBase: -1.31 },
  body: {
    length: 2.75,
    width: 1.66,
    wheel: { radius: 0.315, width: 0.2, front: 0.93, rear: -0.97, archGap: 0.04 },
    roof: [[-1.375, 0.6], [-1.372, 0.9], [-1.362, 1.18], [-1.34, 1.38], [-1.28, 1.5], [-1.16, 1.552], [-0.6, 1.57], [0.0, 1.56], [0.13, 1.535], [0.47, 1.24], [0.8, 0.965], [1.0, 0.9], [1.17, 0.83], [1.29, 0.73], [1.35, 0.61], [1.375, 0.47]],
    belt: [[-1.375, 0.56], [-1.365, 0.96], [-1.31, 1.02], [-0.6, 1.0], [0.3, 0.97], [0.8, 0.94], [0.86, 0.918], [1.0, 0.872], [1.17, 0.8], [1.29, 0.7], [1.35, 0.58], [1.375, 0.45]],
    sill: [[-1.375, 0.46], [-1.33, 0.34], [-1.2, 0.27], [-0.6, 0.2], [0.6, 0.2], [1.2, 0.27], [1.33, 0.33], [1.375, 0.42]],
    shoulder: [[-1.375, 0.62], [-1.2, 0.84], [0, 0.84], [1.0, 0.8], [1.375, 0.5]],
    wBody: [[-1.375, 0.79], [-1.0, 0.82], [0, 0.83], [0.9, 0.83], [1.375, 0.8]],
    wBelt: [[-1.375, 0.74], [0, 0.785], [1.375, 0.75]],
    wRoof: [[-1.375, 0.62], [-1.0, 0.67], [0, 0.68], [0.4, 0.66], [1.375, 0.6]],
    noseDepth: 0.5,
    noseExp: 2.7,
    tailDepth: 0.22,
    tailExp: 4,
    noseRake: { depth: 0.45, y0: 0.35, y1: 0.95, amount: 0.06 },
    flare: 0.015,
    rLow: 0.11,
    roofEdge: 0.08,
    keyX: [0.8, 0.13, -1.28],
  },
  wheelDef: { style: 'smart', rimRatio: 0.64, rimColor: '#1c1d21', accent: '#9aa0a8', caliper: null },
  colors: { paint: '#f4f4f1', roof: '#cdb48a', finish: 'pearl', rim: '#1c1d21' },
  parts: { mirrors: 'white', fin: true, spoiler: 'roof', spoilerColor: 'roof' },
  stats: { hp: 268, kg: 1300, grip: 1.0, gears: 4, redline: 9000 },
  price: 26000,
  level: 1,
  blurb: 'The new two-seat city car. Tiny footprint, huge personality and a perforated "smile" grille.',
  draw: {
    side(P, c) {
      const g = greenhouse(c, { aBase: 0.78, aTop: 0.15, rBase: -1.31, rTop: -1.2, windows: [[0.78, -0.5], [-0.86, -1.31]], inset: 0.03 });
      P.fill(g.surround, GLOSS_BLACK);
      for (const w of g.windows) P.glass(w);
      // tridion safety cell: champagne pillar behind the door + roof frame
      P.roof(roundedPoly([[-0.53, g.bot(-0.53) - 0.004], [-0.85, g.bot(-0.85) - 0.004], [-0.85, 2], [-0.53, 2]], 0.03));
      const roofLine = [];
      for (let i = 0; i <= 20; i++) {
        const x = 0.15 + (-1.2 - 0.15) * (i / 20);
        roofLine.push([x, g.top(x) + 0.004]);
      }
      P.roof(poly([...roofLine, [-1.21, 2], [0.16, 2]]));
      // doors, handle, skirt, charging flap
      gap(P, [[0.62, 0.3], [0.655, 0.62], [0.7, 0.93]]);
      gap(P, [[-0.53, 0.3], [-0.53, 0.99]]);
      gap(P, [[0.62, 0.3], [-0.53, 0.3]], 0.005);
      P.fill(crect(-0.32, 0.9, 0.17, 0.028, 0.012), '#2a2c31', { metal: 0.5 });
      P.fill(rrect(-0.62, 0.19, 1.24, 0.1, 0.03), SATIN_BLACK);
      P.stroke(crect(-1.14, 0.86, 0.11, 0.08, 0.02), 'rgba(0,0,0,0.45)', 0.005);
      // soft shoulder highlight
      P.stroke(line([[1.1, 0.83], [0, 0.86], [-1.2, 0.87]]), 'rgba(255,255,255,0.35)', 0.012);
    },
    front(P) {
      // perforated "smile" panel
      const py = 0.5;
      P.fill(crect(0, py, 1.04, 0.36, 0.16), '#e4e4e1');
      P.fill(crect(0, py, 1.0, 0.32, 0.14), '#f2f2ef');
      const rows = 6;
      const cols = 14;
      for (let r = 0; r < rows; r++) {
        for (let k = 0; k < cols; k++) {
          const x = -0.45 + ((k + (r % 2 ? 0.75 : 0.25)) / cols) * 0.9;
          const y = py - 0.125 + (r / (rows - 1)) * 0.25;
          const dx = x / 0.5;
          const dy = (y - py) / 0.155;
          if (dx ** 4 + dy ** 4 > 0.8) continue;
          if (Math.abs(x) < 0.21 && Math.abs(y - py) < 0.075) continue;
          P.fill(crect(x, y, 0.046, 0.03, 0.012), '#121316');
        }
      }
      P.fill(crect(0, py, 0.38, 0.105, 0.012), '#0f1012');
      P.text('#2', 0, py - 0.002, 0.065, '#f2f2f2', { font: 'Arial, sans-serif', weight: '700' });
      // big LED "eye" headlights at the upper corners
      both((s) => {
        const cx = s * 0.47;
        const cy = 0.8;
        const shape = smoothPath([[cx - s * 0.17, cy + 0.0], [cx - s * 0.08, cy + 0.085], [cx + s * 0.1, cy + 0.1], [cx + s * 0.27, cy + 0.07], [cx + s * 0.31, cy + 0.0], [cx + s * 0.16, cy - 0.08], [cx - s * 0.06, cy - 0.085]]);
        P.fill(shape, '#121318');
        P.fill(ellipse(cx, cy, 0.13, 0.085), P.radial(cx - s * 0.02, cy + 0.02, 0.15, [[0, '#ffffff'], [0.55, '#e4ecf5'], [1, '#8f9aa8']]), { glow: '#ffffff', metal: 0.3 });
        P.stroke(ellipse(cx, cy, 0.142, 0.095), '#ffffff', 0.014, { glow: '#ffffff' });
        P.fill(circle(cx, cy, 0.038), '#c9d3df', { metal: 0.8 });
        P.fill(crect(cx + s * 0.2, cy + 0.02, 0.12, 0.014, 0.007), '#ffb347', { glow: '#ff9a1a' });
        // air curtains
        P.fill(crect(s * 0.64, 0.45, 0.045, 0.22, 0.022), '#121316');
      });
      P.text('smart', 0, 0.74, 0.05, '#3a3c42', { font: 'Arial, sans-serif', weight: '700', metal: 0.7 });
      P.fill(rrect(-0.8, 0.24, 1.6, 0.09, 0.04), SATIN_BLACK);
    },
    rear(P) {
      P.fill(crect(0, 0.985, 1.36, 0.05, 0.022), '#3a0508');
      P.fill(crect(0, 0.985, 1.32, 0.026, 0.012), '#e0161e', { glow: '#ff2a2a' });
      both((s) => {
        P.fill(crect(s * 0.6, 0.94, 0.14, 0.12, 0.05), '#3a0508');
        P.fill(crect(s * 0.6, 0.95, 0.11, 0.07, 0.03), '#e0161e', { glow: '#ff3030' });
      });
      P.text('smart', 0, 0.88, 0.05, '#3a3c42', { font: 'Arial, sans-serif', weight: '700', metal: 0.7 });
      plate(P, 0, 0.6, 'S M 2026', { w: 0.42, h: 0.1 });
      P.fill(rrect(-0.78, 0.3, 1.56, 0.17, 0.05), SATIN_BLACK);
    },
    windshield(P, c, proj) {
      glassPanel(P, proj.length, c.fn.beltWidthAt(c.key.cowl) - 0.11, c.fn.roofWidthAt(c.key.roofFront) - 0.08, { frit: 0.05 });
    },
    backlight(P, c, proj) {
      const wb = c.fn.beltWidthAt(c.key.rearBase) - 0.12;
      glassPanel(P, proj.length, wb, wb - 0.04, { frit: 0.04 });
    },
    top(P) {
      P.roof(rrect(-1.32, -1.0, 1.42, 2.0, 0));
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
  key: { cowl: 0.98, roofFront: 0.0, roofRear: -1.82, rearBase: -1.99 },
  body: {
    length: 4.2,
    width: 1.8,
    wheel: { radius: 0.35, width: 0.23, front: 1.25, rear: -1.43, archGap: 0.045 },
    roof: [[-2.1, 0.66], [-2.092, 0.88], [-2.065, 1.02], [-2.02, 1.09], [-1.96, 1.16], [-1.86, 1.34], [-1.74, 1.41], [-1.3, 1.465], [-0.5, 1.5], [-0.15, 1.49], [0.0, 1.465], [0.45, 1.24], [0.98, 1.02], [1.2, 0.995], [1.5, 0.968], [1.8, 0.942], [1.98, 0.92], [2.06, 0.87], [2.1, 0.75]],
    belt: [[-2.1, 0.64], [-2.085, 0.85], [-2.045, 0.995], [-1.99, 1.055], [-1.6, 1.07], [-0.6, 1.05], [0.4, 1.03], [0.98, 1.0], [1.03, 0.985], [1.2, 0.97], [1.5, 0.945], [1.8, 0.919], [1.98, 0.897], [2.06, 0.847], [2.1, 0.73]],
    sill: [[-2.1, 0.5], [-2.0, 0.36], [-1.8, 0.27], [-1.0, 0.22], [0.8, 0.22], [1.8, 0.27], [2.0, 0.33], [2.1, 0.45]],
    shoulder: [[-2.1, 0.66], [-1.9, 0.87], [0, 0.85], [1.6, 0.8], [2.1, 0.66]],
    wBody: [[-2.1, 0.84], [-1.5, 0.86], [0, 0.865], [1.3, 0.86], [2.1, 0.83]],
    wBelt: [[-2.1, 0.74], [-1.4, 0.785], [0, 0.8], [1.0, 0.79], [2.1, 0.74]],
    wRoof: [[-2.1, 0.55], [-1.8, 0.6], [-1.0, 0.64], [0, 0.65], [0.6, 0.62], [2.1, 0.55]],
    noseDepth: 0.42,
    noseExp: 3.2,
    tailDepth: 0.3,
    tailExp: 4,
    noseRake: { depth: 0.4, y0: 0.45, y1: 0.95, amount: 0.07 },
    tailRake: { depth: 0.3, y0: 0.6, y1: 1.1, amount: 0.04 },
    flare: 0.032,
    rLow: 0.1,
    roofEdge: 0.065,
    keyX: [0.98, 0.0, -1.86, -1.99],
    archTrim: true,
  },
  wheelDef: { style: 'pixel', rimRatio: 0.7, rimColor: '#141518', accent: null, caliper: '#c8102e' },
  colors: { paint: '#f1f2f2', roof: null, finish: 'gloss', rim: '#141518', caliper: '#c8102e' },
  parts: { mirrors: 'black', fin: true, spoiler: 'roof', spoilerColor: 'black' },
  stats: { hp: 296, kg: 1700, grip: 1.08, gears: 5, redline: 8500 },
  price: 38000,
  level: 3,
  blurb: 'Compact electric crossover with N Line attitude: pixel light bar, gloss-black A-shape bumper and star wheels.',
  draw: {
    side(P, c) {
      const fn = c.fn;
      const g = greenhouse(c, { aBase: 0.95, aTop: 0.01, rBase: -1.74, rTop: -1.6, windows: [[0.95, -0.3], [-0.41, -1.16], [-1.26, -1.74]], inset: 0.028 });
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
      for (const a of fn.arches) P.fill(archBand(a.x, fn.wheelY, a.r - 0.012, 0.075, { sill: 0.2 }), SATIN_BLACK);
      P.fill(rrect(-1.02, 0.18, 1.8, 0.16, 0.05), SATIN_BLACK);
      // N Line badge
      P.text('N Line', 1.0, 0.85, 0.05, '#d8dbe0', { italic: true, metal: 0.9, font: 'Arial, sans-serif', weight: '700' });
      P.fill(rrect(0.87, 0.836, 0.03, 0.028, 0.004), '#d61b2a');
      P.stroke(crect(-1.62, 0.98, 0.13, 0.1, 0.025), 'rgba(0,0,0,0.4)', 0.005);
    },
    front(P, c) {
      const span = c.frontSpan - 0.06;
      // gloss-black A-shape lower structure with white bumper "wings" outside it
      const aShape = smoothPath([[-0.3, 0.82], [0.3, 0.82], [0.55, 0.68], [0.82, 0.54], [span, 0.46], [span, 0.27], [-span, 0.27], [-span, 0.46], [-0.82, 0.54], [-0.55, 0.68]], true, 0.3);
      P.fill(aShape, GLOSS_BLACK);
      const mesh = smoothPath([[-0.26, 0.78], [0.26, 0.78], [0.64, 0.55], [0.7, 0.38], [-0.7, 0.38], [-0.64, 0.55]], true, 0.3);
      P.fill(mesh, '#1b1d22');
      P.clip(mesh, () => {
        for (let i = -18; i <= 18; i++) {
          P.stroke(line([[i * 0.045 - 0.25, 0.37], [i * 0.045 + 0.25, 0.8]]), 'rgba(80,84,92,0.7)', 0.006);
          P.stroke(line([[i * 0.045 + 0.25, 0.37], [i * 0.045 - 0.25, 0.8]]), 'rgba(80,84,92,0.7)', 0.006);
        }
      });
      P.fill(crect(0, 0.3, span * 1.6, 0.05, 0.02), '#2a2c32');
      plate(P, 0, 0.52, '21 AJG 754', { w: 0.52, h: 0.11, bandText: 'TR' });
      // full-width pixel light bar
      P.fill(crect(0, 0.872, span * 2, 0.052, 0.022), '#0b0c0e');
      const n = 30;
      for (let i = 0; i <= n; i++) {
        const x = -span + 0.03 + ((span * 2 - 0.06) * i) / n;
        const outer = Math.abs(x) > span - 0.32;
        const centre = Math.abs(i - n / 2) <= 1;
        const sz = centre ? 0.032 : 0.022;
        P.fill(crect(x, 0.872, sz, sz, 0.003), outer || centre ? '#ffffff' : '#5c6068', { glow: outer || centre ? '#ffffff' : '#30333a' });
      }
      // H logo on the hood edge
      P.stroke(ellipse(0, 0.935, 0.075, 0.035), '#cfd3d9', 0.009, { metal: 1 });
      P.text('H', 0, 0.935, 0.045, '#cfd3d9', { italic: true, metal: 1, font: 'Arial, sans-serif', weight: '900' });
      // N Line side intakes
      both((s) => {
        for (let k = 0; k < 3; k++) P.stroke(line([[s * (0.7 + k * 0.05), 0.33], [s * (0.63 + k * 0.05), 0.5]]), '#2c2f36', 0.014);
      });
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
  key: { cowl: 1.05, roofFront: 0.1, roofRear: -1.85, rearBase: -2.27 },
  body: {
    length: 4.85,
    width: 1.92,
    wheel: { radius: 0.375, width: 0.27, front: 1.475, rear: -1.495, archGap: 0.04 },
    roof: [[-2.425, 0.74], [-2.412, 0.97], [-2.375, 1.13], [-2.3, 1.215], [-2.15, 1.38], [-1.85, 1.53], [-1.4, 1.61], [-0.6, 1.64], [-0.05, 1.62], [0.1, 1.592], [0.55, 1.35], [1.05, 1.13], [1.4, 1.106], [1.8, 1.077], [2.2, 1.047], [2.33, 1.02], [2.395, 0.96], [2.425, 0.82]],
    belt: [[-2.425, 0.72], [-2.405, 0.94], [-2.35, 1.1], [-2.27, 1.16], [-1.9, 1.17], [-0.8, 1.15], [0.6, 1.125], [1.05, 1.11], [1.1, 1.095], [1.4, 1.08], [1.8, 1.05], [2.2, 1.02], [2.33, 0.994], [2.395, 0.934], [2.425, 0.8]],
    sill: [[-2.425, 0.55], [-2.3, 0.4], [-2.0, 0.3], [-1.2, 0.25], [1.2, 0.25], [2.1, 0.3], [2.35, 0.36], [2.425, 0.45]],
    shoulder: [[-2.425, 0.82], [-2.0, 0.99], [0, 0.98], [1.8, 0.9], [2.425, 0.78]],
    wBody: [[-2.425, 0.9], [-1.5, 0.92], [0, 0.93], [1.5, 0.92], [2.425, 0.89]],
    wBelt: [[-2.425, 0.78], [-1.5, 0.84], [0, 0.86], [1.4, 0.85], [2.425, 0.8]],
    wRoof: [[-2.425, 0.58], [-2.0, 0.64], [-1.0, 0.7], [0, 0.71], [0.6, 0.68], [2.425, 0.62]],
    hoodRidge: { profile: [[1.1, 0], [1.3, 0.016], [2.0, 0.016], [2.3, 0]], z: [0.36], w: 0.09 },
    noseDepth: 0.46,
    noseExp: 3.4,
    tailDepth: 0.4,
    tailExp: 3.5,
    noseRake: { depth: 0.5, y0: 0.42, y1: 1.02, amount: 0.15 },
    tailRake: { depth: 0.4, y0: 0.65, y1: 1.25, amount: 0.1 },
    flare: 0.035,
    rLow: 0.11,
    roofEdge: 0.07,
    keyX: [1.05, 0.1, -1.85, -2.27],
  },
  wheelDef: { style: 'amg', rimRatio: 0.71, rimColor: '#3a3d43', accent: '#c9ccd1', caliper: '#c8102e' },
  colors: { paint: '#f2b705', roof: null, finish: 'metallic', rim: '#3a3d43', caliper: '#c8102e' },
  parts: { mirrors: 'black', roofRails: true, fin: true, spoiler: 'roof', spoilerColor: 'paint' },
  stats: { hp: 650, kg: 2350, grip: 1.12, gears: 5, redline: 9000 },
  price: 120000,
  level: 8,
  blurb: 'Affalterbach goes electric: an AMG performance SUV with an illuminated grille and a three-pointed star you can see from space.',
  draw: {
    side(P, c) {
      const fn = c.fn;
      const g = greenhouse(c, { aBase: 1.02, aTop: 0.12, rBase: -2.06, rTop: -1.8, windows: [[1.02, -0.38], [-0.48, -1.38], [-1.48, -2.06]], inset: 0.03 });
      P.fill(g.surround, GLOSS_BLACK);
      for (const w of g.windows) P.glass(w);
      gap(P, [[1.05, 0.34], [1.05, 0.72], [1.04, 1.12]]);
      gap(P, [[-0.43, 0.32], [-0.43, 1.16]]);
      gap(P, [[-1.42, 1.18], [-1.38, 0.96], [-1.24, 0.86], [-1.12, 0.72], [-1.08, 0.5], [-1.07, 0.33]]);
      P.fill(crect(0.5, 1.04, 0.2, 0.032, 0.015), '#202226', { metal: 0.6 });
      P.fill(crect(-0.85, 1.06, 0.2, 0.032, 0.015), '#202226', { metal: 0.6 });
      // black side skirt with a chrome strip
      P.fill(rrect(-1.07, 0.2, 2.05, 0.15, 0.05), SATIN_BLACK);
      P.fill(rrect(-1.06, 0.33, 2.03, 0.022, 0.01), CHROME, { metal: 1 });
      // sculpted shoulder light-catcher
      P.stroke(line([[2.1, 0.93], [1.0, 0.96], [0, 0.98], [-1.0, 1.0], [-2.2, 1.01]]), 'rgba(255,255,255,0.28)', 0.012);
      P.stroke(line([[2.1, 0.915], [1.0, 0.945], [0, 0.965], [-1.0, 0.985], [-2.2, 0.995]]), 'rgba(0,0,0,0.1)', 0.008);
      P.text('AMG', 1.25, 0.84, 0.045, '#cfd3d9', { metal: 1, font: 'Arial Black, Arial', weight: '900' });
      void fn;
    },
    front(P, c) {
      const span = c.frontSpan - 0.06;
      // lower bumper: splitter, intake band and air curtains
      P.fill(rrect(-span, 0.26, span * 2, 0.1, 0.04), GLOSS_BLACK);
      P.fill(rrect(-0.62, 0.3, 1.24, 0.16, 0.06), GLOSS_BLACK);
      P.fill(rrect(-0.58, 0.345, 1.16, 0.018, 0.009), CHROME, { metal: 1 });
      both((s) => {
        const curtain = smoothPath([[s * 0.66, 0.78], [s * 0.88, 0.75], [s * 0.93, 0.42], [s * 0.7, 0.38]], true, 0.25);
        P.fill(curtain, GLOSS_BLACK);
        for (let k = 0; k < 3; k++) P.fill(crect(s * (0.73 + k * 0.06), 0.57, 0.016, 0.3, 0.008), '#2b2e34');
        P.fill(circle(s * 0.52, 0.52, 0.012), 'rgba(0,0,0,0.25)');
      });
      // Grille: chrome surround, black field, illuminated vertical bars
      const frame = smoothPath([[-0.46, 0.92], [0.46, 0.92], [0.49, 0.85], [0.455, 0.5], [0.4, 0.465], [-0.4, 0.465], [-0.455, 0.5], [-0.49, 0.85]], true, 0.22);
      P.fill(frame, CHROME, { metal: 1 });
      const inner = smoothPath([[-0.435, 0.898], [0.435, 0.898], [0.462, 0.84], [0.43, 0.515], [0.388, 0.49], [-0.388, 0.49], [-0.43, 0.515], [-0.462, 0.84]], true, 0.22);
      P.fill(inner, '#060708');
      const bars = 16;
      for (let i = 0; i < bars; i++) {
        const x = -0.4 + (0.8 * (i + 0.5)) / bars;
        if (Math.abs(x) < 0.12) continue;
        const h = 0.35 - Math.pow(Math.abs(x) / 0.45, 4) * 0.04;
        P.fill(crect(x, 0.695, 0.017, h, 0.008), '#f4f8ff', { glow: '#e4efff', metal: 0.6 });
      }
      P.fill(circle(0, 0.695, 0.118), CHROME, { metal: 1 });
      P.fill(circle(0, 0.695, 0.102), '#0e1013');
      star(P, 0, 0.695, 0.1);
      plate(P, 0, 0.4, 'S GT 5913', { w: 0.52, h: 0.11, bandText: 'D' });
      // slim LED headlights with star DRLs, wrapping round the corners
      both((s) => {
        const lamp = smoothPath([[s * 0.5, 0.845], [s * 0.74, 0.87], [s * 0.98, 0.915], [s * 1.08, 0.965], [s * 1.0, 0.99], [s * 0.74, 0.965], [s * 0.51, 0.932]], true, 0.2);
        P.fill(lamp, '#0f1218');
        const lens = smoothPath([[s * 0.53, 0.875], [s * 0.74, 0.898], [s * 0.97, 0.94], [s * 1.04, 0.968], [s * 0.98, 0.974], [s * 0.74, 0.945], [s * 0.54, 0.912]], true, 0.2);
        P.fill(lens, '#cddbee', { glow: '#8aa4cc', metal: 0.5 });
        for (let k = 0; k < 2; k++) {
          const cx = s * (0.66 + k * 0.17);
          const cy = 0.912 + k * 0.026;
          for (let a = 0; a < 3; a++) {
            const ang = Math.PI / 2 + (a * Math.PI * 2) / 3;
            P.stroke(line([[cx, cy], [cx + Math.cos(ang) * 0.025, cy + Math.sin(ang) * 0.025]]), '#ffffff', 0.008, { glow: '#ffffff' });
          }
        }
        P.stroke(line([[s * 0.54, 0.9], [s * 0.74, 0.925], [s * 0.98, 0.958]]), '#ffffff', 0.008, { glow: '#ffffff' });
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
