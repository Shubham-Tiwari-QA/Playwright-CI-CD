const { test, expect } = require('../fixtures');
const { skipWithoutBatchAndSession } = require('../helpers/env');
const { loginAsAuthorizedTeacher } = require('../helpers/auth');
const {
  openBatches,
  openBatchById,
  verifySessionOnBatch,
  sessionCard,
  dismissNonPendingOk,
} = require('../helpers/portal');
const { captureStep } = require('../helpers/evidence');

async function waitForPendingOverlayGone(page) {
  // fixtures.js already dismisses the pending-sessions popup.
  // Only wait here — do not click OK again (that deadlocks with the handler).
  const pending = page.getByText(/You have pending sessions remaining/i).first();
  const overlay = page.locator('.sweet-overlay');

  await pending.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await overlay.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function selectPresentRadio(row) {
  const present = row.locator('input[value="present"]');

  // App radios are often custom-styled; prefer the table cell click, then native click.
  const presentCell = row.locator('td').nth(2);
  await presentCell.click({ timeout: 5000 }).catch(() => {});

  if (!(await present.isChecked())) {
    await present.evaluate((input) => {
      input.checked = true;
      input.dispatchEvent(new Event('click', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      if (typeof input.onclick === 'function') {
        input.onclick();
      }
    });
  }

  await expect(present).toBeChecked({ timeout: 5000 });
}

test.describe('Student Attendance', () => {
  test('SATT-01 Open student attendance and respect already-saved marks', async ({ page }, testInfo) => {
    test.setTimeout(300000);

    const { batchId, sessionId } = skipWithoutBatchAndSession(test);
    const batchesLink = await loginAsAuthorizedTeacher(page);
    await openBatches(page, batchesLink);
    await openBatchById(page, batchId);
    await verifySessionOnBatch(page, sessionId);

    const card = sessionCard(page, sessionId);
    const studentButton = card.locator('button.btnStudentAttendance').or(
      card.getByRole('button', { name: /Student Attendance/ })
    );

    let blockedMessage = '';
    let usedEndClassPath = false;
    const onDialog = async (dialog) => {
      blockedMessage = dialog.message();
      await dialog.accept();
    };

    if (await studentButton.first().isVisible().catch(() => false)) {
      const label = (await studentButton.first().innerText()).replace(/\s+/g, ' ').trim();
      console.log(`Session ${sessionId}: batch Student Attendance button: ${label}`);

      page.on('dialog', onDialog);
      await studentButton.first().click();
      await page.waitForTimeout(5000);
      page.off('dialog', onDialog);
    } else {
      usedEndClassPath = true;
      console.log(
        `Session ${sessionId}: no batch Student Attendance button. Trying End Class attendance modal.`
      );

      await page.goto(
        `https://stagelearn.classmonitor.com/teacher/session/${sessionId}`,
        { waitUntil: 'domcontentloaded' }
      );
      await page.waitForTimeout(5000);
      await waitForPendingOverlayGone(page);

      const endClassButton = page.locator(
        '#btnEndClasswithAttendance, button.endClass, a.endClass'
      ).first();

      if (!(await endClassButton.isVisible().catch(() => false))) {
        throw new Error(
          `Session ${sessionId}: neither Student Attendance nor End Class attendance entry point was available.`
        );
      }

      page.on('dialog', onDialog);
      await endClassButton.click();
      await page.waitForTimeout(5000);
      page.off('dialog', onDialog);
    }

    if (blockedMessage) {
      throw new Error(
        `Session ${sessionId}: student attendance blocked by application. ${blockedMessage}`
      );
    }

    await waitForPendingOverlayGone(page);

    const modal = page.locator('#modalAddStudentAttendance');
    await expect(modal).toBeVisible({ timeout: 15000 });
    await expect(modal.locator('input[name="sessionId"]')).toHaveValue(sessionId);
    await waitForPendingOverlayGone(page);

    const saveButton = modal.locator('button.submitAtt').or(
      modal.getByRole('button', { name: /Save Attendance|Save/i })
    );
    const saveVisible = await saveButton.first().isVisible().catch(() => false);

    if (usedEndClassPath && !saveVisible) {
      await captureStep(page, testInfo, `satt-01-missing-save-${sessionId}`);
      throw new Error(
        `BUG-001 Session ${sessionId}: End Class opened Students Attendance, but the modal has no Save button. Student attendance cannot be completed through the authorized UI in this session state.`
      );
    }

    const rows = modal.locator('tbody tr').filter({
      has: page.locator('input[type="radio"]'),
    });
    const count = await rows.count();

    if (count === 0) {
      throw new Error(`Session ${sessionId}: student list was empty.`);
    }

    console.log(`Session ${sessionId}: ${count} student row(s) listed.`);

    const batchLabel = await studentButton.first().innerText().catch(() => '');
    const alreadySaved = /\(\d+\s*\/\s*\d+\)/.test(batchLabel);

    let changed = false;

    for (let i = 0; i < count; i += 1) {
      const row = rows.nth(i);
      const name = (await row.locator('td').nth(1).innerText()).replace(/\s+/g, ' ').trim();
      const present = row.locator('input[value="present"]');
      const absent = row.locator('input[value="absent"]');
      const presentChecked = await present.isChecked();
      const absentChecked = await absent.isChecked();

      if (alreadySaved && (presentChecked || absentChecked)) {
        console.log(
          `Session ${sessionId}: student ${name} already ${presentChecked ? 'present' : 'absent'}. Not changed.`
        );
        continue;
      }

      if (!presentChecked) {
        console.log(`Session ${sessionId}: selecting Present for ${name}.`);
        await waitForPendingOverlayGone(page);

        try {
          await selectPresentRadio(row);
        } catch (error) {
          await captureStep(page, testInfo, `satt-01-radio-failed-${sessionId}`);
          throw new Error(
            `Session ${sessionId}: student ${name} Present selection failed. ${error.message}`
          );
        }

        await page.waitForTimeout(5000);
        changed = true;
        console.log(
          `Session ${sessionId}: student ${name} attendance status is present.`
        );
      } else {
        console.log(`Session ${sessionId}: student ${name} already present. Not changed.`);
      }
    }

    await captureStep(page, testInfo, `satt-01-status-${sessionId}`);

    if (!changed) {
      console.log(`Session ${sessionId}: no student attendance mutations required.`);
      return;
    }

    if (!(await saveButton.first().isVisible().catch(() => false))) {
      await captureStep(page, testInfo, `satt-01-missing-save-after-select-${sessionId}`);
      throw new Error(
        `Session ${sessionId}: attendance was selected, but the application did not show a Save button.`
      );
    }

    console.log(`Session ${sessionId}: saving student attendance.`);
    await saveButton.first().click();
    await page.waitForTimeout(5000);
    await dismissNonPendingOk(page);

    await expect(page.locator(
      '#attendanceResultBody, #attendanceStdResult, .sweet-alert'
    )).toContainText(/successfully saved|success/i, {
      timeout: 15000,
    });

    console.log(`Session ${sessionId}: student attendance saved.`);
    await captureStep(page, testInfo, `satt-01-saved-${sessionId}`);
  });
});
