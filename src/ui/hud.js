// The in-garage HUD, laid out like the original game:
//  top-left  : speedometer level gauge + odometer XP, coins & cash, race/goals
//  top-centre: Photo button + 2x2 quick buttons
//  top-right : fuel gauge with refill timer
//  bottom    : map/town button, "My Garage" label, Edit / Buy / Luxury buttons

import { el, fmt, fmtTime } from '../core/util.js';
import { t } from '../core/i18n.js';
import { icon } from './icons.js';

function speedoSVG() {
  const ticks = [];
  for (let i = 0; i <= 20; i++) {
    const a = (-225 + (i / 20) * 270) * (Math.PI / 180);
    const r1 = i % 5 === 0 ? 38 : 41;
    ticks.push(`<line x1="${50 + Math.cos(a) * r1}" y1="${50 + Math.sin(a) * r1}" x2="${50 + Math.cos(a) * 45}" y2="${50 + Math.sin(a) * 45}" stroke="#fff" stroke-width="${i % 5 === 0 ? 2.2 : 1.2}"/>`);
  }
  return `<svg viewBox="0 0 100 100" class="speedo-svg">
    <defs>
      <linearGradient id="spdRim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d838c"/><stop offset="1" stop-color="#2a2d33"/></linearGradient>
      <radialGradient id="spdFace" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#3a3f47"/><stop offset="1" stop-color="#0d0f12"/></radialGradient>
      <linearGradient id="spdArc" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#3cd14a"/><stop offset=".6" stop-color="#f6d31b"/><stop offset="1" stop-color="#ee2a2a"/></linearGradient>
    </defs>
    <circle cx="50" cy="50" r="49" fill="url(#spdRim)"/>
    <circle cx="50" cy="50" r="45.5" fill="url(#spdFace)"/>
    <path class="spd-track" d="${arcPath(50, 50, 33, -225, 45)}" stroke="#2c3038" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path class="spd-arc" d="${arcPath(50, 50, 33, -225, 45)}" stroke="url(#spdArc)" stroke-width="7" fill="none" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100"/>
    ${ticks.join('')}
    <g class="spd-needle"><path d="M50 50 L50 13" stroke="#ff3b30" stroke-width="2.6" stroke-linecap="round"/></g>
    <circle cx="50" cy="50" r="4" fill="#d5d9df" stroke="#111" stroke-width="1"/>
    <text x="50" y="68" text-anchor="middle" class="spd-label">LEVEL</text>
    <text x="50" y="87" text-anchor="middle" class="spd-level">1</text>
  </svg>`;
}

function arcPath(cx, cy, r, a0, a1) {
  const p = (a) => [cx + Math.cos((a * Math.PI) / 180) * r, cy + Math.sin((a * Math.PI) / 180) * r];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

function fuelSVG() {
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const a = (-180 + i * 18) * (Math.PI / 180);
    ticks.push(`<line x1="${50 + Math.cos(a) * 34}" y1="${52 + Math.sin(a) * 34}" x2="${50 + Math.cos(a) * 40}" y2="${52 + Math.sin(a) * 40}" stroke="#222" stroke-width="${i % 5 === 0 ? 2.6 : 1.4}"/>`);
  }
  return `<svg viewBox="0 0 100 60" class="fuel-svg">
    <defs><linearGradient id="fuelFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe46b"/><stop offset="1" stop-color="#f2b705"/></linearGradient></defs>
    <path d="M4 54 A46 46 0 0 1 96 54 Z" fill="#2a2d33"/>
    <path d="M9 53 A41 41 0 0 1 91 53 Z" fill="url(#fuelFace)"/>
    <path d="${arcPath(50, 52, 37, -180, -150)}" stroke="#e5322d" stroke-width="5" fill="none"/>
    ${ticks.join('')}
    <text x="13" y="49" class="fuel-e">E</text><text x="81" y="49" class="fuel-f">F</text>
    <g class="fuel-needle"><path d="M50 52 L50 18" stroke="#c4161c" stroke-width="2.8" stroke-linecap="round"/></g>
    <circle cx="50" cy="52" r="5" fill="#222"/>
  </svg>`;
}

