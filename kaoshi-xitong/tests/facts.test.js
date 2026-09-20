// 冷知识卡单元测试（阶段 3 §10.4：20% 概率掉落，图鉴收集，不兑换）
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const mockLS = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };

function loadAll() {
  const srcs = ['storage.js', 'facts.js']
    .map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  return new Function('localStorage', srcs + '; return { Store, Facts };')(mockLS);
}
const { Store, Facts } = loadAll();

function fresh() {
  mockLS._d = {};
  Store.init({ seedVersion: 1, subjects: [], knowledgePoints: [], questions: [], lessons: {}, settings: {} });
}

// 用确定性随机：先收集全部卡（每次必掉），再断言集齐后不再掉
function collectAll() {
  const origin = Math.random;
  let calls = 0;
  // 模拟 20% 概率：把随机数钳到 <0.2，保证必掉
  Math.random = () => 0.1;
  try {
    let guard = 0;
    while (guard++ < 500) {
      const f = Facts.tryDrop();
      if (!f) break;
    }
  } finally { Math.random = origin; }
}

test('BANK 至少 15 张且 id 唯一', () => {
  assert.ok(Facts.BANK.length >= 15);
  const ids = new Set(Facts.BANK.map(f => f.id));
  assert.equal(ids.size, Facts.BANK.length);
  for (const f of Facts.BANK) assert.ok(f.text.length > 0);
});

test('tryDrop：20% 概率掉落；未掉落/集齐均返回 null', () => {
  fresh();
  const origin = Math.random;
  // 每次 tryDrop 调两次 Math.random：第 1 次判概率、第 2 次选卡（未掉落提前 return 只调 1 次）
  // 按原始调用序：t1 检查0.1/选卡0 → t2 检查0.5(不掉) → t3 检查0.9(不掉) → t4 检查0.1/选卡0
  const plan = [0.1, 0, 0.5, 0.9, 0.1, 0];
  let n = 0;
  Math.random = () => plan[n++] ?? 0.5;
  try {
    const f1 = Facts.tryDrop();
    assert.ok(f1 && f1.id, '随机 <0.2 时掉落');
    assert.equal(f1.id, 'f1', '选卡随机=0 → 取第一张');
    assert.deepEqual(Store.facts, ['f1']);
    assert.equal(Facts.tryDrop(), null, '≥0.2 不掉落');
    assert.equal(Facts.tryDrop(), null);
    const f2 = Facts.tryDrop();
    assert.ok(f2 && f2.id === 'f2', '第二次掉落是新卡（已收 f1 后取第一张）');
    assert.equal(Store.facts.length, 2);
  } finally { Math.random = origin; }
});

test('集齐后不再掉新卡', () => {
  fresh();
  collectAll();
  assert.equal(Store.facts.length, Facts.BANK.length);
  assert.equal(Facts.tryDrop(), null, '图鉴集齐后不再掉落');
});
