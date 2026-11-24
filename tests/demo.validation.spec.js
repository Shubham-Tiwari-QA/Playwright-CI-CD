const { test, expect } = require('@playwright/test');
const { DemoPage } = require('../pages/DemoPage');
const { validationMessage } = require('../utils/helpers');
const {
  copy,
  buildDemoLead,
  invalidPhones,
  shortText,
  sixWords,
} = require('../test-data/demoData');

test.describe('Demo form validation @demo', () => {
  let demo;

  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });

  test('shows the live demo fields and no checkout, kit, or captcha controls', async () => {
    await expect(demo.page.getByText(copy.countryNote)).toBeVisible();
    await expect(demo.page.getByText(copy.nonIndianEmailNote)).toBeVisible();
    await expect(demo.page.getByText(copy.minimumWordsNote).first()).toBeVisible();
    await expect(demo.dialCode).toHaveText('+91');
    await expect(demo.groupDemo).toBeChecked();
    await expect(demo.oneToOneDemo).not.toBeChecked();
    await expect(demo.scheduleForm).toBeHidden();
    await expect(demo.slotSection).toBeVisible();
    await expect(demo.form.locator('iframe[src*="recaptcha"], .g-recaptcha')).toHaveCount(0);
    await expect(demo.form.locator('[name*="pincode" i], [name*="pin_code" i], [name*="address" i]')).toHaveCount(0);
    await expect(demo.submitButton).toHaveValue('Submit');
  });

  test('blocks submission when mandatory fields are empty', async () => {
    await demo.submit();

    await expect(demo.page).toHaveURL(/\/demo\/?$/);
    await expect(demo.phone).toBeFocused();
    expect(await validationMessage(demo.phone)).toBe(copy.requiredText);
    expect(await validationMessage(demo.name)).toBe(copy.requiredText);
    expect(await validationMessage(demo.childAge)).toBe(copy.requiredSelect);
    expect(await validationMessage(demo.painPoints)).toBe(copy.requiredText);
    expect(await validationMessage(demo.aspirations)).toBe(copy.requiredText);
    expect(await validationMessage(demo.packageSelect)).toBe(copy.requiredSelect);
    expect(await validationMessage(demo.slot)).toBe(copy.requiredSelect);
    expect(await validationMessage(demo.executive)).toBe(copy.requiredSelect);
    expect(await validationMessage(demo.email)).toBe('');
  });

  test('requires at least six words for pain points and aspirations', async () => {
    await demo.painPoints.fill(shortText);
    await demo.aspirations.fill(shortText);

    expect(await validationMessage(demo.painPoints)).toBe(copy.painWordError);
    expect(await validationMessage(demo.aspirations)).toBe(copy.aspirationWordError);

    await demo.painPoints.fill(sixWords);
    await demo.aspirations.fill(sixWords);

    expect(await validationMessage(demo.painPoints)).toBe('');
    expect(await validationMessage(demo.aspirations)).toBe('');
  });

  test('rejects an invalid email before the form is posted', async () => {
    const lead = buildDemoLead();

    await demo.phone.fill(lead.phone);
    await demo.name.fill(lead.name);
    await demo.email.fill('not-an-email');
    await demo.submit();

    await expect(demo.page).toHaveURL(/\/demo\/?$/);
    await expect(demo.email).toBeFocused();
    expect(await validationMessage(demo.email)).toBe(copy.invalidEmail);
  });

  for (const phone of invalidPhones) {
    test(`rejects invalid Indian mobile ${phone}`, async () => {
      const lead = buildDemoLead();

      await demo.fillLead(lead);
      await demo.phone.fill(phone);
      await demo.submit();

      await expect(demo.phoneError).toHaveText(copy.invalidPhone);
      await expect(demo.phone).toBeFocused();
      await expect(demo.page).toHaveURL(/\/demo\/?$/);
      await expect(demo.submitButton).toHaveValue('Submit');
    });
  }

  test('requires email for a non-Indian number and does not render a missing error node', async () => {
    const lead = buildDemoLead();

    await demo.selectCountry('us');
    await expect(demo.dialCode).toHaveText('+1');

    await demo.phone.fill(lead.usPhone);
    await demo.name.fill(lead.name);
    await demo.childAge.selectOption(lead.childAge);
    await demo.painPoints.fill(lead.painPoints);
    await demo.aspirations.fill(lead.aspirations);
    await demo.selectPackage(lead.packageValue);
    await demo.executive.selectOption(lead.executiveValue);
    await demo.chooseOneToOneDemo();
    await demo.preferredDate.fill(lead.preferredDate);
    await demo.preferredTime.fill(lead.preferredTime);
    await demo.submit();

    await expect(demo.page).toHaveURL(/\/demo\/?$/);
    await expect(demo.email).toBeFocused();
    await expect(demo.submitButton).toHaveValue('Submit');
    await expect(demo.page.locator('#email-err')).toHaveCount(0);
  });

  test('selects child age, package, and executive and loads slots for the package', async () => {
    const lead = buildDemoLead();

    await demo.childAge.selectOption(lead.childAge);
    await expect(demo.childAge.locator('option:checked')).toHaveText(lead.childAgeLabel);

    const slots = await demo.selectPackage(lead.packageValue);

    expect(Array.isArray(slots.DemoSlots)).toBe(true);
    await expect(demo.packageChoice).toContainText(lead.packageLabel);
    await expect(demo.slot.locator('option').first()).toHaveText('Select Slot');

    await demo.executive.selectOption(lead.executiveValue);
    await expect(demo.executiveChoice).toContainText(lead.executiveLabel);
    await expect(demo.executive).toHaveValue(lead.executiveValue);
  });

  test('switches slot fields between group demo and 1-1 demo', async () => {
    await expect(demo.scheduleForm).toBeHidden();
    await expect(demo.slot).toBeEnabled();
    expect(await demo.slot.getAttribute('required')).not.toBeNull();

    await demo.chooseOneToOneDemo();

    expect(await demo.preferredDate.getAttribute('required')).not.toBeNull();
    expect(await demo.preferredTime.getAttribute('required')).not.toBeNull();
    expect(await demo.slot.getAttribute('required')).toBeNull();

    await demo.chooseGroupDemo();

    await expect(demo.scheduleForm).toBeHidden();
    await expect(demo.slotSection).toBeVisible();
    expect(await demo.slot.getAttribute('required')).not.toBeNull();
    expect(await demo.preferredDate.getAttribute('required')).toBeNull();
  });

  test('strips trailing digits from the parent name and trailing letters from the phone', async () => {
    await demo.name.fill('QA Parent123');
    await demo.name.dispatchEvent('keyup');
    await expect(demo.name).toHaveValue('QA Parent');

    await demo.phone.fill('98abc');
    await demo.phone.dispatchEvent('keyup');
    await expect(demo.phone).toHaveValue('98');
  });
});
