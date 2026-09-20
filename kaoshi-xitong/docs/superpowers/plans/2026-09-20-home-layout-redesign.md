# 主页版面重排实现计划（方案一 · 状态带置顶）

> **For agentic workers:** 按 Task 顺序逐条执行，每步含可验证命令。全部完成后 `node --test tests/*.test.js` 必须全绿（现有 269 + 新增 2 = 271）。

**Goal:** 重排主页（practice 视图）信息层级：状态带置顶 → 今日待办 → 今日计划宫格 → 自选折叠 → 小游戏沉底。

**Architecture:** 只改 `js/app.js` 的 `renderPractice` 模板与新增两个私有渲染函数，加两个 CSS 类。逻辑（Triggers/Scheduler/Quiz/游戏）零改动。

**Tech Stack:** 纯前端 HTML + 原生 ES2020，node --test 单测（FakeEl stub）。

**依据:** `docs/superpowers/specs/2026-09-20-home-layout-redesign-design.md`（已批准）

---

## 文件地图

| 文件 | 改动 |
|---|---|
| `js/app.js` | L31 附近加 `scopeOpen: false`；L437-447 的 `examHTML` 逻辑删除并入新函数；`renderPractice` 模板重排；新增 `statusStripHTML` / `scopePickerHTML`；新增折叠绑定 |
| `css/app.css` | L290（`.exam-banner` 块之后）新增 `.status-strip`（含 level-cool/warm/hot 变体）与 `.scope-toggle` |
| `tests/app.test.js` | 末尾新增 2 条测试 |

---

### Task 1: 新增失败测试（TDD 先行）

**Files:**
- Modify: `tests/app.test.js`（文件末尾追加）

- [ ] **Step 1: 追加 2 条测试**

```js
// ================= 主页版面重排（方案一 · 状态带置顶）=================
function freshHome(seedOverrides) {
  mockLS._d = {};
  Store.init({ ...SEED, ...(seedOverrides || {}), settings: { aiKey: 'k', assistantName: '阿K' } });
  App.session = null;
  App.dailyPlan = null;
  App.planSalt = 0;
  App.planDone = [];
  App.scopeOpen = false;
}

test('主页重排：首个元素是状态带，计划宫格在自选区之前，自选默认折叠不渲染选科卡', () => {
  freshHome();
  const el = new FakeEl('root');
  App.renderPractice(el);
  const html = el.innerHTML;
  const iStrip = html.indexOf('class="status-strip');
  const iPlan = html.indexOf('plan-grid');
  const iScope = html.indexOf('scope-toggle');
  assert.ok(iStrip !== -1, '应渲染状态带');
  assert.ok(html.slice(0, iStrip).trim() === '', '状态带应是首个元素');
  assert.ok(iPlan !== -1 && iPlan > iStrip, '计划宫格应在状态带之后');
  assert.ok(iScope !== -1 && iScope > iPlan, '自选折叠入口应在计划宫格之后');
  assert.ok(!html.includes('pick-subject'), '折叠态不渲染选科卡内容');
  assert.ok(html.includes('id="start-session"'), '首块仍是 #start-session');
});

test('主页重排：考试模式已开时状态带变冲刺条并含退出按钮', () => {
  freshHome({ subjects: [{ id: 'bio', name: '生物', exam: true }] });
  Store.settings = { ...Store.settings, examMode: 'bio' };
  const el = new FakeEl('root');
  App.renderPractice(el);
  const html = el.innerHTML;
  const strip = html.slice(html.indexOf('class="status-strip'), html.indexOf('plan-grid'));
  assert.ok(strip.includes('level-hot'), '冲刺条应为 level-hot');
  assert.ok(strip.includes('冲刺中'), '应显示冲刺文案');
  assert.ok(strip.includes('id="exam-mode-off"'), '应含退出考试模式按钮');
});
```

说明：科目 `exam` 字段是布尔（见 `js/data.js` L7-14），会考日期在 `Store.settings.examDate`（缺省用 `Scheduler.DEFAULT_EXAM_DATE`）。考试模式测试走 `examModeOn()` 短路，与天数无关。最小 seed 下 `Scheduler.plan` 必返回 ≥1 块（无作答时默认科摸底块，scheduler.js L190-196），故测试 1 的 `id="start-session"` 断言稳定。

