// 题库 CRUD 单元测试（node --test）
// 规则来源：开发文档阶段 1「题库管理界面：录入/编辑（题型/知识点/expectedTime/题组标注）」
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const mockLS = { _d: {}, get length() { return Object.keys(this._d).length; }, key(i) { return Object.keys(this._d)[i] ?? null; }, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };

function loadAll() {
  const srcs = ['storage.js']
    .map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  return new Function('localStorage', srcs + '; return { Store };')(mockLS);
}
const { Store } = loadAll();

const SEED = {
  seedVersion: 1,
  subjects: [{ id: 'math', name: '数学' }, { id: 'geo', name: '地理' }],
  knowledgePoints: [
    { id: 'book', subjectId: 'math', parentId: null, name: '数学·八上', order: 1, level: 1, weight: 3, prerequisites: [] },
    { id: 'kp1', subjectId: 'math', parentId: 'book', name: 'SAS 判定', order: 1, level: 4, weight: 5, prerequisites: [] },
    { id: 'geo1', subjectId: 'geo', parentId: null, name: '季风气候', order: 1, level: 4, weight: 5, prerequisites: [] },
  ],
  questions: [
    { id: 'q1', subjectId: 'math', knowledgePointId: 'kp1', type: 'single', stem: '题1', options: ['a', 'b'], answer: 0, explanation: 'x', difficulty: 2, expectedTime: 40, groupId: '', groupRole: 'basic' },
  ],
  lessons: {},
  settings: {},
};

function fresh() { mockLS._d = {}; Store.init(SEED); }

const GOOD_SINGLE = {
  knowledgePointId: 'kp1', type: 'single', stem: '新题', options: ['甲', '乙'], answer: 1,
  explanation: '解析', difficulty: 2, expectedTime: 30,
};

test('addQuestion：合法单选题入库，id 为 c-1，subjectId 跟随知识点', () => {
  fresh();
  const res = Store.addQuestion(GOOD_SINGLE);
  assert.equal(res.ok, true);
  assert.equal(res.question.id, 'c-1');
  assert.equal(res.question.subjectId, 'math');
  assert.equal(Store.questions.length, 2);
  assert.equal(Store.questionIndex()['c-1'].stem, '新题');
});

test('addQuestion：id 递增且不与种子冲突', () => {
  fresh();
  Store.addQuestion(GOOD_SINGLE);
  const res2 = Store.addQuestion({ ...GOOD_SINGLE, stem: '第二题' });
  assert.equal(res2.question.id, 'c-2');
});

test('addQuestion：judge 题选项规范化为 [对, 错]', () => {
  fresh();
  const res = Store.addQuestion({ knowledgePointId: 'kp1', type: 'judge', stem: '判断', options: [], answer: 1, explanation: 'x', difficulty: 1, expectedTime: 20 });
  assert.equal(res.ok, true);
  assert.deepEqual(res.question.options, ['对', '错']);
  assert.equal(res.question.answer, 1);
});

test('addQuestion：fill/subjective 题选项为空数组，答案入库', () => {
  fresh();
  const fill = Store.addQuestion({ knowledgePointId: 'kp1', type: 'fill', stem: '填____空', options: ['x'], answer: '答', explanation: 'x', difficulty: 1, expectedTime: 20 });
  assert.equal(fill.ok, true);
  assert.deepEqual(fill.question.options, []);
  assert.equal(fill.question.answer, '答');
  const subj = Store.addQuestion({ knowledgePointId: 'kp1', type: 'subjective', stem: '论述', options: [], answer: '参考', explanation: 'x', difficulty: 3, expectedTime: 90 });
  assert.equal(subj.ok, true);
  assert.equal(subj.question.answer, '参考');
});

test('addQuestion：multi 题答案存索引数组', () => {
  fresh();
  const res = Store.addQuestion({ knowledgePointId: 'kp1', type: 'multi', stem: '多选', options: ['甲', '乙', '丙'], answer: [0, 2], explanation: 'x', difficulty: 2, expectedTime: 40 });
  assert.equal(res.ok, true);
  assert.deepEqual(res.question.answer, [0, 2]);
});

