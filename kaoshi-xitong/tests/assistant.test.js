// 学长「阿K」单元测试（node --test）
// 规则来源：开发文档 §8.3 六律 §9.2 人设 §9.6 红线；设计文档 §2 六轮上限 §6 对话不落库 §7 上下文组装
// 说明：本文件不联网、不依赖 DOM。fetch 以参数形式注入沙箱。
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const mockLS = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };

let lastBody = null;
let fetchContent = '学长说：先看这条边。'; // 默认非 JSON，供答疑/追问测试；生成类测试覆写为 JSON
function loadAll() {
  // report.js 是 weekReport/fullProfile 拼上下文所需（weekStats/subjectSummary + Wrongbook.stubborn）
  const srcs = ['storage.js', 'mastery.js', 'wrongbook.js', 'report.js', 'ai.js', 'assistant.js']
    .map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  const fetchStub = (url, opt) => {
    lastBody = JSON.parse(opt.body);
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ choices: [{ message: { content: fetchContent }, finish_reason: 'stop' }] }),
    });
  };
  return new Function('localStorage', 'fetch', srcs + '; return { Store, AI, Assistant, Report, Wrongbook };')(mockLS, fetchStub);
}
const { Store, AI, Assistant, Report, Wrongbook } = loadAll();

const SEED = {
  seedVersion: 1,
  subjects: [{ id: 'math', name: '数学' }],
  knowledgePoints: [{ id: 'kp1', subjectId: 'math', parentId: null, name: '一次函数图象', order: 1, level: 4, weight: 5, prerequisites: [] }],
  questions: [{
    id: 'q1', subjectId: 'math', knowledgePointId: 'kp1', type: 'single',
    stem: '一次函数 y=2x+1 的图象经过哪一象限？', options: ['第一、二、三', '第一、三、四', '第二、三、四', '第一、二、四'],
    answer: 0, explanation: '令 x=0 得 y=1，截距为正。', difficulty: 2, expectedTime: 40, groupId: 'g1', groupRole: 'basic',
  }],
  lessons: {},
  settings: { aiKey: 'k', assistantName: '阿K' },
};

function fresh(settings) {
  mockLS._d = {};
  Store.init({ ...SEED, settings: settings || SEED.settings });
}

const REC = { knowledgePointId: 'kp1', correctAnswer: 0, myAnswer: 2, errorType: '概念' };
const Q = SEED.questions[0];

test('人设与红线：SYSTEM_PROMPT 含六律、不评价能力、字数上限', () => {
  fresh();
  const p = Assistant.SYSTEM_PROMPT;
  assert.match(p, /阿K/);
  assert.match(p, /先说人话/);
  assert.match(p, /类比/);
  assert.match(p, /最小数字/);
  assert.match(p, /一个新概念/);
  assert.match(p, /游戏|打球|零花钱|乐高/);
  assert.match(p, /承认难|确实绕/);
  assert.match(p, /不评价孩子的能力/);
  assert.match(p, /250 字/);
});

test('name()：默认「阿K」，设置可覆写，空白回落默认', () => {
  fresh({ assistantName: '' });
  assert.equal(Assistant.name(), Assistant.DEFAULT_NAME);
  fresh({ assistantName: '  大熊  ' });
  assert.equal(Assistant.name(), '大熊');
  assert.match(Assistant.SYSTEM_PROMPT, /大熊/);
});

test('buildWrongContext：题目/答案/知识点/错因/掌握度/教材解析 一项不落', () => {
  fresh();
  Store.mastery = { kp1: { score: 40 } };
  const ctx = Assistant.buildWrongContext(REC, Q);
  assert.match(ctx, /【他做错的题】一次函数 y=2x\+1 的图象经过哪一象限？/);
  assert.match(ctx, /【正确答案】第一、二、三/);
  assert.match(ctx, /【他写的答案】第二、三、四/);
  assert.match(ctx, /【知识点】一次函数图象/);
  assert.match(ctx, /【他自己选的错因】概念/);
  assert.match(ctx, /【这个知识点的掌握度】40\/100/);
  assert.match(ctx, /【教材解析/);
});