- [ ] **Step 2: 跑测试确认失败**

Run: `cd /Users/bin/Downloads/ai/补习系统/kaoshi-xitong && node --test tests/app.test.js`
Expected: 新增 2 条 FAIL（`status-strip` 不存在），原有测试不受影响（renderPractice 未被其他测试调用）。

- [ ] **Step 3: Commit**

```bash
git add tests/app.test.js
git commit -m "test: 主页重排 TDD 失败测试（状态带置顶 + 自选折叠）"
```

---

### Task 2: `statusStripHTML` 与 `scopePickerHTML` + `scopeOpen` 状态

**Files:**
- Modify: `js/app.js:30-31`（App 状态字段区）
- Modify: `js/app.js`（`renderPractice` 之后或 `todayTodoHTML` 附近新增两个方法）

- [ ] **Step 1: 加 `scopeOpen` 状态字段**

`js/app.js` L30-31 区域，在 `planDone` 行后加一行：

```js
  planDone: [],     // 今日计划里已练完的科目（内存态）
  scopeOpen: false, // 主页自选科目/单元区折叠态（内存态，刷新即收起）
```

- [ ] **Step 2: 新增 `statusStripHTML` 方法**

放在 `renderPractice` 之后（原 `examHTML` 逻辑整体迁入，含按钮 id `#exam-mode-on` / `#exam-mode-off` 不变）：

```js
  // 状态带（主页首行细条）：问候 + 会考倒计时/冲刺 + 本周习惯 + 免死金牌
  // 会考分级沿用 exam-banner 的 level-cool/warm/hot 语义；按钮 id 不变（事件绑定复用）
  statusStripHTML(now, habit, blocks) {
    const parts = [Triggers.greeting(now, blocks, this.planDone)];
    const days = Scheduler.examDaysLeft(now);
    const examSub = Store.subjects.find(s => s.exam);
    let cls = 'level-cool';
    let btn = '';
    if (Scheduler.examModeOn()) {
      const es = Store.subjects.find(s => s.id === Scheduler.examModeId());
      parts.push(`🔥 考试模式：${es ? es.name : ''}冲刺中`);
      cls = 'level-hot';
      btn = `<button class="btn secondary small" id="exam-mode-off">退出考试模式</button>`;
    } else if (examSub && days > 0 && days <= 14) {
      parts.push(`⏳ ${examSub.name}会考还有 <strong>${days}</strong> 天`);
      cls = days <= 7 ? 'level-hot' : 'level-warm';
      btn = `<button class="btn secondary small" id="exam-mode-on">一键切考试模式</button>`;
    } else if (days > 0 && days <= 365) {
      parts.push(`⏳ 生地会考还有 <strong>${days}</strong> 天`);
    }
    parts.push(habit.effective >= 7 ? '🏆 本周 7/7 全勤' : `🔥 本周 ${habit.effective}/7 天`);
    parts.push(habit.shieldUsed ? '🛡️ 免死金牌已用' : '🛡️ 免死金牌 1 张');
    return `<div class="status-strip ${cls}">${parts.map(p => `<span class="strip-item">${p}</span>`).join('<span class="strip-sep">·</span>')}${btn}</div>`;
  },
```

- [ ] **Step 3: 新增 `scopePickerHTML` 方法**

内容即原选科目卡（标题/提示语/`subjectBar`/`unitBar`/`#start-manual` 全部原样搬入）：

