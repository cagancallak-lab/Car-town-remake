// Ties the engine, game state, scenes and UI together and switches between
// modes (garage, editor, dealer, customize, race, town).

import { GameState } from './game/state.js';
import { GarageScene } from './scenes/garageScene.js';
import { ShowroomScene } from './scenes/showroomScene.js';
import { RaceScene } from './scenes/raceScene.js';
import { TownScene } from './scenes/townScene.js';
import { WorldLabels } from './ui/labels.js';
import { Hud } from './ui/hud.js';
import { DealerUI } from './ui/dealer.js';
import { CustomizeUI } from './ui/customize.js';
import { EditorUI } from './ui/editorUI.js';
import { RaceUI } from './ui/raceUI.js';
import { TownUI } from './ui/townUI.js';
import { openFriends, openGoals, openLuxury, openSettings, openOnboarding } from './ui/panels.js';
import { setUiRoot, toast, banner, popupMenu, closePopup, confirmDialog } from './ui/dom.js';
import { GOAL_DEFS } from './game/catalog.js';
import { MODELS } from './cars/models.js';
import { carSellValue } from './game/catalog.js';
import { setLang, t } from './core/i18n.js';
import { audio } from './core/audio.js';
import { fmt } from './core/util.js';
import { setCarLightLevel } from './cars/carFactory.js';

export class App {
  constructor(engine, uiRoot) {
    this.engine = engine;
    this.uiRoot = uiRoot;
    setUiRoot(uiRoot);
    this.state = new GameState();
    const s = this.state.data.settings;
    setLang(s.lang);
    audio.sfxOn = s.sfx;
    audio.musicOn = s.music;
    this.applyQuality(s.quality);
    setCarLightLevel(0.35);
    this.labels = new WorldLabels(uiRoot);
    this.mode = 'garage';
  }

