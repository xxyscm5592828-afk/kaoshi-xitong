// 微课示意图测试（对比分析 B2）：SVG 插图为合法内联 SVG；未知知识点返回空串
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'illustrations.js'), 'utf8');
const { Illustrations } = new Function(src + '; return { Illustrations };')();

test('illustrations：十个知识点都有图，且为合法 SVG', () => {
  for (const id of ['m8b-p18', 'm8a-p6', 'phy8b-p11', 'phy8a-p18', 'phy8a-p14', 'phy8b-p18', 'm8b-p6', 'bio8a-p13', 'bio8b-p10', 'geo8a-p6']) {
    const svg = Illustrations.get(id).trim();
    assert.ok(svg.startsWith('<svg'), id + ' 应以 <svg 开头');
    assert.ok(svg.includes('</svg>'), id + ' 应闭合');
    assert.ok(!/<script/i.test(svg), id + ' 不含脚本（纯静态）');
  }
});

test('illustrations：未知知识点返回空串（微课不插槽）', () => {
  assert.equal(Illustrations.get('no-such-kp'), '');
});
