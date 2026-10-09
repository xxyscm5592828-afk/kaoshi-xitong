// A2 本地检索增强 · 效果对照脚本（人工比对，不做自动断言）
// 目的：同一道真实错题，分别「不注入 / 注入」本课叶微课，各问爸爸一次，把两段回答并排打出来供人工判断。
// 用法：
//   DEEPSEEK_API_KEY=sk-xxx node tests/ab_a2_check.js   # 真调 API（计费 2 次）
//   node tests/ab_a2_check.js --dry                     # 不联网，只验证脚本本身能跑通
// 说明：本文件不被 `node --test tests/*.test.js` 收录，属手动工具。
const fs = require('node:fs');
const path = require('node:path');

const FILES = [
  'storage.js', 'data.js',
  'data-math8b.js', 'data-chinese.js', 'data-english.js', 'data-physics.js',
  'data-history.js', 'data-geography.js', 'data-biology.js', 'data-politics.js',
  'mastery.js', 'wrongbook.js', 'report.js', 'ai.js', 'assistant.js',
];

function makeLS() {
  const d = {};
  return {
    getItem: k => (k in d ? d[k] : null),
    setItem: (k, v) => { d[k] = String(v); },
    removeItem: k => { delete d[k]; },
    get length() { return Object.keys(d).length; },
    key: i => Object.keys(d)[i] ?? null,
  };
}

const key = (process.env.DEEPSEEK_API_KEY || '').trim();
const dry = process.argv.includes('--dry');
if (!key && !dry) {
  console.log('未提供 DEEPSEEK_API_KEY，已退出（不会发起任何请求）。');
  console.log('真跑：DEEPSEEK_API_KEY=sk-xxx node tests/ab_a2_check.js');
  console.log('空跑：node tests/ab_a2_check.js --dry');
  process.exit(0);
}

// dry 模式的假 fetch：只回报「本次请求里有没有本地微课证据块」，用来验证链路
const dryFetch = (url, opt) => {
  const body = JSON.parse(opt.body);
  const has = ((body.messages[1] || {}).content || '').includes('本地微课');
  return Promise.resolve({
    ok: true, status: 200,
    json: () => Promise.resolve({
      choices: [{ message: { content: `【dry】本次请求携带本地微课证据：${has ? '是' : '否'}` }, finish_reason: 'stop' }],
    }),
  });
};

if (!dry && typeof globalThis.fetch !== 'function') {
  console.error('需要 Node 18+（内置 fetch）。');
  process.exit(1);
}

const srcs = FILES.map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
const { Store, Assistant, SEED } =
  new Function('localStorage', 'fetch', srcs + '; return { Store, Assistant, SEED };')(makeLS(), dry ? dryFetch : globalThis.fetch);

Store.init({ ...SEED, settings: { ...SEED.settings, aiKey: key || 'dry-key', dailyAiLimit: 999 } });

const allLessons = Store.lessons;
const Q = Store.questions.find(q => q.type === 'single' && Array.isArray(q.options) && (allLessons[q.knowledgePointId] || []).length);
if (!Q) {
  console.log('没找到「既挂了本地微课、又是单选题」的题目，无法对照。');
  process.exit(0);
}
const kp = Store.kpIndex()[Q.knowledgePointId];
const seed = allLessons[Q.knowledgePointId][0];
const REC = {
  knowledgePointId: Q.knowledgePointId,
  correctAnswer: Q.answer,
  myAnswer: (Q.answer + 1) % Q.options.length,
  errorType: '概念',
};
const ASK = [{ role: 'user', content: '这题我为什么错？请讲清楚。' }];

async function run(withLesson) {
  Store.lessons = withLesson ? allLessons : {};
  const res = await Assistant.askWrong(REC, Q, ASK);
  Store.lessons = allLessons;
  return res;
}

// 参考信号：回答里是否出现微课核心/类比的 4 字连续片段（仅参考，机器判不了好坏）
function reused(src, text) {
  if (!src || !text) return false;
  for (let i = 0; i + 4 <= src.length; i++) if (text.includes(src.slice(i, i + 4))) return true;
  return false;
}

(async () => {
  console.log('================ A2 对照：本地微课注入 ================');
  console.log('知识点：', kp ? kp.name : Q.knowledgePointId, `（${Q.knowledgePointId}）`);
  console.log('题目：  ', Q.stem);
  console.log('微课核心：', seed.oneLiner);
  console.log('微课类比：', seed.analogy || '（无）');
  console.log('');

  const a = await run(false);
  const b = await run(true);
  const show = (label, r) => {
    console.log(`──────── ${label} ────────`);
    console.log(r.ok ? r.text : `[失败] ${r.error}`);
    console.log('');
  };
  show('基线：不注入本地微课', a);
  show('实验：注入本地微课', b);

  console.log('参考信号（非结论）：核心被复用=', reused(seed.oneLiner, b.ok ? b.text : ''),
    ' 类比被复用=', reused(seed.analogy || '', b.ok ? b.text : ''));
  console.log('请人工通读两段回答，判断注入后是否更贴合本考点、更少编造。');
})();
