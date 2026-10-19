// Assembles complete, customisable car objects from model definitions.
// Heavy data (body shells and their projected detail layers) is cached per
// model and level of detail; each car instance only owns its paint
// materials, liveries and bolt-on parts.

import * as THREE from 'three';
import { MODELS } from './models.js';
import { projectOverlay, roundedBox } from './carGeometry.js';
import { Painter, crect, rrect, poly, circle, blob } from './painter.js';
import { buildWheel } from './wheels.js';
import { buildBodyV2, slopeProjection } from './bodyV2.js';

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
const geoShared = {};
function sharedGeo(key, make) {
  if (!geoShared[key]) geoShared[key] = make();
  return geoShared[key];
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

function getTemplate(modelId, lod = 'high') {
  const k = `${modelId}:${lod}`;
  if (!templates.has(k)) templates.set(k, getTemplateV2(MODELS[modelId], lod));
  return templates.get(k);
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
export function createCar(cfgIn, { shadows = true, blobShadow = true, lod = 'high' } = {}) {
  const cfg = { ...defaultConfig(cfgIn.model), ...cfgIn };
  return createCarV2(getTemplate(cfg.model, lod), cfg, { shadows, blobShadow });
}

// =====================================================================================
// Realistic (v2) cars: one-piece lofted shell in metres + projected detail layers
// =====================================================================================

function smoothstepF(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function railFn(fn, b) {
  const roofEdge = b.roofEdge ?? 0.06;
  return (x) => {
    const yR = fn.roofAt(x);
    const yB = fn.beltAt(x);
    const g = yR - yB;
    const s = smoothstepF(0.03, 0.2, g);
    const lo = yB + g * 0.45;
    const hi = yR - Math.min(roofEdge, g * 0.45);
    return lo + (hi - lo) * s;
  };
}

function decorMaterial(P, { emissive = false } = {}) {
  const m = new THREE.MeshStandardMaterial({
    map: P.texture('color'),
    transparent: true,
    depthWrite: false,
    roughness: 0.24,
    metalness: P.layers.metal ? 1 : 0,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  if (P.layers.metal) m.metalnessMap = P.texture('metal', false);
  if (emissive && P.layers.glow && P.used.glow) {
    m.emissiveMap = P.texture('glow');
    m.emissive = new THREE.Color(0xffffff);
    m.emissiveIntensity = Math.max(lightLevel, 0.6);
    m.userData.lights = true;
  }
  return m;
}

const glassCache = new Map();
function glassOverlayMat(alpha, tint) {
  const key = `${alpha.uuid}:${Math.round(tint * 10)}`;
  if (glassCache.has(key)) return glassCache.get(key);
  const c = new THREE.Color('#25344a').lerp(new THREE.Color('#05070b'), Math.min(1, tint));
  const m = new THREE.MeshPhysicalMaterial({
    color: c,
    roughness: 0.04,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.5,
    alphaMap: alpha,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  glassCache.set(key, m);
  return m;
}

function getTemplateV2(spec, lod = 'high') {
  const b = spec.body;
  const body = buildBodyV2(b, lod);
  const res = lod === 'low' ? 0.5 : 1;
  const fn = body.userData.fn;
  const L = b.length;
  const H = 2.0;
  let maxW = 0;
  for (let x = -fn.half; x <= fn.half; x += 0.02) maxW = Math.max(maxW, fn.widthAt(x));
  const frontSpan = fn.wrapFront(maxW);
  const rearSpan = fn.wrapRear(maxW);
  const rail = railFn(fn, b);
  const c = { fn, b, spec, key: spec.key, rail, frontSpan, rearSpan };
  const layers = [];
  const lightMats = [];
  const add = (P, proj, opts = {}) => {
    const g = projectOverlay(body, proj);
    if (!g.attributes.position.count) return;
    if (P.used.roof) layers.push({ kind: 'roof', geometry: g, alpha: P.texture('roof', false), order: 1 });
    if (P.used.glass) layers.push({ kind: 'glass', geometry: g, alpha: P.texture('glass', false), order: 3 });
    if (P.used.color) {
      const m = decorMaterial(P, opts);
      if (m.userData.lights) lightMats.push(m);
      layers.push({ kind: 'decor', geometry: g, material: m, order: 4 });
    }
  };
  const d = spec.draw;
  const off = 0.004;
  // front & rear fascias, wrapped around the rounded nose/tail
  {
    const Wf = frontSpan * 2 + 0.1;
    const P = new Painter(Wf, H, { pxPerUnit: 420 * res, x0: -Wf / 2, y0: 0, layers: ['color', 'glow', 'metal'], maxPx: 1400 * res });
    d.front?.(P, c);
    add(P, { dir: new THREE.Vector3(1, 0, 0), uFn: (p) => 0.5 - (Math.sign(p.z) * fn.wrapFront(Math.abs(p.z))) / Wf, vDir: new THREE.Vector3(0, 1, 0), v0: 0, vSize: H, minDot: 0.12, offset: off }, { emissive: true });
  }
  {
    const Wr = rearSpan * 2 + 0.1;
    const P = new Painter(Wr, H, { pxPerUnit: 360 * res, x0: -Wr / 2, y0: 0, layers: ['color', 'glow', 'metal'], maxPx: 1200 * res });
    d.rear?.(P, c);
    add(P, { dir: new THREE.Vector3(-1, 0, 0), uFn: (p) => 0.5 + (Math.sign(p.z) * fn.wrapRear(Math.abs(p.z))) / Wr, vDir: new THREE.Vector3(0, 1, 0), v0: 0, vSize: H, minDot: 0.12, offset: off }, { emissive: true });
  }
  // both sides (left side mirrored so text reads correctly)
  for (const side of [1, -1]) {
    const P = new Painter(L, H, { pxPerUnit: 330 * res, x0: -L / 2, y0: 0, flipX: side < 0, layers: ['color', 'metal', 'glass', 'roof'], maxPx: 1600 * res });
    d.side?.(P, c);
    add(P, { dir: new THREE.Vector3(0, 0, side), uDir: new THREE.Vector3(side, 0, 0), u0: -L / 2, uSize: L, vDir: new THREE.Vector3(0, 1, 0), v0: 0, vSize: H, minDot: 0.3, offset: off });
  }
  // sloped glass: windshield and backlight
  for (const [name, base, top, front] of [['windshield', spec.key.cowl, spec.key.roofFront, true], ['backlight', spec.key.rearBase, spec.key.roofRear, false]]) {
    const sp = slopeProjection(fn, base, top, front);
    const Wg = 2.8;
    const P = new Painter(Wg, sp.length + 0.4, { pxPerUnit: 260 * res, x0: -Wg / 2, y0: -0.15, layers: ['color', 'metal', 'glass'], maxPx: 900 * res });
    d[name]?.(P, c, sp);
    add(P, {
      dir: sp.dir,
      uDir: new THREE.Vector3(0, 0, front ? -1 : 1),
      u0: -Wg / 2,
      uSize: Wg,
      vDir: sp.up,
      v0: sp.origin.dot(sp.up) - 0.15,
      vSize: sp.length + 0.4,
      minDot: 0.45,
      offset: off,
    });
  }
  // roof
  {
    const P = new Painter(L, 2.4, { pxPerUnit: 160 * res, x0: -L / 2, y0: -1.2, layers: ['color', 'metal', 'glass', 'roof'], maxPx: 900 * res });
    d.top?.(P, c);
    // over the cabin only the roof itself takes the top decal, not the upward
    // facing tumblehome below the windows
    const keep = (a, b2, c2) => {
      const x = (a.x + b2.x + c2.x) / 3;
      const y = (a.y + b2.y + c2.y) / 3;
      return x >= spec.key.cowl || x <= spec.key.rearBase || y > fn.beltAt(x) - 0.01;
    };
    add(P, { dir: new THREE.Vector3(0, 1, 0), uDir: new THREE.Vector3(1, 0, 0), u0: -L / 2, uSize: L, vDir: new THREE.Vector3(0, 0, -1), v0: -1.2, vSize: 2.4, minDot: 0.55, offset: off, keep });
  }
  const tpl = { v2: true, lod, spec, body, fn, layers, overlayMats: lightMats, rail, c };
  return tpl;
}

function buildLiveryV2(tpl, cfg) {
  const out = [];
  const livery = cfg.livery || 'none';
  if (livery === 'none') return out;
  const { spec, body, fn } = tpl;
  const k = spec.scale;
  const L = spec.body.length;
  const W = spec.body.width + 0.2;
  const proxy = {
    length: L * k,
    cabin: { beltY: fn.beltAt(spec.key.cowl) * k, front0: spec.key.cowl * k, rear0: spec.key.rearBase * k },
    wheel: { front: spec.body.wheel.front * k, rear: spec.body.wheel.rear * k },
  };
  const color = cfg.liveryColor || '#111111';
  for (const s of [1, -1]) {
    const P = new Painter(L * k, 1.0, { pxPerUnit: 300, x0: (-L * k) / 2, y0: 0, flipX: s < 0, layers: ['color'] });
    drawLiverySide(P, livery, color, proxy, cfg.number ?? 7);
    const g = projectOverlay(body, { dir: new THREE.Vector3(0, 0, s), uDir: new THREE.Vector3(s, 0, 0), u0: -L / 2, uSize: L, vDir: new THREE.Vector3(0, 1, 0), v0: 0, vSize: 1.0 / k, minDot: 0.3, offset: 0.003 });
    const m = overlayMaterial(P, { emissive: false, metal: false });
    m.polygonOffsetFactor = -2;
    out.push({ geometry: g, material: m, order: 2 });
  }
  if (['stripes', 'number', 'flames'].includes(livery)) {
    const P = new Painter((L + 0.1) * k, W * k, { pxPerUnit: 220, x0: (-(L + 0.1) * k) / 2, y0: (-W * k) / 2, layers: ['color'] });
    drawLiveryTop(P, livery, color, proxy);
    const g = projectOverlay(body, { dir: new THREE.Vector3(0, 1, 0), uDir: new THREE.Vector3(1, 0, 0), u0: -L / 2 - 0.05, uSize: L + 0.1, vDir: new THREE.Vector3(0, 0, -1), v0: -W / 2, vSize: W, minDot: 0.3, offset: 0.003 });
    const m = overlayMaterial(P, { emissive: false, metal: false });
    m.polygonOffsetFactor = -2;
    out.push({ geometry: g, material: m, order: 2 });
  }
  return out;
}

function buildPartsV2(group, tpl, cfg, mats) {
  const { spec, fn } = tpl;
  const parts = spec.parts || {};
  const key = spec.key;
  const capMat = (kind) => (kind === 'black' ? trimMat() : kind === 'roof' ? mats.roof : mats.paint);
  // side mirrors: smooth aero housings on a short arm, mounted on the door
  // just behind the A-pillar base with the glass facing back
  if (parts.mirrors) {
    const mx = key.cowl - (parts.mirrorBack ?? 0.16);
    const my = fn.beltAt(mx) + (parts.mirrorUp ?? 0.075);
    const bw = fn.beltWidthAt(mx) - 0.025;
    const shell = sharedGeo('mirrorShell', () => {
      const g = new THREE.SphereGeometry(1, 28, 18);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i);
        const y = p.getY(i);
        const z = p.getZ(i);
        if (x < 0) x *= 0.25;
        const t = (z + 1) / 2;
        const taper = 0.7 + 0.3 * Math.sin((Math.min(1, t * 1.5) * Math.PI) / 2);
        p.setXYZ(i, x * 0.075 * taper, y * 0.068 * taper - (1 - t) * 0.012, z * 0.13);
      }
      g.computeVertexNormals();
      // lower third in a second material group (black base under a body-colour cap)
      const idx = g.index.array;
      const top = [];
      const bottom = [];
      for (let t = 0; t < idx.length; t += 3) {
        const cy = (p.getY(idx[t]) + p.getY(idx[t + 1]) + p.getY(idx[t + 2])) / 3;
        (cy < -0.03 ? bottom : top).push(idx[t], idx[t + 1], idx[t + 2]);
      }
      g.setIndex([...top, ...bottom]);
      g.addGroup(0, top.length, 0);
      g.addGroup(top.length, bottom.length, 1);
      return g;
    });
    const glassGeo = sharedGeo('mirrorFace', () => {
      const g = new THREE.CircleGeometry(1, 28);
      g.scale(0.115, 0.056, 1);
      return g;
    });
    for (const s of [1, -1]) {
      const g = new THREE.Group();
      const arm = new THREE.Mesh(roundedBox(0.075, 0.032, 0.11, 0.014), trimMat());
      arm.position.set(-0.005, -0.03, s * 0.045);
      g.add(arm);
      const cap = capMat(parts.mirrors === 'white' ? 'paint' : parts.mirrors);
      const h = new THREE.Mesh(shell, [cap, parts.mirrorBase ? trimMat() : cap]);
      h.position.set(0, 0, s * 0.165);
      h.scale.z = s;
      h.castShadow = true;
      g.add(h);
      const face = new THREE.Mesh(glassGeo, glassMat(0.15));
      face.rotation.y = -Math.PI / 2;
      face.position.set(-0.021, -0.004, s * 0.17);
      g.add(face);
      g.position.set(mx, my, s * bw);
      g.scale.setScalar(parts.mirrorScale ?? 1);
      group.add(g);
    }
  }
  // roof rails
  if (parts.roofRails) {
    const x0 = key.roofFront - 0.12;
    const x1 = key.roofRear + 0.08;
    for (const s of [1, -1]) {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const x = x0 + ((x1 - x0) * i) / 12;
        pts.push(new THREE.Vector3(x, fn.roofAt(x) - 0.012, s * (fn.roofWidthAt(x) - 0.11)));
      }
      const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.016, 8, false), trimMat());
      rail.castShadow = true;
      group.add(rail);
      for (const p of [pts[0], pts[pts.length - 1]]) {
        const foot = new THREE.Mesh(roundedBox(0.09, 0.05, 0.04, 0.012), trimMat());
        foot.position.set(p.x, p.y - 0.025, p.z);
        group.add(foot);
      }
    }
  }
  // roof spoiler / wing
  let spoiler = cfg.spoiler && cfg.spoiler !== 'default' ? cfg.spoiler : parts.spoiler || 'none';
  if (spoiler === 'lip' || spoiler === 'duck') spoiler = 'roof';
  if (spoiler === 'roof') {
    const x = key.roofRear;
    const w = fn.roofWidthAt(x) * 2 * 0.86;
    const mat = parts.spoilerColor === 'black' ? trimMat() : parts.spoilerColor === 'roof' ? mats.roof : mats.paint;
    const m = new THREE.Mesh(roundedBox(0.22, 0.024, w, 0.01), mat);
    m.position.set(x - 0.06, fn.roofAt(x) - 0.012, 0);
    m.rotation.z = 0.1;
    m.castShadow = true;
    group.add(m);
  } else if (spoiler === 'wing') {
    const x = -fn.half + 0.25;
    const y = fn.beltAt(x) + 0.32;
    const w = fn.widthAt(x) * 2 * 0.95;
    const wing = new THREE.Mesh(roundedBox(0.28, 0.035, w, 0.014), trimMat());
    wing.position.set(x, y, 0);
    wing.rotation.z = 0.08;
    group.add(wing);
    for (const s of [1, -1]) {
      const post = new THREE.Mesh(roundedBox(0.1, 0.3, 0.03, 0.01), trimMat());
      post.position.set(x, y - 0.15, s * w * 0.3);
      group.add(post);
    }
  }
  const half = fn.half;
  const mid = (key.roofFront + key.roofRear) / 2;
  if (spoiler === 'lip') {
    const x = -half + 0.12;
    const w = fn.widthAt(x) * 2 * 0.9;
    const m = new THREE.Mesh(roundedBox(0.16, 0.04, w, 0.012), parts.spoilerColor === 'black' ? trimMat() : mats.paint);
    m.position.set(x, fn.roofAt(x) + 0.012, 0);
    m.rotation.z = 0.18;
    m.castShadow = true;
    group.add(m);
  }
  if (parts.taxiSign) {
    const P = new Painter(0.6, 0.18, { x0: -0.3, y0: -0.09, pxPerUnit: 400, layers: ['color', 'glow'] });
    P.fill(crect(0, 0, 0.6, 0.18, 0.03), '#ffe75a', { glow: '#7a6410' });
    P.text('TAXI', 0, 0, 0.12, '#151515');
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.17, 0.6), new THREE.MeshStandardMaterial({ map: P.texture('color'), emissiveMap: P.texture('glow'), emissive: 0xffffff, emissiveIntensity: 1, roughness: 0.4 }));
    m.material.userData.own = true;
    m.position.set(mid, fn.roofAt(mid) + 0.08, 0);
    m.rotation.y = Math.PI / 2;
    m.castShadow = true;
    m.userData.ownMaterial = true;
    group.add(m);
  }
  if (parts.lightBar) {
    const y = fn.roofAt(mid);
    const base = new THREE.Mesh(roundedBox(0.22, 0.06, 1.15, 0.02), trimMat());
    base.position.set(mid + 0.1, y + 0.03, 0);
    group.add(base);
    const red = sharedMat('sirenRed', () => new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff0000, emissiveIntensity: 0.8, roughness: 0.2 }));
    const blue = sharedMat('sirenBlue', () => new THREE.MeshStandardMaterial({ color: 0x2050ff, emissive: 0x0030ff, emissiveIntensity: 0.8, roughness: 0.2 }));
    for (const s of [1, -1]) {
      const l = new THREE.Mesh(roundedBox(0.18, 0.09, 0.5, 0.035), s > 0 ? red : blue);
      l.position.set(mid + 0.1, y + 0.1, s * 0.28);
      group.add(l);
    }
    group.userData.sirens = [red, blue];
  }
  if (parts.hoodScoop) {
    const x = (key.cowl + half) / 2 - 0.1;
    const m = new THREE.Mesh(roundedBox(0.6, 0.12, 0.5, 0.05), mats.paint);
    m.position.set(x, fn.roofAt(x) + 0.03, 0);
    m.castShadow = true;
    group.add(m);
    const hole = new THREE.Mesh(roundedBox(0.03, 0.07, 0.4, 0.012), darkMat());
    hole.position.set(x + 0.3, fn.roofAt(x) + 0.05, 0);
    group.add(hole);
  }
  if (parts.spareWheel) {
    const { group: sw } = buildWheel({ radius: spec.body.wheel.radius * 0.95, width: 0.26, style: 'dish', rimMaterial: mats.rim });
    sw.rotation.y = -Math.PI / 2;
    sw.position.set(-half - 0.13, (spec.body.wheel.radius + fn.roofAt(-half + 0.05)) * 0.55, 0);
    group.add(sw);
  }
  if (parts.exhaust) {
    const n = parts.exhaust;
    const geo = sharedGeo('exhaust', () => new THREE.CylinderGeometry(0.045, 0.045, 0.14, 16).rotateZ(Math.PI / 2));
    const y = fn.sillAt(-half + 0.1) + 0.03;
    const zs = n === 1 ? [0.45] : n === 2 ? [0.5, -0.5] : [0.55, 0.42, -0.42, -0.55];
    for (const z of zs) {
      const p = new THREE.Mesh(geo, chromeMat());
      p.position.set(-half + 0.02, y, z * (spec.body.width / 1.9));
      group.add(p);
    }
  }
  if (parts.pushBar) {
    const bot = fn.sillAt(half - 0.05);
    const top = fn.roofAt(half - 0.1) - 0.12;
    for (const s of [1, -1]) {
      const post = new THREE.Mesh(roundedBox(0.06, top - bot, 0.06, 0.02), trimMat());
      post.position.set(half + 0.06, (top + bot) / 2, s * 0.32);
      group.add(post);
    }
    const bar = new THREE.Mesh(roundedBox(0.06, 0.06, 0.8, 0.02), trimMat());
    bar.position.set(half + 0.07, top - 0.05, 0);
    group.add(bar);
    const bar2 = bar.clone();
    bar2.position.y = bot + 0.12;
    group.add(bar2);
  }
  // aluminium running boards between the wheels
  if (parts.steps) {
    const w = spec.body.wheel;
    const r = w.radius + (w.archGap ?? 0.045);
    const x0 = w.rear + r + 0.06;
    const x1 = w.front - r - 0.06;
    const len = x1 - x0;
    const alu = sharedMat('stepAlu', () => new THREE.MeshStandardMaterial({ color: 0xb9bec6, metalness: 0.9, roughness: 0.32 }));
    for (const s of [1, -1]) {
      const z = s * (fn.widthAt((x0 + x1) / 2) - 0.035);
      const base = new THREE.Mesh(roundedBox(len, 0.05, 0.13, 0.02), trimMat());
      base.position.set((x0 + x1) / 2, 0.29, z);
      group.add(base);
      const top = new THREE.Mesh(roundedBox(len - 0.04, 0.018, 0.115, 0.008), alu);
      top.position.set((x0 + x1) / 2, 0.318, z + s * 0.004);
      group.add(top);
      for (let k = 0; k < 3; k++) {
        const strip = new THREE.Mesh(roundedBox(len - 0.12, 0.008, 0.012, 0.004), darkMat());
        strip.position.set((x0 + x1) / 2, 0.329, z + s * (k - 1) * 0.034);
        group.add(strip);
      }
    }
  }
  if (parts.mudflaps) {
    for (const s of [1, -1]) {
      for (const ax of [spec.body.wheel.front, spec.body.wheel.rear]) {
        const m = new THREE.Mesh(roundedBox(0.012, 0.22, 0.26, 0.004), darkMat());
        m.position.set(ax - spec.body.wheel.radius - 0.1, 0.18, s * (fn.widthAt(ax) - 0.16));
        group.add(m);
      }
    }
  }
  // shark-fin antenna
  if (parts.fin) {
    const sh = new THREE.Shape();
    sh.moveTo(0, 0);
    sh.lineTo(0.17, 0);
    sh.quadraticCurveTo(0.06, 0.03, 0.02, 0.065);
    sh.quadraticCurveTo(-0.005, 0.03, 0, 0);
    const fin = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 }), trimMat());
    const fx = key.roofRear + 0.25;
    fin.position.set(fx, fn.roofAt(fx) - 0.004, -0.02);
    fin.rotation.y = Math.PI;
    fin.position.x += 0.17;
    group.add(fin);
  }
}