export class Hud {
  constructor(app) {
    this.app = app;
    const state = app.state;
    this.root = el('div', { class: 'hud' });

    // --- top left ---
    this.speedo = el('div', { class: 'speedo', html: speedoSVG(), title: 'XP' });
    this.odo = el('div', { class: 'odometer' });
    this.coins = el('span', { class: 'pill-value' }, '0');
    this.cash = el('span', { class: 'pill-value' }, '0');
    const coinPill = el('div', { class: 'pill pill-coins' }, el('span', { class: 'pill-icon', html: icon('coin') }), this.coins);
    const cashPill = el('div', { class: 'pill pill-cash' }, el('span', { class: 'pill-icon', html: icon('cash') }), this.cash);
    this.raceBtn = el('button', { class: 'pink-btn', title: t('race'), onclick: () => app.openRaceMenu() }, el('span', { html: icon('flag') }), el('small', {}, t('race')));
    this.goalsBtn = el('button', { class: 'pink-btn goals', title: t('goals'), onclick: () => app.openGoals() }, el('span', { html: icon('trophy') }), el('small', {}, t('missions')));
    this.goalsBadge = el('i', { class: 'badge hidden' }, '!');
    this.goalsBtn.appendChild(this.goalsBadge);
    const tl = el('div', { class: 'hud-tl' },
      el('div', { class: 'gauge-stack' }, this.speedo, this.odo),
      el('div', { class: 'money' }, coinPill, cashPill, el('div', { class: 'pink-row' }, this.raceBtn, this.goalsBtn)));

    // --- top centre ---
    this.soundBtn = el('button', { class: 'mini-btn', title: t('sound'), onclick: () => app.toggleSound() });
    const tc = el('div', { class: 'hud-tc' },
      el('button', { class: 'photo-btn', title: t('photo'), onclick: () => app.takePhoto() }, el('span', { html: icon('camera') }), el('small', {}, t('photo'))),
      el('div', { class: 'mini-grid' },
        this.soundBtn,
        el('button', { class: 'mini-btn', title: 'Fullscreen', onclick: () => app.toggleFullscreen(), html: icon('full') }),
        el('button', { class: 'mini-btn', title: 'Zoom in', onclick: () => app.zoom(0.85), html: icon('plus') }),
        el('button', { class: 'mini-btn', title: 'Zoom out', onclick: () => app.zoom(1.18), html: icon('minus') })));

    // --- top right ---
    this.fuel = el('div', { class: 'fuel', html: fuelSVG() });
    this.fuelNum = el('div', { class: 'fuel-num' }, '10');
    this.fuelTimer = el('div', { class: 'fuel-timer' });
    this.fuel.appendChild(this.fuelNum);
    const tr = el('div', { class: 'hud-tr' }, this.fuel, this.fuelTimer,
      el('div', { class: 'tr-buttons' },
        el('button', { class: 'mini-btn', title: t('friends'), onclick: () => app.openFriends(), html: icon('users') }),
        el('button', { class: 'mini-btn', title: t('settings'), onclick: () => app.openSettings(), html: icon('gear') })));

    // --- bottom ---
    this.mapBtn = el('button', { class: 'map-btn', title: t('town'), onclick: () => app.goTown() }, el('span', { html: icon('map') }), el('small', {}, t('town')));
    this.garageLabel = el('div', { class: 'garage-label' }, el('span', { html: icon('car') }), el('b', {}, t('myGarage')));
    const bl = el('div', { class: 'hud-bl' }, this.mapBtn, this.garageLabel);
    this.luxValue = el('b', { class: 'lux-value' }, '0');
    const bc = el('div', { class: 'hud-bc' },
      el('button', { class: 'big-btn btn-edit', onclick: () => app.openEditor() }, el('span', { class: 'big-ico', html: icon('wrench') }), el('small', {}, t('editGarage'))),
      el('button', { class: 'big-btn btn-buy', onclick: () => app.openDealer() }, el('span', { class: 'big-ico', html: icon('steering') }), el('small', {}, t('buyCars'))),
      el('button', { class: 'big-btn btn-lux', onclick: () => app.openLuxury() }, el('span', { class: 'big-ico', html: icon('star') }), el('small', {}, t('luxuryPoints')), this.luxValue));

    this.root.append(tl, tc, tr, bl, bc);
    app.uiRoot.appendChild(this.root);

    state.on('money', () => this.refreshMoney());
    state.on('xp', () => this.refreshXp());
    state.on('fuel', () => this.refreshFuel());
    state.on('cars', () => this.refreshLux());
    state.on('goals', () => this.refreshGoals());
    this.refreshAll();
    setInterval(() => {
      state.tickFuel();
      this.refreshFuelTimer();
    }, 500);
  }

  refreshAll() {
    this.refreshMoney();
    this.refreshXp();
    this.refreshFuel();
    this.refreshLux();
    this.refreshSound();
    this.refreshGoals();
  }

  refreshMoney() {
    const d = this.app.state.data;
    this.coins.textContent = fmt(d.coins);
    this.cash.textContent = fmt(d.cash);
  }

  pulseCoins() {
    this.coins.parentElement.classList.remove('pulse');
    void this.coins.offsetWidth;
    this.coins.parentElement.classList.add('pulse');
  }

  refreshXp() {
    const st = this.app.state;
    const p = st.levelProgress();
    this.speedo.querySelector('.spd-arc').setAttribute('stroke-dasharray', `${(p * 100).toFixed(1)} 100`);
    this.speedo.querySelector('.spd-needle').style.transform = `rotate(${-135 + p * 270}deg)`;
    this.speedo.querySelector('.spd-level').textContent = st.level;
    this.speedo.querySelector('.spd-label').textContent = t('level');
    const digits = String(Math.min(9999999, st.data.xp)).padStart(7, '0');
    this.odo.innerHTML = digits.split('').map((c) => `<span>${c}</span>`).join('');
  }

  refreshFuel() {
    const st = this.app.state;
    const f = st.data.fuel;
    const p = Math.min(1, f / st.fuelMax);
    this.fuel.querySelector('.fuel-needle').style.transform = `rotate(${-90 + p * 180}deg)`;
    this.fuelNum.textContent = f;
    this.refreshFuelTimer();
  }

  refreshFuelTimer() {
    const st = this.app.state;
    const left = st.fuelSecondsLeft();
    this.fuelTimer.innerHTML = left > 0 ? `${t('moreIn')}: <b>${fmtTime(left)}</b>` : `<b>${t('full')}</b>`;
  }

  flashFuel() {
    this.fuel.classList.remove('flash');
    void this.fuel.offsetWidth;
    this.fuel.classList.add('flash');
  }

  refreshLux() {
    this.luxValue.textContent = this.app.state.luxury();
  }

  refreshSound() {
    this.soundBtn.innerHTML = icon(this.app.state.data.settings.sfx ? 'sound' : 'mute');
  }

  refreshGoals() {
    const st = this.app.state;
    st.ensureGoals();
    const ready = st.data.goals.list.some((g) => !g.claimed && g.progress >= (this.app.goalDef(g.id)?.n ?? 1));
    this.goalsBadge.classList.toggle('hidden', !ready);
  }

  setMode(mode) {
    this.root.dataset.mode = mode;
  }

  setGarageLabel(text) {
    this.garageLabel.querySelector('b').textContent = text;
  }
}
