// 练习流程 v2 单元测试：评级 / 关卡化 session / 连击 / 连错降难度 / 战报数据
// 规则来源：开发文档 §5 §7.3 §10.2 §10.3 §11.7
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const mockLS = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };

function loadAll() {
  const srcs = ['storage.js', 'mastery.js', 'wrongbook.js', 'quiz.js']
    .map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  return new Function('localStorage', srcs + '; return { Store, Mastery, Wrongbook, Quiz };')(mockLS);
}
const { Store, Mastery, Wrongbook, Quiz } = loadAll();

const DAY = 86400000;
const T0 = 1700000000000;

function q(id, kpId, answer, difficulty, expectedTime, opts = {}) {
  return {
    id, subjectId: 'math', knowledgePointId: kpId, type: 'single', stem: id,
    options: ['对', '错'], answer, explanation: '', difficulty, expectedTime,
    groupId: opts.groupId || '', groupRole: opts.role || 'basic',
  };
}

const SEED = {
  seedVersion: 1,
  subjects: [{ id: 'math', name: '数学' }],
  knowledgePoints: [
    { id: 'k1', subjectId: 'math', parentId: null, name: 'K1', order: 1, level: 4, weight: 5, prerequisites: [] },
    { id: 'k2', subjectId: 'math', parentId: null, name: 'K2', order: 2, level: 4, weight: 3, prerequisites: [] },
    { id: 'k3', subjectId: 'math', parentId: null, name: 'K3', order: 3, level: 4, weight: 3, prerequisites: [] },
  ],
  questions: [
    q('qa', 'k1', 0, 2, 40, { groupId: 'g', role: 'basic' }),
    q('qb', 'k1', 1, 2, 40, { groupId: 'g', role: 'variant' }),
    q('qc', 'k2', 0, 1, 30),
    q('qd', 'k3', 0, 4, 60),
    q('qe', 'k3', 0, 2, 60),
  ],
  lessons: {},
  settings: {},
};

function fresh() { mockLS._d = {}; Store.init(SEED); }

test('评级边界：S(0.5) / A(1) / B(1.5) / C(>1.5)', () => {
  assert.equal(Quiz.rate(10, 20), 'S');
  assert.equal(Quiz.rate(20, 20), 'A');
  assert.equal(Quiz.rate(30, 20), 'B');
  assert.equal(Quiz.rate(31, 20), 'C');
});

test('planSession：无到期悬赏 → 3 突破 + 2 交错 + 1 必对收尾（40/40/20 配比）', () => {
  fresh();
  const s = Quiz.planSession(T0);
  assert.equal(s.stages.length, 6);
  assert.equal(s.stages[0].type, 'breakthrough');
  assert.equal(s.stages.filter(st => st.type === 'breakthrough').length, 3);
  assert.equal(s.stages.filter(st => st.type === 'interleave').length, 2);
  assert.equal(s.stages[5].type, 'safe');
});

test('planSession：有 D3 到期重做 → 悬赏排第一（热身），交错补足', () => {
  fresh();
  const rec = Wrongbook.onWrong(SEED.questions[0], 1, T0 - 4 * DAY);
  Wrongbook.markUnderstood(rec.id, T0 - 4 * DAY + 1000);
  const s = Quiz.planSession(T0);
  assert.equal(s.stages[0].type, 'retest');
  assert.equal(s.stages[0].recordId, rec.id);
  assert.equal(s.stages[1].type, 'breakthrough');
  assert.ok(s.stages.some(st => st.type === 'interleave'), '悬赏占用后仍保留交错题');
});

test('planSession：D3 与 D7 同时到期 → 重做 + 变式占前两题', () => {
  fresh();
  const rec1 = Wrongbook.onWrong(SEED.questions[0], 1, T0 - 4 * DAY); // qa：D3 到期
  Wrongbook.markUnderstood(rec1.id, T0 - 4 * DAY + 1000);
  const rec2 = Wrongbook.onWrong(SEED.questions[2], 1, T0 - 8 * DAY); // qc：已过重做，D7 到期
  Wrongbook.markUnderstood(rec2.id, T0 - 8 * DAY + 1000);
  Wrongbook.submitRetest(rec2.id, true, T0 - 5 * DAY);
  const s = Quiz.planSession(T0);
  assert.equal(s.stages[0].type, 'retest');
  assert.equal(s.stages[1].type, 'variant');
  assert.equal(s.stages[2].type, 'breakthrough');
});

