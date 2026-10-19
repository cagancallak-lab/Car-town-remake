// Free-roam Car Town: drive your active car around a little town with the
// dealer, the paint & tune shop, the drag strip, a gas station, a car wash,
// your garage and your friends' houses. Traffic drives on the road grid.

import * as THREE from 'three';
import { createCar, defaultConfig } from '../cars/carFactory.js';
import { NPC_MODEL_IDS, FEATURED_IDS } from '../cars/models.js';
import { carPerformance } from '../game/drag.js';
import { PAINT_COLORS, NPC_FRIENDS } from '../game/catalog.js';
import { grassTexture, asphaltTexture, sidewalkTexture, windowsTexture, signTexture, canvasTexture } from '../world/textures.js';
import { mat, box, cylinder, tree, bush, lampPost, bench, glowDisc } from '../world/props.js';
import { buildAvatar, animateAvatar } from '../world/characters.js';
import { headingOf } from '../world/mover.js';
import { clamp, damp, pick, seeded, rand } from '../core/util.js';

export const BLOCK = 40;
export const GRID = 3; // blocks per side
const ROAD_W = 10;
const LANE = 2.3;
const SIZE = BLOCK * GRID;

function flat(w, d, material, x, y, z) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.receiveShadow = true;
  return m;
}

function rep(tex, rx, ry) {
  const t = tex.clone();
  t.needsUpdate = true;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  return t;
}

export class TownScene {
  constructor(engine, state) {
    this.engine = engine;
    this.state = state;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#8fd0ff');
    this.scene.fog = new THREE.Fog('#bfe3ff', 70, 180);
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
    this.colliders = []; // {minX,maxX,minZ,maxZ}
    this.zones = []; // {id, label, x, z, r, action}
    this.traffic = [];
    this.walkers = [];
    this.camMode = 'chase';
    this.player = null;
    this.vel = 0;
    this.heading = 0;
    this.steer = 0;
    this.pos = new THREE.Vector2(20, 6);
    this.camPos = new THREE.Vector3();
    this.camLook = new THREE.Vector3();
    this.activeZone = null;
    this.distance = 0;
    this.build();
  }

