// 主控 v2：路由 + 关卡化练习流 UI + 错因自选（先归因再解析）+ 微课嵌入 + 错题榜 + 设置
// 规则来源：开发文档 §7 §8 §10 §11（计时器隐身、归因语言、翻译不贴皮）
const ERROR_TYPES = [
  { key: '概念', label: '概念没吃透', hint: '知识点本身没理解' },
  { key: '程序', label: '步骤乱了', hint: '思路对，做错步骤' },
  { key: '审题', label: '题看岔了', hint: '漏条件、看错数字' },
  { key: '计算', label: '算失误了', hint: '思路对，计算出错' },
];

// 答疑异常时的中文降级话术（设计文档 §8）：绝不给孩子看空白或英文报错
const AI_MSG = {
  noKey: '爸爸还没上线——去「设置」里填一下 AI Key 就能问他了。',
  quota: '今天问爸爸的次数用完了，先去把题重做一遍。',
  truncated: '爸爸想太久了，没说完。再点一次试试。',
  badKey: 'Key 好像不对，去「设置」里检查一下。',
  rateLimited: '爸爸正忙，先看上面的解析。',
  timeout: '网有点慢，再点一次试试。',
  network: '网好像断了，先看上面的解析。',
  http: '爸爸开小差了，先看上面的解析。',
};

