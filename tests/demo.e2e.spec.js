const { test, expect } = require('@playwright/test');
const { DemoPage } = require('../pages/DemoPage');
const { EnrollmentPage } = require('../pages/EnrollmentPage');
const { buildDemoLead } = require('../test-data/demoData');

test.describe('Demo enrollment @demo', () => {
  test.describe.configure({ timeout: 180000 });

  test('registers a demo and shows the existing-registration warning for that mobile', async ({ page }) => {
    const demo = new DemoPage(page);
    const enrollment = new EnrollmentPage(page);
    const lead = buildDemoLead();

    await demo.goto();
    await expect(demo.dialCode).toHaveText('+91');

    await completeLead(demo, lead);
    const created = await demo.submitRegistration();

    expect(created.status()).toBe(302);
    expect(created.headers().location).toContain('/demo');
    await enrollment.expectRegistered();

    await demo.enterPhoneForLookup(lead.phone);
    await expect(demo.duplicateWarning).toBeVisible();
    await expect(demo.phoneInfo).toContainText(lead.name);
    await expect(demo.phoneInfo).toContainText(lead.packageLabel);
    await expect(demo.submitButton).toBeEnabled();

    await completeLead(demo, lead);
    const duplicate = await demo.submitRegistration();

    expect(duplicate.status()).toBe(302);
    await enrollment.expectRegistered();
  });
});

async function completeLead(demo, lead) {
  await demo.phone.fill(lead.phone);
  await demo.name.fill(lead.name);
  await demo.email.fill(lead.email);
  await demo.childAge.selectOption(lead.childAge);
  await demo.painPoints.fill(lead.painPoints);
  await demo.aspirations.fill(lead.aspirations);

  const slots = await demo.selectPackage(lead.packageValue);

  await demo.executive.selectOption(lead.executiveValue);
  await demo.remarks.fill(lead.remarks);

  if (slots.DemoSlots.length > 0) {
    await expect(demo.slot.locator('option')).toHaveCount(slots.DemoSlots.length + 1);
    await demo.chooseGroupDemo();
    await demo.slot.selectOption(String(slots.DemoSlots[0].id));
    return;
  }

  await expect(demo.slot.locator('option')).toHaveText(['Select Slot']);
  await demo.chooseOneToOneDemo();
  await demo.preferredDate.fill(lead.preferredDate);
  await demo.preferredTime.fill(lead.preferredTime);
}
