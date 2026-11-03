const {
  test,
  expect,
  navigateToPendingSessionsIfAvailable,
} = require('./fixtures');

test('Teacher Login and Dashboard Navigation', async ({ page }) => {
  test.setTimeout(120000);

  // STEP 1: Open Teacher Login
  await page.goto(
    'https://stagelearn.classmonitor.com/teacher/login'
  );

  console.log('Step 1: Login page opened.');

  // STEP 2: Enter registered phone number
  const phoneInput = page.getByRole('textbox', {
    name: 'Enter Phone Number',
  });

  await expect(phoneInput).toBeVisible();

  await phoneInput.fill('8319779122');

  // STEP 3: Select OTP
  await page.getByText('OTP', {
    exact: true,
  }).click();

  // STEP 4: Click Login
  await page.getByRole('button', {
    name: 'Log In',
  }).click();

  // STEP 5: Verify OTP field
  const otpInput = page.getByRole('textbox', {
    name: 'Enter OTP',
  });

  await expect(otpInput).toBeVisible({
    timeout: 15000,
  });

  // STEP 6: Enter authorized test OTP
  await otpInput.fill('1111');

  // STEP 7: Submit OTP
  await page.getByRole('button', {
    name: 'Log In',
  }).click();

  // STEP 8: Verify Dashboard and Batches Link
  const batchesLink = page.getByRole('link', {
    name: /Batches/,
  }).first();

  await expect(batchesLink).toBeVisible({
    timeout: 20000,
  });

  console.log('Step 8: Dashboard loaded successfully.');

  // STEP 9: Open Batches
  await batchesLink.click();

  console.log('Step 9: Batches opened successfully.');


  // STEP 10: Handle the OK popup if it appears
  const okButton = page.getByRole('button', {
    name: 'OK',
    exact: true,
  });

  if (await okButton.isVisible().catch(() => false)) {
    await okButton.click();
    console.log('Batches popup dismissed.');
  }

  // STEP 11: Open the required course
  const courseLink = page.getByRole('link', {
    name: /Parent Toddler - 30 Sessions/,
  }).first();

  await expect(courseLink).toBeVisible({
    timeout: 15000,
  });

  await courseLink.click();

  console.log('Step 11: Course opened.');

  // STEP 12: Handle popup if it appears
  if (await okButton.isVisible().catch(() => false)) {
    await okButton.click();
    console.log('Course popup dismissed.');
  }



});
  