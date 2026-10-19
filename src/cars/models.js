// Car model definitions: proportions (chibi "Car Town" style), cabin shape,
// wheels, fascia artwork and drag-race stats.
//
// Profiles use u in [-1, 1] along the car (rear -> front).
// Fascia drawings work in world units: front/rear drawings have x across the
// car (viewer's left negative) and y up from the ground; side drawings have
// x along the car (front positive) and y up.

import { MAT } from './carGeometry.js';
import { rrect, crect, ellipse, circle, poly, blob, both } from './painter.js';

const BLACK = '#121316';
const GLOSS_BLACK = '#0b0c0e';
const CHROME = '#d9dde3';
const DARK = '#24262b';
const AMBER = '#ffad33';
const RED_LIGHT = '#d4141c';

// ---------------------------------------------------------------------------
// Shared fascia building blocks
// ---------------------------------------------------------------------------

function plate(P, cx, cy, w, h, text = 'CAR TOWN', { bg = '#f4f4f0', fg = '#1a1d24', border = '#222', eu = true } = {}) {
  P.fill(crect(cx, cy, w + 0.012, h + 0.012, 0.012), border);
  P.fill(crect(cx, cy, w, h, 0.008), bg);
  if (eu) P.fill(rrect(cx - w / 2, cy - h / 2, w * 0.1, h, 0.006), '#1f4fb6');
  P.text(text, cx + (eu ? w * 0.05 : 0), cy - h * 0.02, h * 0.62, fg, { maxWidth: w * 0.84 });
}

function roundLights(P, x, y, r, { ring = CHROME, inner = '#fff7df' } = {}) {
  both((s) => {
    P.fill(circle(s * x, y, r * 1.12), ring, { metal: 1 });
    P.fill(circle(s * x, y, r), P.radial(s * x - r * 0.3, y + r * 0.3, r * 1.4, [[0, '#ffffff'], [0.5, inner], [1, '#c9c2a8']]), { glow: '#fff4d6' });
    P.fill(circle(s * x, y, r * 0.35), '#fffdf5', { glow: '#ffffff' });
  });
}

function slimLights(P, x, y, w, h, { slant = 0.4, color = '#e8eef5', glow = '#ffffff', frame = BLACK } = {}) {
  both((s) => {
    const pts = [
      [s * (x - w / 2), y - h / 2],
      [s * (x + w / 2), y - h / 2 + h * slant * 0.5],
      [s * (x + w / 2), y + h / 2],
      [s * (x - w / 2), y + h / 2 - h * slant * 0.2],
    ];
    P.fill(blob(pts.map(([a, b]) => [a, b]), 0.25), frame);
    const inner = pts.map(([a, b]) => [s * x + (a - s * x) * 0.88, y + (b - y) * 0.7]);
    P.fill(blob(inner, 0.25), color, { glow });
    // LED strip
    P.stroke(poly([[s * (x - w * 0.42), y + h * 0.15], [s * (x + w * 0.42), y + h * 0.28]], false), '#ffffff', h * 0.12, { glow: '#ffffff' });
  });
}

function tailBar(P, y, w, h, { pixels = false } = {}) {
  P.fill(crect(0, y, w, h, h * 0.45), '#5a0a10');
  P.fill(crect(0, y, w * 0.98, h * 0.55, h * 0.3), RED_LIGHT, { glow: '#ff2a2a' });
  if (pixels) {
    for (let i = -10; i <= 10; i++) {
      if (Math.abs(i) < 2) continue;
      P.fill(crect((i / 10) * w * 0.46, y, h * 0.5, h * 0.5, 0.004), '#ff5a5a', { glow: '#ff6b6b' });
    }
  }
}

function tailPair(P, x, y, w, h, { round = false, inner = RED_LIGHT } = {}) {
  both((s) => {
    if (round) {
      P.fill(circle(s * x, y, h * 0.62), CHROME, { metal: 1 });
      P.fill(circle(s * x, y, h * 0.52), inner, { glow: '#ff3030' });
      P.fill(circle(s * x, y, h * 0.22), '#ff8a8a', { glow: '#ff9a9a' });
    } else {
      P.fill(crect(s * x, y, w, h, h * 0.3), '#400608');
      P.fill(crect(s * x, y, w * 0.9, h * 0.75, h * 0.25), inner, { glow: '#ff3030' });
      P.fill(crect(s * (x + w * 0.28), y, w * 0.22, h * 0.6, h * 0.2), '#f2f2f2', { glow: '#999' });
    }
  });
}

function doorLines(P, x0, x1, yBottom, yTop, { handle = true, color = 'rgba(0,0,0,0.28)', handleColor = null } = {}) {
  const p = new Path2D();
  p.moveTo(x0, yBottom);
  p.lineTo(x0, yTop);
  p.moveTo(x1, yBottom);
  p.lineTo(x1, yTop);
  P.stroke(p, color, 0.008);
  if (handle) P.fill(crect(x1 - 0.12, yTop - 0.07, 0.11, 0.025, 0.012), handleColor || 'rgba(0,0,0,0.35)', { metal: handleColor ? 0.8 : 0 });
}

function sideSkirt(P, x0, x1, y, h, color = GLOSS_BLACK) {
  P.fill(rrect(x0, y, x1 - x0, h, h * 0.4), color);
}

// ---------------------------------------------------------------------------
// Model definitions
// ---------------------------------------------------------------------------

export const MODELS = {};

function def(id, spec) {
  MODELS[id] = { id, ...spec };
}

