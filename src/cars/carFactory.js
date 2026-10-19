// Assembles complete, customisable car objects from model definitions.
// Heavy data (body shells, fascia overlays, extras) is cached per model; each
// car instance only owns its paint materials and livery overlays.

import * as THREE from 'three';
import { MODELS } from './models.js';
import { MAT, buildLowerBody, buildCabin, projectOverlay, roundedBox } from './carGeometry.js';
import { Painter, crect, rrect, poly, circle, blob, ellipse } from './painter.js';
import { buildWheel } from './wheels.js';

export const FINISHES = ['gloss', 'metallic', 'pearl', 'matte', 'chrome', 'candy'];
export const LIVERIES = ['none', 'stripes', 'side', 'flames', 'number', 'checker', 'bolt', 'tribal', 'police'];
export const SPOILERS = ['default', 'none', 'lip', 'duck', 'roof', 'wing'];

const templates = new Map();
let lightLevel = 0.35;

export function setCarLightLevel(v) {
  lightLevel = v;
  for (const t of templates.values()) for (const m of t.overlayMats) m.emissiveIntensity = v;
}

// --- Shared materials -------------------------------------------------------------

const shared = {};
function sharedMat(key, make) {
  if (!shared[key]) shared[key] = make();
  return shared[key];
}
const trimMat = () => sharedMat('trim', () => new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.32, metalness: 0.25 }));
const chromeMat = () => sharedMat('chrome', () => new THREE.MeshStandardMaterial({ color: 0xe8ebef, roughness: 0.08, metalness: 1 }));
const darkMat = () => sharedMat('dark', () => new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.8, metalness: 0 }));
function glassMat(tint = 0.5) {
  const key = `glass:${Math.round(tint * 10)}`;
  return sharedMat(key, () => {
    const c = new THREE.Color('#2b3c55').lerp(new THREE.Color('#06080c'), Math.min(1, tint));
    return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.7 });
  });
}

export function makePaintMaterial(color, finish = 'gloss') {
  const c = new THREE.Color(color);
  const p = { color: c, envMapIntensity: 1.15 };
  switch (finish) {
    case 'metallic': Object.assign(p, { metalness: 0.55, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06 }); break;
    case 'pearl': Object.assign(p, { metalness: 0.15, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.04, iridescence: 0.7, iridescenceIOR: 1.5, iridescenceThicknessRange: [180, 520] }); break;
    case 'matte': Object.assign(p, { metalness: 0.05, roughness: 0.78, clearcoat: 0, envMapIntensity: 0.6 }); break;
    case 'chrome': Object.assign(p, { metalness: 1, roughness: 0.06, clearcoat: 0.6, clearcoatRoughness: 0.02, envMapIntensity: 1.6 }); break;
    case 'candy': Object.assign(p, { metalness: 0.75, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.02 }); break;
    case 'gloss':
    default: Object.assign(p, { metalness: 0.02, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.05 }); break;
  }
  return new THREE.MeshPhysicalMaterial(p);
}

