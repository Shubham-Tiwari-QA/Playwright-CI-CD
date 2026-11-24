const { expect } = require('@playwright/test');
const { copy } = require('../test-data/demoData');

class EnrollmentPage {
  /**
   * The demo form posts to /demo/store and returns to /demo.
   * Confirmation is the flash alert on that page. There is no separate
   * checkout, payment, or shipping step on this staging flow.
   */
  constructor(page) {
    this.page = page;
    this.successAlert = page.locator('p.alert', { hasText: copy.success });
  }

  async expectRegistered() {
    await expect(this.successAlert).toBeVisible();
    await expect(this.successAlert).toHaveText(copy.success);
    await expect(this.page).toHaveURL(/\/demo\/?$/);
    await expect(this.page).toHaveTitle('Demo Form - ClassMonitor');
  }
}

module.exports = { EnrollmentPage };