// --- smart #2 (uploaded) -----------------------------------------------------
def('smart2', {
  name: 'smart #2',
  brand: 'smart',
  featured: true,
  class: 'Micro EV',
  electric: true,
  length: 1.86,
  width: 1.38,
  clearance: 0.14,
  planExp: 3.6,
  planExpRear: 5,
  rTop: 0.17,
  rBot: 0.08,
  tumble: 0.04,
  flare: 0.012,
  top: [[-1, 0.42], [-0.93, 0.62], [-0.8, 0.7], [-0.4, 0.72], [0.25, 0.72], [0.62, 0.69], [0.85, 0.62], [0.97, 0.5], [1, 0.38]],
  bottom: [[-1, 0.26], [-0.88, 0.14], [0.86, 0.14], [1, 0.25]],
  wheel: { radius: 0.27, width: 0.22, front: 0.56, rear: -0.56, track: 0.56, style: 'aero', archGap: 0.035 },
  cabin: {
    beltY: 0.69, roofY: 1.3, rear0: -0.9, front0: 0.36, rear1: -0.86, front1: -0.13,
    w0: 0.6, w1: 0.55, rc0: 0.2, rc1: 0.18, capH: 0.09, bulge: 0.02,
    bPillar: { x: -0.4, w: 0.045 }, aFrac: [0.1, 0.9], cFrac: [0.0, 1.0],
    pillarMat: MAT.ROOF, roofMat: MAT.ROOF, roofBand: 0.03,
  },
  colors: { paint: '#f3f3f1', roof: '#cdb48a', finish: 'pearl', rim: '#2b2d31' },
  extras: { mirrors: 'roof', spoiler: null },
  stats: { hp: 268, kg: 1300, grip: 1.0, gears: 4, redline: 9000 },
  price: 26000, level: 1,
  blurb: 'The new two-seat city car. Tiny footprint, huge personality and a perforated "smile" grille.',
  front(P, W) {
    // Perforated lower panel ("smile")
    const pw = W * 0.6;
    const ph = 0.24;
    const py = 0.31;
    P.fill(crect(0, py, pw + 0.03, ph + 0.03, 0.09), '#e9e9e6');
    P.fill(crect(0, py, pw, ph, 0.08), '#f6f6f4');
    const rows = 4;
    const cols = 11;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ox = r % 2 ? 0.5 : 0;
        const x = -pw / 2 + ((c + 0.5 + ox * 0.5) / (cols + 0.5)) * pw;
        const y = py - ph / 2 + ((r + 0.5) / rows) * ph;
        if (Math.abs(x) < 0.17 && Math.abs(y - py) < 0.05) continue;
        P.fill(crect(x, y, 0.045, 0.032, 0.014), '#1c1d21');
      }
    }
    P.fill(crect(0, py, 0.32, 0.075, 0.01), '#101114');
    P.text('#2', 0, py - 0.002, 0.055, '#f2f2f2', { font: 'Arial, sans-serif', weight: '700' });
    // tear-drop headlights
    both((s) => {
      const cx = s * W * 0.34;
      const cy = 0.55;
      const shape = blob([[cx - s * 0.13, cy + 0.02], [cx + s * 0.03, cy + 0.07], [cx + s * 0.14, cy + 0.02], [cx + s * 0.12, cy - 0.06], [cx - s * 0.04, cy - 0.07]], 0.6);
      P.fill(shape, '#1b1c20');
      P.fill(ellipse(cx + s * 0.02, cy - 0.003, 0.085, 0.05), P.radial(cx, cy, 0.1, [[0, '#ffffff'], [0.6, '#dfe8f2'], [1, '#9aa4b0']]), { glow: '#ffffff' });
      P.stroke(ellipse(cx + s * 0.02, cy - 0.003, 0.1, 0.06), '#ffffff', 0.012, { glow: '#ffffff' });
      // air curtains
      P.fill(crect(s * W * 0.43, 0.25, 0.035, 0.13, 0.015), '#16171a');
    });
    P.text('smart', 0, 0.6, 0.045, '#2a2a2e', { font: 'Arial, sans-serif', weight: '700', metal: 0.6 });
  },
  rear(P, W) {
    tailBar(P, 0.6, W * 0.82, 0.05);
    both((s) => P.fill(crect(s * W * 0.33, 0.6, 0.18, 0.09, 0.04), RED_LIGHT, { glow: '#ff3030' }));
    P.text('smart', 0, 0.5, 0.05, '#2a2a2e', { font: 'Arial, sans-serif', weight: '700' });
    P.fill(crect(0, 0.24, W * 0.62, 0.12, 0.05), '#1a1b1e');
    plate(P, 0, 0.38, 0.34, 0.085, '#2');
  },
  side(P, L) {
    doorLines(P, 0.33, -0.48, 0.2, 0.68);
    sideSkirt(P, -0.62, 0.62, 0.15, 0.05, '#2b2c30');
    P.fill(crect(-0.66, 0.6, 0.03, 0.03, 0.015), '#1b1c20');
  },
});

