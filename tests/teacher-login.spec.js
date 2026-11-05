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

async function captureStep(page, testInfo, name) {
  await testInfo.attach(name, {
    body: await page.screenshot({
      fullPage: true,
    }),
    contentType: 'image/png',
  });

  console.log(`Screenshot captured: ${name}.`);
}

async function dismissConfirmation(page) {
  const pendingSessionsMessage = page.getByText(
    /You have pending sessions remaining/i
  ).first();

  const confirmButton = page.getByRole('button', {
    name: /^(OK|Okay !)$/,
  });

  if (
    await confirmButton.isVisible().catch(() => false) &&
    !(await pendingSessionsMessage.isVisible().catch(() => false))
  ) {
    const message = (await page.locator('.sweet-alert').innerText().catch(() => ''))
      .replace(/\s+/g, ' ')
      .trim();

    console.log(`Confirmation popup: ${message}`);
    await confirmButton.click();
    await page.waitForTimeout(5000);

    return message;
  }

  return '';
}

function sessionCard(page, id) {
  return page.locator('.card-box').filter({
    has: page.locator(`a[href$="/teacher/session/${id}"]`),
  }).first();
}

test('Teacher Login and Dashboard Navigation', async ({ page }, testInfo) => {
  test.setTimeout(300000);

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
    await page.waitForTimeout(5000);
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
  await page.waitForTimeout(5000);

  if (batchId) {
    await expect(page).toHaveURL(new RegExp(`/teacher/batch/${batchId}`), {
      timeout: 15000,
    });

    console.log(`Batch ${batchId} is open.`);
  }

  console.log('Step 11: Course opened.');

  if (sessionId) {
    if (!batchId) {
      throw new Error('BATCH_ID must be set when SESSION_ID is set.');
    }

    const sessionLink = page.locator(
      `a[href$="/teacher/session/${sessionId}"]`
    ).first();

    await sessionLink.scrollIntoViewIfNeeded();

    await expect(sessionLink).toBeVisible({
      timeout: 15000,
    });

    const card = sessionCard(page, sessionId);

    await expect(card).toContainText(new RegExp(`Session Id:\\s*${sessionId}`));

    console.log(`Session ${sessionId} is visible.`);
    await page.waitForTimeout(5000);

    // Create Meeting (or verify the meeting already exists).
    const createMeeting = card.locator(
      'a[href*="create-meeting"], a[title="Create Google Meet Classroom"]'
    ).filter({
      hasText: 'Create Meeting',
    }).first();
    const joinClass = card.getByText('Join Class', {
      exact: true,
    });

    if (await createMeeting.isVisible().catch(() => false)) {
      const createMeetingClass = (await createMeeting.getAttribute('class')) || '';

      if (createMeetingClass.includes('disabled')) {
        const note = (await card.locator('small').innerText().catch(() => ''))
          .replace(/\s+/g, ' ')
          .trim();

        throw new Error(
          `Session ${sessionId}: Create Meeting is disabled by the application. ${note}`
        );
      }

      console.log(`Session ${sessionId}: clicking Create Meeting.`);
      await createMeeting.click();
      await page.waitForTimeout(5000);

      const meetingPopup = await dismissConfirmation(page);

      if (/fail|error|unable|not created/i.test(meetingPopup)) {
        throw new Error(
          `Session ${sessionId}: meeting creation was not confirmed. ${meetingPopup}`
        );
      }

      if (!page.url().includes(`/teacher/batch/${batchId}`)) {
        console.log(`Create Meeting opened ${page.url()}. Returning to the batch.`);
        await page.goto(
          `https://stagelearn.classmonitor.com/teacher/batch/${batchId}`,
          { waitUntil: 'domcontentloaded' }
        );
        await page.waitForTimeout(5000);
      }
    } else if (await joinClass.isVisible().catch(() => false)) {
      console.log(
        `Session ${sessionId}: meeting already exists. Create Meeting was not clicked again.`
      );
    } else {
      throw new Error(
        `Session ${sessionId}: Create Meeting button was not found.`
      );
    }

    await expect(sessionCard(page, sessionId).getByText('Join Class', {
      exact: true,
    })).toBeVisible({
      timeout: 15000,
    });

    console.log(`Session ${sessionId}: meeting is available. Join Class is visible.`);
    await captureStep(page, testInfo, `session-${sessionId}-meeting-created`);

    // Open the selected session and verify the batch/session context.
    await sessionCard(page, sessionId).locator(
      `a[href$="/teacher/session/${sessionId}"]`
    ).first().click();
    await page.waitForTimeout(5000);

    await expect(page).toHaveURL(
      new RegExp(`/teacher/session/${sessionId}`),
      { timeout: 15000 }
    );

    await expect(page.locator('#mainPageContainer')).toContainText(sessionId);
    await expect(page.locator(
      `a[href$="/teacher/batch/${batchId}"]`
    ).first()).toBeVisible();

    console.log(`Batch ${batchId} and session ${sessionId} are open.`);

    const meetLink = page.locator(
      'a[data-href*="meet.google.com"], a[href*="meet.google.com"]'
    ).first();

    await expect(meetLink).toBeVisible({
      timeout: 15000,
    });

    const meetUrl = (
      await meetLink.getAttribute('data-href')
    ) || (
      await meetLink.getAttribute('href')
    );

    console.log(`Session ${sessionId}: meeting link confirmed: ${meetUrl}`);
    await captureStep(page, testInfo, `session-${sessionId}-opened`);

    // Return to the batch card for attendance controls.
    await page.goto(
      `https://stagelearn.classmonitor.com/teacher/batch/${batchId}`,
      { waitUntil: 'domcontentloaded' }
    );
    await page.waitForTimeout(5000);

    const attendanceCard = sessionCard(page, sessionId);
    await attendanceCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(5000);

    // Teacher attendance must be completed before the app allows student attendance.
    const markTeacherButton = attendanceCard.locator(
      'button.markAttendance, button.btn-attendance'
    ).filter({
      hasText: /Mark Attendance|^Attendance$/,
    }).first();
    const markTeacherByText = attendanceCard.getByText('Mark Attendance', {
      exact: true,
    });
    const markedTeacherButton = attendanceCard.locator(
      'button.marked, button[title="Attendance marked"]'
    ).or(
      attendanceCard.getByRole('button', {
        name: /^Attendance\b/,
      })
    );

    await captureStep(page, testInfo, `session-${sessionId}-teacher-attendance`);

    if (
      await markTeacherByText.isVisible().catch(() => false) ||
      (
        await markTeacherButton.isVisible().catch(() => false) &&
        !(await markTeacherButton.evaluate((button) => button.classList.contains('marked')).catch(() => false))
      )
    ) {
      const teacherControl = (await markTeacherByText.isVisible().catch(() => false))
        ? markTeacherByText
        : markTeacherButton;

      console.log(
        `Session ${sessionId}: teacher attendance is pending. Marking through the application workflow.`
      );
      await teacherControl.click();
      await page.waitForTimeout(5000);

      const teacherPopup = await dismissConfirmation(page);

      if (/late|fail|error|unable/i.test(teacherPopup)) {
        throw new Error(
          `Session ${sessionId}: teacher attendance was rejected by the application. ${teacherPopup}`
        );
      }

      await expect(sessionCard(page, sessionId).locator(
        'button.marked, button[title="Attendance marked"]'
      ).or(
        sessionCard(page, sessionId).getByRole('button', {
          name: /^Attendance\b/,
        })
      )).toBeVisible({
        timeout: 15000,
      });

      console.log(
        `Session ${sessionId}: teacher attendance is marked. ${teacherPopup}`.trim()
      );
      await captureStep(
        page,
        testInfo,
        `session-${sessionId}-teacher-attendance-updated`
      );
    } else if (await markedTeacherButton.first().isVisible().catch(() => false)) {
      console.log(
        `Session ${sessionId}: teacher attendance is already marked. It was not changed.`
      );
    } else {
      throw new Error(
        `Session ${sessionId}: the application did not show a teacher attendance button. Teacher attendance was not marked.`
      );
    }

    // Student attendance:
    // 1) Prefer the batch-card Student Attendance button when the app shows it.
    // 2) Otherwise use the session-page End Class attendance modal.
    let attendanceModal = page.locator('#modalAddStudentAttendance');
    const batchStudentButton = sessionCard(page, sessionId).locator(
      'button.btnStudentAttendance'
    ).or(
      sessionCard(page, sessionId).getByRole('button', {
        name: /Student Attendance/,
      })
    );

    let blockedMessage = '';
    const onDialog = async (dialog) => {
      blockedMessage = dialog.message();
      await dialog.accept();
    };

    if (await batchStudentButton.first().isVisible().catch(() => false)) {
      const studentButtonText = (await batchStudentButton.first().innerText())
        .replace(/\s+/g, ' ')
        .trim();

      console.log(
        `Session ${sessionId}: opening student attendance from the batch card. Button text: ${studentButtonText}.`
      );

      page.on('dialog', onDialog);
      await batchStudentButton.first().click();
      await page.waitForTimeout(5000);
      page.off('dialog', onDialog);
    } else {
      console.log(
        `Session ${sessionId}: Student Attendance button is not on the batch card. Opening the session End Class attendance workflow.`
      );

      await page.goto(
        `https://stagelearn.classmonitor.com/teacher/session/${sessionId}`,
        { waitUntil: 'domcontentloaded' }
      );
      await page.waitForTimeout(5000);

      const endClassButton = page.locator(
        '#btnEndClasswithAttendance, button.endClass, a.endClass'
      ).first();

      await expect(endClassButton).toBeVisible({
        timeout: 15000,
      });

      page.on('dialog', onDialog);
      await endClassButton.click();
      await page.waitForTimeout(5000);
      page.off('dialog', onDialog);
    }

    if (blockedMessage) {
      throw new Error(
        `Session ${sessionId}: student attendance is not permitted. ${blockedMessage}`
      );
    }

    attendanceModal = page.locator('#modalAddStudentAttendance');

    await expect(attendanceModal).toBeVisible({
      timeout: 15000,
    });

    await expect(attendanceModal.locator('input[name="sessionId"]')).toHaveValue(
      sessionId
    );

    console.log(`Session ${sessionId}: student attendance section opened.`);
    await captureStep(page, testInfo, `session-${sessionId}-student-attendance`);

    const studentRows = attendanceModal.locator('tbody tr').filter({
      has: page.locator('input[type="radio"]'),
    });

    const studentCount = await studentRows.count();

    if (studentCount === 0) {
      throw new Error(
        `Session ${sessionId}: no students were listed in the attendance table.`
      );
    }

    // Batch-card "Student Attendance (x/y)" means attendance was already saved.
    // A default checked radio in the End Class modal alone is not proof of a saved mark.
    const batchStudentLabel = await sessionCard(page, sessionId)
      .locator('button.btnStudentAttendance')
      .innerText()
      .catch(() => '');
    const attendanceAlreadySaved = /\(\d+\s*\/\s*\d+\)/.test(batchStudentLabel);

    let attendanceChanged = false;

    for (let index = 0; index < studentCount; index += 1) {
      const row = studentRows.nth(index);
      const studentName = (await row.locator('td').nth(1).innerText())
        .replace(/\s+/g, ' ')
        .trim();
      const presentInput = row.locator('input[type="radio"][value="present"]');
      const absentInput = row.locator('input[type="radio"][value="absent"]');
      const presentSelected = await presentInput.isChecked();
      const absentSelected = await absentInput.isChecked();

      if (attendanceAlreadySaved && (presentSelected || absentSelected)) {
        console.log(
          `Session ${sessionId}: student ${studentName} attendance is already ${presentSelected ? 'present' : 'absent'}. It was not changed.`
        );
        continue;
      }

      if (!presentSelected) {
        try {
          console.log(
            `Session ${sessionId}: marking student ${studentName} present.`
          );
          await presentInput.check({
            force: true,
          });
          await page.waitForTimeout(5000);
          attendanceChanged = true;

          await expect(presentInput).toBeChecked();
          console.log(
            `Session ${sessionId}: student ${studentName} attendance status is present.`
          );
        } catch (error) {
          throw new Error(
            `Session ${sessionId}: student ${studentName} attendance failed. ${error.message}`
          );
        }
      } else {
        console.log(
          `Session ${sessionId}: student ${studentName} is already present. It was not changed.`
        );
      }
    }

    await captureStep(
      page,
      testInfo,
      `session-${sessionId}-student-attendance-status`
    );

    if (attendanceChanged) {
      const saveButton = attendanceModal.locator(
        'button.submitAtt'
      ).or(
        attendanceModal.getByRole('button', {
          name: /Save Attendance|Save/i,
        })
      );

      if (!(await saveButton.first().isVisible().catch(() => false))) {
        throw new Error(
          `Session ${sessionId}: student attendance controls were opened, but the application did not show a Save button in the Students Attendance modal. Clarification needed for this session state before ending the class.`
        );
      }

      console.log(`Session ${sessionId}: saving student attendance.`);
      await saveButton.first().click();
      await page.waitForTimeout(5000);

      const savePopup = await dismissConfirmation(page);
      const saveResult = page.locator(
        '#attendanceResultBody, #attendanceStdResult, .sweet-alert'
      );

      await expect(saveResult).toContainText(/successfully saved|success/i, {
        timeout: 15000,
      });

      console.log(
        `Session ${sessionId}: student attendance saved. ${savePopup}`.trim()
      );
      await captureStep(
        page,
        testInfo,
        `session-${sessionId}-student-attendance-saved`
      );
    } else {
      console.log(
        `Session ${sessionId}: every listed student already had attendance. Nothing was saved.`
      );
    }

    const closeAttendance = attendanceModal.locator(
      'button.close, button[data-dismiss="modal"]'
    ).first();

    if (await closeAttendance.isVisible().catch(() => false)) {
      await closeAttendance.click();
      await page.waitForTimeout(5000);
    }
  }

  // STEP 12: Handle popup if it appears.
  // The pending-sessions popup is dismissed by the fixture handler.
  if (
    await okButton.isVisible().catch(() => false) &&
    !(await pendingSessionsMessage.isVisible().catch(() => false))
  ) {
    await okButton.click();
    console.log('Course popup dismissed.');
    await page.waitForTimeout(5000);
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

  await page.waitForTimeout(5000);

  await expect(page).toHaveURL(/\/teacher\/login/, {
    timeout: 15000,
  });

  await expect(page.getByRole('textbox', {
    name: 'Enter Phone Number',
  })).toBeVisible();

  console.log('Step 12: Teacher logged out successfully.');
});
