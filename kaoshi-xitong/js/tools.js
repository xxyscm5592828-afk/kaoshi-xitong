// 学习工具栏目：各学科参考工具（纯本地 SVG / 数据，零网络）
// 规则来源：用户要求「地理要提供中国地图、世界地图，历史要做一个历史时间轴」——
// 时间轴把八年级近代史/现代史拉成一条完整线，每个节点绑定 KP ID，点击直接跳微课（学完就练）。
// 地图用纯 SVG 示意图（考点可视化：三级阶梯、黑河—腾冲线、长江黄河、四大区域），不依赖外部地图服务。
const Tools = {
  // 工具目录：每科可挂多个工具
  CATALOG: [
    { subjectId: 'history', icon: '📜', title: '历史时间轴', desc: '从鸦片战争到新时代，一条线看清近代史/现代史先后', tool: 'timeline' },
    { subjectId: 'geography', icon: '🗺️', title: '中国地图示意', desc: '三级阶梯、长江黄河、四大地理区域、黑河—腾冲线', tool: 'china-map' },
    { subjectId: 'geography', icon: '🌍', title: '世界地图示意', desc: '七大洲四大洋相对位置，建立全球空间框架', tool: 'world-map' },
    { subjectId: 'chinese', icon: '📖', title: '现代文阅读图谱', desc: '七种文体一图看清：新闻/记叙文/散文/说明文/游记/议论文/小说', tool: 'chinese-reading' },
    { subjectId: 'english', icon: '⏳', title: '英语时态时间线', desc: '过去完成→过去→现在，时态在时间轴上的位置', tool: 'english-tense' },
    { subjectId: 'physics', icon: '🧮', title: '物理公式单位卡', desc: '速度/密度/压强/浮力/功/功率，公式+单位一卡记', tool: 'physics-formula' },
    { subjectId: 'biology', icon: '🐾', title: '动物类群进化图', desc: '从腔肠到哺乳，动物主要类群由低等到高等的演化阶梯', tool: 'biology-animal' },
    { subjectId: '', icon: '📝', title: '出一份练习卷', desc: '按弱项 / 错题 / 随机抽题，生成一份可打印的纸质练习卷（各科或综合）', tool: 'paper' },
  ],

  // 通用辅助：KP 存在则返回 data-kp 属性；否则空
  _kpAttr(kpId) {
    return (kpId && Store.kpIndex()[kpId]) ? ` data-kp="${kpId}" role="button" tabindex="0"` : '';
  },
  // 掌握度状态类：已掌握 lit / 薄弱 weak / 未学返回空
  _kpCls(kpId) {
    const m = kpId ? Store.mastery[kpId] : null;
    if (!m) return '';
    const eff = Math.round(Report.effective(m, Date.now()));
    return eff >= 85 ? ' lit' : (eff < 60 ? ' weak' : '');
  },
  jump(kpId) { return `${this._kpAttr(kpId)} class="map-jump${this._kpCls(kpId)}"`; },

  // ================= 历史时间轴 =================
  // 节点按时间升序；year 用于排版分组，kpId 可空（空则仅展示不跳转）
  TIMELINE: [
    { year: 1840, label: '鸦片战争爆发', kpId: 'his8a-p1', note: '中国近代史开端' },
    { year: 1842, label: '《南京条约》', kpId: 'his8a-p1', note: '割香港岛·五口通商' },
    { year: 1856, label: '第二次鸦片战争', kpId: 'his8a-p2', note: '1860 火烧圆明园' },
    { year: 1894, label: '甲午中日战争', kpId: 'his8a-p3', note: '1895《马关条约》' },
    { year: 1900, label: '八国联军侵华', kpId: 'his8a-p4', note: '1901《辛丑条约》' },
    { year: 1911, label: '辛亥革命', kpId: 'his8a-p7', note: '结束两千多年君主专制' },
    { year: 1915, label: '新文化运动', kpId: 'his8a-p8', note: '民主与科学' },
    { year: 1919, label: '五四运动', kpId: 'his8a-p9', note: '新民主主义革命开端' },
    { year: 1921, label: '中共成立', kpId: 'his8a-p10', note: '开天辟地的大事' },
    { year: 1927, label: '南昌起义·井冈山道路', kpId: 'his8a-p11', note: '武装反抗第一枪' },
    { year: 1931, label: '九一八事变', kpId: 'his8a-p13', note: '局部抗战开始' },
    { year: 1934, label: '红军长征', kpId: 'his8a-p12', note: '1936 会宁会师' },
    { year: 1937, label: '七七事变', kpId: 'his8a-p13', note: '全民族抗战开始' },
    { year: 1945, label: '抗战胜利', kpId: 'his8a-p15', note: '第一次完全胜利' },
    { year: 1946, label: '内战爆发', kpId: 'his8a-p16', note: '全面内战' },
    { year: 1948, label: '三大战役', kpId: 'his8a-p17', note: '辽沈·淮海·平津' },
    { year: 1949, label: '新中国成立', kpId: 'his8b-p1', note: '真正独立自主' },
    { year: 1953, label: '一五计划', kpId: 'his8b-p2', note: '集中力量发展重工业' },
    { year: 1956, label: '三大改造完成', kpId: 'his8b-p2', note: '社会主义制度建立' },
    { year: 1978, label: '十一届三中全会', kpId: 'his8b-p3', note: '改革开放伟大转折' },
    { year: 1980, label: '设立经济特区', kpId: 'his8b-p4', note: '深圳珠海汕头厦门' },
    { year: 1997, label: '香港回归', kpId: 'his8b-p8', note: '1999 澳门回归' },
    { year: 2012, label: '进入新时代', kpId: 'his8b-p6', note: '十八大以来' },
  ],

  timelineHTML() {
    const items = this.TIMELINE.map(t => {
      const kp = t.kpId && Store.kpIndex()[t.kpId] ? Store.kpIndex()[t.kpId] : null;
      const m = kp ? Store.mastery[kp.id] : null;
      const eff = m ? Math.round(Report.effective(m, Date.now())) : null;
      const litCls = eff !== null && eff >= 85 ? ' lit' : (eff !== null && eff < 60 ? ' weak' : '');
      const clickable = kp ? ` data-kp="${t.kpId}" role="button" tabindex="0"` : '';
      return `<div class="tl-item${litCls}"${clickable}>
        <div class="tl-year">${t.year}</div>
        <div class="tl-dot"></div>
        <div class="tl-body">
          <div class="tl-label">${t.label}</div>
          <div class="tl-note">${t.note}${eff !== null ? ` · 掌握度 ${eff}` : ''}</div>
        </div>
      </div>`;
    }).join('');
    return `<div class="timeline">${items}</div>`;
  },

  // ================= 地理·中国地图示意 =================
  chinaMapHTML() {
    const kp = id => Store.kpIndex()[id];
    const jump = id => kp(id) ? ` data-kp="${id}" role="button" tabindex="0"` : '';
    const cls = id => {
      const m = kp(id) ? Store.mastery[id] : null;
      if (!m) return '';
      const eff = Math.round(Report.effective(m, Date.now()));
      return eff >= 85 ? ' lit' : (eff < 60 ? ' weak' : '');
    };
    return `<svg viewBox="0 0 640 470" class="map" role="img" aria-label="中国地图示意图：三级阶梯、长江黄河、四大地理区域、黑河—腾冲线">
      <defs>
        <linearGradient id="step3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#fcd34d"/>
        </linearGradient>
      </defs>
      <!-- 三级阶梯：西高东低 -->
      <rect x="40" y="60" width="180" height="330" rx="14" fill="#fca5a5" opacity="0.55"/>
      <rect x="220" y="60" width="180" height="330" rx="14" fill="url(#step3)" opacity="0.75"/>
      <rect x="400" y="60" width="200" height="330" rx="14" fill="#86efac" opacity="0.6"/>
      <text x="130" y="50" text-anchor="middle" font-size="14" font-weight="700" fill="#b91c1c">第一级阶梯</text>
      <text x="130" y="68" text-anchor="middle" font-size="11" fill="#7f1d1d">青藏高原 · 4000m+</text>
      <text x="310" y="50" text-anchor="middle" font-size="14" font-weight="700" fill="#92400e">第二级阶梯</text>
      <text x="310" y="68" text-anchor="middle" font-size="11" fill="#78350f">高原盆地 · 1000-2000m</text>
      <text x="500" y="50" text-anchor="middle" font-size="14" font-weight="700" fill="#15803d">第三级阶梯</text>
      <text x="500" y="68" text-anchor="middle" font-size="11" fill="#14532d">平原丘陵 · 500m 以下</text>
      <!-- 阶梯分界线 -->
      <line x1="220" y1="70" x2="220" y2="385" stroke="#b45309" stroke-width="2" stroke-dasharray="6 5"/>
      <line x1="400" y1="70" x2="400" y2="385" stroke="#b45309" stroke-width="2" stroke-dasharray="6 5"/>
      <text x="310" y="402" text-anchor="middle" font-size="11" fill="#b45309" font-weight="600">①②分界：昆仑山—祁连山—横断山</text>
      <text x="500" y="418" text-anchor="middle" font-size="11" fill="#b45309" font-weight="600">②③分界：大兴安岭—太行山—巫山—雪峰山</text>
      <!-- 黄河（几字形） -->
      <path d="M 120 130 Q 180 110 240 140 Q 300 170 280 210 Q 260 250 310 260 Q 380 270 420 240 Q 470 210 520 230"
            fill="none" stroke="#d97706" stroke-width="4" stroke-linecap="round"/>
      <text x="180" y="118" font-size="13" font-weight="700" fill="#b45309"${jump('geo8a-p13')} class="map-jump${cls('geo8a-p13')}">黄河（几字形）</text>
      <!-- 长江（更长、靠南） -->
      <path d="M 130 300 Q 200 280 260 300 Q 320 320 380 300 Q 440 280 500 300 Q 540 310 570 300"
            fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>
      <text x="180" y="330" font-size="13" font-weight="700" fill="#1d4ed8"${jump('geo8a-p12')} class="map-jump${cls('geo8a-p12')}">长江</text>
      <!-- 黑河—腾冲线（人口分界线） -->
      <line x1="150" y1="90" x2="470" y2="370" stroke="#7c3aed" stroke-width="2" stroke-dasharray="3 4"/>
      <text x="480" y="378" font-size="11" font-weight="600" fill="#6d28d9"${jump('geo8a-p4')} class="map-jump${cls('geo8a-p4')}">黑河—腾冲线</text>
      <!-- 四大地理区域（八下） -->
      <g font-size="13" font-weight="700">
        <rect x="60" y="150" width="150" height="90" rx="10" fill="#93c5fd" opacity="0.45"/>
        <text x="135" y="198" text-anchor="middle" fill="#1e40af"${jump('geo8b-p1')} class="map-jump${cls('geo8b-p1')}">北方地区</text>
        <rect x="430" y="230" width="150" height="120" rx="10" fill="#86efac" opacity="0.5"/>
        <text x="505" y="292" text-anchor="middle" fill="#14532d"${jump('geo8b-p6')} class="map-jump${cls('geo8b-p6')}">南方地区</text>
        <rect x="60" y="250" width="150" height="120" rx="10" fill="#d8b4fe" opacity="0.4"/>
        <text x="135" y="312" text-anchor="middle" fill="#581c87"${jump('geo8b-p10')} class="map-jump${cls('geo8b-p10')}">西北地区</text>
        <rect x="230" y="300" width="150" height="80" rx="10" fill="#fda4af" opacity="0.4"/>
        <text x="305" y="345" text-anchor="middle" fill="#881337"${jump('geo8b-p11')} class="map-jump${cls('geo8b-p11')}">青藏地区</text>
      </g>
      <text x="320" y="452" text-anchor="middle" font-size="11" fill="#64748b">示意图（不按真实比例/边界）· 点标签可跳对应知识点</text>
    </svg>`;
  },

  // ================= 地理·世界地图示意 =================
  worldMapHTML() {
    const kp = id => Store.kpIndex()[id];
    const jump = id => kp(id) ? ` data-kp="${id}" role="button" tabindex="0"` : '';
    return `<svg viewBox="0 0 640 380" class="map" role="img" aria-label="世界地图示意图：七大洲四大洋相对位置">
      <!-- 大洋 -->
      <rect x="0" y="0" width="640" height="380" fill="#dbeafe"/>
      <text x="120" y="190" font-size="14" font-weight="700" fill="#1e40af" opacity="0.6">太平洋</text>
      <text x="330" y="70" font-size="12" font-weight="600" fill="#1e40af" opacity="0.55">北冰洋</text>
      <text x="350" y="200" font-size="13" font-weight="700" fill="#1e40af" opacity="0.6">大西洋</text>
      <text x="480" y="290" font-size="13" font-weight="700" fill="#1e40af" opacity="0.6">印度洋</text>
      <!-- 七大洲（简化轮廓块） -->
      <g stroke="#334155" stroke-width="1.5">
        <rect x="60" y="90" width="90" height="80" rx="10" fill="#bbf7d0"/>
        <text x="105" y="135" text-anchor="middle" font-size="13" font-weight="700" fill="#14532d">北美洲</text>
        <rect x="90" y="200" width="70" height="90" rx="10" fill="#bbf7d0"/>
        <text x="125" y="250" text-anchor="middle" font-size="12" font-weight="700" fill="#14532d">南美洲</text>
        <rect x="260" y="80" width="60" height="55" rx="10" fill="#fde68a"/>
        <text x="290" y="112" text-anchor="middle" font-size="12" font-weight="700" fill="#78350f">欧洲</text>
        <rect x="270" y="150" width="80" height="100" rx="10" fill="#fecaca"/>
        <text x="310" y="205" text-anchor="middle" font-size="13" font-weight="700" fill="#7f1d1d">非洲</text>
        <rect x="340" y="90" width="180" height="110" rx="12" fill="#fbcfe8"/>
        <text x="430" y="140" text-anchor="middle" font-size="16" font-weight="800" fill="#831843"${jump('geo8a-p1')} class="map-jump">亚洲（中国所在）</text>
        <text x="430" y="162" text-anchor="middle" font-size="11" fill="#9d174d">面积最大 · 人口最多</text>
        <rect x="480" y="240" width="80" height="60" rx="10" fill="#c7d2fe"/>
        <text x="520" y="275" text-anchor="middle" font-size="12" font-weight="700" fill="#312e81">大洋洲</text>
        <rect x="240" y="320" width="180" height="40" rx="10" fill="#e2e8f0"/>
        <text x="330" y="345" text-anchor="middle" font-size="12" font-weight="700" fill="#334155">南极洲</text>
      </g>
      <text x="320" y="372" text-anchor="middle" font-size="11" fill="#64748b">示意图（相对位置，不按真实形状/比例）</text>
    </svg>`;
  },

  // ================= 语文·现代文阅读图谱 =================
  // 七种文体各自的核心考点，绑定点对应 KP，课程点击跳微课
  chineseReadingHTML() {
    const ROWS = [
      { genre: '新闻', kp: 'chn8a-p14', points: '六要素（何时何地何人何事为何如何）· 导语概括' },
      { genre: '记叙文', kp: 'chn8a-p15', points: '六要素串线 · 概括内容 · 把握情感' },
      { genre: '散文', kp: 'chn8a-p16', points: '语言赏析 · 形散神聚 · 借景抒情' },
      { genre: '说明文', kp: 'chn8a-p17', points: '说明对象 · 说明方法（举例子/列数字/作比较）' },
      { genre: '游记', kp: 'chn8b-p13', points: '游踪线索 · 景物描写 · 情景交融' },
      { genre: '议论文', kp: 'chn8b-p14', points: '论点 · 论据 · 论证方法' },
      { genre: '小说', kp: 'chn8b-p16', points: '人物形象 · 情节 · 环境 · 主题' },
    ];
    return `<div class="genre-map">${ROWS.map(r => `
      <div class="genre-row"${this._kpAttr(r.kp)}>
        <div class="genre-name">${r.genre}</div>
        <div class="genre-points"${this._kpCls(r.kp)}>${r.points}</div>
      </div>`).join('')}</div>`;
  },

  // ================= 英语·时态时间线 =================
  englishTenseHTML() {
    const NODES = [
      { x: 70, tense: '过去完成时', en: 'had done', kp: 'eng8b-p12', note: '过去的过去' },
      { x: 190, tense: '一般过去时', en: 'did', kp: 'eng8a-p3', note: '过去的事实' },
      { x: 310, tense: '过去进行时', en: 'was/were doing', kp: 'eng8a-p10', note: '过去的某刻正在做' },
      { x: 430, tense: '现在完成时', en: 'have/has done', kp: 'eng8b-p4', note: '过去发生影响现在' },
      { x: 550, tense: '一般现在时', en: 'does', kp: 'eng8a-p6', note: '习惯·事实·状态' },
    ];
    return `<svg viewBox="0 0 640 220" class="map" role="img" aria-label="英语时态时间线：从过去的过去到现在的五类时态">
      <line x1="30" y1="120" x2="610" y2="120" stroke="#94a3b8" stroke-width="2"/>
      <polygon points="610,120 598,115 598,125" fill="#94a3b8"/>
      <text x="30" y="104" font-size="12" fill="#64748b">← 更早</text>
      <text x="600" y="104" font-size="12" fill="#64748b" text-anchor="end">现在 →</text>
      ${NODES.map(n => `
        <g${this._kpAttr(n.kp)}>
          <circle cx="${n.x}" cy="120" r="7" fill="#4f46e5"/>
          <text x="${n.x}" y="96" text-anchor="middle" font-size="14" font-weight="700" fill="#1e1b4b">${n.tense}</text>
          <text x="${n.x}" y="140" text-anchor="middle" font-size="11" fill="#475569">${n.en}</text>
          <text x="${n.x}" y="156" text-anchor="middle" font-size="10" fill="#64748b">${n.note}</text>
        </g>`).join('')}
    </svg>`;
  },

  // ================= 物理·公式单位卡 =================
  physicsFormulaHTML() {
    const CARDS = [
      { name: '速度', formula: 'v = s ÷ t', unit: 'm/s', kp: 'phy8a-p3' },
      { name: '密度', formula: 'ρ = m ÷ V', unit: 'kg/m³', kp: 'phy8a-p22' },
      { name: '压强', formula: 'p = F ÷ S', unit: 'Pa', kp: 'phy8b-p8' },
      { name: '液体压强', formula: 'p = ρgh', unit: 'Pa', kp: 'phy8b-p9' },
      { name: '浮力', formula: 'F浮 = ρ液gV排', unit: 'N', kp: 'phy8b-p12' },
      { name: '功', formula: 'W = Fs', unit: 'J', kp: 'phy8b-p14' },
      { name: '功率', formula: 'P = W ÷ t', unit: 'W', kp: 'phy8b-p15' },
      { name: '机械效率', formula: 'η = W有 ÷ W总', unit: '（无单位）', kp: 'phy8b-p20' },
    ];
    return `<div class="formula-grid">${CARDS.map(c => `
      <div class="formula-card"${this._kpAttr(c.kp)}>
        <div class="formula-name">${c.name}</div>
        <div class="formula-expr">${c.formula}</div>
        <div class="formula-unit">单位：${c.unit}</div>
      </div>`).join('')}</div>`;
  },

  // ================= 生物·动物类群进化图 =================
  biologyAnimalHTML() {
    const GROUPS = [
      { name: '腔肠动物', kp: 'bio8a-p1', cx: 60, cy: 40 },
      { name: '扁形动物', kp: 'bio8a-p2', cx: 130, cy: 70 },
      { name: '线形动物', kp: 'bio8a-p3', cx: 200, cy: 40 },
      { name: '环节动物', kp: 'bio8a-p4', cx: 270, cy: 70 },
      { name: '软体动物', kp: 'bio8a-p5', cx: 340, cy: 40 },
      { name: '节肢动物', kp: 'bio8a-p6', cx: 410, cy: 70 },
      { name: '鱼', kp: 'bio8a-p7', cx: 480, cy: 40 },
      { name: '两栖动物', kp: 'bio8a-p8', cx: 550, cy: 70 },
      { name: '爬行动物', kp: 'bio8a-p9', cx: 620, cy: 40 },
      { name: '鸟', kp: 'bio8a-p10', cx: 690, cy: 70 },
      { name: '哺乳动物', kp: 'bio8a-p11', cx: 760, cy: 40 },
    ];
    return `<svg viewBox="0 0 840 130" class="map" role="img" aria-label="动物主要类群：由低等到高等的演化阶梯">
      <path d="M 20 90 Q 40 60 50 90" fill="none" stroke="#f59e0b" stroke-width="2"/>
      <text x="30" y="110" text-anchor="middle" font-size="10" fill="#b45309">低等</text>
      <text x="800" y="110" text-anchor="middle" font-size="10" fill="#b45309">→ 高等</text>
      ${GROUPS.map(g => `
        <g${this._kpAttr(g.kp)}>
          <ellipse cx="${g.cx}" cy="${g.cy}" rx="34" ry="18" fill="#e0e7ff" stroke="#4f46e5" stroke-width="1.5"/>
          <text x="${g.cx}" y="${g.cy + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="#3730a3">${g.name}</text>
        </g>`).join('')}
      <text x="420" y="128" text-anchor="middle" font-size="10" fill="#64748b">按演化顺序从左到右 · 点任意类群跳对应知识点</text>
    </svg>`;
  },
};
