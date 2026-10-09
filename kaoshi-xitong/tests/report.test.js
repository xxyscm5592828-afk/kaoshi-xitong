// 报告模块测试：周统计 / 周战报卡 / 各科汇总 / 打印周报 / 顽固错题分组
// 规则来源：开发文档 §10（报告）+ 顽固错题回炉机制
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const mockLS = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };

function loadAll() {
  const srcs = ['storage.js', 'mastery.js', 'wrongbook.js', 'scheduler.js', 'facts.js', 'report.js']
    .map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  return new Function('localStorage', srcs + '; return { Store, Mastery, Wrongbook, Scheduler, Facts, Report };')(mockLS);
}
const { Store, Wrongbook, Scheduler, Facts, Report } = loadAll();

const DAY = 86400000;
const NOW = new Date('2026-09-15T12:00:00').getTime();

function seed() {
  Store.reset({
    seedVersion: 1,
    subjects: [{ id: 'math', name: '数学', default: true }, { id: 'geo', name: '地理', exam: true }],
    knowledgePoints: [
      { id: 'c1', subjectId: 'math', parentId: null, name: '第一章', level: 2 },
      { id: 'k1', subjectId: 'math', parentId: 'c1', name: 'K1', level: 4, weight: 5 },
      { id: 'k2', subjectId: 'math', parentId: 'c1', name: 'K2', level: 4, weight: 3 },
      { id: 'c2', subjectId: 'geo', parentId: null, name: '地一章', level: 2 },
      { id: 'k3', subjectId: 'geo', parentId: 'c2', name: 'K3', level: 4, weight: 3 },
    ],
    questions: [],
    lessons: {},
    settings: {},
  });
}

const MASTERY = {
  k1: { score: 90, lastReviewAt: NOW, reviewCount: 3, correctStreak: 3, fastStreak: 3, wrongStreak: 0, interval: 4 },
  k2: { score: 60, lastReviewAt: NOW, reviewCount: 3, correctStreak: 1, fastStreak: 1, wrongStreak: 0, interval: 2 },
  k3: { score: 30, lastReviewAt: NOW, reviewCount: 1, correctStreak: 0, fastStreak: 0, wrongStreak: 1, interval: 1 },
};

test('weekStats：无数据全 0，days 含 7 天且日期正确', () => {
  seed();
  const w = Report.weekStats(NOW);
  assert.equal(w.answered, 0);
  assert.equal(w.correct, 0);
  assert.equal(w.accuracy, 0);
  assert.equal(w.days.length, 7);
  assert.equal(w.days[0].key, '2026-09-09');
  assert.equal(w.days[6].key, '2026-09-15');
});

test('weekStats：汇总近 7 天且不含窗口外数据', () => {
  seed();
  Store.bumpDayStat(Store.todayKey(NOW), { answered: 10, correct: 8, maxCombo: 3 });
  Store.bumpDayStat(Store.todayKey(NOW - 3 * DAY), { answered: 6, correct: 3, litCount: 2, closures: 1 });
  // 窗口外（8 天前）不计入
  Store.bumpDayStat(Store.todayKey(NOW - 8 * DAY), { answered: 99, correct: 99 });
  const w = Report.weekStats(NOW);
  assert.equal(w.answered, 16);
  assert.equal(w.correct, 11);
  assert.equal(w.maxCombo, 3);
  assert.equal(w.litCount, 2);
  assert.equal(w.closures, 1);
  assert.equal(w.accuracy, Math.round(100 * 11 / 16));
});

test('weekStats：独立归因次数（读错题记录自选错因）+ 高效学习秒数（S/A 级，窗口外不计）', () => {
  seed();
  Store.attempts = [
    { timestamp: NOW, correct: true, rating: 'S', actualTime: 30 },
    { timestamp: NOW, correct: true, rating: 'B', actualTime: 300 },
    { timestamp: NOW - 8 * DAY, correct: true, rating: 'S', actualTime: 30 }, // 窗口外
  ];
  Store.wrongbook = [
    { id: 'r1', firstWrongAt: NOW - DAY, errorType: '概念' },
    { id: 'r2', firstWrongAt: NOW - DAY, errorType: null },
    { id: 'r3', firstWrongAt: NOW - 8 * DAY, errorType: '计算' }, // 窗口外
  ];
  const w = Report.weekStats(NOW);
  assert.equal(w.attributions, 1, '只统计窗口内已自选错因的错题记录');
  assert.equal(w.effSeconds, 30, '只统计 S/A 级作答时长');
});