test('buildWrongContext：没有错因/掌握度/解析时不留空字段', () => {
  fresh();
  const bare = { ...Q, explanation: '' };
  const ctx = Assistant.buildWrongContext({ knowledgePointId: 'kp1', correctAnswer: 0, myAnswer: 1 }, bare);
  assert.doesNotMatch(ctx, /错因/);
  assert.doesNotMatch(ctx, /掌握度/);
  assert.doesNotMatch(ctx, /教材解析/);
});

test('_fmt：选项下标还原成文字，空答/多选/非选项题各有着落', () => {
  assert.equal(Assistant._fmt(Q, 0), '第一、二、三');
  assert.equal(Assistant._fmt(Q, 3), '第一、二、四');
  assert.equal(Assistant._fmt(Q, null), '（空着没写）');
  assert.equal(Assistant._fmt(Q, ''), '（空着没写）');
  assert.equal(Assistant._fmt(Q, []), '（空着没写）');
  assert.equal(Assistant._fmt(Q, [0, 2]), '第一、二、三、第二、三、四');
  assert.equal(Assistant._fmt({ stem: '填空' }, 'y=2x+1'), 'y=2x+1');
  assert.equal(Assistant._fmt(Q, 9), '9', '越界下标不硬猜，原样返回');
});

test('askWrong：system 打头 + 本题事实 + history 逐轮转 role', async () => {
  fresh();
  const res = await Assistant.askWrong(REC, Q, [
    { role: 'user', content: '为什么是正的？' },
    { role: 'assistant', content: '先看 x=0 的时候。' },
    { role: 'user', content: '   ' },
  ]);
  assert.equal(res.ok, true);
  assert.equal(lastBody.messages.length, 4, '空的 history 条目应被跳过');
  assert.equal(lastBody.messages[0].role, 'system');
  assert.match(lastBody.messages[0].content, /不评价孩子的能力/);
  assert.equal(lastBody.messages[1].role, 'user');
  assert.match(lastBody.messages[1].content, /【他做错的题】/);
  assert.deepEqual(lastBody.messages.slice(2).map(m => m.role), ['user', 'assistant']);
  assert.equal(lastBody.messages[3].content, '先看 x=0 的时候。');
});

test('askWrong：rec/q 传 null 即为自由提问，不带本题上下文', async () => {
  fresh();
  const res = await Assistant.askWrong(null, null, [{ role: 'user', content: '光合作用到底怎么回事？' }]);
  assert.equal(res.ok, true);
  assert.equal(lastBody.messages.length, 2);
  assert.equal(lastBody.messages[0].role, 'system');
  assert.deepEqual(lastBody.messages[1], { role: 'user', content: '光合作用到底怎么回事？' });
});

test('askWrong：history 里未知 role 一律按孩子的话处理', async () => {
  fresh();
  await Assistant.askWrong(null, null, [{ role: 'tool', content: '嗯' }]);
  assert.equal(lastBody.messages[1].role, 'user');
});

test('askWrong：无 Key 时链路仍返回结构化错误，不抛异常', async () => {
  fresh({ aiKey: '' });
  const res = await Assistant.askWrong(REC, Q, [{ role: 'user', content: '在吗' }]);
  assert.equal(res.ok, false);
  assert.equal(res.error, 'noKey');
});

test('askWrong：hintFirst=true 时 system 追加思路提示规则（不给答案不给完整解法）', async () => {
  fresh();
  await Assistant.askWrong(REC, Q, [{ role: 'user', content: '这题怎么想？' }], true);
  const sys = lastBody.messages[0].content;
  assert.match(sys, /思路提示模式/);
  assert.match(sys, /绝不报答案/);
  assert.match(sys, /不给完整解法/);
});

test('askWrong：hintFirst 缺省时 system 不含提示规则（向后兼容）', async () => {
  fresh();
  await Assistant.askWrong(REC, Q, [{ role: 'user', content: '这题怎么想？' }]);
  assert.doesNotMatch(lastBody.messages[0].content, /思路提示模式/);
});

