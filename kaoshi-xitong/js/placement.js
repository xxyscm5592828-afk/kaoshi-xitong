// 入学摸底：首次使用某科目时，用少量探针题校准初始掌握度（替代 default() 的 50 分「未知」）
// 探针骨架：数学科 = 七年级根基点（有理数/方程/整式/坐标系，对应计算能力诊断）+ 每章 1 道权重最高代表题；
// 其他科目 = 每章 1 道权重最高代表题。答完直接设定掌握度，不做自适应下钻——diagnose() 自会沿先修链找根因。
const Placement = {
  // 数学科根基探针（七年级先修回溯点，硬依赖链的根）；m7-pr5 平行线对八上依赖低，不占题量
  ROOT_KPS: ['m7-pr1', 'm7-pr2', 'm7-pr3', 'm7-pr4'],

  needed(subjectId) {
    return !Store.placement.done[subjectId];
  },

  hasQuestion(kpId) {
    return Store.questions.some(q => q.knowledgePointId === kpId);
  },

  // 沿 parent 链判断叶点是否挂在指定 L2 章下
  _under(kp, chapterId) {
    const idx = Store.kpIndex();
    for (let cur = kp; cur; cur = idx[cur.parentId]) {
      if (cur.id === chapterId) return true;
    }
    return false;
  },

  // 探针点规划：根基点在前 + 每科最多 5 个章（按章权重）各出 1 道权重最高代表题
  // （数学两册章节多，不设上限摸底会膨胀到 14 题；5 章 + 4 根基 = 9 题约 6 分钟）
  probePlan(subjectId) {
    const idx = Store.kpIndex();
    const chapterOf = kp => {
      for (let cur = kp; cur; cur = idx[cur.parentId]) {
        if (cur.level === 2) return cur.id;
      }
      return null;
    };
    const picked = [];
    const usedChapters = new Set();
    for (const id of (subjectId === 'math' ? this.ROOT_KPS : [])) {
      const kp = idx[id];
      if (!kp || kp.subjectId !== subjectId || !this.hasQuestion(id)) continue;
      picked.push(id);
      const ch = chapterOf(kp);
      if (ch) usedChapters.add(ch);
    }
    const chapters = Store.knowledgePoints
      .filter(k => k.subjectId === subjectId && k.level === 2 && !usedChapters.has(k.id))
      .sort((a, b) => (b.weight || 3) - (a.weight || 3))
      .slice(0, 5);
    for (const ch of chapters) {
      const leaves = Store.knowledgePoints.filter(k =>
        k.subjectId === subjectId && k.level === 4 && this._under(k, ch.id) && this.hasQuestion(k.id));
      if (leaves.length === 0) continue;
      leaves.sort((a, b) => (b.weight || 3) - (a.weight || 3));
      picked.push(leaves[0].id);
    }
    return picked;
  },

  // 探针题：该点题池取难度最低的（摸底是定位不是挑战）；主观题不进摸底（无法自动判分）
  _probeQuestion(kpId) {
    const pool = Store.questions.filter(q => q.knowledgePointId === kpId && q.type !== 'subjective');
    if (pool.length === 0) return null;
    pool.sort((a, b) => a.difficulty - b.difficulty);
    return pool[0];
  },

  // 生成摸底会话（若挂着别的科目的进行中会话则直接覆盖，已写掌握度保留）；无可出题返回 null
  build(subjectId) {
    const order = [];
    for (const kpId of this.probePlan(subjectId)) {
      const q = this._probeQuestion(kpId);
      if (q) order.push(q.id);
    }
    if (order.length === 0) return null;
    const p = Store.placement;
    p.active = { subjectId, order, idx: 0, results: [] };
    Store.placement = p;
    return p.active;
  },

  // 当前题（会话进行中）
  current() {
    const active = Store.placement.active;
    if (!active || active.idx >= active.order.length) return null;
    return Store.questionIndex()[active.order[active.idx]] || null;
  },

  progress() {
    const active = Store.placement.active;
    return { pos: active ? active.idx + 1 : 0, total: active ? active.order.length : 0 };
  },

  // 单题记分：设定掌握度 + 写作答明细（不进错题本：D3 原题重做会背答案，薄弱点由低掌握度驱动调度覆盖）
  record(question, correct, actualTime, now) {
    const fast = question.expectedTime > 0 ? actualTime / question.expectedTime <= 0.5 : false;
    Store.mastery = { ...Store.mastery, [question.knowledgePointId]: Mastery.applyPlacement(correct, fast, now) };
    const attempts = Store.attempts;
    attempts.push({
      id: 'a' + now.toString(36) + Math.random().toString(36).slice(2, 6),
      questionId: question.id,
      knowledgePointId: question.knowledgePointId,
      correct, actualTime, timestamp: now,
      errorType: null, closureType: null,
    });
    Store.attempts = attempts;
    const p = Store.placement;
    p.active.idx += 1;
    p.active.results.push({ questionId: question.id, correct });
    Store.placement = p;
  },

  // 结束：标记完成并返回结果概览
  finish() {
    const p = Store.placement;
    const active = p.active;
    if (!active) return null;
    const qIdx = Store.questionIndex();
    const weakKps = active.results.filter(r => !r.correct).map(r => qIdx[r.questionId].knowledgePointId);
    p.done = { ...p.done, [active.subjectId]: true };
    // 弱点清单留档：今日计划的「回炉卡」按它显性带学生补（补到掌握度上来才淡出）
    p.weak = { ...(p.weak || {}), [active.subjectId]: weakKps };
    p.active = null;
    Store.placement = p;
    return {
      subjectId: active.subjectId,
      correctCount: active.results.filter(r => r.correct).length,
      total: active.results.length,
      weakKps,
    };
  },
};
