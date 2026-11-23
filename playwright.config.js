
// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',

  // Global timeout: 5 minutes for deep portal workflows
  timeout: 300000,

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  // Keep reports even when the run fails so Jenkins can publish/archive them.
  reporter: [
    ['list'],
    ['html', {
      outputFolder: 'playwright-report',
      open: 'never',
    }],
    ['json', {
      outputFile: 'reports/playwright-results.json',
    }],
  ],

  use: {
    // Local interactive runs stay headed; Jenkins/CI forces headless.
    headless: process.env.CI === 'true',

    // Evidence for CI/local failures
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',

    viewport: { width: 1366, height: 768 },
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: process.env.CI === 'true',
      },
    },
  ],
});