test('socraticGuide：第一问带本题事实 + 他的回答 + 引导规则，system 写死不给答案红线', async () => {
  fresh();
  const res = await Assistant.socraticGuide(1, REC, Q, '考图象过哪几个象限');
  assert.equal(res.ok, true);
  assert.equal(lastBody.messages.length, 2);
  const sys = lastBody.messages[0];
  assert.equal(sys.role, 'system');
  assert.match(sys.content, /追问式讲解规则/);
  assert.match(sys.content, /绝不直接给答案/);
  const user = lastBody.messages[1];
  assert.match(user.content, /【他做错的题】/);
  assert.match(user.content, /第一问「考什么」/);
  assert.match(user.content, /【他的回答】考图象过哪几个象限/);
});

test('socraticGuide：第二问只指岔口不给路线；无 Key 返回 noKey', async () => {
  fresh();
  const res = await Assistant.socraticGuide(2, REC, Q, '先画个草图');
  assert.equal(res.ok, true);
  assert.match(lastBody.messages[1].content, /第二问「下一步」/);
  assert.match(lastBody.messages[1].content, /岔口/);
  fresh({ aiKey: '' });
  const no = await Assistant.socraticGuide(1, REC, Q, '不知道');
  assert.equal(no.ok, false);
  assert.equal(no.error, 'noKey');
});

test('常量与无 DOM 约束：MAX_ROUNDS=6，模块在无 document 环境下可加载可调用', () => {
  assert.equal(Assistant.MAX_ROUNDS, 6);
  assert.equal(typeof globalThis.document, 'undefined');
  assert.equal(typeof Assistant.buildWrongContext, 'function');
  assert.doesNotMatch(Assistant.SYSTEM_PROMPT, /document|window/);
});

// ================= 逐题逐步解法（本轮 A）：纯文本返回 + 按题缓存不重复扣额度 =================

test('solveStepsPrompt：题目/选项/答案对照/知识点/教材解析 一项不落 + 步骤格式要求', () => {
  fresh();
  const p = Assistant.solveStepsPrompt(Q, Store.kpIndex().kp1, 2);
  assert.match(p, /【题目】一次函数 y=2x\+1 的图象经过哪一象限？/);
  assert.match(p, /【选项】A\. 第一、二、三/);
  assert.match(p, /【正确答案】第一、二、三/);
  assert.match(p, /【他写的答案】第二、三、四/);
  assert.match(p, /【知识点】一次函数图象/);
  assert.match(p, /【教材解析/);
  assert.match(p, /以「第1步：」开头/);
});

test('solveSteps：OK 返回纯文本、写入缓存，system 带逐步解题模式', async () => {
  fresh({ aiKey: 'k' });
  fetchContent = '第1步：先找截距。\n第2步：再看斜率。\n第3步：代入验证。';
  const res = await Assistant.solveSteps(Q, Store.kpIndex().kp1, 2);
  assert.equal(res.ok, true);
  assert.match(res.text, /第1步/);
  assert.equal(Store.solutionCache.q1, fetchContent, '成功结果应按 questionId 落缓存');
  assert.equal(Assistant.solutionOf('q1'), fetchContent);
  assert.match(lastBody.messages[0].content, /逐步解题模式/);
  assert.match(lastBody.messages[0].content, /400 字/);
  assert.equal(lastBody.max_tokens, 1200);
});

test('solveSteps：命中缓存直接返回，不再请求、不再扣额度', async () => {
  fresh({ aiKey: 'k' });
  fetchContent = '第1步：先找截距。';
  await Assistant.solveSteps(Q, Store.kpIndex().kp1, 2);
  const left = AI.quota().left;
  lastBody = null;
  const again = await Assistant.solveSteps(Q, Store.kpIndex().kp1, 2);
  assert.equal(again.ok, true);
  assert.equal(again.cached, true);
  assert.equal(lastBody, null, '命中缓存不应发起任何请求');
  assert.equal(AI.quota().left, left, '命中缓存不应扣额度');
});

