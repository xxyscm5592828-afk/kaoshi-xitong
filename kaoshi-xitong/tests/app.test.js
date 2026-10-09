// 答错链路单元测试（node --test，零真实 DOM）
// 覆盖：afterUnderstood 决策三态；答错后统一走题级讲解卡（不再进追问式）；跟进练习二选一
// 说明：app.js 依赖 DOM，本文件用最小 FakeEl stub 驱动，fetch 以参数注入沙箱。
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

global.alert = () => {}; // 空作答/空复述的拦截提示，测试里只断言不放行

const mockLS = { _d: {}, get length() { return Object.keys(this._d).length; }, key(i) { return Object.keys(this._d)[i] ?? null; }, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };

// 最小 DOM stub：querySelector 缓存（事件绑定与触发同一对象）、错因/选项按钮可缓存查询
class FakeEl {
  constructor(tag) {
    this.tag = tag || '';
    this.listeners = {};
    this.innerHTML = '';
    this.dataset = {};
    this.value = '';
    this.disabled = false;
    this.style = {};
    // classList 记录真实类名：方案 B 要断言「正确答案标绿」的时机
    const cls = new Set();
    this.classList = {
      add: c => cls.add(c),
      remove: c => cls.delete(c),
      toggle: (c, force) => { const on = force === undefined ? !cls.has(c) : !!force; on ? cls.add(c) : cls.delete(c); return on; },
      contains: c => cls.has(c),
    };
  }
  addEventListener(t, fn) { this.listeners[t] = fn; }
  querySelector(sel) {
    if (!this._qs) this._qs = {};
    if (!this._qs[sel]) this._qs[sel] = new FakeEl(sel);
    return this._qs[sel];
  }
  querySelectorAll(sel) {
    if (sel === '.error-type-btn') {
      if (!this._errs) {
        this._errs = ['概念', '程序', '审题', '计算'].map(t => { const b = new FakeEl(); b.dataset.type = t; return b; });
      }
      return this._errs;
    }
    if (sel === '.option') {
      if (!this._opts) {
        this._opts = Array.from({ length: 4 }, (_, i) => { const o = new FakeEl(); o.dataset.idx = i; return o; });
      }
      return this._opts;
    }
    return [];
  }
  click(t) { const fn = this.listeners[t]; if (fn) fn(); }
  focus() {}
  scrollIntoView() {} // app.js 结算/讲解卡有平滑滚动调用，桩掉即可
}

let fetchImpl = () => Promise.resolve({
  ok: true, status: 200,
  json: () => Promise.resolve({ choices: [{ message: { content: '好，方向对。', finish_reason: 'stop' } }] }),
});

function loadAll() {
  const srcs = ['storage.js', 'ai.js', 'assistant.js', 'data.js', 'scheduler.js', 'triggers.js',
    'mastery.js', 'placement.js', 'quiz.js', 'wrongbook.js', 'speech.js', 'lesson.js', 'report.js', 'games.js', 'facts.js', 'ui.js', 'celebrate.js', 'app.js']
    .map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  const fetchStub = (url, opt) => fetchImpl(url, opt);
  // window 桩：让 Speech 走「支持朗读」分支，验证接线点确实产出朗读按钮
  const winStub = { speechSynthesis: { speak() {}, cancel() {} }, SpeechSynthesisUtterance: function (t) { this.text = t; }, scrollTo() {}, print() {} };
  // app.js 顶层只有 DOMContentLoaded 注册，stub 掉即可；init() 不在测试里调用
  // body 为 null：Ui.popup 在无 DOM 环境下直接跳过（弹窗不进单测）
  const docStub = { addEventListener() {}, querySelectorAll() { return []; }, getElementById() { return null; }, createElement() { return new FakeEl(); }, body: null, documentElement: null };
  return new Function('localStorage', 'fetch', 'document', 'window',
    srcs + '; return { Store, AI, Assistant, Quiz, Wrongbook, Lesson, Report, App, Games, Facts, Ui, Triggers, COPY };')(mockLS, fetchStub, docStub, winStub);
}
const { Store, AI, Assistant, Quiz, Wrongbook, Lesson, App, Triggers } = loadAll();

const SEED = {
  seedVersion: 1,
  subjects: [{ id: 'math', name: '数学', default: true }],
  knowledgePoints: [{ id: 'kp1', subjectId: 'math', parentId: null, name: '一次函数图象', order: 1, level: 4, weight: 5, prerequisites: [] }],
  questions: [{
    id: 'q1', subjectId: 'math', knowledgePointId: 'kp1', type: 'single',
    stem: '一次函数 y=2x+1 的图象经过哪一象限？', options: ['第一、二、三', '第一、三、四', '第二、三、四', '第一、二、四'],
    answer: 0, explanation: '令 x=0 得 y=1，截距为正。', difficulty: 2, expectedTime: 40,
  }],
  lessons: { kp1: [{ version: 1, readTime: 60 }] },
  settings: { aiKey: 'k', assistantName: '爸爸' },
};
const Q = SEED.questions[0];
// 填空题夹具：用于断言「作答/答案对照」的揭晓时机（方案 B 延迟揭晓）
const QF = { ...Q, id: 'q1f', type: 'fill', options: null, stem: '一次函数 y=2x+1 与 y 轴交点坐标是____。', answer: '(0,1)' };

