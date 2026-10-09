// 学习小游戏单元测试（阶段 3 §10.5：数据回流引擎，零 DOM）
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const mockLS = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };

function loadAll() {
  const srcs = ['storage.js', 'mastery.js', 'games.js']
    .map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  return new Function('localStorage', srcs + '; return { Store, Mastery, Games };')(mockLS);
}
const { Store, Mastery, Games } = loadAll();

const SEED = {
  seedVersion: 1,
  subjects: [{ id: 'math', name: '数学', default: true }, { id: 'english', name: '英语' }],
  knowledgePoints: [
    { id: 'm7-pr1', subjectId: 'math', parentId: null, name: '有理数运算', order: 1, level: 4, weight: 4, prerequisites: [] },
    { id: 'k1', subjectId: 'math', parentId: null, name: '一次函数', order: 2, level: 4, weight: 5, prerequisites: [] },
    { id: 'e1', subjectId: 'english', parentId: null, name: '核心词汇', order: 1, level: 4, weight: 3, prerequisites: [] },
  ],
  questions: [
    { id: 'q1', subjectId: 'math', knowledgePointId: 'm7-pr1', type: 'single', stem: 's', options: ['a', 'b'], answer: 0, explanation: 'x', difficulty: 2, expectedTime: 40 },
    { id: 'w1', subjectId: 'english', knowledgePointId: 'e1', type: 'single', stem: 'apple', options: ['苹果', '香蕉', '橘子', '葡萄'], answer: 0, explanation: 'x', difficulty: 1, expectedTime: 15 },
    { id: 'w2', subjectId: 'english', knowledgePointId: 'e1', type: 'single', stem: 'book', options: ['书', '笔', '桌子', '椅子'], answer: 0, explanation: 'x', difficulty: 1, expectedTime: 15 },
    { id: 'w3', subjectId: 'english', knowledgePointId: 'e1', type: 'single', stem: 'cat', options: ['猫', '狗', '鸟', '鱼'], answer: 0, explanation: 'x', difficulty: 1, expectedTime: 15 },
    { id: 'j1', subjectId: 'english', knowledgePointId: 'e1', type: 'judge', stem: 'j', options: ['对', '错'], answer: 0, explanation: 'x', difficulty: 1, expectedTime: 15 },
  ],
  lessons: {},
  settings: {},
};

function fresh() { mockLS._d = {}; Store.init(SEED); }

// 把速算题干转成 JS 表达式（上标字号→**，全角算符→半角），用于数值验算
// 分数操作数加括号，避免 1/3 ÷ 5/6 被 JS 按左结合算成 ((1/3)/5)/6
function toJsExpr(stem) {
  return stem
    .replace(/²/g, '**2').replace(/³/g, '**3').replace(/⁴/g, '**4')
    .replace(/(\d+\/\d+)/g, '($1)')
    .replace(/×/g, '*').replace(/÷/g, '/');
}
function answerNum(a) {
  if (a.includes('/')) { const [n, d] = a.split('/').map(Number); return n / d; }
  return Number(a);
}

test('makeArith：随机 300 题，答案与题干数值一致（覆盖负数/乘方/去括号/分式）', () => {
  const kinds = new Set();
  for (let i = 0; i < 300; i++) {
    const q = Games.makeArith();
    assert.ok(q.kind === 'int' || q.kind === 'frac');
    const got = Function(`"use strict";return (${toJsExpr(q.stem)})`)();
    assert.ok(Math.abs(got - answerNum(q.answer)) < 1e-9, `${q.stem} => ${got}，期望 ${q.answer}`);
    assert.ok(Games.checkArith(q.answer, q.answer), '答案串应可被解析');
    kinds.add(q.kind);
  }
  assert.ok(kinds.has('int'), '应覆盖整数型题');
});

test('makeArithChoice：固定 4 个互不等价的选项，answerIndex 指向正确答案', () => {
  for (let i = 0; i < 200; i++) {
    const q = Games.makeArithChoice();
    assert.equal(q.options.length, 4);
    assert.ok(q.answerIndex >= 0 && q.answerIndex < 4);
    assert.ok(Games.checkArith(q.options[q.answerIndex], q.answer), 'answerIndex 应指向正确答案');
    assert.equal(new Set(q.options).size, 4, '选项不应重复');
    for (let a = 0; a < 4; a++) {
      for (let b = a + 1; b < 4; b++) {
        assert.ok(!Games.checkArith(q.options[a], q.options[b]), `选项 ${q.options[a]} 与 ${q.options[b]} 不应等价`);
      }
    }
  }
});

