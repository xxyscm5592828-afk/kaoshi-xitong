// 英语·外研版·九年级（Module × 三线：词汇/语法/题型技能）
// 章节框架对照开发文档附录 A.3；⭐=中考高频语法
// ⚠️ 外研新版单元结构变化大，L3 的 Module 分组为参考性组织
// L4 叶 id：eng9a-p1~eng9a-p24、eng9b-p1~eng9b-p23（每个叶恰好 2 道题）
(function () {
  setSubject('english');

  const knowledgePoints = [
    // ═══════════════ 九上 ═══════════════
    kp('eng9a', null, '英语·九上', 3, 1),

    // ── 词汇线 ──
    kp('eng9a-v', 'eng9a', '词汇线', 1, 2),
    kp('eng9a-v1', 'eng9a-v', 'Module 1–4 核心词汇', 1, 3),
    kp('eng9a-p1', 'eng9a-v1', '名词与形容词词形转换', 1, 4, { bloom: '应用', weight: 3 }),
    kp('eng9a-p2', 'eng9a-v1', '动词短语搭配（take / put / look）', 2, 4, { bloom: '应用', weight: 4, tags: ['高频考点'] }),
    kp('eng9a-v2', 'eng9a-v', 'Module 5–8 核心词汇', 2, 3),
    kp('eng9a-p3', 'eng9a-v2', '易混词辨析（such/so、because/so）', 1, 4, { bloom: '理解', weight: 4, tags: ['易错'] }),
    kp('eng9a-p4', 'eng9a-v2', '构词法：前缀与后缀', 2, 4, { bloom: '理解', weight: 3 }),
    kp('eng9a-v3', 'eng9a-v', 'Module 9–12 核心词汇', 3, 3),
    kp('eng9a-p5', 'eng9a-v3', '动词不规则变化与固定搭配', 1, 4, { bloom: '记忆', weight: 3 }),

    // ── 语法线 ──
    kp('eng9a-g', 'eng9a', '语法线', 2, 2),
    kp('eng9a-g1', 'eng9a-g', '现在完成时（延续与复习）⭐', 1, 3),
    kp('eng9a-p6', 'eng9a-g1', '现在完成时的构成与用法复习', 1, 4, { bloom: '应用', weight: 5, tags: ['高频考点'] }),
    kp('eng9a-p7', 'eng9a-g1', '延续性动词与 for / since', 2, 4, { bloom: '分析', weight: 5, tags: ['高频考点', '易错'], prereq: ['eng9a-p6'] }),
    kp('eng9a-g2', 'eng9a-g', '被动语态（一般现在 / 一般过去）⭐', 2, 3),
    kp('eng9a-p8', 'eng9a-g2', '一般现在时的被动语态', 1, 4, { bloom: '应用', weight: 5, tags: ['高频考点'] }),
    kp('eng9a-p9', 'eng9a-g2', '一般过去时的被动语态', 2, 4, { bloom: '应用', weight: 5, tags: ['高频考点'], prereq: ['eng9a-p8'] }),
    kp('eng9a-g3', 'eng9a-g', '含情态动词的被动语态 ⭐', 3, 3),
    kp('eng9a-p10', 'eng9a-g3', '情态动词 + be + 过去分词', 1, 4, { bloom: '应用', weight: 5, tags: ['高频考点'], prereq: ['eng9a-p8'] }),
    kp('eng9a-g4', 'eng9a-g', '宾语从句（复习）⭐', 4, 3),
    kp('eng9a-p11', 'eng9a-g4', '宾语从句的引导词与时态呼应', 1, 4, { bloom: '应用', weight: 5, tags: ['高频考点'] }),
    kp('eng9a-p12', 'eng9a-g4', '宾语从句的陈述语序', 2, 4, { bloom: '分析', weight: 5, tags: ['高频考点', '易错'], prereq: ['eng9a-p11'] }),
    kp('eng9a-g5', 'eng9a-g', '定语从句（who / which / that）⭐', 5, 3),
    kp('eng9a-p13', 'eng9a-g5', '关系代词 who / which / that 的选择', 1, 4, { bloom: '应用', weight: 5, tags: ['高频考点'] }),
    kp('eng9a-p14', 'eng9a-g5', '关系代词作宾语与省略', 2, 4, { bloom: '分析', weight: 4, tags: ['易错'], prereq: ['eng9a-p13'] }),
    kp('eng9a-g6', 'eng9a-g', '状语从句 ⭐', 6, 3),
    kp('eng9a-p15', 'eng9a-g6', '时间状语从句（when / while / as）', 1, 4, { bloom: '应用', weight: 4 }),
    kp('eng9a-p16', 'eng9a-g6', '条件状语从句与主将从现', 2, 4, { bloom: '应用', weight: 5, tags: ['高频考点'], prereq: ['eng9a-p15'] }),
    kp('eng9a-g7', 'eng9a-g', '动词不定式与动名词', 7, 3),
    kp('eng9a-p17', 'eng9a-g7', '不定式作宾语与目的状语', 1, 4, { bloom: '应用', weight: 4, tags: ['高频考点'] }),
    kp('eng9a-p18', 'eng9a-g7', '动名词作主语与宾语（enjoy / finish）', 2, 4, { bloom: '应用', weight: 4 }),
    kp('eng9a-g8', 'eng9a-g', '情态动词表推测', 8, 3),
    kp('eng9a-p19', 'eng9a-g8', 'must / may / can\'t 表推测', 1, 4, { bloom: '应用', weight: 4, tags: ['易错'] }),
    kp('eng9a-g9', 'eng9a-g', '主谓一致', 9, 3),
    kp('eng9a-p20', 'eng9a-g9', '主谓一致基本规则', 1, 4, { bloom: '应用', weight: 4, tags: ['高频考点'] }),

    // ── 题型技能线 ──
    kp('eng9a-s', 'eng9a', '题型技能线', 3, 2),
    kp('eng9a-s1', 'eng9a-s', '阅读与完形', 1, 3),
    kp('eng9a-p21', 'eng9a-s1', '完形填空：上下文逻辑与连接词', 1, 4, { bloom: '应用', weight: 4 }),
    kp('eng9a-p22', 'eng9a-s1', '阅读理解：细节定位与主旨大意', 2, 4, { bloom: '应用', weight: 5, tags: ['高频考点'] }),
    kp('eng9a-s2', 'eng9a-s', '短文填空与书面表达', 2, 3),
    kp('eng9a-p23', 'eng9a-s2', '短文填空（首字母提示）', 1, 4, { bloom: '应用', weight: 4 }),
    kp('eng9a-p24', 'eng9a-s2', '书面表达：话题作文结构与时态', 2, 4, { bloom: '应用', weight: 4 }),

    // ═══════════════ 九下 ═══════════════
    kp('eng9b', null, '英语·九下', 4, 1),

    // ── 词汇线 ──
    kp('eng9b-v', 'eng9b', '词汇线', 1, 2),
    kp('eng9b-v1', 'eng9b-v', 'Module 1–4 核心词汇', 1, 3),
    kp('eng9b-p1', 'eng9b-v1', '名词与介词搭配', 1, 4, { bloom: '记忆', weight: 3 }),
    kp('eng9b-p2', 'eng9b-v1', '动词短语辨析（turn / come / get）', 2, 4, { bloom: '应用', weight: 4, tags: ['高频考点'] }),
    kp('eng9b-v2', 'eng9b-v', 'Module 5–8 核心词汇', 2, 3),
    kp('eng9b-p3', 'eng9b-v2', '形容词辨析（interesting / interested）', 1, 4, { bloom: '理解', weight: 3, tags: ['易错'] }),
    kp('eng9b-p4', 'eng9b-v2', '构词法：前缀（un- / im- / dis-）与后缀', 2, 4, { bloom: '理解', weight: 3 }),
    kp('eng9b-v3', 'eng9b-v', '中考高频词汇与短语', 3, 3),
    kp('eng9b-p5', 'eng9b-v3', '中考高频固定搭配', 1, 4, { bloom: '应用', weight: 4, tags: ['高频考点'] }),

    // ── 语法线（中考复习整合） ──
    kp('eng9b-g', 'eng9b', '语法线（中考复习整合）', 2, 2),
    kp('eng9b-g1', 'eng9b-g', '被动语态综合 ⭐', 1, 3),
    kp('eng9b-p6', 'eng9b-g1', '一般时与情态动词的被动语态', 1, 4, { bloom: '应用', weight: 5, tags: ['高频考点'] }),
    kp('eng9b-p7', 'eng9b-g1', '被动语态与主动语态辨析', 2, 4, { bloom: '分析', weight: 5, tags: ['高频考点', '易错'], prereq: ['eng9b-p6'] }),
    kp('eng9b-g2', 'eng9b-g', '宾语从句与定语从句辨析 ⭐', 2, 3),
    kp('eng9b-p8', 'eng9b-g2', '宾语从句与定语从句引导词辨析', 1, 4, { bloom: '分析', weight: 5, tags: ['高频考点', '易错'] }),
    kp('eng9b-p9', 'eng9b-g2', '定语从句关系代词与关系副词的选择', 2, 4, { bloom: '应用', weight: 5, tags: ['高频考点'], prereq: ['eng9b-p8'] }),
    kp('eng9b-g3', 'eng9b-g', '现在完成时与过去完成时', 3, 3),
    kp('eng9b-p10', 'eng9b-g3', '现在完成时与一般过去时的辨析', 1, 4, { bloom: '分析', weight: 4, tags: ['高频考点'] }),
    kp('eng9b-p11', 'eng9b-g3', '过去完成时与一般过去时的先后', 2, 4, { bloom: '分析', weight: 4, tags: ['易错'], prereq: ['eng9b-p10'] }),
    kp('eng9b-g4', 'eng9b-g', '状语从句综合', 4, 3),
    kp('eng9b-p12', 'eng9b-g4', '原因、结果与让步状语从句', 1, 4, { bloom: '应用', weight: 4, tags: ['高频考点'] }),
    kp('eng9b-p13', 'eng9b-g4', '时间与条件状语从句（主将从现）', 2, 4, { bloom: '应用', weight: 4, prereq: ['eng9b-p12'] }),
    kp('eng9b-g5', 'eng9b-g', '非谓语动词综合', 5, 3),
    kp('eng9b-p14', 'eng9b-g5', '不定式与动名词的用法辨析', 1, 4, { bloom: '应用', weight: 5, tags: ['高频考点', '易错'] }),
    kp('eng9b-g6', 'eng9b-g', '直接引语与间接引语', 6, 3),
    kp('eng9b-p15', 'eng9b-g6', '间接引语中的人称、时态与时间变化', 1, 4, { bloom: '应用', weight: 4, tags: ['易错'] }),
    kp('eng9b-g7', 'eng9b-g', '连接词与并列句', 7, 3),
    kp('eng9b-p16', 'eng9b-g7', '并列关联词（both…and / either…or / neither…nor）', 1, 4, { bloom: '应用', weight: 4, tags: ['高频考点'] }),
    kp('eng9b-g8', 'eng9b-g', '情态动词综合', 8, 3),
    kp('eng9b-p17', 'eng9b-g8', '情态动词表推测与禁止、不必', 1, 4, { bloom: '应用', weight: 4, tags: ['高频考点'] }),

    // ── 题型技能线 ──
    kp('eng9b-s', 'eng9b', '题型技能线', 3, 2),
    kp('eng9b-s1', 'eng9b-s', '完形与阅读', 1, 3),
    kp('eng9b-p18', 'eng9b-s1', '完形填空：词义辨析与固定搭配', 1, 4, { bloom: '应用', weight: 4 }),
    kp('eng9b-p19', 'eng9b-s1', '阅读理解：推理判断与词义猜测', 2, 4, { bloom: '分析', weight: 5, tags: ['高频考点'] }),
    kp('eng9b-s2', 'eng9b-s', '短文填空', 2, 3),
    kp('eng9b-p20', 'eng9b-s2', '短文填空：选词填空与语法形式变化', 1, 4, { bloom: '应用', weight: 4 }),
    kp('eng9b-s3', 'eng9b-s', '书面表达升格', 3, 3),
    kp('eng9b-p21', 'eng9b-s3', '书面表达：连接词与篇章连贯', 1, 4, { bloom: '应用', weight: 4 }),
    kp('eng9b-p22', 'eng9b-s3', '书面表达：高级句式与升格技巧', 2, 4, { bloom: '应用', weight: 4, tags: ['高频考点'], prereq: ['eng9b-p21'] }),
    kp('eng9b-s4', 'eng9b-s', '听力', 4, 3),
    kp('eng9b-p23', 'eng9b-s4', '听力：数字计算、地点与信息转述', 1, 4, { bloom: '理解', weight: 3 }),
  ];

  const questions = [
    // ── p1 名词与形容词词形转换 ──
    q('eng9a-p1-q1', 'eng9a-p1', 'fill', '用括号内单词的正确形式填空：Edison was one of the greatest ______ (invent) in the world.',
      [], 'inventors', 'one of the + 最高级 + 复数名词；invent 加后缀 -or 构成表人的名词 inventor，此处用复数 inventors。', 2, 45),
    q('eng9a-p1-q2', 'eng9a-p1', 'single', 'His ______ to the question was quite clear.',
      ['answer', 'answered', 'answering', 'answers'], 0,
      '此处需要名词作句子主语，answer 意为“回答”；answered / answering 是动词形式，answers 与单数主语不符。', 2, 45),

    // ── p2 动词短语搭配 ──
    q('eng9a-p2-q1', 'eng9a-p2', 'single', 'It\'s cold outside, so ______ your coat.',
      ['take off', 'put on', 'take up', 'put off'], 1,
      '天冷应“穿上”外套，用 put on；take off 脱下，take up 开始从事／占用，put off 推迟。', 2, 45),
    q('eng9a-p2-q2', 'eng9a-p2', 'fill', '用适当的介词或副词填空：I am looking ______ to hearing from you soon.',
      [], 'forward', 'look forward to 意为“期待”，to 为介词，后接动名词 hearing。', 2, 40),

    // ── p3 易混词辨析 ──
    q('eng9a-p3-q1', 'eng9a-p3', 'single', 'It was ______ a lovely day that we decided to go out.',
      ['so', 'such', 'very', 'too'], 1,
      'such + a/an + 形容词 + 单数名词 + that…；so 的语序为 so + 形容词 + a/an + 名词。', 2, 45),
    q('eng9a-p3-q2', 'eng9a-p3', 'judge', 'Because it was raining, so we stayed at home.',
      ['对', '错'], 1,
      '英语中 because 与 so 不能同时使用，二者只留其一：Because it was raining, we stayed at home. 或 It was raining, so we stayed at home.', 2, 40),

    // ── p4 构词法 ──
    q('eng9a-p4-q1', 'eng9a-p4', 'fill', '用括号内单词的正确形式填空：It is ______ (possible) for me to finish the work in such a short time.',
      [], 'impossible', 'possible 加否定前缀 im- 构成 impossible，意为“不可能的”。', 2, 40),
    q('eng9a-p4-q2', 'eng9a-p4', 'single', 'The suffix “-less” in “careless” means ______.',
      ['full of', 'without', 'again', 'before'], 1,
      '后缀 -less 表示“没有、无”：careless = care（小心）+ less，即“粗心的”。', 1, 35),

    // ── p5 动词不规则变化与固定搭配 ──
    q('eng9a-p5-q1', 'eng9a-p5', 'fill', '用括号内动词的适当形式填空：He has ______ (write) three books so far.',
      [], 'written', 'so far 提示现在完成时，have/has + 过去分词，write 的过去分词是 written。', 2, 40),
    q('eng9a-p5-q2', 'eng9a-p5', 'single', 'Don\'t ______ your homework till the last minute.',
      ['put off', 'put on', 'put up', 'put out'], 0,
      'put off 推迟；put on 穿上，put up 举起／张贴，put out 扑灭。', 2, 45),

    // ── p6 现在完成时的构成与用法 ──
    q('eng9a-p6-q1', 'eng9a-p6', 'single', 'I ______ this book twice. It\'s very interesting.',
      ['read', 'have read', 'am reading', 'will read'], 1,
      '表示到现在为止的经历，用现在完成时 have read。', 2, 45),
    q('eng9a-p6-q2', 'eng9a-p6', 'judge', 'The present perfect tense can be used with the time expression “yesterday”.',
      ['对', '错'], 1,
      '现在完成时不能与表示过去的具体时间状语（如 yesterday、last week）连用，那些状语要用一般过去时。', 2, 40),

    // ── p7 延续性动词与 for / since ──
    q('eng9a-p7-q1', 'eng9a-p7', 'single', 'His grandfather ______ for ten years.',
      ['died', 'has died', 'has been dead', 'is dead'], 2,
      'die 是瞬间动词，不能与 for ten years 连用，须换成延续性表达 has been dead。', 3, 50),
    q('eng9a-p7-q2', 'eng9a-p7', 'fill', '用括号内动词的适当形式填空：I ______ (be) in this school since 2020.',
      [], 'have been', 'since + 时间点，表示从过去持续到现在，用现在完成时 have been。', 2, 40),

    // ── p8 一般现在时的被动语态 ──
    q('eng9a-p8-q1', 'eng9a-p8', 'single', 'The classroom ______ every day.',
      ['cleans', 'is cleaned', 'cleaned', 'is cleaning'], 1,
      '教室是“被打扫”的，主语是动作承受者，一般现在时被动语态为 is cleaned。', 1, 35),
    q('eng9a-p8-q2', 'eng9a-p8', 'fill', '用括号内动词的适当形式填空：English ______ (speak) in many countries.',
      [], 'is spoken', 'English 与 speak 是被动关系，主语为第三人称单数，用 is spoken。', 2, 40),

    // ── p9 一般过去时的被动语态 ──
    q('eng9a-p9-q1', 'eng9a-p9', 'single', 'The bridge ______ last year.',
      ['builds', 'built', 'was built', 'is built'], 2,
      '桥是“被建造”的，且时间是 last year，用一般过去时被动 was built。', 2, 45),
    q('eng9a-p9-q2', 'eng9a-p9', 'judge', 'The passive form of “They planted trees.” is “Trees were planted.”',
      ['对', '错'], 0,
      '主动句宾语 trees 变被动句主语，时态为一般过去时，故用 were planted。', 2, 40),

    // ── p10 情态动词 + be + 过去分词 ──
    q('eng9a-p10-q1', 'eng9a-p10', 'single', 'Trees ______ planted every year to protect the environment.',
      ['must', 'must be', 'must are', 'are must'], 1,
      '含情态动词的被动语态结构为“情态动词 + be + 过去分词”，故用 must be planted。', 2, 45),
    q('eng9a-p10-q2', 'eng9a-p10', 'fill', '用括号内动词的适当形式填空：The homework must ______ (hand) in before Friday.',
      [], 'be handed', 'must + be + 过去分词，hand in 意为“上交”，故填 be handed。', 2, 40),

    // ── p11 宾语从句的引导词与时态呼应 ──
    q('eng9a-p11-q1', 'eng9a-p11', 'single', 'He asked me ______ I had finished my homework.',
      ['that', 'if', 'what', 'which'], 1,
      '原句是可用 yes/no 回答的一般疑问句，变宾语从句用 if 或 whether 引导。', 2, 45),
    q('eng9a-p11-q2', 'eng9a-p11', 'single', 'The teacher told us that the earth ______ around the sun.',
      ['went', 'goes', 'will go', 'is going'], 1,
      '宾语从句表示客观真理时，即使主句是过去时，从句仍用一般现在时，故用 goes。', 3, 50),

    // ── p12 宾语从句的陈述语序 ──
    q('eng9a-p12-q1', 'eng9a-p12', 'single', 'Do you know ______?',
      ['where is he', 'where he is', 'where does he live', 'he is where'], 1,
      '宾语从句必须用陈述语序，即“引导词 + 主语 + 谓语”，故选 where he is。', 2, 45),
    q('eng9a-p12-q2', 'eng9a-p12', 'judge', 'The sentence “Can you tell me what time is it?” is correct.',
      ['对', '错'], 1,
      '宾语从句要用陈述语序，应改为 Can you tell me what time it is?', 2, 40),

    // ── p13 关系代词 who / which / that 的选择 ──
    q('eng9a-p13-q1', 'eng9a-p13', 'single', 'The man ______ is standing under the tree is our headmaster.',
      ['which', 'who', 'whom', 'what'], 1,
      '先行词 the man 指人且在定语从句中作主语，用关系代词 who（也可用 that）。', 2, 45),
    q('eng9a-p13-q2', 'eng9a-p13', 'single', 'This is the book ______ I bought yesterday.',
      ['who', 'whom', 'which', 'what'], 2,
      '先行词 the book 指物，用 which 或 that；who / whom 只指人，what 不能引导定语从句。', 2, 45),

    // ── p14 关系代词作宾语与省略 ──
    q('eng9a-p14-q1', 'eng9a-p14', 'single', 'The film ______ we saw last night was very moving.',
      ['who', 'whom', 'which', 'what'], 2,
      '先行词 the film 指物，关系代词在从句中作 saw 的宾语，用 which（或 that，也可省略）。', 2, 45),
    q('eng9a-p14-q2', 'eng9a-p14', 'judge', 'In “The book (that) I read is interesting.”, the relative pronoun “that” can be left out.',
      ['对', '错'], 0,
      '关系代词在定语从句中作宾语时可以省略，此句中 that 作 read 的宾语，故可省略。', 2, 40),

    // ── p15 时间状语从句 ──
    q('eng9a-p15-q1', 'eng9a-p15', 'single', '______ I was walking home, I met an old friend.',
      ['While', 'Before', 'After', 'Until'], 0,
      'while 引导时间状语从句，表示“当……的时候”，从句常用进行时，强调动作同时进行。', 2, 45),
    q('eng9a-p15-q2', 'eng9a-p15', 'single', 'I will call you ______ I arrive in Beijing.',
      ['while', 'when', 'since', 'until'], 1,
      'when 引导时间状语从句，表示“当……时”，从句用一般现在时表将来。', 2, 45),

    // ── p16 条件状语从句与主将从现 ──
    q('eng9a-p16-q1', 'eng9a-p16', 'single', 'If it ______ tomorrow, we will stay at home.',
      ['rains', 'will rain', 'rained', 'is raining'], 0,
      'if 引导条件状语从句时，“主将从现”：主句用一般将来时，从句用一般现在时，故用 rains。', 2, 45),
    q('eng9a-p16-q2', 'eng9a-p16', 'judge', 'The sentence “If you will come, I will tell you.” is correct.',
      ['对', '错'], 1,
      'if 引导条件状语从句时不能用 will，应改为 If you come, I will tell you.', 2, 40),

    // ── p17 不定式作宾语与目的状语 ──
    q('eng9a-p17-q1', 'eng9a-p17', 'single', 'She decided ______ a doctor when she grows up.',
      ['be', 'to be', 'being', 'been'], 1,
      'decide to do sth 意为“决定做某事”，用动词不定式作宾语。', 2, 45),
    q('eng9a-p17-q2', 'eng9a-p17', 'single', 'They got up early ______ the early bus.',
      ['catch', 'catching', 'to catch', 'caught'], 2,
      '不定式作目的状语，表示“为了赶上早班车”，故用 to catch。', 2, 45),

    // ── p18 动名词作主语与宾语 ──
    q('eng9a-p18-q1', 'eng9a-p18', 'single', 'I enjoy ______ to music in my free time.',
      ['listen', 'listening', 'to listen', 'listened'], 1,
      'enjoy 后接动名词作宾语，即 enjoy doing sth，故用 listening。', 2, 45),
    q('eng9a-p18-q2', 'eng9a-p18', 'fill', '用括号内动词的适当形式填空：Would you mind ______ (open) the window?',
      [], 'opening', 'mind 后接动名词，即 mind doing sth，故填 opening。', 2, 40),

    // ── p19 must / may / can't 表推测 ──
    q('eng9a-p19-q1', 'eng9a-p19', 'single', 'The light in his office is on. He ______ be at work.',
      ['must', 'can\'t', 'needn\'t', 'mustn\'t'], 0,
      '有根据的肯定推测用 must，意为“一定”。mustn\'t 表禁止，needn\'t 表不必。', 2, 45),
    q('eng9a-p19-q2', 'eng9a-p19', 'single', '— Is that Li Ming over there? — It ______ be him. He has gone to Beijing.',
      ['must', 'can\'t', 'may', 'needn\'t'], 1,
      '他已去北京，不可能在这儿，否定推测用 can\'t，意为“不可能”。', 2, 45),

    // ── p20 主谓一致 ──
    q('eng9a-p20-q1', 'eng9a-p20', 'single', 'Neither Tom nor his friends ______ interested in the film.',
      ['is', 'are', 'was', 'be'], 1,
      'neither…nor 连接并列主语时，谓语与最近的主语 his friends 保持一致，用 are。', 3, 50),
    q('eng9a-p20-q2', 'eng9a-p20', 'judge', 'In “The number of students in our class are 50.”, the verb “are” is correct.',
      ['对', '错'], 1,
      '“the number of + 复数名词”作主语时谓语用单数（is），表示“……的数量”；“a number of + 复数名词”作主语才用复数。', 3, 45),

    // ── p21 完形填空：上下文逻辑与连接词 ──
    q('eng9a-p21-q1', 'eng9a-p21', 'single', 'I was very tired, ______ I kept working till midnight.',
      ['but', 'so', 'and', 'or'], 0,
      '“很累”与“坚持工作到半夜”是转折关系，用 but。', 2, 45),
    q('eng9a-p21-q2', 'eng9a-p21', 'single', 'He studied hard, ______ he passed the exam easily.',
      ['but', 'so', 'or', 'though'], 1,
      '“努力学习”与“轻松通过考试”是因果关系，用 so。', 2, 45),

    // ── p22 阅读理解：细节定位与主旨大意 ──
    q('eng9a-p22-q1', 'eng9a-p22', 'single', 'The topic sentence of a paragraph usually appears ______.',
      ['at the beginning or the end', 'only in the title', 'in every sentence', 'in the middle only'], 0,
      '主题句（topic sentence）通常出现在段首或段尾，抓住它有助于快速把握段落大意。', 2, 45),
    q('eng9a-p22-q2', 'eng9a-p22', 'single', 'To find a specific detail quickly, you\'d better ______.',
      ['read every word carefully', 'look for key words such as names and numbers', 'guess the meaning of all new words', 'read the title only'], 1,
      '细节定位应抓住关键词（人名、地名、数字等）快速扫读原文。', 2, 45),

    // ── p23 短文填空（首字母提示） ──
    q('eng9a-p23-q1', 'eng9a-p23', 'fill', '根据首字母提示填空：He is not at home. He has g______ to Shanghai.',
      [], 'gone', 'has gone to 表示“去了某地（人不在说话处）”，首字母提示与句意对应 gone。', 2, 40),
    q('eng9a-p23-q2', 'eng9a-p23', 'fill', '根据首字母提示填空：The Great Wall is one of the most famous w______ in the world.',
      [], 'wonders', 'wonder 意为“奇观”，one of the most famous 后接复数名词，故填 wonders。', 2, 45),

    // ── p24 书面表达：话题作文结构与时态 ──
    q('eng9a-p24-q1', 'eng9a-p24', 'judge', 'When writing about last weekend, you should mainly use the simple past tense.',
      ['对', '错'], 0,
      '叙述过去发生的事，主体时态用一般过去时。', 1, 35),
    q('eng9a-p24-q2', 'eng9a-p24', 'single', 'Which is the best way to begin a letter to a friend?',
      ['Dear Tom,', 'To whom it may concern,', 'Yours sincerely,', 'Best wishes,'], 0,
      '给朋友写信通常以 Dear + 名字 开头；Yours sincerely / Best wishes 一般用于结尾。', 2, 40),

    // ── p1 名词与介词搭配 ──
    q('eng9b-p1-q1', 'eng9b-p1', 'fill', '用适当的介词填空：She is good ______ swimming.',
      [], 'at', 'be good at 意为“擅长”，后接名词或动名词。', 1, 35),
    q('eng9b-p1-q2', 'eng9b-p1', 'single', 'Our school is famous ______ its beautiful garden.',
      ['as', 'for', 'with', 'to'], 1,
      'be famous for 意为“因……而闻名”；be famous as 意为“作为……而闻名”。', 2, 45),

    // ── p2 动词短语辨析 ──
    q('eng9b-p2-q1', 'eng9b-p2', 'single', 'Please ______ the light when you leave the room.',
      ['turn on', 'turn off', 'turn up', 'turn down'], 1,
      '离开房间应“关灯”，用 turn off；turn on 打开，turn up 调高音量，turn down 调低音量为。', 2, 45),
    q('eng9b-p2-q2', 'eng9b-p2', 'single', 'His dream of being a pilot came ______ at last.',
      ['true', 'up', 'on', 'over'], 0,
      'come true 意为“实现、成真”，是固定搭配。', 2, 40),

    // ── p3 形容词辨析 ──
    q('eng9b-p3-q1', 'eng9b-p3', 'single', 'The book is very ______, and I am ______ in it.',
      ['interesting; interesting', 'interested; interested', 'interesting; interested', 'interested; interesting'], 2,
      'interesting 形容事物“令人感兴趣的”，interested 形容人“感到有兴趣的”，be interested in 意为“对……感兴趣”。', 2, 45),
    q('eng9b-p3-q2', 'eng9b-p3', 'single', 'He works ______ and always gets good grades.',
      ['hard', 'hardly', 'harder', 'hardest'], 0,
      'hard 作副词意为“努力地”；hardly 意为“几乎不”，与句意不符。', 3, 50),

    // ── p4 构词法：前缀与后缀 ──
    q('eng9b-p4-q1', 'eng9b-p4', 'fill', '用括号内单词的正确形式填空：It is ______ (fair) to cheat in the exam.',
      [], 'unfair', 'cheat（作弊）是不公平的行为，fair 加否定前缀 un- 构成 unfair。', 2, 40),
    q('eng9b-p4-q2', 'eng9b-p4', 'single', 'The prefix “dis-” in “disagree” means ______.',
      ['again', 'not', 'before', 'too'], 1,
      '前缀 dis- 表示否定，agree 同意 → disagree 不同意。', 1, 35),

    // ── p5 中考高频固定搭配 ──
    q('eng9b-p5-q1', 'eng9b-p5', 'fill', '用括号内动词的适当形式填空：He is used to ______ (get) up early.',
      [], 'getting', 'be used to doing sth 意为“习惯于做某事”，to 是介词，后接动名词，故填 getting。', 3, 45),
    q('eng9b-p5-q2', 'eng9b-p5', 'single', 'It\'s important for us ______ English well.',
      ['learn', 'to learn', 'learning', 'learned'], 1,
      '“It is + 形容词 + for sb + to do sth”句型中，真正主语是动词不定式，故用 to learn。', 2, 45),

    // ── p6 一般时与情态动词的被动语态 ──
    q('eng9b-p6-q1', 'eng9b-p6', 'single', 'The new bridge ______ by the end of last year.',
      ['completes', 'completed', 'was completed', 'has completed'], 2,
      '桥是“被建成”的，时间是 by the end of last year，用一般过去时被动 was completed。', 3, 50),
    q('eng9b-p6-q2', 'eng9b-p6', 'fill', '用括号内动词的适当形式填空：The task must ______ (finish) today.',
      [], 'be finished', '含情态动词的被动语态结构为“情态动词 + be + 过去分词”，故填 be finished。', 2, 40),

    // ── p7 被动语态与主动语态辨析 ──
    q('eng9b-p7-q1', 'eng9b-p7', 'single', 'These photos ______ by my father last summer.',
      ['take', 'took', 'were taken', 'are taken'], 2,
      'photos 与 take 是被动关系，时间是 last summer，用一般过去时被动 were taken。', 2, 45),
    q('eng9b-p7-q2', 'eng9b-p7', 'judge', 'In the passive voice, the object of the active sentence becomes the subject.',
      ['对', '错'], 0,
      '主动语态的宾语在被动语态中作主语，这是主动变被动的核心步骤。', 2, 40),

    // ── p8 宾语从句与定语从句引导词辨析 ──
    q('eng9b-p8-q1', 'eng9b-p8', 'single', 'I don\'t know ______ he will come or not.',
      ['if', 'whether', 'that', 'what'], 1,
      '与 or not 直接连用时只能用 whether，不能用 if。', 3, 50),
    q('eng9b-p8-q2', 'eng9b-p8', 'single', 'I still remember the day ______ we first met.',
      ['which', 'who', 'when', 'where'], 2,
      '先行词 the day 表示时间，且从句 we first met 不缺主语和宾语，用关系副词 when。', 3, 50),

    // ── p9 定语从句关系代词与关系副词的选择 ──
    q('eng9b-p9-q1', 'eng9b-p9', 'single', 'This is the factory ______ my father works.',
      ['which', 'that', 'where', 'who'], 2,
      '先行词 the factory 表示地点，从句 my father works 不缺主宾，用关系副词 where。', 3, 50),
    q('eng9b-p9-q2', 'eng9b-p9', 'judge', 'A relative pronoun can be left out when it is the subject of the clause.',
      ['对', '错'], 1,
      '关系代词作从句主语时不能省略，只有作宾语时才可以省略。', 3, 45),

    // ── p10 现在完成时与一般过去时的辨析 ──
    q('eng9b-p10-q1', 'eng9b-p10', 'single', '— Have you ever been to Beijing? — Yes, I ______ there last year.',
      ['have been', 'went', 'go', 'had been'], 1,
      '句中有明确的过去时间状语 last year，要用一般过去时 went。', 3, 50),
    q('eng9b-p10-q2', 'eng9b-p10', 'judge', 'The present perfect tense emphasizes the effect on the present, while the simple past only tells what happened in the past.',
      ['对', '错'], 0,
      '现在完成时强调对现在造成的影响或结果，一般过去时只叙述过去发生的事。', 2, 45),

    // ── p11 过去完成时与一般过去时的先后 ──
    q('eng9b-p11-q1', 'eng9b-p11', 'single', 'When I got to the cinema, the film ______ already ______.',
      ['began', 'has begun', 'had begun', 'begins'], 2,
      '“我到电影院”是过去某时，电影在此之前就已开始，用过去完成时 had begun。', 3, 50),
    q('eng9b-p11-q2', 'eng9b-p11', 'fill', '用括号内动词的适当形式填空：By the time he arrived, we ______ (finish) the work.',
      [], 'had finished', 'by the time 从句用一般过去时，主句动作发生在它之前，用过去完成时 had finished。', 3, 45),

    // ── p12 原因、结果与让步状语从句 ──
    q('eng9b-p12-q1', 'eng9b-p12', 'single', '______ he is young, he knows a lot.',
      ['Because', 'Although', 'So', 'If'], 1,
      '“年纪小”与“懂得多”是让步关系，用 Although / Though 引导让步状语从句。', 2, 45),
    q('eng9b-p12-q2', 'eng9b-p12', 'single', 'We stayed at home ______ it was raining heavily.',
      ['because', 'so', 'although', 'but'], 0,
      '“下大雨”是“待在家”的原因，用 because 引导原因状语从句。', 2, 45),

    // ── p13 时间与条件状语从句（主将从现） ──
    q('eng9b-p13-q1', 'eng9b-p13', 'single', 'I will tell him the news as soon as he ______ back.',
      ['comes', 'will come', 'came', 'is coming'], 0,
      'as soon as 引导时间状语从句，主句是一般将来时，从句用一般现在时表将来，故用 comes。', 3, 50),
    q('eng9b-p13-q2', 'eng9b-p13', 'judge', 'The sentence “We will start as soon as he will arrive.” is correct.',
      ['对', '错'], 1,
      '时间状语从句中不能用将来时，应改为 as soon as he arrives。', 2, 40),

    // ── p14 不定式与动名词的用法辨析 ──
    q('eng9b-p14-q1', 'eng9b-p14', 'single', 'Remember ______ the door when you leave.',
      ['to close', 'closing', 'close', 'closed'], 0,
      'remember to do sth 意为“记得去做某事（还没做）”；remember doing sth 意为“记得做过某事”。', 3, 50),
    q('eng9b-p14-q2', 'eng9b-p14', 'single', 'My father is busy ______ his car.',
      ['to wash', 'washing', 'wash', 'washed'], 1,
      'be busy doing sth 意为“忙于做某事”，用动名词。', 2, 45),

    // ── p15 间接引语中的人称、时态与时间变化 ──
    q('eng9b-p15-q1', 'eng9b-p15', 'single', 'He said, “I am tired.” → He said that he ______ tired.',
      ['is', 'was', 'has been', 'will be'], 1,
      '主句是过去时，间接引语中一般现在时要改为一般过去时，am 变为 was。', 3, 50),
    q('eng9b-p15-q2', 'eng9b-p15', 'single', '“I will come tomorrow,” she said. → She said she ______ come the next day.',
      ['will', 'would', 'can', 'did'], 1,
      'will 在间接引语中改为 would，tomorrow 也相应改为 the next day。', 3, 50),

    // ── p16 并列关联词 ──
    q('eng9b-p16-q1', 'eng9b-p16', 'single', '______ Tom ______ his brother is going to the party. Both of them like it.',
      ['Either; or', 'Neither; nor', 'Both; and', 'Not; but'], 2,
      '由后句 Both of them 可知两人都去，用 both…and…。', 2, 45),
    q('eng9b-p16-q2', 'eng9b-p16', 'single', 'You can ______ stay at home ______ go out with us.',
      ['both; and', 'either; or', 'neither; nor', 'not only; but also'], 1,
      'either…or… 表示“要么……要么……”，符合句意。', 2, 45),

    // ── p17 情态动词表推测与禁止、不必 ──
    q('eng9b-p17-q1', 'eng9b-p17', 'single', 'He ______ be at home now, because I saw him go out just now.',
      ['must', 'can\'t', 'may', 'needn\'t'], 1,
      '“我刚刚看见他出去了”，所以他不可能在家，否定推测用 can\'t。', 2, 45),
    q('eng9b-p17-q2', 'eng9b-p17', 'single', 'You ______ swim in this river. It\'s dangerous.',
      ['mustn\'t', 'needn\'t', 'may', 'can'], 0,
      'mustn\'t 表示禁止“不准”；needn\'t 意为“不必”，与危险的语境不符。', 2, 45),

    // ── p18 完形填空：词义辨析与固定搭配 ──
    q('eng9b-p18-q1', 'eng9b-p18', 'single', 'The boy was so ______ that he could not say a word.',
      ['excited', 'exciting', 'excite', 'excitement'], 0,
      '修饰人（the boy）表示“感到激动的”用 -ed 形容词 excited；exciting 形容事物。', 2, 45),
    q('eng9b-p18-q2', 'eng9b-p18', 'single', 'The accident ______ last night. Luckily, no one was hurt.',
      ['was happened', 'happened', 'is happened', 'happens'], 1,
      'happen 是不及物动词，没有被动语态；时间为 last night，故用过去式 happened。', 3, 50),

    // ── p19 阅读理解：推理判断与词义猜测 ──
    q('eng9b-p19-q1', 'eng9b-p19', 'single', 'When you guess the meaning of a new word, you can ______.',
      ['use the context around it', 'skip the whole passage', 'stop reading at once', 'look up every word'], 0,
      '词义猜测最常用的方法就是利用上下文（context）中的线索。', 2, 45),
    q('eng9b-p19-q2', 'eng9b-p19', 'single', 'The writer\'s attitude in a passage can often be found from ______.',
      ['the title only', 'words showing feelings and opinions', 'the number of paragraphs', 'the punctuation only'], 1,
      '作者态度常通过表达情感与观点的词语体现出来。', 3, 50),

    // ── p20 短文填空：选词填空与语法形式变化 ──
    q('eng9b-p20-q1', 'eng9b-p20', 'fill', '用括号内单词的适当形式填空：We should take an active part in ______ (protect) the environment.',
      [], 'protecting', '介词 in 后接动名词，take part in doing sth 意为“参加做某事”，故填 protecting。', 2, 45),
    q('eng9b-p20-q2', 'eng9b-p20', 'fill', '用括号内动词的适当形式填空：Many changes ______ (take) place in my hometown in recent years.',
      [], 'have taken', 'in recent years 常与现在完成时连用，主语 changes 为复数，take place 无被动，故填 have taken。', 3, 50),

    // ── p21 书面表达：连接词与篇章连贯 ──
    q('eng9b-p21-q1', 'eng9b-p21', 'single', 'Which word can best show the relationship of “adding information”?',
      ['However', 'Besides', 'Instead', 'Although'], 1,
      'Besides 意为“另外、而且”，用于补充信息；However / Although 表转折或让步，Instead 表替代。', 2, 45),
    q('eng9b-p21-q2', 'eng9b-p21', 'judge', 'Using linking words such as “first, then, finally” can make a composition more logical.',
      ['对', '错'], 0,
      '恰当使用连接词能使文章层次清晰、逻辑连贯。', 2, 40),

    // ── p22 书面表达：高级句式与升格技巧 ──
    q('eng9b-p22-q1', 'eng9b-p22', 'single', 'Which is a better “upgraded” version of “The city is very beautiful.”?',
      ['The city is beautiful.', 'What a beautiful city it is!', 'The city is a city.', 'I like the city very much.'], 1,
      '用感叹句升格，句式更丰富、更有表现力，是书面表达加分的手法之一。', 3, 50),
    q('eng9b-p22-q2', 'eng9b-p22', 'judge', 'In an English composition, using many simple sentences with the same structure helps get a high score.',
      ['对', '错'], 1,
      '句式应长短结合、适当变化，全是同一结构的简单句会显得单调，不利于得高分。', 2, 40),

    // ── p23 听力：数字、地点与信息转述 ──
    q('eng9b-p23-q1', 'eng9b-p23', 'single', '听到“The film starts at a quarter past seven.”，放映时间是（ ）。',
      ['7:15', '7:45', '6:15', '7:30'], 0,
      'a quarter past seven 意为“七点一刻”，即 7:15。', 2, 45),
    q('eng9b-p23-q2', 'eng9b-p23', 'single', '听到“It\'s half past three.”，时间是（ ）。',
      ['3:00', '3:30', '30:30', '2:30'], 1,
      'half past three 意为“三点半”，即 3:30。', 2, 45),
  ];

  const lessons = {
    'eng9a-p1': [
        {
          'version': 1,
          'oneLiner': '词性由它在句子里的位置决定：作主语宾语用名词，修饰名词用形容词。',
          'problem': '只看中文意思，不看这个词在句中“站什么位置”，就会把名词、形容词、动词写混。',
          'analogy': '同一个词像有好几双鞋：名词鞋、形容词鞋、动词鞋。要看清它今天在句子里走的是哪条路，再挑对应的一双。',
          'example': 'invent 是动词；inventor 指“发明家”（人）；invention 指“发明物”。one of the greatest inventors 要用表示人的名词复数。',
          'pitfalls': [
            '判断词性先看位置：冠词／介词后用名词，名词前用形容词',
            'one of the + 最高级 + 复数名词，别漏掉复数',
            '后缀有信号：-or / -er 多指人，-tion / -ment 多是抽象名词'
          ],
          'check': [
            {
              'stem': 'Edison was one of the greatest ______ (invent) in the world.',
              'options': ['inventor', 'inventors', 'invention', 'inventions'],
              'answer': 1,
              'explanation': 'one of the + 最高级 + 复数名词，且此处指“发明家”，故用 inventors。'
            },
            {
              'stem': 'His ______ to the question was quite clear.',
              'options': ['answer', 'answered', 'answering'],
              'answer': 0,
              'explanation': '空格前有形容词性物主代词 his，需填名词 answer 作主语。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '先问“这个空要当什么用”，再决定给词换什么“工作服”。',
          'problem': '很多同学一看到括号里的词就按最熟的意思填，忘了题目其实在考“词形转换”。',
          'analogy': '像给演员换角色：同一个演员（词根）可以演主角（名词）、演助手（形容词），台词和服装都要跟着角色变。',
          'example': '括号给 science，The ______ are working hard. 主语位置、复数概念，填 scientists，而不是 science。',
          'pitfalls': [
            '先判断句子成分，再决定词形',
            '主语位置的名词要与谓语在数上一致',
            '形容词转名词别丢后缀，如 true → truth'
          ],
          'check': [
            {
              'stem': '用括号内单词的正确形式填空：The ______ (science) are doing research on this problem.',
              'options': ['science', 'scientist', 'scientists'],
              'answer': 2,
              'explanation': '主语位置需表示“科学家”的名词，且由 are 可知用复数 scientists。'
            },
            {
              'stem': 'It is ______ (nation) news that everyone should know.',
              'options': ['nation', 'national', 'nationally'],
              'answer': 1,
              'explanation': '修饰名词 news 要用形容词 national（全国的）。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p2': [
        {
          'version': 1,
          'oneLiner': '动词短语靠“小品词”定方向：同一个动词换个介词，意思就变了。',
          'problem': '只记住动词本身，把 put on、put off、put up 当同一个词，一到语境题就选错。',
          'analogy': '一个动词像手电筒，后面的介词副词就是灯头方向：照哪里由灯头决定，put 后面接 on 还是 off，意思完全不同。',
          'example': 'It\'s cold, so put on your coat.（穿上）；Don\'t put off your homework.（推迟）；They put up a tent.（搭起）。',
          'pitfalls': [
            'put on 穿上／put off 推迟／put up 举起张贴／put out 扑灭',
            'look forward to 中的 to 是介词，后接 doing 不接 do',
            'take off 脱下（也可指飞机起飞），take up 开始从事或占用'
          ],
          'check': [
            {
              'stem': 'It\'s cold outside, so ______ your coat.',
              'options': ['take off', 'put on', 'put off'],
              'answer': 1,
              'explanation': '天冷要“穿上”外套，用 put on。'
            },
            {
              'stem': 'I am looking ______ to hearing from you soon.',
              'options': ['forward', 'for', 'after'],
              'answer': 0,
              'explanation': 'look forward to doing sth 意为“期待做某事”，to 后接动名词 hearing。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '背短语要“整条打包”，连同它的介词和搭配对象一起记。',
          'problem': '把短语拆开背，只记 put=放，考试时无法区分 put up 和 put on。',
          'analogy': '短语像快递的“组合套餐”，不能只记住主菜，还得连着配菜（介词）一起点，点错了就是另一份套餐。',
          'example': 'look 系列：look after 照顾、look up 查阅、look forward to 期待。四个短语，四个方向，要成组记忆。',
          'pitfalls': [
            '短语要连介词一起背，不能只背动词',
            '区分 turn on / off / up / down 四个方向',
            'be good at、be interested in 等固定搭配中的介词是唯一的'
          ],
          'check': [
            {
              'stem': 'Please look ______ the baby while I am away.',
              'options': ['after', 'up', 'forward'],
              'answer': 0,
              'explanation': 'look after 意为“照顾”，符合“我不在时照看婴儿”的语境。'
            },
            {
              'stem': 'Please ______ the light when you leave.',
              'options': ['turn on', 'turn off', 'turn up'],
              'answer': 1,
              'explanation': '离开时“关灯”，用 turn off。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p3': [
        {
          'version': 1,
          'oneLiner': 'such 接名词，so 接形容词；because 和 so 只留一个。',
          'problem': '受中文影响，把 such 和 so 混用，还常写出“Because…so…”这类双重连接词。',
          'analogy': 'such 像给整份套餐加形容词外套，后面必须有名词；so 只管形容词本身。两者分工不同，别让它们抢对方的活儿。',
          'example': 'It was such a lovely day that…（such + a + 形容词 + 名词）；because 与 so 是“二选一”，不能同现。',
          'pitfalls': [
            'such + a/an + 形容词 + 单数名词；so + 形容词 + a/an + 名词',
            'because 引导原因，so 引导结果，两者不能同时出现',
            'such 后如果是不可数名词或复数名词，直接 such + 形容词 + 名词'
          ],
          'check': [
            {
              'stem': 'It was ______ a lovely day that we decided to go out.',
              'options': ['so', 'such', 'very'],
              'answer': 1,
              'explanation': 'such + a/an + 形容词 + 单数名词 + that 结构，故用 such。'
            },
            {
              'stem': '“Because it was raining, so we stayed at home.” 这句话 ______。',
              'options': ['正确', '错误'],
              'answer': 1,
              'explanation': 'because 与 so 不能同时使用，应去掉其中一个。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '先判断前后是“原因”还是“结果”，从两套连接词里各挑一个。',
          'problem': '句子一长就忘记“连接词只能留一个”，导致写出中式英语。',
          'analogy': '像量体温：原因和结果是一件事的两面，只能用一支温度计记录，不能两边都插一支，否则就重复了。',
          'example': 'Because he was ill, he didn\'t come.（原因在前）＝ He was ill, so he didn\'t come.（结果在后）。',
          'pitfalls': [
            'because 与 so、although 与 but 都不能连用',
            'though 放句首或句中，不能与 but 并用',
            'such 与 so 的选择看后面是名词还是形容词'
          ],
          'check': [
            {
              'stem': 'It was raining heavily, ______ we stayed at home.',
              'options': ['because', 'so', 'though'],
              'answer': 1,
              'explanation': '前半是原因、后半是结果，用 so 引结果，且不能再用 because。'
            },
            {
              'stem': 'He is only ten, ______ he knows a lot.',
              'options': ['so', 'but', 'because'],
              'answer': 1,
              'explanation': '“只有十岁”与“懂得很多”是转折关系，用 but。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p4': [
        {
          'version': 1,
          'oneLiner': '看后缀猜词义：-less 是“没有”，-ful 是“充满”，un- / im- / dis- 是否定。',
          'problem': '遇到生词就查词典，不会用构词法“拆词”猜意思。',
          'analogy': '单词像积木：词根是主体，前缀是帽子，后缀是鞋子。看帽子和鞋子，就能猜出这个积木大概长什么样、属于哪一类。',
          'example': 'hope（希望）→ hopeless（无望的）／hopeful（有希望的）；possible → impossible（不可能的）。',
          'pitfalls': [
            '-less 表“没有”，-ful 表“充满”，别记反',
            '否定前缀：un-（unhappy）、im-（impossible）、dis-（disagree）',
            '前缀一般不改变词性，后缀常常改变词性'
          ],
          'check': [
            {
              'stem': 'It is ______ (possible) for me to finish the work in such a short time.',
              'options': ['possible', 'impossible', 'possibly'],
              'answer': 1,
              'explanation': '这么短时间完成工作是不可能的，possible 加否定前缀 im- 构成 impossible。'
            },
            {
              'stem': 'The suffix “-less” in “careless” means ______.',
              'options': ['full of', 'without', 'again'],
              'answer': 1,
              'explanation': '-less 表示“没有、无”，careless 意为“不小心的”。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '拆词三步：先找词根，再看前缀否定与否，最后看后缀定词性。',
          'problem': '一看到长单词就发懵，不去拆解，其实很多中考词都能“拼”出来。',
          'analogy': '像认人先认脸的中部（词根），再看有没有戴帽子（前缀）、穿什么鞋（后缀），整体形象就清晰了。',
          'example': 'un + happy = unhappy；dis + agree = disagree；care + ful = careful（形容词）。',
          'pitfalls': [
            '先定词性（后缀），再定肯否（前缀），最后定词义（词根）',
            'im- 用于 m、p、b 开头的词前（impossible、important）',
            'en- 常作动词前缀：enjoy、encourage'
          ],
          'check': [
            {
              'stem': 'The prefix “dis-” in “disagree” means ______.',
              'options': ['again', 'not', 'before'],
              'answer': 1,
              'explanation': 'dis- 表否定，agree 同意 → disagree 不同意。'
            },
            {
              'stem': '用括号内单词的正确形式填空：It is ______ (fair) to cheat in the exam.',
              'options': ['fair', 'unfair', 'fairly'],
              'answer': 1,
              'explanation': '考试作弊是不公平的，fair 加否定前缀 un- 构成 unfair。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p5': [
        {
          'version': 1,
          'oneLiner': '不规则动词的过去式和过去分词只能背，但可以按“变化模式”归类记。',
          'problem': 'write、buy、go 这类高频动词的三种形式靠临场想，常常写错。',
          'analogy': '像记家族成员：有的原形、过去式、过去分词长得一样（put-put-put），有的三个都不一样（go-went-gone），按家族分组记更快。',
          'example': 'write-wrote-written；buy-bought-bought；go-went-gone；put-put-put。',
          'pitfalls': [
            'write 的过去分词是 written，不是 wrote',
            '现在完成时用“have/has + 过去分词”，不是过去式',
            'put、cut、let 等三种形式同形，别画蛇添足加 -ed'
          ],
          'check': [
            {
              'stem': 'He has ______ (write) three books so far.',
              'options': ['wrote', 'written', 'writing'],
              'answer': 1,
              'explanation': 'so far 提示现在完成时，用过去分词 written。'
            },
            {
              'stem': 'Don\'t ______ your homework till the last minute.',
              'options': ['put off', 'put on', 'put up'],
              'answer': 0,
              'explanation': 'put off 意为“推迟”，符合“别拖到最后一刻”的语境。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '把不规则动词分成“同形族、改元音族、加 -en 族”，一组一组背。',
          'problem': '一个个孤立地背，前背后忘，考试时还得靠猜。',
          'analogy': '像整理衣柜：按“同形”“换元音”“加尾巴”三格摆放，找的时候按格去取，比堆成一团快得多。',
          'example': '同形族：put-put-put、cut-cut-cut；改元音族：begin-began-begun；加 -en 族：write-wrote-written。',
          'pitfalls': [
            '同类动词一起背，形成规律记忆',
            'have/has/had 后一律接过去分词',
            'be 动词的三种形式：be-was/were-been'
          ],
          'check': [
            {
              'stem': '用括号内动词的适当形式填空：I have ______ (see) this film twice.',
              'options': ['saw', 'seen', 'seeing'],
              'answer': 1,
              'explanation': '现在完成时用过去分词，see 的过去分词是 seen。'
            },
            {
              'stem': 'The window was ______ (break) by the boy.',
              'options': ['broke', 'broken', 'breaking'],
              'answer': 1,
              'explanation': '被动语态 be + 过去分词，break 的过去分词是 broken。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p6': [
        {
          'version': 1,
          'oneLiner': '现在完成时＝have/has + 过去分词，表示“到现在为止”的经历或结果。',
          'problem': '把现在完成时和一般过去时混用，一看到过去的事就套完成时。',
          'analogy': '像照相：现在完成时拍的是一张“到目前为止”的合影，重点在于这张合影和现在的关系，而不是快门按下的那一刻。',
          'example': 'I have read this book twice.（到现在为止读了两遍）／I read it last week.（上周读的，纯过去的动作）。',
          'pitfalls': [
            '现在完成时不能与 yesterday、last week 等具体过去时间连用',
            '结构必须是 have/has + 过去分词',
            'already、yet、ever、never、just 常与现在完成时搭配'
          ],
          'check': [
            {
              'stem': 'I ______ this book twice. It\'s very interesting.',
              'options': ['read', 'have read', 'will read'],
              'answer': 1,
              'explanation': '表示“到现在为止读了两遍”的经历，用现在完成时 have read。'
            },
            {
              'stem': '“The present perfect tense can be used with yesterday.” 这句话 ______。',
              'options': ['正确', '错误'],
              'answer': 1,
              'explanation': '现在完成时不能与表示过去的具体时间状语连用。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '一句话问自己：这事“结束了没有”？结束了用过去时，还没结束、影响现在用完成时。',
          'problem': '句子里有没有过去时间状语，是判断的关键，很多同学却忽略这一点。',
          'analogy': '像看一道菜是否还在锅里：还在炖（延续到现在）就用现在完成时；早就盛盘上桌了（过去结束）就用一般过去时。',
          'example': 'He has lived here for ten years.（仍住这）／He lived here for ten years.（现在不住了）。',
          'pitfalls': [
            '有过去时间状语 → 用一般过去时',
            'for + 时间段、since + 时间点 → 常配现在完成时',
            'already 多用于肯定句，yet 多用于疑问句和否定句'
          ],
          'check': [
            {
              'stem': '— Have you ever been to Beijing? — Yes, I ______ there last year.',
              'options': ['have been', 'went', 'had been'],
              'answer': 1,
              'explanation': '有明确的过去时间 last year，要用一般过去时 went。'
            },
            {
              'stem': '用括号内动词的适当形式填空：She ______ (live) in Shanghai since 2015.',
              'options': ['lived', 'has lived', 'lives'],
              'answer': 1,
              'explanation': 'since 2015 表示从过去持续到现在，用现在完成时 has lived。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p7': [
        {
          'version': 1,
          'oneLiner': '瞬间动词不能和 for / since 连用，要换成对应的延续性动词。',
          'problem': '写“He has died for ten years.”这类句子，把瞬间动作当成能持续的状态。',
          'analogy': '“死”像按一下开关，是瞬间发生、不能持续的动作；而“处于死亡状态”才是可以一直延续的状态。开关没法按住十年，状态才能持续十年。',
          'example': 'die → be dead；begin → be on；lend → keep；buy → have；join → be a member of。',
          'pitfalls': [
            '瞬间动词：die、begin、buy、lend、join、go 等',
            'die → has been dead；begin → has been on',
            'for + 时间段，since + 时间点，两者可互换'
          ],
          'check': [
            {
              'stem': 'His grandfather ______ for ten years.',
              'options': ['has died', 'has been dead', 'died'],
              'answer': 1,
              'explanation': 'die 是瞬间动词，与 for ten years 连用要改成延续性表达 has been dead。'
            },
            {
              'stem': '用括号内动词的适当形式填空：I ______ (be) in this school since 2020.',
              'options': ['was', 'have been', 'am'],
              'answer': 1,
              'explanation': 'since 2020 表示从过去持续到现在，用现在完成时 have been。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '改写的诀窍：把“瞬间动作”翻译成“持续状态”，常用 be + 形容词／介词短语。',
          'problem': '只记得不能配 for，却不知道改成什么形式。',
          'analogy': '像把一张“按快门的瞬间”换成一段“录像”：动作是快门，状态是录像，for + 时间要接的是录像。',
          'example': 'The film has been on for ten minutes.（电影已放映十分钟）— 不能说 has begun for ten minutes。',
          'pitfalls': [
            'borrow → keep，buy → have，join → be in / be a member of',
            'come / go → be here / be there',
            '改写后仍要用完成时，别漏掉 has / have'
          ],
          'check': [
            {
              'stem': 'The film ______ for ten minutes.',
              'options': ['has begun', 'has been on', 'began'],
              'answer': 1,
              'explanation': 'begin 是瞬间动词，与 for ten minutes 连用要改成 has been on。'
            },
            {
              'stem': '用括号内动词的适当形式填空：He ______ (keep) the book for two weeks.',
              'options': ['borrowed', 'has kept', 'keeps'],
              'answer': 1,
              'explanation': '借书两周表示持续状态，borrow 改为 keep，用现在完成时 has kept。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p8': [
        {
          'version': 1,
          'oneLiner': '一般现在时被动语态＝am/is/are + 过去分词，主语是动作的承受者。',
          'problem': '分不清主动被动，看到动词就按主动形式写。',
          'analogy': '主动句是“谁做了什么”，被动句是“什么被做了”。主语从前面的“施动者”换成了“承受者”，动词自然要穿被动的“外衣”be + 过去分词。',
          'example': 'People clean the classroom every day. → The classroom is cleaned every day.',
          'pitfalls': [
            'be 动词要与新主语的人称、数一致',
            '主语是动作承受者时才用被动',
            '过去分词别写成过去式'
          ],
          'check': [
            {
              'stem': 'The classroom ______ every day.',
              'options': ['cleans', 'is cleaned', 'cleaned'],
              'answer': 1,
              'explanation': '教室是“被打扫”的，一般现在时被动用 is cleaned。'
            },
            {
              'stem': 'English ______ (speak) in many countries.',
              'options': ['speaks', 'is spoken', 'spoke'],
              'answer': 1,
              'explanation': 'English 与 speak 是被动关系，用 is spoken。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '主动变被动三步：宾语提到句首作主语，动词变 be + 过去分词，原主语前加 by。',
          'problem': '会认被动句，但自己动手改时容易漏掉 be 或忘记改时态。',
          'analogy': '像搬家：把原来在“宾语”位置的家当搬到“主语”的房子里，动词要换一套适应新家的动作（be + 过去分词）。',
          'example': 'They grow rice in the south. → Rice is grown in the south (by them).',
          'pitfalls': [
            '一般现在时被动：am / is / are + 过去分词',
            '原主语若无关紧要，by 短语可省略',
            '不及物动词（happen、appear）没有被动语态'
          ],
          'check': [
            {
              'stem': 'Rice ______ in the south of China.',
              'options': ['grows', 'is grown', 'grew'],
              'answer': 1,
              'explanation': 'rice 是“被种植”的，一般现在时被动用 is grown。'
            },
            {
              'stem': 'The song ______ by many young people.',
              'options': ['likes', 'is liked', 'liked'],
              'answer': 1,
              'explanation': '歌是“被喜欢”的，用 is liked。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p9': [
        {
          'version': 1,
          'oneLiner': '一般过去时被动语态＝was / were + 过去分词，表示过去“被做”的事。',
          'problem': '看到 last year、in 1990 这类过去时间，还照抄一般现在时被动。',
          'analogy': '和一般现在时被动是同一件“被动外套”，只是把 be 动词换成过去的尺寸 was / were，因为事情发生在过去。',
          'example': 'The bridge was built last year. The trees were planted in 2010.',
          'pitfalls': [
            'was 用于单数主语，were 用于复数主语',
            '时间状语是过去 → be 动词也要用过去式',
            '过去分词不变，只变 be 动词的时态'
          ],
          'check': [
            {
              'stem': 'The bridge ______ last year.',
              'options': ['built', 'was built', 'is built'],
              'answer': 1,
              'explanation': '桥是“被建造”的，时间是 last year，用 was built。'
            },
            {
              'stem': 'The trees ______ by us last spring.',
              'options': ['planted', 'were planted', 'are planted'],
              'answer': 1,
              'explanation': 'tree 是复数主语，过去时被动用 were planted。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '记住公式：过去被动 = was/were + 过去分词，别与“was/were + 现在分词（过去进行）”搞混。',
          'problem': 'was built 与 was building 长得像，一紧张就写错。',
          'analogy': '过去分词像“成品照片”，过去分词前加 was/were 是“被做成的成品”（被动）；带 -ing 的则是“正在拍的过程”（进行）。看结尾就能分辨。',
          'example': 'The house was built in 1990.（被建成，被动）VS He was building a house then.（正在建，过去进行）。',
          'pitfalls': [
            '被动用过去分词，进行用 -ing，形式不同',
            '先判断主语是不是动作承受者',
            'by 短语说明动作发出者，可省'
          ],
          'check': [
            {
              'stem': 'These photos ______ by my father last summer.',
              'options': ['took', 'were taken', 'are taken'],
              'answer': 1,
              'explanation': 'photos 与 take 是被动关系，过去时被动用 were taken。'
            },
            {
              'stem': 'The homework ______ (finish) yesterday.',
              'options': ['finished', 'was finished', 'is finished'],
              'answer': 1,
              'explanation': '作业是“被完成”的，时间为 yesterday，用 was finished。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p10': [
        {
          'version': 1,
          'oneLiner': '含情态动词的被动语态＝情态动词 + be + 过去分词，be 永远是原形。',
          'problem': '写成“must planted”“can done”，把 be 落掉或用了错形式。',
          'analogy': '情态动词后面永远只能接动词原形，所以被动里的 be 也必须保持“素颜”原形，不能变 is / was。',
          'example': 'Waste paper can be recycled. The homework must be handed in on time.',
          'pitfalls': [
            '公式：情态动词 + be + 过去分词',
            'be 不受主语影响，始终用原形',
            'can / must / should / may 均可这样用'
          ],
          'check': [
            {
              'stem': 'Trees ______ planted every year to protect the environment.',
              'options': ['must', 'must be', 'must are'],
              'answer': 1,
              'explanation': '含情态动词的被动语态用“情态动词 + be + 过去分词”，故为 must be planted。'
            },
            {
              'stem': 'The homework must ______ (hand) in before Friday.',
              'options': ['hand', 'be handed', 'handed'],
              'answer': 1,
              'explanation': 'must 后接 be + 过去分词，hand in 意为“上交”，故填 be handed。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '只要句子里有情态动词，被动就在“情态动词 + be”后面接过去分词，顺序不能乱。',
          'problem': '记住要加 be，却把过去分词写成原形或过去式。',
          'analogy': '像排队：情态动词站第一，be 站第二，过去分词站第三。顺序一乱，句子就“散了队”。',
          'example': 'These books should be returned to the library. What can be done to save water?',
          'pitfalls': [
            'be 后面必须是过去分词，不能用原形',
            '疑问句里 be 仍跟在情态动词后：Can it be done?',
            '不要写成 must be hand / can be did'
          ],
          'check': [
            {
              'stem': 'What can ______ to help the poor children?',
              'options': ['do', 'be done', 'did'],
              'answer': 1,
              'explanation': 'can + be + 过去分词构成被动，故用 be done。'
            },
            {
              'stem': '这些书应该被还给图书馆。 → These books should ______ returned to the library.',
              'options': ['be', 'is', 'are'],
              'answer': 0,
              'explanation': '情态动词 should 后面接 be + 过去分词，be 用原形。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p11': [
        {
          'version': 1,
          'oneLiner': '宾语从句引导词三选一：陈述句用 that，一般疑问句用 if / whether，特殊疑问句用原疑问词。',
          'problem': '把疑问句直接搬进从句，或该用 if 时写成 that。',
          'analogy': '宾语从句像给原句“装个盒子”：陈述句装 that，一般疑问句装 if / whether，特殊疑问句保留原来的疑问词当盖子。',
          'example': 'He said (that) he was tired. He asked if I was ready. He asked where I lived.',
          'pitfalls': [
            'that 在从句中只起引导作用，无实际意义，常可省略',
            '一般疑问句变从句用 if / whether',
            '主句过去时，从句时态要相应后移（但客观真理除外）'
          ],
          'check': [
            {
              'stem': 'He asked me ______ I had finished my homework.',
              'options': ['that', 'if', 'what'],
              'answer': 1,
              'explanation': '原句是可用 yes/no 回答的一般疑问句，变宾语从句用 if 引导。'
            },
            {
              'stem': 'The teacher told us that the earth ______ around the sun.',
              'options': ['went', 'goes', 'will go'],
              'answer': 1,
              'explanation': '宾语从句表示客观真理时，从句仍用一般现在时 goes。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '“时态呼应”原则：主句过去时，从句一般跟着后退一步；但讲的是真理，就不退。',
          'problem': '只记“主过从过”一句话，遇到客观真理又机械地改成过去时。',
          'analogy': '像回声：主句用过去的调子喊，从句大多跟着降一级；但如果内容是永恒不变的真理，回声不受主句影响，永远是现在时。',
          'example': 'He said he would come.（主句过去 → 从句 will 变 would）；He said the sun rises in the east.（真理不变）。',
          'pitfalls': [
            '主句现在时，从句用所需时态，不必后移',
            'will → would，can → could，一般现在 → 一般过去',
            '客观真理、格言用一般现在时'
          ],
          'check': [
            {
              'stem': 'She said she ______ to the zoo the next day.',
              'options': ['will go', 'would go', 'goes'],
              'answer': 1,
              'explanation': '主句是过去时，will 在从句中改为 would。'
            },
            {
              'stem': 'Our teacher told us that light ______ faster than sound.',
              'options': ['travelled', 'travels', 'travelling'],
              'answer': 1,
              'explanation': '宾语从句表客观真理，从句用一般现在时 travels。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p12': [
        {
          'version': 1,
          'oneLiner': '宾语从句一律用陈述语序：引导词 + 主语 + 谓语，绝不倒装。',
          'problem': '把疑问句原来的倒装语序带进从句，写出“what is it”这样的错误。',
          'analogy': '疑问句的倒装像一句“提问的表情”，一旦进到宾语从句里，就要换成平静的陈述表情：主语在前、谓语在后。',
          'example': 'Where does he live? → I don\'t know where he lives.',
          'pitfalls': [
            '从句中不再用助动词 do / does / did',
            '引导词后紧跟主语，而不是动词',
            '主句本身是疑问句时，从句仍用陈述语序'
          ],
          'check': [
            {
              'stem': 'Do you know ______?',
              'options': ['where is he', 'where he is', 'he is where'],
              'answer': 1,
              'explanation': '宾语从句用陈述语序“引导词 + 主语 + 谓语”，故选 where he is。'
            },
            {
              'stem': '“Can you tell me what time is it?” 这句话 ______。',
              'options': ['正确', '错误'],
              'answer': 1,
              'explanation': '宾语从句要用陈述语序，应改为 what time it is。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '把疑问句改写成宾语从句时，先“拆掉助动词”，再把主语提前到谓语前面。',
          'problem': '知道要用陈述语序，但改起来总丢三落四。',
          'analogy': '像把一件“折叠起来”的衣服（倒装疑问句）重新平铺：先去掉支撑它的夹子（do/does），再按正常方向摆放（主+谓）。',
          'example': 'What did he say? → I don\'t know what he said.（去掉 did，动词还原为过去式）。',
          'pitfalls': [
            '去掉 do / does / did 后，实义动词的数与时态还原',
            '特殊疑问词本身就是主语时，语序本就正常，如 Who is singing?',
            '从句结尾用句号，不用问号'
          ],
          'check': [
            {
              'stem': 'I don\'t know what he ______ yesterday.',
              'options': ['did he say', 'said', 'does he say'],
              'answer': 1,
              'explanation': '宾语从句用陈述语序，去掉助动词 did，实义动词用过去式 said。'
            },
            {
              'stem': 'Could you tell me how ______ to the station?',
              'options': ['can I get', 'I can get', 'do I get'],
              'answer': 1,
              'explanation': '宾语从句用陈述语序“主语 + 情态动词 + 动词”，故选 I can get。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p13': [
        {
          'version': 1,
          'oneLiner': '选关系代词先看先行词：指人用 who，指物用 which，人或物都可以用 that。',
          'problem': '一看到空格就随便挑一个，既不确认先行词指人还是指物，也不看从句缺什么成分。',
          'analogy': '关系代词像“接头”，一头连着先行词，一头连着从句。先摸摸先行词是“人”还是“物”，接头就定了一大半。',
          'example': 'The man who is standing there…（the man 指人、作主语→who）；This is the book which I bought.（the book 指物→which）。',
          'pitfalls': [
            '指人且在从句中作主语，用 who（也可用 that）',
            '指物常用 which（也可用 that）',
            'what 不能引导定语从句，别把宾语从句的 what 搬过来',
            '关系代词在从句中必须充当一个成分，不能“多出来”'
          ],
          'check': [
            {
              'stem': 'The man ______ is standing under the tree is our headmaster.',
              'options': ['which', 'who', 'what'],
              'answer': 1,
              'explanation': '先行词 the man 指人且作从句主语，用 who。'
            },
            {
              'stem': 'This is the book ______ I bought yesterday.',
              'options': ['who', 'which', 'what'],
              'answer': 1,
              'explanation': '先行词 the book 指物，用 which（或 that）。'
            }
          ],
          'readTime': 100
        },
        {
          'version': 2,
          'oneLiner': '先读从句，看它“缺哪块砖”，再决定用哪个关系代词。',
          'problem': '只盯着先行词，忽略从句本身，也会漏掉 whose 这类“缺定语”的情况。',
          'analogy': '把从句当成一句被挖了洞的话：缺主语就填 who/which/that，缺“谁的”就想想是不是要用 whose。',
          'example': 'The girl who won the prize is my sister.（从句缺主语→who）；The woman whose daughter is a doctor…（缺所属关系→whose）。',
          'pitfalls': [
            '关系代词在从句中不能重复出现，如 the man who he is… 是错的',
            'that 不能用在“介词 + 关系代词”结构中',
            '非限制性定语从句一般不用 that'
          ],
          'check': [
            {
              'stem': 'The woman ______ daughter is a doctor is very kind.',
              'options': ['who', 'whose', 'which'],
              'answer': 1,
              'explanation': '从句的 daughter 需要表所属关系的 whose，whose daughter 意为“她的女儿”。'
            },
            {
              'stem': 'The pen ______ writes well is mine.',
              'options': ['who', 'which', 'whose'],
              'answer': 1,
              'explanation': '先行词 the pen 指物且作从句主语，用 which。'
            }
          ],
          'readTime': 100
        }
      ],
    'eng9a-p14': [
        {
          'version': 1,
          'oneLiner': '关系代词在从句中作宾语时，用 whom / which，而且常可省略。',
          'problem': '看到“人”就写 who，忽略它在从句里其实是宾语；也不清楚到底能不能省。',
          'analogy': '从句像一句被借走的台词：关系代词演“宾语”这个配角时台词不多，导演（说话人）甚至可以把它删掉。',
          'example': 'The film (which) we saw last night was moving. 关系代词 which 作 saw 的宾语，可以省略。',
          'pitfalls': [
            '作宾语的 whom / which / that 常可省略',
            '作主语的关系代词不能省略',
            '介词提到前面作宾语时只能用 whom / which，不能用 that'
          ],
          'check': [
            {
              'stem': 'The film ______ we saw last night was very moving.',
              'options': ['who', 'which', 'what'],
              'answer': 1,
              'explanation': '先行词 the film 指物，关系代词作 saw 的宾语，用 which（可省略）。'
            },
            {
              'stem': 'The book (that) I read is interesting. 去掉 that 后句子是否仍成立？',
              'options': ['成立', '不成立'],
              'answer': 0,
              'explanation': 'that 作 read 的宾语，可以省略，省略后句子仍成立。'
            }
          ],
          'readTime': 100
        },
        {
          'version': 2,
          'oneLiner': '先判断从句缺主语还是缺宾语，只有缺宾语时才考虑省略。',
          'problem': '把“可省略的”当成“必须写”，或把作主语的也省了，句子就残缺了。',
          'analogy': '从句像一道填空题：主语的位子是必填项，宾语的位子可以空着让人自己猜出来。',
          'example': 'The man who came first is my uncle.（作主语，不能省）；The man (whom) you met is my uncle.（作宾语，可省）。',
          'pitfalls': [
            '步骤：找先行词 → 划出从句 → 看从句缺什么成分',
            '从句谓语后缺宾语，就是宾语，关系代词可省',
            '从句缺主语，必须补关系代词',
            '关系代词紧跟在介词后时不能省略'
          ],
          'check': [
            {
              'stem': 'The boy ______ is playing basketball is my brother.（句中的关系词能否省略？）',
              'options': ['能省略', '不能省略'],
              'answer': 1,
              'explanation': '关系代词在从句中作主语，不能省略。'
            },
            {
              'stem': 'This is the house ______ we lived in last year.',
              'options': ['who', 'which', 'whose'],
              'answer': 1,
              'explanation': '先行词 the house 指物，作介词 in 的宾语，用 which（也可省略）。'
            }
          ],
          'readTime': 100
        }
      ],
    'eng9a-p15': [
        {
          'version': 1,
          'oneLiner': 'while 多用于“正在进行、持续”的动作，when 表示“当……时”最通用。',
          'problem': 'when / while / as 都译成“当……时”，不分场合乱用，尤其在从句用进行时的时候。',
          'analogy': 'while 像“两件事同时进行的一条长镜头”；when 像“抓拍一个时间点”；as 更强调“随着……”。',
          'example': 'While I was walking home, I met an old friend.（两个动作同时进行→while）。',
          'pitfalls': [
            '从句用进行时、强调同时进行，常用 while',
            'when 既可指时间点也可指时间段，最常用',
            'as 常表“随着”，如 As time goes by',
            '主句将来时，时间从句用一般现在时（主将从现）'
          ],
          'check': [
            {
              'stem': '______ I was walking home, I met an old friend.',
              'options': ['While', 'Until', 'Since'],
              'answer': 0,
              'explanation': '从句用进行时、强调动作同时进行，用 While。'
            },
            {
              'stem': 'I will call you ______ I arrive in Beijing.',
              'options': ['when', 'while', 'since'],
              'answer': 0,
              'explanation': 'arrive 是瞬间动作，用 when 引导时间状语从句，从句用一般现在时表将来。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '写时间状语从句时，先看动作是“点”还是“段”，再挑连词。',
          'problem': '只记中文意思，忽略动作性质和时态搭配，导致连词与从句时态打架。',
          'analogy': '时间像一把尺子：点是 when，段是 while，慢慢变化是 as；选连词就像选镜头。',
          'example': 'When the bell rang, we were talking.（铃响是一个点→when）；While we were talking, the bell rang.（谈话是持续段→while）。',
          'pitfalls': [
            '时间状语从句不用将来时，用一般现在时代替',
            'while 引导的从句谓语多用进行时或延续性动词',
            'until 意为“直到……”，注意 not…until 的搭配'
          ],
          'check': [
            {
              'stem': 'We were watching TV ______ the phone rang.',
              'options': ['when', 'while', 'until'],
              'answer': 0,
              'explanation': 'rang 是瞬间动作（点），用 when。'
            },
            {
              'stem': '______ he was reading, his mother was cooking.',
              'options': ['While', 'When', 'After'],
              'answer': 0,
              'explanation': '两个动作同时进行，用 While。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p16': [
        {
          'version': 1,
          'oneLiner': 'if 条件从句讲“将来”，从句却用一般现在时——这就是“主将从现”。',
          'problem': '中文说“如果明天……”，就顺手在从句里加 will，写出 If it will rain 这种错误。',
          'analogy': '将来像“还没到的客人”：主句负责招待（用 will），从句只负责报信（用现在时），别让从句抢着用 will。',
          'example': 'If it rains tomorrow, we will stay at home. 从句 rains 用一般现在时，主句用 will。',
          'pitfalls': [
            'if 引导条件状语从句：主将从现',
            '条件从句里不出现 will',
            'if 表“是否”时是宾语从句，不受这条限制',
            'unless = if…not，同样遵循主将从现'
          ],
          'check': [
            {
              'stem': 'If it ______ tomorrow, we will stay at home.',
              'options': ['rains', 'will rain', 'rained'],
              'answer': 0,
              'explanation': 'if 条件从句用一般现在时表将来，故用 rains。'
            },
            {
              'stem': 'If you will come, I will tell you. 这句话是否正确？',
              'options': ['正确', '错误'],
              'answer': 1,
              'explanation': 'if 条件从句不能用 will，应改为 If you come, I will tell you.'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '先分清 if 是“如果”（条件）还是“是否”（宾语从句），再决定时态。',
          'problem': '把两种 if 混为一谈：宾语从句的 if 可以用将来时，条件从句的不可以。',
          'analogy': '同一个 if 有两种身份：条件从句的 if 是“守门人”，只放现在时进门；宾语从句的 if 是“传话人”，照实转述时态。',
          'example': 'I don\'t know if he will come.（是否→可用 will）；If he comes, I will call you.（如果→用现在时）。',
          'pitfalls': [
            'if 作“是否”时，从句时态可与主句将来时并存',
            'if 作“如果”时，遵循主将从现',
            'unless 相当于 if…not，也遵循主将从现'
          ],
          'check': [
            {
              'stem': 'I don\'t know if it ______ tomorrow.',
              'options': ['rains', 'will rain'],
              'answer': 1,
              'explanation': '此处 if 意为“是否”，引导宾语从句，可用将来时 will rain。'
            },
            {
              'stem': 'Unless you hurry, you ______ the train.',
              'options': ['will miss', 'miss'],
              'answer': 0,
              'explanation': 'unless 引导条件从句用一般现在时，主句用将来时 will miss。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p17': [
        {
          'version': 1,
          'oneLiner': '有些动词后面“只认 to do”，把 want / hope / decide 这类动词记牢。',
          'problem': '在 decide / hope / want 后错用 doing 或动词原形。',
          'analogy': '这些动词像挑食的孩子，只吃“to do”这道菜：want to do、hope to do、decide to do。',
          'example': 'She decided to be a doctor.（decide to do sth）；I hope to see you soon.。',
          'pitfalls': [
            'decide / hope / want / plan / agree 等后接 to do',
            '不定式的否定式是 not to do',
            'to 是动词不定式符号，不是介词，后面跟动词原形'
          ],
          'check': [
            {
              'stem': 'She decided ______ a doctor when she grows up.',
              'options': ['be', 'to be', 'being'],
              'answer': 1,
              'explanation': 'decide to do sth，用动词不定式作宾语。'
            },
            {
              'stem': 'He hopes ______ a scientist in the future.',
              'options': ['become', 'to become', 'becoming'],
              'answer': 1,
              'explanation': 'hope to do sth，用不定式作宾语。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '不定式还能表示“为了……”，在句中作目的状语。',
          'problem': '把“为了做某事”写成 because 从句，或错用 doing。',
          'analogy': '不定式像“导航目的地”：They got up early to catch the bus，前半句是行动，to catch 是目的。',
          'example': 'They got up early to catch the early bus.（to catch 表目的）。',
          'pitfalls': [
            '表目的常用 to do，也可用 in order to / so as to',
            '目的状语可放句首或句尾',
            '不要和表原因的 because 从句混淆'
          ],
          'check': [
            {
              'stem': 'They got up early ______ the early bus.',
              'options': ['catch', 'to catch', 'catching'],
              'answer': 1,
              'explanation': '不定式作目的状语，表示“为了赶上早班车”。'
            },
            {
              'stem': '“为了通过考试”应译为 ______.',
              'options': ['pass the exam', 'to pass the exam', 'passing the exam'],
              'answer': 1,
              'explanation': '表目的用动词不定式 to pass the exam。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p18': [
        {
          'version': 1,
          'oneLiner': '有些动词后面“只认 doing”，如 enjoy / finish / mind。',
          'problem': '在 enjoy / finish / mind 后错用 to do。',
          'analogy': '这些动词像只喝“动名词”这杯茶的客人：enjoy doing、finish doing、mind doing。',
          'example': 'I enjoy listening to music.（enjoy doing sth）；Would you mind opening the window?（mind doing sth）。',
          'pitfalls': [
            'enjoy / finish / mind / practise 后接动名词',
            '动名词的否定式是 not doing',
            '介词后面一定跟动名词，如 look forward to doing'
          ],
          'check': [
            {
              'stem': 'I enjoy ______ to music in my free time.',
              'options': ['listen', 'listening', 'to listen'],
              'answer': 1,
              'explanation': 'enjoy doing sth，故用 listening。'
            },
            {
              'stem': 'Would you mind ______ (open) the window?',
              'options': ['open', 'opening', 'to open'],
              'answer': 1,
              'explanation': 'mind doing sth，故用 opening。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '动名词也能当主语，此时谓语动词用单数。',
          'problem': '把动名词当主语时谓语却用复数，或干脆分不清主语在哪。',
          'analogy': '动名词作主语时像一个整体“一回事”，所以谓语用单数：Reading is helpful.。',
          'example': 'Reading aloud is a good way to learn English.（动名词短语作主语，谓语用 is）。',
          'pitfalls': [
            '动名词（短语）作主语，谓语用单数',
            '动名词作主语也可用 It is…doing 的句型替换',
            '介词后必须用动名词'
          ],
          'check': [
            {
              'stem': '______ English every day is important.',
              'options': ['Read', 'Reading', 'Reads'],
              'answer': 1,
              'explanation': '动名词短语作主语，强调一种活动，故用 Reading，谓语用 is。'
            },
            {
              'stem': 'He is interested in ______ (draw).',
              'options': ['draw', 'drawing', 'to draw'],
              'answer': 1,
              'explanation': '介词 in 后接动名词，故用 drawing。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p19': [
        {
          'version': 1,
          'oneLiner': '有把握的肯定推测用 must，否定推测用 can\'t。',
          'problem': '把否定推测写成 mustn\'t。mustn\'t 表“禁止”，不是“不可能”。',
          'analogy': '推测像“估分”：十拿九稳用 must，绝无可能用 can\'t，拿不准用 may / might，最不能说“禁止（mustn\'t）”。',
          'example': 'He must be at work.（一定）；It can\'t be him.（不可能是他）。',
          'pitfalls': [
            'must 表肯定推测“一定”',
            'can\'t 表否定推测“不可能”',
            'mustn\'t 表禁止，不能用于推测',
            'may / might / could 表把握不大的可能性'
          ],
          'check': [
            {
              'stem': 'The light in his office is on. He ______ be at work.',
              'options': ['must', 'can\'t', 'mustn\'t'],
              'answer': 0,
              'explanation': '有根据的肯定推测用 must，意为“一定”。'
            },
            {
              'stem': '— Is that Li Ming? — It ______ be him. He has gone to Beijing.',
              'options': ['must', 'can\'t', 'needn\'t'],
              'answer': 1,
              'explanation': '他已去北京，不可能在这儿，否定推测用 can\'t。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '推测题先分“肯定 / 否定”，再分“把握大小”。',
          'problem': '只按中文“可能、一定”配对，忽略句子里给出的证据是支持还是推翻。',
          'analogy': '像侦探断案：证据指向就用 must，证据排除就用 can\'t，线索不足只能用 may / might。',
          'example': 'There is someone knocking—it could be Tom.（把握不大→could / may）；It must be Tom, he said he\'d come.（有把握→must）。',
          'pitfalls': [
            '推测句常用“情态动词 + 动词原形”结构',
            '否定推测用 can\'t，不用 mustn\'t',
            'needn\'t 表“不必”，不是推测',
            '疑问句中的推测常用 can / could'
          ],
          'check': [
            {
              'stem': 'He said he would come, so he ______ be here soon.',
              'options': ['must', 'can\'t', 'needn\'t'],
              'answer': 0,
              'explanation': '有依据的肯定推测用 must。'
            },
            {
              'stem': '— Can it be true? — It ______ be true. I saw it with my own eyes.',
              'options': ['may not', 'can\'t', 'mustn\'t'],
              'answer': 1,
              'explanation': '“亲眼所见”，不可能是假的，否定推测用 can\'t。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p20': [
        {
          'version': 1,
          'oneLiner': '谓语听“真主语”的话，并列主语时按就近原则判断。',
          'problem': 'either…or / neither…nor / not only…but also 或 there be 作主语时，谓语单复数拿不准。',
          'analogy': '并列主语像一排人报到，谓语只认“最近的那位（就近原则）”。',
          'example': 'Neither Tom nor his friends are interested…（谓语与最近的 his friends 一致→are）。',
          'pitfalls': [
            'either…or / neither…nor / not only…but also 用就近原则',
            'there be 句型也用就近原则',
            'each / every / no 修饰主语时谓语用单数'
          ],
          'check': [
            {
              'stem': 'Neither Tom nor his friends ______ interested in the film.',
              'options': ['is', 'are', 'was'],
              'answer': 1,
              'explanation': 'neither…nor 连接并列主语时，谓语与最近的 his friends 一致，用 are。'
            },
            {
              'stem': 'There ______ a pen and two books on the desk.',
              'options': ['is', 'are', 'be'],
              'answer': 0,
              'explanation': 'there be 用就近原则，靠近的是 a pen（单数），用 is。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '分清“the number of”和“a number of”，一个用单数，一个用复数。',
          'problem': '见到 number 就不假思索用复数，忽略 of 后面的名词其实只是修饰语。',
          'analogy': 'the number of 的主语是“数量”本身（单数）；a number of 的主语是“许多个东西”（复数）。',
          'example': 'The number of students is 50.（数量作主语→is）；A number of students are playing.（许多学生→are）。',
          'pitfalls': [
            'the number of + 复数名词，谓语用单数',
            'a number of + 复数名词，谓语用复数',
            '由 and 连接的两个主语指同一人/物时，谓语用单数'
          ],
          'check': [
            {
              'stem': 'The number of students in our class ______ 50.',
              'options': ['is', 'are', 'be'],
              'answer': 0,
              'explanation': 'the number of…作主语，谓语用单数 is。'
            },
            {
              'stem': 'A number of visitors ______ coming to the museum.',
              'options': ['is', 'are', 'was'],
              'answer': 1,
              'explanation': 'a number of + 复数名词作主语，谓语用复数 are。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p21': [
        {
          'version': 1,
          'oneLiner': '完形填空选连词，先看前后两句是“转折”还是“因果”。',
          'problem': '不看句间逻辑，只凭语感挑连词，把 but 和 so 用反。',
          'analogy': '连接词是句子之间的“交通信号灯”：转折是红灯（but），因果是顺行的绿灯（so）。',
          'example': 'I was very tired, but I kept working.（累却坚持→转折）。',
          'pitfalls': [
            '转折关系用 but / however / though',
            '因果关系用 so / therefore / because',
            '并列、递进用 and / besides'
          ],
          'check': [
            {
              'stem': 'I was very tired, ______ I kept working till midnight.',
              'options': ['but', 'so', 'and'],
              'answer': 0,
              'explanation': '“很累”与“坚持工作到半夜”是转折关系，用 but。'
            },
            {
              'stem': 'He studied hard, ______ he passed the exam easily.',
              'options': ['but', 'so', 'or'],
              'answer': 1,
              'explanation': '“努力学习”与“轻松通过考试”是因果关系，用 so。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '做完形别急着填，先通读全文，抓住上下文的“线索词”。',
          'problem': '边读边填，只看空格所在句，忽略上下文的呼应。',
          'analogy': '完形像拼图：每一块都要和周围的块对齐，先看全图再动手，才不会放错。',
          'example': '前句说“下雨了”，后句说“我们待在家”，中间的连词就该是 so 而不是 but。',
          'pitfalls': [
            '先通读、再填空、最后复读检查',
            '留意同义复现、反义对比等线索',
            '关注人称、时态、单复数的一致性'
          ],
          'check': [
            {
              'stem': 'It was raining hard, ______ we had to stay at home.',
              'options': ['but', 'so', 'or'],
              'answer': 1,
              'explanation': '下雨是原因，待在家是结果，用 so。'
            },
            {
              'stem': 'She is only ten, ______ she can cook very well.',
              'options': ['but', 'so', 'and'],
              'answer': 0,
              'explanation': '“只有十岁”与“做饭很好”是转折，用 but。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p22': [
        {
          'version': 1,
          'oneLiner': '找细节要“带着问题扫读”，抓住关键词定位。',
          'problem': '从头逐字读，既慢又容易被无关信息干扰。',
          'analogy': '查细节像在字典里找词：先看要找什么，再直奔对应的位置，不必把整本字典读完。',
          'example': '题目问“When did the film start?”，就快速扫读文中的人名、数字、时间。',
          'pitfalls': [
            '先读题干、画出关键词，再回原文定位',
            '关键词常是人名、地名、数字、日期',
            '答案往往就在关键词附近那一句'
          ],
          'check': [
            {
              'stem': 'To find a specific detail quickly, you\'d better ______.',
              'options': ['read every word carefully', 'look for key words such as names and numbers', 'read the title only'],
              'answer': 1,
              'explanation': '细节定位应抓住关键词（人名、数字等）快速扫读原文。'
            },
            {
              'stem': '阅读细节题时，正确的做法是 ______.',
              'options': ['先看题目再回原文找', '先背单词再看文章', '只看首尾句'],
              'answer': 0,
              'explanation': '带着问题定位关键词，效率最高。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '概括主旨抓“主题句”，通常在段首或段尾。',
          'problem': '用某个细节代替全文主旨，以偏概全。',
          'analogy': '文章像一串珍珠，主旨是那根串起全部的线，主题句就是露出线头的地方（段首或段尾）。',
          'example': '段落第一句常是本段主题句，末段常总结全文。',
          'pitfalls': [
            '主旨题答案要能覆盖全文，不能只是某一段的细节',
            '首段、末段和每段首句是重点',
            '注意 but 后面的内容常是作者真正想说的'
          ],
          'check': [
            {
              'stem': 'The topic sentence of a paragraph usually appears ______.',
              'options': ['at the beginning or the end', 'only in the title', 'in every sentence'],
              'answer': 0,
              'explanation': '主题句通常出现在段首或段尾。'
            },
            {
              'stem': '概括文章主旨时，最应关注 ______.',
              'options': ['某个具体数字', '首尾段和每段首句', '生词的数量'],
              'answer': 1,
              'explanation': '首尾段和每段首句最可能承载主旨。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p23': [
        {
          'version': 1,
          'oneLiner': '首字母填空先定词义，再看词形（时态、单复数）。',
          'problem': '只顾着猜是哪个词，忘了根据句子改词形，或首字母大小写不对。',
          'analogy': '首字母像“门牌号”，告诉你住的是谁；但进门后还得看主人穿什么衣服（词形），才能对上场合。',
          'example': 'has g______ to Shanghai → 首字母 g 提示 go，has 后接过去分词 → gone。',
          'pitfalls': [
            '先按首字母和句意定出单词，再检查词形',
            '注意动词时态、名词单复数、形容词比较级',
            '句首单词首字母要大写'
          ],
          'check': [
            {
              'stem': '根据首字母提示填空：He is not at home. He has g______ to Shanghai.',
              'options': ['go', 'gone', 'going'],
              'answer': 1,
              'explanation': 'has gone to 表示“去了某地（人不在这里）”，首字母提示 go 的过去分词 gone。'
            },
            {
              'stem': '根据首字母提示填空：The Great Wall is one of the most famous w______ in the world.',
              'options': ['wonder', 'wonders'],
              'answer': 1,
              'explanation': 'one of the most famous 后接复数名词，故填 wonders。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '首字母填空要“瞻前顾后”：看搭配，也看上下文给出的人称时态。',
          'problem': '孤立地填一个词，忽略它和前后词的固定搭配或句子时态。',
          'analogy': '短文填空像拼句子链条：每一环都要和前一环扣上（搭配），并保持同样的节奏（时态）。',
          'example': 'He is used to g______ up early → be used to doing sth，填 getting。',
          'pitfalls': [
            '注意固定搭配，如 be used to doing / look forward to doing',
            '根据全文时态判断动词形式',
            '填完通读检查是否通顺'
          ],
          'check': [
            {
              'stem': '根据首字母提示填空：He is used to g______ up early.',
              'options': ['get', 'getting', 'got'],
              'answer': 1,
              'explanation': 'be used to doing sth 意为“习惯于做某事”，to 是介词，后接动名词 getting。'
            },
            {
              'stem': '根据首字母提示填空：She is good at s______ English songs.',
              'options': ['sing', 'singing', 'sang'],
              'answer': 1,
              'explanation': 'be good at 中 at 是介词，后接动名词 singing。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9a-p24': [
        {
          'version': 1,
          'oneLiner': '先定时态再动笔：写“过去的事”主要用一般过去时。',
          'problem': '一篇作文时态混用，过去的事情里冒出动词原形。',
          'analogy': '时态像文章的背景色调：写“上个周末”就是鲜明的过去色，别掺进现在色的颜料。',
          'example': 'Last weekend I visited my grandparents. We had a good time. 全用过去式。',
          'pitfalls': [
            '叙事作文首句确定基调，全篇时态一致',
            '写经历用一般过去时，写影响/结论可回到现在时',
            '审题时先在题目上标出时间标志词'
          ],
          'check': [
            {
              'stem': 'When writing about last weekend, you should mainly use ______.',
              'options': ['the simple past tense', 'the simple present tense', 'the future tense'],
              'answer': 0,
              'explanation': '叙述过去发生的事，主体时态用一般过去时。'
            },
            {
              'stem': '写“你上周末的经历”，下面正确的句子是 ______.',
              'options': ['I go to the park last Sunday.', 'I went to the park last Sunday.', 'I will go to the park last Sunday.'],
              'answer': 1,
              'explanation': 'last Sunday 是过去时间，须用一般过去时 went。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '书信作文先套格式：开头 Dear + 名字，结尾 Best wishes 等。',
          'problem': '格式混乱，把 Yours sincerely 放在开头，或用错称呼。',
          'analogy': '书信像寄包裹：收件人（称呼）写在最上面，寄件说明（落款）放在最后，顺序不能乱。',
          'example': 'Dear Tom, … Best wishes, Li Hua. 开头称呼、结尾署名各就各位。',
          'pitfalls': [
            '给朋友写信开头用 Dear + 名字',
            '结尾常用 Best wishes / Yours，并另起一行署名',
            '正式信件才用 To whom it may concern',
            '正文分段：开头点题、中间展开、结尾收束'
          ],
          'check': [
            {
              'stem': 'Which is the best way to begin a letter to a friend?',
              'options': ['Dear Tom,', 'To whom it may concern,', 'Yours sincerely,'],
              'answer': 0,
              'explanation': '给朋友写信通常以 Dear + 名字 开头，Yours sincerely 一般用于结尾。'
            },
            {
              'stem': '书信结尾通常写 ______.',
              'options': ['Dear Tom,', 'Best wishes,', 'Dear Sir,'],
              'answer': 1,
              'explanation': 'Best wishes 常用于书信结尾的祝愿；Dear… 是开头称呼。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p1': [
        {
          'version': 1,
          'oneLiner': '形容词后面常跟固定介词，搭配要成套记。',
          'problem': '按中文直译选介词，写出 be good in 这类错误。',
          'analogy': '形容词和介词像多年的老搭档：good 总爱跟 at，famous 常跟 for / as，换搭档就不地道了。',
          'example': 'be good at（擅长）；be famous for（因……而闻名）；be famous as（作为……而闻名）。',
          'pitfalls': [
            'be good at 后接名词或动名词',
            'be famous for 指因某种特点闻名，be famous as 指作为某身份闻名',
            'be interested in、be proud of 等也需整记'
          ],
          'check': [
            {
              'stem': '用适当的介词填空：She is good ______ swimming.',
              'options': ['at', 'in', 'for'],
              'answer': 0,
              'explanation': 'be good at 意为“擅长”，后接名词或动名词。'
            },
            {
              'stem': 'Our school is famous ______ its beautiful garden.',
              'options': ['as', 'for', 'with'],
              'answer': 1,
              'explanation': 'be famous for 意为“因……而闻名”。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '记“名词 + 介词”搭配，别按中文硬套。',
          'problem': '把某名词该配哪个介词记混，如把 the reason for 写成 the reason of。',
          'analogy': '搭配像“固定套餐”，介词就是配菜，只能按菜单点，不能随意更换。',
          'example': 'the reason for…（……的原因）；the answer to…（……的答案）；the key to…（……的钥匙）。',
          'pitfalls': [
            'the answer to the question 用 to，不用 of',
            'the key to the door 用 to',
            '多读多记，把搭配当作整体记忆'
          ],
          'check': [
            {
              'stem': 'What\'s the answer ______ this question?',
              'options': ['of', 'to', 'for'],
              'answer': 1,
              'explanation': 'the answer to… 是固定搭配，意为“对……的回答”。'
            },
            {
              'stem': 'This is the key ______ the front door.',
              'options': ['of', 'to', 'for'],
              'answer': 1,
              'explanation': 'the key to… 是固定搭配，意为“……的钥匙”。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p2': [
        {
          'version': 1,
          'oneLiner': 'turn 加不同小词，意思全变：on 开、off 关、up 调高、down 调低。',
          'problem': '把 turn off 和 turn on 用反，或混淆 up / down。',
          'analogy': '小词像“开关拨片”：拨到 on 通电，拨到 off 断电，up 是音量往上，down 是往下。',
          'example': 'Please turn off the light when you leave.（离开关灯）。',
          'pitfalls': [
            'turn on 打开，turn off 关闭',
            'turn up 调高（音量），turn down 调低',
            '代词作宾语时要放中间，如 turn it off'
          ],
          'check': [
            {
              'stem': 'Please ______ the light when you leave the room.',
              'options': ['turn on', 'turn off', 'turn up'],
              'answer': 1,
              'explanation': '离开房间应“关灯”，用 turn off。'
            },
            {
              'stem': 'The music is too loud. Please ______ it ______.',
              'options': ['turn; up', 'turn; down', 'turn; on'],
              'answer': 1,
              'explanation': '声音太大应“调低”，用 turn down。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': 'come 和 get 的常见短语要逐个记牢，别望文生义。',
          'problem': '把 come true 当成“来得真”，或混淆 come up with / get on well with。',
          'analogy': '这些短语像“成语”：不能逐字翻译，只能整体记住它们的意思。',
          'example': 'come true（实现）；come up with（想出）；get on well with（与……相处融洽）。',
          'pitfalls': [
            'come true 是“实现”，主语常是 dream / wish',
            'come up with 意为“想出（主意、办法）”',
            'get on / along well with sb 意为“与某人相处好”'
          ],
          'check': [
            {
              'stem': 'His dream of being a pilot came ______ at last.',
              'options': ['true', 'up', 'on'],
              'answer': 0,
              'explanation': 'come true 意为“实现、成真”，是固定搭配。'
            },
            {
              'stem': 'He ______ a good idea to solve the problem.',
              'options': ['came true', 'came up with', 'got on with'],
              'answer': 1,
              'explanation': 'come up with 意为“想出（主意）”。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p3': [
        {
          'version': 1,
          'oneLiner': '“令人……的”用 -ing 形容词，“感到……的”用 -ed 形容词。',
          'problem': '把 interesting 和 interested 用混，修饰人时错用 -ing 形式。',
          'analogy': '-ing 形容词像“制造情绪的人”，-ed 形容词像“接收情绪的人”：书让人感兴趣用 interesting，人感到有兴趣用 interested。',
          'example': 'The book is interesting. I am interested in it.（物→-ing，人→-ed）。',
          'pitfalls': [
            '修饰事物用 -ing：interesting / exciting / boring',
            '修饰人用 -ed：interested / excited / bored',
            'be interested in 意为“对……感兴趣”'
          ],
          'check': [
            {
              'stem': 'The book is very ______, and I am ______ in it.',
              'options': ['interesting; interesting', 'interested; interested', 'interesting; interested'],
              'answer': 2,
              'explanation': 'interesting 形容事物，interested 形容人，be interested in 意为“对……感兴趣”。'
            },
            {
              'stem': 'The match was so ______ that everyone got ______.',
              'options': ['exciting; excited', 'excited; exciting', 'exciting; exciting'],
              'answer': 0,
              'explanation': '比赛（物）用 exciting，人用 excited。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '形近副词别混：hard 是“努力地”，hardly 是“几乎不”。',
          'problem': '以为加 -ly 只是变得“更正式”，把 hard 和 hardly 当成同义。',
          'analogy': 'hardly 是“披着副词外衣的反义词”：它看着像 hard 的副词，意思却完全不同。',
          'example': 'He works hard.（他努力工作）≠ He hardly works.（他几乎不工作）。',
          'pitfalls': [
            'hard 既作形容词也可作副词，意为“努力地 / 猛烈地”',
            'hardly 意为“几乎不”，含否定意味',
            'late（迟）与 lately（最近）、near 与 nearly 同理要区分'
          ],
          'check': [
            {
              'stem': 'He works ______ and always gets good grades.',
              'options': ['hard', 'hardly', 'harder'],
              'answer': 0,
              'explanation': 'hard 作副词意为“努力地”，符合句意。'
            },
            {
              'stem': 'I can ______ hear you. Please speak louder.',
              'options': ['hard', 'hardly', 'harder'],
              'answer': 1,
              'explanation': 'hardly 意为“几乎不”，符合“听不清”的语境。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p4': [
        {
          'version': 1,
          'oneLiner': '否定前缀给单词“翻个面”：un- / im- / dis- 都表“不”。',
          'problem': '不知道该用哪个否定前缀，如把 impossible 写成 unpossible。',
          'analogy': '前缀像“橡皮章”：un- 适用面最广，im- 多盖在以 m / p 开头的词上，dis- 常与动词或形容词搭配。',
          'example': 'unhappy（不快乐）；impossible（不可能）；disagree（不同意）。',
          'pitfalls': [
            'un- 最常用：unfair / unhappy / unlucky',
            'im- 多用于 p / m 开头：impossible / impolite',
            'dis- 常与动词、形容词搭配：disagree / dishonest',
            'in- / il- / ir- 也是否定前缀，按词首字母选用'
          ],
          'check': [
            {
              'stem': '用括号内单词的正确形式填空：It is ______ (fair) to cheat in the exam.',
              'options': ['unfair', 'infair', 'disfair'],
              'answer': 0,
              'explanation': 'fair 加否定前缀 un- 构成 unfair，意为“不公平的”。'
            },
            {
              'stem': 'The word “impossible” is formed by adding the prefix ______.',
              'options': ['un-', 'im-', 'dis-'],
              'answer': 1,
              'explanation': 'possible 加否定前缀 im-（因 p 开头）构成 impossible。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '后缀决定词性：-ness / -tion 是名词，-ful / -less 是形容词。',
          'problem': '只知词根意思，不懂后缀带来的词性变化，填空时写错词形。',
          'analogy': '后缀像“身份证明”：-tion 证明它是名词，-ful / -less 证明它是形容词，一看后缀就知道它能在句子里站什么位置。',
          'example': 'care（关心）→ careful（小心的）→ careless（粗心的）→ carelessness（粗心）。',
          'pitfalls': [
            '-ness / -tion / -ment 常构成名词',
            '-ful / -less / -able 常构成形容词',
            '根据句子成分判断该用哪种词性'
          ],
          'check': [
            {
              'stem': 'The suffix “-less” in “careless” means ______.',
              'options': ['full of', 'without', 'again'],
              'answer': 1,
              'explanation': '后缀 -less 表示“没有、无”：careless = care + less，即“粗心的”。'
            },
            {
              'stem': '用括号内单词的正确形式填空：Please take ______ (care) when you cross the road.',
              'options': ['careful', 'care', 'careless'],
              'answer': 1,
              'explanation': 'take care 是固定搭配，take 后接名词 care。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p5': [
        {
          'version': 1,
          'oneLiner': '“be used to doing”是习惯于，“used to do”是过去常常，意思完全不同。',
          'problem': '把 be used to doing 里的 to 当不定式符号，后接动词原形。',
          'analogy': '这里的 to 是“介词门”，门后必须进动名词（doing）；而 used to do 的 to 是“路标”，后面走原形。',
          'example': 'He is used to getting up early.（习惯于）；He used to get up early.（过去常常）。',
          'pitfalls': [
            'be used to doing sth 意为“习惯于做某事”，to 是介词',
            'used to do sth 意为“过去常常做某事”',
            'be used to do sth 意为“被用来做某事”（被动）'
          ],
          'check': [
            {
              'stem': '用括号内动词的适当形式填空：He is used to ______ (get) up early.',
              'options': ['get', 'getting', 'got'],
              'answer': 1,
              'explanation': 'be used to doing sth 意为“习惯于做某事”，to 是介词，故填 getting。'
            },
            {
              'stem': 'My father ______ smoke, but he gave it up last year.',
              'options': ['is used to', 'used to', 'was used to'],
              'answer': 1,
              'explanation': 'used to do 意为“过去常常做某事”，符合“去年戒了”的语境。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '“It is + 形容词 + for sb + to do sth”是高频句型，真正主语是后面的不定式。',
          'problem': '把 it 当真正主语，或分不清该用 for sb 还是 of sb。',
          'analogy': '这个句型像“先放个占位符”：it 先在主语位置占座，真正的主语 to do 站到句尾。',
          'example': 'It is important for us to learn English well.（真正主语是 to learn English well）。',
          'pitfalls': [
            'It 是形式主语，to do 才是真正主语',
            '描述人的品质用 of sb，描述事情性质用 for sb',
            '“too…to…”与“so…that…”可互相转换'
          ],
          'check': [
            {
              'stem': 'It\'s important for us ______ English well.',
              'options': ['learn', 'to learn', 'learning'],
              'answer': 1,
              'explanation': '“It is + 形容词 + for sb + to do sth”句型中，真正主语是动词不定式，故用 to learn。'
            },
            {
              'stem': 'It is kind ______ you to help me.',
              'options': ['of', 'for', 'to'],
              'answer': 0,
              'explanation': '描述人的品质（kind）用 of sb 结构：It is kind of you to…。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p6': [
        {
          'version': 1,
          'oneLiner': '被动语态 = be + 过去分词，be 的时态看句子时间。',
          'problem': '只写过去分词忘了 be，或 be 的时态跟前文对不上。',
          'analogy': 'be 像“时态外套”：过去分词是身体（不变），外套按时间换上 is / was / are / were。',
          'example': 'The bridge was completed last year.（过去被动）；English is spoken in many countries.（现在被动）。',
          'pitfalls': [
            '一般现在时被动：am / is / are + 过去分词',
            '一般过去时被动：was / were + 过去分词',
            '主语的单复数决定 be 的形式'
          ],
          'check': [
            {
              'stem': 'The new bridge ______ by the end of last year.',
              'options': ['completes', 'completed', 'was completed'],
              'answer': 2,
              'explanation': '桥是“被建成”的，时间为 by the end of last year，用一般过去时被动 was completed。'
            },
            {
              'stem': '用括号内动词的适当形式填空：English ______ (speak) in many countries.',
              'options': ['speaks', 'is spoken', 'spoke'],
              'answer': 1,
              'explanation': 'English 与 speak 是被动关系，主语为第三人称单数，用 is spoken。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '含情态动词的被动语态：情态动词 + be + 过去分词。',
          'problem': '在情态动词后加 are / is 等，写成 must are done。',
          'analogy': '情态动词后面像一条“单行道”，只能通向 be，不能通向 is / are。',
          'example': 'The work must be finished today.（must + be + 过去分词）。',
          'pitfalls': [
            '结构固定：情态动词 + be + 过去分词',
            '情态动词后不接 are / is / was',
            '常见情态动词：must / can / should / may'
          ],
          'check': [
            {
              'stem': '用括号内动词的适当形式填空：The task must ______ (finish) today.',
              'options': ['finish', 'be finished', 'is finished'],
              'answer': 1,
              'explanation': '含情态动词的被动语态结构为“情态动词 + be + 过去分词”，故填 be finished。'
            },
            {
              'stem': 'Trees ______ planted every year to protect the environment.',
              'options': ['must', 'must be', 'must are'],
              'answer': 1,
              'explanation': '含情态动词的被动语态，用 must be planted。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p7': [
        {
          'version': 1,
          'oneLiner': '看主语：主语是“做动作的人”用主动，是“承受动作的人或物”用被动。',
          'problem': '不管主语是施动还是受动，一律用主动，句意就反了。',
          'analogy': '主动像“我打他”，被动像“他被我打”：主语换成了挨打的那个，动词就得穿上被动的外套。',
          'example': 'These photos were taken by my father.（照片是被拍的→被动）。',
          'pitfalls': [
            '判断主语与动词是主动关系还是被动关系',
            '有 by sb 提示的常是被动句',
            '注意 take / make / give 等过去分词的拼写'
          ],
          'check': [
            {
              'stem': 'These photos ______ by my father last summer.',
              'options': ['take', 'took', 'were taken'],
              'answer': 2,
              'explanation': 'photos 与 take 是被动关系，时间为 last summer，用一般过去时被动 were taken。'
            },
            {
              'stem': 'The window ______ by the boy just now.',
              'options': ['broke', 'was broken', 'is breaking'],
              'answer': 1,
              'explanation': '窗户是“被打破”的，just now 表过去，用一般过去时被动 was broken。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '主动变被动三步走：宾语提前、动词变 be + 过去分词、原主语加 by。',
          'problem': '改被动句时漏掉最后一步，或把时态、单复数改乱。',
          'analogy': '像“换个位置坐”：原来坐主语的宾语挪到主语位，动词换被动衣，原来的主语退到 by 后面。',
          'example': 'They planted trees. → Trees were planted (by them).',
          'pitfalls': [
            '主动句宾语变被动句主语，注意人称与数',
            '动词改为 be + 过去分词，时态与主动句一致',
            '施动者不重要或未知时可省略 by 短语'
          ],
          'check': [
            {
              'stem': 'The passive form of “They planted trees.” is ______.',
              'options': ['Trees planted.', 'Trees were planted.', 'Trees are planted.'],
              'answer': 1,
              'explanation': '主动句宾语 trees 变被动句主语，时态为一般过去时，故用 were planted。'
            },
            {
              'stem': '把 “Tom broke the cup.” 改为被动语态，正确的是 ______.',
              'options': ['The cup was broken by Tom.', 'The cup broke by Tom.', 'The cup is broken by Tom.'],
              'answer': 0,
              'explanation': '宾语 the cup 作主语，用一般过去时被动 was broken，原主语加 by Tom。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p8': [
        {
          'version': 1,
          'oneLiner': '宾语从句里“是否”用 if / whether，但和 or not 直接连用只能用 whether。',
          'problem': '看到“是否”就写 if，遇到 or not 也不知道要换成 whether。',
          'analogy': 'whether 和 or not 是“绑定套餐”，一起出现时中间不能插 if。',
          'example': 'I don\'t know whether he will come or not.（不能说 if…or not）。',
          'pitfalls': [
            'whether…or not 是固定搭配',
            '介词后、句首作主语时用 whether，不用 if',
            'if 引导宾语从句时意为“是否”，也可用 whether'
          ],
          'check': [
            {
              'stem': 'I don\'t know ______ he will come or not.',
              'options': ['if', 'whether', 'that'],
              'answer': 1,
              'explanation': '与 or not 直接连用时只能用 whether，不能用 if。'
            },
            {
              'stem': 'It depends on ______ we can finish the work on time.',
              'options': ['if', 'whether', 'that'],
              'answer': 1,
              'explanation': '介词 on 后用 whether 引导宾语从句，不能用 if。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '宾语从句的引导词在从句中“不作成分”，定语从句的关系词“要作成分”。',
          'problem': '把 that 定语从句和 that 宾语从句混为一谈，选错引导词。',
          'analogy': '定语从句的关系词像“填空的砖”，要在从句里占一个位置；宾语从句的 that 只是一块“连接牌”，不占位置。',
          'example': 'I know (that) he is right.（宾语从句，that 不作成分）；The book that I bought…（定语从句，that 作 bought 的宾语）。',
          'pitfalls': [
            '先判断从句是修饰名词（定从）还是作动词宾语（宾从）',
            '定语从句关系词在从句中充当主语 / 宾语等',
            '宾语从句语序必须是陈述语序'
          ],
          'check': [
            {
              'stem': 'I still remember the day ______ we first met.',
              'options': ['which', 'who', 'when'],
              'answer': 2,
              'explanation': '先行词 the day 表时间，从句不缺主语和宾语，用关系副词 when。'
            },
            {
              'stem': 'The man ______ is talking with my father is a doctor.',
              'options': ['who', 'what', 'whose'],
              'answer': 0,
              'explanation': '先行词 the man 指人且作从句主语，用 who。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p9': [
        {
          'version': 1,
          'oneLiner': '先看从句缺什么成分：缺主语宾语用关系代词，只缺时间地点状语用关系副词。',
          'problem': '只盯着先行词是人是物，不看从句本身缺什么，于是 when 和 which 乱选一气。',
          'analogy': '关系词像填空的替补队员：先数清楚从句少的是“人”还是“时间”这个位置，再派对应的队员上场。',
          'example': 'This is the factory where my father works.（works 后不缺宾语，缺地点状语，用 where）；This is the factory that/which my father visited.（visited 缺宾语，用 which/that）。',
          'pitfalls': [
            '从句缺主语或宾语用关系代词 who/whom/which/that',
            '从句成分完整、只缺时间地点原因状语用关系副词 when/where/why',
            '判断方法先还原从句，看动词后面缺不缺宾语',
            '介词后指物用 which、指人用 whom，不能用 that'
          ],
          'check': [
            {
              'stem': 'This is the factory ______ my father works.',
              'options': ['which', 'where', 'who'],
              'answer': 1,
              'explanation': 'works 后不缺宾语，从句缺地点状语，用关系副词 where。'
            },
            {
              'stem': 'The book ______ I bought yesterday is very interesting.',
              'options': ['who', 'which', 'where'],
              'answer': 1,
              'explanation': 'bought 缺宾语，先行词 the book 指物，用 which。'
            }
          ],
          'readTime': 95
        },
        {
          'version': 2,
          'oneLiner': '关系副词 = 介词 + which，能用这个等式换算的才选 when/where/why。',
          'problem': '知道 when、where 表时间地点，看到时间地点先行词就直接选，忽略了从句结构。',
          'analogy': 'where 其实等于“in/at which”，when 等于“on/in which”。把关系副词展开成介词加 which，再对照从句，对不对一眼就看出来。',
          'example': 'the day when we met = the day on which we met；the city where I was born = the city in which I was born。',
          'pitfalls': [
            '先行词是时间地点，但从句缺主语或宾语时，仍用 that/which，不用 when/where',
            'the reason why 中的 why 等于 for which',
            '试代换：when/where/why 换成“介词+which”后意思通顺才对'
          ],
          'check': [
            {
              'stem': 'I still remember the day ______ we first met.',
              'options': ['which', 'who', 'when'],
              'answer': 2,
              'explanation': '先行词 the day 表时间，从句不缺主宾，用关系副词 when（=on which）。'
            },
            {
              'stem': 'This is the house ______ I lived in last year.',
              'options': ['where', 'which', 'when'],
              'answer': 1,
              'explanation': '句末已有介词 in，从句缺的是介词宾语，先行词指物用 which。'
            }
          ],
          'readTime': 95
        }
      ],
    'eng9b-p10': [
        {
          'version': 1,
          'oneLiner': '现在完成时看“对现在的影响”，一般过去时看“过去那个时间点”。',
          'problem': '一看到过去发生的事就用一般过去，忽略了它是否与现在还有联系。',
          'analogy': '现在完成时像一份“到现在为止的成绩单”，过去的动作还影响着现在；一般过去时像一张旧照片，只定格过去那一幕，和现在不再相连。',
          'example': 'I have lost my key.（现在还没找到）；I lost my key yesterday.（只说明昨天丢的）。',
          'pitfalls': [
            '有明确过去时间状语（last week、in 2019、ago、just now）只用一般过去',
            'have been to 去过已回来；have gone to 去了还没回来',
            '现在完成时常与 already/yet/ever/never/just/for/since 连用',
            '现在完成时不能和 when 连用提问过去的时间'
          ],
          'check': [
            {
              'stem': '— Have you ever been to Beijing? — Yes, I ______ there last year.',
              'options': ['have been', 'went', 'go'],
              'answer': 1,
              'explanation': 'last year 是明确过去时间，用一般过去式 went。'
            },
            {
              'stem': 'He ______ in this school since 2015.',
              'options': ['taught', 'has taught', 'teaches'],
              'answer': 1,
              'explanation': 'since 2015 表示从过去持续到现在，用现在完成时 has taught。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '时间状语是“信号词”：出现明确过去时间就用一般过去，出现 for/since 就用现在完成。',
          'problem': '记不清哪些时间状语搭配哪种时态，做题靠感觉。',
          'analogy': '时间状语像路口的红绿灯，先找信号再选时态：看到 last、ago、in+过去年份是红灯——一般过去；看到 for、since、already、yet 是绿灯——现在完成。',
          'example': 'He has lived here for ten years.（持续到现在）；He lived here for ten years then moved away.（已结束）。',
          'pitfalls': [
            'for + 一段时间同时可用于两者，要靠语境判断是否延续到现在',
            'already 多用于肯定句，yet 多用于否定句和疑问句',
            '回答 Have you…? 时，若无具体过去时间可用 Have；有具体时间则用过去式'
          ],
          'check': [
            {
              'stem': 'I ______ this book twice. It is really interesting.',
              'options': ['read', 'have read', 'am reading'],
              'answer': 1,
              'explanation': 'twice 表示到现在为止的经历次数，用现在完成时 have read。'
            },
            {
              'stem': 'They ______ to Shanghai in 2019 and lived there for five years.',
              'options': ['have moved', 'moved', 'move'],
              'answer': 1,
              'explanation': 'in 2019 是明确的过去时间，用一般过去式 moved。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p11': [
        {
          'version': 1,
          'oneLiner': '“过去的过去”用过去完成时：两个过去动作中，先发生的用 had done。',
          'problem': '两个动作都在过去，分不清谁先谁后，就不知道该给谁用过去完成时。',
          'analogy': '站在“过去”这个点上往回看：更早发生的那件事先“盖章”，用 had done；后发生的用一般过去式。',
          'example': 'When I got to the cinema, the film had already begun.（电影先开始，我到是后发生）。',
          'pitfalls': [
            '两个动作都在过去，先发生的用 had done，后发生的用一般过去',
            'by the time 引导从句用一般过去，主句用过去完成时',
            '过去完成时不能单独表示“早于现在”，必须有一个过去参照点',
            '有 after/before 明确先后时，两个都可用一般过去，也不为错'
          ],
          'check': [
            {
              'stem': 'When I got to the cinema, the film ______ already ______.',
              'options': ['has; begun', 'had; begun', 'was; begun'],
              'answer': 1,
              'explanation': '电影开始早于我到，属“过去的过去”，用过去完成时 had begun。'
            },
            {
              'stem': '用括号内动词的适当形式填空：By the time he arrived, we ______ (finish) the work.',
              'options': ['finished', 'have finished', 'had finished'],
              'answer': 2,
              'explanation': 'by the time 从句用过去式，主句动作更早发生，用过去完成时 had finished。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '抓住“参照点”：句子里先出现的过去动作是参照，早于它的动作才用过去完成。',
          'problem': '一见到两个过去动作就慌，甚至两个都写过去完成时。',
          'analogy': '像排队：一般过去是队伍里的“基准队员”，只有排在它前面的那件事才戴上 had 的帽子，队伍里不需要两个人同时戴。',
          'example': 'He told me that he had seen the film before.（told 是参照点，had seen 更早）；She had left before I called.（had left 更早，called 是参照）。',
          'pitfalls': [
            '一个句子中通常只用一处过去完成时，别滥用',
            '宾语从句中：主句过去时，从句动作更早用过去完成',
            'before/after 已表达先后时，可用一般过去代替过去完成'
          ],
          'check': [
            {
              'stem': 'He told me that he ______ the great wall three years before.',
              'options': ['visits', 'visited', 'had visited'],
              'answer': 2,
              'explanation': '主句 told 是过去，从句动作更早，用过去完成时 had visited。'
            },
            {
              'stem': 'The train ______ by the time we got to the station.',
              'options': ['left', 'had left', 'has left'],
              'answer': 1,
              'explanation': '火车离开早于我们到站，属“过去的过去”，用 had left。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p12': [
        {
          'version': 1,
          'oneLiner': '原因、结果、让步各有各的连词，且中英文习惯不同：although 不再加 but，because 不再加 so。',
          'problem': '受汉语“虽然…但是…”“因为…所以…”影响，把 but、so 也照搬进英文句子。',
          'analogy': '连词像给句子贴的“关系标签”：一张标签说明一个关系就够了，贴两张（although…but）反而自相矛盾。',
          'example': 'Although he is young, he knows a lot.（不再加 but）；He is so kind that everyone likes him.（so+形容词+that 表结果）。',
          'pitfalls': [
            'although/though 不能与 but 连用，because 不能与 so 连用',
            'so + 形容词/副词 + that；such + 名词短语 + that',
            'even though 表让步，even if 表假设“即使”',
            'because 引导原因，so that 引导目的，别混淆'
          ],
          'check': [
            {
              'stem': '______ he is young, he knows a lot.',
              'options': ['Although', 'But', 'Because'],
              'answer': 0,
              'explanation': '两句为让步关系，用 Although，且句中不再加 but。'
            },
            {
              'stem': 'We stayed at home ______ it was raining heavily.',
              'options': ['so', 'because', 'although'],
              'answer': 1,
              'explanation': '下大雨是待在家的原因，用 because 引导原因状语从句。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '先判断两个分句是“因果”还是“转折”，再挑连词，绝不重复。',
          'problem': '只看连词意思，不判断逻辑关系，把转折当成因果来选。',
          'analogy': '读句子像听人说话：先听出后半句是“所以顺理成章”还是“出乎意料地相反”，关系听准了，连词自然对号入座。',
          'example': 'He was ill, so he didn\'t come.（结果）；He came although he was ill.（让步）；He didn\'t come because he was ill.（原因）。',
          'pitfalls': [
            'so…that 中 so 后接形容词/副词，such 后接名词',
            'so that 表目的，可与 in order that 换用',
            'though 可用于句末表“不过”，although 不行'
          ],
          'check': [
            {
              'stem': 'It was ______ a wonderful film that we all wanted to see it again.',
              'options': ['so', 'such', 'very'],
              'answer': 1,
              'explanation': 'such + a + 形容词 + 名词 + that，a wonderful film 是名词短语，用 such。'
            },
            {
              'stem': '______ he was tired, he kept working.',
              'options': ['Because', 'Although', 'So'],
              'answer': 1,
              'explanation': '累却继续工作，为让步关系，用 Although。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p13': [
        {
          'version': 1,
          'oneLiner': '时间、条件状语从句里“主将从现”：主句用将来，从句用现在。',
          'problem': '把 will 也塞进从句，写出 as soon as he will come 这类错误。',
          'analogy': '从句像守门人，只认“现在时”这张通行证；真正要发生的将来动作，放在主句里表达。',
          'example': 'I will tell him the news as soon as he comes back.（从句用 comes）；If it rains tomorrow, we will stay at home.',
          'pitfalls': [
            'as soon as/when/if/unless 引导从句用一般现在时代替将来',
            'unless 相当于 if…not（除非）',
            'while 强调“当…的过程中”，从句常用进行时'
          ],
          'check': [
            {
              'stem': 'I will tell him the news as soon as he ______ back.',
              'options': ['will come', 'comes', 'came'],
              'answer': 1,
              'explanation': 'as soon as 引导时间状语从句，主将从现，用 comes。'
            },
            {
              'stem': 'The sentence “We will start as soon as he will arrive.” is correct.',
              'options': ['对', '错'],
              'answer': 1,
              'explanation': 'as soon as 从句应用一般现在时表将来，应为 he arrives，原句错误。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': 'unless 就是“如果不”，遇到它先把它翻译成 if…not 再判断。',
          'problem': '会背主将从现，却忘了条件从句里的 unless 同样遵守这条规则。',
          'analogy': 'unless 像一枚变形的硬币，翻过来就是 if…not，换一换你会发现它和 if 一样，从句照样用现在时。',
          'example': 'We won\'t go out unless it stops raining. = We won\'t go out if it doesn\'t stop raining.',
          'pitfalls': [
            'unless 本身含否定，从句不再加 not',
            '条件句主句也可用情态动词（can/must/may）+ 动词原形',
            'when 引导时间从句同样遵守主将从现'
          ],
          'check': [
            {
              'stem': 'You ______ pass the exam unless you work harder.',
              'options': ['won\'t', 'don\'t', 'didn\'t'],
              'answer': 0,
              'explanation': '主句表将来，用 won\'t，unless 从句用一般现在时 work。'
            },
            {
              'stem': 'If it ______ tomorrow, we will not go to the park.',
              'options': ['will rain', 'rains', 'rained'],
              'answer': 1,
              'explanation': 'if 引导条件状语从句，主将从现，用一般现在时 rains。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p14': [
        {
          'version': 1,
          'oneLiner': '记住“接 to do”和“接 doing”的动词清单，再记那些意义会变的词。',
          'problem': '只背单词不记搭配，见到 enjoy 后面也写 to do。',
          'analogy': 'to do 像“指向未来、还没做的事”，doing 像“已经发生或正在做的动作”。动词后面配哪双鞋，先看它是“要去做”还是“做过了”。',
          'example': 'Remember to close the door.（记得去关，还没关）；I remember closing the door.（记得关过了）。',
          'pitfalls': [
            'remember/forget 接 to do 表示“还没做”，接 doing 表示“已经做过”',
            'stop to do 停下手中事去做另一件，stop doing 停止正在做的事',
            'enjoy/finish/mind/practice/keep 后接 doing',
            '介词后面一律接 doing'
          ],
          'check': [
            {
              'stem': 'Remember ______ the door when you leave.',
              'options': ['to close', 'closing', 'close'],
              'answer': 0,
              'explanation': 'remember to do 表示“记得去做（还没做）”，离开时记得关门，用 to close。'
            },
            {
              'stem': 'My father is busy ______ his car.',
              'options': ['to repair', 'repairing', 'repair'],
              'answer': 1,
              'explanation': 'be busy doing sth. 忙于做某事，用 repairing。'
            }
          ],
          'readTime': 95
        },
        {
          'version': 2,
          'oneLiner': '小心“假 to”：look forward to、be used to 里的 to 是介词，后面接 doing。',
          'problem': '一看到 to 就接动词原形，忽略了有些 to 其实是介词。',
          'analogy': '多数 to 是通往动词原形的路牌，但在 look forward to、be used to 里，to 变成了介词，后面要接 doing 这辆“名词车”。',
          'example': 'I am looking forward to seeing you.（to 是介词）；She is used to getting up early.',
          'pitfalls': [
            'look forward to doing 期待做某事',
            'be used to doing 习惯于做某事（区别于 used to do 过去常常）',
            'pay attention to doing、prefer A to B 中的 to 都是介词'
          ],
          'check': [
            {
              'stem': 'I am looking forward to ______ from you soon.',
              'options': ['hear', 'hearing', 'heard'],
              'answer': 1,
              'explanation': 'look forward to 中 to 是介词，后接动名词 hearing。'
            },
            {
              'stem': 'I prefer reading ______ watching TV.',
              'options': ['to', 'than', 'for'],
              'answer': 0,
              'explanation': 'prefer A to B 表“相比 B 更喜欢 A”，to 是介词。'
            }
          ],
          'readTime': 95
        }
      ],
    'eng9b-p15': [
        {
          'version': 1,
          'oneLiner': '直接引语变间接引语三步：改人称、退时态、换时间地点词。',
          'problem': '只改时态，忘了人称和 tomorrow / here 这类词也要跟着变。',
          'analogy': '转述别人的话像把录音倒带回放：你在“更远的过去”说，时间、地点、人称都得往后退一格。',
          'example': 'He said, “I am tired.” → He said (that) he was tired.；She said, “I will come tomorrow.” → She said she would come the next day.',
          'pitfalls': [
            '时态退一步：一般现在→一般过去，一般过去→过去完成，will→would，can→could',
            '人称随语境改：I→he/she，my→his/her',
            '时间地点词：now→then，today→that day，tomorrow→the next day，here→there'
          ],
          'check': [
            {
              'stem': 'He said, “I am tired.” → He said that he ______ tired.',
              'options': ['is', 'was', 'were'],
              'answer': 1,
              'explanation': '主句 said 是过去，从句时态后退，am 变为 was。'
            },
            {
              'stem': '“I will come tomorrow,” she said. → She said she ______ come the next day.',
              'options': ['will', 'would', 'does'],
              'answer': 1,
              'explanation': 'will 在间接引语中变为 would，tomorrow 变为 the next day。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '转述客观真理时，时态不后退，保持一般现在。',
          'problem': '一律机械地把时态往后退，把“地球绕太阳转”也改成过去时。',
          'analogy': '真理像刻在石头上的字，不会因为转述而改写；只有临时的说法才需要“退回过去”。',
          'example': 'The teacher told us that the earth moves around the sun.（真理，用 moves 不变）',
          'pitfalls': [
            '客观真理、科学事实、谚语转述后时态不变',
            '现在进行时转述后变过去进行时',
            '指示代词 this/these → that/those'
          ],
          'check': [
            {
              'stem': 'Our teacher said that light ______ faster than sound.',
              'options': ['travels', 'traveled', 'will travel'],
              'answer': 0,
              'explanation': '转述的是客观真理，时态不变，用一般现在时 travels。'
            },
            {
              'stem': 'She said, “I am doing my homework.” → She said that she ______ her homework.',
              'options': ['is doing', 'was doing', 'did'],
              'answer': 1,
              'explanation': '直接引语现在进行时，转述后变为过去进行时 was doing。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p16': [
        {
          'version': 1,
          'oneLiner': 'both…and 表“都”，谓语用复数；either…or / neither…nor 表“二选一/都不要”。',
          'problem': '分不清三个关联词的意思，也忘了它们对谓语单复数的影响。',
          'analogy': 'both…and 像“两个人都上场”，谓语用复数；either…or 像“只能上一个”，neither…nor 像“一个都不上”。',
          'example': 'Both Tom and Jim are here.；Either you or he is right.',
          'pitfalls': [
            'both…and 连接并列主语时谓语用复数',
            'either…or / neither…nor / not only…but also 遵循就近原则',
            'neither…nor 本身含否定，句中不再加 not'
          ],
          'check': [
            {
              'stem': '______ Tom ______ his brother is going to the party. Both of them like it.',
              'options': ['Both; and', 'Either; or', 'Neither; nor'],
              'answer': 0,
              'explanation': '句意两人都去，且由 Both of them 可知用 both…and。'
            },
            {
              'stem': 'You can ______ stay at home ______ go out with us.',
              'options': ['either; or', 'both; and', 'neither; nor'],
              'answer': 0,
              'explanation': '二者选其一，用 either…or。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '“就近原则”：either…or、neither…nor、not only…but also 的谓语看离它最近的主语。',
          'problem': '按两个主语的“总和”来判断谓语，忽略就近原则。',
          'analogy': '这几个关联词像在玩“看谁离得近”：离动词最近的那个主语说了算，它单数谓语就单数。',
          'example': 'Neither he nor I am right.（离动词最近是 I，用 am）；Not only the students but also the teacher likes the film.',
          'pitfalls': [
            'not only…but also 连接主语时用就近原则',
            'not only 放句首连接分句时，主句要部分倒装',
            'there be 句型中并列主语也用就近原则'
          ],
          'check': [
            {
              'stem': 'Neither he nor I ______ able to solve the problem.',
              'options': ['is', 'am', 'are'],
              'answer': 1,
              'explanation': '就近原则，离动词最近的主语是 I，用 am。'
            },
            {
              'stem': 'Not only Tom but also his parents ______ the film very much.',
              'options': ['likes', 'like', 'liking'],
              'answer': 1,
              'explanation': '就近原则，离动词最近的主语是 parents，用复数 like。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p17': [
        {
          'version': 1,
          'oneLiner': '表推测：must 一定是、can\'t 一定不是、may/might 可能；表禁止用 mustn\'t，表不必用 needn\'t。',
          'problem': '把 mustn\'t（禁止）和 needn\'t（不必）当成同义词，否定推测也用 mustn\'t。',
          'analogy': '情态动词像“确定度的刻度盘”：must 拉满到 100% 肯定，may 停在中间大约 50%，can\'t 是反向拉满的 100% 否定。',
          'example': 'He must be at home.（一定在）；He can\'t be at home.（一定不在）；You mustn\'t smoke here.（禁止）；You needn\'t come.（不必）。',
          'pitfalls': [
            'must 表肯定推测只用于肯定句，否定推测用 can\'t',
            'mustn\'t 表“禁止”，needn\'t / don\'t have to 表“不必”',
            'may / might 表可能性，might 语气更弱'
          ],
          'check': [
            {
              'stem': 'He ______ be at home now, because I saw him go out just now.',
              'options': ['must', 'can\'t', 'needn\'t'],
              'answer': 1,
              'explanation': '刚才见他出门，他现在一定不在家，否定推测用 can\'t。'
            },
            {
              'stem': 'You ______ swim in this river. It\'s dangerous.',
              'options': ['needn\'t', 'mustn\'t', 'may'],
              'answer': 1,
              'explanation': '河里危险，表示禁止，用 mustn\'t。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': 'Must I…? 的否定回答是 No, you needn\'t / don\'t have to（不必），不是 mustn\'t（禁止）。',
          'problem': '用 must 提问，也用 mustn\'t 回答，语气从“不必”变成“禁止”。',
          'analogy': 'mustn\'t 是“禁止命令”，needn\'t 是“可以不用”。别人问“我必须吗”，否认的是“必须”，回答“不必”，不是“禁止”。',
          'example': '— Must I finish it today? — No, you needn\'t.（不必）',
          'pitfalls': [
            'must 提问的否定回答用 needn\'t / don\'t have to',
            '表推测的 must，其反义推测用 can\'t',
            'needn\'t 后接动词原形，等于 don\'t have to'
          ],
          'check': [
            {
              'stem': '— Must I hand in the homework now? — No, you ______.',
              'options': ['mustn\'t', 'needn\'t', 'can\'t'],
              'answer': 1,
              'explanation': 'must 提问的否定回答表示“不必”，用 needn\'t。'
            },
            {
              'stem': 'The light is on, so he ______ be in the office.',
              'options': ['can\'t', 'must', 'needn\'t'],
              'answer': 1,
              'explanation': '灯亮着，肯定推测他在办公室，用 must。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p18': [
        {
          'version': 1,
          'oneLiner': '完形填空先通读抓大意、看首尾句定主题，再逐空结合语境和搭配选词，最后回读检查。',
          'problem': '拿到题就一空一空做，见词填词，不理会上下文和固定搭配。',
          'analogy': '完形像拼图：先看盒子封面（标题和首句）知道要拼什么图，再一块块找位置，不能拿到一块就硬塞。',
          'example': '空格后是 a lot of，多半填可数名词复数或不可数名词；make 后面常搭 a decision / progress / friends。',
          'pitfalls': [
            '先通读全文，再逐空作答',
            '注意上下文的复现词与同义替换，它们常是线索',
            '固定搭配优先于字面直译'
          ],
          'check': [
            {
              'stem': 'The boy was so ______ that he could not say a word.',
              'options': ['excited', 'exciting', 'excite'],
              'answer': 0,
              'explanation': '修饰人用 -ed 结尾的形容词 excited，表示“感到激动的”。'
            },
            {
              'stem': 'The accident ______ last night. Luckily, no one was hurt.',
              'options': ['happened', 'was happened', 'has happened'],
              'answer': 0,
              'explanation': 'happen 是不及物动词，无被动，last night 用一般过去式 happened。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '盯住逻辑关系词（however / therefore / besides）和词的感情色彩来定答案。',
          'problem': '忽略上下文逻辑，把转折处当递进来选词。',
          'analogy': '完形里每个词都和邻居呼应，像接力赛：前面说困难，后面多半接“坚持、克服”，选词的感情色彩要顺着往下走。',
          'example': 'It was raining hard. However, we still got to school on time.（转折）',
          'pitfalls': [
            '注意转折、因果、递进等逻辑关系词',
            '形容词 -ed 修饰人、-ing 修饰物',
            '及物还是不及物，决定有没有被动语态'
          ],
          'check': [
            {
              'stem': 'It was raining hard. ______, we still got to school on time.',
              'options': ['However', 'Therefore', 'Besides'],
              'answer': 0,
              'explanation': '前后为转折关系，用 However。'
            },
            {
              'stem': 'The story is so ______ that all the children are ______ in it.',
              'options': ['interesting; interested', 'interested; interesting', 'interesting; interesting'],
              'answer': 0,
              'explanation': '-ing 形容词修饰物 the story，-ed 形容词修饰人 the children。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p19': [
        {
          'version': 1,
          'oneLiner': '词义猜测靠上下文：同义解释、反义对比、举例和构词法都是线索。',
          'problem': '遇到生词就慌，要么跳过要么瞎猜，不去看它周围的“提示”。',
          'analogy': '生词像遇到的陌生人，但他身边常站着“翻译官”：同义词、反义词、例子、定语从句都会悄悄告诉你他的意思。',
          'example': 'He is a philanthropist, a person who gives money to help others.（用 a person who 作解释，猜出“慈善家”）。',
          'pitfalls': [
            '看标点信号：逗号、破折号、括号后常是对生词的解释',
            '找对比词 but/however/unlike 得出反义',
            '找因果线索 because/for',
            '用词根词缀拆词，如 un- 表否定、-less 表“无”'
          ],
          'check': [
            {
              'stem': 'When you guess the meaning of a new word, you can ______.',
              'options': ['look it up in a dictionary at once', 'use the context around it', 'give up reading'],
              'answer': 1,
              'explanation': '词义猜测主要依靠上下文线索来判断。'
            },
            {
              'stem': 'The writer\'s attitude in a passage can often be found from ______.',
              'options': ['the title only', 'the words and tone the writer uses', 'the number of paragraphs'],
              'answer': 1,
              'explanation': '作者态度通常通过用词和语气体现。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '推理判断不脱离原文：答案必须有文中依据，“合理但文中没提”的选项不选。',
          'problem': '凭自己的生活经验去推理，选了看似合理却无原文依据的选项。',
          'analogy': '推理题像侦探断案：不能凭空想象，必须有文中的“证据”支撑；越看似合理、却没有原文依据的选项，越是陷阱。',
          'example': '问 What can we infer? 时，四个选项常是：一个文中明说的、一个太绝对的（all/never）、一个无中生有的、一个正确推理。',
          'pitfalls': [
            '排除含绝对词 all/never/must 的选项',
            '排除原文照抄但并非“推断”的选项',
            '排除无中生有的选项',
            '转折词后的信息常是作者真正的态度'
          ],
          'check': [
            {
              'stem': 'Which of the following is the best way to answer an inference question?',
              'options': ['Rely only on your own experience', 'Base the answer on clues in the passage', 'Choose the longest option'],
              'answer': 1,
              'explanation': '推理判断必须以文中线索为依据。'
            },
            {
              'stem': 'An option that says “all people always…” in a reading passage is usually ______.',
              'options': ['the correct answer', 'too absolute and wrong', 'a key clue'],
              'answer': 1,
              'explanation': '含 all/always 等绝对词的选项往往过于绝对，多为干扰项。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p20': [
        {
          'version': 1,
          'oneLiner': '短文填空两步：先判断空格要什么词性，再按语法把方框里的词变成正确形式。',
          'problem': '从方框里挑到意思对的词就直接填，忘了时态、语态、单复数要变形。',
          'analogy': '方框里的词像“半成品原料”，空格是“定制模具”：原料要按模具加工成形，比如 give 要切成 given，protect 要切成 protecting。',
          'example': 'take an active part in ______ (protect) the environment → protecting（介词 in 后接动名词）。',
          'pitfalls': [
            '介词后接动名词（in doing）',
            '被动语态用 be + 过去分词',
            '现在完成时用 have/has + 过去分词',
            '形容词变副词一般加 -ly'
          ],
          'check': [
            {
              'stem': '用括号内单词的适当形式填空：We should take an active part in ______ (protect) the environment.',
              'options': ['protect', 'protecting', 'protected'],
              'answer': 1,
              'explanation': '介词 in 后接动名词，用 protecting。'
            },
            {
              'stem': '用括号内动词的适当形式填空：Many changes ______ (take) place in my hometown in recent years.',
              'options': ['have taken', 'have been taken', 'took'],
              'answer': 0,
              'explanation': 'take place 是不及物动词短语，无被动；in recent years 用现在完成时 have taken。'
            }
          ],
          'readTime': 95
        },
        {
          'version': 2,
          'oneLiner': '词性由空格位置决定：主语宾语用名词，名词前用形容词，动词前后用副词。',
          'problem': '只看词义不看位置，把该填名词的地方填了形容词。',
          'analogy': '空格像舞台上方的探照灯，照到哪里就决定演员穿什么衣服：灯打在主语位就穿名词衣，打在名词前就穿形容词衣。',
          'example': 'His ______ (happy) made us happy. → happiness（物主代词后接名词）。',
          'pitfalls': [
            'the / 物主代词后接名词',
            'a/an 后接可数名词单数',
            '实义动词后、修饰动词用副词',
            '系动词（be/look/sound）后用形容词'
          ],
          'check': [
            {
              'stem': '用括号内单词的适当形式填空：The ______ (science) are doing research.',
              'options': ['science', 'scientist', 'scientists'],
              'answer': 2,
              'explanation': '主语位置且由 are 可知需复数名词，用 scientists。'
            },
            {
              'stem': '用括号内单词的适当形式填空：He works ______ (care) and never makes mistakes.',
              'options': ['careful', 'carefully', 'care'],
              'answer': 1,
              'explanation': '修饰动词 works 要用副词 carefully。'
            }
          ],
          'readTime': 95
        }
      ],
    'eng9b-p21': [
        {
          'version': 1,
          'oneLiner': '用连接词把句子串成段落：并列、转折、因果、时间顺序、举例、总结各有专词。',
          'problem': '写完一堆句子，句与句之间没有衔接，读起来像断线的珠子。',
          'analogy': '连接词像文章的“路标”：读者靠这些路标知道你现在是并列、转折还是总结；没有它们，句子就串不成项链。',
          'example': 'First, we should save water. Besides, we can plant more trees. In a word, protecting the environment is our duty.',
          'pitfalls': [
            '并列 besides/and，转折 however/but',
            '因果 therefore/so，总结 in a word/in short',
            '举例 for example/such as，时间顺序 first/then/finally'
          ],
          'check': [
            {
              'stem': 'Which word can best show the relationship of “adding information”?',
              'options': ['However', 'Besides', 'Therefore'],
              'answer': 1,
              'explanation': 'Besides 表示递进、补充信息。'
            },
            {
              'stem': 'Using linking words such as “first, then, finally” can make a composition more logical.',
              'options': ['对', '错'],
              'answer': 0,
              'explanation': '连接词能使文章更有条理、更连贯，说法正确。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '段落结构讲“主题句 + 支撑句 + 结尾句”，段与段用过渡句衔接。',
          'problem': '一段里塞好几个意思，读完不知道这段到底想说什么。',
          'analogy': '一篇好作文像一栋楼，每段是一层：主题句是门牌，支撑句是房间，过渡句是楼层间的楼梯。',
          'example': '写 My Favourite Sport：开头点题→中间说明理由（first/besides）→结尾总结升华。',
          'pitfalls': [
            '每段只讲一个中心意思',
            '段与段之间用过渡句衔接',
            '避免全篇反复用 and 堆砌'
          ],
          'check': [
            {
              'stem': 'A good paragraph usually begins with a ______ sentence to tell the main idea.',
              'options': ['topic', 'question', 'long'],
              'answer': 0,
              'explanation': '段落常以主题句开头点明中心。'
            },
            {
              'stem': 'Which is the best way to make a composition more coherent?',
              'options': ['Use the same short sentence again and again', 'Use proper linking words and transition sentences', 'Write as many words as possible'],
              'answer': 1,
              'explanation': '恰当使用连接词和过渡句能使文章更连贯。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p22': [
        {
          'version': 1,
          'oneLiner': '升格三招：把简单句并成复合句、用高级词替换常见词、用非谓语结构让句子更紧凑。',
          'problem': '通篇都是“主语+be+形容词”的简单句，句式单一，分数上不去。',
          'analogy': '写文章像做菜：普通食材（简单词、简单句）也能吃，但加上调味（高级词、从句、非谓语）味道立刻上一个档次。',
          'example': 'The city is very beautiful. → The city, which is famous for its old buildings, is well worth visiting.',
          'pitfalls': [
            '用定语从句、状语从句替换两个简单句',
            '用非谓语（doing/to do）代替并列句',
            '高级词要准确，别乱用生僻词',
            '长短句搭配，句式要多样'
          ],
          'check': [
            {
              'stem': 'Which is a better “upgraded” version of “The city is very beautiful.”?',
              'options': ['The city is beauty.', 'The city, famous for its old buildings, is well worth visiting.', 'The city is very very beautiful.'],
              'answer': 1,
              'explanation': '用非谓语和高级表达升格，句式更丰富。'
            },
            {
              'stem': 'In an English composition, using many simple sentences with the same structure helps get a high score.',
              'options': ['对', '错'],
              'answer': 1,
              'explanation': '句式单一会显得单调，应长短句结合、巧用从句和非谓语，说法错误。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '升格不是堆长句，而是让句式有变化、表达有细节。',
          'problem': '误以为句子越长越复杂分数越高，结果写出一堆病句。',
          'analogy': '好作文像音乐：全是一个调子会听腻，长短句交替、详略得当才有节奏感。',
          'example': 'I like English. → What I like most is English because it opens a new world to me.',
          'pitfalls': [
            '别为了升格写出病句',
            '高级句式要与内容匹配',
            '全文保持时态一致'
          ],
          'check': [
            {
              'stem': 'Which sentence uses a more advanced structure?',
              'options': ['I like English.', 'What I like most is English because it opens a new world to me.', 'I like English. English is good.'],
              'answer': 1,
              'explanation': '主语从句加原因状语从句，结构更高级。'
            },
            {
              'stem': 'To upgrade a composition, we should make all sentences long and complex.',
              'options': ['对', '错'],
              'answer': 1,
              'explanation': '升格讲究句式长短结合、变化多样，一味长句反而生硬，说法错误。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng9b-p23': [
        {
          'version': 1,
          'oneLiner': '听力数字题先记原始数据，再按提示词做加减；时间、价格、年龄常要计算。',
          'problem': '听到数字就急着选，忽略了问题里 more/less/later 等提示，忘了还要算一算。',
          'analogy': '听力数字题像算账：先把听到的数字记在草稿纸上，再按问题提示做加减，别凭印象直接选。',
          'example': 'The film starts at a quarter past seven.（7:15）；It\'s half past three.（3:30）。',
          'pitfalls': [
            'a quarter past seven = 7:15，a quarter to seven = 6:45',
            'half past three = 3:30',
            '听清 more/less/later/earlier 等提示词后再计算'
          ],
          'check': [
            {
              'stem': '听到“The film starts at a quarter past seven.”，放映时间是（ ）。',
              'options': ['6:45', '7:15', '7:45'],
              'answer': 1,
              'explanation': 'a quarter past seven 指七点过一刻，即 7:15。'
            },
            {
              'stem': '听到“It\'s half past three.”，时间是（ ）。',
              'options': ['3:30', '2:30', '3:00'],
              'answer': 0,
              'explanation': 'half past three 指三点半，即 3:30。'
            }
          ],
          'readTime': 85
        },
        {
          'version': 2,
          'oneLiner': '地点与信息转述：抓疑问词对应的关键词，用速记符号，听完再还原信息。',
          'problem': '想听懂每个单词，结果一个关键词都没抓住。',
          'analogy': '听力像速记员：不用听完每个词，抓关键词做记号，像把长句压成几个符号，再根据问题还原。',
          'example': '听到 at the school gate / at 8 a.m.，就记 “gate 8am”，问 Where/When 时直接对照。',
          'pitfalls': [
            '先看题干选项预测内容',
            '抓疑问词（where/when/how much）对应的信息',
            '注意同义转述，如 library→books, borrow',
            '注意说话人纠正后的信息才是最终答案'
          ],
          'check': [
            {
              'stem': 'Which is the most useful skill in a listening test?',
              'options': ['Trying to write down every word', 'Reading the questions first and catching key words', 'Closing your eyes and just listening'],
              'answer': 1,
              'explanation': '先读题干预测、再抓关键词，是听力解题的关键技巧。'
            },
            {
              'stem': 'In a listening dialogue, if the speaker says “No, I mean Tuesday.”, the correct time is ______.',
              'options': ['the first time mentioned', 'the corrected time (Tuesday)', 'neither time'],
              'answer': 1,
              'explanation': '说话人纠正后的信息才最准确，应以 Tuesday 为准。'
            }
          ],
          'readTime': 85
        }
      ]
  };

  registerSubject({ knowledgePoints, questions, lessons });
})();
