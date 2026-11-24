const { expect } = require('@playwright/test');

class DemoPage {
  /**
   * Live Class demo form at /demo.
   * Locators are scoped to #demo-form-enquiry because the page repeats ids
   * such as phone_number-err in a second form group.
   */
  constructor(page) {
    this.page = page;
    this.form = page.locator('#demo-form-enquiry');
    this.heading = page.getByRole('heading', { name: 'Demo Form - Live Class' });
    this.phone = this.form.locator('#customer_phone');
    this.dialCode = this.form.locator('.selected-dial-code');
    this.name = this.form.locator('#customer_name');
    this.email = this.form.locator('#email');
    this.childAge = this.form.locator('#selChildAge');
    this.painPoints = this.form.locator('#parent_pain_points');
    this.aspirations = this.form.locator('#parent_aspirations');
    this.packageSelect = this.form.locator('#selPackage');
    this.packageChoice = page.locator('#select2-selPackage-container');
    this.executive = this.form.locator('#selExecutive');
    this.executiveChoice = page.locator('#select2-selExecutive-container');
    this.groupDemo = this.form.locator('#slotOption1');
    this.oneToOneDemo = this.form.locator('#slotOption2');
    this.scheduleForm = this.form.locator('#scheduleForm');
    this.preferredDate = this.form.locator('#preferred_date');
    this.preferredTime = this.form.locator('#preferred_time');
    this.slot = this.form.locator('#SelectedSlot');
    this.slotSection = this.form.locator('#noteDiv');
    this.remarks = this.form.locator('#remarks');
    this.submitButton = this.form.locator('#sendNow');
    this.phoneError = this.form.locator('#phone_number-err').first();
    this.phoneInfo = this.form.locator('#phone_info');
    this.duplicateWarning = this.phoneInfo.getByText(
      'User is already registered for demo in the last 10 days'
    );
  }

  async goto(url) {
    const target = url || process.env.DEMO_BASE_URL || 'https://stagelearn.classmonitor.com/demo';
    await this.page.goto(target, { waitUntil: 'domcontentloaded' });
    await expect(this.heading).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async selectPackage(packageValue) {
    const slotsResponse = this.page.waitForResponse(
      (response) => response.url().includes('/demo/availableSlots') && response.ok()
    );

    await this.packageSelect.selectOption(packageValue);

    const response = await slotsResponse;
    return response.json();
  }

  async chooseGroupDemo() {
    await this.groupDemo.check();
    await expect(this.scheduleForm).toBeHidden();
    await expect(this.slot).toBeEnabled();
  }

  async chooseOneToOneDemo() {
    await this.oneToOneDemo.check();
    await expect(this.scheduleForm).toBeVisible();
    await expect(this.preferredDate).toBeEnabled();
    await expect(this.preferredTime).toBeEnabled();
    await expect(this.slot).toBeDisabled();
  }

  async selectCountry(countryCode) {
    await this.form.locator('.selected-flag').click();
    await this.page.locator(`li.country[data-country-code="${countryCode}"]`).first().click();
  }

  /**
   * The duplicate lookup listens to keyup, not the input event fired by fill().
   */
  async enterPhoneForLookup(phone) {
    const detailsResponse = this.page.waitForResponse(
      (response) => response.url().includes('/demo/check_details') && response.ok()
    );

    await this.phone.fill(phone);
    await this.phone.dispatchEvent('keyup');

    await detailsResponse;
  }

  async fillLead(data, { mode = 'one-to-one', slotValue } = {}) {
    await this.phone.fill(data.phone);
    await this.name.fill(data.name);

    if (data.email) {
      await this.email.fill(data.email);
    }

    await this.childAge.selectOption(data.childAge);
    await this.painPoints.fill(data.painPoints);
    await this.aspirations.fill(data.aspirations);
    await this.selectPackage(data.packageValue);
    await this.executive.selectOption(data.executiveValue);
    await this.remarks.fill(data.remarks || '');

    if (mode === 'group') {
      await this.chooseGroupDemo();
      await this.slot.selectOption(slotValue);
      return;
    }

    await this.chooseOneToOneDemo();
    await this.preferredDate.fill(data.preferredDate);
    await this.preferredTime.fill(data.preferredTime);
  }

  async submit() {
    await this.submitButton.click();
  }

  async submitRegistration() {
    const storeResponse = this.page.waitForResponse(
      (response) =>
        response.url().includes('/demo/store') && response.request().method() === 'POST'
    );

    await this.submitButton.click();

    const response = await storeResponse;
    await this.page.waitForLoadState('domcontentloaded');

    return response;
  }
}

module.exports = { DemoPage };
