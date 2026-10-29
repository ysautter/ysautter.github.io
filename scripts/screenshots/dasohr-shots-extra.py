import sys
from playwright.sync_api import sync_playwright
BASE="http://localhost:5173"; OUT="/tmp/dasohr-shots"
HIDE="div.border-amber-200.bg-amber-100{display:none!important}"
gid, inv = sys.argv[1], sys.argv[2]
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path="/usr/bin/chromium")
    ctx = b.new_context(viewport={"width":390,"height":844}, device_scale_factor=3, is_mobile=True,
                        has_touch=True, locale="de-DE", timezone_id="Europe/Berlin", accept_downloads=True)
    page = ctx.new_page()
    page.goto(BASE+"/login")
    page.fill('input[type="email"]',"admin-lehrerin@das-ohr.test"); page.fill('input[type="password"]',"das-ohr-demo")
    page.click('button[type="submit"]'); page.wait_for_url(lambda u:"/login" not in u)
    # last week, Monday
    page.goto(BASE+"/lessons/week"); page.wait_for_load_state("networkidle")
    page.locator("button").filter(has=page.locator("svg")).first  # noop
    page.get_by_role("button").nth(0)
    btns = page.locator("main button")
    btns.nth(0).click(); page.wait_for_load_state("networkidle"); page.wait_for_timeout(600)
    page.add_style_tag(content=HIDE); page.wait_for_timeout(300)
    page.screenshot(path=f"{OUT}/m-lastweek.png")
    # scroll a bit to show the group lesson / cancelled lesson
    page.mouse.wheel(0, 700); page.wait_for_timeout(500)
    page.screenshot(path=f"{OUT}/m-lastweek-scrolled.png")
    page.goto(BASE+f"/lessons/{gid}"); page.wait_for_load_state("networkidle"); page.add_style_tag(content=HIDE); page.wait_for_timeout(600)
    page.screenshot(path=f"{OUT}/m-group-lesson.png")
    # invoice PDF
    page.goto(BASE+f"/invoices/{inv}"); page.wait_for_load_state("networkidle")
    with page.expect_download() as d:
        page.get_by_text("PDF herunterladen").click()
    d.value.save_as(f"{OUT}/MM-1.pdf")
    b.close()
print("ok")
