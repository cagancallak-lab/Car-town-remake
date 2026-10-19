// Persistent game state: economy, levels, fuel, owned cars and garage layout.

import { Emitter, uid, clamp } from '../core/util.js';
import { defaultConfig } from '../cars/carFactory.js';
import { ITEMS, FLOORS, WALLS, EXPANSIONS, GOAL_DEFS } from './catalog.js';

const SAVE_KEY = 'cartown-remake-save-v1';
export const FUEL_REGEN_SECONDS = 150;

export function xpForLevel(level) {
  // cumulative XP needed to reach `level`
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 1; l < level; l++) total += Math.round(60 * Math.pow(l, 1.45) + 40);
  return total;
}

function freshState() {
  return {
    version: 1,
    started: false,
    player: { name: 'Player', avatar: { skin: '#f1c7a3', hair: '#3b2414', shirt: '#d9262b', style: 'short' } },
    coins: 3116,
    cash: 5,
    xp: 0,
    level: 1,
    fuel: 10,
    fuelTs: Date.now(),
    cars: [],
    activeCar: null,
    garage: {
      size: 14,
      floor: 'tile',
      wall: 'white',
      ownedFloors: ['tile'],
      ownedWalls: ['white'],
      items: [],
    },
    friends: [],
    stats: { served: 0, races: 0, wins: 0, earned: 0, driven: 0 },
    goals: null,
    settings: { sfx: true, music: true, lang: 'en', quality: 'high' },
  };
}

function starterItems(size) {
  const n = size;
  const items = [
    { type: 'lift', x: n - 5, z: 1, rot: 0 },
    { type: 'lift', x: n - 5, z: 4, rot: 0 },
    { type: 'toolchest', x: n - 1, z: 0, rot: 0 },
    { type: 'tirerack', x: n - 4, z: 0, rot: 0 },
    { type: 'compressor', x: n - 6, z: 0, rot: 0 },
    { type: 'desk', x: 6, z: n - 3, rot: 0 },
    { type: 'arcade', x: 3, z: n - 3, rot: 0 },
    { type: 'xmastree', x: 4, z: n - 3, rot: 0 },
    { type: 'stopsign', x: 8, z: n - 4, rot: 0 },
    { type: 'vending', x: 0, z: n - 1, rot: 0 },
    { type: 'plant', x: 0, z: 0, rot: 0 },
    { type: 'barrels', x: n - 1, z: 6, rot: 0 },
    { type: 'poster', x: 0, z: 3, rot: 0, wall: 'x' },
    { type: 'poster', x: 0, z: 6, rot: 0, wall: 'x' },
    { type: 'poster', x: 0, z: 9, rot: 0, wall: 'x' },
    { type: 'poster', x: 4, z: 0, rot: 0, wall: 'z' },
    { type: 'neonsign', x: 7, z: 0, rot: 0, wall: 'z' },
    { type: 'clock', x: 2, z: 0, rot: 0, wall: 'z' },
  ];
  return items.map((it) => ({ uid: uid('it'), ...it }));
}

