// 学长「阿K」主动触发器：何时说话 + 防骚扰红线（零 DOM，纯 L1 本地文案）
// 规则来源：开发文档 §9.1 三层消息（本地触发器 0 成本）§9.3 触发器地图 §9.4 每日体验流
// 依赖：Store / Scheduler（压力量化）。文案全部内联，不依赖 COPY，便于独立测试。
const Triggers = {
  DAILY_LIMIT: 2,             // 每日主动消息上限（红线：≤2 条）
  SILENT_HOUR: 22,            // 22:00 后静默（红线）
  WAKE_HOUR: 6,               // 06:00 前仍静默（红线）
  RECALL_MS: 48 * 3600000,    // 超 48h 未登录召回

  // 主动消息当日状态（一天一个槽位，跨日重置；skipped 记「今天跳过」的消息 id）
  state(now) {
    const date = Store.todayKey(now || Date.now());
    const p = Store.settings.proactive;
    if (p && p.date === date) return p;
    return { date, sent: 0, skipped: {} };
  },
  _save(p) { Store.settings = { ...Store.settings, proactive: p }; },

  silent(now) {
    const h = new Date(now || Date.now()).getHours();
    return h >= this.SILENT_HOUR || h < this.WAKE_HOUR;
  },
  canSend(now) { return !this.silent(now) && this.state(now).sent < this.DAILY_LIMIT; },
  recordSent(now) { const p = this.state(now); p.sent += 1; this._save(p); },
  skip(id, now) { const p = this.state(now); p.skipped[id] = true; this._save(p); },
  skipped(id, now) { return !!this.state(now).skipped[id]; },

  // ===== 开工问候（每天打开，界面文案，不占主动消息额度）=====
  // 昨日表现 + 今日任务 + 考试倒计时（§9.3「每天打开」）
  greeting(now, planList, doneList) {
    const DAY = 86400000;
    const y = Store.dayStat(Store.todayKey(now - DAY));
    const plan = planList || Scheduler.plan(now, 0);
    const done = doneList || [];
    const days = Scheduler.examDaysLeft(now);
    const parts = [this._hello(now)];
    if (y.answered) {
      const acc = Math.round(100 * y.correct / y.answered);
      parts.push(`昨天 ${y.answered} 题对 ${y.correct} 题（${acc}%），手感在线。`);
    } else {
      parts.push('昨天没上线？阿K当没看见，今天补上就成。');
    }
    const pending = plan.filter(b => !done.includes(b.subjectId));
    if (pending.length) {
      const b = pending[0];
      const name = (Store.subjects.find(s => s.id === b.subjectId) || {}).name || '';
      parts.push(`今天先办 ${b.mode}${name ? '：' + name : ''}。`);
    } else if (plan.length) {
      parts.push('今天的计划已经清完，想加练就自己挑一科。');
    }
    if (days > 0 && days <= 14) parts.push(`会考还有 ${days} 天，冲刺信号拉满。`);
    return parts.join('');
  },
  _hello(now) {
    const h = new Date(now || Date.now()).getHours();
    if (h < 5) return '这么晚还不睡？夜猫子属性拉满。';
    if (h < 11) return '早啊，把笔掏出来。';
    if (h < 14) return '中午好，干饭没？吃饱了脑子转得快。';
    if (h < 18) return '下午好，精神头还在线不？';
    return '晚上好，收个漂亮的尾再睡。';
  },

  // ===== 主动触发器（每条返回 { id, text } 或 null；不占额度，由 proactive 统一结算）=====
  // 临界遗忘：有生锈点就保养
  rusty(now) {
    let n = 0;
    for (const s of Store.subjects) n += Scheduler.pressure(s.id, now).rusty;
    if (!n) return null;
    return { id: 'rusty', text: `有 ${n} 个知识点开始生锈了——趁它没锈透，5 分钟保养一下？` };
  },
  // 考前 14/7/3 天提醒
  examReminder(now) {
    const days = Scheduler.examDaysLeft(now);
    if (![14, 7, 3].includes(days)) return null;
    return { id: 'exam', text: `会考只剩 ${days} 天了，冲刺模式该开了——今天主攻会考科。` };
  },
  // 周日晚：周报入口（AI 评语在阶段 2 第 5 项）
  weekly(now) {
    if (new Date(now).getDay() !== 0) return null;
    return { id: 'weekly', text: '周报已出炉，去「技能树」查账——看看这周点亮几盏灯。' };
  },
  // 超 48h 召回：lastActiveAt 为上次活跃时间戳（由 App 传入，不从「这次打开」读）
  recall(now, lastActiveAt) {
    if (!lastActiveAt || now - lastActiveAt < this.RECALL_MS) return null;
    return { id: 'recall', text: '几天没见，手生了吧？来一组找回手感。' };
  },
  // 里程碑：昨日点亮知识点 / 销号悬赏
  milestone(now) {
    const y = Store.dayStat(Store.todayKey(now - 86400000));
    if (y.litCount) return { id: 'milestone', text: `昨天点亮了 ${y.litCount} 个知识点，帅啊——今天乘胜追击？` };
    if (y.closures) return { id: 'milestone', text: `昨天销了 ${y.closures} 个悬赏，漂亮！悬赏榜又在召唤你了。` };
    return null;
  },
  // 每日待办提醒：到期悬赏 + 最该攻的点。数据由 App 传入（同 recall 的 recallAt），
  // 触发层只管「何时说、说什么」，不自己捞错题本与掌握度，便于独立测试
  todoReminder(now, todo) {
    const t = todo || {};
    const due = t.dueCount || 0;
    if (!due && !t.target) return null;
    const parts = [];
    if (due) parts.push(`${due} 道悬赏到期`);
    if (t.target) parts.push(`最该攻「${t.target.kp.name}」`);
    return { id: 'todo', text: `今日待办：${parts.join('，')}。先办完再玩最省时间，首页「今日待办」里能一键开练。` };
  },
  // 连错两题宽慰（练习流内触发，不占主动额度；冷笑话由笑话库提供，阶段 2 第 6 项）
  comfort() {
    return { id: 'comfort', text: '连着两题了，先降降难度找手感。深呼吸，这题是软柿子。' };
  },

  // 汇总结算：当前该主动说的全部消息（不占额度不落状态，交给调用方决定渲染哪条）
  // 优先级：生锈 > 考前 > 召回 > 里程碑 > 周报 > 待办
  // （前五条是偶发/时点事件，待办是每日常态，排最后兜底，保证偶发消息不被打扰）
  proactive(now, opts) {
    const o = opts || {};
    const msgs = [
      this.rusty(now),
      this.examReminder(now),
      this.recall(now, o.recallAt),
      this.milestone(now),
      this.weekly(now),
      this.todoReminder(now, o.todo),
    ].filter(Boolean);
    return msgs;
  },
};