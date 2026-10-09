// 多科内容装配测试：8 科数据文件 + data.js 合并后的结构完整性
// 目的：任何一科内容缺失 / id 冲突 / 引用悬空 / 叶节点无题，都在单元测试层暴露
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const JS = path.join(__dirname, '..', 'js');
const DATA_FILES = [
  'data.js',
  'data-math8b.js',
  'data-math9.js',
  'data-chinese.js',
  'data-chinese9.js',
  'data-english.js',
  'data-english9.js',
  'data-physics.js',
  'data-physics9.js',
  'data-history.js',
  'data-history9.js',
  'data-geography.js',
  'data-biology.js',
  'data-politics.js',
  'data-politics9.js',
];

function loadData() {
  const srcs = DATA_FILES.map(f => fs.readFileSync(path.join(JS, f), 'utf8')).join('\n');
  return new Function('localStorage', srcs + '; return { SUBJECTS, KNOWLEDGE_POINTS, QUESTIONS, LESSONS, SEED };')(null);
}

const { SUBJECTS, KNOWLEDGE_POINTS, QUESTIONS, LESSONS, SEED } = loadData();

const kpIds = new Set(KNOWLEDGE_POINTS.map(k => k.id));
const leaves = KNOWLEDGE_POINTS.filter(k => k.level === 4);

test('8 科全部注册，且每科都有知识点、叶节点与题目', () => {
  assert.equal(SUBJECTS.length, 8);
  for (const s of SUBJECTS) {
    const kps = KNOWLEDGE_POINTS.filter(k => k.subjectId === s.id);
    const lv4 = kps.filter(k => k.level === 4);
    const qs = QUESTIONS.filter(q => q.subjectId === s.id);
    assert.ok(kps.length > 0, `科目 ${s.id} 无知识点（内容文件缺失？）`);
    assert.ok(lv4.length > 0, `科目 ${s.id} 无 L4 叶节点`);
    assert.ok(qs.length > 0, `科目 ${s.id} 无题目`);
  }
});

test('知识点 id 与题目 id 全局唯一', () => {
  assert.equal(kpIds.size, KNOWLEDGE_POINTS.length, '知识点 id 存在重复');
  assert.equal(new Set(QUESTIONS.map(q => q.id)).size, QUESTIONS.length, '题目 id 存在重复');
});

test('题目不悬空：knowledgePointId 必须指向已注册知识点', () => {
  const bad = QUESTIONS.filter(q => !kpIds.has(q.knowledgePointId));
  assert.deepEqual(bad.map(q => q.id), []);
});

test('微课不悬空：LESSONS 的 key 必须是已注册知识点', () => {
  const bad = Object.keys(LESSONS).filter(id => !kpIds.has(id));
  assert.deepEqual(bad, []);
});

test('每个 L4 叶节点至少 1 道题', () => {
  const bad = leaves.filter(l => !QUESTIONS.some(q => q.knowledgePointId === l.id));
  assert.deepEqual(bad.map(l => l.id), []);
});

test('parentId 与 prerequisites 引用均可解析', () => {
  const badParent = KNOWLEDGE_POINTS.filter(k => k.level > 1 && !kpIds.has(k.parentId));
  assert.deepEqual(badParent.map(k => k.id), []);
  const badPrereq = [];
  for (const k of KNOWLEDGE_POINTS) {
    for (const p of (k.prerequisites || [])) if (!kpIds.has(p)) badPrereq.push(`${k.id} -> ${p}`);
  }
  assert.deepEqual(badPrereq, []);
});

test('题型与答案合法：选择题索引越界 / 判断题选项 / 填空题答案缺失', () => {
  const bad = [];
  for (const q of QUESTIONS) {
    if (!Array.isArray(q.options)) { bad.push(`${q.id} options 非数组`); continue; }
    if (!(q.expectedTime > 0)) bad.push(`${q.id} expectedTime 非法`);
    if (q.type === 'single') {
      if (q.options.length < 2) bad.push(`${q.id} 单选题选项不足`);
      if (!(q.answer >= 0 && q.answer < q.options.length)) bad.push(`${q.id} 答案索引越界`);
    } else if (q.type === 'judge') {
      if (q.options.length !== 2) bad.push(`${q.id} 判断题选项应为 2 个`);
      if (q.answer !== 0 && q.answer !== 1) bad.push(`${q.id} 判断题答案应为 0 或 1`);
    } else if (q.type === 'fill') {
      if (String(q.answer == null ? '' : q.answer).trim() === '') bad.push(`${q.id} 填空题答案缺失`);
    }
  }
  assert.deepEqual(bad, []);
});

test('每科都配有微课，且微课结构完整（多版本 + check）', () => {
  for (const s of SUBJECTS) {
    const lv4 = KNOWLEDGE_POINTS.filter(k => k.subjectId === s.id && k.level === 4);
    const withLesson = lv4.filter(k => LESSONS[k.id]);
    assert.ok(withLesson.length > 0, `科目 ${s.id} 没有微课`);
    for (const l of withLesson) {
      const versions = LESSONS[l.id];
      assert.ok(Array.isArray(versions) && versions.length >= 1, `${l.id} 微课缺少版本`);
      for (const v of versions) {
        assert.ok(v.oneLiner && v.problem && v.analogy && v.example, `${l.id} 微课字段缺失`);
        assert.ok(Array.isArray(v.pitfalls) && v.pitfalls.length > 0, `${l.id} 微课缺 pitfalls`);
        assert.ok(Array.isArray(v.check) && v.check.length > 0, `${l.id} 微课缺 check`);
        const badCheck = [];
        for (const c of v.check) {
          if (!c || typeof c.stem !== 'string' || !c.stem.trim()) badCheck.push('题干缺失');
          if (!Array.isArray(c.options) || c.options.length < 2) badCheck.push('选项不足');
          if (!Number.isInteger(c.answer) || c.answer < 0 || c.answer >= (c.options || []).length) badCheck.push('答案索引越界');
          if (typeof c.explanation !== 'string' || !c.explanation.trim()) badCheck.push('解析缺失');
        }
        assert.deepEqual(badCheck, [], `${l.id} 自测题不合法：${badCheck.join('；')}`);
        assert.ok(v.readTime > 0, `${l.id} 微课 readTime 非法`);
      }
    }
  }
});

test('SEED 与装配结果一致（浏览器端播种内容 = 源码内容）', () => {
  assert.equal(SEED.subjects.length, SUBJECTS.length);
  assert.equal(SEED.knowledgePoints.length, KNOWLEDGE_POINTS.length);
  assert.equal(SEED.questions.length, QUESTIONS.length);
  assert.equal(Object.keys(SEED.lessons).length, Object.keys(LESSONS).length);
  for (const s of SUBJECTS) {
    assert.ok(SEED.subjects.some(x => x.id === s.id), `SEED 缺少科目 ${s.id}`);
  }
});
