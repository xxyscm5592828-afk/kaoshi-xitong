// 掌握度引擎 v2 单元测试（node --test）
// 规则来源：开发文档 §5
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

function load(file, name) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8');
  return new Function(src + `; return ${name};`)();
}
const Mastery = load('mastery.js', 'Mastery');

const DAY = 86400000;

test('默认状态：score 50，interval 1 天', () => {
  const m = Mastery.default();
  assert.equal(m.score, 50);
  assert.equal(m.reviewCount, 0);
  assert.equal(m.interval, 1);
});

test('答对且快（r≤0.5）：+15，fastStreak+1', () => {
  const m = Mastery.default();
  const r = Mastery.apply(m, true, 10, 40); // r = 0.25
  assert.equal(r.score, 65);
  assert.equal(r.fastStreak, 1);
  assert.equal(r.correctStreak, 1);
});

test('答对正常速度（0.5<r≤1.5）：+8，fastStreak 归零', () => {
  let m = Mastery.apply(Mastery.default(), true, 10, 40); // 快，fastStreak=1
  m = Mastery.apply(m, true, 40, 40); // r = 1
  assert.equal(m.score, 50 + 15 + 8);
  assert.equal(m.fastStreak, 0); // 非快对，中断
  assert.equal(m.correctStreak, 2);
});

test('答对但慢（r>1.5）：仅 +2', () => {
  const m = Mastery.apply(Mastery.default(), true, 100, 40); // r = 2.5
  assert.equal(m.score, 52);
});

test('答错：-20，streak 归零', () => {
  let m = Mastery.apply(Mastery.default(), true, 10, 40);
  m = Mastery.apply(m, false, 50, 40);
  assert.equal(m.score, 65 - 20);
  assert.equal(m.correctStreak, 0);
  assert.equal(m.fastStreak, 0);
});

test('连续答错扣分衰减（防一次失误毁积累）：-20 → -16 → -12.8', () => {
  let m = Mastery.default();
  m.score = 60;
  m = Mastery.apply(m, false, 50, 40); // 第1次错 -20
  assert.equal(m.score, 40);
  m = Mastery.apply(m, false, 50, 40); // 第2次连错 -16
  assert.equal(m.score, 24);
  m = Mastery.apply(m, false, 50, 40); // 第3次连错 -12.8
  assert.ok(Math.abs(m.score - 11.2) < 1e-9);
});

test('连续错后答对：扣分恢复满额（streak 重置）', () => {
  let m = Mastery.default();
  m.score = 60;
  m = Mastery.apply(m, false, 50, 40);
  m = Mastery.apply(m, false, 50, 40);
  m = Mastery.apply(m, true, 10, 40); // 快对，wrongStreak 归零
  m = Mastery.apply(m, false, 50, 40); // 又错，回到 -20
  assert.equal(m.score, 24 + 15 - 20);
});

test('score 边界 clamp 0~100', () => {
  let m = Mastery.default();
  m.score = 95;
  m = Mastery.apply(m, true, 1, 40);
  assert.equal(m.score, 100);
  m.score = 10;
  m = Mastery.apply(m, false, 50, 40);
  assert.equal(m.score, 0);
});

test('自适应间隔：快对×2.0，慢对×1.3，答错重置1天', () => {
  let m = Mastery.default(); // interval=1
  m = Mastery.apply(m, true, 10, 40); // r=0.25 快
  assert.equal(m.interval, 2);
  m = Mastery.apply(m, true, 40, 40); // r=1，不快不慢（快= r≤1 → ×2.0）
  assert.equal(m.interval, 4);
  m = Mastery.apply(m, true, 80, 40); // r=2 慢
  assert.ok(Math.abs(m.interval - 4 * 1.3) < 1e-9);
  m = Mastery.apply(m, false, 50, 40);
  assert.equal(m.interval, 1);
});

test('指数遗忘：半衰期 = 2×1.8^reviewCount', () => {
  let m = Mastery.default();
  m.score = 80;
  m.reviewCount = 0; // halfLife = 2 天
  let d = Mastery.decay(m, m.lastReviewAt + 2 * DAY);
  assert.ok(Math.abs(d.score - 40) < 1e-9);
  d = Mastery.decay(m, m.lastReviewAt + 4 * DAY);
  assert.ok(Math.abs(d.score - 20) < 1e-9);
  // reviewCount=3 → halfLife = 2×1.8³ = 11.664 天
  m.reviewCount = 3;
  d = Mastery.decay(m, m.lastReviewAt + 11.664 * DAY);
  assert.ok(Math.abs(d.score - 40) < 1e-6);
});

test('已掌握判定：score≥85 且 fastStreak≥2', () => {
  assert.equal(Mastery.isMastered({ score: 90, fastStreak: 2 }), true);
  assert.equal(Mastery.isMastered({ score: 90, fastStreak: 1 }), false);
  assert.equal(Mastery.isMastered({ score: 80, fastStreak: 5 }), false);
});

