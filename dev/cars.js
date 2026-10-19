import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Engine } from '../src/core/engine.js';
import { createCar } from '../src/cars/carFactory.js';
import { MODEL_IDS } from '../src/cars/models.js';

const q = new URLSearchParams(location.search);
const engine = new Engine(document.getElementById('app'));
const scene = new THREE.Scene();
scene.background = new THREE.Color(q.get('bg') ? `#${q.get('bg')}` : '#2a55c9');
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
const hemi = new THREE.HemisphereLight(0xffffff, 0x5a6a80, 1.2);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-6, 10, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20 });
scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: q.get('floor') ? `#${q.get('floor')}` : '#2347b0', roughness: 0.9 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const only = q.get('model');
const ids = only ? only.split(',') : MODEL_IDS;
const cols = q.get('row') ? ids.length : Math.ceil(Math.sqrt(ids.length));
ids.forEach((id, i) => {
  const car = createCar({ model: id, ...(q.get('livery') ? { livery: q.get('livery') } : {}) }, { lod: q.get('lod') || 'high' });
  const sp = Number(q.get('sp') ?? 3.4);
  const x = (i % cols) * sp;
  const z = Math.floor(i / cols) * 2.6;
  car.position.set(x - ((cols - 1) * sp) / 2, 0, z - (Math.floor((ids.length - 1) / cols) * 2.6) / 2);
  car.rotation.y = Number(q.get('rot') ?? 0.6);
  scene.add(car);
});

const dist = Number(q.get('dist') ?? (ids.length === 1 ? 6 : 22));
const view = q.get('view') || 'iso';
const dirs = { iso: [1, 0.75, 1], front: [1, 0.25, 0.05], side: [0.0, 0.2, 1], rear: [-1, 0.35, 0.3], top: [0.01, 1, 0.01], fq: [1, 0.35, 0.6] };
const camQ = q.get('cam');
const d = new THREE.Vector3(...(camQ ? camQ.split(',').map(Number) : dirs[view])).normalize().multiplyScalar(dist);
if (q.get('fov')) { camera.fov = Number(q.get('fov')); camera.updateProjectionMatrix(); }
// pos=x,y,z & look=x,y,z place the camera exactly (world units)
camera.position.copy(q.get('pos') ? new THREE.Vector3(...q.get('pos').split(',').map(Number)) : d);
const controls = new OrbitControls(camera, engine.renderer.domElement);
if (q.get('look')) controls.target.set(...q.get('look').split(',').map(Number));
else controls.target.set(0, Number(q.get('ty') ?? 0.5), 0);
controls.update();
engine.setScene({
  scene, camera,
  onResize(w, h) { camera.aspect = w / h; camera.updateProjectionMatrix(); },
  update() { controls.update(); },
});
// env=studio: reflections from a room in the backdrop colour with a softbox
// overhead, closer to how the reference photos were lit
if (q.get('env') === 'studio') {
  const env = new THREE.Scene();
  const wall = scene.background.clone().lerp(new THREE.Color(1, 1, 1), Number(q.get('mix') ?? 0));
  const room = new THREE.Mesh(new THREE.BoxGeometry(30, 14, 30), new THREE.MeshBasicMaterial({ color: wall, side: THREE.BackSide }));
  room.position.y = 6;
  env.add(room);
  const soft = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(Number(q.get('soft') ?? 3)) }));
  soft.position.set(0, 12.9, 0);
  soft.rotation.x = Math.PI / 2;
  env.add(soft);
  const pm = new THREE.PMREMGenerator(engine.renderer);
  scene.environment = pm.fromScene(env, 0.02).texture;
  pm.dispose();
}
window.__ready = true;
