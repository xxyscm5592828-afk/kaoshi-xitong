// AI 调用层单元测试（node --test）
// 规则来源：开发文档 §9.1 双层架构（超限降级）§14 技术风险（无 Key 优雅降级）；设计文档 §8 降级表
// 说明：本文件不联网。fetch 以参数形式注入沙箱，避免污染 node 全局。
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const mockLS = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };

// 可变桩：每个用例换实现，沙箱内 AI 始终调同一个转发函数
let fetchImpl = () => { throw new Error('本用例不应发起请求'); };
function loadAll() {
  const srcs = ['storage.js', 'ai.js']
    .map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  return new Function('localStorage', 'fetch', srcs + '; return { Store, AI };')(mockLS, (url, opt) => fetchImpl(url, opt));
}
const { Store, AI } = loadAll();

const SEED = {
  seedVersion: 1,
  subjects: [],
  knowledgePoints: [],
  questions: [],
  lessons: {},
  settings: {},
};

function fresh(settings) {
  mockLS._d = {};
  Store.init({ ...SEED, settings: settings || {} });
}

const okBody = (text) => ({
  choices: [{ message: { content: text }, finish_reason: 'stop' }],
  usage: { total_tokens: 5 },
});
const jsonRes = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
});
const errWith = (name) => { const e = new Error(name); e.name = name; return e; };

// 固定起点：本地时间正午，跨日 +1 天不会碰到夏令时边界
const T0 = new Date(2026, 0, 10, 12, 0, 0).getTime();
const T1 = T0 + 86400000;

test('无 Key：直接返回 noKey，零请求', async () => {
  fresh({});
  let n = 0;
  fetchImpl = () => { n += 1; return Promise.resolve(jsonRes(okBody('好'))); };
  const r = await AI.chat({ messages: [{ role: 'user', content: '在吗' }] });
  assert.equal(r.ok, false);
  assert.equal(r.error, 'noKey');
  assert.equal(n, 0);
});

test('请求组装：baseUrl、model、messages、max_tokens≥900、Bearer 头', async () => {
  fresh({ aiKey: 'k1' });
  let seen = null;
  fetchImpl = (url, opt) => { seen = { url, opt }; return Promise.resolve(jsonRes(okBody('来了'))); };
  const r = await AI.chat({ messages: [{ role: 'user', content: '在吗' }] });
  assert.equal(r.ok, true);
  assert.equal(r.text, '来了');
  assert.equal(seen.url, 'https://api.deepseek.com/chat/completions');
  assert.equal(seen.opt.method, 'POST');
  assert.equal(seen.opt.headers.Authorization, 'Bearer k1');
  const body = JSON.parse(seen.opt.body);
  assert.equal(body.model, 'deepseek-flash');
  assert.deepEqual(body.messages, [{ role: 'user', content: '在吗' }]);
  assert.ok(body.max_tokens >= 900, '推理模型 max_tokens 给小了正文会被推理吃空');
  assert.equal(body.temperature, 0.7);
});

test('baseUrl 尾部斜杠被规整，不会拼出双斜杠', async () => {
  fresh({ aiKey: 'k', aiBaseUrl: 'https://api.deepseek.com///' });
  let url = '';
  fetchImpl = (u) => { url = u; return Promise.resolve(jsonRes(okBody('好'))); };
  await AI.chat({ messages: [] });
  assert.equal(url, 'https://api.deepseek.com/chat/completions');
});

test('正文为空 → truncated（绝不把空白丢给孩子看）', async () => {
  fresh({ aiKey: 'k' });
  fetchImpl = () => Promise.resolve(jsonRes({ choices: [{ message: { content: '   ' }, finish_reason: 'stop' }] }));
  const r = await AI.chat({ messages: [] });
  assert.equal(r.ok, false);
  assert.equal(r.error, 'truncated');
});

test('finish_reason=length → truncated（没说完也不算成功）', async () => {
  fresh({ aiKey: 'k' });
  fetchImpl = () => Promise.resolve(jsonRes({ choices: [{ message: { content: '半句话' }, finish_reason: 'length' }] }));
  const r = await AI.chat({ messages: [] });
  assert.equal(r.ok, false);
  assert.equal(r.error, 'truncated');
});

test('401 / 403 → badKey，带 status', async () => {
  for (const status of [401, 403]) {
    fresh({ aiKey: 'k' });
    fetchImpl = () => Promise.resolve(jsonRes({}, status));
    const r = await AI.chat({ messages: [] });
    assert.equal(r.error, 'badKey');
    assert.equal(r.status, status);
  }
});

