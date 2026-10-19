// Parametric body archetypes for the realistic (v2) generic cars. A handful
// of real-world dimensions (length, wheelbase, heights of nose / hood / belt /
// roof / tail and the x positions of the pillars) are turned into the full set
// of character curves used by bodyV2, plus generic window, door, light and
// grille artwork matching the body type.

import { greenhouse, roundedPoly, smoothPath, plate, gap, line, rrect, crect, circle, ellipse, poly, both, archBand, glassPanel } from './v2draw.js';

const GLOSS_BLACK = '#0b0c0f';
const SATIN_BLACK = '#1a1b1f';
const CHROME = '#dfe3e8';

/** Builds the bodyV2 curve description from archetype parameters. */
function curves(o) {
  const half = o.L / 2;
  const fa = half - o.fOver;
  const ra = fa - o.wheelbase;
  const r = o.r;
  const sillY = o.clearance + 0.06;
  const noseBottom = o.noseBottom ?? o.clearance + 0.16;
  const tailBottom = o.tailBottom ?? o.clearance + 0.24;
  const { cowl, roofFront, roofRear, rearBase } = o;
  const nose = o.noseY;
  const hood = o.hoodY;
  const crown = o.crown ?? 0.025;
  const roof = [];
  const belt = [];
  const push = (arr, x, y) => arr.push([x, y]);
  // --- front: nose tip, hood leading edge, hood, cowl
  push(roof, half, nose - (o.noseRound ?? 0.17));
  push(roof, half - 0.025, nose - 0.055);
  push(roof, half - 0.09, nose);
  push(roof, half - 0.3, nose + (hood - nose) * 0.35);
  push(roof, cowl + 0.25, hood - 0.01);
  push(roof, cowl, hood + 0.015);
  // --- windshield & roof
  push(roof, (cowl + roofFront) / 2 + 0.03, hood + 0.015 + (o.roofY - 0.03 - hood) * 0.5);
  push(roof, roofFront, o.roofY - 0.03);
  push(roof, roofFront - 0.15, o.roofY - 0.004);
  push(roof, (roofFront + roofRear) / 2, o.roofY);
  const rr = o.roofRearY ?? o.roofY - 0.05;
  push(roof, roofRear + 0.15, rr + 0.03);
  push(roof, roofRear, rr);
  // --- greenhouse belt (front part)
  push(belt, half, nose - (o.noseRound ?? 0.17) - 0.02);
  push(belt, half - 0.025, nose - 0.055 - crown);
  push(belt, half - 0.09, nose - crown);
  push(belt, half - 0.3, nose + (hood - nose) * 0.35 - crown);
  push(belt, cowl + 0.25, hood - 0.01 - crown);
  push(belt, cowl + 0.05, o.beltY + 0.0);
  push(belt, cowl - 0.05, o.beltY);
  const t = o.type;
  if (t === 'sedan' || t === 'coupe' || t === 'super') {
    const deck = o.deckY;
    push(roof, rearBase + 0.04, deck + 0.04);
    push(roof, rearBase - 0.06, deck + 0.012);
    push(roof, -half + 0.16, deck);
    push(roof, -half + 0.045, deck - 0.03);
    push(roof, -half + 0.012, deck - 0.12);
    push(roof, -half, deck - (o.tailRound ?? 0.26));
    push(belt, (cowl + rearBase) / 2, (o.beltY + o.beltRear) / 2);
    push(belt, rearBase + 0.1, o.beltRear);
    push(belt, rearBase - 0.06, deck - crown);
    push(belt, -half + 0.16, deck - crown);
    push(belt, -half + 0.045, deck - 0.03 - crown);
    push(belt, -half + 0.012, deck - 0.12 - crown);
    push(belt, -half, deck - (o.tailRound ?? 0.26) - 0.02);
  } else if (t === 'pickup') {
    const bed = o.bedY;
    push(roof, rearBase + 0.01, o.beltRear + 0.06);
    push(roof, rearBase - 0.05, bed + 0.02);
    push(roof, rearBase - 0.12, bed);
    push(roof, -half + 0.06, bed);
    push(roof, -half + 0.015, bed - 0.08);
    push(roof, -half, bed - 0.24);
    push(belt, (cowl + rearBase) / 2, (o.beltY + o.beltRear) / 2);
    push(belt, rearBase + 0.06, o.beltRear);
    push(belt, rearBase - 0.05, bed - 0.004);
    push(belt, rearBase - 0.12, bed - 0.01);
    push(belt, -half + 0.06, bed - 0.01);
    push(belt, -half + 0.015, bed - 0.09);
    push(belt, -half, bed - 0.26);
  } else if (t === 'beetle') {
    // one continuous arc from the roof down to the tail
    const yBase = (o.tailY ?? 0.95) - 0.38;
    const dx = roofRear + half;
    const dy = rr - yBase;
    for (let i = 1; i <= 10; i++) {
      const th = (i / 10) * (Math.PI / 2);
      const x = roofRear - dx * Math.sin(th);
      const y = yBase + dy * Math.cos(th);
      push(roof, x, y);
      if (x < rearBase - 0.02) push(belt, x, y - crown);
    }
    push(belt, (cowl + rearBase) / 2, (o.beltY + o.beltRear) / 2);
    push(belt, rearBase + 0.06, o.beltRear);
  } else {
    // hatch / suv / van / offroad: tailgate
    const tail = o.tailY;
    push(roof, rearBase, tail + 0.05);
    push(roof, -half + 0.035, tail);
    push(roof, -half + 0.01, tail - 0.1);
    push(roof, -half, tail - (o.tailRound ?? 0.26));
    push(belt, (cowl + rearBase) / 2, (o.beltY + o.beltRear) / 2);
    push(belt, rearBase + 0.06, o.beltRear);
    push(belt, rearBase - 0.01, tail + 0.03);
    push(belt, -half + 0.035, tail - crown);
    push(belt, -half + 0.01, tail - 0.1 - crown);
    push(belt, -half, tail - (o.tailRound ?? 0.26) - 0.02);
  }
  const dedupe = (arr) => {
    const sorted = [...arr].sort((a, b) => a[0] - b[0]);
    const out = [];
    for (const p of sorted) if (!out.length || p[0] - out[out.length - 1][0] > 0.004) out.push(p);
    return out;
  };
  const hw = o.W / 2 - (o.flare ?? 0.02);
  const shoulderMid = o.shoulderY ?? o.beltY - 0.17;
  return {
    length: o.L,
    width: o.W,
    wheel: { radius: r, width: o.tw, front: fa, rear: ra, archGap: o.archGap ?? 0.045 },
    roof: dedupe(roof),
    belt: dedupe(belt),
    sill: dedupe([[-half, tailBottom], [-half + 0.12, sillY + 0.09], [ra - r - 0.25, sillY], [fa + r + 0.25, sillY], [half - 0.12, sillY + 0.07], [half, noseBottom]]),
    shoulder: dedupe([[-half, Math.min(o.tailY ?? o.deckY ?? o.bedY ?? 0.8, o.beltRear) - 0.22], [-half + 0.35, o.beltRear - 0.16], [0, shoulderMid], [half - 0.35, nose - 0.1], [half, nose - 0.3]]),
    wBody: dedupe([[-half, hw - 0.03], [ra, hw], [0, hw + 0.005], [fa, hw], [half, hw - 0.035]]),
    wBelt: dedupe([[-half, hw - 0.12], [0, hw - (o.tumble ?? 0.075)], [half, hw - 0.12]]),
    wRoof: dedupe([[-half, hw - 0.3], [roofRear, hw - (o.roofTumble ?? 0.21)], [0, hw - (o.roofTumble ?? 0.2)], [roofFront, hw - (o.roofTumble ?? 0.21) - 0.02], [half, hw - 0.3]]),
    noseDepth: o.noseDepth ?? 0.42,
    noseExp: o.noseExp ?? 3.4,
    tailDepth: o.tailDepth ?? 0.32,
    tailExp: o.tailExp ?? 4,
    noseRake: o.noseRake ?? { depth: 0.42, y0: noseBottom + 0.1, y1: nose, amount: 0.06 },
    tailRake: o.tailRake,
    flare: o.flare ?? 0.02,
    rLow: o.rLow ?? 0.1,
    roofEdge: o.roofEdge ?? 0.065,
    archTrim: o.archTrim,
    hoodRidge: o.hoodRidge,
    fenderHump: o.fenderHump,
    keyX: [cowl, roofFront, roofRear, rearBase],
  };
}