function makeRec() {
  return {
    id: 'wr1', questionId: 'q1', subjectId: 'math', knowledgePointId: 'kp1',
    status: '待处理', firstWrongAt: Date.now(), errorType: null,
    reappearCount: 0, retestAt: null, variantAt: null,
  };
}

let nextCalled = false;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function fresh(settings, seedOverrides) {
  mockLS._d = {};
  // lessons 等字段在 Store 里是只读 getter，需经 seed 写入（直接赋值会被静默忽略）
  Store.init({ ...SEED, ...(seedOverrides || {}), settings: settings || SEED.settings });
  // 默认模拟已摸底的老用户：主页渲染测试不受摸底引导分支影响（摸底逻辑由 placement.test.js 单测）
  const defSid = (Store.subjects.find(s => s.default) || Store.subjects[0] || {}).id;
  Store.placement = { done: defSid ? { [defSid]: true } : {}, active: null };
  // 默认模拟「学到哪儿」已登记（rootId 取首个 L4 叶，范围内照常出题）：直通车/今日待办相关测试走正常分支
  Store.unitScope = defSid ? { [defSid]: { bookId: 'kp1', chapterId: '', sectionId: '' } } : {};
  // 同 App.init：无活跃科目时落到默认科（收工页直通车按活跃科目出卡）
  if (!Store.activeSubjectId && defSid) Store.activeSubjectId = defSid;
  Store.wrongbook = [makeRec()];
  App.stage = { type: 'breakthrough' };
  App.session = null;
  App.dailyPlan = null;
  nextCalled = false;
  App.nextStage = () => { nextCalled = true; };
  fetchImpl = () => Promise.resolve({
    ok: true, status: 200,
    json: () => Promise.resolve({ choices: [{ message: { content: '好，方向对。', finish_reason: 'stop' } }] }),
  });
}

// 驱动 renderFeedback 答错链路：点指定错因 → 直接进题级讲解卡（无论有无 Key）
function clickErrorType(el, type) {
  const zone = el.querySelector('#result-zone');
  App.renderFeedback(el, Q, 2, 10, { correct: false, isSubjective: false, wrongRecordId: 'wr1', degradedNext: false });
  zone._errs.find(b => b.dataset.type === type).click('click');
  return zone;
}

test('afterUnderstood：概念错+有微课 → 推微课推荐页，不下一题，已标记重做中', () => {
  fresh();
  const el = new FakeEl('root');
  App.afterUnderstood(el, Q, '概念', 'wr1');
  assert.ok(el.innerHTML.includes('take-lesson'), '应渲染微课推荐页');
  assert.equal(nextCalled, false, '进入微课推荐页时不应直接下一题');
  assert.equal(Wrongbook.get('wr1').status, '重做中');
  assert.equal(Wrongbook.get('wr1').understood, true);
});

test('afterUnderstood：概念错+无微课 → 跟进练习二选一，不直接下一题', () => {
  fresh(undefined, { lessons: {} });
  const el = new FakeEl('root');
  App.afterUnderstood(el, Q, '概念', 'wr1');
  assert.ok(el.innerHTML.includes('followup-ai') && el.innerHTML.includes('followup-real'), '应渲染跟进练习二选一');
  assert.equal(nextCalled, false);
});

test('afterUnderstood：非概念错 + 无微课 → 跟进练习二选一，不直接下一题', () => {
  fresh(undefined, { lessons: {} });
  const el = new FakeEl('root');
  App.afterUnderstood(el, Q, '计算', 'wr1');
  assert.ok(el.innerHTML.includes('followup-ai') && el.innerHTML.includes('followup-real'), '无微课时仍进跟进练习二选一');
  assert.equal(nextCalled, false);
});

test('afterUnderstood：非概念错（有微课）→ 也推微课，不直接下一题', () => {
  fresh();
  const el = new FakeEl('root');
  App.afterUnderstood(el, Q, '审题', 'wr1');
  assert.ok(el.innerHTML.includes('take-lesson'), '放宽后非概念错因也应推微课');
  assert.equal(nextCalled, false);
});

// ================= 跟进练习二选一（§需求3）=================
test('跟进练习：选 AI 原创题 → 生成成功入库并插成本组下一关', async () => {
  fresh(undefined, { lessons: {} });
  const el = new FakeEl('root');
  App.session = { stages: [{ type: 'safe' }], idx: 0, combo: 0, maxCombo: 0, wrongStreak: 0, usedQuestionIds: [], results: [] };
  fetchImpl = () => Promise.resolve({
    ok: true, status: 200,
    json: () => Promise.resolve({ choices: [{ message: { content: JSON.stringify({ stem: '换个情境再来', options: ['甲', '乙', '丙', '丁'], answer: 1, explanation: '因为截距为正。' }) }, finish_reason: 'stop' }] }),
  });
  App.afterUnderstood(el, Q, '审题', 'wr1');
  el.querySelector('#followup-ai').click('click');
  await sleep(20);
  assert.ok(Store.questions.some(x => x.stem === '换个情境再来' && x.knowledgePointId === 'kp1'), '新题应入库');
  assert.equal(App.session.stages[1].type, 'remedial', '应插成本组下一关');
  assert.equal(nextCalled, true);
});