// --- Hyundai IONIQ 3 N Line (uploaded) -------------------------------------
def('ioniq3', {
  name: 'IONIQ 3 N Line',
  brand: 'Hyundai',
  featured: true,
  class: 'EV Crossover',
  electric: true,
  length: 2.36,
  width: 1.44,
  clearance: 0.17,
  planExp: 4.6,
  planExpRear: 6,
  rTop: 0.12,
  rBot: 0.06,
  tumble: 0.05,
  flare: 0.03,
  claddingY: 0.24,
  archCladding: 0.07,
  top: [[-1, 0.45], [-0.95, 0.62], [-0.86, 0.7], [-0.5, 0.73], [0.18, 0.73], [0.55, 0.7], [0.82, 0.64], [0.96, 0.54], [1, 0.42]],
  bottom: [[-1, 0.28], [-0.86, 0.17], [0.84, 0.17], [1, 0.26]],
  wheel: { radius: 0.3, width: 0.25, front: 0.74, rear: -0.72, track: 0.6, style: 'star', archGap: 0.04 },
  cabin: {
    beltY: 0.72, roofY: 1.2, rear0: -1.1, front0: 0.38, rear1: -0.94, front1: -0.22,
    w0: 0.62, w1: 0.52, rc0: 0.2, rc1: 0.14, capH: 0.07,
    bPillar: { x: -0.36, w: 0.05 }, aFrac: [0.0, 1.0], cFrac: [0.0, 1.0],
    pillarMat: MAT.TRIM, roofMat: MAT.ROOF, roofBand: 0.025, sillMat: MAT.TRIM,
  },
  colors: { paint: '#f1f2f2', roof: '#f1f2f2', finish: 'gloss', rim: '#1c1d20', caliper: '#c8102e' },
  extras: { mirrors: 'black', spoiler: 'roof', roofRails: false },
  stats: { hp: 296, kg: 1700, grip: 1.08, gears: 5, redline: 8500 },
  price: 38000, level: 3,
  blurb: 'Compact electric crossover with N Line attitude: pixel light bar, gloss-black A-shape bumper and star wheels.',
  front(P, W) {
    // Gloss black A-shape lower structure
    P.fill(poly([[-W * 0.28, 0.5], [W * 0.28, 0.5], [W * 0.47, 0.17], [-W * 0.47, 0.17]]), GLOSS_BLACK);
    P.fill(poly([[-W * 0.2, 0.44], [W * 0.2, 0.44], [W * 0.3, 0.24], [-W * 0.3, 0.24]]), '#1d1f24');
    for (let i = 0; i < 6; i++) P.fill(crect(0, 0.27 + i * 0.03, W * (0.5 - i * 0.03), 0.008, 0.004), '#2c2f36');
    plate(P, 0, 0.33, 0.33, 0.075, '21 AJG 754');
    // Pixel light bar
    P.fill(crect(0, 0.57, W * 0.9, 0.06, 0.02), '#0f1013');
    for (let i = -14; i <= 14; i++) {
      const big = Math.abs(i) <= 1 || i === -3 || i === 3;
      const x = (i / 14) * W * 0.42;
      if (Math.abs(i) > 7 || big) P.fill(crect(x, 0.57, big ? 0.03 : 0.018, big ? 0.03 : 0.018, 0.003), '#f7fbff', { glow: '#ffffff' });
    }
    // headlamps in bumper corners
    both((s) => {
      P.fill(crect(s * W * 0.37, 0.43, 0.12, 0.05, 0.012), '#0f1013');
      for (let k = 0; k < 4; k++) P.fill(crect(s * (W * 0.33 + k * 0.026), 0.43, 0.016, 0.016, 0.002), '#ffffff', { glow: '#ffffff' });
    });
    // H logo
    P.stroke(ellipse(0, 0.64, 0.055, 0.03), '#c9ccd2', 0.008, { metal: 1 });
    P.text('H', 0, 0.64, 0.04, '#c9ccd2', { italic: true, metal: 1 });
  },
  rear(P, W) {
    P.fill(crect(0, 0.62, W * 0.92, 0.05, 0.02), '#2b0508');
    for (let i = -16; i <= 16; i++) {
      if (Math.abs(i) < 3) continue;
      P.fill(crect((i / 16) * W * 0.43, 0.62, 0.02, 0.02, 0.002), '#ff3a3a', { glow: '#ff3030' });
    }
    P.fill(poly([[-W * 0.4, 0.33], [W * 0.4, 0.33], [W * 0.46, 0.17], [-W * 0.46, 0.17]]), GLOSS_BLACK);
    for (let i = -3; i <= 3; i++) P.fill(crect(i * 0.07, 0.21, 0.015, 0.07, 0.005), '#2c2f36');
    plate(P, 0, 0.42, 0.33, 0.075, '21 AJG 754');
    P.text('IONIQ 3', 0, 0.53, 0.035, '#9ea3ab', { weight: '700', metal: 0.8 });
  },
  side(P, L) {
    doorLines(P, 0.36, -0.36, 0.25, 0.7, { handle: true });
    doorLines(P, -0.36, -0.82, 0.25, 0.7, { handle: true });
    P.text('N Line', 0.62, 0.48, 0.045, '#d6dae0', { italic: true, metal: 0.9 });
    P.fill(rrect(0.6, 0.45, 0.003, 0.003, 0.001), '#000');
  },
});

// --- Mercedes-AMG electric SUV (uploaded) ------------------------------------
def('amgsuv', {
  name: 'AMG GLC EV',
  brand: 'Mercedes-AMG',
  featured: true,
  class: 'Performance SUV',
  electric: true,
  length: 2.62,
  width: 1.52,
  clearance: 0.16,
  planExp: 3.8,
  planExpRear: 5,
  rTop: 0.14,
  rBot: 0.06,
  tumble: 0.06,
  flare: 0.035,
  noseTaper: 0.05,
  claddingY: 0.21,
  top: [[-1, 0.5], [-0.95, 0.66], [-0.85, 0.74], [-0.4, 0.76], [0.2, 0.76], [0.55, 0.74], [0.82, 0.69], [0.95, 0.6], [1, 0.46]],
  bottom: [[-1, 0.28], [-0.86, 0.16], [0.84, 0.16], [1, 0.24]],
  wheel: { radius: 0.33, width: 0.28, front: 0.84, rear: -0.82, track: 0.64, style: 'twin5', archGap: 0.035 },
  cabin: {
    beltY: 0.75, roofY: 1.24, rear0: -1.17, front0: 0.44, rear1: -0.94, front1: -0.26,
    w0: 0.65, w1: 0.53, rc0: 0.22, rc1: 0.16, capH: 0.07,
    bPillar: { x: -0.4, w: 0.05 }, dPillar: { x: -0.86, w: 0.05 }, aFrac: [0.0, 1.0], cFrac: [0.0, 1.0],
    pillarMat: MAT.TRIM, roofMat: MAT.ROOF, roofBand: 0.03, sillMat: MAT.TRIM,
  },
  colors: { paint: '#f2b705', roof: '#f2b705', finish: 'metallic', rim: '#3a3d42', caliper: '#f2b705' },
  extras: { mirrors: 'black', spoiler: 'roof', roofRails: true },
  stats: { hp: 650, kg: 2350, grip: 1.12, gears: 5, redline: 9000 },
  price: 120000, level: 8,
  blurb: 'Affalterbach goes electric: an AMG performance SUV with an illuminated Panamericana grille.',
  front(P, W) {
    // Lower bumper / intakes
    both((s) => {
      const pts = [[s * W * 0.2, 0.37], [s * W * 0.45, 0.42], [s * W * 0.48, 0.2], [s * W * 0.22, 0.2]];
      P.fill(blob(pts, 0.2), GLOSS_BLACK);
      for (let k = 0; k < 3; k++) P.fill(crect(s * (W * 0.26 + k * 0.07), 0.3, 0.012, 0.15, 0.006), '#2a2c31');
    });
    P.fill(crect(0, 0.21, W * 0.52, 0.06, 0.03), GLOSS_BLACK);
    // Grille frame
    const gw = W * 0.5;
    const gy = 0.47;
    const gh = 0.27;
    const frame = blob([[-gw / 2, gy + gh / 2], [gw / 2, gy + gh / 2], [gw / 2 + 0.02, gy - gh / 2 + 0.04], [gw / 2 - 0.05, gy - gh / 2], [-gw / 2 + 0.05, gy - gh / 2], [-gw / 2 - 0.02, gy - gh / 2 + 0.04]], 0.18);
    P.fill(frame, CHROME, { metal: 1 });
    const inner = blob([[-gw / 2 + 0.02, gy + gh / 2 - 0.02], [gw / 2 - 0.02, gy + gh / 2 - 0.02], [gw / 2, gy - gh / 2 + 0.05], [gw / 2 - 0.06, gy - gh / 2 + 0.02], [-gw / 2 + 0.06, gy - gh / 2 + 0.02], [-gw / 2, gy - gh / 2 + 0.05]], 0.18);
    P.fill(inner, '#08090b');
    // illuminated vertical bars (Panamericana)
    const bars = 12;
    for (let i = 0; i < bars; i++) {
      const x = -gw / 2 + 0.05 + ((gw - 0.1) * (i + 0.5)) / bars;
      if (Math.abs(x) < 0.07) continue;
      P.fill(crect(x, gy - 0.005, 0.012, gh - 0.07, 0.006), '#f4f8ff', { glow: '#e8f2ff' });
    }
    // star badge
    P.fill(circle(0, gy, 0.065), '#c3c7ce', { metal: 1 });
    P.fill(circle(0, gy, 0.055), '#16181c');
    for (let k = 0; k < 3; k++) {
      const a = Math.PI / 2 + (k * Math.PI * 2) / 3;
      P.fill(poly([[Math.cos(a) * 0.052, gy + Math.sin(a) * 0.052], [Math.cos(a + 2.2) * 0.012, gy + Math.sin(a + 2.2) * 0.012], [Math.cos(a - 2.2) * 0.012, gy + Math.sin(a - 2.2) * 0.012]]), '#e4e7ec', { metal: 1 });
    }
    plate(P, 0, 0.27, 0.34, 0.075, 'S GT 5913');
    // slim headlights
    slimLights(P, W * 0.36, 0.61, 0.24, 0.07, { slant: -0.6 });
  },
  rear(P, W) {
    both((s) => {
      P.fill(blob([[s * W * 0.18, 0.66], [s * W * 0.46, 0.68], [s * W * 0.47, 0.58], [s * W * 0.2, 0.6]], 0.3), '#3a0508');
      for (let k = 0; k < 3; k++) {
        const x = s * (W * 0.3 + k * 0.05);
        P.fill(poly([[x, 0.66], [x + s * 0.02, 0.62], [x, 0.59], [x - s * 0.02, 0.62]]), '#ff2b2b', { glow: '#ff3030' });
      }
    });
    P.fill(crect(0, 0.63, W * 0.36, 0.012, 0.006), '#ff2b2b', { glow: '#ff3030' });
    P.fill(crect(0, 0.22, W * 0.8, 0.12, 0.05), GLOSS_BLACK);
    for (let i = -4; i <= 4; i++) P.fill(crect(i * 0.07, 0.21, 0.012, 0.09, 0.005), '#2c2f36');
    plate(P, 0, 0.4, 0.34, 0.075, 'S GT 5913');
    P.text('AMG', W * 0.3, 0.5, 0.04, '#d0d4da', { metal: 1 });
  },
  side(P, L) {
    doorLines(P, 0.4, -0.38, 0.22, 0.73, { handleColor: '#d0d4da' });
    doorLines(P, -0.38, -0.92, 0.22, 0.73, { handleColor: '#d0d4da' });
    both((s) => P.fill(crect(s * 0.0 + 0.8, 0.57, 0.06, 0.012, 0.006), '#14151a'));
  },
});

