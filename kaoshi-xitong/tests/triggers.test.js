// 爸爸助手主动触发器单元测试（node --test）
// 规则来源：开发文档 §9.3 触发器地图 §9.4 防骚扰红线（每日≤2、22点静默、今天跳过）
// 说明：不联网、零 DOM；fetch 不需要（触发器不调 AI）。
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const mockLS = { _d: {}, get length() { return Object.keys(this._d).length; }, key(i) { return Object.keys(this._d)[i] ?? null; }, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };

function loadAll() {
  const srcs = ['storage.js', 'mastery.js', 'wrongbook.js', 'scheduler.js', 'triggers.js']
    .map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  return new Function('localStorage', srcs + '; return { Store, Mastery, Wrongbook, Scheduler, Triggers };')(mockLS);
}
const { Store, Mastery, Wrongbook, Scheduler, Triggers } = loadAll();

const DAY = 86400000;
const T0 = new Date(2026, 0, 10, 12, 0, 0).getTime(); // 本地正午，跨日不碰夏令时

const SEED = {
  seedVersion: 1,
  subjects: [
    { id: 'math', name: '数学', default: true },
    { id: 'bio', name: '生物', exam: true },
  ],
  knowledgePoints: [
    { id: 'k1', subjectId: 'math', parentId: null, name: 'K1', order: 1, level: 4, weight: 5, prerequisites: [] },
    { id: 'k2', subjectId: 'math', parentId: null, name: 'K2', order: 2, level: 4, weight: 3, prerequisites: [] },
    { id: 'm-ch1', subjectId: 'math', parentId: null, name: '数学第一章', order: 1, level: 2, weight: 1, prerequisites: [] },
    { id: 'b-ch1', subjectId: 'bio', parentId: null, name: '生物第一章', order: 1, level: 2, weight: 1, prerequisites: [] },
  ],
  questions: [],
  lessons: {},
  settings: {},
};

function fresh() { mockLS._d = {}; Store.init(SEED); }
// 生锈点：reviewCount≥1、距离最后复习 ≥ interval、衰减后 <85
function rustyRec(now) {
  return { score: 90, lastReviewAt: now - 10 * DAY, reviewCount: 1, correctStreak: 0, fastStreak: 0, wrongStreak: 0, interval: 3 };
}

test('state：同一天保留 sent/skipped，跨日重置', () => {
  fresh();
  const p = Triggers.state(T0); p.sent = 1; p.skipped.x = true; Triggers._save(p);
  assert.deepEqual(Triggers.state(T0), { date: Store.todayKey(T0), sent: 1, skipped: { x: true } });
  assert.deepEqual(Triggers.state(T0 + DAY), { date: Store.todayKey(T0 + DAY), sent: 0, skipped: {} });
});

test('silent：22:00 静默，21:59 不静默', () => {
  fresh();
  const at = (h, m) => new Date(2026, 0, 10, h, m, 0).getTime();
  assert.equal(Triggers.silent(at(22, 0)), true);
  assert.equal(Triggers.silent(at(21, 59)), false);
});

test('silent：深夜整段静默（22:00–05:59），06:00 恢复', () => {
  fresh();
  const at = (h, m) => new Date(2026, 0, 10, h, m, 0).getTime();
  assert.equal(Triggers.silent(at(0, 0)), true);
  assert.equal(Triggers.silent(at(1, 0)), true);
  assert.equal(Triggers.silent(at(5, 59)), true);
  assert.equal(Triggers.silent(at(6, 0)), false);
  assert.equal(Triggers.silent(at(21, 59)), false);
  assert.equal(Triggers.canSend(at(1, 0)), false, '深夜不推主动消息');
});

test('canSend：每日≤2，发满即停；静默一律不发', () => {
  fresh();
  assert.equal(Triggers.canSend(T0), true);
  Triggers.recordSent(T0);
  Triggers.recordSent(T0);
  assert.equal(Triggers.canSend(T0), false);
  fresh();
  const late = new Date(2026, 0, 10, 22, 0, 0).getTime();
  assert.equal(Triggers.canSend(late), false);
});

test('skip：记录「今天跳过」，跨日清空', () => {
  fresh();
  assert.equal(Triggers.skipped('rusty', T0), false);
  Triggers.skip('rusty', T0);
  assert.equal(Triggers.skipped('rusty', T0), true);
  assert.equal(Triggers.skipped('rusty', T0 + DAY), false);
});

test('greeting：含问候开场与今日任务（数学）', () => {
  fresh();
  const g = Triggers.greeting(T0);
  assert.ok(g.length > 0);
  assert.match(g, /数学/);
});

test('greeting：回传真实计划时，跳过已完成科目只说未完成的', () => {
  fresh();
  const plan = [{ subjectId: 'math', mode: '未知模式', count: 6 }, { subjectId: 'bio', mode: '突破推进', count: 6 }];
  const g = Triggers.greeting(T0, plan, ['math']);
  assert.doesNotMatch(g, /未知模式/);
  assert.match(g, /突破推进：生物/);
});

