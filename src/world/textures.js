// Procedural canvas textures for the world (floors, walls, roads, grass,
// posters, signs). Cached by key.

import * as THREE from 'three';

const cache = new Map();

export function canvasTexture(key, w, h, draw, { repeat = null, srgb = true, mipmaps = true } = {}) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 8;
  if (!mipmaps) tex.generateMipmaps = false;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  cache.set(key, tex);
  return tex;
}

function noise(ctx, w, h, amount = 10, alpha = 0.06) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  void alpha;
}

// --- Floors (one tile per texture repeat) --------------------------------------------
export const FLOOR_DRAW = {
  tile(ctx, s) {
    ctx.fillStyle = '#efe8da';
    ctx.fillRect(0, 0, s, s);
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0.04)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#d6cebd';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, s - 4, s - 4);
    noise(ctx, s, s, 6);
  },
  concrete(ctx, s) {
    ctx.fillStyle = '#b9bcbf';
    ctx.fillRect(0, 0, s, s);
    noise(ctx, s, s, 22);
    ctx.strokeStyle = 'rgba(80,80,80,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, s - 2, s - 2);
  },
  checker(ctx, s) {
    const h = s / 2;
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#1b1c20';
    ctx.fillRect(0, 0, h, h);
    ctx.fillRect(h, h, h, h);
    noise(ctx, s, s, 5);
  },
  dark(ctx, s) {
    ctx.fillStyle = '#2a2b30';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#3a3c42';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        ctx.save();
        ctx.translate((x + 0.5 + (y % 2) * 0.5) * (s / 8), (y + 0.5) * (s / 8));
        ctx.rotate(((x + y) % 2 ? 1 : -1) * 0.7);
        ctx.fillRect(-s / 40, -s / 120, s / 20, s / 60);
        ctx.restore();
      }
    }
    ctx.strokeStyle = '#18191c';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, s - 2, s - 2);
  },
  wood(ctx, s) {
    const cols = ['#b77b45', '#a96f3d', '#c48852', '#9e6537'];
    const n = 4;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(0, (i * s) / n, s, s / n);
      ctx.strokeStyle = 'rgba(60,30,10,0.25)';
      ctx.lineWidth = 2;
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        const y = (i * s) / n + 4 + k * (s / n / 4);
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(s * 0.3, y + 3, s * 0.6, y - 3, s, y + 1);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(40,20,5,0.5)';
      ctx.fillRect(0, ((i + 1) * s) / n - 2, s, 2);
    }
    noise(ctx, s, s, 8);
  },
  blue(ctx, s) {
    ctx.fillStyle = '#2a58c8';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, s - 3, s - 3);
    noise(ctx, s, s, 6);
  },
};

export function floorTexture(type, tiles) {
  const tex = canvasTexture(`floor:${type}`, 128, 128, (ctx, s) => FLOOR_DRAW[type](ctx, s), { repeat: [1, 1] });
  const t = tex.clone();
  t.needsUpdate = true;
  t.repeat.set(tiles, tiles);
  return t;
}

// --- Walls ------------------------------------------------------------------------
export const WALL_STYLE = {
  white: { base: '#eceff2', band: '#3e5a8c', trim: '#c9d0d8' },
  yellow: { base: '#f6dc6a', band: '#2b2d31', trim: '#d9b93f' },
  brick: { base: '#b5523b', band: '#3b2a24', trim: '#8f3d2c', brick: true },
  blue: { base: '#3f73d6', band: '#f3f3f1', trim: '#2c56a8' },
  dark: { base: '#34363d', band: '#ff2bd6', trim: '#24262b' },
  racing: { base: '#e9e9e9', band: '#d9262b', trim: '#1b1c20', checker: true },
};

export function wallTexture(theme) {
  const st = WALL_STYLE[theme] || WALL_STYLE.white;
  return canvasTexture(`wall:${theme}`, 256, 256, (ctx, s) => {
    ctx.fillStyle = st.base;
    ctx.fillRect(0, 0, s, s);
    if (st.brick) {
      ctx.strokeStyle = 'rgba(70,30,20,0.55)';
      ctx.lineWidth = 3;
      const bh = s / 12;
      for (let r = 0; r < 12; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * bh);
        ctx.lineTo(s, r * bh);
        ctx.stroke();
        for (let c = 0; c < 4; c++) {
          const x = c * (s / 4) + (r % 2) * (s / 8);
          ctx.beginPath();
          ctx.moveTo(x, r * bh);
          ctx.lineTo(x, (r + 1) * bh);
          ctx.stroke();
        }
      }
    } else {
      ctx.strokeStyle = 'rgba(0,0,0,0.07)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(1, 0);
      ctx.lineTo(1, s);
      ctx.stroke();
    }
    // lower trim band
    ctx.fillStyle = st.trim;
    ctx.fillRect(0, s * 0.86, s, s * 0.14);
    if (st.checker) {
      const q = s / 16;
      for (let i = 0; i < 16; i++) {
        for (let r = 0; r < 2; r++) {
          ctx.fillStyle = (i + r) % 2 ? '#1b1c20' : '#f3f3f3';
          ctx.fillRect(i * q, s * 0.08 + r * q, q, q);
        }
      }
    } else {
      ctx.fillStyle = st.band;
      ctx.fillRect(0, s * 0.1, s, s * 0.05);
    }
    noise(ctx, s, s, 5);
  }, { repeat: [1, 1] });
}

