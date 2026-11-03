const { test: base, expect } = require('@playwright/test');

const pendingSessionsPopupText =
  /You have pending sessions remaining/i;

const test = base.extend({
  page: async ({ page }, use) => {
    let handledCount = 0;
    const maxAttempts = 5;

    // Locate the popup using its actual message.
    const popupMessage = page.getByText(
      pendingSessionsPopupText
    ).first();

    await page.addLocatorHandler(
      popupMessage,
      async () => {
        if (handledCount >= maxAttempts) {
          throw new Error(
            'Pending sessions popup appeared too many times. ' +
            'Please resolve pending sessions through the application.'
          );
        }

        // Find the visible OK button.
        const okButton = page.getByRole('button', {
          name: 'OK',
          exact: true,
        });

        await expect(okButton).toBeVisible({
          timeout: 5000,
        });

        handledCount++;

        console.log(
          `Handling pending sessions popup: ${handledCount}/${maxAttempts}`
        );

        await okButton.click();

        await expect(popupMessage).toBeHidden({
          timeout: 5000,
        });

        console.log('Pending sessions popup dismissed.');
      },
      {
        times: maxAttempts,
      }
    );

    await use(page);
  },
});

async function navigateToPendingSessionsIfAvailable(page) {
  const pendingSessionsLink = page.getByRole('link', {
    name: /pending sessions|realign sessions/i,
  }).first();

  if (await pendingSessionsLink.isVisible().catch(() => false)) {
    await pendingSessionsLink.click();

    console.log('Opened pending sessions section.');

    return true;
  }

  console.log(
    'No visible pending sessions link found.'
  );

  return false;
}

module.exports = {
  test,
  expect,
  navigateToPendingSessionsIfAvailable,
};