test('questionFor：变式关在同型题缺失时给出同知识点兜底题（不卡关）', () => {
  mockLS._d = {};
  const seed = {
    seedVersion: 9,
    subjects: [{ id: 'math', name: '数学' }],
    knowledgePoints: [
      { id: 'kz', subjectId: 'math', parentId: null, name: 'KZ', order: 1, level: 4, weight: 5, prerequisites: [] },
    ],
    questions: [
      { id: 'z1', subjectId: 'math', knowledgePointId: 'kz', type: 'single', stem: 'z1', options: ['对', '错'], answer: 0, explanation: '', difficulty: 2, expectedTime: 40, groupId: '', groupRole: 'basic' },
      { id: 'z2', subjectId: 'math', knowledgePointId: 'kz', type: 'fill', stem: 'z2', answer: '1', explanation: '', difficulty: 2, expectedTime: 40, groupId: '', groupRole: 'basic' },
    ],
    lessons: {}, settings: {},
  };
  Store.init(seed);
  const rec = Wrongbook.onWrong(seed.questions[0], 1, T0 - 8 * DAY);
  Wrongbook.markUnderstood(rec.id, T0 - 8 * DAY + 1000);
  Wrongbook.submitRetest(rec.id, true, T0 - 5 * DAY); // → 变式待测，D7 到期

  const s = Quiz.planSession(T0);
  s.idx = s.stages.findIndex(st => st.type === 'variant');
  assert.ok(s.idx >= 0, '到期变式关应进入 session');
  const question = Quiz.questionFor(s, T0);
  assert.ok(question, '变式关必须能出题，不能静默跳过导致记录永久卡死');
  assert.equal(question.id, 'z2');
});

test('submitStage 突破题快对：combo+1、mastery+15、dayStats 记账', () => {
  fresh();
  const s = Quiz.planSession(T0);
  const stage = s.stages[0];
  const question = Quiz.questionFor(s, T0);
  const out = Quiz.submitStage(s, stage, question, 0, 10, T0); // r=0.25 → S

  assert.equal(out.correct, true);
  assert.equal(out.rating, 'S');
  assert.equal(out.combo, 1);
  assert.equal(out.newlyMastered, false);
  assert.equal(Store.mastery[question.knowledgePointId].score, 65);
  const st = Store.dayStat(Store.todayKey(T0));
  assert.equal(st.answered, 1);
  assert.equal(st.correct, 1);
  assert.equal(st.maxCombo, 1);
});

test('submitStage 答错：入悬赏榜、wrongStreak+1、combo 归零', () => {
  fresh();
  const s = Quiz.planSession(T0);
  let stage = s.stages[0];
  let question = Quiz.questionFor(s, T0);
  Quiz.submitStage(s, stage, question, 0, 10, T0); // 先对一题，combo=1

  Quiz.advance(s);
  stage = s.stages[1];
  question = Quiz.questionFor(s, T0); // qb（answer=1）
  const out = Quiz.submitStage(s, stage, question, 0, 10, T0); // 提交 0 → 答错

  assert.equal(out.correct, false);
  assert.equal(out.combo, 0);
  assert.equal(out.wrongStreak, 1);
  assert.ok(out.wrongRecordId);
  assert.equal(Wrongbook.active().length, 1);
  assert.equal(Store.dayStat(Store.todayKey(T0)).correct, 1);
});

test('连击：B/C 级答对不断连击，只不增长', () => {
  fresh();
  const s = Quiz.planSession(T0);
  let stage = s.stages[0];
  let question = Quiz.questionFor(s, T0);
  Quiz.submitStage(s, stage, question, 0, 10, T0); // S，combo 1

  Quiz.advance(s);
  stage = s.stages[1];
  question = Quiz.questionFor(s, T0);
  const out = Quiz.submitStage(s, stage, question, 1, question.expectedTime * 1.2, T0); // B 级答对
  assert.equal(out.combo, 1); // 不增不断
});

test('连错 2 题：下一道突破题自动降难度（difficulty ≤ 2）', () => {
  fresh();
  const s = Quiz.planSession(T0);
  s.wrongStreak = 2; // 模拟已连错两题
  // k3 的 qd 难度 4 应被跳过；k1 权重最高（qa 难度 2）
  const question = Quiz.questionFor(s, T0);
  assert.ok(question);
  assert.ok(question.difficulty <= 2, `难度 ${question.difficulty} 应 ≤ 2`);
});

test('必对收尾：从有效掌握度 ≥80 的知识点选题', () => {
  fresh();
  const mastery = Store.mastery;
  mastery.k2 = { score: 90, lastReviewAt: T0, reviewCount: 3, correctStreak: 3, fastStreak: 1, wrongStreak: 0, interval: 4 };
  Store.mastery = mastery;
  const s = Quiz.planSession(T0);
  const safeQ = Quiz.questionFor({ ...s, idx: s.stages.length - 1 }, T0);
  assert.equal(safeQ.knowledgePointId, 'k2');
  assert.equal(safeQ.id, 'qc');
});

