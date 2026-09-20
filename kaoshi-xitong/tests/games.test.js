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
    { id: 'cp1', subjectId: 'math', parentId: null, name: '有理数运算', order: 1, level: 4, weight: 4, prerequisites: [] },
    { id: 'k1', subjectId: 'math', parentId: null, name: '一次函数', order: 2, level: 4, weight: 5, prerequisites: [] },
    { id: 'e1', subjectId: 'english', parentId: null, name: '核心词汇', order: 1, level: 4, weight: 3, prerequisites: [] },
  ],
  questions: [
    { id: 'q1', subjectId: 'math', knowledgePointId: 'cp1', type: 'single', stem: 's', options: ['a', 'b'], answer: 0, explanation: 'x', difficulty: 2, expectedTime: 40 },
    { id: 'w1', subjectId: 'english', knowledgePointId: 'e1', type: 'single', stem: 'apple', options: ['苹果', '香蕉', '橘子', '葡萄'], answer: 0, explanation: 'x', difficulty: 1, expectedTime: 15 },
    { id: 'w2', subjectId: 'english', knowledgePointId: 'e1', type: 'single', stem: 'book', options: ['书', '笔', '桌子', '椅子'], answer: 0, explanation: 'x', difficulty: 1, expectedTime: 15 },
    { id: 'w3', subjectId: 'english', knowledgePointId: 'e1', type: 'single', stem: 'cat', options: ['猫', '狗', '鸟', '鱼'], answer: 0, explanation: 'x', difficulty: 1, expectedTime: 15 },
    { id: 'j1', subjectId: 'english', knowledgePointId: 'e1', type: 'judge', stem: 'j', options: ['对', '错'], answer: 0, explanation: 'x', difficulty: 1, expectedTime: 15 },
  ],
  lessons: {},
  settings: {},
};

function fresh() { mockLS._d = {}; Store.init(SEED); }

test('makeArith：表达式可被 eval 安全求值且与答案一致（只含 + - × 与数字）', () => {
  for (let i = 0; i < 200; i++) {
    const q = Games.makeArith();
    assert.match(q.stem, /^\d+ [+\-×] \d+$/);
    const [a, op, b] = q.stem.split(' ');
    const got = op === '+' ? Number(a) + Number(b) : op === '-' ? Number(a) - Number(b) : Number(a) * Number(b);
    assert.equal(q.answer, got);
  }
});

test('recordArith：正确率 ≥60% 回流计算类知识点（+3 封顶 85），明细入库', () => {
  fresh();
  const mastery = Store.mastery;
  mastery.cp1 = { ...Mastery.default(), score: 50, lastReviewAt: 0 };
  mastery.k1 = { ...Mastery.default(), score: 50, lastReviewAt: 0 };
  Store.mastery = mastery;
  const now = 1700000000000;
  const res = Games.recordArith({ correct: 7, total: 10, avgMs: 2400 }, now);
  assert.equal(res.accuracy, 70);
  assert.deepEqual(res.bumped, ['cp1'], '只回流计算类（有理数运算），不碰一次函数');
  assert.equal(Store.mastery.cp1.score, 53);
  assert.equal(Store.mastery.k1.score, 50);
  assert.equal(Store.games.length, 1);
  assert.equal(Store.games[0].game, 'arith');
  // 封顶 85
  mastery.cp1.score = 84;
  Store.mastery = mastery;
  Games.recordArith({ correct: 8, total: 10, avgMs: 2000 }, now);
  assert.equal(Store.mastery.cp1.score, 85);
});

test('recordArith：正确率 <60% 不回流，只留记录', () => {
  fresh();
  const mastery = Store.mastery;
  mastery.cp1 = { ...Mastery.default(), score: 40, lastReviewAt: 0 };
  Store.mastery = mastery;
  Games.recordArith({ correct: 4, total: 10, avgMs: 3000 }, now = Date.now());
  assert.equal(Store.mastery.cp1.score, 40, '不达标不灌水掌握度');
  assert.equal(Store.games[0].bumped.length, 0);
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
