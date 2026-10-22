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
import re
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


def sign_in(page):
    """Prototype login: any 12 digit Aadhaar and any 6 digit OTP."""
    page.fill("#login-aadhaar", "123456789012")
    page.click("#login-submit")
    page.wait_for_timeout(1000)
    page.fill("#login-otp", "123456")
    page.click("#login-submit")
    page.wait_for_timeout(1200)


def birth_service_cases(browser):
    """Birth & early childhood: its own pages, from finding the birth record to the acknowledgement."""
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    page = ctx.new_page()
    js_errors = []
    page.on("pageerror", lambda e: js_errors.append(str(e)))
    svc = page.locator("#service-page")
    title = lambda: page.inner_text("#bp-title").strip()
    fill_sample = lambda: svc.get_by_role("button", name="Fill sample data").click()
    show_payment = lambda: page.click('form[data-form="apply"] button[type="submit"]')
    rows = svc.locator("tbody tr")

    def pay():
        page.locator('[data-act="pay"]').click()
        page.wait_for_timeout(1300)
        return page.inner_text("#bp-appno").strip()

    page.goto(APP_URL)
    page.wait_for_timeout(1000)
    page.locator('[data-open-stage="A"]').first.click()
    page.wait_for_timeout(300)
    sign_in(page)

    def step_one():
        url_ok = page.url.endswith("#/services/A")
        home_hidden = not page.locator("#main-content").is_visible()
        cards = svc.locator(".svc-choice").count()
        eyebrow = svc.locator(".svc-eyebrow").inner_text()
        return f'"{title()}" page, {cards} ways to find the record, home hidden: {home_hidden}', \
            url_ok and home_hidden and cards == 2 and "STEP 1 OF 2" in eyebrow.upper()
    record("TC24", "Birth services", "Life stage opens as its own page after login",
           "Step 1 of 2 page with Search by Details and Non-Availability Certificate", step_one)

    def district_required():
        svc.get_by_role("link", name="Search by Details").click()
        page.wait_for_timeout(300)
        page.click('form[data-form="district"] button[type="submit"]')
        err = page.inner_text("#bp-err-district")
        options = page.locator("#bp-district option").count() - 1
        return f'Error shown: "{err}", {options} districts listed', bool(err) and options == 33
    record("TC25", "Birth services", "Select District is mandatory",
           "Error shown; all 33 districts offered", district_required)

    def sample_district():
        fill_sample()
        chosen = page.input_value("#bp-district")
        page.click('form[data-form="district"] button[type="submit"]')
        page.wait_for_timeout(300)
        ghmc = page.locator("#bp-circle").is_visible() and svc.get_by_text("Search by Acknowledgement Number").is_visible()
        return f'District "{chosen}"; GHMC birth details and acknowledgement search shown', chosen == "HYDERABAD" and ghmc
    record("TC26", "Birth services", "Fill sample data, then Next",
           "Hyderabad chosen; GHMC fields and acknowledgement search shown", sample_district)

    def details_required():
        page.click('form[data-form="details"] button[type="submit"]')
        err = svc.locator(".svc-form-error").inner_text()
        invalid = page.locator('#bp-dob[aria-invalid="true"], #bp-circle[aria-invalid="true"], #bp-gender[aria-invalid="true"]').count()
        return f'"{err}"; {invalid} fields marked', invalid == 3
    record("TC27", "Birth services", "Search without the mandatory birth details",
           "Message asks for Date of Birth, Circle/Area and Gender", details_required)

    results_url = {}

    def search_register():
        fill_sample()
        page.click('form[data-form="details"] button[type="submit"]')
        page.wait_for_timeout(500)
        results_url["url"] = page.url
        n = rows.count()
        text = svc.locator("tbody").text_content().lower()
        criteria = svc.locator(".svc-criteria").inner_text()
        ok = title() == "Matching Birth Records" and n >= 4 and "sri lakshmi gaddam" in text and "Circle No.: 24" in criteria
        return f"{n} records for {criteria.replace(chr(10), ' ')}", ok
    record("TC28", "Birth services", "Search lists the birth register for those details",
           "Matching Birth Records table with acknowledgement no., child, parents, hospital, officer", search_register)
    page.screenshot(path=str(SHOTS / "10-birth-results.png"))

    def same_list():
        first = rows.all_text_contents()
        svc.get_by_role("link", name="Back to search").click()
        page.wait_for_timeout(300)
        page.click('form[data-form="details"] button[type="submit"]')
        page.wait_for_timeout(500)
        again = rows.all_text_contents()
        return f"{len(first)} rows before, {len(again)} after, identical: {first == again}", first == again
    record("TC29", "Birth services", "The same search gives the same list", "Identical rows", same_list)

    def view_details():
        svc.locator("tr", has_text="SRI LAKSHMI").get_by_role("button", name="View Details").click()
        page.wait_for_timeout(400)
        status = svc.locator(".svc-status").inner_text()
        cards = svc.locator(".svc-card").count()
        name_off = svc.locator('.svc-card[data-service="name"]').get_attribute("aria-disabled") == "true"
        return f'"{status}", {cards} services', "Record found for" in status and cards == 3 and name_off
    record("TC30", "Birth services", "View Details opens step 2 for that record",
           "Record found; Birth Certificate, Name inclusion (off: already named), Correction", view_details)
    page.screenshot(path=str(SHOTS / "11-birth-select.png"))

    def applicant_checks():
        svc.locator('a.svc-card[data-service="cert"]').click()
        page.wait_for_timeout(300)
        page.fill("#bp-applicant", "Gaddam Ravi Kumar")
        page.fill("#bp-mobile", "12345")
        page.fill("#bp-pincode", "110001")
        show_payment()
        errs = [page.inner_text(f"#bp-err-{n}") for n in ("mobile", "pincode", "declare")]
        return " | ".join(errs), all(errs)
    record("TC31", "Birth services", "Application form validates applicant details",
           "Mobile, Telangana pincode and declaration errors shown", applicant_checks)

    def sample_application():
        fill_sample()
        show_payment()
        page.wait_for_timeout(300)
        shown = page.locator("#bp-pay-h").is_visible()
        total = page.locator(".svc-pay tr.total").inner_text().replace("\t", " ")
        return f"Payment shown: {total}", shown and svc.get_by_role("button", name="Fill sample data").count() == 0
    record("TC32", "Birth services", "Fill sample data on the application form",
           "Every field valid; payment step shown", sample_application)
    page.screenshot(path=str(SHOTS / "12-birth-payment.png"))

    def certificate():
        no = pay()
        issued = title() == "Certificate issued"
        svc.get_by_role("link", name="View certificate").click()
        page.wait_for_timeout(300)
        cert = page.locator(".svc-cert").inner_text()
        return f'{no}, certificate for Sri Lakshmi Gaddam', issued and bool(re.match(r"^BC02\d{10}$", no)) \
            and "Sri Lakshmi Gaddam" in cert and "not a legal document" in cert
    record("TC33", "Birth services", "Birth certificate issued after payment",
           "Application no. BC…; sample certificate marked as not a legal document", certificate)
    page.screenshot(path=str(SHOTS / "13-birth-certificate.png"))

    def name_inclusion():
        page.goto(results_url["url"])
        page.wait_for_timeout(500)
        svc.locator("tr", has_text="1202436100452").get_by_role("button", name="Not named yet", exact=True).click()
        page.wait_for_timeout(300)
        fill_sample()
        page.fill("#bp-childFirst", "Ayesha2")
        page.set_input_files("#bp-doc", {"name": "photo.gif", "mimeType": "image/gif", "buffer": b"GIF89a"})
        show_payment()
        name_err, doc_err = page.inner_text("#bp-err-childFirst"), page.inner_text("#bp-err-doc")
        page.fill("#bp-childFirst", "Ayesha")
        page.set_input_files("#bp-doc", {"name": "big.pdf", "mimeType": "application/pdf", "buffer": b"a" * (2 * 1024 * 1024 + 1)})
        show_payment()
        size_err = page.inner_text("#bp-err-doc")
        page.set_input_files("#bp-doc", {"name": "school-record.pdf", "mimeType": "application/pdf", "buffer": b"%PDF-1.4"})
        show_payment()
        no = pay()
        return f'"{name_err}" / "{doc_err}" / "{size_err}" then {no}', \
            name_err == "Use letters only." and "PDF, JPG or PNG" in doc_err and "2 MB" in size_err and no.startswith("NI02")
    record("TC34", "Birth services", "Child name inclusion from a 'Not named yet' record",
           "Name and document checks, then application no. NI…", name_inclusion)

    def correction():
        # step 2 shows the record chosen last, so pick Sri Lakshmi Gaddam's record again
        page.goto(results_url["url"])
        page.wait_for_timeout(400)
        svc.locator("tr", has_text="SRI LAKSHMI").get_by_role("button", name="View Details").click()
        page.wait_for_timeout(400)
        svc.locator('a.svc-card[data-service="corr"]').click()
        page.wait_for_timeout(300)
        fill_sample()
        page.select_option("#bp-field", "mother")
        page.fill("#bp-corrected", "Gaddam Anusha")
        show_payment()
        err = page.inner_text("#bp-err-corrected")
        page.fill("#bp-corrected", "Gaddam Anusha Devi")
        show_payment()
        no = pay()
        return f'"{err}" then {no}', "must be different" in err and no.startswith("BR02")
    record("TC35", "Birth services", "Correction rejects an unchanged value",
           "Error for an unchanged value, then application no. BR…", correction)

    def no_record():
        page.goto(APP_URL + "#/services/A/find-record/details?district=HYDERABAD")
        page.wait_for_timeout(400)
        fill_sample()
        page.fill("#bp-mother", "Xyz")
        page.click('form[data-form="details"] button[type="submit"]')
        page.wait_for_timeout(400)
        status = svc.locator(".svc-status").inner_text()
        cards = svc.locator(".svc-card").count()
        return f'"{status}", {cards} service', page.url.endswith("#/services/A/select") and "No registered birth record" in status and cards == 1
    record("TC36", "Birth services", "A search with no match",
           "Goes to the Non-Availability Certificate", no_record)

    def nac():
        svc.locator('a.svc-card[data-service="nac"]').click()
        page.wait_for_timeout(300)
        fill_sample()
        show_payment()
        no = pay()
        due = "Expected by" in svc.locator(".svc-receipt").inner_text()
        return f"{no}, expected-by date shown: {due}", no.startswith("NA02") and due
    record("TC37", "Birth services", "Non-Availability Certificate application",
           "Application no. NA… with an expected-by date", nac)

    def ack_search():
        page.goto(APP_URL + "#/services/A/find-record/details?district=HYDERABAD")
        page.wait_for_timeout(400)
        svc.get_by_text("Search by Acknowledgement Number").click()
        page.fill("#bp-ack", "12345")
        page.click('form[data-form="ack"] button[type="submit"]')
        err = page.inner_text("#bp-err-ack")
        page.fill("#bp-ack", "1202436100421")
        page.click('form[data-form="ack"] button[type="submit"]')
        page.wait_for_timeout(400)
        n = rows.count()
        return f'"{err}" then {n} record', "13-digit" in err and n == 1
    record("TC38", "Birth services", "Search by acknowledgement number",
           "13-digit check, then the one matching record", ack_search)

    def other_district():
        page.goto(APP_URL + "#/services/A/find-record/details?district=WARANGAL")
        page.wait_for_timeout(400)
        locked = page.locator("#bp-office").is_disabled()
        fill_sample()
        page.click('form[data-form="details"] button[type="submit"]')
        page.wait_for_timeout(500)
        text = svc.locator("tbody").text_content().lower()
        return f"Office locked until type chosen: {locked}; {rows.count()} records", locked and "arjun kodati" in text
    record("TC39", "Birth services", "Other districts search by location type, office, gender and year",
           "Office list waits for the location type; records listed", other_district)

    def applications():
        page.goto(APP_URL + "#/services/A")
        page.wait_for_timeout(400)
        before = svc.locator(".svc-app").count()
        page.once("dialog", lambda d: d.accept())
        svc.locator(".svc-app").first.get_by_role("button", name="Withdraw").click()
        page.wait_for_timeout(300)
        after = svc.locator(".svc-app").count()
        return f"{before} applications listed, {after} after withdrawing one", before >= 3 and after == before - 1
    record("TC40", "Birth services", "Your applications: list and withdraw",
           "Submitted applications listed; withdrawing removes one", applications)

    def back_and_home():
        page.goto(APP_URL + "#/services/A/find-record/details?district=HYDERABAD")
        page.wait_for_timeout(300)
        fill_sample()
        page.click('form[data-form="details"] button[type="submit"]')
        page.wait_for_timeout(400)
        page.go_back()
        page.wait_for_timeout(300)
        back_ok = "district=HYDERABAD" in page.url and page.input_value("#bp-circle") == "24 - Kukatpally"
        svc.get_by_role("link", name="Home").click()
        page.wait_for_timeout(300)
        home_ok = page.locator("#main-content").is_visible() and not svc.is_visible()
        return f"Back keeps the typed details: {back_ok}; Home shows the home page: {home_ok}", back_ok and home_ok
    record("TC41", "Birth services", "Browser Back and the Home link",
           "Back returns to the filled search; Home returns to the home page", back_and_home)
    ctx.close()

    deep = browser.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    dpage = deep.new_page()
    dpage.on("pageerror", lambda e: js_errors.append(str(e)))

    def deep_link():
        dpage.goto(APP_URL + "#/services/A/find-record/details")
        dpage.wait_for_timeout(600)
        asked = dpage.locator("#login.open").count() == 1
        sign_in(dpage)
        landed = dpage.inner_text("#bp-title").strip()
        return f'Login asked: {asked}; then "{landed}"', asked and landed == "Search by Details"
    record("TC42", "Birth services", "A service page link opened while signed out",
           "Login first, then the requested page", deep_link)
    deep.close()

    mob = browser.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce",
                              device_scale_factor=2, is_mobile=True, has_touch=True)
    mpage = mob.new_page()
    mpage.on("pageerror", lambda e: js_errors.append(str(e)))

    def mobile_results():
        mpage.goto(APP_URL)
        mpage.wait_for_timeout(1000)
        mpage.locator('[data-open-stage="A"]').first.click()
        mpage.wait_for_timeout(300)
        sign_in(mpage)
        mpage.goto(APP_URL + "#/services/A/find-record/details?district=HYDERABAD")
        mpage.wait_for_timeout(400)
        mpage.locator("#service-page").get_by_role("button", name="Fill sample data").click()
        mpage.click('form[data-form="details"] button[type="submit"]')
        mpage.wait_for_timeout(600)
        width = mpage.evaluate("document.documentElement.scrollWidth")
        cards = mpage.evaluate("getComputedStyle(document.querySelector('#service-page tbody tr')).display")
        mpage.screenshot(path=str(SHOTS / "14-birth-mobile-results.png"))
        return f"page width {width}px; each record shown as a {cards} card", width <= 390 and cards == "block"
    record("TC43", "Responsive", "Birth search results on a 390px phone",
           "Records shown as cards; no horizontal scroll", mobile_results)
    mob.close()

    record("TC44", "Stability", "No JavaScript errors on the service pages", "Zero console errors",
           lambda: (f"{len(js_errors)} errors", len(js_errors) == 0))


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
            # Birth & early childhood (stage A) continues to its own service pages
            ok = page.locator("#service-page").is_visible() and page.locator("#login.open").count() == 0
            return f'Logged in, "{page.inner_text("#bp-title")}" page opened, header shows "{label}"', ok
        record("TC10", "Auth", "Verify with valid 6 digit OTP",
               "Login successful, user continues to chosen stage", valid_otp)
        page.wait_for_timeout(500)
        page.screenshot(path=str(SHOTS / "06-birth-step1.png"))

        # ---------------------------------------------------------- services
        # every other stage opens its service list in the side drawer; Education & learning is checked here
        def stage_services():
            page.click('.svc-crumbs a[href="#life-stages"]')
            page.wait_for_timeout(400)
            page.locator('[data-open-stage="B"]').first.click()
            page.wait_for_timeout(600)
            title = page.inner_text("#drawer-title")
            n = page.locator("#drawer-content .svc").count()
            return f'"{title}" lists {n} services', drawer_open(page) and n == 20
        record("TC11", "Services", "Stage drawer lists all services in the stage",
               "Education & learning shows 20 services", stage_services)
        page.screenshot(path=str(SHOTS / "06-service-list.png"))

        def availability_chips():
            live = page.locator("#drawer-content .chip--live").count()
            soon = page.locator("#drawer-content .chip--soon").count()
            return f"{live} Available, {soon} Coming soon", live == 2 and soon == 18
        record("TC12", "Services", "Services tagged by availability",
               "2 Available, 18 Coming soon", availability_chips)

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
        mob.close()

        birth_service_cases(browser)
        browser.close()

    (OUT / "results.json").write_text(json.dumps(results, indent=2))
    passed = sum(r["status"] == "Pass" for r in results)
    print(f"\n{passed}/{len(results)} passed")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.stdout.reconfigure(errors="replace")  # e.g. the rupee sign on a Windows console
    sys.exit(run())
