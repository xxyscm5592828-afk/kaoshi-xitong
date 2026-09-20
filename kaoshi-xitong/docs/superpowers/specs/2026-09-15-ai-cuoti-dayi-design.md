# AI 错题答疑 · 设计文档

- 日期：2026-09-15
- 上游文档：`docs/superpowers/plans/2026-09-15-chuer-quanke-buxi.md`（§8 教学语言、§9 AI 学长、§13 阶段 2、§14 技术风险）
- 本次工作令：**先接 AI 做错题答疑，再铺满讲义**
- 本轮范围：只做「错题答疑」。模糊问答、微课 AI 生成、变式题生成、周报评语、笑话库、触发器系统**不在本轮**。

---

## 1. 目标与成功标准

**目标**：孩子做错题 → 归因 → 看完静态解析 → 仍不懂时，能问到「学长」，用初二男生听得懂的话把这一道题讲明白，且不破坏 D0→D3→D7 销号闭环。

**成功标准**

1. 无 Key 时：全部核心功能（练习/技能树/悬赏榜/讲义）照旧可用，答疑入口给出「去设置里填 Key」引导，**不发任何网络请求**。
2. 有 Key 时：三个入口都能问到；同一题最多追问 6 轮；回答符合六律、只讲本题知识点。
3. 任何异常（超时/401/429/截断/空回复）都**不会给孩子看到空白或英文报错**，一律降级为可重试的中文提示或回退静态解析。
4. 答疑过程**不改动** `Wrongbook` 记录的生命周期字段；「懂了，继续」仍走原来的 `markUnderstood` → 微课/下一步。
5. 现有 52 单测 / 31 E2E 全绿；新增 AI 层单测不联网。

---

## 2. 已确认的决策

| 决策项 | 结论 |
|---|---|
| Provider | DeepSeek（OpenAI 兼容接口） |
| 默认模型 | `deepseek-flash` |
| 调用位置 | **浏览器直连**（已验证 CORS 放行，无需后端代理） |
| 入口 | 练习中内联 + 悬赏榜每条记录 + **新增全局「问学长」导航页** |
| 对话形态 | **多轮，但单题封顶 6 轮** |
| Key 存放 | 仅浏览器 localStorage（设置页填写）；**不写入仓库任何文件** |

---

## 3. 实测结论（设计依据，非假设）

| 验证项 | 结果 | 对设计的影响 |
|---|---|---|
| `GET /models` | 200，含 `deepseek-flash` / `deepseek-v4-pro` | 模型名可用；可做「测试连接」 |
| `max_tokens: 120` | `content: ""`，`finish_reason: "length"`，内容全在 `reasoning_content` | **必须 `max_tokens ≥ 900`** |
| `max_tokens: 900` | `finish_reason: "stop"`，content 34 字，reasoning_tokens 136 | 正文能正常返回 |
| CORS 预检 | `access-control-allow-origin: http://localhost:8899`，放行 POST / authorization / content-type | 浏览器可直连 |
| 单次成本 | prompt ≈50 + completion ≈157（含 136 隐藏推理） | 30 次/日 ≈ 6k tokens/日 |

> `deepseek-flash` 是**推理模型**：字数被推理吃掉时会返回空正文。所以 **`finish_reason` 必须校验**，否则孩子会看到空白答案。

---

## 4. 架构

新增两个文件 + 改动三个已有文件。**不新建 UI 文件**——上游文档 §3 的文件清单只列了 `ai.js` / `assistant.js`，UI 归 `app.js`（其定位就是「主控路由 + UI」）。

| 文件 | 职责 | 硬约束 |
|---|---|---|
| `js/ai.js`（新） | 纯调用层：拼 URL、带鉴权、超时、错误码归一、每日限额 | 零业务、零 DOM、零中文文案 |
| `js/assistant.js`（新） | 人设 + 上下文组装 + prompt 构造：`buildWrongContext` / `SYSTEM_PROMPT` / `askWrong` | 零 DOM |
| `js/app.js`（改） | `renderAskPanel()` 答疑面板 + `renderAssistant()` 全局聊天页 + `show()` 增分支 + 练习/悬赏榜两处挂按钮 | 文案在 UI 层 |
| `index.html`（改） | 导航加「问学长」，脚本加 `ai.js` / `assistant.js`（在 `app.js` 前） | — |
| 设置页（`app.js` 内） | 补 `dailyAiLimit` 输入 + 「测试连接」按钮 | 已有 base/model/key 三项，不重做 |

