# 主页版面重排设计（方案一 · 状态带置顶）

日期：2026-09-20
状态：已获用户批准（方案一）

## 1. 背景与问题

主页（practice 视图，`renderPractice`）当前从上到下的顺序：

1. 选科目卡（subjectBar + unitBar + 开练按钮）——占位第一却只是"调整项"
2. hero 卡——问候语当大标题，一卡塞六样（问候/口号/习惯条/待办/计划宫格/换组合）
3. 小游戏卡——奖励性收尾插在主流程中间
4. 会考横幅 `examHTML`——全 App 唯一的时间紧迫信息沉在最底

用户反馈：问候语提示（如"晚上好，收个漂亮的尾再睡"）位置太靠前，应放第二位并与会考信息组合；整体版面不合理。

## 2. 目标结构（从上到下）

1. **状态带**（一行细条，非卡片，`.status-strip`）
   - 内容：`🌙 晚上好，收个漂亮的尾再睡 · ⏳ 生地会考 N 天 · 🔥 本周 X/7 天 · 🛡️ 免死金牌 1 张`
   - 数据源全部复用：`Triggers.greeting(now, blocks, this.planDone)`、`Scheduler.examDaysLeft(now)`、`Scheduler.habit(now)`
   - 会考分级样式（沿用现有 level-cool/warm/hot 语义）：
     - `days > 14`：常态细条
     - `0 < days <= 14`：暖色/热色 + 「一键切考试模式」按钮（逻辑沿用现 `#exam-mode-on`）
     - 考试模式已开（`Scheduler.examModeOn()`）：变 🔥 冲刺条「考试模式：XX冲刺中」+「退出考试模式」按钮（沿用现 `#exam-mode-off`）
   - `days <= 0` 或无会考科目：状态带不显示会考段，只留问候+习惯
2. **今日待办横幅**：现有 `todayTodoHTML(now, sid)` 原样上移（无待办时不渲染）
3. **今日计划宫格**（主行动大卡）
   - 标题改为「📋 今日计划，点一块直接开练」
   - 计划块、`planDone` 标记、「🔄 换个组合」、无计划兜底按钮 `#start-session-fallback` 全部原样
   - 首块仍是 `#start-session`（E2E/习惯锚点不变）
4. **自选练习**（默认折叠的一行入口）
   - 收起态：一行 `⚙️ 自选科目 / 单元 ▾`（`.scope-toggle`）
   - 展开态：显示 `subjectBar()` + `unitBar(sid)` + `#start-manual` 开练按钮（逻辑完全复用）
5. **小游戏卡**：原样沉底（🎮 放松小游戏，周末彩蛋逻辑不变）

## 3. 改动范围

只动两处：

- `js/app.js` `renderPractice(el)`：重排 `el.innerHTML` 模板；新增 `statusStripHTML(now, habit, blocks)` 与 `scopePickerHTML(sid)` 两个私有渲染函数；新增折叠交互绑定
- 样式表：新增 `.status-strip`（含 level-cool/warm/hot 变体）与 `.scope-toggle` 两个类

不改：`Triggers`、`Scheduler`、`Quiz`、计划生成、选科/选单元逻辑、游戏逻辑、免死金牌弹窗（`habit.protect` 的 `Ui.popup` 保留原位置）。

## 4. 交互细节

- 折叠状态存内存 `this.scopeOpen`（默认 `false`），刷新即收起
- 展开/收起只切显隐（`style.display`），不重渲整页，避免丢失已选的科目/单元状态
- 「换个组合」`reroll-plan` 重渲后保持当前折叠态
- 展开态里点科目/单元 chips 仍走现有 `bindSubjectBar`/`bindUnitBar` 的重渲回调，重渲后保持展开态

## 5. 测试计划

- 底线：`node --test tests/*.test.js` 全绿（当前 269）
- 新增 2 条 `tests/app.test.js`：
  1. 主页渲染：首个元素是 `.status-strip`；计划宫格出现在自选区之前；选科目卡默认不渲染（折叠）
  2. 考试模式开启时：状态带渲染冲刺条并含「退出考试模式」按钮

## 6. 明确不做

- 不改问候语文案库 / 会考日期逻辑 / 习惯与免死金牌规则
- 不动其他视图（report / learn / wrongbook / assistant / tools / settings）
- 不做响应式重构与视觉风格改版（沿用现有卡片体系，仅新增两个类）
