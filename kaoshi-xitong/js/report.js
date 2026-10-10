// 报告 v2：知识树点亮视图（游戏语言翻译层）+ 按章热力图 + 每日战报 + 用时分析
// 规则来源：开发文档 §10.1 §11.5（「距离点亮还差X%」正向框架）
const Report = {
  effective(m, now) {
    return Mastery.decay(m || Mastery.default(), now).score;
  },

  tier(score) {
    if (score >= 85) return { key: 'lit', label: '已点亮', icon: '💡' };
    if (score >= 60) return { key: 'solid', label: '巩固中', icon: '🔥' };
    if (score >= 30) return { key: 'focus', label: '待突破', icon: '⚔️' };
    return { key: 'rebuild', label: '需回炉', icon: '🛠️' };
  },

  // 生锈：遗忘衰减掉 ≥15 分 → 图标变暗，提示「保养一下」
  rusted(m, now) {
    if (!m) return false;
    return m.score - Mastery.decay(m, now).score >= 15;
  },

  // 溯源标签（知识树节点）：弱点显示根因点 / 需回炉的点（§5.5）
  // 未测（无记录）不贴标签；根因即自身不贴标签
  diagTagHTML(kp, mastery, kpIndex) {
    const m = mastery[kp.id];
    if (!m || Mastery.isMastered(m)) return '';
    const diag = Mastery.diagnose(kp, mastery, kpIndex);
    if (Mastery.needsRelearn(diag)) return `<span class="skill-diag bad">🛠 回炉「${kpName(diag.root.id)}」</span>`;
    if (diag.root.id !== kp.id) return `<span class="skill-diag">🔍 根因：${kpName(diag.root.id)}</span>`;
    return '';
  },

  heatColor(score) {
    if (score >= 85) return 'var(--good)';
    if (score >= 60) return 'var(--mid)';
    if (score >= 30) return '#f0a8a8';
    return 'var(--bad)';
  },

  // L4 叶子 → 所属 L2 章（沿父链上溯）
  chapterOf(kp, kpIndex) {
    let node = kp;
    while (node && node.level > 2) node = kpIndex[node.parentId];
    return node || null;
  },

  // 章节聚合：L4 叶子加权平均分 + 点亮数
  chapters(now) {
    const kps = Store.knowledgePoints;
    const kpIndex = {};
    for (const k of kps) kpIndex[k.id] = k;
    const mastery = Store.mastery;
    const chapters = kps.filter(k => k.level === 2);
    return chapters.map(ch => {
      const leaves = kps
        .filter(k => k.level === 4 && this.chapterOf(k, kpIndex) && this.chapterOf(k, kpIndex).id === ch.id)
        .map(k => {
          const m = mastery[k.id] || null;
          const eff = this.effective(m, now);
          return { kp: k, m, eff, tier: this.tier(eff), rusted: this.rusted(m, now) };
        });
      const totalW = leaves.reduce((s, l) => s + (l.kp.weight || 3), 0);
      const score = totalW > 0
        ? Math.round(leaves.reduce((s, l) => s + (l.kp.weight || 3) * l.eff, 0) / totalW)
        : 0;
      return {
        chapter: ch, subjectId: ch.subjectId, leaves, score,
        litCount: leaves.filter(l => l.tier.key === 'lit').length,
        focusCount: leaves.filter(l => l.tier.key === 'focus' || l.tier.key === 'rebuild').length,
      };
    }).filter(ch => ch.leaves.length > 0);
  },

  // 下一个该攻的知识点：未掌握 L4 里抽题优先级最高者（复用 Mastery.priority，与考试冲刺取点同口径）
  // 传 subjectId 则限定在该科内（练完一科就地接着攻）；不传则在全部科目里挑（全局最优）
  nextTarget(now, subjectId) {
    let best = null;
    for (const kp of Store.knowledgePoints) {
      if (kp.level !== 4) continue;
      if (subjectId && kp.subjectId !== subjectId) continue;
      const m = Store.mastery[kp.id];
      if (m && Mastery.isMastered(m)) continue;
      const p = Mastery.priority(m || Mastery.default(), kp, now);
      if (p === -Infinity) continue;
      if (!best || p > best.p) best = { kp, p };
    }
    if (!best) return null;
    const m = Store.mastery[best.kp.id] || null;
    const eff = this.effective(m, now);
    return {
      kp: best.kp, eff,
      gap: Math.max(0, 85 - Math.round(eff)),
      tier: this.tier(eff),
      rusted: this.rusted(m, now),
    };
  },

  // 今日战报（报告页与练习收尾复用）
  battleCardHTML(now) {
    const st = Store.dayStat(Store.todayKey(now));
    if (!st.answered) {
      return `<div class="card battle"><h2>今日战报</h2><div class="empty">今天还没开张。晚饭后来一组，6 题就收工。</div></div>`;
    }
    const acc = Math.round(100 * (st.correct || 0) / st.answered);
    const rows = [
      `✅ 答题 ${st.answered} · 正确 ${st.correct || 0}（${acc}%）`,
      st.maxCombo ? `🔥 最高连击 ×${st.maxCombo}` : null,
      st.litCount ? `💡 点亮知识点 ${st.litCount}` : null,
      st.closures ? `🎯 悬赏销号 ${st.closures}` : null,
    ].filter(Boolean);
    return `<div class="card battle"><h2>今日战报</h2>${rows.map(r => `<div>${r}</div>`).join('')}</div>`;
  },

  // ===== 周维度 =====
  // 本周统计（近 7 天日累计：答题/正确/连击/点亮/销号 + 每日明细）
  // 对比分析 A1/A2：独立归因次数（答错自选错因）+ 高效学习秒数（S/A 级快速作答）
  weekStats(now) {
    const DAY = 86400000;
    const out = { answered: 0, correct: 0, maxCombo: 0, litCount: 0, closures: 0, attributions: 0, effSeconds: 0, days: [] };
    for (let i = 6; i >= 0; i--) {
      const key = Store.todayKey(now - i * DAY);
      const st = Store.dayStat(key);
      out.days.push({ key, ...st });
      out.answered += st.answered || 0;
      out.correct += st.correct || 0;
      out.maxCombo = Math.max(out.maxCombo, st.maxCombo || 0);
      out.litCount += st.litCount || 0;
      out.closures += st.closures || 0;
    }
    const cutoff = now - 6 * DAY;
    // A1 错因聚合：独立归因直接读错题记录的自选错因（attempts.errorType 恒为 null，此前统计恒为 0）
    for (const r of Store.wrongbook || []) {
      if (!r.firstWrongAt || r.firstWrongAt < cutoff) continue;
      if (r.errorType) out.attributions += 1;
    }
    for (const a of Store.attempts) {
      if (!a.timestamp || a.timestamp < cutoff) continue;
      if (a.correct === true && (a.rating === 'S' || a.rating === 'A')) out.effSeconds += a.actualTime || 0;
    }
    out.accuracy = out.answered ? Math.round(100 * out.correct / out.answered) : 0;
    return out;
  },

  // 周战报卡（报告页）:汇总行 + 7 天柱状趋势
  weekCardHTML(now) {
    const w = this.weekStats(now);
    if (!w.answered) {
      return `<div class="card battle"><h2>本周战报</h2><div class="empty">这周还没开张。每天一组 6 题，一周就是 40+ 题的积累。</div></div>`;
    }
    const rows = [
      `✅ 答题 ${w.answered} · 正确 ${w.correct}（${w.accuracy}%）`,
      w.maxCombo ? `🔥 最高连击 ×${w.maxCombo}` : null,
      w.litCount ? `💡 点亮知识点 ${w.litCount}` : null,
      w.closures ? `🎯 悬赏销号 ${w.closures}` : null,
    ].filter(Boolean);
    const maxDay = Math.max(1, ...w.days.map(d => d.answered));
    const bars = w.days.map(d => {
      const h = d.answered ? Math.max(6, Math.round(56 * d.answered / maxDay)) : 2;
      return `<div class="week-col"><div class="week-bar${d.answered ? '' : ' zero'}" style="height:${h}px"></div><span>${d.key.slice(5).replace('-', '/')}</span></div>`;
    }).join('');
    return `<div class="card battle"><h2>本周战报（近 7 天）</h2>
      <div class="week-body">
        <div class="week-rows">${rows.map(r => `<div>${r}</div>`).join('')}</div>
        <div class="week-bars">${bars}</div>
      </div></div>`;
  },

  // 周报叙事：把「数据罗列」翻译成三问三答（这周推进了什么 / 哪一类题还在卡 / 下周主攻哪个点）
  // 直击「不会梳理知识网、不知道哪类题不会」：点名知识点清单 + 顽固错题错因/根因 + 唯一下一步
  weekNarrativeHTML(now) {
    const w = this.weekStats(now);
    if (!w.answered) {
      return `<div class="card"><h2>📖 本周小结</h2><div class="empty">这周还没开张。先做一组，小结会自动出现在这里。</div></div>`;
    }
    const leaves = this.chapters(now).flatMap(c => c.leaves);
    const litNames = leaves.filter(l => l.tier.key === 'lit').map(l => l.kp.name);
    const solidNames = leaves.filter(l => l.tier.key === 'solid').map(l => l.kp.name);
    const nameList = (arr, cap) => arr.slice(0, cap).map(n => `「${n}」`).join('') + (arr.length > cap ? ` 等 ${arr.length} 个` : '');

    // ① 这周推进了什么
    const win = [];
    if (w.litCount > 0) win.push(`新点亮 <strong>${w.litCount}</strong> 个知识点`);
    win.push(`答题 <strong>${w.answered}</strong> 道、正确率 <strong>${w.accuracy}%</strong>`);
    if (w.closures > 0) win.push(`错题销号 <strong>${w.closures}</strong> 道`);
    const litLine = litNames.length ? `<div class="muted">已经亮着的点：${nameList(litNames, 8)}</div>` : '';
    const solidLine = solidNames.length ? `<div class="muted">还差一口气的：${nameList(solidNames, 6)}</div>` : '';

    // ② 哪一类题还在卡：顽固错题 → 自选错因聚类 → 先修根因
    const stubborn = Wrongbook.stubborn();
    const kpIndex = {};
    for (const k of Store.knowledgePoints) kpIndex[k.id] = k;
    let stuckLine;
    if (stubborn.length === 0) {
      stuckLine = '<div>这周没有反复卡住的题，稳。</div>';
    } else {
      const stuckNames = [...new Set(stubborn.map(r => kpName(r.knowledgePointId)))];
      const causeCount = {};
      for (const r of stubborn) if (r.errorType) causeCount[r.errorType] = (causeCount[r.errorType] || 0) + 1;
      const topCause = Object.keys(causeCount).sort((a, b) => causeCount[b] - causeCount[a])[0];
      const roots = new Set();
      for (const r of stubborn) {
        const kp = kpIndex[r.knowledgePointId];
        if (!kp) continue;
        const diag = Mastery.diagnose(kp, Store.mastery, kpIndex);
        if (Mastery.needsRelearn(diag)) roots.add(diag.root.name);
      }
      stuckLine = `<div>还有 <strong>${stubborn.length}</strong> 道题反复卡住，都在这些点：${nameList(stuckNames, 6)}。</div>`
        + (topCause ? `<div class="muted">错的类型集中在「${topCause}」——下次做题先盯住这一步。</div>` : '')
        + (roots.size ? `<div class="muted">往根上挖，可能卡在${nameList([...roots], 4)}，把这个先修点补牢比硬刷划算。</div>` : '');
    }

    // ③ 下周主攻哪个点
    const t = this.nextTarget(now);
    const nextLine = t
      ? `<div>下周主攻：<strong>${t.kp.name}</strong>，还差 <strong>${t.gap}%</strong> 点亮${t.rusted ? '（有点生锈，先保养一下）' : ''}。</div>`
      : '<div>知识树基本点亮，保持每天一组别让它回潮就行。</div>';

    return `<div class="card"><h2>📖 本周小结</h2>
      <div>① 这周推进了：${win.join('、')}。</div>
      ${litLine}${solidLine}
      <div style="margin-top:8px"><strong>② 哪一类还在卡</strong></div>
      ${stuckLine}
      <div style="margin-top:8px"><strong>③ 下周主攻</strong></div>
      ${nextLine}
    </div>`;
  },

  // 成绩汇报卡（学习汇报页）：最新一次考试/测验的各科成绩 + 班级/年级排名，并对比上一条的涨跌
  // 分数上升 / 名次前进 = 进步（绿色 ▲），反之红色 ▼
  gradeCardHTML() {
    const all = (Store.gradeReports || []).slice();
    if (all.length === 0) {
      return `<div class="card"><h2>📈 成绩与排名</h2><div class="empty">还没有成绩记录。去主页点「成绩汇报」，把最近一次考试或测验的各科分数、班级与年级排名填进去，这里就会开始跟踪变化。</div></div>`;
    }
    all.sort((a, b) => (a.date === b.date ? (a.createdAt || 0) - (b.createdAt || 0) : (a.date < b.date ? -1 : 1)));
    const cur = all[all.length - 1];
    const prev = all.length > 1 ? all[all.length - 2] : null;
    const subjects = Store.subjects.filter(s => !s.exam);
    // better 为正表示进步
    const deltaTag = (better) => better > 0
      ? ` <span class="up">▲${better}</span>`
      : better < 0 ? ` <span class="down">▼${-better}</span>` : ' <span class="muted">持平</span>';
    const scoreCell = (id) => {
      const v = cur.scores ? cur.scores[id] : null;
      if (v == null) return '<span class="muted">—</span>';
      if (!prev) return String(v);
      const p = prev.scores ? prev.scores[id] : null;
      return p == null ? String(v) : String(v) + deltaTag(v - p);
    };
    const rankCell = (key, label) => {
      const v = cur[key];
      if (v == null) return `${label} <span class="muted">—</span>`;
      if (!prev || prev[key] == null) return `${label} 第 ${v} 名`;
      return `${label} 第 ${v} 名${deltaTag(prev[key] - v)}`; // 名次变小 = 进步
    };
    const rows = subjects.map(s => `<tr><td>${s.name}</td><td>${scoreCell(s.id)}</td></tr>`).join('');
    const tail = prev ? '' : '<p class="muted">这是第一条记录——下次录入后，这里会显示每科的涨跌和班级、年级排名的变化。</p>';
    return `<div class="card"><h2>📈 成绩与排名 <span class="muted">最新：${cur.date}</span></h2>
      <table><thead><tr><th>科目</th><th>成绩${prev ? '（较上次）' : ''}</th></tr></thead><tbody>${rows}</tbody></table>
      <div style="margin-top:8px">${rankCell('classRank', '班级排名')} · ${rankCell('gradeRank', '年级排名')}</div>
      ${tail}
    </div>`;
  },

  // 各科综合掌握度（加权平均；打印周报与周视图共用）
  subjectSummary(now) {
    const bySub = {};
    for (const ch of this.chapters(now)) {
      if (!bySub[ch.subjectId]) bySub[ch.subjectId] = { subjectId: ch.subjectId, tw: 0, score: 0, lit: 0, total: 0 };
      const s = bySub[ch.subjectId];
      for (const l of ch.leaves) {
        const w = l.kp.weight || 3;
        s.tw += w; s.score += w * l.eff; s.total += 1;
        if (l.tier.key === 'lit') s.lit += 1;
      }
    }
    return Object.values(bySub).map(s => {
      const subj = Store.subjects.find(x => x.id === s.subjectId);
      return { subjectId: s.subjectId, name: subj ? subj.name : s.subjectId, score: s.tw ? Math.round(s.score / s.tw) : 0, lit: s.lit, total: s.total };
    }).sort((a, b) => b.score - a.score);
  },

  // 月度（近 30 天）战报累计：月度深度复盘的数据源（阶段 3 §13.4）
  monthStats(now) {
    const DAY = 86400000;
    const out = { answered: 0, correct: 0, closures: 0, lit: 0 };
    for (let i = 29; i >= 0; i--) {
      const st = Store.dayStat(Store.todayKey(now - i * DAY));
      out.answered += st.answered || 0;
      out.correct += st.correct || 0;
      out.closures += st.closures || 0;
      out.lit += st.litCount || 0;
    }
    out.accuracy = out.answered ? Math.round(100 * out.correct / out.answered) : 0;
    return out;
  },

  // ===== 阶段 3 收集与彩蛋卡（冷知识图鉴 / 赛季结算 / 学期回望 + 长期趋势）=====
  factsCardHTML() {
    const collected = Facts.collected();
    const byId = {};
    for (const f of Facts.BANK) byId[f.id] = f;
    const items = collected.map(id => byId[id]).filter(Boolean);
    const grid = items.length === 0
      ? '<div class="empty">还没掉过卡——答题答对时，有 20% 概率掉落一张冷知识卡（纯收集，不兑换任何东西）。</div>'
      : items.map(f => `<div class="fact-card">💠 ${f.text}</div>`).join('');
    return `<div class="card"><h2>💠 冷知识图鉴 <span class="muted">${items.length}/${Facts.BANK.length}</span></h2>${grid}</div>`;
  },

  seasonCardHTML(now) {
    const seasons = Store.seasons;
    const keys = Object.keys(seasons).sort();
    if (keys.length === 0) {
      const s = Scheduler.seasonOf(now);
      const label = s ? s.label : '本学期的赛季';
      return `<div class="card"><h2>🏆 赛季结算</h2><div class="empty">${label}还在进行中——到赛季末会结算一次「赛季战报」，看看这段投入产出。</div></div>`;
    }
    const cur = Scheduler.seasonOf(now);
    const rows = keys.map(k => {
      const s = seasons[k];
      const acc = s.answered ? Math.round(100 * s.correct / s.answered) : 0;
      const tag = cur && k === cur.key ? '进行中' : '已结算';
      return `<div class="season-row"><strong>${s.label} <span class="muted">（${tag}）</span></strong>
        <span class="muted">答题 ${s.answered} · 正确率 ${acc}% · 销号 ${s.closures} · 点亮 ${s.lit}</span></div>`;
    }).join('');
    return `<div class="card"><h2>🏆 赛季结算</h2>${rows}</div>`;
  },

  // 学期回望：整学期累计 + 长期趋势（月度归档）+ 图鉴/家长挑战彩蛋汇总
  termReviewCardHTML(now) {
    const start = new Date(Scheduler.termStart() + 'T00:00:00').getTime();
    const agg = Store.aggregateDayStats(start, now);
    const acc = agg.answered ? Math.round(100 * agg.correct / agg.answered) : 0;
    // 长期趋势：归档月度 + 当月实时
    const trend = Store.monthly.map(m => ({ ...m, cur: false }));
    const nowD = new Date(now);
    const curKey = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}`;
    const curAgg = Store.aggregateDayStats(new Date(curKey + '-01T00:00:00').getTime(), now);
    if (curAgg.answered > 0) trend.push({ key: curKey, answered: curAgg.answered, correct: curAgg.correct, closures: curAgg.closures, cur: true });
    const maxDay = Math.max(1, ...trend.map(t => t.answered));
    const bars = trend.length === 0
      ? '<div class="empty">数据还在积累——用满一个月后，这里会出现月度趋势。</div>'
      : `<div class="month-bars">${trend.map(t => `
          <div class="month-col${t.cur ? ' cur' : ''}" title="${t.key}：${t.answered} 题 / 对 ${t.correct}">
            <div class="month-bar" style="height:${Math.max(6, Math.round(48 * t.answered / maxDay))}px"></div>
            <span>${t.key.slice(2)}</span>
          </div>`).join('')}</div>`;
    const pcs = Store.parentChallenge;
    const win = pcs.filter(p => p.win).length;
    const pcLine = pcs.length > 0 ? `<div>👨‍👦 家长挑战 ${pcs.length} 局 · 儿子当裁判 ${pcs.length} 次 · 判赢 ${win} 局${pcs.length - win > 0 ? ` · 爸爸赢了 ${pcs.length - win} 局（欠债还钱，下次打回来）` : ''}</div>` : '';
    return `<div class="card" id="term-review-card"><h2>📖 学期回望</h2>
      <p>本学期累计：答题 <strong>${agg.answered}</strong> · 正确率 <strong>${acc}%</strong> · 销号 <strong>${agg.closures}</strong> · 点亮 <strong>${agg.lit}</strong></p>
      <div class="month-bars-wrap">${bars}</div>
      ${pcLine}
      <div class="session-actions"><button class="btn secondary" id="monthly-review-btn">📊 月度复盘（AI 蒸馏档案）</button></div>
      <div id="monthly-review-result"></div>
    </div>`;
  },

  // 打印版周报（给家长的一页纸：黑白打印友好，只呈现事实与正向建议）
  printWeeklyHTML(now) {
    const w = this.weekStats(now);
    const subj = this.subjectSummary(now);
    const stubbornCnt = Wrongbook.stubborn().length;
    const best = subj[0], worst = subj[subj.length - 1];
    const dayRows = w.days.map(d => {
      const acc = d.answered ? Math.round(100 * (d.correct || 0) / d.answered) + '%' : '—';
      return `<tr><td>${d.key}</td><td>${d.answered || 0}</td><td>${d.correct || 0}</td><td>${acc}</td></tr>`;
    }).join('');
    const subjRows = subj.map(s => `<tr><td>${s.name}</td><td>${s.score}</td><td>${s.lit}/${s.total}</td></tr>`).join('');
    return `
      <div class="pr-doc">
        <h1>开挂补习系统（初二、初三） · 本周战报</h1>
        <p class="pr-range">统计区间：${w.days[0].key} 至 ${w.days[6].key}</p>
        <h2>本周成果</h2>
        <ul>
          <li>累计答题 ${w.answered} 道，答对 ${w.correct} 道，正确率 ${w.accuracy}%</li>
          <li>新点亮知识点 ${w.litCount} 个；错题悬赏销号 ${w.closures} 道</li>
          ${w.attributions ? `<li>独立归因 ${w.attributions} 次——答错的题先自己判断错因，再对答案</li>` : ''}
          ${w.effSeconds >= 60 ? `<li>高效学习约 ${Math.round(w.effSeconds / 60)} 分钟（⚡S/A 级快速作答，不含磨蹭时间）</li>` : ''}
          ${w.maxCombo ? `<li>单次最高连击 ×${w.maxCombo}</li>` : ''}
          ${stubbornCnt ? `<li>另有 ${stubbornCnt} 道顽固错题正在回炉重学，属正常现象</li>` : ''}
        </ul>
        <h2>每日明细</h2>
        <table><thead><tr><th>日期</th><th>答题</th><th>答对</th><th>正确率</th></tr></thead><tbody>${dayRows}</tbody></table>
        <h2>各科掌握度（长期积累值，非本周分数）</h2>
        <table><thead><tr><th>科目</th><th>综合掌握度</th><th>已点亮</th></tr></thead><tbody>${subjRows}</tbody></table>
        <h2>给家长的话</h2>
        <p>本周孩子完成 ${w.answered} 道题，正确率 ${w.accuracy}%${best ? `，目前「${best.name}」状态最稳` : ''}${worst && subj.length > 1 && worst !== best ? `，「${worst.name}」还需要多一点耐心` : ''}。掌握度是长期曲线，不用催进度——周末让孩子讲一道他「点亮」的题给您听，讲得清楚就是真的学会了。</p>
        <p class="pr-note">本系统没有「拍照搜题」：答错的题先让孩子自己归因，再对解析；错题 3 天后原题重做、7 天后变式挑战，全过才销号。孩子用的每一步都在练「怎么想」，不是在抄答案。</p>
        <p class="pr-foot">本报告由系统根据本周练习数据自动生成。</p>
      </div>`;
  },

  // 打印版本周未解决错题清单（近 7 天产生、尚未销号的错题；黑白打印友好）
  printWrongsHTML(now) {
    const DAY = 86400000;
    const cutoff = now - 6 * DAY;
    const qIdx = Store.questionIndex();
    const typeName = { single: '单选', judge: '判断', multi: '多选', fill: '填空', subjective: '主观' };
    const fmtAns = (q, v) => {
      if (q && (q.type === 'single' || q.type === 'judge') && q.options) return q.options[Number(v)] || String(v);
      if (q && q.type === 'multi') return (Array.isArray(v) ? v : [v]).map(i => q.options[Number(i)]).join('　');
      return String(v == null || v === '' ? '（未作答）' : v);
    };
    const items = (Store.wrongbook || [])
      .filter(r => r.status !== '已销号' && r.firstWrongAt >= cutoff)
      .sort((a, b) => a.firstWrongAt - b.firstWrongAt);
    const rows = items.map((r, i) => {
      const q = qIdx[r.questionId];
      const subj = (Store.subjects.find(s => s.id === r.subjectId) || {}).name || '—';
      return `<div class="pr-q">
        <div class="pr-q-head">${i + 1}. ［${subj} · ${kpName(r.knowledgePointId)}］${typeName[q ? q.type : ''] || ''} · ${r.status}</div>
        <div>${q ? q.stem : '（题目已从题库移除）'}</div>
        <div>我的作答：${fmtAns(q, r.myAnswer)}　正确答案：${fmtAns(q, r.correctAnswer)}</div>
        ${q && q.explanation ? `<div>解析：${q.explanation}</div>` : ''}
      </div>`;
    }).join('');
    return `
      <div class="pr-doc">
        <h1>开挂补习系统（初二、初三） · 本周未解决错题</h1>
        <p class="pr-range">统计区间：${Store.todayKey(cutoff)} 至 ${Store.todayKey(now)}　共 ${items.length} 道</p>
        ${items.length ? rows : '<p>本周没有未解决的错题——答错的都走完闭环销号了，漂亮。</p>'}
        <p class="pr-note">这些是本周答错、还没走完「原题重做(D3) → 变式(D7)」闭环的题。让孩子每道讲一遍思路（哪里错、正确怎么想），讲得清楚就是真会了。</p>
        <p class="pr-foot">本清单由系统根据本周练习数据自动生成。</p>
      </div>`;
  },

  // 触发浏览器打印（打印样式只输出本报告，其余界面隐藏）
  openPrint(html) {
    let area = document.getElementById('print-area');
    if (!area) {
      area = document.createElement('div');
      area.id = 'print-area';
      document.body.appendChild(area);
    }
    area.innerHTML = html;
    window.print();
  },

  openPrintWeekly(now) {
    this.openPrint(this.printWeeklyHTML(now));
  },

  openPrintWrongs(now) {
    this.openPrint(this.printWrongsHTML(now));
  },

  // ===== 学课分析（教育测量学五维画像，Analysis 引擎）=====
  // 主因短标签（学习汇报横向对比表用）
  _issueLabel(key) {
    return { foundation: '基础不牢', transfer: '会背不会用', structure: '结构性缺口', fluency: '会但不熟', steady: '状态平稳' }[key] || '';
  },

  // 学习汇报接入卡：各科横向诊断 + 全局综合（覆盖度不足时提示）
  analysisCardHTML(now) {
    const a = Analysis.profileAll(now);
    if (!a.subjects.length) {
      return `<div class="card"><h2>🔬 学课分析</h2><div class="empty">分析数据还在积累——去「学习工具 → 学课摸底分析测试」做一次摸底，或先练几组题，这里会出各科的专业画像。</div></div>`;
    }
    const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const rows = a.subjects.map(s => {
      const r = s.rating;
      return `<tr><td>${esc(s.subjectName)}</td><td><span class="heat-chip" style="background:${this.heatColor(s.mastery.score)}">${s.mastery.score}</span></td><td>${r.label}</td><td>${esc(this._issueLabel(s.mainIssue.key))}</td></tr>`;
    }).join('');
    const o = a.overall;
    return `<div class="card"><h2>🔬 学课分析 <span class="muted">${o.rating.label} · 综合 ${o.score}</span></h2>
      <div class="overview-stats">
        <div class="stat"><span class="stat-num">${o.score}</span><span class="stat-label">加权掌握度</span></div>
        <div class="stat"><span class="stat-num">${Math.round(o.coverageRatio * 100)}<small>%</small></span><span class="stat-label">作答覆盖</span></div>
        <div class="stat"><span class="stat-num">${a.subjects.length}</span><span class="stat-label">已分析科目</span></div>
      </div>
      <table><thead><tr><th>科目</th><th>掌握度</th><th>评级</th><th>主因</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="muted">已作答 ${o.testedCount}/${o.leafCount} 个知识点${o.coverageRatio < 0.3 ? '——数据还偏少，结论仅供参考' : ''}。想细看某科，去「学习工具 → 学课摸底分析测试」做一次。</p>
    </div>`;
  },

  // 诊断报告·页面展示版（.card 结构；.pr-doc 只在打印区生效，不能用于页面展示）
  diagnosticHTML(p) {
    const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const pct = v => Math.round(v * 100) + '%';
    const dateStr = new Date(p.generatedAt).toLocaleDateString('zh-CN');
    const r = p.rating;
    const correctCount = p.tested - p.error.wrongCount;
    const chapterRows = p.chapters.map(c =>
      `<tr><td>${esc(c.name)}</td><td>${c.n}</td><td>${pct(c.acc)}</td><td><span class="heat-chip" style="background:${this.heatColor(c.score)}">${c.score}</span></td></tr>`).join('');
    const layerRows = p.cognitive.byLayer.map(l =>
      `<tr><td>${l.layer}</td><td>${l.total}</td><td>${pct(l.acc)}</td></tr>`).join('');
    const rootItems = p.roots.length
      ? `<div class="session-actions">${p.roots.map(x => `<button class="btn secondary" data-kp="${x.kpId}">🛠 ${esc(x.name)} → 先补「${esc(x.rootName)}」</button>`).join('')}</div>`
      : '<div class="muted">暂无需要回炉重建的点。</div>';
    const weakChips = p.weakPoints.length
      ? p.weakPoints.slice(0, 8).map(w => `<span class="heat-chip" style="background:${this.heatColor(w.eff)}">${esc(w.name)} ${w.eff}</span>`).join(' ')
      : '<span class="muted">没有明显薄弱点。</span>';
    const adviceItems = p.advice.items.map(a => `<li>${esc(a)}</li>`).join('');
    const parentNote = `孩子对「${esc(p.subjectName)}」的掌握程度属于「${r.label}」（${p.mastery.score} 分）。${esc(p.advice.headline)} 不用催进度——掌握度是长期曲线，重点是陪他把上面提到的短板一个个补上，讲得清楚就是真会了。`;

    return `
      <div class="card overview">
        <h2>🔬 ${esc(p.subjectName)}·学课摸底分析报告 <span class="muted">${dateStr}</span></h2>
        <p class="muted">本次作答 ${p.tested} 题、答对 ${correctCount} 题。${esc(p.mainIssue.text)}</p>
        <div class="overview-stats">
          <div class="stat"><span class="stat-num">${p.mastery.score}</span><span class="stat-label">掌握度 · ${r.label}</span></div>
          <div class="stat"><span class="stat-num">${p.tested}<small>/${p.totalLeaves}</small></span><span class="stat-label">已测知识点</span></div>
          <div class="stat"><span class="stat-num">${pct(p.coverage.ratio)}</span><span class="stat-label">覆盖度 · ${p.coverage.label}</span></div>
        </div>
        <div class="session-actions">
          <button class="btn secondary" id="diag-print">🖨 打印报告</button>
          <button class="btn secondary" id="diag-retest">🔄 重新测试</button>
          <button class="btn secondary" id="diag-back">← 返回</button>
        </div>
      </div>
      <div class="card"><h2>① 分章掌握</h2>
        <table><thead><tr><th>章节</th><th>已测</th><th>答对率</th><th>掌握度</th></tr></thead><tbody>${chapterRows}</tbody></table>
      </div>
      <div class="card"><h2>② 认知层级</h2>
        <p class="muted">低层（记忆·理解）是「记得住」，高层（应用·分析）是「用得出」。${p.cognitive.gap >= 0.3 ? '两层差距偏大，属会背不会用。' : '两层比较均衡。'}</p>
        <table><thead><tr><th>层级</th><th>题数</th><th>正确率</th></tr></thead><tbody>${layerRows}</tbody></table>
      </div>
      <div class="card"><h2>③ 熟练度</h2>
        <p>答对题用时中位数约为标准用时的 <strong>${p.fluency.samples ? pct(p.fluency.median) : '—'}</strong>（${p.fluency.levelLabel}）。${p.fluency.level === 'slow' ? '会但不熟，练到自动化才算真会。' : '速度在合理区间。'}</p>
      </div>
      <div class="card"><h2>④ 错误结构</h2>
        ${p.error.wrongCount
          ? `<p>本次答错 <strong>${p.error.wrongCount}</strong> 道${p.error.concentrated ? '，且高度集中在「' + esc(p.error.clusters[0].name) + '」——结构性缺口。' : '，分布较分散。'}</p>`
          : '<p>本次全部答对，没有发现明显错误点。</p>'}
      </div>
      <div class="card"><h2>⑤ 薄弱点与回炉清单</h2>
        <p>${weakChips}</p>
        <p class="muted" style="margin-top:8px">需要回炉重建先修的点（点一下直接去学）：</p>
        ${rootItems}
      </div>
      <div class="card"><h2>📋 下一步建议</h2>
        <p><strong>${esc(p.advice.headline)}</strong></p>
        <ul>${adviceItems}</ul>
      </div>
      <div class="card"><h2>👨‍👩‍👧 给家长的话</h2>
        <p>${parentNote}</p>
      </div>`;
  },

  // 诊断报告·打印版（.pr-doc 结构，黑白打印友好）
  printDiagnosticHTML(p) {
    const dateStr = new Date(p.generatedAt).toLocaleDateString('zh-CN');
    const correctCount = p.tested - p.error.wrongCount;
    const chapterRows = p.chapters.map(c =>
      `<tr><td>${c.name}</td><td>${c.n}</td><td>${Math.round(c.acc * 100)}%</td><td>${c.score}</td></tr>`).join('');
    const rootLines = p.roots.length
      ? p.roots.map(x => `<li>「${x.name}」→ 先补「${x.rootName}」</li>`).join('')
      : '<li>暂无</li>';
    const adviceLines = p.advice.items.map(a => `<li>${a}</li>`).join('');
    return `
      <div class="pr-doc">
        <h1>开挂补习系统（初二、初三） · ${p.subjectName}学课摸底分析报告</h1>
        <p class="pr-range">生成时间：${dateStr}</p>
        <h2>结论摘要</h2>
        <ul>
          <li>综合掌握度：${p.mastery.score} 分（${p.rating.label}）</li>
          <li>本次测试 ${p.tested} 题、答对 ${correctCount} 题（覆盖 ${p.tested}/${p.totalLeaves} 个知识点，${p.coverage.label}）</li>
          <li>主要问题：${p.mainIssue.text}</li>
        </ul>
        <h2>分章掌握</h2>
        <table><thead><tr><th>章节</th><th>已测</th><th>答对率</th><th>掌握度</th></tr></thead><tbody>${chapterRows}</tbody></table>
        <h2>认知层级（低层=记得住，高层=用得出）</h2>
        <ul>${p.cognitive.byLayer.map(l => `<li>${l.layer}：${l.total} 题，正确率 ${Math.round(l.acc * 100)}%</li>`).join('')}</ul>
        <h2>熟练度</h2>
        <p>答对题用时中位数约为标准用时的 ${p.fluency.samples ? Math.round(p.fluency.median * 100) + '%' : '—'}（${p.fluency.levelLabel}）。</p>
        <h2>回炉清单</h2>
        <ul>${rootLines}</ul>
        <h2>下一步建议</h2>
        <ul>${adviceLines}</ul>
        <h2>给家长的话</h2>
        <p>孩子对「${p.subjectName}」的掌握程度属于「${p.rating.label}」（${p.mastery.score} 分）。${p.advice.headline} 不用催进度——掌握度是长期曲线，重点是陪他把短板一个个补上，讲得清楚就是真会了。</p>
        <p class="pr-note">本报告基于作答数据自动生成：掌握度 = 正确率×用时×指数遗忘；认知层级按布鲁姆分类（记忆/理解/应用/分析）统计；根因沿先修链下钻定位。所有计算都在本机完成，不联网。</p>
        <p class="pr-foot">本报告由系统根据练习数据自动生成。</p>
      </div>`;
  },

  openPrintDiagnostic(p) {
    this.openPrint(this.printDiagnosticHTML(p));
  },

  render(el) {
    const now = Date.now();
    const mastery = Store.mastery;
    const kpIndex = {};
    for (const k of Store.knowledgePoints) kpIndex[k.id] = k;
    const questions = Store.questions;
    const attempts = Store.attempts;
    const chapters = this.chapters(now);

    // 总览
    const allLeaves = chapters.flatMap(c => c.leaves);
    const totalW = allLeaves.reduce((s, l) => s + (l.kp.weight || 3), 0);
    const overall = totalW > 0
      ? Math.round(allLeaves.reduce((s, l) => s + (l.kp.weight || 3) * l.eff, 0) / totalW) : 0;
    const lit = allLeaves.filter(l => l.tier.key === 'lit').length;
    const bounty = Wrongbook.active().length;

    let html = `
      <div class="card overview">
        <h2>知识树总览</h2>
        <div class="overview-stats">
          <div class="stat"><span class="stat-num">${overall}</span><span class="stat-label">综合掌握度</span></div>
          <div class="stat"><span class="stat-num">${lit}<small>/${allLeaves.length}</small></span><span class="stat-label">已点亮知识点</span></div>
          <div class="stat"><span class="stat-num">${bounty}</span><span class="stat-label">悬赏进行中</span></div>
        </div>
        <div class="exp-bar big"><div class="exp-fill" style="width:${overall}%"></div></div>
        <p class="muted">距离全部点亮还差 ${100 - overall}%——每亮一盏灯，都是实打实的进步。</p>
      </div>`;

    // 知识树：按科目分组、按章分块
    const jumpSubjects = [];
    for (const ch of chapters) if (!jumpSubjects.includes(ch.subjectId)) jumpSubjects.push(ch.subjectId);
    html += '<div class="subject-jump-bar">'
      + jumpSubjects.map(id => {
        const s = Store.subjects.find(x => x.id === id);
        return `<button class="subject-jump" data-jump="subj-${id}">${s ? s.name : id}</button>`;
      }).join('')
      + '<button class="subject-jump" data-jump="term-review-card">📖 学期回望</button>'
      + '</div>';

    let curSubject = null;
    for (const ch of chapters) {
      if (ch.subjectId !== curSubject) {
        curSubject = ch.subjectId;
        const subj = Store.subjects.find(s => s.id === curSubject);
        html += `<div class="subject-head" id="subj-${curSubject}">${subj ? subj.name : ''}${subj && subj.exam ? ' · 会考' : ''}</div>`;
      }
      html += `
        <div class="card chapter">
          <div class="chapter-head">
            <h2>${ch.chapter.name}</h2>
            <span class="heat-chip" style="background:${this.heatColor(ch.score)}">${ch.score}</span>
            <span class="muted">${ch.litCount}/${ch.leaves.length} 点亮</span>
          </div>
          <div class="skill-grid">`;
      for (const l of ch.leaves) {
        const gap = Math.max(0, 85 - Math.round(l.eff));
        const sub = l.tier.key === 'lit' ? '已点亮' : `差 ${gap}% 点亮`;
        html += `
          <div class="skill-node tier-${l.tier.key}${l.rusted ? ' rusted' : ''} clickable" data-kp="${l.kp.id}" title="${l.kp.name}：点进去学（微课+例题+专项练）">
            <span class="skill-icon">${l.rusted ? '🔧' : l.tier.icon}</span>
            <span class="skill-name">${l.kp.name}</span>
            <span class="exp-bar"><span class="exp-fill" style="width:${Math.round(l.eff)}%"></span></span>
            <span class="skill-sub">${l.rusted ? '生锈了，保养一下' : sub}</span>
            ${l.tier.key === 'lit' ? '' : this.diagTagHTML(l.kp, mastery, kpIndex)}
            <span class="skill-go">去学习 →</span>
          </div>`;
      }
      html += `</div></div>`;
    }

    // 用时分析（会但不熟练）
    html += '<div class="card"><h2>用时分析</h2>';
    const slow = [];
    for (const a of attempts) {
      if (a.correct !== true) continue;
      const q = questions.find(x => x.id === a.questionId);
      if (q && q.expectedTime > 0 && a.actualTime > q.expectedTime * 1.5) {
        slow.push({ kp: (kpName(q.knowledgePointId) || ''), q: q.stem, actual: a.actualTime, expected: q.expectedTime });
      }
    }
    if (slow.length === 0) {
      html += '<div class="empty">暂无「会但不熟练」的题。答对但用时超过标准 1.5 倍的题会出现在这里。</div>';
    } else {
      html += '<p class="muted">答对但用时超过标准 1.5 倍 = 会但不熟练，练到自动化（⚡S 级）才算真会。</p><table><thead><tr><th>知识点</th><th>题目</th><th>实际</th><th>标准</th></tr></thead><tbody>';
      for (const s of slow) {
        html += `<tr><td>${s.kp}</td><td>${s.q}</td><td>${Math.round(s.actual)}s</td><td>${s.expected}s</td></tr>`;
      }
      html += '</tbody></table>';
    }
    html += '</div>';

    // 阶段 3 收集与彩蛋：冷知识图鉴 + 赛季结算 + 学期回望（含长期趋势 + 月度复盘入口）
    Scheduler.recordSeason(now);
    html += this.factsCardHTML();
    html += this.seasonCardHTML(now);
    html += this.termReviewCardHTML(now);

    el.innerHTML = html;
    // 知识节点 → 学习页（诊断-学-练一体，辅导主入口）
    el.querySelectorAll('.skill-node[data-kp]').forEach(node => {
      node.addEventListener('click', () => App.openLearn(node.dataset.kp));
    });
    // 科目跳转条：42 屏的长页面里，先跳到目标科目再逐章看
    el.querySelectorAll('.subject-jump').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = el.querySelector('#' + btn.dataset.jump);
        if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  },

  // 学情记忆审计（DeepTutor A4）：只读视图，展示系统记住了什么（错因清单 / 掌握度来源 / 销号记录）
  // 全走本地规则：掌握度 = 正确率×用时×指数遗忘；错因 = 孩子自选归因；销号 = D0→D3→D7 走完
  memoryAudit() {
    const kpIndex = {};
    for (const k of Store.knowledgePoints) kpIndex[k.id] = k;
    const wb = Store.wrongbook || [];
    const mastery = Store.mastery || {};
    const name = id => (kpIndex[id] && kpIndex[id].name) || id;

    // 错因清单：按自选错因聚合（只统计选过错因的记录）
    const causeCount = {}, causeKps = {};
    for (const r of wb) {
      if (!r.errorType) continue;
      causeCount[r.errorType] = (causeCount[r.errorType] || 0) + 1;
      (causeKps[r.errorType] = causeKps[r.errorType] || new Set()).add(name(r.knowledgePointId));
    }
    const causes = Object.keys(causeCount).map(k => ({
      key: k, count: causeCount[k], kps: [...causeKps[k]].slice(0, 4),
    }));

    // 销号记录：最近 5 条
    const closed = wb.filter(r => r.status === '已销号');
    const recentClosures = closed.slice(-5).reverse().map(r => ({
      name: name(r.knowledgePointId),
      at: r.closedAt ? new Date(r.closedAt).toISOString().slice(0, 10) : '—',
    }));

    // 掌握度来源：条目数 / 已点亮（≥85）/ 薄弱 Top5（按分升序，界面显示还会按遗忘曲线衰减）
    const entries = Object.entries(mastery).filter(([, m]) => m && typeof m.score === 'number');
    const lit = entries.filter(([, m]) => m.score >= 85).length;
    const weak = entries
      .filter(([, m]) => m.score < 85)
      .sort((a, b) => a[1].score - b[1].score)
      .slice(0, 5)
      .map(([id, m]) => ({ name: name(id), score: m.score }));

    return {
      causes,
      closedCount: closed.length, recentClosures,
      masteryCount: entries.length, litCount: lit, weak,
      attemptsCount: (Store.attempts || []).length,
      lessonCount: Object.keys(Store.lessons || {}).length,
      exportedAt: new Date().toISOString(),
    };
  },
};

function kpName(id) {
  const kp = Store.knowledgePoints.find(k => k.id === id);
  return kp ? kp.name : id;
}
