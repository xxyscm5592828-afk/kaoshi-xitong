// 朗读模块：Web Speech API 的最小封装（纯前端、离线、零 DOM 依赖）
// 不支持语音 API 的环境静默降级：不渲染按钮、不抛错，界面与现状一致
const Speech = {
  supported() {
    return typeof window !== 'undefined'
      && !!window.speechSynthesis && !!window.SpeechSynthesisUtterance;
  },

  // 去标签 + 压缩空白：讲解文本里带的 <strong> 等标记不应被念出来
  clean(text) {
    return String(text == null ? '' : text)
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  // 显式挑选普通话语音：优先 zh-CN，其次简体（Hans）；排除粤语/港澳方言
  // 浏览器在只有 lang 声明时可能自行挑到粤语，故这里把语音选死
  pickVoice() {
    if (!this.supported() || typeof window.speechSynthesis.getVoices !== 'function') return null;
    const voices = window.speechSynthesis.getVoices() || [];
    const zh = voices.filter(v => /^(zh|cmn)/i.test(String(v.lang || '')));
    const usable = zh.filter(v => !/(HK|MO|yue)/i.test(String(v.lang || '')));
    return usable.find(v => /^zh[-_]?CN/i.test(v.lang))
      || usable.find(v => /Hans/i.test(v.lang))
      || usable[0]
      || null;
  },

  speak(text) {
    if (!this.supported()) return false;
    const clean = this.clean(text);
    if (!clean) return false;
    window.speechSynthesis.cancel();
    const u = new window.SpeechSynthesisUtterance(clean);
    u.lang = 'zh-CN';
    const voice = this.pickVoice();
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
    return true;
  },

  stop() {
    if (!this.supported()) return false;
    window.speechSynthesis.cancel();
    return true;
  },

  // scope 用于在同一容器内区分朗读按钮；不支持时返回空串，界面不变
  btnHTML(scope) {
    if (!this.supported()) return '';
    return `<button type="button" class="btn secondary small speak-btn" data-speak="${scope}">🔊 朗读</button>`;
  },

  // getText 延迟到点击时才求值：卡片重渲染后文本总是最新的
  wire(root, scope, getText) {
    if (!this.supported()) return;
    if (!root || typeof root.querySelector !== 'function') return;
    const btn = root.querySelector('[data-speak="' + scope + '"]');
    if (!btn || typeof btn.addEventListener !== 'function') return;
    btn.addEventListener('click', () => {
      if (this._active === btn) {
        this.stop();
        btn.textContent = '🔊 朗读';
        this._active = null;
        return;
      }
      if (this._active) this._active.textContent = '🔊 朗读';
      if (this.speak(getText())) {
        btn.textContent = '⏹ 停止';
        this._active = btn;
      } else {
        this._active = null;
      }
    });
  },
};
