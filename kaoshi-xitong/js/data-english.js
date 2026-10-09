// 英语·外研版·八年级（Module × 三线：词汇/语法/题型技能）
// 章节框架对照开发文档附录 A.3；⭐=中考高频语法
// ⚠️ 外研新版单元结构变化大，L3 的 Module 编号落库前须对照课本目录核对（见文档 §15 / 附录 A.3）
(function () {
  setSubject('english');

  const knowledgePoints = [
    kp('eng8a', null, '英语·八上', 1, 1),

    // ── 词汇线 ──
    kp('eng8a-v', 'eng8a', '词汇线', 1, 2),
    kp('eng8a-v1', 'eng8a-v', 'Module 1–4 核心词汇', 1, 3),
    kp('eng8a-p1', 'eng8a-v1', '名词单复数与不规则变化', 1, 4, { bloom: '记忆', weight: 3 }),
    kp('eng8a-p2', 'eng8a-v1', '形容词与副词词形转换', 2, 4, { bloom: '应用', weight: 3 }),
    kp('eng8a-v2', 'eng8a-v', 'Module 5–8 核心词汇', 2, 3),
    kp('eng8a-p3', 'eng8a-v2', '动词不规则过去式拼写', 1, 4, { bloom: '记忆', weight: 4, tags: ['高频考点', '易错'] }),
    kp('eng8a-p4', 'eng8a-v2', '易混词辨析（lend/borrow、say/tell 等）', 2, 4, { bloom: '理解', weight: 3 }),
    kp('eng8a-v3', 'eng8a-v', 'Module 9–12 核心词汇', 3, 3),
    kp('eng8a-p5', 'eng8a-v3', '构词法：前缀与后缀', 1, 4, { bloom: '理解', weight: 3 }),

    // ── 语法线 ──
    kp('eng8a-g', 'eng8a', '语法线', 2, 2),
    kp('eng8a-g1', 'eng8a-g', 'M1 一般现在时与频率副词', 1, 3),
    kp('eng8a-p6', 'eng8a-g1', '一般现在时第三人称单数', 1, 4, { bloom: '应用', weight: 4, tags: ['高频考点'] }),
    kp('eng8a-p7', 'eng8a-g1', '频率副词的位置与用法', 2, 4, { bloom: '应用', weight: 4, tags: ['易错'] }),
    kp('eng8a-g2', 'eng8a-g', 'M2–M3 比较级与最高级 ⭐', 2, 3),
    kp('eng8a-p8', 'eng8a-g2', '比较级与最高级的构成', 1, 4, { bloom: '记忆', weight: 5, tags: ['高频考点'] }),
    kp('eng8a-p9', 'eng8a-g2', '比较级常用句型（than / as…as / one of the + 最高级）', 2, 4, { bloom: '应用', weight: 5, tags: ['高频考点'], prereq: ['eng8a-p8'] }),
    kp('eng8a-g3', 'eng8a-g', 'M7–M8 过去进行时 ⭐', 3, 3),
    kp('eng8a-p10', 'eng8a-g3', '过去进行时的构成与用法', 1, 4, { bloom: '应用', weight: 5, tags: ['高频考点'] }),
    kp('eng8a-p11', 'eng8a-g3', '过去进行时与一般过去时的区别（when / while）', 2, 4, { bloom: '分析', weight: 5, tags: ['高频考点', '易错'], prereq: ['eng8a-p10'] }),
    kp('eng8a-g4', 'eng8a-g', 'M5–M6 动词不定式', 4, 3),
    kp('eng8a-p12', 'eng8a-g4', '不定式作宾语与宾语补足语', 1, 4, { bloom: '应用', weight: 4, tags: ['高频考点'] }),
    kp('eng8a-p13', 'eng8a-g4', '疑问词 + 不定式', 2, 4, { bloom: '应用', weight: 3 }),
    kp('eng8a-g5', 'eng8a-g', 'M10–M12 情态动词', 5, 3),
    kp('eng8a-p14', 'eng8a-g5', '情态动词表推测与许可', 1, 4, { bloom: '应用', weight: 4 }),
    kp('eng8a-p15', 'eng8a-g5', 'must 与 have to 的区别', 2, 4, { bloom: '理解', weight: 4, tags: ['易错'] }),
    kp('eng8a-g6', 'eng8a-g', '条件状语从句', 6, 3),
    kp('eng8a-p16', 'eng8a-g6', 'if / unless 引导的条件状语从句（主将从现）', 1, 4, { bloom: '应用', weight: 5, tags: ['高频考点'] }),

    // ── 题型技能线 ──
    kp('eng8a-s', 'eng8a', '题型技能线', 3, 2),
    kp('eng8a-s1', 'eng8a-s', '完形与阅读', 1, 3),
    kp('eng8a-p17', 'eng8a-s1', '完形填空：上下文逻辑与连接词', 1, 4, { bloom: '应用', weight: 4 }),
    kp('eng8a-p18', 'eng8a-s1', '阅读理解：细节定位与主旨大意', 2, 4, { bloom: '应用', weight: 5, tags: ['高频考点'] }),
    kp('eng8a-s2', 'eng8a-s', '书面表达与听力', 2, 3),
    kp('eng8a-p19', 'eng8a-s2', '书面表达：时态与人称一致', 1, 4, { bloom: '应用', weight: 4 }),
    kp('eng8a-p20', 'eng8a-s2', '听力：数字、时间与地点信息抓取', 2, 4, { bloom: '理解', weight: 3 }),

    // ── 八年级下 ──
    kp('eng8b', null, '英语·八下', 2, 1),

    // ── 词汇线 ──
    kp('eng8b-v', 'eng8b', '词汇线', 1, 2),
    kp('eng8b-v1', 'eng8b-v', 'Module 1–4 核心词汇', 1, 3),
    kp('eng8b-p1', 'eng8b-v1', '名词、代词与数词', 1, 4, { bloom: '记忆', weight: 3 }),
    kp('eng8b-p2', 'eng8b-v1', '动词短语搭配（take / turn / put 等）', 2, 4, { bloom: '应用', weight: 4, tags: ['高频考点'] }),
    kp('eng8b-v2', 'eng8b-v', 'Module 5–10 核心词汇', 2, 3),
    kp('eng8b-p3', 'eng8b-v2', '形容词 -ed / -ing 与副词扩展', 1, 4, { bloom: '理解', weight: 3, tags: ['易错'] }),

    // ── 语法线 ──
    kp('eng8b-g', 'eng8b', '语法线', 2, 2),
    kp('eng8b-g1', 'eng8b-g', 'M2–M4 现在完成时 ⭐', 1, 3),
    kp('eng8b-p4', 'eng8b-g1', '现在完成时的构成（have / has + 过去分词）', 1, 4, { bloom: '应用', weight: 5, tags: ['高频考点'] }),
    kp('eng8b-p5', 'eng8b-g1', '现在完成时与一般过去时的区别', 2, 4, { bloom: '分析', weight: 5, tags: ['高频考点', '易错'], prereq: ['eng8b-p4'] }),
    kp('eng8b-p6', 'eng8b-g1', 'already / yet / ever / never / just 的位置', 3, 4, { bloom: '应用', weight: 4 }),
    kp('eng8b-p7', 'eng8b-g1', '延续性动词与瞬间动词（for / since）', 4, 4, { bloom: '分析', weight: 4, tags: ['易错'], prereq: ['eng8b-p4'] }),
    kp('eng8b-g2', 'eng8b-g', '宾语从句 ⭐', 2, 3),
    kp('eng8b-p8', 'eng8b-g2', '宾语从句的引导词与陈述语序', 1, 4, { bloom: '应用', weight: 5, tags: ['高频考点'] }),
    kp('eng8b-p9', 'eng8b-g2', '宾语从句的时态呼应', 2, 4, { bloom: '分析', weight: 4, tags: ['易错'], prereq: ['eng8b-p8'] }),
    kp('eng8b-g3', 'eng8b-g', '被动语态 ⭐', 3, 3),
    kp('eng8b-p10', 'eng8b-g3', '一般现在时与一般过去时的被动语态', 1, 4, { bloom: '应用', weight: 5, tags: ['高频考点'] }),
    kp('eng8b-p11', 'eng8b-g3', '含情态动词的被动语态', 2, 4, { bloom: '应用', weight: 4, prereq: ['eng8b-p10'] }),
    kp('eng8b-g4', 'eng8b-g', '过去完成时', 4, 3),
    kp('eng8b-p12', 'eng8b-g4', '过去完成时的构成与用法', 1, 4, { bloom: '应用', weight: 4 }),
    kp('eng8b-p13', 'eng8b-g4', '过去完成时与一般过去时的先后关系', 2, 4, { bloom: '分析', weight: 4, tags: ['易错'], prereq: ['eng8b-p12'] }),

    // ── 题型技能线 ──
    kp('eng8b-s', 'eng8b', '题型技能线', 3, 2),
    kp('eng8b-s1', 'eng8b-s', '阅读与完形', 1, 3),
    kp('eng8b-p14', 'eng8b-s1', '阅读理解：推理判断与词义猜测', 1, 4, { bloom: '分析', weight: 5, tags: ['高频考点'] }),
    kp('eng8b-s2', 'eng8b-s', '书面表达与听力', 2, 3),
    kp('eng8b-p15', 'eng8b-s2', '书面表达：连接词与篇章连贯', 1, 4, { bloom: '应用', weight: 4 }),
    kp('eng8b-p16', 'eng8b-s2', '听力：数字计算与信息转述', 2, 4, { bloom: '理解', weight: 3 }),
  ];

  const questions = [
    // ── p1 名词单复数与不规则变化 ──
    q('eng8a-p1-q1', 'eng8a-p1', 'single', 'There are three ______ in the box.',
      ['knife', 'knifes', 'knives', 'knifs'], 2,
      '以 -fe 结尾的名词变复数时改 f/fe 为 v 再加 -es：knife → knives。', 2, 45),
    q('eng8a-p1-q2', 'eng8a-p1', 'fill', '用括号内单词的正确形式填空：The ______ (child) are playing football on the playground.',
      [], 'children', 'child 的复数是 children，属不规则变化。', 2, 40),

    // ── p2 形容词与副词词形转换 ──
    q('eng8a-p2-q1', 'eng8a-p2', 'single', 'He speaks English very ______.',
      ['good', 'well', 'nice', 'fine'], 1,
      '修饰动词 speaks 要用副词 well；good / nice / fine 是形容词。', 2, 45),
    q('eng8a-p2-q2', 'eng8a-p2', 'fill', '用括号内单词的正确形式填空：She is ______ (real) interested in music.',
      [], 'really', '修饰形容词 interested 要用副词 really。', 2, 40),

    // ── p3 动词不规则过去式拼写 ──
    q('eng8a-p3-q1', 'eng8a-p3', 'single', 'Which of the following is the past tense of "buy"?',
      ['buyed', 'bought', 'boughted', 'boughten'], 1,
      'buy 是不规则动词，过去式和过去分词都是 bought。', 1, 35),
    q('eng8a-p3-q2', 'eng8a-p3', 'fill', '用括号内动词的适当形式填空：Last Sunday we ______ (go) to the museum.',
      [], 'went', 'Last Sunday 提示一般过去时，go 的过去式是 went。', 2, 40),

    // ── p4 易混词辨析 ──
    q('eng8a-p4-q1', 'eng8a-p4', 'single', 'Could you ______ me your pen? Mine is broken.',
      ['lend', 'borrow', 'keep', 'take'], 0,
      'lend sb sth 表示“把某物借出给某人”；borrow 是“借入”（borrow sth from sb）。', 2, 45),
    q('eng8a-p4-q2', 'eng8a-p4', 'judge', 'The sentence "Please say me the truth." is grammatically correct.',
      ['对', '错'], 1,
      'say 不能带“人”作宾语，应为 tell me the truth；say sth to sb 才用 say。', 2, 40),

    // ── p5 构词法 ──
    q('eng8a-p5-q1', 'eng8a-p5', 'fill', '用括号内单词的正确形式填空：His ______ (care) driving caused the accident.',
      [], 'careless', '修饰名词 driving 用形容词 careless（“粗心的”）。', 3, 45),
    q('eng8a-p5-q2', 'eng8a-p5', 'single', 'The word "unhappy" has a prefix "un-". What does "un-" mean?',
      ['very', 'not', 'again', 'before'], 1,
      'un- 是表否定的前缀，unhappy = not happy。', 1, 35),

    // ── p6 一般现在时第三人称单数 ──
    q('eng8a-p6-q1', 'eng8a-p6', 'single', 'My brother ______ to school by bike every day.',
      ['go', 'goes', 'going', 'went'], 1,
      'every day 提示一般现在时，主语 My brother 是第三人称单数，动词加 -es。', 1, 35),
    q('eng8a-p6-q2', 'eng8a-p6', 'fill', '用括号内动词的适当形式填空：The little girl ______ (watch) TV every evening.',
      [], 'watches', '主语为第三人称单数，以 -ch 结尾的动词加 -es。', 2, 40),

    // ── p7 频率副词 ──
    q('eng8a-p7-q1', 'eng8a-p7', 'single', 'Which sentence is correct?',
      ['He is always late for class.', 'He always is late for class.', 'Always he is late for class.', 'He is late always for class.'], 0,
      '频率副词放在 be 动词之后、实义动词之前。', 2, 45),
    q('eng8a-p7-q2', 'eng8a-p7', 'fill', '根据汉语提示补全句子（每空一词）：他上课从不迟到。He is ______ late for class.',
      [], 'never', '“从不”用频率副词 never，放在 be 动词之后。', 2, 40),

    // ── p8 比较级与最高级的构成 ──
    q('eng8a-p8-q1', 'eng8a-p8', 'single', 'This book is ______ than that one.',
      ['interesting', 'more interesting', 'most interesting', 'the most interesting'], 1,
      'than 提示比较级；interesting 是多音节词，前加 more。', 2, 45),
    q('eng8a-p8-q2', 'eng8a-p8', 'fill', '用括号内单词的正确形式填空：The Yangtze River is the ______ (long) river in China.',
      [], 'longest', 'in China 限定三者以上范围，用最高级 longest，且前面有 the。', 2, 40),

    // ── p9 比较级常用句型 ──
    q('eng8a-p9-q1', 'eng8a-p9', 'single', 'Tom is as ______ as his brother.',
      ['tall', 'taller', 'tallest', 'the tallest'], 0,
      'as ... as 结构中间用形容词或副词原级。', 2, 45),
    q('eng8a-p9-q2', 'eng8a-p9', 'single', 'Shanghai is one of ______ cities in China.',
      ['big', 'bigger', 'the biggest', 'biggest'], 2,
      'one of the + 最高级 + 复数名词，表示“最……的之一”。', 3, 50),

    // ── p10 过去进行时的构成与用法 ──
    q('eng8a-p10-q1', 'eng8a-p10', 'single', "At eight o'clock last night, I ______ my homework.",
      ['do', 'did', 'was doing', 'am doing'], 2,
      '过去某一时刻正在进行的动作用过去进行时 was/were + doing。', 2, 45),
    q('eng8a-p10-q2', 'eng8a-p10', 'fill', '用括号内动词的适当形式填空：They ______ (play) basketball at four yesterday afternoon.',
      [], 'were playing', '主语 They 为复数，过去进行时用 were + doing。', 2, 40),

    // ── p11 过去进行时与一般过去时的区别 ──
    q('eng8a-p11-q1', 'eng8a-p11', 'single', 'My father ______ TV when I got home.',
      ['watched', 'was watching', 'watches', 'has watched'], 1,
      'when 从句用一般过去时表示突然发生，主句用过去进行时表示当时正在进行。', 3, 50),
    q('eng8a-p11-q2', 'eng8a-p11', 'judge', 'In the sentence "While I was cooking, my sister was reading.", the two actions happened at the same time.',
      ['对', '错'], 0,
      'while 常连接两个同时进行的持续性动作，主从句都用过去进行时。', 3, 45),

    // ── p12 不定式作宾语与宾语补足语 ──
    q('eng8a-p12-q1', 'eng8a-p12', 'single', 'I want ______ a doctor when I grow up.',
      ['be', 'to be', 'being', 'been'], 1,
      'want to do sth，不定式作宾语。', 1, 35),
    q('eng8a-p12-q2', 'eng8a-p12', 'single', 'My mother asked me ______ the room.',
      ['clean', 'to clean', 'cleaning', 'cleaned'], 1,
      'ask sb to do sth，不定式作宾语补足语。', 2, 45),

    // ── p13 疑问词 + 不定式 ──
    q('eng8a-p13-q1', 'eng8a-p13', 'fill', '用括号内词的适当形式补全句子：I don\'t know what ______ (do) next.',
      [], 'to do', '“疑问词 + 不定式”可作宾语，what to do 意为“做什么”。', 2, 40),
    q('eng8a-p13-q2', 'eng8a-p13', 'single', 'Could you tell me how ______ to the station?',
      ['get', 'to get', 'getting', 'got'], 1,
      'how to get to ... 是“疑问词 + 不定式”结构，作 tell 的宾语。', 2, 45),

    // ── p14 情态动词表推测与许可 ──
    q('eng8a-p14-q1', 'eng8a-p14', 'single', "— Whose book is this? — It ______ be Lily's. Look, her name is on it.",
      ["can't", 'must', "needn't", "shouldn't"], 1,
      '有明确证据的肯定推测用 must（一定）；can\'t 表示“不可能”。', 3, 50),
    q('eng8a-p14-q2', 'eng8a-p14', 'judge', '"You mustn\'t smoke here." means smoking is not allowed here.',
      ['对', '错'], 0,
      'mustn\'t 表示“禁止、不允许”。', 2, 40),

    // ── p15 must 与 have to 的区别 ──
    q('eng8a-p15-q1', 'eng8a-p15', 'single', 'Tomorrow is Saturday, so I ______ get up early.',
      ["don't have to", "mustn't", "can't", "needn't to"], 0,
      'don\'t have to 表示“不必”，符合周六不用早起；mustn\'t 是“禁止”。', 3, 50),
    q('eng8a-p15-q2', 'eng8a-p15', 'single', '— Must I hand in the homework today? — No, you ______.',
      ["mustn't", "needn't", "can't", "shouldn't"], 1,
      'must 引导的疑问句否定回答用 needn\'t / don\'t have to，不能用 mustn\'t。', 3, 50),

    // ── p16 条件状语从句 ──
    q('eng8a-p16-q1', 'eng8a-p16', 'single', 'If it ______ tomorrow, we will stay at home.',
      ['rains', 'will rain', 'rained', 'is raining'], 0,
      'if 引导的条件状语从句用一般现在时表将来，主句用一般将来时（主将从现）。', 3, 50),
    q('eng8a-p16-q2', 'eng8a-p16', 'fill', '用括号内动词的适当形式填空：We ______ (go) to the park if the weather is fine tomorrow.',
      [], 'will go', '条件从句用一般现在时，主句用一般将来时 will + 动词原形。', 3, 45),

    // ── p17 完形填空 ──
    q('eng8a-p17-q1', 'eng8a-p17', 'single', 'Tom studied hard for the exam. ______, he got the best grade in his class.',
      ['However', 'As a result', 'In fact', 'Instead'], 1,
      '前句是原因、后句是结果，用 As a result 承接。', 3, 50),
    q('eng8a-p17-q2', 'eng8a-p17', 'single', 'I wanted to buy the book, ______ it was too expensive.',
      ['but', 'so', 'because', 'or'], 0,
      '前后为转折关系，用并列连词 but。', 2, 45),

    // ── p18 阅读理解 ──
    q('eng8a-p18-q1', 'eng8a-p18', 'single', '阅读短文回答问题：Tom gets up at six, runs for twenty minutes, and then has breakfast. He goes to school at seven. What does Tom do first after getting up?',
      ['He runs.', 'He has breakfast.', 'He goes to school.', 'He does his homework.'], 0,
      '短文顺序为起床 → 跑步 → 吃早饭 → 上学，起床后第一件事是跑步。', 2, 45),
    q('eng8a-p18-q2', 'eng8a-p18', 'single', '阅读短文归纳主旨：Last Sunday my family went to the beach. We swam, played beach volleyball and had a picnic. We had a great time. What is the main idea of the passage?',
      ['How to swim in the sea.', 'A happy family trip to the beach.', 'Why the beach is dangerous.', 'How to make a picnic.'], 1,
      '全文围绕上周日全家去海滩的一天及愉快感受展开，主旨是“一次愉快的家庭海滩之旅”。', 3, 50),

    // ── p19 书面表达：时态与人称一致 ──
    q('eng8a-p19-q1', 'eng8a-p19', 'judge', 'In a diary about yesterday\'s trip, the sentence "We visit the Great Wall and take many photos." is correct.',
      ['对', '错'], 1,
      '描述昨天发生的事应用一般过去时：We visited ... and took many photos。', 3, 45),
    q('eng8a-p19-q2', 'eng8a-p19', 'single', 'Mary is my best friend. ______ often helps me with my English.',
      ['She', 'He', 'It', 'They'], 0,
      'Mary 是女性，指代要用 She，与主语人称保持一致。', 1, 35),

    // ── p20 听力信息抓取 ──
    q('eng8a-p20-q1', 'eng8a-p20', 'single', '你听到：The train leaves at a quarter to nine. When does the train leave?',
      ['8:45', '9:15', '9:45', '8:15'], 0,
      'a quarter to nine = 差一刻九点 = 8:45。', 2, 45),
    q('eng8a-p20-q2', 'eng8a-p20', 'single', '你听到：It\'s 15 yuan for adults and half price for children. How much should a child pay?',
      ['15 yuan', '10 yuan', '7.5 yuan', '5 yuan'], 2,
      '儿童半价：15 ÷ 2 = 7.5 元。', 2, 45),

    // ── eng8b-p1 名词、代词与数词 ──
    q('eng8b-p1-q1', 'eng8b-p1', 'single', 'There are ______ students in our school.',
      ['two hundreds', 'two hundred', 'two hundreds of', 'hundred of'], 1,
      'hundred 前有具体数字时用单数，且不加 of。', 2, 45),
    q('eng8b-p1-q2', 'eng8b-p1', 'fill', '用括号内单词的正确形式填空：These books are ______ (we), not theirs.',
      [], 'ours', '名词性物主代词 ours = our books，此处作表语。', 2, 40),

    // ── eng8b-p2 动词短语搭配 ──
    q('eng8b-p2-q1', 'eng8b-p2', 'single', 'Please ______ your books and open to page 20.',
      ['take out', 'take off', 'take away', 'take up'], 0,
      'take out 拿出；take off 脱下/起飞；take away 拿走；take up 开始从事/占据。', 3, 50),
    q('eng8b-p2-q2', 'eng8b-p2', 'fill', '根据汉语完成句子（每空一词）：别忘了关灯。Don\'t forget to ______ ______ the lights.',
      [], 'turn off', 'turn off 表示“关掉（电器、灯）”。', 2, 40),

    // ── eng8b-p3 形容词 -ed / -ing 与副词扩展 ──
    q('eng8b-p3-q1', 'eng8b-p3', 'single', 'The story is ______. I am ______ in it.',
      ['interesting; interesting', 'interested; interested', 'interesting; interested', 'interested; interesting'], 2,
      '-ing 形容词修饰事物（令人……的），-ed 形容词修饰人的感受。', 2, 45),
    q('eng8b-p3-q2', 'eng8b-p3', 'fill', '用括号内单词的正确形式填空：He looked ______ (happy) at his new bike.',
      [], 'happily', '修饰动词 looked 要用副词 happily。', 3, 45),

    // ── eng8b-p4 现在完成时的构成 ──
    q('eng8b-p4-q1', 'eng8b-p4', 'single', 'I ______ already ______ my homework.',
      ['have; finished', 'has; finished', 'have; finish', 'am; finishing'], 0,
      '主语 I 用 have，already 之后的动词用过去分词 finished。', 2, 45),
    q('eng8b-p4-q2', 'eng8b-p4', 'fill', '用括号内动词的适当形式填空：She ______ (live) in Beijing for ten years.',
      [], 'has lived', 'for ten years 表示持续到现在，用现在完成时 has + 过去分词。', 3, 45),

    // ── eng8b-p5 现在完成时与一般过去时的区别 ──
    q('eng8b-p5-q1', 'eng8b-p5', 'single', 'I ______ my keys yesterday, but now I ______ them.',
      ['lost; have found', 'have lost; found', 'lost; found', 'have lost; have found'], 0,
      'yesterday 是具体过去时间，用一般过去时；now 强调对现在的影响，用现在完成时。', 3, 50),
    q('eng8b-p5-q2', 'eng8b-p5', 'judge', 'The sentence "I have seen that film last week." is grammatically correct.',
      ['对', '错'], 1,
      'last week 是明确的过去时间状语，只能与一般过去时连用：I saw that film last week。', 3, 45),

    // ── eng8b-p6 already / yet / ever / never / just 的位置 ──
    q('eng8b-p6-q1', 'eng8b-p6', 'single', 'Have you ______ been to the Great Wall?',
      ['ever', 'yet', 'already', 'never'], 0,
      'ever 用于疑问句，表示“曾经”，位于过去分词之前。', 2, 45),
    q('eng8b-p6-q2', 'eng8b-p6', 'fill', '补全句子（每空一词）：I have ______ finished my homework, so I can play now.（表示“刚刚”）',
      [], 'just', 'just 表示“刚刚”，位于 have 与过去分词之间。', 2, 40),

    // ── eng8b-p7 延续性动词与瞬间动词 ──
    q('eng8b-p7-q1', 'eng8b-p7', 'single', 'My grandfather ______ for three years.',
      ['has died', 'died', 'has been dead', 'was dead'], 2,
      'die 是瞬间动词，与 for + 时间段连用时要换成延续性的 be dead。', 3, 50),
    q('eng8b-p7-q2', 'eng8b-p7', 'fill', '用 since 或 for 填空：He has taught in this school ______ 2008.',
      [], 'since', 'since 后接时间点，for 后接时间段；2008 是时间点。', 3, 45),

    // ── eng8b-p8 宾语从句的引导词与陈述语序 ──
    q('eng8b-p8-q1', 'eng8b-p8', 'single', 'Could you tell me ______?',
      ['where is the bank', 'where the bank is', 'where was the bank', 'the bank where is'], 1,
      '宾语从句必须用陈述语序，即“引导词 + 主语 + 谓语”。', 3, 50),
    q('eng8b-p8-q2', 'eng8b-p8', 'fill', '把两句合并为含宾语从句的句子：Where does he live? → I want to know ______ ______ ______.',
      [], 'where he lives', '宾语从句用陈述语序且主句为现在时，从句时态不变。', 3, 45),

    // ── eng8b-p9 宾语从句的时态呼应 ──
    q('eng8b-p9-q1', 'eng8b-p9', 'single', 'He said that he ______ busy at that time.',
      ['is', 'was', 'has been', 'will be'], 1,
      '主句是过去时 said，宾语从句要用相应的过去时态，at that time 提示 was。', 3, 50),
    q('eng8b-p9-q2', 'eng8b-p9', 'judge', 'In the sentence "She says she will come tomorrow.", the object clause "she will come" is correct.',
      ['对', '错'], 0,
      '主句为一般现在时 says 时，宾语从句按需要可用将来时。', 3, 45),

    // ── eng8b-p10 被动语态 ──
    q('eng8b-p10-q1', 'eng8b-p10', 'single', 'The classroom ______ every day.',
      ['cleans', 'is cleaned', 'cleaned', 'is cleaning'], 1,
      '教室是被打扫，主语与动词是被动关系；一般现在时被动语态为 am/is/are + 过去分词。', 2, 45),
    q('eng8b-p10-q2', 'eng8b-p10', 'fill', '用括号内动词的适当形式填空：The bridge ______ (build) in 1998.',
      [], 'was built', 'in 1998 提示一般过去时，桥是被建造，用 was + 过去分词。', 3, 45),

    // ── eng8b-p11 含情态动词的被动语态 ──
    q('eng8b-p11-q1', 'eng8b-p11', 'single', 'The homework must ______ before Friday.',
      ['finish', 'be finished', 'finished', 'be finishing'], 1,
      '情态动词的被动语态结构为 情态动词 + be + 过去分词。', 3, 50),
    q('eng8b-p11-q2', 'eng8b-p11', 'single', 'The trees should be ______ twice a week.',
      ['water', 'watered', 'watering', 'waters'], 1,
      'should be + 过去分词，water 的过去分词是 watered。', 3, 50),

    // ── eng8b-p12 过去完成时的构成与用法 ──
    q('eng8b-p12-q1', 'eng8b-p12', 'single', 'When I arrived at the cinema, the film ______ already ______.',
      ['has; begun', 'had; begun', 'have; begun', 'was; beginning'], 1,
      '电影开始发生在“我到达”之前，即“过去的过去”，用过去完成时 had + 过去分词。', 3, 50),
    q('eng8b-p12-q2', 'eng8b-p12', 'fill', '用括号内动词的适当形式填空：By the time he got home, his mother ______ (cook) dinner.',
      [], 'had cooked', 'by the time 引导的从句用过去时，主句动作更早，用过去完成时。', 3, 45),

    // ── eng8b-p13 过去完成时与一般过去时的先后关系 ──
    q('eng8b-p13-q1', 'eng8b-p13', 'single', 'She ______ her homework before her mother ______ home.',
      ['finished; came', 'had finished; came', 'has finished; came', 'finished; had come'], 1,
      '先完成的动作用过去完成时，后发生的用一般过去时。', 3, 50),
    q('eng8b-p13-q2', 'eng8b-p13', 'judge', '过去完成时表示的动作发生在过去某一时间或某一动作之前，即“过去的过去”。',
      ['对', '错'], 0,
      '这是过去完成时的基本定义，常用 before / by the time 等标记先后顺序。', 2, 40),

    // ── eng8b-p14 阅读理解：推理判断与词义猜测 ──
    q('eng8b-p14-q1', 'eng8b-p14', 'single', '阅读短文并推断：Lucy looked out of the window and sighed. "It\'s raining again," she said. "We can\'t have the sports meeting today." How did Lucy feel?',
      ['Excited', 'Disappointed', 'Angry', 'Tired'], 1,
      'sighed 与“又下雨、不能开运动会”说明她因计划落空而失望。', 3, 50),
    q('eng8b-p14-q2', 'eng8b-p14', 'single', '根据上下文猜测词义：A vegetarian is a person who does not eat any meat. What does "vegetarian" mean?',
      ['a person who eats only meat', 'a person who does not eat meat', 'a person who cooks meat', 'a person who sells meat'], 1,
      '由定语从句 “who does not eat any meat” 可直接判断词义。', 2, 45),

    // ── eng8b-p15 书面表达：连接词与篇章连贯 ──
    q('eng8b-p15-q1', 'eng8b-p15', 'single', 'Which is the most suitable beginning for a letter to a pen friend?',
      ['Dear Tom,', 'Hello everyone,', 'My name Tom.', 'Thank you for your letter, Tom,'], 0,
      '书信的标准称呼是 Dear + 名字 + 逗号。', 2, 45),
    q('eng8b-p15-q2', 'eng8b-p15', 'single', 'I like my hometown. ______, the air there is fresh and the people are friendly.',
      ['For example', 'However', 'In my opinion', 'At last'], 0,
      '后句是前句的具体例证，用 For example 使篇章连贯。', 3, 50),

    // ── eng8b-p16 听力：数字计算与信息转述 ──
    q('eng8b-p16-q1', 'eng8b-p16', 'single', '你听到：Our flight takes off at 7:30 p.m. and we should arrive at the airport two hours earlier. When should we get to the airport?',
      ['5:30 p.m.', '7:30 p.m.', '9:30 p.m.', '6:30 a.m.'], 0,
      '7:30 提前两小时 = 5:30 p.m.。', 3, 50),
    q('eng8b-p16-q2', 'eng8b-p16', 'single', '你听到：I have three brothers and one sister. How many sisters does the speaker have?',
      ['One', 'Two', 'Three', 'Four'], 0,
      '听力原文直接给出 one sister。', 1, 35),
  ];

        const lessons = {
    'eng8a-p1': [
        {
          'version': 1,
          'oneLiner': '先加 s，再看词尾加 es；有几个词整个换名字，只能背。',
          'problem': '名词复数是单选、完形和作文里都会碰到的基础点。规则变化好推，不规则变化只能记，两者混在一起时最容易丢分。',
          'analogy': '搭乐高时，普通零件要三个，就在名字后面加个 s：brick 变 bricks。但有几块是特殊件，名字整个换：小人一个叫 child，一堆叫 children，不叫 childs。特殊件没有规律，只能一个个记住。',
          'example': 'one book 变 two books，直接加 s。one box 变 two boxes，s、x、ch、sh 结尾加 es。one knife 变 two knives，-fe 改 v 再加 es。one child 变 two children，不规则，只能背。',
          'pitfalls': [
            '以 s、x、ch、sh 结尾的词是加 es，不是只加 s：box 变 boxes，watch 变 watches',
            '辅音字母加 y 结尾才把 y 变 i 再加 es：baby 变 babies；元音字母加 y 直接加 s：boy 变 boys',
            '不规则变化只能背：child 变 children，man 变 men，tooth 变 teeth，foot 变 feet；sheep、fish 单复数同形'
          ],
          'check': [
            {
              'stem': 'Tom fell off his bike and lost two ______.',
              'options': [
                'tooth',
                'tooths',
                'teeth',
                'teeths'
              ],
              'answer': 2,
              'explanation': 'two 后面要复数，tooth 属不规则变化，复数是 teeth。'
            },
            {
              'stem': 'The farmer keeps many ______ on the hill.',
              'options': [
                'sheeps',
                'sheep',
                'sheepes',
                'sheeve'
              ],
              'answer': 1,
              'explanation': 'many 后面接复数，sheep 单复数同形，不用加 s。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '一个叫单数，两个以上要变身：大多加 s，少数整个换名。',
          'problem': '「我写 one apple 还行，一到 three、many、a lot of 后面就懵：到底加 s、加 es，还是整个词换掉，全靠感觉写，经常翻车。」',
          'analogy': '像点外卖加餐：想多要一份，就在后面按个 +s，brick 就变 bricks。但有几样是固定套餐，名字整个换，child 点三份不写 childs，写 children。还有几家店更怪，点一份和点五份名字长得一模一样，像 sheep，怎么点都不加 s，只能单独记住。',
          'example': '1 bus → 2 buses（-s 结尾加 es）；1 day → 2 days（元音加 y 直接加 s）；1 leaf → 3 leaves（-f 变 v 再加 es）；1 man → 2 men（整个换名字）。',
          'pitfalls': [
            '看到 three、many、a lot of 在后面，先在心里提醒一句「这里要复数」，再动手写，别顺手只加个 s 就交卷。',
            'leaf、knife 这类 -f / -fe 结尾的，写成 leafs、knifes 容易丢分，改成 v 再加 es 会稳一点。',
            'child、man、tooth 这几个是整个换名字的，不按常规加 s，可以单独列在小纸条上，考前扫一眼。'
          ],
          'check': [
            {
              'stem': 'Mum, can I borrow two ______ to cut the cake?',
              'options': [
                'knifes',
                'knife',
                'knives',
                'knifs'
              ],
              'answer': 2,
              'explanation': 'two 后面要复数，knife 以 -fe 结尾，改 v 再加 es 变成 knives。'
            },
            {
              'stem': 'Look, those ______ are flying kites over there.',
              'options': [
                'child',
                'childs',
                'childes',
                'children'
              ],
              'answer': 3,
              'explanation': 'those 后面接复数，child 属不规则变化，复数是 children。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p10': [
        {
          'version': 1,
          'oneLiner': '过去进行时 = was/were + doing，表示过去某一时刻正在做的事。',
          'problem': '和一般过去时打架：一件事“做了”用 did，一件事“当时正在做”才用 was/were doing。判断标准是“有没有一个正在进行的时刻”。',
          'analogy': '像看录像暂停画面：过去进行时是按下暂停键的那一帧（正在做）；一般过去时是按下拍摄键记录下来的完整动作（做完了）。',
          'example': 'At eight o\'clock last night, I was doing my homework.（八点那一刻正在做）／ I did my homework last night.（昨晚做了，已完成）',
          'pitfalls': [
            '主语是 I/he/she/it 用 was，you/we/they 用 were',
            '时间状语常见：at this time yesterday、at 8 last night、when / while 从句',
            '瞬间动词（如 knock、ring）一般不用过去进行时，除非强调过程'
          ],
          'check': [
            {
              'stem': 'At eight o\'clock last night, I ______ my homework.',
              'options': [
                'do',
                'did',
                'was doing',
                'am doing'
              ],
              'answer': 2,
              'explanation': '“昨晚八点”是一个过去时刻，用过去进行时。'
            },
            {
              'stem': '用括号内动词的适当形式填空：They ______ (play) basketball at four yesterday afternoon.',
              'options': [
                'played',
                'were playing',
                'are playing',
                'play'
              ],
              'answer': 1,
              'explanation': '主语 They 为复数，用 were + playing。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '一句话口诀：正在做选 doing，做完了选 did。',
          'problem': '同一句里同时出现 when / while 和两个动词时最容易懵。记住分工：when 从句多写 did（突然插进来的事），主句多写 was/were doing（原本正在做的事）。',
          'analogy': '像拍电影：主句是长镜头（正在进行的背景画面），when 从句是突然闯入的画面（一声铃响、有人进门）。长镜头用进行时，闯入的画面用一般过去时。',
          'example': 'I was reading a book when the phone rang.（我正在看书 → 长镜头；电话响了 → 闯入）／ While I was cooking, my sister was reading.（两个长镜头同时进行）',
          'pitfalls': [
            'when 后接短暂动作（一般过去时），while 后接持续动作（过去进行时）',
            '两个动作同时进行时，主从句都可以用过去进行时（while 连接）',
            '“was doing” 不能表示“做完了”，要表示完成必须用 did 或 had done'
          ],
          'check': [
            {
              'stem': 'My father ______ TV when I got home.',
              'options': [
                'watched',
                'was watching',
                'watches',
                'has watched'
              ],
              'answer': 1,
              'explanation': 'when 从句表示突然发生，主句用过去进行时表正在进行。'
            },
            {
              'stem': 'In the sentence "While I was cooking, my sister was reading.", the two actions happened ______.',
              'options': [
                'one after another',
                'at the same time',
                'in the future',
                'just now'
              ],
              'answer': 1,
              'explanation': 'while 连接两个同时进行的持续性动作，都用过去进行时。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p11': [
        {
          'version': 1,
          'oneLiner': 'when 接打断，while 接同时，正在做用 was doing。',
          'problem': '这题考的是两个过去动作的关系：哪个是当时正在做的背景，哪个是突然插进来的。选择题里 when 和 while 常混，完形和短文填空也爱考，分水岭就是先判断谁打断谁。',
          'analogy': '像打球时你正在运球上篮（was doing），突然有人喊暂停（did）。when 就是那个喊暂停的瞬间，它一来，你原本的动作被打断。while 是两个人同时在场上各练各的：你在投篮，他在抢板，两条线一起走。先分清是“被打断”还是“同时进行”。',
          'example': '比如：I was doing my homework when my phone rang. 我做作业是当时正在做的，电话响是突然发生的，所以 was doing 配 rang。再看 While I was doing homework, my brother was playing games. 两件事同时进行，while 后面和主句都用 was doing。',
          'pitfalls': [
            'when 从句常用一般过去时表示突然发生，主句用过去进行时表示当时正在进行，别把两个都写成一般过去时。',
            'while 强调两个动作同时进行时，前后常用过去进行时，不要只给一边用 was doing。',
            '先看动作长短和打断关系，再选 when 或 while，不要只凭“when 就选过去式、while 就选进行时”的机械口诀。'
          ],
          'check': [
            {
              'stem': 'I ______ football when it started to rain.',
              'options': [
                'played',
                'was playing',
                'play',
                'have played'
              ],
              'answer': 1,
              'explanation': '雨开始下是突然打断，踢球是当时正在进行，所以用 was playing。'
            },
            {
              'stem': 'While my mother ______ dinner, I was doing my homework.',
              'options': [
                'cooked',
                'cooks',
                'was cooking',
                'has cooked'
              ],
              'answer': 2,
              'explanation': 'while 连接两个同时进行的动作，前后都用过去进行时，所以选 was cooking。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': 'when 后面常是插进来的那一下，while 是两条线并排跑。',
          'problem': '我一看 when 和 while 挨着出现就懵：哪边该 was doing，哪边用 did？两个动作在脑子里打成一团，最后全靠猜。',
          'analogy': '把句子当成外卖单来读。你正骑车在送单路上（was doing），这是当时的背景；半路系统突然弹出一个「客户取消」的通知（did），一下把你打断——这种半路冒出来的通知，通常挂在 when 后面。while 是另一个画面：你手上 1 单在跑，室友手上也有 1 单在跑，两条路线同时走，谁也没打断谁，所以两边都能用 was doing。看句子先问自己：这是「被通知打断」，还是「两条线并行」。',
          'example': '用 1、2 两个小数字就能试：I was eating when the bell rang.——吃是 1 条正在走的线（was eating），铃响 1 下是插播（rang）。再看 While I was eating, my brother was playing.——这是 2 条线同时走，两边都 keep was doing。',
          'pitfalls': [
            'when 后面常跟那一下突然发生的动作（did），主句才是 was doing，两边都写成 did 的话句子的画面就散了。',
            'while 一般管两件同时进行的事，两边都写成 was doing 更稳；只给一边加 was，容易在完形里被挖空。',
            '做题时先在心里问一句「这是打断还是并行」，再决定 when / while，一看到 when 就条件反射选过去式比较容易翻车。'
          ],
          'check': [
            {
              'stem': 'My sister ______ snacks when the doorbell rang.',
              'options': [
                'eats',
                'ate',
                'was eating',
                'has eaten'
              ],
              'answer': 2,
              'explanation': '门铃响是半路插进来的那一下，吃零食是当时正在做，所以用 was eating。'
            },
            {
              'stem': '下面哪句写法没问题？',
              'options': [
                'While I did my homework, my brother was playing games.',
                'While I was doing my homework, my brother was playing games.',
                'While I was doing my homework, my brother plays games.',
                'While I do my homework, my brother was playing games.'
              ],
              'answer': 1,
              'explanation': 'while 管两件同时进行的事，两边都保持过去进行时最稳。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p12': [
        {
          'version': 1,
          'oneLiner': '先看动词后有没有人，再定 to do 是宾语还是宾补。',
          'problem': '不定式作宾语还是宾补容易混。看到 want、ask 这类词，先看后面有没有人：没人，to do 是宾语；有人，to do 是补足那个人的动作。单选和语法填空常考。',
          'analogy': '像打游戏开黑。你想上分，说 I want to play，to play 是你要做的动作，跟在 want 后面当宾语。你叫同桌一起，说 I ask him to play，him 先出现，to play 补足 him 的动作，就是宾语补足语。',
          'example': 'I want to win. want 后面没有人，to win 是 want 的宾语。Dad asks me to win. asks 后面有 me，to win 是 me 要做的动作，作宾语补足语。',
          'pitfalls': [
            'want、hope、decide 后面直接跟 to do，不要写成 do 或 doing',
            'ask、tell 后面要接“人 + to do”，人不能丢，to 也不能丢',
            '否定意思用 not to do，不要写成 don\'t do'
          ],
          'check': [
            {
              'stem': 'I hope ______ my favourite team win.',
              'options': [
                'see',
                'to see',
                'seeing',
                'saw'
              ],
              'answer': 1,
              'explanation': 'hope 后接 to do，to see 作宾语。'
            },
            {
              'stem': 'Our teacher told us ______ quiet in the library.',
              'options': [
                'keep',
                'keeping',
                'to keep',
                'kept'
              ],
              'answer': 2,
              'explanation': 'tell sb to do，to keep 是 us 的动作，作宾语补足语。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': 'to do 像快递：没人签收就是宾语，有人签收就是补那个人。',
          'problem': '我看到 want、ask 后面挂个 to do，我就懵：这 to do 到底算宾语还是算宾补？做题全靠手感，一选就歪。',
          'analogy': '把它当外卖配送。你在手机上点单：I want to eat——订单后面直接挂着一份餐，这份 to eat 就是订单自己要的东西，是宾语。你顺手帮同桌也点一份：I ask him to eat——订单后面先写收件人 him，再挂那份餐 to eat，这份餐是专门给 him 的，属于宾语补足语。规律就一句：单子后面先出现收件人，to do 就是补他的；直接从动词后面挂货，to do 就是动词自己的宾语。',
          'example': 'I want to get 2 snacks. want 后面没写人，to get 被 want 自己收下，作宾语。Mom asks me to get 1 egg. asks 后面先来了 me，to get 是 me 要干的活，作宾语补足语。',
          'pitfalls': [
            'ask、tell 后面要先摆人再摆 to do，人一漏，意思就跑偏：I ask to clean 听起来像你在请求自己去打扫。',
            'to do 里的 to 后面永远跟动词原形，写成 doing、did 都换成了别的结构，宾语和宾补都一样。',
            'let、make 后面接人时，人后面直接跟 do，to 会当场消失：make him go，不是 make him to go。'
          ],
          'check': [
            {
              'stem': 'I\'d like ______ 2 tickets for the match.',
              'options': [
                'book',
                'to book',
                'booking',
                'booked'
              ],
              'answer': 1,
              'explanation': 'would like 后面直接接 to do，to book 是它自己的宾语。'
            },
            {
              'stem': 'Our neighbour asked us ______ the parcel.',
              'options': [
                'take',
                'taking',
                'to take',
                'took'
              ],
              'answer': 2,
              'explanation': 'ask sb to do，to take 是 us 要做的动作，作宾语补足语。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p13': [
        {
          'version': 1,
          'oneLiner': '疑问词加 to 加动词原形，拼成一整块，直接当宾语。',
          'problem': '考试里常考在 know、tell、ask 后面填这一块。这题确实绕：一句话里要同时安排“问什么”和“干什么”两件事，还得把主语和助动词全部清掉。',
          'analogy': '像打游戏开语音报点：“怎么走”“打哪个”“几点开”。“怎么”“哪个”“几点”是钩子，后面必须挂上动作才成立。钩子加动作拼成一整块，能整块塞进 I don\'t know ___ 里，不用再搭一个从句。',
          'example': '手里 3 块钱，不知道买什么：I don\'t know what to buy. 不知道几点开始：Tell me when to start. 不知道去哪：I don\'t know where to go. 三句都是 疑问词 + to + 动词原形，整块放在动词后面当宾语。',
          'pitfalls': [
            '疑问词后面是 to 加动词原形，to 不能丢，也不能写成 what do、what doing',
            '这一块里不能再出现主语和助动词，how do I get 这种写法是把它当成从句了',
            'what 和 how 别混：问做什么用 what to do，问怎么做用 how to do it'
          ],
          'check': [
            {
              'stem': 'My mum told me ______ the tickets.',
              'options': [
                'where buy',
                'where to buy',
                'where buying',
                'where do buy'
              ],
              'answer': 1,
              'explanation': 'tell 后面接“疑问词 + to + 动词原形”，to 不能丢。'
            },
            {
              'stem': 'There are three bikes. He can\'t decide ______.',
              'options': [
                'which one buy',
                'which one buying',
                'which one to buy',
                'which one does buy'
              ],
              'answer': 2,
              'explanation': '这一块里不能再塞助动词，直接用 which one to buy。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '问的事和做的事，用 to 焊成一块，中间不站主语。',
          'problem': '我一看到 I don\'t know ______ 就想往后塞一整句，写到一半发现主语、助动词没地方摆，位置全乱了，就懵了。',
          'analogy': '像拼乐高：疑问词是一块小件（what、where、how、when 随便挑），to 是那块连接件，动词原形是第三块。三块咔哒一下卡成一整块模块，你把它整个按进 I don\'t know ___ 那个插槽就行，不用在旁边再搭一个带主语的架子。',
          'example': '手上有 2 个快递，不知道先拆哪个：I don\'t know which one to open. 兜里剩 1 块钱，不知道拿它干嘛：I don\'t know what to do with it. 投进 0 个球，还想问怎么投：Could you tell me how to shoot? 三处都是一整块：疑问词打头，to 加原形收尾。',
          'pitfalls': [
            'to 这块连接件容易掉：写成 what do next 就散架了，落笔前先瞄一眼 to 在不在。',
            '这一块里如果塞进主语或助动词（how do I get），它就变成另一个结构了；遇到只有一个空，用疑问词 + to + 原形更稳。',
            'what 和 how 分工要分清：问“做哪件事”走 what to do，问“用什么办法”走 how to do it，看看空格后面缺的是动作还是方式。'
          ],
          'check': [
            {
              'stem': 'He can\'t decide which bus ______.',
              'options': [
                'to take',
                'take',
                'taking',
                'takes'
              ],
              'answer': 0,
              'explanation': 'decide 后面整块接上疑问词 + to + 动词原形，to 不能少。'
            },
            {
              'stem': 'Do you know ______ this word?',
              'options': [
                'how spell',
                'how to spell',
                'how spelling',
                'how do spell'
              ],
              'answer': 1,
              'explanation': '一个空里只放一整块，疑问词后面跟 to 加原形，不要再加助动词或 ing。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p14': [
        {
          'version': 1,
          'oneLiner': '证据硬用 must，说不通用 can\'t，拿不准用 may。',
          'problem': '八上 M10–M12 的高频考点。选择填空常给一句线索句，让你在 must、can\'t、may 里挑一个；判断题爱考 mustn\'t 表示“禁止、不允许”。丢分多半是没先看证据强弱就动手选。',
          'analogy': '像打游戏判断草丛里有没有人。小地图上有红点、又听到脚步，那一定是（must be）；什么动静都没有、对面还照常走位，那不可能（can\'t be）；只听到一点点声音，那可能是（may be / might be）。证据多硬，选的词就多硬。',
          'example': 'This pen must be Lily\'s. Her name is on it.（名字就是证据，用 must）That bag can\'t be hers — hers is red.（反着说，用 can\'t）She may be in the library.（只是猜，用 may）许可那边：May I go now? 是问可不可以；You mustn\'t run here. 是说不许。',
          'pitfalls': [
            'must be 是“一定是”，别读成“必须”；must 后面直接跟动词原形，不加 to。',
            'can\'t be 是“不可能”，属于推测；mustn\'t 是“禁止”，属于规矩。看到哪个词，就往哪边想。',
            'may be 是两个词，意思是“可能是”；maybe 是一个词，意思是“也许”。He may be at home. / Maybe he is at home. 位置别放错。'
          ],
          'check': [
            {
              'stem': '— Whose basketball is this? — It ______ be Jack\'s. He is the only one in our class with a ball like this.',
              'options': [
                'must',
                'can\'t',
                'may',
                'mustn\'t'
              ],
              'answer': 0,
              'explanation': '全班只有他有这种球，证据很硬，肯定推测用 must be。'
            },
            {
              'stem': '— ______ I take a photo here? — Yes, you can.',
              'options': [
                'Must',
                'May',
                'Mustn\'t',
                'Can\'t'
              ],
              'answer': 1,
              'explanation': '问“我可以……吗”用 May I 或 Can I，答语 Yes, you can 就是给了许可。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '抓现行说 must，能证明没干说 can\'t，只是怀疑说 may。',
          'problem': '选项里 must、can\'t、may、mustn\'t 一摆出来，我就懵——感觉哪个读着都通。有时候句子明明在说「不许」，我按「不可能」去理解；问我为啥选它，我也说不清。多半是先凭语感挑，再回头找理由。',
          'analogy': '像等外卖。打开 App 看状态：显示「骑手已到楼下」——那一定到了（must be）；显示「骑手还在 3 公里外」——那不可能这会儿到（can\'t be）；只显示「商家刚接单」——那可能还在路上（may be / might be）。状态写得越死，词就越硬。许可是另一条线，像小区门卫：「我能进吗？」问的是 May I / Can I；「这儿不许进」说的是 You mustn\'t。',
          'example': '线索 0 条 → She may be in the classroom.（只是可能）\n线索 1 个铁证（桌上放着她的水杯）→ It must be hers.（一定）\n反过来 1 个矛盾（她今天穿白鞋，这双是黑的）→ It can\'t be her.（不可能）\n许可：May I use your pen?（问一句）You mustn\'t eat here.（不许）',
          'pitfalls': [
            'must 一个词两副面孔：猜的时候是「一定」，定规矩的时候是「必须」。下笔前先确认一句：这句是在猜，还是在立规矩。',
            'can\'t be 在猜（「不可能是」），mustn\'t 在管（「不许」）。两个都带否定味，混起来就会把「禁止」读成「不可能」。',
            'May I / Can I 问许可，答语一般还是 can（Yes, you can. / No, you can\'t.）；另外 may be 是两个词「可能是」，maybe 是一个词「也许」，中间就差一个空格，位置别放错。'
          ],
          'check': [
            {
              'stem': '— Is this Lily\'s notebook? — It ______ be hers. Hers is blue, and this one is red.',
              'options': [
                'must',
                'can\'t',
                'may',
                'mustn\'t'
              ],
              'answer': 1,
              'explanation': '颜色对不上就是反面证据，反向推测用 can\'t be（不可能是她的）。'
            },
            {
              'stem': '地铁里贴着「You mustn\'t take photos here.」，这句话是说：',
              'options': [
                '这里可以拍照',
                '这里必须拍照',
                '这里不许拍照',
                '这里不可能在拍照'
              ],
              'answer': 2,
              'explanation': 'mustn\'t 表示禁止、不允许，意思是「不许拍照」。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p15': [
        {
          'version': 1,
          'oneLiner': 'must 是自己要，have to 是外面逼，否定别用错',
          'problem': 'must 和 have to 都译成“必须”，但否定意思差很远：don\'t have to 是“不必”，mustn\'t 是“禁止”。选择题和同义句改写常在这里设坑，属于高频易错点。',
          'analogy': '像球队两条规矩：must 是队长自己定的，比如“我今天必须练投篮”；have to 是教练定的，比如“今天必须跑十圈”。教练的规矩取消了，你就不用跑（don\'t have to）；自己定的“不许迟到”是禁止（mustn\'t）。',
          'example': 'I must finish it tonight.（自己想）I have to get up at 6.（学校定）Must I go? No, you needn\'t.（不必）You mustn\'t play here.（禁止）',
          'pitfalls': [
            'don\'t have to 是“不必”，mustn\'t 是“禁止”，两者意思相反，不能互换',
            'Must I...? 的否定回答用 No, I needn\'t / don\'t have to，不能用 mustn\'t',
            'have to 有人称和时态变化：has to、had to、will have to；must 没有这些变化'
          ],
          'check': [
            {
              'stem': '— Do I ______ take an umbrella? — No, you don\'t. The rain has stopped.',
              'options': [
                'must',
                'have to',
                'mustn\'t',
                'needn\'t'
              ],
              'answer': 1,
              'explanation': '助动词 do 后面只能接 have to，must 不能和 do、does 连用。'
            },
            {
              'stem': 'You ______ eat in the computer room. It\'s not allowed.',
              'options': [
                'don\'t have to',
                'needn\'t',
                'mustn\'t',
                'haven\'t to'
              ],
              'answer': 2,
              'explanation': 'not allowed 表示禁止，用 mustn\'t；don\'t have to 是“不必”。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '自己扣的血条是自己要，被别人扣是被逼的',
          'problem': '我一看 don\'t have to 和 mustn\'t 都是否定就懵了：不都是「不用干」吗？凭啥一个叫不必、一个叫禁止，还得看前面那个 must 是谁说的？',
          'analogy': '像点外卖。must 是你自己下的单——「今天非要吃炸鸡」，是你给自己立的规矩；have to 是系统派单——单子不是你要的，是外面硬塞过来的。派单突然取消，你就不用跑了，那是 don\'t have to（不必）；但店门口挂着「骑手禁止入内」，那是 mustn\'t（禁止）。同样是「不」，一个是没人逼你了，一个是被明令拦住了。',
          'example': 'I must buy 1 pen.（自己要）I have to bring 2 books.（老师定）Must I write 3 pages? No, you needn\'t — 2 is enough.（不必）You mustn\'t take 4.（禁止）',
          'pitfalls': [
            'must 没有过去式，讲昨天的事要用 had to，别直接把 must 搬到过去里',
            'have to 的疑问句要靠 do / does 帮忙，Do I must... 这种拼法不存在，得说 Do I have to...',
            'must 还有另一个身份是「一定、准是」的推测（He must be tired.），那种时候跟「必须」没关系，别顺手换成 have to'
          ],
          'check': [
            {
              'stem': 'We ______ get up early tomorrow — it\'s a holiday.',
              'options': [
                'mustn\'t',
                'don\'t have to',
                'can\'t',
                'needn\'t to'
              ],
              'answer': 1,
              'explanation': '放假没人逼你早起，是「不必」，用 don\'t have to；mustn\'t 是禁止，needn\'t 后面不加 to。'
            },
            {
              'stem': '— Must I answer all the questions? — No, you ______.',
              'options': [
                'mustn\'t',
                'can\'t',
                'don\'t have to',
                'shouldn\'t'
              ],
              'answer': 2,
              'explanation': 'Must I...? 的否定回答是「不必」，用 don\'t have to 或 needn\'t，不能用 mustn\'t。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p16': [
        {
          'version': 1,
          'oneLiner': 'if 从句用一般现在时，主句用一般将来时——这就是“主将从现”。',
          'problem': '中文说“如果明天不下雨，我们就去”，两个都是将来；英语里 if 从句偏偏不能写 will，于是很多人写成 If it will rain ...，全句就错了。',
          'analogy': '像签合同：封面（主句）写的是“将来要做的事”，但附件（if 从句）必须先按“现在”的格式填好，否则合同不成立。',
          'example': 'If it rains tomorrow, we will stay at home.（从句 rains 用现在时，主句 will stay 用将来时）／ We will go to the park if the weather is fine tomorrow.',
          'pitfalls': [
            'if 引导的条件状语从句中不能用 will，用一般现在时代替将来',
            '主句可以用 will、can、must 或祈使句：If you are tired, have a rest.',
            'unless = if ... not（除非）：Unless you hurry, you will be late. = If you don\'t hurry, ...',
            'if 还可引导宾语从句（意为“是否”），那时可以用将来时，要注意区分'
          ],
          'check': [
            {
              'stem': 'If it ______ tomorrow, we will stay at home.',
              'options': [
                'rains',
                'will rain',
                'rained',
                'is raining'
              ],
              'answer': 0,
              'explanation': 'if 条件状语从句用一般现在时表将来。'
            },
            {
              'stem': 'Unless you hurry, you ______ be late.',
              'options': [
                'will',
                'would',
                'have',
                'are'
              ],
              'answer': 0,
              'explanation': 'unless 表示“除非”，主句用一般将来时。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '看“从句还是主句”：从句里的将来，用现在时来表达。',
          'problem': '老写错是因为把中文的时间概念直接搬到英语。判断顺序应该是：先找准哪个是 if 从句 → 从句写现在时 → 主句才写 will。',
          'analogy': '像两条轨道的火车：主句在“将来”这条轨上，if 从句在“现在”这条轨上，两车同时出发但走的是不同的轨，不能都开到将来那条轨上。',
          'example': 'If you don\'t hurry, we will miss the train.／ She will call you if she arrives early.／ If you are free, come to my party.（主句用祈使句）',
          'pitfalls': [
            '不要写成 If it will rain, we will stay at home.',
            'unless 后同样用一般现在时：Unless he studies hard, he won\'t pass the exam.',
            '区分 if“是否”的宾语从句：I don\'t know if he will come.（此处可用 will）',
            '条件句与时间状语从句（when、before、after、as soon as）都适用“主将从现”'
          ],
          'check': [
            {
              'stem': '用括号内动词的适当形式填空：We ______ (go) to the park if the weather is fine tomorrow.',
              'options': [
                'go',
                'went',
                'will go',
                'are going'
              ],
              'answer': 2,
              'explanation': 'if 从句用一般现在时，主句用一般将来时。'
            },
            {
              'stem': 'Which sentence is correct?',
              'options': [
                'If he will come, I will tell you.',
                'If he comes, I will tell you.',
                'If he comes, I tell you.',
                'If he will come, I tell you.'
              ],
              'answer': 1,
              'explanation': '条件从句用一般现在时，主句用一般将来时。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p17': [
        {
          'version': 1,
          'oneLiner': '先判前后两句是顺着还是拐弯，再挑连接词。',
          'problem': '完形填空里连接词题几乎每次都有。它不考单词认不认识，考的是你能看出前后两句的关系。只盯着空格那一句，四个选项会看着都像对的。',
          'analogy': '组队打球时，队友往左跑，你也跟着往左，这是顺着走。他突然变向往右，你就得拐弯。连接词就是那个信号。做完形填空时，先看空格前后两句话是同一个方向，还是突然换了方向。',
          'example': 'I finished my homework, ______ I went out to play. 前后顺着走，先做完再出去玩，填 so。I was tired, ______ I kept playing. 后面突然反过来了，填 but。先定方向，再挑词。',
          'pitfalls': [
            '只读空格那一句，不往前看也不往后看，两边的关系根本判不出来',
            'so 和 because 不能同时用，although 和 but 也不能同时用，中文的虽然但是不能直译',
            '选完把词代回空格，整句再读一遍，读着别扭就是关系选反了'
          ],
          'check': [
            {
              'stem': '阅读下面句子，选出最合适的词：I stayed up late last night, ______ I felt sleepy in class this morning.',
              'options': [
                'so',
                'but',
                'because',
                'or'
              ],
              'answer': 0,
              'explanation': '前句熬夜是原因，后句上课犯困是结果，方向一致，用 so 承接。'
            },
            {
              'stem': '阅读下面句子，选出最合适的词：The Lego set looked easy. ______, it took me three hours to finish.',
              'options': [
                'As a result',
                'For example',
                'However',
                'Because'
              ],
              'answer': 2,
              'explanation': '看起来简单和花了三小时方向相反，是转折，用 However。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '空格两边是不是一条道上，先看清再落笔。',
          'problem': '我一看空格，脑子里就只剩那四个词，前面那句写了啥全忘了，硬挑一个，读完自己都觉得别扭，就懵。',
          'analogy': '外卖骑手手里的导航，顺路直送和前方封路绕行是两回事。路线没变就是直达，前面封了路他就得拐弯改道。连接词就是导航那句提示音，听对了才知道这单是照原路走，还是要换道。',
          'example': 'I ate 1 burger, ______ I was still hungry. 吃了 1 个还饿，方向反了，填 but。I ate 1 burger, ______ I felt full. 吃了 1 个就饱，顺着走，填 so。数字小，方向先定。',
          'pitfalls': [
            '前一句可能还在上一行，眼睛只盯空格这一行，方向就判不出来，往前后各扫半句再选',
            'however、instead 这类词一般站句首、后面跟逗号；but 站在两句中间。位置放错，句子就散架',
            '时间紧就先跳过拿不准的那个空，做完回头用「读起来顺不顺」来定，别卡在一个空上耗掉整篇'
          ],
          'check': [
            {
              'stem': '阅读下面句子，选出最合适的词：He saved his pocket money for a whole month. ______, he bought the game he wanted.',
              'options': [
                'However',
                'Instead',
                'As a result',
                'Although'
              ],
              'answer': 2,
              'explanation': '攒钱在前、买到游戏在后，是顺着的结果关系，用 As a result。'
            },
            {
              'stem': '阅读下面句子，选出最合适的词：I really wanted that snack, ______ I only had 2 yuan left.',
              'options': [
                'but',
                'so',
                'because',
                'or'
              ],
              'answer': 0,
              'explanation': '想吃和钱不够是两个相反方向，属于转折，用 but。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p18': [
        {
          'version': 1,
          'oneLiner': '细节题回原文找那句，主旨题看整体。',
          'problem': '阅读理解最常考两件事：细节题问文中某件具体的事，主旨题问整篇在讲什么。做错常常是凭印象选，没回原文核对。',
          'analogy': '打完一局游戏看战绩：想知道某个队友拿了几个人头，得点开那一栏查具体数字，这就是细节题。想知道这局谁赢了、打得顺不顺，得看整张战绩表，不能只盯一个人，这就是主旨题。两种问法，要翻的地方不一样。',
          'example': '短文三句：Jack 放学先打球，再回家写作业，晚上看球赛。问 Jack 放学后先做什么，回第一句找，答案是打球，这是细节题。问这篇主要讲什么，把三句合起来看，是他放学后的安排，这是主旨题。',
          'pitfalls': [
            '细节题不回原文找原句，凭印象选，一乱顺序就掉坑',
            '主旨题只抓住某一个细节就当成全文意思',
            '看到选项里有原文出现过的词就选，没管问的是不是同一件事'
          ],
          'check': [
            {
              'stem': '阅读短文：Amy gets home at five. She feeds her dog first, then she does her homework. After dinner she plays the piano. What does Amy do right after she gets home?',
              'options': [
                'She feeds her dog.',
                'She does her homework.',
                'She plays the piano.',
                'She has dinner.'
              ],
              'answer': 0,
              'explanation': '原文顺序是回家、喂狗、写作业、晚饭后弹琴，回家后紧接着的是喂狗。'
            },
            {
              'stem': '阅读短文：On Saturday I cleaned my room, washed my bike and helped my mum cook. I was tired but happy. What is the main idea of the passage?',
              'options': [
                'How to clean a room.',
                'Why bikes are useful.',
                'A busy but happy Saturday.',
                'How to cook with mum.'
              ],
              'answer': 2,
              'explanation': '三件事合起来讲的是这个周六又忙又开心，别的选项都只管其中一句。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '问哪一件事就翻那一句，问整篇就看全部。',
          'problem': '题目一长我就懵：它到底在问其中某个动作，还是在问整篇讲啥，我分不出来，四个选项看着都挺像。',
          'analogy': '点外卖的时候，想知道骑手现在骑到哪儿了，得点开那一单看实时地图，这就是细节题。想知道这顿饭总共几样、一共花了多少、整体划不划算，得看整张订单清单，不能只盯骑手那个小点，这就是主旨题。先看清题目问的是地图还是清单，再动手翻。',
          'example': '短文就 2 句：第 1 句 Leo 放学先写作业，第 2 句他再打游戏。问「Leo 先做什么」，回第 1 句找，答写作业；问「这篇主要讲什么」，2 句合起来看，答他放学后做的两件事。',
          'pitfalls': [
            '题里出现 first、then、after 这类词，先把顺序在草稿上排一排再选，光靠印象排容易乱。',
            '主旨题只揪着一句就下结论，容易把整篇讲小了。',
            '选项里蹦出原文见过的词也别急着选，先确认它答的是不是题里问的那个点。'
          ],
          'check': [
            {
              'stem': '阅读短文：Ben gets up at seven. He brushes his teeth, then he has breakfast, and after that he walks to school. Which thing does Ben do right after he gets up?',
              'options': [
                'He brushes his teeth.',
                'He has breakfast.',
                'He walks to school.',
                'He plays basketball.'
              ],
              'answer': 0,
              'explanation': '原文顺序是起床、刷牙、早饭、上学，紧跟在起床后面的动作是刷牙。'
            },
            {
              'stem': '阅读短文：Last Saturday my friends and I went to the park. We flew kites, rode bikes and ate ice cream. We all had fun. What is the main idea of the passage?',
              'options': [
                'How to fly a kite.',
                'Why riding bikes is good.',
                'A happy day in the park with friends.',
                'How to make ice cream.'
              ],
              'answer': 2,
              'explanation': '三件事合起来讲的是和朋友在公园玩得开心，其他选项只管其中一句。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p19': [
        {
          'version': 1,
          'oneLiner': '写作文先定好时间和人：一局一个时态，一路一套人称。',
          'problem': '书面表达最常见的两种丢分：时间词写着 yesterday，动词还是现在时；前面说了 Mary，后面写成 he 或 they。这类考法多出现在日记、游记、介绍朋友的小短文里，一处不一致就扣一串分。',
          'analogy': '写书面表达像约好一队人打一局游戏。开局前先说定「这局打的是昨天」，那整局都按昨天来，中途不能跳回现在。队员也定死：这局 Mary 上场，后面就只能写 she，不能冒出 he 或 they。一局一个时间，一队一套人。',
          'example': '写「昨天的比赛」三句话：We played basketball yesterday. We scored 9 points. Our coach was happy. 三句都用过去时，人一直是 we 和 our coach。要是写成 We play basketball，就是时间对不上；把 Our coach 后面写成 They，就是中途换人。',
          'pitfalls': [
            '句子里出现 yesterday、last week、in 2020 这类过去时间，动词就要用过去式，不能停在现在时',
            '人称代词跟着前面的名词走：Mary 用 she，Tom 用 he，一群人用 they，单数物用 it',
            '同一篇里时态别来回跳，前半句过去、后半句现在，读起来就是两个时间混在一起'
          ],
          'check': [
            {
              'stem': 'Last Saturday we ______ a football match with Class 3.',
              'options': [
                'watch',
                'watched',
                'watches',
                'are watching'
              ],
              'answer': 1,
              'explanation': 'Last Saturday 是过去时间，动词要跟时间走，用过去式 watched。'
            },
            {
              'stem': '下面哪组句子在时态和人称上是一致的？',
              'options': [
                'Lucy is my sister. He often helps me.',
                'Last night I finish my homework and go to bed.',
                'My father is a doctor. He works in a hospital.',
                'We went to the park yesterday and take many photos.'
              ],
              'answer': 2,
              'explanation': 'My father 用 is 和 works，时间是现在，人用 he，两头都对得上。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '写句子像记账：日期填一个，户名填一个，中途别改。',
          'problem': '我写日记的时候，第一句写了 Yesterday，后面写着写着就顺手写成 visit、take 这种；前面写了 Mary，后面又变成 he。老师一圈一大串，我拿回来就懵，不知道错在哪一句。',
          'analogy': '书面表达跟记零花钱的账本一样：一行只记一个日子，今天的花销别混进「昨天」那栏，混了月底就对不上；账户名也一样，这行记的是「我的钱」，就不能半路记成「我姐的钱」。日子一栏、户名一栏，从头到尾各走各的那一条。',
          'example': '写「昨天买零食」：I had 3 yuan and I bought 2 bags of chips. 两句都停在过去，户名一直是 I。要是写成 I have 3 yuan，日子那栏就跳到今天了；或者后半句把 I 换成 she，户名就换了人。',
          'pitfalls': [
            '看到 yesterday、last night、just now 这类词，动词一般就走过去式，写着写着容易滑回现在时，写完回头扫一眼这几个动词就好',
            '人称跟着前面的名词走：Mary 是 she，Tom 是 he，单数东西是 it，一群人或好几样是 they，写的时候偶尔会串',
            '一篇里时间最好只走一条线，前半句昨天、后半句现在，读的人会以为是两件事，顺手把后半句拉回来就行'
          ],
          'check': [
            {
              'stem': 'Last Friday I ______ to the supermarket and bought 2 bottles of milk.',
              'options': [
                'go',
                'goes',
                'went',
                'am going'
              ],
              'answer': 2,
              'explanation': 'Last Friday 是过去时间，动词跟着时间走，用 went。'
            },
            {
              'stem': 'My cousin Tom is 14 and loves basketball. ______ often plays with me after school.',
              'options': [
                'She',
                'He',
                'It',
                'They'
              ],
              'answer': 1,
              'explanation': 'Tom 是男生，后面用 he 才跟前面的人对得上。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p2': [
        {
          'version': 1,
          'oneLiner': '看它贴着谁：贴名词用形容词，贴动作用副词。',
          'problem': '这是每套卷子都会出现的点：单选考 good 还是 well，用括号词填空考 real 要变 really。判断方法只有一个：先看这个词在句子里修饰谁。光背词形表不管用。',
          'analogy': '打球时身上有两样东西：贴在球员身上的名牌，和贴在动作上的加速道具。名牌写的是这个人什么样，比如 he is good；加速道具装在这个动作上，比如 he plays well。牌子跟着人走，道具跟着动作走，装错位置就别扭。',
          'example': '最短的判断：He is good. He plays well. 同一个意思，贴在人和贴在动作上形状不一样。再看两个小变化：real 加 ly 变 really，happy 把 y 变 i 再加 ly 变 happily。',
          'pitfalls': [
            '修饰名词用形容词，修饰动词或形容词用副词：a good player，但 plays well、really tired',
            'be、look、feel、sound、smell 这些词后面接形容词：She looks happy，不写 happily',
            '不是所有副词都加 ly：good 变 well，fast、hard 本身形容词副词同形，happy 变成 happily'
          ],
          'check': [
            {
              'stem': '用括号内单词的正确形式填空：I am ______ (real) tired after the match.',
              'options': [
                'real',
                'really',
                'realer',
                'realness'
              ],
              'answer': 1,
              'explanation': 'tired 是形容词，修饰形容词要用副词 really。'
            },
            {
              'stem': 'My sister sings very ______.',
              'options': [
                'beauty',
                'beautiful',
                'beautifully',
                'beautify'
              ],
              'answer': 2,
              'explanation': 'sings 是动词，修饰动词要用副词 beautifully。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '形容人或者东西用形容词，形容「干得咋样」用副词。',
          'problem': '我一看 He is good 和 He plays well 就懵，两个都翻成「好」，凭感觉选一选就翻车。括号里给个 real，我填 real 觉得顺，填 really 也觉得顺，到底看哪儿？',
          'analogy': '点外卖的时候，平台上其实挂着两行字。一行贴在店名旁边，写「这家店咋样」——这是形容词，贴着人或东西：a good shop。另一行贴在配送进度上，写「骑手跑得咋样」——这是副词，贴着动作：delivers fast。招牌只能挂店上，速度只能挂「跑」上，挂反了顾客一眼就看出不对劲。real 变 really 这种加尾巴，就像给「跑得咋样」那一行单独配的配件。',
          'example': '1 个东西配 1 个形容词：1 fast car；1 个动作配 1 个副词：runs fast。变形走 2 步：true → truly，easy → easily。',
          'pitfalls': [
            '副词一般跟在动作后面，中间隔着宾语也没关系：speaks English well，别把 well 挤到 English 前面去',
            'look、sound、feel、taste 这几个是靠眼睛耳朵判断的动词，后面接形容词：It sounds good，硬加 ly 反而怪',
            '带 ly 的不一定都是副词，friendly、lovely 就是形容词，别看见 ly 就当副词用'
          ],
          'check': [
            {
              'stem': 'The soup tastes ______.',
              'options': [
                'good',
                'well',
                'goodly',
                'goodness'
              ],
              'answer': 0,
              'explanation': 'taste 是感官动词，后面接形容词 good，不能用副词。'
            },
            {
              'stem': 'The player hit the ball ______.',
              'options': [
                'hardly',
                'hard',
                'hardness',
                'harden'
              ],
              'answer': 1,
              'explanation': '修饰 hit 这个动作用副词，而 hard 本身形容词副词同形；hardly 意思变成了「几乎不」。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p20': [
        {
          'version': 1,
          'oneLiner': '听力数字题：先抓时间、价钱、地点这些关键词，再算一步。',
          'problem': '这类题每次听力都会出现。失分往往不是没听懂，而是听到数字就直接选，漏掉半价、还差一刻这类要再算一步的加工。',
          'analogy': '像打游戏时听队友报点。队友喊“B点，剩3秒”，你不用听懂他每个字，抓住 B 点和 3 秒就够了。听力数字题一样：整句话可以听糊，但时间、价钱、地点这三个点必须抓住，抓住之后再动脑算一步。',
          'example': '听到 It is a quarter to seven. 先抓两个词：seven 和 to。to 是“还差”，所以是七点还差一刻。再算一步：七点减十五分，得 6:45。选项里出现 7:15 就是干扰项，那是 past 才会有的答案。',
          'pitfalls': [
            '时间：a quarter to seven 是 6:45，不是 7:15。to 是“还差”，past 是“已过”',
            '数字：听到 15、half price 别急着选，半价还要再除 2；十几和几十也别听混，thirteen 重音在后，thirty 重音在前',
            '地点：说话人有时先讲一个地点再改口，后说的那个才作数，别听到第一个就选'
          ],
          'check': [
            {
              'stem': '你听到：The film starts at a quarter past three. When does the film start?',
              'options': [
                '3:15',
                '3:45',
                '2:45',
                '4:15'
              ],
              'answer': 0,
              'explanation': 'past 表示已经过了，三点过一刻就是 3:15。'
            },
            {
              'stem': '你听到：It\'s 20 yuan for a ticket, and students pay half. How much does a student pay?',
              'options': [
                '20 yuan',
                '15 yuan',
                '10 yuan',
                '5 yuan'
              ],
              'answer': 2,
              'explanation': '学生半价，20 除以 2 得 10 元。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '听到数字先别选，那玩意儿多半还得再加工一下。',
          'problem': '我每次听到一串数字，脑子还卡在刚才那个是 fifteen 还是 fifty，下一句已经念完了，然后就懵在那儿。',
          'analogy': '就像点外卖，小哥打电话过来语速飞快，你其实只逮住了三样东西：几分钟到、几号楼几单元、一共多少钱。至于“喂你好我这边有点堵”那些，全糊掉也没关系。听力数字题也是这个套路：整句可以一片糊，先把时间、地点、价钱这三样抓住，抓住之后再自己动一次手算一步。',
          'example': '听到 The bus leaves at a quarter to two. 先逮两个词：two 和 to。to 是“还差”，所以是两点还差一刻。再算一步：两点往回拨十五分，得 1:45。选项里如果摆个 2:15，那就是 past 的答案，专等你上钩。',
          'pitfalls': [
            '时间：to 是“还差”，a quarter to two 是 1:45，不是 2:15；听到 to 就在脑子里把钟往回拨一格',
            '价钱：half price、30% off 这类词一冒出来，前面那个数字就只是原料，还得再动一次手；十几和几十也容易糊，thirteen 重音在后，thirty 重音在前，注意听尾巴',
            '地点：说话人有时先报一个地方又改口，后说的那个才作数，别听到第一个就急着落笔'
          ],
          'check': [
            {
              'stem': '你听到：The plane takes off at a quarter to four. When does the plane take off?',
              'options': [
                '3:45',
                '4:15',
                '4:45',
                '3:15'
              ],
              'answer': 0,
              'explanation': 'to 是还差，四点往回拨十五分就是 3:45。'
            },
            {
              'stem': '你听到：Tickets are 4 yuan for adults, and children pay half. How much does a child pay?',
              'options': [
                '4 yuan',
                '3 yuan',
                '2 yuan',
                '1 yuan'
              ],
              'answer': 2,
              'explanation': '小孩半价，4 除以 2 得 2 元。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p3': [
        {
          'version': 1,
          'oneLiner': '不规则动词过去式不靠 -ed，靠一个个记住专属拼法。',
          'problem': '写句子、做完形和语法填空时，一看到 yesterday、last 就得用过去式。可很多动词不是加 -ed，得一个个记拼法，拼错整句就丢分。这类题单选和填空题里几乎每次都出现。',
          'analogy': '像游戏里的限定角色，解锁方式不是统一的“升到 5 级”，而是每个角色一个专属任务：go 要变 went，buy 要变 bought。你想用一套统一公式给所有动词加 -ed，就像对所有角色都套同一张升级表，系统根本不认。',
          'example': '题：Yesterday I ______ (go) to the park. 第一步，看 Yesterday，锁定用过去式。第二步，想 go 属于“改头换面”那一类，不跟 -ed 走。第三步，写出 went，不是 goed。碰上 eat 就写 ate，碰上 win 就写 won，一个词一个拼法。',
          'pitfalls': [
            '不要给不规则动词硬加 -ed：go 写 went，不写 goed；buy 写 bought，不写 buyed',
            'ought / aught 是一组要连着记：bring→brought，think→thought，teach→taught，catch→caught',
            '有几个只差一个元音字母，最容易看错：fall→fell，win→won，ride→rode'
          ],
          'check': [
            {
              'stem': '用括号内动词的适当形式填空：Yesterday afternoon we ______ (win) the basketball game.',
              'options': [
                'winned',
                'won',
                'wined',
                'wan'
              ],
              'answer': 1,
              'explanation': 'Yesterday afternoon 提示一般过去时，win 的过去式是 won，不加 -ed。'
            },
            {
              'stem': '下列句子中，动词过去式拼写正确的是哪一句？',
              'options': [
                'My dad catched the ball.',
                'My dad caught the ball.',
                'My dad caughted the ball.',
                'My dad catch the ball.'
              ],
              'answer': 1,
              'explanation': 'catch 的过去式是 caught，既不加 -ed，也不重复加过去式标记。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '有些动词的过去式不加 -ed，是直接换个新拼法。',
          'problem': '我一看 yesterday、last 这种词，就知道该用过去式，可笔一落就懵——到底加不加 -ed？加了怕错，不加又想不出那个专属拼法，最后只能空着。填空和单选里这种题一出现，我就开始猜。',
          'analogy': '像拼乐高：不是所有零件都往同一个卡扣上怼。有的零件长得普普通通，翻个面就扣上了（play→played）；有的零件形状天生特别，得转到它自己的角度才能卡住（go→went，buy→bought）。你非要拿一块普通小砖去顶那个特别的接口，拼上去也是歪的，整面墙一推就散。所以每个不规则动词，都有一张自己的“拼法图纸”，得单独记。',
          'example': '给你 3 个空，只有 1 个能靠加 -ed 蒙对：① play → ② go → ③ buy。play 加 -ed 变 played，0 风险；go 换脸成 went；buy 换脸成 bought。3 个空里 2 个得靠记，1 个能推。这就是为什么不规则动词没法用一条公式统一解决。',
          'pitfalls': [
            '写之前先在句子里找时间词（yesterday、last、ago），找到了就把动词换成过去式，别把原形直接抄进去。',
            '有几个词换完脸跟原形完全不像（go→went、buy→bought），这种别靠猜，单独抄一张小纸条，写之前扫一眼。',
            '过去式和过去分词别叠加：写完 bought 就停手，不要再补一个 -ed 或 -en，多写的字母照样扣分。'
          ],
          'check': [
            {
              'stem': '下面哪一句的过去式拼写是正确的？',
              'options': [
                'I bought a snack after school.',
                'I buyed a snack after school.',
                'I boughted a snack after school.',
                'I boughten a snack after school.'
              ],
              'answer': 0,
              'explanation': 'after school 在这里指说话前发生的事，buy 的过去式是 bought，既不换成 -ed 也不叠后缀。'
            },
            {
              'stem': '用括号内动词的适当形式填空：Two days ago my cousin ______ (go) to the museum with me.',
              'options': [
                'goed',
                'go',
                'gone',
                'went'
              ],
              'answer': 3,
              'explanation': 'Two days ago 锁定一般过去时，go 的过去式是 went，跟原形完全不同。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p4': [
        {
          'version': 1,
          'oneLiner': 'lend 是借出，borrow 是借入；say 只接话，tell 要带人。',
          'problem': '单选题最爱考这个：句意差不多，只是换个动词。lend 还是 borrow，say 还是 tell，全看东西往哪边走、后面接不接人。凭语感猜很容易错，先看方向再选就稳。',
          'analogy': '像游戏里换皮肤。我有一款限定皮肤，队友想用，我借给他，这是 lend，皮肤从我账号往他那边走。我想要队友的皮肤，从他那儿借来玩，这是 borrow，皮肤从他那边往我这儿走。同一件事，箭头方向反了，词就得换。',
          'example': '我只有 3 个游戏币，同桌有 5 个。我说：Can I borrow 5 coins from you? 币从他那儿过来，用 borrow。他说：I can lend you 5 coins. 币从他那儿出去，用 lend。谁当主语，就用谁那个方向的词。',
          'pitfalls': [
            'lend 后面能直接接人：lend sb sth；borrow 只能 borrow sth from sb，没有 borrow sb sth 这种说法。',
            'say 后面不能直接接人，不能说 say me；要接人就换成 tell me，或者改成 say sth to me。',
            'tell 后面接人再接内容：tell sb sth，讲故事、说真话也用 tell，别说成 say a story。'
          ],
          'check': [
            {
              'stem': 'I only have 3 yuan. Can I ______ 5 yuan from you?',
              'options': [
                'lend',
                'borrow',
                'keep',
                'spend'
              ],
              'answer': 1,
              'explanation': '钱是从对方那儿借进来的，用 borrow，后面接 from sb。'
            },
            {
              'stem': 'My brother ______ me a funny story about his game last night.',
              'options': [
                'said',
                'told',
                'spoke',
                'talked'
              ],
              'answer': 1,
              'explanation': 'tell sb sth 先接人再接内容，这里讲的是过去的事，用 told。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '东西出门是 lend，进门是 borrow；tell 后面要带人。',
          'problem': '我一看题就懵：lend 和 borrow 中文都翻成「借」，say 和 tell 都翻成「说」，读着都通，凭感觉选就翻车。',
          'analogy': '把这两组词当成快递派件。东西进我家门，是别人寄给我，用 borrow；东西出我家门，是我打包寄给同学，用 lend。同一包零食，一进一出，动词跟着走的方向换。say 和 tell 也能当快递单看：say 是单子上只写了内容、收件人那栏空着；tell 是必须先填收件人再写内容，tell me the truth 里那个 me 就是收件人。单子没填收件人就寄，等于 say me，包裹根本送不到。',
          'example': '我兜里 1 元，同桌有 4 元。我拿他 2 元：borrow 2 yuan from him，钱进门。他把 2 元塞我手里：lend me 2 yuan，钱出门。说话也一样：tell me 1 thing 单子填了人；say me 1 thing 单子空着，作废。',
          'pitfalls': [
            'borrow 后面常跟 from，lend 后面常直接跟人：lend sb sth。写之前先想一秒东西往哪边走，再决定跟谁。',
            'say 后面跟内容或 to sb，别写成 say me 这种空收件人的单子；要接人就换 tell。',
            'tell 是先人后内容：tell sb sth；tell a story、tell the truth 也归它，这两句换成 say 就别扭。'
          ],
          'check': [
            {
              'stem': 'My sister has 2 pencils. She can ______ me one.',
              'options': [
                'lend',
                'borrow',
                'keep',
                'buy'
              ],
              'answer': 0,
              'explanation': '是她把铅笔给我，东西出门，用 lend sb sth。'
            },
            {
              'stem': 'Don\'t ______ me a lie about your homework again.',
              'options': [
                'say',
                'speak',
                'tell',
                'talk'
              ],
              'answer': 2,
              'explanation': 'tell 先接人再接内容，me 是收件人，lie 是内容。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p5': [
        {
          'version': 1,
          'oneLiner': '前缀改意思，后缀改词性；先拆词根，再看前后加了什么。',
          'problem': '这题考的是把长单词拆开看的能力。阅读里遇到没学过的词，可以靠前缀后缀猜意思和词性；填空题还要按句子位置选对形式。',
          'analogy': '单词像乐高：词根是那块基础砖，前缀是前面插的红色小片，后缀是后面插的蓝色小片。红色小片常把意思反过来，比如 un- 表示不；蓝色小片常改词性，比如 -less 让名词变成形容词。',
          'example': 'care 是词根，意思是关心、小心。后面加 -less，变成 careless，意思是粗心的。前面加 un- 呢？happy 加 un- 变成 unhappy，意思是不开心。做题先找词根，再看前面还是后面加了东西。',
          'pitfalls': [
            '只背整个单词，不拆词根，换个前后缀就认不出',
            '把前缀和后缀的作用搞反：前缀常改意思，后缀常改词性',
            '填空时只看中文意思，不看空格要形容词还是名词'
          ],
          'check': [
            {
              'stem': '单词 useless 里的后缀 -less 是什么意思？',
              'options': [
                '没有',
                '充满',
                '再次',
                '在……之前'
              ],
              'answer': 0,
              'explanation': '-less 表示没有，useless 就是没用的。'
            },
            {
              'stem': '用括号内单词的正确形式填空：This dictionary is very ______ (use). I look up words in it every day.',
              'options': [
                'use',
                'useful',
                'usefully',
                'useless'
              ],
              'answer': 1,
              'explanation': '句意是每天用它查词，所以是有用的；be 动词后用形容词 useful。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '先拆词根，再看前后零件：一个改意思，一个改身份。',
          'problem': '我一看到 His ______ (care) driving 这种题就懵：care 我认识啊，可到底填 care、careful 还是 careless？前面后面都挂着小零件，我就分不清该留哪个了。',
          'analogy': '长单词像你点的一份外卖订单。词根是那份主菜，比如 happy、care。前缀就是下单时写的备注——「不要辣」「少冰」，一备注下去，整份东西的性质就变了，un- 写上去，happy 直接变「不开心」。后缀则是打包盒上贴的分类标签——「饮品类」「甜品类」，它不管味道，只决定这盒东西算哪一类。所以看单词也一样：先认主菜，再翻备注，最后看标签，三秒就能猜个八九不离十。',
          'example': '拿 unhappy 拆一下：un-（1 个前缀）+ happy（1 个词根）= 2 块，前缀把意思翻成「不」。再拿 careless 拆：care + -less = 2 块，-less 也带「没有」的意思，但它顺手把 care 从原来的身份改成了形容词。所以记住这个账：1 个前缀主要管意思，1 个后缀主要管身份。',
          'pitfalls': [
            '遇到长单词，习惯整块背下来；下次换个前后缀，就认不出老朋友了。',
            '前缀和后缀的分工容易记混：前缀多半动意思，后缀多半定词性，做题前可以先扫一眼是挂在前面还是后面。',
            '填空的时候，最好看一眼空格那儿要的是形容词还是名词，只盯着中文意思，容易选到形式不对的那个。'
          ],
          'check': [
            {
              'stem': '用括号内单词的正确形式填空：Lily\'s ______ (care) homework was full of mistakes.',
              'options': [
                'care',
                'careful',
                'careless',
                'carefully'
              ],
              'answer': 2,
              'explanation': '作业里全是错，说明她粗心；my/her 后面接形容词，所以用 careless。'
            },
            {
              'stem': 'un- 加在 happy 前面变成 unhappy。这个前缀干的事是下面哪个？',
              'options': [
                '把词性从形容词改成名词',
                '把意思改成相反或否定',
                '表示「再一次」',
                '表示「在……之前」'
              ],
              'answer': 1,
              'explanation': 'un- 这类前缀主要改意思，把 happy 翻成「不开心」。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p6': [
        {
          'version': 1,
          'oneLiner': '先看主语是不是一个人，再决定动词加不加 s 或 es。',
          'problem': '几乎每次考试都会出现，考的是动词要不要跟着主语变样。它确实有点绕：得先看主语，再看动词词尾，顺序错一步，s 就加错地方。',
          'analogy': '把动词想成打球穿的队服。主语是一群人（I、you、we、they）时，动词穿普通队服，用原形 go。主语只剩一个人（he、she、it，或者 my brother、the little girl）时，动词就换上单人专属装备，后面挂个 s 或 es。上场前先看主语是几个人，再决定穿哪套。',
          'example': 'My brother goes to school every day. 先看主语 My brother，是一个人，用单人装备。go 结尾是 o，加 es。The little girl watches TV every evening. 主语是一个女孩，watch 结尾是 ch，加 es。顺序就是：先看主语，再看词尾。',
          'pitfalls': [
            '主语是 I、you、we、they 时动词不加 s，别一看到 every day 就往上加。',
            '以 o、s、x、ch、sh 结尾的动词加 -es，比如 go→goes、watch→watches。',
            'my brother、the little girl 这类一个人的人名或称呼，也算第三人称单数，不是只有 he、she 才算。'
          ],
          'check': [
            {
              'stem': '用括号内动词的适当形式填空：My sister ______ (do) her homework after dinner.',
              'options': [
                'do',
                'does',
                'doing',
                'did'
              ],
              'answer': 1,
              'explanation': '主语 My sister 是一个人，do 以 o 结尾，加 -es 变成 does。'
            },
            {
              'stem': '下面哪一句语法正确？',
              'options': [
                'They goes to the park every Sunday.',
                'They go to the park every Sunday.',
                'He go to the park every Sunday.',
                'He going to the park every Sunday.'
              ],
              'answer': 1,
              'explanation': '主语 They 是一群人，动词用原形 go，不加 s。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '一个人干活就加 s，一群人干活动词原样不动。',
          'problem': '我一看到 every day 就条件反射想改动词，可主语有时候是一个人、有时候是一群人，我就懵：这 s 到底该挂谁头上？',
          'analogy': '把动词想成送外卖的配送单。主语是一个人，就像只送 1 单、只有一个收件人，骑手要在单子后面盖个 s 章确认「就他一个」；要是词尾本来以 o、s、x、ch、sh 收尾，得先铺张 e 再盖章。主语是 I、you、we、they 这种一群人一起收，配送单原样发出，章都不用盖。所以是先数人头，再决定盖不盖章，不是先看时间词。',
          'example': 'He plays 1 game after school：主语 He，1 个人，play 后面盖章变 plays。They play 2 games after school：主语 They，2 个人，play 一动都不动。数字只有 1 和 2，先数主语是几个，再动手改词尾。',
          'pitfalls': [
            'every day、every evening 只是提示「经常做」，它管不着那个 s，加不加只看前面的主语是几个。',
            '以 o、s、x、ch、sh 结尾的动词别只挂个 s，得先补个 e：go→goes、watch→watches、do→does。',
            'my brother、the little girl、my dog 这种「就一个」的说法也算单人，别以为只有 he、she、it 才要加 s。'
          ],
          'check': [
            {
              'stem': '用括号内动词的适当形式填空：My dog ______ (run) 2 laps every morning.',
              'options': [
                'run',
                'runs',
                'running',
                'ran'
              ],
              'answer': 1,
              'explanation': '主语 My dog 就一只，算单人，run 后面加 s 变成 runs。'
            },
            {
              'stem': '下面哪一句语法正确？',
              'options': [
                'He watch 1 movie every week.',
                'He watches 1 movie every week.',
                'They watches 1 movie every week.',
                'They watching 1 movie every week.'
              ],
              'answer': 1,
              'explanation': '主语 He 是一个人，watch 以 ch 结尾，先加 e 再加 s 变成 watches。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p7': [
        {
          'version': 1,
          'oneLiner': 'be 动词后、实义动词前，频率副词位置就这两条。',
          'problem': '频率副词的位置是 M1 的必考点，选择题和填空题都会考。它的关键不在背单词，而在先看句子里是 be 动词还是实义动词，位置跟着变。',
          'analogy': '像你打游戏组队时的固定站位。频率副词是个位置固定的队友：场上只有 be 动词一个守门员，它就站在守门员后面（He is always late）。场上有实义动词这个主攻手，它就站到主攻手前面（He always plays）。位置跟着场上有谁变，但它从不乱跑。',
          'example': '两句对照：He is often late. 这里 be 动词 is 在前，often 跟在它后面。He often plays. 这里实义动词 plays 在前，often 站在它前面。换成 never：She is never late. / She never plays. 换成 usually：He is usually early. / He usually studies.',
          'pitfalls': [
            'be 动词句里把频率副词塞到 is、am、are 前面：He always is late 是错的，要写 He is always late',
            '实义动词句里把它甩到动词后面：He plays always 是错的，要写 He always plays',
            'never 本身已经否定，不要再叠 not：不说 He is not never late，直接说 He is never late'
          ],
          'check': [
            {
              'stem': 'My brother ______ plays football after school.（他总是放学后踢足球）',
              'options': [
                'is always',
                'always',
                'always is',
                'is'
              ],
              'answer': 1,
              'explanation': '后面是实义动词 plays，频率副词 always 要放在它前面。'
            },
            {
              'stem': 'The library ______ quiet in the morning.（早上图书馆通常很安静）',
              'options': [
                'is usually',
                'usually is',
                'usually',
                'is usual'
              ],
              'answer': 0,
              'explanation': '句中是 be 动词 is，频率副词 usually 要放在 is 后面。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '句里有 be 就贴 be 后面，没 be 就站动词前面。',
          'problem': '我一看到句子又是 is 又是 plays，就懵：always 到底塞 is 前面还是 plays 前面？',
          'analogy': '把频率副词当成外卖小哥。句子里有 be 动词（is/am/are），它像小区前台，外卖小哥 always 就送到前台后面：He is always late。句子里是实义动词（play/plays），它像你本人，外卖小哥要送到你前面：He always plays。小哥位置看今天谁来接单，但不会乱站。',
          'example': '数 be 动词：0 个 be：He often runs. → often 在 runs 前。1 个 be：He is often late. → often 在 is 后。0 个 be：She never eats. → never 在 eats 前。1 个 be：She is never late. → never 在 is 后。',
          'pitfalls': [
            '看到 is/am/are，先别把 always 往它前面塞；写成 He always is late 会像把外卖放错门，改成 He is always late 就顺了。',
            '句子里只有 play/plays/eats 这类实义动词时，频率副词别落在动词后面；He plays always 读着卡，换成 He always plays。',
            'never 自己就是“从不”，不用再叠 not；He is never late 已经是否定，别写成 He isn\'t never late。'
          ],
          'check': [
            {
              'stem': 'His brother ______ late for school.（他弟弟总是迟到）',
              'options': [
                'is always',
                'always is',
                'is always being',
                'always'
              ],
              'answer': 0,
              'explanation': '句中有 be 动词 is，always 要放在 is 后面。'
            },
            {
              'stem': 'He ______ plays basketball after school.（他放学后通常打篮球）',
              'options': [
                'usually',
                'is usually',
                'usually is',
                'is usual'
              ],
              'answer': 0,
              'explanation': '后面是实义动词 plays，usually 要放在它前面。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p8': [
        {
          'version': 1,
          'oneLiner': '比较级比两者，最高级比三者以上；短词变词尾（-er/-est），长词前加 more/most。',
          'problem': '最常见的失分是“双重比较”：既变词尾又加 more，写出 more taller 这种错句。根子在于没先判断形容词有几个音节。',
          'analogy': '像给东西贴标签：一个音节的词（tall、big）自己就能缩一缩，变成 taller；多音节的词（interesting）太长缩不动，只能在前面挂一块 more / most 的牌子。不能又缩又挂牌。',
          'example': 'short → shorter → the shortest；big → bigger → the biggest（重读闭音节双写末尾辅音）；happy → happier → the happiest（辅音字母 + y 变 i 再加 -er）；interesting → more interesting → the most interesting。',
          'pitfalls': [
            '单音节词和部分双音节词用 -er/-est，多音节词用 more/most，绝不混用',
            '最高级前必须加 the（副词最高级可省略 the）',
            '不规则变化要背：good/well → better → best，bad → worse → worst，many/much → more → most，little → less → least'
          ],
          'check': [
            {
              'stem': 'This book is ______ than that one.',
              'options': [
                'interesting',
                'more interesting',
                'most interesting',
                'the most interesting'
              ],
              'answer': 1,
              'explanation': 'than 提示比较级；interesting 是多音节词，前面加 more。'
            },
            {
              'stem': '用括号内单词的正确形式填空：The Yangtze River is the ______ (long) river in China.',
              'options': [
                'longer',
                'longest',
                'more long',
                'most long'
              ],
              'answer': 1,
              'explanation': 'in China 限定在三者以上范围内，用最高级 longest，前面加 the。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '三步定形式：先看比几个 → 再数音节 → 最后选 -er/-est 还是 more/most。',
          'problem': '为什么一遇到 happy、big 这类词就写错？因为只记了“加 -er”，没记拼写规则的三个例外。把规则想成三道关，就不会漏。',
          'analogy': '像换球衣号码：短名字直接加个小尾巴（tall → taller）；以 e 结尾的只加 -r（nice → nicer）；以“辅音 + y”结尾的先把 y 换成 i 再加（happy → happier）。',
          'example': 'nice → nicer → the nicest；big → bigger → the biggest；thin → thinner → the thinnest；easy → easier → the easiest。',
          'pitfalls': [
            '以 -e 结尾只加 -r/-st（nice → nicer，不是 niceer）',
            '重读闭音节且末尾只有一个辅音字母时，要双写该辅音（big → bigger）',
            '“辅音字母 + y”结尾先把 y 变 i（happy → happier）；y 前是元音则直接加（gay → gayer）',
            '不规则变化 good/well → better → best 用得最多，必背'
          ],
          'check': [
            {
              'stem': '用括号内单词的正确形式填空：This is the ______ (big) park in our city.',
              'options': [
                'biger',
                'bigger',
                'biggest',
                'most big'
              ],
              'answer': 2,
              'explanation': 'in our city 表三者以上范围，用最高级，重读闭音节双写 g。'
            },
            {
              'stem': 'Which of the following is NOT correct?',
              'options': [
                'nicer',
                'happier',
                'more taller',
                'easier'
              ],
              'answer': 2,
              'explanation': 'taller 已是比较级，不能再加 more。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8a-p9': [
        {
          'version': 1,
          'oneLiner': '两人比用 than，打平用 as...as，头几名用 one of the 最高级。',
          'problem': '这三种句型在选择题和填空题里出现得特别多。丢分通常不在单词上，而在句型搭配：该用原形的地方用了比较级，或者 one of 后面的 the 和名词复数漏掉了。',
          'analogy': '把比较想成球场上的比分牌。两队打一场，分出谁高谁低，这是一种比法。两队打成 3 比 3，谁也没高过谁，这是第二种比法。把全年级拉成一张排行榜，看排在最前面那几个，其中一个是第三种比法。',
          'example': '看三个短句。Tom is taller than Jack——两个人在比，taller 带 -er。Tom is as tall as Jack——打平，中间用原形 tall。Tom is one of the tallest boys in his class——排行榜头几名之一，the tallest 后面 boys 要加 s。',
          'pitfalls': [
            'as...as 中间夹的是原级，不能写成 as taller as，也不能夹最高级',
            'one of 后面要凑齐三样：the、最高级、名词复数，少一样都不对',
            'than 前后要比同类的东西，My bike is faster than Tom\'s 才是比车，写成 than Tom 就变成比人了'
          ],
          'check': [
            {
              'stem': 'My bike is ______ than Tom\'s.',
              'options': [
                'fast',
                'faster',
                'fastest',
                'the fastest'
              ],
              'answer': 1,
              'explanation': 'than 出现就提示比较级，fast 是短词，直接加 -er。'
            },
            {
              'stem': 'Basketball is one of ______ sports in our school.',
              'options': [
                'popular',
                'more popular',
                'the most popular',
                'most popular'
              ],
              'answer': 2,
              'explanation': 'one of 后面接 the 加最高级，popular 是多音节词，用 the most popular。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '谁强用 than，血条齐平 as…as，最强之一 one of 最高级。',
          'problem': '我一碰到 as…as 就懵：中间到底塞原形还是比较级？one of 后面又老忘 the，写成 one of biggest cities，叉了还找不到哪儿错。',
          'analogy': '把三种句型当成看游戏血条。两个角色叠一起比血条，谁长谁赢，这就是 than。两条血条一格不差、齐平，谁也没压过谁，这就是 as…as，中间那个词必须是原形，不能升级。要是把整个服务器的怪拉出来排一排，血条最厚的那几个里挑一个，这就是 one of the + 最高级——因为是从一堆里挑一个，后面名词得是复数。',
          'example': '两台血条：2 和 3。3 比 2 长 → B is taller than A，tall 加 -er。两台都 2 → A is as tall as B，两个 as 中间夹原形。全服 3 只 Boss 里血最厚的 1 只 → It\'s one of the biggest bosses，the + 最高级 + Boss 要带 s。',
          'pitfalls': [
            'as…as 中间夹的是原形，写成 as taller as，两个 as 会打架，中间那个词得保持出厂设置',
            'one of 后面是三件套：the、最高级、名词加 s，比如 one of the tallest boys，缺一件都算没拼完',
            'than 两边得比同一类东西，比血条就跟血条比，写成 than Tom\'s 才是在比车，写成 than Tom 就变成车跟人比了'
          ],
          'check': [
            {
              'stem': 'This box is as ______ as that one.',
              'options': [
                'heavy',
                'heavier',
                'heaviest',
                'the heaviest'
              ],
              'answer': 0,
              'explanation': 'as…as 中间夹原形，heavy 保持原样就行。'
            },
            {
              'stem': 'This is one of ______ games in 2024.',
              'options': [
                'good',
                'better',
                'the best',
                'best'
              ],
              'answer': 2,
              'explanation': 'one of 后面要 the 加最高级，good 的最高级是 the best。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8b-p1': [
        {
          'version': 1,
          'oneLiner': '名词管名字，代词管简称，数词管报人数；前面有具体数字就不加 s。',
          'problem': '名词、代词、数词是单选和填空里的常客。考法集中在两处：hundred 前面有具体数字时用单数、不加 of；以及 ours、yours、theirs 这类词单独使用，后面不跟名词。',
          'analogy': '像打球前点名分队。名词是球员的全名，book、Tom，喊谁就是谁。代词是场上的简称，it、they，不用一遍遍喊全名。数词是报人数，two hundred 就是「两百人」，前面已经报了 two，后面就不用再加 s。',
          'example': '报人数：three hundred students，前面有 three，hundred 不加 s，也不加 of。物主代词：These books are ours. ours 一个人就能顶一队，它等于 our books，后面不再跟名词。',
          'pitfalls': [
            'hundred、thousand 前有具体数字时用单数、不加 of：three hundred students，不是 three hundreds of students',
            '名词性物主代词后面不能再接名词：ours 就等于 our books，不能写成 ours books',
            '形容词性物主代词后面必须接名词才行：our books 可以，单独的 Our is new 不行'
          ],
          'check': [
            {
              'stem': '用括号内单词的正确形式填空：There are five ______ (hundred) books in the box.',
              'options': [
                'hundred',
                'hundreds',
                'hundreds of',
                'hundred of'
              ],
              'answer': 0,
              'explanation': 'five 是具体数字，hundred 用单数，也不加 of。'
            },
            {
              'stem': '用括号内单词的正确形式填空：This pen is ______ (she).',
              'options': [
                'her',
                'she',
                'hers',
                'herself'
              ],
              'answer': 2,
              'explanation': '句子后面没有名词，要用名词性物主代词 hers，等于 her pen。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '名字报全，代称报短，件数报一次，别叠着说。',
          'problem': '我一看到 two hundred 就懵：后面到底加不加 s、加不加 of？还有 ours 后面我总想再补个 books 才觉得完整。零件名和「它」混在一起的时候，我也容易乱。',
          'analogy': '像拼一盒乐高。名词是说明书上的零件全名，brick、Tom，指着谁就是谁。代词是不念全名时的代称，it、they，还有 ours 这种「那堆是我们的」，一句话就顶掉 our bricks。数词负责报件数：two hundred bricks，件数报一遍就够了，不用再重复一遍。',
          'example': '数乐高：two hundred bricks。two 已经把件数报完了，hundred 就光着站，不加 s 也不加 of。代词这头：Two bricks are ours。ours 自己就装着 our bricks 的意思，后面不再接 bricks。',
          'pitfalls': [
            '碰到 two、five 这种具体数字，后面的 hundred 保持单数就行，多写个 s 或 of 属于多加零件',
            'ours、yours、theirs 是能自己出门的，后面再跟名词会撞车，ours books 这种要放下',
            'our、their、my 这几个人必须后面带个名词才站稳，our bricks 成立，单独一个 Our is new 站不住'
          ],
          'check': [
            {
              'stem': 'There are ______ lego bricks on the floor.',
              'options': [
                'two hundreds',
                'two hundred',
                'two hundred of',
                'hundreds'
              ],
              'answer': 1,
              'explanation': 'two 是具体数字，hundred 用单数，后面也不加 of。'
            },
            {
              'stem': '用括号内单词的正确形式填空：That lego set is ______ (they).',
              'options': [
                'them',
                'their',
                'theirs',
                'themselves'
              ],
              'answer': 2,
              'explanation': '后面没有名词，用名词性物主代词 theirs，等于 their lego set。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8b-p10': [
        {
          'version': 1,
          'oneLiner': '被动语态 = be + 过去分词；时态的变化体现在 be 上，过去分词不动。',
          'problem': '很多人只记了“be + 过去分词”，却忘了 be 要跟着时态和人称变，也忘了判断句子主语是不是“被……”的一方。',
          'analogy': '像快递单：主动语态写“谁寄了包裹”（He sent the letter.）；被动语态写“包裹被寄出”（The letter was sent.）。主角从人换成了物。',
          'example': 'The classroom is cleaned every day.（一般现在时被动）／ The bridge was built in 1998.（一般过去时被动：was/were + 过去分词）',
          'pitfalls': [
            '时态全在 be 上：is cleaned（现在）、was cleaned（过去）、must be cleaned（情态）',
            '主语与谓语是被动关系才用被动语态；不及物动词（happen、appear）没有被动式',
            '过去分词不是过去式：write → written，build → built，see → seen',
            '主动语态变被动语态时，原宾语变主语，原主语由 by 引出（可省略）'
          ],
          'check': [
            {
              'stem': 'The classroom ______ every day.',
              'options': [
                'cleans',
                'is cleaned',
                'cleaned',
                'is cleaning'
              ],
              'answer': 1,
              'explanation': '教室是被打扫的，一般现在时被动语态为 is + 过去分词。'
            },
            {
              'stem': '用括号内动词的适当形式填空：The bridge ______ (build) in 1998.',
              'options': [
                'built',
                'is built',
                'was built',
                'builds'
              ],
              'answer': 2,
              'explanation': 'in 1998 提示一般过去时，桥是被建造，用 was built。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '两步定被动：主语是不是“被……”→ 是，就把动词换成 be + 过去分词。',
          'problem': '“中文没写被字，英语就用主动”——这是最常见的误判。判断依据不是中文有没有“被”，而是英语句子的主语和动词是不是被动关系。',
          'analogy': '像值日表：主动是“Tom 擦黑板”（Tom cleans the blackboard.）；被动是“黑板被擦”（The blackboard is cleaned.）。黑板自己动不了，所以只能用被动。',
          'example': 'The trees should be watered twice a week.（情态动词 + be + 过去分词）／ English is spoken in many countries.（一般现在时被动）',
          'pitfalls': [
            '情态动词的被动语态：情态动词 + be + 过去分词（must be finished）',
            '含“双宾语”的句子变被动有两种写法：I was given a book. / A book was given to me.',
            'happen、take place 等不及物动词没有被动语态'
          ],
          'check': [
            {
              'stem': 'The homework must ______ before Friday.',
              'options': [
                'finish',
                'be finished',
                'finished',
                'be finishing'
              ],
              'answer': 1,
              'explanation': '情态动词的被动语态是“情态动词 + be + 过去分词”。'
            },
            {
              'stem': 'The trees should be ______ twice a week.',
              'options': [
                'water',
                'watered',
                'watering',
                'waters'
              ],
              'answer': 1,
              'explanation': 'should be 之后接过去分词 watered。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8b-p11': [
        {
          'version': 1,
          'oneLiner': '情态动词后面永远接 be 加过去分词，be 不变形。',
          'problem': '这题考的是句子里加了 must、should、can 这类词之后，怎么改成被动。课本上的句子看着眼熟，一填空就容易写成 must finish 或者 should watered。单选择和句型转换都常考。',
          'analogy': '情态动词像球场边教练喊的话：must 是必须，should 是应该，can 是可以。喊的内容随便换，喊完那个动作都得穿同一套队服：be 加过去分词。所以是 must be finished，不是 must finish。',
          'example': '主动句 Someone must clean the room. 先把宾语 the room 提到句首。must 在原地不动。clean 穿上队服，变成 be cleaned。合起来就是 The room must be cleaned. 注意这里只写 be，不写 is、are。',
          'pitfalls': [
            '情态动词后面漏掉 be：must finish 是主动，must be finished 才是被动',
            '情态动词后面的 be 永远是 be，不写成 is、are、was：是 should be watered，不是 should are watered',
            '过去分词容易写错：规则动词忘加 -ed（water 到 watered），不规则动词要单独记（throw 到 thrown）'
          ],
          'check': [
            {
              'stem': 'These books can ______ to the library next week.',
              'options': [
                'return',
                'be returned',
                'returned',
                'be returning'
              ],
              'answer': 1,
              'explanation': 'can 是情态动词，后面要接 be 加过去分词，书是被还的。'
            },
            {
              'stem': '把 People should not throw rubbish here. 改成被动句：Rubbish ______ here.',
              'options': [
                'should not throw',
                'should not thrown',
                'should not be thrown',
                'should not be throwing'
              ],
              'answer': 2,
              'explanation': 'not 放在情态动词后面，throw 的过去分词是 thrown。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '情态动词只管表态度，活儿归谁干看后面的 be 加过去分词。',
          'problem': '我一看到 must、should、can，就顺手把动词原样抄进去，写完自己也觉得怪，可又说不上怪在哪。',
          'analogy': '情态动词像外卖订单上那句备注：必须送到、应该送到、可以送到。备注只负责态度，不干活。真正干活的是后面那辆车，车身上写的是 be 加过去分词。东西是被送出去的，所以永远是 must be delivered、should be delivered，不会写成 must deliver。',
          'example': '主动句 Someone should open 1 box. 把 1 box 搬到句首，should 留在原地不动，open 换成 be opened。合起来就是 1 box should be opened. 整句只出现 1 个 be，前面不用再补 is、are。',
          'pitfalls': [
            'must / should / can 后面直接跟动词原形，那是主动句；要被动就得在中间塞个 be：must finish 是主动，must be finished 才是被动。',
            'be 后面跟的是过去分词，不是原形也不是 -ing：写 should be watered，别写成 should be water 或者 should be watering。',
            'not 的位置容易站错，它跟在情态动词后面、be 前面：是 should not be thrown，不是 should be not thrown。'
          ],
          'check': [
            {
              'stem': 'This door should ______ at 9.',
              'options': [
                'lock',
                'locked',
                'be locking',
                'be locked'
              ],
              'answer': 3,
              'explanation': 'should 是情态动词，门是被锁的，后面要接 be 加过去分词 locked。'
            },
            {
              'stem': '把 Someone must pick 4 apples. 改成被动句：4 apples ______.',
              'options': [
                'be picked',
                'picked',
                'be picking',
                'pick'
              ],
              'answer': 0,
              'explanation': 'must 后面接 be 加过去分词，4 apples 是被摘的，所以是 be picked。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8b-p12': [
        {
          'version': 1,
          'oneLiner': '过去完成时：had 加过去分词，表示过去的过去。',
          'problem': '它解决过去两个动作谁先谁后的问题。考试常给 when、by the time 等时间线，让你判断哪个动作更早，再填 had done。判断慢一步就会掉坑。',
          'analogy': '像打游戏：你晚上被老妈收手机，这是过去的动作；但收手机前你已经偷偷存了档。讲这件事时，收手机用一般过去时，存档发生在更早，就得用过去完成时。过去完成时就是那个比过去还早的存档点。',
          'example': 'When I got to the court, the game had started. 我到球场是过去，比赛开始比它更早，所以用 had started。构成：had 对所有人称都不变，后面接 start 的过去分词 started。否定是 hadn\'t started，疑问是 Had the game started?',
          'pitfalls': [
            '两个动作都在过去时，先发生的用 had done，后发生的用一般过去时，不能两个都用过去式',
            'had 后面必须接过去分词，不是过去式，比如 had went 是错的，要用 had gone',
            '别看到 when 就乱套 had，先找参照点：更早的那个动作才用 had done'
          ],
          'check': [
            {
              'stem': 'I ______ my homework before my dad ______ home.',
              'options': [
                'finished; got',
                'had finished; got',
                'finished; had got',
                'had finished; had got'
              ],
              'answer': 1,
              'explanation': '写作业更早，用 had finished；爸爸到家是后发生的过去动作，用 got。'
            },
            {
              'stem': '______ you ______ the door before you left?',
              'options': [
                'Did; lock',
                'Have; locked',
                'Had; locked',
                'Had; lock'
              ],
              'answer': 2,
              'explanation': '疑问句把 had 提前，后面用过去分词 locked；锁门发生在离开之前。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '站在过去回头看，比它更早那件事，就得用 had 加过去分词。',
          'problem': '我一看到句子里冒出俩过去的动作就懵：到底哪件事先发生?had 该往哪儿塞?塞错了整句就废。',
          'analogy': '像查快递物流。你今早点开APP,上面写着「昨天下午已签收」。你点开APP的那一刻是过去,签收比你查件更早,所以签收这件事得用 had + 过去分词。物流页面只显示一个时间点,过去完成时是硬生生往回倒一格,把更早那件事单独标出来。',
          'example': 'I went out for 1 minute. When I came back, my parcel had gone. 出去1分钟是过去,包裹被拿走发生在更早,所以用 had gone。构成:had 对所有人称都不变,后面接过去分词 gone;否定 hadn\'t gone;疑问 Had it gone?',
          'pitfalls': [
            '两个动作都在过去时,只有更早的那个才吃 had done,后发生的那个老老实实用一般过去时——顺手两个都套 had 是常见翻车点。',
            'had 后面跟的是过去分词,不是过去式。had went、had ate 读着顺,但不对,得换成 had gone、had eaten。',
            '看到 when、by the time 先别急着填 had,先定参照点:哪件是后发生的,剩下更早的那件才轮到 had 上场。'
          ],
          'check': [
            {
              'stem': 'When we got to the station, the train ______ already ______.',
              'options': [
                'has; left',
                'had; left',
                'have; left',
                'was; leaving'
              ],
              'answer': 1,
              'explanation': '到车站是过去,火车开走比它更早,用 had + 过去分词 left。'
            },
            {
              'stem': 'By the time I turned on the TV, the match ______.',
              'options': [
                'started',
                'has started',
                'had started',
                'was started'
              ],
              'answer': 2,
              'explanation': '开电视是过去,比赛开始更早,用 had started。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8b-p13': [
        {
          'version': 1,
          'oneLiner': '先发生的用 had done，后发生的用 did，先后别写反。',
          'problem': '这类题常出现在 when、before、after、by the time 引导的句子里。两个动作都发生在过去，考的不是形式，而是谁先谁后。丢分多半是因为没先判断顺序就急着选词。',
          'analogy': '像看球赛回放。一个进球其实是两件事：队友先把球传过来，你再射门。解说会说，在你射门之前，球已经被传过来了。英语也一样：更早那层用 had done，更晚那层用 did。早的那件事，要用“更过去的过去”来说。',
          'example': '最短的例子：我到家。他走了。合成一句就是 When I got home, he had left。他走得更早，用 had left；我到家更晚，用 got。如果写成 When he left, I had got home，先后就被说反了。',
          'pitfalls': [
            '两个动作都在过去，只把更早的那个用 had done，另一个老老实实用一般过去时，别两个都加 had',
            '看到 before、after、by the time 先别急着选，先在心里排出谁先谁后，再决定哪个动词用 had done',
            'had 后面必须跟过去分词，写完检查一眼：had left、had finished 对，had went、had saw 是错的'
          ],
          'check': [
            {
              'stem': 'By the time I got to the court, the match ______.',
              'options': [
                'starts',
                'started',
                'had started',
                'has started'
              ],
              'answer': 2,
              'explanation': '比赛开始在我到场之前，更早的动作要用 had started。'
            },
            {
              'stem': 'Tom ______ his ticket before he got on the train.',
              'options': [
                'buys',
                'had bought',
                'bought',
                'has bought'
              ],
              'answer': 1,
              'explanation': '买票在上车之前，更早的动作是 had bought，上车用 got。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '早一步的加 had，晚一步的才用过去式。',
          'problem': '我一看 when、before 里两个动作都在过去，就懵：到底哪个加 had？',
          'analogy': '像外卖配送。0 点商家接单，1 点骑手送到。你站在 1 点回头看，接单发生在更早；接单那层用 had done，送到那层用 did。早的那件，被放进“更早的过去”。',
          'example': '0 点我付了钱，1 点外卖到了。合成：When the food arrived at 1, I had paid at 0。付钱更早，用 had paid；外卖到更晚，用 arrived。反过来写，先后就乱了。',
          'pitfalls': [
            '时间线先标 0 和 1，0 那件事用 had done，1 那件事用 did。',
            '过去完成时只负责标“更早”，后发生那句别跟着加 had。',
            'had 后面接过去分词，写完顺手核对 had paid、had left 这种形式。'
          ],
          'check': [
            {
              'stem': 'After Lily ______ her snack, she ______ the game.',
              'options': [
                'finished; had started',
                'had finished; started',
                'has finished; started',
                'finished; started'
              ],
              'answer': 1,
              'explanation': '吃零食在开始游戏之前，更早动作用 had finished，开始游戏更晚用 started。'
            },
            {
              'stem': '过去完成时标出的动作，在时间线上比另一个过去动作 ______。',
              'options': [
                '更晚',
                '同时',
                '更早',
                '在现在之后'
              ],
              'answer': 2,
              'explanation': '它表示“过去的过去”，也就是比另一个过去动作更早。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8b-p14': [
        {
          'version': 1,
          'oneLiner': '推理看线索，猜词看上下句，答案都得自己推。',
          'problem': '阅读题里有两类题不给你现成答案：一类问人物心情或态度，一类问一个生词的意思。它们几乎每篇阅读都会出现，丢分常常是因为选了原文根本没说的内容。',
          'analogy': '像你第一次玩一个没玩过的游戏。屏幕上没写这个怪怕什么，但你看到队友都拿火把打它，你自己就能推出来。阅读也一样：句子里没有直接写的信息，得靠它前后的线索去推。线索是谁给的，答案就跟谁走。',
          'example': 'Ben is a generous boy. He always shares his snacks with us. 前面不认识 generous，但后面 shares his snacks 就是线索，能推出是“大方的”。再看：Tom read the note and ran to the door quickly. 原文没说 Tom 急，但 ran quickly 说明他很急。',
          'pitfalls': [
            '不要用自己的生活经验或常识去替换原文信息，推断必须能在文中找到依据',
            '猜词不要只看单词长得像哪个词，要看它前面和后面的句子给了什么线索',
            '选项里照抄原文原句的往往是干扰项，推断题的正确答案一般不在文中原样出现'
          ],
          'check': [
            {
              'stem': 'Alex looked at the basketball match on TV. Then he turned it off and went to his room without a word. He did not want to talk to anyone. How did Alex feel?',
              'options': [
                'Excited',
                'Upset',
                'Hungry',
                'Tired'
              ],
              'answer': 1,
              'explanation': '关电视加一句话不说，说明他心情不好，是难过失望。'
            },
            {
              'stem': 'Read and guess: The old dog is very gentle. It never barks at people and lets the children touch it. What does "gentle" mean?',
              'options': [
                'quiet and kind',
                'big and strong',
                'fast and noisy',
                'dirty and lazy'
              ],
              'answer': 0,
              'explanation': 'never barks 和让孩子摸，说明它安静温和。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '答案藏在句子缝里，先划线索再选。',
          'problem': '我每次碰到问心情和问生词，扫一眼就懵，只能凭感觉选，结果老掉坑。',
          'analogy': '像打游戏看血条：角色没说‘我不行了’，但血条闪红、动作变慢，你就知道状态差。阅读里，问心情就看动作和语气这些‘血条’；问生词，就看它前后句子给的‘状态说明’。',
          'example': '看这句：Sam checked his wallet—0 yuan left—and sighed. 0 元 + 叹气，不用写 sad，也能推出心情差。再看：A night owl is a person who sleeps late. is 后面直接给解释，night owl 就是熬夜的人。',
          'pitfalls': [
            '问心情时，别急着选‘生气/难过’这种大词，先把原文里的动作、表情、说的话圈出来，再对照选项。',
            '猜生词时，别只盯这个词本身，先找它后面有没有 is、means、or、举例这类解释信号。',
            '两个选项都像时，选和上下句最贴、范围刚好的那个；照抄原词的选项不一定就是答案。'
          ],
          'check': [
            {
              'stem': 'Nina saw her ice cream fall on the ground. She looked at it and walked away slowly. How did Nina feel?',
              'options': [
                'Glad',
                'Disappointed',
                'Scared',
                'Hungry'
              ],
              'answer': 1,
              'explanation': '冰淇淋掉了加慢慢走开，说明她失望。'
            },
            {
              'stem': 'A lion is a carnivore. It kills other animals and eats their meat. What does carnivore mean?',
              'options': [
                'meat eater',
                'plant eater',
                'water animal',
                'fast runner'
              ],
              'answer': 0,
              'explanation': 'kills 和 eats meat 说明 carnivore 是吃肉的动物。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8b-p15': [
        {
          'version': 1,
          'oneLiner': '句子之间要卡扣，连接词选对，整段才立得住。',
          'problem': '书面表达里，每个句子都对，连起来却像报流水账，分数就卡在那。常见考法是选连接词填空，或判断哪一句接在后面最连贯。这一步顺了，作文能上一个档。',
          'analogy': '拼乐高时，两块积木要卡扣咬住才结实。零件再全，你只把它们排成一排不卡，一碰就散。连接词就是那个卡扣：它不加新零件，只让前后两块咬在一起，句子的先后、举例、转折就都出来了。',
          'example': '写我的周末：I like basketball. I play it after school. 两句都对，可各说各的。加一个 Also 就接上了。想举例子，用 For example；想转个弯，用 However；收尾时用 Finally。句子没变，桥搭上了。',
          'pitfalls': [
            '连接词只用 and 撑满全文，该举例、该转折、该收尾的地方全空着，段落平得像一条直线',
            '逻辑对不上：该举例的地方用 However，该转折的地方用 For example，连接词和句子打架',
            '书信开头写成 Hello everyone 或 My name is Tom，而不是 Dear Tom,，格式一错，后面的连贯也白搭'
          ],
          'check': [
            {
              'stem': 'My brother likes ball games. ______, I like reading at home.',
              'options': [
                'For example',
                'However',
                'At last',
                'In my opinion'
              ],
              'answer': 1,
              'explanation': '前半句说哥哥爱打球，后半句说自己爱在家看书，意思相反，用 However 转折。'
            },
            {
              'stem': 'Here are three steps. ______, wash your hands. Then, put on the gloves. Finally, mix them.',
              'options': [
                'However',
                'First',
                'For example',
                'In my opinion'
              ],
              'answer': 1,
              'explanation': '后面跟着 Then 和 Finally，开头要用 First，步骤才有先后的顺序。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '句子单看都对，接不上就白搭——接口在连接词。',
          'problem': '我作文一句一句都没错，老师却批「不连贯」；一做到选连接词的题我就懵：For example、However、At last 都认识，可每个空放进去好像都行，最后只能瞎蒙一个。',
          'analogy': '点外卖能送到你家，靠的是一棒一棒的交接：商家出餐 → 骑手取餐 → 送到门口。菜没变，是这些交接点让整条路走得通。连接词就是句子的交接点：它不添新句子，只让上一句和下一句接得住，顺接、举例、转折、收尾全看它。',
          'example': '写「我的书包」：My bag is old. It is useful. 两句都对，中间空着。补 1 个 but 就接上了：My bag is old, but it is useful. 全文 3 句，接口只有 2 个：句 1 到句 2 是转折，句 2 到句 3 是并列。做题前先数接口，再想这里是顺着、反着，还是举例子，词就自己冒出来了。',
          'pitfalls': [
            '填连接词之前先读前后两句的意思：是顺着的、反着的，还是举例。意思没对上，词背得再熟也容易跑偏。',
            'and 用顺手了会一路 and 到底，段落读起来是一条平的线。遇到该转折、该收尾的地方，留个空给自己停一下。',
            '书信开头记得是 Dear + 名字，Hello everyone 那种是讲给一群人的。格式和连贯是一起被打分的，两个都顺手再看一遍。'
          ],
          'check': [
            {
              'stem': '你给刚认识的笔友写第一封信，开头最合适的一项是：',
              'options': [
                'Hello, everyone,',
                'My name is Tom.',
                'Dear Jack,',
                'At last, I write to you.'
              ],
              'answer': 2,
              'explanation': '信是写给一个人看的，开头要用 Dear + 对方名字，书信格式才对。'
            },
            {
              'stem': 'I love our school. ______, we have a big library and a new playground.',
              'options': [
                'However',
                'In my opinion',
                'For example',
                'At last'
              ],
              'answer': 2,
              'explanation': '后一句在摆出具体的例子，用 For example 引出正好接上。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8b-p16': [
        {
          'version': 1,
          'oneLiner': '听力数字题：原文报的是开球时间，题目问的是到场时间。',
          'problem': '这类题常出现在听力单选和填表题里。它考的不是听懂每个词，而是能不能抓住时间、价格、人数，再按提前、推迟、多、少这些动作算一步。丢分经常就丢在这一步没算。',
          'analogy': '像约球：群里说 3 点开打，队长又补一句“提前 1 小时到，先热身”。你真正要出现在场上的时间是 2 点。听力数字题也一样，原文给的是开球时间，题目问的是到场时间，中间隔着一个“提前 / 推迟”的小动作，得自己算一步。',
          'example': '听到：The match starts at 3 and we should get there one hour early. 问几点到场？3 减 1 等于 2，答 2 点，不是 3 点。再看转述：听到 two boys and three girls，问女生几个，答 three，不是 two。',
          'pitfalls': [
            '听到第一个数字就选，漏掉 early、late、before、after、delay 这类动作词',
            '十几和几十听混：-teen 重音在后、音更长，-ty 重音在前，fifteen 不是 fifty',
            '题目问的是另一项（问女生却答男生数），没听清问的是哪一类就动笔'
          ],
          'check': [
            {
              'stem': '听到：The train leaves at 8 a.m. and it takes us one hour to get to the station. When should we leave home?',
              'options': [
                '6 a.m.',
                '7 a.m.',
                '8 a.m.',
                '9 a.m.'
              ],
              'answer': 1,
              'explanation': '8 点发车，路上要 1 小时，所以 7 点出门，比 8 点早一步。'
            },
            {
              'stem': '听到：Our class meeting is on the fifteenth of June. When is the class meeting?',
              'options': [
                '6月5日',
                '6月15日',
                '6月25日',
                '6月50日'
              ],
              'answer': 1,
              'explanation': 'fifteenth 是第十五，-teen 结尾表示十几，不是 5 号也不是 50。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '听力报的是原始数，题干要的是算完那个数。',
          'problem': '我听到数字就赶紧记下来，等题目一问“那到底几点、到底几个”，我就懵：直接用刚听到的那个数，还是得再加减一下？',
          'analogy': '像打游戏看血条：屏幕上写着满血 4 条，怪打你一下掉 1 条，你要盯的不是那个 4，而是打完还剩几条。听力也一样，原文报的是“原始数”，题目问的是“算完之后那个数”——那一步加减没别人替你按，得你自己按下去。',
          'example': '听到：The boss has 4 health bars and your hit takes 1 away. 问还剩几条血？4 减 1 等于 3，答 3，不是 4。转述题同理：听到 three snacks and one is mine，问说话人有几份，答 one，不是 three。',
          'pitfalls': [
            'half past 3 是 3:30、a quarter to 3 是 2:45，这类说法不是报整数点，听到后先在心里换算再选',
            '加减方向容易反：early、before 是往前减，late、after、delay 是往后加，脑子里顺序一乱答案就倒过来了',
            '数字后面常跟着单位或名词，two hours 说的是时长、two o\'clock 说的是时刻，两个都不能丢'
          ],
          'check': [
            {
              'stem': '听到：The concert starts at 4 p.m. and the doors open one hour early. When do the doors open?',
              'options': [
                '2 p.m.',
                '3 p.m.',
                '4 p.m.',
                '5 p.m.'
              ],
              'answer': 1,
              'explanation': '4 点开场，门提前 1 小时开，4 减 1 得 3 点。'
            },
            {
              'stem': '听到：I have two brothers and three sisters. How many sisters does the speaker have?',
              'options': [
                'Two',
                'Three',
                'Four',
                'Five'
              ],
              'answer': 1,
              'explanation': '问的是 sisters，原文报 three sisters，two 是兄弟数，不加进来。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8b-p2': [
        {
          'version': 1,
          'oneLiner': '同一个动词换个小词，意思完全变；先看小词再选。',
          'problem': '动词短语的失分点：同一个 take / turn / put，后面跟 out、off、up 就换成另一个意思。这题确实绕，考题常把四个搭配摆一起让你选。',
          'analogy': '像打游戏选英雄皮肤：take 是同一个英雄，后面加 out 就变成“拿出”技能，加 off 就变成“脱下/起飞”技能。皮肤不一样，技能完全不一样。你不能只看英雄名字，要看它带了哪件装备。',
          'example': '用最小数字：Turn off the TV. 关电视。Turn on the light. 开灯。Take out your pen. 拿出笔。Put on your shoes. 穿上鞋。同一个 turn，off 和 on 意思相反。',
          'pitfalls': [
            '只看动词不看小词：take out 和 take off 完全是两回事，别只看到 take 就选。',
            'turn on 和 turn off 别记反：on 是开，off 是关。',
            '中文直译容易错：put off 不是“放下”，是“推迟”；put away 是“收好”。'
          ],
          'check': [
            {
              'stem': 'It\'s cold outside. ______ your coat before you go out.',
              'options': [
                'put on',
                'put off',
                'put away',
                'put up'
              ],
              'answer': 0,
              'explanation': '外面冷，出门前要穿上外套，put on 表示穿上。'
            },
            {
              'stem': 'The plane will ______ in five minutes. Please sit down.',
              'options': [
                'take out',
                'take off',
                'take away',
                'take up'
              ],
              'answer': 1,
              'explanation': '飞机起飞用 take off。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '动词是骑手，小词是地址；送到哪，意思就变哪。',
          'problem': '我一看 take out、take off、turn on 摆一排就懵——每个单词都认识，凑一块儿就不知道点哪个。',
          'analogy': '像点外卖：take 是那个骑手，out / off 是收货地址。同一个骑手，地址填成 3 号门，送来的是「拿出来」；填成 7 号门，送来的是「脱下 / 起飞」。骑手没换，签收的货完全不一样。所以别光盯骑手叫什么，先看地址填的是哪个小词。',
          'example': '数字小一点：0 单——Take out 1 book. 拿出 1 本书。2 单——Turn off 2 lights. 关 2 盏灯。Put on 1 cap. 戴上 1 顶帽子。同一个动词，小词一换，动作跟着换。',
          'pitfalls': [
            '先扫一眼小词再选，别看到 take 就随手点——out 是拿出来，off 是脱下 / 起飞，两码事。',
            'on / off 容易记反：on 是开、是穿，off 是关、是脱。开考前默一遍就稳了。',
            '中文直译会坑人：put off 不是「放下」，是「推迟」；put away 才是「收好」。看着像，其实两个意思。'
          ],
          'check': [
            {
              'stem': 'It\'s time for homework. ______ your notebook and your pen.',
              'options': [
                'take out',
                'take off',
                'take up',
                'take away'
              ],
              'answer': 0,
              'explanation': '写作业要把本子和笔拿出来，take out 就是拿出。'
            },
            {
              'stem': 'Before you go to bed, ______ the lights, please.',
              'options': [
                'turn off',
                'turn on',
                'turn up',
                'turn down'
              ],
              'answer': 0,
              'explanation': '睡觉前要把灯关掉，turn off 表示关闭。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8b-p3': [
        {
          'version': 1,
          'oneLiner': '-ing形容事，-ed形容人；副词加-ly修饰动作。',
          'problem': '这题解决 -ed 和 -ing 形容词分不清、副词与形容词混用的问题。考试常在选词填空、用括号词填空中考，句子一出现 interesting 或 happy 这类词就容易丢分。',
          'analogy': '就像打游戏掉宝箱：宝箱本身是令人兴奋的，你作为玩家是感到兴奋的。宝箱不会感到兴奋，你也不会让人兴奋。再看你的操作：你开心地按技能，这个开心地是副词，用来修饰按这个动作。',
          'example': 'The game is exciting. I am excited. He plays happily. 这里 game 是物，用 exciting；I 是人，用 excited；plays 是动作，用副词 happily。三个词各管各的，别串岗。',
          'pitfalls': [
            '人的感受用 -ed，物的性质用 -ing；写成 I am interesting 意思就变成我很有趣。',
            '修饰动作要用副词，别用形容词；但 look、feel、sound 后面接形容词表示状态，如 look happy。',
            '形容词变副词不都是直接加 -ly：happy 变 happily，easy 变 easily；good 变 well 要单独记。'
          ],
          'check': [
            {
              'stem': 'The new game is ______. All my classmates are ______ about it.',
              'options': [
                'excited; exciting',
                'exciting; excited',
                'exciting; exciting',
                'excited; excited'
              ],
              'answer': 1,
              'explanation': 'game 是令人激动的事物，用 -ing；classmates 是人，感到激动用 -ed。'
            },
            {
              'stem': '用括号内单词的正确形式填空：The kids played ______ (happy) in the water.',
              'options': [
                'happy',
                'happily',
                'happiness',
                'happier'
              ],
              'answer': 1,
              'explanation': 'played 是动作，修饰动作要用副词 happily。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '东西害你掉血用-ing，你掉血用-ed；动作加-ly。',
          'problem': '我一碰到一句话里挖两个空——一个空说东西、一个空说我——就懵，-ed 和 -ing 得在脑子里转半天才敢下笔。再遇到 play ___ (happy)、run ___ (quick) 这种括号题，我又不知道该加 -ly 还是直接抄原形。选词填空和用括号词填空，基本都栽在这。',
          'analogy': '打 Boss 的时候你眼睛死盯血条：Boss 那个技能是「让人掉血」的家伙，它自带 -ing，The skill is annoying；血条一路往下掉的是你，所以你自己用 -ed，I am annoyed。技能永远不觉得烦，烦的只能是你。副词是另一条线：你按闪避键那一下，是你在「狼狈地」闪——闪这个动作本身不烦不烦的，它只需要一层 -ly 的皮，You dodge awkwardly。一句话：-ing 是加害方，-ed 是受害方，-ly 挂在动作上。',
          'example': '0 秒开团，Boss 放技能 → The skill is boring（-ing 说技能）。1 个你被磨血 → I am bored（-ed 说你）。你 2 秒闪走 → You dodge quickly（-ly 说闪）。3 个空各管各的词，谁也别抢谁的岗。',
          'pitfalls': [
            '掉血的从来是你，不是 Boss：写成 The boss is bored，意思就变成 Boss 自己无聊了。',
            '形容词别硬塞到动词屁股后面：run happy 不通，得 run happily；但 look、sound、feel 说的是「看起来、听起来」的状态，后面直接跟形容词，look happy 是对的。',
            '变副词时拼写会动手脚：happy → happily（y 换 i 再加 -ly），good 不走这条路，直接变 well，只能单独记住。'
          ],
          'check': [
            {
              'stem': 'The match was ______, and all the fans were ______.',
              'options': [
                'boring; bored',
                'bored; boring',
                'boring; boring',
                'bored; bored'
              ],
              'answer': 0,
              'explanation': '比赛是让人无聊的东西用 -ing，球迷是人、感到无聊用 -ed。'
            },
            {
              'stem': '用括号内单词的正确形式填空：He ran ______ (quick) to get his package.',
              'options': [
                'quick',
                'quicker',
                'quickly',
                'quickness'
              ],
              'answer': 2,
              'explanation': 'ran 是动作，修饰动作要用副词 quickly。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8b-p4': [
        {
          'version': 1,
          'oneLiner': '现在完成时 = have/has + 过去分词，表示“过去发生、和现在有关”。',
          'problem': '最大的坑是把 now、since、for 这类和现在有关的词与一般过去时混用。判断标准：这件事是不是还“影响到现在”？是，就用现在完成时。',
          'analogy': '像购物小票：一般过去时只记录“什么时候买的”（买完就归档）；现在完成时拿着小票说“我现在有这件东西”——过去的事，当下的结果。',
          'example': 'I have already finished my homework.（现在可以玩了）／ She has lived in Beijing for ten years.（现在还住着）',
          'pitfalls': [
            '第三人称单数用 has，其余用 have，后面一律接过去分词',
            '常见标志：already、yet、ever、never、just、since、for、so far、twice',
            '不能与 yesterday、last week、in 2019 等明确过去时间连用（这些要用一般过去时）',
            '过去分词的拼写要背：finish → finished，go → gone，see → seen，be → been'
          ],
          'check': [
            {
              'stem': 'I ______ already ______ my homework.',
              'options': [
                'have; finished',
                'has; finished',
                'have; finish',
                'am; finishing'
              ],
              'answer': 0,
              'explanation': '主语 I 用 have，already 之后用过去分词 finished。'
            },
            {
              'stem': '用括号内动词的适当形式填空：She ______ (live) in Beijing for ten years.',
              'options': [
                'lives',
                'lived',
                'has lived',
                'is living'
              ],
              'answer': 2,
              'explanation': 'for ten years 表示持续到现在，用 has + lived。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '一句话判断：能不能问“到现在为止”？能，就用现在完成时。',
          'problem': '一看到“了”“过”就写现在完成时，结果和 yesterday 撞车。记住两条红线：明确过去时间 → 一般过去时；从过去延续到现在 → 现在完成时。',
          'analogy': '像查账本：现在完成时是从“过去某一点”拉到“今天”的一条线（有没有、多少年）；一般过去时是账本上一个封闭的点（哪一天做的）。',
          'example': 'I lost my keys yesterday.（封闭的过去点）／ I have lost my keys, so I can\'t open the door.（影响到现在）／ I have just finished the book.',
          'pitfalls': [
            'have been to（去过，已回来）与 have gone to（去了，还没回）要分清',
            '瞬间动词不能与 for/since 连用：不说 has died for three years，要说 has been dead for three years',
            'since 后接时间点，for 后接时间段',
            'yet 用于否定句和疑问句，already 用于肯定句'
          ],
          'check': [
            {
              'stem': 'I ______ my keys yesterday, but now I ______ them.',
              'options': [
                'lost; have found',
                'have lost; found',
                'lost; found',
                'have lost; have found'
              ],
              'answer': 0,
              'explanation': 'yesterday 用一般过去时，now 提示对现在的影响用现在完成时。'
            },
            {
              'stem': 'The sentence "I have seen that film last week." is ______.',
              'options': [
                'correct',
                'wrong, because last week needs the past simple',
                'wrong, because of the verb',
                'correct in British English'
              ],
              'answer': 1,
              'explanation': '明确过去时间状语只能与一般过去时连用。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8b-p5': [
        {
          'version': 1,
          'oneLiner': '一般过去时说什么时候做的，现在完成时说现在怎么样了。',
          'problem': '这类题考查的是：一个句子里到底有没有明确的过去时间，以及说话人重不重在讲现在的结果。单选、动词填空、句子改错都爱考，权重很高，绕就绕在两种时态都能译成中文的过去。',
          'analogy': '像打游戏存档。一般过去时是截图，截图上有时间：哪天哪一局你打赢了。现在完成时是存档状态，不说什么时候打的，只看现在这个账号里那把武器还在不在、等级还在不在。句子给了时间就截图，没给时间、只说现在的结果就存状态。',
          'example': '昨天丢钥匙，现在找到了。前半句有 yesterday，用过去时：I lost my keys yesterday. 后半句有 now，讲现在的结果：I have found them. 两个动作各配一个时间信号，一个句子里也能各用各的，互不冲突。',
          'pitfalls': [
            '句子里有 yesterday、last week、in 2020、just now 这类明确过去时间，只能用一般过去时',
            '现在完成时不能和具体过去时间状语同框，I have seen that film last week 是错的，要改成 saw',
            '没有具体时间、重点落在现在的状态或结果上，才用现在完成时，不要见过去的事就一律用完成时'
          ],
          'check': [
            {
              'stem': '— Where is your bike? — I ______ it to my cousin last Sunday.',
              'options': [
                'lend',
                'lent',
                'have lent',
                'have lend'
              ],
              'answer': 1,
              'explanation': 'last Sunday 是明确的过去时间，只能用一般过去时 lent。'
            },
            {
              'stem': 'My brother ______ his homework already, so he can go out and play.',
              'options': [
                'finishes',
                'finished',
                'has finished',
                'have finished'
              ],
              'answer': 2,
              'explanation': 'already 加上 so he can go out 都指向现在的结果，用现在完成时；主语是第三人称单数，用 has。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '一般过去时看当时那一刀，现在完成时看现在血条剩多少。',
          'problem': '我一看就懵：一句话里又提昨天、又说现在，两个空到底谁填过去时谁填完成时？选择题、动词填空、句子改错都爱这么挖坑，权重还不低。',
          'analogy': '这个像点外卖。骑手几点下的单、几点送到，订单记录上写得清清楚楚，那是时间戳，用一般过去时。可你要是只想知道「外卖现在到了没」，压根不问几点下的单，那就是现在完成时：它管的是现在这个状态，不是当时那个动作。所以有具体时间点就翻订单记录（过去时），没时间点、只看现在到没到，就上完成时。',
          'example': '昨天下午 2 点我点了 1 份外卖：I ordered takeout at 2 pm yesterday，有时间点，用过去时。现在外卖到了：It has arrived，没提几点送到的，只说眼下到了，用完成时。两个动作、两个时间信号，各配各的时态，塞进一个句子里也不打架。',
          'pitfalls': [
            '句子里一旦冒出 yesterday、last week、just now、in 2020 这类明确过去时间，就只剩一般过去时这一条路，别硬塞完成时进去。',
            '现在完成时跟具体过去时间点是没法同框的，I have seen that film last week 这种写法，判卷老师看到基本就划掉了。',
            '没给时间、重点落在「现在怎么样了」，这时候才轮到现在完成时登场；别看到是过去发生的事就一律套完成时。'
          ],
          'check': [
            {
              'stem': '— Why is your bag open? — I ______ my wallet on the bus this morning, but I ______ it back now.',
              'options': [
                'lost; have got',
                'have lost; got',
                'lost; got',
                'have lost; have got'
              ],
              'answer': 0,
              'explanation': 'this morning 是明确过去时间，用 lost；now 讲的是现在的结果，用 have got。'
            },
            {
              'stem': 'Which of the following sentences is correct?',
              'options': [
                'I have seen him yesterday.',
                'I saw him yesterday.',
                'I have saw him yesterday.',
                'I saw him since yesterday.'
              ],
              'answer': 1,
              'explanation': 'yesterday 是明确的过去时间，只能配一般过去时 saw。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8b-p6': [
        {
          'version': 1,
          'oneLiner': '四个词夹在 have 和过去分词中间，只有 yet 站句末。',
          'problem': '这几个副词放在现在完成时的哪个位置，直接决定选择题和填空题的对错。yet 是唯一站在句末的那个，也是出题人最爱设陷阱的地方，位置记牢这类题就稳。',
          'analogy': 'have/has 和过去分词是两块必须咬在一起的乐高积木，already、ever、never、just 是夹在缝里的薄片，位置固定在那条缝里。yet 不一样，它像贴在整句话末尾的标签，专门贴在否定句和疑问句的尾巴上。',
          'example': 'I have just finished my homework：have 后面先放 just，再放过去分词。Have you ever been to Taishan? ever 也夹在中间。I have never been there. never 同样在中间。I haven\'t finished yet. 只有 yet 跑到句末。',
          'pitfalls': [
            'already、ever、never、just 放在 have/has 和过去分词之间，别丢到句末',
            'yet 只站句末，用在否定句和疑问句里，不插进 have 和过去分词中间',
            'ever 用在疑问句里问曾经，never 本身就带否定意思，前面不再加 not'
          ],
          'check': [
            {
              'stem': '下面哪个句子的位置是对的？',
              'options': [
                'She has never seen a panda.',
                'She never has seen a panda.',
                'She has seen never a panda.',
                'She has seen a panda never.'
              ],
              'answer': 0,
              'explanation': 'never 要夹在 has 和过去分词 seen 中间。'
            },
            {
              'stem': 'I haven\'t read this book ______.',
              'options': [
                'already',
                'ever',
                'yet',
                'just'
              ],
              'answer': 2,
              'explanation': '否定句里表示还没做，用 yet，放在句末。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '四个词挤中间那格，yet 独自站队尾。',
          'problem': '我一看题就懵：already、ever、never、just 在我脑子里长得差不多，yet 还老想往中间钻，到底谁站哪儿我每次都靠猜。',
          'analogy': '把一句话当成一单外卖。have/has 是下单那一栏，过去分词是送达那一栏，already、ever、never、just 就是夹在这两栏中间的那一小行备注，位置是钉死的，写完下单就写备注，再写送达。yet 不一样，它不是备注，它是贴在整张单最下面那条的「还没送到」贴纸——只有「没送到」（否定句）和「送到了吗」（疑问句）这两种单子才会贴它，所以它永远待在句尾。',
          'example': '① I have just lost 1 game.（刚输 1 局，just 夹在 have 和 lost 中间）② Have you ever won 2 games?（赢过 2 局没，ever 也夹中间）③ I have never won 3.（3 局一次没赢，never 同样夹中间）④ I haven\'t won yet.（还没赢，yet 跑到句尾去了）',
          'pitfalls': [
            'already、ever、never、just 都写在 have/has 和过去分词中间那一格，写完顺手把它拖到句尾的毛病挺常见，落笔前多扫一眼位置。',
            'yet 只贴在句尾，最常出现在前面有 not 或者句末是问号的时候，中间那格留给另外四个词。',
            'ever 是问「有没有过」，never 本身已经含否定，写成 haven\'t never 就等于否了两次，这种坑容易踩，写前停半秒看一眼有没有多余的 not。'
          ],
          'check': [
            {
              'stem': 'Have you ______ eaten durian?',
              'options': [
                'yet',
                'ever',
                'already',
                'never'
              ],
              'answer': 1,
              'explanation': '疑问句问「有没有过」，中间那格用 ever。'
            },
            {
              'stem': 'I have ______ finished my noodles, so let\'s go.',
              'options': [
                'yet',
                'ever',
                'never',
                'just'
              ],
              'answer': 3,
              'explanation': '表示「刚刚」，用 just，夹在 have 和过去分词之间。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8b-p7': [
        {
          'version': 1,
          'oneLiner': '瞬间动词只响一下，配 for 或 since 要换成延续性说法。',
          'problem': '现在完成时里最容易丢分的一处：for 后面跟时间段，since 后面跟时间点，动词还必须是能一直持续的。填空题和选择题都爱在这里挖坑，考的就是你会不会把 did 那一瞬间换成一直挂着的状态。',
          'analogy': '打游戏按一下上线键，就半秒的事，点完那一下，键的动作就结束了。但你要说自己挂了三年在线，靠那个按键是撑不住的，靠的是账号一直挂着的在线状态。die、buy、join 这类词就是那个按键，be dead、have、be in 就是那个在线状态。接 for 和 since 只能拿状态去接。',
          'example': 'My grandpa has been dead for 3 years. 不能写 has died for 3 years，die 只响一下。The shop has been open since 9 o\'clock. 不能写 has opened since 9 o\'clock，open 那一下之后，留下来的是开着的状态。',
          'pitfalls': [
            'for 后面跟时间段，比如 for 3 years；since 后面跟时间点，比如 since 2008、since last year，两个别对调',
            'die、buy、borrow、join、leave、begin 这类瞬间动词，在肯定句里不能直接接 for 或 since，要先换成 be dead、have、keep、be in、be away、be on',
            'How long 开头的问句和答句都要用延续性动词，问 How long have you had it，不能问 How long have you bought it'
          ],
          'check': [
            {
              'stem': 'I ______ this bike for 2 years.',
              'options': [
                'have had',
                'have bought',
                'bought',
                'buy'
              ],
              'answer': 0,
              'explanation': 'buy 是瞬间动作，接 for 2 years 要换成能持续的 have。'
            },
            {
              'stem': 'My brother ______ the football team since last year.',
              'options': [
                'joined',
                'has joined',
                'has been in',
                'joins'
              ],
              'answer': 2,
              'explanation': 'join 是瞬间动词，since 加时间点要配延续性的 be in。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '动作只是到账那一下，状态才是余额；for 和 since 只跟余额玩。',
          'problem': '我一看到 for three years 就想把 die 直接怼进去，写完自己读着还挺顺，老师一个叉，我就懵——凭啥别的词能扛三年，die 就不行？',
          'analogy': '想成微信零钱。收红包叮一下，钱到账，那一下就结束了，动作没了。但零钱余额是躺在那儿不动的，你可以说「我这余额挂了两年」。die、buy、join 就是收红包那声叮；be dead、have、be in 就是余额。for、since 后面那段时间，是拿余额去撑的，不是拿叮那一下去撑的。',
          'example': 'He has had this ball for 2 days. ✔（had 是余额，撑得住 2 天）不能写 has bought this ball for 2 days ✘（buy 就是付款叮的那一下）。The lamp has been on since 2 o\'clock. ✔ 不能写 has turned on since 2 o\'clock ✘。',
          'pitfalls': [
            'for 后面放时间段，比如 for 2 days；since 后面放时间点，比如 since 2 o\'clock、since 2020，这两个位置别坐错。',
            'die、buy、join、borrow、leave、turn on 这类词都是「叮一下」，后面跟 for 或 since 会别扭，先把它翻成余额：be dead、have、be in、keep、be away、be on。',
            'How long 问出来的，答句也得还余额，问 How long have you had it，别问成 How long have you bought it。'
          ],
          'check': [
            {
              'stem': 'His dog ______ for 2 years.',
              'options': [
                'has died',
                'died',
                'has been dead',
                'was dead'
              ],
              'answer': 2,
              'explanation': 'die 只响一下，接 for 2 years 就得换成能一直躺着的 be dead。'
            },
            {
              'stem': 'The lamp has been on ______ 2 o\'clock.',
              'options': [
                'for',
                'since',
                'in',
                'at'
              ],
              'answer': 1,
              'explanation': '2 o\'clock 是个时间点，时间点前面用 since，时间段才轮到 for。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8b-p8': [
        {
          'version': 1,
          'oneLiner': '宾语从句是转述别人的话：引导词打头，语序回到主语加谓语。',
          'problem': '宾语从句在中考里几乎年年考，单选和句型转换都爱出。最常见的失分是把疑问句语序直接搬进从句，写成 where is the bank。这段就是解决语序和引导词两件事。',
          'analogy': '像打游戏时队友报点。他直接喊“敌人在哪”，那是他在问你。可你要把这句转告给另一个队友，你会说“他问敌人在哪”，不会说“他问在哪敌人”。转述别人的话时，语序要摆回“谁—怎么样”。',
          'example': 'Where does he live? 变成宾语从句：I want to know where he lives. 第一步，where 放在从句开头；第二步，把 does 撤掉；第三步，live 跟着 he 变成 lives。主句是现在时，从句时态不用改。',
          'pitfalls': [
            '从句里不能用疑问语序，引导词后面必须是主语加谓语：where the bank is，不是 where is the bank',
            '原句里的 do、does、did 在从句里要撤掉，后面的动词按人称变化：where he lives，不是 where does he live',
            '一般疑问句变宾语从句要用 if 或 whether 引导，别用 that；特殊疑问句才保留原来的疑问词'
          ],
          'check': [
            {
              'stem': 'Do you know ______ ?',
              'options': [
                'what time is it now',
                'what time it is now',
                'what time does it now',
                'it is what time now'
              ],
              'answer': 1,
              'explanation': '宾语从句要用陈述语序，what time 后面接主语 it 加谓语 is。'
            },
            {
              'stem': '把两句合成含宾语从句的句子：Is she at home? → I don\'t know ______ .',
              'options': [
                'that she is at home',
                'is she at home',
                'whether she is at home',
                'whether is she at home'
              ],
              'answer': 2,
              'explanation': '一般疑问句变宾语从句用 whether 引导，且后面保持陈述语序。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '从句里先把疑问词摆好，再让主语谓语按正常顺序站队。',
          'problem': '我一看空里给「where is the bank」和「where the bank is」就懵，长得差不多，每次纯靠手感蒙，蒙对了也说不清为啥。合并句子更慌：do、does 到底留不留，删完之后动词要不要加 s，全靠运气。',
          'analogy': '像帮室友点外卖。他喊「送到哪个门？」那是他在问你；你要把这句填进订单备注，会写「送到东门」，不会写「到东门送？」——备注栏只认陈述的写法。宾语从句就是那个备注栏：疑问词（哪个门）先写上去，后面按「谁—怎么样」排好，问号的倒装顺序不进备注。',
          'example': '拿最小的数字试两遍。第一句：Where is the 1 key? 转述成 I don\'t know where the 1 key is. 唯一的动作就是把 is 从 key 前面挪到 key 后面。第二句带 does：How much does 1 set cost? 转述成 He asks how much 1 set costs. does 撤掉，cost 跟着新主语加上 s。数字都是 1，语序都是「谁—怎么样」。',
          'pitfalls': [
            '从句里别再用问句那套排列：疑问词后面先出主语，谓语跟在后面，写成 where the key is 而不是 where is the key',
            '原来的 do、does、did 一进从句就撤掉，后面的动词跟着新主语变：how much 1 set costs',
            '能用 yes 或 no 回答的一般疑问句，进从句要用 if 或 whether 打头，that 不接这活；特殊疑问句才留原来的疑问词'
          ],
          'check': [
            {
              'stem': 'Can you tell me ______ ?',
              'options': [
                'how does it work',
                'how it works',
                'how works it',
                'how it does work'
              ],
              'answer': 1,
              'explanation': '疑问词 how 后面接主语 it 加谓语 works，does 撤掉，语序是陈述的。'
            },
            {
              'stem': '把两句合成一句：Why is he late? → Nobody knows ______ .',
              'options': [
                'why is he late',
                'why he is late',
                'why does he late',
                'why late he is'
              ],
              'answer': 1,
              'explanation': 'why 后面按主语 he 加谓语 is 排好，问句的倒装顺序不进从句。'
            }
          ],
          'readTime': 90
        }
      ],
    'eng8b-p9': [
        {
          'version': 1,
          'oneLiner': '主句什么时，从句跟什么时；过去跟过去，真理用现在。',
          'problem': '宾语从句时态呼应是单选和语法填空的高频点。常见考法是主句用 said、told 等过去时，选项却混入 is、will 等现在或将来形式，看你会不会被中文感觉带跑。',
          'analogy': '把主句想成队长，从句是队员。队长在“过去”这个房间开局，队员也得跟进去，不能说“我现在在”。他说 he was，你别写成 he is。只有游戏规则这种永远不变的事，才不管队长站哪，都用现在时。',
          'example': 'My friend said he was tired. 主句 said 是过去，从句 be 也要过去，写 was。再看 I hear she will come. 主句 hear 是现在，从句可以按需要说 will come。先看主句，再定时态。',
          'pitfalls': [
            '主句是过去时，从句一般也要用过去时，别照中文感觉写 is、will。',
            '主句是现在时，从句不一定也用现在时，可以按时间需要写 will、did 等。',
            '客观真理例外：主句哪怕过去，从句也常用一般现在时，比如 The teacher said the earth moves around the sun.'
          ],
          'check': [
            {
              'stem': 'My cousin said he ______ to the library yesterday.',
              'options': [
                'goes',
                'went',
                'will go',
                'is going'
              ],
              'answer': 1,
              'explanation': '主句 said 是过去时，yesterday 也指过去，从句用 went。'
            },
            {
              'stem': 'I hear that our class ______ a basketball game next Friday.',
              'options': [
                'wins',
                'won',
                'will win',
                'would win'
              ],
              'answer': 2,
              'explanation': '主句 hear 是一般现在时，next Friday 指将来，从句用 will win。'
            }
          ],
          'readTime': 90
        },
        {
          'version': 2,
          'oneLiner': '主句退回过去，从句也跟着退回过去，别自己跳回现在。',
          'problem': '主句一冒出 said、told，从句里到底填 is 还是 was，我脑子就开始转圈——中文都是「他说他很忙」，根本听不出过去没过，我…就懵。',
          'analogy': '把主句当成点外卖时的时间戳，从句就是骑手的位置播报。你昨天点的单，播报只能是昨天那一帧：He said he was busy，不能突然播今天的实时画面 he is。今天点的单，才可以播「马上到」，用 will。唯一的例外是店规、地球绕太阳这类永远不变的事——不管哪天点的单，播报都用现在时。',
          'example': '他昨天说：「我 2 分钟后到。」→ He said he would arrive in 2 minutes。主句 said 停在昨天那一帧，从句的 will 也得退成 would，2 这个数字不变。同一个人今天说，就是 He says he will arrive in 2 minutes。',
          'pitfalls': [
            '主句是过去时的时候，从句一般也要落在过去的某一档（was / did / would），写成 is、will 容易被判错，写完回头看一眼主句。',
            '主句是现在时，从句不是只能现在时——按时间说话，明天的事照旧用 will。',
            '遇到客观真理留个心：主句过去，从句还是现在时，像 He said the earth goes around the sun。'
          ],
          'check': [
            {
              'stem': 'My brother told me he ______ in the school team last year.',
              'options': [
                'is',
                'has been',
                'was',
                'will be'
              ],
              'answer': 2,
              'explanation': '主句 told 是过去时，last year 也是过去，从句只能落回 was。'
            },
            {
              'stem': '下面哪句宾语从句的时态搭配没问题？',
              'options': [
                'She says she will order takeout at 8.',
                'She said she will order takeout at 8.',
                'She says she orders takeout at 8 tomorrow.',
                'She said she orders takeout at 8 last night.'
              ],
              'answer': 0,
              'explanation': '主句 says 是现在时，8 点还没到，从句用 will order 正好。'
            }
          ],
          'readTime': 90
        }
      ],
  };

  registerSubject({ knowledgePoints, questions, lessons });
})();
