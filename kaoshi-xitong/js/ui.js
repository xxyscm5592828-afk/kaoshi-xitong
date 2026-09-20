// 开心弹窗（体验完善）：色彩鲜艳的庆祝/调侃弹窗，纯 DOM，零依赖
// 用于：笑话、冷知识卡掉落、技能点亮、悬赏销号等「开心文字」
// 规则：最多同屏 3 个，5 秒自动消失，点一下立即消失；不阻塞任何操作
const Ui = {
  MAX: 3,
  TIMEOUT: 5000,

  popup(title, text, tone) {
    if (typeof document === 'undefined' || !document.body) return; // 测试/无 DOM 环境跳过
    const root = document.getElementById('popup-root') || this._root();
    const el = document.createElement('div');
    el.className = 'popup tone-' + (tone || 'joy');
    el.innerHTML = `<div class="popup-title">${title}</div><div class="popup-text">${text}</div>`;
    root.appendChild(el);
    // 叠多了只留最新的，别糊一脸
    while (root.children.length > this.MAX) root.removeChild(root.firstChild);
    const dismiss = () => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 320);
    };
    el.addEventListener('click', dismiss);
    // 自动关闭的定时器不阻塞进程退出（Node 测试环境），浏览器端无副作用
    const t = setTimeout(dismiss, this.TIMEOUT);
    if (t && typeof t.unref === 'function') t.unref();
  },

  _root() {
    const div = document.createElement('div');
    div.id = 'popup-root';
    document.body.appendChild(div);
    return div;
  },
};
