// 错题本「攻克清单」：销号闭环（D0/D3/D7）+ 升级机制 + 容量控制
// 规则来源：开发文档 §7
const Wrongbook = {
  DAY: 86400000,
  LIMIT: 25,

  all() { return Store.wrongbook; },
  active() { return this.all().filter(r => r.status !== '已销号'); },
  get(id) { return this.all().find(r => r.id === id) || null; },
  // 顽固错题（错 3 次以上或状态顽固，未销号）：单独成组回炉重学，不进日常刷题
  stubborn() { return this.all().filter(r => r.status !== '已销号' && (r.status === '顽固' || r.reappearCount >= 3)); },
  overLimit() { return this.active().length >= this.LIMIT; },
  _save(list) { Store.wrongbook = list; },

  // D0：答错入榜（同题已有活跃悬赏则刷新该条，不重复建）
  onWrong(question, myAnswer, now) {
    const list = this.all();
    let rec = list.find(r => r.questionId === question.id && r.status !== '已销号');
    if (rec) {
      rec.myAnswer = myAnswer;
      rec.correctAnswer = question.answer;
      rec.firstWrongAt = now;
      rec.errorType = null;
      rec.understood = false;
      rec.status = '待处理';
      rec.retestAt = null;
      rec.variantAt = null;
    } else {
      rec = {
        id: 'w' + now.toString(36) + Math.random().toString(36).slice(2, 6),
        questionId: question.id,
        knowledgePointId: question.knowledgePointId,
        subjectId: question.subjectId,
        firstWrongAt: now,
        errorType: null,
        myAnswer,
        correctAnswer: question.answer,
        understood: false,
        retestAt: null,
        variantAt: null,
        closedAt: null,
        status: '待处理',
        reappearCount: 0,
      };
      list.push(rec);
    }
    this._save(list);
    return rec;
  },

  // D0：自选错因（先归因再给解析，顺序不可反）
  setErrorType(id, errorType) {
    const list = this.all();
    const rec = list.find(r => r.id === id);
    if (rec) { rec.errorType = errorType; this._save(list); }
    return rec;
  },

  // D0：标记看懂 → 进入 D3 排程
  markUnderstood(id, now) {
    const list = this.all();
    const rec = list.find(r => r.id === id);
    if (!rec) return null;
    rec.understood = true;
    rec.status = '重做中';
    rec.retestAt = Math.max(rec.firstWrongAt + 3 * this.DAY, now);
    this._save(list);
    return rec;
  },

  // 到期任务：D3 重做 / D7 变式（到期悬赏永远作为每天第一题）
  due(now) {
    const retests = [], variants = [];
    for (const r of this.all()) {
      if (r.status === '重做中' && r.understood && now >= r.retestAt) retests.push(r);
      else if (r.status === '变式待测' && now >= r.variantAt) variants.push(r);
    }
    return { retests, variants };
  },

  // D3：原题重做。通过 → +5 分 + D7 变式排程；不过 → 回解析 +3 天再来（reappearCount+1）
  submitRetest(id, passed, now) {
    const list = this.all();
    const rec = list.find(r => r.id === id);
    if (!rec) return null;
    if (passed) {
      const mastery = Store.mastery;
      const m = mastery[rec.knowledgePointId] || Mastery.default();
      mastery[rec.knowledgePointId] = Mastery.applyClosure(m, true, 5, now);
      Store.mastery = mastery;
      rec.status = '变式待测';
      rec.variantAt = Math.max(rec.firstWrongAt + 7 * this.DAY, now);
    } else {
      rec.reappearCount += 1;
      rec.status = '重做中';
      rec.retestAt = now + 3 * this.DAY;
      rec.understood = true; // 失败时解析已当场回看
    }
    this._save(list);
    return rec;
  },

  // D7：变式题。通过 → +8 分 → 销号；不过 → 顽固错题
  submitVariant(id, passed, now) {
    const list = this.all();
    const rec = list.find(r => r.id === id);
    if (!rec) return null;
    if (passed) {
      const mastery = Store.mastery;
      const m = mastery[rec.knowledgePointId] || Mastery.default();
      mastery[rec.knowledgePointId] = Mastery.applyClosure(m, true, 8, now);
      Store.mastery = mastery;
      rec.status = '已销号';
      rec.closedAt = now;
      Store.bumpDayStat(Store.todayKey(now), { closures: 1 });
    } else {
      rec.status = '顽固';
    }
    this._save(list);
    return rec;
  },

  // 变式题选择：同知识点同题型，优先同题组 variant 角色，其次任意不同题
  // allowAnyType：放宽到同知识点任意题型（仅在无 AI 可现场出题时兜底）——否则大量
  // 只出一道题的考点会永久卡在「变式待测」，D7 变式永远出不了题、闭环无法销号
  variantQuestionFor(record, allowAnyType) {
    const qIdx = Store.questionIndex();
    const original = qIdx[record.questionId];
    if (!original) return null;
    const pool = Store.questions.filter(q =>
      q.knowledgePointId === record.knowledgePointId &&
      q.id !== original.id &&
      q.type === original.type);
    const inGroup = pool.find(q => q.groupId && q.groupId === original.groupId && q.groupRole === 'variant');
    if (inGroup || pool[0]) return inGroup || pool[0];
    if (!allowAnyType) return null;
    return Store.questions.find(q =>
      q.knowledgePointId === record.knowledgePointId && q.id !== original.id) || null;
  },

  // 升级阶梯：0 正常再来一轮 / 1 触发知识点溯源 / 2 顽固清单回炉重学
  upgradeLevel(rec) {
    if (rec.status === '顽固' || rec.reappearCount >= 3) return 2;
    if (rec.reappearCount === 2) return 1;
    return 0;
  },
};
