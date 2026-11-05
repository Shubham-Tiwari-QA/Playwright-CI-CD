# ClassMonitor Teacher Portal – Deep Test Plan

Branch baseline: `cursor/teacher-portal-dynamic-ids`  
Environment: `https://stagelearn.classmonitor.com`  
Authorized teacher: phone `8319779122` / OTP `1111`  
Dynamic data: `BATCH_ID`, `SESSION_ID` (never hardcoded)

## Principles

1. Prefer finding real defects over forcing green tests.
2. Never invent success when the UI/API does not confirm it.
3. Never overwrite already-saved attendance unless a test explicitly authorizes correction.
4. Never create a duplicate meeting when Join Class already exists.
5. Do not complete/end a session unless mandatory business conditions are met.
6. Mark coverage as **Blocked** when admin portal, production data, or unsafe destructive actions are inaccessible.
7. Keep the existing `teacher-login.spec.js` end-to-end flow intact; add isolated module specs around it.

## Module Map

| Module | Spec file | Priority | Notes |
|---|---|---|---|
| Auth | `tests/auth/teacher-auth.spec.js` | P0 | Positive + negative login |
| Batch/Session | `tests/batches/batch-session.spec.js` | P0 | Env IDs + invalid IDs |
| Meeting | `tests/meetings/create-meeting.spec.js` | P0 | Create once / already-exists path |
| Teacher Attendance | `tests/attendance/teacher-attendance.spec.js` | P0 | Mark only if pending |
| Student Attendance | `tests/attendance/student-attendance.spec.js` | P0 | No overwrite; Save required |
| Session completion | deferred | P1 | Only after attendance/meeting rules clear |
| UI/UX sweep | deferred | P1 | Console errors, modals, empty states |
| API/network | deferred | P1 | Route interception + offline |
| Admin sync | Blocked | P2 | No admin credentials in this project |

## Safe Data Rules

- Use only the authorized staging teacher.
- Destructive negatives (invalid batch/session URLs) must not mutate unrelated sessions.
- Meeting: if Join Class is visible, assert already-created and skip Create Meeting click.
- Attendance: if UI shows marked/saved state, assert and skip mutation.
- Session End Class: do not click Save/Complete unless the test is explicitly for authorized completion and prerequisites are verified.

## Known Application Constraints (from inspection)

- Pending-sessions SweetAlert can block UI; fixture dismisses up to 15 times.
- Student Attendance button may disappear once End Class appears; End Class modal may open Students Attendance without a Save button (defect candidate).
- Unauthorized `/teacher` redirects to parent `/login`, not `/teacher/login`.
- Teacher attendance is required before student attendance on the batch workflow.

## Execution

```powershell
cd E:\ClassMonitor-Automation
$env:PLAYWRIGHT_BROWSERS_PATH = "$env:LOCALAPPDATA\ms-playwright"
$env:BATCH_ID = "740"
$env:SESSION_ID = "10822"
npx playwright test --project=chromium --headed
```

HTML report: `playwright-report/` (screenshots, videos, traces enabled in config).
