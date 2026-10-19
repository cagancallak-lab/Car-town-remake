// The rest of the Car Town line-up, rebuilt as realistic (v2) cars from
// body-type archetypes with real-world dimensions (metres).

import { makeArchetype, SATIN_BLACK, crect, rrect, line, smoothPathLocal } from './archetypes.js';

export const GENERIC_V2 = [
  makeArchetype({
    id: 'hatch', name: 'City Hatch', class: 'Compact', type: 'hatch', doors: 4,
    L: 4.05, W: 1.75, wheelbase: 2.55, fOver: 0.82, r: 0.31, tw: 0.2, clearance: 0.14,
    noseY: 0.78, hoodY: 0.95, cowl: 0.85, roofFront: -0.05, roofY: 1.46, roofRear: -1.55, roofRearY: 1.42, rearBase: -1.92,
    tailY: 1.0, beltY: 0.95, beltRear: 1.0, noseBottom: 0.3, tailBottom: 0.36,
    front: { style: 'modern' }, rear: { style: 'pair' }, rim: 'spoke5',
    colors: { paint: '#d9262b', finish: 'gloss', rim: '#c9ccd1' },
    parts: { mirrors: 'body', fin: true, spoiler: 'roof', spoilerColor: 'paint', exhaust: 1 },
    stats: { hp: 110, kg: 1050, grip: 0.95, gears: 5, redline: 7000 },
    price: 4500, level: 1, plate: 'CT 2010',
    blurb: 'Every Car Town career starts here. Cheap, cheerful and easy to park.',
  }),
  makeArchetype({
    id: 'sedan', name: 'Family Sedan', class: 'Sedan', type: 'sedan', doors: 4,
    L: 4.85, W: 1.84, wheelbase: 2.82, fOver: 0.95, r: 0.335, tw: 0.22, clearance: 0.14,
    noseY: 0.8, hoodY: 0.98, cowl: 0.95, roofFront: 0.05, roofY: 1.44, roofRear: -1.05, roofRearY: 1.4, rearBase: -1.75,
    deckY: 1.02, beltY: 0.97, beltRear: 1.02, noseBottom: 0.3, tailBottom: 0.36,
    front: { style: 'modern', chromeBar: true }, rear: { style: 'pair' }, rim: 'multi',
    colors: { paint: '#2f5fb8', finish: 'metallic', rim: '#c9ccd1' },
    parts: { mirrors: 'body', fin: true, exhaust: 2 },
    stats: { hp: 180, kg: 1400, grip: 1.0, gears: 6, redline: 6800 },
    price: 9000, level: 2,
    blurb: 'Comfortable four-door with room for the whole crew.',
  }),
  makeArchetype({
    id: 'muscle', name: "Muscle '69", class: 'Muscle', type: 'coupe', doors: 2,
    L: 4.75, W: 1.86, wheelbase: 2.75, fOver: 0.9, r: 0.34, tw: 0.26, clearance: 0.13,
    noseY: 0.82, hoodY: 0.92, cowl: 0.7, roofFront: -0.05, roofY: 1.32, roofRear: -0.85, roofRearY: 1.27, rearBase: -1.5,
    deckY: 0.95, beltY: 0.9, beltRear: 0.93, noseBottom: 0.28, tailBottom: 0.32, noseRound: 0.12, noseExp: 6, noseDepth: 0.3, tailExp: 6, tailDepth: 0.25,
    noseRake: { depth: 0.3, y0: 0.3, y1: 0.82, amount: -0.04 }, tumble: 0.06, roofTumble: 0.24, pillarColor: 'body', chromeDLO: true,
    front: { style: 'classic', badge: 'SS' }, rear: { style: 'round', quad: true, chromeBumper: true, bumper: 'rgba(0,0,0,0)' }, rim: 'classic',
    colors: { paint: '#e46b17', finish: 'gloss', rim: '#cfd2d6', livery: 'stripes', liveryColor: '#111111' },
    parts: { mirrors: 'chrome', hoodScoop: true, exhaust: 2 },
    stats: { hp: 420, kg: 1600, grip: 0.92, gears: 4, redline: 6500 },
    price: 32000, level: 5, plate: 'MUSCLE',
    blurb: 'Big block V8, long hood, short deck. Lays down rubber at every light.',
  }),
  makeArchetype({
    id: 'pickup', name: 'Ranch Pickup', class: 'Truck', type: 'pickup', doors: 4,
    L: 5.6, W: 2.0, wheelbase: 3.6, fOver: 0.95, r: 0.41, tw: 0.3, clearance: 0.22,
    noseY: 1.18, hoodY: 1.28, cowl: 0.95, roofFront: 0.2, roofY: 1.92, roofRear: -0.95, roofRearY: 1.9, rearBase: -1.0,
    bedY: 1.22, beltY: 1.3, beltRear: 1.32, noseBottom: 0.42, tailBottom: 0.52, noseRound: 0.1, noseExp: 8, noseDepth: 0.3, tailExp: 10, tailDepth: 0.15,
    tumble: 0.05, roofTumble: 0.16, flare: 0.04,
    front: { style: 'truck', plateY: 0.17 }, rear: { style: 'vertical', chromeBumper: true }, rim: 'dish', handle: '#c9ccd1',
    colors: { paint: '#f08c1c', finish: 'gloss', rim: '#d0d3d8' },
    parts: { mirrors: 'chrome', bed: true, exhaust: 1 },
    top(P, c) {
      const half = c.b.length / 2;
      const x0 = c.key.rearBase - 0.12;
      const x1 = -half + 0.1;
      const w = c.fn.widthAt((x0 + x1) / 2) - 0.1;
      P.fill(rrect(x1, -w, x0 - x1, w * 2, 0.04), '#1d1e22');
      for (let i = -4; i <= 4; i++) P.fill(crect((x0 + x1) / 2, (i / 4) * (w - 0.08), x0 - x1 - 0.06, 0.04, 0.02), '#2c2e33');
    },
    stats: { hp: 360, kg: 2200, grip: 0.9, gears: 6, redline: 6000 },
    price: 22000, level: 4, plate: 'RANCH 1',
    blurb: 'Hauls hay bales by day and drag-strip trophies by night.',
  }),
  makeArchetype({
    id: 'van', name: 'Camper Van', class: 'Van', type: 'van', doors: 4, electric: true,
    L: 4.7, W: 1.98, wheelbase: 2.99, fOver: 0.82, r: 0.36, tw: 0.24, clearance: 0.15,
    noseY: 1.0, hoodY: 1.1, cowl: 1.5, roofFront: 0.82, roofY: 1.92, roofRear: -2.0, roofRearY: 1.88, rearBase: -2.25,
    tailY: 1.15, beltY: 1.08, beltRear: 1.12, noseBottom: 0.3, tailBottom: 0.38, noseRound: 0.2, noseExp: 3, noseDepth: 0.5, tailExp: 5, tailDepth: 0.25,
    noseRake: { depth: 0.5, y0: 0.35, y1: 1.05, amount: 0.12 }, roofTumble: 0.17, roofEdge: 0.1,
    front: { style: 'van' }, rear: { style: 'vertical' }, rim: 'aero',
    colors: { paint: '#f2b705', roof: '#f3f1ea', finish: 'gloss', rim: '#e7e8ea' },
    sideArt(P, c, g) {
      // two-tone: light upper body like the classic microbus
      const pts = [];
      for (let i = 0; i <= 30; i++) {
        const x = -c.b.length / 2 + (c.b.length * i) / 30;
        pts.push([x, Math.min(c.fn.beltAt(x) - 0.06, c.fn.roofAt(x))]);
      }
      const p = new Path2D();
      pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
      p.lineTo(c.b.length / 2, 3);
      p.lineTo(-c.b.length / 2, 3);
      p.closePath();
      P.roof(p);
      for (const w of g.windows) P.glass(w);
    },
    top(P, c) { P.roof(rrect(-c.b.length / 2, -1.2, c.b.length, 2.4, 0)); },
    parts: { mirrors: 'black', fin: true },
    stats: { hp: 280, kg: 2400, grip: 0.9, gears: 4, redline: 9000 },
    price: 15000, level: 3, plate: 'SURF 77',
    blurb: 'Two-tone electric microbus. Every road trip ends with a story.',
  }),
  makeArchetype({
    id: 'taxi', name: 'Yellow Cab', class: 'Taxi', type: 'sedan', doors: 4,
    L: 4.85, W: 1.84, wheelbase: 2.82, fOver: 0.95, r: 0.335, tw: 0.22, clearance: 0.14,
    noseY: 0.8, hoodY: 0.98, cowl: 0.95, roofFront: 0.05, roofY: 1.44, roofRear: -1.05, roofRearY: 1.4, rearBase: -1.75,
    deckY: 1.02, beltY: 0.97, beltRear: 1.02, noseBottom: 0.3, tailBottom: 0.36,
    front: { style: 'modern', chromeBar: true, plateText: 'TAXI 7' }, rear: { style: 'pair', plateText: 'TAXI 7' }, rim: 'steel',
    colors: { paint: '#f7c51e', finish: 'gloss', rim: '#cfd2d6', livery: 'checker', liveryColor: '#111111' },
    parts: { mirrors: 'body', taxiSign: true, exhaust: 1 },
    stats: { hp: 200, kg: 1500, grip: 0.95, gears: 6, redline: 6500 },
    price: 12000, level: 2,
    blurb: 'Off duty and ready to race. Comes with a genuine rooftop light.',
  }),
  makeArchetype({
    id: 'police', name: 'Police Cruiser', class: 'Police', type: 'sedan', doors: 4,
    L: 5.05, W: 1.9, wheelbase: 3.05, fOver: 0.98, r: 0.35, tw: 0.24, clearance: 0.14,
    noseY: 0.82, hoodY: 1.0, cowl: 0.95, roofFront: 0.0, roofY: 1.48, roofRear: -1.15, roofRearY: 1.44, rearBase: -1.85,
    deckY: 1.04, beltY: 1.0, beltRear: 1.05, noseBottom: 0.3, tailBottom: 0.36,
    front: { style: 'police', plateText: 'POLICE' }, rear: { style: 'bar', plateText: 'POLICE' }, rim: 'steel',
    colors: { paint: '#16171b', finish: 'gloss', rim: '#cfd2d6', livery: 'police', liveryColor: '#f4f4f4' },
    parts: { mirrors: 'black', lightBar: true, pushBar: true, exhaust: 2 },
    stats: { hp: 380, kg: 1800, grip: 1.0, gears: 6, redline: 6500 },
    price: 45000, level: 6,
    blurb: 'Retired interceptor. The siren still works (please do not tell anyone).',
  }),
  makeArchetype({
    id: 'coupe', name: 'GT Coupe', class: 'Sports', type: 'coupe', doors: 2,
    L: 4.65, W: 1.9, wheelbase: 2.75, fOver: 0.88, r: 0.345, tw: 0.27, clearance: 0.12,
    noseY: 0.72, hoodY: 0.9, cowl: 0.6, roofFront: -0.25, roofY: 1.32, roofRear: -1.05, roofRearY: 1.27, rearBase: -1.75,
    deckY: 0.98, beltY: 0.9, beltRear: 0.95, noseBottom: 0.25, tailBottom: 0.32, flare: 0.04, tumble: 0.09, roofTumble: 0.26,
    hoodRidge: { profile: [[0.7, 0], [0.9, 0.012], [1.9, 0.012], [2.2, 0]], z: [0.4], w: 0.08 },
    front: { style: 'modern' }, rear: { style: 'bar' }, rim: 'spoke5', rimRatio: 0.7,
    colors: { paint: '#1e9e4a', finish: 'metallic', rim: '#2b2d31', caliper: '#d61b1b' },
    parts: { mirrors: 'body', fin: true, spoiler: 'lip', spoilerColor: 'paint', exhaust: 2 },
    stats: { hp: 400, kg: 1450, grip: 1.12, gears: 6, redline: 7800 },
    price: 52000, level: 7,
    blurb: 'Front-engined grand tourer with a fastback roof and a howling straight-six.',
  }),
  makeArchetype({
    id: 'super', name: 'Wedge Supercar', class: 'Supercar', type: 'super', doors: 2,
    L: 4.6, W: 2.03, wheelbase: 2.7, fOver: 1.05, r: 0.34, tw: 0.3, clearance: 0.11,
    noseY: 0.6, hoodY: 0.84, cowl: 0.95, roofFront: -0.15, roofY: 1.14, roofRear: -0.75, roofRearY: 1.1, rearBase: -1.95,
    deckY: 0.95, beltY: 0.8, beltRear: 0.95, noseBottom: 0.22, tailBottom: 0.3, noseRound: 0.1, noseDepth: 0.6, noseExp: 2.3, tailExp: 5,
    noseRake: { depth: 0.6, y0: 0.25, y1: 0.64, amount: 0.12 }, flare: 0.05, tumble: 0.12, roofTumble: 0.36, rLow: 0.08,
    fenderHump: { front: 0.08, rear: 0.1, spread: 2.0 },
    sideArt(P, c) {
      // side air intake behind the door
      const x = -0.85;
      const y = 0.68;
      P.fill(smoothPathLocal([[x + 0.25, y + 0.1], [x - 0.35, y + 0.12], [x - 0.42, y - 0.08], [x + 0.05, y - 0.06]]), '#0b0c0f');
    },
    front: { style: 'super', plate: false }, rear: { style: 'bar', lightY: 0.75 }, rim: 'turbine', rimRatio: 0.72,
    colors: { paint: '#7a3fd0', finish: 'pearl', rim: '#1d1e22', caliper: '#f2c21b' },
    parts: { mirrors: 'body', spoiler: 'wing', exhaust: 4 },
    stats: { hp: 780, kg: 1450, grip: 1.25, gears: 7, redline: 9000 },
    price: 210000, level: 12, plate: 'V12',
    blurb: 'Scissor doors, V12 scream and the reason the town installed speed bumps.',
  }),
  makeArchetype({
    id: 'offroad', name: 'Trail 4x4', class: 'Off-road', type: 'offroad', doors: 4,
    L: 4.5, W: 2.0, wheelbase: 2.9, fOver: 0.75, r: 0.4, tw: 0.3, clearance: 0.25,
    noseY: 1.12, hoodY: 1.2, cowl: 0.75, roofFront: 0.42, roofY: 1.95, roofRear: -2.0, roofRearY: 1.93, rearBase: -2.15,
    tailY: 1.22, beltY: 1.22, beltRear: 1.24, noseBottom: 0.45, tailBottom: 0.52, noseRound: 0.08, noseExp: 8, noseDepth: 0.28, tailExp: 10, tailDepth: 0.15,
    noseRake: { depth: 0.28, y0: 0.5, y1: 1.1, amount: 0.02 }, tumble: 0.04, roofTumble: 0.12, roofEdge: 0.05, flare: 0.05, cladding: true, archTrim: true,
    front: { style: 'offroad', plateY: 0.1 }, rear: { style: 'vertical' }, rim: 'dish',
    colors: { paint: '#5f7d3a', finish: 'matte', rim: '#1d1e22' },
    parts: { mirrors: 'black', roofRails: true, spareWheel: true },
    top(P, c) { P.fill(rrect(-c.b.length / 2 + 0.3, -0.62, c.b.length - 1.0, 1.24, 0.06), '#1e2024'); },
    stats: { hp: 290, kg: 2100, grip: 0.95, gears: 6, redline: 6200 },
    price: 28000, level: 4, plate: 'TRAIL',
    blurb: 'Boxy, unbreakable and ready for the dirt road to the lake.',
  }),
  makeArchetype({
    id: 'beetle', name: 'Retro Bug', class: 'Classic', type: 'beetle', doors: 2,
    L: 4.1, W: 1.65, wheelbase: 2.42, fOver: 0.75, r: 0.33, tw: 0.2, clearance: 0.15,
    noseY: 0.8, hoodY: 0.95, cowl: 0.62, roofFront: 0.1, roofY: 1.5, roofRear: -0.6, roofRearY: 1.46, rearBase: -1.1,
    tailY: 0.95, beltY: 0.93, beltRear: 0.95, noseBottom: 0.32, tailBottom: 0.38, noseRound: 0.24, tailRound: 0.34,
    noseDepth: 0.75, noseExp: 2.2, tailDepth: 0.85, tailExp: 2.2, flare: 0.07, roofTumble: 0.3, roofEdge: 0.13, tumble: 0.09,
    noseRake: { depth: 0.7, y0: 0.35, y1: 0.82, amount: 0.1 }, pillarColor: 'body', chromeDLO: true,
    fenderHump: { front: 0.12, rear: 0.1, spread: 1.9 },
    front: { style: 'round', plateText: 'BUG-71' }, rear: { style: 'round', chromeBumper: true, bumper: 'rgba(0,0,0,0)', plateText: 'BUG-71' }, rim: 'steel',
    colors: { paint: '#8fd3e8', finish: 'gloss', rim: '#e7e8ea' },
    parts: { mirrors: 'chrome', exhaust: 2 },
    stats: { hp: 60, kg: 800, grip: 0.85, gears: 4, redline: 5500 },
    price: 6000, level: 1,
    blurb: 'Round, friendly and air-cooled. Everybody waves at the Bug.',
  }),
  makeArchetype({
    id: 'rally', name: 'Rally Hatch', class: 'Hot Hatch', type: 'hatch', doors: 2,
    L: 4.0, W: 1.81, wheelbase: 2.56, fOver: 0.78, r: 0.33, tw: 0.25, clearance: 0.13,
    noseY: 0.78, hoodY: 0.95, cowl: 0.85, roofFront: 0.0, roofY: 1.42, roofRear: -1.4, roofRearY: 1.36, rearBase: -1.85,
    tailY: 1.0, beltY: 0.95, beltRear: 1.0, noseBottom: 0.28, tailBottom: 0.34, flare: 0.055,
    front: { style: 'modern' }, rear: { style: 'bar' }, rim: 'mesh', rimRatio: 0.68,
    colors: { paint: '#f4f6f8', finish: 'gloss', rim: '#e3b51a', caliper: '#d61b1b', livery: 'number', liveryColor: '#1450c8' },
    parts: { mirrors: 'body', fin: true, spoiler: 'roof', spoilerColor: 'black', mudflaps: true, exhaust: 2 },
    stats: { hp: 300, kg: 1250, grip: 1.15, gears: 6, redline: 7500 },
    price: 26000, level: 5, plate: 'WRC 1',
    blurb: 'Turbocharged, all-wheel-drive and covered in sponsor stickers.',
  }),
  makeArchetype({
    id: 'suv', name: 'Urban SUV', class: 'SUV', type: 'suv', doors: 4,
    L: 4.6, W: 1.86, wheelbase: 2.69, fOver: 0.95, r: 0.355, tw: 0.24, clearance: 0.19,
    noseY: 0.95, hoodY: 1.1, cowl: 0.95, roofFront: 0.1, roofY: 1.68, roofRear: -1.7, roofRearY: 1.62, rearBase: -2.1,
    tailY: 1.15, beltY: 1.1, beltRear: 1.15, noseBottom: 0.36, tailBottom: 0.42, cladding: true, archTrim: true,
    front: { style: 'modern' }, rear: { style: 'vertical' }, rim: 'spoke5',
    colors: { paint: '#4a4f57', finish: 'metallic', rim: '#c9ccd1' },
    parts: { mirrors: 'black', roofRails: true, fin: true, spoiler: 'roof', spoilerColor: 'paint' },
    stats: { hp: 260, kg: 1800, grip: 0.98, gears: 8, redline: 6500 },
    price: 24000, level: 3,
    blurb: 'High seating, big boot, and a surprising turn of speed.',
  }),
];

void SATIN_BLACK;
void line;
