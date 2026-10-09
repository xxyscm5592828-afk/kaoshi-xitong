// 妈妈表扬：全屏礼炮 + 中央「妈妈点赞卡」+ Web Audio 实时合成庆典音效
// 零依赖、无音频文件；无 DOM / 无音频环境静默降级（沿用 Ui / Speech 约定）
const Celebrate = {
  COOLDOWN: 800, // 防抖：同一题多个触发点（点亮 / 销号）不连环轰炸
  TTL: 2600, // 无操作自动淡出

  _last: 0,
  _ctx: null,

  SIDE_TTL: 1800, // 侧边「爸妈旁边表扬」无操作自动淡出
  // 侧边表扬：形象、话术、出场的人（妈妈 / 爸爸 / 双人）、左右方向均随机
  MOM_AVATARS: ['assets/mom-praise.png', 'assets/mom-1.png', 'assets/mom-2.png', 'assets/mom-3.png'],
  DAD_AVATARS: ['assets/dad-1.png', 'assets/dad-2.png'],
  MOM_LINES: [
    '这题稳！妈妈在旁边看着呢 😄',
    '又对了，妈妈的小骄傲 💛',
    '漂亮！思路很顺 👏',
    '对了对了，妈妈给你比个心 💗',
    '真棒，越做越稳 ✨',
    '妈妈看到啦，答得又快又准 👍',
    '这道题拿下！继续冲 💪',
    '太给力了，妈妈都惊到啦 😲',
    '不错不错，保持这个手感 🔥',
  ],
  DAD_LINES: [
    '不错！爸爸看了都点头 👍',
    '这题解得漂亮，爸爸服气 😎',
    '稳！爸爸给你竖个大拇指 💪',
    '行啊，这波操作很硬核 🔥',
    '牛！爸爸小时候可没这么快 🚀',
    '答对了！爸爸给你记一功 ⭐',
    '可以啊，这才是真本事 💥',
    '厉害，爸爸给你鼓掌 👏',
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

  // 侧边「爸妈旁边表扬」：每答对一题从屏幕侧边探出头来表扬一句；
  // 非阻塞（pointer-events:none）、自动淡出、连对时替换旧的（不堆积），不影响点「下一题」
  // 出场的人（妈妈 / 爸爸 / 双人）、形象、话术、左右位置均随机
  sidePraise(opts) {
    if (typeof document === 'undefined' || !document.body) return; // 测试 / 无 DOM 环境跳过
    const o = opts || {};
    this._clearSide(); // 连对：先清掉上一轮浮层，避免堆积
    if (o.text) { this._showSide('side-praise', 'left', 'mom', o.text); return; } // 显式指定文案：固定左侧妈妈
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    if (Math.random() < 0.25) { // 双人：左右各站一位，谁在左谁在右随机
      const dadLeft = Math.random() < 0.5;
      this._showSide('side-praise-l', 'left', dadLeft ? 'dad' : 'mom', pick(dadLeft ? this.DAD_LINES : this.MOM_LINES));
      this._showSide('side-praise-r', 'right', dadLeft ? 'mom' : 'dad', pick(dadLeft ? this.MOM_LINES : this.DAD_LINES));
      return;
    }
    const who = Math.random() < 0.7 ? 'mom' : 'dad'; // 单人：妈妈多一些，左 / 右随机
    this._showSide('side-praise', Math.random() < 0.5 ? 'left' : 'right', who, pick(who === 'dad' ? this.DAD_LINES : this.MOM_LINES));
  },

  // 清除侧边表扬浮层（单人 / 双人共用，避免连对时堆积）
  _clearSide() {
    ['side-praise', 'side-praise-l', 'side-praise-r'].forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.remove) el.remove();
    });
  },

  // 渲染一个侧边表扬浮层：side=left|right，who=mom|dad
  _showSide(id, side, who, text) {
    const isDad = who === 'dad';
    const pool = isDad ? this.DAD_AVATARS : this.MOM_AVATARS;
    const avatar = pool[Math.floor(Math.random() * pool.length)];
    const box = document.createElement('div');
    box.id = id;
    box.className = 'side-praise' + (side === 'right' ? ' right' : '');
    // 图片缺失时兜底，避免出现破图
    const fallback = isDad ? 'assets/dad-1.png' : 'assets/mom-praise.png';
    box.innerHTML = `<img class="side-praise-avatar" src="${avatar}" alt="${isDad ? '爸爸' : '妈妈'}"
      onerror="this.onerror=null;this.src='${fallback}'">
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
