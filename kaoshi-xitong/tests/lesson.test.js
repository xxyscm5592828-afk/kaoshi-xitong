// 教学模块（微课）单元测试：讲法状态管理 + 换讲法 + 自测记录
// 规则来源：开发文档 §8
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const mockLS = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };

// 语音桩：注入 window 后 Speech 视为「支持朗读」，与浏览器环境一致
const speechWin = { speechSynthesis: { speak() {}, cancel() {} }, SpeechSynthesisUtterance: function (t) { this.text = t; } };

function loadAll() {
  const srcs = ['storage.js', 'speech.js', 'lesson.js', 'illustrations.js']
    .map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  return new Function('localStorage', 'window', srcs + '; return { Store, Lesson, Illustrations };')(mockLS, speechWin);
}
const { Store, Lesson, Illustrations } = loadAll();

function lesson(version, oneLiner) {
  return { version, oneLiner: oneLiner || ('v' + version), problem: '', analogy: '', example: '', pitfalls: [], check: [{ stem: 's', options: ['a', 'b'], answer: 0 }], readTime: 90 };
}

const SEED = {
  seedVersion: 1,
  subjects: [{ id: 'math', name: '数学' }],
  knowledgePoints: [{ id: 'kp1', subjectId: 'math', parentId: null, name: 'SAS', order: 1, level: 4, weight: 5, prerequisites: [] }],
  questions: [],
  lessons: { kp1: [lesson(1), lesson(2)] },
  settings: {},
};

test('默认讲法 version 1', () => {
  mockLS._d = {}; Store.init(SEED);
  assert.equal(Lesson.current('kp1').version, 1);
  assert.equal(Lesson.state('kp1').version, 1);
});

test('换讲法：1 → 2 → 循环回 1', () => {
  mockLS._d = {}; Store.init(SEED);
  Lesson.switchVersion('kp1');
  assert.equal(Lesson.current('kp1').version, 2);
  Lesson.switchVersion('kp1');
  assert.equal(Lesson.current('kp1').version, 1);
});

test('换讲法后 checkPassed 重置为 false', () => {
  mockLS._d = {}; Store.init(SEED);
  Lesson.recordCheck('kp1', true, 0);
  assert.equal(Lesson.state('kp1').checkPassed, true);
  Lesson.switchVersion('kp1');
  assert.equal(Lesson.state('kp1').checkPassed, false);
});

test('自测通过记录 passedVersion；不通过不动 passedVersion', () => {
  mockLS._d = {}; Store.init(SEED);
  Lesson.recordCheck('kp1', false, 0);
  assert.equal(Lesson.state('kp1').passedVersion, null);
  Lesson.recordCheck('kp1', true, 0);
  assert.equal(Lesson.state('kp1').passedVersion, 1);
  assert.equal(Lesson.state('kp1').checkPassed, true);
});

test('无微课知识点：current() 返回 null；状态持久化', () => {
  mockLS._d = {}; Store.init(SEED);
  assert.equal(Lesson.current('kp-none'), null);
  Lesson.recordCheck('kp1', true, 0);
  // lessonState 经 Store 持久化（模拟刷新：重新读 localStorage）
  const st = JSON.parse(mockLS.getItem('tutor.lessonState'));
  assert.equal(st.kp1.passedVersion, 1);
});

test('addVersion：AI 新讲法入库，版本号+1、切到新讲法、重置自测、补 readTime', () => {
  mockLS._d = {}; Store.init(SEED);
  Lesson.recordCheck('kp1', true, 0);
  const added = Lesson.addVersion('kp1', { oneLiner: '新', problem: '', analogy: '乐高', example: '', pitfalls: [], check: [] });
  assert.equal(added.version, 3);
  assert.equal(Lesson.state('kp1').version, 3);
  assert.equal(Lesson.state('kp1').checkPassed, false);
  assert.equal(Lesson.current('kp1').oneLiner, '新');
  assert.equal(Lesson.current('kp1').readTime, 90);
  assert.equal(Lesson.versions('kp1').length, 3);
});

test('addVersion：无历史讲法的知识点也能建一台新版本（从 1 开始）', () => {
  mockLS._d = {}; Store.init(SEED);
  const added = Lesson.addVersion('kp-new', { oneLiner: 'x', problem: '', analogy: 'a', example: '', pitfalls: [], check: [{ stem: 's', options: ['a', 'b'], answer: 0 }] });
  assert.equal(added.version, 1);
  assert.equal(Lesson.current('kp-new').oneLiner, 'x');
});

test('render：有示意图的知识点输出 lesson-illo 插槽；无图的不输出（对比分析 B2）', () => {
  mockLS._d = {}; Store.init(SEED);
  const fakeEl = () => ({ innerHTML: '', querySelector() { return { addEventListener() {} }; } });
  // 无图 kp1 → 不插槽
  const el1 = fakeEl();
  Lesson.render('kp1', el1, () => {});
  assert.ok(!el1.innerHTML.includes('lesson-illo'));
  // 有图 kp（m8b-p18，Illustrations.MAP 已配）→ 插槽
  Store.lessons = { 'm8b-p18': [lesson(1)] };
  const el2 = fakeEl();
  Lesson.render('m8b-p18', el2, () => {});
  assert.ok(el2.innerHTML.includes('lesson-illo'), '应输出示意图容器');
  assert.ok(el2.innerHTML.includes('<svg'), '示意图应为 SVG');
});

test('render：微课卡带整卡朗读按钮（scope=lesson）', () => {
  mockLS._d = {}; Store.init(SEED);
  const el = { innerHTML: '', querySelector() { return { addEventListener() {} }; } };
  Lesson.render('kp1', el, () => {});
  assert.ok(el.innerHTML.includes('data-speak="lesson"'), '微课卡应带朗读按钮');
  assert.ok(el.innerHTML.includes('🔊 朗读'), '按钮文案应为「朗读」');
});
