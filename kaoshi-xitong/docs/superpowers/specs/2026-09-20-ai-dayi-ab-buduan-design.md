# 错题本 × AI 答疑补强（A+B）设计文档

- 日期：2026-09-20
- 项目：初二全科智能补习系统（纯前端 SPA，HTML5 + CSS3 + 原生 JS，无构建、无后端，数据存 localStorage，前缀 `tutor.`）
- 上游文档：[2026-09-15-ai-cuoti-dayi-design.md](./2026-09-15-ai-cuoti-dayi-design.md)（AI 错题答疑基础链路，已实现）

---

## 1. 背景与目标

### 1.1 现状核查（2026-09-20）

「错题本 → AI 答疑」链路在**代码层已经完整接通**，不是从零开始：

- 悬赏榜 `renderWrongbook` → 「去处理」→ `renderD0Flow`（自选错因）→ 有 Key 走 `renderSocratic`（三问引导，第三问本地判分）、无 Key 走 `showExplain` → 两处都有「还是不懂，问学长」→ `renderAskPanel`。
- 练习中答错：`zone` 内联 `explainCardHTML` + `#ask-slot` → `renderAskPanel`。
- 全局页 `renderAssistant` 复用同一个 `renderAskPanel`（`rec/q` 传 null）。
- `ai.js`（配额 / 超时 / 错误分类）与 `assistant.js`（人设 / 六律 / 各生成器）均已完整；`wrongbook.js` 的 D0→D3→D7 销号闭环在场。
- `node --test tests/*.test.js` = 265 pass / 0 fail。

### 1.2 两处真实缺口（本轮范围）

- **A｜没有逐题逐步解法。**
  题库 679 道题每道只有一个字段 `explanation`（一句话）。`explainCardHTML`（app.js L982-996）注释写明「题库没有逐题步骤数据，这里只讲知识点与答案依据，不假装给逐步解法」。`renderSocratic` 是苏格拉底式点拨，**刻意**不给完整解法。于是「揭晓时刻想看清完整步骤」目前无路可走（只能开问学长聊天，且每问一次扣一次额度）。
- **B｜「出道类似的」是假的。**
  `renderAskPanel` 的 `[data-similar]` 处理（app.js L1750-1756）只 push 一句引导话术「出题得翻题库，我现编容易带偏……」，**从未调用**项目里已有的 `Assistant.genVariant` / `genReal`。这与「趁热打铁」里真实可用的「AI 原创题」能力（app.js L1184-1196）不一致。

### 1.3 明确不做（本轮）

- 不给 679 道题手工补写步骤数据。
- 不改判分 / 错因归一 / 销号 / 掌握度逻辑。
- 不改样式（复用既有 `muted` / `chat-err` / `btn secondary small` 类，不新增 CSS）。
- 不验证真实 DeepSeek Key（另议）。
- 不做缓存淘汰 / 版本失效（679 题上限，体量可忽略）。

### 1.4 成功标准

1. 讲解卡上能一键拿到分步骤解法；**同一道题第二次点不再扣额度**（读缓存）。
2. 「出道类似的」真的照原题生成一道同知识点、同题型的新题，并写入题库。
3. 降级不变：无 Key → 不出现按钮；超时 / 截断 / 解析失败 → 中文提示，**不新增崩溃路径**。
4. `node --test tests/*.test.js` 全绿，且新增覆盖 A 的单测。

---

## 2. A 设计：逐题逐步解法（按题缓存）

### 2.1 分层

沿用既有约定——**`assistant.js` 只负责构造 prompt 与调 `AI.chat`，不碰 DOM**；**`storage.js` 是唯一持久化入口**；**`app.js` 负责按钮与渲染**。

### 2.2 `storage.js`：新增缓存键

照现有 `lessonState` / `dayStats` 的写法，新增一个键 `solutionCache`（结构 `{ [questionId]: 步骤文本 }`）：

- getter / setter 各一行（放在 `lessonState` 一带）。
- 在 `init(seed)` 里补 `this._write('solutionCache', {});`（这样 `reset()` 清库后会一并重建，不会残留脏缓存）。

### 2.3 `assistant.js`：新增 `solveSteps`

- 新增 `solveStepsPrompt(q, kp, answer)`：仿 `buildWrongContext` 的「拼事实」风格，产出
  `【题目】【选项】【正确答案】【他写的答案】【知识点】【教材解析（可参考，要用你自己的话说）】`，
  末尾追加要求：**分 3~5 步、每步另起一行、以「第1步：」开头、每步只说一件事、最后给一个自查动作**。
