// 每日计划调度器：把「今天练什么」的决策从孩子头上拿走
// 优先级：到期悬赏 > 临界遗忘保养 > 会考科加权 > 科目轮换（心理规范 §11.9：每日 2~3 科，总量可控）
// 规则来源：开发文档 §12 每日完整体验流
const Scheduler = {
  DEFAULT_EXAM_DATE: '2027-06-15',
  DEFAULT_TERM_START: '2026-09-01',
  TERM_WEEKS: 20,   // 一学期按 20 教学周估算

  // ===== 练习排班（家长提前排：哪天日常短练 / 假期长练 / 休息）=====
  // 周模板缺省：周一~五日常短练（时长家长选，默认 30 分钟），周六日假期（约 60 分钟）；日期区间覆盖优先于周模板
  DEFAULT_SCHEDULE: {
    week: { 1: 'daily', 2: 'daily', 3: 'daily', 4: 'daily', 5: 'daily', 6: 'holiday', 0: 'holiday' },
    ranges: [],
    shortMinutes: 30,
  },
  // 日常短练时长档位（分钟，整天两块合计）：给孩子减负，家长可压到 10/20 分钟
  SHORT_MINUTES: [10, 20, 30],
  DEFAULT_SHORT_MINUTES: 30,
  // 日型 → 每块题量 / 单块时长（含讲解约 2.5 分钟/题；每天 2 个科目块）。daily 由短练时长动态折算
  DAY_PLAN: {
    daily: { perBlock: 6, minutes: 15 },     // 默认 30 分钟档：2 块 ≈ 30 分钟
    holiday: { perBlock: 12, minutes: 30 },  // 2 块 ≈ 60 分钟
    rest: { perBlock: 0, minutes: 0 },
  },

  scheduleOf() {
    const s = (Store.settings || {}).schedule || {};
    return {
      week: { ...this.DEFAULT_SCHEDULE.week, ...(s.week || {}) },
      ranges: Array.isArray(s.ranges) ? s.ranges : [],
      shortMinutes: this._shortMinutes(s),
    };
  },

  // 短练时长校验：只认 10/20/30，其它值回落默认 30
  _shortMinutes(s) {
    const v = Number((s || {}).shortMinutes);
    return this.SHORT_MINUTES.includes(v) ? v : this.DEFAULT_SHORT_MINUTES;
  },

  // 今日日型：假期区间覆盖 > 周模板；非法值回落 daily
  dayTypeOf(now) {
    const sc = this.scheduleOf();
    const key = Store.todayKey(now);
    const hit = sc.ranges.find(r => r && r.from && r.to && key >= r.from && key <= r.to);
    const t = hit ? hit.type : sc.week[new Date(now).getDay()];
    return (t === 'holiday' || t === 'rest') ? t : 'daily';
  },

  // 今日任务量：日常按家长选的短练时长折算（2.5 分钟/题、每天 2 块）；假期固定 60 分钟
  dayPlanOf(now) {
    const type = this.dayTypeOf(now);
    if (type !== 'daily') return this.DAY_PLAN[type];
    const sm = this._shortMinutes(this.scheduleOf());
    return { perBlock: Math.round(sm / 5), minutes: Math.round(sm / 2) };
  },

  // 过密检测（家长保存排班时提醒）：返回警告文案数组，空数组 = 没问题
  scheduleWarnings(schedule) {
    const sc = schedule || this.scheduleOf();
    const out = [];
    const week = sc.week || {};
    const days = [1, 2, 3, 4, 5, 6, 0].map(d => week[d] || 'daily');
    if (!days.includes('rest')) {
      out.push('一周七天都排了练习，没有一天休息——建议至少留 1 天让孩子彻底放松。');
    }
    // 一周总时长按实际短练时长为日常日折算（假期日固定 60 分钟）
    const sm = this._shortMinutes(sc);
    const dayMinutes = t => t === 'daily' ? sm : ((this.DAY_PLAN[t] || this.DAY_PLAN.daily).minutes * 2);
    const minutes = days.reduce((n, t) => n + dayMinutes(t), 0);
    if (minutes > 300) {
      out.push(`一周总练习约 ${Math.round(minutes / 6) / 10} 小时，排得太满了——孩子不是做题机器，压到 5 小时以内更有效。`);
    }
    let streak = 0, maxStreak = 0;
    for (const t of days) {
      if (t === 'holiday') { streak += 1; maxStreak = Math.max(maxStreak, streak); }
      else streak = 0;
    }
    if (maxStreak >= 4) {
      out.push(`连续 ${maxStreak} 天都是 60 分钟长练——长跑也得喘气，中间隔开更有效。`);
    }
    for (const r of (sc.ranges || [])) {
      if (!r || r.type !== 'holiday' || !r.from || !r.to) continue;
      const span = Math.round((new Date(r.to) - new Date(r.from)) / 86400000) + 1;
      if (span > 14) {
        out.push(`${r.from} ~ ${r.to} 连着 ${span} 天都是长练——假期也张弛有度，中间留几天休息日。`);
      }
    }
    return out;
  },

  examDate() { return Store.settings.examDate || this.DEFAULT_EXAM_DATE; },

  termStart() { return Store.settings.termStart || this.DEFAULT_TERM_START; },

  // 当前教学周（1 起；开学前/假期返回 0）
  termWeek(now) {
    const t = new Date(this.termStart() + 'T00:00:00').getTime();
    if (now < t) return 0;
    return Math.floor((now - t) / (7 * 86400000)) + 1;
  },

  // 某科「正在教 / 刚教完」的 L2 章：章按 order 序均匀铺满学期，当前周落在章区间 ±1 周内
  teachingChapters(subjectId, week) {
    if (!week) return [];
    const L2 = Store.knowledgePoints
      .filter(k => k.subjectId === subjectId && k.level === 2)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const n = L2.length;
    if (!n) return [];
    const step = this.TERM_WEEKS / n;
    const w = week - 0.5;
    return L2.filter((k, i) => {
      const start = i * step, end = (i + 1) * step;
      return w >= start - 1 && w <= end + 1;
    }).map(k => k.name);
  },

  // 距会考天数（按日历天数差：考试日零点起算；过期返回负数，调用方自行决定是否展示）
  examDaysLeft(now) {
    const t = new Date(this.examDate() + 'T00:00:00').getTime();
    return Math.ceil((t - now) / 86400000);
  },

  // ===== 本周习惯 + 免死金牌（对比分析 B1）=====
  // 不做 365 天连击数字压力（Duolingo 实证反例），只算「本周坚持 X/7」；
  // 每周一张免死金牌：本周练过但今天还没练 → 自动保底 1 天（一次性，展示后即消耗）
  weekKeyOf(now) {
    const d = new Date(now);
    const day = d.getDay() || 7; // 周一=1 … 周日=7
    const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (day - 1));
    return Store.todayKey(mon.getTime());
  },

  // 返回 { weekKey, days, shieldUsed, effective }：effective = 保底后的本周天数（≤7）
  habit(now) {
    const weekKey = this.weekKeyOf(now);
    const s = Store.settings.shield;
    const cur = (s && s.weekKey === weekKey) ? s : { weekKey, used: false };
    let days = 0;
    const start = new Date(weekKey + 'T00:00:00').getTime();
    for (let ts = start; ts <= now; ts += 86400000) {
      if (Store.dayStat(Store.todayKey(ts)).answered > 0) days += 1;
    }
    const todayPracticed = Store.dayStat(Store.todayKey(now)).answered > 0;
    // 本周练过但今天还没练 → 金牌保底（只生效一次）
    const protect = !cur.used && !todayPracticed && days > 0;
    return {
      weekKey,
      days,
      shieldUsed: cur.used || protect,
      effective: Math.min(7, days + (protect ? 1 : 0)),
      protect,
    };
  },

  // 消耗本周免死金牌（app.js 在展示保底后调用，一次性置位）
  useShield(now) {
    const weekKey = this.weekKeyOf(now);
    Store.settings = { ...Store.settings, shield: { weekKey, used: true } };
  },

  // ===== 考试模式（阶段 3 §13.2）：一键切考试科，计划只出该科冲刺块 =====
  examModeOn() { return Boolean(Store.settings.examMode); },
  examModeId() { return Store.settings.examMode || ''; },
  setExamMode(id) { Store.settings = { ...Store.settings, examMode: id }; },
  clearExamMode() { Store.settings = { ...Store.settings, examMode: '' }; },

  // 考试冲刺的性价比最高复习点：该科未掌握 L4 按抽题优先级取前 n
  topReviewPoints(subjectId, now, n) {
    const out = [];
    for (const kp of Store.knowledgePoints) {
      if (kp.subjectId !== subjectId || kp.level !== 4) continue;
      const m = Store.mastery[kp.id];
      if (m && Mastery.isMastered(m)) continue;
      const p = Mastery.priority(m || Mastery.default(), kp, now);
      if (p === -Infinity) continue;
      out.push({ id: kp.id, name: kp.name, p });
    }
    out.sort((a, b) => b.p - a.p);
    return out.slice(0, n);
  },

  // ===== 赛季窗口（阶段 3 §13.4）：期中=1~12 周，期末=13~20 周；开学前为 null =====
  // 年份取学期起点，保证一个学期的 key 不因跨年（9 月开学 → 次年 1 月）而分裂成两个赛季
  seasonOf(now) {
    const week = this.termWeek(now);
    if (!week) return null;
    const year = new Date(this.termStart() + 'T00:00:00').getFullYear();
    if (week <= 12) return { key: `${year}-mid`, label: '期中赛季', startWeek: 1, endWeek: 12 };
    return { key: `${year}-final`, label: '期末赛季', startWeek: 13, endWeek: 20 };
  },

  // 赛季快照：正在进行的赛季每帧刷新（窗口内累积到当前），已结束的赛季保持结算值不变
  recordSeason(now) {
    const s = this.seasonOf(now);
    if (!s) return null;
    const base = new Date(this.termStart() + 'T00:00:00').getTime();
    const weekMs = 7 * 86400000;
    const start = base + (s.startWeek - 1) * weekMs;
    const end = Math.min(now, base + s.endWeek * weekMs);
    const agg = Store.aggregateDayStats(start, end);
    const seasons = Store.seasons;
    const prev = seasons[s.key];
    const snap = {
      key: s.key, label: s.label, endWeek: s.endWeek,
      at: prev ? prev.at : now,   // 首次记录时间不覆盖，赛季结束时即以最后一次刷新值为结算值
      answered: agg.answered, correct: agg.correct, closures: agg.closures, lit: agg.lit,
    };
    Store.seasons = { ...seasons, [s.key]: snap };
    return snap;
  },

  // 大考校准（阶段 3 §13.4）：录入实考分后按 (实考分−现均分)×0.3 双向微调掌握度（±15 封顶）
  calibrate(subjectId, score, now) {
    const raw = String(score == null ? '' : score).trim();
    const n = Number(raw);
    if (raw === '' || !(n >= 0 && n <= 100)) return { ok: false, error: '请输入 0~100 的成绩' };
    const sc = Mastery.clamp(Math.round(n), 0, 100);
    const kps = Store.knowledgePoints.filter(k => k.subjectId === subjectId && k.level === 4);
    if (kps.length === 0) return { ok: false, error: '该科没有可校准的知识点' };
    const mastery = Store.mastery;
    let avg = 0;
    for (const kp of kps) avg += (mastery[kp.id] || Mastery.default()).score;
    avg /= kps.length;
    const delta = Mastery.clamp(Math.round((sc - avg) * 0.3), -15, 15);
    for (const kp of kps) {
      const m = mastery[kp.id] || Mastery.default();
      mastery[kp.id] = { ...m, score: Mastery.clamp(m.score + delta, 0, 100), lastReviewAt: now };
    }
    Store.mastery = mastery;
    Store.examScores = { ...Store.examScores, [subjectId]: sc };
    return { ok: true, delta, avg: Math.round(avg), score: sc };
  },

  // 某科当日压力：到期悬赏数 + 临界遗忘点数（间隔已到且衰减后未达掌握线的点）
  pressure(subjectId, now) {
    const due = Wrongbook.due(now);
    const bounty = due.retests.filter(r => r.subjectId === subjectId).length
      + due.variants.filter(r => r.subjectId === subjectId).length;
    let rusty = 0;
    for (const kp of Store.knowledgePoints) {
      if (kp.subjectId !== subjectId || kp.level !== 4) continue;
      const m = Store.mastery[kp.id];
      if (!m || !m.reviewCount) continue;
      const days = (now - m.lastReviewAt) / 86400000;
      if (days >= m.interval && Mastery.decay(m, now).score < 85) rusty++;
    }
    return { bounty, rusty };
  },

  _block(subjectId, mode, reasons, count) {
    return { subjectId, mode, reasons, count: count || 6 };
  },

  // 今日计划：2 个科目块。salt 用于「换个组合」换一批。休息日返回空计划
  plan(now, salt) {
    const dayType = this.dayTypeOf(now);
    if (dayType === 'rest') return [];
    const perBlock = this.dayPlanOf(now).perBlock;
    const subjects = Store.subjects;

    // 考试模式：只出考试科的冲刺块（阶段 3 §13.2，优先级最高）
    if (this.examModeOn()) {
      const subj = subjects.find(s => s.id === this.examModeId());
      if (subj) {
        const pts = this.topReviewPoints(subj.id, now, 3);
        const reasons = pts.length > 0 ? ['冲刺点：' + pts.map(p => p.name).join('、')] : ['考试冲刺，全科扫一遍'];
        const days = this.examDaysLeft(now);
        if (days > 0) reasons.push(`还有 ${days} 天`);
        return [this._block(subj.id, '考试冲刺', reasons, perBlock)];
      }
    }

    // 首次使用（无任何作答）：默认科摸底 + 会考科了解
    if (Store.attempts.length === 0) {
      const def = subjects.find(s => s.default) || subjects[0];
      const examSub = subjects.find(s => s.exam && s.id !== def.id);
      const blocks = [this._block(def.id, '突破摸底', ['先摸个底，看看哪里薄'], perBlock)];
      if (examSub) blocks.push(this._block(examSub.id, '突破摸底', ['换个科目，先混个脸熟'], perBlock));
      return blocks;
    }

    const week = this.termWeek(now);
    const dayIdx = Math.floor(now / 86400000);
    const scored = subjects.map((s, i) => {
      const p = this.pressure(s.id, now);
      const teaching = this.teachingChapters(s.id, week);
      const score = p.bounty * 10 + p.rusty * 2 + (s.exam ? 3 : 0)
        + teaching.length * 2          // 教学日历：正在教/刚教完的科优先（§6.4）
        + ((i + dayIdx) % subjects.length) * 0.01;
      return { subject: s, bounty: p.bounty, rusty: p.rusty, teaching, score };
    }).sort((a, b) => b.score - a.score);

    // 「换个组合」：按盐值在排序结果上轮换起点，保证换批真的换人（salt=0 即当天默认前 2）
    const start = ((salt || 0) % scored.length + scored.length) % scored.length;
    const picked = [];
    for (let i = 0; i < 2 && i < scored.length; i++) picked.push(scored[(start + i) % scored.length]);

    return picked.map(x => {
      const mode = x.bounty > 0 ? '悬赏清缴' : x.rusty > 0 ? '保养加固' : '突破推进';
      const reasons = [];
      if (x.bounty > 0) reasons.push(`${x.bounty} 道悬赏到期`);
      if (x.rusty > 0) reasons.push(`${x.rusty} 个点快生锈`);
      if (reasons.length === 0) reasons.push('按计划推进');
      return this._block(x.subject.id, mode, reasons, perBlock);
    });
  },
};