export class GameState extends Emitter {
  constructor() {
    super();
    this.data = freshState();
    this.load();
    this._saveTimer = null;
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1) this.data = { ...freshState(), ...parsed };
      }
    } catch (e) {
      console.warn('Could not load save', e);
    }
    this.data.garage = { ...freshState().garage, ...this.data.garage };
    this.data.settings = { ...freshState().settings, ...this.data.settings };
    this.data.stats = { ...freshState().stats, ...this.data.stats };
  }

  save() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.saveNow(), 300);
  }

  saveNow() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      /* storage may be unavailable (private mode) — the game still runs */
    }
  }

  reset() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    this.data = freshState();
    this.emit('reset');
  }

  // --- New game ------------------------------------------------------------------------
  startNewGame(name, starterModel) {
    const d = this.data;
    d.started = true;
    d.player.name = (name || 'Player').slice(0, 14);
    d.garage.items = starterItems(d.garage.size);
    const car = this.addCar({ ...defaultConfig(starterModel), number: 1 });
    d.activeCar = car.id;
    this.resetGoals();
    this.save();
    this.emit('change');
  }

  // --- Currency ------------------------------------------------------------------------
  get coins() { return this.data.coins; }
  get cash() { return this.data.cash; }
  get level() { return this.data.level; }

  canAfford(coins = 0, cash = 0) {
    return this.data.coins >= coins && this.data.cash >= cash;
  }

  spend(coins = 0, cash = 0) {
    if (!this.canAfford(coins, cash)) return false;
    this.data.coins -= coins;
    this.data.cash -= cash;
    this.emit('money');
    this.save();
    return true;
  }

  addCoins(n) {
    this.data.coins += Math.round(n);
    if (n > 0) this.data.stats.earned += Math.round(n);
    this.emit('money');
    this.save();
  }

  addCash(n) {
    this.data.cash += n;
    this.emit('money');
    this.save();
  }

  addXp(n) {
    const d = this.data;
    d.xp += Math.round(n);
    let leveled = false;
    while (d.xp >= xpForLevel(d.level + 1)) {
      d.level++;
      leveled = true;
      d.cash += 1 + Math.floor(d.level / 5);
      d.fuel = Math.max(d.fuel, this.fuelMax);
      this.emit('levelup', d.level);
    }
    this.emit('xp', leveled);
    this.save();
  }

  levelProgress() {
    const d = this.data;
    const a = xpForLevel(d.level);
    const b = xpForLevel(d.level + 1);
    return clamp((d.xp - a) / (b - a), 0, 1);
  }

  // --- Fuel (energy) -------------------------------------------------------------------
  get fuelMax() {
    return 10 + Math.floor((this.data.level - 1) / 5);
  }

  tickFuel() {
    const d = this.data;
    const now = Date.now();
    if (d.fuel >= this.fuelMax) {
      d.fuelTs = now;
      return;
    }
    const elapsed = (now - d.fuelTs) / 1000;
    if (elapsed >= FUEL_REGEN_SECONDS) {
      const gained = Math.floor(elapsed / FUEL_REGEN_SECONDS);
      d.fuel = Math.min(this.fuelMax, d.fuel + gained);
      d.fuelTs += gained * FUEL_REGEN_SECONDS * 1000;
      this.emit('fuel');
      this.save();
    }
  }

  fuelSecondsLeft() {
    const d = this.data;
    if (d.fuel >= this.fuelMax) return 0;
    return FUEL_REGEN_SECONDS - (Date.now() - d.fuelTs) / 1000;
  }

  useFuel(n) {
    const d = this.data;
    if (d.fuel < n) return false;
    if (d.fuel >= this.fuelMax) d.fuelTs = Date.now();
    d.fuel -= n;
    this.emit('fuel');
    this.save();
    return true;
  }

  refuel() {
    this.data.fuel = this.fuelMax;
    this.data.fuelTs = Date.now();
    this.emit('fuel');
    this.save();
  }

  // --- Cars ------------------------------------------------------------------------
  get cars() { return this.data.cars; }

  getCar(id) {
    return this.data.cars.find((c) => c.id === id);
  }

  get activeCar() {
    return this.getCar(this.data.activeCar) || this.data.cars[0];
  }

  addCar(cfg) {
    const car = { id: uid('car'), cfg, placed: null };
    this.data.cars.push(car);
    this.emit('cars');
    this.save();
    return car;
  }

  removeCar(id) {
    this.data.cars = this.data.cars.filter((c) => c.id !== id);
    if (this.data.activeCar === id) this.data.activeCar = this.data.cars[0]?.id || null;
    this.emit('cars');
    this.save();
  }

  updateCar(id, cfg) {
    const car = this.getCar(id);
    if (!car) return;
    car.cfg = cfg;
    this.emit('cars');
    this.save();
  }

  setActiveCar(id) {
    this.data.activeCar = id;
    this.emit('cars');
    this.save();
  }

  // --- Garage --------------------------------------------------------------------
  get garage() { return this.data.garage; }

  luxury() {
    const g = this.data.garage;
    let lux = 0;
    for (const it of g.items) lux += ITEMS[it.type]?.lux || 0;
    lux += FLOORS[g.floor]?.lux || 0;
    lux += WALLS[g.wall]?.lux || 0;
    lux += (EXPANSIONS.findIndex((e) => e.size === g.size)) * 5;
    lux += this.data.cars.length * 2;
    return lux;
  }

  luxuryTier() {
    const lux = this.luxury();
    const tiers = [0, 30, 60, 100, 150, 220, 300];
    let tier = 0;
    while (tier + 1 < tiers.length && lux >= tiers[tier + 1]) tier++;
    return { tier: tier + 1, lux, next: tiers[tier + 1] ?? null, tipBonus: tier * 0.08, rateBonus: tier * 0.1 };
  }

  // --- Goals ------------------------------------------------------------------------
  resetGoals() {
    const day = new Date().toISOString().slice(0, 10);
    this.data.goals = { day, list: GOAL_DEFS.map((g) => ({ id: g.id, progress: 0, claimed: false })) };
  }

  ensureGoals() {
    const day = new Date().toISOString().slice(0, 10);
    if (!this.data.goals || this.data.goals.day !== day) this.resetGoals();
  }

  progressGoal(id, n = 1) {
    this.ensureGoals();
    const g = this.data.goals.list.find((x) => x.id === id);
    if (!g || g.claimed) return;
    const def = GOAL_DEFS.find((x) => x.id === id);
    const before = g.progress;
    g.progress = Math.min(def.n, g.progress + n);
    if (before < def.n && g.progress >= def.n) this.emit('goal', def);
    this.emit('goals');
    this.save();
  }
}