test('跟进练习：出题失败 → 降级页不阻塞，可继续做题', async () => {
  fresh(undefined, { lessons: {} });
  const el = new FakeEl('root');
  App.afterUnderstood(el, Q, '审题', 'wr1');
  el.querySelector('#followup-real').click('click');
  await sleep(20);
  assert.ok(el.innerHTML.includes('followup-continue'), '失败应降级为可继续页');
  assert.equal(nextCalled, false);
  el.querySelector('#followup-continue').click('click');
  assert.equal(nextCalled, true);
});

test('答错：无论有无 Key 都走题级讲解卡，不再进追问式', () => {
  for (const settings of [SEED.settings, { aiKey: '' }]) {
    fresh(settings);
    const el = new FakeEl('root');
    const zone = clickErrorType(el, '概念');
    assert.ok(zone.innerHTML.includes('错因已记下'), '错因已记下并进讲解卡');
    assert.ok(zone.innerHTML.includes('解析'), '讲解卡含解析');
    assert.ok(zone.innerHTML.includes('这道题考什么'), '讲解卡含考点');
    assert.ok(!el.innerHTML.includes('追问式讲解'), '无论有无 Key 都不应再进追问式');
  }
});

test('答错：讲解卡直接带微课入口，点击直达微课并标记已看懂', () => {
  fresh();
  const el = new FakeEl('root');
  const zone = clickErrorType(el, '概念');
  assert.ok(zone.innerHTML.includes('lesson-entry'), '有微课时讲解卡应含「上微课」入口');

  const calls = [];
  const origRender = Lesson.render;
  Lesson.render = (kpId, root, onPassed) => calls.push({ kpId, root, onPassed });
  try {
    zone.querySelector('#lesson-entry').click('click');
    assert.equal(calls.length, 1, '点击入口应直接进入微课');
    assert.equal(calls[0].kpId, 'kp1', '微课应对应本题知识点');
    assert.equal(Wrongbook.get('wr1').understood, true, '直达微课也应标记已看懂');
  } finally {
    Lesson.render = origRender;
  }
});

// ================= 主观题强制费曼复述（阶段 1 §13.3）=================
test('主观题：先强制费曼复述，讲完才放解析，复述入档', () => {
  fresh();
  const q = {
    id: 'q2', subjectId: 'math', knowledgePointId: 'kp1', type: 'subjective',
    stem: '证明 y=2x+1 是增函数', options: [], answer: '参考：斜率 2 > 0',
    explanation: '斜率 2>0，所以随 x 增大 y 增大。', difficulty: 2, expectedTime: 60,
  };
  const el = new FakeEl('root');
  const stage = { type: 'breakthrough' };
  App.answered = false;
  App.stage = stage;
  App.session = { stages: [stage], idx: 0, combo: 0, usedQuestionIds: [], results: [] };
  App.startAt = Date.now();
  App.renderQuestion(el, stage, q);

  // 先写解题过程（自评）并提交
  const zone = el.querySelector('#result-zone');
  const actions = el.querySelector('#action-zone');
  el.querySelector('#subj-answer').value = '因为 x 越大 y 越大';
  el.querySelector('#submit-btn').click('click');
  assert.ok(zone.innerHTML.includes('feynman-answer'), '提交后应先出现费曼复述框');
  assert.ok(!zone.innerHTML.includes('斜率 2>0'), '复述前不得泄露解析');

  // 空复述不放行
  actions.querySelector('#feynman-btn').click('click');
  assert.ok(!zone.innerHTML.includes('斜率 2>0'), '空复述不得放行');

  // 讲完 → 才出解析
  el.querySelector('#feynman-answer').value = '斜率大于 0，x 越大 y 越大，所以是增函数。';
  actions.querySelector('#feynman-btn').click('click');
  assert.ok(zone.innerHTML.includes('斜率 2>0'), '讲完后应出解析');

  // 复述已写入本次作答明细
  const last = Store.attempts[Store.attempts.length - 1];
  assert.equal(last.questionId, 'q2');
  assert.ok(last.feynman.includes('增函数'), '费曼复述应写入作答明细');
});

// ================= 学习页溯源诊断卡（阶段 1 §5.5：根因链 + 回炉建议） =================
function masteryRec(score) {
  return { score, lastReviewAt: Date.now(), reviewCount: 0, correctStreak: 0, fastStreak: 0, wrongStreak: 0, interval: 1 };
}

test('renderLearn：先修扎实 → 溯源卡提示直接练（good）', () => {
  fresh(undefined, { lessons: {} });
  const el = new FakeEl('root');
  App.learnKpId = 'kp1';
  App.renderLearn(el);
  assert.ok(el.innerHTML.includes('溯源诊断'), '学习页应展示溯源诊断卡');
  assert.ok(el.innerHTML.includes('先修链都够牢'), '无先修漏洞时应提示直接练');
});