// --- Generic Car Town style cars ---------------------------------------------

function genericFront(style) {
  return function front(P, W) {
    if (style === 'classic' || style === 'muscle') {
      P.fill(crect(0, 0.42, W * 0.72, 0.16, 0.03), CHROME, { metal: 1 });
      P.fill(crect(0, 0.42, W * 0.66, 0.11, 0.02), '#15161a');
      for (let i = -8; i <= 8; i++) P.fill(crect((i / 8) * W * 0.31, 0.42, 0.006, 0.1, 0.003), '#3a3c42');
      if (style === 'muscle') roundLights(P, W * 0.27, 0.42, 0.045);
      else roundLights(P, W * 0.36, 0.48, 0.065);
      P.fill(crect(0, 0.25, W * 0.92, 0.06, 0.03), CHROME, { metal: 1 });
      plate(P, 0, 0.29, 0.3, 0.07, 'CAR TOWN', { eu: false });
    } else if (style === 'truck') {
      P.fill(crect(0, 0.52, W * 0.66, 0.24, 0.04), CHROME, { metal: 1 });
      P.fill(crect(0, 0.52, W * 0.6, 0.18, 0.03), '#121316');
      for (let i = -3; i <= 3; i++) P.fill(crect(0, 0.52 + i * 0.04, W * 0.6, 0.012, 0.005), '#9aa0a8', { metal: 0.9 });
      both((s) => {
        P.fill(crect(s * W * 0.4, 0.55, 0.13, 0.11, 0.02), '#222');
        P.fill(crect(s * W * 0.4, 0.55, 0.11, 0.09, 0.02), '#f3f5f8', { glow: '#ffffff' });
      });
      P.fill(crect(0, 0.27, W * 0.98, 0.1, 0.03), '#2a2b2f');
      plate(P, 0, 0.3, 0.3, 0.07, 'TRUCK', { eu: false });
    } else if (style === 'van') {
      P.fill(crect(0, 0.42, W * 0.5, 0.1, 0.03), '#222428');
      both((s) => {
        P.fill(crect(s * W * 0.36, 0.44, 0.17, 0.1, 0.04), '#202125');
        P.fill(crect(s * W * 0.36, 0.44, 0.14, 0.075, 0.03), '#eef3f8', { glow: '#ffffff' });
        P.fill(crect(s * W * 0.43, 0.44, 0.04, 0.06, 0.02), AMBER, { glow: '#ffa020' });
      });
      P.fill(crect(0, 0.25, W * 0.95, 0.1, 0.04), '#d7d9dc');
      plate(P, 0, 0.29, 0.3, 0.07, 'VAN 2025');
    } else if (style === 'beetle') {
      roundLights(P, W * 0.32, 0.5, 0.075);
      P.fill(crect(0, 0.26, W * 0.9, 0.05, 0.025), CHROME, { metal: 1 });
      plate(P, 0, 0.32, 0.28, 0.065, 'BUG-71');
    } else if (style === 'super') {
      P.fill(poly([[-W * 0.42, 0.3], [W * 0.42, 0.3], [W * 0.3, 0.18], [-W * 0.3, 0.18]]), '#0d0e10');
      both((s) => {
        P.fill(poly([[s * W * 0.14, 0.24], [s * W * 0.44, 0.38], [s * W * 0.46, 0.26]]), '#0d0e10');
      });
      slimLights(P, W * 0.33, 0.43, 0.26, 0.06, { slant: 0.8 });
      P.fill(crect(0, 0.38, 0.1, 0.03, 0.01), '#d8dce2', { metal: 1 });
    } else if (style === 'police') {
      P.fill(crect(0, 0.44, W * 0.5, 0.1, 0.03), '#141518');
      slimLights(P, W * 0.34, 0.48, 0.2, 0.07, { slant: 0.2 });
      P.fill(crect(0, 0.24, W * 0.98, 0.1, 0.03), '#141518');
      both((s) => P.fill(crect(s * W * 0.18, 0.27, 0.06, 0.03, 0.01), '#2a63ff', { glow: '#3c6dff' }));
      plate(P, 0, 0.32, 0.3, 0.07, 'POLICE', { eu: false });
    } else {
      // modern hatch / sedan / suv
      P.fill(poly([[-W * 0.22, 0.42], [W * 0.22, 0.42], [W * 0.28, 0.26], [-W * 0.28, 0.26]]), '#17181c');
      for (let i = 0; i < 4; i++) P.fill(crect(0, 0.29 + i * 0.035, W * (0.48 - i * 0.03), 0.01, 0.004), '#34363c');
      slimLights(P, W * 0.35, 0.5, 0.24, 0.08, { slant: 0.35 });
      both((s) => P.fill(crect(s * W * 0.4, 0.27, 0.08, 0.035, 0.015), '#1a1b1f'));
      plate(P, 0, 0.32, 0.3, 0.07, 'CT 2010');
    }
  };
}

