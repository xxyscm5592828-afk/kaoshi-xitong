// 错题本「攻克清单」单元测试（node --test）
// 规则来源：开发文档 §7 销号闭环 / 升级机制 / 容量控制
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const mockLS = { _d: {}, get length() { return Object.keys(this._d).length; }, key(i) { return Object.keys(this._d)[i] ?? null; }, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };

function loadAll() {
  const srcs = ['storage.js', 'mastery.js', 'wrongbook.js']
    .map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  return new Function('localStorage', srcs + '; return { Store, Mastery, Wrongbook };')(mockLS);
}
const { Store, Mastery, Wrongbook } = loadAll();

const DAY = 86400000;
const T0 = 1700000000000; // 固定起点

const SEED = {
  seedVersion: 1,
  subjects: [{ id: 'math', name: '数学' }],
  knowledgePoints: [
    { id: 'kp1', subjectId: 'math', parentId: null, name: 'SAS 判定', order: 1, level: 4, weight: 5, prerequisites: [] },
  ],
  questions: [
    { id: 'q1', subjectId: 'math', knowledgePointId: 'kp1', type: 'single', stem: '题1', options: ['a', 'b'], answer: 0, explanation: '', difficulty: 2, expectedTime: 40, groupId: 'g1', groupRole: 'basic' },
    { id: 'q2', subjectId: 'math', knowledgePointId: 'kp1', type: 'single', stem: '题2（变式）', options: ['a', 'b'], answer: 1, explanation: '', difficulty: 2, expectedTime: 40, groupId: 'g1', groupRole: 'variant' },
    { id: 'q3', subjectId: 'math', knowledgePointId: 'kp1', type: 'single', stem: '题3', options: ['a', 'b'], answer: 0, explanation: '', difficulty: 3, expectedTime: 60, groupId: '', groupRole: 'basic' },
  ],
  lessons: {},
  settings: {},
};

function fresh() { mockLS._d = {}; Store.init(SEED); }
const Q1 = SEED.questions[0];

test('D0：答错入榜 → 自选错因 → 标记看懂 → 排程 D3', () => {
  fresh();
  const rec = Wrongbook.onWrong(Q1, 1, T0);
  assert.equal(rec.status, '待处理');
  assert.equal(rec.understood, false);

  Wrongbook.setErrorType(rec.id, '概念');
  assert.equal(Wrongbook.get(rec.id).errorType, '概念');

  Wrongbook.markUnderstood(rec.id, T0 + 1000);
  const r2 = Wrongbook.get(rec.id);
  assert.equal(r2.status, '重做中');
  assert.equal(r2.understood, true);
  assert.equal(r2.retestAt, T0 + 3 * DAY);
});

test('D0 当天不到期：due() 为空', () => {
  fresh();
  const rec = Wrongbook.onWrong(Q1, 1, T0);
  Wrongbook.markUnderstood(rec.id, T0 + 1000);
  const d = Wrongbook.due(T0 + DAY);
  assert.equal(d.retests.length, 0);
  assert.equal(d.variants.length, 0);
});

test('D3：到期重做出现在 due().retests', () => {
  fresh();
  const rec = Wrongbook.onWrong(Q1, 1, T0);
  Wrongbook.markUnderstood(rec.id, T0 + 1000);
  const d = Wrongbook.due(T0 + 3 * DAY + 1);
  assert.equal(d.retests.length, 1);
  assert.equal(d.retests[0].id, rec.id);
});

test('D3 重做通过：掌握度 +5，进入变式待测，D7 排程', () => {
  fresh();
  const rec = Wrongbook.onWrong(Q1, 1, T0);
  Wrongbook.markUnderstood(rec.id, T0 + 1000);
  const before = (Store.mastery.kp1 || Mastery.default()).score;

  const out = Wrongbook.submitRetest(rec.id, true, T0 + 3 * DAY);
  assert.equal(out.status, '变式待测');
  assert.equal(out.variantAt, T0 + 7 * DAY);
  const after = Store.mastery.kp1.score;
  assert.equal(after, Math.min(100, before + 5));
});

test('D3 重做不过：reappearCount+1，+3 天再排程', () => {
  fresh();
  const rec = Wrongbook.onWrong(Q1, 1, T0);
  Wrongbook.markUnderstood(rec.id, T0 + 1000);

  const out = Wrongbook.submitRetest(rec.id, false, T0 + 3 * DAY);
  assert.equal(out.status, '重做中');
  assert.equal(out.reappearCount, 1);
  assert.equal(out.retestAt, T0 + 6 * DAY);
  // 未到期不出现
  assert.equal(Wrongbook.due(T0 + 5 * DAY).retests.length, 0);
  assert.equal(Wrongbook.due(T0 + 6 * DAY).retests.length, 1);
});

