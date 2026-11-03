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


// // STEP 13: Locate all Mark Attendance buttons
// const markAttendanceButtons = page.getByRole('button', {
//   name: 'Mark Attendance',
//   exact: true,
// });

// // Verify that at least one button exists
// await expect(markAttendanceButtons.first()).toBeVisible({
//   timeout: 15000,
// });

// const totalAttendanceButtons = await markAttendanceButtons.count();

// console.log(
//   `Found {totalAttendanceButtons} Mark Attendance buttons.`
// );

// // Select the first available session's attendance button
// await markAttendanceButtons.first().click();

// console.log('Step 13: Mark Attendance clicked.');
// // Debug: Check current page after clicking Mark Attendance
// await page.waitForTimeout(2000);

// console.log('Current URL:', page.url());

// console.log(
//   'Visible buttons:',
//   await page.getByRole('button').allTextContents()
// );

// console.log(
//   'Visible page text:',
//   (await page.locator('body').innerText()).slice(0, 3000)
// );

  
//   // STEP 14: Handle Okay popup
//   const okayButton = page.getByRole('button', {
//     name: 'Okay !',
//     exact: true
//   });

//   if (await okayButton.isVisible().catch(() => false)) {
//     await okayButton.scrollIntoViewIfNeeded();
//     await okayButton.click();

//     console.log('Step 14: Okay popup dismissed.');
//   }

//   // STEP 15: Handle OK popup

// if (await okButton.isVisible().catch(() => false)) {
//   await okButton.scrollIntoViewIfNeeded();
//   await okButton.click();
//   console.log('Step 15: OK popup dismissed.');
// }

//   // STEP 16: Open Student Attendance
//   const studentAttendanceButton = page.getByRole('button', {
//     name: 'Student Attendance',
//     exact: true
//   });

//   await expect(studentAttendanceButton).toBeVisible({
//     timeout: 15000
//   });

//   await studentAttendanceButton.scrollIntoViewIfNeeded();
//   await studentAttendanceButton.click();

//   console.log('Step 16: Student Attendance opened.');

//   // STEP 17: Verify Student Attendance Table
//   const studentTable = page.locator('#listStudents');

//   await expect(studentTable).toBeVisible({
//     timeout: 15000
//   });

//   console.log('Step 17: Student table visible.');

});
  