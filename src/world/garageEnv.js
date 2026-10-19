// Static surroundings of the player's garage lot: grass, the two streets that
// meet at the front corner (as in the original game), sidewalks, crosswalks,
// trees, lamps, the corner billboard and neighbouring buildings.

import * as THREE from 'three';
import { grassTexture, asphaltTexture, sidewalkTexture, windowsTexture, signTexture } from './textures.js';
import { mat, tree, bush, lampPost, billboard, bench, hydrant, trashCan, box, hedge } from './props.js';
import { seeded } from '../core/util.js';

export const STREET = {
  sidewalk: 1.6,
  parking: 1.6,
  lane: 2.4,
};

/** Returns road geometry info for a lot of size N. */
export function roadLayout(N) {
  const s0 = N + STREET.sidewalk; // road starts after the sidewalk
  const park = s0 + STREET.parking / 2;
  const lane1 = s0 + STREET.parking + STREET.lane / 2;
  const lane2 = lane1 + STREET.lane;
  const end = s0 + STREET.parking + STREET.lane * 2;
  return { start: s0, park, lane1, lane2, end, far: end + STREET.sidewalk, driveZ: Math.round(N * 0.55) + 0.5 };
}

function flat(w, d, material, x, y, z) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.receiveShadow = true;
  return m;
}

function repeatTex(base, rx, ry) {
  const t = base.clone();
  t.needsUpdate = true;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  return t;
}

function house(rng, w = 4, d = 4) {
  const g = new THREE.Group();
  const cols = ['#f3e3c3', '#cfe3f3', '#f3cfd8', '#d9f0cf', '#f0e0b8'];
  const roofs = ['#c2452f', '#3f5f9e', '#5a4a3a', '#2f7a4a'];
  const wallM = new THREE.MeshStandardMaterial({ map: windowsTexture(`h${Math.floor(rng() * 4)}`, { base: cols[Math.floor(rng() * cols.length)], cols: 3, rows: 2 }), roughness: 0.8 });
  const h = 2.4 + rng() * 1.2;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallM);
  body.position.y = h / 2;
  body.castShadow = body.receiveShadow = true;
  g.add(body);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, 1.6, 4), mat(roofs[Math.floor(rng() * roofs.length)], { rough: 0.7 }));
  roof.position.y = h + 0.8;
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
  roof.castShadow = true;
  g.add(roof);
  return g;
}

function neighborGarage(name, color = '#e9e2d4') {
  const g = new THREE.Group();
  const wallM = mat(color, { rough: 0.7 });
  box(g, 7, 2.6, 0.3, wallM, 0, 0, -3.35, 0.05);
  box(g, 0.3, 2.6, 7, wallM, -3.35, 0, 0, 0.05);
  const floorM = mat('#d8d0c0', { rough: 0.8 });
  box(g, 7, 0.1, 7, floorM, 0, 0, 0, 0.02);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.7), new THREE.MeshStandardMaterial({ map: signTexture(`ng:${name}`, `${name.toUpperCase()}'S GARAGE`, { bg: '#2f6fd6' }), roughness: 0.5 }));
  sign.position.set(0, 2.2, -3.18);
  g.add(sign);
  return g;
}