### 调用链

```
练习答错
  → 归因（选错因类型）
  → 静态解析（现有）
  → ［还是不懂，问学长］            ← 新增按钮（练习中 / 悬赏榜 D0）
       → buildWrongContext(rec, q)   ← 本地拼装，0 token
       → SYSTEM_PROMPT（人设 + 六律 + 硬约束）
       → AI.chat({ messages, maxTokens: 900 })
       → 渲染回答 + 快捷追问条
            ［换个讲法］［再讲细点］［出道类似的］［懂了］
       → 追问同题累计 ≤ 6 轮
  → ［懂了］→ Wrongbook.markUnderstood(rec.id) → 原本的 D3/D7 流程不变
```

「出道类似的」本轮**只做引导话术**（提示去重做），不生成新题——变式题生成属于后续阶段，避免超范围。

---

## 5. `js/ai.js` 接口

```js
AI.chat({ messages, maxTokens = 900, temperature = 0.7 })
// → { ok: true, text, usage }
// → { ok: false, error: 'noKey' | 'quota' | 'truncated' | 'badKey' | 'rateLimited' | 'timeout' | 'network' | 'http', status? }

AI.hasKey()          // bool
AI.quota(now)        // { date, used, limit, left }
AI.testConnection()  // 发一条最小请求，给设置页用
```

要点：

- 读 `Store.settings`（`aiBaseUrl` / `aiModel` / `aiKey` / `dailyAiLimit`）。
- URL 拼接容忍结尾斜杠；默认 `https://api.deepseek.com`。
- `AbortController` 30s 超时。
- **先校验 `res.ok`，再校验 `choices[0].finish_reason === 'stop'` 且 `message.content.trim()` 非空**；否则 `ok: false`。
- 每日限额：`Store.settings.aiQuota = { date, used }`，跨天自动归零；`dailyAiLimit` 默认 30。超限返回 `quota`，UI 降级为「今天问学长的次数用完了，先去把题重做一遍」。
- 无 Key：直接返回 `noKey`，**不发请求**。

---

## 6. `js/assistant.js` 接口

```js
Assistant.name()                       // settings.assistantName || '阿K'
Assistant.buildWrongContext(rec, q)    // 本地字符串：题目/正确答案/他的答案/知识点名/错因/掌握度
Assistant.askWrong(rec, q, history)    // → AI.chat 的返回值
Assistant.SYSTEM_PROMPT                // 人设 + 六律 + 硬约束
```

**人设**：学长「阿K」，损友学长腔——懂梗、不说教、敢自嘲、永远站在孩子这边（§9.2）。名字可改。

**六律**（§8.3，写死进 prompt）：先说人话再上术语 / 一个类比打头 / 例题只用最小数字 / 每句一个新概念 / 类比源限定初二男生世界（游戏·打球·零花钱·乐高）/ 承认难度。

**硬约束**（写死进 prompt）：

- 只讲这一道题涉及的知识点，超纲内容不展开；
- 只讲初二范围内的方法；
- 不确定就直说「这个我不太确定」；
- **不评价孩子的能力**（§9.6 红线：只记模式和有效策略，不记能力判断）；
- 回答 ≤ 250 字，不堆术语。

**上下文来源**（零额外成本，全部本地已有数据）：题目与解析（`Store.questionIndex()`）、孩子的答案与错因（`Wrongbook` 记录）、知识点名与掌握度（`Store.kpIndex()` / `Store.mastery`）。

**对话状态**：只在内存里（面板级 state），**不落库**。刷新即重置——单题 6 轮是即时答疑，不需要跨会话记忆；这样最简，也不污染存储结构。

---

## 7. 三个入口

