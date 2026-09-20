#!/usr/bin/env python3
# E2E：完整闭环（开工→答错→错因自选→解析→微课→自测→补救题→D3重做→D7变式→销号）+ 刷新持久化 + 技能树
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8899"
results = []


def check(name, cond):
    results.append((name, bool(cond)))
    print(("  PASS  " if cond else "  FAIL  ") + name, flush=True)


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        js_errors = []
        page.on("pageerror", lambda e: js_errors.append(str(e)))

        page.goto(BASE)
        page.wait_for_selector("#start-session")

        # ---------- helpers ----------
        def cur():
            return page.evaluate(
                "() => ({ id: App.question.id, type: App.question.type, answer: App.question.answer,"
                " kp: App.question.knowledgePointId, stage: App.stage.type })")

        def answer_correct():
            q = cur()
            t, ans = q["type"], q["answer"]
            if t in ("single", "judge"):
                page.locator(f'.option[data-idx="{int(ans)}"]').click()
            elif t == "multi":
                for i in (ans if isinstance(ans, list) else [ans]):
                    page.locator(f'.option[data-idx="{int(i)}"]').click()
            elif t == "fill":
                page.fill("#fill-answer", str(ans))
            else:
                page.fill("#subj-answer", "过程：由已知条件逐步推导（自评）")
            page.click("#submit-btn")

        def answer_wrong():
            q = cur()
            t, ans = q["type"], q["answer"]
            if t in ("single", "judge"):
                wrong = 1 if int(ans) != 1 else 0
                page.locator(f'.option[data-idx="{wrong}"]').click()
            elif t == "multi":
                ans_list = ans if isinstance(ans, list) else [ans]
                wrong = next(i for i in range(10) if i not in ans_list)
                page.locator(f'.option[data-idx="{wrong}"]').click()
            else:
                page.fill("#fill-answer", "___故意答错___")
            page.click("#submit-btn")

        def next_until_end():
            guard = 0
            while guard < 40:
                guard += 1
                if page.locator("#again-btn").count() > 0:
                    return
                if page.locator("#next-btn").count() > 0:
                    page.click("#next-btn")
                    page.wait_for_timeout(250)
                    if page.locator("#submit-btn").count() > 0:
                        answer_correct()
                        page.wait_for_timeout(150)
                else:
                    page.wait_for_timeout(300)
            raise RuntimeError("session 未在预期步数内结束")

        # ---------- 1. 开工与首题 ----------
        print("\n[1] 开工与首题")
        page.click("#start-session")
        page.wait_for_selector(".stem")
        q1 = cur()
        check("首题为突破题（breakthrough）", q1["stage"] == "breakthrough")
        check("首题来自 SAS 判定 m8a-p10（带微课的知识点）", q1["kp"] == "m8a-p10")

        # ---------- 2. 答错 → 错因自选 → 解析 ----------
        print("\n[2] 答错 → 错因自选 → 解析")
        answer_wrong()
        check("答错提示「悬赏已上榜」", "悬赏已上榜" in page.locator("#result-zone").inner_text())
        check("错因自选 4 项", page.locator(".error-type-btn").count() == 4)
        page.locator('.error-type-btn[data-type="概念"]').click()
        page.wait_for_timeout(150)
        check("错因已记下 + 解析显示", "错因已记下" in page.locator("#result-zone").inner_text()
              and "解析" in page.locator("#result-zone").inner_text())
        page.click("#understood-btn")
        page.wait_for_timeout(200)

        # ---------- 3. 微课 → 自测 → 补救题 ----------
        print("\n[3] 微课 → 自测 → 补救题")
        check("微课推荐页出现（概念错因触发）", page.locator("#take-lesson").count() == 1)
        page.click("#take-lesson")
        page.wait_for_selector(".lesson-card")
        check("微课六段卡渲染（≥5 段）", page.locator(".lesson-card .seg").count() >= 5)
        page.click("#lesson-start-check")
        page.wait_for_selector("#check-submit")
        checks = page.evaluate("k => Lesson.current(k).check", q1["kp"])
        check(f"自测题加载（{len(checks)} 题）", len(checks) >= 1)
        for item in checks:
            page.locator(f'.option[data-idx="{int(item["answer"])}"]').click()
            page.click("#check-submit")
            page.wait_for_timeout(850)
        check("自测全对提示", page.locator("text=自测全对").count() > 0)
        page.wait_for_timeout(1100)  # 900ms 后自动进入补救题
        page.wait_for_selector("#submit-btn")
        check("补救题（趁热打铁）自动插入", cur()["stage"] == "remedial")
        answer_correct()
        page.wait_for_timeout(150)

        # ---------- 4. 完成本组 → 战报 ----------
        print("\n[4] 收尾与战报")
        next_until_end()
        check("战报收尾页出现", page.locator("#again-btn").count() > 0)
        check("今日战报卡片渲染", page.locator(".card.battle").count() > 0)

        # ---------- 5. 悬赏榜（D0 后状态） ----------
        print("\n[5] 悬赏榜（重做中）")
        page.click('.nav-btn[data-view="wrongbook"]')
        page.wait_for_selector(".bounty-list")
        check("悬赏在榜（状态=重做中）", "重做中" in page.locator(".bounty-item").first.inner_text())
        check("显示 3 天后到期", "3 天后" in page.locator(".bounty-list").inner_text())

        # ---------- 6. D3 原题重做 ----------
        print("\n[6] D3 原题重做")
        page.evaluate("() => { const l = Wrongbook.all(); const r = l.find(x => x.status === '重做中');"
                     " r.retestAt = Date.now() - 1000; Store.wrongbook = l; }")
        page.click('.nav-btn[data-view="practice"]')
        page.wait_for_selector("#start-session")
        check("到期悬赏横幅出现", "悬赏到期" in page.locator(".due-banner").inner_text())
        page.click("#start-session")
        page.wait_for_selector(".stem")
        check("重做题排第一（retest）", cur()["stage"] == "retest")
        check("重做题为原题", cur()["id"] == q1["id"])
        answer_correct()
        page.wait_for_timeout(150)
        check("重做通过提示（+5）", "重做通过" in page.locator("#result-zone").inner_text())
        rec = page.evaluate("() => Wrongbook.active()[0]")
        check("状态 → 变式待测", rec["status"] == "变式待测")
        next_until_end()

        # ---------- 7. D7 变式 → 销号 ----------
        print("\n[7] D7 变式 → 销号")
        page.evaluate("() => { const l = Wrongbook.all(); const r = l.find(x => x.status === '变式待测');"
                     " r.variantAt = Date.now() - 1000; Store.wrongbook = l; }")
        page.click('.nav-btn[data-view="practice"]')
        page.wait_for_selector("#start-session")
        page.click("#start-session")
        page.wait_for_selector(".stem")
        v = cur()
        check("变式题排第一（variant）", v["stage"] == "variant")
        check("变式题为同知识点不同题", v["kp"] == q1["kp"] and v["id"] != q1["id"])
        answer_correct()
        page.wait_for_timeout(150)
        check("悬赏销号提示", "悬赏销号" in page.locator("#result-zone").inner_text())
        closed = page.evaluate("() => Wrongbook.all().filter(r => r.status === '已销号').length")
        check("记录已销号（已销号=1）", closed == 1)
        next_until_end()

        # ---------- 8. 销号展示 + 刷新持久化 ----------
        print("\n[8] 销号展示 + 刷新持久化")
        page.click('.nav-btn[data-view="wrongbook"]')
        page.wait_for_timeout(250)
        body = page.inner_text("body")
        check("已销号分区显示", "已销号" in body and "领赏" in body)
        before = page.evaluate("() => ({ attempts: Store.attempts.length,"
                               " masteryCount: Object.keys(Store.mastery).length })")
        page.reload()
        page.wait_for_selector(".nav-btn")
        page.click('.nav-btn[data-view="wrongbook"]')
        page.wait_for_timeout(300)
        after = page.evaluate("() => ({ closed: Wrongbook.all().filter(r => r.status === '已销号').length,"
                              " attempts: Store.attempts.length,"
                              " masteryCount: Object.keys(Store.mastery).length })")
        check("刷新后销号记录仍在", after["closed"] == 1)
        check(f"刷新后作答记录不丢（{before['attempts']} 条）",
              after["attempts"] == before["attempts"] and after["attempts"] >= 7)
        check(f"刷新后掌握度不丢（{before['masteryCount']} 个知识点）",
              after["masteryCount"] == before["masteryCount"] and after["masteryCount"] >= 3)

        # ---------- 9. 技能树 ----------
        print("\n[9] 技能树")
        page.click('.nav-btn[data-view="report"]')
        page.wait_for_selector(".overview-stats")
        check("技能树总览渲染", page.locator(".overview-stats").count() > 0)
        check("技能格子渲染（>10）", page.locator(".skill-node").count() > 10)
        check("SAS 掌握度已修复（≥55）",
              page.evaluate("() => { const m = Store.mastery['m8a-p10']; return m && m.score >= 55; }"))

        # ---------- 9.5 学习页（技能树节点 → 诊断/例题精讲/学完就练） ----------
        print("\n[9.5] 学习页")
        kp_id = page.evaluate("""() => {
            const has = new Set(Store.questions.map(q => q.knowledgePointId));
            const nodes = [...document.querySelectorAll('.skill-node.clickable')];
            const hit = nodes.find(n => has.has(n.dataset.kp));
            return hit ? hit.dataset.kp : null;
        }""")
        check("找到有题目的技能节点", kp_id is not None)
        page.locator(f'.skill-node[data-kp="{kp_id}"]').click()
        page.wait_for_selector(".learn-hero")
        check("学习页头部（名称+掌握度）渲染", "掌握度" in page.locator(".learn-hero").inner_text())
        check("例题精讲区渲染", page.locator(".example-item").count() > 0)
        if page.locator("[data-reveal]").count() > 0:
            page.locator("[data-reveal]").first.click()
            page.wait_for_timeout(100)
            check("例题讲解可展开", page.locator(".example-explain").first.is_visible())
        page.click("#focus-start")
        page.wait_for_selector(".stem")
        check("学完就练：专项锁定该知识点", cur()["kp"] == kp_id and cur()["stage"] == "breakthrough")
        answer_correct()
        page.wait_for_timeout(150)
        next_until_end()
        check("专项练正常收尾（战报页）", page.locator("#again-btn").count() > 0)

        # ---------- 10. 追问式讲解（有 Key：阿K 苏格拉底式三问，mock fetch） ----------
        print("\n[10] 追问式讲解")
        page.evaluate("""() => {
            Store.settings = { ...Store.settings, aiKey: 'e2e-key' };
            window.fetch = (url, opt) => Promise.resolve({
                ok: true, status: 200,
                json: () => Promise.resolve({ choices: [{ message: { content: '方向对——就是盯着截距看。' }, finish_reason: 'stop' }] }),
            });
        }""")
        page.click('.nav-btn[data-view="practice"]')
        page.wait_for_selector("#start-session")
        page.click("#start-session")
        page.wait_for_selector(".stem")
        answer_wrong()
        page.locator('.error-type-btn[data-type="概念"]').click()
        page.wait_for_selector(".socratic-card")
        check("有 Key：追问式讲解卡出现", page.locator(".socratic-card").count() == 1)
        check("三问步骤条（考什么→下一步→重做）", page.locator(".sostep").count() == 3)
        check("题面重现且不亮答案", page.locator(".socratic-card .stem").count() == 1
              and page.locator(".socratic-card .option").count() == 0)
        # 第一问：回答 → AI 点拨
        page.fill("#so-input", "考一次函数图象过哪几个象限")
        page.click("#so-send")
        page.wait_for_timeout(400)
        check("第一问 AI 点拨出现", page.locator(".chat-bubble.from-me").count() == 1
              and page.locator(".chat-bubble.from-ai").count() >= 3)
        # 第二问：回答 → 进入重做
        page.fill("#so-input", "先看截距的正负")
        page.click("#so-send")
        page.wait_for_selector("#so-body .option", timeout=5000)
        check("第三问重做界面（可选题）", page.locator("#so-body .option").count() > 0)
        # 重做：答对 → 看懂了继续 → 回练习流
        q = cur()
        ans = q["answer"]
        if isinstance(ans, list):
            for i in ans:
                page.locator(f'#so-body .option[data-idx="{int(i)}"]').click()
        elif q["type"] == "fill":
            page.fill("#so-fill", str(ans))
        else:
            page.locator(f'#so-body .option[data-idx="{int(ans)}"]').click()
        page.click("#so-redo-submit")
        page.wait_for_selector("#so-understood")
        check("重做答对 → 收尾按钮出现", page.locator("#so-understood").count() == 1)
        page.click("#so-understood")
        page.wait_for_timeout(300)
        check("追问式收尾后仍推微课（概念错因）", page.locator("#take-lesson").count() == 1)
        page.click("#skip-lesson")
        page.wait_for_timeout(300)
        check("跳过微课 → 跟进练习二选一（AI 原创 / 真题风格）",
              page.locator("#followup-ai").count() == 1 and page.locator("#followup-real").count() == 1)
        page.click("#followup-ai")
        page.wait_for_timeout(600)
        if page.locator("#followup-continue").count() > 0:
            check("mock 出题不可解析 → 降级页不阻塞", page.locator("#followup-continue").count() == 1)
            page.click("#followup-continue")
            page.wait_for_timeout(300)
        check("跟进练习收尾后回到练习流", page.locator("#submit-btn").count() > 0
              or page.locator("#again-btn").count() > 0)
        if page.locator("#submit-btn").count() > 0:
            answer_correct()
            page.wait_for_timeout(150)
        next_until_end()
        # 恢复无 Key 环境
        page.evaluate("() => { Store.settings = { ...Store.settings, aiKey: '' }; }")

        # ---------- 10.5 溯源诊断全链路（§5.5：根因优先 + 深度>2 回炉） ----------
        print("\n[10.5] 溯源诊断全链路")
        # 造数据：先修链 p6→p7→p10→p12 全弱（p12 深度 3 需回炉，p10/p7 根因指向 p6），其余 L4 全部已掌握
        page.evaluate("""() => {
            const mastered = kp => ({ score: 92, lastReviewAt: Date.now(), reviewCount: 6,
              correctStreak: 3, fastStreak: 2, wrongStreak: 0, interval: 8 });
            const weak = score => ({ score, lastReviewAt: Date.now(), reviewCount: 1,
              correctStreak: 0, fastStreak: 0, wrongStreak: 1, interval: 1 });
            const m = {};
            for (const kp of Store.knowledgePoints) {
              if (kp.level !== 4) continue;
              m[kp.id] = mastered(kp);
            }
            m['m8a-p12'] = weak(40);
            m['m8a-p10'] = weak(45);
            m['m8a-p7'] = weak(50);
            m['m8a-p6'] = weak(35);
            Store.mastery = m;
            // 拉平链上权重：种子权重下表层 p10(weight5) 恒胜根因 p6(weight2)，
            // 造数据时让根因点 p6 的 1.5× 加权可压过表层点，验证「根因优先」
            const kps = Store.knowledgePoints.map(kp =>
              kp.id === 'm8a-p6' ? { ...kp, weight: 5 }
              : ['m8a-p7', 'm8a-p10', 'm8a-p12'].includes(kp.id) ? { ...kp, weight: 3 } : kp);
            localStorage.setItem('tutor.knowledgePoints', JSON.stringify(kps));
            Store.activeSubjectId = 'math';
        }""")
        def skill_tag(kp_id):
            return page.evaluate(
                "kpId => { const n = document.querySelector('.skill-node[data-kp=\"' + kpId + '\"]');"
                " return n && n.querySelector('.skill-diag') ? n.querySelector('.skill-diag').innerText : '' }",
                kp_id)
        page.click('.nav-btn[data-view="report"]')
        page.wait_for_selector(".overview-stats")
        check("回炉标签：深度>2 的 p12 显示「回炉」并指向链底 p6",
              "回炉" in skill_tag("m8a-p12") and "全等形的识别" in skill_tag("m8a-p12"))
        check("根因标签：p10 显示「根因」并指向 p6",
              "根因" in skill_tag("m8a-p10") and "全等形的识别" in skill_tag("m8a-p10"))
        # 练习流：回炉点 p12 出池，根因点 p6 加权优先出题
        # 注意：#start-session 是「今日计划」首块按钮，会切换科目；用 #start-manual 锁定当前科目（math）
        page.click('.nav-btn[data-view="practice"]')
        # 自选区默认折叠且懒渲染，#start-manual 展开后才存在；已展开则不再点，避免反而折叠
        if page.locator("#start-manual").count() == 0:
            page.click("#scope-toggle")
        page.wait_for_selector("#start-manual")
        page.click("#start-manual")
        page.wait_for_selector(".stem")
        tq = cur()
        check("回炉点 p12 不出题（转回炉重学）", tq["kp"] != "m8a-p12")
        check("根因点 p6 优先出题（加权 1.5×，实际 " + str(tq["kp"]) + "）", tq["kp"] == "m8a-p6")
        answer_correct()
        page.wait_for_timeout(150)
        next_until_end()
        check("溯源场景练习正常收尾", page.locator("#again-btn").count() > 0)

        # ---------- 10.6 题库管理（设置页 CRUD：新增/校验/编辑/删除） ----------
        print("\n[10.6] 题库管理")
        dialogs = []
        page.on("dialog", lambda d: (dialogs.append(d.message), d.accept()))
        page.click('.nav-btn[data-view="settings"]')
        page.wait_for_selector("#bank-card #bank-new")
        check("题库管理卡渲染（科目选择+新增按钮）", page.locator("#bank-subject").count() == 1)
        # 切到地理科：科目筛选生效（只列地理题，知识点下拉只列地理 L4）
        page.select_option("#bank-subject", "geography")
        page.wait_for_timeout(250)
        geo_count = page.evaluate("() => Store.questions.filter(q => q.subjectId === 'geography').length")
        check("地理科题目数与列表一致", f"{geo_count} 题" in page.locator("#bank-card").inner_text())
        page.click("#bank-new")
        page.wait_for_selector("#bank-save")
        kp_opts = page.evaluate("() => [...document.querySelectorAll('#bank-kp option')].map(o => o.value)")
        check("知识点下拉只列地理 L4 叶子", len(kp_opts) > 0 and all(x.startswith("geo") for x in kp_opts))
        # 校验：空题干保存 → alert 拦截
        page.click("#bank-save")
        page.wait_for_timeout(200)
        check("空题干被校验拦截（题干不能为空）", any("题干不能为空" in m for m in dialogs))
        check("校验失败未入库", page.locator("#bank-save").count() == 1)
        # 合法填空题：题型切换 → 填写 → 保存
        page.select_option("#bank-type", "fill")
        page.wait_for_selector("#bank-ans")
        page.fill("#bank-stem", "E2E 新增：我国领土最南端是____。")
        page.fill("#bank-ans", "曾母暗沙")
        page.fill("#bank-exp", "最南端为南沙群岛曾母暗沙。")
        page.click("#bank-save")
        page.wait_for_timeout(250)
        new_q = page.evaluate("() => Store.questions.find(q => q.stem.includes('E2E 新增'))")
        check("新增题入库（id=c-*、科目跟随知识点）",
              new_q is not None and new_q["id"].startswith("c-") and new_q["subjectId"] == "geography")
        check("列表出现新题（自带「自」标）", "E2E 新增" in page.locator("#bank-card").inner_text())
        # 编辑：改题干 → 保存生效
        page.click(f'[data-edit-q="{new_q["id"]}"]')
        page.wait_for_selector("#bank-save")
        page.fill("#bank-stem", "E2E 编辑后：我国领土最东端是____。")
        page.click("#bank-save")
        page.wait_for_timeout(250)
        check("编辑生效", "E2E 编辑后" in page.locator("#bank-card").inner_text())
        # 删除：confirm 接受 → 列表消失
        page.click(f'[data-del-q="{new_q["id"]}"]')
        page.wait_for_timeout(250)
        check("删除后列表与存储同步清空",
              "E2E 编辑后" not in page.locator("#bank-card").inner_text()
              and page.evaluate("id => Store.questions.some(q => q.id === id)", new_q["id"]) is False)

        # ---------- 11. JS 错误 ----------
        check("无页面 JS 错误", len(js_errors) == 0)
        for e in js_errors[:5]:
            print("    JS ERROR:", e)

        browser.close()


run()
fails = [n for n, ok in results if not ok]
print("\n========== E2E 结果：{} 通过 / {} 失败 ==========".format(len(results) - len(fails), len(fails)))
if fails:
    print("失败项：\n  - " + "\n  - ".join(fails))
    sys.exit(1)
