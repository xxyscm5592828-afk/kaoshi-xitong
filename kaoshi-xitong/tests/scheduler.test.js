// 每日计划调度器测试：首次摸底 / 悬赏优先 / 保养次之 / 轮换换批 / 会考倒计时
// 规则来源：开发文档 §12 每日体验流
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const mockLS = {
  _d: {},
  getItem(k) { return this._d[k] ?? null; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; },
  key(i) { return Object.keys(this._d)[i] ?? null; },
  get length() { return Object.keys(this._d).length; },
};

function loadAll() {
  const srcs = ['storage.js', 'mastery.js', 'wrongbook.js', 'quiz.js', 'scheduler.js']
    .map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  return new Function('localStorage', srcs + '; return { Store, Mastery, Wrongbook, Quiz, Scheduler };')(mockLS);
}
const { Store, Wrongbook, Scheduler } = loadAll();

const DAY = 86400000;
const T0 = 1700000000000;

function seed(subjects, kps, questions) {
  Store.reset({ seedVersion: 1, subjects, knowledgePoints: kps, questions, lessons: {}, settings: {} });
}

test('首次使用（无作答）：默认科摸底 + 会考科了解', () => {
  seed(
    [{ id: 'math', name: '数学', default: true }, { id: 'geo', name: '地理', exam: true }],
    [{ id: 'k1', subjectId: 'math', level: 4, name: 'K1', weight: 3 },
     { id: 'k2', subjectId: 'geo', level: 4, name: 'K2', weight: 3 }],
    []);
  const blocks = Scheduler.plan(T0, 0);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].subjectId, 'math');
  assert.equal(blocks[0].mode, '突破摸底');
  assert.equal(blocks[1].subjectId, 'geo');
});

test('到期悬赏的科目排第一（悬赏清缴）', () => {
  seed(
    [{ id: 'math', name: '数学', default: true }, { id: 'geo', name: '地理', exam: true }],
    [{ id: 'k1', subjectId: 'math', level: 4, name: 'K1', weight: 3 },
     { id: 'k2', subjectId: 'geo', level: 4, name: 'K2', weight: 3 }],
    [{ id: 'qa', subjectId: 'math', knowledgePointId: 'k1', type: 'single', stem: 'a', options: ['对', '错'], answer: 0, difficulty: 2, expectedTime: 40 }]);
  // 造一条数学到期重做悬赏
  Store.attempts = [{ id: 'a1', questionId: 'qa', knowledgePointId: 'k1', correct: false, actualTime: 30, timestamp: T0 - 5 * DAY }];
  const rec = Wrongbook.onWrong(Store.questions[0], 1, T0 - 5 * DAY);
  Wrongbook.setErrorType(rec.id, '概念');
  Wrongbook.markUnderstood(rec.id, T0 - 5 * DAY);

  const blocks = Scheduler.plan(T0, 0);
  assert.equal(blocks[0].subjectId, 'math');
  assert.equal(blocks[0].mode, '悬赏清缴');
  assert.ok(blocks[0].reasons.some(r => r.includes('悬赏到期')));
});

test('临界遗忘点触发保养模式', () => {
  seed(
    [{ id: 'math', name: '数学', default: true }, { id: 'phy', name: '物理' }],
    [{ id: 'k1', subjectId: 'math', level: 4, name: 'K1', weight: 3 },
     { id: 'k2', subjectId: 'phy', level: 4, name: 'K2', weight: 3 }],
    []);
  // 物理一个点：间隔 1 天，10 天没复习 → 生锈；再放一条旧作答让系统脱离「首次使用」
  Store.attempts = [{ id: 'a0', questionId: 'qx', knowledgePointId: 'k1', correct: true, actualTime: 10, timestamp: T0 - 20 * DAY }];
  Store.mastery = { k2: { score: 80, lastReviewAt: T0 - 10 * DAY, reviewCount: 1, correctStreak: 1, fastStreak: 1, wrongStreak: 0, interval: 1 } };

  const blocks = Scheduler.plan(T0, 0);
  const phy = blocks.find(b => b.subjectId === 'phy');
  assert.ok(phy, '物理应入选');
  assert.equal(phy.mode, '保养加固');
  assert.ok(phy.reasons.some(r => r.includes('生锈')));
});