  init() {
    const app = this;
    this.garage = new GarageScene(this.engine, this.state, this.labels);
    this.garage.ui = this;
    this.showroom = new ShowroomScene(this.engine);
    this.raceScene = new RaceScene(this.engine);
    this.town = null; // built lazily on first visit
    this.hud = new Hud(this);
    this.dealer = new DealerUI(this);
    this.customize = new CustomizeUI(this);
    this.editor = new EditorUI(this);
    this.race = new RaceUI(this);
    this.townUI = new TownUI(this);
    this.engine.onFrame((dt) => {
      if (app.mode === 'race') app.race.update(dt);
      if (app.mode === 'town') app.townUI.update(dt);
    });
    this.state.on('levelup', (lvl) => {
      audio.levelUp();
      banner(t('levelUp'), `${t('level')} ${lvl}`, 'gold', 2600);
    });
    this.state.on('goal', (def) => toast(`★ ${def.text.replace('{n}', fmt(def.n))} — ${t('claim')}!`, 'good', 3200));
    // unlock audio on first interaction
    const unlock = () => {
      audio.ensure();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    this.goGarage();
    if (!this.state.data.started) {
      openOnboarding(this, () => {
        this.garage.build();
        this.hud.refreshAll();
      });
    }
  }

  // ---------------------------------------------------------------------------------
  // Modes
  // ---------------------------------------------------------------------------------

  setMode(mode) {
    this.mode = mode;
    document.body.dataset.mode = mode;
    this.hud.setMode(mode);
    closePopup();
  }

  goGarage() {
    this.setMode('garage');
    this.showroom.exit();
    this.engine.setScene(this.garage);
    this.labels.setVisible(true);
  }

  openDealer() {
    audio.click();
    this.engine.setScene(this.showroom);
    this.labels.setVisible(false);
    this.dealer.open();
  }

  openCustomize(carId) {
    audio.click();
    this.engine.setScene(this.showroom);
    this.labels.setVisible(false);
    this.customize.open(carId);
  }

  openEditor() {
    audio.click();
    this.editor.open();
  }

  openRaceMenu(preset) {
    audio.click();
    if (this.mode !== 'garage') this.goGarage();
    this.race.openMenu(preset);
  }

  goTown() {
    audio.click();
    if (!this.town) this.town = new TownScene(this.engine, this.state);
    this.labels.setVisible(false);
    this.townUI.open();
  }

  openFriends() { audio.click(); openFriends(this); }
  openGoals() { audio.click(); openGoals(this); }
  openLuxury() { audio.click(); openLuxury(this); }
  openSettings() { audio.click(); openSettings(this); }

  goalDef(id) {
    return GOAL_DEFS.find((g) => g.id === id);
  }

  // ---------------------------------------------------------------------------------
  // Scene callbacks
  // ---------------------------------------------------------------------------------

  carName(car) {
    return MODELS[car.cfg.model].name;
  }

  onCarClick(carId, e) {
    const car = this.state.getCar(carId);
    if (!car) return;
    audio.click();
    const active = this.state.activeCar?.id === carId;
    popupMenu(e.clientX, e.clientY, `${this.carName(car)}${active ? ' ★' : ''}`, [
      { label: t('customize'), icon: 'paint', action: () => this.openCustomize(carId) },
      { label: t('race'), icon: 'flag', action: () => { this.state.setActiveCar(carId); this.openRaceMenu({ carId }); } },
      { label: t('drive'), icon: 'steering', action: () => { this.state.setActiveCar(carId); this.goTown(); } },
      active ? null : { label: t('setActive'), icon: 'star', action: () => { this.state.setActiveCar(carId); toast(`${t('activeCar')}: ${this.carName(car)}`); } },
      { label: t('sell'), icon: 'trash', className: 'danger', right: `+${fmt(carSellValue(car))}`, action: () => this.sellCar(carId) },
    ].filter(Boolean));
  }

  async sellCar(carId) {
    const car = this.state.getCar(carId);
    if (this.state.cars.length <= 1) {
      audio.error();
      toast(t('lastCar'), 'warn');
      return;
    }
    const value = carSellValue(car);
    if (!(await confirmDialog(t('sellConfirm', { name: this.carName(car), n: fmt(value) }), { ok: t('sell') }))) return;
    this.state.removeCar(carId);
    this.state.addCoins(value);
    this.garage.refreshCar(carId);
    audio.coin();
    toast(t('sold', { n: fmt(value) }));
  }

  onFriendClick(friend, e) {
    audio.click();
    popupMenu(e.clientX, e.clientY, `${friend.name} · ${t('level')} ${friend.level}`, [
      { label: `${t('challenge')} (${MODELS[friend.car.model].name})`, icon: 'flag', action: () => this.openRaceMenu({ friend, tab: 'friends' }) },
      { label: t('friends'), icon: 'users', action: () => this.openFriends() },
    ]);
  }

  onEditorSelect(sel, e) { this.editor.onSelect(sel, e); }
  onPlaceAttempt(p) { this.editor.onPlaceAttempt(p); }
  onPlaceCancel() { this.editor.onPlaceCancel(); }
  closePopups() { closePopup(); }
  toast(text, kind) { toast(text, kind); }
  banner(text, sub, kind) { banner(text, sub, kind); }
  flashFuel() { this.hud.flashFuel(); }
  pulseCoins() { this.hud.pulseCoins(); }

  // ---------------------------------------------------------------------------------
  // Top bar actions
  // ---------------------------------------------------------------------------------

  zoom(f) {
    if (this.engine.active === this.garage) this.garage.zoomBy(f);
  }

  takePhoto() {
    audio.click();
    const scene = this.engine.active;
    this.uiRoot.classList.add('photo-flash');
    setTimeout(() => this.uiRoot.classList.remove('photo-flash'), 400);
    this.engine.renderer.render(scene.scene, scene.camera);
    const url = this.engine.renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `car-town-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast(t('photoSaved'));
  }

  toggleFullscreen() {
    audio.click();
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  toggleSound() {
    this.setSound(!this.state.data.settings.sfx);
  }

  setSound(on) {
    this.state.data.settings.sfx = on;
    audio.setSfx(on);
    this.state.save();
    this.hud.refreshSound();
    if (on) audio.click();
  }

  setMusic(on) {
    this.state.data.settings.music = on;
    audio.setMusic(on);
    this.state.save();
  }

  setLanguage(lang) {
    this.state.data.settings.lang = lang;
    this.state.saveNow();
    setLang(lang);
    location.reload();
  }

  applyQuality(q) {
    const r = this.engine.renderer;
    r.setPixelRatio(q === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    r.shadowMap.enabled = q !== 'low';
    this.engine.resize();
  }

  setQuality(q) {
    this.state.data.settings.quality = q;
    this.state.save();
    this.applyQuality(q);
    // materials need recompiling when toggling shadows
    for (const sc of [this.garage, this.showroom, this.raceScene, this.town]) sc?.scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.needsUpdate = true; }); });
  }
}