test('renderLearn：先修链全弱（深度>2）→ 回炉重学建议（bad）', () => {
  fresh(undefined, {
    lessons: {},
    knowledgePoints: [
      { id: 'kp1', subjectId: 'math', parentId: null, name: '分式方程', order: 1, level: 4, weight: 5, prerequisites: ['kp2'] },
      { id: 'kp2', subjectId: 'math', parentId: null, name: '一元一次方程', order: 1, level: 4, weight: 5, prerequisites: ['kp3'] },
      { id: 'kp3', subjectId: 'math', parentId: null, name: '整式加减', order: 1, level: 4, weight: 5, prerequisites: ['kp4'] },
      { id: 'kp4', subjectId: 'math', parentId: null, name: '有理数运算', order: 1, level: 4, weight: 5, prerequisites: [] },
    ],
  });
  Store.mastery = {
    kp1: masteryRec(40), kp2: masteryRec(45), kp3: masteryRec(50), kp4: masteryRec(55),
  };
  const el = new FakeEl('root');
  App.learnKpId = 'kp1';
  App.renderLearn(el);
  assert.ok(el.innerHTML.includes('溯源诊断'));
  assert.ok(el.innerHTML.includes('回炉'), '深度>2 应给回炉建议');
  assert.ok(el.innerHTML.includes('4 层'), '应提示根因链层数');
  assert.ok(el.innerHTML.includes('有理数运算'), '根因点（链最底层）应出现在建议中');
});

// ================= 思路提示先行（对比分析 B3） =================
test('答疑提示先行：错题首轮只给提示+展开按钮；展开后给完整讲法；自由提问不启用', async () => {
  fresh();
  const bodies = [];
  fetchImpl = (url, opt) => {
    bodies.push(JSON.parse(opt.body));
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ choices: [{ message: { content: '先看 x=0 的时候。', finish_reason: 'stop' } }] }) });
  };
  const zone = new FakeEl('zone');
  App.renderAskPanel(zone, Wrongbook.get('wr1'), Q, () => {});
  assert.ok(!zone.innerHTML.includes('ask-expand'), '初始无展开按钮');

  // 首轮发送：system 应带思路提示规则
  zone._qs['#ask-input'].value = '这题怎么想？';
  zone._qs['#ask-send'].click('click');
  await sleep(20);
  assert.equal(bodies.length, 1);
  assert.match(bodies[0].messages[0].content, /思路提示模式/, '错题首轮应带提示规则');
  assert.ok(zone.innerHTML.includes('ask-expand'), '提示给出后应出现「继续展开」');
  assert.ok(zone.innerHTML.includes('继续展开'));

  // 点「继续展开」：第二轮不再带提示规则，走完整讲法
  zone._qs['#ask-expand'].click('click');
  await sleep(20);
  assert.equal(bodies.length, 2);
  assert.doesNotMatch(bodies[1].messages[0].content, /思路提示模式/, '展开轮应走完整讲法');
  const lastUser = bodies[1].messages.filter(m => m.role === 'user').pop();
  assert.equal(lastUser.content, '展开讲，这道题给我完整解法');
  assert.ok(!zone.innerHTML.includes('ask-expand'), '展开后按钮收起');

  // 自由提问（无 rec/q）：首轮也不带提示规则
  const zone2 = new FakeEl('zone2');
  App.renderAskPanel(zone2, null, null, () => {});
  zone2._qs['#ask-input'].value = '光合作用到底怎么回事？';
  zone2._qs['#ask-send'].click('click');
  await sleep(20);
  assert.equal(bodies.length, 3);
  assert.doesNotMatch(bodies[2].messages[0].content, /思路提示模式/, '自由提问不启用提示先行');
  assert.ok(!zone2.innerHTML.includes('ask-expand'));
});

// ================= 「下一步练什么」直通车（结算页 / 收工页） =================
const TWO_SUBJ_SEED = {
  subjects: [{ id: 'math', name: '数学', default: true }, { id: 'bio', name: '生物' }],
  knowledgePoints: [
    { id: 'kp1', subjectId: 'math', parentId: null, name: '一次函数图象', order: 1, level: 4, weight: 3, prerequisites: [] },
    { id: 'kp2', subjectId: 'bio', parentId: null, name: '鱼的主要特征', order: 1, level: 4, weight: 5, prerequisites: [] },
  ],
};

test('nextTargetCardHTML：有可攻知识点 → 渲染直通车卡（含 #next-target-btn 与 data-kp）', () => {
  fresh();
  const html = App.nextTargetCardHTML(Date.now(), 'math');
  assert.ok(html.includes('下一个该攻'), '应给出「下一个该攻」');
  assert.ok(html.includes('一次函数图象'), '应带知识点名');
  assert.ok(html.includes('data-kp="kp1"'), '按钮应带知识点 id');
  assert.ok(html.includes('next-target-btn'), '应带一键开练按钮');
});

test('nextTargetCardHTML：全部已掌握 → 不渲染空卡（返回空串）', () => {
  fresh();
  Store.mastery = { kp1: { score: 90, lastReviewAt: Date.now(), reviewCount: 3, correctStreak: 3, fastStreak: 3, wrongStreak: 0, interval: 7 } };
  assert.equal(App.nextTargetCardHTML(Date.now(), ''), '');
});

test('nextTargetCardHTML：传 subjectId → 只在该科内挑（别科更优点也不越科）', () => {
  fresh(SEED.settings, TWO_SUBJ_SEED);
  const html = App.nextTargetCardHTML(Date.now(), 'math');
  assert.ok(html.includes('一次函数图象'), '限科后取本科点');
  assert.ok(!html.includes('鱼的主要特征'), '不应越科取别的科目（尽管其权重更高）');
});

test('renderDoneToday：收工页在战报卡之后插入直通车卡并接好按钮', () => {
  fresh();
  const el = new FakeEl('root');
  App.renderDoneToday(el);
  assert.ok(el.innerHTML.includes('今日战报'), '保留原有战报卡');
  assert.ok(el.innerHTML.includes('下一个该攻'), '收工页应有直达卡');
  assert.ok(el.innerHTML.includes('next-target-btn'));
  assert.ok(el.querySelector('#next-target-btn').listeners.click, '一键开练按钮应已绑定点击');
});

