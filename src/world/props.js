// Procedural props: garage equipment & decorations, street furniture, trees.
// Each garage item builder returns a Group centred on its footprint with the
// floor at y = 0. Service stations face +x (cars enter from +x and park
// nose -x); decorations face +z.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { posterTexture, signTexture, billboardTexture, radialTexture } from './textures.js';
import { ITEMS } from '../game/catalog.js';

const matCache = new Map();
export function mat(color, { rough = 0.55, metal = 0, emissive = null, ei = 1, map = null, transparent = false, opacity = 1, side } = {}) {
  const key = `${color}|${rough}|${metal}|${emissive}|${ei}|${map?.uuid}|${opacity}|${side}`;
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, map, transparent: transparent || opacity < 1, opacity });
  if (side) m.side = side;
  if (emissive) {
    m.emissive = new THREE.Color(emissive);
    m.emissiveIntensity = ei;
  }
  matCache.set(key, m);
  return m;
}

const geoCache = new Map();
function rbox(w, h, d, r = 0.04) {
  const key = `rb:${w}:${h}:${d}:${r}`;
  if (!geoCache.has(key)) geoCache.set(key, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2) * 0.999));
  return geoCache.get(key);
}
function cyl(rt, rb, h, seg = 16) {
  const key = `cy:${rt}:${rb}:${h}:${seg}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.CylinderGeometry(rt, rb, h, seg));
  return geoCache.get(key);
}
function sph(r, seg = 16) {
  const key = `sp:${r}:${seg}`;
  if (!geoCache.has(key)) geoCache.set(key, new THREE.SphereGeometry(r, seg, Math.max(6, seg / 2)));
  return geoCache.get(key);
}

export function box(group, w, h, d, material, x = 0, y = 0, z = 0, r = 0.04) {
  const m = new THREE.Mesh(rbox(w, h, d, r), material);
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  return m;
}
export function cylinder(group, rt, rb, h, material, x = 0, y = 0, z = 0, seg = 16) {
  const m = new THREE.Mesh(cyl(rt, rb, h, seg), material);
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  return m;
}
export function sphere(group, r, material, x = 0, y = 0, z = 0, seg = 16) {
  const m = new THREE.Mesh(sph(r, seg), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  group.add(m);
  return m;
}
function plane(group, w, h, material, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  group.add(m);
  return m;
}

const C = {
  red: () => mat('#d9262b', { rough: 0.35 }),
  darkRed: () => mat('#9b1418', { rough: 0.4 }),
  black: () => mat('#1d1e22', { rough: 0.5 }),
  steel: () => mat('#9aa0a8', { rough: 0.3, metal: 0.8 }),
  chrome: () => mat('#e2e5ea', { rough: 0.12, metal: 1 }),
  yellow: () => mat('#f2c21b', { rough: 0.45 }),
  white: () => mat('#f2f2f0', { rough: 0.5 }),
  wood: () => mat('#a8743f', { rough: 0.7 }),
  blue: () => mat('#2f6fd6', { rough: 0.4 }),
  green: () => mat('#3aa04a', { rough: 0.7 }),
  rubber: () => mat('#18181a', { rough: 0.9 }),
  gray: () => mat('#5b5f66', { rough: 0.6 }),
};

// --- Service stations ------------------------------------------------------------------

function lift() {
  const g = new THREE.Group();
  // floor plate with yellow/black hazard edges
  box(g, 2.8, 0.04, 1.84, C.gray(), 0, 0, 0, 0.02);
  for (const s of [1, -1]) box(g, 2.6, 0.03, 0.12, C.yellow(), 0, 0.04, s * 0.84, 0.01);
  // posts (two per side, red like the original)
  for (const sx of [0.95, -0.95]) {
    for (const sz of [1, -1]) {
      box(g, 0.16, 1.7, 0.16, C.red(), sx, 0, sz * 0.9, 0.03);
      box(g, 0.22, 0.08, 0.22, C.darkRed(), sx, 1.7, sz * 0.9, 0.02);
    }
  }
  // overhead beam on each side
  for (const sz of [1, -1]) box(g, 2.1, 0.1, 0.14, C.darkRed(), 0, 1.62, sz * 0.9, 0.03);
  // platform that rises with the car
  const platform = new THREE.Group();
  for (const sz of [0.38, -0.38]) box(platform, 2.3, 0.07, 0.3, C.black(), 0, 0, sz, 0.02);
  g.add(platform);
  g.userData.platform = platform;
  // little control box
  box(g, 0.14, 0.4, 0.1, C.yellow(), 1.15, 0.5, 1.0, 0.02);
  return g;
}

function washbay() {
  const g = new THREE.Group();
  box(g, 2.8, 0.04, 1.84, mat('#7fc6e8', { rough: 0.3 }), 0, 0, 0, 0.02);
  const frameM = mat('#2f8be0', { rough: 0.35 });
  for (const sx of [1.0, -1.0]) {
    for (const sz of [1, -1]) box(g, 0.14, 2.1, 0.14, frameM, sx, 0, sz * 0.9, 0.03);
    box(g, 0.16, 0.16, 1.96, frameM, sx, 2.0, 0, 0.04);
  }
  box(g, 2.16, 0.12, 0.16, frameM, 0, 2.02, 0.9, 0.04);
  box(g, 2.16, 0.12, 0.16, frameM, 0, 2.02, -0.9, 0.04);
  // spinning brushes
  const brushes = [];
  const bm = mat('#ff4fa0', { rough: 0.9 });
  for (const sz of [0.72, -0.72]) {
    const b = cylinder(g, 0.18, 0.18, 1.5, bm, 0.2, 0.3, sz, 12);
    brushes.push(b);
  }
  g.userData.brushes = brushes;
  const sign = signTexture('wash', 'WASH', { bg: '#2f8be0', w: 256, h: 96 });
  const s = plane(g, 0.9, 0.34, new THREE.MeshStandardMaterial({ map: sign, roughness: 0.4 }), 1.09, 2.0, 0, Math.PI / 2);
  s.position.x = 1.09;
  return g;
}

function paintbooth() {
  const g = new THREE.Group();
  box(g, 2.8, 0.04, 1.84, mat('#d9d9d9', { rough: 0.6 }), 0, 0, 0, 0.02);
  const frameM = mat('#3a3d44', { rough: 0.4, metal: 0.4 });
  const glass = mat('#bfe3ff', { rough: 0.05, metal: 0.1, opacity: 0.28 });
  for (const sx of [1.3, -1.3]) for (const sz of [0.9, -0.9]) box(g, 0.1, 2.0, 0.1, frameM, sx, 0, sz, 0.02);
  box(g, 2.7, 0.12, 1.9, frameM, 0, 2.0, 0, 0.04);
  for (const sz of [0.9, -0.9]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.9), glass);
    w.position.set(0, 1.0, sz);
    g.add(w);
  }
  const back = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.9), glass);
  back.rotation.y = Math.PI / 2;
  back.position.set(-1.3, 1.0, 0);
  g.add(back);
  // spray gun robot arm
  box(g, 0.16, 1.3, 0.16, C.yellow(), -1.15, 0, 0.75, 0.03);
  box(g, 0.6, 0.1, 0.1, C.yellow(), -0.9, 1.25, 0.75, 0.03);
  const lamp = mat('#fffbe8', { emissive: '#fff6d0', ei: 1.2 });
  box(g, 2.2, 0.05, 0.2, lamp, 0, 1.93, 0, 0.02);
  return g;
}

// --- Decorations ----------------------------------------------------------------------

function toolchest() {
  const g = new THREE.Group();
  box(g, 0.75, 0.9, 0.5, C.red(), 0, 0.08, 0, 0.05);
  box(g, 0.68, 0.36, 0.46, C.red(), 0, 0.98, -0.02, 0.05);
  for (let i = 0; i < 5; i++) box(g, 0.66, 0.012, 0.02, C.chrome(), 0, 0.22 + i * 0.16, 0.255, 0.004);
  for (const sx of [0.3, -0.3]) for (const sz of [0.18, -0.18]) cylinder(g, 0.05, 0.05, 0.08, C.black(), sx, 0, sz, 10);
  return g;
}

function tirerack() {
  const g = new THREE.Group();
  const frame = C.steel();
  for (const sx of [0.9, -0.9]) box(g, 0.06, 1.4, 0.5, frame, sx, 0, 0, 0.02);
  for (const y of [0.05, 0.7]) box(g, 1.86, 0.04, 0.5, frame, 0, y, 0, 0.01);
  const tire = new THREE.TorusGeometry(0.2, 0.09, 10, 20);
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 5; i++) {
      const t = new THREE.Mesh(tire, C.rubber());
      t.position.set(-0.7 + i * 0.35, 0.36 + row * 0.65, 0);
      t.rotation.y = 0.15;
      t.castShadow = true;
      g.add(t);
    }
  }
  return g;
}

function workbench() {
  const g = new THREE.Group();
  box(g, 1.8, 0.08, 0.7, C.wood(), 0, 0.78, 0, 0.02);
  for (const sx of [0.8, -0.8]) for (const sz of [0.28, -0.28]) box(g, 0.08, 0.78, 0.08, C.gray(), sx, 0, sz, 0.02);
  box(g, 1.7, 0.04, 0.6, C.gray(), 0, 0.25, 0, 0.01);
  box(g, 0.3, 0.18, 0.2, C.blue(), -0.5, 0.86, 0, 0.03);
  box(g, 0.25, 0.12, 0.15, C.red(), 0.4, 0.86, 0.1, 0.03);
  // pegboard
  box(g, 1.8, 0.9, 0.05, mat('#c8a46a', { rough: 0.8 }), 0, 0.9, -0.33, 0.01);
  return g;
}

function desk() {
  const g = new THREE.Group();
  box(g, 1.7, 0.08, 0.8, mat('#e9e4da', { rough: 0.5 }), 0, 0.72, 0, 0.03);
  box(g, 0.5, 0.72, 0.76, mat('#7a8088', { rough: 0.5 }), -0.58, 0, 0, 0.03);
  box(g, 0.06, 0.72, 0.7, mat('#7a8088', { rough: 0.5 }), 0.8, 0, 0, 0.02);
  // computer
  box(g, 0.56, 0.38, 0.05, C.black(), 0.15, 0.95, -0.2, 0.03);
  const screen = mat('#5fb3ff', { emissive: '#3a8dff', ei: 0.7 });
  const s = box(g, 0.5, 0.31, 0.01, screen, 0.15, 0.985, -0.172, 0.005);
  s.castShadow = false;
  box(g, 0.08, 0.2, 0.05, C.black(), 0.15, 0.78, -0.22, 0.02);
  box(g, 0.4, 0.02, 0.14, mat('#d0d3d8'), 0.15, 0.8, 0.1, 0.01);
  // chair
  box(g, 0.44, 0.08, 0.44, C.blue(), 0.15, 0.45, 0.55, 0.05);
  box(g, 0.44, 0.5, 0.08, C.blue(), 0.15, 0.53, 0.76, 0.04);
  cylinder(g, 0.04, 0.04, 0.42, C.steel(), 0.15, 0.03, 0.55, 8);
  cylinder(g, 0.22, 0.22, 0.04, C.black(), 0.15, 0, 0.55, 12);
  return g;
}

function compressor() {
  const g = new THREE.Group();
  const tank = cylinder(g, 0.22, 0.22, 0.75, C.red(), 0, 0.12, 0, 16);
  tank.rotation.z = Math.PI / 2;
  tank.position.y = 0.34;
  box(g, 0.3, 0.22, 0.26, C.black(), 0, 0.5, 0, 0.04);
  for (const sx of [0.25, -0.25]) cylinder(g, 0.07, 0.07, 0.05, C.rubber(), sx, 0, 0.18, 10);
  return g;
}

function barrels() {
  const g = new THREE.Group();
  const cols = ['#2f6fd6', '#d9262b', '#2f6fd6'];
  const pos = [[-0.2, -0.18], [0.22, -0.15], [0.0, 0.22]];
  pos.forEach(([x, z], i) => {
    cylinder(g, 0.2, 0.2, 0.62, mat(cols[i], { rough: 0.4, metal: 0.3 }), x, 0, z, 16);
    for (const y of [0.15, 0.45]) cylinder(g, 0.205, 0.205, 0.03, C.gray(), x, y, z, 16);
  });
  return g;
}

function cones() {
  const g = new THREE.Group();
  const o = mat('#ff6a1a', { rough: 0.5 });
  [[-0.2, -0.15], [0.2, -0.1], [0.0, 0.22]].forEach(([x, z]) => {
    box(g, 0.32, 0.04, 0.32, o, x, 0, z, 0.02);
    cylinder(g, 0.03, 0.13, 0.42, o, x, 0.04, z, 14);
    cylinder(g, 0.082, 0.1, 0.07, C.white(), x, 0.2, z, 14);
  });
  return g;
}

function plant() {
  const g = new THREE.Group();
  cylinder(g, 0.24, 0.18, 0.36, mat('#c1653b', { rough: 0.8 }), 0, 0, 0, 14);
  const leaf = mat('#3fae4f', { rough: 0.8 });
  sphere(g, 0.3, leaf, 0, 0.62, 0, 12);
  sphere(g, 0.22, leaf, 0.15, 0.5, 0.1, 10);
  sphere(g, 0.22, leaf, -0.14, 0.52, -0.08, 10);
  sphere(g, 0.18, mat('#5cc964', { rough: 0.8 }), 0.02, 0.86, 0.04, 10);
  return g;
}

function stopsign() {
  const g = new THREE.Group();
  cylinder(g, 0.18, 0.2, 0.06, C.gray(), 0, 0, 0, 12);
  cylinder(g, 0.03, 0.03, 1.5, C.steel(), 0, 0.05, 0, 8);
  const tex = signTexture('stop', 'STOP', { bg: '#d9262b', w: 128, h: 128 });
  const oct = new THREE.CircleGeometry(0.3, 8);
  oct.rotateZ(Math.PI / 8);
  for (const ry of [0, Math.PI]) {
    const m = new THREE.Mesh(oct, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }));
    m.position.set(0, 1.45, ry ? -0.02 : 0.02);
    m.rotation.y = ry;
    m.castShadow = true;
    g.add(m);
  }
  return g;
}

function flag() {
  const g = new THREE.Group();
  cylinder(g, 0.15, 0.18, 0.08, C.gray(), 0, 0, 0, 12);
  cylinder(g, 0.025, 0.025, 2.2, C.chrome(), 0, 0.05, 0, 8);
  const tex = signTexture('checker', '', { bg: '#fff', w: 128, h: 96 });
  const c = document.createElement('canvas');
  c.width = 128; c.height = 96;
  const ctx = c.getContext('2d');
  for (let y = 0; y < 6; y++) for (let x = 0; x < 8; x++) { ctx.fillStyle = (x + y) % 2 ? '#111' : '#fff'; ctx.fillRect(x * 16, y * 16, 16, 16); }
  const t2 = new THREE.CanvasTexture(c);
  t2.colorSpace = THREE.SRGBColorSpace;
  void tex;
  const geo = new THREE.PlaneGeometry(0.9, 0.6, 12, 1);
  const f = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t2, side: THREE.DoubleSide, roughness: 0.7 }));
  f.position.set(0.47, 1.95, 0);
  f.castShadow = true;
  g.add(f);
  g.userData.flag = f;
  return g;
}

function xmastree() {
  const g = new THREE.Group();
  cylinder(g, 0.22, 0.26, 0.2, C.red(), 0, 0, 0, 12);
  cylinder(g, 0.06, 0.06, 0.2, mat('#6b4a2b'), 0, 0.2, 0, 8);
  const green = mat('#1f8a3d', { rough: 0.8 });
  const cones = [[0.55, 0.6, 0.35], [0.44, 0.5, 0.75], [0.32, 0.45, 1.1]];
  for (const [r, h, y] of cones) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 14), green);
    m.position.y = y + h / 2 - 0.1;
    m.castShadow = true;
    g.add(m);
  }
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), mat('#ffd21a', { emissive: '#ffcc00', ei: 0.8 }));
  star.position.y = 1.62;
  g.add(star);
  const cols = ['#ff3b3b', '#ffd21a', '#2be8ff', '#ff6fb3'];
  const bulbs = [];
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4;
    const y = 0.45 + (i / 16) * 1.0;
    const r = 0.5 - (i / 16) * 0.32;
    const b = sphere(g, 0.045, mat(cols[i % 4], { emissive: cols[i % 4], ei: 0.9 }), Math.cos(a) * r, y, Math.sin(a) * r, 8);
    bulbs.push(b);
  }
  // gifts
  box(g, 0.24, 0.2, 0.24, C.blue(), 0.35, 0, 0.3, 0.03);
  box(g, 0.2, 0.16, 0.2, C.yellow(), -0.32, 0, 0.32, 0.03);
  return g;
}

function palm() {
  const g = new THREE.Group();
  cylinder(g, 0.25, 0.2, 0.3, mat('#e0d3b0', { rough: 0.8 }), 0, 0, 0, 12);
  const trunkM = mat('#9b7344', { rough: 0.9 });
  for (let i = 0; i < 6; i++) {
    const s = cylinder(g, 0.07 - i * 0.004, 0.08 - i * 0.004, 0.3, trunkM, i * 0.03, 0.28 + i * 0.28, 0, 8);
    s.rotation.z = -0.08;
  }
  const leafM = mat('#3dae4a', { rough: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.22), leafM);
    leaf.position.set(0.18, 1.98, 0);
    leaf.rotation.y = (i / 7) * Math.PI * 2;
    leaf.rotation.z = -0.5;
    leaf.geometry.translate(0.45, 0, 0);
    leaf.castShadow = true;
    g.add(leaf);
  }
  return g;
}

function trophy() {
  const g = new THREE.Group();
  box(g, 0.7, 0.5, 0.5, C.wood(), 0, 0, 0, 0.03);
  const glass = mat('#d8f0ff', { rough: 0.05, opacity: 0.35 });
  box(g, 0.66, 1.0, 0.46, glass, 0, 0.5, 0, 0.02);
  box(g, 0.7, 0.06, 0.5, C.wood(), 0, 1.5, 0, 0.02);
  const gold = mat('#f2c21b', { rough: 0.2, metal: 1 });
  for (const [x, h] of [[-0.18, 0.4], [0.05, 0.6], [0.22, 0.35]]) {
    cylinder(g, 0.05, 0.08, 0.06, gold, x, 0.55, 0, 10);
    cylinder(g, 0.02, 0.02, h * 0.4, gold, x, 0.6, 0, 8);
    cylinder(g, 0.1, 0.05, h * 0.35, gold, x, 0.6 + h * 0.4, 0, 12);
  }
  return g;
}

function statue() {
  const g = new THREE.Group();
  box(g, 0.8, 0.5, 0.8, mat('#f0ede6', { rough: 0.6 }), 0, 0, 0, 0.04);
  const gold = mat('#f2c21b', { rough: 0.18, metal: 1 });
  box(g, 0.7, 0.18, 0.36, gold, 0, 0.62, 0, 0.08);
  box(g, 0.36, 0.16, 0.3, gold, -0.04, 0.78, 0, 0.07);
  for (const sx of [0.22, -0.22]) for (const sz of [0.17, -0.17]) {
    const w = cylinder(g, 0.08, 0.08, 0.06, gold, sx, 0.5, sz, 12);
    w.rotation.x = Math.PI / 2;
    w.position.y = 0.6;
  }
  return g;
}

function turntable() {
  const g = new THREE.Group();
  cylinder(g, 1.45, 1.5, 0.12, mat('#2b2d31', { rough: 0.3, metal: 0.4 }), 0, 0, 0, 40);
  const top = cylinder(g, 1.35, 1.35, 0.04, mat('#d8dde4', { rough: 0.2, metal: 0.7 }), 0, 0.12, 0, 40);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.47, 0.035, 8, 48), mat('#2be8ff', { emissive: '#2be8ff', ei: 1.2 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.1;
  g.add(ring);
  g.userData.spinner = top;
  return g;
}

function arcade() {
  const g = new THREE.Group();
  const body = mat('#3b2b8f', { rough: 0.45 });
  box(g, 0.7, 1.7, 0.65, body, 0, 0, -0.03, 0.04);
  const screen = mat('#56ffd2', { emissive: '#2fd9ff', ei: 1.0 });
  const s = box(g, 0.52, 0.42, 0.02, screen, 0, 1.0, 0.3, 0.01);
  s.rotation.x = -0.2;
  box(g, 0.66, 0.1, 0.3, C.black(), 0, 0.82, 0.38, 0.03);
  sphere(g, 0.04, C.red(), -0.14, 0.95, 0.42, 8);
  sphere(g, 0.03, C.yellow(), 0.08, 0.94, 0.44, 8);
  sphere(g, 0.03, mat('#2be8ff'), 0.16, 0.94, 0.44, 8);
  const marquee = mat('#ffd21a', { emissive: '#ffb000', ei: 0.9 });
  box(g, 0.66, 0.16, 0.06, marquee, 0, 1.5, 0.28, 0.02);
  g.userData.screen = screen;
  return g;
}

function vending() {
  const g = new THREE.Group();
  box(g, 0.8, 1.8, 0.6, C.red(), 0, 0, -0.05, 0.05);
  const panel = mat('#bff1ff', { emissive: '#8fe2ff', ei: 0.6 });
  box(g, 0.48, 1.2, 0.02, panel, -0.08, 0.4, 0.25, 0.01);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    box(g, 0.1, 0.18, 0.02, mat(['#ffd21a', '#2f6fd6', '#3cff6b'][c]), -0.22 + c * 0.14, 0.5 + r * 0.27, 0.27, 0.01);
  }
  box(g, 0.14, 0.5, 0.03, C.black(), 0.28, 0.9, 0.26, 0.01);
  const tex = signTexture('soda', 'SODA', { bg: '#d9262b', w: 256, h: 64 });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.18), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.4 }));
  logo.position.set(0, 1.68, 0.255);
  g.add(logo);
  return g;
}

function sofa() {
  const g = new THREE.Group();
  const m = mat('#d9262b', { rough: 0.8 });
  box(g, 1.8, 0.4, 0.8, m, 0, 0.08, 0, 0.12);
  box(g, 1.8, 0.6, 0.22, m, 0, 0.3, -0.3, 0.1);
  for (const sx of [0.86, -0.86]) box(g, 0.2, 0.55, 0.8, m, sx, 0.08, 0, 0.09);
  for (const sx of [0.4, -0.4]) box(g, 0.78, 0.12, 0.6, mat('#ec4a4f', { rough: 0.8 }), sx, 0.46, 0.06, 0.06);
  for (const sx of [0.8, -0.8]) for (const sz of [0.3, -0.3]) cylinder(g, 0.04, 0.04, 0.08, C.black(), sx, 0, sz, 8);
  return g;
}

function jukebox() {
  const g = new THREE.Group();
  box(g, 0.75, 1.1, 0.5, mat('#7a3d1b', { rough: 0.4 }), 0, 0, 0, 0.05);
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.375, 0.375, 0.5, 20, 1, false, 0, Math.PI), mat('#7a3d1b', { rough: 0.4 }));
  arch.rotation.x = Math.PI / 2;
  arch.rotation.z = Math.PI / 2;
  arch.position.set(0, 1.1, 0);
  arch.castShadow = true;
  g.add(arch);
  const glow = mat('#ffb347', { emissive: '#ff8c1a', ei: 1.2 });
  const tube = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 24, Math.PI), glow);
  tube.position.set(0, 1.1, 0.26);
  g.add(tube);
  box(g, 0.5, 0.4, 0.02, mat('#ffe9a3', { emissive: '#ffd36b', ei: 0.6 }), 0, 0.55, 0.255, 0.01);
  g.userData.glow = glow;
  return g;
}

function airhockey() {
  const g = new THREE.Group();
  box(g, 1.8, 0.75, 0.95, C.blue(), 0, 0, 0, 0.05);
  box(g, 1.7, 0.04, 0.85, mat('#f4f7fb', { rough: 0.15 }), 0, 0.75, 0, 0.01);
  box(g, 0.02, 0.01, 0.85, C.red(), 0, 0.79, 0, 0.002);
  cylinder(g, 0.06, 0.06, 0.04, C.red(), -0.5, 0.78, 0.1, 12);
  cylinder(g, 0.06, 0.06, 0.04, mat('#2be8ff'), 0.6, 0.78, -0.15, 12);
  cylinder(g, 0.04, 0.04, 0.015, C.black(), 0.1, 0.785, 0.05, 12);
  return g;
}

function diner() {
  const g = new THREE.Group();
  const seat = mat('#d9262b', { rough: 0.6 });
  box(g, 0.9, 0.08, 0.9, mat('#e9eef2', { rough: 0.2, metal: 0.3 }), 0, 0.72, 0, 0.03);
  cylinder(g, 0.05, 0.05, 0.72, C.chrome(), 0, 0, 0, 8);
  for (const sz of [0.72, -0.72]) {
    box(g, 1.6, 0.42, 0.45, seat, 0, 0, sz, 0.08);
    box(g, 1.6, 0.9, 0.15, seat, 0, 0, sz + Math.sign(sz) * 0.2, 0.06);
  }
  box(g, 0.16, 0.22, 0.16, mat('#ff6fb3'), 0.2, 0.8, 0.1, 0.05);
  cylinder(g, 0.06, 0.05, 0.16, C.white(), -0.2, 0.8, -0.1, 10);
  return g;
}

// --- Wall items (rendered against the wall; local -z touches the wall) -------------------

function poster(variant = 0) {
  const g = new THREE.Group();
  const tex = posterTexture(variant);
  box(g, 0.74, 0.92, 0.04, mat('#2a3f75', { rough: 0.6 }), 0, 1.0, 0, 0.01);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.84), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
  p.position.set(0, 1.46, 0.025);
  g.add(p);
  return g;
}

function neonsign() {
  const g = new THREE.Group();
  box(g, 1.7, 0.6, 0.05, mat('#14151a', { rough: 0.4 }), 0, 1.3, 0, 0.03);
  const tex = signTexture('neon', 'OPEN 24/7', { bg: '#14151a', fg: '#ff4fd8', border: '#2be8ff', w: 512, h: 160 });
  const m = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.1, roughness: 0.5 });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), m);
  p.position.set(0, 1.6, 0.03);
  g.add(p);
  g.userData.neon = m;
  return g;
}

function clock() {
  const g = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 24).rotateX(Math.PI / 2), C.white());
  face.position.set(0, 1.75, 0.03);
  g.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 8, 24), C.red());
  rim.position.set(0, 1.75, 0.04);
  g.add(rim);
  const handM = C.black();
  const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.01), handM);
  h1.geometry.translate(0, 0.08, 0);
  h1.position.set(0, 1.75, 0.065);
  const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.01), handM);
  h2.geometry.translate(0, 0.11, 0);
  h2.position.set(0, 1.75, 0.07);
  g.add(h1, h2);
  g.userData.hands = [h1, h2];
  return g;
}

function shelf() {
  const g = new THREE.Group();
  for (const y of [1.1, 1.6]) box(g, 1.8, 0.05, 0.35, C.wood(), 0, y, 0.15, 0.01);
  const cols = ['#2f6fd6', '#d9262b', '#f2c21b', '#3aa04a'];
  for (let i = 0; i < 6; i++) box(g, 0.18, 0.28, 0.2, mat(cols[i % 4], { rough: 0.4 }), -0.7 + i * 0.28, 1.15, 0.15, 0.03);
  for (let i = 0; i < 4; i++) cylinder(g, 0.08, 0.08, 0.22, mat(cols[(i + 1) % 4], { rough: 0.3, metal: 0.4 }), -0.6 + i * 0.4, 1.65, 0.15, 10);
  return g;
}

const BUILDERS = {
  lift, washbay, paintbooth, toolchest, tirerack, workbench, desk, compressor, barrels, cones, plant,
  stopsign, flag, xmastree, palm, trophy, statue, turntable, arcade, vending, sofa, jukebox, airhockey, diner,
  poster, neonsign, clock, shelf,
};

let posterCounter = 0;
export function buildItem(type) {
  const fn = BUILDERS[type];
  const g = fn ? (type === 'poster' ? poster(posterCounter++) : fn()) : new THREE.Group();
  g.userData.itemType = type;
  return g;
}

/** Footprint in tiles after rotation. */
export function footprint(type, rot = 0) {
  const def = ITEMS[type];
  if (!def) return { w: 1, d: 1 };
  return rot % 2 ? { w: def.d, d: def.w } : { w: def.w, d: def.d };
}

// --- Street furniture & nature -----------------------------------------------------------

export function tree(scale = 1, variant = 0) {
  const g = new THREE.Group();
  cylinder(g, 0.12 * scale, 0.16 * scale, 0.9 * scale, mat('#8b5a2b', { rough: 0.9 }), 0, 0, 0, 8);
  const leaf = mat(['#3fae4f', '#4cbb57', '#2f9a45'][variant % 3], { rough: 0.85 });
  sphere(g, 0.7 * scale, leaf, 0, 1.3 * scale, 0, 14);
  sphere(g, 0.5 * scale, leaf, 0.35 * scale, 1.05 * scale, 0.2 * scale, 12);
  sphere(g, 0.5 * scale, leaf, -0.3 * scale, 1.1 * scale, -0.25 * scale, 12);
  sphere(g, 0.45 * scale, leaf, 0.05 * scale, 1.75 * scale, 0.05 * scale, 12);
  return g;
}

export function bush(w = 1.2, h = 0.6, color = '#3a9e47') {
  const g = new THREE.Group();
  const m = mat(color, { rough: 0.85 });
  const n = Math.max(2, Math.round(w / 0.45));
  for (let i = 0; i < n; i++) sphere(g, h * 0.62, m, -w / 2 + ((i + 0.5) / n) * w, h * 0.5, 0, 10);
  return g;
}

export function hedge(len, h = 0.6) {
  const g = new THREE.Group();
  box(g, len, h, 0.6, mat('#3a9e47', { rough: 0.85 }), 0, 0, 0, 0.25);
  return g;
}

export function lampPost() {
  const g = new THREE.Group();
  cylinder(g, 0.08, 0.1, 3.2, mat('#3a3d44', { rough: 0.5, metal: 0.6 }), 0, 0, 0, 8);
  box(g, 0.9, 0.08, 0.12, mat('#3a3d44', { rough: 0.5, metal: 0.6 }), 0.4, 3.15, 0, 0.03);
  const lampM = mat('#fff8d8', { emissive: '#fff1b0', ei: 0.4 });
  box(g, 0.38, 0.1, 0.24, lampM, 0.8, 3.06, 0, 0.04);
  g.userData.lamp = lampM;
  return g;
}

export function billboard() {
  const g = new THREE.Group();
  const post = mat('#5b5f66', { rough: 0.5, metal: 0.5 });
  for (const s of [-1.2, 1.2]) cylinder(g, 0.1, 0.12, 2.6, post, s, 0, 0, 10);
  box(g, 3.6, 1.9, 0.2, mat('#2b2d31', { rough: 0.5 }), 0, 2.4, 0, 0.04);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), new THREE.MeshStandardMaterial({ map: billboardTexture(), roughness: 0.5, emissive: 0xffffff, emissiveMap: billboardTexture(), emissiveIntensity: 0.15 }));
  p.position.set(0, 3.35, 0.11);
  g.add(p);
  box(g, 3.4, 0.08, 0.5, post, 0, 2.3, 0.2, 0.02);
  return g;
}

export function bench() {
  const g = new THREE.Group();
  const w = C.wood();
  box(g, 1.4, 0.06, 0.42, w, 0, 0.42, 0, 0.02);
  box(g, 1.4, 0.32, 0.06, w, 0, 0.5, -0.2, 0.02);
  for (const s of [-0.6, 0.6]) box(g, 0.06, 0.42, 0.4, C.black(), s, 0, 0, 0.01);
  return g;
}

export function hydrant() {
  const g = new THREE.Group();
  const r = C.red();
  cylinder(g, 0.13, 0.15, 0.5, r, 0, 0, 0, 12);
  sphere(g, 0.13, r, 0, 0.52, 0, 10);
  const n = cylinder(g, 0.06, 0.06, 0.34, r, 0, 0.28, 0, 8);
  n.rotation.z = Math.PI / 2;
  n.position.y = 0.32;
  return g;
}

export function trashCan() {
  const g = new THREE.Group();
  cylinder(g, 0.24, 0.2, 0.7, mat('#3a7d44', { rough: 0.6, metal: 0.3 }), 0, 0, 0, 14);
  cylinder(g, 0.26, 0.26, 0.06, mat('#2c5e33'), 0, 0.7, 0, 14);
  return g;
}

export function glowDisc(color, radius = 1.2) {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 32),
    new THREE.MeshBasicMaterial({ map: radialTexture('disc'), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}
