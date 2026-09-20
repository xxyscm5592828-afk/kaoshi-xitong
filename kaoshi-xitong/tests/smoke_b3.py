#!/usr/bin/env python3
# B3 冒烟：错题答疑首轮只给思路提示 + 「继续展开」按钮；展开后完整讲法；自由提问不启用
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8899"
results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("  PASS  " if cond else "  FAIL  ") + name, flush=True)


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    js_errors = []
    page.on("pageerror", lambda e: js_errors.append(str(e)))

    # 拦截所有 POST（AI 调用）：返回固定提示文本，并记录请求体
    page.route("**/*", lambda route: (
        route.fulfill(
            status=200, content_type="application/json",
            body='{"choices":[{"message":{"content":"先看 x=0 的时候，图象就定住一半了。","finish_reason":"stop"}}]}')
        if route.request.method == "POST" else route.continue_()
    ))

    page.goto(BASE)
    page.wait_for_selector("#start-session")

    # 先不设 Key：造一条「待处理」悬赏走 D0 补流程（无 Key → 解析页有「问学长」）
    page.evaluate("""() => {
      const q = Store.questions[0];
      const kp = Store.kpIndex()[q.knowledgePointId];
      Store.wrongbook = [{ id: 'wr1', questionId: q.id, knowledgePointId: kp.id, subjectId: kp.subjectId,
        status: '待处理', firstWrongAt: Date.now(), errorType: null, reappearCount: 0 }];
      App.show('wrongbook');
    }""")
    page.wait_for_selector("[data-process]")
    page.click("[data-process]")

    # D0 流程：选错因 → 无 Key → 看解析 → 问学长
    page.click(".error-type-btn")
    page.wait_for_selector("#d0-ask")
    page.click("#d0-ask")

    check("答疑面板出现", page.locator(".ask-panel").count() == 1)
    check("初始无「继续展开」按钮", page.locator("#ask-expand").count() == 0)

    # 面板打开后再注入 Key + fetch stub（send 时才读 Key）
    page.evaluate("""() => {
      Store.settings = { ...Store.settings, aiKey: 'k', aiBaseUrl: 'http://localhost:8899/fake-ai' };
      window.__calls = [];
      const _fetch = window.fetch;
      window.fetch = (url, opt) => {
        window.__calls.push(JSON.parse(opt.body));
        return _fetch(url, opt);
      };
    }""")

    # 首轮发送 → 应为思路提示模式
    page.fill("#ask-input", "这题怎么想？")
    page.click("#ask-send")
    page.wait_for_timeout(400)
    check("首轮 system 带思路提示规则",
          page.evaluate("() => window.__calls[0].messages[0].content.includes('思路提示模式')"))
    check("提示回复已上屏", page.locator(".chat-bubble.from-ai").count() >= 1)
    check("「继续展开」按钮出现", page.locator("#ask-expand").count() == 1)

    # 点「继续展开」→ 完整讲法（不再带提示规则）
    page.click("#ask-expand")
    page.wait_for_timeout(400)
    check("展开轮不再带提示规则",
          page.evaluate("() => !window.__calls[1].messages[0].content.includes('思路提示模式')"))
    check("展开话术进 history",
          page.evaluate("() => window.__calls[1].messages.filter(m => m.role==='user').pop().content === '展开讲，这道题给我完整解法'"))
    check("展开后按钮收起", page.locator("#ask-expand").count() == 0)

    # 自由提问页：不启用提示先行
    page.evaluate("App.show('assistant')")
    page.wait_for_selector(".ask-panel")
    page.fill("#ask-input", "光合作用到底怎么回事？")
    page.click("#ask-send")
    page.wait_for_timeout(400)
    check("自由提问首轮不带提示规则",
          page.evaluate("() => !window.__calls[2].messages[0].content.includes('思路提示模式')"))
    check("自由提问无展开按钮", page.locator("#ask-expand").count() == 0)
    check("无页面 JS 错误", len(js_errors) == 0)
    browser.close()

print("========== B3 冒烟：%d 通过 / %d 失败 ==========" % (
    sum(1 for _, ok in results if ok), sum(1 for _, ok in results if not ok)))
sys.exit(0 if all(ok for _, ok in results) else 1)