// ---------------------------------------------------------------------------
// Generic artwork
// ---------------------------------------------------------------------------

function sideArt(o) {
  return function side(P, c) {
    const fn = c.fn;
    const b = c.b;
    const fa = b.wheel.front;
    const ra = b.wheel.rear;
    const R = fn.arches[0].r;
    const cowl = o.cowl;
    const isSedan = o.type === 'sedan' || o.type === 'coupe' || o.type === 'super';
    let rBase = isSedan ? o.rearBase + 0.06 : o.type === 'pickup' ? o.rearBase + 0.04 : o.rearBase + (o.dPillar ?? 0.22);
    let rTop = isSedan ? o.roofRear + 0.12 : o.type === 'pickup' ? o.roofRear + 0.02 : o.roofRear + (o.dPillarTop ?? 0.18);
    if (o.type === 'super') {
      rBase = o.roofRear - 0.35;
      rTop = o.roofRear + 0.05;
    } else if (o.type === 'beetle') {
      rBase = o.roofRear - 0.12;
      rTop = o.roofRear + 0.08;
    }
    const span = cowl - rBase;
    const bX = cowl - span * (o.doors === 2 ? (isSedan ? 0.62 : 0.58) : 0.44);
    const cX = cowl - span * 0.8;
    let windows;
    if (o.type === 'van') windows = [[cowl, bX], [bX - 0.1, cX], [cX - 0.1, rBase]];
    else if (o.doors === 2 && (o.type === 'coupe' || o.type === 'super')) windows = [[cowl, rBase]];
    else if (o.doors === 2) windows = [[cowl, bX], [bX - 0.12, rBase]];
    else if (isSedan) windows = [[cowl, bX], [bX - 0.1, rBase]];
    else if (o.type === 'pickup') windows = [[cowl, bX], [bX - 0.1, rBase]];
    else windows = [[cowl, bX], [bX - 0.1, cX], [cX - 0.1, rBase]];
    const g = greenhouse(c, { aBase: cowl - 0.03, aTop: o.roofFront + 0.01, rBase, rTop, windows, inset: 0.028 });
    P.fill(g.surround, o.pillarColor === 'body' ? 'rgba(0,0,0,0)' : GLOSS_BLACK);
    if (o.chromeDLO) P.stroke(g.surround, CHROME, 0.012, { metal: 1 });
    for (const w of g.windows) P.glass(w);
    // doors
    const sill = fn.sillAt(0) + 0.07;
    const df = fa - R - 0.05;
    const beltAt = (x) => fn.beltAt(x);
    gap(P, [[df, sill], [df, beltAt(df) - 0.25], [Math.min(cowl - 0.02, df + 0.05), beltAt(cowl)]]);
    if (o.doors === 2 || o.type === 'van') {
      const dr = Math.max(bX - 0.06, ra + R + 0.06);
      gap(P, [[dr, sill], [dr, beltAt(dr) + 0.02]]);
      P.fill(crect(dr + 0.2, beltAt(dr) - 0.08, 0.19, 0.03, 0.014), o.handle ?? '#26282d', { metal: 0.6 });
      if (o.type === 'van') {
        gap(P, [[bX - 0.06, sill], [bX - 0.06, beltAt(bX) + 0.02]]);
        P.stroke(line([[cX + 0.3, beltAt(cX) - 0.04], [rBase + 0.1, beltAt(rBase) - 0.04]]), 'rgba(0,0,0,0.3)', 0.008);
      }
    } else {
      const bGap = bX - 0.05;
      gap(P, [[bGap, sill], [bGap, beltAt(bGap) + 0.02]]);
      const rr = ra + R + 0.04;
      gap(P, [[rr - 0.12, beltAt(rr) + 0.02], [rr - 0.09, beltAt(rr) - 0.2], [rr, fn.wheelY + R * 0.75], [rr + 0.03, sill]]);
      P.fill(crect(bGap + 0.22, beltAt(bGap) - 0.08, 0.19, 0.03, 0.014), o.handle ?? '#26282d', { metal: 0.6 });
      P.fill(crect(rr + 0.12, beltAt(rr) - 0.08, 0.18, 0.03, 0.014), o.handle ?? '#26282d', { metal: 0.6 });
    }
    gap(P, [[df, sill], [Math.max(ra + R + 0.04, bX - 0.6), sill]], 0.005);
    // shoulder light-catcher
    P.stroke(line([[fa + 0.2, fn.shoulderAt(fa) + 0.05], [0, fn.shoulderAt(0) + 0.05], [ra - 0.2, fn.shoulderAt(ra) + 0.05]]), 'rgba(255,255,255,0.28)', 0.012);
    if (o.cladding) {
      for (const a of fn.arches) P.fill(archBand(a.x, fn.wheelY, a.r - 0.012, 0.07, { sill: 0.2 }), SATIN_BLACK);
      P.fill(rrect(ra + R, 0.15, (fa - R) - (ra + R), 0.17, 0.05), SATIN_BLACK);
    } else if (o.skirt) {
      P.fill(rrect(ra + R, 0.17, (fa - R) - (ra + R), 0.1, 0.04), o.skirt);
    }
    if (o.sideBadge) P.text(o.sideBadge, fa - R - 0.25, fn.shoulderAt(fa) - 0.05, 0.045, '#cfd3d9', { metal: 1, font: 'Arial, sans-serif', weight: '700', italic: true });
    if (o.sideArt) o.sideArt(P, c, g);
  };
}

