# Testing Evidence

End to end tests run in a real browser against the portal. Each case drives the interface the way a citizen would and checks the result on screen.

## Summary

| Test cases | Passed | Failed | Viewports |
| --- | --- | --- | --- |
| 23 | 23 | 0 | Desktop 1440 × 900, Mobile 390 × 844 |

| | |
| --- | --- |
| **Tool** | Playwright (Python), Chromium headless |
| **Build under test** | v7, as deployed at https://meeseva-v7-happening.vercel.app |
| **Run date** | 15 Oct 2026 |
| **Script** | [`tests/e2e/test_portal.py`](../tests/e2e/test_portal.py) |
| **Raw results** | [`tests/results/results.json`](../tests/results/results.json) |

## Test cases and results

| ID | Module | Test case | Expected result | Actual result | Status |
| --- | --- | --- | --- | --- | --- |
| TC01 | Home | Portal loads with correct title | Page title shows MeeSeva Life Services Portal | MeeSeva: Life Services Portal / Government of Telangana | ✅ Pass |
| TC02 | Home | Life stage grid renders | 15 life stage tiles shown | 15 tiles rendered in grid | ✅ Pass |
| TC03 | Home | Hero KPIs show catalogue counts | 396 services, 15 stages, 21 online | 396 / 15 / 21 / 24×7 | ✅ Pass |
| TC04 | Auth | Opening a life stage when logged out asks for login | Login dialog opens | Login dialog opened | ✅ Pass |
| TC05 | Auth | Submit with invalid Aadhaar (5 digits) | Validation error, OTP not sent | Error shown: "Enter your 12-digit Aadhaar number." | ✅ Pass |
| TC06 | Auth | Aadhaar input auto formats | Number grouped as 1234 5678 9012 | Field shows "1234 5678 9012" | ✅ Pass |
| TC07 | Auth | Letters typed in Aadhaar field | Non digits stripped | Field shows "1234" | ✅ Pass |
| TC08 | Auth | Send OTP with valid 12 digit Aadhaar | OTP step shown, Aadhaar field locked | OTP step visible, Aadhaar locked | ✅ Pass |
| TC09 | Auth | Verify with short OTP (3 digits) | Validation error, not logged in | Error shown: "Enter the 6-digit OTP." | ✅ Pass |
| TC10 | Auth | Verify with valid 6 digit OTP | Login successful, user continues to chosen stage | Logged in, drawer opened, header shows "Log out" | ✅ Pass |
| TC11 | Services | Stage drawer lists all services in the stage | Birth & early childhood shows 13 services | "Birth & early childhood" lists 13 services | ✅ Pass |
| TC12 | Services | Services tagged by availability | 3 Available, 10 Coming soon | 3 Available, 10 Coming soon | ✅ Pass |
| TC13 | Accessibility | Escape key closes drawer | Drawer closes, focus returns | Drawer closed | ✅ Pass |
| TC14 | Search | Search a valid keyword | Matching services listed | 9 results for "pension" | ✅ Pass |
| TC15 | Search | Search a keyword with no match | Friendly empty state, no crash | Empty state shown | ✅ Pass |
| TC16 | Language | Switch language to Telugu | Interface switches to Telugu | html lang="te", labels in Telugu | ✅ Pass |
| TC17 | Language | Language choice persists after reload | Telugu still selected | After reload: lang "te", session kept | ✅ Pass |
| TC18 | Accessibility | A+ increases text size | Large text mode applied | text size = large | ✅ Pass |
| TC19 | Auth | Session survives page reload | Logged in user goes straight to stage | Stage opened without new login | ✅ Pass |
| TC20 | Auth | Logout | Session cleared, stages require login | Header shows "Login", stages locked again | ✅ Pass |
| TC21 | Accessibility | Escape key closes login dialog | Dialog closes | Login dialog closed by Escape | ✅ Pass |
| TC22 | Stability | No JavaScript errors during session | Zero console errors | 0 errors | ✅ Pass |
| TC23 | Responsive | Mobile layout at 390px | No horizontal scroll | page width 390px at 390px viewport | ✅ Pass |

## Bugs identified and fixed

| Bug | Description | Severity | Fix | Status |
| --- | --- | --- | --- | --- |
| BUG-01 | Hero headline reflowed during its reveal animation when fonts loaded late. | Low | The reveal now waits for fonts to load, with a 1.5s fallback. | Fixed |
| BUG-02 | The Tab key could move focus behind the open login dialog. | High | Focus is trapped inside the dialog. Escape closes it and returns focus. | Fixed |
| BUG-03 | Saving language or text size crashed in private browsing on some browsers. | High | Storage reads and writes are wrapped safely, with defaults. | Fixed |
| BUG-04 | Searching in Telugu returned no results. | Medium | Search now matches English and Telugu text together. | Fixed |
| BUG-05 | Submitting an empty search box did nothing. | Low | An empty submit now searches the suggestion shown in the box. | Fixed |
| BUG-06 | After login the user went back to the home page instead of the stage they clicked. | Medium | The chosen stage is remembered and opens after login. | Fixed |
| BUG-07 | An open drawer kept English text after switching to Telugu. | Medium | The drawer re-renders whenever the language changes. | Fixed |

## Remaining issues

| Item | Description | Plan | Status |
| --- | --- | --- | --- |
| OPEN-01 | Urdu is listed in the language menu but not yet translated. | Translation in the next sprint. | Planned |
| OPEN-02 | 306 of 327 mapped services are marked Coming soon. | Rolled out as departments go live. | Planned |
| OPEN-03 | Prototype login accepts any correctly formatted Aadhaar and OTP. | Replaced by live verification in production. | Known |

## Retesting performed

Each fix was first retested on its own. Then the full suite of 23 cases ran again on desktop and mobile. All 23 passed with zero JavaScript errors.

Keyboard only navigation was also checked by hand across the login dialog, the service drawer and the language menu.

## Screenshots

| Home | Life stages |
| --- | --- |
| ![Home](screenshots/01-home.jpg) | ![Life stages](screenshots/02-life-stages.jpg) |

| Login | Aadhaar validation |
| --- | --- |
| ![Login](screenshots/03-login.jpg) | ![Validation](screenshots/04-login-validation.jpg) |

| OTP step | Service list after login |
| --- | --- |
| ![OTP](screenshots/05-otp.jpg) | ![Service list](screenshots/06-service-list.jpg) |

| Search | Telugu |
| --- | --- |
| ![Search](screenshots/07-search.jpg) | ![Telugu](screenshots/08-telugu.jpg) |

| Mobile (390px) |
| --- |
| <img src="screenshots/09-mobile.jpg" width="320" alt="Mobile" /> |