test('换个组合（salt）能换出不同组合', () => {
  seed(
    [{ id: 's1', name: '一', default: true }, { id: 's2', name: '二' }, { id: 's3', name: '三' }],
    [{ id: 'k1', subjectId: 's1', level: 4, name: 'K1', weight: 3 },
     { id: 'k2', subjectId: 's2', level: 4, name: 'K2', weight: 3 },
     { id: 'k3', subjectId: 's3', level: 4, name: 'K3', weight: 3 }],
    []);
  Store.attempts = [{ id: 'a0', questionId: 'qx', knowledgePointId: 'k1', correct: true, actualTime: 10, timestamp: T0 - DAY }];

  const a = Scheduler.plan(T0, 0).map(b => b.subjectId).join(',');
  const b = Scheduler.plan(T0, 1).map(x => x.subjectId).join(',');
  // 回归锁：盐值必须真的换人（曾因只喂 0.01 tiebreak 而点了没反应）
  assert.notEqual(a, b, `换个组合无变化: ${a}`);
});

test('计划块结构：2 块、含 mode/reasons/count', () => {
  seed(
    [{ id: 'math', name: '数学', default: true }, { id: 'geo', name: '地理', exam: true }],
    [{ id: 'k1', subjectId: 'math', level: 4, name: 'K1', weight: 3 },
     { id: 'k2', subjectId: 'geo', level: 4, name: 'K2', weight: 3 }],
    []);
  Store.attempts = [{ id: 'a0', questionId: 'qx', knowledgePointId: 'k1', correct: true, actualTime: 10, timestamp: T0 - DAY }];
  for (const b of Scheduler.plan(T0, 0)) {
    assert.ok(b.subjectId);
    assert.ok(['悬赏清缴', '保养加固', '突破推进'].includes(b.mode));
    assert.ok(Array.isArray(b.reasons) && b.reasons.length > 0);
    assert.equal(b.count, 6);
  }
});

test('会考倒计时：默认日期与自定义日期', () => {
  seed(
    [{ id: 'math', name: '数学', default: true }],
    [{ id: 'k1', subjectId: 'math', level: 4, name: 'K1', weight: 3 }],
    []);
  // 默认 2027-06-15：从 2026-09-15 看约 273 天
  const now = new Date('2026-09-15T00:00:00').getTime();
  const days = Scheduler.examDaysLeft(now);
  assert.ok(days >= 272 && days <= 274, `默认倒计时异常: ${days}`);
  // 自定义
  Store.settings = { ...Store.settings, examDate: '2026-10-15' };
  assert.equal(Scheduler.examDaysLeft(now), 30);
  // 过期 → 负数（调用方不展示）
  Store.settings = { ...Store.settings, examDate: '2026-01-01' };
  assert.ok(Scheduler.examDaysLeft(now) < 0);
});

// ================= 教学日历（阶段 1 §6.4）=================
test('教学日历：开学前 0 周，开学起按整周计', () => {
  seed(
    [{ id: 'math', name: '数学', default: true }],
    [{ id: 'k1', subjectId: 'math', level: 4, name: 'K1', weight: 3 }],
    []);
  // seed 重置 settings，termStart 回落默认 2026-09-01
  const before = new Date('2026-08-31T23:59:59').getTime();
  assert.equal(Scheduler.termWeek(before), 0);
  const start = new Date('2026-09-01T00:00:00').getTime();
  assert.equal(Scheduler.termWeek(start), 1);
  const w3 = new Date('2026-09-15T00:00:00').getTime();
  assert.equal(Scheduler.termWeek(w3), 3);
});

test('教学日历：teachingChapters 命中在教章（±1 周缓冲）', () => {
  seed(
    [{ id: 'math', name: '数学', default: true }],
    [{ id: 'c1', subjectId: 'math', level: 2, name: '第一章', order: 1 },
     { id: 'c2', subjectId: 'math', level: 2, name: '第二章', order: 2 }],
    []);
  assert.deepEqual(Scheduler.teachingChapters('math', 0), []);
  assert.deepEqual(Scheduler.teachingChapters('math', 1), ['第一章']);
  assert.deepEqual(Scheduler.teachingChapters('math', 12), ['第二章']);
});

test('教学日历：在教章科目优先入选', () => {
  seed(
    [{ id: 'math', name: '数学', default: true }, { id: 'geo', name: '地理', exam: true }],
    [{ id: 'c11', subjectId: 'math', level: 2, name: '第11章 三角形', order: 1 },
     { id: 'c12', subjectId: 'math', level: 2, name: '第12章 全等三角形', order: 2 },
     { id: 'g1', subjectId: 'geo', level: 2, name: '第一章 从世界看中国', order: 1 }],
    []);
  Store.attempts = [{ id: 'a0', questionId: 'qx', knowledgePointId: 'c11', correct: true, actualTime: 10, timestamp: T0 - DAY }];
  // 2026-09-02 = 第 1 周：数学「第11章」在教
  const now = new Date('2026-09-02T00:00:00').getTime();
  const blocks = Scheduler.plan(now, 0);
  const math = blocks.find(b => b.subjectId === 'math');
  assert.ok(math, '在教章的数学应入选计划');
});