test('必对收尾：无 ≥80 知识点时退化为最低难度题', () => {
  fresh();
  const s = Quiz.planSession(T0);
  const safeQ = Quiz.questionFor({ ...s, idx: s.stages.length - 1 }, T0);
  assert.ok(safeQ);
  assert.equal(safeQ.difficulty, 1);
});

test('newlyMastered：跨过掌握线点亮，dayStats.litCount 记账', () => {
  fresh();
  const mastery = Store.mastery;
  mastery.k1 = { score: 70, lastReviewAt: T0, reviewCount: 3, correctStreak: 2, fastStreak: 1, wrongStreak: 0, interval: 4 };
  Store.mastery = mastery;
  const s = Quiz.planSession(T0);
  const stage = s.stages[0];
  const question = Quiz.questionFor(s, T0); // k1 权重最高
  const out = Quiz.submitStage(s, stage, question, 0, 10, T0); // S：70+15=85，fastStreak 2
  assert.equal(out.newlyMastered, true);
  assert.equal(Store.dayStat(Store.todayKey(T0)).litCount, 1);
});

test('retest 阶段：submitStage 走销号闭环（不入悬赏、加成 +5）', () => {
  fresh();
  const rec = Wrongbook.onWrong(SEED.questions[0], 1, T0 - 4 * DAY);
  Wrongbook.markUnderstood(rec.id, T0 - 4 * DAY + 1000);
  const before = (Store.mastery.k1 || Mastery.default()).score;

  const s = Quiz.planSession(T0);
  assert.equal(s.stages[0].type, 'retest');
  const question = Quiz.questionFor(s, T0);
  assert.equal(question.id, 'qa');
  const out = Quiz.submitStage(s, s.stages[0], question, 0, 20, T0); // 答对原题

  assert.equal(out.correct, true);
  assert.equal(Wrongbook.get(rec.id).status, '变式待测');
  assert.equal(Store.mastery.k1.score, Math.min(100, before + 5));
  assert.equal(Wrongbook.active().length, 1); // 不新增悬赏
});

test('remedial：答错后微课通过 → 插入同知识点变式题', () => {
  fresh();
  const s = Quiz.planSession(T0);
  const stage = s.stages[0];
  const question = Quiz.questionFor(s, T0);
  const out = Quiz.submitStage(s, stage, question, 1, 10, T0); // 答错 qa

  // 模拟微课自测通过 → 插入补救变式
  Quiz.insertRemedial(s, question.knowledgePointId);
  const next = Quiz.questionFor({ ...s, idx: s.idx + 1 }, T0);
  assert.equal(next.knowledgePointId, question.knowledgePointId);
  assert.notEqual(next.id, question.id); // 不同题
});

test('planFocusSession：本点先攻（≤4 突破）+ 同科交错补足 + 1 必对收尾，共 6 关，并切当前科目', () => {
  fresh();
  const s = Quiz.planFocusSession('k3'); // k3 只有 2 题 → 2 突破 + 3 交错 + 1 收尾
  assert.ok(s);
  assert.equal(s.stages.length, 6);
  assert.equal(s.stages.filter(st => st.type === 'breakthrough').length, 2);
  assert.ok(s.stages.every(st => st.type !== 'breakthrough' || st.kpId === 'k3'));
  assert.equal(s.stages.filter(st => st.type === 'interleave').length, 3);
  assert.equal(s.stages[s.stages.length - 1].type, 'safe');
  assert.equal(Store.activeSubjectId, 'math');
});

test('planFocusSession：本点题量充足（≥4）→ 4 突破 + 1 交错 + 1 必对收尾', () => {
  fresh();
  for (let i = 0; i < 2; i += 1) { // k3 原 2 题，再补 2 题凑到 4 题
    Store.addQuestion({ knowledgePointId: 'k3', type: 'single', stem: 'k3-x' + i, options: ['对', '错'], answer: 0, explanation: '因为对', difficulty: 2, expectedTime: 40 });
  }
  const s = Quiz.planFocusSession('k3');
  assert.equal(s.stages.filter(st => st.type === 'breakthrough').length, 4);
  assert.equal(s.stages.filter(st => st.type === 'interleave').length, 1);
  assert.equal(s.stages.length, 6);
});

test('planFocusSession：无题知识点 / 非叶子节点返回 null', () => {
  fresh();
  Store.deleteQuestion('qc'); // 清掉 k2 唯一的题
  assert.equal(Quiz.planFocusSession('k2'), null);
  assert.equal(Quiz.planFocusSession('k1-x'), null);
});

