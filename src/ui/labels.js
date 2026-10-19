// HTML elements anchored to 3D positions (speech bubbles, names, progress
// rings, floating "+coins" texts).

import * as THREE from 'three';

const v = new THREE.Vector3();

export class WorldLabels {
  constructor(parent) {
    this.root = document.createElement('div');
    this.root.className = 'world-labels';
    parent.appendChild(this.root);
    this.items = new Set();
  }

  /** anchor: Object3D or Vector3 or () => Vector3 */
  add(el, anchor, { offsetY = 0, className = '' } = {}) {
    const wrap = document.createElement('div');
    wrap.className = `wlabel ${className}`;
    wrap.appendChild(el);
    this.root.appendChild(wrap);
    const item = { wrap, el, anchor, offsetY };
    this.items.add(item);
    return {
      el: wrap,
      remove: () => {
        wrap.remove();
        this.items.delete(item);
      },
      setAnchor: (a) => { item.anchor = a; },
    };
  }

  /** One-shot floating text that rises and fades. */
  float(text, anchor, { className = 'float-coins', offsetY = 1.6, delay = 0 } = {}) {
    const el = document.createElement('div');
    el.className = `float-text ${className}`;
    el.textContent = text;
    el.style.animationDelay = `${delay}s`;
    const h = this.add(el, anchor instanceof THREE.Vector3 ? anchor.clone() : anchor, { offsetY });
    setTimeout(() => h.remove(), 1800 + delay * 1000);
    return h;
  }

  update(camera, width, height) {
    for (const it of this.items) {
      const a = it.anchor;
      if (!a) continue;
      if (a.isObject3D) a.getWorldPosition(v);
      else if (typeof a === 'function') v.copy(a());
      else v.copy(a);
      v.y += it.offsetY;
      v.project(camera);
      const hidden = v.z > 1 || v.z < -1;
      it.wrap.style.display = hidden ? 'none' : '';
      it.wrap.style.transform = `translate(${((v.x + 1) / 2) * width}px, ${((1 - v.y) / 2) * height}px)`;
    }
  }

  clear() {
    for (const it of [...this.items]) it.wrap.remove();
    this.items.clear();
  }

  setVisible(on) {
    this.root.style.display = on ? '' : 'none';
  }
}
