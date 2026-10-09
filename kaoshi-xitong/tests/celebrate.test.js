// 妈妈表扬（Celebrate）单元测试：零依赖纯 DOM，用最小 fake document 驱动
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

class FakeEl {
  constructor(tag) {
    this.tag = tag || '';
    this.children = [];
    this.className = '';
    this.innerHTML = '';
    this.id = '';
    this.style = {};
    this.listeners = {};
    this.classList = { _set: {}, add(c) { this._set[c] = true; }, remove() {}, toggle() {} };
  }
  appendChild(c) { this.children.push(c); return c; }
  get firstChild() { return this.children[0] || null; }
  removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; }
  remove() { this._removed = true; }
  addEventListener(t, fn) { this.listeners[t] = fn; }
}

function makeDoc() {
  const bodyEl = new FakeEl('body');
  const fakeDoc = {
    body: bodyEl,
    documentElement: new FakeEl('html'),
    _roots: {},
    getElementById(id) { return this._roots[id] || null; },
    createElement() { return new FakeEl('div'); },
  };
  bodyEl.appendChild = (c) => { bodyEl.children.push(c); if (c.id) fakeDoc._roots[c.id] = c; return c; };
  return { fakeDoc, bodyEl };
}

function loadCelebrate(doc, win) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'celebrate.js'), 'utf8');
  return new Function('document', 'window', src + '; return { Celebrate };')(doc, win).Celebrate;
}

test('praise：无 DOM 环境直接跳过（测试沙箱安全）', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'celebrate.js'), 'utf8');
  const C = new Function('document', 'window', src + '; return { Celebrate };')(undefined, undefined).Celebrate;
  assert.doesNotThrow(() => C.praise({ title: 't', text: 'x' }));
});

test('praise：创建 #celebrate-root，撒纸屑 + 中央点赞卡', () => {
  const { fakeDoc, bodyEl } = makeDoc();
  const C = loadCelebrate(fakeDoc, undefined); // 无 window：跳过节庆音效
  C.praise({ title: '亮点', text: '正文' });
  const root = fakeDoc._roots['celebrate-root'];
  assert.ok(root, '应创建 celebrate-root');
  assert.equal(bodyEl.children[0], root, 'root 挂到 body');
  const confetti = root.children.filter(c => c.className === 'confetti');
  assert.ok(confetti.length > 0, '应撒下纸屑');
  const card = root.children.find(c => c.className === 'celebrate-card');
  assert.ok(card, '应有中央点赞卡');
  assert.ok(card.innerHTML.includes('assets/mom-praise.png'), '点赞卡用妈妈头像');
  assert.ok(card.innerHTML.includes('亮点') && card.innerHTML.includes('正文'));
});

test('praise：COOLDOWN 防抖，短时间内不连环触发', () => {
  const { fakeDoc } = makeDoc();
  const C = loadCelebrate(fakeDoc, undefined);
  C.praise({ title: 'a', text: 'a' });
  const root = fakeDoc._roots['celebrate-root'];
  const n = root.children.length;
  C.praise({ title: 'b', text: 'b' });
  assert.equal(root.children.length, n, '防抖窗口内的第二次调用不应新增节点');
});

test('praise：点击点赞卡即关（先加 out 再移除）', () => {
  const { fakeDoc } = makeDoc();
  const C = loadCelebrate(fakeDoc, undefined);
  C.praise({ title: 'a', text: 'a' });
  const root = fakeDoc._roots['celebrate-root'];
  const card = root.children.find(c => c.className === 'celebrate-card');
  card.listeners.click();
  assert.ok(root.classList._set['out'], '点击应触发 dismiss（加 out 动画类）');
});