test('renderSessionEnd：结算页直通车限定本组科目（不越科）', () => {
  fresh(SEED.settings, TWO_SUBJ_SEED);
  Store.activeSubjectId = 'math';
  App.dailyPlan = [{ subjectId: 'math', mode: '突破' }];
  App.planDone = [];
  App.session = { results: [{ newlyMastered: false }] };
  const el = new FakeEl('root');
  App.renderSessionEnd(el);
  assert.ok(el.innerHTML.includes('下一个该攻'), '结算页应有直达卡');
  assert.ok(el.innerHTML.includes('一次函数图象'));
  assert.ok(!el.innerHTML.includes('鱼的主要特征'), '结算页只给本组刚练科目的点');
});

// ================= 主动消息触发点：首页 → 结算页 =================
test('主动消息：触发点在结算页（首页只留常驻待办横幅，结算页出气泡且可跳过）', () => {
  const realNow = Date.now;
  Date.now = () => new Date(2026, 0, 10, 15, 0, 0).getTime(); // 固定本地白天，避开 22:00–06:00 静默红线
  try {
    fresh();
    App.proactiveShown = false;
    const home = new FakeEl('root');
    App.renderPractice(home);
    assert.ok(!home.innerHTML.includes('proactive-bubble'), '首页不再弹主动消息气泡（避免同页两条相近提示）');
    assert.ok(home.innerHTML.includes('今日待办'), '首页保留常驻「今日待办」横幅入口');

    const el = new FakeEl('root');
    App.session = { results: [{ newlyMastered: false }] };
    App.renderSessionEnd(el);
    assert.ok(el.innerHTML.includes('class="proactive-bubble"'), '结算页渲染主动消息气泡');
    const skip = el.querySelector('#pro-skip');
    assert.ok(skip.listeners.click, '「今天跳过」应已绑定点击');
    assert.equal(Triggers.skipped(App._proId, Date.now()), false, '点之前未记跳过');
    skip.parentNode = new FakeEl('bubble');
    skip.click('click');
    assert.equal(Triggers.skipped(App._proId, Date.now()), true, '点之后记入当日跳过表');
    assert.equal(skip.parentNode.style.display, 'none', '气泡就地收起（不重跑结算页副作用）');
  } finally { Date.now = realNow; }
});

// ================= 两处时间预估口径不打架（首页「整组体验含讲解」vs 结算页「纯作答」） =================
// 注意：本测例须排在会把 App.renderPractice 换成桩的「继续上次练习」测例之前
test('首页推荐组合卡：15 分钟标明「含讲解」口径，与结算页「做题约 X 分钟」区分开', () => {
  fresh();
  const home = new FakeEl('root');
  App.renderPractice(home);
  assert.ok(home.innerHTML.includes('约 15 分钟（含讲解）'), `首页应标明整组体验口径，实际：${home.innerHTML}`);
  assert.ok(!home.innerHTML.includes('做题约'), '首页不复用「做题约」这一纯作答口径，免得两个数字被当成同一件事');
});

// ================= 今日待办聚合入口（练习首页） =================
function dueRec() {
  return {
    id: 'wr1', questionId: 'q1', subjectId: 'math', knowledgePointId: 'kp1',
    status: '重做中', understood: true, retestAt: 0, firstWrongAt: Date.now(),
    reappearCount: 0, errorType: null,
  };
}

test('todayTodoHTML：到期悬赏 + 可攻点 → 聚合成一条待办（悬赏数 / 最弱点 / 一键开练）', () => {
  fresh();
  Store.wrongbook = [dueRec()];
  const html = App.todayTodoHTML(Date.now(), 'math');
  assert.ok(html.includes('due-banner'), '沿用悬赏横幅样式');
  assert.ok(html.includes('悬赏到期'), '应含到期悬赏数（e2e 依赖此文案）');
  assert.ok(html.includes('一次函数图象'), '应聚合最该攻的薄弱点');
  assert.ok(html.includes('id="todo-start"'), '应给一键开练入口');
});

test('todayTodoHTML：无到期悬赏但有可攻点 → 只给薄弱点，不出现悬赏条', () => {
  fresh();
  Store.wrongbook = [];
  const html = App.todayTodoHTML(Date.now(), 'math');
  assert.ok(html.includes('一次函数图象'));
  assert.ok(!html.includes('悬赏到期'), '没有到期悬赏就不该写悬赏数');
});

test('todayTodoHTML：无到期悬赏且无可攻点 → 不渲染（空串）', () => {
  fresh();
  Store.wrongbook = [];
  Store.mastery = { kp1: { score: 90, lastReviewAt: Date.now(), reviewCount: 3, correctStreak: 3, fastStreak: 3, wrongStreak: 0, interval: 7 } };
  assert.equal(App.todayTodoHTML(Date.now(), 'math'), '');
});

test('wireTodo：有到期悬赏 → 一键开练走本组题组（首关为悬赏重做，而非专项练）', () => {
  fresh();
  Store.wrongbook = [dueRec()];
  let rendered = 0;
  App.renderStage = () => { rendered += 1; };
  const el = new FakeEl('root');
  App.wireTodo(el);
  el.querySelector('#todo-start').click('click');
  assert.equal(rendered, 1, '应切到练题页');
  assert.ok(App.session, '应开出一组题');
  assert.equal(App.session.stages[0].type, 'retest', '到期悬赏应排在第一关');
});