// 开机欢迎语池：每次启动随机抽一句，温暖 / 激励 / 搞怪 / 搞笑混着来
const WELCOME_LINES = [
  '俊成主人！我是你的学习辅助系统',
  '俊成主人，今天也要元气满满地开挂哦',
  '欢迎回来，俊成主人！错题们都等着被你收拾呢',
  '报告主人：学习能量已充满，随时可以出发',
  '俊成主人，别怕难题——难题见了你才怕',
  '主人上线！学霸之路，就从这一题开始',
  '俊成主人，今天偷偷努力，明天惊艳所有人',
  '俊成主人，脑子越用越灵光，来一题试试',
  '主人驾到！学一题赚一题，稳住别浪',
  '俊成主人，卷起来，也记得对自己温柔一点',
  '俊成主人，今天比昨天厉害一点点就够啦',
  '主人好！系统已就位，请下达学习命令',
];

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
  _placementDismissed: false, // 摸底引导「跳过」只收起本次渲染（内存态，刷新再现）
  dailyPlan: null,
  learnKpId: null,  // 学习页当前知识点（从知识树点进来）
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
      btn.addEventListener('click', () => btn.dataset.view === 'assistant' ? this.openDadModal() : this.show(btn.dataset.view));
    });
    const dadFab = document.getElementById('dad-fab'); // 全局右侧悬浮入口：点一下弹「问爸爸」弹窗（不跳页）
    if (dadFab) dadFab.addEventListener('click', () => this.openDadModal());
    if (typeof Sync !== 'undefined') Sync.init(); // 已配置云同步时：启动拉取比对 + 关页兜底
    this.show('practice');
    this.showWelcome();
  },

  // 开机欢迎页：每次启动随机一句问候，弹性弹出、约 2.6 秒后自动淡出，点任意处可立即关闭
  showWelcome() {
    const KEY = 'tutor.welcomeIdx';
    let idx = Math.floor(Math.random() * WELCOME_LINES.length);
    let last = -1;
    try { last = Number(sessionStorage.getItem(KEY)); } catch (e) {}
    if (WELCOME_LINES.length > 1 && idx === last) idx = (idx + 1) % WELCOME_LINES.length;
    try { sessionStorage.setItem(KEY, String(idx)); } catch (e) {}

    const mask = document.createElement('div');
    mask.className = 'welcome-mask';
    mask.innerHTML = `
      <div class="welcome-card">
        <div class="welcome-glow"></div>
        <img class="welcome-photo" src="assets/welcome-hero.png" alt="加油">
        <p class="welcome-line">${WELCOME_LINES[idx]}</p>
        <p class="welcome-hint">点击任意处进入</p>
      </div>`;
    document.body.appendChild(mask);

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      mask.classList.add('out');
      setTimeout(() => mask.remove(), 400);
    };
    mask.addEventListener('click', close);
    setTimeout(close, 2600);
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
    const dadFab = document.getElementById('dad-fab');
    if (dadFab) dadFab.classList.toggle('hidden', view === 'assistant'); // 已在该页则收起悬浮框
    window.scrollTo(0, 0);
    if (view === 'practice') this.renderPractice(this.el);
    else if (view === 'report') { Report.render(this.el); this.renderMonthlyReview(this.el.querySelector('#monthly-review-btn')); }
    else if (view === 'brief') this.renderBrief(this.el);
    else if (view === 'grade') this.renderGradeReport(this.el);
    else if (view === 'learn') this.renderLearn(this.el);
    else if (view === 'wrongbook') this.renderWrongbook(this.el);
    else if (view === 'assistant') this.renderAssistant(this.el);
    else if (view === 'tools') this.renderTools(this.el);
    else if (view === 'settings') this.renderSettings(this.el);
    else if (view === 'guide') this.renderGuide(this.el);
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
      <button class="subject-chip${cur && s.id === cur.id ? ' active' : ''}" data-subject="${s.id}">${s.name}</button>`).join('')}</div>`;
  },

  bindSubjectBar(el, rerender) {
    el.querySelectorAll('[data-subject]').forEach(btn => {
      btn.addEventListener('click', () => {
        Store.activeSubjectId = btn.dataset.subject;
        rerender();
      });
    });
  },

  // ================= 学到哪儿（§需求2）：先选册再选章再选节，登记当前进度；出题只出「学到这儿为止」的已学知识点 =================
  unitScopeFor(sid) {
    const cur = Store.unitScope[sid] || {};
    return { bookId: cur.bookId || '', chapterId: cur.chapterId || '', sectionId: cur.sectionId || '' };
  },

  setUnitScope(sid, bookId, chapterId, sectionId) {
    const all = Store.unitScope;
    all[sid] = { bookId: bookId || '', chapterId: chapterId || '', sectionId: sectionId || '' };
    Store.unitScope = all;
  },

  // 学到哪儿（下拉菜单）：本 / 单元 / 节三层常驻；上级未选时下级置灰并提示「先选上一级」；空值 = 未登记/整册/整章
  unitBar(sid) {
    const kps = Store.knowledgePoints.filter(k => k.subjectId === sid);
    const books = kps.filter(k => k.level === 1).sort((a, b) => a.order - b.order);
    if (books.length === 0) return '';
    const cur = this.unitScopeFor(sid);
    const bookOpts = `<option value=""${cur.bookId ? '' : ' selected'}>未登记</option>`
      + books.map(b => `<option value="${b.id}"${cur.bookId === b.id ? ' selected' : ''}>${b.name}</option>`).join('');
    const chapters = cur.bookId
      ? kps.filter(k => k.level === 2 && k.parentId === cur.bookId).sort((a, b) => a.order - b.order)
      : [];
    const chapterOpts = cur.bookId
      ? `<option value=""${cur.chapterId ? '' : ' selected'}>整册</option>`
        + chapters.map(c => `<option value="${c.id}"${cur.chapterId === c.id ? ' selected' : ''}>${c.name}</option>`).join('')
      : '<option value="" selected>先选上一级</option>';
    const sections = cur.chapterId
      ? kps.filter(k => k.level === 3 && k.parentId === cur.chapterId).sort((a, b) => a.order - b.order)
      : [];
    const sectionOpts = cur.chapterId
      ? `<option value=""${cur.sectionId ? '' : ' selected'}>整章</option>`
        + sections.map(s => `<option value="${s.id}"${cur.sectionId === s.id ? ' selected' : ''}>${s.name}</option>`).join('')
      : '<option value="" selected>先选上一级</option>';
    const bName = (books.find(b => b.id === cur.bookId) || {}).name || '';
    const cName = (chapters.find(c => c.id === cur.chapterId) || {}).name || '';
    const sName = (sections.find(s => s.id === cur.sectionId) || {}).name || '';
    const note = cur.bookId
      ? `出题范围：学到「${bName}${cName ? ' · ' + cName : ''}${sName ? ' · ' + sName : ''}」为止，之前的都算学过，没学到的不会出；当前单元题不够一组（6 题）时，爸爸会按真题风格现场补几道（需 AI Key）。`
      : '还没登记「学到哪儿」：系统会从整科出题，可能出到还没学的知识点。建议选到当前学到的那一节，之前的都算学过，就不会超纲。';
    return `
      <div class="unit-picker">
        <div class="unit-row"><span class="unit-label">学到哪本</span><select class="unit-select" data-unit-book>${bookOpts}</select></div>
        <div class="unit-row"><span class="unit-label">学到哪单元</span><select class="unit-select" data-unit-chapter${cur.bookId ? '' : ' disabled'}>${chapterOpts}</select></div>
        <div class="unit-row"><span class="unit-label">学到哪节</span><select class="unit-select" data-unit-section${cur.chapterId ? '' : ' disabled'}>${sectionOpts}</select></div>
        <div class="unit-note muted">${note}</div>
      </div>`;
  },

  bindUnitBar(el, sid, rerender) {
    const book = el.querySelector('[data-unit-book]');
    if (book) book.addEventListener('change', () => {
      this.setUnitScope(sid, book.value, '');
      rerender();
    });
    const chapter = el.querySelector('[data-unit-chapter]');
    if (chapter) chapter.addEventListener('change', () => {
      this.setUnitScope(sid, this.unitScopeFor(sid).bookId, chapter.value);
      rerender();
    });
    const section = el.querySelector('[data-unit-section]');
    if (section) section.addEventListener('change', () => {
      const cur = this.unitScopeFor(sid);
      this.setUnitScope(sid, cur.bookId, cur.chapterId, section.value);
      rerender();
    });
  },

  // 需求6：选了范围后，范围内题目不够一组（6 题）时，爸爸按真题风格现场补足（§需求3 生成能力的复用）
  // 生成结果经 Store.addQuestion 入库并持久化，是一次性的：补过就不再补
  // 同一 L4 的多道题合并成一次调用（一次 AI.chat 只扣 1 次额度），能少花就少花
  // 无 Key / 超额 / 生成失败一律静默跳过（返回已补题数），不阻塞开练
  async ensureScopeQuestions(need, onProgress) {
    if (!AI.hasKey()) return 0;
    const scopeIds = Quiz.learnedKpIds();
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
  // 辅导主入口（从知识树点进来）：先看清现状，再学（微课/例题），学完就练一组专项
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
          <button class="btn secondary small" id="back-report">← 回知识树</button>
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

  // ================= 入学摸底 =================
  // 首次使用某科目：探针题校准初始掌握度（默认 50 分「未知」会让诊断/调度第一天全靠猜）
  renderPlacementIntro(el) {
    const sid = this.activeSubject() ? this.activeSubject().id : '';
    const subjName = this.activeSubject() ? this.activeSubject().name : '这一科';
    const active = Store.placement.active;
    const resume = active && active.subjectId === sid && active.idx > 0 && active.idx < active.order.length;
    const { pos, total } = Placement.progress();
    el.innerHTML = `
      <div class="card hero">
        <h2>🧭 ${subjName}·入学摸底（约 6 分钟）</h2>
        <p class="muted">这不是考试——做几道有代表性的题，让系统知道你哪些已经会、哪里还不稳，<br>之后每天推的题才不会太简单或太难。答错不扣任何东西，放心写。</p>
        <div class="session-actions">
          <button class="btn big glow" id="placement-start">${resume ? `继续摸底（第 ${pos}/${total} 题）` : '开始摸底'}</button>
          <button class="btn secondary" id="placement-skip">跳过，直接开练</button>
        </div>
      </div>`;
    el.querySelector('#placement-start').addEventListener('click', () => {
      const cur = Store.placement.active;
      if (!cur || cur.subjectId !== sid) {
        if (!Placement.build(sid)) {
          Ui.popup('暂无可摸底的题', `${subjName}题库还没准备好摸底内容，先直接练吧。`, 'cool');
          this._placementDismissed = true;
          return this.renderPractice(el);
        }
      }
      this.renderPlacementQuestion(el);
    });
    el.querySelector('#placement-skip').addEventListener('click', () => {
      this._placementDismissed = true;
      this.renderPractice(el);
    });
  },

  renderPlacementQuestion(el) {
    const fab = document.getElementById('dad-fab');
    if (fab) fab.classList.add('hidden'); // 答题页收起悬浮球，别挡题干和选项
    const q = Placement.current();
    if (!q) return this.renderPlacementEnd(el, Placement.finish());
    this.startAt = Date.now();
    this.answered = false;
    const { pos, total } = Placement.progress();
    const typeLabel = { single: '单选', multi: '多选', fill: '填空', judge: '判断' }[q.type];
    let body = '';
    if (q.type === 'single' || q.type === 'judge' || q.type === 'multi') {
      body = `<div class="options" id="options">` + q.options.map((opt, i) =>
        `<button class="option" data-idx="${i}">${opt}</button>`).join('') + `</div>`;
    } else {
      body = `<input class="fill-input" id="fill-answer" placeholder="输入答案" autocomplete="off">`;
    }
    el.innerHTML = `
      <div class="card quiz">
        <div class="quiz-top">
          <span class="stage-badge">入学摸底</span>
          <span class="muted">第 ${pos}/${total} 题 · ${typeLabel} · 难度 ${'★'.repeat(q.difficulty)}</span>
          <button class="btn secondary small" id="placement-quit" style="margin-left:auto">退出</button>
        </div>
        <div class="stem">${q.stem}</div>
        ${body}
        <div id="result-zone"></div>
        <div class="quiz-actions" id="action-zone">
          <button class="btn" id="submit-btn" disabled>提交</button>
          <span class="muted" id="submit-hint"></span>
        </div>
      </div>`;
    this.bindPlacement(q, el);
  },

  bindPlacement(q, el) {
    const options = el.querySelectorAll('.option');
    const submitBtn = el.querySelector('#submit-btn');
    const hint = el.querySelector('#submit-hint');
    let selected = [];
    const hasAnswer = () => {
      if (q.type === 'multi' || q.type === 'single' || q.type === 'judge') return selected.length > 0;
      return (el.querySelector('#fill-answer').value || '').trim() !== '';
    };
    const refresh = () => { submitBtn.disabled = !hasAnswer(); hint.textContent = ''; };
    if (q.type === 'multi') {
      options.forEach(o => o.addEventListener('click', () => {
        const idx = Number(o.dataset.idx);
        selected = selected.includes(idx) ? selected.filter(i => i !== idx) : selected.concat(idx);
        options.forEach(oo => oo.classList.toggle('selected', selected.includes(Number(oo.dataset.idx))));
        refresh();
      }));
    } else if (options.length) {
      options.forEach(o => o.addEventListener('click', () => {
        selected = [Number(o.dataset.idx)];
        options.forEach(oo => oo.classList.toggle('selected', Number(oo.dataset.idx) === selected[0]));
        refresh();
      }));
    }
    const submit = () => {
      if (this.answered) return;
      if (!hasAnswer()) { hint.textContent = '请先作答再提交'; return; }
      const answer = q.type === 'multi' ? selected
        : (q.type === 'single' || q.type === 'judge') ? selected[0]
        : el.querySelector('#fill-answer').value;
      this.submitPlacement(q, answer, el);
    };
    submitBtn.addEventListener('click', submit);
    refresh();
    const fill = el.querySelector('#fill-answer');
    if (fill) {
      fill.focus();
      fill.addEventListener('input', refresh);
      fill.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    }
    el.querySelector('#placement-quit').addEventListener('click', () => {
      if (!confirm('退出摸底？进度会保留，下次进来从这一题继续。')) return;
      this.renderPractice(el);
    });
  },

  submitPlacement(q, answer, el) {
    const actualTime = (Date.now() - this.startAt) / 1000;
    const correct = Quiz.grade(q, answer) === true;
    this.answered = true;
    Placement.record(q, correct, actualTime, Date.now());
    // 揭晓：对 → 直接下一题；错 → 给答案和解析（摸底是这些点的第一次讲解）
    let correctText = '';
    if (q.type === 'single' || q.type === 'judge' || q.type === 'multi') {
      const correctSet = q.type === 'multi' ? (Array.isArray(q.answer) ? q.answer : [q.answer]).map(Number) : [Number(q.answer)];
      const userSet = (Array.isArray(answer) ? answer : [answer]).map(Number);
      el.querySelectorAll('.option').forEach(o => {
        const idx = Number(o.dataset.idx);
        if (correctSet.includes(idx)) o.classList.add('correct');
        else if (!correct && userSet.includes(idx)) o.classList.add('wrong');
      });
      if (!correct) correctText = correctSet.map(i => q.options[i]).join('、');
    }
    const zone = el.querySelector('#result-zone');
    // 对错结论放最前面（大字彩条），别让学生靠猜颜色判断（学生体验 ISSUE）
    zone.innerHTML = correct
      ? `<div class="result good">✅ 答对了！这题你是稳的。</div>
         <div class="muted" style="margin-top:8px"><strong>解析：</strong>${q.explanation || '（暂无解析）'}</div>`
      : `<div class="result bad">❌ 答错了${correctText ? `，正确答案是 <strong>${correctText}</strong>` : ''}——这题不稳，看一眼解析，不用记。</div>
         ${q.type === 'fill' ? this.answerCompareHTML(q, answer) : ''}
         <div class="muted" style="margin-top:8px"><strong>解析：</strong>${q.explanation || '（暂无解析）'}</div>`;
    // 手机上反馈常落在视口外，提交后自动带过来，省得学生自己往下划
    zone.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const actions = el.querySelector('#action-zone');
    actions.innerHTML = `<button class="btn" id="placement-next">下一题</button>`;
    actions.querySelector('#placement-next').addEventListener('click', () => this.renderPlacementQuestion(el));
  },

  renderPlacementEnd(el, summary) {
    if (!summary) return this.renderPractice(el);
    const idx = Store.kpIndex();
    const weak = summary.weakKps.map(id => (idx[id] ? idx[id].name : '')).filter(Boolean);
    el.innerHTML = `
      <div class="card hero">
        <h2>🧭 摸底完成：${summary.correctCount}/${summary.total} 题通过</h2>
        <p class="muted">系统对你的起点有数了，今天的计划已经按实测水平安排。</p>
        ${weak.length ? `
          <p style="margin-top:8px"><strong>已标记不稳的点：</strong>${weak.join('、')}</p>
          <p class="muted">这些点不会硬塞给你刷题——系统会先带你回炉看微课，学完自测通过再进练习。</p>` : `
          <p style="margin-top:8px">基础探针全过，系统会从更高一点的难度开始安排。</p>`}
        <div class="session-actions">
          <button class="btn big glow" id="placement-done">好，开始今天的练习</button>
        </div>
      </div>`;
    el.querySelector('#placement-done').addEventListener('click', () => this.renderPractice(el));
  },

  // ================= 练习：开工 =================
  // 今日计划（Scheduler 决策）+ 科目自选（自主权规范 §11.1：系统推荐 + 自己确认/调整）
  renderPractice(el) {
    const fab = document.getElementById('dad-fab');
    if (fab) fab.classList.remove('hidden'); // 回到列表页恢复「问爸爸」悬浮球
    // 中途离开再回来：继续当前 session
    if (this.session && this.session.idx < this.session.stages.length) {
      return this.renderStage(el);
    }
    // 刷新/重开页面：本地存着没练完的题组 → 让用户自己选「继续 / 重开」（ISSUE-006）
    const saved = this._loadSession();
    if (saved) return this.renderResumeSession(el, saved);
    const now = Date.now();
    const sid = this.activeSubject() ? this.activeSubject().id : '';
    // 入学摸底：该科目未摸底且未被本次会话跳过 → 先引导摸底（摸底前的今日计划基于默认分，是瞎推的）
    if (!this._placementDismissed && sid && Placement.needed(sid)) return this.renderPlacementIntro(el);
    const blocks = Scheduler.plan(now, this.planSalt);
    this.dailyPlan = blocks;
    const subjName = id => { const s = Store.subjects.find(x => x.id === id); return s ? s.name : ''; };
    const modeCls = { '悬赏清缴': 'bounty', '保养加固': 'maintain' };
    const modeIcon = { '悬赏清缴': '🎯', '保养加固': '🛠️', '突破摸底': '⚔️', '突破推进': '⚔️', '考试冲刺': '🔥' };
    // 本周习惯 + 免死金牌（对比分析 B1）：今天断签自动保底 1 天并提示一次（一次性）
    const habit = Scheduler.habit(now);
    if (habit.protect) {
      Scheduler.useShield(now);
      Ui.popup('🛡️ 免死金牌自动启用', '今天还没开张，本周习惯先保底 1 天。明天练起来，别把金牌当枕头。', 'cool');
    }
    // 连续全勤表扬：本周首次达成 7/7 时触发一次（按 weekKey 去重，避免每次进主页重复）
    if (habit.effective >= 7 && (Store.settings || {}).praiseFullWeek !== habit.weekKey) {
      Store.settings = { ...Store.settings, praiseFullWeek: habit.weekKey };
      Celebrate.praise({ title: '连续全勤！妈妈给你颁个奖 🏆', text: '本周 7 天全勤，说到做到，太棒啦！' });
    }
    // 放松小游戏（阶段 3 §10.5：奖励性收尾，数据回流掌握度/复习队列）；周末彩蛋家长挑战
    const isWeekend = [0, 6].includes(new Date(now).getDay());
    const dueWords = Games.flashDue(now).length;
    const arithDone = (Store.dayStat(Store.todayKey(now)).arithRounds || 0) > 0;
    el.innerHTML = `
      ${this.statusStripHTML(now, habit, blocks)}
      <div class="card hero plan-card">
        <h2>📋 今日计划，点一块直接开练</h2>
        <div class="plan-grid">
          ${blocks.map((b, i) => `
            <button class="plan-block mode-${modeCls[b.mode] || 'break'}${i === 0 ? ' primary' : ''}" id="${i === 0 ? 'start-session' : ''}" data-plan="${b.subjectId}">
              <span class="plan-tag">${modeIcon[b.mode] || '⚔️'} ${b.mode}</span>
              <span class="plan-subject">${subjName(b.subjectId)}</span>
              <span class="plan-reasons">${b.reasons.join(' · ')}</span>
              <span class="plan-count">${b.count} 题 · 约 15 分钟（含讲解）${this.planDone.includes(b.subjectId) ? ' · ✅ 已完成' : ''}</span>
            </button>`).join('')}
          <button class="plan-block mode-break" id="daily-arith">
            <span class="plan-tag">⚡ 每日速算</span>
            <span class="plan-subject">计算基本功 · 5 分钟</span>
            <span class="plan-reasons">负数 / 乘方 / 去括号 / 分式</span>
            <span class="plan-count">${arithDone ? '✅ 今日已完成' : '每天练一把，计算不丢分'}</span>
          </button>
        </div>
        <div class="session-actions">
          ${blocks.length ? '<button class="btn big glow" id="start-now">▶ 点我开工</button>' : ''}
          ${blocks.length === 0 ? '<button class="btn big glow" id="start-session-fallback">开整（6 题一组，含讲解约 15 分钟）</button>' : ''}
          <button class="btn secondary" id="reroll-plan">🔄 换个组合</button>
        </div>
      </div>
      ${this.todayTodoHTML(now, sid)}
      ${this.reheatCardHTML(sid)}
      ${this.scopePickerHTML(sid)}
      <div class="card">
        <h2>🎮 放松小游戏</h2>
        <p class="muted">游戏是奖励性收尾——练完再玩。闪电心算回流计算掌握度；单词快闪答错的词会自动进复习队列。</p>
        <div class="session-actions">
          <button class="btn secondary" id="game-arith">⚡ 闪电心算 60s</button>
          <button class="btn secondary" id="game-flash">📚 单词快闪</button>
          ${dueWords > 0 ? `<button class="btn secondary" id="game-flash-review">🔁 单词复习（${dueWords} 个到期）</button>` : ''}
          ${isWeekend ? `<button class="btn secondary" id="parent-challenge">👨‍👦 家长挑战（周末彩蛋）</button>` : ''}
        </div>
      </div>
      <div class="session-actions">
        <button class="btn secondary" id="home-brief">📊 学习汇报（给家长看）</button>
        <button class="btn secondary" id="home-grade">📈 成绩汇报</button>
      </div>
      <div class="card backup-card">
        <h2>💾 数据备份（换设备用）</h2>
        <p class="muted">进度只存在这台设备的浏览器里。换手机、清缓存之前点「导出」存一份，新设备上「导入」这份文件就能接着练。</p>
        <div class="session-actions" style="margin-top:12px">
          <button class="btn glow" id="export-data">📤 导出备份</button>
          <button class="btn secondary" id="import-data">📥 导入备份</button>
          <input type="file" id="import-file" accept="application/json,.json" style="display:none">
        </div>
      </div>`;
    this.bindSubjectBar(el, () => this.renderPractice(el));
    this.bindUnitBar(el, sid, () => this.renderPractice(el));
    const gradeOpen = el.querySelector('#grade-open');
    if (gradeOpen) gradeOpen.addEventListener('click', () => this.openGradeModal());
    this.wireTodo(el);
    this.wireBackup(el);
    // 回炉卡点击即开练该弱点（焦点练习）
    el.querySelectorAll('[data-reheat]').forEach(btn =>
      btn.addEventListener('click', () => this.startFocus(btn.dataset.reheat, el)));
    // 计划卡点击即开工；首块同时是页面主行动入口（#start-session，E2E/习惯锚点）
    el.querySelectorAll('[data-plan]').forEach(btn => {
      btn.addEventListener('click', () => {
        Store.activeSubjectId = btn.dataset.plan;
        this.session = Quiz.planSession(Date.now());
        this.renderStage(el);
      });
    });
    // 主行动开工按钮：排在「换个组合」旁，点击等同计划首块（切到首科并开练）
    const startNow = el.querySelector('#start-now');
    if (startNow) startNow.addEventListener('click', () => {
      Store.activeSubjectId = blocks[0].subjectId;
      this.session = Quiz.planSession(Date.now());
      this.renderStage(el);
    });
    // 兜底开工按钮（仅无计划时存在；独立 id，避免与计划卡的 #start-session 撞车）
    const fallback = el.querySelector('#start-session-fallback');
    if (fallback) fallback.addEventListener('click', () => {
      this.session = Quiz.planSession(Date.now());
      this.renderStage(el);
    });
    // 自选练习区（常显）：选科 + 学到哪儿（下拉）+ 手动开练
    const startManual = el.querySelector('#start-manual');
    if (startManual) startManual.addEventListener('click', async () => {
      if (startManual.disabled) return;
      startManual.disabled = true;
      const added = await this.ensureScopeQuestions(6, (i, n) => { startManual.textContent = `正在出题 ${i}/${n}…`; });
      if (added > 0) startManual.textContent = `已补 ${added} 题，开练…`;
      this.session = Quiz.planSession(Date.now());
      this.renderStage(el);
    });
    el.querySelector('#reroll-plan').addEventListener('click', () => {
      this.planSalt += 1;
      this._savePlanProgress();
      this.renderPractice(el);
    });
    // 阶段 3：考试模式开关 / 小游戏 / 家长挑战
    const examOff = el.querySelector('#exam-mode-off');
    if (examOff) examOff.addEventListener('click', () => {
      Scheduler.clearExamMode();
      this.renderPractice(el);
    });
    const ga = el.querySelector('#game-arith');
    if (ga) ga.addEventListener('click', () => this.renderArithGame(el));
    const da = el.querySelector('#daily-arith');
    if (da) da.addEventListener('click', () => this.renderArithGame(el, { seconds: 300, daily: true }));
    const gf = el.querySelector('#game-flash');
    if (gf) gf.addEventListener('click', () => this.renderFlashGame(el));
    const gfr = el.querySelector('#game-flash-review');
    if (gfr) gfr.addEventListener('click', () => this.renderFlashReview(el));
    const pc = el.querySelector('#parent-challenge');
    if (pc) pc.addEventListener('click', () => this.renderParentChallenge(el));
    // 家长入口：主页一键进「学习汇报」页
    const hb = el.querySelector('#home-brief');
    if (hb) hb.addEventListener('click', () => this.show('brief'));
    const hg = el.querySelector('#home-grade');
    if (hg) hg.addEventListener('click', () => this.show('grade'));
  },

  // 主页状态带（首行细条）：问候 + 考试模式冲刺 + 本周习惯 + 免死金牌
  // 按钮 id 不变，#exam-mode-off 事件绑定复用
  statusStripHTML(now, habit, blocks) {
    const parts = [Triggers.greeting(now, blocks, this.planDone)];
    let cls = 'level-cool';
    let btn = '';
    if (Scheduler.examModeOn()) {
      const es = Store.subjects.find(s => s.id === Scheduler.examModeId());
      parts.push(`🔥 考试模式：${es ? es.name : ''}冲刺中`);
      cls = 'level-hot';
      btn = '<button class="btn secondary small" id="exam-mode-off">退出考试模式</button>';
    }
    parts.push(habit.effective >= 7 ? '🏆 本周 7/7 全勤' : `🔥 本周 ${habit.effective}/7 天`);
    parts.push(habit.shieldUsed ? '🛡️ 免死金牌已用' : '🛡️ 免死金牌 1 张');
    return `<div class="status-strip ${cls}">${parts.map(p => `<span class="strip-item">${p}</span>`).join('<span class="strip-sep">·</span>')}${btn}</div>`;
  },

  // 自选练习区（常显）：选科 + 学到哪儿（下拉）+ 手动开练 + 成绩录入入口（点击弹窗）
  scopePickerHTML(sid) {
    return `<div class="card pick-subject">
      <h2>📚 选择练习科目，选一科直接开</h2>
      <p class="muted">点一科选中，再登记「学到哪儿」，只出学过的部分。</p>
      ${this.subjectBar()}
      ${this.unitBar(sid)}
      <div class="session-actions">
        <button class="btn glow" id="start-manual">开练（当前科目）</button>
        <button class="btn secondary" id="grade-open">📈 汇报成绩</button>
      </div>
    </div>`;
  },

  // ================= 阶段 3：学习小游戏 + 家长挑战（§10.4 §10.5） =================
  _clearGameTimer() {
    if (this._gameTimer) { clearInterval(this._gameTimer); clearTimeout(this._gameTimer); this._gameTimer = null; }
  },

  // 限时速算：逐题作答，结算正确率 ≥60% 回流计算类知识点（Games.recordArith）
  // 默认 60s 奖励游戏；每日计划入口传 { seconds: 300, daily: true } 变 5 分钟正式训练
  renderArithGame(el, opts = {}) {
    this._clearGameTimer();
    const seconds = opts.seconds || 60;
    const daily = !!opts.daily;
    const state = { correct: 0, total: 0, t0: Date.now() };
    el.innerHTML = `
      <div class="card hero">
        <div class="learn-head"><h2>⚡ ${daily ? '每日速算 · 5 分钟' : '闪电心算 60s'}</h2><button class="btn secondary small" id="game-quit">退出</button></div>
        <p class="muted">只管快和准——正确率 ≥60% 会把「计算类」知识点回流 +3 掌握度。</p>
        <div class="game-timer" id="game-timer">${seconds}</div>
        <div class="stem" id="game-stem"></div>
        <div class="options" id="arith-options"></div>
        <div class="muted" id="game-score">对 0 / 共 0</div>
      </div>`;
    el.querySelector('#game-quit').addEventListener('click', () => {
      this._clearGameTimer();
      this.renderPractice(el);
    });
    let q = Games.makeArithChoice();
    const renderQ = () => {
      el.querySelector('#game-stem').textContent = q.stem;
      el.querySelector('#arith-options').innerHTML = q.options
        .map((o, i) => `<button class="option" data-idx="${i}">${o}</button>`).join('');
    };
    renderQ();
    el.querySelector('#arith-options').addEventListener('click', e => {
      const btn = e.target.closest('.option');
      if (!btn) return;
      state.total += 1;
      if (Number(btn.dataset.idx) === q.answerIndex) state.correct += 1;
      el.querySelector('#game-score').textContent = `对 ${state.correct} / 共 ${state.total}`;
      q = Games.makeArithChoice();
      renderQ();
    });
    this._gameTimer = setInterval(() => {
      const left = Math.max(0, seconds - Math.round((Date.now() - state.t0) / 1000));
      const t = el.querySelector('#game-timer');
      if (t) t.textContent = left;
      if (left <= 0) {
        this._clearGameTimer();
        const res = Games.recordArith({
          correct: state.correct, total: state.total,
          avgMs: state.total ? Math.round((Date.now() - state.t0) / state.total) : 0,
          daily,
        });
        const bumpLine = res.bumped.length > 0
          ? `<div class="result good">已回流 ${res.bumped.length} 个计算知识点（+3）</div>` : '';
        el.innerHTML = `
          <div class="card hero">
            <h2>⚡ ${daily ? '每日速算结算' : '闪电心算结算'}</h2>
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
    const fab = document.getElementById('dad-fab');
    if (fab) fab.classList.add('hidden'); // 答题页收起悬浮球，别挡题干和选项
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
    // 中途退出：内存放掉这组回主页，但存盘不清——下次进练习可选「继续这组 / 重开」（别把进度丢了）
    el.querySelector('#quiz-quit').addEventListener('click', () => {
      if (!confirm('退出本组？进度会留着，回来接着做。')) return;
      this.session = null;
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
    // 手机上反馈常落在视口外，提交后自动带过来，省得学生自己往下划
    const zone = el.querySelector('#result-zone');
    if (zone) zone.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
      ? `<div class="muted" style="margin-top:6px">这一节配了 90 秒微课，看完再回来做更稳。 <button class="btn secondary small" id="lesson-entry">上微课（90 秒）</button></div>` : '';
    return `
      <div class="card explain-card">
        <div><strong>这道题考什么：</strong>${this.kpName(q.knowledgePointId) || '本题知识点'}</div>
        ${q.type === 'fill' ? this.answerCompareHTML(q, answer) : ''}
        <div class="muted" style="margin-top:8px"><strong>解析：</strong>${q.explanation || '（暂无解析）'}</div>
        ${ref ? `<div class="muted" style="margin-top:6px"><strong>章节定位：</strong>${ref}</div>` : ''}
        ${lessonHint}
        ${Speech.btnHTML('explain')}
        <div id="solve-slot">${this.solveSlotHTML(q, answer)}</div>
      </div>`;
  },

  // 讲解卡朗读文本：只念「考什么 + 解析 + 章节定位」；作答对照不念（学生自己的错答没必要回放）
  explainSpeechText(q) {
    const ref = this.textbookRef(Store.kpIndex()[q.knowledgePointId]);
    return [
      `这道题考什么。${this.kpName(q.knowledgePointId) || '本题知识点'}`,
      `解析。${q.explanation || '暂无解析'}`,
      ref ? `章节定位。${ref}` : '',
    ].join(' ');
  },

  // 讲解卡朗读按钮接线（作用域 explain）
  wireExplainCard(root, q) {
    Speech.wire(root, 'explain', () => this.explainSpeechText(q));
  },

  // 讲解卡上的微课入口接线：点击直达 90 秒微课（省去先点「看懂了，继续」）
  wireLessonEntry(root, onTake) {
    const btn = root.querySelector('#lesson-entry');
    if (btn) btn.addEventListener('click', onTake);
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
      if (this.stage.type === 'variant' && res.correct === true) {
        Ui.popup('🎯 悬赏销号！', COPY.closureDone, 'success');
        Celebrate.praise({ title: '又销一号！妈妈给你鼓掌 🎯', text: COPY.closureDone });
      }
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
      if (res.newlyMastered) {
        Ui.popup('💡 新知识点亮！', `「${this.kpName(q.knowledgePointId)}」亮灯成功，继续乘胜追击。`, 'success');
        Celebrate.praise({ title: '知识点亮！妈妈为你骄傲 💡', text: `「${this.kpName(q.knowledgePointId)}」亮灯成功。` });
      }
      const fact = Facts.tryDrop();
      if (fact) Ui.popup('💠 冷知识卡 +1', fact.text, 'party');
      zone.innerHTML = `
        <div class="result good">
          ✅ 答对了！${ratingHTML} 掌握度 ${res.before} → ${res.after}（${delta >= 0 ? '+' : ''}${delta}）${comboHTML}
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
    if (joke) Ui.popup('🤣 爸爸的冷笑话', joke, 'joy');
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
        // 揭晓时刻：出题级讲解卡（考什么 + 答案依据 + 章节定位），并标绿正确答案
        // 收尾走公共 afterUnderstood：有微课 → 继续推微课；否则进跟进练习二选一
        zone.innerHTML = `
          <div class="result bad">错因已记下：${type}。3 天后原题重做，7 天后变式挑战，全过才销号。</div>
          ${this.explainCardHTML(q, answer)}
          <div id="ask-slot"></div>`;
        this.wireSolveCard(zone, q, answer);
        this.wireExplainCard(zone, q);
        this.wireLessonEntry(zone, () => {
          Wrongbook.markUnderstood(res.wrongRecordId, Date.now());
          Lesson.render(q.knowledgePointId, el, () => this.onLessonPassed(el, q.knowledgePointId));
        });
        this.revealAnswer(el, q);
        actions.innerHTML = `<button class="btn" id="understood-btn">看懂了，继续</button>
          <button class="btn secondary" id="ask-btn" style="margin-left:8px">还是不懂，问爸爸</button>`;
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

  // 「下一步练什么」直通车：结算/收工时就地给出最该攻的点，一键开练（省去进知识树逐个找）
  nextTargetCardHTML(now, subjectId) {
    // 同今日待办：「学到哪儿」没登记时不推具体知识点，免得推到还没学的章节
    if (!this.unitScopeFor(subjectId).bookId) return '';
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

  // 摸底回炉卡：把「摸底里不稳的点」显性摆出来一键开练；补到 70 分以上自动撤下
  reheatCardHTML(sid) {
    const weak = ((Store.placement || {}).weak || {})[sid] || [];
    const kps = weak.map(id => Store.kpIndex()[id])
      .filter(k => k && ((Store.mastery[k.id] || {}).score || 0) < 70);
    if (!kps.length) return '';
    return `<div class="card">
      <h2>🔥 摸底回炉清单</h2>
      <p class="muted">摸底里这些点不稳——先补再练，别硬刷。补到自测通过就自动撤下。</p>
      <div class="session-actions">
        ${kps.map(k => `<button class="btn secondary" data-reheat="${k.id}">${this.bankEsc(k.name)}</button>`).join('')}
      </div>
    </div>`;
  },

  // 今日待办聚合：到期悬赏 + 最该攻的点，合成一条入口，一键开练（省去翻菜单找题）
  todayTodos(now, sid) {
    const due = Wrongbook.due(now);
    const dueCount = due.retests.concat(due.variants).filter(r => r.subjectId === sid).length;
    // 「学到哪儿」没登记时不推具体知识点：可能推到还没学的章节（与超纲提醒自相矛盾）
    const scoped = !!this.unitScopeFor(sid).bookId;
    return { dueCount, target: scoped ? Report.nextTarget(now, sid) : null };
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
    const fab = document.getElementById('dad-fab');
    if (fab) fab.classList.remove('hidden'); // 结算页恢复「问爸爸」悬浮球
    const now = Date.now();
    const s = this.session || { results: [] };
    if (s.results.length > 0) Ui.popup('🎉 一组搞定！', `这组 ${s.results.length} 题练完了，收工愉快。`, 'party');
    // 全对 / 高分结算表扬：只看本组非主观题（correct 为 true/false）
    const graded = s.results.filter(r => r.correct === true || r.correct === false);
    const right = graded.filter(r => r.correct === true).length;
    if (graded.length >= 4 && right === graded.length) {
      Celebrate.praise({ title: '全对！妈妈给你满分表扬 🎉', text: `本组 ${graded.length} 题一道没错，太稳了！` });
    } else if (graded.length >= 4 && right / graded.length >= 0.85) {
      Celebrate.praise({ title: '高分！妈妈给你点个赞 👏', text: `本组正确率 ${Math.round((right / graded.length) * 100)}%，继续保持！` });
    }
    const lit = s.results.filter(r => r.newlyMastered).length;
    const subj = this.activeSubject();
    if (subj && !this.planDone.includes(subj.id)) { this.planDone.push(subj.id); this._savePlanProgress(); }
    const next = this.dailyPlanNext();
    const proMsg = this.proactiveHTML(now, subj ? subj.id : '');
    el.innerHTML = `
      <div class="card greet">
        <h2>${this.pick(COPY.sessionEnd)}</h2>
        ${lit > 0 ? `<div class="lit-banner">💡 今天新点亮 ${lit} 个知识点</div>` : ''}
        ${Report.battleCardHTML(now)}
        ${s.results.length > 0 && s.results.length < 6 ? `<div class="muted" style="margin-top:8px">本组共 ${s.results.length} 题（该范围能出的题有限）。想练满 6 题，可在「设置」里配置 AI 爸爸现场补题。</div>` : ''}
        ${proMsg}
        ${this.nextTargetCardHTML(now, subj ? subj.id : '')}
        <div class="session-actions">
          ${next ? `<button class="btn big glow" id="next-subject-btn">下一科：${next.name}（${next.mode}）→</button>` : ''}
          <button class="btn" id="again-btn">再来一组</button>
          ${!next ? `<button class="btn secondary" id="done-today-btn">今天收工 🎉</button>` : ''}
          <button class="btn secondary" id="report-btn">看看知识树</button>
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
        <p class="muted">睡前 10 分钟过一遍错题榜——睡眠会帮你把它焊牢。</p>
        <div class="session-actions">
          <button class="btn" id="report-btn2">看看今天的知识树</button>
        </div>
      </div>
      ${this.nextTargetCardHTML(Date.now(), '')}`;
    el.querySelector('#report-btn2').addEventListener('click', () => this.show('report'));
    this.wireNextTarget(el);
  },

  // ================= 错题榜 =================
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
      el.innerHTML = `<div class="card"><h2>错题榜</h2>${this.subjectBar()}<div class="empty">空空如也——好事。错题自动上榜，走完闭环（重做→变式）才算销号离场。<br>摸底里错的题不算悬赏，已收进「今日计划」的回炉清单，学完自测通过就消化掉了。</div></div>`;
      this.bindSubjectBar(el, () => this.renderWrongbook(el));
      return;
    }

    const chipCls = { '待处理': 'chip-gray', '重做中': 'chip-blue', '变式待测': 'chip-mid', '顽固': 'chip-bad' };
    let html = `<div class="card"><h2>错题榜</h2>${this.subjectBar()}`;
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
            <button class="btn secondary" id="d0-ask" style="margin-left:8px">还是不懂，问爸爸</button>
          </div>
          <div id="d0-ask-slot"></div>
        </div>`;
      this.wireSolveCard(el, q, rec.myAnswer);
      this.wireExplainCard(el, q);
      this.wireLessonEntry(el, () => {
        Wrongbook.markUnderstood(rec.id, Date.now());
        Lesson.render(q.knowledgePointId, el, () => onDone());
      });
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
        showExplain();
      });
    });
  },

  // ================= 问爸爸：答疑面板（练习中 / 错题榜 / 全局页共用） =================
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
            <strong>爸爸 ${Assistant.name()}</strong>
            <span class="muted">今日还能问 ${AI.quota().left} 次</span>
          </div>
          <div class="chat-log">
            ${history.map(t => `<div class="chat-bubble ${t.role === 'assistant' ? 'from-ai' : 'from-me'}">${esc(t.content)}</div>`).join('')}
            ${thinking ? '<div class="chat-bubble from-ai chat-typing">爸爸在想……</div>' : ''}
          </div>
          ${Speech.btnHTML('ask')}
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
      Speech.wire(zone, 'ask', () => history.filter(t => t.role === 'assistant').map(t => t.content).join(' '));
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
        // C2 降级再确认：AI 不可用时，本地证据仍能兜一段像样的回答（不占 AI 提问次数）
        const local = Assistant.localAnswer(rec, q);
        if (local) {
          history.push({ role: 'assistant', content: local + '\n\n（爸爸现在没在线——这段是本地讲义兜底，不占提问次数。等他回来，再点「换个讲法」我接着讲。）' });
        } else {
          history.pop();   // 失败不进上下文、不占轮次
          rounds -= 1;
          err = res.error;
        }
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

  // 全局「问爸爸」弹窗（导航 / 悬浮头像统一入口）：不切页，关闭即回原页面
  // 练习作答中点开：先弹一句拒绝，不给问；答完或其它页面才进正常问答
  openDadModal() {
    if (document.getElementById('dad-modal')) return; // 已开着就别叠第二层
    const quizOpen = this.view === 'practice' && document.querySelector('#submit-btn'); // 答题页且未提交
    const mask = document.createElement('div');
    mask.className = 'dad-mask';
    mask.id = 'dad-modal';
    mask.innerHTML = `
      <div class="dad-card">
        <button class="guide-close" id="dad-modal-close" aria-label="关闭">×</button>
        ${quizOpen ? '<div class="dad-refuse">抽你巴掌！没答先问？</div>' : '<div id="dad-modal-zone"></div>'}
      </div>`;
    document.body.appendChild(mask);
    const close = () => mask.remove();
    mask.querySelector('#dad-modal-close').addEventListener('click', close);
    mask.addEventListener('click', e => { if (e.target === mask) close(); });
    if (!quizOpen) this.renderAskPanel(mask.querySelector('#dad-modal-zone'), null, null, () => {});
  },

  // 全局「问爸爸」页：复用同一套发送/渲染逻辑，只是没有预置错题
  renderAssistant(el) {
    el.innerHTML = `
      <div class="card">
        <h2>问爸爸</h2>
        <p class="muted">哪里卡住直接问。他会用你听得懂的话讲——不打官腔，不讲大道理。</p>
        <div id="ask-zone"></div>
      </div>`;
    this.renderAskPanel(el.querySelector('#ask-zone'), null, null, () => this.renderAssistant(el));
  },

  // 学习汇报页（独立入口）：周维度汇总 + AI 评语 + 打印一页纸；首次进入弹指引弹窗
  renderBrief(el) {
    const now = Date.now();
    const showGuide = !Store.settings.briefSeen;
    let html = `
      <div class="card overview">
        <h2>📊 学习汇报</h2>
        <p class="muted">把练习数据翻译成家长看得懂的话：这周推进了什么、哪类题还在卡、下周主攻哪个点。随时可看，拉到最下面能打印一页纸带走。</p>
      </div>`;
    html += Report.battleCardHTML(now);
    html += Report.weekCardHTML(now);
    html += Report.weekNarrativeHTML(now);
    html += Report.gradeCardHTML();
    html += '<div id="weekly-ai-slot"></div>';
    html += '<div class="session-actions"><button class="btn secondary" id="print-weekly">🖨 打印本周战报（给家长）</button><button class="btn secondary" id="print-wrongs">🖨 打印本周错题（未解决）</button></div>';
    if (showGuide) html += this.briefGuideHTML();
    el.innerHTML = html;
    const pb = el.querySelector('#print-weekly');
    if (pb) pb.addEventListener('click', () => Report.openPrintWeekly(now));
    const pwb = el.querySelector('#print-wrongs');
    if (pwb) pwb.addEventListener('click', () => Report.openPrintWrongs(now));
    this.renderWeeklyAI(el.querySelector('#weekly-ai-slot'));
    if (showGuide) this.wireBriefGuide(el);
  },

  // 成绩汇报页（独立入口）：录入最近一次考试/测验各科成绩 + 班级/年级排名，历史记录按日期留存
  renderGradeReport(el) {
    const records = this._gradeRecords();
    el.innerHTML = `
      <div class="card overview">
        <h2>📈 成绩汇报</h2>
        <p class="muted">把最近一次考试或测验的各科成绩、班级排名和年级排名记下来。录入后，学习汇报页会自动对比出每科的涨跌和排名变化。</p>
      </div>
      <div class="card">
        <h2>添加记录</h2>
        ${this.gradeFormHTML()}
      </div>
      <div class="card">
        <h2>历史记录 <span class="muted">${records.length} 条</span></h2>
        ${this.gradeHistoryHTML(records)}
      </div>`;
    this.bindGradeEntry(el, () => this.renderGradeReport(el));
  },

  // 成绩记录（按日期倒序，最新在前）
  _gradeRecords() {
    return (Store.gradeReports || []).slice()
      .sort((a, b) => (a.date === b.date ? (b.createdAt || 0) - (a.createdAt || 0) : (a.date < b.date ? 1 : -1)));
  },

  // 成绩录入表单主体（日期 + 各科成绩 + 班级/年级排名 + 添加按钮）：成绩汇报页与「选择练习科目」卡片共用
  gradeFormHTML() {
    const subjects = Store.subjects.filter(x => !x.exam);
    const today = Store.todayKey(Date.now());
    return `
      <div class="field"><label>日期</label><input class="text-input" type="date" id="gr-date" value="${today}"></div>
      <div class="field"><label>各科成绩（0-100，没考的留空即可）</label>
        ${subjects.map(s => `
          <div class="field-row">
            <label>${s.name}</label>
            <input class="text-input" type="number" min="0" max="100" id="gr-score-${s.id}" placeholder="0-100">
          </div>`).join('')}
      </div>
      <div class="field-row">
        <label>班级排名</label>
        <input class="text-input" type="number" min="1" id="gr-class-rank" placeholder="第几名">
        <label>年级排名</label>
        <input class="text-input" type="number" min="1" id="gr-grade-rank" placeholder="第几名">
      </div>
      <div class="session-actions"><button class="btn glow" id="gr-add">＋ 添加记录</button></div>`;
  },

  // 成绩历史记录主体（空态或表格）：与 gradeFormHTML 共用
  gradeHistoryHTML(records) {
    const subjects = Store.subjects.filter(x => !x.exam);
    const list = records || this._gradeRecords();
    const fmtScores = r => subjects
      .filter(s => r.scores && r.scores[s.id] != null)
      .map(s => `${s.name} ${r.scores[s.id]}`).join('、') || '<span class="muted">—</span>';
    if (list.length === 0) return '<div class="empty">还没有记录。</div>';
    return `<table><thead><tr><th>日期</th><th>各科成绩</th><th>班级</th><th>年级</th><th></th></tr></thead><tbody>
      ${list.map(r => `<tr>
        <td>${r.date}</td>
        <td>${fmtScores(r)}</td>
        <td>${r.classRank != null ? '第 ' + r.classRank + ' 名' : '<span class="muted">—</span>'}</td>
        <td>${r.gradeRank != null ? '第 ' + r.gradeRank + ' 名' : '<span class="muted">—</span>'}</td>
        <td><button class="btn danger small" data-del="${r.id}">删</button></td>
      </tr>`).join('')}
      </tbody></table>`;
  },

  // 绑定成绩录入表单：添加记录 / 删除记录，rerender 用于重渲染当前视图
  bindGradeEntry(el, rerender) {
    const subjects = Store.subjects.filter(x => !x.exam);
    const addBtn = el.querySelector('#gr-add');
    if (addBtn) addBtn.addEventListener('click', () => {
      const date = el.querySelector('#gr-date').value;
      if (!date) { alert('请填写日期'); return; }
      const scores = {};
      for (const s of subjects) {
        const raw = el.querySelector('#gr-score-' + s.id).value.trim();
        if (raw === '') continue;
        const n = Number(raw);
        if (!(n >= 0 && n <= 100)) { alert(`${s.name}成绩请输入 0~100`); return; }
        scores[s.id] = Math.round(n);
      }
      const parseRank = v => {
        const raw = v.trim();
        if (raw === '') return null;
        const n = Number(raw);
        return (Number.isInteger(n) && n >= 1) ? n : NaN;
      };
      const classRank = parseRank(el.querySelector('#gr-class-rank').value);
      const gradeRank = parseRank(el.querySelector('#gr-grade-rank').value);
      if (Number.isNaN(classRank)) { alert('班级排名请输入正整数'); return; }
      if (Number.isNaN(gradeRank)) { alert('年级排名请输入正整数'); return; }
      if (Object.keys(scores).length === 0 && classRank == null && gradeRank == null) {
        alert('至少填一科成绩或一个排名'); return;
      }
      const createdAt = Date.now();
      const list = Store.gradeReports || [];
      list.push({ id: 'gr-' + createdAt, date, scores, classRank, gradeRank, createdAt });
      Store.gradeReports = list;
      rerender();
    });
    el.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => {
      if (!confirm('删除这条成绩记录？')) return;
      Store.gradeReports = (Store.gradeReports || []).filter(r => r.id !== btn.dataset.del);
      rerender();
    }));
  },

  // 成绩录入弹窗：点「汇报成绩」弹出，录入/删除后就地刷新弹窗内容，不占主页版面
  openGradeModal() {
    if (document.getElementById('grade-modal')) return;
    const mask = document.createElement('div');
    mask.className = 'guide-mask';
    mask.id = 'grade-modal';
    mask.innerHTML = `<div class="guide-card grade-card">
      <button class="guide-close" id="grade-modal-close" aria-label="关闭">×</button>
      <div id="grade-modal-body"></div>
    </div>`;
    document.body.appendChild(mask);
    const close = () => mask.remove();
    mask.querySelector('#grade-modal-close').addEventListener('click', close);
    mask.addEventListener('click', e => { if (e.target === mask) close(); });
    const renderBody = () => {
      const body = mask.querySelector('#grade-modal-body');
      const records = this._gradeRecords();
      body.innerHTML = `
        <h2>📈 汇报成绩</h2>
        <p class="muted">记录最近一次考试或测验的各科成绩、班级排名和年级排名。</p>
        ${this.gradeFormHTML()}
        <h2>历史记录 <span class="muted">${records.length} 条</span></h2>
        ${this.gradeHistoryHTML(records)}`;
      this.bindGradeEntry(body, renderBody);
    };
    renderBody();
  },

  // 学习汇报首次进入的指引弹窗（带选择 + 关闭）；看过一次即不再弹
  briefGuideHTML() {
    return `<div class="guide-mask" id="brief-guide">
      <div class="guide-card">
        <button class="guide-close" id="brief-guide-close" aria-label="关闭">×</button>
        <h2>📊 学习汇报</h2>
        <p class="muted">这是给家长看的专属页面：孩子这周的答题、正确率、点亮的知识点、还在卡的知识点，以及下周该攻哪里，都在这里。</p>
        <p class="muted">数据来自每天的练习记录，随时可看；页面最下方可打印一页纸带走。</p>
        <div class="guide-actions">
          <button class="btn" id="brief-guide-go">⚔️ 去练习</button>
          <button class="btn secondary" id="brief-guide-ok">知道了</button>
        </div>
      </div>
    </div>`;
  },

  wireBriefGuide(el) {
    const mask = el.querySelector('#brief-guide');
    if (!mask) return;
    const seen = () => { Store.settings = { ...Store.settings, briefSeen: true }; };
    const close = () => { seen(); mask.remove(); };
    el.querySelector('#brief-guide-close').addEventListener('click', close);
    el.querySelector('#brief-guide-ok').addEventListener('click', close);
    el.querySelector('#brief-guide-go').addEventListener('click', () => { seen(); this.show('practice'); });
  },

  // 周报 AI 评语（四铁律）+ 周度档案蒸馏（§9.5 §9.6）:放进学习汇报页 #weekly-ai-slot
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

  renderGuide(el) {
    el.innerHTML = `
      <div class="card hero">
        <h2>❓ 使用说明</h2>
        <p class="muted">这是给初二同学和家长用的全科补习系统：做错的题帮你看懂，真正学会的题才算过——所有进度都存在这台设备里。</p>
      </div>
      <div class="card">
        <h2>✨ 好在哪</h2>
        <ul>
          <li><strong>全科一个地方练</strong>：语数英、物理、历史、地理、生物、政治都在一起。</li>
          <li><strong>做错不算完</strong>：先让你选「为什么错」，再配微课，把这道题真正吃透。</li>
          <li><strong>学会才销号</strong>：错题隔几天重做，连续做对才从榜上销号，不糊弄自己。</li>
          <li><strong>断网也能用</strong>：判对错、找错因、算掌握度全在本机跑，免费又稳定。</li>
          <li><strong>家长看得懂</strong>：学习汇报把数据翻成人话，还能打印一页带走。</li>
        </ul>
      </div>
      <div class="card">
        <h2>🚀 怎么用</h2>
        <ol>
          <li>点顶部「开始练习」，选一科，跟着关卡一题一题做。</li>
          <li>做错了先选错因（概念／步骤／审题／计算），再看解析和微课。</li>
          <li>卡住了，点右下角头像「问爸爸」，让它讲这道题。</li>
          <li>想知道哪科弱看「知识树」；想给家长看进度点「学习汇报」。</li>
          <li>错题都收在「错题榜」，隔几天重做，对了就销号。</li>
        </ol>
      </div>`;
  },

  // ================= 设置 =================
  // 云同步状态行文案（设置页）
  _gistStatusText(s) {
    if (!s.gistToken) return '尚未配置 Token';
    if (!s.gistId) return '已填 Token，尚未建立云端备份';
    const at = s.lastSyncedAt ? new Date(s.lastSyncedAt).toLocaleString() : '尚未';
    return `已连接云端（gist ${String(s.gistId).slice(0, 7)}…），上次同步：${at}`;
  },

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
        <div class="field"><label>开学日期（教学日历锚点）</label><input class="text-input" id="set-term" type="date" value="${s.termStart || Scheduler.DEFAULT_TERM_START}"></div>
        <button class="btn" id="save-settings">保存</button>
        <button class="btn secondary" id="test-conn" style="margin-left:8px">测试连接</button>
      </div>
      <details class="card" id="bank-card"></details>
      <div class="card">
        <h2>🏃 考试模式 & 大考校准</h2>
        <div class="field"><label>考试模式科目（计划只排这一科冲刺）</label>
          <select class="text-input" id="set-exam-mode">
            <option value="">关闭考试模式</option>
            ${Store.subjects.map(x => `<option value="${x.id}"${s.examMode === x.id ? ' selected' : ''}>${x.name}</option>`).join('')}
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
        <h2>🔍 学情记忆审计（系统记住了什么）</h2>
        <p class="muted">以下全是本地规则算出来的，不联网、不上云：掌握度 = 正确率 × 用时 × 指数遗忘；错因 = 他自己选的归因；销号 = D0→D3→D7 走完的记录。界面显示的掌握度还会按遗忘曲线衰减。</p>
        <div id="audit-body"></div>
        <div class="session-actions">
          <button class="btn secondary" id="export-audit">📤 导出学情记忆（JSON）</button>
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
        <h2>☁️ 云同步（GitHub Gist）</h2>
        <p class="muted">答题后自动把全部进度备份到一个私有 Gist，换设备、清缓存后填同一个 Token 打开页面即自动恢复。Token 只存这台设备的浏览器里。获取方式：GitHub → Settings → Developer settings → Personal access tokens (classic) → Generate new token，只勾 gist 权限即可。</p>
        <div class="field"><label>Token（仅存本机）</label><input class="text-input" id="set-gist-token" type="password" value="${s.gistToken || ''}" placeholder="ghp_..."></div>
        <div class="session-actions">
          <button class="btn" id="gist-save">保存并同步</button>
          ${s.gistToken && s.gistId ? '<button class="btn secondary" id="gist-sync" style="margin-left:8px">立即同步</button>' : ''}
        </div>
        <p class="muted" id="gist-status">${this._gistStatusText(s)}</p>
      </div>
      <div class="card">
        <h2>危险区</h2>
        <p class="muted">重置后清空所有作答记录与掌握度，恢复初始数据。</p>
        <button class="btn danger" id="reset-data">重置数据</button>
      </div>`;

    this.renderBank(el.querySelector('#bank-card'));

    // 学情记忆审计（A4）：只读渲染 + 导出子集
    const renderAudit = () => {
      const body = el.querySelector('#audit-body');
      if (!body) return;
      const a = Report.memoryAudit();
      const li = items => items.length ? items.map(i => `<li>${i}</li>`).join('') : '<li class="muted">暂无记录。</li>';
      const causeRows = a.causes.length
        ? a.causes.map(c => `<li><strong>${c.key}</strong> ×${c.count} —— ${c.kps.join('、')}</li>`).join('')
        : '<li class="muted">还没记过错因——答错时先自选归因，系统就会在这里累计。</li>';
      const closureRows = a.recentClosures.length
        ? a.recentClosures.map(c => `<li>${c.name}（${c.at}）</li>`).join('')
        : '<li class="muted">还没有销号记录——D0→D3→D7 全过才销号。</li>';
      const weakRows = a.weak.length
        ? a.weak.map(w => `<li><strong>${w.name}</strong> ${w.score}/100</li>`).join('')
        : '<li class="muted">暂无薄弱点记录。</li>';
      body.innerHTML = `
        <div class="audit-sec"><p class="muted">错因清单</p><ul>${causeRows}</ul></div>
        <div class="audit-sec"><p class="muted">销号记录（${a.closedCount} 条）</p><ul>${closureRows}</ul></div>
        <div class="audit-sec"><p class="muted">掌握度来源：${a.masteryCount} 个知识点有记录 · ${a.litCount} 个已点亮（≥85）· 累计作答 ${a.attemptsCount} 次 · 本地微课 ${a.lessonCount} 个课叶</p>
        <p class="muted">薄弱点 Top${Math.min(5, Math.max(1, a.weak.length))}：</p><ul>${weakRows}</ul></div>`;
    };
    renderAudit();
    const exportAudit = el.querySelector('#export-audit');
    if (exportAudit) exportAudit.addEventListener('click', () => {
      const a = Report.memoryAudit();
      const payload = {
        exportedAt: a.exportedAt,
        memory: {
          attempts: Store.attempts,
          mastery: Store.mastery,
          wrongbook: Store.wrongbook,
          lessonState: Store.lessonState || {},
        },
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const d = new Date();
      const url = URL.createObjectURL(blob);
      const dl = document.createElement('a');
      dl.href = url;
      dl.download = 'tutor-memory-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '.json';
      dl.click();
      URL.revokeObjectURL(url);
    });

    const saveSettings = () => {
      Store.settings = {
        ...Store.settings,
        aiBaseUrl: el.querySelector('#set-base').value.trim(),
        aiModel: el.querySelector('#set-model').value.trim(),
        aiKey: el.querySelector('#set-key').value.trim(),
        dailyAiLimit: Number(el.querySelector('#set-limit').value) || AI.DEFAULT_LIMIT,
        termStart: el.querySelector('#set-term').value || '',
      };
    };

    // API Key 填一次即自动保存（失焦时触发），其余字段仍走「保存」按钮
    el.querySelector('#set-key').addEventListener('change', saveSettings);

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

    // 数据备份：导出/导入（主页与设置页共用同一套 id，绑定逻辑见 wireBackup）
    this.wireBackup(el);

    // 云同步（GitHub Gist）：保存 Token 即首次同步；此后答题自动防抖上传
    const syncMsg = (r) => ({
      restored: '已从云端恢复进度，页面即将刷新',
      uploaded: '本地较新，已上传到云端',
      latest: '云端与本地一致，无需同步',
      created: '已在云端创建私有备份',
    }[r.action] || '同步完成');
    el.querySelector('#gist-save').addEventListener('click', async () => {
      const input = el.querySelector('#set-gist-token');
      const token = input.value.trim();
      if (!token) { alert('请先填写 Token（GitHub → Settings → Developer settings → Tokens classic，勾选 gist）'); return; }
      const btn = el.querySelector('#gist-save');
      Store.settings = { ...Store.settings, gistToken: token };
      btn.disabled = true;
      btn.textContent = '同步中…';
      const res = await Sync.sync();
      btn.disabled = false;
      btn.textContent = '保存并同步';
      if (res.ok) { alert(syncMsg(res)); this.show('settings'); }
      else alert(res.error);
    });
    const gistSync = el.querySelector('#gist-sync');
    if (gistSync) gistSync.addEventListener('click', async () => {
      gistSync.disabled = true;
      gistSync.textContent = '同步中…';
      const res = await Sync.sync();
      gistSync.disabled = false;
      gistSync.textContent = '立即同步';
      if (res.ok) { alert(syncMsg(res)); this.show('settings'); }
      else alert(res.error);
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

  // 数据备份：导出下载 JSON / 导入覆盖恢复（设置页与主页共用同一份 DOM 结构）
  wireBackup(scope) {
    const exp = scope.querySelector('#export-data');
    const imp = scope.querySelector('#import-data');
    const file = scope.querySelector('#import-file');
    if (!exp || !imp || !file) return;
    // 导出：下载 JSON 备份文件
    exp.addEventListener('click', () => {
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
    imp.addEventListener('click', () => file.click());
    file.addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (!f) return;
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
      reader.readAsText(f);
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
        explanation: '', difficulty: 2, expectedTime: expectedTimeOf('single', 2), groupId: '', groupRole: 'basic' };
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
          <div class="bank-row" style="display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line,#eee)">
            <span class="badge">${TYPE_LABEL[q.type] || q.type}</span>
            ${q.id.startsWith('c-') ? '<span class="badge">自</span>' : ''}
            <span class="bank-stem" style="flex:1;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this.bankEsc(q.stem)}</span>
            <span class="muted bank-kp-path" style="font-size:12px;white-space:nowrap">${this.bankKpPath(Store.kpIndex()[q.knowledgePointId] || {})}</span>
            <button class="btn secondary" data-edit-q="${q.id}" style="padding:4px 10px">编辑</button>
            <button class="btn danger" data-del-q="${q.id}" style="padding:4px 10px">删除</button>
          </div>`).join('');

    card.innerHTML = `
      <summary><h2>📚 题库管理</h2></summary>
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
      cur.expectedTime = expectedTimeOf(cur.type, cur.difficulty);
      this.renderBank(card, cur);
    });
    const diffSel = card.querySelector('#bank-diff');
    if (diffSel) diffSel.addEventListener('change', () => {
      const cur = this.bankCollect(card);
      cur.difficulty = Number(diffSel.value);
      cur.expectedTime = expectedTimeOf(cur.type, cur.difficulty);
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