function frontArt(o) {
  const st = o.front || {};
  return function front(P, c) {
    const span = c.frontSpan - 0.06;
    const top = o.noseY;
    const bot = o.noseBottom ?? o.clearance + 0.16;
    const H = top - bot;
    const style = st.style || 'modern';
    if (style === 'modern' || style === 'police') {
      const gy = bot + H * 0.42;
      const g = smoothPath([[-0.36, gy + H * 0.2], [0.36, gy + H * 0.2], [0.44, gy - H * 0.22], [-0.44, gy - H * 0.22]], true, 0.2);
      P.fill(g, '#121317');
      P.clip(g, () => { for (let i = -10; i <= 10; i++) P.stroke(line([[i * 0.05, gy - H * 0.3], [i * 0.05 + 0.03, gy + H * 0.3]]), 'rgba(80,84,92,0.7)', 0.008); });
      if (st.chromeBar) P.fill(crect(0, gy + H * 0.05, 0.86, 0.025, 0.012), CHROME, { metal: 1 });
      both((s) => {
        const ly = top - H * 0.14;
        const lamp = smoothPath([[s * 0.42, ly - 0.035], [s * (span - 0.22), ly - 0.01], [s * (span - 0.06), ly + 0.04], [s * (span - 0.15), ly + 0.055], [s * 0.44, ly + 0.03]], true, 0.2);
        P.fill(lamp, '#11141a');
        P.stroke(line([[s * 0.46, ly], [s * (span - 0.2), ly + 0.02], [s * (span - 0.1), ly + 0.04]]), '#ffffff', 0.012, { glow: '#ffffff' });
        P.fill(ellipse(s * (span - 0.3), ly + 0.012, 0.05, 0.025), '#dfe8f4', { glow: '#c4d6f0', metal: 0.4 });
        P.fill(rrect(s > 0 ? span - 0.3 : -span + 0.08, bot + 0.05, 0.22, 0.09, 0.03), '#121317');
      });
      P.fill(rrect(-span, bot - 0.03, span * 2, 0.07, 0.03), SATIN_BLACK);
      if (style === 'police') both((s) => P.fill(crect(s * 0.2, gy + H * 0.05, 0.08, 0.03, 0.01), s > 0 ? '#ff2a2a' : '#2a63ff', { glow: s > 0 ? '#ff2020' : '#3c6dff' }));
    } else if (style === 'classic') {
      const gy = bot + H * 0.55;
      P.fill(crect(0, gy, span * 1.7, H * 0.42, 0.04), CHROME, { metal: 1 });
      P.fill(crect(0, gy, span * 1.62, H * 0.34, 0.03), '#0f1013');
      for (let i = -14; i <= 14; i++) P.fill(crect((i / 14) * span * 0.78, gy, 0.008, H * 0.3, 0.004), '#3a3c42');
      both((s) => {
        for (const k of [0, 1]) {
          const cx = s * (span * 0.8 - k * 0.17);
          P.fill(circle(cx, gy, 0.075), CHROME, { metal: 1 });
          P.fill(circle(cx, gy, 0.064), P.radial(cx, gy, 0.07, [[0, '#ffffff'], [0.6, '#f3ecd3'], [1, '#b9b09a']]), { glow: '#fff1c8' });
        }
      });
      P.fill(crect(0, bot + 0.04, span * 1.9, 0.07, 0.035), CHROME, { metal: 1 });
      if (st.badge) P.text(st.badge, -span * 0.45, gy, 0.05, '#d61b1b', { weight: '900' });
    } else if (style === 'truck' || style === 'offroad') {
      const gy = bot + H * 0.55;
      if (style === 'truck') {
        P.fill(crect(0, gy, span * 1.25, H * 0.55, 0.05), CHROME, { metal: 1 });
        P.fill(crect(0, gy, span * 1.15, H * 0.45, 0.04), '#101114');
        for (let i = -2; i <= 2; i++) P.fill(crect(0, gy + i * H * 0.085, span * 1.15, 0.03, 0.012), '#b9bec6', { metal: 1 });
        both((s) => {
          P.fill(crect(s * span * 0.84, gy + 0.03, 0.26, 0.15, 0.03), '#16181d');
          P.fill(crect(s * span * 0.84, gy + 0.03, 0.22, 0.11, 0.025), '#eef3f8', { glow: '#ffffff', metal: 0.4 });
        });
      } else {
        P.fill(crect(0, gy, span * 1.1, H * 0.45, 0.04), '#1b1c20');
        for (let i = -3; i <= 3; i++) P.fill(crect(i * span * 0.14, gy, 0.05, H * 0.36, 0.025), '#08090a');
        both((s) => {
          P.fill(circle(s * span * 0.78, gy + 0.02, 0.1), '#16181d');
          P.fill(circle(s * span * 0.78, gy + 0.02, 0.082), P.radial(s * span * 0.78, gy + 0.02, 0.09, [[0, '#ffffff'], [0.6, '#e8eef6'], [1, '#9aa4b0']]), { glow: '#ffffff' });
          P.stroke(circle(s * span * 0.78, gy + 0.02, 0.06), '#ffffff', 0.008, { glow: '#ffffff' });
        });
      }
      P.fill(rrect(-span, bot - 0.04, span * 2, 0.16, 0.04), style === 'truck' ? '#2a2c31' : '#1b1c20');
    } else if (style === 'round') {
      both((s) => {
        const cx = s * span * 0.62;
        const cy = top - 0.05;
        P.fill(circle(cx, cy, 0.105), CHROME, { metal: 1 });
        P.fill(circle(cx, cy, 0.09), P.radial(cx, cy, 0.1, [[0, '#ffffff'], [0.6, '#f3ecd3'], [1, '#b9b09a']]), { glow: '#fff1c8' });
        P.fill(crect(s * span * 0.35, bot + 0.18, 0.06, 0.03, 0.015), '#ffb347', { glow: '#ff9a1a' });
      });
      P.fill(crect(0, bot + 0.04, span * 1.9, 0.06, 0.03), CHROME, { metal: 1 });
      P.fill(crect(0, top - 0.2, 0.12, 0.12, 0.02), CHROME, { metal: 1 });
    } else if (style === 'super') {
      both((s) => {
        P.fill(poly([[s * 0.14, bot + 0.05], [s * (span - 0.04), bot + 0.18], [s * (span - 0.02), bot + 0.02], [s * 0.18, bot - 0.01]]), '#0d0e10');
        const ly = top - 0.06;
        const lamp = poly([[s * 0.36, ly - 0.03], [s * (span - 0.1), ly + 0.01], [s * (span - 0.02), ly + 0.05], [s * 0.42, ly + 0.01]]);
        P.fill(lamp, '#101318');
        P.stroke(line([[s * 0.4, ly - 0.01], [s * (span - 0.08), ly + 0.03]]), '#ffffff', 0.012, { glow: '#ffffff' });
      });
      P.fill(crect(0, bot + 0.05, 0.5, 0.08, 0.03), '#0d0e10');
      P.fill(crect(0, top - 0.08, 0.1, 0.04, 0.01), '#d8dce2', { metal: 1 });
    } else if (style === 'van') {
      const ly = top - H * 0.25;
      P.fill(crect(0, ly, span * 1.9, H * 0.22, 0.04), '#16171b');
      both((s) => {
        P.fill(crect(s * span * 0.78, ly, 0.28, H * 0.16, 0.04), '#eef3f8', { glow: '#ffffff', metal: 0.4 });
        P.fill(crect(s * span * 0.52, ly, 0.08, H * 0.12, 0.03), '#ffb347', { glow: '#ff9a1a' });
      });
      P.fill(circle(0, ly, 0.07), CHROME, { metal: 1 });
      P.fill(rrect(-span, bot - 0.03, span * 2, 0.13, 0.04), '#d7d9dc');
    }
    if (st.plate !== false) plate(P, 0, bot + (st.plateY ?? 0.13), st.plateText || o.plate || 'CT 2010', { w: 0.5, h: 0.11, bandText: st.band ?? 'CT' });
  };
}

