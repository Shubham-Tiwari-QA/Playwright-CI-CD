const { expect } = require('../fixtures');
const fs = require('fs');
const path = require('path');

const TEACHER_LOGIN_URL =
  'https://stagelearn.classmonitor.com/teacher/login';
const AUTHORIZED_PHONE = '8319779122';
const AUTHORIZED_OTP = '1111';

async function openTeacherLogin(page) {
  await page.goto(TEACHER_LOGIN_URL, {
    waitUntil: 'domcontentloaded',
  });
  await expect(
    page.getByRole('textbox', {
      name: 'Enter Phone Number',
    }),
    'Teacher login page did not show the phone number field'
  ).toBeVisible({
    timeout: 30000,
  });
}

async function collectLoginDiagnostics(page, label) {
  const diagnostics = {
    label,
    url: page.url(),
    title: await page.title().catch(() => ''),
    phoneVisible: await page
      .getByRole('textbox', { name: 'Enter Phone Number' })
      .isVisible()
      .catch(() => false),
    otpVisible: await page
      .getByRole('textbox', { name: 'Enter OTP' })
      .isVisible()
      .catch(() => false),
    otpRadioChecked: await page
      .getByRole('radio', { name: 'OTP' })
      .isChecked()
      .catch(() => false),
    captchaIframeCount: await page
      .locator(
        'iframe[src*="recaptcha"], iframe[title*="reCAPTCHA"], iframe[src*="captcha"]'
      )
      .count()
      .catch(() => 0),
    consoleErrors: [],
    failedRequests: [],
  };

  try {
    const dir = path.join(process.cwd(), 'test-results', 'login-diagnostics');
    fs.mkdirSync(dir, { recursive: true });
    const shot = path.join(dir, `${label}-${Date.now()}.png`);
    await page.screenshot({
      path: shot,
      fullPage: true,
    });
    diagnostics.screenshot = shot;
  } catch (err) {
    diagnostics.screenshotError = String(err);
  }

  return diagnostics;
}

async function submitPhoneForOtp(page, phone) {
  const consoleErrors = [];
  const failedRequests = [];

  const onConsole = (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  };
  const onRequestFailed = (request) => {
    failedRequests.push({
      url: request.url(),
      method: request.method(),
      errorText: request.failure()?.errorText || 'unknown',
    });
  };

  page.on('console', onConsole);
  page.on('requestfailed', onRequestFailed);

  try {
    const phoneInput = page.getByRole('textbox', {
      name: 'Enter Phone Number',
    });
    await expect(
      phoneInput,
      'Phone number field missing before OTP submit'
    ).toBeVisible();
    await phoneInput.fill(phone);

    const otpRadio = page.getByRole('radio', {
      name: 'OTP',
    });
    await expect(
      otpRadio,
      'OTP radio control is missing on teacher login'
    ).toBeVisible();

    // The visible OTP label overlays the input and intercepts pointer events.
    // Select via the associated label, then assert the radio role state.
    if (!(await otpRadio.isChecked())) {
      const otpLabel = page.locator('label[for="userLoginOtp"]');
      if (await otpLabel.count()) {
        await otpLabel.click();
      } else {
        await otpRadio.check({
          force: true,
        });
      }
    }

    await expect(
      otpRadio,
      'OTP radio was not selected before Log In'
    ).toBeChecked();

    const loginButton = page.getByRole('button', {
      name: 'Log In',
    });
    await expect(
      loginButton,
      'Log In button missing on teacher login'
    ).toBeVisible();

    await loginButton.click();

    const otpInput = page.getByRole('textbox', {
      name: 'Enter OTP',
    });

    try {
      await expect(
        otpInput,
        'OTP step did not appear after Log In'
      ).toBeVisible({
        timeout: 30000,
      });
    } catch (err) {
      const diagnostics = await collectLoginDiagnostics(page, 'otp-step-missing');
      diagnostics.consoleErrors = consoleErrors.slice(-20);
      diagnostics.failedRequests = failedRequests.slice(-20);

      throw new Error(
        [
          'Teacher login did not reach the OTP step after clicking Log In.',
          `URL: ${diagnostics.url}`,
          `Phone field still visible: ${diagnostics.phoneVisible}`,
          `OTP field visible: ${diagnostics.otpVisible}`,
          `OTP radio checked: ${diagnostics.otpRadioChecked}`,
          `reCAPTCHA iframe count: ${diagnostics.captchaIframeCount}`,
          `Console errors: ${diagnostics.consoleErrors.length}`,
          `Failed requests: ${diagnostics.failedRequests.length}`,
          diagnostics.captchaIframeCount > 0
            ? 'Likely blocker: reCAPTCHA/challenge is present and OTP UI was not shown. Use an authorized staging/test bypass if available; do not automate captcha solving.'
            : 'OTP UI never appeared. Inspect staging login API responses, validation messages, and the diagnostics screenshot.',
          diagnostics.screenshot
            ? `Diagnostics screenshot: ${diagnostics.screenshot}`
            : 'Diagnostics screenshot could not be saved.',
          String(err && err.message ? err.message : err),
        ].join('\n')
      );
    }
  } finally {
    page.off('console', onConsole);
    page.off('requestfailed', onRequestFailed);
  }
}

async function submitOtp(page, otp) {
  const otpInput = page.getByRole('textbox', {
    name: 'Enter OTP',
  });

  await expect(
    otpInput,
    'OTP textbox with accessible name "Enter OTP" is not visible'
  ).toBeVisible({
    timeout: 15000,
  });

  await otpInput.fill(otp);
  await page
    .getByRole('button', {
      name: 'Log In',
    })
    .click();
}

async function loginAsAuthorizedTeacher(page) {
  await openTeacherLogin(page);
  await submitPhoneForOtp(page, AUTHORIZED_PHONE);
  await submitOtp(page, AUTHORIZED_OTP);

  const batchesLink = page
    .getByRole('link', {
      name: /Batches/,
    })
    .first();

  await expect(
    batchesLink,
    'Login completed but Batches navigation link did not appear'
  ).toBeVisible({
    timeout: 45000,
  });

  console.log('Authorized teacher login succeeded.');

  return batchesLink;
}

async function logoutTeacher(page) {
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

  await logoutLink.evaluate((link) => {
    link.click();
  });

  await page.waitForTimeout(5000);

  await expect(page).toHaveURL(/\/teacher\/login/, {
    timeout: 15000,
  });

  await expect(
    page.getByRole('textbox', {
      name: 'Enter Phone Number',
    })
  ).toBeVisible();

  console.log('Teacher logged out successfully.');
}

module.exports = {
  TEACHER_LOGIN_URL,
  AUTHORIZED_PHONE,
  AUTHORIZED_OTP,
  openTeacherLogin,
  submitPhoneForOtp,
  submitOtp,
  loginAsAuthorizedTeacher,
  logoutTeacher,
};