test('addQuestion 校验拒绝：挂非 L4 知识点 / 不存在的知识点', () => {
  fresh();
  assert.equal(Store.addQuestion({ ...GOOD_SINGLE, knowledgePointId: 'book' }).error, '题目只能挂在知识点树的叶子（L4）上');
  assert.equal(Store.addQuestion({ ...GOOD_SINGLE, knowledgePointId: 'nope' }).error, '知识点不存在');
});

test('addQuestion 校验拒绝：题干/解析为空、expectedTime 非法', () => {
  fresh();
  assert.equal(Store.addQuestion({ ...GOOD_SINGLE, stem: '  ' }).error, '题干不能为空');
  assert.equal(Store.addQuestion({ ...GOOD_SINGLE, explanation: '' }).error, '解析不能为空');
  assert.equal(Store.addQuestion({ ...GOOD_SINGLE, expectedTime: 0 }).error, '预计用时必须大于 0 秒');
  assert.equal(Store.addQuestion({ ...GOOD_SINGLE, expectedTime: 'abc' }).error, '预计用时必须大于 0 秒');
});

test('addQuestion 校验拒绝：单选答案越界 / 选项空 / 多选少于 2 项或重复', () => {
  fresh();
  assert.equal(Store.addQuestion({ ...GOOD_SINGLE, answer: 2 }).error, '答案索引超出选项范围');
  assert.equal(Store.addQuestion({ ...GOOD_SINGLE, options: ['甲', ' '] }).error, '有选项是空的');
  const multi = { ...GOOD_SINGLE, type: 'multi', options: ['甲', '乙'], answer: [0, 1] };
  assert.equal(Store.addQuestion({ ...multi, answer: [0] }).error, '多选题答案至少选 2 项');
  assert.equal(Store.addQuestion({ ...multi, answer: [0, 0] }).error, '多选题答案有重复项');
  assert.equal(Store.addQuestion({ ...multi, answer: [0, 5] }).error, '多选题答案索引超出选项范围');
});

test('addQuestion 校验拒绝：判断/填空/主观答案缺失，难度非法', () => {
  fresh();
  assert.equal(Store.addQuestion({ ...GOOD_SINGLE, type: 'judge', answer: 2 }).error, '判断题答案须为「对」或「错」');
  assert.equal(Store.addQuestion({ ...GOOD_SINGLE, type: 'fill', answer: ' ' }).error, '填空题答案不能为空');
  assert.equal(Store.addQuestion({ ...GOOD_SINGLE, type: 'subjective', answer: '' }).error, '参考答案不能为空');
  assert.equal(Store.addQuestion({ ...GOOD_SINGLE, difficulty: 6 }).error, '难度须为 1~5 的整数');
});

test('updateQuestion：改题干/答案/题组标注生效', () => {
  fresh();
  const res = Store.updateQuestion('q1', { stem: '改后', answer: 1, groupId: 'g9', groupRole: 'variant' });
  assert.equal(res.ok, true);
  const q = Store.questionIndex()['q1'];
  assert.equal(q.stem, '改后');
  assert.equal(q.answer, 1);
  assert.equal(q.groupId, 'g9');
  assert.equal(q.groupRole, 'variant');
});

test('updateQuestion：换挂知识点后 subjectId 跟随', () => {
  fresh();
  const res = Store.updateQuestion('q1', { knowledgePointId: 'geo1' });
  assert.equal(res.ok, true);
  assert.equal(Store.questionIndex()['q1'].subjectId, 'geo');
});

test('updateQuestion：非法 patch 被拒且原题不变', () => {
  fresh();
  const res = Store.updateQuestion('q1', { answer: 99 });
  assert.equal(res.ok, false);
  assert.equal(res.error, '答案索引超出选项范围');
  assert.equal(Store.questionIndex()['q1'].answer, 0);
  assert.equal(Store.updateQuestion('nope', { stem: 'x' }).error, '题目不存在');
});

test('deleteQuestion：删题 + 清理错题本引用', () => {
  fresh();
  // 先给 q1 造一条活跃错题记录
  const wb = Store.wrongbook;
  wb.push({ id: 'w1', questionId: 'q1', knowledgePointId: 'kp1', subjectId: 'math', status: '待处理', reappearCount: 0 });
  Store.wrongbook = wb;
  const res = Store.deleteQuestion('q1');
  assert.equal(res.ok, true);
  assert.equal(Store.questions.some(q => q.id === 'q1'), false);
  assert.equal(Store.wrongbook.some(r => r.questionId === 'q1'), false);
  assert.equal(Store.deleteQuestion('q1').error, '题目不存在');
});