function genericRear(style) {
  return function rear(P, W) {
    if (style === 'round' || style === 'muscle') {
      tailPair(P, W * 0.3, 0.5, 0.1, 0.1, { round: true });
      if (style === 'muscle') tailPair(P, W * 0.17, 0.5, 0.1, 0.1, { round: true });
      P.fill(crect(0, 0.28, W * 0.94, 0.06, 0.03), CHROME, { metal: 1 });
      plate(P, 0, 0.42, 0.3, 0.07, 'CAR TOWN', { eu: false });
    } else if (style === 'vertical') {
      both((s) => {
        P.fill(crect(s * W * 0.43, 0.62, 0.07, 0.22, 0.03), '#3b0508');
        P.fill(crect(s * W * 0.43, 0.66, 0.05, 0.1, 0.02), RED_LIGHT, { glow: '#ff3030' });
        P.fill(crect(s * W * 0.43, 0.56, 0.05, 0.05, 0.02), AMBER, { glow: '#ffa020' });
      });
      P.fill(crect(0, 0.26, W * 0.96, 0.1, 0.04), '#2a2b2f');
      plate(P, 0, 0.4, 0.3, 0.07, 'CT 2010');
    } else if (style === 'bar') {
      tailBar(P, 0.56, W * 0.86, 0.06, { pixels: false });
      P.fill(crect(0, 0.24, W * 0.7, 0.08, 0.03), '#141518');
      plate(P, 0, 0.38, 0.3, 0.07, 'EV 2026');
    } else if (style === 'super') {
      tailBar(P, 0.42, W * 0.9, 0.04);
      P.fill(crect(0, 0.24, W * 0.84, 0.1, 0.03), '#0d0e10');
      for (let i = -5; i <= 5; i++) P.fill(crect(i * 0.07, 0.23, 0.012, 0.08, 0.005), '#33363c');
      both((s) => P.fill(circle(s * 0.12, 0.25, 0.035), '#888', { metal: 1 }));
    } else {
      tailPair(P, W * 0.36, 0.53, 0.2, 0.085);
      P.fill(crect(0, 0.26, W * 0.9, 0.08, 0.035), '#1b1c20');
      plate(P, 0, 0.4, 0.3, 0.07, 'CT 2010');
    }
  };
}

function genericSide(doors = 2) {
  return function side(P, L, spec) {
    const b = spec.cabin.beltY;
    if (doors === 2) doorLines(P, spec.cabin.front0 - 0.02, spec.cabin.front0 - 0.78, 0.22, b - 0.02);
    else {
      doorLines(P, spec.cabin.front0 - 0.02, spec.cabin.front0 - 0.62, 0.22, b - 0.02);
      doorLines(P, spec.cabin.front0 - 0.62, spec.cabin.front0 - 1.15, 0.22, b - 0.02);
    }
  };
}

def('hatch', {
  name: 'City Hatch', brand: 'Car Town', class: 'Compact',
  length: 2.12, width: 1.36, clearance: 0.15, planExp: 4, planExpRear: 6, rTop: 0.15, rBot: 0.07, tumble: 0.05,
  top: [[-1, 0.48], [-0.94, 0.64], [-0.82, 0.7], [0.15, 0.7], [0.55, 0.67], [0.85, 0.6], [0.97, 0.5], [1, 0.4]],
  bottom: [[-1, 0.27], [-0.86, 0.15], [0.86, 0.15], [1, 0.26]],
  wheel: { radius: 0.27, width: 0.22, front: 0.64, rear: -0.62, track: 0.56, style: 'spoke5' },
  cabin: { beltY: 0.68, roofY: 1.16, rear0: -0.98, front0: 0.32, rear1: -0.9, front1: -0.12, w0: 0.6, w1: 0.53, rc0: 0.18, rc1: 0.15, capH: 0.08, bPillar: { x: -0.34, w: 0.045 } },
  colors: { paint: '#d9262b', finish: 'gloss', rim: '#c9ccd1' },
  extras: { mirrors: 'body' },
  stats: { hp: 110, kg: 1050, grip: 0.95, gears: 5, redline: 7000 },
  price: 4500, level: 1,
  blurb: 'Every Car Town career starts here. Cheap, cheerful and easy to park.',
  front: genericFront('modern'), rear: genericRear('pair'), side: genericSide(2),
});

