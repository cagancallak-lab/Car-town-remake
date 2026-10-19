// Paint & Tune shop: live-preview every customisation on the turntable, pay
// only for what changed.

import { el, fmt } from '../core/util.js';
import { t } from '../core/i18n.js';
import { icon } from './icons.js';
import { PAINT_COLORS, RIM_COLORS, NEON_COLORS, CUSTOM_PRICES, UPGRADES, UPGRADE_MAX, upgradeCost } from '../game/catalog.js';
import { FINISHES, LIVERIES, SPOILERS } from '../cars/carFactory.js';
import { RIM_STYLES } from '../cars/wheels.js';
import { MODELS } from '../cars/models.js';
import { swatches, segmented } from './dom.js';
import { statBars } from './dealer.js';
import { audio } from '../core/audio.js';

const LIVERY_LABEL = { none: 'None', stripes: 'Racing stripes', side: 'Side stripe', flames: 'Flames', number: 'Race number', checker: 'Checker', bolt: 'Lightning', tribal: 'Tribal', police: 'Police' };
const RIM_LABEL = { spoke5: '5-Spoke', twin5: 'Twin 5', star: 'Star', multi: 'Multi', aero: 'Aero', mesh: 'Mesh', turbine: 'Turbine', steel: 'Steelie', classic: 'Rally', dish: 'Dish' };
const SPOILER_LABEL = { default: 'Stock', none: 'None', lip: 'Lip', duck: 'Ducktail', roof: 'Roof', wing: 'GT Wing' };

export class CustomizeUI {
  constructor(app) {
    this.app = app;
  }

  open(carId) {
    const app = this.app;
    const car = app.state.getCar(carId);
    if (!car) return;
    this.carId = carId;
    this.orig = JSON.parse(JSON.stringify(car.cfg));
    this.draft = JSON.parse(JSON.stringify(car.cfg));
    this.draft.upgrades = { engine: 0, turbo: 0, gearbox: 0, tires: 0, weight: 0, nitro: 0, ...this.draft.upgrades };
    this.orig.upgrades = { ...this.draft.upgrades };
    this.tab = 'paint';
    const panel = el('div', { class: 'side-panel customize' });
    const top = el('div', { class: 'mode-top' },
      el('button', { class: 'btn btn-back', onclick: () => this.close() }, el('span', { html: icon('back') }), t('back')),
      el('h1', { class: 'mode-title' }, el('span', { html: icon('paint') }), t('customShop')));
    this.tabs = el('div', { class: 'tabs' });
    this.body = el('div', { class: 'cust-body' });
    this.footer = el('div', { class: 'cust-footer' });
    panel.append(this.tabs, this.body, this.footer);
    this.root = el('div', { class: 'mode-layer' }, top, panel);
    app.uiRoot.appendChild(this.root);
    app.showroom.offsetX = 0.17;
    app.showroom.setBadge(MODELS[car.cfg.model].name.toUpperCase());
    app.setMode('customize');
    this.renderTabs();
    this.renderBody();
    this.preview(true);
  }

  close() {
    audio.click();
    clearTimeout(this.timer);
    this.root?.remove();
    this.root = null;
    this.app.goGarage();
  }

  renderTabs() {
    this.tabs.innerHTML = '';
    const tabs = [['paint', t('paint')], ['wheels', t('wheels')], ['style', t('livery')], ['perf', t('performance')]];
    for (const [id, label] of tabs) {
      this.tabs.appendChild(el('button', { class: `tab ${this.tab === id ? 'on' : ''}`, onclick: () => { audio.click(); this.tab = id; this.renderTabs(); this.renderBody(); } }, label));
    }
  }

  set(key, value) {
    this.draft[key] = value;
    this.preview();
  }

  preview(now = false) {
    clearTimeout(this.timer);
    const run = () => {
      this.app.showroom.setCar(this.draft);
      this.renderFooter();
    };
    if (now) run();
    else this.timer = setTimeout(run, 90);
  }