test('weekCardHTML：空周提示开张 / 有数据渲染汇总与柱状', () => {
  seed();
  assert.ok(Report.weekCardHTML(NOW).includes('还没开张'));
  Store.bumpDayStat(Store.todayKey(NOW), { answered: 5, correct: 4 });
  const html = Report.weekCardHTML(NOW);
  assert.ok(html.includes('本周战报'));
  assert.ok(html.includes('答题 5'));
  assert.ok(html.includes('week-bar'));
  assert.ok(html.includes('09/15'));
});

// ================= 周报叙事：三问三答（这周推进 / 哪类卡 / 下周主攻） =================
test('weekNarrativeHTML：空周提示先开张', () => {
  seed();
  assert.ok(Report.weekNarrativeHTML(NOW).includes('还没开张'));
});

test('weekNarrativeHTML：三段齐备（推进 / 卡点含错因 / 下周主攻）', () => {
  seed();
  Store.mastery = MASTERY;
  Store.bumpDayStat(Store.todayKey(NOW), { answered: 6, correct: 5, litCount: 1, closures: 1 });
  Store.wrongbook = [
    { id: 'r1', knowledgePointId: 'k2', subjectId: 'math', status: '顽固', reappearCount: 3, firstWrongAt: NOW, errorType: '计算' },
    { id: 'r2', knowledgePointId: 'k2', subjectId: 'math', status: '重做中', reappearCount: 3, firstWrongAt: NOW, errorType: '计算' },
  ];
  const html = Report.weekNarrativeHTML(NOW);
  assert.ok(html.includes('本周小结'));
  assert.ok(html.includes('① 这周推进了') && html.includes('新点亮'), '① 报推进与新点亮');
  assert.ok(html.includes('K1'), '① 点名已点亮的 K1（90 分 + fastStreak≥2）');
  assert.ok(html.includes('② 哪一类还在卡') && html.includes('反复卡住'), '② 卡点');
  assert.ok(html.includes('计算'), '② 自选错因聚类');
  assert.ok(html.includes('③ 下周主攻') && html.includes('K3'), '③ 主攻未掌握里优先级最高的 K3');
});

test('subjectSummary：各科加权平均并按分数排序', () => {
  seed();
  Store.mastery = MASTERY;
  const s = Report.subjectSummary(NOW);
  assert.equal(s.length, 2);
  assert.equal(s[0].name, '数学');
  assert.equal(s[0].score, Math.round((90 * 5 + 60 * 3) / 8));
  assert.equal(s[0].lit, 1);   // k1=90 ≥85 → 已点亮
  assert.equal(s[0].total, 2);
  assert.equal(s[1].name, '地理');
  assert.equal(s[1].score, 30);
});

test('printWeeklyHTML：含区间/成果/明细表/各科表/家长话术', () => {
  seed();
  Store.mastery = MASTERY;
  Store.bumpDayStat(Store.todayKey(NOW), { answered: 5, correct: 4 });
  Store.bumpDayStat(Store.todayKey(NOW - DAY), { answered: 6, correct: 5 });
  const html = Report.printWeeklyHTML(NOW);
  assert.ok(html.includes('本周战报'));
  assert.ok(html.includes('2026-09-09'));
  assert.ok(html.includes('每日明细'));
  assert.ok(html.includes('各科掌握度'));
  assert.ok(html.includes('给家长的话'));
  assert.ok(html.includes('数学'));
  assert.ok(html.includes('答题 11'));
  // 无顽固错题时不出现顽固条目
  assert.ok(!html.includes('顽固错题'));
});

test('printWeeklyHTML：有顽固错题时提示回炉中', () => {
  seed();
  Store.mastery = MASTERY;
  Store.bumpDayStat(Store.todayKey(NOW), { answered: 5, correct: 4 });
  Store.wrongbook = [{ id: 'r1', questionId: 'q1', knowledgePointId: 'k1', subjectId: 'math', status: '顽固', reappearCount: 2, firstWrongAt: NOW }];
  const html = Report.printWeeklyHTML(NOW);
  assert.ok(html.includes('1 道顽固错题'));
});

