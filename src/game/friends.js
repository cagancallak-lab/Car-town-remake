// Friend codes: a compact, copy-pasteable snapshot of a player (name, avatar,
// level and best car). Importing one adds that friend to your street so you
// can race their car asynchronously, like the original game's friend races.

import { MODELS } from '../cars/models.js';

const PREFIX = 'CT1-';

function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

const CFG_KEYS = ['model', 'paint', 'roof', 'finish', 'rim', 'rimColor', 'caliper', 'livery', 'liveryColor', 'number', 'spoiler', 'tint', 'neon', 'lower', 'upgrades'];

export function makeFriendCode(state) {
  const d = state.data;
  const car = state.activeCar;
  const cfg = {};
  for (const k of CFG_KEYS) if (car?.cfg[k] !== undefined && car?.cfg[k] !== null) cfg[k] = car.cfg[k];
  const payload = { n: d.player.name, a: d.player.avatar, l: d.level, w: d.stats.wins, c: cfg };
  return PREFIX + b64urlEncode(JSON.stringify(payload));
}

/** Validates a car config received from another player. */
export function sanitizeCfg(c) {
  if (!c || !MODELS[c.model]) return { model: 'hatch' };
  const car = {};
  for (const k of CFG_KEYS) if (c[k] !== undefined) car[k] = c[k];
  const color = /^#[0-9a-f]{6}$/i;
  for (const k of ['paint', 'roof', 'rimColor', 'caliper', 'liveryColor', 'neon']) if (car[k] && !color.test(car[k])) delete car[k];
  if (car.upgrades && typeof car.upgrades === 'object') {
    const u = {};
    for (const k of ['engine', 'turbo', 'gearbox', 'tires', 'weight', 'nitro']) u[k] = Math.max(0, Math.min(3, Number(car.upgrades[k]) || 0));
    car.upgrades = u;
  } else delete car.upgrades;
  if (car.tint !== undefined) car.tint = Math.max(0, Math.min(1, Number(car.tint) || 0));
  if (car.lower !== undefined) car.lower = Math.max(0, Math.min(3, Number(car.lower) || 0));
  if (car.number !== undefined) car.number = Math.max(1, Math.min(99, Number(car.number) || 1));
  for (const k of ['finish', 'rim', 'livery', 'spoiler']) if (car[k] !== undefined && typeof car[k] !== 'string') delete car[k];
  return car;
}

export function parseFriendCode(code) {
  code = (code || '').trim();
  if (!code.startsWith(PREFIX)) return null;
  try {
    const p = JSON.parse(b64urlDecode(code.slice(PREFIX.length)));
    if (!p || typeof p.n !== 'string' || !p.c || !MODELS[p.c.model]) return null;
    const car = sanitizeCfg(p.c);
    const color = /^#[0-9a-f]{6}$/i;
    const av = p.a && typeof p.a === 'object' ? p.a : {};
    const avatar = {};
    for (const k of ['skin', 'hair', 'shirt']) if (color.test(av[k] || '')) avatar[k] = av[k];
    if (['short', 'long', 'bun', 'cap'].includes(av.style)) avatar.style = av.style;
    return {
      id: `fc_${p.n.slice(0, 14)}_${Math.abs(hash(code)) % 100000}`,
      name: p.n.slice(0, 14),
      avatar,
      level: Math.max(1, Math.min(99, Number(p.l) || 1)),
      wins: Number(p.w) || 0,
      car,
      imported: true,
    };
  } catch (e) {
    return null;
  }
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
