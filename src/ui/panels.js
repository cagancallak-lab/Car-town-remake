// Smaller dialogs: onboarding, friends & friend codes, daily goals, luxury
// points, settings.

import { el, fmt } from '../core/util.js';
import { t, LANGS, getLang } from '../core/i18n.js';
import { icon } from './icons.js';
import { modal, segmented, confirmDialog } from './dom.js';
import { STARTER_CARS, NPC_FRIENDS, GOAL_DEFS, ITEMS, FLOORS, WALLS } from '../game/catalog.js';
import { MODELS } from '../cars/models.js';
import { defaultConfig } from '../cars/carFactory.js';
import { carThumb } from './thumbs.js';
import { portrait } from '../world/characters.js';
import { makeFriendCode, parseFriendCode } from '../game/friends.js';
import { ratingOf } from '../game/drag.js';
import { audio } from '../core/audio.js';

const SKINS = ['#f6d7bd', '#f1c7a3', '#e7b48f', '#c68a5e', '#8d5a3b', '#5a3825'];
const HAIRS = ['#1a1010', '#3b2414', '#6b4a2b', '#a8322a', '#e9b949', '#d8d8d8', '#2f6fd6', '#ff6fb3'];
const SHIRTS = ['#d9262b', '#2f6fd6', '#3aa04a', '#f2b705', '#7a3fd0', '#ff6fb3', '#1b1c20', '#f3f3f1'];

function avatarEditor(av, onChange) {
  const wrap = el('div', { class: 'avatar-editor' });
  const img = el('img', { class: 'avatar-preview', alt: '' });
  const refresh = () => { img.src = portrait(av, 96); onChange?.(av); };
  const row = (label, colors, key) => el('div', { class: 'av-row' }, el('span', {}, label),
    el('div', { class: 'swatches small' }, ...colors.map((c) => el('button', { class: 'swatch', style: { background: c }, onclick: () => { av[key] = c; refresh(); } }))));
  wrap.append(img, el('div', { class: 'av-opts' },
    row('Skin', SKINS, 'skin'),
    row('Hair', HAIRS, 'hair'),
    row('Shirt', SHIRTS, 'shirt'),
    el('div', { class: 'av-row' }, el('span', {}, 'Style'), segmented([['short', 'Short'], ['long', 'Long'], ['bun', 'Bun'], ['cap', 'Cap']], av.style || 'short', (v) => { av.style = v; refresh(); }))));
  refresh();
  return wrap;
}

export function openOnboarding(app, onDone) {
  const st = app.state;
  const av = { ...st.data.player.avatar };
  let choice = STARTER_CARS[2];
  const name = el('input', { class: 'name-input', maxlength: 14, value: '', placeholder: t('yourName') });
  const cards = el('div', { class: 'starter-cards' });
  const renderCards = () => {
    cards.innerHTML = '';
    for (const id of STARTER_CARS) {
      const img = el('img', { alt: '' });
      carThumb(defaultConfig(id), img);
      cards.appendChild(el('button', { class: `starter ${choice === id ? 'on' : ''}`, onclick: () => { audio.click(); choice = id; renderCards(); } },
        MODELS[id].featured ? el('i', { class: 'ribbon' }, 'NEW') : null,
        img, el('b', {}, MODELS[id].name), el('small', {}, `${MODELS[id].brand} · PR ${ratingOf(defaultConfig(id))}`)));
    }
  };
  renderCards();
  const m = modal({
    title: t('welcome'),
    className: 'onboarding',
    wide: true,
    closable: false,
    content: [
      el('p', { class: 'intro' }, 'Run your own garage: service customers, earn coins, buy and customize cars, and drag race your friends!'),
      el('div', { class: 'onb-grid' },
        el('div', {}, el('div', { class: 'opt-label' }, t('yourName')), name, avatarEditor(av)),
        el('div', {}, el('div', { class: 'opt-label' }, t('chooseFirst')), cards)),
      el('div', { class: 'row-buttons' }, el('button', { class: 'btn btn-green btn-big', onclick: () => {
        audio.ensure();
        audio.levelUp();
        st.data.player.avatar = av;
        st.startNewGame(name.value.trim() || 'Player', choice);
        m.close();
        onDone();
      } }, t('start'))),
    ],
  });
  setTimeout(() => name.focus(), 50);
}

