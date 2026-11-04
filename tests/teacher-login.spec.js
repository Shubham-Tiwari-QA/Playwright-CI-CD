const {
  test,
  expect,
} = require('./fixtures');

function readNumericId(name) {
  const value = process.env[name];

  if (!value) {
    return '';
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a numeric id.`);
  }

  return value;
}

const batchId = readNumericId('BATCH_ID');
const sessionId = readNumericId('SESSION_ID');

test('Teacher Login and Dashboard Navigation', async ({ page }) => {
  test.setTimeout(180000);

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
    timeout: 45000,
  });

  console.log('Step 8: Dashboard loaded successfully.');

  // STEP 9: Open Batches
  await batchesLink.click();

  console.log('Step 9: Batches opened successfully.');

  // STEP 10: Handle the OK popup if it appears.
  // The pending-sessions popup is dismissed by the fixture handler.
  const okButton = page.getByRole('button', {
    name: 'OK',
    exact: true,
  });

  const pendingSessionsMessage = page.getByText(
    /You have pending sessions remaining/i
  ).first();

  if (
    await okButton.isVisible().catch(() => false) &&
    !(await pendingSessionsMessage.isVisible().catch(() => false))
  ) {
    await okButton.click();
    console.log('Batches popup dismissed.');
  }

  // STEP 11: Open the required course
  const courseLink = batchId
    ? page.locator(`a[href$="/teacher/batch/${batchId}"]`).first()
    : page.getByRole('link', {
      name: /Parent Toddler - 30 Sessions/,
    }).first();

  await expect(courseLink).toBeVisible({
    timeout: 15000,
  });

  await courseLink.click();

  console.log('Step 11: Course opened.');

  if (sessionId) {
    const sessionLink = page.locator(
      `a[href$="/teacher/session/${sessionId}"]`
    ).first();

    await sessionLink.scrollIntoViewIfNeeded();

    await expect(sessionLink).toBeVisible({
      timeout: 15000,
    });

    console.log(`Session ${sessionId} is visible.`);
  }

  // STEP 12: Handle popup if it appears.
  // The pending-sessions popup is dismissed by the fixture handler.
  if (
    await okButton.isVisible().catch(() => false) &&
    !(await pendingSessionsMessage.isVisible().catch(() => false))
  ) {
    await okButton.click();
    console.log('Course popup dismissed.');
  }

  // Logout
  const profileMenu = page.getByRole('banner').getByRole('link', {
    name: 'CM LIve 33',
  });

  await profileMenu.click();

  const logoutLink = page.locator('#cmDrawer').getByRole('link', {
    name: /Logout/,
  });

  await expect(logoutLink).toBeAttached({
    timeout: 20000,
  });

  // The open profile menu is an off-screen drawer. Scrolling cannot bring
  // its Logout link into the viewport, so activate that same link directly.
  await logoutLink.evaluate((link) => {
    link.click();
  });

  await expect(page).toHaveURL(/\/teacher\/login/, {
    timeout: 15000,
  });

  await expect(page.getByRole('textbox', {
    name: 'Enter Phone Number',
  })).toBeVisible();

  console.log('Step 12: Teacher logged out successfully.');
});
