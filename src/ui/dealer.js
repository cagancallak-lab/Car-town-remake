// Car dealer ("Compre Carros"): browse every car on a studio turntable, pick
// a colour and buy it.

import { el, fmt } from '../core/util.js';
import { t } from '../core/i18n.js';
import { icon } from './icons.js';
import { CAR_CATALOG, PAINT_COLORS } from '../game/catalog.js';
import { MODELS } from '../cars/models.js';
import { defaultConfig } from '../cars/carFactory.js';
import { estimateET, carPerformance } from '../game/drag.js';
import { carThumb } from './thumbs.js';
import { swatches } from './dom.js';
import { audio } from '../core/audio.js';

export function statBars(cfg) {
  const p = carPerformance(cfg);
  const { et, trap } = estimateET(cfg);
  const bar = (label, v, txt) => el('div', { class: 'stat' },
    el('span', { class: 'stat-label' }, label),
    el('div', { class: 'stat-bar' }, el('i', { style: { width: `${Math.round(Math.max(0.04, Math.min(1, v)) * 100)}%` } })),
    el('b', {}, txt));
  return el('div', { class: 'stats' },
    bar(t('power'), p.hp / 900, `${Math.round(p.hp)} hp`),
    bar(t('weight'), 1 - (p.kg - 700) / 2000, `${Math.round(p.kg)} kg`),
    bar(t('grip'), (p.grip - 0.7) / 0.7, p.grip.toFixed(2)),
    bar(t('topSpeed'), p.vmax / 100, `${Math.round(p.vmax * 3.6)} km/h`),
    bar('1/8 mile', (11 - et) / 6, `${et.toFixed(2)} s`),
    el('div', { class: 'stat-note' }, `${t('trap')}: ${Math.round(trap)} km/h`));
}

export class DealerUI {
  constructor(app) {
    this.app = app;
  }

  open() {
    const app = this.app;
    this.tab = 'featured';
    this.selected = CAR_CATALOG[0].id;
    this.paint = null;
    const panel = el('div', { class: 'side-panel dealer' });
    const top = el('div', { class: 'mode-top' },
      el('button', { class: 'btn btn-back', onclick: () => this.close() }, el('span', { html: icon('back') }), t('back')),
      el('h1', { class: 'mode-title' }, el('span', { html: icon('steering') }), t('buyCars')));
    this.list = el('div', { class: 'car-list' });
    this.details = el('div', { class: 'car-details' });
    this.tabs = el('div', { class: 'tabs' });
    panel.append(this.tabs, this.list, this.details);
    this.root = el('div', { class: 'mode-layer' }, top, panel);
    app.uiRoot.appendChild(this.root);
    app.showroom.offsetX = 0.17;
    app.setMode('dealer');
    this.renderTabs();
    this.renderList();
    this.select(this.selected);
  }

  close() {
    audio.click();
    this.root?.remove();
    this.root = null;
    this.app.goGarage();
  }

  renderTabs() {
    this.tabs.innerHTML = '';
    for (const [id, label] of [['featured', t('newArrivals')], ['all', t('allCars')]]) {
      this.tabs.appendChild(el('button', { class: `tab ${this.tab === id ? 'on' : ''}`, onclick: () => { this.tab = id; audio.click(); this.renderTabs(); this.renderList(); } }, label));
    }
  }

  renderList() {
    const st = this.app.state;
    this.list.innerHTML = '';
    const cars = CAR_CATALOG.filter((c) => (this.tab === 'featured' ? c.featured : true));
    for (const c of cars) {
      const locked = st.level < c.level;
      const owned = st.cars.filter((x) => x.cfg.model === c.id).length;
      const img = el('img', { class: 'thumb', alt: '' });
      carThumb(defaultConfig(c.id), img);
      const card = el('button', { class: `car-card ${this.selected === c.id ? 'on' : ''} ${locked ? 'locked' : ''}`, onclick: () => { audio.click(); this.select(c.id); } },
        c.featured ? el('i', { class: 'ribbon' }, 'NEW') : null,
        img,
        el('div', { class: 'card-name' }, el('b', {}, c.name), el('small', {}, c.brand)),
        el('div', { class: 'card-price' }, locked ? el('span', { class: 'lock' }, t('locked', { n: c.level })) : el('span', { html: `${icon('coin')} ${fmt(c.price)}` })),
        owned ? el('i', { class: 'owned-badge' }, `x${owned}`) : null);
      card.dataset.id = c.id;
      this.list.appendChild(card);
    }
  }

  select(id) {
    this.selected = id;
    this.paint = null;
    for (const card of this.list.querySelectorAll('.car-card')) card.classList.toggle('on', card.dataset.id === id);
    this.preview();
    this.renderDetails();
  }

  cfg() {
    const cfg = defaultConfig(this.selected);
    if (this.paint) cfg.paint = this.paint;
    return cfg;
  }

  preview() {
    const spec = MODELS[this.selected];
    this.app.showroom.setCar(this.cfg());
    this.app.showroom.setBadge(spec.featured ? spec.name.toUpperCase() : spec.class.toUpperCase());
  }

  renderDetails() {
    const st = this.app.state;
    const c = CAR_CATALOG.find((x) => x.id === this.selected);
    const spec = MODELS[c.id];
    const locked = st.level < c.level;
    const afford = st.coins >= c.price;
    this.details.innerHTML = '';
    this.details.append(
      el('div', { class: 'details-head' }, el('h2', {}, c.name), el('span', { class: 'brand' }, `${c.brand} · ${c.class}${spec.electric ? ' · EV' : ''}`)),
      el('p', { class: 'blurb' }, spec.blurb || ''),
      statBars(this.cfg()),
      el('div', { class: 'opt-label' }, t('paint')),
      swatches(PAINT_COLORS.slice(0, 20), this.paint || spec.colors?.paint, (col) => { this.paint = col; this.preview(); }),
      el('div', { class: 'buy-row' },
        el('div', { class: 'price-tag', html: `${icon('coin')} <b>${fmt(c.price)}</b>` }),
        el('button', {
          class: `btn btn-green btn-big ${locked || !afford ? 'disabled' : ''}`,
          onclick: () => this.buy(),
        }, locked ? t('locked', { n: c.level }) : t('buy'))),
    );
  }

  buy() {
    const app = this.app;
    const st = app.state;
    const c = CAR_CATALOG.find((x) => x.id === this.selected);
    if (st.level < c.level) {
      audio.error();
      app.toast(t('locked', { n: c.level }), 'warn');
      return;
    }
    if (!st.canAfford(c.price)) {
      audio.error();
      app.toast(t('notEnoughCoins'), 'warn');
      return;
    }
    const cfg = this.cfg();
    const spot = app.garage.findCarSpot();
    if (!spot) {
      audio.error();
      app.toast(t('garageFull'), 'warn');
      return;
    }
    st.spend(c.price);
    const car = st.addCar(cfg);
    car.placed = spot;
    st.addXp(Math.round(10 + c.price / 1000));
    app.garage.refreshCar(car.id);
    audio.cash();
    app.banner(t('purchased'), c.name, 'green');
    this.renderList();
    this.renderDetails();
  }
}
