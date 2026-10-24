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
  key: { cowl: 0.65, roofFront: -0.05, roofRear: -1.23, rearBase: -1.38 },
  body: {
    length: 2.86,
    width: 1.66,
    wheel: { radius: 0.325, width: 0.2, front: 0.75, rear: -1.04, archGap: 0.03 },
    // tall, rounded "bubble": high beltline, short hood, blunt rounded nose,
    // huge raked windshield
    roof: [[-1.43, 0.56], [-1.426, 0.86], [-1.415, 1.08], [-1.39, 1.27], [-1.34, 1.4], [-1.23, 1.48], [-1.01, 1.515], [-0.6, 1.53], [-0.2, 1.522], [-0.05, 1.505], [0.3, 1.34], [0.65, 1.16], [0.809, 1.135], [0.984, 1.11], [1.125, 1.08], [1.242, 1.04], [1.324, 0.98], [1.377, 0.89], [1.407, 0.76], [1.424, 0.6], [1.43, 0.44]],
    belt: [[-1.43, 0.54], [-1.424, 0.96], [-1.4, 1.1], [-1.31, 1.14], [-0.95, 1.145], [-0.05, 1.14], [0.5, 1.133], [0.65, 1.128], [0.71, 1.115], [0.809, 1.095], [0.984, 1.07], [1.125, 1.04], [1.242, 1.0], [1.324, 0.94], [1.377, 0.85], [1.407, 0.73], [1.424, 0.57], [1.43, 0.42]],
    sill: [[-1.43, 0.42], [-1.39, 0.31], [-1.27, 0.25], [-0.75, 0.21], [0.45, 0.21], [1.16, 0.25], [1.36, 0.31], [1.43, 0.4]],
    shoulder: [[-1.43, 0.66], [-1.25, 0.92], [-0.55, 0.95], [0.45, 0.93], [1.043, 0.86], [1.43, 0.56]],
    wBody: [[-1.43, 0.8], [-1.05, 0.83], [-0.05, 0.83], [0.75, 0.82], [1.43, 0.78]],
    wBelt: [[-1.43, 0.72], [-1.05, 0.75], [-0.05, 0.765], [0.75, 0.76], [1.43, 0.74]],
    wRoof: [[-1.43, 0.58], [-1.05, 0.645], [-0.45, 0.665], [0.15, 0.65], [0.65, 0.6], [1.43, 0.54]],
    noseDepth: 0.44,
    noseExp: 2.6,
    tailDepth: 0.32,
    tailExp: 2.6,
    noseRake: { depth: 0.56, y0: 0.32, y1: 1.1, amount: 0.13 },
    tailRake: { depth: 0.3, y0: 0.55, y1: 1.45, amount: 0.09 },
    flare: 0.03,
    rLow: 0.12,
    roofEdge: 0.07,
    keyX: [0.65, -0.05, -1.23, -1.38],
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
      const g = greenhouse(c, { aBase: 0.65, aTop: -0.05, rBase: -1.38, rTop: -1.23, windows: [[0.65, -1.03]], inset: 0.03, cornerR: 0.08 });
      P.fill(g.surround, GLOSS_BLACK);
      for (const w of g.windows) P.glass(w);
      // tridion safety cell: champagne frame along the roof that sweeps down
      // to the beltline behind the side window
      const edge = [];
      for (let i = 0; i <= 24; i++) {
        const x = -0.05 + (-1.23 + 0.05) * (i / 24);
        edge.push([x, g.top(x) + 0.004]);
      }
      P.roof(poly([...edge, [-1.24, 2], [-0.04, 2]]));
      const pillar = [[-1.045, 2], [-1.045, g.bot(-1.045) - 0.004]];
      for (let i = 1; i <= 10; i++) {
        const x = -1.045 + (-1.395 + 1.045) * (i / 10);
        pillar.push([x, g.bot(x) - 0.004]);
      }
      pillar.push([-1.395, 2]);
      P.roof(roundedPoly(pillar, 0.025));
      // long door that reaches over the rear wheel, flush pull handle
      gap(P, [[0.38, 0.3], [0.4, 0.62], [0.48, 0.95], [0.61, 1.12]]);
      gap(P, [[-1.03, 0.69], [-1.03, 1.135]]);
      gap(P, [[0.38, 0.3], [-0.67, 0.3]], 0.005);
      P.fill(crect(-0.85, 1.085, 0.17, 0.03, 0.013), '#c9ced5', { metal: 1 });
      P.fill(crect(-0.85, 1.082, 0.14, 0.012, 0.006), '#1c1e22');
      P.fill(rrect(-0.67, 0.2, 1.06, 0.11, 0.035), SATIN_BLACK);
      // soft shoulder highlight
      P.stroke(line([[1.043, 0.86], [0.35, 0.93], [-0.65, 0.95], [-1.25, 0.93]]), 'rgba(255,255,255,0.3)', 0.014);
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
        // teardrop LED headlight: round outer end, pointed inner end, black
        // bezel, LED line along the top and a chrome reflector with a lens
        const cy = 0.89;
        const L = (x, dy) => [s * x, cy + dy];
        const outline = [[0.42, -0.03], [0.52, 0.04], [0.63, 0.09], [0.74, 0.11], [0.83, 0.085], [0.875, 0.01], [0.85, -0.07], [0.77, -0.1], [0.65, -0.088], [0.53, -0.06]];
        const shrink = (k) => outline.map(([x, dy]) => L(0.68 + (x - 0.68) * k, dy * k));
        P.fill(smoothPath(shrink(1)), '#0d0f12');
        P.fill(smoothPath(shrink(0.84)), P.linear(0, cy + 0.1, 0, cy - 0.09, [[0, '#f2f4f6'], [0.5, '#b9c1ca'], [1, '#6a727d']]), { metal: 1 });
        P.stroke(smoothPath([L(0.47, -0.012), L(0.56, 0.042), L(0.66, 0.08), L(0.75, 0.092), L(0.83, 0.068), L(0.855, 0.01)], false), '#ffffff', 0.016, { glow: '#ffffff' });
        P.fill(smoothPath([L(0.54, -0.045), L(0.62, -0.03), L(0.7, -0.03), L(0.72, -0.06), L(0.64, -0.075), L(0.56, -0.065)]), '#2f343b', { metal: 0.8 });
        const lens = L(0.77, -0.005);
        P.fill(circle(lens[0], lens[1], 0.05), '#14171b');
        P.fill(circle(lens[0], lens[1], 0.04), '#c3cad2', { metal: 1 });
        P.fill(circle(lens[0], lens[1], 0.028), P.radial(lens[0] - s * 0.008, lens[1] + 0.006, 0.028, [[0, '#a7dccf'], [0.45, '#22504c'], [1, '#0a1316']]), { metal: 0.5 });
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
      P.roof(rrect(-1.35, -1.0, 1.32, 2.0, 0));
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
  key: { cowl: 1.02, roofFront: 0.04, roofRear: -1.68, rearBase: -1.96 },
  frontUpperTilt: 0.55,
  body: {
    length: 4.12,
    width: 1.82,
    wheel: { radius: 0.338, width: 0.235, front: 1.29, rear: -1.39, archGap: 0.05 },
    roof: [[-2.06, 0.7], [-2.052, 0.92], [-2.025, 1.06], [-1.96, 1.15], [-1.86, 1.23], [-1.68, 1.33], [-1.26, 1.43], [-0.66, 1.5], [-0.26, 1.51], [-0.08, 1.495], [0.04, 1.475], [0.49, 1.27], [1.02, 1.035], [1.24, 0.985], [1.516, 0.9], [1.743, 0.83], [1.897, 0.785], [1.988, 0.757], [2.033, 0.71], [2.06, 0.6]],
    belt: [[-2.06, 0.68], [-2.048, 0.9], [-2.01, 1.04], [-1.96, 1.1], [-1.56, 1.11], [-0.56, 1.075], [0.44, 1.045], [1.02, 1.03], [1.07, 1.0], [1.24, 0.96], [1.516, 0.877], [1.743, 0.81], [1.897, 0.765], [1.988, 0.737], [2.033, 0.69], [2.06, 0.58]],
    sill: [[-2.06, 0.5], [-1.96, 0.36], [-1.76, 0.27], [-0.96, 0.22], [0.84, 0.22], [1.698, 0.25], [1.969, 0.26], [2.06, 0.3]],
    shoulder: [[-2.06, 0.7], [-1.86, 0.9], [0.04, 0.88], [1.04, 0.86], [1.607, 0.76], [2.06, 0.54]],
    wBody: [[-2.06, 0.84], [-1.46, 0.86], [0.04, 0.865], [1.335, 0.86], [2.06, 0.83]],
    wBelt: [[-2.06, 0.74], [-1.36, 0.785], [0.04, 0.8], [1.04, 0.79], [2.06, 0.74]],
    wRoof: [[-2.06, 0.55], [-1.76, 0.6], [-0.96, 0.64], [0.04, 0.65], [0.64, 0.62], [2.06, 0.55]],
    noseDepth: 0.39,
    noseExp: 3.2,
    tailDepth: 0.3,
    tailExp: 4,
    noseRake: { depth: 0.37, y0: 0.4, y1: 0.78, amount: 0.06 },
    tailRake: { depth: 0.3, y0: 0.6, y1: 1.1, amount: 0.04 },
    flare: 0.032,
    rLow: 0.1,
    roofEdge: 0.065,
    keyX: [1.02, 0.04, -1.68, -1.96],
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
      const g = greenhouse(c, { aBase: 0.99, aTop: 0.05, rBase: -1.58, rTop: -1.32, windows: [[0.99, -0.26], [-0.37, -1.06], [-1.16, -1.58]], inset: 0.028 });
      P.fill(g.surround, GLOSS_BLACK);
      for (const w of g.windows) P.glass(w);
      gap(P, [[0.9, 0.34], [0.9, 0.72], [1, 0.99]]);
      gap(P, [[-0.315, 0.33], [-0.315, 1.05]]);
      gap(P, [[-1.14, 1.07], [-1.11, 0.88], [-1.02, 0.74], [-0.98, 0.52], [-0.97, 0.34]]);
      P.fill(crect(0.36, 0.95, 0.2, 0.03, 0.014), '#1b1c20', { metal: 0.3 });
      P.fill(crect(-0.74, 0.97, 0.18, 0.03, 0.014), '#1b1c20', { metal: 0.3 });
      // shoulder crease highlight
      P.stroke(line([[1.788, 0.86], [0.64, 0.875], [-0.56, 0.9], [-1.76, 0.95]]), 'rgba(255,255,255,0.3)', 0.008);
      P.stroke(line([[1.788, 0.848], [0.64, 0.863], [-0.56, 0.888], [-1.76, 0.938]]), 'rgba(0,0,0,0.13)', 0.006);
      // black wheel-arch cladding and rocker (smooth drawn shapes)
      for (const a of fn.arches) P.fill(archBand(a.x, fn.wheelY, a.r - 0.012, 0.1, { sill: 0.2 }), SATIN_BLACK);
      P.fill(rrect(-1.02, 0.17, 1.88, 0.27, 0.06), SATIN_BLACK);
      // N Line badge
      P.text('N Line', 1.04, 0.85, 0.05, '#d8dbe0', { italic: true, metal: 0.9, font: 'Arial, sans-serif', weight: '700' });
      P.fill(rrect(0.91, 0.836, 0.03, 0.028, 0.004), '#d61b2a');
      P.stroke(crect(-1.58, 0.98, 0.13, 0.1, 0.025), 'rgba(0,0,0,0.4)', 0.005);
    },
    front(P, c) {
      const span = c.frontSpan - 0.04;
      // gloss-black centre that widens downwards ("A" shape), white bumper
      // corners outside it, all-black lower bumper
      const black = roundedPoly([[-0.42, 0.665], [0.42, 0.665], [0.74, 0.43], [span, 0.41], [span, 0.22], [-span, 0.22], [-span, 0.41], [-0.74, 0.43]], 0.03);
      P.fill(black, GLOSS_BLACK);
      // lower grille slats and radar panel
      P.clip(roundedPoly([[-0.6, 0.42], [0.6, 0.42], [0.66, 0.28], [-0.66, 0.28]], 0.03), () => {
        P.fill(rrect(-0.7, 0.29, 1.4, 0.2, 0), '#15171b');
        for (let i = 0; i < 5; i++) P.fill(crect(0, 0.315 + i * 0.035, 1.4, 0.012, 0.004), '#2b2e34');
      });
      P.fill(crect(0, 0.36, 0.12, 0.07, 0.008), '#3a3d44', { metal: 0.6 });
      // diagonal "A" legs and N Line fins
      both((s) => {
        P.fill(poly([[s * 0.6, 0.44], [s * 0.66, 0.44], [s * 0.86, 0.26], [s * 0.78, 0.26]]), '#26292f', { metal: 0.4 });
        P.fill(poly([[s * 0.45, 0.64], [s * 0.49, 0.64], [s * 0.7, 0.47], [s * 0.66, 0.47]]), '#202328', { metal: 0.4 });
      });
      P.fill(crect(0, 0.245, span * 1.7, 0.02, 0.01), '#3c3f46', { metal: 0.5 });
      plate(P, 0, 0.5, '21 AJG 754', { w: 0.52, h: 0.11, bandText: 'TR' });
      P.text('IONIQ', 0, 0.433, 0.022, '#d8dbe0', { font: 'Arial, sans-serif', weight: '700', metal: 0.8 });
      P.text('N Line', -0.6, 0.63, 0.03, '#d8dbe0', { italic: true, metal: 0.9, font: 'Arial, sans-serif', weight: '700' });
    },
    frontUpper(P, c) {
      const span = c.frontSpan - 0.04;
      // full-width pixel light bar on the white nose, under the hood shut
      // line and clear of the black grille below
      const bar = (x) => 0.765 + 0.05 * (x / span) ** 4;
      const strip = [];
      for (let i = 0; i <= 24; i++) {
        const x = -span + (2 * span * i) / 24;
        strip.push([x, bar(x) + 0.032]);
      }
      for (let i = 24; i >= 0; i--) {
        const x = -span + (2 * span * i) / 24;
        strip.push([x, bar(x) - 0.032]);
      }
      P.fill(roundedPoly(strip, 0.02), '#0b0c0e');
      const n = 34;
      for (let i = 0; i <= n; i++) {
        const x = -span + 0.05 + ((span * 2 - 0.1) * i) / n;
        const lit = i % 4 === 0;
        P.fill(crect(x, bar(x) - 0.006, 0.036, 0.032, 0.004), lit ? '#ffffff' : '#3f434a', { glow: lit ? '#ffffff' : '#1d1f23' });
      }
      both((s) => P.fill(crect(s * 0.66, bar(0.66) + 0.019, 0.5, 0.014, 0.007), '#ffffff', { glow: '#ffffff' }));
      P.stroke(line([[-span, bar(span) - 0.03], [0, 0.738], [span, bar(span) - 0.03]]), 'rgba(0,0,0,0.25)', 0.004);
      // H logo on the hood above the bar
      P.stroke(ellipse(0, 0.83, 0.08, 0.036), '#cfd3d9', 0.01, { metal: 1 });
      P.text('H', 0, 0.83, 0.048, '#cfd3d9', { italic: true, metal: 1, font: 'Arial, sans-serif', weight: '900' });
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
  key: { cowl: 1.1, roofFront: 0.33, roofRear: -1.81, rearBase: -2.17 },
  body: {
    length: 4.75,
    width: 1.94,
    wheel: { radius: 0.38, width: 0.28, front: 1.525, rear: -1.445, archGap: 0.035 },
    roof: [[-2.375, 0.76], [-2.362, 0.98], [-2.322, 1.12], [-2.23, 1.2], [-2.05, 1.29], [-1.81, 1.37], [-1.45, 1.46], [-0.85, 1.54], [-0.15, 1.575], [0.17, 1.57], [0.33, 1.545], [0.7, 1.29], [1.1, 1.03], [1.45, 0.97], [1.816, 0.882], [2.084, 0.778], [2.218, 0.722], [2.299, 0.682], [2.348, 0.642], [2.375, 0.55]],
    belt: [[-2.375, 0.74], [-2.355, 0.95], [-2.3, 1.07], [-2.17, 1.11], [-1.85, 1.115], [-0.75, 1.06], [0.65, 1.0], [1.1, 0.985], [1.15, 0.972], [1.45, 0.935], [1.816, 0.867], [2.084, 0.768], [2.218, 0.712], [2.299, 0.672], [2.348, 0.632], [2.375, 0.535]],
    sill: [[-2.375, 0.55], [-2.25, 0.4], [-1.95, 0.3], [-1.15, 0.25], [1.25, 0.25], [2.084, 0.26], [2.308, 0.27], [2.375, 0.32]],
    shoulder: [[-2.375, 0.82], [-1.95, 0.97], [0.05, 0.92], [1.25, 0.88], [1.816, 0.82], [2.375, 0.6]],
    wBody: [[-2.375, 0.9], [-1.45, 0.92], [0.05, 0.93], [1.547, 0.92], [2.375, 0.89]],
    wBelt: [[-2.375, 0.78], [-1.45, 0.84], [0.05, 0.86], [1.45, 0.85], [2.375, 0.8]],
    wRoof: [[-2.375, 0.58], [-1.95, 0.64], [-0.95, 0.7], [0.05, 0.71], [0.65, 0.68], [2.375, 0.62]],
    hoodRidge: { profile: [[1.15, 0], [1.4, 0.03], [1.95, 0.03], [2.26, 0]], z: [0], w: 0.34 },
    fenderHump: { front: 0.065, rear: 0.055, spread: 2.1 },
    noseDepth: 0.41,
    noseExp: 3.4,
    tailDepth: 0.4,
    tailExp: 3.5,
    noseRake: { depth: 0.45, y0: 0.4, y1: 0.72, amount: 0.06 },
    tailRake: { depth: 0.4, y0: 0.65, y1: 1.25, amount: 0.12 },
    flare: 0.065,
    rLow: 0.11,
    roofEdge: 0.07,
    keyX: [1.1, 0.33, -1.81, -2.17],
  },
  wheelDef: { style: 'amg', rimRatio: 0.78, rimColor: '#3a3e45', accent: '#d3d7dd', caliper: null },
  colors: { paint: '#f2b705', roof: null, finish: 'metallic', rim: '#3a3e45' },
  parts: { mirrors: 'black', mirrorScale: 1.15, roofRails: true, fin: true, spoiler: 'roof', spoilerColor: 'paint', steps: true },
  stats: { hp: 650, kg: 2350, grip: 1.12, gears: 5, redline: 9000 },
  price: 120000,
  level: 8,
  blurb: 'Affalterbach goes electric: an AMG performance SUV with an illuminated grille and a three-pointed star you can see from space.',
  draw: {
    side(P, c) {
      const fn = c.fn;
      const g = greenhouse(c, { aBase: 1.07, aTop: 0.35, rBase: -1.97, rTop: -1.67, windows: [[1.07, -0.33], [-0.43, -1.31], [-1.41, -1.97]], inset: 0.03 });
      P.fill(g.surround, GLOSS_BLACK);
      for (const w of g.windows) P.glass(w);
      gap(P, [[1.01, 0.34], [1.01, 0.72], [1.05, 1.02]]);
      // vertical fender vent behind the front wheel
      P.fill(roundedPoly([[1.06, 0.6], [1.095, 0.6], [1.125, 0.98], [1.09, 0.98]], 0.012), GLOSS_BLACK);
      gap(P, [[-0.38, 0.32], [-0.38, 1.07]]);
      gap(P, [[-1.37, 1.1], [-1.33, 0.96], [-1.19, 0.86], [-1.07, 0.72], [-1.03, 0.5], [-1.02, 0.33]]);
      P.fill(crect(0.55, 0.93, 0.2, 0.032, 0.015), '#202226', { metal: 0.6 });
      P.fill(crect(-0.8, 0.99, 0.2, 0.032, 0.015), '#202226', { metal: 0.6 });
      // black side skirt with a chrome strip
      P.fill(rrect(-1.02, 0.2, 2.05, 0.15, 0.05), SATIN_BLACK);
      P.fill(rrect(-1.01, 0.33, 2.03, 0.022, 0.01), CHROME, { metal: 1 });
      // sculpted shoulder light-catcher
      P.stroke(line([[2.084, 0.86], [1.05, 0.92], [0.05, 0.94], [-0.95, 0.96], [-2.15, 0.98]]), 'rgba(255,255,255,0.28)', 0.012);
      P.stroke(line([[2.084, 0.845], [1.05, 0.905], [0.05, 0.925], [-0.95, 0.945], [-2.15, 0.965]]), 'rgba(0,0,0,0.1)', 0.008);
      P.text('AMG', 1.3, 0.84, 0.045, '#cfd3d9', { metal: 1, font: 'Arial Black, Arial', weight: '900' });
      void fn;
    },
    front(P, c) {
      const span = c.frontSpan - 0.05;
      // black lower intake band with a chrome splitter lip
      P.fill(roundedPoly([[-0.64, 0.4], [0.64, 0.4], [0.72, 0.25], [-0.72, 0.25]], 0.04), GLOSS_BLACK);
      P.fill(rrect(-span, 0.2, span * 2, 0.06, 0.02), GLOSS_BLACK);
      P.fill(crect(0, 0.258, 1.56, 0.014, 0.007), CHROME, { metal: 1 });
      both((s) => {
        // air-curtain slots and the big corner intake
        for (let k = 0; k < 2; k++) P.fill(crect(s * (0.64 + k * 0.075), 0.45, 0.034, 0.22, 0.017), GLOSS_BLACK);
        P.fill(roundedPoly([[s * 0.8, 0.62], [s * 0.87, 0.64], [s * 1.0, 0.3], [s * 0.8, 0.26]], 0.03), GLOSS_BLACK);
        P.fill(circle(s * 0.56, 0.62, 0.011), 'rgba(0,0,0,0.3)');
      });
      // shield grille right under the hood edge: rounded corners, flat top,
      // illuminated outline and curved vertical light bars
      const top = (x) => 0.632 + 0.014 * (1 - (x / 0.54) ** 2);
      const shield = [];
      for (let i = 0; i <= 20; i++) {
        const x = -0.52 + (1.04 * i) / 20;
        shield.push([x, top(x)]);
      }
      shield.push([0.585, 0.565], [0.58, 0.46], [0.53, 0.395], [0.43, 0.38], [-0.43, 0.38], [-0.53, 0.395], [-0.58, 0.46], [-0.585, 0.565]);
      P.fill(roundedPoly(shield, 0.07), '#eef3fb', { glow: '#c9dcff', metal: 0.5 });
      const inner = shield.map(([x, y]) => [x * 0.984, 0.51 + (y - 0.51) * 0.96]);
      P.fill(roundedPoly(inner, 0.065), '#07080a');
      const bars = 12;
      for (let i = 0; i < bars; i++) {
        const x = -0.48 + (0.96 * (i + 0.5)) / bars;
        if (Math.abs(x) < 0.13) continue;
        const y0 = top(x) - 0.045;
        const y1 = 0.425 + Math.abs(x) * 0.06;
        P.stroke(smoothPath([[x * 1.03, y0], [x * 1.0, (y0 + y1) / 2], [x * 0.95, y1]], false), '#f4f8ff', 0.022, { glow: '#e4efff' });
      }
      P.fill(circle(0, 0.5, 0.1), CHROME, { metal: 1 });
      P.fill(circle(0, 0.5, 0.086), '#0e1013');
      star(P, 0, 0.5, 0.084);
      P.text('GT 63', 0.33, 0.45, 0.026, '#9aa0a8', { metal: 1, font: 'Arial, sans-serif', weight: '700' });
      plate(P, 0, 0.33, 'S GT 5913', { w: 0.52, h: 0.11, bandText: 'D' });
      // hood-front vent above the grille
      P.fill(crect(0, 0.668, 0.44, 0.018, 0.009), GLOSS_BLACK);
    },
    frontUpper(P) {
      // curved blade headlights on the rolled nose corners. The outline was
      // taken from the photo: pixels cast onto the model through the camera
      // fitted to it, in this projection's coordinates. Sharp inner tip just
      // above the grille corner, tall rounded outer end up on the fender.
      both((s) => {
        const L = ([x, y]) => [s * x, y];
        const outline = [[0.291, 0.872], [0.349, 0.913], [0.4, 0.997], [0.455, 1.076], [0.51, 1.156], [0.575, 1.222], [0.627, 1.264], [0.694, 1.282], [0.768, 1.267], [0.823, 1.206], [0.847, 1.146], [0.836, 1.081], [0.795, 1.014], [0.732, 0.949], [0.666, 0.897], [0.599, 0.85], [0.525, 0.813], [0.457, 0.801], [0.379, 0.818]];
        const shrink = (k, cx = 0.6, cy = 1.04) => outline.map(([x, y]) => L([cx + (x - cx) * k, cy + (y - cy) * k]));
        P.fill(smoothPath(shrink(1), true, 0.4), '#08090c');
        P.fill(smoothPath(shrink(0.92), true, 0.4), P.linear(0, 1.28, 0, 0.8, [[0, '#4a5463'], [0.45, '#222934'], [1, '#0c0f14']]), { metal: 0.7 });
        // chrome reflector bowls along the upper half
        for (const [x, y, rx, ry, col] of [[0.755, 1.17, 0.05, 0.06, '#6a7588'], [0.665, 1.1, 0.042, 0.052, '#566070'], [0.57, 1.01, 0.036, 0.045, '#47505e']]) {
          P.fill(ellipse(s * x, y, rx, ry), col, { metal: 1 });
        }
        // LED blade sweeping up through the lens
        P.stroke(smoothPath([L([0.42, 0.87]), L([0.487, 0.945]), L([0.6, 1.05]), L([0.702, 1.138])], false), '#ffffff', 0.016, { glow: '#ffffff' });
        // three-arrow daytime light in the outer upper corner
        for (let k = 0; k < 3; k++) {
          const x0 = 0.7 + k * 0.035;
          P.stroke(line([L([x0, 1.16 + k * 0.012]), L([x0 + 0.03, 1.21 + k * 0.012])]), '#ffffff', 0.012, { glow: '#ffffff' });
        }
        P.stroke(smoothPath([L([0.36, 0.92]), L([0.45, 1.05]), L([0.56, 1.17]), L([0.68, 1.25])], false), 'rgba(220,230,245,0.45)', 0.006, { metal: 1 });
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
      P.fill(rrect(-1.67, -0.58, 1.55, 1.16, 0.08), GLOSS_BLACK);
      P.glass(rrect(-1.63, -0.53, 1.47, 1.06, 0.06));
    },
  },
};

export const FEATURED_V2 = [SMART2, IONIQ3, AMGSUV];
