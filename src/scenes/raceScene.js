// The drag strip: two lanes, a "Christmas tree" start light, grandstands with
// a cheering crowd, sponsor barriers and a finish gantry.

import * as THREE from 'three';
import { createCar } from '../cars/carFactory.js';
import { darkAsphaltTexture, grassTexture, signTexture, canvasTexture, radialTexture } from '../world/textures.js';
import { mat, box, cylinder, tree } from '../world/props.js';
import { RACE_DISTANCE } from '../game/drag.js';
import { damp, seeded } from '../core/util.js';

const LANE_Z = 1.9;
const TRACK_LEN = 340;

export class RaceScene {
  constructor(engine) {
    this.engine = engine;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#8fd0ff');
    this.scene.fog = new THREE.Fog('#bfe3ff', 90, 260);
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 600);
    this.cars = [null, null];
    this.camMode = 'intro';
    this.camPos = new THREE.Vector3(-12, 3, 0);
    this.camLook = new THREE.Vector3(10, 0.5, 0);
    this.smoke = [];
    this.build();
  }

  build() {
    const s = this.scene;
    s.add(new THREE.HemisphereLight(0xeaf6ff, 0x6d8f4e, 1.2));
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.3);
    sun.position.set(-20, 40, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 120 });
    s.add(sun, sun.target);
    this.sun = sun;

    const grass = new THREE.Mesh(new THREE.PlaneGeometry(900, 400), new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 0.95 }));
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(150, -0.05, 0);
    grass.receiveShadow = true;
    s.add(grass);

    const asphalt = darkAsphaltTexture().clone();
    asphalt.needsUpdate = true;
    asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping;
    asphalt.repeat.set(TRACK_LEN / 6, 2);
    const track = new THREE.Mesh(new THREE.PlaneGeometry(TRACK_LEN, 11), new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.85 }));
    track.rotation.x = -Math.PI / 2;
    track.position.set(TRACK_LEN / 2 - 30, 0, 0);
    track.receiveShadow = true;
    s.add(track);
    // rubbered launch pads
    for (const z of [-LANE_Z, LANE_Z]) {
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(40, 1.6), new THREE.MeshBasicMaterial({ color: '#15161a', transparent: true, opacity: 0.6, depthWrite: false }));
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(18, 0.005, z);
      s.add(pad);
    }
    const white = mat('#f4f4f0', { rough: 0.6 });
    const lineGeo = new THREE.PlaneGeometry(TRACK_LEN, 0.14);
    for (const z of [0, -5.2, 5.2]) {
      const l = new THREE.Mesh(lineGeo, z === 0 ? mat('#f2c21b') : white);
      l.rotation.x = -Math.PI / 2;
      l.position.set(TRACK_LEN / 2 - 30, 0.01, z);
      s.add(l);
    }
    const startLine = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 10.4), white);
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(0, 0.012, 0);
    s.add(startLine);
    const checker = canvasTexture('finish-checker', 64, 256, (ctx) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 4; x++) { ctx.fillStyle = (x + y) % 2 ? '#111' : '#fff'; ctx.fillRect(x * 16, y * 16, 16, 16); }
    });
    const finishLine = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 10.4), new THREE.MeshStandardMaterial({ map: checker, roughness: 0.6 }));
    finishLine.rotation.x = -Math.PI / 2;
    finishLine.position.set(RACE_DISTANCE, 0.012, 0);
    s.add(finishLine);

    // Barriers with sponsor stripes
    const barrierTex = canvasTexture('barrier', 512, 64, (ctx, w, h) => {
      const cols = ['#d9262b', '#f4f4f0'];
      for (let i = 0; i < 16; i++) { ctx.fillStyle = cols[i % 2]; ctx.fillRect(i * 32, 0, 32, h); }
      ctx.fillStyle = 'rgba(20,30,90,0.9)';
      ctx.fillRect(140, 8, 232, 48);
      ctx.fillStyle = '#fff';
      ctx.font = '900 34px Arial Black, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CAR TOWN', 256, 45);
    });
    barrierTex.wrapS = THREE.RepeatWrapping;
    barrierTex.repeat.set(TRACK_LEN / 16, 1);
    for (const z of [-6, 6]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(TRACK_LEN, 0.9, 0.4), [mat('#d6d6d0'), mat('#d6d6d0'), mat('#e9e9e4'), mat('#d6d6d0'), new THREE.MeshStandardMaterial({ map: barrierTex }), new THREE.MeshStandardMaterial({ map: barrierTex })]);
      b.position.set(TRACK_LEN / 2 - 30, 0.45, z);
      b.castShadow = b.receiveShadow = true;
      s.add(b);
    }

    this.buildTree();
    this.buildStands();
    this.buildGantry();

    // distance boards
    for (const [d, label] of [[18.3, '60 FT'], [100.6, '330 FT'], [RACE_DISTANCE, '1/8 MILE']]) {
      const g = new THREE.Group();
      cylinder(g, 0.08, 0.08, 2.4, mat('#555'), 0, 0, 0, 8);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.6), new THREE.MeshStandardMaterial({ map: signTexture(`dist:${label}`, label, { bg: '#1b1c20', fg: '#ffd21a', w: 256, h: 80 }), side: THREE.DoubleSide }));
      p.position.y = 2.6;
      p.rotation.y = -Math.PI / 2;
      g.add(p);
      g.position.set(d, 0, -7.2);
      s.add(g);
    }

    // scenery
    const rng = seeded(77);
    for (let i = 0; i < 70; i++) {
      const t = tree(1.2 + rng() * 1.2, i);
      const side = rng() < 0.5 ? -1 : 1;
      t.position.set(-40 + rng() * 380, 0, side * (22 + rng() * 40));
      s.add(t);
    }
    const hillM = mat('#5fb34a', { rough: 0.95 });
    for (let i = 0; i < 9; i++) {
      const h = new THREE.Mesh(new THREE.SphereGeometry(40 + rng() * 30, 16, 10), hillM);
      h.position.set(-60 + i * 60, -22, (i % 2 ? 1 : -1) * (110 + rng() * 40));
      h.scale.y = 0.55;
      s.add(h);
    }

    // nitro flames & smoke resources
    this.flameMat = new THREE.MeshBasicMaterial({ map: radialTexture('flame', 'rgba(140,200,255,1)', 'rgba(40,80,255,0)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    this.smokeMat = new THREE.SpriteMaterial({ map: radialTexture('smoke', 'rgba(235,235,235,0.9)', 'rgba(235,235,235,0)'), transparent: true, depthWrite: false });
  }

  buildTree() {
    const g = new THREE.Group();
    const dark = mat('#26282d', { rough: 0.5, metal: 0.4 });
    box(g, 0.25, 3.2, 0.25, dark, 0, 0, 0, 0.05);
    box(g, 0.4, 2.0, 1.6, dark, 0, 1.7, 0, 0.08);
    this.lights = { stage: [], amber: [[], [], []], green: [], red: [] };
    const mk = (color, y, z) => {
      const m = new THREE.MeshStandardMaterial({ color: '#333', emissive: color, emissiveIntensity: 0, roughness: 0.3 });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), m);
      bulb.position.set(-0.22, y, z);
      g.add(bulb);
      return m;
    };
    for (const z of [-0.45, 0.45]) {
      this.lights.stage.push(mk('#ffffff', 3.45, z));
      for (let i = 0; i < 3; i++) this.lights.amber[i].push(mk('#ffae00', 3.05 - i * 0.36, z));
      this.lights.green.push(mk('#2bff52', 1.95, z));
      this.lights.red.push(mk('#ff2020', 1.6, z));
    }
    g.position.set(-1.6, 0, 0);
    g.rotation.y = 0;
    this.scene.add(g);
    this.treeGroup = g;
  }

  setTree(stage, ambers, green, red = [false, false]) {
    const set = (arr, on) => arr.forEach((m) => { m.emissiveIntensity = on ? 3 : 0; m.color.set(on ? '#fff' : '#333'); });
    set(this.lights.stage, stage);
    this.lights.amber.forEach((arr, i) => set(arr, ambers > i));
    set(this.lights.green, green);
    this.lights.red.forEach((m, i) => { m.emissiveIntensity = red[i] ? 3 : 0; });
  }

  buildStands() {
    const rng = seeded(5);
    const cols = ['#d9262b', '#2f6fd6', '#f2c21b', '#3aa04a', '#ff6fb3', '#f4f4f0', '#7a3fd0', '#ff8a1a'];
    const seat = mat('#9aa0a8', { rough: 0.6 });
    const people = [];
    for (const side of [-1, 1]) {
      const g = new THREE.Group();
      for (let r = 0; r < 5; r++) {
        box(g, 120, 0.5, 1.2, seat, 0, r * 0.55, r * 1.2 * side, 0.05);
      }
      const roof = box(g, 122, 0.2, 7, mat('#2f6fd6', { rough: 0.5 }), 0, 4.6, 2.4 * side, 0.05);
      roof.castShadow = true;
      for (let i = -3; i <= 3; i++) box(g, 0.25, 4.6, 0.25, mat('#666'), i * 19, 0, 5.4 * side, 0.03);
      g.position.set(40, 0, side * 9.5);
      this.scene.add(g);
      for (let r = 0; r < 5; r++) {
        for (let i = 0; i < 70; i++) {
          if (rng() < 0.18) continue;
          people.push({ x: 40 - 58 + i * (116 / 70) + rng() * 0.5, y: r * 0.55 + 0.5, z: side * (9.5 + r * 1.2), c: cols[Math.floor(rng() * cols.length)], ph: rng() * 6 });
        }
      }
    }
    const body = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.18, 0.25, 3, 6), new THREE.MeshStandardMaterial({ roughness: 0.8 }), people.length);
    const head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshStandardMaterial({ color: '#f1c7a3', roughness: 0.8 }), people.length);
    const m4 = new THREE.Matrix4();
    const col = new THREE.Color();
    people.forEach((p, i) => {
      m4.makeTranslation(p.x, p.y + 0.3, p.z);
      body.setMatrixAt(i, m4);
      body.setColorAt(i, col.set(p.c));
      m4.makeTranslation(p.x, p.y + 0.75, p.z);
      head.setMatrixAt(i, m4);
    });
    this.scene.add(body, head);
    this.crowd = { body, head, people };
  }

  buildGantry() {
    const g = new THREE.Group();
    const steel = mat('#c9ccd1', { rough: 0.3, metal: 0.8 });
    for (const z of [-6.4, 6.4]) box(g, 0.4, 6, 0.4, steel, 0, 0, z, 0.05);
    box(g, 0.5, 1.4, 13.2, mat('#1b1c20'), 0, 5.6, 0, 0.05);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.1), new THREE.MeshStandardMaterial({ map: signTexture('finish', 'FINISH', { bg: '#1b1c20', fg: '#ffd21a', border: '#d9262b' }), emissive: 0xffffff, emissiveIntensity: 0.2 }));
    sign.rotation.y = -Math.PI / 2;
    sign.position.set(-0.27, 6.3, 0);
    g.add(sign);
    g.position.set(RACE_DISTANCE, 0, 0);
    this.scene.add(g);
    // start gantry
    const s = g.clone();
    s.position.set(-3, 0, 0);
    s.children[s.children.length - 1].material = new THREE.MeshStandardMaterial({ map: signTexture('start', 'CAR TOWN DRAG STRIP', { bg: '#1f4fb6', fg: '#fff', border: '#ffd21a' }) });
    this.scene.add(s);
  }

  setCars(cfgA, cfgB) {
    for (const c of this.cars) if (c) { this.scene.remove(c); c.userData.car.dispose(); }
    this.cars = [createCar(cfgA), createCar(cfgB)];
    this.cars.forEach((c, i) => {
      c.position.set(-c.userData.car.length / 2 + 0.1, 0, i === 0 ? -LANE_Z : LANE_Z);
      this.scene.add(c);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.9, 10).rotateZ(Math.PI / 2), this.flameMat);
      flame.position.set(-c.userData.car.length / 2 - 0.4, 0.24, 0);
      flame.visible = false;
      c.add(flame);
      c.userData.flame = flame;
    });
    this.camMode = 'intro';
    this.introT = 0;
    this.finishCam = false;
    for (const sm of this.smoke) this.scene.remove(sm);
    this.smoke = [];
    this.setTree(false, 0, false);
  }

  /** sims: [DragCar, DragCar] */
  sync(sims, dt) {
    sims.forEach((sim, i) => {
      const c = this.cars[i];
      if (!c || !sim) return;
      const api = c.userData.car;
      const x0 = -api.length / 2 + 0.1;
      const newX = x0 + sim.dist;
      const step = newX - c.position.x;
      c.position.x = newX;
      api.spinWheels(step + (sim.spinTimer > 0 ? dt * 25 : 0));
      // squat on launch, nose dive on shift
      const accelPitch = sim.launched && !sim.finished ? (sim.shiftTimer > 0 ? -0.01 : 0.025) : 0;
      const pre = !sim.launched ? Math.sin(performance.now() / 40) * 0.003 * sim.rpmFrac : 0;
      api.bodyGroup.rotation.z = damp(api.bodyGroup.rotation.z, accelPitch + pre, 8, dt);
      c.userData.flame.visible = sim.nitroOn;
      if (sim.nitroOn) c.userData.flame.scale.set(1 + Math.random() * 0.5, 1, 1);
      if ((sim.spinTimer > 0 || (sim.launched && sim.t < 0.5)) && Math.random() < 0.6) this.puff(c);
    });
    for (const sm of this.smoke) {
      sm.userData.life -= dt;
      sm.position.y += dt * 0.6;
      sm.scale.multiplyScalar(1 + dt * 1.6);
      sm.material.opacity = Math.max(0, sm.userData.life / 1.2) * 0.8;
    }
    this.smoke = this.smoke.filter((sm) => {
      if (sm.userData.life > 0) return true;
      this.scene.remove(sm);
      sm.material.dispose();
      return false;
    });
  }

  puff(car) {
    const sp = new THREE.Sprite(this.smokeMat.clone());
    const L = car.userData.car.length;
    sp.position.set(car.position.x - L * 0.3 + (Math.random() - 0.5) * 0.3, 0.25, car.position.z + (Math.random() < 0.5 ? -0.6 : 0.6));
    sp.scale.setScalar(0.6);
    sp.userData.life = 1.2;
    this.scene.add(sp);
    this.smoke.push(sp);
  }

  onResize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** focus: index of the car to follow, or 'both' */
  update(dt, time) {
    const cars = this.cars;
    if (!cars[0]) return;
    // crowd bounce
    if (this.crowd && this.excited !== undefined) {
      const { body, head, people } = this.crowd;
      const m4 = new THREE.Matrix4();
      const amp = this.excited ? 0.18 : 0.03;
      for (let i = 0; i < people.length; i += 1) {
        const p = people[i];
        const y = p.y + Math.abs(Math.sin(time * (this.excited ? 9 : 2) + p.ph)) * amp;
        m4.makeTranslation(p.x, y + 0.3, p.z);
        body.setMatrixAt(i, m4);
        m4.makeTranslation(p.x, y + 0.75, p.z);
        head.setMatrixAt(i, m4);
      }
      body.instanceMatrix.needsUpdate = true;
      head.instanceMatrix.needsUpdate = true;
    }
    const a = cars[0].position;
    const b = cars[1].position;
    const lead = Math.max(a.x, b.x);
    const mid = (a.x + b.x) / 2;
    let pos;
    let look;
    if (this.camMode === 'intro') {
      this.introT += dt;
      const t = Math.min(1, this.introT / 2.5);
      const ang = -0.9 + t * 0.75;
      pos = new THREE.Vector3(Math.cos(ang) * -9 + 2, 2.4 + (1 - t) * 1.5, Math.sin(ang) * 9);
      look = new THREE.Vector3(1, 0.6, 0);
    } else {
      const focusX = this.focus === 'both' ? mid : cars[this.focus || 0].position.x;
      const followX = Math.min(focusX, RACE_DISTANCE + 25);
      pos = new THREE.Vector3(followX - 8.5, 3.0, this.focus === 'both' ? 0 : (this.focus === 1 ? 6.5 : -6.5));
      look = new THREE.Vector3(Math.min(lead, RACE_DISTANCE + 30) + 6, 0.6, 0);
      if (this.finishCam) {
        pos = new THREE.Vector3(RACE_DISTANCE + 6, 2.2, -8.5);
        look = new THREE.Vector3(lead - 2, 0.6, 0);
      }
    }
    this.camPos.lerp(pos, 1 - Math.exp(-6 * dt));
    this.camLook.lerp(look, 1 - Math.exp(-8 * dt));
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    const speedFov = 50 + Math.min(14, this.speedHint || 0);
    this.camera.fov = damp(this.camera.fov, speedFov, 3, dt);
    this.camera.updateProjectionMatrix();
    this.sun.position.set(mid - 20, 40, 25);
    this.sun.target.position.set(mid, 0, 0);
    for (const c of cars) c.userData.car.setSiren(time);
  }
}

export { LANE_Z };
