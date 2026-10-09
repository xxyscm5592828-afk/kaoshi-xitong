// AI 爸爸助手：人设 + 上下文组装 + prompt 构造（零 DOM；网络统一走 AI.chat）
// 规则来源：开发文档 §8.3 六律 §9.2 人设 §9.6 红线（不评价能力）；设计文档 §6
const Assistant = {
  DEFAULT_NAME: '爸爸',
  MAX_ROUNDS: 6, // 单题追问硬上限（设计文档 §2）

  name() {
    const s = Store.settings || {};
    return (s.assistantName || '').trim() || this.DEFAULT_NAME;
  },

  // 人设 + 六律 + 硬约束：全部写死在 prompt 里，不指望模型自觉
  get SYSTEM_PROMPT() {
    return [
      `你是「${this.name()}」，也就是孩子的爸爸——不是老师，也不是爱唠叨的严家长。`,
      '说话风格：可爱爸爸腔——温和耐心、爱用生活里的例子打比方、偶尔自嘲逗他笑，永远站在孩子这边。他做错了先接住情绪，再讲题，绝不凶他。',
      '要生动：多打比方、多举身边的例子，别干巴巴讲道理；可以说得夸张点、带点梗，但绝不能骗他。',
      '',
      '讲题必须守住这六条：',
      '1. 先说人话，再上术语；术语一出现就当场用大白话解释。',
      '2. 开口先给一个类比，让他在脑子里先看到画面。',
      '3. 举例只用最小数字（1、2、3 这种），别拿复杂数字添乱。',
      '4. 一句话只装一个新概念，不叠着讲。',
      '5. 类比只用初二男生熟悉的东西：游戏、打球、零花钱、乐高。',
      '6. 该承认难就承认难（「这题确实绕」），别硬说简单。',
      '',
      '硬约束（不许破）：',
      '- 只讲这一道题涉及的知识点，超纲的内容不展开。',
      '- 只讲初二范围内的方法。',
      '- 不确定就直说「这个我不太确定」，绝对不许瞎编。',
      '- 不评价孩子的能力：不说「这么简单都不会」「你怎么这么笨」这类话，只谈题目和办法。',
      '- 全文 250 字以内，短句为主，不堆术语，不用 Markdown 标题和代码块。',
    ].join('\n');
  },

  // 本地拼装错题事实（0 token）。只放事实，提问本身由调用方放进 history
  buildWrongContext(rec, q) {
    const kp = Store.kpIndex()[rec.knowledgePointId] || {};
    const m = Store.mastery[rec.knowledgePointId];
    const lines = [
      `【他做错的题】${q.stem}`,
      `【正确答案】${this._fmt(q, rec.correctAnswer)}`,
      `【他写的答案】${this._fmt(q, rec.myAnswer)}`,
      `【知识点】${kp.name || '（未知）'}`,
    ];
    if (rec.errorType) lines.push(`【他自己选的错因】${rec.errorType}`);
    if (m && typeof m.score === 'number') lines.push(`【这个知识点的掌握度】${m.score}/100`);
    if (q.explanation) lines.push(`【教材解析（可参考，但要用你自己的话说）】${q.explanation}`);
    return lines.join('\n');
  },

  // A2 本地检索增强：按知识点取本地微课（种子版，见 data-*.js）拼成证据块，随错题答疑一起交给模型（0 额外 API 调用）
  localLessonEvidence(kpId) {
    const vs = (Store.lessons || {})[kpId];
    if (!Array.isArray(vs) || !vs.length) return '';
    const l = vs[0];
    const lines = [`【本考点的本地微课·核心】${l.oneLiner}`];
    if (l.analogy) lines.push(`【微课类比（可沿用或改写）】${l.analogy}`);
    if (Array.isArray(l.pitfalls) && l.pitfalls.length) lines.push(`【这个考点最常见的坑】${l.pitfalls.join('；')}`);
    return lines.join('\n');
  },

  // C2 答疑降级兜底：AI 不可用（无 Key / 额度用尽 / 网络异常）时，用本地证据拼一段像样的回答（0 token、0 计费）
  // 素材：本地微课证据（核心/类比/坑）+ 教材解析；两者都没有就返回空串（由界面走原降级话术）
  localAnswer(rec, q) {
    const kp = q && q.knowledgePointId ? (Store.kpIndex()[q.knowledgePointId] || null) : null;
    const lines = [];
    const evidence = rec && rec.knowledgePointId ? this.localLessonEvidence(rec.knowledgePointId) : '';
    if (evidence) lines.push(evidence);
    if (q && q.explanation) lines.push(`【这道题的解析】${q.explanation}`);
    if (!lines.length) return '';
    const head = q ? `这道题考「${(kp && kp.name) || '这个知识点'}」，先看这段本地讲义：` : '先看这段本地讲义：';
    return head + '\n' + lines.join('\n');
  },

  // 选项题把下标还原成文字；填空/主观原样返回
  _fmt(q, val) {
    if (val === null || val === undefined || val === '') return '（空着没写）';
    if (Array.isArray(val)) return val.length ? val.map(v => this._fmt(q, v)).join('、') : '（空着没写）';
    const opts = q && q.options;
    if (Array.isArray(opts) && opts.length) {
      const i = Number(val);
      if (Number.isInteger(i) && opts[i] !== undefined) return String(opts[i]);
    }
    return String(val);
  },

  // rec/q 传 null 即为全局页的自由提问（不带本题上下文）
  // hintFirst（对比分析 B3）：错题答疑首轮先给思路提示，不报答案不给完整解法（洋葱「引导式答疑」同源）
  askWrong(rec, q, history, hintFirst) {
    let system = this.SYSTEM_PROMPT;
    if (hintFirst) {
      system += '\n\n思路提示模式（只此一轮）：他刚第一次问这道题，先只给一条思路提示——指个方向、给个类比或线索，2~3 句。绝不报答案，不给完整解法，结尾不提问（展开由界面推进）。';
    }
    const messages = [{ role: 'system', content: system }];
    if (rec && q) {
      let ctx = this.buildWrongContext(rec, q);
      const evidence = this.localLessonEvidence(rec.knowledgePointId);
      if (evidence) ctx += '\n' + evidence;
      messages.push({ role: 'user', content: ctx });
    }
    for (const turn of (history || [])) {
      const content = String((turn && turn.content) || '').trim();
      if (!content) continue;
      messages.push({ role: turn.role === 'assistant' ? 'assistant' : 'user', content });
    }
    return AI.chat({ messages });
  },

  // 逐题逐步解法（本轮 A）：同一道题第二次调用读缓存，不再走 AI.chat（故不扣额度）
  solveStepsPrompt(q, kp, answer) {
    const lines = [`【题目】${q.stem}`];
    if (Array.isArray(q.options) && q.options.length)
      lines.push(`【选项】${q.options.map((o, i) => `${'ABCD'[i]}. ${o}`).join('，')}`);
    lines.push(`【正确答案】${this._fmt(q, q.answer)}`);
    lines.push(`【他写的答案】${this._fmt(q, answer)}`);
    lines.push(`【知识点】${(kp && kp.name) || '（未知）'}`);
    if (q.explanation) lines.push(`【教材解析（可参考，但要用你自己的话说）】${q.explanation}`);
    lines.push('', '把这题一步步讲给他听：分 3~5 步，每步另起一行、以「第1步：」开头，每步只说一件事，最后给一个自查动作。');
    return lines.join('\n');
  },

  solutionOf(qId) {
    return (Store.solutionCache || {})[qId] || '';
  },

  async solveSteps(q, kp, answer) {
    const cached = this.solutionOf(q.id);
    if (cached) return { ok: true, text: cached, cached: true };
    const system = this.SYSTEM_PROMPT + '\n\n逐步解题模式：这次要给他完整解法，一步一步来，每步一行、以「第N步：」开头，共 3~5 步；为讲清步骤，本次长度可放宽到 400 字；仍不用 Markdown 标题与代码块。';
    const res = await AI.chat({
      messages: [{ role: 'system', content: system }, { role: 'user', content: this.solveStepsPrompt(q, kp, answer) }],
      maxTokens: 1200,
    });
    if (!res.ok) return res;
    const text = String(res.text || '').trim();
    const c = Store.solutionCache || {};
    c[q.id] = text;
    Store.solutionCache = c;
    return { ok: true, text };
  },

  // ===== 阶段 2 生成能力：微课 / 变式题 / 周报+档案（共用 JSON 输出规范）=====
  // 生成任务用独立 system：SYSTEM_PROMPT 的「250 字 / 不用标题」会把 JSON 憋坏，故分离
  get GEN_SYSTEM_PROMPT() {
    return [
      `你是「${this.name()}」，也就是孩子的爸爸，不是老师，也不是爱唠叨的严家长。`,
      '说话风格：可爱爸爸腔——温和耐心、爱用生活里的例子打比方、偶尔自嘲逗他笑，永远站在孩子这边。',
      '要生动：多打比方、多举身边的例子，别干巴巴讲道理；可以说得夸张点、带点梗，但绝不能骗他。',
      '讲题必须守六条：',
      '1. 先说人话，再上术语，术语一出来当场用大白话解释。',
      '2. 先给一个类比，让他脑子里先看到画面。',
      '3. 举例只用最小数字（1、2、3）。',
      '4. 一句话只装一个新概念。',
      '5. 类比只用初二男生熟悉的东西：游戏、打球、零花钱、乐高。',
      '6. 该承认难就承认难。',
      '只讲初二范围内的方法；不确定就说「不太确定」；不评价孩子的能力。',
      '严格输出 JSON，只输出 JSON，不要任何解释文字。',
    ].join('\n');
  },

  // 从模型返回文本里抠出 JSON（容忍 ```json 围栏 / 前后缀说明文字）
  _extractJSON(text) {
    const s = String(text || '').trim();
    const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    const body = fenced ? fenced[1] : s;
    try { return JSON.parse(body); }
    catch (e) {
      const a = body.indexOf('{'), b = body.lastIndexOf('}');
      if (a >= 0 && b > a) { try { return JSON.parse(body.slice(a, b + 1)); } catch (e2) {} }
      return null;
    }
  },

  // 微课六律生成（§8.3）：返回已解析的微课六段式
  lessonPrompt(kp) {
    const prior = (Store.lessons[kp.id] || []).map(l => `v${l.version} 用「${l.analogy}」`).join('；');
    return [
      `给知识点「${kp.name}」写一篇 90 秒微课，讲给一个初二男生听。`,
      '',
      '严格按这个 JSON 结构输出：',
      '{',
      '  "oneLiner": "核心一句话（口语，一句点破）",',
      '  "problem": "它解决什么问题（为什么需要它，1~2 句）",',
      '  "analogy": "一个类比（只从游戏/打球/零花钱/乐高选）",',
      '  "example": "一道例题（只用 1、2、3 这种最小数字）",',
      '  "pitfalls": ["常见坑1", "常见坑2", "常见坑3"],',
      '  "check": [',
      '    { "stem": "自测1题干", "options": ["甲", "乙", "丙", "丁"], "answer": 0, "explanation": "一句解析" },',
      '    { "stem": "自测2题干", "options": ["甲", "乙", "丙", "丁"], "answer": 1, "explanation": "一句解析" }',
      '  ]',
      '}',
      '',
      '硬要求：check 必须是 2 道单选题，options 恰好 4 个，answer 是正确选项下标（0~3）。',
      '全程守六律；口语化，不用标题。',
      prior ? `\n换讲法：之前已经讲过这些，这次务必换不同的类比和说法：${prior}` : '',
    ].join('\n');
  },

  _parseLesson(text) {
    const o = this._extractJSON(text);
    if (!o || typeof o !== 'object') return { ok: false };
    const s = v => (typeof v === 'string' ? v.trim() : '');
    const lesson = {
      oneLiner: s(o.oneLiner), problem: s(o.problem), analogy: s(o.analogy), example: s(o.example),
      pitfalls: Array.isArray(o.pitfalls) ? o.pitfalls.map(x => s(x)).filter(Boolean).slice(0, 5) : [],
      check: Array.isArray(o.check) ? o.check.map(c => {
        if (!c || typeof c.stem !== 'string' || !c.stem.trim()) return null;
        const opts = Array.isArray(c.options) ? c.options.map(x => s(x)).filter(Boolean) : [];
        const ans = Number(c.answer);
        if (opts.length < 2 || !Number.isInteger(ans) || ans < 0 || ans >= opts.length) return null;
        return { stem: c.stem.trim(), options: opts, answer: ans, explanation: s(c.explanation) };
      }).filter(Boolean).slice(0, 2) : [],
    };
    if (!lesson.oneLiner || !lesson.problem || !lesson.analogy || !lesson.example || lesson.check.length === 0)
      return { ok: false };
    return { ok: true, lesson };
  },

  async genLesson(kp) {
    const res = await AI.chat({
      messages: [{ role: 'system', content: this.GEN_SYSTEM_PROMPT }, { role: 'user', content: this.lessonPrompt(kp) }],
      maxTokens: 2000, temperature: 0.8,
    });
    if (!res.ok) return res;
    const parsed = this._parseLesson(res.text);
    return parsed.ok ? { ok: true, lesson: parsed.lesson } : { ok: false, error: 'parse' };
  },

  // 变式题生成（题组结构）：同知识点同题型，换数字/情境（§7.2 §8.2 变式）
  variantPrompt(original, kp) {
    const isChoice = original.type === 'single' || original.type === 'multi';
    return [
      `出一道变式题：和原题同知识点「${kp ? kp.name : ''}」、同题型、难度相近，但换数字和情境——用来验证不是背答案。`,
      `【原题】${original.stem}`,
      original.options && original.options.length ? `【原题选项】${original.options.join(' | ')}` : null,
      `【原题答案】${this._fmt(original, original.answer)}`,
      `【题型】${original.type}`,
      '',
      '严格按这个 JSON 输出：',
      '{',
      '  "stem": "变式题题干",',
      isChoice ? '  "options": ["甲", "乙", "丙", "丁"],\n  "answer": 0,' : (original.type === 'judge' ? '  "answer": 0,' : '  "answer": "参考答案",'),
      '  "explanation": "一句解析",',
      `  "difficulty": ${original.difficulty || 2},`,
      `  "expectedTime": ${original.expectedTime || 40}`,
      '}',
      '',
      isChoice ? (original.type === 'multi'
        ? '- options 恰好 4 个，answer 是数组如 [0,2]，至少 2 项。'
        : '- options 恰好 4 个，answer 是正确选项下标（0~3）。')
        : (original.type === 'judge' ? '- answer 只能是 0（对）或 1（错）。' : '- answer 是参考答案字符串。'),
      '- 必须换数字/情境，别和原题几乎一样；知识点和题型不许变。',
      `- 难度取 1~5 的整数，和原题相差不超过 1（原题难度 ${original.difficulty || 2}）。`,
    ].filter(Boolean).join('\n');
  },

  _parseVariant(text, original) {
    return this._parseVariantObj(this._extractJSON(text), original);
  },

  // 单题校验（_parseVariant 与批量 _parseVariantList 共用）
  _parseVariantObj(o, original) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return { ok: false };
    const s = v => (typeof v === 'string' ? v.trim() : '');
    const stem = s(o.stem), explanation = s(o.explanation);
    if (!stem || !explanation) return { ok: false };
    // B1 难度校准：采用模型给的 difficulty，但钳制在 1~5 且与原题相差 ≤1（出题难度=原题±1），越界回落原题难度
    const origD = Number.isInteger(original.difficulty) && original.difficulty >= 1 && original.difficulty <= 5 ? original.difficulty : 2;
    const d = Number(o.difficulty);
    const difficulty = Number.isInteger(d) && d >= 1 && d <= 5 && Math.abs(d - origD) <= 1 ? d : origD;
    const q = { type: original.type, stem, explanation, difficulty, expectedTime: original.expectedTime || 40 };
    if (original.type === 'single' || original.type === 'multi') {
      const opts = Array.isArray(o.options) ? o.options.map(x => s(x)).filter(Boolean) : [];
      if (opts.length < 2) return { ok: false };
      q.options = opts;
      if (original.type === 'single') {
        const a = Number(o.answer);
        if (!Number.isInteger(a) || a < 0 || a >= opts.length) return { ok: false };
        q.answer = a;
      } else {
        const a = Array.isArray(o.answer) ? o.answer.map(Number) : [];
        if (a.length < 2 || a.some(x => !Number.isInteger(x) || x < 0 || x >= opts.length)) return { ok: false };
        q.answer = a;
      }
    } else if (original.type === 'judge') {
      const a = Number(o.answer);
      if (a !== 0 && a !== 1) return { ok: false };
      q.answer = a;
    } else {
      q.answer = s(o.answer);
      if (!q.answer) return { ok: false };
    }
    return { ok: true, question: q };
  },

  async genVariant(original, kp) {
    const res = await AI.chat({
      messages: [{ role: 'system', content: this.GEN_SYSTEM_PROMPT }, { role: 'user', content: this.variantPrompt(original, kp) }],
      maxTokens: 1200, temperature: 0.8,
    });
    if (!res.ok) return res;
    const parsed = this._parseVariant(res.text, original);
    return parsed.ok ? { ok: true, question: parsed.question } : { ok: false, error: 'parse' };
  },

  // 真题风格题生成（错题跟进练习）：模仿会考/中考真题卷的命题语言与设问习惯，内容仍是新编（§需求3）
  realPrompt(original, kp) {
    const isChoice = original.type === 'single' || original.type === 'multi';
    return [
      `模仿会考/中考真题卷的命题风格，出一道和原题同知识点「${kp ? kp.name : ''}」、同题型的题：题干与设问要像真题卷，但内容是新编的，不是抄真题。`,
      `【原题】${original.stem}`,
      original.options && original.options.length ? `【原题选项】${original.options.join(' | ')}` : null,
      `【原题答案】${this._fmt(original, original.answer)}`,
      `【题型】${original.type}`,
      '',
      '严格按这个 JSON 输出：',
      '{',
      '  "stem": "真题风格题干",',
      isChoice ? '  "options": ["甲", "乙", "丙", "丁"],\n  "answer": 0,' : (original.type === 'judge' ? '  "answer": 0,' : '  "answer": "参考答案",'),
      '  "explanation": "一句解析",',
      `  "difficulty": ${original.difficulty || 2},`,
      `  "expectedTime": ${original.expectedTime || 40}`,
      '}',
      '',
      isChoice ? (original.type === 'multi'
        ? '- options 恰好 4 个，answer 是数组如 [0,2]，至少 2 项。'
        : '- options 恰好 4 个，answer 是正确选项下标（0~3）。')
        : (original.type === 'judge' ? '- answer 只能是 0（对）或 1（错）。' : '- answer 是参考答案字符串。'),
      '- 说真题卷的话：「下列……正确的是」「根据材料，……的原因是」这类设问口吻。',
      '- 必须换数字/情境，别和原题几乎一样；知识点和题型不许变。',
    ].filter(Boolean).join('\n');
  },

  async genReal(original, kp) {
    const res = await AI.chat({
      messages: [{ role: 'system', content: this.GEN_SYSTEM_PROMPT }, { role: 'user', content: this.realPrompt(original, kp) }],
      maxTokens: 1200, temperature: 0.8,
    });
    if (!res.ok) return res;
    const parsed = this._parseVariant(res.text, original);
    return parsed.ok ? { ok: true, question: parsed.question } : { ok: false, error: 'parse' };
  },

  // 批量真题风格题（§额度：补一组题若逐题调用，4 道题要扣 4 次；一次调用出多题只扣 1 次）
  realBatchPrompt(original, kp, count) {
    const isChoice = original.type === 'single' || original.type === 'multi';
    const answerSample = original.type === 'multi' ? '[0, 2]' : (original.type === 'fill' ? '"参考答案"' : '0');
    const sample = `{ "stem": "真题风格题干", ${isChoice ? '"options": ["甲", "乙", "丙", "丁"], ' : ''}"answer": ${answerSample}, "explanation": "一句解析", "difficulty": ${original.difficulty || 2}, "expectedTime": ${original.expectedTime || 40} }`;
    return [
      `模仿会考/中考真题卷的命题风格，出 ${count} 道和原题同知识点「${kp ? kp.name : ''}」、同题型的题：题干与设问要像真题卷，但内容是新编的，不是抄真题；这 ${count} 道题彼此还要换数字、换情境。`,
      `【原题】${original.stem}`,
      original.options && original.options.length ? `【原题选项】${original.options.join(' | ')}` : null,
      `【原题答案】${this._fmt(original, original.answer)}`,
      `【题型】${original.type}`,
      '',
      `严格按这个 JSON 输出，questions 数组里正好 ${count} 道题：`,
      '{',
      `  "questions": [${sample}]`,
      '}',
      '',
      isChoice ? (original.type === 'multi'
        ? '- 每题 options 恰好 4 个，answer 是数组如 [0,2]，至少 2 项。'
        : '- 每题 options 恰好 4 个，answer 是正确选项下标（0~3）。')
        : (original.type === 'judge' ? '- 每题 answer 只能是 0（对）或 1（错）。' : '- 每题 answer 是参考答案字符串。'),
      '- 说真题卷的话：「下列……正确的是」「根据材料，……的原因是」这类设问口吻。',
      '- 每道题的题干必须各不相同；知识点和题型不许变。',
    ].filter(Boolean).join('\n');
  },

  _parseVariantList(text, original, count) {
    const o = this._extractJSON(text);
    const list = o && Array.isArray(o.questions) ? o.questions : null;
    if (!list) return { ok: false };
    const questions = list.slice(0, count)
      .map(item => this._parseVariantObj(item, original))
      .filter(r => r.ok)
      .map(r => r.question);
    return questions.length ? { ok: true, questions } : { ok: false };
  },

  async genRealBatch(original, kp, count) {
    const n = Math.max(1, count);
    const res = await AI.chat({
      messages: [{ role: 'system', content: this.GEN_SYSTEM_PROMPT }, { role: 'user', content: this.realBatchPrompt(original, kp, n) }],
      maxTokens: Math.min(4000, 1200 * n), temperature: 0.8,
    });
    if (!res.ok) return res;
    const parsed = this._parseVariantList(res.text, original, n);
    return parsed.ok ? { ok: true, questions: parsed.questions } : { ok: false, error: 'parse' };
  },

  // 周报评语（四铁律）+ 档案蒸馏，一次调用完成（§9.5 §9.6 零额外成本）
  get WEEK_PROMPT() {
    return [
      `你是「${this.name()}」，给孩子写这周的周报评语，并顺手把《理解档案》蒸馏一遍。`,
      '评语四铁律：',
      '- 进步：表扬具体策略，不夸「你真聪明」。',
      '- 退步：拆成可修复的动作，不写「退步了要加油」。',
      '- 平淡：换角度找真实亮点，不写「继续保持」。',
      '- 波动大：归因到可控因素，不回避。',
      '理解档案红线：只记「模式和有效策略」，绝不记「能力判定」（不写「数学差」「不擅长」这类）。每条洞察要能追到具体事实。',
      '严格按这个 JSON 输出，只输出 JSON：',
      '{ "comment": "一段评语，150 字以内，爸爸腔，口语化，不用 Markdown",',
      '  "profile": { "academic": ["学术模式"], "behavioral": ["行为模式"], "psychological": ["心理模式"], "milestones": ["里程碑事实"] } }',
    ].join('\n');
  },

  weekReportPrompt(now) {
    const w = Report.weekStats(now);
    const subj = Report.subjectSummary(now);
    const stubborn = Wrongbook.stubborn().length;
    const cur = Store.settings.learnerProfile;
    const lines = [
      `本周（近 7 天）：答题 ${w.answered} 道，对 ${w.correct} 道，正确率 ${w.accuracy}%；最高连击 ×${w.maxCombo}；点亮 ${w.litCount} 个知识点；错题销号 ${w.closures} 道。`,
    ];
    if (subj.length) lines.push(`各科掌握度（长期积累）：${subj.map(x => `${x.name} ${x.score}`).join('、')}。`);
    if (stubborn) lines.push(`当前 ${stubborn} 道顽固错题在回炉（属正常）。`);
    if (cur && (cur.academic || cur.behavioral || cur.psychological || cur.milestones)) lines.push(`已有理解档案（据此更新：去掉过时、补进新的，别照抄）：${JSON.stringify(cur)}`);
    return lines.join('\n') + '\n\n请写周报评语并返回更新后的理解档案。';
  },

  _parseWeekReport(text) {
    const o = this._extractJSON(text);
    if (!o || typeof o !== 'object') return { ok: false };
    const comment = String(o.comment || '').trim();
    if (!comment) return { ok: false };
    const arr = v => (Array.isArray(v) ? v.map(x => String(x).trim()).filter(Boolean).slice(0, 5) : []);
    const p = o.profile && typeof o.profile === 'object' ? o.profile : {};
    return {
      ok: true, comment,
      profile: { academic: arr(p.academic), behavioral: arr(p.behavioral), psychological: arr(p.psychological), milestones: arr(p.milestones) },
    };
  },

  async weekReport(now) {
    now = now || Date.now();
    const res = await AI.chat({
      messages: [{ role: 'system', content: this.WEEK_PROMPT }, { role: 'user', content: this.weekReportPrompt(now) }],
      maxTokens: 900,
    });
    if (!res.ok) return res;
    const parsed = this._parseWeekReport(res.text);
    if (!parsed.ok) return { ok: false, error: 'parse' };
    return { ok: true, comment: parsed.comment, profile: parsed.profile };
  },

  // 月度深度复盘（阶段 3 §13.4）：和周报同一套 JSON 规范；重点在「删掉过时洞察，不照抄」
  monthReportPrompt(now) {
    const m = Report.monthStats(now);
    const stubborn = Wrongbook.stubborn().length;
    const cur = Store.settings.learnerProfile;
    const lines = [
      `月度（近 30 天）：答题 ${m.answered} 道，对 ${m.correct} 道，正确率 ${m.accuracy}%；错题销号 ${m.closures} 道；点亮 ${m.lit} 个知识点。`,
      '这是月度深度复盘：和上次的《理解档案》对比，把已经过时/被证伪的洞察删掉，不照抄；只记模式和有效策略，不记能力判断。',
    ];
    if (stubborn) lines.push(`当前 ${stubborn} 道顽固错题在回炉（属正常）。`);
    if (cur && (cur.academic || cur.behavioral || cur.psychological || cur.milestones)) lines.push(`已有理解档案：${JSON.stringify(cur)}`);
    return lines.join('\n') + '\n\n请写月度复盘评语并返回更新后的理解档案。';
  },

  async monthReport(now) {
    now = now || Date.now();
    const res = await AI.chat({
      messages: [{ role: 'system', content: this.WEEK_PROMPT + '\n（这是月度深度复盘：务必删除过时洞察、更新档案，别照抄。评语按四铁律写。）' }, { role: 'user', content: this.monthReportPrompt(now) }],
      maxTokens: 900,
    });
    if (!res.ok) return res;
    const parsed = this._parseWeekReport(res.text);
    if (!parsed.ok) return { ok: false, error: 'parse' };
    return { ok: true, comment: parsed.comment, profile: parsed.profile };
  },
};