test('printWeeklyHTML：独立学习证据 + 高效分钟数 + 无搜题声明（对比分析 A1/A2/C1）', () => {
  seed();
  Store.mastery = MASTERY;
  Store.attempts = [
    { timestamp: NOW, correct: true, rating: 'S', actualTime: 30 },
    { timestamp: NOW, correct: true, rating: 'S', actualTime: 60 },
  ];
  Store.wrongbook = [{ id: 'r1', firstWrongAt: NOW - DAY, errorType: '概念' }];
  const html = Report.printWeeklyHTML(NOW);
  assert.ok(html.includes('独立归因 1 次'));
  assert.ok(html.includes('高效学习约 2 分钟'), '90 秒 S/A 级 → 约 2 分钟');
  assert.ok(html.includes('没有「拍照搜题」'), '向家长声明防抄答案定位');
});

// ================= 阶段 3：月度统计 / 图鉴 / 赛季结算 / 学期回望 =================
test('monthStats：近 30 天累计，窗口外不计入', () => {
  seed();
  Store.bumpDayStat(Store.todayKey(NOW), { answered: 10, correct: 8, closures: 1 });
  Store.bumpDayStat(Store.todayKey(NOW - 25 * DAY), { answered: 5, correct: 3, litCount: 1 });
  Store.bumpDayStat(Store.todayKey(NOW - 40 * DAY), { answered: 99, correct: 99 });
  const m = Report.monthStats(NOW);
  assert.equal(m.answered, 15);
  assert.equal(m.correct, 11);
  assert.equal(m.closures, 1);
  assert.equal(m.lit, 1, '点亮数须读 dayStats.litCount（回归：曾误读 st.lit 恒为 0）');
  assert.equal(m.accuracy, Math.round(100 * 11 / 15));
});

test('factsCardHTML：空图鉴给掉落提示；收卡后渲染卡面与进度', () => {
  seed();
  assert.ok(Report.factsCardHTML().includes('20%'));
  assert.ok(Report.factsCardHTML().includes('0/' + Facts.BANK.length));
  Store.facts = [Facts.BANK[0].id, Facts.BANK[1].id];
  const html = Report.factsCardHTML();
  assert.ok(html.includes('2/' + Facts.BANK.length));
  assert.ok(html.includes(Facts.BANK[0].text));
});

test('seasonCardHTML：无快照显示进行中；有快照列出赛季与数据', () => {
  seed();
  assert.ok(Report.seasonCardHTML(NOW).includes('赛季'));
  Store.seasons = { '2026-mid': { label: '期中赛季', answered: 30, correct: 24, closures: 5, lit: 3 } };
  const html = Report.seasonCardHTML(NOW);
  assert.ok(html.includes('期中赛季'));
  assert.ok(html.includes('答题 30'));
  assert.ok(html.includes('销号 5'));
});

test('termReviewCardHTML：整学期累计 + 月度趋势条 + 家长挑战战绩 + 复盘入口', () => {
  seed();
  Store.bumpDayStat(Store.todayKey(NOW), { answered: 6, correct: 5, closures: 1 });
  Store.monthly = [{ key: '2026-07', answered: 40, correct: 30, closures: 4 }];
  Store.parentChallenge = [{ win: true }, { win: false }];
  const html = Report.termReviewCardHTML(NOW);
  assert.ok(html.includes('学期回望'));
  assert.ok(html.includes('<strong>6</strong>'));
  assert.ok(html.includes('2026-07'));
  assert.ok(html.includes('家长挑战 2 局'));
  assert.ok(html.includes('儿子当裁判 2 次'));
  assert.ok(html.includes('monthly-review-btn'));
});

test('render：长页面提供科目跳转条与锚点（含学期回望入口）', () => {
  seed();
  const el = { innerHTML: '', querySelector() { return null; }, querySelectorAll() { return []; } };
  Report.render(el);
  assert.ok(el.innerHTML.includes('subject-jump-bar'), '应渲染跳转条');
  assert.ok(el.innerHTML.includes('data-jump="subj-math"') && el.innerHTML.includes('data-jump="subj-geo"'), '每个有章节的科目一个跳转钮');
  assert.ok(el.innerHTML.includes('id="subj-math"') && el.innerHTML.includes('id="subj-geo"'), '科目分组应有锚点 id');
  assert.ok(el.innerHTML.includes('data-jump="term-review-card"') && el.innerHTML.includes('id="term-review-card"'), '学期回望（月度复盘入口）应可直达');
});

