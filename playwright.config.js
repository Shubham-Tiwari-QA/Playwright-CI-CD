// @ts-check
const path = require('path');
const { defineConfig, devices } = require('@playwright/test');
const { loadEnvFile } = require('./utils/helpers');

loadEnvFile(path.join(__dirname, '.env'));

const ci = process.env.CI === 'true' || process.env.npm_lifecycle_event === 'test:ci';
const htmlReport = process.env.PLAYWRIGHT_HTML_REPORT || 'playwright-report';

module.exports = defineConfig({
  testDir: './tests',

  // Portal workflows need a long ceiling. Demo specs set a shorter timeout.
  timeout: 300000,

  fullyParallel: false,
  forbidOnly: !!ci,
  retries: ci ? 1 : 0,
  workers: 1,
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || 'test-results',

  reporter: [
    ['list'],
    ['html', { outputFolder: htmlReport, open: 'never' }],
    ['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT || path.join(htmlReport, 'results.json') }],
    ['junit', { outputFile: process.env.PLAYWRIGHT_JUNIT_OUTPUT || path.join(htmlReport, 'junit.xml') }],
  ],

  use: {
    headless: ci,

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
        headless: ci,
      },
    },
  ],
});
