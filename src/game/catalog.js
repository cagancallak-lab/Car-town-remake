// Static game data: car prices, garage items, themes, services, upgrades,
// friends and street racers.

import { MODELS, MODEL_IDS } from '../cars/models.js';

export const CAR_CATALOG = MODEL_IDS.map((id) => ({
  id,
  name: MODELS[id].name,
  brand: MODELS[id].brand,
  class: MODELS[id].class,
  price: MODELS[id].price,
  level: MODELS[id].level,
  featured: !!MODELS[id].featured,
  cash: MODELS[id].cashPrice || 0,
})).sort((a, b) => (b.featured - a.featured) || a.price - b.price);

export function carSellValue(car) {
  const base = MODELS[car.cfg.model].price * 0.6;
  const up = Object.values(car.cfg.upgrades || {}).reduce((s, l) => s + l, 0);
  return Math.round((base + up * 400) / 10) * 10;
}

// Garage items. w = tiles along x, d = tiles along z (at rotation 0).
export const ITEMS = {
  lift: { name: 'Service Lift', cat: 'services', w: 3, d: 2, price: 1500, lux: 5, level: 1, station: 'lift' },
  washbay: { name: 'Wash Bay', cat: 'services', w: 3, d: 2, price: 2500, lux: 8, level: 3, station: 'wash' },
  paintbooth: { name: 'Paint Booth', cat: 'services', w: 3, d: 2, price: 6000, lux: 12, level: 6, station: 'paint' },
  toolchest: { name: 'Tool Chest', cat: 'decor', w: 1, d: 1, price: 250, lux: 2, level: 1 },
  tirerack: { name: 'Tire Rack', cat: 'decor', w: 2, d: 1, price: 400, lux: 3, level: 1 },
  workbench: { name: 'Workbench', cat: 'decor', w: 2, d: 1, price: 350, lux: 3, level: 1 },
  desk: { name: 'Office Desk', cat: 'decor', w: 2, d: 1, price: 500, lux: 4, level: 1 },
  compressor: { name: 'Air Compressor', cat: 'decor', w: 1, d: 1, price: 200, lux: 1, level: 1 },
  barrels: { name: 'Oil Barrels', cat: 'decor', w: 1, d: 1, price: 120, lux: 1, level: 1 },
  cones: { name: 'Traffic Cones', cat: 'decor', w: 1, d: 1, price: 60, lux: 1, level: 1 },
  plant: { name: 'Potted Plant', cat: 'decor', w: 1, d: 1, price: 150, lux: 2, level: 1 },
  stopsign: { name: 'Stop Sign', cat: 'decor', w: 1, d: 1, price: 100, lux: 1, level: 1 },
  flag: { name: 'Checkered Flag', cat: 'decor', w: 1, d: 1, price: 300, lux: 2, level: 2 },
  xmastree: { name: 'Holiday Tree', cat: 'decor', w: 1, d: 1, price: 800, lux: 6, level: 2 },
  palm: { name: 'Palm Tree', cat: 'decor', w: 1, d: 1, price: 600, lux: 4, level: 3 },
  trophy: { name: 'Trophy Case', cat: 'decor', w: 1, d: 1, price: 1200, lux: 8, level: 4 },
  statue: { name: 'Golden Car Statue', cat: 'decor', w: 1, d: 1, price: 0, cash: 15, lux: 30, level: 5 },
  turntable: { name: 'Display Turntable', cat: 'decor', w: 3, d: 3, price: 5000, lux: 20, level: 8 },
  arcade: { name: 'Arcade Cabinet', cat: 'fun', w: 1, d: 1, price: 900, lux: 6, level: 2 },
  vending: { name: 'Soda Machine', cat: 'fun', w: 1, d: 1, price: 700, lux: 5, level: 1 },
  sofa: { name: 'Lounge Sofa', cat: 'fun', w: 2, d: 1, price: 650, lux: 5, level: 2 },
  jukebox: { name: 'Jukebox', cat: 'fun', w: 1, d: 1, price: 1100, lux: 7, level: 3 },
  airhockey: { name: 'Air Hockey', cat: 'fun', w: 2, d: 1, price: 1500, lux: 9, level: 5 },
  diner: { name: 'Diner Booth', cat: 'fun', w: 2, d: 2, price: 1800, lux: 10, level: 6 },
  poster: { name: 'Car Poster', cat: 'walls', w: 1, d: 1, price: 150, lux: 1, level: 1, wall: true },
  neonsign: { name: 'Neon Sign', cat: 'walls', w: 2, d: 1, price: 900, lux: 6, level: 3, wall: true },
  clock: { name: 'Garage Clock', cat: 'walls', w: 1, d: 1, price: 200, lux: 1, level: 1, wall: true },
  shelf: { name: 'Parts Shelf', cat: 'walls', w: 2, d: 1, price: 400, lux: 3, level: 2, wall: true },
};

