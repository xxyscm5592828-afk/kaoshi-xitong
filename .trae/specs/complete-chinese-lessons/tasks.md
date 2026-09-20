# Tasks

统一入口文件：`js/data-chinese.js`（唯一被改动的文件），在 `const lessons = { ... };`（约 L537）内、末尾 `};` 之前**追加**新条目。
所有任务都改同一个文件 → **必须串行执行**，且每次改动只做「追加」，不得重排或修改已有条目。

每个叶节点的微课写法（与文件内已有条目完全一致）：
```
'<叶id>': [
  { version: 1, oneLiner, problem, analogy, example, pitfalls: [...非空], check: [ {stem, options:[≥2], answer:int, explanation}, ...至少1题], readTime: 90 },
  { version: 2, oneLiner, problem, analogy, example, pitfalls: [...], check: [...], readTime: 90 },
],
```
自测题 `options` 长度 2–4，`answer` 为合法的 0 基索引。

- [x] Task 1: 八上文言文（8 叶）
  - [x] 为 `chn8a-p1`《三峡》·实词与一词多义、`chn8a-p2`《短文二篇》·实词与一词多义、`chn8a-p3`《与朱元思书》·实词与词类活用、`chn8a-p4`《孟子二章》·通假字与词类活用、`chn8a-p5`《三峡》·句子翻译、`chn8a-p6`《短文二篇》·句子翻译、`chn8a-p7`《孟子二章》·句子翻译、`chn8a-p8`《愚公移山》·句子翻译，各写 2 个版本微课
  - [x] 验证：`grep -c "'chn8a-p[0-9]*':" js/data-chinese.js` 数量与预期一致

- [x] Task 2: 八下文言文（7 叶）
  - [x] 为 `chn8b-p1`《桃花源记》·实词与古今异义、`chn8b-p2`《小石潭记》·实词与词类活用、`chn8b-p3`《核舟记》·实词与一词多义、`chn8b-p4`《庄子》二则·实词与通假字、`chn8b-p5`《桃花源记》·句子翻译、`chn8b-p6`《小石潭记》·句子翻译、`chn8b-p7`《核舟记》《庄子》二则·句子翻译，各写 2 个版本微课

- [x] Task 3: 古诗词默写与鉴赏（8 叶）
  - [x] 为 `chn8a-p11` 诗词五首·名句默写、`chn8a-p12` 唐诗五首·意象与情感、`chn8a-p13` 诗词五首·意象与情感、`chn8b-p8`《诗经》二首·名句默写、`chn8b-p9` 唐诗三首·名句默写、`chn8b-p10` 诗词曲五首·名句默写、`chn8b-p11`《诗经》二首·意象与情感、`chn8b-p12` 诗词曲五首·情感与手法，各写 2 个版本微课

- [x] Task 4: 现代文阅读（8 叶）
  - [x] 八上：`chn8a-p14` 新闻·文体特点与六要素、`chn8a-p15` 记叙文·内容概括与情感把握、`chn8a-p16` 散文·语言赏析、`chn8a-p18` 说明文语言准确性
  - [x] 八下：`chn8b-p13` 游记·游踪与景物描写、`chn8b-p15` 论证方法与语言、`chn8b-p16` 小说·人物形象与主题、`chn8b-p18` 说明顺序
  - [x] 以上 8 叶各写 2 个版本微课

- [x] Task 5: 写作类（7 叶）
  - [x] 八上：`chn8a-p19` 消息·标题与导语、`chn8a-p20` 写人记事·细节描写、`chn8a-p21` 语言简明、`chn8a-p22` 说明事物·抓住特征
  - [x] 八下：`chn8b-p17` 仿写·句式与修辞、`chn8b-p19` 读后感·引议联结、`chn8b-p20` 演讲稿·观点与感染力
  - [x] 以上 7 叶各写 2 个版本微课

- [x] Task 6: 名著与语言基础（9 叶）
  - [x] 名著：`chn8a-p23`《红星照耀中国》·内容与人物、`chn8a-p24`《昆虫记》·科学性与文学性、`chn8b-p21`《经典常谈》·内容与价值、`chn8b-p22`《钢铁是怎样炼成的》·人物与精神
  - [x] 语言基础：`chn8a-p25` 词语与成语运用、`chn8a-p27` 标点符号运用、`chn8a-p28` 对联·对仗与平仄、`chn8b-p23` 修辞手法辨析与作用、`chn8b-p24` 语言得体与表达
  - [x] 以上 9 叶各写 2 个版本微课

- [x] Task 7: 全量验证
  - [x] 覆盖脚本确认语文 52/52、全科 336/336 = 100%
  - [x] `node --test tests/*.test.js` 全绿（≥265 pass，0 fail）
  - [x] 确认除 `js/data-chinese.js` 外无其他文件被改动

# Task Dependencies
- 全部改动集中在同一文件 `js/data-chinese.js`，存在写冲突 → Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 **串行**执行。
- Task 7 依赖 Task 1–6 全部完成。