test('D7 变式通过：掌握度 +8，销号 + dayStat closures+1', () => {
  fresh();
  const rec = Wrongbook.onWrong(Q1, 1, T0);
  Wrongbook.markUnderstood(rec.id, T0 + 1000);
  Wrongbook.submitRetest(rec.id, true, T0 + 3 * DAY);
  const before = Store.mastery.kp1.score;

  const out = Wrongbook.submitVariant(rec.id, true, T0 + 7 * DAY);
  assert.equal(out.status, '已销号');
  assert.equal(Store.mastery.kp1.score, Math.min(100, before + 8));
  assert.equal(Store.dayStat(Store.todayKey(T0 + 7 * DAY)).closures, 1);
  // 销号后不再出现在活跃与到期列表
  assert.equal(Wrongbook.active().length, 0);
  assert.equal(Wrongbook.due(T0 + 30 * DAY).retests.length, 0);
});

test('D7 变式不过：转顽固', () => {
  fresh();
  const rec = Wrongbook.onWrong(Q1, 1, T0);
  Wrongbook.markUnderstood(rec.id, T0 + 1000);
  Wrongbook.submitRetest(rec.id, true, T0 + 3 * DAY);

  const out = Wrongbook.submitVariant(rec.id, false, T0 + 7 * DAY);
  assert.equal(out.status, '顽固');
});

test('变式题选择：优先同题组 variant，其次同知识点不同题', () => {
  fresh();
  const rec = Wrongbook.onWrong(Q1, 1, T0);
  // q1 在 g1 组，q2 是 g1 的 variant → 优先选 q2
  assert.equal(Wrongbook.variantQuestionFor(rec).id, 'q2');

  // 无题组匹配时选同知识点不同题
  const rec3 = Wrongbook.onWrong(SEED.questions[2], 1, T0);
  const v = Wrongbook.variantQuestionFor(rec3);
  assert.ok(v.id !== 'q3');
  assert.equal(v.knowledgePointId, 'kp1');
});

test('变式兜底：同知识点无同型题时 allowAnyType 放宽到任意题型，绝不卡死', () => {
  mockLS._d = {};
  const seed = {
    seedVersion: 2,
    subjects: [{ id: 'math', name: '数学' }],
    knowledgePoints: [
      { id: 'kp9', subjectId: 'math', parentId: null, name: '孤题考点', order: 1, level: 4, weight: 5, prerequisites: [] },
      { id: 'kp10', subjectId: 'math', parentId: null, name: '独题考点', order: 2, level: 4, weight: 5, prerequisites: [] },
    ],
    questions: [
      { id: 's1', subjectId: 'math', knowledgePointId: 'kp9', type: 'single', stem: '单选', options: ['a', 'b'], answer: 0, explanation: '', difficulty: 2, expectedTime: 40, groupId: '', groupRole: 'basic' },
      { id: 'f1', subjectId: 'math', knowledgePointId: 'kp9', type: 'fill', stem: '填空', answer: '8', explanation: '', difficulty: 2, expectedTime: 40, groupId: '', groupRole: 'basic' },
      { id: 's9', subjectId: 'math', knowledgePointId: 'kp10', type: 'single', stem: '独题', options: ['a', 'b'], answer: 0, explanation: '', difficulty: 2, expectedTime: 40, groupId: '', groupRole: 'basic' },
    ],
    lessons: {}, settings: {},
  };
  Store.init(seed);

  // kp9：无同型第二题，但有异型题 → 严格模式 null，兜底模式给 f1
  const rec = Wrongbook.onWrong(seed.questions[0], 1, T0);
  assert.equal(Wrongbook.variantQuestionFor(rec), null);
  const v = Wrongbook.variantQuestionFor(rec, true);
  assert.ok(v, '兜底应给出同知识点任意题型的题');
  assert.equal(v.id, 'f1');
  assert.equal(v.knowledgePointId, 'kp9');

  // kp10：该考点只有一道题 → 连兜底也没有，返回 null（调用方据此走 AI 出题）
  const rec10 = Wrongbook.onWrong(seed.questions[2], 1, T0);
  assert.equal(Wrongbook.variantQuestionFor(rec10), null);
  assert.equal(Wrongbook.variantQuestionFor(rec10, true), null);
});