export const FLOORS = {
  tile: { name: 'Cream Tiles', price: 0, lux: 0 },
  concrete: { name: 'Concrete', price: 1000, lux: 2, level: 1 },
  checker: { name: 'Checkerboard', price: 2000, lux: 6, level: 2 },
  wood: { name: 'Hardwood', price: 2500, lux: 7, level: 3 },
  dark: { name: 'Diamond Plate', price: 3000, lux: 9, level: 4 },
  blue: { name: 'Showroom Blue', price: 3500, lux: 10, level: 5 },
};

export const WALLS = {
  white: { name: 'Classic White', price: 0, lux: 0 },
  yellow: { name: 'Sunny Yellow', price: 1500, lux: 3, level: 1 },
  brick: { name: 'Red Brick', price: 1800, lux: 4, level: 2 },
  blue: { name: 'Racing Blue', price: 2000, lux: 5, level: 3 },
  dark: { name: 'Night Garage', price: 2500, lux: 6, level: 4 },
  racing: { name: 'Pit Lane', price: 3500, lux: 9, level: 6 },
};

export const EXPANSIONS = [
  { size: 14, price: 0, level: 1 },
  { size: 16, price: 8000, level: 3 },
  { size: 18, price: 20000, level: 6 },
  { size: 20, price: 45000, level: 10 },
  { size: 22, price: 90000, level: 14 },
];

export const SERVICES = {
  lift: [
    { id: 'oil', name: 'Oil Change', icon: '🛢️', time: 8, fuel: 1, coins: 45, xp: 8 },
    { id: 'tires', name: 'Tire Swap', icon: '🛞', time: 12, fuel: 1, coins: 65, xp: 11 },
    { id: 'brakes', name: 'Brake Job', icon: '🔧', time: 16, fuel: 2, coins: 110, xp: 18 },
    { id: 'tune', name: 'Engine Tune-Up', icon: '⚙️', time: 22, fuel: 2, coins: 150, xp: 24 },
  ],
  wash: [
    { id: 'wash', name: 'Car Wash', icon: '🫧', time: 6, fuel: 1, coins: 40, xp: 7 },
    { id: 'wax', name: 'Wax & Polish', icon: '✨', time: 10, fuel: 1, coins: 70, xp: 11 },
  ],
  paint: [
    { id: 'scratch', name: 'Scratch Repair', icon: '🎨', time: 15, fuel: 2, coins: 150, xp: 22 },
    { id: 'respray', name: 'Full Respray', icon: '🖌️', time: 26, fuel: 3, coins: 280, xp: 40 },
  ],
};

export const UPGRADES = [
  { key: 'engine', label: 'engine', icon: '🔩', effect: '+8% power' },
  { key: 'turbo', label: 'turbo', icon: '🌀', effect: '+10% power' },
  { key: 'gearbox', label: 'gearbox', icon: '⚙️', effect: 'faster shifts' },
  { key: 'tires', label: 'tires', icon: '🛞', effect: '+6% grip' },
  { key: 'weight', label: 'weightRed', icon: '🪶', effect: '-5% weight' },
  { key: 'nitro', label: 'nitrous', icon: '🔥', effect: 'bigger nitro' },
];
export const UPGRADE_MAX = 3;
export function upgradeCost(model, level) {
  const base = MODELS[model].price;
  return Math.round(((400 + base * 0.04) * [1, 2.2, 4][level]) / 10) * 10;
}

export const PAINT_COLORS = [
  '#f3f3f1', '#c9cdd2', '#7b8088', '#2b2d31', '#121316',
  '#d9262b', '#a3101a', '#ff5a1f', '#f08c1c', '#f2b705',
  '#f7e14a', '#9bd13a', '#1e9e4a', '#0f6b4a', '#22c3c9',
  '#8fd3e8', '#2f8be0', '#2f5fb8', '#1b2f7a', '#7a3fd0',
  '#c13cc8', '#ff6fb3', '#cdb48a', '#8a5a2b', '#e8d9b5',
];
export const NEON_COLORS = ['#ff2bd6', '#2be8ff', '#3cff6b', '#ffe12b', '#ff3b3b', '#7a5cff', '#ffffff'];
export const RIM_COLORS = ['#c9ccd1', '#e7e8ea', '#2b2d31', '#1c1d20', '#e3b51a', '#cfa27a', '#d9262b', '#2f8be0', '#3a3d42', '#f3f3f1'];

export const CUSTOM_PRICES = { paint: 250, finish: 300, roof: 150, rim: 400, rimColor: 150, caliper: 120, livery: 300, liveryColor: 100, spoiler: 450, tint: 150, neon: 1500, lower: 300 };

