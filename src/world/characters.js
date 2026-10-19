// Chibi avatars (big heads, tiny bodies) used for the player, mechanics and
// friends, plus canvas portraits for the UI.

import * as THREE from 'three';
import { mat } from './props.js';

const geo = {
  head: new THREE.SphereGeometry(0.26, 20, 14),
  hairCap: new THREE.SphereGeometry(0.275, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
  eye: new THREE.SphereGeometry(0.035, 8, 6),
  body: new THREE.CapsuleGeometry(0.15, 0.2, 4, 10),
  limb: new THREE.CapsuleGeometry(0.055, 0.2, 4, 8),
  bun: new THREE.SphereGeometry(0.12, 10, 8),
  brim: new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16, 1, false, -Math.PI / 2, Math.PI),
};

export function buildAvatar(av = {}) {
  const skin = mat(av.skin || '#f1c7a3', { rough: 0.7 });
  const shirt = mat(av.shirt || '#2f6fd6', { rough: 0.7 });
  const pants = mat(av.pants || '#2b3550', { rough: 0.8 });
  const hair = mat(av.hair || '#3b2414', { rough: 0.8 });
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);
  const mk = (g, m, x, y, z) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    return mesh;
  };
  const legL = new THREE.Group();
  const legR = new THREE.Group();
  legL.position.set(0, 0.32, 0.07);
  legR.position.set(0, 0.32, -0.07);
  legL.add(mk(geo.limb, pants, 0, -0.15, 0));
  legR.add(mk(geo.limb, pants, 0, -0.15, 0));
  bodyPivot.add(legL, legR);
  const body = mk(geo.body, shirt, 0, 0.5, 0);
  bodyPivot.add(body);
  const armL = new THREE.Group();
  const armR = new THREE.Group();
  armL.position.set(0, 0.62, 0.2);
  armR.position.set(0, 0.62, -0.2);
  armL.add(mk(geo.limb, shirt, 0, -0.12, 0));
  armR.add(mk(geo.limb, shirt, 0, -0.12, 0));
  bodyPivot.add(armL, armR);
  const head = new THREE.Group();
  head.position.y = 0.98;
  head.add(mk(geo.head, skin, 0, 0, 0));
  const style = av.style || 'short';
  if (style === 'cap') {
    const capM = mat(av.capColor || '#d9262b', { rough: 0.6 });
    head.add(mk(geo.hairCap, capM, 0, 0.02, 0));
    const brim = mk(geo.brim, capM, 0.16, 0.08, 0);
    brim.rotation.y = Math.PI / 2;
    head.add(brim);
  } else {
    const cap = mk(geo.hairCap, hair, -0.02, 0.02, 0);
    cap.rotation.z = 0.25;
    head.add(cap);
    if (style === 'long') {
      const back = mk(new THREE.CapsuleGeometry(0.2, 0.25, 4, 10), hair, -0.12, -0.15, 0);
      head.add(back);
    } else if (style === 'bun') {
      head.add(mk(geo.bun, hair, -0.08, 0.27, 0));
    }
  }
  const eyeM = mat('#1a1a1a', { rough: 0.3 });
  head.add(mk(geo.eye, eyeM, 0.235, 0.02, 0.08));
  head.add(mk(geo.eye, eyeM, 0.235, 0.02, -0.08));
  const blush = mat('#ff9a9a', { rough: 0.9 });
  const bl = mk(new THREE.SphereGeometry(0.03, 6, 4), blush, 0.22, -0.06, 0.13);
  const br = mk(new THREE.SphereGeometry(0.03, 6, 4), blush, 0.22, -0.06, -0.13);
  head.add(bl, br);
  bodyPivot.add(head);

  root.userData.avatar = { legL, legR, armL, armR, head, bodyPivot, phase: Math.random() * 6 };
  return root;
}

/** Animate walk (speed in units/s) or idle. */
export function animateAvatar(root, dt, speed = 0, working = false) {
  const a = root.userData.avatar;
  if (!a) return;
  a.phase += dt * (speed > 0.05 ? 9 : working ? 10 : 2);
  const s = speed > 0.05 ? 0.7 : 0;
  a.legL.rotation.z = Math.sin(a.phase) * s;
  a.legR.rotation.z = -Math.sin(a.phase) * s;
  if (working) {
    a.armL.rotation.z = -1.6 + Math.sin(a.phase) * 0.4;
    a.armR.rotation.z = -1.2 + Math.cos(a.phase) * 0.5;
  } else {
    a.armL.rotation.z = -Math.sin(a.phase) * s * 0.8;
    a.armR.rotation.z = Math.sin(a.phase) * s * 0.8;
  }
  a.bodyPivot.position.y = speed > 0.05 ? Math.abs(Math.sin(a.phase)) * 0.05 : Math.sin(a.phase) * 0.01;
  a.head.rotation.z = speed > 0.05 ? 0 : Math.sin(a.phase * 0.5) * 0.05;
}

// --- 2D portraits for HTML UI ------------------------------------------------------------------
const portraitCache = new Map();
export function portrait(av = {}, size = 64) {
  const key = JSON.stringify(av) + size;
  if (portraitCache.has(key)) return portraitCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const s = size;
  const g = ctx.createLinearGradient(0, 0, 0, s);
  g.addColorStop(0, '#9fd3ff');
  g.addColorStop(1, '#4f8fe0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  // shoulders
  ctx.fillStyle = av.shirt || '#2f6fd6';
  ctx.beginPath();
  ctx.ellipse(s / 2, s * 1.02, s * 0.36, s * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  // head
  ctx.fillStyle = av.skin || '#f1c7a3';
  ctx.beginPath();
  ctx.arc(s / 2, s * 0.5, s * 0.27, 0, Math.PI * 2);
  ctx.fill();
  // hair
  const style = av.style || 'short';
  ctx.fillStyle = style === 'cap' ? (av.capColor || '#d9262b') : (av.hair || '#3b2414');
  ctx.beginPath();
  ctx.arc(s / 2, s * 0.47, s * 0.285, Math.PI * 1.02, Math.PI * 1.98);
  ctx.fill();
  if (style === 'long') {
    ctx.fillRect(s * 0.22, s * 0.45, s * 0.08, s * 0.32);
    ctx.fillRect(s * 0.7, s * 0.45, s * 0.08, s * 0.32);
  } else if (style === 'bun') {
    ctx.beginPath();
    ctx.arc(s / 2, s * 0.17, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 'cap') {
    ctx.fillRect(s * 0.5, s * 0.36, s * 0.3, s * 0.06);
  }
  // face
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.arc(s * 0.42, s * 0.53, s * 0.03, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.58, s * 0.53, s * 0.03, 0, 7); ctx.fill();
  ctx.strokeStyle = '#7a3b2b';
  ctx.lineWidth = s * 0.025;
  ctx.beginPath();
  ctx.arc(s / 2, s * 0.6, s * 0.07, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,120,0.45)';
  ctx.beginPath(); ctx.arc(s * 0.35, s * 0.6, s * 0.04, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.65, s * 0.6, s * 0.04, 0, 7); ctx.fill();
  const url = c.toDataURL();
  portraitCache.set(key, url);
  return url;
}