test('solveSteps：无 Key → noKey；正文为空 → truncated；两者都不落缓存', async () => {
  fresh({ aiKey: '' });
  const no = await Assistant.solveSteps(Q, Store.kpIndex().kp1, 2);
  assert.equal(no.ok, false);
  assert.equal(no.error, 'noKey');

  fresh({ aiKey: 'k' });
  fetchContent = '   ';
  const trunc = await Assistant.solveSteps(Q, Store.kpIndex().kp1, 2);
  assert.equal(trunc.ok, false);
  assert.equal(trunc.error, 'truncated');
  assert.equal(Store.solutionCache.q1, undefined, '失败不应落缓存');
});

// ================= 阶段 2 生成能力：微课（六律）/ 变式题（题组）/ 周报+档案（四铁律） =================

test('GEN_SYSTEM_PROMPT：含六律 + 严格 JSON + 不评价能力', () => {
  const p = Assistant.GEN_SYSTEM_PROMPT;
  assert.match(p, /先说人话/);
  assert.match(p, /类比/);
  assert.match(p, /最小数字（1、2、3）/);
  assert.match(p, /一个新概念/);
  assert.match(p, /游戏|打球|零花钱|乐高/);
  assert.match(p, /承认难/);
  assert.match(p, /不评价孩子的能力/);
  assert.match(p, /严格输出 JSON/);
});

test('lessonPrompt：首篇不带换讲法注记；有历史讲法带旧类比', () => {
  fresh({ aiKey: 'k' });
  const first = Assistant.lessonPrompt(Store.kpIndex().kp1);
  assert.match(first, /一次函数图象/);
  assert.match(first, /严格按这个 JSON 结构输出/);
  assert.match(first, /check 必须是 2 道单选题/);
  assert.doesNotMatch(first, /换讲法/);
  Store.lessons = { kp1: [{ version: 1, analogy: '乐高' }, { version: 2, analogy: '打球' }] };
  const again = Assistant.lessonPrompt(Store.kpIndex().kp1);
  assert.match(again, /换讲法/);
  assert.match(again, /乐高/);
  assert.match(again, /打球/);
});

test('_parseLesson：合法六段式解析成功；缺 analogy / 非 JSON 失败', () => {
  const ok = Assistant._parseLesson(JSON.stringify({
    oneLiner: '一句话', problem: '为什么', analogy: '乐高', example: '1+2=3',
    pitfalls: ['坑1', '坑2'],
    check: [
      { stem: '1+1？', options: ['2', '3', '4', '5'], answer: 0, explanation: '2' },
      { stem: '2+2？', options: ['3', '4', '5', '6'], answer: 1, explanation: '4' },
    ],
  }));
  assert.equal(ok.ok, true);
  assert.equal(ok.lesson.pitfalls.length, 2);
  assert.equal(ok.lesson.check.length, 2);
  assert.equal(ok.lesson.check[1].answer, 1);

  assert.equal(Assistant._parseLesson(JSON.stringify({ oneLiner: 'a', problem: 'b', example: 'c', check: [{ stem: 's', options: ['a', 'b'], answer: 0 }] })).ok, false);
  assert.equal(Assistant._parseLesson('这只是一段话，不是 JSON').ok, false);
});

test('_parseLesson：容忍 ```json 围栏与前后缀说明文字', () => {
  const body = JSON.stringify({ oneLiner: '1', problem: '2', analogy: '3', example: '4', pitfalls: [], check: [{ stem: 's', options: ['a', 'b'], answer: 1 }] });
  const got = Assistant._parseLesson('好的，这是结果：\n```json\n' + body + '\n```\n希望帮到你');
  assert.equal(got.ok, true);
  assert.equal(got.lesson.problem, '2');
});

test('genLesson：OK 返回解析好的微课；解析失败 → parse；无 Key → noKey', async () => {
  fresh({ aiKey: 'k' });
  const payload = JSON.stringify({
    oneLiner: '1', problem: '2', analogy: '打球', example: '3', pitfalls: ['5'],
    check: [
      { stem: 's', options: ['a', 'b', 'c', 'd'], answer: 0, explanation: 'e' },
      { stem: 't', options: ['a', 'b', 'c', 'd'], answer: 1, explanation: 'f' },
    ],
  });
  fetchContent = '```json\n' + payload + '\n```';
  const res = await Assistant.genLesson(Store.kpIndex().kp1);
  assert.equal(res.ok, true);
  assert.equal(res.lesson.analogy, '打球');
  assert.equal(res.lesson.check.length, 2);

  fetchContent = '这个不是 JSON';
  assert.equal((await Assistant.genLesson(Store.kpIndex().kp1)).error, 'parse');

  fresh({ aiKey: '' });
  assert.equal((await Assistant.genLesson(Store.kpIndex().kp1)).error, 'noKey');
});

