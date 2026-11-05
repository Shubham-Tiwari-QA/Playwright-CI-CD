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

test.describe('Teacher Attendance', () => {
  test('TATT-01 Verify or mark teacher attendance without changing an already marked state', async ({ page }, testInfo) => {
    test.setTimeout(300000);

    const { batchId, sessionId } = skipWithoutBatchAndSession(test);
    const batchesLink = await loginAsAuthorizedTeacher(page);
    await openBatches(page, batchesLink);
    await openBatchById(page, batchId);
    await verifySessionOnBatch(page, sessionId);

    const card = sessionCard(page, sessionId);
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(5000);

    const markPending = card.getByText('Mark Attendance', { exact: true });
    const marked = card.locator(
      'button.marked, button[title="Attendance marked"], i[title="Attendance marked"]'
    ).or(
      card.getByRole('button', { name: /^Attendance\b/ })
    );

    await captureStep(page, testInfo, `tatt-01-before-${sessionId}`);

    if (await markPending.isVisible().catch(() => false)) {
      console.log(`Session ${sessionId}: teacher attendance pending. Marking once.`);
      await markPending.click();
      await page.waitForTimeout(5000);

      const popup = await dismissNonPendingOk(page);

      if (/late|fail|error|unable/i.test(popup)) {
        throw new Error(
          `Session ${sessionId}: teacher attendance rejected. ${popup}`
        );
      }

      await expect(sessionCard(page, sessionId).locator(
        'button.marked, button[title="Attendance marked"], i[title="Attendance marked"]'
      ).or(
        sessionCard(page, sessionId).getByRole('button', { name: /^Attendance\b/ })
      )).toBeVisible({
        timeout: 15000,
      });

      console.log(`Session ${sessionId}: teacher attendance marked. ${popup}`.trim());
      await captureStep(page, testInfo, `tatt-01-marked-${sessionId}`);
    } else if (await marked.first().isVisible().catch(() => false)) {
      console.log(
        `Session ${sessionId}: teacher attendance already marked. Not modified.`
      );
      await captureStep(page, testInfo, `tatt-01-already-marked-${sessionId}`);
    } else {
      throw new Error(
        `Session ${sessionId}: teacher attendance control was not found.`
      );
    }
  });

  test('TATT-02 Teacher attendance remains marked after refresh', async ({ page }, testInfo) => {
    test.setTimeout(240000);

    const { batchId, sessionId } = skipWithoutBatchAndSession(test);
    const batchesLink = await loginAsAuthorizedTeacher(page);
    await openBatches(page, batchesLink);
    await openBatchById(page, batchId);
    await verifySessionOnBatch(page, sessionId);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    const card = sessionCard(page, sessionId);
    const stillMarked = card.locator(
      'button.marked, button[title="Attendance marked"], i[title="Attendance marked"]'
    ).or(
      card.getByRole('button', { name: /^Attendance\b/ })
    );
    const pending = card.getByText('Mark Attendance', { exact: true });

    if (await pending.isVisible().catch(() => false)) {
      throw new Error(
        `Session ${sessionId}: teacher attendance became pending after refresh.`
      );
    }

    await expect(stillMarked.first()).toBeVisible({
      timeout: 15000,
    });

    console.log(`Session ${sessionId}: teacher attendance still marked after refresh.`);
    await captureStep(page, testInfo, `tatt-02-refresh-${sessionId}`);
  });
});
