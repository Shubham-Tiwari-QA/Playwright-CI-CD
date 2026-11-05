const { expect } = require('../fixtures');

const TEACHER_LOGIN_URL =
  'https://stagelearn.classmonitor.com/teacher/login';
const AUTHORIZED_PHONE = '8319779122';
const AUTHORIZED_OTP = '1111';

async function openTeacherLogin(page) {
  await page.goto(TEACHER_LOGIN_URL);
  await expect(page.getByRole('textbox', {
    name: 'Enter Phone Number',
  })).toBeVisible();
}

async function submitPhoneForOtp(page, phone) {
  const phoneInput = page.getByRole('textbox', {
    name: 'Enter Phone Number',
  });

  await phoneInput.fill(phone);
  await page.getByText('OTP', {
    exact: true,
  }).click();
  await page.getByRole('button', {
    name: 'Log In',
  }).click();
}

async function submitOtp(page, otp) {
  const otpInput = page.getByRole('textbox', {
    name: 'Enter OTP',
  });

  await expect(otpInput).toBeVisible({
    timeout: 15000,
  });

  await otpInput.fill(otp);
  await page.getByRole('button', {
    name: 'Log In',
  }).click();
}

async function loginAsAuthorizedTeacher(page) {
  await openTeacherLogin(page);
  await submitPhoneForOtp(page, AUTHORIZED_PHONE);
  await submitOtp(page, AUTHORIZED_OTP);

  const batchesLink = page.getByRole('link', {
    name: /Batches/,
  }).first();

  await expect(batchesLink).toBeVisible({
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

  await expect(page.getByRole('textbox', {
    name: 'Enter Phone Number',
  })).toBeVisible();

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