test('变式分层：不跳级——同层优先，无同层则给更低层而非拔高题', () => {
  mockLS._d = {};
  const seed = {
    seedVersion: 2,
    subjects: [{ id: 'math', name: '数学' }],
    knowledgePoints: [
      { id: 'kpA', subjectId: 'math', parentId: null, name: '同层优先', order: 1, level: 4, weight: 3, prerequisites: [] },
      { id: 'kpB', subjectId: 'math', parentId: null, name: '宁降层不跳级', order: 2, level: 4, weight: 3, prerequisites: [] },
    ],
    questions: [
      { id: 'a0', subjectId: 'math', knowledgePointId: 'kpA', type: 'single', stem: '原题', options: ['a', 'b'], answer: 0, explanation: '', difficulty: 3, expectedTime: 40, groupId: '', groupRole: 'basic' },
      { id: 'a3', subjectId: 'math', knowledgePointId: 'kpA', type: 'single', stem: '同层', options: ['a', 'b'], answer: 0, explanation: '', difficulty: 3, expectedTime: 40, groupId: '', groupRole: 'basic' },
      { id: 'a5', subjectId: 'math', knowledgePointId: 'kpA', type: 'single', stem: '拔高', options: ['a', 'b'], answer: 0, explanation: '', difficulty: 5, expectedTime: 60, groupId: '', groupRole: 'basic' },
      { id: 'b0', subjectId: 'math', knowledgePointId: 'kpB', type: 'single', stem: '原题', options: ['a', 'b'], answer: 0, explanation: '', difficulty: 3, expectedTime: 40, groupId: '', groupRole: 'basic' },
      { id: 'b1', subjectId: 'math', knowledgePointId: 'kpB', type: 'single', stem: '低层', options: ['a', 'b'], answer: 0, explanation: '', difficulty: 1, expectedTime: 30, groupId: '', groupRole: 'basic' },
      { id: 'b5', subjectId: 'math', knowledgePointId: 'kpB', type: 'single', stem: '拔高', options: ['a', 'b'], answer: 0, explanation: '', difficulty: 5, expectedTime: 60, groupId: '', groupRole: 'basic' },
    ],
    lessons: {}, settings: {},
  };
  Store.init(seed);
  // kpA：原题 diff3，池有同层 diff3 与拔高 diff5 → 取同层 a3，不取 a5
  const recA = Wrongbook.onWrong(seed.questions[0], 1, T0);
  assert.equal(Wrongbook.variantQuestionFor(recA).id, 'a3');
  // kpB：原题 diff3，池有 diff1 与 diff5 → 取 ≤ 原题最接近的 b1，不给拔高 b5
  const recB = Wrongbook.onWrong(seed.questions[3], 1, T0);
  assert.equal(Wrongbook.variantQuestionFor(recB).id, 'b1');
});

test('升级阶梯：reappearCount=2 触发溯源，=3 回炉；顽固状态直接回炉', () => {
  fresh();
  const rec = Wrongbook.onWrong(Q1, 1, T0);
  assert.equal(Wrongbook.upgradeLevel(rec), 0);
  rec.reappearCount = 2;
  assert.equal(Wrongbook.upgradeLevel(rec), 1);
  rec.reappearCount = 3;
  assert.equal(Wrongbook.upgradeLevel(rec), 2);
  rec.status = '顽固';
  assert.equal(Wrongbook.upgradeLevel(rec), 2);
});

test('同题重复答错：刷新原记录，不重复建', () => {
  fresh();
  Wrongbook.onWrong(Q1, 1, T0);
  const rec2 = Wrongbook.onWrong(Q1, 1, T0 + DAY);
  assert.equal(Wrongbook.active().length, 1);
  assert.equal(rec2.firstWrongAt, T0 + DAY);
  assert.equal(rec2.status, '待处理');
});

test('活跃上限 25：overLimit 生效；销号不占名额', () => {
  fresh();
  for (let i = 0; i < 25; i++) {
    const q = { ...Q1, id: 'q' + (100 + i) };
    Wrongbook.onWrong(q, 1, T0 + i);
  }
  assert.equal(Wrongbook.active().length, 25);
  assert.ok(Wrongbook.overLimit());

  Wrongbook.submitRetest(Wrongbook.active()[0].id, true, T0);
  // 重做通过只是进入变式待测，仍活跃
  assert.equal(Wrongbook.active().length, 25);
  Wrongbook.submitVariant(Wrongbook.active()[0].id, true, T0);
  assert.equal(Wrongbook.active().length, 24);
  assert.ok(!Wrongbook.overLimit());
});