test('questionFor：breakthrough 带 kpId → 锁定该知识点出题', () => {
  fresh();
  const s = Quiz.planFocusSession('k3');
  const q1 = Quiz.questionFor(s, T0);
  assert.equal(q1.knowledgePointId, 'k3');
  Quiz.submitStage(s, s.stages[0], q1, 0, 10, T0);
  Quiz.advance(s);
  const q2 = Quiz.questionFor(s, T0);
  assert.equal(q2.knowledgePointId, 'k3');
  assert.notEqual(q2.id, q1.id);
});

// ================= 溯源诊断选题（阶段 1 §5.5：根因优先 + 深度>2 回炉） =================
function kp(id, name, weight, prerequisites) {
  return { id, subjectId: 'math', parentId: null, name, order: 1, level: 4, weight, prerequisites };
}
function rec(id, score) {
  return { score, lastReviewAt: T0, reviewCount: 0, correctStreak: 0, fastStreak: 0, wrongStreak: 0, interval: 1 };
}

test('溯源选题：表层点指向的根因点加权优先（根因 70%：表层 30%）', () => {
  fresh();
  Store.reset({
    ...SEED,
    knowledgePoints: [kp('k1', '分式方程', 5, ['k2']), kp('k2', '一元一次方程', 5, []), kp('k3', '因式分解', 3, [])],
  });
  // k1 弱(30) 且先修 k2 更弱(45) → 根因 k2；k3 中游(50) 权重也低
  Store.mastery = { k1: rec('k1', 30), k2: rec('k2', 45), k3: rec('k3', 50) };
  const s = Quiz.planSession(T0);
  const q = Quiz.questionFor(s, T0);
  assert.equal(q.knowledgePointId, 'k2', '应先出根因点（先修）的题，而不是表层点 k1 或 k3');
});

test('溯源选题：先修链深度 >2 的点出池（回炉重学，不刷题）', () => {
  fresh();
  Store.reset({
    ...SEED,
    knowledgePoints: [kp('k1', 'A', 5, ['k2']), kp('k2', 'B', 5, ['k3']), kp('k3', 'C', 5, ['k4']), kp('k4', 'D', 5, [])],
  });
  // 四层全弱：diag(k1) depth 3 → k1 出池；k2/k3 仍在池且 k2 权重最高
  Store.mastery = { k1: rec('k1', 40), k2: rec('k2', 45), k3: rec('k3', 50), k4: rec('k4', 55) };
  const s = Quiz.planSession(T0);
  const q = Quiz.questionFor(s, T0);
  assert.ok(q);
  assert.notEqual(q.knowledgePointId, 'k1', '深度>2 的点应出池，转回炉重学');
});

test('溯源选题跨科：非数学科目（地理）同样按先修链找根因', () => {
  fresh();
  Store.reset({
    ...SEED,
    subjects: [{ id: 'math', name: '数学', default: true }, { id: 'geo', name: '地理', exam: true }],
    knowledgePoints: [
      { id: 'g1', subjectId: 'geo', parentId: null, name: '气候', order: 1, level: 4, weight: 4, prerequisites: ['g2'] },
      { id: 'g2', subjectId: 'geo', parentId: null, name: '气温', order: 2, level: 4, weight: 4, prerequisites: [] },
    ],
    questions: [
      q('qa', 'k1', 0, 2, 40),
      { ...q('qg1', 'g1', 0, 2, 40), subjectId: 'geo' },
      { ...q('qg2', 'g2', 0, 2, 40), subjectId: 'geo' },
    ],
    lessons: {}, settings: {},
  });
  Store.activeSubjectId = 'geo';
  // g1 弱且先修 g2 更弱 → 根因 g2，且不串到数学的 k1
  Store.mastery = { g1: rec('g1', 30), g2: rec('g2', 45) };
  const s = Quiz.planSession(T0);
  const question = Quiz.questionFor(s, T0);
  assert.ok(question, '地理科应有题可出');
  assert.equal(question.knowledgePointId, 'g2', '跨科时根因点（先修 g2）优先');
  assert.equal(question.subjectId, 'geo', '出题不串科');
});

// ================= 交错练习（阶段 3 §13.2：40% 题池 + 同科换点不连刷） =================
function masteryRec(score, fastStreak = 0) {
  return { score, lastReviewAt: T0, reviewCount: 1, correctStreak: 0, fastStreak, wrongStreak: 0, interval: 1 };
}