  cost() {
    let coins = 0;
    const d = this.draft;
    const o = this.orig;
    for (const k of ['paint', 'finish', 'roof', 'rim', 'rimColor', 'caliper', 'livery', 'liveryColor', 'spoiler', 'tint', 'neon', 'lower']) {
      if (JSON.stringify(d[k] ?? null) !== JSON.stringify(o[k] ?? null)) coins += CUSTOM_PRICES[k] || 0;
    }
    if (d.livery === 'number' && d.number !== o.number) coins += 50;
    for (const u of UPGRADES) {
      for (let l = o.upgrades[u.key] || 0; l < (d.upgrades[u.key] || 0); l++) coins += upgradeCost(d.model, l);
    }
    return coins;
  }

  renderFooter() {
    const c = this.cost();
    this.footer.innerHTML = '';
    this.footer.append(
      el('div', { class: 'price-tag', html: `${t('cost')}: ${icon('coin')} <b>${fmt(c)}</b>` }),
      el('button', { class: 'btn btn-gray', onclick: () => { audio.click(); this.draft = JSON.parse(JSON.stringify(this.orig)); this.renderBody(); this.preview(true); } }, 'Reset'),
      el('button', { class: `btn btn-green btn-big ${c > this.app.state.coins ? 'disabled' : ''}`, onclick: () => this.apply() }, el('span', { html: icon('check') }), t('apply')),
    );
  }

  apply() {
    const app = this.app;
    const c = this.cost();
    if (c === 0) {
      this.close();
      return;
    }
    if (!app.state.spend(c)) {
      audio.error();
      app.toast(t('notEnoughCoins'), 'warn');
      return;
    }
    app.state.updateCar(this.carId, JSON.parse(JSON.stringify(this.draft)));
    app.state.addXp(Math.round(5 + c / 150));
    app.state.progressGoal('custom');
    app.garage.refreshCar(this.carId);
    audio.cash();
    app.banner(t('purchased'), MODELS[this.draft.model].name, 'green');
    this.orig = JSON.parse(JSON.stringify(this.draft));
    this.renderFooter();
    this.renderBody();
  }

  section(label, ...content) {
    return el('div', { class: 'opt' }, el('div', { class: 'opt-label' }, label), ...content);
  }