test('stubborn：顽固或重错 3 次以上入选，已销号不入', () => {
  seed();
  Store.wrongbook = [
    { id: 'r1', status: '顽固', reappearCount: 2, subjectId: 'math', knowledgePointId: 'k1', questionId: 'q1' },
    { id: 'r2', status: '重做中', reappearCount: 3, subjectId: 'math', knowledgePointId: 'k1', questionId: 'q2' },
    { id: 'r3', status: '重做中', reappearCount: 1, subjectId: 'geo', knowledgePointId: 'k3', questionId: 'q3' },
    { id: 'r4', status: '已销号', reappearCount: 5, subjectId: 'geo', knowledgePointId: 'k3', questionId: 'q4' },
  ];
  const ids = Wrongbook.stubborn().map(r => r.id).sort();
  assert.deepEqual(ids, ['r1', 'r2']);
});

// ================= 技能树溯源标签（阶段 1 §5.5：根因点 / 回炉建议） =================
function mRec(score) {
  return { score, lastReviewAt: NOW, reviewCount: 1, correctStreak: 0, fastStreak: 0, wrongStreak: 1, interval: 1 };
}

function diagSeed(kps) {
  Store.reset({
    seedVersion: 1,
    subjects: [{ id: 'math', name: '数学' }],
    knowledgePoints: kps,
    questions: [],
    lessons: {},
    settings: {},
  });
}

test('diagTagHTML：根因在先修（非自身）→ 根因标签', () => {
  diagSeed([
    { id: 'a', subjectId: 'math', parentId: null, name: '分式方程', level: 4, weight: 5, prerequisites: ['b'] },
    { id: 'b', subjectId: 'math', parentId: null, name: '一元一次方程', level: 4, weight: 5, prerequisites: [] },
  ]);
  const kpIdx = Store.kpIndex();
  // a 弱且先修 b 实测弱(60) → 根因 b；未测点不误判
  const tag = Report.diagTagHTML(kpIdx.a, { a: mRec(40), b: mRec(60) }, kpIdx);
  assert.ok(tag.includes('根因'), '应显示根因标签');
  assert.ok(tag.includes('一元一次方程'), '根因标签指向先修点 b');
  assert.ok(!tag.includes('回炉'), '深度未超 2 不应显示回炉');
});

test('diagTagHTML：先修链深度>2 → 回炉标签（不刷题）', () => {
  diagSeed([
    { id: 'a', subjectId: 'math', parentId: null, name: 'A', level: 4, weight: 5, prerequisites: ['b'] },
    { id: 'b', subjectId: 'math', parentId: null, name: 'B', level: 4, weight: 5, prerequisites: ['c'] },
    { id: 'c', subjectId: 'math', parentId: null, name: 'C', level: 4, weight: 5, prerequisites: ['d'] },
    { id: 'd', subjectId: 'math', parentId: null, name: 'D', level: 4, weight: 5, prerequisites: [] },
  ]);
  const kpIdx = Store.kpIndex();
  const tag = Report.diagTagHTML(kpIdx.a, { a: mRec(40), b: mRec(45), c: mRec(50), d: mRec(55) }, kpIdx);
  assert.ok(tag.includes('回炉'), '深度>2 应显示回炉标签');
  assert.ok(tag.includes('D'), '回炉标签指向链底根因点');
});

test('diagTagHTML：无记录 / 已掌握 / 根因即自身 → 无标签', () => {
  diagSeed([
    { id: 'a', subjectId: 'math', parentId: null, name: 'A', level: 4, weight: 5, prerequisites: [] },
  ]);
  const kpIdx = Store.kpIndex();
  assert.equal(Report.diagTagHTML(kpIdx.a, {}, kpIdx), '', '未测（无掌握度记录）不贴标签');
  assert.equal(Report.diagTagHTML(kpIdx.a, { a: mRec(90) }, kpIdx), '', '已掌握不贴标签');
  // 弱点但根因就是自身（先修实测不弱）
  diagSeed([
    { id: 'a', subjectId: 'math', parentId: null, name: 'A', level: 4, weight: 5, prerequisites: ['b'] },
    { id: 'b', subjectId: 'math', parentId: null, name: 'B', level: 4, weight: 5, prerequisites: [] },
  ]);
  const kpIdx2 = Store.kpIndex();
  assert.equal(Report.diagTagHTML(kpIdx2.a, { a: mRec(40), b: mRec(90) }, kpIdx2), '', '先修牢、根因即自身 → 无标签');
});