function overlayMaterial(painter, { emissive = true, metal = true } = {}) {
  const m = new THREE.MeshStandardMaterial({
    map: painter.texture('color'),
    transparent: true,
    depthWrite: false,
    roughness: 0.28,
    metalness: metal ? 1 : 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  if (metal && painter.layers.metal) m.metalnessMap = painter.texture('metal', false);
  if (emissive && painter.layers.glow) {
    m.emissiveMap = painter.texture('glow');
    m.emissive = new THREE.Color(0xffffff);
    m.emissiveIntensity = lightLevel;
  }
  return m;
}

// --- Per-model template --------------------------------------------------------------

function getTemplate(modelId) {
  if (templates.has(modelId)) return templates.get(modelId);
  const spec = MODELS[modelId];
  const body = buildLowerBody(spec);
  const cabin = buildCabin(spec, body);
  const fn = body.userData.fn;
  const L = spec.length;
  const W = spec.width;
  const We = W + 0.16;
  const overlays = [];
  const overlayMats = [];

  const addOverlay = (geoSrc, painter, proj, opts) => {
    const g = projectOverlay(geoSrc, proj);
    if (!g.attributes.position.count) return;
    const m = overlayMaterial(painter, opts);
    overlayMats.push(m);
    overlays.push({ geometry: g, material: m });
  };

  if (spec.front) {
    const P = new Painter(We, 1.0, { pxPerUnit: 320, x0: -We / 2, y0: 0 });
    spec.front(P, W, spec);
    addOverlay(body, P, { dir: new THREE.Vector3(1, 0, 0), uFn: (p) => 0.5 - (Math.sign(p.z) * fn.wrapFront(Math.abs(p.z))) / We, vDir: new THREE.Vector3(0, 1, 0), v0: 0, vSize: 1.0, minDot: 0.12 });
  }
  if (spec.rear) {
    const P = new Painter(We, 1.0, { pxPerUnit: 300, x0: -We / 2, y0: 0 });
    spec.rear(P, W, spec);
    addOverlay(body, P, { dir: new THREE.Vector3(-1, 0, 0), uFn: (p) => 0.5 + (Math.sign(p.z) * fn.wrapRear(Math.abs(p.z))) / We, vDir: new THREE.Vector3(0, 1, 0), v0: 0, vSize: 1.0, minDot: 0.12 });
  }
  if (spec.side) {
    for (const s of [1, -1]) {
      const P = new Painter(L, 1.0, { pxPerUnit: 260, x0: -L / 2, y0: 0, flipX: s < 0, layers: ['color', 'metal'] });
      spec.side(P, L, spec);
      addOverlay(body, P, {
        dir: new THREE.Vector3(0, 0, s), uDir: new THREE.Vector3(s, 0, 0), u0: -L / 2, uSize: L,
        vDir: new THREE.Vector3(0, 1, 0), v0: 0, vSize: 1.0, minDot: 0.35,
      }, { emissive: false });
    }
  }

  const tpl = { spec, body, cabin, fn, overlays, overlayMats };
  templates.set(modelId, tpl);
  return tpl;
}

// --- Liveries ------------------------------------------------------------------------

function drawLiverySide(P, livery, color, spec, number) {
  const L = spec.length;
  const belt = spec.cabin.beltY;
  const fx = spec.wheel.front;
  const rx = spec.wheel.rear;
  switch (livery) {
    case 'side':
      P.fill(rrect(-L / 2, belt - 0.16, L, 0.06, 0.02), color);
      P.fill(rrect(-L / 2, belt - 0.2, L, 0.018, 0.009), color);
      break;
    case 'flames': {
      const base = L / 2;
      for (let i = 0; i < 5; i++) {
        const y = 0.3 + i * 0.075;
        const len = 0.9 + Math.sin(i * 1.7) * 0.25;
        P.fill(blob([[base, y - 0.05], [base - len * 0.5, y - 0.03], [base - len, y + 0.02], [base - len * 0.55, y + 0.03], [base - len * 0.3, y + 0.06], [base, y + 0.05]], 0.5), color);
      }
      P.fill(rrect(base - 0.6, 0.26, 0.6, 0.38, 0.05), color);
      break;
    }
    case 'number': {
      const cx = (fx + rx) / 2 + 0.05;
      const cy = (0.26 + belt) / 2;
      P.fill(circle(cx, cy, 0.17), '#ffffff');
      P.fill(circle(cx, cy, 0.17), 'rgba(0,0,0,0)');
      P.stroke(circle(cx, cy, 0.16), color, 0.025);
      P.text(String(number).padStart(2, '0'), cx, cy - 0.005, 0.2, color);
      P.fill(rrect(-L / 2, 0.24, L, 0.05, 0.02), color);
      break;
    }
    case 'checker': {
      const y = belt - 0.17;
      const s = 0.05;
      for (let i = 0; i < L / s; i++) {
        for (let r = 0; r < 2; r++) if ((i + r) % 2 === 0) P.fill(rrect(-L / 2 + i * s, y + r * s, s, s, 0), color);
      }
      break;
    }
    case 'bolt': {
      const y = (0.26 + belt) / 2;
      P.fill(poly([[L * 0.42, y + 0.1], [0.1, y + 0.06], [0.2, y], [-L * 0.42, y - 0.02], [-0.05, y - 0.08], [-0.15, y - 0.02], [L * 0.42, y + 0.02]]), color);
      break;
    }
    case 'tribal': {
      const y = (0.24 + belt) / 2;
      for (let i = 0; i < 4; i++) {
        const x = L * 0.35 - i * 0.42;
        P.fill(blob([[x, y + 0.12], [x - 0.3, y + 0.05], [x - 0.5, y - 0.12], [x - 0.22, y - 0.02], [x - 0.08, y - 0.1], [x + 0.05, y]], 0.6), color);
      }
      break;
    }
    case 'police': {
      const d0 = spec.cabin.front0 + 0.02;
      const d1 = spec.cabin.rear0 + 0.25;
      P.fill(rrect(d1, 0.17, d0 - d1, belt - 0.15, 0.03), color);
      P.text('POLICE', (d0 + d1) / 2, (belt + 0.2) / 2 + 0.02, 0.12, '#14161b');
      P.fill(rrect(d1, 0.26, d0 - d1, 0.025, 0.01), '#1d4fd8');
      break;
    }
    case 'stripes':
      P.fill(rrect(-L / 2, belt - 0.07, L, 0.03, 0.01), color);
      break;
    default:
      break;
  }
}

function drawLiveryTop(P, livery, color, spec) {
  const L = spec.length;
  if (livery === 'stripes') {
    P.fill(rrect(-L / 2 - 0.05, 0.05, L + 0.1, 0.11, 0.0), color);
    P.fill(rrect(-L / 2 - 0.05, -0.16, L + 0.1, 0.11, 0.0), color);
  } else if (livery === 'checker') {
    // taxi roof band
  } else if (livery === 'number') {
    P.fill(circle(spec.length * 0.32, 0, 0.16), '#ffffff');
  } else if (livery === 'flames') {
    for (let i = -2; i <= 2; i++) {
      const y = i * 0.12;
      P.fill(blob([[L / 2 + 0.05, y - 0.05], [L / 2 - 0.45, y - 0.02], [L / 2 - 0.7 - Math.abs(i) * 0.05, y + 0.02], [L / 2 - 0.35, y + 0.04], [L / 2 + 0.05, y + 0.05]], 0.5), color);
    }
  }
}

function buildLivery(tpl, cfg) {
  const { spec, body, cabin } = tpl;
  const out = [];
  const livery = cfg.livery || 'none';
  if (livery === 'none') return out;
  const color = cfg.liveryColor || '#111111';
  const L = spec.length;
  const W = spec.width + 0.16;
  for (const s of [1, -1]) {
    const P = new Painter(L, 1.0, { pxPerUnit: 200, x0: -L / 2, y0: 0, flipX: s < 0, layers: ['color'] });
    drawLiverySide(P, livery, color, spec, cfg.number ?? 7);
    const g = projectOverlay(body, { dir: new THREE.Vector3(0, 0, s), uDir: new THREE.Vector3(s, 0, 0), u0: -L / 2, uSize: L, vDir: new THREE.Vector3(0, 1, 0), v0: 0, vSize: 1.0, minDot: 0.3, offset: 0.0015 });
    out.push({ geometry: g, material: overlayMaterial(P, { emissive: false, metal: false }), order: 1 });
  }
  if (['stripes', 'number', 'flames'].includes(livery)) {
    const P = new Painter(L + 0.1, W, { pxPerUnit: 160, x0: -L / 2 - 0.05, y0: -W / 2, layers: ['color'] });
    drawLiveryTop(P, livery, color, spec);
    const proj = { dir: new THREE.Vector3(0, 1, 0), uDir: new THREE.Vector3(1, 0, 0), u0: -L / 2 - 0.05, uSize: L + 0.1, vDir: new THREE.Vector3(0, 0, -1), v0: -W / 2, vSize: W, minDot: 0.3, offset: 0.0015 };
    const mat = overlayMaterial(P, { emissive: false, metal: false });
    out.push({ geometry: projectOverlay(body, proj), material: mat, order: 1 });
    if (livery === 'stripes') out.push({ geometry: projectOverlay(cabin, { ...proj, materials: [MAT.ROOF, MAT.PAINT] }), material: mat, order: 1 });
  }
  return out;
}

// --- Extras (3D bolt-on parts) -------------------------------------------------------

function addExtras(group, tpl, cfg, mats) {
  const { spec, fn } = tpl;
  const ex = spec.extras || {};
  const c = spec.cabin;
  const half = spec.length / 2;

  // Mirrors (on short stalks from the A-pillar base)
  if (ex.mirrors) {
    const mm = ex.mirrors === 'black' ? trimMat() : ex.mirrors === 'chrome' ? chromeMat() : ex.mirrors === 'roof' ? mats.roof : mats.paint;
    const head = roundedBox(0.08, 0.075, 0.12, 0.03);
    const stalk = roundedBox(0.05, 0.025, 0.1, 0.01);
    const mx = c.front0 - 0.12;
    for (const s of [1, -1]) {
      const st = new THREE.Mesh(stalk, trimMat());
      st.position.set(mx, c.beltY + 0.04, s * (c.w0 + 0.02));
      group.add(st);
      const m = new THREE.Mesh(head, mm);
      m.position.set(mx - 0.01, c.beltY + 0.07, s * (c.w0 + 0.1));
      m.castShadow = true;
      group.add(m);
    }
  }

  // Spoilers
  let spoiler = cfg.spoiler && cfg.spoiler !== 'default' ? cfg.spoiler : ex.spoiler || 'none';
  const rearX = -half;
  if (spoiler === 'roof' && c.rear1 > -half + 0.25) spoiler = 'lip';
  if (spoiler === 'lip' || spoiler === 'duck') {
    const x = rearX + 0.1;
    const y = fn.topAt(x);
    const w = fn.widthAt(x) * 2 * 0.92;
    const m = new THREE.Mesh(roundedBox(0.12, spoiler === 'duck' ? 0.07 : 0.035, w, 0.015), spoiler === 'duck' ? mats.paint : trimMat());
    m.position.set(x, y + 0.01, 0);
    m.rotation.z = 0.25;
    m.castShadow = true;
    group.add(m);
  } else if (spoiler === 'roof') {
    const m = new THREE.Mesh(roundedBox(0.16, 0.03, c.w1 * 2 * 0.95, 0.012), trimMat());
    m.position.set(c.rear1 - 0.03, c.roofY - 0.02, 0);
    m.rotation.z = -0.15;
    m.castShadow = true;
    group.add(m);
  } else if (spoiler === 'wing') {
    const x = rearX + 0.16;
    const y = fn.topAt(x);
    const w = Math.max(fn.widthAt(x) * 2, spec.width * 0.85);
    const wing = new THREE.Mesh(roundedBox(0.2, 0.03, w, 0.012), cfg.wingPaint ? mats.paint : trimMat());
    wing.position.set(x - 0.02, y + 0.2, 0);
    wing.rotation.z = 0.08;
    wing.castShadow = true;
    group.add(wing);
    for (const s of [1, -1]) {
      const post = new THREE.Mesh(roundedBox(0.06, 0.2, 0.025, 0.01), trimMat());
      post.position.set(x, y + 0.1, s * w * 0.32);
      group.add(post);
      const plate = new THREE.Mesh(roundedBox(0.24, 0.1, 0.012, 0.005), trimMat());
      plate.position.set(x - 0.02, y + 0.2, s * w / 2);
      group.add(plate);
    }
  }

  if (ex.roofRails) {
    for (const s of [1, -1]) {
      const len = c.front1 - c.rear1 - 0.05;
      const r = new THREE.Mesh(roundedBox(len, 0.035, 0.04, 0.015), trimMat());
      r.position.set((c.front1 + c.rear1) / 2 - 0.02, c.roofY + 0.012, s * c.w1 * 0.82);
      group.add(r);
    }
  }

  if (ex.taxiSign) {
    const P = new Painter(0.38, 0.12, { x0: -0.19, y0: -0.06, pxPerUnit: 400, layers: ['color', 'glow'] });
    P.fill(crect(0, 0, 0.38, 0.12, 0.02), '#ffe75a', { glow: '#7a6410' });
    P.text('TAXI', 0, 0, 0.08, '#151515');
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.11, 0.38),
      new THREE.MeshStandardMaterial({ map: P.texture('color'), emissiveMap: P.texture('glow'), emissive: 0xffffff, emissiveIntensity: 1, roughness: 0.4 }),
    );
    m.position.set((c.rear1 + c.front1) / 2 - 0.05, c.roofY + 0.06, 0);
    m.rotation.y = Math.PI / 2;
    m.castShadow = true;
    group.add(m);
  }

  if (ex.lightBar) {
    const base = new THREE.Mesh(roundedBox(0.14, 0.04, c.w1 * 1.6, 0.015), trimMat());
    base.position.set((c.rear1 + c.front1) / 2, c.roofY + 0.02, 0);
    group.add(base);
    const red = new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff0000, emissiveIntensity: 0.8, roughness: 0.2 });
    const blue = new THREE.MeshStandardMaterial({ color: 0x2050ff, emissive: 0x0030ff, emissiveIntensity: 0.8, roughness: 0.2 });
    for (const s of [1, -1]) {
      const l = new THREE.Mesh(roundedBox(0.12, 0.06, c.w1 * 0.7, 0.025), s > 0 ? red : blue);
      l.position.set((c.rear1 + c.front1) / 2, c.roofY + 0.06, s * c.w1 * 0.38);
      l.userData.siren = s;
      group.add(l);
    }
    group.userData.sirens = [red, blue];
  }

  if (ex.hoodScoop) {
    const x = half * 0.45;
    const m = new THREE.Mesh(roundedBox(0.36, 0.08, 0.32, 0.04), mats.paint);
    m.position.set(x, fn.topAt(x) + 0.02, 0);
    m.castShadow = true;
    group.add(m);
    const hole = new THREE.Mesh(roundedBox(0.02, 0.05, 0.26, 0.01), darkMat());
    hole.position.set(x + 0.18, fn.topAt(x) + 0.03, 0);
    group.add(hole);
  }

  if (ex.bed) {
    const x0 = c.rear0 - 0.06;
    const x1 = -half + 0.08;
    const len = x0 - x1;
    const y = fn.topAt((x0 + x1) / 2);
    const w = fn.widthAt((x0 + x1) / 2) * 2 - 0.14;
    const bed = new THREE.Mesh(roundedBox(len, 0.04, w, 0.015), darkMat());
    bed.position.set((x0 + x1) / 2, y - 0.01, 0);
    group.add(bed);
    for (let i = 0; i < 5; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(len * 0.96, 0.01, 0.02), trimMat());
      rib.position.set((x0 + x1) / 2, y + 0.012, -w / 2 + ((i + 0.5) / 5) * w);
      group.add(rib);
    }
  }

  if (ex.spareWheel) {
    const { group: sw } = buildWheel({ radius: spec.wheel.radius * 0.9, width: 0.2, style: 'dish', rimMaterial: mats.rim });
    sw.rotation.y = -Math.PI / 2;
    sw.position.set(-half - 0.08, 0.62, 0);
    group.add(sw);
  }

  if (ex.exhaust) {
    const n = ex.exhaust;
    const geo = new THREE.CylinderGeometry(0.035, 0.035, 0.1, 14).rotateZ(Math.PI / 2);
    for (let i = 0; i < n; i++) {
      const z = n === 1 ? spec.width * 0.28 : ((i % 2 ? 1 : -1) * spec.width * 0.3) + (n === 4 ? (i < 2 ? 0.05 : -0.05) * (i % 2 ? 1 : -1) : 0);
      const p = new THREE.Mesh(geo, chromeMat());
      p.position.set(-half + 0.01, 0.22, z);
      group.add(p);
    }
  }

  if (ex.pushBar) {
    const bar = new THREE.Mesh(roundedBox(0.06, 0.2, spec.width * 0.55, 0.02), trimMat());
    bar.position.set(half + 0.02, 0.3, 0);
    group.add(bar);
  }

  if (ex.mudflaps) {
    for (const s of [1, -1]) {
      for (const ax of [spec.wheel.front, spec.wheel.rear]) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.12, 0.18), darkMat());
        m.position.set(ax - spec.wheel.radius - 0.06, 0.12, s * (fn.widthAt(ax) - 0.12));
        group.add(m);
      }
    }
  }
}

