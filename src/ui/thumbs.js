// Offscreen renderer that produces small studio thumbnails of cars and
// garage items for the shop UIs. Results are cached as data URLs.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createCar } from '../cars/carFactory.js';
import { buildItem } from '../world/props.js';

let renderer = null;
let scene = null;
let camera = null;
const cache = new Map();
const queue = [];
let busy = false;

function init() {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(240, 150);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.3));
  const d = new THREE.DirectionalLight(0xffffff, 2);
  d.position.set(3, 6, 4);
  scene.add(d);
  camera = new THREE.PerspectiveCamera(28, 240 / 150, 0.1, 50);
}

function render(obj, { dist = 6.4, height = 2.2, ty = 0.55, yaw = 0.75 } = {}) {
  init();
  scene.add(obj);
  obj.rotation.y = yaw;
  camera.position.set(Math.sin(0.4) * dist, height, Math.cos(0.4) * dist);
  camera.lookAt(0, ty, 0);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');
  scene.remove(obj);
  return url;
}

function pump() {
  if (busy) return;
  busy = true;
  const step = () => {
    const job = queue.shift();
    if (!job) {
      busy = false;
      return;
    }
    if (!cache.has(job.key)) {
      try {
        cache.set(job.key, job.make());
      } catch (e) {
        console.warn('thumb failed', e);
        cache.set(job.key, '');
      }
    }
    for (const cb of job.cbs) cb(cache.get(job.key));
    setTimeout(step, 0);
  };
  step();
}

function request(key, make, cb) {
  if (cache.has(key)) {
    cb(cache.get(key));
    return;
  }
  const existing = queue.find((j) => j.key === key);
  if (existing) existing.cbs.push(cb);
  else queue.push({ key, make, cbs: [cb] });
  pump();
}

export function carThumb(cfg, imgEl) {
  const key = `car:${JSON.stringify(cfg)}`;
  request(key, () => {
    const car = createCar(cfg, { blobShadow: true });
    const L = car.userData.car.length;
    const url = render(car, { dist: 3.2 + L * 1.55, height: 1.9 + L * 0.35 });
    car.userData.car.dispose();
    return url;
  }, (url) => { if (url) imgEl.src = url; });
}

export function itemThumb(type, imgEl) {
  request(`item:${type}`, () => {
    const g = buildItem(type);
    const box = new THREE.Box3().setFromObject(g);
    const size = box.getSize(new THREE.Vector3());
    const r = Math.max(size.x, size.y * 1.3, size.z);
    return render(g, { dist: 1.5 + r * 2.1, height: 0.8 + r * 0.9, ty: size.y * 0.45, yaw: 0.6 });
  }, (url) => { if (url) imgEl.src = url; });
}
