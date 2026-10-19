// Multi-layer canvas painter used to draw car fascias (lights, grilles,
// plates, badges) and liveries. Every shape is drawn simultaneously into a
// colour layer, an emissive ("glow") layer and a metalness layer, so the
// same drawing code yields glowing headlights and shiny chrome trim.
//
// Drawing coordinates are in world units with +y up; the painter maps them to
// canvas pixels so artwork lines up with the projected overlay UVs.

import * as THREE from 'three';

export class Painter {
  /**
   * @param {number} width  world width covered by the canvas
   * @param {number} height world height covered by the canvas
   * @param {object} opts { pxPerUnit, x0, y0, flipX, layers }
   */
  constructor(width, height, { pxPerUnit = 300, x0 = -width / 2, y0 = 0, flipX = false, layers = ['color', 'glow', 'metal'] } = {}) {
    this.width = width;
    this.height = height;
    this.x0 = x0;
    this.y0 = y0;
    this.flipX = flipX;
    const s = Math.min(pxPerUnit, 1024 / width, 1024 / height);
    this.scale = s;
    this.pw = Math.max(8, Math.round(width * s));
    this.ph = Math.max(8, Math.round(height * s));
    this.layers = {};
    for (const name of layers) {
      const canvas = document.createElement('canvas');
      canvas.width = this.pw;
      canvas.height = this.ph;
      const ctx = canvas.getContext('2d');
      if (name !== 'color') {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.pw, this.ph);
      }
      // world -> pixel transform (leave a 1px transparent border so clamped UVs stay clear)
      const sx = (this.pw - 2) / width;
      const sy = (this.ph - 2) / height;
      if (flipX) ctx.setTransform(-sx, 0, 0, -sy, 1 + (x0 + width) * sx, 1 + (y0 + height) * sy);
      else ctx.setTransform(sx, 0, 0, -sy, 1 - x0 * sx, 1 + (y0 + height) * sy);
      this.layers[name] = { canvas, ctx };
    }
    this.ctx = this.layers.color.ctx;
  }

  _each(fn) {
    for (const name in this.layers) fn(this.layers[name].ctx, name);
  }

  /** Fill a Path2D. style: colour string or CanvasGradient factory (ctx)=>gradient */
  fill(path, style, { glow = null, metal = 0, rough = null } = {}) {
    this._each((ctx, name) => {
      if (name === 'color') ctx.fillStyle = typeof style === 'function' ? style(ctx) : style;
      else if (name === 'glow') ctx.fillStyle = glow || '#000';
      else if (name === 'metal') ctx.fillStyle = gray(metal);
      else if (name === 'rough') ctx.fillStyle = gray(rough ?? 0.4);
      ctx.fill(path);
    });
  }

  stroke(path, style, width, { glow = null, metal = 0, cap = 'round', join = 'round' } = {}) {
    this._each((ctx, name) => {
      ctx.lineWidth = width;
      ctx.lineCap = cap;
      ctx.lineJoin = join;
      if (name === 'color') ctx.strokeStyle = typeof style === 'function' ? style(ctx) : style;
      else if (name === 'glow') ctx.strokeStyle = glow || '#000';
      else ctx.strokeStyle = gray(metal);
      ctx.stroke(path);
    });
  }

  /** Erase a shape on every layer (punch holes in colour layer). */
  clear(path) {
    this._each((ctx, name) => {
      ctx.save();
      if (name === 'color') ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000';
      ctx.fill(path);
      ctx.restore();
    });
  }

  text(str, x, y, size, style, { font = 'Arial Black, Arial, sans-serif', weight = '900', align = 'center', glow = null, metal = 0, italic = false, maxWidth } = {}) {
    this._each((ctx, name) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(this.flipX ? -1 : 1, -1);
      ctx.font = `${italic ? 'italic ' : ''}${weight} ${size * 100}px ${font}`;
      ctx.scale(0.01, 0.01);
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      if (name === 'color') ctx.fillStyle = style;
      else if (name === 'glow') ctx.fillStyle = glow || '#000';
      else ctx.fillStyle = gray(metal);
      ctx.fillText(str, 0, 0, maxWidth ? maxWidth * 100 : undefined);
      ctx.restore();
    });
  }

  linear(x0, y0, x1, y1, stops) {
    return (ctx) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      for (const [t, c] of stops) g.addColorStop(t, c);
      return g;
    };
  }

  radial(x, y, r, stops) {
    return (ctx) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      for (const [t, c] of stops) g.addColorStop(t, c);
      return g;
    };
  }

  texture(name, srgb = true) {
    const layer = this.layers[name];
    if (!layer) return null;
    const tex = new THREE.CanvasTexture(layer.canvas);
    tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.anisotropy = 4;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }
}

function gray(v) {
  const c = Math.round(Math.max(0, Math.min(1, v)) * 255);
  return `rgb(${c},${c},${c})`;
}

// --- Path helpers (world units) -------------------------------------------------

export function rrect(x, y, w, h, r) {
  const p = new Path2D();
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  p.moveTo(x + r, y);
  p.lineTo(x + w - r, y);
  p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + h - r);
  p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  p.lineTo(x + r, y + h);
  p.quadraticCurveTo(x, y + h, x, y + h - r);
  p.lineTo(x, y + r);
  p.quadraticCurveTo(x, y, x + r, y);
  p.closePath();
  return p;
}

/** Rounded rect centred on (cx, cy). */
export function crect(cx, cy, w, h, r) {
  return rrect(cx - w / 2, cy - h / 2, w, h, r);
}

export function ellipse(cx, cy, rx, ry, rot = 0) {
  const p = new Path2D();
  p.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2);
  return p;
}

export function circle(cx, cy, r) {
  return ellipse(cx, cy, r, r);
}

export function poly(points, close = true) {
  const p = new Path2D();
  points.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  if (close) p.closePath();
  return p;
}

/** Smooth closed shape through points (Catmull-Rom converted to Béziers). */
export function blob(points, tension = 0.5) {
  const p = new Path2D();
  const n = points.length;
  p.moveTo(points[0][0], points[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const t = tension / 3;
    p.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t,
      p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t,
      p2[0], p2[1],
    );
  }
  p.closePath();
  return p;
}

/** Mirror helper: calls fn(sign) for left (-1) and right (+1). */
export function both(fn) {
  fn(-1);
  fn(1);
}
