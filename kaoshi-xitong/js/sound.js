// 声音系统：答对/答错音效 + 舒缓背景音乐（全部 Web Audio 本地合成，不加载任何音频文件，离线可用）
// 设置持久化在 Store.settings.sfx / Store.settings.music：{ on: bool, vol: 0~1 }
// 浏览器策略：首次用户交互（点击）后 AudioContext 才能出声——正好从「开始答题」起步
const Sound = {
  _ctx: null,
  _sfxGain: null,
  _musicGain: null,
  _musicNodes: null,
  _musicTimer: null,

  // ===== 设置读写（缺省：音效开 50%，BGM 关 40%——不吓人，想听自己开） =====
  sfx() { return { on: true, vol: 0.5, ...((Store.settings || {}).sfx || {}) }; },
  music() { return { on: false, vol: 0.4, ...((Store.settings || {}).music || {}) }; },
  setSfx(patch) { Store.settings = { ...Store.settings, sfx: { ...this.sfx(), ...patch } }; this._applyGain(); },
  setMusic(patch) { Store.settings = { ...Store.settings, music: { ...this.music(), ...patch } }; this._applyGain(); },

  // ===== AudioContext 懒初始化 =====
  _ensureCtx() {
    if (!this._ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this._ctx = new AC();
      this._sfxGain = this._ctx.createGain();
      this._musicGain = this._ctx.createGain();
      this._sfxGain.connect(this._ctx.destination);
      this._musicGain.connect(this._ctx.destination);
      this._applyGain();
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  },

  _applyGain() {
    if (!this._ctx) return;
    const s = this.sfx(), m = this.music();
    this._sfxGain.gain.value = s.on ? s.vol : 0;
    this._musicGain.gain.value = m.on ? m.vol : 0;
  },

  // ===== 音效：一个短音（正弦包络） =====
  _tone(freq, { type = 'sine', dur = 0.12, gain = 0.5, when = 0, slide = 0 } = {}) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this._sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  },

  // 入口：correct 答对 / wrong 答错 / combo 连击 / coin 打卡 / done 收工 / tap 点按
  play(name) {
    if (!this.sfx().on) return;
    switch (name) {
      case 'correct': // 上行三连音「叮」
        this._tone(523.25, { dur: 0.1, gain: 0.45 });
        this._tone(659.25, { dur: 0.1, gain: 0.45, when: 0.09 });
        this._tone(783.99, { dur: 0.16, gain: 0.5, when: 0.18 });
        break;
      case 'combo': // 连击加高八度
        this._tone(659.25, { dur: 0.09, gain: 0.45 });
        this._tone(783.99, { dur: 0.09, gain: 0.45, when: 0.08 });
        this._tone(1046.5, { dur: 0.2, gain: 0.5, when: 0.16 });
        break;
      case 'wrong': // 低沉下行「嘟」
        this._tone(220, { type: 'triangle', dur: 0.18, gain: 0.5, slide: -70 });
        this._tone(164.81, { type: 'triangle', dur: 0.22, gain: 0.45, when: 0.16 });
        break;
      case 'coin': // 金币两声
        this._tone(987.77, { dur: 0.08, gain: 0.4 });
        this._tone(1318.5, { dur: 0.2, gain: 0.5, when: 0.08 });
        break;
      case 'done': // 收工小旋律
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this._tone(f, { dur: 0.18, gain: 0.45, when: i * 0.14 }));
        break;
      case 'tap':
        this._tone(440, { dur: 0.06, gain: 0.25 });
        break;
    }
  },

  // ===== BGM：慢和弦 pad（Cmaj7 → Am7 → Fmaj7 → G，每 8 秒平滑换和弦） =====
  CHORDS: [
    [261.63, 329.63, 392.0, 493.88],   // Cmaj7
    [220.0, 261.63, 329.63, 392.0],    // Am7
    [174.61, 261.63, 349.23, 440.0],   // Fmaj7
    [196.0, 246.94, 293.66, 392.0],    // G
  ],

  musicToggle() {
    if (this.music().on) this.musicOff();
    else this.musicOn();
    return this.music().on;
  },

  musicOn() {
    this.setMusic({ on: true });
    if (!this._ensureCtx()) return;
    if (this._musicNodes) return; // 已在播放
    const ctx = this._ctx;
    // 滤波器：把正弦磨成温暖的 pad
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.connect(this._musicGain);
    const oscs = this.CHORDS[0].map(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0.12;
      osc.connect(g).connect(filter);
      osc.start();
      return osc;
    });
    // 轻微颤音：增益 LFO，听感更"活"
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain).connect(this._musicGain.gain);
    lfo.start();
    this._musicNodes = { oscs, lfo, filter };
    // 每 8 秒换一个和弦（线性滑音平滑过渡）
    let idx = 0;
    this._musicTimer = setInterval(() => {
      idx = (idx + 1) % this.CHORDS.length;
      const chord = this.CHORDS[idx];
      oscs.forEach((osc, i) => {
        osc.frequency.linearRampToValueAtTime(chord[i], ctx.currentTime + 3);
      });
    }, 8000);
  },

  musicOff() {
    this.setMusic({ on: false });
    if (this._musicTimer) { clearInterval(this._musicTimer); this._musicTimer = null; }
    if (!this._musicNodes) return;
    const { oscs, lfo } = this._musicNodes;
    [...oscs, lfo].forEach(n => { try { n.stop(); } catch (e) { /* 已停 */ } });
    this._musicNodes = null;
  },
};