export function openFriends(app) {
  const st = app.state;
  const code = makeFriendCode(st);
  const list = el('div', { class: 'friend-list' });
  const render = () => {
    list.innerHTML = '';
    const all = [...NPC_FRIENDS, ...(st.data.friends || [])];
    for (const f of all) {
      const cfg = { ...defaultConfig(f.car.model), ...f.car };
      const img = el('img', { alt: '' });
      carThumb(cfg, img);
      list.appendChild(el('div', { class: 'friend-row' },
        el('img', { class: 'portrait', src: portrait(f.avatar, 56), alt: '' }),
        el('div', { class: 'opp-info' }, el('b', {}, f.name), el('small', {}, `${t('level')} ${f.level} · ${MODELS[cfg.model].name}`), f.imported ? el('i', { class: 'tag' }, 'friend code') : null),
        img,
        el('button', { class: 'btn btn-green', onclick: () => { m.close(); app.openRaceMenu({ friend: f, tab: 'friends' }); } }, t('challenge')),
        f.imported ? el('button', { class: 'btn btn-gray icon-only', title: 'Remove', html: icon('trash'), onclick: () => { st.data.friends = st.data.friends.filter((x) => x.id !== f.id); st.save(); app.garage.buildFriends(); render(); } }) : null));
    }
  };
  render();
  const input = el('textarea', { class: 'code-area', placeholder: t('paste'), rows: 2 });
  const myCode = el('textarea', { class: 'code-area', readonly: true, rows: 2 }, code);
  const m = modal({
    title: t('friends'),
    wide: true,
    className: 'friends-modal',
    content: [
      list,
      el('div', { class: 'code-box' },
        el('div', { class: 'opt-label' }, t('myCode')),
        myCode,
        el('button', { class: 'btn btn-blue', onclick: async () => {
          try { await navigator.clipboard.writeText(code); } catch (e) { myCode.select(); document.execCommand?.('copy'); }
          app.toast(t('copied'));
        } }, el('span', { html: icon('copy') }), t('copy'))),
      el('div', { class: 'code-box' },
        el('div', { class: 'opt-label' }, t('addFriend')),
        input,
        el('button', { class: 'btn btn-green', onclick: () => {
          const f = parseFriendCode(input.value);
          if (!f) { audio.error(); app.toast(t('invalidCode'), 'warn'); return; }
          st.data.friends = (st.data.friends || []).filter((x) => x.id !== f.id && x.name !== f.name);
          st.data.friends.push(f);
          st.save();
          app.garage.buildFriends();
          audio.cash();
          app.toast(t('friendAdded', { name: f.name }));
          input.value = '';
          render();
        } }, t('addFriend'))),
    ],
  });
}

export function openGoals(app) {
  const st = app.state;
  st.ensureGoals();
  const list = el('div', { class: 'goal-list' });
  const render = () => {
    list.innerHTML = '';
    for (const g of st.data.goals.list) {
      const def = GOAL_DEFS.find((d) => d.id === g.id);
      const done = g.progress >= def.n;
      list.appendChild(el('div', { class: `goal ${done ? 'done' : ''}` },
        el('div', { class: 'goal-text' }, el('b', {}, def.text.replace('{n}', fmt(def.n))),
          el('div', { class: 'goal-bar' }, el('i', { style: { width: `${(g.progress / def.n) * 100}%` } })),
          el('small', {}, `${fmt(g.progress)} / ${fmt(def.n)}`)),
        el('div', { class: 'goal-reward', html: `${icon('coin')} ${def.coins} · ${def.xp} XP` }),
        el('button', {
          class: `btn ${g.claimed ? 'btn-gray disabled' : done ? 'btn-green' : 'btn-gray disabled'}`,
          onclick: () => {
            if (!done || g.claimed) return;
            g.claimed = true;
            st.addCoins(def.coins);
            st.addXp(def.xp);
            audio.cash();
            st.emit('goals');
            render();
          },
        }, g.claimed ? t('claimed') : t('claim'))));
    }
  };
  render();
  const s = st.data.stats;
  modal({
    title: t('goals'),
    className: 'goals-modal',
    content: [list, el('div', { class: 'stat-strip' },
      el('span', {}, `${t('served')}: `, el('b', {}, fmt(s.served))),
      el('span', {}, `${t('racesWon')}: `, el('b', {}, `${s.wins}/${s.races}`)),
      el('span', {}, 'Earned: ', el('b', {}, fmt(s.earned))))],
  });
}