// --- Public API ----------------------------------------------------------------------

export function defaultConfig(modelId) {
  const spec = MODELS[modelId];
  const c = spec.colors || {};
  return {
    model: modelId,
    paint: c.paint || '#d9262b',
    roof: c.roof || null,
    finish: c.finish || 'gloss',
    rim: spec.wheel.style,
    rimColor: c.rim || '#c9ccd1',
    caliper: c.caliper || null,
    livery: c.livery || 'none',
    liveryColor: c.liveryColor || '#111111',
    number: Math.floor(Math.random() * 98) + 1,
    spoiler: 'default',
    tint: 0.5,
    neon: null,
    lower: 0,
    upgrades: { engine: 0, turbo: 0, gearbox: 0, tires: 0, weight: 0, nitro: 0 },
  };
}

const blobTex = (() => {
  let tex = null;
  return () => {
    if (tex) return tex;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    tex = new THREE.CanvasTexture(c);
    return tex;
  };
})();

const glowTex = (() => {
  let tex = null;
  return () => {
    if (tex) return tex;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    tex = new THREE.CanvasTexture(c);
    return tex;
  };
})();

/**
 * Creates a car Object3D. The returned group has userData.car with helpers:
 *   spinWheels(distance), steer(angle), setSiren(t), dispose()
 */
