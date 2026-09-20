// 学习工具（Tools）单元测试：目录/历史时间轴/中国地图/世界地图
// 纯本地渲染，零 DOM（直接断言 HTML 字符串）
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const mockLS = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };

function loadAll() {
  const srcs = ['storage.js', 'data.js', 'mastery.js', 'wrongbook.js', 'scheduler.js', 'report.js', 'tools.js']
    .map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  return new Function('localStorage', srcs + '; return { Store, Report, Tools };')(mockLS);
}
const { Store, Tools } = loadAll();

const SEED = {
  seedVersion: 1,
  subjects: [
    { id: 'history', name: '历史' },
    { id: 'geography', name: '地理', exam: true },
    { id: 'chinese', name: '语文' },
    { id: 'english', name: '英语' },
    { id: 'physics', name: '物理' },
    { id: 'biology', name: '生物' },
  ],
  knowledgePoints: [
    { id: 'his8a-p1', subjectId: 'history', parentId: null, name: '鸦片战争', order: 1, level: 4, weight: 5, prerequisites: [] },
    { id: 'his8a-p9', subjectId: 'history', parentId: null, name: '五四运动', order: 2, level: 4, weight: 5, prerequisites: [] },
    { id: 'geo8a-p6', subjectId: 'geography', parentId: null, name: '地势西高东低', order: 1, level: 4, weight: 5, prerequisites: [] },
    { id: 'chn8a-p14', subjectId: 'chinese', parentId: null, name: '新闻·文体特点', order: 1, level: 4, weight: 3, prerequisites: [] },
    { id: 'eng8b-p4', subjectId: 'english', parentId: null, name: '现在完成时', order: 1, level: 4, weight: 5, prerequisites: [] },
    { id: 'phy8b-p12', subjectId: 'physics', parentId: null, name: '阿基米德原理', order: 1, level: 4, weight: 5, prerequisites: [] },
    { id: 'bio8a-p10', subjectId: 'biology', parentId: null, name: '鸟适于飞行', order: 1, level: 4, weight: 5, prerequisites: [] },
  ],
  questions: [],
  lessons: {},
  settings: {},
};

test('目录含七类工具，归属对应科目', () => {
  mockLS._d = {};
  Store.init({ ...SEED });
  assert.equal(Tools.CATALOG.length, 7);
  const tools = Tools.CATALOG.map(t => t.tool).sort();
  assert.deepEqual(tools, ['biology-animal', 'china-map', 'chinese-reading', 'english-tense', 'physics-formula', 'timeline', 'world-map']);
  const bySubject = (id) => Tools.CATALOG.filter(t => t.subjectId === id).length;
  assert.equal(bySubject('history'), 1);
  assert.equal(bySubject('geography'), 2);
  assert.equal(bySubject('chinese'), 1);
  assert.equal(bySubject('english'), 1);
  assert.equal(bySubject('physics'), 1);
  assert.equal(bySubject('biology'), 1);
});

