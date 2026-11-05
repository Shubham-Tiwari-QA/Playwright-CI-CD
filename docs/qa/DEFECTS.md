# Defect / Observation Log – Teacher Portal Deep Testing

Environment: staging `stagelearn.classmonitor.com`  
Teacher: CM LIve 33 / `8319779122`  
Date context: Nov 2026

## BUG-001

1. **Bug ID:** BUG-001  
2. **Module:** Student Attendance  
3. **Test Scenario:** SATT-01 End Class attendance path for ongoing session  
4. **Bug Title:** Students Attendance modal opened via End Class has no Save control  
5. **Preconditions:** Teacher logged in; batch/session where End Class is shown and batch-card Student Attendance button is absent (observed on batch `BATCH_ID` session `SESSION_ID` = 10822).  
6. **Test Data:** Env `BATCH_ID`, `SESSION_ID`  
7. **Steps to Reproduce:**  
   1. Login as authorized teacher.  
   2. Open batch from `BATCH_ID`.  
   3. Confirm session card shows End Class and no Student Attendance button.  
   4. Open session details and click End Class.  
   5. Observe Students Attendance modal.  
8. **Expected Result:** Modal allows selecting Present/Absent and saving attendance through an authorized Save action.  
9. **Actual Result:** Modal lists students and radios, but `.modal-footer` is empty; no `submitAtt` / Save button. `studentAttCount` remains `0`.  
10. **Severity:** Critical  
11. **Priority:** P1  
12. **Environment:** Staging Teacher Portal, Chromium headed Playwright  
13. **Screenshot Evidence:** Captured by SATT-01 as `satt-01-missing-save-*` when Save is absent  
14. **Console Error:** None required  
15. **API Response:** N/A (save not reachable)  
16. **Reproducibility:** Consistent on inspected session 10822 state  

## OBS-001

- **Module:** Auth / Unauthorized access  
- **Observation:** Direct navigation to `/teacher` without session redirects to parent `/login`, not `/teacher/login`.  
- **Impact:** Minor UX inconsistency for teacher deep links.  
- **Severity:** Minor  

## Blocked Coverage

| Area | Reason |
|---|---|
| Admin portal attendance sync | No admin credentials/automation access in this project |
| Production data / deleted sessions | Unsafe / unavailable on staging safely |
| Forced network/API failure injection | Deferred to next module; needs route stubs without corrupting live attendance |
| Session completion Save | Blocked until student attendance Save path is clarified (BUG-001) |
