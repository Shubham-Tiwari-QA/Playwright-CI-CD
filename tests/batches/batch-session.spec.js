const { test, expect } = require('../fixtures');
const {
  readNumericId,
  skipWithoutBatchAndSession,
} = require('../helpers/env');
const { loginAsAuthorizedTeacher } = require('../helpers/auth');
const {
  openBatches,
  openBatchById,
  verifySessionOnBatch,
  sessionCard,
} = require('../helpers/portal');
const { captureStep } = require('../helpers/evidence');

test.describe('Batch and Session selection', () => {
  test('BATCH-01 Open env batch and verify selected session', async ({ page }, testInfo) => {
    test.setTimeout(240000);

    const { batchId, sessionId } = skipWithoutBatchAndSession(test);
    const batchesLink = await loginAsAuthorizedTeacher(page);
    await openBatches(page, batchesLink);
    await openBatchById(page, batchId);

    const card = await verifySessionOnBatch(page, sessionId);
    const cardText = (await card.innerText()).replace(/\s+/g, ' ').trim();

    console.log(`Batch ${batchId} session card: ${cardText.slice(0, 300)}`);
    expect(cardText).toMatch(new RegExp(`Session Id:\\s*${sessionId}`));

    // Status ribbon / labels when present.
    const statusMatch = cardText.match(/\b(Upcoming|Ongoing|Pending|Next Session|Completed)\b/i);
    if (statusMatch) {
      console.log(`Session ${sessionId} status label: ${statusMatch[0]}`);
    } else {
      console.log(`Session ${sessionId}: no explicit status ribbon text found.`);
    }

    await captureStep(page, testInfo, `batch-01-batch-${batchId}-session-${sessionId}`);
  });

  test('BATCH-02 Open selected session details and verify IDs', async ({ page }, testInfo) => {
    test.setTimeout(240000);

    const { batchId, sessionId } = skipWithoutBatchAndSession(test);
    const batchesLink = await loginAsAuthorizedTeacher(page);
    await openBatches(page, batchesLink);
    await openBatchById(page, batchId);
    await verifySessionOnBatch(page, sessionId);

    await sessionCard(page, sessionId).locator(
      `a[href$="/teacher/session/${sessionId}"]`
    ).first().click();
    await page.waitForTimeout(5000);

    await expect(page).toHaveURL(new RegExp(`/teacher/session/${sessionId}`));
    await expect(page.locator('#mainPageContainer')).toContainText(sessionId);
    await expect(page.locator(`a[href$="/teacher/batch/${batchId}"]`).first()).toBeVisible();

    console.log(`Verified session page for batch ${batchId} / session ${sessionId}.`);
    await captureStep(page, testInfo, `batch-02-session-details-${sessionId}`);
  });

  test('BATCH-03 Invalid batch ID does not show the expected session', async ({ page }, testInfo) => {
    test.setTimeout(180000);

    skipWithoutBatchAndSession(test);
    const sessionId = readNumericId('SESSION_ID', { required: true });
    const batchesLink = await loginAsAuthorizedTeacher(page);
    await openBatches(page, batchesLink);

    await page.goto('https://stagelearn.classmonitor.com/teacher/batch/999999999', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(5000);

    const sessionLinkCount = await page.locator(
      `a[href$="/teacher/session/${sessionId}"]`
    ).count();

    console.log(
      `Invalid batch page URL: ${page.url()}. Matching session ${sessionId} links: ${sessionLinkCount}`
    );
    expect(sessionLinkCount).toBe(0);
    await captureStep(page, testInfo, 'batch-03-invalid-batch');
  });

  test('BATCH-04 Invalid session ID is not visible on valid batch', async ({ page }, testInfo) => {
    test.setTimeout(180000);

    skipWithoutBatchAndSession(test);
    const batchId = readNumericId('BATCH_ID', { required: true });
    const batchesLink = await loginAsAuthorizedTeacher(page);
    await openBatches(page, batchesLink);
    await openBatchById(page, batchId);

    const invalidSessionId = '999999999';
    const count = await page.locator(
      `a[href$="/teacher/session/${invalidSessionId}"]`
    ).count();

    expect(count).toBe(0);
    console.log(`Invalid session ${invalidSessionId} is not listed on batch ${batchId}.`);
    await captureStep(page, testInfo, 'batch-04-invalid-session');
  });

  test('BATCH-05 Direct session URL requires auth context and keeps session id', async ({ page }, testInfo) => {
    test.setTimeout(180000);

    const { sessionId } = skipWithoutBatchAndSession(test);
    await loginAsAuthorizedTeacher(page);

    await page.goto(
      `https://stagelearn.classmonitor.com/teacher/session/${sessionId}`,
      { waitUntil: 'domcontentloaded' }
    );
    await page.waitForTimeout(5000);

    await expect(page).toHaveURL(new RegExp(`/teacher/session/${sessionId}`));
    await expect(page.locator('#mainPageContainer')).toContainText(sessionId);
    await captureStep(page, testInfo, `batch-05-direct-session-${sessionId}`);
  });

  test('BATCH-06 Refresh on batch page keeps selected batch', async ({ page }, testInfo) => {
    test.setTimeout(180000);

    const { batchId } = skipWithoutBatchAndSession(test);
    const batchesLink = await loginAsAuthorizedTeacher(page);
    await openBatches(page, batchesLink);
    await openBatchById(page, batchId);

    await page.reload({
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(5000);

    await expect(page).toHaveURL(new RegExp(`/teacher/batch/${batchId}`));
    await captureStep(page, testInfo, `batch-06-refresh-batch-${batchId}`);
  });
});