- 新增 `solutionOf(qId)`：`return (Store.solutionCache || {})[qId] || '';`（供 UI 判断该显示按钮还是缓存内容）。
- 新增 `async solveSteps(q, kp, answer)`：
  1. `const cached = this.solutionOf(q.id); if (cached) return { ok:true, text:cached, cached:true };`
     —— **命中缓存时绝不调用 `AI.chat`**，因此不扣额度（`AI.chat` 若被调用，成功即 `_bumpQuota`）。
  2. 否则 `AI.chat({ messages:[{role:'system',content: system},{role:'user',content:this.solveStepsPrompt(...)}], maxTokens: 1200 })`。
  3. `if (!res.ok) return res;`（沿用所有生成器的返回约定；`noKey` / `quota` / `truncated` / `timeout` 原样透传）。
  4. 成功：写 `Store.solutionCache`（`const c = Store.solutionCache||{}; c[q.id] = text; Store.solutionCache = c;`），返回 `{ ok:true, text }`。

  返回 **纯文本**（不返回 JSON）：解法只要一段可渲染文字，走 JSON 反而多一个解析失败分支，且无结构化消费方——这是本轮「简洁优先」的关键取舍。

- **system 沿用 `SYSTEM_PROMPT`（阿K 人设 + 六律），只追加一段模式说明**，与 `askWrong` 的 `hintFirst` 是同一套做法：
  > 逐步解题模式：这次要给他完整解法，一步一步来，每步一行、以「第N步：」开头，共 3~5 步；为讲清步骤，本次长度可放宽到 400 字；仍不用 Markdown 标题与代码块。
  （`SYSTEM_PROMPT` 原文「全文 250 字以内」对分步解法过紧，故在本模式内放宽；这是本设计唯一需要「覆盖」硬约束的地方，已在 prompt 里显式声明。）

- `maxTokens: 1200`：`deepseek-flash` 是推理模型，`max_tokens` 过低会导致正文为空（`truncated`），1200 与 `genVariant` 同档。

### 2.4 `app.js`：按钮与渲染

- `explainCardHTML`（L984-996）末尾追加一个槽位 `<div id="solve-slot">${this.solveSlotHTML(q, answer)}</div>`。
- 新增 `solveSlotHTML(q, answer)`（**只读**，无副作用）：
  - 有缓存 → 渲染步骤文本（用局部 `esc` 转义后把 `\n` 换 `<br>`，与 `answerCompareHTML` 一致的转义写法）。
  - 无缓存且 `!AI.hasKey()` → 返回 `''`（**降级：不出现按钮**）。
  - 无缓存且有 Key → `<button class="btn secondary small" id="solve-btn">让${Assistant.name()}逐步讲这道题</button>`。
- 新增 `wireSolveCard(root, q, answer)`：`root.querySelector('#solve-btn')` 存在才绑 click；点击后
  槽位先显示「正在想步骤……」→ `await Assistant.solveSteps(q, Store.kpIndex()[q.knowledgePointId], answer)`
  → 失败用 `<div class="chat-err">${AI_MSG[res.error] || AI_MSG.http}</div>`（复用既有错误文案表）→ 成功后用 `solveSlotHTML` 重渲染（此时已命中缓存）。
- 在**三处** explain 卡插入点各补一行 `wireSolveCard`：
  1. 练习答错（L1123-1129，容器 `zone`）：`this.wireSolveCard(zone, q, answer);`
  2. D0 看解析（L1489-1500，容器 `el`）：`this.wireSolveCard(el, q, rec.myAnswer);`
  3. 追问降级页（L1557-1570，容器 `el`）：`this.wireSolveCard(el, q, rec.myAnswer);`

  三处均为「插入 HTML 后绑监听」的既有节奏，改动各一行。

---

## 3. B 设计：接上「出道类似的」

改 `renderAskPanel` 内 `[data-similar]` 的 click 处理（app.js L1750-1756，**唯一改动点**）：

1. 先把这句提示语修正——它现在是**假话**（明明能调 `genVariant`）。
2. `history.push({ role:'user', content:'出道类似的题我再练练' })`，然后：
   - **`!q`（全局页自由提问）**：这时没有原题可仿，push 一句指导性回复（「得先有原题我才好照着变，去错题本点开一道题，那儿有『出道类似的』」）→ `draw(false)`。**不调用 AI**。
   - **有 `q`**：`draw(true)` → `await Assistant.genVariant(q, Store.kpIndex()[q.knowledgePointId])`：
     - 失败（`noKey`/`quota`/`truncated`/`parse`/`timeout`…）：push 一条 `AI_MSG[res.error] || AI_MSG.http` 的助手气泡 → `draw(false)`。**不崩溃**。
     - 成功：`Store.addQuestion({ ...res.question, knowledgePointId: q.knowledgePointId, groupId: q.groupId || '', groupRole: 'variant' })`（与 `genFollowUp` L1190-1192 完全一致，题真正入库），再 push 一条助手气泡给题面（题干 + `A. … B. …` 选项，**单行、用「，」分隔**——聊天气泡是 `esc()` 纯文本渲染，不依赖换行）→ `draw(false)`。