test('抽题优先级：低分高遗忘高权重优先；60~85 ROI 加成；<30 剔除', () => {
  const now = Date.now();
  const low = Mastery.default(); low.score = 20; // <30 → 剔除
  assert.equal(Mastery.priority(low, { weight: 5 }, now), -Infinity);

  // 相同时间下：低分点优先
  const a = Mastery.default(); a.score = 30; a.lastReviewAt = now;
  const b = Mastery.default(); b.score = 70; b.lastReviewAt = now;
  assert.ok(Mastery.priority(a, { weight: 3 }, now) > Mastery.priority(b, { weight: 3 }, now));

  // 60~85 区间 ROI 加成：62 分（带加成）应胜过 58 分（带无加成），尽管分更高
  const inBand = Mastery.default(); inBand.score = 62; inBand.lastReviewAt = now;
  const belowBand = Mastery.default(); belowBand.score = 58; belowBand.lastReviewAt = now;
  const pIn = Mastery.priority(inBand, { weight: 3 }, now);
  const pBelow = Mastery.priority(belowBand, { weight: 3 }, now);
  assert.ok(pIn > pBelow, `inBand(${pIn}) 应大于 belowBand(${pBelow})`);

  // 高遗忘压力优先
  const fresh = Mastery.default(); fresh.score = 50; fresh.lastReviewAt = now; fresh.reviewCount = 5;
  const stale = Mastery.default(); stale.score = 50; stale.lastReviewAt = now - 30 * DAY; stale.reviewCount = 0;
  assert.ok(Mastery.priority(stale, { weight: 3 }, now) > Mastery.priority(fresh, { weight: 3 }, now));

  // 权重放大
  assert.ok(Mastery.priority(stale, { weight: 5 }, now) > Mastery.priority(stale, { weight: 1 }, now));
});

test('溯源诊断：沿先修链递归找根因', () => {
  const now = Date.now();
  const kps = {
    a: { id: 'a', name: '分式方程', prerequisites: ['b'] },
    b: { id: 'b', name: '一元一次方程', prerequisites: [] },
    c: { id: 'c', name: '因式分解', prerequisites: [] },
  };
  // a 弱且根因是先修 b 弱 → 根因 = b，深度 1
  const mastery = {
    a: { score: 40 }, b: { score: 45 }, c: { score: 90 },
  };
  const res = Mastery.diagnose(kps.a, mastery, kps);
  assert.equal(res.root.id, 'b');
  assert.equal(res.depth, 1);
  assert.deepEqual(res.chain.map(k => k.id), ['a', 'b']);

  // 先修不弱 → 根因即本身
  const mastery2 = { a: { score: 40 }, b: { score: 90 }, c: { score: 90 } };
  const res2 = Mastery.diagnose(kps.a, mastery2, kps);
  assert.equal(res2.root.id, 'a');
  assert.equal(res2.depth, 0);

  // 深度 > 2 → 需回炉重学
  const kps3 = {
    x: { id: 'x', prerequisites: ['y'] },
    y: { id: 'y', prerequisites: ['z'] },
    z: { id: 'z', prerequisites: ['w'] },
    w: { id: 'w', prerequisites: [] },
  };
  const mastery3 = { x: { score: 10 }, y: { score: 20 }, z: { score: 30 }, w: { score: 40 } };
  const res3 = Mastery.diagnose(kps3.x, mastery3, kps3);
  assert.equal(res3.depth, 3);
  assert.equal(Mastery.needsRelearn(res3), true);
  assert.equal(Mastery.needsRelearn(res2), false);
});

test('溯源诊断：先修未测（无掌握度记录）不按默认 50 误判下钻', () => {
  const kps = {
    a: { id: 'a', name: '分式方程', prerequisites: ['b'] },
    b: { id: 'b', name: '一元一次方程', prerequisites: ['c'] },
    c: { id: 'c', name: '整式加减', prerequisites: [] },
  };
  // 仅 a 有实测记录（弱）；b/c 都还没做过题 → 不应沿链一路下钻成 needsRelearn
  const mastery = { a: { score: 40 } };
  const res = Mastery.diagnose(kps.a, mastery, kps);
  assert.equal(res.root.id, 'a', '未测先修不算根因，根因应停在实测点本身');
  assert.equal(res.depth, 0);
  assert.equal(Mastery.needsRelearn(res), false);
});

test('错题销号回写：原题重做通过 +5，变式通过 +8，不通过不动分', () => {
  let m = Mastery.default(); m.score = 40;
  m = Mastery.applyClosure(m, true, 5, Date.now());
  assert.equal(m.score, 45);
  m = Mastery.applyClosure(m, true, 8, Date.now());
  assert.equal(m.score, 53);
  const before = m.score;
  m = Mastery.applyClosure(m, false, 8, Date.now());
  assert.equal(m.score, before); // 不通过不额外扣分（D0 已扣过）
  assert.equal(m.lastReviewAt, Date.now());
});