test('checkArith：整数、等效分数、全角输入与非法输入', () => {
  assert.ok(Games.checkArith('5', '5'));
  assert.ok(Games.checkArith('2/4', '1/2'), '等效分数算对');
  assert.ok(Games.checkArith(' - 6 ', '-6'), '空白归一化');
  assert.ok(Games.checkArith('3／6', '1/2'), '全角斜杠归一化');
  assert.ok(!Games.checkArith('6', '5'));
  assert.ok(!Games.checkArith('abc', '5'));
  assert.ok(!Games.checkArith('1/0', '5'), '分母为 0 非法');
});

test('computationKps：只取回流清单内的计算类知识点', () => {
  fresh();
  assert.deepEqual(Games.computationKps().map(k => k.id), ['m7-pr1'], '只命中清单 id，不碰 k1/e1');
});

test('recordArith：正确率 ≥60% 回流计算类知识点（+3 封顶 85），明细入库', () => {
  fresh();
  const mastery = Store.mastery;
  mastery['m7-pr1'] = { ...Mastery.default(), score: 50, lastReviewAt: 0 };
  mastery.k1 = { ...Mastery.default(), score: 50, lastReviewAt: 0 };
  Store.mastery = mastery;
  const now = 1700000000000;
  const res = Games.recordArith({ correct: 7, total: 10, avgMs: 2400 }, now);
  assert.equal(res.accuracy, 70);
  assert.deepEqual(res.bumped, ['m7-pr1'], '只回流计算类（有理数运算），不碰一次函数');
  assert.equal(Store.mastery['m7-pr1'].score, 53);
  assert.equal(Store.mastery.k1.score, 50);
  assert.equal(Store.games.length, 1);
  assert.equal(Store.games[0].game, 'arith');
  // 封顶 85
  mastery['m7-pr1'].score = 84;
  Store.mastery = mastery;
  Games.recordArith({ correct: 8, total: 10, avgMs: 2000 }, now);
  assert.equal(Store.mastery['m7-pr1'].score, 85);
});

test('recordArith：正确率 <60% 不回流，只留记录', () => {
  fresh();
  const mastery = Store.mastery;
  mastery['m7-pr1'] = { ...Mastery.default(), score: 40, lastReviewAt: 0 };
  Store.mastery = mastery;
  Games.recordArith({ correct: 4, total: 10, avgMs: 3000 }, now = Date.now());
  assert.equal(Store.mastery['m7-pr1'].score, 40, '不达标不灌水掌握度');
  assert.equal(Store.games[0].bumped.length, 0);
});

test('recordArith：daily=true 计入当日统计（战报与完成标记读取）', () => {
  fresh();
  const mastery = Store.mastery;
  mastery['m7-pr1'] = { ...Mastery.default(), score: 50, lastReviewAt: 0 };
  Store.mastery = mastery;
  const now = 1700000000000;
  const res = Games.recordArith({ correct: 8, total: 10, avgMs: 2000, daily: true }, now);
  assert.ok(res.bumped.includes('m7-pr1'));
  const day = Store.dayStat(Store.todayKey(now));
  assert.equal(day.arithRounds, 1);
  assert.equal(day.arithCorrect, 8);
  assert.equal(day.arithTotal, 10);
  assert.equal(Store.games[0].daily, true);
});

test('单词快闪：题库只取英语单选（≥4 选项），开一局 5 题', () => {
  fresh();
  const pool = Games.flashPool();
  assert.equal(pool.length, 3, 'judge 题不入选');
  assert.ok(pool.every(q => q.subjectId === 'english' && q.type === 'single'));
  const g = Games.flashStart();
  assert.equal(g.questions.length, 5 === pool.length ? pool.length : Math.min(5, pool.length));
});

test('flashMiss：答错入队列明天到期；重复答错 +2 天叠加；flashDue 只出到期项', () => {
  fresh();
  const t = 1700000000000;
  Games.flashMiss('w1', t);
  assert.equal(Store.wordQueue.length, 1);
  assert.equal(Store.wordQueue[0].dueAt, t + 86400000);
  assert.equal(Games.flashDue(t - 1000).length, 0, '未到期不出');
  assert.equal(Games.flashDue(t + 86400000).length, 1);
  Games.flashMiss('w1', t + 86400000);
  assert.equal(Store.wordQueue[0].wrongCount, 2);
  assert.equal(Store.wordQueue[0].dueAt, t + 3 * 86400000, '重复错再等 2 天');
});

test('flashReview：答对移出队列；答错保留并延期；到期项带 question 实体', () => {
  fresh();
  const t = 1700000000000;
  Games.flashMiss('w1', t);
  Games.flashMiss('w2', t);
  const due = Games.flashDue(t + 86400000);
  assert.equal(due.length, 2);
  assert.equal(due[0].question.stem, 'apple');
  assert.equal(Games.flashReview('w1', true, t + 86400000), true);
  assert.equal(Store.wordQueue.length, 1, '答对移出队列');
  assert.equal(Games.flashReview('w2', false, t + 86400000), false);
  assert.equal(Store.wordQueue[0].wrongCount, 2);
});
