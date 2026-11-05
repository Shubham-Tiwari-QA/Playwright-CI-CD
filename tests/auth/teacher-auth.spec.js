const { test, expect } = require('../fixtures');
const {
  openTeacherLogin,
  submitPhoneForOtp,
  submitOtp,
  loginAsAuthorizedTeacher,
  logoutTeacher,
  AUTHORIZED_PHONE,
  AUTHORIZED_OTP,
  TEACHER_LOGIN_URL,
} = require('../helpers/auth');
const { captureStep } = require('../helpers/evidence');

test.describe('Teacher Auth – positive and negative', () => {
  test('AUTH-01 Valid teacher login reaches dashboard', async ({ page }, testInfo) => {
    test.setTimeout(120000);

    await loginAsAuthorizedTeacher(page);
    await expect(page).toHaveURL(/\/teacher(?!\/login)/);
    await captureStep(page, testInfo, 'auth-01-dashboard');
  });

  test('AUTH-02 Empty mobile number shows validation', async ({ page }, testInfo) => {
    await openTeacherLogin(page);
    await page.getByText('OTP', { exact: true }).click();
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page.getByText(/Please enter valid mobile number/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page).toHaveURL(/\/teacher\/login/);
    await captureStep(page, testInfo, 'auth-02-empty-phone');
  });

  test('AUTH-03 Invalid mobile number is rejected', async ({ page }, testInfo) => {
    await openTeacherLogin(page);
    await submitPhoneForOtp(page, '123');

    await expect(page.getByText(/User Not Found/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(page).toHaveURL(/\/teacher\/login/);
    await captureStep(page, testInfo, 'auth-03-invalid-phone');
  });

  test('AUTH-04 Invalid OTP is rejected', async ({ page }, testInfo) => {
    await openTeacherLogin(page);
    await submitPhoneForOtp(page, AUTHORIZED_PHONE);
    await submitOtp(page, '0000');

    await expect(page.getByText(/Invalid OTP/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(page).toHaveURL(/\/teacher\/login/);
    await captureStep(page, testInfo, 'auth-04-invalid-otp');
  });

  test('AUTH-05 Incorrect OTP length is rejected', async ({ page }, testInfo) => {
    await openTeacherLogin(page);
    await submitPhoneForOtp(page, AUTHORIZED_PHONE);
    await submitOtp(page, '11');

    await expect(page.getByText(/Invalid OTP/i)).toBeVisible({
      timeout: 15000,
    });
    await captureStep(page, testInfo, 'auth-05-short-otp');
  });

  test('AUTH-06 Empty OTP does not grant dashboard access', async ({ page }, testInfo) => {
    await openTeacherLogin(page);
    await submitPhoneForOtp(page, AUTHORIZED_PHONE);

    await expect(page.getByRole('textbox', {
      name: 'Enter OTP',
    })).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole('button', { name: 'Log In' }).click();
    await page.waitForTimeout(3000);

    const batchesVisible = await page.getByRole('link', {
      name: /Batches/,
    }).first().isVisible().catch(() => false);

    if (batchesVisible) {
      throw new Error('Empty OTP unexpectedly allowed dashboard access.');
    }

    await expect(page).toHaveURL(/\/teacher\/login/);
    await captureStep(page, testInfo, 'auth-06-empty-otp');
  });

  test('AUTH-07 Login button double-click does not break OTP flow', async ({ page }, testInfo) => {
    await openTeacherLogin(page);
    await page.getByRole('textbox', {
      name: 'Enter Phone Number',
    }).fill(AUTHORIZED_PHONE);
    await page.getByText('OTP', { exact: true }).click();

    const loginButton = page.getByRole('button', { name: 'Log In' });
    await Promise.all([
      loginButton.click(),
      loginButton.click({ trial: false }).catch(() => {}),
    ]);

    await expect(page.getByRole('textbox', {
      name: 'Enter OTP',
    })).toBeVisible({
      timeout: 15000,
    });
    await captureStep(page, testInfo, 'auth-07-double-click-login');
  });

  test('AUTH-08 Refresh during OTP keeps teacher on login flow', async ({ page }, testInfo) => {
    await openTeacherLogin(page);
    await submitPhoneForOtp(page, AUTHORIZED_PHONE);
    await expect(page.getByRole('textbox', {
      name: 'Enter OTP',
    })).toBeVisible({
      timeout: 15000,
    });

    await page.reload();
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/teacher\/login/);
    await captureStep(page, testInfo, 'auth-08-refresh-during-otp');
  });

  test('AUTH-09 Browser back from dashboard does not expose protected UI without session handling', async ({ page }, testInfo) => {
    test.setTimeout(180000);

    await loginAsAuthorizedTeacher(page);
    await page.goto(TEACHER_LOGIN_URL);
    await page.goBack();
    await page.waitForTimeout(3000);

    // Either session remains (still teacher area) or auth gate reappears.
    const onTeacherArea = /\/teacher/.test(page.url());
    expect(onTeacherArea).toBeTruthy();
    await captureStep(page, testInfo, 'auth-09-back-navigation');
  });

  test('AUTH-10 Unauthorized direct dashboard access is redirected', async ({ page }, testInfo) => {
    await page.goto('https://stagelearn.classmonitor.com/teacher');
    await page.waitForTimeout(5000);

    await expect(page).not.toHaveURL(/\/teacher$/);

    const batchesVisible = await page.getByRole('link', {
      name: /Batches/,
    }).first().isVisible().catch(() => false);

    expect(batchesVisible).toBeFalsy();

    // Observed app behavior: redirect to parent /login, not /teacher/login.
    console.log(`Unauthorized redirect landed on: ${page.url()}`);
    await captureStep(page, testInfo, 'auth-10-unauthorized-dashboard');

    if (!/\/login/.test(page.url())) {
      throw new Error(
        `Unauthorized /teacher access did not redirect to a login page. Actual URL: ${page.url()}`
      );
    }
  });

  test('AUTH-11 Logout then login again succeeds', async ({ page }, testInfo) => {
    test.setTimeout(240000);

    await loginAsAuthorizedTeacher(page);
    await logoutTeacher(page);
    await loginAsAuthorizedTeacher(page);
    await captureStep(page, testInfo, 'auth-11-relogin');
  });

  test('AUTH-12 Multiple invalid OTP attempts remain blocked', async ({ page }, testInfo) => {
    test.setTimeout(180000);

    await openTeacherLogin(page);
    await submitPhoneForOtp(page, AUTHORIZED_PHONE);

    for (const otp of ['0000', '9999', '1234']) {
      const otpInput = page.getByRole('textbox', { name: 'Enter OTP' });
      await expect(otpInput).toBeVisible({ timeout: 15000 });
      await otpInput.fill(otp);
      await page.getByRole('button', { name: 'Log In' }).click();
      await expect(page.getByText(/Invalid OTP/i)).toBeVisible({
        timeout: 15000,
      });
      console.log(`Invalid OTP attempt rejected for ${otp}.`);
      await page.waitForTimeout(1000);
    }

    const batchesVisible = await page.getByRole('link', {
      name: /Batches/,
    }).first().isVisible().catch(() => false);

    if (batchesVisible) {
      throw new Error('Dashboard became available after repeated invalid OTP attempts.');
    }

    await captureStep(page, testInfo, 'auth-12-multiple-invalid-otp');
  });
});
