// HUD for free-roam driving: speed, minimap, location prompts and touch
// controls. Handles the actions of each town location.

import { el, fmt } from '../core/util.js';
import { t } from '../core/i18n.js';
import { icon } from './icons.js';
import { confirmDialog } from './dom.js';
import { NPC_FRIENDS } from '../game/catalog.js';
import { audio } from '../core/audio.js';

export class TownUI {
  constructor(app) {
    this.app = app;
    this.root = null;
  }

  open() {
    const app = this.app;
    const town = app.town;
    town.setPlayerCar(app.state.activeCar.cfg);
    if (!town.traffic.length) town.spawnTraffic();
    app.setMode('town');
    app.engine.setScene(town);
    this.speed = el('b', {}, '0');
    this.prompt = el('button', { class: 'town-prompt hidden', onclick: () => this.activate() });
    this.map = el('canvas', { class: 'minimap', width: 180, height: 180 });
    this.coins = el('span', {});
    this.fuel = el('span', {});
    const touch = (dir) => el('button', {
      class: `touch-btn t-${dir}`,
      onpointerdown: (e) => { e.preventDefault(); (town.touch ||= {})[dir] = true; },
      onpointerup: () => { if (town.touch) town.touch[dir] = false; },
      onpointerleave: () => { if (town.touch) town.touch[dir] = false; },
    }, { up: '▲', down: '▼', left: '◀', right: '▶' }[dir]);
    this.root = el('div', { class: 'town-hud' },
      el('div', { class: 'town-top' },
        el('button', { class: 'btn btn-back', onclick: () => this.close() }, el('span', { html: icon('home') }), t('backToGarage')),
        el('div', { class: 'pill pill-coins' }, el('span', { class: 'pill-icon', html: icon('coin') }), this.coins),
        el('div', { class: 'pill pill-fuel' }, el('span', { class: 'pill-icon', html: icon('fuel') }), this.fuel),
        el('button', { class: 'btn btn-blue', onclick: () => { town.camMode = town.camMode === 'chase' ? 'top' : 'chase'; } }, 'Camera (C)')),
      this.map,
      el('div', { class: 'town-speed' }, this.speed, el('small', {}, 'km/h')),
      this.prompt,
      el('div', { class: 'town-help' }, t('driveHelp')),
      el('div', { class: 'touch-pad' }, touch('up'), touch('left'), touch('right'), touch('down')));
    app.uiRoot.appendChild(this.root);
    this.keyHandler = (e) => {
      if (app.mode !== 'town') return;
      if (e.code === 'KeyE' || e.code === 'Enter') this.activate();
      if (e.code === 'KeyC') town.camMode = town.camMode === 'chase' ? 'top' : 'chase';
      if (e.code === 'Escape') this.close();
      if (e.code === 'KeyH') audio.horn();
    };
    window.addEventListener('keydown', this.keyHandler);
    this.engine = audio.engine({ electric: town.perf.electric, vol: 0.12 });
    this.lastZone = null;
    this.driveAcc = 0;
  }

  close(toGarage = true) {
    window.removeEventListener('keydown', this.keyHandler);
    this.engine?.stop();
    this.engine = null;
    this.root?.remove();
    this.root = null;
    if (this.driveAcc > 0) this.app.state.progressGoal('drive', Math.round(this.driveAcc));
    this.driveAcc = 0;
    if (toGarage) this.app.goGarage();
  }

  activate() {
    const z = this.app.town.activeZone;
    if (!z) return;
    audio.click();
    const app = this.app;
    const id = z.id;
    if (id === 'garage') this.close();
    else if (id === 'dealer') { this.close(false); app.openDealer(); }
    else if (id === 'custom') { this.close(false); app.openCustomize(app.state.activeCar.id); }
    else if (id === 'race') { this.close(); app.openRaceMenu(); }
    else if (id === 'gas') this.refuel();
    else if (id === 'wash') this.wash();
    else if (id.startsWith('friend:')) {
      const f = NPC_FRIENDS.find((x) => x.id === id.slice(7));
      this.close();
      app.openRaceMenu({ friend: f, tab: 'friends' });
    }
  }

