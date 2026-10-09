// 学习小游戏（阶段 3 §10.5：游戏即诊断，数据回流引擎）
// 每日速算 / 闪电心算 → 计算类知识点掌握度小步回流 + 粗心率记录
// 单词快闪 → 闪卡式记忆，答错的喂进间隔复习队列（wordQueue），下次到期再复习
// 红线（§10.6）：不做题兑换游戏时间；游戏是奖励性收尾，入口在每日计划完成后
// 速算题的分数工具（出题与判题共用，零依赖）
const ArithMath = {
  gcd(a, b) { while (b) { const t = a % b; a = b; b = t; } return a; },
  // 约分并保证分母为正：[分子, 分母]
  reduce(n, d) {
    if (d < 0) { n = -n; d = -d; }
    const g = this.gcd(Math.abs(n), d) || 1;
    return [n / g, d / g];
  },
  // 把「整数」或「a/b」解析为最简分数 [分子, 分母]；非法返回 null
  parseFrac(s) {
    const m = /^([+-]?\d+)\/([+-]?\d+)$/.exec(s);
    if (m) { const d = Number(m[2]); if (d === 0) return null; return this.reduce(Number(m[1]), d); }
    if (/^[+-]?\d+$/.test(s)) return this.reduce(Number(s), 1);
    return null;
  },
  // 归一化输入：去空白、全角符号转半角、正负号统一
  norm(s) {
    return String(s == null ? '' : s)
      .replace(/\s+/g, '')
      .replace(/＋/g, '+').replace(/[－−—]/g, '-').replace(/／/g, '/');
  },
};

