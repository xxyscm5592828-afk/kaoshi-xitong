// 放松模块：呼吸球 + 连错宽心（短平快，绝不打断学习心流超过 30 秒）
// 规则来源：开发文档 §9.7 放松模块——练约 2 组题（25 分钟）给 30 秒呼吸放松（可跳过）；连错 3 题给宽心话 + 降载
// 依赖：无（纯 DOM + CSS 动画；样式在 css/app.css 的「呼吸放松卡」一节）；无 DOM 环境静默降级（沿用 Ui / Celebrate 约定）
const Wellness = {
  BREATH_MS: 30000, // 严格 30 秒上限：到点渐隐收起，不拖
  MELTDOWN_AT: 3, // 连错 3 题触发宽心

  // 4-7-8 呼吸法三拍（毫秒）：球体 CSS 动画 breath-scale 同为 19s 一轮，与此节拍同步
  PHASES: [
    { label: '吸气…', ms: 4000 },
    { label: '屏住…', ms: 7000 },
    { label: '呼气…', ms: 8000 },
  ],

  // 连错宽心文案（风趣宽心不施压：不说「你要努力」「粗心」这类指责词）
  COMFORTS: [
    { title: '这知识点有点皮 🙃', text: '连错 3 题不是你的问题，是这知识点皮。它在耍赖，咱不跟它一般见识——先降点难度找找手感，回头再收拾它。' },
    { title: '大脑喊了个暂停 🧠', text: '连错 3 题，是大脑想喝口水了，不是你不行。降载安排上：接下来出软柿子捏捏，把手感找回来再说。' },
    { title: '这锅题目背 🤷', text: '连错 3 题，锅先甩给题目：绕得很。别硬刚，降点难度热热身，它又跑不掉，改天再战。' },
  ],

  // 30 秒呼吸球卡片 HTML：一张 card 内球 + 引导文字 +「开始」/「跳过」
  breathHTML() {
    return `
      <div class="card breath-card">
        <h2>🌬️ 呼吸放松 30 秒</h2>
        <div class="muted">4-7-8 呼吸法：吸 4 秒、屏 7 秒、呼 8 秒，跟着球走就对了</div>
        <div class="breath-stage">
          <div class="breath-ball"></div>
          <div class="breath-text">点「开始」，跟球一起呼吸</div>
        </div>
        <div class="breath-actions">
          <button class="btn breath-start">开始</button>
          <button class="btn secondary breath-skip">跳过</button>
        </div>
      </div>`;
  },

  // 绑定交互：「开始」启动球动画与文字节拍 + 30 秒倒计时；「跳过」/「30 秒到」渐隐移除并回调
  // el：breathHTML() 挂载后的卡片元素；onDone：可选回调（跳过或到点都调，只调一次）
  breathWire(el, onDone) {
    if (!el || !el.querySelector) return; // 测试/无 DOM 环境跳过
    const ball = el.querySelector('.breath-ball');
    const text = el.querySelector('.breath-text');
    const startBtn = el.querySelector('.breath-start');
    const skipBtn = el.querySelector('.breath-skip');
    if (!ball || !text || !startBtn || !skipBtn) return;

    const timers = [];
    let started = false;
    let done = false;
    // 定时器不阻塞进程退出（Node 测试环境），浏览器端无副作用（沿用 Ui / Celebrate 约定）
    const later = (fn, ms) => {
      const t = setTimeout(fn, ms);
      if (t && typeof t.unref === 'function') t.unref();
      timers.push(t);
    };

    // 收起：清掉所有计时器 → 渐隐 → 移除 → 回调（只走一次，跳过与到点不重复触发）
    const finish = () => {
      if (done) return;
      done = true;
      timers.forEach((t) => clearTimeout(t));
      el.classList.add('out');
      later(() => el.remove(), 320);
      if (typeof onDone === 'function') onDone();
    };

    // 文字引导：4-7-8 三拍循环切换（CSS 管球动画，JS 管文字）
    let phase = 0;
    const runPhase = () => {
      if (done) return;
      const cur = phase;
      text.textContent = this.PHASES[cur].label;
      later(() => {
        phase = (cur + 1) % this.PHASES.length;
        runPhase();
      }, this.PHASES[cur].ms);
    };

    const start = () => {
      if (done || started) return;
      started = true;
      ball.classList.add('running'); // 球动画起动（CSS 默认 paused，点击后与文字节拍同步）
      startBtn.style.display = 'none';
      runPhase();
      later(finish, this.BREATH_MS); // 严格 30 秒上限：到点就渐隐收起
    };

    startBtn.addEventListener('click', start);
    skipBtn.addEventListener('click', finish);
  },

  // 连错检测：看最近作答结果（形如 {correct: true|false|null}，null=主观题不计）
  // 末尾起连续错 ≥3 → 返回宽心文案；中间的 null 跳过不打断连错，遇到答对即中断
  checkMeltdown(recentResults) {
    if (!Array.isArray(recentResults)) return null;
    let streak = 0;
    for (let i = recentResults.length - 1; i >= 0; i--) {
      const c = recentResults[i] ? recentResults[i].correct : undefined;
      if (c === false) {
        streak += 1;
        if (streak >= this.MELTDOWN_AT) return this.COMFORTS[Math.floor(Math.random() * this.COMFORTS.length)];
      } else if (c === true) {
        return null; // 连错被答对打断
      }
      // null / 主观题：不计，继续往前看
    }
    return null;
  },
};