  async refuel() {
    const st = this.app.state;
    const missing = st.fuelMax - st.data.fuel;
    if (missing <= 0) {
      this.app.toast(t('fuelFull'));
      return;
    }
    const cost = missing * (20 + st.level * 4);
    if (!(await confirmDialog(t('refuelFor', { n: fmt(cost) }), { ok: t('refuel') }))) return;
    if (!st.spend(cost)) {
      audio.error();
      this.app.toast(t('notEnoughCoins'), 'warn');
      return;
    }
    st.refuel();
    audio.cash();
    this.app.toast(t('fuelRefilled'), 'good');
  }

  wash() {
    const st = this.app.state;
    if (this.washedAt && Date.now() - this.washedAt < 60000) {
      this.app.toast('Sparkling already! Come back in a minute.');
      return;
    }
    this.washedAt = Date.now();
    audio.whoosh();
    st.addXp(5);
    this.app.banner('✨ Squeaky clean!', '+5 XP', 'green');
  }

  update(dt) {
    const town = this.app.town;
    if (!this.root || !town?.player) return;
    const st = this.app.state;
    this.speed.textContent = Math.round(Math.abs(town.vel) * 3.6 * 2.2);
    this.coins.textContent = fmt(st.coins);
    this.fuel.textContent = `${st.data.fuel}/${st.fuelMax}`;
    this.driveAcc += Math.abs(town.vel * dt);
    if (this.driveAcc > 100) {
      st.progressGoal('drive', Math.round(this.driveAcc));
      this.driveAcc = 0;
    }
    const z = town.activeZone;
    if (z !== this.lastZone) {
      this.lastZone = z;
      if (z) {
        const label = z.id.startsWith('friend:') ? `${t('challenge')} ${z.label}` : t(z.label);
        this.prompt.innerHTML = `<b>${label}</b><small>${t('pressE')} / click</small>`;
        this.prompt.classList.remove('hidden');
        audio.pop();
      } else this.prompt.classList.add('hidden');
    }
    this.engine?.set(Math.min(1, 0.15 + Math.abs(town.vel) / 30), Math.abs(town.vel) > 0.5 ? 0.8 : 0.3);
    this.drawMap();
  }

  drawMap() {
    const town = this.app.town;
    const m = town.minimap();
    const c = this.map;
    const ctx = c.getContext('2d');
    const W = c.width;
    const pad = 10;
    const s = (W - pad * 2) / (m.size + m.roadW);
    const X = (x) => pad + (x + m.roadW / 2) * s;
    ctx.clearRect(0, 0, W, W);
    ctx.fillStyle = 'rgba(30,110,40,0.85)';
    ctx.beginPath();
    ctx.roundRect(0, 0, W, W, 14);
    ctx.fill();
    ctx.fillStyle = '#b9bcc0';
    for (let i = 0; i <= m.grid; i++) {
      ctx.fillRect(X(-m.roadW / 2), X(i * m.block - m.roadW / 2), (m.size + m.roadW) * s, m.roadW * s);
      ctx.fillRect(X(i * m.block - m.roadW / 2), X(-m.roadW / 2), m.roadW * s, (m.size + m.roadW) * s);
    }
    const colors = { garage: '#3cff6b', dealer: '#ffe14a', custom: '#ff4fa0', race: '#ff4fa0', gas: '#ffb347', wash: '#7fe0ff' };
    for (const z of m.zones) {
      ctx.fillStyle = colors[z.id] || '#ff8a1a';
      ctx.beginPath();
      ctx.arc(X(z.x), X(z.z), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const p of m.traffic) ctx.fillRect(X(p.x) - 2, X(p.z) - 2, 4, 4);
    ctx.save();
    ctx.translate(X(m.pos.x), X(m.pos.y));
    ctx.rotate(-m.heading);
    ctx.fillStyle = '#ff3b30';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, 6);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
