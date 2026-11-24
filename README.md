# ClassMonitor Playwright automation

End-to-end coverage for the ClassMonitor staging **Demo Form - Live Class** page, plus the existing portal specs in this repository.

The demo suite was added to this project instead of a second `classmonitor-playwright/` package. The repository already had `playwright.config.js`, `package.json`, and `Jenkinsfile`. A nested copy would have split CI and the browser install.

## What the staging form actually does

Target: `https://stagelearn.classmonitor.com/demo`

The page is one form, `#demo-form-enquiry`, posted to `/demo/store`. A successful post returns **302** to `/demo` and shows:

`You have successfully registered for demo.`

There is no second enrollment page, payment step, shipping step, learning-kit step, or CAPTCHA on this URL. Cancel and reschedule dialogs exist in the page, and both require an agent OTP. No approved staging OTP is configured, so those dialogs are not submitted.

| Field | Element | Required |
| --- | --- | --- |
| Parent's Phone Number | `#customer_phone` | Yes. India: 10 digits starting 6-9. Country code is separate (`+91` by default). |
| Parent's Name | `#customer_name` | Yes. Trailing non-letters are stripped. |
| Parent's Email | `#email` | Optional for `+91`. Required by script for any other country. Invalid text is blocked by the email input. |
| Child Age | `#selChildAge` | Yes. |
| Parent pain points | `#parent_pain_points` | Yes. At least 6 words. |
| Parent aspirations | `#parent_aspirations` | Yes. At least 6 words. |
| Subject / Package | `#selPackage` (Select2) | Yes. Changing it calls `/demo/availableSlots`. |
| Demo Request Type | `slotOption` radios | Group Demo (`auto`) is the default. 1-1 Demo (`manual`) reveals preferred date and time. |
| Select Slot | `#SelectedSlot` | Required for Group Demo. Disabled for 1-1 Demo. |
| Preferred Date / Time | `#preferred_date`, `#preferred_time` | Required for 1-1 Demo. Hidden for Group Demo. |
| Executive | `#selExecutive` (Select2) | Yes. |
| Remarks | `#remarks` | Optional. |

Group slots depend on the package and date. During inspection, every package returned `DemoSlots: []`, including **Demo Checking**. The success path therefore uses **1-1 Demo** with a preferred date and time whenever the slot list is empty. If staging later returns slots, the end-to-end test books the first returned slot instead.

Entering a mobile that already has a demo in the last 10 days calls `/demo/check_details` and shows:

`User is already registered for demo in the last 10 days`

That warning does not block Submit. A second registration with the same mobile is accepted and shows the same success alert.

## Setup

```powershell
npm ci
npx playwright install chromium
copy .env.example .env
```

`.env` is gitignored. Values already exported in the shell win over `.env`.

`DEMO_AGENT_OTP` is intentionally blank. Do not put a guessed OTP there.

## Run

```powershell
npm test                 # demo specs, headed when CI is not set
npm run test:headed      # demo specs, forced headed
npm run test:ci          # demo specs, headless, one retry
npm run report           # open the HTML report
npm run test:portal      # existing portal specs, excluding @demo
npm run test:all         # portal specs and demo specs
```

`npm run test:ci` is headless because the npm script name is `test:ci`. Jenkins also sets `CI=true`.

Reports written for a local demo run:

- `playwright-report/index.html`
- `playwright-report/results.json`
- `playwright-report/junit.xml`

Screenshots and video are kept on failure. A trace is kept on the first retry.

## Layout

```text
pages/DemoPage.js
pages/EnrollmentPage.js
tests/demo.e2e.spec.js
tests/demo.validation.spec.js
test-data/demoData.js
utils/helpers.js
playwright.config.js
package.json
.env.example
Jenkinsfile
```

`EnrollmentPage` is the confirmation state on `/demo` after `/demo/store`. It is not a separate checkout page.

Each run builds a new Indian mobile (`9` plus a time-based suffix) and an `example.com` address. The executive defaults to staging user **Test 1**. The package defaults to **Demo Checking**. Override both in `.env` if those records change.

## Jenkins

The pipeline installs dependencies and Chromium, runs `npm run test:ci` for the demo suite, then runs the existing portal specs. Demo HTML, JSON, JUnit, screenshots, video, and traces are archived separately under `playwright-report-demo/` and `test-results-demo/` so they are not overwritten by the portal run.

The demo stage does not read `DEMO_AGENT_OTP` and does not submit cancel or reschedule.

## Not claimed as passed

- reCAPTCHA is not on the demo form, so there is nothing to bypass.
- Cancel and reschedule stay untested until an approved staging OTP is provided in `DEMO_AGENT_OTP`.
- No payment, address, pincode, or learning-kit step is present on this URL.
- Group Demo cannot be booked while `/demo/availableSlots` returns an empty list. The test records that empty list and completes through 1-1 Demo.