// ================= 阶段 3：考试模式 / 赛季窗口 / 大考校准 =================
test('考试模式：开启后计划只出考试科冲刺块，理由带冲刺点', () => {
  seed(
    [{ id: 'math', name: '数学', default: true }, { id: 'geo', name: '地理', exam: true }],
    [{ id: 'k1', subjectId: 'geo', level: 4, name: '人口分布', weight: 4 },
     { id: 'k2', subjectId: 'geo', level: 4, name: '行政区划', weight: 4 }],
    []);
  Store.attempts = [{ id: 'a0', questionId: 'qx', knowledgePointId: 'k1', correct: true, actualTime: 10, timestamp: T0 - DAY }];
  Store.mastery = { k1: { score: 40, lastReviewAt: T0, reviewCount: 1, correctStreak: 0, fastStreak: 0, wrongStreak: 0, interval: 1 }, k2: { score: 80, lastReviewAt: T0, reviewCount: 3, correctStreak: 1, fastStreak: 1, wrongStreak: 0, interval: 4 } };
  Scheduler.setExamMode('geo');
  const blocks = Scheduler.plan(T0, 0);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].subjectId, 'geo');
  assert.equal(blocks[0].mode, '考试冲刺');
  assert.ok(blocks[0].reasons.some(r => r.includes('冲刺点') && r.includes('人口分布')),
    `冲刺点应带最高优先级复习点: ${JSON.stringify(blocks[0].reasons)}`);
  Scheduler.clearExamMode();
  assert.equal(Scheduler.plan(T0, 0).length, 2, '退出考试模式后恢复正常双块计划');
});

test('考试模式：examMode 不存在科目时回落正常计划', () => {
  seed([{ id: 'math', name: '数学', default: true }], [{ id: 'k1', subjectId: 'math', level: 4, name: 'K1', weight: 3 }], []);
  Store.attempts = [{ id: 'a0', questionId: 'qx', knowledgePointId: 'k1', correct: true, actualTime: 10, timestamp: T0 - DAY }];
  Scheduler.setExamMode('不存在科');
  const blocks = Scheduler.plan(T0, 0);
  assert.ok(blocks.length >= 1);
  assert.notEqual(blocks[0].mode, '考试冲刺', '科目无效时不应进考试冲刺');
});

test('赛季窗口：开学前 null；1~12 周期中；13 周起期末', () => {
  seed([{ id: 'math', name: '数学', default: true }], [{ id: 'k1', subjectId: 'math', level: 4, name: 'K1', weight: 3 }], []);
  assert.equal(Scheduler.seasonOf(new Date('2026-08-31T00:00:00').getTime()), null);
  assert.equal(Scheduler.seasonOf(new Date('2026-09-15T00:00:00').getTime()).label, '期中赛季'); // 第 3 周
  assert.equal(Scheduler.seasonOf(new Date('2026-11-25T00:00:00').getTime()).label, '期末赛季'); // 第 13 周
});

test('赛季快照：数据不变时重复记录内容一致，不重复新建快照', () => {
  seed([{ id: 'math', name: '数学', default: true }], [{ id: 'k1', subjectId: 'math', level: 4, name: 'K1', weight: 3 }], []);
  Store.seasons = {};
  const day = 86400000;
  const start = new Date('2026-09-01T00:00:00').getTime();
  // 造几天战报
  const ds = {};
  ds[Store.todayKey(start)] = { answered: 6, correct: 5, closures: 1, litCount: 1 };
  ds[Store.todayKey(start + 3 * day)] = { answered: 6, correct: 4, closures: 1, litCount: 0 };
  Store.dayStats = ds;
  const w3 = new Date('2026-09-15T00:00:00').getTime();
  const snap = Scheduler.recordSeason(w3);
  assert.ok(snap, '应产生期中赛季快照');
  assert.equal(snap.answered, 12);
  assert.equal(snap.closures, 2);
  assert.equal(snap.lit, 1, '点亮数应累计（dayStats 字段 litCount → 快照字段 lit）');
  assert.deepEqual(Scheduler.recordSeason(w3), snap, '数据不变时重复记录内容一致');
  assert.equal(Object.keys(Store.seasons).length, 1);
});