function rearArt(o) {
  const st = o.rear || {};
  return function rear(P, c) {
    const span = c.rearSpan - 0.08;
    const top = o.tailY ?? o.deckY ?? o.bedY ?? 0.9;
    const bot = o.tailBottom ?? o.clearance + 0.24;
    const H = top - bot;
    const style = st.style || 'pair';
    const ly = bot + H * (st.lightY ?? 0.72);
    if (style === 'pair') {
      both((s) => {
        const lamp = smoothPath([[s * (span - 0.02), ly + 0.07], [s * (span * 0.55), ly + 0.06], [s * (span * 0.5), ly - 0.04], [s * (span - 0.04), ly - 0.06]], true, 0.25);
        P.fill(lamp, '#3a0508');
        P.fill(smoothPath([[s * (span - 0.06), ly + 0.045], [s * (span * 0.58), ly + 0.04], [s * (span * 0.56), ly - 0.02], [s * (span - 0.07), ly - 0.035]], true, 0.25), '#d4141c', { glow: '#ff2a2a' });
        P.fill(crect(s * (span * 0.66), ly, 0.07, 0.04, 0.01), '#f2f2f2', { glow: '#888' });
      });
    } else if (style === 'bar') {
      P.fill(crect(0, ly, span * 2 - 0.04, 0.07, 0.03), '#3a0508');
      P.fill(crect(0, ly, span * 2 - 0.08, 0.03, 0.015), '#e0161e', { glow: '#ff2a2a' });
    } else if (style === 'round') {
      both((s) => {
        for (const k of st.quad ? [0, 1] : [0]) {
          const cx = s * (span * 0.72 - k * 0.2);
          P.fill(circle(cx, ly, 0.08), CHROME, { metal: 1 });
          P.fill(circle(cx, ly, 0.068), '#d4141c', { glow: '#ff3030' });
          P.fill(circle(cx, ly, 0.028), '#ff8a8a', { glow: '#ff9a9a' });
        }
      });
    } else if (style === 'vertical') {
      both((s) => {
        P.fill(crect(s * (span - 0.06), bot + H * 0.62, 0.1, H * 0.5, 0.04), '#3a0508');
        P.fill(crect(s * (span - 0.06), bot + H * 0.72, 0.07, H * 0.22, 0.03), '#d4141c', { glow: '#ff3030' });
        P.fill(crect(s * (span - 0.06), bot + H * 0.5, 0.07, H * 0.1, 0.03), '#ffb347', { glow: '#ff9a1a' });
      });
    }
    if (st.badge) P.text(st.badge, 0, ly - 0.1, 0.045, '#cfd3d9', { metal: 1, font: 'Arial, sans-serif', weight: '700' });
    plate(P, 0, bot + H * (st.plateY ?? 0.38), st.plateText || o.plate || 'CT 2010', { w: 0.5, h: 0.11, bandText: st.band ?? 'CT' });
    P.fill(rrect(-span, bot - 0.04, span * 2, H * 0.22, 0.04), st.bumper || SATIN_BLACK);
    if (st.chromeBumper) P.fill(crect(0, bot + H * 0.12, span * 1.9, 0.06, 0.03), CHROME, { metal: 1 });
  };
}

