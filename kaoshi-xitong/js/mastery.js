// 掌握度引擎 v2：正确率 + 用时 + 指数遗忘 三维度诊断（本地确定性算法，不依赖网络）
// 规则来源：开发文档 §5
const Mastery = {
  clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); },

  // 初始掌握度（未做过题的知识点默认 50，表示「未知」）
  default() {
    return {
      score: 50,
      lastReviewAt: Date.now(),
      reviewCount: 0,
      correctStreak: 0,
      fastStreak: 0,
      wrongStreak: 0,
      interval: 1,        // 自适应复习间隔（天）
    };
  },

  // 作答更新。correct: boolean；actualTime/expectedTime 单位为秒；now: 时间戳
  apply(m, correct, actualTime, expectedTime, now) {
    const r = expectedTime > 0 ? actualTime / expectedTime : 1;
    const fast = r <= 0.5;
    const slow = r > 1.5;
    let score;
    if (correct) {
      if (fast) score = m.score + 15;          // 熟练/自动化
      else if (!slow) score = m.score + 8;     // 已会
      else score = m.score + 2;                // 会但不熟练/疑似蒙对
    } else {
      // 连续答错扣分衰减：20 × 0.8^已连错次数（防一次失误毁积累）
      score = m.score - 20 * Math.pow(0.8, m.wrongStreak || 0);
    }

    // 自适应间隔（SM-2 式）：快对×2.0 / 慢对×1.3 / 错重置 1 天
    let interval;
    if (!correct) interval = 1;
    else if (r <= 1) interval = (m.interval || 1) * 2.0;
    else interval = (m.interval || 1) * 1.3;

    return {
      score: this.clamp(score, 0, 100),
      lastReviewAt: now,
      reviewCount: m.reviewCount + 1,
      correctStreak: correct ? m.correctStreak + 1 : 0,
      fastStreak: (correct && fast) ? m.fastStreak + 1 : 0,
      wrongStreak: correct ? 0 : (m.wrongStreak || 0) + 1,
      interval,
    };
  },

  // 错题销号回写：原题重做通过 +5，变式通过 +8；不通过不额外扣分（D0 已扣过）
  applyClosure(m, passed, bonus, now) {
    const score = passed ? this.clamp((m.score + bonus), 0, 100) : m.score;
    return {
      ...m,
      score,
      lastReviewAt: now,
      reviewCount: m.reviewCount + 1,
      correctStreak: passed ? m.correctStreak + 1 : 0,
      fastStreak: passed ? m.fastStreak : 0,
      wrongStreak: passed ? 0 : (m.wrongStreak || 0) + 1,
    };
  },

  // 摸底设定：不做增量更新，直接按实测设定初始掌握度（替代 default() 的 50 分「未知」）
  // 对且快（用时≤一半预期）=80 / 对=75；错且慢（真不会）=25 走回炉，错且快（疑似手滑/乱猜）=45 留池继续验
  applyPlacement(correct, fast, now) {
    const score = correct ? (fast ? 80 : 75) : (fast ? 45 : 25);
    return {
      score,
      lastReviewAt: now,
      reviewCount: 0,
      correctStreak: correct ? 1 : 0,
      fastStreak: correct && fast ? 1 : 0,
      wrongStreak: correct ? 0 : 1,
      interval: 1,
    };
  },

  // 指数遗忘：半衰期 = 2 × 1.8^reviewCount 天；复习越多忘得越慢
  halfLife(m) { return 2 * Math.pow(1.8, m.reviewCount || 0); },

  decay(m, now) {
    const days = (now - m.lastReviewAt) / 86400000;
    if (days <= 0) return m;
    const score = m.score * Math.pow(0.5, days / this.halfLife(m));
    return { ...m, score: this.clamp(score, 0, 100) };
  },

  // 已掌握：分数高且连续多次快速答对
  isMastered(m) { return m.score >= 85 && m.fastStreak >= 2; },

  // 抽题优先级 = (100-score)×0.7 + 遗忘压力×0.3，×weight；
  // 60≤score<85 为提分最快区间（ROI ×1.5）；score<30 顽固点剔除出练习池（回炉重学）
  priority(m, kp, now) {
    const score = m.score;
    if (score < 30) return -Infinity;
    const days = Math.max(0, (now - m.lastReviewAt) / 86400000); // 负天数钳为 0（防御未来时间戳）
    const forgetPressure = 100 * (1 - Math.pow(0.5, days / this.halfLife(m)));
    let p = (100 - score) * 0.7 + forgetPressure * 0.3;
    p *= (kp.weight || 3);
    if (score >= 60 && score < 85) p *= 1.5;
    return p;
  },

  // 溯源诊断：短板点沿先修链向上找根因（先修实测 <70 视为不够牢）
  // kpIndex: { id → 知识点节点 }；返回 { root, chain, depth }
  // depth > 2 → needsRelearn，建议回炉重学而不是刷题
  diagnose(kp, masteryMap, kpIndex) {
    const scoreOf = id => {
      const m = masteryMap[id];
      return m ? m.score : 50;
    };
    const walk = (node, chain, depth) => {
      if (scoreOf(node.id) >= 60) return { root: node, chain, depth };
      for (const pid of (node.prerequisites || [])) {
        const pm = masteryMap[pid];
        // 只对「实测弱」的先修下钻；未测（无记录）不因默认 50 误判，避免全新数据整条先修链被误判为需回炉
        if (pm && pm.score < 70 && kpIndex[pid]) {
          return walk(kpIndex[pid], chain.concat(kpIndex[pid]), depth + 1);
        }
      }
      return { root: node, chain, depth };
    };
    return walk(kp, [kp], 0);
  },

  needsRelearn(diag) { return diag.depth > 2; },
};