test('赛季快照：进行中的赛季随战报增长实时刷新（不再冻结在首次全 0）', () => {
  seed([{ id: 'math', name: '数学', default: true }], [{ id: 'k1', subjectId: 'math', level: 4, name: 'K1', weight: 3 }], []);
  Store.seasons = {};
  const day = 86400000;
  const start = new Date('2026-09-01T00:00:00').getTime();
  const w3 = new Date('2026-09-15T00:00:00').getTime();
  // 首次渲染时学生还没练 → 快照从 0 开始
  const first = Scheduler.recordSeason(w3);
  assert.equal(first.answered, 0);
  // 之后战报增长（仍在同一进行中的赛季内）
  Store.dayStats = {
    [Store.todayKey(start)]: { answered: 6, correct: 5, closures: 1, litCount: 1 },
    [Store.todayKey(start + 3 * day)]: { answered: 6, correct: 4, closures: 1, litCount: 0 },
  };
  const again = Scheduler.recordSeason(w3);
  assert.equal(again.answered, 12, '进行中赛季应反映最新战报');
  assert.equal(again.lit, 1);
  assert.equal(first.at, again.at, '首次记录时间戳不被刷新覆盖');
});

test('赛季快照：赛季结束后进入下一赛季，旧赛季结算值冻结不回改', () => {
  seed([{ id: 'math', name: '数学', default: true }], [{ id: 'k1', subjectId: 'math', level: 4, name: 'K1', weight: 3 }], []);
  Store.seasons = {};
  const day = 86400000;
  const start = new Date('2026-09-01T00:00:00').getTime();
  Store.dayStats = { [Store.todayKey(start)]: { answered: 6, correct: 5, closures: 1, litCount: 1 } };
  const mid = Scheduler.recordSeason(new Date('2026-09-15T00:00:00').getTime());
  assert.equal(mid.answered, 6);
  // 推进到期末赛季，学生继续练 —— 新战报落在期末赛季，不回头改期中结算
  Store.dayStats = { ...Store.dayStats, [Store.todayKey(start + 13 * 7 * day)]: { answered: 10, correct: 8, closures: 1, litCount: 2 } };
  const final = Scheduler.recordSeason(new Date('2026-12-03T00:00:00').getTime());
  assert.equal(final.label, '期末赛季');
  assert.equal(Store.seasons['2026-mid'].answered, 6, '已结束赛季结算值应保持冻结');
});

test('大考校准：录入高分上修、低分下修、封顶 ±15、记录实考分', () => {
  seed(
    [{ id: 'geo', name: '地理', exam: true }],
    [{ id: 'g1', subjectId: 'geo', level: 4, name: '气候', weight: 4 },
     { id: 'g2', subjectId: 'geo', level: 4, name: '气温', weight: 4 }],
    []);
  Store.mastery = {
    g1: { score: 50, lastReviewAt: T0, reviewCount: 1, correctStreak: 0, fastStreak: 0, wrongStreak: 0, interval: 1 },
    g2: { score: 70, lastReviewAt: T0, reviewCount: 2, correctStreak: 1, fastStreak: 1, wrongStreak: 0, interval: 2 },
  };
  // avg=60，录 100 → delta = min(round(40*0.3)=12,15)=12
  const up = Scheduler.calibrate('geo', 100, T0);
  assert.equal(up.ok, true);
  assert.equal(up.delta, 12);
  assert.equal(Store.mastery.g1.score, 62);
  assert.equal(Store.mastery.g2.score, 82);
  assert.equal(Store.examScores.geo, 100);
  // 录 0 → delta = round((0-62)*0.3)=-19 → 封顶 -15
  const down = Scheduler.calibrate('geo', 0, T0);
  assert.equal(down.delta, -15);
  assert.equal(Store.mastery.g1.score, 47);
  assert.equal(Store.mastery.g2.score, 67);
});

test('大考校准：空输入/非数字被拒，不动掌握度、不写 examScores（回归 ISSUE-014）', () => {
  seed(
    [{ id: 'geo', name: '地理', exam: true }],
    [{ id: 'g1', subjectId: 'geo', level: 4, name: '气候', weight: 4 }],
    []);
  Store.mastery = { g1: { score: 50, lastReviewAt: T0, reviewCount: 1, correctStreak: 0, fastStreak: 0, wrongStreak: 0, interval: 1 } };
  for (const bad of ['', '   ', 'abc', '-1', '101', null, undefined, NaN]) {
    const res = Scheduler.calibrate('geo', bad, T0);
    assert.equal(res.ok, false, `「${bad}」应被拒`);
    assert.equal(res.error, '请输入 0~100 的成绩');
  }
  assert.equal(Store.mastery.g1.score, 50, '被拒时不应改掌握度');
  assert.deepEqual(Store.examScores, {}, '被拒时不应写 examScores');
});

