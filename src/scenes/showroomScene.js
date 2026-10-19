// Studio scene used by the car dealer and the paint & tune shop: a blue
// cyclorama with white court lines (like the smart #2 launch photo) and a
// slowly rotating turntable.

import * as THREE from 'three';
import { createCar } from '../cars/carFactory.js';
import { canvasTexture } from '../world/textures.js';
import { clamp, damp } from '../core/util.js';

export class ShowroomScene {
  constructor(engine) {
    this.engine = engine;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1d46b8');
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    this.yaw = 0.7;
    this.targetYaw = 0.7;
    this.pitch = 0.22;
    this.dist = 7.4;
    this.autoSpin = true;
    this.offsetX = 0;
    this.pointer = null;
    this.car = null;
    this.build();
  }

  build() {
    const s = this.scene;
    const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x1a2f80, 1.1);
    s.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(4, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 });
    s.add(key);
    const rim = new THREE.DirectionalLight(0xbfd4ff, 1.2);
    rim.position.set(-6, 4, -4);
    s.add(rim);

    // Cyclorama: floor + curved back wall in one lathe-like sweep
    const floorTex = canvasTexture('studio-floor', 1024, 1024, (ctx, w) => {
      ctx.fillStyle = '#2350c8';
      ctx.fillRect(0, 0, w, w);
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(w * 0.05, w * 0.72);
      ctx.lineTo(w * 0.95, w * 0.52);
      ctx.moveTo(w * 0.3, w * 0.98);
      ctx.lineTo(w * 0.62, w * 0.02);
      ctx.moveTo(w * 0.0, w * 0.35);
      ctx.lineTo(w * 0.5, w * 0.25);
      ctx.stroke();
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.45, metalness: 0.0 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    s.add(floor);
    const wallTex = canvasTexture('studio-wall', 2048, 512, (ctx, w, h) => {
      ctx.fillStyle = '#2049bd';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.95);
      ctx.lineTo(w * 0.42, h * 0.2);
      ctx.lineTo(w * 0.7, h * 0.32);
      ctx.lineTo(w * 0.66, h * 0.95);
      ctx.stroke();
    });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 12, 64, 1, true, Math.PI * 0.6, Math.PI * 0.8), new THREE.MeshStandardMaterial({ map: wallTex, side: THREE.BackSide, roughness: 0.8 }));
    wall.position.y = 6;
    s.add(wall);
    this.wall = wall;

    // Big badge text on the wall (updated per car)
    this.badgeCanvas = document.createElement('canvas');
    this.badgeCanvas.width = 1024;
    this.badgeCanvas.height = 256;
    this.badgeTex = new THREE.CanvasTexture(this.badgeCanvas);
    this.badgeTex.colorSpace = THREE.SRGBColorSpace;
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), new THREE.MeshBasicMaterial({ map: this.badgeTex, transparent: true }));
    badge.position.set(-2.5, 4.4, -9.5);
    badge.lookAt(0, 3, 0);
    s.add(badge);
    this.setBadge('CAR TOWN');

    // Turntable
    const tt = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.35, 0.1, 64), new THREE.MeshStandardMaterial({ color: '#c9d3e6', roughness: 0.25, metalness: 0.6 }));
    base.position.y = 0.05;
    base.receiveShadow = true;
    tt.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.025, 8, 80), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    tt.add(ring);
    s.add(tt);
    this.turntable = tt;
    this.carHolder = new THREE.Group();
    this.carHolder.position.y = 0.1;
    tt.add(this.carHolder);
  }

  setBadge(text) {
    const c = this.badgeCanvas;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    let size = 190;
    ctx.font = `900 ${size}px Arial Black, Arial`;
    while (ctx.measureText(text).width > c.width * 0.95 && size > 40) {
      size -= 8;
      ctx.font = `900 ${size}px Arial Black, Arial`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, c.width / 2, c.height / 2);
    this.badgeTex.needsUpdate = true;
  }

  setCar(cfg) {
    if (this.car) {
      this.carHolder.remove(this.car);
      this.car.userData.car.dispose();
    }
    this.car = createCar(cfg);
    this.carHolder.add(this.car);
    const L = this.car.userData.car.length;
    this.dist = 4.6 + L * 1.25;
  }

  onResize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  onPointerDown(e) {
    this.pointer = { x: e.clientX, yaw: this.targetYaw };
    this.autoSpin = false;
  }

  onPointerMove(e) {
    if (!this.pointer) return;
    this.targetYaw = this.pointer.yaw + (e.clientX - this.pointer.x) * 0.01;
  }

  onPointerUp() {
    this.pointer = null;
  }

  onWheel(e) {
    this.dist = clamp(this.dist * (e.deltaY > 0 ? 1.08 : 0.92), 4, 14);
  }

  update(dt, time) {
    if (this.autoSpin) this.targetYaw += dt * 0.35;
    this.yaw = damp(this.yaw, this.targetYaw, 8, dt);
    this.turntable.rotation.y = this.yaw;
    const cam = this.camera;
    const tgt = new THREE.Vector3(0, 0.55, 0);
    cam.position.set(Math.sin(0.35) * this.dist, 0.6 + Math.sin(this.pitch) * this.dist, Math.cos(0.35) * this.dist);
    cam.lookAt(tgt);
    // shift the view so the car sits left of the side panel
    cam.setViewOffset(this.engine.width, this.engine.height, -this.offsetX * this.engine.width, 0, this.engine.width, this.engine.height);
    this.car?.userData.car.setSiren(time);
    this.car?.userData.car.spinWheels(0);
  }

  exit() {
    this.camera.clearViewOffset();
  }
}
