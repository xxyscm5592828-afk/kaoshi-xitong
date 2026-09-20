# Checklist

- [x] `js/data-chinese.js` 的 `lessons` 对象中，语文全部 52 个 L4 叶均有微课条目
- [x] 每个新增叶节点恰好含 2 个版本（`version: 1` 与 `version: 2`）
- [x] 每个版本含非空的 `oneLiner / problem / analogy / example` 字段
- [x] 每个版本含非空数组 `pitfalls`
- [x] 每个版本含非空数组 `check`，且每道自测题 `stem` 非空、`options` 长度 ≥2、`answer` 为合法 0 基索引、`explanation` 非空
- [x] 每个版本 `readTime > 0`
- [x] 微课讲解内容与对应 L4 叶节点知识点名称所指能力点一致（非泛泛内容）
- [x] 未修改语文已有的 5 个微课（`chn8a-p9 chn8a-p10 chn8a-p17 chn8a-p26 chn8b-p14`）及其余数据
- [x] 未改动 `js/data-chinese.js` 以外的任何文件
- [x] 覆盖脚本输出：语文 52 有微课 52 缺 0；全科 L4 336 有微课 336，覆盖率 100.0%
- [x] `node --test tests/*.test.js` 运行结果为 0 fail（pass ≥ 265）
- [x] `tests/data.test.js` 中「微课结构完整（多版本 + check）」用例通过
