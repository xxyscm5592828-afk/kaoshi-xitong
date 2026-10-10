// 背诵默写打卡：每天 5 个快打（古诗文默写 / 政治金句 / 英语词汇），每日 30 分钟套餐的第二段
// 效率优先：打开就打、打完就走；同一天题目集合稳定（日期做种子确定性挑选），跨天换新
// 打卡记录存 Store.recite = { [dateKey]: { items: { qid: { ok, at } } } }
const Recite = {
  TARGET: 5, // 每天目标数
  PER_SUBJECT: 3, // 每科至多 3 个

  // 确定性哈希（FNV-1a）：hash(dateKey + qid) 排序，同一天重复打开题目集合不变
  _hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  },

  // 判分归一化：去空格、去标点、忽略大小写
  _normalize(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  },

  // 默写科目优先序：语文 0 → 道德与法治 1 → 英语 2；其余科目不参与
  _subjectRank(subjectId) {
    const sid = String(subjectId || '');
    if (sid.indexOf('chinese') >= 0) return 0;
    if (sid.indexOf('politics') >= 0) return 1;
    if (sid.indexOf('english') >= 0) return 2;
    return -1;
  },

  // 词汇类叶子：叶子自身或祖先（词汇线 / 核心词汇）名称或 tags 含「词汇/单词/vocabulary」
  _isVocabKp(kpId) {
    const idx = Store.kpIndex();
    let node = idx[kpId];
    while (node) {
      const text = (node.name || '') + ' ' + (node.tags || []).join(' ');
      if (/词汇|单词|vocabulary/i.test(text)) return true;
      node = node.parentId ? idx[node.parentId] : null;
    }
    return false;
  },

  // 提示：中文按字数给首字，英文按字母数给首字母
  _hintOf(answer) {
    const ans = String(answer == null ? '' : answer);
    if (/[一-鿿]/.test(ans)) return `共 ${ans.replace(/\s/g, '').length} 字 · 首字「${ans.trim()[0]}」`;
    return `共 ${ans.replace(/\s/g, '').length} 个字母 · 首字母 ${ans.trim()[0].toUpperCase()}`;
  },

  // 候选池：语文/政治 fill 题（古诗文默写、金句）；英语 fill 不足时可用词汇叶子的 single 题改默写
  _candidates() {
    const subs = Store.subjects;
    const nameOf = sid => (subs.find(s => s.id === sid) || {}).name || '';
    const out = [];
    for (const q of Store.questions) {
      const rank = this._subjectRank(q.subjectId);
      if (rank < 0) continue;
      if (q.type === 'fill' && typeof q.answer === 'string') {
        out.push({ rank, qid: q.id, subjectName: nameOf(q.subjectId), stem: '📝 ' + q.stem, answer: q.answer, hint: this._hintOf(q.answer) });
      } else if (rank === 2 && q.type === 'single' && Array.isArray(q.options)
        && q.options[q.answer] != null && this._isVocabKp(q.knowledgePointId)) {
        // 英语词汇题改成默写：去选项，答案取 options[answer]
        const ans = q.options[q.answer];
        out.push({ rank, qid: q.id, subjectName: nameOf(q.subjectId), stem: '📝 ' + q.stem, answer: ans, hint: this._hintOf(ans) });
      }
    }
    return out;
  },

  // 当天题目集合：各科组内按 hash(dateKey + qid) 排序，语文→政治→英语轮取，每科至多 3、总数 5（不足不硬凑）
  _pickItems(dateKey) {
    const groups = [[], [], []];
    for (const c of this._candidates()) groups[c.rank].push(c);
    for (const g of groups) g.sort((a, b) => this._hash(dateKey + a.qid) - this._hash(dateKey + b.qid));
    const out = [];
    const cap = [0, 0, 0];
    for (let round = 0; out.length < this.TARGET; round++) {
      let took = false;
      for (let r = 0; r < 3 && out.length < this.TARGET; r++) {
        const c = groups[r][round];
        if (!c || cap[r] >= this.PER_SUBJECT) continue;
        cap[r] += 1;
        took = true;
        out.push({ qid: c.qid, subjectName: c.subjectName, stem: c.stem, answer: c.answer, hint: c.hint });
      }
      if (!took) break;
    }
    return out;
  },

  // 每天 5 个快打题（同一天稳定，跨天换新）
  todayItems(now) {
    return this._pickItems(Store.todayKey(now));
  },

  // 记一次打卡（不管对错都算打过，ok 记录对错）
  record(qid, ok, now) {
    const key = Store.todayKey(now);
    const all = Store.recite;
    const day = all[key] || { items: {} };
    day.items[qid] = { ok: !!ok, at: now || Date.now() };
    all[key] = day;
    Store.recite = all;
  },

  // 当天进度：已完成数 / 目标数
  progress(now) {
    const day = Store.recite[Store.todayKey(now)] || { items: {} };
    return { done: Object.keys(day.items).length, total: this.TARGET };
  },

  // 某天是否算打卡日：当天题目全部打完（题目不足 5 个时有多少打多少）
  _dayDone(dateKey, rec) {
    const items = (rec[dateKey] || { items: {} }).items || {};
    const total = this._pickItems(dateKey).length;
    return total > 0 && Object.keys(items).length >= Math.min(this.TARGET, total);
  },

  // 连续打卡天数（今天没打完不算今天，从昨天往回数）
  streak(now) {
    const rec = Store.recite;
    const d = new Date(now || Date.now());
    if (!this._dayDone(Store.todayKey(d.getTime()), rec)) d.setDate(d.getDate() - 1);
    let n = 0;
    for (let i = 0; i < 365; i++) {
      const key = Store.todayKey(d.getTime());
      if (!this._dayDone(key, rec)) break;
      n += 1;
      d.setDate(d.getDate() - 1);
    }
    return n;
  },

  // 音效防御：无 Sound（单测环境）时静默跳过
  _sfx(name) {
    if (typeof Sound !== 'undefined' && Sound && Sound.play) Sound.play(name);
  },

  // UI：逐个默写 → 输入答案 → 判对错 → 下一个 → 完成页；onExit() 返回（退出与收工都走它）
  render(el, onExit) {
    const quit = () => { if (onExit) onExit(); };
    const now = Date.now();
    const items = this.todayItems(now);
    const doneMap = (Store.recite[Store.todayKey(now)] || { items: {} }).items || {};
    const todo = items.filter(it => !doneMap[it.qid]);

    if (items.length === 0) {
      el.innerHTML = `
        <div class="card">
          <h2>📖 背诵默写</h2>
          <div class="empty">题库里还没有可默写的题（语文/政治填空、英语词汇）。</div>
          <div class="session-actions"><button class="btn" id="recite-quit">收工</button></div>
        </div>`;
      el.querySelector('#recite-quit').addEventListener('click', quit);
      return;
    }
    if (todo.length === 0) return this._finish(el, Date.now(), quit);

    let idx = 0;
    const renderQ = () => {
      const it = todo[idx];
      el.innerHTML = `
        <div class="card hero">
          <div class="learn-head"><h2>📖 背诵默写 <span class="muted">${idx + 1}/${todo.length} · ${it.subjectName}</span></h2><button class="btn secondary small" id="recite-quit">退出</button></div>
          <div class="stem">${it.stem}</div>
          <div class="muted"><button class="btn secondary small" id="recite-hint">💡 提示</button> <span id="recite-hint-text" hidden>${it.hint}</span></div>
          <input class="text-input" id="recite-input" placeholder="默写答案，回车提交" autocomplete="off">
          <div class="session-actions">
            <button class="btn" id="recite-submit">提交</button>
          </div>
          <div id="recite-zone"></div>
        </div>`;
      el.querySelector('#recite-quit').addEventListener('click', quit);
      el.querySelector('#recite-hint').addEventListener('click', () => {
        const t = el.querySelector('#recite-hint-text');
        if (t) t.hidden = false;
      });
      const input = el.querySelector('#recite-input');
      input.focus();
      const submit = () => {
        const val = (input.value || '').trim();
        if (!val) { input.focus(); return; }
        const ok = this._normalize(val) === this._normalize(it.answer);
        this.record(it.qid, ok, Date.now());
        this._sfx(ok ? 'coin' : 'wrong');
        if (idx >= todo.length - 1) { this._finish(el, Date.now(), quit); return; }
        el.querySelector('#recite-zone').innerHTML =
          (ok ? '<div class="result good">✅ 对了</div>'
            : `<div class="result bad">❌ 正确答案是 <strong>${it.answer}</strong></div>`)
          + '<div class="session-actions"><button class="btn" id="recite-next">下一题 →</button></div>';
        const next = el.querySelector('#recite-next');
        next.addEventListener('click', () => { idx += 1; renderQ(); });
        next.focus();
      };
      el.querySelector('#recite-submit').addEventListener('click', submit);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    };
    renderQ();
  },

  // 完成页：今天 X/5 · 连续 N 天，「收工」走 onExit
  _finish(el, now, quit) {
    const p = this.progress(now);
    this._sfx('done');
    el.innerHTML = `
      <div class="card hero">
        <h2>📖 背诵默写 · 打卡完成</h2>
        <p>今天 ${p.done}/${p.total} ✅ · 连续 ${this.streak(now)} 天</p>
        <div class="muted">收工——明天再来 5 分钟。</div>
        <div class="session-actions"><button class="btn" id="recite-finish">收工</button></div>
      </div>`;
    el.querySelector('#recite-finish').addEventListener('click', quit);
  },
};
