// 主控 v2：路由 + 关卡化练习流 UI + 错因自选（先归因再解析）+ 微课嵌入 + 悬赏榜 + 设置
// 规则来源：开发文档 §7 §8 §10 §11（计时器隐身、归因语言、翻译不贴皮）
const ERROR_TYPES = [
  { key: '概念', label: '概念没吃透', hint: '知识点本身没理解' },
  { key: '程序', label: '步骤乱了', hint: '思路对，做错步骤' },
  { key: '审题', label: '题看岔了', hint: '漏条件、看错数字' },
  { key: '计算', label: '算失误了', hint: '思路对，计算出错' },
];

// 答疑异常时的中文降级话术（设计文档 §8）：绝不给孩子看空白或英文报错
const AI_MSG = {
  noKey: '学长还没上线——去「设置」里填一下 AI Key 就能问他了。',
  quota: '今天问学长的次数用完了，先去把题重做一遍。',
  truncated: '学长想太久了，没说完。再点一次试试。',
  badKey: 'Key 好像不对，去「设置」里检查一下。',
  rateLimited: '学长正忙，先看上面的解析。',
  timeout: '网有点慢，再点一次试试。',
  network: '网好像断了，先看上面的解析。',
  http: '学长开小差了，先看上面的解析。',
};

const App = {
  view: 'practice',
  session: null,
  stage: null,
  question: null,
  startAt: 0,
  answered: false,
  el: null,
  planSalt: 0,      // 「换个组合」的换批盐值
  planDone: [],     // 今日计划里已练完的科目（内存态）
  scopeOpen: false, // 主页自选科目/单元区折叠态（内存态，刷新即收起）
  dailyPlan: null,
  learnKpId: null,  // 学习页当前知识点（从技能树点进来）
  _prevActiveAt: 0,     // 上次活跃时间戳（召回触发用）
  proactiveShown: false, // 本次会话是否已发主动消息（触发点在结算页）

  init() {
    Store.init(SEED);
    // 阶段 3 §13.4：超 90 天作答明细聚合归档 + 赛季快照（都在打开时幂等触发）
    Store.archiveOldAttempts(Date.now());
    Scheduler.recordSeason(Date.now());
    this._loadPlanProgress();
    // 记上次活跃（召回触发判定）后再刷新为本次打开时间
    this._prevActiveAt = Store.settings.lastActiveAt || 0;
    Store.settings = { ...Store.settings, lastActiveAt: Date.now() };
    if (!Store.activeSubjectId) {
      const def = Store.subjects.find(s => s.default) || Store.subjects[0];
      if (def) Store.activeSubjectId = def.id;
    }
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => this.show(btn.dataset.view));
    });
    this.show('practice');
  },

  // 今日计划进度（换了批次 / 已练完的科目）按日期存；跨天自动清零（计划本就是按天算的）
  _loadPlanProgress() {
    const p = Store.planProgress || {};
    const today = Store.todayKey(Date.now());
    this.planSalt = p.dateKey === today ? (p.salt || 0) : 0;
    this.planDone = p.dateKey === today ? (p.done || []) : [];
  },

  _savePlanProgress() {
    Store.planProgress = { dateKey: Store.todayKey(Date.now()), salt: this.planSalt, done: this.planDone };
  },

  // 进行中题组存盘（ISSUE-006）：刷新/误关页面后能从当前这题接着练；跨天自动作废
  _saveSession() {
    if (!this.session) return;
    Store.session = {
      dateKey: Store.todayKey(Date.now()),
      subjectId: Store.activeSubjectId,
      session: this.session,
    };
  },

  _loadSession() {
    const saved = Store.session;
    if (!saved || saved.dateKey !== Store.todayKey(Date.now())) return null;
    const s = saved.session;
    if (!s || !Array.isArray(s.stages)) return null;
    // 答题后在反馈页刷新：这一关已作答但 idx 未推进，恢复时对齐到下一关，别让同一题再答一遍
    if (s.results.length > s.idx) s.idx = s.results.length;
    if (s.idx >= s.stages.length) return null;
    return saved;
  },

  _clearSession() {
    Store.session = null;
  },

  show(view) {
    this._clearGameTimer(); // 切视图即放弃进行中的小游戏，别把没玩的局结算成掌握度
    this.view = view;
    this.el = document.getElementById('view');
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    if (view === 'tools') this._toolDetail = null; // 从导航进工具页一律回目录
    window.scrollTo(0, 0);
    if (view === 'practice') this.renderPractice(this.el);
    else if (view === 'report') { Report.render(this.el); this.renderWeeklyAI(this.el.querySelector('#weekly-ai-slot')); this.renderMonthlyReview(this.el.querySelector('#monthly-review-btn')); }
    else if (view === 'learn') this.renderLearn(this.el);
    else if (view === 'wrongbook') this.renderWrongbook(this.el);
    else if (view === 'assistant') this.renderAssistant(this.el);
    else if (view === 'tools') this.renderTools(this.el);
    else if (view === 'settings') this.renderSettings(this.el);
  },

  pick(list) { return list[Math.floor(Math.random() * list.length)]; },

  kpName(id) { const k = Store.kpIndex()[id]; return k ? k.name : ''; },

  dueText(ts) {
    if (!ts) return '';
    const d = Math.ceil((ts - Date.now()) / 86400000);
    return d <= 0 ? '今天到期' : `${d} 天后`;
  },

  // ================= 科目：当前科 + 切换条 =================
  activeSubject() {
    return Store.subjects.find(s => s.id === Store.activeSubjectId)
      || Store.subjects.find(s => s.default) || Store.subjects[0] || null;
  },

  subjectBar() {
    const cur = this.activeSubject();
    return `<div class="subject-bar">${Store.subjects.map(s => `
      <button class="subject-chip${cur && s.id === cur.id ? ' active' : ''}" data-subject="${s.id}">${s.name}${s.exam ? '<em>会考</em>' : ''}</button>`).join('')}</div>`;
  },

  bindSubjectBar(el, rerender) {
    el.querySelectorAll('[data-subject]').forEach(btn => {
      btn.addEventListener('click', () => {
        Store.activeSubjectId = btn.dataset.subject;
        rerender();
      });
    });
  },

  // ================= 单元范围（§需求2）：先选册再选章再选节，默认不限，选了才限制出题 =================
  unitScopeFor(sid) {
    const cur = Store.unitScope[sid] || {};
    return { bookId: cur.bookId || '', chapterId: cur.chapterId || '', sectionId: cur.sectionId || '' };
  },

  setUnitScope(sid, bookId, chapterId, sectionId) {
    const all = Store.unitScope;
    all[sid] = { bookId: bookId || '', chapterId: chapterId || '', sectionId: sectionId || '' };
    Store.unitScope = all;
  },

  unitBar(sid) {
    const kps = Store.knowledgePoints.filter(k => k.subjectId === sid);
    const books = kps.filter(k => k.level === 1).sort((a, b) => a.order - b.order);
    if (books.length === 0) return '';
    const cur = this.unitScopeFor(sid);
    const bookChips = `<button class="subject-chip${cur.bookId ? '' : ' active'}" data-unit-book="">全科不限</button>`
      + books.map(b => `<button class="subject-chip${cur.bookId === b.id ? ' active' : ''}" data-unit-book="${b.id}">${b.name}</button>`).join('');
    const chapters = cur.bookId
      ? kps.filter(k => k.level === 2 && k.parentId === cur.bookId).sort((a, b) => a.order - b.order)
      : [];
    const chapterChips = chapters.map(c =>
      `<button class="subject-chip${cur.chapterId === c.id ? ' active' : ''}" data-unit-chapter="${c.id}">${c.name}</button>`).join('');
    const sections = cur.chapterId
      ? kps.filter(k => k.level === 3 && k.parentId === cur.chapterId).sort((a, b) => a.order - b.order)
      : [];
    const sectionChips = sections.map(s =>
      `<button class="subject-chip${cur.sectionId === s.id ? ' active' : ''}" data-unit-section="${s.id}">${s.name}</button>`).join('');
    const bName = (books.find(b => b.id === cur.bookId) || {}).name || '';
    const cName = (chapters.find(c => c.id === cur.chapterId) || {}).name || '';
    const sName = (sections.find(s => s.id === cur.sectionId) || {}).name || '';
    const note = cur.bookId
      ? `出题范围：${bName}${cName ? ' · ' + cName : '（整册）'}${sName ? ' · ' + sName : ''}；范围内题不够一组（6 题）时，学长会按真题风格现场补几道（需 AI Key）。`
      : '默认整科出题；选了册、单元、节，就只出这个范围以内的知识点；范围内题不够一组（6 题）时，学长会按真题风格现场补几道（需 AI Key）。';
    return `
      <div class="unit-picker">
        <div class="unit-row"><span class="unit-label">学到哪本</span>${bookChips}</div>
        ${chapters.length > 0 ? `<div class="unit-row"><span class="unit-label">学到哪单元</span>
          <button class="subject-chip${cur.chapterId ? '' : ' active'}" data-unit-chapter="">整册</button>${chapterChips}</div>` : ''}
        ${sections.length > 0 ? `<div class="unit-row"><span class="unit-label">学到哪节</span>
          <button class="subject-chip${cur.sectionId ? '' : ' active'}" data-unit-section="">整章</button>${sectionChips}</div>` : ''}
        <div class="unit-note muted">${note}</div>
      </div>`;
  },

  bindUnitBar(el, sid, rerender) {
    el.querySelectorAll('[data-unit-book]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setUnitScope(sid, btn.dataset.unitBook, '');
        rerender();
      });
    });
    el.querySelectorAll('[data-unit-chapter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setUnitScope(sid, this.unitScopeFor(sid).bookId, btn.dataset.unitChapter);
        rerender();
      });
    });
    el.querySelectorAll('[data-unit-section]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cur = this.unitScopeFor(sid);
        this.setUnitScope(sid, cur.bookId, cur.chapterId, btn.dataset.unitSection);
        rerender();
      });
    });
  },

  // 需求6：选了范围后，范围内题目不够一组（6 题）时，学长按真题风格现场补足（§需求3 生成能力的复用）
  // 生成结果经 Store.addQuestion 入库并持久化，是一次性的：补过就不再补
  // 同一 L4 的多道题合并成一次调用（一次 AI.chat 只扣 1 次额度），能少花就少花
  // 无 Key / 超额 / 生成失败一律静默跳过（返回已补题数），不阻塞开练
  async ensureScopeQuestions(need, onProgress) {
    if (!AI.hasKey()) return 0;
    const scopeIds = Quiz.unitKpIds();
    if (!scopeIds || scopeIds.size === 0) return 0;

    // 范围内现有题数 + 每个 L4 的种子题（genRealBatch 必须以一道现成题为蓝本，沿用其题型/难度）
    const counts = {};
    const seeds = {};
    let have = 0;
    Store.questions.forEach(q => {
      if (!scopeIds.has(q.knowledgePointId)) return;
      have += 1;
      counts[q.knowledgePointId] = (counts[q.knowledgePointId] || 0) + 1;
      if (!seeds[q.knowledgePointId]) seeds[q.knowledgePointId] = q;
    });
    const deficit = Math.max(0, need - have);
    const candidates = Object.keys(seeds);
    if (deficit === 0 || candidates.length === 0) return 0;

    // 先离线排布这批题分别挂哪个 L4：挑现有题最少的 L4 依次填，补完各组尽量均衡
    const plan = {};
    for (let i = 0; i < deficit; i += 1) {
      let targetKp = '';
      let min = Infinity;
      candidates.forEach(kpId => {
        const n = counts[kpId] || 0;
        if (n < min) { min = n; targetKp = kpId; }
      });
      plan[targetKp] = (plan[targetKp] || 0) + 1;
      counts[targetKp] = (counts[targetKp] || 0) + 1;
    }

    const groups = Object.keys(plan);
    let added = 0;
    for (let gi = 0; gi < groups.length; gi += 1) {
      const kpId = groups[gi];
      if (onProgress) onProgress(gi + 1, groups.length);
      const res = await Assistant.genRealBatch(seeds[kpId], Store.kpIndex()[kpId], plan[kpId]);
      if (!res.ok) break;
      res.questions.forEach(q => {
        if (Store.addQuestion(Object.assign({ knowledgePointId: kpId }, q)).ok) added += 1;
      });
    }
    return added;
  },

  // ================= 学习页：诊断 → 微课 → 例题精讲 → 学完就练 =================
  // 辅导主入口（从技能树点进来）：先看清现状，再学（微课/例题），学完就练一组专项
  openLearn(kpId) {
    this.learnKpId = kpId;
    this.show('learn');
  },

  // 例题精讲的答案展示（选项题显示选项文本，其余显示参考答案）
  exampleAnswer(q) {
    if ((q.type === 'single' || q.type === 'judge') && q.options) return q.options[Number(q.answer)];
    if (q.type === 'multi') return (Array.isArray(q.answer) ? q.answer : [q.answer]).map(i => q.options[Number(i)]).join('　');
    return q.answer;
  },

  renderLearn(el) {
    const kp = Store.kpIndex()[this.learnKpId];
    if (!kp || kp.level !== 4) return this.show('report');
    const now = Date.now();
    const m = Store.mastery[kp.id] || null;
    const eff = Report.effective(m, now);
    const tier = Report.tier(eff);
    const gap = Math.max(0, 85 - Math.round(eff));
    const subj = Store.subjects.find(s => s.id === kp.subjectId);
    const pool = Store.questions.filter(q => q.knowledgePointId === kp.id);
    const hasLesson = Lesson.versions(kp.id).length > 0;
    const examples = pool.filter(q => q.explanation).slice(0, 2);
    const focusCount = Math.min(4, pool.length);

    el.innerHTML = `
      <div class="card learn-hero">
        <div class="learn-head">
          <h2>${tier.icon} ${kp.name}</h2>
          <button class="btn secondary small" id="back-report">← 回技能树</button>
        </div>
        <div class="muted">${subj ? subj.name : ''} · ${this.bankKpPath(kp)}</div>
        <div class="exp-bar big"><div class="exp-fill" style="width:${Math.round(eff)}%"></div></div>
        <p class="muted">${tier.label} · 掌握度 ${Math.round(eff)}——${tier.key === 'lit' ? '已点亮，来保养一下，别让它生锈' : `差 ${gap}% 点亮，学完下面的再练一组就稳了`}。</p>
      </div>
      ${this.diagCardHTML(kp)}
      ${hasLesson ? '<div id="lesson-zone"></div>' : ''}
      ${AI.hasKey() ? `<div class="card">
        <h2>🔄 ${hasLesson ? '换个讲法' : 'AI 微课'}</h2>
        <p class="muted">${hasLesson ? '这个讲法没听进去？让「' + Assistant.name() + '」换个角度重讲一遍（守六律）。' : '这里还没有微课——让「' + Assistant.name() + '」按六律现场写一篇。'}</p>
        <div class="session-actions"><button class="btn secondary" id="ai-lesson">${hasLesson ? 'AI 生成新讲法' : 'AI 生成微课'}</button></div>
        <div id="ai-lesson-status"></div>
      </div>` : ''}
      <div class="card">
        <h2>📖 例题精讲</h2>
        ${examples.length === 0
          ? '<div class="empty">这个知识点还没有带讲解的例题。</div>'
          : examples.map((q, i) => `
        <div class="example-item">
          <div class="stem">${q.stem}</div>
          ${q.options ? `<div class="example-opts">${q.options.map(o => `<div class="example-opt">${o}</div>`).join('')}</div>` : ''}
          <button class="btn secondary small" data-reveal="${i}">看讲解</button>
          <div class="example-explain" id="explain-${i}" hidden>
            <div><strong>答案：</strong>${this.exampleAnswer(q)}</div>
            <div class="muted" style="margin-top:6px">${q.explanation}</div>
          </div>
        </div>`).join('')}
      </div>
      <div class="card">
        <h2>⚔️ 学完就练</h2>
        <p class="muted">针对「${kp.name}」来一组专项：先攻本点（${focusCount} 题），再用同科重点交错巩固，最后 1 题必对收尾。刚学的东西马上用出来，才记得牢。</p>
        <div class="session-actions">
          <button class="btn big glow" id="focus-start" ${pool.length === 0 ? 'disabled' : ''}>开练 →</button>
        </div>
      </div>`;

    el.querySelector('#back-report').addEventListener('click', () => this.show('report'));
    el.querySelectorAll('[data-reveal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const box = el.querySelector('#explain-' + btn.dataset.reveal);
        box.hidden = !box.hidden;
        btn.textContent = box.hidden ? '看讲解' : '收起讲解';
      });
    });
    const focusBtn = el.querySelector('#focus-start');
    if (!focusBtn.disabled) focusBtn.addEventListener('click', () => this.startFocus(kp.id, el));
    // 微课自测全对 → 直接进专项练（学完就练的微循环）
    if (hasLesson) Lesson.render(kp.id, el.querySelector('#lesson-zone'), () => this.startFocus(kp.id, el));
    // 微课 AI 换讲法（阶段 2 §8.3）：现场按六律生成新讲法入库并直接切过去
    const aiLessonBtn = el.querySelector('#ai-lesson');
    if (aiLessonBtn) aiLessonBtn.addEventListener('click', async () => {
      aiLessonBtn.disabled = true;
      aiLessonBtn.textContent = '生成中…';
      const status = el.querySelector('#ai-lesson-status');
      if (status) status.innerHTML = '';
      const res = await Assistant.genLesson(kp);
      aiLessonBtn.disabled = false;
      if (!res.ok) {
        aiLessonBtn.textContent = hasLesson ? 'AI 生成新讲法' : 'AI 生成微课';
        if (status) status.innerHTML = `<div class="muted">${AI_MSG[res.error] || AI_MSG.http}</div>`;
        return;
      }
      Lesson.addVersion(kp.id, res.lesson);
      this.renderLearn(el);
    });
  },

  // 溯源诊断卡（§5.5）：学习页先看清根因再学。深度>2 → 回炉建议；根因在先修 → 先补根因；否则先修扎实直接练
  diagCardHTML(kp) {
    const diag = Mastery.diagnose(kp, Store.mastery, Store.kpIndex());
    const chain = diag.chain.map(k => `<span class="chip">${this.bankEsc(k.name)}</span>`).join('<span class="diag-arrow">→</span>');
    if (Mastery.needsRelearn(diag)) {
      return `<div class="card diag bad"><h2>🔍 溯源诊断</h2>
        <p>「${kp.name}」的根因不在它自己——沿先修链一路向下，${diag.chain.length} 层都还不够牢：</p>
        <div class="diag-chain">${chain}</div>
        <p class="muted">深度超过 2 层，先别刷题——回炉把「${diag.root.name}」重学一遍（微课 + 教材对应章节），再回来练。</p></div>`;
    }
    if (diag.root.id !== kp.id) {
      return `<div class="card diag mid"><h2>🔍 溯源诊断</h2>
        <p>「${kp.name}」不稳的根因在先修「${diag.root.name}」——先补根因，上面自然稳。</p>
        <div class="diag-chain">${chain}</div></div>`;
    }
    return `<div class="card diag good"><h2>🔍 溯源诊断</h2>
      <p>先修链都够牢，问题就在「${kp.name}」本身——直接在这里练，练稳就点亮。</p></div>`;
  },

  startFocus(kpId, el) {
    const s = Quiz.planFocusSession(kpId);
    if (!s) { alert('这个知识点还没有题目'); return; }
    this.session = s;
    this.renderStage(el);
  },

  // 上次没练完的题组：先问一句，别让学生从中途莫名其妙开始（ISSUE-006）
  renderResumeSession(el, saved) {
    const s = saved.session;
    const done = s.results.length;
    const total = Math.max(s.total || s.stages.length, done);
    el.innerHTML = `
      <div class="card hero">
        <h2>📖 上次那组还没练完</h2>
        <p class="muted">已经练了 <strong>${done}/${total}</strong> 题，接着练还是重新开一组？</p>
        <div class="session-actions">
          <button class="btn big glow" id="resume-session">继续上次练习</button>
          <button class="btn secondary" id="discard-session">重新开始</button>
        </div>
      </div>`;
    el.querySelector('#resume-session').addEventListener('click', () => {
      if (saved.subjectId) Store.activeSubjectId = saved.subjectId;
      this.session = s;
      this.renderStage(el);
    });
    el.querySelector('#discard-session').addEventListener('click', () => {
      this._clearSession();
      this.renderPractice(el);
    });
  },

  // ================= 练习：开工 =================
  // 今日计划（Scheduler 决策）+ 会考倒计时 + 科目自选（自主权规范 §11.1：系统推荐 + 自己确认/调整）
  renderPractice(el) {
    // 中途离开再回来：继续当前 session
    if (this.session && this.session.idx < this.session.stages.length) {
      return this.renderStage(el);
    }
    // 刷新/重开页面：本地存着没练完的题组 → 让用户自己选「继续 / 重开」（ISSUE-006）
    const saved = this._loadSession();
    if (saved) return this.renderResumeSession(el, saved);
    const now = Date.now();
    const sid = this.activeSubject() ? this.activeSubject().id : '';
    const blocks = Scheduler.plan(now, this.planSalt);
    this.dailyPlan = blocks;
    const subjName = id => { const s = Store.subjects.find(x => x.id === id); return s ? s.name : ''; };
    const modeCls = { '悬赏清缴': 'bounty', '保养加固': 'maintain' };
    const modeIcon = { '悬赏清缴': '🎯', '保养加固': '🛠️', '突破摸底': '⚔️', '突破推进': '⚔️', '考试冲刺': '🔥' };
    const examSub = Store.subjects.find(s => s.exam);
    // 本周习惯 + 免死金牌（对比分析 B1）：今天断签自动保底 1 天并提示一次（一次性）
    const habit = Scheduler.habit(now);
    if (habit.protect) {
      Scheduler.useShield(now);
      Ui.popup('🛡️ 免死金牌自动启用', '今天还没开张，本周习惯先保底 1 天。明天练起来，别把金牌当枕头。', 'cool');
    }
    // 放松小游戏（阶段 3 §10.5：奖励性收尾，数据回流掌握度/复习队列）；周末彩蛋家长挑战
    const isWeekend = [0, 6].includes(new Date(now).getDay());
    const dueWords = Games.flashDue(now).length;
    el.innerHTML = `
      ${this.statusStripHTML(now, habit, blocks)}
      ${this.todayTodoHTML(now, sid)}
      <div class="card hero">
        <h2>📋 今日计划，点一块直接开练</h2>
        <p class="muted">${COPY.sessionStart}</p>
        <div class="plan-grid">
          ${blocks.map((b, i) => `
            <button class="plan-block mode-${modeCls[b.mode] || 'break'}${i === 0 ? ' primary' : ''}" id="${i === 0 ? 'start-session' : ''}" data-plan="${b.subjectId}">
              <span class="plan-tag">${modeIcon[b.mode] || '⚔️'} ${b.mode}</span>
              <span class="plan-subject">${subjName(b.subjectId)}</span>
              <span class="plan-reasons">${b.reasons.join(' · ')}</span>
              <span class="plan-count">${b.count} 题 · 约 15 分钟（含讲解）${this.planDone.includes(b.subjectId) ? ' · ✅ 已完成' : ''}</span>
            </button>`).join('')}
        </div>
        <div class="session-actions">
          ${blocks.length === 0 ? '<button class="btn big glow" id="start-session-fallback">开整（6 题一组，含讲解约 15 分钟）</button>' : ''}
          <button class="btn secondary" id="reroll-plan">🔄 换个组合</button>
        </div>
      </div>
      <button class="scope-toggle" id="scope-toggle">⚙️ 自选科目 / 单元 ${this.scopeOpen ? '▴' : '▾'}</button>
      <div id="scope-area"${this.scopeOpen ? '' : ' style="display:none"'}>${this.scopeOpen ? this.scopePickerHTML(sid) : ''}</div>
      <div class="card">
        <h2>🎮 放松小游戏</h2>
        <p class="muted">游戏是奖励性收尾——练完再玩。闪电心算回流计算掌握度；单词快闪答错的词会自动进复习队列。</p>
        <div class="session-actions">
          <button class="btn secondary" id="game-arith">⚡ 闪电心算 60s</button>
          <button class="btn secondary" id="game-flash">📚 单词快闪</button>
          ${dueWords > 0 ? `<button class="btn secondary" id="game-flash-review">🔁 单词复习（${dueWords} 个到期）</button>` : ''}
          ${isWeekend ? `<button class="btn secondary" id="parent-challenge">👨‍👦 家长挑战（周末彩蛋）</button>` : ''}
        </div>
      </div>`;
    this.bindSubjectBar(el, () => this.renderPractice(el));
    this.bindUnitBar(el, sid, () => this.renderPractice(el));
    this.wireTodo(el);
    // 计划卡点击即开工；首块同时是页面主行动入口（#start-session，E2E/习惯锚点）
    el.querySelectorAll('[data-plan]').forEach(btn => {
      btn.addEventListener('click', () => {
        Store.activeSubjectId = btn.dataset.plan;
        this.session = Quiz.planSession(Date.now());
        this.renderStage(el);
      });
    });
    // 兜底开工按钮（仅无计划时存在；独立 id，避免与计划卡的 #start-session 撞车）
    const fallback = el.querySelector('#start-session-fallback');
    if (fallback) fallback.addEventListener('click', () => {
      this.session = Quiz.planSession(Date.now());
      this.renderStage(el);
    });
    // 自选练习区（默认折叠）：展开时懒渲染选科卡，之后只切显隐不重渲（保住已选科目/单元）
    const scopeToggle = el.querySelector('#scope-toggle');
    const scopeArea = el.querySelector('#scope-area');
    const wireScope = scope => {
      this.bindSubjectBar(scope, () => { this.scopeOpen = true; this.renderPractice(el); });
      this.bindUnitBar(scope, sid, () => { this.scopeOpen = true; this.renderPractice(el); });
      const sm = scope.querySelector('#start-manual');
      if (!sm) return;
      sm.addEventListener('click', async () => {
        if (sm.disabled) return;
        sm.disabled = true;
        const added = await this.ensureScopeQuestions(6, (i, n) => { sm.textContent = `正在出题 ${i}/${n}…`; });
        if (added > 0) sm.textContent = `已补 ${added} 题，开练…`;
        this.session = Quiz.planSession(Date.now());
        this.renderStage(el);
      });
    };
    if (this.scopeOpen) wireScope(el);
    scopeToggle.addEventListener('click', () => {
      this.scopeOpen = !this.scopeOpen;
      if (this.scopeOpen && !scopeArea.innerHTML) {
        scopeArea.innerHTML = this.scopePickerHTML(sid);
        wireScope(scopeArea);
      }
      scopeArea.style.display = this.scopeOpen ? '' : 'none';
      scopeToggle.textContent = `⚙️ 自选科目 / 单元 ${this.scopeOpen ? '▴' : '▾'}`;
    });
    el.querySelector('#reroll-plan').addEventListener('click', () => {
      this.planSalt += 1;
      this._savePlanProgress();
      this.renderPractice(el);
    });
    // 阶段 3：考试模式开关 / 小游戏 / 家长挑战
    const examOn = el.querySelector('#exam-mode-on');
    if (examOn) examOn.addEventListener('click', () => {
      Scheduler.setExamMode(examSub.id);
      this.renderPractice(el);
    });
    const examOff = el.querySelector('#exam-mode-off');
    if (examOff) examOff.addEventListener('click', () => {
      Scheduler.clearExamMode();
      this.renderPractice(el);
    });
    const ga = el.querySelector('#game-arith');
    if (ga) ga.addEventListener('click', () => this.renderArithGame(el));
    const gf = el.querySelector('#game-flash');
    if (gf) gf.addEventListener('click', () => this.renderFlashGame(el));
    const gfr = el.querySelector('#game-flash-review');
    if (gfr) gfr.addEventListener('click', () => this.renderFlashReview(el));
    const pc = el.querySelector('#parent-challenge');
    if (pc) pc.addEventListener('click', () => this.renderParentChallenge(el));
  },

  // 主页状态带（首行细条）：问候 + 会考倒计时/冲刺 + 本周习惯 + 免死金牌
  // 会考分级沿用 level-cool/warm/hot 语义；按钮 id 不变，#exam-mode-on/off 事件绑定复用
  statusStripHTML(now, habit, blocks) {
    const parts = [Triggers.greeting(now, blocks, this.planDone)];
    const days = Scheduler.examDaysLeft(now);
    const examSub = Store.subjects.find(s => s.exam);
    let cls = 'level-cool';
    let btn = '';
    if (Scheduler.examModeOn()) {
      const es = Store.subjects.find(s => s.id === Scheduler.examModeId());
      parts.push(`🔥 考试模式：${es ? es.name : ''}冲刺中`);
      cls = 'level-hot';
      btn = '<button class="btn secondary small" id="exam-mode-off">退出考试模式</button>';
    } else if (examSub && days > 0 && days <= 14) {
      parts.push(`⏳ ${examSub.name}会考还有 <strong>${days}</strong> 天`);
      cls = days <= 7 ? 'level-hot' : 'level-warm';
      btn = '<button class="btn secondary small" id="exam-mode-on">一键切考试模式</button>';
    } else if (days > 0 && days <= 365) {
      parts.push(`⏳ 生地会考还有 <strong>${days}</strong> 天`);
    }
    parts.push(habit.effective >= 7 ? '🏆 本周 7/7 全勤' : `🔥 本周 ${habit.effective}/7 天`);
    parts.push(habit.shieldUsed ? '🛡️ 免死金牌已用' : '🛡️ 免死金牌 1 张');
    return `<div class="status-strip ${cls}">${parts.map(p => `<span class="strip-item">${p}</span>`).join('<span class="strip-sep">·</span>')}${btn}</div>`;
  },

  // 自选练习区（默认折叠，展开才渲染）：选科 + 选单元 + 手动开练，逻辑全部复用
  scopePickerHTML(sid) {
    return `<div class="card pick-subject">
      <h2>📚 选择练习科目，选一科直接开</h2>
      <p class="muted">点一科选中它，再选「学到哪本 / 哪单元」限定出题范围，然后开练。</p>
      ${this.subjectBar()}
      ${this.unitBar(sid)}
      <div class="session-actions">
        <button class="btn glow" id="start-manual">开练（当前科目）</button>
      </div>
    </div>`;
  },

  // ================= 阶段 3：学习小游戏 + 家长挑战（§10.4 §10.5） =================
  _clearGameTimer() {
    if (this._gameTimer) { clearInterval(this._gameTimer); clearTimeout(this._gameTimer); this._gameTimer = null; }
  },

  // 闪电心算 60s：限时逐题，结算正确率 ≥60% 回流计算类知识点（Games.recordArith）
  renderArithGame(el) {
    this._clearGameTimer();
    const state = { correct: 0, total: 0, t0: Date.now() };
    el.innerHTML = `
      <div class="card hero">
        <div class="learn-head"><h2>⚡ 闪电心算 60s</h2><button class="btn secondary small" id="game-quit">退出</button></div>
        <p class="muted">只管快和准——正确率 ≥60% 会把「计算类」知识点回流 +3 掌握度。</p>
        <div class="game-timer" id="game-timer">60</div>
        <div class="stem" id="game-stem"></div>
        <div class="game-actions">
          <input class="fill-input" id="arith-answer" placeholder="答案" autocomplete="off" inputmode="numeric">
          <button class="btn" id="arith-submit">确定</button>
        </div>
        <div class="muted" id="game-score">对 0 / 共 0</div>
      </div>`;
    el.querySelector('#game-quit').addEventListener('click', () => {
      this._clearGameTimer();
      this.renderPractice(el);
    });
    let q = Games.makeArith();
    el.querySelector('#game-stem').textContent = q.stem;
    const submitAnswer = () => {
      const v = input.value.trim();
      if (v === '' || Number.isNaN(Number(v))) return;
      state.total += 1;
      if (Number(v) === q.answer) state.correct += 1;
      input.value = '';
      input.focus();
      q = Games.makeArith();
      el.querySelector('#game-stem').textContent = q.stem;
      el.querySelector('#game-score').textContent = `对 ${state.correct} / 共 ${state.total}`;
    };
    const input = el.querySelector('#arith-answer');
    el.querySelector('#arith-submit').addEventListener('click', submitAnswer);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submitAnswer(); });
    this._gameTimer = setInterval(() => {
      const left = Math.max(0, 60 - Math.round((Date.now() - state.t0) / 1000));
      const t = el.querySelector('#game-timer');
      if (t) t.textContent = left;
      if (left <= 0) {
        this._clearGameTimer();
        const res = Games.recordArith({
          correct: state.correct, total: state.total,
          avgMs: state.total ? Math.round((Date.now() - state.t0) / state.total) : 0,
        });
        const bumpLine = res.bumped.length > 0
          ? `<div class="result good">已回流 ${res.bumped.length} 个计算知识点（+3）</div>` : '';
        el.innerHTML = `
          <div class="card hero">
            <h2>⚡ 闪电心算结算</h2>
            <p>${state.total} 题 · 对 ${state.correct} · 正确率 ${res.accuracy}%</p>
            <div class="muted">${res.accuracy >= 60 ? '够准，掌握度已回流。' : '正确率没到 60%，不回流——下次慢一点、稳一点。'}</div>
            ${bumpLine}
            <div class="session-actions"><button class="btn" id="game-back">回练习页</button></div>
          </div>`;
        el.querySelector('#game-back').addEventListener('click', () => this.renderPractice(el));
      }
    }, 1000);
  },

  // 单词快闪：题干闪 1.2s → 出选项；答错入复习队列（明天到期）
  renderFlashGame(el) {
    this._clearGameTimer();
    const g = Games.flashStart();
    if (g.questions.length === 0) {
      el.innerHTML = `<div class="card"><h2>📚 单词快闪</h2><div class="empty">英语词库里还没有可选单词——先去练英语，或等复习队列里的词到期。</div><div class="session-actions"><button class="btn" id="game-back">回练习页</button></div></div>`;
      el.querySelector('#game-back').addEventListener('click', () => this.renderPractice(el));
      return;
    }
    const qs = g.questions;
    let idx = 0, correct = 0, missed = 0;
    const renderQ = () => {
      if (idx >= qs.length) return finish();
      const q = qs[idx];
      el.innerHTML = `
        <div class="card hero">
          <div class="learn-head"><h2>📚 单词快闪 <span class="muted">${idx + 1}/${qs.length}</span></h2><button class="btn secondary small" id="game-quit">退出</button></div>
          <div class="game-flash" id="flash-word">${q.stem}</div>
          <div class="muted" id="flash-hint">记一下，马上作答</div>
          <div id="flash-options" hidden>
            <div class="options">${q.options.map((o, i) => `<button class="option" data-idx="${i}">${o}</button>`).join('')}</div>
          </div>
          <div class="muted" id="flash-score">对 ${correct} · 漏 ${missed}</div>
        </div>`;
      el.querySelector('#game-quit').addEventListener('click', () => {
        this._clearGameTimer();
        this.renderPractice(el);
      });
      this._gameTimer = setTimeout(() => {
        const wo = el.querySelector('#flash-word');
        if (wo) wo.textContent = '????';
        const opts = el.querySelector('#flash-options');
        if (opts) opts.hidden = false;
        el.querySelectorAll('#flash-options .option').forEach(btn => {
          btn.addEventListener('click', () => {
            if (Number(btn.dataset.idx) === Number(q.answer)) correct += 1;
            else { missed += 1; Games.flashMiss(q.id); }
            idx += 1;
            renderQ();
          });
        });
      }, 1200);
    };
    const finish = () => {
      this._clearGameTimer();
      el.innerHTML = `
        <div class="card hero">
          <h2>📚 单词快闪结算</h2>
          <p>${qs.length} 个词 · 对 ${correct} · 漏 ${missed}</p>
          <div class="muted">${missed > 0 ? '漏掉的词已进复习队列，明天再来一轮。' : '全对——记忆库稳了。'}</div>
          <div class="session-actions"><button class="btn" id="game-back">回练习页</button></div>
        </div>`;
      el.querySelector('#game-back').addEventListener('click', () => this.renderPractice(el));
    };
    renderQ();
  },

  // 单词复习：到期队列（间隔复习调度器 §10.5）；答对出队、答错延期
  renderFlashReview(el) {
    this._clearGameTimer();
    const due = Games.flashDue(Date.now());
    if (due.length === 0) {
      el.innerHTML = `<div class="card"><h2>🔁 单词复习</h2><div class="empty">队列里没有到期的词——先去玩一局单词快闪攒词。</div><div class="session-actions"><button class="btn" id="game-back">回练习页</button></div></div>`;
      el.querySelector('#game-back').addEventListener('click', () => this.renderPractice(el));
      return;
    }
    let idx = 0, okCount = 0;
    const renderQ = () => {
      if (idx >= due.length) return finish();
      const q = due[idx].question;
      el.innerHTML = `
        <div class="card hero">
          <div class="learn-head"><h2>🔁 单词复习 <span class="muted">${idx + 1}/${due.length}</span></h2><button class="btn secondary small" id="game-quit">退出</button></div>
          <div class="stem">${q.stem}</div>
          <div class="options">${q.options.map((o, i) => `<button class="option" data-idx="${i}">${o}</button>`).join('')}</div>
          <div class="muted">这词错 ${due[idx].wrongCount} 次了，这次答对就出队</div>
        </div>`;
      el.querySelector('#game-quit').addEventListener('click', () => this.renderPractice(el));
      el.querySelectorAll('.option').forEach(btn => {
        btn.addEventListener('click', () => {
          const ok = Number(btn.dataset.idx) === Number(q.answer);
          if (Games.flashReview(q.id, ok)) okCount += 1;
          idx += 1;
          renderQ();
        });
      });
    };
    const finish = () => {
      el.innerHTML = `
        <div class="card hero">
          <h2>🔁 单词复习结算</h2>
          <p>${due.length} 个到期词 · 出队 ${okCount}</p>
          <div class="muted">${okCount === due.length ? '全部出队——这波单词焊牢了。' : '剩下的过两天再复习一遍。'}</div>
          <div class="session-actions"><button class="btn" id="game-back">回练习页</button></div>
        </div>`;
      el.querySelector('#game-back').addEventListener('click', () => this.renderPractice(el));
    };
    renderQ();
  },

  // 家长挑战（§10.4 周末彩蛋）：爸爸限时做儿子薄弱题，儿子当裁判——爸爸必须输得起
  renderParentChallenge(el) {
    this._clearGameTimer();
    const sid = this.activeSubject() ? this.activeSubject().id : '';
    const all = [];
    for (const q of Store.questions) {
      if (q.subjectId !== sid || ['single', 'judge', 'fill'].indexOf(q.type) < 0) continue;
      if (q.difficulty > 3) continue;
      const m = Store.mastery[q.knowledgePointId];
      if (m && Mastery.isMastered(m)) continue;
      if ((m ? m.score : 50) >= 60) continue;
      all.push(q);
    }
    all.sort((a, b) =>
      (Store.mastery[a.knowledgePointId] ? Store.mastery[a.knowledgePointId].score : 50)
      - (Store.mastery[b.knowledgePointId] ? Store.mastery[b.knowledgePointId].score : 50));
    const picked = [];
    const seenKp = new Set();
    for (const q of all) {
      if (picked.length >= 3) break;
      if (seenKp.has(q.knowledgePointId)) continue;
      seenKp.add(q.knowledgePointId);
      picked.push(q);
    }
    if (picked.length === 0) {
      el.innerHTML = `<div class="card"><h2>👨‍👦 家长挑战</h2><div class="empty">当前科目没有合适的薄弱题（掌握度 <60）——换一科或先练几组。</div><div class="session-actions"><button class="btn" id="game-back">回练习页</button></div></div>`;
      el.querySelector('#game-back').addEventListener('click', () => this.renderPractice(el));
      return;
    }
    let idx = 0, childWins = 0, parentWins = 0;
    const renderQ = () => {
      if (idx >= picked.length) return finish();
      const q = picked[idx];
      el.innerHTML = `
        <div class="card hero">
          <div class="learn-head"><h2>👨‍👦 家长挑战 <span class="muted">${idx + 1}/${picked.length} · 爸爸限时做你的薄弱题</span></h2><button class="btn secondary small" id="game-quit">退出</button></div>
          <div class="stem">${q.stem}</div>
          ${q.options ? `<div class="muted" style="margin-top:6px">选项：${q.options.join('　')}</div>` : ''}
          <div class="muted" style="margin-top:8px">爸爸作答时你是裁判——判对错：</div>
          <div class="session-actions">
            <button class="btn" id="pc-wrong">答错了 ❌</button>
            <button class="btn secondary" id="pc-right" style="margin-left:8px">答对了 ✅</button>
          </div>
        </div>`;
      el.querySelector('#game-quit').addEventListener('click', () => this.renderPractice(el));
      el.querySelector('#pc-right').addEventListener('click', () => { parentWins += 1; idx += 1; renderQ(); });
      el.querySelector('#pc-wrong').addEventListener('click', () => { childWins += 1; idx += 1; renderQ(); });
    };
    const finish = () => {
      const win = childWins >= parentWins;
      const pcs = Store.parentChallenge;
      pcs.push({ date: Date.now(), subjectId: sid, total: picked.length, childWins, parentWins, win });
      Store.parentChallenge = pcs;
      el.innerHTML = `
        <div class="card hero">
          <h2>👨‍👦 家长挑战结算</h2>
          <p>儿子判赢 <strong>${childWins}</strong> 局 · 爸爸赢 <strong>${parentWins}</strong> 局</p>
          <div class="${win ? 'result good' : 'result bad'}">${win ? '裁判不偏袒，赢就是赢！' : '爸爸赢了一局——下次你来打回来。'}</div>
          <div class="session-actions"><button class="btn" id="game-back">回练习页</button></div>
        </div>`;
      el.querySelector('#game-back').addEventListener('click', () => this.renderPractice(el));
    };
    renderQ();
  },

  stageLabel(stage) {
    return {
      retest: '🎯 悬赏重做', variant: '🎯 变式挑战',
      breakthrough: '⚔️ 突破', interleave: '🔄 交错', safe: '🛡️ 必对收尾', remedial: '⚡ 趁热打铁',
    }[stage.type] || '练习';
  },

  // ================= 练习：逐题渲染 =================
  renderStage(el) {
    const now = Date.now();
    const stage = this.session.stages[this.session.idx];
    if (!stage) return this.renderSessionEnd(el);
    this._saveSession(); // 每推进一关存盘，刷新后从这一关接着练
    // 变式悬赏：题库有同题型第二题就直接用；没有则优先现场 AI 出同型新题（真变式）；
    // 无 Key 时退回同知识点其他题（variantQuestionFor 的兜底），保证闭环能出题销号
    if (stage.type === 'variant') {
      const rec = Wrongbook.get(stage.recordId);
      if (rec && !Wrongbook.variantQuestionFor(rec) && AI.hasKey() && Store.questionIndex()[rec.questionId]) {
        this.renderVariantGen(el, stage, rec);
        return;
      }
    }
    const question = Quiz.questionFor(this.session, now);
    if (!question) {
      if (!Quiz.advance(this.session)) return this.renderSessionEnd(el);
      return this.renderStage(el);
    }
    this.stage = stage;
    this.question = question;
    this.answered = false;
    this.startAt = Date.now();
    this.renderQuestion(el, stage, question);
  },

  // 变式悬赏现场 AI 出题（题组结构 §7.2 §8.2）：同知识点同题型换数字/情境；失败则跳过本关不阻塞
  async renderVariantGen(el, stage, rec) {
    const qIdx = Store.questionIndex();
    const original = qIdx[rec.questionId];
    const kp = Store.kpIndex()[rec.knowledgePointId];
    const skip = (msg) => {
      el.innerHTML = `<div class="card"><h2>🎯 变式挑战</h2><div class="muted">${msg}</div><div class="session-actions"><button class="btn" id="variant-skip">继续</button></div></div>`;
      el.querySelector('#variant-skip').addEventListener('click', () => {
        if (!Quiz.advance(this.session)) this.renderSessionEnd(el);
        else this.renderStage(el);
      });
    };
    el.innerHTML = `<div class="card"><h2>🎯 变式挑战</h2><div class="muted">${Assistant.name()}正在现编一道变式题，稍等……</div></div>`;
    const res = await Assistant.genVariant(original, kp);
    if (!res.ok) { skip(AI_MSG[res.error] || AI_MSG.http); return; }
    const added = Store.addQuestion({ ...res.question, knowledgePointId: rec.knowledgePointId, groupId: original.groupId || '', groupRole: 'variant' });
    if (!added.ok) { skip('变式题没生成成功，这关先跳过，改天再来。'); return; }
    this.stage = stage;
    this.question = added.question;
    this.answered = false;
    this.startAt = Date.now();
    this.renderQuestion(el, stage, added.question);
  },

  renderQuestion(el, stage, q) {
    const typeLabel = { single: '单选', multi: '多选', fill: '填空', judge: '判断', subjective: '主观' }[q.type];
    const comboChip = this.session.combo >= 2 ? `<span class="combo-pop">连击 ×${this.session.combo} 🔥</span>` : '';
    // 关卡进度点：答完的实心、当前的放大高亮。题量按本组实际可出题数，不足 6 题时不虚标（ISSUE-004）
    const pos = this.session.results.length + 1;
    const total = Math.max(pos, this.session.total || this.session.stages.length);
    const dots = Array.from({ length: total }, (_, i) =>
      `<span class="pdot${i < pos - 1 ? ' done' : i === pos - 1 ? ' cur' : ''}"></span>`).join('');
    let body = '';
    if (q.type === 'single' || q.type === 'judge' || q.type === 'multi') {
      body = `<div class="options" id="options">` + q.options.map((opt, i) =>
        `<button class="option" data-idx="${i}">${opt}</button>`).join('') + `</div>`;
    } else if (q.type === 'fill') {
      body = `<input class="fill-input" id="fill-answer" placeholder="输入答案" autocomplete="off">`;
    } else if (q.type === 'subjective') {
      body = `<textarea class="text-input" id="subj-answer" rows="4" placeholder="写下你的解题过程（自评）"></textarea>`;
    }
    el.innerHTML = `
      <div class="card quiz">
        <div class="stage-progress">${dots}</div>
        <div class="quiz-top">
          <span class="stage-badge">${this.stageLabel(stage)}</span>
          <span class="muted">第 ${pos}/${total} 题 · ${this.kpName(q.knowledgePointId)} · ${typeLabel} · 难度 ${'★'.repeat(q.difficulty)}</span>
          ${comboChip}
          <button class="btn secondary small" id="quiz-quit" style="margin-left:auto">退出本组</button>
        </div>
        <div class="stem">${q.stem}</div>
        ${body}
        <div id="result-zone"></div>
        <div class="quiz-actions" id="action-zone">
          <button class="btn" id="submit-btn" disabled>提交</button>
          <span class="muted" id="submit-hint"></span>
        </div>
      </div>`;
    this.bindQuiz(q, el);
  },

  bindQuiz(q, el) {
    const options = el.querySelectorAll('.option');
    const submitBtn = el.querySelector('#submit-btn');
    const hint = el.querySelector('#submit-hint');
    let selected = [];
    // 未作答不让提交：按钮初始禁用，选了/写了才亮起（ISSUE-002，与微课自测同一范式）
    const hasAnswer = () => {
      if (q.type === 'multi' || q.type === 'single' || q.type === 'judge') return selected.length > 0;
      if (q.type === 'fill') return (el.querySelector('#fill-answer').value || '').trim() !== '';
      if (q.type === 'subjective') return (el.querySelector('#subj-answer').value || '').trim() !== '';
      return false;
    };
    const refreshSubmit = () => {
      submitBtn.disabled = !hasAnswer();
      hint.textContent = '';
    };
    if (q.type === 'multi') {
      options.forEach(o => o.addEventListener('click', () => {
        const idx = Number(o.dataset.idx);
        if (selected.includes(idx)) selected = selected.filter(i => i !== idx);
        else selected.push(idx);
        options.forEach(oo => oo.classList.toggle('selected', selected.includes(Number(oo.dataset.idx))));
        refreshSubmit();
      }));
    } else if (options.length) {
      options.forEach(o => o.addEventListener('click', () => {
        selected = [Number(o.dataset.idx)];
        options.forEach(oo => oo.classList.toggle('selected', Number(oo.dataset.idx) === selected[0]));
        refreshSubmit();
      }));
    }
    const submit = () => {
      if (this.answered) return;
      if (!hasAnswer()) { hint.textContent = '请先作答再提交'; return; }
      let answer = null;
      if (q.type === 'multi') answer = selected;
      else if (q.type === 'single' || q.type === 'judge') answer = selected[0];
      else if (q.type === 'fill') answer = el.querySelector('#fill-answer').value;
      else if (q.type === 'subjective') answer = el.querySelector('#subj-answer').value;
      this.submitAnswer(q, answer, el);
    };
    submitBtn.addEventListener('click', submit);
    refreshSubmit();
    // 手不用离开键盘：填空回车提交；主观题 Ctrl/⌘+回车提交（裸回车留给换行）
    const fill = el.querySelector('#fill-answer');
    if (fill) {
      fill.focus();
      fill.addEventListener('input', refreshSubmit);
      fill.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    }
    const subj = el.querySelector('#subj-answer');
    if (subj) {
      subj.focus();
      subj.addEventListener('input', refreshSubmit);
      subj.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(); });
    }
    // 中途退出：清掉 session 才算真退出（否则 renderPractice 会继续这组）
    el.querySelector('#quiz-quit').addEventListener('click', () => {
      if (!confirm('退出本组？这一组的进度不保存。')) return;
      this.session = null;
      this._clearSession();
      this.renderPractice(el);
    });
  },

  submitAnswer(q, answer, el) {
    const actualTime = (Date.now() - this.startAt) / 1000;
    const res = Quiz.submitStage(this.session, this.stage, q, answer, actualTime, Date.now());
    this.answered = true;
    this._saveSession(); // 作答即存盘：反馈页刷新也不丢这一题
    if (res.isSubjective) this.renderFeynman(el, q, answer, actualTime, res);
    else this.renderFeedback(el, q, answer, actualTime, res);
  },

  // 主观题费曼复述（阶段 1 §13.3 强制）：先用自己的话讲思路，讲完才放解析
  renderFeynman(el, q, answer, actualTime, res) {
    const zone = el.querySelector('#result-zone');
    const actions = el.querySelector('#action-zone');
    zone.innerHTML = `
      <div class="result">已记录。先别急着对答案——用自己的话把这道题讲一遍，讲给不懂的同学听。</div>
      <textarea class="text-input" id="feynman-answer" rows="4" placeholder="你是怎么想的、怎么做的？用大白话讲清楚"></textarea>`;
    actions.innerHTML = `<button class="btn" id="feynman-btn">讲完了，对答案</button>`;
    actions.querySelector('#feynman-btn').addEventListener('click', () => {
      const text = el.querySelector('#feynman-answer').value;
      if (!text.trim()) { alert('先讲一遍再对答案'); return; }
      // 费曼复述记到本次作答明细（留档，不参与判分）
      const attempts = Store.attempts;
      const rec = attempts[attempts.length - 1];
      if (rec && rec.questionId === q.id) rec.feynman = text.trim();
      Store.attempts = attempts;
      this.renderFeedback(el, q, answer, actualTime, res);
    });
  },

  // ================= 练习：结果反馈 =================
  // 填空答错时并列展示「你的作答 / 正确答案」，避免学生看不出差在哪（ISSUE-005）
  answerCompareHTML(q, answer) {
    const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    return `<div class="muted" style="margin-top:8px">你的作答：<strong>${esc(answer)}</strong> · 正确答案：<strong>${esc(q.answer)}</strong></div>`;
  },

  // 揭晓时刻：把正确答案标绿（答错时延迟到学生自己归因之后）
  revealAnswer(el, q) {
    if (q.type !== 'single' && q.type !== 'judge' && q.type !== 'multi') return;
    const correctSet = q.type === 'multi'
      ? (Array.isArray(q.answer) ? q.answer : [q.answer]).map(Number)
      : [Number(q.answer)];
    el.querySelectorAll('.option').forEach(o => {
      if (correctSet.includes(Number(o.dataset.idx))) o.classList.add('correct');
    });
  },

  // 题级讲解卡：揭晓时给「这道题考什么 + 作答对照 + 答案依据 + 课本章节定位」
  // 说明：题库没有逐题步骤数据，逐步解法改由 AI 现讲（见 solveSlotHTML，按题缓存）
  explainCardHTML(q, answer) {
    const ref = this.textbookRef(Store.kpIndex()[q.knowledgePointId]);
    const lessonHint = Lesson.versions(q.knowledgePointId).length > 0
      ? `<div class="muted" style="margin-top:6px">这一节配了 90 秒微课，看完再回来做更稳。</div>` : '';
    return `
      <div class="card explain-card">
        <div><strong>这道题考什么：</strong>${this.kpName(q.knowledgePointId) || '本题知识点'}</div>
        ${q.type === 'fill' ? this.answerCompareHTML(q, answer) : ''}
        <div class="muted" style="margin-top:8px"><strong>解析：</strong>${q.explanation || '（暂无解析）'}</div>
        ${ref ? `<div class="muted" style="margin-top:6px"><strong>章节定位：</strong>${ref}</div>` : ''}
        ${lessonHint}
        <div id="solve-slot">${this.solveSlotHTML(q, answer)}</div>
      </div>`;
  },

  // 逐步解法槽位（只读、无副作用）：有缓存渲染步骤；无缓存且有 Key 给按钮；无 Key 则什么都不显示
  solveSlotHTML(q, answer) {
    const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const cached = Assistant.solutionOf(q.id);
    if (cached) return `<div class="muted" style="margin-top:8px"><strong>逐步解法：</strong><br>${esc(cached).replace(/\n/g, '<br>')}</div>`;
    if (!AI.hasKey()) return '';
    return `<div style="margin-top:8px"><button class="btn secondary small" id="solve-btn">让${Assistant.name()}逐步讲这道题</button></div>`;
  },

  // 绑定「逐步讲这道题」按钮：点击 → 生成中 → 成功渲染步骤 / 失败给中文提示
  wireSolveCard(root, q, answer) {
    const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const btn = root.querySelector('#solve-btn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const slot = btn.closest('#solve-slot') || btn.parentElement;
      slot.innerHTML = `<div class="muted">${Assistant.name()}正在想步骤……</div>`;
      const res = await Assistant.solveSteps(q, Store.kpIndex()[q.knowledgePointId], answer);
      if (!res.ok) {
        slot.innerHTML = `<div class="chat-err">${AI_MSG[res.error] || AI_MSG.http}</div>`;
        return;
      }
      slot.innerHTML = `<div class="muted"><strong>逐步解法：</strong><br>${esc(res.text).replace(/\n/g, '<br>')}</div>`;
    });
  },

  // 课本章节定位：版本 · 册次 · 章 › 节 › 知识点（不含页码，全库无页码数据）
  textbookRef(kp) {
    if (!kp) return '';
    const idx = Store.kpIndex();
    const subj = Store.subjects.find(s => s.id === kp.subjectId);
    const parts = [];
    if (subj && subj.textbook) parts.push(subj.textbook);
    let top = kp;
    while (top.parentId && idx[top.parentId]) top = idx[top.parentId];
    if (top.level === 1) parts.push(top.name);
    const path = this.bankKpPath(kp);
    if (path) parts.push(...path.split(' · '));
    // 节名与知识点名同名时会出现相邻重复段，去掉只保留一次
    return parts.filter((p, i) => i === 0 || p !== parts[i - 1]).join(' · ');
  },

  renderFeedback(el, q, answer, actualTime, res) {
    // 高亮选项：答错时只标红学生选错的项，正确答案留到揭晓时刻（避免归因前泄露答案）
    if (q.type === 'single' || q.type === 'judge' || q.type === 'multi') {
      const options = el.querySelectorAll('.option');
      const correctSet = q.type === 'multi'
        ? (Array.isArray(q.answer) ? q.answer : [q.answer]).map(Number)
        : [Number(q.answer)];
      const userSet = (Array.isArray(answer) ? answer : [answer]).map(Number);
      options.forEach(o => {
        const idx = Number(o.dataset.idx);
        o.disabled = true;
        if (res.correct === true && correctSet.includes(idx)) o.classList.add('correct');
        else if (res.correct === false && userSet.includes(idx)) o.classList.add('wrong');
      });
    }
    const zone = el.querySelector('#result-zone');
    const actions = el.querySelector('#action-zone');
    actions.innerHTML = '';

    // 主观题：自评对照
    if (res.isSubjective) {
      zone.innerHTML = `
        <div class="result">已记录。对照下面的解析自评——过程写清楚比答案对更重要。</div>
        <div class="muted" style="margin-top:8px"><strong>解析：</strong>${q.explanation || '（暂无解析）'}</div>`;
      actions.innerHTML = `<button class="btn" id="next-btn">下一题</button>`;
      actions.querySelector('#next-btn').addEventListener('click', () => this.nextStage(el));
      return;
    }

    // 悬赏重做 / 变式阶段：闭环专属反馈（通过/未通过），优先于通用答对反馈
    const isClosure = this.stage.type === 'retest' || this.stage.type === 'variant';
    if (isClosure) {
      const rec = Wrongbook.get(this.stage.recordId);
      let head;
      if (this.stage.type === 'retest') {
        head = res.correct === true
          ? `<div class="result good">重做通过 +5。${this.dueText(rec ? rec.variantAt : null)}变式挑战——过了就销号领赏。</div>`
          : `<div class="result bad">还没焊牢——回看解析，3 天后再来一轮${rec && rec.reappearCount ? `（第 ${rec.reappearCount + 1} 次）` : ''}。不慌，正常。</div>`;
      } else {
        head = res.correct === true
          ? `<div class="result good">🎯 悬赏销号！${COPY.closureDone}</div>`
          : `<div class="result bad">变式没过——这道题转入顽固清单。别硬刷，换个讲法重讲一遍再来。</div>`;
      }
      if (this.stage.type === 'variant' && res.correct === true) Ui.popup('🎯 悬赏销号！', COPY.closureDone, 'success');
      const cmp = q.type === 'fill' && res.correct === false ? this.answerCompareHTML(q, answer) : '';
      zone.innerHTML = head + cmp + `<div class="muted" style="margin-top:8px"><strong>解析：</strong>${q.explanation || '（暂无解析）'}</div>`;
      const hasLesson = Lesson.versions(q.knowledgePointId).length > 0;
      if (this.stage.type === 'variant' && res.correct === false && hasLesson) {
        actions.innerHTML = `<button class="btn" id="relearn-btn">回炉微课（换个讲法）</button>
          <button class="btn secondary" id="next-btn" style="margin-left:8px">下一题</button>`;
        actions.querySelector('#relearn-btn').addEventListener('click', () => {
          Lesson.render(q.knowledgePointId, el, () => this.onLessonPassed(el, q.knowledgePointId));
        });
      } else {
        actions.innerHTML = `<button class="btn" id="next-btn">下一题</button>`;
      }
      actions.querySelector('#next-btn').addEventListener('click', () => this.nextStage(el));
      return;
    }

    // 答对：评级 + 掌握度变化 + 解析；点亮/冷知识卡用彩色弹窗庆祝
    if (res.correct === true) {
      const delta = res.after - res.before;
      const ratingHTML = res.rating === 'S'
        ? `<span class="rating rating-S">⚡S 级</span>`
        : `<span class="rating rating-${res.rating}">${res.rating} 级</span>`;
      const comboHTML = res.combo >= 2 ? `<span class="combo-pop">连击 ×${res.combo} 🔥</span>` : '';
      const speedNote = res.rating === 'S' ? '——这题你是真懂它'
        : res.rating === 'C' ? '——离 S 级还差一点，练到快就稳了' : '';
      if (res.newlyMastered) Ui.popup('💡 新技能点亮！', `「${this.kpName(q.knowledgePointId)}」亮灯成功，继续乘胜追击。`, 'success');
      const fact = Facts.tryDrop();
      if (fact) Ui.popup('💠 冷知识卡 +1', fact.text, 'party');
      zone.innerHTML = `
        <div class="result good">
          ${ratingHTML} 掌握度 ${res.before} → ${res.after}（${delta >= 0 ? '+' : ''}${delta}）${comboHTML}
        </div>
        <div class="muted" style="margin-top:8px">用时 ${Math.round(actualTime)}s（标准 ${q.expectedTime}s）${speedNote}</div>
        <div class="muted" style="margin-top:8px"><strong>解析：</strong>${q.explanation || '（暂无解析）'}</div>`;
      actions.innerHTML = `<button class="btn" id="next-btn">下一题</button>`;
      actions.querySelector('#next-btn').addEventListener('click', () => this.nextStage(el));
      return;
    }

    // ---- 答错（普通题）：先归因（自选错因）→ 再看讲解 → 标记看懂 →（有微课→推荐微课）
    // 连错 2 题降难度时附一条冷笑话（放松模块 §9.7，频率红线每天 ≤2 次），笑话走彩色弹窗
    const joke = res.degradedNext && Jokes.canTell() ? Jokes.pick() : '';
    if (joke) Ui.popup('🤣 阿K的冷笑话', joke, 'joy');
    // 揭晓前不展示正确答案与作答对照，先让学生自己归因（答案揭晓后移）
    zone.innerHTML = `
      ${res.degradedNext ? `<div class="result bad">${COPY.doubleWrong}</div>` : ''}
      <div class="result bad">回答错误 · 悬赏已上榜</div>
      <p class="muted">${this.pick(COPY.wrongComfort)}</p>
      <div class="err-head">先自己归因（比看十遍解析都管用）：</div>
      <div class="error-types">
        ${ERROR_TYPES.map(t => `<button class="error-type-btn" data-type="${t.key}"><strong>${t.label}</strong><span>${t.hint}</span></button>`).join('')}
      </div>`;

    zone.querySelectorAll('.error-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        Wrongbook.setErrorType(res.wrongRecordId, type);
        const rec = Wrongbook.get(res.wrongRecordId);
        // 有 Key：追问式讲解（考什么→下一步→重做）；无 Key：降级为文字解析（§9.1）
        // 收尾走公共 afterUnderstood：有微课 → 继续推微课；否则进跟进练习二选一
        if (rec && AI.hasKey()) {
          this.renderSocratic(el, q, rec, () => this.afterUnderstood(el, q, type, res.wrongRecordId));
          return;
        }
        // 揭晓时刻：出题级讲解卡（考什么 + 答案依据 + 章节定位），并标绿正确答案
        zone.innerHTML = `
          <div class="result bad">错因已记下：${type}。3 天后原题重做，7 天后变式挑战，全过才销号。</div>
          ${this.explainCardHTML(q, answer)}
          <div id="ask-slot"></div>`;
        this.wireSolveCard(zone, q, answer);
        this.revealAnswer(el, q);
        actions.innerHTML = `<button class="btn" id="understood-btn">看懂了，继续</button>
          <button class="btn secondary" id="ask-btn" style="margin-left:8px">还是不懂，问学长</button>`;
        actions.querySelector('#understood-btn').addEventListener('click', () => {
          this.afterUnderstood(el, q, type, res.wrongRecordId);
        });
        actions.querySelector('#ask-btn').addEventListener('click', () => {
          actions.querySelector('#understood-btn').style.display = 'none';
          this.renderAskPanel(zone.querySelector('#ask-slot'), Wrongbook.get(res.wrongRecordId), q,
            () => this.afterUnderstood(el, q, type, res.wrongRecordId));
        });
      });
    });
  },

  // 答错后「看懂了」的公共收尾：销待处理状态 →（有微课）推微课 → 否则进跟进练习二选一
  afterUnderstood(el, q, type, recId) {
    Wrongbook.markUnderstood(recId, Date.now());
    const hasLesson = Lesson.versions(q.knowledgePointId).length > 0;
    if (hasLesson) {
      const head = type === '概念' ? '概念没吃透？90 秒补上' : '这题没吃透？90 秒补上';
      el.innerHTML = `
        <div class="card greet">
          <h2>${head}</h2>
          <p class="muted">微课用最简单的话把「${this.kpName(q.knowledgePointId)}」讲明白，讲完自测 2 题，全对再回来做题。</p>
          <div class="session-actions">
            <button class="btn" id="take-lesson">上微课（90 秒）</button>
            <button class="btn secondary" id="skip-lesson">先继续做题</button>
          </div>
        </div>`;
      el.querySelector('#take-lesson').addEventListener('click', () => {
        Lesson.render(q.knowledgePointId, el, () => this.onLessonPassed(el, q.knowledgePointId));
      });
      el.querySelector('#skip-lesson').addEventListener('click', () => this.followUpChoice(el, q));
    } else {
      this.followUpChoice(el, q);
    }
  },

  // 看懂之后的跟进练习二选一：AI 原创题 / 真题风格题，现场生成后插入本组趁热打铁（§需求3）
  followUpChoice(el, q) {
    el.innerHTML = `
      <div class="card greet">
        <h2>趁热打铁：来一道跟进题</h2>
        <p class="muted">还是「${this.kpName(q.knowledgePointId)}」这个知识点，两种口味选一个。</p>
        <div class="session-actions">
          <button class="btn" id="followup-ai">AI 原创题</button>
          <button class="btn secondary" id="followup-real">真题风格题</button>
          <button class="btn secondary small" id="followup-skip">跳过，继续做题</button>
        </div>
      </div>`;
    el.querySelector('#followup-ai').addEventListener('click', () => this.genFollowUp(el, q, false));
    el.querySelector('#followup-real').addEventListener('click', () => this.genFollowUp(el, q, true));
    el.querySelector('#followup-skip').addEventListener('click', () => this.nextStage(el));
  },

  // 现场出题：成功则入库并插成本组下一关；失败走降级页，绝不阻塞练习流
  async genFollowUp(el, q, isReal) {
    const label = isReal ? '真题风格题' : 'AI 原创题';
    el.innerHTML = `<div class="card greet"><h2>${label}</h2><div class="muted">${Assistant.name()}正在现编一道${label}，稍等……</div></div>`;
    const kp = Store.kpIndex()[q.knowledgePointId];
    const res = isReal ? await Assistant.genReal(q, kp) : await Assistant.genVariant(q, kp);
    if (!res.ok) { this.followUpSkip(el, AI_MSG[res.error] || AI_MSG.http); return; }
    const added = Store.addQuestion({
      ...res.question, knowledgePointId: q.knowledgePointId, groupId: q.groupId || '', groupRole: 'variant',
    });
    if (!added.ok) { this.followUpSkip(el, '跟进题没生成成功，先跳过，改天再来。'); return; }
    Quiz.insertRemedial(this.session, q.knowledgePointId);
    this.nextStage(el);
  },

  followUpSkip(el, msg) {
    el.innerHTML = `<div class="card"><h2>跟进练习</h2><div class="muted">${msg}</div>
      <div class="session-actions"><button class="btn" id="followup-continue">继续做题</button></div></div>`;
    el.querySelector('#followup-continue').addEventListener('click', () => this.nextStage(el));
  },

  // 微课自测全对 → 插一道同知识点变式题，趁热打铁
  onLessonPassed(el, kpId) {
    Quiz.insertRemedial(this.session, kpId);
    this.nextStage(el);
  },

  nextStage(el) {
    if (!Quiz.advance(this.session)) return this.renderSessionEnd(el);
    this.renderStage(el);
  },

  // ================= 练习：战报收尾 =================
  // 今日计划内下一科（练完自动衔接；计划全清则收工）
  dailyPlanNext() {
    if (!this.dailyPlan) return null;
    const b = this.dailyPlan.find(x => !this.planDone.includes(x.subjectId));
    if (!b) return null;
    const s = Store.subjects.find(x => x.id === b.subjectId);
    return s ? { id: s.id, name: s.name, mode: b.mode } : null;
  },

  startBlock(subjectId, el) {
    Store.activeSubjectId = subjectId;
    this.session = Quiz.planSession(Date.now());
    this.renderStage(el);
  },

  // 「下一步练什么」直通车：结算/收工时就地给出最该攻的点，一键开练（省去进技能树逐个找）
  nextTargetCardHTML(now, subjectId) {
    const t = Report.nextTarget(now, subjectId);
    if (!t) return '';
    const subj = Store.subjects.find(s => s.id === t.kp.subjectId);
    // 时间预估（Part B②）：告诉学生这一组要花多久，值不值得现在开工
    const est = Quiz.estFocusMinutes(t.kp.id);
    return `<div class="card">
      <h2>下一个该攻：${this.bankEsc(t.kp.name)}</h2>
      <div class="muted">${subj ? `${this.bankEsc(subj.name)} · ` : ''}${t.tier.icon} ${t.tier.label} · 差 ${t.gap}% 点亮${t.rusted ? ' · 有点生锈，先保养一下' : ''}${est ? ` · 做题约 ${est} 分钟` : ''}</div>
      <div class="session-actions">
        <button class="btn" id="next-target-btn" data-kp="${t.kp.id}">一键开练 →</button>
      </div>
    </div>`;
  },

  wireNextTarget(el) {
    const btn = el.querySelector('#next-target-btn');
    if (btn) btn.addEventListener('click', () => this.startFocus(btn.dataset.kp, el));
  },

  // 今日待办聚合：到期悬赏 + 最该攻的点，合成一条入口，一键开练（省去翻菜单找题）
  todayTodos(now, sid) {
    const due = Wrongbook.due(now);
    const dueCount = due.retests.concat(due.variants).filter(r => r.subjectId === sid).length;
    return { dueCount, target: Report.nextTarget(now, sid) };
  },

  todayTodoHTML(now, sid) {
    const { dueCount, target } = this.todayTodos(now, sid);
    if (dueCount === 0 && !target) return '';
    const parts = [];
    if (dueCount > 0) parts.push(`🎯 <strong>${dueCount}</strong> 道悬赏到期，优先办`);
    if (target) parts.push(`⚔️ 最该攻：<strong>${this.bankEsc(target.kp.name)}</strong>（差 ${target.gap}% 点亮）`);
    return `<div class="due-banner">🌅 今日待办：${parts.join(' · ')}
      <button class="link" id="todo-start">一键开练 →</button></div>`;
  },

  wireTodo(el) {
    const btn = el.querySelector('#todo-start');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const now = Date.now();
      const sid = this.activeSubject() ? this.activeSubject().id : '';
      const { dueCount, target } = this.todayTodos(now, sid);
      if (dueCount > 0) {
        this.session = Quiz.planSession(now);
        return this.renderStage(el);
      }
      if (target) this.startFocus(target.kp.id, el);
    });
  },

  // 主动消息（§9.3）：本次会话只发一条优先级最高的，守额度/静默/「今天跳过」红线
  // 触发点放在结算页——首页只留常驻「今日待办」横幅，避免同页两条相近提示重复
  proactiveHTML(now, sid) {
    if (this.proactiveShown) return '';
    const msg = Triggers.proactive(now, { recallAt: this._prevActiveAt, todo: this.todayTodos(now, sid) })
      .find(m => !Triggers.skipped(m.id, now));
    if (!msg || !Triggers.canSend(now)) return '';
    Triggers.recordSent(now);
    this.proactiveShown = true;
    this._proId = msg.id;
    return `<div class="proactive-bubble">💬 ${msg.text}<button class="link" id="pro-skip">今天跳过</button></div>`;
  },

  wireProactive(el, now) {
    const btn = el.querySelector('#pro-skip');
    if (!btn) return;
    // 「今天跳过」：记入当日跳过表后就地收起气泡——重跑 renderSessionEnd 会重复其副作用
    btn.addEventListener('click', () => {
      if (this._proId) Triggers.skip(this._proId, now);
      const bubble = btn.parentNode;
      if (bubble && bubble.style) bubble.style.display = 'none';
    });
  },

  renderSessionEnd(el) {
    const now = Date.now();
    const s = this.session || { results: [] };
    if (s.results.length > 0) Ui.popup('🎉 一组搞定！', `这组 ${s.results.length} 题练完了，收工愉快。`, 'party');
    const lit = s.results.filter(r => r.newlyMastered).length;
    const subj = this.activeSubject();
    if (subj && !this.planDone.includes(subj.id)) { this.planDone.push(subj.id); this._savePlanProgress(); }
    const next = this.dailyPlanNext();
    const proMsg = this.proactiveHTML(now, subj ? subj.id : '');
    el.innerHTML = `
      <div class="card greet">
        <h2>${this.pick(COPY.sessionEnd)}</h2>
        ${lit > 0 ? `<div class="lit-banner">💡 今天新点亮 ${lit} 个技能点</div>` : ''}
        ${Report.battleCardHTML(now)}
        ${s.results.length > 0 && s.results.length < 6 ? `<div class="muted" style="margin-top:8px">本组共 ${s.results.length} 题（该范围能出的题有限）。想练满 6 题，可在「设置」里配置 AI 学长现场补题。</div>` : ''}
        ${proMsg}
        ${this.nextTargetCardHTML(now, subj ? subj.id : '')}
        <div class="session-actions">
          ${next ? `<button class="btn big glow" id="next-subject-btn">下一科：${next.name}（${next.mode}）→</button>` : ''}
          <button class="btn" id="again-btn">再来一组</button>
          ${!next ? `<button class="btn secondary" id="done-today-btn">今天收工 🎉</button>` : ''}
          <button class="btn secondary" id="report-btn">看看技能树</button>
        </div>
      </div>`;
    this.session = null;
    this._clearSession();
    if (next) {
      el.querySelector('#next-subject-btn').addEventListener('click', () => this.startBlock(next.id, el));
    }
    if (!next) {
      el.querySelector('#done-today-btn').addEventListener('click', () => this.renderDoneToday(el));
    }
    el.querySelector('#again-btn').addEventListener('click', () => {
      this.session = Quiz.planSession(Date.now());
      this.renderStage(el);
    });
    el.querySelector('#report-btn').addEventListener('click', () => this.show('report'));
    this.wireNextTarget(el);
    this.wireProactive(el, now);
  },

  // 收工页：战报 + 睡前记忆提示（心理规范 §11.10）
  renderDoneToday(el) {
    el.innerHTML = `
      <div class="card hero">
        <h2>收工！今天这波稳 ✅</h2>
        ${Report.battleCardHTML(Date.now())}
        <p class="muted">睡前 10 分钟过一遍悬赏榜上的错题——睡眠会帮你把它焊牢。</p>
        <div class="session-actions">
          <button class="btn" id="report-btn2">看看今天的技能树</button>
        </div>
      </div>
      ${this.nextTargetCardHTML(Date.now(), '')}`;
    el.querySelector('#report-btn2').addEventListener('click', () => this.show('report'));
    this.wireNextTarget(el);
  },

  // ================= 悬赏榜 =================
  renderWrongbook(el) {
    const now = Date.now();
    const sid = this.activeSubject() ? this.activeSubject().id : '';
    const records = Wrongbook.all().filter(r => r.subjectId === sid);
    const active = records.filter(r => r.status !== '已销号');
    const closed = records.filter(r => r.status === '已销号');
    const qIdx = Store.questionIndex();
    const STATUS_ORDER = { '待处理': 0, '重做中': 1, '变式待测': 2, '顽固': 3 };
    active.sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) || b.firstWrongAt - a.firstWrongAt);

    if (active.length === 0 && closed.length === 0) {
      el.innerHTML = `<div class="card"><h2>悬赏榜</h2>${this.subjectBar()}<div class="empty">空空如也——好事。错题自动上榜，走完闭环（重做→变式）才算销号离场。</div></div>`;
      this.bindSubjectBar(el, () => this.renderWrongbook(el));
      return;
    }

    const chipCls = { '待处理': 'chip-gray', '重做中': 'chip-blue', '变式待测': 'chip-mid', '顽固': 'chip-bad' };
    let html = `<div class="card"><h2>悬赏榜</h2>${this.subjectBar()}`;
    if (active.length >= Wrongbook.LIMIT) {
      html += `<div class="due-banner">⚠️ 活跃悬赏已达 ${active.length} 道（上限 ${Wrongbook.LIMIT}）——先集中把「重做中/变式待测」的办掉，别让新错题堆积。</div>`;
    }

    if (active.length === 0) {
      html += `<div class="empty">无进行中的悬赏。保持！</div>`;
    } else {
      html += `<div class="bounty-list">`;
      for (const rec of active) {
        const q = qIdx[rec.questionId];
        const stem = q ? (q.stem.slice(0, 46) + (q.stem.length > 46 ? '…' : '')) : '（题目缺失）';
        const level = Wrongbook.upgradeLevel(rec);
        const hint = level === 2 ? `<span class="chip chip-bad">建议回炉重学</span>`
          : level === 1 ? `<span class="chip chip-mid">建议溯源先修</span>` : '';
        const due = this.dueText(rec.status === '变式待测' ? rec.variantAt : rec.retestAt);
        html += `
          <div class="bounty-item">
            <div class="bounty-main">
              <span class="bounty-kp">${this.kpName(rec.knowledgePointId)}</span>
              <span class="bounty-stem">${stem}</span>
            </div>
            <div class="bounty-meta">
              <span class="chip ${chipCls[rec.status] || 'chip-gray'}">${rec.status}</span>
              ${(rec.status === '重做中' || rec.status === '变式待测') && due ? `<span class="muted">${due}</span>` : ''}
              ${rec.reappearCount > 0 ? `<span class="muted">重错过 ${rec.reappearCount} 次</span>` : ''}
              ${rec.errorType ? `<span class="muted">错因：${rec.errorType}</span>` : ''}
              ${hint}
            </div>
            ${(rec.status === '待处理') ? `<button class="btn secondary small" data-process="${rec.id}">去处理（归因→看解析）</button>` : ''}
            ${(rec.status === '顽固' && Lesson.versions(rec.knowledgePointId).length > 0) ? `<button class="btn secondary small" data-relearn="${rec.knowledgePointId}">回炉微课</button>` : ''}
          </div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;

    // 顽固错题专项（全科目按知识点分组）：错 3 次以上单独成组，建议每周五回炉
    const stubborn = Wrongbook.stubborn();
    if (stubborn.length > 0) {
      const groups = {};
      for (const r of stubborn) {
        const g = groups[r.knowledgePointId] || (groups[r.knowledgePointId] = { subjectId: r.subjectId, count: 0, maxRe: 0 });
        g.count += 1;
        g.maxRe = Math.max(g.maxRe, r.reappearCount || 0);
      }
      const subjName = id => { const s = Store.subjects.find(x => x.id === id); return s ? s.name : '未知科目'; };
      html += `
        <div class="card stubborn">
          <h2>顽固错题专项（${Object.keys(groups).length} 组）</h2>
          <p class="muted">同一个知识点错 3 次以上，说明概念没吃透，刷题没用——回炉微课重学一遍。建议每周五回炉，直到销号。</p>
          <div class="bounty-list">
            ${Object.entries(groups).map(([kpId, g]) => `
              <div class="bounty-item">
                <div class="bounty-main">
                  <span class="bounty-kp">${subjName(g.subjectId)} · ${this.kpName(kpId)}</span>
                  <span class="bounty-stem">${g.count} 道题反复错${g.maxRe > 0 ? `，最多重错过 ${g.maxRe} 次` : ''}</span>
                </div>
                <div class="bounty-meta">
                  ${Lesson.versions(kpId).length > 0 ? `<button class="btn secondary small" data-relearn="${kpId}">回炉微课</button>` : '<span class="muted">暂无微课，先做关联题</span>'}
                </div>
              </div>`).join('')}
          </div>
        </div>`;
    }

    if (closed.length > 0) {
      const show = closed.slice(-10).reverse();
      html += `
        <div class="card">
          <h2>已销号（${closed.length}）</h2>
          <div class="bounty-list closed">
            ${show.map(rec => `
              <div class="bounty-item">
                <div class="bounty-main">
                  <span class="bounty-kp">${this.kpName(rec.knowledgePointId)}</span>
                  <span class="bounty-stem">✅ ${new Date(rec.closedAt).toLocaleDateString()} 领赏</span>
                </div>
              </div>`).join('')}
          </div>
        </div>`;
    }

    el.innerHTML = html;
    this.bindSubjectBar(el, () => this.renderWrongbook(el));

    // 待处理：走 D0 补流程（归因 → 解析 → 看懂）
    el.querySelectorAll('[data-process]').forEach(btn => {
      btn.addEventListener('click', () => {
        const rec = records.find(r => r.id === btn.dataset.process);
        const q = qIdx[rec.questionId];
        if (!q) { alert('题目数据缺失'); return; }
        this.renderD0Flow(el, rec, q, () => this.renderWrongbook(el));
      });
    });
    // 顽固：回炉微课
    el.querySelectorAll('[data-relearn]').forEach(btn => {
      btn.addEventListener('click', () => {
        Lesson.render(btn.dataset.relearn, el, () => this.renderWrongbook(el));
      });
    });
  },

  // D0 补处理流程：错因自选 → 解析 → 标记看懂（练习中断时的补入口）
  renderD0Flow(el, rec, q, onDone) {
    const showExplain = () => {
      el.innerHTML = `
        <div class="card">
          <h2>看解析</h2>
          <div class="quiz-meta"><span>知识点：${this.kpName(rec.knowledgePointId)}</span></div>
          <div class="stem">${q.stem}</div>
          ${this.explainCardHTML(q, rec.myAnswer)}
          <div class="quiz-actions">
            <button class="btn" id="d0-understood">看懂了，3 天后重做</button>
            <button class="btn secondary" id="d0-ask" style="margin-left:8px">还是不懂，问学长</button>
          </div>
          <div id="d0-ask-slot"></div>
        </div>`;
      this.wireSolveCard(el, q, rec.myAnswer);
      el.querySelector('#d0-understood').addEventListener('click', () => {
        Wrongbook.markUnderstood(rec.id, Date.now());
        onDone();
      });
      el.querySelector('#d0-ask').addEventListener('click', () => {
        el.querySelector('#d0-understood').style.display = 'none';
        this.renderAskPanel(el.querySelector('#d0-ask-slot'), rec, q, () => {
          Wrongbook.markUnderstood(rec.id, Date.now());
          onDone();
        });
      });
    };

    el.innerHTML = `
      <div class="card">
        <h2>补处理悬赏：先归因</h2>
        <div class="quiz-meta"><span>知识点：${this.kpName(rec.knowledgePointId)}</span></div>
        <div class="stem">${q.stem}</div>
        <div class="err-head">错在哪了？自己说：</div>
        <div class="error-types">
          ${ERROR_TYPES.map(t => `<button class="error-type-btn" data-type="${t.key}"><strong>${t.label}</strong><span>${t.hint}</span></button>`).join('')}
        </div>
      </div>`;
    el.querySelectorAll('.error-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Wrongbook.setErrorType(rec.id, btn.dataset.type);
        // 有 Key：追问式讲解；无 Key：降级为文字解析
        if (AI.hasKey()) {
          this.renderSocratic(el, q, rec, () => {
            Wrongbook.markUnderstood(rec.id, Date.now());
            onDone();
          });
          return;
        }
        showExplain();
      });
    });
  },

  // ================= 追问式讲解：考什么 → 下一步 → 重做 =================
  // 有 Key：阿K 苏格拉底式引导前两问，第三问同题重做（本地判分）；AI 掉线/超额随时降级文字解析
  // 接管整个视图：重新画题面才能挡住原来高亮的正确答案，第三问重做才作数
  renderSocratic(el, q, rec, onDone) {
    const STEP_LABELS = ['考什么', '下一步', '重做'];
    const STEP_ASKS = [
      '先别急着看答案——你觉得这道题在考什么？用自己的话说一句。',
      '行，方向有了。拿到这种题，第一步该干什么？说个大概。',
      '思路过了一遍，现在重做这道题，用你刚说的办法。',
    ];
    const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const log = [{ role: 'assistant', content: STEP_ASKS[0] }];
    let step = 0;
    let busy = false;

    // 降级：保住已聊的内容 + 文字解析 + 「问学长」兜底（设计文档 §9.1）
    const degrade = (errKey) => {
      el.innerHTML = `
        <div class="card socratic-card">
          <div class="socratic-head"><h2>追问式讲解</h2><span class="muted">${Assistant.name()}这会儿不在</span></div>
          <div class="chat-log">
            ${log.map(t => `<div class="chat-bubble ${t.role === 'assistant' ? 'from-ai' : 'from-me'}">${esc(t.content)}</div>`).join('')}
            <div class="chat-bubble from-ai">${AI_MSG[errKey] || AI_MSG.http}</div>
          </div>
          ${this.explainCardHTML(q, rec.myAnswer)}
          <div class="quiz-actions">
            <button class="btn" id="so-understood">看懂了，继续</button>
            <button class="btn secondary" id="so-ask" style="margin-left:8px">还是不懂，问${Assistant.name()}</button>
          </div>
          <div id="so-ask-slot"></div>
        </div>`;
      this.wireSolveCard(el, q, rec.myAnswer);
      el.querySelector('#so-understood').addEventListener('click', onDone);
      el.querySelector('#so-ask').addEventListener('click', () => {
        el.querySelector('#so-understood').style.display = 'none';
        this.renderAskPanel(el.querySelector('#so-ask-slot'), rec, q, onDone);
      });
    };

    const draw = (thinking) => {
      el.innerHTML = `
        <div class="card socratic-card">
          <div class="socratic-head">
            <h2>追问式讲解</h2>
            <div class="socratic-steps">
              ${STEP_LABELS.map((l, i) => `<span class="sostep${i === step ? ' cur' : i < step ? ' done' : ''}">${i + 1}. ${l}</span>`).join('<span class="so-arrow">→</span>')}
            </div>
          </div>
          <div class="quiz-meta"><span class="muted">知识点：${this.kpName(q.knowledgePointId)} · 悬赏复盘</span></div>
          ${step < 2 ? `
            <div class="stem">${q.stem}</div>
            ${q.options ? `<div class="example-opts">${q.options.map(o => `<div class="example-opt">${o}</div>`).join('')}</div>` : ''}` : ''}
          <div class="chat-log">
            ${log.map(t => `<div class="chat-bubble ${t.role === 'assistant' ? 'from-ai' : 'from-me'}">${esc(t.content)}</div>`).join('')}
            ${thinking ? '<div class="chat-bubble from-ai chat-typing">学长在想……</div>' : ''}
          </div>
          ${step < 2 ? `
            <div class="chat-input-row">
              <input class="text-input" id="so-input" autocomplete="off" placeholder="用自己的话说一句">
              <button class="btn" id="so-send">发送</button>
            </div>` : ''}
          <div id="so-body"></div>
        </div>`;
      if (step < 2) {
        const input = el.querySelector('#so-input');
        input.addEventListener('keydown', e => { if (e.key === 'Enter') send(input.value); });
        input.focus();
        el.querySelector('#so-send').addEventListener('click', () => send(input.value));
      } else {
        this.renderSocraticRedo(el.querySelector('#so-body'), q, rec, onDone);
      }
    };

    const send = async (text) => {
      const content = String(text || '').trim();
      if (!content || busy) return;
      busy = true;
      log.push({ role: 'user', content });
      draw(true);
      const res = await Assistant.socraticGuide(step + 1, rec, q, content);
      busy = false;
      if (!res.ok) { log.pop(); degrade(res.error); return; }
      log.push({ role: 'assistant', content: res.text });
      step += 1;
      log.push({ role: 'assistant', content: STEP_ASKS[step] });
      draw(false);
    };

    draw(false);
  },

  // 第三问「重做」：同题重做一遍。本地判分、不记成绩——闭环仍按 D3/D7 走
  renderSocraticRedo(body, q, rec, onDone) {
    const opts = (q.options || []).map((o, i) => `<button class="option" data-idx="${i}">${o}</button>`).join('');
    body.innerHTML = `
      <div class="quiz-meta"><span class="muted">重做（不计成绩，验证刚才的思路）</span></div>
      <div class="stem">${q.stem}</div>
      ${q.options ? `<div class="options">${opts}</div>`
        : '<input class="text-input" id="so-fill" placeholder="填答案">'}
      <div class="quiz-actions"><button class="btn" id="so-redo-submit" disabled>提交重做</button><span class="muted" id="so-redo-hint"></span></div>
      <div id="so-redo-result"></div>`;

    let selected = [];
    const submitBtn = body.querySelector('#so-redo-submit');
    const hintEl = body.querySelector('#so-redo-hint');
    const fillEl = body.querySelector('#so-fill');
    const hasAnswer = () => {
      if (q.type === 'multi' || q.type === 'single' || q.type === 'judge') return selected.length > 0;
      if (q.type === 'fill') return fillEl ? fillEl.value.trim() !== '' : false;
      return false;
    };
    const refreshSubmit = () => { submitBtn.disabled = !hasAnswer(); hintEl.textContent = ''; };
    const options = body.querySelectorAll('.option');
    if (q.type === 'multi') {
      options.forEach(o => o.addEventListener('click', () => {
        const idx = Number(o.dataset.idx);
        selected = selected.includes(idx) ? selected.filter(i => i !== idx) : selected.concat(idx);
        options.forEach(oo => oo.classList.toggle('selected', selected.includes(Number(oo.dataset.idx))));
        refreshSubmit();
      }));
    } else if (options.length) {
      options.forEach(o => o.addEventListener('click', () => {
        selected = [Number(o.dataset.idx)];
        options.forEach(oo => oo.classList.toggle('selected', Number(oo.dataset.idx) === selected[0]));
        refreshSubmit();
      }));
    }

    body.querySelector('#so-redo-submit').addEventListener('click', () => {
      let answer = null;
      if (q.type === 'multi') answer = selected;
      else if (q.type === 'single' || q.type === 'judge') answer = selected[0];
      else if (q.type === 'fill') answer = body.querySelector('#so-fill').value;
      if (!hasAnswer()) { hintEl.textContent = '请先作答再提交'; return; }
      const ok = Quiz.grade(q, answer);
      const result = body.querySelector('#so-redo-result');
      if (ok === true) {
        result.innerHTML = `
          <div class="result good">重做对了 ✅ 刚想通的那条路就是对的——3 天后悬赏重做再验一遍，过了就销号。</div>
          <div class="quiz-actions"><button class="btn" id="so-understood">看懂了，继续</button></div>`;
      } else {
        result.innerHTML = `
          <div class="result bad">还差点火候——对照完整解析，找准岔口在哪。</div>
          <div class="muted" style="margin-top:8px"><strong>解析：</strong>${q.explanation || '（暂无解析）'}</div>
          <div class="quiz-actions">
            <button class="btn" id="so-understood">看懂了，继续</button>
            <button class="btn secondary" id="so-ask" style="margin-left:8px">还是不懂，问${Assistant.name()}</button>
          </div>
          <div id="so-ask-slot"></div>`;
        result.querySelector('#so-ask').addEventListener('click', () => {
          result.querySelector('#so-understood').style.display = 'none';
          this.renderAskPanel(result.querySelector('#so-ask-slot'), rec, q, onDone);
        });
      }
      result.querySelector('#so-understood').addEventListener('click', onDone);
    });
    refreshSubmit();
    if (fillEl) {
      fillEl.focus();
      fillEl.addEventListener('input', refreshSubmit);
      fillEl.addEventListener('keydown', e => { if (e.key === 'Enter') submitBtn.click(); });
    }
  },

  // ================= 问学长：答疑面板（练习中 / 悬赏榜 / 全局页共用） =================
  // rec/q 传 null 即全局页的自由提问；对话只存内存、不落库，单题封顶 6 轮（设计文档 §2 §6 §7）
  renderAskPanel(zone, rec, q, onDone) {
    const history = [];
    let rounds = 0;
    let err = '';
    // 思路提示先行（对比分析 B3）：错题答疑首轮只给提示，点「继续展开」才看完整讲法
    // 自由提问（无 rec/q）不启用——概念性问题没有答案可抄，先提示反而啰嗦
    let hintActive = Boolean(rec && q);
    let hintOffered = false;
    const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const full = () => rounds >= Assistant.MAX_ROUNDS;

    const draw = (thinking) => {
      zone.innerHTML = `
        <div class="ask-panel">
          <div class="ask-head">
            <strong>学长 ${Assistant.name()}</strong>
            <span class="muted">今日还能问 ${AI.quota().left} 次</span>
          </div>
          <div class="chat-log">
            ${history.map(t => `<div class="chat-bubble ${t.role === 'assistant' ? 'from-ai' : 'from-me'}">${esc(t.content)}</div>`).join('')}
            ${thinking ? '<div class="chat-bubble from-ai chat-typing">学长在想……</div>' : ''}
          </div>
          ${err ? `<div class="chat-err">${AI_MSG[err] || AI_MSG.http}</div>` : ''}
          <div class="chat-input-row">
            <input class="text-input" id="ask-input" autocomplete="off" placeholder="${full() ? '这题先聊到这，自己去写一遍' : '还想问什么？'}"${full() ? ' disabled' : ''}>
            <button class="btn" id="ask-send"${full() ? ' disabled' : ''}>发送</button>
          </div>
          <div class="chat-chips">
            ${hintOffered ? '<button id="ask-expand" class="hint-expand">💡 继续展开（看完整讲法）</button>' : ''}
            <button data-ask="换个讲法，再讲一遍">换个讲法</button>
            <button data-ask="再讲细一点，我还是没懂">再讲细点</button>
            <button data-similar="1">出道类似的</button>
          </div>
          <div class="chat-actions">
            <button class="btn secondary" id="ask-close">${rec ? '看懂了，继续' : '清空这段对话'}</button>
          </div>
        </div>`;

      const input = zone.querySelector('#ask-input');
      input.addEventListener('keydown', e => { if (e.key === 'Enter') send(input.value); });
      if (!full()) input.focus();
      zone.querySelector('#ask-send').addEventListener('click', () => send(input.value));
      const expand = zone.querySelector('#ask-expand');
      if (expand) expand.addEventListener('click', () => send('展开讲，这道题给我完整解法'));
      zone.querySelectorAll('[data-ask]').forEach(b => b.addEventListener('click', () => send(b.dataset.ask)));
      // 「出道类似的」：有原题就现编一道同知识点同题型的变式并入库；没有原题只给引导
      zone.querySelector('[data-similar]').addEventListener('click', async () => {
        hintOffered = false;
        history.push({ role: 'user', content: '出道类似的题我再练练' });
        if (!q) {
          history.push({ role: 'assistant', content: '得先有原题我才好照着变——去错题本点开一道题，那儿才有「出道类似的」。' });
          draw(false);
          return;
        }
        draw(true);
        const res = await Assistant.genVariant(q, Store.kpIndex()[q.knowledgePointId]);
        if (!res.ok) {
          history.push({ role: 'assistant', content: AI_MSG[res.error] || AI_MSG.http });
          draw(false);
          return;
        }
        const added = Store.addQuestion({
          ...res.question, knowledgePointId: q.knowledgePointId, groupId: q.groupId || '', groupRole: 'variant',
        });
        if (!added.ok) {
          history.push({ role: 'assistant', content: '跟进题没生成成功，先跳过，改天再来。' });
          draw(false);
          return;
        }
        const nq = added.question;
        const stem = Array.isArray(nq.options) && nq.options.length
          ? `${nq.stem}（${nq.options.map((o, i) => `${'ABCD'[i]}. ${o}`).join('，')}）`
          : nq.stem;
        history.push({ role: 'assistant', content: `整了道类似的，你先做做看：${stem}` });
        draw(false);
      });
      zone.querySelector('#ask-close').addEventListener('click', () => {
        if (rec) return onDone();
        history.length = 0; rounds = 0; err = ''; hintActive = false; draw(false);
      });
    };

    const send = async (text) => {
      const content = String(text || '').trim();
      if (!content || full()) return;
      rounds += 1;
      err = '';
      hintOffered = false;
      const asHint = hintActive;
      history.push({ role: 'user', content });
      draw(true);
      const res = await Assistant.askWrong(rec, q, history, asHint);
      if (res.ok) {
        history.push({ role: 'assistant', content: res.text });
        if (asHint) { hintActive = false; hintOffered = true; }
      } else {
        history.pop();   // 失败不进上下文、不占轮次
        rounds -= 1;
        err = res.error;
      }
      draw(false);
      // 失败后把那句话放回输入框：「再点一次试试」得真的点得到
      if (err && !full()) {
        const box = zone.querySelector('#ask-input');
        box.value = content;
        box.focus();
      }
    };

    draw(false);
  },

  // 全局「问学长」页：复用同一套发送/渲染逻辑，只是没有预置错题
  renderAssistant(el) {
    el.innerHTML = `
      <div class="card">
        <h2>问学长</h2>
        <p class="muted">哪里卡住直接问。他会用你听得懂的话讲——不打官腔，不讲大道理。</p>
        <div id="ask-zone"></div>
      </div>`;
    this.renderAskPanel(el.querySelector('#ask-zone'), null, null, () => this.renderAssistant(el));
  },

  // 周报 AI 评语（四铁律）+ 周度档案蒸馏（§9.5 §9.6）:放进报告页 #weekly-ai-slot
  renderWeeklyAI(slot) {
    if (!slot) return;
    if (!AI.hasKey()) {
      slot.innerHTML = `<div class="card"><h2>📝 本周 AI 评语</h2><div class="muted">填了 AI Key 后，「${Assistant.name()}」会每周根据战报写一段真实评语，并更新《理解档案》——现在先看上面的数据。</div></div>`;
      return;
    }
    slot.innerHTML = `<div class="card"><h2>📝 本周 AI 评语</h2>
      <p class="muted">让「${Assistant.name()}」根据这周战报写一段评语，并顺手把《理解档案》蒸馏一遍（只记模式与有效策略，不记能力判断）。</p>
      <div class="session-actions"><button class="btn" id="weekly-ai-btn">生成本周评语</button></div>
      <div id="weekly-ai-result"></div></div>`;
    slot.querySelector('#weekly-ai-btn').addEventListener('click', async () => {
      const btn = slot.querySelector('#weekly-ai-btn');
      const zone = slot.querySelector('#weekly-ai-result');
      btn.disabled = true;
      btn.textContent = '生成中…';
      const res = await Assistant.weekReport(Date.now());
      btn.disabled = false;
      btn.textContent = '生成本周评语';
      if (!res.ok) {
        zone.innerHTML = `<div class="muted" style="margin-top:8px">${AI_MSG[res.error] || AI_MSG.http}</div>`;
        return;
      }
      Store.settings = { ...Store.settings, learnerProfile: res.profile };
      const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
      zone.innerHTML = `<div class="ai-comment">${esc(res.comment)}</div><div class="muted" style="margin-top:8px">《理解档案》已更新。</div>`;
    });
  },

  // 月度深度复盘（阶段 3 §13.4）：AI 蒸馏档案（删过时洞察）；无 Key 给数据提示
  renderMonthlyReview(btn) {
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const zone = document.getElementById('monthly-review-result');
      const orig = btn.textContent;
      if (!AI.hasKey()) {
        if (zone) zone.innerHTML = `<div class="muted" style="margin-top:8px">填了 AI Key 后，「${Assistant.name()}」会做月度深度复盘：对照《理解档案》删掉过时洞察、更新有效策略。</div>`;
        return;
      }
      btn.disabled = true;
      btn.textContent = '复盘中…';
      const res = await Assistant.monthReport(Date.now());
      btn.disabled = false;
      btn.textContent = orig;
      if (!res.ok) {
        if (zone) zone.innerHTML = `<div class="muted" style="margin-top:8px">${AI_MSG[res.error] || AI_MSG.http}</div>`;
        return;
      }
      Store.settings = { ...Store.settings, learnerProfile: res.profile };
      const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
      if (zone) zone.innerHTML = `<div class="ai-comment">${esc(res.comment)}</div><div class="muted" style="margin-top:8px">《理解档案》已月度更新（过时洞察已删）。</div>`;
    });
  },

  // ================= 学习工具（历史时间轴 / 地理地图，纯本地 SVG） =================
  renderTools(el) {
    const detail = this._toolDetail; // 'timeline' | 'china-map' | 'world-map' | null
    if (detail) {
      const meta = { timeline: ['📜 历史时间轴', '从鸦片战争到新时代，点任意事件跳对应知识点微课'],
        'china-map': ['🗺️ 中国地图示意', '三级阶梯、长江黄河、四大地理区域、黑河—腾冲线'],
        'world-map': ['🌍 世界地图示意', '七大洲四大洋相对位置'],
        'chinese-reading': ['📖 现代文阅读图谱', '七种文体各自核心考点，点任意文体跳对应知识点微课'],
        'english-tense': ['⏳ 英语时态时间线', '五类时态在时间轴上的位置，点任意时态跳对应知识点微课'],
        'physics-formula': ['🧮 物理公式单位卡', '八个核心公式 + 单位，点任意公式跳对应知识点微课'],
        'biology-animal': ['🐾 动物类群进化图', '动物主要类群由低等到高等，点任意类群跳对应知识点'],
      }[detail];
      const bodyMap = {
        timeline: Tools.timelineHTML(),
        'china-map': Tools.chinaMapHTML(),
        'world-map': Tools.worldMapHTML(),
        'chinese-reading': Tools.chineseReadingHTML(),
        'english-tense': Tools.englishTenseHTML(),
        'physics-formula': Tools.physicsFormulaHTML(),
        'biology-animal': Tools.biologyAnimalHTML(),
      };
      const body = bodyMap[detail];
      el.innerHTML = `<div class="card">
        <div class="learn-head"><h2>${meta[0]}</h2><button class="btn secondary small" id="tool-back">← 回工具目录</button></div>
        <p class="muted">${meta[1]}${(detail === 'china-map' || detail === 'world-map') ? '；示意图不按真实边界，仅用于建立空间框架' : ''}</p>
        ${body}
      </div>`;
      el.querySelector('#tool-back').addEventListener('click', () => { this._toolDetail = null; this.renderTools(el); });
      // 时间轴/地图上的可点节点 → 跳对应知识点学习页
      el.querySelectorAll('[data-kp]').forEach(node => {
        node.addEventListener('click', () => this.openLearn(node.dataset.kp));
      });
      return;
    }
    // 工具目录
    el.innerHTML = `<div class="card hero">
      <h2>🧰 学习工具</h2>
      <p class="muted">各科随查随用的参考工具——全部本地生成，无网可用。点了就能看，看完直接跳微课。</p>
    </div>
    <div class="tool-grid">
      ${Tools.CATALOG.map(t => `
        <button class="tool-card" data-tool="${t.tool}">
          <div class="tool-icon">${t.icon}</div>
          <div class="tool-name">${t.title}</div>
          <div class="tool-desc">${t.desc}</div>
          <div class="tool-subject">${(Store.subjects.find(s => s.id === t.subjectId) || {}).name || ''}</div>
        </button>`).join('')}
    </div>`;
    el.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => { this._toolDetail = btn.dataset.tool; this.renderTools(el); });
    });
  },

  // ================= 设置 =================
  renderSettings(el) {
    const s = Store.settings;
    el.innerHTML = `
      <div class="card">
        <h2>AI 设置</h2>
        <p class="muted">诊断、错因分析、掌握度与销号全走本地规则引擎，无网可用、稳定免费；AI 只负责讲题、出题和陪伴。</p>
        <div class="field"><label>Base URL</label><input class="text-input" id="set-base" value="${s.aiBaseUrl || ''}"></div>
        <div class="field"><label>模型名</label><input class="text-input" id="set-model" value="${s.aiModel || ''}"></div>
        <div class="field"><label>API Key（仅存本地）</label><input class="text-input" id="set-key" type="password" value="${s.aiKey || ''}" placeholder="sk-..."></div>
        <div class="field"><label>每日提问上限</label><input class="text-input" id="set-limit" type="number" min="1" value="${s.dailyAiLimit || AI.DEFAULT_LIMIT}"></div>
        <div class="field"><label>会考日期（地理生物）</label><input class="text-input" id="set-exam" type="date" value="${s.examDate || Scheduler.DEFAULT_EXAM_DATE}"></div>
        <div class="field"><label>开学日期（教学日历锚点）</label><input class="text-input" id="set-term" type="date" value="${s.termStart || Scheduler.DEFAULT_TERM_START}"></div>
        <button class="btn" id="save-settings">保存</button>
        <button class="btn secondary" id="test-conn" style="margin-left:8px">测试连接</button>
      </div>
      <div class="card" id="bank-card"></div>
      <div class="card">
        <h2>🏃 考试模式 & 大考校准</h2>
        <div class="field"><label>考试模式科目（计划只排这一科冲刺）</label>
          <select class="text-input" id="set-exam-mode">
            <option value="">关闭考试模式</option>
            ${Store.subjects.map(x => `<option value="${x.id}"${s.examMode === x.id ? ' selected' : ''}>${x.name}${x.exam ? '（会考）' : ''}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>大考校准：录入实考分后按差距微调掌握度（±15 封顶）</label>
          ${Store.subjects.filter(x => x.exam).map(x => `
            <div class="field-row">
              <label>${x.name}实考分</label>
              <input class="text-input" type="number" min="0" max="100" id="exam-score-${x.id}" value="${s.examScores && s.examScores[x.id] != null ? s.examScores[x.id] : ''}" placeholder="0-100">
              <button class="btn secondary small" id="calibrate-${x.id}">校准</button>
            </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <h2>数据备份</h2>
        <p class="muted">进度全部存在这台设备的浏览器里。换设备、清缓存之前，先导出一份；在新设备上导入即可恢复。建议每周导一次。</p>
        <div class="session-actions">
          <button class="btn" id="export-data">📤 导出进度备份</button>
          <button class="btn secondary" id="import-data">📥 导入备份</button>
          <input type="file" id="import-file" accept="application/json,.json" style="display:none">
        </div>
      </div>
      <div class="card">
        <h2>危险区</h2>
        <p class="muted">重置后清空所有作答记录与掌握度，恢复初始数据。</p>
        <button class="btn danger" id="reset-data">重置数据</button>
      </div>`;

    this.renderBank(el.querySelector('#bank-card'));

    const saveSettings = () => {
      Store.settings = {
        ...Store.settings,
        aiBaseUrl: el.querySelector('#set-base').value.trim(),
        aiModel: el.querySelector('#set-model').value.trim(),
        aiKey: el.querySelector('#set-key').value.trim(),
        dailyAiLimit: Number(el.querySelector('#set-limit').value) || AI.DEFAULT_LIMIT,
        examDate: el.querySelector('#set-exam').value || '',
        termStart: el.querySelector('#set-term').value || '',
      };
    };

    el.querySelector('#save-settings').addEventListener('click', () => {
      saveSettings();
      alert('已保存');
    });

    // 测试连接：先存再打，走同一个通道，真实计费一次
    el.querySelector('#test-conn').addEventListener('click', async () => {
      const btn = el.querySelector('#test-conn');
      saveSettings();
      btn.disabled = true;
      btn.textContent = '测试中…';
      const res = await AI.testConnection();
      btn.disabled = false;
      btn.textContent = '测试连接';
      alert(res.ok ? `连接正常 ✅（今日还剩 ${AI.quota().left} 次）` : (AI_MSG[res.error] || AI_MSG.http));
    });

    // 考试模式切换（即时生效）+ 大考校准（阶段 3 §13.2 §13.4）
    const examModeSel = el.querySelector('#set-exam-mode');
    if (examModeSel) examModeSel.addEventListener('change', () => {
      const id = examModeSel.value;
      if (id) Scheduler.setExamMode(id);
      else Scheduler.clearExamMode();
      alert(id ? `已进入「${(Store.subjects.find(x => x.id === id) || {}).name}」考试模式，计划只排这一科。` : '已退出考试模式。');
    });
    Store.subjects.filter(x => x.exam).forEach(x => {
      const btn = el.querySelector('#calibrate-' + x.id);
      if (!btn) return;
      btn.addEventListener('click', () => {
        const input = el.querySelector('#exam-score-' + x.id);
        const res = Scheduler.calibrate(x.id, input.value.trim(), Date.now());
        if (!res.ok) { alert(res.error); return; }
        alert(res.delta >= 0
          ? `校准完成：该科各知识点掌握度 +${res.delta}（原均分 ${res.avg} → 实考 ${res.score}）。`
          : `校准完成：该科各知识点掌握度 ${res.delta}（原均分 ${res.avg} → 实考 ${res.score}）。`);
      });
    });

    // 导出：下载 JSON 备份文件
    el.querySelector('#export-data').addEventListener('click', () => {
      const payload = Store.exportData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      const d = new Date();
      a.href = URL.createObjectURL(blob);
      a.download = 'tutor-backup-'
        + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0')
        + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });

    // 导入：选文件 → 确认 → 覆盖恢复 → 刷新
    el.querySelector('#import-data').addEventListener('click', () => el.querySelector('#import-file').click());
    el.querySelector('#import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        let payload;
        try { payload = JSON.parse(reader.result); }
        catch (err) { alert('这不是合法的备份文件'); return; }
        if (!confirm('导入会覆盖当前全部进度，确定继续？')) return;
        const res = Store.importData(payload);
        if (res.ok) {
          alert('已恢复 ' + res.count + ' 项数据，页面即将刷新');
          location.reload();
        } else {
          alert(res.error);
        }
      };
      reader.readAsText(file);
    });

    el.querySelector('#reset-data').addEventListener('click', () => {
      if (confirm('确定重置所有数据？')) {
        this.session = null;
        this._clearSession();
        Store.reset(SEED);
        this.show('practice');
      }
    });
  },

  // ================= 题库管理（设置页内卡片）：列表 + 新增/编辑表单 + 删除 =================
  bankEditId: null,   // null=列表态 | 'new'=新增 | 题目id=编辑
  bankSubject: '',    // 卡片内独立的科目筛选（不影响练习页的当前科目）

  bankEsc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  bankKpPath(kp) {
    const idx = Store.kpIndex();
    const parts = [];
    let cur = kp;
    while (cur && cur.level > 1) { parts.unshift(cur.name); cur = idx[cur.parentId]; }
    return parts.join(' · ');
  },

  // draft：表单内换题型/增删选项时传入的未落库草稿（防丢输入）
  renderBank(card, draft) {
    if (!this.bankSubject) {
      const cur = this.activeSubject();
      this.bankSubject = cur ? cur.id : (Store.subjects[0] || {}).id || '';
    }
    const sid = this.bankSubject;
    const TYPE_LABEL = { single: '单选', multi: '多选', judge: '判断', fill: '填空', subjective: '主观' };
    const kps = Store.knowledgePoints.filter(k => k.subjectId === sid && k.level === 4);
    const qs = Store.questions.filter(q => q.subjectId === sid);

    // 编辑态对象：草稿 > 新增默认骨架 > 现有题
    let editing = draft || null;
    if (!editing && this.bankEditId === 'new') {
      editing = { knowledgePointId: kps[0] ? kps[0].id : '', type: 'single', stem: '', options: ['', '', '', ''], answer: 0,
        explanation: '', difficulty: 2, expectedTime: 30, groupId: '', groupRole: 'basic' };
    } else if (!editing && this.bankEditId) {
      editing = Store.questionIndex()[this.bankEditId] || null;
      if (!editing) this.bankEditId = null;
    }

    let formHtml = '';
    if (editing) {
      const optRows = (editing.type === 'single' || editing.type === 'multi')
        ? editing.options.map((o, i) => `
            <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
              <input class="text-input" data-opt value="${this.bankEsc(o)}" style="flex:1" placeholder="选项 ${i + 1}">
              <label style="display:flex;align-items:center;gap:2px;font-size:13px;color:var(--muted)">
                <input type="${editing.type === 'multi' ? 'checkbox' : 'radio'}" data-ans name="bank-opt-ans" value="${i}" ${[].concat(editing.answer).map(Number).includes(i) ? 'checked' : ''}>答案</label>
              <button class="btn secondary" data-del-opt="${i}" ${editing.options.length <= 2 ? 'disabled' : ''} style="padding:4px 10px">✕</button>
            </div>`).join('')
        : '';
      const ansField = editing.type === 'judge'
        ? `<div class="field"><label>答案</label>
            <label style="font-size:14px"><input type="radio" data-ans name="bank-judge" value="0" ${Number(editing.answer) === 0 ? 'checked' : ''}> 对</label>
            <label style="font-size:14px;margin-left:14px"><input type="radio" data-ans name="bank-judge" value="1" ${Number(editing.answer) === 1 ? 'checked' : ''}> 错</label></div>`
        : (editing.type === 'fill' || editing.type === 'subjective')
          ? `<div class="field"><label>${editing.type === 'fill' ? '答案（填空）' : '参考答案（自评对照用）'}</label>
              <textarea class="text-input" id="bank-ans" rows="2">${this.bankEsc(editing.answer)}</textarea></div>`
          : '';
      formHtml = `
        <h3>${this.bankEditId === 'new' ? '新增题目' : '编辑题目'}</h3>
        <div class="field"><label>知识点（仅列当前科目的叶子节点）</label>
          <select class="text-input" id="bank-kp">${kps.map(k =>
            `<option value="${k.id}"${k.id === editing.knowledgePointId ? ' selected' : ''}>${this.bankEsc(this.bankKpPath(k))}</option>`).join('')}</select></div>
        <div class="field"><label>题型</label>
          <select class="text-input" id="bank-type">${Object.keys(TYPE_LABEL).map(t =>
            `<option value="${t}"${t === editing.type ? ' selected' : ''}>${TYPE_LABEL[t]}</option>`).join('')}</select></div>
        <div class="field"><label>题干</label>
          <textarea class="text-input" id="bank-stem" rows="3" placeholder="题干（填空题用 ____ 表示空格）">${this.bankEsc(editing.stem)}</textarea></div>
        ${optRows ? `<div class="field"><label>选项与答案（${editing.type === 'multi' ? '勾选全部正确项' : '勾选正确项'}）</label>${optRows}
          <button class="btn secondary" id="bank-add-opt" style="padding:4px 10px">+ 加一个选项</button></div>` : ''}
        ${ansField}
        <div class="field"><label>解析（答错时展示，也是主观题的对照材料）</label>
          <textarea class="text-input" id="bank-exp" rows="3">${this.bankEsc(editing.explanation)}</textarea></div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <div class="field" style="flex:1;min-width:120px"><label>难度（1~5）</label>
            <select class="text-input" id="bank-diff">${[1, 2, 3, 4, 5].map(d =>
              `<option value="${d}"${d === editing.difficulty ? ' selected' : ''}>${d}</option>`).join('')}</select></div>
          <div class="field" style="flex:1;min-width:120px"><label>预计用时（秒）</label>
            <input class="text-input" id="bank-time" type="number" min="5" step="5" value="${editing.expectedTime}"></div>
          <div class="field" style="flex:1;min-width:120px"><label>题组标注（可空）</label>
            <input class="text-input" id="bank-group" value="${this.bankEsc(editing.groupId)}" placeholder="如 ex-g8a-p7"></div>
          <div class="field" style="flex:1;min-width:120px"><label>题组角色</label>
            <select class="text-input" id="bank-role">${['basic', 'variant'].map(r =>
              `<option value="${r}"${r === editing.groupRole ? ' selected' : ''}>${r === 'basic' ? '基础题' : '变式题'}</option>`).join('')}</select></div>
        </div>
        <button class="btn" id="bank-save">保存</button>
        <button class="btn secondary" id="bank-cancel" style="margin-left:8px">取消</button>`;
    }

    const listHtml = qs.length === 0
      ? '<p class="empty">这个科目还没有题目</p>'
      : qs.map(q => `
          <div style="display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line,#eee)">
            <span class="badge">${TYPE_LABEL[q.type] || q.type}</span>
            ${q.id.startsWith('c-') ? '<span class="badge">自</span>' : ''}
            <span style="flex:1;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this.bankEsc(q.stem)}</span>
            <span class="muted" style="font-size:12px;white-space:nowrap">${this.bankKpPath(Store.kpIndex()[q.knowledgePointId] || {})}</span>
            <button class="btn secondary" data-edit-q="${q.id}" style="padding:4px 10px">编辑</button>
            <button class="btn danger" data-del-q="${q.id}" style="padding:4px 10px">删除</button>
          </div>`).join('');

    card.innerHTML = `
      <h2>题库管理</h2>
      <p class="muted">录入自己的题目进练习流（错题重做、变式检测一起生效）。自定义题可编辑可删除，种子题编辑后同样生效。</p>
      <div class="field"><label>科目</label>
        <select class="text-input" id="bank-subject">${Store.subjects.map(s =>
          `<option value="${s.id}"${s.id === sid ? ' selected' : ''}>${s.name}</option>`).join('')}</select></div>
      <div class="session-actions" style="margin:0 0 10px">
        <button class="btn" id="bank-new">+ 新增题目</button>
        <span class="muted">${qs.length} 题 · ${kps.length} 个知识点</span>
      </div>
      ${formHtml || listHtml}`;

    this.bindBank(card);
  },

  // 表单当前值（换题型/加删选项时先收集再重渲染，防丢输入）
  bankCollect(card) {
    const type = card.querySelector('#bank-type') ? card.querySelector('#bank-type').value : 'single';
    const data = {
      knowledgePointId: card.querySelector('#bank-kp') ? card.querySelector('#bank-kp').value : '',
      type,
      stem: card.querySelector('#bank-stem') ? card.querySelector('#bank-stem').value : '',
      explanation: card.querySelector('#bank-exp') ? card.querySelector('#bank-exp').value : '',
      difficulty: card.querySelector('#bank-diff') ? Number(card.querySelector('#bank-diff').value) : 2,
      expectedTime: card.querySelector('#bank-time') ? Number(card.querySelector('#bank-time').value) : 30,
      groupId: card.querySelector('#bank-group') ? card.querySelector('#bank-group').value : '',
      groupRole: card.querySelector('#bank-role') ? card.querySelector('#bank-role').value : 'basic',
    };
    if (type === 'single' || type === 'multi') {
      data.options = [...card.querySelectorAll('[data-opt]')].map(i => i.value);
      data.answer = [...card.querySelectorAll('[data-ans]:checked')].map(i => Number(i.value));
      if (type === 'single') data.answer = data.answer.length ? data.answer[0] : 0;
    } else if (type === 'judge') {
      const c = card.querySelector('[data-ans]:checked');
      data.answer = c ? Number(c.value) : 0;
    } else {
      data.answer = card.querySelector('#bank-ans') ? card.querySelector('#bank-ans').value : '';
    }
    return data;
  },

  bindBank(card) {
    const rerender = () => this.renderBank(card);
    const subj = card.querySelector('#bank-subject');
    if (subj) subj.addEventListener('change', () => { this.bankSubject = subj.value; this.bankEditId = null; rerender(); });
    const newBtn = card.querySelector('#bank-new');
    if (newBtn) newBtn.addEventListener('click', () => { this.bankEditId = 'new'; rerender(); });

    card.querySelectorAll('[data-edit-q]').forEach(btn => btn.addEventListener('click', () => { this.bankEditId = btn.dataset.editQ; rerender(); }));
    card.querySelectorAll('[data-del-q]').forEach(btn => btn.addEventListener('click', () => {
      const q = Store.questionIndex()[btn.dataset.delQ];
      if (!q) return;
      if (!confirm(`删除这道题？${q.stem.slice(0, 20)}…\n（错题本里对它的悬赏也会一并清掉）`)) return;
      const res = Store.deleteQuestion(btn.dataset.delQ);
      if (!res.ok) alert(res.error);
      rerender();
    }));

    // 表单态：换题型/加删选项 → 收集现值重渲染（草稿防丢输入）
    const typeSel = card.querySelector('#bank-type');
    if (typeSel) typeSel.addEventListener('change', () => {
      const cur = this.bankCollect(card);
      cur.type = typeSel.value;
      if (cur.type === 'fill' || cur.type === 'subjective' || cur.type === 'judge') {
        cur.options = []; cur.answer = cur.type === 'judge' ? 0 : '';
      } else if (!cur.options || cur.options.length < 2) {
        cur.options = ['', '', '', '']; cur.answer = 0;
      }
      this.renderBank(card, cur);
    });
    const addOpt = card.querySelector('#bank-add-opt');
    if (addOpt) addOpt.addEventListener('click', () => {
      const cur = this.bankCollect(card);
      cur.options.push('');
      this.renderBank(card, cur);
    });
    card.querySelectorAll('[data-del-opt]').forEach(btn => btn.addEventListener('click', () => {
      const cur = this.bankCollect(card);
      cur.options.splice(Number(btn.dataset.delOpt), 1);
      cur.answer = [].concat(cur.answer).map(Number).filter(i => i < cur.options.length);
      this.renderBank(card, cur);
    }));
    const cancel = card.querySelector('#bank-cancel');
    if (cancel) cancel.addEventListener('click', () => { this.bankEditId = null; rerender(); });
    const save = card.querySelector('#bank-save');
    if (save) save.addEventListener('click', () => {
      const data = this.bankCollect(card);
      const res = this.bankEditId === 'new' ? Store.addQuestion(data) : Store.updateQuestion(this.bankEditId, data);
      if (!res.ok) { alert(res.error); return; }
      this.bankEditId = null;
      rerender();
    });
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