def('sedan', {
  name: 'Family Sedan', brand: 'Car Town', class: 'Sedan',
  length: 2.5, width: 1.4, clearance: 0.15, planExp: 3.6, planExpRear: 4, rTop: 0.13, rBot: 0.07, tumble: 0.05,
  top: [[-1, 0.46], [-0.93, 0.62], [-0.8, 0.67], [-0.55, 0.68], [0.4, 0.68], [0.8, 0.62], [0.96, 0.52], [1, 0.42]],
  bottom: [[-1, 0.27], [-0.86, 0.15], [0.86, 0.15], [1, 0.26]],
  wheel: { radius: 0.28, width: 0.22, front: 0.76, rear: -0.74, track: 0.58, style: 'multi' },
  cabin: { beltY: 0.66, roofY: 1.12, rear0: -0.68, front0: 0.36, rear1: -0.45, front1: -0.08, w0: 0.6, w1: 0.52, rc0: 0.2, rc1: 0.14, capH: 0.07, bPillar: { x: -0.12, w: 0.04 } },
  colors: { paint: '#2f5fb8', finish: 'metallic', rim: '#c9ccd1' },
  extras: { mirrors: 'body' },
  stats: { hp: 180, kg: 1400, grip: 1.0, gears: 6, redline: 6800 },
  price: 9000, level: 2,
  blurb: 'Comfortable four-door with room for the whole crew.',
  front: genericFront('modern'), rear: genericRear('pair'), side: genericSide(4),
});

def('muscle', {
  name: "Muscle '69", brand: 'Car Town', class: 'Muscle',
  length: 2.6, width: 1.46, clearance: 0.15, planExp: 7, planExpRear: 8, rTop: 0.09, rBot: 0.06, tumble: 0.03, flare: 0.02,
  top: [[-1, 0.46], [-0.96, 0.6], [-0.88, 0.63], [-0.3, 0.64], [0.9, 0.62], [0.98, 0.56], [1, 0.42]],
  bottom: [[-1, 0.25], [-0.9, 0.14], [0.9, 0.14], [1, 0.24]],
  wheel: { radius: 0.29, width: 0.27, front: 0.82, rear: -0.8, track: 0.6, style: 'classic' },
  cabin: { beltY: 0.62, roofY: 1.02, rear0: -0.75, front0: 0.2, rear1: -0.48, front1: -0.14, w0: 0.6, w1: 0.52, rc0: 0.16, rc1: 0.12, capH: 0.06, aFrac: [0, 1], bPillar: null },
  colors: { paint: '#e46b17', finish: 'gloss', rim: '#cfd2d6', livery: 'stripes', liveryColor: '#111111' },
  extras: { mirrors: 'chrome', hoodScoop: true, exhaust: 2 },
  stats: { hp: 420, kg: 1600, grip: 0.92, gears: 4, redline: 6500 },
  price: 32000, level: 5,
  blurb: 'Big block V8, long hood, short deck. Lays down rubber at every light.',
  front: genericFront('muscle'), rear: genericRear('muscle'), side: genericSide(2),
});

def('pickup', {
  name: 'Ranch Pickup', brand: 'Car Town', class: 'Truck',
  length: 2.7, width: 1.5, clearance: 0.22, planExp: 8, planExpRear: 10, rTop: 0.1, rBot: 0.06, tumble: 0.03, flare: 0.03,
  claddingY: 0.27,
  top: [[-1, 0.62], [-0.97, 0.76], [-0.9, 0.78], [0.2, 0.78], [0.86, 0.77], [0.97, 0.7], [1, 0.56]],
  bottom: [[-1, 0.32], [-0.9, 0.22], [0.9, 0.22], [1, 0.3]],
  wheel: { radius: 0.34, width: 0.3, front: 0.86, rear: -0.82, track: 0.62, style: 'steel', archGap: 0.06 },
  cabin: { beltY: 0.76, roofY: 1.28, rear0: -0.28, front0: 0.36, rear1: -0.26, front1: 0.1, w0: 0.64, w1: 0.58, rc0: 0.12, rc1: 0.1, capH: 0.06, bPillar: null },
  colors: { paint: '#f08c1c', finish: 'gloss', rim: '#d0d3d8' },
  extras: { mirrors: 'chrome', bed: true },
  stats: { hp: 360, kg: 2200, grip: 0.9, gears: 6, redline: 6000 },
  price: 22000, level: 4,
  blurb: 'Hauls hay bales by day and drag-strip trophies by night.',
  front: genericFront('truck'), rear: genericRear('vertical'), side: genericSide(2),
});

def('van', {
  name: 'Camper Van', brand: 'Car Town', class: 'Van',
  length: 2.5, width: 1.46, clearance: 0.17, planExp: 6, planExpRear: 8, rTop: 0.2, rBot: 0.07, tumble: 0.05,
  top: [[-1, 0.62], [-0.95, 0.74], [-0.86, 0.76], [0.8, 0.76], [0.95, 0.7], [1, 0.58]],
  bottom: [[-1, 0.28], [-0.88, 0.17], [0.88, 0.17], [1, 0.27]],
  wheel: { radius: 0.27, width: 0.22, front: 0.86, rear: -0.82, track: 0.6, style: 'steel' },
  cabin: { beltY: 0.74, roofY: 1.42, rear0: -1.2, front0: 1.14, rear1: -1.16, front1: 0.94, w0: 0.68, w1: 0.62, rc0: 0.25, rc1: 0.22, capH: 0.1, bPillar: { x: 0.55, w: 0.05 }, dPillar: { x: -0.25, w: 0.06 } },
  colors: { paint: '#2c8fb3', roof: '#f3f1ea', finish: 'gloss', rim: '#e7e8ea' },
  extras: { mirrors: 'black' },
  stats: { hp: 150, kg: 1900, grip: 0.85, gears: 5, redline: 5800 },
  price: 15000, level: 3,
  blurb: 'Two-tone surf wagon. Slow, but every road trip ends with a story.',
  front: genericFront('van'), rear: genericRear('vertical'), side(P, L) { doorLines(P, 0.95, 0.5, 0.2, 0.72); P.fill(rrect(-1.1, 0.48, 2.1, 0.035, 0.015), 'rgba(255,255,255,0.9)'); },
});

