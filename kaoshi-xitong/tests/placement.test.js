// 入学摸底测试：探针骨架（真实题库）+ 四分档设定 + 会话状态机 + 副作用边界（不进错题本）
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const mockLS = { _d: {}, get length() { return Object.keys(this._d).length; }, key(i) { return Object.keys(this._d)[i] ?? null; }, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };

const DATA_FILES = [
  'data.js', 'data-math8b.js', 'data-chinese.js', 'data-english.js', 'data-physics.js',
  'data-history.js', 'data-geography.js', 'data-biology.js', 'data-politics.js',
];

function loadAll() {
  const srcs = ['storage.js', 'mastery.js', 'placement.js', 'quiz.js', 'wrongbook.js']
    .concat(DATA_FILES)
    .map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  return new Function('localStorage',
    srcs + '; return { Store, Mastery, Placement, Quiz, SEED };')(mockLS);
}

const { Store, Mastery, Placement, Quiz, SEED } = loadAll();

function fresh() {
  mockLS._d = {};
  Store.init(SEED);
  Store.activeSubjectId = 'math';
}

test('applyPlacement 四分档：对快=80 / 对=75 / 错快=45 / 错慢=25', () => {
  const now = Date.now();
  const fast = Mastery.applyPlacement(true, true, now);
  assert.equal(fast.score, 80);
  assert.equal(fast.reviewCount, 0);
  const normal = Mastery.applyPlacement(true, false, now);
  assert.equal(normal.score, 75);
  const slip = Mastery.applyPlacement(false, true, now);
  assert.equal(slip.score, 45, '错得很快疑似手滑，留池继续验（不到回炉线）');
  assert.equal(slip.wrongStreak, 1);
  const wrong = Mastery.applyPlacement(false, false, now);
  assert.equal(wrong.score, 25);
  assert.equal(wrong.wrongStreak, 1);
});

test('数学科摸底骨架：4 根基点在前 + 每章代表题，共 9 题', () => {
  fresh();
  const plan = Placement.probePlan('math');
  assert.equal(plan.length, 9);
  assert.deepEqual(plan.slice(0, 4), ['m7-pr1', 'm7-pr2', 'm7-pr3', 'm7-pr4']);
  // 后 5 个探针点分属 5 个不同章
  const kpIdx = Store.kpIndex();
  const chapters = plan.slice(4).map(id => {
    for (let cur = kpIdx[id]; cur; cur = kpIdx[cur.parentId]) if (cur.level === 2) return cur.id;
    return null;
  });
  assert.equal(new Set(chapters).size, 5);
});

test('build 生成的题序：题目存在、无重复、无主观题', () => {
  fresh();
  const active = Placement.build('math');
  assert.ok(active);
  assert.equal(active.idx, 0);
  assert.equal(active.order.length, 9);
  assert.equal(new Set(active.order).size, active.order.length);
  const qIdx = Store.questionIndex();
  for (const qid of active.order) {
    const q = qIdx[qid];
    assert.ok(q, `题目 ${qid} 不存在`);
    assert.notEqual(q.type, 'subjective');
  }
});

test('needed 判定：未摸底 true，finish 后 false', () => {
  fresh();
  assert.equal(Placement.needed('math'), true);
  Placement.build('math');
  const qIdx = Store.questionIndex();
  const total = Store.placement.active.order.length;
  for (const qid of Store.placement.active.order.slice()) {
    const q = qIdx[qid];
    Placement.record(q, true, 10, Date.now());
  }
  assert.equal(Store.placement.active.idx, total);
  const summary = Placement.finish();
  assert.equal(Placement.needed('math'), false);
  assert.equal(summary.correctCount, total);
  assert.equal(summary.total, total);
  assert.equal(summary.weakKps.length, 0);
  assert.equal(Store.placement.active, null);
});

test('record 写掌握度与作答明细，但不进错题本', () => {
  fresh();
  Placement.build('math');
  const q = Placement.current();
  const wrongAttempsBefore = 0;
  Placement.record(q, false, (q.expectedTime || 60) * 2, Date.now());
  const m = Store.mastery[q.knowledgePointId];
  assert.ok(m, '摸底作答后该知识点应有掌握度记录');
  assert.equal(m.score, 25);
  assert.equal(Store.attempts.length, 1);
  assert.equal(Store.wrongbook.length, wrongAttempsBefore, '摸底答错不应产生错题记录');
});

test('摸底答错又慢的知识点被剔出刷题池（score<30），且诊断不误判先修链', () => {
  fresh();
  Placement.build('math');
  const q = Placement.current();
  Placement.record(q, false, (q.expectedTime || 60) * 2, Date.now());
  const kp = Store.kpIndex()[q.knowledgePointId];
  const now = Date.now();
  const m = Store.mastery[q.knowledgePointId];
  assert.equal(Mastery.priority(m, kp, now), -Infinity);
  // diagnose 不因摸底错分沿先修链误下钻（本点已实测，walk 在 score>=60 时才停止——错点自身即根因候选）
  const diag = Mastery.diagnose(kp, Store.mastery, Store.kpIndex());
  assert.ok(diag.root);
});

