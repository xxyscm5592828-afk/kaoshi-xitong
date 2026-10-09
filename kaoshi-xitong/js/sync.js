// 云同步：GitHub 私有 Gist 作为免费云存储（无自建后端）
// 数据格式与手动导出完全一致（Store.exportData 的 {app,version,exportedAt,data}），
// 云端坏了也能用设置页"导入备份"手动恢复。冲突按 exportedAt 时间戳比较，新的赢（单用户场景）。
const Sync = {
  FILE: 'tutor-backup.json',
  DESC: '开挂补习系统（初二）备份 (tutor-backup)',
  DEBOUNCE_MS: 30000,
  _busy: false,    // 同步写 settings 期间置 true，阻断 Store._write → autoPush 回环
  _timer: null,
  _dirty: false,   // 有待上传变更（防抖窗口内 / 关页兜底用）

  cfg() {
    const s = Store.settings || {};
    return { token: s.gistToken || '', gistId: s.gistId || '' };
  },

  configured() { return !!this.cfg().token; },

  // App.init 调用：已配置则启动拉取比对（远端新则恢复并刷新）+ 注册关页兜底
  init() {
    if (!this.configured()) return;
    this.sync();
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('beforeunload', () => {
        if (this._dirty && !this._busy) this._push(true);
      });
    }
  },

  // 手动/启动同步：拉取云端与本地比对，导出时间新的赢
  async sync() {
    if (!this.configured()) return { ok: false, error: '未配置 Token' };
    this._busy = true;
    try {
      return await this._syncInner();
    } catch (e) {
      return { ok: false, error: '网络错误，请稍后再试' };
    } finally {
      this._busy = false;
    }
  },

  async _syncInner() {
    const token = this.cfg().token;
    let gistId = this.cfg().gistId;
    if (!gistId) {
      gistId = await this._findGist(token); // 换设备时复用同一个备份 gist，避免各建各的分叉
      if (!gistId) return await this._createGist(token); // 创建即上传
      this._saveCfg({ gistId });
    }
    const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers: this._headers(token) });
    if (res.status === 404) return { ok: false, error: '云端备份不存在（可能已被删除）' };
    if (!res.ok) return await this._err(res, '拉取失败');
    const gist = await res.json();
    const f = gist.files && gist.files[this.FILE];
    if (!f) return { ok: false, error: '云端备份文件缺失' };
    if (f.truncated || f.content == null) {
      return { ok: false, error: '云端数据超过 1MB 被截断，请用"导出进度备份"手动恢复' };
    }
    let remote;
    try { remote = JSON.parse(f.content); } catch (e) { return { ok: false, error: '云端数据损坏（非 JSON）' }; }
    if (!remote || remote.app !== 'tutor' || !remote.data) {
      return { ok: false, error: '云端数据不是本系统的备份格式' };
    }
    const localAt = (Store.settings || {}).lastSyncedAt || '';
    const remoteAt = remote.exportedAt || '';
    if (remoteAt > localAt) {
      const r = Store.importData(remote);
      if (!r.ok) return { ok: false, error: r.error };
      this._saveCfg({ lastSyncedAt: remoteAt });
      if (typeof location !== 'undefined' && location.reload) location.reload();
      return { ok: true, action: 'restored' };
    }
    if (localAt > remoteAt) {
      await this._pushNow(token, gistId, false);
      return { ok: true, action: 'uploaded' };
    }
    return { ok: true, action: 'latest' };
  },

  // Store._write hook：30s 防抖上传（无 gistId 时静默等首次手动同步建立）
  autoPush() {
    if (!this.configured() || this._busy) return;
    this._dirty = true;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this._timer = null;
      this._push(false);
    }, this.DEBOUNCE_MS);
  },

  async _push(keepalive) {
    const { token, gistId } = this.cfg();
    if (!token || !gistId || this._busy) return;
    this._dirty = false;
    this._busy = true;
    try {
      await this._pushNow(token, gistId, keepalive);
    } catch (e) { /* 静默：下次变更或关页兜底再试 */ }
    finally { this._busy = false; }
  },

  async _pushNow(token, gistId, keepalive) {
    const backup = Store.exportData();
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: this._headers(token),
      body: JSON.stringify({ files: { [this.FILE]: { content: JSON.stringify(backup, null, 2) } } }),
      keepalive: !!keepalive,
    });
    if (!res.ok) throw new Error('upload ' + res.status);
    this._saveCfg({ lastSyncedAt: backup.exportedAt });
  },

  // 在自己的 gists 里找已有备份（description + 文件名双重匹配）
  async _findGist(token) {
    try {
      const res = await fetch('https://api.github.com/gists?per_page=100', { headers: this._headers(token) });
      if (!res.ok) return '';
      const arr = await res.json();
      const hit = (Array.isArray(arr) ? arr : [])
        .find(g => g && g.description === this.DESC && g.files && g.files[this.FILE]);
      return hit ? hit.id : '';
    } catch (e) { return ''; }
  },

  // 首次使用：创建私有 gist，内容即当前本地数据
  async _createGist(token) {
    const backup = Store.exportData();
    const res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: this._headers(token),
      body: JSON.stringify({
        description: this.DESC,
        public: false,
        files: { [this.FILE]: { content: JSON.stringify(backup, null, 2) } },
      }),
    });
    if (!res.ok) return await this._err(res, '创建云端备份失败');
    const gist = await res.json();
    this._saveCfg({ gistId: gist.id, lastSyncedAt: backup.exportedAt });
    return { ok: true, action: 'created' };
  },

  // 同步期间写 settings（gistId / lastSyncedAt），置 _busy 阻断 _write 回环
  _saveCfg(patch) {
    this._busy = true;
    try { Store.settings = { ...Store.settings, ...patch }; }
    finally { this._busy = false; }
  },

  _headers(token) {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    };
  },

  async _err(res, label) {
    let detail = '';
    try { const j = await res.json(); detail = j.message || ''; } catch (e) { /* 非 JSON 响应 */ }
    return { ok: false, error: `${label}（HTTP ${res.status}${detail ? '：' + detail : ''}）` };
  },
};