// --- Ground ------------------------------------------------------------------------
export function grassTexture() {
  return canvasTexture('grass', 256, 256, (ctx, s) => {
    ctx.fillStyle = '#6cc04a';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(90,170,55,0.5)' : 'rgba(130,210,90,0.45)';
      const x = Math.random() * s;
      const y = Math.random() * s;
      ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }
  }, { repeat: [40, 40] });
}

export function asphaltTexture() {
  return canvasTexture('asphalt', 256, 256, (ctx, s) => {
    ctx.fillStyle = '#8b8e93';
    ctx.fillRect(0, 0, s, s);
    noise(ctx, s, s, 26);
  }, { repeat: [8, 8] });
}

export function darkAsphaltTexture() {
  return canvasTexture('asphalt-dark', 256, 256, (ctx, s) => {
    ctx.fillStyle = '#3d3f44';
    ctx.fillRect(0, 0, s, s);
    noise(ctx, s, s, 24);
  }, { repeat: [8, 8] });
}

export function sidewalkTexture() {
  return canvasTexture('sidewalk', 128, 128, (ctx, s) => {
    ctx.fillStyle = '#ddd6c6';
    ctx.fillRect(0, 0, s, s);
    noise(ctx, s, s, 10);
    ctx.strokeStyle = 'rgba(120,110,95,0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, s - 2, s - 2);
  }, { repeat: [1, 1] });
}

// --- Signs & posters -----------------------------------------------------------------
export function posterTexture(variant = 0) {
  return canvasTexture(`poster:${variant}`, 128, 160, (ctx, w, h) => {
    const bgs = ['#1f4fb6', '#d9262b', '#1b1c20', '#f2b705', '#1e9e4a', '#7a3fd0'];
    ctx.fillStyle = '#f3f3f3';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = bgs[variant % bgs.length];
    ctx.fillRect(6, 6, w - 12, h - 12);
    // stylised car silhouette
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.62, w * 0.36, h * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w / 2 - 4, h * 0.53, w * 0.2, h * 0.08, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(w * 0.3, h * 0.7, 9, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(w * 0.7, h * 0.7, 9, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial Black, Arial';
    ctx.textAlign = 'center';
    const words = ['TURBO', 'RACE', 'GT', 'SPEED', 'MOTORS', 'NITRO'];
    ctx.fillText(words[variant % words.length], w / 2, h * 0.25);
  });
}

export function signTexture(key, text, { bg = '#d9262b', fg = '#fff', w = 512, h = 128, font = 'Arial Black, Arial', border = '#fff', sub = '' } = {}) {
  return canvasTexture(`sign:${key}`, w, h, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = border;
    ctx.lineWidth = Math.max(4, h * 0.06);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = h * (sub ? 0.46 : 0.6);
    ctx.font = `900 ${size}px ${font}`;
    while (ctx.measureText(text).width > w * 0.9 && size > 8) {
      size -= 2;
      ctx.font = `900 ${size}px ${font}`;
    }
    ctx.fillText(text, w / 2, sub ? h * 0.4 : h / 2);
    if (sub) {
      ctx.font = `700 ${h * 0.2}px Arial`;
      ctx.fillText(sub, w / 2, h * 0.76);
    }
  });
}

export function billboardTexture() {
  return canvasTexture('billboard', 512, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#2a7be4');
    g.addColorStop(1, '#0d3a8a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 80 - 60, h);
      ctx.lineTo(i * 80 + 20, 0);
      ctx.lineTo(i * 80 + 50, 0);
      ctx.lineTo(i * 80 - 30, h);
      ctx.fill();
    }
    ctx.font = '900 64px Arial Black, Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#0b1f4d';
    ctx.strokeText('CAR TOWN', w / 2, 92);
    ctx.fillStyle = '#ffd21a';
    ctx.fillText('CAR TOWN', w / 2, 92);
    ctx.font = '800 26px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText('NEW: smart #2 · IONIQ 3 · AMG', w / 2, 140, w - 40);
    ctx.fillText('Frontera · Musso · Vapid', w / 2, 174, w - 40);
    ctx.font = '700 22px Arial';
    ctx.fillText('at the Car Dealer today!', w / 2, 208, w - 40);
  });
}

export function radialTexture(key, inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  return canvasTexture(`radial:${key}`, 128, 128, (ctx, w) => {
    const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, w);
  });
}

export function windowsTexture(key, { base = '#c8b89a', win = '#2b3c55', lit = '#ffe9a3', cols = 4, rows = 3 } = {}) {
  return canvasTexture(`windows:${key}`, 256, 256, (ctx, s) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    noise(ctx, s, s, 8);
    const cw = s / cols;
    const rh = s / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = '#f2f2f2';
        ctx.fillRect(c * cw + cw * 0.18, r * rh + rh * 0.2, cw * 0.64, rh * 0.56);
        ctx.fillStyle = Math.random() < 0.18 ? lit : win;
        ctx.fillRect(c * cw + cw * 0.22, r * rh + rh * 0.24, cw * 0.56, rh * 0.48);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(c * cw + cw * 0.22, r * rh + rh * 0.24, cw * 0.2, rh * 0.48);
      }
    }
  }, { repeat: [1, 1] });
}
