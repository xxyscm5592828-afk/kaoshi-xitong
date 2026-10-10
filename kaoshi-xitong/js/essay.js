// 作文拍照评分：拍下纸质作文本 → AI 按中考标准打分（与「问爸爸」共用 AI 通道）
// 入口在「学习工具」目录；图片在本地压缩后以 base64 内联传给 AI（OpenAI 兼容的 image_url 内容块）。
// 规则来源：用户要求「作文可以提供拍照 + AI 评分，一切以效率优先」。
const Essay = {
  // 各地中考作文满分不同：默认 50，页面可切 60
  FULL_OPTIONS: [50, 60],
  DEFAULT_FULL: 50,
  MAX_EDGE: 1600,      // 图片最长边压到 1600px，避免手机原图过大导致上传慢/超限
  JPEG_QUALITY: 0.82,
  MAX_TOKENS: 1200,    // 图片理解 + JSON 输出，留足余量
  _state: { dataUrl: '', full: 50, busy: false, result: '', parsed: null, err: '' },

  _sysPrompt(full) {
    return [
      `你是一位资深初中语文老师，正在按中考作文评分标准，给一篇初中生写的作文打分。满分 ${full} 分。`,
      '先看清照片里的作文内容（字迹、段落、字数），再评分；如果照片模糊看不清，请在 comment 里说明。',
      '',
      '严格按这个 JSON 结构输出：',
      '{',
      '  "score": 整数分数,',
      '  "level": "等级（如：一类文 / 二类文 / 三类文）",',
      '  "highlights": ["写得好的地方1", "写得好的地方2"],',
      '  "suggestions": ["最该改的地方1", "最该改的地方2"],',
      '  "comment": "给孩子的一段话"',
      '}',
      '',
      '硬要求：',
      `- score 必须是 0~${full} 的整数。`,
      '- highlights 和 suggestions 各 2~3 条，每条一句话，具体、可操作，别写空话套话。',
      '- comment 用初中生听得懂的话，先肯定再鼓励，2~3 句，不说教。',
      '- 只输出 JSON，不要输出多余文字。',
    ].join('\n');
  },

  _esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); },

  // 复用答疑模块的 JSON 抠取（容忍 ```json 围栏 / 前后缀说明文字）
  _parse(text) {
    const o = (typeof Assistant !== 'undefined' && Assistant._extractJSON) ? Assistant._extractJSON(text) : null;
    return (o && typeof o === 'object') ? o : null;
  },

  // 手机原图 → 本地 canvas 压缩为 JPEG dataURL（不上传原图）
  _compress(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let w = img.width, h = img.height;
        if (w > this.MAX_EDGE || h > this.MAX_EDGE) {
          const r = Math.min(this.MAX_EDGE / w, this.MAX_EDGE / h);
          w = Math.round(w * r); h = Math.round(h * r);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        try { resolve(canvas.toDataURL('image/jpeg', this.JPEG_QUALITY)); }
        catch (e) { reject(e); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
      img.src = url;
    });
  },

  async _grade(st, draw) {
    st.busy = true; st.err = ''; draw();
    const res = await AI.chat({
      messages: [
        { role: 'system', content: this._sysPrompt(st.full) },
        {
          role: 'user',
          content: [
            { type: 'text', text: '这是孩子写的作文，请按上面的要求评分。' },
            { type: 'image_url', image_url: { url: st.dataUrl } },
          ],
        },
      ],
      maxTokens: this.MAX_TOKENS,
      temperature: 0.3,
    });
    st.busy = false;
    if (!res.ok) {
      st.err = (typeof AI_MSG !== 'undefined' && AI_MSG[res.error]) || 'AI 暂时用不了，稍后再试。';
      draw();
      return;
    }
    st.result = res.text;
    st.parsed = this._parse(res.text);
    draw();
  },

  _resultHTML(text, o, full) {
    if (!o) {
      // JSON 没解析出来，原样展示，绝不吞掉 AI 的文字
      return `<div class="essay-result">
        <div class="essay-block-title">AI 老师的评语</div>
        <pre class="essay-raw">${this._esc(text)}</pre>
      </div>`;
    }
    const score = (o.score != null && Number.isFinite(Number(o.score))) ? Number(o.score) : null;
    const list = arr => (Array.isArray(arr) ? arr : []).map(x => `<li>${this._esc(x)}</li>`).join('');
    const highlights = list(o.highlights);
    const suggestions = list(o.suggestions);
    return `<div class="essay-result">
      <div class="essay-score">
        <span class="essay-score-num">${score != null ? score : '—'}</span>
        <span class="essay-score-full">/ ${full}</span>
      </div>
      ${o.level ? `<div class="essay-level">${this._esc(o.level)}</div>` : ''}
      ${highlights ? `<div class="essay-block"><div class="essay-block-title">👍 写得好的地方</div><ul>${highlights}</ul></div>` : ''}
      ${suggestions ? `<div class="essay-block"><div class="essay-block-title">💡 可以改的地方</div><ul>${suggestions}</ul></div>` : ''}
      ${o.comment ? `<div class="essay-comment">${this._esc(o.comment)}</div>` : ''}
    </div>`;
  },

  render(el, onBack) {
    const st = this._state;
    const draw = () => {
      el.innerHTML = `
        <div class="card">
          <div class="learn-head"><h2>✍️ 作文拍照评分</h2><button class="btn secondary small" id="essay-back">← 回工具目录</button></div>
          ${st.result ? `
            ${this._resultHTML(st.result, st.parsed, st.full)}
            <div class="session-actions">
              <button class="btn glow" id="essay-again">✍️ 再评一篇</button>
            </div>`
          : `
            <p class="muted">拍下写完的作文（或从相册选一张），AI 老师按中考标准打分，告诉你亮点和提分方向。</p>
            <div class="essay-toolbar">
              <label class="essay-full">满分
                <select class="unit-select" id="essay-full">${this.FULL_OPTIONS.map(o => `<option value="${o}"${o === st.full ? ' selected' : ''}>${o} 分</option>`).join('')}</select>
              </label>
              <button class="btn secondary" id="essay-pick">${st.dataUrl ? '重新选图' : '📷 拍照 / 选图'}</button>
              ${st.dataUrl ? `<button class="btn glow" id="essay-go"${st.busy ? ' disabled' : ''}>${st.busy ? 'AI 老师正在看…' : '开始评分'}</button>` : ''}
            </div>
            ${st.dataUrl ? `<img class="essay-preview" src="${st.dataUrl}" alt="待评分的作文照片">`
              : '<div class="essay-empty">还没选图——点上面的按钮，把作文拍清楚一点（字要看得清）。</div>'}
            ${st.err ? `<p class="essay-err">${this._esc(st.err)}</p>` : ''}`}
          <input type="file" id="essay-file" accept="image/*" hidden>
        </div>`;

      el.querySelector('#essay-back').addEventListener('click', onBack);

      const fileEl = el.querySelector('#essay-file');
      const pick = el.querySelector('#essay-pick');
      if (pick) pick.addEventListener('click', () => fileEl.click());
      fileEl.addEventListener('change', async () => {
        const f = fileEl.files && fileEl.files[0];
        if (!f) return;
        try {
          st.dataUrl = await this._compress(f);
          st.err = '';
        } catch (e) {
          st.err = '这张图读不出来，换一张试试。';
        }
        draw();
      });

      const fullSel = el.querySelector('#essay-full');
      if (fullSel) fullSel.addEventListener('change', () => { st.full = Number(fullSel.value); });

      const go = el.querySelector('#essay-go');
      if (go) go.addEventListener('click', () => this._grade(st, draw));

      const again = el.querySelector('#essay-again');
      if (again) again.addEventListener('click', () => {
        st.dataUrl = ''; st.result = ''; st.parsed = null; st.err = '';
        draw();
      });
    };
    draw();
  },
};