test('CRUD 全链路：新增 → 练习流可取到 → 编辑 → 删除', () => {
  fresh();
  const add = Store.addQuestion(GOOD_SINGLE);
  assert.equal(Store.questionIndex()[add.question.id].type, 'single');
  Store.updateQuestion(add.question.id, { stem: '编辑后' });
  assert.equal(Store.questionIndex()[add.question.id].stem, '编辑后');
  Store.deleteQuestion(add.question.id);
  assert.equal(Store.questionIndex()[add.question.id], undefined);
  assert.equal(Store.questions.length, 1); // 只剩种子 q1
});

// ================= 阶段 3 §13.4：90 天作答明细聚合归档 =================
const DAY = 86400000;

test('archiveOldAttempts：超 90 天明细聚合到月度并移除，近期明细保留', () => {
  fresh();
  const now = Date.now();
  Store.attempts = [
    { id: 'old1', questionId: 'q1', knowledgePointId: 'kp1', correct: true, actualTime: 10, timestamp: now - 120 * DAY, closureType: 'variant' },
    { id: 'old2', questionId: 'q1', knowledgePointId: 'kp1', correct: false, actualTime: 20, timestamp: now - 100 * DAY, closureType: null },
    { id: 'new1', questionId: 'q1', knowledgePointId: 'kp1', correct: true, actualTime: 10, timestamp: now - 10 * DAY, closureType: null },
  ];
  const n = Store.archiveOldAttempts(now);
  assert.equal(n, 2, '跨两个月各归档一笔');
  assert.equal(Store.attempts.length, 1, '超期明细移除，近期保留');
  assert.equal(Store.attempts[0].id, 'new1');
  assert.equal(Store.monthly.length, 2);
  assert.equal(Store.monthly.reduce((s, m) => s + m.answered, 0), 2);
  assert.equal(Store.monthly.reduce((s, m) => s + m.correct, 0), 1);
  assert.equal(Store.monthly.reduce((s, m) => s + m.closures, 0), 1, '销号类作答单独计数');
});

test('archiveOldAttempts：同月再次归档合并计数；无超期明细返回 0 不动 attempts', () => {
  fresh();
  const now = Date.now();
  Store.attempts = [{ id: 'a', questionId: 'q1', knowledgePointId: 'kp1', correct: true, actualTime: 10, timestamp: now - 100 * DAY, closureType: null }];
  Store.archiveOldAttempts(now);
  Store.attempts = [{ id: 'b', questionId: 'q1', knowledgePointId: 'kp1', correct: false, actualTime: 10, timestamp: now - 95 * DAY, closureType: null }];
  const n2 = Store.archiveOldAttempts(now);
  assert.equal(n2, 1);
  assert.equal(Store.monthly.length, 1);
  assert.equal(Store.monthly[0].answered, 2);
  assert.equal(Store.monthly[0].correct, 1);
  // 全近期 → 0
  Store.attempts = [{ id: 'c', questionId: 'q1', knowledgePointId: 'kp1', correct: true, actualTime: 10, timestamp: now - 1 * DAY, closureType: null }];
  assert.equal(Store.archiveOldAttempts(now), 0);
  assert.equal(Store.attempts.length, 1);
});

test('aggregateDayStats：按区间累计战报（赛季结算/学期回望用）', () => {
  fresh();
  const start = new Date('2026-09-01T00:00:00').getTime();
  const now = start + 5 * DAY;
  Store.dayStats = {};
  Store.bumpDayStat(Store.todayKey(start), { answered: 1, litCount: 1 });
  Store.bumpDayStat(Store.todayKey(start), { answered: 1, correct: 1 });
  Store.bumpDayStat(Store.todayKey(now), { answered: 1, correct: 1 });
  const agg = Store.aggregateDayStats(start, now);
  assert.equal(agg.answered, 3);
  assert.equal(agg.correct, 2);
  assert.equal(agg.lit, 1, '点亮数须读 dayStats.litCount（回归：曾误读 st.lit 恒为 0）');
  const out = Store.aggregateDayStats(now + 1 * DAY, now + 2 * DAY);
  assert.equal(out.answered, 0, '区间外不计入');
});
