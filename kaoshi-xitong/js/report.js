// 报告 v2：技能树点亮视图（游戏语言翻译层）+ 按章热力图 + 每日战报 + 用时分析
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

  // 溯源标签（技能树节点）：弱点显示根因点 / 需回炉的点（§5.5）
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
    for (const a of Store.attempts) {
      if (!a.timestamp || a.timestamp < cutoff) continue;
      if (a.errorType) out.attributions += 1;
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
        <h1>初二全科智能补习 · 本周战报</h1>
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

  // 触发浏览器打印（打印样式只输出本报告，其余界面隐藏）
  openPrintWeekly(now) {
    let area = document.getElementById('print-area');
    if (!area) {
      area = document.createElement('div');
      area.id = 'print-area';
      document.body.appendChild(area);
    }
    area.innerHTML = this.printWeeklyHTML(now);
    window.print();
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
        <h2>技能树总览</h2>
        <div class="overview-stats">
          <div class="stat"><span class="stat-num">${overall}</span><span class="stat-label">综合掌握度</span></div>
          <div class="stat"><span class="stat-num">${lit}<small>/${allLeaves.length}</small></span><span class="stat-label">已点亮技能</span></div>
          <div class="stat"><span class="stat-num">${bounty}</span><span class="stat-label">悬赏进行中</span></div>
        </div>
        <div class="exp-bar big"><div class="exp-fill" style="width:${overall}%"></div></div>
        <p class="muted">距离全部点亮还差 ${100 - overall}%——每亮一盏灯，都是实打实的进步。</p>
        <div class="session-actions"><button class="btn secondary" id="print-weekly">🖨 打印本周战报（给家长）</button></div>
      </div>`;

    html += this.battleCardHTML(now);
    html += this.weekCardHTML(now);
    html += '<div id="weekly-ai-slot"></div>';

    // 技能树：按科目分组、按章分块
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
    const pb = el.querySelector('#print-weekly');
    if (pb) pb.addEventListener('click', () => this.openPrintWeekly(now));
    // 技能节点 → 学习页（诊断-学-练一体，辅导主入口）
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
};

function kpName(id) {
  const kp = Store.knowledgePoints.find(k => k.id === id);
  return kp ? kp.name : id;
}