export function buildGarageEnvironment(N, friends = []) {
  const root = new THREE.Group();
  root.name = 'garage-env';
  const R = roadLayout(N);
  const rng = seeded(1234);

  // Grass
  const grass = flat(220, 220, new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 0.95 }), N / 2, -0.12, N / 2);
  root.add(grass);

  const asphalt = asphaltTexture();
  const side = sidewalkTexture();
  const ROAD_LEN = 160;
  const roadW = R.end - R.start;
  const roadMat = new THREE.MeshStandardMaterial({ map: repeatTex(asphalt, roadW / 4, ROAD_LEN / 4), roughness: 0.9 });
  const roadMatX = new THREE.MeshStandardMaterial({ map: repeatTex(asphalt, ROAD_LEN / 4, roadW / 4), roughness: 0.9 });
  // road A runs along z (right-hand street on screen), road B along x (left-hand)
  root.add(flat(roadW, ROAD_LEN, roadMat, (R.start + R.end) / 2, -0.08, N / 2 - 20));
  root.add(flat(ROAD_LEN, roadW, roadMatX, N / 2 - 20, -0.079, (R.start + R.end) / 2));

  // sidewalks, drawn as slightly raised slabs that never cross a road
  const slab = (x0, x1, z0, z1) => {
    const w = x1 - x0;
    const d = z1 - z0;
    const top = new THREE.MeshStandardMaterial({ map: repeatTex(side, w, d), roughness: 0.85 });
    const edge = mat('#b9b2a2');
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), [edge, edge, top, edge, edge, edge]);
    m.position.set((x0 + x1) / 2, -0.04, (z0 + z1) / 2);
    m.receiveShadow = true;
    root.add(m);
  };
  const L = 70;
  slab(N, R.start, -L, R.start); // near side of road A (incl. front corner)
  slab(N, R.start, R.far, R.far + L);
  slab(-L, N, N, R.start); // near side of road B
  slab(R.far, R.far + L, N, R.start);
  slab(R.end, R.far, -L, R.start); // far side of road A
  slab(R.end, R.far, R.far, R.far + L);
  slab(-L, R.start, R.end, R.far); // far side of road B
  slab(R.far, R.far + L, R.end, R.far);
  slab(R.end, R.far, R.end, R.far); // far corner

  // lane markings
  const dashM = mat('#f4f4f0', { rough: 0.6 });
  const yellowM = mat('#f2c21b', { rough: 0.6 });
  const dashGeo = new THREE.PlaneGeometry(0.16, 1.2);
  const centerA = R.lane1 + STREET.lane / 2;
  for (let z = -60; z < N + 60; z += 2.6) {
    if (z > R.start - 0.6 && z < R.end + 0.6) continue;
    const d = new THREE.Mesh(dashGeo, yellowM);
    d.rotation.x = -Math.PI / 2;
    d.position.set(centerA, -0.07, z);
    root.add(d);
  }
  for (let x = -60; x < N + 60; x += 2.6) {
    if (x > R.start - 0.6 && x < R.end + 0.6) continue;
    const d = new THREE.Mesh(dashGeo, yellowM);
    d.rotation.x = -Math.PI / 2;
    d.rotation.z = Math.PI / 2;
    d.position.set(x, -0.07, centerA);
    root.add(d);
  }
  // parking lane lines
  const parkLine = (alongZ) => {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.1, ROAD_LEN), dashM);
    line.rotation.x = -Math.PI / 2;
    if (!alongZ) line.rotation.z = Math.PI / 2;
    const off = R.start + STREET.parking;
    if (alongZ) line.position.set(off, -0.07, N / 2 - 20);
    else line.position.set(N / 2 - 20, -0.069, off);
    root.add(line);
  };
  parkLine(true);
  parkLine(false);
  // crosswalks around the intersection
  const zebra = (x, z, alongZ) => {
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(alongZ ? 0.45 : 1.7, alongZ ? 1.7 : 0.45), dashM);
      s.rotation.x = -Math.PI / 2;
      const o = R.start + 0.5 + i * ((roadW - 1) / 6);
      if (alongZ) s.position.set(o, -0.065, z);
      else s.position.set(x, -0.065, o);
      root.add(s);
    }
  };
  zebra(0, R.start - 1.2, true);
  zebra(R.start - 1.2, 0, false);
  zebra(0, R.end + 1.2, true);
  zebra(R.end + 1.2, 0, false);

  // driveway into the lot on road A side
  const drive = flat(STREET.sidewalk + 0.1, 3.4, mat('#9a9da1', { rough: 0.9 }), N + STREET.sidewalk / 2, 0.015, R.driveZ);
  root.add(drive);

  // Lamp posts along both near sidewalks
  for (let z = 2; z < N; z += 6) {
    if (Math.abs(z - R.driveZ) < 2.5) continue;
    const l = lampPost();
    l.position.set(N + 1.25, 0, z);
    l.rotation.y = 0;
    root.add(l);
  }
  for (let x = 2; x < N; x += 6) {
    const l = lampPost();
    l.position.set(x, 0, N + 1.25);
    l.rotation.y = -Math.PI / 2;
    root.add(l);
  }

  // Billboard on the front corner (like the screenshot)
  const bb = billboard();
  bb.position.set(N + 0.6, 0, N + 0.6);
  bb.rotation.y = Math.PI / 4;
  bb.scale.setScalar(0.8);
  root.add(bb);

  const hy = hydrant();
  hy.position.set(N + 0.7, 0, 3);
  root.add(hy);
  const tc = trashCan();
  tc.position.set(N - 3, 0, N + 0.8);
  root.add(tc);
  const bn = bench();
  bn.position.set(N - 6, 0, N + 0.9);
  bn.rotation.y = Math.PI;
  root.add(bn);

  // Behind the walls: hedge + trees + neighbouring houses
  const hedgeX = hedge(N + 4, 0.8);
  hedgeX.position.set(N / 2, 0, -1.6);
  root.add(hedgeX);
  const hedgeZ = hedge(N + 4, 0.8);
  hedgeZ.rotation.y = Math.PI / 2;
  hedgeZ.position.set(-1.6, 0, N / 2);
  root.add(hedgeZ);
  for (let i = 0; i < 9; i++) {
    const t = tree(1 + rng() * 0.5, i);
    t.position.set(-3 - rng() * 5, 0, -4 + i * ((N + 8) / 8));
    root.add(t);
    const t2 = tree(1 + rng() * 0.5, i + 1);
    t2.position.set(-4 + i * ((N + 8) / 8), 0, -3 - rng() * 5);
    root.add(t2);
  }
  for (let i = 0; i < 4; i++) {
    const h = house(rng, 5, 5);
    h.position.set(-12, 0, -2 + i * 7);
    root.add(h);
    const h2 = house(rng, 5, 5);
    h2.position.set(-2 + i * 7, 0, -12);
    root.add(h2);
  }

  // Across the streets: neighbour lots (friend garages, parks)
  const across = R.far + 1;
  const fg = neighborGarage(friends[0]?.name || 'Daisy', '#e9e2d4');
  fg.position.set(across + 4, 0, 4);
  root.add(fg);
  const fg2 = neighborGarage(friends[2]?.name || 'Joselia', '#dfe9f3');
  fg2.rotation.y = Math.PI / 2;
  fg2.position.set(4, 0, across + 4);
  root.add(fg2);
  for (let i = 0; i < 10; i++) {
    const t = tree(0.9 + rng() * 0.6, i);
    t.position.set(across + 1 + rng() * 10, 0, 12 + rng() * (N + 6));
    root.add(t);
    const t2 = tree(0.9 + rng() * 0.6, i + 2);
    t2.position.set(12 + rng() * (N + 6), 0, across + 1 + rng() * 10);
    root.add(t2);
  }
  for (let i = 0; i < 6; i++) {
    const b = bush(1.4, 0.5);
    b.position.set(across + 0.4, 0, -6 + i * 4.5);
    b.rotation.y = Math.PI / 2;
    root.add(b);
  }
  const corner = house(rng, 6, 6);
  corner.position.set(across + 5, 0, across + 5);
  root.add(corner);

  root.traverse((o) => {
    if (o.isMesh) o.matrixAutoUpdate = true;
  });
  return { root, layout: R };
}