test('wireTodo：无到期悬赏 → 一键开练直接打到最该攻的知识点（专项练）', () => {
  fresh();
  Store.wrongbook = [];
  let rendered = 0;
  App.renderStage = () => { rendered += 1; };
  const el = new FakeEl('root');
  App.wireTodo(el);
  el.querySelector('#todo-start').click('click');
  assert.equal(rendered, 1, '应切到练题页');
  assert.ok(App.session, '应开出一组题');
  assert.equal(App.session.stages[0].type, 'breakthrough');
  assert.equal(App.session.stages[0].kpId, 'kp1', '应锁定最该攻的点');
});

// ================= 未作答拦住提交（ISSUE-002：主流程同微课自测范式） =================
test('renderQuestion：未作答时提交按钮禁用，点击提示「请先作答再提交」；选中选项后放行', () => {
  fresh();
  const el = new FakeEl('root');
  const stage = { type: 'breakthrough' };
  App.answered = false;
  App.stage = stage;
  App.session = { stages: [stage], idx: 0, combo: 0, usedQuestionIds: [], results: [] };
  App.startAt = Date.now();
  let submitted = null;
  App.submitAnswer = (question, answer) => { submitted = answer; };
  App.renderQuestion(el, stage, Q);

  const btn = el.querySelector('#submit-btn');
  const hint = el.querySelector('#submit-hint');
  assert.equal(btn.disabled, true, '未作答按钮应禁用');
  assert.equal(hint.textContent, '', '未作答前无提示');
  btn.click('click');
  assert.equal(submitted, null, '未作答不得提交');
  assert.equal(hint.textContent, '请先作答再提交');
  assert.equal(btn.disabled, true, '拦截后按钮仍禁用');

  el.querySelectorAll('.option')[0].click('click');
  assert.equal(btn.disabled, false, '选中选项后按钮应放行');
  btn.click('click');
  assert.equal(submitted, 0, '放行后应按选项提交');
});

test('renderQuestion：填空空作答拦住，写入后（input 事件）放行', () => {
  fresh();
  const fq = { ...Q, id: 'f1', type: 'fill', answer: '8', options: [] };
  const el = new FakeEl('root');
  const stage = { type: 'breakthrough' };
  App.answered = false;
  App.stage = stage;
  App.session = { stages: [stage], idx: 0, combo: 0, usedQuestionIds: [], results: [] };
  App.startAt = Date.now();
  let submitted = null;
  App.submitAnswer = (question, answer) => { submitted = answer; };
  App.renderQuestion(el, stage, fq);

  const btn = el.querySelector('#submit-btn');
  assert.equal(btn.disabled, true, '空作答按钮应禁用');
  btn.click('click');
  assert.equal(el.querySelector('#submit-hint').textContent, '请先作答再提交');
  assert.equal(submitted, null, '空作答不得提交');

  el.querySelector('#fill-answer').value = '8';
  el.querySelector('#fill-answer').click('input');
  assert.equal(btn.disabled, false, '写入答案后应放行');
  btn.click('click');
  assert.equal(submitted, '8');
});

// ================= 题头题量按实际可出题数（ISSUE-004：题池不足不虚标） =================
test('renderQuestion：题头「第 pos/total 题」按本组实际可出题数（session.total），不按关卡数虚标', () => {
  fresh();
  const el = new FakeEl('root');
  const stage = { type: 'breakthrough' };
  App.answered = false;
  App.stage = stage;
  // 关卡 6 个，但本题池实际只能出 2 题
  App.session = { stages: Array.from({ length: 6 }, () => ({ type: 'breakthrough' })), total: 2, idx: 0, combo: 0, usedQuestionIds: [], results: [] };
  App.startAt = Date.now();
  App.renderQuestion(el, stage, Q);
  assert.ok(el.innerHTML.includes('第 1/2 题'), '应显示实际题量 1/2，而非 1/6');
});

// ================= 未练完的题组：继续 / 重开（ISSUE-006） =================
test('_loadSession：同日未练完可恢复，反馈页刷新时对齐到下一关，练完/跨天作废', () => {
  fresh();
  const today = Store.todayKey(Date.now());
  const base = { stages: [{ type: 'breakthrough' }, { type: 'interleave' }, { type: 'safe' }], idx: 0, combo: 0, usedQuestionIds: [], results: [] };
  Store.session = { dateKey: today, subjectId: 'math', session: base };
  assert.ok(App._loadSession(), '同日未练完应能恢复');

  Store.session = { dateKey: today, subjectId: 'math', session: { ...base, idx: 0, results: [{}, {}] } };
  assert.equal(App._loadSession().session.idx, 2, '恢复时应跳过已作答的题，别让同题再答一遍');

  Store.session = { dateKey: today, subjectId: 'math', session: { ...base, idx: 3 } };
  assert.equal(App._loadSession(), null, '练完的存档不应再提示恢复');

  Store.session = { dateKey: '2000-01-01', subjectId: 'math', session: base };
  assert.equal(App._loadSession(), null, '跨天存档应作废');
});

