// 云同步（GitHub Gist）单元测试（node --test，零网络）
// 覆盖：未配置拒绝；首次创建存 gistId；换设备复用已有 gist；远端新→恢复；本地新→上传；
//       两端一致→跳过；_busy 防回环；变更触发防抖；云端截断保护
// 说明：setTimeout/clearTimeout 以 stub 注入沙箱，防抖只记录不执行，测试不挂起。
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const mockLS = {
  _d: {},
  getItem(k) { return this._d[k] ?? null; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; },
  // exportData 遍历 localStorage 需要 length/key(i)
  get length() { return Object.keys(this._d).length; },
  key(i) { return Object.keys(this._d)[i] ?? null; },
};

let fetchImpl = () => { throw new Error('本用例不应发起请求'); };

function loadAll() {
  const srcs = ['storage.js', 'sync.js']
    .map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8')).join('\n');
  const timers = [];
  const sandbox = new Function('localStorage', 'fetch', 'setTimeout', 'clearTimeout',
    srcs + '; return { Store, Sync };')(
    mockLS,
    (url, opt) => fetchImpl(url, opt),
    (fn) => { timers.push(fn); return timers.length; },
    () => {},
  );
  return { timers, ...sandbox };
}
const { Store, Sync, timers } = loadAll();

const SEED = {
  seedVersion: 1,
  subjects: [],
  knowledgePoints: [],
  questions: [],
  lessons: {},
  settings: {},
};

function fresh(settings) {
  mockLS._d = {};
  Store.init({ ...SEED, settings: settings || {} });
  timers.length = 0; // init 重建数据会触发多次 autoPush，清掉
}

const jsonRes = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
});

// 云端 gist 文件体：exportedAt + 一条 mastery 数据
const gistBody = (exportedAt) => ({
  files: {
    [Sync.FILE]: {
      content: JSON.stringify({
        app: 'tutor', version: 1, exportedAt,
        data: { 'tutor.mastery': '{"kp1":88}' },
      }),
    },
  },
});

test('未配置 Token：不发请求，返回明确错误', async () => {
  fresh({});
  let called = 0;
  fetchImpl = () => { called++; return jsonRes({}); };
  const res = await Sync.sync();
  assert.equal(res.ok, false);
  assert.match(res.error, /Token/);
  assert.equal(called, 0);
});

test('首次同步：创建私有 gist 并保存 gistId / lastSyncedAt', async () => {
  fresh({ gistToken: 't1' });
  let url = '', method = '', body = null;
  fetchImpl = (u, o = {}) => {
    url = u; method = o.method || 'GET';
    body = JSON.parse(o.body || '{}');
    return jsonRes({ id: 'gNEW' }, 201);
  };
  const res = await Sync.sync();
  assert.equal(res.ok, true);
  assert.equal(res.action, 'created');
  assert.equal(url, 'https://api.github.com/gists');
  assert.equal(method, 'POST');
  assert.equal(body.public, false);            // 私有 gist
  assert.equal(body.description, Sync.DESC);
  assert.ok(body.files[Sync.FILE].content.includes('tutor.')); // 内容即导出格式
  assert.equal(Store.settings.gistId, 'gNEW');
  assert.ok(Store.settings.lastSyncedAt);
});

test('换设备：无 gistId 时先查找并复用已有备份 gist，远端较新则恢复', async () => {
  fresh({ gistToken: 't1' });
  fetchImpl = (u) => {
    if (u.startsWith('https://api.github.com/gists?')) {
      return jsonRes([
        { id: 'other', description: '别的 gist', files: {} },
        { id: 'gOLD', description: Sync.DESC, files: { [Sync.FILE]: {} } },
      ]);
    }
    if (u === 'https://api.github.com/gists/gOLD') return jsonRes(gistBody('2026-10-09T10:00:00.000Z'));
    throw new Error('意外请求: ' + u);
  };
  const res = await Sync.sync();
  assert.equal(res.ok, true);
  assert.equal(res.action, 'restored');          // 远端 exportedAt > 本地空 → 恢复
  assert.equal(Store.settings.gistId, 'gOLD');   // 复用而非新建
  assert.equal(Store.mastery.kp1, 88);           // importData 已覆盖本地
  assert.equal(Store.settings.lastSyncedAt, '2026-10-09T10:00:00.000Z');
});

test('本地较新：PATCH 上传', async () => {
  fresh({ gistToken: 't1', gistId: 'g1', lastSyncedAt: '2026-10-09T12:00:00.000Z' });
  let method = '', url = '', body = null;
  fetchImpl = (u, o = {}) => {
    if ((o.method || 'GET') === 'GET') return jsonRes(gistBody('2026-10-09T01:00:00.000Z'));
    method = o.method; url = u; body = JSON.parse(o.body);
    return jsonRes({});
  };
  const res = await Sync.sync();
  assert.equal(res.ok, true);
  assert.equal(res.action, 'uploaded');
  assert.equal(method, 'PATCH');
  assert.equal(url, 'https://api.github.com/gists/g1');
  assert.ok(body.files[Sync.FILE].content.length > 0);
});

test('两端一致：跳过上传', async () => {
  fresh({ gistToken: 't1', gistId: 'g1', lastSyncedAt: '2026-10-09T12:00:00.000Z' });
  const methods = [];
  fetchImpl = (u, o = {}) => {
    methods.push(o.method || 'GET');
    return jsonRes(gistBody('2026-10-09T12:00:00.000Z'));
  };
  const res = await Sync.sync();
  assert.equal(res.ok, true);
  assert.equal(res.action, 'latest');
  assert.equal(methods.filter(m => m === 'PATCH').length, 0);
});

test('_busy 期间 _write 不触发防抖（防回环）', () => {
  fresh({ gistToken: 't1', gistId: 'g1' });
  assert.equal(timers.length, 0);
  Sync._busy = true;
  Store.settings = { ...Store.settings, lastSyncedAt: 'x' }; // 同步写 settings 的场景
  assert.equal(timers.length, 0);                            // 被阻断，无回环
  Sync._busy = false;
  Store.settings = { ...Store.settings, lastSyncedAt: 'y' };
  assert.equal(timers.length, 1);                            // 恢复后正常触发
});

test('数据变更触发防抖记录（timer stub 只记录）', () => {
  fresh({ gistToken: 't1', gistId: 'g1' });
  Store.mastery = { kp2: 10 }; // set → _write → autoPush
  assert.equal(timers.length, 1);
});

test('云端截断：返回明确错误提示改用导出备份', async () => {
  fresh({ gistToken: 't1', gistId: 'g1' });
  fetchImpl = () => jsonRes({ files: { [Sync.FILE]: { truncated: true, content: null } } });
  const res = await Sync.sync();
  assert.equal(res.ok, false);
  assert.match(res.error, /导出/);
});
