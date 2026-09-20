// 微课示意图（对比分析 B2）：给最值得图示的知识点配纯 SVG 插图
// 规则来源：洋葱学园「动画微课让抽象概念看得见」完课率 80%+ 的启示——90 秒微课从文字卡升级为「一段话 + 一张图」
// 零依赖、纯 inline SVG（无外部资源、无脚本）；Lesson.render 按 kpId 查表，插入到「核心一句话」下方
const Illustrations = {
  MAP: {
    // 数学八下 · 一次函数的图象与性质：k 决定斜向，b 决定与 y 轴交点
    'm8b-p18': `
      <svg viewBox="0 0 360 200" role="img" aria-label="一次函数图象：k 决定斜向，b 决定与 y 轴交点">
        <line x1="40" y1="170" x2="330" y2="170" stroke="#94a3b8" stroke-width="1.5"/>
        <line x1="40" y1="170" x2="40" y2="15" stroke="#94a3b8" stroke-width="1.5"/>
        <text x="328" y="188" font-size="12" fill="#64748b">x</text>
        <text x="22" y="22" font-size="12" fill="#64748b">y</text>
        <line x1="80" y1="165" x2="80" y2="175" stroke="#94a3b8"/>
        <text x="76" y="188" font-size="10" fill="#94a3b8">2</text>
        <line x1="120" y1="165" x2="120" y2="175" stroke="#94a3b8"/>
        <text x="116" y="188" font-size="10" fill="#94a3b8">4</text>
        <line x1="160" y1="165" x2="160" y2="175" stroke="#94a3b8"/>
        <text x="156" y="188" font-size="10" fill="#94a3b8">6</text>
        <line x1="200" y1="165" x2="200" y2="175" stroke="#94a3b8"/>
        <text x="196" y="188" font-size="10" fill="#94a3b8">8</text>
        <line x1="280" y1="165" x2="280" y2="175" stroke="#94a3b8"/>
        <text x="276" y="188" font-size="10" fill="#94a3b8">12</text>
        <line x1="35" y1="120" x2="45" y2="120" stroke="#94a3b8"/>
        <text x="12" y="124" font-size="10" fill="#94a3b8">2</text>
        <line x1="35" y1="70" x2="45" y2="70" stroke="#94a3b8"/>
        <text x="12" y="74" font-size="10" fill="#94a3b8">4</text>
        <line x1="35" y1="20" x2="45" y2="20" stroke="#94a3b8"/>
        <text x="12" y="24" font-size="10" fill="#94a3b8">6</text>
        <line x1="40" y1="50" x2="290" y2="170" stroke="#4f46e5" stroke-width="3" stroke-linecap="round"/>
        <circle cx="40" cy="50" r="5" fill="#f59e0b"/>
        <text x="50" y="44" font-size="12" fill="#b45309">b：与 y 轴的交点</text>
        <circle cx="290" cy="170" r="5" fill="#10b981"/>
        <text x="238" y="163" font-size="12" fill="#047857">y=0 的位置</text>
        <text x="108" y="96" font-size="12" fill="#dc2626">k &lt; 0：越往右越低 ↘</text>
        <text x="60" y="160" font-size="12" fill="#334155">两点定一线：先找 y 轴交点，再按 k 的斜向走一格。</text>
      </svg>`,
    // 数学八上 · 全等：能完全重合，与摆放姿势无关
    'm8a-p6': `
      <svg viewBox="0 0 360 190" role="img" aria-label="全等三角形：旋转平移后能完全重合">
        <polygon points="70,55 195,55 120,140" fill="#eef2ff" stroke="#4f46e5" stroke-width="3"/>
        <polygon points="77,62 202,62 127,147" fill="none" stroke="#10b981" stroke-width="2.5" stroke-dasharray="7 4"/>
        <text x="58" y="49" font-size="12" fill="#4f46e5">A</text>
        <text x="197" y="49" font-size="12" fill="#4f46e5">B</text>
        <text x="106" y="158" font-size="12" fill="#4f46e5">C</text>
        <text x="225" y="80" font-size="13" fill="#0f766e">实线是原图，</text>
        <text x="225" y="100" font-size="13" fill="#0f766e">虚线是换个姿势</text>
        <text x="225" y="120" font-size="13" fill="#0f766e">（转一转 / 翻个面）</text>
        <text x="225" y="140" font-size="13" fill="#0f766e">再叠上去</text>
        <text x="58" y="180" font-size="12" fill="#64748b">严丝合缝、一点不差 → 全等；差一点 → 不全等</text>
      </svg>`,
    // 物理八下 · 称重法测浮力：F = G − T
    'phy8b-p11': `
      <svg viewBox="0 0 360 200" role="img" aria-label="称重法测浮力：浮力等于重力减拉力">
        <rect x="15" y="105" width="330" height="80" fill="#e0f2fe"/>
        <path d="M 15 105 Q 40 98 65 105 T 115 105 T 165 105 T 215 105 T 265 105 T 315 105 T 345 105" stroke="#7dd3fc" stroke-width="2" fill="none"/>
        <text x="270" y="170" font-size="12" fill="#0284c7">水</text>
        <line x1="180" y1="10" x2="180" y2="62" stroke="#64748b" stroke-width="3"/>
        <path d="M 180 62 Q 168 76 180 90 Q 192 104 180 118" stroke="#64748b" stroke-width="2" fill="none"/>
        <line x1="180" y1="118" x2="180" y2="140" stroke="#64748b" stroke-width="3"/>
        <rect x="150" y="140" width="60" height="40" rx="4" fill="#c7d2fe" stroke="#4f46e5" stroke-width="2"/>
        <text x="168" y="166" font-size="12" fill="#312e81">物</text>
        <line x1="180" y1="140" x2="180" y2="124" stroke="#16a34a" stroke-width="2.5" marker-end="url(#aGreen)"/>
        <text x="186" y="128" font-size="12" fill="#15803d">拉力 T</text>
        <line x1="212" y1="180" x2="212" y2="152" stroke="#dc2626" stroke-width="2.5" marker-end="url(#aRed)"/>
        <text x="220" y="180" font-size="12" fill="#dc2626">重力 G</text>
        <line x1="130" y1="180" x2="130" y2="152" stroke="#2563eb" stroke-width="2.5" marker-end="url(#aBlue)"/>
        <text x="60" y="132" font-size="12" fill="#1d4ed8">浮力 F = G − T</text>
        <defs>
          <marker id="aGreen" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#16a34a"/></marker>
          <marker id="aRed" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#dc2626"/></marker>
          <marker id="aBlue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#2563eb"/></marker>
        </defs>
      </svg>`,
    // 物理八上 · 凸透镜成像规律：一倍焦距分虚实，二倍焦距分大小（三段对照：照相机 / 投影仪 / 放大镜）
    'phy8a-p18': `
      <svg viewBox="0 0 360 280" role="img" aria-label="凸透镜成像三段规律：物距大于二倍焦距成倒立缩小实像，物距在一倍与二倍焦距之间成倒立放大实像，物距小于一倍焦距成正立放大虚像">
        <defs>
          <marker id="illo18Obj" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#4f46e5"/></marker>
          <marker id="illo18Real" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#dc2626"/></marker>
          <marker id="illo18Virt" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#16a34a"/></marker>
        </defs>

        <text x="8" y="24" font-size="11" fill="#1d4ed8">① u &gt; 2f · 照相机</text>
        <text x="130" y="24" font-size="11" fill="#dc2626">→ 倒立缩小实像</text>
        <line x1="20" y1="60" x2="344" y2="60" stroke="#cbd5e1" stroke-width="1.2"/>
        <line x1="112" y1="55" x2="112" y2="65" stroke="#94a3b8"/>
        <line x1="146" y1="55" x2="146" y2="65" stroke="#94a3b8"/>
        <line x1="214" y1="55" x2="214" y2="65" stroke="#94a3b8"/>
        <line x1="248" y1="55" x2="248" y2="65" stroke="#94a3b8"/>
        <text x="108" y="73" font-size="9" fill="#94a3b8">2F</text>
        <text x="143" y="73" font-size="9" fill="#94a3b8">F</text>
        <text x="211" y="73" font-size="9" fill="#94a3b8">F</text>
        <text x="244" y="73" font-size="9" fill="#94a3b8">2F</text>
        <ellipse cx="180" cy="60" rx="8" ry="20" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5"/>
        <line x1="92" y1="60" x2="92" y2="40" stroke="#4f46e5" stroke-width="2.5" marker-end="url(#illo18Obj)"/>
        <text x="97" y="38" font-size="9" fill="#4f46e5">物</text>
        <line x1="231" y1="60" x2="231" y2="70" stroke="#dc2626" stroke-width="2.5" marker-end="url(#illo18Real)"/>
        <text x="228" y="82" font-size="9" fill="#dc2626">像</text>

        <text x="8" y="108" font-size="11" fill="#1d4ed8">② f &lt; u &lt; 2f · 投影仪</text>
        <text x="140" y="108" font-size="11" fill="#dc2626">→ 倒立放大实像</text>
        <line x1="20" y1="144" x2="344" y2="144" stroke="#cbd5e1" stroke-width="1.2"/>
        <line x1="112" y1="139" x2="112" y2="149" stroke="#94a3b8"/>
        <line x1="146" y1="139" x2="146" y2="149" stroke="#94a3b8"/>
        <line x1="214" y1="139" x2="214" y2="149" stroke="#94a3b8"/>
        <line x1="248" y1="139" x2="248" y2="149" stroke="#94a3b8"/>
        <text x="108" y="157" font-size="9" fill="#94a3b8">2F</text>
        <text x="143" y="157" font-size="9" fill="#94a3b8">F</text>
        <text x="211" y="157" font-size="9" fill="#94a3b8">F</text>
        <text x="244" y="157" font-size="9" fill="#94a3b8">2F</text>
        <ellipse cx="180" cy="144" rx="8" ry="20" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5"/>
        <line x1="132" y1="144" x2="132" y2="124" stroke="#4f46e5" stroke-width="2.5" marker-end="url(#illo18Obj)"/>
        <text x="137" y="122" font-size="9" fill="#4f46e5">物</text>
        <line x1="282" y1="144" x2="282" y2="170" stroke="#dc2626" stroke-width="2.5" marker-end="url(#illo18Real)"/>
        <text x="279" y="182" font-size="9" fill="#dc2626">像</text>

        <text x="8" y="192" font-size="11" fill="#1d4ed8">③ u &lt; f · 放大镜</text>
        <text x="110" y="192" font-size="11" fill="#16a34a">→ 正立放大虚像</text>
        <line x1="20" y1="228" x2="344" y2="228" stroke="#cbd5e1" stroke-width="1.2"/>
        <line x1="112" y1="223" x2="112" y2="233" stroke="#94a3b8"/>
        <line x1="146" y1="223" x2="146" y2="233" stroke="#94a3b8"/>
        <line x1="214" y1="223" x2="214" y2="233" stroke="#94a3b8"/>
        <line x1="248" y1="223" x2="248" y2="233" stroke="#94a3b8"/>
        <text x="108" y="241" font-size="9" fill="#94a3b8">2F</text>
        <text x="143" y="241" font-size="9" fill="#94a3b8">F</text>
        <text x="211" y="241" font-size="9" fill="#94a3b8">F</text>
        <text x="244" y="241" font-size="9" fill="#94a3b8">2F</text>
        <ellipse cx="180" cy="228" rx="8" ry="20" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5"/>
        <line x1="160" y1="228" x2="160" y2="212" stroke="#4f46e5" stroke-width="2.5" marker-end="url(#illo18Obj)"/>
        <text x="163" y="210" font-size="9" fill="#4f46e5">物</text>
        <line x1="131" y1="228" x2="131" y2="202" stroke="#16a34a" stroke-width="2.5" stroke-dasharray="5 3" marker-end="url(#illo18Virt)"/>
        <text x="100" y="224" font-size="9" fill="#16a34a">虚像</text>

        <text x="8" y="272" font-size="11" fill="#334155">一倍焦距分虚实 · 二倍焦距分大小</text>
        <text x="196" y="272" font-size="11" fill="#64748b">物近像远像变大</text>
      </svg>`,
    // 物理八上 · 光的反射定律：入射角 = 反射角，都从法线量起
    'phy8a-p14': `
      <svg viewBox="0 0 360 200" role="img" aria-label="光的反射定律：入射角等于反射角，都从镜面的法线量起">
        <line x1="90" y1="28" x2="90" y2="180" stroke="#334155" stroke-width="5"/>
        <line x1="90" y1="28" x2="78" y2="28" stroke="#334155" stroke-width="3"/>
        <line x1="90" y1="48" x2="78" y2="48" stroke="#334155" stroke-width="3"/>
        <line x1="90" y1="68" x2="78" y2="68" stroke="#334155" stroke-width="3"/>
        <line x1="90" y1="88" x2="78" y2="88" stroke="#334155" stroke-width="3"/>
        <line x1="90" y1="108" x2="78" y2="108" stroke="#334155" stroke-width="3"/>
        <line x1="90" y1="128" x2="78" y2="128" stroke="#334155" stroke-width="3"/>
        <text x="120" y="52" font-size="11" fill="#334155">镜面</text>

        <line x1="90" y1="104" x2="300" y2="104" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="6 4"/>
        <text x="186" y="98" font-size="11" fill="#dc2626">法线（垂直虚线，不是真实光线）</text>

        <line x1="52" y1="48" x2="90" y2="104" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round"/>
        <text x="32" y="42" font-size="11" fill="#4f46e5">入射光线</text>

        <line x1="90" y1="104" x2="52" y2="160" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round"/>
        <text x="24" y="182" font-size="11" fill="#4f46e5">反射光线</text>

        <path d="M 104 104 A 20 20 0 0 0 84 76" fill="none" stroke="#b45309" stroke-width="1.5"/>
        <text x="70" y="84" font-size="11" fill="#b45309">i</text>
        <path d="M 104 104 A 20 20 0 0 1 84 132" fill="none" stroke="#b45309" stroke-width="1.5"/>
        <text x="70" y="142" font-size="11" fill="#b45309">r</text>
        <text x="118" y="128" font-size="12" fill="#b45309">入射角 i = 反射角 r</text>
        <text x="22" y="24" font-size="11" fill="#64748b">都从法线量起（不是从镜面）</text>
        <text x="240" y="190" font-size="11" fill="#64748b">垂直射入：i = r = 0°</text>
      </svg>`,
    // 物理八下 · 杠杆平衡条件：力 × 力臂，两边相等才平衡
    'phy8b-p18': `
      <svg viewBox="0 0 360 200" role="img" aria-label="杠杆平衡：两边力乘力臂相等，力臂是从支点到力的作用线的距离">
        <defs>
          <marker id="iLev" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#334155"/></marker>
        </defs>
        <line x1="70" y1="104" x2="290" y2="104" stroke="#4f46e5" stroke-width="4" stroke-linecap="round"/>
        <polygon points="180,104 172,124 188,124" fill="#f59e0b"/>
        <text x="186" y="134" font-size="11" fill="#b45309">支点 O</text>

        <line x1="75" y1="104" x2="75" y2="150" stroke="#dc2626" stroke-width="2.5" marker-end="url(#iLev)"/>
        <text x="62" y="166" font-size="12" fill="#dc2626">F₁ = 2 N</text>
        <line x1="180" y1="112" x2="75" y2="112" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="5 3"/>
        <text x="100" y="118" font-size="10" fill="#dc2626">L₁ = 3 格</text>

        <line x1="250" y1="104" x2="250" y2="150" stroke="#2563eb" stroke-width="2.5" marker-end="url(#iLev)"/>
        <text x="242" y="166" font-size="12" fill="#2563eb">F₂ = 3 N</text>
        <line x1="180" y1="108" x2="250" y2="108" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="5 3"/>
        <text x="205" y="100" font-size="10" fill="#2563eb">L₂ = 2 格</text>

        <text x="72" y="186" font-size="12" fill="#334155">2 N × 3 格 = 3 N × 2 格 = 6 → 平衡</text>
        <text x="72" y="130" font-size="10" fill="#64748b">力臂是支点到「力的作用线」的距离，不是杆长</text>
      </svg>`,
    // 数学八下 · 勾股定理：先认斜边（最长、对直角），再 a²+b²=c²
    'm8b-p6': `
      <svg viewBox="0 0 360 210" role="img" aria-label="勾股定理：斜边最长对着直角，两直角边平方和等于斜边平方">
        <polygon points="90,55 90,140 200,140" fill="#dbeafe" stroke="#4f46e5" stroke-width="3"/>
        <rect x="90" y="132" width="8" height="8" fill="#dc2626"/>
        <text x="95" y="105" font-size="12" fill="#4f46e5">a = 6</text>
        <text x="135" y="158" font-size="12" fill="#4f46e5">b = 8</text>
        <text x="120" y="88" font-size="13" fill="#dc2626" font-weight="bold">c = 10（斜边）</text>

        <rect x="22" y="172" width="78" height="30" rx="4" fill="#eef2ff" stroke="#4f46e5"/>
        <text x="42" y="191" font-size="12" fill="#4f46e5">6² = 36</text>
        <text x="108" y="192" font-size="14" fill="#334155">+</text>
        <rect x="120" y="172" width="78" height="30" rx="4" fill="#eef2ff" stroke="#4f46e5"/>
        <text x="140" y="191" font-size="12" fill="#4f46e5">8² = 64</text>
        <text x="206" y="192" font-size="14" fill="#334155">=</text>
        <rect x="218" y="172" width="92" height="30" rx="4" fill="#fee2e2" stroke="#dc2626"/>
        <text x="238" y="191" font-size="12" fill="#dc2626">10² = 100</text>

        <text x="22" y="26" font-size="11" fill="#64748b">先认斜边：最长、对着直角的那条</text>
      </svg>`,
    // 生物八上 · 屈肘与伸肘：屈肘肱二头肌收缩、肱三头肌舒张，伸肘相反
    'bio8a-p13': `
      <svg viewBox="0 0 360 230" role="img" aria-label="屈肘与伸肘对照：屈肘肱二头肌收缩肱三头肌舒张，伸肘正好相反">
        <text x="60" y="28" font-size="13" fill="#dc2626" font-weight="bold">屈肘</text>
        <line x1="70" y1="42" x2="70" y2="120" stroke="#334155" stroke-width="5" stroke-linecap="round"/>
        <line x1="70" y1="120" x2="112" y2="82" stroke="#334155" stroke-width="5" stroke-linecap="round"/>
        <circle cx="70" cy="120" r="5" fill="#f59e0b"/>
        <path d="M 60 50 C 48 66 48 78 60 90" fill="none" stroke="#16a34a" stroke-width="5" stroke-linecap="round"/>
        <path d="M 82 46 C 96 64 96 104 74 116" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5 3"/>
        <text x="116" y="52" font-size="11" fill="#16a34a">肱二头肌 · 收缩</text>
        <text x="116" y="70" font-size="11" fill="#94a3b8">肱三头肌 · 舒张</text>

        <text x="236" y="28" font-size="13" fill="#1d4ed8" font-weight="bold">伸肘</text>
        <line x1="256" y1="42" x2="256" y2="120" stroke="#334155" stroke-width="5" stroke-linecap="round"/>
        <line x1="256" y1="120" x2="256" y2="178" stroke="#334155" stroke-width="5" stroke-linecap="round"/>
        <circle cx="256" cy="120" r="5" fill="#f59e0b"/>
        <path d="M 246 50 C 234 66 234 100 250 112" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5 3"/>
        <path d="M 268 46 C 280 64 280 110 262 172" fill="none" stroke="#16a34a" stroke-width="5" stroke-linecap="round"/>
        <text x="286" y="52" font-size="11" fill="#16a34a">肱三头肌 · 收缩</text>
        <text x="286" y="70" font-size="11" fill="#94a3b8">肱二头肌 · 舒张</text>

        <text x="22" y="218" font-size="12" fill="#334155">同一动作两组肌肉不会同时收缩，否则关节锁死</text>
      </svg>`,
    // 生物八下 · 显性基因与隐性基因：Dd×Dd 的基因型 1:2:1 ≠ 性状 3:1
    'bio8b-p10': `
      <svg viewBox="0 0 360 230" role="img" aria-label="显性基因与隐性基因：Dd 自交基因型比例一比二比一，性状比例三比一">
        <text x="22" y="28" font-size="13" fill="#334155">父母基因型：Dd × Dd</text>

        <text x="62" y="58" font-size="12" fill="#4f46e5">D</text>
        <text x="97" y="58" font-size="12" fill="#4f46e5">d</text>
        <text x="22" y="86" font-size="12" fill="#4f46e5">D</text>
        <text x="22" y="121" font-size="12" fill="#4f46e5">d</text>

        <rect x="45" y="68" width="35" height="35" fill="#dbeafe" stroke="#3b82f6"/>
        <text x="51" y="91" font-size="12" fill="#1d4ed8">DD</text>
        <rect x="80" y="68" width="35" height="35" fill="#dbeafe" stroke="#3b82f6"/>
        <text x="86" y="91" font-size="12" fill="#1d4ed8">Dd</text>
        <rect x="45" y="103" width="35" height="35" fill="#dbeafe" stroke="#3b82f6"/>
        <text x="51" y="126" font-size="12" fill="#1d4ed8">Dd</text>
        <rect x="80" y="103" width="35" height="35" fill="#fee2e2" stroke="#dc2626"/>
        <text x="86" y="126" font-size="12" fill="#dc2626">dd</text>

        <text x="150" y="88" font-size="11" fill="#1d4ed8">带 D → 双眼皮（显性）</text>
        <text x="150" y="108" font-size="11" fill="#dc2626">dd → 单眼皮（隐性）</text>
        <text x="150" y="128" font-size="11" fill="#64748b">前三格共 3 个带 D</text>

        <text x="22" y="168" font-size="12" fill="#334155">基因型 DD : Dd : dd = 1 : 2 : 1</text>
        <text x="22" y="190" font-size="12" fill="#334155">性状 双眼皮 : 单眼皮 = 3 : 1</text>
        <text x="22" y="218" font-size="11" fill="#dc2626">1:2:1 是基因型，3:1 才是性状——别串</text>
      </svg>`,
    // 地理八上 · 地势西高东低、三级阶梯：两级分界山脉别记混
    'geo8a-p6': `
      <svg viewBox="0 0 360 250" role="img" aria-label="中国地势西高东低三级阶梯及两级分界山脉">
        <rect x="20" y="48" width="96" height="56" fill="#dbeafe" stroke="#3b82f6"/>
        <text x="26" y="66" font-size="10" fill="#1d4ed8">第一级 &gt;4000 m</text>
        <text x="26" y="80" font-size="10" fill="#1d4ed8">青藏高原</text>

        <rect x="116" y="88" width="96" height="56" fill="#c7d2fe" stroke="#4f46e5"/>
        <text x="122" y="106" font-size="10" fill="#312e81">第二级 1000~2000 m</text>
        <text x="122" y="120" font-size="10" fill="#312e81">内蒙古·黄土·云贵高原</text>

        <rect x="212" y="128" width="96" height="56" fill="#e0f2fe" stroke="#0284c7"/>
        <text x="218" y="146" font-size="10" fill="#0369a1">第三级 &lt;500 m</text>
        <text x="218" y="160" font-size="10" fill="#0369a1">华北·东北·长江中下游平原</text>
        <rect x="308" y="128" width="34" height="56" fill="#bae6fd" stroke="#38bdf8"/>

        <line x1="116" y1="48" x2="116" y2="186" stroke="#dc2626" stroke-width="2" stroke-dasharray="6 3"/>
        <text x="20" y="206" font-size="10" fill="#dc2626">一级↔二级：昆仑山—祁连山—横断山</text>
        <line x1="212" y1="88" x2="212" y2="186" stroke="#dc2626" stroke-width="2" stroke-dasharray="6 3"/>
        <text x="20" y="224" font-size="10" fill="#dc2626">二级↔三级：大兴安岭—太行山—巫山—雪峰山</text>

        <text x="8" y="40" font-size="11" fill="#334155">西（高）</text>
        <text x="316" y="40" font-size="11" fill="#334155">东（低）</text>
        <text x="150" y="244" font-size="11" fill="#64748b">大江大河自西向东流入海</text>
      </svg>`,
  },

  // 有图返回 SVG 字符串，无图返回 ''（Lesson.render 据此决定是否插槽）
  get(kpId) { return this.MAP[kpId] || ''; },
};