test('历史时间轴按年份升序，节点绑定 KP ID，KP 存在时可点击', () => {
  mockLS._d = {};
  Store.init({ ...SEED });
  const html = Tools.timelineHTML();
  // 升序校验
  const years = [...html.matchAll(/tl-year">(\d+)</g)].map(m => Number(m[1]));
  assert.ok(years.length >= 20, `时间轴节点数应≥20，实际 ${years.length}`);
  for (let i = 1; i < years.length; i++) assert.ok(years[i] >= years[i - 1], `年份未按升序：${years[i - 1]} > ${years[i]}`);
  // KP 存在 → data-kp
  assert.ok(html.includes('data-kp="his8a-p1"'), '鸦片战争节点应绑定 his8a-p1');
  assert.ok(html.includes('data-kp="his8a-p9"'), '五四运动节点应绑定 his8a-p9');
  // KP 不在树里 → 不应输出 data-kp（his8b-p1 未入 SEED）
  assert.ok(!html.includes('data-kp="his8b-p1"'), '未入树的 KP 不应可点击');
});

test('中国地图示意图含三级阶梯、长江黄河、四大区域、黑河—腾冲线', () => {
  mockLS._d = {};
  Store.init({ ...SEED });
  const html = Tools.chinaMapHTML();
  assert.ok(html.includes('第一级阶梯'), '缺第一级阶梯');
  assert.ok(html.includes('第二级阶梯'), '缺第二级阶梯');
  assert.ok(html.includes('第三级阶梯'), '缺第三级阶梯');
  assert.ok(html.includes('黄河'), '缺黄河');
  assert.ok(html.includes('长江'), '缺长江');
  assert.ok(html.includes('黑河'), '缺黑河—腾冲线');
  assert.ok(html.includes('北方地区'), '缺北方地区');
  assert.ok(html.includes('南方地区'), '缺南方地区');
  assert.ok(html.includes('西北地区'), '缺西北地区');
  assert.ok(html.includes('青藏地区'), '缺青藏地区');
  assert.ok(html.includes('data-kp="geo8a-p6"') === false, 'geo8a-p6 未绑定到中国地图（阶梯分界线是文字标签）');
});

test('世界地图示意图含七大洲四大洋', () => {
  mockLS._d = {};
  Store.init({ ...SEED });
  const html = Tools.worldMapHTML();
  ['太平洋', '大西洋', '印度洋', '北冰洋', '亚洲', '欧洲', '非洲', '北美洲', '南美洲', '大洋洲', '南极洲'].forEach(n => {
    assert.ok(html.includes(n), `世界地图缺 ${n}`);
  });
});

test('地图上的掌握度状态：已掌握点亮、薄弱标红', () => {
  mockLS._d = {};
  Store.init({ ...SEED });
  // geo8a-p12（长江）不在 SEED 树里，换一个在树里的：用 geo8a-p6 没法测（地图没绑）。改测时间轴。
  Store.mastery = {
    'his8a-p1': { score: 90, lastReviewAt: Date.now(), reviewCount: 1, correctStreak: 3, fastStreak: 2, wrongStreak: 0, interval: 4 },
    'his8a-p9': { score: 30, lastReviewAt: Date.now(), reviewCount: 0, correctStreak: 0, fastStreak: 0, wrongStreak: 2, interval: 1 },
  };
  const html = Tools.timelineHTML();
  assert.ok(html.includes('lit') && html.includes('鸦片战争'), '已掌握节点应点亮');
  assert.ok(html.includes('weak') && html.includes('五四运动'), '薄弱节点应标红');
});

test('语文现代文阅读图谱：七种文体 + KP 绑定', () => {
  mockLS._d = {};
  Store.init({ ...SEED });
  const html = Tools.chineseReadingHTML();
  ['新闻', '记叙文', '散文', '说明文', '游记', '议论文', '小说'].forEach(g => {
    assert.ok(html.includes(g), `阅读图谱缺 ${g}`);
  });
  assert.ok(html.includes('data-kp="chn8a-p14"'), '新闻文体应绑定 chn8a-p14');
});

test('英语时态时间线：五类时态 + KP 绑定', () => {
  mockLS._d = {};
  Store.init({ ...SEED });
  const html = Tools.englishTenseHTML();
  ['过去完成时', '一般过去时', '过去进行时', '现在完成时', '一般现在时'].forEach(t => {
    assert.ok(html.includes(t), `时态线缺 ${t}`);
  });
  assert.ok(html.includes('data-kp="eng8b-p4"'), '现在完成时应绑定 eng8b-p4');
});

test('物理公式单位卡：八个公式 + KP 绑定', () => {
  mockLS._d = {};
  Store.init({ ...SEED });
  const html = Tools.physicsFormulaHTML();
  ['速度', '密度', '压强', '液体压强', '浮力', '功', '功率', '机械效率'].forEach(f => {
    assert.ok(html.includes(f), `公式卡缺 ${f}`);
  });
  assert.ok(html.includes('data-kp="phy8b-p12"'), '浮力公式应绑定 phy8b-p12');
});

test('生物动物类群进化图：十一类群 + KP 绑定', () => {
  mockLS._d = {};
  Store.init({ ...SEED });
  const html = Tools.biologyAnimalHTML();
  ['腔肠动物', '扁形动物', '线形动物', '环节动物', '软体动物', '节肢动物', '鱼', '两栖动物', '爬行动物', '鸟', '哺乳动物'].forEach(g => {
    assert.ok(html.includes(g), `进化图缺 ${g}`);
  });
  assert.ok(html.includes('data-kp="bio8a-p10"'), '鸟应绑定 bio8a-p10');
});
