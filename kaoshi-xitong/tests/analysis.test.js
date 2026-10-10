// 学课分析引擎（Analysis）单元测试：五维画像 + 评级分档 + 全局画像
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
  const srcs = ['storage.js', 'mastery.js', 'analysis.js']
    .concat(DATA_FILES)
    .map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  return new Function('localStorage',
    srcs + '; return { Store, Mastery, Analysis, SEED };')(mockLS);
}

const { Store, Mastery, Analysis, SEED } = loadAll();

function fresh() {
  mockLS._d = {};
  Store.init(SEED);
  Store.activeSubjectId = 'math';
}

test('评级分档：A优秀≥85 / B良好≥70 / C中等≥50 / D待突破≥30 / E需回炉', () => {
  assert.equal(Analysis._rating(90).key, 'A');
  assert.equal(Analysis._rating(85).key, 'A');
  assert.equal(Analysis._rating(70).key, 'B');
  assert.equal(Analysis._rating(50).key, 'C');
  assert.equal(Analysis._rating(30).key, 'D');
  assert.equal(Analysis._rating(10).key, 'E');
});

test('profile 空数据：无作答返回 hasData=false，掌握度 0（无从实测）', () => {
  fresh();
  const now = Date.now();
  const p = Analysis.profile('math', [], now);
  assert.equal(p.hasData, false);
  assert.equal(p.tested, 0);
  assert.equal(p.mastery.score, 0, '无作答无从实测，掌握度 0');
  assert.equal(p.coverage.ratio, 0);
});

test('profile 有作答：五维结构完整、正确数/错误数/分章/建议齐全', () => {
  fresh();
  const now = Date.now();
  const kps = Store.knowledgePoints.filter(k => k.subjectId === 'math' && k.level === 4);
  const leavesWithQ = kps.filter(k => Store.questions.some(q => q.knowledgePointId === k.id));
  const sample = leavesWithQ.slice(0, 6);
  assert.ok(sample.length >= 6, '数学应有足够有题叶点');
  const records = sample.map((kp, i) => {
    const q = Store.questions.find(x => x.knowledgePointId === kp.id);
    return { questionId: q.id, correct: i % 2 === 0, actualTime: i % 3 === 0 ? 5 : 60 };
  });
  const p = Analysis.profile('math', records, now);
  assert.equal(p.hasData, true);
  assert.equal(p.tested, 6);
  assert.equal(p.totalLeaves, kps.length);
  assert.ok(p.coverage.ratio > 0 && p.coverage.ratio <= 1);
  assert.equal(p.error.wrongCount, 3, '偶数下标对、奇数下标错 → 3 错');
  assert.ok(p.cognitive.byLayer.length >= 1);
  assert.ok(p.chapters.length >= 1);
  assert.ok(p.fluency.samples >= 1, '答对且带 actualTime 的题应计入熟练度');
  assert.ok(p.rating.key);
  assert.ok(p.mainIssue.key && p.mainIssue.text);
  assert.ok(Array.isArray(p.advice.items) && p.advice.items.length >= 1);
  assert.ok(p.advice.headline);
});

test('profileAll：按科分组并给出加权综合', () => {
  fresh();
  const now = Date.now();
  // 造两个科目的作答 + 掌握度
  const qIdx = Store.questionIndex();
  const attempts = [];
  for (const sid of ['math', 'physics']) {
    const kps = Store.knowledgePoints.filter(k => k.subjectId === sid && k.level === 4);
    const leaf = kps.find(k => Store.questions.some(q => q.knowledgePointId === k.id));
    if (!leaf) continue;
    const q = Store.questions.find(x => x.knowledgePointId === leaf.id);
    attempts.push({ questionId: q.id, knowledgePointId: leaf.id, correct: true, actualTime: 10, timestamp: now, errorType: null, closureType: null });
    Store.mastery = { ...Store.mastery, [leaf.id]: { score: 75, lastReviewAt: now, reviewCount: 0, correctStreak: 1, fastStreak: 0, wrongStreak: 0, interval: 1 } };
  }
  Store.attempts = attempts;
  const all = Analysis.profileAll(now);
  assert.ok(all.subjects.length >= 2, '应至少含数学、物理两科');
  assert.ok(all.subjects.every(s => s.subjectName && s.rating.key));
  assert.ok(all.overall.score >= 0 && all.overall.rating.key);
  assert.ok(all.overall.testedCount >= 2);
});
