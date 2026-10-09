// 妈妈表扬：全屏礼炮 + 中央「妈妈点赞卡」+ Web Audio 实时合成庆典音效
// 零依赖、无音频文件；无 DOM / 无音频环境静默降级（沿用 Ui / Speech 约定）
const Celebrate = {
  COOLDOWN: 800, // 防抖：同一题多个触发点（点亮 / 销号）不连环轰炸
  TTL: 2600, // 无操作自动淡出

  _last: 0,
  _ctx: null,

  SIDE_TTL: 1800, // 侧边「妈妈旁边表扬」无操作自动淡出
  SIDE_LINES: [
    '这题稳！妈妈在旁边看着呢 😄',
    '又对了，妈妈的小骄傲 💛',
    '漂亮！思路很顺 👏',
    '对了对了，妈妈给你比个心 💗',
    '真棒，越做越稳 ✨',
  ],

  // 表扬一次：礼炮纸屑 + 中央点赞卡 +（默认）庆典音效
  praise(opts) {
    if (typeof document === 'undefined' || !document.body) return; // 测试 / 无 DOM 环境跳过
    const now = Date.now();
    if (now - this._last < this.COOLDOWN) return;
    this._last = now;
    const o = opts || {};
    this._sfx();
    const root = document.getElementById('celebrate-root') || this._root();
    this._confetti(root);
    const card = document.createElement('div');
    card.className = 'celebrate-card';
    card.innerHTML = `<img class="celebrate-avatar" src="assets/mom-praise.png" alt="妈妈">
      <div class="celebrate-title">${o.title || '妈妈给你点个赞 👍'}</div>
      <div class="celebrate-text">${o.text || '这波干得漂亮，继续保持！'}</div>`;
    root.appendChild(card);
    const dismiss = () => {
      root.classList.add('out');
      const t = setTimeout(() => root.remove(), 400);
      if (t && typeof t.unref === 'function') t.unref();
    };
    card.addEventListener('click', dismiss);
    const timer = setTimeout(dismiss, this.TTL);
    if (timer && typeof timer.unref === 'function') timer.unref();
  },

  // 侧边「妈妈旁边表扬」：每答对一题从屏幕侧边探出头来表扬一句；
  // 非阻塞（pointer-events:none）、自动淡出、连对时替换旧的（不堆积），不影响点「下一题」
  sidePraise(opts) {
    if (typeof document === 'undefined' || !document.body) return; // 测试 / 无 DOM 环境跳过
    const o = opts || {};
    const lines = this.SIDE_LINES;
    const text = o.text || lines[Math.floor(Math.random() * lines.length)];
    const old = document.getElementById('side-praise');
    if (old && old.remove) old.remove(); // 连对：替换上一个，避免浮层堆积
    const box = document.createElement('div');
    box.id = 'side-praise';
    box.className = 'side-praise';
    box.innerHTML = `<img class="side-praise-avatar" src="assets/mom-praise.png" alt="妈妈">
      <div class="side-praise-text">${text}</div>`;
    document.body.appendChild(box);
    const timer = setTimeout(() => {
      box.classList.add('out');
      const t = setTimeout(() => box.remove(), 320);
      if (t && typeof t.unref === 'function') t.unref();
    }, this.SIDE_TTL);
    if (timer && typeof timer.unref === 'function') timer.unref();
  },

  _root() {
    const div = document.createElement('div');
    div.id = 'celebrate-root';
    div.className = 'celebrate-mask';
    document.body.appendChild(div);
    return div;
  },

  // 礼炮：在遮罩内撒一把彩色纸屑（纯 DOM + CSS 动画，无需 canvas）
  _confetti(root) {
    const COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#facc15'];
    const N = 36;
    for (let i = 0; i < N; i++) {
      const p = document.createElement('span');
      p.className = 'confetti';
      if (p.style) {
        p.style.left = (Math.random() * 100).toFixed(1) + '%';
        p.style.background = COLORS[i % COLORS.length];
        p.style.animationDelay = (Math.random() * 0.5).toFixed(2) + 's';
        p.style.animationDuration = (1.5 + Math.random() * 1.3).toFixed(2) + 's';
      }
      root.appendChild(p);
    }
  },

  // 庆典音效：礼炮「砰」+ 上行「叮叮叮」（Web Audio 实时合成）
  _sfx() {
    if (typeof window === 'undefined') return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      const ctx = this._ctx || (this._ctx = new AC());
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      const t = ctx.currentTime;
      // 礼炮：白噪声瞬爆 + 低通，快速衰减成一声「砰」
      const dur = 0.4;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1200;
      const ng = ctx.createGain();
      ng.gain.value = 0.5;
      noise.connect(lp);
      lp.connect(ng);
      ng.connect(ctx.destination);
      noise.start(t);
      // 上行四音：越来越高的「叮」，喜庆上扬
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = f;
        const g = ctx.createGain();
        const st = t + 0.05 + i * 0.09;
        g.gain.setValueAtTime(0.0001, st);
        g.gain.exponentialRampToValueAtTime(0.26, st + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, st + 0.34);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(st);
        osc.stop(st + 0.4);
      });
    } catch (e) { /* 音频不可用：静默降级，表扬照常显示 */ }
  },
};
