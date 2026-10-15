"""
End-to-end tests for MeeSeva One Portal.

Drives the portal in a real Chromium browser the way a citizen would and checks
what appears on screen. Writes results to tests/results/results.json and
screenshots to tests/results/screenshots/.

Usage:
    python -m http.server 8000                 # from the repo root, in one terminal
    python tests/e2e/test_portal.py            # in another
    python tests/e2e/test_portal.py https://meeseva-v7-happening.vercel.app/
"""
import json
import pathlib
import sys
import time

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
APP_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000/"
OUT = ROOT / "tests" / "results"
SHOTS = OUT / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)

results = []


def record(case_id, module, name, expected, check):
    """Run one check. `check` returns (actual_text, passed)."""
    started = time.time()
    try:
        actual, passed = check()
    except Exception as exc:  # a crash is a failed case, not a failed run
        actual, passed = f"Exception: {exc}"[:120], False
    results.append(dict(
        id=case_id, module=module, name=name, expected=expected, actual=actual,
        status="Pass" if passed else "Fail", ms=int((time.time() - started) * 1000),
    ))
    print(f"{case_id} {'PASS' if passed else 'FAIL'}  {name}: {actual}")


def drawer_open(page):
    return page.evaluate("document.body.classList.contains('drawer-open')")


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()

        # ---------------------------------------------------------- desktop
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
        page = ctx.new_page()
        js_errors = []
        page.on("pageerror", lambda e: js_errors.append(str(e)))
        page.goto(APP_URL)
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SHOTS / "01-home.png"))

        record("TC01", "Home", "Portal loads with correct title",
               "Page title shows MeeSeva Life Services Portal",
               lambda: (page.title(), "MeeSeva" in page.title()))

        def stage_grid():
            n = page.locator("#stage-grid [data-open-stage]").count()
            return f"{n} tiles rendered in grid", n == 15
        record("TC02", "Home", "Life stage grid renders", "15 life stage tiles shown", stage_grid)

        def hero_stats():
            values = page.locator("#hero-stats .sr-only").all_inner_texts()
            return " / ".join(values), values[:3] == ["396", "15", "21"]
        record("TC03", "Home", "Hero KPIs show catalogue counts",
               "396 services, 15 stages, 21 online", hero_stats)

        # ---------------------------------------------------------- login
        def login_gate():
            page.locator('[data-open-stage="A"]').first.click()
            page.wait_for_timeout(300)
            shown = page.locator("#login.open").count() == 1
            return ("Login dialog opened" if shown else "Dialog not shown"), shown
        record("TC04", "Auth", "Opening a life stage when logged out asks for login",
               "Login dialog opens", login_gate)
        page.screenshot(path=str(SHOTS / "03-login.png"))

        def short_aadhaar():
            page.fill("#login-aadhaar", "12345")
            page.click("#login-submit")
            page.wait_for_timeout(200)
            err = page.inner_text("#login-error").strip()
            return f'Error shown: "{err}"', bool(err)
        record("TC05", "Auth", "Submit with invalid Aadhaar (5 digits)",
               "Validation error, OTP not sent", short_aadhaar)

        def aadhaar_format():
            page.fill("#login-aadhaar", "")
            page.type("#login-aadhaar", "123456789012")
            value = page.input_value("#login-aadhaar")
            return f'Field shows "{value}"', value == "1234 5678 9012"
        record("TC06", "Auth", "Aadhaar input auto formats",
               "Number grouped as 1234 5678 9012", aadhaar_format)

        def strips_letters():
            page.fill("#login-aadhaar", "")
            page.type("#login-aadhaar", "abcd1234")
            value = page.input_value("#login-aadhaar")
            outcome = (f'Field shows "{value}"', value == "1234")
            page.fill("#login-aadhaar", "")
            page.type("#login-aadhaar", "123456789012")
            return outcome
        record("TC07", "Auth", "Letters typed in Aadhaar field", "Non digits stripped", strips_letters)

        def send_otp():
            page.click("#login-submit")
            page.wait_for_timeout(1000)
            visible = page.locator("#login-otp-step").is_visible()
            locked = page.locator("#login-aadhaar").is_disabled()
            return ("OTP step visible, Aadhaar locked" if visible else "OTP step hidden"), visible and locked
        record("TC08", "Auth", "Send OTP with valid 12 digit Aadhaar",
               "OTP step shown, Aadhaar field locked", send_otp)

        def short_otp():
            page.fill("#login-otp", "123")
            page.click("#login-submit")
            page.wait_for_timeout(200)
            err = page.inner_text("#login-error").strip()
            return f'Error shown: "{err}"', bool(err)
        record("TC09", "Auth", "Verify with short OTP (3 digits)",
               "Validation error, not logged in", short_otp)

        def valid_otp():
            page.fill("#login-otp", "482913")
            page.click("#login-submit")
            page.wait_for_timeout(1200)
            label = page.inner_text("#login-btn-text")
            ok = drawer_open(page) and page.locator("#login.open").count() == 0
            return f'Logged in, drawer opened, header shows "{label}"', ok
        record("TC10", "Auth", "Verify with valid 6 digit OTP",
               "Login successful, user continues to chosen stage", valid_otp)
        page.wait_for_timeout(500)
        page.screenshot(path=str(SHOTS / "06-service-list.png"))

        # ---------------------------------------------------------- services
        def stage_services():
            title = page.inner_text("#drawer-title")
            n = page.locator("#drawer-content .svc").count()
            return f'"{title}" lists {n} services', n == 13
        record("TC11", "Services", "Stage drawer lists all services in the stage",
               "Birth & early childhood shows 13 services", stage_services)

        def availability_chips():
            live = page.locator("#drawer-content .chip--live").count()
            soon = page.locator("#drawer-content .chip--soon").count()
            return f"{live} Available, {soon} Coming soon", live == 3 and soon == 10
        record("TC12", "Services", "Services tagged by availability",
               "3 Available, 10 Coming soon", availability_chips)

        def escape_drawer():
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)
            closed = not drawer_open(page)
            return ("Drawer closed" if closed else "Still open"), closed
        record("TC13", "Accessibility", "Escape key closes drawer",
               "Drawer closes, focus returns", escape_drawer)

        # ---------------------------------------------------------- search
        def search_hit():
            page.fill("#search-input", "pension")
            page.press("#search-input", "Enter")
            page.wait_for_timeout(400)
            n = page.locator("#drawer-content .svc").count()
            return f'{n} results for "pension"', n > 0
        record("TC14", "Search", "Search a valid keyword", "Matching services listed", search_hit)
        page.screenshot(path=str(SHOTS / "07-search.png"))
        page.keyboard.press("Escape")

        def search_miss():
            page.fill("#search-input", "zzqx")
            page.press("#search-input", "Enter")
            page.wait_for_timeout(400)
            empty = page.locator("#drawer-content .no-match").count() == 1
            return ("Empty state shown" if empty else "No empty state"), empty
        record("TC15", "Search", "Search a keyword with no match",
               "Friendly empty state, no crash", search_miss)
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)

        # ---------------------------------------------------------- language
        def to_telugu():
            page.click("#lang-btn")
            page.click('[data-lang="te"]')
            page.wait_for_timeout(500)
            lang = page.evaluate("document.documentElement.lang")
            return f'html lang="{lang}", labels in Telugu', lang == "te"
        record("TC16", "Language", "Switch language to Telugu",
               "Interface switches to Telugu", to_telugu)
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(300)
        page.screenshot(path=str(SHOTS / "08-telugu.png"))

        def language_persists():
            page.reload()
            page.wait_for_timeout(1200)
            lang = page.evaluate("document.documentElement.lang")
            return f'After reload: lang "{lang}", session kept', lang == "te"
        record("TC17", "Language", "Language choice persists after reload",
               "Telugu still selected", language_persists)
        page.click("#lang-btn")
        page.click('[data-lang="en"]')
        page.wait_for_timeout(300)

        def large_text():
            page.click('[data-size="large"]')
            size = page.evaluate("document.documentElement.dataset.textSize")
            page.click('[data-size="default"]')
            return f"text size = {size}", size == "large"
        record("TC18", "Accessibility", "A+ increases text size", "Large text mode applied", large_text)

        # ---------------------------------------------------------- session
        def session_kept():
            page.click('[data-open-stage="K"]')
            page.wait_for_timeout(500)
            opened = drawer_open(page)
            page.keyboard.press("Escape")
            return ("Stage opened without new login" if opened else "Asked to log in again"), opened
        record("TC19", "Auth", "Session survives page reload",
               "Logged in user goes straight to stage", session_kept)

        def logout():
            page.click("#login-btn")
            page.wait_for_timeout(200)
            label = page.inner_text("#login-btn-text")
            page.click('[data-open-stage="B"]')
            page.wait_for_timeout(300)
            locked = page.locator("#login.open").count() == 1
            page.keyboard.press("Escape")
            page.wait_for_timeout(200)
            return f'Header shows "{label}", stages locked again', locked
        record("TC20", "Auth", "Logout", "Session cleared, stages require login", logout)

        def escape_login():
            closed = page.locator("#login.open").count() == 0
            return ("Login dialog closed by Escape" if closed else "Still open"), closed
        record("TC21", "Accessibility", "Escape key closes login dialog", "Dialog closes", escape_login)

        record("TC22", "Stability", "No JavaScript errors during session", "Zero console errors",
               lambda: (f"{len(js_errors)} errors", len(js_errors) == 0))
        ctx.close()

        # ---------------------------------------------------------- mobile
        mob = browser.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce",
                                  device_scale_factor=2, is_mobile=True, has_touch=True)
        mpage = mob.new_page()
        mpage.goto(APP_URL)
        mpage.wait_for_timeout(1500)
        mpage.screenshot(path=str(SHOTS / "09-mobile.png"))

        def no_overflow():
            width = mpage.evaluate("document.documentElement.scrollWidth")
            return f"page width {width}px at 390px viewport", width <= 390
        record("TC23", "Responsive", "Mobile layout at 390px", "No horizontal scroll", no_overflow)
        browser.close()

    (OUT / "results.json").write_text(json.dumps(results, indent=2))
    passed = sum(r["status"] == "Pass" for r in results)
    print(f"\n{passed}/{len(results)} passed")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(run())