/**
 * o: archetype parameters. Returns a complete v2 model spec.
 */
export function makeArchetype(o) {
  const body = curves(o);
  const pillarBody = o.pillarColor === 'body';
  return {
    id: o.id,
    v2: true,
    name: o.name,
    brand: o.brand || 'Car Town',
    class: o.class,
    electric: !!o.electric,
    scale: o.scale ?? 0.6,
    key: { cowl: o.cowl, roofFront: o.roofFront, roofRear: o.roofRear, rearBase: o.rearBase },
    body,
    wheelDef: { style: o.rim || 'spoke5', rimRatio: o.rimRatio ?? 0.66, rimColor: o.colors?.rim || '#c9ccd1', accent: o.rimAccent || null, caliper: o.colors?.caliper || null },
    colors: o.colors,
    parts: o.parts || { mirrors: 'body' },
    stats: o.stats,
    price: o.price,
    level: o.level,
    blurb: o.blurb,
    draw: {
      side: sideArt(o),
      front: frontArt(o),
      rear: rearArt(o),
      windshield(P, c, proj) {
        glassPanel(P, proj.length, c.fn.beltWidthAt(c.key.cowl) - 0.1, c.fn.roofWidthAt(c.key.roofFront) - 0.07, { color: pillarBody ? 'rgba(0,0,0,0)' : GLOSS_BLACK });
      },
      backlight(P, c, proj) {
        const wb = c.fn.beltWidthAt(c.key.rearBase) - 0.12;
        glassPanel(P, proj.length, wb, Math.max(0.3, wb - 0.06), { frit: 0.04, color: pillarBody ? 'rgba(0,0,0,0)' : GLOSS_BLACK });
      },
      top: o.top || (() => {}),
    },
  };
}

export { GLOSS_BLACK, SATIN_BLACK, CHROME, roundedPoly, rrect, crect, circle, line, smoothPath as smoothPathLocal };