  renderBody() {
    const d = this.draft;
    const b = this.body;
    b.innerHTML = '';
    if (this.tab === 'paint') {
      b.append(
        this.section(t('paint'), swatches(PAINT_COLORS, d.paint, (c) => this.set('paint', c))),
        this.section(t('finish'), segmented(FINISHES.map((f) => [f, f[0].toUpperCase() + f.slice(1)]), d.finish, (v) => this.set('finish', v))),
        this.section(t('roof'), swatches(PAINT_COLORS, d.roof, (c) => this.set('roof', c), { allowNone: true, noneLabel: t('sameAsBody') })),
      );
    } else if (this.tab === 'wheels') {
      const grid = el('div', { class: 'rim-grid' });
      for (const r of RIM_STYLES) {
        grid.appendChild(el('button', { class: `rim-btn ${d.rim === r ? 'on' : ''}`, onclick: () => { audio.click(); this.set('rim', r); this.renderBody(); } },
          el('span', { class: 'rim-ico', html: rimIcon(r) }), el('small', {}, RIM_LABEL[r])));
      }
      b.append(
        this.section(t('wheels'), grid),
        this.section(t('rimColor'), swatches(RIM_COLORS, d.rimColor, (c) => this.set('rimColor', c))),
        this.section(t('caliper'), swatches(['#d61b1b', '#f2c21b', '#2f8be0', '#3aa04a', '#ff6fb3', '#1b1c20'], d.caliper, (c) => this.set('caliper', c), { allowNone: true })),
      );
    } else if (this.tab === 'style') {
      const liv = el('div', { class: 'chip-grid' });
      for (const l of LIVERIES) {
        if (l === 'police' && d.model !== 'police') continue;
        liv.appendChild(el('button', { class: `chip ${d.livery === l ? 'on' : ''}`, onclick: () => { audio.click(); this.set('livery', l); this.renderBody(); } }, LIVERY_LABEL[l]));
      }
      const num = el('input', { type: 'number', min: 1, max: 99, value: d.number ?? 7, class: 'num-input', oninput: (e) => this.set('number', Math.max(1, Math.min(99, Number(e.target.value) || 1))) });
      b.append(
        this.section(t('livery'), liv),
        d.livery === 'number' ? this.section('#', num) : null,
        this.section(t('liveryColor'), swatches(PAINT_COLORS, d.liveryColor, (c) => this.set('liveryColor', c))),
        this.section(t('spoiler'), segmented(SPOILERS.map((s) => [s, SPOILER_LABEL[s]]), d.spoiler || 'default', (v) => this.set('spoiler', v))),
        this.section(t('tint'), el('input', { type: 'range', min: 0, max: 1, step: 0.1, value: d.tint ?? 0.5, oninput: (e) => this.set('tint', Number(e.target.value)) })),
        this.section(t('stance'), el('input', { type: 'range', min: 0, max: 3, step: 1, value: d.lower ?? 0, oninput: (e) => this.set('lower', Number(e.target.value)) })),
        this.section(t('neon'), swatches(NEON_COLORS, d.neon, (c) => this.set('neon', c), { allowNone: true })),
      );
    } else if (this.tab === 'perf') {
      const list = el('div', { class: 'upgrades' });
      for (const u of UPGRADES) {
        const lvl = d.upgrades[u.key] || 0;
        const pips = el('div', { class: 'pips' }, ...Array.from({ length: UPGRADE_MAX }, (_, i) => el('i', { class: i < (this.orig.upgrades[u.key] || 0) ? 'on' : i < lvl ? 'new' : '' })));
        const maxed = lvl >= UPGRADE_MAX;
        list.appendChild(el('div', { class: 'upgrade' },
          el('div', { class: 'up-name' }, el('b', {}, t(u.label)), el('small', {}, u.effect)),
          pips,
          el('button', {
            class: `btn btn-blue ${maxed ? 'disabled' : ''}`,
            onclick: () => {
              if (maxed) return;
              audio.click();
              d.upgrades = { ...d.upgrades, [u.key]: lvl + 1 };
              this.renderBody();
              this.preview();
            },
            html: maxed ? t('maxed') : `${icon('coin')} ${fmt(upgradeCost(d.model, lvl))}`,
          })));
      }
      b.append(list, statBars(d));
    }
  }
}

function rimIcon(style) {
  // Quick 2D icon approximating each rim design
  const spokes = { spoke5: 5, twin5: 10, star: 5, multi: 10, aero: 4, mesh: 12, turbine: 12, steel: 6, classic: 5, dish: 6 }[style];
  let s = '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#1b1b1d"/><circle cx="20" cy="20" r="13" fill="#c9ccd1"/>';
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2 + (style === 'turbine' || style === 'star' ? 0.3 : 0);
    if (style === 'steel') {
      s += `<circle cx="${20 + Math.cos(a) * 7.5}" cy="${20 + Math.sin(a) * 7.5}" r="2" fill="#1b1b1d"/>`;
    } else if (style === 'aero') {
      s += `<path d="M${20 + Math.cos(a - 0.35) * 11} ${20 + Math.sin(a - 0.35) * 11} A11 11 0 0 1 ${20 + Math.cos(a + 0.35) * 11} ${20 + Math.sin(a + 0.35) * 11}" stroke="#1b1b1d" stroke-width="3" fill="none"/>`;
    } else {
      const a2 = a + (Math.PI * 2) / spokes / 2;
      s += `<path d="M20 20 L${20 + Math.cos(a2 - 0.22) * 11.5} ${20 + Math.sin(a2 - 0.22) * 11.5} L${20 + Math.cos(a2 + 0.22) * 11.5} ${20 + Math.sin(a2 + 0.22) * 11.5}Z" fill="#1b1b1d" opacity="${style === 'mesh' || style === 'multi' ? 0.8 : 1}"/>`;
    }
  }
  s += '<circle cx="20" cy="20" r="4" fill="#9aa0a8"/></svg>';
  return s;
}
