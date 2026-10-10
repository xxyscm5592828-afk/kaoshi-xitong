// 入学摸底：首次使用某科目时，用少量探针题校准初始掌握度（替代 default() 的 50 分「未知」）
// 探针骨架：数学科 = 七年级根基点（有理数/方程/整式/坐标系，对应计算能力诊断）+ 每章 1 道权重最高代表题；
// 其他科目 = 结构根点（先修链被依赖最多的叶点）+ 每章 1 道权重最高代表题。
// 答完直接设定掌握度，不做自适应下钻——diagnose() 自会沿先修链找根因。
const Placement = {
  // 数学科根基探针（七年级先修回溯点，硬依赖链的根）；m7-pr5 平行线对八上依赖低，不占题量
  ROOT_KPS: ['m7-pr1', 'm7-pr2', 'm7-pr3', 'm7-pr4'],

  needed(subjectId) {
    const p = Store.placement;
    return !p.done[subjectId] && !(p.dismissed || {})[subjectId];
  },

  // 跳过引导：记一笔「这科不摸底了」并持久化（刷新不再反复弹）；区别于 done（真正做过摸底）
  dismiss(subjectId) {
    const p = Store.placement;
    p.dismissed = { ...(p.dismissed || {}), [subjectId]: true };
    Store.placement = p;
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

  // 结构根点：被最多叶点沿先修链依赖的叶点（先修链的根）——非数学科用它自动识别摸底骨架
  // （seen 防环 + 防重复计数；只统计「有题」的叶点，保证选出来必能出题）
  _structureRoots(subjectId, limit) {
    const idx = Store.kpIndex();
    const leaves = Store.knowledgePoints.filter(k =>
      k.subjectId === subjectId && k.level === 4 && this.hasQuestion(k.id));
    const leafIds = new Set(leaves.map(k => k.id));
    const dependents = {};
    for (const leaf of leaves) {
      const seen = new Set();
      const stack = [...(leaf.prerequisites || [])];
      while (stack.length) {
        const id = stack.pop();
        if (seen.has(id)) continue;
        seen.add(id);
        if (leafIds.has(id)) dependents[id] = (dependents[id] || 0) + 1;
        const kp = idx[id];
        if (kp && kp.prerequisites) stack.push(...kp.prerequisites);
      }
    }
    return Object.keys(dependents)
      .sort((a, b) => dependents[b] - dependents[a])
      .slice(0, limit);
  },

  // 探针点规划：结构根点在前 + 每章 1 道权重最高代表题
  // 数学 = 4 手写根基点 + 5 章 = 9 题（两册章节多，不设上限会膨胀）；其他科 = 最多 3 结构根点 + 补章到共 5 题
  probePlan(subjectId) {
    const idx = Store.kpIndex();
    const chapterOf = kp => {
      for (let cur = kp; cur; cur = idx[cur.parentId]) {
        if (cur.level === 2) return cur.id;
      }
      return null;
    };
    const roots = subjectId === 'math' ? this.ROOT_KPS : this._structureRoots(subjectId, 3);
    const picked = [];
    const usedChapters = new Set();
    for (const id of roots) {
      const kp = idx[id];
      if (!kp || kp.subjectId !== subjectId || !this.hasQuestion(id)) continue;
      picked.push(id);
      const ch = chapterOf(kp);
      if (ch) usedChapters.add(ch);
    }
    const chapterBudget = subjectId === 'math' ? 5 : Math.max(0, 5 - picked.length);
    const chapters = Store.knowledgePoints
      .filter(k => k.subjectId === subjectId && k.level === 2 && !usedChapters.has(k.id))
      .sort((a, b) => (b.weight || 3) - (a.weight || 3))
      .slice(0, chapterBudget);
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
  // mid：诊断测试取中等偏上难度（摸底取最低，定位不挑战）
  _probeQuestion(kpId, mid) {
    const pool = Store.questions.filter(q => q.knowledgePointId === kpId && q.type !== 'subjective');
    if (pool.length === 0) return null;
    pool.sort((a, b) => a.difficulty - b.difficulty);
    if (mid) return pool[Math.ceil((pool.length - 1) / 2)];
    return pool[0];
  },

  // ===== 学课摸底分析测试：分层抽样约 20 题（章均衡 + 认知层多样 + 跳过已点亮点）=====
  // 候选 = 该科有题 L4 叶点且有效掌握度 <85（已点亮的不再测，避免越测越低）；每章保底 1 题，
  // 剩余名额按章重要度（章下候选叶点 weight 之和）贪心分配，章内按「高频考点 > 易错 > weight」排序，
  // 两轮选取保证 bloom 多样性；每叶点最多 1 题。
  analysisPlan(subjectId) {
    const idx = Store.kpIndex();
    const now = Date.now();
    const TARGET = 20;
    const tagScore = kp => ((kp.tags || []).includes('高频考点') ? 2 : 0) + ((kp.tags || []).includes('易错') ? 1 : 0);
    const candidates = Store.knowledgePoints.filter(k =>
      k.subjectId === subjectId && k.level === 4 && this.hasQuestion(k.id)
      && Mastery.decay(Store.mastery[k.id] || Mastery.default(), now).score < 85);
    if (candidates.length === 0) return [];
    const chapterOf = kp => {
      for (let cur = kp; cur; cur = idx[cur.parentId]) if (cur.level === 2) return cur.id;
      return null;
    };
    const byChapter = {};
    for (const kp of candidates) {
      const ch = chapterOf(kp);
      if (!ch) continue;
      (byChapter[ch] = byChapter[ch] || []).push(kp);
    }
    const chapters = Object.keys(byChapter).map(chId => ({
      id: chId,
      kps: byChapter[chId],
      weight: byChapter[chId].reduce((s, k) => s + (k.weight || 3), 0),
    })).sort((a, b) => b.weight - a.weight);
    if (chapters.length === 0) return [];
    // 每章保底 1 题；剩余名额贪心分配给「weight 大且未满」的章（章容量 = 候选叶点数）
    const quota = {}, cap = {};
    for (const c of chapters) { quota[c.id] = 1; cap[c.id] = c.kps.length; }
    let remaining = TARGET - chapters.length;
    while (remaining > 0) {
      let best = null;
      for (const c of chapters) {
        if (quota[c.id] >= cap[c.id]) continue;
        if (!best || c.weight > best.weight || (c.weight === best.weight && quota[c.id] < quota[best.id])) best = c;
      }
      if (!best) break;
      quota[best.id] += 1;
      remaining -= 1;
    }
    const picked = [];
    for (const c of chapters) {
      const kps = c.kps.slice().sort((a, b) => (tagScore(b) * 10 + (b.weight || 3)) - (tagScore(a) * 10 + (a.weight || 3)));
      const n = quota[c.id];
      const chosen = [];
      const usedBloom = new Set();
      for (const kp of kps) { // 第一轮：每 bloom 各取 1
        if (chosen.length >= n) break;
        const b = kp.bloom || '应用';
        if (usedBloom.has(b)) continue;
        chosen.push(kp); usedBloom.add(b);
      }
      for (const kp of kps) { // 第二轮：补足剩余名额
        if (chosen.length >= n) break;
        if (chosen.includes(kp)) continue;
        chosen.push(kp);
      }
      for (const kp of chosen) picked.push(kp.id);
    }
    return picked;
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

  // ===== 学课摸底分析测试会话：与 Placement 同名接口，便于 App 复用答题 UI（按 this._flow 切换引擎）=====
  diag: {
    build(subjectId) {
      const order = [];
      for (const kpId of Placement.analysisPlan(subjectId)) {
        const q = Placement._probeQuestion(kpId, true);
        if (q) order.push(q.id);
      }
      if (order.length === 0) return null;
      const p = Store.placement;
      p.diag = { subjectId, order, idx: 0, results: [] };
      Store.placement = p;
      return p.diag;
    },
    current() {
      const d = Store.placement.diag;
      if (!d || d.idx >= d.order.length) return null;
      return Store.questionIndex()[d.order[d.idx]] || null;
    },
    progress() {
      const d = Store.placement.diag;
      return { pos: d ? d.idx + 1 : 0, total: d ? d.order.length : 0 };
    },
    // 单题记分：纯诊断只记录作答结果，不落 mastery / attempts（不碰孩子的学习数据）
    record(question, correct, actualTime) {
      const p = Store.placement;
      p.diag.idx += 1;
      p.diag.results.push({ questionId: question.id, correct, actualTime });
      Store.placement = p;
    },
    finish() {
      const p = Store.placement;
      const d = p.diag;
      if (!d) return null;
      p.diag = null;
      Store.placement = p;
      return {
        subjectId: d.subjectId,
        correctCount: d.results.filter(r => r.correct).length,
        total: d.results.length,
        results: d.results,
        weakKps: d.results.filter(r => !r.correct).map(r => Store.questionIndex()[r.questionId].knowledgePointId),
      };
    },
  },
};