test('questionFor：interleave 关出交错题（非悬赏/非必对）', () => {
  fresh();
  const s = Quiz.planSession(T0);
  const i = s.stages.findIndex(st => st.type === 'interleave');
  assert.ok(i >= 0, 'session 应含交错关');
  const q = Quiz.questionFor({ ...s, idx: i }, T0);
  assert.ok(q);
  assert.ok(q.knowledgePointId === 'k1' || q.knowledgePointId === 'k2' || q.knowledgePointId === 'k3');
});

test('交错题：不连刷上一题的知识点（多个候选时换点）', () => {
  fresh();
  // k1 优先级最高（score 40）、k2 次之（score 45）、k3 已掌握出池
  Store.mastery = { k1: masteryRec(40), k2: masteryRec(45), k3: { score: 92, lastReviewAt: T0, reviewCount: 6, correctStreak: 3, fastStreak: 2, wrongStreak: 0, interval: 8 } };
  const s = Quiz.planSession(T0);
  s.usedQuestionIds = ['qa']; // 上一题是 k1 的题
  const q = Quiz.pickInterleave(s, T0);
  assert.ok(q);
  assert.notEqual(q.knowledgePointId, 'k1', '交错应换点，不连刷 k1');
});

test('交错题：无候选知识点（全掌握）返回 null，本关跳过', () => {
  fresh();
  const mastery = {};
  for (const kp of SEED.knowledgePoints) {
    mastery[kp.id] = { score: 92, lastReviewAt: T0, reviewCount: 6, correctStreak: 3, fastStreak: 2, wrongStreak: 0, interval: 8 };
  }
  Store.mastery = mastery;
  const s = Quiz.planSession(T0);
  assert.equal(Quiz.pickInterleave(s, T0), null);
});

// ================= 填空判分归一（ISSUE-005：全角/空白/大小写/符号等价） =================
test('grade 填空：全角→半角、去空白、忽略大小写后判等价', () => {
  fresh();
  const fill = ans => ({ type: 'fill', answer: ans });
  assert.equal(Quiz.grade(fill('x=8'), 'ｘ＝８'), true, '全角字母/等号/数字应等价');
  assert.equal(Quiz.grade(fill('2x+1'), ' 2x + 1 '), true, '半角空白应忽略');
  assert.equal(Quiz.grade(fill('2x+1'), '2x+1\u3000'), true, '全角空格应忽略');
  assert.equal(Quiz.grade(fill('ABC'), 'abc'), true, '大小写应忽略');
  assert.equal(Quiz.grade(fill('8'), '9'), false, '不同答案不得判对');
});

test('grade 填空：乘除减号与上标数字等价（×∗·⋅ / ÷∕ / −–— / ²）', () => {
  fresh();
  const fill = ans => ({ type: 'fill', answer: ans });
  assert.equal(Quiz.grade(fill('2*3'), '2×3'), true, '× 等价 *');
  assert.equal(Quiz.grade(fill('2*3'), '2·3'), true, '· 等价 *');
  assert.equal(Quiz.grade(fill('6/2'), '6÷2'), true, '÷ 等价 /');
  assert.equal(Quiz.grade(fill('-1'), '−1'), true, '− 等价 -');
  assert.equal(Quiz.grade(fill('x^2'), 'x²'), true, '上标 ² 等价 ^2');
});

// ================= 专项练作答时长预估（Part B②：告诉学生这组要花多久） =================
test('estFocusMinutes：按专项练题量口径（本点最多 4 题 + 同科补足到 6 题）折算作答分钟', () => {
  fresh();
  assert.equal(Quiz.estFocusMinutes('k1'), 4, 'k1 两题各 40s、同科均 46s → 约 4 分钟');
  assert.equal(Quiz.estFocusMinutes('k3'), 5, 'k3 两题各 60s，比 k1 更慢 → 约 5 分钟');
  assert.equal(Quiz.estFocusMinutes('nope'), 0, '没有题的落点估不出时长，返回 0（调用方不显示）');

  // 本点题量充足时只按 4 题算，剩余 2 题按同科平均补足——不是题越多预估越线性膨胀
  const many = Array.from({ length: 8 }, (_, i) => q('m' + i, 'k4', 0, 2, 60));
  mockLS._d = {};
  Store.init({
    ...SEED,
    knowledgePoints: [...SEED.knowledgePoints,
      { id: 'k4', subjectId: 'math', parentId: null, name: 'K4', order: 4, level: 4, weight: 3, prerequisites: [] }],
    questions: many,
  });
  assert.equal(Quiz.estFocusMinutes('k4'), 6, '8 题的点仍按「本点 4 题 + 补足 2 题」= 6 分钟（6×60s）');
});
