// 朗读模块（TTS）单元测试：Web Speech API 封装 + 无 API 静默降级
// 设计：纯前端离线；不支持语音 API 的环境不渲染按钮、不抛错，界面与现状一致
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'speech.js'), 'utf8');

// window 作为形参注入：传 undefined 即模拟「非浏览器/无语音 API」环境
function loadSpeech(win) {
  return new Function('window', SRC + '; return { Speech };')(win);
}

function fakeSpeechWin(voices) {
  const calls = { spoken: [], cancelled: 0 };
  function SpeechSynthesisUtterance(text) { this.text = text; this.lang = ''; this.onend = null; }
  const win = {
    SpeechSynthesisUtterance,
    speechSynthesis: {
      speaking: false,
      speak(u) { calls.spoken.push(u); win.speechSynthesis.speaking = true; },
      cancel() { calls.cancelled++; win.speechSynthesis.speaking = false; },
    },
  };
  if (voices) win.speechSynthesis.getVoices = () => voices;
  return { win, calls };
}

function fakeBtn(scope) {
  const b = {
    textContent: '🔊 朗读',
    dataset: { speak: scope },
    listeners: {},
    addEventListener(t, fn) { b.listeners[t] = fn; },
    click() { if (b.listeners.click) b.listeners.click({ target: b }); },
  };
  return b;
}

function fakeRoot(btn) {
  return {
    querySelector(sel) { return btn && sel.includes(btn.dataset.speak) ? btn : null; },
  };
}

test('无语音 API：supported=false、btnHTML 空、speak/stop 返回 false 且不抛错', () => {
  const { Speech } = loadSpeech(undefined);
  assert.equal(Speech.supported(), false);
  assert.equal(Speech.btnHTML('lesson'), '');
  assert.equal(Speech.speak('你好'), false);
  assert.equal(Speech.stop(), false);
});

test('支持语音：btnHTML 带 speak-btn 与 data-speak 作用域', () => {
  const { win } = fakeSpeechWin();
  const { Speech } = loadSpeech(win);
  assert.equal(Speech.supported(), true);
  const html = Speech.btnHTML('explain');
  assert.ok(html.includes('speak-btn'), '应带统一朗读按钮类名');
  assert.ok(html.includes('data-speak="explain"'), '应标明朗读作用域');
});

test('speak：去标签、压缩空白、中文语音，且先 cancel 再 speak', () => {
  const { win, calls } = fakeSpeechWin();
  const { Speech } = loadSpeech(win);
  assert.equal(Speech.speak('<b>你好</b>\n世界'), true);
  assert.equal(calls.cancelled, 1, '应先打断上一次朗读');
  assert.equal(calls.spoken.length, 1);
  assert.equal(calls.spoken[0].text, '你好 世界', '不应念出 HTML 标记，空白应压缩');
  assert.equal(calls.spoken[0].lang, 'zh-CN');
});

test('speak：空或纯空白文本返回 false，不触发底层朗读', () => {
  const { win, calls } = fakeSpeechWin();
  const { Speech } = loadSpeech(win);
  assert.equal(Speech.speak('   '), false);
  assert.equal(Speech.speak(null), false);
  assert.equal(calls.spoken.length, 0);
});

test('speak：显式选用普通话语音，避开粤语等方言', () => {
  const voices = [
    { name: 'Sinji', lang: 'zh-HK' },
    { name: 'Mei-Jia', lang: 'zh-TW' },
    { name: 'Ting-Ting', lang: 'zh-CN' },
  ];
  const { win, calls } = fakeSpeechWin(voices);
  const { Speech } = loadSpeech(win);
  assert.equal(Speech.speak('你好'), true);
  assert.equal(calls.spoken[0].lang, 'zh-CN');
  assert.equal(calls.spoken[0].voice.lang, 'zh-CN', '应选中普通话语音');
});

test('speak：无普通话语音时不误选方言，退回 lang=zh-CN', () => {
  const { win, calls } = fakeSpeechWin([{ name: 'Sinji', lang: 'zh-HK' }]);
  const { Speech } = loadSpeech(win);
  assert.equal(Speech.speak('你好'), true);
  assert.equal(calls.spoken[0].voice, undefined, '不应退而选粤语语音');
  assert.equal(calls.spoken[0].lang, 'zh-CN');
});

test('stop：调用底层 cancel', () => {
  const { win, calls } = fakeSpeechWin();
  const { Speech } = loadSpeech(win);
  assert.equal(Speech.stop(), true);
  assert.equal(calls.cancelled, 1);
});

test('wire：不支持环境不抛错、不绑定', () => {
  const { Speech } = loadSpeech(undefined);
  assert.doesNotThrow(() => Speech.wire({ querySelector: () => null }, 'lesson', () => 'x'));
});

test('wire：点击朗读按钮读出 getText 文本，按钮变「停止」；再点即停止复位', () => {
  const { win, calls } = fakeSpeechWin();
  const { Speech } = loadSpeech(win);
  const btn = fakeBtn('lesson');
  Speech.wire(fakeRoot(btn), 'lesson', () => '核心一句话。解释。');
  btn.click();
  assert.equal(calls.spoken.length, 1);
  assert.equal(calls.spoken[0].text, '核心一句话。解释。');
  assert.equal(btn.textContent, '⏹ 停止');
  btn.click();
  assert.equal(calls.spoken.length, 1, '第二次点击不应再朗读');
  assert.equal(calls.cancelled, 2, '首次朗读先打断、再点停止，各取消一次');
  assert.equal(btn.textContent, '🔊 朗读', '停止后按钮文案复位');
});

test('wire：读另一处时，先前按钮文案复位', () => {
  const { win } = fakeSpeechWin();
  const { Speech } = loadSpeech(win);
  const a = fakeBtn('chat');
  const b = fakeBtn('chat');
  Speech.wire(fakeRoot(a), 'chat', () => 'A');
  Speech.wire(fakeRoot(b), 'chat', () => 'B');
  a.click();
  b.click();
  assert.equal(a.textContent, '🔊 朗读', '切换到另一处朗读时旧按钮应复位');
  assert.equal(b.textContent, '⏹ 停止');
});