test('重置：Store.reset 清空全部 tutor.* 键（含阶段3键），非本应用键保留（回归 ISSUE-013）', () => {
  seed(
    [{ id: 'geo', name: '地理', exam: true }],
    [{ id: 'g1', subjectId: 'geo', level: 4, name: '气候', weight: 4 }],
    []);
  // 造出旧 reset 会残留的阶段 3 键
  Store.activeSubjectId = 'geo';
  Store.examScores = { geo: 100 };
  Store.facts = ['f1'];
  Store.planProgress = { '2026-09-15': 1 };
  Store.seasons = { '2026-mid': { key: '2026-mid' } };
  mockLS.setItem('other.app', 'keep');

  Store.reset({ seedVersion: 2, subjects: [], knowledgePoints: [], questions: [], lessons: {}, settings: {} });

  const left = [];
  for (let i = 0; i < mockLS.length; i++) left.push(mockLS.key(i));
  assert.deepEqual(left.filter(k => k.startsWith('tutor.')).sort(),
    ['tutor.attempts', 'tutor.dayStats', 'tutor.knowledgePoints', 'tutor.lessonState', 'tutor.lessons',
     'tutor.mastery', 'tutor.placement', 'tutor.questions', 'tutor.seedVersion', 'tutor.settings', 'tutor.solutionCache', 'tutor.subjects', 'tutor.wrongbook'],
    '重置后不应残留 activeSubjectId/examScores/facts/planProgress/seasons');
  assert.equal(mockLS.getItem('other.app'), 'keep', '非本应用键不应被删');
  assert.equal(Store.activeSubjectId, '');
  assert.equal(Store.examScores.geo, undefined);
});

// ================= 本周习惯 + 免死金牌（对比分析 B1） =================
test('weekKeyOf：返回所在周的周一', () => {
  seed([], [], []);
  // 2026-09-15 是周二 → 周一 = 09-14
  assert.equal(Scheduler.weekKeyOf(new Date('2026-09-15T12:00:00').getTime()), '2026-09-14');
  // 2026-09-20 是周日 → 周一 = 09-14
  assert.equal(Scheduler.weekKeyOf(new Date('2026-09-20T12:00:00').getTime()), '2026-09-14');
  // 2026-09-14 是周一 → 周一 = 自己
  assert.equal(Scheduler.weekKeyOf(new Date('2026-09-14T12:00:00').getTime()), '2026-09-14');
});

test('habit：只统计本周一之后；上周日不计入本周', () => {
  seed([], [], []);
  const tue = new Date('2026-09-15T12:00:00').getTime(); // 周二
  Store.bumpDayStat(Store.todayKey(tue), { answered: 6 });          // 今天练过
  Store.bumpDayStat('2026-09-13', { answered: 9 });                 // 上周日，不计入本周
  const h = Scheduler.habit(tue);
  assert.equal(h.days, 1);
  assert.equal(h.effective, 1);
  assert.equal(h.protect, false);
});

test('habit：本周练过但今天没练 → 免死金牌保底 1 天；useShield 后不再保底', () => {
  seed([], [], []);
  const tue = new Date('2026-09-15T12:00:00').getTime();
  Store.bumpDayStat('2026-09-14', { answered: 5 }); // 周一练过，今天（周二）还没练
  const h1 = Scheduler.habit(tue);
  assert.equal(h1.days, 1);
  assert.equal(h1.effective, 2, '金牌保底 +1');
  assert.equal(h1.protect, true);
  assert.equal(h1.shieldUsed, true);
  // 消耗金牌后：不再保底
  Scheduler.useShield(tue);
  const h2 = Scheduler.habit(tue);
  assert.equal(h2.days, 1);
  assert.equal(h2.effective, 1, '金牌已用，不重复保底');
  assert.equal(h2.protect, false);
});

test('habit：跨周自动刷新金牌；本周从未练不触发保底', () => {
  seed([], [], []);
  const tue = new Date('2026-09-15T12:00:00').getTime();
  Scheduler.useShield(tue); // 本周已用
  const h = Scheduler.habit(tue);
  assert.equal(h.shieldUsed, true);
  // 下周一：新周，金牌重置；且本周（新周）还没练过 → 不保底（days=0）
  const nextMon = new Date('2026-09-21T12:00:00').getTime();
  const h2 = Scheduler.habit(nextMon);
  assert.equal(h2.shieldUsed, false);
  assert.equal(h2.days, 0);
  assert.equal(h2.protect, false);
});