def('taxi', {
  name: 'Yellow Cab', brand: 'Car Town', class: 'Taxi',
  length: 2.5, width: 1.4, clearance: 0.15, planExp: 4, planExpRear: 4.5, rTop: 0.12, rBot: 0.07, tumble: 0.05,
  top: [[-1, 0.46], [-0.93, 0.62], [-0.8, 0.67], [-0.55, 0.68], [0.4, 0.68], [0.8, 0.62], [0.96, 0.52], [1, 0.42]],
  bottom: [[-1, 0.27], [-0.86, 0.15], [0.86, 0.15], [1, 0.26]],
  wheel: { radius: 0.28, width: 0.22, front: 0.76, rear: -0.74, track: 0.58, style: 'steel' },
  cabin: { beltY: 0.66, roofY: 1.12, rear0: -0.68, front0: 0.36, rear1: -0.45, front1: -0.08, w0: 0.6, w1: 0.52, rc0: 0.2, rc1: 0.14, capH: 0.07, bPillar: { x: -0.12, w: 0.04 } },
  colors: { paint: '#f7c51e', finish: 'gloss', rim: '#cfd2d6', livery: 'checker', liveryColor: '#111111' },
  extras: { mirrors: 'body', taxiSign: true },
  stats: { hp: 200, kg: 1500, grip: 0.95, gears: 6, redline: 6500 },
  price: 12000, level: 2,
  blurb: 'Off duty and ready to race. Comes with a genuine rooftop light.',
  front: genericFront('modern'), rear: genericRear('pair'), side: genericSide(4),
});

def('police', {
  name: 'Police Cruiser', brand: 'Car Town', class: 'Police',
  length: 2.56, width: 1.44, clearance: 0.15, planExp: 4, planExpRear: 4.5, rTop: 0.12, rBot: 0.07, tumble: 0.05,
  top: [[-1, 0.46], [-0.93, 0.62], [-0.8, 0.68], [-0.55, 0.69], [0.4, 0.69], [0.8, 0.63], [0.96, 0.53], [1, 0.42]],
  bottom: [[-1, 0.27], [-0.86, 0.15], [0.86, 0.15], [1, 0.26]],
  wheel: { radius: 0.29, width: 0.24, front: 0.78, rear: -0.76, track: 0.6, style: 'steel' },
  cabin: { beltY: 0.67, roofY: 1.13, rear0: -0.7, front0: 0.36, rear1: -0.46, front1: -0.08, w0: 0.6, w1: 0.52, rc0: 0.2, rc1: 0.14, capH: 0.07, bPillar: { x: -0.12, w: 0.04 }, roofMat: MAT.ROOF },
  colors: { paint: '#16171b', roof: '#f4f4f4', finish: 'gloss', rim: '#cfd2d6', livery: 'police', liveryColor: '#f4f4f4' },
  extras: { mirrors: 'black', lightBar: true, pushBar: true },
  stats: { hp: 380, kg: 1800, grip: 1.0, gears: 6, redline: 6500 },
  price: 45000, level: 6,
  blurb: 'Retired interceptor. The siren still works (please do not tell anyone).',
  front: genericFront('police'), rear: genericRear('pair'), side: genericSide(4),
});

def('coupe', {
  name: 'GT Coupe', brand: 'Car Town', class: 'Sports',
  length: 2.45, width: 1.46, clearance: 0.13, planExp: 3.2, planExpRear: 4, rTop: 0.15, rBot: 0.06, tumble: 0.07, flare: 0.025, noseTaper: 0.06, fenderHump: 0.07,
  top: [[-1, 0.44], [-0.93, 0.58], [-0.8, 0.63], [-0.4, 0.64], [0.3, 0.62], [0.62, 0.6], [0.85, 0.55], [0.96, 0.46], [1, 0.36]],
  bottom: [[-1, 0.24], [-0.88, 0.13], [0.86, 0.13], [1, 0.22]],
  wheel: { radius: 0.28, width: 0.26, front: 0.76, rear: -0.74, track: 0.6, style: 'spoke5', archGap: 0.035 },
  cabin: { beltY: 0.58, roofY: 0.98, rear0: -0.85, front0: 0.32, rear1: -0.42, front1: -0.12, w0: 0.6, w1: 0.48, rc0: 0.22, rc1: 0.14, capH: 0.06, bPillar: null, cFrac: [0, 1] },
  colors: { paint: '#1e9e4a', finish: 'metallic', rim: '#2b2d31', caliper: '#d61b1b' },
  extras: { mirrors: 'body', spoiler: 'lip', exhaust: 2 },
  stats: { hp: 400, kg: 1450, grip: 1.12, gears: 6, redline: 7800 },
  price: 52000, level: 7,
  blurb: 'Front-engined grand tourer with a fastback roof and a howling straight-six.',
  front: genericFront('modern'), rear: genericRear('bar'), side: genericSide(2),
});

def('super', {
  name: 'Wedge Supercar', brand: 'Car Town', class: 'Supercar',
  length: 2.56, width: 1.56, clearance: 0.12, planExp: 2.6, planExpRear: 5, rTop: 0.14, rBot: 0.05, tumble: 0.08, flare: 0.035, noseTaper: 0.12, fenderHump: 0.17,
  top: [[-1, 0.5], [-0.9, 0.56], [-0.5, 0.58], [0.0, 0.5], [0.5, 0.42], [0.85, 0.36], [1, 0.27]],
  bottom: [[-1, 0.22], [-0.88, 0.12], [0.88, 0.12], [1, 0.16]],
  wheel: { radius: 0.27, width: 0.28, front: 0.78, rear: -0.76, track: 0.64, style: 'turbine', archGap: 0.03 },
  cabin: { beltY: 0.5, roofY: 0.88, rear0: -0.5, front0: 0.55, rear1: -0.36, front1: -0.02, w0: 0.58, w1: 0.44, rc0: 0.24, rc1: 0.15, capH: 0.05, bPillar: null },
  colors: { paint: '#7a3fd0', finish: 'pearl', rim: '#1d1e22', caliper: '#f2c21b' },
  extras: { mirrors: 'body', spoiler: 'wing', exhaust: 4 },
  stats: { hp: 780, kg: 1450, grip: 1.25, gears: 7, redline: 9000 },
  price: 210000, level: 12,
  blurb: 'Scissor doors, V12 scream and the reason the town installed speed bumps.',
  front: genericFront('super'), rear: genericRear('super'), side(P, L) { P.fill(blob([[0.05, 0.22], [-0.6, 0.24], [-0.7, 0.42], [-0.2, 0.34]], 0.3), '#0d0e10'); },
});