```js
  // 自选练习区（默认折叠，展开才渲染）：选科 + 选单元 + 手动开练，逻辑全部复用
  scopePickerHTML(sid) {
    return `<div class="card pick-subject">
      <h2>📚 选择练习科目，选一科直接开</h2>
      <p class="muted">点一科选中它，再选「学到哪本 / 哪单元」限定出题范围，然后开练。</p>
      ${this.subjectBar()}
      ${this.unitBar(sid)}
      <div class="session-actions">
        <button class="btn glow" id="start-manual">开练（当前科目）</button>
      </div>
    </div>`;
  },
```

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat: 新增 statusStripHTML/scopePickerHTML 与 scopeOpen 状态"
```

---

### Task 3: 重排 `renderPractice` 模板 + 折叠绑定

**Files:**
- Modify: `js/app.js:421-535`（renderPractice 主体）

- [ ] **Step 1: 替换模板与绑定**

在 `renderPractice` 中：

1. **删除** L436-447 的 `examHTML` 相关代码（`let examHTML = ''` 整段 if/else 与末尾模板里的 `${examHTML}`），逻辑已迁入 `statusStripHTML`。
2. **保留** `habit.protect` 的 `Ui.popup` 段（L432-435）原样不动。
3. **替换** `el.innerHTML` 模板（原 L451-491）为：

```js
    el.innerHTML = `
      ${this.statusStripHTML(now, habit, blocks)}
      ${this.todayTodoHTML(now, sid)}
      <div class="card hero">
        <h2>📋 今日计划，点一块直接开练</h2>
        <p class="muted">${COPY.sessionStart}</p>
        <div class="plan-grid">
          ${blocks.map((b, i) => `
            <button class="plan-block mode-${modeCls[b.mode] || 'break'}${i === 0 ? ' primary' : ''}" id="${i === 0 ? 'start-session' : ''}" data-plan="${b.subjectId}">
              <span class="plan-tag">${modeIcon[b.mode] || '⚔️'} ${b.mode}</span>
              <span class="plan-subject">${subjName(b.subjectId)}</span>
              <span class="plan-reasons">${b.reasons.join(' · ')}</span>
              <span class="plan-count">${b.count} 题 · 约 15 分钟（含讲解）${this.planDone.includes(b.subjectId) ? ' · ✅ 已完成' : ''}</span>
            </button>`).join('')}
        </div>
        <div class="session-actions">
          ${blocks.length === 0 ? '<button class="btn big glow" id="start-session-fallback">开整（6 题一组，含讲解约 15 分钟）</button>' : ''}
          <button class="btn secondary" id="reroll-plan">🔄 换个组合</button>
        </div>
      </div>
      <button class="scope-toggle" id="scope-toggle">⚙️ 自选科目 / 单元 ${this.scopeOpen ? '▴' : '▾'}</button>
      <div id="scope-area"${this.scopeOpen ? '' : ' style="display:none"'}>${this.scopeOpen ? this.scopePickerHTML(sid) : ''}</div>
      <div class="card">
        <h2>🎮 放松小游戏</h2>
        <p class="muted">游戏是奖励性收尾——练完再玩。闪电心算回流计算掌握度；单词快闪答错的词会自动进复习队列。</p>
        <div class="session-actions">
          <button class="btn secondary" id="game-arith">⚡ 闪电心算 60s</button>
          <button class="btn secondary" id="game-flash">📚 单词快闪</button>
          ${dueWords > 0 ? `<button class="btn secondary" id="game-flash-review">🔁 单词复习（${dueWords} 个到期）</button>` : ''}
          ${isWeekend ? `<button class="btn secondary" id="parent-challenge">👨‍👦 家长挑战（周末彩蛋）</button>` : ''}
        </div>
      </div>`;
```

注意：原 hero 卡里的问候语 `<h2>${Triggers.greeting(...)}</h2>`、`.tagline`、`.habit-strip` 三行删除（问候/习惯已进状态带，tagline 随 hero 卡一起退场）。

4. **折叠绑定**：在 `this.bindUnitBar(...)` 之后加：

```js
    // 自选区折叠：展开态懒渲染内容，之后只切显隐不重渲（保住已选科目/单元）
    el.querySelector('#scope-toggle').addEventListener('click', () => {
      this.scopeOpen = !this.scopeOpen;
      const area = el.querySelector('#scope-area');
      const tgl = el.querySelector('#scope-toggle');
      if (this.scopeOpen && !area.innerHTML) {
        area.innerHTML = this.scopePickerHTML(sid);
        this.bindSubjectBar(area, () => { this.scopeOpen = true; this.renderPractice(el); });
        this.bindUnitBar(area, sid, () => { this.scopeOpen = true; this.renderPractice(el); });
        area.querySelector('#start-manual').addEventListener('click', async () => {
          const btn = area.querySelector('#start-manual');
          if (btn.disabled) return;
          btn.disabled = true;
          const added = await this.ensureScopeQuestions(6, (i, n) => { btn.textContent = `正在出题 ${i}/${n}…`; });
          if (added > 0) btn.textContent = `已补 ${added} 题，开练…`;
          this.session = Quiz.planSession(Date.now());
          this.renderStage(el);
        });
      }
      area.style.display = this.scopeOpen ? '' : 'none';
      tgl.textContent = `⚙️ 自选科目 / 单元 ${this.scopeOpen ? '▴' : '▾'}`;
    });
