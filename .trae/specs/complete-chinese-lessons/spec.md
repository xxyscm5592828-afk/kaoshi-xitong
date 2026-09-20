# 补齐语文微课（讲义全覆盖）Spec

## Why
项目「初二全科智能补习系统」已完成阶段 0–3，dogfood 16 个问题全部修复，265 个单元测试全绿。
实测微课覆盖率：8 科 336 个 L4 叶节点中 289 个有微课，覆盖 86.0%。
**唯一缺口是语文学科：52 个叶只有 5 个有微课（覆盖 10%），缺 47 个**；其余 7 科均为 100%。
这正是设计文档《2026-09-15-ai-cuoti-dayi-design.md》§11「阶段 B：铺满讲义」的目标——把讲义覆盖率从部分叶扩到全部 L4 诊断叶。
缺微课的叶一旦被诊断出，学生点「看微课」会无内容可看，学习闭环断开。

## What Changes
- 在 `js/data-chinese.js` 的 `lessons` 对象中，为 **47 个缺微课的 L4 叶节点**各补写 **2 个版本**的六段式微课。
- 内容与同文件、同结构（与已完成的 5 个语文微课、以及历史/政治已补齐的微课保持完全一致的写法与字段结构）。
- 不改动任何题目、知识点、已有的 5 个语文微课，也不改动其他学科文件。
- 语文微课覆盖率 5/52 → **52/52**；全科覆盖率 289/336 → **336/336（100%）**。

## Impact
- Affected specs: 微课/讲义能力（LESSONS 数据契约）；诊断→微课学习闭环。
- Affected code: `js/data-chinese.js`（仅 `lessons` 对象新增条目）；数据校验由 `tests/data.test.js` 覆盖。
- 不涉及：`js/*.js` 其它逻辑文件、`index.html`、`css/app.css`、测试文件。

## 背景数据（实测，勿臆测）
- 8 科、637 知识点、679 题、289 微课；L4 叶合计 336。
- 语文缺微课的 47 个叶（八上 24 个 + 八下 23 个）：
  - 八上：`chn8a-p1 p2 p3 p4 p5 p6 p7 p8 p11 p12 p13 p14 p15 p16 p18 p19 p20 p21 p22 p23 p24 p25 p27 p28`
  - 八下：`chn8b-p1 p2 p3 p4 p5 p6 p7 p8 p9 p10 p11 p12 p13 p15 p16 p17 p18 p19 p20 p21 p22 p23 p24`
- 语文已有微课的 5 个叶（不动）：`chn8a-p9 chn8a-p10 chn8a-p17 chn8a-p26 chn8b-p14`

## ADDED Requirements

### Requirement: 语文 L4 叶节点微课全覆盖
系统 SHALL 为语文全部 52 个 L4 叶节点提供微课；每个叶节点 SHALL 提供 2 个版本。

#### Scenario: 诊断到任意语文叶节点后看微课
- **WHEN** 学生在任意语文 L4 叶节点答错并点击「看微课」
- **THEN** 能加载到该叶节点的微课，且可切换 2 个不同讲法的版本

#### Scenario: 微课结构完整
- **WHEN** 任一语文微课版本被加载
- **THEN** 该版本包含非空的 `oneLiner / problem / analogy / example`，非空数组 `pitfalls`，非空数组 `check`（每题含非空 `stem`、`options` 长度 ≥2、合法整数 `answer`、非空 `explanation`），且 `readTime > 0`

#### Scenario: 内容贴合考点
- **WHEN** 查看某叶节点的微课
- **THEN** 讲解内容与该叶节点的知识点名称所指能力点一致（如「《三峡》·句子翻译」讲文言翻译技法，而非泛泛的语文知识）

## MODIFIED Requirements
### Requirement: 微课覆盖率
现有 47 个语文叶节点无微课，导致覆盖率非满。修改后 SHALL 为覆盖率 100%（8 科全部 L4 叶均有微课）。

## REMOVED Requirements
无。
