import { defineConfig, devices } from '@playwright/test';

// Playwright configuration for running E2E tests against the examples app.
// - Uses a dedicated dev server on port 4201 to avoid conflicts with a running local server.
// - Tests use baseURL, so page.goto('/route') works consistently.

const PORT = Number(process.env.PORT ?? 4200);
const HOST = process.env.HOST ?? 'localhost';
const BASE_URL = process.env.BASE_URL ?? `http://${HOST}:${PORT}`;

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run start`,
    url: BASE_URL,
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120_000,
  },
});
