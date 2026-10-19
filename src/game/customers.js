// NPC customers: they drive in from the street, park on a free service
// station, wait for the player to start a service, then pay and leave.

import * as THREE from 'three';
import { createCar, defaultConfig } from '../cars/carFactory.js';
import { NPC_MODEL_IDS } from '../cars/models.js';
import { SERVICES, PAINT_COLORS } from './catalog.js';
import { PathMover, headingOf } from '../world/mover.js';
import { astar, simplifyPath } from './pathfind.js';
import { pick, rand, el, fmt } from '../core/util.js';
import { audio } from '../core/audio.js';
import { t } from '../core/i18n.js';
import { icon, SERVICE_ICON } from '../ui/icons.js';

const PATIENCE = 90;
const AUTO_COLLECT = 25;

export class CustomerManager {
  constructor(scene) {
    this.scene = scene; // GarageScene
    this.list = [];
    this.spawnTimer = 4;
    this.paused = false;
  }

  get state() { return this.scene.state; }

  clear() {
    for (const c of this.list) this.despawn(c);
    this.list = [];
  }

  despawn(c) {
    c.label?.remove();
    if (c.station) c.station.occupant = null;
    if (c.mechanic) this.scene.releaseMechanic(c.mechanic);
    this.scene.root.remove(c.obj);
    c.obj.userData.car?.dispose();
    c.gone = true;
  }

  update(dt) {
    if (this.paused) return;
    const lux = this.state.luxuryTier();
    this.spawnTimer -= dt;
    const free = this.scene.stations.filter((s) => !s.occupant);
    if (this.spawnTimer <= 0) {
      this.spawnTimer = rand(9, 16) / (1 + lux.rateBonus);
      if (free.length && this.list.length < this.scene.stations.length) this.spawn(pick(free));
    }
    for (const c of this.list) this.updateCustomer(c, dt);
    this.list = this.list.filter((c) => !c.gone);
  }

  spawn(station) {
    const S = this.scene;
    const model = pick(NPC_MODEL_IDS);
    const cfg = {
      ...defaultConfig(model),
      paint: Math.random() < 0.5 ? defaultConfig(model).paint : pick(PAINT_COLORS),
      livery: Math.random() < 0.15 ? pick(['stripes', 'side', 'number']) : defaultConfig(model).livery,
    };
    if (model === 'police' || model === 'taxi') cfg.paint = defaultConfig(model).paint;
    const obj = createCar(cfg);
    const services = SERVICES[station.kind];
    const svc = pick(services);
    const R = S.layout;
    obj.position.set(R.lane1, 0, -40);
    obj.rotation.y = headingOf(0, 1);
    S.root.add(obj);
    obj.userData.pick = { type: 'customer' };
    const c = { obj, station, svc, cfg, phase: 'arriving', timer: 0, mover: null, label: null, progress: 0 };
    obj.userData.customer = c;
    station.occupant = c;
    this.list.push(c);
    const path = this.pathIn(c);
    c.mover = new PathMover(obj, path, { speed: 5 });
  }

  /** grid path from the driveway to the station's approach tile */
  lotPath(station, fromDrive = true) {
    const S = this.scene;
    const N = S.size;
    const dz = Math.min(N - 1, Math.floor(S.layout.driveZ));
    const ap = station.approach;
    const goal = { x: Math.min(N + 1, Math.max(0, Math.floor(ap.x))), z: Math.min(N - 1, Math.max(0, Math.floor(ap.z))) };
    const start = { x: N, z: dz };
    const blocked = (x, z) => S.isBlocked(x, z, station);
    const grid = astar(N, blocked, start, goal, { extraCols: 2 });
    let pts = grid ? simplifyPath(grid).map((p) => ({ x: p.x + 0.5, z: p.z + 0.5 })) : [{ x: N + 0.5, z: dz + 0.5 }];
    if (!fromDrive) pts = pts.reverse();
    return pts;
  }

