// Fully synthesised audio (no asset files): UI blips, coins, level-ups,
// engine sounds for races/driving, and a small looping background tune.

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.sfxOn = true;
    this.musicOn = true;
    this.engines = new Set();
    this.musicTimer = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.connect(this.master);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = this.musicOn ? 0.16 : 0;
    this.musicBus.connect(this.master);
    this.noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (this.musicOn) this.startMusic();
    return this.ctx;
  }

  setSfx(on) {
    this.sfxOn = on;
    if (this.sfxBus) this.sfxBus.gain.value = on ? 1 : 0;
  }

  setMusic(on) {
    this.musicOn = on;
    if (!this.ctx) return;
    this.musicBus.gain.setTargetAtTime(on ? 0.16 : 0, this.ctx.currentTime, 0.2);
    if (on) this.startMusic();
  }

  tone(freq, dur, { type = 'sine', vol = 0.3, when = 0, slide = 0, attack = 0.005 } = {}) {
    const ctx = this.ensure();
    if (!ctx || !this.sfxOn) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  noise(dur, { vol = 0.2, when = 0, freq = 1200, q = 0.8, type = 'bandpass' } = {}) {
    const ctx = this.ensure();
    if (!ctx || !this.sfxOn) return;
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  click() { this.tone(880, 0.06, { type: 'triangle', vol: 0.18 }); }
  pop() { this.tone(520, 0.08, { type: 'sine', vol: 0.25, slide: 400 }); }
  error() { this.tone(200, 0.18, { type: 'square', vol: 0.12, slide: -60 }); }
  coin() {
    this.tone(1318, 0.09, { type: 'square', vol: 0.12 });
    this.tone(1760, 0.22, { type: 'square', vol: 0.12, when: 0.08 });
  }
  cash() {
    [880, 1108, 1318, 1760].forEach((f, i) => this.tone(f, 0.12, { type: 'triangle', vol: 0.18, when: i * 0.05 }));
  }
  levelUp() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.25, { type: 'square', vol: 0.12, when: i * 0.09 }));
  }
  wrench() {
    for (let i = 0; i < 4; i++) this.noise(0.05, { vol: 0.18, when: i * 0.07, freq: 3000, q: 4 });
  }
  airgun() { this.noise(0.35, { vol: 0.25, freq: 2400, q: 1.2 }); }
  beep(high = false) { this.tone(high ? 1320 : 660, high ? 0.45 : 0.18, { type: 'square', vol: 0.14 }); }
  horn() {
    this.tone(415, 0.35, { type: 'square', vol: 0.1 });
    this.tone(523, 0.35, { type: 'square', vol: 0.08 });
  }
  whoosh() { this.noise(0.5, { vol: 0.3, freq: 600, q: 0.5, type: 'lowpass' }); }
  cheer() {
    for (let i = 0; i < 6; i++) this.noise(0.6, { vol: 0.08, when: i * 0.05, freq: 900 + i * 300, q: 0.6 });
  }

  /** Continuous engine voice. Returns a controller with set(rpmFrac, load), stop(). */
  engine({ electric = false, vol = 0.22 } = {}) {
    const ctx = this.ensure();
    if (!ctx) return { set() {}, stop() {} };
    const out = ctx.createGain();
    out.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.Q.value = 3;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = electric ? 'sine' : 'sawtooth';
    o2.type = electric ? 'triangle' : 'square';
    const g2 = ctx.createGain();
    g2.gain.value = electric ? 0.4 : 0.5;
    o1.connect(filter);
    o2.connect(g2).connect(filter);
    filter.connect(out).connect(this.sfxBus);
    o1.start();
    o2.start();
    const ctrl = {
      set(rpmFrac, load = 1) {
        const t = ctx.currentTime;
        const base = electric ? 180 + rpmFrac * 1400 : 38 + rpmFrac * 190;
        o1.frequency.setTargetAtTime(base, t, 0.03);
        o2.frequency.setTargetAtTime(base * (electric ? 2.01 : 0.5), t, 0.03);
        filter.frequency.setTargetAtTime(400 + rpmFrac * 2600 * (0.5 + load * 0.5), t, 0.05);
        out.gain.setTargetAtTime(vol * (0.35 + 0.65 * load) * (electric ? 0.6 : 1), t, 0.05);
      },
      stop: () => {
        const t = ctx.currentTime;
        out.gain.setTargetAtTime(0, t, 0.1);
        o1.stop(t + 0.5);
        o2.stop(t + 0.5);
        this.engines.delete(ctrl);
      },
    };
    this.engines.add(ctrl);
    return ctrl;
  }

  stopEngines() {
    for (const e of [...this.engines]) e.stop();
  }

  // --- Music: a cheerful 8-bar loop in the spirit of social-game garages -----------
  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    const ctx = this.ctx;
    const bpm = 112;
    const beat = 60 / bpm;
    const prog = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]];
    const melody = [72, 74, 76, 79, 76, 74, 72, 69, 72, 74, 76, 72, 74, 72, 69, 67];
    let step = 0;
    let next = ctx.currentTime + 0.1;
    const note = (midi, t, dur, type, vol) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.musicBus);
      o.start(t);
      o.stop(t + dur + 0.02);
    };
    const schedule = () => {
      while (next < ctx.currentTime + 0.4) {
        const bar = Math.floor(step / 8) % prog.length;
        const chord = prog[bar];
        const s8 = step % 8;
        if (s8 % 2 === 0) note(chord[0] - 12, next, beat * 0.9, 'triangle', 0.5);
        if (s8 === 2 || s8 === 6) for (const n of chord) note(n + 12, next, beat * 0.4, 'square', 0.06);
        if (step % 2 === 0) note(melody[(step / 2) % melody.length], next, beat * 0.8, 'triangle', 0.18);
        // hi-hat
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuf;
        const f = ctx.createBiquadFilter();
        f.type = 'highpass';
        f.frequency.value = 7000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(s8 % 2 ? 0.05 : 0.09, next);
        g.gain.exponentialRampToValueAtTime(0.0001, next + 0.05);
        src.connect(f).connect(g).connect(this.musicBus);
        src.start(next, Math.random() * 0.5);
        src.stop(next + 0.06);
        next += beat / 2;
        step++;
      }
    };
    this.musicTimer = setInterval(schedule, 100);
    schedule();
  }
}

export const audio = new AudioSystem();
