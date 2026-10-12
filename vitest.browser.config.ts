/// <reference types="vitest" />
import angular from '@analogjs/vite-plugin-angular';
import { playwright } from '@vitest/browser-playwright';

import { resolve } from 'path';
import { defineConfig } from 'vite';

/**
 * Vitest Browser Mode config for the ngx-vest-forms library.
 *
 * The default `test` target keeps running the jsdom suite for fast
 * feedback; this config runs `*.browser.spec.ts` in a real Chromium
 * via Playwright. Only specs that need DOM truth - focus/blur
 * sequencing, submit focus management, aria wiring - belong here.
 */
export default defineConfig({
  plugins: [angular()],
  resolve: {
    alias: {
      'ngx-vest-forms': resolve(
        __dirname,
        'packages/ngx-vest-forms/src/public-api.ts'
      ),
    },
    dedupe: ['vest', 'n4s', 'vest-utils', 'vestjs-runtime', 'context'],
  },
  optimizeDeps: {
    include: [
      'vest',
      'vest/memo',
      'vest/email',
      'n4s',
      'vest-utils',
      'vestjs-runtime',
      'context',
      'rxjs',
      '@analogjs/vitest-angular/setup-testbed',
      '@analogjs/vitest-angular/setup-snapshots',
    ],
  },
  test: {
    name: 'ngx-vest-forms-browser',
    globals: true,
    include: ['packages/ngx-vest-forms/src/**/*.browser.spec.ts'],
    setupFiles: ['packages/ngx-vest-forms/src/test-setup.browser.ts'],
    browser: {
      enabled: true,
      provider: playwright({
        launchOptions: {
          channel: process.env['PLAYWRIGHT_BROWSER_CHANNEL'],
        },
      }),
      headless: Boolean(process.env.CI),
      // Failure screenshots and traces land in .vitest/ (gitignored).
      screenshotFailures: true,
      traceView: Boolean(process.env.CI),
      locators: {
        errorFormat: 'aria',
      },
      instances: [
        {
          browser: 'chromium',
          viewport: { width: 1280, height: 720 },
        },
      ],
    },
  },
});
