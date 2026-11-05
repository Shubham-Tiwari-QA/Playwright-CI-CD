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

test.describe('Create Meeting', () => {
  test('MEET-01 Create meeting or verify existing meeting for env session', async ({ page }, testInfo) => {
    test.setTimeout(300000);

    const { batchId, sessionId } = skipWithoutBatchAndSession(test);
    const batchesLink = await loginAsAuthorizedTeacher(page);
    await openBatches(page, batchesLink);
    await openBatchById(page, batchId);

    const card = await verifySessionOnBatch(page, sessionId);
    const createMeeting = card.locator(
      'a[href*="create-meeting"], a[title="Create Google Meet Classroom"]'
    ).filter({
      hasText: 'Create Meeting',
    }).first();
    const joinClass = card.getByText('Join Class', { exact: true });

    if (await createMeeting.isVisible().catch(() => false)) {
      const className = (await createMeeting.getAttribute('class')) || '';

      if (className.includes('disabled')) {
        const note = (await card.locator('small').innerText().catch(() => ''))
          .replace(/\s+/g, ' ')
          .trim();

        throw new Error(
          `Session ${sessionId}: Create Meeting is disabled by the application. ${note}`
        );
      }

      console.log(`Session ${sessionId}: Create Meeting is available. Creating once.`);
      await createMeeting.click();
      await page.waitForTimeout(5000);
      await dismissNonPendingOk(page);

      if (!page.url().includes(`/teacher/batch/${batchId}`)) {
        await page.goto(
          `https://stagelearn.classmonitor.com/teacher/batch/${batchId}`,
          { waitUntil: 'domcontentloaded' }
        );
        await page.waitForTimeout(5000);
      }
    } else if (await joinClass.isVisible().catch(() => false)) {
      console.log(
        `Session ${sessionId}: meeting already exists. Skipping Create Meeting to avoid duplicates.`
      );
    } else {
      throw new Error(`Session ${sessionId}: neither Create Meeting nor Join Class was found.`);
    }

    await expect(sessionCard(page, sessionId).getByText('Join Class', {
      exact: true,
    })).toBeVisible({
      timeout: 15000,
    });

    await captureStep(page, testInfo, `meet-01-session-${sessionId}`);
  });

  test('MEET-02 Duplicate Create Meeting is not attempted when Join Class exists', async ({ page }, testInfo) => {
    test.setTimeout(240000);

    const { batchId, sessionId } = skipWithoutBatchAndSession(test);
    const batchesLink = await loginAsAuthorizedTeacher(page);
    await openBatches(page, batchesLink);
    await openBatchById(page, batchId);
    const card = await verifySessionOnBatch(page, sessionId);

    const joinVisible = await card.getByText('Join Class', {
      exact: true,
    }).isVisible().catch(() => false);
    const createMeetingVisible = await card.getByText('Create Meeting', {
      exact: true,
    }).isVisible().catch(() => false);

    if (!joinVisible) {
      testInfo.annotations.push({
        type: 'note',
        description: `Session ${sessionId}: Join Class not present yet. Duplicate-guard assertion skipped.`,
      });
      console.log(
        `Session ${sessionId}: Join Class not present. Run MEET-01 first or use a session with an existing meeting.`
      );
      await captureStep(page, testInfo, `meet-02-pending-meeting-${sessionId}`);
      return;
    }

    expect(createMeetingVisible).toBeFalsy();
    console.log(
      `Session ${sessionId}: Join Class present and Create Meeting not offered. Duplicate creation blocked by UI.`
    );
    await captureStep(page, testInfo, `meet-02-no-duplicate-${sessionId}`);
  });

  test('MEET-03 Meeting link is visible on session details after creation', async ({ page }, testInfo) => {
    test.setTimeout(240000);

    const { batchId, sessionId } = skipWithoutBatchAndSession(test);
    const batchesLink = await loginAsAuthorizedTeacher(page);
    await openBatches(page, batchesLink);
    await openBatchById(page, batchId);
    await verifySessionOnBatch(page, sessionId);

    await expect(sessionCard(page, sessionId).getByText('Join Class', {
      exact: true,
    })).toBeVisible({
      timeout: 15000,
    });

    await page.goto(
      `https://stagelearn.classmonitor.com/teacher/session/${sessionId}`,
      { waitUntil: 'domcontentloaded' }
    );
    await page.waitForTimeout(5000);

    const meetLink = page.locator(
      'a[data-href*="meet.google.com"], a[href*="meet.google.com"]'
    ).first();

    await expect(meetLink).toBeVisible({
      timeout: 15000,
    });

    const meetUrl = (
      await meetLink.getAttribute('data-href')
    ) || (
      await meetLink.getAttribute('href')
    );

    expect(meetUrl).toMatch(/meet\.google\.com/i);
    console.log(`Session ${sessionId}: meeting URL confirmed: ${meetUrl}`);
    await captureStep(page, testInfo, `meet-03-meeting-url-${sessionId}`);
  });

  test('MEET-04 Meeting remains after batch page refresh', async ({ page }, testInfo) => {
    test.setTimeout(240000);

    const { batchId, sessionId } = skipWithoutBatchAndSession(test);
    const batchesLink = await loginAsAuthorizedTeacher(page);
    await openBatches(page, batchesLink);
    await openBatchById(page, batchId);
    await verifySessionOnBatch(page, sessionId);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    await expect(sessionCard(page, sessionId).getByText('Join Class', {
      exact: true,
    })).toBeVisible({
      timeout: 15000,
    });

    await captureStep(page, testInfo, `meet-04-refresh-${sessionId}`);
  });
});