def('offroad', {
  name: 'Trail 4x4', brand: 'Car Town', class: 'Off-road',
  length: 2.3, width: 1.5, clearance: 0.26, planExp: 9, planExpRear: 10, rTop: 0.09, rBot: 0.05, tumble: 0.03, flare: 0.05,
  claddingY: 0.32, archCladding: 0.08,
  top: [[-1, 0.66], [-0.96, 0.8], [-0.9, 0.82], [0.85, 0.8], [0.96, 0.74], [1, 0.62]],
  bottom: [[-1, 0.34], [-0.9, 0.26], [0.9, 0.26], [1, 0.34]],
  wheel: { radius: 0.36, width: 0.32, front: 0.72, rear: -0.72, track: 0.64, style: 'dish', archGap: 0.06 },
  cabin: { beltY: 0.8, roofY: 1.36, rear0: -1.05, front0: 0.38, rear1: -1.04, front1: 0.14, w0: 0.66, w1: 0.62, rc0: 0.1, rc1: 0.08, capH: 0.05, bPillar: { x: -0.3, w: 0.06 }, dPillar: { x: -0.75, w: 0.05 } },
  colors: { paint: '#5f7d3a', finish: 'matte', rim: '#1d1e22' },
  extras: { mirrors: 'black', roofRails: true, spareWheel: true },
  stats: { hp: 290, kg: 2100, grip: 0.95, gears: 6, redline: 6200 },
  price: 28000, level: 4,
  blurb: 'Boxy, unbreakable and ready for the dirt road to the lake.',
  front: genericFront('truck'), rear: genericRear('vertical'), side: genericSide(4),
});

def('beetle', {
  name: 'Retro Bug', brand: 'Car Town', class: 'Classic',
  length: 2.05, width: 1.36, clearance: 0.16, planExp: 2.4, planExpRear: 2.4, rTop: 0.24, rBot: 0.08, tumble: 0.08, flare: 0.05,
  top: [[-1, 0.45], [-0.85, 0.62], [-0.5, 0.68], [0.3, 0.68], [0.7, 0.62], [0.92, 0.52], [1, 0.42]],
  bottom: [[-1, 0.28], [-0.86, 0.16], [0.86, 0.16], [1, 0.28]],
  wheel: { radius: 0.26, width: 0.2, front: 0.62, rear: -0.6, track: 0.54, style: 'steel' },
  cabin: { beltY: 0.64, roofY: 1.18, rear0: -0.7, front0: 0.36, rear1: -0.42, front1: 0.0, w0: 0.58, w1: 0.48, rc0: 0.28, rc1: 0.24, capH: 0.16, capR: 0.26, bPillar: { x: -0.18, w: 0.04 } },
  colors: { paint: '#8fd3e8', finish: 'gloss', rim: '#e7e8ea' },
  extras: { mirrors: 'chrome' },
  stats: { hp: 60, kg: 800, grip: 0.85, gears: 4, redline: 5500 },
  price: 6000, level: 1,
  blurb: 'Round, friendly and air-cooled. Everybody waves at the Bug.',
  front: genericFront('beetle'), rear: genericRear('round'), side: genericSide(2),
});

def('rally', {
  name: 'Rally Hatch', brand: 'Car Town', class: 'Hot Hatch',
  length: 2.18, width: 1.44, clearance: 0.16, planExp: 4.4, planExpRear: 7, rTop: 0.13, rBot: 0.06, tumble: 0.05, flare: 0.045,
  top: [[-1, 0.5], [-0.94, 0.66], [-0.82, 0.71], [0.15, 0.71], [0.55, 0.68], [0.85, 0.61], [0.97, 0.51], [1, 0.41]],
  bottom: [[-1, 0.27], [-0.86, 0.16], [0.86, 0.16], [1, 0.26]],
  wheel: { radius: 0.28, width: 0.25, front: 0.66, rear: -0.64, track: 0.6, style: 'mesh' },
  cabin: { beltY: 0.69, roofY: 1.15, rear0: -1.0, front0: 0.32, rear1: -0.92, front1: -0.12, w0: 0.62, w1: 0.54, rc0: 0.18, rc1: 0.15, capH: 0.08, bPillar: { x: -0.34, w: 0.045 } },
  colors: { paint: '#f4f6f8', finish: 'gloss', rim: '#e3b51a', caliper: '#d61b1b', livery: 'number', liveryColor: '#1450c8' },
  extras: { mirrors: 'body', spoiler: 'roof', mudflaps: true, exhaust: 1 },
  stats: { hp: 300, kg: 1250, grip: 1.15, gears: 6, redline: 7500 },
  price: 26000, level: 5,
  blurb: 'Turbocharged, all-wheel-drive and covered in sponsor stickers.',
  front: genericFront('modern'), rear: genericRear('pair'), side: genericSide(2),
});

def('suv', {
  name: 'Urban SUV', brand: 'Car Town', class: 'SUV',
  length: 2.5, width: 1.48, clearance: 0.19, planExp: 4.5, planExpRear: 6, rTop: 0.13, rBot: 0.06, tumble: 0.05, flare: 0.02,
  claddingY: 0.25, archCladding: 0.06,
  top: [[-1, 0.52], [-0.95, 0.68], [-0.86, 0.75], [0.2, 0.76], [0.6, 0.73], [0.86, 0.66], [0.97, 0.56], [1, 0.45]],
  bottom: [[-1, 0.3], [-0.88, 0.19], [0.86, 0.19], [1, 0.28]],
  wheel: { radius: 0.31, width: 0.25, front: 0.78, rear: -0.78, track: 0.62, style: 'spoke5' },
  cabin: { beltY: 0.74, roofY: 1.26, rear0: -1.12, front0: 0.36, rear1: -1.02, front1: -0.12, w0: 0.64, w1: 0.56, rc0: 0.18, rc1: 0.14, capH: 0.07, bPillar: { x: -0.32, w: 0.05 }, dPillar: { x: -0.8, w: 0.05 } },
  colors: { paint: '#4a4f57', finish: 'metallic', rim: '#c9ccd1' },
  extras: { mirrors: 'black', roofRails: true },
  stats: { hp: 260, kg: 1800, grip: 0.98, gears: 8, redline: 6500 },
  price: 24000, level: 3,
  blurb: 'High seating, big boot, and a surprising turn of speed.',
  front: genericFront('modern'), rear: genericRear('vertical'), side: genericSide(4),
});

export const MODEL_IDS = Object.keys(MODELS);
export const FEATURED_IDS = MODEL_IDS.filter((id) => MODELS[id].featured);
// Models used for NPC customers & traffic
export const NPC_MODEL_IDS = ['hatch', 'sedan', 'taxi', 'van', 'pickup', 'beetle', 'suv', 'muscle', 'police', 'rally', 'offroad', 'coupe', 'smart2', 'ioniq3'];