export function openLuxury(app) {
  const st = app.state;
  const tier = st.luxuryTier();
  const g = st.garage;
  const counts = {};
  for (const it of g.items) counts[it.type] = (counts[it.type] || 0) + 1;
  const rows = Object.entries(counts).sort((a, b) => (ITEMS[b[0]].lux * b[1]) - (ITEMS[a[0]].lux * a[1])).slice(0, 8)
    .map(([type, n]) => el('tr', {}, el('td', {}, ITEMS[type].name), el('td', {}, `x${n}`), el('td', {}, `+${ITEMS[type].lux * n}★`)));
  rows.push(el('tr', {}, el('td', {}, `Floor: ${FLOORS[g.floor].name}`), el('td', {}, ''), el('td', {}, `+${FLOORS[g.floor].lux}★`)));
  rows.push(el('tr', {}, el('td', {}, `Walls: ${WALLS[g.wall].name}`), el('td', {}, ''), el('td', {}, `+${WALLS[g.wall].lux}★`)));
  rows.push(el('tr', {}, el('td', {}, 'Cars in garage'), el('td', {}, `x${st.cars.length}`), el('td', {}, `+${st.cars.length * 2}★`)));
  modal({
    title: t('luxuryPoints'),
    className: 'lux-modal',
    content: [
      el('div', { class: 'lux-big', html: `${icon('star')} <b>${tier.lux}</b>` }),
      el('div', { class: 'lux-tier' }, `${t('tier')} ${tier.tier}`, tier.next ? el('small', {}, ` · next tier at ${tier.next}★`) : null),
      el('p', {}, t('luxuryInfo')),
      el('div', { class: 'lux-effects' },
        el('div', {}, el('small', {}, t('tips')), el('b', {}, `+${Math.round(tier.tipBonus * 100)}%`)),
        el('div', {}, el('small', {}, t('customerRate')), el('b', {}, `+${Math.round(tier.rateBonus * 100)}%`))),
      el('table', { class: 'lux-table' }, ...rows),
      el('button', { class: 'btn btn-green', onclick: () => { document.querySelector('.modal-overlay:last-child .close-btn')?.click(); app.openEditor(); } }, el('span', { html: icon('wrench') }), t('editGarage')),
    ],
  });
}

export function openSettings(app) {
  const st = app.state;
  const s = st.data.settings;
  const av = { ...st.data.player.avatar };
  const name = el('input', { class: 'name-input', maxlength: 14, value: st.data.player.name });
  const serverInput = el('input', { class: 'name-input', placeholder: 'ws://host:3000/ws (optional)', value: (() => { try { return localStorage.getItem('cartown-server') || ''; } catch (e) { return ''; } })() });
  const m = modal({
    title: t('settings'),
    className: 'settings-modal',
    content: [
      el('div', { class: 'set-row' }, el('span', {}, t('language')), segmented(LANGS, getLang(), (v) => app.setLanguage(v))),
      el('div', { class: 'set-row' }, el('span', {}, t('sound')), segmented([[true, 'On'], [false, 'Off']], s.sfx, (v) => app.setSound(v))),
      el('div', { class: 'set-row' }, el('span', {}, t('music')), segmented([[true, 'On'], [false, 'Off']], s.music, (v) => app.setMusic(v))),
      el('div', { class: 'set-row' }, el('span', {}, t('quality')), segmented([['high', 'High'], ['low', 'Fast']], s.quality, (v) => app.setQuality(v))),
      el('div', { class: 'set-row' }, el('span', {}, t('yourName')), name),
      avatarEditor(av),
      el('div', { class: 'set-row' }, el('span', {}, 'Online server'), serverInput),
      el('div', { class: 'row-buttons' },
        el('button', { class: 'btn btn-red', onclick: async () => {
          if (await confirmDialog(t('resetConfirm'), { ok: t('resetSave') })) {
            st.reset();
            location.reload();
          }
        } }, t('resetSave')),
        el('button', { class: 'btn btn-green', onclick: () => {
          st.data.player.name = name.value.trim().slice(0, 14) || st.data.player.name;
          st.data.player.avatar = av;
          try {
            if (serverInput.value.trim()) localStorage.setItem('cartown-server', serverInput.value.trim());
            else localStorage.removeItem('cartown-server');
          } catch (e) { /* ignore */ }
          st.save();
          app.garage.buildLot();
          app.garage.buildPeople();
          m.close();
        } }, t('done'))),
    ],
  });
}
