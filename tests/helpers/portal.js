const { expect } = require('../fixtures');

async function dismissNonPendingOk(page) {
  const pendingSessionsMessage = page.getByText(
    /You have pending sessions remaining/i
  ).first();

  const confirmButton = page.getByRole('button', {
    name: /^(OK|Okay !)$/,
  });

  if (
    await confirmButton.isVisible().catch(() => false) &&
    !(await pendingSessionsMessage.isVisible().catch(() => false))
  ) {
    const message = (await page.locator('.sweet-alert').innerText().catch(() => ''))
      .replace(/\s+/g, ' ')
      .trim();

    console.log(`Confirmation popup: ${message}`);
    await confirmButton.click();
    await page.waitForTimeout(5000);

    return message;
  }

  return '';
}

function sessionCard(page, sessionId) {
  return page.locator('.card-box').filter({
    has: page.locator(`a[href$="/teacher/session/${sessionId}"]`),
  }).first();
}

async function openBatches(page, batchesLink) {
  await batchesLink.click();
  console.log('Batches opened.');
  await page.waitForTimeout(5000);
}

async function openBatchById(page, batchId) {
  const courseLink = page.locator(
    `a[href$="/teacher/batch/${batchId}"]`
  ).first();

  await expect(courseLink).toBeVisible({
    timeout: 15000,
  });

  await courseLink.click();
  await page.waitForTimeout(5000);

  await expect(page).toHaveURL(new RegExp(`/teacher/batch/${batchId}`), {
    timeout: 15000,
  });

  console.log(`Batch ${batchId} is open.`);
}

async function verifySessionOnBatch(page, sessionId) {
  const link = page.locator(
    `a[href$="/teacher/session/${sessionId}"]`
  ).first();

  await link.scrollIntoViewIfNeeded();
  await expect(link).toBeVisible({
    timeout: 15000,
  });

  const card = sessionCard(page, sessionId);
  await expect(card).toContainText(new RegExp(`Session Id:\\s*${sessionId}`));

  console.log(`Session ${sessionId} is visible on the batch page.`);

  return card;
}

module.exports = {
  dismissNonPendingOk,
  sessionCard,
  openBatches,
  openBatchById,
  verifySessionOnBatch,
};
