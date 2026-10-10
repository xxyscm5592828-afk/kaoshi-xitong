// 出卷：按练习数据生成可打印的纸质练习卷（弱项 / 错题 / 随机 × 各科 / 综合）
// 入口在「学习工具」目录；打印复用 Report.openPrint + #print-area 的 .pr-doc 打印样式
const Paper = {
  // 出卷配置（内存态）：subjectId 为空表示综合（跨全部科目）
  state: { subjectId: '', source: 'weak', count: 12, withAnswer: false, _recording: false },
  _items: [], // 当前这批抽中的题目（打印与预览共用同一批）

  TYPE_NAME: { single: '单选', judge: '判断', multi: '多选', fill: '填空', subjective: '主观' },
  LETTERS: 'ABCDEFG',

  _shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // 选题：source = weak（弱项知识点）/ wrong（尚未销号的错题）/ random（随机）
  // 题池不足时用该范围内的其它题补足；返回至多 count 道去重题目
  pick(cfg, now) {
    const inScope = q => !cfg.subjectId || q.subjectId === cfg.subjectId;
    const all = Store.questions.filter(inScope);
    let picked = [];

    if (cfg.source === 'wrong') {
      const qIdx = Store.questionIndex();
      const recs = (Store.wrongbook || []).filter(r => r.status !== '已销号' && (!cfg.subjectId || r.subjectId === cfg.subjectId));
      picked = this._shuffle(recs.map(r => qIdx[r.questionId]).filter(q => q && inScope(q)));
    } else if (cfg.source === 'weak') {
      // 掌握度 < 85 的 L4 知识点，分数低者优先；各点题池轮询交错，保证覆盖多个弱点
      const weak = Store.knowledgePoints
        .filter(k => k.level === 4 && (!cfg.subjectId || k.subjectId === cfg.subjectId))
        .map(k => ({ id: k.id, eff: Mastery.decay(Store.mastery[k.id] || Mastery.default(), now).score }))
        .filter(x => x.eff < 85)
        .sort((a, b) => a.eff - b.eff);
      const pools = weak.map(x => this._shuffle(Store.questions.filter(q => q.knowledgePointId === x.id)));
      for (let round = 0; pools.some(p => p[round]); round++) {
        for (const p of pools) if (p[round]) picked.push(p[round]);
      }
    } else {
      picked = this._shuffle(all);
    }

    const uniq = [];
    const seen = new Set();
    for (const q of picked) {
      if (q && !seen.has(q.id)) { seen.add(q.id); uniq.push(q); }
    }
    if (uniq.length < cfg.count) {
      for (const q of this._shuffle(all)) {
        if (uniq.length >= cfg.count) break;
        if (!seen.has(q.id)) { seen.add(q.id); uniq.push(q); }
      }
    }
    return uniq.slice(0, cfg.count);
  },

  // 答案展示（选择/判断带选项字母；多选逐项；其余原样）
  _ans(q) {
    const L = this.LETTERS;
    if ((q.type === 'single' || q.type === 'judge') && q.options) {
      const i = Number(q.answer);
      return q.options[i] != null ? `${L[i]}. ${q.options[i]}` : String(q.answer);
    }
    if (q.type === 'multi' && q.options) {
      return (Array.isArray(q.answer) ? q.answer : [q.answer])
        .map(i => (q.options[Number(i)] != null ? `${L[Number(i)]}. ${q.options[Number(i)]}` : String(i))).join('　');
    }
    return String(q.answer == null || q.answer === '' ? '（略）' : q.answer);
  },

  // 券面 HTML（打印内容）：卷头 + 题目 + 可选答案页
  renderHTML(items, cfg, now) {
    const subjName = cfg.subjectId ? (Store.subjects.find(s => s.id === cfg.subjectId) || {}).name : '综合';
    const showSubj = !cfg.subjectId; // 综合卷每题标注科目
    const srcLine = cfg.source === 'wrong'
      ? '题目来自孩子尚未销号的错题。'
      : cfg.source === 'weak' ? '题目来自孩子当前偏弱的知识点。' : '题目为随机抽取。';

    const body = items.map((q, i) => {
      const sub = Store.subjects.find(s => s.id === q.subjectId);
      const tag = showSubj && sub ? `${sub.name} · ` : '';
      const opts = (q.options && q.options.length)
        ? `<div class="pr-opts">${q.options.map((o, j) => `<div class="pr-opt">${this.LETTERS[j]}. ${o}</div>`).join('')}</div>`
        : '';
      const work = q.type === 'subjective'
        ? '<div class="pr-lines"><span></span><span></span><span></span></div>'
        : '<div class="pr-line"></div>';
      return `<div class="pr-q">
        <div class="pr-q-head">${i + 1}. ［${tag}${kpName(q.knowledgePointId)}］（${this.TYPE_NAME[q.type] || q.type}）</div>
        <div>${q.stem}</div>
        ${opts}
        ${work}
      </div>`;
    }).join('');

    const ansPage = cfg.withAnswer
      ? `<div class="pr-answer-page">
          <h2>参考答案与解析</h2>
          ${items.map((q, i) => `<div class="pr-q">
            <div class="pr-q-head">${i + 1}. ${this._ans(q)}</div>
            ${q.explanation ? `<div>解析：${q.explanation}</div>` : ''}
          </div>`).join('')}
        </div>`
      : '';

    return `
      <div class="pr-doc">
        <h1>开挂补习系统（初二、初三） · ${subjName}练习卷</h1>
        <p class="pr-range">出卷日期：${Store.todayKey(now)}　姓名：____________　班级：__________　得分：________</p>
        <p class="pr-note">共 ${items.length} 题。${srcLine}先独立完成，再对照答案订正。</p>
        ${body}
        ${ansPage}
        <p class="pr-foot">本卷由系统根据练习数据自动生成。</p>
      </div>`;
  },

  print() {
    if (!this._items.length) { alert('这一范围内暂时没有可出的题，换个范围或题源试试。'); return; }
    Report.openPrint(this.renderHTML(this._items, this.state, Date.now()));
  },

  // 「学习工具」页里的交互面板（配置 → 预览 → 打印）
  render(el, back) {
    const st = this.state;
    const now = Date.now();
    this._items = this.pick({ subjectId: st.subjectId, source: st.source, count: st.count }, now);

    const ranges = [{ id: '', name: '综合' }].concat(Store.subjects.map(s => ({ id: s.id, name: s.name })));
    const sources = [{ k: 'weak', n: '弱项' }, { k: 'wrong', n: '错题' }, { k: 'random', n: '随机出题' }];
    const counts = [8, 12, 16];
    const subjName = st.subjectId ? (Store.subjects.find(s => s.id === st.subjectId) || {}).name : '综合';
    const srcName = (sources.find(s => s.k === st.source) || {}).n;

    const list = this._items.map((q, i) => {
      const sub = Store.subjects.find(s => s.id === q.subjectId);
      return `<div class="paper-row"><span class="paper-no">${i + 1}</span><span class="muted">${sub ? sub.name : ''} · ${kpName(q.knowledgePointId)}</span><span class="paper-type">${this.TYPE_NAME[q.type] || q.type}</span></div>`;
    }).join('');

    el.innerHTML = `
      <div class="card">
        <div class="learn-head"><h2>📝 出一份练习卷</h2><button class="btn secondary small" id="paper-back">← 回工具目录</button></div>
        <p class="muted">按孩子的练习数据出一份可打印的练习卷：选范围、选题源、题量，点「打印」即可（黑白打印友好）。</p>
        <div class="field"><label>范围</label><div class="subject-bar">
          ${ranges.map(r => `<button class="subject-chip${st.subjectId === r.id ? ' active' : ''}" data-range="${r.id}">${r.name}</button>`).join('')}
        </div></div>
        <div class="field"><label>题源</label><div class="subject-bar">
          ${sources.map(s => `<button class="subject-chip${st.source === s.k ? ' active' : ''}" data-source="${s.k}">${s.n}</button>`).join('')}
        </div></div>
        <div class="field"><label>题量</label><div class="subject-bar">
          ${counts.map(c => `<button class="subject-chip${st.count === c ? ' active' : ''}" data-count="${c}">${c} 题</button>`).join('')}
        </div></div>
        <label class="paper-check"><input type="checkbox" id="paper-ans"${st.withAnswer ? ' checked' : ''}> 附参考答案与解析（打印时另起一页）</label>
        <div class="session-actions">
          <button class="btn glow" id="paper-quiz">⏱ 15 分钟限时小测</button>
          ${[0, 6].includes(new Date(now).getDay()) ? '<button class="btn secondary" id="paper-mock">📚 整卷模拟（60 分钟）</button>' : ''}
          <button class="btn" id="paper-print">🖨️ 打印这份卷子</button>
          <button class="btn secondary" id="paper-reroll">🔄 换一批</button>
          <button class="btn secondary" id="paper-record">📝 做完了？录错题</button>
        </div>
        <p class="muted">本次：${subjName} · ${srcName} · ${this._items.length} 题${this._items.length === 0 ? '（暂无可用题目，换个范围或题源试试）' : ''}</p>
        <div class="paper-list">${list}</div>
        ${st._recording ? this._recordHTML() : ''}
      </div>`;

    el.querySelector('#paper-back').addEventListener('click', back);
    el.querySelectorAll('[data-range]').forEach(b => b.addEventListener('click', () => { st.subjectId = b.dataset.range; this.render(el, back); }));
    el.querySelectorAll('[data-source]').forEach(b => b.addEventListener('click', () => { st.source = b.dataset.source; this.render(el, back); }));
    el.querySelectorAll('[data-count]').forEach(b => b.addEventListener('click', () => { st.count = Number(b.dataset.count); this.render(el, back); }));
    el.querySelector('#paper-ans').addEventListener('change', e => { st.withAnswer = e.target.checked; });
    const quizBtn = el.querySelector('#paper-quiz');
    if (quizBtn) quizBtn.addEventListener('click', () => this.renderQuiz(el, back, { minutes: 15, count: 8, title: '⏱ 15 分钟限时小测' }));
    const mockBtn = el.querySelector('#paper-mock');
    if (mockBtn) mockBtn.addEventListener('click', () => this.renderQuiz(el, back, { minutes: 60, count: 16, title: '📚 整卷模拟' }));
    el.querySelector('#paper-print').addEventListener('click', () => this.print());
    el.querySelector('#paper-reroll').addEventListener('click', () => this.render(el, back));
    const recBtn = el.querySelector('#paper-record');
    if (recBtn) recBtn.addEventListener('click', () => { st._recording = !st._recording; this.render(el, back); });
    this._bindRecord(el, back);
  },

  // 纸卷回录：孩子做完纸质卷，把做错的题勾上 → 进入错题本走销号闭环（D0 起点，与线上答错同待遇）
  _recordHTML() {
    const rows = this._items.map((q, i) => `<label class="paper-check"><input type="checkbox" data-rec="${i}"> ${i + 1}. ${kpName(q.knowledgePointId)}（${this.TYPE_NAME[q.type] || q.type}）</label>`).join('');
    return `<div class="field" style="margin-top:14px"><label>📝 纸卷回录（勾选做错的题）</label>
      <p class="muted" style="margin:4px 0 8px">对完答案后，把孩子做错的题勾上，录入错题本——照常走「自选错因 → 重做 → 变式」销号流程。</p>
      ${rows}
      <div class="session-actions">
        <button class="btn" id="paper-rec-save">✓ 录入错题本</button>
        <button class="btn secondary" id="paper-rec-cancel">收起</button>
      </div>
    </div>`;
  },

  _bindRecord(el, back) {
    const save = el.querySelector('#paper-rec-save');
    if (!save) return;
    save.addEventListener('click', () => {
      const idxs = Array.from(el.querySelectorAll('[data-rec]:checked')).map(c => Number(c.dataset.rec));
      if (!idxs.length) { alert('没勾任何题——要是全对了就直接收起，厉害！'); return; }
      const now = Date.now();
      for (const i of idxs) {
        const q = this._items[i];
        if (q) Wrongbook.onWrong(q, '（纸卷作答）', now);
      }
      this.state._recording = false;
      alert(`已录入 ${idxs.length} 道错题，去「错题榜」继续处理吧。`);
      this.render(el, back);
    });
    el.querySelector('#paper-rec-cancel').addEventListener('click', () => { this.state._recording = false; this.render(el, back); });
  },

  // ===== 限时小测（平时 15 分钟）/ 整卷模拟（假期 60 分钟）：屏幕作答，到点自动交卷 =====
  // 只抽能自动判分的客观题；做错自动进错题本（与线上答错同待遇），未做的标红但不录入
  renderQuiz(el, back, opts) {
    const now = Date.now();
    const items = this.pick({ subjectId: this.state.subjectId, source: this.state.source, count: opts.count }, now)
      .filter(q => q.type !== 'subjective');
    if (!items.length) { alert('这一范围内暂时没有可出的客观题，换个范围或题源试试。'); return; }
    const answers = {};
    this.quiz = { items, answers, deadline: now + opts.minutes * 60000, timer: null };

    const qHTML = (q, i) => {
      const body = (q.options && q.options.length)
        ? `<div class="options">${q.options.map((o, j) =>
            `<button class="option" data-q="${i}" data-idx="${j}">${this.LETTERS[j]}. ${o}</button>`).join('')}</div>`
        : `<input class="fill-input" data-q="${i}" placeholder="输入答案" autocomplete="off">`;
      return `<div class="seg">
        <div class="quiz-meta">${i + 1}. ［${kpName(q.knowledgePointId)}］（${this.TYPE_NAME[q.type] || q.type}）</div>
        <div class="stem">${q.stem}</div>
        ${body}
      </div>`;
    };

    el.innerHTML = `
      <div class="card">
        <div class="learn-head"><h2>${opts.title}</h2><button class="btn secondary small" id="quiz-quit">← 回工具目录</button></div>
        <p class="muted">到点自动交卷，没做的题会标红。做完可以提前交卷。</p>
        <div class="game-timer" id="quiz-timer">${opts.minutes}:00</div>
        ${items.map(qHTML).join('')}
        <div class="quiz-actions">
          <button class="btn big glow" id="quiz-submit">交卷</button>
        </div>
      </div>`;

    el.querySelector('#quiz-quit').addEventListener('click', () => {
      if (!confirm('退出小测？这次作答不保存。')) return;
      clearInterval(this.quiz.timer);
      this.quiz = null;
      back();
    });
    el.querySelectorAll('.option').forEach(b => b.addEventListener('click', () => {
      const i = Number(b.dataset.q), j = Number(b.dataset.idx);
      const q = items[i];
      if (q.type === 'multi') {
        const cur = new Set(answers[i] || []);
        if (cur.has(j)) cur.delete(j); else cur.add(j);
        answers[i] = Array.from(cur).sort((x, y) => x - y);
        b.classList.toggle('selected');
      } else {
        answers[i] = j;
        el.querySelectorAll(`.option[data-q="${i}"]`).forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
      }
    }));
    el.querySelectorAll('.fill-input').forEach(inp => inp.addEventListener('input', () => {
      answers[Number(inp.dataset.q)] = inp.value;
    }));
    el.querySelector('#quiz-submit').addEventListener('click', () => {
      if (!confirm('现在交卷吗？')) return;
      this.gradeQuiz(el, back, opts, false);
    });
    // 倒计时：到点自动交卷
    this.quiz.timer = setInterval(() => {
      const left = Math.max(0, this.quiz.deadline - Date.now());
      const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
      const tEl = el.querySelector('#quiz-timer');
      if (tEl) tEl.textContent = `${mm}:${String(ss).padStart(2, '0')}`;
      if (left <= 0) this.gradeQuiz(el, back, opts, true);
    }, 1000);
  },

  // 交卷结算：得分 + 逐题对错，未做的标红；做错的自动进错题本走销号闭环
  gradeQuiz(el, back, opts, auto) {
    const st = this.quiz;
    if (!st) return;
    clearInterval(st.timer);
    this.quiz = null;
    if (typeof Sound !== 'undefined') Sound.play('done');
    const { items, answers } = st;
    let right = 0, blank = 0, wrong = 0;
    const rows = items.map((q, i) => {
      const a = answers[i];
      const unanswered = a === undefined || a === '' || (Array.isArray(a) && a.length === 0);
      const ok = unanswered ? false : Quiz.grade(q, a);
      const tag = unanswered ? '<span class="chip chip-bad">未做</span>'
        : ok === true ? '<span class="chip chip-blue">✔ 对</span>'
        : '<span class="chip chip-bad">✘ 错</span>';
      if (ok === true) right += 1;
      else if (unanswered) blank += 1;
      else { wrong += 1; Wrongbook.onWrong(q, '（限时小测）', Date.now()); }
      return `<div class="paper-row">${tag}<span class="muted">${i + 1}. ${kpName(q.knowledgePointId)}</span>
        ${ok === true ? '' : `<span class="muted">正解：${this._ans(q)}</span>`}</div>`;
    }).join('');

    el.innerHTML = `
      <div class="card">
        <div class="learn-head"><h2>${opts.title} · ${auto ? '⏰ 时间到，自动交卷' : '已交卷'}</h2></div>
        <div class="game-timer">${right}/${items.length}</div>
        <p class="muted">${wrong ? `做错的 ${wrong} 道已录入错题本，照常走销号流程。` : ''}${blank ? `${blank} 道没来得及做（已标红）——下次掐着时间练手速。` : ''}${!wrong && !blank ? '全对，稳！' : ''}</p>
        <div class="paper-list">${rows}</div>
        <div class="quiz-actions">
          <button class="btn" id="quiz-again">🔄 再来一次</button>
          <button class="btn secondary" id="quiz-back">← 回工具目录</button>
        </div>
      </div>`;
    el.querySelector('#quiz-again').addEventListener('click', () => this.renderQuiz(el, back, opts));
    el.querySelector('#quiz-back').addEventListener('click', back);
  },
};