  build() {
    const s = this.scene;
    s.add(new THREE.HemisphereLight(0xeaf6ff, 0x6d8f4e, 1.2));
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 150 });
    s.add(sun, sun.target);
    this.sun = sun;

    const grass = flat(SIZE + 200, SIZE + 200, new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 0.95 }), SIZE / 2, -0.06, SIZE / 2);
    s.add(grass);

    // Roads along both axes at every block boundary
    const asphalt = asphaltTexture();
    const total = SIZE + ROAD_W;
    for (let i = 0; i <= GRID; i++) {
      const c = i * BLOCK;
      s.add(flat(total, ROAD_W, new THREE.MeshStandardMaterial({ map: rep(asphalt, total / 4, ROAD_W / 4), roughness: 0.9 }), SIZE / 2, 0, c));
      s.add(flat(ROAD_W, total, new THREE.MeshStandardMaterial({ map: rep(asphalt, ROAD_W / 4, total / 4), roughness: 0.9 }), c, 0.001, SIZE / 2));
    }
    // dashed centre lines (skip intersections)
    const dashM = mat('#f2c21b', { rough: 0.6 });
    const dash = new THREE.PlaneGeometry(1.4, 0.18);
    const dashes = [];
    for (let i = 0; i <= GRID; i++) {
      for (let k = -ROAD_W / 2; k < SIZE + ROAD_W / 2; k += 3) {
        const local = ((k % BLOCK) + BLOCK) % BLOCK;
        if (local < ROAD_W / 2 + 1 || local > BLOCK - ROAD_W / 2 - 1) continue;
        dashes.push([k, i * BLOCK, 0], [i * BLOCK, k, Math.PI / 2]);
      }
    }
    const dashMesh = new THREE.InstancedMesh(dash, dashM, dashes.length);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    dashes.forEach(([x, z, r], idx) => {
      q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, r));
      m4.compose(new THREE.Vector3(x, 0.01, z), q, new THREE.Vector3(1, 1, 1));
      dashMesh.setMatrixAt(idx, m4);
    });
    s.add(dashMesh);

    // Blocks: raised sidewalk slab + content
    const side = sidewalkTexture();
    const rng = seeded(2010);
    for (let bx = 0; bx < GRID; bx++) {
      for (let bz = 0; bz < GRID; bz++) {
        const x0 = bx * BLOCK + ROAD_W / 2;
        const z0 = bz * BLOCK + ROAD_W / 2;
        const w = BLOCK - ROAD_W;
        const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, w), [mat('#b9b2a2'), mat('#b9b2a2'), new THREE.MeshStandardMaterial({ map: rep(side, w / 1.6, w / 1.6), roughness: 0.85 }), mat('#b9b2a2'), mat('#b9b2a2'), mat('#b9b2a2')]);
        slab.position.set(x0 + w / 2, 0.08, z0 + w / 2);
        slab.receiveShadow = true;
        s.add(slab);
        const inner = flat(w - 4, w - 4, new THREE.MeshStandardMaterial({ map: rep(grassTexture(), (w - 4) / 6, (w - 4) / 6), roughness: 0.95 }), x0 + w / 2, 0.165, z0 + w / 2);
        s.add(inner);
        this.buildBlock(bx, bz, x0 + w / 2, z0 + w / 2, w, rng);
        // lamps on corners
        for (const [cx, cz] of [[x0 + 1, z0 + 1], [x0 + w - 1, z0 + w - 1]]) {
          const l = lampPost();
          l.position.set(cx, 0.16, cz);
          l.rotation.y = rng() * 6;
          s.add(l);
        }
      }
    }
    // outer ring of trees / hills
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2;
      const r = SIZE * 0.75 + rng() * 20;
      const tr = tree(1.4 + rng(), i);
      tr.position.set(SIZE / 2 + Math.cos(a) * r, 0, SIZE / 2 + Math.sin(a) * r);
      s.add(tr);
    }
    // world bounds
    const B = 6;
    this.bounds = { minX: -B, maxX: SIZE + B, minZ: -B, maxZ: SIZE + B };

    // pedestrians
    for (let i = 0; i < 10; i++) {
      const av = buildAvatar({ skin: pick(['#f1c7a3', '#c68a5e', '#8d5a3b', '#f6d7bd']), shirt: pick(PAINT_COLORS), hair: pick(['#1a1010', '#6b4a2b', '#e9b949']), style: pick(['short', 'long', 'bun', 'cap']) });
      const bx = Math.floor(rng() * GRID);
      const bz = Math.floor(rng() * GRID);
      const along = rng() < 0.5;
      const c0 = (along ? bz : bx) * BLOCK + ROAD_W / 2 + 1.2;
      const w0 = (along ? bx : bz) * BLOCK + ROAD_W / 2 + 2;
      const w1 = w0 + BLOCK - ROAD_W - 4;
      av.scale.setScalar(1.15);
      s.add(av);
      this.walkers.push({ obj: av, along, c: c0, a: w0, b: w1, p: w0 + rng() * (w1 - w0), dir: rng() < 0.5 ? 1 : -1 });
    }
  }

  addCollider(cx, cz, w, d) {
    this.colliders.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 });
  }

  building(cx, cz, w, d, h, { base = '#e8dcc6', roof = '#8a5a3b', key = 'b', windows = true, flatRoof = false } = {}) {
    const g = new THREE.Group();
    const wallMat = windows
      ? new THREE.MeshStandardMaterial({ map: rep(windowsTexture(key, { base, cols: 4, rows: 3 }), Math.max(1, Math.round(w / 6)), Math.max(1, Math.round(h / 4))), roughness: 0.8 })
      : mat(base, { rough: 0.8 });
    const wallMatD = windows
      ? new THREE.MeshStandardMaterial({ map: rep(windowsTexture(key, { base, cols: 4, rows: 3 }), Math.max(1, Math.round(d / 6)), Math.max(1, Math.round(h / 4))), roughness: 0.8 })
      : mat(base, { rough: 0.8 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [wallMatD, wallMatD, mat(roof), mat(roof), wallMat, wallMat]);
    body.position.y = h / 2 + 0.16;
    body.castShadow = body.receiveShadow = true;
    g.add(body);
    if (!flatRoof) {
      const r = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, 2.4, 4), mat(roof, { rough: 0.7 }));
      r.rotation.y = Math.PI / 4;
      r.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
      r.position.y = h + 1.36;
      r.castShadow = true;
      g.add(r);
    } else {
      box(g, w + 0.3, 0.3, d + 0.3, mat(roof), 0, h + 0.16, 0, 0.05);
    }
    g.position.set(cx, 0, cz);
    this.scene.add(g);
    this.addCollider(cx, cz, w, d);
    return g;
  }

  sign(text, x, y, z, ry, { bg = '#d9262b', fg = '#fff', w = 8, h = 1.6, key } = {}) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: signTexture(key || `town:${text}`, text, { bg, fg, w: 1024, h: Math.round((1024 * h) / w) }), emissive: 0xffffff, emissiveIntensity: 0.15, side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.rotation.y = ry;
    this.scene.add(m);
    return m;
  }

  zone(id, label, x, z, action, color = '#ffe14a') {
    const ring = glowDisc(color, 3.2);
    ring.position.set(x, 0.05, z);
    this.scene.add(ring);
    this.zones.push({ id, label, x, z, r: 3.4, action, ring });
  }

  buildBlock(bx, bz, cx, cz, w, rng) {
    const s = this.scene;
    const key = `${bx},${bz}`;
    const front = cz - w / 2 + 1; // edge facing the road at lower z
    switch (key) {
      case '0,0': { // player's garage
        const g = this.building(cx, cz + 3, 20, 16, 5.5, { base: '#eceff2', roof: '#3e5a8c', key: 'g', windows: false, flatRoof: true });
        void g;
        for (let i = -1; i <= 1; i++) {
          const door = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), mat('#9aa0a8', { rough: 0.4, metal: 0.5 }));
          door.position.set(cx + i * 6.2, 2.2, cz + 3 - 8.02);
          door.rotation.y = Math.PI;
          s.add(door);
          for (let k = 0; k < 6; k++) box(s, 5, 0.06, 0.05, mat('#6b717b'), cx + i * 6.2, 0.6 + k * 0.6, cz + 3 - 8.06, 0.01);
        }
        this.sign(`${this.state.data.player.name.toUpperCase()}'S GARAGE`, cx, 6.6, cz + 3 - 8.1, Math.PI, { key: 'town-garage', w: 14, h: 2 });
        this.zone('garage', 'myGarage', cx, front + 1, 'garage', '#3cff6b');
        break;
      }
      case '1,0': { // car dealer: glass showroom with the featured cars
        const glass = new THREE.MeshPhysicalMaterial({ color: '#bfe3ff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.25 });
        const sx = 22;
        const sz = 14;
        const floor = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.2, sz), mat('#f2f2f2', { rough: 0.2 }));
        floor.position.set(cx, 0.26, cz + 2);
        s.add(floor);
        const shell = new THREE.Mesh(new THREE.BoxGeometry(sx, 5, sz), glass);
        shell.position.set(cx, 2.66, cz + 2);
        s.add(shell);
        box(s, sx + 0.4, 0.5, sz + 0.4, mat('#1f4fb6'), cx, 5.1, cz + 2, 0.05);
        for (const ox of [-sx / 2, sx / 2]) for (const oz of [-sz / 2, sz / 2]) box(s, 0.3, 5, 0.3, mat('#d0d4da', { metal: 0.8, rough: 0.2 }), cx + ox, 0.16, cz + 2 + oz, 0.03);
        FEATURED_IDS.forEach((id, i) => {
          const car = createCar(defaultConfig(id), { lod: 'low' });
          car.position.set(cx - 6.5 + i * 6.5, 0.36, cz + 2);
          car.rotation.y = -0.6;
          car.scale.setScalar(1.3);
          s.add(car);
          (this.showcars ||= []).push(car);
        });
        this.sign('CAR TOWN MOTORS', cx, 6.4, cz + 2 - sz / 2 - 0.25, Math.PI, { bg: '#1f4fb6', fg: '#ffd21a', key: 'town-dealer', w: 14, h: 2 });
        this.addCollider(cx, cz + 2, sx, sz);
        this.zone('dealer', 'dealership', cx, front + 1);
        break;
      }
      case '2,0': { // paint & tune shop
        this.building(cx, cz + 3, 16, 14, 5, { base: '#ffd9e8', roof: '#c13cc8', key: 'p', flatRoof: true });
        this.sign('PAINT & TUNE', cx, 6.3, cz + 3 - 7.1, Math.PI, { bg: '#c13cc8', key: 'town-paint', w: 11, h: 1.8 });
        // giant spray can
        const can = new THREE.Group();
        cylinder(can, 0.9, 0.9, 3, mat('#ff4fa0', { rough: 0.3, metal: 0.4 }), 0, 0, 0, 20);
        cylinder(can, 0.5, 0.9, 0.6, mat('#d0d4da', { metal: 0.8, rough: 0.2 }), 0, 3, 0, 20);
        cylinder(can, 0.15, 0.15, 0.4, mat('#1b1c20'), 0, 3.6, 0, 10);
        can.position.set(cx + 9.5, 0.16, cz - 6);
        s.add(can);
        this.addCollider(cx + 9.5, cz - 6, 2, 2);
        this.zone('custom', 'customShop', cx - 3, front + 1);
        break;
      }
      case '2,1': { // gas station + car wash
        box(s, 14, 0.5, 8, mat('#d9262b'), cx - 4, 5, cz - 4, 0.08);
        for (const ox of [-9.5, 1.5]) for (const oz of [-7, -1]) box(s, 0.4, 5, 0.4, mat('#f2f2f2'), cx + ox, 0.16, cz + oz, 0.05);
        for (const ox of [-7, -1]) {
          const pump = new THREE.Group();
          box(pump, 0.9, 1.7, 0.7, mat('#f2f2f2', { rough: 0.4 }), 0, 0, 0, 0.1);
          box(pump, 0.7, 0.5, 0.05, mat('#2f6fd6', { emissive: '#2f6fd6', ei: 0.3 }), 0, 1.0, 0.36, 0.02);
          pump.position.set(cx + ox, 0.16, cz - 4);
          s.add(pump);
          this.addCollider(cx + ox, cz - 4, 1, 1);
        }
        this.sign('GAS', cx - 4, 5.9, cz - 8.1, Math.PI, { bg: '#d9262b', key: 'town-gas', w: 5, h: 1.2 });
        this.building(cx + 9, cz + 7, 9, 9, 4, { base: '#cfe3f3', roof: '#2f8be0', key: 'w', flatRoof: true });
        this.sign('CAR WASH', cx + 9, 5, cz + 7 - 4.6, Math.PI, { bg: '#2f8be0', key: 'town-wash', w: 7, h: 1.3 });
        this.zone('gas', 'gasStation', cx - 4, cz - 4, '#ffb347');
        this.zone('wash', 'carWash', cx + 9, cz + 1, '#7fe0ff');
        break;
      }
      case '1,2': { // drag strip entrance
        const gate = new THREE.Group();
        for (const ox of [-6, 6]) box(gate, 0.8, 7, 0.8, mat('#1b1c20'), ox, 0.16, 0, 0.05);
        box(gate, 13.6, 1.6, 0.6, mat('#1b1c20'), 0, 6.2, 0, 0.05);
        gate.position.set(cx, 0, cz - 6);
        s.add(gate);
        this.addCollider(cx - 6, cz - 6, 0.8, 0.8);
        this.addCollider(cx + 6, cz - 6, 0.8, 0.8);
        this.sign('DRAG STRIP', cx, 7.0, cz - 6.35, Math.PI, { bg: '#1b1c20', fg: '#ffd21a', key: 'town-drag', w: 12, h: 1.5 });
        const strip = flat(8, 26, mat('#3d3f44', { rough: 0.9 }), cx, 0.17, cz + 4);
        s.add(strip);
        const checker = canvasTexture('town-check', 64, 64, (ctx) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { ctx.fillStyle = (x + y) % 2 ? '#111' : '#fff'; ctx.fillRect(x * 16, y * 16, 16, 16); } });
        const line = new THREE.Mesh(new THREE.PlaneGeometry(8, 1), new THREE.MeshStandardMaterial({ map: rep(checker, 8, 1) }));
        line.rotation.x = -Math.PI / 2;
        line.position.set(cx, 0.18, cz - 4);
        s.add(line);
        this.building(cx + 12, cz + 4, 6, 20, 3, { base: '#9aa0a8', roof: '#2f6fd6', key: 'stand', flatRoof: true });
        this.zone('race', 'dragStrip', cx, front + 1, '#ff4fa0');
        break;
      }
      case '0,1': { // park
        const pond = new THREE.Mesh(new THREE.CircleGeometry(7, 32), new THREE.MeshStandardMaterial({ color: '#4fb3e8', roughness: 0.1, metalness: 0.2 }));
        pond.rotation.x = -Math.PI / 2;
        pond.position.set(cx + 3, 0.18, cz + 2);
        s.add(pond);
        this.addCollider(cx + 3, cz + 2, 11, 11);
        for (let i = 0; i < 14; i++) {
          const tr = tree(1 + rng() * 0.8, i);
          const a = rng() * Math.PI * 2;
          const r = 10 + rng() * 3;
          tr.position.set(cx + Math.cos(a) * r, 0.16, cz + Math.sin(a) * r);
          s.add(tr);
          this.addCollider(tr.position.x, tr.position.z, 1, 1);
        }
        for (let i = 0; i < 3; i++) {
          const b = bench();
          b.position.set(cx - 8 + i * 4, 0.16, cz - 10);
          s.add(b);
        }
        break;
      }
      case '1,1': { // town square fountain + cafe
        const f = new THREE.Group();
        cylinder(f, 5, 5.2, 0.8, mat('#d8d0c0'), 0, 0.16, 0, 32);
        const water = cylinder(f, 4.5, 4.5, 0.1, new THREE.MeshStandardMaterial({ color: '#6cc6f0', roughness: 0.05, metalness: 0.2 }), 0, 0.9, 0, 32);
        void water;
        cylinder(f, 0.6, 0.8, 2.6, mat('#d8d0c0'), 0, 0.9, 0, 16);
        cylinder(f, 1.8, 1.4, 0.4, mat('#d8d0c0'), 0, 3.4, 0, 20);
        f.position.set(cx, 0, cz);
        s.add(f);
        this.addCollider(cx, cz, 10, 10);
        this.building(cx - 10, cz + 10, 9, 8, 6, { base: '#f3e3c3', roof: '#c2452f', key: 'cafe' });
        this.building(cx + 10, cz + 10, 9, 8, 8, { base: '#d9f0cf', roof: '#2f7a4a', key: 'apt', flatRoof: true });
        break;
      }
      default: { // houses (friends live here)
        const cols = ['#f3e3c3', '#cfe3f3', '#f3cfd8', '#d9f0cf', '#f0e0b8'];
        const roofs = ['#c2452f', '#3f5f9e', '#5a4a3a', '#2f7a4a'];
        const spots = [[-8, -6], [8, -6], [-8, 8], [8, 8]];
        spots.forEach(([ox, oz], i) => {
          this.building(cx + ox, cz + oz, 9, 8, 4 + rng() * 3, { base: cols[Math.floor(rng() * cols.length)], roof: roofs[Math.floor(rng() * roofs.length)], key: `h${i % 3}` });
        });
        if (key === '0,2' || key === '2,2') {
          const friends = NPC_FRIENDS.slice(key === '0,2' ? 0 : 3, key === '0,2' ? 3 : 6);
          friends.forEach((fr, i) => {
            const fx = cx - 12 + i * 12;
            const car = createCar({ ...fr.car }, { lod: 'low' });
            car.position.set(fx, 0.16, cz - 13.5);
            car.rotation.y = Math.PI / 2;
            s.add(car);
            this.addCollider(fx, cz - 13.5, 1.6, car.userData.car.length);
            this.sign(`${fr.name.toUpperCase()}`, fx, 2.6, cz - 11, Math.PI, { bg: '#2f6fd6', key: `town-f-${fr.id}`, w: 3.4, h: 0.8 });
            this.zone(`friend:${fr.id}`, fr.name, fx + 3, front + 1, '#ff8a1a');
          });
        }
        for (let i = 0; i < 4; i++) {
          const b = bush(2, 0.7);
          b.position.set(cx - 15 + i * 10, 0.16, cz + 15);
          s.add(b);
        }
        break;
      }
    }
  }

  // ---------------------------------------------------------------------------------
  // Player car
  // ---------------------------------------------------------------------------------

  setPlayerCar(cfg) {
    if (this.player) {
      this.scene.remove(this.player);
      this.player.userData.car.dispose();
    }
    this.player = createCar(cfg);
    this.scene.add(this.player);
    this.perf = carPerformance(cfg);
    this.vel = 0;
    this.placeAt('garage');
  }

  placeAt(zoneId) {
    const z = this.zones.find((x) => x.id === zoneId) || this.zones[0];
    this.pos.set(z.x, z.z - 4.2);
    this.heading = headingOf(1, 0);
    this.vel = 0;
    this.player.position.set(this.pos.x, 0, this.pos.y);
    this.player.rotation.y = this.heading;
    this.snapCamera();
  }

  snapCamera() {
    this.updateCamera(1, true);
  }

  // ---------------------------------------------------------------------------------
  // Traffic
  // ---------------------------------------------------------------------------------

  spawnTraffic(n = 9) {
    for (const c of this.traffic) { this.scene.remove(c.obj); c.obj.userData.car.dispose(); }
    this.traffic = [];
    for (let i = 0; i < n; i++) {
      const model = pick(NPC_MODEL_IDS);
      const obj = createCar({ ...defaultConfig(model), paint: Math.random() < 0.5 ? defaultConfig(model).paint : pick(PAINT_COLORS) }, { shadows: false, lod: 'low' });
      this.scene.add(obj);
      const node = { i: Math.floor(Math.random() * (GRID + 1)), j: Math.floor(Math.random() * (GRID + 1)) };
      const c = { obj, from: node, to: null, t: 0, speed: rand(6, 9), v: 6 };
      this.pickNext(c, null);
      this.traffic.push(c);
    }
  }

  pickNext(c, prevDir) {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([di, dj]) => {
      const ni = c.from.i + di;
      const nj = c.from.j + dj;
      if (ni < 0 || nj < 0 || ni > GRID || nj > GRID) return false;
      if (prevDir && di === -prevDir[0] && dj === -prevDir[1]) return false;
      return true;
    });
    const d = pick(dirs.length ? dirs : [[-prevDir[0], -prevDir[1]]]);
    c.dir = d;
    c.to = { i: c.from.i + d[0], j: c.from.j + d[1] };
    c.t = 0;
  }

  lanePoint(c, t) {
    const [di, dj] = c.dir;
    // right-hand lane offset: perpendicular to travel direction
    const ox = -dj * LANE;
    const oz = di * LANE;
    const x = (c.from.i + (c.to.i - c.from.i) * t) * BLOCK + ox;
    const z = (c.from.j + (c.to.j - c.from.j) * t) * BLOCK + oz;
    return [x, z];
  }

  updateTraffic(dt) {
    const pp = this.player?.position;
    for (const c of this.traffic) {
      let target = c.speed;
      // slow down for the player or another car ahead
      const fx = c.obj.position.x + Math.cos(c.obj.rotation.y) * 4;
      const fz = c.obj.position.z - Math.sin(c.obj.rotation.y) * 4;
      if (pp && Math.hypot(pp.x - fx, pp.z - fz) < 3.2) target = 0;
      for (const o of this.traffic) {
        if (o === c) continue;
        if (Math.hypot(o.obj.position.x - fx, o.obj.position.z - fz) < 2.6) target = Math.min(target, 1);
      }
      c.v = damp(c.v, target, 3, dt);
      c.t += (c.v * dt) / BLOCK;
      if (c.t >= 1) {
        c.from = c.to;
        const prev = c.dir;
        this.pickNext(c, prev);
      }
      const [x, z] = this.lanePoint(c, Math.min(c.t, 1));
      // smooth corners: blend toward the next heading near the node
      const h = headingOf(c.dir[0], c.dir[1]);
      c.obj.rotation.y = c.obj.rotation.y + angleDiff(c.obj.rotation.y, h) * Math.min(1, dt * 6);
      const step = Math.hypot(x - c.obj.position.x, z - c.obj.position.z);
      c.obj.position.x = damp(c.obj.position.x, x, 10, dt);
      c.obj.position.z = damp(c.obj.position.z, z, 10, dt);
      c.obj.position.y = 0;
      c.obj.userData.car.spinWheels(Math.min(step, 1));
    }
  }

  // ---------------------------------------------------------------------------------
  // Driving
  // ---------------------------------------------------------------------------------

  drive(dt, keys) {
    const up = keys.has('KeyW') || keys.has('ArrowUp') || this.touch?.up;
    const down = keys.has('KeyS') || keys.has('ArrowDown') || this.touch?.down;
    const left = keys.has('KeyA') || keys.has('ArrowLeft') || this.touch?.left;
    const right = keys.has('KeyD') || keys.has('ArrowRight') || this.touch?.right;
    const hand = keys.has('Space');
    const p = this.perf;
    const maxV = Math.min(30, p.vmax * 0.42);
    const accel = Math.min(16, 4 + (p.hp / p.kg) * 32);
    if (up) this.vel += (this.vel < 0 ? 18 : accel * (1 - Math.max(0, this.vel) / maxV)) * dt;
    else if (down) this.vel -= (this.vel > 0 ? 20 : 8) * dt;
    else this.vel = damp(this.vel, 0, 0.9, dt);
    if (hand) this.vel = damp(this.vel, 0, 3, dt);
    this.vel = clamp(this.vel, -7, maxV);
    const steerTarget = (left ? 1 : 0) - (right ? 1 : 0);
    this.steer = damp(this.steer, steerTarget * (0.62 - Math.min(0.35, Math.abs(this.vel) / 60)), 10, dt);
    const wb = 1.5;
    this.heading += (this.vel * Math.tan(this.steer) / wb) * dt * (hand ? 1.5 : 1);
    const dx = Math.cos(this.heading) * this.vel * dt;
    const dz = -Math.sin(this.heading) * this.vel * dt;
    this.pos.x += dx;
    this.pos.y += dz;
    this.distance += Math.abs(this.vel * dt);
    this.collide();
    const car = this.player.userData.car;
    this.player.position.set(this.pos.x, 0, this.pos.y);
    this.player.rotation.y = this.heading;
    car.spinWheels(this.vel * dt);
    car.steer(this.steer);
    car.setBodyRoll(-this.steer * Math.min(1, Math.abs(this.vel) / 15) * 0.05, 0);
  }

  collide() {
    const r = 1.1;
    const p = this.pos;
    for (const c of this.colliders) {
      const nx = clamp(p.x, c.minX, c.maxX);
      const nz = clamp(p.y, c.minZ, c.maxZ);
      const dx = p.x - nx;
      const dz = p.y - nz;
      const d = Math.hypot(dx, dz);
      if (d < r) {
        if (d > 1e-4) {
          p.x = nx + (dx / d) * r;
          p.y = nz + (dz / d) * r;
        } else {
          p.x += r;
        }
        this.vel *= 0.4;
        this.bump = 0.3;
      }
    }
    for (const c of this.traffic) {
      const dx = p.x - c.obj.position.x;
      const dz = p.y - c.obj.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 2 && d > 1e-4) {
        p.x = c.obj.position.x + (dx / d) * 2;
        p.y = c.obj.position.z + (dz / d) * 2;
        this.vel *= 0.5;
        this.bump = 0.3;
      }
    }
    const b = this.bounds;
    p.x = clamp(p.x, b.minX, b.maxX);
    p.y = clamp(p.y, b.minZ, b.maxZ);
  }

  updateCamera(dt, snap = false) {
    const pp = this.player.position;
    let pos;
    let look;
    if (this.camMode === 'chase') {
      const L = this.player.userData.car.length;
      const back = 3.2 + L * 1.6 + Math.abs(this.vel) * 0.08;
      pos = new THREE.Vector3(pp.x - Math.cos(this.heading) * back, 2.2 + L * 0.45 + Math.abs(this.vel) * 0.04, pp.z + Math.sin(this.heading) * back);
      look = new THREE.Vector3(pp.x + Math.cos(this.heading) * 4, 1, pp.z - Math.sin(this.heading) * 4);
    } else {
      pos = new THREE.Vector3(pp.x + 18, 22, pp.z + 18);
      look = new THREE.Vector3(pp.x, 0, pp.z);
    }
    if (snap) {
      this.camPos.copy(pos);
      this.camLook.copy(look);
    } else {
      this.camPos.lerp(pos, 1 - Math.exp(-5 * dt));
      this.camLook.lerp(look, 1 - Math.exp(-8 * dt));
    }
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    this.sun.position.set(pp.x - 20, 40, pp.z + 15);
    this.sun.target.position.set(pp.x, 0, pp.z);
  }

  onResize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(dt, time) {
    if (!this.player) return;
    this.drive(dt, this.engine.keys);
    this.updateTraffic(dt);
    for (const w of this.walkers) {
      w.p += w.dir * dt * 1.4;
      if (w.p > w.b || w.p < w.a) w.dir *= -1;
      if (w.along) {
        w.obj.position.set(w.p, 0.16, w.c);
        w.obj.rotation.y = headingOf(w.dir, 0);
      } else {
        w.obj.position.set(w.c, 0.16, w.p);
        w.obj.rotation.y = headingOf(0, w.dir);
      }
      animateAvatar(w.obj, dt, 1.4, false);
    }
    this.updateCamera(dt);
    // zones
    let active = null;
    for (const z of this.zones) {
      const d = Math.hypot(this.pos.x - z.x, this.pos.y - z.z);
      z.ring.material.opacity = 0.55 + Math.sin(time * 5) * 0.25;
      if (d < z.r) active = z;
    }
    this.activeZone = active;
    for (const c of this.showcars || []) c.rotation.y += dt * 0.3;
  }

  /** Data for the minimap. */
  minimap() {
    return { size: SIZE, block: BLOCK, grid: GRID, roadW: ROAD_W, pos: this.pos, heading: this.heading, zones: this.zones, traffic: this.traffic.map((c) => c.obj.position) };
  }
}

function angleDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
