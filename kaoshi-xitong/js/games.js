// 学习小游戏（阶段 3 §10.5：游戏即诊断，数据回流引擎）
// 闪电心算 60s → 计算类知识点掌握度小步回流 + 粗心率记录
// 单词快闪 → 闪卡式记忆，答错的喂进间隔复习队列（wordQueue），下次到期再复习
// 红线（§10.6）：不做题兑换游戏时间；游戏是奖励性收尾，入口在每日计划完成后
const Games = {
  // 心算题：两位数 ± 一位数 / 个位×个位（最小数字，贴近初二心智）
  makeArith() {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, answer;
    if (op === '×') { a = 2 + Math.floor(Math.random() * 9); b = 2 + Math.floor(Math.random() * 9); answer = a * b; }
    else {
      a = 11 + Math.floor(Math.random() * 89);
      b = 1 + Math.floor(Math.random() * 9);
      if (op === '-' && b > a % 10) { const t = a; a = b; b = t % 10; }
      answer = op === '+' ? a + b : a - b;
    }
    return { stem: `${a} ${op} ${b}`, answer };
  },

  // 计算类知识点：数学 L4 中名称含「计算/运算」的叶子（闪电心算回流目标）
  computationKps() {
    return Store.knowledgePoints.filter(k =>
      k.subjectId === 'math' && k.level === 4 && /(计算|运算)/.test(k.name));
  },

  // 60s 结束结算：正确率 ≥60% 才回流（+3 封顶 85，防止游戏灌水掌握度）；明细入 games
  recordArith({ correct, total, avgMs }, now) {
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
    games.push({ game: 'arith', correct, total, avgMs, accuracy: Math.round(accuracy * 100), at: t, bumped });
    Store.games = games;
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