test('greeting：计划全部完成时不再喊「今天先办」，改提示清完', () => {
  fresh();
  const plan = [{ subjectId: 'math', mode: '突破推进', count: 6 }, { subjectId: 'bio', mode: '保养加固', count: 6 }];
  const g = Triggers.greeting(T0, plan, ['math', 'bio']);
  assert.doesNotMatch(g, /今天先办/);
  assert.match(g, /今天的计划已经清完/);
});

test('greeting：昨日有练习显示正确率', () => {
  fresh();
  Store.bumpDayStat(Store.todayKey(T0 - DAY), { answered: 10, correct: 8 });
  assert.match(Triggers.greeting(T0), /昨天 10 题对 8 题（80%）/);
});

test('greeting：昨日没上线提示补上', () => {
  fresh();
  assert.match(Triggers.greeting(T0), /昨天没上线/);
});

test('rusty：有生锈点返回保养消息，无生锈返回 null', () => {
  fresh();
  assert.equal(Triggers.rusty(T0), null);
  Store.mastery = { k1: rustyRec(T0) };
  const r = Triggers.rusty(T0);
  assert.ok(r, '应命中生锈点');
  assert.match(r.text, /生锈/);
});

test('weekly：周日触发，非周日为 null', () => {
  fresh();
  const sunday = new Date(2026, 0, 11, 12, 0, 0).getTime();  // 2026-01-11 周日
  const monday = new Date(2026, 0, 12, 12, 0, 0).getTime();
  assert.match(Triggers.weekly(sunday).text, /周报/);
  assert.equal(Triggers.weekly(monday), null);
});

test('recall：超 48h 触发，未超或未记录为 null（从不说「你怎么又不学」）', () => {
  fresh();
  assert.equal(Triggers.recall(T0, null), null);
  assert.equal(Triggers.recall(T0, T0 - DAY), null);
  const r = Triggers.recall(T0, T0 - 3 * DAY);
  assert.match(r.text, /几天没见/);
  assert.doesNotMatch(r.text, /又不学/);
});

test('milestone：昨日点亮/销号触发，否则为 null', () => {
  fresh();
  assert.equal(Triggers.milestone(T0), null);
  Store.bumpDayStat(Store.todayKey(T0 - DAY), { litCount: 2 });
  assert.match(Triggers.milestone(T0).text, /点亮了 2 个/);
  fresh();
  Store.bumpDayStat(Store.todayKey(T0 - DAY), { closures: 1 });
  assert.match(Triggers.milestone(T0).text, /销了 1 个/);
});

test('comfort：连错两题宽慰（降难度找手感）', () => {
  fresh();
  assert.match(Triggers.comfort().text, /降难度/);
});

test('proactive：优先级 生锈>召回>周报（考前缺省），全空返回 []', () => {
  fresh();
  assert.deepEqual(Triggers.proactive(T0, { recallAt: T0 - DAY }), []);
  const sunday = new Date(2026, 0, 11, 12, 0, 0).getTime();
  // 生锈 + 召回 + 周报同时命中 → 生锈排第一
  Store.mastery = { k1: rustyRec(sunday) };
  const msgs = Triggers.proactive(sunday, { recallAt: sunday - 3 * DAY });
  assert.equal(msgs[0].id, 'rusty');
  // 只剩召回 + 周报 → 召回优先
  fresh();
  const msgs2 = Triggers.proactive(sunday, { recallAt: sunday - 3 * DAY });
  assert.deepEqual(msgs2.map(m => m.id), ['recall', 'weekly']);
});

test('todoReminder：到期悬赏 + 最该攻的点合成一条每日提醒，都没有则 null', () => {
  fresh();
  assert.equal(Triggers.todoReminder(T0), null, '没传入待办数据就不说（App 不传即静默）');
  const both = Triggers.todoReminder(T0, { dueCount: 3, target: { kp: { name: '一次函数图象' } } });
  assert.match(both.text, /今日待办/);
  assert.match(both.text, /3 道悬赏到期/);
  assert.match(both.text, /最该攻「一次函数图象」/);
  const onlyDue = Triggers.todoReminder(T0, { dueCount: 1, target: null });
  assert.match(onlyDue.text, /1 道悬赏到期/);
  assert.doesNotMatch(onlyDue.text, /最该攻/);
  const onlyTarget = Triggers.todoReminder(T0, { dueCount: 0, target: { kp: { name: 'SAS 判定' } } });
  assert.match(onlyTarget.text, /最该攻「SAS 判定」/);
  assert.doesNotMatch(onlyTarget.text, /悬赏到期/);
});

test('proactive：待办排最低优先级（偶发事件优先），不传待办时行为与既有完全一致', () => {
  fresh();
  const sunday = new Date(2026, 0, 11, 12, 0, 0).getTime(); // 2026-01-11 周日
  const todo = { dueCount: 2, target: { kp: { name: 'SAS 判定' } } };
  assert.deepEqual(
    Triggers.proactive(sunday, { recallAt: sunday - 3 * DAY, todo }).map(m => m.id),
    ['recall', 'weekly', 'todo'], '待办排在召回、周报之后兜底');
  assert.deepEqual(
    Triggers.proactive(sunday, { recallAt: sunday - 3 * DAY }).map(m => m.id),
    ['recall', 'weekly'], '不传待办时与既有行为完全一致');
});