// Friends that visit and park outside (the names seen in the screenshots).
export const NPC_FRIENDS = [
  { id: 'f_daisy', name: 'Daisy', level: 6, avatar: { skin: '#f1c7a3', hair: '#e9b949', shirt: '#ff7aa8', style: 'long' }, car: { model: 'ioniq3' } },
  { id: 'f_eddy', name: 'Eddy', level: 9, avatar: { skin: '#c68a5e', hair: '#2a1b10', shirt: '#2f8be0', style: 'short' }, car: { model: 'muscle', paint: '#2f5fb8', livery: 'stripes', liveryColor: '#f3f3f1', upgrades: { engine: 2, turbo: 1, gearbox: 1, tires: 1, weight: 0, nitro: 1 } } },
  { id: 'f_joselia', name: 'Joselia', level: 12, avatar: { skin: '#8d5a3b', hair: '#1a1010', shirt: '#f2b705', style: 'bun' }, car: { model: 'amgsuv', upgrades: { engine: 1, turbo: 1, gearbox: 1, tires: 1, weight: 0, nitro: 0 } } },
  { id: 'f_mykola', name: 'Mykola', level: 7, avatar: { skin: '#f3d2b5', hair: '#6b4a2b', shirt: '#3a9d4a', style: 'cap' }, car: { model: 'van', paint: '#f2f0e8', roof: '#d9262b' } },
  { id: 'f_mel', name: 'Mel', level: 4, avatar: { skin: '#e7b48f', hair: '#a8322a', shirt: '#7a3fd0', style: 'long' }, car: { model: 'smart2', paint: '#22c3c9', roof: '#f3f3f1' } },
  { id: 'f_zoni', name: 'Zoni', level: 15, avatar: { skin: '#5a3825', hair: '#111', shirt: '#d9262b', style: 'short' }, car: { model: 'super', paint: '#121316', neon: '#ff2bd6', upgrades: { engine: 2, turbo: 2, gearbox: 2, tires: 2, weight: 1, nitro: 2 } } },
];

export const STREET_RACERS = [
  { id: 'r1', name: 'Rookie Rick', tier: 1, skill: 0.25, reward: 120, car: { model: 'hatch', paint: '#9bd13a' } },
  { id: 'r2', name: 'Bug Betty', tier: 1, skill: 0.35, reward: 150, car: { model: 'beetle', paint: '#ff6fb3', upgrades: { engine: 1, turbo: 0, gearbox: 0, tires: 0, weight: 0, nitro: 0 } } },
  { id: 'r3', name: 'Cabbie Carl', tier: 2, skill: 0.45, reward: 260, car: { model: 'taxi', upgrades: { engine: 1, turbo: 1, gearbox: 0, tires: 1, weight: 0, nitro: 0 } } },
  { id: 'r4', name: 'Volt Vera', tier: 2, skill: 0.55, reward: 380, car: { model: 'smart2', paint: '#2bd6a0', upgrades: { engine: 1, turbo: 1, gearbox: 1, tires: 1, weight: 1, nitro: 0 } } },
  { id: 'r5', name: 'Rally Ronnie', tier: 3, skill: 0.6, reward: 600, car: { model: 'rally', upgrades: { engine: 2, turbo: 1, gearbox: 1, tires: 2, weight: 1, nitro: 1 } } },
  { id: 'r6', name: 'Pixel Pia', tier: 3, skill: 0.65, reward: 750, car: { model: 'ioniq3', paint: '#2f8be0', upgrades: { engine: 2, turbo: 2, gearbox: 1, tires: 1, weight: 1, nitro: 1 } } },
  { id: 'r7', name: 'Sheriff Sam', tier: 4, skill: 0.7, reward: 1000, car: { model: 'police', upgrades: { engine: 2, turbo: 2, gearbox: 2, tires: 1, weight: 1, nitro: 1 } } },
  { id: 'r8', name: 'Grand Tour Gina', tier: 4, skill: 0.75, reward: 1300, car: { model: 'coupe', paint: '#d9262b', upgrades: { engine: 2, turbo: 2, gearbox: 2, tires: 2, weight: 1, nitro: 2 } } },
  { id: 'r9', name: 'Affalterbach Al', tier: 5, skill: 0.82, reward: 2000, car: { model: 'amgsuv', paint: '#121316', upgrades: { engine: 3, turbo: 2, gearbox: 2, tires: 2, weight: 2, nitro: 2 } } },
  { id: 'r10', name: 'Wedge Wanda', tier: 6, skill: 0.9, reward: 3500, car: { model: 'super', paint: '#f2b705', upgrades: { engine: 3, turbo: 3, gearbox: 3, tires: 3, weight: 2, nitro: 3 } } },
];

export const STARTER_CARS = ['hatch', 'beetle', 'smart2'];

export const GOAL_DEFS = [
  { id: 'serve', text: 'Service {n} customers', n: 8, coins: 400, xp: 40 },
  { id: 'race', text: 'Win {n} drag races', n: 2, coins: 500, xp: 50 },
  { id: 'custom', text: 'Customize a car', n: 1, coins: 200, xp: 20 },
  { id: 'decor', text: 'Place {n} new garage items', n: 2, coins: 300, xp: 25 },
  { id: 'drive', text: 'Drive {n} meters in town', n: 800, coins: 250, xp: 25 },
];
