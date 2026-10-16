/// <reference types="vitest" />
import angular from '@analogjs/vite-plugin-angular';

import { resolve } from 'path';
import { defineConfig } from 'vite';
import { defaultExclude } from 'vitest/config';

export default defineConfig(({ mode }) => ({
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
      '@testing-library/jest-dom',
      '@testing-library/jest-dom/matchers',
      'css.escape',
      'picocolors',
      'aria-query',
      '@analogjs/vitest-angular/setup-testbed',
      '@analogjs/vitest-angular/setup-snapshots',
    ],
  },
  test: {
    globals: true,
    isolate: true,
    environment: 'jsdom',
    // *.browser.spec.ts belongs to `vitest.browser.config.ts` (Browser Mode).
    exclude: [...defaultExclude, '**/*.browser.spec.ts'],
    setupFiles: ['packages/ngx-vest-forms/src/test-setup.ts'],
    reporters: ['default'],
    // Shared by every project's `test` target. Each project sets its own
    // `coverageInclude`, `coverageExclude` and (for the library)
    // `coverageThresholds` in its project.json: the unit-test builder
    // concatenates `include` with this block, so a shared include list would
    // pull the examples app into the library's numbers.
    coverage: {
      provider: 'v8',
      reporter: ['html', 'lcov', 'text-summary'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
    // Sequence hooks to match Jest behavior
    sequence: {
      hooks: 'list',
    },
  },
  define: {
    'import.meta.vitest': mode !== 'production',
  },
}));
