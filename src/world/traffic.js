// Ambient street traffic on the two roads that meet at the garage corner.
// Cars keep their distance and yield at the intersection.

import { createCar, defaultConfig } from '../cars/carFactory.js';
import { NPC_MODEL_IDS } from '../cars/models.js';
import { PAINT_COLORS } from '../game/catalog.js';
import { pick, rand } from '../core/util.js';
import { headingOf } from './mover.js';

export class GarageTraffic {
  constructor(root, layout, { max = 7 } = {}) {
    this.root = root;
    this.R = layout;
    this.cars = [];
    this.max = max;
    this.timer = 1;
    const R = layout;
    // lanes: axis = coordinate that changes, fixed = the other coordinate, dir = +/-1
    this.lanes = [
      { axis: 'z', fixed: R.lane1, dir: 1, from: -45, to: R.far + 45 },
      { axis: 'z', fixed: R.lane2, dir: -1, from: R.far + 45, to: -45 },
      { axis: 'x', fixed: R.lane1, dir: -1, from: R.far + 45, to: -45 },
      { axis: 'x', fixed: R.lane2, dir: 1, from: -45, to: R.far + 45 },
    ];
  }

  clear() {
    for (const c of this.cars) {
      this.root.remove(c.obj);
      c.obj.userData.car.dispose();
    }
    this.cars = [];
  }

  spawn() {
    const lane = pick(this.lanes);
    // don't spawn on top of another car
    if (this.cars.some((c) => c.lane === lane && Math.abs(c.pos - lane.from) < 6)) return;
    const model = pick(NPC_MODEL_IDS);
    const cfg = { ...defaultConfig(model), paint: Math.random() < 0.6 ? defaultConfig(model).paint : pick(PAINT_COLORS) };
    const obj = createCar(cfg, { shadows: false, lod: 'low' });
    this.root.add(obj);
    const c = { obj, lane, pos: lane.from, speed: rand(4.5, 6.5), v: 5 };
    c.max = c.speed;
    this.place(c);
    this.cars.push(c);
  }

  place(c) {
    const L = c.lane;
    if (L.axis === 'z') {
      c.obj.position.set(L.fixed, 0, c.pos);
      c.obj.rotation.y = headingOf(0, L.dir);
    } else {
      c.obj.position.set(c.pos, 0, L.fixed);
      c.obj.rotation.y = headingOf(L.dir, 0);
    }
  }

  inIntersection(c, margin = 0) {
    const p = c.pos;
    return p > this.R.start - margin && p < this.R.end + margin;
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = rand(1.6, 3.5);
      if (this.cars.length < this.max) this.spawn();
    }
    const R = this.R;
    for (const c of this.cars) {
      const L = c.lane;
      let target = c.max;
      // keep distance to car ahead in same lane
      for (const o of this.cars) {
        if (o === c || o.lane !== L) continue;
        const d = (o.pos - c.pos) * L.dir;
        if (d > 0 && d < 5.5) target = Math.min(target, Math.max(0, (d - 3.2) * 2));
      }
      // yield at intersection: stop line before entering if a perpendicular car is inside
      const ahead = (L.dir > 0 ? R.start - 1.2 - c.pos : c.pos - (R.end + 1.2));
      if (ahead > 0 && ahead < 4) {
        const blocked = this.cars.some((o) => o !== c && o.lane.axis !== L.axis && this.inIntersection(o, 1.5));
        if (blocked) target = Math.min(target, Math.max(0, (ahead - 0.3) * 2));
      }
      c.v += Math.sign(target - c.v) * Math.min(Math.abs(target - c.v), 8 * dt);
      const step = c.v * dt;
      c.pos += step * L.dir;
      this.place(c);
      c.obj.userData.car.spinWheels(step);
      if ((L.dir > 0 && c.pos > L.to) || (L.dir < 0 && c.pos < L.to)) c.dead = true;
    }
    for (const c of this.cars) if (c.dead) { this.root.remove(c.obj); c.obj.userData.car.dispose(); }
    this.cars = this.cars.filter((c) => !c.dead);
  }
}