  pathIn(c) {
    const S = this.scene;
    const R = S.layout;
    const N = S.size;
    const st = c.station;
    const dz = R.driveZ;
    const pts = [
      { x: R.lane1, z: -40 },
      { x: R.lane1, z: dz - 4 },
      { x: R.lane1 - 0.6, z: dz - 1.2 },
      { x: N + 1.0, z: dz },
    ];
    const lot = this.lotPath(st);
    for (const p of lot) if (p.x < N + 0.9) pts.push(p);
    pts.push({ x: st.approach.x, z: st.approach.z });
    pts.push({ x: st.center.x + st.dir.x * 0.6, z: st.center.z + st.dir.z * 0.6 });
    pts.push({ x: st.center.x, z: st.center.z });
    return dedupe(pts);
  }

  pathOut(c) {
    const S = this.scene;
    const R = S.layout;
    const N = S.size;
    const st = c.station;
    const pts = [{ x: st.approach.x, z: st.approach.z }];
    const lot = this.lotPath(st, false);
    for (const p of lot) if (p.x < N + 0.9) pts.push(p);
    pts.push({ x: N + 1.0, z: R.driveZ });
    pts.push({ x: R.lane2 - 0.4, z: R.driveZ - 2.2 });
    pts.push({ x: R.lane2, z: R.driveZ - 6 });
    pts.push({ x: R.lane2, z: -45 });
    return dedupe(pts);
  }

  updateCustomer(c, dt) {
    const S = this.scene;
    c.timer += dt;
    switch (c.phase) {
      case 'arriving':
        if (c.mover.update(dt)) {
          c.phase = 'waiting';
          c.timer = 0;
          audio.pop();
          this.showBubble(c);
        }
        break;
      case 'waiting':
        if (c.timer > PATIENCE) {
          this.leave(c, true);
        } else if (c.bar) {
          c.bar.style.width = `${100 - (c.timer / PATIENCE) * 100}%`;
        }
        break;
      case 'working': {
        c.progress = Math.min(1, c.timer / c.svc.time);
        if (c.ring) {
          c.ring.style.setProperty('--p', `${c.progress * 360}deg`);
          c.ringText.textContent = `${Math.ceil(c.svc.time - c.timer)}s`;
        }
        S.animateStation(c.station, dt, true, c);
        if (c.progress >= 1) {
          c.phase = 'ready';
          c.timer = 0;
          if (c.svc.id === 'respray') this.respray(c);
          if (c.mechanic) {
            S.releaseMechanic(c.mechanic);
            c.mechanic = null;
          }
          this.showCollect(c);
          audio.pop();
        }
        break;
      }
      case 'ready':
        S.animateStation(c.station, dt, false, c);
        if (c.timer > AUTO_COLLECT) this.collect(c);
        break;
      case 'leaving':
        S.animateStation(c.station, dt, false, c);
        if (c.mover.update(dt)) {
          if (c.reverseDone) {
            this.despawn(c);
          } else {
            c.reverseDone = true;
            if (c.station.occupant === c) c.station.occupant = null;
            c.mover = new PathMover(c.obj, this.pathOut(c), { speed: 4.5 });
          }
        }
        break;
      default:
        break;
    }
  }

  showBubble(c) {
    c.label?.remove();
    const bar = el('div', { class: 'patience-fill' });
    const bubble = el('button', { class: 'bubble bubble-service', title: t('tapToService'), onclick: (e) => { e.stopPropagation(); this.interact(c); } },
      el('span', { class: 'bubble-icon', html: icon(SERVICE_ICON[c.svc.id] || 'wrench') }),
      el('span', { class: 'bubble-text' }, c.svc.name, el('small', { html: `${icon('fuel')} ${c.svc.fuel}` })),
      el('div', { class: 'patience' }, bar));
    c.bar = bar;
    c.label = S(this).labels.add(bubble, c.obj, { offsetY: c.obj.userData.car.height + 0.9 });
  }

