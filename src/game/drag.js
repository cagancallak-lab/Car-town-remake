// Drag race physics + AI drivers. Pure logic (no rendering) so it can run on
// both clients of an online race and be unit tested.

import { MODELS } from '../cars/models.js';

export const RACE_DISTANCE = 201.2; // 1/8 mile in metres
const G = 9.81;
const WHEEL_R = 0.33;
const IDLE = 900;

export function carPerformance(cfg) {
  const spec = MODELS[cfg.model];
  const st = spec.stats;
  const up = { engine: 0, turbo: 0, gearbox: 0, tires: 0, weight: 0, nitro: 0, ...(cfg.upgrades || {}) };
  const hp = st.hp * (1 + 0.08 * up.engine) * (1 + 0.1 * up.turbo);
  const kg = st.kg * (1 - 0.05 * up.weight);
  const grip = st.grip * (1 + 0.06 * up.tires);
  const gears = st.gears;
  const redline = st.redline;
  const vmax = (60 + 9.5 * Math.sqrt(hp)) / 3.6;
  const g1 = 3.4;
  const gn = gears >= 7 ? 0.68 : gears >= 6 ? 0.75 : gears >= 5 ? 0.82 : 1.0;
  const ratios = [];
  for (let i = 0; i < gears; i++) ratios.push(g1 * Math.pow(gn / g1, gears > 1 ? i / (gears - 1) : 0));
  const finalDrive = ((redline / 60) * 2 * Math.PI * WHEEL_R) / (gn * vmax);
  const cda = spec.class.includes('SUV') || spec.class === 'Van' || spec.class === 'Truck' || spec.class === 'Off-road' ? 0.95 : 0.7;
  return {
    hp, kg, grip, gears, redline, ratios, finalDrive, cda, vmax,
    shiftTime: 0.34 - 0.07 * up.gearbox,
    nitroPower: 0.3 + 0.1 * up.nitro,
    nitroTime: 2.0 + 0.6 * up.nitro,
    electric: !!spec.electric,
  };
}

/** Power fraction available at a given rpm fraction. */
function powerCurve(x, electric) {
  if (electric) return x < 0.35 ? 0.45 + (x / 0.35) * 0.55 : 1 - Math.max(0, x - 0.92) * 2;
  if (x <= 0.82) return 0.3 + 0.7 * Math.sin((Math.PI / 2) * (x / 0.82));
  return 1 - (x - 0.82) * 1.6;
}

export const LAUNCH_ZONE = [0.55, 0.75];
export const SHIFT_ZONE = [0.86, 0.97];

export class DragCar {
  constructor(cfg, { ai = null } = {}) {
    this.cfg = cfg;
    this.perf = carPerformance(cfg);
    this.ai = ai; // { skill }
    this.reset();
  }

  reset() {
    this.t = 0;
    this.dist = 0;
    this.v = 0;
    this.gear = 1;
    this.rpm = IDLE;
    this.throttle = false;
    this.launched = false;
    this.finished = false;
    this.finishTime = 0;
    this.trapSpeed = 0;
    this.shiftTimer = 0;
    this.spinTimer = 0;
    this.bogTimer = 0;
    this.boostTimer = 0;
    this.nitroLeft = this.perf.nitroTime;
    this.nitroOn = false;
    this.nitroUsed = false;
    this.limiterTime = 0;
    this.events = [];
    this.aiPlan = null;
    this.maxV = 0;
  }

  get rpmFrac() {
    return this.rpm / this.perf.redline;
  }

  get speedKmh() {
    return this.v * 3.6;
  }

  /** rpm implied by wheel speed in current gear */
  wheelRpm(gear = this.gear) {
    const p = this.perf;
    return (this.v / (2 * Math.PI * WHEEL_R)) * 60 * p.ratios[gear - 1] * p.finalDrive;
  }

  pushEvent(type, text) {
    this.events.push({ type, text, t: this.t });
  }

  /** Called when the green light shows. */
  launch() {
    if (this.launched) return;
    this.launched = true;
    const x = this.rpmFrac;
    if (x >= LAUNCH_ZONE[0] && x <= LAUNCH_ZONE[1]) {
      this.boostTimer = 1.2;
      this.pushEvent('launch', 'perfectLaunch');
    } else if (x < 0.4) {
      this.bogTimer = 1.1;
      this.pushEvent('launch', 'badLaunch');
    } else if (x > 0.85) {
      this.spinTimer = 1.1;
      this.pushEvent('launch', 'wheelspin');
    } else {
      this.pushEvent('launch', 'goodLaunch');
    }
  }

  shiftUp() {
    if (!this.launched || this.finished || this.shiftTimer > 0) return;
    if (this.gear >= this.perf.gears) return;
    const x = this.rpmFrac;
    let time = this.perf.shiftTime;
    if (x >= SHIFT_ZONE[0] && x <= SHIFT_ZONE[1]) {
      time *= 0.45;
      this.boostTimer = Math.max(this.boostTimer, 0.8);
      this.pushEvent('shift', 'perfectShift');
    } else if (x < 0.74) {
      this.pushEvent('shift', 'earlyShift');
    } else if (x > SHIFT_ZONE[1] && this.limiterTime > 0.15) {
      this.pushEvent('shift', 'lateShift');
    } else {
      this.pushEvent('shift', 'goodShift');
    }
    this.gear++;
    this.shiftTimer = time;
    this.limiterTime = 0;
  }