test('renderResumeSession：继续上次练习 → 恢复 session 与科目；重新开始 → 清存档回首页', () => {
  fresh();
  const today = Store.todayKey(Date.now());
  const saved = { dateKey: today, subjectId: 'math', session: { stages: [{ type: 'breakthrough' }, { type: 'safe' }], idx: 0, combo: 0, usedQuestionIds: [], results: [] } };

  let rendered = 0;
  App.renderStage = () => { rendered += 1; };
  const el = new FakeEl('root');
  App.renderResumeSession(el, saved);
  assert.ok(el.innerHTML.includes('上次那组还没练完'), '应先问一句再决定');
  el.querySelector('#resume-session').click('click');
  assert.equal(App.session, saved.session, '应恢复存档里的题组');
  assert.equal(rendered, 1, '应回到练题页');
  assert.equal(Store.activeSubjectId, 'math', '应切回存档的科目');

  let practiced = 0;
  App.renderPractice = () => { practiced += 1; };
  Store.session = saved;
  const el2 = new FakeEl('root2');
  App.renderResumeSession(el2, saved);
  el2.querySelector('#discard-session').click('click');
  assert.equal(Store.session, null, '重新开始应清掉存档');
  assert.equal(practiced, 1, '应回到练习首页重新开一组');
});

// ================= 「下一个该攻」带作答时长预估（Part B②） =================
test('nextTargetCardHTML：把最该攻的点的作答时长预估摆出来，方便决定要不要现在开工', () => {
  fresh();
  const html = App.nextTargetCardHTML(Date.now(), 'math');
  assert.ok(html.includes('下一个该攻：一次函数图象'), '应给出最该攻的点');
  assert.ok(html.includes('做题约 4 分钟'), `应带作答时长预估，实际：${html}`);
});

// ================= 方案 B：答错揭晓时机（别在归因前泄露答案） =================
test('答错揭晓时机：单选初次只标红错项，点错因揭晓后才标绿正确项', () => {
  fresh({ aiKey: '' });
  const el = new FakeEl('root');
  App.renderFeedback(el, Q, 1, 10, { correct: false, isSubjective: false, wrongRecordId: 'wr1', degradedNext: false });
  assert.equal(el._opts[1].classList.contains('wrong'), true, '学生选错的项应立即标红');
  assert.equal(el._opts[0].classList.contains('correct'), false, '揭晓前不得标绿正确答案（别瞬间泄露）');
  el.querySelector('#result-zone')._errs.find(b => b.dataset.type === '审题').click('click');
  assert.equal(el._opts[0].classList.contains('correct'), true, '点错因揭晓后应标绿正确答案');
});

test('答错揭晓时机：填空「你的作答/正确答案」对照也后移到揭晓时', () => {
  fresh({ aiKey: '' });
  const el = new FakeEl('root');
  App.renderFeedback(el, QF, '(0,0)', 10, { correct: false, isSubjective: false, wrongRecordId: 'wr1', degradedNext: false });
  const zone = el.querySelector('#result-zone');
  assert.ok(!zone.innerHTML.includes('你的作答'), '揭晓前不该先并列展示作答/答案');
  zone._errs.find(b => b.dataset.type === '审题').click('click');
  assert.ok(zone.innerHTML.includes('你的作答') && zone.innerHTML.includes('(0,1)'), '揭晓时应并列展示作答与正确答案');
});

test('无Key揭晓：给题级讲解卡（考什么+答案依据+章节定位），不再只有一句话', () => {
  fresh({ aiKey: '' });
  const el = new FakeEl('root');
  const zone = clickErrorType(el, '审题');
  assert.ok(zone.innerHTML.includes('这道题考什么'), '揭晓应给题级讲解卡');
  assert.ok(zone.innerHTML.includes('一次函数图象'), '讲解卡应点名考的知识点');
  assert.ok(zone.innerHTML.includes('章节定位'), '应给出课本章节定位行');
  assert.ok(!/\d+\s*页|P\.\s*\d/.test(zone.innerHTML), '不得出现页码');
});

test('D0 补处理兜底页（无Key）：也给题级讲解卡，不是只有一句话解析', () => {
  fresh({ aiKey: '' });
  const el = new FakeEl('root');
  App.renderD0Flow(el, { ...makeRec(), myAnswer: 1, correctAnswer: 0 }, Q, () => {});
  el._errs.find(b => b.dataset.type === '审题').click('click');
  assert.ok(el.innerHTML.includes('explain-card'), '兜底页应复用题级讲解卡');
  assert.ok(el.innerHTML.includes('这道题考什么'), '讲解卡应说明这道题考什么');
  assert.ok(el.innerHTML.includes('章节定位'), '讲解卡应含课本章节定位');
});

test('textbookRef：拼出「人教版 · 册次 · 章 › 节 › 知识点」，不含页码', () => {
  fresh(SEED.settings, {
    subjects: [{ id: 'math', name: '数学', default: true, textbook: '人教版' }],
    knowledgePoints: [
      { id: 'm8a', subjectId: 'math', parentId: null, name: '八年级上册', order: 1, level: 1 },
      { id: 'ch11', subjectId: 'math', parentId: 'm8a', name: '第11章 一次函数', order: 1, level: 2 },
      { id: 'sec1', subjectId: 'math', parentId: 'ch11', name: '函数', order: 1, level: 3 },
      { id: 'kp1', subjectId: 'math', parentId: 'sec1', name: '一次函数图象', order: 1, level: 4, weight: 5, prerequisites: [] },
    ],
  });
  const ref = App.textbookRef(Store.kpIndex()['kp1']);
  assert.ok(ref.includes('人教版'), `应含版本，实际：${ref}`);
  assert.ok(ref.includes('八年级上册'), '应含册次');
  assert.ok(ref.includes('第11章 一次函数'), '应含章');
  assert.ok(ref.includes('一次函数图象'), '应含知识点');
  assert.ok(!/\d+\s*页|P\.\s*\d/.test(ref), '不得含页码');
});

