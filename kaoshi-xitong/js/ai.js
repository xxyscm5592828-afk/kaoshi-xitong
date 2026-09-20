// AI 调用层：OpenAI 兼容 chat 接口 + 每日限额 + 错误归一（零业务、零 DOM、零文案）
// 规则来源：开发文档 §9.1 双层架构（超限降级）§14 技术风险（无 Key 优雅降级）
const AI = {
  DEFAULT_BASE_URL: 'https://api.deepseek.com',
  DEFAULT_MODEL: 'deepseek-flash',
  DEFAULT_LIMIT: 30,
  // 推理模型：max_tokens 给小了，正文会被隐藏推理吃空（实测 120 → content 为空）
  MAX_TOKENS: 900,
  TIMEOUT: 30000,

  settings() {
    const s = Store.settings || {};
    const limit = Number(s.dailyAiLimit);
    return {
      baseUrl: (s.aiBaseUrl || this.DEFAULT_BASE_URL).trim().replace(/\/+$/, ''),
      model: (s.aiModel || this.DEFAULT_MODEL).trim(),
      key: (s.aiKey || '').trim(),
      limit: limit > 0 ? limit : this.DEFAULT_LIMIT,
    };
  },

  hasKey() { return this.settings().key !== ''; },

  quota(now) {
    const { limit } = this.settings();
    const date = Store.todayKey(now || Date.now());
    const q = Store.settings.aiQuota;
    const used = q && q.date === date ? q.used : 0;
    return { date, used, limit, left: Math.max(0, limit - used) };
  },

  _bumpQuota(now) {
    const q = this.quota(now);
    Store.settings = { ...Store.settings, aiQuota: { date: q.date, used: q.used + 1 } };
  },

  // → { ok: true, text, usage } | { ok: false, error, status? }
  // error: noKey | quota | truncated | badKey | rateLimited | timeout | network | http
  async chat({ messages, maxTokens = this.MAX_TOKENS, temperature = 0.7, now }) {
    const cfg = this.settings();
    if (!cfg.key) return { ok: false, error: 'noKey' };
    if (this.quota(now).left <= 0) return { ok: false, error: 'quota' };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.TIMEOUT);
    let res;
    try {
      res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
        body: JSON.stringify({ model: cfg.model, messages, max_tokens: maxTokens, temperature }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      return { ok: false, error: err && err.name === 'AbortError' ? 'timeout' : 'network' };
    }
    clearTimeout(timer);

    if (!res.ok) {
      const error = res.status === 401 || res.status === 403 ? 'badKey'
        : res.status === 429 ? 'rateLimited' : 'http';
      return { ok: false, error, status: res.status };
    }

    let data;
    try {
      data = await res.json();
    } catch (err) {
      return { ok: false, error: 'http' };
    }

    const choice = (data.choices || [])[0] || {};
    const text = ((choice.message || {}).content || '').trim();
    // 正文为空或没说完 → 一律当失败，绝不把空白丢给孩子看
    if (!text || choice.finish_reason === 'length') return { ok: false, error: 'truncated' };

    this._bumpQuota(now);
    return { ok: true, text, usage: data.usage || null };
  },

  // 设置页「测试连接」：走同一个通道，真实计费
  testConnection(now) {
    return this.chat({
      messages: [{ role: 'user', content: '回一句「连接正常」就好。' }],
      maxTokens: this.MAX_TOKENS,
      now,
    });
  },
};
