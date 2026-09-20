// 练习流程 v2：关卡化 session（热身-突破-必对收尾）+ S/A/B/C 评级 + 连击 + 连错降难度
// 规则来源：开发文档 §5 §7.3 §10.2 §10.3 §11.7
const Quiz = {
  // 速度评级：S(r≤0.5) / A(r≤1) / B(r≤1.5) / C —— 「离 S 级还差一点」
  rate(actualTime, expectedTime) {
    const r = expectedTime > 0 ? actualTime / expectedTime : 1;
    if (r <= 0.5) return 'S';
    if (r <= 1) return 'A';
    if (r <= 1.5) return 'B';
    return 'C';
  },

  // 填空判分归一：全角→半角、去空白、忽略大小写、上标与常见符号等价（ISSUE-005）
  _normFill(s) {
    const sup = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    return String(s == null ? '' : s)
      .replace(/[\uFF01-\uFF5E]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
      .replace(/\u3000/g, ' ')
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, c => '^' + sup.indexOf(c))
      .replace(/[×∗·⋅]/g, '*')
      .replace(/[÷∕]/g, '/')
      .replace(/[−–—]/g, '-')
      .replace(/\s+/g, '')
      .toLowerCase();
  },

  // 判分：客观题 true/false；主观题 null（自评流程）
  grade(question, answer) {
    switch (question.type) {
      case 'single':
      case 'judge':
        return Number(answer) === Number(question.answer);
      case 'multi': {
        const a = (Array.isArray(answer) ? answer : [answer]).map(Number).sort().join(',');
        const b = (Array.isArray(question.answer) ? question.answer : [question.answer]).map(Number).sort().join(',');
        return a === b;
      }
      case 'fill':
        return this._normFill(answer) === this._normFill(question.answer);
      case 'subjective':
        return null;
      default:
        return false;
    }
  },

  // 当前科目：取持久化的 activeSubjectId，缺省回落到第一个科目
  subjectId() {
    const sid = Store.activeSubjectId;
    if (sid) return sid;
    const def = Store.subjects.find(s => s.default) || Store.subjects[0];
    return def ? def.id : '';
  },

  // 单元范围（§需求2）：当前科目选了册/单元/节时，返回其下全部 L4 叶 id 集合；未选（不限）返回 null
  // 粒度由细到粗：节 > 单元 > 册；悬赏重做/变式/专项练不适用
  unitKpIds() {
    const scope = Store.unitScope[this.subjectId()];
    const rootId = scope && (scope.sectionId || scope.chapterId || scope.bookId);
    if (!rootId) return null;
    const kpIndex = Store.kpIndex();
    if (!kpIndex[rootId]) return null;
    const ids = new Set();
    for (const kp of Store.knowledgePoints) {
      if (kp.level !== 4) continue;
      for (let cur = kp; cur; cur = kpIndex[cur.parentId]) {
        if (cur.id === rootId) { ids.add(kp.id); break; }
      }
    }
    return ids;
  },

  // 关卡化 session：热身（到期悬赏）→ 突破 → 交错 → 必对收尾，共 6 题
  // 每日题池配比（阶段 3 §13.2 调度巅峰）：悬赏 20% + 突破 40% + 交错 40%（±1 题取整）
  planSession(now) {
    const sid = this.subjectId();
    const due = Wrongbook.due(now);
    const retests = due.retests.filter(r => r.subjectId === sid);
    const variants = due.variants.filter(r => r.subjectId === sid);
    const stages = [];
    if (retests.length > 0) stages.push({ type: 'retest', recordId: retests[0].id });
    if (variants.length > 0) stages.push({ type: 'variant', recordId: variants[0].id });
    // 剩 5 题（含必对收尾）按 40/40 分给突破与交错
    const rest = 5 - stages.length;
    const breakCount = Math.ceil(rest / 2);
    const interleaveCount = rest - breakCount;
    for (let i = 0; i < breakCount; i++) stages.push({ type: 'breakthrough' });
    for (let i = 0; i < interleaveCount; i++) stages.push({ type: 'interleave' });
    stages.push({ type: 'safe' });
    return { stages, total: this._countServable(stages, now), idx: 0, combo: 0, maxCombo: 0, wrongStreak: 0, usedQuestionIds: [], results: [] };
  },

  // 试跑一遍关卡，数出本组实际能出几题：题池不足时题头/进度点按实际题量显示（ISSUE-004）
  _countServable(stages, now) {
    const sim = { stages: [], idx: 0, combo: 0, maxCombo: 0, wrongStreak: 0, usedQuestionIds: [], results: [] };
    let n = 0;
    for (const st of stages) {
      sim.stages = [st];
      const q = this.questionFor(sim, now);
      if (!q) continue;
      sim.usedQuestionIds.push(q.id);
      n += 1;
    }
    return n;
  },

  // 专项练 session（学习页「学完就练」/ 结算页「一键开练」）：先攻单点，本点题量不足以凑满一组时
  // 用同科高优先级知识点交错补足，保证一组仍有 6 题（单点题少时不再只出 3 题）
  planFocusSession(kpId) {
    const kp = Store.kpIndex()[kpId];
    if (!kp || kp.level !== 4) return null;
    Store.activeSubjectId = kp.subjectId;
    const pool = Store.questions.filter(q => q.knowledgePointId === kpId);
    if (pool.length === 0) return null;
    const focusCount = Math.min(4, pool.length);
    const stages = [];
    for (let i = 0; i < focusCount; i++) stages.push({ type: 'breakthrough', kpId });
    while (stages.length < 5) stages.push({ type: 'interleave' });
    stages.push({ type: 'safe' });
    return { stages, total: this._countServable(stages, Date.now()), idx: 0, combo: 0, maxCombo: 0, wrongStreak: 0, usedQuestionIds: [], results: [] };
  },

  // 专项练时间预估（Part B②）：按 planFocusSession 的题量口径算这组「作答」要多久——
  // 本点题最多算 4 题（按自身 expectedTime 平均），其余按同科题平均补足到 6 题；该点没题返回 0
  estFocusMinutes(kpId) {
    const pool = Store.questions.filter(q => q.knowledgePointId === kpId);
    if (pool.length === 0) return 0;
    const avg = qs => qs.reduce((n, q) => n + (q.expectedTime || 30), 0) / qs.length;
    const focusCount = Math.min(4, pool.length);
    const subjectQs = Store.questions.filter(q => q.subjectId === pool[0].subjectId);
    const secs = avg(pool) * focusCount + avg(subjectQs) * (6 - focusCount);
    return Math.max(1, Math.round(secs / 60));
  },

  // 解析当前阶段题目（突破/必对/补救题动态选题；悬赏题从记录取）
  questionFor(session, now) {
    const stage = session.stages[session.idx];
    if (!stage) return null;
    const qIdx = Store.questionIndex();
    if (stage.type === 'retest') {
      const rec = Wrongbook.get(stage.recordId);
      return rec ? (qIdx[rec.questionId] || null) : null;
    }
    if (stage.type === 'variant') {
      const rec = Wrongbook.get(stage.recordId);
      return rec ? Wrongbook.variantQuestionFor(rec, true) : null;
    }
    if (stage.type === 'breakthrough') return this.pickBreakthrough(session, now, stage);
    if (stage.type === 'interleave') return this.pickInterleave(session, now);
    if (stage.type === 'safe') return this.pickSafe(session, now);
    if (stage.type === 'remedial') return this.pickRemedial(session, stage.kpId);
    return null;
  },

  // 题目历史作答次数（选题时优先出新鲜的题）
  attemptsCount(questionId) {
    return Store.attempts.filter(a => a.questionId === questionId).length;
  },

  _leastTried(pool) {
    const sorted = pool.slice().sort((a, b) => this.attemptsCount(a.id) - this.attemptsCount(b.id));
    return sorted[0] || null;
  },

  // 突破题：抽题优先级最高的知识点；连错 2 题 → 只出难度 ≤2 的软柿子；stage.kpId 锁定知识点（学习页专项练）
  // 溯源诊断（§5.5）：先修链深度 >2 的点出池（回炉重学，不刷题）；表层点指向的根因点加权 ×1.5（根因 70%：表层 30% 近似）
  pickBreakthrough(session, now, stage) {
    const sid = this.subjectId();
    const cap = session.wrongStreak >= 2 ? 2 : 99;
    const mastery = Store.mastery;
    const subjectQs = Store.questions.filter(q => q.subjectId === sid);
    // 专项练（stage.kpId 锁定）由学习页指定单点，不受单元范围约束
    const scopeIds = stage && stage.kpId ? null : this.unitKpIds();
    if (stage && stage.kpId) {
      const pool = subjectQs.filter(q =>
        q.knowledgePointId === stage.kpId && q.difficulty <= cap && !session.usedQuestionIds.includes(q.id));
      return pool.length > 0 ? this._leastTried(pool) : null;
    }
    // 第一遍：诊断候选，剔除需回炉的点，统计「根因点被指向」次数
    const kpIndex = Store.kpIndex();
    const cands = [];
    const rootHits = {};
    for (const kp of Store.knowledgePoints) {
      if (kp.subjectId !== sid || kp.level !== 4) continue;
      if (scopeIds && !scopeIds.has(kp.id)) continue;
      const m = mastery[kp.id] || Mastery.default();
      if (Mastery.isMastered(m)) continue;
      const p = Mastery.priority(m, kp, now);
      if (p === -Infinity) continue; // score<30 顽固点：降级出池，回炉重学
      const diag = Mastery.diagnose(kp, mastery, kpIndex);
      if (Mastery.needsRelearn(diag)) continue; // 深度>2：回炉重学，不进练习池
      cands.push({ kp, p, diag });
      if (diag.root.id !== kp.id) rootHits[diag.root.id] = (rootHits[diag.root.id] || 0) + 1;
    }
    // 第二遍：根因点加权优先，选最高分且有题的知识点
    let bestKp = null, bestP = -Infinity;
    for (const c of cands) {
      const p = rootHits[c.kp.id] ? c.p * 1.5 : c.p;
      const pool = subjectQs.filter(q =>
        q.knowledgePointId === c.kp.id && q.difficulty <= cap && !session.usedQuestionIds.includes(q.id));
      if (pool.length === 0) continue;
      if (p > bestP) { bestP = p; bestKp = c.kp; }
    }
    if (!bestKp) return null;
    const pool = subjectQs.filter(q =>
      q.knowledgePointId === bestKp.id && q.difficulty <= cap && !session.usedQuestionIds.includes(q.id));
    return this._leastTried(pool);
  },

  // 交错练习（阶段 3 §13.2）：从最高优先级的前 3 个知识点加权随机出题，避免单点连刷
  // 上一题刚练过的知识点降权（交错 = 同科内换点，激活记忆提取）
  pickInterleave(session, now) {
    const sid = this.subjectId();
    const mastery = Store.mastery;
    const kpIndex = Store.kpIndex();
    const scopeIds = this.unitKpIds();
    const cands = [];
    for (const kp of Store.knowledgePoints) {
      if (kp.subjectId !== sid || kp.level !== 4) continue;
      if (scopeIds && !scopeIds.has(kp.id)) continue;
      const m = mastery[kp.id] || Mastery.default();
      if (Mastery.isMastered(m)) continue;
      const p = Mastery.priority(m, kp, now);
      if (p === -Infinity) continue; // 顽固点出池
      const diag = Mastery.diagnose(kp, mastery, kpIndex);
      if (Mastery.needsRelearn(diag)) continue;
      const pool = Store.questions.filter(q =>
        q.knowledgePointId === kp.id && !session.usedQuestionIds.includes(q.id));
      if (pool.length === 0) continue;
      cands.push({ kp, p });
    }
    if (cands.length === 0) return null;
    cands.sort((a, b) => b.p - a.p);
    // 上一题知识点降权：除非只有它一个候选，否则不连刷同点
    const last = this._lastKpId(session);
    const top = cands.slice(0, 3).filter(c => c.kp.id !== last);
    const pick = (top.length > 0 ? top : cands.slice(0, 3))[Math.floor(Math.random() * Math.min(3, top.length > 0 ? top.length : cands.length))];
    const pool = Store.questions.filter(q =>
      q.knowledgePointId === pick.kp.id && !session.usedQuestionIds.includes(q.id));
    return this._leastTried(pool);
  },

  _lastKpId(session) {
    const ids = session.usedQuestionIds || [];
    if (ids.length === 0) return null;
    const q = Store.questionIndex()[ids[ids.length - 1]];
    return q ? q.knowledgePointId : null;
  },

  // 必对收尾：从有效掌握度（含遗忘衰减）≥80 的知识点选；没有则取全场最低难度
  pickSafe(session, now) {
    const sid = this.subjectId();
    const mastery = Store.mastery;
    const subjectQs = Store.questions.filter(q => q.subjectId === sid);
    const scopeIds = this.unitKpIds();
    const safeKpIds = new Set();
    for (const kp of Store.knowledgePoints) {
      if (kp.subjectId !== sid) continue;
      if (kp.level !== 4) continue;
      if (scopeIds && !scopeIds.has(kp.id)) continue;
      const m = mastery[kp.id];
      if (m && Mastery.decay(m, now).score >= 80) safeKpIds.add(kp.id);
    }
    const avail = q => q.type !== 'subjective' && !session.usedQuestionIds.includes(q.id)
      && (!scopeIds || scopeIds.has(q.knowledgePointId));
    let pool = subjectQs.filter(q => safeKpIds.has(q.knowledgePointId) && avail(q));
    if (pool.length === 0) {
      const all = subjectQs.filter(avail);
      if (all.length === 0) return null;
      const minD = Math.min(...all.map(x => x.difficulty));
      pool = all.filter(x => x.difficulty === minD);
    }
    return this._leastTried(pool);
  },

  // 补救变式：微课自测通过后，立刻来一道同知识点不同题
  pickRemedial(session, kpId) {
    const pool = Store.questions.filter(q =>
      q.knowledgePointId === kpId && !session.usedQuestionIds.includes(q.id));
    const variant = pool.find(q => q.groupRole === 'variant');
    if (variant) return variant;
    return this._leastTried(pool);
  },

  insertRemedial(session, kpId) {
    if (!this.pickRemedial(session, kpId)) return false;
    session.stages.splice(session.idx + 1, 0, { type: 'remedial', kpId });
    return true;
  },

  advance(session) {
    session.idx += 1;
    return session.stages[session.idx] || null;
  },

  // 提交当前阶段作答：写 attempt + 更新掌握度/悬赏 + 连击 + 战报记账
  submitStage(session, stage, question, answer, actualTime, now) {
    const correct = this.grade(question, answer);
    const isSubjective = correct === null;
    const rating = isSubjective ? null : this.rate(actualTime, question.expectedTime);
    const isClosure = stage.type === 'retest' || stage.type === 'variant';
    let before, after, newlyMastered = false, wrongRecordId = null;

    const mastery = Store.mastery;
    const m = mastery[question.knowledgePointId] || Mastery.default();
    before = m.score;

    if (isClosure) {
      // 销号闭环：走 Wrongbook 通道（重做通过 +5 / 变式通过 +8，由其内部回写掌握度）
      if (stage.type === 'retest') Wrongbook.submitRetest(stage.recordId, correct === true, now);
      else Wrongbook.submitVariant(stage.recordId, correct === true, now);
      const m2 = Store.mastery[question.knowledgePointId];
      after = m2 ? m2.score : before;
    } else {
      const applied = isSubjective ? m : Mastery.apply(m, correct, actualTime, question.expectedTime, now);
      mastery[question.knowledgePointId] = applied;
      Store.mastery = mastery;
      after = applied.score;
      newlyMastered = !Mastery.isMastered(m) && Mastery.isMastered(applied);
      if (correct === false) {
        const rec = Wrongbook.onWrong(question, answer, now);
        wrongRecordId = rec.id;
      }
    }

    // 连击：答对且 ≥A 级 → +1；B/C 级答对只保不断；答错归零（不扣任何东西）
    if (correct === true && (rating === 'S' || rating === 'A')) session.combo += 1;
    else if (correct === false) session.combo = 0;
    session.maxCombo = Math.max(session.maxCombo, session.combo);

    // 连错追踪：连错 2 题触发降难度
    if (correct === false) session.wrongStreak += 1;
    else if (correct === true) session.wrongStreak = 0;

    session.usedQuestionIds.push(question.id);

    // 作答明细
    const attempts = Store.attempts;
    attempts.push({
      id: 'a' + now.toString(36) + Math.random().toString(36).slice(2, 6),
      questionId: question.id,
      knowledgePointId: question.knowledgePointId,
      correct: isSubjective ? null : correct,
      actualTime,
      timestamp: now,
      errorType: null,
      closureType: isClosure ? stage.type : null,
    });
    Store.attempts = attempts;

    // 每日战报记账
    const dateKey = Store.todayKey(now);
    const patch = { answered: 1 };
    if (correct === true) patch.correct = 1;
    if (newlyMastered) patch.litCount = 1;
    Store.bumpDayStat(dateKey, patch);
    Store.bumpDayStat(dateKey, { maxCombo: session.maxCombo });

    session.results.push({
      stageType: stage.type, questionId: question.id,
      correct: isSubjective ? null : correct, rating, newlyMastered, combo: session.combo,
    });

    return {
      correct, isSubjective, rating, before, after, newlyMastered,
      wrongRecordId, combo: session.combo, wrongStreak: session.wrongStreak,
      degradedNext: session.wrongStreak >= 2,
    };
  },
};
