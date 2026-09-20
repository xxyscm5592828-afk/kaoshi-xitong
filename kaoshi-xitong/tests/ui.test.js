// 开心弹窗（Ui.popup）单元测试：零依赖纯 DOM，用最小 fake document 驱动
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
    this.listeners = {};
    this.classList = { _set: {}, add(c) { this._set[c] = true; }, remove() {}, toggle() {} };
  }
  appendChild(c) { this.children.push(c); return c; }
  get firstChild() { return this.children[0] || null; }
  removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; }
  remove() { this._removed = true; }
  addEventListener(t, fn) { this.listeners[t] = fn; }
}

const bodyEl = new FakeEl('body');
const fakeDoc = {
  body: bodyEl,
  documentElement: new FakeEl('html'),
  _roots: {},
  getElementById(id) { return this._roots[id] || null; },
  createElement() { return new FakeEl('div'); },
};
// 模拟真实 DOM：挂到 body 的节点按 id 可被 getElementById 找到
bodyEl.appendChild = (c) => { bodyEl.children.push(c); if (c.id) fakeDoc._roots[c.id] = c; return c; };

function loadUi() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'ui.js'), 'utf8');
  return new Function('document', src + '; return { Ui };')(fakeDoc).Ui;
}

test('popup：无 DOM 环境直接跳过（测试沙箱安全）', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'ui.js'), 'utf8');
  const Ui2 = new Function('document', src + '; return { Ui };')(undefined).Ui;
  assert.doesNotThrow(() => Ui2.popup('t', 'x', 'joy'));
});

test('popup：首次调用创建 #popup-root 并挂到 body，按 tone 上色', () => {
  const Ui = loadUi();
  fakeDoc._roots = {};
  bodyEl.children = [];
  Ui.popup('标题', '内容', 'party');
  const root = fakeDoc._roots['popup-root'];
  assert.ok(root, '应创建 popup-root');
  assert.equal(bodyEl.children[0], root, 'root 挂到 body');
  assert.equal(root.children.length, 1);
  assert.equal(root.children[0].className, 'popup tone-party');
  assert.ok(root.children[0].innerHTML.includes('标题') && root.children[0].innerHTML.includes('内容'));
});

test('popup：同屏最多 3 个，超出挤掉最老的', () => {
  const Ui = loadUi();
  fakeDoc._roots = {};
  bodyEl.children = [];
  for (let i = 1; i <= 5; i++) Ui.popup('t' + i, 'x', 'joy');
  const root = fakeDoc._roots['popup-root'];
  assert.equal(root.children.length, 3, '最多叠 3 个');
  assert.ok(root.children[0].innerHTML.includes('t3'), '最老的 t1/t2 被挤掉');
});

test('popup：点击即关（先加 out 再移除）', () => {
  const Ui = loadUi();
  fakeDoc._roots = {};
  bodyEl.children = [];
  Ui.popup('t', 'x', 'joy');
  const root = fakeDoc._roots['popup-root'];
  const el = root.children[0];
  el.listeners.click();
  assert.ok(el.classList._set['out'], '点击应触发 dismiss（加 out 动画类）');
});
