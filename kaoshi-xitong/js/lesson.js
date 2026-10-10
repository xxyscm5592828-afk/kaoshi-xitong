// 教学模块：微课卡六段式 + 自测关卡（强制）+ 换讲法
// 规则来源：开发文档 §8
const Lesson = {
  versions(kpId) { return Store.lessons[kpId] || []; },

  state(kpId) {
    return Store.lessonState[kpId] || { version: 1, checkPassed: false, passedVersion: null };
  },

  _saveState(kpId, st) {
    const all = Store.lessonState;
    all[kpId] = { ...st, lastAt: Date.now() }; // lastAt：今日套餐判定「今天看过微课」用
    Store.lessonState = all;
  },

  current(kpId) {
    const st = this.state(kpId);
    const vs = this.versions(kpId);
    return vs.find(v => v.version === st.version) || vs[0] || null;
  },

  // 换讲法：version+1 循环（自测不过时触发，换类比重讲）
  switchVersion(kpId) {
    const vs = this.versions(kpId);
    if (vs.length < 2) return this.current(kpId);
    const st = this.state(kpId);
    const next = (st.version % vs.length) + 1;
    this._saveState(kpId, { ...st, version: next, checkPassed: false });
    return this.current(kpId);
  },

  // 阶段 2：AI 生成新讲法入库（六律 §8.3）。返回新讲法；版本号 = 已有最大 +1，并直接切到新讲法
  addVersion(kpId, lesson) {
    const vs = this.versions(kpId) || [];
    const version = vs.reduce((m, v) => Math.max(m, v.version || 0), 0) + 1;
    const next = { ...lesson, version, readTime: 90 };
    const all = Store.lessons;
    all[kpId] = (all[kpId] || []).concat(next);
    Store.lessons = all;
    const st = this.state(kpId);
    this._saveState(kpId, { ...st, version, checkPassed: false });
    return next;
  },

  // 自测结果：全对才过关；过关记录是哪个讲法有效（越教越对症的依据）
  recordCheck(kpId, passed, now) {
    const st = this.state(kpId);
    const next = {
      ...st,
      checkPassed: passed,
      passedVersion: passed ? st.version : st.passedVersion,
      lastCheckAt: now || Date.now(),
    };
    this._saveState(kpId, next);
    return next;
  },

  // 渲染微课卡 + 自测关卡。onPassed()：自测全对（可接变式练习）
  render(kpId, el, onPassed) {
    const lesson = this.current(kpId);
    if (!lesson) { onPassed(null); return; }

    el.innerHTML = `
      <div class="card lesson-card">
        <div class="lesson-head">
          <h2>⚡ 90 秒微课</h2>
          <span class="muted">讲法 v${lesson.version} · 约 ${lesson.readTime}s</span>
        </div>
        <div class="seg"><span class="seg-tag">核心一句话</span>${lesson.oneLiner}</div>
        ${Illustrations.get(kpId) ? `<div class="lesson-illo">${Illustrations.get(kpId)}</div>` : ''}
        <div class="seg"><span class="seg-tag">它解决什么问题</span>${lesson.problem}</div>
        <div class="seg"><span class="seg-tag">类比</span>${lesson.analogy}</div>
        <div class="seg"><span class="seg-tag">例题</span>${lesson.example}</div>
        <div class="seg"><span class="seg-tag">常见的坑</span>
          <ul class="pitfalls">${lesson.pitfalls.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>
        <div class="lesson-actions">
          ${Speech.btnHTML('lesson')}
          <button class="btn" id="lesson-start-check">开始自测（2 题，全对才算学会）</button>
        </div>
      </div>`;

    // 整卡一次读完：核心一句话 → 它解决什么问题 → 类比 → 例题 → 常见的坑（插图与自测不读）
    Speech.wire(el, 'lesson', () => [
      `核心一句话。${lesson.oneLiner}`,
      `它解决什么问题。${lesson.problem}`,
      `类比。${lesson.analogy}`,
      `例题。${lesson.example}`,
      `常见的坑。${(lesson.pitfalls || []).join('；')}`,
    ].join(' '));

    el.querySelector('#lesson-start-check').addEventListener('click', () => {
      this.renderCheck(kpId, el, onPassed);
    });
  },

  // 自测关卡：逐题作答，全对 → onPassed()；有错 → 换讲法 / 再试一次
  renderCheck(kpId, el, onPassed) {
    const lesson = this.current(kpId);
    const check = lesson.check || [];
    if (check.length === 0) { this.recordCheck(kpId, true); onPassed(true); return; }

    let idx = 0;
    const wrongList = [];
    const renderOne = () => {
      const item = check[idx];
      el.innerHTML = `
        <div class="card lesson-card">
          <div class="lesson-head">
            <h2>自测 ${idx + 1}/${check.length}</h2>
            <span class="muted">微课 v${lesson.version}</span>
          </div>
          <div class="stem">${item.stem}</div>
          <div class="options">${item.options.map((o, i) =>
            `<button class="option" data-idx="${i}">${o}</button>`).join('')}</div>
          <div class="lesson-actions">
            <button class="btn" id="check-submit" disabled>确认</button>
          </div>
        </div>`;

      let picked = null;
      el.querySelectorAll('.option').forEach(o => o.addEventListener('click', () => {
        picked = Number(o.dataset.idx);
        el.querySelectorAll('.option').forEach(oo => oo.classList.toggle('selected', Number(oo.dataset.idx) === picked));
        el.querySelector('#check-submit').disabled = false;
      }));

      el.querySelector('#check-submit').addEventListener('click', () => {
        if (picked === null) return;
        const ok = picked === Number(item.answer);
        el.querySelectorAll('.option').forEach(o => {
          o.disabled = true;
          if (Number(o.dataset.idx) === Number(item.answer)) o.classList.add('correct');
          else if (Number(o.dataset.idx) === picked) o.classList.add('wrong');
        });
        if (!ok) wrongList.push(idx);
        setTimeout(() => {
          idx += 1;
          if (idx < check.length) renderOne();
          else finishCheck();
        }, 700);
      });
    };

    const finishCheck = () => {
      const passed = wrongList.length === 0;
      this.recordCheck(kpId, passed);
      const vs = this.versions(kpId);
      el.innerHTML = `
        <div class="card lesson-card">
          <h2>${passed ? '自测全对，这关过了' : '还差一点'}</h2>
          <p class="muted">${passed
            ? '讲法对上电波了。现在趁热来一道变式题。'
            : `错了 ${wrongList.length} 题，不慌——换个讲法再讲一遍，这次保证你能懂。`}</p>
          <div class="lesson-actions">
            ${passed ? '' : `<button class="btn" id="lesson-switch">换个讲法（${vs.length > 1 ? 'v' + ((Lesson.state(kpId).version % vs.length) + 1) : '同一讲法再过一遍'}）</button>`}
            ${passed ? '' : `<button class="btn secondary" id="lesson-retry">不换，再试一次</button>`}
          </div>
        </div>`;
      if (passed) {
        setTimeout(() => onPassed(true), 900);
      } else {
        el.querySelector('#lesson-switch').addEventListener('click', () => {
          this.switchVersion(kpId);
          this.render(kpId, el, onPassed);
        });
        el.querySelector('#lesson-retry').addEventListener('click', () => {
          this.render(kpId, el, onPassed);
        });
      }
    };

    renderOne();
  },
};