  showCollect(c) {
    c.label?.remove();
    const coins = this.rewardCoins(c);
    const bubble = el('button', { class: 'bubble bubble-collect', onclick: (e) => { e.stopPropagation(); this.collect(c); } },
      el('span', { class: 'coin-icon', html: icon('coin') }), el('b', {}, `+${fmt(coins)}`));
    c.label = S(this).labels.add(bubble, c.obj, { offsetY: c.obj.userData.car.height + 0.9 + 0.6 });
  }

  rewardCoins(c) {
    const lux = this.state.luxuryTier();
    return Math.round(c.svc.coins * (1 + lux.tipBonus) * (1 + (this.state.level - 1) * 0.03));
  }

  interact(c) {
    if (c.phase === 'waiting') this.startService(c);
    else if (c.phase === 'ready') this.collect(c);
  }

  startService(c) {
    const st = this.state;
    if (!st.useFuel(c.svc.fuel)) {
      audio.error();
      S(this).ui?.toast(t('notEnoughFuel'), 'warn');
      S(this).ui?.flashFuel?.();
      return;
    }
    audio.click();
    if (c.svc.id === 'wash' || c.svc.id === 'wax') audio.whoosh();
    else audio.wrench();
    c.phase = 'working';
    c.timer = 0;
    c.label?.remove();
    const ringText = el('span', {}, `${c.svc.time}s`);
    const ring = el('div', { class: 'progress-ring' }, el('div', { class: 'ring-inner' }, el('span', { class: 'ring-icon', html: icon(SERVICE_ICON[c.svc.id] || 'wrench') }), ringText));
    c.ring = ring;
    c.ringText = ringText;
    c.label = S(this).labels.add(ring, c.obj, { offsetY: c.obj.userData.car.height + 1.3 });
    c.mechanic = S(this).assignMechanic(c.station);
  }

  collect(c) {
    if (c.phase !== 'ready') return;
    const coins = this.rewardCoins(c);
    const st = this.state;
    st.addCoins(coins);
    st.addXp(c.svc.xp);
    st.data.stats.served++;
    st.progressGoal('serve');
    audio.coin();
    const anchor = c.obj.position.clone().setY(c.obj.userData.car.height);
    S(this).labels.float(`+${fmt(coins)}`, anchor, { className: 'float-coins', offsetY: 0.8 });
    S(this).labels.float(`+${c.svc.xp} XP`, anchor, { className: 'float-xp', offsetY: 0.2, delay: 0.15 });
    S(this).ui?.pulseCoins?.();
    this.leave(c, false);
  }

  leave(c, angry) {
    c.label?.remove();
    c.label = null;
    if (angry) {
      const e = el('div', { class: 'bubble bubble-angry' }, '>:(');
      const h = S(this).labels.add(e, c.obj, { offsetY: c.obj.userData.car.height + 0.9 });
      setTimeout(() => h.remove(), 1600);
      S(this).ui?.toast(t('customerAngry'), 'warn');
    }
    c.phase = 'leaving';
    c.reverseDone = false;
    c.mover = new PathMover(c.obj, [{ x: c.station.center.x, z: c.station.center.z }, { x: c.station.approach.x, z: c.station.approach.z }], { speed: 2, reverse: true, smooth: false });
  }

  respray(c) {
    const newCfg = { ...c.cfg, paint: pick(PAINT_COLORS), livery: Math.random() < 0.4 ? pick(['stripes', 'flames', 'side', 'bolt']) : 'none' };
    const old = c.obj;
    const obj = createCar(newCfg);
    obj.position.copy(old.position);
    obj.rotation.copy(old.rotation);
    obj.userData.pick = { type: 'customer' };
    obj.userData.customer = c;
    this.scene.root.add(obj);
    this.scene.root.remove(old);
    old.userData.car.dispose();
    c.obj = obj;
    c.cfg = newCfg;
  }

  pickCustomer(obj) {
    return obj?.userData?.customer;
  }
}

function S(mgr) {
  return mgr.scene;
}

function dedupe(pts) {
  const out = [];
  for (const p of pts) {
    const q = out[out.length - 1];
    if (!q || Math.hypot(p.x - q.x, p.z - q.z) > 0.3) out.push(p);
  }
  return out;
}

export const _test = { dedupe };
void THREE;