test('textbookRef：L3 节名与 L4 知识点同名时，相邻重复段只保留一次', () => {
  fresh(SEED.settings, {
    subjects: [{ id: 'math', name: '数学', default: true, textbook: '人教版' }],
    knowledgePoints: [
      { id: 'm8a', subjectId: 'math', parentId: null, name: '八年级上册', order: 1, level: 1 },
      { id: 'ch11', subjectId: 'math', parentId: 'm8a', name: '第11章 一次函数', order: 1, level: 2 },
      { id: 'sec1', subjectId: 'math', parentId: 'ch11', name: '一次函数图象', order: 1, level: 3 },
      { id: 'kp1', subjectId: 'math', parentId: 'sec1', name: '一次函数图象', order: 1, level: 4, weight: 5, prerequisites: [] },
    ],
  });
  const ref = App.textbookRef(Store.kpIndex()['kp1']);
  assert.strictEqual(ref, '人教版 · 八年级上册 · 第11章 一次函数 · 一次函数图象', `相邻同名段应去重，实际：${ref}`);
});

// ================= 主页版面重排（方案一 · 状态带置顶）=================
// 上面有旧用例把 App.renderPractice 打了桩（计数器）且不还原，会污染本组用例。
// 模块加载期（测试执行前）先存真身，freshHome 里恢复，保证测的是真实渲染。
const realRenderPractice = App.renderPractice;

function freshHome(seedOverrides) {
  mockLS._d = {};
  Store.init({ ...SEED, ...(seedOverrides || {}), settings: { aiKey: 'k', assistantName: '爸爸' } });
  const defSid = (Store.subjects.find(s => s.default) || Store.subjects[0] || {}).id;
  Store.placement = { done: defSid ? { [defSid]: true } : {}, active: null };
  App.renderPractice = realRenderPractice;
  App.session = null;
  App.dailyPlan = null;
  App.planSalt = 0;
  App.planDone = [];
}

test('主页重排：首个元素是状态带，选科卡常显于状态带之后', () => {
  freshHome();
  const el = new FakeEl('root');
  App.renderPractice(el);
  const html = el.innerHTML;
  const iStrip = html.indexOf('class="status-strip');
  const iPick = html.indexOf('pick-subject');
  assert.ok(iStrip !== -1, '应渲染状态带');
  assert.ok(html.trimStart().startsWith('<div class="status-strip'), '状态带应是首个元素');
  assert.ok(iPick !== -1 && iPick > iStrip, '选科卡应常显于状态带之后');
  assert.ok(html.includes('id="start-manual"'), '选科卡应含开练按钮');
  assert.ok(html.includes('id="start-session"'), '首块仍是 #start-session');
});

test('主页重排：考试模式已开时状态带变冲刺条并含退出按钮', () => {
  freshHome({ subjects: [{ id: 'bio', name: '生物', exam: true }] });
  Store.settings = { ...Store.settings, examMode: 'bio' };
  const el = new FakeEl('root');
  App.renderPractice(el);
  const html = el.innerHTML;
  const strip = html.slice(html.indexOf('class="status-strip'), html.indexOf('plan-grid'));
  assert.ok(strip.includes('level-hot'), '冲刺条应为 level-hot');
  assert.ok(strip.includes('冲刺中'), '应显示冲刺文案');
  assert.ok(strip.includes('id="exam-mode-off"'), '应含退出考试模式按钮');
});

// ================= 朗读接线（P2）：卡片按钮 + 朗读文本边界 =================
test('朗读接线：题级讲解卡带朗读按钮；朗读文本只念考点/解析/章节定位，不念作答对照', () => {
  fresh({ aiKey: '' });
  const el = new FakeEl('root');
  App.renderFeedback(el, QF, '(0,0)', 10, { correct: false, isSubjective: false, wrongRecordId: 'wr1', degradedNext: false });
  const zone = el.querySelector('#result-zone');
  zone._errs.find(b => b.dataset.type === '审题').click('click');
  assert.ok(zone.innerHTML.includes('data-speak="explain"'), '讲解卡应带朗读按钮');
  assert.ok(zone.innerHTML.includes('你的作答'), '卡片上仍展示作答对照，供学生自己看');
  const text = App.explainSpeechText(QF);
  assert.ok(text.includes('这道题考什么') && text.includes('解析'), '朗读文本应念考点与解析');
  assert.ok(!text.includes('你的作答') && !text.includes('(0,1)'), '朗读文本不应念作答对照');
});

test('朗读接线：问爸爸面板带朗读按钮（scope=ask）', () => {
  fresh();
  const zone = new FakeEl('ask');
  App.renderAskPanel(zone, null, null, () => {});
  assert.ok(zone.innerHTML.includes('data-speak="ask"'), '问爸爸面板应带朗读按钮');
});