test('中途退出：会话保留（重进从下一题继续）、不标记完成、已写掌握度保留', () => {
  fresh();
  Placement.build('math');
  const q = Placement.current();
  Placement.record(q, true, 10, Date.now());
  // 退出只回主页，不清 active——重进 current() 应是第 2 题
  assert.ok(Store.placement.active, '退出后应保留进行中会话');
  assert.equal(Placement.needed('math'), true);
  assert.ok(Store.mastery[q.knowledgePointId], '已答部分的掌握度应保留');
  const resumed = Placement.current();
  const qIdx = Store.questionIndex();
  assert.equal(resumed.id, qIdx[Store.placement.active.order[1]].id, '重进应从下一题继续');
  const { pos } = Placement.progress();
  assert.equal(pos, 2);
});

test('其他科目通用骨架：结构根点在前 + 补章，共 5 题', () => {
  fresh();
  const physics = Store.subjects.find(s => s.id === 'physics');
  Store.activeSubjectId = 'physics';
  const plan = Placement.probePlan('physics');
  assert.equal(plan.length, 5);
  assert.deepEqual(plan.slice(0, 3), Placement._structureRoots('physics', 3), '结构根点排在章代表题之前');
  const active = Placement.build('physics');
  assert.ok(active, `物理应能组出摸底题（叶点有题即可）`);
  assert.equal(active.order.length, 5);
  const qIdx = Store.questionIndex();
  for (const qid of active.order) {
    const q = qIdx[qid];
    assert.equal(q.subjectId, 'physics');
    assert.notEqual(q.type, 'subjective');
  }
  assert.ok(physics);
});

test('刷新恢复：build 后读到同一进度', () => {
  fresh();
  Placement.build('math');
  const q1 = Placement.current();
  Placement.record(q1, true, 10, Date.now());
  // 模拟刷新：重新从 localStorage 读取（Store getter 每次都读）
  const again = Placement.current();
  const qIdx = Store.questionIndex();
  assert.equal(again.id, qIdx[Store.placement.active.order[1]].id);
  const { pos, total } = Placement.progress();
  assert.equal(pos, 2);
  assert.equal(total, 9);
});

test('analysisPlan：约 20 题分层抽样，无重复、均为该科有题叶点', () => {
  fresh();
  const plan = Placement.analysisPlan('math');
  assert.ok(plan.length >= 10 && plan.length <= 20, `数学分析计划应在 10~20 题之间，实际 ${plan.length}`);
  assert.equal(new Set(plan).size, plan.length, '每叶点最多 1 题');
  const kpIdx = Store.kpIndex();
  for (const id of plan) {
    const kp = kpIdx[id];
    assert.ok(kp && kp.subjectId === 'math' && kp.level === 4, `点 ${id} 应为数学 L4 叶点`);
    assert.ok(Placement.hasQuestion(id), `点 ${id} 应有题`);
  }
});

test('analysisPlan 跳过已点亮（eff≥85）的叶点', () => {
  fresh();
  const now = Date.now();
  const litIds = Store.knowledgePoints
    .filter(k => k.subjectId === 'math' && k.level === 4 && Placement.hasQuestion(k.id))
    .slice(0, 3).map(k => k.id);
  for (const id of litIds) {
    Store.mastery = { ...Store.mastery, [id]: { score: 90, lastReviewAt: now, reviewCount: 2, correctStreak: 2, fastStreak: 2, wrongStreak: 0, interval: 4 } };
  }
  const plan = Placement.analysisPlan('math');
  for (const id of litIds) {
    assert.ok(!plan.includes(id), `已点亮点 ${id} 不应再被抽测`);
  }
});

test('diag 会话：纯诊断 build→record（results 带 actualTime）→finish，不落 mastery/attempts/done', () => {
  fresh();
  const active = Placement.diag.build('math');
  assert.ok(active);
  assert.equal(active.idx, 0);
  const q = Placement.diag.current();
  assert.ok(q, 'diag.current 应返回首题');
  const { pos, total } = Placement.diag.progress();
  assert.equal(pos, 1);
  assert.equal(total, active.order.length);
  Placement.diag.record(q, true, 10, Date.now());
  assert.equal(Store.placement.diag.results.length, 1);
  assert.equal(Store.placement.diag.results[0].actualTime, 10, 'results 必须带 actualTime 供熟练度维度');
  assert.equal(Store.attempts.length, 0, '纯诊断不落作答明细');
  assert.ok(!Store.mastery[q.knowledgePointId], '纯诊断不落掌握度');
  while (Placement.diag.current()) {
    Placement.diag.record(Placement.diag.current(), false, 60, Date.now());
  }
  const summary = Placement.diag.finish();
  assert.ok(summary);
  assert.equal(summary.subjectId, 'math');
  assert.equal(summary.total, active.order.length);
  assert.equal(summary.results.length, active.order.length);
  assert.equal(Store.placement.diag, null);
  assert.equal(Placement.needed('math'), true, '纯诊断不标记已摸底（首次摸底引导仍会触发）');
  assert.deepEqual(Store.mastery, {}, '全程不写任何掌握度');
  assert.equal(Store.attempts.length, 0, '全程不写任何作答明细');
});