export function createCar(cfgIn, { shadows = true, blobShadow = true } = {}) {
  const cfg = { ...defaultConfig(cfgIn.model), ...cfgIn };
  const tpl = getTemplate(cfg.model);
  const { spec, fn } = tpl;
  const root = new THREE.Group();
  root.name = `car:${cfg.model}`;
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);
  bodyGroup.position.y = -0.025 * (cfg.lower || 0);

  const paint = makePaintMaterial(cfg.paint, cfg.finish);
  const roof = cfg.roof ? makePaintMaterial(cfg.roof, cfg.finish === 'chrome' ? 'gloss' : cfg.finish) : paint;
  const rimMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(cfg.rimColor), metalness: 0.85, roughness: 0.22 });
  const caliperMat = cfg.caliper ? new THREE.MeshStandardMaterial({ color: new THREE.Color(cfg.caliper), roughness: 0.4, metalness: 0.2 }) : null;
  const mats = { paint, roof, rim: rimMat };
  const matArray = [paint, roof, glassMat(cfg.tint ?? 0.5), trimMat(), chromeMat()];

  const body = new THREE.Mesh(tpl.body, matArray);
  body.castShadow = shadows;
  body.receiveShadow = false;
  bodyGroup.add(body);
  const cabin = new THREE.Mesh(tpl.cabin, matArray);
  cabin.castShadow = shadows;
  bodyGroup.add(cabin);

  for (const o of tpl.overlays) {
    const m = new THREE.Mesh(o.geometry, o.material);
    m.renderOrder = 2;
    bodyGroup.add(m);
  }
  const livery = buildLivery(tpl, cfg);
  for (const o of livery) {
    const m = new THREE.Mesh(o.geometry, o.material);
    m.renderOrder = o.order;
    m.userData.ownMaterial = true;
    bodyGroup.add(m);
  }

  addExtras(bodyGroup, tpl, cfg, mats);

  // Wheels
  const wheels = [];
  const wr = spec.wheel.radius;
  for (const ax of [spec.wheel.front, spec.wheel.rear]) {
    for (const s of [1, -1]) {
      const { group, spin } = buildWheel({ radius: wr, width: spec.wheel.width, style: cfg.rim || spec.wheel.style, rimMaterial: rimMat, caliperMaterial: caliperMat });
      const z = s * (fn.widthAt(ax) - spec.wheel.width / 2 - 0.025);
      group.position.set(ax, wr, z);
      const holder = new THREE.Group();
      holder.position.copy(group.position);
      group.position.set(0, 0, 0);
      if (s < 0) group.rotation.y = Math.PI;
      holder.add(group);
      root.add(holder);
      group.traverse((o) => { if (o.isMesh) o.castShadow = shadows; });
      wheels.push({ holder, spin, side: s, front: ax > 0 });
    }
  }

  if (blobShadow) {
    const sh = new THREE.Mesh(
      new THREE.PlaneGeometry(spec.length * 1.12, spec.width * 1.25),
      new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: 0.9 }),
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = 0.012;
    sh.renderOrder = -1;
    sh.userData.ownMaterial = true;
    root.add(sh);
  }

  let neon = null;
  if (cfg.neon) {
    neon = new THREE.Mesh(
      new THREE.PlaneGeometry(spec.length * 1.25, spec.width * 1.5),
      new THREE.MeshBasicMaterial({ map: glowTex(), color: new THREE.Color(cfg.neon), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }),
    );
    neon.rotation.x = -Math.PI / 2;
    neon.position.y = 0.02;
    neon.renderOrder = 0;
    neon.userData.ownMaterial = true;
    root.add(neon);
  }

  let wheelAngle = 0;
  const api = {
    cfg,
    spec,
    length: spec.length,
    width: spec.width,
    height: spec.cabin.roofY,
    wheels,
    bodyGroup,
    spinWheels(distance) {
      wheelAngle -= distance / wr;
      for (const w of wheels) w.spin.rotation.z = w.side > 0 ? wheelAngle : -wheelAngle;
    },
    steer(angle) {
      for (const w of wheels) if (w.front) w.holder.rotation.y = angle;
    },
    setSiren(t) {
      const s = bodyGroup.userData.sirens;
      if (!s) return;
      const on = Math.floor(t * 4) % 2 === 0;
      s[0].emissiveIntensity = on ? 2.5 : 0.2;
      s[1].emissiveIntensity = on ? 0.2 : 2.5;
    },
    setBodyRoll(roll, pitch) {
      bodyGroup.rotation.x = roll;
      bodyGroup.rotation.z = pitch;
    },
    dispose() {
      paint.dispose();
      if (roof !== paint) roof.dispose();
      rimMat.dispose();
      caliperMat?.dispose();
      root.traverse((o) => {
        if (o.isMesh && o.userData.ownMaterial) {
          o.material.map?.dispose();
          o.material.dispose();
          if (o.geometry !== tpl.body && o.geometry !== tpl.cabin && !tpl.overlays.some((t) => t.geometry === o.geometry)) o.geometry.dispose();
        }
      });
    },
  };
  root.userData.car = api;
  return root;
}

/** Pre-builds templates so the first spawn of each model does not hitch. */
export function warmTemplates(ids) {
  for (const id of ids) getTemplate(id);
}