test('variantPrompt：单选/多选/判断/填空各输出对应字段约束', () => {
  fresh();
  const kp = Store.kpIndex().kp1;
  assert.ok(Assistant.variantPrompt(SEED.questions[0], kp).includes('正确选项下标'));
  assert.ok(Assistant.variantPrompt({ type: 'multi', stem: 'm', answer: [0, 1] }, kp).includes('至少 2 项'));
  assert.ok(Assistant.variantPrompt({ type: 'judge', stem: 'j', answer: 0 }, kp).includes('0（对）或 1（错）'));
  assert.ok(Assistant.variantPrompt({ type: 'fill', stem: 'f', answer: 'x' }, kp).includes('参考答案字符串'));
});

test('_parseVariant：单选/多选/判断/填空各路径 + 非法输入失败', () => {
  const single = Assistant._parseVariant(JSON.stringify({ stem: 's', options: ['a', 'b', 'c', 'd'], answer: 2, explanation: 'e' }), { type: 'single', difficulty: 3, expectedTime: 50 });
  assert.equal(single.ok, true);
  assert.equal(single.question.answer, 2);
  assert.equal(single.question.difficulty, 3);

  const multi = Assistant._parseVariant(JSON.stringify({ stem: 's', options: ['a', 'b', 'c', 'd'], answer: [0, 2], explanation: 'e' }), { type: 'multi' });
  assert.equal(multi.ok, true);
  assert.deepEqual(multi.question.answer, [0, 2]);

  const judge = Assistant._parseVariant(JSON.stringify({ stem: 's', answer: 1, explanation: 'e' }), { type: 'judge' });
  assert.equal(judge.ok, true);
  assert.equal(judge.question.answer, 1);

  const fill = Assistant._parseVariant(JSON.stringify({ stem: 's', answer: 'y=2x', explanation: 'e' }), { type: 'fill' });
  assert.equal(fill.ok, true);
  assert.equal(fill.question.answer, 'y=2x');

  assert.equal(Assistant._parseVariant(JSON.stringify({ stem: 's', options: ['a', 'b'], answer: 9, explanation: 'e' }), { type: 'single' }).ok, false);
  assert.equal(Assistant._parseVariant(JSON.stringify({ answer: 0, explanation: 'e' }), { type: 'single' }).ok, false);
});

test('genVariant：OK 返回同题型变式题；解析失败 → parse；无 Key → noKey', async () => {
  fresh({ aiKey: 'k' });
  const Q = SEED.questions[0];
  fetchContent = JSON.stringify({ stem: '换个数字', options: ['甲', '乙', '丙', '丁'], answer: 1, explanation: '为什么', difficulty: 2, expectedTime: 40 });
  const res = await Assistant.genVariant(Q, Store.kpIndex().kp1);
  assert.equal(res.ok, true);
  assert.equal(res.question.type, 'single');
  assert.equal(res.question.answer, 1);

  fetchContent = 'nope';
  assert.equal((await Assistant.genVariant(Q, Store.kpIndex().kp1)).error, 'parse');
  fresh({ aiKey: '' });
  assert.equal((await Assistant.genVariant(Q, Store.kpIndex().kp1)).error, 'noKey');
});

test('genReal：OK 返回真题风格题；解析失败 → parse；无 Key → noKey', async () => {
  fresh({ aiKey: 'k' });
  const Q = SEED.questions[0];
  fetchContent = JSON.stringify({ stem: '下列正确的是', options: ['甲', '乙', '丙', '丁'], answer: 2, explanation: '为什么', difficulty: 3, expectedTime: 50 });
  const res = await Assistant.genReal(Q, Store.kpIndex().kp1);
  assert.equal(res.ok, true);
  assert.equal(res.question.type, 'single');
  assert.equal(res.question.answer, 2);
  assert.match(lastBody.messages[1].content, /真题/);

  fetchContent = 'nope';
  assert.equal((await Assistant.genReal(Q, Store.kpIndex().kp1)).error, 'parse');
  fresh({ aiKey: '' });
  assert.equal((await Assistant.genReal(Q, Store.kpIndex().kp1)).error, 'noKey');
});

