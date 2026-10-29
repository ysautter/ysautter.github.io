import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"
OUT = "/tmp/dasohr-shots"
HIDE = "div.border-amber-200.bg-amber-100{display:none!important}"
INVOICE_ID = sys.argv[1]

MOBILE = ["/", "/lessons/today", "/lessons/week", "/invoices", f"/invoices/{INVOICE_ID}", "/students"]
DESKTOP = ["/lessons/week", "/admin/invoices", "/admin/prices", f"/invoices/{INVOICE_ID}", "/students"]


def login(page):
    page.goto(BASE + "/login")
    page.fill('input[type="email"]', "admin-lehrerin@das-ohr.test")
    page.fill('input[type="password"]', "das-ohr-demo")
    page.click('button[type="submit"]')
    page.wait_for_url(lambda u: "/login" not in u, timeout=15000)


def shoot(ctx, paths, tag):
    page = ctx.new_page()
    login(page)
    for p in paths:
        page.goto(BASE + p)
        page.wait_for_load_state("networkidle")
        page.add_style_tag(content=HIDE)
        page.wait_for_timeout(800)
        name = p.strip("/").replace("/", "_") or "home"
        page.screenshot(path=f"{OUT}/{tag}-{name[:40]}.png")
        page.screenshot(path=f"{OUT}/{tag}-{name[:40]}-full.png", full_page=True)
        print(tag, p, "ok")


with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path="/usr/bin/chromium")
    shoot(b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=3,
                        is_mobile=True, has_touch=True, locale="de-DE", timezone_id="Europe/Berlin"),
          MOBILE, "m")
    shoot(b.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=2,
                        locale="de-DE", timezone_id="Europe/Berlin"),
          DESKTOP, "d")
    b.close()