### 3.1 两个需要点明的取舍

- **用 `genVariant` 而不是 `genReal`。** 「类似的」= 同知识点、同题型、换数字与情境，正是 `variantPrompt` 的语义；`genReal` 是「真题卷命题口吻」这一另一种口味。这也与「趁热打铁」里「AI 原创题 → `genVariant`」对齐。
- **不把新题插进当前练习会话。** `genFollowUp` 会额外 `Quiz.insertRemedial(this.session, kpId)`，但答疑面板有三种宿主（练习反馈 / 悬赏榜 D0 / D3·D7 / 全局页），后几种下 `this.session` 可能是过期会话，硬插会污染练习流。本轮只 `addQuestion` 入库（新题进入题库，之后会被练习抽到），不做会话插入。**这是刻意的范围收缩**，若日后需要「立刻在这组里做到」，再单独评估。

### 3.2 额度说明

点一次「出道类似的」= 一次真实生成调用 = 扣 1 次额度（与「AI 原创题」一致）。这与 A 的「缓存命中不扣额度」是两件事，不要混淆。

---

## 4. 降级对照表（不变式）

| 场景 | A（逐步解法） | B（出道类似的） |
| --- | --- | --- |
| 无 AI Key | 按钮不渲染（`solveSlotHTML` 返回 `''`） | 气泡提示「得先有原题…」/ 失败文案，零网络请求 |
| 有 Key、无缓存 | 显示按钮；点击后走 `AI.chat` | 走 `genVariant` |
| 有 Key、命中缓存 | 直接渲染步骤，**不调 `AI.chat`、不扣额度** | 不适用（题目不去重） |
| 超时 / 网络错 | `AI_MSG[err]` 中文提示，可再点 | `AI_MSG[err]` 中文提示 |
| 截断 / 解析失败 | `AI_MSG.truncated` / `parse` | `parse` 提示，不入库 |
| 空文本 | `ai.js` 已判 `truncated`，不落缓存 | 不入库 |

---

## 5. 测试计划

沿用 `tests/assistant.test.js` 既有骨架（`fs.readFileSync` + `new Function('localStorage','fetch', src)` + `mockLS` + `fetchStub`）。新增：

1. **`solveSteps` 正常路径**：`fetchContent` 设为含「第1步」的文本 → 断言 `res.ok === true`、`res.text` 含该内容、`lastBody.messages[1].content` 含题面关键词（如 `【题目】`）。
2. **缓存命中不扣额度**：`fresh()` → 记 `AI.quota().left` → 第一次 `solveSteps` → 断言 `Store.solutionCache['q1']` 非空、额度 -1 → 改 `fetchContent` 为另一段文本 → 再调 `solveSteps` → 断言 `res.cached === true`、`res.text` 仍是第一次的内容、额度**未再变**。
3. **无 Key 降级**：`fresh({...})` 去掉 `aiKey` → `solveSteps` 返回 `{ ok:false, error:'noKey' }`。
4. **解析/空文本**：`fetchStub` 返回 `content:''` 且 `finish_reason:'stop'` → `ai.js` 判 `truncated`，`solveSteps` 返回 `{ ok:false, error:'truncated' }`，且**不写缓存**。

B 是 DOM 交互（`renderAskPanel`），既有单测骨架无 DOM，不做单测；改由人工/dogfood 走查覆盖（点「出道类似的」→ 出题入库 / 无 Key 时中文提示）。

验收命令：`node --test tests/*.test.js`（预期 265 + 新增用例，全绿）。

---

## 6. 影响文件清单

| 文件 | 改动 |
| --- | --- |
| `js/storage.js` | 新增 `solutionCache` getter/setter；`init()` 补一行初始化 |
| `js/assistant.js` | 新增 `solveStepsPrompt` / `solutionOf` / `solveSteps`（+ 逐步解题模式的 system 说明） |
| `js/app.js` | `explainCardHTML` 加 `#solve-slot`；新增 `solveSlotHTML` / `wireSolveCard`；三处插入点各加一行 `wireSolveCard`；改写 `[data-similar]` 处理 |
| `tests/assistant.test.js` | 新增 4 组 `solveSteps` 用例 |

不改：`index.html`、CSS、`ai.js`、`wrongbook.js`、`quiz.js` 及任何 `data-*.js`。