```

5. **守卫 `#start-manual` 绑定**：原 L509 的 `el.querySelector('#start-manual').addEventListener(...)` 改为条件绑定（折叠态下该按钮不存在）：

```js
    const startManual = el.querySelector('#start-manual');
    if (startManual) startManual.addEventListener('click', async () => { /* 原函数体原样 */ });
```

FakeEl 注意：测试 stub 的 `querySelector` 对任何选择器都返回 FakeEl（不返回 null），故测试环境不会因守卫跳过绑定；真实浏览器折叠态返回 null 被正确跳过。两条路径都安全。

6. **首屏展开态绑定**：`renderPractice` 顶部已有的 `bindSubjectBar(el, ...)` / `bindUnitBar(el, ...)` 保持原样（scopeOpen 时 scopePicker 内容在主模板里，这两个绑定照常生效）。重渲回调已会保 scopeOpen（内存态不清零）。

- [ ] **Step 2: 跑全部测试**

Run: `cd /Users/bin/Downloads/ai/补习系统/kaoshi-xitong && node --test tests/*.test.js`
Expected: 271 passing（269 原有 + 2 新增），0 failing。

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: 主页重排——状态带置顶、计划宫格提前、自选折叠、小游戏沉底"
```

---

### Task 4: CSS `.status-strip` 与 `.scope-toggle`

**Files:**
- Modify: `css/app.css:290`（`.exam-banner` 块结束之后插入）

- [ ] **Step 1: 新增样式**

```css
/* 主页状态带（一行细条，非卡片）：问候 + 会考 + 习惯 + 免死金牌 */
.status-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 10px;
}
.status-strip .strip-item strong { font-size: 18px; line-height: 1; font-variant-numeric: tabular-nums; }
.status-strip .strip-sep { opacity: 0.4; }
.status-strip .btn { margin-left: auto; }
.status-strip.level-cool { background: rgba(56, 189, 248, 0.14); border: 1px solid rgba(56, 189, 248, 0.4); color: #075985; }
.status-strip.level-warm { background: rgba(251, 146, 60, 0.18); border: 1px solid rgba(251, 146, 60, 0.5); color: #9a3412; }
.status-strip.level-hot {
  background: rgba(248, 113, 113, 0.2);
  border: 1px solid rgba(248, 113, 113, 0.6);
  color: #991b1b;
  animation: pulseHot 1.6s ease infinite;
}

/* 自选练习折叠入口（一行文本按钮，非卡片） */
.scope-toggle {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: 1px dashed rgba(7, 89, 133, 0.35);
  border-radius: 10px;
  padding: 10px 14px;
  margin: 12px 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #075985;
  cursor: pointer;
}
.scope-toggle:hover { background: rgba(56, 189, 248, 0.08); }
```

说明：`.exam-banner` 原样式保留不删（报告页等别处若引用不受影响；主页已不再渲染它，属本改动产生的孤立样式，但不删——留给后续清理确认）。

- [ ] **Step 2: 浏览器目检**

本地服务已在跑：打开 http://localhost:8000 看主页：状态带在最顶 → 待办 → 计划宫格 → 折叠行 → 小游戏。点折叠行展开选科卡、选科目开练、🔄换个组合后折叠态保持。

- [ ] **Step 3: Commit**

```bash
git add css/app.css
git commit -m "style: 新增 .status-strip 与 .scope-toggle"
```

---

## 自审记录

- Spec 覆盖：状态带（Task 2/3）、待办上移（Task 3 模板顺序）、计划宫格标题与锚点（Task 3）、自选折叠（Task 2/3）、小游戏沉底（Task 3）、CSS 两类（Task 4）、2 条测试（Task 1）——全覆盖。
- 占位符：无。
- 命名一致：`statusStripHTML` / `scopePickerHTML` / `scopeOpen` / `#scope-toggle` / `#scope-area` 全文一致。
- 明确不做（spec §6）：问候文案库、会考逻辑、其他视图、响应式改版——计划内均未触碰。