1. **练习中答错**：在现有「看懂了，继续」旁加「还是不懂，问学长」。
2. **悬赏榜 D0 补处理**：在现有解析块旁加同一个按钮。
3. **全局「问学长」导航页**（新增 view `assistant`）：空白起手的聊天页，可自由提问；仍可携带最近一条错题作为上下文。

前两处共用同一个 `renderAskPanel(zone, rec, q, onDone)`；全局页复用同一套发送/渲染逻辑，只是没有预置错题。

---

## 8. 异常与降级

| 情况 | 判定 | 孩子看到的 |
|---|---|---|
| 没填 Key | `AI.hasKey()` 为假 | 「学长还没上线，去『设置』里填一下 AI Key」+ 跳转按钮 |
| 正文为空 / `finish_reason === 'length'` | `truncated` | 「学长想太久了，再来一次」+ 重试 |
| 401 / 403 | `badKey` | 「Key 好像不对，去设置里检查一下」 |
| 429 | `rateLimited` | 静默回退到静态解析 + 「学长正忙，先看解析」 |
| 30s 超时 | `timeout` | 「网有点慢，再点一次试试」 |
| 超过每日限额 | `quota` | 「今天问学长的次数用完了，先去把题重做一遍」 |
| 网络异常 / 其他 HTTP | `network` / `http` | 一句话中文提示 + 保留静态解析 |

**原则：任何分支都不出现空白回答、不出现英文报错、不阻断练习。**

---

## 9. 测试计划

**`tests/ai.test.js`**（mock `fetch`，不联网）

- 无 Key → 返回 `noKey` 且 `fetch` **零调用**；
- 请求体断言：model 正确、`max_tokens ≥ 900`、`messages` 结构正确、带 `Authorization`；
- `finish_reason: 'length'` → `truncated`；`content: ''` → `truncated`；正常 → `ok: true`；
- 401/403 → `badKey`；429 → `rateLimited`；
- 超时 → `timeout`（AbortController 生效）；
- 每日限额：第 31 次被拦为 `quota`；跨天自动归零。

**`tests/assistant.test.js`**

- `buildWrongContext` 含题目/正确答案/他的答案/知识点名/错因；
- `SYSTEM_PROMPT` 含六律六条 + 人设 + 不评价能力的红线；
- `askWrong` 会透传正确的 `messages`（system + 上下文 + 历史）；
- 零 DOM 依赖（能直接在 `new Function` 沙箱里跑）。

**回归**：`node --test tests/*.test.js`（52 → 预期 ≥ 65）；E2E 31 条保持全绿；视觉抽检 19 条保持全绿。

---

## 10. 本轮不做（明确划界）

- 模糊问答三步流水线（§9.4）
- 微课 AI 生成 / 换讲法迭代
- 变式题生成（「出道类似的」只给引导话术）
- 周报 AI 评语、周度档案蒸馏
- 笑话库、触发器系统（开工问候/考前提醒等）
- Phase 3：`scheduler.js`、小游戏、冷知识图鉴

---

## 11. 阶段 B：铺满讲义（本设计之后执行）

现状：637 个知识点节点中已有 45 个讲义叶（各科 5–10 个，均为优先叶）。

阶段 B 目标：把讲义覆盖率从 45 个叶扩到**全部 L4 诊断叶中有错题风险的叶**，先覆盖地理/生物（会考）与英语（外研）、数学八下、物理。

阶段 B 的规模与是否引入 AI 辅助生成，待阶段 A 交付后再单独定方案——**不在本设计内承诺**。

---

## 12. 风险与对策

| 风险 | 对策 |
|---|---|
| 推理模型返回空正文 | `max_tokens ≥ 900` + 强制校验 `finish_reason` 与空串 |
| Key 泄露 | 只存 localStorage；不进仓库；已提醒轮换 |
| 答题节奏被打断（答疑面板过长） | 单题 6 轮硬上限；面板可随时「懂了，继续」退出 |
| 孩子问到超纲内容 | prompt 硬约束 + 全局页兜底回答「这超出初二范围了」 |
| 答疑改坏销号闭环 | 答疑**只读**记录，不写 `Wrongbook`；销号仍走原 `markUnderstood` |

---

**审批状态**：待用户确认。