const Games = {
  // 每日速算题：三类轮换，答案一律可自动判定（整数或最简分数 a/b）
  // 题型：有符号整数加减 / 乘方与去括号 / 分式四则
  makeArith() {
    const r = Math.random();
    if (r < 0.45) return this._arithAddSub();
    if (r < 0.72) return this._arithPowerBracket();
    return this._arithFraction();
  },

  // 负数加括号显示：(-8) + 5
  _showInt(n) { return n < 0 ? `(${n})` : `${n}`; },

  _arithAddSub() {
    const pick = () => { let n = 0; while (n === 0) n = Math.floor(Math.random() * 25) - 12; return n; };
    const a = pick(), b = pick();
    const op = Math.random() < 0.5 ? '+' : '-';
    const answer = op === '+' ? a + b : a - b;
    return { stem: `${this._showInt(a)} ${op} ${this._showInt(b)}`, answer: String(answer), kind: 'int' };
  },

  _arithPowerBracket() {
    const sup = { 2: '²', 3: '³', 4: '⁴' };
    if (Math.random() < 0.5) {
      const n = 2 + Math.floor(Math.random() * 3);        // 2..4 次方
      const base = 2 + Math.floor(Math.random() * 4);     // 底数 2..5
      const neg = Math.random() < 0.5;
      return { stem: `${neg ? `(${-base})` : base}${sup[n]}`, answer: String(Math.pow(neg ? -base : base, n)), kind: 'int' };
    }
    let a = 2 + Math.floor(Math.random() * 8), b = 2 + Math.floor(Math.random() * 8);
    if (a === b) b = a - 1;
    if (Math.random() < 0.5) return { stem: `-(${a} - ${b})`, answer: String(-(a - b)), kind: 'int' };
    const c = 2 + Math.floor(Math.random() * 4);
    return { stem: `-${c} × (${a} - ${b})`, answer: String(-c * (a - b)), kind: 'int' };
  },

  _arithFraction() {
    const dens = [2, 3, 4, 6];
    const rndFrac = () => { const d = dens[Math.floor(Math.random() * dens.length)]; return [1 + Math.floor(Math.random() * (d - 1)), d]; };
    const [a, b] = rndFrac(), [c, d] = rndFrac();
    const op = ['+', '-', '×', '÷'][Math.floor(Math.random() * 4)];
    let num, den;
    if (op === '+') { num = a * d + c * b; den = b * d; }
    else if (op === '-') { num = a * d - c * b; den = b * d; }
    else if (op === '×') { num = a * c; den = b * d; }
    else { num = a * d; den = b * c; }
    const [rn, rd] = ArithMath.reduce(num, den);
    return { stem: `${a}/${b} ${op} ${c}/${d}`, answer: rd === 1 ? String(rn) : `${rn}/${rd}`, kind: rd === 1 ? 'int' : 'frac' };
  },

  // 判题：整数与分数统一归一化后比较（接受 a/b 与等效分数，如 2/4 == 1/2）
  checkArith(userText, answerText) {
    const u = ArithMath.parseFrac(ArithMath.norm(userText));
    const a = ArithMath.parseFrac(ArithMath.norm(answerText));
    if (!u || !a) return false;
    return u[0] === a[0] && u[1] === a[1];
  },

  // 选择题版速算：正确答案 + 3 个干扰项打乱后返回
  // answer / kind 原样保留（判题与既有测试依赖），answerIndex 指向正确项
  makeArithChoice() {
    const q = this.makeArith();
    const opts = [q.answer, ...this._arithDistractors(q)];
    this._shuffle(opts);
    return { stem: q.stem, answer: q.answer, kind: q.kind, options: opts, answerIndex: opts.indexOf(q.answer) };
  },

  // 3 个与正确答案不等价的干扰项（整数取邻域；分数扰动分子分母 / 取倒数）
  _arithDistractors(q) {
    const [an, ad] = ArithMath.parseFrac(q.answer);
    const cands = ad === 1
      ? [an + 1, an - 1, an + 2, an - 2, an + 10, an - 10, -an].map(String)
      : [
          this._fmtFrac(an + 1, ad), this._fmtFrac(an - 1, ad),
          this._fmtFrac(an, ad + 1), this._fmtFrac(an, ad - 1),
          this._fmtFrac(ad, an), this._fmtFrac(an + 2, ad), this._fmtFrac(-an, ad),
        ];
    const out = [];
    for (const s of this._shuffle(cands.slice())) {
      if (out.length >= 3) break;
      if (!ArithMath.parseFrac(s)) continue;
      if (this.checkArith(s, q.answer)) continue;
      if (out.some(x => this.checkArith(x, s))) continue;
      out.push(s);
    }
    return out;
  },

  _fmtFrac(n, d) { const [rn, rd] = ArithMath.reduce(n, d); return rd === 1 ? String(rn) : `${rn}/${rd}`; },

  _shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },

  // 回流靶子：数学基础计算知识点（显式清单，覆盖有理数/整式/幂/分式/二次根式）
  ARITH_KP_IDS: [
    'm7-pr1',   // 有理数运算
    'm7-pr3',   // 整式加减
    'm8a-p24',  // 同底数幂的乘法
    'm8a-p25',  // 幂的乘方与积的乘方
    'm8a-p26',  // 整式的乘法
    'm8a-p33',  // 分式的乘除
    'm8a-p34',  // 分式的加减
    'm8b-p3',   // 二次根式的乘除
    'm8b-p4',   // 最简二次根式与化简
    'm8b-p5',   // 同类二次根式与加减
  ],

  computationKps() {
    const ids = new Set(this.ARITH_KP_IDS);
    return Store.knowledgePoints.filter(k => ids.has(k.id));
  },

  // 结算：正确率 ≥60% 才回流（+3 封顶 85，防止游戏灌水掌握度）；明细入 games
  // daily=true 表示「每日计划」里的正式速算，结果计入日统计（战报与完成标记读取）
  recordArith({ correct, total, avgMs, daily }, now) {
    const t = now || Date.now();
    const accuracy = total > 0 ? correct / total : 0;
    const bumped = [];
    if (accuracy >= 0.6) {
      const mastery = Store.mastery;
      for (const kp of this.computationKps()) {
        const m = mastery[kp.id] || Mastery.default();
        mastery[kp.id] = { ...m, score: Mastery.clamp(m.score + 3, 0, 85), lastReviewAt: t };
        bumped.push(kp.id);
      }
      Store.mastery = mastery;
    }
    const games = Store.games;
    games.push({ game: 'arith', correct, total, avgMs, accuracy: Math.round(accuracy * 100), at: t, bumped, daily: !!daily });
    Store.games = games;
    if (daily) Store.bumpDayStat(Store.todayKey(t), { arithRounds: 1, arithCorrect: correct, arithTotal: total });
    return { ok: true, accuracy: Math.round(accuracy * 100), bumped };
  },

  // 单词快闪题库：英语单选（4 选项）当闪卡（题干闪现 → 选项作答）
  flashPool() {
    return Store.questions.filter(q => q.subjectId === 'english' && q.type === 'single' && q.options && q.options.length >= 4);
  },

  // 开一局：取 5 道没进过复习队列的题（题库不足则有多少用多少）
  flashStart() {
    const inQueue = new Set(Store.wordQueue.map(w => w.questionId));
    const pool = this.flashPool().filter(q => !inQueue.has(q.id));
    const picked = pool.slice(0, 5);
    return { questions: picked };
  },

  // 答错：入复习队列，明天到期；答对不打扰
  flashMiss(questionId, now) {
    const t = now || Date.now();
    const q = Store.wordQueue;
    const ex = q.find(w => w.questionId === questionId);
    if (ex) { ex.wrongCount += 1; ex.dueAt = t + 2 * 86400000; }
    else q.push({ questionId, wrongCount: 1, dueAt: t + 86400000 });
    Store.wordQueue = q;
    return q.find(w => w.questionId === questionId);
  },

  // 到期复习队列（喂间隔复习调度器 §10.5）
  flashDue(now) {
    const t = now || Date.now();
    const qIdx = Store.questionIndex();
    return Store.wordQueue
      .filter(w => w.dueAt <= t && qIdx[w.questionId])
      .map(w => ({ ...w, question: qIdx[w.questionId] }));
  },

  // 复习作答：对 → 移出队列；错 → 次数+1、再等 2 天
  flashReview(questionId, correct, now) {
    const t = now || Date.now();
    let q = Store.wordQueue;
    if (correct) {
      q = q.filter(w => w.questionId !== questionId);
      Store.wordQueue = q;
      return true;
    }
    const ex = q.find(w => w.questionId === questionId);
    if (ex) { ex.wrongCount += 1; ex.dueAt = t + 2 * 86400000; Store.wordQueue = q; }
    return false;
  },
};
