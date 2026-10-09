// 放松模块：冷笑话库单元测试（node --test）
// 规则来源：开发文档 §9.7 放松模块（预置 50 条轮换 0 成本、频率红线每天 ≤2 次）
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const mockLS = { _d: {}, get length() { return Object.keys(this._d).length; }, key(i) { return Object.keys(this._d)[i] ?? null; }, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };

function loadAll() {
  const srcs = ['storage.js', 'jokes.js']
    .map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  return new Function('localStorage', srcs + '; return { Store, Jokes };')(mockLS);
}
const { Store, Jokes } = loadAll();

const DAY = 86400000;
const T0 = new Date(2026, 0, 10, 12, 0, 0).getTime();

const SEED = { seedVersion: 1, subjects: [], knowledgePoints: [], questions: [], lessons: {}, settings: {} };
function fresh() { mockLS._d = {}; Store.init(SEED); }

test('POOL：50 条且无重复', () => {
  assert.equal(Jokes.POOL.length, 50);
  assert.equal(new Set(Jokes.POOL).size, 50, '50 条应各不相同');
});

test('state：同一天累计，跨日重置 told/next', () => {
  fresh();
  Jokes.pick(T0);
  assert.equal(Jokes.state(T0).told, 1);
  assert.equal(Jokes.state(T0 + DAY).told, 0);
  assert.equal(Jokes.state(T0 + DAY).next, 0);
});

test('canTell：每天 ≤2 条频率红线', () => {
  fresh();
  assert.equal(Jokes.canTell(T0), true);
  Jokes.pick(T0);
  assert.equal(Jokes.canTell(T0), true);
  Jokes.pick(T0);
  assert.equal(Jokes.canTell(T0), false, '讲了 2 条后当天不再讲');
});

test('pick：顺序轮换，连续两次不重复', () => {
  fresh();
  const a = Jokes.pick(T0);
  const b = Jokes.pick(T0);
  assert.notEqual(a, b);
  assert.equal(a, Jokes.POOL[0]);
  assert.equal(b, Jokes.POOL[1]);
});

test('pick：讲完 50 条后绕回第一条', () => {
  fresh();
  let last;
  for (let i = 0; i < 50; i++) last = Jokes.pick(T0);
  assert.equal(last, Jokes.POOL[49]);
  assert.equal(Jokes.pick(T0), Jokes.POOL[0], '游标应绕回');
});