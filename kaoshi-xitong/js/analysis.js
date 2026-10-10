// 学课分析引擎（教育测量学五维画像）：覆盖度 / 掌握水平 / 认知层级 / 熟练度 / 错误结构
// 纯计算、无 DOM；被「学课摸底分析测试」诊断报告与「学习汇报」两处复用。
// 依赖 Mastery / Store；不依赖 Report（避免循环依赖），章节归属自带实现。
const Analysis = {
  // 布鲁姆认知层级（低→高：记忆/理解 = 基础层，应用/分析 = 迁移层）
  LAYERS: ['记忆', '理解', '应用', '分析'],

  // L4 叶点 → 所属 L2 章（沿父链上溯）
  _chapterOf(kp, kpIndex) {
    let node = kp;
    while (node && node.level > 2) node = kpIndex[node.parentId];
    return node || null;
  },

  _median(arr) {
    if (!arr.length) return 0;
    const s = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  },

  _ratio(n, d) { return d > 0 ? n / d : 0; },

  // 五档评级（比知识树 tier 更细，用于报告结论）
  _rating(score) {
    if (score >= 85) return { key: 'A', label: '优秀', tip: '可加速推进' };
    if (score >= 70) return { key: 'B', label: '良好', tip: '稳步推进' };
    if (score >= 50) return { key: 'C', label: '中等', tip: '需巩固' };
    if (score >= 30) return { key: 'D', label: '待突破', tip: '重点突破' };
    return { key: 'E', label: '需回炉', tip: '重建基础' };
  },

  // 主因判定：按严重度优先（基础不牢 > 会背不会用 > 结构性缺口 > 会但不熟 > 平稳）
  _mainIssue(p, score) {
    if (score < 40) return { key: 'foundation', text: '基础不牢：整体掌握度偏低，建议先回炉重建先修点，再谈推进。' };
    if (p.cognitive.lowAcc >= 0.7 && p.cognitive.highAcc < 0.6)
      return { key: 'transfer', text: '会背不会用：记忆/理解层级正确率高，但应用/分析跟不上，需要多做变式迁移。' };
    if (p.error.concentrated)
      return { key: 'structure', text: '结构性缺口：错误高度集中在个别章节，优先集中突破这些章节。' };
    if (p.fluency.level === 'slow')
      return { key: 'fluency', text: '会但不熟：答对但速度偏慢，练到自动化才算真掌握。' };
    return { key: 'steady', text: '状态平稳：整体掌握与作答表现一致，按计划稳步推进即可。' };
  },

  // 可执行建议：根因回炉 > 结构突破 > 迁移练习 > 提速 > 补数据，兜底保持节奏
  _advice(p, score) {
    const items = [];
    if (p.roots.length) {
      const names = p.roots.map(r => r.rootName).slice(0, 3).join('、');
      items.push(`回炉先修：先补「${names}」这几个先修点，看微课自测过关，比硬刷题划算。`);
    }
    if (p.error.concentrated && p.error.clusters.length) {
      const c = p.error.clusters[0];
      items.push(`集中突破：错误集中在「${c.name}」（${c.count} 道），这周优先吃透这一章。`);
    }
    if (p.cognitive.gap >= 0.3) {
      items.push('迁移练习：记忆理解已稳、应用分析偏弱，多做变式题，把「背下来」练成「用出来」。');
    }
    if (p.fluency.level === 'slow') {
      items.push('提速练习：答对但偏慢，限时再做几组，把会做的练到自动化。');
    }
    if (p.coverage.confidence !== 'high') {
      items.push('补数据：当前作答覆盖有限，结论仅供参考，多做几组让分析更准。');
    }
    if (items.length === 0) items.push('保持节奏：当前没有明显短板，按每天一组稳定推进即可。');
    const headline = score >= 70 ? `这门课整体掌握良好（${score} 分），继续保持。`
      : score >= 40 ? `这门课还有提升空间（${score} 分），重点补上面提到的短板。`
      : `这门课基础薄弱（${score} 分），需要系统回炉重建。`;
    return { headline, items };
  },

  // 单科画像。records：作答明细数组（至少含 questionId / correct，可选 actualTime），按作答顺序排列
  profile(subjectId, records, now) {
    const subj = Store.subjects.find(s => s.id === subjectId);
    const kpIndex = Store.kpIndex();
    const qIndex = Store.questionIndex();
    const totalLeaves = Store.knowledgePoints.filter(k => k.subjectId === subjectId && k.level === 4).length;
    const base = {
      subjectId, subjectName: subj ? subj.name : subjectId, generatedAt: now,
      hasData: false, tested: 0, totalLeaves,
      coverage: { ratio: 0, confidence: 'low', label: '仅供参考' },
      mastery: { score: 0 },
      cognitive: { byLayer: [], lowAcc: 0, highAcc: 0, gap: 0 },
      fluency: { median: 0, level: 'normal', levelLabel: '正常', fastCount: 0, slowCount: 0, samples: 0 },
      error: { wrongCount: 0, concentrated: false, clusters: [] },
      chapters: [], roots: [], weakPoints: [],
      rating: { key: 'C', label: '中等', tip: '需巩固' },
      mainIssue: { key: 'steady', text: '暂无足够数据' },
      advice: { headline: '', items: [] },
    };

    // ① 作答明细：按知识点取最近一次作答（records 按序，后者覆盖前者 = 最近）
    // 同时给出该点「实测掌握度」——复用摸底四分档映射（对快80/对75/错快45/错慢25），纯诊断不写回 Store
    const latestByKp = {};
    for (const r of records || []) {
      const q = qIndex[r.questionId];
      if (!q || q.subjectId !== subjectId) continue;
      const kp = kpIndex[q.knowledgePointId];
      if (!kp) continue;
      const fast = q.expectedTime > 0 && typeof r.actualTime === 'number' && r.actualTime / q.expectedTime <= 0.5;
      const score = Mastery.applyPlacement(r.correct === true, fast, now).score;
      latestByKp[q.knowledgePointId] = { kpId: q.knowledgePointId, kp, q, r, score, fast };
    }
    const points = Object.values(latestByKp);
    base.tested = points.length;
    if (points.length === 0) return base; // 无作答：掌握度保持 0，仅返回空画像
    base.hasData = true;

    // ② 掌握水平：作答点按 weight 加权实测掌握度（不读 Store.mastery，纯由本次作答推得）
    let tw = 0, wsum = 0;
    for (const p of points) {
      const w = p.kp.weight || 3;
      tw += w; wsum += w * p.score;
    }
    base.mastery.score = tw > 0 ? Math.round(wsum / tw) : 0;
    base.rating = this._rating(base.mastery.score);

    // 覆盖度（作答覆盖的叶点数 / 总叶点数）
    const ratio = this._ratio(points.length, totalLeaves);
    base.coverage = {
      ratio,
      confidence: ratio >= 0.3 ? 'high' : ratio >= 0.12 ? 'mid' : 'low',
      label: ratio >= 0.3 ? '较可靠' : ratio >= 0.12 ? '一般' : '仅供参考',
    };

    // ③ 认知层级：按 bloom 分层的正确率，低层(记忆/理解) vs 高层(应用/分析)
    const layerStat = {};
    for (const layer of this.LAYERS) layerStat[layer] = { total: 0, correct: 0 };
    for (const p of points) {
      const layer = p.kp.bloom && layerStat[p.kp.bloom] ? p.kp.bloom : '应用';
      layerStat[layer].total += 1;
      if (p.r.correct === true) layerStat[layer].correct += 1;
    }
    const byLayer = this.LAYERS.map(layer => {
      const s = layerStat[layer];
      return { layer, total: s.total, correct: s.correct, acc: this._ratio(s.correct, s.total) };
    }).filter(x => x.total > 0);
    const lowAcc = this._ratio(
      byLayer.filter(x => x.layer === '记忆' || x.layer === '理解').reduce((s, x) => s + x.correct, 0),
      byLayer.filter(x => x.layer === '记忆' || x.layer === '理解').reduce((s, x) => s + x.total, 0));
    const highAcc = this._ratio(
      byLayer.filter(x => x.layer === '应用' || x.layer === '分析').reduce((s, x) => s + x.correct, 0),
      byLayer.filter(x => x.layer === '应用' || x.layer === '分析').reduce((s, x) => s + x.total, 0));
    base.cognitive = { byLayer, lowAcc, highAcc, gap: lowAcc - highAcc };

    // ④ 熟练度：答对题的实际用时/标准用时中位数
    const speed = [];
    for (const p of points) {
      if (p.r.correct !== true || !(p.q.expectedTime > 0) || typeof p.r.actualTime !== 'number') continue;
      speed.push(p.r.actualTime / p.q.expectedTime);
    }
    const med = this._median(speed);
    const level = med <= 0.7 ? 'fast' : med <= 1.3 ? 'normal' : 'slow';
    base.fluency = {
      median: med,
      level,
      levelLabel: { fast: '熟练', normal: '正常', slow: '偏慢' }[level],
      fastCount: speed.filter(r => r <= 0.7).length,
      slowCount: speed.filter(r => r > 1.3).length,
      samples: speed.length,
    };

    // ⑤ 错误结构：错误点按章聚合，判断是否结构性集中
    const wrongPoints = points.filter(p => p.r.correct !== true);
    const chapterCount = {};
    for (const p of wrongPoints) {
      const ch = this._chapterOf(p.kp, kpIndex);
      const chId = ch ? ch.id : '_none';
      if (!chapterCount[chId]) chapterCount[chId] = { id: chId, name: ch ? ch.name : '未归类', count: 0 };
      chapterCount[chId].count += 1;
    }
    const clusters = Object.values(chapterCount).sort((a, b) => b.count - a.count);
    base.error = {
      wrongCount: wrongPoints.length,
      concentrated: wrongPoints.length >= 3 && clusters.length > 0 && this._ratio(clusters[0].count, wrongPoints.length) >= 0.6,
      clusters,
    };

    // 分章表现（答对率 + 该章当前掌握度均值，按掌握度升序）
    const chapterMap = {};
    for (const p of points) {
      const ch = this._chapterOf(p.kp, kpIndex);
      const chId = ch ? ch.id : '_none';
      if (!chapterMap[chId]) chapterMap[chId] = { id: chId, name: ch ? ch.name : '未归类', n: 0, correct: 0, effSum: 0 };
      const c = chapterMap[chId];
      c.n += 1;
      if (p.r.correct === true) c.correct += 1;
      c.effSum += p.score;
    }
    base.chapters = Object.values(chapterMap).map(c => ({
      id: c.id, name: c.name, n: c.n, correct: c.correct,
      acc: this._ratio(c.correct, c.n), score: Math.round(c.effSum / c.n),
    })).sort((a, b) => a.score - b.score);

    // 弱点点位 + 根因（沿先修链下钻，depth>2 判需回炉）
    base.weakPoints = points
      .map(p => ({ kpId: p.kpId, name: p.kp.name, eff: p.score }))
      .filter(w => w.eff < 60);
    base.roots = [];
    for (const w of base.weakPoints) {
      const kp = kpIndex[w.kpId];
      if (!kp) continue;
      const diag = Mastery.diagnose(kp, Store.mastery, kpIndex);
      if (Mastery.needsRelearn(diag)) {
        base.roots.push({ kpId: w.kpId, name: kp.name, rootName: diag.root.name, depth: diag.depth });
      }
    }

    base.mainIssue = this._mainIssue(base, base.mastery.score);
    base.advice = this._advice(base, base.mastery.score);
    return base;
  },

  // 全局画像：按科目分组，供「学习汇报」横向对比
  profileAll(now) {
    const attempts = Store.attempts || [];
    const qIndex = Store.questionIndex();
    const subjectIds = new Set();
    for (const a of attempts) {
      const q = qIndex[a.questionId];
      if (q && q.subjectId) subjectIds.add(q.subjectId);
    }
    // 纳入已有掌握度记录但作答明细已归档的科目（mastery 永久保留，attempts 超 90 天会归档）
    for (const kp of Store.knowledgePoints) {
      if (Store.mastery[kp.id]) subjectIds.add(kp.subjectId);
    }
    const subjects = [];
    for (const sid of subjectIds) {
      const recs = attempts.filter(a => (qIndex[a.questionId] || {}).subjectId === sid);
      subjects.push(this.profile(sid, recs, now));
    }
    subjects.sort((a, b) => a.mastery.score - b.mastery.score);
    // 综合：按各科作答数加权平均掌握度
    let tw = 0, wsum = 0, totalTested = 0, totalLeaves = 0;
    for (const p of subjects) {
      tw += p.tested; wsum += p.tested * p.mastery.score;
      totalTested += p.tested; totalLeaves += p.totalLeaves;
    }
    const overallScore = tw > 0 ? Math.round(wsum / tw) : 0;
    return {
      generatedAt: now, subjects,
      overall: {
        score: overallScore,
        rating: this._rating(overallScore),
        coverageRatio: this._ratio(totalTested, totalLeaves),
        testedCount: totalTested,
        leafCount: totalLeaves,
      },
    };
  },
};
