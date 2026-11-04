import { defineConfig, devices } from '@playwright/test';

const baseURL =
  process.env['PLAYWRIGHT_TEST_BASE_URL'] ?? 'http://localhost:4400';
const webServerPort = new URL(baseURL).port || '4400';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: '.',
  testMatch: ['**/pages/**/*.spec.ts', 'app/**/*.spec.ts'],
  /* Traces, screenshots and videos land in the repo-root test-results/ (gitignored); CI uploads it on failure. */
  outputDir: '../../test-results',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env['CI'],
  /* No retries locally, so a flaky test shows up instead of passing on a second attempt. CI keeps 2. */
  retries: process.env['CI'] ? 2 : 0,
  /* GitHub's ubuntu-latest runners have 4 vCPUs. The tests mostly wait on debounced validation, so 3 workers leave one vCPU for the server. */
  workers: process.env['CI'] ? 3 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  /* open: 'never' prevents auto-opening browser after test run */
  reporter: [
    ['html', { open: 'never', outputFolder: '../../playwright-report' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot only on failure */
    screenshot: 'only-on-failure',

    /* Video on first retry */
    video: 'retain-on-failure',

    /* Timeout for actions like click, fill, etc. (increased for async validations) */
    actionTimeout: 10000,

    /* Timeout for navigation actions (increased for debounced validations) */
    navigationTimeout: 15000,
  },

  /* Test timeout (increased to accommodate debounced validations and async operations) */
  timeout: 30000,

  /* Expect timeout for assertions (handles async validation completion) */
  expect: {
    timeout: 10000,
  },

  /*
   * Serve a static development build: no dev-server compile at start-up, and
   * isDevMode() stays on, so the ngx-vest-forms diagnostics still log.
   * @nx/playwright infers a dependency only from a bare `nx run project:target`,
   * so the port is appended only when it is not the default.
   */
  webServer: [
    {
      command:
        webServerPort === '4400'
          ? 'pnpm nx run examples:serve-static'
          : `pnpm nx run examples:serve-static --port=${webServerPort}`,
      port: Number(webServerPort),
      reuseExistingServer: !process.env['CI'],
      timeout: 120000,
      /* SIGTERM lets Nx stop `vite preview`; the default SIGKILL leaves it listening. */
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
    },
  ],

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],
});
