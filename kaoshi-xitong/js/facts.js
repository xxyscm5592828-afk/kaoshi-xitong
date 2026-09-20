// 冷知识卡（阶段 3 §10.4：答对 20% 概率掉落，图鉴收集，不兑换任何东西）
// 学科梗优先；红线（§10.6）：不兑换、不开箱、不抽卡
const Facts = {
  BANK: [
    { id: 'f1', text: '光速每秒约 30 万公里——绕地球一圈只要 0.13 秒。' },
    { id: 'f2', text: '「函数」这个词，李善兰 1859 年翻译时借用了「函」的「包含」义。' },
    { id: 'f3', text: '中国地跨五个时区，但全国统一用北京时间。' },
    { id: 'f4', text: '海平面上升 1 米，会让约 1 亿人受影响。' },
    { id: 'f5', text: '人体内血管连起来约 10 万公里，能绕地球两圈半。' },
    { id: 'f6', text: '等腰三角形两底角相等的证明，写在《几何原本》里。' },
    { id: 'f7', text: '「方程」一词最早来自《九章算术》的「方程术」。' },
    { id: 'f8', text: '水在 4℃ 时密度最大——冰能浮在水面上全靠它。' },
    { id: 'f9', text: '中国最东端与最西端相差约 4 个时区。' },
    { id: 'f10', text: '一张 A4 纸对折 42 次，厚度能到月球。' },
    { id: 'f11', text: '珠穆朗玛峰每年还在长高约 4 毫米。' },
    { id: 'f12', text: '世界上最小的国家梵蒂冈，还没有颐和园大。' },
    { id: 'f13', text: '地球到太阳的光，要走 8 分 20 秒。' },
    { id: 'f14', text: '人每天不知不觉吞下约 1 升唾液。' },
    { id: 'f15', text: '0 是最早由印度人发明的数字之一，后来经阿拉伯传遍世界。' },
    { id: 'f16', text: '北极没有陆地，南极没有企鹅的「邻居」北极熊。' },
    { id: 'f17', text: '「三角形的稳定性」让埃及金字塔屹立几千年。' },
    { id: 'f18', text: '负数的概念，中国《九章算术》比欧洲早一千多年提出。' },
    { id: 'f19', text: '声音在铁里比在空气里跑得快 17 倍。' },
    { id: 'f20', text: '月球的引力只有地球的六分之一——跳高冠军在月球能破纪录。' },
  ],

  collected() { return Store.facts; },

  // 答对后调用：20% 概率掉落一张没收集过的卡；已集齐则不再掉
  tryDrop(now) {
    const has = new Set(this.collected());
    const fresh = this.BANK.filter(f => !has.has(f.id));
    if (fresh.length === 0) return null;
    if (Math.random() > 0.2) return null;
    const f = fresh[Math.floor(Math.random() * fresh.length)];
    Store.facts = this.collected().concat(f.id);
    return f;
  },
};