function createCarV2(tpl, cfg, { shadows = true, blobShadow = true } = {}) {
  const { spec, fn } = tpl;
  const b = spec.body;
  const k = spec.scale;
  const root = new THREE.Group();
  root.name = `car:${cfg.model}`;
  const scaled = new THREE.Group();
  scaled.scale.setScalar(k);
  root.add(scaled);
  const bodyGroup = new THREE.Group();
  scaled.add(bodyGroup);
  bodyGroup.position.y = -0.012 * (cfg.lower || 0);

  const paint = makePaintMaterial(cfg.paint, cfg.finish);
  const roofPaint = cfg.roof ? makePaintMaterial(cfg.roof, cfg.finish === 'chrome' ? 'gloss' : cfg.finish) : null;
  const rimMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(cfg.rimColor), metalness: 0.75, roughness: 0.28 });
  const caliperMat = cfg.caliper ? new THREE.MeshStandardMaterial({ color: new THREE.Color(cfg.caliper), roughness: 0.4, metalness: 0.2 }) : null;
  const accent = spec.wheelDef?.accent && (cfg.rim || spec.wheel.style) === spec.wheelDef.style ? sharedMat(`accent:${spec.wheelDef.accent}`, () => new THREE.MeshStandardMaterial({ color: spec.wheelDef.accent, metalness: 1, roughness: 0.18 })) : null;
  const mats = { paint, roof: roofPaint || paint, rim: rimMat };

  const body = new THREE.Mesh(tpl.body, [paint, paint, paint, trimMat(), chromeMat()]);
  body.castShadow = shadows;
  bodyGroup.add(body);

  const ownMats = [];
  for (const layer of tpl.layers) {
    let material;
    if (layer.kind === 'roof') {
      if (!roofPaint) continue;
      material = makePaintMaterial(cfg.roof, cfg.finish === 'chrome' ? 'gloss' : cfg.finish);
      Object.assign(material, { alphaMap: layer.alpha, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      ownMats.push(material);
    } else if (layer.kind === 'glass') {
      material = glassOverlayMat(layer.alpha, cfg.tint ?? 0.5);
    } else {
      material = layer.material;
    }
    const m = new THREE.Mesh(layer.geometry, material);
    m.renderOrder = layer.order;
    bodyGroup.add(m);
  }
  for (const o of buildLiveryV2(tpl, cfg)) {
    const m = new THREE.Mesh(o.geometry, o.material);
    m.renderOrder = o.order;
    m.userData.ownMaterial = true;
    bodyGroup.add(m);
  }
  buildPartsV2(bodyGroup, tpl, cfg, mats);

  const wheels = [];
  const wr = b.wheel.radius;
  for (const ax of [b.wheel.front, b.wheel.rear]) {
    for (const s of [1, -1]) {
      const { group, spin } = buildWheel({
        radius: wr,
        width: b.wheel.width,
        style: cfg.rim || spec.wheel.style,
        rimMaterial: rimMat,
        caliperMaterial: caliperMat,
        rimRatio: spec.wheelDef?.rimRatio ?? 0.66,
        accentMaterial: accent,
        lod: tpl.lod,
      });
      const holder = new THREE.Group();
      holder.position.set(ax, wr, s * (fn.widthAt(ax) - b.wheel.width / 2 - 0.012));
      if (s < 0) group.rotation.y = Math.PI;
      holder.add(group);
      scaled.add(holder);
      group.traverse((o) => { if (o.isMesh) o.castShadow = shadows; });
      wheels.push({ holder, spin, side: s, front: ax > 0 });
    }
  }

  const Lw = b.length * k;
  const Ww = b.width * k;
  if (blobShadow) {
    const sh = new THREE.Mesh(
      new THREE.PlaneGeometry(Lw * 1.1, Ww * 1.3),
      new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: 0.9 }),
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = 0.012;
    sh.renderOrder = -1;
    sh.userData.ownMaterial = true;
    root.add(sh);
  }
  if (cfg.neon) {
    const neon = new THREE.Mesh(
      new THREE.PlaneGeometry(Lw * 1.25, Ww * 1.5),
      new THREE.MeshBasicMaterial({ map: glowTex(), color: new THREE.Color(cfg.neon), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }),
    );
    neon.rotation.x = -Math.PI / 2;
    neon.position.y = 0.02;
    neon.userData.ownMaterial = true;
    root.add(neon);
  }

  let maxRoof = 0;
  for (let x = -fn.half; x <= fn.half; x += 0.05) maxRoof = Math.max(maxRoof, fn.roofAt(x));
  let wheelAngle = 0;
  const api = {
    cfg,
    spec,
    length: Lw,
    width: Ww,
    height: maxRoof * k,
    wheels,
    bodyGroup,
    spinWheels(distance) {
      wheelAngle -= distance / (wr * k);
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
      roofPaint?.dispose();
      for (const m of ownMats) m.dispose();
      rimMat.dispose();
      caliperMat?.dispose();
      root.traverse((o) => {
        if (o.isMesh && o.userData.ownMaterial) {
          o.material.map?.dispose();
          o.material.dispose();
          o.geometry.dispose();
        }
      });
    },
  };
  root.userData.car = api;
  return root;
}

/** Pre-builds templates so the first spawn of each model does not hitch. */
export function warmTemplates(ids, lod = 'high') {
  for (const id of ids) getTemplate(id, lod);
}
