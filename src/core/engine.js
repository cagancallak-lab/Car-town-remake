// Renderer, main loop and scene switching.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export class Engine {
  constructor(container) {
    this.container = container;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    renderer.domElement.className = 'game-canvas';
    this.renderer = renderer;

    const pmrem = new THREE.PMREMGenerator(renderer);
    this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.clock = new THREE.Clock();
    this.active = null;
    this.time = 0;
    this.keys = new Set();
    this.listeners = [];
    this.paused = false;

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      this.keys.add(e.code);
      this.active?.onKeyDown?.(e);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.active?.onKeyUp?.(e);
    });
    window.addEventListener('blur', () => this.keys.clear());

    const el = renderer.domElement;
    el.addEventListener('pointerdown', (e) => this.active?.onPointerDown?.(e));
    el.addEventListener('pointermove', (e) => this.active?.onPointerMove?.(e));
    window.addEventListener('pointerup', (e) => this.active?.onPointerUp?.(e));
    el.addEventListener('wheel', (e) => { e.preventDefault(); this.active?.onWheel?.(e); }, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());

    this.resize();
    renderer.setAnimationLoop(() => this.frame());
  }

  get width() { return this.container.clientWidth || window.innerWidth; }
  get height() { return this.container.clientHeight || window.innerHeight; }

  resize() {
    const w = this.width;
    const h = this.height;
    this.renderer.setSize(w, h);
    this.active?.onResize?.(w, h);
  }

  setScene(controller) {
    if (this.active === controller) return;
    this.active?.exit?.();
    this.active = controller;
    if (controller) {
      controller.scene.environment = this.envMap;
      controller.enter?.();
      controller.onResize?.(this.width, this.height);
    }
  }

  onFrame(fn) {
    this.listeners.push(fn);
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.paused) return;
    this.time += dt;
    for (const fn of this.listeners) fn(dt, this.time);
    const a = this.active;
    if (!a) return;
    a.update?.(dt, this.time);
    this.renderer.render(a.scene, a.camera);
  }

  /** Converts a pointer event to normalised device coordinates. */
  ndc(e) {
    const r = this.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  screenshot() {
    return this.renderer.domElement.toDataURL('image/png');
  }
}
