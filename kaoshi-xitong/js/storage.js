// 数据层：所有持久化数据统一经由此处读写 localStorage（唯一存储入口）
const STORE_PREFIX = 'tutor.';

// localStorage 数据结构版本：结构变更时 +1 并在 MIGRATIONS 里补一条迁移（只追加不改历史）
const SCHEMA_VERSION = 1;
const SCHEMA_MIGRATIONS = {
  // v0→v1：旧默认助手名「阿K」/「学长」统一改为「爸爸」（原 init 内联逻辑迁移框架化）
  1(s) {
    if (s && (s.assistantName === '阿K' || s.assistantName === '学长')) this._write('settings', { ...s, assistantName: '爸爸' });
  },
};

const Store = {
  _read(key, def) {
    try {
      const raw = localStorage.getItem(STORE_PREFIX + key);
      return raw === null ? def : JSON.parse(raw);
    } catch (e) {
      return def;
    }
  },

  _write(key, val) {
    localStorage.setItem(STORE_PREFIX + key, JSON.stringify(val));
    if (typeof Sync !== 'undefined' && !Sync._busy) Sync.autoPush(); // 云同步：有变更即防抖上传
  },

  // 结构迁移：schemaVersion 落后则按序补跑迁移，跑完写新版本号（幂等，启动时一次）
  _migrate() {
    const cur = this._read('schemaVersion', 0);
    if (cur >= SCHEMA_VERSION) return;
    for (let v = cur + 1; v <= SCHEMA_VERSION; v++) {
      const fn = SCHEMA_MIGRATIONS[v];
      if (fn) fn.call(this, this._read('settings', null));
    }
    this._write('schemaVersion', SCHEMA_VERSION);
  },

  // 初始化：题库按 seedVersion 增量合并（新种子为基底，保留用户自建题），进度数据不清空
  // （初三题库扩容后老用户无痛升级：只补题库，attempts/mastery/wrongbook 等全部保留）
  init(seed) {
    this._migrate();
    const newVer = seed.seedVersion || 0;
    if (this._read('seedVersion', -1) === newVer) return;
    this._write('subjects', seed.subjects);
    this._write('knowledgePoints', seed.knowledgePoints);
    const seedQIds = new Set(seed.questions.map(q => q.id));
    const custom = this._read('questions', []).filter(q => !seedQIds.has(q.id));
    this._write('questions', seed.questions.concat(custom));
    this._write('lessons', seed.lessons || {});
    this._write('seedVersion', newVer);
    // 仅首次使用才初始化进度（老用户升级题库时 attempts 已存在，跳过）
    if (this._read('attempts', null) === null) {
      this._write('attempts', []);
      this._write('mastery', {});
      this._write('wrongbook', []);
      this._write('lessonState', {});
      this._write('dayStats', {});
      this._write('solutionCache', {});
      this._write('placement', { done: {}, active: null });
      this._write('settings', seed.settings || {});
    }
  },

  reset(seed) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(STORE_PREFIX)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    this._write('seedVersion', 0);
    this.init(seed);
  },

  get subjects() { return this._read('subjects', []); },
  get activeSubjectId() { return this._read('activeSubjectId', ''); },
  get knowledgePoints() { return this._read('knowledgePoints', []); },
  get questions() { return this._read('questions', []); },
  get lessons() { return this._read('lessons', {}); },
  set lessons(v) { this._write('lessons', v); },
  get attempts() { return this._read('attempts', []); },
  get mastery() { return this._read('mastery', {}); },
  get wrongbook() { return this._read('wrongbook', []); },
  get lessonState() { return this._read('lessonState', {}); },
  get dayStats() { return this._read('dayStats', {}); },
  // 逐题逐步解法缓存：{ [questionId]: 步骤文本 }
  get solutionCache() { return this._read('solutionCache', {}); },
  set solutionCache(v) { this._write('solutionCache', v); },
  get settings() { return this._read('settings', {}); },
  get planProgress() { return this._read('planProgress', {}); },
  // 学到哪儿：{ [subjectId]: { bookId, chapterId, sectionId } }，顺序前缀语义（学到该节点为止，之前的都算已学），缺省即不限（§需求2）
  get unitScope() { return this._read('unitScope', {}); },
  // 进行中题组：刷新页面后能接着练（ISSUE-006），跨天自动作废
  get session() { return this._read('session', null); },

  // ===== 阶段 3 数据键（游戏 / 图鉴 / 复习队列 / 赛季 / 家长挑战 / 考试成绩 / 月度归档）=====
  get games() { return this._read('games', []); },
  get facts() { return this._read('facts', []); },
  get wordQueue() { return this._read('wordQueue', []); },
  get seasons() { return this._read('seasons', {}); },
  get parentChallenge() { return this._read('parentChallenge', []); },
  get examScores() { return this._read('examScores', {}); },
  // 成绩汇报：每次考试/测验一条记录 { id, date: 'YYYY-MM-DD', scores: {subjectId: 分数}, classRank, gradeRank, createdAt }
  get gradeReports() { return this._read('gradeReports', []); },
  get monthly() { return this._read('monthly', []); },
  // 入学摸底：done 为 { [subjectId]: true }；active 为进行中状态（刷新可续）
  get placement() { return this._read('placement', { done: {}, active: null }); },

  set mastery(v) { this._write('mastery', v); },
  set activeSubjectId(v) { this._write('activeSubjectId', v); },
  set attempts(v) { this._write('attempts', v); },
  set wrongbook(v) { this._write('wrongbook', v); },
  set lessonState(v) { this._write('lessonState', v); },
  set dayStats(v) { this._write('dayStats', v); },
  set settings(v) { this._write('settings', v); },
  set planProgress(v) { this._write('planProgress', v); },
  set unitScope(v) { this._write('unitScope', v); },
  set session(v) { this._write('session', v); },
  set games(v) { this._write('games', v); },
  set facts(v) { this._write('facts', v); },
  set wordQueue(v) { this._write('wordQueue', v); },
  set seasons(v) { this._write('seasons', v); },
  set parentChallenge(v) { this._write('parentChallenge', v); },
  set examScores(v) { this._write('examScores', v); },
  set gradeReports(v) { this._write('gradeReports', v); },
  set monthly(v) { this._write('monthly', v); },
  set placement(v) { this._write('placement', v); },

  // 知识点索引：{ id → 节点 }
  kpIndex() {
    const idx = {};
    for (const kp of this.knowledgePoints) idx[kp.id] = kp;
    return idx;
  },

  // 题目索引：{ id → 题目 }
  questionIndex() {
    const idx = {};
    for (const q of this.questions) idx[q.id] = q;
    return idx;
  },

  // 某区间（闭区间）逐日战报累计（赛季结算/学期回望用；dayStats 键为 'YYYY-MM-DD'）
  aggregateDayStats(startTs, endTs) {
    const sKey = this.todayKey(startTs);
    const eKey = this.todayKey(endTs);
    const out = { answered: 0, correct: 0, closures: 0, lit: 0 };
    for (const [key, st] of Object.entries(this.dayStats)) {
      if (key < sKey || key > eKey) continue;
      out.answered += st.answered || 0;
      out.correct += st.correct || 0;
      out.closures += st.closures || 0;
      out.lit += st.litCount || 0;
    }
    return out;
  },

  // 阶段 3 §13.4：作答明细超 90 天聚合归档到月度（防 localStorage 5MB 风险 §14.5）
  // 归档后明细从 attempts 移除；错题记录/掌握度不动（永久保留）
  archiveOldAttempts(now) {
    const cutoff = (now || Date.now()) - 90 * 86400000;
    const keep = [];
    const byMonth = {};
    for (const a of this.attempts) {
      if (a.timestamp >= cutoff) { keep.push(a); continue; }
      const d = new Date(a.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const m = byMonth[key] || (byMonth[key] = { answered: 0, correct: 0, closures: 0 });
      m.answered += 1;
      if (a.correct === true) m.correct += 1;
      if (a.closureType) m.closures += 1;
    }
    if (Object.keys(byMonth).length === 0) return 0;
    const monthly = this.monthly.slice();
    for (const [key, agg] of Object.entries(byMonth)) {
      const ex = monthly.find(m => m.key === key);
      if (ex) { ex.answered += agg.answered; ex.correct += agg.correct; ex.closures += agg.closures; }
      else monthly.push({ key, ...agg });
    }
    monthly.sort((a, b) => (a.key < b.key ? -1 : 1));
    this.monthly = monthly;
    this.attempts = keep;
    return Object.keys(byMonth).length;
  },

  // ===== 题库管理：题目 CRUD（校验规则与 tests/data.test.js 种子校验一致） =====
  // 返回错误文案；合法返回 null
  validateQuestion(q) {
    const TYPES = ['single', 'multi', 'judge', 'fill', 'subjective'];
    if (!TYPES.includes(q.type)) return '题型不合法';
    const kp = this.kpIndex()[q.knowledgePointId];
    if (!kp) return '知识点不存在';
    if (kp.level !== 4) return '题目只能挂在知识点树的叶子（L4）上';
    if (!String(q.stem || '').trim()) return '题干不能为空';
    if (!String(q.explanation || '').trim()) return '解析不能为空';
    if (!(q.expectedTime > 0)) return '预计用时必须大于 0 秒';
    if (!(Number.isInteger(q.difficulty) && q.difficulty >= 1 && q.difficulty <= 5)) return '难度须为 1~5 的整数';
    const opts = Array.isArray(q.options) ? q.options : [];
    if (q.type === 'single' || q.type === 'multi') {
      if (opts.length < 2) return '选择题至少要有 2 个选项';
      if (opts.some(o => !String(o).trim())) return '有选项是空的';
    }
    if (q.type === 'single' && !(q.answer >= 0 && q.answer < opts.length)) return '答案索引超出选项范围';
    if (q.type === 'multi') {
      const ans = Array.isArray(q.answer) ? q.answer : [];
      if (ans.length < 2) return '多选题答案至少选 2 项';
      const uniq = [...new Set(ans.map(Number))];
      if (uniq.length !== ans.length) return '多选题答案有重复项';
      if (uniq.some(a => !(a >= 0 && a < opts.length))) return '多选题答案索引超出选项范围';
    }
    if (q.type === 'judge' && !(q.answer === 0 || q.answer === 1)) return '判断题答案须为「对」或「错」';
    if ((q.type === 'fill' || q.type === 'subjective') && String(q.answer == null ? '' : q.answer).trim() === '')
      return q.type === 'fill' ? '填空题答案不能为空' : '参考答案不能为空';
    return null;
  },

  // 新增题目。data 需含 knowledgePointId/type/stem/options/answer/explanation/difficulty/expectedTime（+可选 groupId/groupRole）
  addQuestion(data) {
    const kp = this.kpIndex()[data.knowledgePointId];
    const q = {
      id: '',
      subjectId: kp ? kp.subjectId : '',
      knowledgePointId: data.knowledgePointId,
      type: data.type,
      stem: String(data.stem || '').trim(),
      options: (data.type === 'fill' || data.type === 'subjective') ? []
        : (Array.isArray(data.options) ? data.options.map(o => String(o)) : []),
      answer: data.type === 'multi' ? (Array.isArray(data.answer) ? data.answer.map(Number) : [])
        : data.type === 'fill' || data.type === 'subjective' ? String(data.answer == null ? '' : data.answer).trim()
        : Number(data.answer),
      explanation: String(data.explanation || '').trim(),
      difficulty: data.difficulty === undefined ? 2 : Number(data.difficulty),
      expectedTime: data.expectedTime === undefined ? 30 : Number(data.expectedTime),
      groupId: String(data.groupId || '').trim(),
      groupRole: data.groupRole || 'basic',
    };
    if (q.type === 'judge') q.options = ['对', '错'];
    const err = this.validateQuestion(q);
    if (err) return { ok: false, error: err };
    // 自定义题 id：c-1 起递增，避开种子 id
    const nums = this.questions.map(x => /^c-(\d+)$/.exec(x.id)).filter(Boolean).map(m => Number(m[1]));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    q.id = 'c-' + next;
    const list = this.questions;
    list.push(q);
    this._write('questions', list);
    return { ok: true, question: q };
  },

  // 编辑题目：patch 深合并到现有题（id/subjectId 不可改，知识点随挂载自动带科目）
  updateQuestion(id, patch) {
    const list = this.questions;
    const idx = list.findIndex(q => q.id === id);
    if (idx < 0) return { ok: false, error: '题目不存在' };
    const merged = { ...list[idx], ...patch, id, options: patch.options ?? list[idx].options };
    if (patch.knowledgePointId) {
      const kp = this.kpIndex()[patch.knowledgePointId];
      merged.subjectId = kp ? kp.subjectId : '';
    }
    if (merged.type === 'judge') merged.options = ['对', '错'];
    if (merged.type === 'fill' || merged.type === 'subjective') {
      merged.options = [];
      merged.answer = String(merged.answer == null ? '' : merged.answer).trim();
    } else if (merged.type === 'multi' && Array.isArray(merged.answer)) {
      merged.answer = merged.answer.map(Number);
    } else if (merged.type === 'single') {
      merged.answer = Number(merged.answer);
    }
    const err = this.validateQuestion(merged);
    if (err) return { ok: false, error: err };
    list[idx] = merged;
    this._write('questions', list);
    return { ok: true, question: merged };
  },

  // 删除题目：同步清理错题本里引用它的记录（错题榜不能挂着不存在的题）
  deleteQuestion(id) {
    const list = this.questions;
    if (!list.some(q => q.id === id)) return { ok: false, error: '题目不存在' };
    this._write('questions', list.filter(q => q.id !== id));
    this._write('wrongbook', this.wrongbook.filter(r => r.questionId !== id));
    return { ok: true };
  },

  // 每日统计（战报用）。dateKey: 'YYYY-MM-DD'
  todayKey(now) {
    const d = new Date(now || Date.now());
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  dayStat(dateKey) {
    const all = this.dayStats;
    return all[dateKey] || { answered: 0, correct: 0, maxCombo: 0, litCount: 0, closures: 0, arithRounds: 0, arithCorrect: 0, arithTotal: 0 };
  },

  bumpDayStat(dateKey, patch) {
    const all = this.dayStats;
    const cur = this.dayStat(dateKey);
    for (const k of Object.keys(patch)) {
      if (k === 'maxCombo') cur[k] = Math.max(cur[k] || 0, patch[k]);
      else cur[k] = (cur[k] || 0) + patch[k];
    }
    all[dateKey] = cur;
    this.dayStats = all;
  },

  // ===== 备份：导出 / 导入（进度数据一学年不能丢） =====
  // 导出：收集全部 tutor.* 原始键值（不解析、不丢精度，原样往返）
  exportData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(STORE_PREFIX)) data[k] = localStorage.getItem(k);
    }
    return { app: 'tutor', version: 1, exportedAt: new Date().toISOString(), data };
  },

  // 导入：写回前只做结构校验（app 标识 + 至少含一个合法键），覆盖式恢复
  importData(payload) {
    if (!payload || payload.app !== 'tutor' || !payload.data || typeof payload.data !== 'object')
      return { ok: false, error: '格式不对' };
    const keys = Object.keys(payload.data).filter(k => k.startsWith(STORE_PREFIX));
    if (keys.length === 0) return { ok: false, error: '没有可恢复的数据' };
    for (const k of keys) localStorage.setItem(k, payload.data[k]);
    return { ok: true, count: keys.length };
  },
};