test('429 → rateLimited', async () => {
  fresh({ aiKey: 'k' });
  fetchImpl = () => Promise.resolve(jsonRes({}, 429));
  const r = await AI.chat({ messages: [] });
  assert.equal(r.error, 'rateLimited');
  assert.equal(r.status, 429);
});

test('500 → http 兜底', async () => {
  fresh({ aiKey: 'k' });
  fetchImpl = () => Promise.resolve(jsonRes({}, 500));
  const r = await AI.chat({ messages: [] });
  assert.equal(r.error, 'http');
  assert.equal(r.status, 500);
});

test('响应不是 JSON → http 兜底', async () => {
  fresh({ aiKey: 'k' });
  fetchImpl = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new Error('bad json')) });
  const r = await AI.chat({ messages: [] });
  assert.equal(r.error, 'http');
});

test('AbortError → timeout', async () => {
  fresh({ aiKey: 'k' });
  fetchImpl = () => Promise.reject(errWith('AbortError'));
  const r = await AI.chat({ messages: [] });
  assert.equal(r.error, 'timeout');
});

test('普通网络异常 → network', async () => {
  fresh({ aiKey: 'k' });
  fetchImpl = () => Promise.reject(new Error('ECONNREFUSED'));
  const r = await AI.chat({ messages: [] });
  assert.equal(r.error, 'network');
});

test('每日限额：超限后不发请求，返回 quota', async () => {
  fresh({ aiKey: 'k', dailyAiLimit: 2 });
  let n = 0;
  fetchImpl = () => { n += 1; return Promise.resolve(jsonRes(okBody('好'))); };
  assert.equal((await AI.chat({ messages: [], now: T0 })).ok, true);
  assert.equal((await AI.chat({ messages: [], now: T0 })).ok, true);
  const third = await AI.chat({ messages: [], now: T0 });
  assert.equal(third.ok, false);
  assert.equal(third.error, 'quota');
  assert.equal(n, 2, '第 3 次不该落到网络层');
  assert.deepEqual(AI.quota(T0), { date: Store.todayKey(T0), used: 2, limit: 2, left: 0 });
});

test('失败的调用不扣次数（truncated / network 不计费）', async () => {
  fresh({ aiKey: 'k', dailyAiLimit: 5 });
  fetchImpl = () => Promise.resolve(jsonRes({ choices: [{ message: { content: '' }, finish_reason: 'length' }] }));
  await AI.chat({ messages: [], now: T0 });
  fetchImpl = () => Promise.reject(new Error('ECONNREFUSED'));
  await AI.chat({ messages: [], now: T0 });
  assert.equal(AI.quota(T0).used, 0);
  assert.equal(AI.quota(T0).left, 5);
});

test('跨日重置：次日额度回满', async () => {
  fresh({ aiKey: 'k', dailyAiLimit: 2 });
  fetchImpl = () => Promise.resolve(jsonRes(okBody('好')));
  await AI.chat({ messages: [], now: T0 });
  await AI.chat({ messages: [], now: T0 });
  assert.equal(AI.quota(T0).left, 0);
  assert.equal(AI.quota(T1).used, 0);
  assert.equal(AI.quota(T1).left, 2);
  assert.equal((await AI.chat({ messages: [], now: T1 })).ok, true);
  assert.equal(AI.quota(T1).used, 1);
  // 只保留当日一个槽位：新的一天的记录会覆盖旧的，回看昨天一律视为「未使用」
  assert.equal(Store.settings.aiQuota.date, Store.todayKey(T1));
  assert.equal(AI.quota(T0).used, 0);
  assert.equal(AI.quota(T0).left, 2);
});

test('dailyAiLimit 非法值回落到默认 30', () => {
  fresh({ aiKey: 'k', dailyAiLimit: 0 });
  assert.equal(AI.settings().limit, AI.DEFAULT_LIMIT);
  fresh({ aiKey: 'k', dailyAiLimit: -3 });
  assert.equal(AI.settings().limit, AI.DEFAULT_LIMIT);
  fresh({ aiKey: 'k', dailyAiLimit: 'abc' });
  assert.equal(AI.settings().limit, AI.DEFAULT_LIMIT);
});

test('hasKey 与 testConnection：走同一通道并真实计数', async () => {
  fresh({});
  assert.equal(AI.hasKey(), false);
  let n = 0;
  fetchImpl = () => { n += 1; return Promise.resolve(jsonRes(okBody('连接正常'))); };
  const noKey = await AI.testConnection(T0);
  assert.equal(noKey.error, 'noKey');
  assert.equal(n, 0);

  fresh({ aiKey: 'k', dailyAiLimit: 3 });
  const ok = await AI.testConnection(T0);
  assert.equal(ok.ok, true);
  assert.equal(ok.text, '连接正常');
  assert.equal(AI.quota(T0).used, 1);
});