  useNitro() {
    if (!this.launched || this.nitroUsed || this.finished) return;
    this.nitroUsed = true;
    this.nitroOn = true;
    this.pushEvent('nitro', 'nitro');
  }

  /** Pre-launch revving (throttle held or not). */
  updateRev(dt) {
    const p = this.perf;
    if (this.throttle) this.rpm += (p.redline * 1.05 - this.rpm) * Math.min(1, dt * 2.6) + 900 * dt;
    else this.rpm += (IDLE - this.rpm) * Math.min(1, dt * 3.2);
    this.rpm = Math.min(this.rpm, p.redline);
  }

  update(dt) {
    if (!this.launched) {
      if (this.ai) this.aiPreLaunch(dt);
      this.updateRev(dt);
      return;
    }
    if (this.finished) {
      // coast down after the line
      this.v = Math.max(0, this.v - 6 * dt);
      this.dist += this.v * dt;
      this.rpm += (IDLE * 1.5 - this.rpm) * Math.min(1, dt * 2);
      return;
    }
    if (this.ai) this.aiDrive(dt);
    const p = this.perf;
    this.t += dt;

    const wheelRpm = this.wheelRpm();
    // clutch slip at launch: engine rpm can't drop below a launch floor in 1st gear
    let rpm = this.gear === 1 ? Math.max(wheelRpm, p.redline * 0.42 * Math.min(1, this.t * 3 + 0.4)) : wheelRpm;
    if (this.shiftTimer > 0) {
      this.shiftTimer -= dt;
      rpm = this.rpm + (wheelRpm - this.rpm) * Math.min(1, dt * 12);
    }
    rpm = Math.min(Math.max(rpm, IDLE), p.redline * 1.01);
    this.rpm = rpm;
    const x = rpm / p.redline;

    let power = p.hp * 745.7 * powerCurve(Math.min(x, 1), p.electric);
    if (x >= 0.995) {
      this.limiterTime += dt;
      power *= 0.12;
    }
    if (this.shiftTimer > 0) power = 0;
    if (this.bogTimer > 0) { this.bogTimer -= dt; power *= 0.5; }
    if (this.boostTimer > 0) { this.boostTimer -= dt; power *= 1.06; }
    if (this.nitroOn) {
      this.nitroLeft -= dt;
      power *= 1 + p.nitroPower;
      if (this.nitroLeft <= 0) this.nitroOn = false;
    }
    let traction = p.grip * 1.02 * p.kg * G;
    if (this.spinTimer > 0) { this.spinTimer -= dt; traction *= 0.55; }
    if (this.boostTimer > 0 && this.t < 1.3) traction *= 1.08;
    const drive = Math.min(power / Math.max(this.v, 1.2), traction);
    const aero = 0.5 * 1.2 * p.cda * this.v * this.v;
    const roll = 0.015 * p.kg * G;
    const a = (drive - aero - roll) / p.kg;
    this.v = Math.max(0, this.v + a * dt);
    this.maxV = Math.max(this.maxV, this.v);
    this.dist += this.v * dt;
    if (this.dist >= RACE_DISTANCE) {
      // interpolate exact finish time
      const over = this.dist - RACE_DISTANCE;
      this.finishTime = this.t - over / Math.max(this.v, 0.1);
      this.trapSpeed = this.v * 3.6;
      this.finished = true;
    }
  }

  // --- AI ------------------------------------------------------------------------
  aiPreLaunch() {
    if (!this.aiPlan) {
      const s = this.ai.skill;
      const err = (1 - s) * 0.32 * (Math.random() * 2 - 1);
      this.aiPlan = {
        launchTarget: 0.65 + err,
        shiftTarget: 0.915 + (1 - s) * 0.14 * (Math.random() * 2 - 1.2),
        nitroGear: Math.random() < 0.4 + s * 0.6 ? Math.min(this.perf.gears, 2 + Math.floor(Math.random() * 2)) : 99,
        reactDelay: 0.05 + (1 - s) * 0.15 * Math.random(),
      };
    }
    this.throttle = this.rpmFrac < this.aiPlan.launchTarget;
  }

  aiDrive(dt) {
    const plan = this.aiPlan;
    if (!plan) return;
    if (this.shiftTimer <= 0 && this.rpmFrac >= plan.shiftTarget) {
      this.shiftUp();
      // re-roll the target a little each gear
      const s = this.ai.skill;
      plan.shiftTarget = 0.915 + (1 - s) * 0.14 * (Math.random() * 2 - 1.2);
    }
    if (this.gear >= plan.nitroGear && this.shiftTimer <= 0) this.useNitro();
  }
}

/** Estimated 1/8 mile time for UI stats (fast simulation with a decent driver). */
export function estimateET(cfg) {
  const c = new DragCar(cfg, { ai: { skill: 0.92 } });
  c.aiPlan = { launchTarget: 0.65, shiftTarget: 0.92, nitroGear: 99, reactDelay: 0 };
  c.rpm = c.perf.redline * 0.65;
  c.launch();
  c.events = [];
  for (let i = 0; i < 4000 && !c.finished; i++) c.update(1 / 120);
  return { et: c.finishTime, trap: c.trapSpeed };
}

export function ratingOf(cfg) {
  const { et } = estimateET(cfg);
  return Math.max(1, Math.round((14 - et) * 100));
}