// ================= 下一步练什么（结算/收工「直通车」） =================
test('nextTarget：未掌握点按抽题优先级取最高，gap 与技能树同口径', () => {
  seed();
  Store.mastery = { k1: mRec(50), k2: mRec(50), k3: mRec(50) };
  const t = Report.nextTarget(NOW);
  assert.equal(t.kp.id, 'k1', '同分时 weight 大的优先（k1 weight 5）');
  assert.equal(t.eff, 50);
  assert.equal(t.gap, 35, '85 - 50');
  assert.equal(t.tier.key, 'focus');
});

test('nextTarget：传 subjectId 只在该科内取点', () => {
  seed();
  const t = Report.nextTarget(NOW, 'geo');
  assert.equal(t.kp.id, 'k3');
});

test('nextTarget：已掌握与需回炉（<30）的点都排除；全掌握返回 null', () => {
  seed();
  Store.mastery = {
    k1: { ...mRec(90), fastStreak: 3 },
    k2: mRec(20),
    k3: mRec(70),
  };
  const t = Report.nextTarget(NOW);
  assert.equal(t.kp.id, 'k3', 'k1 已掌握、k2 顽固剔除');
  assert.equal(t.gap, 15);
  Store.mastery = {
    k1: { ...mRec(88), fastStreak: 3 },
    k2: { ...mRec(90), fastStreak: 2 },
    k3: { ...mRec(86), fastStreak: 2 },
  };
  assert.equal(Report.nextTarget(NOW), null);
});

test('nextTarget：久未复习的点标 rusted（提示先保养）', () => {
  seed();
  Store.mastery = { k1: { ...mRec(80), lastReviewAt: NOW - 30 * DAY } };
  const t = Report.nextTarget(NOW, 'math');
  assert.equal(t.kp.id, 'k1');
  assert.equal(t.rusted, true);
  assert.equal(t.gap, 85, '衰减后已接近 0 分');
});

// ================= 学情记忆审计（DeepTutor A4）：错因清单 / 销号记录 / 掌握度来源 =================
test('memoryAudit：错因按自选归因聚合 + 销号记录 + 掌握度来源/薄弱 Top5', () => {
  seed();
  Store.mastery = { ...MASTERY };
  Store.wrongbook = [
    { id: 'w1', questionId: 'x1', knowledgePointId: 'k1', errorType: '概念', status: '已销号', closedAt: NOW },
    { id: 'w2', questionId: 'x2', knowledgePointId: 'k2', errorType: '概念', status: '待处理' },
    { id: 'w3', questionId: 'x3', knowledgePointId: 'k3', errorType: '计算', status: '重做中' },
    { id: 'w4', questionId: 'x4', knowledgePointId: 'k1', errorType: null, status: '待处理' },
  ];
  Store.attempts = [{ id: 'a1' }, { id: 'a2' }];
  Store.lessons = { k1: [{ version: 1 }] };
  const a = Report.memoryAudit();
  assert.equal(a.causes.length, 2, '只有选过错因的计入');
  const concept = a.causes.find(c => c.key === '概念');
  assert.equal(concept.count, 2);
  assert.deepEqual(concept.kps.slice().sort(), ['K1', 'K2'], '错因涉及的知识点（去重）');
  assert.equal(a.closedCount, 1, '销号计数');
  assert.equal(a.recentClosures[0].name, 'K1', '最近销号记录含知识点名');
  assert.equal(a.masteryCount, 3);
  assert.equal(a.litCount, 1, 'k1=90 ≥85 算已点亮');
  assert.equal(a.weak[0].name, 'K3', '薄弱 Top1 是最低分 k3');
  assert.equal(a.weak.length, 2, '低于 85 的只有 k2/k3');
  assert.equal(a.attemptsCount, 2);
  assert.equal(a.lessonCount, 1);
});

test('memoryAudit：空数据各字段安全（无错因/无销号/无掌握度）', () => {
  seed();
  const a = Report.memoryAudit();
  assert.equal(a.causes.length, 0);
  assert.equal(a.closedCount, 0);
  assert.equal(a.recentClosures.length, 0);
  assert.equal(a.masteryCount, 0);
  assert.equal(a.litCount, 0);
  assert.equal(a.weak.length, 0);
  assert.equal(a.attemptsCount, 0);
  assert.equal(a.lessonCount, 0);
});
