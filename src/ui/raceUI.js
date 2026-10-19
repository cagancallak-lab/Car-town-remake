// Drag racing: opponent selection (street racers, friends, local 2-player,
// online rooms), the race itself (countdown, rev, shift, nitro) and results.

import { el, fmt, pick } from '../core/util.js';
import { t } from '../core/i18n.js';
import { icon } from './icons.js';
import { modal, segmented } from './dom.js';
import { STREET_RACERS, NPC_FRIENDS } from '../game/catalog.js';
import { MODELS, MODEL_IDS } from '../cars/models.js';
import { defaultConfig } from '../cars/carFactory.js';
import { DragCar, RACE_DISTANCE, LAUNCH_ZONE, SHIFT_ZONE, ratingOf } from '../game/drag.js';
import { carThumb } from './thumbs.js';
import { portrait } from '../world/characters.js';
import { audio } from '../core/audio.js';
import { net } from '../game/net.js';
import { sanitizeCfg } from '../game/friends.js';

const STEP = 1 / 120;

function tachSVG(redline) {
  const a0 = -220;
  const a1 = 40;
  const ang = (f) => a0 + f * (a1 - a0);
  const arc = (f0, f1, r) => {
    const p = (a) => [100 + Math.cos((a * Math.PI) / 180) * r, 100 + Math.sin((a * Math.PI) / 180) * r];
    const [x0, y0] = p(ang(f0));
    const [x1, y1] = p(ang(f1));
    return `M${x0} ${y0} A${r} ${r} 0 ${ang(f1) - ang(f0) > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  const ticks = [];
  const n = Math.round(redline / 1000);
  for (let i = 0; i <= n; i++) {
    const f = (i * 1000) / redline;
    if (f > 1.001) break;
    const a = (ang(f) * Math.PI) / 180;
    ticks.push(`<line x1="${100 + Math.cos(a) * 72}" y1="${100 + Math.sin(a) * 72}" x2="${100 + Math.cos(a) * 84}" y2="${100 + Math.sin(a) * 84}" stroke="#fff" stroke-width="3"/>`);
    ticks.push(`<text x="${100 + Math.cos(a) * 60}" y="${104 + Math.sin(a) * 60}" class="tach-num">${i}</text>`);
  }
  return `<svg viewBox="0 0 200 170" class="tach-svg">
    <circle cx="100" cy="100" r="96" fill="#15171b" stroke="#6b717b" stroke-width="5"/>
    <path d="${arc(LAUNCH_ZONE[0], LAUNCH_ZONE[1], 84)}" class="tach-launch" stroke="#2fa8ff" stroke-width="10" fill="none"/>
    <path d="${arc(SHIFT_ZONE[0], SHIFT_ZONE[1], 84)}" class="tach-shift" stroke="#2bd94e" stroke-width="10" fill="none"/>
    <path d="${arc(SHIFT_ZONE[1], 1, 84)}" stroke="#e5322d" stroke-width="10" fill="none"/>
    ${ticks.join('')}
    <text x="100" y="152" class="tach-x">x1000 rpm</text>
    <g class="tach-needle" style="transform: rotate(${ang(0) + 90}deg)"><path d="M100 100 L100 22" stroke="#ff3b30" stroke-width="4" stroke-linecap="round"/></g>
    <circle cx="100" cy="100" r="9" fill="#d5d9df"/>
  </svg>`;
}

export class RaceUI {
  constructor(app) {
    this.app = app;
    this.session = null;
  }

  // ---------------------------------------------------------------------------------
  // Menu
  // ---------------------------------------------------------------------------------

  openMenu(preset = {}) {
    const app = this.app;
    const st = app.state;
    this.myCarId = preset.carId || st.activeCar?.id;
    this.tab = preset.tab || 'street';
    const carRow = el('div', { class: 'my-cars' });
    const renderCars = () => {
      carRow.innerHTML = '';
      for (const car of st.cars) {
        const img = el('img', { alt: '' });
        carThumb(car.cfg, img);
        carRow.appendChild(el('button', { class: `my-car ${car.id === this.myCarId ? 'on' : ''}`, onclick: () => { audio.click(); this.myCarId = car.id; st.setActiveCar(car.id); renderCars(); renderTab(); } },
          img, el('small', {}, MODELS[car.cfg.model].name), el('i', { class: 'rating' }, `PR ${ratingOf(car.cfg)}`)));
      }
    };
    const body = el('div', { class: 'race-tab' });
    const tabs = el('div', { class: 'tabs' });
    const renderTabs = () => {
      tabs.innerHTML = '';
      for (const [id, label] of [['street', t('streetRacers')], ['friends', t('yourFriends')], ['local', t('localVersus')], ['online', t('online')]]) {
        tabs.appendChild(el('button', { class: `tab ${this.tab === id ? 'on' : ''}`, onclick: () => { audio.click(); this.tab = id; renderTabs(); renderTab(); } }, label));
      }
    };
    const renderTab = () => {
      body.innerHTML = '';
      if (this.tab === 'street') body.appendChild(this.streetList());
      else if (this.tab === 'friends') body.appendChild(this.friendList());
      else if (this.tab === 'local') body.appendChild(this.localPanel());
      else body.appendChild(this.onlinePanel());
    };
    this.menu = modal({
      title: t('dragRace'),
      wide: true,
      className: 'race-menu',
      content: [el('div', { class: 'opt-label' }, t('yourCar')), carRow, tabs, body],
      onClose: () => { if (this.tab === 'online' && !this.session) net.leave(); },
    });
    renderCars();
    renderTabs();
    renderTab();
    if (preset.friend) this.startVs({ kind: 'friend', friend: preset.friend });
  }

  myCfg() {
    return this.app.state.getCar(this.myCarId)?.cfg || this.app.state.activeCar.cfg;
  }

  streetList() {
    const st = this.app.state;
    const list = el('div', { class: 'opp-list' });
    for (const r of STREET_RACERS) {
      const cfg = { ...defaultConfig(r.car.model), ...r.car };
      const img = el('img', { alt: '' });
      carThumb(cfg, img);
      const locked = r.tier > Math.max(1, Math.ceil(st.level / 2) + 1);
      list.appendChild(el('div', { class: `opp ${locked ? 'locked' : ''}` },
        img,
        el('div', { class: 'opp-info' }, el('b', {}, r.name), el('small', {}, `${MODELS[cfg.model].name} · PR ${ratingOf(cfg)}`), el('span', { class: 'stars' }, '★'.repeat(r.tier))),
        el('div', { class: 'opp-reward', html: `${icon('coin')} ${fmt(r.reward)}` }),
        el('button', { class: 'btn btn-green', onclick: () => (locked ? (audio.error(), this.app.toast(t('locked', { n: (r.tier - 1) * 2 }), 'warn')) : this.startVs({ kind: 'street', racer: r, cfg })), html: `${t('challenge')} <small>${icon('fuel')}1</small>` })));
    }
    return list;
  }

  friendList() {
    const app = this.app;
    const list = el('div', { class: 'opp-list' });
    const friends = [...NPC_FRIENDS, ...(app.state.data.friends || [])];
    for (const f of friends) {
      const cfg = { ...defaultConfig(f.car.model), ...f.car };
      const img = el('img', { alt: '' });
      carThumb(cfg, img);
      list.appendChild(el('div', { class: 'opp' },
        el('img', { class: 'portrait', src: portrait(f.avatar, 64), alt: '' }),
        el('div', { class: 'opp-info' }, el('b', {}, f.name), el('small', {}, `${t('level')} ${f.level} · ${MODELS[cfg.model].name} · PR ${ratingOf(cfg)}`)),
        img,
        el('button', { class: 'btn btn-green', onclick: () => this.startVs({ kind: 'friend', friend: f }), html: `${t('challenge')} <small>${icon('fuel')}1</small>` })));
    }
    list.appendChild(el('div', { class: 'hint' }, 'Tip: share your friend code from the Friends menu (top right) and import theirs to race their real car.'));
    return list;
  }

  localPanel() {
    const st = this.app.state;
    let p2Model = st.cars.find((c) => c.id !== this.myCarId)?.cfg.model || 'hatch';
    const preview = el('img', { class: 'p2-preview', alt: '' });
    const opts = [...new Set([...st.cars.map((c) => c.cfg.model), ...MODEL_IDS])];
    const select = el('select', { class: 'select', onchange: (e) => { p2Model = e.target.value; carThumb(this.p2Cfg(p2Model), preview); } },
      ...opts.map((m) => el('option', { value: m, selected: m === p2Model }, MODELS[m].name)));
    carThumb(this.p2Cfg(p2Model), preview);
    return el('div', { class: 'local-panel' },
      el('p', {}, 'Two players, one keyboard. Player 2 picks any car (your garage version is used if you own it).'),
      el('div', { class: 'p2-row' }, el('label', {}, 'Player 2 car'), select, preview),
      el('div', { class: 'controls-help' }, el('div', {}, t('controlsP1')), el('div', {}, t('controlsP2'))),
      el('button', { class: 'btn btn-green btn-big', onclick: () => this.startVs({ kind: 'local', cfg: this.p2Cfg(p2Model) }) }, t('start')));
  }

  p2Cfg(model) {
    const own = this.app.state.cars.find((c) => c.cfg.model === model && c.id !== this.myCarId);
    return own ? own.cfg : defaultConfig(model);
  }

  onlinePanel() {
    const app = this.app;
    const st = app.state;
    const wrap = el('div', { class: 'online-panel' });
    const status = el('div', { class: 'online-status' });
    const codeInput = el('input', { class: 'code-input', maxlength: 4, placeholder: 'ABCD' });
    const me = () => ({ name: st.data.player.name, avatar: st.data.player.avatar, level: st.level, car: this.myCfg() });
    const renderRoom = (room) => {
      status.innerHTML = '';
      if (!room) return;
      status.append(
        el('div', { class: 'room-code' }, `${t('roomCode')}: `, el('b', {}, room.code)),
        el('div', { class: 'room-players' }, ...room.players.map((p) => el('div', { class: 'room-player' },
          el('img', { src: portrait(p.player.avatar, 48), alt: '' }), el('b', {}, p.player.name), el('small', {}, MODELS[p.player.car?.model]?.name || ''),
          el('i', { class: p.ready ? 'ok' : '' }, p.ready ? t('ready') : '…')))),
        room.players.length < 2 ? el('p', { class: 'hint' }, t('waitingOpponent')) : el('button', { class: 'btn btn-green btn-big', onclick: () => { audio.click(); net.ready(); } }, t('ready')),
      );
    };
    const connect = async (fn) => {
      status.textContent = t('connecting');
      try {
        await net.connect();
      } catch (e) {
        status.innerHTML = '';
        status.appendChild(el('p', { class: 'warn' }, t('serverUnavailable')));
        return;
      }
      this.bindNet(renderRoom, status);
      fn();
    };
    wrap.append(
      el('p', {}, 'Race a friend live. One of you creates a room and shares the 4-letter code.'),
      el('div', { class: 'row-buttons' },
        el('button', { class: 'btn btn-blue', onclick: () => connect(() => net.createRoom(me())) }, t('createRoom')),
        codeInput,
        el('button', { class: 'btn btn-green', onclick: () => connect(() => net.joinRoom(codeInput.value, me())) }, t('joinRoom'))),
      status);
    if (net.room) {
      this.bindNet(renderRoom, status);
      renderRoom(net.room);
    }
    return wrap;
  }

  bindNet(renderRoom, status) {
    this.netOff?.forEach((f) => f());
    this.netOff = [
      net.on('room', (m) => renderRoom(m.room)),
      net.on('error', (m) => { status.appendChild(el('p', { class: 'warn' }, m.error)); }),
      net.on('start', (m) => {
        const opp = m.room.players.find((p) => p.id !== net.id);
        if (!opp) return;
        this.startVs({ kind: 'online', cfg: sanitizeCfg(opp.player.car), name: opp.player.name, avatar: opp.player.avatar, startAt: m.startAt, serverNow: m.now });
      }),
    ];
  }

  // ---------------------------------------------------------------------------------
  // Race session
  // ---------------------------------------------------------------------------------

  startVs(opp) {
    const app = this.app;
    const st = app.state;
    const needsFuel = opp.kind === 'street' || opp.kind === 'friend';
    if (needsFuel && !st.useFuel(1)) {
      audio.error();
      app.toast(t('notEnoughFuel'), 'warn');
      app.hud.flashFuel();
      return;
    }
    this.menu?.close();
    this.menu = null;
    const myCfg = JSON.parse(JSON.stringify(this.myCfg()));
    let oppCfg;
    let oppName;
    let oppAvatar = {};
    let skill = 0.6;
    if (opp.kind === 'street') {
      oppCfg = opp.cfg;
      oppName = opp.racer.name;
      skill = opp.racer.skill;
    } else if (opp.kind === 'friend') {
      oppCfg = { ...defaultConfig(opp.friend.car.model), ...opp.friend.car };
      oppName = opp.friend.name;
      oppAvatar = opp.friend.avatar;
      skill = Math.min(0.9, 0.45 + opp.friend.level * 0.03);
    } else {
      oppCfg = { ...defaultConfig(opp.cfg.model), ...opp.cfg };
      oppName = opp.kind === 'local' ? 'Player 2' : opp.name;
      oppAvatar = opp.avatar || {};
    }
    const sims = [new DragCar(myCfg), new DragCar(oppCfg, { ai: opp.kind === 'street' || opp.kind === 'friend' ? { skill } : null })];
    const scene = app.raceScene;
    scene.setCars(myCfg, oppCfg);
    scene.focus = opp.kind === 'local' ? 'both' : 0;
    scene.excited = false;
    app.setMode('race');
    app.engine.setScene(scene);
    const s = {
      opp,
      sims,
      t: 0,
      acc: 0,
      green: 5.0,
      phase: 'intro',
      oppName,
      oppAvatar,
      names: [st.data.player.name, oppName],
      finished: false,
      results: null,
      remote: opp.kind === 'online' ? { dist: 0, v: 0, rpm: 0, gear: 1, finished: false } : null,
      lastSend: 0,
    };
    if (opp.kind === 'online') {
      // align local timeline so the green light happens at the server's startAt
      const offset = Date.now() - opp.serverNow;
      s.greenAtLocal = opp.startAt + offset;
      s.t = s.green - (s.greenAtLocal - Date.now()) / 1000;
      this.netRaceOff = [
        net.on('progress', (m) => Object.assign(s.remote, m)),
        net.on('opponentFinish', (m) => { s.remote.finished = true; s.remote.time = m.time; s.remote.trap = m.trap; }),
        net.on('result', (m) => { s.serverResult = m; }),
        net.on('close', () => { s.serverResult = s.serverResult || { winner: net.id, forfeit: true, times: {} }; }),
      ];
    }
    this.session = s;
    this.buildHud(s);
    s.engines = [audio.engine({ electric: MODELS[myCfg.model].electric })];
    if (opp.kind === 'local' || opp.kind === 'street' || opp.kind === 'friend') s.engines.push(audio.engine({ electric: MODELS[oppCfg.model].electric, vol: opp.kind === 'local' ? 0.2 : 0.08 }));
    this.keyDown = (e) => this.onKey(e, true);
    this.keyUp = (e) => this.onKey(e, false);
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
  }

  buildHud(s) {
    const app = this.app;
    const local = s.opp.kind === 'local';
    const mkTach = (i) => {
      const sim = s.sims[i];
      const g = el('div', { class: `tach ${local ? (i === 0 ? 'p1' : 'p2') : 'solo'}` });
      g.innerHTML = tachSVG(sim.perf.redline);
      const gear = el('div', { class: 'tach-gear' }, 'N');
      const speed = el('div', { class: 'tach-speed' }, '0');
      const light = el('div', { class: 'shift-light' });
      const nitroBar = el('i');
      const nitro = el('button', { class: 'nitro-btn', onpointerdown: (e) => { e.preventDefault(); sim.useNitro(); } }, el('span', {}, t('nitro')), el('div', { class: 'nitro-bar' }, nitroBar));
      const pedal = el('button', {
        class: 'pedal-btn',
        onpointerdown: (e) => { e.preventDefault(); this.press(i, true); },
        onpointerup: (e) => { e.preventDefault(); this.press(i, false); },
        onpointerleave: () => this.press(i, false),
      }, el('span', {}, t('rev')));
      g.append(light, gear, el('div', { class: 'speed-wrap' }, speed, el('small', {}, 'km/h')));
      const wrap = el('div', { class: `tach-wrap ${local ? (i === 0 ? 'left' : 'right') : 'center'}` },
        local ? el('div', { class: 'tach-name' }, i === 0 ? 'P1' : 'P2') : null,
        el('div', { class: 'tach-row' }, local && i === 1 ? null : nitro, g, local && i === 0 ? null : (local ? nitro : pedal)),
        local ? el('div', { class: 'tach-keys' }, i === 0 ? t('controlsP1') : t('controlsP2')) : el('div', { class: 'tach-keys' }, t('controlsSolo')));
      return { wrap, needle: g.querySelector('.tach-needle'), gear, speed, light, nitroBar, pedal, launchArc: g.querySelector('.tach-launch'), shiftArc: g.querySelector('.tach-shift') };
    };
    s.tachs = [mkTach(0)];
    if (local) s.tachs.push(mkTach(1));
    const bar = el('div', { class: 'progress-track' });
    const markers = [0, 1].map((i) => {
      const m = el('div', { class: `progress-marker m${i}` }, el('span', {}, s.names[i]));
      bar.appendChild(m);
      return m;
    });
    bar.appendChild(el('div', { class: 'progress-finish' }));
    s.markers = markers;
    s.message = el('div', { class: 'race-message' });
    s.countdown = el('div', { class: 'race-countdown' });
    const versus = el('div', { class: 'versus' },
      el('div', { class: 'vs-side' }, el('img', { src: portrait(app.state.data.player.avatar, 56), alt: '' }), el('b', {}, s.names[0]), el('small', {}, MODELS[s.sims[0].cfg.model].name)),
      el('div', { class: 'vs-mid' }, t('vs')),
      el('div', { class: 'vs-side' }, el('img', { src: portrait(s.oppAvatar, 56), alt: '' }), el('b', {}, s.names[1]), el('small', {}, MODELS[s.sims[1].cfg.model].name)));
    s.versus = versus;
    const quit = el('button', { class: 'btn btn-gray quit-btn', onclick: () => this.endSession(true) }, el('span', { html: icon('back') }), t('back'));
    s.hud = el('div', { class: 'race-hud' }, quit, bar, versus, s.countdown, s.message, ...s.tachs.map((x) => x.wrap));
    app.uiRoot.appendChild(s.hud);
  }

  press(i, down) {
    const s = this.session;
    if (!s) return;
    const sim = s.sims[i];
    if (!sim) return;
    if (!sim.launched) {
      sim.throttle = down;
    } else if (down) {
      sim.shiftUp();
    }
    if (down) audio.ensure();
  }

  onKey(e, down) {
    const s = this.session;
    if (!s || e.repeat) return;
    const local = s.opp.kind === 'local';
    const k = e.code;
    if (local) {
      if (k === 'KeyZ') this.press(0, down);
      if (k === 'KeyM') this.press(1, down);
      if (down && k === 'KeyX') s.sims[0].useNitro();
      if (down && k === 'KeyN') s.sims[1].useNitro();
    } else {
      if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') { e.preventDefault(); this.press(0, down); }
      if (down && (k === 'KeyN' || k === 'ShiftLeft' || k === 'ShiftRight')) s.sims[0].useNitro();
    }
    if (down && k === 'Escape') this.endSession(true);
  }

  update(dt) {
    const s = this.session;
    if (!s) return;
    const scene = this.app.raceScene;
    if (s.remote && s.greenAtLocal) s.t = s.green - (s.greenAtLocal - Date.now()) / 1000;
    else s.t += dt;
    const tt = s.t;
    // Countdown tree
    if (tt < s.green) {
      if (tt > 2.4 && scene.camMode === 'intro') scene.camMode = 'race';
      const stage = tt > 2.6;
      const ambers = tt > 3.5 ? Math.min(3, Math.floor((tt - 3.5) / 0.5) + 1) : 0;
      scene.setTree(stage, ambers, false);
      if (ambers !== s.lastAmbers && ambers > 0) audio.beep(false);
      s.lastAmbers = ambers;
      s.countdown.textContent = stage ? (ambers ? String(4 - ambers) : t('ready')) : '';
      s.versus.classList.toggle('hidden', tt > 2.6);
      if (stage && !s.revHint) {
        s.revHint = true;
        this.flash(t('rev'), 'info');
      }
    } else if (!s.launchedAll) {
      s.launchedAll = true;
      scene.setTree(true, 3, true);
      audio.beep(true);
      s.countdown.textContent = t('go');
      s.countdown.classList.add('go');
      setTimeout(() => { if (this.session === s) s.countdown.textContent = ''; }, 900);
      scene.excited = true;
      for (const sim of s.sims) if (sim !== null) sim.launch();
    }
    // physics substeps
    s.acc += dt;
    let n = 0;
    while (s.acc >= STEP && n++ < 20) {
      s.acc -= STEP;
      for (let i = 0; i < s.sims.length; i++) {
        if (s.remote && i === 1) continue;
        s.sims[i].update(STEP);
      }
    }
    if (s.remote) {
      const r = s.sims[1];
      r.launched = s.launchedAll;
      r.dist = s.remote.dist;
      r.v = s.remote.v;
      r.rpm = s.remote.rpm;
      r.gear = s.remote.gear;
      r.nitroOn = s.remote.nitro;
      if (s.remote.finished) { r.finished = true; r.finishTime = s.remote.time; r.trapSpeed = s.remote.trap; }
      if (performance.now() - s.lastSend > 50) {
        s.lastSend = performance.now();
        const me = s.sims[0];
        net.progress({ dist: me.dist, v: me.v, rpm: me.rpm, gear: me.gear, nitro: me.nitroOn, launched: me.launched });
      }
    }
    scene.speedHint = s.sims[0].speedKmh / 14;
    scene.sync(s.sims, dt);
    this.updateHud(s);
    // engine audio
    s.engines.forEach((eng, i) => {
      const sim = s.sims[i];
      if (sim) eng.set(Math.min(1, sim.rpmFrac), sim.launched ? (sim.shiftTimer > 0 ? 0.2 : 1) : sim.throttle ? 0.8 : 0.3);
    });
    // events -> messages
    for (let i = 0; i < s.sims.length; i++) {
      const sim = s.sims[i];
      while (sim.events.length) {
        const ev = sim.events.shift();
        if (i !== 0 && s.opp.kind !== 'local') continue;
        const prefix = s.opp.kind === 'local' ? `P${i + 1}: ` : '';
        if (ev.type === 'nitro') { audio.whoosh(); this.flash(`${prefix}${t('nitro')}!`, 'nitro'); continue; }
        const good = /perfect/i.test(ev.text);
        if (ev.type === 'shift') audio.noise(0.08, { vol: 0.25, freq: 1800, q: 2 });
        this.flash(prefix + t(ev.text), good ? 'good' : /early|late|bad|spin/i.test(ev.text) ? 'bad' : 'info');
      }
    }
    // finish handling
    const me = s.sims[0];
    if (me.finished && s.remote && !s.sentFinish) {
      s.sentFinish = true;
      net.finish(me.finishTime, me.trapSpeed);
    }
    if (!s.finished) {
      const done = s.remote ? !!s.serverResult : s.sims.every((x) => x.finished) || s.t > s.green + 30;
      if (done) {
        s.finished = true;
        scene.finishCam = true;
        setTimeout(() => this.showResults(s), 1300);
      } else if ((me.finished || s.sims[1].finished) && !s.cheered) {
        s.cheered = true;
        audio.cheer();
      }
    }
  }

  updateHud(s) {
    s.tachs.forEach((tc, i) => {
      const sim = s.sims[i];
      const f = Math.min(1.02, sim.rpmFrac);
      tc.needle.style.transform = `rotate(${-220 + f * 260 + 90}deg)`;
      tc.gear.textContent = sim.launched ? String(sim.gear) : 'N';
      tc.speed.textContent = Math.round(sim.speedKmh);
      const inShift = sim.launched && sim.rpmFrac >= SHIFT_ZONE[0] && sim.gear < sim.perf.gears;
      const inLaunch = !sim.launched && sim.rpmFrac >= LAUNCH_ZONE[0] && sim.rpmFrac <= LAUNCH_ZONE[1];
      tc.light.classList.toggle('on', inShift || inLaunch);
      tc.light.classList.toggle('red', sim.launched && sim.rpmFrac > SHIFT_ZONE[1]);
      tc.launchArc.style.opacity = sim.launched ? 0.15 : 1;
      tc.shiftArc.style.opacity = sim.launched ? 1 : 0.35;
      tc.nitroBar.style.width = `${sim.nitroUsed ? Math.max(0, (sim.nitroLeft / sim.perf.nitroTime) * 100) : 100}%`;
      tc.pedal?.querySelector('span') && (tc.pedal.querySelector('span').textContent = sim.launched ? t('shift') : t('rev'));
    });
    s.markers.forEach((m, i) => {
      const p = Math.min(1, s.sims[i].dist / RACE_DISTANCE);
      m.style.left = `${p * 100}%`;
    });
  }

  flash(text, kind) {
    const s = this.session;
    if (!s) return;
    const m = el('div', { class: `flash flash-${kind}` }, text);
    s.message.appendChild(m);
    setTimeout(() => m.remove(), 1300);
  }

  showResults(s) {
    if (this.session !== s) return;
    const app = this.app;
    const st = app.state;
    const [a, b] = s.sims;
    let won;
    if (s.serverResult) won = s.serverResult.winner === net.id;
    else won = a.finished && (!b.finished || a.finishTime <= b.finishTime);
    const local = s.opp.kind === 'local';
    let coins = 0;
    let xp = 0;
    if (s.opp.kind === 'street') { coins = won ? s.opp.racer.reward : 0; xp = won ? 15 + s.opp.racer.tier * 8 : 5; }
    else if (s.opp.kind === 'friend') { coins = won ? 120 + s.opp.friend.level * 20 : 0; xp = won ? 25 : 6; }
    else if (s.opp.kind === 'online') { coins = won ? 300 : 40; xp = won ? 40 : 10; }
    else { xp = 8; }
    if (coins) st.addCoins(coins);
    if (xp) st.addXp(xp);
    st.data.stats.races++;
    if (won && !local) {
      st.data.stats.wins++;
      st.progressGoal('race');
    }
    st.save();
    const title = local ? (won ? t('p1wins') : t('p2wins')) : won ? t('youWin') : t('youLose');
    if (won || local) audio.levelUp(); else audio.error();
    const row = (i, sim) => el('tr', { class: i === 0 ? 'me' : '' },
      el('td', {}, s.names[i]),
      el('td', {}, MODELS[sim.cfg.model].name),
      el('td', {}, sim.finished ? `${sim.finishTime.toFixed(3)} s` : 'DNF'),
      el('td', {}, sim.finished ? `${Math.round(sim.trapSpeed)} km/h` : '-'));
    const panel = el('div', { class: `race-result ${won ? 'win' : 'lose'}` },
      el('h1', {}, title),
      s.serverResult?.forfeit ? el('p', {}, 'Opponent left the race.') : null,
      el('table', { class: 'result-table' },
        el('tr', {}, el('th', {}, ''), el('th', {}, ''), el('th', {}, `${t('et')} (1/8)`), el('th', {}, t('trap'))),
        row(0, a), row(1, b)),
      (coins || xp) ? el('div', { class: 'reward-row', html: `${t('reward')}: ${coins ? `${icon('coin')} <b>+${fmt(coins)}</b>` : ''} <b class="xp">+${xp} XP</b>` }) : null,
      el('div', { class: 'row-buttons' },
        el('button', { class: 'btn btn-gray', onclick: () => this.endSession(false) }, t('back')),
        s.opp.kind !== 'online' ? el('button', { class: 'btn btn-green', onclick: () => this.rematch(s) }, t('rematch')) : null));
    s.hud.appendChild(panel);
  }

  rematch(s) {
    const opp = s.opp;
    this.endSession(false, true);
    this.startVs(opp);
  }

  endSession(aborted, keepMode = false) {
    const s = this.session;
    if (!s) return;
    s.engines.forEach((e) => e.stop());
    s.hud.remove();
    this.netRaceOff?.forEach((f) => f());
    this.netRaceOff = null;
    if (s.remote) {
      if (aborted) net.leave();
    }
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    this.session = null;
    if (!keepMode) {
      this.app.goGarage();
      if (s.remote && !aborted) this.openMenu({ tab: 'online' });
    }
    void pick;
  }
}