test('WEEK_PROMPT：含四铁律 + 档案红线（只记模式不记能力）', () => {
  const p = Assistant.WEEK_PROMPT;
  assert.match(p, /表扬具体策略/);
  assert.match(p, /可修复/);
  assert.match(p, /真实亮点/);
  assert.match(p, /可控因素/);
  assert.match(p, /能力判定/);
  assert.match(p, /只输出 JSON/);
});

test('weekReportPrompt：含本周数据；已有档案时带「据此更新」', () => {
  fresh({ aiKey: 'k' });
  const p = Assistant.weekReportPrompt(Date.now());
  assert.match(p, /本周（近 7 天）/);
  assert.match(p, /请写周报评语/);
  assert.doesNotMatch(p, /据此更新/);

  Store.settings = { ...Store.settings, learnerProfile: { academic: ['先做例题再动笔'] } };
  const p2 = Assistant.weekReportPrompt(Date.now());
  assert.match(p2, /据此更新/);
  assert.match(p2, /先做例题再动笔/);
});

test('_parseWeekReport：合法返回 comment+四维档案；空 comment 失败', () => {
  const ok = Assistant._parseWeekReport(JSON.stringify({ comment: '这周不错', profile: { academic: ['a'], behavioral: ['b'], psychological: ['c'], milestones: ['m'] } }));
  assert.equal(ok.ok, true);
  assert.equal(ok.comment, '这周不错');
  assert.deepEqual(ok.profile.academic, ['a']);

  assert.equal(Assistant._parseWeekReport(JSON.stringify({ profile: { academic: [] } })).ok, false);
  assert.equal(Assistant._parseWeekReport('不是 JSON').ok, false);
});

test('weekReport：OK 返回评语+档案；解析失败 → parse；无 Key → noKey', async () => {
  fresh({ aiKey: 'k' });
  fetchContent = JSON.stringify({ comment: '这周策略见效了', profile: { academic: ['a'], behavioral: [], psychological: [], milestones: [] } });
  const res = await Assistant.weekReport(Date.now());
  assert.equal(res.ok, true);
  assert.equal(res.comment, '这周策略见效了');
  assert.deepEqual(res.profile.academic, ['a']);

  fetchContent = 'no json';
  assert.equal((await Assistant.weekReport(Date.now())).error, 'parse');
  fresh({ aiKey: '' });
  assert.equal((await Assistant.weekReport(Date.now())).error, 'noKey');
});

// ================= 阶段 3：月度深度复盘（删过时洞察，复用周报 JSON 规范） =================
test('monthReportPrompt：含近 30 天数据 + 「删过时洞察」红线；无档案时不带对比', () => {
  fresh({ aiKey: 'k' });
  const p = Assistant.monthReportPrompt(Date.now());
  assert.match(p, /月度（近 30 天）/);
  assert.match(p, /删除过时洞察|删掉/);
  assert.doesNotMatch(p, /已有理解档案/);
  Store.settings = { ...Store.settings, learnerProfile: { academic: ['先做例题'] } };
  assert.match(Assistant.monthReportPrompt(Date.now()), /已有理解档案/);
});

test('monthReport：OK 返回评语+档案；解析失败 → parse；无 Key → noKey', async () => {
  fresh({ aiKey: 'k' });
  fetchContent = JSON.stringify({ comment: '这个月稳下来了', profile: { academic: ['a'], behavioral: [], psychological: [], milestones: [] } });
  const res = await Assistant.monthReport(Date.now());
  assert.equal(res.ok, true);
  assert.equal(res.comment, '这个月稳下来了');
  fetchContent = 'nope';
  assert.equal((await Assistant.monthReport(Date.now())).error, 'parse');
  fresh({ aiKey: '' });
  assert.equal((await Assistant.monthReport(Date.now())).error, 'noKey');
});
